/******************************************************
 * コード.js - メイン処理（残りの関数）
 *
 * 分割済みファイル:
 * - Config.gs: CONFIG定数、設定管理
 * - Utils.gs: ユーティリティ関数
 * - AI.gs: AI API呼び出し
 * - Translation.gs: 翻訳処理
 * - Shipping.gs: 送料計算
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  プロンプト周り
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getAllPromptIds() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('GPT_Prompts');
    if (!sh) return ['EBAY_FULL_LISTING_PROMPT'];
    var last = sh.getLastRow();
    if (last < 2) return ['EBAY_FULL_LISTING_PROMPT'];
    var vals = sh.getRange(2, 1, last - 1, 1).getValues();
    var ids = vals.map(function(r){ return (r[0] || '').toString().trim(); })
                  .filter(function(v){ return v; });
    return ids.length ? ids : ['EBAY_FULL_LISTING_PROMPT'];
  } catch (e) {
    return ['EBAY_FULL_LISTING_PROMPT'];
  }
}

function getPromptContent(promptId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = "GPT_Prompts";
    var sh = ss.getSheetByName(name);
    if (!sh) return "";
    var last = sh.getLastRow();
    if (last < 2) return "";
    var vals = sh.getRange(2, 1, last - 1, 2).getValues();
    for (var i=0;i<vals.length;i++) {
      var id = (vals[i][0]||'').toString().trim();
      if (id === promptId) return (vals[i][1]||'').toString();
    }
    return "";
  } catch (e) {
    return "";
  }
}

/* サイドバー：プロンプト編集 */
function showPromptEditorSidebar() {
  try {
    var html = createHtmlFromTemplate('PromptEditor').setTitle('プロンプト編集').setWidth(400);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    showAlert('「PromptEditor.html」が見つかりません。', 'error');
  }
}

function savePromptContent(promptId, newContent) {
  // アシスタント機能へのディスパッチ
  if (promptId === '__ASSISTANT__') {
    try {
      var request = JSON.parse(newContent);
      return assistantDispatch_(request);
    } catch (e) {
      return { success: false, error: 'Invalid request format: ' + e.message };
    }
  }

  // 既存のプロンプト保存処理
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("GPT_Prompts");
  if (!sh) throw new Error('GPT_Prompts シートが見つかりません。');
  var last = sh.getLastRow();
  var range = sh.getRange(2, 1, Math.max(0, last-1), 1);
  var ids = range.getValues().map(function(r){return (r[0]||'').toString().trim();});
  var idx = ids.indexOf(promptId);
  if (idx === -1) throw new Error('プロンプトIDが見つかりません。');
  sh.getRange(2+idx, 2).setValue(newContent);
  sh.getRange(2+idx, 4).setValue(new Date());
  SpreadsheetApp.flush();
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  初期設定UI（SetupDialog が無い場合もフォールバック）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// Part 1の initialSetup 関数を以下のように修正してください

function initialSetup() {
  var ui = SpreadsheetApp.getUi();
  // ライブラリではDocumentPropertiesを使用（スプレッドシートに紐づく）
  // ScriptPropertiesはライブラリ自身のプロパティを参照するため使用不可
  var docProps = PropertiesService.getDocumentProperties();
  var props = docProps; // 後方互換のためpropsもdocPropsを参照
  try {
    var tmpl;
    try {
      // まず .html ファイルを探す（ユーザーシート用）
      tmpl = HtmlService.createTemplateFromFile('SetupDialog');
    } catch (_) {
      // なければ HtmlTemplates.gs から取得（ライブラリ用）
      try {
        var htmlContent = getHtmlTemplate('SetupDialog');
        if (htmlContent) {
          tmpl = HtmlService.createTemplate(htmlContent);
        }
      } catch (_) {
        tmpl = null;
      }
    }
    if (!tmpl) {
      ui.alert('初期設定', 'SetupDialog.html が無いので簡易案内を表示します。', ui.ButtonSet.OK);
      return;
    }
    
    // 既存の設定変数
    // APIキーはDocumentPropertiesから取得（スプレッドシートに紐づく、ライブラリ更新で消えない）
    var docProps = PropertiesService.getDocumentProperties();
    var openaiKey = docProps.getProperty('OPENAI_API_KEY') || '';
    var claudeKey = docProps.getProperty('CLAUDE_API_KEY') || '';
    var geminiKey = docProps.getProperty('GEMINI_API_KEY') || '';
    // APIキーの存在フラグのみ渡す（値は渡さない）
    tmpl.hasApiKey = {
      openai: openaiKey.length > 0,
      claude: claudeKey.length > 0,
      gemini: geminiKey.length > 0
    };
    tmpl.currentModel = props.getProperty('AI_MODEL') || 'gpt-5-nano';
    tmpl.currentSheetName = props.getProperty('SHEET_NAME') || '作業シート';
    tmpl.currentProfitCalculationMethod = props.getProperty('PROFIT_CALC_METHOD') || 'RATE';
    tmpl.currentPromptId = props.getProperty('PROMPT_ID') || 'EBAY_FULL_LISTING_PROMPT';
    tmpl.currentShippingThreshold = props.getProperty('SHIPPING_THRESHOLD') || '5500';
    tmpl.currentShippingCalculationMethod = props.getProperty('SHIPPING_CALC_METHOD') || 'TABLE';
    tmpl.currentLowPriceMethod = props.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'EP';
    tmpl.currentHighPriceMethod = props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CF';
    tmpl.currentShowPopups = props.getProperty('SHOW_POPUPS') || 'false';

    // DDU価格調整機能の設定変数（DocumentPropertiesから取得 - スプレッドシートに紐づく）
    tmpl.currentDduAdjustmentEnabled = docProps.getProperty('DDU_ADJUSTMENT_ENABLED') || 'false';
    tmpl.currentDduThreshold = docProps.getProperty('DDU_THRESHOLD') || '500';
    tmpl.currentDduAdjustment = docProps.getProperty('DDU_ADJUSTMENT_AMOUNT') || '500';

    // プロンプト自動選択
    tmpl.currentAutoPromptSelect = docProps.getProperty('AUTO_PROMPT_SELECT') || '手動';
    
    // 価格表示モード設定
    tmpl.currentPriceDisplayMode = props.getProperty('PRICE_DISPLAY_MODE') || 'NORMAL';

    // タグ自動判定 設定（既定値）
    tmpl.currentTagOverrideEnabled = docProps.getProperty('TAG_OVERRIDE_ENABLED') || 'false';
    tmpl.currentTagOverridePrompt = docProps.getProperty('TAG_OVERRIDE_PROMPT') || 'true';
    tmpl.currentTagOverrideTemplate = docProps.getProperty('TAG_OVERRIDE_TEMPLATE') || 'true';
    tmpl.currentTagOverrideShippingCategory = docProps.getProperty('TAG_OVERRIDE_SHIPPING_CATEGORY') || 'true';
    tmpl.currentTagOverrideProfitRate = docProps.getProperty('TAG_OVERRIDE_PROFIT_RATE') || 'true';
    tmpl.currentTagOverrideAdRate = docProps.getProperty('TAG_OVERRIDE_AD_RATE') || 'true';
    tmpl.currentTagOverrideFeeRate = docProps.getProperty('TAG_OVERRIDE_FEE_RATE') || 'true';
    tmpl.currentTagOverrideShipping = docProps.getProperty('TAG_OVERRIDE_SHIPPING') || 'true';
    tmpl.currentTagOverrideLowShipping = docProps.getProperty('TAG_OVERRIDE_LOW_SHIPPING') || 'true';
    tmpl.currentTagOverrideHighShipping = docProps.getProperty('TAG_OVERRIDE_HIGH_SHIPPING') || 'true';
    tmpl.currentTagOverrideThreshold = docProps.getProperty('TAG_OVERRIDE_THRESHOLD') || 'true';

    // ===== ✅ 重複チェック設定の規定値を詳細に設定 =====
    var workSheetName = props.getProperty('SHEET_NAME') || '作業シート';
    
    // 基本設定
    tmpl.currentDuplicateCheckEnabled = props.getProperty('DUPLICATE_CHECK_ENABLED') || 'false';
    tmpl.currentDuplicateSourceSheet = props.getProperty('DUPLICATE_SOURCE_SHEET') || workSheetName;
    tmpl.currentDuplicateSourceColumn = props.getProperty('DUPLICATE_SOURCE_COLUMN') || 'H';
    
    // 対象シート（デフォルト2つ）
    var savedTargets = props.getProperty('DUPLICATE_TARGET_SHEETS');
    if (savedTargets) {
      tmpl.currentDuplicateTargetSheets = savedTargets;
    } else {
      // 初回は規定値を設定
      var defaultTargets = [
        { sheet: '保存データ_*', column: 'H' },
        { sheet: 'EAFGLE商品一覧', column: 'A' }
      ];
      tmpl.currentDuplicateTargetSheets = JSON.stringify(defaultTargets);
    }
    
    // シート適用設定
    tmpl.currentDuplicateApplyToSheet = props.getProperty('DUPLICATE_APPLY_TO_SHEET') || 'true';  // デフォルトでチェック
    tmpl.currentDuplicateOutputSheet = props.getProperty('DUPLICATE_OUTPUT_SHEET') || workSheetName;
    tmpl.currentDuplicateOutputColumn = props.getProperty('DUPLICATE_OUTPUT_COLUMN') || 'AF';
    tmpl.currentDuplicateOutputStartRow = props.getProperty('DUPLICATE_OUTPUT_START_ROW') || '5';
    tmpl.currentDuplicateOutputRange = props.getProperty('DUPLICATE_OUTPUT_RANGE') || 'DATA';
    
    // 既存の選択肢
    tmpl.lowPriceOptions = CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice;
    tmpl.highPriceOptions = CONFIG.SHIPPING_METHOD_OPTIONS.highPrice;
    tmpl.promptIds = getAllPromptIds();
    
    var html = tmpl.evaluate().setWidth(800).setHeight(900);
    ui.showModalDialog(html, '初期設定（統合版）');
  } catch (e) {
    showAlert('初期設定ダイアログの表示に失敗: ' + e.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  設定読み込み＆検証（不足時は null 返却）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function ensureSurchargeCellsOnWorkSheet() {
  var props = PropertiesService.getDocumentProperties();
  var sheetName = props.getProperty('SHEET_NAME') || '作業シート';
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) return;
  
  function safeSetNote(range, note) {
    if (note && typeof note === 'string' && note.trim()) {
      range.setNote(note);
    }
  }
  
  // AA2: 実際の関税率（ユーザー入力）
  if (!sh.getRange('AA2').getNote()) {
    safeSetNote(sh.getRange('AA2'), '実際の関税率（例: 0.15 = 15%）');
  }

  // AF2: 調整後関税率（式で自動計算）
  if (!sh.getRange('AF2').getNote()) {
    safeSetNote(sh.getRange('AF2'), '調整後関税率（式: =AA2/(1-F1-F2)）\n※DDP課金対策で自動調整');
  }

  // 関税処理手数料率（AG2）
  if (!sh.getRange('AG2').getNote()) {
    safeSetNote(sh.getRange('AG2'), '関税処理手数料率（例: 0.021 = 2.1%）');
  }

  // 米国通関処理手数料（AB1→AC1→AE1）
  if (!sh.getRange('AE1').getNote()) {
    safeSetNote(sh.getRange('AE1'), '米国通関処理手数料（円）（例: 296）');
  }

  // MPF（AH2）
  if (!sh.getRange('AH2').getNote()) {
    safeSetNote(sh.getRange('AH2'), 'MPF（$）※Cpass免除（例: 0）');
  }

  // U1→V1, U2→V2
  if (!sh.getRange('V1').getNote()) {
    safeSetNote(sh.getRange('V1'), 'FedEx燃油サーチャージ率（例: 0.2 = 20%）');
  }
  if (!sh.getRange('V2').getNote()) {
    safeSetNote(sh.getRange('V2'), 'DHL燃油サーチャージ率（例: 0.18 = 18%）');
  }
  // V2→W2
  if (!sh.getRange('W2').getNote()) {
    safeSetNote(sh.getRange('W2'), 'Cpass割引率（例: 0.03 = 3%）');
  }
  // X1→Y1, X2→Y2
  if (!sh.getRange('Y1').getNote()) {
    safeSetNote(sh.getRange('Y1'), 'FedEx 追加料金（500g毎）。不要なら 0。');
  }
  if (!sh.getRange('Y2').getNote()) {
    safeSetNote(sh.getRange('Y2'), 'DHL 追加料金（500g毎）。不要なら 0。');
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  設定読み込み＆検証（不足時は null 返却）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI 用プロンプト生成 & 応答解析

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  料金見積（USD）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI 呼び出し（リトライ制御）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  AI 呼び出し（各社）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格表示モード管理（追加）

/**
 * 出品用シートに価格式を出力
 * @param {number} workSheetRow - 作業シートの行番号
 */
// Part 1の updateListingSheetPrice 関数を以下のように修正してください

function updateListingSheetPrice(workSheetRow) {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var workSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!workSheet) return;
    
    var listingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('出品用シート');
    if (!listingSheet) return;
    
    var listingRow = workSheetRow - 2; // 作業シート5行目 → 出品用シート3行目
    
    if (listingRow < 3) return;
    
    // 3次元価格判定ロジック（DDU調整 → 価格表示モード → デフォルト）
    var formula = determineListingPriceFormula(settings, workSheetRow);
    
    listingSheet.getRange(listingRow, 8).setFormula(formula); // H列に出力（変更なし）
    
  } catch (e) {
    console.error('出品シート価格反映エラー: ' + e.message);
  }
}

// determineListingPriceFormula関数を以下のように修正

function determineListingPriceFormula(settings, workSheetRow) {
  try {
    var sheetName = settings.sheetName;
    var priceMode = getPriceDisplayMode();
    
    // DDU価格調整機能が有効 かつ 価格表示モードがNORMAL（DDU）の場合のみAG列を考慮
    // ⚠️ AD→AE→AG列
    if (settings.dduAdjustmentEnabled && priceMode !== 'TAX_INCLUDED') {
      var dduFormula = "=IF(AND(NOT(ISBLANK('" + sheetName + "'!AG" + workSheetRow + ")), " +
                       "ISNUMBER('" + sheetName + "'!AG" + workSheetRow + ")), " +
                       "'" + sheetName + "'!AG" + workSheetRow + ", " +
                       getStandardPriceFormula(settings, workSheetRow) + ")";
      // AD→AE→AG（DDU調整価格）
      return dduFormula;
    }
    
    // DDU機能無効時 または DDP（関税込み）モードの場合は従来の価格表示モード判定
    return getStandardPriceFormula(settings, workSheetRow);
    
  } catch (e) {
    console.error('価格式決定エラー: ' + e.message);
    return "'" + settings.sheetName + "'!R" + workSheetRow;  // Q→R列
  }
}

// 🆕 標準価格式を取得する関数（新規追加）
// getStandardPriceFormula 関数を以下のように修正してください

function getStandardPriceFormula(settings, workSheetRow) {
  var sheetName = settings.sheetName;
  var mode = getPriceDisplayMode();
  
  if (mode === 'TAX_INCLUDED') {
    // 関税込み価格モード → S列を参照（R→S）
    return "'" + sheetName + "'!S" + workSheetRow;  // R→S
  } else {
    // 通常価格モード（デフォルト） → R列を参照（Q→R）
    return "'" + sheetName + "'!R" + workSheetRow;  // Q→R
  }
}

// 🆕 DDU価格調整適用状況をチェックする関数（新規追加）
function checkDduAdjustmentStatus(workSheetRow) {
  try {
    var settings = getSettings();
    if (!settings || !settings.dduAdjustmentEnabled) {
      return { applied: false, reason: 'DDU機能無効' };
    }
    
    var workSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!workSheet) {
      return { applied: false, reason: '作業シート未発見' };
    }
    
    // ⚠️ 列参照の修正
    var dduPrice = Number(workSheet.getRange(workSheetRow, CONFIG.COLUMNS.PRICE).getValue());  // 17→18
    var ddpPrice = Number(workSheet.getRange(workSheetRow, CONFIG.COLUMNS.TAX_INCLUDED_PRICE).getValue());  // 18→19
    var adjustedPrice = workSheet.getRange(workSheetRow, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE).getValue();  // 30→31
    
    if (isNaN(dduPrice) || dduPrice < settings.dduThreshold) {
      return { 
        applied: false, 
        reason: 'DDU価格(' + dduPrice + ')が閾値(' + settings.dduThreshold + ')未満',
        dduPrice: dduPrice,
        threshold: settings.dduThreshold
      };
    }
    
    if (!adjustedPrice || adjustedPrice === '' || isNaN(Number(adjustedPrice))) {
      return { 
        applied: false, 
        reason: 'AG列に有効な調整価格がない',  // AD→AE→AG
        dduPrice: dduPrice,
        ddpPrice: ddpPrice
      };
    }
    
    return { 
      applied: true, 
      reason: 'DDU価格調整適用',
      dduPrice: dduPrice,
      ddpPrice: ddpPrice,
      adjustedPrice: Number(adjustedPrice),
      savings: ddpPrice - Number(adjustedPrice)
    };
    
  } catch (e) {
    return { applied: false, reason: 'チェック処理エラー: ' + e.message };
  }
}

// Part 5に以下のテスト関数を追加してください

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  DDU価格調整機能のテスト関数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * テスト用データを設定
 */
function setupTestData(sheet, row, settings) {
  try {
    // テスト用のデータを設定
    sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).setValue(50000);     // 9（変更なし）
    sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).setValue('DDUテスト商品');  // 10（変更なし）
    sheet.getRange(row, CONFIG.COLUMNS.JP_DESC).setValue('DDU価格調整機能のテスト用商品です');  // 11（変更なし）
    
    // 重量・サイズ設定（送料計算用）（変更なし）
    sheet.getRange('J2').setValue(1000);
    sheet.getRange('L2').setValue(30);
    sheet.getRange('M2').setValue(25);
    sheet.getRange('N2').setValue(20);
    
    setFormulas(sheet, row, settings);
    
    console.log('テストデータ設定完了: 行' + row);
    
  } catch (e) {
    console.error('テストデータ設定エラー: ' + e.message);
  }
}

/**
 * テスト結果を検証
 */
function verifyTestResults(sheet, row, settings) {
  try {
    // ⚠️ 列参照の修正
    var dduPrice = Number(sheet.getRange(row, CONFIG.COLUMNS.PRICE).getValue());  // 17→18
    var ddpPrice = Number(sheet.getRange(row, CONFIG.COLUMNS.TAX_INCLUDED_PRICE).getValue());  // 18→19
    var adjustedPrice = sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE).getValue();  // 30→31
    
    var report = '';
    var success = false;
    
    report += 'R列（DDU価格）: $' + dduPrice.toFixed(2) + '\n';  // Q→R
    report += 'S列（DDP価格）: $' + ddpPrice.toFixed(2) + '\n';  // R→S
    
    if (dduPrice >= settings.dduThreshold) {
      report += '閾値判定: OK ($' + dduPrice.toFixed(2) + ' >= $' + settings.dduThreshold + ')\n';
      
      if (adjustedPrice && !isNaN(Number(adjustedPrice))) {
        var expectedPrice = ddpPrice - settings.dduAdjustmentAmount;
        var actualPrice = Number(adjustedPrice);
        
        report += 'AG列（調整価格）: $' + actualPrice.toFixed(2) + '\n';  // AD→AE→AG
        report += '期待値: $' + expectedPrice.toFixed(2) + '\n';

        if (Math.abs(actualPrice - expectedPrice) < 0.01) {
          report += '計算結果: ✅ 正確\n';
          success = true;
        } else {
          report += '計算結果: ❌ 不正確（差異: $' + (actualPrice - expectedPrice).toFixed(2) + '）\n';
        }
      } else {
        report += 'AG列（調整価格）: ❌ 値なし\n';  // AD→AE→AG
      }
    } else {
      report += '閾値判定: 対象外 ($' + dduPrice.toFixed(2) + ' < $' + settings.dduThreshold + ')\n';
      if (!adjustedPrice || adjustedPrice === '') {
        report += 'AG列（調整価格）: ✅ 空白（正常）\n';  // AD→AE→AG
        success = true;
      } else {
        report += 'AG列（調整価格）: ❌ 値あり（異常）\n';  // AD→AE→AG
      }
    }
    
    return { report: report, success: success };
    
  } catch (e) {
    return { 
      report: 'テスト結果検証エラー: ' + e.message + '\n', 
      success: false 
    };
  }
}

/**
 * 出品シートへの反映をテスト
 */
