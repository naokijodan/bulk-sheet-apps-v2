#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GENRE_CATEGORY_BUCKETS 生成スクリプト (route② カテゴリID AI判定用)

入力 : ~/Desktop/ebay-categories-curated.csv  (eBay US Taxonomy treeVersion 134 の絞り込み済みリスト)
出力 : CategoryBuckets.gs (root) + Library/CategoryBuckets.gs

各「ジャンル」(Config.gs PROMPT_TAG_MAPPING のキー) ごとに、その商品が当てはまり得る
eBay カテゴリ候補 (公式確定 ID + fullPath) を絞り込みリストから抽出する。
ID は必ず絞り込みリスト由来なので、AI 出力 ID の許可リスト検証にも使える。

ルールは include/exclude の正規表現 (fullPath に対し re.search, 大文字小文字無視)。
"""
import csv, re, os, datetime, json

CSV_PATH = os.path.expanduser('~/Desktop/ebay-categories-curated.csv')
TREE_VERSION = '134'
MARKETPLACE = 'EBAY_US'
HERE = os.path.dirname(os.path.abspath(__file__))

CCG_EXCL = ['Supplies & Accessories', 'Price Guides', 'NFTs', 'Box & Case Breaks', 'Repacks', 'Grading Tools']

# genre -> (includes[], excludes[])
RULES = {
 '時計用': (['Watches, Parts & Accessories'], []),
 'カメラ': (['^Cameras & Photo >'], []),
 'リール': (['Fishing > Reel', 'Rod & Reel Combos'], []),
 '釣竿': (['Fishing > Rods & Poles', 'Rod & Reel Combos'], []),
 '釣具汎用': (['Baits, Lures & Flies', 'Line & Leaders', 'Terminal Tackle', 'Fishfinders', 'Fishing Equipment', 'Fishing > Other Fishing'], []),
 'ゴルフ': (['Sporting Goods > Golf >'], []),
 'ジュエリー': (['^Jewelry & Watches >'], ['Watches, Parts & Accessories', 'Loose Diamonds', 'Loose Beads', 'Jewelry Care']),
 'ポケカ': (['Collectible Card Games >'], CCG_EXCL),
 'MTG': (['Collectible Card Games >'], CCG_EXCL),
 'ベースボールカード': (['Sports Trading Cards', 'Sports Stickers, Collections & Albums'], []),
 '大相撲カード': (['Non-Sport Trading Cards', 'Non-Sport Stickers'], []),
 '遊戯王': (['Collectible Card Games >'], CCG_EXCL),
 'ワンピースカード': (['Collectible Card Games >'], CCG_EXCL),
 'ドラゴンボールカード': (['Collectible Card Games >'], CCG_EXCL),
 'ヴァイスシュヴァルツ': (['Collectible Card Games >'], CCG_EXCL),
 'デジモンカード': (['Collectible Card Games >'], CCG_EXCL),
 'ガンダムカード': (['Collectible Card Games >'], CCG_EXCL),
 'トレカ汎用': (['Collectible Card Games >', 'Non-Sport Trading Cards', 'Sports Trading Cards'], CCG_EXCL),
 'ゲーム用': (['Video Games & Consoles > Video Games', 'Strategy Guides'], []),
 'ゲーム機': (['Video Game Consoles', 'Video Game Accessories'], []),
 'コレクティブル': (['^Collectibles >'], []),
 'フィギュア': (['Collectible Figures & Supplies', 'Action Figures & Accessories', 'Stuffed Animals', 'Beanbag Plush', '^Dolls & Bears >'], []),
 'アニメ': (['Animation Art & Merchandise'], []),
 '漫画': (['Comic Books & Memorabilia'], []),
 'スニーカー': (["Men > Men's Shoes", "Women > Women's Shoes"], []),
 'ドレスシューズ': (["Men > Men's Shoes", "Women > Women's Shoes"], []),
 'アパレル・ブランド品': (["Men > Men's Clothing", "Women > Women's Clothing", "Men > Men's Accessories", "Women > Women's Accessories", "Kids > Boys", "Kids > Girls", "Kids > Unisex"], [r'Shoes$', r'Shoes >', 'Bags & Handbags', 'Backpacks']),
 'レザーグッズ': (["Women > Women's Bags & Handbags", "Kids > Backpacks & Bags", "Men > Men's Accessories", "Women > Women's Accessories"], []),
 'オーディオ・家電': (['^Consumer Electronics >', 'Small Kitchen Appliances'], []),
 '楽器': (['Musical Instruments & Gear > Percussion >', 'Musical Instruments & Gear > Vintage Musical Instruments >'], ['Vintage Guitars']),
 '楽器_ギター': (['Guitars & Basses'], ['Amplifier']),
 '楽器_アンプ': (['Guitar Amplifiers'], []),
 'RC・模型': (['Radio Control & Control Line', 'Models & Kits', 'Diecast & Toy Vehicles', 'Model Railroads & Trains', 'Slot Cars'], []),
 'メカプラモ': (['Models & Kits', 'Robots, Monsters & Space Toys'], []),
 'レコード': (['^Music >'], []),
 'サングラス': (['Sunglass'], []),
 '万年筆・筆記具': (['Pens & Writing Instruments'], []),
 'テニス': (['Tennis & Racquet Sports', 'Table Tennis, Ping Pong'], []),
 '野球': (['Baseball & Softball'], []),
 'スポーツウェア': (['Fan Apparel & Souvenirs', 'Activewear'], []),
 '着物': (['World & Traditional Clothing'], []),
 '日本刀': (['Knives, Swords & Blades'], []),
 '陶磁器': (['^Pottery & Glass >', 'Antiques > Asian Antiques'], []),
 '茶道具': (['Antiques > Asian Antiques', 'Decorative Cookware, Dinnerware & Serveware'], []),
 '鉄瓶': (['Antiques > Asian Antiques', 'Collectibles > Metalware'], []),
 '仏教美術': (['Antiques > Asian Antiques', 'Ethnographic', 'Religion & Spirituality'], []),
 '盆栽': (['Architectural & Garden'], []),
 '包丁': (['Flatware, Knives & Cutlery'], []),
 'アート': (['^Art >'], []),
 '掛軸': (['Art > Paintings', 'Asian Antiques'], []),
 '版画': (['Art > Art Prints', 'Asian Antiques'], []),
 'パイプ・喫煙具': (['Tobacciana'], []),
 'テーブルウェア': (['Decorative Cookware, Dinnerware & Serveware', 'Dinnerware & Serveware', 'Glassware & Drinkware', 'Antiques > Silver', 'Decorative Pottery & Glassware', 'Flatware, Knives & Cutlery'], []),
 '和楽器': (['Folk & World Drums', 'Vintage String', 'Vintage Wind & Woodwind', 'Vintage Brass', 'Hand Percussion'], []),
 '切手・コイン': (['^Coins & Paper Money >', '^Stamps'], []),
 '石鹸': (['Vanity, Perfume & Shaving'], []),
 '日本人形': (['Dolls, Clothing & Accessories', 'Cultures & Ethnicities', 'Asian Antiques'], []),
 'スノーグローブ': (['Snow Globe', 'Decorative Collectibles'], []),
 '書籍・雑誌': (['^Books & Magazines >'], []),
 '一般商品・汎用': (['Home & Garden > Home Décor', 'Collectibles > Decorative Collectibles', 'Collectibles > Kitchen & Home'], []),
 'ボードゲーム': (['Toys & Hobbies > Games', 'Classic Toys'], []),
 'パソコン周辺機器': (['^Computers/Tablets & Networking >'], ['Laptops & Netbooks', 'Desktops & All-In-Ones', 'Tablets & eBook Readers']),
 'パソコン本体': (['Laptops & Netbooks', 'Desktops & All-In-Ones', 'Tablets & eBook Readers'], []),
 '電子辞書': (['eBook Readers'], []),
 '関数電卓': (['Calculator'], []),
 '手工具': (['Hand Tools', 'Measuring & Layout Tools', 'Tools, Hardware & Locks', 'Tool Boxes & Storage'], []),
 '電動工具': (['Tools & Workshop Equipment > Power Tools', 'Tools & Workshop Equipment > Air Tools & Air Compressors'], []),
}


def matches(path, incl, excl):
    if not any(re.search(p, path, re.I) for p in incl):
        return False
    if any(re.search(p, path, re.I) for p in excl):
        return False
    return True


def gas_escape(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def main():
    rows = []
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        for x in csv.DictReader(f):
            rows.append((x['categoryId'], x['fullPath']))

    buckets = {}
    for g, (incl, excl) in RULES.items():
        seen = set()
        sel = []
        for cid, p in rows:
            if matches(p, incl, excl) and cid not in seen:
                seen.add(cid)
                sel.append((cid, p))
        buckets[g] = sel

    # --- write .gs ---
    today = datetime.date.today().isoformat()
    lines = []
    lines.append('// CategoryBuckets.gs — auto-generated by gen_category_buckets.py. DO NOT EDIT BY HAND.')
    lines.append('// Source: ebay-categories-curated.csv (eBay US Taxonomy treeVersion %s, %s). Generated %s.' % (TREE_VERSION, MARKETPLACE, today))
    lines.append('// 各ジャンル(Config.gs PROMPT_TAG_MAPPING のキー)ごとの eBay カテゴリ候補。')
    lines.append('// route② 翻訳でユーザー許可リストのタグ→ジャンル→候補をスライスしプロンプトに渡し、AI 出力IDをこの許可リストで検証する。')
    lines.append('')
    lines.append("var EBAY_TAXONOMY_TREE_VERSION = '%s';" % TREE_VERSION)
    lines.append("var EBAY_TAXONOMY_MARKETPLACE = '%s';" % MARKETPLACE)
    lines.append('')
    lines.append('var GENRE_CATEGORY_BUCKETS = {')
    genre_keys = list(RULES.keys())
    for gi, g in enumerate(genre_keys):
        sel = buckets[g]
        lines.append("  '%s': [" % gas_escape(g))
        for cid, p in sel:
            lines.append("    {id: '%s', path: '%s'}," % (gas_escape(cid), gas_escape(p)))
        comma = ',' if gi < len(genre_keys) - 1 else ''
        lines.append('  ]%s' % comma)
    lines.append('};')
    lines.append('')
    content = '\n'.join(lines)

    for outpath in [os.path.join(HERE, 'CategoryBuckets.gs'), os.path.join(HERE, 'Library', 'CategoryBuckets.gs')]:
        with open(outpath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('wrote', outpath)

    # --- CLI 翻訳スキル用 JSON (tagToGenre + buckets) ---
    tag_to_genre = {}
    cfg_path = os.path.join(HERE, 'Config.gs')
    if os.path.exists(cfg_path):
        cfg = open(cfg_path, encoding='utf-8').read()
        m = re.search(r'var PROMPT_TAG_MAPPING\s*=\s*\{(.*?)\n\};', cfg, re.S)
        if m:
            for gm in re.finditer(r"'([^']+)'\s*:\s*\[([^\]]*)\]", m.group(1)):
                genre = gm.group(1)
                for t in re.findall(r"'([^']*)'", gm.group(2)):
                    t = t.strip()
                    if t:
                        tag_to_genre[t] = genre
    payload = {
        'treeVersion': TREE_VERSION,
        'marketplace': MARKETPLACE,
        'generated': today,
        'note': 'CLI翻訳スキル用。各商品の recommendedUserTags(タグ) -> tagToGenre[tag] -> buckets[genre] の候補から categoryId を1つ選ぶ。候補内のIDのみ。無ければ空。',
        'tagToGenre': tag_to_genre,
        'buckets': dict((g, [{'id': cid, 'path': p} for (cid, p) in buckets[g]]) for g in genre_keys)
    }
    json_text = json.dumps(payload, ensure_ascii=False, indent=1)
    for jpath in [os.path.expanduser('~/Desktop/ebay-category-buckets.json'), os.path.join(HERE, 'ebay-category-buckets.json')]:
        with open(jpath, 'w', encoding='utf-8') as f:
            f.write(json_text)
        print('wrote', jpath)

    # --- coverage report (stdout) ---
    print('\n=== coverage (%d genres, curated=%d rows) ===' % (len(RULES), len(rows)))
    gaps = []
    for g in genre_keys:
        n = len(buckets[g])
        tag = ''
        if n < 3:
            tag = '  <<GAP'
            gaps.append(g)
        elif n > 120:
            tag = '  (broad)'
        print('%-18s %4d%s' % (g, n, tag))
    print('\nGAP(<3):', ', '.join(gaps))


if __name__ == '__main__':
    main()
