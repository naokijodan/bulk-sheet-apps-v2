/******************************************************
 * AI.gs - AI API呼び出し関連
 * - プロンプト生成・応答解析
 * - トークンコスト計算
 * - AI API呼び出し (OpenAI, Claude, Gemini)
 * - 並列・リトライ処理
 ******************************************************/

function createAIPrompt(fullText, promptId) {
  // promptIdが指定されていない場合は、スクリプトプロパティから取得（後方互換性）
  if (!promptId) {
    var props = PropertiesService.getScriptProperties();
    promptId = props.getProperty('PROMPT_ID') || 'EBAY_FULL_LISTING_PROMPT';
  }

  var tmpl = getPromptContent(promptId);
  if (!tmpl) {
    tmpl = [
      "You are a listing generator. Return ONLY JSON with keys:",
      "Title (string), Description (string), ProductName (string), Category (string).",
      "Input:\n${fullText}"
    ].join("\n");
  }

  // 既存のプロンプトに新機能を動的に追加
  if (tmpl.indexOf('Condition') === -1 || tmpl.indexOf('EbayCategory') === -1) {
    var additionalInstructions = [
      "",
      "Additionally, also return these fields in the same JSON:",
      "- Condition (string): Product condition - MUST be exactly '新品', '中古', or 'エラー'",
      "  * '新品': 新品、未開封、未使用、MINT、NEW等の完全新品表現",
      "  * '中古': 中古、使用済み、開封済み、新品同様、美品等（準新品含む）",
      "  * 'エラー': 商品状態情報が不十分で判定不可の場合のみ",
      "- EbayCategory (string): Select the most appropriate category from:",
      "  Cell Phones & Smartphones, Video Games, Video Game Consoles, Cameras & Photo, Computer Components, Consumer Electronics, Audio Equipment, Clothing, Shoes, Handbags & Purses, Jewelry, Watches, Fashion Accessories, Home Decor, Kitchen & Dining, Garden & Outdoor, Tools & Hardware, Action Figures, Trading Cards, Model Kits, Other Toys, Sports Equipment, Outdoor Gear, Fitness Equipment, Books, Movies & TV, Music, Video Games Software, Skincare, Makeup, Health Supplements, Office Supplies, Industrial Equipment, Car Parts, Motorcycle Parts, String Instruments, Electronic Instruments, Other Instruments, Collectibles, Antiques, Art, Other"
    ].join("\n");

    // プロンプトの末尾に追加する方法に変更
    tmpl = tmpl + additionalInstructions;
  }

  return tmpl.replace('${fullText}', fullText);
}

