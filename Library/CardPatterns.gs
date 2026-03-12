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
  var patterns = [];
  for (var i = 0; i < masterArray.length; i++) {
    var item = masterArray[i];
    if (!item || !item.en) continue;
    var keywords = [];
    if (item.jp) keywords.push(item.jp);
    if (item.en) keywords.push(item.en);
    if (item.code) keywords.push(item.code);
    if (item.aliases) {
      for (var a = 0; a < item.aliases.length; a++) {
        keywords.push(item.aliases[a]);
      }
    }
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
  // 2023-2025 (Scarlet & Violet era)
  {jp: 'テラスタルフェスex', en: 'Terastal Festival ex', code: 'SV8a'},
  {jp: 'バトルパートナーズ', en: 'Battle Partners', code: 'SV8'},
  {jp: '超電ブレイカー', en: 'Surging Sparks', code: 'SV7'},
  {jp: '楽園ドラゴーナ', en: 'Paradise Dragona', code: 'SV7a'},
  {jp: 'ステラミラクル', en: 'Stellar Miracle', code: 'SV7s'},
  {jp: '変幻の仮面', en: 'Twilight Masquerade', code: 'SV6'},
  {jp: 'ワイルドフォース', en: 'Wild Force', code: 'SV5K'},
  {jp: 'サイバージャッジ', en: 'Cyber Judge', code: 'SV5M'},
  {jp: '未来の一閃', en: 'Future Flash', code: 'SV4M'},
  {jp: '古代の咆哮', en: 'Ancient Roar', code: 'SV4K'},
  {jp: 'レイジングサーフ', en: 'Raging Surf', code: 'SV3a'},
  {jp: '黒炎の支配者', en: 'Ruler of the Black Flame', code: 'SV3'},
  {jp: 'クレイバースト', en: 'Clay Burst', code: 'SV2D'},
  {jp: 'スノーハザード', en: 'Snow Hazard', code: 'SV2P'},
  {jp: 'トリプレットビート', en: 'Triplet Beat', code: 'SV1a'},
  {jp: 'バイオレットex', en: 'Violet ex', code: 'SV1V'},
  {jp: 'スカーレットex', en: 'Scarlet ex', code: 'SV1S'},
  {jp: 'シャイニートレジャーex', en: 'Shiny Treasure ex', code: 'SV4a'},
  {jp: 'ポケモンカード151', en: 'Pokemon Card 151', code: 'SV2a'},
  {jp: 'クリムゾンヘイズ', en: 'Crimson Haze', code: 'SV5a'},
  // 2019-2022 (Sword & Shield era)
  {jp: 'VSTARユニバース', en: 'VSTAR Universe', code: 'S12a'},
  {jp: 'VMAXクライマックス', en: 'VMAX Climax', code: 'S8b'},
  {jp: 'シャイニースターV', en: 'Shiny Star V', code: 'S4a'},
  {jp: 'イーブイヒーローズ', en: 'Eevee Heroes', code: 'S6a'},
  {jp: 'VMAXライジング', en: 'VMAX Rising', code: 'S1a'},
  {jp: '白熱のアルカナ', en: 'Incandescent Arcana', code: 'S11a'},
  {jp: 'ロストアビス', en: 'Lost Abyss', code: 'S11'},
  {jp: '一撃マスター', en: 'Single Strike Master', code: 'S5I'},
  {jp: '連撃マスター', en: 'Rapid Strike Master', code: 'S5R'},
  {jp: '蒼空ストリーム', en: 'Blue Sky Stream', code: 'S7R'},
  {jp: 'フュージョンアーツ', en: 'Fusion Arts', code: 'S8'},
  {jp: 'スターバース', en: 'Star Birth', code: 'S9'},
  {jp: 'タイムゲイザー', en: 'Time Gazer', code: 'S10D'},
  {jp: 'スペースジャグラー', en: 'Space Juggler', code: 'S10P'},
  {jp: 'ダークファンタズマ', en: 'Dark Phantasma', code: 'S10a'},
  {jp: 'パラダイムトリガー', en: 'Paradigm Trigger', code: 'S12'},
  {jp: 'ソード&シールド', en: 'Sword & Shield', code: 'S1'},
  // 2016-2019 (Sun & Moon era)
  {jp: 'サン&ムーン', en: 'Sun & Moon', code: 'SM1'},
  {jp: 'ウルトラサン', en: 'Ultra Sun', code: 'SM5S'},
  {jp: 'ウルトラムーン', en: 'Ultra Moon', code: 'SM5M'},
  {jp: 'GXウルトラシャイニー', en: 'GX Ultra Shiny', code: 'SM8b'},
  {jp: 'タッグオールスターズ', en: 'Tag All Stars', code: 'SM12a'},
  {jp: 'ドリームリーグ', en: 'Dream League', code: 'SM11b'},
  {jp: 'オルタージェネシス', en: 'Alter Genesis', code: 'SM12'},
  // Classic era
  {jp: 'ブラック&ホワイト', en: 'Black & White'},
  {jp: 'ダイヤモンド&パール', en: 'Diamond & Pearl'},
  {jp: 'ハートゴールドコレクション', en: 'HeartGold Collection'},
  {jp: '旧裏', en: 'Base Set'},
  {jp: 'ベースセット', en: 'Base Set'},
  {jp: 'ポケモンジャングル', en: 'Pokemon Jungle', aliases: ['ジャングル', 'Jungle']},
  {jp: '化石の秘密', en: 'Fossil'},
  {jp: 'ロケット団', en: 'Team Rocket'},
  {jp: 'ネオジェネシス', en: 'Neo Genesis', aliases: ['Neo Genesis', '金、銀、新世界へ']},
  {jp: 'ネオディスカバリー', en: 'Neo Discovery', aliases: ['Neo Discovery', '遺跡をこえて']},
  // Promo
  {jp: 'プロモ', en: 'Promo', aliases: ['プロモカード', 'S-P', 'SV-P', 'SM-P']}
];

