# Item Specifics 自動抽出スクリプト 設計書

## 作成日: 2026-03-02
## ステータス: 設計完了 → 実装待ち

---

## 概要

eBay一括出品シート（一般用V3）のタイトルとディスクリプションから、AIを使ってItem Specificsを自動抽出するGoogle Apps Scriptを開発する。

## 制約・方針

- **一般用V3シートの構造は一切変更しない**（多数に配布しているため）
- **ライブラリ化しない**（Library/フォルダには入れない）
- **自分専用のスクリプト**として一般用V3に追加
- **辞書シート（専用スプレッドシート）** を別途作成して参照

---

## アーキテクチャ

```
[一般用V3 シート]            ← 既存のまま触らない
  └ 出品2 タブ               ← 対象シート
      ↓ 読み取り（title, Condition/Description）
[Item Specifics スクリプト]   ← 新規GAS（ライブラリ化しない）
      ↓ 参照
[辞書シート]                  ← 専用スプレッドシート（独立）
      ↓
[Item Specifics列に書き込み]  ← 出品2タブのN列以降
```

---

## 出品2シートの列構成（2行目ヘッダー）

| 列 | ヘッダー |
|----|---------|
| A | タグ |
| B | テンプレ |
| C | 参考ebayID |
| D | 仕入先 |
| E | 仕入先コード |
| F | 出品価格 |
| G | title |
| H | label |
| I | offer了承金額 |
| J | offer拒否金額 |
| K | private_listing |
| L | Condition/DIscription |
| M | shipping policy |
| N〜 | Item Specifics（C:Brand, C:Style, C:Country of origin 等） |

※ N列以降のItem Specificsヘッダーは、辞書に基づいてスクリプトが動的に対応する

---

## 処理フロー

```
1. A列（タグ）を読み取り（日本語: 時計, リング, ネックレス 等）
     ↓
2. AIがタグをeBayカテゴリに自動マッピング
   （辞書のTag_JPをヒントに、完全一致でなくてもAIが判定）
     ↓
3. 辞書シートからそのカテゴリのItem Specificsリストを取得
   （required + recommended）
     ↓
4. AIがtitle（G列）+ description（L列）から
   リストの各項目の値を抽出
     ↓
5. 抽出結果をシートのItem Specifics列に書き込み
   - 確実に取れたもの → 値を入力
   - 不確実なもの → 空欄（null）
   - 必須項目で不明 → "Does not apply" or "Unbranded"
```

---

## 辞書シートの設計

### 専用スプレッドシートとして独立して作成

### テーブル構造

| Column | 内容 | 例 |
|--------|------|-----|
| Category | eBayカテゴリ名（英語） | Watches, Rings, Necklaces |
| Tag_JP | 対応する日本語タグ（カンマ区切り） | 時計,腕時計,ウォッチ,懐中時計 |
| Field_Name | Item Specifics項目名 | Brand, Reference Number, Movement |
| Field_Type | required / recommended | required |
| Priority | 表示優先順位 | 1, 2, 3... |
| Notes | AIへのヒント・注意事項 | "製造国を指定（本社ではない）" |

### 初期データ（カテゴリ一覧）

Gemini調査に基づく主要カテゴリ:

1. **Watches（時計）**
   - required: Brand, Reference Number, Model, Type, Case Material, Band Material, Department
   - recommended: Movement, Dial Color, Case Size, Year Manufactured, Water Resistance, Country of Origin, With Papers, With Original Box

2. **Rings（リング・指輪）**
   - required: Brand, Metal, Metal Purity, Main Stone, Type, Ring Size
   - recommended: Cut Grade, Main Stone Color, Main Stone Creation, Setting Style, Country of Origin

3. **Necklaces & Pendants（ネックレス）**
   - required: Brand, Metal, Metal Purity, Main Stone, Type
   - recommended: Chain Length, Chain Type, Setting Style, Country of Origin

4. **Bracelets（ブレスレット）**
   - required: Brand, Metal, Metal Purity, Main Stone, Type
   - recommended: Length, Closure, Setting Style, Country of Origin

5. **Earrings（ピアス・イヤリング）**
   - required: Brand, Metal, Metal Purity, Main Stone, Type
   - recommended: Fastening, Setting Style, Country of Origin

6. **Handbags（バッグ）**
   - required: Brand, Exterior Color, Exterior Material, Style, Department
   - recommended: Pattern, Handle/Strap Material, Lining Material, Hardware Color, Bag Width, Bag Height, Bag Depth, Country of Origin

