/******************************************************
 * Config.gs - 設定と定数
 * - CONFIG定数
 * - 設定の保存・読み込み
 * - 価格表示モード管理
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  CONFIG / 定数
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var CONFIG = {
  API_TIMEOUT: 60000,
  BATCH_SIZE: 5,
  SLEEP_BETWEEN_API_CALLS: 1500,
  SLEEP_BETWEEN_BATCHES: 3000,
  MAX_RETRIES: 3,
  CONTINUATION_INTERVAL_MINUTES: 1,
  PARALLEL_REQUESTS: 10,   // 1バッチで同時に投げるAIリクエスト数

  // 列番号（1-based）
  COLUMNS: {
    // A-I列: 基本情報
    DATE: 1,           // A列: 日付
    PERSON: 2,         // B列: 担当
    LABEL: 3,          // C列: label
    TAG: 4,            // D列: タグ
    TEMPLATE: 5,       // E列: テンプレ
    REF_EBAY: 6,       // F列: 参考Ebay
    SUPPLIER: 7,       // G列: 仕入先
    SUPPLIER_CODE: 8,  // H列: 仕入先コード
    COST_YEN: 9,       // I列: 仕入価格

    // J-N列: 商品情報
    JP_TITLE: 10,      // J列: 日本語タイトル
    JP_DESC: 11,       // K列: 商品説明
    SELLER_ID: 12,     // L列: セラーID
    EN_TITLE: 13,      // M列: Title（英語タイトル）
    EN_DESC: 14,       // N列: Condition/Description

    // O-W列: 出品情報
    SHIPPING_POLICY: 15,      // O列: シッピングポリシー
    TITLE_LENGTH: 16,         // P列: タイトル文字数
    DESC_LENGTH: 17,          // Q列: 説明文文字数
    PRICE: 18,                // R列: 販売価格
    TAX_INCLUDED_PRICE: 19,   // S列: 関税込み価格
    SHIPPING: 20,             // T列: 送料
    PROFIT: 21,               // U列: 利益
    FEE: 22,                  // V列: 手数料率
    RATE: 23,                 // W列: 利益率

    // X-AC列: 配送情報
    METHOD: 24,        // X列: 配送方法
    WEIGHT: 25,        // Y列: 実重量
    LENGTH: 26,        // Z列: 長さ (cm)
    WIDTH: 27,         // AA列: 幅 (cm)
    HEIGHT: 28,        // AB列: 高さ (cm)
    VOLUME: 29,        // AC列: 容積重量

    // AD-AG列: 関税・状態・送料
    ESTIMATED_TAX: 30,        // AD列: 想定関税
    CONDITION: 31,            // AE列: 状態
    BASE_SHIPPING: 32,        // AF列: 基本送料
    DDU_ADJUSTED_PRICE: 33,   // AG列: DDU調整後価格

    ACTUAL_TAX: 34,           // AH列: 実際の関税額

    // AT列: チェック
    DUPLICATE_CHECK: 46       // AT列: 重複チェック
  },

  // 料金・見積
  RATES: {
    PLATFORMS: {
      openai: {
        models: {
          'gpt-5-nano':  { combined: 0.0003 },
          'gpt-5-mini':  { combined: 0.0006 },
          'gpt-4o-mini': { combined: 0.0006 },
          'gpt-4o':      { combined: 0.015  },
          'gpt-4-turbo': { combined: 0.03   }
        }
      },
      claude: {
        models: {
          'claude-3-haiku-20240307':   { combined: 0.0015 },
          'claude-3-sonnet-20240229':  { combined: 0.015  },
          'claude-3-opus-20240229':    { combined: 0.075  }
        }
      },
      gemini: {
        models: {
          'gemini-1.5-flash': { combined: 0.0008 },
          'gemini-1.5-pro':   { combined: 0.0035 },
          'gemini-pro':       { combined: 0.005  }
        }
      }
    }
  },

  PRICE_DISPLAY_MODE: {
    DEFAULT_MODE: 'NORMAL',
    MODES: {
      NORMAL: 'NORMAL',
      TAX_INCLUDED: 'TAX_INCLUDED'
    }
  },

  SHIPPING_METHODS: {
    EP:  { name: 'ePacket',        group: 'Economy', weightLimit: 2000, sizeLimit: 90,   calcType: 'actual'     },
    CE:  { name: 'Cpass-Economy',  group: 'Economy', weightLimit: 68000, sizeLimit: 0,   calcType: 'volumetric' },
    EMS: { name: 'EMS',            group: 'Express', weightLimit: 30000, sizeLimit: 1500, calcType: 'actual'     },
    CF:  { name: 'Cpass-FedEx',    group: 'Express', weightLimit: 68000, sizeLimit: 0,   calcType: 'volumetric' },
    CD:  { name: 'Cpass-DHL',      group: 'Express', weightLimit: 68000, sizeLimit: 0,   calcType: 'volumetric' },
    EL:  { name: 'eLogistics',     group: 'Express', weightLimit: 68000, sizeLimit: 0,   calcType: 'volumetric' },
    AM:  { name: 'Airmail',        group: 'Economy', weightLimit: 2000, sizeLimit: 0,   calcType: 'actual' }
  },

  SHIPPING_METHOD_OPTIONS: {
    lowPrice: {
      'EP': {
        name: 'ePacket',
        displayName: 'eパケット（重量・サイズ制限あり）',
        weightLimit: 2000,
        sizeLimit: 90
      },
      'CE': {
        name: 'Cpass-Economy',
        displayName: 'Cpass Economy（重量制限なし）',
        weightLimit: null,
        sizeLimit: null
      },
      'NONE': {
        name: 'なし',
        displayName: 'なし（高価格配送のみ使用）',
        weightLimit: null,
        sizeLimit: null
      }
    },
    highPrice: {
      'CF': {
        name: 'Cpass-FedEx',
        displayName: 'Cpass FedEx（燃油・割引・追加料金あり）',
        weightLimit: 68000
      },
      'CD': {
        name: 'Cpass-DHL',
        displayName: 'Cpass DHL（燃油・割引・追加料金あり）',
        weightLimit: 68000
      },
      'EL': {
        name: 'eLogistics',
        displayName: 'eLogistics（追加料金なし）',
        weightLimit: 68000
      }
    }
  },

  SHIPPING_RATE_COLUMNS: {
    EP: 3, CE: 4, EMS: 5, CF: 6, CD: 7, EL: 8
  },

  CONDITION_OPTIONS: ["新品", "中古", "エラー"],

  EBAY_CATEGORIES: [
    "Cell Phones & Smartphones", "Video Games", "Video Game Consoles", "Cameras & Photo",
    "Computer Components", "Consumer Electronics", "Audio Equipment", "Clothing", "Shoes",
    "Handbags & Purses", "Jewelry", "Watches", "Fashion Accessories", "Home Decor",
    "Kitchen & Dining", "Garden & Outdoor", "Tools & Hardware", "Action Figures",
    "Trading Cards", "Model Kits", "Other Toys", "Sports Equipment", "Outdoor Gear",
    "Fitness Equipment", "Books", "Movies & TV", "Music", "Video Games Software",
    "Skincare", "Makeup", "Health Supplements", "Office Supplies", "Industrial Equipment",
    "Car Parts", "Motorcycle Parts", "String Instruments", "Electronic Instruments",
    "Other Instruments", "Collectibles", "Antiques", "Art", "Other"
  ],

  SHIPPING_POLICY_CATEGORIES: {
    'Video Games': { limit: 20, display: 'Video Games (上限$20)' },
    'Video Game Consoles': { limit: 50, display: 'Video Game Consoles (上限$50)' },
    'Books': { limit: 20, display: 'Books (上限$20)' },
    'Movies & TV': { limit: 20, display: 'Movies & TV (上限$20)' },
    'Music': { limit: 25, display: 'Music (上限$25)' },
    'Other': { limit: null, display: 'その他（上限なし）' }
  },

  DDU_PRICE_ADJUSTMENT: {
    DEFAULT_ENABLED: false,
    DEFAULT_THRESHOLD: 390,
    DEFAULT_ADJUSTMENT: 200,
    HIGHLIGHT_COLOR: '#ffe0b3'
  }
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  APIキー・トークン管理（DocumentProperties使用）

  DocumentPropertiesを使用することで：
  - 各スプレッドシートごとに独立した保存領域
  - シートをコピーしても新しい空のDocumentPropertiesになる（APIキーはコピーされない）
  - ライブラリ更新の影響を受けない
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * デバッグ用: APIキー/トークンの状態を確認
 * メニューから実行して状態を確認できる
 */
