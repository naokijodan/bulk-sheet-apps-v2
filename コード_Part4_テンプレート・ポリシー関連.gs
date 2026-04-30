/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  シッピングポリシー手動検索機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * シッピングポリシー手動検索ダイアログを表示
 */
function showShippingPolicyManualSearchDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('ShippingPolicyManualSearch')
      .setWidth(600).setHeight(700);
    SpreadsheetApp.getUi().showModalDialog(html, '🔍 シッピングポリシー手動検索');
  } catch (e) {
    showAlert('手動検索ダイアログの表示に失敗: ' + e.message, 'error');
  }
}

/**
 * 手動でシッピングポリシーを検索する
 * @param {Object} searchData - 検索条件オブジェクト
 * @return {Object} 検索結果
 */
function searchShippingPolicyManually(searchData) {
  try {
    console.log('手動シッピングポリシー検索開始:', searchData);
    
    // 入力値検証
    if (!searchData || typeof searchData !== 'object') {
      return { success: false, error: '検索条件が無効です' };
    }
    
    var category = String(searchData.category || '').trim();
    var condition = String(searchData.condition || '').trim();
    var shippingType = String(searchData.shippingType || '').trim();
    var price = Number(searchData.price);
    
    // バリデーション
    if (!category) {
      return { success: false, error: 'カテゴリーを選択してください' };
    }
    
    if (!condition || !['新品', '中古'].includes(condition)) {
      return { success: false, error: '商品状態を正しく選択してください' };
    }
    
    if (!shippingType || !['エコノミー', 'EX'].includes(shippingType)) {
      return { success: false, error: '配送方法を正しく選択してください' };
    }
    
    if (isNaN(price) || price < 0) {
      return { success: false, error: '価格を正しく入力してください（0以上の数値）' };
    }
    
    // 【追加】関税率を考慮した調整後価格を計算
    var settings = getSettings();
    if (!settings) {
      return { success: false, error: '設定が見つかりません' };
    }
    
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      return { success: false, error: '作業シートが見つかりません' };
    }
    
    var adjustedPrice = calculateAdjustedPriceForPolicy(sheet, price);
    var adjustment = adjustedPrice - price;
    
    // ポリシーを検索（調整後価格を使用）
    var policyId = findShippingPolicyId(category, condition, shippingType, adjustedPrice);
    
    // ポリシー名称も取得
    var policyName = null;
    if (policyId !== null) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName('Policy_Master');
      if (sheet) {
        var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
        for (var i = 0; i < data.length; i++) {
          if (data[i][0] === policyId) {
            policyName = data[i][1];
            break;
          }
        }
      }
    }
    
    // 送料上限情報も追加
    var shippingLimit = getShippingLimitForCategory(category);
    
    console.log('検索結果:', policyId, policyName);
    
    return {
      success: true,
      policyId: policyId,
      policyName: policyName,
      shippingLimit: shippingLimit,
      originalPrice: price,              // 【追加】元の価格
      adjustedPrice: adjustedPrice,      // 【追加】調整後価格
      adjustment: adjustment,            // 【追加】調整額
      searchConditions: {
        category: category,
        condition: condition,
        shippingType: shippingType,
        price: price
      }
    };
    
  } catch (error) {
    console.error('手動検索エラー:', error);
    return { 
      success: false, 
      error: error.message || 'シッピングポリシー検索中にエラーが発生しました' 
    };
  }
}

/**
 * シッピングポリシー機能のデバッグ情報を表示
 */
function debugShippingPolicyData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
   var sheet = ss.getSheetByName('Policy_Master');
    
    if (!sheet) {
      showAlert('Policy_Masterシートが見つかりません。\n先に「🚢 Policy_Master シート作成」を実行してください。', 'error');
      return;
    }
    
    var lastRow = sheet.getLastRow();
    var report = 'Policy_Master シート確認:\n\n';
    
    report += '総データ数: ' + (lastRow - 1) + '件\n\n';
    
    // 各組み合わせの件数を集計
    var counts = {
      'eco_new': 0,
      'eco_used': 0,
      'xp_new': 0,
      'xp_used': 0
    };
    
    var data = sheet.getRange(2, 1, lastRow - 1, 2).getValues();
    
    for (var i = 0; i < data.length; i++) {
      var name = String(data[i][1] || '');
      if (name.indexOf('_eco_new_') !== -1) counts['eco_new']++;
      else if (name.indexOf('_eco_used_') !== -1) counts['eco_used']++;
      else if (name.indexOf('_xp_new_') !== -1) counts['xp_new']++;
      else if (name.indexOf('_xp_used_') !== -1) counts['xp_used']++;
    }
    
    report += '【組み合わせ別件数】\n';
    report += 'エコノミー × 新品: ' + counts['eco_new'] + '件\n';
    report += 'エコノミー × 中古: ' + counts['eco_used'] + '件\n';
    report += 'EX × 新品: ' + counts['xp_new'] + '件\n';
    report += 'EX × 中古: ' + counts['xp_used'] + '件\n\n';
    
    report += '【サンプルデータ（最初の5件）】\n';
    for (var j = 0; j < Math.min(5, data.length); j++) {
      report += 'ID ' + data[j][0] + ': ' + data[j][1] + '\n';
    }
    
    showAlert(report, 'info');
    
  } catch (error) {
    showAlert('デバッグ情報取得エラー: ' + error.message, 'error');
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート判定機能（Policy_Master使用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * テンプレートカテゴリー選択肢を取得
 */
function getTemplateCategoryOptions() {
  return [
    { value: 'general', display: '汎用（送料上限なし）' },
    { value: 'videogames', display: 'Video Games（送料上限$20）' },
    { value: 'books', display: 'Books（送料上限$20）' },
    { value: 'movies', display: 'Movies & TV（送料上限$20）' },
    { value: 'music', display: 'Music（送料上限$25）' },
    { value: 'console', display: 'Video Game Consoles（送料上限$50）' },
    { value: 'card_graded', display: 'トレカ - Graded' },
    { value: 'card_raw', display: 'トレカ - 未鑑定' },
    { value: 'preorder', display: '予約販売' }
  ];
}

/**
 * テンプレート名称を生成
 * @param {string} category - カテゴリー（general/videogames/books/movies/music/console/card_graded/card_raw/preorder）
 * @param {string} shippingType - 配送タイプ（エコノミー/EX）
 * @param {string} condition - 商品状態（新品/中古）
 * @return {string|null} テンプレート名称
 */
function generateTemplateName(category, shippingType, condition) {
  try {
    // 配送タイプを略称に変換（全カテゴリー共通で使用）
    var shipping = (shippingType === 'エコノミー') ? 'eco' : 
                   (shippingType === 'EX') ? 'xp' : null;
    
    if (!shipping) {
      console.error('配送タイプが無効: ' + shippingType);
      return null;
    }
    
    // トレカは配送方法で分ける（状態は不使用）
    if (category === 'card_graded') {
      return 'Template_card_graded_' + shipping;  // _eco or _xp
    }
    if (category === 'card_raw') {
      return 'Template_card_raw_' + shipping;  // _eco or _xp
    }
    
    // 予約販売も配送方法で分ける（状態は不使用）
    if (category === 'preorder') {
      return 'Template_preorder_' + shipping;
    }
    
    // ここから状態が必要なカテゴリー
    var cond = (condition === '新品') ? 'new' : 
               (condition === '中古') ? 'used' : null;
    
    if (!cond) {
      console.error('商品状態が無効: ' + condition);
      return null;
    }
    
    // ゲーム・本は limited テンプレートを使用
    if (category === 'videogames' || category === 'books') {
      return 'Template_limited_' + shipping + '_' + cond;
    }
    
    // その他のカテゴリー（movies, music, console, general）は汎用テンプレートを使用
    return 'Template_general_' + shipping + '_' + cond;
    
  } catch (e) {
    console.error('テンプレート名生成エラー: ' + e.message);
    return null;
  }
}
/**
 * 新形式：テンプレート名から標準名を生成
 * @param {string} templateName - テンプレート名（トレカGraded/トレカ未鑑定/ゲーム・本/一般汎用/予約販売など）
 * @param {string} condition - 商品状態（新品/中古）
 * @param {string} shippingType - 配送タイプ（エコノミー/EX）
 * @return {string|null} 標準テンプレート名
 */
function generateNewTemplateName(templateName, condition, shippingType) {
  try {
    // 配送タイプを略称に変換
    var shipping = (shippingType === 'エコノミー') ? 'eco' : 
                   (shippingType === 'EX') ? 'xp' : null;
    
    if (!shipping) {
      console.error('配送タイプが無効: ' + shippingType);
      return null;
    }
    
    // 状態を英語に変換
    var cond = (condition === '新品') ? 'new' : 
               (condition === '中古') ? 'used' : null;
    
    if (!cond) {
      console.error('商品状態が無効: ' + condition);
      return null;
    }
    
    // すべて統一形式：Template_テンプレート名_状態_配送方法
    return 'Template_' + templateName + '_' + cond + '_' + shipping;
    
  } catch (e) {
    console.error('新テンプレート名生成エラー: ' + e.message);
    return null;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Policy_Master キャッシング（高速化）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * Policy_Masterを読み込んでキャッシュを作成（高速化用）
 * @return {Object} { templates: Map, policies: Array }
 */
function loadPolicyMasterCache_() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Policy_Master');

    if (!sheet) {
      console.error('Policy_Master シートが見つかりません');
      return { templates: new Map(), policies: [], ddpPolicies: [] };
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { templates: new Map(), policies: [], ddpPolicies: [] };
    }

    var data = sheet.getRange(1, 1, lastRow, 3).getValues();
    var templateMap = new Map(); // テンプレート名 → ID
    var policiesArray = [];       // DDU 自動判定ポリシー配列
    var ddpPolicies = [];         // DDP 専用ポリシー配列（A-C 列下部セクションから）

    var inTemplateSection = false;
    var inPolicySection = false;
    var inDdpSection = false;

    var DDP_CACHE_PATTERNS = [
      { pattern: 'eco_new_free',  shippingType: 'eco', condition: 'new' },
      { pattern: 'eco_used_free', shippingType: 'eco', condition: 'used' },
      { pattern: 'xp_new_free',   shippingType: 'xp',  condition: 'new' },
      { pattern: 'xp_used_free',  shippingType: 'xp',  condition: 'used' }
    ];

    for (var i = 0; i < data.length; i++) {
      var cellA = String(data[i][0] || '');

      // セクション判定（DDP 専用を先にチェックして誤マッチ防止）
      if (cellA.indexOf('【Templates】') !== -1) {
        inTemplateSection = true;
        inPolicySection = false;
        inDdpSection = false;
        i++; // ヘッダー行スキップ
        continue;
      }

      if (cellA.indexOf('【Shipping Policies - DDP') !== -1) {
        inTemplateSection = false;
        inPolicySection = false;
        inDdpSection = true;
        i++; // ヘッダー行スキップ
        continue;
      }

      if (cellA.indexOf('【Shipping Policies') !== -1) {
        // 自動判定用セクション
        inTemplateSection = false;
        inPolicySection = true;
        inDdpSection = false;
        i++; // ヘッダー行スキップ
        continue;
      }

      // テンプレートデータ
      if (inTemplateSection) {
        var id = data[i][0];
        var name = String(data[i][1] || '');

        if (!name || cellA.indexOf('【') !== -1) {
          inTemplateSection = false;
          continue;
        }

        templateMap.set(name, typeof id === 'number' ? id : Number(id));
      }

      // DDU 自動判定ポリシーデータ
      if (inPolicySection) {
        var policyId = data[i][0];
        var policyName = String(data[i][1] || '');
        var shippingFee = data[i][2];

        if (!policyName || cellA.indexOf('【') !== -1) {
          inPolicySection = false;
          continue;
        }

        policiesArray.push({
          id: policyId,
          name: policyName,
          shippingFee: typeof shippingFee === 'number' ? shippingFee : null
        });
      }

      // DDP 専用ポリシーデータ（A-C 列下部セクションから）
      if (inDdpSection) {
        var ddpId = data[i][0];
        var ddpName = String(data[i][1] || '');

        if (!ddpName || cellA.indexOf('【') !== -1) {
          inDdpSection = false;
          continue;
        }

        if (ddpId) {
          for (var p = 0; p < DDP_CACHE_PATTERNS.length; p++) {
            if (ddpName.indexOf(DDP_CACHE_PATTERNS[p].pattern) !== -1) {
              ddpPolicies.push({
                id: String(ddpId),
                name: ddpName,
                shippingType: DDP_CACHE_PATTERNS[p].shippingType,
                condition: DDP_CACHE_PATTERNS[p].condition
              });
              break;
            }
          }
        }
      }
    }

    console.log('✅ キャッシュ作成: テンプレート' + templateMap.size + '件, ポリシー' + policiesArray.length + '件, DDPポリシー' + ddpPolicies.length + '件');
    return { templates: templateMap, policies: policiesArray, ddpPolicies: ddpPolicies };

  } catch (e) {
    console.error('キャッシュ作成エラー: ' + e.message);
    return { templates: new Map(), policies: [], ddpPolicies: [] };
  }
}

/**
 * キャッシュからテンプレートIDを検索
 * @param {Map} templateCache テンプレートキャッシュ
 * @param {string} templateName テンプレート名
 * @return {number|null} テンプレートID
 */
function findTemplateIdFromCache_(templateCache, templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }
  return null;
}

