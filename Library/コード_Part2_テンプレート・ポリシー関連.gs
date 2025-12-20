/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  汎用ユーティリティ

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Policy_Master シート管理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * Policy_Master シートを作成（ポリシー＋テンプレート統合版）
 */
function setupPolicyMasterSheet() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = 'Policy_Master';
    var sheet = ss.getSheetByName(sheetName);
    
    // 既存シート確認
    if (sheet) {
      var ui = SpreadsheetApp.getUi();
      var response = ui.alert(
        'シート作成確認',
        '「Policy_Master」シートは既に存在します。\n既存データを削除して再作成しますか？',
        ui.ButtonSet.YES_NO
      );
      
      if (response === ui.Button.YES) {
        ss.deleteSheet(sheet);
      } else {
        showAlert('キャンセルしました。', 'info');
        return;
      }
    }
    
    // 新規シート作成
    sheet = ss.insertSheet(sheetName);
    
    // ========== セクション1：Shipping Policies ==========
    
    // ヘッダー
    sheet.getRange('A1').setValue('【Shipping Policies】');
    sheet.getRange('A1:C1').mergeAcross();
    sheet.getRange('A1:C1').setFontWeight('bold').setFontSize(12)
      .setBackground('#4285f4').setFontColor('white')
      .setHorizontalAlignment('center');
    
    sheet.getRange('A2').setValue('Policy ID');
    sheet.getRange('B2').setValue('Policy Name');
    sheet.getRange('C2').setValue('送料上乗せ');
    sheet.getRange('A2:C2').setFontWeight('bold').setBackground('#cfe2f3');
    
    // 列幅設定
    sheet.setColumnWidth(1, 80);   // A列: ID
    sheet.setColumnWidth(2, 380);  // B列: 名称
    sheet.setColumnWidth(3, 90);   // C列: 送料上乗せ
    
    // ポリシーデータ（名称と送料上乗せのペア）
    var policiesData = [
      // エコノミー × 新品
      ['Egl_202510_eco_new_0001_0025', 15],
      ['Egl_202510_eco_new_0026_0050', 20],
      ['Egl_202510_eco_new_0051_0075', 25],
      ['Egl_202510_eco_new_0076_0100', 30],
      ['Egl_202510_eco_new_0101_0125', 35],
      ['Egl_202510_eco_new_0126_0150', 40],
      ['Egl_202510_eco_new_0151_0175', 45],
      ['Egl_202510_eco_new_0176_0200', 50],
      ['Egl_202510_eco_new_0201_0225', 55],
      ['Egl_202510_eco_new_0226_0250', 60],
      ['Egl_202510_eco_new_0251_0275', 65],
      ['Egl_202510_eco_new_0276_', 70],
      
      // エコノミー × 中古
      ['Egl_202510_eco_used_0001_0025', 15],
      ['Egl_202510_eco_used_0026_0050', 20],
      ['Egl_202510_eco_used_0051_0075', 25],
      ['Egl_202510_eco_used_0076_0100', 30],
      ['Egl_202510_eco_used_0101_0125', 35],
      ['Egl_202510_eco_used_0126_0150', 40],
      ['Egl_202510_eco_used_0151_0175', 45],
      ['Egl_202510_eco_used_0176_0200', 50],
      ['Egl_202510_eco_used_0201_0225', 55],
      ['Egl_202510_eco_used_0226_0250', 60],
      ['Egl_202510_eco_used_0251_0275', 65],
      ['Egl_202510_eco_used_0276_', 70],
      
      // XP × 新品
      ['Egl_202510_xp_new_0001_0025', 15],
      ['Egl_202510_xp_new_0026_0050', 20],
      ['Egl_202510_xp_new_0051_0075', 25],
      ['Egl_202510_xp_new_0076_0100', 30],
      ['Egl_202510_xp_new_0101_0125', 35],
      ['Egl_202510_xp_new_0126_0150', 40],
      ['Egl_202510_xp_new_0151_0175', 45],
      ['Egl_202510_xp_new_0176_0200', 50],
      ['Egl_202510_xp_new_0201_0225', 55],
      ['Egl_202510_xp_new_0226_0250', 60],
      ['Egl_202510_xp_new_0251_0275', 65],
      ['Egl_202510_xp_new_0276_0300', 70],
      ['Egl_202510_xp_new_0301_0325', 75],
      ['Egl_202510_xp_new_0326_0350', 80],
      ['Egl_202510_xp_new_0351_0375', 85],
      ['Egl_202510_xp_new_0376_0400', 91],
      ['Egl_202510_xp_new_0401_0425', 96],
      ['Egl_202510_xp_new_0426_0450', 101],
      ['Egl_202510_xp_new_0451_0475', 106],
      ['Egl_202510_xp_new_0476_0500', 111],
      ['Egl_202510_xp_new_0501_0525', 116],
      ['Egl_202510_xp_new_0526_0550', 121],
      ['Egl_202510_xp_new_0551_0575', 126],
      ['Egl_202510_xp_new_0576_0600', 131],
      ['Egl_202510_xp_new_0601_0625', 136],
      ['Egl_202510_xp_new_0626_0650', 141],
      ['Egl_202510_xp_new_0651_0675', 146],
      ['Egl_202510_xp_new_0676_0700', 151],
      ['Egl_202510_xp_new_0701_0725', 156],
      ['Egl_202510_xp_new_0726_0750', 161],
      ['Egl_202510_xp_new_0751_0775', 166],
      ['Egl_202510_xp_new_0776_0800', 172],
      ['Egl_202510_xp_new_0801_0850', 182],
      ['Egl_202510_xp_new_0851_0900', 192],
      ['Egl_202510_xp_new_0901_0950', 202],
      ['Egl_202510_xp_new_0951_1000', 212],
      ['Egl_202510_xp_new_1001_1100', 232],
      ['Egl_202510_xp_new_1101_1200', 253],
      ['Egl_202510_xp_new_1201_1300', 273],
      ['Egl_202510_xp_new_1301_1400', 293],
      ['Egl_202510_xp_new_1401_', 313],
      
      // XP × 中古
      ['Egl_202510_xp_used_0001_0025', 15],
      ['Egl_202510_xp_used_0026_0050', 20],
      ['Egl_202510_xp_used_0051_0075', 25],
      ['Egl_202510_xp_used_0076_0100', 30],
      ['Egl_202510_xp_used_0101_0125', 35],
      ['Egl_202510_xp_used_0126_0150', 40],
      ['Egl_202510_xp_used_0151_0175', 45],
      ['Egl_202510_xp_used_0176_0200', 50],
      ['Egl_202510_xp_used_0201_0225', 55],
      ['Egl_202510_xp_used_0226_0250', 60],
      ['Egl_202510_xp_used_0251_0275', 65],
      ['Egl_202510_xp_used_0276_0300', 70],
      ['Egl_202510_xp_used_0301_0325', 75],
      ['Egl_202510_xp_used_0326_0350', 80],
      ['Egl_202510_xp_used_0351_0375', 85],
      ['Egl_202510_xp_used_0376_0400', 91],
      ['Egl_202510_xp_used_0401_0425', 96],
      ['Egl_202510_xp_used_0426_0450', 101],
      ['Egl_202510_xp_used_0451_0475', 106],
      ['Egl_202510_xp_used_0476_0500', 111],
      ['Egl_202510_xp_used_0501_0525', 116],
      ['Egl_202510_xp_used_0526_0550', 121],
      ['Egl_202510_xp_used_0551_0575', 126],
      ['Egl_202510_xp_used_0576_0600', 131],
      ['Egl_202510_xp_used_0601_0625', 136],
      ['Egl_202510_xp_used_0626_0650', 141],
      ['Egl_202510_xp_used_0651_0675', 146],
      ['Egl_202510_xp_used_0676_0700', 151],
      ['Egl_202510_xp_used_0701_0725', 156],
      ['Egl_202510_xp_used_0726_0750', 161],
      ['Egl_202510_xp_used_0751_0775', 166],
      ['Egl_202510_xp_used_0776_0800', 172],
      ['Egl_202510_xp_used_0801_0850', 182],
      ['Egl_202510_xp_used_0851_0900', 192],
      ['Egl_202510_xp_used_0901_0950', 202],
      ['Egl_202510_xp_used_0951_1000', 212],
      ['Egl_202510_xp_used_1001_1100', 232],
      ['Egl_202510_xp_used_1101_1200', 253],
      ['Egl_202510_xp_used_1201_1300', 273],
      ['Egl_202510_xp_used_1301_1400', 293],
      ['Egl_202510_xp_used_1401_', 313]
    ];
    
    var policyData = [];
    for (var i = 0; i < policiesData.length; i++) {
      policyData.push([i + 1, policiesData[i][0], policiesData[i][1]]);
    }
    
    sheet.getRange(3, 1, policyData.length, 3).setValues(policyData);
    
    // ポリシーセクション終了位置
    var policyEndRow = 3 + policyData.length;
    
    // 罫線（ポリシーセクション）
    sheet.getRange(2, 1, policyData.length + 1, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    
    // ========== セクション区切り ==========
    
    var separatorRow = policyEndRow + 2;
    sheet.getRange(separatorRow, 1).setValue('');
    
    // ========== セクション2：Templates ==========
    
    var templateStartRow = separatorRow + 1;
    
    // ヘッダー
    sheet.getRange(templateStartRow, 1).setValue('【Templates】');
    sheet.getRange(templateStartRow, 1, 1, 3).mergeAcross();
    sheet.getRange(templateStartRow, 1, 1, 3).setFontWeight('bold').setFontSize(12)
      .setBackground('#34a853').setFontColor('white')
      .setHorizontalAlignment('center');
    
    var templateHeaderRow = templateStartRow + 1;
    sheet.getRange(templateHeaderRow, 1).setValue('Template ID');
    sheet.getRange(templateHeaderRow, 2).setValue('Template Name');
    sheet.getRange(templateHeaderRow, 3).setValue('説明');
    sheet.getRange(templateHeaderRow, 1, 1, 3).setFontWeight('bold').setBackground('#d9ead3');
    
  // テンプレートデータ（ID、名称、日本語説明）
var templates = [
  [1, 'Template_general_eco_new', '汎用 - エコノミー - 新品'],
  [2, 'Template_general_eco_used', '汎用 - エコノミー - 中古'],
  [3, 'Template_general_xp_new', '汎用 - XP - 新品'],
  [4, 'Template_general_xp_used', '汎用 - XP - 中古'],
  [5, 'Template_limited_eco_new', 'ゲーム・本（上限あり）- エコノミー - 新品'],
  [6, 'Template_limited_eco_used', 'ゲーム・本（上限あり）- エコノミー - 中古'],
  [7, 'Template_limited_xp_new', 'ゲーム・本（上限あり）- XP - 新品'],
  [8, 'Template_limited_xp_used', 'ゲーム・本（上限あり）- XP - 中古'],
  [9, 'Template_card_graded_eco', 'トレカ - Graded（鑑定済み）- エコノミー'],
  [10, 'Template_card_graded_xp', 'トレカ - Graded（鑑定済み）- XP'],
  [11, 'Template_card_raw_eco', 'トレカ - 未鑑定 - エコノミー'],
  [12, 'Template_card_raw_xp', 'トレカ - 未鑑定 - XP'],
  [13, 'Template_preorder_eco', '予約販売 - エコノミー'],
  [14, 'Template_preorder_xp', '予約販売 - XP']
];
    
    var templateDataRow = templateHeaderRow + 1;
    sheet.getRange(templateDataRow, 1, templates.length, 3).setValues(templates);
    
    // 列幅調整
    sheet.setColumnWidth(3, 280); // C列: 説明
    
    // 罫線（テンプレートセクション）
    sheet.getRange(templateHeaderRow, 1, templates.length + 1, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    
    // 完了メッセージ
    showAlert(
      'Policy_Master シートを作成しました。\n\n' +
      '【Shipping Policies】\n' +
      '登録件数: ' + policiesData.length + '件\n' +
      'C列に送料上乗せ価格を設定\n\n' +
      '【Templates】\n' +
      '登録件数: ' + templates.length + '件（12個）\n' +
      '・汎用: 4個\n' +
      '・ゲーム等（上限あり）: 4個\n' +
      '・トレカ: 2個\n' +
      '・予約販売: 2個\n\n' +
      '各セクションは罫線で区切られています。',
      'success'
    );
    
    // シートを表示
    ss.setActiveSheet(sheet);
    
  } catch (e) {
    showAlert('Policy_Master シート作成エラー: ' + e.message, 'error');
  }
}
/**
 * シッピングポリシー名称から情報をパース
 * @param {string} policyName - ポリシー名称（例：Egl_202510_eco_new_0076_0100）
 * @return {Object|null} パース結果 { shippingType, condition, minPrice, maxPrice }
 */
