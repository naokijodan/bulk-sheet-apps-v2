# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の辞書充実作業の続き。
確認不要で自律実行してほしい。

## ■ 前回のセッションでやったこと（2026-04-02）

### 9カテゴリの辞書充実を完了（合計19/64カテゴリ完了）

| # | カテゴリ | IS_BRAND_DICT | CATEGORY_RULES_ | プロンプト | レビュー |
|---|---------|--------------|-----------------|-----------|---------|
| 1 | カメラ | 296件(既存) | 5→8ルール | 107→244行（欠陥60件、翻訳辞書50件、欠品10件） | Claude+GPT |
| 2 | Handbags/Wallets | 0→69件 | 3→7/6ルール | 欠陥+10件 | Claude+GPT |
| 3 | Clothing | 0→48件 | 2→7ルール | 欠陥+24件 | Claude+GPT |
| 4 | Shoes | 0→43件 | 2→8ルール | スニーカー欠陥+18件、ドレスシューズ+19件 | Claude+GPT |
| 5 | Electronics | 0→62件 | 0→7ルール(新規) | 欠陥+15件、欠品+10件 | Claude+GPT+Gemini |
| 6 | Golf/Golf Heads | 0→47件 | 7→11/7→9 | 欠陥+15件、翻訳辞書+40件、欠品+5件 | Claude+GPT+Gemini |
| 7 | Musical Instruments | 0→40件 | 3→6ルール | プロンプト変更なし(231行で充実) | Claude+GPT |
| 8 | Pens | 0→20件 | 2→6ルール | プロンプト変更なし(150行で充実) | Claude+GPT |
| 9 | Fishing Rods | 0→20件 | 4→7ルール | プロンプト変更なし(191行で充実) | Claude+GPT |

### セッション中に確立した作業フロー
- レビューは **Claude + GPT + Gemini の3者**（Geminiが429の場合はClaude+GPT）
- レビューにはdiff実コードを渡す（概要テキストだけではGPTに「検証不能」と指摘された）
- GPTレビューは `mcp__openai-bridge__code_review_gpt`、Geminiレビューは `mcp__gemini-bridge__code_review_gemini`

### ユーザーからのフィードバック
- **カメラの液晶関連は特に重要**（液晶焼け、周辺暗い等）→ 対応済み
- **ゴルフは主戦場**なので徹底的にリサーチ → 対応済み
- **レビュー省略禁止**（前回指摘された）→ 全カテゴリ実施済み
- **clasp push忘れない**（前回指摘された）→ 全カテゴリ実施済み

## ■ 現在のステータス
- ブランチ: main
- 最新コミット: `76ced7f`（git push済み、clasp push済み）
- 完了: **19/64カテゴリ**

## ■ 次にやること

### 残り45カテゴリの辞書充実

#### 完了済みカテゴリ（19/64）
既に辞書充実が完了しているカテゴリ。触る必要なし:
1. Watches（セッション前に完了）
2. Rings, Necklaces, Bracelets, Earrings, Brooches, Cufflinks, Tie Accessories, Charms（ジュエリー系9カテゴリ、セッション前に完了）
3. Cameras
4. Handbags / Wallets
5. Clothing
6. Shoes
7. Electronics
8. Golf / Golf Heads
9. Musical Instruments
10. Pens
11. Fishing Rods

#### 次に着手すべきカテゴリ（優先順）

**Tier 1: プロンプトが充実しているがIS_BRAND_DICTが0件のカテゴリ**
（ブランド追加 + CATEGORY_RULES_拡充のみ。プロンプト変更は不要か最小限）

| カテゴリ | プロンプト | RULES状態 | ブランド数 | 作業内容 |
|---------|----------|-----------|-----------|---------|
| Fishing Reels | 釣具汎用.txt(223行)+リール.txt | 既存あり | 99件(既存) | RULES拡充のみ。ブランドは充実済み |
| Trading Cards | MTG/ポケカ/ベースボール/大相撲 | 既存あり | 0件 | カードはブランドではなくゲーム名で管理（CardPatterns.gs）。RULES確認のみ |
| Video Game Consoles | ゲーム機.txt/ゲーム用.txt | 既存あり | 既存あり | RULES確認のみ |
| Sunglasses | サングラス.txt | 既存あり | 既存あり | ブランド追加+RULES拡充 |
| Kimono | 着物.txt | 既存あり | N/A | 着物はブランド不要。RULES確認のみ |

**Tier 2: プロンプトがあるがIS_BRAND_DICTとRULESが手薄なカテゴリ**

| カテゴリ | プロンプト | 作業内容 |
|---------|----------|---------|
| Records | レコード.txt | ブランド追加（レーベル名）+RULES拡充 |
| Figures | フィギュア.txt | ブランド追加+RULES拡充 |
| RC & Models | RC・模型.txt | ブランド追加+RULES拡充 |
| Art / Prints | アート.txt | ブランド追加不要。RULES拡充 |
| Japanese Swords | 日本刀.txt | 特殊。RULES確認 |
| Japanese Instruments | 和楽器.txt(142行) | ブランド追加+RULES拡充 |
| Tennis | テニス.txt | ブランド追加+RULES拡充 |

**Tier 3: プロンプトが汎用/共有で、個別プロンプトがないカテゴリ**
（一般商品・汎用.txtまたは日本ブランド.txtで処理されている）

