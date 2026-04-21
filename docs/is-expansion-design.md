# IS_CATEGORY_FIELDS 拡張設計書（10→最大20件）

## 日付: 2026-04-11
## ステータス: ユーザー承認待ち

---

## 1. 目的

EAGLEの登録上限が30件に拡張されたため、`IS_CATEGORY_FIELDS` を現状の10件から最大20件まで拡張する。eBay Taxonomy API の必須/推奨フィールドを優先的に採用し、出品品質を向上させる。

## 2. 今回のセッションで完了したこと

### 2.1 交通整理(EN)の式セット（実装済み・push済み）
- `コード_Part3` の `writeSettingsToSheet` に追加
- 出品用シート T2: `={"交通整理(EN)";ARRAYFORMULA('作業シート'!AW5:AW)}`
- 出品2シート AI2: `={"交通整理(EN)";ARRAYFORMULA('出品用シート'!T3:T)}`
- コミット: `be43fa9`

### 2.2 eBay Taxonomy API 調査（完了）
- 73カテゴリ中73件を調査（35件はリトライで正しいLeaf IDを取得）
- 結果JSON: `~/Desktop/eBayカテゴリ調査/is-survey-results.json` + `is-survey-retry-results.json`
- 可視化HTML: `~/Desktop/IS拡張調査レポート.html`

### 2.3 影響範囲調査（完了）
後述の §4 にまとめ

---

## 3. API調査結果サマリー

### 3.1 必須+推奨フィールド数の分布

| 必須+推奨 | カテゴリ数 | 例 |
|---|---|---|
| 20件以上 | 多数 | Watches(21), Necklaces(21), Action Figures(20) |
| 11〜19件 | 多数 | Dolls(17), Baby Clothing(16) |
| 6〜10件 | 一部 | Baby Toys(5), Japanese Dolls(0) |
| 0〜5件 | 一部 | 日本文化系（eBay側で定義が少ない） |

**結論**: 上限20にしても必須+推奨の全部は入らないカテゴリがある。優先順位をつけて取捨選択が必要。

### 3.2 子供向けカテゴリと年齢フィールド

| カテゴリ | 年齢フィールド | 種別 | 選択肢 |
|---|---|---|---|
| Baby Clothing (260024) | Department | Required | Unisex Baby & Toddler, Boys, Girls |
| Baby Toys (100227) | Age Level | Recommended | 0-6M, 6-12M, 12-18M, 18-24M, 2Y+ |
| Baby Toys (100227) | Recommended Age Range | Optional | - |
| Dolls & Playsets (262346) | Doll Age Group | Optional | - |
| Dolls & Playsets (262346) | Age Level | Optional | - |

**CPSC対応で追加すべきフィールド（2つ）:**
1. `Age Level` — 対象年齢層
2. `Recommended Age Range` — 推奨年齢範囲

これらは Baby、Dolls & Plush カテゴリに追加する。他の子供関連カテゴリ（Video Games, Figures, Trading Cards等）にはeBay側で年齢フィールドが定義されていない。

### 3.3 安全性フィールド

多くのカテゴリに `California Prop 65 Warning` が任意フィールドとして存在。CPSC対応とは直接関係ないが、将来的に追加を検討する余地あり。

---

## 4. 影響範囲（変更が必要なファイル）

### 4.1 最重要（列ズレ対応）

| ファイル | 行 | 現在 | 変更内容 |
|---|---|---|---|
| `Config_IS.gs` | L25 | `CONFIRMED_EN: 35` | 動的計算: `ITEM_SPECIFICS_START + (MAX_FIELDS * 2)` |
| `Library/Config_IS.gs` | L25 | 同上 | 同期 |
| `ItemSpecifics.gs` | L1119, L1246, L1361 | `|| 35` フォールバック | `IS_CONFIG.COLUMNS.CONFIRMED_EN` のみ参照に変更 |
| `Library/ItemSpecifics.gs` | 同上 | 同上 | 同期 |
| `コード_Part3` | L3553 | 出品2 AI2の式 | 列番号を動的に算出して式をセット |
| `Library/コード_Part3` | 同上 | 同上 | 同期 |

### 4.2 IS定義の更新

| ファイル | 内容 |
|---|---|
| `Config_IS.gs` L4086-4159 | `IS_CATEGORY_FIELDS` の各カテゴリのフィールド配列を拡張 |
| `Library/Config_IS.gs` | 同期 |

### 4.3 交通整理との整合

| ファイル | 内容 |
|---|---|
| `Sanitize.gs` L15-81 | `SANITIZE_FIELDS_` にフィールドが追加される場合は更新 |
| `Sanitize.gs` L86-900+ | `CATEGORY_RULES_` にルール追加が必要な場合 |
| `Library/Sanitize.gs` | 同期 |

### 4.4 変更不要

