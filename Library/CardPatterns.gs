/******************************************************
 * CardPatterns.gs - カード辞書マスター
 * ゲーム別辞書の一元管理
 * - ItemSpecifics用パターン辞書
 * - 翻訳プロンプト用テキスト生成
 ******************************************************/

/**
 * マスター辞書配列からIS用パターン配列を生成
 * {jp: '...', en: '...'} → {keywords: ['...', '...'], value: '...'}
 * @param {Array} masterArray - [{jp, en, code?}, ...]
 * @return {Array} IS用パターン配列
 */
function buildISPatterns_(masterArray) {
  var MIN_KEYWORD_LEN = 2;
  var patterns = [];
  for (var i = 0; i < masterArray.length; i++) {
    var item = masterArray[i];
    if (!item || !item.en) continue;
    var keywords = [];
    if (item.jp && item.jp.length >= MIN_KEYWORD_LEN) keywords.push(item.jp);
    if (item.en && item.en.length >= MIN_KEYWORD_LEN) keywords.push(item.en);
    if (item.code && item.code.length >= MIN_KEYWORD_LEN) keywords.push(item.code);
    if (item.aliases) {
      for (var a = 0; a < item.aliases.length; a++) {
        if (item.aliases[a] && item.aliases[a].length >= MIN_KEYWORD_LEN) {
          keywords.push(item.aliases[a]);
        }
      }
    }
    if (keywords.length === 0) continue;
    patterns.push({keywords: keywords, value: item.en});
  }
  return patterns;
}

/**
 * マスター辞書配列から翻訳プロンプト用テキストを生成
 * {jp: '...', en: '...'} → '日本語=English'
 * @param {Array} masterArray - [{jp, en}, ...]
 * @return {string} 改行区切りテキスト
 */
function buildPromptDict_(masterArray) {
  var lines = [];
  for (var i = 0; i < masterArray.length; i++) {
    var item = masterArray[i];
    if (!item || !item.jp || !item.en) continue;
    lines.push(item.jp + '=' + item.en);
  }
  return lines.join('\n');
}

// ==============================
// ポケモンカード マスター辞書
// ==============================

var CARD_POKEMON_SETS = [
  // ============================================================
  // 2026 (MEGA era)
  // ============================================================
  {jp: 'ニンジャスピナー', en: 'Ninja Spinner', code: 'M4'},
  {jp: 'ムニキスゼロ', en: 'Munikis Zero', code: 'M3'},

  // ============================================================
  // 2025 (MEGA era)
  // ============================================================
  {jp: 'MEGAドリームex', en: 'MEGA Dream ex', code: 'M2a', aliases: ['メガドリームex']},
  {jp: 'インフェルノX', en: 'Inferno X', code: 'M2'},
  {jp: 'メガシンフォニア', en: 'Mega Symphonia', code: 'M1S'},
  {jp: 'メガブレイブ', en: 'Mega Brave', code: 'M1L'},

  // ============================================================
  // 2025 (Scarlet & Violet era)
  // ============================================================
  {jp: 'ブラックボルト', en: 'Black Bolt', code: 'SV11B'},
  {jp: 'ホワイトフレア', en: 'White Flare', code: 'SV11W'},
  {jp: 'ロケット団の栄光', en: 'Destined Rivals', code: 'SV10', aliases: ['Glory of Team Rocket', 'Glory of the Rocket Gang']},
  {jp: '熱風アリーナ', en: 'Hot Wind Arena', code: 'SV9a'},
  {jp: 'バトルパートナーズ', en: 'Battle Partners', code: 'SV9', aliases: ['Journey Together']},

  // ============================================================
  // 2024 (Scarlet & Violet era)
  // ============================================================
  {jp: 'テラスタルフェスex', en: 'Terastal Festival ex', code: 'SV8a', aliases: ['Prismatic Evolutions']},
  {jp: '超電ブレイカー', en: 'Super Electric Breaker', code: 'SV8', aliases: ['Surging Sparks']},
  {jp: '楽園ドラゴーナ', en: 'Paradise Dragona', code: 'SV7a', aliases: ['Stellar Crown']},
  {jp: 'ステラミラクル', en: 'Stellar Miracle', code: 'SV7', aliases: ['Stellar Crown']},
  {jp: 'ナイトワンダラー', en: 'Night Wanderer', code: 'SV6a', aliases: ['Shrouded Fable']},
  {jp: '変幻の仮面', en: 'Twilight Masquerade', code: 'SV6', aliases: ['Transformation Mask']},
  {jp: 'クリムゾンヘイズ', en: 'Crimson Haze', code: 'SV5a', aliases: ['Temporal Forces']},
  {jp: 'ワイルドフォース', en: 'Wild Force', code: 'SV5K', aliases: ['Temporal Forces']},
  {jp: 'サイバージャッジ', en: 'Cyber Judge', code: 'SV5M', aliases: ['Temporal Forces']},
  {jp: 'シャイニートレジャーex', en: 'Shiny Treasure ex', code: 'SV4a', aliases: ['Paldean Fates']},

  // ============================================================
  // 2023 (Scarlet & Violet era)
  // ============================================================
  {jp: '未来の一閃', en: 'Future Flash', code: 'SV4M', aliases: ['Paradox Rift']},
  {jp: '古代の咆哮', en: 'Ancient Roar', code: 'SV4K', aliases: ['Paradox Rift']},
  {jp: 'レイジングサーフ', en: 'Raging Surf', code: 'SV3a', aliases: ['Paradox Rift']},
  {jp: '黒炎の支配者', en: 'Ruler of the Black Flame', code: 'SV3', aliases: ['Obsidian Flames']},
  {jp: 'ポケモンカード151', en: 'Pokemon Card 151', code: 'SV2a', aliases: ['151', 'MEW']},
  {jp: 'クレイバースト', en: 'Clay Burst', code: 'SV2D', aliases: ['Paldea Evolved']},
  {jp: 'スノーハザード', en: 'Snow Hazard', code: 'SV2P', aliases: ['Paldea Evolved']},
  {jp: 'トリプレットビート', en: 'Triplet Beat', code: 'SV1a'},
  {jp: 'バイオレットex', en: 'Violet ex', code: 'SV1V'},
  {jp: 'スカーレットex', en: 'Scarlet ex', code: 'SV1S'},

  // ============================================================
  // 英語版セット (Scarlet & Violet Series - EN codes)
  // ============================================================
  {jp: null, en: 'Scarlet & Violet', code: 'SVI', aliases: ['SVI']},
  {jp: null, en: 'Paldea Evolved', code: 'PAL', aliases: ['PAL']},
  {jp: null, en: 'Obsidian Flames', code: 'OBF', aliases: ['OBF']},
  {jp: null, en: '151', code: 'MEW', aliases: ['MEW', 'Pokemon 151']},
  {jp: null, en: 'Paradox Rift', code: 'PAR', aliases: ['PAR']},
  {jp: null, en: 'Paldean Fates', code: 'PAF', aliases: ['PAF']},
  {jp: null, en: 'Temporal Forces', code: 'TEF', aliases: ['TEF']},
  {jp: null, en: 'Twilight Masquerade', code: 'TWM', aliases: ['TWM']},
  {jp: null, en: 'Shrouded Fable', code: 'SFA', aliases: ['SFA']},
  {jp: null, en: 'Stellar Crown', code: 'SCR', aliases: ['SCR']},
  {jp: null, en: 'Surging Sparks', code: 'SSP', aliases: ['SSP']},
  {jp: null, en: 'Prismatic Evolutions', code: 'PRE', aliases: ['PRE']},
  {jp: null, en: 'Journey Together', code: 'JTG', aliases: ['JTG']},
  {jp: null, en: 'Destined Rivals', code: 'DRI', aliases: ['DRI']},

  // ============================================================
  // 2019-2022 (Sword & Shield era - Japanese)
  // ============================================================
  {jp: 'VSTARユニバース', en: 'VSTAR Universe', code: 'S12a'},
  {jp: 'パラダイムトリガー', en: 'Paradigm Trigger', code: 'S12'},
  {jp: '白熱のアルカナ', en: 'Incandescent Arcana', code: 'S11a'},
  {jp: 'ロストアビス', en: 'Lost Abyss', code: 'S11'},
  {jp: 'ポケモンGO', en: 'Pokemon GO', code: 'S10b'},
  {jp: 'スペースジャグラー', en: 'Space Juggler', code: 'S10P'},
  {jp: 'タイムゲイザー', en: 'Time Gazer', code: 'S10D'},
  {jp: 'ダークファンタズマ', en: 'Dark Phantasma', code: 'S10a'},
  {jp: 'バトルリージョン', en: 'Battle Region', code: 'S9a'},
  {jp: 'スターバース', en: 'Star Birth', code: 'S9'},
  {jp: 'VMAXクライマックス', en: 'VMAX Climax', code: 'S8b'},
  {jp: '25thアニバーサリーコレクション', en: '25th Anniversary Collection', code: 'S8a', aliases: ['25th ANNIVERSARY COLLECTION']},
  {jp: 'フュージョンアーツ', en: 'Fusion Arts', code: 'S8'},
  {jp: '蒼空ストリーム', en: 'Blue Sky Stream', code: 'S7R'},
  {jp: '摩天パーフェクト', en: 'Skyscraping Perfection', code: 'S7D', aliases: ['Skyscraping Perfect']},
  {jp: 'イーブイヒーローズ', en: 'Eevee Heroes', code: 'S6a'},
  {jp: '漆黒のガイスト', en: 'Jet-Black Spirit', code: 'S6K', aliases: ['Jet Black Geist']},
  {jp: '白銀のランス', en: 'Silver Lance', code: 'S6H'},
  {jp: '双璧のファイター', en: 'Peerless Fighters', code: 'S5a', aliases: ['Matchless Fighter']},
  {jp: '連撃マスター', en: 'Rapid Strike Master', code: 'S5R'},
  {jp: '一撃マスター', en: 'Single Strike Master', code: 'S5I'},
  {jp: 'シャイニースターV', en: 'Shiny Star V', code: 'S4a'},
  {jp: '仰天のボルテッカー', en: 'Amazing Volt Tackle', code: 'S4'},
  {jp: '伝説の鼓動', en: 'Legendary Heartbeat', code: 'S3a'},
  {jp: 'ムゲンゾーン', en: 'Infinity Zone', code: 'S3', aliases: ['Darkness Ablaze']},
  {jp: '爆炎ウォーカー', en: 'Explosive Walker', code: 'S2a'},
  {jp: '反逆クラッシュ', en: 'Rebel Clash', code: 'S2'},
  {jp: 'VMAXライジング', en: 'VMAX Rising', code: 'S1a'},
  {jp: 'シールド', en: 'Shield', code: 'S1H'},
  {jp: 'ソード', en: 'Sword', code: 'S1W'},

  // 英語版セット (Sword & Shield Series - EN codes)
  {jp: null, en: 'Sword & Shield', code: 'SSH', aliases: ['SWSH']},
  {jp: null, en: 'Rebel Clash', code: 'RCL'},
  {jp: null, en: 'Darkness Ablaze', code: 'DAA'},
  {jp: null, en: "Champion's Path", code: 'CPA'},
  {jp: null, en: 'Vivid Voltage', code: 'VIV'},
  {jp: null, en: 'Shining Fates', code: 'SHF'},
  {jp: null, en: 'Battle Styles', code: 'BST'},
  {jp: null, en: 'Chilling Reign', code: 'CRE'},
  {jp: null, en: 'Evolving Skies', code: 'EVS'},
  {jp: null, en: 'Celebrations', code: 'CEL', aliases: ['25th Anniversary']},
  {jp: null, en: 'Fusion Strike', code: 'FST'},
  {jp: null, en: 'Brilliant Stars', code: 'BRS'},
  {jp: null, en: 'Astral Radiance', code: 'ASR'},
  {jp: null, en: 'Pokemon GO', code: 'PGO'},
  {jp: null, en: 'Lost Origin', code: 'LOR'},
  {jp: null, en: 'Silver Tempest', code: 'SIT'},
  {jp: null, en: 'Crown Zenith', code: 'CRZ'},

  // ============================================================
  // 2016-2019 (Sun & Moon era - Japanese)
  // ============================================================
  {jp: 'タッグオールスターズ', en: 'Tag All Stars', code: 'SM12a'},
  {jp: 'オルタージェネシス', en: 'Alter Genesis', code: 'SM12'},
  {jp: 'ドリームリーグ', en: 'Dream League', code: 'SM11b'},
  {jp: 'リミックスバウト', en: 'Remix Bout', code: 'SM11a'},
  {jp: 'ミラクルツイン', en: 'Miracle Twin', code: 'SM11'},
  {jp: 'ダブルブレイズ', en: 'Double Blaze', code: 'SM10'},
  {jp: 'フルメタルウォール', en: 'Full Metal Wall', code: 'SM9b'},
  {jp: 'ナイトユニゾン', en: 'Night Unison', code: 'SM9a'},
  {jp: 'タッグボルト', en: 'Tag Bolt', code: 'SM9'},
  {jp: 'GXウルトラシャイニー', en: 'GX Ultra Shiny', code: 'SM8b'},
  {jp: 'ダークオーダー', en: 'Dark Order', code: 'SM8a'},
  {jp: '超爆インパクト', en: 'Super-Burst Impact', code: 'SM8'},
  {jp: 'フェアリーライズ', en: 'Fairy Rise', code: 'SM7b'},
  {jp: '迅雷スパーク', en: 'Thunderclap Spark', code: 'SM7a'},
  {jp: '裂空のカリスマ', en: 'Sky-Splitting Charisma', code: 'SM7', aliases: ['Charisma of the Wrecked Sky']},
  {jp: 'ドラゴンストーム', en: 'Dragon Storm', code: 'SM6a'},
  {jp: 'チャンピオンロード', en: 'Champion Road', code: 'SM6b'},
  {jp: '禁断の光', en: 'Forbidden Light', code: 'SM6'},
  {jp: 'ウルトラフォース', en: 'Ultra Force', code: 'SM5+'},
  {jp: 'ウルトラムーン', en: 'Ultra Moon', code: 'SM5M'},
  {jp: 'ウルトラサン', en: 'Ultra Sun', code: 'SM5S'},
  {jp: 'GXバトルブースト', en: 'GX Battle Boost', code: 'SM4+'},
  {jp: '覚醒の勇者', en: 'Awakened Heroes', code: 'SM4S'},
  {jp: '超次元の暴獣', en: 'Ultradimensional Beasts', code: 'SM4A'},
  {jp: 'ひかる伝説', en: 'Shining Legends', code: 'SM3+'},
  {jp: '闘う虹を見たか', en: 'To Have Seen the Battle Rainbow', code: 'SM3H'},
  {jp: '光を喰らう闇', en: 'Darkness that Consumes Light', code: 'SM3N'},
  {jp: '新たなる試練の向こう', en: 'Facing a New Trial', code: 'SM2+'},
  {jp: 'アローラの月光', en: 'Alolan Moonlight', code: 'SM2L'},
  {jp: 'キミを待つ島々', en: 'Islands Await You', code: 'SM2K'},
  {jp: 'コレクションサン', en: 'Collection Sun', code: 'SM1S'},
  {jp: 'コレクションムーン', en: 'Collection Moon', code: 'SM1M'},
  {jp: 'サン&ムーン', en: 'Sun & Moon', code: 'SM1'},

  // 英語版セット (Sun & Moon Series - EN codes)
  {jp: null, en: 'Sun & Moon', code: 'SUM'},
  {jp: null, en: 'Guardians Rising', code: 'GRI'},
  {jp: null, en: 'Burning Shadows', code: 'BUS'},
  {jp: null, en: 'Crimson Invasion', code: 'CIN'},
  {jp: null, en: 'Ultra Prism', code: 'UPR'},
  {jp: null, en: 'Forbidden Light', code: 'FLI'},
  {jp: null, en: 'Celestial Storm', code: 'CES'},
  {jp: null, en: 'Lost Thunder', code: 'LOT'},
  {jp: null, en: 'Team Up', code: 'TEU'},
  {jp: null, en: 'Unbroken Bonds', code: 'UNB'},
  {jp: null, en: 'Unified Minds', code: 'UNM'},
  {jp: null, en: 'Cosmic Eclipse', code: 'CEC'},
  {jp: null, en: 'Hidden Fates', code: 'HIF'},
  {jp: null, en: 'Shining Legends', code: 'SLG'},

  // ============================================================
  // 2013-2016 (XY era - Japanese)
  // ============================================================
  {jp: 'コレクションX', en: 'Collection X', code: 'XY1'},
  {jp: 'コレクションY', en: 'Collection Y', code: 'XY1'},
  {jp: 'ワイルドブレイズ', en: 'Wild Blaze', code: 'XY2'},
  {jp: 'ライジングフィスト', en: 'Rising Fist', code: 'XY3'},
  {jp: 'ファントムゲート', en: 'Phantom Gate', code: 'XY4'},
  {jp: 'ガイアボルケーノ', en: 'Gaia Volcano', code: 'XY5'},
  {jp: 'タイダルストーム', en: 'Tidal Storm', code: 'XY5'},
  {jp: 'エメラルドブレイク', en: 'Emerald Break', code: 'XY6'},
  {jp: 'バンデットリング', en: 'Bandit Ring', code: 'XY7'},
  {jp: 'ブルーショック', en: 'Blue Shock', code: 'XY8'},
  {jp: 'レッドフラッシュ', en: 'Red Flash', code: 'XY8'},
  {jp: '破天の怒り', en: 'Rage of the Broken Heavens', code: 'XY9'},
  {jp: '目覚める超王', en: 'Awakening Psychic King', code: 'XY10'},
  {jp: 'ポケキュンコレクション', en: 'Pokekyun Collection', code: 'XY11', aliases: ['Generations']},

  // 英語版セット (XY Series - EN codes)
  {jp: null, en: 'XY', code: 'XY'},
  {jp: null, en: 'Flashfire', code: 'FLF'},
  {jp: null, en: 'Furious Fists', code: 'FFI'},
  {jp: null, en: 'Phantom Forces', code: 'PHF'},
  {jp: null, en: 'Primal Clash', code: 'PRC'},
  {jp: null, en: 'Roaring Skies', code: 'ROS'},
  {jp: null, en: 'Ancient Origins', code: 'AOR'},
  {jp: null, en: 'BREAKthrough', code: 'BKT'},
  {jp: null, en: 'BREAKpoint', code: 'BKP'},
  {jp: null, en: 'Fates Collide', code: 'FCO'},
  {jp: null, en: 'Steam Siege', code: 'STS'},
  {jp: null, en: 'Evolutions', code: 'EVO'},
  {jp: null, en: 'Generations', code: 'GEN'},

  // ============================================================
  // 2010-2013 (Black & White era - Japanese)
  // ============================================================
  {jp: 'ブラックコレクション', en: 'Black Collection', code: 'BW1'},
  {jp: 'ホワイトコレクション', en: 'White Collection', code: 'BW1'},
  {jp: 'レッドコレクション', en: 'Red Collection', code: 'BW2'},
  {jp: 'サイコドライブ', en: 'Psycho Drive', code: 'BW3'},
  {jp: 'ヘイルブリザード', en: 'Hail Blizzard', code: 'BW3'},
  {jp: 'ダークラッシュ', en: 'Dark Rush', code: 'BW4'},
  {jp: 'ドラゴンブレード', en: 'Dragon Blade', code: 'BW5'},
  {jp: 'ドラゴンブラスト', en: 'Dragon Blast', code: 'BW5'},
  {jp: 'フリーズボルト', en: 'Freeze Bolt', code: 'BW6'},
  {jp: 'コールドフレア', en: 'Cold Flare', code: 'BW6'},
  {jp: 'プラズマゲイル', en: 'Plasma Gale', code: 'BW7'},
  {jp: 'スパイラルフォース', en: 'Spiral Force', code: 'BW8'},
  {jp: 'サンダーナックル', en: 'Thunder Knuckle', code: 'BW8'},
  {jp: 'メガロキャノン', en: 'Megalo Cannon', code: 'BW9'},
  {jp: 'EXバトルブースト', en: 'EX Battle Boost', code: 'BW-EB'},
  {jp: 'シャイニーコレクション', en: 'Shiny Collection', code: 'BW-SC'},

  // 英語版セット (Black & White Series - EN codes)
  {jp: null, en: 'Black & White', code: 'BLW'},
  {jp: null, en: 'Emerging Powers', code: 'EPO'},
  {jp: null, en: 'Noble Victories', code: 'NVI'},
  {jp: null, en: 'Next Destinies', code: 'NXD'},
  {jp: null, en: 'Dark Explorers', code: 'DEX'},
  {jp: null, en: 'Dragons Exalted', code: 'DRX'},
  {jp: null, en: 'Boundaries Crossed', code: 'BCR'},
  {jp: null, en: 'Plasma Storm', code: 'PLS'},
  {jp: null, en: 'Plasma Freeze', code: 'PLF'},
  {jp: null, en: 'Plasma Blast', code: 'PLB'},
  {jp: null, en: 'Legendary Treasures', code: 'LTR'},

  // ============================================================
  // Classic/旧裏 era (Base Set - Neo series)
  // ============================================================
  {jp: '旧裏', en: 'Base Set', aliases: ['旧裏面']},
  {jp: 'ベースセット', en: 'Base Set', code: 'BS'},
  {jp: 'ポケモンジャングル', en: 'Pokemon Jungle', code: 'JU', aliases: ['ジャングル', 'Jungle']},
  {jp: '化石の秘密', en: 'Fossil', code: 'FO'},
  {jp: 'ロケット団', en: 'Team Rocket', code: 'TR'},
  {jp: 'ジムリーダー', en: 'Gym Heroes', code: 'G1', aliases: ['タマムシシティジム', 'ハナダシティジム']},
  {jp: 'ジムリーダー2', en: 'Gym Challenge', code: 'G2', aliases: ['カツラ', 'ジムチャレンジ']},
  {jp: 'ネオジェネシス', en: 'Neo Genesis', code: 'N1', aliases: ['Neo Genesis', '金、銀、新世界へ']},
  {jp: 'ネオディスカバリー', en: 'Neo Discovery', code: 'N2', aliases: ['Neo Discovery', '遺跡をこえて']},
  {jp: 'ネオレベレーション', en: 'Neo Revelation', code: 'N3', aliases: ['Neo Revelation', '覚醒する伝説']},
  {jp: 'ネオデスティニー', en: 'Neo Destiny', code: 'N4', aliases: ['Neo Destiny', '闇、そして光へ']},

  // ============================================================
  // e-Card / Legendary / HGSS / DP / Platinum eras
  // ============================================================
  {jp: 'ハートゴールドコレクション', en: 'HeartGold Collection', aliases: ['HGSS']},
  {jp: 'ソウルシルバーコレクション', en: 'SoulSilver Collection', aliases: ['HGSS']},
  {jp: 'ダイヤモンド&パール', en: 'Diamond & Pearl', aliases: ['DP']},
  {jp: 'プラチナ', en: 'Platinum', aliases: ['Pt']},
  {jp: 'eカード', en: 'e-Card', aliases: ['e-Card']},

  // ============================================================
  // Promo
  // ============================================================
  {jp: 'プロモ', en: 'Promo', aliases: ['プロモカード', 'S-P', 'SV-P', 'SM-P', 'BW-P', 'XY-P']}
];

