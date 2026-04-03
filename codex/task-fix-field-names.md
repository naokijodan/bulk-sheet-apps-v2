# タスク: API検証に基づくフィールド名修正

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`
- `Library/Config_IS.gs`
両方に同じ修正を適用する。

## 修正内容

### IS_CATEGORY_FIELDS の修正

1. **Golf** (9→8フィールドに): `Hand Orientation`と`Dexterity`を削除、`Handedness`を追加。`Shaft Flex`→`Flex`。`Club Type`→`Golf Club Type`
   変更前: `['Brand', 'Type', 'Club Type', 'Shaft Material', 'Shaft Flex', 'Loft', 'Hand Orientation', 'Dexterity', 'Country/Region of Manufacture']`
   変更後: `['Brand', 'Type', 'Golf Club Type', 'Shaft Material', 'Flex', 'Loft', 'Handedness', 'Country/Region of Manufacture']`

2. **Fishing Rods**: `Power`→`Rod Power`, `Action`→`Rod Action`, `Length`→`Item Length`
   変更前: `['Brand', 'Model', 'Rod Type', 'Length', 'Power', 'Action', 'Fishing Type', 'Fish Species', 'Country/Region of Manufacture']`
   変更後: `['Brand', 'Model', 'Rod Type', 'Item Length', 'Rod Power', 'Rod Action', 'Fishing Type', 'Fish Species', 'Country/Region of Manufacture']`

3. **Baseball**: `Hand Orientation`→`Handedness`, `Position`→`Player Position`
   変更前: `['Brand', 'Type', 'Position', 'Hand Orientation', 'Size', 'Material', 'Country/Region of Manufacture']`
   変更後: `['Brand', 'Type', 'Player Position', 'Handedness', 'Size', 'Material', 'Country/Region of Manufacture']`

4. **Stamps**: `Country/Region`→`Certification`
   変更前: `['Country/Region', 'Type', 'Year of Issue', 'Topic', 'Quality', 'Country/Region of Manufacture']`
   変更後: `['Certification', 'Type', 'Year of Issue', 'Topic', 'Quality', 'Country/Region of Manufacture']`

5. **Coins**: `Country/Region`→`Certification`
   変更前: `['Country/Region', 'Denomination', 'Year', 'Composition', 'Grade', 'Certification', 'Country/Region of Manufacture']`
   変更後: `['Certification', 'Denomination', 'Year', 'Composition', 'Grade', 'Country/Region of Manufacture']`

6. **Records**: `Grading`→`Record Grading`, `Speed`→`Record Size`
   変更前: `['Artist', 'Format', 'Genre', 'Speed', 'Record Label', 'Edition', 'Grading', 'Country/Region of Manufacture']`
   変更後: `['Artist', 'Format', 'Genre', 'Record Size', 'Record Label', 'Edition', 'Record Grading', 'Country/Region of Manufacture']`

7. **Japanese Swords**: `Blade Length`→`Blade Material`, `Era`→`Original/Reproduction`, `School`→`Handedness`
   変更前: `['Type', 'Blade Length', 'Era', 'School', 'Material', 'Country/Region of Manufacture']`
   変更後: `['Type', 'Blade Material', 'Original/Reproduction', 'Handedness', 'Material', 'Country/Region of Manufacture']`

8. **Kimono**: `Pattern`→`Style`（APIにPatternがないため）
   変更前: `['Brand', 'Type', 'Material', 'Color', 'Pattern', 'Season', 'Size', 'Country/Region of Manufacture']`
   変更後: `['Brand', 'Type', 'Material', 'Color', 'Style', 'Season', 'Size', 'Country/Region of Manufacture']`

9. **Prints**: `Artist`→`Maker`
   変更前: `['Listed By', 'Medium', 'Subject', 'Artist', 'Style', 'Size', 'Country/Region of Manufacture']`
   変更後: `['Listed By', 'Medium', 'Subject', 'Maker', 'Style', 'Size', 'Country/Region of Manufacture']`

10. **Tea Ceremony**: `Artist`→`Maker`
    変更前: `['Type', 'Material', 'Artist', 'Style', 'Country/Region of Manufacture']`
    変更後: `['Type', 'Material', 'Maker', 'Style', 'Country/Region of Manufacture']`

### IS_INITIAL_DATA の修正

各カテゴリの対応するfield_nameとnotesを同じように修正する。

- Golf: `Hand Orientation`と`Dexterity`の2エントリを削除し、`Handedness`を1エントリ追加。`Shaft Flex`→`Flex`、`Club Type`→`Golf Club Type`。priorityを振り直す。
- Fishing Rods: `Power`→`Rod Power`(notes維持), `Action`→`Rod Action`(notes維持), `Length`→`Item Length`(notes: 'ft単位'維持)
- Baseball: `Hand Orientation`→`Handedness`(notes維持), `Position`→`Player Position`(notes維持)
- Stamps: field_name `Country/Region`→`Certification`、notes: 'PCGS / NGC等'
- Coins: field_name `Country/Region`→`Certification`、notes: 'PCGS / NGC / Uncertified'。元の`Certification`エントリは削除。priorityを振り直す。
- Records: `Grading`→`Record Grading`(notes維持), `Speed`→`Record Size`(notes: '7" / 10" / 12"')
- Japanese Swords: `Blade Length`→`Blade Material`(notes: 'Steel / Iron / Copper等'), `Era`→`Original/Reproduction`(notes: 'Antique Original / Vintage Original / Contemporary'), `School`→`Handedness`(notes: '')。既存の`Material`エントリとの重複に注意: 元の`Material`フィールドを`Color`に変更(notes: '')
- Kimono: `Pattern`→`Style`(notes: 'Kimono / Obi / Yukata等のスタイル')
- Prints: `Artist`→`Maker`(notes: '作家名')
- Tea Ceremony: `Artist`→`Maker`(notes: '作家名')

## 注意
- 既存のフィールド以外は変更しない
- フォーマットを既存に合わせる
- 必ずルートとLibrary両方を修正する
