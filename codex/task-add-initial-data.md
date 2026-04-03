# タスク: IS_INITIAL_DATA に26カテゴリ分を追加

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`
- `Library/Config_IS.gs`
両方に同じ修正を適用する。

## 変更内容
IS_INITIAL_DATA配列の最後のエントリ（Recordsの最後の行）の後、`];` の前に以下を追加:

```javascript
  // === Necklaces ===
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Style', field_type: 'required', priority: 1, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Brand', field_type: 'required', priority: 2, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Type', field_type: 'required', priority: 3, notes: 'Necklace / Pendant / Chain等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Metal', field_type: 'required', priority: 5, notes: 'Gold / Silver / Platinum等' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Main Stone Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Pendant Shape', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Secondary Stone', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Necklaces', tag_jp: 'ネックレス,ペンダント,チェーン', field_name: 'Theme', field_type: 'recommended', priority: 10, notes: '' },

  // === Brooches ===
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Brooch / Pin' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Brand', field_type: 'required', priority: 2, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Material', field_type: 'required', priority: 3, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Metal', field_type: 'recommended', priority: 5, notes: 'Gold / Silver等' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Color', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Main Stone Shape', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Brooches', tag_jp: 'ブローチ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Cufflinks ===
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '18k / 14k / 925等' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Department', field_type: 'recommended', priority: 8, notes: 'Men / Women' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Main Stone Color', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Cufflinks', tag_jp: 'カフリンクス,カフリンク,カフスボタン', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Hair Accessories ===
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Comb / Clip / Pin / Headband等' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Material', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Department', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Theme', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Occasion', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Hair Type', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Features', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Hair Accessories', tag_jp: '髪飾り,ヘアアクセサリー,かんざし,バレッタ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Dinnerware ===
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Material', field_type: 'required', priority: 2, notes: 'Porcelain / Ceramic / Stoneware等' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Type', field_type: 'required', priority: 3, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Shape', field_type: 'recommended', priority: 6, notes: 'Round / Square / Oval' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Set Includes', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Number of Place Settings', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Dinnerware', tag_jp: '皿,プレート,食器,茶碗,カップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Neckties ===
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Silk / Polyester等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Type', field_type: 'required', priority: 4, notes: 'Necktie / Bow Tie等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Pattern', field_type: 'recommended', priority: 5, notes: 'Solid / Striped / Paisley等' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Department', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Item Width', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Neckties', tag_jp: 'ネクタイ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Handkerchiefs ===
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Color', field_type: 'required', priority: 2, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Cotton / Linen / Silk等' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Pattern', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Gender', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Handkerchiefs', tag_jp: 'ハンカチ', field_name: 'Occasion', field_type: 'recommended', priority: 8, notes: '' },

  // === Tie Accessories ===
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Tie Clip / Tie Pin / Tie Bar' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Material', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Department', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Tie Accessories', tag_jp: 'ネクタイピン,タイピン,タイバー,スカーフリング', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Glassware ===
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Figurine等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Glass / Crystal等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: 'Blown / Cut / Pressed等' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Pattern', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Subject', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Glassware', tag_jp: 'ガラス細工,クリスタル,花瓶,オブジェ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Snow Globes ===
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Material', field_type: 'recommended', priority: 3, notes: 'Glass / Plastic' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Subject', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Occasion', field_type: 'recommended', priority: 5, notes: 'Christmas / Birthday等' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Collection', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Year Manufactured', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Features', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Snow Globes', tag_jp: 'スノードーム,ガラスドーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Boxes ===
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Jewelry Box / Watch Box等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Wood / Leather / Velvet等' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Suitable For', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Shape', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Lining Material', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Boxes', tag_jp: 'ジュエリーボックス,時計ケース,ウォッチボックス,宝石箱', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Flatware ===
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Spoon / Fork / Knife / Set等' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Pattern', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Composition', field_type: 'recommended', priority: 4, notes: 'Sterling Silver / Silverplate / Stainless Steel' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Age', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Flatware', tag_jp: 'カトラリー,スプーン,フォーク,ナイフ', field_name: 'Country of Origin', field_type: 'recommended', priority: 7, notes: '' },

  // === Baby ===
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Material', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Character', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Baby', tag_jp: 'ベビー,ベビーシューズ,ラトル,ベビー用品', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Combs ===
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Type', field_type: 'required', priority: 1, notes: 'Comb / Pick等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Brand', field_type: 'recommended', priority: 2, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Material', field_type: 'required', priority: 4, notes: 'Wood / Horn / Plastic等' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Department', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Combs', tag_jp: '櫛,くし,コーム', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Key Chains ===
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Metal / Leather / Rubber等' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Color', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Character Family', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Era', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Key Chains', tag_jp: 'キーリング,キーホルダー,キーケース', field_name: 'Country of Origin', field_type: 'recommended', priority: 8, notes: '' },

  // === Charms ===
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal', field_type: 'required', priority: 3, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Metal Purity', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Main Stone', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Color', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Theme', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Pendant Shape', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Charms', tag_jp: 'チャーム,ペンダントトップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Pipes ===
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Body Shape', field_type: 'recommended', priority: 2, notes: 'Billiard / Bent / Apple等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Briar / Meerschaum等' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Filter Size', field_type: 'recommended', priority: 4, notes: '9mm / 6mm' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Handmade', field_type: 'recommended', priority: 5, notes: 'Yes / No' },
  { category: 'Pipes', tag_jp: 'パイプ,喫煙パイプ,煙管,キセル,パイプ・喫煙具', field_name: 'Country of Origin', field_type: 'recommended', priority: 6, notes: '' },

  // === Musical Instruments ===
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Electric Guitar / Acoustic Guitar / Bass等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Model', field_type: 'required', priority: 3, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Body Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Body Type', field_type: 'recommended', priority: 5, notes: 'Solid Body / Hollow Body / Semi-Hollow等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'String Configuration', field_type: 'recommended', priority: 6, notes: '6 String / 4 String等' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Handedness', field_type: 'recommended', priority: 7, notes: 'Right-Handed / Left-Handed' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Model Year', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Number of Frets', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Musical Instruments', tag_jp: '楽器,ギター,ベース,キーボード,シンセサイザー,バイオリン,フルート,サックス,トランペット,ドラム,ウクレレ,ハーモニカ,エフェクター,アンプ', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Pens ===
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Material', field_type: 'recommended', priority: 2, notes: 'Resin / Metal / Lacquer等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Ink Color', field_type: 'recommended', priority: 3, notes: 'Blue / Black / Red等' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Size', field_type: 'recommended', priority: 4, notes: 'Fine / Medium / Broad' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Nib Material', field_type: 'recommended', priority: 5, notes: 'Gold / Steel / Iridium' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Type', field_type: 'required', priority: 6, notes: 'Fountain Pen / Ballpoint / Rollerball' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Vintage', field_type: 'recommended', priority: 7, notes: 'Yes / No' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Features', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pens', tag_jp: '万年筆,ボールペン,ペン,シャープペンシル,筆記具,メカニカルペンシル', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Wallets ===
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Bifold / Trifold / Long / Card Case等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas等' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Department', field_type: 'recommended', priority: 6, notes: 'Men's / Women's' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Features', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Wallets', tag_jp: '財布,長財布,二つ折り財布,コインケース,カードケース,マネークリップ', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Lighters ===
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Type', field_type: 'recommended', priority: 2, notes: 'Pocket / Table / Pipe等' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Material', field_type: 'recommended', priority: 3, notes: 'Metal / Chrome / Brass' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Lighters', tag_jp: 'ライター,Zippo,ジッポ,オイルライター,ガスライター', field_name: 'Country of Origin', field_type: 'recommended', priority: 5, notes: '' },

  // === Art ===
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Artist', field_type: 'required', priority: 1, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Production Technique', field_type: 'required', priority: 2, notes: 'Oil / Watercolor / Acrylic / Mixed Media等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Style', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Subject', field_type: 'recommended', priority: 4, notes: 'Landscape / Portrait / Abstract等' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Theme', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Size', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Material', field_type: 'recommended', priority: 7, notes: 'Canvas / Paper / Board' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Original/Licensed Reproduction', field_type: 'recommended', priority: 8, notes: 'Original / Print / Reproduction' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Time Period Produced', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Art', tag_jp: '絵画,油絵,水彩画,掛軸', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Pottery ===
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Vase / Bowl / Plate / Figurine等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Porcelain / Stoneware / Earthenware等' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Production Technique', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Style', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Pattern', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Pottery', tag_jp: '陶磁器,陶器,磁器,焼物,壺', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Belts ===
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Type', field_type: 'required', priority: 2, notes: 'Casual / Dress / Reversible等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Leather / Canvas / Suede等' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Size', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Department', field_type: 'recommended', priority: 6, notes: 'Men's / Women's' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Style', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Theme', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Belts', tag_jp: 'ベルト,レザーベルト', field_name: 'Country of Origin', field_type: 'recommended', priority: 9, notes: '' },

  // === Belt Buckles ===
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Brand', field_type: 'recommended', priority: 1, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Type', field_type: 'required', priority: 2, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Material', field_type: 'required', priority: 3, notes: 'Metal / Silver / Brass等' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Color', field_type: 'recommended', priority: 4, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Style', field_type: 'recommended', priority: 5, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Department', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Fits Belt Width', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Pattern', field_type: 'recommended', priority: 8, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Theme', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Belt Buckles', tag_jp: 'ベルトバックル', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

  // === Golf Heads ===
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Brand', field_type: 'required', priority: 1, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Golf Club Type', field_type: 'required', priority: 2, notes: 'Driver / Iron / Putter / Wedge等' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Loft', field_type: 'recommended', priority: 3, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Handedness', field_type: 'required', priority: 4, notes: 'Right-Handed / Left-Handed' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Material', field_type: 'recommended', priority: 5, notes: 'Titanium / Stainless Steel / Carbon Steel' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Model', field_type: 'recommended', priority: 6, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Lie Angle', field_type: 'recommended', priority: 7, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Head Shape', field_type: 'recommended', priority: 8, notes: 'Blade / Mallet / Mid-mallet' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Bounce', field_type: 'recommended', priority: 9, notes: '' },
  { category: 'Golf Heads', tag_jp: 'ゴルフヘッド', field_name: 'Country of Origin', field_type: 'recommended', priority: 10, notes: '' },

```

## 注意
- 既存のIS_INITIAL_DATAエントリは変更しない
- Recordsの最後の行にカンマがなければ追加する
- 必ずルートとLibrary両方を修正する
