/******************************************************
 * Main.gs - ユーザー側シート用ラッパー
 *
 * このファイルはライブラリ「BulkToolsLib」を呼び出すだけの
 * 薄いラッパーです。ライブラリ側でロジックが更新されると、
 * このシートも自動的に最新機能を使えるようになります。
 *
 * 【初期設定】
 * 1. スクリプトエディタで「ライブラリ」→「+」をクリック
 * 2. 以下のスクリプトIDを入力:
 *    [ライブラリ公開後にIDを記入]
 * 3. バージョンは最新を選択
 * 4. 識別子は「BulkToolsLib」に設定
 ******************************************************/

// ライブラリの識別子（変更不可）
var LIB = BulkToolsLib;

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メニュー登録（自動実行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function onOpen() {
  LIB.onOpen();
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  初期設定・設定関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function initialSetup() { LIB.initialSetup(); }
function applyCalculationFormulas() { LIB.applyCalculationFormulas(); }
function showPriceCalculator() { LIB.showPriceCalculator(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳・AI処理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function translateSelectedRows() { LIB.translateSelectedRows(); }
function translateAll() { LIB.translateAll(); }
function showPromptEditorSidebar() { LIB.showPromptEditorSidebar(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料・配送関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function calculateShippingForSelectedRows() { LIB.calculateShippingForSelectedRows(); }
function calculateShippingForAll() { LIB.calculateShippingForAll(); }
function recalculateLegacy() { LIB.recalculateLegacy(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート・ポリシー関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyTemplateToSelectedRows() { LIB.applyTemplateToSelectedRows(); }
function applyShippingPolicyToSelectedRows() { LIB.applyShippingPolicyToSelectedRows(); }
function showUnifiedCategoryDialog() { LIB.showUnifiedCategoryDialog(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  データ保存・インポート
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function saveSelectedRowsAndClear() { LIB.saveSelectedRowsAndClear(); }
function clearSelectedRowsOnly() { LIB.clearSelectedRowsOnly(); }
function showDataImportDialog() { LIB.showDataImportDialog(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  重複チェック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runDuplicateCheck() { LIB.runDuplicateCheck(); }
function showDuplicateCheckSettings() { LIB.showDuplicateCheckSettings(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  簡易版メニュー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function simpleTranslateSelectedRows() { LIB.simpleTranslateSelectedRows(); }
function simpleTranslateAll() { LIB.simpleTranslateAll(); }
function openSimpleSetup() { LIB.openSimpleSetup(); }

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  GASからHTMLに呼ばれる関数（ライブラリに委譲）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// 設定取得系
function getSettings() { return LIB.getSettings(); }
function getSimpleSettings() { return LIB.getSimpleSettings(); }
function saveSimpleSettings(apiKey) { return LIB.saveSimpleSettings(apiKey); }

// プロンプト関連
function getAllPromptIds() { return LIB.getAllPromptIds(); }
function getPromptContent(promptId) { return LIB.getPromptContent(promptId); }
function savePromptContent(promptId, content) { return LIB.savePromptContent(promptId, content); }

// 初期設定保存
function saveInitialSettings(settings) { return LIB.saveInitialSettings(settings); }

// その他のHTML呼び出し用関数（必要に応じて追加）
function getTemplateList() { return LIB.getTemplateList(); }
function getShippingPolicyList() { return LIB.getShippingPolicyList(); }
function applyTemplate(templateName) { return LIB.applyTemplate(templateName); }
function applyShippingPolicy(policyName) { return LIB.applyShippingPolicy(policyName); }
