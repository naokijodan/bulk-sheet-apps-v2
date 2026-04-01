/******************************************************
 * Sanitize.gs - 交通整理（ソーステキストのAI事前処理）
 *
 * J列・K列の日本語ソーステキストから商品情報だけを
 * AIで抽出し、配送文・売り手コメント等を除外する。
 * 元データはAU・AV列にバックアップする。
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  デフォルトプロンプト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ別フィールド定義
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var SANITIZE_FIELDS_ = {
  'Watches': [
    'ブランド', 'モデル名', '型番', 'ムーブメント',
    'ケース素材', 'ケースサイズ', '文字盤色', '風防',
    'ベルト素材', '防水', '表示方式', '腕周り',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Cameras': [
    'ブランド', 'モデル名', 'タイプ', 'シリーズ',
    '色', '画素数', 'レンズマウント', 'バッテリータイプ',
    '付属レンズ', 'シャッター回数',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Trading Cards': [
    'ゲーム名', 'セット名', 'キャラクター名', 'カード名',
    'カード番号', 'レアリティ', '仕上げ', '言語',
    '鑑定会社', '鑑定グレード',
    'コンディション', '枚数'
  ],
  'Video Game Consoles': [
    'メーカー', '機種名', '型番', 'タイプ',
    'ストレージ容量', '色', 'リージョン', 'エディション',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Fishing Reels': [
    'メーカー', 'モデル名', '型番', 'リールタイプ',
    '巻き方向', 'ギア比', 'サイズ/番手', '対象魚種',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Golf': [
    'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
    '利き手', 'フレックス', 'シャフト素材', 'クラブ番号',
    'セット構成', '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Golf Heads': [
    'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
    '利き手', '素材', 'ライ角', 'ヘッド形状',
    'バウンス', '付属品', 'コンディション', '故障・不具合', '製造国'
  ]
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ別補足ルール（データ駆動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var CATEGORY_RULES_ = {
  'Cameras': {
    label: 'カメラ',
    rules: [
      '- タイプ: 一眼レフ/ミラーレス/コンパクト/フィルムカメラ/中判/レンジファインダー/二眼レフ/蛇腹/アクションカメラ/インスタントカメラ のいずれかで記入。',
      '- シリーズ: ブランドの製品ラインを記入。例: Canon→EOS/PowerShot, Nikon→D/Z/FM, Sony→Alpha/Cyber-shot, Fujifilm→X/GFX, Olympus→OM-D/PEN/OM, Pentax→K/645, Leica→M/R/Q, Contax→G/T/RTS, Mamiya→RB67/RZ67/645, Hasselblad→500/H/X',
      '- レンズマウント: マウント名を記入。例: EFマウント/FDマウント/RFマウント/Fマウント/Zマウント/Eマウント/Aマウント/マイクロフォーサーズ/Xマウント/Kマウント/Mマウント/M42/C/Yマウント/Lマウント',
      '- バッテリータイプ: リチウムイオン/単3/CR123A/CR2/ボタン電池/不要 のいずれか。型番（LP-E6, EN-EL15等）がある場合はリチウムイオンと判断。',
      '- 画素数: 万画素の数字をそのまま記入（例: 2420万画素）。'
    ]
  },
  'Trading Cards': {
    label: 'カード',
    rules: [
      '- ゲーム名: ポケモンカード/遊戯王/MTG/デュエルマスターズ/ヴァイスシュヴァルツ/ヴァンガード/バトルスピリッツ/ドラゴンボール/ワンピース/BBM(野球)/大相撲 のいずれかで記入。',
      '- セット名: パック名・エキスパンション名をそのまま記入。コード（SV2a, SM12a等）も併記。',
      '- キャラクター名: ポケモン名/モンスター名/選手名を記入。「ex」「VMAX」等の接尾辞はカード名に含める。',
      '- カード名: カードの正式名称。種類接尾辞を含む（例: リザードンex SAR）。',
      '- カード番号: コレクター番号をそのまま記入（例: 201/165, #123）。',
      '- レアリティ: R/SR/UR/SAR/AR/HR/RR/C/UC/CSR/SSR等のコードまたは正式名称で記入。',
      '- 仕上げ: ホロ/ノンホロ/フルアート/リバースホロ/クローム 等。',
      '- 言語: 日本語/英語/中国語/韓国語 等。',
      '- 鑑定会社: PSA/BGS/CGC/SGC。鑑定済みでなければNA。',
      '- 鑑定グレード: 10/9.5/9等の数値。鑑定済みでなければNA。',
      '- 枚数: まとめ売りの場合の枚数。単品ならNA。',
      '',
      '重要: カード名とキャラクター名を混同しない。キャラクター名は「ピカチュウ」、カード名は「ピカチュウVMAX SA」のように区別する。'
    ]
  },
  'Video Game Consoles': {
    label: 'ゲーム機',
    rules: [
      '- メーカー: Nintendo/Sony/Sega/Microsoft/SNK/NEC/Atari のいずれかで記入。',
      '- 機種名: 正式名称で記入。例: Nintendo Switch, PlayStation 5, Sega Mega Drive, Xbox Series X, PC Engine, Neo Geo AES',
      '- タイプ: 据え置き/携帯機/ハイブリッド のいずれかで記入。',
      '- リージョン: NTSC-J(日本)/NTSC-U(北米)/PAL(欧州) のいずれか。日本製はNTSC-J。',
      '- ストレージ容量: GB単位で記入（例: 32GB, 825GB）。不明ならNA。',
      '- エディション: 限定版/初期型/後期型/特別カラーモデル等。通常モデルならNA。',
      '  例: 限定版→限定版, 初期型/CUH-1000→初期型, 後期型/最終型→後期型, ピカチュウ版→ピカチュウエディション'
    ]
  },
  'Golf': {
    label: 'ゴルフ',
    rules: [
      '- クラブタイプ: ドライバー/フェアウェイウッド/ユーティリティ/アイアン/アイアンセット/ウェッジ/パター のいずれかで記入。英語で書かない。',
      '- ロフト角: 数値+°で記入（例: 10.5°, 9°）。「度」は使わない。小数点以下がない場合も°を付ける。',
      '- 利き手: 右利き/左利き のいずれかで記入。英語で書かない。記載がなければNA。',
      '- モデル名: モデル名のみ記入。クラブタイプ（Driver, ドライバー等）を含めない。',
      '- フレックス: R/S/SR/A/L/X のいずれかで記入。',
      '- シャフト素材: カーボン/スチール のいずれかで記入。',
      '- [EN]セクションでは: Golf Club Type は Driver/Fairway Wood/Hybrid/Iron/Iron Set/Wedge/Putter。Handedness は Right-Handed/Left-Handed。Shaft Material は Graphite/Steel。Loft は数値+°（例: 10.5°）。'
    ]
  },
  'Golf Heads': {
    label: 'ゴルフ',
    rules: [
      '- クラブタイプ: ドライバー/フェアウェイウッド/ユーティリティ/アイアン/アイアンセット/ウェッジ/パター のいずれかで記入。英語で書かない。',
      '- ロフト角: 数値+°で記入（例: 10.5°, 9°）。「度」は使わない。小数点以下がない場合も°を付ける。',
      '- 利き手: 右利き/左利き のいずれかで記入。英語で書かない。記載がなければNA。',
      '- モデル名: モデル名のみ記入。クラブタイプ（Driver, ドライバー等）を含めない。',
      '- フレックス: R/S/SR/A/L/X のいずれかで記入。',
      '- シャフト素材: カーボン/スチール のいずれかで記入。',
      '- [EN]セクションでは: Golf Club Type は Driver/Fairway Wood/Hybrid/Iron/Iron Set/Wedge/Putter。Handedness は Right-Handed/Left-Handed。Shaft Material は Graphite/Steel。Loft は数値+°（例: 10.5°）。'
    ]
  },
  'Watches': {
    label: '時計',
    rules: [
      '- ムーブメント: 自動巻き/手巻き/クオーツ/ソーラー/キネティック/スプリングドライブ/電波ソーラー のいずれかで記入。',
      '- 表示方式: アナログ/デジタル/アナログ&デジタル のいずれかで記入。',
      '- 風防素材: サファイアガラス/ミネラルガラス/ハードレックス/プラスチック/アクリル のいずれかで記入。',
      '- 防水性能: 数値で記入（例: 10気圧, 100m, 200m）。日常生活防水の場合は「日常生活防水」と記入。気圧→m変換: 3気圧=30m, 5気圧=50m, 10気圧=100m, 20気圧=200m。',
      '- ケース素材: ステンレススチール/チタン/ゴールド/プラチナ/セラミック/プラスチック/レジン のいずれかで記入。金メッキはゴールドプレート、金張りはゴールドフィルドと記入。',
      '- ケースサイズ: mm単位で記入（例: 40mm）。「約」は付けてもよい。',
      '- 文字盤色: 色名を日本語で記入（例: ブラック、ホワイト、ブルー、グリーン）。',
      '- 腕周り: cm単位で記入（例: 18cm）。',
      '- ベルト素材: ステンレス/チタン/レザー/ラバー/シリコン/ナイロン/メッシュ のいずれかで記入。',
      '- 型番(Ref): わかる場合は必ず記入（例: SBGA211, 16610, SPB143）。',
      '- キャリバー(Cal): わかる場合は記入（例: 9R65, 3135, 7S26）。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Movement は Automatic/Manual Wind/Quartz/Solar/Kinetic/Spring Drive/Radio Solar。Display は Analog/Digital/Analog & Digital。Case Material は Stainless Steel/Titanium/Gold/Platinum/Ceramic/Plastic/Resin/Gold Plated/Gold Filled。Crystal は Sapphire/Mineral/Hardlex/Acrylic。Band Material は Stainless Steel/Titanium/Leather/Rubber/Silicone/Nylon/Mesh。Department は Men/Women/Unisex。'
    ]
  },
  'Rings': {
    label: 'リング',
    rules: [
      '- 金属: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮 のいずれかで記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- リングサイズ: 号数で記入（例: 12号）。',
      '- タイプ: エタニティ/シグネット/印台/甲丸/平打ち/エンゲージ/マリッジ 等。',
      '- セッティング: 爪留め/覆輪留め/パヴェ/チャネル 等。わかれば記入。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。Type は Eternity/Signet/Dome(甲丸)/Flat Band(平打ち)/Engagement/Wedding Band。Setting は Prong/Bezel/Pave/Channel。'
    ]
  },
  'Necklaces': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Bracelets': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Earrings': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Brooches': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Cufflinks': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Charms': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Tie Accessories': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/925/950 等で記入。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/パール 等。石なしならNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Base Metal/Leather。Metal Purity は 18k/14k/10k/925/950。金メッキの場合は Metal: Base Metal, Metal Purity: Does not apply。'
    ]
  },
  'Handbags': {
    label: 'バッグ・財布',
    rules: [
      '- 外装素材: レザー/キャンバス/ナイロン/PVC/合皮 のいずれかで記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Exterior Material は Leather/Canvas/Nylon/PVC/Synthetic Leather/Coated Canvas。Department は Men/Women/Unisex。'
    ]
  },
  'Wallets': {
    label: 'バッグ・財布',
    rules: [
      '- 外装素材: レザー/キャンバス/ナイロン/PVC/合皮 のいずれかで記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Exterior Material は Leather/Canvas/Nylon/PVC/Synthetic Leather/Coated Canvas。Department は Men/Women/Unisex。'
    ]
  },
  'Clothing': {
    label: '衣類・靴',
    rules: [
      '- 対象: メンズ/レディース/キッズ/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Department は Men/Women/Kids/Unisex。'
    ]
  },
  'Shoes': {
    label: '衣類・靴',
    rules: [
      '- 対象: メンズ/レディース/キッズ/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Department は Men/Women/Kids/Unisex。'
    ]
  },
  'Hats': {
    label: '帽子',
    rules: [
      '- スタイル: キャップ/バケットハット/ベレー帽/ニット帽/ハット/バイザー 等で記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Style は Baseball Cap/Bucket Hat/Beret/Beanie/Fedora/Visor/Sun Hat。Department は Men/Women/Unisex。'
    ]
  },
  'Scarves': {
    label: '服飾小物',
    rules: [
      '- 素材: シルク/カシミヤ/ウール/コットン/ポリエステル 等で記入。',
      '- [EN]セクションでは: Material は Silk/Cashmere/Wool/Cotton/Polyester/Linen。'
    ]
  },
  'Neckties': {
    label: '服飾小物',
    rules: [
      '- 素材: シルク/カシミヤ/ウール/コットン/ポリエステル 等で記入。',
      '- [EN]セクションでは: Material は Silk/Cashmere/Wool/Cotton/Polyester/Linen。'
    ]
  },
  'Handkerchiefs': {
    label: '服飾小物',
    rules: [
      '- 素材: シルク/カシミヤ/ウール/コットン/ポリエステル 等で記入。',
      '- [EN]セクションでは: Material は Silk/Cashmere/Wool/Cotton/Polyester/Linen。'
    ]
  },
  'Belts': {
    label: 'ベルト',
    rules: [
      '- 素材: レザー/合皮/キャンバス/金属 等で記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Material は Leather/Synthetic Leather/Canvas/Metal。Department は Men/Women/Unisex。'
    ]
  },
  'Belt Buckles': {
    label: 'ベルト',
    rules: [
      '- 素材: レザー/合皮/キャンバス/金属 等で記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Material は Leather/Synthetic Leather/Canvas/Metal。Department は Men/Women/Unisex。'
    ]
  },
  'Sunglasses': {
    label: 'サングラス',
    rules: [
      '- フレーム素材: メタル/プラスチック/チタン/アセテート 等で記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- [EN]セクションでは: Frame Material は Metal/Plastic/Titanium/Acetate。Department は Men/Women/Unisex。'
    ]
  },
  'Musical Instruments': {
    label: '楽器',
    rules: [
      '- タイプ: エレキギター/アコースティックギター/ベース/ウクレレ/バイオリン/フルート/サックス 等で記入。',
      '- 利き手: 右利き/左利き のいずれかで記入。',
      '- [EN]セクションでは: Type は Electric Guitar/Acoustic Guitar/Bass Guitar/Ukulele/Violin/Flute/Saxophone 等。Handedness は Right-Handed/Left-Handed。'
    ]
  },
  'Pens': {
    label: '筆記具',
    rules: [
      '- タイプ: 万年筆/ボールペン/ローラーボール/シャープペンシル 等で記入。',
      '- [EN]セクションでは: Type は Fountain Pen/Ballpoint Pen/Rollerball Pen/Mechanical Pencil。'
    ]
  },
  'Video Games': {
    label: 'ゲームソフト',
    rules: [
      '- プラットフォーム: 正式名称で記入。例: PlayStation 5, Nintendo Switch, Xbox Series X。',
      '- リージョン: NTSC-J(日本)/NTSC-U(北米)/PAL(欧州) のいずれか。日本製はNTSC-J。',
      '- [EN]セクションでは: Platform は正式英語名。Region Code は NTSC-J (Japan)/NTSC-U/C (North America)/PAL。'
    ]
  },
  'Fishing Rods': {
    label: 'ロッド',
    rules: [
      '- ロッドタイプ: スピニング/ベイト/フライ/テレスコピック/ジギング のいずれかで記入。',
      '- パワー: UL/L/ML/M/MH/H/XH のいずれかで記入。',
      '- アクション: スロー/ミディアム/ファスト/エクストラファスト のいずれかで記入。',
      '- [EN]セクションでは: Rod Type は Spinning/Casting/Fly/Telescopic/Jigging。Rod Power は Ultra Light/Light/Medium Light/Medium/Medium Heavy/Heavy/Extra Heavy。Rod Action は Slow/Moderate/Fast/Extra Fast。'
    ]
  },
  'Kimono': {
    label: '着物',
    rules: [
      '- タイプ: 振袖/留袖/訪問着/付下げ/小紋/紬/色無地/浴衣/羽織/帯/帯締め/帯揚げ 等で記入。',
      '- 素材: 正絹/化繊/木綿/麻/ウール 等で記入。',
      '- [EN]セクションでは: Type は Furisode/Tomesode/Houmongi/Tsukesage/Komon/Tsumugi/Iromuji/Yukata/Haori/Obi/Obijime/Obiage 等。Material は Silk/Synthetic/Cotton/Linen/Wool。'
    ]
  },
  'Japanese Swords': {
    label: '刀剣',
    rules: [
      '- タイプ: 刀/太刀/脇差/短刀/薙刀/槍 等で記入。',
      '- [EN]セクションでは: Type は Katana/Tachi/Wakizashi/Tanto/Naginata/Yari。Blade Material は Carbon Steel/Tamahagane。'
    ]
  },
  'Art': {
    label: '美術品',
    rules: [
      '- 制作技法: 油彩/水彩/版画/木版画/リトグラフ/シルクスクリーン/エッチング/写真 等で記入。',
      '- [EN]セクションでは: Production Technique / Medium は Oil Painting/Watercolor/Print/Woodblock Print/Lithograph/Screen Print/Etching/Photograph。Original/Licensed Reproduction は Original/Reproduction。'
    ]
  },
  'Prints': {
    label: '美術品',
    rules: [
      '- 制作技法: 油彩/水彩/版画/木版画/リトグラフ/シルクスクリーン/エッチング/写真 等で記入。',
      '- [EN]セクションでは: Production Technique / Medium は Oil Painting/Watercolor/Print/Woodblock Print/Lithograph/Screen Print/Etching/Photograph。Original/Licensed Reproduction は Original/Reproduction。'
    ]
  },
  'Records': {
    label: 'レコード',
    rules: [
      '- フォーマット: LP/EP/シングル のいずれかで記入。',
      '- レコードサイズ: 12インチ/10インチ/7インチ のいずれかで記入。',
      '- レコード評価: Mint/Near Mint/VG+/VG/G+/G/Fair/Poor のいずれかで記入（Goldmine基準）。',
      '- [EN]セクションでは: Format は LP/EP/Single。Record Size は 12"/10"/7"。Record Grading/Sleeve Grading は Mint (M)/Near Mint (NM)/Very Good Plus (VG+)/Very Good (VG)/Good Plus (G+)/Good (G)/Fair (F)/Poor (P)。'
    ]
  },
  'Stamps': {
    label: '切手・コイン',
    rules: [
      '- 鑑定: PSA/NGC/PCGS/CGC 等で記入。鑑定なしならNA。',
      '- [EN]セクションでは: Certification は PSA/NGC/PCGS/CGC/Uncertified。'
    ]
  },
  'Coins': {
    label: '切手・コイン',
    rules: [
      '- 鑑定: PSA/NGC/PCGS/CGC 等で記入。鑑定なしならNA。',
      '- [EN]セクションでは: Certification は PSA/NGC/PCGS/CGC/Uncertified。'
    ]
  },
  'Collectibles': {
    label: 'コレクティブル',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称で記入。例: Dragon Ball/One Piece/Gundam/Evangelion/Sailor Moon。'
    ]
  },
  'Dolls & Plush': {
    label: 'コレクティブル',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称で記入。例: Dragon Ball/One Piece/Gundam/Evangelion/Sailor Moon。'
    ]
  },
  'Anime': {
    label: 'コレクティブル',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称で記入。例: Dragon Ball/One Piece/Gundam/Evangelion/Sailor Moon。'
    ]
  },
  'Figures': {
    label: 'コレクティブル',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称で記入。例: Dragon Ball/One Piece/Gundam/Evangelion/Sailor Moon。'
    ]
  },
  'RC & Models': {
    label: 'RC・模型',
    rules: [
      '- スケール: 1/10, 1/24, 1/350 等で記入。',
      '- 動力源: 電動/エンジン/ガソリン のいずれかで記入。',
      '- [EN]セクションでは: Fuel Type は Electric/Nitro/Gas。'
    ]
  },
  'Fishing Reels': {
    label: 'リール',
    rules: [
      '- リールタイプ: スピニング/ベイト(両軸)/フライ/電動/スピンキャスト のいずれかで記入。',
      '- 巻き方向: 右巻き/左巻き/両対応 のいずれかで記入。ハンドル交換可能なら両対応。',
      '- ギア比: ソースにある場合そのまま記入（例: 5.2:1, 6.4:1）。ない場合はNA。',
      '- サイズ/番手: 型番に含まれる数字（例: 2500, C3000, 103）をそのまま記入。',
      '- 対象魚種: モデル名やカテゴリから推測できる場合のみ記入。不明ならNA。',
      '  例: セフィア/エメラルダス→イカ, ソルティガ→大型回遊魚, エクスセンス→シーバス, ソアレ→メバル/アジ',
      '  例: バス用→バス, トラウト用→トラウト, エギング→イカ, ジギング→青物'
    ]
  }
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IS_CATEGORY_FIELDS 英語→日本語 フィールド名変換テーブル
  未登録のフィールドは英語のまま使用される
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var FIELD_EN_TO_JP_ = {
  // 共通
  'Brand': 'ブランド', 'Model': 'モデル名', 'Type': 'タイプ',
  'Color': '色', 'Material': '素材', 'Size': 'サイズ',
  'Style': 'スタイル', 'Country of Origin': '製造国',
  'Department': '対象', 'Pattern': '模様', 'Theme': 'テーマ',
  'Features': '特徴', 'Era': '年代', 'Vintage': 'ヴィンテージ',
  'Season': 'シーズン', 'Occasion': '用途', 'Shape': '形状',
  'Handedness': '利き手', 'Edition': 'エディション',
  // ジュエリー
  'Designer': 'デザイナー', 'Metal': '金属', 'Metal Purity': '金属純度',
  'Main Stone': '主石', 'Main Stone Color': '主石の色',
  'Main Stone Shape': '主石の形', 'Pendant Shape': 'ペンダントの形',
  'Secondary Stone': '副石',
  // ファッション
  'Exterior Material': '外装素材', 'Exterior Color': '外装色',
  // 時計
  'Display': '表示方式', 'Movement': 'ムーブメント',
  'Case Material': 'ケース素材', 'Case Size': 'ケースサイズ',
  'Wrist Size': '腕周り', 'Dial Color': '文字盤色',
  // カメラ
  'Series': 'シリーズ', 'Maximum Resolution': '最大解像度',
  'Battery Type': 'バッテリータイプ', 'Lens Mount': 'レンズマウント',
  // カード
  'Game': 'ゲーム名', 'Set': 'セット名', 'Character': 'キャラクター',
  'Card Name': 'カード名', 'Card Number': 'カード番号',
  'Rarity': 'レアリティ', 'Finish': '仕上げ',
  'Graded': '鑑定済み', 'Professional Grader': '鑑定会社', 'Grade': 'グレード',
  // ゲーム
  'Platform': 'プラットフォーム', 'Game Name': 'ゲーム名',
  'Region Code': 'リージョンコード', 'Genre': 'ジャンル',
  'Publisher': '発売元', 'Rating': 'レーティング', 'Language': '言語',
  'Storage Capacity': 'ストレージ容量', 'Connectivity': '接続方式',
  // 釣り
  'Reel Type': 'リールタイプ', 'Hand Retrieve': '巻き方向',
  'Gear Ratio': 'ギア比', 'Ball Bearings': 'ベアリング数',
  'Line Capacity': '糸巻量', 'Fishing Type': '釣りタイプ',
  'Fish Species': '対象魚種',
  'Rod Type': 'ロッドタイプ', 'Item Length': '長さ',
  'Rod Power': 'パワー', 'Rod Action': 'アクション', 'Lure Weight': 'ルアー重量',
  // 楽器
  'Body Color': 'ボディカラー', 'Body Type': 'ボディタイプ',
  'String Configuration': '弦構成', 'Model Year': '年式',
  'Number of Frets': 'フレット数',
  // 万年筆
  'Ink Color': 'インク色', 'Nib Size': 'ニブサイズ', 'Nib Material': 'ニブ素材',
  // パイプ
  'Body Shape': '形状', 'Filter Size': 'フィルターサイズ', 'Handmade': 'ハンドメイド',
  // 時計パーツ
  'Part Type': 'パーツタイプ', 'Compatible Model': '対応モデル',
  // サングラス
  'Frame Color': 'フレーム色', 'Lens Color': 'レンズ色', 'Frame Material': 'フレーム素材',
  // 美術・版画
  'Artist': 'アーティスト', 'Production Technique': '制作技法',
  'Subject': '題材', 'Original/Licensed Reproduction': 'オリジナル/複製',
  'Time Period Produced': '制作年代',
  'Listed By': '出品者区分', 'Medium': '技法', 'Maker': '作家',
  // ゴルフ
  'Golf Club Type': 'クラブタイプ', 'Loft': 'ロフト角',
  'Lie Angle': 'ライ角', 'Head Shape': 'ヘッド形状', 'Bounce': 'バウンス',
  'Flex': 'フレックス', 'Shaft Material': 'シャフト素材',
  'Club Number': 'クラブ番号', 'Set Makeup': 'セット構成',
  // テニス
  'Head Size': 'ヘッドサイズ', 'Grip Size': 'グリップサイズ',
  'String Pattern': 'ストリングパターン', 'Weight': '重量',
  // 野球
  'Player Position': 'ポジション', 'Sport/Activity': 'スポーツ',
  // 刀剣
  'Blade Material': '刃の素材', 'Original/Reproduction': 'オリジナル/複製',
  // レコード
  'Release Title': 'タイトル', 'Record Grading': 'レコード評価',
  'Record Label': 'レーベル', 'Format': 'フォーマット',
  'Record Size': 'レコードサイズ', 'Release Year': '発売年',
  'Sleeve Grading': 'ジャケット評価',
  // コイン・切手
  'Certification': '鑑定', 'Denomination': '額面', 'Year': '年',
  'Year of Issue': '発行年', 'Topic': 'テーマ', 'Quality': '品質',
  'Composition': '素材構成',
  // その他
  'Scent': '香り', 'Product Line': '製品ライン',
  'Suitable For': '用途', 'Lining Material': '裏地素材',
  'Character Family': 'キャラクターファミリー', 'Franchise': 'フランチャイズ',
  'Scale': 'スケール', 'Fuel Type': '動力源',
  'Set Includes': 'セット内容', 'Number of Place Settings': '人数分',
  'Item Width': '幅', 'Fits Belt Width': '対応ベルト幅',
  'Hair Type': '髪質', 'Collection': 'コレクション',
  'Year Manufactured': '製造年'
};

// 汎用フォールバックフィールド（IS_CATEGORY_FIELDSにもSANITIZE_FIELDS_にもないカテゴリ用）
var SANITIZE_GENERIC_FIELDS_ = [
  'ブランド', 'タイプ', '素材', '色', 'サイズ',
  'コンディション', '付属品'
];

/**
 * カテゴリに応じた交通整理用フィールド一覧を返す
 * 1. SANITIZE_FIELDS_ にあればそれを使う（既存5カテゴリの専用定義）
 * 2. なければ IS_CATEGORY_FIELDS から英語→日本語変換
 * 3. どちらにもなければ汎用フィールド
 * @param {string} category - ISカテゴリ名
 * @return {string[]} 日本語フィールド名の配列
 */