var CARD_POKEMON_CHARACTERS = [
  // ========== 第1世代 (カントー / Kanto) ==========
  {jp: 'リザードン', en: 'Charizard', aliases: ['リザードンex', 'Charizard ex']},
  {jp: 'ピカチュウ', en: 'Pikachu', aliases: ['ピカチュウex', 'Pikachu ex']},
  {jp: 'ミュウツー', en: 'Mewtwo', aliases: ['ミュウツーex', 'Mewtwo ex']},
  {jp: 'ミュウ', en: 'Mew', aliases: ['ミュウex', 'Mew ex']},
  {jp: 'カメックス', en: 'Blastoise', aliases: ['カメックスex', 'Blastoise ex']},
  {jp: 'フシギバナ', en: 'Venusaur', aliases: ['フシギバナex', 'Venusaur ex']},
  {jp: 'ゲンガー', en: 'Gengar', aliases: ['ゲンガーex', 'Gengar ex']},
  {jp: 'ギャラドス', en: 'Gyarados', aliases: ['ギャラドスex', 'Gyarados ex']},
  {jp: 'ラプラス', en: 'Lapras', aliases: ['ラプラスex']},
  {jp: 'カイリュー', en: 'Dragonite', aliases: ['カイリューex', 'Dragonite ex']},
  {jp: 'プテラ', en: 'Aerodactyl'},
  {jp: 'カビゴン', en: 'Snorlax', aliases: ['カビゴンex']},
  {jp: 'ニドキング', en: 'Nidoking'},
  {jp: 'ピジョット', en: 'Pidgeot', aliases: ['ピジョットex', 'Pidgeot ex']},
  {jp: 'フーディン', en: 'Alakazam', aliases: ['フーディンex', 'Alakazam ex']},
  {jp: 'ウインディ', en: 'Arcanine', aliases: ['ウインディex']},
  {jp: 'リザード', en: 'Charmeleon'},
  {jp: 'ヒトカゲ', en: 'Charmander'},
  {jp: 'ゼニガメ', en: 'Squirtle'},
  {jp: 'フシギダネ', en: 'Bulbasaur'},
  {jp: 'サンダー', en: 'Zapdos'},
  {jp: 'ファイヤー', en: 'Moltres'},
  {jp: 'フリーザー', en: 'Articuno'},
  {jp: 'カイリキー', en: 'Machamp'},
  {jp: 'ライチュウ', en: 'Raichu'},
  // イーブイ進化系統
  {jp: 'イーブイ', en: 'Eevee', aliases: ['イーブイex', 'Eevee ex']},
  {jp: 'ブースター', en: 'Flareon'},
  {jp: 'シャワーズ', en: 'Vaporeon'},
  {jp: 'サンダース', en: 'Jolteon'},

  // ========== 第2世代 (ジョウト / Johto) ==========
  {jp: 'ホウオウ', en: 'Ho-Oh', aliases: ['Ho Oh', 'ホウオウex']},
  {jp: 'ルギア', en: 'Lugia', aliases: ['ルギアex', 'Lugia ex']},
  {jp: 'スイクン', en: 'Suicune', aliases: ['スイクンex']},
  {jp: 'ライコウ', en: 'Raikou'},
  {jp: 'エンテイ', en: 'Entei'},
  {jp: 'バンギラス', en: 'Tyranitar', aliases: ['バンギラスex', 'Tyranitar ex']},
  {jp: 'ハッサム', en: 'Scizor', aliases: ['ハッサムex']},
  {jp: 'デンリュウ', en: 'Ampharos'},
  {jp: 'ブラッキー', en: 'Umbreon', aliases: ['ブラッキーex', 'Umbreon ex']},
  {jp: 'エーフィ', en: 'Espeon', aliases: ['エーフィex', 'Espeon ex']},
  {jp: 'セレビィ', en: 'Celebi', aliases: ['セレビィex']},
  {jp: 'ヘラクロス', en: 'Heracross'},
  {jp: 'オーダイル', en: 'Feraligatr', aliases: ['オーダイルex']},
  {jp: 'バクフーン', en: 'Typhlosion', aliases: ['バクフーンex']},
  {jp: 'メガニウム', en: 'Meganium'},

  // ========== 第3世代 (ホウエン / Hoenn) ==========
  {jp: 'レックウザ', en: 'Rayquaza', aliases: ['レックウザex', 'Rayquaza ex']},
  {jp: 'グラードン', en: 'Groudon', aliases: ['グラードンex']},
  {jp: 'カイオーガ', en: 'Kyogre', aliases: ['カイオーガex']},
  {jp: 'ラティアス', en: 'Latias', aliases: ['ラティアスex']},
  {jp: 'ラティオス', en: 'Latios', aliases: ['ラティオスex']},
  {jp: 'ジラーチ', en: 'Jirachi'},
  {jp: 'デオキシス', en: 'Deoxys'},
  {jp: 'サーナイト', en: 'Gardevoir', aliases: ['サーナイトex', 'Gardevoir ex']},
  {jp: 'メタグロス', en: 'Metagross', aliases: ['メタグロスex']},
  {jp: 'ボーマンダ', en: 'Salamence'},
  {jp: 'アブソル', en: 'Absol', aliases: ['アブソルex']},
  {jp: 'ミロカロス', en: 'Milotic'},
  {jp: 'ゲッコウガ', en: 'Greninja', aliases: ['ゲッコウガex', 'Greninja ex']},

  // ========== 第4世代 (シンオウ / Sinnoh) ==========
  {jp: 'ディアルガ', en: 'Dialga', aliases: ['ディアルガex']},
  {jp: 'パルキア', en: 'Palkia', aliases: ['パルキアex']},
  {jp: 'ギラティナ', en: 'Giratina', aliases: ['ギラティナex', 'Giratina ex']},
  {jp: 'アルセウス', en: 'Arceus', aliases: ['アルセウスex']},
  {jp: 'ダークライ', en: 'Darkrai', aliases: ['ダークライex']},
  {jp: 'ルカリオ', en: 'Lucario', aliases: ['ルカリオex', 'Lucario ex']},
  {jp: 'ガブリアス', en: 'Garchomp', aliases: ['ガブリアスex']},
  {jp: 'クレセリア', en: 'Cresselia'},
  {jp: 'シェイミ', en: 'Shaymin'},
  {jp: 'マナフィ', en: 'Manaphy'},
  {jp: 'トゲキッス', en: 'Togekiss', aliases: ['トゲキッスex']},
  {jp: 'エルレイド', en: 'Gallade', aliases: ['エルレイドex']},
  {jp: 'ニンフィア', en: 'Sylveon', aliases: ['ニンフィアex', 'Sylveon ex']},
  {jp: 'グレイシア', en: 'Glaceon', aliases: ['グレイシアex']},
  {jp: 'リーフィア', en: 'Leafeon', aliases: ['リーフィアex']},

  // ========== 第5世代 (イッシュ / Unova) ==========
  {jp: 'レシラム', en: 'Reshiram', aliases: ['レシラムex']},
  {jp: 'ゼクロム', en: 'Zekrom', aliases: ['ゼクロムex']},
  {jp: 'キュレム', en: 'Kyurem', aliases: ['キュレムex']},
  {jp: 'ゲノセクト', en: 'Genesect'},
  {jp: 'ビクティニ', en: 'Victini'},
  {jp: 'ゾロアーク', en: 'Zoroark'},
  {jp: 'シャンデラ', en: 'Chandelure'},
  {jp: 'サザンドラ', en: 'Hydreigon'},
  {jp: 'メロエッタ', en: 'Meloetta'},
  {jp: 'ケルディオ', en: 'Keldeo'},

  // ========== 第6世代 (カロス / Kalos) ==========
  {jp: 'ゼルネアス', en: 'Xerneas', aliases: ['ゼルネアスex']},
  {jp: 'イベルタル', en: 'Yveltal', aliases: ['イベルタルex']},
  {jp: 'ジガルデ', en: 'Zygarde'},
  {jp: 'ディアンシー', en: 'Diancie'},
  {jp: 'ボルケニオン', en: 'Volcanion'},

  // ========== 第7世代 (アローラ / Alola) ==========
  {jp: 'ソルガレオ', en: 'Solgaleo', aliases: ['ソルガレオex']},
  {jp: 'ルナアーラ', en: 'Lunala', aliases: ['ルナアーラex']},
  {jp: 'ネクロズマ', en: 'Necrozma', aliases: ['ネクロズマex']},
  {jp: 'ミミッキュ', en: 'Mimikyu', aliases: ['ミミッキュex', 'Mimikyu ex']},
  {jp: 'マーシャドー', en: 'Marshadow'},
  {jp: 'ゼラオラ', en: 'Zeraora'},
  {jp: 'ウツロイド', en: 'Nihilego'},
  {jp: 'フェローチェ', en: 'Pheromosa'},
  {jp: 'デンジュモク', en: 'Xurkitree'},
  {jp: 'テッカグヤ', en: 'Celesteela'},
  {jp: 'カミツルギ', en: 'Kartana'},
  {jp: 'アクジキング', en: 'Guzzlord'},
  {jp: 'ベベノム', en: 'Poipole'},
  {jp: 'アーゴヨン', en: 'Naganadel'},

  // ========== 第8世代 (ガラル / Galar) ==========
  {jp: 'ザシアン', en: 'Zacian', aliases: ['ザシアンex', 'Zacian ex']},
  {jp: 'ザマゼンタ', en: 'Zamazenta', aliases: ['ザマゼンタex']},
  {jp: 'ムゲンダイナ', en: 'Eternatus', aliases: ['ムゲンダイナex']},
  {jp: 'ウーラオス', en: 'Urshifu', aliases: ['ウーラオスex', 'れんげきウーラオス', 'いちげきウーラオス']},
  {jp: 'バドレックス', en: 'Calyrex', aliases: ['バドレックスex', 'こくばバドレックス', 'はくばバドレックス']},
  {jp: 'レジエレキ', en: 'Regieleki'},
  {jp: 'レジドラゴ', en: 'Regidrago', aliases: ['レジドラゴex']},

  // ========== 第9世代 (パルデア / Paldea) ==========
  {jp: 'コライドン', en: 'Koraidon', aliases: ['コライドンex', 'Koraidon ex']},
  {jp: 'ミライドン', en: 'Miraidon', aliases: ['ミライドンex', 'Miraidon ex']},
  {jp: 'テラパゴス', en: 'Terapagos', aliases: ['テラパゴスex', 'Terapagos ex']},
  {jp: 'オーガポン', en: 'Ogerpon', aliases: ['オーガポンex', 'Ogerpon ex']},
  {jp: 'テツノカイナ', en: 'Iron Hands', aliases: ['テツノカイナex']},
  {jp: 'テツノブジン', en: 'Iron Valiant', aliases: ['テツノブジンex']},
  {jp: 'トドロクツキ', en: 'Roaring Moon', aliases: ['トドロクツキex']},
  {jp: 'タケルライコ', en: 'Raging Bolt', aliases: ['タケルライコex']},
  {jp: 'リキキリン', en: 'Farigiraf'},
  {jp: 'パオジアン', en: 'Chien-Pao', aliases: ['パオジアンex']},
  {jp: 'ディンルー', en: 'Ting-Lu'},
  {jp: 'チオンジェン', en: 'Wo-Chien'},
  {jp: 'イイネイヌ', en: 'Okidogi'},
  {jp: 'マシマシラ', en: 'Munkidori'},
  {jp: 'キチキギス', en: 'Fezandipiti'},
  {jp: 'ウネルミナモ', en: 'Walking Wake'},
  {jp: 'テツノイサハ', en: 'Iron Leaves'},
  {jp: 'ドドゲザン', en: 'Kingambit', aliases: ['ドドゲザンex']}
];

