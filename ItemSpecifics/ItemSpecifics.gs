/**
 * ItemSpecifics.gs — メインスクリプト
 * Item Specifics自動抽出のエントリーポイント。
 * メニュー、抽出実行、UI、検証、書き込み処理を担当。
 *
 * 依存:
 * - Config_IS.gs: IS_CONFIG, getISSettings(), IS_INITIAL_DATA
 * - Dictionary.gs: loadDictionary(), getCategoryByTag(), getFieldsForCategory(), initializeDictionary(), showDictionaryManager()
 * - AIExtractor.gs: extractItemSpecifics(), mapTagToCategory(), extractItemSpecificsBatch()
 *
 * 注意: GASのES5互換 (var / function) に準拠
 */

/**
 * 初回セットアップ: GASエディタからこの関数を1回実行するだけで、
 * 以降シートを開くたびにItem Specificsメニューが自動表示される。
 * 既存のonOpen関数には一切変更を加えない。
 */
function setupItemSpecifics() {
  // 既存のトリガーを確認（重複登録防止）
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'addItemSpecificsMenu') {
      SpreadsheetApp.getUi().alert('Item Specificsメニューは既にセットアップ済みです。');
      return;
    }
  }
  // インストール可能なonOpenトリガーを登録
  ScriptApp.newTrigger('addItemSpecificsMenu')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onOpen()
    .create();

  // 今すぐメニューも表示
  addItemSpecificsMenu();

  SpreadsheetApp.getUi().alert('セットアップ完了！\n以降、シートを開くたびにItem Specificsメニューが自動表示されます。');
}

// =============================
// 公開: メニュー追加
// =============================
function addItemSpecificsMenu() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('🏷️ Item Specifics')
      .addItem('選択行のItem Specificsを抽出', 'extractSelectedRows')
      .addItem('全行のItem Specificsを抽出', 'extractAllRows')
      .addSeparator()
      .addItem('辞書管理', 'showDictionaryManager')
      .addItem('辞書を初期化', 'initializeDictionaryWithConfirm')
      .addSeparator()
      .addItem('APIキー設定', 'showISApiKeyDialog')
      .addToUi();
  } catch (e) {
    Logger.log('[addItemSpecificsMenu] error: ' + (e && e.stack ? e.stack : e));
  }
}

/**
 * Item Specifics用APIキー設定ダイアログ
 */
function showISApiKeyDialog() {
  var ui = SpreadsheetApp.getUi();
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var current = docProps.getProperty('IS_OPENAI_API_KEY') || '';
    var masked = current ? (current.substring(0, 6) + '...' + current.substring(current.length - 4)) : '未設定';

    var result = ui.prompt(
      'Item Specifics APIキー設定',
      '現在のAPIキー: ' + masked + '\n\nOpenAI APIキーを入力してください:',
      ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() !== ui.Button.OK) {
      return;
    }

    var newKey = (result.getResponseText() || '').trim();
    if (!newKey) {
      ui.alert('APIキーが空です。設定は変更されませんでした。');
      return;
    }

    saveISApiKey(newKey);
    ui.alert('APIキーを保存しました。');
  } catch (e) {
    ui.alert('エラー: ' + (e && e.message ? e.message : e));
  }
}