7. **Clothing（衣類）**
   - required: Brand, Size, Size Type, Color, Department, Type, Style
   - recommended: Material, Pattern, Sleeve Length, Closure, Fabric Type, Country of Origin

8. **Cameras（カメラ）**
   - required: Brand, Model, Type, Series, Color
   - recommended: Maximum Resolution, Connectivity, Battery Type, Features, Lens Mount, Country of Origin

9. **Electronics（電子機器）**
   - required: Brand, Model, Type, Color
   - recommended: Connectivity, Features, Screen Size, Country of Origin

10. **Trading Cards（トレカ）**
    - required: Game, Set, Character, Card Name, Specialty, Card Number, Finish
    - recommended: Language, Graded, Grade, Professional Grader, Rarity, Features

11. **Shoes（靴）**
    - required: Brand, US Shoe Size, Color, Type, Department, Style
    - recommended: Material, Width, Pattern, Country of Origin

12. **Collectibles（コレクティブル）**
    - required: Brand, Type
    - recommended: Theme, Material, Country of Origin, Year, Features

---

## Item Specifics CSVフォーマット

- eBayのCSVインポートでは `C:Brand` 形式（`C:` プレフィックス付き）
- 一般用V3のシートではヘッダーが `C:Brand=` や `Brand` の可能性あり
- スクリプトはヘッダー行を読み取って動的に対応する

---

## Country of Origin 判定ルール

- **製造国を指定**（ブランド本社所在国ではない）
- フォーマット: フルネーム英語（"Japan", "Switzerland", "France"）
- ブランドから推定可能な場合はAIが判定:
  - Rolex, Omega → Switzerland
  - Hermes, Louis Vuitton → France
  - Gucci, Prada → Italy
  - Vivienne Westwood → UK
  - Seiko, Casio → Japan
- 不明な場合は空欄

---

## AIプロンプト設計方針

### 抽出プロンプトの構造
```
あなたはeBayのItem Specifics抽出エキスパートです。
以下のタイトルと説明文から、指定されたItem Specificsを抽出してください。

【カテゴリ】: {category}
【抽出対象項目】: {field_list}
【タイトル】: {title}
【説明文】: {description}

ルール:
- 値はeBayの推奨値に正規化（例: NavyよりBlue）
- 不確実な項目はnullを返す
- Country of Originは製造国（ブランド本社ではない）
- 単位は正確に（mm, cm等を混同しない）
- JSON形式で返す
```

### AIが間違えやすい項目への対策
- Material: メイン素材のみを抽出（トリム素材と混同しない）
- Condition: eBayの公式グレードに正規化
- 単位: mm/cm/inch の正規化ルールを明示
- Country of Origin: 製造国と本社所在国の区別を明示

---

## スクリプト構成（ファイル分割案）

```
ItemSpecifics/
├── DESIGN.md              ← この設計書
├── ItemSpecifics.gs       ← メインスクリプト（メニュー追加、実行ロジック）
├── Dictionary.gs          ← 辞書シートの読み込み・管理機能
├── AIExtractor.gs         ← AI API呼び出し・プロンプト生成・レスポンス解析
└── Config_IS.gs           ← 設定（辞書シートID、API設定等）
```

---

## 辞書管理機能

スクリプトに含める辞書管理機能:
- カテゴリ追加
- Item Specifics項目の追加・編集・削除
- タグ（Tag_JP）の追加・編集
- 辞書のバリデーション（重複チェック等）
- メニューから操作可能

---

## 既存AI.gsとの関係

- 既存の `AI.gs` は翻訳・タイトル生成用（OpenAI API呼び出し）
- Item Specificsスクリプトも同じOpenAI APIキーを使用
- ただし既存コードには依存しない独立したスクリプトとして実装
- APIキーは DocumentProperties から取得（既存と同じ方法）

---

## 3者協議（Claude + GPT + Gemini）による裏付け

### Cassiniアルゴリズムとの関係
- Item Specificsの充実がCassini評価に直結
- 特にモバイル検索ではItem Specificsがトップ表示される
- AI/ベクトル検索への移行で、構造化データの重要性が増大

### タイトル最適化との連動
- タイトルとItem Specificsの整合性がCassiniの信頼性スコアに影響
- タイトルに含めたキーワードがItem Specificsにも正確に入力されている場合、検索順位向上

### コンバージョン改善への寄与
- Item Specifics完全入力 → 検索フィルタに表示 → 露出増 → CTR/CVR向上
- バイヤーの比較検討段階での情報提供 → 購買決定の後押し
