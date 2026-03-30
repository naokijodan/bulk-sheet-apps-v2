/**
 * LightTranslation.gs
 *
 * 交通整理済みデータ（AW列の英語構造化データ）を活用した軽量翻訳プロンプト。
 * 全カテゴリ対応（35カテゴリ + フォールバック）。
 */

// ============================================================
// タグ → 軽量翻訳カテゴリ マッピング（Config.gs PROMPT_TAG_MAPPING準拠）
// ============================================================
var LIGHT_TAG_MAP_ = {
  // Fishing
  'リール': 'reels', '電動リール': 'reels',
  '釣竿': 'rods', 'ロッド': 'rods', '竿': 'rods',
  'ルアー': 'tackle', '釣り': 'tackle', 'フィッシング': 'tackle',
  // Watches
  '時計': 'watches', '腕時計': 'watches', 'ウォッチ': 'watches',
  '懐中時計': 'watches', '時計パーツ': 'watches', 'ウォッチパーツ': 'watches', '時計部品': 'watches',
  // Cameras
  'カメラ': 'cameras', 'デジカメ': 'cameras', '一眼レフ': 'cameras', 'ミラーレス': 'cameras',
  // Golf
  'ゴルフ': 'golf', 'ゴルフクラブ': 'golf', 'ゴルフヘッド': 'golf',
  // Jewelry
  'ネックレス': 'jewelry', 'リング': 'jewelry', '指輪': 'jewelry',
  'ブレスレット': 'jewelry', 'ピアス': 'jewelry', 'イヤリング': 'jewelry',
  'ブローチ': 'jewelry', 'カフリンクス': 'jewelry', 'カフスボタン': 'jewelry',
  'チャーム': 'jewelry', 'ペンダントトップ': 'jewelry',
  // Gaming (consoles)
  'ゲーム機': 'gaming',
  // Games (software)
  'ゲーム': 'games', 'ゲームソフト': 'games',
  // Trading Cards (TCG)
  'ポケカ': 'cards', 'ポケモンカード': 'cards', '遊戯王': 'cards',
  'MTG': 'cards', 'マジックザギャザリング': 'cards', 'トレカ': 'cards', 'トレーディングカード': 'cards',
  'デュエマ': 'cards', 'ヴァイスシュヴァルツ': 'cards', 'ヴァンガード': 'cards',
  'バトスピ': 'cards', 'ドラゴンボールカード': 'cards',
  // Baseball Cards
  'ベースボールカード': 'baseball_cards', '野球カード': 'baseball_cards', 'BBM': 'baseball_cards',
  // Sumo Cards
  '大相撲カード': 'sumo_cards',
  // Figures
  'フィギュア': 'figures', 'アクションフィギュア': 'figures', 'ドール': 'figures',
  'ぬいぐるみ': 'figures', 'アニメ': 'figures', 'アニメグッズ': 'figures',
  // Sneakers
  'スニーカー': 'sneakers',
  // Dress Shoes
  '靴': 'dress_shoes', 'シューズ': 'dress_shoes', 'ブーツ': 'dress_shoes',
  'パンプス': 'dress_shoes', 'ローファー': 'dress_shoes',
  // Apparel
  '衣類': 'apparel', '服': 'apparel', '帽子': 'apparel', 'キャップ': 'apparel',
  'スカーフ': 'apparel', 'マフラー': 'apparel', 'ストール': 'apparel',
  'ベルト': 'apparel', 'ベルトバックル': 'apparel', 'ネクタイ': 'apparel',
  'ネクタイピン': 'apparel', 'タイピン': 'apparel', 'ハンカチ': 'apparel',
  'ヘアアクセサリー': 'apparel', 'バレッタ': 'apparel', 'かんざし': 'apparel', '髪飾り': 'apparel',
  // Leather Goods
  'バッグ': 'leather', '財布': 'leather', '長財布': 'leather',
  'キーケース': 'leather', 'パスケース': 'leather', 'カードケース': 'leather', '手帳カバー': 'leather',
  // Audio & Electronics
  'オーディオ': 'audio', '家電': 'audio', 'ヘッドホン': 'audio',
  'イヤホン': 'audio', 'スピーカー': 'audio', '電子機器': 'audio',
  // Instruments
  '楽器': 'instruments', 'ギター': 'instruments', 'ベース': 'instruments',
  'キーボード': 'instruments', 'シンセサイザー': 'instruments', 'バイオリン': 'instruments',
  'フルート': 'instruments', 'サックス': 'instruments', 'トランペット': 'instruments',
  'ドラム': 'instruments', 'ウクレレ': 'instruments', 'ハーモニカ': 'instruments',
  'エフェクター': 'instruments', 'アンプ': 'instruments',
  // Japanese Instruments
  '三味線': 'japanese_instruments', '尺八': 'japanese_instruments', '琴': 'japanese_instruments',
  '太鼓': 'japanese_instruments', '和太鼓': 'japanese_instruments', '篠笛': 'japanese_instruments',
  '琵琶': 'japanese_instruments', '鼓': 'japanese_instruments',
  // RC & Models
  'ラジコン': 'rc_models', 'RC': 'rc_models', '模型': 'rc_models',
  'プラモデル': 'rc_models', 'ミニ四駆': 'rc_models', '鉄道模型': 'rc_models',
  // Records
  'レコード': 'records', 'LP': 'records', 'EP': 'records', 'CD': 'records', 'カセット': 'records',
  // Sunglasses
  'サングラス': 'sunglasses', 'メガネ': 'sunglasses', '眼鏡': 'sunglasses',
  // Pens
  '万年筆': 'pens', 'ボールペン': 'pens', 'ペン': 'pens',
  'シャープペンシル': 'pens', '筆記具': 'pens', 'メカニカルペンシル': 'pens',
  // Tennis
  'テニス': 'tennis', 'テニスラケット': 'tennis', 'ラケット': 'tennis',
  // Baseball (equipment)
  '野球': 'baseball', 'グローブ': 'baseball', 'グラブ': 'baseball', 'バット': 'baseball', 'ミット': 'baseball',
  // Sportswear
  'ユニフォーム': 'sportswear', 'ジャージ': 'sportswear', 'トレーニングウェア': 'sportswear',
  'ゴルフウェア': 'sportswear', 'スキーウェア': 'sportswear', '水着': 'sportswear',
  // Kimono
  '着物': 'kimono', '和装': 'kimono', '振袖': 'kimono', '留袖': 'kimono',
  '訪問着': 'kimono', '浴衣': 'kimono', '帯': 'kimono', '袴': 'kimono',
  // Swords
  '日本刀': 'swords', '刀': 'swords', '脇差': 'swords', '短刀': 'swords',
  '太刀': 'swords', '刀装具': 'swords', '鍔': 'swords', '目貫': 'swords',
  // Japanese Antiques
  '茶道具': 'japanese_antiques', '茶碗': 'japanese_antiques', '鉄瓶': 'japanese_antiques',
  '急須': 'japanese_antiques', '南部鉄器': 'japanese_antiques', '仏像': 'japanese_antiques',
  '仏具': 'japanese_antiques', '仏教美術': 'japanese_antiques', '陶磁器': 'japanese_antiques',
  '陶器': 'japanese_antiques', '磁器': 'japanese_antiques', '焼物': 'japanese_antiques', '香炉': 'japanese_antiques',
  // Art
  '絵画': 'art', '版画': 'art', 'リトグラフ': 'art', '油絵': 'art',
  '水彩画': 'art', '木版画': 'art', '浮世絵': 'art', 'シルクスクリーン': 'art', '掛軸': 'art',
  // Pipes
  'パイプ': 'pipes', '喫煙パイプ': 'pipes', '煙管': 'pipes', 'キセル': 'pipes', 'パイプ・喫煙具': 'pipes',
  // Tableware
  '皿': 'tableware', 'プレート': 'tableware', '食器': 'tableware',
  'カップ': 'tableware', 'グラス': 'tableware', 'ワイングラス': 'tableware',
  'クリスタル': 'tableware', 'カトラリー': 'tableware', 'スプーン': 'tableware',
  'フォーク': 'tableware', '包丁': 'tableware', '切子': 'tableware'
};

