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
    MODEL: 'gpt-4o-mini',
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
 * @return {Object}
 */
function getISSettings() {
  try {
    var docProps = PropertiesService.getDocumentProperties();
    var settings = JSON.parse(JSON.stringify(IS_CONFIG)); // ディープコピー（ES5対応）

    // Item Specifics専用のAPIキー
    var apiKey = docProps.getProperty('IS_OPENAI_API_KEY');
    settings.OPENAI_API_KEY = apiKey || '';

    return settings;
  } catch (e) {
    throw new Error('getISSettings エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * Item Specifics専用のAPIキーを保存
 * @param {string} apiKey
 */
function saveISApiKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('APIキーが空です');
  }
  var docProps = PropertiesService.getDocumentProperties();
  docProps.setProperty('IS_OPENAI_API_KEY', apiKey.trim());
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
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Display', field_type: 'recommended', priority: 16, notes: 'Analog / Digital / Analog & Digital' },

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

// 主要ブランド辞書（プロンプト埋め込み用）
// research_brands.json から全カテゴリ集約
var IS_BRAND_DICT = [
  // === Watches ===
  {name: 'Audemars Piguet', jp_names: ['オーデマピゲ', 'AUDEMARS PIGUET'], country: 'Switzerland'},
  {name: 'Ball Watch', jp_names: ['ボールウォッチ', 'BALL WATCH'], country: 'USA'},
  {name: 'Baume & Mercier', jp_names: ['ボーム&メルシエ', 'BAUME & MERCIER', 'BAUME&MERCIER'], country: 'Switzerland'},
  {name: 'Bell & Ross', jp_names: ['ベル&ロス', 'BELL & ROSS', 'BELL&ROSS'], country: 'France'},
  {name: 'Blancpain', jp_names: ['ブランパン', 'BLANCPAIN'], country: 'Switzerland'},
  {name: 'Breguet', jp_names: ['ブレゲ', 'BREGUET'], country: 'Switzerland'},
  {name: 'Breitling', jp_names: ['ブライトリング', 'BREITLING'], country: 'Switzerland'},
  {name: 'Bulova', jp_names: ['ブローバ', 'BULOVA'], country: 'USA'},
  {name: 'Campanola', jp_names: ['カンパノラ', 'CAMPANOLA'], country: 'Japan'},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France'},
  {name: 'Casio', jp_names: ['カシオ', 'CASIO'], country: 'Japan'},
  {name: 'Citizen', jp_names: ['シチズン', 'CITIZEN'], country: 'Japan'},
  {name: 'Credor', jp_names: ['クレドール', 'CREDOR'], country: 'Japan'},
  {name: 'Daniel Wellington', jp_names: ['ダニエルウェリントン', 'DANIEL WELLINGTON', 'DW'], country: 'Sweden'},
  {name: 'Frederique Constant', jp_names: ['フレデリックコンスタント', 'FREDERIQUE CONSTANT'], country: 'Switzerland'},
  {name: 'GC Watches', jp_names: ['ジーシーウォッチ', 'GC WATCHES', 'GC', 'GUESS COLLECTION'], country: 'Switzerland'},
  {name: 'G-Shock', jp_names: ['Gショック', 'G-SHOCK', 'GSHOCK'], country: 'Japan'},
  {name: 'Grand Seiko', jp_names: ['グランドセイコー', 'GRAND SEIKO'], country: 'Japan'},
  {name: 'Hamilton', jp_names: ['ハミルトン', 'HAMILTON'], country: 'USA'},
  {name: 'Hublot', jp_names: ['ウブロ', 'HUBLOT'], country: 'Switzerland'},
  {name: 'IWC', jp_names: ['IWC'], country: 'Switzerland'},
  {name: 'Jaeger-LeCoultre', jp_names: ['ジャガールクルト', 'JAEGER-LECOULTRE', 'JAEGER LECOULTRE'], country: 'Switzerland'},
  {name: 'Longines', jp_names: ['ロンジン', 'LONGINES'], country: 'Switzerland'},
  {name: 'Omega', jp_names: ['オメガ', 'OMEGA'], country: 'Switzerland'},
  {name: 'Orient', jp_names: ['オリエント', 'ORIENT'], country: 'Japan'},
  {name: 'Panerai', jp_names: ['パネライ', 'PANERAI'], country: 'Italy'},
  {name: 'Patek Philippe', jp_names: ['パテックフィリップ', 'PATEK PHILIPPE'], country: 'Switzerland'},
  {name: 'Pierre Lannier', jp_names: ['ピエールラニエ', 'PIERRE LANNIER'], country: 'France'},
  {name: 'Rolex', jp_names: ['ロレックス', 'ROLEX'], country: 'Switzerland'},
  {name: 'Seiko', jp_names: ['セイコー', 'SEIKO'], country: 'Japan'},
  {name: 'TAG Heuer', jp_names: ['タグホイヤー', 'TAG HEUER'], country: 'Switzerland'},
  {name: 'Tudor', jp_names: ['チュードル', 'チューダー', 'TUDOR'], country: 'Switzerland'},
  {name: 'Wenger', jp_names: ['ウェンガー', 'WENGER'], country: 'Switzerland'},
  {name: 'Zenith', jp_names: ['ゼニス', 'ZENITH'], country: 'Switzerland'},
  {name: 'Zeppelin', jp_names: ['ツェッペリン', 'ZEPPELIN'], country: 'Germany'},

  // === Jewelry & Accessories ===
  {name: '4℃', jp_names: ['ヨンドシー', '4℃'], country: 'Japan'},
  {name: 'Agete', jp_names: ['アガット', 'AGETE'], country: 'Japan'},
  {name: 'Ahkah', jp_names: ['アーカー', 'AHKAH'], country: 'Japan'},
  {name: 'Alexandre de Paris', jp_names: ['アレクサンドルドゥパリ', 'アレクサンドル ドゥ パリ', 'ALEXANDRE DE PARIS'], country: 'France'},
  {name: 'Bill Wall Leather', jp_names: ['ビルウォールレザー', 'BILL WALL LEATHER'], country: 'USA'},
  {name: 'Boucheron', jp_names: ['ブシュロン', 'BOUCHERON'], country: 'France'},
  {name: 'Bulgari', jp_names: ['ブルガリ', 'BVLGARI'], country: 'Italy'},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI'], country: 'Italy'},
  {name: 'Chaumet', jp_names: ['ショーメ', 'CHAUMET'], country: 'France'},
  {name: 'Chopard', jp_names: ['ショパール', 'CHOPARD'], country: 'Switzerland'},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'USA'},
  {name: 'Cody Sanderson', jp_names: ['コディサンダーソン', 'CODY SANDERSON'], country: 'USA'},
  {name: 'Damiani', jp_names: ['ダミアーニ', 'DAMIANI'], country: 'Italy'},
  {name: 'David Andersen', jp_names: ['デヴィッドアンデルセン', 'DAVID ANDERSEN', 'D.ANDERSEN'], country: 'Norway'},
  {name: 'David Yurman', jp_names: ['デイビット・ヤーマン', 'DAVID YURMAN'], country: 'USA'},
  {name: 'Emporio Armani', jp_names: ['エンポリオアルマーニ', 'EMPORIO ARMANI'], country: 'Italy'},
  {name: 'Ete', jp_names: ['エテ', 'ETE'], country: 'Japan'},
  {name: 'Fred', jp_names: ['フレッド', 'FRED'], country: 'France'},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy'},
  {name: 'Hans Hansen', jp_names: ['ハンスハンセン', 'HANS HANSEN'], country: 'Denmark'},
  {name: 'Harry Winston', jp_names: ['ハリー・ウィンストン', 'HARRY WINSTON'], country: 'USA'},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France'},
  {name: 'Justin Davis', jp_names: ['ジャスティン・デイビス', 'JUSTIN DAVIS'], country: 'USA'},
  {name: 'Mikimoto', jp_names: ['ミキモト', 'MIKIMOTO'], country: 'Japan'},
  {name: 'Pandora', jp_names: ['パンドラ', 'PANDORA'], country: 'Denmark'},
  {name: 'Swarovski', jp_names: ['スワロフスキー', 'SWAROVSKI'], country: 'Austria'},
  {name: 'Tasaki', jp_names: ['タサキ', 'TASAKI'], country: 'Japan'},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY & CO.', 'TIFFANY', 'TIFFANY&CO', 'Tiffany'], country: 'USA'},
  {name: 'Van Cleef & Arpels', jp_names: ['ヴァン クリーフ＆アーペル', 'VAN CLEEF & ARPELS', 'VAN CLEEF', 'VANCLEEF&ARPELS'], country: 'France'},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアン・ウエストウッド', 'VIVIENNE WESTWOOD'], country: 'UK'},

  // === Bags ===
  {name: 'Anello', jp_names: ['アネロ', 'ANELLO'], country: 'Japan'},
  {name: 'BRIEFING', jp_names: ['ブリーフィング', 'BRIEFING'], country: 'Japan'},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France'},
  {name: 'Bottega Veneta', jp_names: ['ボッテガ・ヴェネタ', 'BOTTEGA VENETA'], country: 'Italy'},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'UK'},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France'},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France'},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'USA'},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France'},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy'},
  {name: 'Goyard', jp_names: ['ゴヤール', 'GOYARD'], country: 'France'},
  {name: 'Hunting World', jp_names: ['ハンティングワールド', 'HUNTING WORLD'], country: 'USA'},
  {name: 'Loewe', jp_names: ['ロエベ', 'LOEWE'], country: 'Spain'},
  {name: 'Louis Vuitton', jp_names: ['ルイ・ヴィトン', 'LOUIS VUITTON'], country: 'France'},
  {name: 'Porter', jp_names: ['ポーター', 'PORTER'], country: 'Japan'},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy'},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT'], country: 'France'},

  // === Clothing & Fashion ===
  {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE', 'アベイシングエイプ'], country: 'Japan'},
  {name: 'Alden', jp_names: ['オールデン', 'ALDEN'], country: 'USA'},
  {name: 'Alexander Wang', jp_names: ['アレキサンダーワン', 'ALEXANDER WANG'], country: 'USA'},
  {name: 'Aniplex', jp_names: ['アニプレックス', 'ANIPLEX'], country: 'Japan'},
  {name: 'BAPE', jp_names: ['ア・ベイシング・エイプ', 'BAPE'], country: 'Japan'},
  {name: 'Bally', jp_names: ['バリー', 'BALLY'], country: 'Switzerland'},
  {name: 'Bang & Olufsen', jp_names: ['バング&オルフセン', 'BANG & OLUFSEN', 'B&O', 'BANG&OLUFSEN'], country: 'Denmark'},
  {name: 'Beams', jp_names: ['ビームス', 'BEAMS'], country: 'Japan'},
  {name: 'Bloody Mary', jp_names: ['ブラッディマリー', 'BLOODY MARY'], country: 'Japan'},
  {name: 'Bremont', jp_names: ['ブレモン', 'BREMONT'], country: 'UK'},
  {name: 'Canada Goose', jp_names: ['カナダグース', 'CANADA GOOSE'], country: 'Canada'},
  {name: 'Carhartt', jp_names: ['カーハート', 'CARHARTT'], country: 'USA'},
  {name: 'Champion', jp_names: ['チャンピオン', 'CHAMPION'], country: 'USA'},
  {name: 'Chloe', jp_names: ['クロエ', 'CHLOE'], country: 'France'},
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS'], country: 'Japan'},
  {name: 'Comme des Garcons Play', jp_names: ['プレイ・コムデギャルソン', 'PLAY COMME DES GARCONS'], country: 'Japan'},
  {name: 'Diesel', jp_names: ['ディーゼル', 'DIESEL'], country: 'Italy'},
  {name: 'Dolce Gabbana', jp_names: ['ドルチェ&ガッバーナ', 'DOLCE GABBANA'], country: 'Italy'},
  {name: 'Dunhill', jp_names: ['ダンヒル', 'DUNHILL'], country: 'UK'},
  {name: 'Evisu', jp_names: ['エヴィス', 'EVISU'], country: 'Japan'},
  {name: 'First Arrow\'s', jp_names: ['ファーストアローズ', 'FIRST ARROW\'S'], country: 'Japan'},
  {name: 'Fragment', jp_names: ['フラグメント', 'FRAGMENT'], country: 'Japan'},
  {name: 'Fukagawa Seiji', jp_names: ['深川製磁', 'FUKAGAWA SEIJI'], country: 'Japan'},
  {name: 'Furla', jp_names: ['フルラ', 'FURLA'], country: 'Italy'},
  {name: 'Furyu', jp_names: ['フリュー', 'FURYU'], country: 'Japan'},
  {name: 'Gaboratory', jp_names: ['ガボラトリー', 'GABORATORY'], country: 'USA'},
  {name: 'Gen-emon', jp_names: ['源右衛門', 'GEN-EMON', 'GENEMON'], country: 'Japan'},
  {name: 'Georg Jensen', jp_names: ['ジョージ・ジェンセン', 'GEORG JENSEN'], country: 'Denmark'},
  {name: 'Giant', jp_names: ['ジャイアント', 'GIANT'], country: 'Taiwan'},
  {name: 'Gibson', jp_names: ['ギブソン', 'GIBSON'], country: 'USA'},
  {name: 'Ginza Tanaka', jp_names: ['ギンザタナカ', 'GINZA TANAKA'], country: 'Japan'},
  {name: 'Girard-Perregaux', jp_names: ['ジラールペルゴ', 'GIRARD-PERREGAUX', 'GIRARD PERREGAUX'], country: 'Switzerland'},
  {name: 'Givenchy', jp_names: ['ジバンシィ', 'GIVENCHY'], country: 'France'},
  {name: 'Glashütte Original', jp_names: ['グラスヒュッテオリジナル', 'GLASHUTTE ORIGINAL'], country: 'Germany'},
  {name: 'Goldwin', jp_names: ['ゴールドウイン', 'GOLDWIN'], country: 'Japan'},
  {name: 'Goro\'s', jp_names: ['ゴローズ', 'GORO\'S'], country: 'Japan'},
  {name: 'Graff', jp_names: ['グラフ', 'GRAFF'], country: 'UK'},
  {name: 'Greco', jp_names: ['グレコ', 'GRECO'], country: 'Japan'},
  {name: 'Gregory', jp_names: ['グレゴリー', 'GREGORY'], country: 'USA'},
  {name: 'Head', jp_names: ['ヘッド', 'HEAD'], country: 'Austria'},
  {name: 'Herend', jp_names: ['ヘレンド', 'HEREND'], country: 'Hungary'},
  {name: 'Human Made', jp_names: ['ヒューマンメイド', 'HUMAN MADE'], country: 'Japan'},
  {name: 'Hysteric Glamour', jp_names: ['ヒステリックグラマー', 'HYSTERIC GLAMOUR'], country: 'Japan'},
  {name: 'Ichiban Kuji', jp_names: ['一番くじ', 'ICHIBAN KUJI'], country: 'Japan'},
  {name: 'Imaemon', jp_names: ['今右衛門', 'IMAEMON'], country: 'Japan'},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE'], country: 'Japan'},
  {name: 'Jimmy Choo', jp_names: ['ジミーチュウ', 'JIMMY CHOO'], country: 'UK'},
  {name: 'Junghans', jp_names: ['ユンハンス', 'JUNGHANS'], country: 'Germany'},
  {name: 'Kadokawa', jp_names: ['KADOKAWA'], country: 'Japan'},
  {name: 'Kapital', jp_names: ['キャピタル', 'KAPITAL'], country: 'Japan'},
  {name: 'Kate Spade', jp_names: ['ケイト・スペード', 'KATE SPADE'], country: 'USA'},
  {name: 'Kenwood', jp_names: ['ケンウッド', 'KENWOOD'], country: 'Japan'},
  {name: 'Kenzo', jp_names: ['ケンゾー', 'KENZO'], country: 'France'},
  {name: 'Kiyomizu', jp_names: ['清水焼', 'KIYOMIZU'], country: 'Japan'},
  {name: 'Knot', jp_names: ['ノット', 'KNOT'], country: 'Japan'},
  {name: 'Konica', jp_names: ['コニカ', 'KONICA'], country: 'Japan'},
  {name: 'Koransha', jp_names: ['香蘭社', 'KORANSHA'], country: 'Japan'},
  {name: 'Kurono Tokyo', jp_names: ['クロノトウキョウ', 'KURONO TOKYO'], country: 'Japan'},
  {name: 'Kyosho', jp_names: ['京商', 'KYOSHO'], country: 'Japan'},
  {name: 'L.L.Bean', jp_names: ['エルエルビーン', 'L.L.BEAN', 'LLBEAN', 'LL BEAN'], country: 'USA'},
  {name: 'Lacoste', jp_names: ['ラコステ', 'LACOSTE'], country: 'France'},
  {name: 'Lalique', jp_names: ['ラリック', 'LALIQUE'], country: 'France'},
  {name: 'Levi\'s', jp_names: ['リーバイス', 'LEVI\'S'], country: 'USA'},
  {name: 'Lladro', jp_names: ['リヤドロ', 'LLADRO'], country: 'Spain'},
  {name: 'Lone Ones', jp_names: ['ロンワンズ', 'LONE ONES'], country: 'USA'},
  {name: 'Longchamp', jp_names: ['ロンシャン', 'LONGCHAMP'], country: 'France'},
  {name: 'Loree Rodkin', jp_names: ['ローリーロドキン', 'LOREE RODKIN'], country: 'USA'},
  {name: 'Luxman', jp_names: ['ラックスマン', 'LUXMAN'], country: 'Japan'},
  {name: 'MCM', jp_names: ['エムシーエム', 'MCM'], country: 'Germany'},
  {name: 'Manhattan Portage', jp_names: ['マンハッタンポーテージ', 'MANHATTAN PORTAGE'], country: 'USA'},
  {name: 'Marc Jacobs', jp_names: ['マーク・ジェイコブス', 'MARC JACOBS'], country: 'USA'},
  {name: 'Martin', jp_names: ['マーティン', 'MARTIN'], country: 'USA'},
  {name: 'Mastermind Japan', jp_names: ['マスターマインド', 'MASTERMIND JAPAN'], country: 'Japan'},
  {name: 'Maurice Lacroix', jp_names: ['モーリスラクロア', 'MAURICE LACROIX'], country: 'Switzerland'},
  {name: 'Meissen', jp_names: ['マイセン', 'MEISSEN'], country: 'Germany'},
  {name: 'Michael Kors', jp_names: ['マイケル・コース', 'MICHAEL KORS'], country: 'USA'},
  {name: 'Minase', jp_names: ['ミナセ', 'MINASE'], country: 'Japan'},
  {name: 'Miu Miu', jp_names: ['ミュウミュウ', 'MIU MIU'], country: 'Italy'},
  {name: 'Moncler', jp_names: ['モンクレール', 'MONCLER'], country: 'France'},
  {name: 'Montbell', jp_names: ['モンベル', 'MONTBELL'], country: 'Japan'},
  {name: 'Montblanc', jp_names: ['モンブラン', 'MONTBLANC'], country: 'Germany'},
  {name: 'Moog', jp_names: ['モーグ', 'MOOG'], country: 'USA'},
  {name: 'Morris', jp_names: ['モーリス', 'MORRIS'], country: 'Japan'},
  {name: 'Nakamichi', jp_names: ['ナカミチ', 'NAKAMICHI'], country: 'Japan'},
  {name: 'Narumi', jp_names: ['ナルミ', 'NARUMI'], country: 'Japan'},
  {name: 'Neighborhood', jp_names: ['ネイバーフッド', 'NEIGHBORHOOD'], country: 'Japan'},
  {name: 'Nittaku', jp_names: ['ニッタク', 'NITTAKU'], country: 'Japan'},
  {name: 'Niwaka', jp_names: ['俄', 'NIWAKA'], country: 'Japan'},
  {name: 'Nojess', jp_names: ['ノジェス', 'NOJESS'], country: 'Japan'},
  {name: 'Nomos', jp_names: ['ノモス', 'NOMOS'], country: 'Germany'},
  {name: 'North Face', jp_names: ['ノースフェイス', 'NORTH FACE'], country: 'USA'},
  {name: 'Number (N)ine', jp_names: ['ナンバーナイン', 'NUMBER (N)INE'], country: 'Japan'},
  {name: 'Off-White', jp_names: ['オフホワイト', 'OFF-WHITE', 'OFFWHITE'], country: 'Italy'},
  {name: 'Okura Art China', jp_names: ['大倉陶園', 'OKURA ART CHINA'], country: 'Japan'},
  {name: 'Orient Star', jp_names: ['オリエントスター', 'ORIENT STAR'], country: 'Japan'},
  {name: 'Oris', jp_names: ['オリス', 'ORIS'], country: 'Switzerland'},
  {name: 'Patagonia', jp_names: ['パタゴニア', 'PATAGONIA'], country: 'USA'},
  {name: 'Piaget', jp_names: ['ピアジェ', 'PIAGET'], country: 'Switzerland'},
  {name: 'Playmobil', jp_names: ['プレイモービル', 'PLAYMOBIL'], country: 'Germany'},
  {name: 'Pomellato', jp_names: ['ポメラート', 'POMELLATO'], country: 'Italy'},
  {name: 'Ponte Vecchio', jp_names: ['ポンテヴェキオ', 'PONTE VECCHIO'], country: 'Japan'},
  {name: 'Prince', jp_names: ['プリンス', 'PRINCE'], country: 'USA'},
  {name: 'Rado', jp_names: ['ラドー', 'RADO'], country: 'Switzerland'},
  {name: 'Ralph Lauren', jp_names: ['ラルフローレン', 'RALPH LAUREN'], country: 'USA'},
  {name: 'Ray-Ban', jp_names: ['レイバン', 'RAY-BAN'], country: 'USA'},
  {name: 'Request', jp_names: ['リクエスト', 'REQUEST'], country: 'Japan'},
  {name: 'Rimowa', jp_names: ['リモワ', 'RIMOWA'], country: 'Germany'},
  {name: 'Rolex Custom', jp_names: ['ロレックスカスタム', 'ROLEX CUSTOM'], country: 'Switzerland'},
  {name: 'SABIAN', jp_names: ['セイビアン', 'SABIAN'], country: 'Canada'},
  {name: 'SEIKO 5', jp_names: ['セイコー5', 'SEIKO 5'], country: 'Japan'},
  {name: 'Salvatore Ferragamo', jp_names: ['サルヴァトーレ フェラガモ', 'フェラガモ', 'SALVATORE FERRAGAMO', 'Ferragamo', 'FERRAGAMO'], country: 'Italy'},
  {name: 'Saint Laurent Paris', jp_names: ['サンローランパリ', 'SAINT LAURENT PARIS'], country: 'France'},
  {name: 'Salsa', jp_names: ['サルサ', 'SALSA'], country: 'USA'},
  {name: 'Seikomatic', jp_names: ['セイコーマチック', 'SEIKOMATIC'], country: 'Japan'},
  {name: 'Seikosha', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosha (Clock)', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosha (Watch)', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosha Clock', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosha Watch', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosha 時計', jp_names: ['精工舎', 'SEIKOSHA'], country: 'Japan'},
  {name: 'Seikosya', jp_names: ['精工舎', 'SEIKOSYA'], country: 'Japan'},
  {name: 'Shinola', jp_names: ['シノラ', 'SHINOLA'], country: 'USA'},
  {name: 'Shinshu', jp_names: ['信州', 'SHINSHU'], country: 'Japan'},
  {name: 'Shunjuen', jp_names: ['春秋園', 'SHUNJUEN'], country: 'Japan'},
  {name: 'Specialized', jp_names: ['スペシャライズド', 'SPECIALIZED'], country: 'USA'},
  {name: 'Star Jewelry', jp_names: ['スタージュエリー', 'STAR JEWELRY'], country: 'Japan'},
  {name: 'Stax', jp_names: ['スタックス', 'STAX'], country: 'Japan'},
  {name: 'Stella McCartney', jp_names: ['ステラ・マッカートニー', 'STELLA MCCARTNEY'], country: 'UK'},
  {name: 'Stone Island', jp_names: ['ストーンアイランド', 'STONE ISLAND'], country: 'Italy'},
  {name: 'Stussy', jp_names: ['ステューシー', 'STUSSY'], country: 'USA'},
  {name: 'Supreme', jp_names: ['シュプリーム', 'SUPREME'], country: 'USA'},
  {name: 'TC Electronic', jp_names: ['ティーシーエレクトロニック', 'TC ELECTRONIC'], country: 'Denmark'},
  {name: 'Tachikichi', jp_names: ['たち吉', 'TACHIKICHI'], country: 'Japan'},
  {name: 'Tady & King', jp_names: ['タディアンドキング', 'TADY & KING', 'TADY&KING'], country: 'Japan'},
  {name: 'Tascam', jp_names: ['タスカム', 'TASCAM'], country: 'Japan'},
  {name: 'Taylor', jp_names: ['テイラー', 'TAYLOR'], country: 'USA'},
  {name: 'Teac', jp_names: ['ティアック', 'TEAC'], country: 'Japan'},
  {name: 'Technics', jp_names: ['テクニクス', 'TECHNICS'], country: 'Japan'},
  {name: 'Timberland', jp_names: ['ティンバーランド', 'TIMBERLAND'], country: 'USA'},
  {name: 'Tissot', jp_names: ['ティソ', 'TISSOT'], country: 'Switzerland'},
  {name: 'Tobe', jp_names: ['砥部焼', 'TOBE'], country: 'Japan'},
  {name: 'Tory Burch', jp_names: ['トリーバーチ', 'TORY BURCH'], country: 'USA'},
  {name: 'Trek', jp_names: ['トレック', 'TREK'], country: 'USA'},
  {name: 'Tumi', jp_names: ['トゥミ', 'TUMI'], country: 'USA'},
  {name: 'Ulysse Nardin', jp_names: ['ユリスナルダン', 'ULYSSE NARDIN'], country: 'Switzerland'},
  {name: 'Undercover', jp_names: ['アンダーカバー', 'UNDERCOVER'], country: 'Japan'},
  {name: 'United Arrows', jp_names: ['ユナイテッドアローズ', 'UNITED ARROWS'], country: 'Japan'},
  {name: 'Vacheron Constantin', jp_names: ['ヴァシュロンコンスタンタン', 'VACHERON CONSTANTIN'], country: 'Switzerland'},
  {name: 'Valentino', jp_names: ['ヴァレンティノ', 'VALENTINO'], country: 'Italy'},
  {name: 'Vendome Aoyama', jp_names: ['ヴァンドーム青山', 'VENDOME AOYAMA'], country: 'Japan'},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'VERSACE'], country: 'Italy'},
  {name: 'Victas', jp_names: ['ヴィクタス', 'VICTAS'], country: 'Japan'},
  {name: 'Visvim', jp_names: ['ビズビム', 'VISVIM'], country: 'Japan'},
  {name: 'Voigtlander', jp_names: ['フォクトレンダー', 'VOIGTLANDER'], country: 'Germany'},
  {name: 'WTAPS', jp_names: ['ダブルタップス', 'WTAPS'], country: 'Japan'},
  {name: 'Wedgwood', jp_names: ['ウェッジウッド', 'WEDGWOOD'], country: 'UK'},
  {name: 'Wilson', jp_names: ['ウィルソン', 'WILSON'], country: 'USA'},
  {name: 'Yashica', jp_names: ['ヤシカ', 'YASHICA'], country: 'Japan'},
  {name: 'Yohji Yamamoto', jp_names: ['ヨウジヤマモト', 'YOHJI YAMAMOTO'], country: 'Japan'},
  {name: 'Yoshida', jp_names: ['吉田カバン', 'YOSHIDA'], country: 'Japan'},
  {name: 'Zoom', jp_names: ['ズーム', 'ZOOM'], country: 'Japan'},
  {name: 'master-piece', jp_names: ['マスターピース', 'MASTER-PIECE', 'MASTERPIECE'], country: 'Japan'},

  // === Shoes ===
  {name: 'ASICS', jp_names: ['アシックス', 'ASICS'], country: 'Japan'},
  {name: 'Adidas', jp_names: ['アディダス', 'ADIDAS'], country: 'Germany'},
  {name: 'Birkenstock', jp_names: ['ビルケンシュトック', 'BIRKENSTOCK'], country: 'Germany'},
  {name: 'Clarks', jp_names: ['クラークス', 'CLARKS'], country: 'UK'},
  {name: 'Converse', jp_names: ['コンバース', 'CONVERSE'], country: 'USA'},
  {name: 'Crockett & Jones', jp_names: ['クロケット＆ジョーンズ', 'CROCKETT & JONES', 'CROCKETT&JONES'], country: 'UK'},
  {name: 'Dr. Martens', jp_names: ['ドクターマーチン', 'DR. MARTENS', 'DR MARTENS', 'DRMARTENS'], country: 'UK'},
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan'},
  {name: 'New Balance', jp_names: ['ニューバランス', 'NEW BALANCE'], country: 'USA'},
  {name: 'Nike', jp_names: ['ナイキ', 'NIKE'], country: 'USA'},
  {name: 'Onitsuka Tiger', jp_names: ['オニツカタイガー', 'ONITSUKA TIGER'], country: 'Japan'},
  {name: 'Puma', jp_names: ['プーマ', 'PUMA'], country: 'Germany'},
  {name: 'Reebok', jp_names: ['リーボック', 'REEBOK'], country: 'UK'},
  {name: 'Vans', jp_names: ['バンズ', 'VANS'], country: 'USA'},
  {name: 'Christian Louboutin', jp_names: ['クリスチャン・ルブタン', 'CHRISTIAN LOUBOUTIN'], country: 'France'},

  // === Cameras & Lenses ===
  {name: 'Bronica', jp_names: ['ブロニカ', 'BRONICA'], country: 'Japan'},
  {name: 'Canon', jp_names: ['キヤノン', 'CANON'], country: 'Japan'},
  {name: 'Contax', jp_names: ['コンタックス', 'CONTAX'], country: 'Germany'},
  {name: 'Fujifilm', jp_names: ['富士フイルム', 'FUJIFILM'], country: 'Japan'},
  {name: 'Hasselblad', jp_names: ['ハッセルブラッド', 'HASSELBLAD'], country: 'Sweden'},
  {name: 'Leica', jp_names: ['ライカ', 'LEICA'], country: 'Germany'},
  {name: 'Mamiya', jp_names: ['マミヤ', 'MAMIYA'], country: 'Japan'},
  {name: 'Minolta', jp_names: ['ミノルタ', 'MINOLTA'], country: 'Japan'},
  {name: 'Nikon', jp_names: ['ニコン', 'NIKON'], country: 'Japan'},
  {name: 'Olympus', jp_names: ['オリンパス', 'OLYMPUS'], country: 'Japan'},
  {name: 'Pentax', jp_names: ['ペンタックス', 'PENTAX'], country: 'Japan'},
  {name: 'Ricoh', jp_names: ['リコー', 'RICOH'], country: 'Japan'},
  {name: 'Sigma', jp_names: ['シグマ', 'SIGMA'], country: 'Japan'},
  {name: 'Tamron', jp_names: ['タムロン', 'TAMRON'], country: 'Japan'},
  {name: 'Tokina', jp_names: ['トキナー', 'TOKINA'], country: 'Japan'},

  // === Electronics & Audio ===
  {name: 'AKG', jp_names: ['アーカーゲー', 'AKG'], country: 'Austria'},
  {name: 'Accuphase', jp_names: ['アキュフェーズ', 'ACCUPHASE'], country: 'Japan'},
  {name: 'Apple', jp_names: ['アップル', 'APPLE'], country: 'USA'},
  {name: 'Audio-Technica', jp_names: ['オーディオテクニカ', 'AUDIO-TECHNICA', 'AUDIO TECHNICA', 'AUDIOTECHNICA'], country: 'Japan'},
  {name: 'Bose', jp_names: ['ボーズ', 'BOSE'], country: 'USA'},
  {name: 'Denon', jp_names: ['デノン', 'DENON'], country: 'Japan'},
  {name: 'Esoteric', jp_names: ['エソテリック', 'ESOTERIC'], country: 'Japan'},
  {name: 'Focal', jp_names: ['フォーカル', 'FOCAL'], country: 'France'},
  {name: 'Foster', jp_names: ['フォスター', 'FOSTER'], country: 'Japan'},
  {name: 'Fostex', jp_names: ['フォステクス', 'FOSTEX'], country: 'Japan'},
  {name: 'JBL', jp_names: ['ジェイビーエル', 'JBL'], country: 'USA'},
  {name: 'Marantz', jp_names: ['マランツ', 'MARANTZ'], country: 'USA'},
  {name: 'Onkyo', jp_names: ['オンキヨー', 'ONKYO'], country: 'Japan'},
  {name: 'Panasonic', jp_names: ['パナソニック', 'PANASONIC'], country: 'Japan'},
  {name: 'Pioneer', jp_names: ['パイオニア', 'PIONEER'], country: 'Japan'},
  {name: 'Samsung', jp_names: ['サムスン', 'SAMSUNG'], country: 'South Korea'},
  {name: 'Sony', jp_names: ['ソニー', 'SONY'], country: 'Japan'},

  // === Trading Cards ===
  {name: 'Battle Spirits', jp_names: ['バトルスピリッツ', 'BATTLE SPIRITS'], country: 'Japan'},
  {name: 'Cardfight!! Vanguard', jp_names: ['カードファイト!! ヴァンガード', 'VANGUARD', 'CARDFIGHT VANGUARD'], country: 'Japan'},
  {name: 'Digimon', jp_names: ['デジモン', 'DIGIMON'], country: 'Japan'},
  {name: 'Dragon Ball', jp_names: ['ドラゴンボール', 'DRAGON BALL'], country: 'Japan'},
  {name: 'Duel Masters', jp_names: ['デュエルマスターズ', 'DUEL MASTERS'], country: 'USA'},
  {name: 'Magic: The Gathering', jp_names: ['マジックザギャザリング', 'MTG'], country: 'USA'},
  {name: 'One Piece', jp_names: ['ワンピース', 'ONE PIECE'], country: 'Japan'},
  {name: 'Pokemon', jp_names: ['ポケモン', 'POKEMON'], country: 'Japan'},
  {name: 'Weiss Schwarz', jp_names: ['ヴァイスシュヴァルツ', 'WEISS SCHWARZ'], country: 'Japan'},
  {name: 'Yu-Gi-Oh', jp_names: ['遊戯王', 'YU-GI-OH', 'YUGIOH'], country: 'Japan'},

  // === Video Games ===
  {name: 'Bandai Namco', jp_names: ['バンダイナムコ', 'バンナム', 'BANDAI NAMCO'], country: 'Japan'},
  {name: 'Capcom', jp_names: ['カプコン', 'CAPCOM'], country: 'Japan'},
  {name: 'Konami', jp_names: ['コナミ', 'KONAMI'], country: 'Japan'},
  {name: 'Nintendo', jp_names: ['任天堂', 'ニンテンドー', 'NINTENDO'], country: 'Japan'},
  {name: 'Sega', jp_names: ['セガ', 'SEGA'], country: 'Japan'},
  {name: 'Sony PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PLAYSTATION', 'PS5', 'PS4'], country: 'Japan'},
  {name: 'Square Enix', jp_names: ['スクウェア・エニックス', 'SQUARE ENIX'], country: 'Japan'},

  // === Figures & Collectibles ===
  {name: 'Alter', jp_names: ['アルター', 'ALTER'], country: 'Japan'},
  {name: 'Bandai', jp_names: ['バンダイ', 'BANDAI'], country: 'Japan'},
  {name: 'Banpresto', jp_names: ['バンプレスト', 'BANPRESTO'], country: 'Japan'},
  {name: 'Figma', jp_names: ['フィグマ', 'FIGMA'], country: 'Japan'},
  {name: 'Funko', jp_names: ['ファンコ', 'FUNKO'], country: 'USA'},
  {name: 'Good Smile Company', jp_names: ['グッドスマイルカンパニー', 'GOOD SMILE COMPANY'], country: 'Japan'},
  {name: 'Kaiyodo', jp_names: ['海洋堂', 'KAIYODO'], country: 'Japan'},
  {name: 'Kotobukiya', jp_names: ['コトブキヤ', 'KOTOBUKIYA'], country: 'Japan'},
  {name: 'Max Factory', jp_names: ['マックスファクトリー', 'MAX FACTORY'], country: 'Japan'},
  {name: 'Medicom Toy', jp_names: ['メディコムトイ', 'MEDICOM TOY'], country: 'Japan'},
  {name: 'MegaHouse', jp_names: ['メガハウス', 'MEGAHOUSE'], country: 'Japan'},
  {name: 'Nendoroid', jp_names: ['ねんどろいど', 'NENDOROID'], country: 'Japan'},
  {name: 'S.H.Figuarts', jp_names: ['S.H.フィギュアーツ', 'S.H.FIGUARTS', 'SHFIGUARTS', 'SH FIGUARTS'], country: 'Japan'},

  // === Pottery & Porcelain ===
  {name: 'Arita', jp_names: ['有田焼', 'ARITA'], country: 'Japan'},
  {name: 'Baccarat', jp_names: ['バカラ', 'BACCARAT'], country: 'France'},
  {name: 'Bizen', jp_names: ['備前焼', 'BIZEN'], country: 'Japan'},
  {name: 'Hagi', jp_names: ['萩焼', 'HAGI'], country: 'Japan'},
  {name: 'Imari', jp_names: ['伊万里焼', 'IMARI'], country: 'Japan'},
  {name: 'Kakiemon', jp_names: ['柿右衛門', 'KAKIEMON'], country: 'Japan'},
  {name: 'Kutani', jp_names: ['九谷焼', 'KUTANI'], country: 'Japan'},
  {name: 'Mashiko', jp_names: ['益子焼', 'MASHIKO'], country: 'Japan'},
  {name: 'Mino', jp_names: ['美濃焼', 'MINO'], country: 'Japan'},
  {name: 'Nabeshima', jp_names: ['鍋島焼', 'NABESHIMA'], country: 'Japan'},
  {name: 'Noritake', jp_names: ['ノリタケ', 'NORITAKE'], country: 'Japan'},
  {name: 'Satsuma', jp_names: ['薩摩焼', 'SATSUMA'], country: 'Japan'},
  {name: 'Shigaraki', jp_names: ['信楽焼', 'SHIGARAKI'], country: 'Japan'},

  // === Musical Instruments ===
  {name: 'Ampeg', jp_names: ['アンペグ', 'AMPEG'], country: 'USA'},
  {name: 'Aria', jp_names: ['アリア', 'ARIA'], country: 'Japan'},
  {name: 'Boss', jp_names: ['ボス', 'BOSS'], country: 'Japan'},
  {name: 'ESP', jp_names: ['イーエスピー', 'ESP'], country: 'Japan'},
  {name: 'Edwards', jp_names: ['エドワーズ', 'EDWARDS'], country: 'Japan'},
  {name: 'Fender', jp_names: ['フェンダー', 'FENDER'], country: 'USA'},
  {name: 'Fernandes', jp_names: ['フェルナンデス', 'FERNANDES'], country: 'Japan'},
  {name: 'Fujigen', jp_names: ['フジゲン', 'FUJIGEN'], country: 'Japan'},
  {name: 'Ibanez', jp_names: ['アイバニーズ', 'IBANEZ'], country: 'Japan'},
  {name: 'Korg', jp_names: ['コルグ', 'KORG'], country: 'Japan'},
  {name: 'Roland', jp_names: ['ローランド', 'ROLAND'], country: 'Japan'},
  {name: 'Takamine', jp_names: ['タカミネ', 'TAKAMINE'], country: 'Japan'},
  {name: 'Tokai', jp_names: ['東海楽器', 'TOKAI'], country: 'Japan'},
  {name: 'Yamaha', jp_names: ['ヤマハ', 'YAMAHA'], country: 'Japan'},

  // === Sporting Goods ===
  {name: 'Asics', jp_names: ['アシックス', 'ASICS'], country: 'Japan'},
  {name: 'Butterly', jp_names: ['バタフライ', 'BUTTERFLY'], country: 'Japan'},
  {name: 'Callaway', jp_names: ['キャロウェイ', 'CALLAWAY'], country: 'USA'},
  {name: 'Daiwa', jp_names: ['ダイワ', 'DAIWA'], country: 'Japan'},
  {name: 'Descente', jp_names: ['デサント', 'DESCENTE'], country: 'Japan'},
  {name: 'Gamakatsu', jp_names: ['がまかつ', 'GAMAKATSU'], country: 'Japan'},
  {name: 'Pearl Izumi', jp_names: ['パールイズミ', 'PEARL IZUMI'], country: 'Japan'},
  {name: 'Ping', jp_names: ['ピン', 'PING'], country: 'USA'},
  {name: 'Shimano', jp_names: ['シマノ', 'SHIMANO'], country: 'Japan'},
  {name: 'TaylorMade', jp_names: ['テーラーメイド', 'TAYLORMADE'], country: 'USA'},
  {name: 'Titleist', jp_names: ['タイトリスト', 'TITLEIST'], country: 'USA'},
  {name: 'Yonex', jp_names: ['ヨネックス', 'YONEX'], country: 'Japan'},

  // === Automotive ===
  {name: 'Honda', jp_names: ['ホンダ', 'HONDA'], country: 'Japan'},
  {name: 'Nissan', jp_names: ['日産', 'ニッサン', 'NISSAN'], country: 'Japan'},
  {name: 'Toyota', jp_names: ['トヨタ', 'TOYOTA'], country: 'Japan'},

  // === Beauty ===
  {name: 'KOSE', jp_names: ['コーセー', 'KOSE'], country: 'Japan'},
  {name: 'SK-II', jp_names: ['エスケーツー', 'SK-II', 'SK2'], country: 'Japan'},
  {name: 'Shiseido', jp_names: ['資生堂', 'シセイドウ', 'SHISEIDO'], country: 'Japan'},

  // === Toys & Models ===
  {name: 'Aoshima', jp_names: ['アオシマ', 'AOSHIMA'], country: 'Japan'},
  {name: 'Fujimi', jp_names: ['フジミ', 'FUJIMI'], country: 'Japan'},
  {name: 'Gundam (Gunpla)', jp_names: ['ガンダム', 'ガンプラ', 'GUNDAM', 'GUNPLA'], country: 'Japan'},
  {name: 'Hasegawa', jp_names: ['ハセガワ', 'HASEGAWA'], country: 'Japan'},
  {name: 'Hot Toys', jp_names: ['ホットトイズ', 'HOT TOYS'], country: 'Hong Kong'},
  {name: 'LEGO', jp_names: ['レゴ', 'LEGO'], country: 'Denmark'},
  {name: 'Takara Tomy', jp_names: ['タカラトミー', 'TAKARA TOMY'], country: 'Japan'},
  {name: 'Tamiya', jp_names: ['タミヤ', 'TAMIYA'], country: 'Japan'},
  {name: 'Tomica', jp_names: ['トミカ', 'TOMICA'], country: 'Japan'},

  // === Pipes (Tobacco Pipes) ===
  {name: 'Peterson', jp_names: ['ピーターソン'], country: 'Ireland', category: ['Pipes']},
  {name: 'Savinelli', jp_names: ['サビネリ'], country: 'Italy', category: ['Pipes']},
  {name: 'Stanwell', jp_names: ['スタンウェル'], country: 'Denmark', category: ['Pipes']},
  {name: 'Chacom', jp_names: ['シャコム'], country: 'France', category: ['Pipes']},
  {name: 'Butz-Choquin', jp_names: ['ビュッツショカン', 'BUTZ CHOQUIN'], country: 'France', category: ['Pipes']},
  {name: 'Vauen', jp_names: ['ファウエン'], country: 'Germany', category: ['Pipes']},
  {name: 'Brebbia', jp_names: ['ブレビア'], country: 'Italy', category: ['Pipes']},
  {name: 'Nording', jp_names: ['ノルディング'], country: 'Denmark', category: ['Pipes']},
  {name: 'Tsuge', jp_names: ['ツゲ', '柘', '柘製作所', 'TSUGE'], country: 'Japan', category: ['Pipes']},
  {name: 'Castello', jp_names: ['カステロ'], country: 'Italy', category: ['Pipes']},
  {name: 'Ser Jacopo', jp_names: ['セルヤコポ'], country: 'Italy', category: ['Pipes']},
  {name: 'Radice', jp_names: ['ラディーチェ'], country: 'Italy', category: ['Pipes']},
  {name: 'Kaywoodie', jp_names: ['ケイウッディ'], country: 'USA', category: ['Pipes']},
  {name: 'Dr. Grabow', jp_names: ['ドクターグラボウ', 'DR GRABOW'], country: 'USA', category: ['Pipes']},
  {name: 'Missouri Meerschaum', jp_names: ['ミズーリメシャム'], country: 'USA', category: ['Pipes']},
  {name: 'Brigham', jp_names: ['ブリガム'], country: 'Canada', category: ['Pipes']},
  {name: 'Ropp', jp_names: ['ロップ'], country: 'France', category: ['Pipes']},
  {name: 'Winslow', jp_names: ['ウィンスロー'], country: 'Denmark', category: ['Pipes']},
  {name: 'Ben Wade', jp_names: ['ベンウェイド'], country: 'UK', category: ['Pipes']},
  {name: 'Il Ceppo', jp_names: ['イルチェッポ'], country: 'Italy', category: ['Pipes']},
  {name: 'Caminetto', jp_names: ['カミネット'], country: 'Italy', category: ['Pipes']},
  {name: 'Medico', jp_names: ['メディコ'], country: 'USA', category: ['Pipes']},

];

