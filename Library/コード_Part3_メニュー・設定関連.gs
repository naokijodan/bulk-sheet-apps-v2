/******************************************************
 * 完全版（エラー修正済み）Part 5/5
 *  - メニュー onOpen（統合）
 *  - README 作成/更新、PDF書き出し、簡易図解
 *  - 価格計算ポップアップ（A/B）
 *  - 簡易版メニュー・初期設定・実行フロー
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メニュー onOpen（統合）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function onOpen() {
  try {
    var ui = SpreadsheetApp.getUi();
    
    // 1. 実行メニュー（毎回使う機能）
    ui.createMenu("🔁 実行メニュー")  
      .addItem("✅　選択行を実行(翻訳・計算)", "runSelectedRows")
      .addItem("🚀　統合実行（翻訳・計算・テンプレ・ポリシー）", "runSelectedRowsComplete")
      .addSeparator()
      .addItem("🔄 バッチ処理(翻訳・計算) 50行ずつ自動実行", "runSelectedRowsBatch")
      .addItem("🔄 バッチ処理(統合実行) 50行ずつ自動実行", "runSelectedRowsCompleteBatch")
      .addItem('▶️ 処理を再開', 'resumeBatchProcessing')
      .addItem('📊 進捗確認', 'checkBatchProgress')
      .addItem('❌ 処理をキャンセル', 'cancelBatchProcessing')
      .addSeparator()
      .addItem("📝　選択行を翻訳のみ", "runSelectedRowsTranslate")
      .addItem("🔢　選択行を計算のみ", "runSelectedRowsCalculate")
      .addSeparator()
      .addItem('⚡ テンプレ・ポリシー自動出力（O1・O2使用）', 'autoApplyTemplateAndPolicy')
      .addItem('🖐️ テンプレ・ポリシー手動選択（ダイアログ）', 'setTemplateAndPolicyForSelectedRows')
      .addItem('🔍 テンプレート手動検索', 'showTemplateManualSearchDialog')
      .addItem('🔍 シッピングポリシー手動検索', 'showShippingPolicyManualSearchDialog')
      .addSeparator()
      .addItem("📦 選択行を保存してクリア", "saveSelectedRowsAndClear")
      .addItem("🗑️ 選択行のデータのみ削除", "clearSelectedRowsOnly")
      .addSeparator()
      .addItem("🔄 計算式を再出力（R～AG列）", "reapplyCalculationFormulasToSelectedRows")
      .addItem("🔄 選択行クリア＋式再設定", "clearAndReapplyFormulas")
      .addSeparator()
      .addItem('選択行の高さを150pxに調整', 'adjustSelectedRowHeights')
      .addItem('選択行の高さをリセット', 'resetSelectedRowHeights')
      .addItem('選択行をクリア', 'clearSelectedRowsSafely')
      .addItem('作業シートにコピー', 'copyToWorkSheet')

      .addToUi();
    
    // 2. 計算メニュー
    addPriceCalcStandaloneMenu_();
    
    // 3. 設定メニュー（初期設定 + EAGLE更新 + 簡易版）
    ui.createMenu('⚙️ 設定メニュー')
      .addItem("⚙️ 初期設定（いつでも変更可）", "initialSetup")
      .addItem("📝 プロンプト編集", "showPromptEditorSidebar")
      .addSeparator()
      .addItem('📊 EAGLE データ更新（初回/定期更新）', 'updateEagleData')
      .addItem('🛠️ EAGLEシート初期作成', 'setupInitial')
      .addSeparator()
      .addItem('🔗 旧データインポート', 'showDataImportDialog')
      .addItem('📤 設定をエクスポート', 'exportSettingsToSheet')
      .addItem('📥 設定をインポート', 'showSettingsImportDialog')
      .addItem('📥 データインポート', 'showDataImportDialog')
      .addSeparator()
      .addItem('🔄 テンプレート・ポリシー再取得', 'updateTemplatePolicyOnly')
      .addItem('🚀 検証→マスター反映', 'validateAndApplyImport')
      .addItem('🔑 APIトークン管理', 'manageApiToken')
      .addItem('📋 現在の設定確認', 'showCurrentSetupStatus')
      .addSeparator()
      .addItem('🗑️ Policy_Masterキャッシュクリア', 'clearPolicyMasterCache')
      .addSeparator()
      .addSubMenu(ui.createMenu('📱 簡易版')
        .addItem('🎯 簡易版を開く', 'openSimpleMode')
        .addItem('🔄 簡易版を更新', 'updateSimpleMode'))
      .addToUi();

    // 4. 為替レートメニュー
    ui.createMenu('💱 為替レート')
      .addItem('🔄 為替レート自動更新を開始（毎日午前9時）', 'setupExchangeRateUpdateTrigger')
      .addItem('⏸️ 為替レート自動更新を停止', 'removeExchangeRateUpdateTrigger')
      .addItem('📊 為替レート自動更新の状態確認', 'checkExchangeRateUpdateStatus')
      .addToUi();

    // 為替レート自動更新の状態を通知（起動時）
    notifyExchangeRateUpdateStatus_();

  } catch (e) {
    // menu失敗時は黙殺
  }
}

/**
 * 為替レート自動更新の状態を画面に表示（起動時）
 * @private
 */
function notifyExchangeRateUpdateStatus_() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) return;

    var isActive = isExchangeRateUpdateTriggerActive();
    var a2Value = sheet.getRange("A2").getValue();
    var c2Value = sheet.getRange("C2").getValue();

    // A2とC2のセルに背景色で状態を示す
    if (isActive) {
      // 自動更新が有効な場合
      sheet.getRange("A2").setBackground("#e3f2fd"); // 薄い青（参考値）
      sheet.getRange("C2").setBackground("#d4edda"); // 薄い緑（使用値）
      sheet.getRange("A1").setValue("参考為替(GF)");
      sheet.getRange("C1").setValue("使用為替(API)");
    } else {
      // 自動更新が無効な場合
      sheet.getRange("A2").setBackground("#e3f2fd"); // 薄い青
      sheet.getRange("C2").setBackground("#fff3cd"); // 薄い黄色（警告）
      sheet.getRange("A1").setValue("参考為替(GF)");
      sheet.getRange("C1").setValue("使用為替");
    }
  } catch (e) {
    // エラーは無視
  }
}

/**
 * 為替レート自動更新の状態を確認して表示
 */
function checkExchangeRateUpdateStatus() {
  try {
    var isActive = isExchangeRateUpdateTriggerActive();
    var docProps = PropertiesService.getDocumentProperties();
    var sheetName = docProps.getProperty('SHEET_NAME') || '作業シート';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      showAlert('作業シートが見つかりません', 'error');
      return;
    }

    var a2Value = Number(sheet.getRange("A2").getValue()) || 0;
    var c2Value = Number(sheet.getRange("C2").getValue()) || 0;

    var message = '【為替レート自動更新の状態】\n\n';

    if (isActive) {
      message += '✅ 自動更新: 有効（毎日午前9時）\n';
      message += 'データソース: exchangerate-api.com\n\n';
    } else {
      message += '⚠️ 自動更新: 無効\n\n';
    }

    message += 'A2（GOOGLEFINANCE）: ¥' + a2Value.toFixed(2) + '\n';
    message += 'C2（使用為替）: ¥' + c2Value.toFixed(2) + '\n\n';

    if (!isActive) {
      message += '※ 自動更新を開始するには、メニューから\n「💱 為替レート」→「🔄 為替レート自動更新を開始」\nを選択してください。';
    }

    showAlert(message, 'info');
  } catch (e) {
    showAlert('状態確認に失敗しました: ' + e.message, 'error');
  }
}

function createOrUpdateReadme_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = 'README';
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name); else sh.clear();

  function h(row, text){ sh.getRange(row,1).setValue(text).setFontWeight('bold').setFontSize(12); }
  function p(row, text){ sh.getRange(row,1).setValue(text).setWrap(true); }
  function kvTable(row, title, obj){
    h(row, '■ ' + title);
    var i = row+1, data = [['Key','Value']];
    for (var k in obj){ data.push([k, (typeof obj[k]==='object'? JSON.stringify(obj[k]) : String(obj[k]))]); }
    sh.getRange(i,1,data.length,data[0].length).setValues(data);
    sh.getRange(i,1,1,2).setFontWeight('bold').setBackground('#e6f0ff');
    sh.getRange(i,data[0].length, data.length, 1).setWrap(true);
    return i + data.length;
  }

  var row = 1;
  h(row++, '📖 このスプレッドシートの使い方（自動生成）');
  p(row++, '最終更新: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss'));
  row++;

  h(row++, '1. 概要');
  p(row++, 'このブックは、eBay出品向けに「タイトル/説明の英訳生成」「送料・手数料・利益を考慮した販売価格計算」「配送方法の自動判定」を行うツールです。OpenAI/Claude/Gemini いずれかのAPIを使用します。');
  row++;

  h(row++, '2. 初期設定（最初にやること）');
  p(row++, [
    '① メニュー「🔁 AI翻訳・価格計算」→「⚙️ 初期設定（初回のみ）」でAPIキー/モデル/作業シート名などを保存します。',
    '② 作業シートのセル設定：為替 C2、手数料率 F1、広告費率 F2、利益率 H2 もしくは利益額 H1 を入力。',
    '③ 配送関連：Q1/Q2/R2/T1/T2（燃油・割引・追加500g）を必要に応じて設定。',
    '④ 送料テーブルを使う場合は「🚚 送料テーブル設定」で Shipping_Rates を作成し、国・ゾーンごとの料金を入力。',
    '   ※ Airmail の帯は Shipping_Rates の I/J 列を使用します（I=閾値Max, J=料金）。'
  ].join('\n'));
  row += 3;

  h(row++, '3. 主要セル・列（作業シート）');
  var cols = CONFIG && CONFIG.COLUMNS ? CONFIG.COLUMNS : {};
  row = kvTable(row, '列マッピング（CONFIG.COLUMNS）', cols);
  row = kvTable(row+1, '送料メタ（CONFIG.SHIPPING_METHODS）', CONFIG && CONFIG.SHIPPING_METHODS ? CONFIG.SHIPPING_METHODS : {});
  row++;

  h(row++, '4. 基本的な使い方フロー');
  p(row++, [
    '1) 作業シートの J列（日本語タイトル）/K列（日本語説明）/I列（仕入れ値）を入力。',
    '2) J2: 梱包重量、L2/M2/N2: 梱包サイズを入力。',
    '3) 「一括実行」または「選択行を実行」を押すと、英語タイトル/説明（M/N列）、配送方法（V列）、送料（R列）、販売価格（Q列）などが埋まります。',
    '4) eパケット不可や料金表未整備の場合は FedEx へフォールバックし、セルに注記や色で警告します。',
    '5) O2=1 の場合は Airmail を強制選択します（US宛のみ運用想定）。'
  ].join('\n'));
  row += 2;

  h(row++, '5. メニューの説明（🔁 AI翻訳・価格計算）');
  var menu = [
    ['一括実行', '未翻訳行を一気に処理。J2/L2/M2/N2の重量・サイズを使います。'],
    ['選択行を実行', '選択範囲のみ処理。'],
    ['🛑 処理を停止', '長時間処理の中断。再開は自動トリガー or 手動で。'],
    ['📦 選択行を保存してクリア', '保存シートへコピーし、元の行を値クリア（数式/検証は保持）。'],
    ['🗑️ 選択行のデータのみ削除', '選択行の入力値のみ削除（O/P列の数式は保持）。'],
    ['📋 保存シート一覧', '保存済みの「保存データ_*」シートの容量を一覧表示。'],
    ['⚙️ 初期設定（初回のみ）', 'APIキー、モデル、作業シート名、送料計算方法などを保存。'],
    ['📊 利益額設定シートを開く', '仕入れ値レンジごとの利益額/固定送料を編集（Profit_Amounts）。'],
    ['🚚 送料テーブル設定', 'Shipping_Methods / Shipping_Rates シートを作成/更新（Airmail は I/J 列）。'],
    ['🔍 現在の設定確認', 'プロパティ/主要セル/検証状態をダイアログで表示。'],
    ['🔧 ドロップダウン設定', '重量/サイズ/発送方法の検証（プルダウン）を一括設定。'],
    ['📊 処理状況確認', '未翻訳行/完了率などの進捗を表示。'],
    ['📝 プロンプト編集', 'GPT_Prompts シートの選択IDの本文をサイドバーで編集。']
  ];
  sh.getRange(row,1,menu.length+1,2).setValues([['機能','説明']].concat(menu))
    .setWrap(true);
  sh.getRange(row,1,1,2).setFontWeight('bold').setBackground('#e6f0ff');
  row += menu.length + 2;

  h(row++, '6. よくあるエラーと対処');
  var tips = [
    ['API_TIMEOUT 超過','APIの待ち時間が合計で制限を超過。BATCH_SIZEを下げる/説明文を短くする/再実行してください。'],
    ['送料セルが赤文字（999999）','Shipping_Rates 未入力 or 範囲外。テーブル入力や Q1/Q2/R2/T1/T2 を見直し。'],
    ['eパケット不可','サイズ三辺合計 or 重量が制限超過。FedExへ自動フォールバック（V列が薄赤&注記）。'],
    ['為替が異常値','GOOGLEFINANCE 失敗時は既定145円を自動セット。C2を手入力でもOK。'],
    ['Airmail 帯が効かない','Shipping_Rates の I/J 列に (Max, 料金) の行を設定しているか確認。上から小さい順に。']
  ];
  sh.getRange(row,1,tips.length+1,2).setValues([['症状','対処']].concat(tips)).setWrap(true);
  sh.getRange(row,1,1,2).setFontWeight('bold').setBackground('#fff3cd');
  row += tips.length + 2;

  row = insertAsciiFlowToReadme_(sh, row);

  h(row++, '9. トークン料金見積（参考・暫定）');
  var rateRows = [['Platform/Model','単価(combined, USD/Ktok)']];
  try {
    var ps = CONFIG.RATES.PLATFORMS;
    Object.keys(ps).forEach(function(pl){
      Object.keys(ps[pl].models).forEach(function(m){
        rateRows.push([pl + ' / ' + m, (ps[pl].models[m].combined || 0)]);
      });
    });
  } catch(_) {}
  sh.getRange(row,1,rateRows.length,2).setValues(rateRows);
  sh.getRange(row,1,1,2).setFontWeight('bold').setBackground('#e6f7e9');
  row += rateRows.length + 2;

  sh.setColumnWidths(1, 1, 900);
  sh.setColumnWidths(2, 1, 320);
  sh.setFrozenRows(1);
  sh.getRange(1,1,Math.max(2,row-1),2).setVerticalAlignment('top');
  sh.activate();
}

function openReadme() {
  createOrUpdateReadme_();
  SpreadsheetApp.getUi().alert('README を作成/更新しました。');
}

function exportReadmeToPDF_() {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName('README');
  if (!sh) {
    SpreadsheetApp.getUi().alert('README が見つかりません。先に「READMEを作成/更新」を実行してください。');
    return;
  }

  try {
    sh.setPrintGridlines(false);
    sh.setHiddenGridlines(true);
    sh.setFrozenRows(1);
  } catch (e) {}

  var ui = SpreadsheetApp.getUi();
  var defaultName = 'README_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmm');
  var resp = ui.prompt('PDFファイル名を入力', defaultName, ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var fileName = (resp.getResponseText() || defaultName).replace(/\.[Pp][Dd][Ff]$/, '') + '.pdf';

  var url = ss.getUrl().replace(/edit$/, '') + 'export?' + [
    'format=pdf',
    'size=A4',
    'portrait=true',
    'fitw=true',
    'sheetnames=false',
    'printtitle=false',
    'pagenumbers=false',
    'gridlines=false',
    'fzr=false',
    'top_margin=0.5',
    'bottom_margin=0.5',
    'left_margin=0.5',
    'right_margin=0.5',
    'gid=' + sh.getSheetId()
  ].join('&');

  var token = ScriptApp.getOAuthToken();
  var res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + token } , muteHttpExceptions:true });
  if (res.getResponseCode() !== 200) {
    ui.alert('PDF書き出しエラー', 'HTTP ' + res.getResponseCode() + '\n' + res.getContentText().slice(0,300), ui.ButtonSet.OK);
    return;
  }

  var blob = res.getBlob().setName(fileName);
  var file = DriveApp.createFile(blob);
  ui.alert('PDFを書き出しました', 'ファイル名: ' + file.getName() + '\nURL: ' + file.getUrl(), ui.ButtonSet.OK);
}

function insertAsciiFlowToReadme_(sh, startRow){
  function h(r,t){ sh.getRange(r,1).setValue(t).setFontWeight('bold'); }
  function p(r,t){ sh.getRange(r,1).setValue(t).setFontFamily('Courier New').setWrap(true); }
  var r = startRow;
  h(r++, '8. 図解（処理フローのざっくりイメージ）');
  p(r++, [
    '入力(J/K/I) ──▶ AI生成(M/N) ──▶ 送料判定(V/R) ──▶ 価格計算(Q) ──▶ 保存/クリア',
    '                 ↑                                    ',
    '               プロンプト(GPT_Prompts) と 設定(Properties & 各セル)'
  ].join('\n'));
  return r + 1;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格計算ポップアップ（A/B）- 利益額対応版
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function _getWorkSheetName_() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    return docProps.getProperty('SHEET_NAME') || '作業シート';
  } catch (e) {
    return '作業シート';
  }
}

function getExchangeRateForPopup() {
  var name = _getWorkSheetName_();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  var v = sh ? Number(sh.getRange('C2').getValue()) : NaN;
  return (isNaN(v) || v <= 0) ? 145 : v;
}

function getPayoneerRateForPopup() {
  var name = _getWorkSheetName_();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  var v = sh ? Number(sh.getRange('Z2').getValue()) : NaN;
  return (!isNaN(v) && v >= 0 && v < 1) ? v : 0.02;
}

function getTariffRateForPopup() {
  var name = _getWorkSheetName_();
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  var v = sh ? Number(sh.getRange('AF2').getValue()) : NaN;
  return (!isNaN(v) && v >= 0) ? v : 0;
}

function _volWeightFromDims_(length, width, height, actualWeight) {
  var L = Number(length)||0, W = Number(width)||0, H = Number(height)||0;
  if (L>0 && W>0 && H>0) return Math.max(200, Math.round((L*W*H)/5));
  return Number(actualWeight)||0;
}

