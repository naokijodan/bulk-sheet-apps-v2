# ItemSpecifics × 交通整理 統合改修 設計書

## 3者協議日: 2026-03-30
## ステータス: 承認済み

---

## 1. 背景

### 問題
交通整理（Sanitize）がブランド、ロフト角等の構造化データを正しく抽出しているにもかかわらず、ItemSpecificsに反映されない。

**具体例（ゴルフ）:**
- 交通整理の出力: `ブランド: PING / ロフト角: 10° / モデル名: G400 LST / クラブタイプ: Driver`
- ItemSpecificsの結果: `Loft: Does not apply / Golf Club Type: Does not apply`

### 原因
1. SANITIZE_FIELDS_が5カテゴリしかない（時計、カメラ、トレカ、ゲーム機、リール）。62カテゴリ中57カテゴリが未対応
2. 交通整理の構造化データがItemSpecifics抽出に渡されていない
3. AIExtractorにゴルフ等のカテゴリ固有ルールがない
4. 出力漏れを検知する仕組みがない

### 3者協議の結論
- AIに「上書きするな」とプロンプトで頼むだけでは不十分。**プログラム側で確定値をロック**すべき
- 優先順位: 確定値ロック → バリデーション → カテゴリ拡充
- **ゴルフで全フローを1本通して検証**してから横展開する

---

## 2. 設計方針

### 全体フロー（改修後）

```
[交通整理（Sanitize）]
  ↓ 構造化データ（日本語）
  ↓ 例: ブランド: PING, ロフト角: 10°
  ↓
[FIELD_EN_TO_JP_で英語化]  ← 既存テーブルの逆引き
  ↓ 例: Brand: PING, Loft: 10°
  ↓
[確定値としてロック]  ← 新規: プログラム側で保持
  ↓
[AIExtractor]
  ↓ 確定値を「ALREADY CONFIRMED DATA」として渡す（既存の仕組み）
  ↓ AIは空フィールドだけ補完
  ↓
[マージ（プログラム側）]  ← 新規: 確定値があればAIの値を捨てる
  ↓
[バリデーション]  ← 新規: 重要フィールドの空チェック → 警告
  ↓
[出品シートに書き込み]
```

---

## 3. 改修内容（ゴルフで先行実装）

### 改修1: 確定値ロック（プログラム側マージ）

**目的:** 交通整理の結果をAIに上書きさせない

#### 1-A: 交通整理結果の取得・英語化

| ファイル | 修正内容 |
|----------|----------|
| `Sanitize.gs` | 交通整理済みの説明文（K列）から構造化データをパースする関数を追加 |

```
新規関数: extractConfirmedFields_(description)
- K列の「フィールド名: 値」形式をパースしてオブジェクト化
- 例: "ブランド: PING\nロフト角: 10°" → {ブランド: "PING", ロフト角: "10°"}
- 配置先: Sanitize.gs（交通整理の出力をパースする責務はSanitizeドメイン）
```

#### 1-B: 日本語→英語フィールド名変換

| ファイル | 修正内容 |
|----------|----------|
| `Sanitize.gs` | FIELD_EN_TO_JP_の逆引きで英語フィールド名に変換する関数を追加 |

```
新規関数: convertConfirmedToEnglish_(confirmedData)
- FIELD_EN_TO_JP_を逆引き（JP→EN）してキー名を英語化
- 例: {ブランド: "PING", ロフト角: "10°"} → {Brand: "PING", Loft: "10°"}
- 値はそのまま（ブランド名・数値等は英語/英数字のため）
- 配置先: Sanitize.gs（extractConfirmedFields_と同じモジュール）
```

#### 1-C: マージロジック

| ファイル | 修正内容 |
|----------|----------|
| `AIExtractor.gs` | extractItemSpecifics / extractItemSpecificsBatch のマージ処理を修正 |

```
既存: mergeResults_() または結果書き込み部分
修正: 確定値があるフィールドはAIの結果を無視
ロジック:
  for each field in IS_CATEGORY_FIELDS[category]:
    if (confirmedData[field] exists && confirmedData[field] !== ''):
      result[field] = confirmedData[field]  // 確定値を優先
    else:
      result[field] = aiResult[field]  // AIの値を使用
```

#### 1-D: 既存の「ALREADY CONFIRMED DATA」プロンプトとの連携

| ファイル | 修正内容 |
|----------|----------|
| `AIExtractor.gs` L366-382 | 交通整理の確定値をexistingDataとして渡す |