var CARD_POKEMON_TRAINERS = [
  // ========== ゲーム主人公 / Protagonists ==========
  {jp: 'レッド', en: 'Red'},
  {jp: 'リーフ', en: 'Leaf'},
  {jp: 'コトネ', en: 'Lyra'},
  {jp: 'ヒカリ', en: 'Dawn'},
  {jp: 'メイ', en: 'Rosa'},
  {jp: 'トウコ', en: 'Hilda'},
  {jp: 'ユウリ', en: 'Gloria'},
  {jp: 'マサル', en: 'Victor'},

  // ========== チャンピオン / Champions ==========
  {jp: 'シロナ', en: 'Cynthia', aliases: ['シロナSR']},
  {jp: 'ダンデ', en: 'Leon'},
  {jp: 'ワタル', en: 'Lance'},
  {jp: 'ダイゴ', en: 'Steven', aliases: ['Steven Stone']},
  {jp: 'アイリス', en: 'Iris'},
  {jp: 'カルネ', en: 'Diantha'},

  // ========== 人気トレーナー (SAR/SR高額) ==========
  {jp: 'リーリエ', en: 'Lillie', aliases: ['リーリエSR', 'Lillie SR']},
  {jp: 'マリィ', en: 'Marnie', aliases: ['マリィSR', 'Marnie SR']},
  {jp: 'ナンジャモ', en: 'Iono', aliases: ['ナンジャモSAR', 'Iono SAR']},
  {jp: 'セレナ', en: 'Serena', aliases: ['セレナSR']},
  {jp: 'アセロラ', en: 'Acerola'},
  {jp: 'ルチア', en: 'Lisia'},
  {jp: 'カトレア', en: 'Caitlin'},
  {jp: 'フウロ', en: 'Skyla'},
  {jp: 'カミツレ', en: 'Elesa'},
  {jp: 'カスミ', en: 'Misty'},
  {jp: 'エリカ', en: 'Erika'},
  {jp: 'メロン', en: 'Melony'},
  {jp: 'ルリナ', en: 'Nessa'},
  {jp: 'サイトウ', en: 'Bea'},
  {jp: 'ソニア', en: 'Sonia'},
  {jp: 'マオ', en: 'Mallow'},
  {jp: 'スイレン', en: 'Lana'},
  {jp: 'リーリエの全力', en: "Lillie's Full Force", aliases: ['がんばリーリエ']},
  {jp: 'シャクヤ', en: 'Peonia'},
  {jp: 'ヒガナ', en: 'Zinnia'},
  {jp: 'カリン', en: 'Karen'},

  // ========== SV (パルデア) トレーナー ==========
  {jp: 'ネモ', en: 'Nemona', aliases: ['ネモSR']},
  {jp: 'ボタン', en: 'Penny', aliases: ['ボタンSR']},
  {jp: 'ペパー', en: 'Arven', aliases: ['ペパーSR']},
  {jp: 'オモダカ', en: 'Geeta'},
  {jp: 'チリ', en: 'Rika'},
  {jp: 'ポピー', en: 'Poppy'},
  {jp: 'アオキ', en: 'Larry'},
  {jp: 'ハッサク', en: 'Hassel'},
  {jp: 'グルーシャ', en: 'Grusha', aliases: ['グルーシャSR']},
  {jp: 'カエデ', en: 'Katy'},
  {jp: 'コルサ', en: 'Brassius'},
  {jp: 'リップ', en: 'Tulip', aliases: ['リップSR']},
  {jp: 'ミモザ', en: 'Miriam', aliases: ['ミモザSR']},
  {jp: 'キハダ', en: 'Jacq'},
  {jp: 'スグリ', en: 'Kieran'},
  {jp: 'ゼイユ', en: 'Carmine'},
  {jp: 'ブライア', en: 'Briar'},
  {jp: 'ラケル', en: 'Lacey', aliases: ['ラケルSR']},
  {jp: 'タロ', en: 'Drayton'},
  {jp: 'ゼロ', en: 'Perrin'},

  // ========== エヌ・博士系 ==========
  {jp: 'エヌ', en: 'N', aliases: ['ポケカ N', 'N SR']},
  {jp: '博士の研究', en: "Professor's Research"},
  {jp: 'オーキド博士', en: 'Professor Oak'},
  {jp: 'ナナカマド博士', en: 'Professor Rowan'},
  {jp: 'プラターヌ博士', en: 'Professor Sycamore'},
  {jp: 'ククイ博士', en: 'Professor Kukui'},

  // ========== ジムリーダー (過去作) ==========
  {jp: 'タケシ', en: 'Brock'},
  {jp: 'ナタネ', en: 'Gardenia'},
  {jp: 'デンジ', en: 'Volkner'},
  {jp: 'アカネ', en: 'Whitney'},
  {jp: 'ミカン', en: 'Jasmine'},
  {jp: 'ヤナギ', en: 'Pryce'},

  // ========== ロケット団・悪役系 ==========
  {jp: 'ルザミーネ', en: 'Lusamine'},
  {jp: 'グズマ', en: 'Guzma'},
  {jp: 'サカキ', en: 'Giovanni'},

  // ========== 汎用サポートカード ==========
  {jp: 'ボスの指令', en: "Boss's Orders", aliases: ['Boss Orders']},
  {jp: 'ジャッジマン', en: 'Judge'},
  {jp: 'ツツジ', en: 'Roxanne'},
  {jp: 'オカルトマニア', en: 'Hex Maniac'}
];

