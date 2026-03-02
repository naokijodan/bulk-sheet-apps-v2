/******************************************************
 * Config_IS.gs - Item Specifics 設定
 * - OpenAI API設定
 * - 出品2シートの列マッピング
 ******************************************************/

// グローバル設定（デフォルト値）
var IS_CONFIG = {

  // 出品2シートの列マッピング（1-based）
  COLUMNS: {
    TAG: 1,          // A列: タグ（日本語カテゴリ: 時計, リング等）
    TEMPLATE: 2,     // B列: テンプレ
    REF_EBAY: 3,     // C列: 参考ebayID
    SUPPLIER: 4,     // D列: 仕入先
    SUPPLIER_CODE: 5,// E列: 仕入先コード
    PRICE: 6,        // F列: 出品価格
    TITLE: 7,        // G列: title（英語）
    LABEL: 8,        // H列: label
    OFFER_ACCEPT: 9, // I列: offer了承金額
    OFFER_DECLINE: 10,// J列: offer拒否金額
    PRIVATE: 11,     // K列: private_listing
    DESCRIPTION: 12, // L列: Condition/Description
    SHIPPING: 13,    // M列: shipping policy
    ITEM_SPECIFICS_START: 14  // N列〜: Item Specifics開始列
  },

  // 出品2シートの設定
  SHEET_NAME: '出品2',
  HEADER_ROW: 2,      // ヘッダーは2行目
  DATA_START_ROW: 3,   // データは3行目から

  // AI設定
  AI: {
    MODEL: 'gpt-5-nano',
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.1,   // 低温で正確な抽出
    TIMEOUT: 60000,
    BATCH_SIZE: 5,
    SLEEP_BETWEEN_CALLS: 1500,
    SLEEP_BETWEEN_BATCHES: 3000,
    MAX_RETRIES: 3,
    PARALLEL_REQUESTS: 5
  }
};

/**
 * DocumentProperties から設定を読み込み、IS_CONFIGとマージして返す
 * - OPENAI_API_KEY（既存と共有）
 * - IS_AI_MODEL
 * @return {Object}
 */
