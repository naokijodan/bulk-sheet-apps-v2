# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）のItemSpecifics × 交通整理 統合改修の続き。

## セッション開始時の指示

**コードに触る前に、以下を全て読むこと。**

1. このHANDOVER.mdを最後まで読む
2. グローバルルール（~/.claude/CLAUDE.md + ~/.claude/rules/）を読む
3. プロジェクトルール（~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md）を読む
4. 開発ノートを確認する（場所は「参照すべきファイル」セクションに記載）
5. gitログで最新の変更を確認する

---

## 前回のセッションでやったこと

### 実装済み（コミット・clasp push済み）

1. **交通整理に[JA]/[EN]同時出力を追加**（4ef3660）
   - プロンプトに[JA]と[EN]の2セクション出力指示を追加
   - parseSanitizedFields_を[JA]/[EN]セクション分離に対応（順序非依存）
   - AW列(49)に英語版構造化データを書き込み
   - 復元時にAW列もクリア
   - Config.gsにEN_DESC_SANITIZED: 49を追加

2. **ISの確定値マージ**（1559947, 6dba1da）
   - 出品2シートのAI列(35)から英語版確定値を読み取り
   - parseConfirmedEnglish_（パイプ区切りパーサー）
   - mergeConfirmedValues_（共通マージ関数、確定値優先）
   - step1BasicSelectedRows / step1BasicAllRowsにマージを追加
   - 日本語防波堤（確定値に日本語があればスキップ、半角カナ含む）

3. **全カテゴリの補足ルール追加**（9a7803b）
   - 24カテゴリに交通整理用の補足ルールを追加（Watches, Rings, ジュエリー7種, ファッション系, 楽器, ゲーム, 着物, 刀剣, 美術, レコード等）

4. **CATEGORY_RULES_へのリファクタリング**（b0ce362）
   - 24カテゴリ分のif文を定数オブジェクトに切り出し
   - buildDefaultSanitizePrompt_内を5行の参照コードに削減

5. **製造国ルール追加**（8b63a33）
   - ブランドの本国を記入、Made in ○○は無視するルールを共通ルールに追加

### 列配置（確定・数式設定済み）

| シート | 列 | 内容 |
|--------|-----|------|
| 作業シート AW(49) | 交通整理英語版 | コードが書き込み |
| 出品用シート T | =ARRAYFORMULA('作業シート'!AW5:AW) | ユーザー設定済み |
| 出品2シート AI(35) | =ARRAYFORMULA('出品用シート'!T3:T) | ユーザー設定済み |

### データチェーン（完全版）

```
作業シート → 出品用シート → 出品2シート

作業シートD(タグ) → 出品用C → 出品2A
作業シートE(テンプレ) → 出品用D → 出品2B
作業シートF(参考eBay) → 出品用E → 出品2C
作業シートG(仕入先) → 出品用F → 出品2D
作業シートH(仕入先コード) → 出品用G → 出品2E
作業シートAGorR(出品価格) → 出品用H → 出品2F
作業シートM(英語タイトル) → 出品用I → 出品2G
作業シートC(label) → 出品用J → 出品2H
数式なし(Offer了承) → 出品用K → 出品2I
数式なし(Offer拒否) → 出品用L → 出品2J
TRUE固定(private) → 出品用M → 出品2K
作業シートN(英語説明文) → 出品用N → 出品2L
作業シートO(shipping) → 出品用O → 出品2M
N列(14)〜: IS開始
作業シートAW(交通整理EN) → 出品用T → 出品2AI(35)
```

---

## 現在の問題（次にやるべきこと）

### 最優先: 交通整理の2パス化

**問題:** [JA]/[EN]同時出力でプロンプトが複雑になり、品質が低下した
- 処理時間が数倍に増加
- 失敗率上昇（59件中2件エラー、ブランド未抽出も複数）
- AIの注意が分散

**3者協議の結論（GPT+Claude合意、Gemini CLI障害で参加不可）:**

交通整理を2パスに分ける:

**1回目（軽量・日本語のみ）:**
- 従来通り日本語の構造化のみ
- [EN]セクションは出さない
- カテゴリ別補足ルール（CATEGORY_RULES_）は残す
- K列に書き込み

**2回目（チェック+英語化+再試行）:**
- 1回目のK列結果を入力として受け取る
- GAS側で軽量チェック（APIを呼ばず）:
  - ブランドが空でないか
  - フィールド数が最低限あるか
- チェックNG → 元データ（AV列）と1回目結果を渡してAIに再試行
- チェックOK → AIに英語版を生成させてAW列に書き込み

**リトライ:** 1回目失敗は1回リトライ、2回目失敗は1回リトライ（計最大4回）

### 未実施: Geminiレビュー

以下のコミットはGemini CLIの障害（429 + thinking_levelエラー）でGeminiレビューが未完了:
- b0ce362 refactor: CATEGORY_RULES_切り出し → Geminiレビュー途中でPASS（ファイル読み込みまで完了、結論出た）
- 6dba1da, 8b63a33, 0571887 → Codex(GPT)レビューのみ実施

Gemini CLI復旧後に追加レビューを実施すること。

### Gemini CLI設定問題