function getSanitizeFields_(category) {
  // 1. 既存5カテゴリの専用定義
  if (SANITIZE_FIELDS_[category]) {
    return SANITIZE_FIELDS_[category];
  }
  // 2. IS_CATEGORY_FIELDSから動的生成
  if (typeof IS_CATEGORY_FIELDS !== 'undefined' && IS_CATEGORY_FIELDS[category]) {
    var enFields = IS_CATEGORY_FIELDS[category];
    var fields = [];
    for (var i = 0; i < enFields.length; i++) {
      fields.push(FIELD_EN_TO_JP_[enFields[i]] || enFields[i]);
    }
    // コンディション・付属品を末尾に追加（IS_CATEGORY_FIELDSには含まれないが交通整理で必要）
    fields.push('コンディション');
    fields.push('付属品');
    return fields;
  }
  // 3. 汎用フォールバック
  return SANITIZE_GENERIC_FIELDS_;
}

/**
 * カテゴリのフィールド定義からデフォルトプロンプトを動的生成する
 * GPT_Promptsシートにプロンプトがない場合のフォールバック
 * @param {string} category - ISカテゴリ名（'Watches', 'Cameras'等）
 * @return {string} プロンプト文字列
 */
function buildDefaultSanitizePrompt_(category) {
  var fields = getSanitizeFields_(category);
  var charLimits = {
    '付属品': 25, 'コンディション': 25, '故障・不具合': 25,
    'モデル名': 20, '付属レンズ': 25, '色': 10,
    'セット名': 30, 'カード名': 30, 'キャラクター名': 20,
    'カード番号': 15, 'レアリティ': 15, '鑑定会社': 10,
    '鑑定グレード': 10, '枚数': 10,
    '機種名': 25, 'エディション': 20, '対象魚種': 15,
    'リールタイプ': 10, '巻き方向': 10, 'サイズ/番手': 10
  };

  var lines = [
    'この商品はeBayに英語で出品します。',
    '翻訳AIに渡す前に、タイトルと説明文から必要な情報を抜き出してください。',
    'ブランド名・モデル名はタイトルに含まれていることが多いです。タイトルを必ず確認してください。',
    '',
    'タイトルと説明文から以下の項目を埋めてください。',
    'ソースに情報がない項目はNAと記入してください。',
    '各項目の文字数上限を厳守してください。',
    ''
  ];

  for (var i = 0; i < fields.length; i++) {
    var limit = charLimits[fields[i]] || 15;
    lines.push(fields[i] + ': (' + limit + '文字以内)');
  }

  lines.push('');
  lines.push('ルール:');
  lines.push('1. 数値はソースのまま忠実に出力する。丸めない、変換しない。');
  lines.push('2. ソースにない情報は書かない。NAにする。');
  lines.push('3. 出力は日本語のまま。ただしブランド名とモデル名は英語の正式名称で出力する。');
  lines.push('4. ブランド名は下記リストにあればそのスペルを正確に使用する。リストにない場合は正式な英語表記で出力する。');
  lines.push('5. 製造国はブランドの本国を記入する。工場の所在地（Made in China等）ではない。例: Seiko→日本、Canon→日本、Rolex→スイス、Leica→ドイツ、Casio→日本、Nikon→日本、Olympus→日本、Fujifilm→日本、Sony→日本、Panasonic→日本、TaylorMade→アメリカ、Titleist→アメリカ、Callaway→アメリカ、PING→アメリカ。ソースに「Made in ○○」と書いてあっても無視する。');

  // ブランド辞書リスト（カテゴリ別）
  var brandList = '';
  try {
    brandList = getBrandListForSanitize_(category);
  } catch (e) {
    brandList = '';
  }
  if (brandList) {
    lines.push('');
    if (category === 'Trading Cards') {
      lines.push('ゲーム名一覧（該当するものがあればこの英語表記を正確に使用してください）:');
    } else {
      lines.push('ブランド名一覧（該当するものがあればこの英語表記を正確に使用してください）:');
    }
    lines.push(brandList);
  }

  // カテゴリ別補足ルール（データ駆動）
  var catRule = CATEGORY_RULES_[category];
  if (catRule) {
    lines.push('');
    lines.push(catRule.label + '用の補足ルール:');
    for (var ri = 0; ri < catRule.rules.length; ri++) {
      if (catRule.rules[ri].indexOf('[EN]') === -1) {
        lines.push(catRule.rules[ri]);
      }
    }
  }

  lines.push('');
  lines.push('入力:');
  lines.push('タイトル（参考）: ${jpTitle}');
  lines.push('説明文: ${jpDesc}');

  return lines.join('\n');
}