// ==============================
// Magic: The Gathering マスター辞書
// ==============================

var CARD_MTG_SETS = [
  // 2026
  {jp: 'ローウィンの昏明', en: 'Lorwyn Eclipsed', aliases: ['Lorwyn']},
  {jp: 'ストリクスヘイヴンの秘密', en: 'Secrets of Strixhaven'},
  // 2025
  {jp: 'エッジオブエターニティーズ', en: 'Edge of Eternities'},
  {jp: 'ファイナルファンタジー', en: 'MTG FINAL FANTASY', aliases: ['FINAL FANTASY', 'FF']},
  {jp: 'タルキールドラゴンストーム', en: 'Tarkir Dragonstorm', aliases: ['タルキール', 'Tarkir']},
  {jp: 'エーテルドリフト', en: 'Aetherdrift'},
  {jp: 'イニストラードリマスター', en: 'Innistrad Remastered', aliases: ['イニストラード']},
  // 2024
  {jp: 'ファウンデーションズ', en: 'Foundations'},
  {jp: 'ダスクモーン', en: 'Duskmourn House of Horror'},
  {jp: 'ブルームバロウ', en: 'Bloomburrow'},
  {jp: 'モダンホライゾン3', en: 'Modern Horizons 3'},
  {jp: 'モダンホライゾン2', en: 'Modern Horizons 2'},
  {jp: 'サンダージャンクション', en: 'Outlaws of Thunder Junction'},
  {jp: 'カルロフ邸殺人事件', en: 'Murders at Karlov Manor'},
  {jp: 'ファイレクシア完全なる統一', en: 'Phyrexia All Will Be One'},
  {jp: '機械兵団の進軍', en: 'March of the Machine'},
  {jp: '指輪物語', en: 'Lord of the Rings Tales of Middle earth'},
  {jp: 'エルドレインの森', en: 'Wilds of Eldraine'},
  {jp: '神河輝ける世界', en: 'Kamigawa Neon Dynasty', aliases: ['神河']},
  {jp: '団結のドミナリア', en: 'Dominaria United'},
  {jp: '兄弟たちの戦争', en: 'The Brothers War'},
  {jp: 'イニストラード真夜中の狩り', en: 'Innistrad Midnight Hunt'},
  {jp: 'カルドハイム', en: 'Kaldheim'},
  {jp: 'ストリクスヘイヴン', en: 'Strixhaven School of Mages', aliases: ['ストリクトヘイブン', 'ストリクスヘイブン']},
  {jp: 'ゼンディカーの夜明け', en: 'Zendikar Rising'},
  {jp: '灯争大戦', en: 'War of the Spark'},
  {jp: 'ラヴニカの献身', en: 'Ravnica Allegiance'},
  {jp: 'ドミナリア', en: 'Dominaria'},
  {jp: 'イクサラン', en: 'Ixalan'},
  {jp: 'アモンケット', en: 'Amonkhet'},
  {jp: 'カラデシュ', en: 'Kaladesh'},
  {jp: 'ダブルマスターズ', en: 'Double Masters'},
  {jp: 'アルティメットマスターズ', en: 'Ultimate Masters'},
  {jp: 'モダンマスターズ', en: 'Modern Masters'},
  {jp: 'アルファ', en: 'Alpha'},
  {jp: 'ベータ', en: 'Beta'}
];

var CARD_MTG_CARDS = [
  {jp: '石鍛冶の神秘家', en: 'Stoneforge Mystic', aliases: ['石鍛治の神秘家']},
  {jp: '黙示録シェオルドレッド', en: 'Sheoldred the Apocalypse'},
  {jp: '敏捷なこそ泥ラガバン', en: 'Ragavan Nimble Pilferer', aliases: ['敏捷なこそ泥']},
  {jp: '一つの指輪', en: 'The One Ring'},
  {jp: '鏡割りの寓話', en: 'Fable of the Mirror Breaker'},
  {jp: 'タルモゴイフ', en: 'Tarmogoyf'},
  {jp: '思考囲い', en: 'Thoughtseize'},
  {jp: '否定の力', en: 'Force of Negation'},
  {jp: '意志の力', en: 'Force of Will'},
  {jp: '時を解す者テフェリー', en: 'Teferi Time Raveler'},
  {jp: '創造の座オムナス', en: 'Omnath Locus of Creation'},
  {jp: '悲嘆', en: 'Grief'},
  {jp: '激情', en: 'Fury'},
  {jp: '孤独', en: 'Solitude'},
  {jp: '忍耐', en: 'Endurance'},
  {jp: '稲妻のらせん', en: 'Lightning Helix', aliases: ['稲妻の螺旋']},
  {jp: '現実チップ', en: 'Reality Chip', aliases: ['リアリティチップ']},
  {jp: '致命的な一押し', en: 'Fatal Push'},
  {jp: '虹色の終焉', en: 'Prismatic Ending'},
  {jp: 'レンと六番', en: 'Wrenn and Six'},
  {jp: 'オークの弓使い', en: 'Orcish Bowmasters'},
  {jp: '暗黒の儀式', en: 'Dark Ritual'},
  {jp: '対抗呪文', en: 'Counterspell'},
  {jp: '渦まく知識', en: 'Brainstorm'},
  {jp: '師範の占い独楽', en: 'Sensei Divining Top'},
  {jp: '秘儀の印鑑', en: 'Arcane Signet'},
  // Final Fantasy cards
  {jp: '威名のソルジャーセフィロス', en: 'Sephiroth Legendary Soldier', aliases: ['威名のソルジャー、セフィロス', 'セフィロス']},
  {jp: 'クラウドストライフ', en: 'Cloud Strife', aliases: ['クラウド・ストライフ', 'クラウド']},
  {jp: 'ティファロックハート', en: 'Tifa Lockhart', aliases: ['ティファ・ロックハート', 'ティファ']},
  {jp: 'エアリスゲインズブール', en: 'Aerith Gainsborough', aliases: ['エアリス・ゲインズブール', 'エアリス']},
  {jp: 'バレットウォレス', en: 'Barret Wallace', aliases: ['バレット・ウォレス', 'バレット']},
  {jp: 'レッドXIII', en: 'Red XIII'},
  {jp: 'ユフィキサラギ', en: 'Yuffie Kisaragi', aliases: ['ユフィ・キサラギ', 'ユフィ']},
  {jp: 'ヴィンセントヴァレンタイン', en: 'Vincent Valentine', aliases: ['ヴィンセント・ヴァレンタイン']},
  {jp: 'シドハイウインド', en: 'Cid Highwind', aliases: ['シド・ハイウインド']},
  {jp: 'ケットシー', en: 'Cait Sith'},
  {jp: 'ザックスフェア', en: 'Zack Fair', aliases: ['ザックス・フェア', 'ザックス']}
];

var CARD_MTG_VARIANTS = [
  {jp: 'ボーダーレス', en: 'Borderless'},
  {jp: '拡張アート', en: 'Extended Art'},
  {jp: 'ショーケース', en: 'Showcase'},
  {jp: 'フォイル', en: 'Foil'},
  {jp: 'エッチングフォイル', en: 'Etched Foil'},
  {jp: 'レトロフレーム', en: 'Retro Frame', aliases: ['旧枠']}
];

// ==============================
// 遊戯王 マスター辞書
// ==============================

var CARD_YUGIOH_SETS = [
  // ============================================================
  // 2025-2026 Core Boosters
  // ============================================================
  {jp: 'カオスオリジンズ', en: 'Chaos Origins', code: 'CROG'},
  {jp: 'バーストプロトコル', en: 'Burst Protocol', code: 'BRPT'},
  {jp: 'ドゥームオブディメンションズ', en: 'Doom of Dimensions', code: 'DODD'},
  {jp: 'デュエリストアドバンス', en: 'Duelist Advance', code: 'DAAD'},
  {jp: 'アライアンスインサイト', en: 'Alliance Insight', code: 'AINT'},

  // ============================================================
  // 2024 Core Boosters
  // ============================================================
  {jp: 'シュプリームダークネス', en: 'Supreme Darkness', code: 'SUDK'},
  {jp: 'レイジオブジアビス', en: 'Rage of the Abyss', code: 'ROTA'},
  {jp: 'インフィニットフォビドゥン', en: 'The Infinite Forbidden', code: 'INFO', aliases: ['ジ・インフィニット・フォビドゥン']},
  {jp: 'レガシーオブデストラクション', en: 'Legacy of Destruction', code: 'LEDE'},

  // ============================================================
  // 2023 Core Boosters
  // ============================================================
  {jp: 'ファントムナイトメア', en: 'Phantom Nightmare', code: 'PHNI'},
  {jp: 'エイジオブオーバーロード', en: 'Age of Overlord', code: 'AGOV'},
  {jp: 'デュエリストネクサス', en: 'Duelist Nexus', code: 'DUNE'},
  {jp: 'サイバーストームアクセス', en: 'Cyberstorm Access', code: 'CYAC'},

  // ============================================================
  // 2022 Core Boosters
  // ============================================================
  {jp: 'フォトンハイパーノヴァ', en: 'Photon Hypernova', code: 'PHHY'},
  {jp: 'ダークウィングブラスト', en: 'Darkwing Blast', code: 'DABL'},
  {jp: 'パワーオブジエレメンツ', en: 'Power of the Elements', code: 'POTE'},
  {jp: 'ディメンションフォース', en: 'Dimension Force', code: 'DIFO'},

  // ============================================================
  // 2021 Core Boosters
  // ============================================================
  {jp: 'バトルオブカオス', en: 'Battle of Chaos', code: 'BACH'},
  {jp: 'バーストオブデスティニー', en: 'Burst of Destiny', code: 'BODE'},
  {jp: 'ドーンオブマジェスティ', en: 'Dawn of Majesty', code: 'DAMA'},
  {jp: 'ライトニングオーバードライブ', en: 'Lightning Overdrive', code: 'LIOV'},

  // ============================================================
  // 2020 Core Boosters
  // ============================================================
  {jp: 'ブレイジングボルテックス', en: 'Blazing Vortex', code: 'BLVO'},
  {jp: 'ファントムレイジ', en: 'Phantom Rage', code: 'PHRA'},
  {jp: 'ライズオブザデュエリスト', en: 'Rise of the Duelist', code: 'ROTD'},
  {jp: 'エターニティコード', en: 'Eternity Code', code: 'ETCO'},

  // ============================================================
  // 2018-2019 Core Boosters (人気セット)
  // ============================================================
  {jp: 'イグニッションアサルト', en: 'Ignition Assault', code: 'IGAS'},
  {jp: 'カオスインパクト', en: 'Chaos Impact', code: 'CHIM'},
  {jp: 'ライジングランペイジ', en: 'Rising Rampage', code: 'RIRA'},
  {jp: 'ダークネオストーム', en: 'Dark Neostorm', code: 'DANE'},
  {jp: 'サベージストライク', en: 'Savage Strike', code: 'SAST'},
  {jp: 'ソウルフュージョン', en: 'Soul Fusion', code: 'SOFU'},
  {jp: 'サイバネティックホライゾン', en: 'Cybernetic Horizon', code: 'CYHO'},
  {jp: 'フレイムズオブデストラクション', en: 'Flames of Destruction', code: 'FLOD'},

  // ============================================================
  // 特別パック/コレクション
  // ============================================================
  {jp: 'レアリティコレクション', en: 'Rarity Collection', aliases: ['RARITY COLLECTION', 'レアコレ']},
  {jp: 'レアリティコレクション25th', en: 'Rarity Collection Quarter Century Edition', aliases: ['レアコレ25th', 'RC04']},
  {jp: 'プリズマティックアートコレクション', en: 'Prismatic Art Collection', aliases: ['PAC', 'アートコレクション']},
  {jp: 'プリズマティックゴッドボックス', en: 'Prismatic God Box', aliases: ['GOD BOX']},
  {jp: 'プレミアムパック', en: 'Premium Pack', aliases: ['PREMIUM PACK']},
  {jp: 'レジェンダリーゴールドボックス', en: 'Legendary Gold Box'},
  {jp: 'ヒストリーアーカイブコレクション', en: 'History Archive Collection', aliases: ['HC01']},
  {jp: 'セレクション5', en: 'Selection 5', aliases: ['SE5']},
  {jp: 'セレクション10', en: 'Selection 10', aliases: ['SE10']},
  {jp: 'ワールドプレミアパック', en: 'World Premiere Pack', aliases: ['WPP']},

  // ============================================================
  // デュエリストパック/レジェンドデュエリスト
  // ============================================================
  {jp: 'レジェンドデュエリスト', en: 'Legendary Duelists'},
  {jp: 'デュエリストパック', en: 'Duelist Pack'},
  {jp: 'デュエリストパック深淵のデュエリスト編', en: 'Duelist Pack Duelists of the Abyss', aliases: ['DP28']},
  {jp: 'デュエリストパック輝光のデュエリスト編', en: 'Duelist Pack Duelists of Brilliance', aliases: ['DP29']},

  // ============================================================
  // ストラクチャーデッキ (人気の高いもの)
  // ============================================================
  {jp: 'ストラクチャーデッキ', en: 'Structure Deck', aliases: ['SD']},
  {jp: 'デッキビルドパック', en: 'Deck Build Pack', aliases: ['DBAD', 'DBGI']},

  // ============================================================
  // クラシック / 初期
  // ============================================================
  {jp: 'デュエルモンスターズ', en: 'Duel Monsters'},
  {jp: 'ビギナーズエディション', en: "Beginner's Edition"},
  {jp: 'エキスパートエディション', en: 'Expert Edition'},
  {jp: 'ゴールドシリーズ', en: 'Gold Series'},
  {jp: 'トーナメントパック', en: 'Tournament Pack'}
];