function testListingSheetReflection(workSheetRow, settings) {
  try {
    var listingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('出品用シート');
    if (!listingSheet) {
      return '出品用シートが見つかりません。テストをスキップします。\n';
    }
    
    updateListingSheetPrice(workSheetRow);
    SpreadsheetApp.flush();
    Utilities.sleep(300);
    
    var listingRow = workSheetRow - 2;
    var listingFormula = listingSheet.getRange(listingRow, 8).getFormula();  // H列（変更なし）
    var listingValue = listingSheet.getRange(listingRow, 8).getValue();
    
    var report = '';
    report += '出品シート行: ' + listingRow + '\n';
    report += '設定された数式: ' + listingFormula + '\n';
    report += '計算結果: $' + (typeof listingValue === 'number' ? listingValue.toFixed(2) : listingValue) + '\n';
    
    // ⚠️ 列参照の修正：AD→AE
    if (settings.dduAdjustmentEnabled && listingFormula.indexOf('AE' + workSheetRow) !== -1) {
      report += '価格反映: ✅ DDU調整価格が適用されています\n';
    } else if (listingFormula.indexOf('S' + workSheetRow) !== -1) {  // R→S
      report += '価格反映: 📊 関税込み価格（S列）が適用されています\n';
    } else if (listingFormula.indexOf('R' + workSheetRow) !== -1) {  // Q→R
      report += '価格反映: 📊 販売価格（R列）が適用されています\n';
    } else {
      report += '価格反映: ❓ 不明な数式が設定されています\n';
    }
    
    return report;
    
  } catch (e) {
    return '出品シート反映テストエラー: ' + e.message + '\n';
  }
}

/**
 * DDU価格調整機能の設定状況確認
 */
function checkDduAdjustmentSettings() {
  try {
    var settings = getSettings();
    if (!settings) return;

    var docProps = PropertiesService.getDocumentProperties();

    var report = 'DDU価格調整機能 設定状況:\n\n';

    report += '【基本設定】\n';
    report += '機能有効: ' + (settings.dduAdjustmentEnabled ? 'ON' : 'OFF') + '\n';
    report += 'DDU閾値: $' + settings.dduThreshold + '\n';
    report += '調整額: $' + settings.dduAdjustmentAmount + '\n\n';

    report += '【保存されているプロパティ（DocumentProperties）】\n';
    report += 'DDU_ADJUSTMENT_ENABLED: ' + (docProps.getProperty('DDU_ADJUSTMENT_ENABLED') || '未設定') + '\n';
    report += 'DDU_THRESHOLD: ' + (docProps.getProperty('DDU_THRESHOLD') || '未設定') + '\n';
    report += 'DDU_ADJUSTMENT_AMOUNT: ' + (docProps.getProperty('DDU_ADJUSTMENT_AMOUNT') || '未設定') + '\n\n';
    
    report += '【CONFIG設定】\n';
    report += 'DDU_ADJUSTED_PRICE列: ' + CONFIG.COLUMNS.DDU_ADJUSTED_PRICE + '列目（AE列）\n';  // AD→AE
    report += 'デフォルト閾値: $' + CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_THRESHOLD + '\n';
    report += 'デフォルト調整額: $' + CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_ADJUSTMENT + '\n';
    report += 'ハイライト色: ' + (CONFIG.DDU_PRICE_ADJUSTMENT.HIGHLIGHT_COLOR || '未設定') + '\n\n';
    
    if (!settings.dduAdjustmentEnabled) {
      report += '💡 機能を有効にするには:\n';
      report += '「初期設定」→「DDU価格調整機能」をONにしてください。\n';
    } else {
      report += '✅ 機能は有効です。「DDUテスト実行」で動作確認できます。\n';
    }
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('設定確認エラー: ' + e.message, 'error');
  }
}

/******************************************************
 * 完全版（エラー修正済み）Part 2/5
 *  - 送料ロジック（Q1/Q2/R2/T1/T2 を作業シートから取得）
 *  - Airmail は Shipping_Rates の I/J 列のみを参照
 *  - US宛て前提のまま（ゾーン分岐なし）
 *  - UDF: SHIPPING_COST（数値のみ返す／超過時 999999）
 *  - セル書き込み・数式・ハイライト
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  サーチャージ/追加500g/割引（作業シートの Q1/Q2/R2/T1/T2）


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配送メソッド補助

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  料金表参照 + ロジック

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自動/手動メソッド選定（US宛て前提）


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  【修正4】calculateSpecificMethodRateにeLogistics追加



/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UDF：SHIPPING_COST（数値のみ返す）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  商品状態の検証・ハイライト処理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function validateAndHighlightCondition(sheet, row, condition) {
  var conditionCell = sheet.getRange(row, CONFIG.COLUMNS.CONDITION);
  var validConditions = CONFIG.CONDITION_OPTIONS;
  
  if (!condition || !validConditions.includes(condition)) {
    conditionCell.setValue("エラー");
    conditionCell.setBackground("#ffcdd2");
    conditionCell.setNote("商品状態を判定できませんでした。手動で選択してください。");
    return false;
  }
  
  conditionCell.setValue(condition);
  
  if (condition === "エラー") {
    conditionCell.setBackground("#ffcdd2");
    conditionCell.setNote("商品状態の判定が困難です。手動で選択してください。");
  } else {
    conditionCell.setBackground(null);
    conditionCell.setNote("");
  }
  
  return true;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  シート書き込み・数式・ハイライト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function setCellValues(sheet, row, values) {
  var updates = [
    [row, CONFIG.COLUMNS.WEIGHT, values.weight],      // 25（Y列）
    [row, CONFIG.COLUMNS.METHOD, values.method],      // 24（X列）
    [row, CONFIG.COLUMNS.EN_TITLE, values.title],     // 13（変更なし）
    [row, CONFIG.COLUMNS.EN_DESC, values.description] // 14（変更なし）
  ];

  // サイズをZ, AA, AB列に分解して設定
  if (values.length !== undefined) {
    updates.push([row, CONFIG.COLUMNS.LENGTH, values.length]);  // 26（Z列）
  }
  if (values.width !== undefined) {
    updates.push([row, CONFIG.COLUMNS.WIDTH, values.width]);    // 27（AA列）
  }
  if (values.height !== undefined) {
    updates.push([row, CONFIG.COLUMNS.HEIGHT, values.height]);  // 28（AB列）
  }

  for (var i = 0; i < updates.length; i++) {
    var u = updates[i];
    sheet.getRange(u[0], u[1]).setValue(u[2]);
  }
  
  // 商品状態の設定とハイライト
  if (values.condition) {
    validateAndHighlightCondition(sheet, row, values.condition);  // 28→29
  }
}

// Part 2の setFormulas 関数を以下のように修正してください

function setFormulas(sheet, row, settings) {
  // 🆕 ARRAYFORMULAが設定されているかチェック
  // R4セルに式がある場合はARRAYFORMULA方式が適用されているとみなし、何もしない
  var r4Formula = sheet.getRange('R4').getFormula();
  if (r4Formula && r4Formula.indexOf('ARRAYFORMULA') !== -1) {
    // ARRAYFORMULAが設定されている場合は何もしない
    // X, Y, Z-AB列（配送方法、重量、サイズ）のみAI処理で値が設定される
    return;
  }

  // 以下は旧方式（ARRAYFORMULA未設定時）の処理
  // 依存セルを先に読み込んで計算をトリガー
  sheet.getRange("AF2").getValue();  // 関税率
  sheet.getRange("AG2").getValue();  // 安全係数
  sheet.getRange("AE1").getValue();  // 通関手数料
  sheet.getRange("C2").getValue();   // 為替レート
  SpreadsheetApp.flush();
  var feeRate = sheet.getRange("F1").getValue() || 0;  // 手数料率
  var adRate  = sheet.getRange("F2").getValue() || 0;  // 広告率

  // V列: 手数料率を値として設定
  sheet.getRange(row, CONFIG.COLUMNS.FEE).setValue(feeRate);
  
  if (settings.profitCalculationMethod === 'RATE') {
    // 利益率モード
    var profitRate = sheet.getRange("H2").getValue() || 0;  // 利益率
    // W列: 利益率を値として設定
    sheet.getRange(row, CONFIG.COLUMNS.RATE).setValue(profitRate);
    
    // ✅ 合算方式に修正
    sheet.getRange(row, CONFIG.COLUMNS.PRICE).setFormula(  // 17→18
     '=ROUND(((I' + row + '+T' + row + ')/(1-(V' + row + '+W' + row + '+$F$2+$Z$2))/$C$2)*100)/100'
     // (仕入れ値+送料) ÷ (1-(手数料率+利益率+広告率+Payoneer率)) ÷ 為替レート
    );
    
    // ✅ 利益計算式も合算方式に修正
    sheet.getRange(row, CONFIG.COLUMNS.PROFIT).setFormula(  // 20→21
      '=ROUND(R' + row + '*$C$2*(1-(V' + row + '+$F$2+$Z$2)) - I' + row + ' - T' + row + ', 0)'
      // 販売価格×為替×(1-(手数料率+広告率+Payoneer率)) - 仕入れ値 - 送料
    );
    
  } else {
    // 利益額モード
    var costYen = sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue();
    var profitAmount = sheet.getRange("H1").getValue();
    if (!profitAmount || isNaN(profitAmount)) profitAmount = getProfitAmountByCost(costYen);

    // W列: 利益率をクリア（利益額モードでは使用しない）
    sheet.getRange(row, CONFIG.COLUMNS.RATE).clearContent();
    // U列: 利益額を値として設定
    sheet.getRange(row, CONFIG.COLUMNS.PROFIT).setValue(profitAmount);
  
    // ✅ 合算方式に修正（利益率は含まない）
    sheet.getRange(row, CONFIG.COLUMNS.PRICE).setFormula(  // 17→18
      '=ROUND(((I' + row + '+T' + row + '+U' + row + ')/(1-(V' + row + '+$F$2+$Z$2))/$C$2)*100)/100'
      // (仕入れ値+送料+利益額) ÷ (1-(手数料率+広告率+Payoneer率)) ÷ 為替レート
    );
  }
  
  // 🔹 修正: 関税込み価格から通関手数料を削除
sheet.getRange(row, CONFIG.COLUMNS.TAX_INCLUDED_PRICE).setFormula(  // 18→19（S列）
  '=ROUND(R' + row + '+AD' + row + ',2)'
  // R列（販売価格） + AD列（想定関税+通関手数料）
);

 // 🔹 想定関税計算: 関税額 + 関税処理手数料 + (通関手数料円 ÷ 為替) + MPF$ + (EU送料差額円 ÷ 為替)
 // 関税額 = 販売価格 × 関税率
 // 関税処理手数料 = (販売価格 × 関税率 × 関税処理手数料率) + (販売価格 × VAT率 × 関税処理手数料率)
 // CE（Cpass-Economy）の場合のみAB2の通関手数料を適用、それ以外のクーリエは0
sheet.getRange(row, CONFIG.COLUMNS.ESTIMATED_TAX).setFormula(  // 27→28→30（AD列）
  '=ROUND(R' + row + '*$AF$2*(1+$AG$2)+R' + row + '*$AE$2*$AG$2+IF(X' + row + '="CE",$AB$2/$C$2,0)+$AH$2+$AC$2/$C$2,2)'
  // AF2=関税率, AE2=VAT率, AG2=関税処理手数料率, AE1=米国通関処理手数料(円)※将来用, AB2=CE用通関手数料(円), AH2=MPF($), AC2=EU送料差額(円), C2=為替レート
);
  
// DDU価格調整機能
  if (settings.dduAdjustmentEnabled) {
    var priceMode = getPriceDisplayMode();
    
    if (priceMode !== 'TAX_INCLUDED') {
      // DDU価格調整の計算式を設定
      var dduFormula = '=IF(AND(R' + row + '>=' + settings.dduThreshold + ', NOT(ISBLANK(S' + row + '))), S' + row + '-' + settings.dduAdjustmentAmount + ', "")';
      // Q→R（DDU販売価格）
      // R→S（DDP関税込み価格）
      
      var dduCell = sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE);  // 30→31
      
      dduCell.setFormula(dduFormula);
      dduCell.setNumberFormat('0.00');
      setDduAdjustmentHighlight(sheet, row);
    } else {
      // DDP（関税込み）モードの場合はAD列をクリア
      // AC→AD列
      var dduCell = sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE);  // 30→31
      dduCell.clearContent();
      dduCell.setBackground(null);
      dduCell.setNumberFormat('General');
    }
  } else {
    // 機能無効時はAD列をクリア
    // AC→AD列
    var dduCell = sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE);  // 30→31
    dduCell.clearContent();
    dduCell.setBackground(null);
    dduCell.setNumberFormat('General');
  }
  
  // 送料計算（Formula Factoryで式を生成）
  if (settings.shippingCalculationMethod === 'FIXED') {
    var fixed = sheet.getRange("J1").getValue();
    if (!fixed || isNaN(fixed)) fixed = getShippingCostByCost(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());
    sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setValue(fixed);
  } else {
    var formulas = buildShippingFormulas_(row, settings.shippingCalculationMethod);
    sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setFormula(formulas.shippingFormula);
    if (formulas.refEbayFormula) {
      sheet.getRange(row, CONFIG.COLUMNS.REF_EBAY).setFormula(formulas.refEbayFormula);
    }
  }
  
  sheet.getRange(row, CONFIG.COLUMNS.VOLUME)  // 26→27→29
    .setFormula('=MAX(ROUND((Z' + row + '*AA' + row + '*AB' + row + ')/5),200)');
    // Z列: 長さ、AA列: 幅、AB列: 高さ

  setPriceCellHighlight(sheet, row);
  updateListingSheetPrice(row); // 🆕 DDU価格も考慮されるように後で修正
 // 画面表示を強制更新
  SpreadsheetApp.flush();
  var currentCell = SpreadsheetApp.getActiveRange();
  sheet.getRange(row, 1).activate();  // 該当行の最初のセルをアクティブ化
  if (currentCell) {
    currentCell.activate();  // 元の選択範囲に戻す
  }
  
}

// 🆕 DDU価格調整のハイライト設定関数（新規追加）
function setDduAdjustmentHighlight(sheet, row) {
  try {
    var dduCell = sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE);  // 30→31
    
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(NOT(ISBLANK(AE' + row + ')), AE' + row + '<>"", ISNUMBER(AE' + row + '))')
      // AD→AE（DDU調整価格列）
      .setBackground(CONFIG.DDU_PRICE_ADJUSTMENT.HIGHLIGHT_COLOR || '#ffe0b3')
      .setRanges([dduCell])
      .build();
    
    var existingRules = sheet.getConditionalFormatRules();
    existingRules.push(rule);
    sheet.setConditionalFormatRules(existingRules);
    
  } catch (e) {
    console.error('DDUハイライト設定エラー: ' + e.message);
    try {
      sheet.getRange(row, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE).setBackground('#ffe0b3');  // 30→31
    } catch (e2) {}
  }
}

/** EN_DESCハイライト（キーワードを含む場合） */
function setHighlight(sheet, row, description) {
  // ハイライト機能を無効化
  return;
}

/** UDFが返したエラー（999999相当）を赤文字に */
function formatShippingCellIfError(sheet, row) {
  SpreadsheetApp.flush();
  Utilities.sleep(200);
  var cell = sheet.getRange(row, CONFIG.COLUMNS.SHIPPING);  // 19→20
  var val = Number(cell.getValue());
  if (val >= 999000) {
    cell.setFontColor('#d32f2f');
    cell.setNote('送料計算エラー/未定義。レート表や入力値を確認してください。');
  } else {
    cell.setFontColor(null);
    cell.setNote('');
  }
}

/** フォールバック（サイズ/重量制限でePacket不可 → FedExへ）を赤背景で表示 */
function markMethodFallbackIfNeeded(sheet, row, originalMethod, reason) {
  var cell = sheet.getRange(row, CONFIG.COLUMNS.METHOD);  // 23→24
  var note = 'フォールバック理由: ' + reason;
  cell.setBackground('#ffebee');
  cell.setNote(note);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  利益額レンジ（Profit_Amounts）- 必要な関数のみ先に定義
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getProfitAmountByCost(costYen) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = "Profit_Amounts";
    var sh = ss.getSheetByName(name);
    if (!sh) return 0;
    var last = sh.getLastRow();
    if (last < 2) return 0;
    var data = sh.getRange(2,1,last-1,3).getValues();
    for (var i=0;i<data.length;i++) {
      var min = data[i][0], max = data[i][1], amt = data[i][2];
      if (typeof min!=='number' || isNaN(min) || typeof amt!=='number' || isNaN(amt)) continue;
      if (costYen >= min) {
        if (max === "" || typeof max!=='number' || isNaN(max) || costYen <= max) return amt;
      }
    }
    return 0;
  } catch (e) {
    return 0;
  }
}

function getShippingCostByCost(costYen) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var name = "Profit_Amounts";
    var sh = ss.getSheetByName(name);
    if (!sh) return 0;
    var last = sh.getLastRow();
    if (last < 2) return 0;
    var data = sh.getRange(2,1,last-1,4).getValues();
    for (var i=0;i<data.length;i++) {
      var min = data[i][0], max = data[i][1], ship = data[i][3];
      if (typeof min!=='number' || isNaN(min)) continue;
      if (costYen >= min) {
        if (max === "" || typeof max!=='number' || isNaN(max) || costYen <= max) {
          return (typeof ship==='number' && !isNaN(ship)) ? ship : 0;
        }
      }
    }
    return 0;
  } catch (e) {
    return 0;
  }
}
/******************************************************
 * 完全版（エラー修正済み）Part 3/5
 *  - 実行フロー（runAllAuto / runSelectedRows）
 *  - トリガー/状態管理
 *  - トークン見積（USD）ラッパー
 *  - 並列処理用ヘルパー関数（統一版）
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配列を指定サイズごとに分割

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  トークン見積（USD）— 入出力別の合算

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  並列AI処理用ヘルパー（統一版・完全版）


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料固定モード対応版：applyAIResultToRow_
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function applyAIResultToRow_(sheet, row, settings, fields, manualWeight, manualSize, costYen) {
  if (settings.shippingCalculationMethod === 'FIXED') {
    // 🔹 修正: 送料固定時でも配送方法は判定する
    var determinedMethod = getSelectedShippingMethod(costYen, 0, 0, '');

    setCellValues(sheet, row, {
      weight: '',  // 空欄
      length: '',  // 空欄
      width: '',   // 空欄
      height: '',  // 空欄
      method: determinedMethod,  // 配送方法は出力
      title: (fields && fields.title) || '',
      description: (fields && fields.description) || '',
      condition: (fields && fields.condition) || '',
      ebayCategory: (fields && fields.ebayCategory) || ''
    });
  } else {
    // 既存のテーブル計算モード
    // manualWeightとmanualSizeは削除され、個別にシートから読み取る必要がある
    var weight = Number(sheet.getRange(row, CONFIG.COLUMNS.WEIGHT).getValue());
    var length = Number(sheet.getRange(row, CONFIG.COLUMNS.LENGTH).getValue());
    var width = Number(sheet.getRange(row, CONFIG.COLUMNS.WIDTH).getValue());
    var height = Number(sheet.getRange(row, CONFIG.COLUMNS.HEIGHT).getValue());

    if (!weight) throw new Error('重量未設定');

    // 容積重量計算（既存ロジックと同じ）
    var volWeight = (length && width && height) ? (length * width * height) / 5000 : 0;
    var sizeStr = (length && width && height) ? length + 'x' + width + 'x' + height : '';

    var method = getSelectedShippingMethod(costYen, weight, volWeight, sizeStr);

    setCellValues(sheet, row, {
      weight: weight,
      length: length,
      width: width,
      height: height,
      method: method,
      title: (fields && fields.title) || '',
      description: (fields && fields.description) || '',
      condition: (fields && fields.condition) || '',
      ebayCategory: (fields && fields.ebayCategory) || ''
    });
  }

  setFormulas(sheet, row, settings);
  setHighlight(sheet, row, (fields && fields.description) || '');
  formatShippingCellIfError(sheet, row);
}

/**
 * カテゴリー選択ダイアログからの結果を処理
 */
function handleCategorySelection(selectedCategory) {
  if (selectedCategory) {
    // カテゴリーを保存
    saveSelectedCategory(selectedCategory);
    
    // 直接実行（setTimeoutは使用不可）
    executeTemplateUpdate();
    
  } else {
    // キャンセル時
    showAlert('カテゴリー選択がキャンセルされました。', 'info');
    
    // 一時保存した範囲をクリア
    var props = PropertiesService.getDocumentProperties();
    props.deleteProperty('TEMPLATE_UPDATE_START_ROW');
    props.deleteProperty('TEMPLATE_UPDATE_END_ROW');
  }
}
/**
 * 実際のテンプレート更新処理を実行
 */