function _resolveShippingJPY_(mode, args) {
  if (mode === 'manual') return Number(args.shippingYen)||0;

  var costYen = Number(args.costYen)||0;
  var w   = Number(args.weight)||0;
  var L   = Number(args.length)||0;
  var W   = Number(args.width)||0;
  var H   = Number(args.height)||0;
  var vol = _volWeightFromDims_(L,W,H,w);
  var sizeStr = (L>0&&W>0&&H>0) ? [L,W,H].join('x') : '';
  var method  = String(args.method||'自動選択');

  var yen = SHIPPING_COST(costYen, w, vol, method, sizeStr);
  if (Number(yen) >= 999000) throw new Error('送料計算エラー/レート未定義（Shipping_Ratesや入力値を確認）');
  return Number(yen)||0;
}

function calcPriceFromMargin(payload) {
  var ex   = getExchangeRateForPopup();
  var cost = Number(payload.costYen)||0;
  var ebay = (Number(payload.ebayFeePct)||18)/100;
  var ad   = (Number(payload.adFeePct)||5)/100;
  var payo = getPayoneerRateForPopup();
  var customsFee = Number(payload.customsFeeUSD)||10;
  var tariffRate = (Number(payload.tariffRatePct)||15)/100;
  var safetyFactor = Number(payload.safetyFactor)||1.35;
  
  var profitMode = payload.profitMode || 'rate';

  var shipping = _resolveShippingJPY_(payload.shippingMode, {
    shippingYen: payload.shippingYen,
    costYen: cost,
    weight: payload.weight,
    length: payload.length,
    width:  payload.width,
    height: payload.height,
    method: payload.method
  });

  var priceUSD, profitJPY;

  if (profitMode === 'amount') {
    // ★利益額モード：指定された利益額から販売価格を逆算
    var targetProfitYen = Number(payload.profitAmountYen) || 0;
    
    // 必要な手取り = 仕入れ + 送料 + 利益
    var requiredNetJPY = cost + shipping + targetProfitYen;
    
    // ✅ 合算方式に修正
    var feeMultiplier = 1 - (ebay + ad + payo);
    if (feeMultiplier <= 0) throw new Error('手数料の合計が大きすぎます。');
    
    var revenueJPY = requiredNetJPY / feeMultiplier;
    priceUSD = revenueJPY / ex;
    profitJPY = targetProfitYen;
    
  } else {
    // ★利益率モード：従来の計算
    var prof = (Number(payload.profitRatePct)||0)/100;
    
    // ✅ 合算方式に修正
    var denom = 1 - (ebay + ad + payo + prof);
    if (denom <= 0) throw new Error('率の合計が大きすぎます（分母<=0）。手数料/利益率を下げてください。');

    priceUSD = ((cost + shipping) / denom) / ex;
    
    // 収益計算
    var revenueJPY = priceUSD * ex;
    
    // ✅ 合算方式に修正
    var netJPY = revenueJPY * (1 - (ebay + ad + payo));
    profitJPY = Math.round(netJPY - (cost + shipping));
  }

  // 関税計算：販売価格ベース
  var baseAmount = priceUSD + customsFee;
  var tariffUSD = baseAmount * tariffRate * safetyFactor;
  var taxIncludedPriceUSD = priceUSD + tariffUSD;
  
  return {
    ok: true,
    exchange: ex,
    shippingYen: shipping,
    priceUSD: Number(priceUSD.toFixed(2)),
    taxIncludedPriceUSD: Number(taxIncludedPriceUSD.toFixed(2)),
    tariffUSD: Number(tariffUSD.toFixed(2)),
    profitYen: Math.round(profitJPY)
  };
}

function calcBreakEvenFromSelling(payload) {
  var ex   = getExchangeRateForPopup();
  var usd  = Number(payload.targetPriceUSD)||0;
  if (usd <= 0) throw new Error('販売価格(USD)を入力してください。');

  var ebay = (Number(payload.ebayFeePct)||18)/100;
  var ad   = (Number(payload.adFeePct)||5)/100;
  var payo = getPayoneerRateForPopup();
  var customsFee = Number(payload.customsFeeUSD)||10;
  var tariffRate = (Number(payload.tariffRatePct)||15)/100;
  var safetyFactor = Number(payload.safetyFactor)||1.35;
  
  var profitMode = payload.profitMode || 'rate';

  var shipping = _resolveShippingJPY_(payload.shippingMode, {
    shippingYen: payload.shippingYen,
    costYen: 0,
    weight: payload.weight,
    length: payload.length,
    width:  payload.width,
    height: payload.height,
    method: payload.method || 'ePacket'
  });

  // 目標販売価格から商品本体価格を逆算
  var basePrice = (usd - customsFee) / (1 + tariffRate * safetyFactor);
  var tariffUSD = basePrice * tariffRate * safetyFactor;
  
  // 商品本体価格に対して手数料を計算
  var revenueJPY = basePrice * ex;
  
  // ✅ 合算方式に修正
  var takeJPY = revenueJPY * (1 - (ebay + ad + payo));
  
  var breakEvenJPY = Math.round(takeJPY - shipping);
  var maxCostForWant, wantDisplay;

  if (profitMode === 'amount') {
    // ★利益額モード：指定された利益額を確保できる最大仕入値
    var targetProfitYen = Number(payload.wantProfitAmountYen) || 0;
    maxCostForWant = Math.round(takeJPY - shipping - targetProfitYen);
    wantDisplay = '¥' + targetProfitYen.toLocaleString() + '利益';
    
  } else {
    // ★利益率モード：従来の計算
    var want = (Number(payload.wantProfitRatePct)||0)/100;
    maxCostForWant = Math.round((takeJPY * (1 - want)) - shipping);
    wantDisplay = Number((want*100).toFixed(2)) + '%';
  }

  return {
    ok: true,
    exchange: ex,
    shippingYen: shipping,
    basePriceUSD: Number(basePrice.toFixed(2)),
    tariffUSD: Number(tariffUSD.toFixed(2)),
    customsFeeUSD: customsFee,
    targetPriceUSD: usd,
    breakEvenJPY: breakEvenJPY,
    maxCostForWantJPY: maxCostForWant,
    wantRatePct: wantDisplay  // 表示用（率または額）
  };
}

function showPriceCalc() {
  var html = HtmlService.createHtmlOutput(HTML_TEMPLATES['PriceCalc'])
    .setWidth(1200).setHeight(900);
  SpreadsheetApp.getUi().showModalDialog(html, '💲 EC価格計算ツール');
}

function addPriceCalcStandaloneMenu_() {
  try {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('💲 価格計算')
      .addItem('価格計算ツール', 'showPriceCalc')
      .addToUi();
  } catch (e) {
    // UI無い環境では無視
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  簡易版メニュー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function addSimpleModeMenu_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("⚡ 簡易版")
      .addItem("　✅簡易版：選択行を実行　", "runSimpleSelected")
      .addSeparator()
      .addItem("簡易版：選択行を保存してクリア", "simpleSaveSelectedRowsAndClear")
      .addItem("簡易版：選択行のデータのみ削除", "simpleClearSelectedRowsOnly")
      .addSeparator()
      .addItem("簡易版 初期設定（APIキーのみ）", "openSimpleSetup")
      .addToUi();
  } catch (e) {}
}

function getSimpleExecSettings_() {
  var apiKey = getSimpleApiKey_();
  if (!apiKey) throw new Error('簡易版APIキーが未設定です。「⚡ 簡易版→簡易版 初期設定」で保存してください。');
  var sheetName = (PropertiesService.getDocumentProperties().getProperty('SHEET_NAME')) || '作業シート';
  return {
    platform: 'openai',
    model: 'gpt-5-nano',
    apiKey: apiKey,
    sheetName: sheetName,
    promptId: 'EBAY_FULL_LISTING_PROMPT'
  };
}

function createAIPromptSimple_(fullText) {
  var tmpl = getPromptContent('EBAY_FULL_LISTING_PROMPT');
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
    
    // プロンプトの末尾に追加
    tmpl = tmpl + additionalInstructions;
  }
  
  return tmpl.replace('${fullText}', fullText);
}

// 【修正版】
function getSimpleProfitAndShipping_(costYen) {
  var profitAmount = 0;
  var fixedShipping = 0;
  
  try {
    // 作業シートのH1とJ1を優先的にチェック
    var sheetName = _getWorkSheetName_();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    
    if (sheet) {
      // H1（利益額）をチェック
      var h1Value = sheet.getRange('H1').getValue();
      if (typeof h1Value === 'number' && !isNaN(h1Value) && h1Value > 0) {
        profitAmount = h1Value;
      } else {
        // H1が未設定の場合はProfit_Amountsシートから取得
        profitAmount = getProfitAmountByCost(costYen) || 0;
      }
      
      // J1（送料）をチェック
      var j1Value = sheet.getRange('J1').getValue();
      if (typeof j1Value === 'number' && !isNaN(j1Value) && j1Value > 0) {
        fixedShipping = j1Value;
      } else {
        // J1が未設定の場合はProfit_Amountsシートから取得
        fixedShipping = getShippingCostByCost(costYen) || 0;
      }
    } else {
      // シートが見つからない場合はProfit_Amountsシートから取得
      profitAmount = getProfitAmountByCost(costYen) || 0;
      fixedShipping = getShippingCostByCost(costYen) || 0;
    }
    
  } catch (e) {
    // エラー時はProfit_Amountsシートから取得（フォールバック）
    profitAmount = getProfitAmountByCost(costYen) || 0;
    fixedShipping = getShippingCostByCost(costYen) || 0;
  }
  
  return { 
    profitAmount: profitAmount, 
    fixedShipping: fixedShipping 
  };
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  更新版：簡易版の価格表示モード対応
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/** 簡易版用のFormulas設定（価格表示モード対応） */
function setFormulasSimple_(sheet, row, profitAmount, fixedShipping) {
  var feeRate = sheet.getRange("F1").getValue() || 0;
  var adRate  = sheet.getRange("F2").getValue() || 0;

  sheet.getRange(row, CONFIG.COLUMNS.RATE).clearContent();
  sheet.getRange(row, CONFIG.COLUMNS.PROFIT).setValue(profitAmount);
  sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setValue(fixedShipping);
  sheet.getRange(row, CONFIG.COLUMNS.FEE).setValue(feeRate);

  // ✅ 合算方式に修正
  sheet.getRange(row, CONFIG.COLUMNS.PRICE).setFormula(
    '=ROUND(((I' + row + '+T' + row + '+U' + row + ')/(1-(V' + row + '+$F$2+$Z$2))/$C$2)*100)/100'
  );

  // ★★★ ここを修正 ★★★
  // 想定関税（通関手数料込み）
  sheet.getRange(row, CONFIG.COLUMNS.ESTIMATED_TAX).setFormula(
    '=ROUND(R' + row + '*$AD$2*$AE$2+$AC$1,2)'
  );

  // 関税込み価格（DDU + 想定関税のみ）
  sheet.getRange(row, CONFIG.COLUMNS.TAX_INCLUDED_PRICE).setFormula(
    '=ROUND(R' + row + '+AB' + row + ',2)'
  );
  // ★★★ 修正ここまで ★★★

  setPriceCellHighlight(sheet, row);
  updateListingSheetPrice(row);
}


/** 更新版：簡易版1行処理（価格表示モード対応） */
function processRowSimple_(sheet, row, simple) {
  var jpTitle = sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).getValue();  // 10（変更なし）
  var jpDesc  = sheet.getRange(row, CONFIG.COLUMNS.JP_DESC).getValue();   // 11（変更なし）
  var cost    = Number(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());  // 9（変更なし）
  if (!jpTitle || !jpDesc || !cost) return { success:false, skip:true, error:'必要入力不足' };

  var fullText = 'Japanese Title: ' + jpTitle + '\nJapanese Description: ' + jpDesc;
  var prompt = createAIPromptSimple_(fullText);
  var ai = callOpenAI(prompt, { apiKey: simple.apiKey, model: simple.model });
  var data = ai;

  var ps = getSimpleProfitAndShipping_(cost);
  var profitAmt = ps.profitAmount;
  var fixedShip = ps.fixedShipping;

  setCellValues(sheet, row, {
    weight: '',
    size: '',
    method: '（簡易版：固定送料）',
    title: data.title || '',
    description: data.description || '',
    condition: data.condition || '',           // 28→29
    ebayCategory: data.ebayCategory || ''      // 29→30
  });

  setFormulasSimple_(sheet, row, profitAmt, fixedShip);
  setHighlight(sheet, row, data.description || '');

  return {
    success: true,
    tokens_prompt: (data.usage && data.usage.prompt_tokens) || 0,
    tokens_completion: (data.usage && data.usage.completion_tokens) || 0,
    model_used: data.model_used || simple.model
  };
}

/** 簡易版用：選択行実行（更新版） */
function runSimpleSelected() {
  var start = new Date();
  var totals = { prompt:0, completion:0, ok:0, err:0 };

  try {
    var simple = getSimpleExecSettings_();
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(simple.sheetName);
    if (!sheet) { showAlert('シート「' + simple.sheetName + '」が見つかりません。', 'error'); return; }

    var range = sheet.getActiveRange();
    if (!range) { showAlert('選択範囲がありません。', 'info'); return; }
    var s = Math.max(5, range.getRow());
    var e = range.getLastRow();
    var rows = [];
    for (var i=s;i<=e;i++) {
    var jpTitle = sheet.getRange(i, CONFIG.COLUMNS.JP_TITLE).getValue();  // 10（変更なし）
    var jpDesc  = sheet.getRange(i, CONFIG.COLUMNS.JP_DESC).getValue();   // 11（変更なし）
    var cost    = Number(sheet.getRange(i, CONFIG.COLUMNS.COST_YEN).getValue());  // 9（変更なし）
    var enTitle = sheet.getRange(i, CONFIG.COLUMNS.EN_TITLE).getValue();  // 13（変更なし）
    var enDesc  = sheet.getRange(i, CONFIG.COLUMNS.EN_DESC).getValue();   // 14（変更なし）
    if (jpTitle && jpDesc && cost>0 && (!enTitle || !enDesc)) rows.push(i);
  }
    if (rows.length === 0) { showAlert('選択範囲に処理対象がありません。', 'info'); return; }

    // 価格表示モードを取得
    var priceMode = getPriceDisplayMode();
    var priceModeText = (priceMode === 'TAX_INCLUDED') ? '関税込み価格' : '販売価格（通常）';

    for (var k=0;k<rows.length;k++) {
      var r = processRowSimple_(sheet, rows[k], simple);
      if (r.success) {
        totals.ok++; totals.prompt += r.tokens_prompt; totals.completion += r.tokens_completion;
      } else {
        totals.err++;
      }
      Utilities.sleep(500);
    }

    var usd = calculateTokenCostUSD('openai', simple.model, totals.prompt, totals.completion);
    var rate = sheet.getRange("C2").getValue() || 145;
    showAlert(
      '✅ 簡易版（選択行）：処理完了\n\n' +
      '処理件数: ' + totals.ok + ' / エラー: ' + totals.err + '\n' +
      '価格表示モード: ' + priceModeText + '\n' +
      '入力tokens: ' + totals.prompt.toLocaleString() + ' / 出力tokens: ' + totals.completion.toLocaleString() + '\n' +
      '推定費用: $' + usd.toFixed(4) + '（約' + Math.round(usd * rate) + '円, ' + simple.model + '）',
      'success'
    );
  } catch (e) {
    showAlert('簡易版 選択行エラー: ' + e.message, 'error');
  }
}

function simpleSaveSelectedRowsAndClear() { saveSelectedRowsAndClear(); }
function simpleClearSelectedRowsOnly()    { clearSelectedRowsOnly(); }

function openSimpleSetup() {
  try {
    var tmpl;
    try {
      // まず .html ファイルを探す（ユーザーシート用）
      tmpl = HtmlService.createTemplateFromFile('SimpleSetup');
    } catch (_) {
      // なければ HtmlTemplates.gs から取得（ライブラリ用）
      try {
        var htmlContent = getHtmlTemplate('SimpleSetup');
        if (htmlContent) {
          tmpl = HtmlService.createTemplate(htmlContent);
        }
      } catch (_) {
        tmpl = null;
      }
    }
    if (!tmpl) {
      var ui = SpreadsheetApp.getUi();
      var resp = ui.prompt('簡易版 初期設定', 'OpenAI APIキーを入力してください（保存はユーザーごと）', ui.ButtonSet.OK_CANCEL);
      if (resp.getSelectedButton() !== ui.Button.OK) return;
      var key = (resp.getResponseText() || '').trim();
      if (!key) { showAlert('APIキーが空です。', 'error'); return; }
      saveSimpleApiKey_(key);
      showAlert('✅ 簡易版APIキーを保存しました。', 'success');
      return;
    }
    tmpl.currentApiKey = getSimpleApiKey_() || '';
    var html = tmpl.evaluate().setWidth(420).setHeight(260);
    SpreadsheetApp.getUi().showModalDialog(html, '🔑 簡易版 初期設定（APIキーのみ）');
  } catch (e) {
    showAlert('簡易版 初期設定の表示に失敗: ' + e.message, 'error');
  }
}

function saveSimpleApiKey_(apiKey) {
  var docProps = PropertiesService.getDocumentProperties();
  if (!apiKey || !apiKey.trim()) throw new Error('APIキーが空です。');
  docProps.setProperty('SIMPLE_OPENAI_API_KEY', apiKey.trim());
}

function getSimpleApiKey_() {
  return PropertiesService.getDocumentProperties().getProperty('SIMPLE_OPENAI_API_KEY') || '';
}