var CARD_POKEMON_CHARACTERS = [
  {jp: 'リザードン', en: 'Charizard'},
  {jp: 'ピカチュウ', en: 'Pikachu'},
  {jp: 'ミュウ', en: 'Mew'},
  {jp: 'ミュウツー', en: 'Mewtwo'},
  {jp: 'レックウザ', en: 'Rayquaza'},
  {jp: 'ルギア', en: 'Lugia'},
  {jp: 'ギラティナ', en: 'Giratina'},
  {jp: 'アルセウス', en: 'Arceus'},
  {jp: 'パルキア', en: 'Palkia'},
  {jp: 'ディアルガ', en: 'Dialga'},
  {jp: 'サーナイト', en: 'Gardevoir'},
  {jp: 'ゲッコウガ', en: 'Greninja'},
  {jp: 'ゲンガー', en: 'Gengar'},
  {jp: 'カイリュー', en: 'Dragonite'},
  {jp: 'イーブイ', en: 'Eevee'},
  {jp: 'ブラッキー', en: 'Umbreon'},
  {jp: 'エーフィ', en: 'Espeon'},
  {jp: 'ニンフィア', en: 'Sylveon'},
  {jp: 'グレイシア', en: 'Glaceon'},
  {jp: 'リーフィア', en: 'Leafeon'},
  {jp: 'ブースター', en: 'Flareon'},
  {jp: 'シャワーズ', en: 'Vaporeon'},
  {jp: 'サンダース', en: 'Jolteon'},
  {jp: 'コライドン', en: 'Koraidon'},
  {jp: 'ミライドン', en: 'Miraidon'},
  {jp: 'ソルガレオ', en: 'Solgaleo'},
  {jp: 'ルナアーラ', en: 'Lunala'},
  {jp: 'ゼルネアス', en: 'Xerneas'},
  {jp: 'レシラム', en: 'Reshiram'},
  {jp: 'ゼクロム', en: 'Zekrom'},
  {jp: 'ホウオウ', en: 'Ho Oh'},
  {jp: 'スイクン', en: 'Suicune'},
  {jp: 'カイオーガ', en: 'Kyogre'},
  {jp: 'グラードン', en: 'Groudon'},
  {jp: 'ダークライ', en: 'Darkrai'},
  {jp: 'ラプラス', en: 'Lapras'},
  {jp: 'フシギバナ', en: 'Venusaur'},
  {jp: 'カメックス', en: 'Blastoise'},
  {jp: 'ギャラドス', en: 'Gyarados'},
  {jp: 'ミミッキュ', en: 'Mimikyu'},
  {jp: 'ルカリオ', en: 'Lucario'},
  {jp: 'ガブリアス', en: 'Garchomp'}
];

var CARD_POKEMON_TRAINERS = [
  {jp: 'リーリエ', en: 'Lillie'},
  {jp: 'マリィ', en: 'Marnie'},
  {jp: 'ナンジャモ', en: 'Iono'},
  {jp: 'セレナ', en: 'Serena'},
  {jp: 'フウロ', en: 'Skyla'},
  {jp: 'シロナ', en: 'Cynthia'},
  {jp: 'カミツレ', en: 'Elesa'},
  {jp: 'N', en: 'N'},
  {jp: '博士の研究', en: 'Professors Research'},
  {jp: 'カスミ', en: 'Misty'},
  {jp: 'アセロラ', en: 'Acerola'},
  {jp: 'グズマ', en: 'Guzma'},
  {jp: 'ルザミーネ', en: 'Lusamine'},
  {jp: 'カトレア', en: 'Caitlin'}
];

// ==============================
// Magic: The Gathering マスター辞書
// ==============================

var CARD_MTG_SETS = [
  {jp: 'ファイナルファンタジー', en: 'MTG FINAL FANTASY', aliases: ['FINAL FANTASY', 'FF']},
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
  {jp: 'レアリティコレクション', en: 'Rarity Collection', aliases: ['RARITY COLLECTION']},
  {jp: 'レジェンドデュエリスト', en: 'Legendary Duelists'},
  {jp: 'デュエリストパック', en: 'Duelist Pack'},
  {jp: 'プレミアムパック', en: 'Premium Pack', aliases: ['PREMIUM PACK']},
  {jp: 'レジェンダリーゴールドボックス', en: 'Legendary Gold Box'},
  {jp: 'プリズマティックアートコレクション', en: 'Prismatic Art Collection'},
  {jp: 'バトルオブカオス', en: 'Battle of Chaos'},
  {jp: 'ファントムナイトメア', en: 'Phantom Nightmare'},
  {jp: 'エイジオブオーバーロード', en: 'Age of Overlord'},
  {jp: 'デュエルモンスターズ', en: 'Duel Monsters'}
];

