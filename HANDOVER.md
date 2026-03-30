# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の軽量翻訳プロンプト実装。

## セッション開始時の指示

**コードに触る前に、以下を全て読むこと。前回、事実確認せずに実装して失敗した。**

1. このHANDOVER.mdを最後まで読む
2. グローバルルール（~/.claude/CLAUDE.md + ~/.claude/rules/）を読む
3. プロジェクトルール（~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md）を読む
4. 開発ノートを確認する（場所は「参照すべきファイル」セクションに記載）
5. `git log --oneline b0538a4..HEAD` で前回以降の変更を確認する
6. 設計書（このファイルの「次にやること」セクション）を読む

---

## 前回のセッションでやったこと

### 1. 交通整理の2パス化（b0538a4、コミット・clasp push済み）

1パスでJA+ENを同時出力していたプロンプトを2パスに分離した:
- パス1: 日本語構造化のみ（[EN]指示を削除、軽量化）→ K列に書き込み
- パス2: K列結果を英語化 → AW列(49)に書き込み
- バリデーション追加（ブランド空チェック、フィールド数チェック）
- 失敗行リトライ（MAX_RETRIES=3、指数バックオフ）
- 経過時間監視（5分超過で新規バッチ停止）
- parseSanitizedFields_簡素化（[EN]分離ロジック削除）

レビューで発見・修正した4件:
- CRITICAL: パス2のK列読み込みが非連続行で壊れる → 行ごと個別取得に変更
- HIGH: パス1プロンプトにCATEGORY_RULES_の[EN]行が混入 → [EN]行をフィルタ
- MEDIUM: validateSanitizedResult_の正規表現エスケープ不足 → 修正
- MINOR: 未使用変数ui → 削除

### 2. リール13件のテスト結果確認

交通整理は高速化に成功。しかし翻訳が遅い問題が判明。
調査の結果、以下が判明:
- 交通整理でK列に構造化データ、AW列に英語版が入っているのに、翻訳はK列の構造化データに対して生テキスト前提の127行プロンプトを適用している（二重処理）
- AW列の英語構造化データは翻訳で一切使われていない

### 3. 軽量翻訳プロンプトの設計（3者協議済み・承認済み・未実装）

AW列（英語構造化データ）のみを入力とする軽量プロンプトを設計した。詳細は「次にやること」セクションに記載。

### リールの品質問題（未修正）

テスト結果で以下の問題を発見（修正は軽量プロンプト実装後）:
- リールタイプ誤判定: アンタレス・オシアコンクエストCT・SALTIGA 15HL-SJがスピニングになる（ベイトが正しい）
- サイズ/番手→Line Capacityの誤マッピング: AW列で「Line Capacity: 8000」になる（サイズ/番手が正しい）
- 原因: CATEGORY_RULES_['Fishing Reels']にベイト判定ヒントがない、[EN]タグ付きルールがない

---

## 現在のステータス

- ブランチ: main
- 最終コミット: `b0538a4` refactor: 交通整理を2パス化（日本語構造化+英語化を分離）
- git push済み、clasp push済み
- Gemini CLI: 429障害中（settings.jsonは触らない）

---

## 次にやること

### タスク1: 軽量翻訳プロンプトの実装（最優先）

#### 設計（3者協議済み・ユーザー承認済み）

**目的:** 交通整理済みの行に対して、AW列（英語構造化データ）のみを入力とする軽量プロンプトで翻訳を高速化する。

**分岐ロジック:**
```
AW列に値あり → 軽量プロンプト（LightTranslation.gs）
AW列が空     → 従来プロンプト（GPT_Promptsシートから取得）
```

**新規ファイル: LightTranslation.gs**

データ駆動設計。LIGHT_TRANSLATION_RULES_（カテゴリ別SEOルール定数）+ buildLightTranslationPrompt_(category, sanitizedEN)関数。