function saveSimpleSettings(apiKey) {
  try {
    saveSimpleApiKey_(apiKey);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function getSimpleSettings() {
  return {
    apiKey: getSimpleApiKey_(),
    platform: 'openai',
    model: 'gpt-5-nano',
    promptId: 'EBAY_FULL_LISTING_PROMPT'
  };
}

/**
 * テンプレート名生成のデバッグテスト
 */
function debugTemplateNameGeneration() {
  try {
    var testCases = [
      { name: 'トレカGraded', condition: '新品', shipping: 'エコノミー' },
      { name: 'トレカGraded', condition: '中古', shipping: 'EX' },
      { name: '一般汎用', condition: '新品', shipping: 'エコノミー' },
      { name: 'ゲーム・本', condition: '中古', shipping: 'EX' },
      { name: '時計', condition: '新品', shipping: 'EX' }
    ];
    
    var report = '【テンプレート名生成テスト】\n\n';
    
    for (var i = 0; i < testCases.length; i++) {
      var tc = testCases[i];
      var standardName = generateNewTemplateName(tc.name, tc.condition, tc.shipping);
      
      report += '入力: ' + tc.name + ' / ' + tc.condition + ' / ' + tc.shipping + '\n';
      report += '出力: ' + standardName + '\n';
      
      // Policy_Masterで検索
      if (standardName) {
        var templateId = findTemplateId(standardName);
        report += '結果: ' + (templateId !== null ? 'ID=' + templateId : '見つからない') + '\n';
      } else {
        report += '結果: 生成失敗\n';
      }
      report += '\n';
    }
    
    // Policy_Masterに実際に登録されているテンプレート名も表示
    report += '━━━━━━━━━━━━━━━━━━━━\n';
    report += '【Policy_Masterの登録内容】\n\n';
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Policy_Master');
    if (sheet) {
      var data = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
      var inTemplateSection = false;
      var count = 0;
      
      for (var j = 0; j < data.length; j++) {
        if (String(data[j][0]).indexOf('【Templates】') !== -1) {
          inTemplateSection = true;
          continue;
        }
        if (String(data[j][0]).indexOf('【Shipping') !== -1) {
          break;
        }
        if (inTemplateSection && data[j][1]) {
          count++;
          report += 'ID ' + data[j][0] + ': ' + data[j][1] + '\n';
          if (count >= 10) {
            report += '... (残り省略)\n';
            break;
          }
        }
      }
    }
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('テストエラー: ' + e.message, 'error');
  }
}

/**
 * 作業シートの指定行にテンプレート値を設定（4次元対応版）
 * @param {Sheet} sheet - 作業シート
 * @param {number} row - 行番号
 */
function setTemplateToWorkSheet(sheet, row) {
  try {
    var maxRetries = 3;
    var retryDelay = 200;
    
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      var selectedCategory = getSavedCategory();
      if (!selectedCategory) {
        console.log('行' + row + ': 保存されたカテゴリーが見つかりません');
        return false;
      }
      
      // ⚠️ 列参照の修正
      var priceUSD = Number(sheet.getRange(row, CONFIG.COLUMNS.PRICE).getValue());  // 17→18
      var condition = String(sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue() || '').trim();  // 28→29
      var shippingMethod = String(sheet.getRange(row, CONFIG.COLUMNS.METHOD).getValue() || '').trim();  // 23→24
      var shippingType = convertShippingMethodToType(shippingMethod);
      
      console.log('テンプレート設定試行 ' + attempt + '/3: 行' + row + ', カテゴリ=' + selectedCategory + ', 状態=' + condition + ', 配送=' + shippingType + ', 価格=' + priceUSD);
      
      if (isNaN(priceUSD) || priceUSD <= 0) {
        if (attempt < maxRetries) {
          console.log('行' + row + ': 価格がまだ計算中です。' + retryDelay + 'ms待機後に再試行...');
          Utilities.sleep(retryDelay);
          SpreadsheetApp.flush();
          continue;
        } else {
          console.log('行' + row + ': 価格が無効です (' + priceUSD + ')');
          sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
          return false;
        }
      }
      
      if (!condition || !['新品', '中古'].includes(condition)) {
        console.log('行' + row + ': 商品状態が無効です (' + condition + ')');
        sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
        return false;
      }
      
      if (shippingType === 'エラー') {
        console.log('行' + row + ': 配送方法が無効です (' + shippingMethod + ')');
        sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
        return false;
      }

      var templateValue = getTemplateFromReferenceData4D(selectedCategory, condition, shippingType, priceUSD);
      
      if (templateValue !== null) {
        sheet.getRange(row, 5).setValue(templateValue);  // E列（変更なし）
        console.log('行' + row + ': テンプレート値 ' + templateValue + ' を設定しました（試行' + attempt + '回目で成功）');
        return true;
      } else {
        console.log('行' + row + ': 該当するテンプレートが見つかりませんでした');
        sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
        return false;
      }
    }
    
    console.log('行' + row + ': ' + maxRetries + '回試行しましたが、価格が確定しませんでした');
    sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
    return false;

  } catch (error) {
    console.error('行' + row + 'のテンプレート設定エラー: ' + error.message);
    sheet.getRange(row, 5).setValue('エラー');  // E列（変更なし）
    return false;
  }
}

/**
 * 参照データシートの内容をデバッグ確認
 */
function debugReferenceDataSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) {
      showAlert('参照データシートが見つかりません', 'error');
      return;
    }

    var lastRow = refSheet.getLastRow();
    if (lastRow < 2) {
      showAlert('参照データシートにデータがありません', 'info');
      return;
    }

    var report = '参照データシート内容確認:\n\n';
    
    // ヘッダー確認
    var headers = [];
    for (var col = 10; col <= 16; col++) { // J列からP列
      headers.push(refSheet.getRange(1, col).getValue());
    }
    report += 'ヘッダー: ' + headers.join(' | ') + '\n\n';
    
    // データ確認（最大10行まで表示）
    var maxDisplay = Math.min(lastRow, 11); // 2-11行目（最大10行）
    for (var row = 2; row <= maxDisplay; row++) {
      var rowData = [];
      for (var col = 10; col <= 16; col++) { // J列からP列
        rowData.push(refSheet.getRange(row, col).getValue());
      }
      report += '行' + row + ': ' + rowData.join(' | ') + '\n';
    }
    
    if (lastRow > 11) {
      report += '\n... (残り' + (lastRow - 11) + '行)\n';
    }
    
    // 「その他」「新品」の組み合わせを検索
    report += '\n【その他＋新品の組み合わせ検索】\n';
    var found = false;
    for (var row = 2; row <= lastRow; row++) {
      var category = String(refSheet.getRange(row, 12).getValue() || '').trim(); // L列
      var condition = String(refSheet.getRange(row, 13).getValue() || '').trim(); // M列
      var shipping = String(refSheet.getRange(row, 14).getValue() || '').trim();  // N列
      
      if (category === 'その他' && condition === '新品') {
        var templateId = refSheet.getRange(row, 10).getValue(); // J列
        var minPrice = refSheet.getRange(row, 15).getValue();   // O列
        var maxPrice = refSheet.getRange(row, 16).getValue();   // P列
        report += '行' + row + ': テンプレート' + templateId + ', 配送=' + shipping + ', 価格=' + minPrice + '-' + maxPrice + '\n';
        found = true;
      }
    }
    
    if (!found) {
      report += '「その他」「新品」の組み合わせは見つかりませんでした。\n';
    }
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('デバッグエラー: ' + error.message, 'error');
  }
}

/**
 * 参照データシートの基本構造を作成（サンプルデータ付き）
 */
function createReferenceDataSample() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    
    if (!refSheet) {
      refSheet = ss.insertSheet('参照データ');
    } else {
      // 既存シートをクリア
      refSheet.clear();
    }
    
    // ヘッダー設定（A列からR列まで）
    var headers = [
      '', '', '', '', '', '', '', '', '', 
      '新品テンプレート', '新品説明', '新品最低価格', '新品最高価格', 
      '', '中古テンプレート', '中古説明', '中古最低価格', '中古最高価格'
    ];
    
    refSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // ヘッダーの書式設定
    refSheet.getRange(1, 10, 1, 4).setFontWeight('bold').setBackground('#c6efce'); // 新品部分（緑）
    refSheet.getRange(1, 15, 1, 4).setFontWeight('bold').setBackground('#fce4d6'); // 中古部分（オレンジ）
    
    // サンプルデータ（あなたの例に合わせて設定）
    var sampleData = [
      ['', '', '', '', '', '', '', '', '', 
       1, '低価格新品テンプレート', 0, 20, 
       '', 288, '低価格中古テンプレート', 40.01, 50],
      ['', '', '', '', '', '', '', '', '', 
       2, '中価格新品テンプレート', 20.01, 50, 
       '', 289, '中価格中古テンプレート', 50.01, 80],
      ['', '', '', '', '', '', '', '', '', 
       3, '高価格新品テンプレート', 50.01, 100, 
       '', 290, '高価格中古テンプレート', 80.01, 120]
    ];
    
    refSheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
    
    // 列幅調整
    refSheet.setColumnWidth(10, 130); // J列（新品テンプレート）
    refSheet.setColumnWidth(11, 150); // K列（新品説明）
    refSheet.setColumnWidth(12, 100); // L列（新品最低価格）
    refSheet.setColumnWidth(13, 100); // M列（新品最高価格）
    refSheet.setColumnWidth(15, 130); // O列（中古テンプレート）
    refSheet.setColumnWidth(16, 150); // P列（中古説明）
    refSheet.setColumnWidth(17, 100); // Q列（中古最低価格）
    refSheet.setColumnWidth(18, 100); // R列（中古最高価格）
    
    // 説明用のコメントを追加
    refSheet.getRange('J1').setNote('新品商品のテンプレート番号を入力');
    refSheet.getRange('L1').setNote('新品価格の最低値（USD）');
    refSheet.getRange('M1').setNote('新品価格の最高値（USD）');
    refSheet.getRange('O1').setNote('中古商品のテンプレート番号を入力');
    refSheet.getRange('Q1').setNote('中古価格の最低値（USD）');
    refSheet.getRange('R1').setNote('中古価格の最高値（USD）');
    
    showAlert('参照データシートを作成しました。\n\n【構造説明】\nJ列: 新品テンプレート値\nL-M列: 新品価格範囲（USD）\nO列: 中古テンプレート値\nQ-R列: 中古価格範囲（USD）\n\n作成例：\n・新品20ドル → テンプレート1\n・中古50ドル → テンプレート288', 'success');
    
    // 参照データシートを表示
    ss.setActiveSheet(refSheet);
    
  } catch (error) {
    showAlert('参照データシート作成エラー: ' + error.message, 'error');
  }
}


/**
 * 作業シート全体のテンプレート値を一括更新
 */
function updateAllTemplates() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;

    var lastRow = sheet.getLastRow();
    if (lastRow < 5) {
      showAlert('処理対象のデータがありません（5行目以降）。', 'info');
      return;
    }

    var ui = SpreadsheetApp.getUi();
    var ok = ui.alert('全行テンプレート更新確認',
      '作業シート「' + settings.sheetName + '」の5行目以降の全データに対して、\n' +
      '価格（Q列）と商品状態（AB列）からテンプレート値（E列）を設定します。\n\n' +
      '既存のE列の値は上書きされます。続行しますか？',
      ui.ButtonSet.YES_NO);
    
    if (ok !== ui.Button.YES) {
      showAlert('キャンセルしました。', 'info');
      return;
    }

    var updatedCount = 0;
    var errorCount = 0;
    var skippedCount = 0;

    for (var row = 5; row <= lastRow; row++) {
      try {
        // 価格と商品状態があるかチェック
        var priceUSD = Number(sheet.getRange(row, CONFIG.COLUMNS.PRICE).getValue());
        var condition = String(sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue() || '').trim();
        
        if (isNaN(priceUSD) || priceUSD <= 0) {
          skippedCount++;
          continue;
        }
        
        if (!condition || !['新品', '中古'].includes(condition)) {
          skippedCount++;
          continue;
        }

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

    var report = '全行テンプレート更新完了:\n\n' +
      '対象シート: 「' + settings.sheetName + '」\n' +
      '処理範囲: 5～' + lastRow + '行\n' +
      '更新成功: ' + updatedCount + '行\n' +
      '更新失敗: ' + errorCount + '行\n' +
      'スキップ: ' + skippedCount + '行\n\n' +
      'スキップ理由: 価格未入力・商品状態未入力・該当テンプレート未発見';

    showAlert(report, updatedCount > 0 ? 'success' : 'warning');

  } catch (error) {
    showAlert('全行テンプレート更新エラー: ' + error.message, 'error');
  }
}

/**
 * 価格計算式のデバッグ機能
 */
function debugPriceCalculation() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;
    
    var testRow = 5;
    
    // ⚠️ 各セルの値を取得（列番号変更）
    var costYen = Number(sheet.getRange(testRow, CONFIG.COLUMNS.COST_YEN).getValue()) || 0;  // 9（変更なし）
    var shipping = Number(sheet.getRange(testRow, CONFIG.COLUMNS.SHIPPING).getValue()) || 0;  // 19→20
    var feeRate = Number(sheet.getRange("F1").getValue()) || 0;  // 変更なし
    var adRate = Number(sheet.getRange("F2").getValue()) || 0;  // 変更なし
    var profitRate = Number(sheet.getRange(testRow, CONFIG.COLUMNS.RATE).getValue()) || 0;  // 22→23
    var payoneerRate = Number(sheet.getRange("V2").getValue()) || 0.02;  // U2→V2
    var exchangeRate = Number(sheet.getRange("C2").getValue()) || 145;  // 変更なし
    var currentPrice = Number(sheet.getRange(testRow, CONFIG.COLUMNS.PRICE).getValue()) || 0;  // 17→18
    
    // 現在の数式を取得
    var priceFormula = sheet.getRange(testRow, CONFIG.COLUMNS.PRICE).getFormula();  // 17→18
    
    // 手動計算（VAT除去後の計算式）
    var numerator = costYen + shipping;
    var denominator = (1 - feeRate) * (1 - profitRate) * (1 - adRate) * (1 - payoneerRate);
    var calculatedPrice = numerator / denominator / exchangeRate;
    
    var report = '価格計算デバッグ情報:\n\n' +
      '【入力値】\n' +
      '仕入れ値(I列): ¥' + costYen.toLocaleString() + '\n' +
      '送料(S列): ¥' + shipping.toLocaleString() + '\n' +
      '手数料率(F1): ' + (feeRate * 100).toFixed(1) + '%\n' +
      '広告費率(F2): ' + (adRate * 100).toFixed(1) + '%\n' +
      '利益率(V列): ' + (profitRate * 100).toFixed(1) + '%\n' +
      'ペイオニア率(Y2): ' + (payoneerRate * 100).toFixed(1) + '%\n' +
      '為替レート(C2): ¥' + exchangeRate + '\n\n' +
      
      '【計算過程】\n' +
      '分子: ¥' + numerator.toLocaleString() + ' (仕入れ値+送料)\n' +
      '分母: ' + denominator.toFixed(4) + ' (手数料・利益率等を考慮)\n' +
      '計算結果: $' + calculatedPrice.toFixed(2) + '\n\n' +
      
      '【結果】\n' +
      '現在のシート値: $' + currentPrice + '\n' +
      '手動計算値: $' + calculatedPrice.toFixed(2) + '\n' +
      '差異: $' + (currentPrice - calculatedPrice).toFixed(2) + '\n\n' +
      
      '【使用中の数式】\n' + priceFormula;
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('価格計算デバッグエラー: ' + error.message, 'error');
  }
}

function fixPriceFormula() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;
    
    var testRow = 5;
    
    var currentFormula = sheet.getRange(testRow, CONFIG.COLUMNS.PRICE).getFormula();  // 17→18
    
    // ✅ 合算方式に修正
    var newFormula = '=ROUND(((I' + testRow + '+T' + testRow + ')/(1-(V' + testRow + '+W' + testRow + '+$F$2+$Z$2))/$C$2)*100)/100';
    // I列: 変更なし
    // S→T（送料）
    // U→V（手数料率）
    // V→W（利益率）
    // Y2→Z2（Payoneer率）
    
    var report = '価格計算式の比較:\n\n' +
      '【現在の式】\n' + currentFormula + '\n\n' +
      '【修正案（合算方式）】\n' + newFormula + '\n\n' +
      '修正点:\n' +
      '- 順次控除方式 → 合算方式に変更\n' +
      '- すべての率を販売額に対する率として計算\n' +
      '- 計算式: (原価+送料) ÷ (1-(手数料率+利益率+広告率+Payoneer率))\n\n' +
      '修正版を適用しますか？';
    
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert('価格計算式の修正', report, ui.ButtonSet.YES_NO);
    
    if (response === ui.Button.YES) {
      sheet.getRange(testRow, CONFIG.COLUMNS.PRICE).setFormula(newFormula);  // 17→18
      showAlert('修正版の数式を適用しました。結果を確認してください。', 'success');
    }
    
  } catch (error) {
    showAlert('価格計算式修正エラー: ' + error.message, 'error');
  }
}


/**
 * 設定保存のテスト（eLogistics選択をシミュレート）
 */
function testElogisticsSaveSettings() {
  try {
    // 現在の設定を保存
    var docProps = PropertiesService.getDocumentProperties();
    var backup = {
      highPrice: docProps.getProperty('HIGH_PRICE_SHIPPING_METHOD'),
      threshold: docProps.getProperty('SHIPPING_THRESHOLD')
    };

    // テスト用のformDataを作成
    var testFormData = {
      platform: 'openai',
      apiKey: 'test-key-' + Math.random(),
      model: 'gpt-4o-mini',
      sheetName: '作業シート',
      profitMethod: 'RATE',
      promptId: 'EBAY_FULL_LISTING_PROMPT',
      shippingThreshold: '20000',
      shippingCalcMethod: 'TABLE',
      lowPriceMethod: 'EP',
      highPriceMethod: 'EL' // ← eLogisticsをテスト
    };

    // saveSettings関数を呼び出し
    var result = saveSettings(testFormData);

    // 結果確認
    var savedHighPrice = docProps.getProperty('HIGH_PRICE_SHIPPING_METHOD');

    var report = 'saveSettings テスト結果:\n\n' +
      '実行結果: ' + (result.success ? '✅ 成功' : '❌ 失敗') + '\n' +
      '保存された高価格配送方法: ' + savedHighPrice + '\n';

    if (result.success && savedHighPrice === 'EL') {
      report += '\n✅ eLogisticsの保存処理は正常です。';
    } else {
      report += '\n❌ 保存処理に問題があります。';
      if (!result.success) {
        report += '\nエラー: ' + result.error;
      }
    }

    // 元の設定に復元
    if (backup.highPrice) {
      docProps.setProperty('HIGH_PRICE_SHIPPING_METHOD', backup.highPrice);
    } else {
      docProps.deleteProperty('HIGH_PRICE_SHIPPING_METHOD');
    }
    if (backup.threshold) {
      docProps.setProperty('SHIPPING_THRESHOLD', backup.threshold);
    }

    showAlert(report, result.success ? 'success' : 'error');

  } catch (e) {
    showAlert('saveSettingsテストエラー: ' + e.message, 'error');
  }
}