var CARD_YUGIOH_CHARACTERS = [
  // ========== アイコニックモンスター ==========
  {jp: 'ブルーアイズ', en: 'Blue-Eyes White Dragon', aliases: ['青眼の白龍', 'Blue-Eyes', '青眼']},
  {jp: '青眼の亜白龍', en: 'Blue-Eyes Alternative White Dragon', aliases: ['オルタナティブ', 'Alternative']},
  {jp: 'ブラックマジシャン', en: 'Dark Magician', aliases: ['ブラック・マジシャン']},
  {jp: 'ブラックマジシャンガール', en: 'Dark Magician Girl', aliases: ['ブラック・マジシャン・ガール', 'BMG']},
  {jp: 'レッドアイズ', en: 'Red-Eyes Black Dragon', aliases: ['真紅眼の黒竜', 'Red-Eyes']},
  {jp: 'エクゾディア', en: 'Exodia', aliases: ['封印されしエクゾディア', 'Exodia the Forbidden One']},
  {jp: '死者蘇生', en: 'Monster Reborn'},
  {jp: 'ハーピィ', en: 'Harpie', aliases: ['ハーピィ・レディ', 'Harpie Lady']},

  // ========== エクストラデッキ人気モンスター ==========
  {jp: 'スターダスト', en: 'Stardust Dragon', aliases: ['スターダスト・ドラゴン']},
  {jp: '天霆号アーゼウス', en: 'Divine Arsenal AA-ZEUS - Sky Thunder', aliases: ['アーゼウス', 'AA-ZEUS']},
  {jp: 'アクセスコードトーカー', en: 'Accesscode Talker'},
  {jp: 'I:Pマスカレーナ', en: 'I:P Masquerena', aliases: ['マスカレーナ']},
  {jp: 'トロイメアユニコーン', en: 'Knightmare Unicorn', aliases: ['トロイメア・ユニコーン']},
  {jp: 'クリスタルウィングシンクロドラゴン', en: 'Crystal Wing Synchro Dragon', aliases: ['クリスタルウィング']},
  {jp: 'ヴァレルソードドラゴン', en: 'Borrelsword Dragon', aliases: ['ヴァレルソード']},
  {jp: 'ヴァレルロードドラゴン', en: 'Borrload Dragon', aliases: ['ヴァレルロード']},
  {jp: '召命の神弓アポロウーサ', en: 'Apollousa Bow of the Goddess', aliases: ['アポロウーサ']},
  {jp: '超魔導竜騎士ドラグーンオブレッドアイズ', en: 'Red-Eyes Dark Dragoon', aliases: ['ドラグーン']},
  {jp: 'No.39 希望皇ホープ', en: 'Number 39 Utopia', aliases: ['ホープ', 'Utopia']},

  // ========== 汎用手札誘発（高額・必須カード） ==========
  {jp: '灰流うらら', en: 'Ash Blossom & Joyous Spring', aliases: ['うらら']},
  {jp: '増殖するG', en: 'Maxx C', aliases: ['増G', 'Maxx "C"']},
  {jp: '屋敷わらし', en: 'Ghost Belle & Haunted Mansion', aliases: ['わらし']},
  {jp: '浮幽さくら', en: 'Ghost Ogre & Snow Rabbit', aliases: ['さくら', 'うさぎ']},
  {jp: '儚無みずき', en: 'Ghost Sister & Spooky Dogwood', aliases: ['みずき']},
  {jp: 'エフェクトヴェーラー', en: 'Effect Veiler', aliases: ['エフェクト・ヴェーラー', 'ヴェーラー']},
  {jp: '無限泡影', en: 'Infinite Impermanence'},
  {jp: 'ドロール&ロックバード', en: 'Droll & Lock Bird', aliases: ['ドロール']},
  {jp: 'D.D.クロウ', en: 'D.D. Crow'},
  {jp: 'ニビル', en: 'Nibiru the Primal Being', aliases: ['原始生命態ニビル']},

  // ========== 汎用魔法・罠（高額カード） ==========
  {jp: '墓穴の指名者', en: 'Called by the Grave'},
  {jp: '抹殺の指名者', en: 'Crossout Designator'},
  {jp: '三戦の才', en: 'Triple Tactics Talent', aliases: ['三戦の才']},
  {jp: '三戦の号', en: 'Triple Tactics Thrust'},
  {jp: '金満で謙虚な壺', en: 'Pot of Prosperity', aliases: ['金謙']},
  {jp: '強欲で貪欲な壺', en: 'Pot of Desires'},
  {jp: '強欲で金満な壺', en: 'Pot of Extravagance', aliases: ['金満']},
  {jp: '強欲な壺', en: 'Pot of Greed'},
  {jp: 'ハーピィの羽根帚', en: "Harpie's Feather Duster", aliases: ['羽根帚']},
  {jp: 'サンダーボルト', en: 'Raigeki', aliases: ['ライトニングボルト']},
  {jp: '神の宣告', en: 'Solemn Judgment', aliases: ['宣告']},
  {jp: '神の警告', en: 'Solemn Warning'},
  {jp: '神の通告', en: 'Solemn Strike'},

  // ========== 人気テーマ（高額プリシク・シクが多い） ==========
  {jp: '閃刀姫', en: 'Sky Striker Ace', aliases: ['Sky Striker', 'せんとうき']},
  {jp: '閃刀姫レイ', en: 'Sky Striker Ace - Raye', aliases: ['閃刀姫−レイ', 'レイ']},
  {jp: '閃刀姫ロゼ', en: 'Sky Striker Ace - Roze', aliases: ['閃刀姫−ロゼ', 'ロゼ']},
  {jp: '閃刀姫シズク', en: 'Sky Striker Ace - Shizuku', aliases: ['閃刀姫−シズク', 'シズク']},
  {jp: 'Evil★Twinキスキル', en: 'Evil Twin Ki-sikil', aliases: ['キスキル', 'Evil Twin Ki-sikil']},
  {jp: 'Evil★Twinリィラ', en: 'Evil Twin Lil-la', aliases: ['リィラ', 'Evil Twin Lil-la']},
  {jp: '倶利伽羅天童', en: 'Kurikara Divincarnate', aliases: ['くりからてんどう']},
  {jp: 'ティアラメンツ', en: 'Tearlaments', aliases: ['ティアラ']},
  {jp: 'スプライト', en: 'Spright', aliases: ['スプライトエルフ']},
  {jp: 'クシャトリラ', en: 'Kashtira'},
  {jp: 'ラビュリンス', en: 'Labrynth', aliases: ['白銀の城のラビュリンス']},
  {jp: '白き森', en: 'White Forest', aliases: ['白き森のルシエラ', '白き森のアステーリャ']},
  {jp: 'デモンスミス', en: 'Fiendsmith'},
  {jp: '深淵の獣', en: 'Bystial', aliases: ['ビーステッド']},
  {jp: 'ふわんだりぃず', en: 'Floowandereeze'},
  {jp: 'ドラゴンメイド', en: 'Dragonmaid', aliases: ['ドラメ']},

  // ========== クラシック高額カード ==========
  {jp: '万物創世龍', en: 'Ten Thousand Dragon', aliases: ['10000']},
  {jp: 'ホーリーナイトドラゴン', en: 'Seiyaryu', aliases: ['ホーリー・ナイト・ドラゴン']},
  {jp: 'カオスソルジャー', en: 'Black Luster Soldier', aliases: ['カオス・ソルジャー']},
  {jp: 'カオスソルジャー開闢の使者', en: 'Black Luster Soldier Envoy of the Beginning', aliases: ['開闢']},
  {jp: '混沌帝龍', en: 'Chaos Emperor Dragon Envoy of the End', aliases: ['カオスエンペラードラゴン']},
  {jp: 'サイバードラゴン', en: 'Cyber Dragon', aliases: ['サイバー・ドラゴン']},
  {jp: 'E・HEROフレイムウィングマン', en: 'Elemental HERO Flame Wingman', aliases: ['フレイムウィングマン', 'フレウィン']},
  {jp: 'E・HEROネオス', en: 'Elemental HERO Neos', aliases: ['ネオス']}
];

// ==============================
// ワンピースカードゲーム マスター辞書
// ==============================

var CARD_ONEPIECE_SETS = [
  // 2026
  {jp: '神の島の冒険', en: 'Adventure on the Isle of Gods', code: 'OP15'},
  {jp: 'エッグヘッドクライシス', en: 'Egghead Crisis', code: 'EB05', aliases: ['EGGHEAD CRISIS']},
  // 2025
  {jp: '受け継がれる意志', en: 'Inherited Will', code: 'OP13'},
  {jp: '師弟の絆', en: 'Bond of Master and Student', code: 'OP12'},
  {jp: '神速の拳', en: 'Fists of Divine Speed', code: 'OP11'},
  // 2024
  {jp: '王族の血統', en: 'Royal Bloodlines', code: 'OP10'},
  {jp: '新たなる皇帝', en: 'Emperors in the New World', code: 'OP09'},
  {jp: '二つの伝説', en: 'Two Legends', code: 'OP08'},
  // 2023
  {jp: '500年後の未来', en: '500 Years in the Future', code: 'OP07'},
  {jp: '双璧の覇者', en: 'Wings of the Captain', code: 'OP06'},
  {jp: '新時代の主役', en: 'Awakening of the New Era', code: 'OP05'},
  {jp: '謀略の王国', en: 'Kingdoms of Intrigue', code: 'OP04'},
  // 2022
  {jp: '強大な敵', en: 'Pillars of Strength', code: 'OP03'},
  {jp: '頂上決戦', en: 'Paramount War', code: 'OP02'},
  {jp: 'ロマンスドーン', en: 'Romance Dawn', code: 'OP01'},
  // Extra Boosters
  {jp: 'メモリアルコレクション', en: 'Memorial Collection', code: 'EB01'},
  {jp: 'エクストラブースター', en: 'Extra Booster', aliases: ['EB']},
  // Starter Decks
  {jp: 'スタートデッキ', en: 'Starter Deck', aliases: ['ST']},
  // Promo
  {jp: 'プロモーションパック', en: 'Promotion Pack'}
];

var CARD_ONEPIECE_CHARACTERS = [
  {jp: 'ルフィ', en: 'Monkey D. Luffy', aliases: ['モンキー・D・ルフィ', 'Luffy']},
  {jp: 'ゾロ', en: 'Roronoa Zoro', aliases: ['ロロノア・ゾロ', 'Zoro']},
  {jp: 'ナミ', en: 'Nami'},
  {jp: 'ウソップ', en: 'Usopp'},
  {jp: 'サンジ', en: 'Sanji', aliases: ['ヴィンスモーク・サンジ']},
  {jp: 'チョッパー', en: 'Tony Tony Chopper', aliases: ['トニートニー・チョッパー', 'Chopper']},
  {jp: 'ロビン', en: 'Nico Robin', aliases: ['ニコ・ロビン', 'Robin']},
  {jp: 'フランキー', en: 'Franky'},
  {jp: 'ブルック', en: 'Brook'},
  {jp: 'ジンベエ', en: 'Jinbe', aliases: ['ジンベイ']},
  {jp: 'シャンクス', en: 'Shanks', aliases: ['赤髪のシャンクス']},
  {jp: 'エース', en: 'Portgas D. Ace', aliases: ['ポートガス・D・エース', 'Ace']},
  {jp: 'ヤマト', en: 'Yamato'},
  {jp: 'カイドウ', en: 'Kaido'},
  {jp: 'ビッグマム', en: 'Big Mom', aliases: ['ビッグ・マム', 'リンリン']},
  {jp: 'ロー', en: 'Trafalgar Law', aliases: ['トラファルガー・ロー', 'Law']},
  {jp: 'キッド', en: 'Eustass Kid', aliases: ['ユースタス・キッド', 'Kid']},
  {jp: 'ドフラミンゴ', en: 'Donquixote Doflamingo', aliases: ['ドンキホーテ・ドフラミンゴ']},
  {jp: 'クロコダイル', en: 'Crocodile'},
  {jp: '白ひげ', en: 'Whitebeard', aliases: ['エドワード・ニューゲート', 'Edward Newgate']},
  {jp: 'ボア・ハンコック', en: 'Boa Hancock', aliases: ['ハンコック']},
  {jp: 'サボ', en: 'Sabo'},
  {jp: 'ロジャー', en: 'Gol D. Roger', aliases: ['ゴール・D・ロジャー']},
  {jp: 'ニカ', en: 'Nika', aliases: ['ギア5', 'Gear 5']}
];

// ==============================
// ベースボールカード マスター辞書
// ==============================

var CARD_BASEBALL_BRANDS = [
  {jp: 'トップス', en: 'Topps', aliases: ['TOPPS']},
  {jp: 'バウマン', en: 'Bowman', aliases: ['BOWMAN', 'ボウマン']},
  {jp: 'パニーニ', en: 'Panini', aliases: ['PANINI']},
  {jp: 'アッパーデック', en: 'Upper Deck', aliases: ['UPPER DECK']},
  {jp: 'ドンラス', en: 'Donruss', aliases: ['DONRUSS']},
  {jp: 'BBM', en: 'BBM'},
  {jp: 'エポック', en: 'Epoch', aliases: ['EPOCH']},
  {jp: 'カルビー', en: 'Calbee', aliases: ['CALBEE']},
  {jp: 'バンダイ', en: 'Bandai', aliases: ['BANDAI']}
];