function executeTemplateUpdate() {
  try {
    var selectedCategory = getSavedCategory();
    if (!selectedCategory) {
      showAlert('カテゴリーが選択されていません。', 'warning');
      return;
    }
    
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;

    // 一時保存した範囲を取得
    var props = PropertiesService.getDocumentProperties();
    var startRow = parseInt(props.getProperty('TEMPLATE_UPDATE_START_ROW'));
    var endRow = parseInt(props.getProperty('TEMPLATE_UPDATE_END_ROW'));
    
    // 一時保存をクリア
    props.deleteProperty('TEMPLATE_UPDATE_START_ROW');
    props.deleteProperty('TEMPLATE_UPDATE_END_ROW');

    var configuredSheetName = settings.sheetName;
    var updatedCount = 0;
    var errorCount = 0;
    var skippedCount = 0;

    for (var row = startRow; row <= endRow; row++) {
      if (row < 5) {
        skippedCount++;
        continue;
      }
      
      try {
        if (setTemplateToWorkSheet(sheet, row)) {
          updatedCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        console.error('行' + row + 'のテンプレート更新エラー: ' + e.message);
        errorCount++;
      }
    }

    // 処理完了後にカテゴリークリア
    clearSavedCategory();

     var report = 'テンプレート更新完了:\n\n' +
      '対象シート: 「' + configuredSheetName + '」\n' +
      '選択カテゴリー: ' + selectedCategory + '\n' +
      '対象範囲: ' + startRow + '～' + endRow + '行\n' +
      '更新成功: ' + updatedCount + '行\n' +
      '更新失敗: ' + errorCount + '行\n' +
      'スキップ: ' + skippedCount + '行\n\n' +
      '失敗の原因:\n' +
      '- 価格（R列）、商品状態（AC列）、配送方法（X列）が未入力\n' +  // ⚠️ ここだけ変更：Q→R, AB→AC, W→X
      '- 配送方法が「自動選択」になっている\n' +
      '- 参照データで該当する組み合わせが見つからない';

    showAlert(report, updatedCount > 0 ? 'success' : 'warning');

  } catch (error) {
    clearSavedCategory();
    showAlert('テンプレート更新エラー: ' + error.message, 'error');
  }
}
/**
 * 選択行の4次元検索データをデバッグ確認
 */
function debugSelectedRowsData() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;
    
    var range = sheet.getActiveRange();
    if (!range) {
      showAlert('デバッグする行を選択してください。', 'info');
      return;
    }
    
    var startRow = range.getRow();
    var endRow = range.getLastRow();
    var selectedCategory = getSavedCategory() || 'カテゴリー未選択';
    
    var report = '選択行データデバッグ:\n\n';
    report += '選択カテゴリー: ' + selectedCategory + '\n';
    report += '対象範囲: ' + startRow + '～' + endRow + '行\n\n';
    
    for (var row = Math.max(startRow, 5); row <= Math.min(endRow, startRow + 3); row++) {
      var priceUSD = sheet.getRange(row, CONFIG.COLUMNS.PRICE).getValue();  // 17→18
      var condition = sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue();  // 28→29
      var shippingMethod = sheet.getRange(row, CONFIG.COLUMNS.METHOD).getValue();  // 23→24
      var shippingType = convertShippingMethodToType(String(shippingMethod || ''));
      
      report += '【行' + row + '】\n';
      report += '価格(R): ' + priceUSD + ' (' + typeof priceUSD + ')\n';  // Q→R
      report += '状態(AC): "' + condition + '" (' + typeof condition + ')\n';  // AB→AC
      report += '配送方法(X): "' + shippingMethod + '"\n';  // W→X
      report += '配送タイプ変換: "' + shippingType + '"\n';
      
      // 4次元検索テスト
      if (selectedCategory && selectedCategory !== 'カテゴリー未選択') {
        var templateResult = getTemplateFromReferenceData4D(selectedCategory, String(condition), shippingType, Number(priceUSD));
        report += '検索結果: ' + (templateResult !== null ? 'テンプレート' + templateResult : '見つからず') + '\n';
      }
      report += '\n';
    }
    
    if (endRow - Math.max(startRow, 5) > 3) {
      report += '... (残り' + (endRow - Math.max(startRow, 5) - 3) + '行は省略)\n';
    }
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('デバッグエラー: ' + error.message, 'error');
  }
}

/**
 * カテゴリーを保持したまま4次元検索をテスト
 */