function parseShippingPolicyName(policyName) {
  try {
    if (!policyName || typeof policyName !== 'string') {
      return null;
    }
    
    // アンダースコアで分割
    var parts = policyName.split('_');
    
    // 最低限必要な要素数チェック（6要素以上）
    // 例: ['Egl', '202510', 'eco', 'new', '0076', '0100']
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
    
    // 価格範囲の判定
    var minPrice, maxPrice, adjustedMin;

    // 新形式: 上限値のみ（5要素）
    // 例: Egl_202510_eco_new_0010 → ['Egl', '202510', 'eco', 'new', '0010']
    if (parts.length === 5) {
      maxPrice = parseInt(parts[4], 10);
      if (isNaN(maxPrice)) {
        return null;
      }

      // 下限は0.01（Policy_Master内の前のポリシーの上限+0.01が実際の下限）
      // ここでは暫定的に0.01を設定し、判定ロジック側でソート済みデータから下限を決定
      adjustedMin = 0.01;

    } else if (parts.length >= 6) {
      // 旧形式: min_max形式（互換性維持）
      // 例: Egl_202510_eco_new_0001_0050 → ['Egl', '202510', 'eco', 'new', '0001', '0050']
      var minPriceStr = parts[parts.length - 2];
      var maxPriceStr = parts[parts.length - 1];

      minPrice = parseInt(minPriceStr, 10);
      maxPrice = maxPriceStr ? parseInt(maxPriceStr, 10) : 999999;

      if (isNaN(minPrice)) {
        return null;
      }

      // _0001_0050 → 1～50（50.00以下）
      // _0051_0075 → 51～75（50.01以上、つまり51.00未満は次の範囲の開始minPriceから0.01引く）
      adjustedMin = minPrice === 1 ? minPrice : minPrice - 0.99;

    } else {
      // 要素数が不足している場合はパース失敗
      return null;
    }
    
    return {
      shippingType: shippingType,
      condition: condition,
      minPrice: adjustedMin,
      maxPrice: isNaN(maxPrice) ? 999999 : maxPrice,
      originalName: policyName
    };
    
  } catch (e) {
    console.error('ポリシー名パースエラー: ' + e.message);
    return null;
  }
}
/**
 * カテゴリーの送料上限を取得
 * @param {string} category - カテゴリー名
 * @return {number|null} 送料上限（USD）、nullは上限なし
 */