var CARD_BASEBALL_TYPES = [
  {jp: 'ルーキーカード', en: 'Rookie Card', aliases: ['RC', 'ルーキー']},
  {jp: 'オートグラフ', en: 'Autograph', aliases: ['Auto', 'サイン', '直筆サイン']},
  {jp: 'レリック', en: 'Relic', aliases: ['ジャージ', 'メモラビリア']},
  {jp: 'パッチ', en: 'Patch'},
  {jp: 'リフラクター', en: 'Refractor', aliases: ['Refractor']},
  {jp: 'パラレル', en: 'Parallel'},
  {jp: 'インサート', en: 'Insert'},
  {jp: 'ベース', en: 'Base'}
];

// 野球カード セット辞書
var CARD_BASEBALL_SETS = [
  // Topps
  {jp: 'トップスクローム', en: 'Topps Chrome', aliases: ['Topps Chrome', 'TOPPS CHROME']},
  {jp: 'トップスアップデート', en: 'Topps Update Series', aliases: ['Update Series', 'TOPPS UPDATE']},
  {jp: 'トップスシリーズ1', en: 'Topps Series 1', aliases: ['Series 1', 'Series One']},
  {jp: 'トップスシリーズ2', en: 'Topps Series 2', aliases: ['Series 2', 'Series Two']},
  {jp: 'トップスファイヤー', en: 'Topps Fire', aliases: ['TOPPS FIRE']},
  {jp: 'トップスナウ', en: 'Topps NOW', aliases: ['Topps NOW', 'TOPPS NOW']},
  {jp: 'トップスギャラリー', en: 'Topps Gallery', aliases: ['Gallery']},
  {jp: 'トップスヘリテージ', en: 'Topps Heritage', aliases: ['Heritage']},
  {jp: 'トップスアレン&ジンター', en: 'Topps Allen & Ginter', aliases: ['Allen & Ginter', 'Allen and Ginter']},
  {jp: 'トップスジャパンエディション', en: 'Topps Japan Edition', aliases: ['Japan Edition']},
  {jp: 'サクラ', en: 'Sakura', aliases: ['Sakura', 'さくら']},
  {jp: 'スターズオブジャパン', en: 'Stars of Japan', aliases: ['Stars of Japan']},
  {jp: 'オールトップスチーム', en: 'All-Topps Team', aliases: ['All-Topps Team']},
  // Bowman
  {jp: 'バウマンクローム', en: 'Bowman Chrome', aliases: ['Bowman Chrome', 'BOWMAN CHROME']},
  {jp: 'バウマンドラフト', en: 'Bowman Draft', aliases: ['Bowman Draft']},
  {jp: 'バウマンベスト', en: 'Bowman Best', aliases: ['Bowman Best']},
  {jp: 'ファーストバウマン', en: '1st Bowman', aliases: ['1st Bowman', '1st Edition']},
  // BBM
  {jp: 'BBMルーキーエディション', en: 'BBM Rookie Edition', aliases: ['BBM ROOKIE EDITION']},
  {jp: 'BBMプレミアム', en: 'BBM Premium', aliases: ['BBM Premium']},
  {jp: 'BBMヒストリックコレクション', en: 'BBM Historic Collection'},
  // Panini
  {jp: 'プリズム', en: 'Prizm', aliases: ['Prizm', 'PRIZM']},
  {jp: 'ドンラスオプティック', en: 'Donruss Optic', aliases: ['Optic', 'OPTIC']},
  {jp: 'セレクト', en: 'Select', aliases: ['Select', 'SELECT']}
];

// 野球選手辞書
var CARD_BASEBALL_PLAYERS = [
  // 日本人MLB選手
  {jp: '大谷翔平', en: 'Shohei Ohtani'},
  {jp: 'イチロー', en: 'Ichiro Suzuki'},
  {jp: 'ダルビッシュ有', en: 'Yu Darvish'},
  {jp: '田中将大', en: 'Masahiro Tanaka'},
  {jp: '松井秀喜', en: 'Hideki Matsui'},
  {jp: '野茂英雄', en: 'Hideo Nomo'},
  {jp: '鈴木誠也', en: 'Seiya Suzuki'},
  {jp: '吉田正尚', en: 'Masataka Yoshida'},
  {jp: '菊池雄星', en: 'Yusei Kikuchi'},
  {jp: '千賀滉大', en: 'Kodai Senga'},
  {jp: '前田健太', en: 'Kenta Maeda'},
  {jp: '山本由伸', en: 'Yoshinobu Yamamoto'},
  {jp: '今永昇太', en: 'Shota Imanaga'},
  {jp: '佐々木朗希', en: 'Roki Sasaki'},
  {jp: '藤浪晋太郎', en: 'Shintaro Fujinami'},
  {jp: '岩隈久志', en: 'Hisashi Iwakuma'},
  {jp: '黒田博樹', en: 'Hiroki Kuroda'},
  {jp: '上原浩治', en: 'Koji Uehara'},
  {jp: '城島健司', en: 'Kenji Johjima'},
  {jp: '松坂大輔', en: 'Daisuke Matsuzaka'},
  {jp: '田口壮', en: 'So Taguchi'},
  {jp: '長谷川滋利', en: 'Shigetoshi Hasegawa'},
  {jp: '伊良部秀輝', en: 'Hideki Irabu'},
  {jp: '新庄剛志', en: 'Tsuyoshi Shinjo'},
  {jp: '筒香嘉智', en: 'Yoshitomo Tsutsugo'},
  {jp: '秋山翔吾', en: 'Shogo Akiyama'},
  {jp: '有原航平', en: 'Kohei Arihara'},
  {jp: '藤井秀悟', en: 'Shugo Fujii'},

  // 現役MLBスター（英語名のみ）
  {jp: null, en: 'Mike Trout', aliases: ['マイク・トラウト', 'トラウト']},
  {jp: null, en: 'Aaron Judge', aliases: ['アーロン・ジャッジ', 'ジャッジ']},
  {jp: null, en: 'Mookie Betts', aliases: ['ムーキー・ベッツ', 'ベッツ']},
  {jp: null, en: 'Juan Soto', aliases: ['フアン・ソト', 'ソト']},
  {jp: 'ロナルド・アクーニャ', en: 'Ronald Acuna Jr', aliases: ['アクーニャ', 'Acuña', 'Ronald Acuña Jr']},
  {jp: null, en: 'Freddie Freeman', aliases: ['フレディ・フリーマン']},
  {jp: null, en: 'Bryce Harper', aliases: ['ブライス・ハーパー']},
  {jp: null, en: 'Manny Machado', aliases: ['マニー・マチャド']},
  {jp: 'フェルナンド・タティスJr', en: 'Fernando Tatis Jr', aliases: ['フェルナンド・タティス', 'タティス', 'Tatís Jr', 'Tatis Jr']},
  {jp: null, en: 'Trea Turner', aliases: ['トレイ・ターナー', 'ターナー']},
  {jp: null, en: 'Corey Seager', aliases: ['コーリー・シーガー', 'シーガー']},
  {jp: null, en: 'Marcus Semien', aliases: ['マーカス・セミエン']},
  {jp: null, en: 'Matt Olson', aliases: ['マット・オルソン']},
  {jp: null, en: 'Julio Rodriguez', aliases: ['フリオ・ロドリゲス']},
  {jp: null, en: 'Corbin Carroll', aliases: ['コービン・キャロル']},
  {jp: null, en: 'Gunnar Henderson', aliases: ['ガンナー・ヘンダーソン']},
  {jp: null, en: 'Jackson Chourio', aliases: ['ジャクソン・チュリオ']},
  {jp: null, en: 'Elly De La Cruz', aliases: ['エリー・デラクルーズ']},
  {jp: null, en: 'Pete Alonso', aliases: ['ピート・アロンソ']},
  {jp: null, en: 'Rafael Devers', aliases: ['ラファエル・デバース']},
  {jp: null, en: 'Vladimir Guerrero Jr', aliases: ['ブラディミール・ゲレーロ', 'ゲレーロ']},
  {jp: null, en: 'Bo Bichette', aliases: ['ボー・ビシェット']},
  {jp: null, en: 'Wander Franco', aliases: ['ワンダー・フランコ']},
  {jp: null, en: 'Bobby Witt Jr', aliases: ['ボビー・ウィット']},
  {jp: null, en: 'Adley Rutschman', aliases: ['アドリー・ラッチマン']},
  {jp: null, en: 'Spencer Strider', aliases: ['スペンサー・ストライダー']},
  {jp: null, en: 'Gerrit Cole', aliases: ['ゲリット・コール']},
  {jp: null, en: 'Jacob deGrom', aliases: ['ジェイコブ・デグロム']},
  {jp: null, en: 'Max Scherzer', aliases: ['マックス・シャーザー']},
  {jp: null, en: 'Justin Verlander', aliases: ['ジャスティン・バーランダー']},
  {jp: null, en: 'Sandy Alcantara', aliases: ['サンディ・アルカンタラ']},
  {jp: null, en: 'Shane McClanahan', aliases: ['シェーン・マクラナハン']},
  {jp: null, en: 'Framber Valdez', aliases: ['フランバー・バルデス']},
  {jp: null, en: 'Zack Wheeler', aliases: ['ザック・ウィーラー']},
  {jp: null, en: 'Corbin Burnes', aliases: ['コービン・バーンズ']},
  {jp: null, en: 'Dylan Cease', aliases: ['ディラン・シース']},
  {jp: null, en: 'Logan Webb', aliases: ['ローガン・ウェブ']},
  {jp: null, en: 'Ranger Suarez', aliases: ['レンジャー・スアレス']},
  {jp: null, en: 'Tyler Glasnow', aliases: ['タイラー・グラスノー']},
  {jp: null, en: 'Yoshinobu Yamamoto', aliases: ['山本由伸']},
  {jp: null, en: 'Paul Skenes', aliases: ['ポール・スキーネス']},
  {jp: null, en: 'Jackson Merrill', aliases: ['ジャクソン・メリル']},
  {jp: null, en: 'Wyatt Langford', aliases: ['ワイアット・ラングフォード']},
  {jp: null, en: 'Dylan Crews', aliases: ['ディラン・クルーズ']},
  {jp: null, en: 'Colton Cowser', aliases: ['コルトン・カウザー']},
  {jp: null, en: 'Pete Crow-Armstrong', aliases: ['ピート・クロウアームストロング']},
  {jp: null, en: 'Masyn Winn', aliases: ['メイソン・ウィン']},
  {jp: null, en: 'Evan Carter', aliases: ['エバン・カーター']},
  {jp: null, en: 'Jordan Walker', aliases: ['ジョーダン・ウォーカー']},
  {jp: null, en: 'Andrew Painter', aliases: ['アンドリュー・ペインター']},
  {jp: null, en: 'Kyle Tucker', aliases: ['カイル・タッカー']},
  {jp: null, en: 'Yordan Alvarez', aliases: ['ヨルダン・アルバレス']},
  {jp: null, en: 'Jose Ramirez', aliases: ['ホセ・ラミレス']},
  {jp: null, en: 'Austin Riley', aliases: ['オースティン・ライリー']},
  {jp: null, en: 'Marcell Ozuna', aliases: ['マルセル・オズナ']},
  {jp: null, en: 'Jose Altuve', aliases: ['ホセ・アルトゥーベ']},
  {jp: null, en: 'Alex Bregman', aliases: ['アレックス・ブレグマン']},
  {jp: null, en: 'Anthony Volpe', aliases: ['アンソニー・ボルピ']},
  {jp: null, en: 'Francisco Lindor', aliases: ['フランシスコ・リンドア']},
  {jp: null, en: 'Xander Bogaerts', aliases: ['ザンダー・ボガーツ']},
  {jp: null, en: 'Jazz Chisholm', aliases: ['ジャズ・チゾム']},
  {jp: null, en: 'CJ Abrams', aliases: ['CJ・エイブラムス', 'エイブラムス']},
  {jp: null, en: 'Ozzie Albies', aliases: ['オジー・アルビーズ']},
  {jp: null, en: 'Dansby Swanson', aliases: ['ダンズビー・スワンソン']},
  {jp: null, en: 'Michael Harris II', aliases: ['マイケル・ハリス']},

  // MLB殿堂入り/レジェンド
  {jp: null, en: 'Babe Ruth', aliases: ['ベーブ・ルース', 'ルース']},
  {jp: null, en: 'Mickey Mantle', aliases: ['ミッキー・マントル', 'マントル']},
  {jp: null, en: 'Willie Mays', aliases: ['ウィリー・メイズ']},
  {jp: null, en: 'Hank Aaron', aliases: ['ハンク・アーロン']},
  {jp: null, en: 'Ted Williams', aliases: ['テッド・ウィリアムズ']},
  {jp: null, en: 'Joe DiMaggio', aliases: ['ジョー・ディマジオ']},
  {jp: null, en: 'Jackie Robinson', aliases: ['ジャッキー・ロビンソン']},
  {jp: null, en: 'Roberto Clemente', aliases: ['ロベルト・クレメンテ']},
  {jp: null, en: 'Lou Gehrig', aliases: ['ルー・ゲーリッグ']},
  {jp: null, en: 'Ty Cobb', aliases: ['タイ・カッブ', 'タイ・コブ']},
  {jp: null, en: 'Stan Musial', aliases: ['スタン・ミュージアル']},
  {jp: null, en: 'Sandy Koufax', aliases: ['サンディ・コーファックス']},
  {jp: null, en: 'Bob Gibson', aliases: ['ボブ・ギブソン']},
  {jp: null, en: 'Nolan Ryan', aliases: ['ノーラン・ライアン']},
  {jp: null, en: 'Pete Rose', aliases: ['ピート・ローズ']},
  {jp: null, en: 'Johnny Bench', aliases: ['ジョニー・ベンチ']},
  {jp: null, en: 'Mike Schmidt', aliases: ['マイク・シュミット']},
  {jp: null, en: 'George Brett', aliases: ['ジョージ・ブレット']},
  {jp: null, en: 'Cal Ripken Jr', aliases: ['カル・リプケン']},
  {jp: null, en: 'Tony Gwynn', aliases: ['トニー・グウィン']},
  {jp: null, en: 'Ken Griffey Jr', aliases: ['ケン・グリフィー']},
  {jp: null, en: 'Derek Jeter', aliases: ['デレク・ジーター', 'ジーター']},
  {jp: null, en: 'Mariano Rivera', aliases: ['マリアノ・リベラ']},
  {jp: null, en: 'Barry Bonds', aliases: ['バリー・ボンズ']},
  {jp: null, en: 'Roger Clemens', aliases: ['ロジャー・クレメンス']},
  {jp: null, en: 'Sammy Sosa', aliases: ['サミー・ソーサ']},
  {jp: null, en: 'Mark McGwire', aliases: ['マーク・マグワイア']},
  {jp: null, en: 'Alex Rodriguez', aliases: ['アレックス・ロドリゲス']},
  {jp: null, en: 'Albert Pujols', aliases: ['アルバート・プホルス']},
  {jp: null, en: 'David Ortiz', aliases: ['デビッド・オルティーズ']},

  // NPB人気選手（BBM）
  {jp: '村上宗隆', en: 'Munetaka Murakami'},
  {jp: '山田哲人', en: 'Tetsuto Yamada'},
  {jp: '坂本勇人', en: 'Hayato Sakamoto'},
  {jp: '柳田悠岐', en: 'Yuki Yanagita'},
  {jp: '近藤健介', en: 'Kensuke Kondo'},
  {jp: '牧秀悟', en: 'Shugo Maki'},
  {jp: '宮城大弥', en: 'Hiroya Miyagi'},
  {jp: '戸郷翔征', en: 'Shosei Togo'},
  {jp: '佐藤輝明', en: 'Teruaki Sato'},
  {jp: '森下暢仁', en: 'Masato Morishita'},
  {jp: '吉川尚輝', en: 'Naoki Yoshikawa'},
  {jp: '岡本和真', en: 'Kazuma Okamoto'},
  {jp: '清宮幸太郎', en: 'Kotaro Kiyomiya'},
  {jp: '奥川恭伸', en: 'Yasunobu Okugawa'},
  {jp: '王貞治', en: 'Sadaharu Oh'},
  {jp: '長嶋茂雄', en: 'Shigeo Nagashima'},
  {jp: '落合博満', en: 'Hiromitsu Ochiai'},
  {jp: '野村克也', en: 'Katsuya Nomura'},
  {jp: '金田正一', en: 'Shoichi Kaneda'},
  {jp: '張本勲', en: 'Isao Harimoto'},
  {jp: '稲尾和久', en: 'Kazuhisa Inao'},
  {jp: '衣笠祥雄', en: 'Sachio Kinugasa'},
  // 追加選手（不足分を末尾に追加）
  {jp: 'ローレンス・バトラー', en: 'Lawrence Butler', aliases: ['バトラー']},
  {jp: 'ジェイコブ・ミシオロウスキー', en: 'Jacob Misiorowski', aliases: ['ミシオロウスキー']},
  {jp: 'チッパー・ジョーンズ', en: 'Chipper Jones', aliases: ['チッパー']},
  {jp: 'バスター・ポージー', en: 'Buster Posey', aliases: ['ポージー']},
  {jp: 'キム・ヘソン', en: 'Kim Heoson', aliases: ['ヘソン', 'Ha-Seong Kim', 'Ha Seong Kim']},
  {jp: 'ジェームズ・ウッド', en: 'James Wood', aliases: ['ウッド']},
  {jp: 'ルイスアンヘル・アクーニャ', en: 'Luisangel Acuna', aliases: ['Luisangel', 'Luisangel Acuña']},
  {jp: 'マイルズ・マイコラス', en: 'Miles Mikolas', aliases: ['マイコラス', 'Mikolas']},
  {jp: 'ニック・カーツ', en: 'Nick Kurtz', aliases: ['カーツ']}
];