function testTemplateSearchWithCategory() {
  try {
    // 手動でカテゴリーを設定
    saveSelectedCategory('その他');
    
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;
    
    var testRow = 5; // 行5でテスト
    
    // 実際のデータで4次元検索をテスト
    var priceUSD = sheet.getRange(testRow, CONFIG.COLUMNS.PRICE).getValue();
    var condition = sheet.getRange(testRow, CONFIG.COLUMNS.CONDITION).getValue();
    var shippingMethod = sheet.getRange(testRow, CONFIG.COLUMNS.METHOD).getValue();
    var shippingType = convertShippingMethodToType(String(shippingMethod || ''));
    var selectedCategory = getSavedCategory();
    
    var report = '4次元検索テスト（カテゴリー保持）:\n\n';
    report += '検索条件:\n';
    report += 'カテゴリー: ' + selectedCategory + '\n';
    report += '状態: ' + condition + '\n';
    report += '配送タイプ: ' + shippingType + '\n';
    report += '価格: $' + priceUSD + '\n\n';
    
    // 4次元検索実行
    var templateResult = getTemplateFromReferenceData4D(selectedCategory, String(condition), shippingType, Number(priceUSD));
    
    report += '検索結果: ' + (templateResult !== null ? 'テンプレートID ' + templateResult : '該当なし') + '\n\n';
    
    if (templateResult === null) {
      report += '該当なしの原因確認:\n';
      report += '- 参照データに「その他, ' + condition + ', ' + shippingType + ', $' + priceUSD + '」の組み合わせが存在するか確認してください';
    }
    
    showAlert(report, templateResult !== null ? 'success' : 'warning');
    
    // テスト後はカテゴリーをクリア
    clearSavedCategory();
    
  } catch (error) {
    showAlert('検索テストエラー: ' + error.message, 'error');
    clearSavedCategory();
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  対象行の抽出・1行処理

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自動再試行機能付き翻訳処理
  🔹 50行まとめて並列APIコールは維持
  🔹 エラー行のみを選択的に再試行
  🔹 翻訳結果の自動検証
  🔹 最大3回まで再試行
  🔹 シートへの書き込みは呼び出し元で実行
  🔹 処理状況をコンソールに表示

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料固定モード対応版：processRow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function processRow(sheet, row, settings, manualWeight, manualSize) {
  try {
    var jpTitle = sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).getValue();    // 10
    var jpDesc  = sheet.getRange(row, CONFIG.COLUMNS.JP_DESC).getValue();     // 11
    var costYen = Number(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());  // 9
    if (!jpTitle || !jpDesc || !costYen) {
      return { success:false, skip:true, error:'必要入力不足' };
    }

    var ai = callAIWithRetry(jpTitle, jpDesc, 1, costYen, settings);
    if (!ai.success) return { success:false, error: ai.error || 'AI失敗' };
    var data = ai.data;

    if (settings.shippingCalculationMethod === 'FIXED') {
      // 🔹 修正: 送料固定時でも配送方法は判定する
      // 重量・サイズがないので、costYenのみで配送方法を決定
      var determinedMethod = getSelectedShippingMethod(costYen, 0, 0, '');
      
      setCellValues(sheet, row, {
        weight: '',  // 空欄
        size: '',    // 空欄
        method: determinedMethod,  // 配送方法は出力
        title: data.title || '',
        description: data.description || '',
        condition: data.condition || '',
        ebayCategory: data.ebayCategory || ''
      });
    } else {
      // 既存のテーブル計算モード（変更なし）
      var weight = Number(manualWeight);
      var size = String(manualSize || '');
      if (!weight || !size) return { success: false, error: '重量/サイズ未設定' };

      var volWeight = weight;
      var method = getSelectedShippingMethod(costYen, weight, volWeight, size);

      setCellValues(sheet, row, {
        weight: weight,
        size: size,
        method: method,
        title: data.title || '',
        description: data.description || '',
        condition: data.condition || '',
        ebayCategory: data.ebayCategory || ''
      });
    }

    setFormulas(sheet, row, settings);
    setHighlight(sheet, row, data.description || '');
    formatShippingCellIfError(sheet, row);

    return {
      success: true,
      tokens_prompt: (data.usage && data.usage.prompt_tokens) || 0,
      tokens_completion: (data.usage && data.usage.completion_tokens) || 0,
      model_used: data.model_used || settings.model,
      model_fallback: !!data.model_fallback
    };
  } catch (e) {
    return { success:false, error: e.message || String(e) };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  為替更新

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  実行フロー：一括 & 選択行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  修正版：正しく分離した制御機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. ポップアップ表示制御（初期設定ベース）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  2. 作業停止制御（D2セル GO/STOP）

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  全体実行：翻訳+計算（最適化版）
  🔹 翻訳50行並列 + 計算50行バッチ
  🔹 P2セル対応追加
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function runSelectedRows() {
  var SCRIPT_NAME = 'runSelectedRows';
  var props = PropertiesService.getDocumentProperties();
  var startTime = new Date();

  var totalPrompt = parseInt(props.getProperty('totalPrompt') || '0');
  var totalCompletion = parseInt(props.getProperty('totalCompletion') || '0');
  var processedCount = parseInt(props.getProperty('processedCount') || '0');
  var errorCount = parseInt(props.getProperty('errorCount') || '0');
  var skippedCount = parseInt(props.getProperty('skippedCount') || '0');
  var validationErrorCount = 0;
  var allRetryDetails = [];

  var selectedRows, manualWeight, manualSize;
  var startRowIndex = parseInt(props.getProperty('lastProcessedRowIndex') || '0');

  try {
    var settings = getSettings(); 
    if (!settings) { 
      clearProcessingState(); 
      clearAllTriggers(); 
      return; 
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。','error');
      clearProcessingState();
      clearAllTriggers();
      return;
    }

    // 作業シートのAS2セルからプロンプトIDを読み取り（設定値を上書き）
    try {
      var sheetPromptId = sheet.getRange('AS2').getValue();
      if (sheetPromptId && String(sheetPromptId).trim()) {
        settings.promptId = String(sheetPromptId).trim();
      }
    } catch (e) {
      // AS2セルが存在しない場合は既存のpromptIdを使用
      console.log('AS2セルからプロンプトIDを読み取れませんでした。既存の設定を使用します: ' + e.message);
    }

    var isContinuing = props.getProperty('isProcessing') === 'true' && props.getProperty('processingMode') === SCRIPT_NAME;

    if (!isContinuing) {
      clearProcessingState();
      clearAllTriggers();
      updateExchangeRate(sheet);

      var active = sheet.getActiveRange();
      if (!active) { 
        conditionalShowAlert("処理する行を選択してください。", "info"); 
        return; 
      }
      var startRow = active.getRow(), endRow = active.getLastRow();
      if (endRow < 5) { 
        conditionalShowAlert("5行目以降のデータを選択してください。","info"); 
        return; 
      }

      // 一括読み取りでパフォーマンス向上
      selectedRows = [];
      var numRows = endRow - startRow + 1;
      var dataRange = sheet.getRange(startRow, 1, numRows, CONFIG.COLUMNS.EN_DESC);
      var values = dataRange.getValues();

      for (var i = 0; i < values.length; i++) {
        var actualRow = startRow + i;
        if (actualRow < 5) { skippedCount++; continue; }

        var jpTitle = values[i][CONFIG.COLUMNS.JP_TITLE - 1];
        var jpDesc = values[i][CONFIG.COLUMNS.JP_DESC - 1];
        var costYen = Number(values[i][CONFIG.COLUMNS.COST_YEN - 1]);
        var enTitle = values[i][CONFIG.COLUMNS.EN_TITLE - 1];
        var enDesc = values[i][CONFIG.COLUMNS.EN_DESC - 1];

        if (jpTitle && jpDesc && costYen && (!enTitle || !enDesc)) {
          selectedRows.push(actualRow);
        } else {
          skippedCount++;
        }
      }
      if (selectedRows.length === 0) { 
        conditionalShowAlert("選択範囲に処理対象がありません。", "info"); 
        return; 
      }

      var manualWeight = sheet.getRange("J2").getValue();
      var L = sheet.getRange("L2").getValue();
      var M = sheet.getRange("M2").getValue();
      var N = sheet.getRange("N2").getValue();

      if (settings.shippingCalculationMethod !== 'FIXED') {
        if (![manualWeight, L, M, N].every(function(v){ return typeof v === 'number' && v > 0; })) {
          showAlert('テーブル計算モードではJ2/L2/M2/N2に正の数値を入力してください。\n送料固定モードでは不要です。', "error"); 
          return;
        }
      } else {
        manualWeight = manualWeight || 0;
        L = L || 0;
        M = M || 0; 
        N = N || 0;
      }

      var manualSize = (L > 0 && M > 0 && N > 0) ? L + 'x' + M + 'x' + N : '固定送料';

      var platformNames = { openai:'OpenAI', claude:'Claude', gemini:'Gemini' };
      var confirmMessage = '選択 ' + selectedRows.length + ' 件を処理します。\n\n' +
        'AI: ' + platformNames[settings.platform] + ' / ' + settings.model + '\n' +
        '梱包重量: ' + manualWeight + ' g\n梱包サイズ: ' + manualSize + '\n\n' +
        '💡 D2セルでGO/STOP切り替え可能\n' +
        '💡 翻訳25行並列 + 計算25行バッチ\n\nよろしいですか？';
      
      var ok = conditionalStartConfirmation(confirmMessage, '選択行の実行確認');
      if (ok !== SpreadsheetApp.getUi().Button.YES) {
        conditionalShowAlert('キャンセルしました。', "info");
        return;
      }

      // サイドバーの進捗データを初期化
      props.setProperty('sidebarProgress', JSON.stringify({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '行チェック開始...',
        logType: 'info'
      }));

      // サイドバーを先に表示（パフォーマンス改善）
      showProgressSidebar_();

      props.setProperty('targetRows', JSON.stringify(selectedRows));
      props.setProperty('manualWeight', manualWeight.toString());
      props.setProperty('manualSize', manualSize);
      props.setProperty('isProcessing', 'true');
      props.setProperty('processingMode', SCRIPT_NAME);
      props.setProperty('startTime', startTime.getTime().toString());
      props.setProperty('skippedCount', skippedCount.toString());
      props.setProperty('lastProcessedRowIndex', '0');
      startRowIndex = 0;

      // SKU自動生成（C列が空の行にのみ値を書き込む）
      try {
        var skuResult = generateSkuForRows_(sheet, selectedRows);
        if (skuResult.generated > 0) {
          Logger.log('[runSelectedRows] SKU自動生成: ' + skuResult.generated + '件');
        }
      } catch (skuErr) {
        Logger.log('[runSelectedRows] SKU生成エラー（処理は続行）: ' + skuErr.message);
      }

      // サイドバー更新: 処理対象を検出
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '処理対象: ' + selectedRows.length + '件を検出',
        logType: 'info'
      });
    } else {
      selectedRows = JSON.parse(props.getProperty('targetRows'));
      manualWeight = parseInt(props.getProperty('manualWeight'));
      manualSize = props.getProperty('manualSize');
      startTime = new Date(parseInt(props.getProperty('startTime')));
      skippedCount = parseInt(props.getProperty('skippedCount') || '0');
      conditionalShowAlert('処理を再開します。残り ' + (selectedRows.length - startRowIndex) + '件。', "info");
    }

    // 🔹 P2セルの商品状態モードを1回だけ読み取る
    var conditionMode = sheet.getRange("P2").getValue();

    // 🔹 50行ずつのバッチに分割
    var BATCH_SIZE = 50;
    var batches = createBatches(selectedRows.slice(startRowIndex), BATCH_SIZE);
    var rowsSeenInThisRun = 0;
    var processedInThisBatch = 0;

    // サイドバー更新: 処理開始
    updateProgressSidebar_({
      currentBatch: 0,
      totalBatches: batches.length,
      successCount: processedCount,
      errorCount: errorCount,
      message: '翻訳・計算処理開始 (全' + batches.length + 'バッチ)',
      logType: 'info'
    });

    for (var bi = 0; bi < batches.length; bi++) {
      var batch = batches[bi];

      // サイドバー更新: バッチ開始
      updateProgressSidebar_({
        currentBatch: bi + 1,
        totalBatches: batches.length,
        successCount: processedCount,
        errorCount: errorCount,
        message: 'バッチ ' + (bi + 1) + '/' + batches.length + ' 処理開始',
        logType: 'info'
      });

      // 🔹 翻訳フェーズ：バッチ全体を一度に処理
      // 一括読み取りでパフォーマンス向上
      var items = [];
      if (batch.length > 0) {
        var minRow = Math.min.apply(null, batch);
        var maxRow = Math.max.apply(null, batch);
        var batchDataRange = sheet.getRange(minRow, 1, maxRow - minRow + 1, CONFIG.COLUMNS.EN_DESC);
        var batchValues = batchDataRange.getValues();

        for (var k = 0; k < batch.length; k++) {
          var row = batch[k];
          var rowIndex = row - minRow;
          var jpTitle = batchValues[rowIndex][CONFIG.COLUMNS.JP_TITLE - 1];
          var jpDesc = batchValues[rowIndex][CONFIG.COLUMNS.JP_DESC - 1];
          var costYen = Number(batchValues[rowIndex][CONFIG.COLUMNS.COST_YEN - 1]);
          var enTitle = batchValues[rowIndex][CONFIG.COLUMNS.EN_TITLE - 1];
          var enDesc = batchValues[rowIndex][CONFIG.COLUMNS.EN_DESC - 1];

          if (jpTitle && jpDesc && costYen > 0 && (!enTitle || !enDesc)) {
            items.push({ row: row, jpTitle: jpTitle, jpDesc: jpDesc, costYen: costYen });
          } else {
            skippedCount++;
          }
        }
      }
      
      if (items.length > 0) {
        // 🔹 初回翻訳: バッチ全体を並列処理
        var par = executeTranslationWithRetry_(items, settings, sheet, conditionMode, 1);

        var validatedItems = [];
        var failedItems = [];

        // 翻訳結果を検証
        for (var idx = 0; idx < par.results.length; idx++) {
          var res = par.results[idx];
          if (res.ok) {
            try {
              // まず翻訳結果をシートに反映
              applyTranslationToRow_(sheet, res.row, res.fields, conditionMode);
              validatedItems.push(res);
              totalPrompt += (res.usage && res.usage.in) || 0;
              totalCompletion += (res.usage && res.usage.out) || 0;
            } catch (eRow) {
              console.error('  ❌ 行' + res.row + ': シート反映エラー: ' + eRow.message);
              failedItems.push(items[idx]);
            }
          } else {
            console.error('  ❌ 行' + res.row + ': 翻訳失敗: ' + (res.error || '不明なエラー'));
            failedItems.push(items[idx]);
          }
        }

        // スプレッドシートの計算式を完了させる
        SpreadsheetApp.flush();

        // 書き込み後に検証
        var revalidateFailedItems = [];
        for (var vidx = 0; vidx < validatedItems.length; vidx++) {
          var vres = validatedItems[vidx];
          var validation = validateTranslationResult_(sheet, vres.row, vres.fields);
          if (!validation.valid) {
            var errorMsg = '行' + vres.row + ': ' + validation.errors.join(', ');
            console.warn('  ⚠️ ' + errorMsg);
            // サイドバーにエラー詳細を表示
            updateProgressSidebar_({
              currentBatch: bi + 1,
              totalBatches: batches.length,
              successCount: processedCount,
              errorCount: errorCount + revalidateFailedItems.length + 1,
              message: '❌ ' + errorMsg,
              logType: 'error'
            });
            revalidateFailedItems.push(items[vidx]);
          } else {
            processedCount++;
            processedInThisBatch++;
          }
        }

        // 検証エラーがあった場合は再試行対象に追加
        for (var rfidx = 0; rfidx < revalidateFailedItems.length; rfidx++) {
          failedItems.push(revalidateFailedItems[rfidx]);
        }

        // 🔹 検証エラー行のみ再試行 (最大3回まで)
        var remainingItems = failedItems;
        var maxRetries = 3;
        var retryAttempt = 1;

        while (remainingItems.length > 0 && retryAttempt < maxRetries) {
          console.log('  🔁 検証エラー ' + remainingItems.length + '件を再試行します (' + (retryAttempt + 1) + '回目)');

          // サイドバー更新: 再試行開始
          updateProgressSidebar_({
            currentBatch: bi + 1,
            totalBatches: batches.length,
            successCount: processedCount,
            errorCount: errorCount,
            message: '🔁 ' + remainingItems.length + '件を再試行中 (' + (retryAttempt + 1) + '回目)',
            logType: 'warning'
          });

          Utilities.sleep(2000);

          var retryPar = executeTranslationWithRetry_(remainingItems, settings, sheet, conditionMode, 1);

          var retryValidated = [];
          var retryFailed = [];

          for (var ridx = 0; ridx < retryPar.results.length; ridx++) {
            var rres = retryPar.results[ridx];
            if (rres.ok) {
              try {
                // まず翻訳結果をシートに反映
                applyTranslationToRow_(sheet, rres.row, rres.fields, conditionMode);
                retryValidated.push(rres);
                totalPrompt += (rres.usage && rres.usage.in) || 0;
                totalCompletion += (rres.usage && rres.usage.out) || 0;
              } catch (eRow) {
                console.error('  ❌ 行' + rres.row + ': シート反映エラー: ' + eRow.message);
                retryFailed.push(remainingItems[ridx]);
              }
            } else {
              console.error('  ❌ 行' + rres.row + ': 翻訳失敗: ' + (rres.error || '不明なエラー'));
              retryFailed.push(remainingItems[ridx]);
            }
          }

          // スプレッドシートの計算式を完了させる
          SpreadsheetApp.flush();

          // 書き込み後に検証
          var retryRevalidateFailed = [];
          for (var rvidx = 0; rvidx < retryValidated.length; rvidx++) {
            var rvres = retryValidated[rvidx];
            var rvalidation = validateTranslationResult_(sheet, rvres.row, rvres.fields);
            if (!rvalidation.valid) {
              var errorMsg = '行' + rvres.row + ': ' + rvalidation.errors.join(', ');
              console.warn('  ⚠️ ' + errorMsg);
              // サイドバーにエラー詳細を表示
              updateProgressSidebar_({
                currentBatch: bi + 1,
                totalBatches: batches.length,
                successCount: processedCount,
                errorCount: errorCount + retryRevalidateFailed.length + 1,
                message: '❌ ' + errorMsg,
                logType: 'error'
              });
              retryRevalidateFailed.push(remainingItems[rvidx]);
              allRetryDetails.push({ row: rvres.row, attempts: retryAttempt + 1, status: '検証エラー', errors: rvalidation.errors });
            } else {
              console.log('  ✅ 行' + rvres.row + ': 再試行' + (retryAttempt + 1) + '回目で成功');
              allRetryDetails.push({ row: rvres.row, attempts: retryAttempt + 1, status: '成功' });
              processedCount++;
              processedInThisBatch++;
            }
          }

          // 検証エラーを追加
          for (var rrfidx = 0; rrfidx < retryRevalidateFailed.length; rrfidx++) {
            retryFailed.push(retryRevalidateFailed[rrfidx]);
          }

          remainingItems = retryFailed;
          retryAttempt++;
        }

        // 最終的に失敗した行をカウント
        for (var f = 0; f < remainingItems.length; f++) {
          errorCount++;
          validationErrorCount++;
          console.error('  💀 行' + remainingItems[f].row + ': ' + maxRetries + '回試行後も失敗');
          allRetryDetails.push({ row: remainingItems[f].row, attempts: maxRetries, status: '失敗' });
        }
      }

      // 🔹 計算フェーズ：翻訳済みの行をバッチで計算
      var rowsToCalculate = [];
      for (var k = 0; k < batch.length; k++) {
        var row = batch[k];
        var jpTitle = sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).getValue();
        var jpDesc = sheet.getRange(row, CONFIG.COLUMNS.JP_DESC).getValue();
        var costYen = Number(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());
        if (jpTitle && jpDesc && costYen > 0) {
          rowsToCalculate.push(row);
        }
      }
      
      if (rowsToCalculate.length > 0) {
        try {
          // 🔹 計算を一括実行
          applyCalculationBatch_(sheet, rowsToCalculate, settings, manualWeight, manualSize);
        } catch (eCalc) {
          errorCount += rowsToCalculate.length;
          console.error('計算バッチエラー: ' + eCalc.message);
        }
      }

      // サイドバー更新: バッチ完了
      updateProgressSidebar_({
        currentBatch: bi + 1,
        totalBatches: batches.length,
        successCount: processedCount,
        errorCount: errorCount,
        message: 'バッチ ' + (bi + 1) + '/' + batches.length + ' 完了 (成功: ' + processedCount + ', エラー: ' + errorCount + ')',
        logType: 'success'
      });

      // 5行ごとにSTOP制御チェック
      if (processedInThisBatch > 0 && processedInThisBatch % 5 === 0) {
        if (!checkStopControl()) {
          clearProcessingState();
          clearAllTriggers();
          conditionalShowAlert('ユーザーにより処理が停止されました（D2=STOP）。\n処理済み: ' + processedCount + '件', 'warning');
          return;
        }
      }

      rowsSeenInThisRun += batch.length;
      props.setProperty('lastProcessedRowIndex', (startRowIndex + rowsSeenInThisRun).toString());
      props.setProperty('totalPrompt', totalPrompt.toString());
      props.setProperty('totalCompletion', totalCompletion.toString());
      props.setProperty('processedCount', processedCount.toString());
      props.setProperty('errorCount', errorCount.toString());
      props.setProperty('skippedCount', skippedCount.toString());

      if (bi < batches.length - 1) Utilities.sleep(500);

      var elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
      if (elapsed > (240 - CONFIG.CONTINUATION_INTERVAL_MINUTES * 60)) {
        createSelfContinuationTrigger(SCRIPT_NAME);
        conditionalShowAlert("処理を一時停止し、自動再開します。", "info");
        return;
      }
    }

    // 処理完了をサイドバーに通知
    updateProgressSidebar_({
      currentBatch: batches.length,
      totalBatches: batches.length,
      successCount: processedCount,
      errorCount: errorCount,
      message: '✅ すべての処理が完了しました',
      logType: 'success',
      isCompleted: true
    });

    clearProcessingState();
    clearAllTriggers();

    var end = new Date();
    var duration = Math.round((end - startTime) / 1000);
    var usd = calculateTokenCostUSD(settings.platform, settings.model, totalPrompt, totalCompletion);
    var rate = sheet.getRange("C2").getValue() || 145;
    var avgTokens = processedCount > 0 ? Math.round((totalPrompt + totalCompletion) / processedCount) : 0;

    var report = '✅ 処理完了(選択行)\n\n' +
      '処理時間: ' + duration + '秒\n' +
      '処理済み: ' + processedCount + '件\n' +
      'スキップ: ' + skippedCount + '件\n' +
      'エラー: ' + errorCount + '件\n\n' +
      '📊 トークン使用量:\n' +
      '• 入力: ' + totalPrompt.toLocaleString() + '\n' +
      '• 出力: ' + totalCompletion.toLocaleString() + '\n' +
      '• 合計: ' + (totalPrompt + totalCompletion).toLocaleString() + '\n' +
      '• 平均/件: ' + avgTokens + '\n' +
      '• 推定費用: $' + usd.toFixed(4) + '（約' + Math.round(usd * rate) + '円, ' + settings.platform + ' / ' + settings.model + '）';
    
    conditionalShowAlert(report, "success");

  } catch (e) {
    showAlert('処理中にエラー: ' + e.message, "error");
    clearProcessingState();
    clearAllTriggers();
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  計算エラー検出・リトライ機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 計算エラーがある行を検出（R列～W列をチェック）
 * @param {Sheet} sheet シート
 * @param {Array} rows 行番号の配列
 * @return {Array} エラーがある行番号の配列
 */
function detectCalculationErrors_(sheet, rows) {
  if (!rows || rows.length === 0) return [];

  var errorRows = [];
  var minRow = Math.min.apply(null, rows);
  var maxRow = Math.max.apply(null, rows);

  // R列～W列（PRICE, TAX_INCLUDED_PRICE, SHIPPING, PROFIT, FEE, RATE）を一括取得
  var startCol = CONFIG.COLUMNS.PRICE; // 18 (R列)
  var numCols = CONFIG.COLUMNS.RATE - CONFIG.COLUMNS.PRICE + 1; // 6列
  var range = sheet.getRange(minRow, startCol, maxRow - minRow + 1, numCols);
  var values = range.getValues();

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowIndex = row - minRow;
    var rowValues = values[rowIndex];
    var hasError = false;

    for (var j = 0; j < rowValues.length; j++) {
      var val = rowValues[j];

      // エラーパターンをチェック
      if (val === null || val === '' || val === undefined) {
        hasError = true;
        break;
      }

      var valStr = String(val);
      if (valStr === 'エラー' ||
          valStr.indexOf('#N/A') !== -1 ||
          valStr.indexOf('#ERROR') !== -1 ||
          valStr.indexOf('#VALUE') !== -1 ||
          valStr.indexOf('#REF') !== -1) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      errorRows.push(row);
    }
  }

  return errorRows;
}

/**
 * 計算エラー行を再計算
 * @param {Sheet} sheet シート
 * @param {Array} errorRows エラー行の配列
 * @param {number} manualWeight 梱包重量
 * @param {string} manualSize 梱包サイズ
 * @param {Object} settings 設定
 * @return {Object} { successCount, errorCount }
 */
function retryCalculationForErrors_(sheet, errorRows, manualWeight, manualSize, settings) {
  var successCount = 0;
  var errorCount = 0;

  console.log('🔄 計算エラー行の再計算: ' + errorRows.length + '行');

  for (var i = 0; i < errorRows.length; i++) {
    var row = errorRows[i];

    try {
      // 価格計算を再実行
      calculatePriceForRow(sheet, row, manualWeight, manualSize, settings);

      // 再計算後、エラーが解消されたかチェック
      var stillHasError = detectCalculationErrors_(sheet, [row]).length > 0;

      if (!stillHasError) {
        console.log('  ✅ 行' + row + ': 再計算成功');
        successCount++;
      } else {
        console.log('  ⚠️ 行' + row + ': 再計算後もエラー');
        errorCount++;
      }
    } catch (e) {
      console.error('  ❌ 行' + row + ': 再計算失敗 - ' + e.message);
      errorCount++;
    }
  }

  return { successCount: successCount, errorCount: errorCount };
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 統合実行：翻訳・計算 → テンプレ・ポリシー自動出力
  🔹 PHASE1: 翻訳＋計算（50行バッチ）
  🔹 PHASE2: テンプレ・ポリシー自動出力（O1・O2使用）
  🔹 P2セル対応（商品状態モード）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runSelectedRowsComplete() {
  var SCRIPT_NAME = 'runSelectedRowsComplete';
  var props = PropertiesService.getDocumentProperties();
  var startTime = new Date();

  var totalPrompt = parseInt(props.getProperty('totalPrompt_complete') || '0');
  var totalCompletion = parseInt(props.getProperty('totalCompletion_complete') || '0');
  var processedCount = parseInt(props.getProperty('processedCount_complete') || '0');
  var errorCount = parseInt(props.getProperty('errorCount_complete') || '0');
  var skippedCount = parseInt(props.getProperty('skippedCount_complete') || '0');
  var validationErrorCount = 0;
  var allRetryDetails = [];
  var phase = props.getProperty('processing_phase_complete') || 'PHASE1';

  var selectedRows, manualWeight, manualSize, category, templateName;
  var startRowIndex = parseInt(props.getProperty('lastProcessedRowIndex_complete') || '0');

  try {
    var settings = getSettings(); 
    if (!settings) { 
      clearProcessingStateComplete_(); 
      clearAllTriggers(); 
      return; 
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。','error');
      clearProcessingStateComplete_();
      clearAllTriggers();
      return;
    }

    // 作業シートのAS2セルからプロンプトIDを読み取り（設定値を上書き）
    try {
      var sheetPromptId = sheet.getRange('AS2').getValue();
      if (sheetPromptId && String(sheetPromptId).trim()) {
        settings.promptId = String(sheetPromptId).trim();
      }
    } catch (e) {
      // AS2セルが存在しない場合は既存のpromptIdを使用
      console.log('AS2セルからプロンプトIDを読み取れませんでした。既存の設定を使用します: ' + e.message);
    }

    var isContinuing = props.getProperty('isProcessing_complete') === 'true' && props.getProperty('processingMode') === SCRIPT_NAME;

    // ============================================
    // 初回起動時の設定
    // ============================================
    if (!isContinuing) {
      clearProcessingStateComplete_();
      clearAllTriggers();
      updateExchangeRate(sheet);

      // O1・O2の値を取得
      var categoryDisplay = sheet.getRange('O1').getValue();
      templateName = sheet.getRange('O2').getValue();
      
      if (!categoryDisplay || !templateName) {
        showAlert('O1（カテゴリー）またはO2（テンプレート名）が設定されていません。\n先に設定してから実行してください。', 'error');
        return;
      }
      
      category = convertCategoryDisplayToValue(categoryDisplay);

      var active = sheet.getActiveRange();
      if (!active) { 
        conditionalShowAlert("処理する行を選択してください。", "info"); 
        return; 
      }
      var startRow = active.getRow(), endRow = active.getLastRow();
      if (endRow < 5) { 
        conditionalShowAlert("5行目以降のデータを選択してください。","info"); 
        return; 
      }

      // 一括読み取りでパフォーマンス向上
      selectedRows = [];
      var numRows = endRow - startRow + 1;
      var dataRange = sheet.getRange(startRow, 1, numRows, CONFIG.COLUMNS.EN_DESC);
      var values = dataRange.getValues();

      for (var i = 0; i < values.length; i++) {
        var actualRow = startRow + i;
        if (actualRow < 5) { skippedCount++; continue; }

        var jpTitle = values[i][CONFIG.COLUMNS.JP_TITLE - 1];
        var jpDesc = values[i][CONFIG.COLUMNS.JP_DESC - 1];
        var costYen = Number(values[i][CONFIG.COLUMNS.COST_YEN - 1]);
        var enTitle = values[i][CONFIG.COLUMNS.EN_TITLE - 1];
        var enDesc = values[i][CONFIG.COLUMNS.EN_DESC - 1];

        if (jpTitle && jpDesc && costYen && (!enTitle || !enDesc)) {
          selectedRows.push(actualRow);
        } else {
          skippedCount++;
        }
      }
      if (selectedRows.length === 0) { 
        conditionalShowAlert("選択範囲に処理対象がありません。", "info"); 
        return; 
      }

      var manualWeight = sheet.getRange("J2").getValue();
      var L = sheet.getRange("L2").getValue();
      var M = sheet.getRange("M2").getValue();
      var N = sheet.getRange("N2").getValue();

      if (settings.shippingCalculationMethod !== 'FIXED') {
        if (![manualWeight, L, M, N].every(function(v){ return typeof v === 'number' && v > 0; })) {
          showAlert('テーブル計算モードではJ2/L2/M2/N2に正の数値を入力してください。\n送料固定モードでは不要です。', "error"); 
          return;
        }
      } else {
        manualWeight = manualWeight || 0;
        L = L || 0;
        M = M || 0; 
        N = N || 0;
      }

      manualSize = (L > 0 && M > 0 && N > 0) ? L + 'x' + M + 'x' + N : '固定送料';

      var platformNames = { openai:'OpenAI', claude:'Claude', gemini:'Gemini' };
      var confirmMessage = '【統合実行】選択 ' + selectedRows.length + ' 件を処理します。\n\n' +
        'AI: ' + platformNames[settings.platform] + ' / ' + settings.model + '\n' +
        '梱包重量: ' + manualWeight + ' g\n梱包サイズ: ' + manualSize + '\n\n' +
        '処理内容:\n' +
        '1️⃣ 翻訳（M・N・AC列）\n' +
        '2️⃣ 価格計算（全列）\n' +
        '3️⃣ テンプレート自動出力（E列）\n' +
        '4️⃣ ポリシー自動出力（G列）\n\n' +
        'カテゴリー: ' + categoryDisplay + '\n' +
        'テンプレート: ' + templateName + '\n\n' +
        '💡 D2セルでGO/STOP切り替え可能\n' +
        '💡 50行/バッチ処理\n\nよろしいですか？';
      
      var ok = conditionalStartConfirmation(confirmMessage, '統合実行の確認');
      if (ok !== SpreadsheetApp.getUi().Button.YES) {
        conditionalShowAlert('キャンセルしました。', "info");
        return;
      }

      // サイドバーの進捗データを初期化
      props.setProperty('sidebarProgress', JSON.stringify({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '行チェック開始...',
        logType: 'info'
      }));

      // サイドバーを先に表示（パフォーマンス改善）
      showProgressSidebar_();

      // 状態保存
      props.setProperty('targetRows_complete', JSON.stringify(selectedRows));
      props.setProperty('manualWeight_complete', manualWeight.toString());
      props.setProperty('manualSize_complete', manualSize);
      props.setProperty('category_complete', category);
      props.setProperty('categoryDisplay_complete', categoryDisplay);
      props.setProperty('templateName_complete', templateName);
      props.setProperty('isProcessing_complete', 'true');
      props.setProperty('processingMode', SCRIPT_NAME);
      props.setProperty('processing_phase_complete', 'PHASE1');
      props.setProperty('startTime_complete', startTime.getTime().toString());
      props.setProperty('skippedCount_complete', skippedCount.toString());
      props.setProperty('lastProcessedRowIndex_complete', '0');
      startRowIndex = 0;
      phase = 'PHASE1';

      // SKU自動生成（C列が空の行にのみ値を書き込む）
      try {
        var skuResult = generateSkuForRows_(sheet, selectedRows);
        if (skuResult.generated > 0) {
          Logger.log('[runSelectedRowsComplete] SKU自動生成: ' + skuResult.generated + '件');
        }
      } catch (skuErr) {
        Logger.log('[runSelectedRowsComplete] SKU生成エラー（処理は続行）: ' + skuErr.message);
      }

      // サイドバー更新: 処理対象を検出
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '処理対象: ' + selectedRows.length + '件を検出',
        logType: 'info'
      });
    } else {
      // 継続処理
      selectedRows = JSON.parse(props.getProperty('targetRows_complete'));
      manualWeight = parseInt(props.getProperty('manualWeight_complete'));
      manualSize = props.getProperty('manualSize_complete');
      category = props.getProperty('category_complete');
      var categoryDisplay = props.getProperty('categoryDisplay_complete');
      templateName = props.getProperty('templateName_complete');
      startTime = new Date(parseInt(props.getProperty('startTime_complete')));
      skippedCount = parseInt(props.getProperty('skippedCount_complete') || '0');
      
      if (phase === 'PHASE1') {
        conditionalShowAlert('PHASE1（翻訳・計算）を再開します。残り ' + (selectedRows.length - startRowIndex) + '件。', "info");
      } else {
        conditionalShowAlert('PHASE2（テンプレ・ポリシー出力）を再開します。残り ' + (selectedRows.length - startRowIndex) + '件。', "info");
      }
    }

    // ============================================
    // PHASE1: 翻訳＋計算（既存のrunSelectedRowsロジック）
    // ============================================
    if (phase === 'PHASE1') {
      // 🔹 P2セルの商品状態モードを1回だけ読み取る
      var conditionMode = sheet.getRange("P2").getValue();
      console.log('商品状態モード（P2）: ' + conditionMode);
      
      var BATCH_SIZE = 50;
      var batches = createBatches(selectedRows.slice(startRowIndex), BATCH_SIZE);
      var rowsSeenInThisRun = 0;
      var processedInThisBatch = 0;

      // サイドバー更新: PHASE1処理開始
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: batches.length,
        successCount: processedCount,
        errorCount: errorCount,
        message: '[PHASE1] 翻訳・計算処理開始 (全' + batches.length + 'バッチ)',
        logType: 'info'
      });

      for (var bi = 0; bi < batches.length; bi++) {
        var batch = batches[bi];

        // サイドバー更新: バッチ開始
        updateProgressSidebar_({
          currentBatch: bi + 1,
          totalBatches: batches.length,
          successCount: processedCount,
          errorCount: errorCount,
          message: '[PHASE1] バッチ ' + (bi + 1) + '/' + batches.length + ' 処理開始',
          logType: 'info'
        });

        // 🔹 翻訳フェーズ：バッチ全体を一度に処理
        // 一括読み取りでパフォーマンス向上
        var items = [];
        if (batch.length > 0) {
          var minRow = Math.min.apply(null, batch);
          var maxRow = Math.max.apply(null, batch);
          var batchDataRange = sheet.getRange(minRow, 1, maxRow - minRow + 1, CONFIG.COLUMNS.EN_DESC);
          var batchValues = batchDataRange.getValues();

          for (var k = 0; k < batch.length; k++) {
            var row = batch[k];
            var rowIndex = row - minRow;
            var jpTitle = batchValues[rowIndex][CONFIG.COLUMNS.JP_TITLE - 1];
            var jpDesc = batchValues[rowIndex][CONFIG.COLUMNS.JP_DESC - 1];
            var costYen = Number(batchValues[rowIndex][CONFIG.COLUMNS.COST_YEN - 1]);
            var enTitle = batchValues[rowIndex][CONFIG.COLUMNS.EN_TITLE - 1];
            var enDesc = batchValues[rowIndex][CONFIG.COLUMNS.EN_DESC - 1];

            if (jpTitle && jpDesc && costYen > 0 && (!enTitle || !enDesc)) {
              items.push({ row: row, jpTitle: jpTitle, jpDesc: jpDesc, costYen: costYen });
            } else {
              skippedCount++;
            }
          }
        }
        
        if (items.length > 0) {
          // 🔹 初回翻訳: バッチ全体を並列処理
          var par = executeTranslationWithRetry_(items, settings, sheet, conditionMode, 1);

          var validatedItems = [];
          var failedItems = [];

          // 翻訳結果を検証
          for (var idx = 0; idx < par.results.length; idx++) {
            var res = par.results[idx];
            if (res.ok) {
              try {
                // まず翻訳結果をシートに反映
                applyTranslationToRow_(sheet, res.row, res.fields, conditionMode);
                validatedItems.push(res);
                totalPrompt += (res.usage && res.usage.in) || 0;
                totalCompletion += (res.usage && res.usage.out) || 0;
              } catch (eRow) {
                console.error('  ❌ 行' + res.row + ': シート反映エラー: ' + eRow.message);
                failedItems.push(items[idx]);
              }
            } else {
              console.error('  ❌ 行' + res.row + ': 翻訳失敗: ' + (res.error || '不明なエラー'));
              failedItems.push(items[idx]);
            }
          }

          // スプレッドシートの計算式を完了させる
          SpreadsheetApp.flush();

          // 書き込み後に検証
          var revalidateFailedItems = [];
          for (var vidx = 0; vidx < validatedItems.length; vidx++) {
            var vres = validatedItems[vidx];
            var validation = validateTranslationResult_(sheet, vres.row, vres.fields);
            if (!validation.valid) {
              console.warn('  ⚠️ 行' + vres.row + ': 検証エラー(初回): ' + validation.errors.join(', '));
              revalidateFailedItems.push(items[vidx]);
            } else {
              processedCount++;
              processedInThisBatch++;
            }
          }

          // 検証エラーがあった場合は再試行対象に追加
          for (var rfidx = 0; rfidx < revalidateFailedItems.length; rfidx++) {
            failedItems.push(revalidateFailedItems[rfidx]);
          }

          // 🔹 検証エラー行のみ再試行 (最大3回まで)
          var remainingItems = failedItems;
          var maxRetries = 3;
          var retryAttempt = 1;

          while (remainingItems.length > 0 && retryAttempt < maxRetries) {
            console.log('  🔁 検証エラー ' + remainingItems.length + '件を再試行します (' + (retryAttempt + 1) + '回目)');
            Utilities.sleep(2000);

            var retryPar = executeTranslationWithRetry_(remainingItems, settings, sheet, conditionMode, 1);

            var retryValidated = [];
            var retryFailed = [];

            for (var ridx = 0; ridx < retryPar.results.length; ridx++) {
              var rres = retryPar.results[ridx];
              if (rres.ok) {
                try {
                  // まず翻訳結果をシートに反映
                  applyTranslationToRow_(sheet, rres.row, rres.fields, conditionMode);
                  retryValidated.push(rres);
                  totalPrompt += (rres.usage && rres.usage.in) || 0;
                  totalCompletion += (rres.usage && rres.usage.out) || 0;
                } catch (eRow) {
                  console.error('  ❌ 行' + rres.row + ': シート反映エラー: ' + eRow.message);
                  retryFailed.push(remainingItems[ridx]);
                }
              } else {
                console.error('  ❌ 行' + rres.row + ': 翻訳失敗: ' + (rres.error || '不明なエラー'));
                retryFailed.push(remainingItems[ridx]);
              }
            }

            // スプレッドシートの計算式を完了させる
            SpreadsheetApp.flush();

            // 書き込み後に検証
            var retryRevalidateFailed = [];
            for (var rvidx = 0; rvidx < retryValidated.length; rvidx++) {
              var rvres = retryValidated[rvidx];
              var rvalidation = validateTranslationResult_(sheet, rvres.row, rvres.fields);
              if (!rvalidation.valid) {
                console.warn('  ⚠️ 行' + rvres.row + ': 検証エラー(試行' + (retryAttempt + 1) + '): ' + rvalidation.errors.join(', '));
                retryRevalidateFailed.push(remainingItems[rvidx]);
                allRetryDetails.push({ row: rvres.row, attempts: retryAttempt + 1, status: '検証エラー', errors: rvalidation.errors });
              } else {
                console.log('  ✅ 行' + rvres.row + ': 再試行' + (retryAttempt + 1) + '回目で成功');
                allRetryDetails.push({ row: rvres.row, attempts: retryAttempt + 1, status: '成功' });
                processedCount++;
                processedInThisBatch++;
              }
            }

            // 検証エラーを追加
            for (var rrfidx = 0; rrfidx < retryRevalidateFailed.length; rrfidx++) {
              retryFailed.push(retryRevalidateFailed[rrfidx]);
            }

            remainingItems = retryFailed;
            retryAttempt++;
          }

          // 最終的に失敗した行をカウント
          for (var f = 0; f < remainingItems.length; f++) {
            errorCount++;
            validationErrorCount++;
            console.error('  💀 行' + remainingItems[f].row + ': ' + maxRetries + '回試行後も失敗');
            allRetryDetails.push({ row: remainingItems[f].row, attempts: maxRetries, status: '失敗' });
          }
        }

        // 🔹 計算フェーズ：翻訳済みの行をバッチで計算
        var rowsToCalculate = [];

        // 一括読み取りで性能改善（150回 → 1回）
        if (batch.length > 0) {
          var minRow = Math.min.apply(null, batch);
          var maxRow = Math.max.apply(null, batch);
          var numRows = maxRow - minRow + 1;

          // I列、J列、K列を一括取得
          var checkRange = sheet.getRange(minRow, CONFIG.COLUMNS.COST_YEN, numRows, 3);
          var checkValues = checkRange.getValues();

          for (var k = 0; k < batch.length; k++) {
            var row = batch[k];
            var rowIndex = row - minRow;
            var costYen = Number(checkValues[rowIndex][0]); // I列
            var jpTitle = checkValues[rowIndex][1];         // J列
            var jpDesc = checkValues[rowIndex][2];          // K列

            if (jpTitle && jpDesc && costYen > 0) {
              rowsToCalculate.push(row);
            }
          }
        }
        
        if (rowsToCalculate.length > 0) {
          try {
            // 🔹 計算を一括実行
            applyCalculationBatch_(sheet, rowsToCalculate, settings, manualWeight, manualSize);
          } catch (eCalc) {
            errorCount += rowsToCalculate.length;
            console.error('計算バッチエラー: ' + eCalc.message);
          }
        }

        // サイドバー更新: バッチ完了
        updateProgressSidebar_({
          currentBatch: bi + 1,
          totalBatches: batches.length,
          successCount: processedCount,
          errorCount: errorCount,
          message: '[PHASE1] バッチ ' + (bi + 1) + '/' + batches.length + ' 完了 (成功: ' + processedCount + ', エラー: ' + errorCount + ')',
          logType: 'success'
        });

        // 5行ごとにSTOP制御チェック
        if (processedInThisBatch > 0 && processedInThisBatch % 5 === 0) {
          if (!checkStopControl()) {
            clearProcessingStateComplete_();
            clearAllTriggers();
            conditionalShowAlert('ユーザーにより処理が停止されました（D2=STOP）。\n処理済み: ' + processedCount + '件', 'warning');
            return;
          }
        }

        rowsSeenInThisRun += batch.length;
        props.setProperty('lastProcessedRowIndex_complete', (startRowIndex + rowsSeenInThisRun).toString());
        props.setProperty('totalPrompt_complete', totalPrompt.toString());
        props.setProperty('totalCompletion_complete', totalCompletion.toString());
        props.setProperty('processedCount_complete', processedCount.toString());
        props.setProperty('errorCount_complete', errorCount.toString());
        props.setProperty('skippedCount_complete', skippedCount.toString());

        if (bi < batches.length - 1) Utilities.sleep(500);

        var elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
        if (elapsed > (240 - CONFIG.CONTINUATION_INTERVAL_MINUTES * 60)) {
          createSelfContinuationTrigger(SCRIPT_NAME);
          conditionalShowAlert("PHASE1を一時停止し、自動再開します。", "info");
          return;
        }
      }

      // PHASE1完了 → PHASE2へ移行
      console.log('=== PHASE1完了。PHASE2へ移行します ===');

      // 計算エラーのリトライ処理
      console.log('=== 計算エラーチェック中 ===');
      var errorRows = detectCalculationErrors_(sheet, selectedRows);

      if (errorRows.length > 0) {
        console.log('⚠️ 計算エラー検出: ' + errorRows.length + '行');

        updateProgressSidebar_({
          currentBatch: 0,
          totalBatches: 0,
          successCount: processedCount,
          errorCount: errorCount,
          message: '🔄 計算エラー ' + errorRows.length + '行を再計算中...',
          logType: 'warning'
        });

        var retryResult = retryCalculationForErrors_(sheet, errorRows, manualWeight, manualSize, settings);

        console.log('リトライ結果: 成功' + retryResult.successCount + '件, エラー' + retryResult.errorCount + '件');

        updateProgressSidebar_({
          currentBatch: 0,
          totalBatches: 0,
          successCount: processedCount + retryResult.successCount,
          errorCount: errorCount + retryResult.errorCount,
          message: '✅ 再計算完了 (成功: ' + retryResult.successCount + ', 残エラー: ' + retryResult.errorCount + ')',
          logType: retryResult.errorCount > 0 ? 'warning' : 'success'
        });
      } else {
        console.log('✅ 計算エラーなし。PHASE2へ進みます。');
      }

      props.setProperty('processing_phase_complete', 'PHASE2');
      props.setProperty('lastProcessedRowIndex_complete', '0');
      phase = 'PHASE2';
      startRowIndex = 0;
    }

    // ============================================
    // PHASE2: テンプレート・ポリシー自動出力
    // ============================================
    if (phase === 'PHASE2') {
      console.log('=== PHASE2開始：テンプレ・ポリシー自動出力 ===');

      var templateSuccessCount = 0;
      var templateErrorCount = 0;
      var policySuccessCount = 0;
      var policyErrorCount = 0;

      var BATCH_SIZE = 50;
      var totalBatches = Math.ceil((selectedRows.length - startRowIndex) / BATCH_SIZE);
      var currentBatch = 0;

      // サイドバー更新: PHASE2開始
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: totalBatches,
        successCount: 0,
        errorCount: 0,
        message: '[PHASE2] テンプレート・ポリシー設定開始 (全' + totalBatches + 'バッチ)',
        logType: 'info'
      });

      for (var batchStart = startRowIndex; batchStart < selectedRows.length; batchStart += BATCH_SIZE) {
        var batchEnd = Math.min(batchStart + BATCH_SIZE, selectedRows.length);
        var batchRows = selectedRows.slice(batchStart, batchEnd);
        currentBatch++;

        // サイドバー更新: バッチ開始
        updateProgressSidebar_({
          currentBatch: currentBatch,
          totalBatches: totalBatches,
          successCount: templateSuccessCount,
          errorCount: templateErrorCount,
          message: '[PHASE2] バッチ ' + currentBatch + '/' + totalBatches + ' 処理中...',
          logType: 'info'
        });

        try {
          var result = applyUnifiedSettingsBatch_(
            sheet,
            batchRows,
            category,
            templateName,
            'auto',  // templateMode
            'auto',  // policyMode
            null     // manualPolicyId
          );

          templateSuccessCount += result.successCount;
          policySuccessCount += result.successCount;

          // エラーはテンプレとポリシーで共通カウント
          templateErrorCount += result.errorCount;
          policyErrorCount += result.errorCount;

          // サイドバー更新: バッチ完了
          updateProgressSidebar_({
            currentBatch: currentBatch,
            totalBatches: totalBatches,
            successCount: templateSuccessCount,
            errorCount: templateErrorCount,
            message: '[PHASE2] バッチ ' + currentBatch + '/' + totalBatches + ' 完了 (成功: ' + templateSuccessCount + ', エラー: ' + templateErrorCount + ')',
            logType: 'success'
          });

        } catch (e) {
          console.error('PHASE2バッチエラー: ' + e.message);
          templateErrorCount += batchRows.length;
          policyErrorCount += batchRows.length;

          // サイドバー更新: エラー
          updateProgressSidebar_({
            currentBatch: currentBatch,
            totalBatches: totalBatches,
            successCount: templateSuccessCount,
            errorCount: templateErrorCount,
            message: '[PHASE2] バッチ ' + currentBatch + ' エラー: ' + e.message,
            logType: 'error'
          });
        }

        // STOP制御チェック
        if ((templateSuccessCount + policySuccessCount) > 0 && (templateSuccessCount + policySuccessCount) % 5 === 0) {
          if (!checkStopControl()) {
            clearProcessingStateComplete_();
            clearAllTriggers();
            conditionalShowAlert('ユーザーにより処理が停止されました（D2=STOP）。\nPHASE2処理済み: ' + templateSuccessCount + '件', 'warning');
            return;
          }
        }

        props.setProperty('lastProcessedRowIndex_complete', batchEnd.toString());

        if (batchEnd < selectedRows.length) {
          Utilities.sleep(200);
        }

        var elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
        if (elapsed > (240 - CONFIG.CONTINUATION_INTERVAL_MINUTES * 60)) {
          createSelfContinuationTrigger(SCRIPT_NAME);
          conditionalShowAlert("PHASE2を一時停止し、自動再開します。", "info");
          return;
        }
      }
    }

    // ============================================
    // 最終エラーチェック＆リトライ
    // ============================================
    console.log('=== 最終エラーチェック開始 ===');

    // スプレッドシートの計算完了を待つ
    SpreadsheetApp.flush();
    Utilities.sleep(2000);

    updateProgressSidebar_({
      currentBatch: 0,
      totalBatches: 0,
      successCount: processedCount,
      errorCount: errorCount,
      message: '🔍 最終エラーチェック中...',
      logType: 'info'
    });

    var finalErrorRows = detectCalculationErrors_(sheet, selectedRows);

    if (finalErrorRows.length > 0) {
      console.log('⚠️ 最終エラー検出: ' + finalErrorRows.length + '行');

      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: processedCount,
        errorCount: errorCount,
        message: '🔄 最終リトライ: 計算エラー ' + finalErrorRows.length + '行を修正中...',
        logType: 'warning'
      });

      // ① 計算を再実行
      var finalRetryResult = retryCalculationForErrors_(sheet, finalErrorRows, manualWeight, manualSize, settings);
      console.log('計算リトライ結果: 成功' + finalRetryResult.successCount + '件, エラー' + finalRetryResult.errorCount + '件');

      // スプレッドシートの計算完了を待つ
      SpreadsheetApp.flush();
      Utilities.sleep(1500);

      // ② 計算成功した行のテンプレート・ポリシーを再設定
      if (finalRetryResult.successCount > 0) {
        updateProgressSidebar_({
          currentBatch: 0,
          totalBatches: 0,
          successCount: processedCount,
          errorCount: errorCount,
          message: '📝 テンプレート・ポリシー再設定中 (' + finalRetryResult.successCount + '行)...',
          logType: 'info'
        });

        // 計算が成功した行のみを対象
        var successRows = [];
        for (var i = 0; i < finalErrorRows.length; i++) {
          var row = finalErrorRows[i];
          var stillHasError = detectCalculationErrors_(sheet, [row]).length > 0;
          if (!stillHasError) {
            successRows.push(row);
          }
        }

        if (successRows.length > 0) {
          try {
            var result = applyUnifiedSettingsBatch_(
              sheet,
              successRows,
              props.getProperty('category_complete') || '',
              templateName,
              templateMode,
              policyMode,
              manualPolicyId
            );
            console.log('✅ 再設定完了: 成功' + result.successCount + '件, エラー' + result.errorCount + '件');

            templateSuccessCount += result.successCount;
            policySuccessCount += result.successCount;
            templateErrorCount += result.errorCount;
            policyErrorCount += result.errorCount;
          } catch (eRetry) {
            console.error('❌ 再設定エラー: ' + eRetry.message);
          }
        }
      }

      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: processedCount + finalRetryResult.successCount,
        errorCount: errorCount + finalRetryResult.errorCount,
        message: '✅ 最終リトライ完了 (修正: ' + finalRetryResult.successCount + ', 残エラー: ' + finalRetryResult.errorCount + ')',
        logType: finalRetryResult.errorCount > 0 ? 'warning' : 'success'
      });
    } else {
      console.log('✅ 最終エラーなし');
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: processedCount,
        errorCount: errorCount,
        message: '✅ 最終エラーチェック完了（エラーなし）',
        logType: 'success'
      });
    }

    // 処理完了をサイドバーに通知
    updateProgressSidebar_({
      currentBatch: totalBatches || 0,
      totalBatches: totalBatches || 0,
      successCount: processedCount,
      errorCount: errorCount,
      message: '✅ すべての処理が完了しました',
      logType: 'success',
      isCompleted: true
    });

    // ============================================
    // 全処理完了
    // ============================================
    clearProcessingStateComplete_();
    clearAllTriggers();

    var end = new Date();
    var duration = Math.round((end - startTime) / 1000);
    var usd = calculateTokenCostUSD(settings.platform, settings.model, totalPrompt, totalCompletion);
    var rate = sheet.getRange("C2").getValue() || 145;
    var avgTokens = processedCount > 0 ? Math.round((totalPrompt + totalCompletion) / processedCount) : 0;

    var report = '✅ 統合処理完了\n\n' +
      '【PHASE1: 翻訳・計算】\n' +
      '処理時間: ' + duration + '秒\n' +
      '処理済み: ' + processedCount + '件\n' +
      'スキップ: ' + skippedCount + '件\n' +
      'エラー: ' + errorCount + '件\n\n' +
      '📊 トークン使用量:\n' +
      '• 入力: ' + totalPrompt.toLocaleString() + '\n' +
      '• 出力: ' + totalCompletion.toLocaleString() + '\n' +
      '• 合計: ' + (totalPrompt + totalCompletion).toLocaleString() + '\n' +
      '• 平均/件: ' + avgTokens + '\n' +
      '• 推定費用: $' + usd.toFixed(4) + '（約' + Math.round(usd * rate) + '円, ' + settings.platform + ' / ' + settings.model + '）\n\n' +
      '【PHASE2: テンプレ・ポリシー】\n' +
      'テンプレート成功: ' + (templateSuccessCount || 0) + '件\n' +
      'ポリシー成功: ' + (policySuccessCount || 0) + '件\n' +
      'エラー: ' + (templateErrorCount || 0) + '件\n\n' +
      'カテゴリー: ' + (props.getProperty('categoryDisplay_complete') || '') + '\n' +
      'テンプレート: ' + templateName;
    
    conditionalShowAlert(report, "success");

  } catch (e) {
    showAlert('統合処理中にエラー: ' + e.message, "error");
    clearProcessingStateComplete_();
    clearAllTriggers();
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  統合処理用の状態クリア
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function clearProcessingStateComplete_() {
  var props = PropertiesService.getDocumentProperties();
  [
    'isProcessing_complete', 'lastProcessedRowIndex_complete',
    'totalPrompt_complete', 'totalCompletion_complete',
    'processedCount_complete', 'errorCount_complete', 'skippedCount_complete',
    'targetRows_complete', 'startTime_complete', 'processing_phase_complete',
    'manualWeight_complete', 'manualSize_complete', 'category_complete',
    'categoryDisplay_complete', 'templateName_complete'
  ].forEach(function(k){ props.deleteProperty(k); });
}
// ========================================
// バッチ処理用の定数
// ========================================
const BATCH_SIZE = 50; // 1回の処理行数
const MAX_BATCHES_PER_EXECUTION = 10; // 1回の実行で最大8バッチ（400行）
const PROGRESS_KEY = 'BATCH_PROGRESS'; // 進捗保存キー
const MAX_EXECUTION_TIME_MS = 300000; // 最大実行時間（5分 = 300秒）
const WAIT_BETWEEN_BATCHES_MS = 2000; // バッチ間の待機時間（2秒）

// ========================================
// 統合実行のバッチ処理版（開始）
// ========================================
function runSelectedRowsCompleteBatch() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const selection = sheet.getActiveRange();
  const startRow = selection.getRow();
  const numRows = selection.getNumRows();
  
  const props = PropertiesService.getDocumentProperties();
  
  // 既存の進捗とトリガーをクリア
  props.deleteProperty(PROGRESS_KEY);
  deleteAllBatchTriggers();
  
  // 進捗情報を初期化
  props.setProperty(PROGRESS_KEY, JSON.stringify({
    startRow: startRow,
    totalRows: numRows,
    processedRows: 0,
    sheetName: sheet.getName(),
    mode: 'complete',
    startTime: new Date().toISOString()
  }));
  
  Logger.log('=== バッチ処理開始 ===');
  Logger.log('対象: ' + startRow + '行目から' + numRows + '行');
  Logger.log('1実行あたり最大: ' + MAX_BATCHES_PER_EXECUTION + 'バッチ（' + (BATCH_SIZE * MAX_BATCHES_PER_EXECUTION) + '行）');
  
  SpreadsheetApp.getUi().alert(
    '🚀 バッチ処理を開始します\n\n' +
    '対象: ' + numRows + '行\n' +
    '1バッチ: ' + BATCH_SIZE + '行\n' +
    '1実行あたり: 最大' + MAX_BATCHES_PER_EXECUTION + 'バッチ（' + (BATCH_SIZE * MAX_BATCHES_PER_EXECUTION) + '行）\n\n' +
    '※完全自動で実行されます'
  );
  
  // 初回実行
  continueBatchProcessing();
}

