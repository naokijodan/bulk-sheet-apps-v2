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
  {name: 'Seiko', jp_names: ['セイコー', 'SEIKO'], country: 'Japan'},
  {name: 'Casio', jp_names: ['カシオ', 'CASIO'], country: 'Japan'},
  {name: 'Citizen', jp_names: ['シチズン', 'CITIZEN'], country: 'Japan'},
  {name: 'Orient', jp_names: ['オリエント', 'ORIENT'], country: 'Japan'},
  {name: 'G-Shock', jp_names: ['ジーショック', 'Gショック', 'G-SHOCK'], country: 'Japan'},
  {name: 'Grand Seiko', jp_names: ['グランドセイコー', 'GRAND SEIKO'], country: 'Japan'},
  {name: 'Rolex', jp_names: ['ロレックス', 'ROLEX'], country: 'Switzerland'},
  {name: 'Omega', jp_names: ['オメガ', 'OMEGA'], country: 'Switzerland'},
  {name: 'TAG Heuer', jp_names: ['タグホイヤー', 'タグ・ホイヤー', 'TAG HEUER'], country: 'Switzerland'},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France'},
  {name: 'Breitling', jp_names: ['ブライトリング', 'BREITLING'], country: 'Switzerland'},
  {name: 'IWC', jp_names: ['アイダブリューシー', 'IWC'], country: 'Switzerland'},
  {name: 'Patek Philippe', jp_names: ['パテックフィリップ', 'パテック・フィリップ', 'PATEK PHILIPPE'], country: 'Switzerland'},
  {name: 'Tudor', jp_names: ['チューダー', 'チュードル', 'TUDOR'], country: 'Switzerland'},
  {name: 'Longines', jp_names: ['ロンジン', 'LONGINES'], country: 'Switzerland'},
  {name: 'Panerai', jp_names: ['パネライ', 'PANERAI'], country: 'Italy'},
  {name: 'Hamilton', jp_names: ['ハミルトン', 'HAMILTON'], country: 'Switzerland'},
  // === Jewelry ===
  {name: 'Mikimoto', jp_names: ['ミキモト', 'MIKIMOTO'], country: 'Japan'},
  {name: 'Tasaki', jp_names: ['タサキ', '田崎真珠', 'TASAKI'], country: 'Japan'},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY'], country: 'USA'},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI'], country: 'Italy'},
  {name: 'Van Cleef & Arpels', jp_names: ['ヴァンクリーフ＆アーペル', 'ヴァンクリーフ', 'VAN CLEEF & ARPELS'], country: 'France'},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'USA'},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアンウエストウッド', 'ヴィヴィアン', 'VIVIENNE WESTWOOD'], country: 'UK'},
  {name: 'Swarovski', jp_names: ['スワロフスキー', 'SWAROVSKI'], country: 'Austria'},
  // === Trading Cards ===
  {name: 'Pokemon', jp_names: ['ポケモン', 'ポケモンカード', 'ポケカ', 'POKEMON'], country: 'Japan'},
  {name: 'Yu-Gi-Oh!', jp_names: ['遊戯王', 'ユウギオウ', 'YU-GI-OH'], country: 'Japan'},
  {name: 'One Piece', jp_names: ['ワンピース', 'ワンピースカード', 'ONE PIECE'], country: 'Japan'},
  {name: 'Magic: The Gathering', jp_names: ['マジック・ザ・ギャザリング', 'MTG'], country: 'USA'},
  {name: 'Dragon Ball', jp_names: ['ドラゴンボール', 'DRAGON BALL'], country: 'Japan'},
  {name: 'Weiss Schwarz', jp_names: ['ヴァイスシュヴァルツ', 'ヴァイス', 'WEISS SCHWARZ'], country: 'Japan'},
  // === Video Games ===
  {name: 'Nintendo', jp_names: ['任天堂', 'ニンテンドー', 'NINTENDO'], country: 'Japan'},
  {name: 'Sony PlayStation', jp_names: ['ソニー', 'プレイステーション', 'プレステ', 'PLAYSTATION'], country: 'Japan'},
  {name: 'Sega', jp_names: ['セガ', 'SEGA'], country: 'Japan'},
  {name: 'Bandai Namco', jp_names: ['バンダイナムコ', 'バンナム', 'BANDAI NAMCO'], country: 'Japan'},
  {name: 'Capcom', jp_names: ['カプコン', 'CAPCOM'], country: 'Japan'},
  {name: 'Square Enix', jp_names: ['スクウェア・エニックス', 'スクエニ', 'SQUARE ENIX'], country: 'Japan'},
  {name: 'Konami', jp_names: ['コナミ', 'KONAMI'], country: 'Japan'},
  // === Figures & Collectibles ===
  {name: 'Bandai', jp_names: ['バンダイ', 'BANDAI'], country: 'Japan'},
  {name: 'Good Smile Company', jp_names: ['グッドスマイルカンパニー', 'グッスマ', 'GOOD SMILE COMPANY'], country: 'Japan'},
  {name: 'MegaHouse', jp_names: ['メガハウス', 'MEGAHOUSE'], country: 'Japan'},
  {name: 'Kotobukiya', jp_names: ['コトブキヤ', '壽屋', 'KOTOBUKIYA'], country: 'Japan'},
  {name: 'Medicom Toy', jp_names: ['メディコムトイ', 'MEDICOM TOY'], country: 'Japan'},
  // === Cameras ===
  {name: 'Canon', jp_names: ['キヤノン', 'キャノン', 'CANON'], country: 'Japan'},
  {name: 'Nikon', jp_names: ['ニコン', 'NIKON'], country: 'Japan'},
  {name: 'Sony', jp_names: ['ソニー', 'SONY'], country: 'Japan'},
  {name: 'Fujifilm', jp_names: ['富士フイルム', 'フジフイルム', 'FUJIFILM'], country: 'Japan'},
  {name: 'Olympus', jp_names: ['オリンパス', 'OLYMPUS'], country: 'Japan'},
  {name: 'Pentax', jp_names: ['ペンタックス', 'PENTAX'], country: 'Japan'},
  {name: 'Leica', jp_names: ['ライカ', 'LEICA'], country: 'Germany'},
  // === Cell Phones ===
  {name: 'Apple', jp_names: ['アップル', 'APPLE', 'iPhone', 'アイフォン'], country: 'USA'},
  {name: 'Samsung', jp_names: ['サムスン', 'SAMSUNG', 'Galaxy', 'ギャラクシー'], country: 'South Korea'},
  // === Clothing ===
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS', 'CDG'], country: 'Japan'},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE'], country: 'Japan'},
  {name: 'Yohji Yamamoto', jp_names: ['ヨウジヤマモト', 'YOHJI YAMAMOTO'], country: 'Japan'},
  {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE'], country: 'Japan'},
  {name: 'Supreme', jp_names: ['シュプリーム', 'SUPREME'], country: 'USA'},
  {name: 'Neighborhood', jp_names: ['ネイバーフッド', 'NEIGHBORHOOD'], country: 'Japan'},
  // === Shoes ===
  {name: 'Nike', jp_names: ['ナイキ', 'NIKE'], country: 'USA'},
  {name: 'Adidas', jp_names: ['アディダス', 'ADIDAS'], country: 'Germany'},
  {name: 'New Balance', jp_names: ['ニューバランス', 'NEW BALANCE'], country: 'USA'},
  {name: 'ASICS', jp_names: ['アシックス', 'ASICS'], country: 'Japan'},
  {name: 'Onitsuka Tiger', jp_names: ['オニツカタイガー', 'ONITSUKA TIGER'], country: 'Japan'},
  // === Bags ===
  {name: 'Louis Vuitton', jp_names: ['ルイヴィトン', 'ルイ・ヴィトン', 'LOUIS VUITTON', 'LV'], country: 'France'},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy'},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France'},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France'},
  {name: 'Porter', jp_names: ['ポーター', '吉田カバン', 'PORTER'], country: 'Japan'},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy'},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France'},
  // === Pottery ===
  {name: 'Arita', jp_names: ['有田焼', 'ARITA'], country: 'Japan'},
  {name: 'Kutani', jp_names: ['九谷焼', 'KUTANI'], country: 'Japan'},
  {name: 'Imari', jp_names: ['伊万里焼', 'IMARI'], country: 'Japan'},
  {name: 'Satsuma', jp_names: ['薩摩焼', 'SATSUMA'], country: 'Japan'},
  {name: 'Noritake', jp_names: ['ノリタケ', 'NORITAKE'], country: 'Japan'},
  // === Musical Instruments ===
  {name: 'Yamaha', jp_names: ['ヤマハ', 'YAMAHA'], country: 'Japan'},
  {name: 'Roland', jp_names: ['ローランド', 'ROLAND'], country: 'Japan'},
  {name: 'Korg', jp_names: ['コルグ', 'KORG'], country: 'Japan'},
  {name: 'Ibanez', jp_names: ['アイバニーズ', 'IBANEZ'], country: 'Japan'},
  {name: 'ESP', jp_names: ['イーエスピー', 'ESP'], country: 'Japan'},
  // === Automotive ===
  {name: 'Toyota', jp_names: ['トヨタ', 'TOYOTA'], country: 'Japan'},
  {name: 'Honda', jp_names: ['ホンダ', 'HONDA'], country: 'Japan'},
  {name: 'Nissan', jp_names: ['日産', 'ニッサン', 'NISSAN'], country: 'Japan'},
  // === Toys ===
  {name: 'Takara Tomy', jp_names: ['タカラトミー', 'TAKARA TOMY'], country: 'Japan'},
  {name: 'Tamiya', jp_names: ['タミヤ', '田宮模型', 'TAMIYA'], country: 'Japan'},
  {name: 'Gundam (Gunpla)', jp_names: ['ガンダム', 'ガンプラ', 'GUNDAM', 'GUNPLA'], country: 'Japan'},
  // === Beauty ===
  {name: 'Shiseido', jp_names: ['資生堂', 'シセイドウ', 'SHISEIDO'], country: 'Japan'},
  {name: 'SK-II', jp_names: ['エスケーツー', 'SK-II', 'SK2'], country: 'Japan'},
  {name: 'KOSE', jp_names: ['コーセー', 'KOSE'], country: 'Japan'},
  // === Sporting Goods ===
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan'},
  {name: 'Yonex', jp_names: ['ヨネックス', 'YONEX'], country: 'Japan'},
  {name: 'Shimano', jp_names: ['シマノ', 'SHIMANO'], country: 'Japan'},
  {name: 'Daiwa', jp_names: ['ダイワ', 'DAIWA'], country: 'Japan'}
];