// Step 1: タグからTypeを推定するためのマップ
// ルールベース抽出用（AI不要）
var IS_TAG_TO_TYPE = {
  '時計': 'Wrist Watch',
  '腕時計': 'Wrist Watch',
  'ウォッチ': 'Wrist Watch',
  '懐中時計': 'Pocket Watch',
  'リング': 'Ring',
  '指輪': 'Ring',
  'リング・指輪': 'Ring',
  'ネックレス': 'Necklace',
  'ペンダント': 'Pendant',
  'チェーン': 'Chain Necklace',
  'ブレスレット': 'Bracelet',
  'バングル': 'Bangle',
  'ピアス・イヤリング': 'Earring',
  'ピアス': 'Piercing Earring',
  'イヤリング': 'Clip-On Earring',
  'バッグ': 'Bag',
  'ハンドバッグ': 'Handbag',
  'ショルダーバッグ': 'Shoulder Bag',
  'トートバッグ': 'Tote',
  'リュック': 'Backpack',
  'ボストンバッグ': 'Boston Bag',
  'クラッチバッグ': 'Clutch',
  '靴': 'Shoes',
  'シューズ': 'Shoes',
  'スニーカー': 'Sneaker',
  'ブーツ': 'Boots',
  'サンダル': 'Sandals',
  'パンプス': 'Pumps',
  'ローファー': 'Loafers',
  'カメラ': 'Digital Camera',
  'デジカメ': 'Digital Camera',
  '一眼レフ': 'DSLR Camera',
  'ミラーレス': 'Mirrorless Camera',
  'トレカ': 'Trading Card',
  'カード': 'Trading Card',
  'ポケカ': 'Trading Card',
  '遊戯王': 'Trading Card',
  'MTG': 'Trading Card',
  'フィギュア': 'Action Figure',
  'ブローチ': 'Brooch',
  'カフリンクス': 'Cufflinks',
  'カフリンク': 'Cufflinks',
  'カフスボタン': 'Cufflinks',
  '髪飾り': 'Hair Accessory',
  'ヘアアクセサリー': 'Hair Accessory',
  'かんざし': 'Hair Pin',
  'バレッタ': 'Barrette',
  '皿': 'Plate',
  'プレート': 'Plate',
  '食器': 'Dinnerware',
  '茶碗': 'Bowl',
  'カップ': 'Cup',
  '衣類': 'Clothing',
  '服': 'Clothing',
  'トップス': 'Top',
  'ジャケット': 'Jacket',
  'コート': 'Coat',
  'パンツ': 'Pants',
  'スカーフ': 'Scarf',
  'マフラー': 'Scarf',
  'ストール': 'Shawl',
  'ネクタイ': 'Necktie',
  'ハンカチ': 'Handkerchief',
  'ネクタイピン': 'Tie Clip',
  'タイピン': 'Tie Pin',
  'タイバー': 'Tie Bar',
  'スカーフリング': 'Scarf Ring',
  'ガラス細工': 'Glass Art',
  'クリスタル': 'Crystal',
  '花瓶': 'Vase',
  'オブジェ': 'Figurine',
  'スノードーム': 'Snow Globe',
  'ガラスドーム': 'Snow Globe',
  'ジュエリーボックス': 'Jewelry Box',
  '時計ケース': 'Watch Box',
  'ウォッチボックス': 'Watch Box',
  '宝石箱': 'Jewelry Box',
  'カトラリー': 'Flatware',
  'スプーン': 'Spoon',
  'フォーク': 'Fork',
  'ナイフ': 'Knife',
  'ベビー': 'Baby Item',
  'ベビーシューズ': 'Baby Shoes',
  'ラトル': 'Rattle',
  'ベビー用品': 'Baby Item',
  '櫛': 'Comb',
  'くし': 'Comb',
  'コーム': 'Comb',
  'キーリング': 'Key Chain',
  'キーホルダー': 'Key Chain',
  'キーケース': 'Key Chain',
  'チャーム': 'Charm',
  'ペンダントトップ': 'Charm',
  // Pipes (Tobacco Pipes)
  'パイプ': 'Tobacco Pipe',
  '喫煙パイプ': 'Tobacco Pipe',
  'パイプ・喫煙具': 'Tobacco Pipe',
  '煙管': 'Kiseru',
  'キセル': 'Kiseru',
  'Pipe': 'Tobacco Pipe'
};