// ============================================================
// カテゴリ別 SEO ルール定数（35カテゴリ）
// ============================================================
var LIGHT_TRANSLATION_RULES_ = {

  reels: {
    role: 'fishing reels and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 30 chars): Shimano, Daiwa, Abu Garcia, Penn, Okuma', '2. Model Line: Stella, Exist, Metanium, Certate', '3. Size/Number: 2500, C3000, 4000XG', '4. Reel Type: Spinning Reel, Baitcasting Reel, Fly Reel, Electric Reel', '5. Gear Info: High Gear, Extra High Gear, Power Gear', '6. Handle: Left Hand, Right Hand', '7. Bonus: Vintage, Rare, Japan Made'],
    specificRules: ['Shimano gear codes: XG=Extra High Gear, HG=High Gear, PG=Power Gear, C=Compact body. Keep code in title, expand in Description.', 'Daiwa gear codes: H=High Gear, SH=Super High Gear, P=Power Gear.', 'Electric reels: include voltage (12V/24V) and line counter if available.'],
    descSpecs: 'Reel Type, Gear Ratio, Bearings, Max Drag, Weight, Line Capacity, Handle Orientation, Body Material, Accessories, Defects',
    productNameFmt: '[Brand] [Model] [Size] [Reel Type]',
    categoryOptions: 'Fishing Reels, Reel Parts & Repair'
  },

  rods: {
    role: 'fishing rods and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars): Shimano, Daiwa, Gamakatsu, Major Craft', '2. Model Line', '3. Model Number', '4. Rod Type: Spinning Rod, Casting Rod, Fly Rod, Surf Casting Rod, Boat Rod, ISO Rod', '5. Length (if not in model number)', '6. Power', '7. Bonus: Japan, Rare, Limited'],
    specificRules: ['Rod type mapping: スピニング=Spinning Rod, ベイト=Casting Rod, フライ=Fly Rod, 磯竿=ISO Rod, 投げ竿=Surf Casting Rod, 船竿=Boat Rod.', 'Length in both ft AND m.'],
    descSpecs: 'Rod Type, Model, Length(ft/m), Power, Action, Sections, Collapsed Length, Lure Weight, Line Rating, Weight, Guide Type, Material, Grip, Target Fish, Accessories, Defects',
    productNameFmt: '[Brand] [Model Line] [Model Number] [Rod Type]',
    categoryOptions: 'Spinning Rods, Casting Rods, Fly Fishing Rods, Surf Rods, Rod Building & Repair'
  },

  tackle: {
    role: 'fishing lures and tackle and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Model', '3. Product Type: Minnow, Crankbait, Jig, Soft Plastic', '4. Size/Weight', '5. Color', '6. Buoyancy: Floating, Sinking, Suspending', '7. Bonus: Japan, Rare, Discontinued'],
    specificRules: ['Weight in g AND oz. Length in mm AND inch.', 'Product type mapping: ミノー=Minnow, クランク=Crankbait, ワーム=Soft Plastic, フック=Hook, ジグ=Jig Head, PEライン=Braided Line/PE Line.'],
    descSpecs: 'Lure/Product Type, Model, Weight(g/oz), Length(mm/inch), Buoyancy, Diving Depth, Color, Hook Specs, Target Fish, Quantity, Made in Japan, Defects',
    productNameFmt: '[Brand] [Model] [Lure/Product Type]',
    categoryOptions: 'Hard Baits, Soft Baits, Jigs, Spoons, Terminal Tackle, Fishing Line, Fishing Accessories'
  },

  watches: {
    role: 'luxury and vintage watches and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 30 chars)', '2. Collection/Line: Prospex, Presage, Grand Seiko, Speedmaster', '3. Movement: Automatic, Quartz, Mechanical, Solar, Kinetic', '4. Watch Type: Chronograph, Diver, Dress Watch, GMT, World Time', '5. Case Size: 42mm, 38mm', '6. Gender: Mens, Womens, Unisex', '7. Ref/Cal number', '8. Bonus: Vintage, Rare, Limited, JDM'],
    specificRules: ['Wrist size conversion (CRITICAL): cm / 2.54 = inches (1 decimal). Format: "wrist 18cm/7.1in". Range: use max value.', 'Display type: ONLY if explicitly stated (Digital, Analog, Analog and Digital). Never guess.', 'Pocket watches: Watch Type="Pocket Watch", category="Pocket Watches".'],
    descSpecs: 'Case Diameter, Thickness, Movement/Caliber, Crystal, Water Resistance, Band, Dial Color, Display (only if stated), Wrist Size (cm/inches), Accessories, Defects',
    productNameFmt: '[Brand] [Collection/Model] [Watch Type]',
    categoryOptions: 'Wristwatches, Pocket Watches, Watch Parts & Accessories, Clocks'
  },

  cameras: {
    role: 'digital and film cameras and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 30 chars): Canon, Nikon, Sony, Fujifilm, Olympus, Pentax, Leica, Contax, Mamiya, Hasselblad', '2. Model: EOS 5D Mark IV, Alpha a7 III, D850, X-T5', '3. Camera Type: DSLR, Mirrorless, Compact, Film Camera, Rangefinder, TLR, Medium Format', '4. Series: Alpha, EOS, Z, X, GR, Lumix', '5. Resolution: 24.2MP (万画素/100=MP)', '6. Lens: "w/ 18-55mm f/3.5-5.6" or "Body Only"', '7. Color', '8. Bonus: Vintage, Rare, Low Shutter Count'],
    specificRules: ['Lens: "w/ {lens}" format or "Body Only". Copy focal length/F-value exactly.', 'Shutter count in Description. Low (<=10000) add "Low Shutter" to title.', 'Keep model numbers exact. Do not modify.', 'Battery: Digital=Lithium-Ion. Mechanical film(no meter)=N/A. Film SLR with meter=Button Cell/CR123A.'],
    descSpecs: 'Sensor, Resolution, Lens Mount, Lens Details, Shutter Count, Battery, Video, Color, Accessories, Defects',
    productNameFmt: '[Brand] [Model] [Camera Type]',
    categoryOptions: 'Digital Cameras, Film Cameras, Lenses & Filters, Camera Drones, Camcorders'
  },

  golf: {
    role: 'golf clubs and equipment and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 30 chars): Titleist, TaylorMade, Callaway, Ping, Mizuno', '2. Model: TSR3, Stealth 2, Paradym, G430', '3. Club Type: Driver, Iron Set, Putter, Wedge, Fairway Wood, Hybrid', '4. Loft: 9.5deg, 56deg, 5-PW Iron Set', '5. Shaft + Flex: Graphite/Steel + Regular/Stiff/X-Stiff', '6. Left-Handed (only if left)', '7. Bonus: Head Only, Japan Spec, Tour Issue'],
    specificRules: ['Loft: Driver=9.5deg, Wedge=56deg, Iron set=5-PW.', 'Flex: R=Regular, S=Stiff, SR=Regular-Stiff, X=X-Stiff, L=Ladies, A=Senior.', 'Head only: add "Head Only" if no shaft.', 'Left-handed: Only add if explicitly stated.'],
    descSpecs: 'Club Type, Loft, Shaft, Flex, Length, Grip, Head Material, Volume, Lie Angle, Bounce, Set Config, Head Cover, Handed, Defects',
    productNameFmt: '[Brand] [Model] [Club Type]',
    categoryOptions: 'Drivers, Fairway Woods, Iron Sets, Wedges, Putters, Golf Club Sets'
  },

  jewelry: {
    role: 'luxury jewelry and SEO optimization',
    titleMin: 65, titleMax: 80,
    seoOrder: ['1. Brand (first 25 chars) or Material if unknown', '2. Product Type: Ring, Necklace, Bracelet, Earrings, Brooch', '3. Collection: Love, Trinity, No 158', '4. Material: 18K Gold, Platinum, Sterling Silver, Gold Tone, Silver Tone', '5. Gold Color (confirmed only): White Gold, Yellow Gold, Rose Gold', '6. Stone: Diamond, Ruby, Sapphire, Pearl', '7. Size: Ring=US6, Chain=45cm/18in', '8. Missing: No Box, No Papers'],
    specificRules: ['Ring size JP→US: JP5=US3, JP7=US4, JP9=US5, JP11=US6, JP13=US7, JP15=US8, JP17=US9, JP19=US10, JP21=US10.5, JP23=US11.', 'Chain: cm/2.54=inch. Title: "45cm/18in".', 'Material (CRITICAL): K18=18K Gold, Pt950=Platinum, SV925=Sterling Silver. Color only (no purity mark)=Gold Tone/Silver Tone. NEVER guess purity.', 'Unknown brand: Do NOT put "Unbranded" in title. Start with material.', 'Title <65: expand. Title >80: shorten (NB/NP, round length). Never remove Brand, Type, Material, Size.'],
    descSpecs: 'Material/Purity, Tone, Gold Color, Stone, Ring Size (US+JP), Dimensions (cm/inches), Weight, Serial, Country, Missing Accessories, Defects',
    productNameFmt: '[Brand] [Collection] [Product Type]',
    categoryOptions: 'Fine Rings, Fine Necklaces, Fine Bracelets, Fine Earrings, Fashion Rings, Fashion Necklaces'
  },

  gaming: {
    role: 'video game consoles and retro gaming and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 30 chars): Nintendo, Sony, Sega, Microsoft, SNK, NEC', '2. Console Name (JP market names): Super Famicom (NOT SNES), Famicom (NOT NES), Mega Drive (NOT Genesis), PC Engine (NOT TurboGrafx)', '3. Model Variant: Slim, Pro, Lite, OLED', '4. Edition: Limited, Special Color', '5. Color', '6. Region: "NTSC-J Japan" (REQUIRED)', '7. Bundle: "w/ Controller", "Console Only"', '8. Bonus: Vintage, Retro, Tested'],
    specificRules: ['Japanese console names MUST use JP market names.', 'ALL Japanese consoles must include "NTSC-J" or "Japan".', 'Model numbers in Description only if in input.'],
    descSpecs: 'Console Type, Model Variant, Color, Storage, Connectivity, Region (NTSC-J), Accessories, Defects',
    productNameFmt: '[Brand] [Console Name] [Type]',
    categoryOptions: 'Video Game Consoles, Controllers & Attachments'
  },

  games: {
    role: 'video games and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Game Title', '2. Platform (PS1, PS2, Switch, etc.)', '3. NTSC-J (REQUIRED for JP consoles)', '4. Completeness: CIB, Game Only, Loose', '5. Japan Import / Japanese', '6. Retro / Classic / Vintage (if applicable)', '7. Limited Edition'],
    specificRules: ['NTSC-J required for: PS1/PS2/PS3/SFC/N64/GC/Wii/DC/SS/MD/PCE/GBA/GBC/GB/FC.', 'Completeness: CIB=Complete in Box, Game Only, Loose, No Manual.', 'Condition words PROHIBITED in title.'],
    descSpecs: 'Game Title, Platform, Region (NTSC-J), Language (Japanese), Completeness Details, Disc Count, Special Edition Contents, Obi, Tested Status, Defects',
    productNameFmt: '[Game Title] [Platform]',
    categoryOptions: 'Video Games, Manuals & Guides'
  },

  cards: {
    role: 'trading cards (Pokemon TCG, Yu-Gi-Oh, MTG) and SEO optimization',
    titleMin: 60, titleMax: 80,
    seoOrder: ['GRADED: 1. Grade (PSA 10 first), 2. Card Name, 3. Number, 4. Rarity, 5. Set, 6. Year, 7. Japanese, 8. Game Name', 'RAW: 1. Card Name, 2. Number, 3. Rarity, 4. Set, 5. Year, 6. Condition, 7. Japanese, 8. Game Name'],
    specificRules: ['PSA/BGS grade at VERY START of title.', 'Card numbers EXACTLY as-is.', 'Rarity codes as-is (SAR, SR, UR, AR, HR).', '"Japanese" MUST be in title.', 'Game identifier at end: "Pokemon TCG", "Yu-Gi-Oh", "MTG" etc.', 'PROHIBITED: Mint, Excellent, Good, Authentic, Amazing.'],
    descSpecs: 'Grade Details, Card Name, Set Name, Card Number, Rarity and Meaning, Language (Japanese), Defects',
    productNameFmt: '[Card Name] [Rarity] [Set Name]',
    categoryOptions: 'Pokemon Individual Cards, Yu-Gi-Oh Individual Cards, MTG Individual Cards'
  },

  baseball_cards: {
    role: 'baseball cards and sports cards and SEO optimization',
    titleMin: 70, titleMax: 80,
    seoOrder: ['1. Year', '2. Brand', '3. Player Name', '4. Card Type (Auto, Relic, RC, Base)', '5. Set Name', '6. Card Number', '7. Serial (/999, /99, /50)', '8. Grade (PSA/BGS)'],
    specificRules: ['Serial format: /999, /99, /50, /25, /10, /5, /1.', 'RC = Rookie Card (abbreviation OK).', 'Auto = Autograph. Specify on-card or sticker.', 'Graded cards: grade at start. Raw: NM/LP/MP/HP.'],
    descSpecs: 'Player, Team, Year, Brand, Set, Card Number, Card Type, Condition/Grade, Serial Number, Auto Type',
    productNameFmt: '[Year] [Brand] [Player] [Type]',
    categoryOptions: 'Baseball Cards'
  },

  sumo_cards: {
    role: 'sumo wrestling cards and SEO optimization',
    titleMin: 70, titleMax: 80,
    seoOrder: ['1. Year', '2. Brand', '3. Wrestler Name', '4. Card Type (Auto, Relic, Mawashi, Parallel)', '5. Set Name', '6. Card Number', '7. Serial', '8. Grade'],
    specificRules: ['Card types: Auto/Relic/Mawashi/Parallel/Base/Insert/Legend.', 'Parallel: Gold/Silver/Foil/Hologram.'],
    descSpecs: 'Wrestler, Stable Name, Year, Brand, Set, Card Number, Card Type, Condition/Grade, Serial Number',
    productNameFmt: '[Year] [Brand] [Wrestler] [Type] [Set]',
    categoryOptions: 'Trading Cards'
  },

  figures: {
    role: 'anime figures and collectibles and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Franchise/Series (Demon Slayer, One Piece etc)', '2. Character Name', '3. Product Line (Nendoroid, figma, S.H.Figuarts)', '4. Manufacturer (Bandai, Good Smile, MegaHouse)', '5. Scale (1/7, 1/8)', '6. Completeness', '7. Japan / Japan Import', '8. Bonus: Limited, Exclusive, Rare'],
    specificRules: ['Condition words PROHIBITED in title.', 'Include Japan/Japan Import.', 'Completeness: Sealed/Opened Complete/Missing Parts/No Box.'],
    descSpecs: 'Franchise, Character, Product Line, Manufacturer, Scale, Completeness, Japan Import, Height, Accessories Count, Articulation, Base/Stand, Special Features, Edition, Release Year, Box Condition, Defects',
    productNameFmt: '[Character] [Product Line] [Manufacturer]',
    categoryOptions: 'Action Figures, Anime & Manga Collectibles, Models & Kits, Dolls'
  },

  sneakers: {
    role: 'sneakers and athletic shoes and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand', '2. Model (Air Jordan 1, Yeezy 350, 990v3)', '3. Colorway (Bred, Chicago, Triple White)', '4. Size: cm only if gender unknown, US+cm if gender stated', '5. "Sneakers" or specific type', '6. Bonus: Retro, OG, Limited, Collab, Japan'],
    specificRules: ['Condition words PROHIBITED (New, Used, DS, NWB, Excellent, Worn).', 'Size: if gender stated convert JP→US (Mens: 25cm=US7, 26cm=US8, 27cm=US9, 28cm=US10. Womens: 23cm=US6, 24cm=US7). If gender unknown, cm only.', 'Allowed symbols: & / : only.'],
    descSpecs: 'Brand, Full Model, Colorway, Size (cm required, US if gender known), Box Status, Width (2E/3E/4E), Condition Details, Accessories, Collab Info, Release Year, Defects',
    productNameFmt: '[Brand] [Model] [Colorway]',
    categoryOptions: 'Athletic Shoes, Sneakers, Casual Shoes'
  },

  dress_shoes: {
    role: 'dress shoes and boots and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (Regal, Alden, Red Wing, Church\'s)', '2. Model', '3. Shoe Type (Oxford, Loafer, Wingtip, Boot)', '4. Leather (Cordovan, Shell Cordovan, Calfskin, Suede)', '5. Color', '6. Size: cm only if gender unknown', '7. Bonus: Made in Japan/USA/England, Goodyear Welt'],
    specificRules: ['Condition words PROHIBITED in title.', 'Size: if gender stated convert JP→US, if not cm only.', 'Construction method (Goodyear Welt/Blake/McKay) is valuable keyword.', 'Allowed symbols: & / : only.'],
    descSpecs: 'Brand, Model, Shoe Type, Leather/Material, Color, Size (cm required), Width, Construction Method, Country, Sole Type, Last Name/Number, Condition Details, Resole History, Accessories, Defects',
    productNameFmt: '[Brand] [Type] [Leather/Feature]',
    categoryOptions: 'Dress Shoes, Boots, Oxfords, Loafers, Casual Shoes'
  },

  apparel: {
    role: 'luxury fashion items and SEO optimization',
    titleMin: 68, titleMax: 80,
    seoOrder: ['1. Brand (first 25 chars): Louis Vuitton, Chanel, Gucci, Hermes, Prada, Burberry', '2. Product Type: Jacket, Coat, Scarf, Belt', '3. Line/Collection: Monogram, GG Canvas', '4. Material: Leather, Canvas, Cashmere, Silk', '5. Size (US/UK): JP S=US XS-S, JP M=US S-M, JP L=US M-L, JP LL=US L-XL', '6. Color', '7. MPN', '8. Bonus: Vintage, Rare, Limited', '9. Missing: No Box, No Accessories'],
    specificRules: ['Exotic materials (Python, Crocodile, Ostrich): output in Warnings field.', 'Condition words PROHIBITED in title.', 'Missing accessories at title end.'],
    descSpecs: 'Brand, Product Type, Line/Collection, Dimensions (cm/inches), Material, Shoulder Width, Chest/Bust, Length, Sleeve Length, Size Label, Fabric Composition, Country, Serial Number, Missing Accessories, Defects',
    productNameFmt: '[Brand] [Line/Collection] [Product Type]',
    categoryOptions: 'Coats & Jackets, Scarves & Wraps, Belts, Hats'
  },

  leather: {
    role: 'luxury leather goods and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Collection/Line (Monogram, Damier, Matelasse)', '3. Model (Speedy, Neverfull, Birkin)', '4. Product Type: Wallet, Handbag, Tote', '5. Material: Leather, Canvas, Patent', '6. Color', '7. Hardware: GHW, SHW', '8. Missing: No Box, No Papers', '9. Bonus: Vintage, Rare'],
    specificRules: ['Only state material if explicitly confirmed. Never guess.', 'Hardware: GHW=Gold, SHW=Silver, PHW=Palladium.', 'Dimensions cm AND inches (cm/2.54).', 'Missing accessories at title end.', 'Condition words PROHIBITED.', 'Exclude 8+ digit seller codes.'],
    descSpecs: 'Brand, Collection, Product Type, Material, Color (exterior/interior), Hardware Color, Dimensions (cm/inches), Card Slots/Compartments, Serial Number/Date Code, Accessories, Country, Defects',
    productNameFmt: '[Brand] [Collection] [Product Type]',
    categoryOptions: 'Wallets, Bags & Handbags, Key Chains, Belts, Briefcases'
  },

  japanese_brands: {
    role: 'Japanese fashion brands and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (Porter Yoshida, Undercover, Visvim, Kapital)', '2. Product Type', '3. Line/Collab', '4. Material', '5. Size (JP→US)', '6. Color', '7. Japan/Made in Japan/JDM/Japan Exclusive', '8. Rare/Limited'],
    specificRules: ['Brand mapping: Porter=Porter Yoshida, etc.', 'Size: JP S=US XS/S, JP M=US S/M, JP L=US M/L.', 'Made in Japan = premium keyword. Always include if applicable.', 'Condition words PROHIBITED. Allowed symbols: & / : only.'],
    descSpecs: 'Brand, Product Type, Japan Keywords, Dimensions (cm/inches), Material, Hardware, Made in Japan, Collab, Season/Year, Size (JP+US/UK), Measurements, Defects',
    productNameFmt: '[Brand] [Line/Collection] [Product Type]',
    categoryOptions: 'Handbags, Backpacks, Coats & Jackets, Hoodies, Sneakers'
  },

  sportswear: {
    role: 'sportswear and athletic apparel and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Product Type (Jersey, Track Jacket, Windbreaker)', '3. Sport (Golf, Tennis, Soccer, Baseball)', '4. Team/Player Name', '5. Size (JP→US): JP S=US XS, JP M=US S, JP L=US M, JP O/LL=US L', '6. Color', '7. Gender', '8. Bonus: Vintage, Rare, Japan'],
    specificRules: ['JP sizing runs smaller. Must include "Japanese sizing runs smaller than US/EU" disclaimer in description.', 'Include actual measurements if available.'],
    descSpecs: 'Product Type, Sport, Size (JP+US), Actual Measurements (cm/inches), Material/Fabric, Color, Team/Player, Season/Year, Country, Defects',
    productNameFmt: '[Brand] [Sport] [Product Type]',
    categoryOptions: 'Athletic Apparel, Golf Clothing, Team Sports Jerseys'
  },

  audio: {
    role: 'audio equipment and electronics and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Model Number', '3. Product Type: Amplifier, Speaker, Turntable, Headphones', '4. Key Feature: Tube Amplifier, Planar Magnetic', '5. Color', '6. Bonus: Vintage, Rare, Japan Made, Hi-Fi, Audiophile'],
    specificRules: ['CRITICAL voltage warning: Japanese electronics are 100V. For AC-powered equipment, include "Japanese domestic model (100V). A step-down transformer may be required." in Description.'],
    descSpecs: 'Product Type, Model, Power Output (watts), Impedance, Frequency Response, Connectivity (RCA/XLR/Bluetooth), Driver Size, Weight, Accessories (remote/cables), Power Source (AC 100V/Battery/USB), Color, Country, Defects',
    productNameFmt: '[Brand] [Model] [Product Type]',
    categoryOptions: 'Amplifiers & Preamps, Home Speakers, Headphones, CD Players, Record Players & Turntables, Portable Audio, Vintage Electronics'
  },

  instruments: {
    role: 'musical instruments and gear and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Model', '3. Instrument Type: Electric Guitar, Bass, Synthesizer, Saxophone', '4. Key Feature: Vintage, MIJ, Tube Amp', '5. Color/Finish', '6. Year', '7. Bonus: Rare, Limited, Custom Shop, Reissue'],
    specificRules: ['Japan Vintage/MIJ detection: Greco, Tokai, Fernandes, FujiGen brands. Include "Japan" or "MIJ" if applicable.'],
    descSpecs: 'Instrument Type, Model, Body/Neck Material, Fingerboard, Scale Length, Pickups, Frets, Color/Finish, Serial Number, Year, Country, Accessories, Defects',
    productNameFmt: '[Brand] [Model] [Instrument Type]',
    categoryOptions: 'Electric Guitars, Acoustic Guitars, Bass Guitars, Effects Pedals, Synthesizers, Pianos/Keyboards, Saxophones, Drums'
  },

  japanese_instruments: {
    role: 'traditional Japanese musical instruments and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. "Japanese" (MUST include)', '2. Romanized Name: Shamisen, Koto, Shakuhachi, Taiko', '3. Type/Variation', '4. Material: Rosewood, Bamboo, Ebony', '5. English Category: String/Wind/Percussion', '6. Bonus: Vintage, Antique, Handmade, Professional'],
    specificRules: ['Instrument mapping: 三味線=Shamisen, 琴=Koto, 尺八=Shakuhachi, 太鼓=Taiko, 撥=Bachi.', 'Material: 紫檀=Rosewood, 竹=Bamboo, 黒檀=Ebony, 漆=Lacquer.', 'Dimensions in cm AND inches.'],
    descSpecs: 'Instrument Name (romanized+English), Material (body/skin/strings), Dimensions (cm/inch), Weight, String/Hole Count, Key/Tuning, Maker/Brand, Era/Year, Decorative Details, Accessories, Defects',
    productNameFmt: 'Japanese [Instrument Name] [Material/Type]',
    categoryOptions: 'String Instruments, Wind & Woodwind, Drums & Percussion, Musical Instrument Parts'
  },

  records: {
    role: 'vinyl records and Japanese pressings and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Artist (first 30 chars)', '2. Album/Single Title', '3. Format: LP, 7", 2LP, Picture Disc', '4. Pressing: Japan Press, Japanese Pressing', '5. Obi Status: W/Obi (PREMIUM keyword)', '6. Genre: City Pop (HIGH VALUE keyword)', '7. Press Info: 1st Press, Promo, White Label', '8. Bonus: Rare, Limited, OG Press'],
    specificRules: ['帯付き = W/Obi = highest premium keyword for Japanese records.', 'City Pop = high-value genre keyword.', '見本盤 = Promo / White Label Promo.', 'Format: LP=LP/12" Vinyl, シングル/7"=7" Single/45 RPM, Picture Disc, Colored Vinyl.'],
    descSpecs: 'Artist, Album Title, Format, Pressing (Japanese), Catalog Number, Label, Release Year, Press Info, Genre, Obi Status, Inserts (liner notes/lyrics/poster), Sleeve Type, Vinyl Color, Defects',
    productNameFmt: '[Artist] [Album Title] [Format]',
    categoryOptions: 'Vinyl Records, Music Box Sets'
  },

  rc_models: {
    role: 'RC vehicles and plastic model kits and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars): Tamiya, Bandai, Hasegawa, Kyosho', '2. Model Name/Number', '3. Scale: 1/10, 1/24, 1/35, HO', '4. Product Type: RC Car, Plastic Model Kit, Train Set', '5. Subject: Tank, Aircraft, Car, Ship', '6. Build Status: Kit, RTR, Assembled', '7. Bonus: Vintage, Rare, Limited, Japan'],
    specificRules: ['Only report defects/missing parts if explicitly stated. Never guess.'],
    descSpecs: 'Product Type, Scale, Model, Subject, Build Status, Motor Type, Chassis, Drive Type (4WD), Material, Power Source, Included Items, Missing Parts, Made in Japan, Defects',
    productNameFmt: '[Brand] [Model] [Scale] [Product Type]',
    categoryOptions: 'RC Model Vehicles & Kits, Models & Kits, Model Railroads & Trains, Slot Cars'
  },

  pipes: {
    role: 'smoking pipes and tobacco accessories and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Material: Briar, Meerschaum', '3. Shape: Billiard, Bent, Bulldog', '4. Product Type', '5. For kiseru: Japanese + material', '6. Bonus: Vintage, Handmade, Carved, Estate'],
    specificRules: ['Pipe shape mapping: ビリヤード=Billiard, ベント=Bent, ブルドッグ=Bulldog.', 'Material: ブライヤー=Briar, 海泡石=Meerschaum, エボナイト=Ebonite.', 'Kiseru (Japanese pipe): include material and length.'],
    descSpecs: 'Brand/Maker, Material (bowl/stem), Shape, Dimensions (cm/inches), Weight, Filter Type, Stem Material, Stampings/Markings, Kiseru Details, Accessories, Country, Defects',
    productNameFmt: '[Brand] [Material] [Shape] Pipe',
    categoryOptions: 'Pipes, Asian Antiques (for kiseru), Cigar Accessories'
  },

  tableware: {
    role: 'tableware and kitchen knives and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Collection/Pattern', '3. Product Type: Plate, Wine Glass, Gyuto Knife', '4. Material: Porcelain, Crystal, VG-10 Steel', '5. Size/Capacity', '6. Set Quantity', '7. Bonus: Vintage, Rare, Japan Made, Handmade'],
    specificRules: ['For knives: Blade Length and Steel Type are critical specs.', 'Dimensions in cm AND inches. Capacity in ml AND oz.'],
    descSpecs: 'Brand, Collection/Pattern, Material, Dimensions (cm/inches), Capacity (ml/oz), Quantity, Color/Pattern, Knife: blade length/steel type/handle material/bevel, Country, Microwave/Dishwasher Safe, Defects',
    productNameFmt: '[Brand] [Collection] [Product Type]',
    categoryOptions: 'Dinnerware & Serveware, Glassware, Flatware, Kitchen Knives, Chopsticks, Vases'
  },

  sunglasses: {
    role: 'sunglasses and eyewear and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Model Number (RB2140 etc)', '3. Frame Style: Aviator, Wayfarer, Round', '4. Lens Type: Polarized, Mirrored, Gradient', '5. Product Type: Sunglasses', '6. Color', '7. Gender', '8. Bonus: Vintage, Rare, Italy Made'],
    specificRules: ['Model numbers: copy exactly from source.', 'Frame style mapping is important for SEO.'],
    descSpecs: 'Frame Style/Material, Lens Color/Type (Polarized), Frame Color, Model Number, Lens Width/Bridge/Temple (55-18-145 format), Country, Accessories, UV Protection, Defects',
    productNameFmt: '[Brand] [Model] [Style] Sunglasses',
    categoryOptions: 'Sunglasses, Eyeglass Frames'
  },

  pens: {
    role: 'fountain pens and writing instruments and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars)', '2. Model Line: Meisterstuck, Souveran M800', '3. Product Type: Fountain Pen, Ballpoint, Mechanical Pencil', '4. Nib Info: 18K F Nib, Steel M Nib (CRITICAL spec)', '5. Color/Material', '6. Bonus: Vintage, Rare, Limited, Japan Made'],
    specificRules: ['CRITICAL: Nib size and material is the most important spec.', 'Nib size: EF/F/FM/M/B/BB.', 'Nib material: Steel/14K/18K/21K Gold.'],
    descSpecs: 'Pen Type, Model, Nib Size AND Material (CRITICAL), Filling System, Body Material, Color/Finish, Length/Diameter, Country, Accessories, Serial Number, Defects',
    productNameFmt: '[Brand] [Model] [Pen Type]',
    categoryOptions: 'Fountain Pens, Ballpoint Pens, Mechanical Pencils'
  },

  tennis: {
    role: 'tennis equipment and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars): Wilson, Babolat, Yonex, Head', '2. Model: Pure Drive, Blade, EZONE', '3. Head Size: 98, 100 sq in', '4. Product Type: Tennis Racquet', '5. Grip Size: G2 4 1/4', '6. Weight', '7. Bonus: Vintage, Rare, Japan'],
    specificRules: ['Grip size conversion: G1/L1=4 1/8, G2/L2=4 1/4, G3/L3=4 3/8, G4/L4=4 1/2. Include both formats in description.'],
    descSpecs: 'Model, Version/Year, Head Size (sq in), Weight (g), Balance, String Pattern, Grip Size (both formats), Beam Width, String Status, Accessories, Country, Defects',
    productNameFmt: '[Brand] [Model] Tennis Racquet',
    categoryOptions: 'Tennis Racquets, Tennis Strings, Tennis Bags'
  },

  baseball: {
    role: 'baseball equipment (Japanese brands) and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 30 chars): Mizuno, SSK, Zett, Kubota Slugger', '2. Model Line: Mizuno Pro, Pro Status', '3. Model Number', '4. Position: Pitcher, Infield, Outfield, Catcher', '5. Product Type: Glove, Bat, Cleats', '6. Size: 11.5in, 12in', '7. Throw: RHT, LHT', '8. Hardball/Softball', '9. Bonus: Japan Made, Rare, Custom, Pro Model'],
    specificRules: ['Japanese gloves (Mizuno Pro, Kubota Slugger) command premium prices.', 'Hardball gloves more valuable than softball.', 'RHT = left-hand glove (right-hand throw). LHT = right-hand glove.'],
    descSpecs: 'Position/Glove Type, Model, Size (inches), Web Style, Throw (RHT/LHT), Leather Type, Color, Hardball/Softball, Country (Made in Japan), Accessories, Bat: length/weight/material/drop, Defects',
    productNameFmt: '[Brand] [Model] [Position] Glove/Bat',
    categoryOptions: 'Gloves & Mitts, Bats, Batting Gloves, Protective Gear'
  },

  kimono: {
    role: 'Japanese kimono and traditional clothing and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Japanese / Vintage Japanese', '2. Kimono Type: Furisode, Tomesode, Houmongi, Komon, Yukata', '3. Material: Pure Silk, Cotton, Linen', '4. Technique: Shibori, Yuzen, Kasuri', '5. Design/Motif', '6. Color', '7. Product Type: Kimono, Obi, Hakama', '8. Bonus: Vintage, Antique, Handmade'],
    specificRules: ['Kimono type: 振袖=Furisode, 留袖=Tomesode, 訪問着=Houmongi, 小紋=Komon, 色無地=Iromuji, 紬=Tsumugi, 浴衣=Yukata.', 'Obi: 袋帯=Fukuro Obi, 名古屋帯=Nagoya Obi.', 'Material: 正絹=Pure Silk, 綿=Cotton, 麻=Linen, ポリエステル=Polyester.', 'All measurements MUST be in cm AND inches.', 'Defects (stains/moth holes/fading) MUST be reported.'],
    descSpecs: 'Kimono Type (JP+EN), Material, Technique, Design, Color (outside/inside), All Measurements (cm/inch), Era/Period, Formality Level, Defects',
    productNameFmt: 'Japanese [Type] [Material] Kimono/Obi',
    categoryOptions: 'Kimono, Obi, Hakama, Kimono Accessories, Fabric'
  },

  swords: {
    role: 'Japanese swords (nihonto) and fittings and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Japanese', '2. Sword Type: Katana, Wakizashi, Tanto, Tachi', '3. Swordsmith (mei)', '4. Period/Era', '5. Fitting Material', '6. Design Motif', '7. Product Category', '8. Bonus: Antique, Nihonto, Samurai'],
    specificRules: ['Sword type: 刀=Katana, 脇差=Wakizashi, 短刀=Tanto, 太刀=Tachi.', 'Fittings: 鍔=Tsuba, 目貫=Menuki, 小柄=Kozuka, 縁頭=Fuchi-Kashira.', 'CRITICAL: Registration certificate status MUST be mentioned in Description.', 'CRITICAL defect: hagire (blade crack) must always be reported.'],
    descSpecs: 'Sword Type (JP+EN), Blade Length and dimensions (cm/inch), Swordsmith, Period, Blade Quality, Hamon, Nakago, Fitting Material/Technique/Decoration, Registration Certificate Status (MUST), Defects',
    productNameFmt: 'Japanese [Type] [Descriptor]',
    categoryOptions: 'Swords & Sabers, Sword Fittings'
  },

  japanese_antiques: {
    role: 'Japanese traditional crafts and antiques and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Japanese', '2. Product Type: Tetsubin, Chawan, Kyusu, Buddha Statue', '3. Material: Iron, Ceramic, Bronze, Wood', '4. Artist/Kiln Name', '5. Design', '6. Period/Era', '7. English Description', '8. Bonus: Antique, Vintage, Handmade'],
    specificRules: ['Tea ceremony: 茶碗=Chawan, 鉄瓶=Tetsubin, 急須=Kyusu, 茶筅=Chasen.', 'Ivory requires eBay policy check.', 'Defects (cracks/chips/repairs/water leakage) MUST be reported.', 'Kintsugi (gold repair) should be mentioned as both repair and artistic value.'],
    descSpecs: 'Product Type (JP+EN), Material, Artist/Kiln, Dimensions (cm/inch), Weight, Design, Period, Technique, Provenance/Box/Papers, Defects',
    productNameFmt: 'Japanese [Type] [Material/Style]',
    categoryOptions: 'Tea Caddies, Tea Bowls, Teapots, Bowls, Vases, Statues, Asian Antiques'
  },

  art: {
    role: 'fine art and Japanese woodblock prints and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Artist (first 30 chars)', '2. Art Type: Oil Painting, Woodblock Print, Lithograph, Ukiyo-e, Screen Print', '3. Title', '4. Edition Info: 15/100, AP', '5. Presentation: Framed, Unframed, Mounted', '6. Subject/Motif', '7. Bonus: Original, Vintage, Rare, Japanese'],
    specificRules: ['Art type: 油絵=Oil Painting, 水彩画=Watercolor, 木版画=Woodblock Print, 版画=Print, リトグラフ=Lithograph, 浮世絵=Ukiyo-e, シルクスクリーン=Screen Print, 掛軸=Hanging Scroll.', 'Edition format: 15/100, AP (Artist Proof).', 'Dimensions: image size AND frame size, both cm and inches.', 'Defects (foxing/yellowing/tears) MUST be reported.'],
    descSpecs: 'Artist, Art Type/Medium, Title, Subject, Edition Number, Signature Details, Presentation, Dimensions (image AND frame, cm/inch), Paper/Canvas Type, Year/Period, Provenance/Certificate, Defects',
    productNameFmt: '[Artist] [Art Type] [Subject]',
    categoryOptions: 'Art Paintings, Art Prints, Art Posters, Asian Antiques'
  },

  general: {
    role: 'general products and SEO optimization',
    titleMin: 68, titleMax: 75,
    seoOrder: ['1. Brand (first 40 chars)', '2. Model Number/Name', '3. Product Type', '4. Key Differentiator: size, color, material', '5. Bonus: Genuine, Vintage, Rare, Japan Made'],
    specificRules: ['Allowed symbols: & / : only.', 'No placeholders (N/A, Unknown, TBD) in output.'],
    descSpecs: 'Key Specs, Dimensions, Material, Condition, Functionality, Accessories, Defects',
    productNameFmt: '[Brand] [Product Type/Model]',
    categoryOptions: '(select appropriate eBay category based on product)'
  }
};

