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
    DUPLICATE_CHECK: 46,      // AT列: 重複チェック

    // AU列: 使用プロンプト（翻訳時に自動記録）
    USED_PROMPT: 47,         // AU列: 使用プロンプトID
    // AV列: 交通整理バックアップ
    JP_DESC_BACKUP: 48,      // AV列: 商品説明バックアップ
    EN_DESC_SANITIZED: 49    // AW列: 交通整理英語版
  },

  // 交通整理: カテゴリ判定は IS_TAG_TO_CATEGORY（Config_IS.gs）に統合済み

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
    DEFAULT_THRESHOLD: 500,
    DEFAULT_ADJUSTMENT: 200,
    HIGHLIGHT_COLOR: '#ffe0b3'
  },

  // タグ別送料管理
  TAG_SHIPPING: {
    SHEET_NAME: 'TagShipping',
    HEADERS: ['タグ名', 'EP送料', 'CE送料', 'CF/CD送料', '参考eBay ID', 'SKU略称',
              'テンプレート名', '送料上限カテゴリ', '利益率', '広告費率', '手数料率',
              '低価格配送', '高価格配送', '送料切替基準'],
    TAG_LIST_START_COL: 17,
    HEADER_BG_COLOR: '#4285F4',
    HEADER_FONT_COLOR: '#FFFFFF'
  }
};

// 交通整理キーワードカテゴリ（レガシー互換・拡張用）
// 既存コードを壊さないよう、存在すれば拡張、なければ新規作成のみ行う
if (typeof SANITIZE_CATEGORIES === 'undefined') {
  var SANITIZE_CATEGORIES = {};
}

// 既存のcard定義の直後に追加する想定の拡張（存在しなくても追加のみ）
// game: ゲーム機本体関連
SANITIZE_CATEGORIES.game = {
  keywords: ['ゲーム機', 'ゲーム本体', 'コンソール', 'ファミコン', 'スーファミ',
    'ゲームボーイ', 'プレステ', 'PlayStation', 'PS5', 'PS4', 'PS3', 'PS2', 'PS1',
    'Switch', 'Wii', 'Xbox', 'ドリームキャスト', 'サターン', 'メガドライブ',
    'PCエンジン', 'ネオジオ', 'ゲームキューブ', 'Nintendo 64', 'N64',
    'DS', '3DS', 'PSP', 'PSVita', 'Steam Deck']
};