// 送料テーブルの重量帯を修正する関数
function fixShippingTableWeightRanges() {
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '送料テーブル重量帯修正',
      '重量帯の範囲を正しい値に修正します。\n既存の重量範囲（A/B列）のみを修正し、料金データは保持します。\n続行しますか？',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) return;
    
    var ratesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shipping_Rates');
    if (!ratesSheet) {
      showAlert('Shipping_Ratesシートが見つかりません', 'error');
      return;
    }
    
    // 正しい重量帯データ
    var correctRanges = [
      [1, 100], [101, 200], [201, 300], [301, 400], [401, 500],
      [501, 600], [601, 700], [701, 800], [801, 900], [901, 1000],
      [1001, 1100], [1101, 1200], [1201, 1300], [1301, 1400], [1401, 1500],
      [1501, 1600], [1601, 1700], [1701, 1800], [1801, 1900], [1901, 2000],
      [2001, 2500], [2501, 3000], [3001, 3500], [3501, 4000], [4001, 4500],
      [4501, 5000], [5001, 6000], [6001, 7000], [7001, 8000], [8001, 9000],
      [9001, 10000], [10001, 15000], [15001, 20000], [20001, 30000]
    ];
    
    // A/B列のみを修正
    for (var i = 0; i < correctRanges.length; i++) {
      var row = i + 3; // 3行目から開始
      ratesSheet.getRange(row, 1).setValue(correctRanges[i][0]); // A列
      ratesSheet.getRange(row, 2).setValue(correctRanges[i][1]); // B列
    }
    
    showAlert('重量帯の修正が完了しました。\n「送料テーブル デバッグ」で確認してください。', 'success');
    
  } catch (error) {
    showAlert('修正エラー: ' + error.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Q1/Q2セル用 送料計算機能
  - Q1: 配送方法選択ドロップダウン
  - Q2: 選択された方法での送料計算結果表示
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * Q1/Q2セルの送料計算機能をセットアップ
 */
function setupShippingCalculatorCells() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シート「' + settings.sheetName + '」が見つかりません。', 'error');
      return;
    }

    // ⚠️ Q1→R1, Q2→R2に変更
    setupShippingMethodDropdown(sheet);
    setupShippingCalculationFormula(sheet);
    formatShippingCalculatorCells(sheet);
    
    showAlert('✅ 送料計算機能を設定しました。\n\nR1: 配送方法を選択\nR2: 選択方法での送料を自動計算\n\n重量(J2)とサイズ(L2:N2)の入力も必要です。', 'success');
    
  } catch (e) {
    showAlert('送料計算機能のセットアップエラー: ' + e.message, 'error');
  }
}

/**
 * Q1セルに配送方法のドロップダウンを設定
 */
function setupShippingMethodDropdown(sheet) {
  var shippingOptions = [
    '自動選択',
    'ePacket',
    'Cpass-Economy',
    'Cpass-FedEx',
    'Cpass-DHL',
    'eLogistics',
    'EMS'
  ];
  
  var r1Cell = sheet.getRange('R1');  // Q1→R1
  r1Cell.clearDataValidations();
  
  var validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(shippingOptions, true)
    .setAllowInvalid(false)
    .setHelpText('送料計算に使用する配送方法を選択してください')
    .build();
    
  r1Cell.setDataValidation(validation);
  
  if (!r1Cell.getValue()) {
    r1Cell.setValue('自動選択');
  }
}

/**
 * Q2セルに送料計算数式を設定
 */
function setupShippingCalculationFormula(sheet) {
  var r2Cell = sheet.getRange('R2');  // Q2→R2
  var formula = '=IF(OR(ISBLANK(J2),ISBLANK(L2),ISBLANK(M2),ISBLANK(N2)),"重量・サイズを入力",SHIPPING_COST_FOR_CALCULATOR(J2,L2,M2,N2,R1,IFERROR(I2,10000)))';
  r2Cell.setFormula(formula);
}

/**
 * Q1/Q2セルの表示形式を設定
 */
function formatShippingCalculatorCells(sheet) {
  // ⚠️ Q1→R1, Q2→R2
  var r1Cell = sheet.getRange('R1');  // Q1→R1
  r1Cell.setFontWeight('bold');
  r1Cell.setHorizontalAlignment('center');
  r1Cell.setBackground('#e1f5fe');
  
  var r2Cell = sheet.getRange('R2');  // Q2→R2
  r2Cell.setFontWeight('bold');
  r2Cell.setHorizontalAlignment('right');
  r2Cell.setBackground('#f3e5f5');
  
  // ⚠️ ラベル位置も変更：P1→Q1, P2→Q2
  sheet.getRange('Q1').setValue('配送方法:').setFontWeight('bold').setHorizontalAlignment('right');  // P1→Q1
  sheet.getRange('Q2').setValue('送料(円):').setFontWeight('bold').setHorizontalAlignment('right');  // P2→Q2
}

/**
 * 送料計算専用のUDF関数（Q2セル用）
 */
function SHIPPING_COST_FOR_CALCULATOR(weight, length, width, height, method, costYen) {
  try {
    var w = Number(weight);
    var l = Number(length);
    var wi = Number(width);  
    var h = Number(height);
    var cost = Number(costYen) || 10000;
    
    if (isNaN(w) || isNaN(l) || isNaN(wi) || isNaN(h) || w <= 0 || l <= 0 || wi <= 0 || h <= 0) {
      return "入力値エラー";
    }

    // 配送方法に応じて容積重量の計算式を変更
    // Cpass-Economy: 体積 ÷ 8、それ以外: 体積 ÷ 5、最小値200g
    var selectedMethod = String(method || '自動選択');
    var volumetricWeight;
    if (selectedMethod === 'Cpass-Economy') {
      volumetricWeight = Math.max(200, Math.round((l * wi * h) / 8));
    } else {
      volumetricWeight = Math.max(200, Math.round((l * wi * h) / 5));
    }
    var sizeString = l + 'x' + wi + 'x' + h;
    
    if (selectedMethod === '自動選択' || selectedMethod === '') {
      return selectCheapestShippingRateWithConstraints(cost, w, volumetricWeight, sizeString);
    } else {
      return calculateSpecificMethodRate(selectedMethod, w, volumetricWeight);
    }
    
  } catch (error) {
    return "計算エラー";
  }
}

/**
 * 送料計算機能のテスト
 */
function testShippingCalculator() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }
    
    // テスト用の値を設定（変更なし）
    sheet.getRange('J2').setValue(1500);
    sheet.getRange('L2').setValue(30);
    sheet.getRange('M2').setValue(25);
    sheet.getRange('N2').setValue(20);

    var methods = ['自動選択', 'ePacket', 'Cpass-FedEx', 'Cpass-DHL', 'eLogistics'];
    var results = [];
    
    for (var i = 0; i < methods.length; i++) {
      sheet.getRange('R1').setValue(methods[i]);  // Q1→R1
      SpreadsheetApp.flush();
      Utilities.sleep(100);
      
      var cost = sheet.getRange('R2').getValue();  // Q2→R2
      results.push(methods[i] + ': ' + (typeof cost === 'number' ? '¥' + cost.toLocaleString() : cost));
    }
    
    var report = '送料計算機能テスト結果:\n\n' +
      'テスト条件: 重量1500g、サイズ30x25x20cm\n\n' +
      '各方法での送料:\n' + results.join('\n');
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('テストエラー: ' + e.message, 'error');
  }
}

/**
 * Q2セルの送料を手動更新（再計算強制）
 */
function refreshShippingCalculation() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }
    
    var r2Cell = sheet.getRange('R2');  // Q2→R2
    var currentFormula = r2Cell.getFormula();
    
    if (currentFormula) {
      r2Cell.clearContent();
      SpreadsheetApp.flush();
      r2Cell.setFormula(currentFormula);
      SpreadsheetApp.flush();
      
      showAlert('送料を再計算しました。', 'success');
    } else {
      setupShippingCalculationFormula(sheet);
      showAlert('送料計算数式を設定しました。', 'success');
    }
    
  } catch (e) {
    showAlert('再計算エラー: ' + e.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  シンプル重複チェック機能（既存HTML対応版）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 重複チェック設定ダイアログを表示
 */
function showDuplicateCheckSettings() {
  try {
    var html;
    try {
      // まず .html ファイルを探す（ユーザーシート用）
      html = HtmlService.createHtmlOutputFromFile('DuplicateCheckSettings');
    } catch (_) {
      // なければ HtmlTemplates.gs から取得（ライブラリ用）
      html = createHtmlFromTemplate('DuplicateCheckSettings');
    }
    if (!html) {
      showAlert('DuplicateCheckSettings.html が見つかりません', 'error');
      return;
    }
    html.setWidth(700).setHeight(600);
    SpreadsheetApp.getUi().showModalDialog(html, '🔍 重複チェック設定');
  } catch (e) {
    showAlert('設定ダイアログの表示に失敗: ' + e.message, 'error');
  }
}
/**
 * 重複チェック設定を保存（出力先選択・貼り付け機能付き）
 */
function saveDuplicateCheckSettings(formData) {
  try {
    // バリデーション
    if (!formData.sourceSheet || !formData.sourceColumn) {
      return { success: false, error: '作業シートと列を選択してください。' };
    }
    
    if (!formData.targetSheets || formData.targetSheets.length === 0) {
      return { success: false, error: 'チェック対象シートを選択してください。' };
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // COUNTIF式を作成
    var countifFormulas = [];
    for (var i = 0; i < formData.targetSheets.length; i++) {
      var target = formData.targetSheets[i];
      var targetSheet = target.sheet;
      var targetColumn = target.column;
      
      if (targetSheet.endsWith('*')) {
        // パターンマッチング対応
        var prefix = targetSheet.slice(0, -1);
        var allSheets = ss.getSheets();
        for (var j = 0; j < allSheets.length; j++) {
          var sheetName = allSheets[j].getName();
          if (sheetName.indexOf(prefix) === 0) {
            countifFormulas.push('COUNTIF(\'' + sheetName + '\'!' + targetColumn + ':' + targetColumn + ',' + formData.sourceColumn + '1)>0');
          }
        }
      } else {
        countifFormulas.push('COUNTIF(\'' + targetSheet + '\'!' + targetColumn + ':' + targetColumn + ',' + formData.sourceColumn + '1)>0');
      }
    }
    
    // 重複チェック関数を生成
    var duplicateFormula = '=IF(AND(NOT(ISBLANK(' + formData.sourceColumn + '1)), OR(' + countifFormulas.join(',') + ')), "重複", "")';
    
    // 🆕 出力先が指定されている場合は実際に貼り付け
    if (formData.outputSheet && formData.outputColumn && formData.outputStartRow) {
      var outputSheet = ss.getSheetByName(formData.outputSheet);
      if (!outputSheet) {
        return { success: false, error: '出力先シート「' + formData.outputSheet + '」が見つかりません。' };
      }
      
      // 出力先の範囲を決定
      var startRow = parseInt(formData.outputStartRow);
      if (isNaN(startRow) || startRow < 1) {
        return { success: false, error: '出力開始行は1以上の数値で入力してください。' };
      }
      
      // 🆕 貼り付け実行
      var pasteResult = applyDuplicateFormulaToSheet(outputSheet, formData.outputColumn, startRow, duplicateFormula, formData.outputRange);
      
      if (!pasteResult.success) {
        return { success: false, error: pasteResult.error };
      }
      
      return { 
        success: true, 
        message: '重複チェック式を生成し、「' + formData.outputSheet + '」の' + formData.outputColumn + '列に適用しました。',
        formula: duplicateFormula,
        applied: true,
        appliedRange: pasteResult.range,
        appliedCount: pasteResult.count
      };
    } else {
      // 従来通り式のみ生成
      return { 
        success: true, 
        message: '重複チェック関数を生成しました。',
        formula: duplicateFormula,
        applied: false
      };
    }
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * 🆕 重複チェック式をシートに実際に適用（ARRAYFORMULA版）
 * @param {Sheet} sheet - 出力先シート
 * @param {string} column - 出力先列（例: 'A', 'B', 'C'）
 * @param {number} startRow - 開始行番号
 * @param {string} formula - 適用する数式
 * @param {string} range - 適用範囲（'ALL', 'DATA', 'CUSTOM'）※ARRAYFORMULAでは使用しない
 * @return {Object} 適用結果
 */
function applyDuplicateFormulaToSheet(sheet, column, startRow, formula, range) {
  try {
    // ARRAYFORMULAを使用するため、開始セルにのみ式を設定
    var targetCell = sheet.getRange(startRow, getColumnNumber(column));

    // 元の式からARRAYFORMULA版を生成
    var arrayFormula = convertToArrayFormula(formula, column, startRow);

    // ARRAYFORMULAを設定
    targetCell.setFormula(arrayFormula);

    return {
      success: true,
      range: targetCell.getA1Notation(),
      count: 1 // ARRAYFORMULAは1セルのみ
    };

  } catch (e) {
    return { success: false, error: '数式適用エラー: ' + e.message };
  }
}

/**
 * 通常の重複チェック式をARRAYFORMULA形式に変換
 * @param {string} formula - 元の数式（例: =IF(AND(NOT(ISBLANK(H1)), OR(COUNTIF('保存データ_'!H:H,H1)>0)), "重複", "")）
 * @param {string} column - 対象列（例: 'H'）
 * @param {number} startRow - 開始行（見出し行、例: 4）
 * @return {string} ARRAYFORMULA形式の数式
 */
function convertToArrayFormula(formula, column, startRow) {
  try {
    var dataStartRow = startRow + 1; // データ開始行（見出しの次の行）

    // 元の式: =IF(AND(NOT(ISBLANK(H1)), OR(COUNTIF('保存データ_'!H:H,H1)>0,...)), "重複", "")
    // 目標: =ARRAYFORMULA(IF(ROW(AT4:AT)=4,"重複チェック",IF((H5:H<>"")*((COUNTIF('保存データ_'!H:H,H5:H)>0)+...)>0,"重複","")))

    // 式から条件部分を抽出
    var match = formula.match(/=IF\(AND\(NOT\(ISBLANK\(([A-Z]+)1\)\),\s*OR\((.*)\)\),\s*"重複",\s*""\)/);

    if (!match) {
      throw new Error('重複チェック式の形式が不正です: ' + formula);
    }

    var sourceColumn = match[1]; // ソース列（例：H）
    var conditions = match[2];

    // 出力列の範囲（結果を表示する列）
    var outputColRange = column + startRow + ':' + column;
    // ソース列の範囲（チェック対象のデータ列） - startRowから開始
    var sourceColRange = sourceColumn + startRow + ':' + sourceColumn;

    // COUNTIF条件を配列化
    // 各COUNTIF内の sourceColumn + '1' を sourceColRange に置換
    // 例: COUNTIF('保存データ_'!H:H,H1) → COUNTIF('保存データ_'!H:H,H4:H)
    var arrayConditions = conditions.replace(new RegExp(',' + sourceColumn + '1', 'g'), ',' + sourceColRange);

    // ORを加算に変換
    // 各COUNTIF条件（...>0）を抽出して括弧で囲む
    // 例: COUNTIF('保存データ_'!H:H,AT5:AT)>0,COUNTIF('EAGLE商品一覧'!A:A,AT5:AT)>0
    // → (COUNTIF('保存データ_'!H:H,AT5:AT)>0)+(COUNTIF('EAGLE商品一覧'!A:A,AT5:AT)>0)
    var conditionParts = arrayConditions.split(')>0');
    var formattedConditions = [];
    for (var i = 0; i < conditionParts.length; i++) {
      var part = conditionParts[i].trim();
      if (part) {
        // カンマを削除
        part = part.replace(/^,\s*/, '');
        // 最後の要素以外は )>0 を付ける
        if (i < conditionParts.length - 1) {
          formattedConditions.push('(' + part + ')>0)');
        }
      }
    }
    var sumConditions = '(' + formattedConditions.join('+') + ')';

    // 最終的なARRAYFORMULA（1行で生成）
    // 見出し行とデータ行を正しく対応させる
    // 例: =ARRAYFORMULA(IF(ROW(AT4:AT)=4,"重複チェック",IF(H4:H<>"",IF((COUNTIF('保存データ_'!H:H,H4:H)>0)+(COUNTIF('EAGLE商品一覧'!A:A,H4:H)>0)>0,"重複",""),"")))
    var arrayFormula = '=ARRAYFORMULA(IF(ROW(' + outputColRange + ')=' + startRow + ',"重複チェック",IF(' + sourceColRange + '<>"",IF(' + sumConditions + '>0,"重複",""),"")))';

    return arrayFormula;

  } catch (e) {
    throw new Error('ARRAYFORMULA変換エラー: ' + e.message);
  }
}

/**
 * 🆕 出力可能なシート一覧を取得（システムシートを除外）
 * @return {Array} シート名の配列
 */
function getOutputAvailableSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var allSheets = ss.getSheets();
    var availableSheets = [];
    
    // システム系シートを除外
    var excludePatterns = ['GPT_Prompts', 'Shipping_', 'Profit_Amounts', 'README'];
    
    allSheets.forEach(function(sheet) {
      var sheetName = sheet.getName();
      var shouldExclude = excludePatterns.some(function(pattern) {
        return sheetName.indexOf(pattern) !== -1;
      });
      
      if (!shouldExclude) {
        availableSheets.push(sheetName);
      }
    });
    
    return availableSheets;
    
  } catch (e) {
    console.error('出力可能シート取得エラー: ' + e.message);
    return ['作業シート'];
  }
}

/**
 * 🆕 列選択肢を生成（A～Z, AA～AZ）
 * @return {Array} 列文字の配列
 */
function getColumnOptions() {
  var columns = [];
  
  // A～Z
  for (var i = 0; i < 26; i++) {
    columns.push(String.fromCharCode(65 + i));
  }
  
  // AA～AZ（必要に応じて拡張可能）
  for (var i = 0; i < 26; i++) {
    columns.push('A' + String.fromCharCode(65 + i));
  }
  
  return columns;
}
/**
 * シンプルな重複チェック関数
 */
function DUPLICATE_CHECK(value) {
  if (!value || value === '') return false;
  
  try {
    var settings = getDuplicateCheckSettings();
    if (!settings.enabled || !settings.targetSheets || settings.targetSheets.length === 0) {
      return false;
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var valueStr = value.toString();
    
    // 各対象シートでチェック
    for (var i = 0; i < settings.targetSheets.length; i++) {
      var targetConfig = settings.targetSheets[i];
      var targetSheetPattern, columnIndex;
      
      if (typeof targetConfig === 'string') {
        // 旧形式（文字列のみ）
        targetSheetPattern = targetConfig;
        columnIndex = 8; // H列
      } else if (targetConfig && targetConfig.sheet) {
        // 新形式（オブジェクト）
        targetSheetPattern = targetConfig.sheet;
        columnIndex = getColumnIndex(targetConfig.column || 'H');
      } else {
        continue;
      }
      
      var matchingSheets = findMatchingSheets(targetSheetPattern);
      
      for (var j = 0; j < matchingSheets.length; j++) {
        var sheetName = matchingSheets[j];
        var targetSheet = ss.getSheetByName(sheetName);
        if (!targetSheet) continue;
        
        if (checkInSheet(targetSheet, columnIndex, valueStr)) {
          return true;
        }
      }
    }
    
    return false;
    
  } catch (error) {
    console.error('DUPLICATE_CHECK関数エラー: ' + error.message);
    return false;
  }
}

/**
 * 指定シートで重複をチェック
 */
function checkInSheet(sheet, columnIndex, value) {
  try {
    var lastRow = sheet.getLastRow();
    if (lastRow < 1) return false;
    
    var data = sheet.getRange(1, columnIndex, lastRow, 1).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString() === value) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * シンプルな条件付き書式を適用
 */
function applyDuplicateCheckConditionalFormatting(settings) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(settings.sourceSheet);
    if (!sheet) return;
    
    var column = settings.sourceColumn;
    var range = sheet.getRange(column + ':' + column);
    
    // 既存の条件付き書式をクリア
    var rules = sheet.getConditionalFormatRules();
    var newRules = rules.filter(function(rule) {
      try {
        var condition = rule.getBooleanCondition();
        if (condition) {
          var formula = condition.getCriteriaValues()[0];
          return !formula || formula.indexOf('DUPLICATE_CHECK') === -1;
        }
        return true;
      } catch (e) {
        return true;
      }
    });
    
    // 新しいルールを追加
    var formula = '=AND(NOT(ISBLANK(' + column + '1)), DUPLICATE_CHECK(' + column + '1))';
    var rule = SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied(formula)
      .setBackground('#ffcdd2')
      .setRanges([range])
      .build();
    
    newRules.push(rule);
    sheet.setConditionalFormatRules(newRules);
    
  } catch (e) {
    console.error('条件付き書式適用エラー: ' + e.message);
  }
}

/**
 * 重複チェック設定を取得
 */
function getDuplicateCheckSettings() {
  try {
    var docProps = PropertiesService.getDocumentProperties();

    var settings = {
      sourceSheet: docProps.getProperty('DUPLICATE_CHECK_SOURCE_SHEET') || '',
      sourceColumn: docProps.getProperty('DUPLICATE_CHECK_SOURCE_COLUMN') || '',
      targetSheets: JSON.parse(docProps.getProperty('DUPLICATE_CHECK_TARGET_SHEETS') || '[]'),
      enabled: docProps.getProperty('DUPLICATE_CHECK_ENABLED') === 'true'
    };

    return settings;
  } catch (e) {
    return {
      sourceSheet: '',
      sourceColumn: '',
      targetSheets: [],
      enabled: false
    };
  }
}

/**
 * スプレッドシート内の全シート名を取得
 * @return {Array} シート名の配列
 */
function getAllSheetNames() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    var sheetNames = [];

    for (var i = 0; i < sheets.length; i++) {
      sheetNames.push(sheets[i].getName());
    }

    return sheetNames;
  } catch (e) {
    console.error('シート名取得エラー: ' + e.message);
    return [];
  }
}

/**
 * 参照データシートのL列からユニークなカテゴリー一覧を取得
 * @return {Array} カテゴリー名の配列
 */
function getCategoryListFromReferenceData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) {
      console.log('参照データシートが見つかりません');
      return ['その他']; // デフォルト値
    }

    var lastRow = refSheet.getLastRow();
    if (lastRow < 2) {
      console.log('参照データシートにデータがありません');
      return ['その他']; // デフォルト値
    }

    // L列のデータを取得（2行目以降）
    var data = refSheet.getRange(2, 12, lastRow - 1, 1).getValues(); // 12 = L列
    var categories = [];
    
    // ユニークなカテゴリーのみを抽出
    for (var i = 0; i < data.length; i++) {
      var category = String(data[i][0] || '').trim();
      if (category && categories.indexOf(category) === -1) {
        categories.push(category);
      }
    }
    
    // カテゴリーが見つからない場合はデフォルト値
    if (categories.length === 0) {
      return ['その他'];
    }
    
    return categories.sort(); // アルファベット順にソート
    
  } catch (error) {
    console.error('カテゴリー取得エラー: ' + error.message);
    return ['その他']; // エラー時のフォールバック
  }
}

