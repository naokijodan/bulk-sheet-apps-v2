/******************************************************
 * Utils.gs - ユーティリティ関数
 * - ライブラリ更新チェック
 * - UI関連 (アラート、確認ダイアログ)
 * - 配列・データ処理 (バッチ作成)
 * - 処理制御 (停止制御、トリガー管理)
 * - シート操作 (シート取得、行取得)
 * - カスタム関数 (テンプレートID取得、ポリシーID取得)
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ライブラリ更新チェック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

// 現在のライブラリバージョン（デプロイ時に更新）
var CURRENT_LIB_VERSION = 97;

/**
 * 現在のライブラリバージョンを返す（サイドバーから呼び出し用）
 * @return {number} 現在のバージョン番号
 */
function getCurrentLibVersion() {
  return CURRENT_LIB_VERSION;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UI関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 為替レートを更新（GOOGLEFINANCEで取得）
 * A2から現在の為替レートを読み取り、C2に値として設定
 * エラー時や異常値の場合は145円を設定
 */
function updateExchangeRate(sheet) {
  try {
    // exchangerate-api.com から USD/JPY レートを取得
    var url = 'https://api.exchangerate-api.com/v4/latest/USD';
    var response = UrlFetchApp.fetch(url);
    var data = JSON.parse(response.getContentText());

    if (data && data.rates && data.rates.JPY) {
      var rate = Number(data.rates.JPY);

      // レートの妥当性チェック（100〜200円の範囲）
      if (rate >= 100 && rate <= 200) {
        sheet.getRange("C2").setValue(rate);
        return rate;
      }
    }

    // API取得失敗時はデフォルト値
    sheet.getRange("C2").setValue(145);
    return 145;

  } catch (e) {
    Logger.log('為替レート取得エラー: ' + e.message);
    sheet.getRange("C2").setValue(145);
    return 145;
  }
}

/**
 * 1日1回為替レートを自動更新するトリガーを設定
 * @param {boolean} silent - trueの場合、アラートを表示しない（初期設定から呼ばれる場合）
 */
function setupExchangeRateUpdateTrigger(silent) {
  try {
    // 既存の為替更新トリガーを削除
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'updateExchangeRateAutomatically') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }

    // 毎日午前9時のトリガーを設定（exchangerate-api.comは1日1回更新）
    ScriptApp.newTrigger('updateExchangeRateAutomatically')
      .timeBased()
      .atHour(9)
      .everyDays(1)
      .create();

    if (!silent) {
      showAlert('為替レート自動更新トリガーを設定しました（毎日午前9時）\n\nデータソース: exchangerate-api.com', 'success');
    }
  } catch (e) {
    if (!silent) {
      showAlert('トリガー設定に失敗しました: ' + e.message, 'error');
    }
  }
}

/**
 * トリガーから呼ばれる為替レート更新関数
 */
function updateExchangeRateAutomatically() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      Logger.log('作業シートが見つかりません');
      return;
    }

    var rate = updateExchangeRate(sheet);
    Logger.log('為替レートを更新しました: ' + rate + '円');
  } catch (e) {
    Logger.log('為替レート自動更新エラー: ' + e.message);
  }
}

/**
 * 為替レート自動更新トリガーを削除
 */
function removeExchangeRateUpdateTrigger() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var count = 0;
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'updateExchangeRateAutomatically') {
        ScriptApp.deleteTrigger(triggers[i]);
        count++;
      }
    }
    showAlert('為替レート自動更新トリガーを削除しました（' + count + '個）', 'success');
  } catch (e) {
    showAlert('トリガー削除に失敗しました: ' + e.message, 'error');
  }
}

/**
 * 為替レート自動更新トリガーが設定されているかチェック
 * @return {boolean} トリガーが設定されていればtrue
 */
function isExchangeRateUpdateTriggerActive() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'updateExchangeRateAutomatically') {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

function showAlert(message, type) {
  if (typeof type === 'undefined') type = "info";
  try {
    var ui = SpreadsheetApp.getUi();
    var icons = { success: "✅", error: "⚠️", warning: "⚠️", info: "ℹ️" };
    var title = (icons[type] || icons.info) + ' ' + type.toUpperCase();
    ui.alert(title, message, ui.ButtonSet.OK);
  } catch (e) {}
}

function shouldShowPopups() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var showPopups = docProps.getProperty('SHOW_POPUPS') || 'true';
    return showPopups === 'true';
  } catch (e) {
    return true; // エラー時はデフォルトで表示
  }
}

// 一般的なポップアップ制御（エラーは常に表示）
function conditionalShowAlert(message, type) {
  // エラーは常に表示（安全のため）
  if (type === 'error') {
    showAlert(message, type);
    return;
  }

  // それ以外は初期設定に従う
  if (shouldShowPopups()) {
    showAlert(message, type);
  }
}

// 開始確認専用（OFF時は確認なしで即実行）
function conditionalStartConfirmation(message, title) {
  if (shouldShowPopups()) {
    var ui = SpreadsheetApp.getUi();
    return ui.alert(title || '確認', message, ui.ButtonSet.YES_NO);
  } else {
    // ポップアップOFFの場合はYESを返して実行
    return SpreadsheetApp.getUi().Button.YES;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配列・データ処理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function createBatches(array, size) {
  var batches = [];
  for (var i = 0; i < array.length; i += size) {
    batches.push(array.slice(i, i + size));
  }
  return batches;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  処理制御
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function setupStopControlCell() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    sheet.getRange("D2").setValue("GO");
  } catch (e) {}
}

function checkStopControl() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sh) return true; // シートが見つからない場合は続行

    var stopValue = sh.getRange('D2').getValue();
    return stopValue === 'GO'; // GOなら続行、STOPなら停止
  } catch (e) {
    return true; // エラー時は続行
  }
}

function shouldContinueProcessing() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return true;
    var val = sheet.getRange("D2").getValue();
    return (val !== "STOP");
  } catch (e) {
    return true;
  }
}