/**
 * キャッシュからシッピングポリシーIDを検索
 * @param {Array} policyCache ポリシーキャッシュ
 * @param {string} category カテゴリー
 * @param {string} condition 商品状態
 * @param {string} shippingType 配送タイプ
 * @param {number} estimatedTax 想定関税（USD）
 * @return {number|null} ポリシーID
 */
function findShippingPolicyIdFromCache_(policyCache, category, condition, shippingType, estimatedTax) {
  try {
    var shippingLimit = getShippingLimitForCategory(category);
    var candidates = [];

    for (var i = 0; i < policyCache.length; i++) {
      var policy = policyCache[i];
      var parsed = parseShippingPolicyName(policy.name);

      if (!parsed) continue;

      // 基本条件チェック
      if (parsed.condition !== condition) continue;
      if (parsed.shippingType !== shippingType) continue;
      if (estimatedTax < parsed.minPrice || estimatedTax > parsed.maxPrice) continue;

      // 送料上限チェック
      if (shippingLimit !== null && policy.shippingFee !== null && policy.shippingFee > shippingLimit) {
        continue;
      }

      candidates.push(policy);
    }

    if (candidates.length === 0) {
      // フォールバック検索
      if (shippingLimit !== null) {
        return findFallbackPolicyFromCache_(policyCache, condition, shippingType, shippingLimit);
      }
      return null;
    }

    return candidates[0].id;

  } catch (e) {
    console.error('キャッシュからのポリシー検索エラー: ' + e.message);
    return null;
  }
}

/**
 * DDP専用ポリシーをキャッシュから検索して返す（Policy_Masterの都度読み禁止）。
 * @param {Array<Object>} ddpPolicies - cache.ddpPolicies (loadPolicyMasterCache_で構築済み)
 * @param {string} shippingType - 'eco' | 'xp'
 * @param {string} condition - 'new' | 'used'
 * @return {string|null} ポリシーID、見つからない場合はnull
 */
function findDdpPolicyIdFromCache_(ddpPolicies, shippingType, condition) {
  if (!ddpPolicies || !ddpPolicies.length) return null;
  for (var i = 0; i < ddpPolicies.length; i++) {
    var p = ddpPolicies[i];
    if (p.shippingType === shippingType && p.condition === condition) {
      return p.id;
    }
  }
  return null;
}

/**
 * キャッシュからフォールバックポリシーを検索
 */
function findFallbackPolicyFromCache_(policyCache, condition, shippingType, shippingLimit) {
  var maxAllowedPolicy = null;
  var maxAllowedFee = 0;

  for (var i = 0; i < policyCache.length; i++) {
    var policy = policyCache[i];
    var parsed = parseShippingPolicyName(policy.name);

    if (!parsed) continue;
    if (parsed.condition !== condition) continue;
    if (parsed.shippingType !== shippingType) continue;
    if (policy.shippingFee === null) continue;
    if (policy.shippingFee > shippingLimit) continue;

    if (policy.shippingFee > maxAllowedFee) {
      maxAllowedFee = policy.shippingFee;
      maxAllowedPolicy = policy;
    }
  }

  return maxAllowedPolicy ? maxAllowedPolicy.id : null;
}

/**
 * テンプレートIDを検索（Policy_Masterから）
 * @param {string} templateName - テンプレート名称
 * @return {number|null} テンプレートID
 */