/**
 * カテゴリー取得関数のテスト
 */
function testGetCategoryList() {
  try {
    var categories = getCategoryListFromReferenceData();
    
    var report = 'カテゴリー取得テスト結果:\n\n' +
      '取得件数: ' + categories.length + '件\n' +
      'カテゴリー一覧:\n' + categories.join('\n');
    
    showAlert(report, 'info');
    
    // コンソールにも出力
    console.log('取得したカテゴリー:', categories);
    
  } catch (error) {
    showAlert('テストエラー: ' + error.message, 'error');
  }
}

/**
 * 配送方法をエコノミー/EXに変換
 * @param {string} shippingMethod - W列の配送方法
 * @return {string} "エコノミー", "EX", または "エラー"
 */
function convertShippingMethodToType(shippingMethod) {
  try {
    var method = String(shippingMethod || '').trim();

    // 自動選択の場合はエラー
    if (method === '自動選択' || method === '') {
      return 'エラー';
    }

    // エコノミー系の判定（新形式の略称と旧形式の両方に対応）
    var economyMethods = [
      'CE',              // Cpass-Economy (新形式)
      'EP',              // ePacket (新形式)
      'Cpass-Economy',   // 旧形式（互換性のため）
      'ePacket'          // 旧形式（互換性のため）
    ];
    for (var i = 0; i < economyMethods.length; i++) {
      if (method === economyMethods[i]) {
        return 'エコノミー';
      }
    }

    // EX系の判定（新形式の略称と旧形式の両方に対応）
    var exMethods = [
      'CF',             // Cpass-FedEx (新形式)
      'CD',             // Cpass-DHL (新形式)
      'EL',             // eLogistics (新形式)
      'Cpass-FedEx',    // 旧形式（互換性のため）
      'Cpass-DHL',      // 旧形式（互換性のため）
      'eLogistics'      // 旧形式（互換性のため）
    ];
    for (var j = 0; j < exMethods.length; j++) {
      if (method === exMethods[j]) {
        return 'EX';
      }
    }

    // どちらにも該当しない場合はエラー
    console.log('未対応の配送方法: ' + method);
    return 'エラー';

  } catch (error) {
    console.error('配送方法変換エラー: ' + error.message);
    return 'エラー';
  }
}

/**
 * 配送方法変換のテスト
 */
function testConvertShippingMethod() {
  try {
    var testMethods = [
      'Cpass-Economy',
      'ePacket',
      'Cpass-FedEx',
      'Cpass-DHL',
      'eLogistics',
      '自動選択',
      'EMS',
      ''
    ];
    
    var results = [];
    for (var i = 0; i < testMethods.length; i++) {
      var method = testMethods[i];
      var result = convertShippingMethodToType(method);
      results.push('"' + method + '" → "' + result + '"');
    }
    
    var report = '配送方法変換テスト結果:\n\n' + results.join('\n');
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('変換テストエラー: ' + error.message, 'error');
  }
}

/**
 * 【非推奨】2次元テンプレート検索（後方互換性のため残存）
 * 新しいコードでは getTemplateFromReferenceData4D を使用してください
 * @deprecated Use getTemplateFromReferenceData4D instead
 * @param {number} priceUSD - 販売価格（USD）
 * @param {string} condition - 商品状態（"新品" または "中古"）
 * @return {number|null} - 該当するテンプレート値、見つからない場合はnull
 */
function getTemplateFromReferenceData(priceUSD, condition) {
  console.warn('【警告】getTemplateFromReferenceData は非推奨です。getTemplateFromReferenceData4D を使用してください。');
  
  try {
    // デフォルト値で4次元検索にリダイレクト
    var defaultCategory = 'その他';
    var defaultShipping = 'エコノミー';
    
    console.log('2次元検索を4次元検索にリダイレクト: カテゴリ=' + defaultCategory + ', 配送=' + defaultShipping);
    
    return getTemplateFromReferenceData4D(defaultCategory, condition, defaultShipping, priceUSD);
    
  } catch (error) {
    console.error('2次元→4次元リダイレクトエラー: ' + error.message);
    return null;
  }
}



/**
 * 選択されたカテゴリーを一時保存
 * @param {string} category - 選択されたカテゴリー
 */
function saveSelectedCategory(category) {
  try {
    var props = PropertiesService.getScriptProperties();
    props.setProperty('SELECTED_CATEGORY', category);
    console.log('カテゴリーを保存: ' + category);
  } catch (error) {
    console.error('カテゴリー保存エラー: ' + error.message);
  }
}

/**
 * 保存されたカテゴリーを取得
 * @return {string|null} 保存されたカテゴリー
 */
function getSavedCategory() {
  try {
    var props = PropertiesService.getScriptProperties();
    return props.getProperty('SELECTED_CATEGORY');
  } catch (error) {
    console.error('カテゴリー取得エラー: ' + error.message);
    return null;
  }
}

/**
 * 保存されたカテゴリーをクリア
 */
function clearSavedCategory() {
  try {
    var props = PropertiesService.getScriptProperties();
    props.deleteProperty('SELECTED_CATEGORY');
    console.log('保存されたカテゴリーをクリア');
  } catch (error) {
    console.error('カテゴリークリアエラー: ' + error.message);
  }
}

/**
 * カテゴリー選択ダイアログのテスト
 */
function testCategorySelectionDialog() {
  try {
    var selectedCategory = showCategorySelectionDialog();
    
    if (selectedCategory) {
      saveSelectedCategory(selectedCategory);
      var savedCategory = getSavedCategory();
      showAlert('テスト成功:\n\n選択: ' + selectedCategory + '\n保存確認: ' + savedCategory, 'success');
    } else {
      showAlert('カテゴリー選択がキャンセルされました', 'info');
    }
    
  } catch (error) {
    showAlert('テストエラー: ' + error.message, 'error');
  }
}
/**
 * 4次元条件でテンプレートを検索（NaN対応修正版）
 */
function getTemplateFromReferenceData4D(category, condition, shippingType, priceUSD) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) {
      console.log('参照データシートが見つかりません');
      return null;
    }

    var lastRow = refSheet.getLastRow();
    if (lastRow < 2) {
      console.log('参照データシートにデータがありません');
      return null;
    }

    var price = Number(priceUSD);
    if (isNaN(price)) {
      console.log('価格が無効です: ' + priceUSD);
      return null;
    }

    // 条件の正規化
    var searchCategory = String(category || '').trim();
    var searchCondition = String(condition || '').trim();
    var searchShippingType = String(shippingType || '').trim();

    console.log('検索条件: カテゴリ=' + searchCategory + ', 状態=' + searchCondition + ', 配送=' + searchShippingType + ', 価格=' + price);

    // データを一括取得（2行目以降）
    var dataRange = refSheet.getRange(2, 10, lastRow - 1, 7); // J列からP列まで
    var data = dataRange.getValues();

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var templateId = row[0];        // J列 - テンプレートID
      var rowCategory = String(row[2] || '').trim();     // L列 - カテゴリ
      var rowCondition = String(row[3] || '').trim();    // M列 - 状態
      var rowShipping = String(row[4] || '').trim();     // N列 - 配送方法
      
      // ★★★ 修正: NaN対応の価格範囲取得 ★★★
      var minPriceRaw = row[5];  // O列 - 最低価格
      var maxPriceRaw = row[6];  // P列 - 最高価格
      
      var minPrice = (minPriceRaw === null || minPriceRaw === '' || isNaN(Number(minPriceRaw))) ? 0 : Number(minPriceRaw);
      var maxPrice = (maxPriceRaw === null || maxPriceRaw === '' || isNaN(Number(maxPriceRaw))) ? 999999 : Number(maxPriceRaw);
      
      console.log('行' + (i + 2) + ': 価格範囲 ' + minPriceRaw + '→' + minPrice + ', ' + maxPriceRaw + '→' + maxPrice);
      // ★★★ ここまで修正 ★★★

      // 4つの条件をすべてチェック
      if (rowCategory === searchCategory &&
          rowCondition === searchCondition &&
          rowShipping === searchShippingType) {
        
        // 価格範囲のチェック（修正済み）
        if (price >= minPrice && price <= maxPrice) {
          console.log('マッチしたテンプレート: ID=' + templateId + ', 行=' + (i + 2) + ', 価格範囲=' + minPrice + '-' + maxPrice);
          return typeof templateId === 'number' ? templateId : Number(templateId);
        } else {
          console.log('価格範囲外: ' + price + ' not in ' + minPrice + '-' + maxPrice);
        }
      }
    }

    console.log('該当するテンプレートが見つかりません');
    return null;

  } catch (error) {
    console.error('4次元テンプレート検索エラー: ' + error.message);
    return null;
  }
}
/**
 * 参照データシートの「その他」カテゴリーの内容を確認
 */
function checkOtherCategoryData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) {
      showAlert('参照データシートが見つかりません', 'error');
      return;
    }

    var lastRow = refSheet.getLastRow();
    var report = '「その他」カテゴリーのデータ確認:\n\n';
    
    var found = false;
    for (var row = 2; row <= lastRow; row++) {
      var templateId = refSheet.getRange(row, 10).getValue();  // J列（変更なし）
      var category = String(refSheet.getRange(row, 12).getValue() || '').trim(); // L列（変更なし）
      var condition = String(refSheet.getRange(row, 13).getValue() || '').trim(); // M列（変更なし）
      var shipping = String(refSheet.getRange(row, 14).getValue() || '').trim();  // N列（変更なし）
      var minPrice = refSheet.getRange(row, 15).getValue();   // O列（変更なし）
      var maxPrice = refSheet.getRange(row, 16).getValue();   // P列（変更なし）
      
      if (category === 'その他') {
        found = true;
        report += 'テンプレート' + templateId + ': ' + condition + ' + ' + shipping + ' ($' + minPrice + '-' + maxPrice + ')\n';
      }
    }
    
    if (!found) {
      report += '「その他」カテゴリーのデータが見つかりませんでした。\n\n';
      report += '対処法:\n';
      report += '1. 参照データシートに「その他」カテゴリーのデータを追加\n';
      report += '2. または既存のカテゴリー（ゲーム、本等）でテスト';
    } else {
      report += '\n上記の組み合わせが利用可能です。';
    }
    
    showAlert(report, found ? 'info' : 'warning');
    
  } catch (error) {
    showAlert('確認エラー: ' + error.message, 'error');
  }
}
/**
 * 4次元検索ロジックの詳細デバッグ
 */
function debugDetailedSearch() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) return;

    var searchCategory = 'その他';
    var searchCondition = '新品';
    var searchShippingType = 'EX';
    var searchPrice = 100;

    var report = '詳細検索デバッグ:\n\n';
    report += '検索条件: "' + searchCategory + '", "' + searchCondition + '", "' + searchShippingType + '", $' + searchPrice + '\n\n';

    var lastRow = refSheet.getLastRow();
    var dataRange = refSheet.getRange(2, 10, lastRow - 1, 7);
    var data = dataRange.getValues();

    var matchCount = 0;
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var templateId = row[0];        // J列
      var rowCategory = String(row[2] || '').trim();     // L列
      var rowCondition = String(row[3] || '').trim();    // M列
      var rowShipping = String(row[4] || '').trim();     // N列
      var minPrice = Number(row[5]);  // O列
      var maxPrice = Number(row[6]);  // P列

      // 「その他」カテゴリーのみチェック
      if (rowCategory === searchCategory) {
        matchCount++;
        report += '行' + (i + 2) + ': テンプレート' + templateId + '\n';
        report += '  カテゴリー: "' + rowCategory + '" (一致: ' + (rowCategory === searchCategory) + ')\n';
        report += '  状態: "' + rowCondition + '" (一致: ' + (rowCondition === searchCondition) + ')\n';
        report += '  配送: "' + rowShipping + '" (一致: ' + (rowShipping === searchShippingType) + ')\n';
        report += '  価格範囲: ' + minPrice + '-' + maxPrice + ' (型: ' + typeof minPrice + ', ' + typeof maxPrice + ')\n';
        report += '  価格判定: ' + searchPrice + '>=' + minPrice + '? ' + (searchPrice >= minPrice) + ', ' + searchPrice + '<=' + maxPrice + '? ' + (searchPrice <= maxPrice) + '\n';
        
        if (rowCategory === searchCategory && rowCondition === searchCondition && rowShipping === searchShippingType) {
          if (!isNaN(minPrice) && !isNaN(maxPrice) && searchPrice >= minPrice && searchPrice <= maxPrice) {
            report += '  ★★★ 完全一致！ ★★★\n';
          } else {
            report += '  価格範囲不一致\n';
          }
        } else {
          report += '  条件不一致\n';
        }
        report += '\n';
      }
    }

    if (matchCount === 0) {
      report += '「その他」カテゴリーのデータが見つかりませんでした。';
    }

    showAlert(report, 'info');

  } catch (error) {
    showAlert('詳細デバッグエラー: ' + error.message, 'error');
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート手動検索機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート手動検索機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * テンプレート手動検索ダイアログを表示
 */
function showTemplateManualSearchDialog() {
  try {
    var html;
    try {
      // まず .html ファイルを探す（ユーザーシート用）
      html = HtmlService.createHtmlOutputFromFile('TemplateManualSearch');
    } catch (_) {
      // なければ HtmlTemplates.gs から取得（ライブラリ用）
      html = createHtmlFromTemplate('TemplateManualSearch');
    }
    if (!html) {
      showAlert('TemplateManualSearch.html が見つかりません', 'error');
      return;
    }
    html.setWidth(600).setHeight(650);
    SpreadsheetApp.getUi().showModalDialog(html, '🔍 テンプレート手動検索');
  } catch (e) {
    showAlert('手動検索ダイアログの表示に失敗: ' + e.message, 'error');
  }
}

/**
 * 手動でテンプレートを検索する
 * @param {Object} searchData - 検索条件オブジェクト
 * @return {Object} 検索結果
 */
function searchTemplateManually(searchData) {
  try {
    console.log('手動テンプレート検索開始:', searchData);
    
    // 入力値検証
    if (!searchData || typeof searchData !== 'object') {
      return { success: false, error: '検索条件が無効です' };
    }
    
    var category = String(searchData.category || '').trim();
    var condition = String(searchData.condition || '').trim();
    var shippingType = String(searchData.shippingType || '').trim();
    
    // バリデーション
    if (!category) {
      return { success: false, error: 'カテゴリーを選択してください' };
    }
    
    // トレカ・予約販売以外は状態と配送が必要
    if (!['card_graded', 'card_raw'].includes(category)) {
      if (category !== 'preorder' && (!condition || !['新品', '中古'].includes(condition))) {
        return { success: false, error: '商品状態を正しく選択してください' };
      }
      
      if (!shippingType || !['エコノミー', 'EX'].includes(shippingType)) {
        return { success: false, error: '配送方法を正しく選択してください' };
      }
    }
    
    // テンプレート名を生成
    var templateName = generateTemplateName(category, shippingType, condition);
    
    if (!templateName) {
      return { success: false, error: 'テンプレート名の生成に失敗しました' };
    }
    
    // テンプレートIDを検索
    var templateId = findTemplateId(templateName);
    
    console.log('検索結果:', templateId, templateName);
    
    return {
      success: true,
      templateId: templateId,
      templateName: templateName,
      searchConditions: {
        category: category,
        condition: condition,
        shippingType: shippingType
      }
    };
    
  } catch (error) {
    console.error('手動検索エラー:', error);
    return { 
      success: false, 
      error: error.message || 'テンプレート検索中にエラーが発生しました' 
    };
  }
}
/**
 * Policy_Masterからテンプレート名のリストを取得
 */
function getTemplateNameList() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName('Policy_Master');
    
    if (!masterSheet) {
      return ['一般汎用']; // デフォルト
    }
    
    var lastRow = masterSheet.getLastRow();
    var templateNames = {};  // 重複排除用のオブジェクト
    
    // Templates セクションを探す
    var data = masterSheet.getRange(1, 1, lastRow, 2).getValues();
    var inTemplateSection = false;
    
    for (var i = 0; i < data.length; i++) {
      var cellValue = String(data[i][0]);
      
      // Templates セクション開始
      if (cellValue.indexOf('【Templates】') !== -1) {
        inTemplateSection = true;
        continue;
      }
      
      // 次のセクション（Shipping Policies）が始まったら終了
      if (cellValue.indexOf('【Shipping') !== -1) {
        break;
      }
      
      // Templatesセクション内でテンプレート名を抽出
      if (inTemplateSection && data[i][1]) {
        var templateFullName = String(data[i][1]);
        
        // Template_xxx_new_eco のような形式から xxx を抽出
        var match = templateFullName.match(/^Template_(.+?)_(new|used)_(eco|xp)$/);
        if (match) {
          templateNames[match[1]] = true; // テンプレート名部分を追加（重複排除）
        }
      }
    }
    
    // オブジェクトのキーを配列に変換してソート
    var result = Object.keys(templateNames).sort();
    
    // 空の場合はデフォルトを返す
    return result.length > 0 ? result : ['一般汎用'];
    
  } catch (e) {
    console.error('テンプレート名リスト取得エラー: ' + e.message);
    return ['一般汎用'];
  }
}
/**
 * テンプレート手動検索機能のテスト
 */
