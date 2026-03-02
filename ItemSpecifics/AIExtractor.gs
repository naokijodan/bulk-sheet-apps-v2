// AIExtractor.gs — OpenAI API呼び出し・プロンプト生成・レスポンス解析
// 既存のAI.gsには依存しない独立モジュール（IS_CONFIG が無い場合は安全なデフォルトにフォールバック）

// デフォルト設定（IS_CONFIG.AI が未定義のときに使用）
var AIEX_DEFAULTS_ = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.2,
  MAX_TOKENS: 1200,
  TIMEOUT: 60000,
  PARALLEL_REQUESTS: 5,
  SLEEP_BETWEEN_BATCHES: 1000,
  MAX_RETRIES: 2
};

function getAIConfig_() {
  try {
    if (typeof IS_CONFIG !== 'undefined' && IS_CONFIG && IS_CONFIG.AI) {
      var a = IS_CONFIG.AI;
      return {
        MODEL: a.MODEL || AIEX_DEFAULTS_.MODEL,
        TEMPERATURE: a.TEMPERATURE || AIEX_DEFAULTS_.TEMPERATURE,
        MAX_TOKENS: a.MAX_TOKENS || AIEX_DEFAULTS_.MAX_TOKENS,
        TIMEOUT: a.TIMEOUT || AIEX_DEFAULTS_.TIMEOUT,
        PARALLEL_REQUESTS: a.PARALLEL_REQUESTS || AIEX_DEFAULTS_.PARALLEL_REQUESTS,
        SLEEP_BETWEEN_BATCHES: a.SLEEP_BETWEEN_BATCHES || AIEX_DEFAULTS_.SLEEP_BETWEEN_BATCHES,
        MAX_RETRIES: a.MAX_RETRIES || AIEX_DEFAULTS_.MAX_RETRIES
      };
    }
  } catch (e) {}
  return AIEX_DEFAULTS_;
}

// 1. メイン抽出関数
function extractItemSpecifics(title, description, category, fields) {
  var out = { success: false, data: null, error: null };
  try {
    var prompt = buildExtractionPrompt_(title, description, category, fields);
    var responseText = callOpenAI_(prompt);
    var data = parseExtractionResponse_(responseText, fields);
    out.success = true;
    out.data = data;
    return out;
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
    return out;
  }
}