// ==============================
// 大相撲カード マスター辞書
// ==============================

var CARD_SUMO_WRESTLERS = [
  {jp: '白鵬', en: 'Hakuho'},
  {jp: '照ノ富士', en: 'Terunofuji'},
  {jp: '千代の富士', en: 'Chiyonofuji'},
  {jp: '貴乃花', en: 'Takanohana'},
  {jp: '曙', en: 'Akebono'},
  {jp: '武蔵丸', en: 'Musashimaru'},
  {jp: '若乃花', en: 'Wakanohana'},
  {jp: '朝青龍', en: 'Asashoryu'},
  {jp: '稀勢の里', en: 'Kisenosato'},
  {jp: '大の里', en: 'Onosato'}
];

// ==============================
// 共通レアリティ辞書（全ゲーム統合）
// ==============================

var CARD_RARITY_POKEMON = [
  // === Scarlet & Violet時代 (2023-) ===
  {jp: 'スペシャルアートレア', en: 'Special Art Rare', code: 'SAR'},
  {jp: 'スペシャルイラストレア', en: 'Special Illustration Rare', code: 'SIR', aliases: ['SIR', 'Special Illustration']},
  {jp: 'イラストレア', en: 'Illustration Rare', code: 'IR'},
  {jp: 'ウルトラレア', en: 'Ultra Rare', code: 'UR'},
  {jp: 'ハイパーレア', en: 'Hyper Rare', code: 'HR', aliases: ['Gold Hyper Rare']},
  {jp: 'アートレア', en: 'Art Rare', code: 'AR'},
  {jp: 'スーパーレア', en: 'Super Rare', code: 'SR'},
  {jp: 'ACEスペック', en: 'ACE', code: 'ACE', aliases: ['ACE SPEC']},
  {jp: 'シークレットレア', en: 'Secret Rare', aliases: ['Secret Rare']},

  // === Sword & Shield時代 (2019-2022) ===
  {jp: 'トリプルレア', en: 'Triple Rare', code: 'RRR'},
  {jp: 'ダブルレア', en: 'Double Rare', code: 'RR'},
  {jp: 'キャラクタースーパーレア', en: 'Character Super Rare', code: 'CSR'},
  {jp: 'キャラクターレア', en: 'Character Rare', code: 'CHR'},
  {jp: 'シャイニースーパーレア', en: 'Shiny Super Rare', code: 'SSR'},
  {jp: 'かがやくポケモン', en: 'Radiant Rare', code: 'K', aliases: ['かがやく', 'Radiant']},
  {jp: 'トレーナーギャラリー', en: 'Trainer Gallery', code: 'TG'},

  // === カードタイプ兼レアリティ ===
  {jp: 'ex', en: 'Pokemon ex', code: 'ex', aliases: ['ポケモンex']},
  {jp: 'V', en: 'Pokemon V', code: 'V', aliases: ['ポケモンV']},
  {jp: 'VMAX', en: 'Pokemon VMAX', code: 'VMAX', aliases: ['ポケモンVMAX']},
  {jp: 'VSTAR', en: 'Pokemon VSTAR', code: 'VSTAR', aliases: ['ポケモンVSTAR']},
  {jp: 'V-UNION', en: 'Pokemon V-UNION', code: 'V-UNION'},
  {jp: 'GX', en: 'Pokemon GX', code: 'GX', aliases: ['ポケモンGX']},
  {jp: 'EX', en: 'Pokemon EX', code: 'EX', aliases: ['ポケモンEX']},
  {jp: 'メガ', en: 'Mega EX', code: 'M', aliases: ['Mega', 'メガシンカ']},
  {jp: 'BREAK', en: 'Pokemon BREAK', code: 'BREAK'},
  {jp: 'LV.X', en: 'Pokemon LV.X', code: 'LV.X', aliases: ['レベルX', 'Level X']},
  {jp: 'LEGEND', en: 'Pokemon LEGEND', code: 'LEGEND'},

  // === Sun & Moon時代 ===
  {jp: 'プリズムスター', en: 'Prism Star', code: 'PS'},
  {jp: 'レインボーレア', en: 'Rainbow Rare', aliases: ['Rainbow']},

  // === 英語版・eBay流通表記 ===
  {jp: 'フルアート', en: 'Full Art', code: 'FA', aliases: ['Full Art']},
  {jp: 'オルタネートアート', en: 'Alternate Art', aliases: ['Alt Art', 'AA']},
  {jp: 'ゴールドレア', en: 'Gold Rare', aliases: ['Gold Secret Rare', 'Gold']},
  {jp: 'シャイニーレア', en: 'Shiny Rare', aliases: ['Shiny']},
  {jp: 'クラウンレア', en: 'Crown Rare', aliases: ['Crown']},

  // === 旧裏・クラシック時代 ===
  {jp: '1stエディション', en: '1st Edition', aliases: ['First Edition', '初版']},
  {jp: 'シャドウレス', en: 'Shadowless'},
  {jp: 'ホロ', en: 'Holo Rare', aliases: ['Holo', 'Holofoil', 'Holographic']},
  {jp: 'リバースホロ', en: 'Reverse Holo', aliases: ['Reverse Foil', 'Reverse Holographic']},

  // === 基本レアリティ ===
  {jp: 'レア', en: 'Rare', code: 'R'},
  {jp: 'アンコモン', en: 'Uncommon', code: 'U'},
  {jp: 'コモン', en: 'Common', code: 'C'},
  {jp: 'プロモ', en: 'Promo', aliases: ['PROMO', 'プロモカード']}
];

var CARD_RARITY_YUGIOH = [
  // === 最高レアリティ（高額順） ===
  {jp: 'スターライトレア', en: 'Starlight Rare', aliases: ['Starlight', 'スタレア', 'STRL']},
  {jp: 'プリズマティックシークレットレア', en: 'Prismatic Secret Rare', aliases: ['プリシク', 'プリズマ', 'Prismatic Secret']},
  {jp: '25thシークレットレア', en: 'Quarter Century Secret Rare', aliases: ['25thシク', 'QCSE', 'Quarter Century Secret']},
  {jp: '20thシークレットレア', en: '20th Secret Rare', aliases: ['20thシク', '20th Secret']},
  {jp: 'ゴーストレア', en: 'Ghost Rare', aliases: ['ゴスレア', 'Ghost']},
  {jp: 'アルティメットレア', en: 'Ultimate Rare', aliases: ['レリーフ', 'レリーフレア', 'Ultimate']},
  {jp: 'コレクターズレア', en: "Collector's Rare", aliases: ['コレレア', "Collector's"]},
  {jp: 'エクストラシークレットレア', en: 'Extra Secret Rare', aliases: ['エクシク', 'Extra Secret']},
  {jp: 'ホログラフィックレア', en: 'Holographic Rare', aliases: ['ホロ', 'ホロレア', 'Holographic']},

  // === 標準レアリティ ===
  {jp: 'シークレットレア', en: 'Secret Rare', aliases: ['シク', 'Secret']},
  {jp: 'ウルトラレア', en: 'Ultra Rare', aliases: ['ウルレア', 'Ultra']},
  {jp: 'スーパーレア', en: 'Super Rare', aliases: ['スーレア', 'Super']},
  {jp: 'レア', en: 'Rare'},
  {jp: 'ノーマル', en: 'Common', aliases: ['Normal']},
  {jp: 'ノーマルレア', en: 'Normal Rare', aliases: ['ノーレア']},
  {jp: 'ノーマルパラレルレア', en: 'Normal Parallel Rare', aliases: ['ノーパラ']},

  // === 特殊レアリティ ===
  {jp: 'ミレニアムレア', en: 'Millennium Rare', aliases: ['ミレレア', 'Millennium']},
  {jp: 'ミレニアムシークレットレア', en: 'Millennium Secret Rare', aliases: ['ミレシク']},
  {jp: 'ミレニアムウルトラレア', en: 'Millennium Ultra Rare', aliases: ['ミレウル']},
  {jp: 'ミレニアムゴールドレア', en: 'Millennium Gold Rare', aliases: ['ミレゴル']},
  {jp: 'ゴールドレア', en: 'Gold Rare', aliases: ['ゴルレア', 'Gold']},
  {jp: 'ゴールドシークレットレア', en: 'Gold Secret Rare', aliases: ['ゴルシク']},
  {jp: 'パラレルレア', en: 'Parallel Rare', aliases: ['パラレル']},
  {jp: 'KCレア', en: 'KC Rare', aliases: ['KC']},
  {jp: 'KCウルトラレア', en: 'KC Ultra Rare', aliases: ['KCウル']},
  {jp: 'プレミアムゴールドレア', en: 'Premium Gold Rare', aliases: ['PGL']}
];