| カテゴリ | プロンプト | 作業内容 |
|---------|----------|---------|
| Hats | 一般商品・汎用.txt | ブランド追加+RULES確認 |
| Scarves | 一般商品・汎用.txt | ブランド追加+RULES確認 |
| Neckties | 一般商品・汎用.txt | RULES確認 |
| Handkerchiefs | 一般商品・汎用.txt | RULES確認 |
| Belts | レザーグッズ.txt | ブランド追加（Handbags/Walletsと共通多い） |
| Belt Buckles | 一般商品・汎用.txt | RULES確認 |
| Coins | 一般商品・汎用.txt | RULES確認 |
| Stamps | 一般商品・汎用.txt | RULES確認 |
| Collectibles | 一般商品・汎用.txt | RULES確認 |
| Dolls & Plush | フィギュア.txt共用? | RULES確認 |
| Snow Globes | 一般商品・汎用.txt | RULES確認のみ |
| Pottery | 日本伝統・骨董.txt/テーブルウェア.txt | RULES確認 |
| Glassware | テーブルウェア.txt | RULES確認 |
| Dinnerware | テーブルウェア.txt | RULES確認 |
| Flatware | テーブルウェア.txt | RULES確認 |
| Tea Ceremony | 日本伝統・骨董.txt | RULES確認 |
| Tetsubin | 日本伝統・骨董.txt | RULES確認 |
| Bonsai | 一般商品・汎用.txt | RULES確認のみ |
| Buddhist Art | 日本伝統・骨董.txt | RULES確認のみ |
| Combs | 一般商品・汎用.txt | RULES確認のみ |
| Boxes | 一般商品・汎用.txt | RULES確認のみ |
| Soap | 一般商品・汎用.txt | RULES確認のみ |
| Baby | 一般商品・汎用.txt | RULES確認のみ |
| Hair Accessories | 一般商品・汎用.txt | RULES確認のみ |
| Key Chains | 一般商品・汎用.txt | RULES確認のみ |
| Lighters | パイプ・喫煙具.txt | ブランド追加（Zippo等）+RULES確認 |
| Pipes | パイプ・喫煙具.txt | ブランド追加+RULES確認 |
| Anime | フィギュア.txt共用? | ブランド追加+RULES確認 |
| Video Games | ゲーム用.txt | RULES確認 |
| Watch Parts | 時計用.txt | RULES確認（時計のサブカテゴリ） |
| Baseball | 野球.txt | ブランド追加+RULES確認 |

### 効率化のヒント
- **Tier 1はRULES確認のみで完了できる**（5カテゴリ、30分程度）
- **Tier 2はブランド追加がメイン**（7カテゴリ、各カテゴリ10-20ブランド程度）
- **Tier 3は大半がRULES確認+微調整**（30カテゴリ以上、ブランド追加は不要か最小限）
- 複数カテゴリをCodexに一括委託すると高速（今回3カテゴリ一括で成功）

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
※ Gemini 429エラー時: 20秒待機→1回リトライ→失敗ならClaude自身がリサーチ

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
2. GPT（mcp__openai-bridge__code_review_gpt）にdiff実コードを渡してレビュー
3. Gemini（mcp__gemini-bridge__code_review_gemini）にもレビュー依頼（可能な場合）
4. 全者PASSで次へ。FAILがあれば修正

### ステップ5: コミット前チェック（必須）
```bash
# ScriptProperties混入チェック
grep -n "getScriptProperties" Library/*.gs
# ルートとLibraryの同期チェック
diff Sanitize.gs Library/Sanitize.gs
diff ItemSpecifics/Config_IS.gs Library/Config_IS.gs
```

### ステップ6: コミット + プッシュ
```bash
git add 変更ファイル && git commit -m "メッセージ" && git push
```

### ステップ7: プロンプト同期 + clasp push
```bash
# プロンプト変更がある場合のみ
python3 Library/sync_prompts_to_gs.py カテゴリ名
# 必ず実行
cd Library && /Users/naokijodan/.npm-global/bin/clasp push
# PromptTemplates.gs変更がある場合はコミット+プッシュも
git add Library/PromptTemplates.gs && git commit -m "chore: プロンプト同期" && git push
```

## ■ 重要なルール

### 辞書の品質基準
- IS_BRAND_DICT: カテゴリの流通シェア上位80%をカバー（100-200件目安）
- プロンプト翻訳辞書: 日英対応30件以上、欠陥キーワード15件以上
- CATEGORY_RULES_: eBay必須項目を100%抽出できるルール

### 制約
- IS_CATEGORY_FIELDSの10件制限は変更禁止（EAGLEの登録制限）
- 欠品パターン（袋なし、ケースなし等）は共通処理ではなくカテゴリ別プロンプトで対応（メモリ参照）
- Library同期必須（ルートとLibrary/の両方を更新）
- PromptTemplates.gsのプロンプト更新はsync_prompts_to_gs.pyを使う（手動編集禁止）
- コミット前にScriptPropertiesチェック必須
- **レビュー省略禁止**（Claude + GPT + Geminiの3者レビュー）

### 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| Gemini リサーチ | `mcp__gemini-bridge__ask_gemini` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| Geminiレビュー | `mcp__gemini-bridge__code_review_gemini` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py カテゴリ名` |
| clasp push | `cd ~/Desktop/ツール開発/一括シートApps_v3/Library && /Users/naokijodan/.npm-global/bin/clasp push` |

### プロンプトの反映フロー
1. prompts/カテゴリ名.txt を編集
2. `python3 Library/sync_prompts_to_gs.py カテゴリ名` → PromptTemplates.gsにバージョン付きで同期
3. `cd Library && clasp push` → GASにデプロイ
4. スプレッドシートで初期設定メニュー → 「プロンプト更新」にチェック → GPT_Promptsシートに反映
※ syncPromptsToSheet_がPromptTemplates.gsのversionとシートF列のバージョンを比較して更新判定