// ========================================
// 翻訳・計算のバッチ処理版（開始）
// ========================================
function runSelectedRowsBatch() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const selection = sheet.getActiveRange();
  const startRow = selection.getRow();
  const numRows = selection.getNumRows();
  
  const props = PropertiesService.getDocumentProperties();
  
  // 既存の進捗とトリガーをクリア
  props.deleteProperty(PROGRESS_KEY);
  deleteAllBatchTriggers();
  
  // 進捗情報を初期化
  props.setProperty(PROGRESS_KEY, JSON.stringify({
    startRow: startRow,
    totalRows: numRows,
    processedRows: 0,
    sheetName: sheet.getName(),
    mode: 'simple',
    startTime: new Date().toISOString()
  }));
  
  Logger.log('=== バッチ処理開始 ===');
  Logger.log('対象: ' + startRow + '行目から' + numRows + '行');
  Logger.log('1実行あたり最大: ' + MAX_BATCHES_PER_EXECUTION + 'バッチ（' + (BATCH_SIZE * MAX_BATCHES_PER_EXECUTION) + '行）');
  
  SpreadsheetApp.getUi().alert(
    '🚀 バッチ処理を開始します\n\n' +
    '対象: ' + numRows + '行\n' +
    '1バッチ: ' + BATCH_SIZE + '行\n' +
    '1実行あたり: 最大' + MAX_BATCHES_PER_EXECUTION + 'バッチ（' + (BATCH_SIZE * MAX_BATCHES_PER_EXECUTION) + '行）\n\n' +
    '※完全自動で実行されます'
  );
  
  // 初回実行
  continueBatchProcessing();
}