function clearProcessingState() {
  var props = PropertiesService.getDocumentProperties();
  [
    'isProcessing','processingMode','lastProcessedRowIndex','totalTokens',
    'totalPrompt','totalCompletion','processedCount','errorCount','skippedCount',
    'manualWeight','manualSize','targetRows','startTime'
  ].forEach(function(k){ props.deleteProperty(k); });
}

function createSelfContinuationTrigger(functionName) {
  clearAllTriggers();
  ScriptApp.newTrigger(functionName).timeBased()
    .at(new Date(Date.now() + CONFIG.CONTINUATION_INTERVAL_MINUTES * 60 * 1000))
    .create();
}

function clearAllTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i=0;i<triggers.length;i++) {
    var h = triggers[i].getHandlerFunction();
    if (h.indexOf('runSelectedRows') === 0) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function createContinuationTrigger(scriptName, intervalMinutes) {
  try {
    clearAllTriggers();
    ScriptApp.newTrigger(scriptName)
      .timeBased()
      .after(intervalMinutes * 60 * 1000)
      .create();
  } catch (e) {}
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  時間計算
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function calculateElapsedTime(startTimeISO) {
  const startTime = new Date(startTimeISO);
  const endTime = new Date();
  const elapsedMs = endTime - startTime;

  const hours = Math.floor(elapsedMs / 3600000);
  const minutes = Math.floor((elapsedMs % 3600000) / 60000);
  const seconds = Math.floor((elapsedMs % 60000) / 1000);

  if (hours > 0) {
    return hours + '時間' + minutes + '分';
  } else if (minutes > 0) {
    return minutes + '分' + seconds + '秒';
  } else {
    return seconds + '秒';
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  シート操作
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function getTargetRows(sheet) {
  var last = sheet.getLastRow();
  if (last < 5) return [];
  var targets = [];
  for (var r = 5; r <= last; r++) {
    var jpTitle = sheet.getRange(r, CONFIG.COLUMNS.JP_TITLE).getValue();
    var jpDesc  = sheet.getRange(r, CONFIG.COLUMNS.JP_DESC).getValue();
    var costYen = Number(sheet.getRange(r, CONFIG.COLUMNS.COST_YEN).getValue());
    var enTitle = sheet.getRange(r, CONFIG.COLUMNS.EN_TITLE).getValue();
    var enDesc  = sheet.getRange(r, CONFIG.COLUMNS.EN_DESC).getValue();
    if (jpTitle && jpDesc && costYen > 0 && (!enTitle || !enDesc)) {
      targets.push(r);
    }
  }
  return targets;
}

function validateAndGetSheet() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME');
    if (!sheetName) {
      showAlert('作業シート名が設定されていません。初期設定を実行してください。', 'error');
      return null;
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      showAlert('作業シート「' + sheetName + '」が見つかりません。', 'error');
      return null;
    }
    return sheet;
  } catch (e) {
    showAlert('シート取得エラー: ' + e.message, 'error');
    return null;
  }
}

function getSelectedRows() {
  try {
    var sheet = validateAndGetSheet();
    if (!sheet) return [];
    var range = sheet.getActiveRange();
    if (!range) return [];
    var startRow = range.getRow();
    var endRow = range.getLastRow();
    var rows = [];
    for (var i = startRow; i <= endRow; i++) {
      if (i >= 5) rows.push(i);
    }
    return rows;
  } catch (e) {
    return [];
  }
}

function getDataRows(sheet) {
  try {
    if (!sheet) return [];
    var lastRow = sheet.getLastRow();
    var rows = [];
    for (var i = 5; i <= lastRow; i++) {
      rows.push(i);
    }
    return rows;
  } catch (e) {
    return [];
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  列番号変換
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function getColumnNumber(column) {
  var result = 0;
  for (var i = 0; i < column.length; i++) {
    result = result * 26 + (column.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result;
}

function getColumnIndex(columnLetter) {
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letters.indexOf(columnLetter.toUpperCase()) + 1;
}

function findMatchingSheets(pattern) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = ss.getSheets();
    var matchingSheets = [];

    allSheets.forEach(function(sheet) {
      var sheetName = sheet.getName();
      if (pattern.endsWith('*')) {
        var prefix = pattern.slice(0, -1);
        if (sheetName.indexOf(prefix) === 0) {
          matchingSheets.push(sheetName);
        }
      } else {
        if (sheetName === pattern) {
          matchingSheets.push(sheetName);
        }
      }
    });

    return matchingSheets;
  } catch (e) {
    console.error('シート検索エラー: ' + e.message);
    return [];
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カスタム関数（スプレッドシートから呼び出し可能）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * テンプレートIDを取得するカスタム関数
 *
 * @param {string} categoryDisplay - カテゴリー表示名（O1セル）
 * @param {string} templateName - テンプレート名（O2セル）
 * @param {string} condition - 商品状態（AE列: 新品/中古）
 * @param {string} shippingMethod - 配送方法（X列: CF/CD/EL/EP/CEなど）
 * @return {number|string} テンプレートID、またはエラーメッセージ
 * @customfunction
 */
function GET_TEMPLATE_ID(categoryDisplay, templateName, condition, shippingMethod) {
  try {
    // 入力チェック
    if (!categoryDisplay || !templateName || !condition || !shippingMethod) {
      return '';
    }

    // 配送方法を配送タイプに変換
    var shippingType = convertShippingMethodToType_(shippingMethod);
    if (shippingType === 'エラー') {
      return 'エラー';
    }

    // テンプレート標準名を生成
    var standardName = generateTemplateName_(templateName, condition, shippingType);
    if (!standardName) {
      return 'エラー';
    }

    // Policy_Masterから検索
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Policy_Master');

    if (!sheet) {
      return 'エラー';
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return '該当なし';
    }

    var data = sheet.getRange(1, 1, lastRow, 2).getValues();
    var inTemplateSection = false;

    for (var i = 0; i < data.length; i++) {
      var cellA = String(data[i][0] || '');

      // テンプレートセクション開始
      if (cellA.indexOf('【Templates】') !== -1) {
        inTemplateSection = true;
        continue;
      }

      // セクション終了
      if (cellA.indexOf('【') !== -1 && inTemplateSection) {
        break;
      }

      // テンプレート検索
      if (inTemplateSection) {
        var name = String(data[i][1] || '');
        if (name === standardName) {
          var id = data[i][0];
          return typeof id === 'number' ? id : Number(id);
        }
      }
    }

    return '該当なし';

  } catch (e) {
    return 'エラー';
  }
}

/**
 * 配送方法を配送タイプに変換（カスタム関数用）
 * @private
 */
function convertShippingMethodToType_(shippingMethod) {
  try {
    var method = String(shippingMethod || '').trim();

    if (method === '自動選択' || method === '') {
      return 'エラー';
    }

    // エコノミー系
    var economyMethods = ['CE', 'EP', 'Cpass-Economy', 'ePacket'];
    for (var i = 0; i < economyMethods.length; i++) {
      if (method === economyMethods[i]) {
        return 'エコノミー';
      }
    }

    // EX系
    var exMethods = ['CF', 'CD', 'EL', 'Cpass-FedEx', 'Cpass-DHL', 'eLogistics'];
    for (var j = 0; j < exMethods.length; j++) {
      if (method === exMethods[j]) {
        return 'EX';
      }
    }

    return 'エラー';

  } catch (error) {
    return 'エラー';
  }
}

/**
 * テンプレート標準名を生成（カスタム関数用）
 * @private
 */
function generateTemplateName_(templateName, condition, shippingType) {
  try {
    // 配送タイプを略称に変換
    var shipping = (shippingType === 'エコノミー') ? 'eco' :
                   (shippingType === 'EX') ? 'xp' : null;

    if (!shipping) {
      return null;
    }

    // 状態を英語に変換
    var cond = (condition === '新品') ? 'new' :
               (condition === '中古') ? 'used' : null;

    if (!cond) {
      return null;
    }

    // Template_テンプレート名_状態_配送方法
    return 'Template_' + templateName + '_' + cond + '_' + shipping;

  } catch (e) {
    return null;
  }
}

/**
 * Policy_Masterデータをキャッシュから取得（30分間有効）
 * @private
 */
function getPolicyMasterDataCached_() {
  var cache = CacheService.getDocumentCache();
  var cacheKey = 'POLICY_MASTER_DATA';

  // キャッシュから取得を試みる
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // パースエラーの場合はキャッシュを無視
    }
  }

  // キャッシュがない場合はシートから読み込み
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Policy_Master');

  if (!sheet) {
    return null;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  // A列:ID、B列:名称、C列:送料上乗せ を取得
  var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

  // キャッシュに保存（30分 = 1800秒）
  try {
    cache.put(cacheKey, JSON.stringify(data), 1800);
  } catch (e) {
    // キャッシュ保存エラーは無視（データは返す）
  }

  return data;
}

/**
 * Policy_Masterキャッシュをクリア
 */
function clearPolicyMasterCache() {
  var cache = CacheService.getDocumentCache();
  cache.remove('POLICY_MASTER_DATA');
  showAlert('Policy_Masterのキャッシュをクリアしました。', 'success');
}

/**
 * シッピングポリシーIDを取得するカスタム関数
 *
 * @param {string} categoryDisplay - カテゴリー表示名（O1セル）
 * @param {number} priceUSD - 販売価格（R列）
 * @param {string} condition - 商品状態（AE列: 新品/中古）
 * @param {string} shippingMethod - 配送方法（X列: CF/CD/EL/EP/CEなど）
 * @return {number|string} シッピングポリシーID、またはエラーメッセージ
 * @customfunction
 */
function GET_SHIPPING_POLICY_ID(categoryDisplay, priceUSD, condition, shippingMethod) {
  try {
    // 入力チェック
    if (!categoryDisplay || !priceUSD || !condition || !shippingMethod) {
      return '';
    }

    // 価格の検証
    var price = Number(priceUSD);
    if (isNaN(price) || price <= 0) {
      return 'エラー';
    }

    // 配送方法を配送タイプに変換
    var shippingType = convertShippingMethodToType_(shippingMethod);
    if (shippingType === 'エラー') {
      return 'エラー';
    }

    // 状態の検証
    if (condition !== '新品' && condition !== '中古') {
      return 'エラー';
    }

    // カテゴリーから送料上限を取得
    var shippingLimit = getShippingLimitForCategory_(categoryDisplay);

    // 価格調整（関税率差を考慮）
    var adjustedPrice = calculateAdjustedPriceForPolicy_(price);

    // Policy_Masterからキャッシュ経由でデータ取得
    var data = getPolicyMasterDataCached_();

    if (!data) {
      return 'エラー';
    }

    if (data.length === 0) {
      return '該当なし';
    }
    var candidates = [];

    for (var i = 0; i < data.length; i++) {
      var id = data[i][0];
      var name = String(data[i][1] || '');
      var shippingFee = data[i][2];

      // 空行やヘッダー行をスキップ
      if (!name || name.indexOf('【') !== -1) {
        continue;
      }

      // ポリシー名をパース
      var parsed = parseShippingPolicyName_(name);
      if (!parsed) continue;

      // 基本条件チェック
      if (parsed.condition !== condition) continue;
      if (parsed.shippingType !== shippingType) continue;
      if (adjustedPrice < parsed.minPrice || adjustedPrice > parsed.maxPrice) continue;

      // 送料上限チェック
      if (shippingLimit !== null && typeof shippingFee === 'number' && shippingFee > shippingLimit) {
        continue;
      }

      // 条件に合致
      candidates.push({
        id: id,
        shippingFee: shippingFee
      });
    }

    if (candidates.length === 0) {
      return '該当なし';
    }

    // 最初に見つかったものを返す
    var result = candidates[0].id;
    return typeof result === 'number' ? result : Number(result);

  } catch (e) {
    return 'エラー';
  }
}

/**
 * シッピングポリシーIDを取得するカスタム関数（初期設定用・Import_Policies参照版）
 *
 * @param {string} categoryDisplay - カテゴリー表示名（O1セル）
 * @param {number} estimatedTax - 想定関税（AD列）
 * @param {string} condition - 商品状態（AE列: 新品/中古）
 * @param {string} shippingMethod - 配送方法（X列: CF/CD/EL/EP/CEなど）
 * @return {number|string} シッピングポリシーID、またはエラーメッセージ
 * @customfunction
 */
function GET_SHIPPING_POLICY_FROM_IMPORT(categoryDisplay, estimatedTax, condition, shippingMethod) {
  try {
    // 入力チェック
    if (!categoryDisplay || !estimatedTax || !condition || !shippingMethod) {
      return '';
    }

    // 想定関税の検証
    var taxValue = Number(estimatedTax);
    if (isNaN(taxValue) || taxValue <= 0) {
      return 'エラー';
    }

    // DDU閾値のキャップはスプレッドシート数式側（AP2/AP3参照）で処理済み
    // AP3セルが唯一の閾値設定として機能する

    // 配送方法を配送タイプに変換
    var shippingType = convertShippingMethodToType_(shippingMethod);
    if (shippingType === 'エラー') {
      return 'エラー';
    }

    // 状態の検証
    if (condition !== '新品' && condition !== '中古') {
      return 'エラー';
    }

    // カテゴリーから送料上限を取得
    var shippingLimit = getShippingLimitForCategory_(categoryDisplay);

    // Import_Policiesからキャッシュ経由でデータ取得（最適化版）
    var data = getImportPoliciesDataCached_();

    if (!data) {
      return 'エラー';
    }

    if (data.length === 0) {
      return '該当なし';
    }

    // 状態を英語に変換
    var conditionEn = (condition === '新品') ? 'new' : 'used';

    // 配送タイプを略称に変換
    var typeAbbr = (shippingType === 'エコノミー') ? 'eco' : 'xp';

    var candidates = [];
    var maxPricePolicy = null;  // 最大maxPriceを持つポリシー（フォールバック用）
    var maxPriceValue = 0;

    for (var i = 0; i < data.length; i++) {
      var id = data[i][0];          // A列: Policy ID
      var name = data[i][1];        // B列: ポリシー名
      var shippingFee = data[i][2]; // C列: 送料
      var type = data[i][3];        // D列: 配送タイプ
      var cond = data[i][4];        // E列: 状態
      var minPrice = data[i][5];    // F列: 想定関税下限
      var maxPrice = data[i][6];    // G列: 想定関税上限

      // D列が空白 = 手動用 → スキップ
      if (!type) continue;

      // 基本条件チェック（数値比較で高速）
      if (cond !== conditionEn) continue;
      if (type !== typeAbbr) continue;

      // 送料上限チェック
      if (shippingLimit !== null && typeof shippingFee === 'number' && shippingFee > shippingLimit) {
        continue;
      }

      // 最大maxPriceを持つポリシーを記録（フォールバック用）
      if (maxPrice > maxPriceValue) {
        maxPriceValue = maxPrice;
        maxPricePolicy = {
          id: id,
          shippingFee: shippingFee
        };
      }

      // 想定関税が範囲内かチェック
      if (taxValue < minPrice || taxValue > maxPrice) continue;

      // 条件に合致
      candidates.push({
        id: id,
        shippingFee: shippingFee
      });
    }

    if (candidates.length === 0) {
      // 想定関税が最大値を超えている場合、最大のポリシーを返す
      if (maxPricePolicy !== null && taxValue > maxPriceValue) {
        var maxResult = maxPricePolicy.id;
        return typeof maxResult === 'number' ? maxResult : Number(maxResult);
      }

      // 上限内で見つからない場合、フォールバック検索を実行
      if (shippingLimit !== null) {
        var maxAllowedPolicy = null;
        var maxAllowedFee = 0;

        for (var j = 0; j < data.length; j++) {
          var fbId = data[j][0];
          var fbType = data[j][3];
          var fbCond = data[j][4];
          var fbFee = data[j][2];

          // D列が空白 = 手動用 → スキップ
          if (!fbType) continue;

          // 基本条件チェック（価格範囲は無視）
          if (fbCond !== conditionEn) continue;
          if (fbType !== typeAbbr) continue;

          // 送料が上限以下かチェック
          if (typeof fbFee !== 'number') continue;
          if (fbFee > shippingLimit) continue;

          // 上限内で最大の送料を探す
          if (fbFee > maxAllowedFee) {
            maxAllowedFee = fbFee;
            maxAllowedPolicy = fbId;
          }
        }

        if (maxAllowedPolicy !== null) {
          return typeof maxAllowedPolicy === 'number' ? maxAllowedPolicy : Number(maxAllowedPolicy);
        }
      }

      return '該当なし';
    }

    // 最初に見つかったものを返す
    var result = candidates[0].id;
    return typeof result === 'number' ? result : Number(result);

  } catch (e) {
    return 'エラー';
  }
}

/**
 * ポリシー名をパースして分解データを返す（Import_Policies用）
 *
 * @param {string} policyName - ポリシー名（例: "Egl_202510_eco_new_0001_0050"）
 * @return {Object|null} 分解データ {type, condition, minPrice, maxPrice}、手動判定用はnull
 *
 * 除外ルール:
 * - "Copy"が含まれる
 * - アンダースコア区切りで6要素未満
 * - 配送タイプがeco/xp以外
 * - 状態がnew/used以外
 * - 価格範囲が数字でない
 */
function parsePolicyNameForImport(policyName) {
  try {
    // 入力チェック
    if (!policyName || typeof policyName !== 'string') {
      return null;
    }

    // "Copy"が含まれる場合は手動判定用
    if (policyName.indexOf('Copy') !== -1) {
      return null;
    }

    // アンダースコアで分割
    var parts = policyName.split('_');

    // 新形式（5要素）: ['Egl', '2511-0000-0007', 'eco', 'new', '0003']
    if (parts.length === 5) {
      // 配送タイプ（3番目の要素）
      var shippingType = parts[2].toLowerCase();

      if (shippingType !== 'eco' && shippingType !== 'xp') {
        return null;
      }

      // 状態（4番目の要素）
      var condition = parts[3].toLowerCase();

      if (condition !== 'new' && condition !== 'used') {
        return null;
      }

      // 価格上限（最後の要素）
      var maxPrice = parseInt(parts[4], 10);

      if (isNaN(maxPrice)) {
        return null;
      }

      return {
        type: shippingType,    // 'eco' or 'xp'
        condition: condition,  // 'new' or 'used'
        minPrice: 0,          // 下限は並べ替え後に計算
        maxPrice: maxPrice
      };
    }

    // 旧形式（6要素以上）: ['Egl', '202510', 'eco', 'new', '0001', '0050']
    if (parts.length >= 6) {
      // 旧形式（販売価格ベース）を判定して除外
      // parts[1]がハイフンを含まない = 旧形式 → 手動判定用として除外
      if (parts[1].indexOf('-') === -1) {
        return null;  // 手動判定用として扱う
      }

      // 配送タイプ（3番目の要素）
      var shippingType = parts[2].toLowerCase();

      if (shippingType !== 'eco' && shippingType !== 'xp') {
        return null;
      }

      // 状態（4番目の要素）
      var condition = parts[3].toLowerCase();

      if (condition !== 'new' && condition !== 'used') {
        return null;
      }

      // 価格範囲の最小値（最後から2番目の要素）
      var minPriceStr = parts[parts.length - 2];
      var minPrice = parseInt(minPriceStr, 10);
      if (isNaN(minPrice)) {
        return null;
      }

      // 価格範囲の最大値（最後の要素）
      var maxPriceStr = parts[parts.length - 1];
      var maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : 99999;
      if (isNaN(maxPrice)) {
        maxPrice = 99999; // 上限なしの場合
      }

      // 価格範囲の調整: 連続した範囲を実現
      if (minPrice === 1) {
        minPrice = 0.01;  // 最初の範囲
      } else {
        minPrice = (minPrice - 1) + 0.01;
      }

      return {
        type: shippingType,    // 'eco' or 'xp'
        condition: condition,  // 'new' or 'used'
        minPrice: minPrice,
        maxPrice: maxPrice
      };
    }

    // その他の形式は対応しない
    return null;

  } catch (e) {
    return null;
  }
}

/**
 * 価格を価格ブラケットに変換（VLOOKUP用）
 *
 * @param {number} price - 価格（USD）
 * @param {string} shippingMethod - 配送方法（SP/CE/EMS/CF/CD/EL）
 * @return {number} 価格ブラケットの下限値
 * @customfunction
 *
 * 例:
 * - GET_PRICE_BRACKET(75, "SP") → 51
 * - GET_PRICE_BRACKET(275, "EMS") → 251
 */
function GET_PRICE_BRACKET(price, shippingMethod) {
  try {
    var p = Number(price);
    if (isNaN(p) || p < 0) return 1;

    var method = String(shippingMethod).toUpperCase();

    // EP/CE はエコノミー、それ以外はEX
    var isEco = (method === 'EP' || method === 'CE');

    if (isEco) {
      // エコノミーの価格帯（0-275）
      if (p <= 50) return 1;
      if (p <= 75) return 51;
      if (p <= 100) return 76;
      if (p <= 125) return 101;
      if (p <= 150) return 126;
      if (p <= 175) return 151;
      if (p <= 200) return 176;
      if (p <= 225) return 201;
      if (p <= 250) return 226;
      if (p <= 275) return 251;
      return 276;
    } else {
      // EX の価格帯（0-1400+）
      if (p <= 50) return 1;
      if (p <= 75) return 51;
      if (p <= 100) return 76;
      if (p <= 125) return 101;
      if (p <= 150) return 126;
      if (p <= 175) return 151;
      if (p <= 200) return 176;
      if (p <= 225) return 201;
      if (p <= 250) return 226;
      if (p <= 275) return 251;
      if (p <= 300) return 276;
      if (p <= 325) return 301;
      if (p <= 350) return 326;
      if (p <= 375) return 351;
      if (p <= 400) return 376;
      if (p <= 425) return 401;
      if (p <= 450) return 426;
      if (p <= 475) return 451;
      if (p <= 500) return 476;
      if (p <= 525) return 501;
      if (p <= 550) return 526;
      if (p <= 575) return 551;
      if (p <= 600) return 576;
      if (p <= 625) return 601;
      if (p <= 650) return 626;
      if (p <= 675) return 651;
      if (p <= 700) return 676;
      if (p <= 725) return 701;
      if (p <= 750) return 726;
      if (p <= 775) return 751;
      if (p <= 800) return 776;
      if (p <= 850) return 801;
      if (p <= 900) return 851;
      if (p <= 950) return 901;
      if (p <= 1000) return 951;
      if (p <= 1100) return 1001;
      if (p <= 1200) return 1101;
      if (p <= 1300) return 1201;
      if (p <= 1400) return 1301;
      return 1401;
    }
  } catch (e) {
    return 1;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  タグ自動判定ユーティリティ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * パーセント文字列を数値に変換（全角対応）
 * 例: '15%' → 0.15、'3％' → 0.03、0.15 → 0.15、null/空 → null
 * 変換失敗時はnull
 * @param {*} val
 * @return {number|null}
 */
function parsePercent_(val) {
  if (val == null || val === '') return null;
  var raw = String(val);
  var hasPercent = /[％%]/.test(raw);
  var s = raw
    .replace(/[％%]/g, '')
    .replace(/[０-９]/g, function(c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
    .trim();
  var n = Number(s);
  if (isNaN(n)) return null;
  // '%'付き（例: '15%' → 0.15, '1%' → 0.01）は必ず/100
  // '%'なし（例: 0.15 → 0.15）はそのまま
  if (hasPercent) return n / 100;
  return n;
}

/**
 * TagShippingシートからタグ名→設定値のマップを構築
 * 個別トグルが全てOFFの場合はnull
 * @param {Spreadsheet} ss
 * @param {Object} settings
 * @return {Object|null}
 */
function buildTagOverrideMap_(ss, settings) {
  if (!settings) return null;
  var anyOverride = settings.tagOverridePrompt || settings.tagOverrideTemplate ||
    settings.tagOverrideShippingCategory || settings.tagOverrideProfitRate ||
    settings.tagOverrideAdRate || settings.tagOverrideFeeRate ||
    settings.tagOverrideShipping || settings.tagOverrideLowShipping ||
    settings.tagOverrideHighShipping || settings.tagOverrideThreshold;
  if (!anyOverride) return null;
  var tsSheet = ss.getSheetByName(CONFIG.TAG_SHIPPING.SHEET_NAME);
  if (!tsSheet) return null;
  var lastRow = tsSheet.getLastRow();
  if (lastRow < 2) return null;
  var headers = CONFIG.TAG_SHIPPING.HEADERS;
  var data = tsSheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var map = {};
  for (var i = 0; i < data.length; i++) {
    var tag = String(data[i][0] || '').trim();
    if (!tag) continue;
    map[tag] = {
      template: data[i][headers.indexOf('テンプレート名')] || null,
      shippingCat: data[i][headers.indexOf('送料上限カテゴリ')] || null,
      profitRate: parsePercent_(data[i][headers.indexOf('利益率')]),
      adRate: parsePercent_(data[i][headers.indexOf('広告費率')]),
      feeRate: parsePercent_(data[i][headers.indexOf('手数料率')]),
      lowShip: data[i][headers.indexOf('低価格配送')] || null,
      highShip: data[i][headers.indexOf('高価格配送')] || null,
      threshold: (function(v) { var n = Number(v); return isNaN(n) ? null : n; })(data[i][headers.indexOf('送料切替基準')])
    };
  }
  return map;
}

/**
 * カテゴリーから送料上限を取得（カスタム関数用）
 * @private
 */
function getShippingLimitForCategory_(categoryDisplay) {
  try {
    var categories = CONFIG.SHIPPING_POLICY_CATEGORIES;

    // O1の形式から変換: 'Video Games（$20）' → 'Video Games'
    var categoryName = String(categoryDisplay || '').trim();

    // 全角括弧「（」より前の部分を抽出
    var parenIndex = categoryName.indexOf('（');
    if (parenIndex !== -1) {
      categoryName = categoryName.substring(0, parenIndex).trim();
    }

    // '汎用（上限なし）' → null（上限なし）
    if (categoryName === '汎用' || categoryName.indexOf('汎用') !== -1) {
      return null;
    }

    // 'Game Consoles' → 'Video Game Consoles' に変換
    if (categoryName === 'Game Consoles') {
      categoryName = 'Video Game Consoles';
    }

    if (categories[categoryName] && typeof categories[categoryName].limit !== 'undefined') {
      return categories[categoryName].limit;
    }

    // カテゴリーが見つからない場合は「その他」扱い（上限なし）
    return null;

  } catch (e) {
    return null;
  }
}

/**
 * ポリシー判定用の調整後価格を計算（カスタム関数用・簡易版）
 * @private
 */
function calculateAdjustedPriceForPolicy_(priceUSD) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return priceUSD; // シートが見つからない場合はそのまま
    }

    // DDU価格が無効な場合はそのまま返す
    if (isNaN(priceUSD) || priceUSD <= 0) {
      return priceUSD;
    }

    // 基準関税率（固定）
    var BASE_RATE = 0.15;

    // セルから値を取得
    var safetyFactor = Number(sheet.getRange('AG2').getValue()) || 1.35;
    var customsFee = Number(sheet.getRange('AE1').getValue()) || 10;
    var currentRate = Number(sheet.getRange('AF2').getValue()) || 0.15;

    // 基準関税（15%想定）
    var baseEstimatedTax = priceUSD * BASE_RATE * safetyFactor + customsFee;

    // 現在の関税（39%など）
    var currentEstimatedTax = priceUSD * currentRate * safetyFactor + customsFee;

    // 送料差額（5ドル刻みで切り捨て）
    var shippingDiff = Math.floor((currentEstimatedTax - baseEstimatedTax) / 5) * 5;

    // 価格帯換算（送料$5 → 価格帯$25の比率）
    var priceBandAdjustment = shippingDiff * 5;

    // 調整後価格
    var adjustedPrice = priceUSD + priceBandAdjustment;

    return adjustedPrice;

  } catch (e) {
    return priceUSD; // エラー時はそのまま
  }
}

/**
 * Import_Policiesデータをキャッシュから取得（30分間有効）
 * @private
 */
function getImportPoliciesDataCached_() {
  var cache = CacheService.getDocumentCache();
  var cacheKey = 'IMPORT_POLICIES_DATA';

  // キャッシュから取得を試みる
  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // パースエラーの場合はキャッシュを無視
    }
  }

  // キャッシュにない場合はImport_Policiesから読み込む
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Import_Policies');

  if (!sheet) {
    return null;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  // A-G列を取得（範囲を500行に限定）
  var maxRow = Math.min(lastRow, 500);
  var data = sheet.getRange(2, 1, maxRow - 1, 7).getValues();

  // キャッシュに保存（30分間）
  try {
    cache.put(cacheKey, JSON.stringify(data), 1800);
  } catch (e) {
    // キャッシュ保存失敗は無視（データは返す）
  }

  return data;
}

/**
 * シッピングポリシー名称から情報をパース（カスタム関数用）
 * @private
 */
function parseShippingPolicyName_(policyName) {
  try {
    if (!policyName || typeof policyName !== 'string') {
      return null;
    }

    // アンダースコアで分割
    var parts = policyName.split('_');

    // 最低限必要な要素数チェック（6要素以上）
    if (parts.length < 6) {
      return null;
    }

    // 配送タイプ（eco/xp）
    var shippingTypeRaw = parts[2].toLowerCase();
    var shippingType = (shippingTypeRaw === 'eco') ? 'エコノミー' :
                       (shippingTypeRaw === 'xp') ? 'EX' : null;

    if (!shippingType) {
      return null;
    }

    // 状態（new/used）
    var conditionRaw = parts[3].toLowerCase();
    var condition = (conditionRaw === 'new') ? '新品' :
                    (conditionRaw === 'used') ? '中古' : null;

    if (!condition) {
      return null;
    }

    // 価格範囲（最後の2要素）
    var minPriceStr = parts[parts.length - 2];
    var maxPriceStr = parts[parts.length - 1];

    var minPrice = parseInt(minPriceStr, 10);
    var maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : 999999;

    if (isNaN(minPrice)) {
      return null;
    }

    // _0001_0050 → 1～50（50.00以下）
    var adjustedMin = minPrice === 1 ? minPrice : minPrice - 0.99;

    return {
      shippingType: shippingType,
      condition: condition,
      minPrice: adjustedMin,
      maxPrice: isNaN(maxPrice) ? 999999 : maxPrice
    };

  } catch (e) {
    return null;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料モード共通関数（Single Source of Truth）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * AJ5セルの日本語ラベルを内部コードに変換する
 * @param {Sheet} sheet - 作業シート
 * @return {string} 内部コード（TABLE/FIXED/GAME_CARD/TAG_SHIPPING）
 */
function getShippingCalcMethodFromLabel_(sheet) {
  var LABEL_TO_CODE = {
    'テーブル計算': 'TABLE',
    '固定金額': 'FIXED',
    'ゲーム・トレカ': 'GAME_CARD',
    'タグ別送料': 'TAG_SHIPPING'
  };
  var label = String(sheet.getRange('AJ5').getValue()).trim();
  var code = LABEL_TO_CODE[label];
  if (!code) {
    Logger.log('[getShippingCalcMethodFromLabel_] 不明なラベル: "' + label + '" → TABLEにフォールバック');
    return 'TABLE';
  }
  return code;
}

/**
 * 内部コードを日本語ラベルに変換する
 * @param {string} code - 内部コード（TABLE/FIXED/GAME_CARD/TAG_SHIPPING）
 * @return {string} 日本語ラベル
 */
function getLabelFromShippingCalcMethod_(code) {
  var CODE_TO_LABEL = {
    'TABLE': 'テーブル計算',
    'FIXED': '固定金額',
    'GAME_CARD': 'ゲーム・トレカ',
    'TAG_SHIPPING': 'タグ別送料'
  };
  return CODE_TO_LABEL[code] || 'テーブル計算';
}

/**
 * 送料モードに応じたT列・F列の式を生成する（Formula Factory）
 * applyCalculationFormulas / setFormulas / batchCalculateFormulas の全てがこの関数を使う
 *
 * @param {number} row - 行番号
 * @param {string} shippingCalcMethod - 内部コード（TABLE/FIXED/GAME_CARD/TAG_SHIPPING）
 * @return {Object} { shippingFormula: string, refEbayFormula: string|null }
 */
function buildShippingFormulas_(row, shippingCalcMethod) {
  if (shippingCalcMethod === 'FIXED') {
    return {
      shippingFormula: '=IF(I' + row + '="","",IF($J$1<>"", $J$1, VLOOKUP(I' + row + ',Profit_Amounts!$A$2:$D$8,4,TRUE)))',
      refEbayFormula: null
    };
  }

  if (shippingCalcMethod === 'GAME_CARD') {
    var tableFormula = 'IF(X' + row + '="CF",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$1,subtotal,base+extra,fuel,subtotal*$V$1,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),IF(X' + row + '="CD",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$2,subtotal,base+extra,fuel,subtotal*$V$2,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),ROUND(AF' + row + ')))';
    return {
      shippingFormula: '=IF(I' + row + '="","",IF(OR($AJ$4="",$AJ$4<=0),' + tableFormula + ',IF(I' + row + '<=$AJ$4,$J$1,' + tableFormula + ')))',
      refEbayFormula: null
    };
  }

  if (shippingCalcMethod === 'TAG_SHIPPING') {
    var tsName = CONFIG.TAG_SHIPPING.SHEET_NAME;
    return {
      shippingFormula: '=IF(D' + row + '="","",IF(X' + row + '="","#配送方法未設定",IFERROR(INDEX(' + tsName + '!B:D,MATCH(D' + row + ',' + tsName + '!A:A,0),SWITCH(X' + row + ',"EP",1,"ePacket",1,"CE",2,"Cpass-Economy",2,"CF",3,"Cpass-FedEx",3,"CD",3,"Cpass-DHL",3,"EL",3,"eLogistics",3)),"#タグ未登録")))',
      refEbayFormula: '=IF(D' + row + '="","",IFERROR(INDEX(' + tsName + '!E:E,MATCH(D' + row + ',' + tsName + '!A:A,0)),""))'
    };
  }

  // TABLE（デフォルト）
  return {
    shippingFormula: '=IF(AF' + row + '="","",IF(X' + row + '="CF",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$1,subtotal,base+extra,fuel,subtotal*$V$1,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),IF(X' + row + '="CD",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$2,subtotal,base+extra,fuel,subtotal*$V$2,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),ROUND(AF' + row + '))))',
    refEbayFormula: null
  };
}

/**
 * SKU自動生成（値として書き込み）
 * TagShippingシートのF列（SKU略称）とD列（タグ）・A列（日付）を使用
 * C列が空の行にのみSKUを生成する。選択行のみを対象とし、非選択行は一切触らない。
 *
 * @param {Sheet} sheet - 作業シート
 * @param {number[]} targetRows - 対象行番号の配列（例: [5, 7, 10]）
 * @return {Object} { generated: number, skipped: number, warnings: string[] }
 */
function generateSkuForRows_(sheet, targetRows) {
  var result = { generated: 0, skipped: 0, warnings: [] };

  if (!targetRows || targetRows.length === 0) {
    return result;
  }

  // 1. TagShippingシートからタグ→略称マップを作成
  var ss = sheet.getParent();
  var tsSheet = ss.getSheetByName(CONFIG.TAG_SHIPPING.SHEET_NAME);
  if (!tsSheet) {
    Logger.log('[generateSkuForRows_] TagShippingシートが存在しません。SKU生成をスキップします。');
    return result;
  }

  var tsLastRow = tsSheet.getLastRow();
  if (tsLastRow < 2) {
    Logger.log('[generateSkuForRows_] TagShippingシートにデータがありません。SKU生成をスキップします。');
    return result;
  }

  // ヘッダーに基づきA列（タグ名）と「SKU略称」列を取得
  var skuColIndex = CONFIG.TAG_SHIPPING.HEADERS.indexOf('SKU略称');
  var tsData = tsSheet.getRange(2, 1, tsLastRow - 1, CONFIG.TAG_SHIPPING.HEADERS.length).getValues();
  var tagToCode = {};
  var hasAnyCode = false;
  for (var t = 0; t < tsData.length; t++) {
    var tagName = String(tsData[t][0] || '').trim();
    var skuCode = String(tsData[t][skuColIndex] || '').trim();
    if (tagName && skuCode) {
      // バリデーション: 半角英数字のみ
      if (/^[A-Za-z0-9]+$/.test(skuCode)) {
        tagToCode[tagName] = skuCode.toLowerCase();
        hasAnyCode = true;
      } else {
        result.warnings.push('SKU略称に無効な文字: 「' + tagName + '」→「' + skuCode + '」（半角英数字のみ使用可）');
      }
    }
  }

  // 暗黙OFF: F列に略称が1つもなければスキップ
  if (!hasAnyCode) {
    Logger.log('[generateSkuForRows_] TagShippingシートにSKU略称が設定されていません。SKU生成をスキップします。');
    return result;
  }

  // 2. C列の既存SKU値を全行走査（最大連番取得用）
  var dataLastRow = sheet.getLastRow();
  var existingSkus = {};  // key: 略称+yymmdd, value: 最大連番
  var SKU_PATTERN = /^([a-z0-9]+)(\d{6})(\d{3,})$/;

  if (dataLastRow >= 5) {
    var allCValues = sheet.getRange(5, CONFIG.COLUMNS.LABEL, dataLastRow - 4, 1).getValues();
    for (var c = 0; c < allCValues.length; c++) {
      var existingSku = String(allCValues[c][0] || '').trim().toLowerCase();
      var match = existingSku.match(SKU_PATTERN);
      if (match) {
        var key = match[1] + match[2];  // 略称+日付
        var seq = parseInt(match[3], 10);
        if (!existingSkus[key] || seq > existingSkus[key]) {
          existingSkus[key] = seq;
        }
      }
    }
  }

  // 3. 対象行のデータをバルク取得（範囲を1回で読み、対象行のみ処理）
  var minRow = targetRows[0];
  var maxRow = targetRows[targetRows.length - 1];
  var numRows = maxRow - minRow + 1;
  var rowData = sheet.getRange(minRow, 1, numRows, CONFIG.COLUMNS.TAG).getValues(); // A〜D列

  // 対象行を高速検索するためのマップ
  var targetRowSet = {};
  for (var r = 0; r < targetRows.length; r++) {
    targetRowSet[targetRows[r]] = true;
  }

  var today = new Date();
  var warningTags = {};
  var writeOperations = [];  // { row: number, sku: string }

  for (var i = 0; i < numRows; i++) {
    var actualRow = minRow + i;

    // 対象行でなければスキップ（非選択行は一切触らない）
    if (!targetRowSet[actualRow] || actualRow < 5) {
      continue;
    }

    var cValue = String(rowData[i][CONFIG.COLUMNS.LABEL - 1] || '').trim();
    var dValue = String(rowData[i][CONFIG.COLUMNS.TAG - 1] || '').trim();

    // a. C列が空でなければスキップ
    if (cValue !== '') {
      result.skipped++;
      continue;
    }

    // b. D列が空ならスキップ
    if (dValue === '') {
      result.skipped++;
      continue;
    }

    // c. 略称を取得
    var code = tagToCode[dValue];
    if (!code) {
      result.skipped++;
      if (!warningTags[dValue]) {
        warningTags[dValue] = true;
        result.warnings.push('SKU略称未設定: 「' + dValue + '」');
      }
      continue;
    }

    // d. A列の日付を取得（空/無効なら今日の日付）
    var dateVal = rowData[i][CONFIG.COLUMNS.DATE - 1];
    var dateObj;
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      dateObj = dateVal;
    } else if (dateVal) {
      dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) {
        dateObj = today;
      }
    } else {
      dateObj = today;
    }

    // e. yymmddフォーマット
    var yy = String(dateObj.getFullYear()).slice(-2);
    var mm = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    var dd = ('0' + dateObj.getDate()).slice(-2);
    var dateStr = yy + mm + dd;

    // f. 最大連番+1
    var seqKey = code + dateStr;
    var nextSeq = (existingSkus[seqKey] || 0) + 1;
    existingSkus[seqKey] = nextSeq;  // 次の行のために更新

    // g. SKU生成
    var sku = code + dateStr + ('000' + nextSeq).slice(-3);
    writeOperations.push({ row: actualRow, sku: sku });
    result.generated++;
  }

  // 4. 対象行のみに書き込み（非選択行は一切触らない）
  for (var w = 0; w < writeOperations.length; w++) {
    sheet.getRange(writeOperations[w].row, CONFIG.COLUMNS.LABEL).setValue(writeOperations[w].sku);
  }

  // 5. ログ出力
  Logger.log('[generateSkuForRows_] SKU生成完了: 生成=' + result.generated + ', スキップ=' + result.skipped + ', 警告=' + result.warnings.length);
  if (result.warnings.length > 0) {
    Logger.log('[generateSkuForRows_] 警告: ' + result.warnings.join(' / '));
  }

  return result;
}