```
既存コード（L366-382）で「ALREADY CONFIRMED DATA」セクションとしてAIに渡す仕組みが既にある。
交通整理の結果をこのexistingDataに追加で渡す。
ただし、これはAI側への「お願い」であり、プログラム側のマージ（1-C）が本当のガード。
```

### 改修2: バリデーション（空チェック + 警告）

**目的:** 重要フィールドが空のまま出品されるのを防ぐ

| ファイル | 修正内容 |
|----------|----------|
| `ItemSpecifics.gs` | writeItemSpecificsToSheet_の後にバリデーション関数を追加 |

```
新規関数: validateItemSpecifics_(category, data)
- IS_CATEGORY_FIELDSの各フィールドをチェック
- 空 or "Does not apply" のフィールドを収集
- 必須フィールド（Brand, Type等）が空 → 警告表示
- 推奨フィールドが空 → ログ出力（警告なし）
```

**必須/推奨の分類（ゴルフ例）:**

| フィールド | 分類 | 理由 |
|-----------|------|------|
| Brand | 必須 | SEOに直結 |
| Golf Club Type | 必須 | 検索フィルターに使われる |
| Loft | 必須 | ゴルフクラブの最重要スペック |
| Model | 必須 | SEOに直結 |
| Handedness | 推奨 | 不明な場合もある |
| Flex | 推奨 | ヘッド単品なら該当しない |
| Shaft Material | 推奨 | ヘッド単品なら該当しない |
| Country of Origin | 推奨 | 不明な場合もある |

**全カテゴリ共通の必須フィールド:**
- Brand（Unbranded以外）

**バリデーション結果の表示方法:**
- ItemSpecifics処理完了時のサマリーに警告を追加
- 例: "⚠️ 行5: Loftが未設定です（ゴルフ）"

### 改修3: SANITIZE_FIELDS_にゴルフカテゴリを追加

**目的:** 交通整理でゴルフのスペックを確実に抽出する

| ファイル | 修正内容 |
|----------|----------|
| `Sanitize.gs` L15-44 | SANITIZE_FIELDS_にGolf/Golf Headsを追加 |

```javascript
// 追加
'Golf': [
  'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
  '利き手', 'フレックス', 'シャフト素材', 'クラブ番号',
  'セット構成', '付属品', 'コンディション', '故障・不具合', '製造国'
],
'Golf Heads': [
  'ブランド', 'クラブタイプ', 'ロフト角', 'モデル名',
  '利き手', '素材', 'ライ角', 'ヘッド形状',
  'バウンス', '付属品', 'コンディション', '故障・不具合', '製造国'
],
```

### 改修4: AIExtractorにゴルフ固有ルール追加

**目的:** AIが空フィールドを補完する精度を上げる

| ファイル | 修正内容 |
|----------|----------|
| `AIExtractor.gs` L340付近 | NORMALIZATION RULESにゴルフルールを追加 |

```
追加するルール:
- Loft: 数値+度数で抽出。パターン: "10°", "10deg", "10度", "9.5°"。フォーマット: "10°"
- Golf Club Type: Driver, Fairway Wood, Hybrid, Iron, Iron Set, Putter, Wedge, Utility
  日本語マッピング: ドライバー→Driver, アイアン→Iron, パター→Putter, ウェッジ→Wedge,
  フェアウェイウッド/FW→Fairway Wood, ユーティリティ/UT→Hybrid
- Handedness: Right, Left。日本語: 右利き/右→Right, 左利き/左→Left
- Flex: Regular(R), Stiff(S), Senior(A), Ladies(L), X-Stiff(X)
- Shaft Material: Graphite(カーボン), Steel(スチール)
- Head Shape: 丸型→Round, 洋ナシ→Pear, ブレード→Blade
- Set Makeup: セット構成をそのまま。例: "5-PW", "3W,5W"
- Bounce: 数値+度数。例: "12°"
- "ヘッド単品/Head Only" → Golf Club Type の後に "(Head Only)" を付加しない。eBayではHead Onlyは別フィールドではなくタイトルで表現
```

---

## 4. 修正対象ファイル一覧

| # | ファイル | 改修 | 変更内容 |
|---|---------|------|----------|
| 1 | `Sanitize.gs` | 3 | SANITIZE_FIELDS_にGolf/Golf Heads追加 |
| 2 | `Sanitize.gs` | 1 | extractConfirmedFields_(), convertConfirmedToEnglish_() 追加 |
| 3 | `ItemSpecifics.gs` | 2 | validateItemSpecifics_() 追加 |
| 4 | `AIExtractor.gs` | 1 | マージロジックに確定値ロック追加 |
| 5 | `AIExtractor.gs` | 4 | ゴルフ固有NORMALIZATION RULES追加 |
| 6 | `Library/Sanitize.gs` | - | ルート同期 |
| 7 | `Library/ItemSpecifics.gs` | - | ルート同期 |
| 8 | `Library/AIExtractor.gs` | - | ルート同期 |

