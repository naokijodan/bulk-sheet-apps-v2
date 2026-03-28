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

// ==============================
// 初期データ（IS_INITIAL_DATA）
// ==============================
var IS_INITIAL_DATA = [
  // === Watches ===
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Display', field_type: 'recommended', priority: 3, notes: 'Analog / Digital / Analog & Digital' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Movement', field_type: 'recommended', priority: 4, notes: 'Mechanical / Automatic / Quartz' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Case Material', field_type: 'required', priority: 5, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Case Size', field_type: 'recommended', priority: 6, notes: 'mm単位' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Wrist Size', field_type: 'recommended', priority: 7, notes: 'cm/inch併記。例: 18cm/7.1in' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Dial Color', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Department', field_type: 'required', priority: 9, notes: "Men's / Women's / Unisex" },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国（本社所在国ではない）。フルネーム英語: Japan, Switzerland等' },
  
  // === Rings ===
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Designer', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal', field_type: 'required', priority: 3, notes: 'Gold, Silver, Platinum等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal Purity', field_type: 'required', priority: 4, notes: '18K, 14K, 925等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone', field_type: 'required', priority: 5, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Type', field_type: 'required', priority: 6, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },

  

  // === Bracelets ===
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Designer', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal Purity', field_type: 'required', priority: 4, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Main Stone', field_type: 'required', priority: 5, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Type', field_type: 'required', priority: 6, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },

  // === Earrings ===
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Designer', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal Purity', field_type: 'required', priority: 4, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Main Stone', field_type: 'required', priority: 5, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Type', field_type: 'required', priority: 6, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },

  // === Handbags ===
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Style', field_type: 'required', priority: 2, notes: 'Tote, Shoulder Bag, Crossbody等' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Material', field_type: 'required', priority: 3, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Department', field_type: 'required', priority: 5, notes: 'Women / Men / Unisex' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },

  // === Clothing ===
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Department', field_type: 'required', priority: 3, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'メイン素材のみ' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },

  // === Cameras ===
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Series', field_type: 'required', priority: 4, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Color', field_type: 'required', priority: 5, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Maximum Resolution', field_type: 'recommended', priority: 6, notes: 'XX.X MP形式' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Battery Type', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Features', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Lens Mount', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国。フルネーム英語' },

  // === Electronics ===
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Color', field_type: 'required', priority: 3, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー', field_name: 'Country of Origin', field_type: 'recommended', priority: 4, notes: '製造国。フルネーム英語' },

  // === Trading Cards ===
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Game', field_type: 'required', priority: 1, notes: 'Pokemon, Yu-Gi-Oh!, Magic: The Gathering等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Set', field_type: 'required', priority: 2, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Character', field_type: 'required', priority: 3, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Card Name', field_type: 'required', priority: 4, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Card Number', field_type: 'required', priority: 5, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Rarity', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Finish', field_type: 'required', priority: 7, notes: 'Holo, Reverse Holo, Non-Holo等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Graded', field_type: 'recommended', priority: 8, notes: 'Yes / No' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Professional Grader', field_type: 'recommended', priority: 9, notes: 'PSA, BGS, CGC等' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Grade', field_type: 'recommended', priority: 10, notes: 'PSA 10, BGS 9.5等' },

  // === Video Games ===
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Platform', field_type: 'required', priority: 1, notes: 'Nintendo Switch, PlayStation 5, Xbox Series X等' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Game Name', field_type: 'required', priority: 2, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Region Code', field_type: 'required', priority: 3, notes: 'NTSC-J, NTSC-U/C, PAL等' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Genre', field_type: 'required', priority: 4, notes: 'Action, RPG, Fighting等' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Character', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Publisher', field_type: 'recommended', priority: 6, notes: 'Nintendo, Sony, Capcom等' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Rating', field_type: 'recommended', priority: 7, notes: 'CERO A, ESRB E, PEGI 3等' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Language', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Video Game Consoles ===
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Brand', field_type: 'required', priority: 1, notes: 'Nintendo, Sony, Sega等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Platform', field_type: 'required', priority: 2, notes: 'Nintendo Switch, PlayStation 5等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Home Console, Handheld等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Storage Capacity', field_type: 'recommended', priority: 5, notes: '500GB, 1TB等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Region Code', field_type: 'required', priority: 7, notes: 'NTSC-J (Japan), Region Free等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Connectivity', field_type: 'recommended', priority: 8, notes: 'HDMI, Wi-Fi, Bluetooth等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Edition', field_type: 'recommended', priority: 9, notes: '限定版, 初期型, 後期型等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Fishing Reels ===
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Brand', field_type: 'required', priority: 1, notes: 'Shimano, Daiwa, Abu Garcia等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Reel Type', field_type: 'required', priority: 3, notes: 'Spinning, Baitcasting, Fly等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Hand Retrieve', field_type: 'required', priority: 4, notes: 'Right, Left, Interchangeable' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Gear Ratio', field_type: 'recommended', priority: 5, notes: '5.2:1, 6.3:1等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Ball Bearings', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Line Capacity', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Fishing Type', field_type: 'recommended', priority: 8, notes: 'Saltwater, Freshwater, All Water等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Fish Species', field_type: 'recommended', priority: 9, notes: 'Bass, Trout, Tuna等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Shoes ===
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Department', field_type: 'required', priority: 3, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Material', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },

  // === Collectibles (フィギュア・コレクティブル) ===
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Character', field_type: 'required', priority: 2, notes: 'キャラクター名' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Franchise', field_type: 'required', priority: 3, notes: '作品名（One Piece, Dragon Ball等）' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Action Figure, Statue, Scale Figure等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: 'Anime & Manga, Video Game, Movie等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'PVC, ABS, Resin等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Features', field_type: 'recommended', priority: 7, notes: 'Limited Edition, Japan Release等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Size', field_type: 'recommended', priority: 8, notes: '1/7 Scale, 15cm等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Color', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,フィギュア,アンティーク,ヴィンテージ,骨董品', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '日本アニメ→Japan、アメリカキャラ→USA' },

  // === Watch Parts ===
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Part Type', field_type: 'required', priority: 2, notes: 'Link, Bracelet, Band/Strap, Buckle, Clasp, Movement, Crystal, Crown, Case Back, Dial, Bezel, Hand, Spring Bar, Rotor, Stem 等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Stainless Steel, Gold, Titanium, Leather, Rubber, Ceramic 等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Compatible Model', field_type: 'recommended', priority: 4, notes: '対応するモデル名（Submariner, Speedmaster等）' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Size', field_type: 'recommended', priority: 5, notes: 'mm単位。ラグ幅・ベルト幅・コマ幅など' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },
  
  // === Sunglasses ===
  

  // === Soap (石鹸) ===
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Bar Soap固定' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Scent', field_type: 'required', priority: 3, notes: 'Rose, Lavender, Citrus, Honey等' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Product Line', field_type: 'recommended', priority: 4, notes: 'ブランドの代表ライン名' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },

  // === Dolls & Plush (ドール＆ぬいぐるみ) ===
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Fashion Doll, BJD, Teddy Bear, Plush Toy, Art Toy等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Character', field_type: 'required', priority: 3, notes: 'キャラクター名。該当しない場合はN/A' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Size', field_type: 'recommended', priority: 4, notes: '高さcm表記推奨' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'Mohair, Plush, Vinyl, ABS等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。Made in Japanが強いキーワード' },

  // === Scarves (スカーフ) ===
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Scarf, Shawl, Stole, Muffler' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk, Cashmere, Wool, Cotton等' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '例: 90cm x 90cm, 70cm x 180cm等' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' }
,

  // === Hats (帽子) ===
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Style', field_type: 'required', priority: 2, notes: 'Baseball Cap, Bucket Hat, Beanie, Fedora, Trucker Hat, Snapback, Dad Hat, Visor, Beret, Newsboy Cap, Flat Cap, Sun Hat, Panama Hat, Cowboy Hat' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Department', field_type: 'required', priority: 3, notes: 'Men, Women, Unisex Adults' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Cotton, Polyester, Wool, Acrylic, Nylon, Mesh, Straw, Leather, Canvas' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: 'Solid, Camouflage, Plaid, Striped, Floral, Animal Print' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Season', field_type: 'recommended', priority: 7, notes: 'Spring, Summer, Fall, Winter' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Features', field_type: 'recommended', priority: 8, notes: 'Adjustable, Breathable, Mesh Back, UV Protection, Wide Brim, Lined, Ear Flap, Waterproof' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Size', field_type: 'recommended', priority: 9, notes: 'One Size, S, M, L, XL, 7 1/8, 7 1/4, 7 3/8, 7 1/2, Adjustable' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国。フルネーム英語' },

  // === Sunglasses ===
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Frame Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Lens Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Frame Material', field_type: 'recommended', priority: 5, notes: 'Metal / Plastic / Titanium等' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Department', field_type: 'recommended', priority: 7, notes: 'Men / Women / Unisex' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Kimono ===
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Kimono / Obi / Yukata / Hakama等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Cotton / Polyester' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Style', field_type: 'recommended', priority: 5, notes: 'Kimono / Obi / Yukata等のスタイル' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Season', field_type: 'recommended', priority: 6, notes: 'Spring / Summer / Fall / Winter' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Japanese Swords ===
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Katana / Wakizashi / Tanto / Tachi / Tsuba等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Blade Material', field_type: 'required', priority: 2, notes: 'Steel / Iron / Copper等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Original/Reproduction', field_type: 'recommended', priority: 3, notes: 'Antique Original / Vintage Original / Contemporary' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Handedness', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Steel / Iron / Copper等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Tea Ceremony ===
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Tea Bowl / Natsume / Tea Caddy / Chasen等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Ceramic / Lacquer / Bamboo / Iron' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Maker', field_type: 'recommended', priority: 3, notes: '作家名' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Style', field_type: 'recommended', priority: 4, notes: 'Raku / Hagi / Bizen等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },

  // === Bonsai ===
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Pot / Tool / Wire / Soil等' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Ceramic / Clay / Stone' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Shape', field_type: 'recommended', priority: 5, notes: 'Round / Oval / Rectangle / Cascade' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Prints ===
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Listed By', field_type: 'required', priority: 1, notes: 'Dealer or Reseller / Private Listing' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Medium', field_type: 'required', priority: 2, notes: 'Woodblock / Lithograph / Screenprint' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Subject', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Maker', field_type: 'recommended', priority: 4, notes: '作家名' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Style', field_type: 'recommended', priority: 5, notes: 'Ukiyo-e / Shin-hanga / Sosaku-hanga' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },

  // === Buddhist Art ===
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Statue / Scroll / Altar / Incense Burner等' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Wood / Bronze / Stone / Gold Leaf' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Era', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },

  // === Tetsubin ===
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Tetsubin / Kyusu / Chagama' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cast Iron / Silver / Copper' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },

  // === Golf ===
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Golf Club Type', field_type: 'required', priority: 2, notes: 'Driver / Iron / Putter / Wedge / Wood / Hybrid' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Handedness', field_type: 'recommended', priority: 3, notes: 'Right-Handed / Left-Handed' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Model', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Flex', field_type: 'recommended', priority: 5, notes: 'Regular / Stiff / Senior / Ladies' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Shaft Material', field_type: 'recommended', priority: 6, notes: 'Graphite / Steel' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Loft', field_type: 'recommended', priority: 7, notes: '角度' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Club Number', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Set Makeup', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Department', field_type: 'recommended', priority: 10, notes: '' },

  // === Tennis ===
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Racquet / Ball / String / Grip等' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Head Size', field_type: 'recommended', priority: 3, notes: 'sq in' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Grip Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'String Pattern', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Weight', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },

  // === Baseball ===
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Handedness', field_type: 'recommended', priority: 2, notes: 'Right-Hand Throw / Left-Hand Throw' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Player Position', field_type: 'recommended', priority: 3, notes: 'Pitcher / Infield / Outfield / Catcher / First Base' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Type', field_type: 'required', priority: 5, notes: 'Glove / Bat / Ball / Helmet等' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'Leather / Synthetic' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Sport/Activity', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Model Year', field_type: 'recommended', priority: 10, notes: '' },

  // === Japanese Instruments ===
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Shamisen / Shakuhachi / Koto / Shinobue / Taiko' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Bamboo / Wood / Silk / Skin' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Country of Origin', field_type: 'recommended', priority: 4, notes: '' },

  // === Fishing Rods ===
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Type', field_type: 'required', priority: 2, notes: 'Spinning / Casting / Fly / Surf' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Item Length', field_type: 'recommended', priority: 4, notes: 'ft単位' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Power', field_type: 'recommended', priority: 5, notes: 'Ultra Light / Light / Medium / Heavy' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Action', field_type: 'recommended', priority: 6, notes: 'Fast / Moderate / Slow' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fish Species', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fishing Type', field_type: 'recommended', priority: 8, notes: 'Freshwater / Saltwater' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Material', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Lure Weight', field_type: 'recommended', priority: 10, notes: '' },

  // === RC & Models ===
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Car / Aircraft / Boat / Tank / Gundam等' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Scale', field_type: 'recommended', priority: 3, notes: '1/10 / 1/24 / 1/35等' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Fuel Type', field_type: 'recommended', priority: 4, notes: 'Electric / Nitro / Gas' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Anime ===
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Character', field_type: 'required', priority: 2, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Franchise', field_type: 'required', priority: 3, notes: '作品名' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Poster / Keychain / Towel / Sticker等' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Material', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Figures ===
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Franchise', field_type: 'required', priority: 1, notes: '作品名' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Character', field_type: 'required', priority: 2, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Action Figure / Statue / Nendoroid / Figma等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Brand', field_type: 'required', priority: 4, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Scale', field_type: 'recommended', priority: 5, notes: '1/6 / 1/7 / 1/8等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'PVC / ABS / Resin' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Theme', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Original/Licensed Reproduction', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Series', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Vintage', field_type: 'recommended', priority: 10, notes: '' },

  // === Stamps ===
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Certification', field_type: 'required', priority: 1, notes: 'PCGS / NGC等' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Commemorative / Definitive / Revenue等' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Year of Issue', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Topic', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Quality', field_type: 'recommended', priority: 5, notes: 'Mint / Used / Mint Never Hinged' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Coins ===
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Certification', field_type: 'required', priority: 1, notes: 'PCGS / NGC / Uncertified' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Denomination', field_type: 'required', priority: 2, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Year', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Gold / Silver / Copper / Bronze' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Grade', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Records ===
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Release Title', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Genre', field_type: 'recommended', priority: 3, notes: 'Rock / Jazz / Pop / Classical等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Grading', field_type: 'recommended', priority: 4, notes: 'Mint / Near Mint / Very Good Plus等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Label', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Format', field_type: 'required', priority: 6, notes: 'LP / EP / Single / CD / Cassette' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Size', field_type: 'recommended', priority: 7, notes: '7" / 10" / 12"' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Release Year', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Sleeve Grading', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Necklaces ===
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Style', field_type: 'required', priority: 1, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Brand', field_type: 'required', priority: 2, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Necklace / Pendant / Chain等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal', field_type: 'required', priority: 5, notes: 'Gold / Silver / Platinum等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Pendant Shape', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Secondary Stone', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Theme', field_type: 'recommended', priority: 10, notes: '' },

  // === Brooches ===
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Brooch / Pin' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Brand', field_type: 'required', priority: 2, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Material', field_type: 'required', priority: 3, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Metal', field_type: 'recommended', priority: 5, notes: 'Gold / Silver等' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Shape', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Cufflinks ===
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '18k / 14k / 925等' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Department', field_type: 'recommended', priority: 8, notes: 'Men / Women' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone Color', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Hair Accessories ===
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Comb / Clip / Pin / Headband等' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Material', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Department', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Theme', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Occasion', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Hair Type', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Features', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Dinnerware ===
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Porcelain / Ceramic / Stoneware等' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Shape', field_type: 'recommended', priority: 6, notes: 'Round / Square / Oval' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Set Includes', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Number of Place Settings', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Neckties ===
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Polyester等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Necktie / Bow Tie等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: 'Solid / Striped / Paisley等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Department', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Item Width', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Handkerchiefs ===
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cotton / Linen / Silk等' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Pattern', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Gender', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Occasion', field_type: 'recommended', priority: 8, notes: '' },

  // === Tie Accessories ===
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Tie Clip / Tie Pin / Tie Bar' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Department', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Glassware ===
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Figurine等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Glass / Crystal等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: 'Blown / Cut / Pressed等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Pattern', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Subject', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Snow Globes ===
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Material', field_type: 'recommended', priority: 3, notes: 'Glass / Plastic' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Subject', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Occasion', field_type: 'recommended', priority: 5, notes: 'Christmas / Birthday等' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Collection', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Year Manufactured', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Features', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Boxes ===
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Jewelry Box / Watch Box等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Wood / Leather / Velvet等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Suitable For', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Shape', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Lining Material', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Flatware ===
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Spoon / Fork / Knife / Set等' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Pattern', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Sterling Silver / Silverplate / Stainless Steel' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Age', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },

  // === Baby ===
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Material', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Character', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Combs ===
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Comb / Pick等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Material', field_type: 'required', priority: 4, notes: 'Wood / Horn / Plastic等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Department', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Key Chains ===
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Metal / Leather / Rubber等' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Character Family', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Era', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Charms ===
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Theme', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Pendant Shape', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Pipes ===
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Body Shape', field_type: 'recommended', priority: 2, notes: 'Billiard / Bent / Apple等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Briar / Meerschaum等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Filter Size', field_type: 'recommended', priority: 4, notes: '9mm / 6mm' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Handmade', field_type: 'recommended', priority: 5, notes: 'Yes / No' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Musical Instruments ===
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Electric Guitar / Acoustic Guitar / Bass等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Body Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Body Type', field_type: 'recommended', priority: 5, notes: 'Solid Body / Hollow Body / Semi-Hollow等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'String Configuration', field_type: 'recommended', priority: 6, notes: '6 String / 4 String等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Handedness', field_type: 'recommended', priority: 7, notes: 'Right-Handed / Left-Handed' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Model Year', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Number of Frets', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Pens ===
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Resin / Metal / Lacquer等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Ink Color', field_type: 'recommended', priority: 3, notes: 'Blue / Black / Red等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Size', field_type: 'recommended', priority: 4, notes: 'Fine / Medium / Broad' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Material', field_type: 'recommended', priority: 5, notes: 'Gold / Steel / Iridium' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Type', field_type: 'required', priority: 6, notes: 'Fountain Pen / Ballpoint / Rollerball' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Vintage', field_type: 'recommended', priority: 7, notes: 'Yes / No' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Features', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Wallets ===
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Bifold / Trifold / Long / Card Case等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Department', field_type: 'recommended', priority: 6, notes: 'Men\'s / Women\'s' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Lighters ===
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Type', field_type: 'recommended', priority: 2, notes: 'Pocket / Table / Pipe等' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Material', field_type: 'recommended', priority: 3, notes: 'Metal / Chrome / Brass' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },

  // === Art ===
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Production Technique', field_type: 'required', priority: 2, notes: 'Oil / Watercolor / Acrylic / Mixed Media等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Style', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Subject', field_type: 'recommended', priority: 4, notes: 'Landscape / Portrait / Abstract等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Material', field_type: 'recommended', priority: 7, notes: 'Canvas / Paper / Board' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Original/Licensed Reproduction', field_type: 'recommended', priority: 8, notes: 'Original / Print / Reproduction' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Time Period Produced', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Pottery ===
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Plate / Figurine等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Porcelain / Stoneware / Earthenware等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Pattern', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Belts ===
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Casual / Dress / Reversible等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas / Suede等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Department', field_type: 'recommended', priority: 6, notes: 'Men\'s / Women\'s' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Style', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Belt Buckles ===
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Metal / Silver / Brass等' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Department', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Fits Belt Width', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Pattern', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Golf Heads ===
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Golf Club Type', field_type: 'required', priority: 2, notes: 'Driver / Iron / Putter / Wedge等' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Loft', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Handedness', field_type: 'required', priority: 4, notes: 'Right-Handed / Left-Handed' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Titanium / Stainless Steel / Carbon Steel' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Model', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Lie Angle', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Head Shape', field_type: 'recommended', priority: 8, notes: 'Blade / Mallet / Mid-mallet' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Bounce', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
];