function findTemplateId(templateName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Policy_Master');
    
    if (!sheet) {
      console.error('Policy_Master シートが見つかりません');
      return null;
    }
    
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return null;
    }
    
    // Templates セクションを検索
    var data = sheet.getRange(1, 1, lastRow, 3).getValues();
    var templateSectionStart = -1;
    
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).indexOf('【Templates】') !== -1) {
        templateSectionStart = i + 2; // ヘッダーの2行下からデータ開始
        break;
      }
    }
    
    if (templateSectionStart === -1) {
      console.error('Templates セクションが見つかりません');
      return null;
    }
    
    // 🔹 デバッグ：検索対象の名前をログ出力
    console.log('🔍 検索するテンプレート名: "' + templateName + '"');
    
    // テンプレートデータを検索
    var foundTemplates = [];
    for (var j = templateSectionStart; j < data.length; j++) {
      var id = data[j][0];
      var name = String(data[j][1] || '');
      
      // 空行または次のセクションに到達したら終了
      if (!name || String(data[j][0]).indexOf('【') !== -1) {
        break;
      }
      
      foundTemplates.push(name);
      
      if (name === templateName) {
        console.log('✅ マッチしました！ ID: ' + id);
        return typeof id === 'number' ? id : Number(id);
      }
    }
    
    // 🔹 見つからなかった場合、マスターにあるテンプレート一覧を出力
    console.error('❌ テンプレート "' + templateName + '" が見つかりません');
    console.error('📋 Policy_Masterに登録されているテンプレート:');
    foundTemplates.forEach(function(t) {
      console.error('  - "' + t + '"');
    });
    
    return null;
    
  } catch (e) {
    console.error('テンプレートID検索エラー: ' + e.message);
    return null;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート＋シッピングポリシー統合設定
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 選択行にテンプレート＋シッピングポリシーを設定（統合版）
 */
function setTemplateAndPolicyForSelectedRows() {
  try {
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;

    var range = sheet.getActiveRange();
    if (!range) {
      showAlert('設定する行を選択してください。', 'info');
      return;
    }

    // 選択範囲を一時保存
    var props = PropertiesService.getDocumentProperties();
    props.setProperty('UNIFIED_SETTING_START_ROW', range.getRow().toString());
    props.setProperty('UNIFIED_SETTING_END_ROW', range.getLastRow().toString());
    
    // カテゴリー選択ダイアログを表示
    showUnifiedCategoryDialog();
    
  } catch (error) {
    showAlert('設定エラー: ' + error.message, 'error');
  }
}

/**
 * カテゴリー選択結果を処理して両方を設定
 */
/**
 * カテゴリー選択結果を処理して両方を設定（50行バッチ対応）
 */
function applyUnifiedSettings(selectedCategory, selectedTemplateName, templateMode, policyMode, manualPolicyId) {
  try {
    if (!selectedCategory) {
      showAlert('カテゴリーが選択されていません。', 'warning');
      return;
    }
    
    if (templateMode === 'auto' && !selectedTemplateName) {
      showAlert('テンプレート名が選択されていません。', 'warning');
      return;
    }
    
    if (policyMode === 'manual' && !manualPolicyId) {
      showAlert('手動ポリシーが選択されていません。', 'warning');
      return;
    }
    
    var settings = getSettings();
    if (!settings) return;
    
    var sheet = validateAndGetSheet();
    if (!sheet) return;

    var props = PropertiesService.getDocumentProperties();
    var startRow = parseInt(props.getProperty('UNIFIED_SETTING_START_ROW'));
    var endRow = parseInt(props.getProperty('UNIFIED_SETTING_END_ROW'));
    
    props.deleteProperty('UNIFIED_SETTING_START_ROW');
    props.deleteProperty('UNIFIED_SETTING_END_ROW');

    if (isNaN(startRow) || isNaN(endRow)) {
      showAlert('対象行の取得に失敗しました。', 'error');
      return;
    }

    // 対象行を配列化
    var targetRows = [];
    for (var row = startRow; row <= endRow; row++) {
      if (row >= 5) targetRows.push(row);
    }

    var successCount = 0;
    var errorCount = 0;
    var skippedCount = (endRow - startRow + 1) - targetRows.length;

    // 50行ずつバッチ処理
    var BATCH_SIZE = 50;
    for (var i = 0; i < targetRows.length; i += BATCH_SIZE) {
      var batch = targetRows.slice(i, Math.min(i + BATCH_SIZE, targetRows.length));
      
      var result = applyUnifiedSettingsBatch_(
        sheet, 
        batch, 
        selectedCategory, 
        selectedTemplateName, 
        templateMode, 
        policyMode, 
        manualPolicyId
      );
      
      successCount += result.successCount;
      errorCount += result.errorCount;
      
      Utilities.sleep(200);
    }

    var message = '✅ 設定完了\n\n' +
      '成功: ' + successCount + '件\n' +
      'エラー: ' + errorCount + '件\n' +
      'スキップ: ' + skippedCount + '件';
    
    showAlert(message, errorCount > 0 ? 'warning' : 'success');

  } catch (error) {
    showAlert('設定適用エラー: ' + error.message, 'error');
  }
}

/**
 * 50行分の統合設定を一括処理（修正版 - 空欄込み高速版）
 * 
 * 【修正内容】
 * 空欄の行も含めた配列を作成して一括書き込み
 * → 翻訳・計算処理と同じロジック
 */
function applyUnifiedSettingsBatch_(sheet, batchRows, category, templateName, templateMode, policyMode, manualPolicyId) {
  var successCount = 0;
  var errorCount = 0;

  console.log('=== 統合設定バッチ開始: ' + batchRows.length + '行 ===');

  // 🚀 Policy_Masterのキャッシュを1回だけ作成（高速化）
  var cache = loadPolicyMasterCache_();
  console.log('✅ キャッシュ作成完了');

  // ========================================
  // 前処理: 最小行と最大行を取得
  // ========================================
  var minRow = Math.min.apply(null, batchRows);
  var maxRow = Math.max.apply(null, batchRows);
  var rowCount = maxRow - minRow + 1;
  
  console.log('処理範囲: ' + minRow + '〜' + maxRow + '行（' + rowCount + '行分）');
  
  // batchRowsを高速検索用にセット化
  var batchRowsSet = {};
  for (var i = 0; i < batchRows.length; i++) {
    batchRowsSet[batchRows[i]] = true;
  }

  // タグ設定の事前取得（タグ自動判定ON時のみ）
  var ss = sheet.getParent();
  var settings = getSettings();
  var tagMap = buildTagOverrideMap_(ss, settings);
  var tagValues = null;
  if (tagMap) {
    tagValues = sheet.getRange(minRow, CONFIG.COLUMNS.TAG, rowCount, 1).getValues();
  }
  function getTagVal_(rowNum, field) {
    if (!tagMap || !tagValues) return null;
    var tag = String(tagValues[rowNum - minRow][0] || '').split(/[\s\u3000]/)[0].trim();
    var entry = tagMap[tag];
    return entry ? entry[field] : null;
  }

  // ========================================
  // ① 必要なデータを一括取得（最小〜最大行の範囲）
  // ========================================
  var priceValues = sheet.getRange(minRow, CONFIG.COLUMNS.PRICE, rowCount, 1).getValues();
  var conditionValues = sheet.getRange(minRow, CONFIG.COLUMNS.CONDITION, rowCount, 1).getValues();
  var methodValues = sheet.getRange(minRow, CONFIG.COLUMNS.METHOD, rowCount, 1).getValues();
  var estimatedTaxValues = sheet.getRange(minRow, CONFIG.COLUMNS.ESTIMATED_TAX, rowCount, 1).getValues();

  // AX列(CONFIG.COLUMNS.DDP_MODE) batch read: ポリシー判定の真実の源
  SpreadsheetApp.flush();  // AX列数式の再計算を確実に完了させてから読み取る
  var axColValues = sheet.getRange(minRow, CONFIG.COLUMNS.DDP_MODE, rowCount, 1).getValues();

  var templateData = [];
  var policyData = [];
  
  // ========================================
  // ② 各行のテンプレートID・ポリシーIDを計算（空欄含む）
  // ========================================
  for (var row = minRow; row <= maxRow; row++) {
    var rowIndex = row - minRow;
    
    // この行が処理対象かチェック
    if (!batchRowsSet[row]) {
      // データなし（空欄）
      templateData.push(['']);
      policyData.push(['']);
      continue;
    }
    
    // データあり → 処理
    var priceUSD = Number(priceValues[rowIndex][0]);
    var condition = String(conditionValues[rowIndex][0] || '').trim();
    var shippingMethod = String(methodValues[rowIndex][0] || '').trim();
    var estimatedTax = Number(estimatedTaxValues[rowIndex][0]);

    console.log('行' + row + ': 価格=' + priceUSD + ', 想定関税=' + estimatedTax + ', 状態=' + condition + ', 配送=' + shippingMethod);

    // バリデーション
    if (isNaN(estimatedTax) || estimatedTax <= 0) {
      console.log('  ❌ 想定関税が無効');
      templateData.push(['エラー']);
      policyData.push(['エラー']);
      errorCount++;
      continue;
    }
    
    if (!condition || !['新品', '中古'].includes(condition)) {
      console.log('  ❌ 商品状態が無効');
      templateData.push(['エラー']);
      policyData.push(['エラー']);
      errorCount++;
      continue;
    }
    
    var shippingType = convertShippingMethodToType(shippingMethod);
    if (shippingType === 'エラー') {
      console.log('  ❌ 配送方法が無効');
      templateData.push(['エラー']);
      policyData.push(['エラー']);
      errorCount++;
      continue;
    }
    
    // テンプレート処理
    if (templateMode === 'auto') {
      var rowTemplateName = templateName;
      if (settings && settings.tagOverrideTemplate) {
        var tagTpl = getTagVal_(row, 'template');
        if (tagTpl != null) rowTemplateName = tagTpl;
      }
      var standardName = generateNewTemplateName(rowTemplateName, condition, shippingType);
      console.log('  テンプレート標準名: ' + standardName);

      if (!standardName) {
        templateData.push(['エラー']);
        console.log('  ❌ テンプレート名生成失敗');
      } else {
        // 🚀 キャッシュから検索（高速化）
        var templateId = findTemplateIdFromCache_(cache.templates, standardName);
        if (templateId !== null) {
          templateData.push([templateId]);
          console.log('  ✅ テンプレートID: ' + templateId);
        } else {
          templateData.push(['該当なし']);
          console.log('  ⚠️ テンプレートが見つからない');
        }
      }
    } else {
      templateData.push(['']); // manualモードは空白
    }

    // ポリシー処理
    var policyId;
    if (policyMode === 'manual') {
      // 🔹 手動ポリシー選択
      policyId = Number(manualPolicyId);
      console.log('  手動ポリシーID: ' + policyId);
    } else {
      // 自動判定: AX列の値でDDP/DDU分岐
      var rowAxValueRaw = axColValues[rowIndex][0];
      var rowAxValue = String(rowAxValueRaw || '').trim().toUpperCase();
      var isDdpRow = (rowAxValue === 'DDP');

      if (isDdpRow) {
        policyId = findDdpPolicyIdFromCache_(cache.ddpPolicies, shippingType, condition);
        if (!policyId) {
          var tagForLog = tagMap ? String((tagValues ? tagValues[rowIndex][0] : '') || '').trim() : '(tagMap未構築)';
          console.warn('[applyUnifiedSettingsBatch_] DDPポリシー未発見 row=' + row +
            ' tag=' + tagForLog +
            ' shippingType=' + shippingType +
            ' condition=' + condition +
            ' axValue=' + rowAxValueRaw + ' → 該当なし');
          policyId = '該当なし';
        }
        console.log('  DDPポリシーID: ' + policyId + ' (AX=' + rowAxValue + ')');
      } else {
        var rowCategory = category;
        if (settings && settings.tagOverrideShippingCategory) {
          var tagCat = getTagVal_(row, 'shippingCat');
          if (tagCat != null) rowCategory = tagCat;
        }
        var policyCategory = getCategoryForShippingPolicy(rowCategory);
        // 🚀 キャッシュから検索（高速化）
        policyId = findShippingPolicyIdFromCache_(cache.policies, policyCategory, condition, shippingType, estimatedTax);
        console.log('  自動ポリシーID: ' + policyId);
      }
    }

    if (policyId !== null && !isNaN(policyId)) {
      policyData.push([policyId]);
      successCount++;
      console.log('  ✅ ポリシーID: ' + policyId);
    } else {
      policyData.push(['該当なし']);
      errorCount++;
      console.log('  ⚠️ ポリシーが見つからない');
    }
  }
  
  // ========================================
  // ③ 結果を一括書き込み（空欄含む全範囲）
  // ========================================
  if (templateMode === 'auto') {
    sheet.getRange(minRow, 5, rowCount, 1).setValues(templateData);
    console.log('テンプレートID一括書き込み完了（' + minRow + '〜' + maxRow + '行）');
  }
  sheet.getRange(minRow, CONFIG.COLUMNS.SHIPPING_POLICY, rowCount, 1).setValues(policyData);
  console.log('ポリシーID一括書き込み完了（' + minRow + '〜' + maxRow + '行）');
  
  console.log('=== 統合設定バッチ完了 ===');
  
  return { successCount: successCount, errorCount: errorCount };
}
/**
 * 1行にテンプレート＋シッピングポリシーを設定
 */
function setUnifiedSettingsToRow(sheet, row, category, templateName, templateMode, policyMode, manualPolicyId) {
  var templateSuccess = true;
  var policySuccess = true;
  var templateError = '';
  var policyError = '';
  
  try {
    var priceUSD = Number(sheet.getRange(row, CONFIG.COLUMNS.PRICE).getValue());
    var condition = String(sheet.getRange(row, CONFIG.COLUMNS.CONDITION).getValue() || '').trim();
    var shippingMethod = String(sheet.getRange(row, CONFIG.COLUMNS.METHOD).getValue() || '').trim();
    
    // 関税率を考慮した調整後価格を計算
    var adjustedPrice = calculateAdjustedPriceForPolicy(sheet, priceUSD);
    
    // バリデーション
    if (isNaN(priceUSD) || priceUSD <= 0) {
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      if (templateMode === 'auto') {
        sheet.getRange(row, 5).setValue('エラー');
      }
      return { success: false, error: '価格が無効' };
    }
    
    if (!condition || !['新品', '中古'].includes(condition)) {
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      if (templateMode === 'auto') {
        sheet.getRange(row, 5).setValue('エラー');
      }
      return { success: false, error: '商品状態が無効' };
    }
    
    var shippingType = convertShippingMethodToType(shippingMethod);
    if (shippingType === 'エラー') {
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      if (templateMode === 'auto') {
        sheet.getRange(row, 5).setValue('エラー');
      }
      return { success: false, error: '配送方法が無効（自動選択は不可）' };
    }
    
    // テンプレート処理（autoモードの時だけ）
    if (templateMode === 'auto') {
      try {
        console.log('━━━━━━━━━━━━━━━━━━━━');
        console.log('行' + row + ': テンプレート処理開始');
        console.log('  テンプレート名: ' + templateName);
        console.log('  状態: ' + condition);
        console.log('  配送: ' + shippingType);
        
        var standardName = generateNewTemplateName(templateName, condition, shippingType);
        console.log('  生成された標準名: ' + standardName);
        
        if (!standardName) {
          sheet.getRange(row, 5).setValue('エラー');
          templateSuccess = false;
          templateError = 'テンプレート名生成失敗';
          console.log('  ❌ テンプレート名生成失敗');
        } else {
          var templateId = findTemplateId(standardName);
          if (templateId !== null) {
            sheet.getRange(row, 5).setValue(templateId);
            console.log('  ✅ テンプレートID設定: ' + templateId);
          } else {
            sheet.getRange(row, 5).setValue('該当なし');
            templateSuccess = false;
            templateError = 'テンプレートが見つからない: ' + standardName;
            console.log('  ❌ テンプレートが見つかりません');
          }
        }
      } catch (e) {
        sheet.getRange(row, 5).setValue('エラー');
        templateSuccess = false;
        templateError = 'テンプレート処理エラー: ' + e.message;
        console.log('  ❌ テンプレート処理エラー: ' + e.message);
      }
    }
    // manualモードならE列は何も書かない
    
    // シッピングポリシー処理
    console.log('行' + row + ': シッピングポリシー処理開始');
    console.log('  ポリシーモード: ' + policyMode);
    
    try {
      var policyId;
      
      if (policyMode === 'manual') {
        // 🔹 手動ポリシー選択
        console.log('  手動ポリシーID: ' + manualPolicyId);
        policyId = Number(manualPolicyId);
      } else {
        // 自動判定
        var policyCategory = getCategoryForShippingPolicy(category);
        console.log('  ポリシーカテゴリー: ' + policyCategory);
        console.log('  調整後価格: ' + adjustedPrice);
        
        policyId = findShippingPolicyId(policyCategory, condition, shippingType, adjustedPrice);
      }
      
      if (policyId !== null && !isNaN(policyId)) {
        sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue(policyId);
        console.log('  ✅ ポリシーID設定: ' + policyId);
      } else {
        sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('該当なし');
        policySuccess = false;
        policyError = 'ポリシーが見つからない';
        console.log('  ❌ ポリシーが見つかりません');
      }
    } catch (e) {
      sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
      policySuccess = false;
      policyError = 'ポリシー処理エラー: ' + e.message;
      console.log('  ❌ ポリシー処理エラー: ' + e.message);
    }
    
    // 両方の結果を総合判定
    var success = (templateMode === 'manual' ? true : templateSuccess) && policySuccess;
    var errorMsg = '';
    if (!templateSuccess && templateMode === 'auto') {
      errorMsg += 'テンプレート: ' + templateError;
    }
    if (!policySuccess) {
      if (errorMsg) errorMsg += ' / ';
      errorMsg += 'ポリシー: ' + policyError;
    }
    
    console.log('行' + row + ': 処理完了 - success=' + success + (errorMsg ? ', error=' + errorMsg : ''));
    console.log('━━━━━━━━━━━━━━━━━━━━');
    
    return { 
      success: success, 
      error: errorMsg || null 
    };
    
  } catch (error) {
    console.log('❌ 予期しないエラー (行' + row + '): ' + error.message);
    sheet.getRange(row, CONFIG.COLUMNS.SHIPPING_POLICY).setValue('エラー');
    if (templateMode === 'auto') {
      sheet.getRange(row, 5).setValue('エラー');
    }
    return { success: false, error: error.message };
  }
}
/**
 * テンプレート用カテゴリーに変換
 * @param {string} category - 元のカテゴリー値
 * @return {string} テンプレート用カテゴリー
 */
function getCategoryForTemplate(category) {
  // トレカはそのまま（配送方法で分けるため）
  if (category === 'card_graded' || category === 'card_raw') {
    return category;
  }
  
  // 予約販売もそのまま（配送方法で分けるため）
  if (category === 'preorder') {
    return 'preorder';
  }
  
  // ゲーム・本は limited テンプレートを使用
  if (category === 'videogames' || category === 'books') {
    return 'limited';
  }
  
  // その他のカテゴリー（movies, music, console, general）は汎用テンプレートを使用
  return 'general';
}

/**
 * テンプレートカテゴリーからシッピングポリシー用カテゴリーに変換
 */
function getCategoryForShippingPolicy(templateCategory) {
  var mapping = {
    'videogames': 'Video Games',
    'books': 'Books',
    'movies': 'Movies & TV',
    'music': 'Music',
    'console': 'Video Game Consoles',
    'general': 'Other',
    'card_graded': 'Other',
    'card_raw': 'Other',
    'preorder': 'Other'
  };
  
  return mapping[templateCategory] || 'Other';
}


/**
 * カテゴリー表示名を取得
 */
function getCategoryDisplayName(categoryValue) {
  var options = getTemplateCategoryOptions();
  for (var i = 0; i < options.length; i++) {
    if (options[i].value === categoryValue) {
      return options[i].display;
    }
  }
  return categoryValue;
}

/**
 * 統合カテゴリー選択ダイアログを表示
 */
function showUnifiedCategoryDialog() {
  try {
    var html = HtmlService.createHtmlOutputFromFile('UnifiedCategoryDialog')
      .setWidth(550).setHeight(650);
    SpreadsheetApp.getUi().showModalDialog(html, '📋 テンプレート＋ポリシー設定');
  } catch (e) {
    showAlert('ダイアログの表示に失敗: ' + e.message, 'error');
  }
}
/**
 * 自動出力：O1とO2の値を使用して自動処理
 */
function autoApplyTemplateAndPolicy() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('作業シート');
    
    if (!sheet) {
      showAlert('作業シートが見つかりません', 'error');
      return;
    }
    
    // 1. O1とO2の値を取得
    var categoryDisplay = sheet.getRange('O1').getValue();
    var templateName = sheet.getRange('O2').getValue();
    
    if (!categoryDisplay || !templateName) {
      showAlert('O1（カテゴリー）またはO2（テンプレート名）が設定されていません', 'error');
      return;
    }
    
    // 日本語表示を内部値に変換
    var category = convertCategoryDisplayToValue(categoryDisplay);
    
    // 2. 選択範囲を取得
    var range = sheet.getActiveRange();
    
    if (!range) {
      showAlert('セル範囲を選択してください', 'error');
      return;
    }
    
    var startRow = range.getRow();
    var endRow = range.getLastRow();
    var numRows = endRow - startRow + 1;
    
    // 3. ポップアップ設定を確認
    var settings = getSettings();
    var showPopups = settings ? settings.showPopups === 'true' : false;
    
    if (showPopups) {
      // 確認ダイアログを表示
      var ui = SpreadsheetApp.getUi();
      var response = ui.alert(
        '自動出力確認',
        '以下の設定で処理します：\n\n' +
        'カテゴリー: ' + categoryDisplay + '\n' +
        'テンプレート: ' + templateName + '\n' +
        '処理範囲: ' + numRows + '行（行' + startRow + '～' + endRow + '）\n\n' +
        'よろしいですか？',
        ui.ButtonSet.YES_NO
      );
      
      if (response !== ui.Button.YES) {
        showAlert('キャンセルしました', 'info');
        return;
      }
    }
    
    // 4. 対象行を配列化（5行目以降＋R・X・AC列すべてにデータあり）✅ 修正箇所
    var targetRows = [];
    
    // R列、X列、AC列のデータを一括取得（効率化）
    var checkStartRow = Math.max(5, startRow);
    var rRange = sheet.getRange('R' + checkStartRow + ':R' + endRow).getValues();
    var xRange = sheet.getRange('X' + checkStartRow + ':X' + endRow).getValues();
    var acRange = sheet.getRange('AC' + checkStartRow + ':AC' + endRow).getValues();
    
    for (var row = startRow; row <= endRow; row++) {
      if (row >= 5) {
        var dataIndex = row - checkStartRow;  // 配列のインデックス計算
        var rValue = rRange[dataIndex][0];
        var xValue = xRange[dataIndex][0];
        var acValue = acRange[dataIndex][0];
        
        // R列、X列、AC列の3つすべてにデータがある場合のみ処理対象
        if (rValue !== null && rValue !== '' &&
            xValue !== null && xValue !== '' &&
            acValue !== null && acValue !== '') {
          targetRows.push(row);
        }
      }
    }
    
    // 対象行が0件の場合
    if (targetRows.length === 0) {
      showAlert('処理対象のデータがありません\n（R列・X列・AC列のいずれかが空白）', 'info');
      return;
    }
    
    var successCount = 0;
    var errorCount = 0;
    var skippedCount = (endRow - startRow + 1) - targetRows.length;
    
    // 5. 50行ずつバッチ処理
    var BATCH_SIZE = 50;
    for (var i = 0; i < targetRows.length; i += BATCH_SIZE) {
      var batch = targetRows.slice(i, Math.min(i + BATCH_SIZE, targetRows.length));
      
      var result = applyUnifiedSettingsBatch_(
        sheet,
        batch,
        category,
        templateName,
        'auto',  // templateMode: 自動
        'auto',  // policyMode: 自動
        null     // manualPolicyId: 自動モードなのでnull
      );
      
      successCount += result.successCount;
      errorCount += result.errorCount;
      
      Utilities.sleep(200);
    }
    
    // 6. 結果表示（ポップアップ設定に関わらず表示）
    if (showPopups) {
      var message = '✅ 自動出力完了\n\n' +
        '成功: ' + successCount + '件\n' +
        'エラー: ' + errorCount + '件\n' +
        'スキップ: ' + skippedCount + '件（空白行・データ不足含む）\n\n' +
        'カテゴリー: ' + categoryDisplay + '\n' +
        'テンプレート: ' + templateName;
      
      showAlert(message, errorCount > 0 ? 'warning' : 'success');
    }
    
  } catch (e) {
    // エラーは常に表示
    showAlert('エラー: ' + e.message, 'error');
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート・ポリシーインポート機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * インポート用シートを作成
 */
function createImportSheets() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Import_Templatesシート作成
    var templateSheet = ss.getSheetByName('Import_Templates');
    if (templateSheet) {
      var response = SpreadsheetApp.getUi().alert(
        'シート作成確認',
        'Import_Templatesシートは既に存在します。\n既存データを削除して再作成しますか？',
        SpreadsheetApp.getUi().ButtonSet.YES_NO
      );
      if (response === SpreadsheetApp.getUi().Button.YES) {
        ss.deleteSheet(templateSheet);
      } else {
        return;
      }
    }
    
    // Import_Policiesシート作成
    var policySheet = ss.getSheetByName('Import_Policies');
    if (policySheet) {
      var response2 = SpreadsheetApp.getUi().alert(
        'シート作成確認',
        'Import_Policiesシートは既に存在します。\n既存データを削除して再作成しますか？',
        SpreadsheetApp.getUi().ButtonSet.YES_NO
      );
      if (response2 === SpreadsheetApp.getUi().Button.YES) {
        ss.deleteSheet(policySheet);
      } else {
        return;
      }
    }
    
    // Import_Templatesシート作成
    setupImportTemplatesSheet(ss);
    
    // Import_Policiesシート作成
    setupImportPoliciesSheet(ss);
    
    // 使い方ガイド表示
    showImportGuide();
    
  } catch (e) {
    showAlert('インポートシート作成エラー: ' + e.message, 'error');
  }
}