// 2. 日本語タグ → eBayカテゴリ名のマッピング
function mapTagToCategory(tag, categories) {
  var cleaned = null;
  try {
    if (!tag) return 'Unknown';
    if (!categories || !categories.length) return 'Unknown';

    // 応答はJSONで統一（callOpenAI_がjson_objectを強制するため）
    var prompt = '' +
      '以下の日本語商品カテゴリタグを、最も適切なeBayカテゴリに分類してください。\n' +
      'タグ: ' + String(tag) + '\n' +
      '選択肢: ' + categories.join(', ') + '\n' +
      '回答は次のJSON形式のみを返してください。\n' +
      '{"category": "<選択肢のいずれか または Unknown>"}';

    var text = callOpenAI_(prompt);
    // JSON/生文字列の双方に対応
    var obj = null;
    try { obj = JSON.parse(safeStripCodeFences_(text)); } catch (e) {}
    if (obj && obj.category) {
      cleaned = String(obj.category);
    } else {
      cleaned = (text || '').replace(/^[\s"']+|[\s"']+$/g, '');
    }

    if (!cleaned) return 'Unknown';

    // 大文字小文字を無視して選択肢に揃える
    var i;
    for (i = 0; i < categories.length; i++) {
      if (String(categories[i]).toLowerCase() === String(cleaned).toLowerCase()) {
        return categories[i];
      }
    }
    // 部分一致（過剰マッチ回避のため厳しめ）
    for (i = 0; i < categories.length; i++) {
      if (String(cleaned).toLowerCase().indexOf(String(categories[i]).toLowerCase()) !== -1) {
        return categories[i];
      }
    }
    return 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}

// 3. 複数行の一括抽出（並列 + リトライ）
function extractItemSpecificsBatch(items) {
  var results = [];
  try {
    if (!items || !items.length) return results;

    var cfg = getAIConfig_();
    var batchSize = cfg.PARALLEL_REQUESTS;
    if (!batchSize || batchSize < 1) batchSize = 1;

    var total = items.length;
    var outcomes = new Array(total); // 各indexに結果を詰める

    // 初回処理用キュー: インデックス配列
    var queue = [];
    var i;
    for (i = 0; i < total; i++) queue.push(i);

    // リトライ用パラメータ
    var maxRetries = cfg.MAX_RETRIES;
    var attempt = 0;

    while (queue.length > 0 && attempt <= maxRetries) {
      var nextQueue = [];
      for (i = 0; i < queue.length; i += batchSize) {
        var slice = queue.slice(i, i + batchSize);

        // プロンプトを作成
        var prompts = [];
        var meta = [];
        var j;
        for (j = 0; j < slice.length; j++) {
          var idx = slice[j];
          var it = items[idx];
          try {
            prompts.push(buildExtractionPrompt_(it.title, it.description, it.category, it.fields));
            meta.push(idx);
          } catch (e) {
            outcomes[idx] = { row: it && it.row, success: false, error: 'プロンプト生成エラー: ' + (e.message || e) };
          }
        }

        if (prompts.length === 0) {
          continue;
        }

        // 並列呼び出し
        var responses;
        try {
          responses = callOpenAIBatch_(prompts);
        } catch (e) {
          // バッチ全体が失敗した場合、個別リトライ
          for (j = 0; j < meta.length; j++) {
            nextQueue.push(meta[j]);
          }
          continue;
        }

        for (j = 0; j < responses.length; j++) {
          var resp = responses[j];
          var itemIndex = meta[j];
          var item = items[itemIndex];
          try {
            var code = resp.getResponseCode();
            var body = resp.getContentText();
            if (code !== 200) {
              // 次回に再試行
              nextQueue.push(itemIndex);
              continue;
            }
            var parsed;
            try { parsed = JSON.parse(body); } catch (e1) {
              nextQueue.push(itemIndex);
              continue;
            }
            var content = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
            if (!content) {
              nextQueue.push(itemIndex);
              continue;
            }
            var data = parseExtractionResponse_(content, item.fields);
            outcomes[itemIndex] = { row: item.row, success: true, data: data };
          } catch (e2) {
            nextQueue.push(itemIndex);
          }
        }

        // バッチ間スリープ
        try {
          if (cfg.SLEEP_BETWEEN_BATCHES && cfg.SLEEP_BETWEEN_BATCHES > 0) {
            Utilities.sleep(cfg.SLEEP_BETWEEN_BATCHES);
          }
        } catch (e) {}
      }

      // 次の試行に向けて
      queue = nextQueue;
      attempt++;
    }

    // 残存失敗をエラーとして埋める
    for (i = 0; i < items.length; i++) {
      if (!outcomes[i]) {
        outcomes[i] = { row: items[i].row, success: false, error: 'API error or parsing error' };
      }
    }

    // 配列に整形して返却（入力順を維持）
    for (i = 0; i < outcomes.length; i++) results.push(outcomes[i]);
    return results;
  } catch (e) {
    // 致命的エラー時は全件同一エラーで返す
    var k;
    for (k = 0; k < (items && items.length ? items.length : 0); k++) {
      results.push({ row: items[k].row, success: false, error: e && e.message ? e.message : String(e) });
    }
    return results;
  }
}

// ——— プライベート関数群 ———

// プロンプト構築
function buildExtractionPrompt_(title, description, category, fields) {
  var lines = [];
  lines.push('You are an expert eBay Item Specifics extractor.');
  lines.push('');
  lines.push('Category: ' + (category || 'Unknown'));
  lines.push('');
  lines.push('Extract the following Item Specifics from the title and description below.');
  lines.push('Return a JSON object with the field names as keys.');
  lines.push('');
  lines.push('Fields to extract:');

  var i;
  if (fields && fields.length) {
    for (i = 0; i < fields.length; i++) {
      var f = fields[i] || {};
      var name = f.name || '';
      var type = f.type || 'text';
      var notes = f.notes || '';
      var line = '- ' + name + ' (' + type + ')';
      if (notes) line += ' [Note: ' + notes + ']';
      lines.push(line);
    }
  }

  lines.push('');
  lines.push('Rules:');
  lines.push('- Return ONLY a valid JSON object, no markdown, no explanation.');
  lines.push('- For each field, extract the value from the title/description.');
  lines.push('- If a value cannot be determined with confidence, return null for that field.');
  lines.push('- For required fields where the value is unknown, use "Does not apply" (except Brand which should use "Unbranded" if unknown).');
  lines.push('- Normalize values to eBay\'s recommended values (e.g., use "Blue" instead of "Navy Blue").');
  lines.push('- Country of Origin = manufacturing country (NOT brand headquarters). Use full English name (e.g., "Japan", "Switzerland").');
  lines.push('- Units must be accurate (don\'t confuse mm and cm).');
  lines.push('- For boolean-like fields (With Papers, Graded), use "Yes" or "No".');
  lines.push('');
  lines.push('Title: ' + (title || ''));
  lines.push('Description: ' + (description || ''));

  return lines.join('\n');
}

// OpenAI 単発呼び出し
function callOpenAI_(prompt) {
  var docProps = PropertiesService.getDocumentProperties();
  var apiKey = docProps.getProperty('IS_OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。メニュー > Item Specifics > APIキー設定 から設定してください。');
  }

  var cfg = getAIConfig_();
  var model = cfg.MODEL;

  var payload = {
    model: model,
    messages: [
      { role: 'system', content: 'You are an expert eBay Item Specifics extractor. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: cfg.TEMPERATURE,
    max_tokens: cfg.MAX_TOKENS,
    response_format: { type: 'json_object' }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    timeout: cfg.TIMEOUT // Note: GASのfetchでは効かないが将来用
  };

  var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    var errMsg = 'OpenAI API error (HTTP ' + code + ')';
    try {
      var errObj = JSON.parse(body);
      errMsg += ': ' + (errObj.error && errObj.error.message || body);
    } catch (e) {}
    throw new Error(errMsg);
  }

  var result = JSON.parse(body);
  return result.choices[0].message.content;
}

// OpenAI 複数並列呼び出し
function callOpenAIBatch_(prompts) {
  var docProps = PropertiesService.getDocumentProperties();
  var apiKey = docProps.getProperty('IS_OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。メニュー > Item Specifics > APIキー設定 から設定してください。');
  }

  var cfg = getAIConfig_();
  var model = cfg.MODEL;

  var requests = [];
  var i;
  for (i = 0; i < prompts.length; i++) {
    requests.push({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert eBay Item Specifics extractor. Always respond with valid JSON only.' },
          { role: 'user', content: prompts[i] }
        ],
        temperature: cfg.TEMPERATURE,
        max_tokens: cfg.MAX_TOKENS,
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
  }

  return UrlFetchApp.fetchAll(requests);
}

// レスポンス解析
function parseExtractionResponse_(responseText, fields) {
  // 1. JSONをパース（```jsonフェンス対応, 生JSON対応）
  var text = safeStripCodeFences_(responseText);
  var obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    // 失敗時は空オブジェクト扱い
    obj = {};
  }

  var result = {};
  var i;
  for (i = 0; i < (fields ? fields.length : 0); i++) {
    var f = fields[i] || {};
    var key = f.name || '';
    if (!key) continue;

    // フィールド値取得（厳密一致 → 大文字小文字無視）
    var val;
    if (obj.hasOwnProperty(key)) {
      val = obj[key];
    } else {
      // 大文字/小文字を無視した一致
      var k;
      for (k in obj) {
        if (obj.hasOwnProperty(k) && String(k).toLowerCase() === String(key).toLowerCase()) {
          val = obj[k];
          break;
        }
      }
    }

    // 2. 各フィールドの値を検証・整形
    var normalized = normalizeFieldValue_(key, val);

    // 3/4. nullでない値のみ残す。required で null の場合は既定値
    if (normalized === null || typeof normalized === 'undefined' || normalized === '') {
      if (isRequiredField_(f)) {
        if (String(key).toLowerCase() === 'brand') {
          result[key] = 'Unbranded';
        } else {
          result[key] = 'Does not apply';
        }
      }
    } else {
      result[key] = normalized;
    }
  }

  return result;
}

// ——— ヘルパー ———

function isRequiredField_(fieldDef) {
  if (!fieldDef) return false;
  var t = String(fieldDef.type || '').toLowerCase();
  return t === 'required';
}

function normalizeFieldValue_(fieldName, value) {
  if (value === null || typeof value === 'undefined') return null;

  // 文字列正規化
  if (typeof value === 'string') {
    // 前後空白と引用符を除去
    var s = value.replace(/^[\s"']+|[\s"']+$/g, '');
    // 空文字は null とみなす
    if (!s) return null;

    // Does not apply の正規化
    if (/^does\s*not\s*apply$/i.test(s)) return 'Does not apply';

    // Unbranded の正規化
    if (/^unbranded$/i.test(s)) return 'Unbranded';

    // Yes/No の正規化（よくあるバリアント）
    if (/^(true|false|yes|no|y|n)$/i.test(s)) {
      return (/^(true|yes|y)$/i.test(s)) ? 'Yes' : 'No';
    }

    return s;
  }

  // 真偽値
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // 数値はそのまま文字列化（mm/cm混同はモデル側ルールでカバー）
  if (typeof value === 'number') {
    return String(value);
  }

  // 配列はカンマ区切り
  if (value && value.splice && value.join) {
    return value.join(', ');
  }

  // オブジェクトはJSONにフォールバック
  try { return JSON.stringify(value); } catch (e) { return null; }
}

function safeStripCodeFences_(text) {
  if (!text) return '';
  var s = String(text);
  // ```json ... ``` / ``` ... ``` の除去
  if (/^```/.test(s)) {
    s = s.replace(/^```json\s*/i, '');
    s = s.replace(/^```\s*/i, '');
    s = s.replace(/```\s*$/i, '');
  }
  return s;
}
