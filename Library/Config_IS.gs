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
    ITEM_SPECIFICS_START: 14,  // N列〜: Item Specifics開始列
    CONFIRMED_EN: 57  // BE列: 交通整理英語版（確定値）※IS 21フィールド対応
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
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Reference Number', field_type: 'recommended', priority: 11, notes: '型番・モデル番号。例: Submariner=116610LN, Speedmaster=311.30.42.30.01.005' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Band Material', field_type: 'recommended', priority: 12, notes: 'ベルト素材。Stainless Steel / Leather / Rubber / Silicone / Nylon / Mesh / Titanium等' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Water Resistance', field_type: 'recommended', priority: 13, notes: '防水性能。10ATM / 100m / 200m / 30m / Water Resistant等' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Features', field_type: 'recommended', priority: 14, notes: '機能。Luminous / Date / Chronograph / Tachymeter / GMT / Alarm等' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'With Papers', field_type: 'recommended', priority: 15, notes: '保証書・ギャランティーカード付きか。Yes / No' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'With Original Box/Packaging', field_type: 'recommended', priority: 16, notes: '純正ボックス・箱付きか。Yes / No' },
  { category: 'Watches', tag_jp: '時計,腕時計,ウォッチ,懐中時計', field_name: 'Type', field_type: 'required', priority: 17, notes: '時計タイプ。Dress Watch / Sport Watch / Pocket Watch / Smartwatch / Chronograph / Diver / Field Watch等' },

  // === PC Peripherals ===
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Brand',             field_type: 'required',    priority: 1,  notes: 'Logitech/Elecom/Sanwa/Buffalo/Anker等' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Model',             field_type: 'recommended', priority: 2,  notes: '型番' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Type',              field_type: 'required',    priority: 3,  notes: 'Keyboard/Mouse/Webcam/USB Hub等' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Connectivity',      field_type: 'recommended', priority: 4,  notes: 'Wired/Wireless/Bluetooth' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Compatibility',     field_type: 'recommended', priority: 5,  notes: 'PC/Mac/Universal' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Color',             field_type: 'optional',    priority: 6,  notes: '' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Features',          field_type: 'optional',    priority: 7,  notes: 'RGB/Mechanical/4K等' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Country of Origin', field_type: 'optional',    priority: 8,  notes: '' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Power Source',      field_type: 'optional',    priority: 9,  notes: '' },
  { category: 'PC Peripherals', tag_jp: 'パソコン周辺機器', field_name: 'Condition',         field_type: 'required',    priority: 10, notes: '' },

  // === Electronic Dictionaries ===
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Brand',                  field_type: 'required',    priority: 1,  notes: 'Casio/Sharp/Canon/Seiko/Franklin' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Model',                  field_type: 'required',    priority: 2,  notes: 'XD-SX8900 / PW-A7000 / IDP-920D等' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Type',                   field_type: 'required',    priority: 3,  notes: 'Handheld / Desktop' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Dictionary Language',    field_type: 'required',    priority: 4,  notes: 'Japanese / English / Chinese' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Number of Dictionaries', field_type: 'recommended', priority: 5,  notes: '例: 200 dictionaries' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Screen Size',            field_type: 'recommended', priority: 6,  notes: '例: 3.5 in / 4.0 in / 5.7 in' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Features',               field_type: 'optional',    priority: 7,  notes: 'Touch Panel / Voice Recognition / Camera' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Power Source',           field_type: 'recommended', priority: 8,  notes: 'Battery / USB / AC Adapter' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Country of Origin',      field_type: 'optional',    priority: 9,  notes: 'Japan' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Color',                  field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Electronic Dictionaries', tag_jp: '電子辞書', field_name: 'Condition',              field_type: 'required',    priority: 11, notes: 'New / Used' },

  // === Scientific Calculators ===
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Brand',               field_type: 'required',    priority: 1,  notes: 'Casio / Texas Instruments / HP / Sharp / Canon' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Model',               field_type: 'required',    priority: 2,  notes: 'fx-CG50 / fx-991EX / TI-84 Plus CE / HP Prime G2 / EL-W516T' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Type',                field_type: 'required',    priority: 3,  notes: 'Scientific / Graphing / Financial / Basic / Printing' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Display Lines',       field_type: 'recommended', priority: 4,  notes: '1 / 2 / 4 / Multiline' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Display Type',        field_type: 'recommended', priority: 5,  notes: 'Dot Matrix / LCD / Color' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Power Source',        field_type: 'recommended', priority: 6,  notes: 'Battery / Solar / Solar+Battery / USB' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Country of Origin',   field_type: 'optional',    priority: 7,  notes: 'Japan / China / Malaysia' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Year Manufactured',   field_type: 'optional',    priority: 8,  notes: 'if stated' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Number of Functions', field_type: 'optional',    priority: 9,  notes: '例: 552 functions' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Color',               field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Scientific Calculators', tag_jp: '関数電卓', field_name: 'Condition',           field_type: 'required',    priority: 11, notes: 'New / Used / For parts or not working' },

  // === Hand Tools ===
  { category: 'Hand Tools',        tag_jp: '手工具,プライヤー,ノギス,ヤスリ,砥石,墨壺,曲尺', field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'KTC / VESSEL / TONE / 土牛 / KAKURI / Snap-on / Stanley 等' },
  { category: 'Hand Tools',        tag_jp: '手工具,プライヤー,ノギス,ヤスリ,砥石,墨壺,曲尺', field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Pliers / Caliper / File / Whetstone / Chalk Line / Square 等' },
  { category: 'Hand Tools',        tag_jp: '手工具,プライヤー,ノギス,ヤスリ,砥石,墨壺,曲尺', field_name: 'Country/Region of Manufacture', field_type: 'optional',    priority: 3,  notes: 'Japan / Germany / USA / China' },
  { category: 'Hand Tools',        tag_jp: '手工具,プライヤー,ノギス,ヤスリ,砥石,墨壺,曲尺', field_name: 'Condition',                   field_type: 'required',    priority: 4,  notes: 'New / Used / For parts or not working' },
  // === Power Tools ===
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Milwaukee 等' },
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Impact Driver / Circular Saw / Drill 等' },
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / 100V / Unknown if not stated' },
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 5, notes: 'Japan / China / USA' },
  { category: 'Power Tools',           tag_jp: '電動工具',                              field_name: 'Condition',                   field_type: 'required',    priority: 6, notes: 'New / Used / For parts or not working' },
  { category: 'Impact Drivers',        tag_jp: 'インパクトドライバー,インパクト',        field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Milwaukee 等' },
  { category: 'Impact Drivers',        tag_jp: 'インパクトドライバー,インパクト',        field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Impact Driver / Cordless Impact Driver' },
  { category: 'Impact Drivers',        tag_jp: 'インパクトドライバー,インパクト',        field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / Unknown if not stated' },
  { category: 'Impact Drivers',        tag_jp: 'インパクトドライバー,インパクト',        field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Impact Drivers',        tag_jp: 'インパクトドライバー,インパクト',        field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Cordless Drills',       tag_jp: '充電式ドライバードリル,ドリル,充電式',   field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Milwaukee 等' },
  { category: 'Cordless Drills',       tag_jp: '充電式ドライバードリル,ドリル,充電式',   field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Cordless Drill / Drill/Driver' },
  { category: 'Cordless Drills',       tag_jp: '充電式ドライバードリル,ドリル,充電式',   field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / Unknown if not stated' },
  { category: 'Cordless Drills',       tag_jp: '充電式ドライバードリル,ドリル,充電式',   field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery' },
  { category: 'Cordless Drills',       tag_jp: '充電式ドライバードリル,ドリル,充電式',   field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Corded Drills',         tag_jp: '電動ドリル,振動ドリル,ハンマードリル',   field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch 等' },
  { category: 'Corded Drills',         tag_jp: '電動ドリル,振動ドリル,ハンマードリル',   field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Electric Drill / Hammer Drill / Rotary Drill' },
  { category: 'Corded Drills',         tag_jp: '電動ドリル,振動ドリル,ハンマードリル',   field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '100V / 120V / Unknown if not stated' },
  { category: 'Corded Drills',         tag_jp: '電動ドリル,振動ドリル,ハンマードリル',   field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Corded Electric' },
  { category: 'Corded Drills',         tag_jp: '電動ドリル,振動ドリル,ハンマードリル',   field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Circular Saws',         tag_jp: '丸ノコ,丸鋸,マルノコ',                  field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Bosch 等' },
  { category: 'Circular Saws',         tag_jp: '丸ノコ,丸鋸,マルノコ',                  field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Circular Saw / Cordless Circular Saw' },
  { category: 'Circular Saws',         tag_jp: '丸ノコ,丸鋸,マルノコ',                  field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / 100V / Unknown if not stated' },
  { category: 'Circular Saws',         tag_jp: '丸ノコ,丸鋸,マルノコ',                  field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Circular Saws',         tag_jp: '丸ノコ,丸鋸,マルノコ',                  field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Jig Saws',              tag_jp: 'ジグソー,じぐそー,ジグ鋸',               field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch / DEWALT 等' },
  { category: 'Jig Saws',              tag_jp: 'ジグソー,じぐそー,ジグ鋸',               field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Jigsaw / Cordless Jigsaw' },
  { category: 'Jig Saws',              tag_jp: 'ジグソー,じぐそー,ジグ鋸',               field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Jig Saws',              tag_jp: 'ジグソー,じぐそー,ジグ鋸',               field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Jig Saws',              tag_jp: 'ジグソー,じぐそー,ジグ鋸',               field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Reciprocating Saws',    tag_jp: 'レシプロソー,セーバーソー',               field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Milwaukee / DEWALT 等' },
  { category: 'Reciprocating Saws',    tag_jp: 'レシプロソー,セーバーソー',               field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Reciprocating Saw / Cordless Reciprocating Saw' },
  { category: 'Reciprocating Saws',    tag_jp: 'レシプロソー,セーバーソー',               field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Reciprocating Saws',    tag_jp: 'レシプロソー,セーバーソー',               field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Reciprocating Saws',    tag_jp: 'レシプロソー,セーバーソー',               field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Grinders',              tag_jp: 'グラインダー,ディスクグラインダー',        field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Bosch 等' },
  { category: 'Grinders',              tag_jp: 'グラインダー,ディスクグラインダー',        field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Angle Grinder / Cordless Angle Grinder' },
  { category: 'Grinders',              tag_jp: 'グラインダー,ディスクグラインダー',        field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / 100V / Unknown if not stated' },
  { category: 'Grinders',              tag_jp: 'グラインダー,ディスクグラインダー',        field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Grinders',              tag_jp: 'グラインダー,ディスクグラインダー',        field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Sanders',               tag_jp: 'サンダー,オービタルサンダー',              field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch / DEWALT 等' },
  { category: 'Sanders',               tag_jp: 'サンダー,オービタルサンダー',              field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Random Orbital Sander / Belt Sander / Sheet Sander' },
  { category: 'Sanders',               tag_jp: 'サンダー,オービタルサンダー',              field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Sanders',               tag_jp: 'サンダー,オービタルサンダー',              field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Sanders',               tag_jp: 'サンダー,オービタルサンダー',              field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Routers & Joiners',     tag_jp: 'トリマー,ルーター,ルータ',                field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch / Porter-Cable 等' },
  { category: 'Routers & Joiners',     tag_jp: 'トリマー,ルーター,ルータ',                field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Router / Trimmer / Plunge Router' },
  { category: 'Routers & Joiners',     tag_jp: 'トリマー,ルーター,ルータ',                field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Routers & Joiners',     tag_jp: 'トリマー,ルーター,ルータ',                field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Routers & Joiners',     tag_jp: 'トリマー,ルーター,ルータ',                field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Planers',               tag_jp: '電動カンナ,電気カンナ',                    field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch 等' },
  { category: 'Planers',               tag_jp: '電動カンナ,電気カンナ',                    field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Electric Plane / Power Planer / Cordless Planer' },
  { category: 'Planers',               tag_jp: '電動カンナ,電気カンナ',                    field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Planers',               tag_jp: '電動カンナ,電気カンナ',                    field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Planers',               tag_jp: '電動カンナ,電気カンナ',                    field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Heat Guns',             tag_jp: 'ヒートガン',                               field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / Bosch / DEWALT / Milwaukee 等' },
  { category: 'Heat Guns',             tag_jp: 'ヒートガン',                               field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Heat Gun / Hot Air Gun' },
  { category: 'Heat Guns',             tag_jp: 'ヒートガン',                               field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 100V / Unknown if not stated' },
  { category: 'Heat Guns',             tag_jp: 'ヒートガン',                               field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Heat Guns',             tag_jp: 'ヒートガン',                               field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Screw Guns & Screwdrivers', tag_jp: '電動ドライバー,コードレスドライバー', field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / Bosch / DEWALT 等' },
  { category: 'Screw Guns & Screwdrivers', tag_jp: '電動ドライバー,コードレスドライバー', field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Cordless Screwdriver / Screw Gun' },
  { category: 'Screw Guns & Screwdrivers', tag_jp: '電動ドライバー,コードレスドライバー', field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '12V / 18V / Unknown if not stated' },
  { category: 'Screw Guns & Screwdrivers', tag_jp: '電動ドライバー,コードレスドライバー', field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Screw Guns & Screwdrivers', tag_jp: '電動ドライバー,コードレスドライバー', field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Power Tool Sets',       tag_jp: 'セット品',                                field_name: 'Brand',                       field_type: 'required',    priority: 1, notes: 'Makita / HiKOKI / DEWALT / Milwaukee 等' },
  { category: 'Power Tool Sets',       tag_jp: 'セット品',                                field_name: 'Type',                        field_type: 'required',    priority: 2, notes: 'Power Tool Set / Combo Kit' },
  { category: 'Power Tool Sets',       tag_jp: 'セット品',                                field_name: 'Voltage',                     field_type: 'required',    priority: 3, notes: '18V / 36V / Unknown if not stated' },
  { category: 'Power Tool Sets',       tag_jp: 'セット品',                                field_name: 'Power Source',                field_type: 'optional',    priority: 4, notes: 'Battery / Corded Electric' },
  { category: 'Power Tool Sets',       tag_jp: 'セット品',                                field_name: 'Condition',                   field_type: 'required',    priority: 5, notes: 'New / Used / For parts or not working' },
  { category: 'Planes',            tag_jp: 'カンナ,鉋',                                      field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'Tasai / Chiyotsuru / Tsunesaburo / Ouchi / Stanley 等' },
  { category: 'Planes',            tag_jp: 'カンナ,鉋',                                      field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Japanese Plane / Block Plane / Jack Plane / Smoothing Plane' },
  { category: 'Planes',            tag_jp: 'カンナ,鉋',                                      field_name: 'Blade Material',              field_type: 'recommended', priority: 3,  notes: 'High Carbon Steel / White Steel / Blue Steel / HSS' },
  { category: 'Planes',            tag_jp: 'カンナ,鉋',                                      field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / Germany / USA' },
  { category: 'Planes',            tag_jp: 'カンナ,鉋',                                      field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },
  { category: 'Chisels',           tag_jp: 'のみ,鑿',                                        field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'Tasai / Ouchi Nomi / Iyoroi / Gennosha / Stanley / Marples 等' },
  { category: 'Chisels',           tag_jp: 'のみ,鑿',                                        field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Bench Chisel / Paring Chisel / Mortise Chisel / Japanese Chisel' },
  { category: 'Chisels',           tag_jp: 'のみ,鑿',                                        field_name: 'Blade Material',              field_type: 'recommended', priority: 3,  notes: 'High Carbon Steel / White Steel / Blue Steel / Chrome Vanadium' },
  { category: 'Chisels',           tag_jp: 'のみ,鑿',                                        field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / Germany / UK / USA' },
  { category: 'Chisels',           tag_jp: 'のみ,鑿',                                        field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },
  { category: 'Hammers & Mallets', tag_jp: '玄能,げんのう',                                  field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'Gennoya / DOGYU / Estwing / Vaughan / Picard 等' },
  { category: 'Hammers & Mallets', tag_jp: '玄能,げんのう',                                  field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Japanese Hammer / Claw Hammer / Wooden Mallet / Ball-Peen' },
  { category: 'Hammers & Mallets', tag_jp: '玄能,げんのう',                                  field_name: 'Material',                    field_type: 'recommended', priority: 3,  notes: 'Steel / Titanium / Fiberglass / Wood handle' },
  { category: 'Hammers & Mallets', tag_jp: '玄能,げんのう',                                  field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / Germany / USA' },
  { category: 'Hammers & Mallets', tag_jp: '玄能,げんのう',                                  field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },
  { category: 'Saws',              tag_jp: '鋸,のこぎり',                                    field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'SUIZAN / Gyokucho / Nakaya / Irwin / Stanley 等' },
  { category: 'Saws',              tag_jp: '鋸,のこぎり',                                    field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Japanese Pull Saw / Japanese Ryoba Saw / Hand Saw / Hacksaw' },
  { category: 'Saws',              tag_jp: '鋸,のこぎり',                                    field_name: 'Blade Material',              field_type: 'recommended', priority: 3,  notes: 'High Carbon Steel / Impulse Hardened / HSS' },
  { category: 'Saws',              tag_jp: '鋸,のこぎり',                                    field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / Germany / USA' },
  { category: 'Saws',              tag_jp: '鋸,のこぎり',                                    field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },
  { category: 'Trowels',           tag_jp: 'コテ,鏝',                                        field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'Marshalltown / OX Tools / Kraft Tool / 松尾 等' },
  { category: 'Trowels',           tag_jp: 'コテ,鏝',                                        field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Finishing Trowel / Japanese Trowel / Pointing Trowel / Margin Trowel' },
  { category: 'Trowels',           tag_jp: 'コテ,鏝',                                        field_name: 'Material',                    field_type: 'recommended', priority: 3,  notes: 'Stainless Steel / Carbon Steel / Aluminum' },
  { category: 'Trowels',           tag_jp: 'コテ,鏝',                                        field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / USA / UK' },
  { category: 'Trowels',           tag_jp: 'コテ,鏝',                                        field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },
  { category: 'Wrench Sets',       tag_jp: 'スパナ',                                          field_name: 'Brand',                       field_type: 'required',    priority: 1,  notes: 'KTC / TONE / Knipex / HAZET / Snap-on / FACOM 等' },
  { category: 'Wrench Sets',       tag_jp: 'スパナ',                                          field_name: 'Type',                        field_type: 'required',    priority: 2,  notes: 'Combination Wrench / Open End Wrench / Box Wrench / Ratchet Wrench' },
  { category: 'Wrench Sets',       tag_jp: 'スパナ',                                          field_name: 'Number of Pieces',            field_type: 'recommended', priority: 3,  notes: '例: 6 Pc / 10 Pc / 14 Pc' },
  { category: 'Wrench Sets',       tag_jp: 'スパナ',                                          field_name: 'Country/Region of Manufacture', field_type: 'optional',  priority: 4,  notes: 'Japan / Germany / USA / France' },
  { category: 'Wrench Sets',       tag_jp: 'スパナ',                                          field_name: 'Condition',                   field_type: 'required',    priority: 5,  notes: 'New / Used / For parts or not working' },

  // === Computers: Laptops ===
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Brand',                    field_type: 'required',    priority: 1,  notes: 'Apple/Lenovo/Dell/HP/ASUS/VAIO/Panasonic/Fujitsu/NEC/dynabook等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Model',                    field_type: 'required',    priority: 2,  notes: 'MacBook Pro 14 / ThinkPad X1 Carbon / VAIO SX14等の型番・モデル名' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Type',                     field_type: 'required',    priority: 3,  notes: 'Notebook/Laptop / Ultrabook / Netbook / 2-in-1' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Series',                   field_type: 'recommended', priority: 4,  notes: 'ThinkPad / Latitude / Inspiron / MacBook Air等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Processor',                field_type: 'recommended', priority: 5,  notes: 'Intel Core i5 / Apple M2 / AMD Ryzen 7等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Processor Speed',          field_type: 'optional',    priority: 6,  notes: '例: 2.6 GHz' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'RAM Size',                 field_type: 'recommended', priority: 7,  notes: '例: 8 GB / 16 GB' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'SSD Capacity',             field_type: 'recommended', priority: 8,  notes: '例: 256 GB / 512 GB / 1 TB' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Hard Drive Capacity',      field_type: 'optional',    priority: 9,  notes: 'HDD搭載時のみ' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Storage Type',             field_type: 'optional',    priority: 10, notes: 'SSD / HDD / eMMC / Hybrid' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Operating System',         field_type: 'recommended', priority: 11, notes: 'Windows 11 / macOS Sonoma / Chrome OS等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Screen Size',              field_type: 'recommended', priority: 12, notes: '例: 13.3 in / 14 in / 15.6 in' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Screen Resolution',        field_type: 'optional',    priority: 13, notes: 'Full HD / 2560x1600 / 4K等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Graphics Processing Type', field_type: 'optional',    priority: 14, notes: 'Integrated / Dedicated' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'GPU',                      field_type: 'optional',    priority: 15, notes: 'Intel Iris Xe / RTX 4060等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Color',                    field_type: 'optional',    priority: 16, notes: '' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Connectivity',             field_type: 'optional',    priority: 17, notes: 'Wi-Fi / Bluetooth / USB-C / HDMI等' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Year Manufactured',        field_type: 'optional',    priority: 18, notes: '西暦4桁' },
  { category: 'Laptops', tag_jp: 'パソコン本体', field_name: 'Condition',                field_type: 'required',    priority: 19, notes: 'New / Used / For parts or not working' },

  // === Computers: Desktops ===
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Brand',               field_type: 'required',    priority: 1,  notes: 'Apple/Lenovo/Dell/HP/ASUS/Acer/MSI/Alienware/NEC/Fujitsu等' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Model',               field_type: 'required',    priority: 2,  notes: 'iMac / OptiPlex / ThinkCentre / Legion等のモデル名' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Type',                field_type: 'required',    priority: 3,  notes: 'Desktop / All-in-One / Mini PC / Tower / Workstation' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Processor',           field_type: 'recommended', priority: 4,  notes: 'Intel Core i7 / Apple M4 / AMD Ryzen 9等' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'RAM Size',            field_type: 'recommended', priority: 5,  notes: '例: 16 GB / 32 GB' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'SSD Capacity',        field_type: 'recommended', priority: 6,  notes: '例: 512 GB / 1 TB' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Hard Drive Capacity', field_type: 'optional',    priority: 7,  notes: 'HDD搭載時のみ' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Operating System',    field_type: 'recommended', priority: 8,  notes: 'Windows 11 / macOS / Linux等' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Form Factor',         field_type: 'optional',    priority: 9,  notes: 'Tower / Mini Tower / SFF / All-in-One / NUC' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'GPU',                 field_type: 'optional',    priority: 10, notes: 'RTX 4070 / Radeon RX 7800 XT等' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Color',               field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Connectivity',        field_type: 'optional',    priority: 12, notes: 'Wi-Fi / Bluetooth / USB-C / HDMI / Ethernet等' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Year Manufactured',   field_type: 'optional',    priority: 13, notes: '西暦4桁' },
  { category: 'Desktops', tag_jp: 'パソコン本体', field_name: 'Condition',           field_type: 'required',    priority: 14, notes: 'New / Used / For parts or not working' },

  // === Computers: Tablets ===
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Brand',                 field_type: 'required',    priority: 1,  notes: 'Apple/Microsoft/Samsung/Google/Lenovo/Amazon等' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Model',                 field_type: 'required',    priority: 2,  notes: 'iPad Pro / Surface Pro 9 / Galaxy Tab S9等' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Storage Capacity',      field_type: 'required',    priority: 3,  notes: '例: 64 GB / 128 GB / 256 GB' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Operating System',      field_type: 'required',    priority: 4,  notes: 'iPadOS / Android / Windows' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Screen Size',           field_type: 'recommended', priority: 5,  notes: '例: 10.9 in / 12.9 in' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Internet Connectivity', field_type: 'recommended', priority: 6,  notes: 'Wi-Fi / Wi-Fi + 4G / Wi-Fi + 5G' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Color',                 field_type: 'optional',    priority: 7,  notes: '' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'RAM Size',              field_type: 'optional',    priority: 8,  notes: '例: 8 GB / 16 GB' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Processor',             field_type: 'optional',    priority: 9,  notes: 'Apple M2 / Snapdragon 8 Gen 2等' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Battery Run Time',      field_type: 'optional',    priority: 10, notes: '例: 10 hours' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Connectivity',          field_type: 'optional',    priority: 11, notes: 'USB-C / Bluetooth / Wi-Fi / Cellular等' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Year Manufactured',     field_type: 'optional',    priority: 12, notes: '西暦4桁' },
  { category: 'Tablets', tag_jp: 'パソコン本体', field_name: 'Condition',             field_type: 'required',    priority: 13, notes: 'New / Used / For parts or not working' },

  // === Rings ===
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Brand',             field_type: 'required',    priority:  1, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Ring Size',         field_type: 'required',    priority:  2, notes: 'USサイズで記入（例: 5 / 6.5 / 7）' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Type',              field_type: 'required',    priority:  3, notes: 'Eternity / Signet / Engagement / Wedding Band / Dome 等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal',             field_type: 'required',    priority:  4, notes: 'Gold / Silver / Platinum / Stainless Steel 等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Metal Purity',      field_type: 'required',    priority:  5, notes: '18K / 14K / 925 等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone',        field_type: 'required',    priority:  6, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Style',             field_type: 'recommended', priority:  7, notes: 'Solitaire / Three-Stone / Eternity / Halo 等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Main Stone Color',  field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Color',             field_type: 'recommended', priority:  9, notes: '' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Setting',           field_type: 'recommended', priority: 10, notes: 'Prong / Bezel / Pave / Channel 等' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Total Carat Weight',field_type: 'recommended', priority: 11, notes: 'ct 単位' },
  { category: 'Rings', tag_jp: 'リング,指輪,リング・指輪', field_name: 'Secondary Stone',   field_type: 'recommended', priority: 12, notes: '' },

  

  // === Bracelets ===
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Brand',               field_type: 'required',    priority:  1, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Style',               field_type: 'required',    priority:  2, notes: 'Charm / Tennis / Cuff / Bangle 等' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Type',                field_type: 'required',    priority:  3, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal',               field_type: 'required',    priority:  4, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Metal Purity',        field_type: 'required',    priority:  5, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Main Stone',          field_type: 'required',    priority:  6, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Color',               field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Main Stone Color',    field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Charm Type',          field_type: 'recommended', priority:  9, notes: 'チャームブレスレット用' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Theme',               field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Bracelets', tag_jp: 'ブレスレット,バングル', field_name: 'Number of Gemstones', field_type: 'recommended', priority: 11, notes: '' },

  // === Earrings ===
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Brand',               field_type: 'required',    priority:  1, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Style',               field_type: 'required',    priority:  2, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Type',                field_type: 'required',    priority:  3, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal',               field_type: 'required',    priority:  4, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Metal Purity',        field_type: 'required',    priority:  5, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Main Stone',          field_type: 'required',    priority:  6, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Color',               field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Main Stone Color',    field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Closure',             field_type: 'optional',    priority:  9, notes: 'Pierced / Clip On / Screw Back / Magnetic' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Main Stone Creation', field_type: 'recommended', priority: 10, notes: 'Natural / Lab-Created / Simulated' },
  { category: 'Earrings', tag_jp: 'ピアス,イヤリング', field_name: 'Theme',               field_type: 'recommended', priority: 11, notes: '' },

  // === Handbags ===
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Brand',                field_type: 'required',    priority:  1, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Style',                field_type: 'required',    priority:  2, notes: 'Tote, Shoulder Bag, Crossbody等' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Material',    field_type: 'required',    priority:  3, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Exterior Color',       field_type: 'required',    priority:  4, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Department',           field_type: 'required',    priority:  5, notes: 'Women / Men / Unisex' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Country of Origin',    field_type: 'recommended', priority:  6, notes: '製造国。フルネーム英語' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Color',                field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Size',                 field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Closure',              field_type: 'recommended', priority:  9, notes: 'Zip / Magnetic / Flap / Snap 等' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Hardware Color',       field_type: 'recommended', priority: 10, notes: 'Gold / Silver / Gunmetal 等' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Lining Material',      field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Handbags', tag_jp: 'バッグ,ハンドバッグ,ショルダーバッグ,トートバッグ,リュック,ボストンバッグ,クラッチバッグ', field_name: 'Vintage',              field_type: 'optional',    priority: 12, notes: 'Yes / No' },

  // === Clothing ===
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Department', field_type: 'required', priority: 3, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'メイン素材のみ' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Size Type', field_type: 'required', priority: 7, notes: 'Regular / Plus / Petite / Tall等' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Size', field_type: 'required', priority: 8, notes: 'XS / S / M / L / XL 等' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Style', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Pattern', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Vintage', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Clothing', tag_jp: '衣類,服,トップス,ボトムス,ジャケット,コート,ドレス,スカート,パンツ', field_name: 'Gender', field_type: 'optional', priority: 12, notes: '' },

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
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Optical Zoom', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Maximum Aperture', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Cameras', tag_jp: 'カメラ,デジカメ,一眼レフ,ミラーレス', field_name: 'Sensor Size', field_type: 'recommended', priority: 13, notes: '' },

  // === Electronics ===
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Model', field_type: 'recommended', priority: 2, notes: '型番' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Connectivity', field_type: 'recommended', priority: 4, notes: 'Wired/Wireless/Bluetooth/USB等' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Features', field_type: 'recommended', priority: 5, notes: 'ANC, Hi-Res, Smart等' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Power Source', field_type: 'recommended', priority: 6, notes: 'AC/Battery/USB' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Wireless Technology', field_type: 'recommended', priority: 9, notes: 'Bluetooth / Wi-Fi / NFC / AptX / LDAC / AAC / None' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Form Factor', field_type: 'recommended', priority: 10, notes: 'In-Ear / Over-Ear / On-Ear / TWS / Portable / Desktop / Bookshelf' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Year Manufactured', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Series', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Electronics', tag_jp: '電子機器,家電,オーディオ,ヘッドホン,イヤホン,スピーカー,オーディオアンプ,AVアンプ,レシーバー,ターンテーブル,レコードプレーヤー,カセットデッキ,ウォークマン,DAP,ポータブルプレーヤー,炊飯器,掃除機,ドライヤー,美顔器,電気ケトル,空気清浄機,プロジェクター,ラジオ', field_name: 'Number of Earpieces', field_type: 'optional', priority: 13, notes: '1 (片耳) / 2 (両耳) / N/A' },

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
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Card Type', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Age Level', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Features', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Language', field_type: 'optional', priority: 14, notes: '' },
  { category: 'Trading Cards', tag_jp: 'トレカ,カード,トレーディングカード,ポケカ,遊戯王,MTG', field_name: 'Vintage', field_type: 'optional', priority: 15, notes: 'Yes (旧裏 1996-2002 era) / No' },

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
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Release Year', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Series', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Franchise', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Edition', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Number of Players', field_type: 'optional', priority: 14, notes: '' },
  { category: 'Video Games', tag_jp: 'ゲーム,ゲームソフト,テレビゲーム,Switch,PS5,PS4,PS3,PS2,Xbox,ファミコン,スーファミ,ゲームボーイ', field_name: 'Vintage', field_type: 'optional', priority: 15, notes: '' },

  // === Video Game Consoles ===
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Brand',            field_type: 'required',    priority: 1,  notes: 'Nintendo, Sony, Sega等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Platform',         field_type: 'required',    priority: 2,  notes: 'Nintendo Switch, PlayStation 5等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Model',            field_type: 'required',    priority: 3,  notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Type',             field_type: 'required',    priority: 4,  notes: 'Home Console, Handheld等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Storage Capacity', field_type: 'recommended', priority: 5,  notes: '500GB, 1TB等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Color',            field_type: 'recommended', priority: 6,  notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Region Code',      field_type: 'required',    priority: 7,  notes: 'NTSC-J (Japan), Region Free等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Connectivity',     field_type: 'recommended', priority: 8,  notes: 'HDMI, Wi-Fi, Bluetooth等' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Country of Origin',field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Year Manufactured', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Charger Included',  field_type: 'recommended', priority: 11, notes: 'Yes / No / Not Applicable' },
  { category: 'Video Game Consoles', tag_jp: 'ゲーム機', field_name: 'Features',          field_type: 'recommended', priority: 12, notes: '' },

  // === Video Game Accessories ===
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Brand',            field_type: 'required',    priority: 1,  notes: 'Nintendo, Sony, Sega, Hori, 8BitDo等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Platform',         field_type: 'required',    priority: 2,  notes: 'Nintendo Switch, PlayStation 5等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Type',             field_type: 'required',    priority: 3,  notes: 'Controller, Memory Card, Cable, Adapter, Case等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Model',            field_type: 'recommended', priority: 4,  notes: 'DualShock 4, Pro Controller, Joy-Con等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Color',            field_type: 'recommended', priority: 5,  notes: '' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Connectivity',     field_type: 'recommended', priority: 6,  notes: 'Wireless, Wired, Bluetooth, USB等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Region Code',      field_type: 'recommended', priority: 7,  notes: 'NTSC-J (Japan)等' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Country of Origin',field_type: 'recommended', priority: 8,  notes: '' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Compatible Product',field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Compatible Model', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Number of Players',field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Video Game Accessories', tag_jp: 'コントローラー,ジョイスティック,メモリーカード,ゲーム周辺機器', field_name: 'Features',         field_type: 'optional',    priority: 12, notes: '' },

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
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Reel Size', field_type: 'recommended', priority: 11, notes: 'S, M, L, 1000, 2500, 4000等のサイズ番手' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Drag Style', field_type: 'recommended', priority: 12, notes: 'Front Drag, Rear Drag, Cross Carbon等' },
  { category: 'Fishing Reels', tag_jp: 'リール', field_name: 'Maximum Drag', field_type: 'recommended', priority: 13, notes: '最大ドラグ力（kg/lb）' },

  // === Shoes ===
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Department', field_type: 'required', priority: 3, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Material', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'US Shoe Size', field_type: 'required', priority: 7, notes: 'US サイズ表記 (例: US 8, US 9.5)' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Size', field_type: 'optional', priority: 8, notes: 'EU / UK / JP等のサイズ' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Style', field_type: 'optional', priority: 9, notes: 'Oxford / Sneaker / Loafer / Boot等' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Pattern', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Series', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Vintage', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Shoes', tag_jp: '靴,シューズ,スニーカー,ブーツ,サンダル,パンプス,ローファー', field_name: 'Gender', field_type: 'optional', priority: 13, notes: '' },

  // === Collectibles (コレクティブル・アンティーク・ヴィンテージ) ===
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Brand', field_type: 'required', priority: 1, notes: 'メーカー・ブランド・企業名' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Character', field_type: 'recommended', priority: 2, notes: 'キャラクター名（なければNA）' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Franchise', field_type: 'recommended', priority: 3, notes: '作品名・シリーズ名（なければNA）' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの,けん玉,ケンダマ,剣玉,独楽,コマ,こま', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Tin Toy, Pin Badge, Sign, Medal, Poster, Figurine, Promotional Item, Traditional Toy, Kendama, Spinning Top等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: 'Railway, Military, Advertising, Tourism, Sports等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'Tin, Metal, Enamel, Paper, Wood, Glass, Plastic, Soft Vinyl等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Collection', field_type: 'recommended', priority: 9, notes: 'シリーズ名・コレクション名' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Subject', field_type: 'recommended', priority: 10, notes: 'Locomotive, Aircraft, Samurai, Geisha等' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Character Family', field_type: 'recommended', priority: 11, notes: 'Astro Boy, Ultraman等のファミリー' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Color', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Collectibles', tag_jp: 'コレクティブル,アンティーク,ヴィンテージ,骨董品,昭和レトロ,レトロ,ブリキ,ソフビ,ノベルティ,非売品,ピンバッジ,ミリタリー,鉄道グッズ,記念品,当時物,デッドストック,景品,紙もの', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: 'Yes / No' },

  // === Watch Parts ===
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Brand',            field_type: 'required',    priority:  1, notes: '' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Part Type',        field_type: 'required',    priority:  2, notes: 'Link, Bracelet, Band/Strap, Buckle, Clasp, Movement, Crystal, Crown, Case Back, Dial, Bezel, Hand, Spring Bar, Rotor, Stem 等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Material',         field_type: 'required',    priority:  3, notes: 'Stainless Steel, Gold, Titanium, Leather, Rubber, Ceramic 等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Compatible Model', field_type: 'recommended', priority:  4, notes: '対応するモデル名（Submariner, Speedmaster等）' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Size',             field_type: 'recommended', priority:  5, notes: 'mm単位。ラグ幅・ベルト幅・コマ幅など' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Color',            field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Type',             field_type: 'recommended', priority:  8, notes: '時計タイプ（Analog, Digital, Pocket Watch等）' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Compatible Brand', field_type: 'optional',    priority:  9, notes: '互換対応ブランド（Rolex, Omega等）' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Movement Type',    field_type: 'optional',    priority: 10, notes: '機械式 / クォーツ / 自動巻き等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Finish',           field_type: 'optional',    priority: 11, notes: 'Polished / Brushed / PVD等' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Vintage',          field_type: 'optional',    priority: 12, notes: '' },
  { category: 'Watch Parts', tag_jp: 'ウォッチパーツ,時計パーツ,時計部品', field_name: 'Series',           field_type: 'optional',    priority: 13, notes: '' },

  // === Sunglasses ===
  

  // === Soap (石鹸) ===
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Bar Soap固定' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Scent', field_type: 'required', priority: 3, notes: 'Rose, Lavender, Citrus, Honey等' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Product Line', field_type: 'recommended', priority: 4, notes: 'ブランドの代表ライン名' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '製造国。フルネーム英語' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Ingredients', field_type: 'optional', priority: 7, notes: '主要成分・原材料' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Body Area', field_type: 'optional', priority: 8, notes: '使用する体の部位（Face / Body / Hand等）' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Skin Type', field_type: 'optional', priority: 9, notes: '対応肌タイプ（Dry / Oily / Sensitive等）' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Size', field_type: 'optional', priority: 10, notes: '容量・サイズ' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Item Weight', field_type: 'optional', priority: 11, notes: '内容量・重量' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Series', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Soap', tag_jp: '石鹸,せっけん,ソープ,石けん', field_name: 'Number of Pieces', field_type: 'optional', priority: 13, notes: 'セット個数' },

  // === Dolls & Plush (ドール＆ぬいぐるみ) ===
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Fashion Doll, BJD, Teddy Bear, Plush Toy, Art Toy等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Character', field_type: 'required', priority: 3, notes: 'キャラクター名。該当しない場合はN/A' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Size', field_type: 'recommended', priority: 4, notes: '高さcm表記推奨' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'Mohair, Plush, Vinyl, ABS等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。Made in Japanが強いキーワード' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Franchise', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Doll Gender', field_type: 'recommended', priority: 9, notes: 'Female / Male / Neutral / N/A' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Doll Hair Color', field_type: 'optional', priority: 10, notes: 'Black / Brown / Blonde / White / Custom等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Doll Eye Color', field_type: 'optional', priority: 11, notes: 'Brown / Blue / Green / Custom等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Doll Complexion', field_type: 'optional', priority: 12, notes: 'Light / Medium / Dark / Custom等' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Theme', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Vintage', field_type: 'optional', priority: 14, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Series', field_type: 'optional', priority: 15, notes: '' },
  { category: 'Dolls & Plush', tag_jp: 'ドール,ぬいぐるみ,テディベア,人形,フィギュアドール,BJD', field_name: 'Year Manufactured', field_type: 'optional', priority: 16, notes: '' },

  // === Scarves (スカーフ) ===
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Scarf, Shawl, Stole, Muffler' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk, Cashmere, Wool, Cotton等' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '例: 90cm x 90cm, 70cm x 180cm等' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '製造国。フルネーム英語' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Department', field_type: 'required', priority: 8, notes: '対象部門（レディース/メンズ等）' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Vintage', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Scarves', tag_jp: 'スカーフ,マフラー,ストール', field_name: 'Gender', field_type: 'optional', priority: 10, notes: '' },

  // === Hats (帽子) ===
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Style', field_type: 'required', priority: 2, notes: 'Baseball Cap, Bucket Hat, Beanie, Fedora, Trucker Hat, Snapback, Dad Hat, Visor, Beret, Newsboy Cap, Flat Cap, Sun Hat, Panama Hat, Cowboy Hat' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Department', field_type: 'required', priority: 3, notes: 'Men, Women, Unisex Adults' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Color', field_type: 'required', priority: 4, notes: '' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Cotton, Polyester, Wool, Acrylic, Nylon, Mesh, Straw, Leather, Canvas' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: 'Solid, Camouflage, Plaid, Striped, Floral, Animal Print' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Size', field_type: 'recommended', priority: 7, notes: 'One Size, S, M, L, XL, 7 1/8, 7 1/4, 7 3/8, 7 1/2, Adjustable' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Country of Origin',   field_type: 'recommended', priority: 8, notes: '製造国。フルネーム英語' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Type',             field_type: 'recommended', priority: 9, notes: 'Baseball Cap, Bucket Hat, Beanie等のタイプ分類' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Character',        field_type: 'recommended', priority: 10, notes: 'グッズ系帽子向け' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Vintage',          field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Hats', tag_jp: '帽子,キャップ,ハット,ビーニー,バケットハット,スナップバック,ベースボールキャップ,トラッカーハット,ニット帽,ベレー帽', field_name: 'Official/Unofficial', field_type: 'optional',  priority: 12, notes: '' },

  // === Sunglasses ===
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Frame Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Lens Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Frame Material', field_type: 'recommended', priority: 5, notes: 'Metal / Plastic / Titanium等' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Type', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Lens Technology', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'UV Protection', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Size', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Series', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Sunglasses', tag_jp: 'サングラス,メガネ,眼鏡', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: '' },

  // === Kimono ===
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Furisode / Tomesode / Houmongi / Obi / Yukata / Hakama等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Cotton / Polyester / Linen' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: 'Floral / Geometric / Scenic等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Season', field_type: 'recommended', priority: 6, notes: 'Awase(lined) / Hitoe(unlined) / Summer' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Technique/Weave', field_type: 'recommended', priority: 8, notes: 'Yuzen / Oshima Tsumugi / Yuki Tsumugi等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Era', field_type: 'optional', priority: 10, notes: '明治/大正/昭和等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Department', field_type: 'optional', priority: 11, notes: 'レディース/メンズ/キッズ' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴,小紋,紬,付下げ,羽織,色無地,反物,草履,下駄,名古屋帯,袋帯,半幅帯', field_name: 'Occasion', field_type: 'optional', priority: 12, notes: '成人式/婚礼/茶道等' },

  // === Japanese Swords ===
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Tsuba / Koshirae / Fuchi-Kashira / Menuki / Kozuka / Kogai等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Iron / Shakudo / Shibuichi / Brass / Silver' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Technique', field_type: 'recommended', priority: 3, notes: 'Inlay / Carving / Openwork(Sukashi)等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Era/Period', field_type: 'recommended', priority: 4, notes: 'Muromachi / Momoyama / Edo / Meiji' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'School/Maker', field_type: 'recommended', priority: 5, notes: 'Goto / Shoami / Higo / Nara / Mino' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Motif/Subject', field_type: 'recommended', priority: 6, notes: 'Dragon / Waves / Floral / Samurai等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Color', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Original/Reproduction', field_type: 'recommended', priority: 9, notes: 'Antique Original / Contemporary' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭,拵え,小柄,笄', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Tea Ceremony ===
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Tea Bowl / Natsume / Tea Caddy等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Ceramic / Lacquer / Bamboo / Iron' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Maker', field_type: 'recommended', priority: 3, notes: '作家名' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Origin/Kiln', field_type: 'recommended', priority: 4, notes: 'Raku / Hagi / Bizen / Kyoto等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Era/Period', field_type: 'recommended', priority: 5, notes: 'Edo / Meiji / Taisho / Showa' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Box Type', field_type: 'recommended', priority: 6, notes: 'Tomobako / Paper Box / None' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Motif/Subject', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Pattern', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜,蓋置,香合,花入,茶筅,柄杓,菓子器,炉縁', field_name: 'Color', field_type: 'recommended', priority: 11, notes: '青磁/天目/黒楽/赤楽/白磁' },

  // === Bonsai（※生きた木/植物は輸出不可。鉢・道具・水石等のみ） ===
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Bonsai Pot / Suiseki / Display Stand / Tools等' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Ceramic / Clay / Stone / Wood / Metal' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Shape', field_type: 'recommended', priority: 5, notes: 'Round / Oval / Rectangle / Cascade / Hexagonal' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Maker/Kiln', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Era/Period', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Glaze/Finish', field_type: 'recommended', priority: 8, notes: 'Unglazed / Glazed / Yakishime / Colored' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Drainage Holes', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景,盆栽道具,盆栽ハサミ,飾台,卓,水盤', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Prints ===
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Listed By', field_type: 'required', priority: 1, notes: 'Dealer or Reseller / Private Listing' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Medium', field_type: 'required', priority: 2, notes: 'Woodblock / Lithograph / Screenprint / Etching' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Subject', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Maker', field_type: 'recommended', priority: 4, notes: '作家名' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Style', field_type: 'recommended', priority: 5, notes: 'Ukiyo-e / Shin-hanga / Sosaku-hanga' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Era/Period', field_type: 'recommended', priority: 7, notes: 'Edo / Meiji / Taisho / Showa' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Original/Licensed Reproduction', field_type: 'recommended', priority: 8, notes: 'Original / Reproduction / Later Printing' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Edition', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Series', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Framing', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン,エッチング,銅版画,新版画,創作版画', field_name: 'Signed', field_type: 'optional', priority: 13, notes: '' },

  // === Buddhist Art ===
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Statue / Scroll / Altar Tool / Prayer Beads等' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Wood / Bronze / Stone / Gold Leaf / Lacquer' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Subject/Deity', field_type: 'recommended', priority: 3, notes: 'Kannon / Amida / Shaka / Fudo / Jizo等' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Maker', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Technique', field_type: 'recommended', priority: 5, notes: 'Carved / Cast / Lacquered / Gilt' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Era', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Original/Reproduction', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像,観音,如来,数珠,木魚', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Tetsubin ===
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '南部鉄器/龍文堂等' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Tetsubin / Ginbin / Kyusu / Chagama' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cast Iron / Silver / Copper' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Maker/Kiln', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Era/Period', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Technique', field_type: 'recommended', priority: 6, notes: 'Arare / Hada / Inlay' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Pattern', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Size', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Capacity', field_type: 'recommended', priority: 9, notes: 'ml' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

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
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国。フルネーム英語' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Bounce', field_type: 'recommended', priority: 11, notes: '角度（ウェッジのバウンス角）' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Head Shape', field_type: 'recommended', priority: 12, notes: 'Blade, Mallet, Cavity Back等' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Lie Angle', field_type: 'recommended', priority: 13, notes: 'ライ角（°）' },

  // === Tennis ===
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Racquet / Ball / String / Grip等' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Head Size', field_type: 'recommended', priority: 3, notes: 'sq in' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Grip Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'String Pattern', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Weight', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Model', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Flex', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Balance', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Color', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Material', field_type: 'optional', priority: 12, notes: 'フレーム素材 (Carbon / Aluminum等)' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Level', field_type: 'optional', priority: 13, notes: '対象レベル (Beginner / Intermediate / Advanced等)' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Series', field_type: 'optional', priority: 14, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Gender', field_type: 'optional', priority: 15, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Age Group', field_type: 'optional', priority: 16, notes: '対象年齢層 (Adult / Junior等)' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Vintage', field_type: 'optional', priority: 17, notes: '' },

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
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Experience Level', field_type: 'recommended', priority: 11, notes: 'Beginner / Intermediate / Advanced' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Lining Material', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: 'Yes / No' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Series/Line', field_type: 'optional', priority: 14, notes: '' },

  // === Japanese Instruments ===
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Shamisen / Shakuhachi / Koto / Shinobue / Taiko' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Bamboo / Wood / Silk / Skin' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Maker', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Subtype', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Key/Pitch', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Era/Period', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Color', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Set Includes', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽,琵琶,鼓,和楽器', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  // === Fishing Rods ===
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Type', field_type: 'required', priority: 2, notes: 'Spinning / Casting / Fly / Surf / Jigging / Shore / Telescopic' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Item Length', field_type: 'recommended', priority: 4, notes: 'ft単位' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Power', field_type: 'recommended', priority: 5, notes: 'Ultra Light / Light / Medium / Heavy' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Action', field_type: 'recommended', priority: 6, notes: 'Fast / Moderate / Slow' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fish Species', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fishing Type', field_type: 'recommended', priority: 8, notes: 'Freshwater / Saltwater' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Material', field_type: 'recommended', priority: 9, notes: 'Carbon / Fiberglass / Composite' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '製造国。フルネーム英語' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Pieces', field_type: 'recommended', priority: 11, notes: 'ピース数 / 継数 (1 / 2 / 3 等)' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Line Weight', field_type: 'recommended', priority: 12, notes: '適合ライン (lb/kg)' },

  // === Fishing Lures ===
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Brand',            field_type: 'required',    priority: 1,  notes: 'Megabass, Jackall, DUO, OSP等' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Type',             field_type: 'required',    priority: 2,  notes: 'Crankbait, Minnow, Metal Jig, Soft Plastic, Spoon, Squid Jig等' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Model',            field_type: 'required',    priority: 3,  notes: '' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Bait Type',        field_type: 'required',    priority: 4,  notes: 'eBay mandatory。Artificial Lure / Soft Bait / Metal Jig / Fly / Live Bait等' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Color',            field_type: 'recommended', priority: 5,  notes: '' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Weight',           field_type: 'recommended', priority: 6,  notes: 'g or oz' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Buoyancy',         field_type: 'recommended', priority: 7,  notes: 'Floating / Sinking / Suspending' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Fishing Type',     field_type: 'recommended', priority: 8,  notes: 'Freshwater / Saltwater' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Fish Species',     field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Item Length',      field_type: 'recommended', priority: 10, notes: 'mm or inches' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Number in Pack',   field_type: 'recommended', priority: 11, notes: '1個/3個/5個セット等' },
  { category: 'Fishing Lures', tag_jp: 'ルアー,ミノー,クランクベイト,ワーム,メタルジグ,エギ,スプーン', field_name: 'Country of Origin',field_type: 'recommended', priority: 12, notes: '' },

  // === Mecha Model Kits ===
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: '' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Brand',            field_type: 'required',    priority: 2,  notes: 'Bandai / Kotobukiya / Wave等' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Series/Franchise',  field_type: 'required',    priority: 3,  notes: 'Gundam / Evangelion / Macross / Zoids等' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Character/Mecha',   field_type: 'required',    priority: 4,  notes: '' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Grade',            field_type: 'required',    priority: 5,  notes: 'HG / MG / RG / PG / SD等' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Scale',            field_type: 'recommended', priority: 6,  notes: '1/144, 1/100, 1/60等' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Type',             field_type: 'recommended', priority: 7,  notes: 'Plastic Model Kit / Resin Kit' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Built Status',      field_type: 'recommended', priority: 8,  notes: 'Unbuilt / Built / Partially Built' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Release Year',      field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Features',         field_type: 'recommended', priority: 11, notes: 'auto-injected: Collectors Edition' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Theme',            field_type: 'recommended', priority: 12, notes: 'auto-injected: Anime & Manga' },
  { category: 'Mecha Model Kits', tag_jp: 'ガンプラ,HGUC,MG,RG,PG,SD,BB戦士,プレバン,ゾイド,フレームアームズ,メカプラモ,ロボットプラモ', field_name: 'Age Level',        field_type: 'recommended', priority: 13, notes: 'auto-injected: 17 Years & Up (CPSC compliance)' },

  // === RC & Scale Models ===
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: 'Dealer or Reseller / Private Listing' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Brand',            field_type: 'required',    priority: 2,  notes: 'Tamiya / Kyosho / Hasegawa等' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Type',             field_type: 'required',    priority: 3,  notes: 'RC Car / Static Model / Mini 4WD / Model Train' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Scale',            field_type: 'recommended', priority: 4,  notes: '1/10, 1/24, 1/35, 1/48, 1/72' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Vehicle Type',      field_type: 'recommended', priority: 5,  notes: 'Car / Tank / Aircraft / Ship / Train' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Model/Series',      field_type: 'recommended', priority: 6,  notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Power Type',        field_type: 'recommended', priority: 7,  notes: 'Electric / Nitro / Gas（RC用）' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Built Status',      field_type: 'recommended', priority: 8,  notes: 'Unbuilt / Built' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Country of Origin', field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Motor Type',        field_type: 'recommended', priority: 10, notes: 'Brushed / Brushless / N/A' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: '4WD/2WD',           field_type: 'recommended', priority: 11, notes: '4WD / 2WD / AWD / N/A' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Year Manufactured', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Features',         field_type: 'recommended', priority: 13, notes: 'auto-injected: Collectors Edition' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆,モデルカー,スケールモデル,戦車,戦闘機,鉄道模型', field_name: 'Age Level',        field_type: 'recommended', priority: 14, notes: 'auto-injected: 13+' },

  // === Manga ===
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: '' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Title',            field_type: 'required',    priority: 2,  notes: '作品名' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Author',           field_type: 'required',    priority: 3,  notes: '' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Volume/Set',       field_type: 'recommended', priority: 4,  notes: '巻数 or Complete Set' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Format',           field_type: 'recommended', priority: 5,  notes: 'Tankobon / Bunkoban / Wide Edition等' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Publisher',        field_type: 'recommended', priority: 6,  notes: 'Shueisha / Kodansha / Shogakukan等' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Language',         field_type: 'recommended', priority: 7,  notes: 'Japanese' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Genre',            field_type: 'recommended', priority: 8,  notes: 'Shonen / Shojo / Seinen / Josei / BL' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Edition',          field_type: 'recommended', priority: 9,  notes: 'First Edition / With Obi / Limited等' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Country of Origin',field_type: 'recommended', priority: 10, notes: 'auto-injected: Japan' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Theme',            field_type: 'recommended', priority: 11, notes: 'auto-injected: Anime & Manga' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Publication Year', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Features',         field_type: 'recommended', priority: 13, notes: 'auto-injected: Collectors Edition' },
  { category: 'Manga', tag_jp: '漫画,マンガ,コミック,単行本,文庫本,全巻セット,初版,同人誌,画集', field_name: 'Age Level',        field_type: 'recommended', priority: 14, notes: 'auto-injected: Shonen/Shojo=13+, Seinen/Josei=16+, Adult=18+ (Genre-based dynamic)' },

  // === Anime Merchandise ===
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Character',        field_type: 'required',    priority: 2,  notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Franchise',        field_type: 'required',    priority: 3,  notes: '作品名' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Type',             field_type: 'required',    priority: 4,  notes: 'Acrylic Stand / Pin Badge / Tapestry / Clear File等' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Official/Unofficial',field_type: 'recommended', priority: 5,  notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Brand',            field_type: 'recommended', priority: 6,  notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Year',             field_type: 'recommended', priority: 7,  notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Country of Origin', field_type: 'recommended', priority: 8,  notes: 'auto-injected: Japan' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'TV Show',          field_type: 'recommended', priority: 9,  notes: 'アニメ番組名 / シリーズ名' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Theme',            field_type: 'recommended', priority: 10, notes: 'auto-injected: Anime & Manga' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Edition',          field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Features',         field_type: 'recommended', priority: 12, notes: 'auto-injected: Collectors Edition' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Age Level',        field_type: 'recommended', priority: 13, notes: 'auto-injected: 13+' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,アクスタ,缶バッジ,タペストリー,クリアファイル,色紙,ラバスト,ポスター,セル画,原画,ブロマイド,キーホルダー', field_name: 'Material',         field_type: 'optional',    priority: 14, notes: '' },

  // === Figures ===
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Franchise',        field_type: 'required',    priority: 2,  notes: '作品名' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Character',        field_type: 'required',    priority: 3,  notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Type',             field_type: 'required',    priority: 4,  notes: 'Action Figure / Statue / Nendoroid / Prize Figure等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Brand',            field_type: 'required',    priority: 5,  notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Scale',            field_type: 'recommended', priority: 6,  notes: '1/6 / 1/7 / 1/8 / Non-scale' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Material',         field_type: 'recommended', priority: 7,  notes: 'PVC / ABS / Resin' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Series/Line',      field_type: 'recommended', priority: 8,  notes: 'Figma / Nendoroid / Pop Up Parade / S.H.Figuarts等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Release Year',     field_type: 'recommended', priority: 9,  notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Country of Origin',field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Theme',            field_type: 'optional',    priority: 11, notes: 'auto-injected: Anime & Manga' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Age Level',        field_type: 'recommended', priority: 12, notes: 'auto-injected: 17 Years & Up (CPSC compliance)' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Features',         field_type: 'optional',    priority: 13, notes: 'auto-injected: Collectors Edition' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Edition',          field_type: 'optional',    priority: 14, notes: 'Limited / DX / Special Color / Pearl / TWE / WonFes / Convention Exclusive' },

  // === Stamps ===
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Certification', field_type: 'required', priority: 1, notes: 'PCGS / NGC等' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Commemorative / Definitive / Revenue等' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Year of Issue', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Topic', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Quality', field_type: 'recommended', priority: 5, notes: 'Mint / Used / Mint Never Hinged' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Grade', field_type: 'required', priority: 7, notes: '切手グレード（Mint / Fine / VF等）' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Series', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Denomination', field_type: 'optional', priority: 9, notes: '切手の額面金額' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Vintage', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Number of Pieces', field_type: 'optional', priority: 11, notes: 'セット枚数' },

  // === Coins ===
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Certification', field_type: 'required', priority: 1, notes: 'PCGS / NGC / Uncertified' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Denomination', field_type: 'required', priority: 2, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Year', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Gold / Silver / Copper / Bronze' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Grade', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Type', field_type: 'optional', priority: 7, notes: '記念硬貨 / 流通貨 / 地金貨等' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Series', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Mint', field_type: 'optional', priority: 9, notes: '造幣局・鋳造所' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Theme', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Finish', field_type: 'optional', priority: 11, notes: 'Proof / BU / Circulated等' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Vintage', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Number of Pieces', field_type: 'optional', priority: 13, notes: 'セット枚数' },

  // === Records ===
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Release Title', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Genre', field_type: 'recommended', priority: 3, notes: 'Rock / Jazz / Pop / Classical等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Grading', field_type: 'recommended', priority: 4, notes: 'Mint / Near Mint / Very Good Plus等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Label', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Format', field_type: 'recommended', priority: 6, notes: 'LP / EP / Single / CD / Cassette' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Size', field_type: 'recommended', priority: 7, notes: '7" / 10" / 12"' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Release Year', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Sleeve Grading', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Material', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Type', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Color', field_type: 'recommended', priority: 13, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Speed', field_type: 'optional', priority: 14, notes: '33/45/78 RPM' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Edition', field_type: 'optional', priority: 15, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Pressing Country', field_type: 'optional', priority: 16, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Vintage', field_type: 'optional', priority: 17, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Inlay Condition', field_type: 'optional', priority: 18, notes: 'Mint / Near Mint / VG+ / VG等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Case Type', field_type: 'optional', priority: 19, notes: 'Cardboard Sleeve / Paper Sleeve / Plastic Slipcover' },

  // === Necklaces ===
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Style',          field_type: 'required',    priority:  1, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Brand',          field_type: 'required',    priority:  2, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Type',           field_type: 'required',    priority:  3, notes: 'Necklace / Pendant / Chain等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal',          field_type: 'required',    priority:  4, notes: 'Gold / Silver / Platinum等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal Purity',   field_type: 'optional',    priority:  5, notes: 'Metal が貴金属の場合。IS_PURITY_PATTERNS で自動抽出' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone',     field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Color',          field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone Color',field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Pendant Shape',  field_type: 'recommended', priority:  9, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Theme',          field_type: 'recommended', priority: 10, notes: 'テーマ・モチーフ' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Length',         field_type: 'optional',    priority: 11, notes: 'チェーン長。単位は AI 抽出に委任' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Closure',        field_type: 'optional',    priority: 12, notes: '留め金。返品率低下に直結' },

  // === Brooches ===
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Type',               field_type: 'required',    priority:  1, notes: 'Brooch / Pin' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Brand',              field_type: 'required',    priority:  2, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Material',           field_type: 'required',    priority:  3, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Color',              field_type: 'recommended', priority:  4, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Metal',              field_type: 'recommended', priority:  5, notes: 'Gold / Silver等' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone',         field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Color',   field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Theme',              field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Style',              field_type: 'recommended', priority:  9, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Setting Style',      field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Creation',field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Metal Purity',       field_type: 'optional',    priority: 12, notes: '' },

  // === Cufflinks ===
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Brand',               field_type: 'required',    priority:  1, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Type',                field_type: 'required',    priority:  2, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal',               field_type: 'required',    priority:  3, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal Purity',        field_type: 'recommended', priority:  4, notes: '18k / 14k / 925等' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone',          field_type: 'recommended', priority:  5, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Color',               field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Style',               field_type: 'recommended', priority:  7, notes: 'Barbell / Wraparound / Stud 等' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone Color',    field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Diamond Color Grade', field_type: 'recommended', priority:  9, notes: 'ダイヤ品質評価 (D-Z)' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Total Carat Weight',  field_type: 'recommended', priority: 10, notes: '総カラット重量 (ct)' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Theme',               field_type: 'optional',    priority: 11, notes: '' },

  // === Hair Accessories ===
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Type',             field_type: 'required',    priority:  1, notes: 'Comb / Clip / Pin / Headband等' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Brand',            field_type: 'recommended', priority:  2, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Color',            field_type: 'recommended', priority:  3, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Material',         field_type: 'recommended', priority:  4, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Hair Type',        field_type: 'recommended', priority:  5, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Vintage',          field_type: 'optional',    priority:  7, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Season',           field_type: 'optional',    priority:  8, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Series',           field_type: 'optional',    priority:  9, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Franchise',        field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Character',        field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Pattern',          field_type: 'optional',    priority: 12, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Number of Pieces', field_type: 'optional',    priority: 13, notes: '' },

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
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Origin', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Production Technique', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: '' },

  // === Neckties ===
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Polyester等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Necktie / Bow Tie等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: 'Solid / Striped / Paisley等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Department', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Item Width', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Vintage', field_type: 'optional', priority: 9, notes: '' },

  // === Handkerchiefs ===
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cotton / Linen / Silk等' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Pattern', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Gender', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Type', field_type: 'required', priority: 7, notes: 'Handkerchief / Pocket Square等' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Department', field_type: 'required', priority: 8, notes: '対象部門' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Vintage', field_type: 'optional', priority: 9, notes: '' },

  // === Tie Accessories ===
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Brand',            field_type: 'required',    priority:  1, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Type',             field_type: 'required',    priority:  2, notes: 'Tie Clip / Tie Pin / Tie Bar' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal',            field_type: 'recommended', priority:  3, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal Purity',     field_type: 'recommended', priority:  4, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Main Stone',       field_type: 'recommended', priority:  5, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Color',            field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Material',         field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Vintage',          field_type: 'optional',    priority:  9, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Series',           field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Number of Pieces', field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Gender',           field_type: 'optional',    priority: 12, notes: '' },

  // === Glassware ===
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Figurine等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Glass / Crystal等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: 'Blown / Cut / Pressed等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Subject', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Glassware Type', field_type: 'recommended', priority: 9, notes: 'Wine Glass / Champagne Flute / Tumbler / Vase等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Vintage', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Number of Pieces', field_type: 'optional', priority: 12, notes: '' },

  // === Snow Globes ===
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Listed By',        field_type: 'required',    priority: 1,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Brand',             field_type: 'recommended', priority: 2,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Type',              field_type: 'required',    priority: 3,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Subject',           field_type: 'recommended', priority: 4,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Character',         field_type: 'recommended', priority: 5,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Franchise',         field_type: 'recommended', priority: 6,  notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Material',          field_type: 'recommended', priority: 7,  notes: 'Glass / Plastic' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Features',          field_type: 'recommended', priority: 8,  notes: 'auto-injected: Collectors Edition' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Occasion',          field_type: 'recommended', priority: 9,  notes: 'Christmas / Birthday等' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Collection',        field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Year Manufactured', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Theme',             field_type: 'recommended', priority: 13, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Age Level',         field_type: 'recommended', priority: 14, notes: 'auto-injected: 13+ (per 椛島さん特例指示)' },

  // === Boxes ===
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Jewelry Box / Watch Box等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Wood / Leather / Velvet等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Suitable For', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Shape', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Lining Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Vintage', field_type: 'optional', priority: 10, notes: '' },

  // === Flatware ===
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Spoon / Fork / Knife / Set等' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Pattern', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Sterling Silver / Silverplate / Stainless Steel' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Age', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Number of Pieces', field_type: 'optional', priority: 7, notes: 'セット本数' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Material', field_type: 'optional', priority: 8, notes: 'Stainless Steel / Silver等' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Color', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Number of Place Settings', field_type: 'optional', priority: 10, notes: '対応人数分のセット数' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Series', field_type: 'optional', priority: 11, notes: '' },

  // === Baby ===
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Material', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Character', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Size', field_type: 'optional', priority: 7, notes: 'サイズ・対象月齢' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Age Group', field_type: 'optional', priority: 8, notes: '対象年齢・月齢（Newborn / 0-6M等）' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Gender', field_type: 'optional', priority: 9, notes: '対象性別（Boys / Girls / Unisex）' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Theme', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Franchise', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Occasion', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Pattern', field_type: 'optional', priority: 14, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Number of Pieces', field_type: 'optional', priority: 15, notes: '' },

  // === Combs ===
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Comb / Pick等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Material', field_type: 'required', priority: 4, notes: 'Wood / Horn / Plastic等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Pattern', field_type: 'optional', priority: 7, notes: '柄/模様' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Occasion', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Vintage', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Season', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Hair Type', field_type: 'optional', priority: 11, notes: '対象髪タイプ' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Character', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Franchise', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Number of Pieces', field_type: 'optional', priority: 14, notes: '' },

  // === Key Chains ===
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Metal / Leather / Rubber等' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Character Family', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Part Type', field_type: 'required', priority: 6, notes: 'mandatory是正' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Type', field_type: 'optional', priority: 7, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Series', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Character', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Franchise', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Vintage', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Official/Unofficial', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Number of Pieces', field_type: 'optional', priority: 13, notes: '' },

  // === Charms ===
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Brand',           field_type: 'required',    priority:  1, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Style',           field_type: 'required',    priority:  2, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Type',            field_type: 'required',    priority:  3, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal',           field_type: 'required',    priority:  4, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Color',           field_type: 'recommended', priority:  5, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Main Stone',      field_type: 'recommended', priority:  6, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Theme',           field_type: 'recommended', priority:  7, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal Purity',    field_type: 'recommended', priority:  8, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Pendant Shape',   field_type: 'recommended', priority:  9, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Charm Type',      field_type: 'recommended', priority: 10, notes: 'Animal / Alphabet / Initial / Birthstone / Cross 等' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Main Stone Color',field_type: 'recommended', priority: 11, notes: '' },

  // === Pipes ===
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Body Shape', field_type: 'recommended', priority: 2, notes: 'Billiard / Bent / Apple等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Briar / Meerschaum等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Filter Size', field_type: 'recommended', priority: 4, notes: '9mm / 6mm' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Handmade', field_type: 'recommended', priority: 5, notes: 'Yes / No' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Color', field_type: 'optional', priority: 7, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Type', field_type: 'optional', priority: 8, notes: 'タバコパイプ / メシャム / 水パイプ等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Bowl Size', field_type: 'optional', priority: 9, notes: 'Small / Medium / Large' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Stem Material', field_type: 'optional', priority: 10, notes: 'Acrylic / Ebonite / Amber等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Series', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Finish', field_type: 'optional', priority: 12, notes: 'Smooth / Sandblast / Rusticated等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Vintage', field_type: 'optional', priority: 13, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Year Manufactured', field_type: 'optional', priority: 14, notes: '' },

  // === Guitars (ギター・ベース・ウクレレ) ===
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Electric Guitar / Acoustic Guitar / Classical Guitar / Bass Guitar / Ukulele' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Body Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Body Type', field_type: 'recommended', priority: 5, notes: 'Solid Body / Hollow Body / Semi-Hollow / Dreadnought / OM / Jumbo' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'String Configuration', field_type: 'recommended', priority: 6, notes: '6 String / 4 String / 7 String / 12 String' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Handedness', field_type: 'recommended', priority: 7, notes: 'Right-Handed / Left-Handed' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Model Year', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Number of Frets', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Series', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Fretboard Material', field_type: 'recommended', priority: 12, notes: 'Rosewood / Maple / Ebony / Pau Ferro等' },
  { category: 'Guitars', tag_jp: 'ギター,ベース,ウクレレ,エレキギター,アコースティックギター,クラシックギター,エレキベース', field_name: 'Bridge Type', field_type: 'optional', priority: 13, notes: 'Floyd Rose / Tune-o-matic / Vintage Tremolo / Hardtail / N/A' },

  // === Effects & Amps (エフェクター・アンプ) ===
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Overdrive / Distortion / Fuzz / Delay / Reverb / Chorus / Compressor / Multi-FX / Amp Head / Combo Amp / Preamp' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Analog/Digital', field_type: 'recommended', priority: 4, notes: 'Analog / Digital / Tube / Solid State / Modeling' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Power Source', field_type: 'recommended', priority: 5, notes: '9V Battery / AC Adapter / USB / 100V AC' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Bypass Type', field_type: 'recommended', priority: 6, notes: 'True Bypass / Buffered Bypass / N/A(アンプ)' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Features', field_type: 'recommended', priority: 8, notes: 'Tap Tempo / MIDI / Stereo / Expression / 50W / 2-Channel / FX Loop' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Model Year', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Effects & Amps', tag_jp: 'エフェクター,ストンプボックス,マルチエフェクター,オーバードライブ,ディストーション,ファズ,ディレイ,リバーブ,コーラス,コンプレッサー,ワウ,ルーパー,ブースター,アンプ,ギターアンプ,ベースアンプ', field_name: 'Wattage', field_type: 'optional', priority: 11, notes: '50W / 100W / N/A for pedals' },

  // === Synths & Digital (シンセ・キーボード・DJ機材) ===
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Synthesizer / Digital Piano / Workstation / Sampler / Drum Machine / Groovebox / DJ Controller / Turntable / Mixer' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Number of Keys', field_type: 'recommended', priority: 4, notes: '25 / 37 / 49 / 61 / 76 / 88 / N/A' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Analog/Digital', field_type: 'recommended', priority: 5, notes: 'Analog / Digital / VA (Virtual Analog) / Hybrid' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Connectivity', field_type: 'recommended', priority: 7, notes: 'MIDI / USB / CV / Audio I/O' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Features', field_type: 'recommended', priority: 8, notes: 'ポリ数 / Sequencer / Built-in Effects / Touch Screen' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Model Year', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Action', field_type: 'recommended', priority: 11, notes: 'Weighted / Semi-weighted / Synth / Unweighted / N/A' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Polyphony', field_type: 'recommended', priority: 12, notes: '32 / 64 / 128 voices等' },
  { category: 'Synths & Digital', tag_jp: 'シンセサイザー,キーボード,シンセ,電子ピアノ,ワークステーション,サンプラー,ドラムマシン,グルーヴボックス,DJコントローラー,ターンテーブル,ミキサー', field_name: 'Touch Sensitivity', field_type: 'recommended', priority: 13, notes: 'On / Off / Curve等' },

  // === Musical Instruments (ドラム・管楽器・パーカッション・その他) ===
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Snare Drum / Bass Drum / Cymbal / Saxophone / Trumpet / Flute / Clarinet / Violin / Cello / Harmonica' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Material', field_type: 'recommended', priority: 4, notes: 'Brass / Silver / Nickel Silver / Maple / Birch / Steel' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Color', field_type: 'recommended', priority: 5, notes: 'Lacquer / Silver Plated / Gold Plated / Natural' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Size', field_type: 'recommended', priority: 6, notes: 'ドラム: 14x5.5" / 20" 等。管楽器: N/A' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Key/Pitch', field_type: 'recommended', priority: 7, notes: '管楽器の調: Bb / Eb / C / F。ドラム: N/A' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Features', field_type: 'recommended', priority: 8, notes: 'ケース付 / マウスピース付 / スタンド付 等' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Model Year', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,バイオリン,フルート,サックス,トランペット,ドラム,ハーモニカ,管楽器,スネア,シンバル,パーカッション,クラリネット,トロンボーン,チェロ,ビオラ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Pens ===
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Resin / Metal / Lacquer等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Ink Color', field_type: 'recommended', priority: 3, notes: 'Blue / Black / Red等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Size', field_type: 'recommended', priority: 4, notes: 'Fine / Medium / Broad' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Material', field_type: 'recommended', priority: 5, notes: 'Gold / Steel / Iridium' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Type', field_type: 'required', priority: 6, notes: 'Fountain Pen / Ballpoint / Rollerball' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Vintage', field_type: 'recommended', priority: 7, notes: 'Yes / No' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Color', field_type: 'optional', priority: 9, notes: 'ペン本体の色' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Series', field_type: 'optional', priority: 10, notes: '製品シリーズ（1911, 51等）' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Designer', field_type: 'optional', priority: 11, notes: 'デザイナー名' },

  // === Wallets ===
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Bifold / Trifold / Long / Card Case等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Closure', field_type: 'recommended', priority: 6, notes: 'Zipper / Snap Button / Magnetic / Clasp' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Pattern', field_type: 'optional', priority: 7, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Gender', field_type: 'optional', priority: 8, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Vintage', field_type: 'optional', priority: 9, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Series', field_type: 'optional', priority: 10, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,三つ折り財布,ミニ財布,コインケース,カードケース,キーケース,パスケース,マネークリップ,札入れ,がま口', field_name: 'Number of Pieces', field_type: 'optional', priority: 11, notes: '' },

  // === Art ===
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Listed By', field_type: 'required', priority: 1, notes: 'Dealer or Reseller / Private Listing' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Artist', field_type: 'required', priority: 2, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Production Technique', field_type: 'required', priority: 3, notes: 'Oil / Watercolor / Acrylic / Mixed Media等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Subject', field_type: 'recommended', priority: 4, notes: 'Landscape / Portrait / Abstract等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Material', field_type: 'recommended', priority: 7, notes: 'Canvas / Paper / Board' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Original/Licensed Reproduction', field_type: 'recommended', priority: 8, notes: 'Original / Print / Reproduction' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Time Period Produced', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Framing', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,日本画,水墨画,墨絵,アクリル画,パステル画', field_name: 'Signed', field_type: 'optional', priority: 12, notes: '' },

  // === Kakejiku (掛軸) ===
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Production Technique', field_type: 'required', priority: 2, notes: 'Ink / Watercolor / Gold leaf等' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Support', field_type: 'recommended', priority: 3, notes: 'Silk / Paper' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Mounting Type', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Scroll Rod Material', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Box Type', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Subject', field_type: 'recommended', priority: 7, notes: 'Landscape / Calligraphy / Flower & Bird等' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Size', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Time Period Produced', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Style', field_type: 'recommended', priority: 11, notes: '' },
  { category: 'Kakejiku', tag_jp: '掛軸,掛け軸,床掛け', field_name: 'Season', field_type: 'recommended', priority: 12, notes: '' },

  // === Pottery ===
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '窯元名（香蘭社/深川製磁/柿右衛門等）' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Incense Burner / Plate / Figurine等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Porcelain / Stoneware / Earthenware等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Origin/Kiln', field_type: 'recommended', priority: 6, notes: 'Arita / Kutani / Bizen / Hagi等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Style', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Pattern', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Size', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Era/Period', field_type: 'recommended', priority: 11, notes: 'Edo / Meiji / Taisho / Showa / Contemporary等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Maker', field_type: 'recommended', priority: 12, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Glaze/Finish', field_type: 'recommended', priority: 13, notes: 'Celadon / Overglaze / Unglazed / Colored等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺,花瓶,香炉,有田焼,伊万里,古伊万里,九谷焼,備前焼,萩焼,信楽焼,瀬戸焼,美濃焼,唐津焼,京焼,清水焼,織部,志野,薩摩焼', field_name: 'Subject', field_type: 'recommended', priority: 14, notes: '' },

  // === Belts ===
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Casual / Dress / Reversible等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas / Suede等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Closure', field_type: 'recommended', priority: 7, notes: 'Pin Buckle / Clasp / Hook / Velcro / Automatic' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Pattern', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Size Type', field_type: 'optional', priority: 9, notes: 'Regular / Long / Short / Petite' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Belt Width', field_type: 'optional', priority: 10, notes: '25mm / 30mm / 35mm / 40mm等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Accents', field_type: 'optional', priority: 11, notes: 'Silver-Tone / Gold-Tone / Rhinestone / None等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Vintage', field_type: 'optional', priority: 12, notes: '' },

  // === Belt Buckles ===
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Metal / Silver / Brass等' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Fits Belt Width', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Pattern', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Size', field_type: 'required', priority: 8, notes: 'eBay mandatory。S / M / L / XL / One Size等' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Performance/Activity', field_type: 'recommended', priority: 9, notes: 'Western / Military / Casual / Sports等' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Vintage', field_type: 'recommended', priority: 10, notes: 'Yes / No' },

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
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Head Size', field_type: 'recommended', priority: 11, notes: '460cc / 440cc等' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Shaft Compatibility', field_type: 'recommended', priority: 12, notes: '対応シャフト種別 (Hosel size / Standard / TaylorMade等)' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Finish', field_type: 'recommended', priority: 13, notes: '' },

  // === Kitchen Knives ===
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Santoku / Gyuto / Deba / Yanagiba / Nakiri等' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Blade Material', field_type: 'recommended', priority: 3, notes: 'Steel / Damascus / High Carbon等' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Blade Length', field_type: 'recommended', priority: 4, notes: '刃渡り (cm)' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Handle Material', field_type: 'recommended', priority: 5, notes: 'Wood / Resin / Horn等' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Edge Type', field_type: 'recommended', priority: 6, notes: 'Single-Bevel / Double-Bevel等' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Handedness', field_type: 'recommended', priority: 7, notes: 'Right-Handed / Left-Handed' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Maker/Blacksmith', field_type: 'recommended', priority: 8, notes: '刀匠・作者名' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Condition', field_type: 'recommended', priority: 10, notes: 'New / Used等' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Vintage', field_type: 'optional', priority: 11, notes: '' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Series', field_type: 'optional', priority: 12, notes: '' },
  { category: 'Kitchen Knives', tag_jp: '包丁,菜切り包丁,出刃包丁,柳刃包丁,三徳包丁,牛刀,鍛造包丁', field_name: 'Number of Pieces', field_type: 'optional', priority: 13, notes: '' },

  // === Japanese Dolls ===
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Type',                 field_type: 'required',    priority: 1,  notes: 'Hina / Musha / Ichimatsu / Kokeshi等' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Material',             field_type: 'recommended', priority: 2,  notes: 'Wood / Gofun / Clay等' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Maker',                 field_type: 'recommended', priority: 3,  notes: '作者名' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Origin/Region',         field_type: 'recommended', priority: 4,  notes: '産地 (Hakata / Kyoto / Tohoku等)' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Era/Period',             field_type: 'recommended', priority: 5,  notes: 'Meiji / Taisho / Showa等' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Size',                  field_type: 'recommended', priority: 6,  notes: '' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Technique',             field_type: 'recommended', priority: 7,  notes: 'Kimekomi / Hand-painted等' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Subject/Motif',         field_type: 'recommended', priority: 8,  notes: '題材・図柄' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Original/Reproduction', field_type: 'recommended', priority: 9,  notes: 'Original / Reproduction' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Country of Origin',     field_type: 'recommended', priority: 10, notes: '' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Theme',                 field_type: 'recommended', priority: 11, notes: 'auto-injected: Collectible' },
  { category: 'Japanese Dolls', tag_jp: '日本人形,雛人形,五月人形,武者人形,市松人形,こけし,博多人形,木目込み人形', field_name: 'Age Level',             field_type: 'required',    priority: 12, notes: '14 and Over (CPSC compliance)' },

  // === Books & Magazines ===
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Author/Artist',    field_type: 'required',    priority:  1, notes: '著者 / 撮影者 / 編著者 / アーティスト' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Publisher',        field_type: 'recommended', priority:  2, notes: '出版社' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Language',         field_type: 'recommended', priority:  3, notes: 'auto-injected: Japanese' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Format',           field_type: 'recommended', priority:  4, notes: 'Magazine / Paperback / Hardcover / Mook / Art Book / Photo Book / Picture Book / Exhibition Catalog' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Year Published',   field_type: 'recommended', priority:  5, notes: '発行年' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Country of Origin',field_type: 'recommended', priority:  6, notes: 'auto-injected: Japan' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Subject',          field_type: 'recommended', priority:  7, notes: '題材・テーマ（写真集の被写体、画集のジャンル等）' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'ISBN',             field_type: 'optional',    priority:  8, notes: 'ISBN-10 / ISBN-13' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Issue Number',     field_type: 'optional',    priority:  9, notes: '号数 (雑誌のみ: Vol.42 / No.10 等)' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Brand',            field_type: 'optional',    priority: 10, notes: '' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Vintage',          field_type: 'optional',    priority: 11, notes: '' },
  { category: 'Books & Magazines', tag_jp: '書籍・雑誌,書籍,雑誌,小説,写真集,フォトブック,アートブック,図録,MOOK,ムック,専門誌,文庫,新書,絵本,洋書', field_name: 'Series',           field_type: 'optional',    priority: 12, notes: '' },
];

// 主要ブランド辞書（プロンプト埋め込み用）
// research_brands.json から全カテゴリ集約
var IS_BRAND_DICT = [
  // === Watches ===
  {name: '5 Actus', jp_names: ['5アクタス', 'ファイブアクタス', '5 ACTUS', 'FIVE ACTUS', 'Actus', 'ACTUS', 'Fiveactus', 'FIVEACTUS'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: '51-30', jp_names: ['51-30', 'フィフティワンサーティ'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Accutron', jp_names: ['アキュトロン', 'ACCUTRON'], country: 'United States', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Bulova Accutron II', jp_names: ['アキュトロンII', 'ACCUTRON II', 'ACCUTRON2'], country: 'United States', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Air-King', jp_names: ['エアキング', 'AIR-KING', 'AIR KING'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Aikon', jp_names: ['アイコン', 'AIKON', 'ICON', 'ICON TIDE'], country: 'Switzerland', parent_brand: 'Maurice Lacroix', category: ['Watches']},
  {name: 'American Classic', jp_names: ['アメリカンクラシック', 'AMERICAN CLASSIC'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Aqualand', jp_names: ['アクアランド', 'AQUALAND'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Aqua Terra', jp_names: ['アクアテラ', 'AQUA TERRA'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Aquanaut', jp_names: ['アクアノート', 'AQUANAUT'], country: 'Switzerland', parent_brand: 'Patek Philippe', category: ['Watches']},
  {name: 'Aquaracer', jp_names: ['アクアレーサー', 'AQUARACER'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Aquis', jp_names: ['アクイス', 'AQUIS'], country: 'Switzerland', parent_brand: 'Oris', category: ['Watches']},
  {name: 'Atacama Field', jp_names: ['アタカマフィールド', 'ATACAMA FIELD', 'ATACAMA'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Attesa', jp_names: ['アテッサ', 'ATTESA'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Alpina', jp_names: ['アルピナ', 'ALPINA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Audemars Piguet', jp_names: ['オーデマピゲ', 'AUDEMARS PIGUET'], country: 'Switzerland'},
  {name: 'Autavia', jp_names: ['オータヴィア', 'AUTAVIA'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Avenger', jp_names: ['アベンジャー', 'AVENGER'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Baby-G', jp_names: ['ベビーG', 'BABY-G', 'BABYG', 'BABY G'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Balboa', jp_names: ['バルボア', 'BALBOA'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Ball Watch', jp_names: ['ボールウォッチ', 'BALL WATCH'], country: 'United States'},
  {name: 'Ballon Bleu', jp_names: ['バロンブルー', 'BALLON BLEU'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Baltazar', jp_names: ['バルタザール', 'BALTAZAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Bambino', jp_names: ['バンビーノ', 'BAMBINO'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Banks', jp_names: ['バンクス', 'BANKS'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Baume & Mercier', jp_names: ['ボーム&メルシエ', 'ボームアンドメルシエ', 'ボーム＆メルシエ', 'BAUME & MERCIER', 'BAUME&MERCIER'], country: 'Switzerland', category: ['Watches']},
  {name: 'Bear Grylls', jp_names: ['ベアグリルス', 'BEAR GRYLLS'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Bell & Ross', jp_names: ['ベル&ロス', 'BELL & ROSS', 'BELL&ROSS'], country: 'France'},
  {name: 'Bell-Matic', jp_names: ['ベルマチック', 'BELL-MATIC', 'BELLMATIC'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Beside', jp_names: ['ビサイド', 'BESIDE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Bedat & Co', jp_names: ['ベダアンドカンパニー', 'ベダ＆カンパニー', 'BEDAT & CO', 'BEDAT&CO', 'BEDAT'], country: 'Switzerland', category: ['Watches']},
  {name: 'Big Bang', jp_names: ['ビッグバン', 'BIG BANG'], country: 'Switzerland', parent_brand: 'Hublot', category: ['Watches']},
  {name: 'Big Crown', jp_names: ['ビッグクラウン', 'BIG CROWN'], country: 'Switzerland', parent_brand: 'Oris', category: ['Watches']},
  {name: 'Black Bay', jp_names: ['ブラックベイ', 'BLACK BAY'], country: 'Switzerland', parent_brand: 'Tudor', category: ['Watches']},
  {name: 'Black Ops', jp_names: ['ブラックオプス', 'BLACK OPS'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Blancpain', jp_names: ['ブランパン', 'BLANCPAIN'], country: 'Switzerland'},
  {name: 'Breguet', jp_names: ['ブレゲ', 'BREGUET'], country: 'Switzerland'},
  {name: 'Breitling', jp_names: ['ブライトリング', 'BREITLING'], country: 'Switzerland'},
  {name: 'Bremont', jp_names: ['ブレモン', 'BREMONT'], country: 'United Kingdom'},
  {name: 'Bulova', jp_names: ['ブローバ', 'BULOVA'], country: 'United States'},
  {name: 'Bulova Curv', jp_names: ['カーヴ', 'CURV'], country: 'United States', parent_brand: 'Bulova', category: ['Watches']},
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
  {name: 'Dan Henry', jp_names: ['ダンヘンリー', 'DAN HENRY'], country: 'United States'},
  {name: 'D1 Milano', jp_names: ['ディーワンミラノ', 'D1 MILANO', 'D1MILANO'], country: 'Italy'},
  {name: 'Daniel Wellington', jp_names: ['ダニエルウェリントン', 'DANIEL WELLINGTON'], country: 'Sweden'},
  {name: 'Datejust', jp_names: ['デイトジャスト', 'DATEJUST'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Day-Date', jp_names: ['デイデイト', 'DAY-DATE'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Daytona', jp_names: ['デイトナ', 'DAYTONA'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'De Ville', jp_names: ['デ・ヴィル', 'デビル', 'DE VILLE'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Delica', jp_names: ['デリカ', 'DELICA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Descent', jp_names: ['ディセント', 'DESCENT'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'DiaStar', jp_names: ['ダイヤスター', 'DIASTAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'D-Star', jp_names: ['Dスター', 'D-STAR', 'DSTAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Longines DolceVita', jp_names: ['ドルチェヴィータ', 'DOLCEVITA', 'DOLCE VITA'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'Dork', jp_names: ['ダーク', 'DORK'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
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
  {name: 'Fenix', jp_names: ['フェニックス', 'FENIX'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Ferrari', jp_names: ['フェラーリ', 'FERRARI'], country: 'Italy', category: ['Watches']},
  {name: 'Flat 42', jp_names: ['フラット42', 'FLAT 42'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Florence', jp_names: ['フローレンス', 'FLORENCE'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'ForeAthlete', jp_names: ['フォアアスリート', 'FOREATHLETE'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Forerunner', jp_names: ['フォアランナー', 'FORERUNNER'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Formula 1', jp_names: ['フォーミュラ1', 'FORMULA 1'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Frederique Constant', jp_names: ['フレデリックコンスタント', 'FREDERIQUE CONSTANT'], country: 'Switzerland', category: ['Watches']},
  {name: 'G-Chrono', jp_names: ['Gクロノ', 'G-CHRONO', 'G CHRONO'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'G-Frame', jp_names: ['Gフレーム', 'G-FRAME', 'G FRAME'], country: 'Italy', parent_brand: 'Gucci', category: ['Watches']},
  {name: 'Galante', jp_names: ['ガランテ', 'GALANTE'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'G-Shock Frogman', jp_names: ['フロッグマン', 'FROGMAN', 'Frogman'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock G-Steel', jp_names: ['Gスチール', 'G-STEEL', 'GSTEEL', 'GST-'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock G-LIDE', jp_names: ['Gライド', 'G-LIDE', 'GLIDE'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Garmin', jp_names: ['ガーミン', 'GARMIN'], country: 'United States'},
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
  {name: 'Hamilton', jp_names: ['ハミルトン', 'HAMILTON'], country: 'United States'},
  {name: 'Hublot', jp_names: ['ウブロ', 'HUBLOT'], country: 'Switzerland'},
  {name: 'HydroConquest', jp_names: ['ハイドロコンクエスト', 'HYDROCONQUEST'], country: 'Switzerland', parent_brand: 'Longines', category: ['Watches']},
  {name: 'HyperChrome', jp_names: ['ハイパークローム', 'HYPERCHROME', 'HYPER CHROME'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Independent', jp_names: ['インディペンデント', 'INDEPENDENT'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Ingenieur', jp_names: ['インヂュニア', 'INGENIEUR'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Instinct', jp_names: ['インスティンクト', 'INSTINCT'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Integral', jp_names: ['インテグラル', 'INTEGRAL'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Intarsio', jp_names: ['インタルシオ', 'INTARSIO'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Bering', jp_names: ['ベーリング', 'BERING'], country: 'Denmark'},
  {name: 'Jacob Jensen', jp_names: ['ヤコブイェンセン', 'JACOB JENSEN'], country: 'Denmark'},
  {name: 'IWC', jp_names: ['IWC'], country: 'Switzerland'},
  {name: 'IWC Mark', jp_names: ['マーク', 'MARK'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'IWC Pilot', jp_names: ['パイロット', 'PILOT', "PILOT'S"], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Jaeger-LeCoultre', jp_names: ['ジャガールクルト', 'JAEGER-LECOULTRE', 'JAEGER LECOULTRE'], country: 'Switzerland'},
  {name: 'Jazzmaster', jp_names: ['ジャズマスター', 'JAZZMASTER'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Jubile', jp_names: ['ジュビリー', 'JUBILE', 'JUBILÉ'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Junghans', jp_names: ['ユンハンス', 'JUNGHANS'], country: 'Germany'},
  {name: 'Kamasu', jp_names: ['カマス', 'KAMASU'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'KARL-LEIMON', jp_names: ['カールレイモン', 'KARL-LEIMON', 'KARL LEIMON'], country: 'Japan', category: ['Watches']},
  {name: 'KARL-LEIMON Classic38', jp_names: ['クラシック38', 'CLASSIC38', 'CLASSIC 38'], country: 'Japan', parent_brand: 'KARL-LEIMON', category: ['Watches']},
  {name: 'KARL-LEIMON Moonphase', jp_names: ['ムーンフェイズ', 'M1BL01', 'MOONPHASE'], country: 'Japan', parent_brand: 'KARL-LEIMON', category: ['Watches']},
  {name: 'Kentex', jp_names: ['ケンテックス', 'KENTEX'], country: 'Japan', category: ['Watches']},
  {name: 'Kentex JSDF', jp_names: ['自衛隊', 'JSDF', 'ジェイエスディーエフ'], country: 'Japan', parent_brand: 'Kentex', category: ['Watches']},
  {name: 'Kentex Aviation', jp_names: ['アヴィエーション', 'AVIATION', 'AVIATION RESCUE'], country: 'Japan', parent_brand: 'Kentex', category: ['Watches']},
  {name: 'Khaki', jp_names: ['カーキ', 'KHAKI'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Khaki Aviation', jp_names: ['カーキアビエーション', 'KHAKI AVIATION'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Khaki Field', jp_names: ['カーキフィールド', 'KHAKI FIELD'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Kii', jp_names: ['キー', 'KII'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'King Quartz', jp_names: ['キングクォーツ', 'KING QUARTZ', 'キングクオーツ'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'King Seiko', jp_names: ['キングセイコー', 'KING SEIKO', 'KingSeiko', 'KINGSEIKO', 'KS'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Kirium', jp_names: ['キリウム', 'KIRIUM'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Knot', jp_names: ['ノット', 'KNOT'], country: 'Japan', category: ['Watches']},
  {name: 'Kurono Tokyo', jp_names: ['クロノトウキョウ', 'KURONO TOKYO'], country: 'Japan', category: ['Watches']},
  {name: 'Lady Sports', jp_names: ['レディスポーツ', 'LADY SPORTS'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Lamborghini', jp_names: ['ランボルギーニ', 'LAMBORGHINI', 'TONINO LAMBORGHINI'], country: 'Italy'},
  {name: 'Le Locle', jp_names: ['ル・ロックル', 'LE LOCLE'], country: 'Switzerland', parent_brand: 'Tissot', category: ['Watches']},
  {name: 'Leatherback Sea Turtle', jp_names: ['レザーバックシータートル', 'LEATHERBACK SEA TURTLE', 'LEATHERBACK'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
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
  {name: 'Luminox', jp_names: ['ルミノックス', 'LUMINOX'], country: 'United States'},
  {name: 'Luminox G-Collection', jp_names: ['Gコレクション', 'G-COLLECTION', 'G COLLECTION'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Heritage', jp_names: ['ルミノックスヘリテージ', 'LUMINOX HERITAGE'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Pacific Diver', jp_names: ['パシフィックダイバー', 'PACIFIC DIVER'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox COLORMARK', jp_names: ['カラーマーク', 'COLORMARK', 'COLOR MARK'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Spartan Race', jp_names: ['スパルタンレース', 'SPARTAN RACE', 'SPARTAN'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Manta Ray', jp_names: ['マンタレイ', 'MANTA RAY'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox RB Ampol', jp_names: ['レッドブルアンポル', 'RB AMPOL', 'RED BULL AMPOL'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Navy SEAL Steel', jp_names: ['ネイビーシールスティール', 'NAVY SEAL STEEL', '3200'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Master Carbon SEAL', jp_names: ['マスターカーボンシール', 'MASTER CARBON SEAL', 'MASTER CARBON'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox ICE-SAR', jp_names: ['アイスサー', 'ICE-SAR', 'ICE SAR'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Recon', jp_names: ['リーコン', 'RECON', 'POINTMAN'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox F-117 Nighthawk', jp_names: ['ナイトホーク', 'F-117', 'NIGHTHAWK'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox EVO Navy SEAL', jp_names: ['エヴォネイビーシール', 'EVO NAVY SEAL', 'EVO'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Luminox Deep Dive', jp_names: ['ディープダイブ', 'DEEP DIVE'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Lunage', jp_names: ['ルナージュ', 'LUNAGE'], country: 'Japan'},
  {name: 'M-Force', jp_names: ['エムフォース', 'M-FORCE', 'MFORCE'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Mako', jp_names: ['マコ', 'MAKO'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Marine Star', jp_names: ['マリンスター', 'MARINE STAR'], country: 'United States', parent_brand: 'Bulova', category: ['Watches']},
  {name: 'Mark Coupe', jp_names: ['マーククーペ', 'MARK COUPE', 'Mark Coupe'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Max Bill', jp_names: ['マックスビル', 'MAX BILL', 'MAXBILL'], country: 'Germany', parent_brand: 'Junghans', category: ['Watches']},
  {name: 'Maurice Lacroix', jp_names: ['モーリスラクロア', 'MAURICE LACROIX'], country: 'Switzerland'},
  {name: 'Milgauss', jp_names: ['ミルガウス', 'MILGAUSS'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Minase', jp_names: ['ミナセ', 'MINASE'], country: 'Japan', category: ['Watches']},
  {name: 'Monaco', jp_names: ['モナコ', 'MONACO'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'G-Shock MR-G', jp_names: ['MR-G', 'MRG-', 'MRG ', 'MR-G-'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock MT-G', jp_names: ['MT-G', 'MTG'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'G-Shock Mudmaster', jp_names: ['マッドマスター', 'MUDMASTER', 'Mudmaster'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Manhattan', jp_names: ['マンハッタン', 'MANHATTAN'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Manual', jp_names: ['マニュアル', 'MANUAL'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Manuale', jp_names: ['マヌアーレ', 'MANUALE', 'マニュアーレ'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Manuale Slim', jp_names: ['マヌアーレスリム', 'MANUALE SLIM'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Manuale Thin', jp_names: ['マヌアーレシン', 'MANUALE THIN'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Multi Year Calendar', jp_names: ['万年カレンダー', 'MULTI YEAR CALENDAR'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'Musketeer', jp_names: ['マスケティア', 'MUSKETEER'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Napoleone', jp_names: ['ナポレオーネ', 'NAPOLEONE'], country: 'Italy', parent_brand: 'GaGa Milano', category: ['Watches']},
  {name: 'Nautilus', jp_names: ['ノーチラス', 'NAUTILUS'], country: 'Switzerland', parent_brand: 'Patek Philippe', category: ['Watches']},
  {name: 'NEFROM', jp_names: ['ネフロム', 'NEFROM'], country: 'Denmark'},
  {name: 'Navitimer', jp_names: ['ナビタイマー', 'NAVITIMER'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Navy Seal', jp_names: ['ネイビーシールズ', 'NAVY SEAL', 'NAVY SEALS', 'Navy Seals'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Newton', jp_names: ['ニュートン', 'NEWTON'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Nixon', jp_names: ['ニクソン', 'NIXON'], country: 'United States'},
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
  {name: 'Player', jp_names: ['プレイヤー', 'PLAYER'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Portofino', jp_names: ['ポートフィノ', 'PORTOFINO'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Portugieser', jp_names: ['ポルトギーゼ', 'PORTUGIESER'], country: 'Switzerland', parent_brand: 'IWC', category: ['Watches']},
  {name: 'Precisionist', jp_names: ['プレシジョニスト', 'PRECISIONIST'], country: 'United States', parent_brand: 'Bulova', category: ['Watches']},
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
  {name: 'Rotolog', jp_names: ['ロトログ', 'ROTOLOG'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Royal Orient', jp_names: ['ロイヤルオリエント', 'ROYAL ORIENT'], country: 'Japan', parent_brand: 'Orient', category: ['Watches']},
  {name: 'RSW', jp_names: ['ラマスイスウォッチ', 'RSW', 'RAMA SWISS WATCH'], country: 'Switzerland', category: ['Watches']},
  {name: 'Royal Oak', jp_names: ['ロイヤルオーク', 'ROYAL OAK'], country: 'Switzerland', parent_brand: 'Audemars Piguet', category: ['Watches']},
  {name: 'Royal Oak Offshore', jp_names: ['ロイヤルオークオフショア', 'ROYAL OAK OFFSHORE'], country: 'Switzerland', parent_brand: 'Audemars Piguet', category: ['Watches']},
  {name: 'S/el', jp_names: ['セル', 'SEL', 'S/EL'], country: 'Switzerland', parent_brand: 'TAG Heuer', category: ['Watches']},
  {name: 'Santos', jp_names: ['サントス', 'SANTOS'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'Sea Turtle', jp_names: ['シータートル', 'SEA TURTLE'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
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
  {name: 'Sentry', jp_names: ['セントリー', 'SENTRY'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Series 8', jp_names: ['シリーズエイト', 'SERIES 8', 'シリーズ8'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Seven Star', jp_names: ['セブンスター', 'SEVEN STAR'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Chariot', jp_names: ['シャリオ', 'CHARIOT', 'SHARIO'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Sheen', jp_names: ['シーン', 'SHEEN'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Shinola', jp_names: ['シノラ', 'SHINOLA'], country: 'United States'},
  {name: 'Silver Star', jp_names: ['シルバースター', 'SILVER STAR'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Skyliner', jp_names: ['スカイライナー', 'SKYLINER'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Space Series', jp_names: ['スペースシリーズ', 'SPACE SERIES', 'SPACE'], country: 'United States', parent_brand: 'Luminox', category: ['Watches']},
  {name: 'Speedmaster', jp_names: ['スピードマスター', 'SPEEDMASTER'], country: 'Switzerland', parent_brand: 'Omega', category: ['Watches']},
  {name: 'Spinnaker', jp_names: ['スピニカー', 'SPINNAKER'], country: 'United Kingdom', category: ['Watches']},
  {name: 'Sportura', jp_names: ['スポーチュラ', 'SPORTURA'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Submariner', jp_names: ['サブマリーナ', 'SUBMARINER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Submersible', jp_names: ['サブマーシブル', 'SUBMERSIBLE'], country: 'Italy', parent_brand: 'Panerai', category: ['Watches']},
  {name: 'Superocean', jp_names: ['スーパーオーシャン', 'SUPEROCEAN'], country: 'Switzerland', parent_brand: 'Breitling', category: ['Watches']},
  {name: 'Super Rover', jp_names: ['スーパーローバー', 'SUPER ROVER'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'S.T. Dupont', jp_names: ['エス・テー・デュポン', 'デュポン', 'ST DUPONT', 'S.T.DUPONT', 'DUPONT'], country: 'France'},
  {name: 'Swatch', jp_names: ['スウォッチ', 'SWATCH'], country: 'Switzerland'},
  {name: 'TAG Heuer', jp_names: ['タグホイヤー', 'TAG HEUER'], country: 'Switzerland'},
  {name: 'Takeo Kikuchi', jp_names: ['タケオキクチ', 'TAKEO KIKUCHI'], country: 'Japan'},
  {name: 'Tank', jp_names: ['タンク', 'TANK'], country: 'France', parent_brand: 'Cartier', category: ['Watches']},
  {name: 'The 42-20', jp_names: ['42-20', 'フォーティーツートゥエンティ'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'The Citizen', jp_names: ['ザ・シチズン', 'THE CITIZEN'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Tide', jp_names: ['タイド', 'TIDE'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Tiffany Atlas', jp_names: ['アトラス', 'ATLAS', 'Tiffany Atlas', 'TIFFANY ATLAS'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany Classic', jp_names: ['ティファニークラシック', 'TIFFANY CLASSIC', 'Classic Round'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany East West', jp_names: ['イーストウエスト', 'EAST WEST'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Tiffany Cocktail', jp_names: ['カクテル', 'TIFFANY COCKTAIL'], country: 'United States', parent_brand: 'Tiffany & Co.', category: ['Watches']},
  {name: 'Time Teller', jp_names: ['タイムテラー', 'TIME TELLER'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Timex', jp_names: ['タイメックス', 'TIMEX'], country: 'United States'},
  {name: 'Timex Easy Reader', jp_names: ['イージーリーダー', 'EASY READER'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Expedition', jp_names: ['エクスペディション', 'EXPEDITION'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Ironman', jp_names: ['アイアンマン', 'IRONMAN', 'IRON MAN'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Marlin', jp_names: ['マーリン', 'MARLIN'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex MK1', jp_names: ['MK1', 'エムケーワン'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Q', jp_names: ['タイメックスQ', 'TIMEX Q'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Waterbury', jp_names: ['ウォーターベリー', 'WATERBURY'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
  {name: 'Timex Weekender', jp_names: ['ウィークエンダー', 'WEEKENDER'], country: 'United States', parent_brand: 'Timex', category: ['Watches']},
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
  {name: 'Terra Cielo Mare', jp_names: ['テッラチエロマーレ', 'TERRA CIELO MARE', 'TERRACIELOMARE', 'TCM'], country: 'Italy', category: ['Watches']},
  {name: 'Tudor', jp_names: ['チュードル', 'チューダー', 'TUDOR'], country: 'Switzerland'},
  {name: 'Ulysse Nardin', jp_names: ['ユリスナルダン', 'ULYSSE NARDIN'], country: 'Switzerland'},
  {name: 'Universal Geneve', jp_names: ['ユニバーサルジュネーブ', 'UNIVERSAL GENEVE', 'UNIVERSAL GENÈVE'], country: 'Switzerland', category: ['Watches']},
  {name: 'Vacheron Constantin', jp_names: ['ヴァシュロンコンスタンタン', 'VACHERON CONSTANTIN'], country: 'Switzerland'},
  {name: 'Vanac', jp_names: ['バナック', 'VANAC', 'Seiko Vanac', 'SEIKO VANAC'], country: 'Japan', parent_brand: 'Seiko', category: ['Watches']},
  {name: 'Vega', jp_names: ['ベガ', 'VEGA'], country: 'United States', parent_brand: 'Nixon', category: ['Watches']},
  {name: 'Ventura', jp_names: ['ベンチュラ', 'VENTURA'], country: 'United States', parent_brand: 'Hamilton', category: ['Watches']},
  {name: 'Venu', jp_names: ['ヴェニュー', 'VENU'], country: 'United States', parent_brand: 'Garmin', category: ['Watches']},
  {name: 'Victorinox', jp_names: ['ビクトリノックス', 'ヴィクトリノックス', 'VICTORINOX', 'スイスアーミー', 'SWISS ARMY', 'VICTORINOX SWISS ARMY'], country: 'Switzerland', category: ['Watches']},
  {name: 'Voyager', jp_names: ['ボイジャー', 'VOYAGER'], country: 'Switzerland', parent_brand: 'Rado', category: ['Watches']},
  {name: 'Wave Ceptor', jp_names: ['ウェーブセプター', 'WAVE CEPTOR'], country: 'Japan', parent_brand: 'Casio', category: ['Watches']},
  {name: 'Wicca', jp_names: ['ウィッカ', 'WICCA'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Waltham', jp_names: ['ウォルサム', 'WALTHAM'], country: 'United States'},
  {name: 'Wenger', jp_names: ['ウェンガー', 'WENGER'], country: 'Switzerland', category: ['Watches']},
  {name: 'xC', jp_names: ['クロスシー', 'XC'], country: 'Japan', parent_brand: 'Citizen', category: ['Watches']},
  {name: 'Yacht-Master', jp_names: ['ヨットマスター', 'YACHT-MASTER', 'YACHT MASTER', 'YACHTMASTER'], country: 'Switzerland', parent_brand: 'Rolex', category: ['Watches']},
  {name: 'Zenith', jp_names: ['ゼニス', 'ZENITH'], country: 'Switzerland'},
  {name: 'Zeppelin', jp_names: ['ツェッペリン', 'ZEPPELIN'], country: 'Germany', category: ['Watches']},
  {name: 'U-Boat', jp_names: ['ユーボート', 'U BOAT', 'UBOAT'], country: 'Italy'},
  {name: 'GaGa Milano', jp_names: ['ガガミラノ', 'GAGA MILANO', 'GAGAMILANO', 'GAGA', 'ガガ ミラノ'], country: 'Italy'},

  // === Jewelry & Accessories ===
  {name: '4℃', jp_names: ['ヨンドシー', '4℃', '4°C'], country: 'Japan'},
  {name: 'Agete', jp_names: ['アガット', 'AGETE'], country: 'Japan'},
  {name: 'Ahkah', jp_names: ['アーカー', 'AHKAH'], country: 'Japan'},
  {name: 'Aksel Holmsen', jp_names: ['アクセルホルムセン', 'AKSEL HOLMSEN', 'HOLMSEN'], country: 'Norway'},
  {name: 'Alex Monroe', jp_names: ['アレックスモンロー', 'ALEX MONROE'], country: 'United Kingdom'},
  {name: 'Alexandre de Paris', jp_names: ['アレクサンドルドゥパリ', 'アレクサンドル ドゥ パリ', 'ALEXANDRE DE PARIS'], country: 'France'},
  {name: 'Anton Michelsen', jp_names: ['アントンミケルセン', 'ANTON MICHELSEN', 'A. MICHELSEN'], country: 'Denmark'},
  {name: 'Bill Wall Leather', jp_names: ['ビルウォールレザー', 'BILL WALL LEATHER'], country: 'United States'},
  {name: 'Boucheron', jp_names: ['ブシュロン', 'BOUCHERON'], country: 'France'},
  {name: 'Bulgari', jp_names: ['ブルガリ', 'BVLGARI'], country: 'Italy'},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI'], country: 'Italy'},
  {name: 'Chaumet', jp_names: ['ショーメ', 'CHAUMET'], country: 'France'},
  {name: 'Chopard', jp_names: ['ショパール', 'CHOPARD'], country: 'Switzerland'},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'United States'},
  {name: 'Cody Sanderson', jp_names: ['コディサンダーソン', 'CODY SANDERSON'], country: 'United States'},
  {name: 'Damiani', jp_names: ['ダミアーニ', 'DAMIANI'], country: 'Italy'},
  {name: 'David Andersen', jp_names: ['デヴィッドアンデルセン', 'DAVID ANDERSEN', 'D.ANDERSEN'], country: 'Norway'},
  {name: 'David Yurman', jp_names: ['デイビット・ヤーマン', 'DAVID YURMAN'], country: 'United States'},
  {name: 'Emporio Armani', jp_names: ['エンポリオアルマーニ', 'エンポリオ アルマーニ', 'EMPORIO ARMANI', 'EMPORIOARMANI', 'ARMANI'], country: 'Italy'},
  {name: 'Ete', jp_names: ['エテ', 'ETE'], country: 'Japan'},
  {name: 'Folli Follie', jp_names: ['フォリフォリ', 'FOLLI FOLLIE'], country: 'Greece'},
  {name: 'Etro', jp_names: ['エトロ', 'ETRO'], country: 'Italy'},
  {name: 'Fred', jp_names: ['フレッド', 'FRED'], country: 'France'},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy'},
  {name: 'Hans Hansen', jp_names: ['ハンスハンセン', 'HANS HANSEN'], country: 'Denmark'},
  {name: 'Harry Winston', jp_names: ['ハリー・ウィンストン', 'HARRY WINSTON'], country: 'United States'},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France'},
  {name: 'J. Tostrup', jp_names: ['トストルプ', 'J. TOSTRUP', 'TOSTRUP'], country: 'Norway'},
  {name: 'Justin Davis', jp_names: ['ジャスティン・デイビス', 'JUSTIN DAVIS'], country: 'United States'},
  {name: 'K.UNO', jp_names: ['ケイウノ', 'K.UNO', 'KUNO'], country: 'Japan'},
  {name: 'Kalevala Koru', jp_names: ['カレワラコル', 'KALEVALA KORU', 'KALEVALA JEWELRY'], country: 'Finland'},
  {name: 'Kultaseppä Salovaara', jp_names: ['クルタセッパサロヴァーラ', 'KULTASEPPA SALOVAARA', 'SALOVAARA'], country: 'Finland'},
  {name: 'KUMIKYOKU', jp_names: ['組曲', 'クミキョク', 'KUMIKYOKU'], country: 'Japan'},
  {name: 'Lapponia', jp_names: ['ラッポニア', 'LAPPONIA'], country: 'Finland'},
  {name: 'Louis Faglin', jp_names: ['ルイファグラン', 'LOUIS FAGLIN'], country: 'France'},
  {name: 'Max Mara', jp_names: ['マックスマーラ', 'MAX MARA'], country: 'Italy'},
  {name: 'Mikimoto', jp_names: ['ミキモト', 'MIKIMOTO'], country: 'Japan'},
  {name: 'Monet', jp_names: ['モネ', 'MONET'], country: 'United States'},
  {name: 'Monica Vinader', jp_names: ['モニカヴィナダー', 'MONICA VINADER'], country: 'United Kingdom'},
  {name: 'N.E. From', jp_names: ['エヌイーフロム', 'N.E. FROM', 'NE FROM', 'N.E.FROM'], country: 'Denmark'},
  {name: 'Nina Ricci', jp_names: ['ニナリッチ', 'NINA RICCI'], country: 'France'},
  {name: 'Pandora', jp_names: ['パンドラ', 'PANDORA'], country: 'Denmark'},
  {name: 'Paul Smith', jp_names: ['ポールスミス', 'ポール・スミス', 'PAUL SMITH'], country: 'United Kingdom', category: ['Watches']},
  {name: 'STAR JEWELRY', jp_names: ['スタージュエリー', 'STAR JEWELRY'], country: 'Japan'},
  {name: 'Swarovski', jp_names: ['スワロフスキー', 'SWAROVSKI'], country: 'Austria', is_material: true},
  {name: 'Tasaki', jp_names: ['タサキ', 'TASAKI'], country: 'Japan'},
  {name: 'Tateossian', jp_names: ['タテオシアン', 'TATEOSSIAN'], country: 'United Kingdom'},
  {name: 'Thomas Sabo', jp_names: ['トーマスサボ', 'THOMAS SABO'], country: 'Germany'},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY & CO.', 'TIFFANY', 'TIFFANY&CO', 'Tiffany'], country: 'United States'},
  {name: 'Van Cleef & Arpels', jp_names: ['ヴァン クリーフ＆アーペル', 'VAN CLEEF & ARPELS', 'VAN CLEEF', 'VANCLEEF&ARPELS'], country: 'France'},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアン・ウエストウッド', 'VIVIENNE WESTWOOD'], country: 'United Kingdom'},
  {name: 'Trollbeads', jp_names: ['トロールビーズ', 'TROLLBEADS'], country: 'Denmark'},
  {name: 'Yves Saint Laurent', jp_names: ['イヴサンローラン', 'イブサンローラン', 'YVES SAINT LAURENT', 'YSL'], country: 'France'},
  {name: 'Maison Margiela', jp_names: ['メゾンマルジェラ', 'マルジェラ', 'MAISON MARGIELA', 'MARGIELA', 'メゾン マルジェラ'], country: 'Italy'},
  {name: 'CINER', jp_names: ['シネール', 'CINER'], country: 'United States'},

  // === Bags ===
  {name: 'Anello', jp_names: ['アネロ', 'ANELLO'], country: 'Japan'},
  {name: 'aniary', jp_names: ['アニアリ', 'ANIARY'], country: 'Japan'},
  {name: 'BRIEFING', jp_names: ['ブリーフィング', 'BRIEFING'], country: 'Japan'},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France'},
  {name: 'Bottega Veneta', jp_names: ['ボッテガ・ヴェネタ', 'BOTTEGA VENETA'], country: 'Italy'},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'United Kingdom'},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France'},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France'},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'United States'},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France'},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy'},
  {name: 'Filson', jp_names: ['フィルソン', 'FILSON'], country: 'United States'},
  {name: 'Freitag', jp_names: ['フライターグ', 'FREITAG'], country: 'Switzerland'},
  {name: 'Goyard', jp_names: ['ゴヤール', 'GOYARD'], country: 'France'},
  {name: 'HERZ', jp_names: ['ヘルツ', 'HERZ'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Hunting World', jp_names: ['ハンティングワールド', 'HUNTING WORLD'], country: 'United States'},
  {name: '印伝屋', jp_names: ['印伝屋', 'インデンヤ', 'INDEN-YA', 'INDENYA'], country: 'Japan'},
  {name: 'Loewe', jp_names: ['ロエベ', 'LOEWE'], country: 'Spain'},
  {name: 'Louis Vuitton', jp_names: ['ルイ・ヴィトン', 'LOUIS VUITTON'], country: 'France'},
  {name: 'Manhattan Portage', jp_names: ['マンハッタンポーテージ', 'MANHATTAN PORTAGE'], country: 'United States'},
  {name: '万双', jp_names: ['万双', 'マンソウ', 'MANSOU'], country: 'Japan'},
  {name: 'Orobianco', jp_names: ['オロビアンコ', 'OROBIANCO'], country: 'Italy', category: ['Watches']},
  {name: 'Porter', jp_names: ['ポーター', 'PORTER'], country: 'Japan'},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy'},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT'], country: 'France'},
  {name: '土屋鞄製造所', jp_names: ['土屋鞄', 'ツチヤカバン', 'TSUCHIYA KABAN'], country: 'Japan'},

  // === Clothing & Fashion ===
  {name: '45rpm', jp_names: ['45アールピーエム', 'フォーティーファイブアールピーエム', '45RPM', '45R'], country: 'Japan'},
  {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE', 'アベイシングエイプ'], country: 'Japan', category: ['Watches']},
  {name: 'Agnes b.', jp_names: ['アニエスベー', 'AGNES B'], country: 'France'},
  {name: 'Alden', jp_names: ['オールデン', 'ALDEN'], country: 'United States'},
  {name: 'Alexander Wang', jp_names: ['アレキサンダーワン', 'ALEXANDER WANG'], country: 'United States'},
  {name: 'Anna Sui', jp_names: ['アナスイ', 'ANNA SUI'], country: 'United States'},
  {name: 'Aniplex', jp_names: ['アニプレックス', 'ANIPLEX'], country: 'Japan', category: ['Figures']},
  {name: 'Taito', jp_names: ['タイトー', 'TAITO'], country: 'Japan', category: ['Figures']},
  {name: 'Bally', jp_names: ['バリー', 'BALLY'], country: 'Switzerland'},
  {name: 'Bang & Olufsen', jp_names: ['バング&オルフセン', 'BANG & OLUFSEN', 'B&O', 'BANG&OLUFSEN'], country: 'Denmark'},
  {name: 'Beams', jp_names: ['ビームス', 'BEAMS'], country: 'Japan'},
  {name: 'Bloody Mary', jp_names: ['ブラッディマリー', 'BLOODY MARY'], country: 'Japan'},
  {name: 'Brooks Brothers', jp_names: ['ブルックスブラザーズ', 'BROOKS BROTHERS'], country: 'United States'},
  {name: 'Canada Goose', jp_names: ['カナダグース', 'CANADA GOOSE'], country: 'Canada'},
  {name: 'Carhartt', jp_names: ['カーハート', 'CARHARTT'], country: 'United States'},
  {name: 'Champion', jp_names: ['チャンピオン', 'CHAMPION'], country: 'United States'},
  {name: 'Chloe', jp_names: ['クロエ', 'CHLOE'], country: 'France'},
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS'], country: 'Japan'},
  {name: 'Comme des Garcons Play', jp_names: ['プレイ・コムデギャルソン', 'PLAY COMME DES GARCONS'], country: 'Japan'},
  {name: 'Diesel', jp_names: ['ディーゼル', 'DIESEL'], country: 'Italy'},
  {name: 'Dolce Gabbana', jp_names: ['ドルチェ&ガッバーナ', 'DOLCE GABBANA'], country: 'Italy'},
  {name: "Drake's", jp_names: ['ドレイクス', "DRAKE'S", 'DRAKES'], country: 'United Kingdom'},
  {name: 'Dunhill', jp_names: ['ダンヒル', 'DUNHILL'], country: 'United Kingdom'},
  {name: 'Emilio Pucci', jp_names: ['エミリオプッチ', 'EMILIO PUCCI', 'PUCCI'], country: 'Italy'},
  {name: 'Evisu', jp_names: ['エヴィス', 'EVISU'], country: 'Japan'},
  {name: 'Faliero Sarti', jp_names: ['ファリエロサルティ', 'FALIERO SARTI'], country: 'Italy'},
  {name: 'Feiler', jp_names: ['フェイラー', 'FEILER'], country: 'Germany'},
  {name: 'First Arrow\'s', jp_names: ['ファーストアローズ', 'FIRST ARROW\'S'], country: 'Japan'},
  {name: 'Fragment', jp_names: ['フラグメント', 'FRAGMENT'], country: 'Japan'},
  {name: 'Fukagawa Seiji', jp_names: ['深川製磁', 'FUKAGAWA SEIJI'], country: 'Japan'},
  {name: 'Furla', jp_names: ['フルラ', 'FURLA'], country: 'Italy'},
  {name: 'Furyu', jp_names: ['フリュー', 'FURYU'], country: 'Japan', category: ['Figures']},
  {name: 'Gaboratory', jp_names: ['ガボラトリー', 'GABORATORY'], country: 'United States'},
  {name: 'Gen-emon', jp_names: ['源右衛門', 'GEN-EMON', 'GENEMON'], country: 'Japan'},
  {name: 'Georg Jensen', jp_names: ['ジョージ・ジェンセン', 'GEORG JENSEN'], country: 'Denmark'},
  {name: 'Giant', jp_names: ['ジャイアント', 'GIANT'], country: 'Taiwan'},
  {name: 'Gibson', jp_names: ['ギブソン', 'GIBSON'], country: 'United States'},
  {name: 'Ginza Tanaka', jp_names: ['ギンザタナカ', 'GINZA TANAKA'], country: 'Japan'},
  {name: 'Givenchy', jp_names: ['ジバンシィ', 'GIVENCHY'], country: 'France'},
  {name: 'Goldwin', jp_names: ['ゴールドウイン', 'GOLDWIN'], country: 'Japan'},
  {name: 'Goro\'s', jp_names: ['ゴローズ', 'GORO\'S'], country: 'Japan'},
  {name: 'Graff', jp_names: ['グラフ', 'GRAFF'], country: 'United Kingdom'},
  {name: 'Greco', jp_names: ['グレコ', 'GRECO'], country: 'Japan'},
  {name: 'Gregory', jp_names: ['グレゴリー', 'GREGORY'], country: 'United States'},
  {name: 'Hanae Mori', jp_names: ['ハナエモリ', '森英恵', 'HANAE MORI'], country: 'Japan'},
  {name: 'Head', jp_names: ['ヘッド', 'HEAD'], country: 'Austria'},
  {name: 'Herend', jp_names: ['ヘレンド', 'HEREND'], country: 'Hungary'},
  {name: 'Human Made', jp_names: ['ヒューマンメイド', 'HUMAN MADE'], country: 'Japan'},
  {name: 'Hysteric Glamour', jp_names: ['ヒステリックグラマー', 'HYSTERIC GLAMOUR'], country: 'Japan'},
  {name: 'Ichiban Kuji', jp_names: ['一番くじ', 'ICHIBAN KUJI'], country: 'Japan'},
  {name: 'Imaemon', jp_names: ['今右衛門', 'IMAEMON'], country: 'Japan'},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE'], country: 'Japan', category: ['Watches']},
  {name: 'Jimmy Choo', jp_names: ['ジミーチュウ', 'JIMMY CHOO'], country: 'United Kingdom'},
  {name: 'Johnstons of Elgin', jp_names: ['ジョンストンズ', 'JOHNSTONS OF ELGIN', 'JOHNSTONS'], country: 'United Kingdom'},
  {name: 'Kadokawa', jp_names: ['KADOKAWA'], country: 'Japan'},
  {name: 'Kapital', jp_names: ['キャピタル', 'KAPITAL'], country: 'Japan'},
  {name: 'Kate Spade', jp_names: ['ケイト・スペード', 'KATE SPADE'], country: 'United States'},
  {name: 'Kenwood', jp_names: ['ケンウッド', 'KENWOOD'], country: 'Japan'},
  {name: 'Kenzo', jp_names: ['ケンゾー', 'KENZO'], country: 'France'},
  {name: 'Kiyomizu', jp_names: ['清水焼', 'KIYOMIZU'], country: 'Japan'},
  {name: 'Konica', jp_names: ['コニカ', 'KONICA'], country: 'Japan'},
  {name: 'Koransha', jp_names: ['香蘭社', 'KORANSHA'], country: 'Japan'},
  {name: 'Kyosho', jp_names: ['京商', 'KYOSHO'], country: 'Japan', category: ['RC & Models']},
  {name: 'L.L.Bean', jp_names: ['エルエルビーン', 'L.L.BEAN', 'LLBEAN', 'LL BEAN'], country: 'United States'},
  {name: 'Lacoste', jp_names: ['ラコステ', 'LACOSTE'], country: 'France'},
  {name: 'Lalique', jp_names: ['ラリック', 'LALIQUE'], country: 'France'},
  {name: 'Levi\'s', jp_names: ['リーバイス', 'LEVI\'S'], country: 'United States'},
  {name: 'Lladro', jp_names: ['リヤドロ', 'LLADRO'], country: 'Spain'},
  {name: 'Lone Ones', jp_names: ['ロンワンズ', 'LONE ONES'], country: 'United States'},
  {name: 'Longchamp', jp_names: ['ロンシャン', 'LONGCHAMP'], country: 'France'},
  {name: 'Loree Rodkin', jp_names: ['ローリーロドキン', 'LOREE RODKIN'], country: 'United States'},
  {name: 'Luigi Borrelli', jp_names: ['ルイジボレッリ', 'ルイジ・ボレッリ', 'LUIGI BORRELLI'], country: 'Italy'},
  {name: 'Luxman', jp_names: ['ラックスマン', 'LUXMAN'], country: 'Japan'},
  {name: 'MCM', jp_names: ['エムシーエム', 'MCM'], country: 'Germany'},
  {name: 'manipuri', jp_names: ['マニプリ', 'MANIPURI'], country: 'Japan'},
  {name: 'Marc Jacobs', jp_names: ['マーク・ジェイコブス', 'MARC JACOBS'], country: 'United States'},
  {name: 'Marimekko', jp_names: ['マリメッコ', 'MARIMEKKO'], country: 'Finland'},
  {name: 'Martin', jp_names: ['マーティン', 'MARTIN'], country: 'United States'},
  {name: 'Mastermind Japan', jp_names: ['マスターマインド', 'MASTERMIND JAPAN'], country: 'Japan'},
  {name: 'Meissen', jp_names: ['マイセン', 'MEISSEN'], country: 'Germany'},
  {name: 'Michael Kors', jp_names: ['マイケル・コース', 'MICHAEL KORS'], country: 'United States'},
  {name: 'Miu Miu', jp_names: ['ミュウミュウ', 'MIU MIU', 'MIUMIU', 'MIU'], country: 'Italy'},
  {name: 'Moncler', jp_names: ['モンクレール', 'MONCLER'], country: 'France'},
  {name: 'Montbell', jp_names: ['モンベル', 'MONTBELL'], country: 'Japan'},
  {name: 'Montblanc', jp_names: ['モンブラン', 'MONTBLANC'], country: 'Germany'},
  {name: 'Mido', jp_names: ['ミドー', 'MIDO'], country: 'Switzerland', category: ['Watches']},
  {name: 'Moog', jp_names: ['モーグ', 'MOOG'], country: 'United States'},
  {name: 'Morris', jp_names: ['モーリス', 'MORRIS'], country: 'Japan'},
  {name: 'Nakamichi', jp_names: ['ナカミチ', 'NAKAMICHI'], country: 'Japan'},
  {name: 'Narumi', jp_names: ['ナルミ', 'NARUMI'], country: 'Japan'},
  {name: 'Neighborhood', jp_names: ['ネイバーフッド', 'NEIGHBORHOOD'], country: 'Japan'},
  {name: 'Nittaku', jp_names: ['ニッタク', 'NITTAKU'], country: 'Japan'},
  {name: 'Niwaka', jp_names: ['俄', 'NIWAKA'], country: 'Japan'},
  {name: 'Nojess', jp_names: ['ノジェス', 'NOJESS'], country: 'Japan'},
  {name: 'North Face', jp_names: ['ノースフェイス', 'NORTH FACE'], country: 'United States'},
  {name: 'Number (N)ine', jp_names: ['ナンバーナイン', 'NUMBER (N)INE'], country: 'Japan'},
  {name: 'Off-White', jp_names: ['オフホワイト', 'OFF-WHITE', 'OFFWHITE'], country: 'Italy'},
  {name: 'Okura Art China', jp_names: ['大倉陶園', 'OKURA ART CHINA'], country: 'Japan'},
  {name: 'Patagonia', jp_names: ['パタゴニア', 'PATAGONIA'], country: 'United States'},
  {name: 'Paul & Joe', jp_names: ['ポール&ジョー', 'PAUL & JOE', 'PAUL&JOE'], country: 'France'},
  {name: 'Playmobil', jp_names: ['プレイモービル', 'PLAYMOBIL'], country: 'Germany'},
  {name: 'Pomellato', jp_names: ['ポメラート', 'POMELLATO'], country: 'Italy'},
  {name: 'Ponte Vecchio', jp_names: ['ポンテヴェキオ', 'PONTE VECCHIO'], country: 'Japan'},
  {name: 'Prince', jp_names: ['プリンス', 'PRINCE'], country: 'United States'},
  {name: 'Ralph Lauren', jp_names: ['ラルフローレン', 'RALPH LAUREN'], country: 'United States'},
  {name: 'Ray-Ban', jp_names: ['レイバン', 'RAY-BAN'], country: 'United States'},
  {name: 'Request', jp_names: ['リクエスト', 'REQUEST'], country: 'Japan'},
  {name: 'Rimowa', jp_names: ['リモワ', 'RIMOWA'], country: 'Germany'},
  {name: 'SABIAN', jp_names: ['セイビアン', 'SABIAN'], country: 'Canada'},
  {name: 'Salvatore Ferragamo', jp_names: ['サルヴァトーレ フェラガモ', 'フェラガモ', 'SALVATORE FERRAGAMO', 'Ferragamo', 'FERRAGAMO'], country: 'Italy'},
  {name: 'Salvatore Marra', jp_names: ['サルバトーレマーラ', 'SALVATORE MARRA', 'サルバトーレ マーラ'], country: 'Italy', category: ['Watches']},
  {name: 'Samantha Tiara', jp_names: ['サマンサティアラ', 'SAMANTHA TIARA', 'サマンサ ティアラ'], country: 'Japan'},
  {name: 'Saint Laurent Paris', jp_names: ['サンローランパリ', 'SAINT LAURENT PARIS'], country: 'France'},
  {name: 'Salsa', jp_names: ['サルサ', 'SALSA'], country: 'United States'},
  {name: 'Shinshu', jp_names: ['信州', 'SHINSHU'], country: 'Japan'},
  {name: 'Shunjuen', jp_names: ['春秋園', 'SHUNJUEN'], country: 'Japan'},
  {name: 'Specialized', jp_names: ['スペシャライズド', 'SPECIALIZED'], country: 'United States'},
  {name: 'Star Jewelry', jp_names: ['スタージュエリー', 'STAR JEWELRY'], country: 'Japan'},
  {name: 'Stax', jp_names: ['スタックス', 'STAX'], country: 'Japan'},
  {name: 'Stella McCartney', jp_names: ['ステラ・マッカートニー', 'STELLA MCCARTNEY'], country: 'United Kingdom'},
  {name: 'Stone Island', jp_names: ['ストーンアイランド', 'STONE ISLAND'], country: 'Italy'},
  {name: 'Stussy', jp_names: ['ステューシー', 'STUSSY'], country: 'United States'},
  {name: 'Supreme', jp_names: ['シュプリーム', 'SUPREME'], country: 'United States'},
  {name: 'TC Electronic', jp_names: ['ティーシーエレクトロニック', 'TC ELECTRONIC'], country: 'Denmark'},
  {name: 'Tachikichi', jp_names: ['たち吉', 'TACHIKICHI'], country: 'Japan'},
  {name: 'Tady & King', jp_names: ['タディアンドキング', 'TADY & KING', 'TADY&KING'], country: 'Japan'},
  {name: 'Tascam', jp_names: ['タスカム', 'TASCAM'], country: 'Japan'},
  {name: 'Taylor', jp_names: ['テイラー', 'TAYLOR'], country: 'United States'},
  {name: 'Teac', jp_names: ['ティアック', 'TEAC'], country: 'Japan'},
  {name: 'Technics', jp_names: ['テクニクス', 'TECHNICS'], country: 'Japan'},
  {name: 'Technos', jp_names: ['テクノス', 'TECHNOS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Timberland', jp_names: ['ティンバーランド', 'TIMBERLAND'], country: 'United States'},
  {name: 'Tobe', jp_names: ['砥部焼', 'TOBE'], country: 'Japan'},
  {name: 'Tommy Hilfiger', jp_names: ['トミーヒルフィガー', 'TOMMY HILFIGER', 'トミー ヒルフィガー'], country: 'United States'},
  {name: 'Tory Burch', jp_names: ['トリーバーチ', 'TORY BURCH'], country: 'United States'},
  {name: 'Trek', jp_names: ['トレック', 'TREK'], country: 'United States'},
  {name: 'Tumi', jp_names: ['トゥミ', 'TUMI'], country: 'United States'},
  {name: 'Undercover', jp_names: ['アンダーカバー', 'UNDERCOVER'], country: 'Japan'},
  {name: 'United Arrows', jp_names: ['ユナイテッドアローズ', 'UNITED ARROWS'], country: 'Japan'},
  {name: 'Valentino', jp_names: ['ヴァレンティノ', 'VALENTINO'], country: 'Italy'},
  {name: 'Vendome Aoyama', jp_names: ['ヴァンドーム青山', 'VENDOME AOYAMA'], country: 'Japan'},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'VERSACE'], country: 'Italy', category: ['Watches']},
  {name: 'Victas', jp_names: ['ヴィクタス', 'VICTAS'], country: 'Japan'},
  {name: 'Visvim', jp_names: ['ビズビム', 'VISVIM'], country: 'Japan'},
  {name: 'Voigtlander', jp_names: ['フォクトレンダー', 'VOIGTLANDER'], country: 'Germany'},
  {name: 'WTAPS', jp_names: ['ダブルタップス', 'WTAPS'], country: 'Japan'},
  {name: 'Wedgwood', jp_names: ['ウェッジウッド', 'WEDGWOOD'], country: 'United Kingdom'},
  {name: 'Wilson', jp_names: ['ウィルソン', 'WILSON'], country: 'United States'},
  {name: 'Yashica', jp_names: ['ヤシカ', 'YASHICA'], country: 'Japan'},
  {name: 'Yohji Yamamoto', jp_names: ['ヨウジヤマモト', 'YOHJI YAMAMOTO'], country: 'Japan'},
  {name: 'Yoshida', jp_names: ['吉田カバン', 'YOSHIDA'], country: 'Japan'},
  {name: 'Yumi Katsura', jp_names: ['桂由美', 'ユミカツラ', 'YUMI KATSURA'], country: 'Japan'},
  {name: 'Zoom', jp_names: ['ズーム', 'ZOOM'], country: 'Japan'},
  {name: 'master-piece', jp_names: ['マスターピース', 'MASTER-PIECE', 'MASTERPIECE'], country: 'Japan'},

  // === Sunglasses ===
  {name: 'Barton Perreira', jp_names: ['バートンペレイラ', 'BARTON PERREIRA'], country: 'United States', category: ['Sunglasses']},
  {name: 'Bottega Veneta', jp_names: ['ボッテガヴェネタ', 'BOTTEGA VENETA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Bulgari', jp_names: ['ブルガリ', 'BVLGARI', 'BULGARI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'United Kingdom', category: ['Sunglasses']},
  {name: 'Carrera', jp_names: ['カレラ', 'CARRERA'], country: 'Austria', category: ['Sunglasses']},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France', category: ['Sunglasses']},
  {name: 'Cazal', jp_names: ['カザール', 'CAZAL'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France', category: ['Sunglasses']},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France', category: ['Sunglasses']},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'United States', category: ['Sunglasses']},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'United States', category: ['Sunglasses']},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France', category: ['Sunglasses']},
  {name: 'Dolce & Gabbana', jp_names: ['ドルチェ&ガッバーナ', 'DOLCE & GABBANA', 'D&G', 'DOLCE&GABBANA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Emporio Armani', jp_names: ['エンポリオアルマーニ', 'EMPORIO ARMANI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Gentle Monster', jp_names: ['ジェントルモンスター', 'GENTLE MONSTER'], country: 'South Korea', category: ['Sunglasses']},
  {name: 'Giorgio Armani', jp_names: ['ジョルジオアルマーニ', 'GIORGIO ARMANI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Gregory Peck', jp_names: ['グレゴリーペック', 'GREGORY PECK'], country: 'United States', parent_brand: 'Oliver Peoples', category: ['Sunglasses']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Sunglasses']},
  {name: 'ic! berlin', jp_names: ['アイシーベルリン', 'IC! BERLIN', 'IC BERLIN'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Jacques Marie Mage', jp_names: ['ジャックマリーマージュ', 'JACQUES MARIE MAGE'], country: 'United States', category: ['Sunglasses']},
  {name: 'Maui Jim', jp_names: ['マウイジム', 'MAUI JIM'], country: 'United States', category: ['Sunglasses']},
  {name: 'Michael Kors', jp_names: ['マイケルコース', 'MICHAEL KORS'], country: 'United States', category: ['Sunglasses']},
  {name: 'Moscot', jp_names: ['モスコット', 'MOSCOT'], country: 'United States', category: ['Sunglasses']},
  {name: 'Mykita', jp_names: ['マイキータ', 'MYKITA'], country: 'Germany', category: ['Sunglasses']},
  {name: 'Oakley', jp_names: ['オークリー', 'OAKLEY'], country: 'United States', category: ['Sunglasses']},
  {name: 'Oliver Peoples', jp_names: ['オリバーピープルズ', 'OLIVER PEOPLES'], country: 'United States', category: ['Sunglasses']},
  {name: 'Persol', jp_names: ['ペルソール', 'PERSOL'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Police', jp_names: ['ポリス', 'POLICE'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Sunglasses']},
  {name: 'Ray-Ban', jp_names: ['レイバン', 'RAY-BAN', 'RAYBAN', 'RAY BAN'], country: 'United States', category: ['Sunglasses']},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT', 'YSL'], country: 'France', category: ['Sunglasses']},
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY & CO.', 'TIFFANY'], country: 'United States', category: ['Sunglasses']},
  {name: 'Tom Ford', jp_names: ['トムフォード', 'TOM FORD'], country: 'Italy', category: ['Sunglasses', 'Watches']},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'VERSACE'], country: 'Italy', category: ['Sunglasses']},
  {name: 'TITMUS', jp_names: ['ティトマス', 'TITMUS'], country: 'United States', category: ['Sunglasses']},
  {name: 'A.D.S.R.', jp_names: ['ADSR', 'A.D.S.R.', 'A.D.S.R', 'エーディーエスアール'], country: 'Japan', category: ['Sunglasses']},
  {name: 'TAKAHIROMIYASHITA TheSoloist.', jp_names: ['タカヒロミヤシタ', 'TAKAHIROMIYASHITA', 'ザソロイスト', 'THE SOLOIST', 'THESOLOIST'], country: 'Japan', category: ['Sunglasses']},
  {name: 'N.S.H', jp_names: ['N.S.H', 'NSH', 'エヌエスエイチ'], country: 'Japan', category: ['Sunglasses']},
  {name: 'Jean Paul Gaultier', jp_names: ['ジャンポールゴルチエ', 'ゴルチエ', 'JEAN PAUL GAULTIER', 'JPG'], country: 'France', category: ['Sunglasses', 'Watches']},
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
  {name: 'Clarks', jp_names: ['クラークス', 'CLARKS'], country: 'United Kingdom'},
  {name: 'Converse', jp_names: ['コンバース', 'CONVERSE'], country: 'United States'},
  {name: 'Crockett & Jones', jp_names: ['クロケット＆ジョーンズ', 'CROCKETT & JONES', 'CROCKETT&JONES'], country: 'United Kingdom'},
  {name: 'Dr. Martens', jp_names: ['ドクターマーチン', 'DR. MARTENS', 'DR MARTENS', 'DRMARTENS'], country: 'United Kingdom'},
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan'},
  {name: 'New Balance', jp_names: ['ニューバランス', 'NEW BALANCE'], country: 'United States'},
  {name: 'Nike', jp_names: ['ナイキ', 'NIKE'], country: 'United States'},
  {name: 'Onitsuka Tiger', jp_names: ['オニツカタイガー', 'ONITSUKA TIGER'], country: 'Japan'},
  {name: 'Puma', jp_names: ['プーマ', 'PUMA'], country: 'Germany'},
  {name: 'Reebok', jp_names: ['リーボック', 'REEBOK'], country: 'United Kingdom'},
  {name: 'Vans', jp_names: ['バンズ', 'VANS'], country: 'United States'},
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
  {name: 'GoPro', jp_names: ['ゴープロ', 'GOPRO'], country: 'United States'},
  {name: 'Graflex', jp_names: ['グラフレックス', 'GRAFLEX'], country: 'United States'},
  {name: 'Hasselblad', jp_names: ['ハッセルブラッド', 'HASSELBLAD'], country: 'Sweden'},
  {name: 'Kodak', jp_names: ['コダック', 'KODAK'], country: 'United States'},
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
  {name: 'Polaroid', jp_names: ['ポラロイド', 'POLAROID'], country: 'United States'},
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
  {name: 'SX-70', jp_names: ['SX-70', 'SX70'], country: 'United States', parent_brand: 'Polaroid', category: ['Cameras']},
  {name: 'OneStep', jp_names: ['ONESTEP', 'ワンステップ'], country: 'United States', parent_brand: 'Polaroid', category: ['Cameras']},

  // === GoPro ===
  {name: 'HERO12', jp_names: ['HERO12', 'HERO 12', 'ゴープロ12'], country: 'United States', parent_brand: 'GoPro', category: ['Cameras']},
  {name: 'HERO11', jp_names: ['HERO11', 'HERO 11'], country: 'United States', parent_brand: 'GoPro', category: ['Cameras']},
  {name: 'HERO10', jp_names: ['HERO10', 'HERO 10'], country: 'United States', parent_brand: 'GoPro', category: ['Cameras']},

  // === Kodak ===
  {name: 'Retina', jp_names: ['RETINA', 'レチナ'], country: 'United States', parent_brand: 'Kodak', category: ['Cameras']},
  {name: 'Retina IIa', jp_names: ['RETINA IIA', 'レチナIIA'], country: 'United States', parent_brand: 'Kodak', category: ['Cameras']},

  // === Sigma ===
  {name: 'fp', jp_names: ['FP', 'シグマFP', 'SIGMA FP'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'fp L', jp_names: ['FP L', 'シグマFP L', 'SIGMA FP L'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP1 Merrill', jp_names: ['DP1 MERRILL', 'DP1メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP2 Merrill', jp_names: ['DP2 MERRILL', 'DP2メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},
  {name: 'DP3 Merrill', jp_names: ['DP3 MERRILL', 'DP3メリル'], country: 'Japan', parent_brand: 'Sigma', category: ['Cameras']},

  // === Electronics & Audio ===
  {name: 'AKG', jp_names: ['アーカーゲー', 'AKG'], country: 'Austria'},
  {name: 'Accuphase', jp_names: ['アキュフェーズ', 'ACCUPHASE'], country: 'Japan'},
  {name: 'Apple', jp_names: ['アップル', 'APPLE'], country: 'United States'},
  {name: 'Audio-Technica', jp_names: ['オーディオテクニカ', 'AUDIO-TECHNICA', 'AUDIO TECHNICA', 'AUDIOTECHNICA'], country: 'Japan'},
  {name: 'Bose', jp_names: ['ボーズ', 'BOSE'], country: 'United States'},
  {name: 'Denon', jp_names: ['デノン', 'DENON'], country: 'Japan'},
  {name: 'Esoteric', jp_names: ['エソテリック', 'ESOTERIC'], country: 'Japan'},
  {name: 'Focal', jp_names: ['フォーカル', 'FOCAL'], country: 'France'},
  {name: 'Foster', jp_names: ['フォスター', 'FOSTER'], country: 'Japan'},
  {name: 'Fostex', jp_names: ['フォステクス', 'FOSTEX'], country: 'Japan'},
  {name: 'JBL', jp_names: ['ジェイビーエル', 'JBL'], country: 'United States'},
  {name: 'Marantz', jp_names: ['マランツ', 'MARANTZ'], country: 'United States'},
  {name: 'Onkyo', jp_names: ['オンキヨー', 'ONKYO'], country: 'Japan'},
  {name: 'Panasonic', jp_names: ['パナソニック', 'PANASONIC'], country: 'Japan'},
  {name: 'Pioneer', jp_names: ['パイオニア', 'PIONEER'], country: 'Japan'},
  {name: 'Samsung', jp_names: ['サムスン', 'SAMSUNG'], country: 'South Korea'},
  {name: 'Sony', jp_names: ['ソニー', 'SONY'], country: 'Japan', category: ['Cameras', 'Electronics']},

  // === Trading Cards ===
  {name: 'Battle Spirits', jp_names: ['バトルスピリッツ', 'BATTLE SPIRITS'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Cardfight!! Vanguard', jp_names: ['カードファイト!! ヴァンガード', 'VANGUARD', 'CARDFIGHT VANGUARD'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Digimon', jp_names: ['デジモン', 'DIGIMON'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Dragon Ball', jp_names: ['ドラゴンボール', 'DRAGON BALL'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Duel Masters', jp_names: ['デュエルマスターズ', 'DUEL MASTERS'], country: 'United States', category: ['Trading Cards']},
  {name: 'Magic: The Gathering', jp_names: ['マジックザギャザリング', 'MAGIC THE GATHERING'], country: 'United States', category: ['Trading Cards']},
  {name: 'One Piece', jp_names: ['ワンピース', 'ONE PIECE'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Pokemon', jp_names: ['ポケモン', 'POKEMON'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Weiss Schwarz', jp_names: ['ヴァイスシュヴァルツ', 'WEISS SCHWARZ'], country: 'Japan', category: ['Trading Cards']},
  {name: 'Yu-Gi-Oh', jp_names: ['遊戯王', 'YU-GI-OH', 'YUGIOH'], country: 'Japan', category: ['Trading Cards']},

  // === Video Games ===
  {name: 'Bandai Namco', jp_names: ['バンダイナムコ', 'バンナム', 'BANDAI NAMCO'], country: 'Japan', category: ['Video Games']},
  {name: 'Capcom', jp_names: ['カプコン', 'CAPCOM'], country: 'Japan', category: ['Video Games']},
  {name: 'Konami', jp_names: ['コナミ', 'KONAMI'], country: 'Japan', category: ['Video Games']},
  {name: 'Nintendo', jp_names: ['任天堂', 'ニンテンドー', 'NINTENDO'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Sega', jp_names: ['セガ', 'SEGA'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Sony PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PLAYSTATION', 'PS5', 'PS4'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
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
  {name: 'Alter', jp_names: ['アルター', 'ALTER'], country: 'Japan', category: ['Figures']},
  {name: 'Bandai', jp_names: ['バンダイ', 'BANDAI'], country: 'Japan', category: ['Figures', 'Mecha Model Kits']},
  {name: 'Banpresto', jp_names: ['バンプレスト', 'BANPRESTO'], country: 'Japan', category: ['Figures']},
  {name: 'Figma', jp_names: ['フィグマ', 'FIGMA'], country: 'Japan', category: ['Figures']},
  {name: 'Funko', jp_names: ['ファンコ', 'FUNKO'], country: 'United States'},
  {name: 'Good Smile Company', jp_names: ['グッドスマイルカンパニー', 'GOOD SMILE COMPANY'], country: 'Japan', category: ['Figures']},
  {name: 'Kaiyodo', jp_names: ['海洋堂', 'KAIYODO'], country: 'Japan', category: ['Figures']},
  {name: 'Kotobukiya', jp_names: ['コトブキヤ', 'KOTOBUKIYA'], country: 'Japan', category: ['Figures', 'Mecha Model Kits']},
  {name: 'Max Factory', jp_names: ['マックスファクトリー', 'MAX FACTORY'], country: 'Japan', category: ['Figures']},
  {name: 'Medicom Toy', jp_names: ['メディコムトイ', 'MEDICOM TOY'], country: 'Japan', category: ['Figures']},
  {name: 'MegaHouse', jp_names: ['メガハウス', 'MEGAHOUSE'], country: 'Japan', category: ['Figures']},
  {name: 'Nendoroid', jp_names: ['ねんどろいど', 'NENDOROID'], country: 'Japan', category: ['Figures']},
  {name: 'S.H.Figuarts', jp_names: ['S.H.フィギュアーツ', 'S.H.FIGUARTS', 'SHFIGUARTS', 'SH FIGUARTS'], country: 'Japan', category: ['Figures']},
  {name: 'Aniplex', jp_names: ['アニプレックス', 'ANIPLEX'], country: 'Japan'},
  {name: 'Aoshima', jp_names: ['アオシマ', 'AOSHIMA', '青島文化教材社'], country: 'Japan', category: ['Mecha Model Kits', 'RC & Models']},
  {name: 'APEX-TOYS', jp_names: ['アペックス', 'APEX-TOYS', 'APEX'], country: 'China'},
  {name: 'BANDAI SPIRITS', jp_names: ['バンダイスピリッツ', 'BANDAI SPIRITS'], country: 'Japan', category: ['Figures', 'Mecha Model Kits']},
  {name: 'BellFine', jp_names: ['ベルファイン', 'BELLFINE'], country: 'Japan'},
  {name: 'BINDing', jp_names: ['バインディング', 'BINDING'], country: 'Japan'},
  {name: 'Bullmark', jp_names: ['ブルマーク', 'BULLMARK'], country: 'Japan'},
  {name: 'FREEing', jp_names: ['フリーイング', 'FREEING', 'FREE ING'], country: 'Japan'},
  {name: 'Gecco', jp_names: ['ゲッコウ', 'GECCO'], country: 'Japan'},
  {name: 'Hasegawa', jp_names: ['ハセガワ', 'HASEGAWA'], country: 'Japan', category: ['Mecha Model Kits', 'RC & Models']},
  {name: 'Hot Toys', jp_names: ['ホットトイズ', 'HOT TOYS'], country: 'Hong Kong'},
  {name: 'INSTINCTOY', jp_names: ['インスティンクトイ', 'INSTINCTOY'], country: 'Japan'},
  {name: 'Marusan', jp_names: ['マルサン', 'MARUSAN'], country: 'Japan'},
  {name: 'McFarlane Toys', jp_names: ['マクファーレン', 'MCFARLANE', 'MCFARLANE TOYS'], country: 'United States'},
  {name: 'Myethos', jp_names: ['ミートス', 'MYETHOS'], country: 'China'},
  {name: 'Native', jp_names: ['ネイティブ', 'NATIVE'], country: 'Japan'},
  {name: 'NECA', jp_names: ['ネカ', 'NECA'], country: 'United States'},
  {name: 'Orchid Seed', jp_names: ['オーキッドシード', 'ORCHID SEED'], country: 'Japan'},
  {name: 'PLUM', jp_names: ['プラム', 'PLUM'], country: 'Japan'},
  {name: 'Prime 1 Studio', jp_names: ['プライム1スタジオ', 'PRIME 1 STUDIO', 'PRIME1'], country: 'Japan'},
  {name: 'Re-Ment', jp_names: ['リーメント', 'RE-MENT', 'REMENT'], country: 'Japan'},
  {name: 'Real Head', jp_names: ['リアルヘッド', 'REAL HEAD', '真頭玩具'], country: 'Japan'},
  {name: 'SECRET BASE', jp_names: ['シークレットベース', 'SECRET BASE'], country: 'Japan'},
  {name: 'Sideshow Collectibles', jp_names: ['サイドショウ', 'SIDESHOW', 'SIDESHOW COLLECTIBLES'], country: 'United States'},
  {name: 'SkyTube', jp_names: ['スカイチューブ', 'SKYTUBE'], country: 'Japan'},
  {name: 'Spiritale', jp_names: ['スピリテイル', 'SPIRITALE'], country: 'Japan'},
  {name: 'T9G', jp_names: ['ティーナインジー', 'T9G'], country: 'Japan'},
  {name: 'Tamiya', jp_names: ['タミヤ', 'TAMIYA'], country: 'Japan', category: ['RC & Models']},
  {name: 'Threezero', jp_names: ['スリーゼロ', 'THREEZERO', '3ZERO'], country: 'Hong Kong'},
  {name: 'Union Creative', jp_names: ['ユニオンクリエイティブ', 'UNION CREATIVE'], country: 'Japan'},
  {name: 'Vertex', jp_names: ['ヴェルテクス', 'VERTEX'], country: 'Japan'},
  {name: 'WAVE', jp_names: ['ウェーブ', 'WAVE'], country: 'Japan', category: ['Mecha Model Kits', 'Figures']},

  // === Pottery & Porcelain ===
  {name: 'Arabia', jp_names: ['アラビア', 'ARABIA'], country: 'Finland'},
  {name: 'Starbucks', jp_names: ['スターバックス', 'スタバ', 'STARBUCKS'], country: 'United States'},
  {name: 'Arita', jp_names: ['有田焼', 'アリタヤキ', 'ARITA'], country: 'Japan'},
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
  {name: 'Ampeg', jp_names: ['アンペグ', 'AMPEG'], country: 'United States'},
  {name: 'Aria', jp_names: ['アリア', 'ARIA'], country: 'Japan'},
  {name: 'Boss', jp_names: ['ボス', 'BOSS'], country: 'Japan'},
  {name: 'ESP', jp_names: ['イーエスピー', 'ESP'], country: 'Japan'},
  {name: 'Edwards', jp_names: ['エドワーズ', 'EDWARDS'], country: 'Japan'},
  {name: 'Fender', jp_names: ['フェンダー', 'FENDER'], country: 'United States'},
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
  {name: 'Callaway', jp_names: ['キャロウェイ', 'CALLAWAY'], country: 'United States'},
  {name: 'Daiwa', jp_names: ['ダイワ', 'DAIWA'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Descente', jp_names: ['デサント', 'DESCENTE'], country: 'Japan'},
  {name: 'Gamakatsu', jp_names: ['がまかつ', 'GAMAKATSU'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Pearl Izumi', jp_names: ['パールイズミ', 'PEARL IZUMI'], country: 'Japan'},
  {name: 'Ping', jp_names: ['ピン', 'PING'], country: 'United States'},
  {name: 'Shimano', jp_names: ['シマノ', 'SHIMANO'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'TaylorMade', jp_names: ['テーラーメイド', 'TAYLORMADE'], country: 'United States'},
  {name: 'Titleist', jp_names: ['タイトリスト', 'TITLEIST'], country: 'United States'},
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
  {name: 'Hasegawa', jp_names: ['ハセガワ', 'HASEGAWA'], country: 'Japan', category: ['Mecha Model Kits', 'RC & Models']},
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
  {name: 'Kaywoodie', jp_names: ['ケイウッディ'], country: 'United States', category: ['Pipes']},
  {name: 'Dr. Grabow', jp_names: ['ドクターグラボウ', 'DR GRABOW'], country: 'United States', category: ['Pipes']},
  {name: 'Missouri Meerschaum', jp_names: ['ミズーリメシャム'], country: 'United States', category: ['Pipes']},
  {name: 'Brigham', jp_names: ['ブリガム'], country: 'Canada', category: ['Pipes']},
  {name: 'Ropp', jp_names: ['ロップ'], country: 'France', category: ['Pipes']},
  {name: 'Winslow', jp_names: ['ウィンスロー'], country: 'Denmark', category: ['Pipes']},
  {name: 'Ben Wade', jp_names: ['ベンウェイド'], country: 'United Kingdom', category: ['Pipes']},
  {name: 'Il Ceppo', jp_names: ['イルチェッポ'], country: 'Italy', category: ['Pipes']},
  {name: 'Caminetto', jp_names: ['カミネット'], country: 'Italy', category: ['Pipes']},
  {name: 'Medico', jp_names: ['メディコ'], country: 'United States', category: ['Pipes']},

  // === Dolls & Plush (ドール＆ぬいぐるみ) ===
  {name: 'Steiff', jp_names: ['シュタイフ', 'STEIFF'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Merrythought', jp_names: ['メリーソート', 'MERRYTHOUGHT'], country: 'United Kingdom', category: ['Dolls & Plush']},
  {name: 'Hermann', jp_names: ['ヘルマン', 'HERMANN'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Clemens', jp_names: ['クレメンス', 'CLEMENS'], country: 'Germany', category: ['Dolls & Plush']},
  {name: 'Ideal', jp_names: ['アイディアル', 'IDEAL'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Knickerbocker', jp_names: ['ニッカーボッカー', 'KNICKERBOCKER'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'VOLKS', jp_names: ['ボークス', 'VOLKS'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Blythe', jp_names: ['ブライス', 'ネオブライス', 'BLYTHE', 'NEO BLYTHE'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Pullip', jp_names: ['プーリップ', 'PULLIP'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'PetWorks', jp_names: ['ペットワークス', 'PETWORKS', 'PET WORKS'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Azone International', jp_names: ['アゾン', 'アゾンインターナショナル', 'AZONE', 'AZONE INTERNATIONAL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Smart Doll', jp_names: ['スマートドール', 'SMART DOLL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Barbie', jp_names: ['バービー', 'BARBIE'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Mattel', jp_names: ['マテル', 'MATTEL'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Obitsu', jp_names: ['オビツ', 'OBITSU', 'オビツ製作所'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Sekiguchi', jp_names: ['セキグチ', 'SEKIGUCHI', 'モンチッチ', 'MONCHHICHI'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Takara Tomy', jp_names: ['タカラトミー', 'TAKARA TOMY', 'タカラ', 'TAKARA', 'リカちゃん'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Groove', jp_names: ['グルーヴ', 'GROOVE'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'LUTS', jp_names: ['ルッツ', 'LUTS'], country: 'South Korea', category: ['Dolls & Plush']},
  {name: 'Fairyland', jp_names: ['フェアリーランド', 'FAIRYLAND'], country: 'South Korea', category: ['Dolls & Plush']},
  {name: 'Jellycat', jp_names: ['ジェリーキャット', 'JELLYCAT'], country: 'United Kingdom', category: ['Dolls & Plush']},
  {name: 'GUND', jp_names: ['ガンド', 'GUND'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Squishmallows', jp_names: ['スクイッシュマロ', 'SQUISHMALLOWS'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Build-A-Bear', jp_names: ['ビルドアベア', 'BUILD-A-BEAR', 'BUILD A BEAR'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Sun Arrow', jp_names: ['サンアロー', 'SUN ARROW'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'San-X', jp_names: ['サンエックス', 'SAN-X', 'SANX'], country: 'Japan', category: ['Dolls & Plush', 'Snow Globes']},
  {name: 'Sanrio', jp_names: ['サンリオ', 'SANRIO'], country: 'Japan', category: ['Dolls & Plush', 'Snow Globes']},
  {name: 'Pokemon Center', jp_names: ['ポケモンセンター', 'POKEMON CENTER'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Disney', jp_names: ['ディズニー', 'DISNEY'], country: 'United States', category: ['Dolls & Plush', 'Snow Globes']},
  {name: 'Shinada Global', jp_names: ['シナダグローバル', 'SHINADA', 'SHINADA GLOBAL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Nakajima Corporation', jp_names: ['ナカジマコーポレーション', 'NAKAJIMA'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'Sonny Angel', jp_names: ['ソニーエンジェル', 'SONNY ANGEL'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'BE@RBRICK', jp_names: ['ベアブリック', 'BEARBRICK', 'BE@RBRICK'], country: 'Japan', category: ['Dolls & Plush']},
  {name: 'KAWS', jp_names: ['カウズ', 'KAWS'], country: 'United States', category: ['Dolls & Plush']},
  {name: 'Bandai', jp_names: ['バンダイ', 'BANDAI'], country: 'Japan', category: ['Dolls & Plush', 'Video Games']},
  
  // === Hats ===
  {name: 'New Era', jp_names: ['ニューエラ', 'NEW ERA', 'NEWERA'], country: 'United States', category: ['Hats']},
  {name: 'Kangol', jp_names: ['カンゴール', 'KANGOL'], country: 'United Kingdom', category: ['Hats']},
  {name: 'Stetson', jp_names: ['ステットソン', 'STETSON'], country: 'United States', category: ['Hats']},
  {name: 'Brixton', jp_names: ['ブリクストン', 'BRIXTON'], country: 'United States', category: ['Hats']},
  {name: 'Goorin Bros', jp_names: ['グーリンブラザーズ', 'GOORIN BROS', 'GOORIN'], country: 'United States', category: ['Hats']},
  {name: 'Richardson', jp_names: ['リチャードソン', 'RICHARDSON'], country: 'United States', category: ['Hats']},
  {name: "'47 Brand", jp_names: ['フォーティーセブン', '47 BRAND', "'47", 'FORTYSEVEN'], country: 'United States', category: ['Hats']},
  {name: 'CA4LA', jp_names: ['カシラ', 'CA4LA'], country: 'Japan', category: ['Hats']},
  {name: 'Override', jp_names: ['オーバーライド', 'OVERRIDE'], country: 'Japan', category: ['Hats']},
  {name: 'H.W. Dog & Co.', jp_names: ['エイチダブリュードッグ', 'H.W. DOG', 'HW DOG', 'HWDOG'], country: 'Japan', category: ['Hats']},
  {name: 'Nine Tailor', jp_names: ['ナインテイラー', 'NINE TAILOR', 'NINETAILOR'], country: 'Japan', category: ['Hats']},
  {name: 'Bocodeco', jp_names: ['ボコデコ', 'BOCODECO'], country: 'Japan', category: ['Hats']},
  {name: 'Flexfit', jp_names: ['フレックスフィット', 'FLEXFIT'], country: 'United States', category: ['Hats']},
  {name: 'Yupoong', jp_names: ['ユーポン', 'YUPOONG'], country: 'United States', category: ['Hats']},
  {name: 'Mitchell & Ness', jp_names: ['ミッチェルアンドネス', 'MITCHELL & NESS', 'MITCHELL AND NESS', 'MITCHELL&NESS'], country: 'United States', category: ['Hats']},
  {name: 'Starter', jp_names: ['スターター', 'STARTER'], country: 'United States', category: ['Hats']},
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

  {name: 'Fossil', jp_names: ['フォッシル', 'FOSSIL'], country: 'United States', category: ['Watches']},
  {name: 'Invicta', jp_names: ['インビクタ', 'インヴィクタ', 'INVICTA'], country: 'United States', category: ['Watches']},
  {name: 'Movado', jp_names: ['モバード', 'MOVADO'], country: 'United States', category: ['Watches']},
  {name: 'Marathon', jp_names: ['マラソン', 'MARATHON'], country: 'United States', category: ['Watches']},
  {name: 'DKNY', jp_names: ['ダナキャラン', 'DKNY'], country: 'United States', category: ['Watches']},
  {name: 'Calvin Klein', jp_names: ['カルバンクライン', 'CALVIN KLEIN', 'CK'], country: 'United States', category: ['Watches']},
  {name: 'Armani Exchange', jp_names: ['アルマーニエクスチェンジ', 'ARMANI EXCHANGE', 'A|X'], country: 'United States', category: ['Watches']},

  {name: 'Christopher Ward', jp_names: ['クリストファーウォード', 'CHRISTOPHER WARD'], country: 'United Kingdom', category: ['Watches']},
  {name: 'Smiths', jp_names: ['スミス', 'SMITHS'], country: 'United Kingdom', category: ['Watches']},
  {name: 'Pinion', jp_names: ['ピニオン', 'PINION'], country: 'United Kingdom', category: ['Watches']},

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
  {name: 'Gruen', jp_names: ['グリューエン', 'GRUEN'], country: 'United States', category: ['Watches']},
  {name: 'Benrus', jp_names: ['ベンラス', 'BENRUS'], country: 'United States', category: ['Watches']},
  {name: 'Ingersoll', jp_names: ['インガーソル', 'INGERSOLL'], country: 'United States', category: ['Watches']},
  {name: 'Wittnauer', jp_names: ['ウィットナー', 'WITTNAUER'], country: 'United States', category: ['Watches']},
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
  {name: 'Elgin', jp_names: ['エルジン', 'ELGIN'], country: 'United States', category: ['Watches']},
  {name: 'Ice-Watch', jp_names: ['アイスウォッチ', 'アイス・ウォッチ', 'ICE WATCH', 'ICE-WATCH', 'ICEWATCH'], country: 'Belgium', category: ['Watches']},
  {name: 'Corniche', jp_names: ['コーニッシュ', 'CORNICHE'], country: 'Sweden', category: ['Watches']},
  {name: 'Olivia Burton', jp_names: ['オリビアバートン', 'オリビア・バートン', 'OLIVIA BURTON'], country: 'United Kingdom', category: ['Watches']},
  {name: 'OSSO ITALY', jp_names: ['オッソイタリー', 'オッソイタリィ', 'OSSO ITALY', 'OSSO'], country: 'Italy', category: ['Watches']},
  {name: 'KUOE', jp_names: ['クオ', 'KUOE'], country: 'Japan', category: ['Watches']},
  {name: 'Angel Clover', jp_names: ['エンジェルクローバー', 'ANGEL CLOVER', 'ANGELCLOVER'], country: 'Japan', category: ['Watches']},
  {name: 'Movement In Motion', jp_names: ['ムーブメントインモーション', 'MOVEMENT IN MOTION'], country: 'Japan', category: ['Watches']},
  {name: 'Epos', jp_names: ['エポス', 'EPOS'], country: 'Switzerland', category: ['Watches']},
  {name: 'Renautus', jp_names: ['ルノータス', 'RENAUTUS'], country: 'Japan', category: ['Watches']},
  {name: 'DEADMAN', jp_names: ['デッドマン', 'DEADMAN'], country: 'Japan', category: ['Watches']},
  {name: 'GANT', jp_names: ['ガント', 'GANT'], country: 'Sweden', category: ['Watches']},
  {name: 'Rotary', jp_names: ['ロータリー', 'ROTARY'], country: 'United Kingdom', category: ['Watches']},
  {name: 'Just Cavalli', jp_names: ['ジャストカヴァリ', 'ジャストカバリ', 'JUST CAVALLI', 'JUSTCAVALLI'], country: 'Italy', category: ['Watches']},
  {name: 'Gorilla', jp_names: ['ゴリラ', 'GORILLA'], country: 'Switzerland', category: ['Watches']},
  {name: 'Mercedes-Benz', jp_names: ['メルセデスベンツ', 'MERCEDES-BENZ', 'MERCEDES BENZ'], country: 'Germany', category: ['Watches']},
  {name: 'Maserati', jp_names: ['マセラティ', 'MASERATI'], country: 'Italy', category: ['Watches']},
  {name: 'Porsche Design', jp_names: ['ポルシェデザイン', 'PORSCHE DESIGN'], country: 'Germany', category: ['Watches']},
  {name: 'B-Barrel', jp_names: ['ビーバレル', 'B-BARREL', 'BBARREL'], country: 'Japan', category: ['Watches']},
  {name: 'Shellman', jp_names: ['シェルマン', 'SHELLMAN'], country: 'Japan', category: ['Watches']},
  {name: 'JAM HOME MADE', jp_names: ['ジャムホームメイド', 'JAM HOME MADE', 'JAMHOMEMADE'], country: 'Japan', category: ['Watches']},
  {name: 'Nordgreen', jp_names: ['ノードグリーン', 'NORDGREEN'], country: 'Denmark', category: ['Watches']},
  {name: 'Bentley', jp_names: ['ベントレー', 'BENTLEY'], country: 'Japan', category: ['Watches']},
  {name: 'Orfina', jp_names: ['オルフィナ', 'ORFINA'], country: 'Switzerland', category: ['Watches']},
  {name: 'BAPEX', jp_names: ['ベイペックス', 'BAPEX'], country: 'Japan', parent_brand: 'A Bathing Ape', category: ['Watches']},

  // === Fishing Reels ===
  {name: 'Ryobi', jp_names: ['リョービ', 'RYOBI'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Megabass', jp_names: ['メガバス', 'MEGABASS'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Prox', jp_names: ['プロックス', 'PROX'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'ZPI', jp_names: ['ZPI', 'ジーピーアイ'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Nissin', jp_names: ['宇崎日新', 'ニッシン', 'NISSIN'], country: 'Japan', category: ['Fishing Reels', 'Fishing Rods']},

  {name: 'Abu Garcia', jp_names: ['アブガルシア', 'アブ', 'ABU GARCIA', 'ABU'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Penn', jp_names: ['ペン', 'PENN'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Zebco', jp_names: ['ゼブコ', 'ZEBCO'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Pflueger', jp_names: ['プルーガー', 'プルーフガー', 'PFLUEGER'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Quantum', jp_names: ['クアンタム', 'QUANTUM'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Lew\'s', jp_names: ['ルーズ', 'LEWS', 'LEW\'S'], country: 'United States', category: ['Fishing Reels']},
  {name: '13 Fishing', jp_names: ['サーティーンフィッシング', '13 FISHING', '13FISHING'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Fin-Nor', jp_names: ['フィンノール', 'FIN-NOR', 'FINNOR'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Accurate', jp_names: ['アキュレート', 'ACCURATE'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Avet', jp_names: ['アベット', 'AVET'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Seigler', jp_names: ['セイグラー', 'SEIGLER'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Van Staal', jp_names: ['ヴァンスタール', 'VAN STAAL'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Shakespeare', jp_names: ['シェイクスピア', 'SHAKESPEARE'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Orvis', jp_names: ['オービス', 'ORVIS'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Lamson', jp_names: ['ラムソン', 'LAMSON'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Ross', jp_names: ['ロス', 'ROSS'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Sage', jp_names: ['セージ', 'SAGE'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Redington', jp_names: ['レディントン', 'REDINGTON'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Cortland', jp_names: ['コートランド', 'CORTLAND'], country: 'United States', category: ['Fishing Reels']},
  {name: 'KastKing', jp_names: ['キャストキング', 'KASTKING'], country: 'China', category: ['Fishing Reels']},

  {name: 'Mitchell', jp_names: ['ミッチェル', 'MITCHELL'], country: 'France', category: ['Fishing Reels']},
  {name: 'Hardy', jp_names: ['ハーディ', 'HARDY'], country: 'United Kingdom', category: ['Fishing Reels']},
  {name: 'DAM', jp_names: ['ダム', 'DAM'], country: 'Germany', category: ['Fishing Reels']},
  {name: 'Danielsson', jp_names: ['ダニエルソン', 'DANIELSSON'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Loop', jp_names: ['ループ', 'LOOP'], country: 'Sweden', category: ['Fishing Reels']},
  {name: 'Greys', jp_names: ['グレイズ', 'GREYS'], country: 'United Kingdom', category: ['Fishing Reels']},
  {name: 'Vision', jp_names: ['ビジョン', 'VISION'], country: 'Finland', category: ['Fishing Reels']},

  {name: 'Okuma', jp_names: ['オクマ', 'OKUMA'], country: 'Taiwan', category: ['Fishing Reels']},
  {name: 'Tica', jp_names: ['ティカ', 'TICA'], country: 'Taiwan', category: ['Fishing Reels']},

  {name: 'Heddon', jp_names: ['ヘドン', 'HEDDON'], country: 'United States', category: ['Fishing Reels']},
  {name: 'South Bend', jp_names: ['サウスベンド', 'SOUTH BEND'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Allcock', jp_names: ['オールコック', 'ALLCOCK'], country: 'United Kingdom', category: ['Fishing Reels']},
  {name: 'J.W. Young', jp_names: ['J.W.ヤング', 'JW YOUNG', 'J.W. YOUNG'], country: 'United Kingdom', category: ['Fishing Reels']},
  {name: 'Pezon et Michel', jp_names: ['ペゾンエミシェル', 'PEZON ET MICHEL'], country: 'France', category: ['Fishing Reels']},
  {name: 'Ocean City', jp_names: ['オーシャンシティ', 'OCEAN CITY'], country: 'United States', category: ['Fishing Reels']},
  {name: 'Langley', jp_names: ['ラングレー', 'LANGLEY'], country: 'United States', category: ['Fishing Reels']},

  // === Video Game Consoles & Related ===
  {name: 'Microsoft Xbox', jp_names: ['エックスボックス', 'Xbox', 'XBOX', 'マイクロソフト'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Atari', jp_names: ['アタリ', 'ATARI'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'SNK', jp_names: ['エスエヌケイ', 'SNK', 'ネオジオ', 'NEO GEO', 'NEOGEO'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'NEC', jp_names: ['NEC', 'エヌイーシー', 'PCエンジン', 'PC ENGINE', 'PC-ENGINE'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Panasonic 3DO', jp_names: ['3DO', 'スリーディーオー'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Commodore', jp_names: ['コモドール', 'COMMODORE'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Coleco', jp_names: ['コレコ', 'COLECO', 'COLECOVISION'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Mattel', jp_names: ['マテル', 'MATTEL', 'INTELLIVISION'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Valve', jp_names: ['バルブ', 'VALVE', 'STEAM DECK'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Analogue', jp_names: ['アナログ', 'ANALOGUE'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Retro-Bit', jp_names: ['レトロビット', 'RETRO-BIT', 'RETROBIT'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Hyperkin', jp_names: ['ハイパーキン', 'HYPERKIN'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Anbernic', jp_names: ['アンバーニック', 'ANBERNIC'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Miyoo', jp_names: ['ミヨー', 'MIYOO'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Epoch', jp_names: ['エポック', 'エポック社', 'EPOCH'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Sharp', jp_names: ['シャープ', 'SHARP', 'ツインファミコン'], country: 'Japan', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  // Newly added parent brands for Video Games
  {name: 'Magnavox', jp_names: ['マグナボックス', 'MAGNAVOX'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'AYANEO', jp_names: ['アヤネオ', 'AYANEO'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'GPD', jp_names: ['ジーピーディー', 'GPD'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Retroid', jp_names: ['レトロイド', 'RETROID'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Powkiddy', jp_names: ['パウキッディ', 'POWKIDDY'], country: 'China', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Playdate', jp_names: ['プレイデート', 'PLAYDATE'], country: 'United States', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Evercade', jp_names: ['エバーケード', 'EVERCADE'], country: 'United Kingdom', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // Sub-brands (console models) with parent_brand
  // Nintendo
  {name: 'Famicom', jp_names: ['ファミコン', 'ファミリーコンピュータ', 'FC'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Super Famicom', jp_names: ['スーパーファミコン', 'スーファミ', 'SFC'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Nintendo 64', jp_names: ['ニンテンドー64', 'N64', 'ニンテンドウ64'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Nintendo GameCube', jp_names: ['ゲームキューブ', 'GC', 'GAMECUBE'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Wii', jp_names: ['ウィー', 'Wii'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Wii U', jp_names: ['ウィーユー', 'WiiU'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Nintendo Switch', jp_names: ['ニンテンドースイッチ', 'スイッチ', 'SWITCH'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Game Boy', jp_names: ['ゲームボーイ', 'GB', 'GAMEBOY'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Game Boy Advance', jp_names: ['ゲームボーイアドバンス', 'GBA', 'GAMEBOY ADVANCE'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Nintendo DS', jp_names: ['ニンテンドーDS', 'DS', 'NDS'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Nintendo 3DS', jp_names: ['ニンテンドー3DS', '3DS'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Virtual Boy', jp_names: ['バーチャルボーイ', 'VIRTUAL BOY'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Game & Watch', jp_names: ['ゲームアンドウォッチ', 'ゲーム&ウオッチ', 'GAME & WATCH'], country: 'Japan', parent_brand: 'Nintendo', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // Sony PlayStation
  {name: 'PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PS1', 'PS ONE'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PlayStation 2', jp_names: ['プレイステーション2', 'PS2', 'プレステ2'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PlayStation 3', jp_names: ['プレイステーション3', 'PS3', 'プレステ3'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PlayStation 4', jp_names: ['プレイステーション4', 'PS4', 'プレステ4'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PlayStation 5', jp_names: ['プレイステーション5', 'PS5', 'プレステ5'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PSP', jp_names: ['PSP', 'プレイステーションポータブル', 'PLAYSTATION PORTABLE'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PS Vita', jp_names: ['ヴィータ', 'PSVITA', 'PS VITA', 'プレイステーションヴィータ'], country: 'Japan', parent_brand: 'Sony PlayStation', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // Sega
  {name: 'Mega Drive', jp_names: ['メガドライブ', 'MEGA DRIVE', 'GENESIS', 'ジェネシス'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Sega Saturn', jp_names: ['セガサターン', 'サターン', 'SATURN'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Dreamcast', jp_names: ['ドリームキャスト', 'DREAMCAST', 'DC'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Game Gear', jp_names: ['ゲームギア', 'GAME GEAR'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Sega Mark III', jp_names: ['マークIII', 'セガマークIII', 'MASTER SYSTEM', 'マスターシステム'], country: 'Japan', parent_brand: 'Sega', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // SNK
  {name: 'Neo Geo AES', jp_names: ['ネオジオ', 'ネオジオAES', 'NEO GEO AES', 'NEOGEO'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Neo Geo CD', jp_names: ['ネオジオCD', 'NEO GEO CD'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'Neo Geo Pocket', jp_names: ['ネオジオポケット', 'NEO GEO POCKET'], country: 'Japan', parent_brand: 'SNK', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // NEC
  {name: 'PC Engine', jp_names: ['PCエンジン', 'PC ENGINE', 'TURBOGRAFX-16', 'ターボグラフィックス'], country: 'Japan', parent_brand: 'NEC', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  {name: 'PC-FX', jp_names: ['PC-FX', 'PCFX'], country: 'Japan', parent_brand: 'NEC', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // Bandai
  {name: 'WonderSwan', jp_names: ['ワンダースワン', 'WONDERSWAN', 'WONDER SWAN'], country: 'Japan', parent_brand: 'Bandai', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},

  // Other
  {name: 'Cassette Vision', jp_names: ['カセットビジョン', 'CASSETTE VISION'], country: 'Japan', parent_brand: 'Epoch', category: ['Video Games', 'Video Game Consoles', 'Video Game Accessories', 'Figures']},
  
  // === Fishing Reels: New Parent Brands ===
  {name: 'Tailwalk', jp_names: ['テイルウォーク', 'TAILWALK'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Evergreen', jp_names: ['エバーグリーン', 'EVERGREEN'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Major Craft', jp_names: ['メジャークラフト', 'MAJOR CRAFT'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Studio Ocean Mark', jp_names: ['スタジオオーシャンマーク', 'STUDIO OCEAN MARK', 'SOM'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Smith', jp_names: ['スミス', 'SMITH'], country: 'Japan', category: ['Fishing Reels']},
  {name: 'Valleyhill', jp_names: ['バレーヒル', 'VALLEYHILL'], country: 'Japan', category: ['Fishing Reels', 'Fishing Lures']},
  {name: 'PALMS', jp_names: ['パームス', 'PALMS'], country: 'Japan', category: ['Fishing Reels']},

  // === Fishing Reels: Shimano Spinning ===
  {name: 'Stella', jp_names: ['ステラ', 'STELLA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Twin Power', jp_names: ['ツインパワー', 'TWIN POWER', 'TWINPOWER'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Vanquish', jp_names: ['ヴァンキッシュ', 'バンキッシュ', 'VANQUISH'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Stradic', jp_names: ['ストラディック', 'STRADIC'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Exsence', jp_names: ['エクスセンス', 'EXSENCE'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Sephia', jp_names: ['セフィア', 'SEPHIA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Soare', jp_names: ['ソアレ', 'SOARE'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Vanford', jp_names: ['ヴァンフォード', 'バンフォード', 'VANFORD'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Nasci', jp_names: ['ナスキー', 'NASCI'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Sustain', jp_names: ['サステイン', 'SUSTAIN'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Saragosa', jp_names: ['サラゴサ', 'SARAGOSA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},

  // === Fishing Reels: Shimano Bait ===
  {name: 'Scorpion', jp_names: ['スコーピオン', 'SCORPION'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Metanium', jp_names: ['メタニウム', 'METANIUM'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Antares', jp_names: ['アンタレス', 'ANTARES'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Calcutta', jp_names: ['カルカッタ', 'CALCUTTA'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Bantam', jp_names: ['バンタム', 'BANTAM'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Aldebaran', jp_names: ['アルデバラン', 'ALDEBARAN'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Curado', jp_names: ['クラド', 'CURADO'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'SLX', jp_names: ['SLX', 'エスエルエックス'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},
  {name: 'Tranx', jp_names: ['トランクス', 'TRANX'], country: 'Japan', parent_brand: 'Shimano', category: ['Fishing Reels']},

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
  {name: 'BG', jp_names: ['BG', 'ビージー'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Saltist', jp_names: ['ソルティスト', 'SALTIST'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Legalis', jp_names: ['レガリス', 'LEGALIS'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},
  {name: 'Gekkabijin', jp_names: ['月下美人', 'ゲッカビジン', 'GEKKABIJIN'], country: 'Japan', parent_brand: 'Daiwa', category: ['Fishing Reels']},

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
  
  // === Jewelry (Rings, Necklaces, Bracelets, Earrings) ===
  {name: 'Tiffany & Co.', jp_names: ['ティファニー', 'TIFFANY', 'TIFFANY&CO'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI', 'BULGARI'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Van Cleef & Arpels', jp_names: ['ヴァンクリーフ', 'ヴァンクリーフアンドアーペル', 'VAN CLEEF', 'VCA'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Harry Winston', jp_names: ['ハリーウィンストン', 'HARRY WINSTON'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Louis Vuitton', jp_names: ['ルイヴィトン', 'LOUIS VUITTON', 'LV'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR', 'CHRISTIAN DIOR'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Boucheron', jp_names: ['ブシュロン', 'BOUCHERON'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Chaumet', jp_names: ['ショーメ', 'CHAUMET'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Piaget', jp_names: ['ピアジェ', 'PIAGET'], country: 'Switzerland', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Chopard', jp_names: ['ショパール', 'CHOPARD'], country: 'Switzerland', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Graff', jp_names: ['グラフ', 'GRAFF'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Fred', jp_names: ['フレッド', 'FRED'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Damiani', jp_names: ['ダミアーニ', 'DAMIANI'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Pomellato', jp_names: ['ポメラート', 'POMELLATO'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Mikimoto', jp_names: ['ミキモト', 'MIKIMOTO'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'TASAKI', jp_names: ['タサキ', '田崎真珠', '田崎', 'TASAKI'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Star Jewelry', jp_names: ['スタージュエリー', 'STAR JEWELRY'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: '4°C', jp_names: ['ヨンドシー', '4℃', '4°C', '4度C'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Vendome Aoyama', jp_names: ['ヴァンドーム青山', 'ヴァンドームアオヤマ', 'VENDOME AOYAMA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'AHKAH', jp_names: ['アーカー', 'AHKAH'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'agete', jp_names: ['アガット', 'AGETE'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'ete', jp_names: ['エテ', 'ETE'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Nojess', jp_names: ['ノジェス', 'NOJESS'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Ponte Vecchio', jp_names: ['ポンテヴェキオ', 'PONTE VECCHIO'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'K.uno', jp_names: ['ケイウノ', 'K.UNO', 'KUNO'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'I-PRIMO', jp_names: ['アイプリモ', 'I-PRIMO', 'IPRIMO'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'NIWAKA', jp_names: ['にわか', '俄', 'NIWAKA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Ginza Tanaka', jp_names: ['ギンザタナカ', '田中貴金属', 'GINZA TANAKA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Wako', jp_names: ['和光', 'WAKO'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Kashikey', jp_names: ['カシケイ', 'KASHIKEY'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Hirotaka', jp_names: ['ヒロタカ', 'HIROTAKA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Tsutsumi', jp_names: ['ツツミ', 'ジュエリーツツミ', 'TSUTSUMI'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Estelle', jp_names: ['エステール', 'ESTELLE', 'AS-ME ESTELLE'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Swarovski', jp_names: ['スワロフスキー', 'SWAROVSKI'], country: 'Austria', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Pandora', jp_names: ['パンドラ', 'PANDORA'], country: 'Denmark', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Georg Jensen', jp_names: ['ジョージジェンセン', 'GEORG JENSEN'], country: 'Denmark', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'David Yurman', jp_names: ['デヴィッドユーマン', 'DAVID YURMAN'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'John Hardy', jp_names: ['ジョンハーディ', 'JOHN HARDY'], country: 'Indonesia', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアンウエストウッド', 'VIVIENNE WESTWOOD'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Bottega Veneta', jp_names: ['ボッテガヴェネタ', 'BOTTEGA VENETA'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Mauboussin', jp_names: ['モーブッサン', 'MAUBOUSSIN'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Korloff', jp_names: ['コルロフ', 'KORLOFF'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},

  // === Jewelry (Additional) ===
  {name: 'goro\'s', jp_names: ['ゴローズ', 'GOROS', 'GORO\'S'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'LONE ONES', jp_names: ['ロンワンズ', 'LONE ONES', 'レナードカムホート'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Justin Davis', jp_names: ['ジャスティンデイビス', 'JUSTIN DAVIS'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Royal Order', jp_names: ['ロイヤルオーダー', 'ROYAL ORDER'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Gaboratory', jp_names: ['ガボラトリー', 'ガボール', 'GABORATORY', 'GABOR'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Bill Wall Leather', jp_names: ['ビルウォールレザー', 'BWL', 'BILL WALL LEATHER'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Loree Rodkin', jp_names: ['ローリーロドキン', 'LOREE RODKIN'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Tady & King', jp_names: ['タディアンドキング', 'TADY&KING', 'TADY AND KING'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'First Arrow\'s', jp_names: ['ファーストアローズ', 'FIRST ARROWS', 'FIRST ARROW\'S'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Arizona Freedom', jp_names: ['アリゾナフリーダム', 'ARIZONA FREEDOM'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Wing Rock', jp_names: ['ウイングロック', 'WING ROCK'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Cody Sanderson', jp_names: ['コディサンダーソン', 'CODY SANDERSON'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Stop Light Co.', jp_names: ['ストップライト', 'STOP LIGHT'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Ken Kikuchi', jp_names: ['ケンキクチ', 'KEN KIKUCHI'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Crazy Pig', jp_names: ['クレイジーピッグ', 'CRAZY PIG'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Buccellati', jp_names: ['ブチェラッティ', 'BUCCELLATI'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Roberto Coin', jp_names: ['ロベルトコイン', 'ROBERTO COIN'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Marco Bicego', jp_names: ['マルコビチェゴ', 'MARCO BICEGO'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Pasquale Bruni', jp_names: ['パスクワーレブルーニ', 'PASQUALE BRUNI'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'FOPE', jp_names: ['フォペ', 'FOPE'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Messika', jp_names: ['メシカ', 'MESSIKA'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Dinh Van', jp_names: ['ディンヴァン', 'DINH VAN'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Repossi', jp_names: ['レポシ', 'REPOSSI'], country: 'Monaco', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Les Nereides', jp_names: ['レネレイド', 'レ・ネレイド', 'LES NEREIDES'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Gas Bijoux', jp_names: ['ガスビジュー', 'GAS BIJOUX'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'APM Monaco', jp_names: ['APMモナコ', 'APM MONACO'], country: 'Monaco', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'De Beers', jp_names: ['デビアス', 'DE BEERS'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Stephen Webster', jp_names: ['スティーブンウェブスター', 'STEPHEN WEBSTER'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Shaun Leane', jp_names: ['ショーンリーン', 'SHAUN LEANE'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Monica Vinader', jp_names: ['モニカヴィナダー', 'MONICA VINADER'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Alexander McQueen', jp_names: ['アレキサンダーマックイーン', 'アレクサンダーマックイーン', 'ALEXANDER MCQUEEN'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Garrard', jp_names: ['ガラード', 'GARRARD'], country: 'United Kingdom', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Thomas Sabo', jp_names: ['トーマスサボ', 'THOMAS SABO'], country: 'Germany', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Trollbeads', jp_names: ['トロールビーズ', 'TROLLBEADS'], country: 'Denmark', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Maria Black', jp_names: ['マリアブラック', 'MARIA BLACK'], country: 'Denmark', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Ole Lynggaard Copenhagen', jp_names: ['オーレリンガード', 'OLE LYNGGAARD'], country: 'Denmark', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Wellendorff', jp_names: ['ウェレンドルフ', 'WELLENDORFF'], country: 'Germany', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'UNOde50', jp_names: ['ウノデ50', 'UNODE50', 'UNO DE 50'], country: 'Spain', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'TOUS', jp_names: ['トウス', 'TOUS'], country: 'Spain', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Grosse', jp_names: ['グロッセ', 'GROSSE'], country: 'Germany', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Alexis Bittar', jp_names: ['アレクシスビッター', 'ALEXIS BITTAR'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Kendra Scott', jp_names: ['ケンドラスコット', 'KENDRA SCOTT'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Spinelli Kilcollin', jp_names: ['スピネッリキルコリン', 'SPINELLI KILCOLLIN'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Alex and Ani', jp_names: ['アレックスアンドアニ', 'ALEX AND ANI'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Stephen Dweck', jp_names: ['スティーブンデュエック', 'STEPHEN DWECK'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Miriam Haskell', jp_names: ['ミリアムハスケル', 'MIRIAM HASKELL'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Trifari', jp_names: ['トリファリ', 'TRIFARI'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Monet', jp_names: ['モネ', 'MONET'], country: 'United States', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Abheri', jp_names: ['アベリ', 'ABHERI'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Gimel', jp_names: ['ギメル', 'GIMEL'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Kataoka', jp_names: ['カタオカ', 'KATAOKA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Take-Up', jp_names: ['テイクアップ', 'TAKE-UP', 'TAKEUP'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Pola', jp_names: ['ポーラ', 'POLA'], country: 'Japan', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT', 'YSL', 'イヴサンローラン'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Maison Margiela', jp_names: ['メゾンマルジェラ', 'マルジェラ', 'MAISON MARGIELA', 'MARTIN MARGIELA', 'マルタンマルジェラ'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},
  {name: 'Servane Gaxotte', jp_names: ['セルバンギャゾット', 'SERVANE GAXOTTE'], country: 'France', category: ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Brooches', 'Cufflinks', 'Hair Accessories']},

  // === Handbags & Wallets ===
  {name: 'Louis Vuitton', jp_names: ['ルイヴィトン', 'ルイ・ヴィトン', 'LOUIS VUITTON', 'LV'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Fendi', jp_names: ['フェンディ', 'FENDI'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR', 'クリスチャンディオール', 'CHRISTIAN DIOR'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT', 'YSL', 'イヴサンローラン'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Bottega Veneta', jp_names: ['ボッテガヴェネタ', 'ボッテガ・ヴェネタ', 'BOTTEGA VENETA'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Loewe', jp_names: ['ロエベ', 'LOEWE'], country: 'Spain', category: ['Handbags', 'Wallets']},
  {name: 'Salvatore Ferragamo', jp_names: ['フェラガモ', 'サルヴァトーレフェラガモ', 'SALVATORE FERRAGAMO', 'FERRAGAMO'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Chloe', jp_names: ['クロエ', 'CHLOE'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Givenchy', jp_names: ['ジバンシィ', 'ジバンシー', 'GIVENCHY'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Valentino', jp_names: ['ヴァレンティノ', 'バレンティノ', 'VALENTINO'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Goyard', jp_names: ['ゴヤール', 'GOYARD'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Miu Miu', jp_names: ['ミュウミュウ', 'MIU MIU'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Bvlgari', jp_names: ['ブルガリ', 'BVLGARI', 'BULGARI'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Cartier', jp_names: ['カルティエ', 'CARTIER'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Dunhill', jp_names: ['ダンヒル', 'DUNHILL'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Coach', jp_names: ['コーチ', 'COACH'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Michael Kors', jp_names: ['マイケルコース', 'マイケル・コース', 'MICHAEL KORS'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Kate Spade', jp_names: ['ケイトスペード', 'ケイト・スペード', 'KATE SPADE'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Marc Jacobs', jp_names: ['マークジェイコブス', 'マーク・ジェイコブス', 'MARC JACOBS'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Tory Burch', jp_names: ['トリーバーチ', 'TORY BURCH'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Furla', jp_names: ['フルラ', 'FURLA'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Longchamp', jp_names: ['ロンシャン', 'LONGCHAMP'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'MCM', jp_names: ['エムシーエム', 'MCM'], country: 'Germany', category: ['Handbags', 'Wallets']},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアンウエストウッド', 'ヴィヴィアン・ウエストウッド', 'VIVIENNE WESTWOOD'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Paul Smith', jp_names: ['ポールスミス', 'ポール・スミス', 'PAUL SMITH'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Stella McCartney', jp_names: ['ステラマッカートニー', 'ステラ・マッカートニー', 'STELLA MCCARTNEY'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Jimmy Choo', jp_names: ['ジミーチュウ', 'JIMMY CHOO'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Christian Louboutin', jp_names: ['クリスチャンルブタン', 'ルブタン', 'CHRISTIAN LOUBOUTIN'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Dolce & Gabbana', jp_names: ['ドルチェアンドガッバーナ', 'ドルチェ＆ガッバーナ', 'DOLCE & GABBANA', 'D&G'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'ヴェルサーチェ', 'VERSACE'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Porter', jp_names: ['ポーター', 'PORTER', '吉田カバン', 'YOSHIDA'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE', 'BAO BAO', 'バオバオ'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS', 'CDG'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Tumi', jp_names: ['トゥミ', 'TUMI'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Rimowa', jp_names: ['リモワ', 'RIMOWA'], country: 'Germany', category: ['Handbags', 'Wallets']},
  {name: 'Tod\'s', jp_names: ['トッズ', 'TODS', 'TOD\'S'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Mulberry', jp_names: ['マルベリー', 'MULBERRY'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Alexander McQueen', jp_names: ['アレキサンダーマックイーン', 'ALEXANDER MCQUEEN'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Armani', jp_names: ['アルマーニ', 'ARMANI', 'GIORGIO ARMANI', 'EMPORIO ARMANI'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Delvaux', jp_names: ['デルヴォー', 'DELVAUX'], country: 'Belgium', category: ['Handbags', 'Wallets']},
  {name: 'Valextra', jp_names: ['ヴァレクストラ', 'VALEXTRA'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Il Bisonte', jp_names: ['イルビゾンテ', 'IL BISONTE'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Samantha Thavasa', jp_names: ['サマンサタバサ', 'SAMANTHA THAVASA'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Tsuchiya Kaban', jp_names: ['土屋鞄', '土屋鞄製造所', 'TSUCHIYA KABAN'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Kitamura', jp_names: ['キタムラ', 'KITAMURA'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Dakota', jp_names: ['ダコタ', 'DAKOTA'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'GANZO', jp_names: ['ガンゾ', 'GANZO'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Cocomeister', jp_names: ['ココマイスター', 'COCOMEISTER'], country: 'Japan', category: ['Wallets']},
  {name: 'CYPRIS', jp_names: ['キプリス', 'CYPRIS'], country: 'Japan', category: ['Wallets']},
  {name: 'WILDSWANS', jp_names: ['ワイルドスワンズ', 'WILDSWANS', 'WILD SWANS'], country: 'Japan', category: ['Wallets']},
  {name: 'FUJITAKA', jp_names: ['フジタカ', 'FUJITAKA'], country: 'Japan', category: ['Wallets']},
  {name: 'Sot', jp_names: ['ソット', 'SOT'], country: 'Japan', category: ['Wallets']},
  {name: 'Whitehouse Cox', jp_names: ['ホワイトハウスコックス', 'WHITEHOUSE COX'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Anteprima', jp_names: ['アンテプリマ', 'ANTEPRIMA'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Anya Hindmarch', jp_names: ['アニヤハインドマーチ', 'ANYA HINDMARCH'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Mansur Gavriel', jp_names: ['マンサーガブリエル', 'MANSUR GAVRIEL'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Felisi', jp_names: ['フェリージ', 'FELISI'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Glenroyal', jp_names: ['グレンロイヤル', 'GLENROYAL'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Ettinger', jp_names: ['エッティンガー', 'ETTINGER'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Smythson', jp_names: ['スマイソン', 'SMYTHSON'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'Berluti', jp_names: ['ベルルッティ', 'BERLUTI'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Moynat', jp_names: ['モワナ', 'MOYNAT'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Lanvin', jp_names: ['ランバン', 'LANVIN'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Roger Vivier', jp_names: ['ロジェヴィヴィエ', 'ROGER VIVIER'], country: 'France', category: ['Handbags', 'Wallets']},
  {name: 'Zanellato', jp_names: ['ザネラート', 'ZANELLATO'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Mansou', jp_names: ['万双', 'MANSOU'], country: 'Japan', category: ['Handbags', 'Wallets']},

  {name: 'LeSportsac', jp_names: ['レスポートサック', 'LESPORTSAC'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Rebecca Minkoff', jp_names: ['レベッカミンコフ', 'REBECCA MINKOFF'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'J&M Davidson', jp_names: ['J&Mデヴィッドソン', 'J&M DAVIDSON'], country: 'United Kingdom', category: ['Handbags', 'Wallets']},
  {name: 'BRIEFING', jp_names: ['ブリーフィング', 'BRIEFING'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Orobianco', jp_names: ['オロビアンコ', 'OROBIANCO'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Kipling', jp_names: ['キプリング', 'KIPLING'], country: 'Belgium', category: ['Handbags', 'Wallets']},
  {name: 'Mandarina Duck', jp_names: ['マンダリナダック', 'MANDARINA DUCK'], country: 'Italy', category: ['Handbags', 'Wallets']},
  {name: 'Bally', jp_names: ['バリー', 'BALLY'], country: 'Switzerland', category: ['Handbags', 'Wallets']},
  {name: 'Hunting World', jp_names: ['ハンティングワールド', 'HUNTING WORLD'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Samsonite', jp_names: ['サムソナイト', 'SAMSONITE'], country: 'United States', category: ['Handbags', 'Wallets']},
  {name: 'Master-Piece', jp_names: ['マスターピース', 'MASTER-PIECE', 'MSPC'], country: 'Japan', category: ['Handbags', 'Wallets']},
  {name: 'Montblanc', jp_names: ['モンブラン', 'MONTBLANC', 'MONT BLANC'], country: 'Germany', category: ['Handbags', 'Wallets']},

  // === Clothing ===
  {name: 'Comme des Garcons', jp_names: ['コムデギャルソン', 'COMME DES GARCONS', 'CDG', 'ギャルソン'], country: 'Japan', category: ['Clothing']},
  {name: 'Yohji Yamamoto', jp_names: ['ヨウジヤマモト', 'YOHJI YAMAMOTO', 'Y\'S'], country: 'Japan', category: ['Clothing']},
  {name: 'Issey Miyake', jp_names: ['イッセイミヤケ', 'ISSEY MIYAKE', 'PLEATS PLEASE', 'プリーツプリーズ'], country: 'Japan', category: ['Clothing']},
  {name: 'Undercover', jp_names: ['アンダーカバー', 'UNDERCOVER'], country: 'Japan', category: ['Clothing']},
  {name: 'Sacai', jp_names: ['サカイ', 'SACAI'], country: 'Japan', category: ['Clothing']},
  {name: 'Junya Watanabe', jp_names: ['ジュンヤワタナベ', 'JUNYA WATANABE'], country: 'Japan', category: ['Clothing']},
  {name: 'Kenzo', jp_names: ['ケンゾー', 'KENZO'], country: 'Japan', category: ['Clothing']},
  {name: 'Maison Mihara Yasuhiro', jp_names: ['ミハラヤスヒロ', 'MIHARA YASUHIRO', 'MAISON MIHARA YASUHIRO'], country: 'Japan', category: ['Clothing']},
  {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE', 'アベイシングエイプ'], country: 'Japan', category: ['Clothing']},
  {name: 'Neighborhood', jp_names: ['ネイバーフッド', 'NEIGHBORHOOD', 'NBHD'], country: 'Japan', category: ['Clothing']},
  {name: 'WTAPS', jp_names: ['ダブルタップス', 'WTAPS'], country: 'Japan', category: ['Clothing']},
  {name: 'Visvim', jp_names: ['ビズビム', 'VISVIM'], country: 'Japan', category: ['Clothing']},
  {name: 'Mastermind Japan', jp_names: ['マスターマインドジャパン', 'MASTERMIND JAPAN'], country: 'Japan', category: ['Clothing']},
  {name: 'Evisu', jp_names: ['エヴィス', 'EVISU', 'エビス'], country: 'Japan', category: ['Clothing']},
  {name: 'Hysteric Glamour', jp_names: ['ヒステリックグラマー', 'HYSTERIC GLAMOUR'], country: 'Japan', category: ['Clothing']},
  {name: 'Number Nine', jp_names: ['ナンバーナイン', 'NUMBER (N)INE', 'NUMBER NINE'], country: 'Japan', category: ['Clothing']},
  {name: 'Kapital', jp_names: ['キャピタル', 'KAPITAL'], country: 'Japan', category: ['Clothing']},
  {name: 'Needles', jp_names: ['ニードルス', 'ニードルズ', 'NEEDLES'], country: 'Japan', category: ['Clothing']},
  {name: 'Auralee', jp_names: ['オーラリー', 'AURALEE'], country: 'Japan', category: ['Clothing']},
  {name: 'Comoli', jp_names: ['コモリ', 'COMOLI'], country: 'Japan', category: ['Clothing']},
  {name: 'Engineered Garments', jp_names: ['エンジニアードガーメンツ', 'ENGINEERED GARMENTS'], country: 'United States', category: ['Clothing']},
  {name: 'Moncler', jp_names: ['モンクレール', 'MONCLER'], country: 'France', category: ['Clothing']},
  {name: 'Maison Margiela', jp_names: ['マルジェラ', 'メゾンマルジェラ', 'MAISON MARGIELA', 'MARTIN MARGIELA', 'マルタンマルジェラ'], country: 'France', category: ['Clothing']},
  {name: 'Rick Owens', jp_names: ['リックオウエンス', 'RICK OWENS'], country: 'United States', category: ['Clothing']},
  {name: 'Chrome Hearts', jp_names: ['クロムハーツ', 'CHROME HEARTS'], country: 'United States', category: ['Clothing']},
  {name: 'Louis Vuitton', jp_names: ['ルイヴィトン', 'ルイ・ヴィトン', 'LOUIS VUITTON', 'LV'], country: 'France', category: ['Clothing']},
  {name: 'Chanel', jp_names: ['シャネル', 'CHANEL'], country: 'France', category: ['Clothing']},
  {name: 'Hermes', jp_names: ['エルメス', 'HERMES'], country: 'France', category: ['Clothing']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Clothing']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Clothing']},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France', category: ['Clothing']},
  {name: 'Celine', jp_names: ['セリーヌ', 'CELINE'], country: 'France', category: ['Clothing']},
  {name: 'Saint Laurent', jp_names: ['サンローラン', 'SAINT LAURENT', 'YSL'], country: 'France', category: ['Clothing']},
  {name: 'Dior', jp_names: ['ディオール', 'DIOR'], country: 'France', category: ['Clothing']},
  {name: 'Burberry', jp_names: ['バーバリー', 'BURBERRY'], country: 'United Kingdom', category: ['Clothing']},
  {name: 'Ralph Lauren', jp_names: ['ラルフローレン', 'RALPH LAUREN', 'POLO RALPH LAUREN'], country: 'United States', category: ['Clothing']},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'ヴェルサーチェ', 'VERSACE'], country: 'Italy', category: ['Clothing']},
  {name: 'Dolce & Gabbana', jp_names: ['ドルチェアンドガッバーナ', 'DOLCE & GABBANA', 'D&G'], country: 'Italy', category: ['Clothing']},
  {name: 'Armani', jp_names: ['アルマーニ', 'ARMANI', 'GIORGIO ARMANI', 'EMPORIO ARMANI'], country: 'Italy', category: ['Clothing']},
  {name: 'Vivienne Westwood', jp_names: ['ヴィヴィアンウエストウッド', 'VIVIENNE WESTWOOD'], country: 'United Kingdom', category: ['Clothing']},
  {name: 'Paul Smith', jp_names: ['ポールスミス', 'PAUL SMITH'], country: 'United Kingdom', category: ['Clothing']},
  {name: 'Stone Island', jp_names: ['ストーンアイランド', 'STONE ISLAND'], country: 'Italy', category: ['Clothing']},
  {name: 'CP Company', jp_names: ['シーピーカンパニー', 'CP COMPANY'], country: 'Italy', category: ['Clothing']},
  {name: 'Toga', jp_names: ['トーガ', 'TOGA'], country: 'Japan', category: ['Clothing']},
  {name: 'White Mountaineering', jp_names: ['ホワイトマウンテニアリング', 'WHITE MOUNTAINEERING'], country: 'Japan', category: ['Clothing']},
  {name: 'Kolor', jp_names: ['カラー', 'KOLOR'], country: 'Japan', category: ['Clothing']},
  {name: 'Cav Empt', jp_names: ['シーイー', 'CAV EMPT', 'C.E'], country: 'Japan', category: ['Clothing']},
  {name: 'Studio D Artisan', jp_names: ['ステュディオダルチザン', 'STUDIO D\'ARTISAN'], country: 'Japan', category: ['Clothing']},

  {name: 'Supreme', jp_names: ['シュプリーム', 'SUPREME'], country: 'United States', category: ['Clothing']},
  {name: 'Stussy', jp_names: ['ステューシー', 'STUSSY'], country: 'United States', category: ['Clothing']},
  {name: 'Off-White', jp_names: ['オフホワイト', 'OFF-WHITE', 'OFF WHITE'], country: 'Italy', category: ['Clothing']},
  {name: 'Stone Island', jp_names: ['ストーンアイランド', 'STONE ISLAND'], country: 'Italy', category: ['Clothing']},
  {name: 'The North Face', jp_names: ['ザノースフェイス', 'ノースフェイス', 'THE NORTH FACE', 'TNF'], country: 'United States', category: ['Clothing']},
  {name: 'Patagonia', jp_names: ['パタゴニア', 'PATAGONIA'], country: 'United States', category: ['Clothing']},
  {name: 'Ralph Lauren', jp_names: ['ラルフローレン', 'RALPH LAUREN', 'POLO RALPH LAUREN'], country: 'United States', category: ['Clothing']},
  {name: 'Tommy Hilfiger', jp_names: ['トミーヒルフィガー', 'TOMMY HILFIGER'], country: 'United States', category: ['Clothing']},
  {name: 'Lacoste', jp_names: ['ラコステ', 'LACOSTE'], country: 'France', category: ['Clothing']},
  {name: 'Barbour', jp_names: ['バブアー', 'BARBOUR'], country: 'United Kingdom', category: ['Clothing']},
  {name: 'Canada Goose', jp_names: ['カナダグース', 'CANADA GOOSE'], country: 'Canada', category: ['Clothing']},
  {name: "Arc'teryx", jp_names: ['アークテリクス', 'ARCTERYX', 'ARC\'TERYX'], country: 'Canada', category: ['Clothing']},
  {name: 'Carhartt WIP', jp_names: ['カーハート', 'CARHARTT', 'CARHARTT WIP'], country: 'United States', category: ['Clothing']},

  // === Shoes ===
  {name: 'Nike', jp_names: ['ナイキ', 'NIKE'], country: 'United States', category: ['Shoes']},
  {name: 'Adidas', jp_names: ['アディダス', 'ADIDAS'], country: 'Germany', category: ['Shoes']},
  {name: 'New Balance', jp_names: ['ニューバランス', 'NEW BALANCE', 'NB'], country: 'United States', category: ['Shoes']},
  {name: 'Asics', jp_names: ['アシックス', 'ASICS'], country: 'Japan', category: ['Shoes']},
  {name: 'Converse', jp_names: ['コンバース', 'CONVERSE'], country: 'United States', category: ['Shoes']},
  {name: 'Puma', jp_names: ['プーマ', 'PUMA'], country: 'Germany', category: ['Shoes']},
  {name: 'Vans', jp_names: ['バンズ', 'VANS'], country: 'United States', category: ['Shoes']},
  {name: 'Onitsuka Tiger', jp_names: ['オニツカタイガー', 'ONITSUKA TIGER'], country: 'Japan', category: ['Shoes']},
  {name: 'Reebok', jp_names: ['リーボック', 'REEBOK'], country: 'United States', category: ['Shoes']},
  {name: 'Alden', jp_names: ['オールデン', 'ALDEN'], country: 'United States', category: ['Shoes']},
  {name: 'Church\'s', jp_names: ['チャーチ', 'CHURCHS', 'CHURCH\'S'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Crockett & Jones', jp_names: ['クロケットアンドジョーンズ', 'クロケット&ジョーンズ', 'CROCKETT & JONES'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Tricker\'s', jp_names: ['トリッカーズ', 'TRICKERS', 'TRICKER\'S'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Allen Edmonds', jp_names: ['アレンエドモンズ', 'ALLEN EDMONDS'], country: 'United States', category: ['Shoes']},
  {name: 'John Lobb', jp_names: ['ジョンロブ', 'JOHN LOBB'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Edward Green', jp_names: ['エドワードグリーン', 'EDWARD GREEN'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Red Wing', jp_names: ['レッドウィング', 'RED WING', 'レッドウイング'], country: 'United States', category: ['Shoes']},
  {name: 'Timberland', jp_names: ['ティンバーランド', 'TIMBERLAND'], country: 'United States', category: ['Shoes']},
  {name: 'Dr. Martens', jp_names: ['ドクターマーチン', 'DR. MARTENS', 'DR MARTENS'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Regal', jp_names: ['リーガル', 'REGAL'], country: 'Japan', category: ['Shoes']},
  {name: 'Scotch Grain', jp_names: ['スコッチグレイン', 'SCOTCH GRAIN'], country: 'Japan', category: ['Shoes']},
  {name: 'UGG', jp_names: ['アグ', 'UGG'], country: 'United States', category: ['Shoes']},
  {name: 'Birkenstock', jp_names: ['ビルケンシュトック', 'BIRKENSTOCK'], country: 'Germany', category: ['Shoes']},
  {name: 'Salvatore Ferragamo', jp_names: ['フェラガモ', 'SALVATORE FERRAGAMO', 'FERRAGAMO'], country: 'Italy', category: ['Shoes']},
  {name: 'Christian Louboutin', jp_names: ['クリスチャンルブタン', 'ルブタン', 'CHRISTIAN LOUBOUTIN'], country: 'France', category: ['Shoes']},
  {name: 'Jimmy Choo', jp_names: ['ジミーチュウ', 'JIMMY CHOO'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Gucci', jp_names: ['グッチ', 'GUCCI'], country: 'Italy', category: ['Shoes']},
  {name: 'Prada', jp_names: ['プラダ', 'PRADA'], country: 'Italy', category: ['Shoes']},
  {name: 'Louis Vuitton', jp_names: ['ルイヴィトン', 'ルイ・ヴィトン', 'LOUIS VUITTON'], country: 'France', category: ['Shoes']},
  {name: 'Balenciaga', jp_names: ['バレンシアガ', 'BALENCIAGA'], country: 'France', category: ['Shoes']},
  {name: 'Viberg', jp_names: ['ヴァイバーグ', 'VIBERG'], country: 'Canada', category: ['Shoes']},
  {name: 'White\'s Boots', jp_names: ['ホワイツブーツ', 'WHITES BOOTS', 'WHITE\'S BOOTS'], country: 'United States', category: ['Shoes']},
  {name: 'Chippewa', jp_names: ['チペワ', 'CHIPPEWA'], country: 'United States', category: ['Shoes']},
  {name: 'Wolverine', jp_names: ['ウルヴァリン', 'WOLVERINE'], country: 'United States', category: ['Shoes']},
  {name: 'Danner', jp_names: ['ダナー', 'DANNER'], country: 'United States', category: ['Shoes']},
  {name: 'Paraboot', jp_names: ['パラブーツ', 'PARABOOT'], country: 'France', category: ['Shoes']},
  {name: 'Santoni', jp_names: ['サントーニ', 'SANTONI'], country: 'Italy', category: ['Shoes']},
  {name: 'Carmina', jp_names: ['カルミナ', 'CARMINA'], country: 'Spain', category: ['Shoes']},
  {name: 'Jalan Sriwijaya', jp_names: ['ジャランスリウァヤ', 'ジャランスリワヤ', 'JALAN SRIWIJAYA'], country: 'Indonesia', category: ['Shoes']},
  {name: 'Saucony', jp_names: ['サッカニー', 'SAUCONY'], country: 'United States', category: ['Shoes']},
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan', category: ['Shoes']},
  {name: 'Hoka', jp_names: ['ホカ', 'HOKA', 'HOKA ONE ONE'], country: 'United States', category: ['Shoes']},
  {name: 'Salomon', jp_names: ['サロモン', 'SALOMON'], country: 'France', category: ['Shoes']},

  {name: 'Nike', jp_names: ['ナイキ', 'NIKE'], country: 'United States', category: ['Shoes']},
  {name: 'Air Jordan', jp_names: ['エアジョーダン', 'AIR JORDAN', 'JORDAN'], country: 'United States', parent_brand: 'Nike', category: ['Shoes']},
  {name: 'Adidas', jp_names: ['アディダス', 'ADIDAS'], country: 'Germany', category: ['Shoes']},
  {name: 'New Balance', jp_names: ['ニューバランス', 'NEW BALANCE', 'NB'], country: 'United States', category: ['Shoes']},
  {name: 'Converse', jp_names: ['コンバース', 'CONVERSE'], country: 'United States', category: ['Shoes']},
  {name: 'Vans', jp_names: ['バンズ', 'ヴァンズ', 'VANS'], country: 'United States', category: ['Shoes']},
  {name: 'ASICS', jp_names: ['アシックス', 'ASICS'], country: 'Japan', category: ['Shoes']},
  {name: 'Onitsuka Tiger', jp_names: ['オニツカタイガー', 'ONITSUKA TIGER'], country: 'Japan', parent_brand: 'ASICS', category: ['Shoes']},
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan', category: ['Shoes']},
  {name: 'Reebok', jp_names: ['リーボック', 'REEBOK'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'PUMA', jp_names: ['プーマ', 'PUMA'], country: 'Germany', category: ['Shoes']},
  {name: 'Salomon', jp_names: ['サロモン', 'SALOMON'], country: 'France', category: ['Shoes']},
  {name: 'Timberland', jp_names: ['ティンバーランド', 'TIMBERLAND'], country: 'United States', category: ['Shoes']},
  {name: 'Dr. Martens', jp_names: ['ドクターマーチン', 'DR. MARTENS', 'DR MARTENS'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Clarks', jp_names: ['クラークス', 'CLARKS'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'Paraboot', jp_names: ['パラブーツ', 'PARABOOT'], country: 'France', category: ['Shoes']},
  {name: 'Red Wing', jp_names: ['レッドウィング', 'RED WING', 'REDWING'], country: 'United States', category: ['Shoes']},
  {name: 'Allen Edmonds', jp_names: ['アレンエドモンズ', 'ALLEN EDMONDS'], country: 'United States', category: ['Shoes']},
  {name: 'Alden', jp_names: ['オールデン', 'ALDEN'], country: 'United States', category: ['Shoes']},
  {name: "Church's", jp_names: ['チャーチ', 'CHURCHS', 'CHURCH\'S'], country: 'United Kingdom', category: ['Shoes']},
  {name: 'HOKA', jp_names: ['ホカ', 'ホカオネオネ', 'HOKA', 'HOKA ONE ONE'], country: 'France', category: ['Shoes']},
  {name: 'Saucony', jp_names: ['サッカニー', 'SAUCONY'], country: 'United States', category: ['Shoes']},
  {name: 'Diadora', jp_names: ['ディアドラ', 'DIADORA'], country: 'Italy', category: ['Shoes']},
  {name: 'Birkenstock', jp_names: ['ビルケンシュトック', 'BIRKENSTOCK'], country: 'Germany', category: ['Shoes']},
  {name: 'KEEN', jp_names: ['キーン', 'KEEN'], country: 'United States', category: ['Shoes']},
  {name: 'Brooks', jp_names: ['ブルックス', 'BROOKS'], country: 'United States', category: ['Shoes']},
  {name: 'Merrell', jp_names: ['メレル', 'MERRELL'], country: 'United States', category: ['Shoes']},

  // === Electronics (Audio & Appliances) ===
  // Japanese Audio
  {name: 'Sony', jp_names: ['ソニー', 'SONY'], country: 'Japan', category: ['Electronics']},
  {name: 'Denon', jp_names: ['デノン', 'デンオン', 'DENON'], country: 'Japan', category: ['Electronics']},
  {name: 'Marantz', jp_names: ['マランツ', 'MARANTZ'], country: 'Japan', category: ['Electronics']},
  {name: 'Yamaha', jp_names: ['ヤマハ', 'YAMAHA'], country: 'Japan', category: ['Electronics']},
  {name: 'TEAC', jp_names: ['ティアック', 'TEAC'], country: 'Japan', category: ['Electronics']},
  {name: 'Esoteric', jp_names: ['エソテリック', 'ESOTERIC'], country: 'Japan', category: ['Electronics']},
  {name: 'Luxman', jp_names: ['ラックスマン', 'ラックス', 'LUXMAN'], country: 'Japan', category: ['Electronics']},
  {name: 'Accuphase', jp_names: ['アキュフェーズ', 'ACCUPHASE'], country: 'Japan', category: ['Electronics']},
  {name: 'Onkyo', jp_names: ['オンキヨー', 'オンキョー', 'ONKYO'], country: 'Japan', category: ['Electronics']},
  {name: 'Pioneer', jp_names: ['パイオニア', 'PIONEER'], country: 'Japan', category: ['Electronics']},
  {name: 'Kenwood', jp_names: ['ケンウッド', 'KENWOOD'], country: 'Japan', category: ['Electronics']},
  {name: 'JVC', jp_names: ['ビクター', 'JVC', 'JVC VICTOR'], country: 'Japan', category: ['Electronics']},
  {name: 'Technics', jp_names: ['テクニクス', 'TECHNICS'], country: 'Japan', category: ['Electronics']},
  {name: 'Nakamichi', jp_names: ['ナカミチ', 'NAKAMICHI'], country: 'Japan', category: ['Electronics']},
  {name: 'Sansui', jp_names: ['サンスイ', 'SANSUI', '山水'], country: 'Japan', category: ['Electronics']},
  {name: 'STAX', jp_names: ['スタックス', 'STAX'], country: 'Japan', category: ['Electronics']},
  {name: 'Fostex', jp_names: ['フォステクス', 'FOSTEX'], country: 'Japan', category: ['Electronics']},
  {name: 'Audio-Technica', jp_names: ['オーディオテクニカ', 'AUDIO-TECHNICA', 'AUDIO TECHNICA'], country: 'Japan', category: ['Electronics']},
  {name: 'Diatone', jp_names: ['ダイアトーン', 'DIATONE'], country: 'Japan', category: ['Electronics']},
  {name: 'TAD', jp_names: ['ティーエーディー', 'TAD'], country: 'Japan', category: ['Electronics']},
  {name: 'Final', jp_names: ['ファイナル', 'FINAL'], country: 'Japan', category: ['Electronics']},
  // Overseas High-End Audio
  {name: 'McIntosh', jp_names: ['マッキントッシュ', 'MCINTOSH'], country: 'United States', category: ['Electronics']},
  {name: 'Mark Levinson', jp_names: ['マークレビンソン', 'MARK LEVINSON'], country: 'United States', category: ['Electronics']},
  {name: 'Bowers & Wilkins', jp_names: ['B&W', 'ビーアンドダブリュー', 'BOWERS & WILKINS', 'B&W'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'Krell', jp_names: ['クレル', 'KRELL'], country: 'United States', category: ['Electronics']},
  {name: 'JBL', jp_names: ['ジェービーエル', 'JBL'], country: 'United States', category: ['Electronics']},
  {name: 'Tannoy', jp_names: ['タノイ', 'TANNOY'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'KEF', jp_names: ['ケフ', 'KEF'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'DALI', jp_names: ['ダリ', 'DALI'], country: 'Denmark', category: ['Electronics']},
  {name: 'Dynaudio', jp_names: ['ディナウディオ', 'DYNAUDIO'], country: 'Denmark', category: ['Electronics']},
  {name: 'Linn', jp_names: ['リン', 'LINN'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'Bang & Olufsen', jp_names: ['バングアンドオルフセン', 'B&O', 'BANG & OLUFSEN'], country: 'Denmark', category: ['Electronics']},
  {name: 'Pass Labs', jp_names: ['パスラボ', 'PASS LABS'], country: 'United States', category: ['Electronics']},
  {name: 'Focal', jp_names: ['フォーカル', 'FOCAL'], country: 'France', category: ['Electronics']},
  {name: 'Harbeth', jp_names: ['ハーベス', 'HARBETH'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'Sonus Faber', jp_names: ['ソナスファベール', 'SONUS FABER'], country: 'Italy', category: ['Electronics']},
  // Headphones Specialist
  {name: 'Sennheiser', jp_names: ['ゼンハイザー', 'SENNHEISER'], country: 'Germany', category: ['Electronics']},
  {name: 'AKG', jp_names: ['エーケージー', 'AKG', 'アーカーゲー'], country: 'Austria', category: ['Electronics']},
  {name: 'Beyerdynamic', jp_names: ['ベイヤーダイナミック', 'BEYERDYNAMIC'], country: 'Germany', category: ['Electronics']},
  {name: 'Shure', jp_names: ['シュア', 'SHURE'], country: 'United States', category: ['Electronics']},
  {name: 'Campfire Audio', jp_names: ['キャンプファイヤーオーディオ', 'CAMPFIRE AUDIO'], country: 'United States', category: ['Electronics']},
  {name: 'Hifiman', jp_names: ['ハイファイマン', 'HIFIMAN'], country: 'China', category: ['Electronics']},
  {name: 'Audeze', jp_names: ['オーデジー', 'AUDEZE'], country: 'United States', category: ['Electronics']},
  {name: 'Grado', jp_names: ['グラド', 'GRADO'], country: 'United States', category: ['Electronics']},
  {name: 'Bose', jp_names: ['ボーズ', 'BOSE'], country: 'United States', category: ['Electronics']},
  {name: 'Beats', jp_names: ['ビーツ', 'BEATS'], country: 'United States', category: ['Electronics']},
  {name: 'Meze Audio', jp_names: ['メゼオーディオ', 'MEZE', 'MEZE AUDIO'], country: 'Romania', category: ['Electronics']},
  // Portable Audio
  {name: 'Astell&Kern', jp_names: ['アステルアンドケルン', 'ASTELL&KERN', 'A&K'], country: 'South Korea', category: ['Electronics']},
  {name: 'FiiO', jp_names: ['フィーオ', 'FIIO'], country: 'China', category: ['Electronics']},
  {name: 'Shanling', jp_names: ['シャンリン', 'SHANLING'], country: 'China', category: ['Electronics']},
  {name: 'iBasso', jp_names: ['アイバッソ', 'IBASSO'], country: 'China', category: ['Electronics']},
  {name: 'Lotoo', jp_names: ['ロトゥー', 'LOTOO'], country: 'China', category: ['Electronics']},
  {name: 'Cayin', jp_names: ['カイン', 'CAYIN'], country: 'China', category: ['Electronics']},
  // Appliances
  {name: 'Panasonic', jp_names: ['パナソニック', 'PANASONIC'], country: 'Japan', category: ['Electronics']},
  {name: 'Sharp', jp_names: ['シャープ', 'SHARP'], country: 'Japan', category: ['Electronics']},
  {name: 'Toshiba', jp_names: ['東芝', 'TOSHIBA'], country: 'Japan', category: ['Electronics']},
  {name: 'Hitachi', jp_names: ['日立', 'HITACHI'], country: 'Japan', category: ['Electronics']},
  {name: 'Mitsubishi Electric', jp_names: ['三菱電機', 'MITSUBISHI'], country: 'Japan', category: ['Electronics']},
  {name: 'Zojirushi', jp_names: ['象印', 'ZOJIRUSHI'], country: 'Japan', category: ['Electronics']},
  {name: 'Tiger', jp_names: ['タイガー', 'TIGER'], country: 'Japan', category: ['Electronics']},
  {name: 'BALMUDA', jp_names: ['バルミューダ', 'BALMUDA'], country: 'Japan', category: ['Electronics']},
  {name: 'Dyson', jp_names: ['ダイソン', 'DYSON'], country: 'United Kingdom', category: ['Electronics']},
  {name: 'iRobot', jp_names: ['アイロボット', 'IROBOT', 'ルンバ', 'ROOMBA'], country: 'United States', category: ['Electronics']},
  {name: 'Daikin', jp_names: ['ダイキン', 'DAIKIN'], country: 'Japan', category: ['Electronics']},
  {name: 'Iris Ohyama', jp_names: ['アイリスオーヤマ', 'IRIS OHYAMA'], country: 'Japan', category: ['Electronics']},
  {name: 'ReFa', jp_names: ['リファ', 'REFA'], country: 'Japan', category: ['Electronics']},
  {name: 'YA-MAN', jp_names: ['ヤーマン', 'YA-MAN', 'YAMAN'], country: 'Japan', category: ['Electronics']},
  {name: 'Aiwa', jp_names: ['アイワ', 'AIWA'], country: 'Japan', category: ['Electronics']},
  {name: 'Epson', jp_names: ['エプソン', 'EPSON'], country: 'Japan', category: ['Electronics']},
  {name: 'BenQ', jp_names: ['ベンキュー', 'BENQ'], country: 'Taiwan', category: ['Electronics']},
  {name: 'Anker', jp_names: ['アンカー', 'ANKER'], country: 'China', category: ['Electronics']},
  {name: 'Elecom', jp_names: ['エレコム', 'ELECOM'], country: 'Japan', category: ['Electronics']},
  {name: 'Buffalo', jp_names: ['バッファロー', 'BUFFALO'], country: 'Japan', category: ['Electronics']},
  {name: 'Vermicular', jp_names: ['バーミキュラ', 'VERMICULAR'], country: 'Japan', category: ['Electronics']},
  {name: 'De\'Longhi', jp_names: ['デロンギ', 'DELONGHI', 'DE\'LONGHI'], country: 'Italy', category: ['Electronics']},
  {name: 'Philips', jp_names: ['フィリップス', 'PHILIPS'], country: 'Netherlands', category: ['Electronics']},
  {name: 'LG', jp_names: ['エルジー', 'LG'], country: 'South Korea', category: ['Electronics']},
  {name: 'Samsung', jp_names: ['サムスン', 'SAMSUNG'], country: 'South Korea', category: ['Electronics']},

  // === Golf (Club Makers) ===
  {name: 'Titleist', jp_names: ['タイトリスト', 'TITLEIST'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'TaylorMade', jp_names: ['テーラーメイド', 'TAYLORMADE'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Callaway', jp_names: ['キャロウェイ', 'CALLAWAY'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Ping', jp_names: ['ピン', 'PING'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Mizuno', jp_names: ['ミズノ', 'MIZUNO'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Bridgestone', jp_names: ['ブリヂストン', 'ブリジストン', 'BRIDGESTONE'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Srixon', jp_names: ['スリクソン', 'SRIXON', 'ダンロップ', 'DUNLOP'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'XXIO', jp_names: ['ゼクシオ', 'XXIO'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Honma', jp_names: ['本間', 'ホンマ', 'HONMA', '本間ゴルフ'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'PRGR', jp_names: ['プロギア', 'PRGR'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Fourteen', jp_names: ['フォーティーン', 'FOURTEEN'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Yamaha', jp_names: ['ヤマハ', 'YAMAHA'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Maruman', jp_names: ['マルマン', 'MARUMAN'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Majesty', jp_names: ['マジェスティ', 'MAJESTY'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Onoff', jp_names: ['オノフ', 'ONOFF'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Ryoma', jp_names: ['リョーマ', 'RYOMA'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Epon', jp_names: ['エポン', 'EPON'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'JBEAM', jp_names: ['ジェイビーム', 'JBEAM', 'J BEAM'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Miura', jp_names: ['三浦技研', 'ミウラ', 'MIURA'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'George Spirits', jp_names: ['ジョージスピリッツ', 'GEORGE SPIRITS'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Justick', jp_names: ['ジャスティック', 'JUSTICK'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Kamui', jp_names: ['カムイ', 'KAMUI'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Crazy', jp_names: ['クレイジー', 'CRAZY'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Roddio', jp_names: ['ロッディオ', 'RODDIO'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Kasco', jp_names: ['キャスコ', 'KASCO'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Grand Prix', jp_names: ['グランプリ', 'GRAND PRIX'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Cobra', jp_names: ['コブラ', 'COBRA'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Cleveland', jp_names: ['クリーブランド', 'CLEVELAND'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Scotty Cameron', jp_names: ['スコッティキャメロン', 'スコッティ・キャメロン', 'SCOTTY CAMERON'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Odyssey', jp_names: ['オデッセイ', 'ODYSSEY'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Bettinardi', jp_names: ['ベティナルディ', 'BETTINARDI'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'PXG', jp_names: ['ピーエックスジー', 'PXG'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Vokey', jp_names: ['ボーケイ', 'VOKEY'], country: 'United States', parent_brand: 'Titleist', category: ['Golf', 'Golf Heads']},
  // Golf Shaft Makers
  {name: 'Fujikura', jp_names: ['フジクラ', 'FUJIKURA'], country: 'Japan', category: ['Golf']},
  {name: 'Graphite Design', jp_names: ['グラファイトデザイン', 'GRAPHITE DESIGN'], country: 'Japan', category: ['Golf']},
  {name: 'Mitsubishi Chemical', jp_names: ['三菱ケミカル', 'MITSUBISHI', 'MITSUBISHI CHEMICAL'], country: 'Japan', category: ['Golf']},
  {name: 'Nippon Shaft', jp_names: ['日本シャフト', 'NIPPON SHAFT', 'NSプロ', 'NS PRO'], country: 'Japan', category: ['Golf']},
  {name: 'True Temper', jp_names: ['トゥルーテンパー', 'TRUE TEMPER'], country: 'United States', category: ['Golf']},
  {name: 'UST Mamiya', jp_names: ['マミヤ', 'UST MAMIYA', 'UST'], country: 'Japan', category: ['Golf']},
  {name: 'KBS', jp_names: ['KBS', 'ケービーエス'], country: 'United States', category: ['Golf']},
  {name: 'Aerotech', jp_names: ['エアロテック', 'AEROTECH'], country: 'United States', category: ['Golf']},
  // Golf Other Brands
  {name: 'Globeride', jp_names: ['グローブライド', 'GLOBERIDE', 'ダイワ', 'DAIWA'], country: 'Japan', category: ['Golf']},
  {name: 'Zodia', jp_names: ['ゾディア', 'ZODIA'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Protoconcept', jp_names: ['プロトコンセプト', 'PROTOCONCEPT'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Geotech', jp_names: ['ジオテック', 'GEOTECH'], country: 'Japan', category: ['Golf', 'Golf Heads']},
  {name: 'Piretti', jp_names: ['ピレッティ', 'PIRETTI'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Toulon', jp_names: ['トゥーロン', 'TOULON'], country: 'United States', parent_brand: 'Odyssey', category: ['Golf', 'Golf Heads']},
  {name: 'Wilson Staff', jp_names: ['ウィルソンスタッフ', 'ウイルソンスタッフ', 'WILSON STAFF', 'WILSON'], country: 'United States', category: ['Golf', 'Golf Heads']},
  {name: 'Yonex', jp_names: ['ヨネックス', 'YONEX'], country: 'Japan', category: ['Golf', 'Golf Heads']},

  // === Guitars ===
  {name: 'Fender', jp_names: ['フェンダー', 'FENDER'], country: 'United States', category: ['Guitars', 'Effects & Amps']},
  {name: 'Gibson', jp_names: ['ギブソン', 'GIBSON'], country: 'United States', category: ['Guitars']},
  {name: 'Ibanez', jp_names: ['アイバニーズ', 'IBANEZ'], country: 'Japan', category: ['Guitars', 'Effects & Amps']},
  {name: 'ESP', jp_names: ['イーエスピー', 'ESP'], country: 'Japan', category: ['Guitars']},
  {name: 'Martin', jp_names: ['マーティン', 'マーチン', 'MARTIN'], country: 'United States', category: ['Guitars']},
  {name: 'Taylor', jp_names: ['テイラー', 'TAYLOR'], country: 'United States', category: ['Guitars']},
  {name: 'PRS', jp_names: ['ポールリードスミス', 'PRS', 'PAUL REED SMITH'], country: 'United States', category: ['Guitars']},
  {name: 'Rickenbacker', jp_names: ['リッケンバッカー', 'RICKENBACKER'], country: 'United States', category: ['Guitars']},
  {name: 'Gretsch', jp_names: ['グレッチ', 'GRETSCH'], country: 'United States', category: ['Guitars']},
  {name: 'Epiphone', jp_names: ['エピフォン', 'EPIPHONE'], country: 'United States', parent_brand: 'Gibson', category: ['Guitars']},
  {name: 'Squier', jp_names: ['スクワイヤー', 'SQUIER'], country: 'United States', parent_brand: 'Fender', category: ['Guitars']},
  {name: 'Music Man', jp_names: ['ミュージックマン', 'MUSIC MAN', 'ERNIE BALL'], country: 'United States', category: ['Guitars']},
  {name: 'Jackson', jp_names: ['ジャクソン', 'JACKSON'], country: 'United States', category: ['Guitars']},
  {name: 'Charvel', jp_names: ['シャーベル', 'CHARVEL'], country: 'United States', category: ['Guitars']},
  {name: 'Tokai', jp_names: ['トーカイ', 'TOKAI', '東海楽器'], country: 'Japan', category: ['Guitars']},
  {name: 'Fujigen', jp_names: ['フジゲン', 'FUJIGEN', 'FGN'], country: 'Japan', category: ['Guitars']},
  {name: 'Greco', jp_names: ['グレコ', 'GRECO'], country: 'Japan', category: ['Guitars']},
  {name: 'Fernandes', jp_names: ['フェルナンデス', 'FERNANDES'], country: 'Japan', category: ['Guitars']},
  {name: 'Takamine', jp_names: ['タカミネ', 'TAKAMINE'], country: 'Japan', category: ['Guitars']},
  {name: 'Aria', jp_names: ['アリア', 'ARIA'], country: 'Japan', category: ['Guitars']},
  {name: 'Schecter', jp_names: ['シェクター', 'SCHECTER'], country: 'United States', category: ['Guitars']},
  {name: 'Suhr', jp_names: ['サー', 'SUHR'], country: 'United States', category: ['Guitars']},
  {name: 'Tom Anderson', jp_names: ['トムアンダーソン', 'TOM ANDERSON'], country: 'United States', category: ['Guitars']},
  {name: 'Sadowsky', jp_names: ['サドウスキー', 'SADOWSKY'], country: 'United States', category: ['Guitars']},
  {name: 'Lakland', jp_names: ['レイクランド', 'LAKLAND'], country: 'United States', category: ['Guitars']},

  // === Effects & Amps ===
  {name: 'Boss', jp_names: ['ボス', 'BOSS'], country: 'Japan', parent_brand: 'Roland', category: ['Effects & Amps']},
  {name: 'Maxon', jp_names: ['マクソン', 'MAXON'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Providence', jp_names: ['プロビデンス', 'PROVIDENCE'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Free The Tone', jp_names: ['フリーザトーン', 'FREE THE TONE'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Guyatone', jp_names: ['グヤトーン', 'GUYATONE'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'One Control', jp_names: ['ワンコントロール', 'ONE CONTROL'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Vemuram', jp_names: ['ヴェムラム', 'VEMURAM'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Arion', jp_names: ['アリオン', 'ARION'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Strymon', jp_names: ['ストライモン', 'STRYMON'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Eventide', jp_names: ['イーブンタイド', 'EVENTIDE'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Electro-Harmonix', jp_names: ['エレクトロハーモニクス', 'ELECTRO-HARMONIX', 'EHX'], country: 'United States', category: ['Effects & Amps']},
  {name: 'MXR', jp_names: ['エムエックスアール', 'MXR'], country: 'United States', category: ['Effects & Amps']},
  {name: 'TC Electronic', jp_names: ['ティーシーエレクトロニック', 'TC ELECTRONIC'], country: 'Denmark', category: ['Effects & Amps']},
  {name: 'JHS Pedals', jp_names: ['ジェイエイチエス', 'JHS', 'JHS PEDALS'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Walrus Audio', jp_names: ['ウォルラスオーディオ', 'WALRUS AUDIO'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Xotic', jp_names: ['エキゾティック', 'XOTIC'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Fulltone', jp_names: ['フルトーン', 'FULLTONE'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Mooer', jp_names: ['ムーアー', 'MOOER'], country: 'China', category: ['Effects & Amps']},
  {name: 'Zoom', jp_names: ['ズーム', 'ZOOM'], country: 'Japan', category: ['Effects & Amps']},
  {name: 'Line 6', jp_names: ['ライン6', 'LINE 6', 'LINE6'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Marshall', jp_names: ['マーシャル', 'MARSHALL'], country: 'United Kingdom', category: ['Effects & Amps']},
  {name: 'Vox', jp_names: ['ヴォックス', 'VOX'], country: 'United Kingdom', category: ['Effects & Amps']},
  {name: 'Mesa Boogie', jp_names: ['メサブギー', 'MESA BOOGIE', 'MESA'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Kemper', jp_names: ['ケンパー', 'KEMPER'], country: 'Germany', category: ['Effects & Amps']},
  {name: 'Fractal Audio', jp_names: ['フラクタルオーディオ', 'FRACTAL AUDIO', 'FRACTAL'], country: 'United States', category: ['Effects & Amps']},
  {name: 'Neural DSP', jp_names: ['ニューラルDSP', 'NEURAL DSP'], country: 'Finland', category: ['Effects & Amps']},
  {name: 'Darkglass', jp_names: ['ダークグラス', 'DARKGLASS'], country: 'Finland', category: ['Effects & Amps']},
  {name: 'Orange', jp_names: ['オレンジ', 'ORANGE'], country: 'United Kingdom', category: ['Effects & Amps']},
  {name: 'Blackstar', jp_names: ['ブラックスター', 'BLACKSTAR'], country: 'United Kingdom', category: ['Effects & Amps']},

  // === Synths & Digital ===
  {name: 'Yamaha', jp_names: ['ヤマハ', 'YAMAHA'], country: 'Japan', category: ['Guitars', 'Synths & Digital', 'Musical Instruments']},
  {name: 'Roland', jp_names: ['ローランド', 'ROLAND'], country: 'Japan', category: ['Synths & Digital', 'Effects & Amps']},
  {name: 'Korg', jp_names: ['コルグ', 'KORG'], country: 'Japan', category: ['Synths & Digital']},
  {name: 'Casio', jp_names: ['カシオ', 'CASIO'], country: 'Japan', category: ['Synths & Digital']},
  {name: 'Akai', jp_names: ['アカイ', 'AKAI', 'AKAI PROFESSIONAL'], country: 'Japan', category: ['Synths & Digital']},
  {name: 'Moog', jp_names: ['モーグ', 'MOOG'], country: 'United States', category: ['Synths & Digital']},

  // === Musical Instruments (ドラム・管楽器) ===
  {name: 'Selmer', jp_names: ['セルマー', 'SELMER'], country: 'France', category: ['Musical Instruments']},
  {name: 'Yanagisawa', jp_names: ['ヤナギサワ', '柳澤', 'YANAGISAWA'], country: 'Japan', category: ['Musical Instruments']},
  {name: 'Pearl', jp_names: ['パール', 'PEARL'], country: 'Japan', category: ['Musical Instruments']},
  {name: 'Tama', jp_names: ['タマ', 'TAMA'], country: 'Japan', category: ['Musical Instruments']},
  {name: 'Zildjian', jp_names: ['ジルジャン', 'ZILDJIAN'], country: 'United States', category: ['Musical Instruments']},

  // === Pens (Writing Instruments) ===
  {name: 'Montblanc', jp_names: ['モンブラン', 'MONTBLANC', 'MONT BLANC'], country: 'Germany', category: ['Pens']},
  {name: 'Pelikan', jp_names: ['ペリカン', 'PELIKAN'], country: 'Germany', category: ['Pens']},
  {name: 'Parker', jp_names: ['パーカー', 'PARKER'], country: 'United Kingdom', category: ['Pens']},
  {name: 'Waterman', jp_names: ['ウォーターマン', 'WATERMAN'], country: 'France', category: ['Pens']},
  {name: 'Lamy', jp_names: ['ラミー', 'LAMY'], country: 'Germany', category: ['Pens']},
  {name: 'Pilot', jp_names: ['パイロット', 'PILOT'], country: 'Japan', category: ['Pens']},
  {name: 'Sailor', jp_names: ['セーラー', 'SAILOR', 'セーラー万年筆'], country: 'Japan', category: ['Pens']},
  {name: 'Platinum', jp_names: ['プラチナ', 'PLATINUM', 'プラチナ万年筆'], country: 'Japan', category: ['Pens']},
  {name: 'Namiki', jp_names: ['ナミキ', 'NAMIKI'], country: 'Japan', parent_brand: 'Pilot', category: ['Pens']},
  {name: 'Aurora', jp_names: ['アウロラ', 'AURORA'], country: 'Italy', category: ['Pens']},
  {name: 'Visconti', jp_names: ['ヴィスコンティ', 'VISCONTI'], country: 'Italy', category: ['Pens']},
  {name: 'Delta', jp_names: ['デルタ', 'DELTA'], country: 'Italy', category: ['Pens']},
  {name: 'Cross', jp_names: ['クロス', 'CROSS'], country: 'United States', category: ['Pens']},
  {name: 'Sheaffer', jp_names: ['シェーファー', 'SHEAFFER'], country: 'United States', category: ['Pens']},
  {name: 'S.T. Dupont', jp_names: ['デュポン', 'S.T. DUPONT', 'ST DUPONT', 'エス・テー・デュポン'], country: 'France', category: ['Pens']},
  {name: 'Caran d Ache', jp_names: ['カランダッシュ', 'CARAN D ACHE'], country: 'Switzerland', category: ['Pens']},
  {name: 'Graf von Faber-Castell', jp_names: ['ファーバーカステル', 'FABER-CASTELL', 'FABER CASTELL', 'グラフフォンファーバーカステル'], country: 'Germany', category: ['Pens']},
  {name: 'Kaweco', jp_names: ['カヴェコ', 'KAWECO'], country: 'Germany', category: ['Pens']},
  {name: 'TWSBI', jp_names: ['ツイスビー', 'TWSBI'], country: 'Taiwan', category: ['Pens']},
  {name: 'Nakaya', jp_names: ['中屋', 'ナカヤ', 'NAKAYA'], country: 'Japan', category: ['Pens']},
  {name: 'Rotring', jp_names: ['ロットリング', 'ROTRING'], country: 'Germany', category: ['Pens']},
  {name: 'Montegrappa', jp_names: ['モンテグラッパ', 'MONTEGRAPPA'], country: 'Italy', category: ['Pens']},
  {name: 'OMAS', jp_names: ['オマス', 'OMAS'], country: 'Italy', category: ['Pens']},

  // === Dinnerware: 日本テーブルウェア ===
  {name: 'Narumi', jp_names: ['ナルミ', 'NARUMI'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Nikko', jp_names: ['ニッコー', 'NIKKO'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Okura', jp_names: ['大倉陶園', 'オオクラトウエン', 'OKURA'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Sango', jp_names: ['サンゴ', 'SANGO', '三郷陶器'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Mikasa', jp_names: ['ミカサ', 'MIKASA'], country: 'Japan', category: ['Dinnerware']},
  {name: 'KINTO', jp_names: ['キントー', 'KINTO'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Tachikichi', jp_names: ['たち吉', 'タチキチ', 'TACHIKICHI'], country: 'Japan', category: ['Dinnerware']},
  // === Dinnerware: 日本窯元 ===
  {name: 'Koransha', jp_names: ['香蘭社', 'コウランシャ', 'KORANSHA'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Fukagawa', jp_names: ['深川製磁', 'フカガワセイジ', 'FUKAGAWA'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Gen\'emon', jp_names: ['源右衛門', 'ゲンエモン', 'GEN\'EMON'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Kakiemon', jp_names: ['柿右衛門', 'カキエモン', 'KAKIEMON'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Kutani', jp_names: ['九谷焼', 'クタニヤキ', 'KUTANI'], country: 'Japan', category: ['Dinnerware']},
  {name: 'Hasami', jp_names: ['波佐見焼', 'ハサミヤキ', 'HASAMI'], country: 'Japan', category: ['Dinnerware']},
  // === Dinnerware: 欧州テーブルウェア ===
  {name: 'Royal Copenhagen', jp_names: ['ロイヤルコペンハーゲン', 'ROYAL COPENHAGEN'], country: 'Denmark', category: ['Dinnerware']},
  {name: 'Richard Ginori', jp_names: ['リチャードジノリ', 'RICHARD GINORI', 'ジノリ', 'GINORI'], country: 'Italy', category: ['Dinnerware']},
  {name: 'Villeroy & Boch', jp_names: ['ビレロイ&ボッホ', 'ビレロイアンドボッホ', 'VILLEROY & BOCH', 'VILLEROY AND BOCH'], country: 'Germany', category: ['Dinnerware']},
  {name: 'Rosenthal', jp_names: ['ローゼンタール', 'ROSENTHAL'], country: 'Germany', category: ['Dinnerware']},
  {name: 'Royal Doulton', jp_names: ['ロイヤルドルトン', 'ROYAL DOULTON'], country: 'United Kingdom', category: ['Dinnerware']},
  {name: 'Spode', jp_names: ['スポード', 'SPODE'], country: 'United Kingdom', category: ['Dinnerware']},
  {name: 'Royal Albert', jp_names: ['ロイヤルアルバート', 'ROYAL ALBERT'], country: 'United Kingdom', category: ['Dinnerware']},
  {name: 'Haviland', jp_names: ['アビランド', 'HAVILAND'], country: 'France', category: ['Dinnerware']},
  {name: 'Bernardaud', jp_names: ['ベルナルド', 'BERNARDAUD'], country: 'France', category: ['Dinnerware']},
  {name: 'Christofle', jp_names: ['クリストフル', 'CHRISTOFLE'], country: 'France', category: ['Dinnerware', 'Flatware']},
  // === Dinnerware: 北欧デザイン（Arabia/Iittalaは既存エントリにcategoryなしで登録済み→全カテゴリマッチ） ===
  {name: 'Marimekko', jp_names: ['マリメッコ', 'MARIMEKKO'], country: 'Finland', category: ['Dinnerware']},
  // === Dinnerware: クリスタル ===
  {name: 'Saint-Louis', jp_names: ['サンルイ', 'SAINT-LOUIS', 'SAINT LOUIS'], country: 'France', category: ['Dinnerware', 'Glassware']},
  // === Dinnerware: その他 ===
  {name: 'Le Creuset', jp_names: ['ル・クルーゼ', 'ルクルーゼ', 'LE CREUSET'], country: 'France', category: ['Dinnerware']},

  // === Scarves ===
  {name: 'Begg x Co', jp_names: ['ベッグ', 'BEGG', 'BEGG X CO'], country: 'United Kingdom', category: ['Scarves']},
  {name: 'Drake\'s', jp_names: ['ドレイクス', 'DRAKES', 'DRAKE\'S'], country: 'United Kingdom', category: ['Scarves', 'Neckties']},
  {name: 'Faliero Sarti', jp_names: ['ファリエロサルティ', 'FALIERO SARTI'], country: 'Italy', category: ['Scarves']},
  {name: 'Loro Piana', jp_names: ['ロロピアーナ', 'LORO PIANA'], country: 'Italy', category: ['Scarves']},
  {name: 'Brunello Cucinelli', jp_names: ['ブルネロクチネリ', 'BRUNELLO CUCINELLI'], country: 'Italy', category: ['Scarves']},
  {name: 'SOU SOU', jp_names: ['ソウソウ', 'SOU SOU', 'SOUSOU'], country: 'Japan', category: ['Scarves']},
  {name: 'Versace', jp_names: ['ヴェルサーチ', 'ヴェルサーチェ', 'VERSACE'], country: 'Italy', category: ['Scarves']},

  // === Neckties ===
  {name: 'E. Marinella', jp_names: ['マリネッラ', 'MARINELLA', 'E.MARINELLA'], country: 'Italy', category: ['Neckties']},
  {name: 'Brioni', jp_names: ['ブリオーニ', 'BRIONI'], country: 'Italy', category: ['Neckties']},
  {name: 'Kiton', jp_names: ['キートン', 'KITON'], country: 'Italy', category: ['Neckties']},
  {name: 'Ermenegildo Zegna', jp_names: ['ゼニア', 'エルメネジルドゼニア', 'ERMENEGILDO ZEGNA', 'ZEGNA'], country: 'Italy', category: ['Neckties']},
  {name: 'Charvet', jp_names: ['シャルベ', 'CHARVET'], country: 'France', category: ['Neckties']},
  {name: 'Turnbull & Asser', jp_names: ['ターンブル&アッサー', 'ターンブルアンドアッサー', 'TURNBULL & ASSER', 'TURNBULL AND ASSER'], country: 'United Kingdom', category: ['Neckties']},
  {name: 'Canali', jp_names: ['カナーリ', 'CANALI'], country: 'Italy', category: ['Neckties']},
  {name: 'Stefano Ricci', jp_names: ['ステファノリッチ', 'STEFANO RICCI'], country: 'Italy', category: ['Neckties']},
  {name: 'Fairfax', jp_names: ['フェアファクス', 'FAIRFAX'], country: 'Japan', category: ['Neckties']},

  // === Glassware: チェコ ===
  {name: 'Bohemia Crystal', jp_names: ['ボヘミア', 'ボヘミアクリスタル', 'BOHEMIA', 'BOHEMIA CRYSTAL'], country: 'Czech Republic', category: ['Glassware']},
  {name: 'Moser', jp_names: ['モーゼル', 'MOSER'], country: 'Czech Republic', category: ['Glassware']},
  // === Glassware: 北欧 ===
  {name: 'Orrefors', jp_names: ['オレフォス', 'ORREFORS'], country: 'Sweden', category: ['Glassware']},
  {name: 'Kosta Boda', jp_names: ['コスタボダ', 'KOSTA BODA'], country: 'Sweden', category: ['Glassware']},
  {name: 'Holmegaard', jp_names: ['ホルムガード', 'HOLMEGAARD'], country: 'Denmark', category: ['Glassware']},
  // === Glassware: イタリア ===
  {name: 'Venini', jp_names: ['ヴェニーニ', 'VENINI'], country: 'Italy', category: ['Glassware']},
  {name: 'Seguso', jp_names: ['セグーゾ', 'SEGUSO'], country: 'Italy', category: ['Glassware']},
  // === Glassware: 独墺 ===
  {name: 'Riedel', jp_names: ['リーデル', 'RIEDEL'], country: 'Austria', category: ['Glassware']},
  {name: 'Nachtmann', jp_names: ['ナハトマン', 'NACHTMANN'], country: 'Germany', category: ['Glassware']},
  {name: 'Lobmeyr', jp_names: ['ロブマイヤー', 'LOBMEYR'], country: 'Austria', category: ['Glassware']},
  // === Glassware: 日本 ===
  {name: 'Kagami Crystal', jp_names: ['カガミクリスタル', 'KAGAMI', 'KAGAMI CRYSTAL'], country: 'Japan', category: ['Glassware']},
  {name: 'Tsugaru Vidro', jp_names: ['津軽びいどろ', 'ツガルビードロ', 'TSUGARU VIDRO'], country: 'Japan', category: ['Glassware']},
  // === Glassware: その他 ===
  {name: 'Waterford', jp_names: ['ウォーターフォード', 'WATERFORD'], country: 'Ireland', category: ['Glassware', 'Snow Globes']},
  {name: 'Steuben', jp_names: ['スチューベン', 'STEUBEN'], country: 'United States', category: ['Glassware']},
  {name: 'Daum', jp_names: ['ドーム', 'DAUM'], country: 'France', category: ['Glassware']},

  // === Snow Globes ===
  {name: 'Hallmark', jp_names: ['ホールマーク', 'HALLMARK'], country: 'United States', category: ['Snow Globes']},
  {name: 'Enesco', jp_names: ['エネスコ', 'ENESCO'], country: 'United States', category: ['Snow Globes']},

  // === Boxes ===
  {name: 'Wolf', jp_names: ['ウルフ', 'WOLF', 'WOLF 1834'], country: 'United States', category: ['Boxes']},

  // === Flatware ===
  {name: 'Sori Yanagi', jp_names: ['柳宗理', 'ヤナギソウリ', 'SORI YANAGI', 'YANAGI'], country: 'Japan', category: ['Flatware']},

  // === Baby ===
  {name: 'Miki House', jp_names: ['ミキハウス', 'MIKI HOUSE', 'MIKIHOUSE'], country: 'Japan', category: ['Baby']},

  // === Collectibles (ヴィンテージ玩具メーカー) ===
  {name: 'Yonezawa', jp_names: ['米澤玩具', 'ヨネザワ', 'YONEZAWA'], country: 'Japan', category: ['Collectibles']},
  {name: 'Nomura Toy', jp_names: ['野村トーイ', 'ノムラトーイ', 'NOMURA'], country: 'Japan', category: ['Collectibles']},
  {name: 'Masudaya', jp_names: ['増田屋', 'マスダヤ', 'MASUDAYA', 'MODERN TOYS'], country: 'Japan', category: ['Collectibles']},
  {name: 'Horikawa', jp_names: ['堀川玩具', 'ホリカワ', 'HORIKAWA'], country: 'Japan', category: ['Collectibles']},
  {name: 'Alps', jp_names: ['アルプス', 'ALPS'], country: 'Japan', category: ['Collectibles']},
  {name: 'Ichiko', jp_names: ['イチコー', 'ICHIKO'], country: 'Japan', category: ['Collectibles']},
  {name: 'Yoshiya', jp_names: ['吉屋', 'ヨシヤ', 'YOSHIYA', 'KO'], country: 'Japan', category: ['Collectibles']},
  {name: 'Linemar', jp_names: ['ラインマー', 'LINEMAR'], country: 'Japan', category: ['Collectibles']},
  {name: 'Tsubame Shinko', jp_names: ['燕振興工業', 'ツバメシンコウ', 'TSUBAME SHINKO'], country: 'Japan', category: ['Flatware']},

  // === Fishing Rods ===
  {name: 'Shimano', jp_names: ['シマノ', 'SHIMANO'], country: 'Japan', category: ['Fishing Rods', 'Fishing Reels', 'Fishing Lures']},
  {name: 'Daiwa', jp_names: ['ダイワ', 'DAIWA'], country: 'Japan', category: ['Fishing Rods', 'Fishing Reels', 'Fishing Lures']},
  {name: 'Gamakatsu', jp_names: ['がまかつ', 'ガマカツ', 'GAMAKATSU'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  {name: 'Megabass', jp_names: ['メガバス', 'MEGABASS'], country: 'Japan', category: ['Fishing Rods', 'Fishing Reels', 'Fishing Lures']},
  {name: 'Major Craft', jp_names: ['メジャークラフト', 'MAJOR CRAFT'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Evergreen', jp_names: ['エバーグリーン', 'EVERGREEN'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  {name: 'Deps', jp_names: ['デプス', 'DEPS'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  {name: 'Jackall', jp_names: ['ジャッカル', 'JACKALL'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  {name: 'Tailwalk', jp_names: ['テイルウォーク', 'TAILWALK'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Abu Garcia', jp_names: ['アブガルシア', 'ABU GARCIA', 'ABU'], country: 'Sweden', category: ['Fishing Rods', 'Fishing Reels']},
  {name: 'Tenryu', jp_names: ['テンリュウ', '天龍', 'TENRYU'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Yamaga Blanks', jp_names: ['ヤマガブランクス', 'YAMAGA BLANKS'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Apia', jp_names: ['アピア', 'APIA'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Palms', jp_names: ['パームス', 'PALMS'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Ripple Fisher', jp_names: ['リップルフィッシャー', 'RIPPLE FISHER'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'G-Loomis', jp_names: ['Gルーミス', 'G-LOOMIS', 'G LOOMIS'], country: 'United States', category: ['Fishing Rods']},
  {name: 'St. Croix', jp_names: ['セントクロイ', 'ST. CROIX', 'ST CROIX'], country: 'United States', category: ['Fishing Rods']},
  {name: 'Zenaq', jp_names: ['ゼナック', 'ZENAQ'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Smith', jp_names: ['スミス', 'SMITH'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  {name: 'Nories', jp_names: ['ノリーズ', 'NORIES'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},
  // === Fishing Rods: 追加ブランド ===
  {name: 'Olympic', jp_names: ['オリムピック', 'オリンピック', 'OLYMPIC', 'グラファイトリーダー', 'GRAPHITELEADER'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Xesta', jp_names: ['ゼスタ', 'XESTA'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Shimotsuke', jp_names: ['下野', 'シモツケ', 'SHIMOTSUKE'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Suntech', jp_names: ['サンテック', 'SUNTECH'], country: 'Japan', category: ['Fishing Rods']},
  {name: 'Yamashita', jp_names: ['ヤマシタ', 'YAMASHITA', 'ヤマリア', 'YAMARIA'], country: 'Japan', category: ['Fishing Rods', 'Fishing Lures']},

  // === Fishing Lures ===
  {name: 'DUO', jp_names: ['デュオ', 'DUO'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'O.S.P', jp_names: ['オーエスピー', 'OSP', 'O.S.P'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Lucky Craft', jp_names: ['ラッキークラフト', 'LUCKY CRAFT'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Imakatsu', jp_names: ['イマカツ', 'IMAKATSU'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Gan Craft', jp_names: ['ガンクラフト', 'GAN CRAFT', 'GANCRAFT'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Tiemco', jp_names: ['ティムコ', 'TIEMCO'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Raid Japan', jp_names: ['レイドジャパン', 'RAID JAPAN'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'BlueBlue', jp_names: ['ブルーブルー', 'BLUEBLUE'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'ima', jp_names: ['アイマ', 'IMA'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'ZipBaits', jp_names: ['ジップベイツ', 'ZIPBAITS', 'ZIP BAITS'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Maria', jp_names: ['マリア', 'MARIA'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Yo-Zuri', jp_names: ['ヨーヅリ', 'YO-ZURI', 'YOZURI'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Hayabusa', jp_names: ['ハヤブサ', 'HAYABUSA'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Owner', jp_names: ['オーナー', 'OWNER', 'カルティバ', 'CULTIVA'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Decoy', jp_names: ['デコイ', 'DECOY'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Varivas', jp_names: ['バリバス', 'VARIVAS'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'YGK', jp_names: ['よつあみ', 'YGK', 'ワイジーケー'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Sunline', jp_names: ['サンライン', 'SUNLINE'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Seaguar', jp_names: ['シーガー', 'SEAGUAR', 'クレハ', 'KUREHA'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Bassday', jp_names: ['バスデイ', 'BASSDAY'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Jackson', jp_names: ['ジャクソン', 'JACKSON'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Ecogear', jp_names: ['エコギア', 'ECOGEAR'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Geecrack', jp_names: ['ジークラック', 'GEECRACK'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Fish Arrow', jp_names: ['フィッシュアロー', 'FISH ARROW'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Gary Yamamoto', jp_names: ['ゲーリーヤマモト', 'GARY YAMAMOTO'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Keitech', jp_names: ['ケイテック', 'KEITECH'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'HMKL', jp_names: ['ハンクル', 'HMKL'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Meiho', jp_names: ['メイホウ', 'メイホー', 'MEIHO', 'VERSUS'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Ryugi', jp_names: ['リューギ', 'RYUGI'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Carpenter', jp_names: ['カーペンター', 'CARPENTER'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Breaden', jp_names: ['ブリーデン', 'BREADEN'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Roman Made', jp_names: ['ロマンメイド', 'ROMAN MADE'], country: 'Japan', category: ['Fishing Lures']},
  {name: 'Issei', jp_names: ['一誠', 'イッセイ', 'ISSEI'], country: 'Japan', category: ['Fishing Lures']},
];

/**
 * 交通整理（Sanitize）用のブランドリストを生成する
 * IS_BRAND_DICTからカテゴリに応じたブランドの英語名+日本語名をコンパクトな文字列で返す
 * @param {string} category - ISカテゴリ名 ('Watches', 'Cameras', 'Trading Cards'等)
 * @return {string} ブランドリスト文字列（例: "Seiko(セイコー), Omega(オメガ), ..."）
 */
function getBrandListForSanitize_(category) {
  try {
    // カードの場合はCardPatterns.gsのゲーム名を返す
    if (category === 'Trading Cards') {
      var games = [
        'Pokemon TCG(ポケモンカード)', 'Yu-Gi-Oh!(遊戯王)', 'Magic the Gathering(MTG)',
        'Duel Masters(デュエルマスターズ)', 'Weiss Schwarz(ヴァイスシュヴァルツ)',
        'Cardfight Vanguard(ヴァンガード)', 'Battle Spirits(バトルスピリッツ)',
        'Dragon Ball(ドラゴンボール)', 'One Piece(ワンピース)',
        'Sumo(大相撲カード)'
      ];
      return games.join(', ');
    }

    if (category === 'Baseball Cards') {
      var bbBrands = [
        'Topps', 'Bowman', 'Panini', 'Upper Deck', 'Donruss',
        'BBM', 'Epoch', 'Calbee',
        'Topps Chrome', 'Bowman Chrome', 'Topps Heritage',
        'Prizm', 'Donruss Optic', 'Topps Series 1', 'Topps Update Series'
      ];
      return bbBrands.join(', ');
    }

    if (category === 'PC Peripherals') {
      return 'Logitech, Elecom, Sanwa, Buffalo, Anker, Razer, Corsair, SteelSeries, HyperX, Apple, Microsoft, Dell, HP, Lenovo, Seagate, Western Digital, Samsung, Kingston, Crucial';
    }

    if (category === 'Electronic Dictionaries') {
      return 'Casio (EX-word), Sharp (Brain), Canon (wordtank), Seiko (IC Dictionary), Franklin';
    }

    if (category === 'Scientific Calculators') {
      return 'Casio, Texas Instruments, HP, Sharp, Canon';
    }

    if (category === 'Hand Tools' || category === 'Planes' || category === 'Chisels' ||
        category === 'Hammers & Mallets' || category === 'Saws' || category === 'Trowels' ||
        category === 'Wrench Sets') {
      return ['KTC', 'VESSEL', 'TONE', 'Ko-ken', 'KAKURI', 'DOGYU', 'SUIZAN', 'Gyokucho',
              'Tasai', 'Chiyotsuru', 'Tsunesaburo', 'Ouchi Nomi',
              'Snap-on', 'MAC Tools', 'FACOM', 'Knipex', 'HAZET', 'DEWALT', 'Stanley',
              'Klein Tools', 'Estwing', 'Vaughan', 'Channellock', 'Irwin', 'Bahco'];
    }

    if (category === 'Power Tools' || category === 'Impact Drivers' || category === 'Cordless Drills' ||
        category === 'Corded Drills' || category === 'Circular Saws' || category === 'Jig Saws' ||
        category === 'Reciprocating Saws' || category === 'Grinders' || category === 'Sanders' ||
        category === 'Routers & Joiners' || category === 'Planers' || category === 'Heat Guns' ||
        category === 'Screw Guns & Screwdrivers' || category === 'Power Tool Sets') {
      return ['Makita', 'HiKOKI', 'Ryobi', 'Panasonic', 'Shindaiwa', 'MAX', 'Takagi', 'Ikura Tools',
              'Hitachi Power Tools', 'Kyocera Industrial Tools',
              'DEWALT', 'Milwaukee', 'Bosch', 'Festool', 'Hilti', 'Black+Decker', 'Ridgid',
              'Husky', 'Skil', 'Craftsman', 'Porter-Cable', 'Metabo', 'Metabo HPT',
              'Kobalt', 'Ingersoll Rand', 'Worx', 'Stanley'];
    }

    if (category === 'Laptops' || category === 'Desktops' || category === 'Tablets' || category === 'Computers') {
      return 'Apple, Lenovo, Dell, HP, ASUS, Acer, Microsoft, Sony, VAIO, Panasonic, Fujitsu, NEC, Toshiba, dynabook, LG, Samsung, MSI, Razer, Alienware, Intel, Google';
    }

    if (category === 'Board Games') {
      return '任天堂, ホビージャパン, アークライト, Hasbro, Mattel, Ravensburger, Z-Man Games, Fantasy Flight Games, Asmodee';
    }

    // watch/cameraの場合はIS_BRAND_DICTからフィルタ
    if (typeof IS_BRAND_DICT === 'undefined' || !IS_BRAND_DICT) return '';

    // ISカテゴリ名をIS_BRAND_DICTのカテゴリ名にマッピング
    // ※ Video Game Consolesのブランドは IS_BRAND_DICT上 'Video Games' で登録されている
    var targetCategories;
    if (category === 'Watches') {
      targetCategories = ['Watches'];
    } else if (category === 'Cameras') {
      targetCategories = ['Cameras'];
    } else if (category === 'Video Game Consoles') {
      targetCategories = ['Video Games'];
    } else if (category === 'Fishing Reels') {
      targetCategories = ['Fishing Reels'];
    } else if (category === 'game') {
      // Sanitize用の簡易カテゴリ対応（ゲーム機）
      targetCategories = ['Video Games'];
    } else if (category === 'reel') {
      // Sanitize用の簡易カテゴリ対応（リール）
      targetCategories = ['Fishing Reels'];
    } else {
      // 新規カテゴリ: ISカテゴリ名をそのままIS_BRAND_DICTのフィルタに使用
      targetCategories = [category];
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
  {keywords: ['マーベル', 'MARVEL', 'Marvel', 'アベンジャーズ', 'Avengers', 'スパイダーマン', 'Spider-Man', 'アイアンマン'], value: 'Marvel', country: 'United States'},
  {keywords: ['DC', 'バットマン', 'Batman', 'スーパーマン', 'Superman', 'ジョーカー', 'Joker'], value: 'DC Comics', country: 'United States'},
  {keywords: ['スターウォーズ', 'STAR WARS', 'Star Wars', 'ダースベイダー', 'Darth Vader', 'ヨーダ'], value: 'Star Wars', country: 'United States'},
  {keywords: ['トランスフォーマー', 'TRANSFORMERS', 'Transformers', 'オプティマス'], value: 'Transformers', country: 'United States'},
  {keywords: ['ディズニー', 'DISNEY', 'Disney', 'ミッキー', 'Mickey'], value: 'Disney', country: 'United States'},
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
  'キャスケット': 'Newsboy Cap',

  // Traditional Toys
  'けん玉': 'Traditional Toy',
  'ケンダマ': 'Traditional Toy',
  '剣玉': 'Traditional Toy',
  '独楽': 'Spinning Top',
  'コマ': 'Spinning Top',
  'こま': 'Spinning Top'
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
  'ユニフォーム': 'Clothing', 'ジャージ': 'Clothing', 'トレーニングウェア': 'Clothing',
  'ゴルフウェア': 'Clothing', 'スキーウェア': 'Clothing', '水着': 'Clothing',
  '靴': 'Shoes', 'シューズ': 'Shoes', 'スニーカー': 'Shoes', 'ブーツ': 'Shoes',
  'サンダル': 'Shoes', 'パンプス': 'Shoes', 'ローファー': 'Shoes',
  'カメラ': 'Cameras', 'デジカメ': 'Cameras', '一眼レフ': 'Cameras', 'ミラーレス': 'Cameras',
  '電子機器': 'Electronics', '家電': 'Electronics', 'オーディオ': 'Electronics',
  'ヘッドホン': 'Electronics', 'イヤホン': 'Electronics', 'スピーカー': 'Electronics',
  'オーディオアンプ': 'Electronics', 'AVアンプ': 'Electronics', 'レシーバー': 'Electronics', 'ターンテーブル': 'Electronics',
  'レコードプレーヤー': 'Electronics', 'カセットデッキ': 'Electronics', 'ウォークマン': 'Electronics', 'DAP': 'Electronics',
  'ポータブルプレーヤー': 'Electronics', '炊飯器': 'Electronics', '掃除機': 'Electronics', 'ドライヤー': 'Electronics',
  '美顔器': 'Electronics', '電気ケトル': 'Electronics', '空気清浄機': 'Electronics', 'プロジェクター': 'Electronics', 'ラジオ': 'Electronics',
  'トレカ': 'Trading Cards', 'カード': 'Trading Cards', 'トレーディングカード': 'Trading Cards',
  'ポケカ': 'Trading Cards', '遊戯王': 'Trading Cards', 'MTG': 'Trading Cards',
  'ブローチ': 'Brooches', 'カフリンクス': 'Cufflinks', 'カフリンク': 'Cufflinks', 'カフスボタン': 'Cufflinks',
  '髪飾り': 'Hair Accessories', 'ヘアアクセサリー': 'Hair Accessories', 'かんざし': 'Hair Accessories', 'バレッタ': 'Hair Accessories',
  '皿': 'Dinnerware', 'プレート': 'Dinnerware', '食器': 'Dinnerware', '茶碗': 'Dinnerware', 'カップ': 'Dinnerware',
  'スカーフ': 'Scarves', 'マフラー': 'Scarves', 'ストール': 'Scarves', 'ショール': 'Scarves', 'バンダナ': 'Scarves', 'スヌード': 'Scarves', 'ネックウォーマー': 'Scarves',
  'ネクタイ': 'Neckties', '蝶ネクタイ': 'Neckties', 'ボウタイ': 'Neckties', 'アスコットタイ': 'Neckties',
  'ハンカチ': 'Handkerchiefs', 'ポケットチーフ': 'Handkerchiefs', 'タオルハンカチ': 'Handkerchiefs',
  'ネクタイピン': 'Tie Accessories', 'タイピン': 'Tie Accessories', 'タイバー': 'Tie Accessories', 'スカーフリング': 'Tie Accessories',
  'ガラス細工': 'Glassware', 'クリスタル': 'Glassware', '花瓶': 'Glassware', '切子': 'Glassware', '江戸切子': 'Glassware', '薩摩切子': 'Glassware', 'デキャンタ': 'Glassware', 'ペーパーウェイト': 'Glassware', 'グラス': 'Glassware', 'ワイングラス': 'Glassware',
  'スノードーム': 'Snow Globes', 'ガラスドーム': 'Snow Globes', 'スノーグローブ': 'Snow Globes', 'ウォータードーム': 'Snow Globes',
  'ジュエリーボックス': 'Boxes', '時計ケース': 'Boxes', 'ウォッチボックス': 'Boxes', '宝石箱': 'Boxes', 'アクセサリーケース': 'Boxes', 'コレクションケース': 'Boxes', 'ディスプレイケース': 'Boxes',
  'カトラリー': 'Flatware', 'スプーン': 'Flatware', 'フォーク': 'Flatware', '銀食器': 'Flatware', 'シルバーカトラリー': 'Flatware',
  'ベビー': 'Baby', 'ベビーシューズ': 'Baby', 'ラトル': 'Baby', 'ベビー用品': 'Baby', 'ガラガラ': 'Baby',
  '櫛': 'Combs', 'くし': 'Combs', 'コーム': 'Combs', 'つげ櫛': 'Combs', 'ヘアコーム': 'Combs',
  'キーリング': 'Key Chains', 'キーホルダー': 'Key Chains', 'キーケース': 'Key Chains', 'チャームキーホルダー': 'Key Chains',
  'チャーム': 'Charms', 'ペンダントトップ': 'Charms',
  'フィギュア': 'Collectibles', 'コレクティブル': 'Collectibles', // → Figuresで上書き
  'アンティーク': 'Collectibles', 'ヴィンテージ': 'Collectibles', '骨董品': 'Collectibles',
  '昭和レトロ': 'Collectibles', 'レトロ': 'Collectibles', '当時物': 'Collectibles',
  'ブリキ': 'Collectibles', 'ソフビ': 'Collectibles', 'ノベルティ': 'Collectibles', '非売品': 'Collectibles',
  'デッドストック': 'Collectibles', '景品': 'Collectibles', 'ピンバッジ': 'Collectibles',
  'ミリタリー': 'Collectibles', '鉄道グッズ': 'Collectibles', '記念品': 'Collectibles', '紙もの': 'Collectibles',
  'けん玉': 'Collectibles', 'ケンダマ': 'Collectibles', '剣玉': 'Collectibles',
  '独楽': 'Collectibles', 'コマ': 'Collectibles', 'こま': 'Collectibles',
  '人形': 'Dolls & Plush',
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

// Japanese Dolls（日本人形）
IS_TAG_TO_CATEGORY['こけし'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['日本人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['博多人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['市松人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['雛人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['五月人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['木目込み人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['御所人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['伏見人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['からくり人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['土人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['文楽人形'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['だるま'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['ダルマ'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['達磨'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['招き猫'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['まねきねこ'] = 'Japanese Dolls';
IS_TAG_TO_CATEGORY['招福猫'] = 'Japanese Dolls';

// Hats
IS_TAG_TO_CATEGORY['帽子'] = 'Hats'; IS_TAG_TO_CATEGORY['キャップ'] = 'Hats'; IS_TAG_TO_CATEGORY['ハット'] = 'Hats';
IS_TAG_TO_CATEGORY['ビーニー'] = 'Hats'; IS_TAG_TO_CATEGORY['バケットハット'] = 'Hats'; IS_TAG_TO_CATEGORY['スナップバック'] = 'Hats';
IS_TAG_TO_CATEGORY['ベースボールキャップ'] = 'Hats'; IS_TAG_TO_CATEGORY['トラッカーハット'] = 'Hats';
IS_TAG_TO_CATEGORY['ニット帽'] = 'Hats'; IS_TAG_TO_CATEGORY['ベレー帽'] = 'Hats'; IS_TAG_TO_CATEGORY['フェドーラ'] = 'Hats';
IS_TAG_TO_CATEGORY['パナマハット'] = 'Hats'; IS_TAG_TO_CATEGORY['キャスケット'] = 'Hats'; IS_TAG_TO_CATEGORY['ハンチング'] = 'Hats';
IS_TAG_TO_CATEGORY['ダッドハット'] = 'Hats'; IS_TAG_TO_CATEGORY['サンバイザー'] = 'Hats';

// Musical Instruments (JP tags — generic; specific overrides below)
IS_TAG_TO_CATEGORY['楽器'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['バイオリン'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['フルート'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['サックス'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['トランペット'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['ドラム'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['ハーモニカ'] = 'Musical Instruments';

// Instruments (EN tags — 楽器 prompt leaf categories, 14 entries)
IS_TAG_TO_CATEGORY['Pianos'] = 'Instruments'; IS_TAG_TO_CATEGORY['Upright Pianos'] = 'Instruments';
IS_TAG_TO_CATEGORY['Grand Pianos'] = 'Instruments'; IS_TAG_TO_CATEGORY['Digital Pianos'] = 'Instruments';
IS_TAG_TO_CATEGORY['Synthesizers'] = 'Instruments'; IS_TAG_TO_CATEGORY['Saxophones'] = 'Instruments';
IS_TAG_TO_CATEGORY['Clarinets'] = 'Instruments'; IS_TAG_TO_CATEGORY['Flutes'] = 'Instruments';
IS_TAG_TO_CATEGORY['Trumpets'] = 'Instruments'; IS_TAG_TO_CATEGORY['Violins'] = 'Instruments';
IS_TAG_TO_CATEGORY['Cellos'] = 'Instruments'; IS_TAG_TO_CATEGORY['Drum Kits'] = 'Instruments';
IS_TAG_TO_CATEGORY['Audio Interface'] = 'Instruments'; IS_TAG_TO_CATEGORY['Studio Monitor'] = 'Instruments';

// Pens & Writing Instruments
IS_TAG_TO_CATEGORY['万年筆'] = 'Pens'; IS_TAG_TO_CATEGORY['ボールペン'] = 'Pens';
IS_TAG_TO_CATEGORY['ペン'] = 'Pens'; IS_TAG_TO_CATEGORY['シャープペンシル'] = 'Pens';
IS_TAG_TO_CATEGORY['筆記具'] = 'Pens'; IS_TAG_TO_CATEGORY['メカニカルペンシル'] = 'Pens';

// Wallets
IS_TAG_TO_CATEGORY['財布'] = 'Wallets'; IS_TAG_TO_CATEGORY['長財布'] = 'Wallets';
IS_TAG_TO_CATEGORY['二つ折り財布'] = 'Wallets'; IS_TAG_TO_CATEGORY['コインケース'] = 'Wallets';
IS_TAG_TO_CATEGORY['カードケース'] = 'Wallets'; IS_TAG_TO_CATEGORY['マネークリップ'] = 'Wallets';
IS_TAG_TO_CATEGORY['キーケース'] = 'Wallets'; IS_TAG_TO_CATEGORY['パスケース'] = 'Wallets';
IS_TAG_TO_CATEGORY['三つ折り財布'] = 'Wallets'; IS_TAG_TO_CATEGORY['ミニ財布'] = 'Wallets';
IS_TAG_TO_CATEGORY['札入れ'] = 'Wallets'; IS_TAG_TO_CATEGORY['がま口'] = 'Wallets';
IS_TAG_TO_CATEGORY['手帳カバー'] = 'Wallets';

// Art
IS_TAG_TO_CATEGORY['絵画'] = 'Art'; IS_TAG_TO_CATEGORY['油絵'] = 'Art';
IS_TAG_TO_CATEGORY['水彩画'] = 'Art'; IS_TAG_TO_CATEGORY['日本画'] = 'Art';
IS_TAG_TO_CATEGORY['水墨画'] = 'Art'; IS_TAG_TO_CATEGORY['墨絵'] = 'Art';
IS_TAG_TO_CATEGORY['アクリル画'] = 'Art'; IS_TAG_TO_CATEGORY['パステル画'] = 'Art';
// 浮世絵・版画・木版画・リトグラフ → Printsで上書き
IS_TAG_TO_CATEGORY['版画'] = 'Art'; IS_TAG_TO_CATEGORY['リトグラフ'] = 'Art';
IS_TAG_TO_CATEGORY['木版画'] = 'Art'; IS_TAG_TO_CATEGORY['浮世絵'] = 'Art';

// Kakejiku (掛軸)
IS_TAG_TO_CATEGORY['掛軸'] = 'Kakejiku'; IS_TAG_TO_CATEGORY['掛け軸'] = 'Kakejiku';
IS_TAG_TO_CATEGORY['床掛け'] = 'Kakejiku';

// Pottery & Ceramics（茶碗はDinnerwareから上書き: 陶器としての出品が主）
IS_TAG_TO_CATEGORY['陶磁器'] = 'Pottery'; IS_TAG_TO_CATEGORY['陶器'] = 'Pottery';
IS_TAG_TO_CATEGORY['磁器'] = 'Pottery'; IS_TAG_TO_CATEGORY['焼物'] = 'Pottery';
IS_TAG_TO_CATEGORY['花瓶'] = 'Pottery'; IS_TAG_TO_CATEGORY['香炉'] = 'Pottery';
IS_TAG_TO_CATEGORY['有田焼'] = 'Pottery'; IS_TAG_TO_CATEGORY['伊万里'] = 'Pottery';
IS_TAG_TO_CATEGORY['古伊万里'] = 'Pottery'; IS_TAG_TO_CATEGORY['九谷焼'] = 'Pottery';
IS_TAG_TO_CATEGORY['備前焼'] = 'Pottery'; IS_TAG_TO_CATEGORY['萩焼'] = 'Pottery';
IS_TAG_TO_CATEGORY['信楽焼'] = 'Pottery'; IS_TAG_TO_CATEGORY['瀬戸焼'] = 'Pottery';
IS_TAG_TO_CATEGORY['美濃焼'] = 'Pottery'; IS_TAG_TO_CATEGORY['唐津焼'] = 'Pottery';
IS_TAG_TO_CATEGORY['京焼'] = 'Pottery'; IS_TAG_TO_CATEGORY['清水焼'] = 'Pottery';
IS_TAG_TO_CATEGORY['織部'] = 'Pottery'; IS_TAG_TO_CATEGORY['志野'] = 'Pottery';
IS_TAG_TO_CATEGORY['薩摩焼'] = 'Pottery';
// 茶道具 → Tea Ceremonyで上書き
IS_TAG_TO_CATEGORY['茶道具'] = 'Pottery'; IS_TAG_TO_CATEGORY['茶碗'] = 'Pottery';
IS_TAG_TO_CATEGORY['壺'] = 'Pottery';

// Belts
IS_TAG_TO_CATEGORY['ベルト'] = 'Belts'; IS_TAG_TO_CATEGORY['レザーベルト'] = 'Belts';
IS_TAG_TO_CATEGORY['メッシュベルト'] = 'Belts';
IS_TAG_TO_CATEGORY['ベルトバックル'] = 'Belt Buckles'; IS_TAG_TO_CATEGORY['バックル'] = 'Belt Buckles';

// Golf Heads
IS_TAG_TO_CATEGORY['ゴルフヘッド'] = 'Golf Heads';

// Kimono
IS_TAG_TO_CATEGORY['着物'] = 'Kimono'; IS_TAG_TO_CATEGORY['和装'] = 'Kimono';
IS_TAG_TO_CATEGORY['振袖'] = 'Kimono'; IS_TAG_TO_CATEGORY['留袖'] = 'Kimono';
IS_TAG_TO_CATEGORY['訪問着'] = 'Kimono'; IS_TAG_TO_CATEGORY['浴衣'] = 'Kimono';
IS_TAG_TO_CATEGORY['帯'] = 'Kimono'; IS_TAG_TO_CATEGORY['袴'] = 'Kimono';
IS_TAG_TO_CATEGORY['小紋'] = 'Kimono'; IS_TAG_TO_CATEGORY['紬'] = 'Kimono';
IS_TAG_TO_CATEGORY['付下げ'] = 'Kimono'; IS_TAG_TO_CATEGORY['羽織'] = 'Kimono';
IS_TAG_TO_CATEGORY['色無地'] = 'Kimono'; IS_TAG_TO_CATEGORY['反物'] = 'Kimono';
IS_TAG_TO_CATEGORY['草履'] = 'Kimono'; IS_TAG_TO_CATEGORY['下駄'] = 'Kimono';
IS_TAG_TO_CATEGORY['名古屋帯'] = 'Kimono'; IS_TAG_TO_CATEGORY['袋帯'] = 'Kimono';
IS_TAG_TO_CATEGORY['半幅帯'] = 'Kimono';

// Japanese Swords（刀身は海外発送不可。鍔/拵え等の刀装具のみ出品可能）
IS_TAG_TO_CATEGORY['日本刀'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['刀'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['脇差'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['短刀'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['太刀'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['刀装具'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['鍔'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['目貫'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['拵え'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['縁頭'] = 'Japanese Swords';
IS_TAG_TO_CATEGORY['小柄'] = 'Japanese Swords'; IS_TAG_TO_CATEGORY['笄'] = 'Japanese Swords';

// Tea Ceremony（茶道具をPotteryから上書き）
IS_TAG_TO_CATEGORY['茶道具'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['茶入'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['棗'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['茶杓'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['水指'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['建水'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['風炉'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['釜'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['蓋置'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['香合'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['花入'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['茶筅'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['柄杓'] = 'Tea Ceremony'; IS_TAG_TO_CATEGORY['菓子器'] = 'Tea Ceremony';
IS_TAG_TO_CATEGORY['炉縁'] = 'Tea Ceremony';

// Bonsai（※生きた木/植物は輸出不可）
IS_TAG_TO_CATEGORY['盆栽'] = 'Bonsai'; IS_TAG_TO_CATEGORY['盆栽鉢'] = 'Bonsai';
IS_TAG_TO_CATEGORY['盆器'] = 'Bonsai'; IS_TAG_TO_CATEGORY['水石'] = 'Bonsai';
IS_TAG_TO_CATEGORY['盆栽道具'] = 'Bonsai'; IS_TAG_TO_CATEGORY['盆栽ハサミ'] = 'Bonsai';
IS_TAG_TO_CATEGORY['飾台'] = 'Bonsai'; IS_TAG_TO_CATEGORY['卓'] = 'Bonsai';
IS_TAG_TO_CATEGORY['水盤'] = 'Bonsai';

// Prints（浮世絵・版画・木版画・リトグラフをArtから上書き）
IS_TAG_TO_CATEGORY['浮世絵'] = 'Prints'; IS_TAG_TO_CATEGORY['版画'] = 'Prints';
IS_TAG_TO_CATEGORY['木版画'] = 'Prints'; IS_TAG_TO_CATEGORY['リトグラフ'] = 'Prints';
IS_TAG_TO_CATEGORY['シルクスクリーン'] = 'Prints'; IS_TAG_TO_CATEGORY['エッチング'] = 'Prints';
IS_TAG_TO_CATEGORY['銅版画'] = 'Prints'; IS_TAG_TO_CATEGORY['新版画'] = 'Prints';
IS_TAG_TO_CATEGORY['創作版画'] = 'Prints';

// Buddhist Art
IS_TAG_TO_CATEGORY['仏像'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['仏具'] = 'Buddhist Art';
IS_TAG_TO_CATEGORY['仏教美術'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['神具'] = 'Buddhist Art';
IS_TAG_TO_CATEGORY['木彫'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['銅像'] = 'Buddhist Art';
IS_TAG_TO_CATEGORY['観音'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['如来'] = 'Buddhist Art';
IS_TAG_TO_CATEGORY['数珠'] = 'Buddhist Art'; IS_TAG_TO_CATEGORY['木魚'] = 'Buddhist Art';

// Tetsubin（急須をPotteryから上書き）
IS_TAG_TO_CATEGORY['鉄瓶'] = 'Tetsubin'; IS_TAG_TO_CATEGORY['銀瓶'] = 'Tetsubin';
IS_TAG_TO_CATEGORY['南部鉄器'] = 'Tetsubin'; IS_TAG_TO_CATEGORY['茶釜'] = 'Tetsubin';
IS_TAG_TO_CATEGORY['銅瓶'] = 'Tetsubin'; IS_TAG_TO_CATEGORY['鉄瓶急須'] = 'Tetsubin';
IS_TAG_TO_CATEGORY['陶器急須'] = 'Pottery';

// Kitchen Knives（和包丁）
IS_TAG_TO_CATEGORY['包丁'] = 'Kitchen Knives'; IS_TAG_TO_CATEGORY['出刃包丁'] = 'Kitchen Knives';
IS_TAG_TO_CATEGORY['刺身包丁'] = 'Kitchen Knives'; IS_TAG_TO_CATEGORY['柳刃包丁'] = 'Kitchen Knives';
IS_TAG_TO_CATEGORY['三徳包丁'] = 'Kitchen Knives'; IS_TAG_TO_CATEGORY['牛刀'] = 'Kitchen Knives';
IS_TAG_TO_CATEGORY['菜切包丁'] = 'Kitchen Knives'; IS_TAG_TO_CATEGORY['ペティナイフ'] = 'Kitchen Knives';
IS_TAG_TO_CATEGORY['和包丁'] = 'Kitchen Knives'; IS_TAG_TO_CATEGORY['薄刃包丁'] = 'Kitchen Knives';

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
IS_TAG_TO_CATEGORY['琵琶'] = 'Japanese Instruments'; IS_TAG_TO_CATEGORY['鼓'] = 'Japanese Instruments';
IS_TAG_TO_CATEGORY['和楽器'] = 'Japanese Instruments'; IS_TAG_TO_CATEGORY['雅楽'] = 'Japanese Instruments';

// Guitars（Musical Instrumentsから上書き）
IS_TAG_TO_CATEGORY['ギター'] = 'Guitars'; IS_TAG_TO_CATEGORY['ベース'] = 'Guitars';
IS_TAG_TO_CATEGORY['ウクレレ'] = 'Guitars'; IS_TAG_TO_CATEGORY['エレキギター'] = 'Guitars';
IS_TAG_TO_CATEGORY['アコースティックギター'] = 'Guitars'; IS_TAG_TO_CATEGORY['クラシックギター'] = 'Guitars';
IS_TAG_TO_CATEGORY['エレキベース'] = 'Guitars';
IS_TAG_TO_CATEGORY['Electric Guitars'] = 'Guitars'; IS_TAG_TO_CATEGORY['Acoustic Guitars'] = 'Guitars';
IS_TAG_TO_CATEGORY['Bass Guitars'] = 'Guitars'; IS_TAG_TO_CATEGORY['Classical Guitars'] = 'Guitars';
IS_TAG_TO_CATEGORY['Ukuleles'] = 'Guitars'; IS_TAG_TO_CATEGORY['Mandolins'] = 'Guitars';

// Effects & Amps（Musical Instrumentsから上書き）
IS_TAG_TO_CATEGORY['エフェクター'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['アンプ'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['ストンプボックス'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['マルチエフェクター'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['オーバードライブ'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['ディストーション'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['ファズ'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['ディレイ'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['リバーブ'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['コーラス'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['コンプレッサー'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['ワウ'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['ルーパー'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['ブースター'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['ギターアンプ'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['ベースアンプ'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['Guitar Amplifiers'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['Bass Guitar Amplifiers'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['Combo Amps'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['Amp Heads'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['Speaker Cabinets'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['Effects Pedals'] = 'Effects & Amps';
IS_TAG_TO_CATEGORY['Multi-Effects'] = 'Effects & Amps'; IS_TAG_TO_CATEGORY['Tube Amplifier'] = 'Effects & Amps';

// Synths & Digital（Musical Instrumentsから上書き）
IS_TAG_TO_CATEGORY['キーボード'] = 'Synths & Digital'; IS_TAG_TO_CATEGORY['シンセサイザー'] = 'Synths & Digital';
IS_TAG_TO_CATEGORY['シンセ'] = 'Synths & Digital'; IS_TAG_TO_CATEGORY['電子ピアノ'] = 'Synths & Digital';
IS_TAG_TO_CATEGORY['ワークステーション'] = 'Synths & Digital'; IS_TAG_TO_CATEGORY['サンプラー'] = 'Synths & Digital';
IS_TAG_TO_CATEGORY['ドラムマシン'] = 'Synths & Digital'; IS_TAG_TO_CATEGORY['グルーヴボックス'] = 'Synths & Digital';
IS_TAG_TO_CATEGORY['DJコントローラー'] = 'Synths & Digital'; IS_TAG_TO_CATEGORY['ターンテーブル'] = 'Synths & Digital';
IS_TAG_TO_CATEGORY['ミキサー'] = 'Synths & Digital';

// Musical Instruments追加タグ（ドラム・管楽器）
IS_TAG_TO_CATEGORY['管楽器'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['スネア'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['シンバル'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['パーカッション'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['クラリネット'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['トロンボーン'] = 'Musical Instruments';
IS_TAG_TO_CATEGORY['チェロ'] = 'Musical Instruments'; IS_TAG_TO_CATEGORY['ビオラ'] = 'Musical Instruments';

// Fishing Rods
IS_TAG_TO_CATEGORY['釣竿'] = 'Fishing Rods'; IS_TAG_TO_CATEGORY['ロッド'] = 'Fishing Rods';
IS_TAG_TO_CATEGORY['竿'] = 'Fishing Rods';

// Mecha Model Kits（ガンプラ/ロボット系プラモデル）
IS_TAG_TO_CATEGORY['ガンプラ'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['HGUC'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['MG'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['RG'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['PG'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['SD'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['BB戦士'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['プレバン'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['ゾイド'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['フレームアームズ'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['メカプラモ'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['ロボットプラモ'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['Gundam Models'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['HG Gundam'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['MG Gundam'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['RG Gundam'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['PG Gundam'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['Mecha Plastic Kits'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['Robot Models'] = 'Mecha Model Kits'; IS_TAG_TO_CATEGORY['Evangelion Model Kits'] = 'Mecha Model Kits';

// RC & Scale Models
IS_TAG_TO_CATEGORY['ラジコン'] = 'RC & Models'; IS_TAG_TO_CATEGORY['RC'] = 'RC & Models';
IS_TAG_TO_CATEGORY['模型'] = 'RC & Models'; IS_TAG_TO_CATEGORY['プラモデル'] = 'RC & Models';
IS_TAG_TO_CATEGORY['ミニ四駆'] = 'RC & Models'; IS_TAG_TO_CATEGORY['モデルカー'] = 'RC & Models';
IS_TAG_TO_CATEGORY['スケールモデル'] = 'RC & Models'; IS_TAG_TO_CATEGORY['戦車'] = 'RC & Models';
IS_TAG_TO_CATEGORY['戦闘機'] = 'RC & Models'; IS_TAG_TO_CATEGORY['鉄道模型'] = 'RC & Models';
IS_TAG_TO_CATEGORY['RC Cars'] = 'RC & Models'; IS_TAG_TO_CATEGORY['RC Helicopters'] = 'RC & Models';
IS_TAG_TO_CATEGORY['RC Drones'] = 'RC & Models'; IS_TAG_TO_CATEGORY['Plastic Model Kits'] = 'RC & Models';
IS_TAG_TO_CATEGORY['Diecast Cars'] = 'RC & Models'; IS_TAG_TO_CATEGORY['Train Models'] = 'RC & Models';
IS_TAG_TO_CATEGORY['Slot Cars'] = 'RC & Models'; IS_TAG_TO_CATEGORY['Wooden Models'] = 'RC & Models';

// Manga
IS_TAG_TO_CATEGORY['漫画'] = 'Manga'; IS_TAG_TO_CATEGORY['マンガ'] = 'Manga';
IS_TAG_TO_CATEGORY['コミック'] = 'Manga'; IS_TAG_TO_CATEGORY['単行本'] = 'Manga';
IS_TAG_TO_CATEGORY['文庫本'] = 'Manga'; IS_TAG_TO_CATEGORY['全巻セット'] = 'Manga';
IS_TAG_TO_CATEGORY['初版'] = 'Manga'; IS_TAG_TO_CATEGORY['同人誌'] = 'Manga';
IS_TAG_TO_CATEGORY['画集'] = 'Manga';
IS_TAG_TO_CATEGORY['Manga'] = 'Manga'; IS_TAG_TO_CATEGORY['Single Volumes'] = 'Manga';
IS_TAG_TO_CATEGORY['Doujinshi'] = 'Manga'; IS_TAG_TO_CATEGORY['Manga Magazines'] = 'Manga';
IS_TAG_TO_CATEGORY['Manga Boxset'] = 'Manga';

// Anime Merchandise
IS_TAG_TO_CATEGORY['アニメ'] = 'Anime'; IS_TAG_TO_CATEGORY['アニメグッズ'] = 'Anime';
IS_TAG_TO_CATEGORY['アクスタ'] = 'Anime'; IS_TAG_TO_CATEGORY['缶バッジ'] = 'Anime';
IS_TAG_TO_CATEGORY['タペストリー'] = 'Anime'; IS_TAG_TO_CATEGORY['クリアファイル'] = 'Anime';
IS_TAG_TO_CATEGORY['色紙'] = 'Anime'; IS_TAG_TO_CATEGORY['ラバスト'] = 'Anime';
IS_TAG_TO_CATEGORY['ポスター'] = 'Anime'; IS_TAG_TO_CATEGORY['セル画'] = 'Anime';
IS_TAG_TO_CATEGORY['原画'] = 'Anime'; IS_TAG_TO_CATEGORY['ブロマイド'] = 'Anime';
IS_TAG_TO_CATEGORY['キーホルダー'] = 'Anime';
IS_TAG_TO_CATEGORY['Animation Art'] = 'Anime';
IS_TAG_TO_CATEGORY['DVDs & Blu-ray Discs'] = 'Anime';
IS_TAG_TO_CATEGORY['Posters & Wall Scrolls'] = 'Anime';
IS_TAG_TO_CATEGORY['Keychains'] = 'Anime';
IS_TAG_TO_CATEGORY['CDs'] = 'Anime';
IS_TAG_TO_CATEGORY['Other Animation Merchandise'] = 'Anime';

// Books & Magazines
IS_TAG_TO_CATEGORY['書籍・雑誌'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['書籍'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['雑誌'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['小説'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['写真集'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['フォトブック'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['アートブック'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['図録'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['MOOK'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['ムック'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['専門誌'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['文庫'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['新書'] = 'Books & Magazines'; IS_TAG_TO_CATEGORY['絵本'] = 'Books & Magazines';
IS_TAG_TO_CATEGORY['洋書'] = 'Books & Magazines';

// Figures（フィギュアをCollectiblesから上書き）
IS_TAG_TO_CATEGORY['フィギュア'] = 'Figures'; IS_TAG_TO_CATEGORY['アクションフィギュア'] = 'Figures';
IS_TAG_TO_CATEGORY['スタチュー'] = 'Figures';
IS_TAG_TO_CATEGORY['Action Figures'] = 'Figures';
IS_TAG_TO_CATEGORY['Collectible Figures & Bobbleheads'] = 'Figures';
IS_TAG_TO_CATEGORY['Animation Figures & Statues'] = 'Figures';
IS_TAG_TO_CATEGORY['Stuffed Animals & Plush'] = 'Dolls & Plush';
IS_TAG_TO_CATEGORY['Models, Kits & Figures'] = 'Mecha Model Kits';
IS_TAG_TO_CATEGORY['Anime Figures'] = 'Figures';
IS_TAG_TO_CATEGORY['Scale Figure'] = 'Figures';
IS_TAG_TO_CATEGORY['Nendoroid'] = 'Figures';
IS_TAG_TO_CATEGORY['Plush'] = 'Dolls & Plush';
IS_TAG_TO_CATEGORY['Garage Kit'] = 'Figures';
IS_TAG_TO_CATEGORY['Trading Figure'] = 'Figures';

// Stamps
IS_TAG_TO_CATEGORY['切手'] = 'Stamps'; IS_TAG_TO_CATEGORY['記念切手'] = 'Stamps'; IS_TAG_TO_CATEGORY['普通切手'] = 'Stamps';

// Coins
IS_TAG_TO_CATEGORY['コイン'] = 'Coins'; IS_TAG_TO_CATEGORY['古銭'] = 'Coins';
IS_TAG_TO_CATEGORY['硬貨'] = 'Coins'; IS_TAG_TO_CATEGORY['紙幣'] = 'Coins';
IS_TAG_TO_CATEGORY['メダル'] = 'Coins';

// Records
IS_TAG_TO_CATEGORY['レコード'] = 'Records'; IS_TAG_TO_CATEGORY['LP'] = 'Records';
IS_TAG_TO_CATEGORY['EP'] = 'Records'; IS_TAG_TO_CATEGORY['CD'] = 'Records';
IS_TAG_TO_CATEGORY['カセット'] = 'Records';
IS_TAG_TO_CATEGORY['Vinyl Records'] = 'Records'; IS_TAG_TO_CATEGORY['LP Records'] = 'Records';
IS_TAG_TO_CATEGORY['EP Records'] = 'Records'; IS_TAG_TO_CATEGORY['45 RPM Singles'] = 'Records';
IS_TAG_TO_CATEGORY['Picture Disc'] = 'Records'; IS_TAG_TO_CATEGORY['Promo Vinyl'] = 'Records';

// ==============================
// 交通整理（Sanitize）用 追加キーワード
// 旧 CONFIG.SANITIZE_CATEGORIES にあったキーワードのうち
// IS_TAG_TO_CATEGORY に未登録だったものを補完
// ==============================

// Watches 追加
IS_TAG_TO_CATEGORY['置き時計'] = 'Watches';

// Cameras 追加
IS_TAG_TO_CATEGORY['レンズ'] = 'Cameras';

// AudioElectronics 追加（オーディオ・家電 v23 — 2026-05-01）
IS_TAG_TO_CATEGORY['Headphones'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Earbuds'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['In-Ear Monitors'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Speakers'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Subwoofers'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Bookshelf Speakers'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Amplifier'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Receiver'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Turntable'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['CD Player'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Cassette Deck'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Television'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['Soundbar'] = 'AudioElectronics';
IS_TAG_TO_CATEGORY['DAC'] = 'AudioElectronics';

// Trading Cards 追加（カードゲーム固有名詞・略称・鑑定会社）
IS_TAG_TO_CATEGORY['ポケモンカード'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['マジックザギャザリング'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['デュエマ'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['デュエルマスターズ'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['ワンピースカード'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['ヴァイスシュヴァルツ'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['ヴァンガード'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['バトスピ'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['バトルスピリッツ'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['ドラゴンボールカード'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['ガンダムカード'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['ガンダムウォー'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['アーセナルベース'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['ガンダムクロスウォー'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['カードダス'] = 'Trading Cards';
// === Baseball Cards（単品）===
IS_TAG_TO_CATEGORY['BBM']           = 'Baseball Cards';
IS_TAG_TO_CATEGORY['ベースボールカード'] = 'Baseball Cards';
IS_TAG_TO_CATEGORY['野球カード']      = 'Baseball Cards';
// === 大相撲カードは Trading Cards 残留 ===
IS_TAG_TO_CATEGORY['大相撲カード'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['PSA'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['BGS'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['CGC'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['SGC'] = 'Trading Cards';
IS_TAG_TO_CATEGORY['デジモン'] = 'Trading Cards'; IS_TAG_TO_CATEGORY['デジモンカード'] = 'Trading Cards';

// Video Game Consoles 追加（機種名・略称）
IS_TAG_TO_CATEGORY['ゲーム本体'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['コンソール'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['プレステ'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['PS1'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['Wii'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ドリームキャスト'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['サターン'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['メガドライブ'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['PCエンジン'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ネオジオ'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲームキューブ'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['Nintendo 64'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['N64'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['DS'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['3DS'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['PSP'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['PSVita'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['Steam Deck'] = 'Video Game Consoles';
// ゲーム機＋機種名（スペースなし複合タグ）→ 本体
IS_TAG_TO_CATEGORY['ゲーム機PS5'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲーム機PS4'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ゲーム機PS3'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲーム機PS2'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ゲーム機Switch'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲーム機Xbox'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ゲーム機ファミコン'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲーム機スーファミ'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ゲーム機ゲームボーイ'] = 'Video Game Consoles'; IS_TAG_TO_CATEGORY['ゲーム機Nintendo'] = 'Video Game Consoles';
IS_TAG_TO_CATEGORY['ゲーム機PlayStation'] = 'Video Game Consoles';
// ゲームソフト＋機種名（スペースなし複合タグ）→ ソフト
IS_TAG_TO_CATEGORY['ゲームソフトPS5'] = 'Video Games'; IS_TAG_TO_CATEGORY['ゲームソフトPS4'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームソフトPS3'] = 'Video Games'; IS_TAG_TO_CATEGORY['ゲームソフトPS2'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームソフトSwitch'] = 'Video Games'; IS_TAG_TO_CATEGORY['ゲームソフトXbox'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームソフトファミコン'] = 'Video Games'; IS_TAG_TO_CATEGORY['ゲームソフトスーファミ'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームソフトゲームボーイ'] = 'Video Games'; IS_TAG_TO_CATEGORY['ゲームソフトNintendo'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームソフトPlayStation'] = 'Video Games';
IS_TAG_TO_CATEGORY['ゲームマニュアル'] = 'Manuals, Inserts & Box Art'; IS_TAG_TO_CATEGORY['ゲーム説明書'] = 'Manuals, Inserts & Box Art';
IS_TAG_TO_CATEGORY['ゲーム攻略本'] = 'Strategy Guides & Cheats'; IS_TAG_TO_CATEGORY['攻略本'] = 'Strategy Guides & Cheats';
IS_TAG_TO_CATEGORY['ゲーム機コントローラー'] = 'Controllers & Attachments'; IS_TAG_TO_CATEGORY['コントローラー単品'] = 'Controllers & Attachments';
IS_TAG_TO_CATEGORY['ゲーム機充電器'] = 'Chargers & Charging Docks'; IS_TAG_TO_CATEGORY['充電ドック'] = 'Chargers & Charging Docks';
IS_TAG_TO_CATEGORY['ゲーム機ケーブル'] = 'Cables & Adapters'; IS_TAG_TO_CATEGORY['映像ケーブル'] = 'Cables & Adapters';
IS_TAG_TO_CATEGORY['ゲームまとめ'] = 'Mixed Lots'; IS_TAG_TO_CATEGORY['ゲーム機セット混在'] = 'Mixed Lots';

// Video Game Accessories 追加
IS_TAG_TO_CATEGORY['コントローラー'] = 'Video Game Accessories'; IS_TAG_TO_CATEGORY['ジョイスティック'] = 'Video Game Accessories';
IS_TAG_TO_CATEGORY['メモリーカード'] = 'Video Game Accessories'; IS_TAG_TO_CATEGORY['ゲーム周辺機器'] = 'Video Game Accessories';
IS_TAG_TO_CATEGORY['アーケードスティック'] = 'Video Game Accessories'; IS_TAG_TO_CATEGORY['ゲームパッド'] = 'Video Game Accessories';
IS_TAG_TO_CATEGORY['AVケーブル'] = 'Video Game Accessories'; IS_TAG_TO_CATEGORY['HDMIケーブル'] = 'Video Game Accessories';

// Fishing Reels 追加
IS_TAG_TO_CATEGORY['スピニングリール'] = 'Fishing Reels'; IS_TAG_TO_CATEGORY['ベイトリール'] = 'Fishing Reels';
IS_TAG_TO_CATEGORY['両軸リール'] = 'Fishing Reels'; IS_TAG_TO_CATEGORY['フライリール'] = 'Fishing Reels';
IS_TAG_TO_CATEGORY['電動リール'] = 'Fishing Reels'; IS_TAG_TO_CATEGORY['フィッシングリール'] = 'Fishing Reels';

// Fishing Rods 追加
IS_TAG_TO_CATEGORY['ジギングロッド'] = 'Fishing Rods'; IS_TAG_TO_CATEGORY['エギングロッド'] = 'Fishing Rods';
IS_TAG_TO_CATEGORY['テンカラ'] = 'Fishing Rods'; IS_TAG_TO_CATEGORY['シーバスロッド'] = 'Fishing Rods';
IS_TAG_TO_CATEGORY['アユロッド'] = 'Fishing Rods'; IS_TAG_TO_CATEGORY['渓流竿'] = 'Fishing Rods';

// Dinnerware 追加
IS_TAG_TO_CATEGORY['ボウル'] = 'Dinnerware'; IS_TAG_TO_CATEGORY['マグカップ'] = 'Dinnerware';
IS_TAG_TO_CATEGORY['ティーカップ'] = 'Dinnerware'; IS_TAG_TO_CATEGORY['ソーサー'] = 'Dinnerware';
IS_TAG_TO_CATEGORY['ティーポット'] = 'Dinnerware'; IS_TAG_TO_CATEGORY['鉢'] = 'Dinnerware';

// Fishing Lures（スペースなし複合タグ。単体タグは他カテゴリと被るため使わない）
IS_TAG_TO_CATEGORY['ルアー'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアーミノー'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアークランクベイト'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアーワーム'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアーメタルジグ'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアーエギ'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアースプーン'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアージグ'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアートップウォーター'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアーソフトベイト'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアースピナーベイト'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアーバイブレーション'] = 'Fishing Lures'; IS_TAG_TO_CATEGORY['ルアーフロッグ'] = 'Fishing Lures';
IS_TAG_TO_CATEGORY['ルアータックル'] = 'Fishing Lures';

IS_TAG_TO_CATEGORY['パソコン周辺機器'] = 'PC Peripherals';
IS_TAG_TO_CATEGORY['パソコン本体'] = 'Computers';
IS_TAG_TO_CATEGORY['電子辞書'] = 'Electronic Dictionaries';
IS_TAG_TO_CATEGORY['関数電卓'] = 'Scientific Calculators';

// Hand Tools
IS_TAG_TO_CATEGORY['手工具'] = 'Hand Tools';
IS_TAG_TO_CATEGORY['カンナ'] = 'Planes'; IS_TAG_TO_CATEGORY['鉋'] = 'Planes';
IS_TAG_TO_CATEGORY['のみ'] = 'Chisels'; IS_TAG_TO_CATEGORY['鑿'] = 'Chisels';
IS_TAG_TO_CATEGORY['コテ'] = 'Trowels'; IS_TAG_TO_CATEGORY['鏝'] = 'Trowels';
IS_TAG_TO_CATEGORY['玄能'] = 'Hammers & Mallets'; IS_TAG_TO_CATEGORY['げんのう'] = 'Hammers & Mallets';
IS_TAG_TO_CATEGORY['鋸'] = 'Saws'; IS_TAG_TO_CATEGORY['のこぎり'] = 'Saws';
IS_TAG_TO_CATEGORY['スパナ'] = 'Wrench Sets';
IS_TAG_TO_CATEGORY['墨壺'] = 'Hand Tools'; IS_TAG_TO_CATEGORY['曲尺'] = 'Hand Tools';
IS_TAG_TO_CATEGORY['プライヤー'] = 'Hand Tools'; IS_TAG_TO_CATEGORY['ノギス'] = 'Hand Tools';
IS_TAG_TO_CATEGORY['ヤスリ'] = 'Hand Tools'; IS_TAG_TO_CATEGORY['砥石'] = 'Hand Tools';

// Power Tools (Japanese tags)
IS_TAG_TO_CATEGORY['電動工具'] = 'Power Tools';
IS_TAG_TO_CATEGORY['インパクトドライバー'] = 'Impact Drivers'; IS_TAG_TO_CATEGORY['インパクトドライバ'] = 'Impact Drivers'; IS_TAG_TO_CATEGORY['インパクト'] = 'Impact Drivers';
IS_TAG_TO_CATEGORY['充電式ドライバードリル'] = 'Cordless Drills'; IS_TAG_TO_CATEGORY['ドリル'] = 'Cordless Drills';
IS_TAG_TO_CATEGORY['電動ドリル'] = 'Corded Drills'; IS_TAG_TO_CATEGORY['振動ドリル'] = 'Corded Drills'; IS_TAG_TO_CATEGORY['ハンマードリル'] = 'Corded Drills';
IS_TAG_TO_CATEGORY['丸ノコ'] = 'Circular Saws'; IS_TAG_TO_CATEGORY['丸鋸'] = 'Circular Saws'; IS_TAG_TO_CATEGORY['マルノコ'] = 'Circular Saws'; IS_TAG_TO_CATEGORY['まるのこ'] = 'Circular Saws';
IS_TAG_TO_CATEGORY['ジグソー'] = 'Jig Saws'; IS_TAG_TO_CATEGORY['じぐそー'] = 'Jig Saws'; IS_TAG_TO_CATEGORY['ジグ鋸'] = 'Jig Saws';
IS_TAG_TO_CATEGORY['レシプロソー'] = 'Reciprocating Saws'; IS_TAG_TO_CATEGORY['セーバーソー'] = 'Reciprocating Saws';
IS_TAG_TO_CATEGORY['ディスクグラインダー'] = 'Grinders'; IS_TAG_TO_CATEGORY['グラインダー'] = 'Grinders'; IS_TAG_TO_CATEGORY['アングルグラインダー'] = 'Grinders';
IS_TAG_TO_CATEGORY['サンダー'] = 'Sanders'; IS_TAG_TO_CATEGORY['オービタルサンダー'] = 'Sanders';
IS_TAG_TO_CATEGORY['トリマー'] = 'Routers & Joiners'; IS_TAG_TO_CATEGORY['ルーター'] = 'Routers & Joiners'; IS_TAG_TO_CATEGORY['ルータ'] = 'Routers & Joiners';
IS_TAG_TO_CATEGORY['電動カンナ'] = 'Planers'; IS_TAG_TO_CATEGORY['電気カンナ'] = 'Planers';
IS_TAG_TO_CATEGORY['ヒートガン'] = 'Heat Guns';
IS_TAG_TO_CATEGORY['電動ドライバー'] = 'Screw Guns & Screwdrivers'; IS_TAG_TO_CATEGORY['コードレスドライバー'] = 'Screw Guns & Screwdrivers';
// Power Tools (Category output exact match — v2 GPT-5 CRITICAL #2)
IS_TAG_TO_CATEGORY['Power Tools'] = 'Power Tools';
IS_TAG_TO_CATEGORY['Impact Drivers'] = 'Impact Drivers';
IS_TAG_TO_CATEGORY['Cordless Drills'] = 'Cordless Drills';
IS_TAG_TO_CATEGORY['Corded Drills'] = 'Corded Drills';
IS_TAG_TO_CATEGORY['Circular Saws'] = 'Circular Saws';
IS_TAG_TO_CATEGORY['Jig Saws'] = 'Jig Saws';
IS_TAG_TO_CATEGORY['Reciprocating Saws'] = 'Reciprocating Saws';
IS_TAG_TO_CATEGORY['Grinders'] = 'Grinders';
IS_TAG_TO_CATEGORY['Sanders'] = 'Sanders';
IS_TAG_TO_CATEGORY['Routers & Joiners'] = 'Routers & Joiners';
IS_TAG_TO_CATEGORY['Planers'] = 'Planers';
IS_TAG_TO_CATEGORY['Heat Guns'] = 'Heat Guns';
IS_TAG_TO_CATEGORY['Screw Guns & Screwdrivers'] = 'Screw Guns & Screwdrivers';
IS_TAG_TO_CATEGORY['Power Tool Sets'] = 'Power Tool Sets';

// Board Games
IS_TAG_TO_CATEGORY['将棋'] = 'Board Games'; IS_TAG_TO_CATEGORY['将棋セット'] = 'Board Games';
IS_TAG_TO_CATEGORY['将棋盤'] = 'Board Games'; IS_TAG_TO_CATEGORY['将棋駒'] = 'Board Games';
IS_TAG_TO_CATEGORY['麻雀'] = 'Board Games'; IS_TAG_TO_CATEGORY['麻雀セット'] = 'Board Games';
IS_TAG_TO_CATEGORY['麻雀牌'] = 'Board Games'; IS_TAG_TO_CATEGORY['マージャン'] = 'Board Games';
IS_TAG_TO_CATEGORY['囲碁'] = 'Board Games'; IS_TAG_TO_CATEGORY['囲碁セット'] = 'Board Games';
IS_TAG_TO_CATEGORY['碁盤'] = 'Board Games'; IS_TAG_TO_CATEGORY['碁石'] = 'Board Games';
IS_TAG_TO_CATEGORY['いご'] = 'Board Games';
IS_TAG_TO_CATEGORY['ボードゲーム'] = 'Board Games'; IS_TAG_TO_CATEGORY['board game'] = 'Board Games';
IS_TAG_TO_CATEGORY['卓上ゲーム'] = 'Board Games'; IS_TAG_TO_CATEGORY['アナログゲーム'] = 'Board Games';
IS_TAG_TO_CATEGORY['テーブルゲーム'] = 'Board Games';
IS_TAG_TO_CATEGORY['チェス'] = 'Board Games'; IS_TAG_TO_CATEGORY['バックギャモン'] = 'Board Games';
IS_TAG_TO_CATEGORY['オセロ'] = 'Board Games'; IS_TAG_TO_CATEGORY['リバーシ'] = 'Board Games';
IS_TAG_TO_CATEGORY['ダーツ'] = 'Board Games';

IS_TAG_TO_CATEGORY['ディズニーアナ'] = 'Disneyana';
IS_TAG_TO_CATEGORY['コカコーラグッズ'] = 'Coca-Cola Collectibles';
IS_TAG_TO_CATEGORY['ミリタリアグッズ'] = 'Militaria';
IS_TAG_TO_CATEGORY['鉄道コレクション'] = 'Railroad Collectibles';
IS_TAG_TO_CATEGORY['ヴィンテージ広告'] = 'Advertising Collectibles';
IS_TAG_TO_CATEGORY['ノベルティグッズ'] = 'Promotional Items';
IS_TAG_TO_CATEGORY['ブリキ玩具'] = 'Vintage, Antique Toys';
IS_TAG_TO_CATEGORY['貯金箱コレクション'] = 'Banks, Registers & Vending';
IS_TAG_TO_CATEGORY['季節コレクション'] = 'Holiday & Seasonal Collectibles';
IS_TAG_TO_CATEGORY['宗教コレクション'] = 'Religion & Spirituality Collectibles';
IS_TAG_TO_CATEGORY['昭和レトロ'] = 'Other Collectibles';

// ==============================
// カテゴリ別 出力フィールド定義（5-8フィールド、順序固定）
// ==============================
var IS_CATEGORY_FIELDS = {
  'Watches':       [
    'Brand',                       // 1. 必須
    'Department',                  // 2. 必須
    'Type',                        // 3. 必須
    'Model',                       // 4. 推奨
    'Reference Number',            // 5. 推奨
    'Movement',                    // 6. 推奨
    'Display',                     // 7. 推奨
    'Case Material',               // 8. 推奨
    'Case Size',                   // 9. 任意（維持）
    'Wrist Size',                  // 10. 任意（維持）
    'Dial Color',                  // 11. 推奨
    'Band Material',               // 12. 推奨
    'Water Resistance',            // 13. 推奨
    'Features',                    // 14. 推奨
    'Country of Origin',           // 15. 任意（維持）
    'With Papers',                 // 16. 推奨
    'With Original Box/Packaging'  // 17. 推奨
  ],
  'Rings':         [
    'Brand',              //  1. 必須
    'Ring Size',          //  2. 必須 (eBay MANDATORY)
    'Type',               //  3. 必須
    'Metal',              //  4. 必須
    'Metal Purity',       //  5. 必須
    'Main Stone',         //  6. 必須
    'Style',              //  7. 推奨
    'Main Stone Color',   //  8. 推奨
    'Color',              //  9. 推奨
    'Setting',            // 10. 推奨
    'Total Carat Weight', // 11. 推奨
    'Secondary Stone'     // 12. 推奨
  ],
  'Necklaces':     [
    'Style',          //  1. 必須
    'Brand',          //  2. 必須
    'Type',           //  3. 必須
    'Metal',          //  4. 必須
    'Metal Purity',   //  5. 任意（Fine Jewelry）
    'Main Stone',     //  6. 推奨
    'Color',          //  7. 推奨
    'Main Stone Color',//  8. 推奨
    'Pendant Shape',  //  9. 推奨
    'Theme',          // 10. 推奨
    'Length',         // 11. 任意（チェーン長）
    'Closure'         // 12. 任意（留め金）
  ],
  'Bracelets':     [
    'Brand',               //  1. 必須
    'Style',               //  2. 必須
    'Type',                //  3. 必須
    'Metal',               //  4. 必須
    'Metal Purity',        //  5. 必須
    'Main Stone',          //  6. 必須
    'Color',               //  7. 推奨
    'Main Stone Color',    //  8. 推奨
    'Charm Type',          //  9. 推奨（チャームブレスレット用）
    'Theme',               // 10. 任意
    'Number of Gemstones'  // 11. 推奨
  ],
  'Earrings':      [
    'Brand',               //  1. 必須
    'Style',               //  2. 必須
    'Type',                //  3. 必須
    'Metal',               //  4. 必須
    'Metal Purity',        //  5. 必須
    'Main Stone',          //  6. 必須
    'Color',               //  7. 推奨
    'Main Stone Color',    //  8. 推奨
    'Closure',             //  9. 任意
    'Main Stone Creation', // 10. 推奨
    'Theme'                // 11. 推奨
  ],
  'Handbags':      [
    'Brand',                  //  1. 必須
    'Style',                  //  2. 必須
    'Exterior Material',      //  3. 必須
    'Exterior Color',         //  4. 必須
    'Department',             //  5. 必須
    'Country of Origin',      //  6. 推奨
    'Color',                  //  7. 推奨
    'Size',                   //  8. 推奨
    'Closure',                //  9. 推奨
    'Hardware Color',         // 10. 推奨
    'Lining Material',        // 11. 推奨
    'Vintage'                 // 12. 任意
  ],
  'Clothing': [
    'Brand', 'Type', 'Department', 'Color', 'Material', 'Country of Origin',
    'Size Type', 'Size', 'Style', 'Pattern', 'Vintage', 'Gender',
  ],
  'Shoes': [
    'Brand', 'Type', 'Department', 'Color', 'Material', 'Country of Origin',
    'US Shoe Size', 'Size', 'Style', 'Pattern', 'Series', 'Vintage', 'Gender',
  ],
  'Cameras': [
    'Brand', 'Model', 'Type', 'Series', 'Color', 'Maximum Resolution', 'Battery Type', 'Features', 'Lens Mount', 'Country of Origin',
    'Optical Zoom', 'Maximum Aperture', 'Sensor Size',
  ],
  'Electronics': [
    'Brand', 'Model', 'Type', 'Connectivity', 'Features', 'Power Source', 'Color', 'Country of Origin',
    'Wireless Technology', 'Form Factor', 'Year Manufactured', 'Series', 'Number of Earpieces',
  ],
  'Trading Cards': [
    'Game', 'Set', 'Character', 'Card Name', 'Card Number', 'Rarity', 'Finish', 'Graded', 'Professional Grader', 'Grade',
    'Card Type', 'Age Level', 'Features', 'Language',
  ],
  'Baseball Cards': [
    'Player',              // AI 抽出（日本語/英語混在許容）
    'Brand',               // AI 抽出
    'Season',              // AI 抽出
    'Set',                 // AI 抽出
    'Card Type',           // AI 抽出
    'Card Number',         // AI 抽出
    'Professional Grader', // AI 抽出
    'Grade',               // AI 抽出
    'Serial Number',       // AI 抽出
    'Condition',           // AI 抽出
    'Category',            // プログラム確定値
    'Sport',               // プログラム確定値
    'Card Size',           // プログラム確定値
    'Sale Type',           // プログラム検出
    'League',              // プログラム検出
  ],
  'Brooches':      [
    'Type',               //  1. 必須
    'Brand',              //  2. 必須
    'Material',           //  3. 必須
    'Color',              //  4. 推奨
    'Metal',              //  5. 推奨
    'Main Stone',         //  6. 推奨
    'Main Stone Color',   //  7. 推奨
    'Theme',              //  8. 推奨
    'Style',              //  9. 推奨
    'Setting Style',      // 10. 推奨
    'Main Stone Creation',// 11. 推奨
    'Metal Purity'        // 12. 任意
  ],
  'Cufflinks':     [
    'Brand',               //  1. 必須
    'Type',                //  2. 必須
    'Metal',               //  3. 必須
    'Metal Purity',        //  4. 推奨
    'Main Stone',          //  5. 推奨
    'Color',               //  6. 推奨
    'Style',               //  7. 推奨
    'Main Stone Color',    //  8. 推奨
    'Diamond Color Grade', //  9. 推奨（ダイヤ品質）
    'Total Carat Weight',  // 10. 推奨（総カラット重量）
    'Theme'                // 11. 任意
  ],
  'Hair Accessories': [
    'Type', 'Brand', 'Color', 'Material', 'Hair Type', 'Country of Origin',
    'Vintage', 'Season', 'Series', 'Franchise', 'Character', 'Pattern', 'Number of Pieces',
  ],
  'Dinnerware': [
    'Brand', 'Material', 'Type', 'Color', 'Pattern', 'Shape', 'Set Includes', 'Number of Place Settings', 'Theme',
    'Country of Origin', 'Origin', 'Production Technique', 'Vintage',
  ],
  'Scarves': [
    'Brand', 'Type', 'Material', 'Color', 'Size', 'Pattern', 'Country of Origin',
    'Department', 'Vintage', 'Gender',
  ],
  'Neckties': [
    'Brand', 'Color', 'Material', 'Type', 'Pattern', 'Department', 'Item Width', 'Country of Origin',
    'Vintage',
  ],
  'Handkerchiefs': [
    'Brand', 'Color', 'Material', 'Pattern', 'Country of Origin', 'Gender',
    'Type', 'Department', 'Vintage',
  ],
  'Tie Accessories': [
    'Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Material', 'Country of Origin',
    'Vintage', 'Series', 'Number of Pieces', 'Gender',
  ],
  'Glassware': [
    'Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Pattern', 'Subject', 'Country of Origin',
    'Glassware Type', 'Origin', 'Vintage', 'Number of Pieces',
  ],
  'Snow Globes': ['Listed By', 'Brand', 'Type', 'Subject', 'Character', 'Franchise', 'Material', 'Features', 'Occasion', 'Collection', 'Year Manufactured', 'Country of Origin', 'Theme', 'Age Level'],
  'Boxes': [
    'Brand', 'Type', 'Material', 'Color', 'Suitable For', 'Shape', 'Lining Material', 'Theme',
    'Country of Origin', 'Vintage',
  ],
  'Flatware': [
    'Brand', 'Type', 'Pattern', 'Composition', 'Age', 'Country of Origin',
    'Number of Pieces', 'Material', 'Color', 'Number of Place Settings', 'Series',
  ],
  'Baby': [
    'Brand', 'Type', 'Material', 'Color', 'Character', 'Country of Origin',
    'Size', 'Age Group', 'Gender', 'Theme', 'Franchise', 'Occasion', 'Vintage', 'Pattern', 'Number of Pieces',
  ],
  'Combs': [
    'Type', 'Brand', 'Color', 'Material', 'Theme', 'Country of Origin',
    'Pattern', 'Occasion', 'Vintage', 'Season', 'Hair Type', 'Character', 'Franchise', 'Number of Pieces',
  ],
  'Key Chains': [
    'Brand', 'Material', 'Color', 'Character Family', 'Country of Origin',
    'Part Type', 'Type', 'Series', 'Character', 'Franchise', 'Vintage', 'Official/Unofficial', 'Number of Pieces',
  ],
  'Charms':        [
    'Brand',           //  1. 必須
    'Style',           //  2. 必須
    'Type',            //  3. 必須
    'Metal',           //  4. 必須
    'Color',           //  5. 推奨
    'Main Stone',      //  6. 推奨
    'Theme',           //  7. 推奨
    'Metal Purity',    //  8. 推奨
    'Pendant Shape',   //  9. 推奨
    'Charm Type',      // 10. 推奨
    'Main Stone Color' // 11. 推奨
  ],
  'Collectibles':  [
    'Brand',               //  1. 必須
    'Character',           //  2. 推奨
    'Franchise',           //  3. 推奨
    'Type',                //  4. 必須
    'Theme',               //  5. 推奨
    'Material',            //  6. 推奨
    'Size',                //  7. 推奨
    'Country of Origin',   //  8. 推奨（維持）
    'Collection',          //  9. 推奨
    'Subject',             // 10. 推奨
    'Character Family',    // 11. 推奨
    'Color',               // 12. 推奨
    'Vintage',             // 13. 任意
  ],
  'Pipes': [
    'Brand', 'Body Shape', 'Material', 'Filter Size', 'Handmade', 'Country of Origin',
    'Color', 'Type', 'Bowl Size', 'Stem Material', 'Series', 'Finish', 'Vintage', 'Year Manufactured',
  ],
  'Watch Parts': [
    'Brand', 'Part Type', 'Material', 'Compatible Model', 'Size', 'Color', 'Country of Origin',
    'Type', 'Compatible Brand', 'Movement Type', 'Finish', 'Vintage', 'Series',
  ],
  'Sunglasses': [
    'Brand', 'Model', 'Frame Color', 'Lens Color', 'Frame Material', 'Style', 'Country of Origin',
    'Type', 'Lens Technology', 'UV Protection', 'Size', 'Series', 'Vintage',
  ],
  'Video Games': [
    'Platform', 'Game Name', 'Region Code', 'Genre', 'Character', 'Publisher', 'Rating', 'Language', 'Country of Origin',
    'Release Year', 'Series', 'Franchise', 'Edition', 'Number of Players', 'Vintage',
  ],
  'Video Game Consoles': [
    'Brand', 'Platform', 'Model', 'Type', 'Storage Capacity', 'Color', 'Region Code', 'Connectivity', 'Country of Origin', 'Year Manufactured', 'Charger Included', 'Features',
  ],
  'Video Game Accessories': [
    'Brand', 'Platform', 'Type', 'Model', 'Color', 'Connectivity', 'Region Code', 'Country of Origin', 'Compatible Product', 'Compatible Model', 'Number of Players', 'Features',
  ],
  'Fishing Reels': [
    'Brand', 'Model', 'Reel Type', 'Hand Retrieve', 'Gear Ratio',
    'Ball Bearings', 'Line Capacity', 'Fishing Type', 'Fish Species', 'Country of Origin',
    'Reel Size', 'Drag Style', 'Maximum Drag',
  ],
  'Soap': [
    'Brand', 'Type', 'Scent', 'Product Line', 'Color', 'Country of Origin',
    'Ingredients', 'Body Area', 'Skin Type', 'Size', 'Item Weight', 'Series', 'Number of Pieces',
  ],
  'Dolls & Plush': [
    'Brand', 'Type', 'Character', 'Size', 'Color', 'Material', 'Country of Origin',
    'Franchise', 'Doll Gender', 'Doll Hair Color', 'Doll Eye Color', 'Doll Complexion', 'Theme', 'Vintage', 'Series', 'Year Manufactured',
  ],
  'Hats': [
    'Brand', 'Style', 'Department', 'Color', 'Material', 'Pattern', 'Size', 'Country of Origin',
    'Type', 'Character', 'Vintage', 'Official/Unofficial',
  ],
  'Guitars': [
    'Brand', 'Type', 'Model', 'Body Color', 'Body Type', 'String Configuration', 'Handedness', 'Model Year', 'Number of Frets', 'Country of Origin',
    'Series', 'Fretboard Material', 'Bridge Type',
  ],
  'Effects & Amps': [
    'Brand', 'Model', 'Type', 'Analog/Digital', 'Power Source', 'Bypass Type', 'Color', 'Features', 'Model Year', 'Country of Origin',
    'Wattage',
  ],
  'Synths & Digital':    [
    'Brand', 'Model', 'Type', 'Number of Keys', 'Analog/Digital', 'Color', 'Connectivity', 'Features', 'Model Year', 'Country of Origin',
    'Action', 'Polyphony', 'Touch Sensitivity',
  ],
  'Musical Instruments': ['Brand', 'Model', 'Type', 'Material', 'Color', 'Size', 'Key/Pitch', 'Features', 'Model Year', 'Country of Origin'],
  'Pens': [
    'Brand', 'Material', 'Ink Color', 'Nib Size', 'Nib Material', 'Type', 'Vintage', 'Country of Origin',
    'Color', 'Series', 'Designer',
  ],
  'Wallets': [
    'Brand', 'Type', 'Material', 'Color', 'Country of Origin', 'Closure',
    'Pattern', 'Gender', 'Vintage', 'Series', 'Number of Pieces',
  ],
  'Art':              ['Listed By', 'Artist', 'Production Technique', 'Subject', 'Style', 'Size', 'Material', 'Original/Licensed Reproduction', 'Time Period Produced', 'Country of Origin', 'Framing', 'Signed'],
  'Kakejiku':      ['Artist', 'Production Technique', 'Support', 'Mounting Type', 'Scroll Rod Material', 'Box Type', 'Subject', 'Size', 'Time Period Produced', 'Country of Origin', 'Style', 'Season'],
  'Pottery':       ['Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Origin/Kiln', 'Style', 'Pattern', 'Size', 'Country of Origin', 'Era/Period', 'Maker', 'Glaze/Finish', 'Subject'],
  'Belts': [
    'Brand', 'Type', 'Material', 'Color', 'Size', 'Country of Origin',
    'Closure', 'Pattern', 'Size Type', 'Belt Width', 'Accents', 'Vintage',
  ],
  'Belt Buckles':  [
    'Brand', 'Type', 'Material', 'Color', 'Fits Belt Width', 'Pattern', 'Country of Origin',
    'Size', 'Performance/Activity', 'Vintage',
  ],
  'Golf Heads':          [
    'Brand', 'Golf Club Type', 'Loft', 'Handedness', 'Material', 'Model', 'Lie Angle', 'Head Shape', 'Bounce', 'Country of Origin',
    'Head Size', 'Shaft Compatibility', 'Finish',
  ],
  'Kimono':          ['Brand', 'Type', 'Material', 'Color', 'Pattern', 'Season', 'Size', 'Technique/Weave', 'Country of Origin', 'Era', 'Department', 'Occasion'],
  'Japanese Swords':     ['Type', 'Material', 'Technique', 'Era/Period', 'School/Maker', 'Motif/Subject', 'Size', 'Color', 'Original/Reproduction', 'Country of Origin'],
  'Tea Ceremony':       ['Type', 'Material', 'Maker', 'Origin/Kiln', 'Era/Period', 'Box Type', 'Size', 'Motif/Subject', 'Pattern', 'Country of Origin', 'Color'],
  'Bonsai':              ['Type', 'Material', 'Size', 'Color', 'Shape', 'Maker/Kiln', 'Era/Period', 'Glaze/Finish', 'Drainage Holes', 'Country of Origin'],
  'Prints':           ['Listed By', 'Medium', 'Subject', 'Maker', 'Style', 'Size', 'Era/Period', 'Original/Licensed Reproduction', 'Edition', 'Country of Origin', 'Series', 'Framing', 'Signed'],
  'Buddhist Art':       ['Type', 'Material', 'Subject/Deity', 'Maker', 'Technique', 'Style', 'Size', 'Era', 'Original/Reproduction', 'Country of Origin'],
  'Tetsubin':           ['Brand', 'Type', 'Material', 'Maker/Kiln', 'Era/Period', 'Technique', 'Pattern', 'Size', 'Capacity', 'Country of Origin'],
  'Golf':                [
    'Brand',               //  1. 必須
    'Golf Club Type',      //  2. 必須
    'Handedness',          //  3. 推奨
    'Model',               //  4. 推奨
    'Flex',                //  5. 推奨
    'Shaft Material',      //  6. 推奨
    'Loft',                //  7. 推奨
    'Club Number',         //  8. 推奨
    'Set Makeup',          //  9. 推奨
    'Country of Origin',   // 10. 推奨（維持）
    'Bounce',              // 11. 推奨
    'Head Shape',          // 12. 推奨
    'Lie Angle'            // 13. 推奨
  ],
  'Tennis': [
    'Brand', 'Type', 'Head Size', 'Grip Size', 'String Pattern', 'Weight', 'Country of Origin',
    'Model', 'Flex', 'Balance', 'Color', 'Material', 'Level', 'Series', 'Gender', 'Age Group', 'Vintage',
  ],
  'Baseball': [
    'Brand',               //  1. 必須
    'Handedness',          //  2. 推奨
    'Player Position',     //  3. 推奨
    'Size',                //  4. 推奨（eBay 必須）
    'Type',                //  5. 必須
    'Material',            //  6. 推奨
    'Color',               //  7. 推奨（eBay 必須）
    'Sport/Activity',      //  8. 推奨
    'Country of Origin',   //  9. 推奨（維持）
    'Model Year',          // 10. 推奨（維持）
    'Experience Level',    // 11. 推奨
    'Lining Material',     // 12. 推奨
    'Vintage',             // 13. 任意
    'Series/Line',         // 14. 任意
  ],
  'Japanese Instruments': ['Type', 'Material', 'Maker', 'Subtype', 'Key/Pitch', 'Era/Period', 'Size', 'Color', 'Set Includes', 'Country of Origin'],
  'Fishing Rods':        [
    'Brand',           //  1. 必須
    'Rod Type',        //  2. 必須
    'Model',           //  3. 必須
    'Item Length',     //  4. 推奨
    'Rod Power',       //  5. 推奨
    'Rod Action',      //  6. 推奨
    'Fish Species',    //  7. 推奨
    'Fishing Type',    //  8. 推奨
    'Material',        //  9. 推奨（Carbon / Fiberglass / Composite）
    'Country of Origin', // 10. 推奨
    'Pieces',          // 11. 推奨（ピース数/継数）
    'Line Weight',     // 12. 推奨（適合ライン lb/kg）
  ],
  'Fishing Lures':       [
    'Brand', 'Type', 'Model', 'Bait Type', 'Color', 'Weight', 'Buoyancy', 'Fishing Type', 'Fish Species', 'Item Length', 'Number in Pack', 'Country of Origin',
  ],
  'Mecha Model Kits': ['Listed By', 'Brand', 'Series/Franchise', 'Character/Mecha', 'Grade', 'Scale', 'Type', 'Built Status', 'Release Year', 'Country of Origin', 'Features', 'Theme', 'Age Level'],
  'RC & Models': ['Listed By', 'Brand', 'Type', 'Scale', 'Vehicle Type', 'Model/Series', 'Power Type', 'Built Status', 'Country of Origin', 'Motor Type', '4WD/2WD', 'Year Manufactured', 'Features', 'Age Level'],
  'Manga': ['Listed By', 'Title', 'Author', 'Volume/Set', 'Format', 'Publisher', 'Language', 'Genre', 'Edition', 'Country of Origin', 'Theme', 'Publication Year', 'Features', 'Age Level'],
  'Anime': ['Listed By', 'Character', 'Franchise', 'Type', 'Official/Unofficial', 'Brand', 'Year', 'Country of Origin', 'TV Show', 'Theme', 'Edition', 'Features', 'Age Level', 'Material'],
  'Figures': ['Listed By', 'Franchise', 'Character', 'Type', 'Brand', 'Scale', 'Material', 'Series/Line', 'Release Year', 'Country of Origin', 'Theme', 'Age Level', 'Features'],
  'Stamps': [
    'Certification', 'Type', 'Year of Issue', 'Topic', 'Quality', 'Country of Origin',
    'Grade', 'Series', 'Denomination', 'Vintage', 'Number of Pieces',
  ],
  'Coins': [
    'Certification', 'Denomination', 'Year', 'Composition', 'Grade', 'Country of Origin',
    'Type', 'Series', 'Mint', 'Theme', 'Finish', 'Vintage', 'Number of Pieces',
  ],
  'Records': [
    'Artist', 'Release Title', 'Genre', 'Record Grading', 'Record Label', 'Format', 'Record Size', 'Release Year', 'Sleeve Grading', 'Country of Origin',
    'Material', 'Type', 'Color', 'Speed', 'Edition', 'Pressing Country', 'Vintage',
  ],
  'Kitchen Knives': [
    'Type', 'Brand', 'Blade Material', 'Blade Length', 'Handle Material', 'Edge Type', 'Handedness', 'Maker/Blacksmith', 'Country of Origin', 'Condition',
    'Vintage', 'Series', 'Number of Pieces',
  ],
  'Japanese Dolls': [
    'Type', 'Material', 'Maker', 'Origin/Region', 'Era/Period', 'Size', 'Technique', 'Subject/Motif', 'Original/Reproduction', 'Country of Origin', 'Theme', 'Age Level',
  ],
  'Books & Magazines': [
    'Author/Artist', 'Publisher', 'Language', 'Format',
    'Year Published', 'Country of Origin', 'Subject', 'ISBN',
    'Issue Number', 'Brand', 'Vintage', 'Series',
  ],

  // --- Board Games 追加 ---
  'Board Games': [
    'Game Title', 'Game Type', 'Brand', 'Number of Players', 'Age Level',
    'Language', 'Material', 'Country of Origin', 'Year Manufactured',
    'Vintage', 'Contents', 'Condition',
  ],
  'PC Peripherals': [
    'Brand', 'Model', 'Type', 'Connectivity', 'Compatibility',
    'Color', 'Features', 'Country of Origin', 'Power Source', 'Condition',
  ],
  'Electronic Dictionaries': [
    'Brand', 'Model', 'Type', 'Dictionary Language', 'Number of Dictionaries',
    'Screen Size', 'Features', 'Power Source', 'Country of Origin',
    'Color', 'Condition',
  ],
  'Scientific Calculators': [
    'Brand', 'Model', 'Type', 'Display Lines', 'Display Type',
    'Power Source', 'Country of Origin', 'Year Manufactured',
    'Number of Functions', 'Color', 'Condition',
  ],
  'Hand Tools': ['Brand', 'Type', 'Country/Region of Manufacture', 'Condition'],
  'Power Tools': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Impact Drivers': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Cordless Drills': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Corded Drills': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Circular Saws': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Jig Saws': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Reciprocating Saws': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Grinders': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Sanders': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Routers & Joiners': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Planers': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Heat Guns': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Screw Guns & Screwdrivers': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Power Tool Sets': ['Brand', 'Type', 'Voltage', 'Power Source', 'Country/Region of Manufacture', 'Condition'],
  'Planes': ['Brand', 'Type', 'Blade Material', 'Country/Region of Manufacture', 'Condition'],
  'Chisels': ['Brand', 'Type', 'Blade Material', 'Country/Region of Manufacture', 'Condition'],
  'Hammers & Mallets': ['Brand', 'Type', 'Material', 'Country/Region of Manufacture', 'Condition'],
  'Saws': ['Brand', 'Type', 'Blade Material', 'Country/Region of Manufacture', 'Condition'],
  'Trowels': ['Brand', 'Type', 'Material', 'Country/Region of Manufacture', 'Condition'],
  'Wrench Sets': ['Brand', 'Type', 'Number of Pieces', 'Country/Region of Manufacture', 'Condition'],
  'Laptops': [
    'Brand', 'Model', 'Type', 'Series', 'Processor', 'Processor Speed',
    'RAM Size', 'SSD Capacity', 'Hard Drive Capacity', 'Storage Type',
    'Operating System', 'Screen Size', 'Screen Resolution',
    'Graphics Processing Type', 'GPU', 'Color', 'Connectivity',
    'Year Manufactured', 'Condition',
  ],
  'Desktops': [
    'Brand', 'Model', 'Type', 'Processor', 'RAM Size', 'SSD Capacity',
    'Hard Drive Capacity', 'Operating System', 'Form Factor', 'GPU',
    'Color', 'Connectivity', 'Year Manufactured', 'Condition',
  ],
  'Tablets': [
    'Brand', 'Model', 'Storage Capacity', 'Operating System',
    'Screen Size', 'Internet Connectivity', 'Color', 'RAM Size',
    'Processor', 'Battery Run Time', 'Connectivity',
    'Year Manufactured', 'Condition',
  ],
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
      {cat: 'Collectibles', desc: 'コレクティブル・アンティーク・ヴィンテージ・ブリキ玩具・ノベルティ・ミリタリア'},
      {cat: 'Dolls & Plush', desc: 'ドール・ぬいぐるみ'},
      {cat: 'Guitars', desc: 'ギター・ベース・ウクレレ'},
      {cat: 'Effects & Amps', desc: 'エフェクター・アンプ・マルチエフェクター'},
      {cat: 'Synths & Digital', desc: 'シンセサイザー・キーボード・サンプラー・DJ機材'},
      {cat: 'Musical Instruments', desc: 'ドラム・管楽器・パーカッション・弦楽器（非ギター）'},
      {cat: 'Art', desc: '絵画・油絵・日本画・水墨画'},
      {cat: 'Kakejiku', desc: '掛軸・掛け軸'},
      {cat: 'Figures', desc: 'フィギュア・アクションフィギュア・スタチュー'},
      {cat: 'Anime', desc: 'アニメグッズ（キーホルダー・缶バッジ・タペストリー等）'},
      {cat: 'Manga', desc: '漫画・コミック・同人誌・画集'},
      {cat: 'Mecha Model Kits', desc: 'ガンプラ・ロボット系プラモデル（ガンダム/エヴァ/マクロス/ゾイド等）'},
      {cat: 'RC & Models', desc: 'ラジコン・モデルカー・ミニ四駆・スケールモデル'},
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
      {cat: 'Fishing Reels', desc: '釣りリール'},
      {cat: 'Fishing Lures', desc: 'ルアー・釣具・タックル'}
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
  var sanitizeCategories = ['watch', 'camera', 'card', 'game', 'reel', 'lure'];
  var sanitizeMap = {
    'Watches': 'watch', 'Cameras': 'camera', 'Trading Cards': 'card',
    'Video Games': 'game', 'Video Game Consoles': 'game', 'Video Game Accessories': 'game', 'Fishing Reels': 'reel', 'Fishing Lures': 'lure'
  };

  // --- ヘッダー ---
  var COLS = 24; // A〜X
  var headers = ['タグ（入力用）', 'eBayカテゴリ', '対応状況', 'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8', 'Field 9', 'Field 10', 'Field 11', 'Field 12', 'Field 13', 'Field 14', 'Field 15', 'Field 16', 'Field 17', 'Field 18', 'Field 19', 'Field 20', 'Field 21'];

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
        for (var f = 0; f < 21; f++) {
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
  for (var w = 4; w <= 24; w++) {
    sh.setColumnWidth(w, 160);
  }

  // フィルター設定
  if (sh.getFilter()) sh.getFilter().remove();
  sh.getRange(1, 1, allRows.length, COLS).createFilter();

  var tagCount = statusColors.length;
  return {success: true, message: 'Tag_Listシートにタグ一覧を出力しました', count: tagCount};
}
