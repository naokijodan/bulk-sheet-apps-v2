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
    '色', '画素数', '特徴', 'レンズマウント', 'バッテリータイプ',
    '付属レンズ', 'シャッター回数',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Trading Cards': [
    'ゲーム名', 'セット名', 'キャラクター名', 'カード名',
    'カード番号', 'レアリティ', '仕上げ', '言語',
    '鑑定会社', '鑑定グレード', 'カードタイプ',
    'コンディション', '枚数'
  ],
  'Baseball Cards': [
    'Player', 'Brand', 'Season', 'Set', 'Card Type',
    'Card Number', 'Professional Grader', 'Grade', 'Serial Number', 'Condition'
  ],
  'Video Game Consoles': [
    'メーカー', '機種名', '型番', 'タイプ',
    'ストレージ容量', '色', 'リージョン', 'エディション',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Video Game Accessories': [
    'メーカー', '対応機種', 'タイプ', '型番',
    '色', '接続方式', 'リージョン',
    'コンディション', '故障・不具合'
  ],
  'Fishing Reels': [
    'ブランド', 'モデル名', '型番', 'リールタイプ',
    '巻き方向', 'ギア比', 'ベアリング数', 'サイズ/番手', '対象魚種',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Fishing Lures': [
    'メーカー', 'タイプ', 'モデル名', '色',
    '重さ', '長さ', '浮力', '対象魚種',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Fishing Rods': [
    'ブランド', 'ロッドタイプ', 'モデル名',
    '長さ', 'パワー', 'アクション',
    '対象魚種', '釣りタイプ', '素材',
    '製造国', 'ピース数', '適合ライン',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Golf': [
    'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
    '利き手', 'フレックス', 'シャフト素材', 'クラブ番号',
    'セット構成', 'バウンス', 'ヘッド形状', 'ライ角',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Golf Heads': [
    'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
    '利き手', '素材', 'ライ角', 'ヘッド形状',
    'バウンス', 'ヘッドサイズ', 'シャフト互換', '仕上げ',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'PC Peripherals': [
    'ブランド', 'モデル名', 'タイプ', '接続方式', '対応機種', '色',
    '特徴', '製造国', '電源', '付属品', 'コンディション', '故障・不具合'
  ],
  'Electronic Dictionaries': [
    'ブランド', 'モデル名', 'タイプ', '対応言語', '収録辞書数', '画面サイズ',
    '特徴', '電源', '製造国', '色', '付属品', 'コンディション', '故障・不具合'
  ],
  'Scientific Calculators': [
    'ブランド', 'モデル名', 'タイプ', '表示行数', '表示タイプ', '電源',
    '製造国', '製造年', '関数数', '色', '付属品', 'コンディション', '故障・不具合'
  ],
  'Laptops': [
    'ブランド', 'モデル名', 'タイプ', 'シリーズ', 'プロセッサ', 'プロセッサ速度',
    'メモリ容量', 'SSD容量', 'HDD容量', 'ストレージ種別', 'OS', '画面サイズ',
    '画面解像度', 'グラフィックス種別', 'GPU', '色', '接続方式',
    '製造年', '付属品', 'コンディション', '故障・不具合'
  ],
  'Desktops': [
    'ブランド', 'モデル名', 'タイプ', 'プロセッサ', 'メモリ容量', 'SSD容量',
    'HDD容量', 'OS', 'フォームファクター', 'GPU', '色', '接続方式',
    '製造年', '付属品', 'コンディション', '故障・不具合'
  ],
  'Tablets': [
    'ブランド', 'モデル名', 'ストレージ容量', 'OS', '画面サイズ',
    'インターネット接続', '色', 'メモリ容量', 'プロセッサ', 'バッテリー時間',
    '接続方式', '製造年', '付属品', 'コンディション', '故障・不具合'
  ]
  ,
  // 追加: 簡易カテゴリ（game/reel）
  game: [
    'メーカー', '機種名', '型番', 'タイプ',
    'ストレージ容量', '色', 'リージョン',
    '付属品', 'コンディション', '故障・不具合'
  ],
  reel: [
    'メーカー', 'モデル名', '型番', 'リールタイプ',
    '巻き方向', 'ギア比', 'サイズ/番手',
    '付属品', 'コンディション', '故障・不具合'
  ],
  lure: [
    'メーカー', 'タイプ', 'モデル名', '色',
    '重さ', '長さ', '浮力',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Japanese Dolls': [
    'タイプ', '素材', '作家名', '産地', '年代', 'サイズ',
    '技法', 'モチーフ', 'オリジナル/復刻', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Necklaces': [
    'スタイル', 'ブランド', 'タイプ', '金属', '金属純度', '主石', '色', '主石の色', 'ペンダントの形', 'テーマ', 'チェーン長', '留め金'
  ],
  'Bracelets': [
    'ブランド', 'スタイル', 'タイプ', '金属', '金属純度', '主石', '色', '主石の色', 'チャームタイプ', 'テーマ', '宝石の数'
  ],
  'Cufflinks': [
    'ブランド', 'タイプ', '金属', '金属純度', '主石', '色', 'スタイル', '主石の色', 'ダイヤカラーグレード', '総カラット重量', 'テーマ'
  ],
  'Charms': [
    'ブランド', 'スタイル', 'タイプ', '金属', '色', '主石', 'テーマ', '金属純度', 'ペンダントの形', 'チャームタイプ', '主石の色'
  ],
  'Earrings': [
    'ブランド', 'スタイル', 'タイプ', '金属', '金属純度', '主石', '色', '主石の色', '留め金', '主石の生成方法', 'テーマ'
  ],
  'Rings': [
    'ブランド', 'リングサイズ', 'タイプ', '金属', '金属純度', '主石', 'スタイル', '主石の色', '色', 'セッティング', '総カラット重量', '副石'
  ],
  'Brooches': [
    'タイプ', 'ブランド', '素材', '色', '金属', '主石', '主石の色', 'テーマ', 'スタイル', 'セッティングスタイル', '主石の生成方法', '金属純度'
  ],
  // --- Phase 3 追加 ---
  'Electronics': [
    'ブランド', 'モデル名', 'タイプ', '接続方式', '特徴', '電源', '色', '製造国',
    'ワイヤレス方式', 'フォームファクター', '製造年', 'シリーズ', '片耳/両耳',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Guitars': [
    'ブランド', 'タイプ', 'モデル名', 'ボディカラー', 'ボディタイプ', '弦構成',
    '利き手', '年式', 'フレット数', '製造国', 'シリーズ', '指板素材', 'ブリッジタイプ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Musical Instruments': [
    'ブランド', 'モデル名', 'タイプ', '素材', '色', 'サイズ',
    '調/ピッチ', '特徴', '年式', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Synths & Digital': [
    'ブランド', 'モデル名', 'タイプ', '鍵盤数', 'アナログ/デジタル', '色',
    '接続方式', '特徴', '年式', '製造国', 'アクション', 'ポリフォニー', 'タッチ感度',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Effects & Amps': [
    'ブランド', 'モデル名', 'タイプ', 'アナログ/デジタル', '電源', 'バイパス方式',
    '色', '特徴', '年式', '製造国', 'ワット数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 3 追加 (日本美術系 7 カテゴリ) ---
  'Bonsai': [
    'タイプ', '素材', 'サイズ', '色', '形状',
    '作家/窯元', '時代', '釉薬/仕上げ', '水抜き穴', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Tetsubin': [
    'ブランド', 'タイプ', '素材', '作家/窯元', '時代',
    '技法', '模様', 'サイズ', '容量', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Japanese Instruments': [
    'タイプ', '素材', '作家', 'サブタイプ', '調/ピッチ',
    '時代', 'サイズ', '色', 'セット内容', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Japanese Swords': [
    'タイプ', '素材', '技法', '時代', '流派/作者',
    '図柄', 'サイズ', '色', 'オリジナル/複製', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Kimono': [
    'ブランド', 'タイプ', '素材', '色', '模様',
    'シーズン', 'サイズ', '技法/産地', '製造国', '年代',
    '対象', '用途',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Tea Ceremony': [
    'タイプ', '素材', '作家', '産地/窯', '時代',
    '箱', 'サイズ', '図柄', '模様', '製造国', '色',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Buddhist Art': [
    'タイプ', '素材', '尊格', '作家', '技法',
    'スタイル', 'サイズ', '年代', 'オリジナル/複製', '製造国',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 3 追加 (模型系 3 カテゴリ) ---
  'Figures': [
    'フランチャイズ', 'キャラクター', 'タイプ', 'ブランド', 'スケール',
    '素材', 'シリーズ/ライン', '正規品/海賊版', '発売年', '製造国',
    'テーマ', '対象年齢', '特徴',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Mecha Model Kits': [
    'ブランド', 'シリーズ/フランチャイズ', 'キャラクター/メカ', 'グレード', 'スケール',
    'タイプ', '組立状態', '発売年', '製造国',
    'テーマ', '対象年齢', '特徴',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'RC & Models': [
    'ブランド', 'タイプ', 'スケール', '車種/機種', 'モデル/シリーズ',
    '動力源', '組立状態', '製造国', 'モーターの種類', '4WD/2WD',
    '製造年', '特徴', '対象年齢',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 3 追加 (アート系 2 カテゴリ) ---
  'Art': [
    'アーティスト', '制作技法', '題材', 'スタイル', 'サイズ',
    '素材', 'オリジナル/複製', '制作年代', '製造国',
    'フレーミング', 'サイン入り',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Prints': [
    '技法', '題材', '作家', 'スタイル', 'サイズ',
    '時代', 'オリジナル/複製', 'エディション', '製造国',
    'シリーズ', 'フレーミング', 'サイン入り',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 3 追加 (伝統工芸・漫画系 3 カテゴリ) ---
  'Kakejiku': [
    'アーティスト', '制作技法', '本紙素材', '表装', '軸先素材', '箱',
    '題材', 'サイズ', '制作年代', '製造国', 'スタイル', 'シーズン',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Pottery': [
    'ブランド', 'タイプ', '素材', '色', '制作技法', '産地/窯',
    'スタイル', '模様', 'サイズ', '製造国', '時代', '作家',
    '釉薬/仕上げ', '題材',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Manga': [
    'タイトル', '作者', '巻数/セット', 'フォーマット', '発売元', '言語',
    'ジャンル', 'エディション', '製造国', 'テーマ', '出版年', '特徴', '対象年齢',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 3 追加 (アクセサリー系 3 カテゴリ) ---
  'Hair Accessories': [
    'タイプ', 'ブランド', '色', '素材', '髪質', '製造国',
    'ヴィンテージ', 'シーズン', 'シリーズ', 'フランチャイズ', 'キャラクター', '模様', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Tie Accessories': [
    'ブランド', 'タイプ', '金属', '金属純度', '主石', '色', '素材', '製造国',
    'ヴィンテージ', 'シリーズ', '個数', '性別',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Watch Parts': [
    'ブランド', 'パーツタイプ', '素材', '対応モデル', 'サイズ', '色', '製造国',
    'タイプ', '互換ブランド', 'ムーブメントタイプ', '仕上げ', 'ヴィンテージ', 'シリーズ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Anime': [
    '出品者区分', 'キャラクター', 'フランチャイズ', 'タイプ', '公式/非公式',
    'ブランド', '年', '製造国', 'テレビ番組名', 'テーマ', 'エディション',
    '特徴', '対象年齢', '素材',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Snow Globes': [
    '出品者区分', 'ブランド', 'タイプ', '題材', 'キャラクター', 'フランチャイズ',
    '素材', '特徴', '用途', 'コレクション', '製造年', '製造国', 'テーマ', '対象年齢',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 4 追加 (アパレル系 6 カテゴリ) ---
  'Handbags': [
    'ブランド', 'スタイル', '外装素材', '外装色', '対象', '製造国',
    '色', 'サイズ', '開閉', '金具色', '裏地素材', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Clothing': [
    'ブランド', 'タイプ', '対象', '色', '素材', '製造国',
    'サイズタイプ', 'サイズ', 'スタイル', '模様', 'ヴィンテージ', '性別',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Scarves': [
    'ブランド', 'タイプ', '素材', '色', 'サイズ', '模様', '製造国',
    '対象', 'ヴィンテージ', '性別',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Neckties': [
    'ブランド', '色', '素材', 'タイプ', '模様', '対象', '幅', '製造国', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Hats': [
    'ブランド', 'スタイル', '対象', '色', '素材', '模様', 'サイズ', '製造国',
    'タイプ', 'キャラクター', 'ヴィンテージ', '公式/非公式',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Handkerchiefs': [
    'ブランド', '色', '素材', '模様', '製造国', '性別',
    'タイプ', '対象', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 4 追加 (テーブルウェア系 4 カテゴリ) ---
  'Dinnerware': [
    'ブランド', '素材', 'タイプ', '色', '模様', '形状',
    'セット内容', '人数分', 'テーマ', '製造国', '産地', '制作技法', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Glassware': [
    'ブランド', 'タイプ', '素材', '色', '制作技法', '模様',
    '題材', '製造国', 'ガラス器種別', '産地', 'ヴィンテージ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Boxes': [
    'ブランド', 'タイプ', '素材', '色', '用途', '形状',
    '裏地素材', 'テーマ', '製造国', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Flatware': [
    'ブランド', 'タイプ', '模様', '素材構成', '年代', '製造国',
    '個数', '素材', '色', '人数分', 'シリーズ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 4 追加 (一般商品系 4 カテゴリ) ---
  'Dolls & Plush': [
    'ブランド', 'タイプ', 'キャラクター', 'サイズ', '色', '素材',
    '製造国', 'フランチャイズ', '性別', '髪色', '目の色', '肌色',
    'テーマ', 'ヴィンテージ', 'シリーズ', '製造年',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Key Chains': [
    'ブランド', '素材', '色', 'キャラクターファミリー', '製造国',
    'パーツタイプ', 'タイプ', 'シリーズ', 'キャラクター', 'フランチャイズ',
    'ヴィンテージ', '公式/非公式', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Combs': [
    'タイプ', 'ブランド', '色', '素材', 'テーマ', '製造国',
    '模様', '用途', 'ヴィンテージ', 'シーズン', '髪質',
    'キャラクター', 'フランチャイズ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Baby': [
    'ブランド', 'タイプ', '素材', '色', 'キャラクター', '製造国',
    'サイズ', '対象年齢', '性別', 'テーマ', 'フランチャイズ',
    '用途', 'ヴィンテージ', '模様', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 4 追加 (レザーグッズ系 3 カテゴリ) ---
  'Wallets': [
    'ブランド', 'タイプ', '素材', '色', '製造国',
    '開閉', '模様', '性別', 'ヴィンテージ', 'シリーズ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Belts': [
    'ブランド', 'タイプ', '素材', '色', 'サイズ', '製造国',
    '開閉', '模様', 'サイズタイプ', 'ベルト幅', 'アクセント', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Belt Buckles': [
    'ブランド', 'タイプ', '素材', '色',
    '対応ベルト幅', '模様', '製造国', 'サイズ', '用途/アクティビティ', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 5 追加 (ゲーム・コイン・切手系 3 カテゴリ) ---
  'Video Games': [
    'プラットフォーム', 'ゲーム名', 'リージョンコード', 'ジャンル', 'キャラクター',
    '発売元', 'レーティング', '言語', '製造国', '発売年',
    'シリーズ', 'フランチャイズ', 'エディション', '最大プレイヤー数', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Coins': [
    '鑑定', '額面', '年', '素材構成', 'グレード',
    '製造国', 'タイプ', 'シリーズ', '造幣局', 'テーマ',
    '仕上げ', 'ヴィンテージ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Stamps': [
    '鑑定', 'タイプ', '発行年', 'テーマ', '品質',
    '製造国', 'グレード', 'シリーズ', '額面',
    'ヴィンテージ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Phase 6 追加 (最終バッチ 10 カテゴリ) ---
  'Shoes': [
    'ブランド', 'タイプ', '部門', 'カラー', '素材',
    '製造国', '米国靴サイズ', 'サイズ', 'スタイル', 'パターン',
    'シリーズ', 'ヴィンテージ', '性別',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Collectibles': [
    'ブランド', 'キャラクター', 'フランチャイズ', 'タイプ', 'テーマ',
    '素材', 'サイズ', '製造国', 'コレクション',
    '題材', 'キャラクターファミリー', 'カラー', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Records': [
    'アーティスト', 'タイトル', 'ジャンル', 'レコード評価', 'レーベル',
    'フォーマット', 'レコードサイズ', '発売年', 'ジャケット評価',
    '製造国', '素材', 'タイプ', 'カラー', 'スピード(RPM)',
    'エディション', '製造国(プレス元)', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Soap': [
    'ブランド', 'タイプ', '香り', '製品ライン', 'カラー',
    '製造国', '成分', '使用部位', '肌タイプ',
    'サイズ', 'アイテム重量', 'シリーズ', '個数',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Baseball': [
    'ブランド', '利き手', 'ポジション', 'サイズ', 'タイプ',
    '素材', 'カラー', 'スポーツ', '製造国',
    '年式', '対象レベル', '裏地素材', 'ヴィンテージ', 'シリーズ/ライン',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Sunglasses': [
    'ブランド', 'モデル', 'フレーム色', 'レンズ色', 'フレーム素材',
    'スタイル', '製造国', 'タイプ', 'レンズテクノロジー', 'UV保護',
    'サイズ', 'シリーズ', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Pens': [
    'ブランド', '素材', 'インク色', 'ニブサイズ', 'ニブ素材',
    'タイプ', 'ヴィンテージ', '製造国', 'カラー', 'シリーズ', 'デザイナー',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Kitchen Knives': [
    'タイプ', 'ブランド', '刃素材', '刃渡り', '柄素材',
    '刃のタイプ', '利き手', '刀匠/メーカー', '製造国',
    'コンディション', 'ヴィンテージ', 'シリーズ', '個数',
    '付属品', '故障・不具合'
  ],
  'Tennis': [
    'ブランド', 'タイプ', 'ヘッドサイズ', 'グリップサイズ', 'ストリングパターン',
    '重量', '製造国', 'モデル', 'フレックス', 'バランス',
    'カラー', '素材', 'レベル', 'シリーズ', '性別', '対象年齢', 'ヴィンテージ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Pipes': [
    'ブランド', '形状', '素材', 'フィルターサイズ', 'ハンドメイド',
    '製造国', 'カラー', 'タイプ', 'ボウルサイズ', 'ステム素材',
    'シリーズ', '仕上げ', 'ヴィンテージ', '製造年',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Books & Magazines': [
    '著者/アーティスト', '発売元', '言語', 'フォーマット',
    '発行年', '製造国', '題材', 'ISBN',
    '号数', 'ブランド', 'ヴィンテージ', 'シリーズ',
    '付属品', 'コンディション', '故障・不具合'
  ],
  // --- Board Games 追加 ---
  'Board Games': [
    'ゲームタイトル', 'ゲームタイプ', 'メーカー', 'プレイ人数', '対象年齢',
    '言語', '製造国', '素材', '年代', 'ヴィンテージ',
    'コンポーネント構成', '付属品', 'コンディション', '故障・不具合'
  ]
};

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ別補足ルール（データ駆動）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var CATEGORY_RULES_ = {
  'Cameras': {
    label: 'カメラ',
    rules: [
      '- タイプ: 一眼レフ/ミラーレス/コンパクト/フィルムカメラ/中判カメラ/大判カメラ/レンジファインダー/二眼レフ/蛇腹カメラ/アクションカメラ/インスタントカメラ のいずれかで記入。',
      '- シリーズ: ブランドの製品ラインを記入。例: Canon→EOS/PowerShot, Nikon→D/Z/FM, Sony→Alpha/Cyber-shot, Fujifilm→X/GFX, Olympus→OM-D/PEN/OM, Pentax→K/645, Leica→M/R/Q, Contax→G/T/RTS, Mamiya→RB67/RZ67/645, Hasselblad→500/H/X',
      '- レンズマウント: マウント名を記入。例: EFマウント/FDマウント/RFマウント/Fマウント/Zマウント/Eマウント/Aマウント/マイクロフォーサーズ/Xマウント/Kマウント/Mマウント/M42/C/Yマウント/Lマウント',
      '- バッテリータイプ: リチウムイオン/単3/CR123A/CR2/ボタン電池/不要 のいずれか。型番（LP-E6, EN-EL15等）がある場合はリチウムイオンと判断。',
      '- 画素数: 万画素の数字をそのまま記入（例: 2420万画素）。',
      '- フィルム形式（フィルムカメラの場合）: 35mm/中判(120)/大判(4x5)/APS/110/127 のいずれかで記入。デジタルカメラの場合はNA。',
      '- 接続: Wi-Fi/Bluetooth/NFC/USB-C/HDMI 等。デジタルカメラのみ。該当なしの場合はNA。',
      '- シャッター回数: 数値で記入（例: 15000回）。不明ならNA。推測禁止。'
    ]
  },
  'Trading Cards': {
    label: 'カード',
    rules: [
      '- ゲーム名: ポケモンカード/遊戯王/MTG/デュエルマスターズ/ヴァイスシュヴァルツ/ヴァンガード/バトルスピリッツ/ドラゴンボール/ワンピース/大相撲 のいずれかで記入。',
      '- セット名: パック名・エキスパンション名をそのまま記入。コード（SV2a, SM12a等）も併記。',
      '- キャラクター名: ポケモン名/モンスター名/選手名を記入。「ex」「VMAX」等の接尾辞はカード名に含める。',
      '- カード名: カードの正式名称。種類接尾辞を含む（例: リザードンex SAR）。',
      '- カード番号: コレクター番号をそのまま記入（例: 201/165, #123）。',
      '- レアリティ: R/SR/UR/SAR/AR/HR/RR/C/UC/CSR/SSR等のコードまたは正式名称で記入。',
      '- 仕上げ: ホロ/ノンホロ/フルアート/リバースホロ/クローム 等。',
      '- 言語: 日本語/英語/中国語/韓国語 等。',
      '- 鑑定会社: PSA/BGS/CGC/SGC。鑑定済みでなければNA。',
      '- 鑑定グレード: 10/9.5/9等の数値。鑑定済みでなければNA。',
      '- カードタイプ: ポケモンカードはポケモン/トレーナーズ/エネルギー、遊戯王はモンスター/魔法/罠。不明ならNA。',
      '- 枚数: まとめ売りの場合の枚数。単品ならNA。',
      '',
      '重要: カード名とキャラクター名を混同しない。キャラクター名は「ピカチュウ」、カード名は「ピカチュウVMAX SA」のように区別する。'
    ]
  },
  'Baseball Cards': {
    label: '野球カード（英語直接出力）',
    rules: [
      '- Player: List all players found in the source in English. Japanese players use official English name (e.g. Shohei Ohtani, Ichiro Suzuki, Yu Darvish, Hideo Nomo). Foreign players use English name (e.g. Mookie Betts). No duplicates. List every player found.',
      '- Brand: Topps / Bowman / BBM / Panini / Upper Deck / Calbee / Epoch etc. Only if explicitly stated in source. NA if not found.',
      '- Season: YYYY format. YYYY-YYYY for multi-year. NA if not found.',
      '- Set: Official set name (e.g. Topps Series 1, Bowman Chrome, BBM Rookie Edition). NA if not found.',
      '- Card Type: Base / RC / Auto / Relic / Refractor / Parallel / Prizm / Chrome etc. NA if not found.',
      '- Card Number: #123 / 45/99 / SP-1 etc. NA if not found.',
      '- Professional Grader: PSA / BGS / CGC / SGC. NA if ungraded.',
      '- Grade: 10 / 9.5 / 9 etc. NA if ungraded.',
      '- Serial Number: /99, /25, /10, /5, /1 etc. NA if not found.',
      '- Condition: Short English word only. Mint / Near Mint / Excellent / Good / Poor. No descriptions or sentences. NA if graded.',
      '- Do not fabricate. If not in source, write NA.',
      '- All values must be in English.'
    ]
  },
  'Video Game Accessories': {
    label: 'ゲーム周辺機器',
    rules: [
      '- タイプ: Controller(コントローラー)/Joystick(ジョイスティック)/Arcade Stick(アケコン)/Memory Card(メモリーカード)/Cable(ケーブル)/Adapter(アダプター)/Case(ケース)/Charger(充電器) のいずれかで記入。',
      '- メーカー: Nintendo/Sony/Sega/Hori/8BitDo/Mad Catz/Razer/Brook 等。純正品はゲーム機メーカー名、サードパーティは製造メーカー名。',
      '- 対応機種: 正式名称で記入。例: Nintendo Switch, PlayStation 5, Super Famicom。',
      '- 接続方式: Wireless(無線)/Wired(有線)/Bluetooth/USB/RF のいずれかで記入。',
      '- リージョン: 日本製品はNTSC-J。リージョンフリーは明記がある場合のみ。',
      '- [EN]セクションでは: Type は英語（Controller, Memory Card等）。Platform は正式英語名。Brand は英語名。'
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
      '- シャフト名: メーカー名+モデル名で記入（例: Fujikura Speeder Evolution VII, Dynamic Gold S200）。不明ならNA。',
      '- バランス: スイングウェイトを記入（例: D1, D2, C9）。不明ならNA。',
      '- ヘッド体積（ドライバーの場合）: cc単位で記入（例: 460cc）。不明ならNA。',
      '- クラブ長さ: インチ単位で記入（例: 45.5インチ）。不明ならNA。',
      '- [EN]セクションでは: Golf Club Type は Driver/Fairway Wood/Hybrid/Iron/Iron Set/Wedge/Putter。Handedness は Right-Handed/Left-Handed。Shaft Material は Graphite/Steel。Loft は数値+°（例: 10.5°）。Flex は Regular/Stiff/Regular-Stiff/X-Stiff/Ladies/Senior。Swing Weight は D0/D1/D2/D3/D4/C8/C9等。'
    ]
  },
  'Golf Heads': {
    label: 'ゴルフ',
    rules: [
      '- クラブタイプ: ドライバー/フェアウェイウッド/ユーティリティ/アイアン/アイアンセット/ウェッジ/パター のいずれかで記入。英語で書かない。',
      '- ロフト角: 数値+°で記入（例: 10.5°, 9°）。「度」は使わない。小数点以下がない場合も°を付ける。',
      '- 利き手: 右利き/左利き のいずれかで記入。英語で書かない。記載がなければNA。',
      '- モデル名: モデル名のみ記入。クラブタイプ（Driver, ドライバー等）を含めない。',
      '- ヘッド素材: チタン/ステンレス/軟鉄/マレージング鋼/カーボンコンポジット のいずれかで記入。',
      '- ライ角: 数値+°で記入（例: 60°）。不明ならNA。',
      '- ヘッド形状（パターの場合）: ブレード/マレット/ミッドマレット のいずれかで記入。',
      '- バウンス（ウェッジの場合）: 数値+°で記入（例: 12°）。不明ならNA。',
      '- ヘッド体積（ドライバーの場合）: cc単位で記入（例: 460cc）。不明ならNA。',
      '- [EN]セクションでは: Golf Club Type は Driver/Fairway Wood/Hybrid/Iron/Iron Set/Wedge/Putter。Handedness は Right-Handed/Left-Handed。Material は Titanium/Stainless Steel/Forged Carbon Steel/Maraging Steel/Carbon Composite。Head Shape は Blade/Mallet/Mid-Mallet。'
    ]
  },
  'PC Peripherals': {
    label: 'パソコン周辺機器',
    rules: [
      '- ブランド: Logitech(ロジクール)/Elecom(エレコム)/Sanwa/Buffalo/Anker/Razer/Corsair/SteelSeries/HyperX/Apple/Microsoft/Dell/HP/Lenovo/Seagate/Western Digital/Samsung等',
      '- モデル名: 型番そのまま保持 (例: MX Master 3S, G PRO X Superlight, HD Pro C920)',
      '- タイプ: Keyboard(キーボード)/Mouse(マウス)/Webcam(ウェブカメラ)/USB Hub(USBハブ)/External HDD(外付けHDD)/External SSD(外付けSSD)/Microphone(マイク)/Headset(ヘッドセット)/Cable(ケーブル)/Docking Station(ドッキングステーション)/Monitor(モニター)',
      '- 接続方式: Wired(有線)/Wireless(無線)/Bluetooth/USB-C',
      '- 対応機種: PC/Mac/Universal。不明ならNA',
      '- 色/特徴/製造国/電源: 記載があれば保持、なければNA',
      '- 付属品: 記載された付属品をそのまま保持',
      '- コンディション: 新品/美品/中古/訳あり等。ソース記載を優先',
      '- [EN]セクション: Type/Brand/Connectivity/Compatibility は英語で出力'
    ]
  },
  'Electronic Dictionaries': {
    label: '電子辞書',
    rules: [
      '- ブランド: Casio(カシオ EX-word)/Sharp(シャープ Brain)/Canon(キヤノン wordtank)/Seiko(セイコー IC Dictionary)/Franklin',
      '- モデル名: XD-SX / XD-Z / PW-A / PW-SH / IDP / 等の型番を正確に',
      '- タイプ: Handheld(携帯型)/Desktop(据置型)',
      '- 対応言語: Japanese(日本語)/English(英語)/Chinese(中国語)/Korean(韓国語)/Multilingual(多言語)',
      '- 収録辞書数: 100/200/250等の数値。記載なければNA',
      '- 画面サイズ: 3.5 in / 4.0 in / 5.7 in 等',
      '- 特徴: Touch Panel/Voice Recognition/Camera/Handwriting Input 等',
      '- 電源: Battery/USB/AC Adapter',
      '- 不明な情報はNA',
      '- [EN]セクション: Type/Brand/Dictionary Language は英語出力'
    ]
  },
  'Scientific Calculators': {
    label: '関数電卓',
    rules: [
      '- ブランド: Casio(カシオ)/Texas Instruments(テキサスインスツルメンツ TI)/HP(ヒューレットパッカード)/Sharp(シャープ)/Canon(キヤノン)',
      '- モデル名: fx-CG50 / fx-991EX / fx-JP900 / TI-84 Plus CE / TI-Nspire CX II / HP Prime G2 / EL-W516T 等の型番',
      '- タイプ: Scientific(関数電卓)/Graphing(グラフ電卓)/Financial(金融電卓)/Basic(一般電卓)/Printing(プリンタ付)',
      '- 表示行数: 1/2/4/Multiline',
      '- 表示タイプ: Dot Matrix/LCD/Color Display',
      '- 電源: Battery(乾電池)/Solar(太陽電池)/Solar+Battery(ソーラー+電池)/USB',
      '- 関数数: 記載があれば保持（例: 552 functions）',
      '- ヴィンテージ機（HP-41C / HP-15C / Sharp PC-1211 等 RPN/pocket computer）はCollectibles寄りの扱いになる場合も記載で明示',
      '- 不明な情報はNA',
      '- [EN]セクション: Type/Brand/Model は英語出力'
    ]
  },
  'Laptops': {
    label: 'ノートパソコン',
    rules: [
      '- ブランド: Apple/Lenovo/Dell/HP/ASUS/VAIO/Panasonic/Fujitsu/NEC/dynabook/Acer/Microsoft 等。ソース記載を優先。',
      '- モデル名: 型番や製品名をそのまま保持。例: MacBook Pro 14, ThinkPad X1 Carbon, Let\'s note CF-SV。',
      '- タイプ: ノートパソコン/ラップトップ/ウルトラブック/ネットブック/2-in-1 のいずれかで記入。',
      '- プロセッサ: Intel Core i3/i5/i7/i9, Apple M1/M2/M3/M4, AMD Ryzen, Celeron, Pentium 等をそのまま保持。',
      '- メモリ容量/SSD容量/HDD容量: 数値+単位で記入（例: 16GB, 512GB, 1TB）。不明ならNA。',
      '- ストレージ種別: SSD/HDD/eMMC/Hybrid のいずれか。両方ある場合は主ストレージを優先。',
      '- OS: Windows 11/Windows 10/macOS/Chrome OS/Linux 等を英語で保持。',
      '- 画面サイズ/画面解像度: 記載があれば保持。例: 13.3インチ, 1920x1080, WQXGA。',
      '- グラフィックス種別: 内蔵/専用 → Integrated / Dedicated として英語化。',
      '- GPU: Intel Iris Xe / RTX 4060 / Radeon Graphics 等をそのまま保持。',
      '- 接続方式: Wi-Fi/Bluetooth/USB-C/HDMI/Thunderbolt 等。記載分のみ。',
      '- [EN]セクションでは: Type は Notebook/Laptop / Ultrabook / Netbook / 2-in-1。Storage Type は SSD/HDD/eMMC/Hybrid。Graphics Processing Type は Integrated / Dedicated。'
    ]
  },
  'Desktops': {
    label: 'デスクトップパソコン',
    rules: [
      '- ブランド: Apple/Lenovo/Dell/HP/ASUS/Acer/MSI/Alienware/NEC/Fujitsu 等。ソース記載を優先。',
      '- モデル名: 型番や製品ラインをそのまま保持。例: iMac 24, OptiPlex 7090, ThinkCentre M75q。',
      '- タイプ: デスクトップ/一体型/ミニPC/タワー/ワークステーション のいずれかで記入。',
      '- プロセッサ/メモリ容量/SSD容量/HDD容量: 数値や型番をそのまま保持。推測禁止。',
      '- OS: Windows 11/Windows 10/macOS/Linux 等を英語で保持。',
      '- フォームファクター: Tower/Mini Tower/SFF/All-in-One/NUC のいずれか。不明ならNA。',
      '- GPU: RTX 4070 / Radeon RX 7800 XT / Intel UHD 等をそのまま保持。',
      '- 接続方式: Wi-Fi/Bluetooth/USB-C/HDMI/Ethernet/DisplayPort 等。記載分のみ。',
      '- [EN]セクションでは: Type は Desktop / All-in-One / Mini PC / Tower / Workstation。Form Factor は Tower / Mini Tower / SFF / All-in-One / NUC。'
    ]
  },
  'Tablets': {
    label: 'タブレット',
    rules: [
      '- ブランド: Apple/Microsoft/Samsung/Google/Lenovo/Amazon 等。ソース記載を優先。',
      '- モデル名: iPad Pro, iPad Air, Surface Pro 9, Galaxy Tab S9 等のモデル名を保持。',
      '- ストレージ容量: 数値+単位で記入（例: 64GB, 128GB, 256GB）。不明ならNA。',
      '- OS: iPadOS/iOS/Android/Windows のいずれかで記入。',
      '- 画面サイズ: 記載があれば保持。例: 10.9インチ, 12.9インチ。',
      '- インターネット接続: Wi-Fi / Wi-Fi + 4G / Wi-Fi + 5G。セルラー/SIM/LTE 記載があれば反映。',
      '- メモリ容量/プロセッサ/バッテリー時間/接続方式: 記載があれば保持、なければNA。',
      '- [EN]セクションでは: Internet Connectivity は Wi-Fi / Wi-Fi + 4G / Wi-Fi + 5G。OS は iPadOS / iOS / Android / Windows。Type は Tablet として扱う。'
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
      '- ブランド名は必ずタイトル・説明文から正確に読み取る。推測しない。以下は間違えやすいブランドの対応表:',
      '  セルバンギャゾット=Servane Gaxotte, ショーメ=Chaumet, ブシュロン=Boucheron, ヴァンクリーフ=Van Cleef & Arpels, ミキモト=Mikimoto, タサキ=Tasaki, アガット=agete, エテ=ete, ゴローズ=goro\'s, クロムハーツ=Chrome Hearts',
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Bracelets': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Earrings': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Brooches': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Cufflinks': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Charms': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Tie Accessories': {
    label: 'ジュエリー',
    rules: [
      '- 金属/素材: ゴールド/シルバー/プラチナ/ステンレススチール/真鍮/レザー 等で記入。',
      '- 金属純度: K18/K14/K10/K9/Pt900/Pt950/SV925/SV950 等で記入。不明ならNA。',
      '- 金属色: イエローゴールド/ホワイトゴールド/ピンクゴールド/コンビ 等。不明ならNA。',
      '- 主石: ダイヤモンド/ルビー/サファイア/エメラルド/オパール/パール/ガーネット/アメジスト/トルマリン/ジルコニア 等。石なしならNA。',
      '- 脇石: メレダイヤ/ルビー 等。なければNA。',
      '- [EN]セクションでは: Metal は Gold/Silver/Platinum/Stainless Steel/Brass/Base Metal/Leather。Metal Purity は 18k/14k/10k/9k/Pt900/Pt950/925/950。金メッキ・銀メッキの場合は Metal: Base Metal, Metal Purity: Gold Plated/Silver Plated。Main Stone は Diamond/Ruby/Sapphire/Emerald/Opal/Pearl/Garnet/Amethyst/Tourmaline/Cubic Zirconia。'
    ]
  },
  'Handbags': {
    label: 'バッグ・財布',
    rules: [
      '- 外装素材: レザー/キャンバス/ナイロン/PVC/合皮/コーティングキャンバス/スエード/エナメル のいずれかで記入。素材が明記されていない場合はNA。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- スタイル: ハンドバッグ/ショルダーバッグ/トートバッグ/リュック/クラッチバッグ/ボストンバッグ/ボディバッグ/ウエストバッグ/メッセンジャーバッグ/ブリーフケース のいずれかで記入。',
      '- 金具色: ゴールド/シルバー/ガンメタル/ローズゴールド のいずれか。不明ならNA。',
      '- 開閉: ファスナー/マグネット/フラップ/ターンロック/オープントップ のいずれかで記入。不明ならNA。',
      '- サイズ: 縦×横×マチをcm単位で記入（例: 25×35×15cm）。不明ならNA。',
      '- [EN]セクションでは: Exterior Material は Leather/Canvas/Nylon/PVC/Synthetic Leather/Coated Canvas/Suede/Patent Leather。Department は Men/Women/Unisex。Style は Handbag/Shoulder Bag/Tote Bag/Backpack/Clutch Bag/Boston Bag/Sling Bag/Waist Bag/Messenger Bag/Briefcase。Closure は Zipper/Magnetic Snap/Flap/Turn Lock/Open Top。Hardware Color は Gold/Silver/Gunmetal/Rose Gold。'
    ]
  },
  'Wallets': {
    label: 'バッグ・財布',
    rules: [
      '- 外装素材: レザー/キャンバス/ナイロン/PVC/合皮/コーティングキャンバス/エキゾチックレザー/パテントレザー のいずれかで記入。クロコダイル・リザード・パイソン等はエキゾチックレザー。素材が明記されていない場合はNA。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- タイプ: 長財布/二つ折り財布/三つ折り財布/ラウンドファスナー財布/L字ファスナー財布/コンパクト財布/ミニ財布/小銭入れ/札入れ/がま口/カードケース/キーケース/パスケース/チェーンウォレット/マネークリップ のいずれかで記入。',
      '- 金具色: ゴールド/シルバー/ローズゴールド/ガンメタル/ブラック のいずれか。不明ならNA。',
      '- 開閉: ファスナー/スナップボタン/フラップ/マグネット/がま口（口金） のいずれかで記入。不明ならNA。',
      '- [EN]セクションでは: Exterior Material は Leather/Canvas/Nylon/PVC/Synthetic Leather/Coated Canvas/Exotic Leather/Patent Leather。Department は Men/Women/Unisex。Type は Long Wallet/Bifold Wallet/Trifold Wallet/Zip Around Wallet/L-zip Wallet/Compact Wallet/Mini Wallet/Coin Purse/Card Case/Key Case/Pass Case/Chain Wallet/Money Clip/Billfold/Frame Purse。Closure は Zipper/Snap Button/Flap/Magnetic/Clasp。Hardware Color は Gold/Silver/Rose Gold/Gunmetal/Black。'
    ]
  },
  'Clothing': {
    label: '衣類・靴',
    rules: [
      '- 対象: メンズ/レディース/キッズ/ユニセックス のいずれかで記入。',
      '- タイプ: ジャケット/コート/ブレザー/シャツ/Tシャツ/ニット/セーター/パーカー/スウェット/パンツ/ジーンズ/スカート/ドレス/ワンピース/ベスト/カーディガン/スーツ のいずれかで記入。',
      '- 素材: タグ記載の素材を日本語で記入（例: ウール、カシミヤ、シルク、コットン、ポリエステル、ナイロン、リネン、レーヨン、レザー）。混紡の場合は主素材を記入。',
      '- サイズ: タグ記載のサイズ（例: S, M, L, XL, 38, 40, 42）。フリーサイズの場合は「フリー」と記入。',
      '- 採寸: 平置き実寸をcm単位で記入。肩幅/身幅/着丈/袖丈（上衣）、ウエスト/股上/股下/裾幅（下衣）。',
      '- 柄: 無地/チェック/ストライプ/花柄/ドット/迷彩/総柄 のいずれかで記入。不明ならNA。',
      '- [EN]セクションでは: Department は Men/Women/Kids/Unisex。Style は Jacket/Coat/Blazer/Shirt/T-Shirt/Knit/Sweater/Hoodie/Sweatshirt/Pants/Jeans/Skirt/Dress/Vest/Cardigan/Suit。Material は Wool/Cashmere/Silk/Cotton/Polyester/Nylon/Linen/Rayon/Leather。Pattern は Solid/Check/Striped/Floral/Polka Dot/Camouflage/All Over Print。'
    ]
  },
  'Shoes': {
    label: '衣類・靴',
    rules: [
      '- 対象: メンズ/レディース/キッズ/ユニセックス のいずれかで記入。',
      '- タイプ: スニーカー/ブーツ/ローファー/オックスフォード/ダービー/サンダル/パンプス/モンクストラップ/ウィングチップ/チェルシーブーツ/ワークブーツ のいずれかで記入。',
      '- 素材: レザー/スエード/キャンバス/メッシュ/シンセティック/コードバン/ヌバック のいずれかで記入。',
      '- サイズ: cm単位で記入（例: 27.0cm）。タグ記載のサイズをそのまま使用。',
      '- ワイズ: 2E/3E/4E/D/EE等。記載がなければNA。',
      '- ソール: レザーソール/ラバーソール/ビブラム/ダイナイト/クレープソール のいずれか。不明ならNA。',
      '- 製法: グッドイヤーウェルト/ブレイク/マッケイ/セメント のいずれか。不明ならNA。',
      '- [EN]セクションでは: Department は Men/Women/Kids/Unisex。Type は Sneakers/Boots/Loafers/Oxfords/Derby/Sandals/Pumps/Monk Strap/Wingtip/Chelsea Boots/Work Boots。Upper Material は Leather/Suede/Canvas/Mesh/Synthetic/Cordovan/Nubuck。Sole は Leather/Rubber/Vibram/Dainite/Crepe。Construction は Goodyear Welt/Blake/McKay/Cemented。'
    ]
  },
  'Electronics': {
    label: 'オーディオ・家電',
    rules: [
      '- タイプ: アンプ/プリアンプ/パワーアンプ/スピーカー/ヘッドホン/イヤホン/CDプレーヤー/カセットデッキ/ターンテーブル/DAC/ポータブルプレーヤー/ラジオ/チューナー/ミキサー/炊飯器/電子レンジ/掃除機/空気清浄機 のいずれかで記入。',
      '- 接続方式: RCA/XLR/光デジタル/同軸/Bluetooth/USB/3.5mmジャック/6.3mmジャック のいずれか。複数ある場合はカンマ区切り。不明ならNA。',
      '- 電源: AC100V/電池/USB給電/充電式 のいずれかで記入。',
      '- ワイヤレス方式: Bluetooth/Wi-Fi/RF/NFC のいずれか。非ワイヤレスならNA。',
      '- フォームファクター: ヘッドホン→オーバーイヤー/オンイヤー。イヤホン→インイヤー/カナル型/イヤーバッド。アンプ→ラックマウント/デスクトップ/一体型。不明ならNA。',
      '- 製造年: 西暦で記入（例: 2019）。不明ならNA。',
      '- シリーズ: 製品ラインやシリーズ名をそのまま記入。不明ならNA。',
      '- 片耳/両耳: ヘッドホン/イヤホンのみ→片耳/両耳 のいずれか。その他はNA。',
      '- インピーダンス（ヘッドホン・スピーカーの場合）: Ω単位で記入（例: 32Ω, 300Ω, 8Ω）。不明ならNA。',
      '- 出力（アンプの場合）: W単位で記入（例: 100W+100W）。不明ならNA。',
      '- [EN]セクションでは: Type は Integrated Amplifier/Preamplifier/Power Amplifier/Speakers/Headphones/Earphones/CD Player/Cassette Deck/Turntable/DAC/Portable Audio Player/Radio/Tuner/Mixer/Rice Cooker/Microwave/Vacuum Cleaner/Air Purifier。Connectivity は RCA/XLR/Optical/Coaxial/Bluetooth/USB/3.5mm/6.3mm。Power Source は AC 100V/Battery/USB Powered/Rechargeable。Wireless Technology は Bluetooth/Wi-Fi/RF/NFC。Form Factor は Over-Ear/On-Ear/In-Ear/Canal/Earbud/Rack Mount/Desktop/All-in-One。'
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
  'Hair Accessories': {
    label: 'ヘアアクセサリー',
    rules: [
      '- タイプ: ヘアバンド/ヘアピン/ヘアクリップ/シュシュ/バレッタ/かんざし/ヘアゴム/ターバン/コーム/ヘアフォーク のいずれかで記入。',
      '- 素材: プラスチック/金属/布/ベルベット/レザー/ゴム/木/べっ甲調/アクリル 等で記入。',
      '- 髪質: ストレート/ウェーブ/カール/太め/細め/全髪質対応 のいずれかで記入。不明ならNA。',
      '- キャラクターグッズの場合: フランチャイズ名・キャラクター名は正式名称で記入。公式/非公式を明記。',
      '- [EN]セクションでは: Type は Headband/Hair Pin/Hair Clip/Scrunchie/Barrette/Kanzashi(Japanese Hair Ornament)/Hair Tie/Turban/Hair Comb/Hair Fork。Material は Plastic/Metal/Fabric/Velvet/Leather/Rubber/Wood/Tortoiseshell Pattern/Acrylic。Hair Type は Straight/Wavy/Curly/Thick/Fine/All Hair Types。Official/Unofficial は Official/Unofficial(Fan-made)。Franchise/Character は英語公式名称。'
    ]
  },
  'Scarves': {
    label: 'スカーフ・マフラー',
    rules: [
      '- タイプ: スカーフ/ストール/ショール/マフラー/バンダナ/スヌード のいずれかで記入。',
      '- 素材: シルク/カシミヤ/ウール/コットン/ポリエステル/リネン/シルクカシミヤ 等で記入。',
      '- サイズ: ソースにある場合はcm表記で記入（例: 90×90, 70×180）。不明ならNA。',
      '- パターン: 柄名がある場合はそのまま記入。無地なら「無地」。チェック/ストライプ/花柄/幾何学模様 等。',
      '- [EN]セクションでは: Type は Scarf/Stole/Shawl/Muffler/Bandana/Snood。Material は Silk/Cashmere/Wool/Cotton/Polyester/Linen/Silk-Cashmere Blend。Pattern は Solid/Check/Stripe/Floral/Geometric/Paisley/Animal Print。'
    ]
  },
  'Neckties': {
    label: 'ネクタイ',
    rules: [
      '- タイプ: ネクタイ/蝶ネクタイ/アスコットタイ のいずれかで記入。',
      '- 素材: シルク/ウール/コットン/ポリエステル/リネン/混紡 等で記入。',
      '- 幅: ナロー(3-5cm)/レギュラー(7-9cm)/ワイド(10cm以上) のいずれかで記入。不明ならNA。',
      '- パターン: 無地/ストライプ/ドット/チェック/ペイズリー/織柄 等で記入。',
      '- [EN]セクションでは: Type は Necktie/Bow Tie/Ascot。Material は Silk/Wool/Cotton/Polyester/Linen。Pattern は Solid/Striped/Dotted/Checked/Paisley/Jacquard。'
    ]
  },
  'Handkerchiefs': {
    label: 'ハンカチ・チーフ',
    rules: [
      '- タイプ: ハンカチ/ポケットチーフ/タオルハンカチ のいずれかで記入。',
      '- 素材: コットン/リネン/シルク/タオル地 等で記入。',
      '- パターン: 無地/チェック/ストライプ/刺繍/プリント 等で記入。',
      '- [EN]セクションでは: Type は Handkerchief/Pocket Square/Towel Handkerchief。Material は Cotton/Linen/Silk/Terry Cloth。'
    ]
  },
  'Belts': {
    label: 'ベルト',
    rules: [
      '- 素材: レザー/合皮/キャンバス/ナイロン/メッシュ/スエード/エキゾチックレザー 等で記入。',
      '- タイプ: ドレス/カジュアル/ウエスタン/編み込み/メッシュ/リバーシブル/スタッズ のいずれかで記入。',
      '- 対象: メンズ/レディース/ユニセックス のいずれかで記入。',
      '- サイズ: ウエストcmまたはインチで記入。調節可能な場合は「フリー」。',
      '- [EN]セクションでは: Material は Leather/Synthetic Leather/Canvas/Nylon/Mesh/Suede/Exotic Leather。Type は Dress/Casual/Western/Braided/Mesh/Reversible/Studded。Department は Men/Women/Unisex。Size は waist in cm or inches, or Adjustable。'
    ]
  },
  'Belt Buckles': {
    label: 'ベルトバックル',
    rules: [
      '- 素材: 真鍮/シルバー/ステンレス/亜鉛合金/鉄/アルミ 等で記入。',
      '- タイプ: フレーム/プレート/ローラー/Dリング/オートロック/ウエスタン のいずれかで記入。',
      '- 対応ベルト幅: mm単位で記入（例: 35mm、40mm）。不明ならNA。',
      '- [EN]セクションでは: Material は Brass/Silver/Stainless Steel/Zinc Alloy/Iron/Aluminum。Type は Frame/Plate/Roller/D-Ring/Automatic/Western。Fits Belt Width は width in mm。'
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
  'Guitars': {
    label: 'ギター・ベース',
    rules: [
      '- タイプ: エレキギター/アコースティックギター/クラシックギター/エレアコ/エレキベース/ウクレレ/セミアコ/フルアコ のいずれかで記入。',
      '- ボディタイプ: ソリッド/セミホロウ/ホロウ/ドレッドノート/OM/000/ジャンボ のいずれかで記入。不明ならNA。',
      '- ボディカラー: サンバースト/ブラック/ナチュラル/ホワイト/レッド/ブルー 等の色名で記入。不明ならNA。',
      '- 弦構成: 6弦/7弦/8弦/4弦/5弦/12弦 等。不明ならNA。',
      '- 利き手: 右利き/左利き のいずれかで記入。記載がなければNA。',
      '- 年式: 西暦で記入（例: 1982, 1990s）。不明ならNA。',
      '- フレット数: 21/22/24 等の数値で記入。不明ならNA。',
      '- 指板素材: ローズウッド/メイプル/エボニー/ポールフェルナンブコ 等。不明ならNA。',
      '- ブリッジタイプ: フロイドローズ/チューンオーマチック/ハードテイル/ビンテージトレモロ/ラップアラウンド/ウィルキンソン のいずれか。不明ならNA。',
      '- シリーズ: スタンダード/プロフェッショナル/カスタムショップ/リイシュー 等。不明ならNA。',
      '- [EN]セクションでは: Type は Electric Guitar/Acoustic Guitar/Classical Guitar/Acoustic-Electric Guitar/Electric Bass Guitar/Ukulele/Semi-Hollow Electric Guitar/Hollow Body Electric Guitar。Body Type は Solid Body/Semi-Hollow/Hollow Body/Dreadnought/OM/000/Jumbo。Body Color は Sunburst/Black/Natural/White/Red/Blue。Handedness は Right-Handed/Left-Handed。Fretboard Material は Rosewood/Maple/Ebony/Pau Ferro。Bridge Type は Floyd Rose/Tune-o-matic/Hardtail/Vintage Tremolo/Wrap-around/Wilkinson。'
    ]
  },
  'Effects & Amps': {
    label: 'エフェクター・アンプ',
    rules: [
      '- タイプ(ペダル): オーバードライブ/ディストーション/ファズ/ディレイ/リバーブ/コーラス/フランジャー/フェイザー/コンプレッサー/イコライザー/ワウ/ブースター/ルーパー/マルチエフェクター 等。',
      '- タイプ(アンプ): アンプヘッド/コンボアンプ/ギターアンプ/ベースアンプ/チューブアンプ/モデリングアンプ/スピーカーキャビネット 等。',
      '- アナログ/デジタル: ペダル→アナログ/デジタル。アンプ→真空管(Tube)/トランジスタ(Solid State)/モデリング(Modeling)。',
      '- 電源: ペダル→9V/18V/電池/ACアダプター/USB。アンプ→100V AC（日本仕様の場合必ず記載）。',
      '- バイパス方式: ペダル→トゥルーバイパス/バッファードバイパス。アンプ→NA。',
      '- ワット数: アンプのみ→W単位で記入（例: 50W, 100W）。ペダルはNA。不明ならNA。ソースに記載がない場合はNA（推測禁止）。',
      '- 年式: 西暦で記入（例: 1980, 2005）。不明ならNA。',
      '- 製造国: 記載がある場合のみ記入（例: Japan, USA, UK, China）。不明ならNA。',
      '- [EN]セクションでは: Type は Overdrive/Distortion/Fuzz/Delay/Reverb/Chorus/Flanger/Phaser/Compressor/EQ/Wah/Boost/Looper/Multi-FX/Amp Head/Combo Amp/Guitar Amp/Bass Amp/Tube Amp/Modeling Amp/Speaker Cabinet/Preamp。Analog/Digital は Analog/Digital/Tube/Solid State/Modeling。Power Source は 9V Battery/AC Adapter/USB/100V AC。Bypass Type は True Bypass/Buffered Bypass。Wattage は数値+W (e.g., 100W)。'
    ]
  },
  'Synths & Digital': {
    label: 'シンセ・キーボード・DJ機材',
    rules: [
      '- タイプ: シンセサイザー/デジタルピアノ/ワークステーション/キーボード/エレクトーン/アコーディオン/サンプラー/ドラムマシン/グルーヴボックス/DJコントローラー/DJターンテーブル/DJミキサー/CDJ/MPC 等。',
      '- 鍵盤数: 25/37/49/61/76/88 等の数値で記入。鍵盤がない機材（ドラムマシン/ターンテーブル等）はNA。',
      '- アナログ/デジタル: アナログ/デジタル/VA(バーチャルアナログ)/ハイブリッド のいずれかで記入。',
      '- 接続方式: MIDI/USB/CV/Bluetooth/オーディオI/O 等。複数ある場合はカンマ区切り。不明ならNA。',
      '- アクション: ウェイテッド/セミウェイテッド/シンセアクション/グレードハンマー のいずれか。鍵盤のない機材はNA。不明ならNA。',
      '- ポリフォニー: 数値で記入（例: 64, 128）。不明ならNA。',
      '- タッチ感度: あり/なし のいずれかで記入。不明ならNA。',
      '- 年式: 西暦で記入（例: 1993, 2015）。不明ならNA。',
      '- 製造国: 記載がある場合のみ記入（例: Japan, Germany）。不明ならNA。',
      '- [EN]セクションでは: Type は Synthesizer/Digital Piano/Workstation/Keyboard/Electronic Organ/Accordion/Sampler/Drum Machine/Groovebox/DJ Controller/DJ Turntable/DJ Mixer/CDJ/MPC。Analog/Digital は Analog/Digital/VA/Hybrid。Number of Keys は数値。Connectivity は MIDI/USB/CV/Bluetooth/Audio I/O。Action は Weighted/Semi-Weighted/Synth Action/Graded Hammer。Polyphony は数値。Touch Sensitivity は Yes/No。'
    ]
  },
  'Musical Instruments': {
    label: 'ドラム・管楽器・弦楽器・その他',
    rules: [
      '- タイプ: スネアドラム/バスドラム/シンバル/ハイハット/ドラムセット/電子ドラム/アルトサックス/テナーサックス/ソプラノサックス/トランペット/トロンボーン/フルート/クラリネット/オーボエ/フレンチホルン/バイオリン/ビオラ/チェロ/ハーモニカ 等。',
      '- 素材: ドラム→メイプル/バーチ/スチール/ブラス。管楽器→真鍮/銀/ニッケルシルバー。弦楽器→スプルース/メイプル。不明ならNA。',
      '- サイズ: ドラム→インチ表記（14x5.5"等）。シンバル→インチ表記（20"等）。管楽器/弦楽器→NA。不明ならNA。',
      '- 調/ピッチ: 管楽器→Bb/Eb/C/F のいずれかで記入。ドラム/パーカッション/弦楽器→NA。',
      '- 特徴: 仕上げ(ラッカー/銀メッキ/金メッキ/ナチュラル)/ドライブサイズ/接続 等、特記すべき特徴を記入。不明ならNA。',
      '- 年式: 西暦で記入（例: 2010）。不明ならNA。',
      '- 製造国: 記載がある場合のみ記入（例: Japan, USA, Germany）。不明ならNA。',
      '- [EN]セクションでは: Type は Snare Drum/Bass Drum/Cymbal/Hi-Hat/Drum Set/Electronic Drum Kit/Alto Saxophone/Tenor Saxophone/Soprano Saxophone/Trumpet/Trombone/Flute/Clarinet/Oboe/French Horn/Violin/Viola/Cello/Harmonica。Material は Maple/Birch/Steel/Brass/Silver/Nickel Silver/Spruce/Maple。Key/Pitch は Bb/Eb/C/F。Color/Finish は Lacquer/Silver Plated/Gold Plated/Natural。'
    ]
  },
  'Pens': {
    label: '筆記具',
    rules: [
      '- タイプ: 万年筆/ボールペン/ローラーボール/シャープペンシル/マルチペン のいずれかで記入。',
      '- ペン先素材（万年筆の場合）: 金（14K/18K/21K）/ステンレス/スチール のいずれかで記入。不明ならNA。',
      '- ペン先サイズ（万年筆の場合）: EF/F/FM/M/B/BB/Z のいずれかで記入。不明ならNA。',
      '- ボディ素材: レジン/セルロイド/エボナイト/金属/木材/蒔絵/漆 のいずれかで記入。不明ならNA。',
      '- インク補充方式（万年筆の場合）: 吸入式/カートリッジ式/両用式/ピストン式 のいずれかで記入。不明ならNA。',
      '- [EN]セクションでは: Type は Fountain Pen/Ballpoint Pen/Rollerball Pen/Mechanical Pencil/Multi Pen。Nib Material は Gold(14K/18K/21K)/Stainless Steel/Steel。Nib Size は EF/F/FM/M/B/BB/Z。Body Material は Resin/Celluloid/Ebonite/Metal/Wood/Maki-e(Japanese Lacquer)/Urushi(Japanese Lacquer)。Filling System は Piston Filler/Cartridge/Cartridge-Converter/Eyedropper。'
    ]
  },
  'Video Games': {
    label: 'ゲームソフト',
    rules: [
      '- プラットフォーム: 正式名称で記入。例: PlayStation 5, Nintendo Switch, Xbox Series X, Super Famicom, Mega Drive, PC Engine, Sega Saturn, Dreamcast, Game Boy Advance, Nintendo DS, PSP, PS Vita。',
      '- リージョン: NTSC-J(日本)/NTSC-U(北米)/PAL(欧州) のいずれか。日本製品は必ずNTSC-J。リージョンフリーは明記がある場合のみ。',
      '- コンプリートネス: CIB(完品:ゲーム+説明書+箱)/Game Only(ソフトのみ)/No Manual(説明書なし)/No Box(箱なし)/Box Only(空箱)/Manual Only(説明書のみ) のいずれかで記入。',
      '- ジャンル: Action/RPG/Fighting/Simulation/Racing/Puzzle/Platformer/Horror/Sports/Strategy/Adventure/Shooter のいずれかで記入。',
      '- レーティング: CERO A(全年齢)/CERO B(12歳以上)/CERO C(15歳以上)/CERO D(17歳以上)/CERO Z(18歳以上) で記入。不明ならNA。',
      '- [EN]セクションでは: Platform は正式英語名。Region Code は NTSC-J (Japan)。Game Name は公式英語タイトル（日本独自タイトルはローマ字）。Genre は英語。Rating は CERO A/B/C/D/Z。'
    ]
  },
  'Fishing Rods': {
    label: 'ロッド',
    rules: [
      '- ロッドタイプ: スピニング/ベイト/フライ/テレスコピック/ジギング/ショア/オフショア/渓流/へら/磯/投げ のいずれかで記入。',
      '- パワー: UL/L/ML/M/MH/H/XH のいずれかで記入。',
      '- アクション: スロー/ミディアム/ファスト/エクストラファスト のいずれかで記入。',
      '- 長さ: フィート表記で記入（例: 6\'6", 7\', 10\'6"）。不明ならNA。',
      '- ピース数 (継数とも呼ぶ): 1ピース/2ピース/3ピース/マルチピース/テレスコピック のいずれかで記入。テレスコピックロッドの場合は Rod Type も テレスコピック と記入する。不明ならNA。',
      '- 対象魚種: バス/トラウト/シーバス/青物/タイ/アジ/メバル/ヒラメ 等。不明ならNA。',
      '- 素材: カーボン/グラスファイバー/コンポジット のいずれかで記入。不明ならNA。',
      '- 釣りタイプ: フレッシュウォーター/ソルトウォーター/両用 のいずれかで記入。不明ならNA。',
      '- 適合ライン: ソースに記載がある場合、lb または kg 表記で記入（例: 10-20lb, 3-8kg）。不明ならNA。',
      '- [EN]セクションでは: Rod Type は Spinning/Casting/Fly/Telescopic/Jigging/Shore/Offshore/Stream/Hera/Surf。Rod Power は Ultra Light/Light/Medium Light/Medium/Medium Heavy/Heavy/Extra Heavy。Rod Action は Slow/Moderate/Fast/Extra Fast。Pieces は 1-Piece/2-Piece/3-Piece/Multi-Piece/Telescopic。Material は Carbon/Fiberglass/Composite。Fishing Type は Freshwater/Saltwater/All Water。Line Weight は lb または kg 表記。'
    ]
  },
  'Kimono': {
    label: '着物・和装',
    rules: [
      '- タイプ: 振袖/留袖/訪問着/付下げ/小紋/紬/色無地/浴衣/羽織/反物/袴/名古屋帯/袋帯/半幅帯/帯締め/帯揚げ/草履/下駄 等で記入。',
      '- 素材: 正絹/化繊/木綿/麻/ウール/交織 等で記入。',
      '- 季節: 袷（裏地あり・秋冬春）/単衣（裏地なし・6月9月）/夏物（薄物・7月8月）/浴衣（夏） のいずれかで記入。',
      '- 寸法: 身丈/裄/袖丈をcmで記入。帯は長さ×幅をcmで記入。不明ならNA。',
      '- 柄: 花柄/幾何学/更紗/風景/吉祥柄/縞/格子/無地/絞り 等で記入。',
      '- 技法/産地: 京友禅/加賀友禅/大島紬/結城紬/西陣織/博多織/琉球紅型/江戸小紋/有松絞り 等で記入。不明ならNA。',
      '- [EN]セクションでは: Type は Furisode/Tomesode/Houmongi/Tsukesage/Komon/Tsumugi/Iromuji/Yukata/Haori/Tanmono(Bolt)/Hakama/Nagoya Obi/Fukuro Obi/Hanhaba Obi/Obijime/Obiage/Zori/Geta。Material は Silk/Synthetic/Cotton/Linen/Wool/Blended。Season は Awase(Lined)/Hitoe(Unlined)/Natsumono(Summer)/Yukata。Pattern は Floral/Geometric/Sarasa/Scenic/Auspicious/Stripe/Check/Solid/Shibori(Tie-dye)。Technique/Weave は Kyo-Yuzen/Kaga-Yuzen/Oshima Tsumugi/Yuki Tsumugi/Nishijin Ori/Hakata Ori/Ryukyu Bingata/Edo Komon/Arimatsu Shibori。'
    ]
  },
  'Tea Ceremony': {
    label: '茶道具',
    rules: [
      '- 作家名/窯元名: 漢字の作家名・窯元名はヘボン式ローマ字に変換する。[EN]では「Romanized Name (漢字名)」の形式で記入。例: 楽吉左衛門→Raku Kichizaemon、大樋長左衛門→Ohi Chozaemon。',
      '- タイプ: 茶碗/茶入/棗/茶杓/水指/建水/風炉/釜/蓋置/香合/花入/茶筅/柄杓/菓子器/炉縁 等で記入。',
      '- 素材: 陶器/磁器/漆/竹/木/鉄/銀/銅/真鍮 等で記入。',
      '- 産地/窯: 楽焼/萩焼/備前焼/唐津焼/志野/織部/瀬戸/京焼 等で記入。不明ならNA。',
      '- 時代: 室町/桃山/江戸/明治/大正/昭和 等で記入。不明ならNA。',
      '- 箱: 共箱/書付箱/保証箱/紙箱/箱なし のいずれかで記入。',
      '- サイズ: 直径×高さをcmで記入。',
      '- [EN]セクションでは: Type は Tea Bowl(Chawan)/Tea Caddy(Chaire)/Natsume/Tea Scoop(Chashaku)/Fresh Water Jar(Mizusashi)/Waste Water Bowl(Kensui)/Brazier(Furo)/Kettle(Kama)/Lid Rest(Futaoki)/Incense Container(Kogo)/Flower Vase(Hanaire)/Tea Whisk(Chasen)/Ladle(Hishaku)/Sweets Dish(Kashiki)/Hearth Frame(Robuchi)。Material は Ceramic/Porcelain/Lacquer/Bamboo/Wood/Iron/Silver/Copper/Brass。Origin/Kiln は Raku Ware/Hagi Ware/Bizen Ware/Karatsu Ware/Shino Ware/Oribe Ware/Seto Ware/Kyo Ware。Box Type は Original Box(Tomobako)/Inscribed Box(Kakitsuke)/Certificate Box(Hoshobako)/Paper Box/No Box。'
    ]
  },
  'Bonsai': {
    label: '盆栽用品（※生きた木/植物は輸出不可）',
    rules: [
      '- 【重要】生きた盆栽（木/植物）は輸出不可。盆栽鉢・道具・水石・飾台等のみ出品可能。',
      '- タイプ: 盆栽鉢/盆器/水石/飾台/卓/盆栽道具/盆栽ハサミ/針金/用土/水盤 等で記入。',
      '- 鉢の形: 丸/楕円/長方/正方/六角/八角/木瓜/懸崖鉢 等で記入。',
      '- 鉢の釉薬: 無釉/釉薬/焼締/彩色 等で記入。',
      '- サイズ: 外寸 長さ×幅×高さcmで記入。',
      '- 水抜き穴: 穴の数を記入（例: 1穴、2穴、多穴）。',
      '- 作家名/窯元名: ヘボン式ローマ字で記入。不明ならNA。',
      '- [EN]セクションでは: Type は Bonsai Pot/Tray(Bonki)/Suiseki(Viewing Stone)/Display Stand(Kazaridai)/Stand(Shoku)/Bonsai Tools/Bonsai Shears/Wire/Soil/Water Tray(Suiban)。Shape は Round/Oval/Rectangle/Square/Hexagonal/Octagonal/Mokko(Quatrefoil)/Cascade。Glaze/Finish は Unglazed/Glazed/Yakishime(Natural Ash)/Colored。'
    ]
  },
  'Japanese Swords': {
    label: '刀装具（※刀身は海外発送不可）',
    rules: [
      '- 【重要】刀身（刀/脇差/短刀/太刀）は海外発送不可。鍔/拵え/刀装具のみ出品可能。タイプは必ず刀装具の種類を記入すること。',
      '- タイプ: 鍔/拵え/縁頭/目貫/小柄/笄/鐺/鞘/柄/切羽/ハバキ のいずれかで記入。',
      '- 素材: 鉄/赤銅/四分一/真鍮/銀/銅/金 等で記入。',
      '- 技法: 象嵌/彫金/透かし/色絵/魚子地/高彫/平象嵌/布目象嵌 等で記入。不明ならNA。',
      '- 時代: 室町/桃山/江戸初期/江戸中期/江戸後期/明治 等で記入。不明ならNA。',
      '- 流派/作者: 正阿弥/後藤/肥後/奈良/美濃/赤坂 等の流派名、または作者名をヘボン式ローマ字で記入。不明ならNA。',
      '- 図柄: 龍/波/牡丹/武者/鶴/虎/風景/幾何学 等で記入。',
      '- サイズ: 鍔は直径×厚さmm。その他は長さ×幅mmで記入。',
      '- [EN]セクションでは: Type は Tsuba(Sword Guard)/Koshirae(Full Mounting)/Fuchi-Kashira(Hilt Collar & Pommel)/Menuki(Hilt Ornament)/Kozuka(Utility Knife)/Kogai(Skewer)/Kojiri(Scabbard Tip)/Saya(Scabbard)/Tsuka(Handle)/Seppa(Spacer)/Habaki(Blade Collar)。Material は Iron/Shakudo/Shibuichi/Brass/Silver/Copper/Gold。Technique は Inlay(Zogan)/Metal Engraving(Chokin)/Openwork(Sukashi)/Polychrome Inlay(Iroe)/Nanako(Fish Roe Ground)/Takabori(High Relief)/Hira-Zogan(Flat Inlay)/Nunome-Zogan(Cloth Inlay)。Era は Muromachi/Momoyama/Early Edo/Mid Edo/Late Edo/Meiji。School は Shoami/Goto/Higo/Nara/Mino/Akasaka。'
    ]
  },
  'Art': {
    label: '美術品・絵画',
    rules: [
      '- 作家名: 漢字の作家名は必ずヘボン式ローマ字に変換する。例: 横山大観→Yokoyama Taikan、東山魁夷→Higashiyama Kaii、棟方志功→Munakata Shiko、奈良美智→Nara Yoshitomo。国際的に定着した表記がある場合はそちらを優先（例: 藤田嗣治→Foujita Tsuguharu）。[EN]では「Romanized Name (漢字名)」の形式で記入。',
      '- 制作技法: 油彩/水彩/アクリル/パステル/日本画/水墨画/墨絵/テンペラ/ミクストメディア のいずれかで記入。',
      '- サイズ: 高さ×幅をcmで記入。号数が分かる場合は号数も併記（例: F6号 約41×32cm）。',
      '- [EN]セクションでは: Production Technique は Oil Painting/Watercolor/Acrylic/Pastel/Nihonga(Japanese Painting)/Sumi-e(Ink Painting)/Ink Wash Painting/Tempera/Mixed Media。Original/Licensed Reproduction は Original/Reproduction。Style は Nihonga/Western/Abstract/Impressionism/Contemporary等。'
    ]
  },
  'Kakejiku': {
    label: '掛軸',
    rules: [
      '- 作家名: 漢字の作家名は必ずヘボン式ローマ字に変換する。[EN]では「Romanized Name (漢字名)」の形式で記入。落款・印章から作家を特定できない場合は「Unknown」。',
      '- 本紙素材: 絹本/紙本 のいずれかで記入。不明ならNA。',
      '- 表装: 本表装（正式表装）/紙表装/絹表装/機械表装 のいずれかで記入。不明ならNA。',
      '- 軸先素材: 木/象牙調/骨/角/塗り/陶器 のいずれか。不明ならNA。',
      '- 箱: 共箱/合わせ箱/時代箱/箱なし のいずれかで記入。',
      '- サイズ: 全体サイズ（掛軸全長×幅）と本紙サイズ（画の部分）をcmで記入。',
      '- 画題: 山水/花鳥/人物/書/仏画/動物 等で記入。',
      '- [EN]セクションでは: Support は Silk/Paper。Mounting Type は Formal Mount(Hondeso)/Paper Mount/Silk Mount/Machine Mount。Scroll Rod Material は Wood/Faux Ivory/Bone/Horn/Lacquer/Ceramic。Box Type は Original Box(Tomobako)/Custom Box(Awasebako)/Period Box(Jidaibako)/No Box。Subject は Landscape(Sansui)/Flower & Bird(Kacho)/Figure・Portrait/Calligraphy(Sho)/Buddhist/Animal。'
    ]
  },
  'Pottery': {
    label: '陶磁器',
    rules: [
      '- 作家名/窯元名: 漢字の作家名・窯元名は必ずヘボン式ローマ字に変換する。[EN]では「Romanized Name (漢字名)」の形式で記入。例: 濱田庄司→Hamada Shoji、河井寛次郎→Kawai Kanjiro、北大路魯山人→Kitaoji Rosanjin。',
      '- タイプ: 花瓶/壺/香炉/飾皿/鉢/ぐい呑/盃/置物/水差し/徳利 等で記入。',
      '- 素材: 磁器/陶器/炻器 のいずれかで記入。不明ならNA。',
      '- 産地: 有田焼/伊万里/古伊万里/九谷焼/備前焼/萩焼/信楽焼/瀬戸焼/美濃焼/唐津焼/京焼/清水焼/織部/志野/薩摩焼/益子焼/常滑焼/楽焼 等で記入。産地が特定できない場合はNA。',
      '- サイズ: 高さ×幅×奥行をcmで記入。',
      '- [EN]セクションでは: Type は Vase/Jar/Incense Burner/Decorative Plate/Bowl/Sake Cup(Guinomi)/Sake Cup(Sakazuki)/Figurine/Water Jar/Sake Bottle(Tokkuri)。Material は Porcelain/Stoneware/Earthenware。Origin/Kiln は Arita Ware/Imari/Old Imari(Ko-Imari)/Kutani Ware/Bizen Ware/Hagi Ware/Shigaraki Ware/Seto Ware/Mino Ware/Karatsu Ware/Kyo Ware/Kiyomizu Ware/Oribe Ware/Shino Ware/Satsuma Ware/Mashiko Ware/Tokoname Ware/Raku Ware。'
    ]
  },
  'Prints': {
    label: '版画・浮世絵',
    rules: [
      '- 作家名: 漢字の作家名はヘボン式ローマ字に変換する。例: 葛飾北斎→Katsushika Hokusai、歌川広重→Utagawa Hiroshige、喜多川歌麿→Kitagawa Utamaro、東洲斎写楽→Toshusai Sharaku、歌川国芳→Utagawa Kuniyoshi、川瀬巴水→Kawase Hasui、吉田博→Yoshida Hiroshi。[EN]では「Romanized Name (漢字名)」の形式で記入。',
      '- 技法: 木版画/銅版画/石版画/リトグラフ/シルクスクリーン/エッチング/メゾチント/アクアチント 等で記入。',
      '- 様式: 浮世絵/新版画/創作版画/現代版画 等で記入。',
      '- 時代: 江戸/明治/大正/昭和/平成 等で記入。不明ならNA。',
      '- エディション: 限定番号がある場合は記入（例: 150/200）。初摺/後摺の区別も記入。',
      '- サイズ: 縦×横cmで記入。判型がわかる場合は併記（例: 大判 約39×26cm）。',
      '- [EN]セクションでは: Medium は Woodblock Print/Copperplate Print/Lithograph/Screen Print/Etching/Mezzotint/Aquatint。Style は Ukiyo-e/Shin-hanga/Sosaku-hanga/Contemporary Print。Original/Licensed Reproduction は Original/Reproduction/Later Printing。Edition は numbered (e.g., 150/200) or First Printing(Shozuri)/Later Printing(Atozuri)。'
    ]
  },
  'Buddhist Art': {
    label: '仏教美術',
    rules: [
      '- タイプ: 仏像/菩薩像/明王像/仏具/法具/仏画/経典/数珠/木魚/香炉/燭台/花立 等で記入。',
      '- 素材: 木/銅/真鍮/鉄/陶/漆/石/紙/布/金箔 等で記入。',
      '- 尊格（仏像の場合）: 観音/阿弥陀/釈迦/不動明王/地蔵/薬師/大日/弥勒/毘沙門天 等で記入。',
      '- 技法: 木彫/鋳造/乾漆/塑像/金箔押し/彩色/截金 等で記入。不明ならNA。',
      '- 時代: 平安/鎌倉/室町/江戸/明治 等で記入。不明ならNA。',
      '- サイズ: 高さ×幅×奥行をcmで記入。',
      '- [EN]セクションでは: Type は Buddha Statue/Bodhisattva Statue/Wisdom King Statue/Buddhist Altar Tool/Ritual Object/Buddhist Painting/Sutra/Prayer Beads(Juzu)/Wooden Fish(Mokugyo)/Incense Burner/Candle Holder/Flower Vase。Material は Wood/Bronze/Brass/Iron/Ceramic/Lacquer/Stone/Paper/Fabric/Gold Leaf。Subject/Deity は Kannon(Avalokitesvara)/Amida(Amitabha)/Shaka(Shakyamuni)/Fudo Myoo(Acala)/Jizo(Ksitigarbha)/Yakushi(Bhaisajyaguru)/Dainichi(Vairocana)/Miroku(Maitreya)/Bishamonten(Vaisravana)。Technique は Carved Wood/Cast Bronze/Dry Lacquer(Kanshitsu)/Clay Sculpture(Sozo)/Gold Leaf/Polychrome/Cut Gold Leaf(Kirikane)。'
    ]
  },
  'Tetsubin': {
    label: '鉄瓶・銀瓶',
    rules: [
      '- タイプ: 鉄瓶/銀瓶/急須/茶釜 のいずれかで記入。',
      '- 素材: 鋳鉄/銀/銅/砂鉄 等で記入。',
      '- 作家名/工房名: ヘボン式ローマ字で記入。例: 龍文堂→Ryubundo、亀文堂→Kamebundo、大国寿朗→Okuni Juro。不明ならNA。',
      '- 技法/模様: 霰/肌/象嵌/銀象嵌/浮彫/地紋 等で記入。',
      '- 容量: ml単位で記入（例: 1400ml）。不明ならNA。',
      '- 時代: 江戸/明治/大正/昭和 等で記入。不明ならNA。',
      '- サイズ: 高さ×幅cmで記入（蓋・持ち手含む）。',
      '- [EN]セクションでは: Type は Tetsubin(Iron Kettle)/Ginbin(Silver Kettle)/Kyusu(Teapot)/Chagama(Tea Kettle)。Material は Cast Iron/Silver/Copper/Sand Iron(Satetsu)。Technique は Arare(Hail Pattern)/Hada(Texture)/Inlay(Zogan)/Silver Inlay/Relief/Ground Pattern。'
    ]
  },
  'Tennis': {
    label: 'テニス',
    rules: [
      '- タイプ: ラケット/ボール/ストリング/グリップテープ/バッグ のいずれかで記入。',
      '- ヘッドサイズ: 平方インチ（sq in）で記入（例: 100sq in）。',
      '- グリップサイズ: G1/G2/G3/G4 または 4 1/8/4 1/4/4 3/8/4 1/2 で記入。',
      '- 重量: グラム(g)で記入（例: 300g）。',
      '- [EN]セクションでは: Type は Racquet/Ball/String/Grip Tape/Bag。Head Size は sq in。Grip Size は G1-G4 or 4 1/8-4 1/2。'
    ]
  },
  'Baseball': {
    label: '野球',
    rules: [
      '- タイプ: グローブ/バット/ボール/ヘルメット/プロテクター/バッグ のいずれかで記入。',
      '- 利き手（グローブ）: 右投げ用/左投げ用 のいずれかで記入。',
      '- ポジション（グローブ）: 投手用/内野手用/外野手用/捕手用/一塁手用 のいずれかで記入。',
      '- 素材: 本革/合皮/木/金属/カーボン 等で記入。',
      '- [EN]セクションでは: Type は Glove/Bat/Ball/Helmet/Protector/Bag。Handedness は Right-Hand Throw/Left-Hand Throw。Player Position は Pitcher/Infield/Outfield/Catcher/First Base。Material は Leather/Synthetic/Wood/Metal/Carbon。'
    ]
  },
  'Japanese Instruments': {
    label: '和楽器',
    rules: [
      '- 楽器名は必ず日本語名とローマ字名を併記する。三味線→Shamisen、尺八→Shakuhachi、琴/箏→Koto、篠笛→Shinobue、太鼓/和太鼓→Taiko、琵琶→Biwa、鼓→Tsuzumi、三線→Sanshin、笙→Sho、篳篥→Hichiriki、龍笛→Ryuteki。',
      '- サブタイプ（三味線）: 細棹/中棹/太棹/津軽三味線 のいずれかで記入。',
      '- サブタイプ（尺八）: 都山流/琴古流/明暗流 等で記入。',
      '- サブタイプ（琴）: 箏/十七絃/大正琴 等で記入。',
      '- 素材: 竹/木/桑/紫檀/花梨/絹/蛇皮/猫皮/犬皮 等で記入。',
      '- サイズ: 尺八は尺寸（例: 1尺8寸）とcm併記。三味線は棹の長さcm。琴は弦数。',
      '- [EN]セクションでは: Type は Shamisen/Shakuhachi/Koto/Shinobue/Taiko/Biwa/Tsuzumi/Sanshin/Sho/Hichiriki/Ryuteki。Subtype(Shamisen) は Hosozao(Thin Neck)/Chuzao(Medium Neck)/Futozao(Thick Neck)/Tsugaru Shamisen。Material は Bamboo/Wood/Mulberry(Kuwa)/Rosewood(Shitan)/Quince(Karin)/Silk/Snakeskin/Catskin/Dogskin。'
    ]
  },
    'Records': {
    label: 'レコード',
    rules: [
      '- フォーマット: LP/EP/シングル/CD/カセット のいずれかで記入。',
      '- レコードサイズ: 12インチ/10インチ/7インチ のいずれかで記入。',
      '- レコード評価: Mint/Near Mint/VG+/VG/G+/G/Fair/Poor のいずれかで記入（Goldmine基準）。',
      '- [EN]セクションでは: Format は LP/EP/Single。Record Size は 12"/10"/7"。Record Grading/Sleeve Grading は Mint (M)/Near Mint (NM)/Very Good Plus (VG+)/Very Good (VG)/Good Plus (G+)/Good (G)/Fair (F)/Poor (P)。'
    ]
  },
  'Stamps': {
    label: '切手',
    rules: [
      '- タイプ: 記念切手/普通切手/航空切手/特殊切手 等で記入。',
      '- 品質: 未使用/使用済み/未使用美品（MNH） のいずれかで記入。',
      '- 鑑定: PSE/BPA 等で記入。鑑定なしならNA。',
      '- [EN]セクションでは: Type は Commemorative/Definitive/Airmail/Special。Quality は Mint Never Hinged(MNH)/Mint Hinged(MH)/Used/Cancelled to Order(CTO)。Certification は PSE/BPA/Uncertified。'
    ]
  },
  'Coins': {
    label: 'コイン・古銭',
    rules: [
      '- タイプ: 硬貨/記念硬貨/古銭/紙幣/メダル のいずれかで記入。',
      '- 素材: 金/銀/銅/ニッケル/真鍮/アルミ 等で記入。',
      '- 鑑定: NGC/PCGS/ANACS 等で記入。鑑定なしならNA。',
      '- [EN]セクションでは: Type は Coin/Commemorative Coin/Antique Coin/Banknote/Medal。Composition は Gold/Silver/Copper/Nickel/Brass/Aluminum。Certification は NGC/PCGS/ANACS/Uncertified。'
    ]
  },
  'Collectibles': {
    label: 'コレクティブル・アンティーク・ヴィンテージ',
    rules: [
      '- タイプ: 具体的な物の名前で記入（ブリキ玩具/ソフビ/ピンバッジ/看板/メダル/切符/ポスター/置物/販促品/チラシ/伝統玩具/けん玉/独楽等）。',
      '- ブランド: 山形工房(Yamagata Kobo)/SWEETS/KROM/TK16/大西工芸(Onishi Kogei)等。ソースに記載があれば必ず保持。不明ならNA。',
      '- モデル名: 大空(Ozora)/大空 STREET(Ozora STREET)/REShape5/SLAYDAWG等。ソースに記載があれば必ず保持。不明ならNA。',
      '- 認定: 日本けん玉協会認定(JKA Certified)/日本けん玉協会推奨品(JKA Recommended)。ソースに記載があれば保持。伝統玩具以外はNA。',
      '- 付属品: 替え糸(spare string)/取扱説明書(manual)/ケース(case)等。ソースに記載があれば保持。なければNA。',
      '- サイズ: 全長/高さ/幅のcm表記。ソースに記載があれば保持。なければNA。',
      '- 年代: 昭和/大正/明治/戦前/戦後/1950年代 等。「当時物」「ヴィンテージ」があれば推定年代も記入。不明ならNA。',
      '- 年代EN対応: 明治→Meiji(1868-1912)、大正→Taisho(1912-1926)、昭和→Showa(1926-1989)、平成→Heisei(1989-2019)。西暦→1950s/1960s/1970s。',
      '- キャラクター: ペコちゃん/鉄腕アトム/ゴジラ等があればそのまま記入。キャラクター商品でなければNA。',
      '- フランチャイズ: 作品名・シリーズ名があれば記入。なければNA。',
      '- テーマ: 鉄道/軍事/企業広告/観光/祭り/スポーツ 等、商品の文脈を記入。',
      '- 素材: ブリキ/金属/ホーロー/紙/木/ガラス/プラスチック/ソフトビニール/布 等。',
      '- [EN]セクションでは: Type→Tin Toy/Sofubi/Pin Badge/Sign/Medal/Ticket/Poster/Figurine/Promotional Item/Traditional Toy/Kendama/Spinning Top。Brand→英語名(Yamagata Kobo/Onishi Kogei/SWEETS/KROM等)。Model→英語名(Ozora/Ozora STREET/REShape5等)。Certification→JKA Certified/JKA Recommended。Accessories→spare string/manual/case等。Size→total length Xcm。Era→Meiji/Taisho/Showa/Pre-war/Post-war/1950s。Character→英語公式名(Peko-chan/Astro Boy/Godzilla)。Theme→Railway/Military/Advertising/Tourism/Sports。Material→Tin/Metal/Enamel/Paper/Wood/Glass/Plastic/Soft Vinyl/Fabric。'
    ]
  },
  'Dolls & Plush': {
    label: 'ドール・ぬいぐるみ',
    rules: [
      '- タイプ: ぬいぐるみ → Plush/Stuffed Animal、テディベア → Teddy Bear、ドール → Doll、BJD/球体関節 → Ball Jointed Doll (BJD)、ブライス → Blythe、リカちゃん → Licca。',
      '- キャラクター: 正式名称で記入。キャラクター物でなければNA。',
      '- 素材: モヘア → Mohair、ぬいぐるみ生地 → Plush、ビニール → Vinyl、ABS → ABS。',
      '- サイズ: 高さcm表記。ドールはスケール（1/3, 1/6等）があれば記入。',
      '- [EN]セクションでは: Type は Plush/Stuffed Animal/Teddy Bear/Doll/BJD/Fashion Doll/Art Toy。Material は Mohair/Plush/Vinyl/ABS/Porcelain。Character は英語公式名。'
    ]
  },
  'Manga': {
    label: '漫画・コミック',
    rules: [
      '- 作品名: 正式タイトルで記入。[EN]では英語公式タイトルで記入（例: 鬼滅の刃→Demon Slayer、進撃の巨人→Attack on Titan、ワンピース→One Piece）。英語タイトルがない場合はローマ字。',
      '- 作者名: 漢字名をヘボン式ローマ字に変換。[EN]では「Romanized Name (漢字名)」形式。例: 尾田栄一郎→Oda Eiichiro、鳥山明→Toriyama Akira、手塚治虫→Tezuka Osamu。',
      '- 出版社: 集英社/講談社/小学館/角川/スクウェア・エニックス/白泉社/秋田書店 等で記入。',
      '- フォーマット: 単行本/文庫本/ワイド版/新装版/愛蔵版/完全版 のいずれかで記入。同人誌の場合は「同人誌」。',
      '- ジャンル: 少年/少女/青年/女性/BL/百合 等で記入。',
      '- エディション: 初版/帯付き/限定版/特装版/通常版 等で記入。該当なしならNA。',
      '- [EN]セクションでは: Publisher は Shueisha/Kodansha/Shogakukan/Kadokawa/Square Enix/Hakusensha/Akita Shoten。Format は Tankobon/Bunkoban/Wide Edition/New Edition(Shinsoban)/Deluxe Edition(Aizoban)/Complete Edition/Doujinshi。Genre は Shonen/Shojo/Seinen/Josei/BL(Boys Love)/Yuri。Edition は First Edition/With Obi Band/Limited Edition/Special Edition/Regular Edition。'
    ]
  },
  'Anime': {
    label: 'アニメグッズ',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- タイプ: アクスタ/缶バッジ/タペストリー/クリアファイル/色紙/ラバーストラップ/ポスター/ブロマイド/キーホルダー/セル画/原画 等で記入。',
      '- 公式/非公式: 公式グッズか非公式（ファンメイド）かを記入。',
      '- セル画・原画の場合: スタジオ名、作品名、話数/シーンがわかれば記入。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称。Type は Acrylic Stand/Pin Badge(Can Badge)/Tapestry/Clear File/Shikishi(Art Board)/Rubber Strap/Poster/Bromide(Photo Card)/Keychain/Animation Cel/Key Animation Drawing(Genga)。Official/Unofficial は Official/Unofficial(Fan-made)。'
    ]
  },
  'Figures': {
    label: 'フィギュア',
    rules: [
      '- キャラクター: 正式名称で記入。',
      '- フランチャイズ: シリーズ名で記入（例: ドラゴンボール、ワンピース、ガンダム）。',
      '- タイプ: アクションフィギュア/スタチュー/ねんどろいど/figma/プライズフィギュア/一番くじ/ガレージキット/トレーディングフィギュア 等で記入。',
      '- シリーズ/ライン: Figma/Nendoroid/Pop Up Parade/S.H.Figuarts/Ichiban Kuji/Portrait.Of.Pirates/GEM Series 等で記入。不明ならNA。',
      '- スケール: 1/6/1/7/1/8/1/4 等で記入。ノンスケールの場合は「ノンスケール」。',
      '- 正規品/海賊版: 正規品/海賊版 のいずれかで記入。',
      '- [EN]セクションでは: Character / Franchise は英語の公式名称。Type は Action Figure/Statue/Nendoroid/Figma/Prize Figure/Ichiban Kuji/Garage Kit/Trading Figure。Series/Line は Figma/Nendoroid/Pop Up Parade/S.H.Figuarts/Ichiban Kuji/Portrait.Of.Pirates/GEM Series。Scale は 1/6/1/7/1/8/Non-scale。Official/Bootleg は Official/Bootleg(Counterfeit)。'
    ]
  },
  'Mecha Model Kits': {
    label: 'メカプラモデル（ガンプラ等）',
    rules: [
      '- シリーズ/フランチャイズ: ガンダム/エヴァンゲリオン/マクロス/ゾイド/フレームアームズ/アーマード・コア/パトレイバー/ボトムズ 等で記入。',
      '- グレード: HG/HGUC/MG/RG/PG/SD/BB戦士/RE:100/フルメカニクス/EG/ノーグレード のいずれかで記入。グレードがない製品（コトブキヤ等）はNA。',
      '- スケール: 1/144/1/100/1/60/1/48/1/72/ノンスケール のいずれかで記入。',
      '- 組立状態: 未組立/組立済み/部分組立 のいずれかで記入。',
      '- タイプ: プラモデル/レジンキット のいずれかで記入。',
      '- 限定品: プレバン（プレミアムバンダイ限定）/イベント限定/一般販売 で記入。',
      '- [EN]セクションでは: Series は Gundam/Evangelion/Macross/Zoids/Frame Arms/Armored Core/Patlabor/Votoms。Grade は HG/HGUC/MG/RG/PG/SD/BB Senshi/RE:100/Full Mechanics/EG/No Grade。Scale は 1/144/1/100/1/60/1/48/1/72/Non-scale。Built Status は Unbuilt(Sealed)/Built/Partially Built。Type は Plastic Model Kit/Resin Kit。Grade がない場合は NA。'
    ]
  },
  'RC & Models': {
    label: 'RC・スケールモデル',
    rules: [
      '- タイプ: RCカー/RC飛行機/RC戦車/スケールモデル/ミニ四駆/鉄道模型 のいずれかで記入。',
      '- 車種/機種: 具体的な車種や機種名で記入（例: ランチア デルタ、零戦、タイガー戦車）。',
      '- スケール: 1/10/1/12/1/16/1/24/1/35/1/48/1/72/1/144 等で記入。',
      '- 動力源（RC用）: 電動/エンジン/ガソリン のいずれかで記入。スケールモデルはNA。',
      '- 組立状態: 未組立/組立済み/完成品 のいずれかで記入。',
      '- [EN]セクションでは: Type は RC Car/RC Aircraft/RC Tank/Static Model Kit/Mini 4WD/Model Train。Vehicle Type は Car/Tank/Aircraft/Ship/Train/Motorcycle。Power Type は Electric/Nitro/Gas。Built Status は Unbuilt/Built/Ready to Run(RTR)。'
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
  },
  'Glassware': {
    label: 'ガラス・クリスタル',
    rules: [
      '- 素材: クリスタル/ガラス/鉛クリスタル/ソーダガラス のいずれかで記入。',
      '- 技法: 切子(カット)/吹きガラス(ブロウン)/プレス/エナメル/彫刻 等で記入。不明ならNA。',
      '- タイプ: 花瓶/グラス/デキャンタ/ボウル/オブジェ/ペーパーウェイト/香水瓶 のいずれかで記入。',
      '- 産地: 江戸切子/薩摩切子/津軽びいどろ/ムラーノ/ボヘミア/リモージュ 等、産地名がある場合は記入。',
      '- [EN]セクションでは: Material は Crystal/Glass/Lead Crystal/Soda-Lime Glass。Production Technique は Cut/Blown/Pressed/Enameled/Engraved。Type は Vase/Glass/Decanter/Bowl/Figurine/Paperweight/Perfume Bottle。'
    ]
  },
  'Dinnerware': {
    label: '食器',
    rules: [
      '- 素材: 磁器(ポーセリン)/ボーンチャイナ/陶器(セラミック)/ストーンウェア/クリスタル/ガラス のいずれかで記入。',
      '- タイプ: プレート/ボウル/カップ&ソーサー/マグ/ティーポット/花瓶/グラス のいずれかで記入。',
      '- パターン: 柄名がある場合はそのまま記入（例: ブルーフルーテッド）。無地なら「無地」。',
      '- セット内容: セットの場合、枚数・点数を記入。単品ならNA。',
      '- 窯元・産地: 有田焼/九谷焼/波佐見焼/美濃焼/瀬戸焼/リモージュ 等、産地名がある場合は記入。',
      '- [EN]セクションでは: Material は Porcelain/Bone China/Ceramic/Stoneware/Crystal/Glass。Type は Plate/Bowl/Cup & Saucer/Mug/Teapot/Vase/Glass。'
    ]
  },
  'Fishing Lures': {
    label: 'ルアー・釣具',
    rules: [
      '- タイプ: ミノー/クランクベイト/バイブレーション/ポッパー/ペンシルベイト/スピナーベイト/チャターベイト/メタルジグ/スプーン/エギ/ワーム/フロッグ/ジグヘッド/フック のいずれかで記入。',
      '- 浮力: フローティング(F)/シンキング(S)/サスペンド(SP) のいずれかで記入。ソフトベイト・メタルジグ・フック等は記入不要。',
      '- 重さ: ソースにある場合そのまま記入（g表記）。oz表記がある場合は併記。ない場合はNA。',
      '- 長さ: ソースにある場合mm表記で記入。ない場合はNA。',
      '- 色: ソースのカラー名をそのまま記入。',
      '- 対象魚種: バス/トラウト/シーバス/青物/イカ 等。不明ならNA。',
      '- [EN]セクションでは: Type は Minnow/Crankbait/Lipless Crankbait/Popper/Pencil Bait/Spinnerbait/Chatterbait/Metal Jig/Spoon/Squid Jig/Soft Plastic/Frog/Jig Head/Hook。Buoyancy は Floating/Sinking/Suspending。'
    ]
  },
  'Snow Globes': {
    label: 'スノードーム',
    rules: [
      '- タイプ: オルゴール付き/音楽/メロディ/回転 → Musical Snow Globe。ライト/LED → Lighted Snow Globe。それ以外は Snow Globe。',
      '- 素材: ガラス/クリスタル → Glass、樹脂/レジン → Resin、プラスチック/アクリル → Plastic、陶器/磁器 → Ceramic。不明ならNA。',
      '- テーマ: ディズニー/サンリオ/ジブリ等キャラクター名、クリスマス/サンタ/雪だるま等季節、都市名/ランドマーク名があればそのまま記入。',
      '- 用途: クリスマス/誕生日/結婚/バレンタイン/正月 等があれば記入。不明ならNA。',
      '- [EN]セクションでは: Type は Snow Globe/Musical Snow Globe/Lighted Snow Globe。Material は Glass/Resin/Plastic/Ceramic/Crystal。Subject はキャラクター名・テーマをそのまま英語で。'
    ]
  },
  'Boxes': {
    label: 'ジュエリーボックス・時計ケース',
    rules: [
      '- タイプ: 時計用/ウォッチ → Watch Box、ジュエリー/宝石/アクセサリー → Jewelry Box、ガラス蓋/展示/ディスプレイ → Display Case、ブランド箱/化粧箱 → Presentation Box。',
      '- 素材: 木/桐/ウォールナット → Wood、革/レザー → Leather、合皮 → Faux Leather、漆/漆器 → Lacquer、金属 → Metal、ガラス → Glass。複合素材は主素材で記入。',
      '- 内張り: ベルベット/ビロード → Velvet、スエード → Suede、シルク/絹 → Silk、サテン → Satin。不明ならNA。',
      '- [EN]セクションでは: Type は Jewelry Box/Watch Box/Display Case/Presentation Box/Travel Case/Ring Box。Material は Wood/Leather/Faux Leather/Lacquer/Metal/Glass。Lining Material は Velvet/Suede/Silk/Satin。Suitable For は Watches/Rings/Necklaces/Earrings/Bracelets。'
    ]
  },
  'Flatware': {
    label: 'カトラリー・銀食器',
    rules: [
      '- タイプ: スプーン/フォーク/ナイフ/サービングスプーン/バターナイフ 等。セット（2本以上）の場合は「Set」と記入。',
      '- 素材: 純銀/925/STERLING → Sterling Silver、銀メッキ/EPNS/シルバープレート → Silverplate、ステンレス/18-8/18-10 → Stainless Steel。不明ならNA。',
      '- パターン: メーカーの柄名があればそのまま記入（例: Marly, Perles）。無地なら「Plain」。',
      '- [EN]セクションでは: Type は Spoon/Fork/Knife/Serving Spoon/Butter Knife/Set。Composition は Sterling Silver/Silverplate/Stainless Steel。'
    ]
  },
  'Baby': {
    label: 'ベビー用品',
    rules: [
      '- タイプ: ラトル/ガラガラ → Rattle、スプーン → Baby Spoon、シューズ/靴 → Baby Shoes、食器 → Baby Tableware、おもちゃ → Baby Toy。',
      '- 素材: 銀/シルバー/925 → Sterling Silver、木 → Wood、布/綿 → Cotton/Fabric、プラスチック → Plastic。',
      '- [EN]セクションでは: Type は Rattle/Baby Spoon/Baby Shoes/Baby Tableware/Baby Toy。Material は Sterling Silver/Wood/Cotton/Fabric/Plastic。'
    ]
  },
  'Combs': {
    label: '櫛・コーム',
    rules: [
      '- タイプ: 櫛/くし → Comb、コーム/ヘアコーム → Hair Comb、かんざし型 → Decorative Comb。',
      '- 素材: つげ/黄楊/木 → Wood (Boxwood)、べっ甲/鼈甲 → Tortoiseshell、角/水牛 → Horn、プラスチック/アクリル → Plastic、金属 → Metal。',
      '- [EN]セクションでは: Type は Comb/Hair Comb/Decorative Comb/Pick。Material は Wood/Boxwood/Tortoiseshell/Horn/Plastic/Metal/Celluloid。'
    ]
  },
  'Soap': {
    label: '石鹸',
    rules: [
      '- タイプ: 固形石鹸 → Bar Soap。液体は対象外。',
      '- 香り: ローズ/ラベンダー/柑橘/蜂蜜/無香料 等。不明ならNA。',
      '- [EN]セクションでは: Type は Bar Soap。Scent は Rose/Lavender/Citrus/Honey/Unscented等。'
    ]
  },
  'Watch Parts': {
    label: '時計パーツ',
    rules: [
      '- パーツ種類: ブレスレット/バンド/ベルト/コマ/バックル/クラスプ/ムーブメント/風防/リューズ/裏蓋/ダイアル/ベゼル/針/バネ棒 等、具体的に記入。',
      '- 対応モデル: パーツが対応するモデル名を記入（サブマリーナ/スピードマスター等）。不明ならNA。',
      '- サイズ: mm単位で記入（ラグ幅/ベルト幅/コマ幅/風防径等）。',
      '- [EN]セクションでは: Part Type は Link/Bracelet/Band/Strap/Buckle/Clasp/Movement/Crystal/Crown/Case Back/Dial/Bezel/Hand/Spring Bar/Rotor/Stem。Material は Stainless Steel/Gold/Titanium/Leather/Rubber/Ceramic/Sapphire。'
    ]
  },
  'Pipes': {
    label: 'パイプ・喫煙具',
    rules: [
      '- 形状: ビリヤード/ベント/アップル/ブルドッグ/ダブリン/チャーチウォーデン/フリーハンド 等。煙管の場合は「煙管」と記入。',
      '- 素材: ブライヤー → Briar、海泡石/メシャム → Meerschaum、コーンコブ → Corncob、木 → Wood、竹 → Bamboo、金属 → Metal。煙管は真鍮/銀/竹の組み合わせ。',
      '- フィルター: 9mm/6mm/フィルターなし。不明ならNA。',
      '- [EN]セクションでは: Body Shape は Billiard/Bent/Apple/Bulldog/Dublin/Churchwarden/Freehand/Kiseru。Material は Briar/Meerschaum/Corncob/Wood/Bamboo/Metal/Brass/Silver。'
    ]
  },
  'Key Chains': {
    label: 'キーリング・キーホルダー',
    rules: [
      '- 素材: 革/レザー → Leather、金属/メタル → Metal、ラバー/ゴム → Rubber、布/キャンバス → Fabric。',
      '- キャラクター: ディズニー/サンリオ/ジブリ等のキャラクター名があればそのまま記入。',
      '- [EN]セクションでは: Material は Leather/Metal/Rubber/Fabric/PVC/Enamel。Character Family はキャラクターファミリー名を英語で。'
    ]
  },
  'Japanese Dolls': {
    label: '日本人形',
    rules: [
      '- タイプ: こけし/日本人形/博多人形/市松人形/雛人形/五月人形/木目込み人形/御所人形/伏見人形/からくり人形/土人形/文楽人形/だるま/招き猫 のいずれかで記入。',
      '- 素材: 木製/陶器/紙/布/土/漆/石膏/桐 のいずれかで記入。複合素材の場合は主素材を記入。',
      '- 作家名: 作家名・工房名をそのまま記入。不明ならNA。',
      '- 産地: 鳴子/津軽/遠刈田/弥治郎/作並/蔵王/土湯/博多/京都/堺/岩槻/鴻巣 等で記入。不明ならNA。',
      '- 年代: 昭和/大正/明治/江戸/平成/令和 または具体的な年代（例: 1960年代）で記入。不明ならNA。推測禁止。',
      '- サイズ: 高さをcm単位で記入（例: 25cm）。不明ならNA。',
      '- 技法: 手彫り/ろくろ挽き/張子/木目込み/型抜き/手描き/焼成 のいずれかで記入。不明ならNA。',
      '- モチーフ: 武者/童女/舞妓/力士/歌舞伎/花嫁/童子/母子/動物 等で記入。該当なしならNA。',
      '- オリジナル/復刻: オリジナル/復刻品 のいずれかで記入。不明ならNA。',
      '- [EN]セクションでは: Type は Kokeshi/Hakata Doll/Ichimatsu Doll/Hina Doll/Gogatsu Doll/Kimekomi Doll/Gosho Doll/Fushimi Doll/Karakuri Doll/Tsuchi Doll/Bunraku Puppet/Daruma Figurine/Maneki-neko Figurine。だるま/達磨 → Daruma Figurine。招き猫/まねきねこ/招福猫 → Maneki-neko Figurine。Material は Wood/Ceramic/Paper/Fabric/Clay/Lacquer/Plaster/Paulownia。Technique は Hand Carved/Lathe Turned/Papier-mache/Kimekomi/Molded/Hand Painted/Fired。Origin は Naruko/Tsugaru/Togatta/Yajiro/Sakunami/Zao/Tsuchiyu/Hakata/Kyoto/Sakai/Iwatsuki/Konosu。Era は Showa/Taisho/Meiji/Edo/Heisei/Reiwa。'
    ]
  },
  'Kitchen Knives': {
    label: '包丁・刃物',
    rules: [
      '- タイプ: 牛刀/出刃/三徳/柳刃/菜切り/小出刃/薄刃/骨スキ/ペティ/パン切り/中華包丁/パーリングナイフ のいずれかで記入。不明な場合はそのまま記入。',
      '- 刃素材: 鋼/ステンレス/ダマスカス/高炭素鋼 など。詳細鋼材名(VG-10/青紙/白紙/SKD/HAP40等)がわかれば記入。',
      '- 刃のタイプ: 片刃/両刃 のいずれかで記入。不明ならNA。',
      '- 刀匠/メーカー: 鍛冶職人名または製造メーカー名をそのまま記入。例: 藤次郎/有次/正本/杉本/グローバル/堺一文字光秀。不明ならNA。',
      '- コンディション: 新品/使用品/未使用品 のいずれかで記入。使用品の場合は刃の状態(研ぎ直し済み/小傷あり等)を故障・不具合に記入。',
      '- [EN]セクションでは: Type は Gyuto/Deba/Santoku/Yanagiba/Nakiri/Ko-Deba/Usuba/Honesuki/Petty/Bread Knife/Cleaver/Paring Knife。Blade Material は Steel/Stainless Steel/Damascus/High Carbon Steel/VG-10/Aogami/Shirogami。Edge Type は Single-Bevel/Double-Bevel。Handedness は Right-Handed/Left-Handed。'
    ]
  },
  'Books & Magazines': {
    label: '書籍・雑誌・写真集',
    rules: [
      '- 著者/アーティスト: 著者名/撮影者名/編著者名をそのまま記入。漢字名の場合はヘボン式ローマ字で記入（[EN]セクション）。',
      '- フォーマット: 雑誌→Magazine、文庫/単行本（ソフトカバー）→Paperback、ハードカバー→Hardcover、ムック→Mook、画集/イラスト集→Art Book、写真集→Photo Book、絵本→Picture Book、図録/展覧会カタログ→Exhibition Catalog。',
      '- 題材: 写真集の被写体（アイドル名/風景/動物等）、画集のジャンル（ファンタジー/SF等）、書籍のテーマを記入。ジャンルではなく題材（内容）を書く。',
      '- 号数: 雑誌のみ記入。Vol.42 / No.10 / 2020年5月号 等の形式。書籍の場合はNA。',
      '- ISBN: 裏表紙またはISBNシールに記載の番号をそのまま記入（ISBN-10 または ISBN-13）。不明ならNA。',
      '- [EN]セクションでは: Author/Artist は英語または Romanized Name (漢字名) の形式。Publisher は英語社名（例: Shueisha/Kodansha/Shogakukan/Kadokawa）。Format は Magazine/Paperback/Hardcover/Mook/Art Book/Photo Book/Picture Book/Exhibition Catalog。Subject は英語で被写体・テーマを記入。Issue Number は Vol.XX / No.XX / Month Year の形式。'
    ]
  },

  // --- Board Games 追加 ---
  'Board Games': {
    label: 'ボードゲーム・卓上ゲーム',
    rules: [
      '- ゲームタイトル: 商品名をそのまま記入。将棋/囲碁/麻雀/モノポリー/カタン 等。',
      '- ゲームタイプ: 将棋/囲碁/麻雀/チェス/バックギャモン/オセロ/ボードゲーム/カードゲーム/パズル のいずれかで記入。',
      '- メーカー: 任天堂/ホビージャパン/アークライト/Hasbro/Mattel/Ravensburger/Z-Man Games 等。不明ならNA。',
      '- 言語: 日本語/英語/多言語（言語非依存） のいずれかで記入。',
      '- 素材: 木製/プラスチック/紙/布 のいずれかで記入。将棋盤・囲碁盤は特に重要（桂/榧/新桂等）。',
      '- 年代: 製造年を記入（例: 1990年代、2005年）。不明ならNA。',
      '- ヴィンテージ: 製造から20年超または骨董的価値がある場合 Yes。それ以外 No。eBayカテゴリID分岐（新品→180349、ヴィンテージ→19100）に使用。',
      '- コンポーネント構成: 駒/碁石/麻雀牌/カード/ダイス/ボード等の構成品を記入。欠品がある場合は「○○欠品」と明示。',
      '- [EN]セクションでは: Game Type は Board Game/Traditional Game/Strategy Game/Shogi/Go/Mahjong/Chess/Backgammon/Othello。',
      '- [EN]翻訳辞書: 将棋→Shogi, 将棋駒→Shogi Pieces, 将棋盤→Shogi Board, 麻雀→Mahjong, 麻雀牌→Mahjong Tiles, 麻雀セット→Mahjong Set, 囲碁→Go, 碁石→Go Stones, 碁盤→Go Board, ボードゲーム→Board Game, 卓上ゲーム→Tabletop Game, チェス→Chess, バックギャモン→Backgammon, オセロ→Othello, リバーシ→Reversi。',
      '- [EN]素材: 木製→Wood, プラスチック→Plastic, 紙→Paper, 布→Fabric, 桂→Katsura Wood, 榧→Kaya Wood。',
      '- [EN]Language: Japanese/English/Multilingual。Material は Wood/Plastic/Paper/Fabric。Vintage は Yes/No。'
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
  'Base Metal': 'ベースメタル', 'Pendant/Locket Type': 'ペンダント・ロケットタイプ',
  'Length': 'チェーン長',
  'Ring Size': 'リングサイズ', 'Setting': 'セッティング', 'Band Width': 'バンド幅', 'Sizable': 'サイズ調整可',
  'Charm Type': 'チャームタイプ', 'Number of Gemstones': '宝石の数',
  'Diamond Color Grade': 'ダイヤカラーグレード', 'Total Carat Weight': '総カラット重量', 'Cut Grade': 'カットグレード',
  'Main Stone Creation': '主石の生成方法',
  // ジュエリー用 '留め金' (既存の Closure → 開閉 はバッグ/ウォレット向けのまま維持)
  '留め金': 'Closure',
  // ファッション
  'Exterior Material': '外装素材', 'Exterior Color': '外装色', 'Closure': '開閉',
  'Hardware Color': '金具色',
  'Lining Color': '裏地色',
  'Handle/Strap Material': 'ハンドル・ストラップ素材', 'Handle/Strap Color': 'ハンドル・ストラップ色',
  'Bag Width': '幅', 'Bag Height': '高さ', 'Bag Depth': 'マチ',
  'Accessories': '付属品',
  // 時計
  'Display': '表示方式', 'Movement': 'ムーブメント',
  'Case Material': 'ケース素材', 'Case Size': 'ケースサイズ',
  'Wrist Size': '腕周り', 'Dial Color': '文字盤色',
  'Reference Number': '型番/リファレンス', 'Band Material': 'ベルト素材',
  'Water Resistance': '防水性能', 'Band Color': 'ベルト色',
  'Bezel Color': 'ベゼル色', 'With Papers': '証明書付き',
  'With Original Box/Packaging': '箱付き', 'Indices': 'インデックス',
  // カメラ
  'Series': 'シリーズ', 'Maximum Resolution': '画素数',
  'Battery Type': 'バッテリータイプ', 'Lens Mount': 'レンズマウント',
  'Optical Zoom': '光学ズーム', 'Digital Zoom': 'デジタルズーム',
  'Maximum Aperture': '最大絞り値', 'Sensor Size': 'センサーサイズ',
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
  'Buoyancy': '浮力',
  'Number of Guides': 'ガイド数', 'Line Weight': '適合ライン', 'Pieces': 'ピース数', 'Item Weight': 'アイテム重量',
  // ルアー（Fishing Lures）
  'Bait Type': 'ベイトタイプ', 'Number in Pack': '入数', 'Water Type': '水域',
  // フィギュア（Figures）
  'Movie': '映画作品名', 'TV Show': 'テレビ番組名', 'Featured Person/Artist': 'モデル/アーティスト',
  // ブローチ（Brooches）
  'Materials sourced from': '素材調達元', 'Setting Style': 'セッティングスタイル',
  // トレーディングカード（Trading Cards）
  'Card Type': 'カードタイプ', 'Speciality': 'スペシャリティ', 'Age Level': '対象年齢',
  // ゴルフ（Golf）
  'Head Material': 'ヘッド素材', 'Lie Angle Color': 'ライ角カラー', 'Shaft Compatibility': 'シャフト互換',
  // リール（Fishing Reels）
  'Reel Size': 'サイズ/番手', 'Drag Style': 'ドラグ方式', 'Maximum Drag': '最大ドラグ力',
  // 野球（Baseball）
  'Experience Level': '対象レベル',
  // メカプラモ（Mecha Model Kits）
  'Item Height': '高さ',
  // 楽器（Guitars）
  'Body Color': 'ボディカラー', 'Body Type': 'ボディタイプ',
  'String Configuration': '弦構成', 'Model Year': '年式',
  'Number of Frets': 'フレット数',
  'Fretboard Material': '指板素材', 'Neck Material': 'ネック素材',
  'Bridge Type': 'ブリッジタイプ', 'Pickup Configuration': 'ピックアップ構成',
  // ゲーム機（Video Game Consoles）
  'Charger Included': '充電器付属',
  // 帽子（Hats）
  'Fabric Type': '生地タイプ',
  // ラジコン/模型（RC & Models）
  'Motor Type': 'モーターの種類', '4WD/2WD': '駆動方式',
  // 楽器（Effects & Amps / Synths & Digital / Musical Instruments）
  'Analog/Digital': 'アナログ/デジタル', 'Power Source': '電源',
  'Bypass Type': 'バイパス方式', 'Number of Keys': '鍵盤数',
  'Key/Pitch': '調/ピッチ', 'Subtype': 'サブタイプ',
  // シンセ・デジタル（Synths & Digital）
  'Action': 'アクション', 'Polyphony': 'ポリフォニー', 'Touch Sensitivity': 'タッチ感度',
  // エフェクター・アンプ（Effects & Amps）
  'To Fit': '対応楽器', 'Channel Count': 'チャンネル数', 'Wattage': 'ワット数',
  // 電子機器（Electronics）
  'Wireless Technology': 'ワイヤレス方式', 'Form Factor': 'フォームファクター', 'Number of Earpieces': '片耳/両耳', 'Microphone Type': 'マイクタイプ',
  // 万年筆
  'Ink Color': 'インク色', 'Nib Size': 'ニブサイズ', 'Nib Material': 'ニブ素材',
  // パイプ
  'Body Shape': '形状', 'Filter Size': 'フィルターサイズ', 'Handmade': 'ハンドメイド',
  // 時計パーツ
  'Part Type': 'パーツタイプ', 'Compatible Model': '対応モデル',
  // サングラス（Sunglasses）
  'Frame Color': 'フレーム色', 'Lens Color': 'レンズ色', 'Frame Material': 'フレーム素材',
  'Lens Technology': 'レンズテクノロジー', 'UV Protection': 'UV保護',
  // ゲーム周辺機器（Video Game Accessories）
  'Compatible Product': '互換製品', 'Cable Length': 'ケーブル長',
  'Number of Players': '最大プレイヤー数', 'Number of Fans': 'ファン数',
  // 時計パーツ追加（Watch Parts）
  'Compatible Brand': '互換ブランド', 'Movement Type': 'ムーブメントタイプ',
  // 石鹸（Soap）
  'Ingredients': '成分', 'Body Area': '使用部位', 'Skin Type': '肌タイプ',
  // パイプ追加（Pipes）
  'Bowl Size': 'ボウルサイズ', 'Stem Material': 'ステム素材',
  // コイン（Coins）
  'Mint': '造幣局',
  // ベビー（Baby）
  'Age Group': '対象年齢', 'Gender': '性別',
  // 美術・版画・掛軸・陶磁器
  'Artist': 'アーティスト', 'Production Technique': '制作技法',
  'Support': '本紙素材', 'Mounting Type': '表装', 'Scroll Rod Material': '軸先素材', 'Box Type': '箱',
  'Origin/Kiln': '産地/窯', 'Technique/Weave': '技法/産地',
  'Glaze/Finish': '釉薬/仕上げ', 'Drainage Holes': '水抜き穴', 'Maker/Kiln': '作家/窯元',
  'Subject/Deity': '尊格',
  // 茶道具（Tea Ceremony）
  'Dimensions': '寸法',
  // 漫画・アニメ・フィギュア
  'Title': 'タイトル', 'Author': '作者', 'Volume/Set': '巻数/セット',
  'Publication Year': '出版年', 'Official/Unofficial': '公式/非公式',
  'Number of Volumes': '全巻数',
  'Official/Bootleg': '正規品/海賊版', 'Series/Line': 'シリーズ/ライン',
  'Series/Franchise': 'シリーズ/フランチャイズ', 'Character/Mecha': 'キャラクター/メカ',
  'Grade': 'グレード', 'Built Status': '組立状態', 'Vehicle Type': '車種/機種',
  'Model/Series': 'モデル/シリーズ', 'Power Type': '動力源',
  'Capacity': '容量', 'Flex': 'フレックス', 'Balance': 'バランス',
  'Denomination': '額面', 'Composition': '素材構成',
  'Subtype': 'サブタイプ', 'Set Includes': 'セット内容',
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
  // 刀装具
  'Technique': '技法', 'Era/Period': '時代', 'School/Maker': '流派/作者', 'Motif/Subject': '図柄',
  'Original/Reproduction': 'オリジナル/複製',
  // レコード
  'Release Title': 'タイトル', 'Record Grading': 'レコード評価',
  'Record Label': 'レーベル', 'Format': 'フォーマット',
  'Record Size': 'レコードサイズ', 'Release Year': '発売年',
  'Sleeve Grading': 'ジャケット評価',
  'Speed': 'スピード (RPM)', 'Pressing Country': '製造国 (プレス元)',
  // 食器・ガラス器（Dinnerware / Glassware）
  'Origin': '産地', 'Production Style': '製法スタイル',
  'Glassware Type': 'ガラス器種別', 'Number of Pieces': '個数',
  // コイン・切手
  'Certification': '鑑定', 'Denomination': '額面', 'Year': '年',
  'Year of Issue': '発行年', 'Topic': 'テーマ', 'Quality': '品質',
  'Composition': '素材構成',
  // その他
  'Age': '年代', 'Scent': '香り', 'Product Line': '製品ライン',
  'Suitable For': '用途', 'Lining Material': '裏地素材',
  'Items Included': '付属品',
  'Character Family': 'キャラクターファミリー', 'Franchise': 'フランチャイズ',
  'Scale': 'スケール', 'Fuel Type': '動力源',
  'Set Includes': 'セット内容', 'Number of Place Settings': '人数分',
  'Item Width': '幅', 'Fits Belt Width': '対応ベルト幅',
  // ベルトバックル（Belt Buckles）
  'Trim Material': 'トリム素材', 'Performance/Activity': '用途/アクティビティ',
  // ベルト（Belts）
  'Size Type': 'サイズタイプ', 'Belt Width': 'ベルト幅', 'Accents': 'アクセント',
  // 靴（Shoes）
  'US Shoe Size': '米国靴サイズ',
  // ドール・ぬいぐるみ（Dolls & Plush）
  'Doll Gender': '性別', 'Doll Hair Color': '髪色', 'Doll Eye Color': '目の色', 'Doll Complexion': '肌色',
  'Hair Type': '髪質', 'Collection': 'コレクション',
  'Year Manufactured': '製造年',
  // テニス（Tennis）
  'Level': 'レベル',
  // 美術（Art）
  'Framing': 'フレーミング', 'Signed': 'サイン入り',
  // 包丁（Kitchen Knives）
  'Blade Material': '刃素材', 'Blade Length': '刃渡り',
  'Handle Material': '柄素材', 'Edge Type': '刃のタイプ',
  'Maker/Blacksmith': '刀匠/メーカー', 'Condition': 'コンディション',
  // 日本人形（Japanese Dolls）
  'Origin/Region': '産地/地域', 'Subject/Motif': '題材/図柄'
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

  var isBaseballCards = (category === 'Baseball Cards');

  var lines = [
    isBaseballCards
      ? 'This is a baseball card listed on eBay. Extract buyer-relevant information from the title and description. Output all values in English.'
      : 'この商品はeBayに英語で出品します。',
    isBaseballCards
      ? 'Extract all buyer-relevant and SEO-strong information to the maximum extent possible.'
      : '翻訳AIに渡す前に、タイトルと説明文から必要な情報を抜き出してください。',
    isBaseballCards
      ? 'Brand name is often in the title. Always check the title first.'
      : 'ブランド名・モデル名はタイトルに含まれていることが多いです。タイトルを必ず確認してください。',
    '',
    isBaseballCards
      ? 'Fill in the following fields from the title and description.'
      : 'タイトルと説明文から以下の項目を埋めてください。',
    isBaseballCards
      ? 'If a field is not found in the source, write NA.'
      : 'ソースに情報がない項目はNAと記入してください。'
  ];
  if (!isBaseballCards) {
    lines.push('各項目の文字数上限を厳守してください。');
  }
  lines.push('');

  for (var i = 0; i < fields.length; i++) {
    if (isBaseballCards) {
      lines.push(fields[i] + ':');
    } else {
      var limit = charLimits[fields[i]] || 15;
      lines.push(fields[i] + ': (' + limit + '文字以内)');
    }
  }

  lines.push('');
  lines.push('ルール:');
  lines.push('1. 数値はソースのまま忠実に出力する。丸めない、変換しない。');
  lines.push('2. ソースにない情報は書かない。NAにする。');
  if (!isBaseballCards) {
    lines.push('3. 出力は日本語のまま。ただしブランド名とモデル名は英語の正式名称で出力する。');
  }
  lines.push((isBaseballCards ? '3' : '4') + '. ブランド名は下記リストにあればそのスペルを正確に使用する。リストにない場合は正式な英語表記で出力する。');
  if (!isBaseballCards) {
    lines.push('5. 製造国はブランドの本国を記入する。工場の所在地（Made in China等）ではない。例: Seiko→日本、Canon→日本、Rolex→スイス、Leica→ドイツ、Casio→日本、Nikon→日本、Olympus→日本、Fujifilm→日本、Sony→日本、Panasonic→日本、TaylorMade→アメリカ、Titleist→アメリカ、Callaway→アメリカ、PING→アメリカ。ソースに「Made in ○○」と書いてあっても無視する。');
  }

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

  // Baseball Cards: 選手辞書注入（CARD_BASEBALL_PLAYERS → AI が即座に英語名変換できる）
  if (isBaseballCards) {
    if (typeof initCardPatterns_ === 'function') initCardPatterns_();
    if (typeof CARD_BASEBALL_PLAYERS !== 'undefined' && CARD_BASEBALL_PLAYERS.length) {
      lines.push('');
      lines.push('Player name reference (Japanese → English). Use these exact English names when the Japanese name appears in the source:');
      var playerLines = [];
      for (var p = 0; p < CARD_BASEBALL_PLAYERS.length; p++) {
        playerLines.push(CARD_BASEBALL_PLAYERS[p].jp + '=' + CARD_BASEBALL_PLAYERS[p].en);
      }
      lines.push(playerLines.join(', '));
    }
  }

  // Trading Cards: キャラクター辞書プレースホルダー（One Piece / Pokemon / YuGiOh / DragonBall）
  // 呼び出し元でソーステキストのゲーム検出後に実際の辞書で置換される
  if (category === 'Trading Cards') {
    lines.push('${onePieceCharDict}');
    lines.push('${pokemonCharDict}');
    lines.push('${yugiohCharDict}');
    lines.push('${dragonballCharDict}');
    lines.push('${digimonCharDict}');
  }

  // ゲーム機用の補足ルール（簡易カテゴリ: game）
  if (category === 'game') {
    lines.push('');
    lines.push('ゲーム機用の補足ルール:');
    lines.push('- メーカー: Nintendo/Sony/Sega/Microsoft/SNK/NEC/Atari のいずれかで記入。');
    lines.push('- 機種名: 正式名称で記入。例: Nintendo Switch, PlayStation 5, Sega Mega Drive, Xbox Series X, PC Engine, Neo Geo AES');
    lines.push('- タイプ: 据え置き/携帯機/ハイブリッド のいずれかで記入。');
    lines.push('- リージョン: NTSC-J(日本)/NTSC-U(北米)/PAL(欧州) のいずれか。日本製はNTSC-J。');
    lines.push('- ストレージ容量: GB単位で記入（例: 32GB, 825GB）。不明ならNA。');
  }

  // リール用の補足ルール（簡易カテゴリ: reel）
  if (category === 'reel') {
    lines.push('');
    lines.push('リール用の補足ルール:');
    lines.push('- リールタイプ: スピニング/ベイト(両軸)/フライ/電動/スピンキャスト のいずれかで記入。');
    lines.push('- 巻き方向: 右巻き/左巻き/両対応 のいずれかで記入。ハンドル交換可能なら両対応。');
    lines.push('- ギア比: ソースにある場合そのまま記入（例: 5.2:1, 6.4:1）。ない場合はNA。');
    lines.push('- サイズ/番手: 型番に含まれる数字（例: 2500, C3000, 103）をそのまま記入。');
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
 * @param {string=} title - J列タイトル
 * @param {string=} description - K列説明文
 * @return {string|null} ISカテゴリ名（'Watches', 'Cameras'等）。該当なしはnull
 */
function detectSanitizeCategory_(tag, title, description) {
  if (!tag) return null;
  var t = tag.toString().trim();
  if (!t) return null;

  if (t.indexOf('パソコン本体') !== -1) {
    return detectComputerSanitizeCategory_(title, description);
  }

  // IS_TAG_TO_CATEGORYで完全一致
  if (IS_TAG_TO_CATEGORY[t]) {
    var category = IS_TAG_TO_CATEGORY[t];
    return category === 'Computers' ? detectComputerSanitizeCategory_(title, description) : category;
  }

  // 部分一致フォールバック（長いキーワードから順にマッチ）
  var keys = Object.keys(IS_TAG_TO_CATEGORY);
  keys.sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) !== -1) {
      var partialCategory = IS_TAG_TO_CATEGORY[keys[i]];
      return partialCategory === 'Computers' ? detectComputerSanitizeCategory_(title, description) : partialCategory;
    }
  }
  return null;
}

function detectComputerSanitizeCategory_(title, description) {
  var source = String(title || '') + ' ' + String(description || '');
  if (/(ipad|アイパッド|tablet|タブレット|surface\s*(pro|go)|android\s*tablet|galaxy\s*tab|fire\s*hd|kindle\s*(fire|tablet))/i.test(source)) {
    return 'Tablets';
  }
  if (/(desktop|デスクトップ|デスクトップpc|デスクトップパソコン|imac|mac\s*mini|mac\s*pro|nuc|ミニpc|ミニパソコン|スティックpc|一体型pc|オールインワン|all[\s-]?in[\s-]?one|tower|タワー|workstation|ワークステーション|自作pc|bto|gaming\s*pc|ゲーミングpc)/i.test(source)) {
    return 'Desktops';
  }
  if (/(ノートパソコン|ノートpc|ラップトップ|ノート型pc|macbook|thinkpad|thinkbook|surface\s*laptop|surface\s*book|chromebook|クロームブック|レッツノート|vaio|バイオ|dynabook|ダイナブック|lifebook|lavie|ultrabook|netbook|notebook|laptop|2[\s-]?in[\s-]?1|モバイルpc|ビジネスノート|let'?s\s*note)/i.test(source)) {
    return 'Laptops';
  }
  return 'Laptops';
}


/**
 * 非連続行を連続ブロックに分けて setValues() で書き込む
 * G1 (非連続行対応) + G3 (形状検証) + フォールバック実装
 * @param {Sheet} sheet
 * @param {Array} rowValuePairs - [{row: N, value: V}, ...]
 * @param {number} col - 書き込み先の列番号
 */
function writeRowsInBlocks_(sheet, rowValuePairs, col) {
  if (!rowValuePairs || rowValuePairs.length === 0) return;
  var sorted = rowValuePairs.slice().sort(function(a, b) { return a.row - b.row; });
  var blocks = [];
  var currentBlock = [sorted[0]];
  for (var i = 1; i < sorted.length; i++) {
    if (sorted[i].row === currentBlock[currentBlock.length - 1].row + 1) {
      currentBlock.push(sorted[i]);
    } else {
      blocks.push(currentBlock);
      currentBlock = [sorted[i]];
    }
  }
  blocks.push(currentBlock);
  for (var b = 0; b < blocks.length; b++) {
    var block = blocks[b];
    var values = block.map(function(p) { return [p.value]; });
    if (values.length !== block.length) {
      Logger.log('[writeRowsInBlocks_] 形状不一致、個別書き込みフォールバック block=' + b);
      for (var k = 0; k < block.length; k++) {
        sheet.getRange(block[k].row, col).setValue(block[k].value);
      }
      continue;
    }
    try {
      sheet.getRange(block[0].row, col, block.length, 1).setValues(values);
    } catch (e) {
      Logger.log('[writeRowsInBlocks_] setValues 失敗、個別フォールバック: ' + e);
      for (var k2 = 0; k2 < block.length; k2++) {
        sheet.getRange(block[k2].row, col).setValue(block[k2].value);
      }
    }
  }
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
    var category = detectSanitizeCategory_(tag, jpTitle, jpDesc);
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

  // Step 1: バックアップ（K→AV, Kクリア）— I2: setValues 一括化
  var backupPairs = [];
  var clearPairs = [];
  for (var i = 0; i < items.length; i++) {
    backupPairs.push({ row: items[i].row, value: items[i].jpDesc });
    clearPairs.push({ row: items[i].row, value: '' });
  }
  writeRowsInBlocks_(sheet, backupPairs, CONFIG.COLUMNS.JP_DESC_BACKUP);
  writeRowsInBlocks_(sheet, clearPairs, CONFIG.COLUMNS.JP_DESC);
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
      var rawText_ = (batchItems[j].jpTitle || '') + ' ' + (batchItems[j].jpDesc || '');
      var onePieceDict_ = '';
      if (cat === 'Trading Cards' && /ワンピース|ONE PIECE|ルフィ|ゾロ|OP-/.test(rawText_)) {
        if (typeof initCardPatterns_ === 'function') initCardPatterns_();
        if (typeof CARD_ONEPIECE_CHARACTERS !== 'undefined' && CARD_ONEPIECE_CHARACTERS.length) {
          var opDictLines_ = ['\nOne Piece character name reference (Japanese -> English):'];
          for (var opi_ = 0; opi_ < CARD_ONEPIECE_CHARACTERS.length; opi_++) {
            opDictLines_.push(CARD_ONEPIECE_CHARACTERS[opi_].jp + '=' + CARD_ONEPIECE_CHARACTERS[opi_].en);
          }
          onePieceDict_ = opDictLines_.join('\n');
        }
      }
      var pokemonDict_ = '';
      if (cat === 'Trading Cards' && /ポケカ|ポケモン|Pokemon|ピカチュウ|イーブイ|リザードン|ポケットモンスター/.test(rawText_)) {
        if (typeof initCardPatterns_ === 'function') initCardPatterns_();
        var pkLines_ = ['\nPokemon character/trainer name reference (Japanese -> English):'];
        if (typeof CARD_POKEMON_CHARACTERS !== 'undefined' && CARD_POKEMON_CHARACTERS.length) {
          for (var pki_ = 0; pki_ < CARD_POKEMON_CHARACTERS.length; pki_++) {
            pkLines_.push(CARD_POKEMON_CHARACTERS[pki_].jp + '=' + CARD_POKEMON_CHARACTERS[pki_].en);
          }
        }
        if (typeof CARD_POKEMON_TRAINERS !== 'undefined' && CARD_POKEMON_TRAINERS.length) {
          for (var pkt_ = 0; pkt_ < CARD_POKEMON_TRAINERS.length; pkt_++) {
            pkLines_.push(CARD_POKEMON_TRAINERS[pkt_].jp + '=' + CARD_POKEMON_TRAINERS[pkt_].en);
          }
        }
        pokemonDict_ = pkLines_.join('\n');
      }
      var yugiohDict_ = '';
      if (cat === 'Trading Cards' && /遊戯王|YuGiOh|Yu-Gi-Oh|遊戯/.test(rawText_)) {
        if (typeof initCardPatterns_ === 'function') initCardPatterns_();
        if (typeof CARD_YUGIOH_CHARACTERS !== 'undefined' && CARD_YUGIOH_CHARACTERS.length) {
          var ygDictLines_ = ['\nYu-Gi-Oh! character/card name reference (Japanese -> English):'];
          for (var ygi_ = 0; ygi_ < CARD_YUGIOH_CHARACTERS.length; ygi_++) {
            ygDictLines_.push(CARD_YUGIOH_CHARACTERS[ygi_].jp + '=' + CARD_YUGIOH_CHARACTERS[ygi_].en);
          }
          yugiohDict_ = ygDictLines_.join('\n');
        }
      }
      var dragonballDict_ = '';
      if (cat === 'Trading Cards' && /ドラゴンボール|Dragon Ball|DBS|Fusion World/.test(rawText_)) {
        if (typeof initCardPatterns_ === 'function') initCardPatterns_();
        if (typeof CARD_DRAGONBALL_CHARACTERS !== 'undefined' && CARD_DRAGONBALL_CHARACTERS.length) {
          var dbDictLines_ = ['\nDragon Ball character name reference (Japanese -> English):'];
          for (var dbi_ = 0; dbi_ < CARD_DRAGONBALL_CHARACTERS.length; dbi_++) {
            dbDictLines_.push(CARD_DRAGONBALL_CHARACTERS[dbi_].jp + '=' + CARD_DRAGONBALL_CHARACTERS[dbi_].en);
          }
          dragonballDict_ = dbDictLines_.join('\n');
        }
      }
      var digimonDict_ = '';
      if (cat === 'Trading Cards' && /デジモン|Digimon/.test(rawText_)) {
        if (typeof initCardPatterns_ === 'function') initCardPatterns_();
        if (typeof CARD_DIGIMON_CHARACTERS !== 'undefined' && CARD_DIGIMON_CHARACTERS.length) {
          var dgDictLines_ = ['\nDigimon character name reference (Japanese -> English):'];
          for (var dgi_ = 0; dgi_ < CARD_DIGIMON_CHARACTERS.length; dgi_++) {
            dgDictLines_.push(CARD_DIGIMON_CHARACTERS[dgi_].jp + '=' + CARD_DIGIMON_CHARACTERS[dgi_].en);
          }
          digimonDict_ = dgDictLines_.join('\n');
        }
      }
      var prompt = promptCache[cat].replace('${onePieceCharDict}', onePieceDict_).replace('${pokemonCharDict}', pokemonDict_).replace('${yugiohCharDict}', yugiohDict_).replace('${dragonballCharDict}', dragonballDict_).replace('${digimonCharDict}', digimonDict_).replace('${jpTitle}', batchItems[j].jpTitle).replace('${jpDesc}', batchItems[j].jpDesc);
      prompts.push(prompt);
      requests.push(buildSanitizeRequest_(settings, prompt));
    }

    var responses;
    try { responses = UrlFetchApp.fetchAll(requests); }
    catch (e) { for (var j = 0; j < batchItems.length; j++) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: e.message }); } continue; }

    var pass1WritePairs = []; // B4: Pass1 結果書き込みバッチ
    for (var j = 0; j < responses.length; j++) {
      try {
        var r = parseSanitizeResponse_(settings.platform, responses[j]);
        if (!r.ok) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: r.error }); continue; }
        var parsed = parseSanitizedFields_(r.content, batchItems[j].category);
        if (!parsed.description) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: 'PARSE_ERROR' }); continue; }
        if (batchItems[j].category === 'Baseball Cards') {
          // BBC: プログラム確定値 prefix 付加 → AV/AW 共通で使用。バリデーションスキップ
          var bbcPrefix = buildBbcProgramValues_(batchItems[j].jpTitle, batchItems[j].jpDesc);
          var bbcStructured = bbcPrefix + ' | ' + parsed.description;
          pass1WritePairs.push({ row: batchItems[j].row, value: bbcStructured }); // B4 (AV)
          pass2Items.push({ row: batchItems[j].row, category: 'Baseball Cards', jaStructured: bbcStructured }); jaSuccessCount++;
        } else {
          pass1WritePairs.push({ row: batchItems[j].row, value: parsed.description }); // B4
          var val = validateSanitizedResult_(parsed.description, batchItems[j].category);
          if (val.valid) { pass2Items.push({ row: batchItems[j].row, category: batchItems[j].category, jaStructured: parsed.description }); jaSuccessCount++; } // I1
          else { validationFailedItems.push({ item: batchItems[j], errors: val.errors }); }
        }
      } catch (e) { apiFailedItems.push({ item: batchItems[j], prompt: prompts[j], error: e.message || String(e) }); }
    }
    writeRowsInBlocks_(sheet, pass1WritePairs, CONFIG.COLUMNS.JP_DESC); // B4

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
      var pass1RetryWritePairs = []; // B4: Pass1 リトライ結果書き込みバッチ
      for (var r = 0; r < resps.length; r++) {
        var x = slice[r];
        var ok = parseSanitizeResponse_(settings.platform, resps[r]);
        if (!ok.ok) { next.push(x); continue; }
        var p = parseSanitizedFields_(ok.content, x.item.category);
        if (!p.description) { next.push(x); continue; }
        if (x.item.category === 'Baseball Cards') {
          var bbcPrefix2 = buildBbcProgramValues_(x.item.jpTitle, x.item.jpDesc);
          var bbcStructured2 = bbcPrefix2 + ' | ' + p.description;
          pass1RetryWritePairs.push({ row: x.item.row, value: bbcStructured2 }); // B4 (AV)
          pass2Items.push({ row: x.item.row, category: 'Baseball Cards', jaStructured: bbcStructured2 }); jaSuccessCount++;
        } else {
          pass1RetryWritePairs.push({ row: x.item.row, value: p.description }); // B4
          var v = validateSanitizedResult_(p.description, x.item.category);
          if (v.valid) { pass2Items.push({ row: x.item.row, category: x.item.category, jaStructured: p.description }); jaSuccessCount++; } // I1
          else { validationFailedItems.push({ item: x.item, errors: v.errors }); }
        }
      }
      writeRowsInBlocks_(sheet, pass1RetryWritePairs, CONFIG.COLUMNS.JP_DESC); // B4
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
        var rawText2_ = (it.jpTitle || '') + ' ' + (it.jpDesc || '');
        var opDict2_ = '';
        if (cat === 'Trading Cards' && /ワンピース|ONE PIECE|ルフィ|ゾロ|OP-/.test(rawText2_)) {
          if (typeof initCardPatterns_ === 'function') initCardPatterns_();
          if (typeof CARD_ONEPIECE_CHARACTERS !== 'undefined' && CARD_ONEPIECE_CHARACTERS.length) {
            var opDictLines2_ = ['\nOne Piece character name reference (Japanese -> English):'];
            for (var opi2_ = 0; opi2_ < CARD_ONEPIECE_CHARACTERS.length; opi2_++) {
              opDictLines2_.push(CARD_ONEPIECE_CHARACTERS[opi2_].jp + '=' + CARD_ONEPIECE_CHARACTERS[opi2_].en);
            }
            opDict2_ = opDictLines2_.join('\n');
          }
        }
        var pkDict2_ = '';
        if (cat === 'Trading Cards' && /ポケカ|ポケモン|Pokemon|ピカチュウ|イーブイ|リザードン|ポケットモンスター/.test(rawText2_)) {
          if (typeof initCardPatterns_ === 'function') initCardPatterns_();
          var pkLines2_ = ['\nPokemon character/trainer name reference (Japanese -> English):'];
          if (typeof CARD_POKEMON_CHARACTERS !== 'undefined' && CARD_POKEMON_CHARACTERS.length) {
            for (var pki2_ = 0; pki2_ < CARD_POKEMON_CHARACTERS.length; pki2_++) {
              pkLines2_.push(CARD_POKEMON_CHARACTERS[pki2_].jp + '=' + CARD_POKEMON_CHARACTERS[pki2_].en);
            }
          }
          if (typeof CARD_POKEMON_TRAINERS !== 'undefined' && CARD_POKEMON_TRAINERS.length) {
            for (var pkt2_ = 0; pkt2_ < CARD_POKEMON_TRAINERS.length; pkt2_++) {
              pkLines2_.push(CARD_POKEMON_TRAINERS[pkt2_].jp + '=' + CARD_POKEMON_TRAINERS[pkt2_].en);
            }
          }
          pkDict2_ = pkLines2_.join('\n');
        }
        var yugiohDict2_ = '';
        if (cat === 'Trading Cards' && /遊戯王|YuGiOh|Yu-Gi-Oh|遊戯/.test(rawText2_)) {
          if (typeof initCardPatterns_ === 'function') initCardPatterns_();
          if (typeof CARD_YUGIOH_CHARACTERS !== 'undefined' && CARD_YUGIOH_CHARACTERS.length) {
            var ygDictLines2_ = ['\nYu-Gi-Oh! character/card name reference (Japanese -> English):'];
            for (var ygi2_ = 0; ygi2_ < CARD_YUGIOH_CHARACTERS.length; ygi2_++) {
              ygDictLines2_.push(CARD_YUGIOH_CHARACTERS[ygi2_].jp + '=' + CARD_YUGIOH_CHARACTERS[ygi2_].en);
            }
            yugiohDict2_ = ygDictLines2_.join('\n');
          }
        }
        var dragonballDict2_ = '';
        if (cat === 'Trading Cards' && /ドラゴンボール|Dragon Ball|DBS|Fusion World/.test(rawText2_)) {
          if (typeof initCardPatterns_ === 'function') initCardPatterns_();
          if (typeof CARD_DRAGONBALL_CHARACTERS !== 'undefined' && CARD_DRAGONBALL_CHARACTERS.length) {
            var dbDictLines2_ = ['\nDragon Ball character name reference (Japanese -> English):'];
            for (var dbi2_ = 0; dbi2_ < CARD_DRAGONBALL_CHARACTERS.length; dbi2_++) {
              dbDictLines2_.push(CARD_DRAGONBALL_CHARACTERS[dbi2_].jp + '=' + CARD_DRAGONBALL_CHARACTERS[dbi2_].en);
            }
            dragonballDict2_ = dbDictLines2_.join('\n');
          }
        }
        var digimonDict2_ = '';
        if (cat === 'Trading Cards' && /デジモン|Digimon/.test(rawText2_)) {
          if (typeof initCardPatterns_ === 'function') initCardPatterns_();
          if (typeof CARD_DIGIMON_CHARACTERS !== 'undefined' && CARD_DIGIMON_CHARACTERS.length) {
            var dgDictLines2_ = ['\nDigimon character name reference (Japanese -> English):'];
            for (var dgi2_ = 0; dgi2_ < CARD_DIGIMON_CHARACTERS.length; dgi2_++) {
              dgDictLines2_.push(CARD_DIGIMON_CHARACTERS[dgi2_].jp + '=' + CARD_DIGIMON_CHARACTERS[dgi2_].en);
            }
            digimonDict2_ = dgDictLines2_.join('\n');
          }
        }
        var prompt = extra + '\n\n' + promptCache[cat].replace('${onePieceCharDict}', opDict2_).replace('${pokemonCharDict}', pkDict2_).replace('${yugiohCharDict}', yugiohDict2_).replace('${dragonballCharDict}', dragonballDict2_).replace('${digimonCharDict}', digimonDict2_).replace('${jpTitle}', it.jpTitle).replace('${jpDesc}', it.jpDesc);
        reqs.push(buildSanitizeRequest_(settings, prompt));
      }
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var s = 0; s < slice.length; s++) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_HTTP ' + e.message); } continue; }
      var pass25WritePairs = []; // B4: Pass2.5 結果書き込みバッチ
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_API ' + ok.error); continue; }
        var p = parseSanitizedFields_(ok.content, slice[s].item.category);
        if (!p.description) { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_RETRY_PARSE'); continue; }
        pass25WritePairs.push({ row: slice[s].item.row, value: p.description }); // B4
        var v = validateSanitizedResult_(p.description, slice[s].item.category);
        if (v.valid) { pass2Items.push({ row: slice[s].item.row, category: slice[s].item.category, jaStructured: p.description }); jaSuccessCount++; } // I1
        else { errorDetails.push('行' + slice[s].item.row + ': VALIDATION_ERROR ' + (v.errors || []).join('、')); }
      }
      writeRowsInBlocks_(sheet, pass25WritePairs, CONFIG.COLUMNS.JP_DESC); // B4
      if (i + BATCH_SIZE < retryItems.length) { Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000); }
    }
  }

  // Pass 2: 英語化（Baseball Cards はPass1で既に英語出力 → AWにそのままコピー、他カテゴリは AI）
  var enSuccessCount = 0;
  var bbcCopyPairs = [];
  var pass2NonBBC = [];
  for (var i = 0; i < pass2Items.length; i++) {
    if (pass2Items[i].category === 'Baseball Cards') {
      bbcCopyPairs.push({ row: pass2Items[i].row, value: pass2Items[i].jaStructured || '' });
    } else {
      pass2NonBBC.push(pass2Items[i]);
    }
  }
  if (bbcCopyPairs.length > 0) {
    writeRowsInBlocks_(sheet, bbcCopyPairs, CONFIG.COLUMNS.EN_DESC_SANITIZED);
    enSuccessCount += bbcCopyPairs.length;
  }
  pass2Items = pass2NonBBC;

  var enApiFailedItems = [];
  var enValidationFailedItems = [];
  if (pass2Items.length > 0 && (Date.now() - startTime <= 300000)) {
    for (var i = 0; i < pass2Items.length; i += BATCH_SIZE) {
      if (Date.now() - startTime > 300000) { timeoutSkipped += (pass2Items.length - i); break; }
      var slice = pass2Items.slice(i, i + BATCH_SIZE);
      var reqs = [];
      var prompts = [];
      for (var s = 0; s < slice.length; s++) {
        // I1: Pass1 のキャッシュを利用、フォールバックでシートから読む (G2)
        var cachedJa = slice[s].jaStructured;
        if (!cachedJa) {
          cachedJa = String(sheet.getRange(slice[s].row, CONFIG.COLUMNS.JP_DESC).getValue() || '');
        }
        var prompt = buildEnglishizePrompt_(slice[s].category, cachedJa);
        prompts.push(prompt);
        reqs.push(buildSanitizeRequest_(settings, prompt));
      }
      var resps;
      try { resps = UrlFetchApp.fetchAll(reqs); }
      catch (e) { for (var s = 0; s < slice.length; s++) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: e.message }); } continue; }
      var pass2EnWritePairs = []; // B4: Pass2 EN 結果書き込みバッチ
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: ok.error }); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { enApiFailedItems.push({ item: slice[s], prompt: prompts[s], error: 'EMPTY_OUTPUT' }); continue; }
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) {
          pass2EnWritePairs.push({ row: slice[s].row, value: out }); // B4 (日本語混入行も先に書き込む)
          enValidationFailedItems.push({ item: slice[s], prompt: prompts[s] });
        } else {
          pass2EnWritePairs.push({ row: slice[s].row, value: out }); // B4
          enSuccessCount++;
        }
      }
      writeRowsInBlocks_(sheet, pass2EnWritePairs, CONFIG.COLUMNS.EN_DESC_SANITIZED); // B4
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
      var enRetryWritePairs = []; // B4: Pass2 EN リトライ結果書き込みバッチ
      for (var r = 0; r < resps.length; r++) {
        var x = slice[r];
        var ok = parseSanitizeResponse_(settings.platform, resps[r]);
        if (!ok.ok) { nextEn.push(x); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { nextEn.push(x); continue; }
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) {
          enRetryWritePairs.push({ row: x.item.row, value: out }); // B4
          enValidationFailedItems.push({ item: x.item, prompt: x.prompt });
        } else {
          enRetryWritePairs.push({ row: x.item.row, value: out }); // B4
          enSuccessCount++;
        }
      }
      writeRowsInBlocks_(sheet, enRetryWritePairs, CONFIG.COLUMNS.EN_DESC_SANITIZED); // B4
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
      var pass35WritePairs = []; // B4: Pass3.5 結果書き込みバッチ
      for (var s = 0; s < resps.length; s++) {
        var ok = parseSanitizeResponse_(settings.platform, resps[s]);
        if (!ok.ok) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_RETRY_API ' + ok.error); continue; }
        var out = (ok.content || '').replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
        if (!out) { errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_RETRY_EMPTY'); continue; }
        if (typeof containsJapanese_ === 'function' && containsJapanese_(out)) {
          pass35WritePairs.push({ row: slice[s].item.row, value: out }); // B4
          errorDetails.push('行' + slice[s].item.row + ': EN_VALIDATION_ERROR(日本語混入)');
        } else {
          pass35WritePairs.push({ row: slice[s].item.row, value: out }); // B4
          enSuccessCount++;
        }
      }
      writeRowsInBlocks_(sheet, pass35WritePairs, CONFIG.COLUMNS.EN_DESC_SANITIZED); // B4
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
  if (category === 'Baseball Cards') {
    lines.push('出力例（野球カードの場合）:');
    lines.push('Player: Shohei Ohtani, Yoshinobu Yamamoto | Brand: Topps | Season: 2024 | Set: Topps Series 1 | Card Type: RC | Card Number: #123 | Professional Grader: PSA | Grade: 10 | Serial Number: /99 | Condition: NA');
  } else {
    lines.push('出力例（時計の場合）:');
    lines.push('Brand: Seiko | Model: Presage | Display: Analog | Movement: Automatic | Case Material: Stainless Steel | Dial Color: Blue | Country of Origin: Japan | Accessories: Box, Manual | Condition: Used, Good');
  }
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

  // ブランド/メーカー必須チェックは廃止（2026-04-09）
  // 理由: こけし・コレクティブル・アンティーク・伝統工芸品など、ブランド名が存在しない商品が多数ある。
  // 時計等でもノーブランド品やアンティークにはブランド情報がないケースがある。
  // ブランドを必須にすると Pass 2（英語版生成）に進めず、AW列が出力されない症状が発生していた。
  // 最低限の品質は下記の「フィールド数 >= 2」でガードする。

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

/**
 * Baseball Cards 用のプログラム確定値 prefix を生成
 * @param {string} title - J列（日本語タイトル）
 * @param {string} desc  - K列（日本語説明）
 * @return {string} "Category: Baseball Cards | Sport: Baseball | ..."
 */
function buildBbcProgramValues_(title, desc) {
  var src = String(title || '') + ' ' + String(desc || '');

  // Sale Type 検出
  var saleType = 'Single';
  if (/まとめ|セット|\d+枚|ロット|[Ll]ot|[Bb]ulk|[Bb]undle|コンプリート/.test(src) &&
      !/単品|シングルカード\s*1枚|single\s*card/.test(src)) {
    saleType = 'Lot';
  }

  // League 検出
  var hasMLB = /MLB|メジャー|日本人メジャーリーガー|大リーグ/.test(src);
  var hasNPB = /NPB|プロ野球|日本プロ野球|セ・?リーグ|パ・?リーグ|巨人|阪神|ヤクルト|広島|中日|DeNA|ソフトバンク|日本ハム|ロッテ|オリックス|西武|楽天/.test(src);
  var league = '';
  if (hasMLB && hasNPB) league = 'Mixed';
  else if (hasMLB) league = 'MLB';
  else if (hasNPB) league = 'NPB';

  var parts = [
    'Category: Baseball Cards',
    'Sport: Baseball',
    'Card Size: Standard',
    'Sale Type: ' + saleType
  ];
  if (league) parts.push('League: ' + league);

  return parts.join(' | ');
}

// Baseball Cards Pass1 出力を辞書ベースでプログラム英語化する（未使用・参照のみ残存）
function translateBaseballCardsToEN_(pass1Output) {
  if (!pass1Output) return '';

  var FIELD_MAP_KEYS = ['プレイヤー名', 'ブランド名', '年代', 'セット名', 'カード種別', 'カード番号', '鑑定会社', '鑑定グレード', 'シリアル番号', 'コンディション'];
  var FIELD_MAP_VALS = ['Player Names', 'Brand', 'Season', 'Set', 'Card Type', 'Card Number', 'Professional Grader', 'Grade', 'Serial Number', 'Condition'];

  // CARD_BASEBALL_PLAYERS 辞書を lookup map に変換
  if (typeof initCardPatterns_ === 'function') initCardPatterns_();
  var playerLookup = {};
  var playerArray = [];
  if (typeof CARD_BASEBALL_PLAYERS !== 'undefined') {
    playerArray = CARD_BASEBALL_PLAYERS;
    for (var d = 0; d < CARD_BASEBALL_PLAYERS.length; d++) {
      playerLookup[CARD_BASEBALL_PLAYERS[d].jp] = CARD_BASEBALL_PLAYERS[d].en;
    }
  }

  // 問題1修正: ライン単位でパース（単一フィールド入力・改行混在に対応）
  var normalized = pass1Output.replace(/\r\n?/g, '\n');
  var lines = normalized.split('\n');
  var fieldMap = {};
  var currentKey = null;
  for (var li = 0; li < lines.length; li++) {
    var line = lines[li].trim();
    if (!line) continue;
    var cPos = line.search(/[：:]/);
    if (cPos > 0) {
      var possibleKey = line.substring(0, cPos).trim();
      var kidx = FIELD_MAP_KEYS.indexOf(possibleKey);
      if (kidx >= 0) {
        currentKey = possibleKey;
        fieldMap[currentKey] = line.substring(cPos + 1).trim();
        continue;
      }
    }
    if (currentKey !== null) {
      fieldMap[currentKey] += ' ' + line;
    }
  }

  var pairs = [];
  for (var ki = 0; ki < FIELD_MAP_KEYS.length; ki++) {
    var key = FIELD_MAP_KEYS[ki];
    var val = fieldMap[key];
    if (!val || val === 'NA') continue;

    var enKey = FIELD_MAP_VALS[ki];

    if (key === 'プレイヤー名') {
      var names = val.split(/[,、，]+/);
      var allEnNames = [];
      var seen = {};
      for (var n = 0; n < names.length; n++) {
        var name = names[n].trim();
        if (!name) continue;
        // 問題3修正: 重複除去
        if (seen[name]) continue;
        seen[name] = true;
        // 問題2修正: 1. 完全一致 → 2. 姓のみ startsWith マッチ
        var enName = playerLookup[name];
        if (!enName) {
          for (var d2 = 0; d2 < playerArray.length; d2++) {
            if (playerArray[d2].jp.indexOf(name) === 0 && playerArray[d2].jp.length > name.length) {
              enName = playerArray[d2].en;
              break;
            }
          }
        }
        allEnNames.push(enName || name);
      }
      var totalNames = allEnNames.length;
      if (totalNames === 0) continue;
      if (totalNames > 3) {
        val = allEnNames.slice(0, 3).join(', ') + ' and ' + (totalNames - 3) + ' others';
      } else {
        val = allEnNames.join(', ');
      }
    }

    if (val) pairs.push(enKey + ': ' + val);
  }

  return pairs.join(' | ');
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