8グループ対応:
- Fishing Reels（タグ: リール, 電動リール）
- Watches（タグ: 時計, 腕時計, ウォッチ, 懐中時計）
- Cameras（タグ: カメラ, デジカメ, 一眼レフ, ミラーレス）
- Golf / Golf Heads（タグ: ゴルフ, ゴルフクラブ, ゴルフヘッド）
- Jewelry = Rings, Necklaces, Bracelets, Earrings, Brooches, Cufflinks, Charms, Tie Accessories（タグ: ネックレス, リング, 指輪, ブレスレット, ピアス等）
- Video Game Consoles（タグ: ゲーム機）
- Clothing = Clothing, Shoes, Handbags, Wallets, Hats, Scarves, Neckties, Belts等（タグ: 衣類, 靴, バッグ, 財布等）
- Trading Cards（タグ: ポケカ, 遊戯王, MTG, トレカ等）

共通テンプレート部分（全カテゴリ共通）:
- ロール定義: "You are a professional eBay listing expert specializing in {role} and SEO optimization."
- GOALS: 構造化データからeBay出品文を生成。ASCII only。入力にない情報を追加しない
- TITLE: 75-80文字（80文字にできるだけ近づける）、ブランド先頭30文字以内、禁止記号
- DESCRIPTION: 1000文字以内、第1文にブランド+モデル+商品タイプ、Defectsは必ず記載
- PRODUCTNAME, CATEGORY, OUTPUT FORMAT, VERIFICATION

カテゴリ固有部分（LIGHT_TRANSLATION_RULES_から動的生成）:
- SEOキーワード順序（リール: Brand→Model→Size→Reel Type→Gear...、時計: Brand→Collection→Movement→Watch Type...）
- カテゴリ固有ルール（リール: ギアコード展開、時計: 腕周りcm/inch、カメラ: レンズルール等）
- Descriptionに含めるスペック項目リスト
- ProductNameフォーマット
- Categoryの選択肢
- VERIFICATION固有チェック項目

**既存ファイルの変更:**

| ファイル | 変更内容 |
|---------|----------|
| Translation.gs | batchValues範囲をAW列(49)まで拡張、itemにsanitizedEN/categoryプロパティ追加 |
| AI.gs | buildRequestForProvider_に軽量プロンプト分岐追加（item.sanitizedENあれば軽量版、なければ従来） |
| Library/LightTranslation.gs | 新規同期 |
| Library/Translation.gs | 同期 |
| Library/AI.gs | 同期 |

**Condition判定（Translation.gsのapplyTranslationToRow_付近で実装）:**
- AW列のConditionフィールドを正規表現で抽出: New/Unused→新品、Used/傷等→中古
- Defectsフィールドあり→強制的に「中古」
- Condition欠損→何も入れない（AE列を空のまま）
- 実装箇所: Translation.gsでM列・N列・AE列に書き込む前に、AW列からConditionを解釈してAE列の値を決定する

**重要な仕様:**
- タイトル: 75-80文字（既存プロンプトの68-75文字とは異なる。ユーザー指示で変更）
- Description: 1000文字以内（既存の480文字とは異なる。eBayの上限に合わせた）
- sanitizeInputJP_: 交通整理済みならスキップ（AW列に不要情報はない）
- sanitizeListingText_: 残す（Post-process最終防衛線）
- 入力はAW列のみ。J列（日本語タイトル）、K列（日本語構造化）は使わない
- J列タイトルは交通整理のパス1で参照済み（buildDefaultSanitizePrompt_の「タイトル（参考）: ${jpTitle}」）。構造化データにブランド・モデル等が含まれているので軽量翻訳では不要

#### 実装手順（ステップごとにレビュー）