- settings.jsonを元の状態に戻した（モデル指定なし）
- 短い質問は動くが、エージェントモード（ファイル読み込み）で429が発生
- Google側のインフラ変更が原因（公式アラート: トラフィック優先度変更中）
- settings.jsonにモデル指定を追加するとthinking_levelエラーが発生するバグあり（v0.35.3）
- **settings.jsonは触らないこと。** 元の状態が最も安定

---

## gitステータス

- ブランチ: main
- 最終コミット: `0571887` fix: 日本語検出の正規表現に半角カナを追加
- git push済み、clasp push済み
- 既存機能への影響: 交通整理のプロンプト変更により品質低下あり（2パス化で解決予定）

---

## 参照すべきファイル

### プロジェクト内

| ファイル | 内容 | 重要度 |
|---------|------|--------|
| `CLAUDE.md` | プロジェクトルール（Library同期、ScriptProperties禁止等） | 必読 |
| `Sanitize.gs` | 交通整理メイン。CATEGORY_RULES_, buildDefaultSanitizePrompt_, parseSanitizedFields_, runSanitizeSelectedRows | 最重要 |
| `ItemSpecifics/ItemSpecifics.gs` | IS抽出。mergeConfirmedValues_, parseConfirmedEnglish_, step1BasicSelectedRows, writeItemSpecificsToSheet_ | 重要 |
| `ItemSpecifics/Config_IS.gs` | 出品2シートの列定義。CONFIRMED_EN: 35, IS_CATEGORY_FIELDS, IS_TAG_TO_CATEGORY | 重要 |
| `Config.gs` | 作業シートの列定義。EN_DESC_SANITIZED: 49 | 参照 |
| `ItemSpecifics/AIExtractor.gs` | AI抽出プロンプト。GOLF RULES, buildExtractionPrompt_ | 参照 |
| `docs/itemspecifics-sanitize-integration-plan.md` | 元の設計書（前提に誤りあり、参考程度） | 参考 |

### 開発ノート

| ファイル | 内容 |
|---------|------|
| `~/Desktop/開発ログ/V3開発ログ/` | V3の設計経緯・過去の変更・トラブル対応（14ファイル） |
| `~/Desktop/開発ログ/一括シートV3_ItemSpecifics_AI主導設計変更_2026-03-02.md` | IS抽出の設計変更詳細 |
| `~/Desktop/開発ログ/一括シートV3_Display・ブランド追加_2026-03-04.md` | Display/Case Material問題の教訓 |
| Obsidianノート「一括シートV3_ItemSpecifics交通整理統合.md」 | 今回の統合改修の記録 |

### Git履歴（重要コミット）

```
0571887 fix: 日本語検出の正規表現に半角カナを追加
8b63a33 fix: 製造国はブランドの本国を記入するルールを追加
6dba1da fix: マージ時に日本語を含む確定値をスキップする防波堤を追加
1559947 fix: メニューから呼ばれる関数に確定値マージを追加
b0ce362 refactor: カテゴリ別補足ルールをCATEGORY_RULES_に切り出し
9a7803b feat: 全カテゴリの交通整理補足ルールを追加
b72c749 fix: Library同期漏れ修正 + ENセクションプロンプト改善
4ef3660 feat: 交通整理に英語版同時出力を追加、ISとの統合改修
70549b2 revert: ステップ4-5を巻き戻し（シート構成の矛盾が判明）
```

---

## 2つのシートの列定義（最重要）

### 作業シート（Config.gs）
D(4)=タグ, J(10)=日本語タイトル, K(11)=商品説明, M(13)=英語タイトル, N(14)=英語説明文, AV(48)=交通整理バックアップ, AW(49)=交通整理英語版

### 出品2シート（Config_IS.gs）
A(1)=タグ, G(7)=英語タイトル, L(12)=英語説明文, N(14)〜=IS開始, AI(35)=交通整理英語版

**同じ列番号でも意味が違う。必ずどのシートの話か明記すること。**

---

## メニュー→関数の対応（UserSheet/Main.gs経由）

| メニュー | 関数 |
|---------|------|
| 🧹 選択行を交通整理 | runSanitizeSelectedRows() |
| ↩️ 交通整理を元に戻す | restoreSanitizeSelectedRows() |
| 📋 Item Specifics 選択行に出力 | IS_step1BasicSelectedRows → LIB.step1BasicSelectedRows() |
| 📋 Item Specifics 全行に出力 | IS_step1BasicAllRows → LIB.step1BasicAllRows() |

---

## 教訓（このセッションで学んだこと）

1. **メニュー→関数の対応を必ず確認する。** マージロジックをextractSelectedRowsに入れたが、メニューはstep1BasicSelectedRowsを呼んでいた
2. **Library同期を忘れない。** ItemSpecifics/フォルダのファイルはLibrary/直下に同期が必要
3. **プロンプトを複雑にしすぎるとAIの品質が下がる。** JA+EN同時出力は改悪だった。2パス化で解決する
4. **settings.jsonは触らない。** Gemini CLIのモデル指定を追加するとthinking_levelエラーが発生する
5. **協議すべき判断を独断で下さない。** 「今はやらない」という判断も協議が必要
6. **レビュー時はコードの品質だけでなく「正しい場所に入っているか」を確認する**
7. **事実確認が先。** 出品2シートの数式を確認せずに実装して失敗した（前回セッション）。メニュー→関数の対応を確認せずに実装して失敗した（今回セッション）