- IS出力開始列（N列=14固定）
- `writeItemSpecificsToSheet_()` — 動的に flat.length まで書く
- `readExistingSpecifics_()` — 動的に lastCol まで読む
- Translation.gs、AI.gs — IS列を直接参照していない
- Config.gs の作業シート列定義（AW列=49等）

---

## 5. 設計方針

### 5.1 MAX_FIELDS 定数の導入

```javascript
// Config_IS.gs に追加
var IS_MAX_FIELDS = 20;  // IS_CATEGORY_FIELDS の最大フィールド数

var IS_CONFIG = {
  COLUMNS: {
    ITEM_SPECIFICS_START: 14,  // N列
    CONFIRMED_EN: 14 + (IS_MAX_FIELDS * 2) + 1,  // IS出力の直後
    // 20フィールド → 14 + 40 + 1 = 55列目
  }
};
```

### 5.2 出品2シートの列レイアウト（変更後）

```
N列(14) 〜 BA列(53): IS出力（20フィールド × 2列 = 40列）
  N列: フィールド名1, O列: 値1
  P列: フィールド名2, Q列: 値2
  ...
  AZ列: フィールド名20, BA列: 値20
BB列(54): （空き or 将来用）
BC列(55): CONFIRMED_EN（交通整理英語版確定値）
```

**現在（10フィールド）:**
```
N〜AG列: IS出力（10×2=20列）
AH列(34): 空き
AI列(35): CONFIRMED_EN
```

### 5.3 出品2 AI2の式の動的生成

`コード_Part3` の `writeSettingsToSheet` 内で、`IS_MAX_FIELDS` から列番号を算出して式をセットする:

```javascript
// 交通整理(EN)の式を設定
var listingSheet = ss.getSheetByName('出品用シート');
if (listingSheet) {
  listingSheet.getRange('T2').setFormula('={"交通整理(EN)";ARRAYFORMULA(\'作業シート\'!AW5:AW)}');
}
var listing2Sheet = ss.getSheetByName('出品2');
if (listing2Sheet) {
  // CONFIRMED_EN列をアルファベットに変換してセット
  var confirmedCol = IS_CONFIG.COLUMNS.CONFIRMED_EN;
  var colLetter = columnToLetter_(confirmedCol);
  listing2Sheet.getRange(colLetter + '2').setFormula(
    '={"交通整理(EN)";ARRAYFORMULA(\'出品用シート\'!T3:T)}'
  );
}
```

### 5.4 フィールド追加の優先順位

1. **eBay必須（Required）** — 必ず含める
2. **eBay推奨（Recommended）で、V3に未追加のもの** — 優先的に追加
3. **V3で既に定義済みのカスタムフィールド** — 維持
4. **CPSC対応フィールド（Age Level等）** — 子供関連カテゴリに追加

---

## 6. 実装ステップ（ハーネスモード推奨）

### Phase 1: 列レイアウト変更（最重要・先にやる）
1. `IS_MAX_FIELDS` 定数を導入
2. `CONFIRMED_EN` を動的計算に変更
3. `|| 35` フォールバックを除去
4. 出品2 AI2の式を動的生成に変更
5. Library同期
6. **テスト**: 既存10フィールドのまま動くことを確認（回帰テスト）

### Phase 2: フィールド追加
1. API調査結果をもとに、73カテゴリのフィールドを見直し
2. `IS_CATEGORY_FIELDS` を更新（最大20件）
3. `SANITIZE_FIELDS_` / `CATEGORY_RULES_` の整合確認
4. Library同期

### Phase 3: CPSC対応
1. Baby、Dolls & Plush に `Age Level` / `Recommended Age Range` を追加
2. 将来的に子供向け商品の出品ワーニングを検討

---

## 7. ユーザー承認待ちの確認事項

1. **最大フィールド数**: 20件で確定か？（API調査の結果、15でも実用上十分なカテゴリもある）
2. **Phase分けの進め方**: Phase 1（列レイアウト変更）を先にやって動作確認するか、一気にやるか
3. **作業モード**: ハーネスモードで進めるか
4. **HTMLレポートの内容確認**: `~/Desktop/IS拡張調査レポート.html` を見て、フィールドの取捨選択に意見があるか

---

## 8. リスク

| リスク | 影響 | 対策 |
|---|---|---|
| 列ズレで既存データが壊れる | 出品2の既存ISデータがズレる | Phase 1で列レイアウトだけ変更→既存10件で動作確認 |
| SANITIZE_FIELDS_との不整合 | 交通整理の精度低下 | フィールド追加時にSANITIZE_FIELDS_も同時更新 |
| 出品用シートのT列の式が壊れる | 交通整理(EN)が出品2に届かない | 動的列番号算出で自動対応 |
| clasp push漏れ | 本番に反映されない | Library同期チェックリスト厳守 |