/**
 * D列タグからISカテゴリ名を判定する
 * IS_TAG_TO_CATEGORY（Config_IS.gs）を参照し、64カテゴリ全てに対応
 * @param {string} tag - D列のタグ文字列
 * @return {string|null} ISカテゴリ名（'Watches', 'Cameras'等）。該当なしはnull
 */
function detectSanitizeCategory_(tag) {
  if (!tag) return null;
  var t = tag.toString().trim();
  if (!t) return null;

  // IS_TAG_TO_CATEGORYで完全一致
  if (IS_TAG_TO_CATEGORY[t]) return IS_TAG_TO_CATEGORY[t];

  // 部分一致フォールバック（長いキーワードから順にマッチ）
  var keys = Object.keys(IS_TAG_TO_CATEGORY);
  keys.sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) !== -1) return IS_TAG_TO_CATEGORY[keys[i]];
  }
  return null;
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理実行（2パス）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runSanitizeSelectedRows() {
  var startTime = Date.now();

  // 設定とシート取得
  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  // 選択行の取得
  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // J, K, AU, AV列を一括読み込み
  var maxCol = CONFIG.COLUMNS.JP_DESC_BACKUP; // AV列 = 48
  var allData = sheet.getRange(startRow, 1, numRows, maxCol).getValues();

  // 対象行を特定（D列タグでカテゴリ判定）
  var items = [];
  var skippedRows = [];
  for (var i = 0; i < numRows; i++) {
    var jpTitle = allData[i][CONFIG.COLUMNS.JP_TITLE - 1];
    var jpDesc  = allData[i][CONFIG.COLUMNS.JP_DESC - 1];

    if (!jpTitle && !jpDesc) continue;

    var backupDesc = allData[i][CONFIG.COLUMNS.JP_DESC_BACKUP - 1];
    if (backupDesc) continue;

    var tag = String(allData[i][CONFIG.COLUMNS.TAG - 1] || '');
    var category = detectSanitizeCategory_(tag);
    if (!category) {
      skippedRows.push({ row: startRow + i, tag: tag || 'タグなし' });
      continue;
    }

    items.push({ row: startRow + i, jpTitle: String(jpTitle || ''), jpDesc: String(jpDesc || ''), tag: tag, category: category });
  }

  if (items.length === 0) {
    var skipMsg = '交通整理する行がありません。\n（ソースが空、バックアップ済み、またはタグ未対応の行はスキップされます）';
    if (skippedRows.length > 0) { skipMsg += '\n\nスキップ: ' + skippedRows.map(function(s) { return '行' + s.row + '(' + s.tag + ')'; }).join(', '); }
    showAlert(skipMsg, 'info');
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(items.length + '行の交通整理を開始します...', '🧹 交通整理', 3);

  // Step 1: バックアップ（K→AV, Kクリア）
  for (var i = 0; i < items.length; i++) {
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP).setValue(items[i].jpDesc);
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC).setValue('');
  }
  SpreadsheetApp.flush();

  var BATCH_SIZE = 50;
  var errorDetails = [];
  var timeoutSkipped = 0;
  var promptCache = {};

  // Pass 1: 日本語構造化
  var pass2Items = [];
  var validationFailedItems = [];
  var apiFailedItems = [];
  var jaSuccessCount = 0;

  for (var batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
    if (Date.now() - startTime > 300000) { timeoutSkipped += (items.length - batchStart); break; }
    var batchEnd = Math.min(batchStart + BATCH_SIZE, items.length);
    var batchItems = items.slice(batchStart, batchEnd);

    var requests = [];
    var prompts = [];
    for (var j = 0; j < batchItems.length; j++) {
      var cat = batchItems[j].category;
      if (!promptCache[cat]) { promptCache[cat] = buildDefaultSanitizePrompt_(cat); }
      var prompt = promptCache[cat].replace('${jpTitle}', batchItems[j].jpTitle).replace('${jpDesc}', batchItems[j].jpDesc);
      prompts.push(prompt);
      requests.push(buildSanitizeRequest_(settings, prompt));
    }

    var responses;
    try { responses = UrlFetchApp.fetchAll(requests); }
    catch (e) { for (var j = 0; j < batchItems.length; j++) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: e.message }); } continue; }

    for (var j = 0; j < responses.length; j++) {
      try {
        var r = parseSanitizeResponse_(settings.platform, responses[j]);
        if (!r.ok) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: r.error }); continue; }
        var parsed = parseSanitizedFields_(r.content, batchItems[j].category);
        if (!parsed.description) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: 'PARSE_ERROR' }); continue; }
        sheet.getRange(batchItems[j].row, CONFIG.COLUMNS.JP_DESC).setValue(parsed.description);
        var val = validateSanitizedResult_(parsed.description, batchItems[j].category);
        if (val.valid) { pass2Items.push({ row: batchItems[j].row, category: batchItems[j].category }); jaSuccessCount++; }
        else { validationFailedItems.push({ item: batchItems[j], errors: val.errors }); }
      } catch (e) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: e.message || String(e) }); }
    }

    if (batchEnd < items.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
  }

  // Pass1: 失敗リトライ
  var retry = 0;
  while (apiFailedItems.length > 0 && retry < (CONFIG.MAX_RETRIES || 3)) {
    if (Date.now() - startTime > 300000) { timeoutSkipped += apiFailedItems.length; break; }
    retry++;
    var next = [];
    for (var i = 0; i < apiFailedItems.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (apiFailedItems.length - i); break; }
      var slice = apiFailedItems.slice(i, i + BATCH_SIZE);
      var reqs = slice.map(function(x){ return buildSanitizeRequest_(settings, x.prompt); });
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var k = 0; k < slice.length; k++) next.push(slice[k]); continue; }
      for (var r = 0; r < resps.length; r++) {
        var x = slice[r];
        var ok = parseSanitizeResponse_(settings.platform, resps[r]);
        if (!ok.ok) { next.push(x); continue; }
        var p = parseSanitizedFields_(ok.content, x.item.category);
        if (!p.description) { next.push(x); continue; }
        sheet.getRange(x.item.row, CONFIG.COLUMNS.JP_DESC).setValue(p.description);
        var v = validateSanitizedResult_(p.description, x.item.category);
        if (v.valid) { pass2Items.push({ row: x.item.row, category: x.item.category }); jaSuccessCount++; }
        else { validationFailedItems.push({ item: x.item, errors: v.errors }); }
      }
      if (i + BATCH_SIZE < apiFailedItems.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
    apiFailedItems = next;
    Utilities.sleep(Math.pow(2, retry) * 1000);
  }
  for (var i = 0; i < apiFailedItems.length; i++) { errorDetails.push('行' + apiFailedItems[i].item.row + ': API_ERROR ' + (apiFailedItems[i].error || '')); }

  // Pass2.5: バリデーション再構造化（1回）
  if (validationFailedItems.length > 0 && (Date.now() - startTime <= 300000)) {
    var retryItems = validationFailedItems;
    for (var i = 0; i < retryItems.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (retryItems.length - i); break; }
      var slice = retryItems.slice(i, i + BATCH_SIZE);
      var reqs = [];
      for (var s = 0; s < slice.length; s++) {
        var it = slice[s].item;
        var cat = it.category;
        if (!promptCache[cat]) promptCache[cat] = buildDefaultSanitizePrompt_(cat);
        var reason = slice[s].errors && slice[s].errors.length ? slice[s].errors.join('、') : '必須項目が不足しています';
        var extra = '補足: 前回の出力では ' + reason + '。必ず抽出してください。';
        var prompt = extra + '\n\n' + promptCache[cat].replace('${jpTitle}', it.jpTitle).replace('${jpDesc}', it.jpDesc);
        reqs.push(buildSanitizeRequest_(settings, prompt));
      }
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var s = 0; s < slice.length; s++) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_HTTP ' + e.message); } continue; }
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_API ' + ok.error); continue; }
        var p = parseSanitizedFields_(ok.content, slice[s].item.category);
        if (!p.description) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_PARSE'); continue; }
        sheet.getRange(slice[s].item.row, CONFIG.COLUMNS.JP_DESC).setValue(p.description);
        var v = validateSanitizedResult_(p.description, slice[s].item.category);
        if (v.valid) { pass2Items.push({ row: slice[s].item.row, category: slice[s].item.category }); jaSuccessCount++; }
        else { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_ERROR ' + (v.errors || []).join('、')); }
      }
      if (i + BATCH_SIZE < retryItems.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
  }

  // Pass 2: 英語化
  var enSuccessCount = 0;
  var enApiFailedItems = [];
  var enValidationFailedItems = [];
  if (pass2Items.length > 0 && (Date.now() - startTime <= 300000)) {
    for (var i = 0; i < pass2Items.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (pass2Items.length - i); break; }
      var slice = pass2Items.slice(i, i + BATCH_SIZE);
      var reqs = [];
      var prompts = [];
      for (var s = 0; s < slice.length; s++) {
        var jaStructured = String(sheet.getRange(slice[s].row, CONFIG.COLUMNS.JP_DESC).getValue() || '');
        var prompt = buildEnglishizePrompt_(slice[s].category, jaStructured);
        prompts.push(prompt);
        reqs.push(buildSanitizeRequest_(settings, prompt));
      }
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var s = 0; s < slice.length; s++) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: e.message }); } continue; }
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: ok.error }); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: 'EMPTY_OUTPUT' }); continue; }
        sheet.getRange(slice[s].row, CONFIG.COLUMNS.EN_DESC_SANITIZED).setValue(out);
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) { enValidationFailedItems.push({ item: slice[s], prompt: prompts[s] }); }
        else { enSuccessCount++; }
      }
      if (i + BATCH_SIZE < pass2Items.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
  }

  // Pass2: API失敗リトライ
  retry = 0;
  while (enApiFailedItems.length > 0 && retry < (CONFIG.MAX_RETRIES || 3)) {
    if (Date.now() - startTime > 300000) { timeoutSkipped += enApiFailedItems.length; break; }
    retry++;
    var nextEn = [];
    for (var i = 0; i < enApiFailedItems.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (enApiFailedItems.length - i); break; }
      var slice = enApiFailedItems.slice(i, i + BATCH_SIZE);
      var reqs = slice.map(function(x){ return buildSanitizeRequest_(settings, x.prompt); });
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var k = 0; k < slice.length; k++) nextEn.push(slice[k]); continue; }
      for (var r = 0; r < resps.length; r++) {
        var x = slice[r];
        var ok = parseSanitizeResponse_(settings.platform, resps[r]);
        if (!ok.ok) { nextEn.push(x); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { nextEn.push(x); continue; }
        sheet.getRange(x.item.row, CONFIG.COLUMNS.EN_DESC_SANITIZED).setValue(out);
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) { enValidationFailedItems.push({ item: x.item, prompt: x.prompt }); }
        else { enSuccessCount++; }
      }
      if (i + BATCH_SIZE < enApiFailedItems.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
    enApiFailedItems = nextEn;
    Utilities.sleep(Math.pow(2, retry) * 1000);
  }
  for (var i = 0; i < enApiFailedItems.length; i++) { errorDetails.push('行' + enApiFailedItems[i].item.row + ': EN_API_ERROR ' + (enApiFailedItems[i].error || '')); }

  // Pass 3.5: 英語化の再試行（日本語混入）
  if (enValidationFailedItems.length > 0 && (Date.now() - startTime <= 300000)) {
    for (var i = 0; i < enValidationFailedItems.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (enValidationFailedItems.length - i); break; }
      var slice = enValidationFailedItems.slice(i, i + BATCH_SIZE);
      var reqs = [];
      for (var s = 0; s < slice.length; s++) {
        var p = '補足: 出力に日本語が混入していました。全て英語で出力してください。\n\n' + slice[s].prompt;
        reqs.push(buildSanitizeRequest_(settings, p));
        slice[s].prompt = p;
      }
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var s = 0; s < slice.length; s++) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_RETRY_HTTP ' + e.message); } continue; }
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_RETRY_API ' + ok.error); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_RETRY_EMPTY'); continue; }
        sheet.getRange(slice[s].item.row, CONFIG.COLUMNS.EN_DESC_SANITIZED).setValue(out);
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_ERROR(日本語混入)'); }
        else { enSuccessCount++; }
      }
      if (i + BATCH_SIZE < enValidationFailedItems.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
  }

  // 結果報告
  var message = [];
  message.push('構造化成功: ' + jaSuccessCount + '件 / 英語化成功: ' + enSuccessCount + '件');
  if (errorDetails.length > 0) { message.push('構造化/英語化エラー: ' + errorDetails.length + '件'); }
  if (timeoutSkipped > 0) { message.push('時間切れ未処理: ' + timeoutSkipped + '件'); }
  if (skippedRows.length > 0) { message.push('スキップ: ' + skippedRows.length + '件 (' + skippedRows.map(function(s){ return '行' + s.row + '(' + s.tag + ')'; }).join(', ') + ')'); }
  if (errorDetails.length > 0) { message.push('詳細:\n' + errorDetails.join('\n')); }
  showAlert(message.join('\n'), errorDetails.length > 0 ? 'warning' : 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理を元に戻す
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function restoreSanitizeSelectedRows() {
  var ui = SpreadsheetApp.getUi();

  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // AV列を読み込み
  var backupData = sheet.getRange(startRow, CONFIG.COLUMNS.JP_DESC_BACKUP, numRows, 1).getValues();

  // バックアップがある行を特定
  var restoreItems = [];
  for (var i = 0; i < numRows; i++) {
    var backupDesc = backupData[i][0];
    if (backupDesc) {
      restoreItems.push({
        row: startRow + i,
        desc: backupDesc
      });
    }
  }

  if (restoreItems.length === 0) {
    showAlert('復元できる行がありません。\n（バックアップが存在する行のみ復元できます）', 'info');
    return;
  }

  // 確認ダイアログ
  var response = ui.alert(
    '交通整理を元に戻す',
    restoreItems.length + '行のソーステキストをバックアップから復元します。\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Step 1: K列を復元（J列はノータッチ）
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC)
      .setValue(restoreItems[i].desc);
  }
  SpreadsheetApp.flush();

  // Step 2: AV列をクリア
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP)
      .setValue('');
  }

  // AW列（英語版）もクリア
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.EN_DESC_SANITIZED)
      .setValue('');
  }

  showAlert(restoreItems.length + '行を復元しました。', 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI APIリクエスト構築
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 交通整理用のHTTPリクエストを構築する
 * AI.gsのbuildRequestForProvider_と同じ構造だが、
 * createAIPromptを経由しない（sanitizeInputJP_を適用しない）
 */
function buildSanitizeRequest_(settings, prompt) {
  var platform = settings.platform;
  var model    = settings.model;
  var apiKey   = settings.apiKey;

  // ---------- OpenAI ----------
  if (platform === 'openai') {
    var isGpt5 = /^gpt-5/i.test(model || '');

    if (isGpt5) {
      return {
        url: "https://api.openai.com/v1/responses",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-5-mini',
          input: [{
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }],
          reasoning: { effort: "low" },
          max_output_tokens: 4096
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    } else {
      return {
        url: "https://api.openai.com/v1/chat/completions",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2000
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    }
  }

  // ---------- Claude ----------
  if (platform === 'claude') {
    return {
      url: "https://api.anthropic.com/v1/messages",
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": "GoogleAppsScript/1.0"
      },
      payload: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  // ---------- Gemini ----------
  if (platform === 'gemini') {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/models/" + (model || 'gemini-1.5-flash') + ":generateContent?key=" + apiKey,
      method: "post",
      contentType: "application/json",
      headers: { "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  return {
    url: "about:blank",
    method: "get",
    muteHttpExceptions: true
  };
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AIレスポンス解析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * AIレスポンスからテキストを抽出する
 * AI.gsのparseProviderResponse_と同じ構造だが、
 * parseAIResponseToFieldsを経由しない（sanitizeListingText_を適用しない）
 */
function parseSanitizeResponse_(platform, httpResp) {
  try {
    var code = httpResp.getResponseCode();
    var text = httpResp.getContentText('utf-8') || '';
    if (code !== 200) {
      return { ok: false, error: 'HTTP ' + code + ' ' + text.slice(0, 200) };
    }

    var data;
    try { data = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'JSON parse error' }; }

    var content = '';

    if (platform === 'openai') {
      if (typeof data.output_text === 'string' && data.output_text) {
        content = data.output_text;
      } else if (Array.isArray(data.output) && data.output.length > 0) {
        for (var oi = 0; oi < data.output.length; oi++) {
          var item = data.output[oi];
          if (item && item.content && item.content.length) {
            for (var pi = 0; pi < item.content.length; pi++) {
              var part = item.content[pi];
              if (part && part.type === 'output_text' && (part.text || part.string_value)) {
                content = part.text || part.string_value;
                break;
              }
            }
            if (content) break;
          }
        }
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content || '';
      }

    } else if (platform === 'claude') {
      if (data.content && data.content[0]) {
        content = data.content[0].text || '';
      }

    } else if (platform === 'gemini') {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        var p0 = data.candidates[0].content.parts && data.candidates[0].content.parts[0];
        content = (p0 && p0.text) || '';
      }
    }

    if (!content) {
      return { ok: false, error: 'AIからの応答が空です' };
    }

    return { ok: true, content: content };

  } catch (e) {
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI出力からタイトル・説明を抽出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
// 英語化用プロンプト生成（パス2）
function buildEnglishizePrompt_(category, jaStructured) {
  var lines = [];
  lines.push('以下の日本語の商品情報を英語に翻訳してください。');
  lines.push('');
  lines.push('ルール:');
  lines.push('1. ブランド名・モデル名は英語の正式名称をそのまま使用する。');
  lines.push('2. 値のみ英語に翻訳する。キー構造は変えない。');
  lines.push('3. 出力は「英語フィールド名: 英語値」をパイプ(|)で区切った1行にする。');
  lines.push('4. NAの項目は出力しない。');
  lines.push('5. フィールド名は以下のリストの英語名を正確に使用する（自分で決めない）。');
  lines.push('');

  // CATEGORY_RULES_に[EN]セクションルールがあれば追加
  var catRule = CATEGORY_RULES_[category];
  if (catRule) {
    for (var ri = 0; ri < catRule.rules.length; ri++) {
      var rule = catRule.rules[ri];
      if (rule.indexOf('[EN]') !== -1) {
        lines.push(rule);
      }
    }
  }

  // IS_CATEGORY_FIELDSから英語フィールド名リストを取得
  lines.push('');
  try {
    if (typeof IS_CATEGORY_FIELDS !== 'undefined') {
      var enList = IS_CATEGORY_FIELDS[category] || [];
      var enNames = enList.slice();
      enNames.push('Accessories');
      enNames.push('Condition');
      enNames.push('Defects');
      if (enNames.length > 0) {
        lines.push('英語フィールド名: ' + enNames.join(' | '));
      }
    }
  } catch (e) {}

  lines.push('');
  lines.push('出力例（時計の場合）:');
  lines.push('Brand: Seiko | Model: Presage | Display: Analog | Movement: Automatic | Case Material: Stainless Steel | Dial Color: Blue | Country of Origin: Japan | Accessories: Box, Manual | Condition: Used, Good');
  lines.push('');
  lines.push('入力（日本語構造化データ）:');
  lines.push(jaStructured);

  return lines.join('\n');
}

// 構造化結果の簡易バリデーション
function validateSanitizedResult_(parsedDescription, category) {
  var errors = [];
  if (!parsedDescription || typeof parsedDescription !== 'string') {
    return { valid: false, errors: ['パース結果が空です'] };
  }

  // ブランドチェック（カテゴリによっては「メーカー」の場合もある）
  var hasBrand = /ブランド[：:]\s*.+/.test(parsedDescription) || /メーカー[：:]\s*.+/.test(parsedDescription);
  // ブランド/メーカーがNAでないか
  if (hasBrand) {
    var brandMatch = parsedDescription.match(/(?:ブランド|メーカー)[：:]\s*(.+?)(?:\s|$)/);
    if (brandMatch && /^N\/?A$/i.test(brandMatch[1].trim())) {
      hasBrand = false;
    }
  }
  if (!hasBrand) {
    errors.push('ブランド/メーカーが抽出されていません');
  }

  // フィールド数チェック（「フィールド名: 値」のペア数）
  var fieldCount = 0;
  var fields = getSanitizeFields_(category);
  for (var i = 0; i < fields.length; i++) {
    var escaped = fields[i].replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    var re = new RegExp(escaped + '[：:]\\s*.+');
    if (re.test(parsedDescription)) {
      fieldCount++;
    }
  }
  if (fieldCount < 2) {
    errors.push('抽出フィールド数が不足しています(' + fieldCount + '個)');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

function parseSanitizedFields_(content, category) {
  var result = { description: '' };

  // [JA]タグがあれば除去して本体を使う
  var jaIdx = content.search(/\[JA\]/i);
  var section = (jaIdx >= 0) ? content.substring(jaIdx + 4) : content;

  // [EN]タグが混じっていたらそこまでで切る
  var enIdx = section.search(/\[EN\]/i);
  if (enIdx >= 0) {
    section = section.substring(0, enIdx);
  }
  section = section.trim();

  // 日本語セクション: 既存ロジック（変更なし）
  var fields = getSanitizeFields_(category || 'Watches');
  var parts = [];
  for (var i = 0; i < fields.length; i++) {
    var re = new RegExp('^' + fields[i] + '[：:]\\s*(.+)$', 'm');
    var match = section.match(re);
    if (match) {
      var value = match[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (value && !/^N\/?A$/i.test(value) && value !== '-' && value !== 'なし' && value !== '不明') {
        parts.push(fields[i] + ': ' + value);
      }
    }
  }
  result.description = parts.join(' ');

  // フォールバック
  if (!result.description) {
    var descMatch = section.match(/^説明[：:][\s]*([\s\S]*)$/m);
    if (descMatch) {
      result.description = descMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }
  }

  return result;
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  交通整理結果からの確定値抽出
  K列の説明文から「フィールド名: 値」形式の構造化データを
  オブジェクトとして抽出する（ItemSpecificsの確定値ロック用）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * 交通整理済みの説明文（K列）から構造化データをパースしてオブジェクト化する
 * @param {string} description - K列の交通整理済み説明文
 * @param {string} category - ISカテゴリ名（例: 'Golf', 'Watches'）
 * @return {Object} フィールド名(日本語)→値のオブジェクト。該当データがなければ空オブジェクト
 */
function extractConfirmedFields_(description, category) {
  var result = {};
  if (!description || typeof description !== 'string') return result;

  // カテゴリ別フィールド定義を取得
  var fields = getSanitizeFields_(category);
  if (!fields || fields.length === 0) return result;

  for (var i = 0; i < fields.length; i++) {
    var fieldName = fields[i];
    // 「フィールド名: 値」または「フィールド名：値」のパターンを検索
    var re = new RegExp('^' + fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[：:]\\s*(.+)$', 'm');
    var match = description.match(re);
    if (match) {
      var value = match[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      // NA/空/不明はスキップ
      if (value && !/^N\/?A$/i.test(value) && value !== '-' && value !== 'なし' && value !== '不明') {
        result[fieldName] = value;
      }
    }
  }

  return result;
}

/**
 * 日本語フィールド名のオブジェクトを英語フィールド名に変換する
 * FIELD_EN_TO_JP_の逆引き（JP→EN）を使用
 * @param {Object} confirmedData - extractConfirmedFields_()の出力（日本語キー→値）
 * @return {Object} 英語フィールド名→値のオブジェクト。逆引きできないフィールドはスキップ
 */
function convertConfirmedToEnglish_(confirmedData) {
  var result = {};
  if (!confirmedData || typeof confirmedData !== 'object') return result;

  // FIELD_EN_TO_JP_の逆引きテーブルを構築（JP→EN）
  var jpToEn = {};
  var enKeys = Object.keys(FIELD_EN_TO_JP_);
  for (var i = 0; i < enKeys.length; i++) {
    var en = enKeys[i];
    var jp = FIELD_EN_TO_JP_[en];
    jpToEn[jp] = en;
  }

  // 日本語キーを英語に変換
  var jpKeys = Object.keys(confirmedData);
  for (var j = 0; j < jpKeys.length; j++) {
    var jpKey = jpKeys[j];
    var enKey = jpToEn[jpKey];
    if (enKey) {
      result[enKey] = confirmedData[jpKey];
    }
    // 逆引きできないフィールドはスキップ（AI補完に委ねる）
  }

  return result;
}
