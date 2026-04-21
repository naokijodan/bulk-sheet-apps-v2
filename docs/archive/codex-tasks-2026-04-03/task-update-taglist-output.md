# タスク: outputTagListSheet_() をタグ別・フィールド付き出力に改修

## 対象ファイル
- `ItemSpecifics/Config_IS.gs` の `outputTagListSheet_()` 関数（3451行目付近）
- `Library/Config_IS.gs` にも同じ修正を適用

## 現在の出力形式
A=代表タグ, B=eBayカテゴリ, C=同カテゴリの他のタグ, D=対応状況, E=説明
→ 1カテゴリにつき代表タグ1行

## 新しい出力形式
A=タグ, B=eBayカテゴリ, C=対応状況, D〜M=Field1〜Field10
→ **タグごとに1行**（全タグを展開）

## 具体的な修正内容

### 1. categoryGroups に新カテゴリを追加

既存のグループに以下を追加:

Hobby グループに追加:
  {cat: 'Figures', desc: 'フィギュア・アクションフィギュア・スタチュー'},
  {cat: 'Anime', desc: 'アニメグッズ・漫画'},
  {cat: 'RC & Models', desc: 'ラジコン・模型・プラモデル'},
  {cat: 'Stamps', desc: '切手・記念切手'},
  {cat: 'Coins', desc: 'コイン・古銭・硬貨'},
  {cat: 'Records', desc: 'レコード・LP・CD'},

新グループ「Japanese Traditional（日本伝統）」を追加（Writing & Smokingの前に）:
  {group: 'Japanese Traditional（日本伝統）', categories: [
    {cat: 'Kimono', desc: '着物・和装・振袖・浴衣・帯'},
    {cat: 'Japanese Swords', desc: '日本刀・脇差・短刀・鍔'},
    {cat: 'Tea Ceremony', desc: '茶道具・茶碗・棗・茶杓'},
    {cat: 'Bonsai', desc: '盆栽・盆栽鉢・水石'},
    {cat: 'Prints', desc: '浮世絵・版画・木版画'},
    {cat: 'Buddhist Art', desc: '仏像・仏具・仏教美術'},
    {cat: 'Tetsubin', desc: '鉄瓶・銀瓶・南部鉄器'},
    {cat: 'Japanese Instruments', desc: '三味線・尺八・琴・和太鼓'}
  ]}

新グループ「Sports（スポーツ）」を追加（Japanese Traditionalの前に）:
  {group: 'Sports（スポーツ）', categories: [
    {cat: 'Golf', desc: 'ゴルフクラブ（完成品）'},
    {cat: 'Golf Heads', desc: 'ゴルフヘッド（単体）'},
    {cat: 'Tennis', desc: 'テニスラケット'},
    {cat: 'Baseball', desc: '野球グローブ・バット'},
    {cat: 'Fishing Rods', desc: '釣竿・ロッド'},
    {cat: 'Fishing Reels', desc: '釣りリール'}
  ]}

注意: Fishing ReelsはHobbyグループから削除してSportsに移動。ArtはHobbyに残す。

### 2. ヘッダー変更

変更前:
```javascript
var headers = ['タグ（入力用）', 'eBayカテゴリ', '同カテゴリの他のタグ', '対応状況', '説明'];
```

変更後:
```javascript
var headers = ['タグ（入力用）', 'eBayカテゴリ', '対応状況', 'Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5', 'Field 6', 'Field 7', 'Field 8', 'Field 9', 'Field 10'];
```

### 3. データ出力ロジック変更

変更前（1カテゴリ1行、代表タグのみ）:
```javascript
var representativeTag = tags[0];
var otherTags = tags.slice(1).join('、');
sh.getRange(currentRow, 1).setValue(representativeTag);
sh.getRange(currentRow, 2).setValue(catName);
sh.getRange(currentRow, 3).setValue(otherTags);
sh.getRange(currentRow, 4).setValue(status);
sh.getRange(currentRow, 5).setValue(catDef.desc);
// 色分け...
currentRow++;
```

変更後（タグごとに1行、フィールド付き）:
```javascript
// IS_CATEGORY_FIELDSからフィールド取得
var fields = IS_CATEGORY_FIELDS[catName] || [];

for (var t = 0; t < tags.length; t++) {
  var tag = tags[t];
  sh.getRange(currentRow, 1).setValue(tag);
  sh.getRange(currentRow, 2).setValue(catName);
  sh.getRange(currentRow, 3).setValue(status);

  // Field 1〜10
  for (var f = 0; f < 10; f++) {
    if (f < fields.length) {
      sh.getRange(currentRow, 4 + f).setValue(fields[f]);
    }
  }

  // 対応状況で色分け
  if (hasSanitize && hasIS) {
    sh.getRange(currentRow, 3).setFontColor('#137333');
  } else if (hasIS) {
    sh.getRange(currentRow, 3).setFontColor('#b06000');
  } else {
    sh.getRange(currentRow, 3).setFontColor('#999999');
  }

  currentRow++;
}
```

### 4. 列幅調整の変更

変更後:
```javascript
sh.setColumnWidth(1, 160);  // タグ
sh.setColumnWidth(2, 180);  // カテゴリ
sh.setColumnWidth(3, 140);  // 対応状況
for (var w = 4; w <= 13; w++) {
  sh.setColumnWidth(w, 160);  // Field 1-10
}
```

### 5. フィルター範囲の変更

```javascript
sh.getRange(1, 1, currentRow - 1, headers.length).createFilter();
```

### 6. 説明行（2行目）の変更

変更後:
```javascript
sh.getRange(2, 1).setValue('↓ A列のタグをコピーして出品シートのA列に貼り付けてください。D〜M列は対応するItem Specificsフィールドです。');
```

## 注意
- 既存の関数全体を書き換える（関数名は維持）
- IS_TAG_TO_CATEGORYの逆引きロジックは維持
- 交通整理/IS対応判定ロジックは維持
- 必ずルートとLibrary両方を修正
- パフォーマンス: setValues()を使って一括書き込みにすると良いが、既存コードに合わせてgetRange().setValue()でもOK
