# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の辞書充実作業の続き。
確認不要で自律実行してほしい。

## ■ 前回のセッションでやったこと（2026-04-01〜04-02）

### 共通改善
- AI.gs sanitizeInputJP_: 箱なし/付属品なし/本体のみ → (NO_BOX)/(NO_ACCESSORIES)マーカー追加
- AI.gs createAIPrompt: MISSING ACCESSORIES RULE全カテゴリ共通注入（タイトル末尾にNo Box等）
- Library/sync_prompts_to_gs.py: prompts/*.txt → PromptTemplates.gs 変換ツール新規作成

### 時計（Watches）— 完了
- prompts/時計用.txt: 107→232行（翻訳辞書80件、欠陥キーワード21件、時計固有欠品ルール）
- CATEGORY_RULES_: 8→13ルール（風防素材、防水性能、ベルト素材、型番、キャリバー）
- IS_BRAND_DICT: 438件（既存、追加なし）

### ジュエリー系9カテゴリ — 完了
- Rings, Necklaces, Bracelets, Earrings, Brooches, Cufflinks, Tie Accessories, Charms
- IS_BRAND_DICT: 48件追加（Rings/Necklaces/Bracelets/Earrings共通カテゴリ指定）
- CATEGORY_RULES_ Rings: 4→9ルール / 他7カテゴリ: 4→6ルール
- prompts/ジュエリー.txt: 欠陥キーワード9件＋欠品パターン追加

## ■ 現在のステータス
- ブランチ: main
- 最新コミット: `ffa5ac7`（git push済み、clasp push済み）
- 完了: 10/64カテゴリ

## ■ 次にやること

**Handbags から順番に、全カテゴリの辞書を充実させる。**

### 残りカテゴリの順番
1. **Handbags** ← 次はここから
2. Clothing
3. Shoes
4. Cameras（IS_BRAND_DICT 296件あり、プロンプトは「最低限」→拡充）
5. Electronics
6. Golf（プロンプトは充実、BRAND_DICT未登録）
7. Musical Instruments
8. Pens / Wallets / Belts / Belt Buckles
9. Fishing Rods（プロンプトは充実、BRAND_DICT未登録）
10. 以降、IS_CATEGORY_FIELDSの定義順に残り全カテゴリ

## ■ 1カテゴリの作業手順（必ずこの順番で）

### ステップ1: 現状確認（エージェント並列）
- IS_BRAND_DICTに該当カテゴリのブランドがあるか
- CATEGORY_RULES_の現在のルール数と内容
- prompts/フォルダのどのプロンプトがカバーしているか
- プロンプトの現在の行数と充実度

### ステップ2: リサーチ（Gemini MCP）
以下をGeminiに質問する：
```
eBayで日本から[カテゴリ名]を輸出販売する際に必要な情報をリサーチしてください。
1. 専門用語の日英翻訳辞書（30件以上）
2. 欠陥・不具合キーワード日英対応（15件以上）
3. 主要ブランド（50件以上、日本語表記と英語表記）
4. CATEGORY_RULES_改善提案
```

### ステップ3: コーディング（Codex CLI）
```bash
/opt/homebrew/bin/codex exec --full-auto "指示内容"
```
変更対象（全て必要なものだけ）：
- ItemSpecifics/Config_IS.gs + Library/Config_IS.gs — IS_BRAND_DICT追加
- Sanitize.gs + Library/Sanitize.gs — CATEGORY_RULES_拡充
- prompts/カテゴリ名.txt — 翻訳辞書、欠陥キーワード、欠品パターン追加

### ステップ4: レビュー（必須。省略禁止）
1. Claude自身がdiffを確認してレビュー
2. GPT（mcp__openai-bridge__code_review_gpt）にもレビュー依頼
3. 両者PASSで次へ。FAILがあれば修正

### ステップ5: コミット前チェック（必須）
```bash
# ScriptProperties混入チェック
grep -n "getScriptProperties" Library/*.gs
# ルートとLibraryの同期チェック
diff <(grep -c "カテゴリ固有キーワード" 対象ファイル.gs) <(grep -c "カテゴリ固有キーワード" Library/対象ファイル.gs)
```

### ステップ6: コミット + プッシュ
```bash
git add 変更ファイル && git commit -m "メッセージ" && git push
```

### ステップ7: プロンプト同期 + clasp push
```bash
python3 Library/sync_prompts_to_gs.py カテゴリ名
cd Library && /Users/naokijodan/.npm-global/bin/clasp push
```
※PromptTemplates.gsの変更もコミット＋プッシュすること

## ■ 重要なルール

### 辞書の品質基準
- IS_BRAND_DICT: カテゴリの流通シェア上位80%をカバー（100-200件目安）
- プロンプト翻訳辞書: 日英対応30件以上、欠陥キーワード15件以上
- CATEGORY_RULES_: eBay必須項目を100%抽出できるルール

### 制約
- IS_CATEGORY_FIELDSの10件制限は変更禁止（EAGLEの登録制限）
- 欠品パターン（袋なし、ケースなし等）は共通処理ではなくカテゴリ別プロンプトで対応（メモリ feedback_missing_parts_per_category.md 参照）
- Library同期必須（ルートとLibrary/の両方を更新）
- PromptTemplates.gsのプロンプト更新はsync_prompts_to_gs.pyを使う（手動編集禁止）
- コミット前にScriptPropertiesチェック必須
- **レビュー省略禁止**（Claude + GPTの2者レビュー）

### 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| Gemini MCP | `mcp__gemini-bridge__ask_gemini` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py カテゴリ名` |
| clasp push | `cd ~/Desktop/ツール開発/一括シートApps_v3/Library && /Users/naokijodan/.npm-global/bin/clasp push` |

### プロンプトの反映フロー
1. prompts/カテゴリ名.txt を編集
2. `python3 Library/sync_prompts_to_gs.py カテゴリ名` → PromptTemplates.gsにバージョン付きで同期
3. `cd Library && clasp push` → GASにデプロイ
4. スプレッドシートで初期設定メニュー → 「プロンプト更新」にチェック → GPT_Promptsシートに反映
※ syncPromptsToSheet_がPromptTemplates.gsのversionとシートF列のバージョンを比較して更新判定