var CARD_YUGIOH_EDITIONS = [
  {jp: '初期', en: '1st Edition', aliases: ['1st Edition', 'First Edition', '初版']},
  {jp: 'リミテッドエディション', en: 'Limited Edition', aliases: ['Limited']},
  {jp: 'アンリミテッド', en: 'Unlimited', aliases: ['Unlimited Edition']},
  {jp: 'アジア版', en: 'Asian English', aliases: ['Asia English', 'AE']},
  {jp: '韓国版', en: 'Korean', aliases: ['KR']},
  {jp: '日本語版', en: 'Japanese', aliases: ['JP', 'OCG']},
  {jp: '英語版', en: 'English', aliases: ['EN', 'TCG']}
];

var CARD_RARITY_MTG = [
  {jp: '神話レア', en: 'Mythic Rare', aliases: ['Mythic']},
  {jp: 'レア', en: 'Rare'},
  {jp: 'アンコモン', en: 'Uncommon'},
  {jp: 'コモン', en: 'Common'}
];

var CARD_RARITY_ONEPIECE = [
  {jp: 'マンガレア', en: 'Manga Rare', aliases: ['Manga Rare']},
  {jp: 'スペシャルレア', en: 'Special Rare', code: 'SP'},
  {jp: 'シークレットレア', en: 'Secret Rare', code: 'SEC'},
  {jp: 'スーパーレア', en: 'Super Rare', code: 'SR'},
  {jp: 'リーダー', en: 'Leader', code: 'L'},
  {jp: 'レア', en: 'Rare', code: 'R'},
  {jp: 'アンコモン', en: 'Uncommon', code: 'UC'},
  {jp: 'コモン', en: 'Common', code: 'C'},
  {jp: 'パラレル', en: 'Parallel', aliases: ['Alternate Art']}
];

// ==============================
// 共通仕上げ辞書
// ==============================

var CARD_FINISH_PATTERNS_MASTER = [
  {jp: 'リバースホロ', en: 'Reverse Holo', aliases: ['Reverse Holo', 'Reverse Foil']},
  {jp: 'フルアート', en: 'Full Art', aliases: ['Full Art']},
  {jp: 'ホロ', en: 'Holo/Foil', aliases: ['Holo', 'Holofoil', 'Holographic']},
  {jp: 'フォイル', en: 'Holo/Foil', aliases: ['Foil']},
  {jp: 'クローム', en: 'Chrome', aliases: ['Chrome']},
  {jp: 'リフラクター', en: 'Refractor', aliases: ['Refractor']},
  {jp: 'ゴールドスタンプ', en: 'Gold', aliases: ['Gold Stamped']},
  {jp: 'Vスター', en: 'Holo/Foil', aliases: ['VSTAR', 'V Star']},
  {jp: 'Vマックス', en: 'Holo/Foil', aliases: ['VMAX']},
  {jp: 'ボーダーレス', en: 'Borderless', aliases: ['Borderless']}
];

// ==============================
// IS用パターン辞書（自動生成）
// ==============================

/**
 * 全ゲームのセットパターンを統合してIS用配列を返す
 */
function getCardSetPatterns_() {
  var all = [];
  all = all.concat(buildISPatterns_(CARD_POKEMON_SETS));
  all = all.concat(buildISPatterns_(CARD_MTG_SETS));
  all = all.concat(buildISPatterns_(CARD_YUGIOH_SETS));
  all = all.concat(buildISPatterns_(CARD_ONEPIECE_SETS));
  all = all.concat(buildISPatterns_(CARD_BASEBALL_SETS));
  return all;
}

/**
 * 全ゲームのキャラクターパターンを統合してIS用配列を返す
 */
function getCardCharacterPatterns_() {
  var all = [];
  all = all.concat(buildISPatterns_(CARD_POKEMON_CHARACTERS));
  all = all.concat(buildISPatterns_(CARD_POKEMON_TRAINERS));
  all = all.concat(buildISPatterns_(CARD_MTG_CARDS));
  all = all.concat(buildISPatterns_(CARD_YUGIOH_CHARACTERS));
  all = all.concat(buildISPatterns_(CARD_ONEPIECE_CHARACTERS));
  all = all.concat(buildISPatterns_(CARD_SUMO_WRESTLERS));
  all = all.concat(buildISPatterns_(CARD_BASEBALL_PLAYERS));
  return all;
}

/**
 * ゲーム別のキャラクターパターンを返す（クロスゲーム誤マッチ防止）
 * @param {string} game - Game値（'Pokemon', 'Baseball', 'Yu-Gi-Oh!' 等）
 * @return {Array} 該当ゲームのキャラクターパターン配列
 */
function getCardCharacterPatternsForGame_(game) {
  if (!game || game === 'Does not apply') return getCardCharacterPatterns_();
  switch (game) {
    case 'Pokemon':
      return buildISPatterns_(CARD_POKEMON_CHARACTERS).concat(buildISPatterns_(CARD_POKEMON_TRAINERS));
    case 'Magic: The Gathering':
      return buildISPatterns_(CARD_MTG_CARDS);
    case 'Yu-Gi-Oh!':
      return buildISPatterns_(CARD_YUGIOH_CHARACTERS);
    case 'One Piece':
      return buildISPatterns_(CARD_ONEPIECE_CHARACTERS);
    case 'Baseball':
      return buildISPatterns_(CARD_BASEBALL_PLAYERS);
    case 'Sumo Wrestling':
      return buildISPatterns_(CARD_SUMO_WRESTLERS);
    default:
      return getCardCharacterPatterns_();
  }
}

/**
 * ゲーム別のレアリティパターンを返す
 * @param {string} game - Game値
 * @return {Array} 該当ゲームのレアリティパターン配列
 */
function getCardRarityPatternsForGame_(game) {
  if (!game || game === 'Does not apply') return getCardRarityPatterns_();
  switch (game) {
    case 'Pokemon':
      return buildISPatterns_(CARD_RARITY_POKEMON);
    case 'Yu-Gi-Oh!':
      return buildISPatterns_(CARD_RARITY_YUGIOH);
    case 'Magic: The Gathering':
      return buildISPatterns_(CARD_RARITY_MTG);
    case 'One Piece':
      return buildISPatterns_(CARD_RARITY_ONEPIECE);
    default:
      return [];
  }
}

/**
 * ゲーム別のセットパターンを返す
 * @param {string} game - Game値
 * @return {Array} 該当ゲームのセットパターン配列
 */
function getCardSetPatternsForGame_(game) {
  if (!game || game === 'Does not apply') return getCardSetPatterns_();
  switch (game) {
    case 'Pokemon':
      return buildISPatterns_(CARD_POKEMON_SETS);
    case 'Magic: The Gathering':
      return buildISPatterns_(CARD_MTG_SETS);
    case 'Yu-Gi-Oh!':
      return buildISPatterns_(CARD_YUGIOH_SETS);
    case 'One Piece':
      return buildISPatterns_(CARD_ONEPIECE_SETS);
    case 'Baseball':
      return buildISPatterns_(CARD_BASEBALL_SETS);
    default:
      return getCardSetPatterns_();
  }
}

/**
 * 全ゲームのレアリティパターンを統合してIS用配列を返す
 * 重複排除のため、ゲーム固有→汎用の順で並べる
 */
function getCardRarityPatterns_() {
  var all = [];
  all = all.concat(buildISPatterns_(CARD_RARITY_POKEMON));
  all = all.concat(buildISPatterns_(CARD_RARITY_YUGIOH));
  all = all.concat(buildISPatterns_(CARD_RARITY_MTG));
  all = all.concat(buildISPatterns_(CARD_RARITY_ONEPIECE));
  return all;
}

/**
 * 仕上げパターンをIS用配列で返す
 */
function getCardFinishPatterns_() {
  return buildISPatterns_(CARD_FINISH_PATTERNS_MASTER);
}

/**
 * ゲーム判定パターンをIS用配列で返す（既存IS_GAME_PATTERNSの代替）
 */
function getCardGamePatterns_() {
  return [
    {keywords: ['ポケモン', 'ポケカ', 'Pokemon', 'POKEMON', 'ピカチュウ', 'リザードン'], value: 'Pokemon'},
    {keywords: ['遊戯王', 'Yu-Gi-Oh', 'YU-GI-OH', 'YUGIOH', 'ブルーアイズ'], value: 'Yu-Gi-Oh!'},
    {keywords: ['MTG', 'Magic:', 'Magic the', 'マジック・ザ・ギャザリング', 'マジックザギャザリング'], value: 'Magic: The Gathering'},
    {keywords: ['デュエルマスターズ', 'Duel Masters', 'デュエマ'], value: 'Duel Masters'},
    {keywords: ['ヴァイスシュヴァルツ', 'Weiss Schwarz'], value: 'Weiss Schwarz'},
    {keywords: ['ヴァンガード', 'Vanguard', 'VANGUARD'], value: 'Cardfight!! Vanguard'},
    {keywords: ['バトルスピリッツ', 'Battle Spirits', 'バトスピ'], value: 'Battle Spirits'},
    {keywords: ['ドラゴンボール', 'Dragon Ball'], value: 'Dragon Ball Super Card Game'},
    {keywords: ['ワンピース', 'ONE PIECE', 'One Piece Card'], value: 'One Piece Card Game'},
    {keywords: ['デジモン', 'Digimon'], value: 'Digimon'},
    {keywords: ['BBM', 'ベースボールカード', 'Baseball Card', 'Topps', 'Bowman'], value: 'Baseball'},
    {keywords: ['大相撲', 'Sumo', '力士'], value: 'Sumo Wrestling'}
  ];
}

// グローバル変数として生成（resolveFieldValue_から参照）
var IS_CARD_SET_PATTERNS = getCardSetPatterns_();
var IS_CARD_CHARACTER_PATTERNS = getCardCharacterPatterns_();
var IS_CARD_RARITY_PATTERNS = getCardRarityPatterns_();
var IS_CARD_FINISH_PATTERNS = getCardFinishPatterns_();
var IS_GAME_PATTERNS = getCardGamePatterns_();

// ==============================
// 翻訳プロンプト用テキスト生成
// ==============================

/**
 * 指定ゲームの翻訳辞書テキストを生成
 * @param {string} game - 'Pokemon', 'MTG', 'Yu-Gi-Oh', 'One Piece', 'Baseball', 'Sumo'
 * @return {string} 翻訳辞書テキスト（Japanese=English形式）
 */
function buildCardTranslationDict_(game) {
  var lines = [];

  if (game === 'Pokemon' || game === 'Pokémon') {
    lines.push('[Sets]');
    lines.push(buildPromptDict_(CARD_POKEMON_SETS));
    lines.push('');
    lines.push('[Pokemon]');
    lines.push(buildPromptDict_(CARD_POKEMON_CHARACTERS));
    lines.push('');
    lines.push('[Trainers/Supporters]');
    lines.push(buildPromptDict_(CARD_POKEMON_TRAINERS));
    lines.push('');
    lines.push('[Rarity Codes]');
    for (var i = 0; i < CARD_RARITY_POKEMON.length; i++) {
      var r = CARD_RARITY_POKEMON[i];
      if (r.code) lines.push(r.code + '=' + r.code);
    }
  } else if (game === 'MTG' || game === 'Magic: The Gathering') {
    lines.push('[Set Names]');
    lines.push(buildPromptDict_(CARD_MTG_SETS));
    lines.push('');
    lines.push('[Popular Cards]');
    lines.push(buildPromptDict_(CARD_MTG_CARDS));
    lines.push('');
    lines.push('[Rarity]');
    lines.push(buildPromptDict_(CARD_RARITY_MTG));
    lines.push('');
    lines.push('[Variants]');
    lines.push(buildPromptDict_(CARD_MTG_VARIANTS));
  } else if (game === 'Yu-Gi-Oh' || game === 'Yu-Gi-Oh!') {
    lines.push('[Sets]');
    lines.push(buildPromptDict_(CARD_YUGIOH_SETS));
    lines.push('');
    lines.push('[Cards]');
    lines.push(buildPromptDict_(CARD_YUGIOH_CHARACTERS));
    lines.push('');
    lines.push('[Rarity]');
    lines.push(buildPromptDict_(CARD_RARITY_YUGIOH));
  } else if (game === 'One Piece' || game === 'One Piece Card Game') {
    lines.push('[Sets]');
    lines.push(buildPromptDict_(CARD_ONEPIECE_SETS));
    lines.push('');
    lines.push('[Characters]');
    lines.push(buildPromptDict_(CARD_ONEPIECE_CHARACTERS));
    lines.push('');
    lines.push('[Rarity]');
    lines.push(buildPromptDict_(CARD_RARITY_ONEPIECE));
  } else if (game === 'Baseball') {
    lines.push('[Brands]');
    lines.push(buildPromptDict_(CARD_BASEBALL_BRANDS));
    lines.push('');
    lines.push('[Sets]');
    lines.push(buildPromptDict_(CARD_BASEBALL_SETS));
    lines.push('');
    lines.push('[Card Types]');
    lines.push(buildPromptDict_(CARD_BASEBALL_TYPES));
    lines.push('');
    lines.push('[Players]');
    lines.push(buildPromptDict_(CARD_BASEBALL_PLAYERS));
  } else if (game === 'Sumo' || game === 'Sumo Wrestling') {
    lines.push('[Wrestlers]');
    lines.push(buildPromptDict_(CARD_SUMO_WRESTLERS));
  }

  return lines.join('\n');
}
