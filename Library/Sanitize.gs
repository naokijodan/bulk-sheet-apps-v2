/******************************************************
 * Sanitize.gs - 交通整理（ソーステキストのAI事前処理）
 *
 * J列・K列の日本語ソーステキストから商品情報だけを
 * AIで抽出し、配送文・売り手コメント等を除外する。
 * 元データはAU・AV列にバックアップする。
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  デフォルトプロンプト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ別フィールド定義
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var SANITIZE_FIELDS_ = {
  watch: [
    'ブランド', 'モデル名', '型番', 'ムーブメント',
    'ケース素材', 'ケースサイズ', '文字盤色', '風防',
    'ベルト素材', '防水', '表示方式', '腕周り',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  camera: [
    'ブランド', 'モデル名', 'タイプ', 'シリーズ',
    '色', '画素数', 'レンズマウント', '付属レンズ',
    'シャッター回数', 'バッテリー',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ]
};

/**
 * カテゴリのフィールド定義からデフォルトプロンプトを動的生成する
 * GPT_Promptsシートにプロンプトがない場合のフォールバック
 * @param {string} category - カテゴリキー（'watch', 'camera'等）
 * @return {string} プロンプト文字列
 */
function buildDefaultSanitizePrompt_(category) {
  var fields = SANITIZE_FIELDS_[category] || SANITIZE_FIELDS_['watch'];
  var charLimits = {
    '付属品': 25, 'コンディション': 25, '故障・不具合': 25,
    'モデル名': 20, '付属レンズ': 25, '色': 10
  };

  var lines = [
    'この商品はeBayに英語で出品します。',
    '翻訳AIに渡す前に、説明文から必要な情報を抜き出してください。',
    'タイトルは商品名の参考情報です。説明文と合わせて判断してください。',
    '',
    '説明文から以下の項目を埋めてください。',
    'ソースに情報がない項目はNAと記入してください。',
    '各項目の文字数上限を厳守してください。',
    ''
  ];

  for (var i = 0; i < fields.length; i++) {
    var limit = charLimits[fields[i]] || 15;
    lines.push(fields[i] + ': (' + limit + '文字以内)');
  }

  lines.push('');
  lines.push('ルール:');
  lines.push('1. 数値はソースのまま忠実に出力する。丸めない、変換しない。');
  lines.push('2. ソースにない情報は書かない。NAにする。');
  lines.push('3. 出力は日本語のまま。');
  lines.push('');
  lines.push('入力:');
  lines.push('タイトル（参考）: ${jpTitle}');
  lines.push('説明文: ${jpDesc}');

  return lines.join('\n');
}


/**
 * D列タグからカテゴリキーを判定する
 * @param {string} tag - D列のタグ文字列
 * @return {string|null} カテゴリキー（'watch', 'camera'等）。該当なしはnull
 */