// 主要ブランド辞書（プロンプト埋め込み用）
// research_brands.json から全カテゴリ集約
var IS_BRAND_DICT = [
  // === Watches ===
  {name: '5 Actus', jp_names: ['5アクタス', 'ファイブアクタス', '5 ACTUS', 'FIVE ACTUS', 'Actus', 'ACTUS', 'Fiveactus', 'FIVEACTUS'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: '51-30', jp_names: ['51-30', 'フィフティワンサーティ'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Accutron', jp_names: ['アキュトロン', 'ACCUTRON'], country: 'USA', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Bulova Accutron II', jp_names: ['アキュトロンII', 'ACCUTRON II', 'ACCUTRON2'], country: 'USA', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Air-King', jp_names: ['エアキング', 'AIR-KING', 'AIR KING'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Aikon', jp_names: ['アイコン', 'AIKON', 'ICON', 'ICON TIDE'], country: 'Switzerland', parent_brand: 'Maurice Lacroix', category: ['Watches']},
  {name: 'American Classic', jp_names: ['アメリカンクラシック', 'AMERICAN CLASSIC'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Aqualand', jp_names: ['アクアランド', 'AQUALAND'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Aqua Terra', jp_names: ['アクアテラ', 'AQUA TERRA'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Aquanaut', jp_names: ['アクアノート', 'AQUANAUT'], country: 'Switzerland', parent_brand: 'Patek Philippe', category: ['Watches']},
  {name: 'Aquaracer', jp_names: ['アクアレーサー', 'AQUARACER'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Aquis', jp_names: ['アクイス', 'AQUIS'], country: 'Switzerland', parent_brand: 'Oris', category: ['Watches']},
  {name: 'Atacama Field', jp_names: ['アタカマフィールド', 'ATACAMA FIELD', 'ATACAMA'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Attesa', jp_names: ['アテッサ', 'ATTESA'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Alpina', jp_names: ['アルピナ', 'ALPINA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Audemars Piguet', jp_names: ['オーデマピゲ', 'AUDEMARS PIGUET'], country: 'Switzerland'},
  {name: 'Autavia', jp_names: ['オータヴィア', 'AUTAVIA'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Avenger', jp_names: ['アベンジャー', 'AVENGER'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Baby-G', jp_names: ['ベビーG', 'BABY-G', 'BABYG', 'BABY G'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Balboa', jp_names: ['バルボア', 'BALBOA'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Ball Watch', jp_names: ['ボールウォッチ', 'BALL WATCH'], country: 'USA'},
  {name: 'Ballon Bleu', jp_names: ['バロンブルー', 'BALLON BLEU'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Baltazar', jp_names: ['バルタザール', 'BALTAZAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Bambino', jp_names: ['バンビーノ', 'BAMBINO'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Banks', jp_names: ['バンクス', 'BANKS'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Baume & Mercier', jp_names: ['ボーム&メルシエ', 'ボームアンドメルシエ', 'ボーム＆メルシエ', 'BAUME & MERCIER', 'BAUME&MERCIER'], country: 'Switzerland', category: ['Watches']},
  {name: 'Bear Grylls', jp_names: ['ベアグリルス', 'BEAR GRYLLS'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Bell & Ross', jp_names: ['ベル&ロス', 'BELL & ROSS', 'BELL&ROSS'], country: 'France'},
  {name: 'Bell-Matic', jp_names: ['ベルマチック', 'BELL-MATIC', 'BELLMATIC'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Beside', jp_names: ['ビサイド', 'BESIDE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Bedat & Co', jp_names: ['ベダアンドカンパニー', 'ベダ＆カンパニー', 'BEDAT & CO', 'BEDAT&CO', 'BEDAT'], country: 'Switzerland', category: ['Watches']},
  {name: 'Big Bang', jp_names: ['ビッグバン', 'BIG BANG'], country: 'Switzerland', parent_brand: 'Hublot', category: ['Watches']},
  {name: 'Big Crown', jp_names: ['ビッグクラウン', 'BIG CROWN'], country: 'Switzerland', parent_brand: 'Oris', category: ['Watches']},
  {name: 'Black Bay', jp_names: ['ブラックベイ', 'BLACK BAY'], country: 'Switzerland', parent_brand: 'Tudor', category: ['Watches']},
  {name: 'Black Ops', jp_names: ['ブラックオプス', 'BLACK OPS'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Blancpain', jp_names: ['ブランパン', 'BLANCPAIN'], country: 'Switzerland'},
  {name: 'Breguet', jp_names: ['ブレゲ', 'BREGUET'], country: 'Switzerland'},
  {name: 'Breitling', jp_names: ['ブライトリング', 'BREITLING'], country: 'Switzerland'},
  {name: 'Bremont', jp_names: ['ブレモン', 'BREMONT'], country: 'UK'},
  {name: 'Bulova', jp_names: ['ブローバ', 'BULOVA'], country: 'USA'},
  {name: 'Bulova Curv', jp_names: ['カーヴ', 'CURV'], country: 'USA', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Buren', jp_names: ['ビューレン', 'BUREN'], country: 'Switzerland'},
  {name: 'Calatrava', jp_names: ['カラトラバ', 'CALATRAVA'], country: 'Switzerland', parent_brand: 'Patek Philippe', category: ['Watches']},
  {name: 'Campanola', jp_names: ['カンパノラ', 'CAMPANOLA'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Captain Cook', jp_names: ['キャプテンクック', 'CAPTAIN COOK'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Carrera', jp_names: ['カレラ', 'CARRERA'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France'},
  {name: 'Casio', jp_names: ['カシオ', 'CASIO'], country: 'Japan'},
  {name: 'Cellini', jp_names: ['チェリーニ', 'CELLINI'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Centrix', jp_names: ['セントリックス', 'CENTRIX'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Chemin des Tourelles', jp_names: ['シュマンデトゥレル', 'CHEMIN DES TOURELLES'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Chrono XL', jp_names: ['クロノXL', 'CHRONO XL'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Chronomat', jp_names: ['クロノマット', 'CHRONOMAT'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Classic Fusion', jp_names: ['クラシックフュージョン', 'CLASSIC FUSION'], country: 'Switzerland', parent_brand: 'Hublot', category: ['Watches']},
  {name: 'Citizen', jp_names: ['シチズン', 'CITIZEN'], country: 'Japan'},
  {name: 'Citizen L', jp_names: ['シチズンエル', 'CITIZEN L'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Colt', jp_names: ['コルト', 'COLT'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Companion', jp_names: ['コンパニオン', 'COMPANION'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Conquest', jp_names: ['コンクエスト', 'CONQUEST'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Constellation', jp_names: ['コンステレーション', 'CONSTELLATION'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Connected', jp_names: ['コネクテッド', 'CONNECTED'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Contemporary', jp_names: ['コンテンポラリー', 'CONTEMPORARY'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Credor', jp_names: ['クレドール', 'CREDOR'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Dan Henry', jp_names: ['ダンヘンリー', 'DAN HENRY'], country: 'USA'},
  {name: 'D1 Milano', jp_names: ['ディーワンミラノ', 'D1 MILANO', 'D1MILANO'], country: 'Italy'},
  {name: 'Daniel Wellington', jp_names: ['ダニエルウェリントン', 'DANIEL WELLINGTON'], country: 'Sweden'},
  {name: 'Datejust', jp_names: ['デイトジャスト', 'DATEJUST'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Day-Date', jp_names: ['デイデイト', 'DAY-DATE'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Daytona', jp_names: ['デイトナ', 'DAYTONA'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'De Ville', jp_names: ['デ・ヴィル', 'デビル', 'DE VILLE'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Delica', jp_names: ['デリカ', 'DELICA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Descent', jp_names: ['ディセント', 'DESCENT'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'DiaStar', jp_names: ['ダイヤスター', 'DIASTAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'D-Star', jp_names: ['Dスター', 'D-STAR', 'DSTAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Longines DolceVita', jp_names: ['ドルチェヴィータ', 'DOLCEVITA', 'DOLCE VITA'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Dork', jp_names: ['ダーク', 'DORK'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Eco-Drive', jp_names: ['エコドライブ', 'ECO-DRIVE', 'ECO DRIVE', 'ECODRIVE'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Eco-Drive One', jp_names: ['エコドライブワン', 'ECO-DRIVE ONE', 'ECO DRIVE ONE'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Edifice', jp_names: ['エディフィス', 'EDIFICE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Chronoffshore', jp_names: ['クロノオフショア', 'CHRONOFFSHORE', 'CHRONO OFFSHORE'], country: 'Switzerland', parent_brand: 'Edox', category: ['Watches']},
  {name: 'Edox', jp_names: ['エドックス', 'EDOX'], country: 'Switzerland'},
  {name: 'Eliros', jp_names: ['エリロス', 'ELIROS'], country: 'Switzerland', parent_brand: 'Maurice Lacroix', category: ['Watches']},
  {name: 'Epson', jp_names: ['エプソン', 'EPSON'], country: 'Japan'},
  {name: 'Erik Nielsen', jp_names: ['エリックニールセン', 'ERIK NIELSEN'], country: 'Denmark'},
  {name: 'Exceed', jp_names: ['エクシード', 'EXCEED'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Longines Evidenza', jp_names: ['エヴィデンツァ', 'EVIDENZA'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Explorer', jp_names: ['エクスプローラー', 'EXPLORER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Fenix', jp_names: ['フェニックス', 'FENIX'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Ferrari', jp_names: ['フェラーリ', 'FERRARI'], country: 'Italy', category: ['Watches']},
  {name: 'Flat 42', jp_names: ['フラット42', 'FLAT 42'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Florence', jp_names: ['フローレンス', 'FLORENCE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'ForeAthlete', jp_names: ['フォアアスリート', 'FOREATHLETE'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Forerunner', jp_names: ['フォアランナー', 'FORERUNNER'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Formula 1', jp_names: ['フォーミュラ1', 'FORMULA 1'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Frederique Constant', jp_names: ['フレデリックコンスタント', 'FREDERIQUE CONSTANT'], country: 'Switzerland'},
  {name: 'G-Chrono', jp_names: ['Gクロノ', 'G-CHRONO', 'G CHRONO'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'G-Frame', jp_names: ['Gフレーム', 'G-FRAME', 'G FRAME'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'Galante', jp_names: ['ガランテ', 'GALANTE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'G-Shock Frogman', jp_names: ['フロッグマン', 'FROGMAN', 'Frogman'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock G-Steel', jp_names: ['Gスチール', 'G-STEEL', 'GSTEEL', 'GST-'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock G-LIDE', jp_names: ['Gライド', 'G-LIDE', 'GLIDE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Garmin', jp_names: ['ガーミン', 'GARMIN'], country: 'USA'},
  {name: 'GC Watches', jp_names: ['ジーシーウォッチ', 'GC WATCHES', 'GC', 'GUESS COLLECTION'], country: 'Switzerland'},
  {name: 'Gentleman', jp_names: ['ジェントルマン', 'GENTLEMAN', 'GENTLEMEN'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Girard-Perregaux', jp_names: ['ジラールペルゴ', 'GIRARD-PERREGAUX', 'GIRARD PERREGAUX'], country: 'Switzerland'},
  {name: 'Glashütte Original', jp_names: ['グラスヒュッテオリジナル', 'GLASHUTTE ORIGINAL', 'GO'], country: 'Germany', category: ['Watches']},
  {name: 'G-Shock', jp_names: ['Gショック', 'G-SHOCK', 'GSHOCK', 'G SHOCK'], country: 'Japan', parent_brand: 'Casio'},
  {name: 'G-Timeless', jp_names: ['Gタイムレス', 'G-TIMELESS', 'G TIMELESS'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'GMT-Master', jp_names: ['GMTマスター', 'GMT-MASTER', 'GMT MASTER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Golden Horse', jp_names: ['ゴールデンホース', 'GOLDEN HORSE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Grand Seiko', jp_names: ['グランドセイコー', 'GRAND SEIKO'], country: 'Japan', parent_brand: 'Seiko'},
  {name: 'Green Horse', jp_names: ['グリーンホース', 'GREEN HORSE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Gucci Dive', jp_names: ['グッチダイブ', 'GUCCI DIVE'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'Gucci Grip', jp_names: ['グッチグリップ', 'GUCCI GRIP'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'Gucci 9000M', jp_names: ['グッチ9000M', 'GUCCI 9000M', '9000M'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'Hamilton', jp_names: ['ハミルトン', 'HAMILTON'], country: 'USA'},
  {name: 'Hublot', jp_names: ['ウブロ', 'HUBLOT'], country: 'Switzerland'},
  {name: 'HydroConquest', jp_names: ['ハイドロコンクエスト', 'HYDROCONQUEST'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'HyperChrome', jp_names: ['ハイパークローム', 'HYPERCHROME', 'HYPER CHROME'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Independent', jp_names: ['インディペンデント', 'INDEPENDENT'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Ingenieur', jp_names: ['インヂュニア', 'INGENIEUR'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Instinct', jp_names: ['インスティンクト', 'INSTINCT'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Integral', jp_names: ['インテグラル', 'INTEGRAL'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Intarsio', jp_names: ['インタルシオ', 'INTARSIO'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Bering', jp_names: ['ベーリング', 'BERING'], country: 'Denmark'},
  {name: 'Jacob Jensen', jp_names: ['ヤコブイェンセン', 'JACOB JENSEN'], country: 'Denmark'},
  {name: 'IWC', jp_names: ['IWC'], country: 'Switzerland'},
  {name: 'IWC Mark', jp_names: ['マーク', 'MARK'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'IWC Pilot', jp_names: ['パイロット', 'PILOT', "PILOT'S"], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Jaeger-LeCoultre', jp_names: ['ジャガールクルト', 'JAEGER-LECOULTRE', 'JAEGER LECOULTRE'], country: 'Switzerland'},
  {name: 'Jazzmaster', jp_names: ['ジャズマスター', 'JAZZMASTER'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Jubile', jp_names: ['ジュビリー', 'JUBILE', 'JUBILÉ'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Junghans', jp_names: ['ユンハンス', 'JUNGHANS'], country: 'Germany'},
  {name: 'Kamasu', jp_names: ['カマス', 'KAMASU'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'KARL-LEIMON', jp_names: ['カールレイモン', 'KARL-LEIMON', 'KARL LEIMON'], country: 'Japan', category: ['Watches']},
  {name: 'KARL-LEIMON Classic38', jp_names: ['クラシック38', 'CLASSIC38', 'CLASSIC 38'], country: 'Japan', parent_brand: 'KARL-LEIMON', category: ['Watches']},
  {name: 'KARL-LEIMON Moonphase', jp_names: ['ムーンフェイズ', 'M1BL01', 'MOONPHASE'], country: 'Japan', parent_brand: 'KARL-LEIMON', category: ['Watches']},
  {name: 'Kentex', jp_names: ['ケンテックス', 'KENTEX'], country: 'Japan', category: ['Watches']},
  {name: 'Kentex JSDF', jp_names: ['自衛隊', 'JSDF', 'ジェイエスディーエフ'], country: 'Japan', parent_brand: 'Kentex', category: ['Watches']},
  {name: 'Kentex Aviation', jp_names: ['アヴィエーション', 'AVIATION', 'AVIATION RESCUE'], country: 'Japan', parent_brand: 'Kentex', category: ['Watches']},
  {name: 'Khaki', jp_names: ['カーキ', 'KHAKI'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Khaki Aviation', jp_names: ['カーキアビエーション', 'KHAKI AVIATION'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Khaki Field', jp_names: ['カーキフィールド', 'KHAKI FIELD'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Kii', jp_names: ['キー', 'KII'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'King Quartz', jp_names: ['キングクォーツ', 'KING QUARTZ', 'キングクオーツ'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'King Seiko', jp_names: ['キングセイコー', 'KING SEIKO', 'KingSeiko', 'KINGSEIKO', 'KS'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Kirium', jp_names: ['キリウム', 'KIRIUM'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Knot', jp_names: ['ノット', 'KNOT'], country: 'Japan', category: ['Watches']},
  {name: 'Kurono Tokyo', jp_names: ['クロノトウキョウ', 'KURONO TOKYO'], country: 'Japan', category: ['Watches']},
  {name: 'Lady Sports', jp_names: ['レディスポーツ', 'LADY SPORTS'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Lamborghini', jp_names: ['ランボルギーニ', 'LAMBORGHINI', 'TONINO LAMBORGHINI'], country: 'Italy'},
  {name: 'Le Locle', jp_names: ['ル・ロックル', 'LE LOCLE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Leatherback Sea Turtle', jp_names: ['レザーバックシータートル', 'LEATHERBACK SEA TURTLE', 'LEATHERBACK'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Louis Erard', jp_names: ['ルイエラール', 'ルイ・エラール', 'LOUIS ERARD'], country: 'Switzerland', category: ['Watches']},
  {name: 'Legend Diver', jp_names: ['レジェンドダイバー', 'LEGEND DIVER'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Lineage', jp_names: ['リニエージ', 'LINEAGE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Link', jp_names: ['リンク', 'LINK'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Locman', jp_names: ['ロックマン', 'LOCMAN'], country: 'Italy'},
  {name: 'Longines', jp_names: ['ロンジン', 'LONGINES'], country: 'Switzerland'},
  {name: 'Longines Flagship', jp_names: ['フラッグシップ', 'FLAGSHIP', 'Longines Flagship'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Longines Master', jp_names: ['マスターコレクション', 'MASTER COLLECTION', 'MASTER'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Longines Spirit', jp_names: ['スピリット', 'SPIRIT'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Longines Grand Classic', jp_names: ['グランドクラシック', 'GRAND CLASSIC', 'GRAND CLASSIQUE'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Longines Heritage', jp_names: ['ロンジンヘリテージ', 'LONGINES HERITAGE'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Lord Marvel', jp_names: ['ロードマーベル', 'LORD MARVEL', 'Road Marvel', 'ROAD MARVEL'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Lord Matic', jp_names: ['ロードマチック', 'LORD MATIC', 'LM'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Luminor', jp_names: ['ルミノール', 'LUMINOR'], country: 'Italy', parent_brand: 'Panerai', category: ['Watches']},
  {name: 'Luminox', jp_names: ['ルミノックス', 'LUMINOX'], country: 'USA'},
  {name: 'Luminox G-Collection', jp_names: ['Gコレクション', 'G-COLLECTION', 'G COLLECTION'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Heritage', jp_names: ['ルミノックスヘリテージ', 'LUMINOX HERITAGE'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Pacific Diver', jp_names: ['パシフィックダイバー', 'PACIFIC DIVER'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox COLORMARK', jp_names: ['カラーマーク', 'COLORMARK', 'COLOR MARK'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Spartan Race', jp_names: ['スパルタンレース', 'SPARTAN RACE', 'SPARTAN'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Manta Ray', jp_names: ['マンタレイ', 'MANTA RAY'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox RB Ampol', jp_names: ['レッドブルアンポル', 'RB AMPOL', 'RED BULL AMPOL'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Navy SEAL Steel', jp_names: ['ネイビーシールスティール', 'NAVY SEAL STEEL', '3200'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Master Carbon SEAL', jp_names: ['マスターカーボンシール', 'MASTER CARBON SEAL', 'MASTER CARBON'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox ICE-SAR', jp_names: ['アイスサー', 'ICE-SAR', 'ICE SAR'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Recon', jp_names: ['リーコン', 'RECON', 'POINTMAN'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox F-117 Nighthawk', jp_names: ['ナイトホーク', 'F-117', 'NIGHTHAWK'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox EVO Navy SEAL', jp_names: ['エヴォネイビーシール', 'EVO NAVY SEAL', 'EVO'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Deep Dive', jp_names: ['ディープダイブ', 'DEEP DIVE'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Lunage', jp_names: ['ルナージュ', 'LUNAGE'], country: 'Japan'},
  {name: 'M-Force', jp_names: ['エムフォース', 'M-FORCE', 'MFORCE'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Mako', jp_names: ['マコ', 'MAKO'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Marine Star', jp_names: ['マリンスター', 'MARINE STAR'], country: 'USA', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Mark Coupe', jp_names: ['マーククーペ', 'MARK COUPE', 'Mark Coupe'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Max Bill', jp_names: ['マックスビル', 'MAX BILL', 'MAXBILL'], country: 'Germany', parent_brand: 'Junghans', category: ['Watches']},
  {name: 'Maurice Lacroix', jp_names: ['モーリスラクロア', 'MAURICE LACROIX'], country: 'Switzerland'},
  {name: 'Milgauss', jp_names: ['ミルガウス', 'MILGAUSS'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Minase', jp_names: ['ミナセ', 'MINASE'], country: 'Japan', category: ['Watches']},
  {name: 'Monaco', jp_names: ['モナコ', 'MONACO'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'G-Shock MR-G', jp_names: ['MR-G', 'MRG-', 'MRG ', 'MR-G-'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock MT-G', jp_names: ['MT-G', 'MTG'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock Mudmaster', jp_names: ['マッドマスター', 'MUDMASTER', 'Mudmaster'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Manhattan', jp_names: ['マンハッタン', 'MANHATTAN'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Manual', jp_names: ['マニュアル', 'MANUAL'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Manuale', jp_names: ['マヌアーレ', 'MANUALE', 'マニュアーレ'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Manuale Slim', jp_names: ['マヌアーレスリム', 'MANUALE SLIM'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Manuale Thin', jp_names: ['マヌアーレシン', 'MANUALE THIN'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Multi Year Calendar', jp_names: ['万年カレンダー', 'MULTI YEAR CALENDAR'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Musketeer', jp_names: ['マスケティア', 'MUSKETEER'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Napoleone', jp_names: ['ナポレオーネ', 'NAPOLEONE'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Nautilus', jp_names: ['ノーチラス', 'NAUTILUS'], country: 'Switzerland', parent_brand: 'Patek Philippe', category: ['Watches']},
  {name: 'NEFROM', jp_names: ['ネフロム', 'NEFROM'], country: 'Denmark'},
  {name: 'Navitimer', jp_names: ['ナビタイマー', 'NAVITIMER'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Navy Seal', jp_names: ['ネイビーシールズ', 'NAVY SEAL', 'NAVY SEALS', 'Navy Seals'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Newton', jp_names: ['ニュートン', 'NEWTON'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Nixon', jp_names: ['ニクソン', 'NIXON'], country: 'USA'},
  {name: 'Nomos', jp_names: ['ノモス', 'NOMOS'], country: 'Germany'},
  {name: 'Oceanus', jp_names: ['オシアナス', 'OCEANUS'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Omega', jp_names: ['オメガ', 'OMEGA'], country: 'Switzerland'},
  {name: 'Orient', jp_names: ['オリエント', 'ORIENT'], country: 'Japan'},
  {name: 'Orient Star', jp_names: ['オリエントスター', 'ORIENT STAR'], country: 'Japan', parent_brand: 'Orient'},
  {name: 'Oris', jp_names: ['オリス', 'ORIS'], country: 'Switzerland'},
  {name: 'Oris Diver', jp_names: ['オリスダイバー', 'ORIS DIVER'], country: 'Switzerland', parent_brand: 'Oris', category: ['Watches']},
  {name: 'Oyster Perpetual', jp_names: ['オイスターパーペチュアル', 'OYSTER PERPETUAL'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Panerai', jp_names: ['パネライ', 'PANERAI'], country: 'Italy'},
  {name: 'Panthere', jp_names: ['パンテール', 'PANTHERE'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Pasha', jp_names: ['パシャ', 'PASHA'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Patek Philippe', jp_names: ['パテックフィリップ', 'PATEK PHILIPPE'], country: 'Switzerland'},
  {name: 'Pelagos', jp_names: ['ペラゴス', 'PELAGOS'], country: 'Switzerland', parent_brand: 'Tudor', category: ['Watches']},
  {name: 'Philippe Charriol', jp_names: ['フィリップシャリオール', 'シャリオール', 'PHILIPPE CHARRIOL', 'CHARRIOL'], country: 'Switzerland'},
  {name: 'Charriol Megeve', jp_names: ['メジェーヴ', 'MEGEVE'], country: 'Switzerland', parent_brand: 'Philippe Charriol', category: ['Watches']},
  {name: 'Piaget', jp_names: ['ピアジェ', 'PIAGET'], country: 'Switzerland'},
  {name: 'Pierre Lannier', jp_names: ['ピエールラニエ', 'PIERRE LANNIER'], country: 'France'},
  {name: 'Planet Ocean', jp_names: ['プラネットオーシャン', 'PLANET OCEAN'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Player', jp_names: ['プレイヤー', 'PLAYER'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Portofino', jp_names: ['ポートフィノ', 'PORTOFINO'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Portugieser', jp_names: ['ポルトギーゼ', 'PORTUGIESER'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Precisionist', jp_names: ['プレシジョニスト', 'PRECISIONIST'], country: 'USA', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Premier', jp_names: ['プルミエ', 'プレミエ', 'PREMIER'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Longines Presence', jp_names: ['プレゼンス', 'PRESENCE'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'PRX', jp_names: ['ピーアールエックス', 'PRX'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Professional', jp_names: ['プロフェッショナル', 'PROFESSIONAL'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Pro Trek', jp_names: ['プロトレック', 'PRO TREK', 'PROTREK'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Promaster', jp_names: ['プロマスター', 'PROMASTER'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Purple Horse', jp_names: ['パープルホース', 'PURPLE HORSE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Quadrato', jp_names: ['クアドラート', 'QUADRATO'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Radiomir', jp_names: ['ラジオミール', 'RADIOMIR'], country: 'Italy', parent_brand: 'Panerai', category: ['Watches']},
  {name: 'Raymond Weil', jp_names: ['レイモンドウェイル', 'レイモンド・ウェイル', 'レイモンドウエイル', 'RAYMOND WEIL'], country: 'Switzerland', category: ['Watches']},
  {name: 'Rey Urban', jp_names: ['レイアーバン', 'REY URBAN'], country: 'Denmark'},
  {name: 'Rado', jp_names: ['ラドー', 'RADO'], country: 'Switzerland'},
  {name: 'Railmaster', jp_names: ['レイルマスター', 'RAILMASTER'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'G-Shock Rangeman', jp_names: ['レンジマン', 'RANGEMAN', 'Rangeman'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock Raysman', jp_names: ['レイズマン', 'RAYSMAN', 'Raysman'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock Riseman', jp_names: ['ライズマン', 'RISEMAN', 'Riseman', 'RiseMan'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Ray', jp_names: ['レイ', 'RAY'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Revue Thommen', jp_names: ['レビュートーメン', 'REVUE THOMMEN'], country: 'Switzerland', category: ['Watches']},
  {name: 'Longines Record', jp_names: ['レコード', 'RECORD'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Ritmo Latino', jp_names: ['リトモラティーノ', 'RITMO LATINO'], country: 'Italy', category: ['Watches']},
  {name: 'Roberto Cavalli', jp_names: ['ロベルトカヴァリ', 'ROBERTO CAVALLI'], country: 'Italy'},
  {name: 'Rolex', jp_names: ['ロレックス', 'ROLEX'], country: 'Switzerland'},
  {name: 'Rolex Custom', jp_names: ['ロレックスカスタム', 'ROLEX CUSTOM'], country: 'Switzerland'},
  {name: 'Rotolog', jp_names: ['ロトログ', 'ROTOLOG'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Royal Orient', jp_names: ['ロイヤルオリエント', 'ROYAL ORIENT'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'RSW', jp_names: ['ラマスイスウォッチ', 'RSW', 'RAMA SWISS WATCH'], country: 'Switzerland', category: ['Watches']},
  {name: 'Royal Oak', jp_names: ['ロイヤルオーク', 'ROYAL OAK'], country: 'Switzerland', parent_brand: 'Audemars Piguet', category: ['Watches']},
  {name: 'Royal Oak Offshore', jp_names: ['ロイヤルオークオフショア', 'ROYAL OAK OFFSHORE'], country: 'Switzerland', parent_brand: 'Audemars Piguet', category: ['Watches']},
  {name: 'S/el', jp_names: ['セル', 'SEL', 'S/EL'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Santos', jp_names: ['サントス', 'SANTOS'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Sea Turtle', jp_names: ['シータートル', 'SEA TURTLE'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Sea-Dweller', jp_names: ['シードゥエラー', 'SEA-DWELLER', 'SEA DWELLER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Seamaster', jp_names: ['シーマスター', 'SEAMASTER'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Seastar', jp_names: ['シースター', 'SEASTAR'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Satellite Wave', jp_names: ['サテライトウェーブ', 'SATELLITE WAVE'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Seiko', jp_names: ['セイコー', 'SEIKO'], country: 'Japan'},
  {name: 'Seiko 5', jp_names: ['セイコー5', 'SEIKO 5', 'セイコーファイブ', 'SEIKO5', 'Seiko Five'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Advan', jp_names: ['アドバン', 'ADVAN', 'Advan'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Alba', jp_names: ['アルバ', 'ALBA', 'Seiko Alba', 'SEIKO ALBA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Alpinist', jp_names: ['アルピニスト', 'ALPINIST'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Astron', jp_names: ['アストロン', 'ASTRON'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Brightz', jp_names: ['ブライツ', 'BRIGHTZ'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Business', jp_names: ['セイコービジネス', 'SEIKO BUSINESS', 'ビジネス'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Captain Willard', jp_names: ['キャプテンウィラード', 'CAPTAIN WILLARD', 'ウィラード'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Chronos', jp_names: ['クロノス', 'CHRONOS'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Cocktail Time', jp_names: ['カクテルタイム', 'COCKTAIL TIME', 'COCKTAIL'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Diver', jp_names: ['セイコーダイバー', 'SEIKO DIVER', 'ダイバー'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Dolce', jp_names: ['ドルチェ', 'DOLCE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Exceline', jp_names: ['エクセリーヌ', 'EXCELINE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Flightmaster', jp_names: ['フライトマスター', 'FLIGHTMASTER'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Lukia', jp_names: ['ルキア', 'LUKIA', 'Seiko Lukia', 'SEIKO LUKIA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Monster', jp_names: ['モンスター', 'MONSTER'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Presage', jp_names: ['プレザージュ', 'PRESAGE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Pulsar', jp_names: ['パルサー', 'PULSAR', 'Pulsar'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Prospex', jp_names: ['プロスペックス', 'PROSPEX'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Samurai', jp_names: ['サムライ', 'SAMURAI'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Selection', jp_names: ['セイコーセレクション', 'SEIKO SELECTION'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Silver Wave', jp_names: ['シルバーウェーブ', 'SILVER WAVE', 'SilverWave', 'SILVERWAVE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Spirit', jp_names: ['スピリット', 'SPIRIT'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Sumo', jp_names: ['スモウ', 'SUMO'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Tuna', jp_names: ['ツナ', 'ツナ缶', 'TUNA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Turtle', jp_names: ['タートル', 'TURTLE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Type II', jp_names: ['タイプツー', 'TYPE II', 'タイプ2', 'TYPE2', 'TYPEII'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seiko Wired', jp_names: ['ワイアード', 'WIRED', 'Seiko Wired', 'SEIKO WIRED'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Seikomatic', jp_names: ['セイコーマチック', 'SEIKOMATIC'], country: 'Japan'},
  {name: 'Seikosha', jp_names: ['精工舎', 'SEIKOSHA', 'SEIKOSYA'], country: 'Japan'},
  {name: 'Senna', jp_names: ['セナ', 'SENNA'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Sentry', jp_names: ['セントリー', 'SENTRY'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Series 8', jp_names: ['シリーズエイト', 'SERIES 8', 'シリーズ8'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Seven Star', jp_names: ['セブンスター', 'SEVEN STAR'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Chariot', jp_names: ['シャリオ', 'CHARIOT', 'SHARIO'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Sheen', jp_names: ['シーン', 'SHEEN'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Shinola', jp_names: ['シノラ', 'SHINOLA'], country: 'USA'},
  {name: 'Silver Star', jp_names: ['シルバースター', 'SILVER STAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Skyliner', jp_names: ['スカイライナー', 'SKYLINER'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Space Series', jp_names: ['スペースシリーズ', 'SPACE SERIES', 'SPACE'], country: 'USA', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Speedmaster', jp_names: ['スピードマスター', 'SPEEDMASTER'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Spinnaker', jp_names: ['スピニカー', 'SPINNAKER'], country: 'UK', category: ['Watches']},
  {name: 'Sportura', jp_names: ['スポーチュラ', 'SPORTURA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Submariner', jp_names: ['サブマリーナ', 'SUBMARINER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Submersible', jp_names: ['サブマーシブル', 'SUBMERSIBLE'], country: 'Italy', parent_brand: 'Panerai', category: ['Watches']},
  {name: 'Superocean', jp_names: ['スーパーオーシャン', 'SUPEROCEAN'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Super Rover', jp_names: ['スーパーローバー', 'SUPER ROVER'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'S.T. Dupont', jp_names: ['エス・テー・デュポン', 'デュポン', 'ST DUPONT', 'S.T.DUPONT', 'DUPONT'], country: 'France'},
  {name: 'Swatch', jp_names: ['スウォッチ', 'SWATCH'], country: 'Switzerland'},
  {name: 'TAG Heuer', jp_names: ['タグホイヤー', 'TAG HEUER'], country: 'Switzerland'},
  {name: 'Takeo Kikuchi', jp_names: ['タケオキクチ', 'TAKEO KIKUCHI'], country: 'Japan'},
  {name: 'Tank', jp_names: ['タンク', 'TANK'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'The 42-20', jp_names: ['42-20', 'フォーティーツートゥエンティ'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'The Citizen', jp_names: ['ザ・シチズン', 'THE CITIZEN'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Tide', jp_names: ['タイド', 'TIDE'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Tiffany Atlas', jp_names: ['アトラス', 'ATLAS', 'Tiffany Atlas', 'TIFFANY ATLAS'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany Classic', jp_names: ['ティファニークラシック', 'TIFFANY CLASSIC', 'Classic Round'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany East West', jp_names: ['イーストウエスト', 'EAST WEST'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany Cocktail', jp_names: ['カクテル', 'TIFFANY COCKTAIL'], country: 'USA', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Time Teller', jp_names: ['タイムテラー', 'TIME TELLER'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Timex', jp_names: ['タイメックス', 'TIMEX'], country: 'USA'},
  {name: 'Timex Easy Reader', jp_names: ['イージーリーダー', 'EASY READER'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Expedition', jp_names: ['エクスペディション', 'EXPEDITION'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Ironman', jp_names: ['アイアンマン', 'IRONMAN', 'IRON MAN'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Marlin', jp_names: ['マーリン', 'MARLIN'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex MK1', jp_names: ['MK1', 'エムケーワン'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Q', jp_names: ['タイメックスQ', 'TIMEX Q'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Waterbury', jp_names: ['ウォーターベリー', 'WATERBURY'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Weekender', jp_names: ['ウィークエンダー', 'WEEKENDER'], country: 'USA', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Tisse', jp_names: ['ティセ', 'TISSE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Tissot Ballade', jp_names: ['バラード', 'BALLADE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Carson', jp_names: ['カーソン', 'CARSON', 'CARSON PREMIUM'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Classic Dream', jp_names: ['クラシックドリーム', 'CLASSIC DREAM'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Heritage', jp_names: ['ティソヘリテージ', 'TISSOT HERITAGE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Heritage Banana', jp_names: ['ヘリテージバナナ', 'HERITAGE BANANA', 'BANANA'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot PR50', jp_names: ['PR50', 'PR 50'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot PRC200', jp_names: ['PRC200', 'PRC 200'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Super Sport', jp_names: ['スーパースポーツ', 'SUPER SPORT', 'SUPERSPORT'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot T-Race', jp_names: ['Tレース', 'T-RACE', 'TRACE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot T-Touch', jp_names: ['Tタッチ', 'T-TOUCH', 'TTOUCH', 'T TOUCH', 'T-TOUCH CONNECT'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot T-Wave', jp_names: ['Tウェーブ', 'T-WAVE', 'TWAVE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot Tradition', jp_names: ['トラディション', 'TRADITION', 'TRADITIONS'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Tissot', jp_names: ['ティソ', 'TISSOT'], country: 'Switzerland'},
  {name: 'Triton', jp_names: ['トリトン', 'TRITON'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'True', jp_names: ['トゥルー', 'TRUE', 'RADO TRUE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Terra Cielo Mare', jp_names: ['テッラチエロマーレ', 'TERRA CIELO MARE', 'TCM'], country: 'Italy', category: ['Watches']},
  {name: 'Tudor', jp_names: ['チュードル', 'チューダー', 'TUDOR'], country: 'Switzerland'},
  {name: 'Ulysse Nardin', jp_names: ['ユリスナルダン', 'ULYSSE NARDIN'], country: 'Switzerland'},
  {name: 'Universal Geneve', jp_names: ['ユニバーサルジュネーブ', 'UNIVERSAL GENEVE', 'UNIVERSAL GENÈVE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Vacheron Constantin', jp_names: ['ヴァシュロンコンスタンタン', 'VACHERON CONSTANTIN'], country: 'Switzerland'},
  {name: 'Vanac', jp_names: ['バナック', 'VANAC', 'Seiko Vanac', 'SEIKO VANAC'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Vega', jp_names: ['ベガ', 'VEGA'], country: 'USA', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Ventura', jp_names: ['ベンチュラ', 'VENTURA'], country: 'USA', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Venu', jp_names: ['ヴェニュー', 'VENU'], country: 'USA', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Victorinox', jp_names: ['ビクトリノックス', 'ヴィクトリノックス', 'VICTORINOX'], country: 'Switzerland', category: ['Watches']},
  {name: 'Voyager', jp_names: ['ボイジャー', 'VOYAGER'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Wave Ceptor', jp_names: ['ウェーブセプター', 'WAVE CEPTOR'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Wicca', jp_names: ['ウィッカ', 'WICCA'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Waltham', jp_names: ['ウォルサム', 'WALTHAM'], country: 'USA'},
  {name: 'Wenger', jp_names: ['ウェンガー', 'WENGER'], country: 'Switzerland', category: ['Watches']},
  {name: 'xC', jp_names: ['クロスシー', 'XC'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Yacht-Master', jp_names: ['ヨットマスター', 'YACHT-MASTER', 'YACHT MASTER', 'YACHTMASTER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Zenith', jp_names: ['ゼニス', 'ZENITH'], country: 'Switzerland'},
  {name: 'Zeppelin', jp_names: ['ツェッペリン', 'ZEPPELIN'], country: 'Germany'},
  {name: 'U-Boat', jp_names: ['ユーボート', 'U BOAT', 'UBOAT'], country: 'Italy'},
  {name: 'GaGa Milano', jp_names: ['ガガミラノ', 'GAGA MILANO', 'GAGAMILANO', 'GAGA', 'ガガ ミラノ'], country: 'Italy'},

  // === Jewelry & Accessories ===
  {name: '4℃', jp_names: ['ヨンドシー', '4℃', '4°C'], country: 'Japan'},
  {name: 'Agete', jp_names: ['アガット', 'AGETE'], country: 'Japan'},
  {name: 'Ahkah', jp_names: ['アーカー', 'AHKAH'], country: 'Japan'},
  {name: 'Aksel Holmsen', jp_names: ['アクセルホルムセン', 'AKSEL HOLMSEN', 'HOLMSEN'], country: 'Norway'},
  {name: 'Alex Monroe', jp_names: ['アレックスモンロー', 'ALEX MONROE'], country: 'UK'},
  {name: 'Alexandre de Paris', jp_names: ['アレクサンドルドゥパリ', 'アレクサンドル ドゥ パリ', 'ALEXANDRE DE PARIS'], country: 'France'},
  {name: 'Anton Michelsen', jp_names: ['アントンミケルセン', 'ANTON MICHELSEN', 'A. MICHELSEN'], country: 'Denmark'},
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
  {name: 'Emporio Armani', jp_names: ['エンポリオアルマーニ', 'エンポリオ アルマーニ', 'EMPORIO ARMANI', 'EMPORIOARMANI', 'ARMANI'], country: 'Italy'},
  {name: 'Ete', jp_names: ['エテ', 'ETE'], country: 'Japan'},
  {name: 'Folli Follie', jp_names: ['フォリフォリ', 'FOLLI FOLLIE'], country: 'Greece'},
  {name: 'Etro', jp_names: ['エトロ', 'ETRO'], country: 'Italy'},
  {name: 'Fred', jp_names: ['フレッド', 'FRED'], country: 'France'},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy'},
  {name: 'Hans Hansen', jp_names: ['ハンスハンセン', 'HANS HANSEN'], country: 'Denmark'},
  {name: 'Harry Winston', jp_names: ['ハリー・ウィンストン', 'HARRY WINSTON'], country: 'USA'},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France'},
  {name: 'J. Tostrup', jp_names: ['トストルプ', 'J. TOSTRUP', 'TOSTRUP'], country: 'Norway'},
  {name: 'Justin Davis', jp_names: ['ジャスティン・デイビス', 'JUSTIN DAVIS'], country: 'USA'},
  {name: 'K.UNO', jp_names: ['ケイウノ', 'K.UNO', 'KUNO'], country: 'Japan'},
  {name: 'Kalevala Koru', jp_names: ['カレワラコル', 'KALEVALA KORU', 'KALEVALA JEWELRY'], country: 'Finland'},
  {name: 'Kultaseppä Salovaara', jp_names: ['クルタセッパサロヴァーラ', 'KULTASEPPA SALOVAARA', 'SALOVAARA'], country: 'Finland'},
  {name: 'KUMIKYOKU', jp_names: ['組曲', 'クミキョク', 'KUMIKYOKU'], country: 'Japan'},
  {name: 'Lapponia', jp_names: ['ラッポニア', 'LAPPONIA'], country: 'Finland'},
  {name: 'Louis Faglin', jp_names: ['ルイファグラン', 'LOUIS FAGLIN'], country: 'France'},
  {name: 'Max Mara', jp_names: ['マックスマーラ', 'MAX MARA'], country: 'Italy'},
  {name: 'Mikimoto', jp_names: ['ミキモト', 'MIKIMOTO'], country: 'Japan'},
  {name: 'Monet', jp_names: ['モネ', 'MONET'], country: 'USA'},
  {name: 'Monica Vinader', jp_names: ['モニカヴィナダー', 'MONICA VINADER'], country: 'UK'},
  {name: 'N.E. From', jp_names: ['エヌイーフロム', 'N.E. FROM', 'NE FROM', 'N.E.FROM'], country: 'Denmark'},
  {name: 'Nina Ricci', jp_names: ['ニナリッチ', 'NINA RICCI'], country: 'France'},
  {name: 'Pandora', jp_names: ['パンドラ', 'PANDORA'], country: 'Denmark'},
  {name: 'Paul Smith', jp_names: ['ポールスミス', 'ポール・スミス', 'PAUL SMITH'], country: 'UK', category: ['Watches']},
  {name: 'STAR JEWELRY', jp_names: ['スタージュエリー', 'STAR JEWELRY'], country: 'Japan'},
  {name: 'Swarovski', jp_names: ['スワロフスキー', 'SWAROVSKI'], country: 'Austria', is_material: true},
  {name: 'Tasaki', jp_names: ['タサキ', 'TASAKI'], country: 'Japan'},
  {name: 'Tateossian', jp_names: ['タテオシアン', 'TATEOSSIAN'], country: 'UK'},
  {name: 'Thomas Sabo', jp_names: ['トーマスサボ', 'THOMAS SABO'], country: 'Germany'},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY & CO.', 'TIFFANY', 'TIFFANY&CO', 'Tiffany'], country: 'USA'},
  {name: 'Van Cleef & Arpels', jp_names: ['ヴァン クリーフ＆アーペル', 'VAN CLEEF & ARPELS', 'VAN CLEEF', 'VANCLEEF&ARPELS'], country: 'France'},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアン・ウエストウッド', 'VIVIENNE WESTWOOD'], country: 'UK'},
  {name: 'Trollbeads', jp_names: ['トロールビーズ', 'TROLLBEADS'], country: 'Denmark'},
  {name: 'Yves Saint Laurent', jp_names: ['イヴサンローラン', 'イブサンローラン', 'YVES SAINT LAURENT', 'YSL'], country: 'France'},
  {name: 'Maison Margiela', jp_names: ['メゾンマルジェラ', 'マルジェラ', 'MAISON MARGIELA', 'MARGIELA', 'メゾン マルジェラ'], country: 'Italy'},
  {name: 'CINER', jp_names: ['シネール', 'CINER'], country: 'USA'},

  // === Bags ===
  {name: 'Anello', jp_names: ['アネロ', 'ANELLO'], country: 'Japan'},
  {name: 'aniary', jp_names: ['アニアリ', 'ANIARY'], country: 'Japan'},
  {name: 'BRIEFING', jp_names: ['ブリーフィング', 'BRIEFING'], country: 'Japan'},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France'},
  {name: 'Bottega Veneta', jp_names: ['ボッテガ・ヴェネタ', 'BOTTEGA VENETA'], country: 'Italy'},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'UK'},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France'},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France'},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'USA'},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France'},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy'},
  {name: 'Filson', jp_names: ['フィルソン', 'FILSON'], country: 'USA'},
  {name: 'Freitag', jp_names: ['フライターグ', 'FREITAG'], country: 'Switzerland'},
  {name: 'Goyard', jp_names: ['ゴヤール', 'GOYARD'], country: 'France'},
  {name: 'HERZ', jp_names: ['ヘルツ', 'HERZ'], country: 'Japan'},
  {name: 'Hunting World', jp_names: ['ハンティングワールド', 'HUNTING WORLD'], country: 'USA'},
  {name: '印伝屋', jp_names: ['印伝屋', 'インデンヤ', 'INDEN-YA', 'INDENYA'], country: 'Japan'},
  {name: 'Loewe', jp_names: ['ロエベ', 'LOEWE'], country: 'Spain'},
  {name: 'Louis Vuitton', jp_names: ['ルイ・ヴィトン', 'LOUIS VUITTON'], country: 'France'},
  {name: 'Manhattan Portage', jp_names: ['マンハッタンポーテージ', 'MANHATTAN PORTAGE'], country: 'USA'},
  {name: '万双', jp_names: ['万双', 'マンソウ', 'MANSOU'], country: 'Japan'},
  {name: 'Orobianco', jp_names: ['オロビアンコ', 'OROBIANCO'], country: 'Italy'},
  {name: 'Porter', jp_names: ['ポーター', 'PORTER'], country: 'Japan'},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy'},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT'], country: 'France'},
  {name: '土屋鞄製造所', jp_names: ['土屋鞄', 'ツチヤカバン', 'TSUCHIYA KABAN'], country: 'Japan'},

  // === Clothing & Fashion ===
  {name: '45rpm', jp_names: ['45アールピーエム', 'フォーティーファイブアールピーエム', '45RPM', '45R'], country: 'Japan'},
  {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE', 'アベイシングエイプ'], country: 'Japan'},
  {name: 'Agnes b.', jp_names: ['アニエスベー', 'AGNES B'], country: 'France'},
  {name: 'Alden', jp_names: ['オールデン', 'ALDEN'], country: 'USA'},
  {name: 'Alexander Wang', jp_names: ['アレキサンダーワン', 'ALEXANDER WANG'], country: 'USA'},
  {name: 'Anna Sui', jp_names: ['アナスイ', 'ANNA SUI'], country: 'USA'},
  {name: 'Aniplex', jp_names: ['アニプレックス', 'ANIPLEX'], country: 'Japan'},
  {name: 'BAPE', jp_names: ['ア・ベイシング・エイプ', 'BAPE'], country: 'Japan'},
  {name: 'Bally', jp_names: ['バリー', 'BALLY'], country: 'Switzerland'},
  {name: 'Bang & Olufsen', jp_names: ['バング&オルフセン', 'BANG & OLUFSEN', 'B&O', 'BANG&OLUFSEN'], country: 'Denmark'},
  {name: 'Beams', jp_names: ['ビームス', 'BEAMS'], country: 'Japan'},
  {name: 'Bloody Mary', jp_names: ['ブラッディマリー', 'BLOODY MARY'], country: 'Japan'},
  {name: 'Brooks Brothers', jp_names: ['ブルックスブラザーズ', 'BROOKS BROTHERS'], country: 'USA'},
  {name: 'Canada Goose', jp_names: ['カナダグース', 'CANADA GOOSE'], country: 'Canada'},
  {name: 'Carhartt', jp_names: ['カーハート', 'CARHARTT'], country: 'USA'},
  {name: 'Champion', jp_names: ['チャンピオン', 'CHAMPION'], country: 'USA'},
  {name: 'Chloe', jp_names: ['クロエ', 'CHLOE'], country: 'France'},
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS'], country: 'Japan'},
  {name: 'Comme des Garcons Play', jp_names: ['プレイ・コムデギャルソン', 'PLAY COMME DES GARCONS'], country: 'Japan'},
  {name: 'Diesel', jp_names: ['ディーゼル', 'DIESEL'], country: 'Italy'},
  {name: 'Dolce Gabbana', jp_names: ['ドルチェ&ガッバーナ', 'DOLCE GABBANA'], country: 'Italy'},
  {name: "Drake's", jp_names: ['ドレイクス', "DRAKE'S", 'DRAKES'], country: 'UK'},
  {name: 'Dunhill', jp_names: ['ダンヒル', 'DUNHILL'], country: 'UK'},
  {name: 'Emilio Pucci', jp_names: ['エミリオプッチ', 'EMILIO PUCCI', 'PUCCI'], country: 'Italy'},
  {name: 'Evisu', jp_names: ['エヴィス', 'EVISU'], country: 'Japan'},
  {name: 'Faliero Sarti', jp_names: ['ファリエロサルティ', 'FALIERO SARTI'], country: 'Italy'},
  {name: 'Feiler', jp_names: ['フェイラー', 'FEILER'], country: 'Germany'},
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
  {name: 'Givenchy', jp_names: ['ジバンシィ', 'GIVENCHY'], country: 'France'},
  {name: 'Goldwin', jp_names: ['ゴールドウイン', 'GOLDWIN'], country: 'Japan'},
  {name: 'Goro\'s', jp_names: ['ゴローズ', 'GORO\'S'], country: 'Japan'},
  {name: 'Graff', jp_names: ['グラフ', 'GRAFF'], country: 'UK'},
  {name: 'Greco', jp_names: ['グレコ', 'GRECO'], country: 'Japan'},
  {name: 'Gregory', jp_names: ['グレゴリー', 'GREGORY'], country: 'USA'},
  {name: 'Hanae Mori', jp_names: ['ハナエモリ', '森英恵', 'HANAE MORI'], country: 'Japan'},
  {name: 'Head', jp_names: ['ヘッド', 'HEAD'], country: 'Austria'},
  {name: 'Herend', jp_names: ['ヘレンド', 'HEREND'], country: 'Hungary'},
  {name: 'Human Made', jp_names: ['ヒューマンメイド', 'HUMAN MADE'], country: 'Japan'},
  {name: 'Hysteric Glamour', jp_names: ['ヒステリックグラマー', 'HYSTERIC GLAMOUR'], country: 'Japan'},
  {name: 'Ichiban Kuji', jp_names: ['一番くじ', 'ICHIBAN KUJI'], country: 'Japan'},
  {name: 'Imaemon', jp_names: ['今右衛門', 'IMAEMON'], country: 'Japan'},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE'], country: 'Japan', category: ['Watches']},
  {name: 'Jimmy Choo', jp_names: ['ジミーチュウ', 'JIMMY CHOO'], country: 'UK'},
  {name: 'Johnstons of Elgin', jp_names: ['ジョンストンズ', 'JOHNSTONS OF ELGIN', 'JOHNSTONS'], country: 'UK'},
  {name: 'Kadokawa', jp_names: ['KADOKAWA'], country: 'Japan'},
  {name: 'Kapital', jp_names: ['キャピタル', 'KAPITAL'], country: 'Japan'},
  {name: 'Kate Spade', jp_names: ['ケイト・スペード', 'KATE SPADE'], country: 'USA'},
  {name: 'Kenwood', jp_names: ['ケンウッド', 'KENWOOD'], country: 'Japan'},
  {name: 'Kenzo', jp_names: ['ケンゾー', 'KENZO'], country: 'France'},
  {name: 'Kiyomizu', jp_names: ['清水焼', 'KIYOMIZU'], country: 'Japan'},
  {name: 'Konica', jp_names: ['コニカ', 'KONICA'], country: 'Japan'},
  {name: 'Koransha', jp_names: ['香蘭社', 'KORANSHA'], country: 'Japan'},
  {name: 'Kyosho', jp_names: ['京商', 'KYOSHO'], country: 'Japan'},
  {name: 'L.L.Bean', jp_names: ['エルエルビーン', 'L.L.BEAN', 'LLBEAN', 'LL BEAN'], country: 'USA'},
  {name: 'Lacoste', jp_names: ['ラコステ', 'LACOSTE'], country: 'France'},
  {name: 'Lalique', jp_names: ['ラリック', 'LALIQUE'], country: 'France'},
  {name: 'Levi\'s', jp_names: ['リーバイス', 'LEVI\'S'], country: 'USA'},
  {name: 'Lladro', jp_names: ['リヤドロ', 'LLADRO'], country: 'Spain'},
  {name: 'Lone Ones', jp_names: ['ロンワンズ', 'LONE ONES'], country: 'USA'},
  {name: 'Longchamp', jp_names: ['ロンシャン', 'LONGCHAMP'], country: 'France'},
  {name: 'Loree Rodkin', jp_names: ['ローリーロドキン', 'LOREE RODKIN'], country: 'USA'},
  {name: 'Luigi Borrelli', jp_names: ['ルイジボレッリ', 'ルイジ・ボレッリ', 'LUIGI BORRELLI'], country: 'Italy'},
  {name: 'Luxman', jp_names: ['ラックスマン', 'LUXMAN'], country: 'Japan'},
  {name: 'MCM', jp_names: ['エムシーエム', 'MCM'], country: 'Germany'},
  {name: 'manipuri', jp_names: ['マニプリ', 'MANIPURI'], country: 'Japan'},
  {name: 'Marc Jacobs', jp_names: ['マーク・ジェイコブス', 'MARC JACOBS'], country: 'USA'},
  {name: 'Marimekko', jp_names: ['マリメッコ', 'MARIMEKKO'], country: 'Finland'},
  {name: 'Martin', jp_names: ['マーティン', 'MARTIN'], country: 'USA'},
  {name: 'Mastermind Japan', jp_names: ['マスターマインド', 'MASTERMIND JAPAN'], country: 'Japan'},
  {name: 'Meissen', jp_names: ['マイセン', 'MEISSEN'], country: 'Germany'},
  {name: 'Michael Kors', jp_names: ['マイケル・コース', 'MICHAEL KORS'], country: 'USA'},
  {name: 'Miu Miu', jp_names: ['ミュウミュウ', 'MIU MIU', 'MIUMIU', 'MIU'], country: 'Italy'},
  {name: 'Moncler', jp_names: ['モンクレール', 'MONCLER'], country: 'France'},
  {name: 'Montbell', jp_names: ['モンベル', 'MONTBELL'], country: 'Japan'},
  {name: 'Montblanc', jp_names: ['モンブラン', 'MONTBLANC'], country: 'Germany'},
  {name: 'Mido', jp_names: ['ミドー', 'MIDO'], country: 'Switzerland', category: ['Watches']},
  {name: 'Moog', jp_names: ['モーグ', 'MOOG'], country: 'USA'},
  {name: 'Morris', jp_names: ['モーリス', 'MORRIS'], country: 'Japan'},
  {name: 'Nakamichi', jp_names: ['ナカミチ', 'NAKAMICHI'], country: 'Japan'},
  {name: 'Narumi', jp_names: ['ナルミ', 'NARUMI'], country: 'Japan'},
  {name: 'Neighborhood', jp_names: ['ネイバーフッド', 'NEIGHBORHOOD'], country: 'Japan'},
  {name: 'Nittaku', jp_names: ['ニッタク', 'NITTAKU'], country: 'Japan'},
  {name: 'Niwaka', jp_names: ['俄', 'NIWAKA'], country: 'Japan'},
  {name: 'Nojess', jp_names: ['ノジェス', 'NOJESS'], country: 'Japan'},
  {name: 'North Face', jp_names: ['ノースフェイス', 'NORTH FACE'], country: 'USA'},
  {name: 'Number (N)ine', jp_names: ['ナンバーナイン', 'NUMBER (N)INE'], country: 'Japan'},
  {name: 'Off-White', jp_names: ['オフホワイト', 'OFF-WHITE', 'OFFWHITE'], country: 'Italy'},
  {name: 'Okura Art China', jp_names: ['大倉陶園', 'OKURA ART CHINA'], country: 'Japan'},
  {name: 'Patagonia', jp_names: ['パタゴニア', 'PATAGONIA'], country: 'USA'},
  {name: 'Paul & Joe', jp_names: ['ポール&ジョー', 'PAUL & JOE', 'PAUL&JOE'], country: 'France'},
  {name: 'Playmobil', jp_names: ['プレイモービル', 'PLAYMOBIL'], country: 'Germany'},
  {name: 'Pomellato', jp_names: ['ポメラート', 'POMELLATO'], country: 'Italy'},
  {name: 'Ponte Vecchio', jp_names: ['ポンテヴェキオ', 'PONTE VECCHIO'], country: 'Japan'},
  {name: 'Prince', jp_names: ['プリンス', 'PRINCE'], country: 'USA'},
  {name: 'Ralph Lauren', jp_names: ['ラルフローレン', 'RALPH LAUREN'], country: 'USA'},
  {name: 'Ray-Ban', jp_names: ['レイバン', 'RAY-BAN'], country: 'USA'},
  {name: 'Request', jp_names: ['リクエスト', 'REQUEST'], country: 'Japan'},
  {name: 'Rimowa', jp_names: ['リモワ', 'RIMOWA'], country: 'Germany'},
  {name: 'SABIAN', jp_names: ['セイビアン', 'SABIAN'], country: 'Canada'},
  {name: 'Salvatore Ferragamo', jp_names: ['サルヴァトーレ フェラガモ', 'フェラガモ', 'SALVATORE FERRAGAMO', 'Ferragamo', 'FERRAGAMO'], country: 'Italy'},
  {name: 'Salvatore Marra', jp_names: ['サルバトーレマーラ', 'SALVATORE MARRA', 'サルバトーレ マーラ'], country: 'Italy'},
  {name: 'Samantha Tiara', jp_names: ['サマンサティアラ', 'SAMANTHA TIARA', 'サマンサ ティアラ'], country: 'Japan'},
  {name: 'Saint Laurent Paris', jp_names: ['サンローランパリ', 'SAINT LAURENT PARIS'], country: 'France'},
  {name: 'Salsa', jp_names: ['サルサ', 'SALSA'], country: 'USA'},
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
  {name: 'Technos', jp_names: ['テクノス', 'TECHNOS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Timberland', jp_names: ['ティンバーランド', 'TIMBERLAND'], country: 'USA'},
  {name: 'Tobe', jp_names: ['砥部焼', 'TOBE'], country: 'Japan'},
  {name: 'Tommy Hilfiger', jp_names: ['トミーヒルフィガー', 'TOMMY HILFIGER', 'トミー ヒルフィガー'], country: 'USA'},
  {name: 'Tory Burch', jp_names: ['トリーバーチ', 'TORY BURCH'], country: 'USA'},
  {name: 'Trek', jp_names: ['トレック', 'TREK'], country: 'USA'},
  {name: 'Tumi', jp_names: ['トゥミ', 'TUMI'], country: 'USA'},
  {name: 'Undercover', jp_names: ['アンダーカバー', 'UNDERCOVER'], country: 'Japan'},
  {name: 'United Arrows', jp_names: ['ユナイテッドアローズ', 'UNITED ARROWS'], country: 'Japan'},
  {name: 'Valentino', jp_names: ['ヴァレンティノ', 'VALENTINO'], country: 'Italy'},
  {name: 'Vendome Aoyama', jp_names: ['ヴァンドーム青山', 'VENDOME AOYAMA'], country: 'Japan'},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'VERSACE'], country: 'Italy', category: ['Watches']},
  {name: 'Victas', jp_names: ['ヴィクタス', 'VICTAS'], country: 'Japan'},
  {name: 'Visvim', jp_names: ['ビズビム', 'VISVIM'], country: 'Japan'},
  {name: 'Voigtlander', jp_names: ['フォクトレンダー', 'VOIGTLANDER'], country: 'Germany'},
  {name: 'WTAPS', jp_names: ['ダブルタップス', 'WTAPS'], country: 'Japan'},
  {name: 'Wedgwood', jp_names: ['ウェッジウッド', 'WEDGWOOD'], country: 'UK'},
  {name: 'Wilson', jp_names: ['ウィルソン', 'WILSON'], country: 'USA'},
  {name: 'Yashica', jp_names: ['ヤシカ', 'YASHICA'], country: 'Japan'},
  {name: 'Yohji Yamamoto', jp_names: ['ヨウジヤマモト', 'YOHJI YAMAMOTO'], country: 'Japan'},
  {name: 'Yoshida', jp_names: ['吉田カバン', 'YOSHIDA'], country: 'Japan'},
  {name: 'Yumi Katsura', jp_names: ['桂由美', 'ユミカツラ', 'YUMI KATSURA'], country: 'Japan'},
  {name: 'Zoom', jp_names: ['ズーム', 'ZOOM'], country: 'Japan'},
  {name: 'master-piece', jp_names: ['マスターピース', 'MASTER-PIECE', 'MASTERPIECE'], country: 'Japan'},

  // === Sunglasses ===
  {name: 'Barton Perreira', jp_names: ['バートンペレイラ', 'BARTON PERREIRA'], country: 'USA', category: ['Sunglasses']},
  {name: 'Bottega Veneta', jp_names: ['ボッテガヴェネタ', 'BOTTEGA VENETA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Bulgari', jp_names: ['ブルガリ', 'BVLGARI', 'BULGARI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'UK', category: ['Sunglasses']},
  {name: 'Carrera', jp_names: ['カレラ', 'CARRERA'], country: 'Austria', category: ['Sunglasses']},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France', category: ['Sunglasses']},
  {name: 'Cazal', jp_names: ['カザール', 'CAZAL'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France', category: ['Sunglasses']},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France', category: ['Sunglasses']},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'USA', category: ['Sunglasses']},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'USA', category: ['Sunglasses']},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France', category: ['Sunglasses']},
  {name: 'Dolce & Gabbana', jp_names: ['ドルチェ&ガッバーナ', 'DOLCE & GABBANA', 'D&G', 'DOLCE&GABBANA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Emporio Armani', jp_names: ['エンポリオアルマーニ', 'EMPORIO ARMANI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Gentle Monster', jp_names: ['ジェントルモンスター', 'GENTLE MONSTER'], country: 'South Korea', category: ['Sunglasses']},
  {name: 'Giorgio Armani', jp_names: ['ジョルジオアルマーニ', 'GIORGIO ARMANI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Gregory Peck', jp_names: ['グレゴリーペック', 'GREGORY PECK'], country: 'USA', parent_brand: 'Oliver Peoples', category: ['Sunglasses']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'ic! berlin', jp_names: ['アイシーベルリン', 'IC! BERLIN', 'IC BERLIN'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Jacques Marie Mage', jp_names: ['ジャックマリーマージュ', 'JACQUES MARIE MAGE'], country: 'USA', category: ['Sunglasses']},
  {name: 'Maui Jim', jp_names: ['マウイジム', 'MAUI JIM'], country: 'USA', category: ['Sunglasses']},
  {name: 'Michael Kors', jp_names: ['マイケルコース', 'MICHAEL KORS'], country: 'USA', category: ['Sunglasses']},
  {name: 'Moscot', jp_names: ['モスコット', 'MOSCOT'], country: 'USA', category: ['Sunglasses']},
  {name: 'Mykita', jp_names: ['マイキータ', 'MYKITA'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Oakley', jp_names: ['オークリー', 'OAKLEY'], country: 'USA', category: ['Sunglasses']},
  {name: 'Oliver Peoples', jp_names: ['オリバーピープルズ', 'OLIVER PEOPLES'], country: 'USA', category: ['Sunglasses']},
  {name: 'Persol', jp_names: ['ペルソール', 'PERSOL'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Police', jp_names: ['ポリス', 'POLICE'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Ray-Ban', jp_names: ['レイバン', 'RAY-BAN', 'RAYBAN', 'RAY BAN'], country: 'USA', category: ['Sunglasses']},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT', 'YSL'], country: 'France', category: ['Sunglasses']},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY & CO.', 'TIFFANY'], country: 'USA', category: ['Sunglasses']},
  {name: 'Tom Ford', jp_names: ['トムフォード', 'TOM FORD'], country: 'Italy', category: ['Sunglasses', 'Watches']},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'VERSACE'], country: 'Italy', category: ['Sunglasses']},
  {name: 'TITMUS', jp_names: ['ティトマス', 'TITMUS'], country: 'USA', category: ['Sunglasses']},
  {name: 'A.D.S.R.', jp_names: ['ADSR', 'A.D.S.R.', 'A.D.S.R', 'エーディーエスアール'], country: 'Japan', category: ['Sunglasses']},
  {name: 'TAKAHIROMIYASHITA TheSoloist.', jp_names: ['タカヒロミヤシタ', 'TAKAHIROMIYASHITA', 'ザソロイスト', 'THE SOLOIST', 'THESOLOIST'], country: 'Japan', category: ['Sunglasses']},
  {name: 'N.S.H', jp_names: ['N.S.H', 'NSH', 'エヌエスエイチ'], country: 'Japan', category: ['Sunglasses']},
  {name: 'Jean Paul Gaultier', jp_names: ['ジャンポールゴルチエ', 'ゴルチエ', 'JEAN PAUL GAULTIER', 'JPG'], country: 'France', category: ['Sunglasses']},
  {name: 'Oliver Goldsmith', jp_names: ['オリバーゴールドスミス', 'OLIVER GOLDSMITH'], country: 'United Kingdom', category: ['Sunglasses']},
  {name: 'EYEVAN 7285', jp_names: ['アイヴァン', 'EYEVAN', 'EYEVAN7285', 'EYEVAN 7285'], country: 'Japan', category: ['Sunglasses']},
  {name: '999.9', jp_names: ['フォーナインズ', '999.9', 'FOUR NINES', 'FOURNINES'], country: 'Japan', category: ['Sunglasses']},
  {name: 'MASUNAGA', jp_names: ['増永', 'マスナガ', 'MASUNAGA', '増永眼鏡'], country: 'Japan', category: ['Sunglasses']},
  {name: 'ayame', jp_names: ['アヤメ', 'AYAME'], country: 'Japan', category: ['Sunglasses']},
  {name: 'Boston Club', jp_names: ['ボストンクラブ', 'BOSTON CLUB'], country: 'Japan', category: ['Sunglasses']},
  {name: 'FACTORY900', jp_names: ['ファクトリー900', 'FACTORY900', 'FACTORY 900'], country: 'Japan', category: ['Sunglasses']},
  {name: 'TALEX', jp_names: ['タレックス', 'TALEX'], country: 'Japan', category: ['Sunglasses']},
  {name: 'Eyevol', jp_names: ['アイヴォル', 'EYEVOL'], country: 'Japan', category: ['Sunglasses']},

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
  {name: 'Bronica', jp_names: ['ブロニカ', 'BRONICA', 'ゼンザブロニカ', 'ZENZA BRONICA'], country: 'Japan'},
  {name: 'Canon', jp_names: ['キヤノン', 'キャノン', 'CANON'], country: 'Japan'},
  {name: 'Casio', jp_names: ['カシオ', 'CASIO'], country: 'Japan'},
  {name: 'Chinon', jp_names: ['チノン', 'CHINON'], country: 'Japan'},
  {name: 'Contax', jp_names: ['コンタックス', 'CONTAX'], country: 'Germany'},
  {name: 'Cosina', jp_names: ['コシナ', 'COSINA'], country: 'Japan'},
  {name: 'DJI', jp_names: ['DJI', 'ディージェイアイ'], country: 'China'},
  {name: 'Fujifilm', jp_names: ['富士フイルム', 'フジフイルム', 'FUJIFILM', 'FUJI'], country: 'Japan'},
  {name: 'GoPro', jp_names: ['ゴープロ', 'GOPRO'], country: 'USA'},
  {name: 'Graflex', jp_names: ['グラフレックス', 'GRAFLEX'], country: 'USA'},
  {name: 'Hasselblad', jp_names: ['ハッセルブラッド', 'HASSELBLAD'], country: 'Sweden'},
  {name: 'Kodak', jp_names: ['コダック', 'KODAK'], country: 'USA'},
  {name: 'Konica', jp_names: ['コニカ', 'KONICA'], country: 'Japan'},
  {name: 'Konica Minolta', jp_names: ['コニカミノルタ', 'KONICA MINOLTA'], country: 'Japan'},
  {name: 'Leica', jp_names: ['ライカ', 'LEICA'], country: 'Germany'},
  {name: 'LOMO', jp_names: ['ロモ', 'LOMO', 'LOMOGRAPHY'], country: 'Austria'},
  {name: 'Mamiya', jp_names: ['マミヤ', 'MAMIYA'], country: 'Japan'},
  {name: 'Minolta', jp_names: ['ミノルタ', 'MINOLTA'], country: 'Japan'},
  {name: 'Nikon', jp_names: ['ニコン', 'NIKON'], country: 'Japan'},
  {name: 'Olympus', jp_names: ['オリンパス', 'OLYMPUS'], country: 'Japan'},
  {name: 'Panasonic', jp_names: ['パナソニック', 'PANASONIC', 'LUMIX', 'ルミックス'], country: 'Japan'},
  {name: 'Pentax', jp_names: ['ペンタックス', 'PENTAX'], country: 'Japan'},
  {name: 'Polaroid', jp_names: ['ポラロイド', 'POLAROID'], country: 'USA'},
  {name: 'Ricoh', jp_names: ['リコー', 'RICOH'], country: 'Japan', category: ['Watches']},
  {name: 'Rollei', jp_names: ['ローライ', 'ROLLEI', 'ROLLEIFLEX', 'ローライフレックス'], country: 'Germany'},
  {name: 'Sigma', jp_names: ['シグマ', 'SIGMA'], country: 'Japan'},
  {name: 'Tamron', jp_names: ['タムロン', 'TAMRON'], country: 'Japan'},
  {name: 'Tokina', jp_names: ['トキナー', 'TOKINA'], country: 'Japan'},
  {name: 'Topcon', jp_names: ['トプコン', 'TOPCON'], country: 'Japan'},
  {name: 'Voigtlander', jp_names: ['フォクトレンダー', 'VOIGTLANDER', 'VOIGTLÄNDER'], country: 'Germany'},
  {name: 'Yashica', jp_names: ['ヤシカ', 'YASHICA'], country: 'Japan'},
  {name: 'Zeiss Ikon', jp_names: ['ツァイスイコン', 'ZEISS IKON', 'ツァイス'], country: 'Germany'},

  // === Camera Models (モデル辞書) ===
  // === Canon Film SLR ===
  {name: 'AE-1', jp_names: ['AE-1', 'AE1'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'AE-1 Program', jp_names: ['AE-1プログラム', 'AE-1 PROGRAM', 'AE1P'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'A-1', jp_names: ['A-1', 'A1'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'F-1', jp_names: ['F-1', 'F1'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'New F-1', jp_names: ['NEW F-1', 'ニューF-1', 'NEW F1'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'T50', jp_names: ['T50'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'T70', jp_names: ['T70'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'T90', jp_names: ['T90'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS-1', jp_names: ['EOS-1', 'EOS1'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS-1N', jp_names: ['EOS-1N', 'EOS1N'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS-1V', jp_names: ['EOS-1V', 'EOS1V'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 3', jp_names: ['EOS 3', 'EOS3'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 5 QD', jp_names: ['EOS 5 QD', 'EOS 5', 'EOS5'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 7', jp_names: ['EOS 7', 'EOS7'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS Kiss', jp_names: ['EOS KISS', 'EOSキッス'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'Canonet QL17', jp_names: ['CANONET QL17', 'キャノネット'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  // === Canon Digital SLR ===
  {name: 'EOS 5D', jp_names: ['EOS 5D', 'EOS5D'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 5D Mark II', jp_names: ['EOS 5D MARK II', 'EOS 5D2', '5D MARK 2'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 5D Mark III', jp_names: ['EOS 5D MARK III', 'EOS 5D3', '5D MARK 3'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 5D Mark IV', jp_names: ['EOS 5D MARK IV', 'EOS 5D4', '5D MARK 4'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 6D', jp_names: ['EOS 6D', 'EOS6D'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 6D Mark II', jp_names: ['EOS 6D MARK II', 'EOS 6D2'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 7D', jp_names: ['EOS 7D', 'EOS7D'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 7D Mark II', jp_names: ['EOS 7D MARK II', 'EOS 7D2'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 80D', jp_names: ['EOS 80D', 'EOS80D'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS 90D', jp_names: ['EOS 90D', 'EOS90D'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS Kiss X7', jp_names: ['EOS KISS X7', 'EOSキッスX7'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS Kiss X9i', jp_names: ['EOS KISS X9I', 'EOSキッスX9I'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  // === Canon Mirrorless ===
  {name: 'EOS R', jp_names: ['EOS R', 'EOSR'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R5', jp_names: ['EOS R5', 'EOSR5'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R6', jp_names: ['EOS R6', 'EOSR6'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R6 Mark II', jp_names: ['EOS R6 MARK II', 'EOS R6 II'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R7', jp_names: ['EOS R7', 'EOSR7'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R8', jp_names: ['EOS R8', 'EOSR8'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS R10', jp_names: ['EOS R10', 'EOSR10'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS RP', jp_names: ['EOS RP', 'EOSRP'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS M', jp_names: ['EOS M', 'EOSM'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS M5', jp_names: ['EOS M5', 'EOSM5'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'EOS M6', jp_names: ['EOS M6', 'EOSM6'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  // === Canon Compact ===
  {name: 'PowerShot G7 X', jp_names: ['POWERSHOT G7 X', 'G7X'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'PowerShot G9 X', jp_names: ['POWERSHOT G9 X', 'G9X'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'PowerShot S110', jp_names: ['POWERSHOT S110', 'S110'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},
  {name: 'PowerShot S120', jp_names: ['POWERSHOT S120', 'S120'], country: 'Japan', parent_brand: 'Canon', category: ['Cameras']},

  // === Nikon Film SLR ===
  {name: 'Nikon F', jp_names: ['NIKON F', 'ニコンF'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikon F2', jp_names: ['NIKON F2', 'ニコンF2'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikon F3', jp_names: ['NIKON F3', 'ニコンF3'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikon F4', jp_names: ['NIKON F4', 'ニコンF4'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikon F5', jp_names: ['NIKON F5', 'ニコンF5'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikon F6', jp_names: ['NIKON F6', 'ニコンF6'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FM', jp_names: ['FM', 'ニコンFM'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FM2', jp_names: ['FM2', 'ニコンFM2'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FM3A', jp_names: ['FM3A', 'ニコンFM3A'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FE', jp_names: ['FE', 'ニコンFE'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FE2', jp_names: ['FE2', 'ニコンFE2'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'FA', jp_names: ['FA', 'ニコンFA'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Nikomat FTN', jp_names: ['NIKOMAT FTN', 'ニコマート'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  // === Nikon Digital SLR ===
  {name: 'D850', jp_names: ['D850'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D810', jp_names: ['D810'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D800', jp_names: ['D800'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D750', jp_names: ['D750'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D780', jp_names: ['D780'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D700', jp_names: ['D700'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D610', jp_names: ['D610'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D500', jp_names: ['D500'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D300', jp_names: ['D300'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D7500', jp_names: ['D7500'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D5600', jp_names: ['D5600'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'D3500', jp_names: ['D3500'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  // === Nikon Mirrorless ===
  {name: 'Z5', jp_names: ['Z5', 'ニコンZ5'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z6', jp_names: ['Z6', 'ニコンZ6'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z6II', jp_names: ['Z6II', 'Z6 II', 'Z6 2'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z7', jp_names: ['Z7', 'ニコンZ7'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z7II', jp_names: ['Z7II', 'Z7 II', 'Z7 2'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z8', jp_names: ['Z8', 'ニコンZ8'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Z9', jp_names: ['Z9', 'ニコンZ9'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Zf', jp_names: ['ZF', 'ニコンZF'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Zfc', jp_names: ['ZFC', 'ニコンZFC'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},
  {name: 'Coolpix', jp_names: ['COOLPIX', 'クールピクス', 'W150', 'W300', 'W100', 'P950', 'P1000', 'B600', 'B500', 'A1000', 'A900'], country: 'Japan', parent_brand: 'Nikon', category: ['Cameras']},

  // === Sony Mirrorless ===
  {name: 'α7', jp_names: ['Α7', 'A7', 'ALPHA 7', 'ILCE-7'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7 II', jp_names: ['Α7 II', 'A7II', 'A7M2', 'ILCE-7M2'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7 III', jp_names: ['Α7 III', 'A7III', 'A7M3', 'ILCE-7M3'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7 IV', jp_names: ['Α7 IV', 'A7IV', 'A7M4', 'ILCE-7M4'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7R', jp_names: ['Α7R', 'A7R', 'ILCE-7R'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7R II', jp_names: ['Α7R II', 'A7RII', 'A7RM2'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7R III', jp_names: ['Α7R III', 'A7RIII', 'A7RM3'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7R IV', jp_names: ['Α7R IV', 'A7RIV', 'A7RM4'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7R V', jp_names: ['Α7R V', 'A7RV', 'A7RM5'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7S', jp_names: ['Α7S', 'A7S', 'ILCE-7S'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7S III', jp_names: ['Α7S III', 'A7SIII', 'A7SM3'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α7C', jp_names: ['Α7C', 'A7C', 'ILCE-7C'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α9', jp_names: ['Α9', 'A9', 'ILCE-9'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α9 II', jp_names: ['Α9 II', 'A9II'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α1', jp_names: ['Α1', 'A1', 'ILCE-1'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6000', jp_names: ['Α6000', 'A6000', 'ILCE-6000'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6100', jp_names: ['Α6100', 'A6100'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6300', jp_names: ['Α6300', 'A6300'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6400', jp_names: ['Α6400', 'A6400'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6500', jp_names: ['Α6500', 'A6500'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6600', jp_names: ['Α6600', 'A6600'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'α6700', jp_names: ['Α6700', 'A6700'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'NEX-5', jp_names: ['NEX-5', 'NEX5'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'NEX-7', jp_names: ['NEX-7', 'NEX7'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  // === Sony Compact ===
  {name: 'RX100', jp_names: ['RX100', 'DSC-RX100'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'RX100 III', jp_names: ['RX100 III', 'RX100M3', 'DSC-RX100M3'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'RX100 V', jp_names: ['RX100 V', 'RX100M5', 'DSC-RX100M5'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'RX100 VII', jp_names: ['RX100 VII', 'RX100M7', 'DSC-RX100M7'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'RX1', jp_names: ['RX1', 'DSC-RX1'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},
  {name: 'RX1R II', jp_names: ['RX1R II', 'RX1RM2', 'DSC-RX1RM2'], country: 'Japan', parent_brand: 'Sony', category: ['Cameras']},

  // === Fujifilm Mirrorless ===
  {name: 'X-T1', jp_names: ['X-T1', 'XT1'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-T2', jp_names: ['X-T2', 'XT2'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-T3', jp_names: ['X-T3', 'XT3'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-T4', jp_names: ['X-T4', 'XT4'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-T5', jp_names: ['X-T5', 'XT5'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-H1', jp_names: ['X-H1', 'XH1'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-H2', jp_names: ['X-H2', 'XH2'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-H2S', jp_names: ['X-H2S', 'XH2S'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-Pro1', jp_names: ['X-PRO1', 'XPRO1'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-Pro2', jp_names: ['X-PRO2', 'XPRO2'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-Pro3', jp_names: ['X-PRO3', 'XPRO3'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-E1', jp_names: ['X-E1', 'XE1'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-E4', jp_names: ['X-E4', 'XE4'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-S10', jp_names: ['X-S10', 'XS10'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X-S20', jp_names: ['X-S20', 'XS20'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X100V', jp_names: ['X100V'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'X100VI', jp_names: ['X100VI'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  // === Fujifilm Medium Format ===
  {name: 'GFX 50S', jp_names: ['GFX 50S', 'GFX50S'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'GFX 50R', jp_names: ['GFX 50R', 'GFX50R'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'GFX 100S', jp_names: ['GFX 100S', 'GFX100S'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  // === Fujifilm Film ===
  {name: 'Klasse', jp_names: ['KLASSE', 'クラッセ'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'Klasse W', jp_names: ['KLASSE W', 'クラッセW'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'GA645', jp_names: ['GA645'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},
  {name: 'GW690', jp_names: ['GW690'], country: 'Japan', parent_brand: 'Fujifilm', category: ['Cameras']},

  // === Olympus Film SLR ===
  {name: 'OM-1 (Film)', jp_names: ['OM-1', 'オリンパスOM-1'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-2', jp_names: ['OM-2', 'オリンパスOM-2'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-3', jp_names: ['OM-3', 'オリンパスOM-3'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-4', jp_names: ['OM-4', 'オリンパスOM-4'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-10', jp_names: ['OM-10', 'オリンパスOM-10'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'XA', jp_names: ['XA', 'オリンパスXA'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'XA2', jp_names: ['XA2', 'オリンパスXA2'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'Trip 35', jp_names: ['TRIP 35', 'トリップ35'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'Pen F (Film)', jp_names: ['PEN F', 'ペンF'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'μ[mju:]-II', jp_names: ['Μ-II', 'MJU-II', 'MJU II', 'ミューII', 'STYLUS EPIC'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  // === Olympus Mirrorless ===
  {name: 'OM-D E-M1', jp_names: ['OM-D E-M1', 'E-M1', 'EM1'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M1 Mark II', jp_names: ['E-M1 MARK II', 'E-M1 II', 'EM1 II'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M1 Mark III', jp_names: ['E-M1 MARK III', 'E-M1 III', 'EM1 III'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M5', jp_names: ['OM-D E-M5', 'E-M5', 'EM5'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M5 Mark II', jp_names: ['E-M5 MARK II', 'E-M5 II', 'EM5 II'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M5 Mark III', jp_names: ['E-M5 MARK III', 'E-M5 III', 'EM5 III'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'OM-D E-M10', jp_names: ['OM-D E-M10', 'E-M10', 'EM10'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'PEN E-P7', jp_names: ['PEN E-P7', 'E-P7', 'EP7'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},
  {name: 'PEN E-PL10', jp_names: ['PEN E-PL10', 'E-PL10', 'EPL10'], country: 'Japan', parent_brand: 'Olympus', category: ['Cameras']},

  // === Pentax Film SLR ===
  {name: 'K1000', jp_names: ['K1000'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'KX', jp_names: ['KX'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'MX', jp_names: ['MX'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'ME', jp_names: ['ME'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'ME Super', jp_names: ['ME SUPER', 'MEスーパー'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'LX', jp_names: ['LX'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'SP (Spotmatic)', jp_names: ['SP', 'SPOTMATIC', 'スポットマチック'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'Super A', jp_names: ['SUPER A', 'スーパーA'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'Pentax 67', jp_names: ['PENTAX 67', '67', 'ペンタックス67'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'Pentax 645', jp_names: ['PENTAX 645', '645'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  // === Pentax Digital ===
  {name: 'K-1', jp_names: ['K-1', 'K1'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'K-1 Mark II', jp_names: ['K-1 MARK II', 'K-1 II'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'K-3', jp_names: ['K-3', 'K3'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'K-3 Mark III', jp_names: ['K-3 MARK III', 'K-3 III'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'K-5 II', jp_names: ['K-5 II', 'K5 II'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'K-70', jp_names: ['K-70', 'K70'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: 'KP', jp_names: ['KP'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: '645D', jp_names: ['645D'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},
  {name: '645Z', jp_names: ['645Z'], country: 'Japan', parent_brand: 'Pentax', category: ['Cameras']},

  // === Minolta Film SLR ===
  {name: 'SRT101', jp_names: ['SRT101', 'SRT 101'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'SRT303', jp_names: ['SRT303', 'SRT 303'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'X-700', jp_names: ['X-700', 'X700'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'X-500', jp_names: ['X-500', 'X500'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'XD', jp_names: ['XD', 'XD-7', 'XD7'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'XE', jp_names: ['XE'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'XG-M', jp_names: ['XG-M', 'XGM'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'α-7', jp_names: ['Α-7', 'ALPHA-7', 'A-7'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'α-9', jp_names: ['Α-9', 'ALPHA-9', 'A-9'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},
  {name: 'α-7000', jp_names: ['Α-7000', 'ALPHA-7000', 'A-7000'], country: 'Japan', parent_brand: 'Minolta', category: ['Cameras']},

  // === Leica Rangefinder & SLR ===
  {name: 'M3', jp_names: ['M3', 'ライカM3'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M4', jp_names: ['M4', 'ライカM4'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M4-P', jp_names: ['M4-P', 'M4P'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M5', jp_names: ['M5', 'ライカM5'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M6', jp_names: ['M6', 'ライカM6'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M6 TTL', jp_names: ['M6 TTL', 'M6TTL'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M7', jp_names: ['M7', 'ライカM7'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'MP', jp_names: ['MP', 'ライカMP'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M-A', jp_names: ['M-A', 'MA'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'CL (Film)', jp_names: ['CL', 'ライカCL'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  // === Leica Digital ===
  {name: 'M8', jp_names: ['M8', 'ライカM8'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M9', jp_names: ['M9', 'ライカM9'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M10', jp_names: ['M10', 'ライカM10'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M10-P', jp_names: ['M10-P', 'M10P'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M10-R', jp_names: ['M10-R', 'M10R'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'M11', jp_names: ['M11', 'ライカM11'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'Q', jp_names: ['Q', 'ライカQ', 'LEICA Q'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'Q2', jp_names: ['Q2', 'ライカQ2'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'Q3', jp_names: ['Q3', 'ライカQ3'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},
  {name: 'SL2', jp_names: ['SL2', 'ライカSL2'], country: 'Germany', parent_brand: 'Leica', category: ['Cameras']},

  // === Contax ===
  {name: 'RTS', jp_names: ['RTS', 'コンタックスRTS'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'RTS II', jp_names: ['RTS II', 'RTS2'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'RTS III', jp_names: ['RTS III', 'RTS3'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'Aria', jp_names: ['ARIA', 'アリア'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: '167MT', jp_names: ['167MT'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'S2', jp_names: ['S2', 'コンタックスS2'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'G1', jp_names: ['G1', 'コンタックスG1'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'G2', jp_names: ['G2', 'コンタックスG2'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'T2', jp_names: ['T2', 'コンタックスT2'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'T3', jp_names: ['T3', 'コンタックスT3'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'TVS', jp_names: ['TVS', 'コンタックスTVS'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'N1', jp_names: ['N1', 'コンタックスN1'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'NX', jp_names: ['NX', 'コンタックスNX'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},
  {name: 'Contax 645', jp_names: ['CONTAX 645', 'コンタックス645'], country: 'Japan', parent_brand: 'Contax', category: ['Cameras']},

  // === Mamiya ===
  {name: 'RB67', jp_names: ['RB67', 'マミヤRB67'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'RB67 Pro S', jp_names: ['RB67 PRO S', 'RB67プロS'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'RB67 Pro SD', jp_names: ['RB67 PRO SD', 'RB67プロSD'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'RZ67', jp_names: ['RZ67', 'マミヤRZ67'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'RZ67 Pro II', jp_names: ['RZ67 PRO II', 'RZ67プロII'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'M645', jp_names: ['M645'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: '645 Pro', jp_names: ['645 PRO', 'マミヤ645プロ'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: '645 Pro TL', jp_names: ['645 PRO TL'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: '645 Super', jp_names: ['645 SUPER'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'Mamiya 7', jp_names: ['MAMIYA 7', 'マミヤ7'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'Mamiya 7 II', jp_names: ['MAMIYA 7 II', 'マミヤ7 II'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'C330', jp_names: ['C330', 'マミヤC330'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'C220', jp_names: ['C220', 'マミヤC220'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},
  {name: 'Mamiya 6', jp_names: ['MAMIYA 6', 'マミヤ6'], country: 'Japan', parent_brand: 'Mamiya', category: ['Cameras']},

  // === Hasselblad ===
  {name: '500C', jp_names: ['500C', 'ハッセル500C'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: '500C/M', jp_names: ['500C/M', '500CM', 'ハッセル500CM'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: '501C', jp_names: ['501C'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: '501CM', jp_names: ['501CM'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: '503CW', jp_names: ['503CW', 'ハッセル503CW'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: 'SWC', jp_names: ['SWC', 'ハッセルSWC'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: 'X1D', jp_names: ['X1D', 'X1D-50C'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: 'X1D II', jp_names: ['X1D II', 'X1D II 50C'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},
  {name: 'X2D', jp_names: ['X2D', 'X2D 100C'], country: 'Sweden', parent_brand: 'Hasselblad', category: ['Cameras']},

  // === Bronica ===
  {name: 'SQ-A', jp_names: ['SQ-A', 'SQA', 'ブロニカSQA'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'SQ-Ai', jp_names: ['SQ-AI', 'SQAI', 'ブロニカSQAI'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'ETRS', jp_names: ['ETRS', 'ブロニカETRS'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'ETRSi', jp_names: ['ETRSI', 'ブロニカETRSI'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'GS-1', jp_names: ['GS-1', 'GS1', 'ブロニカGS1'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'S2', jp_names: ['S2', 'ブロニカS2'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},
  {name: 'EC', jp_names: ['EC', 'ブロニカEC'], country: 'Japan', parent_brand: 'Bronica', category: ['Cameras']},

  // === Ricoh ===
  {name: 'GR III', jp_names: ['GR III', 'GR3', 'GRIII'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR IIIx', jp_names: ['GR IIIX', 'GR3X', 'GRIIIX'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR II', jp_names: ['GR II', 'GR2', 'GRII'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR (Digital)', jp_names: ['GR', 'リコーGR'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR1', jp_names: ['GR1', 'リコーGR1'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR1s', jp_names: ['GR1S'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR1v', jp_names: ['GR1V'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},
  {name: 'GR21', jp_names: ['GR21'], country: 'Japan', parent_brand: 'Ricoh', category: ['Cameras']},

  // === Yashica ===
  {name: 'Electro 35', jp_names: ['ELECTRO 35', 'エレクトロ35'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'Electro 35 GT', jp_names: ['ELECTRO 35 GT', 'エレクトロ35GT'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'Electro 35 GSN', jp_names: ['ELECTRO 35 GSN', 'エレクトロ35GSN'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'Mat 124G', jp_names: ['MAT 124G', 'MAT124G', 'ヤシカマット124G'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'T2 (Yashica)', jp_names: ['YASHICA T2', 'ヤシカT2'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'T3 (Yashica)', jp_names: ['YASHICA T3', 'ヤシカT3'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'T4 (T5)', jp_names: ['YASHICA T4', 'YASHICA T5', 'T4 SUPER', 'T5', 'ヤシカT4'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},
  {name: 'FX-3 Super 2000', jp_names: ['FX-3', 'FX-3 SUPER 2000', 'FX3'], country: 'Japan', parent_brand: 'Yashica', category: ['Cameras']},

  // === Rollei ===
  {name: 'Rollei 35', jp_names: ['ROLLEI 35', 'ローライ35'], country: 'Germany', parent_brand: 'Rollei', category: ['Cameras']},
  {name: 'Rollei 35S', jp_names: ['ROLLEI 35S', 'ローライ35S'], country: 'Germany', parent_brand: 'Rollei', category: ['Cameras']},
  {name: 'Rolleiflex 2.8F', jp_names: ['ROLLEIFLEX 2.8F', 'ローライフレックス2.8F'], country: 'Germany', parent_brand: 'Rollei', category: ['Cameras']},
  {name: 'Rolleiflex 3.5F', jp_names: ['ROLLEIFLEX 3.5F', 'ローライフレックス3.5F'], country: 'Germany', parent_brand: 'Rollei', category: ['Cameras']},
  {name: 'Rolleicord', jp_names: ['ROLLEICORD', 'ローライコード'], country: 'Germany', parent_brand: 'Rollei', category: ['Cameras']},

  // === Voigtlander ===
  {name: 'Bessa R', jp_names: ['BESSA R', 'ベッサR'], country: 'Japan', parent_brand: 'Voigtlander', category: ['Cameras']},
  {name: 'Bessa R2', jp_names: ['BESSA R2', 'ベッサR2'], country: 'Japan', parent_brand: 'Voigtlander', category: ['Cameras']},
  {name: 'Bessa R3A', jp_names: ['BESSA R3A', 'ベッサR3A'], country: 'Japan', parent_brand: 'Voigtlander', category: ['Cameras']},
  {name: 'Bessa T', jp_names: ['BESSA T', 'ベッサT'], country: 'Japan', parent_brand: 'Voigtlander', category: ['Cameras']},

  // === Panasonic / Lumix ===
  {name: 'GH5', jp_names: ['GH5', 'LUMIX GH5', 'DC-GH5'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'GH6', jp_names: ['GH6', 'LUMIX GH6', 'DC-GH6'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'G9', jp_names: ['G9', 'LUMIX G9', 'DC-G9'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'G9 II', jp_names: ['G9 II', 'LUMIX G9 II', 'DC-G9M2'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'S5', jp_names: ['S5', 'LUMIX S5', 'DC-S5'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'S5 II', jp_names: ['S5 II', 'LUMIX S5 II', 'DC-S5M2'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'Lumix S1', jp_names: ['LUMIX S1', 'DC-S1', 'DMC-S1'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'S1R', jp_names: ['S1R', 'LUMIX S1R', 'DC-S1R'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},
  {name: 'Lumix GF', jp_names: ['LUMIX GF', 'DMC-GF', 'DC-GF', 'GF9', 'GF10', 'GF7', 'GF5', 'GF3', 'GF2', 'GF1'], country: 'Japan', parent_brand: 'Panasonic', category: ['Cameras']},

  // === Casio EXILIM ===
  {name: 'EXILIM', jp_names: ['EXILIM', 'エクシリム', 'EX-Z', 'EX-ZR', 'EX-ZS', 'EX-FR', 'EX-100'], country: 'Japan', parent_brand: 'Casio', category: ['Cameras']},

  // === Konica ===
  {name: 'Hexar AF', jp_names: ['HEXAR AF', 'ヘキサーAF'], country: 'Japan', parent_brand: 'Konica', category: ['Cameras']},
  {name: 'Hexar RF', jp_names: ['HEXAR RF', 'ヘキサーRF'], country: 'Japan', parent_brand: 'Konica', category: ['Cameras']},
  {name: 'Auto S2', jp_names: ['AUTO S2', 'コニカAUTO S2'], country: 'Japan', parent_brand: 'Konica', category: ['Cameras']},
  {name: 'C35', jp_names: ['C35', 'コニカC35'], country: 'Japan', parent_brand: 'Konica', category: ['Cameras']},

  // === Polaroid ===
  {name: 'SX-70', jp_names: ['SX-70', 'SX70'], country: 'USA', parent_brand: 'Polaroid', category: ['Cameras']},
  {name: 'OneStep', jp_names: ['ONESTEP', 'ワンステップ'], country: 'USA', parent_brand: 'Polaroid', category: ['Cameras']},

  // === GoPro ===
  {name: 'HERO12', jp_names: ['HERO12', 'HERO 12', 'ゴープロ12'], country: 'USA', parent_brand: 'GoPro', category: ['Cameras']},
  {name: 'HERO11', jp_names: ['HERO11', 'HERO 11'], country: 'USA', parent_brand: 'GoPro', category: ['Cameras']},
  {name: 'HERO10', jp_names: ['HERO10', 'HERO 10'], country: 'USA', parent_brand: 'GoPro', category: ['Cameras']},

  // === Kodak ===
  {name: 'Retina', jp_names: ['RETINA', 'レチナ'], country: 'USA', parent_brand: 'Kodak', category: ['Cameras']},
  {name: 'Retina IIa', jp_names: ['RETINA IIA', 'レチナIIA'], country: 'USA', parent_brand: 'Kodak', category: ['Cameras']},

  // === Sigma ===
  {name: 'fp', jp_names: ['FP', 'シグマFP', 'SIGMA FP'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'fp L', jp_names: ['FP L', 'シグマFP L', 'SIGMA FP L'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP1 Merrill', jp_names: ['DP1 MERRILL', 'DP1メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP2 Merrill', jp_names: ['DP2 MERRILL', 'DP2メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP3 Merrill', jp_names: ['DP3 MERRILL', 'DP3メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},

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
  {name: 'Sony', jp_names: ['ソニー', 'SONY'], country: 'Japan', category: ['Cameras', 'Electronics']},

  // === Trading Cards ===
  {name: 'Battle Spirits', jp_names: ['バトルスピリッツ', 'BATTLE SPIRITS'], country: 'Japan'},
  {name: 'Cardfight!! Vanguard', jp_names: ['カードファイト!! ヴァンガード', 'VANGUARD', 'CARDFIGHT VANGUARD'], country: 'Japan'},
  {name: 'Digimon', jp_names: ['デジモン', 'DIGIMON'], country: 'Japan'},
  {name: 'Dragon Ball', jp_names: ['ドラゴンボール', 'DRAGON BALL'], country: 'Japan'},
  {name: 'Duel Masters', jp_names: ['デュエルマスターズ', 'DUEL MASTERS'], country: 'USA'},
  {name: 'Magic: The Gathering', jp_names: ['マジックザギャザリング', 'MAGIC THE GATHERING'], country: 'USA', category: ['Trading Cards']},
  {name: 'One Piece', jp_names: ['ワンピース', 'ONE PIECE'], country: 'Japan'},
  {name: 'Pokemon', jp_names: ['ポケモン', 'POKEMON'], country: 'Japan'},
  {name: 'Weiss Schwarz', jp_names: ['ヴァイスシュヴァルツ', 'WEISS SCHWARZ'], country: 'Japan'},
  {name: 'Yu-Gi-Oh', jp_names: ['遊戯王', 'YU-GI-OH', 'YUGIOH'], country: 'Japan'},

  // === Video Games ===
  {name: 'Bandai Namco', jp_names: ['バンダイナムコ', 'バンナム', 'BANDAI NAMCO'], country: 'Japan', category: ['Video Games']},
  {name: 'Capcom', jp_names: ['カプコン', 'CAPCOM'], country: 'Japan', category: ['Video Games']},
  {name: 'Konami', jp_names: ['コナミ', 'KONAMI'], country: 'Japan', category: ['Video Games']},
  {name: 'Nintendo', jp_names: ['任天堂', 'ニンテンドー', 'NINTENDO'], country: 'Japan', category: ['Video Games']},
  {name: 'Sega', jp_names: ['セガ', 'SEGA'], country: 'Japan', category: ['Video Games']},
  {name: 'Sony PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PLAYSTATION', 'PS5', 'PS4'], country: 'Japan', category: ['Video Games']},
  {name: 'Square Enix', jp_names: ['スクウェア・エニックス', 'SQUARE ENIX'], country: 'Japan', category: ['Video Games']},

  // === Soap & Bath ===
  {name: 'Acqua di Parma', jp_names: ['アクアディパルマ', 'ACQUA DI PARMA'], country: 'Italy'},
  {name: 'Aesop', jp_names: ['イソップ', 'AESOP'], country: 'Australia'},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI', 'BULGARI'], country: 'Italy'},
  {name: 'Claus Porto', jp_names: ['クラウスポルト', 'CLAUS PORTO'], country: 'Portugal'},
  {name: 'Cow Brand', jp_names: ['牛乳石鹸', 'カウブランド', 'COW BRAND'], country: 'Japan'},
  {name: 'Diptyque', jp_names: ['ディプティック', 'DIPTYQUE'], country: 'France'},
  {name: 'Gamila Secret', jp_names: ['ガミラシークレット', 'GAMILA', 'GAMILA SECRET'], country: 'Israel'},
  {name: 'HACCI', jp_names: ['ハッチ', 'HACCI'], country: 'Japan'},
  {name: 'Jo Malone', jp_names: ['ジョーマローン', 'JO MALONE'], country: 'United Kingdom'},
  {name: 'Kao', jp_names: ['花王', 'KAO'], country: 'Japan'},
  {name: "L'Occitane", jp_names: ['ロクシタン', "L'OCCITANE", 'LOCCITANE'], country: 'France'},
  {name: 'Le Labo', jp_names: ['ルラボ', 'LE LABO'], country: 'United States'},
  {name: 'Lush', jp_names: ['ラッシュ', 'LUSH'], country: 'United Kingdom'},
  {name: 'Molton Brown', jp_names: ['モルトンブラウン', 'MOLTON BROWN'], country: 'United Kingdom'},
  {name: "Penhaligon's", jp_names: ['ペンハリガン', "PENHALIGON'S", 'PENHALIGONS'], country: 'United Kingdom'},
  {name: 'Roger & Gallet', jp_names: ['ロジェ・ガレ', 'ROGER GALLET', 'ROGER & GALLET'], country: 'France'},
  {name: 'Sabon', jp_names: ['サボン', 'SABON'], country: 'Israel'},
  {name: 'Santa Maria Novella', jp_names: ['サンタマリアノヴェッラ', 'SANTA MARIA NOVELLA'], country: 'Italy'},
  {name: 'Savons Gemme', jp_names: ['サボンジェム', 'SAVONS GEMME'], country: 'France'},
  {name: 'SHIRO', jp_names: ['シロ', 'SHIRO'], country: 'Japan'},
  {name: 'Shiseido', jp_names: ['資生堂', 'SHISEIDO'], country: 'Japan'},

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
  {name: 'Aniplex', jp_names: ['アニプレックス', 'ANIPLEX'], country: 'Japan'},
  {name: 'Aoshima', jp_names: ['アオシマ', 'AOSHIMA', '青島文化教材社'], country: 'Japan'},
  {name: 'APEX-TOYS', jp_names: ['アペックス', 'APEX-TOYS', 'APEX'], country: 'China'},
  {name: 'BANDAI SPIRITS', jp_names: ['バンダイスピリッツ', 'BANDAI SPIRITS'], country: 'Japan'},
  {name: 'BellFine', jp_names: ['ベルファイン', 'BELLFINE'], country: 'Japan'},
  {name: 'BINDing', jp_names: ['バインディング', 'BINDING'], country: 'Japan'},
  {name: 'Bullmark', jp_names: ['ブルマーク', 'BULLMARK'], country: 'Japan'},
  {name: 'FREEing', jp_names: ['フリーイング', 'FREEING', 'FREE ING'], country: 'Japan'},
  {name: 'Gecco', jp_names: ['ゲッコウ', 'GECCO'], country: 'Japan'},
  {name: 'Hasegawa', jp_names: ['ハセガワ', 'HASEGAWA'], country: 'Japan'},
  {name: 'Hot Toys', jp_names: ['ホットトイズ', 'HOT TOYS'], country: 'Hong Kong'},
  {name: 'INSTINCTOY', jp_names: ['インスティンクトイ', 'INSTINCTOY'], country: 'Japan'},
  {name: 'Marusan', jp_names: ['マルサン', 'MARUSAN'], country: 'Japan'},
  {name: 'McFarlane Toys', jp_names: ['マクファーレン', 'MCFARLANE', 'MCFARLANE TOYS'], country: 'USA'},
  {name: 'Myethos', jp_names: ['ミートス', 'MYETHOS'], country: 'China'},
  {name: 'Native', jp_names: ['ネイティブ', 'NATIVE'], country: 'Japan'},
  {name: 'NECA', jp_names: ['ネカ', 'NECA'], country: 'USA'},
  {name: 'Orchid Seed', jp_names: ['オーキッドシード', 'ORCHID SEED'], country: 'Japan'},
  {name: 'PLUM', jp_names: ['プラム', 'PLUM'], country: 'Japan'},
  {name: 'Prime 1 Studio', jp_names: ['プライム1スタジオ', 'PRIME 1 STUDIO', 'PRIME1'], country: 'Japan'},
  {name: 'Re-Ment', jp_names: ['リーメント', 'RE-MENT', 'REMENT'], country: 'Japan'},
  {name: 'Real Head', jp_names: ['リアルヘッド', 'REAL HEAD', '真頭玩具'], country: 'Japan'},
  {name: 'SECRET BASE', jp_names: ['シークレットベース', 'SECRET BASE'], country: 'Japan'},
  {name: 'Sideshow Collectibles', jp_names: ['サイドショウ', 'SIDESHOW', 'SIDESHOW COLLECTIBLES'], country: 'USA'},
  {name: 'SkyTube', jp_names: ['スカイチューブ', 'SKYTUBE'], country: 'Japan'},
  {name: 'Spiritale', jp_names: ['スピリテイル', 'SPIRITALE'], country: 'Japan'},
  {name: 'T9G', jp_names: ['ティーナインジー', 'T9G'], country: 'Japan'},
  {name: 'Tamiya', jp_names: ['タミヤ', 'TAMIYA'], country: 'Japan'},
  {name: 'Threezero', jp_names: ['スリーゼロ', 'THREEZERO', '3ZERO'], country: 'Hong Kong'},
  {name: 'Union Creative', jp_names: ['ユニオンクリエイティブ', 'UNION CREATIVE'], country: 'Japan'},
  {name: 'Vertex', jp_names: ['ヴェルテクス', 'VERTEX'], country: 'Japan'},
  {name: 'WAVE', jp_names: ['ウェーブ', 'WAVE'], country: 'Japan'},

  // === Pottery & Porcelain ===
  {name: 'Arabia', jp_names: ['アラビア', 'ARABIA'], country: 'Finland'},
  {name: 'Starbucks', jp_names: ['スターバックス', 'スタバ', 'STARBUCKS'], country: 'USA'},
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
  {name: 'Butterfly', jp_names: ['バタフライ', 'BUTTERFLY'], country: 'Japan', category: ['Sporting Goods']},
  {name: 'Callaway', jp_names: ['キャロウェイ', 'CALLAWAY'], country: 'USA'},
  {name: 'Daiwa', jp_names: ['ダイワ', 'DAIWA'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Descente', jp_names: ['デサント', 'DESCENTE'], country: 'Japan'},
  {name: 'Gamakatsu', jp_names: ['がまかつ', 'GAMAKATSU'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Pearl Izumi', jp_names: ['パールイズミ', 'PEARL IZUMI'], country: 'Japan'},
  {name: 'Ping', jp_names: ['ピン', 'PING'], country: 'USA'},
  {name: 'Shimano', jp_names: ['シマノ', 'SHIMANO'], country: 'Japan', category: ['Fishing Reels']},
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

  // === Dolls & Plush (ドール＆ぬいぐるみ) ===
  {name: 'Steiff', jp_names: ['シュタイフ', 'STEIFF'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Merrythought', jp_names: ['メリーソート', 'MERRYTHOUGHT'], country: 'UK', category: ['Dolls & Plush']},
  {name: 'Hermann', jp_names: ['ヘルマン', 'HERMANN'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Clemens', jp_names: ['クレメンス', 'CLEMENS'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Ideal', jp_names: ['アイディアル', 'IDEAL'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Knickerbocker', jp_names: ['ニッカーボッカー', 'KNICKERBOCKER'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'VOLKS', jp_names: ['ボークス', 'VOLKS'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Blythe', jp_names: ['ブライス', 'ネオブライス', 'BLYTHE', 'NEO BLYTHE'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Pullip', jp_names: ['プーリップ', 'PULLIP'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'PetWorks', jp_names: ['ペットワークス', 'PETWORKS', 'PET WORKS'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Azone International', jp_names: ['アゾン', 'アゾンインターナショナル', 'AZONE', 'AZONE INTERNATIONAL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Smart Doll', jp_names: ['スマートドール', 'SMART DOLL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Barbie', jp_names: ['バービー', 'BARBIE'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Mattel', jp_names: ['マテル', 'MATTEL'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Obitsu', jp_names: ['オビツ', 'OBITSU', 'オビツ製作所'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Sekiguchi', jp_names: ['セキグチ', 'SEKIGUCHI', 'モンチッチ', 'MONCHHICHI'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Takara Tomy', jp_names: ['タカラトミー', 'TAKARA TOMY', 'タカラ', 'TAKARA', 'リカちゃん'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Groove', jp_names: ['グルーヴ', 'GROOVE'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'LUTS', jp_names: ['ルッツ', 'LUTS'], country: 'South Korea', category: ['Dolls & Plush']},
  {name: 'Fairyland', jp_names: ['フェアリーランド', 'FAIRYLAND'], country: 'South Korea', category: ['Dolls & Plush']},
  {name: 'Jellycat', jp_names: ['ジェリーキャット', 'JELLYCAT'], country: 'UK', category: ['Dolls & Plush']},
  {name: 'GUND', jp_names: ['ガンド', 'GUND'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Squishmallows', jp_names: ['スクイッシュマロ', 'SQUISHMALLOWS'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Build-A-Bear', jp_names: ['ビルドアベア', 'BUILD-A-BEAR', 'BUILD A BEAR'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Sun Arrow', jp_names: ['サンアロー', 'SUN ARROW'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'San-X', jp_names: ['サンエックス', 'SAN-X', 'SANX'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Sanrio', jp_names: ['サンリオ', 'SANRIO'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Pokemon Center', jp_names: ['ポケモンセンター', 'POKEMON CENTER'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Disney', jp_names: ['ディズニー', 'DISNEY'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Shinada Global', jp_names: ['シナダグローバル', 'SHINADA', 'SHINADA GLOBAL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Nakajima Corporation', jp_names: ['ナカジマコーポレーション', 'NAKAJIMA'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Sonny Angel', jp_names: ['ソニーエンジェル', 'SONNY ANGEL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'BE@RBRICK', jp_names: ['ベアブリック', 'BEARBRICK', 'BE@RBRICK'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'KAWS', jp_names: ['カウズ', 'KAWS'], country: 'USA', category: ['Dolls & Plush']},
  {name: 'Bandai', jp_names: ['バンダイ', 'BANDAI'], country: 'Japan', category: ['Dolls & Plush', 'Video Games']},
  
  // === Hats ===
  {name: 'New Era', jp_names: ['ニューエラ', 'NEW ERA', 'NEWERA'], country: 'USA', category: ['Hats']},
  {name: 'Kangol', jp_names: ['カンゴール', 'KANGOL'], country: 'UK', category: ['Hats']},
  {name: 'Stetson', jp_names: ['ステットソン', 'STETSON'], country: 'USA', category: ['Hats']},
  {name: 'Brixton', jp_names: ['ブリクストン', 'BRIXTON'], country: 'USA', category: ['Hats']},
  {name: 'Goorin Bros', jp_names: ['グーリンブラザーズ', 'GOORIN BROS', 'GOORIN'], country: 'USA', category: ['Hats']},
  {name: 'Richardson', jp_names: ['リチャードソン', 'RICHARDSON'], country: 'USA', category: ['Hats']},
  {name: "'47 Brand", jp_names: ['フォーティーセブン', '47 BRAND', "'47", 'FORTYSEVEN'], country: 'USA', category: ['Hats']},
  {name: 'CA4LA', jp_names: ['カシラ', 'CA4LA'], country: 'Japan', category: ['Hats']},
  {name: 'Override', jp_names: ['オーバーライド', 'OVERRIDE'], country: 'Japan', category: ['Hats']},
  {name: 'H.W. Dog & Co.', jp_names: ['エイチダブリュードッグ', 'H.W. DOG', 'HW DOG', 'HWDOG'], country: 'Japan', category: ['Hats']},
  {name: 'Nine Tailor', jp_names: ['ナインテイラー', 'NINE TAILOR', 'NINETAILOR'], country: 'Japan', category: ['Hats']},
  {name: 'Bocodeco', jp_names: ['ボコデコ', 'BOCODECO'], country: 'Japan', category: ['Hats']},
  {name: 'Flexfit', jp_names: ['フレックスフィット', 'FLEXFIT'], country: 'USA', category: ['Hats']},
  {name: 'Yupoong', jp_names: ['ユーポン', 'YUPOONG'], country: 'USA', category: ['Hats']},
  {name: 'Mitchell & Ness', jp_names: ['ミッチェルアンドネス', 'MITCHELL & NESS', 'MITCHELL AND NESS', 'MITCHELL&NESS'], country: 'USA', category: ['Hats']},
  {name: 'Starter', jp_names: ['スターター', 'STARTER'], country: 'USA', category: ['Hats']},
  {name: 'Lack of Color', jp_names: ['ラックオブカラー', 'LACK OF COLOR'], country: 'Australia', category: ['Hats']},
  {name: 'Racal', jp_names: ['ラカル', 'RACAL'], country: 'Japan', category: ['Hats']},
  
  // Watches - Added
  {name: 'Jaquet Droz', jp_names: ['ジャケドロー', 'ジャケ・ドロー', 'JAQUET DROZ'], country: 'Switzerland', category: ['Watches']},
  {name: 'Roger Dubuis', jp_names: ['ロジェデュブイ', 'ロジェ・デュブイ', 'ROGER DUBUIS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Parmigiani Fleurier', jp_names: ['パルミジャーニフルリエ', 'パルミジャーニ', 'PARMIGIANI FLEURIER', 'PARMIGIANI'], country: 'Switzerland', category: ['Watches']},
  {name: 'H. Moser & Cie.', jp_names: ['モーザー', 'H.モーザー', 'H. MOSER', 'MOSER'], country: 'Switzerland', category: ['Watches']},
  {name: 'MB&F', jp_names: ['MB&F', 'エムビーアンドエフ'], country: 'Switzerland', category: ['Watches']},
  {name: 'Urwerk', jp_names: ['ウルベルク', 'URWERK'], country: 'Switzerland', category: ['Watches']},
  {name: 'F.P. Journe', jp_names: ['ジュルヌ', 'F.P.ジュルヌ', 'FP JOURNE', 'F.P. JOURNE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Bovet', jp_names: ['ボヴェ', 'BOVET'], country: 'Switzerland', category: ['Watches']},
  {name: 'Greubel Forsey', jp_names: ['グルーベルフォルセイ', 'GREUBEL FORSEY'], country: 'Switzerland', category: ['Watches']},
  {name: 'Armand Nicolet', jp_names: ['アルマンニコレ', 'ARMAND NICOLET'], country: 'Switzerland', category: ['Watches']},
  {name: 'Arnold & Son', jp_names: ['アーノルドアンドサン', 'ARNOLD & SON'], country: 'Switzerland', category: ['Watches']},
  {name: 'Carl F. Bucherer', jp_names: ['カールFブヘラ', 'ブヘラ', 'CARL F. BUCHERER', 'BUCHERER'], country: 'Switzerland', category: ['Watches']},
  {name: 'Certina', jp_names: ['サーチナ', 'セルティナ', 'CERTINA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Cuervo y Sobrinos', jp_names: ['クエルボイソブリノス', 'CUERVO Y SOBRINOS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Czapek', jp_names: ['チャペック', 'CZAPEK'], country: 'Switzerland', category: ['Watches']},
  {name: 'Delma', jp_names: ['デルマ', 'DELMA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Doxa', jp_names: ['ドクサ', 'DOXA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Eberhard & Co.', jp_names: ['エベラール', 'EBERHARD', 'EBERHARD & CO'], country: 'Switzerland', category: ['Watches']},
  {name: 'Favre-Leuba', jp_names: ['ファーブルルーバ', 'ファーブル・ルーバ', 'FAVRE-LEUBA', 'FAVRE LEUBA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Ferdinand Berthoud', jp_names: ['フェルディナンベルトゥー', 'FERDINAND BERTHOUD'], country: 'Switzerland', category: ['Watches']},
  {name: 'Fortis', jp_names: ['フォルティス', 'FORTIS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Glycine', jp_names: ['グリシン', 'グライシン', 'GLYCINE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Graham', jp_names: ['グラハム', 'GRAHAM'], country: 'Switzerland', category: ['Watches']},
  {name: 'Hautlence', jp_names: ['オートランス', 'HAUTLENCE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Hysek', jp_names: ['ハイゼック', 'HYSEK'], country: 'Switzerland', category: ['Watches']},
  {name: 'JeanRichard', jp_names: ['ジャンリシャール', 'JEANRICHARD'], country: 'Switzerland', category: ['Watches']},
  {name: 'Louis Moinet', jp_names: ['ルイモワネ', 'LOUIS MOINET'], country: 'Switzerland', category: ['Watches']},
  {name: 'MCT', jp_names: ['MCT', 'エムシーティー'], country: 'Switzerland', category: ['Watches']},
  {name: 'Paul Picot', jp_names: ['ポールピコ', 'PAUL PICOT'], country: 'Switzerland', category: ['Watches']},
  {name: 'Perrelet', jp_names: ['ペルレ', 'PERRELET'], country: 'Switzerland', category: ['Watches']},
  {name: 'Romain Gauthier', jp_names: ['ロマンゴティエ', 'ROMAIN GAUTHIER'], country: 'Switzerland', category: ['Watches']},
  {name: 'Speake-Marin', jp_names: ['スピークマリン', 'SPEAKE-MARIN', 'SPEAKE MARIN'], country: 'Switzerland', category: ['Watches']},
  {name: 'Squale', jp_names: ['スクワーレ', 'SQUALE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Titoni', jp_names: ['チトニ', 'TITONI'], country: 'Switzerland', category: ['Watches']},
  {name: 'Vulcain', jp_names: ['バルカン', 'ヴァルカン', 'VULCAIN'], country: 'Switzerland', category: ['Watches']},
  {name: 'Zodiac', jp_names: ['ゾディアック', 'ZODIAC'], country: 'Switzerland', category: ['Watches']},
  {name: 'Claude Meylan', jp_names: ['クロードメイラン', 'CLAUDE MEYLAN'], country: 'Switzerland', category: ['Watches']},
  {name: 'Aerowatch', jp_names: ['エアロウォッチ', 'AEROWATCH'], country: 'Switzerland', category: ['Watches']},
  {name: 'Adriatica', jp_names: ['アドリアティカ', 'ADRIATICA'], country: 'Switzerland', category: ['Watches']},

  {name: 'A. Lange & Söhne', jp_names: ['ランゲアンドゾーネ', 'A.ランゲ＆ゾーネ', 'A. LANGE & SOHNE', 'LANGE & SOHNE', 'ランゲ'], country: 'Germany', category: ['Watches']},
  {name: 'Sinn', jp_names: ['ジン', 'SINN'], country: 'Germany', category: ['Watches']},
  {name: 'Stowa', jp_names: ['ストーワ', 'STOWA'], country: 'Germany', category: ['Watches']},
  {name: 'MeisterSinger', jp_names: ['マイスタージンガー', 'MEISTERSINGER'], country: 'Germany', category: ['Watches']},
  {name: 'Tutima', jp_names: ['チュチマ', 'TUTIMA'], country: 'Germany', category: ['Watches']},
  {name: 'Mühle-Glashütte', jp_names: ['ミューレグラスヒュッテ', 'MUHLE GLASHUTTE', 'MUHLE'], country: 'Germany', category: ['Watches']},
  {name: 'Union Glashütte', jp_names: ['ウニオングラスヒュッテ', 'UNION GLASHUTTE'], country: 'Germany', category: ['Watches']},
  {name: 'Archimede', jp_names: ['アルキメデ', 'ARCHIMEDE'], country: 'Germany', category: ['Watches']},
  {name: 'Damasko', jp_names: ['ダマスコ', 'DAMASKO'], country: 'Germany', category: ['Watches']},
  {name: 'Junkers', jp_names: ['ユンカース', 'JUNKERS'], country: 'Germany', category: ['Watches']},
  {name: 'Dugena', jp_names: ['デュゲナ', 'DUGENA'], country: 'Germany', category: ['Watches']},
  {name: 'Wempe', jp_names: ['ヴェンペ', 'WEMPE'], country: 'Germany', category: ['Watches']},

  {name: 'Anonimo', jp_names: ['アノーニモ', 'ANONIMO'], country: 'Italy', category: ['Watches']},
  {name: 'Meccaniche Veneziane', jp_names: ['メカニケヴェネチアーネ', 'MECCANICHE VENEZIANE'], country: 'Italy', category: ['Watches']},
  {name: 'Officine del Tempo', jp_names: ['オフィチーネデルテンポ', 'OFFICINE DEL TEMPO'], country: 'Italy', category: ['Watches']},
  {name: 'Visconti', jp_names: ['ヴィスコンティ', 'VISCONTI'], country: 'Italy', category: ['Watches']},

  {name: 'Michel Herbelin', jp_names: ['ミッシェルエルブラン', 'エルブラン', 'MICHEL HERBELIN', 'HERBELIN'], country: 'France', category: ['Watches']},
  {name: 'Pequignet', jp_names: ['ペキニエ', 'PEQUIGNET'], country: 'France', category: ['Watches']},
  {name: 'Yema', jp_names: ['イエマ', 'YEMA'], country: 'France', category: ['Watches']},
  {name: 'Dodane', jp_names: ['ドダーヌ', 'DODANE'], country: 'France', category: ['Watches']},
  {name: 'B.R.M', jp_names: ['BRM', 'B.R.M', 'ビーアールエム'], country: 'France', category: ['Watches']},

  {name: 'Fossil', jp_names: ['フォッシル', 'FOSSIL'], country: 'USA', category: ['Watches']},
  {name: 'Invicta', jp_names: ['インビクタ', 'インヴィクタ', 'INVICTA'], country: 'USA', category: ['Watches']},
  {name: 'Movado', jp_names: ['モバード', 'MOVADO'], country: 'USA', category: ['Watches']},
  {name: 'Marathon', jp_names: ['マラソン', 'MARATHON'], country: 'USA', category: ['Watches']},
  {name: 'DKNY', jp_names: ['ダナキャラン', 'DKNY'], country: 'USA', category: ['Watches']},
  {name: 'Calvin Klein', jp_names: ['カルバンクライン', 'CALVIN KLEIN', 'CK'], country: 'USA', category: ['Watches']},
  {name: 'Armani Exchange', jp_names: ['アルマーニエクスチェンジ', 'ARMANI EXCHANGE', 'A|X'], country: 'USA', category: ['Watches']},

  {name: 'Christopher Ward', jp_names: ['クリストファーウォード', 'CHRISTOPHER WARD'], country: 'UK', category: ['Watches']},
  {name: 'Smiths', jp_names: ['スミス', 'SMITHS'], country: 'UK', category: ['Watches']},
  {name: 'Pinion', jp_names: ['ピニオン', 'PINION'], country: 'UK', category: ['Watches']},

  {name: 'Skagen', jp_names: ['スカーゲン', 'SKAGEN'], country: 'Denmark', category: ['Watches']},
  {name: 'Triwa', jp_names: ['トリワ', 'TRIWA'], country: 'Sweden', category: ['Watches']},
  {name: 'Komono', jp_names: ['コモノ', 'KOMONO'], country: 'Belgium', category: ['Watches']},

  {name: 'Suunto', jp_names: ['スント', 'SUUNTO'], country: 'Finland', category: ['Watches']},

  {name: 'Hugo Boss', jp_names: ['ヒューゴボス', 'HUGO BOSS', 'BOSS'], country: 'Germany', category: ['Watches']},

  {name: 'Q&Q', jp_names: ['キューアンドキュー', 'Q&Q'], country: 'Japan', category: ['Watches']},
  {name: 'Lorus', jp_names: ['ローラス', 'LORUS'], country: 'Japan', category: ['Watches']},
  {name: 'GSX', jp_names: ['ジーエスエックス', 'GSX'], country: 'Japan', category: ['Watches']},
  {name: 'Takano', jp_names: ['タカノ', '高野精密', 'TAKANO'], country: 'Japan', category: ['Watches']},
  {name: 'SEALANE', jp_names: ['シーレーン', 'SEALANE'], country: 'Japan', category: ['Watches']},
  {name: 'Naoya Hida', jp_names: ['飛田直哉', 'ナオヤヒダ', 'NAOYA HIDA'], country: 'Japan', category: ['Watches']},
  {name: 'Hajime Asaoka', jp_names: ['浅岡肇', 'アサオカハジメ', 'HAJIME ASAOKA'], country: 'Japan', category: ['Watches']},
  {name: 'M.R.M.W.', jp_names: ['エムアールエムダブリュー', 'MRMW', 'M.R.M.W.', 'モントルロロイ'], country: 'Japan', category: ['Watches']},
  {name: 'Tokyoflash', jp_names: ['トーキョーフラッシュ', 'TOKYOFLASH'], country: 'Japan', category: ['Watches']},
  {name: 'Dedegumo', jp_names: ['デデグモ', 'DEDEGUMO'], country: 'Japan', category: ['Watches']},

  {name: 'Enicar', jp_names: ['エニカー', 'ENICAR'], country: 'Switzerland', category: ['Watches']},
  {name: 'Nivada Grenchen', jp_names: ['ニバダグレンヒェン', 'NIVADA', 'NIVADA GRENCHEN'], country: 'Switzerland', category: ['Watches']},
  {name: 'Gruen', jp_names: ['グリューエン', 'GRUEN'], country: 'USA', category: ['Watches']},
  {name: 'Benrus', jp_names: ['ベンラス', 'BENRUS'], country: 'USA', category: ['Watches']},
  {name: 'Ingersoll', jp_names: ['インガーソル', 'INGERSOLL'], country: 'USA', category: ['Watches']},
  {name: 'Wittnauer', jp_names: ['ウィットナー', 'WITTNAUER'], country: 'USA', category: ['Watches']},
  {name: 'Rodania', jp_names: ['ロダニア', 'RODANIA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Zeno Watch Basel', jp_names: ['ゼノウォッチバーゼル', 'ZENO', 'ZENO WATCH BASEL'], country: 'Switzerland', category: ['Watches']},

  {name: 'Sea-Gull', jp_names: ['シーガル', 'SEA-GULL', 'SEAGULL'], country: 'China', category: ['Watches']},
  {name: 'Pagani Design', jp_names: ['パガーニデザイン', 'PAGANI DESIGN'], country: 'China', category: ['Watches']},
  {name: 'San Martin', jp_names: ['サンマーティン', 'SAN MARTIN'], country: 'China', category: ['Watches']},
  {name: 'Parnis', jp_names: ['パーニス', 'PARNIS'], country: 'China', category: ['Watches']},
  {name: 'CIGA Design', jp_names: ['シーガデザイン', 'CIGA DESIGN', 'CIGA'], country: 'China', category: ['Watches']},

  {name: 'I.T.A.', jp_names: ['アイティーエー', 'ITA', 'I.T.A.', 'I.T.A', 'ITALIA TECNICA ARTIGIANA'], country: 'Italy', category: ['Watches']},
  {name: 'Tendence', jp_names: ['テンデンス', 'TENDENCE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Guionnet', jp_names: ['ギオネ', 'GUIONNET'], country: 'Japan', category: ['Watches']},
  {name: 'Elgin', jp_names: ['エルジン', 'ELGIN'], country: 'USA', category: ['Watches']},
  {name: 'Ice-Watch', jp_names: ['アイスウォッチ', 'アイス・ウォッチ', 'ICE WATCH', 'ICE-WATCH', 'ICEWATCH'], country: 'Belgium', category: ['Watches']},
  {name: 'Corniche', jp_names: ['コーニッシュ', 'CORNICHE'], country: 'Sweden', category: ['Watches']},
  {name: 'Olivia Burton', jp_names: ['オリビアバートン', 'オリビア・バートン', 'OLIVIA BURTON'], country: 'UK', category: ['Watches']},
  {name: 'OSSO ITALY', jp_names: ['オッソイタリー', 'オッソイタリィ', 'OSSO ITALY', 'OSSO'], country: 'Italy', category: ['Watches']},

  // === Fishing Reels ===
  {name: 'Ryobi', jp_names: ['リョービ', 'RYOBI'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Megabass', jp_names: ['メガバス', 'MEGABASS'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Prox', jp_names: ['プロックス', 'PROX'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'ZPI', jp_names: ['ZPI', 'ジーピーアイ'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Nissin', jp_names: ['宇崎日新', 'ニッシン', 'NISSIN'], country: 'Japan', category: ['Fishing Reels']},

  {name: 'Abu Garcia', jp_names: ['アブガルシア', 'アブ', 'ABU GARCIA', 'ABU'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Penn', jp_names: ['ペン', 'PENN'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Zebco', jp_names: ['ゼブコ', 'ZEBCO'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Pflueger', jp_names: ['プルーガー', 'プルーフガー', 'PFLUEGER'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Quantum', jp_names: ['クアンタム', 'QUANTUM'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Lew\'s', jp_names: ['ルーズ', 'LEWS', 'LEW\'S'], country: 'USA', category: ['Fishing Reels']},
  {name: '13 Fishing', jp_names: ['サーティーンフィッシング', '13 FISHING', '13FISHING'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Fin-Nor', jp_names: ['フィンノール', 'FIN-NOR', 'FINNOR'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Accurate', jp_names: ['アキュレート', 'ACCURATE'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Avet', jp_names: ['アベット', 'AVET'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Seigler', jp_names: ['セイグラー', 'SEIGLER'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Van Staal', jp_names: ['ヴァンスタール', 'VAN STAAL'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Shakespeare', jp_names: ['シェイクスピア', 'SHAKESPEARE'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Orvis', jp_names: ['オービス', 'ORVIS'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Lamson', jp_names: ['ラムソン', 'LAMSON'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Ross', jp_names: ['ロス', 'ROSS'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Sage', jp_names: ['セージ', 'SAGE'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Redington', jp_names: ['レディントン', 'REDINGTON'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Cortland', jp_names: ['コートランド', 'CORTLAND'], country: 'USA', category: ['Fishing Reels']},
  {name: 'KastKing', jp_names: ['キャストキング', 'KASTKING'], country: 'China', category: ['Fishing Reels']},

  {name: 'Mitchell', jp_names: ['ミッチェル', 'MITCHELL'], country: 'France', category: ['Fishing Reels']},
  {name: 'Hardy', jp_names: ['ハーディ', 'HARDY'], country: 'UK', category: ['Fishing Reels']},
  {name: 'DAM', jp_names: ['ダム', 'DAM'], country: 'Germany', category: ['Fishing Reels']},
  {name: 'Danielsson', jp_names: ['ダニエルソン', 'DANIELSSON'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Loop', jp_names: ['ループ', 'LOOP'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Greys', jp_names: ['グレイズ', 'GREYS'], country: 'UK', category: ['Fishing Reels']},
  {name: 'Vision', jp_names: ['ビジョン', 'VISION'], country: 'Finland', category: ['Fishing Reels']},

  {name: 'Okuma', jp_names: ['オクマ', 'OKUMA'], country: 'Taiwan', category: ['Fishing Reels']},
  {name: 'Tica', jp_names: ['ティカ', 'TICA'], country: 'Taiwan', category: ['Fishing Reels']},

  {name: 'Heddon', jp_names: ['ヘドン', 'HEDDON'], country: 'USA', category: ['Fishing Reels']},
  {name: 'South Bend', jp_names: ['サウスベンド', 'SOUTH BEND'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Allcock', jp_names: ['オールコック', 'ALLCOCK'], country: 'UK', category: ['Fishing Reels']},
  {name: 'J.W. Young', jp_names: ['J.W.ヤング', 'JW YOUNG', 'J.W. YOUNG'], country: 'UK', category: ['Fishing Reels']},
  {name: 'Pezon et Michel', jp_names: ['ペゾンエミシェル', 'PEZON ET MICHEL'], country: 'France', category: ['Fishing Reels']},
  {name: 'Ocean City', jp_names: ['オーシャンシティ', 'OCEAN CITY'], country: 'USA', category: ['Fishing Reels']},
  {name: 'Langley', jp_names: ['ラングレー', 'LANGLEY'], country: 'USA', category: ['Fishing Reels']},

  // === Video Game Consoles & Related ===
  {name: 'Microsoft Xbox', jp_names: ['エックスボックス', 'Xbox', 'XBOX', 'マイクロソフト'], country: 'USA', category: ['Video Games']},
  {name: 'Atari', jp_names: ['アタリ', 'ATARI'], country: 'USA', category: ['Video Games']},
  {name: 'SNK', jp_names: ['エスエヌケイ', 'SNK', 'ネオジオ', 'NEO GEO', 'NEOGEO'], country: 'Japan', category: ['Video Games']},
  {name: 'NEC', jp_names: ['NEC', 'エヌイーシー', 'PCエンジン', 'PC ENGINE', 'PC-ENGINE'], country: 'Japan', category: ['Video Games']},
  {name: 'Panasonic 3DO', jp_names: ['3DO', 'スリーディーオー'], country: 'Japan', category: ['Video Games']},
  {name: 'Commodore', jp_names: ['コモドール', 'COMMODORE'], country: 'USA', category: ['Video Games']},
  {name: 'Coleco', jp_names: ['コレコ', 'COLECO', 'COLECOVISION'], country: 'USA', category: ['Video Games']},
  {name: 'Mattel', jp_names: ['マテル', 'MATTEL', 'INTELLIVISION'], country: 'USA', category: ['Video Games']},
  {name: 'Valve', jp_names: ['バルブ', 'VALVE', 'STEAM DECK'], country: 'USA', category: ['Video Games']},
  {name: 'Analogue', jp_names: ['アナログ', 'ANALOGUE'], country: 'USA', category: ['Video Games']},
  {name: 'Retro-Bit', jp_names: ['レトロビット', 'RETRO-BIT', 'RETROBIT'], country: 'USA', category: ['Video Games']},
  {name: 'Hyperkin', jp_names: ['ハイパーキン', 'HYPERKIN'], country: 'USA', category: ['Video Games']},
  {name: 'Anbernic', jp_names: ['アンバーニック', 'ANBERNIC'], country: 'China', category: ['Video Games']},
  {name: 'Miyoo', jp_names: ['ミヨー', 'MIYOO'], country: 'China', category: ['Video Games']},
  {name: 'Epoch', jp_names: ['エポック', 'エポック社', 'EPOCH'], country: 'Japan', category: ['Video Games']},
  {name: 'Sharp', jp_names: ['シャープ', 'SHARP', 'ツインファミコン'], country: 'Japan', category: ['Video Games']},
  // Newly added parent brands for Video Games
  {name: 'Magnavox', jp_names: ['マグナボックス', 'MAGNAVOX'], country: 'USA', category: ['Video Games']},
  {name: 'AYANEO', jp_names: ['アヤネオ', 'AYANEO'], country: 'China', category: ['Video Games']},
  {name: 'GPD', jp_names: ['ジーピーディー', 'GPD'], country: 'China', category: ['Video Games']},
  {name: 'Retroid', jp_names: ['レトロイド', 'RETROID'], country: 'China', category: ['Video Games']},
  {name: 'Powkiddy', jp_names: ['パウキッディ', 'POWKIDDY'], country: 'China', category: ['Video Games']},
  {name: 'Playdate', jp_names: ['プレイデート', 'PLAYDATE'], country: 'USA', category: ['Video Games']},
  {name: 'Evercade', jp_names: ['エバーケード', 'EVERCADE'], country: 'UK', category: ['Video Games']},

  // Sub-brands (console models) with parent_brand
  // Nintendo
  {name: 'Famicom', jp_names: ['ファミコン', 'ファミリーコンピュータ', 'FC'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Super Famicom', jp_names: ['スーパーファミコン', 'スーファミ', 'SFC'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Nintendo 64', jp_names: ['ニンテンドー64', 'N64', 'ニンテンドウ64'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Nintendo GameCube', jp_names: ['ゲームキューブ', 'GC', 'GAMECUBE'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Wii', jp_names: ['ウィー', 'Wii'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Wii U', jp_names: ['ウィーユー', 'WiiU'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Nintendo Switch', jp_names: ['ニンテンドースイッチ', 'スイッチ', 'SWITCH'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Game Boy', jp_names: ['ゲームボーイ', 'GB', 'GAMEBOY'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Game Boy Advance', jp_names: ['ゲームボーイアドバンス', 'GBA', 'GAMEBOY ADVANCE'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Nintendo DS', jp_names: ['ニンテンドーDS', 'DS', 'NDS'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Nintendo 3DS', jp_names: ['ニンテンドー3DS', '3DS'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Virtual Boy', jp_names: ['バーチャルボーイ', 'VIRTUAL BOY'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},
  {name: 'Game & Watch', jp_names: ['ゲームアンドウォッチ', 'ゲーム&ウオッチ', 'GAME & WATCH'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games']},

  // Sony PlayStation
  {name: 'PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PS1', 'PS ONE'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PlayStation 2', jp_names: ['プレイステーション2', 'PS2', 'プレステ2'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PlayStation 3', jp_names: ['プレイステーション3', 'PS3', 'プレステ3'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PlayStation 4', jp_names: ['プレイステーション4', 'PS4', 'プレステ4'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PlayStation 5', jp_names: ['プレイステーション5', 'PS5', 'プレステ5'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PSP', jp_names: ['PSP', 'プレイステーションポータブル', 'PLAYSTATION PORTABLE'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},
  {name: 'PS Vita', jp_names: ['ヴィータ', 'PSVITA', 'PS VITA', 'プレイステーションヴィータ'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games']},

  // Sega
  {name: 'Mega Drive', jp_names: ['メガドライブ', 'MEGA DRIVE', 'GENESIS', 'ジェネシス'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games']},
  {name: 'Sega Saturn', jp_names: ['セガサターン', 'サターン', 'SATURN'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games']},
  {name: 'Dreamcast', jp_names: ['ドリームキャスト', 'DREAMCAST', 'DC'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games']},
  {name: 'Game Gear', jp_names: ['ゲームギア', 'GAME GEAR'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games']},
  {name: 'Sega Mark III', jp_names: ['マークIII', 'セガマークIII', 'MASTER SYSTEM', 'マスターシステム'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games']},

  // SNK
  {name: 'Neo Geo AES', jp_names: ['ネオジオ', 'ネオジオAES', 'NEO GEO AES', 'NEOGEO'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games']},
  {name: 'Neo Geo CD', jp_names: ['ネオジオCD', 'NEO GEO CD'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games']},
  {name: 'Neo Geo Pocket', jp_names: ['ネオジオポケット', 'NEO GEO POCKET'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games']},

  // NEC
  {name: 'PC Engine', jp_names: ['PCエンジン', 'PC ENGINE', 'TURBOGRAFX-16', 'ターボグラフィックス'], country: 'Japan', parent_brand: 'NEC', category: ['Video Games']},
  {name: 'PC-FX', jp_names: ['PC-FX', 'PCFX'], country: 'Japan', parent_brand: 'NEC', category: ['Video Games']},

  // Bandai
  {name: 'WonderSwan', jp_names: ['ワンダースワン', 'WONDERSWAN', 'WONDER SWAN'], country: 'Japan', parent_brand: 'Bandai', category: ['Video Games']},

  // Other
  {name: 'Cassette Vision', jp_names: ['カセットビジョン', 'CASSETTE VISION'], country: 'Japan', parent_brand: 'Epoch', category: ['Video Games']},
  
  // === Fishing Reels: New Parent Brands ===
  {name: 'Tailwalk', jp_names: ['テイルウォーク', 'TAILWALK'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Evergreen', jp_names: ['エバーグリーン', 'EVERGREEN'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Major Craft', jp_names: ['メジャークラフト', 'MAJOR CRAFT'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Studio Ocean Mark', jp_names: ['スタジオオーシャンマーク', 'STUDIO OCEAN MARK', 'SOM'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Smith', jp_names: ['スミス', 'SMITH'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Valleyhill', jp_names: ['バレーヒル', 'VALLEYHILL'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'PALMS', jp_names: ['パームス', 'PALMS'], country: 'Japan', category: ['Fishing Reels']},

  // === Fishing Reels: Shimano Spinning ===
  {name: 'Stella', jp_names: ['ステラ', 'STELLA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Twin Power', jp_names: ['ツインパワー', 'TWIN POWER', 'TWINPOWER'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Vanquish', jp_names: ['ヴァンキッシュ', 'バンキッシュ', 'VANQUISH'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Stradic', jp_names: ['ストラディック', 'STRADIC'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Exsence', jp_names: ['エクスセンス', 'EXSENCE'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Sephia', jp_names: ['セフィア', 'SEPHIA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Soare', jp_names: ['ソアレ', 'SOARE'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},

  // === Fishing Reels: Shimano Bait ===
  {name: 'Scorpion', jp_names: ['スコーピオン', 'SCORPION'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Metanium', jp_names: ['メタニウム', 'METANIUM'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Antares', jp_names: ['アンタレス', 'ANTARES'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Calcutta', jp_names: ['カルカッタ', 'CALCUTTA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Bantam', jp_names: ['バンタム', 'BANTAM'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Aldebaran', jp_names: ['アルデバラン', 'ALDEBARAN'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},

  // === Fishing Reels: Shimano Electric ===
  {name: 'ForceMaster', jp_names: ['フォースマスター', 'FORCEMASTER'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'BeastMaster', jp_names: ['ビーストマスター', 'BEASTMASTER'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Plays', jp_names: ['プレイズ', 'PLAYS'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},

  // === Fishing Reels: Daiwa Spinning ===
  {name: 'Exist', jp_names: ['イグジスト', 'EXIST'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Certate', jp_names: ['セルテート', 'CERTATE'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Luvias', jp_names: ['ルビアス', 'LUVIAS'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Saltiga', jp_names: ['ソルティガ', 'SALTIGA'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Caldia', jp_names: ['カルディア', 'CALDIA'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Emeraldas', jp_names: ['エメラルダス', 'EMERALDAS'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},

  // === Fishing Reels: Daiwa Bait ===
  {name: 'Steez', jp_names: ['スティーズ', 'STEEZ'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Zillion', jp_names: ['ジリオン', 'ZILLION'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Tatula', jp_names: ['タトゥーラ', 'TATULA'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Ryoga', jp_names: ['リョウガ', 'RYOGA'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Alphas', jp_names: ['アルファス', 'ALPHAS'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Millionaire', jp_names: ['ミリオネア', 'MILLIONAIRE'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},

  // === Fishing Reels: Daiwa Electric ===
  {name: 'Seaborg', jp_names: ['シーボーグ', 'SEABORG'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Tanacom', jp_names: ['タナコン', 'TANACOM'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Leobritz', jp_names: ['レオブリッツ', 'LEOBRITZ'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},

  // === Fishing Reels: Abu Garcia ===
  {name: 'Ambassadeur', jp_names: ['アンバサダー', 'AMBASSADEUR'], country: 'Sweden', parent_brand: 'Abu Garcia', category: ['Fishing Reels']},
  {name: 'Revo', jp_names: ['レボ', 'REVO'], country: 'Sweden', parent_brand: 'Abu Garcia', category: ['Fishing Reels']},
  {name: 'Cardinal', jp_names: ['カーディナル', 'CARDINAL'], country: 'Sweden', parent_brand: 'Abu Garcia', category: ['Fishing Reels']},
  {name: 'Roxani', jp_names: ['ロキサーニ', 'ROXANI'], country: 'Sweden', parent_brand: 'Abu Garcia', category: ['Fishing Reels']},
];

/**
 * 交通整理（Sanitize）用のブランドリストを生成する
 * IS_BRAND_DICTからカテゴリに応じたブランドの英語名+日本語名をコンパクトな文字列で返す
 * @param {string} category - Sanitizeカテゴリ ('watch', 'camera', 'card')
 * @return {string} ブランドリスト文字列（例: "Seiko(セイコー), Omega(オメガ), ..."）
 */
function getBrandListForSanitize_(category) {
  try {
    // カードの場合はCardPatterns.gsのゲーム名を返す
    if (category === 'card') {
      var games = [
        'Pokemon TCG(ポケモンカード)', 'Yu-Gi-Oh!(遊戯王)', 'Magic the Gathering(MTG)',
        'Duel Masters(デュエルマスターズ)', 'Weiss Schwarz(ヴァイスシュヴァルツ)',
        'Cardfight Vanguard(ヴァンガード)', 'Battle Spirits(バトルスピリッツ)',
        'Dragon Ball(ドラゴンボール)', 'One Piece(ワンピース)',
        'BBM(野球カード)', 'Sumo(大相撲カード)'
      ];
      return games.join(', ');
    }

    // watch/cameraの場合はIS_BRAND_DICTからフィルタ
    if (typeof IS_BRAND_DICT === 'undefined' || !IS_BRAND_DICT) return '';

    var targetCategories;
    if (category === 'watch') {
      targetCategories = ['Watches'];
    } else if (category === 'camera') {
      targetCategories = ['Cameras'];
    } else if (category === 'game') {
      targetCategories = ['Video Games'];
    } else if (category === 'reel') {
      targetCategories = ['Fishing Reels'];
    } else {
      return '';
    }

    var seen = {};
    var results = [];

    for (var i = 0; i < IS_BRAND_DICT.length; i++) {
      var entry = IS_BRAND_DICT[i];
      // parent_brandがあるエントリ（サブブランド）はスキップ — 親ブランドだけ収集
      if (entry.parent_brand) continue;

      // categoryフィールドがあるエントリはカテゴリでフィルタ
      var isMatch = false;
      if (entry.category && entry.category.length > 0) {
        for (var j = 0; j < targetCategories.length; j++) {
          if (entry.category.indexOf(targetCategories[j]) !== -1) {
            isMatch = true;
            break;
          }
        }
      }

      // categoryがないエントリ（親ブランド）は、そのサブブランドが対象カテゴリを持つか確認
      if (!isMatch && !entry.category) {
        for (var k = 0; k < IS_BRAND_DICT.length; k++) {
          var sub = IS_BRAND_DICT[k];
          if (sub.parent_brand === entry.name && sub.category) {
            for (var j = 0; j < targetCategories.length; j++) {
              if (sub.category.indexOf(targetCategories[j]) !== -1) {
                isMatch = true;
                break;
              }
            }
            if (isMatch) break;
          }
        }
      }

      if (!isMatch) continue;
      if (seen[entry.name]) continue;
      seen[entry.name] = true;

      // 日本語名の最初の1つを取得（カタカナ優先）
      var jpName = '';
      if (entry.jp_names && entry.jp_names.length > 0) {
        jpName = entry.jp_names[0];
      }

      if (jpName && jpName !== entry.name.toUpperCase()) {
        results.push(entry.name + '(' + jpName + ')');
      } else {
        results.push(entry.name);
      }
    }

    return results.join(', ');
  } catch (e) {
    return '';
  }
}

// ドール＆ぬいぐるみ用キャラクターパターン辞書
var IS_DOLL_CHARACTER_PATTERNS = [
  // テディベア・動物系
  {keywords: ['テディベア', 'Teddy Bear', 'TEDDY BEAR', 'teddy bear'], value: 'Teddy Bear'},
  {keywords: ['トトロ', 'Totoro', 'TOTORO'], value: 'Totoro'},
  {keywords: ['ジジ', 'Jiji', 'JIJI', '黒猫'], value: 'Jiji'},
  {keywords: ['ネコバス', 'Catbus', 'CATBUS'], value: 'Catbus'},
  // サンリオ
  {keywords: ['ハローキティ', 'Hello Kitty', 'HELLO KITTY', 'キティ'], value: 'Hello Kitty'},
  {keywords: ['マイメロディ', 'My Melody', 'MY MELODY', 'マイメロ'], value: 'My Melody'},
  {keywords: ['シナモロール', 'Cinnamoroll', 'CINNAMOROLL', 'シナモン'], value: 'Cinnamoroll'},
  {keywords: ['ポムポムプリン', 'Pompompurin', 'POMPOMPURIN', 'プリン'], value: 'Pompompurin'},
  {keywords: ['クロミ', 'Kuromi', 'KUROMI'], value: 'Kuromi'},
  // サンエックス
  {keywords: ['リラックマ', 'Rilakkuma', 'RILAKKUMA'], value: 'Rilakkuma'},
  {keywords: ['すみっコぐらし', 'Sumikko Gurashi', 'SUMIKKO'], value: 'Sumikko Gurashi'},
  // ポケモン
  {keywords: ['ピカチュウ', 'Pikachu', 'PIKACHU'], value: 'Pikachu'},
  {keywords: ['イーブイ', 'Eevee', 'EEVEE'], value: 'Eevee'},
  {keywords: ['ミュウ', 'Mew', 'MEW'], value: 'Mew'},
  {keywords: ['リザードン', 'Charizard', 'CHARIZARD'], value: 'Charizard'},
  // ディズニー
  {keywords: ['ミッキー', 'Mickey', 'MICKEY'], value: 'Mickey Mouse'},
  {keywords: ['ミニー', 'Minnie', 'MINNIE'], value: 'Minnie Mouse'},
  {keywords: ['ダッフィー', 'Duffy', 'DUFFY'], value: 'Duffy'},
  {keywords: ['シェリーメイ', 'ShellieMay', 'SHELLIEMAY'], value: 'ShellieMay'},
  {keywords: ['ジェラトーニ', 'Gelatoni', 'GELATONI'], value: 'Gelatoni'},
  {keywords: ['プーさん', 'Winnie the Pooh', 'POOH', 'Pooh'], value: 'Winnie the Pooh'},
  // スヌーピー
  {keywords: ['スヌーピー', 'Snoopy', 'SNOOPY'], value: 'Snoopy'},
  // モンチッチ
  {keywords: ['モンチッチ', 'Monchhichi', 'MONCHHICHI'], value: 'Monchhichi'},
  // アニメ・ゲームコラボ（ドルフィードリーム等）
  {keywords: ['初音ミク', 'Hatsune Miku', 'HATSUNE MIKU', 'ミク'], value: 'Hatsune Miku'},
  {keywords: ['セーラームーン', 'Sailor Moon', 'SAILOR MOON'], value: 'Sailor Moon'},
  // ソニーエンジェル
  {keywords: ['ソニーエンジェル', 'Sonny Angel', 'SONNY ANGEL'], value: 'Sonny Angel'},
  // かえるのピクルス
  {keywords: ['ピクルス', 'Pickles the Frog', 'PICKLES'], value: 'Pickles the Frog'},
  // もちねこ
  {keywords: ['もちねこ', 'Mochineko'], value: 'Mochineko'},
];

// アニメ・漫画・ゲーム フランチャイズ辞書
var IS_FRANCHISE_PATTERNS = [
  // === 少年ジャンプ系 ===
  {keywords: ['ワンピース', 'ONE PIECE', 'One Piece', 'ルフィ', 'ゾロ', 'ナミ', 'サンジ', 'チョッパー'], value: 'One Piece', country: 'Japan'},
  {keywords: ['ドラゴンボール', 'DRAGON BALL', 'Dragon Ball', '悟空', 'ベジータ', 'フリーザ'], value: 'Dragon Ball', country: 'Japan'},
  {keywords: ['ナルト', 'NARUTO', 'Naruto', 'BORUTO', 'ボルト'], value: 'Naruto', country: 'Japan'},
  {keywords: ['鬼滅の刃', 'DEMON SLAYER', 'Demon Slayer', 'Kimetsu', '炭治郎', '禰豆子', '煉獄'], value: 'Demon Slayer', country: 'Japan'},
  {keywords: ['呪術廻戦', 'JUJUTSU KAISEN', 'Jujutsu Kaisen', '虎杖', '五条', '宿儺'], value: 'Jujutsu Kaisen', country: 'Japan'},
  {keywords: ['僕のヒーローアカデミア', 'MY HERO ACADEMIA', 'ヒロアカ', 'Boku no Hero'], value: 'My Hero Academia', country: 'Japan'},
  {keywords: ['ブリーチ', 'BLEACH', 'Bleach', '黒崎一護'], value: 'Bleach', country: 'Japan'},
  {keywords: ['ハンターハンター', 'HUNTER X HUNTER', 'Hunter x Hunter', 'HxH', 'ゴン', 'キルア'], value: 'Hunter x Hunter', country: 'Japan'},
  {keywords: ['スラムダンク', 'SLAM DUNK', 'Slam Dunk'], value: 'Slam Dunk', country: 'Japan'},
  {keywords: ['チェンソーマン', 'CHAINSAW MAN', 'Chainsaw Man', 'デンジ', 'マキマ', 'パワー'], value: 'Chainsaw Man', country: 'Japan'},
  {keywords: ['SPY×FAMILY', 'スパイファミリー', 'Spy x Family', 'SPY FAMILY', 'アーニャ'], value: 'Spy x Family', country: 'Japan'},
  {keywords: ['キングダム', 'KINGDOM', 'Kingdom'], value: 'Kingdom', country: 'Japan'},
  {keywords: ['ハイキュー', 'HAIKYU', 'Haikyu'], value: 'Haikyu!!', country: 'Japan'},
  {keywords: ['黒子のバスケ', 'KUROKO', 'Kuroko'], value: "Kuroko's Basketball", country: 'Japan'},
  {keywords: ['銀魂', 'GINTAMA', 'Gintama'], value: 'Gintama', country: 'Japan'},
  // === ガンダム ===
  {keywords: ['ガンダム', 'GUNDAM', 'Gundam', 'ガンプラ'], value: 'Gundam', country: 'Japan'},
  // === エヴァンゲリオン ===
  {keywords: ['エヴァンゲリオン', 'EVANGELION', 'Evangelion', 'エヴァ', 'EVA'], value: 'Evangelion', country: 'Japan'},
  // === ジブリ ===
  {keywords: ['ジブリ', 'GHIBLI', 'Ghibli', 'トトロ', '千と千尋', 'もののけ姫', 'ハウル', 'ナウシカ'], value: 'Studio Ghibli', country: 'Japan'},
  // === その他人気アニメ ===
  {keywords: ['進撃の巨人', 'ATTACK ON TITAN', 'Attack on Titan', 'Shingeki'], value: 'Attack on Titan', country: 'Japan'},
  {keywords: ['ソードアートオンライン', 'SWORD ART ONLINE', 'SAO'], value: 'Sword Art Online', country: 'Japan'},
  {keywords: ['Re:ゼロ', 'RE:ZERO', 'Re:Zero', 'リゼロ', 'レム', 'ラム'], value: 'Re:Zero', country: 'Japan'},
  {keywords: ['Fate', 'FATE', 'フェイト', 'セイバー'], value: 'Fate', country: 'Japan'},
  {keywords: ['初音ミク', 'HATSUNE MIKU', 'Hatsune Miku', 'ミク', 'ボーカロイド', 'VOCALOID'], value: 'Vocaloid', country: 'Japan'},
  {keywords: ['推しの子', 'OSHI NO KO', 'Oshi no Ko'], value: 'Oshi no Ko', country: 'Japan'},
  {keywords: ['葬送のフリーレン', 'FRIEREN', 'Frieren'], value: 'Frieren', country: 'Japan'},
  {keywords: ['東京リベンジャーズ', 'TOKYO REVENGERS', 'Tokyo Revengers'], value: 'Tokyo Revengers', country: 'Japan'},
  {keywords: ['ラブライブ', 'LOVE LIVE', 'Love Live'], value: 'Love Live!', country: 'Japan'},
  {keywords: ['けいおん', 'K-ON', 'K-On'], value: 'K-On!', country: 'Japan'},
  {keywords: ['まどかマギカ', 'MADOKA MAGICA', 'Madoka Magica', 'まどマギ'], value: 'Puella Magi Madoka Magica', country: 'Japan'},
  {keywords: ['五等分の花嫁', 'QUINTESSENTIAL QUINTUPLETS', 'Quintuplets', '五等分'], value: 'The Quintessential Quintuplets', country: 'Japan'},
  // === ゲーム系 ===
  {keywords: ['原神', 'GENSHIN', 'Genshin Impact'], value: 'Genshin Impact', country: 'China'},
  {keywords: ['崩壊スターレイル', 'HONKAI STAR RAIL', 'Honkai Star Rail'], value: 'Honkai: Star Rail', country: 'China'},
  {keywords: ['アークナイツ', 'ARKNIGHTS', 'Arknights'], value: 'Arknights', country: 'China'},
  {keywords: ['ファイナルファンタジー', 'FINAL FANTASY', 'Final Fantasy', 'FF'], value: 'Final Fantasy', country: 'Japan'},
  {keywords: ['ペルソナ', 'PERSONA', 'Persona'], value: 'Persona', country: 'Japan'},
  {keywords: ['NieR', 'ニーア', 'NIER', 'ニーアオートマタ', '2B'], value: 'NieR', country: 'Japan'},
  // === ポケモン ===
  {keywords: ['ポケモン', 'POKEMON', 'Pokemon', 'ピカチュウ'], value: 'Pokemon', country: 'Japan'},
  // === 特撮 ===
  {keywords: ['ウルトラマン', 'ULTRAMAN', 'Ultraman'], value: 'Ultraman', country: 'Japan'},
  {keywords: ['仮面ライダー', 'KAMEN RIDER', 'Kamen Rider', 'Masked Rider'], value: 'Kamen Rider', country: 'Japan'},
  {keywords: ['ゴジラ', 'GODZILLA', 'Godzilla'], value: 'Godzilla', country: 'Japan'},
  // === アメリカ系 ===
  {keywords: ['マーベル', 'MARVEL', 'Marvel', 'アベンジャーズ', 'Avengers', 'スパイダーマン', 'Spider-Man', 'アイアンマン'], value: 'Marvel', country: 'USA'},
  {keywords: ['DC', 'バットマン', 'Batman', 'スーパーマン', 'Superman', 'ジョーカー', 'Joker'], value: 'DC Comics', country: 'USA'},
  {keywords: ['スターウォーズ', 'STAR WARS', 'Star Wars', 'ダースベイダー', 'Darth Vader', 'ヨーダ'], value: 'Star Wars', country: 'USA'},
  {keywords: ['トランスフォーマー', 'TRANSFORMERS', 'Transformers', 'オプティマス'], value: 'Transformers', country: 'USA'},
  {keywords: ['ディズニー', 'DISNEY', 'Disney', 'ミッキー', 'Mickey'], value: 'Disney', country: 'USA'},
];

// アニメ・漫画キャラクター辞書（フランチャイズ連動）
var IS_FIGURE_CHARACTER_PATTERNS = [
  // One Piece
  {keywords: ['ルフィ', 'Luffy', 'LUFFY', 'モンキー・D'], value: 'Monkey D. Luffy'},
  {keywords: ['ゾロ', 'Zoro', 'ZORO', 'ロロノア'], value: 'Roronoa Zoro'},
  {keywords: ['ナミ', 'Nami', 'NAMI'], value: 'Nami'},
  {keywords: ['サンジ', 'Sanji', 'SANJI'], value: 'Sanji'},
  {keywords: ['チョッパー', 'Chopper', 'CHOPPER'], value: 'Tony Tony Chopper'},
  {keywords: ['エース', 'Ace', 'ACE', 'ポートガス'], value: 'Portgas D. Ace'},
  {keywords: ['ハンコック', 'Hancock', 'HANCOCK', 'ボア'], value: 'Boa Hancock'},
  // Dragon Ball
  {keywords: ['悟空', 'Goku', 'GOKU', '孫悟空', 'カカロット'], value: 'Son Goku'},
  {keywords: ['ベジータ', 'Vegeta', 'VEGETA'], value: 'Vegeta'},
  {keywords: ['フリーザ', 'Frieza', 'FRIEZA', 'Freeza'], value: 'Frieza'},
  {keywords: ['悟飯', 'Gohan', 'GOHAN'], value: 'Son Gohan'},
  {keywords: ['トランクス', 'Trunks', 'TRUNKS'], value: 'Trunks'},
  {keywords: ['ブロリー', 'Broly', 'BROLY'], value: 'Broly'},
  // Naruto
  {keywords: ['ナルト', 'Naruto', 'NARUTO', 'うずまきナルト'], value: 'Naruto Uzumaki'},
  {keywords: ['サスケ', 'Sasuke', 'SASUKE', 'うちはサスケ'], value: 'Sasuke Uchiha'},
  {keywords: ['カカシ', 'Kakashi', 'KAKASHI'], value: 'Kakashi Hatake'},
  {keywords: ['イタチ', 'Itachi', 'ITACHI'], value: 'Itachi Uchiha'},
  // Demon Slayer
  {keywords: ['炭治郎', 'Tanjiro', 'TANJIRO'], value: 'Tanjiro Kamado'},
  {keywords: ['禰豆子', 'Nezuko', 'NEZUKO'], value: 'Nezuko Kamado'},
  {keywords: ['煉獄', 'Rengoku', 'RENGOKU'], value: 'Kyojuro Rengoku'},
  {keywords: ['胡蝶しのぶ', 'Shinobu', 'SHINOBU'], value: 'Shinobu Kocho'},
  // Jujutsu Kaisen
  {keywords: ['虎杖', 'Itadori', 'ITADORI'], value: 'Yuji Itadori'},
  {keywords: ['五条', 'Gojo', 'GOJO', '五条悟'], value: 'Satoru Gojo'},
  {keywords: ['宿儺', 'Sukuna', 'SUKUNA'], value: 'Ryomen Sukuna'},
  // Evangelion
  {keywords: ['綾波レイ', 'Rei Ayanami', 'REI', '綾波'], value: 'Rei Ayanami'},
  {keywords: ['アスカ', 'Asuka', 'ASUKA'], value: 'Asuka Langley'},
  {keywords: ['シンジ', 'Shinji', 'SHINJI', '碇シンジ'], value: 'Shinji Ikari'},
  // Gundam
  {keywords: ['RX-78', 'ガンダム', 'Gundam RX'], value: 'RX-78-2 Gundam'},
  {keywords: ['シャア', 'Char', 'CHAR', 'シャア専用'], value: 'Char Aznable'},
  {keywords: ['ザク', 'Zaku', 'ZAKU'], value: 'Zaku II'},
  // Chainsaw Man
  {keywords: ['デンジ', 'Denji', 'DENJI'], value: 'Denji'},
  {keywords: ['マキマ', 'Makima', 'MAKIMA'], value: 'Makima'},
  {keywords: ['パワー', 'Power', 'POWER'], value: 'Power'},
  // Spy x Family
  {keywords: ['アーニャ', 'Anya', 'ANYA'], value: 'Anya Forger'},
  {keywords: ['ロイド', 'Loid', 'LOID', 'ロイドフォージャー'], value: 'Loid Forger'},
  {keywords: ['ヨル', 'Yor', 'YOR', 'ヨルフォージャー'], value: 'Yor Forger'},
  // Re:Zero
  {keywords: ['レム', 'Rem', 'REM'], value: 'Rem'},
  {keywords: ['ラム', 'Ram', 'RAM'], value: 'Ram'},
  {keywords: ['エミリア', 'Emilia', 'EMILIA'], value: 'Emilia'},
  // Fate
  {keywords: ['セイバー', 'Saber', 'SABER', 'アルトリア'], value: 'Saber (Artoria)'},
  // NieR
  {keywords: ['2B', 'ヨルハ二号B型'], value: '2B (YoRHa No.2 Type B)'},
  // Attack on Titan
  {keywords: ['エレン', 'Eren', 'EREN'], value: 'Eren Yeager'},
  {keywords: ['リヴァイ', 'Levi', 'LEVI'], value: 'Levi Ackerman'},
  {keywords: ['ミカサ', 'Mikasa', 'MIKASA'], value: 'Mikasa Ackerman'},
  // Godzilla / Ultraman / Kamen Rider
  {keywords: ['ゴジラ', 'Godzilla', 'GODZILLA'], value: 'Godzilla'},
  {keywords: ['ウルトラマン', 'Ultraman', 'ULTRAMAN'], value: 'Ultraman'},
  {keywords: ['仮面ライダー', 'Kamen Rider', 'KAMEN RIDER'], value: 'Kamen Rider'},
  // Vocaloid
  {keywords: ['初音ミク', 'Hatsune Miku', 'HATSUNE MIKU', 'ミク'], value: 'Hatsune Miku'},
  // Frieren
  {keywords: ['フリーレン', 'Frieren', 'FRIEREN'], value: 'Frieren'},
  {keywords: ['フェルン', 'Fern', 'FERN'], value: 'Fern'},
  // Oshi no Ko
  {keywords: ['アイ', 'Ai', 'AI', '星野アイ'], value: 'Ai Hoshino'},
  // Marvel
  {keywords: ['スパイダーマン', 'Spider-Man', 'SPIDER-MAN', 'SPIDERMAN'], value: 'Spider-Man'},
  {keywords: ['アイアンマン', 'Iron Man', 'IRON MAN', 'IRONMAN'], value: 'Iron Man'},
  // DC
  {keywords: ['バットマン', 'Batman', 'BATMAN'], value: 'Batman'},
  // Star Wars
  {keywords: ['ダースベイダー', 'Darth Vader', 'DARTH VADER'], value: 'Darth Vader'},
  {keywords: ['ヨーダ', 'Yoda', 'YODA'], value: 'Yoda'},
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
  'フィルムカメラ': 'Film Camera',
  'コンパクトカメラ': 'Compact Camera',
  'コンデジ': 'Compact Camera',
  '中判カメラ': 'Medium Format Camera',
  'レンジファインダー': 'Rangefinder Camera',
  '二眼レフ': 'TLR',
  '蛇腹カメラ': 'Folding',
  'インスタントカメラ': 'Instant Camera',
  'アクションカメラ': 'Action Camera',
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
  'Pipe': 'Tobacco Pipe',
  // Watch Parts
  'ウォッチパーツ': 'Watch Part',
  '時計パーツ': 'Watch Part',
  '時計部品': 'Watch Part',
  // Dolls & Plush
  'ドール': 'Fashion Doll',
  'ぬいぐるみ': 'Plush Toy',
  'テディベア': 'Plush Toy',
  'プーリップ': 'Fashion Doll',
  'ブライス': 'Fashion Doll',
  'ドルフィー': 'BJD',
  'BJD': 'BJD',
  'バービー': 'Fashion Doll',
  'リカちゃん': 'Fashion Doll',
  'モンチッチ': 'Plush Toy',
  'ベアブリック': 'Art Toy',
  'シュタイフ': 'Plush Toy',
  'ジェリーキャット': 'Plush Toy',
  'スクイッシュマロ': 'Plush Toy',
  '人形': 'Doll',

  // Hats
  '帽子': 'Hat',
  'キャップ': 'Baseball Cap',
  'ハット': 'Hat',
  'ベースボールキャップ': 'Baseball Cap',
  'スナップバック': 'Baseball Cap',
  'バケットハット': 'Bucket Hat',
  'ビーニー': 'Beanie',
  'ニット帽': 'Beanie',
  'トラッカーハット': 'Trucker Hat',
  'ベレー帽': 'Beret',
  'フェドーラ': 'Fedora',
  'パナマハット': 'Panama Hat',
  'ダッドハット': 'Dad Hat',
  'サンバイザー': 'Visor',
  'ハンチング': 'Flat Cap',
  'キャスケット': 'Newsboy Cap'
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
  'フィギュア': 'Collectibles', 'コレクティブル': 'Collectibles', // → Figuresで上書き
  'アンティーク': 'Collectibles', 'ヴィンテージ': 'Collectibles', '骨董品': 'Collectibles', '人形': 'Dolls & Plush',
  // Pipes (Tobacco Pipes)
  'パイプ': 'Pipes', '喫煙パイプ': 'Pipes', '煙管': 'Pipes', 'キセル': 'Pipes', 'パイプ・喫煙具': 'Pipes',
  // Watch Parts
  'ウォッチパーツ': 'Watch Parts', '時計パーツ': 'Watch Parts', '時計部品': 'Watch Parts',
  // Sunglasses
  'サングラス': 'Sunglasses', 'メガネ': 'Sunglasses', '眼鏡': 'Sunglasses',
  // Video Game Consoles（「ゲーム機」は「ゲーム」より長いので先にマッチする）
  'ゲーム機': 'Video Game Consoles',
  // Fishing Reels
  'リール': 'Fishing Reels',
  // Video Games
  'ゲーム': 'Video Games', 'ゲームソフト': 'Video Games', 'テレビゲーム': 'Video Games',
  'Switch': 'Video Games', 'PS5': 'Video Games', 'PS4': 'Video Games', 'PS3': 'Video Games', 'PS2': 'Video Games',
  'Xbox': 'Video Games', 'ファミコン': 'Video Games', 'スーファミ': 'Video Games',
  'ゲームボーイ': 'Video Games', 'Nintendo': 'Video Games', 'PlayStation': 'Video Games',
  // Soap
  '石鹸': 'Soap', 'せっけん': 'Soap', 'ソープ': 'Soap', '石けん': 'Soap',
  // Dolls & Plush
  'ドール': 'Dolls & Plush', 'ぬいぐるみ': 'Dolls & Plush', 'テディベア': 'Dolls & Plush',
  'プーリップ': 'Dolls & Plush', 'ブライス': 'Dolls & Plush', 'ドルフィー': 'Dolls & Plush',
  'BJD': 'Dolls & Plush', 'バービー': 'Dolls & Plush', 'リカちゃん': 'Dolls & Plush',
  'ベアブリック': 'Dolls & Plush', 'シュタイフ': 'Dolls & Plush', 'ジェリーキャット': 'Dolls & Plush',
  'スクイッシュマロ': 'Dolls & Plush', 'モンチッチ': 'Dolls & Plush'
};

// Hats
IS_TAG_TO_CATEGORY['帽子'] = 'Hats'; IS_TAG_TO_CATEGORY['キャップ'] = 'Hats'; IS_TAG_TO_CATEGORY['ハット'] = 'Hats';
IS_TAG_TO_CATEGORY['ビーニー'] = 'Hats'; IS_TAG_TO_CATEGORY['バケットハット'] = 'Hats'; IS_TAG_TO_CATEGORY['スナップバック'] = 'Hats';
IS_TAG_TO_CATEGORY['ベースボールキャップ'] = 'Hats'; IS_TAG_TO_CATEGORY['トラッカーハット'] = 'Hats';
IS_TAG_TO_CATEGORY['ニット帽'] = 'Hats'; IS_TAG_TO_CATEGORY['ベレー帽'] = 'Hats'; IS_TAG_TO_CATEGORY['フェドーラ'] = 'Hats';
IS_TAG_TO_CATEGORY['パナマハット'] = 'Hats'; IS_TAG_TO_CATEGORY['キャスケット'] = 'Hats'; IS_TAG_TO_CATEGORY['ハンチング'] = 'Hats';
IS_TAG_TO_CATEGORY['ダッドハット'] = 'Hats'; IS_TAG_TO_CATEGORY['サンバイザー'] = 'Hats';

// Musical Instruments
IS_TAG_TO_CATEGORY['楽器'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['ギター'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['ベース'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['キーボード'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['シンセサイザー'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['バイオリン'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['フルート'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['サックス'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['トランペット'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['ドラム'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['ウクレレ'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['ハーモニカ'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['エフェクター'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['アンプ'] = 'Musical Instruments';

// Pens & Writing Instruments
IS_TAG_TO_CATEGORY['万年筆'] = 'Pens'; IS_TAG_TO_CATEGORY['ボールペン'] = 'Pens';
IS_TAG_TO_CATEGORY['ペン'] = 'Pens'; IS_TAG_TO_CATEGORY['シャープペンシル'] = 'Pens';
IS_TAG_TO_CATEGORY['筆記具'] = 'Pens'; IS_TAG_TO_CATEGORY['メカニカルペンシル'] = 'Pens';

// Wallets
IS_TAG_TO_CATEGORY['財布'] = 'Wallets'; IS_TAG_TO_CATEGORY['長財布'] = 'Wallets';
IS_TAG_TO_CATEGORY['二つ折り財布'] = 'Wallets'; IS_TAG_TO_CATEGORY['コインケース'] = 'Wallets';
IS_TAG_TO_CATEGORY['カードケース'] = 'Wallets'; IS_TAG_TO_CATEGORY['マネークリップ'] = 'Wallets';

// Lighters
IS_TAG_TO_CATEGORY['ライター'] = 'Lighters'; IS_TAG_TO_CATEGORY['Zippo'] = 'Lighters';
IS_TAG_TO_CATEGORY['ジッポ'] = 'Lighters'; IS_TAG_TO_CATEGORY['オイルライター'] = 'Lighters';
IS_TAG_TO_CATEGORY['ガスライター'] = 'Lighters';

// Art
IS_TAG_TO_CATEGORY['絵画'] = 'Art'; IS_TAG_TO_CATEGORY['版画'] = 'Art';
IS_TAG_TO_CATEGORY['リトグラフ'] = 'Art'; IS_TAG_TO_CATEGORY['油絵'] = 'Art';
IS_TAG_TO_CATEGORY['水彩画'] = 'Art'; IS_TAG_TO_CATEGORY['掛軸'] = 'Art';
// 浮世絵・版画・木版画・リトグラフ → Printsで上書き
IS_TAG_TO_CATEGORY['木版画'] = 'Art'; IS_TAG_TO_CATEGORY['浮世絵'] = 'Art';

// Pottery & Ceramics（茶碗はDinnerwareから上書き: 陶器としての出品が主）
IS_TAG_TO_CATEGORY['陶磁器'] = 'Pottery'; IS_TAG_TO_CATEGORY['陶器'] = 'Pottery';
IS_TAG_TO_CATEGORY['磁器'] = 'Pottery'; IS_TAG_TO_CATEGORY['焼物'] = 'Pottery';
// 茶道具 → Tea Ceremonyで上書き
IS_TAG_TO_CATEGORY['茶道具'] = 'Pottery'; IS_TAG_TO_CATEGORY['茶碗'] = 'Pottery';
// 急須 → Tetsubinで上書き
IS_TAG_TO_CATEGORY['急須'] = 'Pottery'; IS_TAG_TO_CATEGORY['壺'] = 'Pottery';

// Belts
IS_TAG_TO_CATEGORY['ベルト'] = 'Belts'; IS_TAG_TO_CATEGORY['レザーベルト'] = 'Belts';
IS_TAG_TO_CATEGORY['ベルトバックル'] = 'Belt Buckles';

// Golf Heads
IS_TAG_TO_CATEGORY['ゴルフヘッド'] = 'Golf Heads';

// Kimono
IS_TAG_TO_CATEGORY['着物'] = 'Kimono'; IS_TAG_TO_CATEGORY['和装'] = 'Kimono';
IS_TAG_TO_CATEGORY['振袖'] = 'Kimono'; IS_TAG_TO_CATEGORY['留袖'] = 'Kimono';
IS_TAG_TO_CATEGORY['訪問着'] = 'Kimono'; IS_TAG_TO_CATEGORY['浴衣'] = 'Kimono';
IS_TAG_TO_CATEGORY['帯'] = 'Kimono'; IS_TAG_TO_CATEGORY['袴'] = 'Kimono';

// Japanese Swords
IS_TAG_TO_CATEGORY['日本刀'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['刀'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['脇差'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['短刀'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['太刀'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['刀装具'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['鍔'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['目貫'] = 'Japanese Swords';

// Tea Ceremony（茶道具をPotteryから上書き）
IS_TAG_TO_CATEGORY['茶道具'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['茶入'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['棗'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['茶杓'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['水指'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['建水'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['風炉'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['釜'] = 'Tea Ceremony';

// Bonsai
IS_TAG_TO_CATEGORY['盆栽'] = 'Bonsai'; IS_TAG_TO_CATEGORY['盆栽鉢'] = 'Bonsai';
IS_TAG_TO_CATEGORY['盆器'] = 'Bonsai'; IS_TAG_TO_CATEGORY['水石'] = 'Bonsai';

// Prints（浮世絵・版画・木版画・リトグラフをArtから上書き）
IS_TAG_TO_CATEGORY['浮世絵'] = 'Prints'; IS_TAG_TO_CATEGORY['版画'] = 'Prints';
IS_TAG_TO_CATEGORY['木版画'] = 'Prints'; IS_TAG_TO_CATEGORY['リトグラフ'] = 'Prints';
IS_TAG_TO_CATEGORY['シルクスクリーン'] = 'Prints';

// Buddhist Art
IS_TAG_TO_CATEGORY['仏像'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['仏具'] = 'Buddhist Art';
IS_TAG_TO_CATEGORY['仏教美術'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['神具'] = 'Buddhist Art';

// Tetsubin（急須をPotteryから上書き）
IS_TAG_TO_CATEGORY['鉄瓶'] = 'Tetsubin'; IS_TAG_TO_CATEGORY['銀瓶'] = 'Tetsubin';
IS_TAG_TO_CATEGORY['南部鉄器'] = 'Tetsubin'; IS_TAG_TO_CATEGORY['茶釜'] = 'Tetsubin';
IS_TAG_TO_CATEGORY['急須'] = 'Tetsubin';

// Golf
IS_TAG_TO_CATEGORY['ゴルフ'] = 'Golf'; IS_TAG_TO_CATEGORY['ゴルフクラブ'] = 'Golf';
IS_TAG_TO_CATEGORY['ドライバー'] = 'Golf'; IS_TAG_TO_CATEGORY['アイアン'] = 'Golf';
IS_TAG_TO_CATEGORY['パター'] = 'Golf'; IS_TAG_TO_CATEGORY['ウェッジ'] = 'Golf';

// Tennis
IS_TAG_TO_CATEGORY['テニス'] = 'Tennis'; IS_TAG_TO_CATEGORY['テニスラケット'] = 'Tennis';
IS_TAG_TO_CATEGORY['ラケット'] = 'Tennis';

// Baseball
IS_TAG_TO_CATEGORY['野球'] = 'Baseball'; IS_TAG_TO_CATEGORY['グローブ'] = 'Baseball';
IS_TAG_TO_CATEGORY['グラブ'] = 'Baseball'; IS_TAG_TO_CATEGORY['バット'] = 'Baseball';
IS_TAG_TO_CATEGORY['ミット'] = 'Baseball';

// Japanese Instruments
IS_TAG_TO_CATEGORY['三味線'] = 'Japanese Instruments'; IS_TAG_TO_CATEGORY['尺八'] = 'Japanese Instruments';
IS_TAG_TO_CATEGORY['琴'] = 'Japanese Instruments'; IS_TAG_TO_CATEGORY['篠笛'] = 'Japanese Instruments';
IS_TAG_TO_CATEGORY['太鼓'] = 'Japanese Instruments'; IS_TAG_TO_CATEGORY['和太鼓'] = 'Japanese Instruments';

// Fishing Rods
IS_TAG_TO_CATEGORY['釣竿'] = 'Fishing Rods'; IS_TAG_TO_CATEGORY['ロッド'] = 'Fishing Rods';
IS_TAG_TO_CATEGORY['竿'] = 'Fishing Rods';

// RC & Models
IS_TAG_TO_CATEGORY['ラジコン'] = 'RC & Models'; IS_TAG_TO_CATEGORY['RC'] = 'RC & Models';
IS_TAG_TO_CATEGORY['模型'] = 'RC & Models'; IS_TAG_TO_CATEGORY['プラモデル'] = 'RC & Models';
IS_TAG_TO_CATEGORY['ミニ四駆'] = 'RC & Models';

// Anime
IS_TAG_TO_CATEGORY['アニメ'] = 'Anime'; IS_TAG_TO_CATEGORY['アニメグッズ'] = 'Anime';
IS_TAG_TO_CATEGORY['漫画'] = 'Anime'; IS_TAG_TO_CATEGORY['マンガ'] = 'Anime';

// Figures（フィギュアをCollectiblesから上書き）
IS_TAG_TO_CATEGORY['フィギュア'] = 'Figures'; IS_TAG_TO_CATEGORY['アクションフィギュア'] = 'Figures';
IS_TAG_TO_CATEGORY['スタチュー'] = 'Figures';

// Stamps
IS_TAG_TO_CATEGORY['切手'] = 'Stamps'; IS_TAG_TO_CATEGORY['記念切手'] = 'Stamps';

// Coins
IS_TAG_TO_CATEGORY['コイン'] = 'Coins'; IS_TAG_TO_CATEGORY['古銭'] = 'Coins';
IS_TAG_TO_CATEGORY['硬貨'] = 'Coins'; IS_TAG_TO_CATEGORY['紙幣'] = 'Coins';
IS_TAG_TO_CATEGORY['メダル'] = 'Coins';

// Records
IS_TAG_TO_CATEGORY['レコード'] = 'Records'; IS_TAG_TO_CATEGORY['LP'] = 'Records';
IS_TAG_TO_CATEGORY['EP'] = 'Records'; IS_TAG_TO_CATEGORY['CD'] = 'Records';
IS_TAG_TO_CATEGORY['カセット'] = 'Records';

// ==============================
// カテゴリ別 出力フィールド定義（5-8フィールド、順序固定）
// ==============================
var IS_CATEGORY_FIELDS = {
  'Watches':       ['Brand', 'Model', 'Display', 'Movement', 'Case Material', 'Case Size', 'Wrist Size', 'Dial Color', 'Department', 'Country of Origin'],
  'Rings':         ['Brand', 'Designer', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country of Origin'],
  'Necklaces':     ['Style', 'Brand', 'Type', 'Color', 'Metal', 'Main Stone', 'Main Stone Color', 'Pendant Shape', 'Secondary Stone', 'Theme'],
  'Bracelets':     ['Brand', 'Designer', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country of Origin'],
  'Earrings':      ['Brand', 'Designer', 'Metal', 'Metal Purity', 'Main Stone', 'Type', 'Country of Origin'],
  'Handbags':      ['Brand', 'Style', 'Exterior Material', 'Exterior Color', 'Department', 'Country of Origin'],
  'Clothing':      ['Brand', 'Type', 'Department', 'Color', 'Material', 'Country of Origin'],
  'Shoes':         ['Brand', 'Type', 'Department', 'Color', 'Material', 'Country of Origin'],
  'Cameras':       ['Brand', 'Model', 'Type', 'Series', 'Color', 'Maximum Resolution', 'Battery Type', 'Features', 'Lens Mount', 'Country of Origin'],
  'Electronics':   ['Brand', 'Type', 'Color', 'Country of Origin'],
  'Trading Cards': ['Game', 'Set', 'Character', 'Card Name', 'Card Number', 'Rarity', 'Finish', 'Graded', 'Professional Grader', 'Grade'],
  'Brooches':      ['Type', 'Brand', 'Material', 'Color', 'Metal', 'Main Stone', 'Main Stone Color', 'Theme', 'Main Stone Shape', 'Country of Origin'],
  'Cufflinks':     ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Material', 'Department', 'Main Stone Color', 'Country of Origin'],
  'Hair Accessories': ['Type', 'Brand', 'Color', 'Material', 'Department', 'Theme', 'Occasion', 'Hair Type', 'Features', 'Country of Origin'],
  'Dinnerware':    ['Brand', 'Material', 'Type', 'Color', 'Pattern', 'Shape', 'Set Includes', 'Number of Place Settings', 'Theme', 'Country of Origin'],
  'Scarves':       ['Brand', 'Type', 'Material', 'Color', 'Size', 'Pattern', 'Country of Origin'],
  'Neckties':      ['Brand', 'Color', 'Material', 'Type', 'Pattern', 'Style', 'Department', 'Item Width', 'Theme', 'Country of Origin'],
  'Handkerchiefs': ['Brand', 'Color', 'Material', 'Pattern', 'Style', 'Country of Origin', 'Gender', 'Occasion'],
  'Tie Accessories': ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Material', 'Department', 'Country of Origin'],
  'Glassware':     ['Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Style', 'Pattern', 'Theme', 'Subject', 'Country of Origin'],
  'Snow Globes':   ['Brand', 'Type', 'Material', 'Subject', 'Occasion', 'Collection', 'Year Manufactured', 'Features', 'Country of Origin'],
  'Boxes':         ['Brand', 'Type', 'Material', 'Color', 'Suitable For', 'Shape', 'Features', 'Lining Material', 'Theme', 'Country of Origin'],
  'Flatware':      ['Brand', 'Type', 'Pattern', 'Composition', 'Style', 'Age', 'Country of Origin'],
  'Baby':          ['Brand', 'Type', 'Material', 'Color', 'Character', 'Country of Origin'],
  'Combs':         ['Type', 'Brand', 'Color', 'Material', 'Theme', 'Department', 'Features', 'Country of Origin'],
  'Key Chains':    ['Brand', 'Material', 'Color', 'Character Family', 'Theme', 'Era', 'Features', 'Country of Origin'],
  'Charms':        ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Theme', 'Pendant Shape', 'Country of Origin'],
  'Collectibles':  ['Brand', 'Character', 'Franchise', 'Type', 'Theme', 'Material', 'Features', 'Size', 'Color', 'Country of Origin'],
  'Pipes':         ['Brand', 'Body Shape', 'Material', 'Filter Size', 'Handmade', 'Country of Origin'],
  'Watch Parts':   ['Brand', 'Part Type', 'Material', 'Compatible Model', 'Size', 'Color', 'Country of Origin'],
  'Sunglasses':  ['Brand', 'Model', 'Frame Color', 'Lens Color', 'Frame Material', 'Style', 'Department', 'Country of Origin'],
  'Video Games': ['Platform', 'Game Name', 'Region Code', 'Genre', 'Character', 'Publisher', 'Rating', 'Language', 'Country of Origin'],
  'Video Game Consoles': ['Brand', 'Platform', 'Model', 'Type', 'Storage Capacity', 'Color', 'Region Code', 'Connectivity', 'Edition', 'Country of Origin'],
  'Fishing Reels': ['Brand', 'Model', 'Reel Type', 'Hand Retrieve', 'Gear Ratio', 'Ball Bearings', 'Line Capacity', 'Fishing Type', 'Fish Species', 'Country of Origin'],
  'Soap':        ['Brand', 'Type', 'Scent', 'Product Line', 'Color', 'Country of Origin'],
  'Dolls & Plush': ['Brand', 'Type', 'Character', 'Size', 'Color', 'Material', 'Country of Origin'],
  'Hats':          ['Brand', 'Style', 'Department', 'Color', 'Material', 'Pattern', 'Season', 'Features', 'Size', 'Country of Origin'],
  'Musical Instruments': ['Brand', 'Type', 'Model', 'Body Color', 'Body Type', 'String Configuration', 'Handedness', 'Model Year', 'Number of Frets', 'Country of Origin'],
  'Pens':          ['Brand', 'Material', 'Ink Color', 'Nib Size', 'Nib Material', 'Type', 'Vintage', 'Features', 'Country of Origin'],
  'Wallets':       ['Brand', 'Type', 'Material', 'Color', 'Style', 'Department', 'Features', 'Theme', 'Country of Origin'],
  'Lighters':      ['Brand', 'Type', 'Material', 'Color', 'Country of Origin'],
  'Art':           ['Artist', 'Production Technique', 'Style', 'Subject', 'Theme', 'Size', 'Material', 'Original/Licensed Reproduction', 'Time Period Produced', 'Country of Origin'],
  'Pottery':       ['Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Style', 'Pattern', 'Theme', 'Country of Origin'],
  'Belts':         ['Brand', 'Type', 'Material', 'Color', 'Size', 'Department', 'Style', 'Theme', 'Country of Origin'],
  'Belt Buckles':  ['Brand', 'Type', 'Material', 'Color', 'Style', 'Department', 'Fits Belt Width', 'Pattern', 'Theme', 'Country of Origin'],
  'Golf Heads':          ['Brand', 'Golf Club Type', 'Loft', 'Handedness', 'Material', 'Model', 'Lie Angle', 'Head Shape', 'Bounce', 'Country of Origin'],
  'Kimono':              ['Brand', 'Type', 'Material', 'Color', 'Style', 'Season', 'Size', 'Country of Origin'],
  'Japanese Swords':     ['Type', 'Blade Material', 'Original/Reproduction', 'Handedness', 'Material', 'Country of Origin'],
  'Tea Ceremony':        ['Type', 'Material', 'Maker', 'Style', 'Country of Origin'],
  'Bonsai':              ['Type', 'Material', 'Size', 'Color', 'Shape', 'Country of Origin'],
  'Prints':              ['Listed By', 'Medium', 'Subject', 'Maker', 'Style', 'Size', 'Country of Origin'],
  'Buddhist Art':        ['Type', 'Material', 'Size', 'Era', 'Country of Origin'],
  'Tetsubin':            ['Brand', 'Type', 'Material', 'Size', 'Country of Origin'],
  'Golf':                ['Brand', 'Golf Club Type', 'Handedness', 'Model', 'Flex', 'Shaft Material', 'Loft', 'Club Number', 'Set Makeup', 'Department'],
  'Tennis':              ['Brand', 'Type', 'Head Size', 'Grip Size', 'String Pattern', 'Weight', 'Country of Origin'],
  'Baseball':            ['Brand', 'Handedness', 'Player Position', 'Size', 'Type', 'Material', 'Color', 'Sport/Activity', 'Country of Origin', 'Model Year'],
  'Japanese Instruments': ['Type', 'Material', 'Size', 'Country of Origin'],
  'Fishing Rods':        ['Brand', 'Rod Type', 'Model', 'Item Length', 'Rod Power', 'Rod Action', 'Fish Species', 'Fishing Type', 'Material', 'Lure Weight'],
  'RC & Models':         ['Brand', 'Type', 'Scale', 'Fuel Type', 'Color', 'Country of Origin'],
  'Anime':               ['Brand', 'Character', 'Franchise', 'Type', 'Material', 'Country of Origin'],
  'Figures':             ['Franchise', 'Character', 'Type', 'Brand', 'Scale', 'Material', 'Theme', 'Original/Licensed Reproduction', 'Series', 'Vintage'],
  'Stamps':              ['Certification', 'Type', 'Year of Issue', 'Topic', 'Quality', 'Country of Origin'],
  'Coins':               ['Certification', 'Denomination', 'Year', 'Composition', 'Grade', 'Country of Origin'],
  'Records':             ['Artist', 'Release Title', 'Genre', 'Record Grading', 'Record Label', 'Format', 'Record Size', 'Release Year', 'Sleeve Grading', 'Country of Origin']
};

// ==============================
// デザイナー辞書（ジュエリー用）
// ==============================
var IS_DESIGNER_DICT = [
  // --- Georg Jensen ---
  {name: 'Vivianna Torun', jp_names: ['トールン', 'VIVIANNA TORUN', 'TORUN', 'ヴィヴィアンナ'], brands: ['Georg Jensen']},
  {name: 'Henning Koppel', jp_names: ['ヘニングコッペル', 'HENNING KOPPEL', 'KOPPEL'], brands: ['Georg Jensen']},
  {name: 'Arno Malinowski', jp_names: ['マリノフスキー', 'ARNO MALINOWSKI', 'MALINOWSKI'], brands: ['Georg Jensen']},
  {name: 'Nanna Ditzel', jp_names: ['ナナディッツェル', 'NANNA DITZEL', 'DITZEL'], brands: ['Georg Jensen', 'Anton Michelsen']},
  {name: 'Harald Nielsen', jp_names: ['ハラルドニールセン', 'HARALD NIELSEN'], brands: ['Georg Jensen']},
  {name: 'Johan Rohde', jp_names: ['ヨハンローデ', 'JOHAN ROHDE', 'ROHDE'], brands: ['Georg Jensen']},
  // --- Tiffany & Co. ---
  {name: 'Elsa Peretti', jp_names: ['エルサペレッティ', 'エルサ ペレッティ', 'ELSA PERETTI', 'PERETTI'], brands: ['Tiffany & Co.']},
  {name: 'Paloma Picasso', jp_names: ['パロマピカソ', 'パロマ ピカソ', 'PALOMA PICASSO'], brands: ['Tiffany & Co.']},
  {name: 'Jean Schlumberger', jp_names: ['シュランバージェ', 'JEAN SCHLUMBERGER', 'SCHLUMBERGER'], brands: ['Tiffany & Co.']},
  // --- Lapponia ---
  {name: 'Bjorn Weckstrom', jp_names: ['ヴェクストロム', 'ビョルンヴェクストロム', 'BJORN WECKSTROM', 'WECKSTROM'], brands: ['Lapponia']},
  // --- David Andersen ---
  {name: 'Willy Winnaess', jp_names: ['ウィリーヴィナエス', 'WILLY WINNAESS', 'WINNAESS'], brands: ['David Andersen']},
  {name: 'Bjorn Sigurd Ostern', jp_names: ['オステルン', 'BJORN SIGURD OSTERN', 'OSTERN'], brands: ['David Andersen']},
  {name: 'Uni David-Andersen', jp_names: ['ウニダヴィッドアンデルセン', 'UNI DAVID-ANDERSEN', 'UNI DAVID ANDERSEN'], brands: ['David Andersen']},
  // --- Anton Michelsen ---
  {name: 'Gertrud Engel', jp_names: ['ゲルトルードエンゲル', 'GERTRUD ENGEL', 'ENGEL'], brands: ['Anton Michelsen']},
  // --- Hans Hansen ---
  {name: 'Bent Gabrielsen', jp_names: ['ベントガブリエルセン', 'BENT GABRIELSEN', 'GABRIELSEN'], brands: ['Hans Hansen', 'Georg Jensen']},
  // --- J. Tostrup ---
  {name: 'Grete Prytz Kittelsen', jp_names: ['グレーテプリッツ', 'GRETE PRYTZ KITTELSEN', 'GRETE PRYTZ', 'PRYTZ'], brands: ['J. Tostrup']},
  // --- 独立系デザイナー（Brand欄にも入りうる） ---
  {name: 'Pentti Sarpaneva', jp_names: ['ペンッティサルパネヴァ', 'PENTTI SARPANEVA', 'SARPANEVA'], brands: ['Kalevala Koru', 'Lapponia']},
  {name: 'Jorma Laine', jp_names: ['ヨルマライネ', 'JORMA LAINE'], brands: ['Kalevala Koru']}
];

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
  {keywords: ['銅', 'Copper', 'Brass', '真鍮'], value: 'Base Metal'},
  {keywords: ['Silver', 'シルバー'], value: 'Sterling Silver'}
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
  {keywords: ['ラピスラズリ', 'ラピス', 'Lapis Lazuli', 'Lapis'], value: 'Lapis Lazuli'},
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
  {keywords: ['コーンコブ', 'Corn Cob', 'CORN COB', 'コーン'], value: 'Corn Cob'},
  // Dolls & Plush 素材
  {keywords: ['モヘア', 'Mohair', 'MOHAIR'], value: 'Mohair'},
  {keywords: ['プラッシュ', 'Plush', 'PLUSH'], value: 'Plush'},
  {keywords: ['フェルト', 'Felt', 'FELT'], value: 'Felt'},
  {keywords: ['ベルベット', 'Velvet', 'VELVET'], value: 'Velvet'},
  {keywords: ['ABS', 'ABS樹脂'], value: 'ABS'},
  {keywords: ['ソフトビニール', 'Soft Vinyl', 'ソフビ'], value: 'Soft Vinyl'}
];

// (Card game patterns moved to CardPatterns.gs)

// ==============================
// ゲーム プラットフォーム判定パターン
// ==============================
var IS_PLATFORM_PATTERNS = [
  {keywords: ['SFC', 'Super Famicom', 'スーパーファミコン', 'スーファミ', 'SNES'], value: 'Nintendo Super Nintendo Entertainment System (Super Famicom)'},
  {keywords: ['FC', 'Famicom', 'ファミコン', 'NES', 'ファミリーコンピュータ'], value: 'Nintendo Entertainment System (NES/Famicom)'},
  {keywords: ['N64', 'Nintendo 64', 'ニンテンドー64', 'ニンテンドウ64'], value: 'Nintendo 64'},
  {keywords: ['GC', 'GameCube', 'ゲームキューブ'], value: 'Nintendo GameCube'},
  {keywords: ['Wii U', 'WiiU', 'ウィーユー'], value: 'Nintendo Wii U'},
  {keywords: ['Wii', 'ウィー'], value: 'Nintendo Wii'},
  {keywords: ['Nintendo Switch', 'Switch', 'スイッチ'], value: 'Nintendo Switch'},
  {keywords: ['GBA', 'Game Boy Advance', 'ゲームボーイアドバンス'], value: 'Nintendo Game Boy Advance'},
  {keywords: ['GBC', 'Game Boy Color', 'ゲームボーイカラー'], value: 'Nintendo Game Boy Color'},
  {keywords: ['GB', 'Game Boy', 'ゲームボーイ'], value: 'Nintendo Game Boy'},
  {keywords: ['DS Lite', 'DSi', 'DSLite'], value: 'Nintendo DS'},
  {keywords: ['3DS', 'ニンテンドー3DS'], value: 'Nintendo 3DS'},
  {keywords: ['NDS', 'Nintendo DS', 'ニンテンドーDS'], value: 'Nintendo DS'},
  {keywords: ['PS5', 'PlayStation 5', 'プレイステーション5', 'プレステ5'], value: 'Sony PlayStation 5'},
  {keywords: ['PS4', 'PlayStation 4', 'プレイステーション4', 'プレステ4'], value: 'Sony PlayStation 4'},
  {keywords: ['PS3', 'PlayStation 3', 'プレイステーション3', 'プレステ3'], value: 'Sony PlayStation 3'},
  {keywords: ['PS2', 'PlayStation 2', 'プレイステーション2', 'プレステ2'], value: 'Sony PlayStation 2'},
  {keywords: ['PS1', 'PlayStation', 'プレイステーション', 'プレステ', 'PS one', 'PSone'], value: 'Sony PlayStation'},
  {keywords: ['PSP', 'プレイステーション・ポータブル'], value: 'Sony PSP'},
  {keywords: ['PS Vita', 'Vita', 'PSVITA'], value: 'Sony PlayStation Vita'},
  {keywords: ['Xbox Series', 'XSX', 'XSS'], value: 'Microsoft Xbox Series X|S'},
  {keywords: ['Xbox One', 'XB1', 'XBOXONE'], value: 'Microsoft Xbox One'},
  {keywords: ['Xbox 360', 'X360'], value: 'Microsoft Xbox 360'},
  {keywords: ['Xbox', 'XBOX'], value: 'Microsoft Xbox'},
  {keywords: ['Dreamcast', 'ドリームキャスト', 'DC'], value: 'Sega Dreamcast'},
  {keywords: ['Saturn', 'サターン', 'セガサターン', 'SS'], value: 'Sega Saturn'},
  {keywords: ['Mega Drive', 'メガドライブ', 'MD', 'Genesis'], value: 'Sega Genesis/Mega Drive'},
  {keywords: ['Game Gear', 'ゲームギア', 'GG'], value: 'Sega Game Gear'},
  {keywords: ['PC Engine', 'PCエンジン', 'PCE', 'TurboGrafx'], value: 'NEC TurboGrafx-16/PC Engine'},
  {keywords: ['Neo Geo', 'ネオジオ', 'NEOGEO', 'NGP'], value: 'SNK Neo Geo'},
  {keywords: ['MSX', 'MSX2', 'MSX2+'], value: 'MSX'},
  {keywords: ['WonderSwan', 'ワンダースワン'], value: 'Bandai WonderSwan'},
  {keywords: ['Virtual Boy', 'バーチャルボーイ'], value: 'Nintendo Virtual Boy'}
];

// ==============================
// ゲーム リージョンコード判定パターン
// ==============================
var IS_REGION_CODE_PATTERNS = [
  {keywords: ['NTSC-J', 'NTSCJ', 'Japan Import', 'Japanese', '日本版'], value: 'NTSC-J (Japan)'},
  {keywords: ['NTSC-U', 'NTSC-U/C', 'US Version', 'North America'], value: 'NTSC-U/C (US/Canada)'},
  {keywords: ['PAL', 'European', 'Europe Version', 'EU版'], value: 'PAL'},
  {keywords: ['Region Free', 'リージョンフリー'], value: 'Region Free'}
];

// ==============================
// ゲーム ジャンル判定パターン
// ==============================
var IS_GENRE_PATTERNS = [
  {keywords: ['RPG', 'Role Playing', 'ロールプレイング'], value: 'Role-Playing'},
  {keywords: ['Action RPG', 'ARPG', 'アクションRPG'], value: 'Action RPG'},
  {keywords: ['Action', 'アクション'], value: 'Action'},
  {keywords: ['Adventure', 'アドベンチャー'], value: 'Adventure'},
  {keywords: ['Fighting', '格闘', '対戦格闘'], value: 'Fighting'},
  {keywords: ['Racing', 'レース', 'レーシング'], value: 'Racing'},
  {keywords: ['Puzzle', 'パズル'], value: 'Puzzle'},
  {keywords: ['Simulation', 'シミュレーション'], value: 'Simulation'},
  {keywords: ['Sports', 'スポーツ'], value: 'Sports'},
  {keywords: ['Shooter', 'シューティング', 'STG'], value: 'Shooter'},
  {keywords: ['Strategy', '戦略', 'シミュレーションRPG', 'SRPG', 'Tactical'], value: 'Strategy'},
  {keywords: ['Platform', 'プラットフォーマー', 'Platformer'], value: 'Platform'},
  {keywords: ['Music', '音楽', 'リズム', 'Rhythm'], value: 'Music/Rhythm'},
  {keywords: ['Horror', 'ホラー', 'サバイバルホラー'], value: 'Horror'},
  {keywords: ['Board Game', 'ボードゲーム', 'Party', 'パーティ'], value: 'Board Game/Party'}
];

// ==============================
// ゲーム タイトル→パブリッシャー判定パターン
// ==============================
var IS_GAME_PUBLISHER_PATTERNS = [
  // Nintendo
  {keywords: ['Super Mario', 'Mario Bros', 'Mario Kart', 'Mario Party', 'Mario Land', 'Mario World'], value: 'Nintendo'},
  {keywords: ['Zelda', 'Link\'s Awakening'], value: 'Nintendo'},
  {keywords: ['Kirby'], value: 'Nintendo'},
  {keywords: ['Metroid'], value: 'Nintendo'},
  {keywords: ['Donkey Kong'], value: 'Nintendo'},
  {keywords: ['Star Fox', 'Starfox'], value: 'Nintendo'},
  {keywords: ['Pikmin'], value: 'Nintendo'},
  {keywords: ['Splatoon'], value: 'Nintendo'},
  {keywords: ['Animal Crossing'], value: 'Nintendo'},
  {keywords: ['Fire Emblem'], value: 'Nintendo'},
  {keywords: ['Wario Land', 'WarioWare', 'Wario'], value: 'Nintendo'},
  {keywords: ['F-Zero', 'F Zero'], value: 'Nintendo'},
  {keywords: ['Golden Sun'], value: 'Nintendo'},
  {keywords: ['Mother', 'EarthBound'], value: 'Nintendo'},
  // Square / Square Enix
  {keywords: ['Final Fantasy'], value: 'Square'},
  {keywords: ['Chrono Trigger', 'Chrono Cross'], value: 'Square'},
  {keywords: ['SaGa', 'Romancing SaGa', 'Final Fantasy Legend'], value: 'Square'},
  {keywords: ['Mana', 'Seiken Densetsu', 'Secret of Mana'], value: 'Square'},
  {keywords: ['Xanadu', 'Ys'], value: 'Falcom'},
  // Enix
  {keywords: ['Dragon Quest', 'Dragon Warrior'], value: 'Enix'},
  {keywords: ['Actraiser', 'ActRaiser'], value: 'Enix'},
  {keywords: ['Soul Blazer'], value: 'Enix'},
  // Konami
  {keywords: ['TwinBee', 'Twin Bee'], value: 'Konami'},
  {keywords: ['Castlevania', 'Dracula', 'Akumajou'], value: 'Konami'},
  {keywords: ['Gradius', 'Nemesis'], value: 'Konami'},
  {keywords: ['Contra', 'Probotector'], value: 'Konami'},
  {keywords: ['Metal Gear'], value: 'Konami'},
  {keywords: ['Silent Hill'], value: 'Konami'},
  {keywords: ['Bomberman'], value: 'Hudson Soft'},
  {keywords: ['Parodius'], value: 'Konami'},
  {keywords: ['Goemon', 'Ganbare Goemon', 'Mystical Ninja'], value: 'Konami'},
  {keywords: ['Suikoden', 'Genso Suikoden'], value: 'Konami'},
  {keywords: ['Tokimeki Memorial'], value: 'Konami'},
  {keywords: ['Winning Eleven', 'Pro Evolution Soccer'], value: 'Konami'},
  // Capcom
  {keywords: ['Street Fighter'], value: 'Capcom'},
  {keywords: ['Mega Man', 'Rockman', 'Rock Man'], value: 'Capcom'},
  {keywords: ['Resident Evil', 'Biohazard'], value: 'Capcom'},
  {keywords: ['Monster Hunter'], value: 'Capcom'},
  {keywords: ['Ghosts \'n Goblins', 'Makaimura', 'Makai', 'Ghouls \'n Ghosts'], value: 'Capcom'},
  {keywords: ['Breath of Fire'], value: 'Capcom'},
  {keywords: ['Devil May Cry'], value: 'Capcom'},
  {keywords: ['Ace Attorney', 'Phoenix Wright', 'Gyakuten Saiban'], value: 'Capcom'},
  // Sega
  {keywords: ['Sonic'], value: 'Sega'},
  {keywords: ['Phantasy Star'], value: 'Sega'},
  {keywords: ['Shining Force', 'Shining'], value: 'Sega'},
  {keywords: ['Virtua Fighter'], value: 'Sega'},
  {keywords: ['Yakuza', 'Ryu ga Gotoku'], value: 'Sega'},
  {keywords: ['Puyo Puyo'], value: 'Sega'},
  // Bandai Namco
  {keywords: ['Pac-Man', 'Pac Man', 'Pacman'], value: 'Namco'},
  {keywords: ['Tales of'], value: 'Namco'},
  {keywords: ['Tekken'], value: 'Namco'},
  {keywords: ['Gundam'], value: 'Bandai'},
  {keywords: ['Taiko', 'Taiko no Tatsujin'], value: 'Namco'},
  {keywords: ['Dragon Ball'], value: 'Bandai'},
  {keywords: ['Naruto'], value: 'Bandai Namco'},
  {keywords: ['One Piece'], value: 'Bandai'},
  // Atlus
  {keywords: ['Persona'], value: 'Atlus'},
  {keywords: ['Shin Megami Tensei', 'Megami Tensei'], value: 'Atlus'},
  // Compile
  {keywords: ['Madou Monogatari'], value: 'Compile'},
  {keywords: ['Zanac'], value: 'Compile'},
  {keywords: ['Aleste'], value: 'Compile'},
  // Taito
  {keywords: ['Bubble Bobble'], value: 'Taito'},
  {keywords: ['Space Invaders'], value: 'Taito'},
  {keywords: ['Darius'], value: 'Taito'},
  // Irem
  {keywords: ['R-Type', 'R Type', 'RTYPE'], value: 'Irem'},
  // Tecmo
  {keywords: ['Ninja Gaiden'], value: 'Tecmo'},
  {keywords: ['Dead or Alive'], value: 'Tecmo'},
  // SNK
  {keywords: ['King of Fighters', 'KOF'], value: 'SNK'},
  {keywords: ['Fatal Fury', 'Garou'], value: 'SNK'},
  {keywords: ['Samurai Shodown', 'Samurai Spirits'], value: 'SNK'},
  // Koei
  {keywords: ['Nobunaga', 'Nobunaga\'s Ambition'], value: 'Koei'},
  {keywords: ['Romance of the Three Kingdoms', 'Sangokushi'], value: 'Koei'},
  {keywords: ['Dynasty Warriors', 'Musou'], value: 'Koei'},
  // Falcom
  {keywords: ['Legend of Heroes', 'Trails'], value: 'Falcom'},
  // From Software
  {keywords: ['Dark Souls', 'Armored Core'], value: 'From Software'},
  // Hudson Soft
  {keywords: ['PC Genjin', 'Bonk'], value: 'Hudson Soft'},
  {keywords: ['Star Soldier'], value: 'Hudson Soft'},
  // Treasure
  {keywords: ['Gunstar Heroes'], value: 'Treasure'},
  // HAL Laboratory
  {keywords: ['Lode Runner'], value: 'Hudson Soft'},
  // Sailor Moon
  {keywords: ['Sailor Moon'], value: 'Bandai'},
  // Macross
  {keywords: ['Macross'], value: 'Bandai'},
  // To Love-Ru
  {keywords: ['To Love', 'ToLoveRu', 'To LoveRu'], value: 'Bandai Namco'},
  // God of War
  {keywords: ['God of War'], value: 'Sony'},
  // Prince of Persia
  {keywords: ['Prince of Persia'], value: 'Ubisoft'},
  // Atelier / Iris
  {keywords: ['Atelier', 'Iris Atelier'], value: 'Gust'},
  // Ginga Eiyu Densetsu (Legend of the Galactic Heroes)
  {keywords: ['Ginga Eiyu Densetsu', 'Ginga Eiyuu'], value: 'Kemco'},
  // F1
  {keywords: ['F1 Grand Prix', 'F-1 Grand Prix'], value: 'Video System'},
  // Master Karateka
  {keywords: ['Karateka'], value: 'Broderbund'},
  // Dynamite Duke
  {keywords: ['Dynamite Duke'], value: 'Seibu Kaihatsu'}
];

// (Card rarity patterns moved to CardPatterns.gs)

// (Card finish patterns moved to CardPatterns.gs)

// (Card set patterns moved to CardPatterns.gs)

// ==============================
// ウォッチパーツ タイプパターン
// ==============================
var IS_WATCH_PART_TYPE_PATTERNS = [
  {keywords: ['コマ', 'あまりコマ', '余りコマ', 'Link', 'LINK', 'link', 'Spare Link', 'Extra Link'], value: 'Link'},
  {keywords: ['Pin', 'PIN', 'ピン', 'Spare Part Pin'], value: 'Pin'},
  {keywords: ['ブレスレット', 'ブレス', 'Bracelet', 'BRACELET', 'Metal Bracelet', 'バンド'], value: 'Bracelet/Band'},
  {keywords: ['ストラップ', 'Strap', 'STRAP', 'ベルト', 'Belt', 'レザーベルト', 'ラバーベルト'], value: 'Band/Strap'},
  {keywords: ['尾錠', 'バックル', 'Buckle', 'BUCKLE', 'Clasp', 'CLASP', 'クラスプ', 'Deployment', 'Deployant', 'デプロイメント', 'Dバックル'], value: 'Buckle/Clasp'},
  {keywords: ['ムーブメント', 'Movement', 'MOVEMENT', 'キャリバー', 'Caliber', 'Cal.'], value: 'Movement'},
  {keywords: ['風防', 'ガラス', 'Crystal', 'CRYSTAL', 'サファイアクリスタル', 'ミネラルガラス', 'プラスチック風防'], value: 'Crystal/Glass'},
  {keywords: ['リューズ', '竜頭', 'Crown', 'CROWN'], value: 'Crown'},
  {keywords: ['裏蓋', 'Case Back', 'CASE BACK', 'Caseback', 'ケースバック'], value: 'Case Back'},
  {keywords: ['文字盤', 'ダイアル', 'ダイヤル', 'Dial', 'DIAL'], value: 'Dial'},
  {keywords: ['ベゼル', 'Bezel', 'BEZEL', '回転ベゼル'], value: 'Bezel'},
  {keywords: ['針', 'Hand', 'HAND', 'Hands', '時針', '分針', '秒針'], value: 'Hand'},
  {keywords: ['バネ棒', 'Spring Bar', 'SPRING BAR', 'スプリングバー'], value: 'Spring Bar'},
  {keywords: ['ローター', 'Rotor', 'ROTOR', '回転錘'], value: 'Rotor'},
  {keywords: ['巻芯', '巻き芯', 'Stem', 'STEM'], value: 'Stem'},
  {keywords: ['ケース', 'Case', 'CASE', 'ウォッチケース'], value: 'Case'},
  {keywords: ['プッシャー', 'Pusher', 'PUSHER', 'Push Button', 'ボタン'], value: 'Pusher'},
  {keywords: ['パッキン', 'ガスケット', 'Gasket', 'GASKET', 'Oリング', 'O-Ring'], value: 'Gasket'},
  {keywords: ['インデックス', 'Index', 'INDEX', 'Hour Marker', 'マーカー'], value: 'Index/Marker'}
];

// ==============================
// タグ一覧シート出力
// ==============================

/**
 * 対応カテゴリとタグの一覧を Tag_List シートに出力する
 * 初期設定（saveIntegratedSettings）から呼び出される
 * @return {Object} {success: boolean, message: string, count: number}
 */
function outputTagListSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = 'Tag_List';
  var sh = ss.getSheetByName(sheetName);

  if (sh) {
    sh.clear();
  } else {
    sh = ss.insertSheet(sheetName);
  }

  // --- ジャンル別カテゴリ定義（並び順） ---
  var categoryGroups = [
    {group: 'Jewelry（ジュエリー）', categories: [
      {cat: 'Watches', desc: '腕時計・懐中時計'},
      {cat: 'Watch Parts', desc: '時計パーツ・部品'},
      {cat: 'Rings', desc: '指輪・リング'},
      {cat: 'Necklaces', desc: 'ネックレス・ペンダント・チェーン'},
      {cat: 'Bracelets', desc: 'ブレスレット・バングル'},
      {cat: 'Earrings', desc: 'ピアス・イヤリング'},
      {cat: 'Brooches', desc: 'ブローチ・ピン'},
      {cat: 'Cufflinks', desc: 'カフリンクス（メンズジュエリー）'},
      {cat: 'Charms', desc: 'チャーム・ペンダントトップ'}
    ]},
    {group: 'Fashion（ファッション）', categories: [
      {cat: 'Handbags', desc: 'バッグ・ハンドバッグ全般'},
      {cat: 'Wallets', desc: '財布・カードケース・コインケース'},
      {cat: 'Clothing', desc: '衣類全般（トップス・ボトムス・ジャケット等）'},
      {cat: 'Shoes', desc: '靴・スニーカー・ブーツ等'},
      {cat: 'Hats', desc: '帽子（キャップ・ハット・ビーニー等）'},
      {cat: 'Scarves', desc: 'スカーフ・マフラー・ストール'},
      {cat: 'Belts', desc: 'ベルト'},
      {cat: 'Belt Buckles', desc: 'ベルトバックル'},
      {cat: 'Sunglasses', desc: 'サングラス・眼鏡'},
      {cat: 'Neckties', desc: 'ネクタイ'},
      {cat: 'Tie Accessories', desc: 'ネクタイピン・タイバー・スカーフリング'},
      {cat: 'Handkerchiefs', desc: 'ハンカチ'},
      {cat: 'Hair Accessories', desc: '髪飾り・かんざし・バレッタ'}
    ]},
    {group: 'Electronics（電子機器）', categories: [
      {cat: 'Cameras', desc: 'デジカメ・一眼レフ・ミラーレス'},
      {cat: 'Electronics', desc: '家電・オーディオ・ヘッドホン'},
      {cat: 'Video Games', desc: 'ゲームソフト全般'},
      {cat: 'Video Game Consoles', desc: 'ゲーム機本体'}
    ]},
    {group: 'Hobby（ホビー・コレクティブル）', categories: [
      {cat: 'Trading Cards', desc: 'トレカ（ポケカ・遊戯王・MTG等）'},
      {cat: 'Collectibles', desc: 'フィギュア・コレクティブル・アンティーク'},
      {cat: 'Dolls & Plush', desc: 'ドール・ぬいぐるみ'},
      {cat: 'Musical Instruments', desc: '楽器（ギター・キーボード・管楽器等）'},
      {cat: 'Art', desc: '絵画・版画・リトグラフ・浮世絵'},
      {cat: 'Figures', desc: 'フィギュア・アクションフィギュア・スタチュー'},
      {cat: 'Anime', desc: 'アニメグッズ・漫画'},
      {cat: 'RC & Models', desc: 'ラジコン・模型・プラモデル'},
      {cat: 'Stamps', desc: '切手・記念切手'},
      {cat: 'Coins', desc: 'コイン・古銭・硬貨'},
      {cat: 'Records', desc: 'レコード・LP・CD'}
    ]},
    {group: 'Home & Living（生活・雑貨）', categories: [
      {cat: 'Dinnerware', desc: '食器・皿・カップ'},
      {cat: 'Pottery', desc: '陶磁器・焼物・茶道具'},
      {cat: 'Glassware', desc: 'ガラス細工・クリスタル・花瓶'},
      {cat: 'Flatware', desc: 'カトラリー（スプーン・フォーク・ナイフ）'},
      {cat: 'Snow Globes', desc: 'スノードーム'},
      {cat: 'Boxes', desc: 'ジュエリーボックス・時計ケース'},
      {cat: 'Combs', desc: '櫛・コーム'},
      {cat: 'Key Chains', desc: 'キーリング・キーホルダー'},
      {cat: 'Soap', desc: '石鹸・ソープ'},
      {cat: 'Baby', desc: 'ベビー用品'}
    ]},
    {group: 'Sports（スポーツ）', categories: [
      {cat: 'Golf', desc: 'ゴルフクラブ（完成品）'},
      {cat: 'Golf Heads', desc: 'ゴルフヘッド（単体）'},
      {cat: 'Tennis', desc: 'テニスラケット'},
      {cat: 'Baseball', desc: '野球グローブ・バット'},
      {cat: 'Fishing Rods', desc: '釣竿・ロッド'},
      {cat: 'Fishing Reels', desc: '釣りリール'}
    ]},
    {group: 'Japanese Traditional（日本伝統）', categories: [
      {cat: 'Kimono', desc: '着物・和装・振袖・浴衣・帯'},
      {cat: 'Japanese Swords', desc: '日本刀・脇差・短刀・鍔'},
      {cat: 'Tea Ceremony', desc: '茶道具・茶碗・棗・茶杓'},
      {cat: 'Bonsai', desc: '盆栽・盆栽鉢・水石'},
      {cat: 'Prints', desc: '浮世絵・版画・木版画'},
      {cat: 'Buddhist Art', desc: '仏像・仏具・仏教美術'},
      {cat: 'Tetsubin', desc: '鉄瓶・銀瓶・南部鉄器'},
      {cat: 'Japanese Instruments', desc: '三味線・尺八・琴・和太鼓'}
    ]},
    {group: 'Writing & Smoking（筆記具・喫煙具）', categories: [
      {cat: 'Pens', desc: '万年筆・ボールペン・シャープペンシル'},
      {cat: 'Lighters', desc: 'ライター・Zippo'},
      {cat: 'Pipes', desc: 'パイプ・キセル・煙管'}
    ]}
  ];

  // --- IS_TAG_TO_CATEGORY からカテゴリ→タグの逆引きマップを構築 ---
  var categoryToTags = {};
  var allTags = Object.keys(IS_TAG_TO_CATEGORY);
  for (var i = 0; i < allTags.length; i++) {
    var tag = allTags[i];
    var cat = IS_TAG_TO_CATEGORY[tag];
    if (!categoryToTags[cat]) categoryToTags[cat] = [];
    categoryToTags[cat].push(tag);
  }

  // --- 交通整理/IS対応状況の判定 ---
  var sanitizeCategories = ['watch', 'camera', 'card', 'game', 'reel'];
  var sanitizeMap = {
    'Watches': 'watch', 'Cameras': 'camera', 'Trading Cards': 'card',
    'Video Games': 'game', 'Video Game Consoles': 'game', 'Fishing Reels': 'reel'
  };

  // --- ヘッダー ---
  var COLS = 13; // A〜M
  var headers = ['タグ（入力用）', 'eBayカテゴリ', '対応状況', 'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8', 'Field 9', 'Field 10'];

  // --- 2次元配列にデータを構築（一括書き込み用） ---
  var allRows = [];
  var groupHeaderRows = []; // グループ見出し行のインデックス
  var statusColors = [];    // 各データ行の対応状況色

  allRows.push(headers);
  // 説明行
  var descRow = ['↓ A列のタグをコピーして出品シートのA列に貼り付けてください。D〜M列は対応するItem Specificsフィールドです。'];
  for (var p = 1; p < COLS; p++) descRow.push('');
  allRows.push(descRow);

  for (var g = 0; g < categoryGroups.length; g++) {
    var group = categoryGroups[g];

    // グループ見出し行
    var groupRow = [group.group];
    for (var p = 1; p < COLS; p++) groupRow.push('');
    groupHeaderRows.push(allRows.length);
    allRows.push(groupRow);

    for (var c = 0; c < group.categories.length; c++) {
      var catDef = group.categories[c];
      var catName = catDef.cat;
      var tags = categoryToTags[catName] || [];

      if (tags.length === 0) continue;

      // 対応状況
      var hasSanitize = sanitizeMap[catName] ? true : false;
      var hasIS = IS_CATEGORY_FIELDS && IS_CATEGORY_FIELDS[catName] ? true : false;
      var status = '';
      var color = '#999999';
      if (hasSanitize && hasIS) { status = '○ 交通整理＋IS'; color = '#137333'; }
      else if (hasIS) { status = '△ ISのみ'; color = '#b06000'; }
      else { status = '- 未対応'; }

      // フィールド取得
      var fields = IS_CATEGORY_FIELDS[catName] || [];

      // タグごとに1行
      for (var t = 0; t < tags.length; t++) {
        var row = [tags[t], catName, status];
        for (var f = 0; f < 10; f++) {
          row.push(f < fields.length ? fields[f] : '');
        }
        statusColors.push(color);
        allRows.push(row);
      }
    }
  }

  // --- 一括書き込み ---
  if (allRows.length > 0) {
    sh.getRange(1, 1, allRows.length, COLS).setValues(allRows);
  }

  // --- 書式設定（最小限のAPI呼び出し） ---
  // ヘッダー行
  sh.getRange(1, 1, 1, COLS).setFontWeight('bold').setBackground('#4a86c8').setFontColor('#ffffff');
  // 説明行
  sh.getRange(2, 1, 1, COLS).setFontColor('#666666').setFontStyle('italic');
  // グループ見出し行
  for (var h = 0; h < groupHeaderRows.length; h++) {
    sh.getRange(groupHeaderRows[h] + 1, 1, 1, COLS).setFontWeight('bold').setBackground('#e8f0fe').setFontColor('#1a4472');
  }
  // 対応状況の色分け（データ行のみ）
  var dataStartRow = 3 + (groupHeaderRows.length > 0 ? 1 : 0); // 最初のデータ行
  for (var s = 0; s < statusColors.length; s++) {
    // statusColors[s]に対応する実際の行を計算
    // allRowsの構造: [header, desc, group1, data..., group2, data..., ...]
    // 直接行番号を使うのではなく、allRowsのインデックスから計算
  }
  // 色分けはグループ見出しを考慮して正確に適用
  var rowIdx = 0;
  for (var r = 3; r <= allRows.length; r++) { // 3行目以降（1-indexed）
    var isGroupHeader = false;
    for (var gh = 0; gh < groupHeaderRows.length; gh++) {
      if (groupHeaderRows[gh] + 1 === r) { isGroupHeader = true; break; }
    }
    if (!isGroupHeader && rowIdx < statusColors.length) {
      sh.getRange(r, 3).setFontColor(statusColors[rowIdx]);
      rowIdx++;
    }
  }

  // 列幅調整
  sh.setColumnWidth(1, 160);
  sh.setColumnWidth(2, 180);
  sh.setColumnWidth(3, 140);
  for (var w = 4; w <= 13; w++) {
    sh.setColumnWidth(w, 160);
  }

  // フィルター設定
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, allRows.length, COLS).createFilter();

  var tagCount = statusColors.length;
  return {success: true, message: 'Tag_Listシートにタグ一覧を出力しました', count: tagCount};
}