function getShippingLimitForCategory(category) {
  try {
    var categories = CONFIG.SHIPPING_POLICY_CATEGORIES;
    
    if (categories[category] && typeof categories[category].limit !== 'undefined') {
      return categories[category].limit;
    }
    
    // カテゴリーが見つからない場合は「その他」扱い（上限なし）
    return null;
    
  } catch (e) {
    console.error('カテゴリー上限取得エラー: ' + e.message);
    return null;
  }
}
/**
 * 条件に合うシッピングポリシーIDを検索
 * @param {string} category - カテゴリー（例：Video Games）
 * @param {string} condition - 商品状態（新品/中古）
 * @param {string} shippingType - 配送タイプ（エコノミー/EX）
 * @param {number} estimatedTax - 想定関税（USD）
 * @return {number|null} ポリシーID、見つからない場合はnull
 */
function findShippingPolicyId(category, condition, shippingType, estimatedTax) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Policy_Master');
    
    if (!sheet) {
      console.error('Policy_Master シートが見つかりません');
      return null;
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      console.error('Policy_Master シートにデータがありません');
      return null;
    }
    
    // カテゴリーの送料上限を取得
    var shippingLimit = getShippingLimitForCategory(category);
    
    // 全データを取得（A列:ID、B列:名称、C列:送料上乗せ）
    var data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();

    // 条件に合うポリシーをパースして配列に格納
    var matchingPolicies = [];

    for (var i = 0; i < data.length; i++) {
      var id = data[i][0];
      var name = data[i][1];
      var shippingFee = data[i][2]; // C列：送料上乗せ価格

      if (!name) continue;

      // 名称をパース
      var parsed = parseShippingPolicyName(String(name));

      if (!parsed) continue;

      // 基本条件チェック（想定関税の範囲チェックは後で行う）
      if (parsed.condition !== condition) continue;
      if (parsed.shippingType !== shippingType) continue;

      matchingPolicies.push({
        id: id,
        name: name,
        shippingFee: shippingFee,
        parsed: parsed,
        maxPrice: parsed.maxPrice
      });
    }

    // 上限値でソート（昇順）
    matchingPolicies.sort(function(a, b) {
      return a.maxPrice - b.maxPrice;
    });

    // 下限を計算して範囲チェック
    var candidates = [];

    for (var i = 0; i < matchingPolicies.length; i++) {
      var policy = matchingPolicies[i];
      var actualMin = (i === 0) ? 0.01 : matchingPolicies[i - 1].maxPrice + 0.01;
      var actualMax = policy.maxPrice;

      // 想定関税が範囲内かチェック
      if (estimatedTax < actualMin || estimatedTax > actualMax) continue;

      // 送料上限チェック（C列の送料上乗せと比較）
      if (shippingLimit !== null && typeof policy.shippingFee === 'number' && policy.shippingFee > shippingLimit) {
        console.log('ポリシーID ' + policy.id + ' は送料$' + policy.shippingFee + ' > 上限$' + shippingLimit + ' でスキップ');
        continue;
      }
      
      // 条件に合致
      candidates.push({
        id: policy.id,
        name: policy.name,
        shippingFee: policy.shippingFee,
        parsed: policy.parsed
      });
    }
    
    if (candidates.length === 0) {
      // 上限内で見つからない場合、最大許容範囲のポリシーを探す
      if (shippingLimit !== null) {
        console.log('上限内のポリシーが見つからないため、フォールバック検索を実行');
        return findFallbackPolicy(sheet, data, condition, shippingType, shippingLimit);
      }
      console.log('該当するポリシーが見つかりません');
      return null;
    }
    
    // 最初に見つかったものを返す（価格帯は一意のはず）
    console.log('ポリシーID ' + candidates[0].id + ' を選択（送料$' + candidates[0].shippingFee + '）');
    return candidates[0].id;
    
  } catch (e) {
    console.error('ポリシー検索エラー: ' + e.message);
    return null;
  }
}

