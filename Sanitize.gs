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
var SANITIZE_PROMPT_ID_ = 'SANITIZE_SOURCE';

var SANITIZE_PROMPT_DEFAULT_ = [
  '入力テキストから不要な文を削除してください。',
  '商品そのものに関する文だけを残し、それ以外の文を削除してください。',
  '',
  '## 削除する文',
  '以下に該当する文は丸ごと削除してください。',
  '- 配送・送料・梱包に関する文（「らくらくメルカリ便で発送」「送料無料」「丁寧に梱包」等）',
  '- 返品・返金・ノークレームに関する文',
  '- 挨拶（「ご覧いただきありがとうございます」「よろしくお願いします」等）',
  '- 値下げ交渉・購入条件に関する文（「即購入OK」「コメントなし購入OK」等）',
  '- 出品者の個人的な感想やエピソード（「気に入っていましたが」「大切に使っていました」等）',
  '- 購入時期・購入場所・購入価格に関する文',
  '- 真贋保証・マーケティング文言（「100%正規品」「本物です」「安心の真贋保証」等）',
  '- 他の出品への誘導（「他にも出品しています」等）',
  '- プラットフォーム固有の指示（「プロフ必読」等）',
  '- 完璧を求める方への注意書き（「完璧をお求めの方はお控えください」「神経質な方はご遠慮ください」等）',
  '',
  '## 絶対に残す文',
  '- 故障・破損・不具合に関する文は絶対に削除しない',
  '- コンディション（傷、汚れ、使用感等）に関する文は削除しない',
  '- スペック・仕様に関する文は削除しない',
  '',
  '## ルール',
  '1. 残す文はそのまま出力する。言い換え・要約・構造化しない。',
  '2. 項目名やラベル（「ブランド名:」等）を追加しない。',
  '3. ソースにない情報を追加しない。「記載なし」「未記載」「情報なし」等を書かない。',
  '4. 数値は一切変更しない。',
  '5. 出力は日本語のまま。翻訳しない。',
  '',
  '## 出力形式',
  'タイトル: (入力タイトルから不要部分を削除したもの)',
  '説明: (入力説明から不要な文を削除したもの)',
  '',
  '## 入力',
  'タイトル: ${jpTitle}',
  '説明: ${jpDesc}'
].join('\n');


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

  // 対象行を特定
  var items = [];
  for (var i = 0; i < numRows; i++) {
    var jpTitle = allData[i][CONFIG.COLUMNS.JP_TITLE - 1];
    var jpDesc  = allData[i][CONFIG.COLUMNS.JP_DESC - 1];
    var backupTitle = allData[i][CONFIG.COLUMNS.JP_TITLE_BACKUP - 1];

    // ソースが空の行はスキップ
    if (!jpTitle && !jpDesc) continue;

    // 既にバックアップがある行はスキップ（二重上書き防止）
    var backupDesc = allData[i][CONFIG.COLUMNS.JP_DESC_BACKUP - 1];
    if (backupTitle || backupDesc) continue;

    items.push({
      row: startRow + i,
      jpTitle: String(jpTitle || ''),
      jpDesc:  String(jpDesc || '')
    });
  }

  if (items.length === 0) {
    showAlert('交通整理する行がありません。\n（ソースが空、または既にバックアップがある行はスキップされます）', 'info');
    return;
  }

  // 開始通知（トースト）
  SpreadsheetApp.getActiveSpreadsheet().toast(items.length + '行の交通整理を開始します...', '🧹 交通整理', 3);

  // ===== Step 1: バックアップ（最優先） =====
  for (var i = 0; i < items.length; i++) {
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_TITLE_BACKUP, 1, 2)
      .setValues([[items[i].jpTitle, items[i].jpDesc]]);
  }
  SpreadsheetApp.flush(); // バックアップを確実に書き込む

  // ===== Step 2: プロンプト取得 =====
  var promptTemplate = getPromptContent(SANITIZE_PROMPT_ID_);
  if (!promptTemplate) {
    promptTemplate = SANITIZE_PROMPT_DEFAULT_;
  }

  // ===== Step 3 & 4: バッチでAI呼び出し + 書き込み =====
  var BATCH_SIZE = 50;
  var successCount = 0;
  var errorCount = 0;
  var errorDetails = [];

  for (var batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
    var batchEnd = Math.min(batchStart + BATCH_SIZE, items.length);
    var batchItems = items.slice(batchStart, batchEnd);

    // バッチ分のリクエストを構築
    var requests = [];
    for (var j = 0; j < batchItems.length; j++) {
      var prompt = promptTemplate
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

        var parsed = parseSanitizedFields_(result.content);
        if (!parsed.title && !parsed.description) {
          errorCount++;
          errorDetails.push('行' + batchItems[j].row + ': AIの出力を解析できませんでした');
          continue;
        }

        // J列・K列を上書き
        var newTitle = parsed.title || batchItems[j].jpTitle;
        var newDesc  = parsed.description || batchItems[j].jpDesc;
        sheet.getRange(batchItems[j].row, CONFIG.COLUMNS.JP_TITLE, 1, 2)
          .setValues([[newTitle, newDesc]]);
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

  // AU・AV列を読み込み
  var backupData = sheet.getRange(startRow, CONFIG.COLUMNS.JP_TITLE_BACKUP, numRows, 2).getValues();

  // バックアップがある行を特定
  var restoreItems = [];
  for (var i = 0; i < numRows; i++) {
    var backupTitle = backupData[i][0];
    var backupDesc  = backupData[i][1];
    if (backupTitle || backupDesc) {
      restoreItems.push({
        row: startRow + i,
        title: backupTitle,
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

  // Step 1: J・K列を全行復元
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_TITLE, 1, 2)
      .setValues([[restoreItems[i].title, restoreItems[i].desc]]);
  }
  SpreadsheetApp.flush(); // 復元を確実に書き込む

  // Step 2: AU・AV列を全行クリア
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_TITLE_BACKUP, 1, 2)
      .setValues([['', '']]);
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
function parseSanitizedFields_(content) {
  var result = { title: '', description: '' };

  // 「タイトル: ...」形式を抽出（説明:の手前まで）
  var titleMatch = content.match(/^タイトル[：:][\s]*([\s\S]*?)(?=\n説明[：:])/m);
  if (titleMatch) {
    result.title = titleMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  // 「説明: ...」形式を抽出（末尾まで）
  var descMatch = content.match(/^説明[：:][\s]*([\s\S]*)$/m);
  if (descMatch) {
    result.description = descMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  return result;
}
