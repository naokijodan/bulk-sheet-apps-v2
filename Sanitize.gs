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
  'あなたは商品情報の抽出専門家です。',
  '',
  '## タスク',
  '入力テキストから「商品そのものの情報」だけを抽出してください。',
  'それ以外は全て除外してください。',
  '',
  '## 残すもの（これだけ出力する）',
  '- ブランド名・モデル名・型番・リファレンス番号',
  '- ムーブメント（自動巻き、クォーツ、ソーラー等）',
  '- ケース素材・サイズ・厚み',
  '- 文字盤の色・デザイン',
  '- 風防の種類（サファイア、ミネラル等）',
  '- ベルト・ブレスレットの素材・状態',
  '- 防水性能',
  '- 表示方式（デジタル、アナログ）',
  '- 腕周りサイズ（数値はそのまま保持）',
  '- 付属品（箱、書類等）',
  '- コンディション全般（美品、傷あり、使用感あり等）',
  '- 故障・破損・不具合の詳細（そのまま正確に、省略せず保持）',
  '- 製造国・限定品等の特記事項',
  '',
  '## 除外するもの（出力に含めない）',
  '- 配送方法・送料・梱包方法',
  '- 返品・返金ポリシー',
  '- 出品者の感想・個人的エピソード',
  '- 購入時期・購入場所・購入価格',
  '- 値下げ交渉・即購入OK等の取引条件',
  '- 挨拶文',
  '- 真贋保証・マーケティング文言（「100%正規品」等）',
  '- 他の出品への誘導',
  '- プラットフォーム固有の指示',
  '',
  '## ルール',
  '1. 商品情報の表現はそのまま使う。言い換えない。',
  '2. 数値（サイズ、腕周り等）は一切変更しない。',
  '3. 故障・不具合の記述は絶対に省略しない。詳細をそのまま保持する。',
  '4. 情報を追加しない。ソースにないことは書かない。',
  '5. 出力は日本語のまま。翻訳しない。',
  '6. コンディションの記述は主観的表現でも残す。',
  '',
  '## 出力形式（必ずこの形式で出力すること）',
  'タイトル: (整理後のタイトル)',
  '説明: (整理後の説明)',
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

  // 確認ダイアログ
  var response = ui.alert(
    '交通整理',
    items.length + '行のソーステキストを交通整理します。\n元データはAU・AV列にバックアップされます。\n\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

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

  // ===== Step 3: AI呼び出し（並列） =====
  var requests = [];
  for (var i = 0; i < items.length; i++) {
    var prompt = promptTemplate
      .replace('${jpTitle}', items[i].jpTitle)
      .replace('${jpDesc}',  items[i].jpDesc);
    requests.push(buildSanitizeRequest_(settings, prompt));
  }

  var responses;
  try {
    responses = UrlFetchApp.fetchAll(requests);
  } catch (e) {
    showAlert('API呼び出しに失敗しました: ' + e.message, 'error');
    return;
  }

  // ===== Step 4: レスポンス解析 & 書き込み =====
  var successCount = 0;
  var errorCount = 0;
  var errorDetails = [];

  for (var i = 0; i < responses.length; i++) {
    try {
      var result = parseSanitizeResponse_(settings.platform, responses[i]);
      if (!result.ok) {
        errorCount++;
        errorDetails.push('行' + items[i].row + ': ' + result.error);
        continue;
      }

      var parsed = parseSanitizedFields_(result.content);
      if (!parsed.title && !parsed.description) {
        errorCount++;
        errorDetails.push('行' + items[i].row + ': AIの出力を解析できませんでした');
        continue;
      }

      // J列・K列を上書き
      var newTitle = parsed.title || items[i].jpTitle;
      var newDesc  = parsed.description || items[i].jpDesc;
      sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_TITLE, 1, 2)
        .setValues([[newTitle, newDesc]]);
      successCount++;

    } catch (e) {
      errorCount++;
      errorDetails.push('行' + items[i].row + ': ' + (e.message || String(e)));
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

  // 「タイトル: ...」形式を抽出
  var titleMatch = content.match(/^タイトル[：:][\s]*(.+)$/m);
  if (titleMatch) {
    result.title = titleMatch[1].trim();
  }

  // 「説明: ...」形式を抽出（複数行対応）
  var descMatch = content.match(/^説明[：:][\s]*([\s\S]*)$/m);
  if (descMatch) {
    result.description = descMatch[1].trim();
  }

  return result;
}