---

## 5. 実装順序

### Phase 1: ゴルフで全フロー検証（本設計書のスコープ）

| ステップ | 内容 | 依存 |
|---------|------|------|
| 1 | SANITIZE_FIELDS_にゴルフ追加（改修3） | なし |
| 2 | AIExtractorにゴルフ固有ルール追加（改修4） | なし |
| 3 | parseSanitizedData_() + convertSanitizedToEnglish_() 実装（改修1-A,B） | なし |
| 4 | マージロジックに確定値ロック実装（改修1-C,D） | ステップ3 |
| 5 | バリデーション実装（改修2） | ステップ4 |
| 6 | ゴルフ商品でE2Eテスト | ステップ1-5 |
| 7 | Library同期 + コミット + clasp push | ステップ6 |

### Phase 2: 横展開（別設計書）

- 残り57カテゴリのSANITIZE_FIELDS_追加
- 各カテゴリの必須/推奨フィールド定義
- 売上構成比の高いカテゴリから順に実装
- カテゴリ固有ルールの追加（必要に応じて）

---

## 6. テスト計画

### ゴルフE2Eテスト

| テストケース | 入力 | 期待結果 |
|-------------|------|----------|
| ドライバーヘッド単品 | 「PING G400 LST 10° ヘッド単品 良品」 | Brand: Ping, Loft: 10°, Golf Club Type: Driver |
| アイアンセット | 「タイトリスト T200 アイアンセット 5-PW スチール S」 | Brand: Titleist, Golf Club Type: Iron Set, Flex: Stiff |
| パター | 「スコッティキャメロン ニューポート2 パター 34インチ」 | Brand: Scotty Cameron, Golf Club Type: Putter, Model: Newport 2 |
| 確定値ロック検証 | 交通整理でBrand: PING → AIがTaylorMadeと返す | Brand: PING（確定値が勝つ） |
| バリデーション検証 | Loftが空のまま | ⚠️ 警告表示 |
| 未登録カテゴリ | 交通整理対象外の商品 | 従来通りAIのみで抽出（デグレなし） |

---

## 7. リスクと対策

| リスク | 影響 | 対策 |
|-------|------|------|
| 交通整理AIの誤抽出が確定値としてロックされる | 誤ったIS値が修正不能 | バリデーションで異常値も検知。手動修正は常に可能 |
| GAS 6分制限 | 大量行の処理がタイムアウト | parseSanitizedData_は軽量（正規表現のみ）。AI呼び出し回数は増えない |
| 既存カテゴリ（時計等）への影響 | デグレ | SANITIZE_FIELDS_に未登録のカテゴリは従来フローのまま動作 |
| FIELD_EN_TO_JP_に未登録のフィールド | 逆引きできない | 未登録フィールドはスキップし、AI補完に委ねる |

---

## 8. 3者協議の記録

### 全員一致
- AIにプロンプトで「上書きするな」と頼むだけでは不十分。プログラム側で確定値をロックすべき
- ゴルフで先行実装し検証後に横展開

### GPTの指摘（採用）
- 誤確定のリスクがある → バリデーションで対策
- 優先順位はバリデーション先 → 確定値ロックと同時実装で対応
- 必須/推奨の2段階警告 → 採用

### Geminiの指摘（採用）
- AIに渡す情報を最小化（空フィールドだけ） → ALREADY CONFIRMED DATAの仕組みで対応
- プログラム側で合成時に上書き不能にする → マージロジックで実装
- 売上構成比順に横展開 → Phase 2で対応

### 2026-03-30 第2回3者協議（実装前検証）

**設計書への反映事項（全員合意）:**
1. `parseSanitizedData_` → `extractConfirmedFields_` に改名（既存parseSanitizedFields_との混同防止）
2. `convertSanitizedToEnglish_` → `convertConfirmedToEnglish_` に改名
3. 配置先を ItemSpecifics.gs → Sanitize.gs に変更（パース責務はSanitizeドメイン）

**将来課題（Phase2以降）:**
- 「AI確定」と「手動確定」のフラグ分離（Gemini提案）
- ユーザー手動修正時のアンロック機能（GPT+Gemini提案）
- 信頼度スコアによる仮確定/確定の二層化（GPT提案）