// ========================================
// バッチ処理の継続実行（ループ処理）
// ========================================
function continueBatchProcessing() {
  const executionStartTime = new Date().getTime();
  const props = PropertiesService.getDocumentProperties();
  
  let batchCount = 0;
  
  while (true) {
    // 🔥 8バッチ達成チェック
    if (batchCount >= MAX_BATCHES_PER_EXECUTION) {
      Logger.log('✓ ' + MAX_BATCHES_PER_EXECUTION + 'バッチ完了。次の実行をスケジュールします。');
      scheduleNextExecution();
      return;
    }
    
    // 実行時間チェック（タイムアウト回避）
    const elapsedTime = new Date().getTime() - executionStartTime;
    if (elapsedTime > MAX_EXECUTION_TIME_MS) {
      Logger.log('⏰ 実行時間上限に達しました（' + Math.floor(elapsedTime/1000) + '秒）。次の実行をスケジュールします。');
      scheduleNextExecution();
      return;
    }
    
    const progressJson = props.getProperty(PROGRESS_KEY);
    
    if (!progressJson) {
      Logger.log('❌ 進捗情報が見つかりません');
      return;
    }
    
    const progress = JSON.parse(progressJson);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(progress.sheetName);
    
    if (!sheet) {
      props.deleteProperty(PROGRESS_KEY);
      Logger.log('❌ シートが見つかりません');
      return;
    }
    
    // 処理完了チェック
    if (progress.processedRows >= progress.totalRows) {
      Logger.log('=== ✅ 全バッチ完了 ===');
      props.deleteProperty(PROGRESS_KEY);
      deleteAllBatchTriggers();
      
      try {
        const elapsed = calculateElapsedTime(progress.startTime);
        SpreadsheetApp.getUi().alert(
          '✅ 全ての処理が完了しました！\n\n' +
          '処理行数: ' + progress.totalRows + '行\n' +
          '処理時間: ' + elapsed
        );
      } catch (e) {
        Logger.log('完了通知: ' + e.toString());
      }
      return;
    }
    
    // 今回処理する範囲を計算
    const currentStartRow = progress.startRow + progress.processedRows;
    const remainingRows = progress.totalRows - progress.processedRows;
    const currentBatchSize = Math.min(BATCH_SIZE, remainingRows);
    
    const batchNum = Math.floor(progress.processedRows / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(progress.totalRows / BATCH_SIZE);
    
    Logger.log('=== バッチ ' + batchNum + '/' + totalBatches + ' 開始（実行内' + (batchCount + 1) + '/' + MAX_BATCHES_PER_EXECUTION + '）===');
    Logger.log('範囲: ' + currentStartRow + '〜' + (currentStartRow + currentBatchSize - 1) + '行目');
    
    try {
      // シートの範囲を選択
      const range = sheet.getRange(currentStartRow, 1, currentBatchSize, sheet.getLastColumn());
      sheet.setActiveRange(range);
      
      // モードに応じて処理を実行
      if (progress.mode === 'complete') {
        runSelectedRowsComplete();
      } else {
        runSelectedRows();
      }
      
      // 進捗を更新
      progress.processedRows += currentBatchSize;
      props.setProperty(PROGRESS_KEY, JSON.stringify(progress));
      
      const percentage = Math.round((progress.processedRows / progress.totalRows) * 100);
      Logger.log('進捗: ' + progress.processedRows + '/' + progress.totalRows + '行 (' + percentage + '%)');
      Logger.log('=== バッチ ' + batchNum + '/' + totalBatches + ' 完了 ===');
      
      batchCount++;
      
      // バッチ間で少し待機
      if (progress.processedRows < progress.totalRows) {
        Utilities.sleep(WAIT_BETWEEN_BATCHES_MS);
      }
      
    } catch (e) {
      Logger.log('⚠️ エラー発生: ' + e.toString());
      Logger.log('エラー詳細: ' + e.stack);
      
      // エラー時も次の実行をスケジュール
      Logger.log('2分後に自動再開します');
      scheduleNextExecution();
      return;
    }
  }
}

// ========================================
// 次の実行をスケジュール
// ========================================
function scheduleNextExecution() {
  deleteAllBatchTriggers();

  try {
    ScriptApp.newTrigger('continueBatchProcessing')
      .timeBased()
      .after(2 * 60 * 1000) // 2分後
      .create();

    Logger.log('✓ 次の実行を2分後にスケジュールしました');

    // 進捗情報を取得してトースト表示
    try {
      var props = PropertiesService.getDocumentProperties();
      var progressJson = props.getProperty('BATCH_PROGRESS');

      if (progressJson) {
        var progress = JSON.parse(progressJson);
        var processedRows = progress.processedRows || 0;
        var totalRows = progress.totalRows || 0;
        var currentBatch = Math.floor(processedRows / 50) + 1;
        var totalBatches = Math.ceil(totalRows / 50);
        var percentComplete = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

        SpreadsheetApp.getActiveSpreadsheet().toast(
          'バッチ ' + currentBatch + '/' + totalBatches + ' 完了 (' + percentComplete + '%)\n' +
          '約2分後に自動継続します\n' +
          'D2セル=STOPで停止可能',
          '⏰ バッチ処理継続中',
          10
        );
      } else {
        SpreadsheetApp.getActiveSpreadsheet().toast(
          '約2分後に自動継続します\n' +
          'D2セル=STOPで停止可能',
          '⏰ バッチ処理継続中',
          10
        );
      }
    } catch (toastError) {
      // トースト表示エラーは無視
      Logger.log('トースト表示エラー: ' + toastError.toString());
    }

  } catch (e) {
    Logger.log('❌ トリガー作成エラー: ' + e.toString());
  }
}

// ========================================
// すべてのバッチトリガーを削除
// ========================================
function deleteAllBatchTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'continueBatchProcessing') {
      try {
        ScriptApp.deleteTrigger(trigger);
      } catch (e) {
        // 削除失敗は無視
      }
    }
  });
}

// ========================================
// 手動で処理を継続
// ========================================
function resumeBatchProcessing() {
  const props = PropertiesService.getDocumentProperties();
  const progressJson = props.getProperty(PROGRESS_KEY);
  
  if (!progressJson) {
    SpreadsheetApp.getUi().alert('再開する処理がありません');
    return;
  }
  
  const progress = JSON.parse(progressJson);
  const percentage = Math.round((progress.processedRows / progress.totalRows) * 100);
  
  Logger.log('=== バッチ処理を手動再開 ===');
  Logger.log('進捗: ' + progress.processedRows + '/' + progress.totalRows + '行 (' + percentage + '%)');
  
  continueBatchProcessing();
}

// ========================================
// バッチ処理の進捗確認
// ========================================
function checkBatchProgress() {
  const props = PropertiesService.getDocumentProperties();
  const progressJson = props.getProperty(PROGRESS_KEY);
  
  if (!progressJson) {
    SpreadsheetApp.getUi().alert('実行中のバッチ処理はありません');
    return;
  }
  
  const progress = JSON.parse(progressJson);
  const percentage = Math.round((progress.processedRows / progress.totalRows) * 100);
  const elapsed = calculateElapsedTime(progress.startTime);
  const currentBatch = Math.ceil(progress.processedRows / BATCH_SIZE);
  const totalBatches = Math.ceil(progress.totalRows / BATCH_SIZE);
  
  SpreadsheetApp.getUi().alert(
    '📊 バッチ処理の進捗\n\n' +
    'シート: ' + progress.sheetName + '\n' +
    'モード: ' + (progress.mode === 'complete' ? '統合実行' : '翻訳・計算') + '\n\n' +
    '進捗: ' + progress.processedRows + '/' + progress.totalRows + '行 (' + percentage + '%)\n' +
    'バッチ: ' + currentBatch + '/' + totalBatches + '\n' +
    '経過時間: ' + elapsed
  );
}