function debugCheckApiKeyStatus() {
  var docProps = PropertiesService.getDocumentProperties();
  var currentSheetId = SpreadsheetApp.getActive().getId();
  var eagleToken = docProps.getProperty('eagle_api_token');
  var openaiKey = docProps.getProperty('OPENAI_API_KEY');

  var message = [
    '=== APIキー・トークン状態 ===',
    '現在のシートID: ' + currentSheetId,
    '',
    'EAGLEトークン: ' + (eagleToken ? '設定済み (' + eagleToken.substring(0, 10) + '...)' : '(未設定)'),
    'OpenAI APIキー: ' + (openaiKey ? '設定済み' : '(未設定)'),
    'Claude APIキー: ' + (docProps.getProperty('CLAUDE_API_KEY') ? '設定済み' : '(未設定)'),
    'Gemini APIキー: ' + (docProps.getProperty('GEMINI_API_KEY') ? '設定済み' : '(未設定)')
  ].join('\n');

  console.log(message);
  SpreadsheetApp.getUi().alert('APIキー状態確認', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  設定の取得
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getSettings() {
  var props = PropertiesService.getScriptProperties();
  var docProps = PropertiesService.getDocumentProperties();
  var platform = props.getProperty('AI_PLATFORM') || 'openai';
  var model = props.getProperty('AI_MODEL') || 'gpt-5-nano';

  // APIキーはDocumentPropertiesから取得（スプレッドシートごとに独立、コピー時は引き継がれない）
  var apiKey = (platform==='openai') ? docProps.getProperty('OPENAI_API_KEY') :
               (platform==='claude') ? docProps.getProperty('CLAUDE_API_KEY') :
               (platform==='gemini') ? docProps.getProperty('GEMINI_API_KEY') : '';

  var settings = {
    platform: platform,
    model: model,
    apiKey: apiKey,
    sheetName: props.getProperty('SHEET_NAME'),
    profitCalculationMethod: props.getProperty('PROFIT_CALC_METHOD'),
    promptId: props.getProperty('PROMPT_ID') || 'EBAY_FULL_LISTING_PROMPT',
    shippingThreshold: parseFloat(props.getProperty('SHIPPING_THRESHOLD')) || 5500,
    shippingCalculationMethod: props.getProperty('SHIPPING_CALC_METHOD') || 'TABLE',
    lowPriceShippingMethod: props.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'EP',
    highPriceShippingMethod: props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CF',

    dduAdjustmentEnabled: props.getProperty('DDU_ADJUSTMENT_ENABLED') === 'true',
    dduThreshold: parseFloat(props.getProperty('DDU_THRESHOLD')) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_THRESHOLD,
    dduAdjustmentAmount: parseFloat(props.getProperty('DDU_ADJUSTMENT_AMOUNT')) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_ADJUSTMENT,

    priceDisplayMode: props.getProperty('PRICE_DISPLAY_MODE') || 'NORMAL',

    duplicateCheckEnabled: props.getProperty('DUPLICATE_CHECK_ENABLED') === 'true'
  };

  var missing = [];
  if (!settings.platform) missing.push('AIプラットフォーム');
  if (!settings.model) missing.push('AIモデル');
  if (!settings.apiKey) missing.push('APIキー');
  if (!settings.sheetName) missing.push('作業シート名');
  if (!settings.profitCalculationMethod) missing.push('利益計算方法');
  if (!settings.promptId) missing.push('プロンプトID');
  if (isNaN(settings.shippingThreshold)) missing.push('送料計算切替基準金額');
  if (!settings.shippingCalculationMethod) missing.push('送料計算方法');
  if (!settings.lowPriceShippingMethod) missing.push('低価格商品配送方法');
  if (!settings.highPriceShippingMethod) missing.push('高価格商品配送方法');

  if (missing.length > 0) {
    showAlert('設定不足:\n\n• ' + missing.join('\n• ') + '\n\n「初期設定」を実行してください。',"error");
    return null;
  }
  return settings;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格表示モード管理
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getPriceDisplayMode() {
  var props = PropertiesService.getScriptProperties();
  var mode = props.getProperty('PRICE_DISPLAY_MODE');
  return (mode === 'TAX_INCLUDED') ? 'TAX_INCLUDED' : 'NORMAL';
}

function setPriceDisplayMode(mode, showMessage) {
  var props = PropertiesService.getScriptProperties();
  var validMode = (mode === 'TAX_INCLUDED') ? 'TAX_INCLUDED' : 'NORMAL';
  props.setProperty('PRICE_DISPLAY_MODE', validMode);

  if (showMessage === true) {
    var modeNames = {
      'NORMAL': '販売価格（通常）',
      'TAX_INCLUDED': '関税込み価格'
    };

    showAlert('価格表示モードを「' + modeNames[validMode] + '」に設定しました。', 'success');
  }
}

/**
 * 出品用シートの価格式を価格表示モードに応じて更新
 * @param {string} workSheetName - 作業シート名
 * @param {string} priceDisplayMode - 価格表示モード ('NORMAL' or 'TAX_INCLUDED')
 */
function updateListingSheetPriceFormula(workSheetName, priceDisplayMode) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var listingSheet = ss.getSheetByName('出品用シート');

    if (!listingSheet) {
      console.log('出品用シートが見つかりません。価格式の更新をスキップします。');
      return;
    }

    var formula;
    if (priceDisplayMode === 'TAX_INCLUDED') {
      // DDP（関税込み）モード → S列を参照
      formula = '={"出品価格";ARRAYFORMULA(IF(\'' + workSheetName + '\'!R5:R="","", \'' + workSheetName + '\'!S5:S))}';
    } else {
      // DDU（通常）モード → AG優先、なければR列
      formula = '={"出品価格";ARRAYFORMULA(IF((NOT(ISBLANK(\'' + workSheetName + '\'!AG5:AG)))*(ISNUMBER(\'' + workSheetName + '\'!AG5:AG)), \'' + workSheetName + '\'!AG5:AG, \'' + workSheetName + '\'!R5:R))}';
    }

    listingSheet.getRange('H2').setFormula(formula);
    console.log('出品用シートの価格式を更新しました: ' + (priceDisplayMode === 'TAX_INCLUDED' ? 'DDP' : 'DDU') + 'モード');

  } catch (e) {
    console.error('出品用シート価格式更新エラー: ' + e.message);
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  価格セルのハイライト設定
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function setPriceCellHighlight(sheet, row) {
  // ハイライト機能を無効化
  return;
}
