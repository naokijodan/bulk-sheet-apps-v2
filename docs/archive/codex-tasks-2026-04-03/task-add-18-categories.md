# タスク: 18カテゴリ追加

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`（ルート）
- `Library/Config_IS.gs`（ライブラリ同期）

## 変更1: IS_CATEGORY_FIELDS に18カテゴリ追加

`'Belt Buckles'` の行の後、`};` の前に以下を追加:

```javascript
  'Kimono':              ['Brand', 'Type', 'Material', 'Color', 'Pattern', 'Season', 'Size', 'Country/Region of Manufacture'],
  'Japanese Swords':     ['Type', 'Blade Length', 'Era', 'School', 'Material', 'Country/Region of Manufacture'],
  'Tea Ceremony':        ['Type', 'Material', 'Artist', 'Style', 'Country/Region of Manufacture'],
  'Bonsai':              ['Type', 'Material', 'Size', 'Color', 'Shape', 'Country/Region of Manufacture'],
  'Prints':              ['Listed By', 'Medium', 'Subject', 'Artist', 'Style', 'Size', 'Country/Region of Manufacture'],
  'Buddhist Art':        ['Type', 'Material', 'Size', 'Era', 'Country/Region of Manufacture'],
  'Tetsubin':            ['Brand', 'Type', 'Material', 'Size', 'Country/Region of Manufacture'],
  'Golf':                ['Brand', 'Type', 'Club Type', 'Shaft Material', 'Shaft Flex', 'Loft', 'Hand Orientation', 'Dexterity', 'Country/Region of Manufacture'],
  'Tennis':              ['Brand', 'Type', 'Head Size', 'Grip Size', 'String Pattern', 'Weight', 'Country/Region of Manufacture'],
  'Baseball':            ['Brand', 'Type', 'Position', 'Hand Orientation', 'Size', 'Material', 'Country/Region of Manufacture'],
  'Japanese Instruments': ['Type', 'Material', 'Size', 'Country/Region of Manufacture'],
  'Fishing Rods':        ['Brand', 'Model', 'Rod Type', 'Length', 'Power', 'Action', 'Fishing Type', 'Fish Species', 'Country/Region of Manufacture'],
  'RC & Models':         ['Brand', 'Type', 'Scale', 'Fuel Type', 'Color', 'Country/Region of Manufacture'],
  'Anime':               ['Brand', 'Character', 'Franchise', 'Type', 'Material', 'Country/Region of Manufacture'],
  'Figures':             ['Brand', 'Character', 'Franchise', 'Type', 'Scale', 'Material', 'Country/Region of Manufacture'],
  'Stamps':              ['Country/Region', 'Type', 'Year of Issue', 'Topic', 'Quality', 'Country/Region of Manufacture'],
  'Coins':               ['Country/Region', 'Denomination', 'Year', 'Composition', 'Grade', 'Certification', 'Country/Region of Manufacture'],
  'Records':             ['Artist', 'Format', 'Genre', 'Speed', 'Record Label', 'Edition', 'Grading', 'Country/Region of Manufacture']