// ========================================
// バッチ処理のキャンセル
// ========================================
function cancelBatchProcessing() {
  const props = PropertiesService.getDocumentProperties();
  const progressJson = props.getProperty(PROGRESS_KEY);
  
  if (!progressJson) {
    SpreadsheetApp.getUi().alert('キャンセルする処理がありません');
    return;
  }
  
  const result = SpreadsheetApp.getUi().alert(
    '確認',
    'バッチ処理をキャンセルしますか？',
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );
  
  if (result === SpreadsheetApp.getUi().Button.YES) {
    props.deleteProperty(PROGRESS_KEY);
    deleteAllBatchTriggers();
    
    Logger.log('=== バッチ処理をキャンセル ===');
    SpreadsheetApp.getUi().alert('バッチ処理をキャンセルしました');
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  選択行の処理：翻訳専用（AI呼び出しのみ）
  🔹 並列処理を50行に拡大

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳結果のみをシートに反映
  🔹 P2セルの値は外部から受け取る

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  日本語検出関数
  🔹 文字列に日本語(ひらがな・カタカナ・漢字)が含まれているかチェック

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳結果の検証関数
  🔹 M列・N列に日本語が混入していないかチェック
  🔹 P列が1〜80の範囲内かチェック
  🔹 Q列が1〜500の範囲内かチェック

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳専用の状態クリア

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  選択行の処理：計算専用（翻訳不要）
  🔹 50行まとめて一括処理・列ごとに順番に出力
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runSelectedRowsCalculate() {
  var SCRIPT_NAME = 'runSelectedRowsCalculate';
  var startTime = new Date();

  try {
    var settings = getSettings();
    if (!settings) return;

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }

    updateExchangeRate(sheet);

    var active = sheet.getActiveRange();
    if (!active) {
      conditionalShowAlert("計算する行を選択してください。", "info");
      return;
    }

    var startRow = active.getRow(), endRow = active.getLastRow();
    if (endRow < 5) {
      conditionalShowAlert("5行目以降のデータを選択してください。", "info");
      return;
    }

    var selectedRows = [];
    var skippedCount = 0;
    var untranslatedCount = 0;

    for (var i = startRow; i <= endRow; i++) {
      if (i < 5) {
        skippedCount++;
        continue;
      }

      var jpTitle = sheet.getRange(i, CONFIG.COLUMNS.JP_TITLE).getValue();
      var jpDesc = sheet.getRange(i, CONFIG.COLUMNS.JP_DESC).getValue();
      var costYen = Number(sheet.getRange(i, CONFIG.COLUMNS.COST_YEN).getValue());
      var enTitle = sheet.getRange(i, CONFIG.COLUMNS.EN_TITLE).getValue();

      if (jpTitle && jpDesc && costYen > 0) {
        selectedRows.push(i);
        if (!enTitle) {
          untranslatedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    if (selectedRows.length === 0) {
      conditionalShowAlert('選択範囲に計算対象がありません。\n\n必要な条件:\n• J列: 日本語タイトル\n• K列: 日本語説明\n• I列: 仕入れ値', "info");
      return;
    }

    var manualWeight, manualSize;
    if (settings.shippingCalculationMethod === 'FIXED') {
      manualWeight = 0;
      manualSize = '固定送料';
    } else {
      manualWeight = sheet.getRange("J2").getValue();
      var L = sheet.getRange("L2").getValue();
      var M = sheet.getRange("M2").getValue();
      var N = sheet.getRange("N2").getValue();

      if (![manualWeight, L, M, N].every(function(v) { return typeof v === 'number' && v > 0; })) {
        showAlert('テーブル計算モードではJ2/L2/M2/N2に正の数値を入力してください。\n送料固定モードでは不要です。', "error");
        return;
      }

      manualSize = L + 'x' + M + 'x' + N;
    }

    var confirmMessage = '【計算専用】選択 ' + selectedRows.length + ' 件を計算します。\n\n' +
      '梱包重量: ' + manualWeight + ' g\n' +
      '梱包サイズ: ' + manualSize + '\n' +
      '送料計算: ' + (settings.shippingCalculationMethod === 'TABLE' ? 'テーブル計算' : '固定金額') + '\n\n' +
      '計算内容:\n' +
      '• 配送方法判定\n' +
      '• 送料計算\n' +
      '• 販売価格計算（DDU/DDP）\n' +
      '• 利益計算\n' +
      '• DDU価格調整（有効時）\n\n';
    
    if (untranslatedCount > 0) {
      confirmMessage += '⚠️ 翻訳未完了: ' + untranslatedCount + '件\n' +
                       '（計算は実行可能ですが、翻訳も必要な場合は「選択行を翻訳」を実行してください）\n\n';
    }
    
    confirmMessage += '💡 D2セルでGO/STOP切り替え可能\n' +
                     '💡 一括処理: 50行/バッチ\n\nよろしいですか？';

    var ok = conditionalStartConfirmation(confirmMessage, '計算専用実行の確認');
    if (ok !== SpreadsheetApp.getUi().Button.YES) {
      conditionalShowAlert('キャンセルしました。', "info");
      return;
    }

    var processedCount = 0;
    var errorCount = 0;
    var errorDetails = [];

    var CALC_BATCH_SIZE = 50;
    for (var batchStart = 0; batchStart < selectedRows.length; batchStart += CALC_BATCH_SIZE) {
      var batchEnd = Math.min(batchStart + CALC_BATCH_SIZE, selectedRows.length);
      var batchRows = selectedRows.slice(batchStart, batchEnd);
      
      try {
        applyCalculationBatch_(sheet, batchRows, settings, manualWeight, manualSize);
        processedCount += batchRows.length;

        if (processedCount > 0 && processedCount % 5 === 0) {
          if (!checkStopControl()) {
            conditionalShowAlert('ユーザーにより処理が停止されました（D2=STOP）。\n処理済み: ' + processedCount + '件', 'warning');
            return;
          }
        }

      } catch (e) {
        errorCount += batchRows.length;
        errorDetails.push('バッチ(行' + batchRows[0] + '～' + batchRows[batchRows.length-1] + '): ' + e.message);
        console.error('計算バッチエラー: ' + e.message);
      }

      if (batchEnd < selectedRows.length) {
        Utilities.sleep(200);
      }
    }

    var end = new Date();
    var duration = Math.round((end - startTime) / 1000);

    var report = '✅ 計算処理完了\n\n' +
      '処理時間: ' + duration + '秒\n' +
      '計算完了: ' + processedCount + '件\n' +
      'スキップ: ' + skippedCount + '件\n' +
      'エラー: ' + errorCount + '件\n';
    
    if (untranslatedCount > 0) {
      report += '翻訳未完了: ' + untranslatedCount + '件\n';
    }
    report += '\n';

    if (errorDetails.length > 0 && errorDetails.length <= 5) {
      report += '⚠️ エラー詳細:\n' + errorDetails.join('\n') + '\n\n';
    } else if (errorDetails.length > 5) {
      report += '⚠️ エラー詳細（最初の5件）:\n' + errorDetails.slice(0, 5).join('\n') + '\n... 他' + (errorDetails.length - 5) + '件\n\n';
    }

    report += '💡 計算結果:\n' +
      '• R列: 販売価格（DDU）\n' +
      '• S列: 関税込み価格（DDP）\n' +
      '• T列: 送料\n' +
      '• U列: 利益額\n' +
      '• X列: 配送方法\n';

    if (settings.dduAdjustmentEnabled) {
      report += '• AE列: DDU調整価格（閾値以上の場合）\n';
    }
    
    if (untranslatedCount > 0) {
      report += '\n💡 翻訳が必要な場合は「選択行を翻訳」を実行してください';
    }

    conditionalShowAlert(report, processedCount > 0 ? "success" : "warning");

  } catch (e) {
    showAlert('計算処理中にエラー: ' + e.message, "error");
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔹 バッチ単位で一括計算・列ごとに順番に出力（修正版）
  依存関係を考慮した順序で50行分を処理
  
  【修正内容】
  空欄の行も含めた配列を作成して一括書き込み
  → 高速 + 正確
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyCalculationBatch_(sheet, batchRows, settings, manualWeight, manualSize) {
  if (!batchRows || batchRows.length === 0) return;
  
  try {
    console.log('=== 一括計算開始（行数: ' + batchRows.length + '） ===');
    
    // ========================================
    // 前処理: 最小行と最大行を取得
    // ========================================
    var minRow = Math.min.apply(null, batchRows);
    var maxRow = Math.max.apply(null, batchRows);
    var rowCount = maxRow - minRow + 1;
    
    // batchRowsを高速検索用にセット化
    var batchRowsSet = {};
    for (var i = 0; i < batchRows.length; i++) {
      batchRowsSet[batchRows[i]] = true;
    }
    
    // ========================================
    // ① Y列・Z-AB列・X列設定
    // ========================================
    console.log('① Y列・Z-AB列・X列設定中...');

    var weightData = [];
    var lengthData = [];
    var widthData = [];
    var heightData = [];
    var methodData = [];

    // I列（COST_YEN）を一括読み取り
    var costYenRange = sheet.getRange(minRow, CONFIG.COLUMNS.COST_YEN, rowCount, 1);
    var costYenValues = costYenRange.getValues();

    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        // データあり
        var costYen = Number(costYenValues[row - minRow][0]);

        if (settings.shippingCalculationMethod === 'FIXED') {
          var determinedMethod = getSelectedShippingMethod(costYen, 0, 0, '');
          weightData.push(['']);
          lengthData.push(['']);
          widthData.push(['']);
          heightData.push(['']);
          methodData.push([determinedMethod]);
        } else {
          var weight = Number(manualWeight);
          var sizeStr = String(manualSize || '');
          var sizeParts = sizeStr.split('x');
          var length = sizeParts[0] ? Number(sizeParts[0]) : '';
          var width = sizeParts[1] ? Number(sizeParts[1]) : '';
          var height = sizeParts[2] ? Number(sizeParts[2]) : '';
          var volWeight = weight;
          var method = getSelectedShippingMethod(costYen, weight, volWeight, sizeStr);

          weightData.push([weight]);
          lengthData.push([length]);
          widthData.push([width]);
          heightData.push([height]);
          methodData.push([method]);
        }
      } else {
        // データなし（空欄）
        weightData.push(['']);
        lengthData.push(['']);
        widthData.push(['']);
        heightData.push(['']);
        methodData.push(['']);
      }
    }

    sheet.getRange(minRow, CONFIG.COLUMNS.WEIGHT, rowCount, 1).setValues(weightData);
    sheet.getRange(minRow, CONFIG.COLUMNS.LENGTH, rowCount, 1).setValues(lengthData);
    sheet.getRange(minRow, CONFIG.COLUMNS.WIDTH, rowCount, 1).setValues(widthData);
    sheet.getRange(minRow, CONFIG.COLUMNS.HEIGHT, rowCount, 1).setValues(heightData);
    sheet.getRange(minRow, CONFIG.COLUMNS.METHOD, rowCount, 1).setValues(methodData);
    SpreadsheetApp.flush();
    Utilities.sleep(300);
    
    var feeRate = sheet.getRange("F1").getValue() || 0;
    
    // ========================================
    // ② V列（手数料率）設定
    // ========================================
    console.log('② V列設定中...');
    var feeData = [];
    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        feeData.push([feeRate]);
      } else {
        feeData.push(['']);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.FEE, rowCount, 1).setValues(feeData);
    SpreadsheetApp.flush();
    Utilities.sleep(300);
    
    // ========================================
    // ③ W列（利益率 or 利益額）設定
    // ========================================
    console.log('③ W列設定中...');
    var rateData = [];
    var profitData = [];
    
    if (settings.profitCalculationMethod === 'RATE') {
      var profitRate = sheet.getRange("H2").getValue() || 0;
      for (var row = minRow; row <= maxRow; row++) {
        if (batchRowsSet[row]) {
          rateData.push([profitRate]);
        } else {
          rateData.push(['']);
        }
      }
      sheet.getRange(minRow, CONFIG.COLUMNS.RATE, rowCount, 1).setValues(rateData);
    } else {
      var profitAmount = sheet.getRange("H1").getValue();
      
      for (var row = minRow; row <= maxRow; row++) {
        if (batchRowsSet[row]) {
          var costYen = Number(costYenValues[row - minRow][0]);
          var currentProfitAmount = profitAmount;
          if (!currentProfitAmount || isNaN(currentProfitAmount)) {
            currentProfitAmount = getProfitAmountByCost(costYen);
          }
          profitData.push([currentProfitAmount]);
          rateData.push(['']);
        } else {
          profitData.push(['']);
          rateData.push(['']);
        }
      }
      sheet.getRange(minRow, CONFIG.COLUMNS.RATE, rowCount, 1).setValues(rateData);
      sheet.getRange(minRow, CONFIG.COLUMNS.PROFIT, rowCount, 1).setValues(profitData);
    }
    SpreadsheetApp.flush();
    Utilities.sleep(300);
    
    // ========================================
    // ④ AC列（容積重量）設定
    // ========================================
    console.log('④ AC列設定中...');
    var volumeFormulas = [];
    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        volumeFormulas.push([
          '=MAX(ROUND((Z' + row + '*AA' + row + '*AB' + row + ')/5),200)'
        ]);
      } else {
        volumeFormulas.push(['']);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.VOLUME, rowCount, 1).setFormulas(volumeFormulas);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // ========================================
    // ⑤ T列（送料）設定
    // ========================================
    console.log('⑤ T列（送料）設定中...');
    
    if (settings.shippingCalculationMethod === 'FIXED') {
      var shippingData = [];
      for (var row = minRow; row <= maxRow; row++) {
        if (batchRowsSet[row]) {
          var fixed = sheet.getRange("J1").getValue();
          if (!fixed || isNaN(fixed)) {
            var costYen = costYenValues[row - minRow][0];
            fixed = getShippingCostByCost(costYen);
          }
          shippingData.push([fixed]);
        } else {
          shippingData.push(['']);
        }
      }
      sheet.getRange(minRow, CONFIG.COLUMNS.SHIPPING, rowCount, 1).setValues(shippingData);
    } else {
      var shippingFormulas = [];
      var refFormulas = [];
      var hasRefFormulas = false;
      for (var row = minRow; row <= maxRow; row++) {
        if (batchRowsSet[row]) {
          var formulas = buildShippingFormulas_(row, settings.shippingCalculationMethod);
          shippingFormulas.push([formulas.shippingFormula]);
          if (formulas.refEbayFormula) {
            refFormulas.push([formulas.refEbayFormula]);
            hasRefFormulas = true;
          } else {
            refFormulas.push(['']);
          }
        } else {
          shippingFormulas.push(['']);
          refFormulas.push(['']);
        }
      }
      sheet.getRange(minRow, CONFIG.COLUMNS.SHIPPING, rowCount, 1).setFormulas(shippingFormulas);
      if (hasRefFormulas) {
        sheet.getRange(minRow, CONFIG.COLUMNS.REF_EBAY, rowCount, 1).setFormulas(refFormulas);
      }
    }
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // ========================================
    // ⑥ R列（販売価格DDU）設定
    // ========================================
    console.log('⑥ R列（DDU価格）設定中...');
    var priceFormulas = [];
    
    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        if (settings.profitCalculationMethod === 'RATE') {
          priceFormulas.push([
            '=ROUND(((I' + row + '+T' + row + ')/(1-(V' + row + '+W' + row + '+$F$2+$Z$2))/$C$2)*100)/100'
          ]);
        } else {
          priceFormulas.push([
            '=ROUND(((I' + row + '+T' + row + '+U' + row + ')/(1-(V' + row + '+$F$2+$Z$2))/$C$2)*100)/100'
          ]);
        }
      } else {
        priceFormulas.push(['']);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.PRICE, rowCount, 1).setFormulas(priceFormulas);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // ========================================
    // ⑦ U列（利益額）設定（利益率モードのみ）
    // ========================================
    if (settings.profitCalculationMethod === 'RATE') {
      console.log('⑦ U列（利益額）設定中...');
      var profitFormulas = [];
      for (var row = minRow; row <= maxRow; row++) {
        if (batchRowsSet[row]) {
          profitFormulas.push([
            '=ROUND(R' + row + '*$C$2*(1-(V' + row + '+$F$2+$Z$2)) - I' + row + ' - T' + row + ', 0)'
          ]);
        } else {
          profitFormulas.push(['']);
        }
      }
      sheet.getRange(minRow, CONFIG.COLUMNS.PROFIT, rowCount, 1).setFormulas(profitFormulas);
      SpreadsheetApp.flush();
      Utilities.sleep(500);
    }
    
    // ========================================
    // ⑧ AB列（想定関税）設定
    // ========================================
    console.log('⑧ AB列（想定関税）設定中...');
    var taxFormulas = [];
    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        taxFormulas.push([
          '=ROUND(R' + row + '*$AD$2*$AE$2+$AC$1,2)'
        ]);
      } else {
        taxFormulas.push(['']);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.ESTIMATED_TAX, rowCount, 1).setFormulas(taxFormulas);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // ========================================
    // ⑨ S列（関税込み価格DDP）設定
    // ========================================
    console.log('⑨ S列（DDP価格）設定中...');
    var ddpFormulas = [];
    for (var row = minRow; row <= maxRow; row++) {
      if (batchRowsSet[row]) {
        ddpFormulas.push([
          '=ROUND(R' + row + '+AB' + row + ',2)'
        ]);
      } else {
        ddpFormulas.push(['']);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.TAX_INCLUDED_PRICE, rowCount, 1).setFormulas(ddpFormulas);
    SpreadsheetApp.flush();
    Utilities.sleep(500);
    
    // ========================================
    // ⑩ AE列（DDU調整価格）設定
    // ========================================
    if (settings.dduAdjustmentEnabled) {
      var priceMode = getPriceDisplayMode();
      
      if (priceMode !== 'TAX_INCLUDED') {
        console.log('⑩ AE列（DDU調整価格）設定中...');
        var dduFormulas = [];
        for (var row = minRow; row <= maxRow; row++) {
          if (batchRowsSet[row]) {
            dduFormulas.push([
              '=IF(AND(R' + row + '>=' + settings.dduThreshold + ', NOT(ISBLANK(S' + row + '))), S' + row + '-' + settings.dduAdjustmentAmount + ', "")'
            ]);
          } else {
            dduFormulas.push(['']);
          }
        }
        sheet.getRange(minRow, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE, rowCount, 1).setFormulas(dduFormulas);
        sheet.getRange(minRow, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE, rowCount, 1).setNumberFormat('0.00');
        SpreadsheetApp.flush();
        Utilities.sleep(500);
      }
    }
    
    // ========================================
    // 価格セルのハイライト設定（処理対象の行のみ）
    // ========================================
    console.log('価格セルのハイライト設定中...');
    for (var i = 0; i < batchRows.length; i++) {
      try {
        setPriceCellHighlight(sheet, batchRows[i]);
      } catch (e) {
        console.error('ハイライト設定エラー（行' + batchRows[i] + '）: ' + e.message);
      }
    }
    
    console.log('=== 計算バッチ完了 ===');
    
  } catch (e) {
    console.error('一括計算適用エラー: ' + e.message);
    throw e;
  }
}




/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  トリガー/状態管理
/******************************************************
 * 完全版（エラー修正済み）Part 4/5
 *  - 「選択行を保存してクリア」「選択行のデータのみ削除」「保存シート一覧」
 *  - 利益額レンジ管理（Profit_Amounts）
 *  - 送料テーブル作成/デバッグ（※Airmail表は Shipping_Rates の I/J 列に作成）
 *  - ドロップダウン生成、現在の設定確認、処理状況確認、テスト系
 *  - 汎用ユーティリティ
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  保存／クリア関連
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function saveSelectedRowsAndClear() {
  try {
    var settings = getSettings(); if (!settings) return;
    var sheet = validateAndGetSheet(); if (!sheet) return;

    var range = sheet.getActiveRange();
    if (!range) {
      conditionalShowAlert("保存する行を選択してください。", "info");
      return;
    }

    var startRow = range.getRow(), endRow = range.getLastRow();
    if (startRow < 5) {
      conditionalShowAlert("5行目以降のデータを選択してください。", "info");
      return;
    }

    // 確認ダイアログを条件付きに表示
    var ok = conditionalConfirmDialog(
      '選択された ' + startRow + ' ～ ' + endRow + ' 行を保存シートへコピーし、元の値をクリアして全列の数式を再設定します。\n\n' +
      '・保存後、全列の数式を再設定\n' +
      '・元に戻せません\n\n続行しますか？',
      '選択行の保存とクリア'
    );

    if (ok !== SpreadsheetApp.getUi().Button.YES) {
      conditionalShowAlert('キャンセルしました。', 'info');
      return;
    }

    // 1. 保存処理
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var requiredRows = endRow - startRow + 1;
    var targetSheet = getOrCreateSaveSheet(ss, requiredRows);
    var savedCount = saveRowsToSheet(sheet, targetSheet, startRow, endRow);

    // 2. 計算モードの読み取り
    var profitCalcText = sheet.getRange('AL2').getValue(); // "利益率" or "利益額"
    var profitCalc = (profitCalcText === '利益額') ? 'AMOUNT' : 'RATE';
    var shippingCalc = getShippingCalcMethodFromLabel_(sheet);

    // 3. クリア処理
    clearSelectedRowsValues(sheet, startRow, endRow, shippingCalc);

    // 4. applyCalculationFormulas関数を呼び出して全列の式を再設定
    var result = applyCalculationFormulas(settings.sheetName, {
      profitCalc: profitCalc,
      shippingCalcMethod: shippingCalc
    });

    if (!result.success) {
      showAlert("計算式の再出力エラー: " + result.error, "error");
      return;
    }

    // 完了メッセージは表示しない

  } catch (e) {
    // エラーは常に表示
    showAlert('保存・クリア中にエラー: ' + e.message, "error");
  }
}

function clearSelectedRowsOnly() {
  try {
    var settings = getSettings(); if (!settings) return;
    var sheet = validateAndGetSheet(); if (!sheet) return;

    var range = sheet.getActiveRange();
    if (!range) { 
      conditionalShowAlert("削除する行を選択してください。","info"); 
      return; 
    }
    var startRow = range.getRow(), endRow = range.getLastRow();
    if (startRow < 5) { 
      conditionalShowAlert("5行目以降のデータを選択してください。","info"); 
      return; 
    }

    // 🔹 修正：確認ダイアログを条件付きに変更
    var ok = conditionalConfirmDialog(
      '選択 ' + startRow + '～' + endRow + ' 行のセル値を削除します。\n' +
      '・E列・O列・P列以降の数式は保持（AE列は削除）\n・ドロップダウン設定は保持\n・元に戻せません\n\n続行しますか？',
      '選択行のデータ削除'
    );

    if (ok !== SpreadsheetApp.getUi().Button.YES) {
      conditionalShowAlert('キャンセルしました。', "info");
      return;
    }
    
    // クリア処理前に配送計算モードを取得
    var method = getShippingCalcMethodFromLabel_(sheet);
    clearSelectedRowsValues(sheet, startRow, endRow, method);
    var count = endRow - startRow + 1;
    var deletedCols = (method === 'TAG_SHIPPING')
      ? 'A,B,C,D,G～N列,AE列の値／ハイライト（F列の式は保持）'
      : 'A,B,C,D,F～N列,AE列の値／ハイライト';
    var msg = '✅ データ削除完了\n\n' +
      '🗑️ ' + startRow + '～' + endRow + ' 行 (' + count + '行)\n' +
      '✅ 保持：E列・O列・P列以降の数式／全列のドロップダウン\n' +
      '❌ 削除：' + deletedCols;
    
    // 🔹 修正：完了通知を条件付きに変更
    conditionalShowAlert(msg, "success");
    
  } catch (e) {
    // エラーは常に表示
    showAlert('削除中にエラー: ' + e.message, "error");
  }
}

function listSavedSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var MAX_ROWS_PER_SHEET = 5500;
    var saved = sheets.filter(function(sh){ return sh.getName().indexOf('保存データ_')===0; })
                      .sort().reverse();
    if (saved.length===0) { 
      conditionalShowAlert("保存されたシートはありません。","info"); 
      return; 
    }
    
    var report = '📋 保存されたシート一覧 (' + saved.length + '件)\n\n';
    for (var i=0;i<saved.length;i++) {
      var sh = saved[i];
      var rows = Math.max(0, sh.getLastRow() - 4);
      var cap = Math.round((rows / MAX_ROWS_PER_SHEET) * 100);
      var status = cap >= 100 ? "🔴 満杯" : cap >= 80 ? "🟡 残り少" : "🟢 余裕";
      report += (i+1) + '. 「' + sh.getName() + '」\n' +
                '    📊 ' + rows + '/' + MAX_ROWS_PER_SHEET + '行 (' + cap + '%) ' + status + '\n\n';
    }
    report += '💡 満杯のシートには新規データは追加されません。';
    
    // 🔹 修正：一覧表示を条件付きに変更
    conditionalInfoDialog(report, "保存シート一覧");
    
  } catch (e) {
    // エラーは常に表示
    showAlert('一覧表示エラー: ' + e.message, "error");
  }
}

function getOrCreateSaveSheet(spreadsheet, requiredRows) {
  var MAX_ROWS_PER_SHEET = 5500;
  try {
    var sheets = spreadsheet.getSheets();
    var saveSheets = sheets.filter(function(s){ return s.getName().indexOf('保存データ_')===0; })
                           .sort(function(a,b){ return b.getName().localeCompare(a.getName()); });
    if (saveSheets.length>0) {
      var latest = saveSheets[0];
      var current = Math.max(0, latest.getLastRow() - 4);
      if (current + requiredRows <= MAX_ROWS_PER_SHEET) return latest;
    }
    var now = new Date();
    var ts = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    var newName = '保存データ_' + ts;
    var newSheet = spreadsheet.insertSheet(newName);
    var source = validateAndGetSheet();
    if (source) {
      var header = source.getRange(1,1,4,source.getLastColumn());
      header.copyTo(newSheet.getRange(1,1,4,source.getLastColumn()),
        SpreadsheetApp.CopyPasteType.PASTE_NORMAL,false);
    }
    return newSheet;
  } catch(e) {
    throw new Error('保存先シートの準備に失敗: ' + e.message);
  }
}

// 【修正版】saveRowsToSheet関数：値のみ保存（数式は保存しない）
function saveRowsToSheet(sourceSheet, targetSheet, startRow, endRow) {
  try {
    var rowCount = endRow - startRow + 1;
    var colCount = sourceSheet.getLastColumn();
    var srcRange = sourceSheet.getRange(startRow,1,rowCount,colCount);
    var vals = srcRange.getValues();
    // var forms = srcRange.getFormulas(); ← 削除：数式は取得しない

    // 🆕 H列（仕入先コード）が空白の最初の行を探す
    var dstRow = 5; // デフォルトは5行目から
    var maxRow = Math.max(1000, targetSheet.getLastRow()); // 最低1000行まで検索
    for (var searchRow = 5; searchRow <= maxRow; searchRow++) {
      var hValue = targetSheet.getRange(searchRow, 8).getValue(); // H列 = 8列目
      if (!hValue || hValue === '') {
        dstRow = searchRow;
        break;
      }
    }
    for (var i=0;i<rowCount;i++) {
      for (var j=0;j<colCount;j++) {
        var cell = targetSheet.getRange(dstRow+i, 1+j);
        // 【修正】数式チェックを削除し、常に値のみを設定
        cell.setValue(vals[i][j]);
      }
    }
    
    // フォーマットのコピーは引き続き実行
    srcRange.copyTo(targetSheet.getRange(dstRow,1,rowCount,colCount),
      SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);

    var saved = 0;
    for (var k=0;k<vals.length;k++) {
      var row = vals[k];
      if (row[CONFIG.COLUMNS.COST_YEN -1] || row[CONFIG.COLUMNS.JP_TITLE -1] || row[CONFIG.COLUMNS.JP_DESC -1]) saved++;
    }
    return saved;
  } catch(e) {
    throw new Error('データ保存に失敗: ' + e.message);
  }
}

/**
 * 🆕 選択行のA～O列の値のみクリア
 * P列以降の計算式は完全に保持
 */
function clearSelectedRowsValues(sheet, startRow, endRow, opt_method) {
  try {
    var rowCount = endRow - startRow + 1;
    var method = opt_method || 'TABLE';

    // 指定された列のみクリア（E列・O列・P列以降は保持、AE列は除外）
    // clearContent() = 値のみ削除、書式・入力規則は保持

    // A, B, C, D列（1～4列）をクリア
    sheet.getRange(startRow, 1, rowCount, 4).clearContent();

    // F列はTAG_SHIPPINGモードで式が入るため、モードに応じてクリア範囲を分岐
    if (method === 'TAG_SHIPPING') {
      // G～N列（7～14列、8列分）のみクリア（F列の式を保護）
      sheet.getRange(startRow, 7, rowCount, 8).clearContent();
    } else {
      // F～N列（6～14列、9列分）をクリア
      sheet.getRange(startRow, 6, rowCount, 9).clearContent();
    }

    // AE列（31列目）をクリア
    sheet.getRange(startRow, CONFIG.COLUMNS.CONDITION, rowCount, 1).clearContent();

    // AU列（使用プロンプト）をクリア
    sheet.getRange(startRow, CONFIG.COLUMNS.USED_PROMPT, rowCount, 1).clearContent();
    // AV列（交通整理バックアップ）をクリア
    sheet.getRange(startRow, CONFIG.COLUMNS.JP_DESC_BACKUP, rowCount, 1).clearContent();
    // AW列（交通整理英語版）をクリア
    sheet.getRange(startRow, CONFIG.COLUMNS.EN_DESC_SANITIZED, rowCount, 1).clearContent();

  } catch(e) {
    throw new Error('行クリア中にエラー: ' + e.message);
  }
}

/**
 * 選択行をクリアして式を再設定
 * clearSelectedRowsValues + applyCalculationFormulas の統合版
 */
function clearAndReapplyFormulas() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var range = sheet.getActiveRange();

    if (!range) {
      showAlert('行を選択してください。', 'error');
      return;
    }

    var startRow = range.getRow();
    var endRow = startRow + range.getNumRows() - 1;

    // 5行目未満は対象外
    if (startRow < 5) {
      showAlert('5行目以降を選択してください。', 'error');
      return;
    }

    // 設定を取得
    var settings = getSettings();
    if (!settings) return;

    // 1. 計算モードの読み取り
    var profitCalcText = sheet.getRange('AL2').getValue(); // "利益率" or "利益額"
    var profitCalc = (profitCalcText === '利益額') ? 'AMOUNT' : 'RATE';
    var shippingCalc = getShippingCalcMethodFromLabel_(sheet);

    // 2. 選択行をクリア
    clearSelectedRowsValues(sheet, startRow, endRow, shippingCalc);

    // 3. applyCalculationFormulas関数を呼び出して全列の式を再設定
    var result = applyCalculationFormulas(settings.sheetName, {
      profitCalc: profitCalc,
      shippingCalcMethod: shippingCalc
    });

    if (!result.success) {
      showAlert("計算式の再出力エラー: " + result.error, "error");
      return;
    }

    conditionalShowAlert('選択行（' + startRow + '～' + endRow + '）のクリアと全列の式の再設定が完了しました。', 'success');

  } catch (e) {
    showAlert('エラー: ' + e.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  利益額レンジ（Profit_Amounts）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function setupProfitAmountSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = "Profit_Amounts";
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange("A1").setValue("Cost Range (Min)");
    sh.getRange("B1").setValue("Cost Range (Max)");
    sh.getRange("C1").setValue("Profit Amount (JPY)");
    sh.getRange("D1").setValue("Shipping Cost (JPY)");
    sh.getRange("E1").setValue("説明:");
    sh.getRange("F1").setValue("I列の仕入れ値に応じて自動適用される利益額/送料を設定。小→大で並べる。Max 空白=以降すべて。");
    sh.getRange("A2").setValue(0);     sh.getRange("B2").setValue(1000);  sh.getRange("C2").setValue(200);  sh.getRange("D2").setValue(800);
    sh.getRange("A3").setValue(1001);  sh.getRange("B3").setValue(5000);  sh.getRange("C3").setValue(500);  sh.getRange("D3").setValue(1200);
    sh.getRange("A4").setValue(5001);  sh.getRange("B4").setValue(10000); sh.getRange("C4").setValue(1000); sh.getRange("D4").setValue(1500);
    sh.getRange("A5").setValue(10001); sh.getRange("B5").setValue(20000); sh.getRange("C5").setValue(2000); sh.getRange("D5").setValue(2000);
    sh.getRange("A6").setValue(20001); sh.getRange("B6").setValue("");    sh.getRange("C6").setValue(3000); sh.getRange("D6").setValue(2500);
    sh.getRange("A1:D1").setFontWeight("bold").setBackground("#cfe2f3");
    sh.getRange("A1:F1").setVerticalAlignment("top");
    sh.setColumnWidth(1,150); sh.setColumnWidth(2,150); sh.setColumnWidth(3,150); sh.setColumnWidth(4,150);
    sh.setColumnWidth(5,80);  sh.setColumnWidth(6,400);
    showAlert('「' + name + '」シートを作成しました。必要に応じて編集してください。', "success");
  } else {
    showAlert('「' + name + '」シートを開きました。', "info");
  }
  ss.setActiveSheet(sh);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  送料テーブル作成・デバッグ（Airmail修正）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function setupShippingTables() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ui = SpreadsheetApp.getUi();
    var ok = ui.alert('送料テーブル設定',
      '送料テーブル管理用のシートを作成します。\n\n・Shipping_Methods（A～I列）\n・Shipping_Rates（A～G列=各メソッド、I/J列=Airmail）\n\n既存値は可能な限り保持し、空欄のみ補完します。続行しますか？',
      ui.ButtonSet.YES_NO);
    if (ok !== ui.Button.YES) { showAlert('キャンセルしました。', "info"); return; }
    createOrUpdateShippingMethodsSheet_(ss);
    createOrUpdateShippingRatesSheet_(ss);
    showAlert('✅ 送料テーブルの設定が完了しました。\n\n📋 作成/更新: Shipping_Methods / Shipping_Rates\n🛫 Airmailの帯は Shipping_Rates の I/J 列に配置しました。', "success");
  } catch (e) {
    showAlert('送料テーブル設定エラー: ' + e.message, "error");
  }
}