var CARD_YUGIOH_CHARACTERS = [
  {jp: 'ブルーアイズ', en: 'Blue-Eyes White Dragon', aliases: ['青眼の白龍', 'Blue-Eyes']},
  {jp: 'ブラックマジシャン', en: 'Dark Magician', aliases: ['ブラック・マジシャン']},
  {jp: 'レッドアイズ', en: 'Red-Eyes Black Dragon', aliases: ['真紅眼の黒竜', 'Red-Eyes']},
  {jp: '灰流うらら', en: 'Ash Blossom & Joyous Spring'},
  {jp: '増殖するG', en: 'Maxx C', aliases: ['増G']},
  {jp: 'エクゾディア', en: 'Exodia'},
  {jp: '死者蘇生', en: 'Monster Reborn'},
  {jp: 'ハーピィ', en: 'Harpie'},
  {jp: 'スターダスト', en: 'Stardust Dragon'}
];

// ==============================
// ワンピースカードゲーム マスター辞書
// ==============================

var CARD_ONEPIECE_SETS = [
  {jp: 'ロマンスドーン', en: 'Romance Dawn', code: 'OP01'},
  {jp: '頂上決戦', en: 'Paramount War', code: 'OP02'},
  {jp: '強大な敵', en: 'Pillars of Strength', code: 'OP03'},
  {jp: '謀略の王国', en: 'Kingdoms of Intrigue', code: 'OP04'},
  {jp: '新時代の主役', en: 'Awakening of the New Era', code: 'OP05'},
  {jp: '双璧の覇者', en: 'Wings of the Captain', code: 'OP06'},
  {jp: '500年後の未来', en: '500 Years in the Future', code: 'OP07'},
  {jp: '二つの伝説', en: 'Two Legends', code: 'OP08'},
  {jp: '新たなる皇帝', en: 'Emperors in the New World', code: 'OP09'},
  {jp: '王族の血統', en: 'Royal Bloodlines', code: 'OP10'},
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
  {jp: null, en: 'Ronald Acuna Jr', aliases: ['ロナルド・アクーニャ', 'アクーニャ']},
  {jp: null, en: 'Freddie Freeman', aliases: ['フレディ・フリーマン']},
  {jp: null, en: 'Bryce Harper', aliases: ['ブライス・ハーパー']},
  {jp: null, en: 'Manny Machado', aliases: ['マニー・マチャド']},
  {jp: null, en: 'Fernando Tatis Jr', aliases: ['フェルナンド・タティス', 'タティス']},
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
  {jp: '衣笠祥雄', en: 'Sachio Kinugasa'}
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
  {jp: 'スペシャルアートレア', en: 'Special Art Rare', code: 'SAR'},
  {jp: 'シークレットレア', en: 'Secret Rare', aliases: ['Secret Rare']},
  {jp: 'ウルトラレア', en: 'Ultra Rare', code: 'UR'},
  {jp: 'ハイパーレア', en: 'Hyper Rare', code: 'HR'},
  {jp: 'アートレア', en: 'Art Rare', code: 'AR'},
  {jp: 'ダブルレア', en: 'Double Rare', code: 'RR'},
  {jp: 'スーパーレア', en: 'Super Rare', code: 'SR'},
  {jp: 'キャラクタースーパーレア', en: 'Character Super Rare', code: 'CSR'},
  {jp: 'キャラクターレア', en: 'Character Rare', code: 'CHR'},
  {jp: 'シャイニースーパーレア', en: 'Shiny Super Rare', code: 'SSR'},
  {jp: 'ACEスペック', en: 'ACE', code: 'ACE'},
  {jp: 'レア', en: 'Rare', code: 'R'},
  {jp: 'アンコモン', en: 'Uncommon', code: 'U'},
  {jp: 'コモン', en: 'Common', code: 'C'},
  {jp: 'プロモ', en: 'Promo', aliases: ['PROMO']}
];

var CARD_RARITY_YUGIOH = [
  {jp: 'アルティメットレア', en: 'Ultimate Rare'},
  {jp: 'ゴーストレア', en: 'Ghost Rare'},
  {jp: 'スターライトレア', en: 'Starlight Rare'},
  {jp: 'プリズマティックシークレット', en: 'Prismatic Secret Rare'},
  {jp: '20thシークレット', en: '20th Secret Rare'},
  {jp: 'コレクターズレア', en: "Collector's Rare"},
  {jp: 'スーパーレア', en: 'Super Rare'},
  {jp: 'ウルトラレア', en: 'Ultra Rare'},
  {jp: 'シークレットレア', en: 'Secret Rare'},
  {jp: 'ノーマル', en: 'Common'}
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