/**
 * Import_Templatesシートのセットアップ
 */
function setupImportTemplatesSheet(ss) {
  var sheet = ss.insertSheet('Import_Templates');
  
  // ヘッダー設定
  sheet.getRange('A1').setValue('Template ID');
  sheet.getRange('B1').setValue('日本語名');
  sheet.getRange('C1').setValue('自動生成された標準名（確認用）');
  
  // ヘッダー書式
  sheet.getRange('A1:C1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  
  // 列幅設定
  sheet.setColumnWidth(1, 100); // A列
  sheet.setColumnWidth(2, 300); // B列
  sheet.setColumnWidth(3, 350); // C列
  
  // サンプル行
  sheet.getRange('A2').setValue('（例）982');
  sheet.getRange('B2').setValue('新品　エコノミー');
  sheet.getRange('A3').setValue('（例）1002');
  sheet.getRange('B3').setValue('トレカ　Graded（鑑定済み）');
  
  // 説明
  sheet.getRange('A5').setValue('【入力方法】');
  sheet.getRange('A6').setValue('1. A列にテンプレートID（eBayで使っている番号）を入力');
  sheet.getRange('A7').setValue('2. B列に日本語名を入力');
  sheet.getRange('A8').setValue('3. メニューから「データを検証」を実行するとC列に標準名が自動生成されます');
  sheet.getRange('A9').setValue('4. 確認後、「Policy_Masterに反映」で確定');
  
  sheet.getRange('A5:A9').setFontWeight('bold');
}

/**
 * Import_Policiesシートのセットアップ
 */
function setupImportPoliciesSheet(ss) {
  var sheet = ss.insertSheet('Import_Policies');
  
  // ヘッダー設定
  sheet.getRange('A1').setValue('Policy ID');
  sheet.getRange('B1').setValue('ポリシー名');
  sheet.getRange('C1').setValue('送料（USD）');
  
  // ヘッダー書式
  sheet.getRange('A1:C1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  
  // 列幅設定
  sheet.setColumnWidth(1, 100); // A列
  sheet.setColumnWidth(2, 350); // B列
  sheet.setColumnWidth(3, 100); // C列
  
  // サンプル行
  sheet.getRange('A2').setValue('（例）5001');
  sheet.getRange('B2').setValue('Egl_202510_eco_new_0001_0020');

  // 説明
  sheet.getRange('A4').setValue('【入力方法】');
  sheet.getRange('A5').setValue('1. A列にポリシーID（eBayで使っている番号）を入力');
  sheet.getRange('A6').setValue('2. B列にポリシー名（eBayからコピー）を入力');
  sheet.getRange('A7').setValue('3. メニューから「データを検証」を実行するとC列に送料が自動計算されます');
  sheet.getRange('A8').setValue('4. ポリシー名の数字は想定関税の範囲（例: _0001_0020 = 関税$1-20）');
  sheet.getRange('A9').setValue('5. 想定関税の上限値がそのまま送料になります（例: _0020 = 送料$20）');

  sheet.getRange('A4:A9').setFontWeight('bold');
}

/**
 * インポートガイドを表示
 */
function showImportGuide() {
  var guide = 
    '📥 インポート用シートを作成しました\n\n' +
    '【手順】\n\n' +
    '1️⃣ Import_Templates シート\n' +
    '   • A列: テンプレートID\n' +
    '   • B列: 日本語名（例: 新品　エコノミー）\n\n' +
    '2️⃣ Import_Policies シート\n' +
    '   • A列: ポリシーID\n' +
    '   • B列: ポリシー名（eBayからコピー）\n\n' +
    '3️⃣ データ入力後\n' +
    '   • メニュー→「データを検証」で確認\n' +
    '   • メニュー→「Policy_Masterに反映」で確定\n\n' +
    '💡 各シートに詳しい説明があります';
  
  showAlert(guide, 'success');
}

/**
 * 日本語名から標準テンプレート名を生成（新形式対応）
 */
function generateStandardTemplateName(japaneseName) {
  try {
    var name = String(japaneseName || '').trim();
    if (!name) return null;
    
    // 配送タイプ判定と削除
    var shipping = null;
    var nameWithoutShipping = name;
    
    if (name.match(/エコノミー|[Ee]conomy|小形包装物|[Ss]mall.*[Pp]acket/)) {
      shipping = 'eco';
      nameWithoutShipping = name.replace(/エコノミー|[Ee]conomy|小形包装物|[Ss]mall.*[Pp]acket/g, '').trim();
    } else if (name.match(/クーリエ|クリエ|XP|速達|[Ee]xpress/)) {
      shipping = 'xp';
      nameWithoutShipping = name.replace(/クーリエ|クリエ|XP|速達|[Ee]xpress/g, '').trim();
    }
    
    if (!shipping) {
      console.error('配送タイプが判定できません: ' + name);
      return null;
    }
    
    // 状態判定と削除
    var condition = null;
    var templateName = nameWithoutShipping;
    
    if (nameWithoutShipping.match(/新品|[Nn]ew/)) {
      condition = 'new';
      templateName = nameWithoutShipping.replace(/新品|[Nn]ew/g, '').trim();
    } else if (nameWithoutShipping.match(/中古|[Uu]sed/)) {
      condition = 'used';
      templateName = nameWithoutShipping.replace(/中古|[Uu]sed/g, '').trim();
    } else {
      console.error('商品状態が判定できません: ' + name);
      return null;
    }
    
    // 残った部分がテンプレート名
    // 空の場合のみ「一般汎用」
    if (!templateName || templateName === '') {
      templateName = '一般汎用';
    }
    
    // 新形式で生成：Template_テンプレート名_状態_配送方法
    return 'Template_' + templateName + '_' + condition + '_' + shipping;
    
  } catch (e) {
    console.error('標準名生成エラー: ' + e.message);
    return null;
  }
}
/**
 * ポリシー名から送料を計算（改良版：上限なし対応）
 */
/**
 * ポリシー名から送料を計算（想定関税ベース版）
 * ポリシー名の数字は想定関税の範囲を表し、上限値がそのまま送料となる
 */
function calculateShippingFeeFromPolicyName(policyName, allPolicies) {
  try {
    var name = String(policyName || '').trim();
    if (!name) return null;

    // 旧形式（販売価格ベース）を除外
    // 2番目の部分がハイフンを含まない = 旧形式 → 手動判定用
    var parts = name.split('_');
    if (parts.length >= 2 && parts[1].indexOf('-') === -1) {
      return null;
    }

    // 通常の関税範囲（例: _0001_0020）
    // 上限値がそのまま送料
    var normalMatch = name.match(/_(\d{4})$/);
    if (normalMatch) {
      var maxTax = parseInt(normalMatch[1], 10);
      if (isNaN(maxTax)) return null;
      return maxTax; // 想定関税の上限値 = 送料
    }

    // 上限なし（例: _0301_）
    var openEndMatch = name.match(/_(\d{4})_$/);
    if (openEndMatch) {
      var minTax = parseInt(openEndMatch[1], 10);
      if (isNaN(minTax)) return null;

      // 同じタイプのポリシーから直前の送料と上昇額を探す
      var prefix = name.replace(/_\d{4}_$/, '');
      var previousData = findPreviousFeeAndIncrement(prefix, minTax, allPolicies);

      if (previousData !== null) {
        return previousData.lastFee + previousData.increment;
      } else {
        // 見つからない場合は最小値+20を返す（デフォルト刻み）
        return minTax + 20;
      }
    }

    return null;

  } catch (e) {
    console.error('送料計算エラー: ' + e.message);
    return null;
  }
}

/**
 * 同じタイプのポリシーから直前の送料と上昇額を探す
 */
function findPreviousFeeAndIncrement(prefix, minPrice, allPolicies) {
  try {
    if (!allPolicies || !Array.isArray(allPolicies)) return null;
    
    var candidates = [];
    
    // 同じprefixのポリシーを抽出
    for (var i = 0; i < allPolicies.length; i++) {
      var policy = allPolicies[i];
      if (!policy.name || policy.name.indexOf(prefix) !== 0) continue;
      
      // 価格範囲を抽出（通常形式のみ）
      var match = policy.name.match(/_(\d{4})_(\d{4})$/);
      if (!match) continue;
      
      var policyMin = parseInt(match[1], 10);
      var policyMax = parseInt(match[2], 10);
      
      if (isNaN(policyMin) || isNaN(policyMax)) continue;
      if (typeof policy.calculatedFee !== 'number') continue;
      
      candidates.push({
        min: policyMin,
        max: policyMax,
        fee: policy.calculatedFee
      });
    }
    
    if (candidates.length < 2) return null; // 上昇額計算には2つ必要
    
    // 価格順にソート
    candidates.sort(function(a, b) { return a.min - b.min; });
    
    // minPriceの直前を探す
    var lastIndex = -1;
    for (var j = candidates.length - 1; j >= 0; j--) {
      if (candidates[j].max < minPrice) {
        lastIndex = j;
        break;
      }
    }
    
    if (lastIndex < 1) return null; // さらに直前が必要
    
    var lastFee = candidates[lastIndex].fee;
    var secondLastFee = candidates[lastIndex - 1].fee;
    var increment = lastFee - secondLastFee;
    
    return {
      lastFee: lastFee,
      increment: increment
    };
    
  } catch (e) {
    console.error('送料上昇額検索エラー: ' + e.message);
    return null;
  }
}

/**
 * インポートデータを検証（手動ポリシー対応版）
 */
function validateImportData() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    
    if (!templateSheet || !policySheet) {
      showAlert('先に「インポート用シートを作成」を実行してください。', 'error');
      return;
    }
    
    var report = '🔍 データ検証結果:\n\n';
    var hasError = false;
    
    // テンプレートの検証（既存のまま）
    report += '【テンプレート】\n';
    var templateCount = 0;
    var templateErrors = 0;
    
    var templateLastRow = templateSheet.getLastRow();
    for (var i = 2; i <= templateLastRow; i++) {
      var id = templateSheet.getRange(i, 1).getValue();
      var jaName = templateSheet.getRange(i, 2).getValue();
      
      if (!id && !jaName) continue;
      if (String(id).indexOf('（例）') !== -1) continue;
      
      if (!id || !jaName) {
        templateErrors++;
        continue;
      }
      
      var standardName = generateStandardTemplateName(jaName);
      if (standardName) {
        templateSheet.getRange(i, 3).setValue(standardName);
        templateCount++;
      } else {
        templateSheet.getRange(i, 3).setValue('⚠️ 変換失敗');
        templateErrors++;
        hasError = true;
      }
    }
    
    report += '検出: ' + templateCount + '件\n';
    if (templateErrors > 0) {
      report += '⚠️ エラー: ' + templateErrors + '件\n';
    }
    
    // ポリシーの検証（2パス処理 + 手動用対応）
    report += '\n【シッピングポリシー】\n';
    
    // パス1: 全ポリシーを読み込み
    var policyLastRow = policySheet.getLastRow();
    var allPolicies = [];
    
    for (var j = 2; j <= policyLastRow; j++) {
      var policyId = policySheet.getRange(j, 1).getValue();
      var policyName = policySheet.getRange(j, 2).getValue();
      
      if (!policyId || !policyName) continue;
      if (String(policyId).indexOf('（例）') !== -1) continue;
      
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
    var policyErrors = 0;
    
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
        // 🔹 新機能：計算失敗 = 手動用ポリシー
        policySheet.getRange(pol.row, 3).setValue('手動用');
        manualPolicyCount++;
      }
    }
    
    report += '自動判定用: ' + policyCount + '件\n';
    report += '手動選択用: ' + manualPolicyCount + '件\n';
    
    report += '\n';
    if (hasError) {
      report += '⚠️ テンプレートにエラーがあります。B列の入力を確認してください。\n\n';
    }
    if (policyCount > 0 || manualPolicyCount > 0 || templateCount > 0) {
      report += '✅ 「Policy_Masterに反映」で確定できます。\n';
      report += '💡 手動用ポリシーは、手動選択時に使用できます。';
    } else {
      report += 'データが見つかりませんでした。';
    }
    
    showAlert(report, hasError ? 'warning' : 'success');
    
  } catch (e) {
    showAlert('検証エラー: ' + e.message, 'error');
  }
}
/**
 * Policy_Masterに反映
 */