1. LightTranslation.gs新規作成 → Codexに委託 → Claude+GPTレビュー
2. Translation.gs変更 → Codexに委託 → Claude+GPTレビュー
3. AI.gs変更 → Codexに委託 → Claude+GPTレビュー
4. Library同期（`cp LightTranslation.gs Library/`, `cp Translation.gs Library/`, `cp AI.gs Library/` → `diff`で差分なし確認 → `grep -rn "getScriptProperties" Library/*.gs`でScriptProperties混入なし確認）
5. 最終レビュー → コミット → clasp push → テスト
6. 注意: 既存のvalidateTranslationResult_はタイトル68-75字/説明文480字で検証している。軽量翻訳の出力（75-80字/1000字）に合わせて検証ロジックの更新が必要か確認すること

### タスク2: リールのCATEGORY_RULES_改善（タスク1の後）

- ベイト/スピニング判定ヒントを追加（モデル名リスト: Antares→ベイト、Stella→スピニング等）
- [EN]タグ付きルールを追加（サイズ/番手≠Line Capacity、リールタイプの英語変換等）
- IS_BRAND_DICTの「Shimano Bait」「Shimano Spinning」分類を活用できるか検討

### タスク3: Obsidianノート作成

今回のセッションの記録をObsidianに作成。

---

## 参照すべきファイル

### プロジェクト内

| ファイル | 内容 | 重要度 |
|---------|------|--------|
| `CLAUDE.md` | プロジェクトルール（Library同期、ScriptProperties禁止等） | 必読 |
| `Sanitize.gs` | 交通整理メイン。2パス化済み。CATEGORY_RULES_, buildDefaultSanitizePrompt_, buildEnglishizePrompt_, validateSanitizedResult_, parseSanitizedFields_, runSanitizeSelectedRows | 最重要 |
| `Translation.gs` | 翻訳メイン。変更対象。検索用キーワード: `tagToPromptMap`（プロンプト自動選択マップ構築）、`var item =`（itemオブジェクト構築）、`batchDataRange`（読み込み範囲定義） | 最重要（変更対象） |
| `AI.gs` | AI呼び出し。変更対象。検索用キーワード: `function createAIPrompt`、`function sanitizeInputJP_`、`function buildRequestForProvider_`、`function callAI_parallel_`、`function executeTranslationWithRetry_` | 最重要（変更対象） |
| `Config.gs` | 列定義。検索: `COLUMNS:`。JP_TITLE:10, JP_DESC:11, EN_TITLE:13, EN_DESC:14, CONDITION:31, JP_DESC_BACKUP:48, EN_DESC_SANITIZED:49。`PROMPT_TAG_MAPPING`はドキュメント用のみ、実装上未使用 | 重要 |
| `ItemSpecifics/Config_IS.gs` | 検索: `IS_CATEGORY_FIELDS`、`IS_BRAND_DICT`（Shimano Bait/Spinning等の分類あり）、`IS_TAG_TO_CATEGORY`、`function getBrandListForSanitize_` | 重要 |
| `ItemSpecifics/AIExtractor.gs` | IS抽出プロンプト。検索: `function buildExtractionPrompt_`。リール正規化ルールは`Reel Type (fishing reels)`で検索 | 参照 |
| `コード_Part1_価格計算・バッチ処理.gs` | 検索: `function getPromptContent`、`function validateTranslationResult_`。翻訳メインフローは`翻訳フェーズ`で検索 | 参照 |

### 翻訳プロンプトファイル（軽量版設計の参考）