/**
 * フォールバック用：上限内の最大送料ポリシーを検索
 * @param {Sheet} sheet - Policy_Masterシート
 * @param {Array} data - シートデータ
 * @param {string} condition - 商品状態
 * @param {string} shippingType - 配送タイプ
 * @param {number} shippingLimit - 送料上限
 * @return {number|null} ポリシーID
 */
function findFallbackPolicy(sheet, data, condition, shippingType, shippingLimit) {
  try {
    var maxAllowedPolicy = null;
    var maxAllowedFee = 0;
    
    for (var i = 0; i < data.length; i++) {
      var id = data[i][0];
      var name = data[i][1];
      var shippingFee = data[i][2]; // C列：送料上乗せ価格
      
      if (!name) continue;
      
      var parsed = parseShippingPolicyName(String(name));
      
      if (!parsed) continue;
      if (parsed.condition !== condition) continue;
      if (parsed.shippingType !== shippingType) continue;
      
      // 送料が上限以下かチェック
      if (typeof shippingFee !== 'number') continue;
      if (shippingFee > shippingLimit) continue;
      
      // 上限内で最大の送料を探す
      if (shippingFee > maxAllowedFee) {
        maxAllowedFee = shippingFee;
        maxAllowedPolicy = id;
      }
    }
    
    if (maxAllowedPolicy !== null) {
      console.log('フォールバック: ポリシーID ' + maxAllowedPolicy + ' を選択（送料$' + maxAllowedFee + ' ≤ 上限$' + shippingLimit + '）');
    } else {
      console.log('フォールバック検索でも該当なし');
    }
    
    return maxAllowedPolicy;
    
  } catch (e) {
    console.error('フォールバックポリシー検索エラー: ' + e.message);
    return null;
  }
}