// ==============================
// タグ → カテゴリ マッピング
// ==============================
var IS_TAG_TO_CATEGORY = {
  '時計': 'Watches', '腕時計': 'Watches', 'ウォッチ': 'Watches', '懐中時計': 'Watches',
  'リング': 'Rings', '指輪': 'Rings', 'リング・指輪': 'Rings',
  'ネックレス': 'Necklaces', 'ペンダント': 'Necklaces', 'チェーン': 'Necklaces',
  'ブレスレット': 'Bracelets', 'バングル': 'Bracelets',
  'ピアス・イヤリング': 'Earrings', 'ピアス': 'Earrings', 'イヤリング': 'Earrings',
  'バッグ': 'Handbags', 'ハンドバッグ': 'Handbags', 'ショルダーバッグ': 'Handbags',
  'トートバッグ': 'Handbags', 'リュック': 'Handbags', 'ボストンバッグ': 'Handbags', 'クラッチバッグ': 'Handbags',
  '衣類': 'Clothing', '服': 'Clothing', 'トップス': 'Clothing', 'ボトムス': 'Clothing',
  'ジャケット': 'Clothing', 'コート': 'Clothing', 'ドレス': 'Clothing', 'スカート': 'Clothing', 'パンツ': 'Clothing',
  '靴': 'Shoes', 'シューズ': 'Shoes', 'スニーカー': 'Shoes', 'ブーツ': 'Shoes',
  'サンダル': 'Shoes', 'パンプス': 'Shoes', 'ローファー': 'Shoes',
  'カメラ': 'Cameras', 'デジカメ': 'Cameras', '一眼レフ': 'Cameras', 'ミラーレス': 'Cameras',
  '電子機器': 'Electronics', '家電': 'Electronics', 'オーディオ': 'Electronics',
  'ヘッドホン': 'Electronics', 'イヤホン': 'Electronics', 'スピーカー': 'Electronics',
  'トレカ': 'Trading Cards', 'カード': 'Trading Cards', 'トレーディングカード': 'Trading Cards',
  'ポケカ': 'Trading Cards', '遊戯王': 'Trading Cards', 'MTG': 'Trading Cards',
  'ブローチ': 'Brooches', 'カフリンクス': 'Cufflinks', 'カフリンク': 'Cufflinks', 'カフスボタン': 'Cufflinks',
  '髪飾り': 'Hair Accessories', 'ヘアアクセサリー': 'Hair Accessories', 'かんざし': 'Hair Accessories', 'バレッタ': 'Hair Accessories',
  '皿': 'Dinnerware', 'プレート': 'Dinnerware', '食器': 'Dinnerware', '茶碗': 'Dinnerware', 'カップ': 'Dinnerware',
  'スカーフ': 'Scarves', 'マフラー': 'Scarves', 'ストール': 'Scarves',
  'ネクタイ': 'Neckties', 'ハンカチ': 'Handkerchiefs',
  'ネクタイピン': 'Tie Accessories', 'タイピン': 'Tie Accessories', 'タイバー': 'Tie Accessories', 'スカーフリング': 'Tie Accessories',
  'ガラス細工': 'Glassware', 'クリスタル': 'Glassware', '花瓶': 'Glassware', 'オブジェ': 'Glassware',
  'スノードーム': 'Snow Globes', 'ガラスドーム': 'Snow Globes',
  'ジュエリーボックス': 'Boxes', '時計ケース': 'Boxes', 'ウォッチボックス': 'Boxes', '宝石箱': 'Boxes',
  'カトラリー': 'Flatware', 'スプーン': 'Flatware', 'フォーク': 'Flatware', 'ナイフ': 'Flatware',
  'ベビー': 'Baby', 'ベビーシューズ': 'Baby', 'ラトル': 'Baby', 'ベビー用品': 'Baby',
  '櫛': 'Combs', 'くし': 'Combs', 'コーム': 'Combs',
  'キーリング': 'Key Chains', 'キーホルダー': 'Key Chains', 'キーケース': 'Key Chains',
  'チャーム': 'Charms', 'ペンダントトップ': 'Charms',
  'フィギュア': 'Collectibles', 'コレクティブル': 'Collectibles',
  'アンティーク': 'Collectibles', 'ヴィンテージ': 'Collectibles', '骨董品': 'Collectibles', '人形': 'Collectibles',
  // Pipes (Tobacco Pipes)
  'パイプ': 'Pipes', '喫煙パイプ': 'Pipes', '煙管': 'Pipes', 'キセル': 'Pipes', 'パイプ・喫煙具': 'Pipes'
};