function testTemplateManualSearch() {
  try {
    // テストケース1: 新品、エコノミー、低価格
    var testCase1 = {
      category: 'その他',
      condition: '新品',
      shipping: 'エコノミー',
      price: 15
    };
    
    var result1 = searchTemplateManually(testCase1);
    
    // テストケース2: 中古、EX、中価格
    var testCase2 = {
      category: 'その他',
      condition: '中古',
      shipping: 'EX',
      price: 60
    };
    
    var result2 = searchTemplateManually(testCase2);
    
    // テストケース3: 存在しない条件
    var testCase3 = {
      category: 'その他',
      condition: '新品',
      shipping: 'EX',
      price: 9999
    };
    
    var result3 = searchTemplateManually(testCase3);
    
    var report = 'テンプレート手動検索テスト結果:\n\n' +
      '【テストケース1】新品・エコノミー・$15\n' +
      '結果: ' + (result1.success ? 'テンプレート' + result1.templateId : 'エラー: ' + result1.error) + '\n\n' +
      
      '【テストケース2】中古・EX・$60\n' +
      '結果: ' + (result2.success ? 'テンプレート' + result2.templateId : 'エラー: ' + result2.error) + '\n\n' +
      
      '【テストケース3】新品・EX・$9999（存在しない想定）\n' +
      '結果: ' + (result3.success ? (result3.templateId ? 'テンプレート' + result3.templateId : '該当なし') : 'エラー: ' + result3.error) + '\n\n' +
      
      '💡 実際の検索はダイアログから「テンプレート手動検索」で実行してください。';
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('手動検索テストエラー: ' + error.message, 'error');
  }
}

/**
 * 参照データの構造を確認（デバッグ用）
 */
function debugReferenceDataForManualSearch() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var refSheet = ss.getSheetByName('参照データ');
    if (!refSheet) {
      showAlert('参照データシートが見つかりません', 'error');
      return;
    }
    
    var lastRow = refSheet.getLastRow();
    if (lastRow < 2) {
      showAlert('参照データシートにデータがありません', 'info');
      return;
    }
    
    var report = '参照データ構造確認（手動検索用）:\n\n';
    
    // ヘッダー確認
    var headers = [];
    for (var col = 10; col <= 16; col++) { // J列からP列
      headers.push(refSheet.getRange(1, col).getValue());
    }
    report += '列構造: ' + headers.join(' | ') + '\n\n';
    
    // 各カテゴリー・状態・配送方法の組み合わせを集計
    var combinations = {};
    
    for (var row = 2; row <= lastRow; row++) {
      var templateId = refSheet.getRange(row, 10).getValue();  // J列
      var category = String(refSheet.getRange(row, 12).getValue() || '').trim(); // L列
      var condition = String(refSheet.getRange(row, 13).getValue() || '').trim(); // M列
      var shipping = String(refSheet.getRange(row, 14).getValue() || '').trim();  // N列
      var minPrice = refSheet.getRange(row, 15).getValue();   // O列
      var maxPrice = refSheet.getRange(row, 16).getValue();   // P列
      
      if (category && condition && shipping) {
        var key = category + ' | ' + condition + ' | ' + shipping;
        if (!combinations[key]) {
          combinations[key] = [];
        }
        combinations[key].push({
          template: templateId,
          minPrice: minPrice,
          maxPrice: maxPrice
        });
      }
    }
    
    report += '利用可能な組み合わせ:\n';
    var keys = Object.keys(combinations).sort();
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var items = combinations[key];
      report += '\n【' + key + '】\n';
      for (var j = 0; j < items.length; j++) {
        var item = items[j];
        report += '  テンプレート' + item.template + ': $' + item.minPrice + ' - $' + item.maxPrice + '\n';
      }
    }
    
    if (keys.length === 0) {
      report += '有効な組み合わせが見つかりませんでした。\n参照データシートの設定を確認してください。';
    }
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('参照データ確認エラー: ' + error.message, 'error');
  }
}
/**
 * 確認ダイアログの表示制御（保存・削除系）
 */
function conditionalConfirmDialog(message, title) {
  if (shouldShowPopups()) {
    var ui = SpreadsheetApp.getUi();
    return ui.alert(title || '確認', message, ui.ButtonSet.YES_NO);
  } else {
    // サイレントモード時は確認なしで実行
    return SpreadsheetApp.getUi().Button.YES;
  }
}

/**
 * 情報ダイアログの表示制御（一覧表示系）
 */
function conditionalInfoDialog(message, title) {
  if (shouldShowPopups()) {
    var ui = SpreadsheetApp.getUi();
    ui.alert(title || '情報', message, ui.ButtonSet.OK);
  }
  // サイレントモード時は何も表示しない
}

function saveIntegratedSettings(formData) {
  var ui = SpreadsheetApp.getUi();
  // すべての永続設定はDocumentPropertiesに保存（スプレッドシートに紐づく、ライブラリ更新で消えない）
  var docProps = PropertiesService.getDocumentProperties();
  try {
    // 基本設定のバリデーション
    var platform = formData.platform;
    var apiKey = formData.apiKey;
    var model = formData.model;
    var sheetName = formData.sheetName;
    var profitCalc = formData.profitMethod;
    var promptId = formData.promptId;
    var shippingThreshold = parseFloat(formData.shippingThreshold);
    var shippingCalcMethod = formData.shippingCalcMethod;
    var lowPriceMethod = formData.lowPriceMethod;
    var highPriceMethod = formData.highPriceMethod;
    var showPopups = formData.showPopups || 'true';
    
    // 価格・利益設定
    var priceDisplayMode = formData.priceDisplayMode || 'NORMAL';
    var dduAdjustmentEnabled = formData.dduAdjustmentEnabled || 'false';
    var dduThreshold = parseFloat(formData.dduThreshold) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_THRESHOLD;
    var dduAdjustment = parseFloat(formData.dduAdjustment) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_ADJUSTMENT;

    // 重複チェック設定
    var duplicateCheckEnabled = formData.duplicateCheckEnabled || false;
    var duplicateSettings = null;
    if (duplicateCheckEnabled) {
      duplicateSettings = {
        sourceSheet: formData.duplicateSourceSheet,
        sourceColumn: formData.duplicateSourceColumn,
        targetSheets: formData.duplicateTargetSheets || [],
        applyToSheet: formData.duplicateApplyToSheet || false,
        outputSheet: formData.duplicateOutputSheet,
        outputColumn: formData.duplicateOutputColumn,
        outputStartRow: formData.duplicateOutputStartRow,
        outputRange: formData.duplicateOutputRange
      };
    }

    // バリデーション
    if (!platform || !['openai','claude','gemini'].includes(platform)) {
      throw new Error('有効なAIプラットフォームを選択してください。');
    }
    // '__KEEP_EXISTING__'は既存キー維持のための特別値
    if (!apiKey || (!apiKey.trim() && apiKey !== '__KEEP_EXISTING__')) {
      throw new Error('APIキーは必須です。');
    }
    if (!model || !model.trim()) {
      throw new Error('AIモデルを選択してください。');
    }
    if (!sheetName || !sheetName.trim()) {
      throw new Error('作業シート名は必須です。');
    }
    if (!['RATE','AMOUNT'].includes(profitCalc)) {
      throw new Error('利益計算方法を選択してください。');
    }
    if (!['NORMAL','TAX_INCLUDED'].includes(priceDisplayMode)) {
      throw new Error('価格表示モードを選択してください。');
    }

    // すべての永続設定をDocumentPropertiesに保存（スプレッドシートに紐づく、ライブラリ更新で消えない）
    docProps.setProperty('AI_PLATFORM', platform);
    docProps.setProperty('AI_MODEL', model);
    // '__KEEP_EXISTING__'の場合は既存キーを維持
    if (apiKey !== '__KEEP_EXISTING__') {
      if (platform === 'openai') docProps.setProperty('OPENAI_API_KEY', apiKey);
      if (platform === 'claude') docProps.setProperty('CLAUDE_API_KEY', apiKey);
      if (platform === 'gemini') docProps.setProperty('GEMINI_API_KEY', apiKey);
    }

    docProps.setProperty('SHEET_NAME', sheetName);
    docProps.setProperty('PROFIT_CALC_METHOD', profitCalc);
    docProps.setProperty('PROMPT_ID', promptId);
    docProps.setProperty('SHIPPING_THRESHOLD', String(shippingThreshold));
    docProps.setProperty('SHIPPING_CALC_METHOD', shippingCalcMethod);
    docProps.setProperty('LOW_PRICE_SHIPPING_METHOD', lowPriceMethod);
    docProps.setProperty('HIGH_PRICE_SHIPPING_METHOD', highPriceMethod);
    docProps.setProperty('SHOW_POPUPS', showPopups);

    // DDU価格調整機能の保存
    docProps.setProperty('DDU_ADJUSTMENT_ENABLED', dduAdjustmentEnabled);
    docProps.setProperty('DDU_THRESHOLD', String(dduThreshold));
    docProps.setProperty('DDU_ADJUSTMENT_AMOUNT', String(dduAdjustment));
    
    // 価格表示モードの保存
    setPriceDisplayMode(priceDisplayMode);

    // 出品用シートの価格式を更新（価格表示モードに応じてH2のARRAYFORMULAを変更）
    updateListingSheetPriceFormula(sheetName, priceDisplayMode);

    // 重複チェック設定の保存
    if (duplicateCheckEnabled && duplicateSettings) {
      saveIntegratedDuplicateCheckSettings(duplicateSettings);
    } else {
      // 無効化
      docProps.setProperty('DUPLICATE_CHECK_ENABLED', 'false');
    }

    // システム設定
    ensureSurchargeCellsOnWorkSheet();
    setupStopControlCell();

    // 設定値を作業シートのAI列以降に書き出し
    var writeResult = writeSettingsToSheet(sheetName, {
      platform: platform,
      model: model,
      promptId: promptId,
      profitCalc: profitCalc,
      shippingCalcMethod: shippingCalcMethod,
      shippingThreshold: shippingThreshold,
      lowPriceMethod: lowPriceMethod,
      highPriceMethod: highPriceMethod,
      dduAdjustmentEnabled: dduAdjustmentEnabled,
      dduThreshold: dduThreshold,
      dduAdjustment: dduAdjustment,
      duplicateCheckEnabled: duplicateCheckEnabled,
      duplicateSettings: duplicateSettings
    });

    if (!writeResult.success) {
      throw new Error('設定値のシートへの書き込みに失敗しました: ' + writeResult.error);
    }

    // 📝 デバッグ: 書き込みが実際に反映されたか確認
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      var actualAJ2 = sheet.getRange('AJ2').getValue();
      Logger.log('初期設定後のAJ2の実際の値: ' + actualAJ2);
    }

    // 🆕 計算式ARRAYFORMULAを作業シートに適用
    var formulaResult = applyCalculationFormulas(sheetName, {
      profitCalc: profitCalc,
      shippingCalcMethod: shippingCalcMethod
    });

    if (!formulaResult.success) {
      throw new Error('計算式の適用に失敗しました: ' + formulaResult.error);
    }

    // 成功メッセージ
    var platformNames = { openai:'OpenAI', claude:'Claude (Anthropic)', gemini:'Gemini (Google)' };
    var lowPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[lowPriceMethod].displayName;
    var highPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[highPriceMethod].displayName;
    var popupText = (showPopups === 'true') ? 'ON' : 'OFF';
    var dduText = (dduAdjustmentEnabled === 'true') ? 'ON（$' + dduThreshold + '以上で$' + dduAdjustment + '調整）' : 'OFF';
    var priceText = (priceDisplayMode === 'TAX_INCLUDED') ? '関税込み価格（DDP）' : '販売価格（DDU）';
    var duplicateText = duplicateCheckEnabled ? 'ON' : 'OFF';
    
    // 📝 デバッグ: シートに実際に書き込まれた値を確認
    var debugInfo = '';
    try {
      var debugSheet = sheet;  // 既に取得済みのsheetを使用
      if (debugSheet) {
        var debugAJ2 = debugSheet.getRange('AJ2').getValue();
        var debugAJ3 = debugSheet.getRange('AJ3').getValue();
        debugInfo = '\n\n[デバッグ情報]\nシートAJ2: ' + debugAJ2 + '\nシートAJ3: ' + debugAJ3;
      }
    } catch (e) {
      debugInfo = '\n\n[デバッグ情報取得エラー: ' + e.message + ']';
    }

    var msg = '設定を保存しました！\n\n' +
      'AIプラットフォーム: ' + platformNames[platform] + '\n' +
      'AIモデル: ' + model + '\n' +
      '作業シート: ' + sheetName + '\n' +
      '利益計算: ' + (profitCalc === 'RATE' ? '利益率' : '利益額') + '\n' +
      '価格表示: ' + priceText + '\n' +
      '送料計算: ' + (shippingCalcMethod === 'TABLE' ? 'テーブル計算' : '固定金額') + '\n' +
      '送料切替基準: ' + shippingThreshold + '円\n' +
      '低価格配送: ' + lowPriceName + '\n' +
      '高価格配送: ' + highPriceName + '\n' +
      'ポップアップ: ' + popupText + '\n' +
      'DDU調整機能: ' + dduText + '\n' +
      '重複チェック: ' + duplicateText +
      debugInfo;
      
    // 送料レート更新処理（チェックボックスがOnの場合のみ）
    var shippingRatesUpdateResult = null;
    if (formData.updateShippingRates === true) {
      try {
        shippingRatesUpdateResult = updateShippingRatesToLatest();
        if (shippingRatesUpdateResult.success) {
          msg += '\n\n【送料レート更新】\n' + shippingRatesUpdateResult.message + '\n更新行数: ' + shippingRatesUpdateResult.updatedRows + '行';
          Logger.log('送料レートを2026年版に更新しました: ' + shippingRatesUpdateResult.updatedRows + '行');
        } else {
          msg += '\n\n【送料レート更新エラー】\n' + shippingRatesUpdateResult.message;
          Logger.log('送料レート更新エラー: ' + shippingRatesUpdateResult.message);
        }
      } catch (e) {
        msg += '\n\n【送料レート更新エラー】\n' + e.message;
        Logger.log('送料レート更新で例外発生: ' + e.message);
      }
    }

    if (showPopups === 'true') {
      ui.alert('設定保存', msg, ui.ButtonSet.OK);
    }

    // 🆕 為替レートを即座に更新（A2→C2）
    try {
      if (sheet) {
        updateExchangeRate(sheet);
        Logger.log('為替レートを更新しました');
      }
    } catch (e) {
      Logger.log('為替レート更新に失敗: ' + e.message);
    }

    // 🆕 為替レート自動更新トリガーを設定（初期設定時に自動で有効化）
    try {
      setupExchangeRateUpdateTrigger(true); // silentモードで実行
      Logger.log('為替レート自動更新トリガーを設定しました（1時間ごと）');
    } catch (e) {
      Logger.log('為替レート自動更新トリガーの設定に失敗: ' + e.message);
    }

    return { success: true };
  } catch (e) {
    ui.alert('設定保存エラー', 'エラー: ' + e.message, ui.ButtonSet.OK);
    return { success: false, error: e.message };
  }
}
/**
 * 初期設定値を作業シートのAG列以降に書き出す
 * @param {string} sheetName - 作業シート名
 * @param {Object} settings - 設定オブジェクト
 */