/**
 * カテゴリー選択結果を処理してポリシーIDを設定
 */
function applyShippingPolicyWithCategory(selectedCategory) {
  try {
    if (!selectedCategory) {
      showAlert('カテゴリーが選択されていません。', 'warning');
      return;
    }
    
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;

    // 保存された範囲を取得
    var props = PropertiesService.getScriptProperties();
    var startRow = parseInt(props.getProperty('SHIPPING_POLICY_START_ROW'));
    var endRow = parseInt(props.getProperty('SHIPPING_POLICY_END_ROW'));
    
    // 一時保存をクリア
    props.deleteProperty('SHIPPING_POLICY_START_ROW');
    props.deleteProperty('SHIPPING_POLICY_END_ROW');

    if (isNaN(startRow) || isNaN(endRow)) {
      showAlert('対象行の取得に失敗しました。', 'error');
      return;
    }

    var successCount = 0;
    var errorCount = 0;
    var skippedCount = 0;

    for (var row = startRow; row <= endRow; row++) {
      if (row < 5) {
        skippedCount++;
        continue;
      }
      
      try {
        if (setShippingPolicyToRow(sheet, row, selectedCategory)) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (e) {
        console.error('行' + row + 'のポリシー設定エラー: ' + e.message);
        errorCount++;
      }
    }

    var report = 'シッピングポリシー設定完了:\n\n' +
      '選択カテゴリー: ' + selectedCategory + '\n' +
      '対象範囲: ' + startRow + '～' + endRow + '行\n' +
      '設定成功: ' + successCount + '行\n' +
      '設定失敗: ' + errorCount + '行\n' +
      'スキップ: ' + skippedCount + '行\n\n' +
      '失敗の原因:\n' +
      '- 価格（R列）、商品状態（AC列）、配送方法（X列）が未入力\n' +
      '- 配送方法が「自動選択」になっている\n' +
      '- 該当するポリシーが見つからない';

    showAlert(report, successCount > 0 ? 'success' : 'warning');

  } catch (error) {
    showAlert('ポリシー適用エラー: ' + error.message, 'error');
  }
}

/**
 * 1行にシッピングポリシーIDを設定
 */
function setShippingPolicyToRow(sheet, row, category) {
  try {
    // 必要なデータを取得
    var estimatedTax = Number(sheet.getRange(row, CONFIG.COLUMNS.ESTIMATED_TAX).getValue());
    var condition = String(sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue() || '').trim();
    var shippingMethod = String(sheet.getRange(row, CONFIG.COLUMNS.METHOD).getValue() || '').trim();

    // バリデーション
    if (isNaN(estimatedTax) || estimatedTax <= 0) {
      console.log('行' + row + ': 想定関税が無効 (' + estimatedTax + ')');
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      return false;
    }
    
    if (!condition || !['新品', '中古'].includes(condition)) {
      console.log('行' + row + ': 商品状態が無効 (' + condition + ')');
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      return false;
    }
    
    // 配送方法を変換
    var shippingType = convertShippingMethodToType(shippingMethod);
    if (shippingType === 'エラー') {
      console.log('行' + row + ': 配送方法が無効 (' + shippingMethod + ')');
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      return false;
    }
    
    // ポリシーIDを検索
    var policyId = findShippingPolicyId(category, condition, shippingType, estimatedTax);
    
    if (policyId !== null) {
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue(policyId);
      console.log('行' + row + ': ポリシーID ' + policyId + ' を設定');
      return true;
    } else {
      console.log('行' + row + ': 該当ポリシーが見つからない');
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('該当なし');
      return false;
    }
    
  } catch (error) {
    console.error('行' + row + 'のポリシー設定エラー: ' + error.message);
    sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
    return false;
  }
}

/**
 * カテゴリー選択ダイアログを表示
 */
function showShippingPolicyCategoryDialog() {
  try {
    var html = createHtmlFromTemplate('ShippingPolicyCategoryDialog')
      .setWidth(480).setHeight(450);
    SpreadsheetApp.getUi().showModalDialog(html, 'シッピングポリシー - カテゴリー選択');
  } catch (e) {
    showAlert('カテゴリー選択ダイアログの表示に失敗: ' + e.message, 'error');
  }
}

/**
 * シッピングポリシー用カテゴリー一覧を取得（HTML用）
 */
function getShippingPolicyCategories() {
  try {
    var categories = CONFIG.SHIPPING_POLICY_CATEGORIES;
    var result = [];
    
    for (var key in categories) {
      if (categories.hasOwnProperty(key)) {
        result.push({
          value: key,
          display: categories[key].display,
          limit: categories[key].limit
        });
      }
    }
    
    return result;
    
  } catch (e) {
    console.error('カテゴリー取得エラー: ' + e.message);
    return [{ value: 'Other', display: 'その他（上限なし）', limit: null }];
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  関税率対応機能のテスト関数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 調整後価格計算のテスト
 */
function testAdjustedPriceCalculation() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }
    
    // 現在の設定値を取得
    var currentRate = Number(sheet.getRange('AF2').getValue()) || 0.15;
    var safetyFactor = Number(sheet.getRange('AG2').getValue()) || 1.35;
    var customsFee = Number(sheet.getRange('AE1').getValue()) || 10;
    
    // テストケース
    var testCases = [
      { ddu: 100, rate: 0.15 },
      { ddu: 100, rate: 0.39 },
      { ddu: 500, rate: 0.39 },
      { ddu: 900, rate: 0.39 }
    ];
    
    var report = '📊 調整後価格計算テスト\n\n';
    report += '現在のセル設定:\n';
    report += '• AF2（関税率）: ' + (currentRate * 100) + '%\n';
    report += '• AG2（安全係数）: ' + safetyFactor + '\n';
    report += '• AE1（通関手数料）: $' + customsFee + '\n\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 0; i < testCases.length; i++) {
      var tc = testCases[i];
      
      // 一時的に関税率を変更
      sheet.getRange('AF2').setValue(tc.rate);
      SpreadsheetApp.flush();
      
      var adjustedPrice = calculateAdjustedPriceForPolicy(sheet, tc.ddu);
      var adjustment = adjustedPrice - tc.ddu;
      
      report += 'テスト' + (i + 1) + ':\n';
      report += '• DDU価格: $' + tc.ddu + '\n';
      report += '• 関税率: ' + (tc.rate * 100) + '%\n';
      report += '• 調整後価格: $' + adjustedPrice.toFixed(2) + '\n';
      report += '• 調整額: ' + (adjustment > 0 ? '+' : '') + '$' + adjustment.toFixed(2) + '\n\n';
    }
    
    // 元の関税率に戻す
    sheet.getRange('AF2').setValue(currentRate);
    SpreadsheetApp.flush();
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('テストエラー: ' + e.message, 'error');
  }
}