function createOrUpdateShippingMethodsSheet_(ss) {
  var name = "Shipping_Methods";
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  // ヘッダー
  var headers = ["Method_ID","Method_Name","Group","Active","Priority","Weight_Limit","Size_Limit","Calc_Type","Description"];
  for (var i=0;i<headers.length;i++) sh.getRange(1, i+1).setValue(headers[i]);
  sh.getRange("A1:I1").setFontWeight("bold").setBackground("#cfe2f3");
  sh.setColumnWidth(1,80); sh.setColumnWidth(2,120); sh.setColumnWidth(3,80);
  sh.setColumnWidth(4,60); sh.setColumnWidth(5,60);  sh.setColumnWidth(6,100);
  sh.setColumnWidth(7,100); sh.setColumnWidth(8,90);  sh.setColumnWidth(9,220);

  // データ行（2行目以降）
  var methods = CONFIG.SHIPPING_METHODS;
  var idToRow = {};
  var lastRow = sh.getLastRow();
  if (lastRow >= 2) {
    var existing = sh.getRange(2,1,lastRow-1,9).getValues();
    for (var r=0;r<existing.length;r++) {
      var id = String(existing[r][0]||'').trim();
      if (id) idToRow[id] = 2+r;
    }
  }
  var order = Object.keys(methods);
  for (var i2=0;i2<order.length;i2++) {
    var id = order[i2];
    var m = methods[id];
    var row = idToRow[id] || (2 + i2);
    sh.getRange(row,1).setValue(id);
    sh.getRange(row,2).setValue(m.name);
    sh.getRange(row,3).setValue(m.group);
    sh.getRange(row,4).setValue(true);
    sh.getRange(row,5).setValue(1);
    sh.getRange(row,6).setValue(m.weightLimit);
    sh.getRange(row,7).setValue(m.sizeLimit);
    sh.getRange(row,8).setValue(m.calcType);
    sh.getRange(row,9).setValue(m.name + ' - ' + m.group + 'グループ');
  }
}


function createOrUpdateShippingRatesSheet_(ss) {
  var name = "Shipping_Rates";
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  // ヘッダー（空欄のみ設定）
  var setIfBlank_ = function(a1, v) {
    var rg = sh.getRange(a1);
    if (rg.getValue() === "") rg.setValue(v);
  };
  
  setIfBlank_("A1","Weight_From");
  setIfBlank_("B1","Weight_To");
  setIfBlank_("C1","EP");
  setIfBlank_("D1","CE");
  setIfBlank_("E1","EMS");
  setIfBlank_("F1","CF");
  setIfBlank_("G1","CD");
  setIfBlank_("H1","EL"); // ← eLogistics追加
  setIfBlank_("A2","(g)");
  setIfBlank_("B2","(g)");
  setIfBlank_("C2","eパケット");
  setIfBlank_("D2","Cpass-Economy");
  setIfBlank_("E2","EMS");
  setIfBlank_("F2","Cpass-FedEx");
  setIfBlank_("G2","Cpass-DHL");
  setIfBlank_("H2","eLogistics"); // ← eLogistics追加

  // Airmail 専用見出し（I/J列）
  setIfBlank_("I1","Airmail_Weight_Max");
  setIfBlank_("J1","Airmail_Rate");
  setIfBlank_("I2","(g max)");
  setIfBlank_("J2","(JPY)");

  // ヘッダーの書式設定（H列まで拡張）
  sh.getRange("A1:H2").setFontWeight("bold").setBackground("#cfe2f3");
  sh.getRange("I1:J2").setFontWeight("bold").setBackground("#eaf1ff");
  
  // 列幅設定（H列まで拡張）
  sh.setColumnWidth(1,80); sh.setColumnWidth(2,80);
  for (var c=3;c<=8;c++) sh.setColumnWidth(c,100); // ← 8まで拡張
  sh.setColumnWidth(9,110); sh.setColumnWidth(10,110);

  // 重量帯（A/B列）とサンプル値の設定
  var last = sh.getLastRow();
  if (last < 3 || (sh.getRange(3,1).getValue()==="" && sh.getRange(3,2).getValue()==="")) {
    var sample = [
      [1,100],[101,200],[201,300],[301,400],[401,500],
      [501,600],[601,700],[701,800],[801,900],[901,1000],
      [1001,1100],[1101,1200],[1201,1300],[1301,1400],[1401,1500],
      [1501,1600],[1601,1700],[1701,1800],[1801,1900],[1901,2000],
      [2001,2500],[2501,3000],[3001,3500],[3501,4000],[4001,4500],
      [4501,5000],[5001,6000],[6001,7000],[7001,8000],[8001,9000],
      [9001,10000],[10001,15000],[15001,20000],[20001,30000]
    ];
    
    for (var i=0;i<sample.length;i++) {
      var r = i+3;
      if (sh.getRange(r,1).getValue()==="") sh.getRange(r,1).setValue(sample[i][0]);
      if (sh.getRange(r,2).getValue()==="") sh.getRange(r,2).setValue(sample[i][1]);
      
      // C列からH列まで[入力]を設定（H列も含む）
      for (var c2=3;c2<=8;c2++) { // ← 8まで拡張
        var cell = sh.getRange(r,c2);
        if (cell.getValue()==="") cell.setValue('[入力]');
      }
    }
  }

  // Airmail のサンプル帯（I/J列）- 既存のまま
  var amBands = [
    [50,  280],
    [100, 420],
    [250, 720],
    [500, 1260],
    [1000,2860],
    [2000,5000]
  ];
  for (var j=0;j<amBands.length;j++) {
    var rr = 3 + j;
    var cI = sh.getRange(rr, 9);
    var cJ = sh.getRange(rr,10);
    if (cI.getValue() === "") cI.setValue(amBands[j][0]);
    if (cJ.getValue() === "") cJ.setValue(amBands[j][1]);
  }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ドロップダウン・設定確認・処理状況
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function generateWeightOptions() {
  try {
    var options=[];
    for (var w=50; w<=2000; w+=50) options.push(w);
    for (var w2=2500; w2<=68000; w2+=500) options.push(w2);
    return options;
  } catch(e) { return [100,200,300,400,500]; }
}

function generateSizeOptions() {
  try {
    return [
      "25x20x5", "25x20x10", "25x20x15", "30x25x20", "30x30x25", 
      "40x30x25", "40x35x30", "40x40x35", "45x35x30"
    ];
  } catch(e) { return ["20x15x10", "25x20x15", "30x25x20"]; }
}

function setupDropdownValidation() {
  try {
    var sheet = validateAndGetSheet(); if (!sheet) return;
    var last = sheet.getLastRow();
    if (last < 5) { showAlert("⚠️ データがありません。5行目以降に入力してください。","warning"); return; }

    var weight = generateWeightOptions();
    var size   = generateSizeOptions();
    var shippingOptions = ["自動選択","eパケット","Cpass-FedEx","Cpass-Economy","Cpass-DHL","EMS"];

    var conditionOptions = CONFIG.CONDITION_OPTIONS;
    var categoryOptions = CONFIG.EBAY_CATEGORIES;

    var rules = [
      {
        range: sheet.getRange(5, CONFIG.COLUMNS.WEIGHT, last-4, 1),  // 25（Y列）
        options: weight,
        helpText: "梱包重量（50-2000g:50g刻み, 2000g以降:500g刻み）"
      },
      {
        range: sheet.getRange(5, CONFIG.COLUMNS.METHOD, last-4, 1),  // 24（X列）
        options: shippingOptions,
        helpText: "配送方法。「自動選択」= eパケット or Cpass-FedEx を自動判定"
      },
      {
        range: sheet.getRange(5, CONFIG.COLUMNS.CONDITION, last-4, 1),  // 31（AE列）
        options: conditionOptions,
        helpText: "商品の状態。AI判定後に手動変更可能です。"
      }
    ];
    
    for (var i=0;i<rules.length;i++) {
      var r = rules[i];
      r.range.clearDataValidations();
      var dv = SpreadsheetApp.newDataValidation().requireValueInList(r.options, true)
        .setAllowInvalid(true).setHelpText(r.helpText).build();
      r.range.setDataValidation(dv);
    }

    showAlert("✅ ドロップダウン設定が完了しました。\n\n" +
  "💡 自動選択ロジック：\n" +
  "・設定金額以上 → Cpass-DHL\n" +
  "・設定金額未満 & eパケット可 → eパケット\n" +
  "・上記以外 → Cpass-DHL\n" +
  "・O2=1 →（Airmail 機能は無効化済み）\n\n" +
  "💡 新機能追加:\n" +
  "・AB列: 商品状態（新品/中古/エラー）\n" +
  "・AC列: eBayカテゴリー（関税計算用）\n" +
  "・エラー時は赤色でハイライト表示", "success");

  } catch(e) {
    showAlert('ドロップダウン設定エラー: ' + e.message, "error");
  }
}

function checkCurrentValidation() {
  try {
    var ui = SpreadsheetApp.getUi();
    var props = PropertiesService.getDocumentProperties();
    var docProps = PropertiesService.getDocumentProperties();
    var platform = props.getProperty('AI_PLATFORM') || 'openai';
    var model = props.getProperty('AI_MODEL') || 'gpt-5-nano';
    // APIキーはDocumentPropertiesからチェック
    var apiKeyStatus = '';
    if (platform==='openai') apiKeyStatus = docProps.getProperty('OPENAI_API_KEY') ? '✅ 設定済み' : '❌ 未設定';
    if (platform==='claude') apiKeyStatus = docProps.getProperty('CLAUDE_API_KEY') ? '✅ 設定済み' : '❌ 未設定';
    if (platform==='gemini') apiKeyStatus = docProps.getProperty('GEMINI_API_KEY') ? '✅ 設定済み' : '❌ 未設定';

    var sheetName = props.getProperty('SHEET_NAME') || '未設定';
    var profitCalc = props.getProperty('PROFIT_CALC_METHOD') || '未設定';
    var promptId = props.getProperty('PROMPT_ID') || 'EBAY_FULL_LISTING_PROMPT';
    var shippingThreshold = props.getProperty('SHIPPING_THRESHOLD') || '20000';
    var shippingCalc = props.getProperty('SHIPPING_CALC_METHOD') || 'TABLE';

    var lowPriceMethod = props.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'EP';
    var highPriceMethod = props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CD';
    
    // eLogistics対応の表示名取得
    var lowPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[lowPriceMethod] ? 
                       CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[lowPriceMethod].displayName : lowPriceMethod;
    var highPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[highPriceMethod] ? 
                        CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[highPriceMethod].displayName : highPriceMethod;

    var sheet = validateAndGetSheet();
    var lastRow = sheet ? sheet.getLastRow() : 0;
    var report = '📋 現在の設定:\n\n' +
      '• AIプラットフォーム: ' + platform + '\n' +
      '• AIモデル: ' + model + '\n' +
      '• APIキー: ' + apiKeyStatus + '\n' +
      '• 作業シート名: ' + sheetName + ' ' + (sheet ? '✅ 存在' : '⚠️ 見つからない') + '\n' +
      '• 利益計算方法: ' + (profitCalc==='RATE'?'利益率':(profitCalc==='AMOUNT'?'利益額':'未設定')) + '\n' +
      '• 送料計算方法: ' + (shippingCalc==='TABLE'?'テーブル計算':(shippingCalc==='FIXED'?'固定金額':'未設定')) + '\n' +
      '• 送料計算切替基準金額: ' + shippingThreshold + '円\n' +
      '• 基準金額未満の配送方法: ' + lowPriceName + '\n' +
      '• 基準金額以上の配送方法: ' + highPriceName + '\n' +
      '• 使用プロンプト: ' + promptId + '\n\n';

    if (sheet) {
      report += '📊 シートの設定値:\n';
      var fee = sheet.getRange("F1").getValue();  // 変更なし
      var ad  = sheet.getRange("F2").getValue();  // 変更なし
      var rate = sheet.getRange("H2").getValue();  // 変更なし
      var amt  = sheet.getRange("H1").getValue();  // 変更なし
      
      // ⚠️ セル参照をスライド後の位置に変更
      var v1=sheet.getRange("V1").getValue(), v2=sheet.getRange("V2").getValue(), w2=sheet.getRange("W2").getValue();
      var y1=sheet.getRange("Y1").getValue(), y2=sheet.getRange("Y2").getValue();
      // U1→V1, U2→V2, V2→W2, X1→Y1, X2→Y2

      report += '• 手数料率 (F1): ' + (fee || '未設定') + '\n';
      report += '• 広告費率 (F2): ' + (ad  || '未設定') + '\n';
      if (profitCalc==='RATE') report += '• 利益率 (H2): ' + (rate || '未設定') + '\n';
      if (profitCalc==='AMOUNT') report += '• 利益額 (H1): ' + (amt  || '未設定') + '\n';
      if (shippingCalc==='FIXED') {
        var fixed = sheet.getRange("J1").getValue();  // 変更なし
        report += '• 固定送料 (J1): ' + (fixed || '未設定') + '\n';
      }
      report += '• FedEx燃油(V1): ' + (v1 || 0) + ' / DHL燃油(V2): ' + (v2 || 0) + '\n';  // U1→V1, U2→V2
      report += '• Cpass割(W2): ' + (w2 || 0) + ' / FedEx追加(Y1): ' + (y1 || 0) + ' / DHL追加(Y2): ' + (y2 || 0) + '\n\n';  // V2→W2, X1→Y1, X2→Y2
      
      // 配送方法ロジックの説明（eLogistics対応）
      report += '🚚 配送方法選択ロジック:\n';
      if (lowPriceMethod === 'NONE') {
        report += '• 全商品: ' + highPriceName + ' のみ使用\n';
      } else {
        report += '• ' + shippingThreshold + '円以上: ' + highPriceName + '\n';
        report += '• ' + shippingThreshold + '円未満: ' + lowPriceName;
        if (lowPriceMethod === 'EP') {
          report += ' (制限超過時は' + highPriceName + 'にフォールバック)';
        }
        report += '\n';
      }
      report += '\n';
    }

    if (sheet && lastRow >= 5) {
      var testRow = 5;
      var cells = [
        { name: "重量", col: CONFIG.COLUMNS.WEIGHT },      // 25（Y列）
        { name: "長さ", col: CONFIG.COLUMNS.LENGTH },      // 26（Z列）
        { name: "幅", col: CONFIG.COLUMNS.WIDTH },        // 27（AA列）
        { name: "高さ", col: CONFIG.COLUMNS.HEIGHT },      // 28（AB列）
        { name: "発送方法", col: CONFIG.COLUMNS.METHOD }   // 24（X列）
      ];
      for (var i=0;i<cells.length;i++) {
        var c = cells[i];
        var rng = sheet.getRange(testRow, c.col);
        var v = rng.getValue();
        var valid = rng.getDataValidation();
        var status = valid ? "✅ ドロップダウン" : (v ? "❌ 直接値(検証なし)" : "N/A");
        report += '• ' + c.name + ' (' + rng.getA1Notation() + '): ' + v + ' ' + status + '\n';
      }
    } else {
      report += '• シートにデータがありません（5行目以降）。\n';
    }

    report += '\n💡 不足があればメニュー「初期設定」を実行してください。';
    ui.alert('現在の設定確認', report, ui.ButtonSet.OK);
   // 🔹 修正：設定確認ダイアログを条件付きに変更
    conditionalInfoDialog(report, '現在の設定確認');
    
  } catch(e) {
    showAlert('設定確認エラー: ' + e.message, "error");
  }
}

function checkProcessingStatus() {
  try {
    var sheet = validateAndGetSheet(); if (!sheet) return;
    var last = sheet.getLastRow();
    var total=0, done=0;
    if (last < 5) { showAlert("シートにデータがありません（5行目以降）。", "info"); return; }
    
    var range = sheet.getRange(5, CONFIG.COLUMNS.JP_TITLE, last-4,
      CONFIG.COLUMNS.EN_DESC - CONFIG.COLUMNS.JP_TITLE + 1);  // 10列から14列（変更なし）
    var vals = range.getValues();
    
    for (var i=0;i<vals.length;i++) {
      var r = i+5;
      var cost = Number(sheet.getRange(r, CONFIG.COLUMNS.COST_YEN).getValue());  // 9（変更なし）
      var jpTitle = vals[i][0];
      var jpDesc  = vals[i][CONFIG.COLUMNS.JP_DESC - CONFIG.COLUMNS.JP_TITLE];
      var enTitle = vals[i][CONFIG.COLUMNS.EN_TITLE - CONFIG.COLUMNS.JP_TITLE];
      var enDesc  = vals[i][CONFIG.COLUMNS.EN_DESC - CONFIG.COLUMNS.JP_TITLE];
      
      if (jpTitle && jpDesc && !isNaN(cost) && cost>0) {
        total++;
        if (enTitle && enDesc) done++;
      }
    }
    var pending = total - done;
    var rate = total>0 ? Math.round((done/total)*100) : 0;
    var report = '📊 処理状況:\n\n' +
      '• 入力済み行 (J,K,I列): ' + total + '\n' +
      '• 翻訳済み行 (M,N列): ' + done + '\n' +
      '• 未翻訳行: ' + pending + '\n' +
      '• 完了率: ' + rate + '%\n\n' +
      '💡 重量/サイズ/発送方法は「一括実行」時に手動入力(J2/L2/M2/N2)。必要に応じて手動調整してください。';
    showAlert(report, "info");
  // 🔹 修正：処理状況表示を条件付きに変更
    conditionalInfoDialog(report, "処理状況");
    
  } catch(e) {
    showAlert('処理状況確認エラー: ' + e.message, "error");
  }
}