function writeSettingsToSheet(sheetName, settings) {
  try {
    console.log('[writeSettingsToSheet] 開始 - シート名:', sheetName);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      console.error('[writeSettingsToSheet] シートが見つかりません:', sheetName);
      throw new Error('シート「' + sheetName + '」が見つかりません');
    }

    console.log('[writeSettingsToSheet] シートを取得しました:', sheet.getName());

    // 配送方法の表示名を取得（バリデーション付き）
    console.log('[writeSettingsToSheet] lowPriceMethod受信値:', settings.lowPriceMethod);
    console.log('[writeSettingsToSheet] highPriceMethod受信値:', settings.highPriceMethod);

    // 低価格配送方法のバリデーション
    if (!settings.lowPriceMethod || !CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[settings.lowPriceMethod]) {
      throw new Error('低価格配送方法が不正です: ' + settings.lowPriceMethod +
                      '\n有効な値: ' + Object.keys(CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice).join(', '));
    }

    // 高価格配送方法のバリデーション
    if (!settings.highPriceMethod || !CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[settings.highPriceMethod]) {
      throw new Error('高価格配送方法が不正です: ' + settings.highPriceMethod +
                      '\n有効な値: ' + Object.keys(CONFIG.SHIPPING_METHOD_OPTIONS.highPrice).join(', '));
    }

    var lowPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[settings.lowPriceMethod].displayName;
    var highPriceName = CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[settings.highPriceMethod].displayName;
    console.log('[writeSettingsToSheet] AJ2に書き込む値:', lowPriceName);
    console.log('[writeSettingsToSheet] AJ3に書き込む値:', highPriceName);

    // 梱包情報を取得
    var weight = sheet.getRange('J2').getValue() || '';
    var length = sheet.getRange('L2').getValue() || '';
    var width = sheet.getRange('M2').getValue() || '';
    var height = sheet.getRange('N2').getValue() || '';

    // その他の設定を取得
    var feeRate = sheet.getRange('F1').getValue() || '';
    var adRate = sheet.getRange('F2').getValue() || '';
    var profitValue = settings.profitCalc === 'RATE' ? sheet.getRange('H2').getValue() : sheet.getRange('H1').getValue();

    // AI1: 見出し
    sheet.getRange('AI1').setValue('【初期設定値一覧】')
      .setFontWeight('bold')
      .setFontSize(12)
      .setBackground('#4285F4')
      .setFontColor('#FFFFFF');

    // 配送設定（青系）
    var shippingData = [
      ['低価格配送方法', lowPriceName],
      ['高価格配送方法', highPriceName],
      ['送料切替基準(円)', settings.shippingThreshold],
      ['送料計算方法', settings.shippingCalcMethod === 'TABLE' ? 'テーブル計算' : '固定金額']
    ];
    console.log('[writeSettingsToSheet] shippingDataの内容:', JSON.stringify(shippingData));

    // 書き込み前に現在の値を確認
    var currentAJ2 = sheet.getRange('AJ2').getValue();
    console.log('[writeSettingsToSheet] 書き込み前のAJ2の値:', currentAJ2);

    // 🔧 既存のデータ検証をクリア（古いルールが残っていると新しい値を拒否されるため）
    sheet.getRange('AJ2:AJ5').clearDataValidations();
    sheet.getRange('AL2').clearDataValidations();
    sheet.getRange('AP2').clearDataValidations();
    sheet.getRange('AS2').clearDataValidations();

    sheet.getRange('AI2:AJ5').setValues(shippingData);

    // 書き込み後に値を確認
    var newAJ2 = sheet.getRange('AJ2').getValue();
    console.log('[writeSettingsToSheet] 書き込み後のAJ2の値:', newAJ2);
    console.log('[writeSettingsToSheet] AI2:AJ5への書き込み完了');
    sheet.getRange('AI2:AJ5').setBackground('#E8F0FE');
    sheet.getRange('AI2:AI5').setFontWeight('bold');

    // 利益設定（オレンジ系）
    // AK2:AL2は値として設定（利益計算方法のラベルと値）
    var profitLabelData = [
      ['利益計算方法', settings.profitCalc === 'RATE' ? '利益率' : '利益額']
    ];
    sheet.getRange('AK2:AL2').setValues(profitLabelData);
    // AL3, AL4は式として設定（F1, F2を参照）
    sheet.getRange('AK3').setValue('手数料率');
    sheet.getRange('AK4').setValue('広告費率');
    sheet.getRange('AL3').setFormula('=F1');
    sheet.getRange('AL4').setFormula('=F2');
    sheet.getRange('AK2:AL4').setBackground('#FFF3E0');
    sheet.getRange('AK2:AK4').setFontWeight('bold');

    // AK5: AL2に連動するラベル（数式）
    sheet.getRange('AK5').setFormula('=IF(AL2="利益率","利益率","利益額")').setBackground('#FFF3E0').setFontWeight('bold');
    // AL5: 利益値（AL2の値に応じてH1またはH2から自動取得）
    sheet.getRange('AL5').setFormula('=IF(AL2="利益率",H2,H1)').setBackground('#FFF3E0');

    // 梱包情報（緑系）
    // AM列はラベル、AN列は式として設定（J2, L2, M2, N2を参照）
    sheet.getRange('AM2').setValue('重量(g)');
    sheet.getRange('AM3').setValue('長さ(cm)');
    sheet.getRange('AM4').setValue('幅(cm)');
    sheet.getRange('AM5').setValue('高さ(cm)');
    sheet.getRange('AN2').setFormula('=J2');
    sheet.getRange('AN3').setFormula('=L2');
    sheet.getRange('AN4').setFormula('=M2');
    sheet.getRange('AN5').setFormula('=N2');
    sheet.getRange('AM2:AN5').setBackground('#E8F5E9');
    sheet.getRange('AM2:AM5').setFontWeight('bold');

    // 配送方法略称（非表示列、式で参照用）
    // AJ列の表示名から略称コードを自動抽出する数式を設定
    // 後方互換性: 旧名称「Small Packet」も「EP」に変換
    var lowPriceFormula = [
      '=IF(OR(AJ2="eパケット（重量・サイズ制限あり）",AJ2="Small Packet（重量・サイズ制限あり）"),"EP",IF(AJ2="Cpass Economy（重量制限なし）","CE",IF(AJ2="なし（高価格配送のみ使用）","NONE","")))'
    ];
    var highPriceFormula = [
      '=IF(AJ3="Cpass FedEx（燃油・割引・追加料金あり）","CF",IF(AJ3="Cpass DHL（燃油・割引・追加料金あり）","CD",IF(AJ3="eLogistics（追加料金なし）","EL","")))'
    ];

    sheet.getRange('AQ2').setFormula(lowPriceFormula[0]);
    sheet.getRange('AQ3').setFormula(highPriceFormula[0]);
    sheet.getRange('AQ2:AQ3').setBackground('#E8F0FE').setFontSize(9).setFontColor('#666666');

    // DDU調整（紫系）
    // AP3は想定関税の閾値（想定関税がこれ以上の場合に調整）
    var dduData = [
      ['DDU調整有効', settings.dduAdjustmentEnabled === 'true' ? 'ON' : 'OFF'],
      ['想定関税閾値($)', settings.dduThreshold]
    ];
    sheet.getRange('AO2:AP3').setValues(dduData);
    sheet.getRange('AO2:AP3').setBackground('#F3E5F5');
    sheet.getRange('AO2:AO3').setFontWeight('bold');
    // AP4は使用しなくなったのでクリア
    sheet.getRange('AO4:AP4').clearContent();

    // プロンプト設定（黄色系）
    var promptData = [
      ['使用プロンプト', settings.promptId || 'EBAY_FULL_LISTING_PROMPT']
    ];
    sheet.getRange('AR2:AS2').setValues(promptData);
    sheet.getRange('AR2:AS2').setBackground('#FFF9C4');
    sheet.getRange('AR2').setFontWeight('bold');

    // 枠線を設定（AI1からAS5まで）
    var settingsRange = sheet.getRange('AI1:AS5');
    settingsRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

    // ドロップダウンを設定
    // AJ2: 低価格配送方法
    var lowPriceOptions = Object.keys(CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice).map(function(key) {
      return CONFIG.SHIPPING_METHOD_OPTIONS.lowPrice[key].displayName;
    });
    var rule1 = SpreadsheetApp.newDataValidation()
      .requireValueInList(lowPriceOptions, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('AJ2').setDataValidation(rule1);

    // AJ3: 高価格配送方法
    var highPriceOptions = Object.keys(CONFIG.SHIPPING_METHOD_OPTIONS.highPrice).map(function(key) {
      return CONFIG.SHIPPING_METHOD_OPTIONS.highPrice[key].displayName;
    });
    var rule2 = SpreadsheetApp.newDataValidation()
      .requireValueInList(highPriceOptions, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('AJ3').setDataValidation(rule2);

    // AJ5: 送料計算方法
    var rule3 = SpreadsheetApp.newDataValidation()
      .requireValueInList(['テーブル計算', '固定金額'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('AJ5').setDataValidation(rule3);

    // AL2: 利益計算方法
    var rule4 = SpreadsheetApp.newDataValidation()
      .requireValueInList(['利益率', '利益額'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('AL2').setDataValidation(rule4);

    // AP2: DDU調整有効
    var rule5 = SpreadsheetApp.newDataValidation()
      .requireValueInList(['ON', 'OFF'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('AP2').setDataValidation(rule5);

    // AS2: 使用プロンプト（GPT_Promptsシートから取得）
    var promptIds = getAllPromptIds();
    if (promptIds && promptIds.length > 0) {
      var rule6 = SpreadsheetApp.newDataValidation()
        .requireValueInList(promptIds, true)
        .setAllowInvalid(false)
        .build();
      sheet.getRange('AS2').setDataValidation(rule6);
    }

    // 注釈を追加
    sheet.getRange('AI6').setValue('※この設定値は計算式から参照されます。値セル（AJ, AL, AN, AP, AS列）は直接編集可能です。ドロップダウンから選択できます。')
      .setFontSize(9)
      .setFontColor('#666666')
      .setWrap(true);

    // 全ての書き込みをコミット
    SpreadsheetApp.flush();
    console.log('[writeSettingsToSheet] 書き込みをflushしました');

    return { success: true };

  } catch (e) {
    console.error('[writeSettingsToSheet] エラー発生:', e.message);
    return { success: false, error: e.message };
  }
}

/**
 * 🆕 計算式ARRAYFORMULAを作業シートに適用
 * @param {string} sheetName - シート名
 * @param {Object} settings - 設定オブジェクト
 * @return {Object} 適用結果
 */
function applyCalculationFormulas(sheetName, settings) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, error: 'シート "' + sheetName + '" が見つかりません' };
    }

    var profitCalc = settings.profitCalc;  // 'RATE' or 'AMOUNT'
    var shippingCalc = settings.shippingCalcMethod;  // 'TABLE' or 'FIXED'

    // ========================================
    // E列・O列・R列～AG列（5行目以降）を全てクリア（AE列は除外）
    // ARRAYFORMULAがエラーにならないよう、既存データを削除
    // ========================================
    var lastRow = sheet.getLastRow();
    if (lastRow >= 5) {
      var clearRowCount = lastRow - 4; // 5行目からlastRowまで
      // E列（5列目）をクリア
      sheet.getRange(5, 5, clearRowCount, 1).clearContent();
      // O列（15列目）をクリア
      sheet.getRange(5, CONFIG.COLUMNS.SHIPPING_POLICY, clearRowCount, 1).clearContent();
      // R列(18)からAD列(30)まで = 13列（AE列の直前まで）
      sheet.getRange(5, CONFIG.COLUMNS.PRICE, clearRowCount, 13).clearContent();
      // AF列(32)からAG列(33)まで = 2列（AE列の直後から）
      sheet.getRange(5, CONFIG.COLUMNS.BASE_SHIPPING, clearRowCount, 2).clearContent();
      console.log('E列・O列・R列～AD列・AF列～AG列（5～' + lastRow + '行）をクリアしました（AE列は保持）');
    }

    // 参照先シートを先に読み込んでキャッシュさせる（該当なし問題の対策）
    SpreadsheetApp.flush();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    if (templateSheet) templateSheet.getDataRange().getValues();
    if (policySheet) policySheet.getDataRange().getValues();

    // 🆕 dataLastRowを先に取得（全ての列で使用）
    // シートに存在する全ての行に式を適用
    var dataLastRow = sheet.getMaxRows();
    if (dataLastRow < 5) {
      dataLastRow = 50; // 最低50行は確保
    }

    // R列: 販売価格（個別行の式）
    sheet.getRange('R4').setValue('販売価格');
    var priceFormulas = [];
    for (var row = 5; row <= dataLastRow; row++) {
      var formula = '';
      if (profitCalc === 'RATE') {
        formula = '=IF(I' + row + '="","",ROUND(((I' + row + '+T' + row + ')/(1-(V' + row + '+W' + row + '+$F$2+$Z$2))/$C$2)*100)/100)';
      } else {
        formula = '=IF(I' + row + '="","",ROUND(((I' + row + '+T' + row + '+U' + row + ')/(1-(V' + row + '+$F$2+$Z$2))/$C$2)*100)/100)';
      }
      priceFormulas.push([formula]);
    }
    if (priceFormulas.length > 0) {
      sheet.getRange(5, CONFIG.COLUMNS.PRICE, priceFormulas.length, 1).setFormulas(priceFormulas);
    }

    // S列: 関税込み価格（ARRAYFORMULA）
    sheet.getRange('S4').setFormula('=ARRAYFORMULA(IF(ROW(S4:S)=4,"関税込み価格",IF(R4:R="","",ROUND(R4:R+AD4:AD,2))))');

    // E列: テンプレートID（Import_TemplatesのC列を使用したINDEX/MATCH）
    try {
      sheet.getRange('E4').setValue('テンプレート');
      var templateFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        // 標準名を生成: Template_テンプレート名_状態_配送タイプ
        // 配送タイプ: SP/CE→eco, それ以外→xp
        // 状態: 新品→new, 中古→used
        // INDEX/MATCH: C列で標準名を探して、A列のTemplate IDを返す（範囲を50行に限定して高速化）
        var formula = '=IF(OR(ISBLANK($O$2),ISBLANK(AE' + row + '),ISBLANK(X' + row + ')),"",IFERROR(INDEX(Import_Templates!$A$2:$A$50,MATCH("Template_"&$O$2&"_"&IF(AE' + row + '="新品","new","used")&"_"&IF(X' + row + '="EP","eco",IF(X' + row + '="CE","eco","xp")),Import_Templates!$C$2:$C$50,0)),"該当なし"))';
        templateFormulas.push([formula]);
      }
      if (templateFormulas.length > 0) {
        sheet.getRange(5, 5, templateFormulas.length, 1).setFormulas(templateFormulas);
        console.log('E列（テンプレートID）設定完了（5～' + dataLastRow + '行）[INDEX/MATCH版]');
      }
    } catch (eTemplate) {
      console.error('E列（テンプレート）設定エラー: ' + eTemplate.message);
      // エラーが発生してもスキップして続行
    }

    // O列: シッピングポリシーID（初期設定用・Import_Policies参照版）
    try {
      sheet.getRange('O4').setValue('シッピングポリシー');
      var policyFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        // GET_SHIPPING_POLICY_FROM_IMPORT関数を使用（Import_PoliciesのD-G列を活用した最適化版）
        // 引数: カテゴリー表示名（O1）, 想定関税(AD列、DDU有効時は閾値で制限), 商品状態, 配送方法
        // DDU調整が有効(AP2=ON)で想定関税が閾値(AP3)以上の場合、閾値を使用
        var formula = '=IF(OR(ISBLANK($O$1),ISBLANK(AD' + row + '),ISBLANK(AE' + row + '),ISBLANK(X' + row + ')),"",GET_SHIPPING_POLICY_FROM_IMPORT($O$1,IF(AND($AP$2="ON",AD' + row + '>=$AP$3),$AP$3,AD' + row + '),AE' + row + ',X' + row + '))';
        policyFormulas.push([formula]);
      }
      if (policyFormulas.length > 0) {
        sheet.getRange(5, CONFIG.COLUMNS.SHIPPING_POLICY, policyFormulas.length, 1).setFormulas(policyFormulas);
        console.log('O列（シッピングポリシーID）設定完了（5～' + dataLastRow + '行）[Import_Policies参照版]');
      }
    } catch (ePolicy) {
      console.error('O列（シッピングポリシー）設定エラー: ' + ePolicy.message);
      // エラーが発生してもスキップして続行
    }

    // AF列: 基本送料（VLOOKUPでShipping_Ratesから取得、テーブル計算モードのみ）
    if (shippingCalc === 'TABLE') {
      // EPは実重量(Y列)、他は課金重量(AC列)をそのまま使用
      // VLOOKUPの近似一致がWeight_Fromの範囲で自動的に正しい行を見つける
      var baseCostFormula = '=ARRAYFORMULA(IF(ROW(AF4:AF)=4,"基本送料",IF(AC4:AC="","",IF(ISNUMBER(AC4:AC),IF(X4:X="EP",VLOOKUP(Y4:Y,Shipping_Rates!$A$3:$H,3,TRUE),IF(X4:X="CE",VLOOKUP(AC4:AC,Shipping_Rates!$A$3:$H,4,TRUE),IF(X4:X="EMS",VLOOKUP(AC4:AC,Shipping_Rates!$A$3:$H,5,TRUE),IF(X4:X="CF",VLOOKUP(AC4:AC,Shipping_Rates!$A$3:$H,6,TRUE),IF(X4:X="CD",VLOOKUP(AC4:AC,Shipping_Rates!$A$3:$H,7,TRUE),IF(X4:X="EL",VLOOKUP(AC4:AC,Shipping_Rates!$A$3:$H,8,TRUE),"")))))),""))))';
      sheet.getRange('AF4').setFormula(baseCostFormula);
    } else {
      sheet.getRange('AF4').clearContent();
    }

    // T列: 送料（配送方法に応じた計算）
    sheet.getRange('T4').setValue('送料');
    if (shippingCalc === 'TABLE') {
      // テーブル計算モード：個別行の式を設定
      var shippingFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        // CF: base + extra + fuel - discount
        // CD: base + extra + fuel - discount
        // CE/EL/EP: base のみ（テーブルに既にサーチャージが含まれている）
        var formula = '=IF(AF' + row + '="","",IF(X' + row + '="CF",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$1,subtotal,base+extra,fuel,subtotal*$V$1,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),IF(X' + row + '="CD",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$2,subtotal,base+extra,fuel,subtotal*$V$2,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),ROUND(AF' + row + '))))';
        shippingFormulas.push([formula]);
      }
      if (shippingFormulas.length > 0) {
        sheet.getRange(5, CONFIG.COLUMNS.SHIPPING, shippingFormulas.length, 1).setFormulas(shippingFormulas);
      }
    } else {
      // 固定金額モード：個別行の式を設定（ARRAYFORMULAを使わない）
      var shippingFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        var formula = '=IF(I' + row + '="","",IF($J$1<>"", $J$1, VLOOKUP(I' + row + ',Profit_Amounts!$A$2:$D$8,4,TRUE)))';
        shippingFormulas.push([formula]);
      }
      if (shippingFormulas.length > 0) {
        sheet.getRange(5, CONFIG.COLUMNS.SHIPPING, shippingFormulas.length, 1).setFormulas(shippingFormulas);
      }
    }

    // U列: 利益
    sheet.getRange('U4').setValue('利益');
    if (profitCalc === 'RATE') {
      // 利益率モード：ARRAYFORMULA（計算式なので個別変更は想定しない）
      var profitFormula = '=ARRAYFORMULA(IF(ROW(U4:U)=4,"利益",IF(R4:R="","",ROUND(R4:R*$C$2*(1-(V4:V+$F$2+$Z$2))-I4:I-T4:T,0))))';
      sheet.getRange('U4').setFormula(profitFormula);
    } else {
      // 利益額モード：個別行の式を設定（手動変更可能にする）
      var profitFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        var formula = '=IF(I' + row + '="","",IF($H$1<>"", $H$1, VLOOKUP(I' + row + ',Profit_Amounts!$A$2:$C$8,3,TRUE)))';
        profitFormulas.push([formula]);
      }
      if (profitFormulas.length > 0) {
        sheet.getRange(5, CONFIG.COLUMNS.PROFIT, profitFormulas.length, 1).setFormulas(profitFormulas);
      }
    }

    // V列: 手数料率（ヘッダーのみ、個別行の値はsetFormulasで設定）
    sheet.getRange('V4').setValue('手数料率');

    // W列: 利益率（ヘッダーのみ、個別行の値はsetFormulasで設定）
    if (profitCalc === 'RATE') {
      sheet.getRange('W4').setValue('利益率');
    } else {
      // 利益額モードの場合はW列全体をクリア
      var lastRow = sheet.getLastRow();
      if (lastRow >= 4) {
        sheet.getRange('W4:W' + lastRow).clearContent();
      }
    }

    // 🆕 デフォルト値列に式を一括設定（5行目以降）
    // dataLastRowは既に上で定義済み

    if (dataLastRow >= 5) {
      // V列: 手数料率 = $F$1
      var vFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        vFormulas.push(['=$F$1']);
      }
      sheet.getRange(5, CONFIG.COLUMNS.FEE, dataLastRow - 4, 1).setFormulas(vFormulas);

      // W列: 利益率 = $H$2（利益率モードのみ）
      if (profitCalc === 'RATE') {
        var wFormulas = [];
        for (var i = 5; i <= dataLastRow; i++) {
          wFormulas.push(['=$H$2']);
        }
        sheet.getRange(5, CONFIG.COLUMNS.RATE, dataLastRow - 4, 1).setFormulas(wFormulas);
      }

      // Y列: 重量 = $J$2
      var yFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        yFormulas.push(['=$J$2']);
      }
      sheet.getRange(5, CONFIG.COLUMNS.WEIGHT, dataLastRow - 4, 1).setFormulas(yFormulas);

      // Z列、AA列、AB列: データ入力規則とドロップダウンをクリア
      sheet.getRange(5, CONFIG.COLUMNS.LENGTH, dataLastRow - 4, 1).clearDataValidations();
      sheet.getRange(5, CONFIG.COLUMNS.WIDTH, dataLastRow - 4, 1).clearDataValidations();
      sheet.getRange(5, CONFIG.COLUMNS.HEIGHT, dataLastRow - 4, 1).clearDataValidations();

      // Z列: 長さ = $L$2（整数形式）
      var zFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        zFormulas.push(['=$L$2']);
      }
      var zRange = sheet.getRange(5, CONFIG.COLUMNS.LENGTH, dataLastRow - 4, 1);
      zRange.setFormulas(zFormulas);
      zRange.setNumberFormat('0'); // 整数形式

      // AA列: 幅 = $M$2（整数形式）
      var aaFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        aaFormulas.push(['=$M$2']);
      }
      var aaRange = sheet.getRange(5, CONFIG.COLUMNS.WIDTH, dataLastRow - 4, 1);
      aaRange.setFormulas(aaFormulas);
      aaRange.setNumberFormat('0'); // 整数形式

      // AB列: 高さ = $N$2（整数形式）
      var abFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        abFormulas.push(['=$N$2']);
      }
      var abRange = sheet.getRange(5, CONFIG.COLUMNS.HEIGHT, dataLastRow - 4, 1);
      abRange.setFormulas(abFormulas);
      abRange.setNumberFormat('0'); // 整数形式

      // X列: 配送方法 = IF(低価格配送が「NONE」または仕入れ価格>=切替基準, 高価格配送, 低価格配送)
      var xFormulas = [];
      for (var i = 5; i <= dataLastRow; i++) {
        xFormulas.push(['=IF(OR($AQ$2="NONE",I' + i + '>=$AJ$4),$AQ$3,$AQ$2)']);
      }
      sheet.getRange(5, CONFIG.COLUMNS.METHOD, dataLastRow - 4, 1).setFormulas(xFormulas);
    }

    // AC列: 容積重量（ARRAYFORMULA）
    // CE（Cpass-Economy）の場合は÷8、それ以外は÷5で計算、最小値200g
    sheet.getRange('AC4').setFormula('=ARRAYFORMULA(IF(ROW(AC4:AC)=4,"容積重量",IF(Z4:Z="","",IF(X4:X="CE",IF(ROUND((Z4:Z*AA4:AA*AB4:AB)/8)>200,ROUND((Z4:Z*AA4:AA*AB4:AB)/8),200),IF(ROUND((Z4:Z*AA4:AA*AB4:AB)/5)>200,ROUND((Z4:Z*AA4:AA*AB4:AB)/5),200)))))');

    // AA2: 実際の関税率（ユーザー入力）
    // 空の場合のみデフォルト値を設定（既存の値を上書きしない）
    var aa2Value = sheet.getRange('AA2').getValue();
    if (aa2Value === '' || aa2Value === null || aa2Value === undefined) {
      sheet.getRange('AA2').setValue(0.15); // デフォルト15%
    }

    // AF2: 調整後の関税率（式）
    // AA2=実際の関税率, F1=手数料率, F2=広告費率
    // DDP価格に対してeBay手数料・広告費が課されるため、関税率を調整
    // 調整式: 実際の関税率 ÷ (1 - 手数料率 - 広告費率) × 1.03（3%安全係数）
    sheet.getRange('AF2').setFormula('=$AA$2/(1-$F$1-$F$2)*1.03');

    // AD列: 想定関税（ARRAYFORMULA）
    // 計算式: 関税額 + 関税処理手数料 + (米国通関処理手数料円 ÷ 為替) + MPF$ + (EU送料差額円 ÷ 為替)
    // 関税額 = 販売価格 × 関税率
    // 関税処理手数料 = (販売価格 × 関税率 × 関税処理手数料率) + (販売価格 × VAT率 × 関税処理手数料率)
    // つまり: 販売価格 × 関税率 × (1 + 関税処理手数料率) + 販売価格 × VAT率 × 関税処理手数料率 + その他
    // AF2=調整後関税率, AE2=VAT率, AG2=関税処理手数料率, AE1=米国通関処理手数料(円)※将来用, AB2=CE用通関手数料(円), AH2=MPF($), AC2=EU送料差額(円), C2=為替レート
    // CE（Cpass-Economy）の場合のみAB2の通関手数料を適用、それ以外のクーリエは0
    sheet.getRange('AD4').setFormula('=ARRAYFORMULA(IF(ROW(AD4:AD)=4,"想定関税",IF(R4:R="","",ROUND(R4:R*$AF$2*(1+$AG$2)+R4:R*$AE$2*$AG$2+IF(X4:X="CE",$AB$2/$C$2,0)+$AH$2+$AC$2/$C$2,2))))');

    // AH列: 実際の関税額（ARRAYFORMULA）
    // AD列（想定関税）と同じ計算式だが、AF2（調整関税率）ではなくAA2（実際の関税率）を使用
    // これにより実際に支払う関税額がわかり、正確な利益計算ができる
    sheet.getRange('AH4').setFormula('=ARRAYFORMULA(IF(ROW(AH4:AH)=4,"実際の関税額",IF(R4:R="","",ROUND(R4:R*$AA$2*(1+$AG$2)+R4:R*$AE$2*$AG$2+IF(X4:X="CE",$AB$2/$C$2,0)+$AH$2+$AC$2/$C$2,2))))');

    // AG列: DDU調整後価格（AP2:AP3のセル参照を使用）
    // AP3は想定関税の閾値、想定関税がAP3以上の場合にDDP価格から想定関税を引く
    sheet.getRange('AG4').setValue('DDU調整後価格');
    if (dataLastRow >= 5) {
      // AP2=ON/OFF, AP3=想定関税閾値
      // 式: IF(AP2="ON", IF(AD>=AP3, S-AD, ""), "")
      var dduFormulas = [];
      for (var row = 5; row <= dataLastRow; row++) {
        var formula = '=IF($AP$2="ON", IF(AD' + row + '>=$AP$3, S' + row + '-$AP$3, ""), "")';
        dduFormulas.push([formula]);
      }
      sheet.getRange(5, CONFIG.COLUMNS.DDU_ADJUSTED_PRICE, dduFormulas.length, 1).setFormulas(dduFormulas);
    }

    // ========================================
    // 🆕 ドロップダウン（データ入力規則）の設定
    // ========================================
    if (dataLastRow >= 5) {
      // E列: テンプレートID（Import_TemplatesシートのA列を参照）
      var templateValidation = SpreadsheetApp.newDataValidation()
        .requireValueInRange(ss.getSheetByName('Import_Templates').getRange('A2:A50'), true)
        .setAllowInvalid(true)
        .setHelpText('テンプレートIDを選択してください')
        .build();
      sheet.getRange(5, 5, dataLastRow - 4, 1).setDataValidation(templateValidation);

      // G列: 仕入先（参照データシートのD列を参照）
      var supplierValidation = SpreadsheetApp.newDataValidation()
        .requireValueInRange(ss.getSheetByName('参照データ').getRange('D2:D35'), true)
        .setAllowInvalid(true)
        .setHelpText('仕入先を選択してください')
        .build();
      sheet.getRange(5, 7, dataLastRow - 4, 1).setDataValidation(supplierValidation);

      // X列: 配送方法（EP, CE, CF, CD, EL, AM）
      var shippingMethodValidation = SpreadsheetApp.newDataValidation()
        .requireValueInList(['EP', 'CE', 'CF', 'CD', 'EL', 'AM'], true)
        .setAllowInvalid(true)
        .setHelpText('配送方法を選択してください（式による自動設定も可）')
        .build();
      sheet.getRange(5, CONFIG.COLUMNS.METHOD, dataLastRow - 4, 1).setDataValidation(shippingMethodValidation);

      // AE列: 商品状態（新品、中古）
      var conditionValidation = SpreadsheetApp.newDataValidation()
        .requireValueInList(['新品', '中古'], true)
        .setAllowInvalid(false)
        .setHelpText('商品状態を選択してください')
        .build();
      sheet.getRange(5, CONFIG.COLUMNS.CONDITION, dataLastRow - 4, 1).setDataValidation(conditionValidation);
    }

    // ========================================
    // 🆕 設定セル（O1, O2, P2, F1, F2, H2）のドロップダウン設定
    // ========================================

    // O1: カテゴリー（送料上限カテゴリー）
    var categories = [
      '汎用（上限なし）',
      'Video Games（$20）',
      'Books（$20）',
      'Movies & TV（$20）',
      'Music（$25）',
      'Game Consoles（$50）'
    ];
    var o1Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(categories, true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('O1').setDataValidation(o1Rule);
    // O1のデフォルト値が空の場合のみ設定
    if (!sheet.getRange('O1').getValue()) {
      sheet.getRange('O1').setValue('汎用（上限なし）');
    }

    // O2: テンプレート名（Policy_Masterから取得）
    try {
      var policyMaster = ss.getSheetByName('Policy_Master');
      if (policyMaster) {
        var lastRow = policyMaster.getLastRow();
        var templateNames = [];
        var data = policyMaster.getRange(1, 1, lastRow, 2).getValues();

        for (var i = 0; i < data.length; i++) {
          var name = String(data[i][1] || '');
          // Templates セクションのテンプレート標準名から名前部分を抽出
          if (name.indexOf('Template_') === 0) {
            var match = name.match(/^Template_(.+?)_(?:new|used)_(?:eco|xp)$/);
            if (match && match[1] && templateNames.indexOf(match[1]) === -1) {
              templateNames.push(match[1]);
            }
          }
        }

        if (templateNames.length > 0) {
          var o2Rule = SpreadsheetApp.newDataValidation()
            .requireValueInList(templateNames, true)
            .setAllowInvalid(false)
            .build();
          sheet.getRange('O2').setDataValidation(o2Rule);
          // O2のデフォルト値が空の場合のみ設定
          if (!sheet.getRange('O2').getValue()) {
            sheet.getRange('O2').setValue(templateNames[0]);
          }
        }
      }
    } catch (ePolicyMaster) {
      console.log('Policy_Master未作成のため、O2ドロップダウンをスキップ: ' + ePolicyMaster.message);
    }

    // P2: 商品状態モード
    var p2Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['新品', '中古', 'AI'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('P2').setDataValidation(p2Rule);
    // P2のデフォルト値が空の場合のみ設定
    if (!sheet.getRange('P2').getValue()) {
      sheet.getRange('P2').setValue('AI');
    }

    // F1: 手数料率（13%～25%、1%単位）
    var feeRates = [];
    for (var i = 13; i <= 25; i++) {
      feeRates.push(i + '%');
    }
    var f1Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(feeRates, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange('F1').setDataValidation(f1Rule);
    // デフォルト値は設定しない（既存値を保持）

    // F2: 広告比率（0%～15%、1%単位）
    var adRates = [];
    for (var j = 0; j <= 15; j++) {
      adRates.push(j + '%');
    }
    var f2Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(adRates, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange('F2').setDataValidation(f2Rule);
    // デフォルト値は設定しない（既存値を保持）

    // H2: 利益率（0%～45%、1%単位）
    var profitRates = [];
    for (var k = 0; k <= 45; k++) {
      profitRates.push(k + '%');
    }
    var h2Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(profitRates, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange('H2').setDataValidation(h2Rule);
    // デフォルト値は設定しない（既存値を保持）

    // L2, M2: サイズ値（10～60、5刻み）
    var sizeValues = [];
    for (var s = 10; s <= 60; s += 5) {
      sizeValues.push(s);
    }
    var sizeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(sizeValues, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange('L2').setDataValidation(sizeRule);
    sheet.getRange('M2').setDataValidation(sizeRule);
    // デフォルト値は設定しない（既存値を保持）

    // N2: サイズ値（1, 2, 3, 5, 8, 10～60の5刻み）
    var heightValues = [1, 2, 3, 5, 8];
    for (var h = 10; h <= 60; h += 5) {
      heightValues.push(h);
    }
    var heightRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(heightValues, true)
      .setAllowInvalid(true)
      .build();
    sheet.getRange('N2').setDataValidation(heightRule);
    // デフォルト値は設定しない（既存値を保持）

    // R1: 送料計算用配送方法
    var shippingOptions = [
      '自動選択',
      'ePacket',
      'Cpass-Economy',
      'Cpass-FedEx',
      'Cpass-DHL',
      'eLogistics',
      'EMS'
    ];
    var r1Rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(shippingOptions, true)
      .setAllowInvalid(false)
      .setHelpText('送料計算に使用する配送方法を選択してください')
      .build();
    sheet.getRange('R1').setDataValidation(r1Rule);
    // デフォルト値は設定しない（既存値を保持）

    console.log('設定セル（O1, O2, P2, F1, F2, H2, L2, M2, N2, R1）のドロップダウンを設定しました');

    return { success: true };

  } catch (e) {
    return { success: false, error: e.message };
  }
}

function saveIntegratedDuplicateCheckSettings(duplicateData) {
  try {
    var docProps = PropertiesService.getDocumentProperties();

    // 基本設定の保存（DocumentPropertiesに保存）
    docProps.setProperty('DUPLICATE_CHECK_ENABLED', 'true');
    docProps.setProperty('DUPLICATE_CHECK_SOURCE_SHEET', duplicateData.sourceSheet);
    docProps.setProperty('DUPLICATE_CHECK_SOURCE_COLUMN', duplicateData.sourceColumn);
    docProps.setProperty('DUPLICATE_CHECK_TARGET_SHEETS', JSON.stringify(duplicateData.targetSheets));
    
    // 出力設定（オプション）
    if (duplicateData.applyToSheet) {
      // 重複チェック式をシートに直接適用
      var formData = {
        sourceSheet: duplicateData.sourceSheet,
        sourceColumn: duplicateData.sourceColumn,
        targetSheets: duplicateData.targetSheets,
        outputSheet: duplicateData.outputSheet,
        outputColumn: duplicateData.outputColumn,
        outputStartRow: duplicateData.outputStartRow,
        outputRange: duplicateData.outputRange
      };
      
      // 既存の重複チェック保存関数を呼び出し
      return saveDuplicateCheckSettings(formData);
    }
    
    return { success: true, message: '重複チェック設定を保存しました' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
/**
 * カテゴリー選択HTMLダイアログを表示（修正版）
 * @return {string|null} 選択されたカテゴリー、キャンセル時はnull
 */
function showCategorySelectionDialog() {
  try {
    var html;
    try {
      // まず .html ファイルを探す（ユーザーシート用）
      html = HtmlService.createHtmlOutputFromFile('CategorySelectionDialog');
    } catch (_) {
      // なければ HtmlTemplates.gs から取得（ライブラリ用）
      html = createHtmlFromTemplate('CategorySelectionDialog');
    }
    if (!html) {
      showAlert('CategorySelectionDialog.html が見つかりません', 'error');
      return null;
    }
    html.setWidth(480).setHeight(400);
    SpreadsheetApp.getUi().showModalDialog(html, 'カテゴリー選択');

    // ダイアログ結果を待つ（非同期処理のため、別の仕組みが必要）
    return null; // この戻り値は使用されない

  } catch (e) {
    console.error('カテゴリー選択ダイアログエラー: ' + e.message);
    showAlert('カテゴリー選択ダイアログの表示に失敗: ' + e.message, 'error');
    return null;
  }
}


/**
 * 🆕 選択行のR～AG列の計算式を再出力
 * V～AB列を直接入力して式が消えた場合に使用
 */
function reapplyCalculationFormulasToSelectedRows() {
  try {
    var settings = getSettings();
    if (!settings) return;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert("作業シート「" + settings.sheetName + "」が見つかりません", "error");
      return;
    }

    // AI～AQ列から設定値を読み取る
    var profitCalcText = sheet.getRange('AL2').getValue(); // "利益率" or "利益額"
    var profitCalc = (profitCalcText === '利益額') ? 'AMOUNT' : 'RATE';

    var shippingCalcText = sheet.getRange('AJ5').getValue(); // "テーブル計算" or "固定金額"
    var shippingCalc = (shippingCalcText === '固定金額') ? 'FIXED' : 'TABLE';

    // applyCalculationFormulas関数を呼び出して初期設定と同じ処理を実行
    var result = applyCalculationFormulas(settings.sheetName, {
      profitCalc: profitCalc,
      shippingCalcMethod: shippingCalc
    });

    if (!result.success) {
      showAlert("計算式の再出力エラー: " + result.error, "error");
      return;
    }

    // 完了ダイアログは表示しない

  } catch (e) {
    showAlert("計算式の再出力エラー: " + e.message, "error");
  }
}