```

## 変更2: IS_INITIAL_DATA に18カテゴリのフィールド定義を追加

既存の最後のエントリの後に追加。フォーマットは既存エントリに合わせる:

```javascript
  // === Kimono ===
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Kimono / Obi / Yukata / Hakama等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Cotton / Polyester' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: 'Floral / Geometric / Scenic等' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Season', field_type: 'recommended', priority: 6, notes: 'Spring / Summer / Fall / Winter' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Size', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Kimono', tag_jp: '着物,和装,振袖,留袖,訪問着,浴衣,帯,袴', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 8, notes: '' },

  // === Japanese Swords ===
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Katana / Wakizashi / Tanto / Tachi / Tsuba等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Blade Length', field_type: 'required', priority: 2, notes: 'cm単位' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Era', field_type: 'recommended', priority: 3, notes: 'Edo / Meiji / Showa等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'School', field_type: 'recommended', priority: 4, notes: '流派' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Steel / Iron / Copper等' },
  { category: 'Japanese Swords', tag_jp: '日本刀,刀,脇差,短刀,太刀,刀装具,鍔,目貫,縁頭', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 6, notes: '' },

  // === Tea Ceremony ===
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Tea Bowl / Natsume / Tea Caddy / Chasen等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Ceramic / Lacquer / Bamboo / Iron' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Artist', field_type: 'recommended', priority: 3, notes: '作家名' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Style', field_type: 'recommended', priority: 4, notes: 'Raku / Hagi / Bizen等' },
  { category: 'Tea Ceremony', tag_jp: '茶道具,茶碗,茶入,棗,茶杓,水指,建水,風炉,釜', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 5, notes: '' },

  // === Bonsai ===
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Pot / Tool / Wire / Soil等' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Ceramic / Clay / Stone' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Shape', field_type: 'recommended', priority: 5, notes: 'Round / Oval / Rectangle / Cascade' },
  { category: 'Bonsai', tag_jp: '盆栽,盆栽鉢,盆器,水石,盆景', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 6, notes: '' },

  // === Prints ===
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Listed By', field_type: 'required', priority: 1, notes: 'Dealer or Reseller / Private Listing' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Medium', field_type: 'required', priority: 2, notes: 'Woodblock / Lithograph / Screenprint' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Subject', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Artist', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Style', field_type: 'recommended', priority: 5, notes: 'Ukiyo-e / Shin-hanga / Sosaku-hanga' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Prints', tag_jp: '浮世絵,版画,木版画,リトグラフ,シルクスクリーン', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 7, notes: '' },

  // === Buddhist Art ===
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Statue / Scroll / Altar / Incense Burner等' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Wood / Bronze / Stone / Gold Leaf' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Era', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Buddhist Art', tag_jp: '仏像,仏具,仏教美術,神具,木彫,銅像', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 5, notes: '' },

  // === Tetsubin ===
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Tetsubin / Kyusu / Chagama' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cast Iron / Silver / Copper' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tetsubin', tag_jp: '鉄瓶,銀瓶,急須,南部鉄器,茶釜', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 5, notes: '' },

  // === Golf ===
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Club / Ball / Bag / Glove等' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Club Type', field_type: 'required', priority: 3, notes: 'Driver / Iron / Putter / Wedge / Wood / Hybrid' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Shaft Material', field_type: 'recommended', priority: 4, notes: 'Graphite / Steel' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Shaft Flex', field_type: 'recommended', priority: 5, notes: 'Regular / Stiff / Senior / Ladies' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Loft', field_type: 'recommended', priority: 6, notes: '角度' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Hand Orientation', field_type: 'recommended', priority: 7, notes: 'Right-Handed / Left-Handed' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Dexterity', field_type: 'recommended', priority: 8, notes: 'Right-Handed / Left-Handed' },
  { category: 'Golf', tag_jp: 'ゴルフ,ゴルフクラブ,ドライバー,アイアン,パター,ウェッジ', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 9, notes: '' },

  // === Tennis ===
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Racquet / Ball / String / Grip等' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Head Size', field_type: 'recommended', priority: 3, notes: 'sq in' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Grip Size', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'String Pattern', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Weight', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Tennis', tag_jp: 'テニス,テニスラケット,ラケット', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 7, notes: '' },

  // === Baseball ===
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Glove / Bat / Ball / Helmet等' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Position', field_type: 'recommended', priority: 3, notes: 'Pitcher / Infield / Outfield / Catcher / First Base' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Hand Orientation', field_type: 'recommended', priority: 4, notes: 'Right-Hand Throw / Left-Hand Throw' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'Leather / Synthetic' },
  { category: 'Baseball', tag_jp: '野球,グローブ,グラブ,バット,ミット', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 7, notes: '' },

  // === Japanese Instruments ===
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Shamisen / Shakuhachi / Koto / Shinobue / Taiko' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Bamboo / Wood / Silk / Skin' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Size', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Japanese Instruments', tag_jp: '三味線,尺八,琴,篠笛,太鼓,和太鼓,雅楽', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 4, notes: '' },

  // === Fishing Rods ===
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Model', field_type: 'required', priority: 2, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Rod Type', field_type: 'required', priority: 3, notes: 'Spinning / Casting / Fly / Surf' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Length', field_type: 'recommended', priority: 4, notes: 'ft単位' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Power', field_type: 'recommended', priority: 5, notes: 'Ultra Light / Light / Medium / Heavy' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Action', field_type: 'recommended', priority: 6, notes: 'Fast / Moderate / Slow' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fishing Type', field_type: 'recommended', priority: 7, notes: 'Freshwater / Saltwater' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Fish Species', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Fishing Rods', tag_jp: '釣竿,ロッド,竿', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 9, notes: '' },

  // === RC & Models ===
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Car / Aircraft / Boat / Tank / Gundam等' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Scale', field_type: 'recommended', priority: 3, notes: '1/10 / 1/24 / 1/35等' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Fuel Type', field_type: 'recommended', priority: 4, notes: 'Electric / Nitro / Gas' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Color', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'RC & Models', tag_jp: 'ラジコン,RC,模型,プラモデル,ミニ四駆', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 6, notes: '' },

  // === Anime ===
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Character', field_type: 'required', priority: 2, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Franchise', field_type: 'required', priority: 3, notes: '作品名' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Poster / Keychain / Towel / Sticker等' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Material', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Anime', tag_jp: 'アニメ,アニメグッズ,漫画,マンガ', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 6, notes: '' },

  // === Figures ===
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Character', field_type: 'required', priority: 2, notes: '' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Franchise', field_type: 'required', priority: 3, notes: '作品名' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Action Figure / Statue / Nendoroid / Figma等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Scale', field_type: 'recommended', priority: 5, notes: '1/6 / 1/7 / 1/8等' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Material', field_type: 'recommended', priority: 6, notes: 'PVC / ABS / Resin' },
  { category: 'Figures', tag_jp: 'フィギュア,アクションフィギュア,スタチュー', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 7, notes: '' },

  // === Stamps ===
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Country/Region', field_type: 'required', priority: 1, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Commemorative / Definitive / Revenue等' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Year of Issue', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Topic', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Quality', field_type: 'recommended', priority: 5, notes: 'Mint / Used / Mint Never Hinged' },
  { category: 'Stamps', tag_jp: '切手,記念切手,普通切手', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 6, notes: '' },

  // === Coins ===
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Country/Region', field_type: 'required', priority: 1, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Denomination', field_type: 'required', priority: 2, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Year', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Gold / Silver / Copper / Bronze' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Grade', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Certification', field_type: 'recommended', priority: 6, notes: 'PCGS / NGC / Uncertified' },
  { category: 'Coins', tag_jp: 'コイン,古銭,硬貨,紙幣,メダル', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 7, notes: '' },

  // === Records ===
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Format', field_type: 'required', priority: 2, notes: 'LP / EP / Single / CD / Cassette' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Genre', field_type: 'recommended', priority: 3, notes: 'Rock / Jazz / Pop / Classical等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Speed', field_type: 'recommended', priority: 4, notes: '33 RPM / 45 RPM / 78 RPM' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Record Label', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Edition', field_type: 'recommended', priority: 6, notes: 'First Pressing / Reissue / Limited Edition' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Grading', field_type: 'recommended', priority: 7, notes: 'Mint / Near Mint / Very Good Plus等' },
  { category: 'Records', tag_jp: 'レコード,LP,EP,シングル,CD,カセット', field_name: 'Country/Region of Manufacture', field_type: 'recommended', priority: 8, notes: '' }
```

## 変更3: Library/Config_IS.gsにも同じ変更を反映

ルートのConfig_IS.gsと同じ変更をLibrary/Config_IS.gsにも適用する。
注意: Library版ではScriptPropertiesは使用禁止（DocumentPropertiesのみ）。今回の変更は定数定義のみなので問題なし。

## 注意事項
- 既存のエントリを変更・削除しない
- フォーマット（インデント、カンマ）を既存に合わせる
- IS_INITIAL_DATA内の最後のエントリにカンマを付けてから新規エントリを追加する