function parseAIResponseToFields(content) {
  var result = {
    title: "",
    description: "",
    productName: "",
    category: "",
    condition: "",      // 新規追加
    ebayCategory: ""    // 新規追加
  };
  try {
    var text = String(content || '');
    var mFence = text.match(/```json([\s\S]*?)```/i);
    var jsonStr = mFence ? mFence[1] : null;
    if (!jsonStr) {
      var first = text.indexOf('{');
      var last  = text.lastIndexOf('}');
      if (first !== -1 && last !== -1 && last > first) jsonStr = text.substring(first, last+1);
    }
    if (jsonStr) {
      var obj = JSON.parse(jsonStr);
     result.title       = String(obj.Title || obj.title || "");
      result.description = String(obj.Description || obj.description || "");
      result.productName = String(obj.ProductName || obj.productName || "");
      result.category    = String(obj.Category || obj.category || "");
      result.condition   = String(obj.Condition || obj.condition || "");           // 新規追加
      result.ebayCategory = String(obj.EbayCategory || obj.ebayCategory || "");    // 新規追加
      return result;
    }
  } catch (_) {}

  function grab(label) {
  // 先頭に「(空白)(数字).(空白)」が任意で付いても良いようにする
  // 例: "1. Title: ..." や "Title: ..."
  var re = new RegExp('^(?:\\s*\\d+\\.?\\s*)?' + label + '\\s*:\\s*(.+)$', 'im');
  var m = String(content || '').match(re);
  return m ? m[1].trim() : "";
}

 result.title       = grab('Title');
  result.description = grab('Description');
  result.productName = grab('ProductName');
  result.category    = grab('Category');
  result.condition   = grab('Condition');           // 新規追加
  result.ebayCategory = grab('EbayCategory');       // 新規追加
  return result;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  料金見積（USD）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function estimateTokenCostUSD(platform, model, promptTokens, completionTokens) {
  try {
    var p = CONFIG.RATES.PLATFORMS[platform];
    if (!p) return 0;
    var m = p.models[model];
    if (!m) return 0;
    if (m.input || m.output) {
      var inUsd  = (promptTokens     / 1000) * (m.input  || m.combined || 0);
      var outUsd = (completionTokens / 1000) * (m.output || m.combined || 0);
      return inUsd + outUsd;
    }
    return ((promptTokens + completionTokens) / 1000) * (m.combined || 0);
  } catch (e) { return 0; }
}

function calculateTokenCostUSD(platform, model, totalPrompt, totalCompletion) {
  return estimateTokenCostUSD(platform, model, totalPrompt, totalCompletion);
}

/* 互換: 旧 calculateTokenCost → 新しいUSD見積のラッパー */
function calculateTokenCost(platform, model, tokens) {
  return estimateTokenCostUSD(platform, model, tokens||0, 0);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI 呼び出し（リトライ制御）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function callAIWithRetry(jpTitle, jpDesc, quantity, costYen, settings, retryCount, startMs) {
  if (typeof retryCount === 'undefined') retryCount = 0;
  if (typeof startMs === 'undefined') startMs = Date.now();
  if ((Date.now() - startMs) > CONFIG.API_TIMEOUT) {
    return { success:false, error: 'API_TIMEOUT 超過', tokens:0 };
  }
  try {
    var result = callAI(jpTitle, jpDesc, quantity, costYen, settings);
    return { success: true, data: result };
  } catch (error) {
    if (retryCount < CONFIG.MAX_RETRIES) {
      var base = 1500 + (retryCount * 500);
      var jitter = Math.floor(Math.random()*400);
      Utilities.sleep(base + jitter);
      return callAIWithRetry(jpTitle, jpDesc, quantity, costYen, settings, retryCount+1, startMs);
    }
    return { success: false, error: error.message };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI 呼び出し（各社）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function callAI(jpTitle, jpDesc, quantity, costYen, settings) {
  var fullText = 'Japanese Title: ' + jpTitle + '\nJapanese Description: ' + jpDesc;
  var prompt = createAIPrompt(fullText, settings.promptId);
  if (settings.platform === 'openai') return callOpenAI(prompt, settings);
  if (settings.platform === 'claude') return callClaude(prompt, settings);
  if (settings.platform === 'gemini') return callGemini(prompt, settings);
  throw new Error('サポート外プラットフォーム: ' + settings.platform);
}

function callOpenAI(prompt, settings) {
  var primary = settings.model || 'gpt-5-nano';
  var isGpt5 = /^gpt-5/i.test(primary || '');
  var usedModel = primary;
  var fallbackUsed = false;

  function invokeResponses(model) {
    var payload = {
      model: model,
      input: [{
        role: "user",
        content: [{ type: "input_text", text: prompt }]
      }],
      // GPT-5 は temperature 非対応。reasoning を抑え、十分な出力枠を確保
      reasoning: { effort: "low" },
      max_output_tokens: 4096
    };
    var options = {
      method: "POST",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + settings.apiKey, "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    return UrlFetchApp.fetch("https://api.openai.com/v1/responses", options);
  }

  function invokeChat(model) {
    var payload = {
      model: model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 1000
    };
    var options = {
      method: "POST",
      contentType: "application/json",
      headers: { "Authorization": "Bearer " + settings.apiKey, "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    return UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
  }

  // 実呼び出し
  var response = isGpt5 ? invokeResponses(usedModel) : invokeChat(usedModel);

  // フォールバック（最小限）
  if (response.getResponseCode() !== 200) {
    var fallbacks = isGpt5
      ? ['gpt-5-mini', 'gpt-5-nano-2025-08-07']   // GPT-5 系のみ
      : ['gpt-4o-mini', 'gpt-4o'];
    for (var i = 0; i < fallbacks.length; i++) {
      usedModel = fallbacks[i];
      try {
        response = /^gpt-5/i.test(usedModel) ? invokeResponses(usedModel) : invokeChat(usedModel);
        if (response.getResponseCode() === 200) { fallbackUsed = true; break; }
      } catch (_) {}
    }
  }

  if (response.getResponseCode() !== 200) {
    throw new Error('OpenAI API Error: ' + response.getResponseCode() + ' - ' + response.getContentText());
  }

  var text = response.getContentText();
  var data = {};
  try { data = JSON.parse(text); } catch (e) { throw new Error('Invalid JSON from OpenAI'); }

  // --- 出力テキスト抽出（Responses / Chat 両対応）---
  var content = '';
  var usage = data.usage || {};
  if (typeof data.output_text === 'string' && data.output_text) {
    content = data.output_text;
  } else if (Array.isArray(data.output) && data.output.length) {
    // Responses API: output[*].content[*].type === 'output_text'
    outer: for (var oi = 0; oi < data.output.length; oi++) {
      var item = data.output[oi];
      var arr = item && item.content;
      if (arr && arr.length) {
        for (var pi = 0; pi < arr.length; pi++) {
          var part = arr[pi];
          if (part && part.type === 'output_text' && (part.text || part.string_value)) {
            content = part.text || part.string_value;
            break outer;
          }
        }
      }
    }
  } else if (data.choices && data.choices[0] && data.choices[0].message) {
    // Chat Completions
    content = data.choices[0].message.content || '';
  } else {
    throw new Error('Invalid OpenAI response shape: ' + text.slice(0, 160));
  }

  // usage 正規化
  var prompt_tokens     = usage.input_tokens      || usage.prompt_tokens     || 0;
  var completion_tokens = usage.output_tokens     || usage.completion_tokens || 0;
  var total_tokens      = usage.total_tokens      || (prompt_tokens + completion_tokens);

  // あなたの既存パーサでフィールド抽出
  var fields  = parseAIResponseToFields(content);

  // Part 1のcallOpenAI()関数の最後の部分を修正
return {
  title:       fields.title,
  description: fields.description,
  productName: fields.productName,
  category:    fields.category,
  condition:   fields.condition,      // 追加
  ebayCategory: fields.ebayCategory,  // 追加
  usage: {
    prompt_tokens: prompt_tokens,
    completion_tokens: completion_tokens,
    total_tokens: total_tokens
  },
  model_used: usedModel,
  model_fallback: fallbackUsed
};
}



function callClaude(prompt, settings) {
  var payload = {
    model: settings.model,
    max_tokens: 1000,
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  };
  var options = {
    method: "POST",
    contentType: "application/json",
    headers: {
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "User-Agent": "GoogleAppsScript/1.0"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var response = UrlFetchApp.fetch("https://api.anthropic.com/v1/messages", options);
  if (response.getResponseCode() !== 200) throw new Error('Claude API Error: ' + response.getResponseCode() + ' - ' + response.getContentText());

  var data = JSON.parse(response.getContentText());
  if (!data.content || !data.content[0]) throw new Error("Invalid Claude API response format");

  var content = data.content[0].text || "";
  var fields  = parseAIResponseToFields(content);
  var usage   = data.usage || { input_tokens:0, output_tokens:0 };

  return {
    title:       fields.title,
    description: fields.description,
    productName: fields.productName,
    category:    fields.category,
    usage: {
      prompt_tokens: usage.input_tokens || 0,
      completion_tokens: usage.output_tokens || 0,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
    },
    model_used: settings.model,
    model_fallback: false
  };
}

function callGemini(prompt, settings) {
  var payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
  };
  var options = {
    method: "POST",
    contentType: "application/json",
    headers: { "User-Agent": "GoogleAppsScript/1.0" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + settings.model + ":generateContent?key=" + settings.apiKey;
  var response = UrlFetchApp.fetch(url, options);
  if (response.getResponseCode() !== 200) throw new Error('Gemini API Error: ' + response.getResponseCode() + ' - ' + response.getContentText());

  var data = JSON.parse(response.getContentText());
  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) throw new Error("Invalid Gemini API response format");

  var content = (data.candidates[0].content.parts[0] || {}).text || "";
  var fields  = parseAIResponseToFields(content);
  var usage   = data.usageMetadata || { promptTokenCount:0, candidatesTokenCount:0 };

  return {
    title:       fields.title,
    description: fields.description,
    productName: fields.productName,
    category:    fields.category,
    usage: {
      prompt_tokens: usage.promptTokenCount || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens: (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0)
    },
    model_used: settings.model,
    model_fallback: false
  };
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  並列AI処理用ヘルパー（統一版・完全版）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function buildRequestForProvider_(settings, item) {
  var fullText = 'Japanese Title: ' + item.jpTitle + '\nJapanese Description: ' + item.jpDesc;
  var prompt = createAIPrompt(fullText, settings.promptId);

  var platform = settings.platform;
  var model = settings.model;
  var apiKey = settings.apiKey;

  // ---------- OpenAI ----------
  if (platform === 'openai') {
    var isGpt5 = /^gpt-5/i.test(model || '');

    if (isGpt5) {
      // GPT-5系 → Responses API
      var payload_resp = {
        model: model || 'gpt-5-mini',
        input: [{
          role: "user",
          content: [{ type: "input_text", text: prompt }]
        }],
        // GPT-5: temperatureは送らない
        reasoning: { effort: "low" },      // 推論トークンを抑制
        max_output_tokens: 4096            // 本文まで出力させる
      };
      return {
        url: "https://api.openai.com/v1/responses",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify(payload_resp),
        muteHttpExceptions: true,
        followRedirects: true
      };
    } else {
      // GPT-4o/4系 → Chat Completions
      var payload_oa = {
        model: model || 'gpt-4o-mini',
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      };
      return {
        url: "https://api.openai.com/v1/chat/completions",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify(payload_oa),
        muteHttpExceptions: true,
        followRedirects: true
      };
    }
  }

  // ---------- Claude ----------
  if (platform === 'claude') {
    var payload_cl = {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }]
    };
    return {
      url: "https://api.anthropic.com/v1/messages",
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": "GoogleAppsScript/1.0"
      },
      payload: JSON.stringify(payload_cl),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  // ---------- Gemini ----------
  if (platform === 'gemini') {
    var payload_ge = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
    };
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/models/" + (model || 'gemini-1.5-flash') + ":generateContent?key=" + apiKey,
      method: "post",
      contentType: "application/json",
      headers: { "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify(payload_ge),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  // ---------- Unknown platform ----------
  return {
    url: "about:blank",
    method: "get",
    muteHttpExceptions: true
  };
}


function parseProviderResponse_(platform, httpResp) {
  try {
    var code = httpResp.getResponseCode();
    var text = httpResp.getContentText('utf-8') || '';
    if (code !== 200) return { ok:false, error:'HTTP ' + code + ' ' + text.slice(0,200) };

    var data; try { data = JSON.parse(text); }
    catch (e) { return { ok:false, error:'JSON parse error: ' + (e && e.message ? e.message : e) }; }

    var content = '';
    var inTok = 0, outTok = 0;

    if (platform === 'openai') {
  var u = data.usage || {};

  // 1) トップレベルの output_text があれば最優先
  if (typeof data.output_text === 'string' && data.output_text) {
    content = data.output_text;

  // 2) output 配列を走査して、message/content 内の output_text を探す
  } else if (Array.isArray(data.output) && data.output.length > 0) {
    var found = '';
    for (var oi = 0; oi < data.output.length; oi++) {
      var item = data.output[oi];

      // item.content が配列なら、その中から type==="output_text" を優先
      if (item && item.content && item.content.length) {
        for (var pi = 0; pi < item.content.length; pi++) {
          var part = item.content[pi];
          if (part && part.type === 'output_text' && (part.text || part.string_value)) {
            found = part.text || part.string_value;
            break;
          }
        }
        if (found) break;
      }
    }
    content = found || '';

    // 3) 旧 Chat Completions (gpt-4 系)
  } else if (data.choices && data.choices[0] && data.choices[0].message) {
    content = data.choices[0].message.content || '';

  } else {
    return { ok:false, error:'Invalid OpenAI response: ' + (text ? text.slice(0,140) : '') };
  }

  // usage はどちらのAPIでもここで正規化
  inTok  = u.input_tokens      || u.prompt_tokens     || 0;
  outTok = u.output_tokens     || u.completion_tokens || 0;
    } else if (platform === 'gemini') {
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content)
        return { ok:false, error:'Invalid Gemini response' };
      var p0 = data.candidates[0].content.parts && data.candidates[0].content.parts[0];
      content = (p0 && p0.text) || '';
      var ug = data.usageMetadata || {};
      inTok  = ug.promptTokenCount     || 0;
      outTok = ug.candidatesTokenCount || 0;

    } else {
      return { ok:false, error:'Unsupported platform: ' + platform };
    }

    var fields = parseAIResponseToFields(content);
    return { ok:true, fields: fields, usage: { in: inTok, out: outTok } };

  } catch (e) {
    return { ok:false, error:(e && e.message) ? e.message : String(e) };
  }
}

function callAI_parallel_(items, settings) {
  try {
    if (!items || !items.length) return { results: [] };

    // APIリクエストの準備
    var reqs = [];
    for (var i = 0; i < items.length; i++) {
      reqs.push(buildRequestForProvider_(settings, items[i]));
    }

    // 並列リクエスト実行
    var resps = UrlFetchApp.fetchAll(reqs);

    // 結果処理
    var out = [];
    for (var j = 0; j < resps.length; j++) {
      var parsed = parseProviderResponse_(settings.platform, resps[j]);
      if (parsed.ok) {
        out.push({
          ok: true,
          row: items[j].row,
          fields: parsed.fields,
          usage: parsed.usage
        });
      } else {
        out.push({
          ok: false,
          row: items[j].row,
          error: parsed.error
        });
      }
    }

    return { results: out };

  } catch (e) {
    // 全体エラー時 → 各行にエラーを返す
    var errs = [];
    for (var k = 0; k < (items ? items.length : 0); k++) {
      errs.push({
        ok: false,
        row: items[k].row,
        error: (e && e.message) ? e.message : String(e)
      });
    }
    return { results: errs };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自動再試行機能付き翻訳処理
  🔹 50行まとめて並列APIコールは維持
  🔹 エラー行のみを選択的に再試行
  🔹 翻訳結果の自動検証
  🔹 最大3回まで再試行
  🔹 シートへの書き込みは呼び出し元で実行
  🔹 処理状況をコンソールに表示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function executeTranslationWithRetry_(items, settings, sheet, conditionMode, maxRetries) {
  if (!maxRetries) maxRetries = 3;

  var allSucceeded = [];
  var remainingItems = items.slice(); // 最初は全件
  var retryCount = 0;
  var retryLog = {}; // 行番号 -> エラー詳細のマップ
  var retryDetails = []; // リトライした行の詳細情報

  console.log('🔄 翻訳処理開始: ' + items.length + '件');

  while (remainingItems.length > 0 && retryCount < maxRetries) {
    if (retryCount === 0) {
      console.log('  📤 初回API呼び出し: ' + remainingItems.length + '件');
    } else {
      console.log('  🔁 再試行 ' + retryCount + '回目: ' + remainingItems.length + '件');
    }

    // 🔹 重要: 残りの件数をまとめて1回のAPIコールで並列実行
    var batchResult = callAI_parallel_(remainingItems, settings);

    var succeeded = [];
    var failed = [];

    for (var i = 0; i < batchResult.results.length; i++) {
      var res = batchResult.results[i];
      var item = remainingItems[i];

      if (res.ok) {
        // 翻訳成功 -> そのまま成功リストに追加
        succeeded.push({
          ok: true,
          row: res.row,
          fields: res.fields,
          usage: res.usage,
          retryCount: retryCount
        });
        if (retryCount > 0) {
          console.log('  ✅ 行' + res.row + ': 再試行' + retryCount + '回目で成功');
          retryDetails.push({
            row: res.row,
            attempts: retryCount + 1,
            status: '成功'
          });
        }
      } else {
        // AI APIエラー -> 再試行対象
        failed.push(item);
        retryLog[res.row] = {
          attempt: retryCount + 1,
          errors: ['API呼び出しエラー: ' + (res.error || '不明なエラー')]
        };
        console.error('  ❌ 行' + res.row + ': API失敗(試行' + (retryCount + 1) + '): ' + (res.error || '不明なエラー'));
      }
    }

    console.log('  ➡️ 成功: ' + succeeded.length + '件, 失敗: ' + failed.length + '件');

    allSucceeded = allSucceeded.concat(succeeded);
    remainingItems = failed;
    retryCount++;

    // 再試行が必要な場合は待機
    if (remainingItems.length > 0 && retryCount < maxRetries) {
      var waitTime = Math.pow(2, retryCount) * 1000; // 指数バックオフ: 2秒, 4秒, 8秒
      console.log('  ⏳ 再試行待機中... ' + (waitTime / 1000) + '秒');
      Utilities.sleep(waitTime);
    }
  }

  // 最終的に失敗した行をエラーとして記録
  var allFailed = [];
  for (var j = 0; j < remainingItems.length; j++) {
    var failedItem = remainingItems[j];
    var errorDetail = retryLog[failedItem.row] || { errors: ['不明なエラー'] };
    allFailed.push({
      ok: false,
      row: failedItem.row,
      error: '最大再試行回数到達 (' + maxRetries + '回): ' + errorDetail.errors.join(', '),
      retryLog: errorDetail
    });
    retryDetails.push({
      row: failedItem.row,
      attempts: maxRetries,
      status: '失敗'
    });
    console.error('  💀 行' + failedItem.row + ': ' + maxRetries + '回試行後も失敗');
  }

  console.log('✅ 翻訳処理完了: 成功' + allSucceeded.length + '件, 失敗' + allFailed.length + '件');

  return {
    results: allSucceeded.concat(allFailed),
    retryLog: retryLog,
    retryDetails: retryDetails
  };
}