// =============================
// 公開: 選択行の抽出
// =============================
function extractSelectedRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) {
    return;
  }

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  var toastTitle = 'Item Specifics';
  try {
    var v = validateSetup_();
    if (!v.ok) {
      ui.alert(v.message || 'セットアップの検証に失敗しました。');
      return;
    }

    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3; // 既定: 3行目からデータ
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    var range = sheet.getActiveRange();
    if (!range) {
      ui.alert('範囲が選択されていません。');
      return;
    }

    var startRow = range.getRow();
    var numRows = range.getNumRows();
    var lastRow = startRow + numRows - 1;

    // 対象行をユニークに抽出
    var rows = [];
    var seen = {};
    var r;
    for (r = startRow; r <= lastRow; r++) {
      if (r >= dataStartRow && !seen[r]) {
        rows.push(r);
        seen[r] = true;
      }
    }
    if (rows.length === 0) {
      ui.alert('選択範囲内に対象行がありません（データ開始行以降のみ処理）。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('辞書読み込み中...', toastTitle, 5);

    // 辞書読み込み（補完用 — なくても動作する）
    var dict = null;
    try {
      dict = (typeof loadDictionary === 'function') ? loadDictionary() : null;
    } catch (dictErr) {
      Logger.log('[extractSelectedRows] loadDictionary warning: ' + dictErr);
      // 辞書なしでも続行
    }

    // データの読み取り (A:tag, G:title, L:description)
    var requests = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var tag = getValue_(sheet, row, 1);      // A列
      var title = getValue_(sheet, row, 7);    // G列
      var desc = getValue_(sheet, row, 12);    // L列

      if (!title && !tag) {
        Logger.log('[extractSelectedRows] skip row ' + row + ' (tag/title empty)');
        continue;
      }

      // カテゴリとフィールドは辞書から取得を試みるが、失敗しても続行
      var category = null;
      var fields = [];
      try {
        if (dict && typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
        if (category && typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (dictLookupErr) {
        Logger.log('[extractSelectedRows] dict lookup warning row ' + row + ': ' + dictLookupErr);
      }
      // category/fieldsがnull/空でもリクエストに含める（AIが自律判定する）

      requests.push({
        row: row,
        tag: tag,
        title: title,
        description: desc,
        category: category,
        fields: fields
      });
    }

    if (requests.length === 0) {
      ui.alert('処理対象の行がありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('AI抽出を実行中... 対象: ' + requests.length + ' 行', toastTitle, 10);

    var results = runExtractionBatchWithRetry_(requests, settings, 2);
    if (!results || results.length === 0) {
      ui.alert('抽出結果が得られませんでした。\nログを確認してください: 表示 > 実行ログ');
      return;
    }

    writeItemSpecificsToSheet_(sheet, results);

    SpreadsheetApp.getActiveSpreadsheet().toast('完了: ' + results.length + ' 行のItem Specificsを抽出しました', toastTitle, 5);
  } catch (e) {
    Logger.log('[extractSelectedRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

// =============================
// 公開: 全行の抽出
// =============================
function extractAllRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) {
    return;
  }

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  var toastTitle = 'Item Specifics';
  try {
    var v = validateSetup_();
    if (!v.ok) {
      ui.alert(v.message || 'セットアップの検証に失敗しました。');
      return;
    }

    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3;
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('辞書読み込み中...', toastTitle, 5);
    var dict = null;
    try {
      dict = (typeof loadDictionary === 'function') ? loadDictionary() : null;
    } catch (dictErr) {
      Logger.log('[extractAllRows] loadDictionary error: ' + dictErr);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < dataStartRow) {
      ui.alert('データ行がありません。');
      return;
    }

    var requests = [];
    var r;
    for (r = dataStartRow; r <= lastRow; r++) {
      var tag = getValue_(sheet, r, 1);   // A
      var title = getValue_(sheet, r, 7); // G
      var desc = getValue_(sheet, r, 12); // L
      if (!tag && !title) {
        continue; // スキップ
      }

      // カテゴリとフィールドは辞書から取得を試みるが、失敗しても続行
      var category = null;
      var fields = [];
      try {
        if (dict && typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
        if (category && typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (dictLookupErr2) {
        Logger.log('[extractAllRows] dict lookup warning row ' + r + ': ' + dictLookupErr2);
      }
      // category/fieldsがnull/空でもリクエストに含める（AIが自律判定する）

      requests.push({
        row: r,
        tag: tag,
        title: title,
        description: desc,
        category: category,
        fields: fields
      });

      if (requests.length % 20 === 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast('準備中... ' + requests.length + ' 行を収集', toastTitle, 5);
      }
    }

    if (requests.length === 0) {
      ui.alert('処理対象の行がありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('AI抽出をバッチ実行中... ' + requests.length + ' 行', toastTitle, 10);
    var results = runExtractionBatchWithRetry_(requests, settings, 2);

    if (results && results.length > 0) {
      writeItemSpecificsToSheet_(sheet, results);
      SpreadsheetApp.getActiveSpreadsheet().toast('完了: ' + results.length + ' 行のItem Specificsを抽出しました', toastTitle, 5);
    } else {
      ui.alert('抽出結果が得られませんでした。');
    }
  } catch (e) {
    Logger.log('[extractAllRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

// (ヘッダーマッチングは不要: eBay File Exchange形式でフラット書き込みに変更)

/**
 * AI抽出結果をeBay File Exchange形式で書き込む
 * 各データ行のN列(14)以降に「C:フィールド名 | 値 | C:フィールド名 | 値 ...」と横並びで書く
 * @param {Sheet} sheet
 * @param {Array} rowResults - [{row: number, data: {field: value, ...}}]
 */
function writeItemSpecificsToSheet_(sheet, rowResults) {
  try {
    if (!sheet || !rowResults || rowResults.length === 0) {
      return;
    }
    var startCol = 14; // N列

    for (var i = 0; i < rowResults.length; i++) {
      var item = rowResults[i] || {};
      var row = item.row;
      var data = item.data || item.specifics || item.values || {};
      if (!row || !data) {
        continue;
      }

      // JSON → フラット配列変換: {"Brand": "Seiko"} → ["C:Brand", "Seiko"]
      var flat = jsonToFlatArray_(data);
      if (flat.length === 0) {
        continue;
      }

      // 行のN列以降にフラット配列を書き込む
      var writeRange = sheet.getRange(row, startCol, 1, flat.length);
      writeRange.setValues([flat]);
    }
  } catch (e) {
    Logger.log('[writeItemSpecificsToSheet_] error: ' + (e && e.stack ? e.stack : e));
    // エラーをユーザーにも見せる
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast('書き込みエラー: ' + (e && e.message ? e.message : e), 'Item Specifics', 10);
    } catch (te) {}
  }
}

/**
 * JSONオブジェクトをeBay File Exchange形式のフラット配列に変換
 * {"Brand": "Seiko", "Type": "Wrist Watch"} → ["C:Brand", "Seiko", "C:Type", "Wrist Watch"]
 * @param {Object} data
 * @return {Array<string>}
 */
function jsonToFlatArray_(data) {
  var result = [];
  if (!data || typeof data !== 'object') {
    return result;
  }
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = data[key];
    // 空文字やnullは出力しない（eBayに不要なフィールドを送らない）
    if (val === null || val === undefined || val === '') {
      continue;
    }
    result.push('C:' + key);
    result.push(String(val));
  }
  return result;
}

// (ヘッダー自動追加は不要: フラット配列を直接書き込むため)

// =============================
// 公開: 辞書初期化 (確認付き)
// =============================
function initializeDictionaryWithConfirm() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '辞書を初期化',
    '辞書シートに12カテゴリの初期データを投入します。\n既存データは上書きされます。続行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (result === ui.Button.YES) {
    try {
      if (typeof initializeDictionary === 'function') {
        initializeDictionary();
        ui.alert('辞書を初期化しました。');
      } else {
        ui.alert('initializeDictionary 関数が見つかりません。Dictionary.gs を確認してください。');
      }
    } catch (e) {
      Logger.log('[initializeDictionaryWithConfirm] error: ' + (e && e.stack ? e.stack : e));
      ui.alert('辞書の初期化に失敗しました: ' + e);
    }
  }
}

// =============================
// 非公開: 実行前検証
// - APIキー
// - アクティブシート名
// =============================
function validateSetup_() {
  var res = { ok: true, message: '' };
  try {
    var settings = getActiveISSettings_();
    var ui = SpreadsheetApp.getUi();

    // APIキー (IS専用)
    var props = PropertiesService.getDocumentProperties();
    var apiKey = null;
    try { apiKey = props.getProperty('IS_OPENAI_API_KEY'); } catch (e1) {}
    if (!apiKey && settings && settings.apiKey) { apiKey = settings.apiKey; }

    if (!apiKey) {
      res.ok = false;
      res.message = 'OpenAI APIキーが未設定です。メニュー > Item Specifics > APIキー設定 から設定してください。';
      return res;
    }

    // アクティブシート名
    var targetSheetName = settings.targetSheetName || '出品2';
    var sheet = SpreadsheetApp.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      res.ok = false;
      res.message = 'アクティブシートが "' + targetSheetName + '" ではありません。';
      return res;
    }
  } catch (e) {
    res.ok = false;
    res.message = '検証中にエラーが発生: ' + e;
  }
  return res;
}

// =============================
// 非公開: 便利関数群
// =============================
function getActiveISSettings_() {
  var settings = {};
  try {
    if (typeof getISSettings === 'function') {
      var s = getISSettings();
      if (s && typeof s === 'object') {
        settings = s;
      }
    }
  } catch (e) {
    Logger.log('[getActiveISSettings_] error: ' + e);
  }
  // Config_IS.gs のキー名でデフォルト補完
  if (!settings.SHEET_NAME) { settings.SHEET_NAME = '出品2'; }
  if (!settings.DATA_START_ROW) { settings.DATA_START_ROW = 3; }
  // 互換エイリアス
  settings.targetSheetName = settings.SHEET_NAME;
  settings.dataStartRow = settings.DATA_START_ROW;
  settings.apiKey = settings.OPENAI_API_KEY || '';
  return settings;
}

function acquireLock_(lock) {
  try {
    lock.tryLock(30000); // 30秒待機
    return true;
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('別の処理が実行中です。しばらく待って再実行してください。', 'Item Specifics', 5);
    return false;
  }
}

function getValue_(sheet, row, col) {
  try {
    return sheet.getRange(row, col).getValue();
  } catch (e) {
    return '';
  }
}

// =============================
// 非公開: バッチ抽出実行（簡易リトライ対応）
// requests: [{row, tag, title, description, category, fields}]
// return: [{row, data: {field: value}}]
// =============================
function runExtractionBatchWithRetry_(requests, settings, retryMax) {
  var attempts = 0;
  var toastTitle = 'Item Specifics';
  var results = [];
  var remaining = requests.slice(0);
  var chunkSize = (settings && settings.batchSize) ? settings.batchSize : 20;

  while (remaining.length > 0 && attempts <= retryMax) {
    var nextRemaining = [];
    var processed = 0;
    var idx = 0;
    while (idx < remaining.length) {
      var chunk = remaining.slice(idx, idx + chunkSize);
      idx += chunk.length;

      try {
        var batchRes = null;
        if (typeof extractItemSpecificsBatch === 'function') {
          batchRes = extractItemSpecificsBatch(chunk, settings);
        } else if (typeof extractItemSpecifics === 'function') {
          // フォールバック: 逐次処理
          batchRes = [];
          for (var i = 0; i < chunk.length; i++) {
            try {
              var single = extractItemSpecifics(chunk[i], settings);
              batchRes.push(single);
            } catch (se) {
              Logger.log('[runExtractionBatchWithRetry_] single extract error: ' + se);
              batchRes.push(null);
            }
          }
        } else {
          Logger.log('[runExtractionBatchWithRetry_] 抽出関数が見つかりません');
          batchRes = [];
        }

        // バッチ結果の整形
        var normalized = normalizeBatchResults_(chunk, batchRes);
        for (var j = 0; j < normalized.completed.length; j++) {
          results.push(normalized.completed[j]);
          processed++;
        }
        for (var k = 0; k < normalized.failed.length; k++) {
          nextRemaining.push(normalized.failed[k]);
        }
      } catch (e) {
        Logger.log('[runExtractionBatchWithRetry_] batch error: ' + (e && e.stack ? e.stack : e));
        // 失敗したチャンクは次回再試行
        for (var m = 0; m < chunk.length; m++) {
          nextRemaining.push(chunk[m]);
        }
      }

      if (processed > 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast('処理中... ' + processed + ' 件完了 / ' + requests.length + ' 件', toastTitle, 5);
      }
    }

    if (nextRemaining.length === 0) {
      break; // 全件成功
    }

    attempts++;
    if (attempts <= retryMax) {
      SpreadsheetApp.getActiveSpreadsheet().toast('一部失敗のため再試行中... 残り ' + nextRemaining.length + ' 件 (試行 ' + attempts + '/' + retryMax + ')', toastTitle, 5);
    }
    remaining = nextRemaining;
  }

  if (remaining.length > 0) {
    Logger.log('[runExtractionBatchWithRetry_] 最終的に失敗した件数: ' + remaining.length);
  }
  return results;
}

// =============================
// 非公開: バッチ結果の正規化
// 入力chunk順に [{row, data:{}} or null or {row, specifics:{}}] を整形
// =============================
function normalizeBatchResults_(chunk, batchRes) {
  var completed = [];
  var failed = [];
  try {
    if (!batchRes || batchRes.length === undefined) {
      // 想定外の戻り値、全件失敗として再試行
      for (var i = 0; i < chunk.length; i++) {
        failed.push(chunk[i]);
      }
      return { completed: completed, failed: failed };
    }

    var i;
    for (i = 0; i < chunk.length; i++) {
      var req = chunk[i];
      var res = batchRes[i];

      if (!res) {
        failed.push(req);
        continue;
      }

      // 可能なキーに対応
      var row = res.row || req.row;
      var data = res.data || res.specifics || res.values || res.result || null;
      if (!row || !data) {
        failed.push(req);
        continue;
      }

      completed.push({ row: row, data: data });
    }
  } catch (e) {
    Logger.log('[normalizeBatchResults_] error: ' + (e && e.stack ? e.stack : e));
    // 例外時は全件再試行
    for (var j = 0; j < chunk.length; j++) { failed.push(chunk[j]); }
  }
  return { completed: completed, failed: failed };
}

// 設定ダイアログのフォールバックは削除（Config_IS.gs での実装に依存）
/**
 * デバッグ用: DocumentPropertiesからAPIキー関連の値を確認する
 * GASエディタから手動で実行して結果を確認する
 */
function debugISApiKey() {
  var ui = SpreadsheetApp.getUi();
  var lines = [];
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var allProps = docProps.getProperties();
    var keys = Object.keys(allProps);
    lines.push('DocumentProperties キー数: ' + keys.length);
    lines.push('');
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (k.indexOf('API_KEY') !== -1 || k.indexOf('api_key') !== -1 || k.indexOf('OPENAI') !== -1 || k.indexOf('AI_') !== -1) {
        var v = allProps[k];
        var masked = v ? (v.substring(0, 6) + '...' + v.substring(v.length - 4)) : '(空)';
        lines.push(k + ' = ' + masked);
      }
    }
    if (lines.length === 2) {
      lines.push('APIキー関連のプロパティは見つかりませんでした');
    }
    lines.push('');
    lines.push('SpreadsheetID: ' + SpreadsheetApp.getActive().getId());
  } catch (e) {
    lines.push('エラー: ' + (e && e.message ? e.message : e));
  }
  ui.alert('API Key デバッグ', lines.join('\n'), ui.ButtonSet.OK);
}