| ファイル | 内容 |
|---------|------|
| `~/Desktop/ツール開発/プロンプト編集/リールプロンプトV1.txt` | リール翻訳プロンプト127行。SEOルール・故障用語辞書を含む |
| `~/Desktop/ツール開発/プロンプト編集/時計プロンプトV10.txt` | 時計翻訳プロンプト108行。腕周りルール・Display推論ルール |
| `~/Desktop/ツール開発/プロンプト編集/カメラプロンプトV1.txt` | カメラ翻訳プロンプト107行。レンズルール・シャッター回数ルール |
| `~/Desktop/ツール開発/プロンプト編集/ゴルフプロンプトV1.txt` | ゴルフ翻訳プロンプト。ロフト角・シャフト情報ルール |
| `~/Desktop/ツール開発/プロンプト編集/ジュエリー専用プロンプト_v4.txt` | ジュエリー翻訳プロンプト。素材変換・リングサイズ変換 |
| `~/Desktop/ツール開発/プロンプト編集/ゲーム機プロンプトV1.txt` | ゲーム機翻訳プロンプト。コンソール名マッピング・NTSC-J |
| `~/Desktop/ツール開発/プロンプト編集/アパレルプロンプト.txt` | アパレル翻訳プロンプト。サイズ変換・欠品表記 |
| `~/Desktop/ツール開発/プロンプト編集/ポケカプロンプト_改善版V9.txt` | ポケカ翻訳プロンプト。グレード検出・レアリティコード |

### 開発ノート

| ファイル | 内容 |
|---------|------|
| Obsidian「一括シートV3_ItemSpecifics交通整理統合.md」 | 今回の統合改修の記録 |
| Obsidian「一括シートV3_時計プロンプト改善.md」 | 翻訳プロンプトの進化過程V2→V10、3層構造（Pre/AI/Post）の設計思想、GPT_Promptsシートの登録状況 |
| `~/Desktop/開発ログ/V3開発ログ/` | V3の設計経緯・過去の変更・トラブル対応 |

### テスト結果

| ファイル | 内容 |
|---------|------|
| `~/Desktop/結果確認_再テスト.csv` | リール13件のテスト結果（交通整理+翻訳）。Shift-JIS。品質問題の確認用 |

---

## 2つのシートの列定義（最重要）

### 作業シート（Config.gs）
D(4)=タグ, J(10)=日本語タイトル, K(11)=商品説明, M(13)=英語タイトル, N(14)=英語説明文, AE(31)=商品状態, AV(48)=交通整理バックアップ, AW(49)=交通整理英語版

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

## 翻訳プロンプト自動選択の仕組み（重要）

1. 作業シートAS3セルが「自動選択」→ Translation.gsがGPT_PromptsシートのE列（タグ）からtagToPromptMapを動的構築
2. 行ごとにD列タグ → tagToPromptMapでプロンプトID判定 → GPT_Promptsシートからプロンプト本文取得
3. Config.gsのPROMPT_TAG_MAPPINGは**ドキュメント用のみ、実装上未使用**。真のソースはGPT_Promptsシート
4. 軽量翻訳では**この仕組みを迂回**する（AW列に値があればLightTranslation.gsのハードコードプロンプトを使用）

---

## データチェーン

```
作業シート → 出品用シート → 出品2シート

作業シートK(交通整理済み日本語) → 翻訳AI → M(英語タイトル), N(英語説明文)
作業シートAW(交通整理英語版) → 出品用シートT列（=ARRAYFORMULA('作業シート'!AW5:AW)） → 出品2シートAI列(35)
```

---

## 教訓（このセッションで学んだこと）

1. **情報収集はエージェントに並列で委託する。** 自分でGrep/Readを繰り返すとコンテキストを浪費する
2. **ノートを先に確認する。** コードから探し回る前に開発ノートを見ればプロンプトの保管場所や設計思想がわかった
3. **翻訳プロンプトの自動選択はGPT_PromptsシートのE列（タグ）から動的構築。** Config.gsのPROMPT_TAG_MAPPINGはドキュメント用のみ
4. **交通整理の結果を翻訳に活用していなかった。** AW列の英語構造化データが翻訳で使われていなかった。これが翻訳速度低下の根本原因
5. **カテゴリ別SEOルールは翻訳プロンプトに依存する。** 汎用プロンプトでは対応できない
6. **eBayのタイトルは80文字以内、Descriptionは1000文字。** 既存プロンプトの68-75字/480字は保守的すぎた
7. **Condition欠損時は何も入れない。** 安全側＝「中古」ではなく、安全側＝「空」