// ==============================
// カテゴリ別 出力フィールド定義（5-8フィールド、順序固定）
// ==============================
var IS_CATEGORY_FIELDS = {
  'Watches':       ['Brand', 'Type', 'Display', 'Movement', 'Case Material', 'Case Size', 'Department', 'Country/Region of Manufacture'],
  'Rings':         ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Necklaces':     ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Bracelets':     ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Earrings':      ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Handbags':      ['Brand', 'Style', 'Exterior Material', 'Exterior Color', 'Department', 'Country/Region of Manufacture'],
  'Clothing':      ['Brand', 'Type', 'Department', 'Color', 'Material', 'Country/Region of Manufacture'],
  'Shoes':         ['Brand', 'Type', 'Department', 'Color', 'Material', 'Country/Region of Manufacture'],
  'Cameras':       ['Brand', 'Type', 'Color', 'Country/Region of Manufacture'],
  'Electronics':   ['Brand', 'Type', 'Color', 'Country/Region of Manufacture'],
  'Trading Cards': ['Game', 'Language', 'Graded', 'Country/Region of Manufacture'],
  'Brooches':      ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Cufflinks':     ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Hair Accessories': ['Brand', 'Material', 'Type', 'Color', 'Country/Region of Manufacture'],
  'Dinnerware':    ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Scarves':       ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Neckties':      ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Handkerchiefs': ['Brand', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Tie Accessories': ['Brand', 'Metal', 'Metal Purity', 'Type', 'Country/Region of Manufacture'],
  'Glassware':     ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Snow Globes':   ['Brand', 'Type', 'Material', 'Country/Region of Manufacture'],
  'Boxes':         ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Flatware':      ['Brand', 'Type', 'Metal', 'Country/Region of Manufacture'],
  'Baby':          ['Brand', 'Type', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Combs':         ['Brand', 'Material', 'Type', 'Color', 'Country/Region of Manufacture'],
  'Key Chains':    ['Brand', 'Metal', 'Material', 'Color', 'Country/Region of Manufacture'],
  'Charms':        ['Brand', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country/Region of Manufacture'],
  'Collectibles':  ['Brand', 'Type', 'Material', 'Country/Region of Manufacture'],
  'Pipes':         ['Brand', 'Material', 'Type', 'Color', 'Country/Region of Manufacture']
};

// ==============================
// 素材パターン辞書
// ==============================
var IS_METAL_PATTERNS = [
  {keywords: ['K18', '18K', '18金', '750', 'Au750'], value: 'Yellow Gold'},
  {keywords: ['WG', 'ホワイトゴールド', 'White Gold'], value: 'White Gold'},
  {keywords: ['PG', 'ピンクゴールド', 'Pink Gold', 'ローズゴールド', 'Rose Gold'], value: 'Rose Gold'},
  {keywords: ['K14', '14K', '14金', '585'], value: 'Yellow Gold'},
  {keywords: ['K10', '10K', '10金'], value: 'Yellow Gold'},
  {keywords: ['Pt', 'プラチナ', 'Platinum', 'Pt900', 'Pt950', 'Pt850'], value: 'Platinum'},
  {keywords: ['SV925', '925', 'シルバー925', 'Sterling Silver', 'Sterling', 'Ag925'], value: 'Sterling Silver'},
  {keywords: ['ステンレス', 'Stainless', 'SS316'], value: 'Stainless Steel'},
  {keywords: ['チタン', 'Titanium'], value: 'Titanium'},
  {keywords: ['銅', 'Copper', 'Brass', '真鍮'], value: 'Base Metal'}
];

var IS_PURITY_PATTERNS = [
  {keywords: ['K24', '24K', '24金', '999'], value: '24k'},
  {keywords: ['K22', '22K', '22金', '916'], value: '22k'},
  {keywords: ['K18', '18K', '18金', '750'], value: '18k'},
  {keywords: ['K14', '14K', '14金', '585'], value: '14k'},
  {keywords: ['K10', '10K', '10金'], value: '10k'},
  {keywords: ['K9', '9K', '9金', '375'], value: '9k'},
  {keywords: ['Pt950'], value: '950'},
  {keywords: ['Pt900'], value: '900'},
  {keywords: ['Pt850'], value: '850'},
  {keywords: ['SV925', '925', 'Sterling'], value: '925'}
];

// ==============================
// 宝石パターン辞書
// ==============================
var IS_GEMSTONE_PATTERNS = [
  {keywords: ['ダイヤ', 'Diamond', 'ダイアモンド'], value: 'Diamond'},
  {keywords: ['ルビー', 'Ruby'], value: 'Ruby'},
  {keywords: ['サファイア', 'Sapphire'], value: 'Sapphire'},
  {keywords: ['エメラルド', 'Emerald'], value: 'Emerald'},
  {keywords: ['パール', '真珠', 'Pearl', 'アコヤ'], value: 'Pearl'},
  {keywords: ['オパール', 'Opal'], value: 'Opal'},
  {keywords: ['アメジスト', 'Amethyst'], value: 'Amethyst'},
  {keywords: ['トパーズ', 'Topaz'], value: 'Topaz'},
  {keywords: ['ガーネット', 'Garnet'], value: 'Garnet'},
  {keywords: ['ターコイズ', 'Turquoise'], value: 'Turquoise'},
  {keywords: ['翡翠', 'ヒスイ', 'Jade'], value: 'Jade'},
  {keywords: ['珊瑚', 'サンゴ', 'Coral'], value: 'Coral'},
  {keywords: ['琥珀', 'アンバー', 'Amber'], value: 'Amber'},
  {keywords: ['タンザナイト', 'Tanzanite'], value: 'Tanzanite'},
  {keywords: ['アクアマリン', 'Aquamarine'], value: 'Aquamarine'},
  {keywords: ['ムーンストーン', 'Moonstone'], value: 'Moonstone'}
];

// ==============================
// Department パターン
// ==============================
var IS_DEPARTMENT_PATTERNS = [
  {keywords: ['メンズ', '男性', 'Mens', "Men's", 'MEN', 'FOR MEN'], value: "Men"},
  {keywords: ['レディース', '女性', 'Womens', "Women's", 'WOMEN', 'FOR WOMEN', 'LADIES'], value: "Women"},
  {keywords: ['ユニセックス', '兼用', 'Unisex', 'UNISEX'], value: "Unisex"},
  {keywords: ['ボーイズ', 'Boys', 'キッズ', 'Kids', 'ジュニア'], value: "Boys"},
  {keywords: ['ガールズ', 'Girls'], value: "Girls"}
];

// ==============================
// ムーブメント パターン（時計用）
// ==============================
var IS_MOVEMENT_PATTERNS = [
  {keywords: ['自動巻', 'オートマチック', 'Automatic', 'AUTOMATIC', 'Cal.'], value: 'Automatic'},
  {keywords: ['手巻', 'Manual', 'MANUAL', 'Hand-winding', 'Hand Winding'], value: 'Mechanical (Hand-winding)'},
  {keywords: ['クォーツ', 'Quartz', 'QUARTZ', 'クオーツ', '電池式'], value: 'Quartz'},
  {keywords: ['ソーラー', 'Solar', 'SOLAR', 'エコドライブ', 'Eco-Drive', 'タフソーラー'], value: 'Solar'},
  {keywords: ['電波', 'Radio', 'Atomic'], value: 'Quartz'},
  {keywords: ['スプリングドライブ', 'Spring Drive'], value: 'Mechanical (Automatic)'},
  {keywords: ['キネティック', 'Kinetic', 'AGS'], value: 'Automatic'}
];

// ==============================
// カラー パターン
// ==============================
var IS_COLOR_PATTERNS = [
  {keywords: ['ブラック', '黒', 'Black', 'BLACK', 'Noir'], value: 'Black'},
  {keywords: ['ホワイト', '白', 'White', 'WHITE', 'Blanc'], value: 'White'},
  {keywords: ['レッド', '赤', 'Red', 'RED'], value: 'Red'},
  {keywords: ['ブルー', '青', 'Blue', 'BLUE', 'ネイビー', 'Navy'], value: 'Blue'},
  {keywords: ['グリーン', '緑', 'Green', 'GREEN'], value: 'Green'},
  {keywords: ['ブラウン', '茶', 'Brown', 'BROWN'], value: 'Brown'},
  {keywords: ['ゴールド', '金色', 'Gold', 'GOLD'], value: 'Gold'},
  {keywords: ['シルバー', '銀色', 'Silver', 'SILVER'], value: 'Silver'},
  {keywords: ['ピンク', 'Pink', 'PINK', 'ローズ', 'Rose'], value: 'Pink'},
  {keywords: ['グレー', 'グレイ', 'Gray', 'Grey', 'GREY'], value: 'Gray'},
  {keywords: ['ベージュ', 'Beige', 'BEIGE'], value: 'Beige'},
  {keywords: ['オレンジ', 'Orange'], value: 'Orange'},
  {keywords: ['パープル', '紫', 'Purple', 'Violet'], value: 'Purple'},
  {keywords: ['イエロー', '黄', 'Yellow'], value: 'Yellow'}
];

// ==============================
// 素材パターン（バッグ・衣類・靴用）
// ==============================
var IS_GENERAL_MATERIAL_PATTERNS = [
  {keywords: ['レザー', '本革', '革', 'Leather', 'LEATHER', '牛革', 'カーフ', 'ラム'], value: 'Leather'},
  {keywords: ['キャンバス', 'Canvas', 'CANVAS', '帆布'], value: 'Canvas'},
  {keywords: ['ナイロン', 'Nylon', 'NYLON'], value: 'Nylon'},
  {keywords: ['デニム', 'Denim', 'DENIM'], value: 'Denim'},
  {keywords: ['スエード', 'Suede', 'SUEDE'], value: 'Suede'},
  {keywords: ['シルク', '絹', 'Silk', 'SILK'], value: 'Silk'},
  {keywords: ['コットン', '綿', 'Cotton', 'COTTON'], value: 'Cotton'},
  {keywords: ['ウール', '羊毛', 'Wool', 'WOOL', 'カシミヤ', 'Cashmere'], value: 'Wool'},
  {keywords: ['ポリエステル', 'Polyester'], value: 'Polyester'},
  {keywords: ['リネン', '麻', 'Linen'], value: 'Linen'},
  {keywords: ['ラバー', 'Rubber', 'ゴム'], value: 'Rubber'},
  {keywords: ['PVC', 'ビニール', 'Vinyl'], value: 'PVC'},
  {keywords: ['ダウン', 'Down', 'DOWN'], value: 'Down'},
  {keywords: ['ファー', 'Fur', 'FUR', '毛皮'], value: 'Fur'},
  {keywords: ['セラミック', 'Ceramic', 'CERAMIC', '陶器', '磁器', '陶磁器'], value: 'Ceramic'},
  {keywords: ['木製', 'Wood', 'ウッド'], value: 'Wood'},
  {keywords: ['ガラス', 'Glass', 'クリスタル', 'Crystal'], value: 'Glass'},
  {keywords: ['ブライヤー', 'Briar', 'BRIAR', 'ブライアー'], value: 'Briar'},
  {keywords: ['メシャム', 'Meerschaum', 'MEERSCHAUM', '海泡石'], value: 'Meerschaum'},
  {keywords: ['コーンコブ', 'Corn Cob', 'CORN COB', 'コーン'], value: 'Corn Cob'}
];

// ==============================
// トレカ ゲーム判定パターン
// ==============================
var IS_GAME_PATTERNS = [
  {keywords: ['ポケモン', 'ポケカ', 'Pokemon', 'POKEMON', 'ピカチュウ', 'リザードン'], value: 'Pokémon'},
  {keywords: ['遊戯王', 'Yu-Gi-Oh', 'YU-GI-OH', 'YUGIOH', 'ブルーアイズ'], value: 'Yu-Gi-Oh!'},
  {keywords: ['MTG', 'Magic:', 'Magic the', 'マジック・ザ・ギャザリング', 'マジックザギャザリング'], value: 'Magic: The Gathering'},
  {keywords: ['デュエルマスターズ', 'Duel Masters', 'デュエマ'], value: 'Duel Masters'},
  {keywords: ['ヴァイスシュヴァルツ', 'Weiss Schwarz'], value: 'Weiss Schwarz'},
  {keywords: ['ヴァンガード', 'Vanguard', 'VANGUARD'], value: 'Cardfight!! Vanguard'},
  {keywords: ['バトルスピリッツ', 'Battle Spirits', 'バトスピ'], value: 'Battle Spirits'},
  {keywords: ['ドラゴンボール', 'Dragon Ball'], value: 'Dragon Ball Super Card Game'},
  {keywords: ['ワンピース', 'ONE PIECE', 'One Piece Card'], value: 'One Piece Card Game'},
  {keywords: ['デジモン', 'Digimon'], value: 'Digimon'}
];
