/******************************************************
 * Main.gs - ユーザー側シート用ラッパー
 *
 * ライブラリ「BulkToolsLib」の全公開関数を呼び出す
 ******************************************************/
var LIB = BulkToolsLib;

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メニュー・初期化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function onOpen() {
  LIB.onOpen();
}
function initialSetup() { LIB.initialSetup(); }
function openSimpleSetup() { LIB.openSimpleSetup(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳・AI処理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function translateSelectedRows() { LIB.translateSelectedRows(); }
function translateAll() { LIB.translateAll(); }
function runSelectedRows() { LIB.runSelectedRows(); }
function runSelectedRowsBatch() { LIB.runSelectedRowsBatch(); }
function runSelectedRowsCalculate() { LIB.runSelectedRowsCalculate(); }
function runSelectedRowsComplete() { LIB.runSelectedRowsComplete(); }
function runSelectedRowsCompleteBatch() { LIB.runSelectedRowsCompleteBatch(); }
function runSelectedRowsTranslate() { LIB.runSelectedRowsTranslate(); }
function runSanitizeSelectedRows() { if (LIB.runSanitizeSelectedRows) { LIB.runSanitizeSelectedRows(); } }
function restoreSanitizeSelectedRows() { if (LIB.restoreSanitizeSelectedRows) { LIB.restoreSanitizeSelectedRows(); } }
function runSimpleSelected() { LIB.runSimpleSelected(); }
function simpleTranslateSelectedRows() { LIB.simpleTranslateSelectedRows ? LIB.simpleTranslateSelectedRows() : runSimpleSelected(); }
function simpleTranslateAll() { LIB.simpleTranslateAll ? LIB.simpleTranslateAll() : null; }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  バッチ処理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function continueBatchProcessing() { LIB.continueBatchProcessing(); }
function resumeBatchProcessing() { LIB.resumeBatchProcessing(); }
function cancelBatchProcessing() { LIB.cancelBatchProcessing(); }
function checkBatchProgress() { LIB.checkBatchProgress(); }
function checkProcessingStatus() { LIB.checkProcessingStatus(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料・配送関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function calculateShippingForSelectedRows() { LIB.calculateShippingForSelectedRows(); }
function calculateShippingForAll() { LIB.calculateShippingForAll ? LIB.calculateShippingForAll() : null; }
function applyShippingCalculations() { LIB.applyShippingCalculations(); }
function refreshShippingCalculation() { LIB.refreshShippingCalculation(); }
function setupShippingTables() { LIB.setupShippingTables(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  計算式関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyCalculationFormulas() { LIB.applyCalculationFormulas(); }
function reapplyCalculationFormulasToSelectedRows() { LIB.reapplyCalculationFormulasToSelectedRows(); }
function clearAndReapplyFormulas() { LIB.clearAndReapplyFormulas(); }
function fixPriceFormula() { LIB.fixPriceFormula(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート・ポリシー関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyTemplateToSelectedRows() { LIB.applyTemplateToSelectedRows ? LIB.applyTemplateToSelectedRows() : null; }
function applyShippingPolicyToSelectedRows() { LIB.applyShippingPolicyToSelectedRows ? LIB.applyShippingPolicyToSelectedRows() : null; }
function applyShippingPolicyWithCategory() { LIB.applyShippingPolicyWithCategory(); }
function setTemplateAndPolicyForSelectedRows() { LIB.setTemplateAndPolicyForSelectedRows(); }
function autoApplyTemplateAndPolicy() { LIB.autoApplyTemplateAndPolicy(); }
function updateTemplatePolicyOnly() { LIB.updateTemplatePolicyOnly(); }
function updateAllTemplates() { LIB.updateAllTemplates(); }
function showUnifiedCategoryDialog() { LIB.showUnifiedCategoryDialog(); }
function showCategorySelectionDialog() { LIB.showCategorySelectionDialog(); }
function showShippingPolicyCategoryDialog() { LIB.showShippingPolicyCategoryDialog(); }
function showTemplateManualSearchDialog() { LIB.showTemplateManualSearchDialog(); }
function showShippingPolicyManualSearchDialog() { LIB.showShippingPolicyManualSearchDialog(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  データ保存・インポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function saveSelectedRowsAndClear() { LIB.saveSelectedRowsAndClear(); }
function clearSelectedRowsOnly() { LIB.clearSelectedRowsOnly(); }
function simpleSaveSelectedRowsAndClear() { LIB.simpleSaveSelectedRowsAndClear(); }
function simpleClearSelectedRowsOnly() { LIB.simpleClearSelectedRowsOnly(); }
function showDataImportDialog() { LIB.showDataImportDialog(); }
function showSettingsImportDialog() { LIB.showSettingsImportDialog(); }
function importSettings(config) { return LIB.importSettings(config); }
function importSelectedSettings(config) { return LIB.importSelectedSettings(config); }
function importAllSettings(config) { return LIB.importAllSettings(config); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  重複チェック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runDuplicateCheck() { LIB.runDuplicateCheck ? LIB.runDuplicateCheck() : DUPLICATE_CHECK(); }
function DUPLICATE_CHECK() { LIB.DUPLICATE_CHECK(); }
function showDuplicateCheckSettings() { LIB.showDuplicateCheckSettings(); }
function applyDuplicateCheckConditionalFormatting() { LIB.applyDuplicateCheckConditionalFormatting(); }
function applyDuplicateFormulaToSheet() { LIB.applyDuplicateFormulaToSheet(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格計算ツール
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function showPriceCalculator() { LIB.showPriceCalculator ? LIB.showPriceCalculator() : showPriceCalc(); }
function showPriceCalc() { LIB.showPriceCalc(); }
function calcPriceFromMargin(params) { return LIB.calcPriceFromMargin(params); }
function calcBreakEvenFromSelling(params) { return LIB.calcBreakEvenFromSelling(params); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  プロンプト関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function showPromptEditorSidebar() { LIB.showPromptEditorSidebar(); }
function getAllPromptIds() { return LIB.getAllPromptIds(); }
function getPromptContent(promptId) { return LIB.getPromptContent(promptId); }
function savePromptContent(promptId, content) { return LIB.savePromptContent(promptId, content); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  為替・レート関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function updateExchangeRate() { LIB.updateExchangeRate(); }
function updateExchangeRateAutomatically() { LIB.updateExchangeRateAutomatically(); }
function setupExchangeRateUpdateTrigger() { LIB.setupExchangeRateUpdateTrigger(); }
function removeExchangeRateUpdateTrigger() { LIB.removeExchangeRateUpdateTrigger(); }
function isExchangeRateUpdateTriggerActive() { return LIB.isExchangeRateUpdateTriggerActive(); }
function checkExchangeRateUpdateStatus() { LIB.checkExchangeRateUpdateStatus(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EAGLE連携
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function fetchEagleData() { LIB.fetchEagleData(); }
function updateEagleData() { LIB.updateEagleData(); }
function fetchShippingPoliciesFromEagle() { return LIB.fetchShippingPoliciesFromEagle(); }
function fetchTemplatesFromEagle() { return LIB.fetchTemplatesFromEagle(); }
function saveAndExecuteSetup(apiToken, selectedColumns, fetchTemplatePolicy) { return LIB.saveAndExecuteSetup(apiToken, selectedColumns, fetchTemplatePolicy); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  設定取得・保存（HTML呼び出し用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getSettings() { return LIB.getSettings(); }
function getSimpleSettings() { return LIB.getSimpleSettings(); }
function saveSimpleSettings(apiKey) { return LIB.saveSimpleSettings(apiKey); }
function saveIntegratedSettings(formData) { return LIB.saveIntegratedSettings(formData); }
function saveDuplicateCheckSettings(settings) { return LIB.saveDuplicateCheckSettings(settings); }
function disableDuplicateCheck() { return LIB.disableDuplicateCheck(); }
function getOutputAvailableSheets() { return LIB.getOutputAvailableSheets ? LIB.getOutputAvailableSheets() : LIB.getAllSheetNames(); }
function saveIntegratedDuplicateCheckSettings(settings) { return LIB.saveIntegratedDuplicateCheckSettings(settings); }
function getDuplicateCheckSettings() { return LIB.getDuplicateCheckSettings(); }
function getAllSheetNames() { return LIB.getAllSheetNames(); }
function getCurrentSettings() { return LIB.getCurrentSettings(); }
function getPreviousSettings() { return LIB.getPreviousSettings(); }
function checkCurrentSettings() { return LIB.checkCurrentSettings(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート・ポリシー取得（HTML呼び出し用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getTemplateNameList() { return LIB.getTemplateNameList(); }
function getManualPolicies() { return LIB.getManualPolicies(); }
function getTemplateCategoryOptions() { return LIB.getTemplateCategoryOptions(); }
function getShippingPolicyCategories() { return LIB.getShippingPolicyCategories(); }
function getCategoryListFromReferenceData() { return LIB.getCategoryListFromReferenceData(); }
function getTemplateFromReferenceData(category) { return LIB.getTemplateFromReferenceData(category); }
function getTemplateFromReferenceData4D(p1, p2, p3, p4) { return LIB.getTemplateFromReferenceData4D(p1, p2, p3, p4); }
function searchTemplateManually(keyword) { return LIB.searchTemplateManually(keyword); }
function searchShippingPolicyManually(keyword) { return LIB.searchShippingPolicyManually(keyword); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ選択関連（HTML呼び出し用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function handleCategorySelection(category) { return LIB.handleCategorySelection(category); }
function saveSelectedCategory(category) { return LIB.saveSelectedCategory(category); }
function getSavedCategory() { return LIB.getSavedCategory(); }
function clearSavedCategory() { return LIB.clearSavedCategory(); }
function getCategoryForTemplate() { return LIB.getCategoryForTemplate(); }
function getCategoryForShippingPolicy() { return LIB.getCategoryForShippingPolicy(); }
function getShippingLimitForCategory(category) { return LIB.getShippingLimitForCategory(category); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  統合設定関連（HTML呼び出し用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyUnifiedSettings(settings) { return LIB.applyUnifiedSettings(settings); }
function applyUnifiedSettingsWithSave(settings) { return LIB.applyUnifiedSettingsWithSave(settings); }
function setTemplateToWorkSheet(templateName) { return LIB.setTemplateToWorkSheet(templateName); }
function setShippingPolicyToRow(policyName, row) { return LIB.setShippingPolicyToRow(policyName, row); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  インポート関連（HTML呼び出し用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getSourceSheetsInfo(spreadsheetId) { return LIB.getSourceSheetsInfo(spreadsheetId); }
function getSheetPreview(spreadsheetId, sheetName) { return LIB.getSheetPreview(spreadsheetId, sheetName); }
function getSourceSettings(spreadsheetId) { return LIB.getSourceSettings(spreadsheetId); }
function validateAndApplyImport(config) { return LIB.validateAndApplyImport(config); }
function importWithUnifiedSettings(config) { return LIB.importWithUnifiedSettings(config); }
function validateImportData(config) { return LIB.validateImportData(config); }
function getSettingsFromSource(spreadsheetId) { return LIB.getSettingsFromSource(spreadsheetId); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格表示モード
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getPriceDisplayMode() { return LIB.getPriceDisplayMode(); }
function setPriceDisplayMode(mode, showMessage) { return LIB.setPriceDisplayMode(mode, showMessage); }
function updateListingSheetPrice() { LIB.updateListingSheetPrice(); }
function updateListingSheetPriceFormula(sheetName, mode) { LIB.updateListingSheetPriceFormula(sheetName, mode); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  進捗・プログレス関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getProgressData() { return LIB.getProgressData(); }
function showProgressNotification(message) { LIB.showProgressNotification(message); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  デバッグ・テスト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function testApiConnection() { LIB.testApiConnection(); }
function debugApiCall() { LIB.debugApiCall(); }
function showCurrentSetupStatus() { LIB.showCurrentSetupStatus(); }
function confirmCurrentSettings() { LIB.confirmCurrentSettings(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  APIトークン関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function manageApiToken() { LIB.manageApiToken(); }
function getApiToken() { return LIB.getApiToken(); }
function saveApiToken(token) { return LIB.saveApiToken(token); }
function clearApiToken() { LIB.clearApiToken(); }
function getApiTokenDialog() { LIB.getApiTokenDialog(); }
function saveApiTokenAndColumnsFromDialog(token, columns) { return LIB.saveApiTokenAndColumnsFromDialog(token, columns); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  その他ユーティリティ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function showAlert(message, type) { LIB.showAlert(message, type); }
function getSelectedRows() { return LIB.getSelectedRows(); }
function getTargetRows() { return LIB.getTargetRows(); }
function listSavedSheets() { return LIB.listSavedSheets(); }
function openReadme() { LIB.openReadme(); }
function showImportGuide() { LIB.showImportGuide(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  インポート用シート関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function adjustSelectedRowHeights() { LIB.adjustSelectedRowHeights(); }
function resetSelectedRowHeights() { LIB.resetSelectedRowHeights(); }
function clearSelectedRowsSafely() { LIB.clearSelectedRowsSafely(); }
function copyToWorkSheet() { LIB.copyToWorkSheet(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  HTMLテンプレート関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function createHtmlFromTemplate(templateName) { return LIB.createHtmlFromTemplate(templateName); }
function getHtmlTemplate(templateName) { return LIB.getHtmlTemplate(templateName); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カスタム関数（スプレッドシート用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function SHIPPING_COST(method, weight, volume) { return LIB.SHIPPING_COST(method, weight, volume); }
function SHIPPING_COST_FOR_CALCULATOR(weight, length, width, height, method, costYen) { return LIB.SHIPPING_COST_FOR_CALCULATOR(weight, length, width, height, method, costYen); }
function GET_SHIPPING_POLICY_ID(name) { return LIB.GET_SHIPPING_POLICY_ID ? LIB.GET_SHIPPING_POLICY_ID(name) : LIB.findShippingPolicyId(name); }
function GET_TEMPLATE_ID(name) { return LIB.GET_TEMPLATE_ID ? LIB.GET_TEMPLATE_ID(name) : LIB.findTemplateId(name); }
function GET_PRICE_BRACKET(price) { return LIB.GET_PRICE_BRACKET(price); }
function GET_SHIPPING_POLICY_FROM_IMPORT(categoryDisplay, estimatedTax, condition, shippingMethod) { return LIB.GET_SHIPPING_POLICY_FROM_IMPORT(categoryDisplay, estimatedTax, condition, shippingMethod); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Webアプリ用エントリーポイント（拡張機能連携）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 拡張機能からのPOSTリクエストを受け取る
 * ※ライブラリの関数はWebアプリのエントリーポイントにならないため、
 *   ユーザースクリプト側で定義が必要
 */
function doPost(e) {
  // ─────────────────────────────────────────────
  // 設定値（GAS WebApp の制約に合わせたソフトリミット）
  // ─────────────────────────────────────────────
  var LOCK_TIMEOUT_MS = 30000;          // 30 秒（GAS LockService.waitLock の最大値）
  var MAX_ROWS_PER_REQUEST = 50;        // 1 リクエストあたりの最大件数（6 分制限の保険）
  var MAX_EXEC_MS = 270000;             // 4.5 分。残り行は skipped で返す（6 分制限の保険）

  // ─────────────────────────────────────────────
  // リクエスト解析 + 一括/単一モード判定
  // ─────────────────────────────────────────────
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (parseError) {
    return _doPostJsonResponse_({
      success: false,
      error: 'invalid JSON: ' + parseError.toString()
    });
  }

  // 一括モード判定: data.rows が配列なら一括モード（data.values と両方ある場合も rows 優先）
  var isBulkMode = Array.isArray(data.rows);
  var rows;
  if (isBulkMode) {
    rows = data.rows;
  } else {
    // 既存単一件モードを内部的に 1 件の配列に正規化
    rows = [{ values: data.values, sheetName: data.sheetName, topImagesBase64: data.topImagesBase64, topImageBase64: data.topImageBase64 }];
  }

  // 件数バリデーション
  if (isBulkMode && rows.length === 0) {
    return _doPostJsonResponse_({
      success: false,
      error: 'rows is empty'
    });
  }
  if (rows.length > MAX_ROWS_PER_REQUEST) {
    return _doPostJsonResponse_({
      success: false,
      error: 'rows count ' + rows.length + ' exceeds limit ' + MAX_ROWS_PER_REQUEST
    });
  }

  // ─────────────────────────────────────────────
  // LockService で書き込みを直列化（race condition 対策）
  // ─────────────────────────────────────────────
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (lockError) {
    // 30 秒待っても他リクエストが解放しなかった場合、明示的なエラーを返す
    // この時点でロックは未取得なので releaseLock 不要
    return _doPostJsonResponse_({
      success: false,
      error: 'lock_timeout'
    });
  }

  // ─────────────────────────────────────────────
  // 各行を順次処理（部分成功 OK、try/catch で個別エラーを results に積む）
  // waitLock 成功直後に try-finally を開始し、いかなる例外でも releaseLock を保証する
  // （Gemini レビュー指摘 #3 への対応: lock leak 防止）
  // ─────────────────────────────────────────────
  var results = [];
  var isBulkModeLocal = isBulkMode;
  try {
    var startTime = new Date().getTime();
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // 同一リクエスト内の sheetName ごとの「次に書き込むべき行」キャッシュ
    // 同じシートに連続書き込みする場合、毎回 getValues する代わりにキャッシュを使う
    // （3者協議で必須と判断: getValues は GAS の中で最も重い API の 1 つ）
    // キャッシュ採用時も「その行が空か」を 1 セルだけ再検証することで虫食い上書きを防ぐ
    // （Gemini レビュー指摘 #4 への対応）
    var nextRowBySheet = {};

    for (var idx = 0; idx < rows.length; idx++) {
      var elapsed = new Date().getTime() - startTime;
      if (elapsed > MAX_EXEC_MS) {
        // 残り行は skipped として返す（6 分制限のセーフティネット）
        for (var j = idx; j < rows.length; j++) {
          results.push({
            ok: false,
            sheetName: rows[j] && rows[j].sheetName,
            error: 'skipped_time_limit'
          });
        }
        break;
      }

      var item = rows[idx];
      try {
        var result = _doPostWriteRow_(spreadsheet, item, nextRowBySheet);
        results.push(result);
      } catch (rowError) {
        results.push({
          ok: false,
          sheetName: item && item.sheetName,
          error: rowError.toString()
        });
      }
    }
  } finally {
    // どんな経路を通っても必ずロックを解放する
    lock.releaseLock();
  }

  // ─────────────────────────────────────────────
  // レスポンス組み立て（単一モードは既存互換 / 一括モードは新形式）
  // ─────────────────────────────────────────────
  if (!isBulkModeLocal) {
    // 既存取り込み君が読んでいる形式を維持: { success, message } または { success, error }
    var single = results[0];
    if (single && single.ok) {
      return _doPostJsonResponse_({
        success: true,
        message: (single.sheetName || '') + 'に追加しました（行: ' + single.row + ', 列: ' + single.startCol + '）'
      });
    }
    return _doPostJsonResponse_({
      success: false,
      error: (single && single.error) || 'unknown_error'
    });
  }

  // 一括モード: 「1 件でも成功なら success=true」とし、再送による重複を防ぐ
  // （Gemini レビュー指摘 #2 への対応: 部分成功時に success=false を返すと
  //   クライアントが「失敗」と判断して全件再送し、重複データが入る）
  // クライアントは results[] を見て個別の成否を判別する
  var okCount = 0;
  for (var k = 0; k < results.length; k++) {
    if (results[k] && results[k].ok) okCount++;
  }
  return _doPostJsonResponse_({
    success: okCount > 0,
    count: results.length,
    okCount: okCount,
    results: results
  });
}

// ─────────────────────────────────────────────
// doPost ヘルパー: 1 行をシートに書き込み、結果を返す
// （sheetName 分岐ロジック・空白行探索ロジックは従来仕様を完全踏襲）
// ─────────────────────────────────────────────
function _doPostWriteRow_(spreadsheet, item, nextRowBySheet) {
  var values = item && item.values;
  var sheetName = (item && item.sheetName) || 'インポート用';

  if (!values || !values.length) {
    return { ok: false, sheetName: sheetName, error: 'values is empty' };
  }

  // シート取得（無ければ作成）
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  // 貼り付け開始列の決定
  // - 'v5インポート' は A列から（A列がタグ列。取り込み君AI 経由の翻訳済データ用、V5 ルート）
  // - それ以外（'インポート用' 等の従来ルート）は B列から（A列はユーザーがタグを手入力する欄）
  var startCol = (sheetName === 'v5インポート') ? 1 : 2;

  // 空白行の検索列（必ず値が入る列）
  // - 'v5インポート': H列(8) = 仕入れ先コード（マッチングキー、必ず値が入る）
  // - それ以外:        B列(2) = 仕入先
  var searchCol = (sheetName === 'v5インポート') ? 8 : 2;

  // 異常状態（列削除等）への保険: searchCol / values 書込で必要な列数が不足していたら拡張
  // （Gemini レビュー指摘 #1 への対応: insertSheet 直後はデフォルト 26 列なので通常は問題ないが、
  //   ユーザーが列を削除した既存シートでは getRange が例外を投げる）
  var requiredCols = Math.max(searchCol, startCol + values.length - 1);
  var maxCols = sheet.getMaxColumns();
  if (maxCols < requiredCols) {
    sheet.insertColumnsAfter(maxCols, requiredCols - maxCols);
  }

  // 同一リクエスト内で同じ sheetName の 2 件目以降は前回の +1 を使う（getValues スキップで高速化）
  // ただし、キャッシュした行が本当に空かを 1 セルだけ再検証してから書き込む
  // （Gemini レビュー指摘 #4 への対応: 虫食い空行を埋めた後の +1 行に既存データがあった場合の上書き防止）
  var row = null;
  if (nextRowBySheet[sheetName]) {
    var candidate = nextRowBySheet[sheetName];
    var cellValue = sheet.getRange(candidate, searchCol).getValue();
    if (cellValue === '' || cellValue === null) {
      row = candidate;
    }
    // キャッシュ行が空でなければ row=null のまま、下の getValues 探索にフォールバック
  }

  if (row === null) {
    // 初回 or キャッシュ無効: getValues で 3 行目以降の最初の空白行を探索
    var lastRow = sheet.getLastRow();
    if (lastRow >= 3) {
      var colValues = sheet.getRange(3, searchCol, lastRow - 2, 1).getValues();
      for (var i = 0; i < colValues.length; i++) {
        var v = colValues[i][0];
        if (v === '' || v === null) {
          row = i + 3;
          break;
        }
      }
    }
    // 空白行が見つからない場合は最終行の次に追加（lastRow が 2 以下なら 3 行目）
    if (row === null) {
      row = (lastRow < 3) ? 3 : lastRow + 1;
    }
  }

  // values を startCol から貼り付け
  sheet.getRange(row, startCol, 1, values.length).setValues([values]);

  // 商品画像1..N（I列 = startCol + 7 から順）のセル内画像化
  // メルカリ非経由（getContentUrlで翻訳参照）のため、とりこみ君がbase64を同梱した行のみ。
  // 失敗時は setValues で書いた =IMAGE がそのまま残る（フォールバック）。
  var imgs = (item && Array.isArray(item.topImagesBase64)) ? item.topImagesBase64
           : (item && typeof item.topImageBase64 === 'string') ? [item.topImageBase64]
           : [];
  if (sheetName === 'インポート用' && values.length > 7) {
    for (var i = 0; i < imgs.length; i++) {
      var b64 = imgs[i];
      if (typeof b64 === 'string' && b64.indexOf('data:image') === 0) {
        try {
          var imageCol = startCol + 7 + i; // 商品画像1=I列(startCol+7)、以降 +1 ずつ
          var cellImage = SpreadsheetApp.newCellImage().setSourceUrl(b64).build();
          sheet.getRange(row, imageCol).setValue(cellImage);
        } catch (imgErr) {
          console.error('[doPost] newCellImage failed (i=' + i + '): ' + (imgErr && imgErr.message ? imgErr.message : imgErr));
          // フォールバック: =IMAGE が残る
        }
      }
      // b64 が null/非data URL の枚はスキップ（=IMAGE維持）
    }
  }

  // 次の行をキャッシュに記録（連続書き込み最適化）
  // 上書き防止のため、書き込み済みの行を絶対に再利用しない（+1 する）
  nextRowBySheet[sheetName] = row + 1;

  return {
    ok: true,
    sheetName: sheetName,
    row: row,
    startCol: startCol
  };
}

// ─────────────────────────────────────────────
// doPost ヘルパー: JSON レスポンス生成（共通化でケアレスミス防止）
// ─────────────────────────────────────────────
function _doPostJsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────
// Webアプリ用 GET エントリーポイント（スキル経路の安全画像参照）
//
// スキル(CLI/Codex/Gemini)がこれを叩き、シートの「セル内画像(CellImage)」を
// getContentUrl(Googleホスト)→base64 data URL にして受け取り、AI に渡す。
// → メルカリ非経由で画像翻訳できる。
//
// 重要(§8厳守): doGet 自身は絶対にメルカリ(static.mercdn.net 等)を fetch しない。
//   fetch するのは getContentUrl の Google ホスト画像のみ（_doGetIsGoogleHostedImage_ で限定）。
//   =IMAGE のメルカリURLは文字列として mercariUrls に返すだけ（取得はクライアント側＝スキルが判断）。
//
// パラメータ: ?action=getImages&sheet=インポート用&startRow=12&numRows=6&maxImages=1&key=XXXX
//   key は DocumentProperties の 'IMG_DOGET_KEY' が設定されている場合のみ照合（未設定なら素通り）。
// ─────────────────────────────────────────────
function doGet(e) {
  try {
    var params = (e && e.parameter) || {};

    // 軽い認証: キーが設定されている場合のみ照合
    var requiredKey = PropertiesService.getDocumentProperties().getProperty('IMG_DOGET_KEY');
    if (requiredKey && params.key !== requiredKey) {
      return _doPostJsonResponse_({ ok: false, error: 'unauthorized' });
    }

    // 画像doGet URL の自動登録: この webhook を叩いた文脈の自URL(=実行中デプロイの /exec)を
    // DocumentProperties に記録する。getService() は editor 文脈や複数デプロイで不確実なため、
    // 「正しい webhook を実際に叩いて自URLを採る」この方法のみが確実。
    // 書き込むのは self URL のみ（呼び出し側のパラメータは使わない）＝外部からの値注入は不可。
    if (params.action === 'registerSelfUrl') {
      var selfUrl = ScriptApp.getService().getUrl();
      if (!selfUrl || !/^https:\/\//i.test(selfUrl)) {
        return _doPostJsonResponse_({ ok: false, error: 'service_url_unavailable', hint: 'deploy as web app first' });
      }
      PropertiesService.getDocumentProperties().setProperty('IMG_DOGET_URL', selfUrl);
      return _doPostJsonResponse_({ ok: true, registered: selfUrl });
    }

    if (params.action !== 'getImages') {
      return _doPostJsonResponse_({ ok: false, error: 'unknown_action' });
    }

    var sheetName = params.sheet || 'インポート用';
    var startRowP = _doGetParseInt_(params.startRow, 'invalid_startRow');
    var numRowsP = _doGetParseInt_(params.numRows, 'invalid_numRows');
    var maxImagesP = _doGetParseInt_(params.maxImages || '1', 'invalid_maxImages');
    if (startRowP.error) return _doPostJsonResponse_({ ok: false, error: startRowP.error });
    if (numRowsP.error) return _doPostJsonResponse_({ ok: false, error: numRowsP.error });
    if (maxImagesP.error) return _doPostJsonResponse_({ ok: false, error: maxImagesP.error });

    var startRow = startRowP.value;
    var numRows = numRowsP.value;
    var maxImages = Math.max(1, Math.min(10, maxImagesP.value));
    if (startRow < 3) return _doPostJsonResponse_({ ok: false, error: 'invalid_startRow' });
    if (numRows < 1 || numRows > 50) return _doPostJsonResponse_({ ok: false, error: 'invalid_numRows' });

    var COL_IMAGE_START = 9;        // I 列（商品画像1）
    var COL_IMAGE_COUNT = 10;       // I〜R（商品画像1〜10）
    var MAX_TOTAL_SAFE_IMAGES = 30; // fetchAll のヒープ圧迫を避ける枚数上限（1枚最大2MB×30）

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return _doPostJsonResponse_({ ok: false, error: 'sheet_not_found' });
    }

    // シート境界クランプ: getRange の out of bounds 例外を防ぐ
    var maxRows = sheet.getMaxRows();
    if (startRow > maxRows) {
      return _doPostJsonResponse_({ ok: false, error: 'startRow_out_of_range' });
    }
    if (startRow + numRows - 1 > maxRows) {
      numRows = maxRows - startRow + 1;
    }

    var range = sheet.getRange(startRow, COL_IMAGE_START, numRows, COL_IMAGE_COUNT);
    var imageValues = range.getValues();
    var imageFormulas = range.getFormulas();

    var rows = [];
    var requests = [];
    var indexMap = [];
    var totalSafe = 0;

    for (var i = 0; i < numRows; i++) {
      var rowResult = { row: startRow + i, safeImages: [], mercariUrls: [] };
      var safeCount = 0;
      rows.push(rowResult);

      for (var j = 0; j < COL_IMAGE_COUNT; j++) {
        var cellVal = imageValues[i][j];

        // セル内画像(CellImage): getContentUrl(Googleホスト) のみ後で fetch→base64
        if (safeCount < maxImages && totalSafe < MAX_TOTAL_SAFE_IMAGES &&
            cellVal && typeof cellVal.getContentUrl === 'function') {
          try {
            var contentUrl = cellVal.getContentUrl();
            if (contentUrl && _doGetIsGoogleHostedImage_(contentUrl)) {
              requests.push({ url: contentUrl, muteHttpExceptions: true, followRedirects: true });
              indexMap.push({ rowIndex: i });
              safeCount++;
              totalSafe++;
            } else if (contentUrl) {
              // Googleホスト以外は安全保証外 → fetch しない（§8）
              console.warn('[doGet] non-google contentUrl skipped (row ' + (startRow + i) +
                '): ' + String(contentUrl).substring(0, 80));
            }
          } catch (ciErr) {
            console.warn('[doGet] getContentUrl failed (row ' + (startRow + i) + ' col ' + j +
              '): ' + ((ciErr && ciErr.message) ? ciErr.message : ciErr));
          }
        }

        // =IMAGE("url"): メルカリURLを文字列で返すだけ（doGet は取得しない）
        if (rowResult.mercariUrls.length < maxImages) {
          var f = imageFormulas[i][j] || '';
          var m = f.match(/=IMAGE\(\s*"([^"]+)"/i);
          if (m && m[1]) { rowResult.mercariUrls.push(m[1]); }
        }

        if (safeCount >= maxImages && rowResult.mercariUrls.length >= maxImages) { break; }
      }
    }

    _doGetFillSafeImages_(requests, indexMap, rows);

    return _doPostJsonResponse_({
      ok: true,
      sheet: sheetName,
      startRow: startRow,
      numRows: numRows,
      rows: rows
    });
  } catch (err) {
    console.error('[doGet] fatal: ' + ((err && err.stack) ? err.stack : String(err)));
    return _doPostJsonResponse_({ ok: false, error: String(err) });
  }
}

// doGet ヘルパー: 数値パラメータの厳格パース
function _doGetParseInt_(value, error) {
  var text = String(value || '').trim();
  if (!/^\d+$/.test(text)) { return { error: error }; }
  return { value: parseInt(text, 10) };
}

// doGet ヘルパー: getContentUrl が Google ホスト(*.googleusercontent.com)かを検証。
// これ以外のドメインは fetch しない（メルカリ等への自動アクセスを構造的に排除）。
function _doGetIsGoogleHostedImage_(url) {
  if (typeof url !== 'string') { return false; }
  var m = url.match(/^https:\/\/([^\/?#]+)/i);
  if (!m) { return false; }
  var host = m[1].toLowerCase();
  return host === 'googleusercontent.com' || /\.googleusercontent\.com$/.test(host);
}

// doGet ヘルパー: ヘッダ名を大小無視で取得（GAS は送信元の casing をそのまま返すため）
function _doGetHeaderValue_(headers, name) {
  if (!headers) { return null; }
  var lower = String(name).toLowerCase();
  var keys = Object.keys(headers);
  for (var i = 0; i < keys.length; i++) {
    if (String(keys[i]).toLowerCase() === lower) { return headers[keys[i]]; }
  }
  return null;
}

// doGet ヘルパー: 収集した Google ホスト画像URLを並列取得し base64 data URL 化。
// 200のみ採用 / 2MB超skip / 総レスポンスサイズ上限で打ち切り / 失敗は記録して継続。
function _doGetFillSafeImages_(requests, indexMap, rows) {
  if (!requests.length) { return; }

  var responses;
  try {
    responses = UrlFetchApp.fetchAll(requests);
  } catch (fetchErr) {
    console.error('[doGet] fetchAll failed: ' + ((fetchErr && fetchErr.message) ? fetchErr.message : fetchErr));
    return;
  }

  var MAX_RESPONSE_BYTES = 35 * 1024 * 1024; // ContentService ~50MB 上限への安全マージン
  var totalBytes = 0;

  for (var i = 0; i < responses.length; i++) {
    try {
      var res = responses[i];
      var code = res.getResponseCode();
      if (code !== 200) {
        console.warn('[doGet] image fetch non-200 (' + code + ') at index ' + i);
        continue;
      }
      var bytes = res.getBlob().getBytes();
      if (bytes.length > 2 * 1024 * 1024) {
        console.warn('[doGet] skip oversize image (>2MB) at index ' + i);
        continue;
      }
      // base64 化前に概算サイズで上限判定（巨大文字列の無駄な生成を避ける）
      var estB64 = Math.ceil(bytes.length / 3) * 4;
      if (totalBytes + estB64 > MAX_RESPONSE_BYTES) {
        console.warn('[doGet] response size cap reached, stop at index ' + i);
        break;
      }
      var base64 = Utilities.base64Encode(bytes);
      totalBytes += base64.length;
      var contentType = _doGetHeaderValue_(res.getHeaders(), 'Content-Type') || 'image/jpeg';
      contentType = String(contentType).split(';')[0].trim();
      rows[indexMap[i].rowIndex].safeImages.push('data:' + contentType + ';base64,' + base64);
    } catch (imgErr) {
      console.warn('[doGet] image decode failure at index ' + i + ': ' +
        ((imgErr && imgErr.message) ? imgErr.message : imgErr));
    }
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Item Specifics（ライブラリ経由）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function IS_step1BasicSelectedRows() { LIB.step1BasicSelectedRows(); }
function IS_step1BasicAllRows() { LIB.step1BasicAllRows(); }
function IS_showDictionaryManager() { LIB.showDictionaryManager(); }
function IS_initializeDictionaryWithConfirm() { LIB.initializeDictionaryWithConfirm(); }
function IS_extractSelectedRows() { LIB.extractSelectedRows(); }
function IS_extractAllRows() { LIB.extractAllRows(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🌐 eBay 翻訳 (AI)（ライブラリ経由）
  ・本体ロジック: Library/EbayTranslationSkill.gs
  ・メニュー定義: Library/コード_Part3 の onOpen 内 (LIB.onOpen() 経由で表示)
  ・google.script.run 制約のため、HTML フォームから呼ばれる save/generate も
    ホスト側 (本ファイル) にラッパーが必要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function showEbayTranslationSettings() {
  var html = LIB.buildEbayTranslationSettingsHtml();
  SpreadsheetApp.getUi().showModalDialog(html, 'eBay 翻訳 (AI) 設定');
}
function showEbayTranslationGenerator() {
  var html = LIB.buildEbayTranslationGeneratorHtml();
  SpreadsheetApp.getUi().showModalDialog(html, '翻訳指示文を生成');
}
function showEbayTranslationCurrentSettings() {
  SpreadsheetApp.getUi().alert(LIB.getEbayTranslationCurrentSettingsText());
}
function showEbayTranslationSkillDownload() {
  var html = LIB.buildEbayTranslationSkillDownloadHtml();
  SpreadsheetApp.getUi().showModalDialog(html, 'eBay Translation Skill 本文');
}
// HTML フォーム (google.script.run) から呼ばれる関数
function saveEbayTranslationSettings(form) { return LIB.saveEbayTranslationSettings(form); }
function generateEbayTranslationInstruction(startRow, endRow) { return LIB.generateEbayTranslationInstruction(startRow, endRow); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔑 eBay 翻訳 (AI) ルート②: API翻訳（ライブラリ経由）
  ・本体ロジック: Library/EbayTranslationApi.gs
  ・APIキー(OpenAI/Gemini)で直接翻訳 → v5インポートへ書き込み
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function ebApiShowAllSettingsDialog() {
  var html = LIB.ebApiBuildAllSettingsHtml();
  SpreadsheetApp.getUi().showModalDialog(html, '⚙️ 設定');
}
function ebApiTranslateSelectedRows() { return LIB.ebApiTranslateSelectedRows(); }
function ebApiTranslateAllRows() { return LIB.ebApiTranslateAllRows(); }
function ebApiContinueTranslateRows() { return LIB.ebApiContinueTranslateRows(); }
function ebApiCancelResumeTrigger() { return LIB.ebApiCancelResumeTrigger(); }
function ebApiShowResumeState() { return LIB.ebApiShowResumeState(); }
// HTML フォーム (google.script.run) から呼ばれる関数
function ebApiSaveAllSettings(formData) { return LIB.ebApiSaveAllSettings(formData); }