function detectSanitizeCategory_(tag) {
  if (!tag) return null;
  var t = tag.toString().trim();
  if (!t) return null;

  var categories = CONFIG.SANITIZE_CATEGORIES;
  // 長いキーワードから順にマッチ（「腕時計」を「時計」より先に）
  var allEntries = [];
  for (var catKey in categories) {
    var kws = categories[catKey].keywords;
    for (var i = 0; i < kws.length; i++) {
      allEntries.push({ keyword: kws[i], catKey: catKey });
    }
  }
  allEntries.sort(function(a, b) { return b.keyword.length - a.keyword.length; });

  for (var i = 0; i < allEntries.length; i++) {
    if (t.indexOf(allEntries[i].keyword) !== -1) {
      return allEntries[i].catKey;
    }
  }
  return null;
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理実行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runSanitizeSelectedRows() {
  var ui = SpreadsheetApp.getUi();

  // 設定とシート取得
  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  // 選択行の取得
  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // J, K, AU, AV列を一括読み込み
  var maxCol = CONFIG.COLUMNS.JP_DESC_BACKUP; // AV列 = 48
  var allData = sheet.getRange(startRow, 1, numRows, maxCol).getValues();

  // 対象行を特定（D列タグでカテゴリ判定）
  var items = [];
  var skippedRows = [];  // スキップした行の情報
  for (var i = 0; i < numRows; i++) {
    var jpTitle = allData[i][CONFIG.COLUMNS.JP_TITLE - 1];
    var jpDesc  = allData[i][CONFIG.COLUMNS.JP_DESC - 1];
    var backupTitle = allData[i][CONFIG.COLUMNS.JP_TITLE_BACKUP - 1];

    // ソースが空の行はスキップ
    if (!jpTitle && !jpDesc) continue;

    // 既にバックアップがある行はスキップ（二重上書き防止）
    var backupDesc = allData[i][CONFIG.COLUMNS.JP_DESC_BACKUP - 1];
    if (backupDesc) continue;

    // D列タグからカテゴリ判定
    var tag = String(allData[i][CONFIG.COLUMNS.TAG - 1] || '');
    var category = detectSanitizeCategory_(tag);

    if (!category) {
      // カテゴリ不明 → スキップ
      skippedRows.push({ row: startRow + i, tag: tag || 'タグなし' });
      continue;
    }

    items.push({
      row: startRow + i,
      jpTitle: String(jpTitle || ''),
      jpDesc:  String(jpDesc || ''),
      tag: tag,
      category: category
    });
  }

  if (items.length === 0) {
    var skipMsg = '交通整理する行がありません。\n（ソースが空、バックアップ済み、またはタグ未対応の行はスキップされます）';
    if (skippedRows.length > 0) {
      skipMsg += '\n\nスキップ: ' + skippedRows.map(function(s) { return '行' + s.row + '(' + s.tag + ')'; }).join(', ');
    }
    showAlert(skipMsg, 'info');
    return;
  }

  // 開始通知（トースト）
  SpreadsheetApp.getActiveSpreadsheet().toast(items.length + '行の交通整理を開始します...', '🧹 交通整理', 3);

  // ===== Step 1: K列の元データをAV列にバックアップし、K列を空にする（J列はノータッチ） =====
  for (var i = 0; i < items.length; i++) {
    // AV列にK列のバックアップ
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP)
      .setValue(items[i].jpDesc);
    // K列を空にする
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC)
      .setValue('');
  }
  SpreadsheetApp.flush();

  // ===== Step 2: カテゴリ別プロンプト取得（キャッシュ） =====
  var promptCache = {};  // { category: promptTemplate }

  // ===== Step 3 & 4: バッチでAI呼び出し + 書き込み =====
  var BATCH_SIZE = 50;
  var successCount = 0;
  var errorCount = 0;
  var errorDetails = [];

  for (var batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
    var batchEnd = Math.min(batchStart + BATCH_SIZE, items.length);
    var batchItems = items.slice(batchStart, batchEnd);

    // バッチ分のリクエストを構築（カテゴリ別プロンプト）
    var requests = [];
    for (var j = 0; j < batchItems.length; j++) {
      var cat = batchItems[j].category;

      // プロンプトをキャッシュから取得、なければ生成
      if (!promptCache[cat]) {
        promptCache[cat] = buildDefaultSanitizePrompt_(cat);
      }

      var prompt = promptCache[cat]
        .replace('${jpTitle}', batchItems[j].jpTitle)
        .replace('${jpDesc}',  batchItems[j].jpDesc);
      requests.push(buildSanitizeRequest_(settings, prompt));
    }

    // API呼び出し
    var responses;
    try {
      responses = UrlFetchApp.fetchAll(requests);
    } catch (e) {
      // バッチ全体が失敗した場合、残りのバッチも中断
      for (var j = 0; j < batchItems.length; j++) {
        errorCount++;
        errorDetails.push('行' + batchItems[j].row + ': ' + e.message);
      }
      continue;
    }

    // レスポンス解析 & 書き込み
    for (var j = 0; j < responses.length; j++) {
      try {
        var result = parseSanitizeResponse_(settings.platform, responses[j]);
        if (!result.ok) {
          errorCount++;
          errorDetails.push('行' + batchItems[j].row + ': ' + result.error);
          continue;
        }

        var parsed = parseSanitizedFields_(result.content, batchItems[j].category);
        if (!parsed.description) {
          errorCount++;
          errorDetails.push('行' + batchItems[j].row + ': AIの出力を解析できませんでした');
          continue;
        }

        // K列のみ上書き（J列はノータッチ）
        sheet.getRange(batchItems[j].row, CONFIG.COLUMNS.JP_DESC)
          .setValue(parsed.description);
        successCount++;

      } catch (e) {
        errorCount++;
        errorDetails.push('行' + batchItems[j].row + ': ' + (e.message || String(e)));
      }
    }

    // 次のバッチまでスリープ（レート制限回避）
    if (batchEnd < items.length) {
      Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000);
    }
  }

  // 結果報告
  var message = '交通整理完了: ' + successCount + '件成功';
  if (errorCount > 0) {
    message += ', ' + errorCount + '件エラー\n\n' + errorDetails.join('\n');
  }
  if (skippedRows.length > 0) {
    message += '\n\nスキップ(' + skippedRows.length + '件): '
      + skippedRows.map(function(s) { return '行' + s.row + '(' + s.tag + ')'; }).join(', ');
  }
  showAlert(message, errorCount > 0 ? 'warning' : 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理を元に戻す
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function restoreSanitizeSelectedRows() {
  var ui = SpreadsheetApp.getUi();

  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // AV列を読み込み
  var backupData = sheet.getRange(startRow, CONFIG.COLUMNS.JP_DESC_BACKUP, numRows, 1).getValues();

  // バックアップがある行を特定
  var restoreItems = [];
  for (var i = 0; i < numRows; i++) {
    var backupDesc = backupData[i][0];
    if (backupDesc) {
      restoreItems.push({
        row: startRow + i,
        desc: backupDesc
      });
    }
  }

  if (restoreItems.length === 0) {
    showAlert('復元できる行がありません。\n（バックアップが存在する行のみ復元できます）', 'info');
    return;
  }

  // 確認ダイアログ
  var response = ui.alert(
    '交通整理を元に戻す',
    restoreItems.length + '行のソーステキストをバックアップから復元します。\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Step 1: K列を復元（J列はノータッチ）
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC)
      .setValue(restoreItems[i].desc);
  }
  SpreadsheetApp.flush();

  // Step 2: AV列をクリア
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP)
      .setValue('');
  }

  showAlert(restoreItems.length + '行を復元しました。', 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI APIリクエスト構築
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 交通整理用のHTTPリクエストを構築する
 * AI.gsのbuildRequestForProvider_と同じ構造だが、
 * createAIPromptを経由しない（sanitizeInputJP_を適用しない）
 */
function buildSanitizeRequest_(settings, prompt) {
  var platform = settings.platform;
  var model    = settings.model;
  var apiKey   = settings.apiKey;

  // ---------- OpenAI ----------
  if (platform === 'openai') {
    var isGpt5 = /^gpt-5/i.test(model || '');

    if (isGpt5) {
      return {
        url: "https://api.openai.com/v1/responses",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-5-mini',
          input: [{
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }],
          reasoning: { effort: "low" },
          max_output_tokens: 4096
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    } else {
      return {
        url: "https://api.openai.com/v1/chat/completions",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2000
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    }
  }

  // ---------- Claude ----------
  if (platform === 'claude') {
    return {
      url: "https://api.anthropic.com/v1/messages",
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": "GoogleAppsScript/1.0"
      },
      payload: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  // ---------- Gemini ----------
  if (platform === 'gemini') {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/models/" + (model || 'gemini-1.5-flash') + ":generateContent?key=" + apiKey,
      method: "post",
      contentType: "application/json",
      headers: { "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  return {
    url: "about:blank",
    method: "get",
    muteHttpExceptions: true
  };
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AIレスポンス解析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * AIレスポンスからテキストを抽出する
 * AI.gsのparseProviderResponse_と同じ構造だが、
 * parseAIResponseToFieldsを経由しない（sanitizeListingText_を適用しない）
 */
function parseSanitizeResponse_(platform, httpResp) {
  try {
    var code = httpResp.getResponseCode();
    var text = httpResp.getContentText('utf-8') || '';
    if (code !== 200) {
      return { ok: false, error: 'HTTP ' + code + ' ' + text.slice(0, 200) };
    }

    var data;
    try { data = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'JSON parse error' }; }

    var content = '';

    if (platform === 'openai') {
      if (typeof data.output_text === 'string' && data.output_text) {
        content = data.output_text;
      } else if (Array.isArray(data.output) && data.output.length > 0) {
        for (var oi = 0; oi < data.output.length; oi++) {
          var item = data.output[oi];
          if (item && item.content && item.content.length) {
            for (var pi = 0; pi < item.content.length; pi++) {
              var part = item.content[pi];
              if (part && part.type === 'output_text' && (part.text || part.string_value)) {
                content = part.text || part.string_value;
                break;
              }
            }
            if (content) break;
          }
        }
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content || '';
      }

    } else if (platform === 'claude') {
      if (data.content && data.content[0]) {
        content = data.content[0].text || '';
      }

    } else if (platform === 'gemini') {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        var p0 = data.candidates[0].content.parts && data.candidates[0].content.parts[0];
        content = (p0 && p0.text) || '';
      }
    }

    if (!content) {
      return { ok: false, error: 'AIからの応答が空です' };
    }

    return { ok: true, content: content };

  } catch (e) {
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI出力からタイトル・説明を抽出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function parseSanitizedFields_(content, category) {
  var result = { description: '' };

  // カテゴリ別フィールド定義を取得（デフォルトは時計）
  var fields = SANITIZE_FIELDS_[category || 'watch'] || SANITIZE_FIELDS_['watch'];

  var parts = [];
  for (var i = 0; i < fields.length; i++) {
    var re = new RegExp('^' + fields[i] + '[：:]\\s*(.+)$', 'm');
    var match = content.match(re);
    if (match) {
      var value = match[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      // NAや空の項目はスキップ
      if (value && !/^N\/?A$/i.test(value) && value !== '-' && value !== 'なし' && value !== '不明') {
        parts.push(fields[i] + ': ' + value);
      }
    }
  }

  // 説明: 全項目を連結
  result.description = parts.join(' ');

  // フォールバック: フォーマット形式でない場合は旧形式で試す
  if (!result.description) {
    var descMatch = content.match(/^説明[：:][\s]*([\s\S]*)$/m);
    if (descMatch) {
      result.description = descMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }
  }

  return result;
}