// ============================================================
// ヘルパー: タグから軽量翻訳カテゴリを取得
// ============================================================
function getLightCategory_(tag) {
  if (!tag) return null;
  tag = String(tag).trim();
  if (LIGHT_TAG_MAP_[tag]) return LIGHT_TAG_MAP_[tag];
  var baseTag = tag.split(/[\s\u3000]/)[0];
  if (baseTag !== tag && LIGHT_TAG_MAP_[baseTag]) return LIGHT_TAG_MAP_[baseTag];
  return null;
}

// ============================================================
// 軽量翻訳プロンプト生成
// ============================================================
function buildLightTranslationPrompt_(category, sanitizedEN) {
  var rules = LIGHT_TRANSLATION_RULES_[category];
  if (!rules) return null;

  var titleMin = rules.titleMin || 68;
  var titleMax = rules.titleMax || 80;

  var lines = [];

  lines.push('You are a professional eBay listing expert specializing in ' + rules.role + '.');
  lines.push('');
  lines.push('## GOALS');
  lines.push('Generate an optimized eBay listing from the pre-structured English product data below.');
  lines.push('- Use ONLY ASCII characters in Title and Description. Condition uses Japanese values as specified.');
  lines.push('- Do NOT add any information not present in the input.');
  lines.push('- Do NOT include shipping info, return policy, or seller opinions.');
  lines.push('');

  lines.push('## TITLE RULES');
  lines.push('- Length: ' + titleMin + '-' + titleMax + ' characters. MUST be within this range.');
  lines.push('- Allowed symbols: & / : - . ,');
  lines.push('- Prohibited symbols: " \' ( ) [ ]');
  lines.push('- NO condition words in title (Used, Junk, Excellent, Good, For Parts).');
  lines.push('');
  lines.push('SEO Keyword Priority Order:');
  for (var i = 0; i < rules.seoOrder.length; i++) {
    lines.push(rules.seoOrder[i]);
  }
  lines.push('');

  if (rules.specificRules && rules.specificRules.length > 0) {
    lines.push('## CATEGORY-SPECIFIC RULES');
    for (var j = 0; j < rules.specificRules.length; j++) {
      lines.push('- ' + rules.specificRules[j]);
    }
    lines.push('');
  }

  lines.push('## DESCRIPTION RULES');
  lines.push('- Maximum 1000 characters.');
  lines.push('- First sentence MUST include Brand + Model + Product Type.');
  lines.push('- Defects/damage MUST be mentioned if present in input.');
  lines.push('- Include these specs (if available in input): ' + rules.descSpecs);
  lines.push('');

  lines.push('## PRODUCTNAME');
  lines.push('Format: ' + rules.productNameFmt);
  lines.push('');

  lines.push('## CATEGORY');
  lines.push('Select the most appropriate: ' + rules.categoryOptions);
  lines.push('');

  lines.push('## CONDITION');
  lines.push('Determine from input data:');
  lines.push('- If Condition field contains New/Unused/Mint/Sealed (exact new, never used) → return "新品"');
  lines.push('- If Condition field contains Used/Pre-owned/Like New/Near Mint/For Parts OR Defects field has any value → return "中古"');
  lines.push('- If Condition field is missing or unclear → return "エラー"');
  lines.push('');

  lines.push('## OUTPUT FORMAT');
  lines.push('Return ONLY valid JSON with these exact keys:');
  lines.push('{"Title": "...", "Description": "...", "ProductName": "...", "Category": "...", "Condition": "新品|中古|エラー", "EbayCategory": "..."}');
  lines.push('');

  lines.push('## VERIFICATION (check before outputting)');
  lines.push('1. Title is ' + titleMin + '-' + titleMax + ' characters');
  lines.push('2. Title contains no prohibited symbols');
  lines.push('3. Description is <= 1000 characters');
  lines.push('4. First sentence has Brand + Model + Product Type');
  lines.push('5. All defects from input are mentioned in Description');
  lines.push('6. No information was invented (not in input)');
  lines.push('7. Title and Description are ASCII only (Condition value uses Japanese as specified)');
  lines.push('8. Condition is exactly "新品", "中古", or "エラー"');
  lines.push('');

  lines.push('## INPUT (Pre-structured English data from product listing)');
  lines.push(sanitizedEN);

  return lines.join('\n');
}
