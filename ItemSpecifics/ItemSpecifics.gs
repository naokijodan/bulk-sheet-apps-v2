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
      .addItem('設定', 'showISSettingsDialog')
      .addToUi();
  } catch (e) {
    Logger.log('[addItemSpecificsMenu] error: ' + (e && e.stack ? e.stack : e));
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

    // 辞書読込
    var dict = null;
    try {
      dict = (typeof loadDictionary === 'function') ? loadDictionary() : null;
    } catch (dictErr) {
      Logger.log('[extractSelectedRows] loadDictionary error: ' + dictErr);
    }

    // データの読み取り (A:tag, G:title, L:description)
    var requests = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var tag = getValue_(sheet, row, 1);      // A列
      var title = getValue_(sheet, row, 7);    // G列
      var desc = getValue_(sheet, row, 12);    // L列

      if (!tag && !title) {
        Logger.log('[extractSelectedRows] skip row ' + row + ' (tag/title empty)');
        continue;
      }

      var category = null;
      try {
        if (typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
      } catch (catErr) {
        Logger.log('[extractSelectedRows] getCategoryByTag error row ' + row + ': ' + catErr);
      }
      if (!category) {
        try {
          if (typeof mapTagToCategory === 'function') {
            var catNames = [];
            if (dict) {
              for (var cn in dict) {
                if (dict.hasOwnProperty(cn)) { catNames.push(cn); }
              }
            }
            category = mapTagToCategory(tag, catNames);
          }
        } catch (mapErr) {
          Logger.log('[extractSelectedRows] mapTagToCategory error row ' + row + ': ' + mapErr);
        }
      }
      if (!category) {
        Logger.log('[extractSelectedRows] category not found row ' + row + ' (skip)');
        continue;
      }

      var fields = [];
      try {
        if (typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (fErr) {
        Logger.log('[extractSelectedRows] getFieldsForCategory error row ' + row + ': ' + fErr);
      }

      ensureHeaders_(sheet, fields);

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
      ui.alert('抽出結果が得られませんでした。');
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

      var category = null;
      try {
        if (typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
      } catch (catErr) {
        Logger.log('[extractAllRows] getCategoryByTag error row ' + r + ': ' + catErr);
      }
      if (!category) {
        try {
          if (typeof mapTagToCategory === 'function') {
            var catNames2 = [];
            if (dict) {
              for (var cn2 in dict) {
                if (dict.hasOwnProperty(cn2)) { catNames2.push(cn2); }
              }
            }
            category = mapTagToCategory(tag, catNames2);
          }
        } catch (mapErr) {
          Logger.log('[extractAllRows] mapTagToCategory error row ' + r + ': ' + mapErr);
        }
      }
      if (!category) {
        Logger.log('[extractAllRows] category not found row ' + r + ' (skip)');
        continue;
      }

      var fields = [];
      try {
        if (typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (fErr) {
        Logger.log('[extractAllRows] getFieldsForCategory error row ' + r + ': ' + fErr);
      }

      ensureHeaders_(sheet, fields);

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

// =============================
// 非公開: ヘッダーマッチング
// =============================
function matchHeaderToField_(header) {
  var cleaned = String(header || '').trim();
  if (cleaned.indexOf('C:') === 0) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned && cleaned.charAt(cleaned.length - 1) === '=') {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }
  return String(cleaned || '').trim();
}

// =============================
// 非公開: 抽出結果の書き込み
// rowResults: [{ row: number, specifics|data: { field: value }, overwrite?: boolean }]
// =============================
function writeItemSpecificsToSheet_(sheet, rowResults) {
  try {
    if (!sheet || !rowResults || rowResults.length === 0) {
      return;
    }

    var settings = getActiveISSettings_();
    var allowOverwrite = !!(settings && (settings.overwrite === true || settings.overwriteItemSpecifics === true || settings.overwriteMode === true));

    // ヘッダー行は2行目。N列(14)以降を対象
    var headerRow = 2;
    var startCol = 14;
    var lastCol = sheet.getLastColumn();
    if (lastCol < startCol) {
      return; // ヘッダーなし
    }

    var headerRange = sheet.getRange(headerRow, startCol, 1, lastCol - startCol + 1);
    var headerValues = headerRange.getValues();
    var headers = headerValues && headerValues[0] ? headerValues[0] : [];

    // ヘッダーマップ: 正規化名 -> 列オフセット
    var headerIndex = {};
    var c;
    for (c = 0; c < headers.length; c++) {
      var h = matchHeaderToField_(headers[c]);
      if (h) {
        headerIndex[h] = c; // startCol + c が実列
      }
    }

    var i;
    for (i = 0; i < rowResults.length; i++) {
      var item = rowResults[i] || {};
      var row = item.row;

      // 戻りデータキー名のバリエーションに対応
      var data = item.data || item.specifics || item.values || {};
      if (!row || !data) {
        continue;
      }

      var keys = Object.keys(data);
      for (var k = 0; k < keys.length; k++) {
        var field = keys[k];
        var val = data[field];
        var headerKey = matchHeaderToField_(field);
        var offset = headerIndex[headerKey];
        if (typeof offset === 'number') {
          var col = startCol + offset;
          var cell = sheet.getRange(row, col);
          var current = cell.getValue();
          if (current && current !== '' && !allowOverwrite) {
            continue; // 上書き禁止時はスキップ
          }
          try {
            cell.setValue(val);
          } catch (cellErr) {
            Logger.log('[writeItemSpecificsToSheet_] setValue error row ' + row + ' col ' + col + ': ' + cellErr);
          }
        }
      }
    }
  } catch (e) {
    Logger.log('[writeItemSpecificsToSheet_] error: ' + (e && e.stack ? e.stack : e));
  }
}

// =============================
// 非公開: 必要ヘッダーの確保
// fields: ["Brand", "Style", ...]
// 追加したヘッダーの配列を返す
// =============================
function ensureHeaders_(sheet, fields) {
  var added = [];
  try {
    if (!sheet) { return added; }
    fields = fields || [];
    if (fields.length === 0) { return added; }

    var headerRow = 2;
    var startCol = 14; // N列
    var lastCol = sheet.getLastColumn();
    if (lastCol < startCol) {
      lastCol = startCol - 1; // ヘッダーがまだない
    }

    var existingHeaders = [];
    if (lastCol >= startCol) {
      var headerRange = sheet.getRange(headerRow, startCol, 1, lastCol - startCol + 1);
      var vals = headerRange.getValues();
      existingHeaders = vals && vals[0] ? vals[0] : [];
    }

    var existingMap = {};
    var c;
    for (c = 0; c < existingHeaders.length; c++) {
      var norm = matchHeaderToField_(existingHeaders[c]);
      if (norm) {
        existingMap[norm] = true;
      }
    }

    var toAdd = [];
    var i;
    for (i = 0; i < fields.length; i++) {
      var fObj = fields[i] || {};
      var f = (typeof fObj === 'string') ? fObj.trim() : String(fObj.name || '').trim();
      if (!f) { continue; }
      var normF = matchHeaderToField_(f);
      if (!existingMap[normF]) {
        toAdd.push('C:' + normF);
        existingMap[normF] = true;
      }
    }

    if (toAdd.length > 0) {
      var writeStartCol = startCol + existingHeaders.length;
      var writeRange = sheet.getRange(headerRow, writeStartCol, 1, toAdd.length);
      writeRange.setValues([toAdd]);
      added = toAdd.slice(0);
    }
  } catch (e) {
    Logger.log('[ensureHeaders_] error: ' + (e && e.stack ? e.stack : e));
  }
  return added;
}

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

    // APIキー (DocumentProperties or settings)
    var props = PropertiesService.getDocumentProperties();
    var apiKey = null;
    try { apiKey = props.getProperty('OPENAI_API_KEY'); } catch (e1) {}
    if (!apiKey && settings && settings.apiKey) { apiKey = settings.apiKey; }

    if (!apiKey) {
      res.ok = false;
      res.message = 'OpenAI APIキーが未設定です。設定画面でAPIキーを設定してください。';
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

// 参考: 設定ダイアログが存在しない環境向けのフォールバック
// 他ファイルで showISSettingsDialog が未定義の場合のみ動作
if (typeof showISSettingsDialog !== 'function') {
  function showISSettingsDialog() {
    var ui = SpreadsheetApp.getUi();
    ui.alert('設定ダイアログは未実装です。Config_IS.gs に showISSettingsDialog を実装してください。');
  }
}