function applyImportToPolicyMaster() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    
    if (!templateSheet || !policySheet) {
      showAlert('先にインポート用シートを作成してください。', 'error');
      return;
    }
    
    // 確認ダイアログ
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      'Policy_Master反映確認',
      'Policy_Masterシートを新規作成します。\n既存のPolicy_Masterは削除されます。\n\nよろしいですか？',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      showAlert('キャンセルしました。', 'info');
      return;
    }
    
    // 既存のPolicy_Masterを削除
    var existingSheet = ss.getSheetByName('Policy_Master');
    if (existingSheet) {
      ss.deleteSheet(existingSheet);
    }
    
    // 新しいPolicy_Masterを作成
    var masterSheet = ss.insertSheet('Policy_Master');
    
    // テンプレートセクション
    var currentRow = 1;
    currentRow = writeTemplatesToMaster(masterSheet, templateSheet, currentRow);
    
    // ポリシーセクション
    currentRow += 2; // 空行
    currentRow = writePoliciesToMaster(masterSheet, policySheet, currentRow);
    
    showAlert('✅ Policy_Masterに反映しました！\n\n今後のテンプレート・ポリシー判定にこのデータが使用されます。', 'success');
    
    // Policy_Masterシートを表示
    ss.setActiveSheet(masterSheet);
    
  } catch (e) {
    showAlert('反映エラー: ' + e.message, 'error');
  }
}

