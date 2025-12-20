/******************************************************
 * Main.gs - ユーザー側シート用ラッパー
 *
 * ライブラリ「BulkToolsLib」の全公開関数を呼び出す
 ******************************************************/
var LIB = BulkToolsLib;

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メニュー・初期化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function onOpen() { LIB.onOpen(); }
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
  try {
    // リクエストボディを解析
    var data = JSON.parse(e.postData.contents);
    var values = data.values;
    var sheetName = data.sheetName || 'インポート用';

    // スプレッドシートを取得
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(sheetName);

    // シートが存在しない場合は作成
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    // 3行目以降でB列が空白の行を探す
    var row = null;
    var maxRow = sheet.getMaxRows();

    for (var i = 3; i <= maxRow; i++) {
      var cellValue = sheet.getRange(i, 2).getValue();
      if (cellValue === '' || cellValue === null) {
        row = i;
        break;
      }
    }

    // 空白行が見つからない場合は最終行の次に追加
    if (row === null) {
      row = sheet.getLastRow() + 1;
    }

    // valuesをB列から貼り付け
    if (values && values.length > 0) {
      sheet.getRange(row, 2, 1, values.length).setValues([values]);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: sheetName + 'に追加しました（行: ' + row + '）'
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
