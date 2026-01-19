// ============================================
// データインポート一括処理関数
// ============================================

/**
 * データ検証→マスター反映を一括で実行する関数
 * 1. データ検証
 * 2. Policy_Masterに反映
 */
// ============================================
// データインポート一括処理関数
// ============================================

/**
 * データ検証→マスター反映を一括で実行する関数
 */
function validateAndApplyImport() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ui = SpreadsheetApp.getUi();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    
    // シートの存在確認
    if (!templateSheet || !policySheet) {
      showAlert('先に「インポート用シートを作成」を実行してください。', 'error');
      return;
    }
    
    // ============================================
    // ステップ1: データ検証(エラーは記録するが処理継続)
    // ============================================
    
    var report = '🔍 データ検証結果:\n\n';
    var templateErrorRows = []; // エラー行を記録
    
    // テンプレートの検証
    report += '【テンプレート】\n';
    var templateCount = 0;
    
    var templateLastRow = templateSheet.getLastRow();
    for (var i = 2; i <= templateLastRow; i++) {
      var id = templateSheet.getRange(i, 1).getValue();
      var jaName = templateSheet.getRange(i, 2).getValue();
      
      if (!id && !jaName) continue;
      if (String(id).indexOf('(例)') !== -1) continue;
      
      if (!id || !jaName) {
        templateErrorRows.push(i);
        templateSheet.getRange(i, 3).setValue('⚠️ ID/名前が空');
        continue;
      }
      
      var standardName = generateStandardTemplateName(jaName);
      if (standardName) {
        templateSheet.getRange(i, 3).setValue(standardName);
        templateCount++;
      } else {
        templateSheet.getRange(i, 3).setValue('⚠️ 変換失敗');
        templateErrorRows.push(i);
      }
    }
    
    report += '正常: ' + templateCount + '件\n';
    if (templateErrorRows.length > 0) {
      report += '⚠️ エラー: ' + templateErrorRows.length + '件 (行: ' + templateErrorRows.join(', ') + ')\n';
      report += '→ エラー行はスキップして反映されます\n';
    }
    
    // ポリシーの検証(2パス処理 + 手動用対応)
    report += '\n【シッピングポリシー】\n';
    
    // パス1: 全ポリシーを読み込み
    var policyLastRow = policySheet.getLastRow();
    var allPolicies = [];
    
    for (var j = 2; j <= policyLastRow; j++) {
      var policyId = policySheet.getRange(j, 1).getValue();
      var policyName = policySheet.getRange(j, 2).getValue();
      
      if (!policyId || !policyName) continue;
      if (String(policyId).indexOf('(例)') !== -1) continue;
      
      allPolicies.push({
        row: j,
        id: policyId,
        name: policyName,
        calculatedFee: null
      });
    }
    
    // パス2: 通常の価格範囲を先に計算
    for (var k = 0; k < allPolicies.length; k++) {
      var policy = allPolicies[k];
      if (policy.name.match(/_(\d{4})$/)) {
        policy.calculatedFee = calculateShippingFeeFromPolicyName(policy.name, null);
      }
    }
    
    // パス3: 上限なしを計算 + 手動用を検出
    var policyCount = 0;
    var manualPolicyCount = 0;
    
    for (var m = 0; m < allPolicies.length; m++) {
      var pol = allPolicies[m];
      var fee;
      
      if (pol.calculatedFee !== null) {
        fee = pol.calculatedFee;
      } else {
        fee = calculateShippingFeeFromPolicyName(pol.name, allPolicies);
      }
      
      if (fee !== null) {
        // 通常ポリシー
        policySheet.getRange(pol.row, 3).setValue(fee);
        policyCount++;
      } else {
        // 手動用ポリシー
        policySheet.getRange(pol.row, 3).setValue('手動用');
        manualPolicyCount++;
      }
    }
    
    report += '自動判定用: ' + policyCount + '件\n';
    report += '手動選択用: ' + manualPolicyCount + '件\n';
    
    report += '\n';
    
    // データが全くない場合のみ停止
    if (policyCount === 0 && manualPolicyCount === 0 && templateCount === 0) {
      report += '反映可能なデータが見つかりませんでした。';
      showAlert(report, 'info');
      return;
    }
    
    // エラーがあっても正常データがあれば継続
    if (templateErrorRows.length > 0) {
      report += '⚠️ 一部エラーがありますが、正常なデータのみ反映可能です。\n';
    }
    report += '✅ 検証が完了しました!';
    
    // 検証結果を表示
    showAlert(report, templateErrorRows.length > 0 ? 'warning' : 'success');
    
    // ============================================
    // ステップ2: 反映確認
    // ============================================
    
    var confirmMessage = 'データ検証が完了しました。\n\n';
    confirmMessage += '反映件数:\n';
    confirmMessage += '・テンプレート: ' + templateCount + '件\n';
    confirmMessage += '・ポリシー: ' + (policyCount + manualPolicyCount) + '件\n';
    if (templateErrorRows.length > 0) {
      confirmMessage += '\n⚠️ エラー行はスキップされます\n';
    }
    confirmMessage += '\nPolicy_Masterに反映しますか?';
    
    var confirmResponse = ui.alert(
      'Policy_Master反映確認',
      confirmMessage,
      ui.ButtonSet.YES_NO
    );
    
    if (confirmResponse !== ui.Button.YES) {
      showAlert('処理をキャンセルしました。データは検証済みです。', 'info');
      return;
    }
    
    // ============================================
    // ステップ3: マスターに反映(エラー行をスキップ)
    // ============================================
    
    applyImportToPolicyMaster();
    
  } catch (e) {
    showAlert('検証エラー: ' + e.message, 'error');
  }
}