/**
 * テンプレートをPolicy_Masterに書き込み
 */
function writeTemplatesToMaster(masterSheet, sourceSheet, startRow) {
  // ヘッダー
  masterSheet.getRange(startRow, 1, 1, 3).mergeAcross();
  masterSheet.getRange(startRow, 1).setValue('【Templates】');
  masterSheet.getRange(startRow, 1).setFontWeight('bold').setFontSize(12)
    .setBackground('#34a853').setFontColor('white').setHorizontalAlignment('center');
  
  startRow++;

  // 列ヘッダー（バッチ書き込み）
  masterSheet.getRange(startRow, 1, 1, 3).setValues([['Template ID', 'Template Name', '説明']]);
  masterSheet.getRange(startRow, 1, 1, 3).setFontWeight('bold').setBackground('#d9ead3');

  startRow++;

  // データ書き込み + 日本語名を収集（入力一括取得・出力バッチ書き込み）
  var lastRow = sourceSheet.getLastRow();
  var dataRow = startRow;
  var templateJapaneseNames = []; // 日本語名を収集する配列
  var templateRows = [];          // バッチ書き込み用 2D 配列

  if (lastRow >= 2) {
    var srcData = sourceSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    for (var i = 0; i < srcData.length; i++) {
      var id = srcData[i][0];
      var jaName = srcData[i][1];
      var standardName = srcData[i][2];

      if (!id || !standardName || String(id).indexOf('（例）') !== -1) continue;
      if (String(standardName).indexOf('⚠️') !== -1) continue; // エラー行スキップ

      templateRows.push([id, standardName, jaName]);

      // 🔹 日本語名を抽出（Template_{ここ}_{状態}_{配送}）
      var match = String(standardName).match(/^Template_(.+?)_(?:new|used)_(?:eco|xp)$/);
      if (match && match[1]) {
        templateJapaneseNames.push(match[1]);
      }
    }
  }

  if (templateRows.length > 0) {
    masterSheet.getRange(dataRow, 1, templateRows.length, 3).setValues(templateRows);
    dataRow += templateRows.length;
  }

  // 罫線
  if (dataRow > startRow) {
    masterSheet.getRange(startRow - 1, 1, dataRow - startRow + 1, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  }
  
  // 列幅
  masterSheet.setColumnWidth(1, 130);
  masterSheet.setColumnWidth(2, 350);
  masterSheet.setColumnWidth(3, 280);
  
  // 作業シートの取得
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var workSheet = ss.getSheetByName('作業シート');
  
  if (!workSheet) {
    console.warn('作業シートが見つかりません');
    return dataRow;
  }
  
  // 🔹 O2セル：テンプレート名のドロップダウン設定
  if (templateJapaneseNames.length > 0) {
    // 重複除外
    var uniqueNames = [];
    for (var j = 0; j < templateJapaneseNames.length; j++) {
      if (uniqueNames.indexOf(templateJapaneseNames[j]) === -1) {
        uniqueNames.push(templateJapaneseNames[j]);
      }
    }
    
    var templateRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(uniqueNames, true)
      .setAllowInvalid(false)
      .build();
    
    workSheet.getRange('O2').setDataValidation(templateRule);
    workSheet.getRange('O2').setValue(uniqueNames[0]); // 常に上書き
  }
  
  // 🔹 O1セル：送料上限カテゴリーのドロップダウン設定
  var categories = [
  '汎用（上限なし）',
  'Video Games（$20）',
  'Books（$20）',
  'Movies & TV（$20）',
  'Music（$25）',
  'Game Consoles（$50）'
];

var categoryRule = SpreadsheetApp.newDataValidation()
  .requireValueInList(categories, true)
  .setAllowInvalid(false)
  .build();

workSheet.getRange('O1').setDataValidation(categoryRule);
workSheet.getRange('O1').setValue('汎用（上限なし）'); // デフォルトは汎用
  
  return dataRow;
}
/**
 * カテゴリーの日本語表示を内部値に変換
 * @param {string} displayValue - 日本語表示（例：'汎用（上限なし）'）
 * @return {string} 内部値（例：'general'）
 */
function convertCategoryDisplayToValue(displayValue) {
  var mapping = {
    '汎用（上限なし）': 'general',
    'Video Games（$20）': 'videogames',
    'Books（$20）': 'books',
    'Movies & TV（$20）': 'movies',
    'Music（$25）': 'music',
    'Game Consoles（$50）': 'console'
  };
  
  return mapping[displayValue] || 'general'; // 見つからない場合はgeneral
}

/**
 * カテゴリーの内部値を日本語表示に変換
 * @param {string} value - 内部値（例：'general'）
 * @return {string} 日本語表示（例：'汎用（上限なし）'）
 */
function convertCategoryValueToDisplay(value) {
  var mapping = {
    'general': '汎用（上限なし）',
    'videogames': 'Video Games（$20）',
    'books': 'Books（$20）',
    'movies': 'Movies & TV（$20）',
    'music': 'Music（$25）',
    'console': 'Game Consoles（$50）'
  };
  
  return mapping[value] || '汎用（上限なし）'; // 見つからない場合は汎用
}
/**
 * ポリシーをPolicy_Masterに書き込み（手動用対応）
 */
function writePoliciesToMaster(masterSheet, sourceSheet, startRow) {
  // 自動判定用ポリシーのヘッダー
  masterSheet.getRange(startRow, 1, 1, 3).mergeAcross();
  masterSheet.getRange(startRow, 1).setValue('【Shipping Policies - 自動判定用】');
  masterSheet.getRange(startRow, 1).setFontWeight('bold').setFontSize(12)
    .setBackground('#4285f4').setFontColor('white').setHorizontalAlignment('center');
  
  startRow++;

  // 列ヘッダー（バッチ書き込み）
  masterSheet.getRange(startRow, 1, 1, 3).setValues([['Policy ID', 'Policy Name', '送料上乗せ（USD）']]);
  masterSheet.getRange(startRow, 1, 1, 3).setFontWeight('bold').setBackground('#cfe2f3');

  startRow++;

  // ソースデータを一括読み込み
  var lastRow = sourceSheet.getLastRow();
  var DDP_PATTERNS_WRITE = ['eco_new_free', 'eco_used_free', 'xp_new_free', 'xp_used_free'];
  var dataRow = startRow;
  var manualPolicies = []; // 真の手動用（DDP でない）[id, name]
  var ddpPolicies = [];    // DDP 専用（_free を含む）[id, name]
  var autoRows = [];       // 自動判定用データ行

  if (lastRow >= 2) {
    var srcData = sourceSheet.getRange(2, 1, lastRow - 1, 3).getValues();
    for (var i = 0; i < srcData.length; i++) {
      var id = srcData[i][0];
      var name = srcData[i][1];
      var fee = srcData[i][2];

      if (!id || !name || String(id).indexOf('（例）') !== -1) continue;

      if (typeof fee === 'number' && !isNaN(fee)) {
        // 自動判定用 → A-C 列上部
        autoRows.push([id, name, fee]);
      } else if (String(fee) === '手動用') {
        // 手動用 → DDP かどうかで振り分け
        var nameStr = String(name);
        var isDdp = false;
        for (var dp = 0; dp < DDP_PATTERNS_WRITE.length; dp++) {
          if (nameStr.indexOf(DDP_PATTERNS_WRITE[dp]) !== -1) {
            isDdp = true;
            break;
          }
        }
        if (isDdp) {
          ddpPolicies.push([id, name]);
        } else {
          manualPolicies.push([id, name]);
        }
      }
    }
  }

  // 自動判定用データを一括書き込み
  if (autoRows.length > 0) {
    masterSheet.getRange(dataRow, 1, autoRows.length, 3).setValues(autoRows);
    dataRow += autoRows.length;
  }

  // 罫線（自動判定セクション）
  if (dataRow > startRow) {
    masterSheet.getRange(startRow - 1, 1, dataRow - startRow + 1, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  }

  // 🔹 DDP 専用セクション（A-C 列下部）
  if (ddpPolicies.length > 0) {
    dataRow += 2; // 空行を挟む

    masterSheet.getRange(dataRow, 1, 1, 3).mergeAcross();
    masterSheet.getRange(dataRow, 1).setValue('【Shipping Policies - DDP 専用】');
    masterSheet.getRange(dataRow, 1).setFontWeight('bold').setFontSize(12)
      .setBackground('#9c27b0').setFontColor('white').setHorizontalAlignment('center');
    dataRow++;

    masterSheet.getRange(dataRow, 1, 1, 3).setValues([['Policy ID', 'Policy Name', '']]);
    masterSheet.getRange(dataRow, 1, 1, 3).setFontWeight('bold').setBackground('#e1bee7');

    var ddpHeaderRow = dataRow;
    dataRow++;

    var ddpRows = ddpPolicies.map(function(p) { return [p[0], p[1], '']; });
    var ddpDataStartRow = ddpHeaderRow + 1;
    masterSheet.getRange(dataRow, 1, ddpRows.length, 3).setValues(ddpRows);
    dataRow += ddpRows.length;

    // Named Range 登録（O 列の式から参照）
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var existingRanges = ss.getNamedRanges();
    for (var nr = 0; nr < existingRanges.length; nr++) {
      if (existingRanges[nr].getName() === 'DDP_POLICY_RANGE') {
        existingRanges[nr].remove();
        break;
      }
    }
    ss.setNamedRange('DDP_POLICY_RANGE',
      masterSheet.getRange(ddpDataStartRow, 1, ddpRows.length, 3));

    masterSheet.getRange(ddpHeaderRow, 1, dataRow - ddpHeaderRow, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  }

  // 🔹 手動選択用ポリシーセクション（E-G列に出力、DDP 以外）
  if (manualPolicies.length > 0) {
    var manualStartRow = 1; // E列の開始行

    masterSheet.getRange(manualStartRow, 5, 1, 3).mergeAcross();
    masterSheet.getRange(manualStartRow, 5).setValue('【Shipping Policies - 手動選択用】');
    masterSheet.getRange(manualStartRow, 5).setFontWeight('bold').setFontSize(12)
      .setBackground('#ff9800').setFontColor('white').setHorizontalAlignment('center');

    manualStartRow++;

    masterSheet.getRange(manualStartRow, 5, 1, 3).setValues([['Policy ID', 'Policy Name', '備考']]);
    masterSheet.getRange(manualStartRow, 5, 1, 3).setFontWeight('bold').setBackground('#ffe0b2');

    manualStartRow++;

    var manualRows = manualPolicies.map(function(p) { return [p[0], p[1], '価格範囲不明・手動選択用']; });
    masterSheet.getRange(manualStartRow, 5, manualRows.length, 3).setValues(manualRows);
    manualStartRow += manualRows.length;

    masterSheet.getRange(1, 5, manualStartRow - 1, 3)
      .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

    masterSheet.setColumnWidth(5, 130); // E列
    masterSheet.setColumnWidth(6, 350); // F列
    masterSheet.setColumnWidth(7, 280); // G列
  }

  return dataRow;
}
/**
 * 手動選択用ポリシーのリストを取得（E-G列から取得）
 * @return {Array} [{id: xxx, name: xxx}]
 */
function getManualPolicies() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var masterSheet = ss.getSheetByName('Policy_Master');

    if (!masterSheet) {
      return [];
    }

    var lastRow = masterSheet.getLastRow();
    if (lastRow < 3) {
      return []; // ヘッダー含めて最低3行必要
    }

    // E-G列（列5-7）からデータを取得
    var data = masterSheet.getRange(1, 5, lastRow, 3).getValues();
    var manualPolicies = [];
    var inManualSection = false;

    for (var i = 0; i < data.length; i++) {
      var cellValue = String(data[i][0]);

      // 手動選択用セクション開始
      if (cellValue.indexOf('【Shipping Policies - 手動選択用】') !== -1) {
        inManualSection = true;
        continue;
      }

      // ヘッダー行をスキップ
      if (inManualSection && cellValue === 'Policy ID') {
        continue;
      }

      // 手動セクション内でポリシーを抽出
      if (inManualSection && data[i][0] && data[i][1]) {
        manualPolicies.push({
          id: data[i][0],
          name: data[i][1]
        });
      }
    }

    return manualPolicies;

  } catch (e) {
    console.error('手動ポリシー取得エラー: ' + e.message);
    return [];
  }
}