// reel: 釣り用リール
SANITIZE_CATEGORIES.reel = {
  keywords: ['リール', 'スピニングリール', 'ベイトリール', 'フライリール',
    '釣り', 'フィッシング', '両軸リール', '電動リール']
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  プロンプト⇔タグ マッピング（翻訳プロンプト自動選択用）
  キー: GPT_PromptsシートのA列プロンプトID
  値:   D列タグとの完全一致候補リスト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var PROMPT_TAG_MAPPING = {
  '時計用': ['時計','腕時計','ウォッチ','懐中時計','時計パーツ','ウォッチパーツ','時計部品'],
  'カメラ': ['カメラ','デジカメ','一眼レフ','ミラーレス'],
  'リール': ['リール', '電動リール'],
  '釣竿': ['釣竿','ロッド','竿'],
  '釣具汎用': ['ルアー','釣り','フィッシング'],
  'ゴルフ': ['ゴルフ','ゴルフクラブ','ゴルフヘッド'],
  'ジュエリー': ['ネックレス','リング','指輪','ブレスレット','ピアス','イヤリング','ブローチ','カフリンクス','カフスボタン','チャーム','ペンダントトップ'],
  'ポケカ': ['ポケカ','ポケモンカード'],
  'MTG': ['MTG','マジックザギャザリング'],
  'ベースボールカード': ['ベースボールカード','野球カード','BBM'],
  '大相撲カード': ['大相撲カード'],
  '遊戯王': ['遊戯王'],
  'ワンピースカード': ['ワンピースカード'],
  'ドラゴンボールカード': ['ドラゴンボールカード'],
  'ヴァイスシュヴァルツ': ['ヴァイスシュヴァルツ'],
  'デジモンカード': ['デジモン'],
  'トレカ汎用': ['ヴァンガード','デュエマ','デュエルマスターズ','バトスピ','バトルスピリッツ','トレカ','カード','トレーディングカード'],
  'ゲーム用': ['ゲーム','ゲームソフト'],
  'ゲーム機': ['ゲーム機'],
  'フィギュア': ['フィギュア','アクションフィギュア','ドール','ぬいぐるみ','アニメ','アニメグッズ'],
  'スニーカー': ['スニーカー'],
  'ドレスシューズ': ['靴','シューズ','ブーツ','パンプス','ローファー'],
  'アパレル・ブランド品': ['衣類','服','帽子','キャップ','スカーフ','マフラー','ストール','ベルト','ベルトバックル','ネクタイ','ネクタイピン','タイピン','ハンカチ','ヘアアクセサリー','バレッタ','かんざし','髪飾り'],
  'レザーグッズ': ['バッグ','財布','長財布','キーケース','パスケース','カードケース','手帳カバー'],
  'オーディオ・家電': ['オーディオ','家電','ヘッドホン','イヤホン','スピーカー','電子機器','オーディオアンプ','AVアンプ','レシーバー','ターンテーブル','レコードプレーヤー','カセットデッキ','ウォークマン','DAP','ポータブルプレーヤー','炊飯器','掃除機','ドライヤー','美顔器','電気ケトル','空気清浄機','プロジェクター','ラジオ'],
  '楽器': ['楽器','ギター','ベース','キーボード','シンセサイザー','バイオリン','フルート','サックス','トランペット','ドラム','ウクレレ','ハーモニカ','エフェクター','アンプ'],
  'RC・模型': ['ラジコン','RC','模型','プラモデル','ミニ四駆','鉄道模型'],
  'レコード': ['レコード','LP','EP','CD','カセット'],
  'サングラス': ['サングラス','メガネ','眼鏡'],
  '万年筆・筆記具': ['万年筆','ボールペン','ペン','シャープペンシル','筆記具','メカニカルペンシル'],
  'テニス': ['テニス','テニスラケット','ラケット'],
  '野球': ['野球','グローブ','グラブ','バット','ミット'],
  'スポーツウェア': ['ユニフォーム','ジャージ','トレーニングウェア','ゴルフウェア','スキーウェア','水着'],
  '着物': ['着物','和装','振袖','留袖','訪問着','浴衣','帯','袴'],
  '日本刀': ['日本刀','刀','脇差','短刀','太刀','刀装具','鍔','目貫'],
  '日本伝統・骨董': ['茶道具','茶碗','鉄瓶','急須','南部鉄器','仏像','仏具','仏教美術','陶磁器','陶器','磁器','焼物','香炉'],
  'アート': ['絵画','版画','リトグラフ','油絵','水彩画','木版画','浮世絵','シルクスクリーン','掛軸'],
  'パイプ・喫煙具': ['パイプ','喫煙パイプ','煙管','キセル','パイプ・喫煙具'],
  'テーブルウェア': ['皿','プレート','食器','茶碗','カップ','グラス','ワイングラス','クリスタル','カトラリー','スプーン','フォーク','包丁','切子'],
  '和楽器': ['三味線','尺八','琴','太鼓','和太鼓','篠笛','琵琶','鼓']
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  設定の取得
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getSettings() {
  // すべての永続設定はDocumentPropertiesから取得（スプレッドシートに紐づく、ライブラリ更新で消えない）
  var docProps = PropertiesService.getDocumentProperties();
  var platform = docProps.getProperty('AI_PLATFORM') || 'openai';
  var model = docProps.getProperty('AI_MODEL') || 'gpt-5-nano';
  var apiKey = (platform==='openai') ? docProps.getProperty('OPENAI_API_KEY') :
               (platform==='claude') ? docProps.getProperty('CLAUDE_API_KEY') :
               (platform==='gemini') ? docProps.getProperty('GEMINI_API_KEY') : '';

  var settings = {
    platform: platform,
    model: model,
    apiKey: apiKey,
    sheetName: docProps.getProperty('SHEET_NAME'),
    profitCalculationMethod: docProps.getProperty('PROFIT_CALC_METHOD'),
    promptId: docProps.getProperty('PROMPT_ID') || 'EBAY_FULL_LISTING_PROMPT',
    shippingThreshold: parseFloat(docProps.getProperty('SHIPPING_THRESHOLD')) || 5500,
    shippingCalculationMethod: docProps.getProperty('SHIPPING_CALC_METHOD') || 'TABLE',
    lowPriceShippingMethod: docProps.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'NONE',
    highPriceShippingMethod: docProps.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CF',

    // DDU設定
    dduAdjustmentEnabled: docProps.getProperty('DDU_ADJUSTMENT_ENABLED') === 'true',
    dduThreshold: parseFloat(docProps.getProperty('DDU_THRESHOLD')) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_THRESHOLD,
    dduAdjustmentAmount: parseFloat(docProps.getProperty('DDU_ADJUSTMENT_AMOUNT')) || CONFIG.DDU_PRICE_ADJUSTMENT.DEFAULT_ADJUSTMENT,

    priceDisplayMode: docProps.getProperty('PRICE_DISPLAY_MODE') || 'NORMAL',

    duplicateCheckEnabled: docProps.getProperty('DUPLICATE_CHECK_ENABLED') === 'true',

    // タグ自動判定
    tagOverridePrompt: docProps.getProperty('TAG_OVERRIDE_PROMPT') !== 'false',
    tagOverrideTemplate: docProps.getProperty('TAG_OVERRIDE_TEMPLATE') !== 'false',
    tagOverrideShippingCategory: docProps.getProperty('TAG_OVERRIDE_SHIPPING_CATEGORY') !== 'false',
    tagOverrideProfitRate: docProps.getProperty('TAG_OVERRIDE_PROFIT_RATE') !== 'false',
    tagOverrideAdRate: docProps.getProperty('TAG_OVERRIDE_AD_RATE') !== 'false',
    tagOverrideFeeRate: docProps.getProperty('TAG_OVERRIDE_FEE_RATE') !== 'false',
    tagOverrideShipping: docProps.getProperty('TAG_OVERRIDE_SHIPPING') !== 'false',
    tagOverrideLowShipping: docProps.getProperty('TAG_OVERRIDE_LOW_SHIPPING') !== 'false',
    tagOverrideHighShipping: docProps.getProperty('TAG_OVERRIDE_HIGH_SHIPPING') !== 'false',
    tagOverrideThreshold: docProps.getProperty('TAG_OVERRIDE_THRESHOLD') !== 'false'
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
  var docProps = PropertiesService.getDocumentProperties();
  var mode = docProps.getProperty('PRICE_DISPLAY_MODE');
  return (mode === 'TAX_INCLUDED') ? 'TAX_INCLUDED' : 'NORMAL';
}

function setPriceDisplayMode(mode, showMessage) {
  var docProps = PropertiesService.getDocumentProperties();
  var validMode = (mode === 'TAX_INCLUDED') ? 'TAX_INCLUDED' : 'NORMAL';
  docProps.setProperty('PRICE_DISPLAY_MODE', validMode);

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