/**
 * 改良版validateImportData - 結果オブジェクトを返す
 */
function validateImportData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var shippingSheet = ss.getSheetByName('Shipping_Policy_Import');
  var returnSheet = ss.getSheetByName('Return_Policy_Import');
  var errors = [];
  
  // シートの存在確認
  if (!shippingSheet || !returnSheet) {
    return {
      success: false,
      errors: ['インポート用シートが見つかりません。先に「インポート用シートを作成」を実行してください。']
    };
  }
  
  // Shipping Policy検証
  var shippingData = shippingSheet.getDataRange().getValues();
  if (shippingData.length <= 1) {
    errors.push('Shipping_Policy_Importにデータがありません。');
  } else {
    // 必須列のチェック
    var requiredColumns = ['Country', 'Shipping_Days_Min', 'Shipping_Days_Max', 'Shipping_Cost'];
    for (var i = 1; i < shippingData.length; i++) {
      var row = shippingData[i];
      if (!row[0]) continue; // 空行スキップ
      
      // 必須フィールドチェック
      if (!row[0] || row[1] === '' || row[2] === '' || row[3] === '') {
        errors.push('Shipping_Policy: 行' + (i + 1) + 'に必須項目の入力漏れがあります。');
      }
      
      // 数値チェック
      if (isNaN(row[1]) || isNaN(row[2]) || isNaN(row[3])) {
        errors.push('Shipping_Policy: 行' + (i + 1) + 'の数値が不正です。');
      }
    }
  }
  
  // Return Policy検証
  var returnData = returnSheet.getDataRange().getValues();
  if (returnData.length <= 1) {
    errors.push('Return_Policy_Importにデータがありません。');
  } else {
    for (var i = 1; i < returnData.length; i++) {
      var row = returnData[i];
      if (!row[0]) continue; // 空行スキップ
      
      // 必須フィールドチェック
      if (!row[0] || row[1] === '' || row[2] === '') {
        errors.push('Return_Policy: 行' + (i + 1) + 'に必須項目の入力漏れがあります。');
      }
      
      // 数値チェック
      if (isNaN(row[1])) {
        errors.push('Return_Policy: 行' + (i + 1) + 'の返品期限日数が不正です。');
      }
    }
  }
  
  if (errors.length > 0) {
    return {
      success: false,
      errors: errors
    };
  }
  
  return {
    success: true,
    message: 'データ検証が完了しました。\n' +
             'Shipping Policy: ' + (shippingData.length - 1) + '件\n' +
             'Return Policy: ' + (returnData.length - 1) + '件'
  };
}
/**
 * インポート機能のメニューを追加（既存のonOpenに追加）
 */
function addImportMenuItems(ui) {
  // 既存の onOpen() 関数内で呼び出す想定
  // または直接メニューに追加
}
function addReadmeMenu_() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('📖 README')
      .addItem('READMEを作成/更新', 'openReadme')
      .addItem('PDFを書き出す', 'exportReadmeToPDF_')
      .addToUi();
  } catch (e) {}
}

// 前回の設定を取得
function getPreviousSettings() {
  var userProperties = PropertiesService.getUserProperties();
  var settingsJson = userProperties.getProperty('templatePolicySettings');
  
  if (settingsJson) {
    return JSON.parse(settingsJson);
  }
  return null;
}

// 設定を適用して保存
function applyUnifiedSettingsWithSave(category, templateName, templateMode, policyMode, manualPolicyId, settings) {
  // 設定を保存
  var userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty('templatePolicySettings', JSON.stringify(settings));
  
  // 既存の適用処理を実行
  return applyUnifiedSettings(category, templateName, templateMode, policyMode, manualPolicyId);
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 統合版：データインポート機能（初期設定対応版v3）
  - シートデータのインポート
  - 初期設定値のインポート（APIキー除く）
  - 貼り付け位置の自動調整
  - シート位置の保持
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function showDataImportDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('UnifiedDataImportDialog')
      .setWidth(900).setHeight(780);
    SpreadsheetApp.getUi().showModalDialog(html, '📥 データインポート');
  } catch (e) {
    showAlert('ダイアログ表示エラー: ' + e.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 初期設定インポートダイアログ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 初期設定インポートダイアログを表示
 */
function showSettingsImportDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('SettingsImportDialog')
      .setWidth(700).setHeight(650);
    SpreadsheetApp.getUi().showModalDialog(html, '⚙️ 初期設定インポート');
  } catch (e) {
    showAlert('ダイアログ表示エラー: ' + e.message, 'error');
  }
}

/**
 * メニューに追加する例
 * 既存のonOpen()関数に以下を追加してください：
 * 
 * function onOpen() {
 *   var ui = SpreadsheetApp.getUi();
 *   ui.createMenu('📥 データ管理')
 *     .addItem('📤 設定をエクスポート', 'exportSettingsToSheet')
 *     .addItem('⚙️ 初期設定インポート', 'showSettingsImportDialog')
 *     .addItem('📥 データインポート', 'showDataImportDialog')
 *     .addToUi();
 * }
 */

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 初期設定インポートダイアログ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 初期設定インポートダイアログを表示
 */
function showSettingsImportDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('SettingsImportDialog')
      .setWidth(700).setHeight(650);
    SpreadsheetApp.getUi().showModalDialog(html, '⚙️ 初期設定インポート');
  } catch (e) {
    showAlert('ダイアログ表示エラー: ' + e.message, 'error');
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 初期設定情報の取得
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * インポート元の初期設定情報を取得（値付き）
 */
function getSourceSettings(sourceUrl) {
  try {
    var result = getSettingsFromSource(sourceUrl);
    
    if (!result.success) {
      return result;
    }
    
    var sourceSettings = result.settings;
    
    // 設定項目の定義（値付き）
    var settingGroups = {
      basic: {
        title: '📋 基本設定',
        settings: [
          { key: 'AI_MODEL', label: 'AIモデル', type: 'text', value: sourceSettings['AI_MODEL'] || '' },
          { key: 'SHEET_NAME', label: '作業シート名', type: 'text', value: sourceSettings['SHEET_NAME'] || '' },
          { key: 'PROMPT_ID', label: 'プロンプトID', type: 'text', value: sourceSettings['PROMPT_ID'] || '' },
          { key: 'SHOW_POPUPS', label: 'ポップアップ表示', type: 'boolean', value: sourceSettings['SHOW_POPUPS'] || 'false' }
        ]
      },
      profit: {
        title: '💰 利益・送料設定',
        settings: [
          { key: 'PROFIT_CALC_METHOD', label: '利益計算方法', type: 'text', value: sourceSettings['PROFIT_CALC_METHOD'] || '' },
          { key: 'SHIPPING_CALC_METHOD', label: '送料計算方法', type: 'text', value: sourceSettings['SHIPPING_CALC_METHOD'] || '' },
          { key: 'SHIPPING_THRESHOLD', label: '送料切替基準金額', type: 'number', value: sourceSettings['SHIPPING_THRESHOLD'] || '' },
          { key: 'LOW_PRICE_SHIPPING_METHOD', label: '低価格商品配送方法', type: 'text', value: sourceSettings['LOW_PRICE_SHIPPING_METHOD'] || '' },
          { key: 'HIGH_PRICE_SHIPPING_METHOD', label: '高価格商品配送方法', type: 'text', value: sourceSettings['HIGH_PRICE_SHIPPING_METHOD'] || '' }
        ]
      },
      ddu: {
        title: '💵 DDU価格調整設定',
        settings: [
          { key: 'DDU_ADJUSTMENT_ENABLED', label: 'DDU調整機能', type: 'boolean', value: sourceSettings['DDU_ADJUSTMENT_ENABLED'] || 'false' },
          { key: 'DDU_THRESHOLD', label: 'DDU閾値', type: 'number', value: sourceSettings['DDU_THRESHOLD'] || '' },
          { key: 'DDU_ADJUSTMENT_AMOUNT', label: 'DDU調整額', type: 'number', value: sourceSettings['DDU_ADJUSTMENT_AMOUNT'] || '' },
          { key: 'PRICE_DISPLAY_MODE', label: '価格表示モード', type: 'text', value: sourceSettings['PRICE_DISPLAY_MODE'] || '' }
        ]
      },
      duplicate: {
        title: '🔍 重複チェック設定',
        settings: [
          { key: 'DUPLICATE_CHECK_ENABLED', label: '重複チェック有効化', type: 'boolean', value: sourceSettings['DUPLICATE_CHECK_ENABLED'] || 'false' },
          { key: 'DUPLICATE_SOURCE_SHEET', label: 'ソースシート', type: 'text', value: sourceSettings['DUPLICATE_SOURCE_SHEET'] || '' },
          { key: 'DUPLICATE_SOURCE_COLUMN', label: 'ソース列', type: 'text', value: sourceSettings['DUPLICATE_SOURCE_COLUMN'] || '' },
          { key: 'DUPLICATE_TARGET_SHEETS', label: 'ターゲットシート設定', type: 'json', value: sourceSettings['DUPLICATE_TARGET_SHEETS'] || '' },
          { key: 'DUPLICATE_APPLY_TO_SHEET', label: 'シート適用', type: 'boolean', value: sourceSettings['DUPLICATE_APPLY_TO_SHEET'] || 'false' },
          { key: 'DUPLICATE_OUTPUT_SHEET', label: '出力シート', type: 'text', value: sourceSettings['DUPLICATE_OUTPUT_SHEET'] || '' },
          { key: 'DUPLICATE_OUTPUT_COLUMN', label: '出力列', type: 'text', value: sourceSettings['DUPLICATE_OUTPUT_COLUMN'] || '' },
          { key: 'DUPLICATE_OUTPUT_START_ROW', label: '出力開始行', type: 'text', value: sourceSettings['DUPLICATE_OUTPUT_START_ROW'] || '' },
          { key: 'DUPLICATE_OUTPUT_RANGE', label: '出力範囲', type: 'text', value: sourceSettings['DUPLICATE_OUTPUT_RANGE'] || '' }
        ]
      }
    };
    
    return {
      success: true,
      spreadsheetName: result.sourceSpreadsheet,
      settingGroups: settingGroups
    };
    
  } catch (e) {
    return { success: false, error: 'スプレッドシートを開けません: ' + e.message };
  }
}

/**
 * 現在のスプレッドシートの設定値を取得（プレビュー用）
 */
function getCurrentSettings() {
  try {
    var props = PropertiesService.getDocumentProperties();
    var allProps = props.getProperties();
    
    // APIキーを除外
    delete allProps.OPENAI_API_KEY;
    delete allProps.CLAUDE_API_KEY;
    delete allProps.GEMINI_API_KEY;
    delete allProps.AI_PLATFORM;  // プラットフォームもAPIキーに関連するため除外
    
    return {
      success: true,
      settings: allProps
    };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * インポート元スプレッドシートから設定値を取得
 */
function getSettingsFromSource(sourceUrl) {
  try {
    // 注意: Google Apps Scriptの制限により、
    // 別のスプレッドシートのScriptPropertiesを直接読み取ることはできません。
    // この関数は、ユーザーがインポート元のスプレッドシートを
    // 一時的にアクティブにした状態で実行する必要があります。
    
    var sourceSS = SpreadsheetApp.openByUrl(sourceUrl);
    var scriptId = sourceSS.getId();
    
    // 代替案: 設定値を特定のシート（例：「設定」シート）に保存しておく
    var settingsSheet = sourceSS.getSheetByName('初期設定値');
    
    if (!settingsSheet) {
      return {
        success: false,
        error: 'インポート元に「初期設定値」シートが見つかりません。\n\n' +
               '💡 代替方法：\n' +
               '1. インポート元スプレッドシートを開く\n' +
               '2. メニューから「設定エクスポート」を実行\n' +
               '3. このスプレッドシートで「設定インポート」を実行'
      };
    }
    
    var settings = {};
    var lastRow = settingsSheet.getLastRow();
    
    for (var i = 2; i <= lastRow; i++) {
      var key = settingsSheet.getRange(i, 1).getValue();
      var value = settingsSheet.getRange(i, 2).getValue();
      
      if (key) {
        settings[key] = value;
      }
    }
    
    return {
      success: true,
      settings: settings,
      sourceSpreadsheet: sourceSS.getName()
    };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 設定値のインポート機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 選択された設定項目をインポート（モード選択対応）
 */
function importSelectedSettings(sourceUrl, mode, selectedKeys) {
  try {
    // インポート元から設定を取得
    var sourceResult = getSettingsFromSource(sourceUrl);
    
    if (!sourceResult.success) {
      return sourceResult;
    }
    
    var sourceSettings = sourceResult.settings;
    var targetProps = PropertiesService.getDocumentProperties();
    var imported = [];
    var skipped = [];
    
    // モードによって処理を分岐
    if (mode === 'all') {
      // 全設定を一括インポート（APIキー除く）
      for (var key in sourceSettings) {
        if (sourceSettings.hasOwnProperty(key)) {
          // APIキー関連はスキップ
          if (key.indexOf('API_KEY') >= 0 || key === 'AI_PLATFORM') {
            skipped.push(key + ' (セキュリティのため除外)');
            continue;
          }
          
          targetProps.setProperty(key, sourceSettings[key]);
          imported.push(key);
        }
      }
    } else if (mode === 'selected') {
      // 選択された設定のみインポート
      if (!selectedKeys || selectedKeys.length === 0) {
        return { success: false, error: '設定項目が選択されていません' };
      }
      
      for (var i = 0; i < selectedKeys.length; i++) {
        var key = selectedKeys[i];
        
        // APIキー関連はスキップ
        if (key.indexOf('API_KEY') >= 0 || key === 'AI_PLATFORM') {
          skipped.push(key + ' (セキュリティのため除外)');
          continue;
        }
        
        if (sourceSettings.hasOwnProperty(key)) {
          targetProps.setProperty(key, sourceSettings[key]);
          imported.push(key);
        } else {
          skipped.push(key + ' (インポート元に存在しません)');
        }
      }
    } else {
      return { success: false, error: '不明なモード: ' + mode };
    }
    
    return {
      success: true,
      mode: mode,
      imported: imported,
      skipped: skipped,
      sourceSpreadsheet: sourceResult.sourceSpreadsheet
    };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * 選択された設定項目をインポート（後方互換用）
 */
function importSettings(sourceUrl, selectedKeys) {
  return importSelectedSettings(sourceUrl, 'selected', selectedKeys);
}

/**
 * すべての設定値を一括インポート（APIキー除く）
 * 後方互換性のため残していますが、内部的にはimportSelectedSettingsを呼び出します
 */
function importAllSettings(sourceUrl) {
  return importSelectedSettings(sourceUrl, 'all', null);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🆕 設定エクスポート機能（インポート元で実行）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 現在の設定を「初期設定値」シートにエクスポート
 * インポート元スプレッドシートでこの関数を実行してください
 */
function exportSettingsToSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var props = PropertiesService.getDocumentProperties();
    var allProps = props.getProperties();
    
    // APIキーを除外
    delete allProps.OPENAI_API_KEY;
    delete allProps.CLAUDE_API_KEY;
    delete allProps.GEMINI_API_KEY;
    delete allProps.AI_PLATFORM;
    
    // シートを作成または取得
    var sheet = ss.getSheetByName('初期設定値');
    if (!sheet) {
      sheet = ss.insertSheet('初期設定値');
    } else {
      sheet.clear();
    }
    
    // ヘッダー行
    sheet.getRange(1, 1, 1, 2).setValues([['設定キー', '設定値']]);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#4CAF50').setFontColor('#FFFFFF');
    
    // 設定値を書き込み
    var row = 2;
    for (var key in allProps) {
      if (allProps.hasOwnProperty(key)) {
        sheet.getRange(row, 1).setValue(key);
        sheet.getRange(row, 2).setValue(allProps[key]);
        row++;
      }
    }
    
    // 列幅を自動調整
    sheet.autoResizeColumn(1);
    sheet.autoResizeColumn(2);
    
    SpreadsheetApp.getUi().alert(
      '設定エクスポート完了',
      '✅ 設定値を「初期設定値」シートにエクスポートしました。\n\n' +
      'エクスポートされた項目数: ' + (row - 2) + '\n\n' +
      '💡 このスプレッドシートをインポート元として、\n' +
      '他のスプレッドシートから設定をインポートできます。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    return { success: true, count: row - 2 };
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('エラー', 'エクスポートエラー: ' + e.message, SpreadsheetApp.getUi().ButtonSet.OK);
    return { success: false, error: e.message };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  既存のシートインポート機能（変更なし）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function getSourceSheetsInfo(sourceUrl) {
  try {
    var sourceSS = SpreadsheetApp.openByUrl(sourceUrl);
    var sheets = sourceSS.getSheets();
    var sheetInfo = [];
    
    for (var i = 0; i < sheets.length; i++) {
      var sheet = sheets[i];
      var lastRow = sheet.getLastRow();
      var lastCol = sheet.getLastColumn();
      
      var sheetType = detectSheetType_(sheet.getName());
      
      // 除外対象シートはスキップ
      if (sheetType.excluded) {
        continue;
      }
      
      sheetInfo.push({
        name: sheet.getName(),
        rows: lastRow,
        cols: lastCol,
        type: sheetType.type,
        description: sheetType.description,
        recommended: sheetType.recommended,
        protectedRows: sheetType.protectedRows || 0,
        isDangerous: sheetType.isDangerous || false,
        isRecommended: sheetType.isRecommended || false,
        index: i
      });
    }
    
    return { 
      success: true, 
      spreadsheetName: sourceSS.getName(),
      sheets: sheetInfo 
    };
    
  } catch (e) {
    return { success: false, error: 'スプレッドシートを開けません: ' + e.message };
  }
}

function detectSheetType_(sheetName) {
  // 出品用シートは除外（選択肢に表示しない）
  if (sheetName.indexOf('出品用') >= 0 || sheetName === '出品用シート') {
    return {
      type: 'excluded',
      description: 'インポート対象外',
      recommended: null,
      protectedRows: 0,
      excluded: true
    };
  }
  
  var types = {
    // 🔴 危険なシート
    '作業シート': { 
      type: 'dangerous', 
      description: '⚠️【要注意】このシートには重要な計算式が含まれています！\n' +
                   '理由：\n' +
                   '• G列に重要な計算式があり、コピーすると壊れます\n' +
                   '• セル参照が壊れてシート全体が動作しなくなる可能性があります\n' +
                   '• 数式やデータ検証が上書きされると復旧が困難です\n\n' +
                   '推奨方法：手作業でのコピペ、または「値のみ貼り付け」を使用してください',
      recommended: 'range_values_only',
      protectedRows: 4,
      isDangerous: true
    },
    
    // ✅ 推奨シート
    'キーワード': {
      type: 'recommended',
      description: 'キーワードデータ',
      recommended: 'full_copy',
      protectedRows: 0,
      isRecommended: false
    },
    '参照データ': {
      type: 'recommended',
      description: 'カテゴリー別設定',
      recommended: 'full_copy',
      protectedRows: 0,
      isRecommended: false
    },
    'データ入力依頼シート': {
      type: 'recommended',
      description: 'データ入力依頼用',
      recommended: 'full_copy',
      protectedRows: 0,
      isRecommended: false
    },
    
    // その他のシート（基本的に不要）
    'Policy_Master': { 
      type: 'optional', 
      description: 'テンプレート・ポリシーマスター（基本的に不要）',
      recommended: null,
      protectedRows: 0
    },
    'Shipping_Rates': { 
      type: 'optional', 
      description: '送料テーブル（基本的に不要）',
      recommended: null,
      protectedRows: 0
    },
    'Shipping_Methods': { 
      type: 'optional', 
      description: '配送方法マスター（基本的に不要）',
      recommended: null,
      protectedRows: 0
    },
    'Profit_Amounts': { 
      type: 'optional', 
      description: '利益額テーブル（基本的に不要）',
      recommended: null,
      protectedRows: 0
    },
    'GPT_Prompts': { 
      type: 'optional', 
      description: 'AIプロンプト設定（基本的に不要）',
      recommended: null,
      protectedRows: 0
    }
  };
  
  if (types[sheetName]) {
    return types[sheetName];
  }
  
  // 保存データシート（推奨）
  if (sheetName.indexOf('保存データ_') === 0) {
    return {
      type: 'recommended',
      description: '保存済みデータ',
      recommended: 'append_values',
      protectedRows: 4,
      isRecommended: false
    };
  }
  
  // その他（基本的に不要）
  return {
    type: 'other',
    description: 'その他のシート（基本的に不要）',
    recommended: null,
    protectedRows: 0
  };
}

function getSheetPreview(sourceUrl, sheetName, startRow, endRow, condition) {
  try {
    var sourceSS = SpreadsheetApp.openByUrl(sourceUrl);
    var sheet = sourceSS.getSheetByName(sheetName);
    
    if (!sheet) {
      return { success: false, error: 'シートが見つかりません' };
    }
    
    var actualStartRow = Math.max(1, parseInt(startRow) || 1);
    var actualEndRow = Math.min(sheet.getLastRow(), parseInt(endRow) || sheet.getLastRow());
    
    var matchingRows = [];
    if (condition && condition !== 'none') {
      for (var row = actualStartRow; row <= actualEndRow; row++) {
        if (matchesCondition_(sheet, row, condition)) {
          matchingRows.push(row);
        }
      }
    }
    
    var rowCount = condition && condition !== 'none' ? matchingRows.length : (actualEndRow - actualStartRow + 1);
    
    if (rowCount <= 0) {
      return { 
        success: true,
        preview: [],
        totalRows: 0,
        message: '条件に一致する行がありません'
      };
    }
    
    var previewRows = Math.min(10, rowCount);
    var previewData = [];
    
    if (condition && condition !== 'none') {
      for (var i = 0; i < Math.min(previewRows, matchingRows.length); i++) {
        var row = matchingRows[i];
        previewData.push(sheet.getRange(row, 1, 1, Math.min(10, sheet.getLastColumn())).getValues()[0]);
      }
    } else {
      previewData = sheet.getRange(actualStartRow, 1, previewRows, Math.min(10, sheet.getLastColumn())).getValues();
    }
    
    return {
      success: true,
      preview: previewData,
      totalRows: rowCount,
      actualStartRow: actualStartRow,
      actualEndRow: actualEndRow
    };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function matchesCondition_(sheet, row, condition) {
  try {
    switch (condition) {
      case 'untranslated':
        var jpTitle = sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).getValue();
        var jpDesc = sheet.getRange(row, CONFIG.COLUMNS.JP_DESC).getValue();
        var costYen = Number(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());
        var enTitle = sheet.getRange(row, CONFIG.COLUMNS.EN_TITLE).getValue();
        return jpTitle && jpDesc && costYen > 0 && !enTitle;
        
      case 'translated':
        var enTitle = sheet.getRange(row, CONFIG.COLUMNS.EN_TITLE).getValue();
        var enDesc = sheet.getRange(row, CONFIG.COLUMNS.EN_DESC).getValue();
        return enTitle && enDesc;
        
      case 'has_error':
        var condition = sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue();
        return condition === 'エラー';
        
      case 'no_template':
        var template = sheet.getRange(row, 5).getValue();
        return !template || template === 'エラー' || template === '該当なし';
        
      case 'no_policy':
        var policy = sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).getValue();
        return !policy || policy === 'エラー' || policy === '該当なし';
        
      case 'all':
        var jpTitle = sheet.getRange(row, CONFIG.COLUMNS.JP_TITLE).getValue();
        return !!jpTitle;
        
      default:
        return true;
    }
  } catch (e) {
    return false;
  }
}

function importWithUnifiedSettings(sourceUrl, importConfigs) {
  try {
    var sourceSS = SpreadsheetApp.openByUrl(sourceUrl);
    var targetSS = SpreadsheetApp.getActiveSpreadsheet();
    var results = [];
    
    for (var i = 0; i < importConfigs.length; i++) {
      var config = importConfigs[i];
      
      try {
        var result = importSheetWithConfig_(sourceSS, targetSS, config);
        results.push({
          sheetName: config.sheetName,
          success: true,
          rowsImported: result.rowsImported,
          mode: config.importMode
        });
      } catch (e) {
        console.error('インポートエラー [' + config.sheetName + ']: ' + e.message);
        results.push({
          sheetName: config.sheetName,
          success: false,
          error: e.message
        });
      }
    }
    
    return { success: true, results: results };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function importSheetWithConfig_(sourceSS, targetSS, config) {
  var sourceSheet = sourceSS.getSheetByName(config.sheetName);
  if (!sourceSheet) {
    throw new Error('インポート元シート「' + config.sheetName + '」が見つかりません');
  }
  
  var targetSheetName = config.targetSheetName || config.sheetName;
  var sheetType = detectSheetType_(config.sheetName);
  
  switch (config.importMode) {
    case 'full_copy':
      return importFullCopy_(sourceSheet, targetSS, targetSheetName);
      
    case 'range_with_format':
      return importRangeWithFormat_(sourceSheet, targetSS, targetSheetName, config, sheetType);
      
    case 'range_values_only':
      return importRangeValuesOnly_(sourceSheet, targetSS, targetSheetName, config, sheetType);
      
    case 'append_values':
      return appendValuesToSheet_(sourceSheet, targetSS, targetSheetName, config, sheetType);
      
    case 'conditional':
      return importConditionalData_(sourceSheet, targetSS, targetSheetName, config, sheetType);
      
    default:
      throw new Error('不明なインポートモード: ' + config.importMode);
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔧 データ検証・シート位置を完全保持
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

function importFullCopy_(sourceSheet, targetSS, targetSheetName) {
  console.log('=== 完全コピー開始: ' + targetSheetName + ' ===');
  
  var lastRow = sourceSheet.getLastRow();
  var lastCol = sourceSheet.getLastColumn();
  
  if (lastRow === 0 || lastCol === 0) {
    throw new Error('インポート元シート「' + sourceSheet.getName() + '」にデータがありません');
  }
  
  var existingSheet = targetSS.getSheetByName(targetSheetName);
  var originalPosition = null;
  
  if (existingSheet) {
    originalPosition = existingSheet.getIndex();
    console.log('既存シート位置: ' + originalPosition);
    targetSS.deleteSheet(existingSheet);
  }
  
  var newSheet = sourceSheet.copyTo(targetSS);
  newSheet.setName(targetSheetName);
  
  console.log('✓ シート全体をコピー完了（データ検証・フォーマット含む）');
  
  if (originalPosition !== null) {
    targetSS.setActiveSheet(newSheet);
    targetSS.moveActiveSheet(originalPosition);
    console.log('✓ シートを元の位置(' + originalPosition + ')に移動完了');
  }
  
  console.log('=== 完全コピー完了: ' + lastRow + '行 ===');
  
  return { rowsImported: lastRow };
}

function importRangeWithFormat_(sourceSheet, targetSS, targetSheetName, config, sheetType) {
  console.log('=== 範囲指定（フォーマット込み）開始 ===');
  
  var targetSheet = targetSS.getSheetByName(targetSheetName);
  var isNewSheet = !targetSheet;
  
  if (!targetSheet) {
    targetSheet = targetSS.insertSheet(targetSheetName);
  }
  
  var startRow = parseInt(config.startRow) || 1;
  var endRow = parseInt(config.endRow) || sourceSheet.getLastRow();
  var startCol = parseInt(config.startCol) || 1;
  var endCol = parseInt(config.endCol) || sourceSheet.getLastColumn();
  
  var rowCount = endRow - startRow + 1;
  var colCount = endCol - startCol + 1;
  
  var targetStartRow = parseInt(config.targetStartRow) || startRow;
  var targetStartCol = parseInt(config.targetStartCol) || startCol;
  
  console.log('コピー範囲: 行' + startRow + '〜' + endRow + ', 列' + startCol + '〜' + endCol);
  console.log('貼り付け位置: 行' + targetStartRow + ', 列' + targetStartCol);
  
  if (rowCount <= 0 || colCount <= 0) {
    throw new Error('無効な範囲です');
  }
  
  var protectedRows = sheetType.protectedRows || 0;
  if (!isNewSheet && targetStartRow <= protectedRows) {
    throw new Error('1〜' + protectedRows + '行目は保護されています。' + (protectedRows + 1) + '行目以降を指定してください。');
  }
  
  var SKIP_COLUMN_G = 7;
  var isWorkSheet = (targetSheetName === '作業シート');
  
  if (isWorkSheet) {
    console.log('⚠️ 作業シートのため、G列（7列目）は除外します');
  }
  
  try {
    for (var rowOffset = 0; rowOffset < rowCount; rowOffset++) {
      for (var colOffset = 0; colOffset < colCount; colOffset++) {
        var sourceCol = startCol + colOffset;
        var targetCol = targetStartCol + colOffset;
        
        if (isWorkSheet && (sourceCol === SKIP_COLUMN_G || targetCol === SKIP_COLUMN_G)) {
          continue;
        }
        
        var sourceCell = sourceSheet.getRange(startRow + rowOffset, sourceCol);
        var targetCell = targetSheet.getRange(targetStartRow + rowOffset, targetCol);
        
        targetCell.setValue(sourceCell.getValue());
        targetCell.setBackground(sourceCell.getBackground());
        targetCell.setFontColor(sourceCell.getFontColor());
        targetCell.setFontSize(sourceCell.getFontSize());
        targetCell.setFontWeight(sourceCell.getFontWeight());
        targetCell.setNumberFormat(sourceCell.getNumberFormat());
        targetCell.setHorizontalAlignment(sourceCell.getHorizontalAlignment());
      }
    }
    
    console.log('✓ 完全コピー完了');
    
  } catch (e) {
    console.error('❌ コピーエラー: ' + e.message);
    throw new Error('データコピー中にエラー: ' + e.message);
  }
  
  console.log('=== 範囲指定コピー完了 ===');
  return { rowsImported: rowCount };
}

function importRangeValuesOnly_(sourceSheet, targetSS, targetSheetName, config, sheetType) {
  console.log('=== 範囲指定（値のみ）開始 ===');
  
  var targetSheet = targetSS.getSheetByName(targetSheetName);
  var isNewSheet = !targetSheet;
  
  if (!targetSheet) {
    targetSheet = targetSS.insertSheet(targetSheetName);
  }
  
  var startRow = parseInt(config.startRow) || 1;
  var endRow = parseInt(config.endRow) || sourceSheet.getLastRow();
  var startCol = parseInt(config.startCol) || 1;
  var endCol = parseInt(config.endCol) || sourceSheet.getLastColumn();
  
  var rowCount = endRow - startRow + 1;
  var colCount = endCol - startCol + 1;
  
  var targetStartRow = parseInt(config.targetStartRow) || startRow;
  var targetStartCol = parseInt(config.targetStartCol) || startCol;
  
  console.log('コピー範囲: 行' + startRow + '〜' + endRow + ', 列' + startCol + '〜' + endCol);
  console.log('貼り付け位置: 行' + targetStartRow + ', 列' + targetStartCol);
  
  if (rowCount <= 0 || colCount <= 0) {
    throw new Error('無効な範囲です');
  }
  
  var protectedRows = sheetType.protectedRows || 0;
  if (!isNewSheet && targetStartRow <= protectedRows) {
    throw new Error('1〜' + protectedRows + '行目は保護されています。' + (protectedRows + 1) + '行目以降を指定してください。');
  }
  
  var SKIP_COLUMN_G = 7;
  var isWorkSheet = (targetSheetName === '作業シート');
  
  if (isWorkSheet) {
    console.log('⚠️ 作業シートのため、G列（7列目）は除外します');
  }
  
  try {
    for (var rowOffset = 0; rowOffset < rowCount; rowOffset++) {
      for (var colOffset = 0; colOffset < colCount; colOffset++) {
        var sourceCol = startCol + colOffset;
        var targetCol = targetStartCol + colOffset;
        
        if (isWorkSheet && (sourceCol === SKIP_COLUMN_G || targetCol === SKIP_COLUMN_G)) {
          continue;
        }
        
        var value = sourceSheet.getRange(startRow + rowOffset, sourceCol).getValue();
        targetSheet.getRange(targetStartRow + rowOffset, targetCol).setValue(value);
      }
    }
    
    console.log('✓ 値のコピー完了');
    
  } catch (e) {
    console.error('❌ コピーエラー: ' + e.message);
    throw new Error('データコピー中にエラー: ' + e.message);
  }
  
  console.log('=== 値のみコピー完了 ===');
  return { rowsImported: rowCount };
}

function appendValuesToSheet_(sourceSheet, targetSS, targetSheetName, config, sheetType) {
  console.log('=== 追加モード開始 ===');
  
  var targetSheet = targetSS.getSheetByName(targetSheetName);
  if (!targetSheet) {
    throw new Error('追加先シート「' + targetSheetName + '」が見つかりません');
  }
  
  var startRow = parseInt(config.startRow) || 1;
  var endRow = parseInt(config.endRow) || sourceSheet.getLastRow();
  var startCol = parseInt(config.startCol) || 1;
  var endCol = parseInt(config.endCol) || sourceSheet.getLastColumn();
  
  var rowCount = endRow - startRow + 1;
  var colCount = endCol - startCol + 1;
  
  if (rowCount <= 0 || colCount <= 0) {
    throw new Error('無効な範囲です');
  }
  
  var protectedRows = sheetType.protectedRows || 0;
  var targetLastRow = targetSheet.getLastRow();
  var targetRow = Math.max(5, targetLastRow + 1);
  var targetCol = startCol;
  
  console.log('追加位置: 行' + targetRow + ', 列' + targetCol);
  
  var SKIP_COLUMN_G = 7;
  var isWorkSheet = (targetSheetName === '作業シート');
  
  if (isWorkSheet) {
    console.log('⚠️ 作業シートのため、G列（7列目）は除外します');
  }
  
  try {
    for (var rowOffset = 0; rowOffset < rowCount; rowOffset++) {
      for (var colOffset = 0; colOffset < colCount; colOffset++) {
        var sourceCol = startCol + colOffset;
        var targetColActual = targetCol + colOffset;
        
        if (isWorkSheet && (sourceCol === SKIP_COLUMN_G || targetColActual === SKIP_COLUMN_G)) {
          continue;
        }
        
        var sourceCell = sourceSheet.getRange(startRow + rowOffset, sourceCol);
        var targetCell = targetSheet.getRange(targetRow + rowOffset, targetColActual);
        
        try {
          targetCell.setValue(sourceCell.getValue());
          
          if (config.includeFormat) {
            targetCell.setBackground(sourceCell.getBackground());
            targetCell.setFontColor(sourceCell.getFontColor());
            targetCell.setFontSize(sourceCell.getFontSize());
            targetCell.setNumberFormat(sourceCell.getNumberFormat());
          }
        } catch (cellError) {
          console.warn('⚠️ セルコピー警告: ' + cellError.message);
        }
      }
    }
    
    console.log('✓ 値のコピー完了');
    
  } catch (e) {
    console.error('❌ 追加エラー: ' + e.message);
    throw new Error('データ追加中にエラー: ' + e.message);
  }
  
  console.log('=== 追加モード完了: ' + rowCount + '行 ===');
  return { rowsImported: rowCount };
}

function importConditionalData_(sourceSheet, targetSS, targetSheetName, config, sheetType) {
  console.log('=== 条件付きインポート開始 ===');
  
  var targetSheet = targetSS.getSheetByName(targetSheetName);
  if (!targetSheet) {
    throw new Error('インポート先シート「' + targetSheetName + '」が見つかりません');
  }
  
  var startRow = parseInt(config.startRow) || 5;
  var endRow = parseInt(config.endRow) || sourceSheet.getLastRow();
  var condition = config.condition || 'untranslated';
  
  var protectedRows = sheetType.protectedRows || 4;
  var targetLastRow = targetSheet.getLastRow();
  var targetRow = Math.max(5, targetLastRow + 1);
  
  console.log('条件: ' + condition);
  console.log('検索範囲: ' + startRow + '〜' + endRow + '行');
  console.log('追加開始位置: ' + targetRow + '行目');
  
  var importedCount = 0;
  var lastCol = sourceSheet.getLastColumn();
  
  var SKIP_COLUMN_G = 7;
  var isWorkSheet = (targetSheetName === '作業シート');
  
  if (isWorkSheet) {
    console.log('⚠️ 作業シートのため、G列（7列目）は除外します');
  }
  
  try {
    for (var row = startRow; row <= endRow; row++) {
      if (matchesCondition_(sourceSheet, row, condition)) {
        
        for (var col = 1; col <= lastCol; col++) {
          if (isWorkSheet && col === SKIP_COLUMN_G) {
            continue;
          }
          
          var sourceCell = sourceSheet.getRange(row, col);
          var targetCell = targetSheet.getRange(targetRow, col);
          
          try {
            targetCell.setValue(sourceCell.getValue());
            
            if (config.includeFormat) {
              targetCell.setBackground(sourceCell.getBackground());
              targetCell.setFontColor(sourceCell.getFontColor());
              targetCell.setFontSize(sourceCell.getFontSize());
              targetCell.setFontWeight(sourceCell.getFontWeight());
              targetCell.setNumberFormat(sourceCell.getNumberFormat());
              targetCell.setHorizontalAlignment(sourceCell.getHorizontalAlignment());
            }
          } catch (cellError) {
            console.warn('⚠️ セルコピー警告（行' + targetRow + ', 列' + col + '）: ' + cellError.message);
          }
        }
        
        targetRow++;
        importedCount++;
        
        if (importedCount % 50 === 0) {
          console.log('進捗: ' + importedCount + '行処理完了');
        }
      }
    }
    
  } catch (e) {
    console.error('❌ 条件付きインポートエラー: ' + e.message);
    throw new Error('条件付きインポート中にエラー: ' + e.message);
  }
  
  console.log('=== 条件付きインポート完了: ' + importedCount + '行 ===');
  return { rowsImported: importedCount };
}