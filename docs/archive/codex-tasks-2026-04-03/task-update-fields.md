# タスク: IS_CATEGORY_FIELDS 30カテゴリ更新 + Golf Heads新規追加

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`
- `Library/Config_IS.gs`
両方に同じ修正を適用する。

## 変更内容: IS_CATEGORY_FIELDS の各カテゴリを以下に置き換える

  'Necklaces': ['Style', 'Brand', 'Type', 'Color', 'Metal', 'Main Stone', 'Main Stone Color', 'Pendant Shape', 'Secondary Stone', 'Theme'],
  'Brooches': ['Type', 'Brand', 'Material', 'Color', 'Metal', 'Main Stone', 'Main Stone Color', 'Theme', 'Main Stone Shape', 'Country of Origin'],
  'Cufflinks': ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Material', 'Department', 'Main Stone Color', 'Country of Origin'],
  'Hair Accessories': ['Type', 'Brand', 'Color', 'Material', 'Department', 'Theme', 'Occasion', 'Hair Type', 'Features', 'Country of Origin'],
  'Dinnerware': ['Brand', 'Material', 'Type', 'Color', 'Pattern', 'Shape', 'Set Includes', 'Number of Place Settings', 'Theme', 'Country of Origin'],
  'Neckties': ['Brand', 'Color', 'Material', 'Type', 'Pattern', 'Style', 'Department', 'Item Width', 'Theme', 'Country of Origin'],
  'Handkerchiefs': ['Brand', 'Color', 'Material', 'Pattern', 'Style', 'Country of Origin', 'Gender', 'Occasion'],
  'Tie Accessories': ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Material', 'Department', 'Country of Origin'],
  'Glassware': ['Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Style', 'Pattern', 'Theme', 'Subject', 'Country of Origin'],
  'Snow Globes': ['Brand', 'Type', 'Material', 'Subject', 'Occasion', 'Collection', 'Year Manufactured', 'Features', 'Country of Origin'],
  'Boxes': ['Brand', 'Type', 'Material', 'Color', 'Suitable For', 'Shape', 'Features', 'Lining Material', 'Theme', 'Country of Origin'],
  'Flatware': ['Brand', 'Type', 'Pattern', 'Composition', 'Style', 'Age', 'Country of Origin'],
  'Baby': ['Brand', 'Type', 'Material', 'Color', 'Character', 'Country of Origin'],
  'Combs': ['Type', 'Brand', 'Color', 'Material', 'Theme', 'Department', 'Features', 'Country of Origin'],
  'Key Chains': ['Brand', 'Material', 'Color', 'Character Family', 'Theme', 'Era', 'Features', 'Country of Origin'],
  'Charms': ['Brand', 'Type', 'Metal', 'Metal Purity', 'Main Stone', 'Color', 'Theme', 'Pendant Shape', 'Country of Origin'],
  'Pipes': ['Brand', 'Body Shape', 'Material', 'Filter Size', 'Handmade', 'Country of Origin'],
  'Musical Instruments': ['Brand', 'Type', 'Model', 'Body Color', 'Body Type', 'String Configuration', 'Handedness', 'Model Year', 'Number of Frets', 'Country of Origin'],
  'Pens': ['Brand', 'Material', 'Ink Color', 'Nib Size', 'Nib Material', 'Type', 'Vintage', 'Features', 'Country of Origin'],
  'Wallets': ['Brand', 'Type', 'Material', 'Color', 'Style', 'Department', 'Features', 'Theme', 'Country of Origin'],
  'Lighters': ['Brand', 'Type', 'Material', 'Color', 'Country of Origin'],
  'Art': ['Artist', 'Production Technique', 'Style', 'Subject', 'Theme', 'Size', 'Material', 'Original/Licensed Reproduction', 'Time Period Produced', 'Country of Origin'],
  'Pottery': ['Brand', 'Type', 'Material', 'Color', 'Production Technique', 'Style', 'Pattern', 'Theme', 'Country of Origin'],
  'Belts': ['Brand', 'Type', 'Material', 'Color', 'Size', 'Department', 'Style', 'Theme', 'Country of Origin'],
  'Belt Buckles': ['Brand', 'Type', 'Material', 'Color', 'Style', 'Department', 'Fits Belt Width', 'Pattern', 'Theme', 'Country of Origin'],
  'Golf': ['Brand', 'Golf Club Type', 'Handedness', 'Model', 'Flex', 'Shaft Material', 'Loft', 'Club Number', 'Set Makeup', 'Department'],
  'Baseball': ['Brand', 'Handedness', 'Player Position', 'Size', 'Type', 'Material', 'Color', 'Sport/Activity', 'Country of Origin', 'Model Year'],
  'Fishing Rods': ['Brand', 'Rod Type', 'Model', 'Item Length', 'Rod Power', 'Rod Action', 'Fish Species', 'Fishing Type', 'Material', 'Lure Weight'],
  'Figures': ['Franchise', 'Character', 'Type', 'Brand', 'Scale', 'Material', 'Theme', 'Original/Licensed Reproduction', 'Series', 'Vintage'],
  'Records': ['Artist', 'Release Title', 'Genre', 'Record Grading', 'Record Label', 'Format', 'Record Size', 'Release Year', 'Sleeve Grading', 'Country of Origin'],

## 新規追加: Golf Heads
`'Belt Buckles'` の行の後に以下を追加:
  'Golf Heads':          ['Brand', 'Golf Club Type', 'Loft', 'Handedness', 'Material', 'Model', 'Lie Angle', 'Head Shape', 'Bounce', 'Country of Origin'],

## IS_TAG_TO_CATEGORY に追加
Belt Bucklesのタグマッピングの後に以下を追加:
// Golf Heads
IS_TAG_TO_CATEGORY['ゴルフヘッド'] = 'Golf Heads';

## 注意
- 上記に含まれないカテゴリ（Watches, Rings, Earrings等）は変更しない
- フォーマットを既存に合わせる
- 必ずルートとLibrary両方を修正する