/**
 * 実効閾値計算のテスト
 */
function testEffectiveThreshold() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }
    
    var baseThreshold = settings.dduThreshold || 900;
    
    var testRates = [0.15, 0.20, 0.25, 0.30, 0.35, 0.39];
    
    var report = '📊 実効閾値計算テスト\n\n';
    report += '基準閾値: $' + baseThreshold + ' (15%基準)\n\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 0; i < testRates.length; i++) {
      var rate = testRates[i];
      var effectiveThreshold = calculateEffectiveThreshold(baseThreshold, sheet, rate);
      var diff = baseThreshold - effectiveThreshold;
      
      report += '関税率 ' + (rate * 100) + '%:\n';
      report += '• 実効閾値: $' + effectiveThreshold + '\n';
      report += '• 差額: -$' + diff.toFixed(0) + '\n\n';
    }
    
    report += '💡 関税率が高いほど、実効閾値は低くなります。';
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('テストエラー: ' + e.message, 'error');
  }
}

/**
 * ポリシー判定の動作確認
 */
function testPolicySelection() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      return;
    }
    
    // 現在の関税率を取得
    var currentRate = Number(sheet.getRange('AF2').getValue()) || 0.15;
    
    var testCase = {
      category: 'Other',
      condition: '新品',
      shippingType: 'EX',
      dduPrice: 100
    };
    
    // 15%でテスト
    sheet.getRange('AF2').setValue(0.15);
    SpreadsheetApp.flush();
    var adjustedPrice15 = calculateAdjustedPriceForPolicy(sheet, testCase.dduPrice);
    var policyId15 = findShippingPolicyId(testCase.category, testCase.condition, testCase.shippingType, adjustedPrice15);
    
    // 39%でテスト
    sheet.getRange('AF2').setValue(0.39);
    SpreadsheetApp.flush();
    var adjustedPrice39 = calculateAdjustedPriceForPolicy(sheet, testCase.dduPrice);
    var policyId39 = findShippingPolicyId(testCase.category, testCase.condition, testCase.shippingType, adjustedPrice39);
    
    // 元の関税率に戻す
    sheet.getRange('AF2').setValue(currentRate);
    SpreadsheetApp.flush();
    
    var report = '📊 ポリシー判定テスト\n\n';
    report += 'テスト条件:\n';
    report += '• カテゴリー: ' + testCase.category + '\n';
    report += '• 状態: ' + testCase.condition + '\n';
    report += '• 配送: ' + testCase.shippingType + '\n';
    report += '• DDU価格: $' + testCase.dduPrice + '\n\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    report += '【15%関税率】\n';
    report += '• 調整後価格: $' + adjustedPrice15.toFixed(2) + '\n';
    report += '• 選択ポリシーID: ' + (policyId15 || '見つからず') + '\n\n';
    report += '【39%関税率】\n';
    report += '• 調整後価格: $' + adjustedPrice39.toFixed(2) + '\n';
    report += '• 選択ポリシーID: ' + (policyId39 || '見つからず') + '\n\n';
    
    if (policyId15 !== policyId39) {
      report += '✅ 関税率により異なるポリシーが選択されました。';
    } else {
      report += '⚠️ 同じポリシーが選択されました。価格帯が同じ範囲内の可能性があります。';
    }
    
    showAlert(report, 'info');
    
  } catch (e) {
    showAlert('テストエラー: ' + e.message, 'error');
  }
}
