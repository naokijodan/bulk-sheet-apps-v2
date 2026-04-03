# タスク: 18カテゴリのタグマッピング追加 + 既存マッピング修正

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`
- `Library/Config_IS.gs`
両方に同じ修正を適用する。

## 変更1: IS_TAG_TO_CATEGORY に新カテゴリのタグマッピングを追加

`// Belts` セクションの後（Belt Bucklesの行の後）に以下を追加:

```javascript
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
```

## 変更2: 既存マッピングの修正

上記の追加コードが後から実行されるため、以下の既存マッピングは自動的に上書きされる:
- `'フィギュア': 'Collectibles'`（2571行目）→ 後からFiguresに上書きされる
- `'浮世絵': 'Art'`, `'版画': 'Art'`, `'木版画': 'Art'`, `'リトグラフ': 'Art'`（2631-2634行目）→ 後からPrintsに上書きされる
- `'茶道具': 'Pottery'`（2639行目）→ 後からTea Ceremonyに上書きされる
- `'急須': 'Pottery'`（2640行目）→ 後からTetsubinに上書きされる

JavaScriptのオブジェクトプロパティは後から代入すれば上書きされるので、既存行を削除する必要はない。ただし分かりやすさのため、既存行の該当エントリにコメントを追加:
- 2571行目: `'フィギュア': 'Collectibles'` の後にコメント `// → Figuresで上書き`
- 2631行目の`'浮世絵'`の前にコメント `// 浮世絵・版画・木版画・リトグラフ → Printsで上書き`
- 2639行目の`'茶道具'`の前にコメント `// 茶道具 → Tea Ceremonyで上書き`
- 2640行目の`'急須'`の前にコメント `// 急須 → Tetsubinで上書き`

## 注意
- 既存のIS_CATEGORY_FIELDSやIS_INITIAL_DATAは変更しない
- フォーマットを既存に合わせる（IS_TAG_TO_CATEGORY['xxx'] = 'YYY'; の形式）
- 必ずルートとLibrary両方を修正する