function getISSettings() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var settings = JSON.parse(JSON.stringify(IS_CONFIG)); // ディープコピー（ES5対応）

    // 辞書シートIDの取得は不要（同一スプレッドシート内を使用）

    // AIモデル
    var model = docProps.getProperty('IS_AI_MODEL');
    if (model) {
      settings.AI.MODEL = model;
    }

    // 既存共有のAPIキー
    var apiKey = docProps.getProperty('OPENAI_API_KEY');
    if (apiKey) {
      settings.OPENAI_API_KEY = apiKey;
    } else {
      settings.OPENAI_API_KEY = '';
    }

    return settings;
  } catch (e) {
    throw new Error('getISSettings エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 設定を DocumentProperties に保存
 * @param {Object} settings
 */
function saveISSettings(settings) {
  try {
    if (!settings) {
      throw new Error('settings が未定義です');
    }
    var docProps = PropertiesService.getDocumentProperties();

    // 辞書シートIDの保存は不要
    if (settings.OPENAI_API_KEY !== undefined && settings.OPENAI_API_KEY !== null) {
      docProps.setProperty('OPENAI_API_KEY', String(settings.OPENAI_API_KEY));
    }
    if (settings.AI && settings.AI.MODEL !== undefined && settings.AI.MODEL !== null) {
      docProps.setProperty('IS_AI_MODEL', String(settings.AI.MODEL));
    }
  } catch (e) {
    throw new Error('saveISSettings エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 簡易設定ダイアログの表示（UIプロンプト）
 * - AIモデル
 */
function showISSettingsDialog() {
  var ui = SpreadsheetApp.getUi();
  try {
    var current = getISSettings();

    // AIモデル
    var modelPrompt = ui.prompt(
      'Item Specifics 設定',
      'AIモデル名を入力してください（現在: ' + (current.AI && current.AI.MODEL ? current.AI.MODEL : '未設定') + '）\n\n推奨: gpt-5-nano（安価・高速）',
      ui.ButtonSet.OK_CANCEL
    );
    if (modelPrompt.getSelectedButton() !== ui.Button.OK) {
      return;
    }
    var model = (modelPrompt.getResponseText() || '').trim();
    if (model) {
      current.AI.MODEL = model;
    }

    saveISSettings(current);
    ui.alert('設定を保存しました');
  } catch (e) {
    ui.alert('設定エラー: ' + (e && e.message ? e.message : e));
  }
}

// ==============================
// 初期データ（IS_INITIAL_DATA）
// ==============================
var IS_INITIAL_DATA = [
  // === Watches ===
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Reference Number', field_type: 'required', priority: 2, notes: 'モデル番号・型番' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Wristwatch / Pocket Watch' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Case Material', field_type: 'required', priority: 5, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Band Material', field_type: 'required', priority: 6, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Department', field_type: 'required', priority: 7, notes: "Men's / Women's / Unisex" },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Movement', field_type: 'recommended', priority: 8, notes: 'Mechanical / Automatic / Quartz' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Dial Color', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Case Size', field_type: 'recommended', priority: 10, notes: 'mm単位' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Year Manufactured', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Water Resistance', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Country of Origin', field_type: 'recommended', priority: 13, notes: '製造国（本社所在国ではない）。フルネーム英語: Japan, Switzerland等' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'With Papers', field_type: 'recommended', priority: 14, notes: 'Yes / No' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'With Original Box', field_type: 'recommended', priority: 15, notes: 'Yes / No' },

  // === Rings ===
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal', field_type: 'required', priority: 2, notes: 'Gold, Silver, Platinum等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal Purity', field_type: 'required', priority: 3, notes: '18K, 14K, 925等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone', field_type: 'required', priority: 4, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Type', field_type: 'required', priority: 5, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Ring Size', field_type: 'required', priority: 6, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Cut Grade', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone Color', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone Creation', field_type: 'recommended', priority: 9, notes: 'Natural / Lab-Created' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Setting Style', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Country of Origin', field_type: 'recommended', priority: 11, notes: '製造国。フルネーム英語' },

  // === Necklaces & Pendants ===
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal', field_type: 'required', priority: 2, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal Purity', field_type: 'required', priority: 3, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone', field_type: 'required', priority: 4, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Type', field_type: 'required', priority: 5, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Chain Length', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Chain Type', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Setting Style', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Necklaces & Pendants', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '製造国。フルネーム英語' },

  // === Bracelets ===
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal', field_type: 'required', priority: 2, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal Purity', field_type: 'required', priority: 3, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Main Stone', field_type: 'required', priority: 4, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Type', field_type: 'required', priority: 5, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Length', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Closure', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Setting Style', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '製造国。フルネーム英語' },

  // === Earrings ===
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal', field_type: 'required', priority: 2, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal Purity', field_type: 'required', priority: 3, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Main Stone', field_type: 'required', priority: 4, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Type', field_type: 'required', priority: 5, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Fastening', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Setting Style', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '製造国。フルネーム英語' },

  // === Handbags ===
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Material', field_type: 'required', priority: 3, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Style', field_type: 'required', priority: 4, notes: 'Tote, Shoulder Bag, Crossbody等' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Department', field_type: 'required', priority: 5, notes: 'Women / Men / Unisex' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Handle/Strap Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Lining Material', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Hardware Color', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Bag Width', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Bag Height', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Bag Depth', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Country of Origin', field_type: 'recommended', priority: 13, notes: '製造国。フルネーム英語' },

  // === Clothing ===
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Size', field_type: 'required', priority: 2, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Size Type', field_type: 'required', priority: 3, notes: 'Regular, Plus, Petite等' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Department', field_type: 'required', priority: 5, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Type', field_type: 'required', priority: 6, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Style', field_type: 'required', priority: 7, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Material', field_type: 'recommended', priority: 8, notes: 'メイン素材のみ' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Pattern', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Sleeve Length', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Closure', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Fabric Type', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Country of Origin', field_type: 'recommended', priority: 13, notes: '製造国。フルネーム英語' },

  // === Cameras ===
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Series', field_type: 'required', priority: 4, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Color', field_type: 'required', priority: 5, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Maximum Resolution', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Connectivity', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Battery Type', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Features', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Lens Mount', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Country of Origin', field_type: 'recommended', priority: 11, notes: '製造国。フルネーム英語' },

  // === Electronics ===
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Connectivity', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Features', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Screen Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '製造国。フルネーム英語' },

  // === Trading Cards ===
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Game', field_type: 'required', priority: 1, notes: 'Pokemon, Yu-Gi-Oh!, Magic: The Gathering等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Set', field_type: 'required', priority: 2, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Character', field_type: 'required', priority: 3, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Card Name', field_type: 'required', priority: 4, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Specialty', field_type: 'required', priority: 5, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Card Number', field_type: 'required', priority: 6, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Finish', field_type: 'required', priority: 7, notes: 'Holo, Reverse Holo, Non-Holo等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Language', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Graded', field_type: 'recommended', priority: 9, notes: 'Yes / No' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Grade', field_type: 'recommended', priority: 10, notes: 'PSA 10, BGS 9.5等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Professional Grader', field_type: 'recommended', priority: 11, notes: 'PSA, BGS, CGC等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Rarity', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Features', field_type: 'recommended', priority: 13, notes: '' },

  // === Shoes ===
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'US Shoe Size', field_type: 'required', priority: 2, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Color', field_type: 'required', priority: 3, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Type', field_type: 'required', priority: 4, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Department', field_type: 'required', priority: 5, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Style', field_type: 'required', priority: 6, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Width', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Pattern', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国。フルネーム英語' },

  // === Collectibles ===
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Theme', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Material', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '製造国。フルネーム英語' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Year', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品,人形', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' }
];
