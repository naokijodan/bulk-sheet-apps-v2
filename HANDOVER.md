# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 最重要: 過去セッションの教訓（繰り返すな）

### 2026-04-03〜04-04セッション
1. **ノートを読まずに作業開始** → 辞書充実の内容を理解しないまま突入
2. **承認なしに3件push** → L0-3違反。確認の結果revert不要だったが信頼を毀損
3. **完了済みタスクを「未実装」と誤認** → ノートを読んでいれば起きなかった
4. **指摘を受けて仕事を放棄** → 「すみません」で止まるな。調べて解決しろ
5. **ユーザーの言葉を自分の解釈で置き換えた** → 分からなければ聞け

### 2026-04-04セッション
1. **「Geminiは使えない」と報告** → MCPブリッジが使えた。「できない」と言う前にツールを確認
2. **「実害は小さい」と根拠なく推測** → IS_BRAND_DICTのcategoryフィルタリングにより実害あり
3. **コードレビューを忘れた** → 設計後・実装後に毎回レビュー必須

### 2026-04-04〜05セッション（今回）で起きた問題
1. **prompts/フォルダを修正してもPromptTemplates.gsに反映し忘れた** → B-1/B-2でベースボール・大相撲のプロンプトを修正したが、PromptTemplates.gsの更新を見落とした。新規4件（Dragon Ball/Weiss/Digimon/トレカ汎用）も同様。ユーザーの指摘で発覚 → CLAUDE.mdのコミット前チェックリストに項目4「PromptTemplates.gs同期チェック」を追加して再発防止済み
2. **初期設定でプロンプトが反映される仕組みを理解していなかった** → syncPromptsToSheet_()がPROMPT_TEMPLATESオブジェクト（Library/PromptTemplates.gs）から読み込んでGPT_Promptsシートに書き込む仕組み。prompts/フォルダの.txtファイルはGASから直接読み込まれない（ドキュメント・バージョン管理用）
3. **eBay送料上限の数値を画像から誤読** → $20を$21と読み間違えた。正確さが最優先
4. **Obsidianノートをユーザーに指摘されるまで書かなかった** → 完了ルール（C-03）違反。作業完了時にすぐ書く。次のセッションが迷う原因になる。2セッション連続の怠慢

### 必ず守るルール
- **コードに触る前に**: ルールファイル（~/.claude/CLAUDE.md + rules/）、このHANDOVER.md、プロジェクトCLAUDE.md、Obsidianノートを全て読む。読むまでコードに触らない
- **作業フロー**: 設計→**レビュー（Claude+GPT最低2者）**→承認→実装→**レビュー（Claude+GPT最低2者）**→コミット→git push→clasp push
- **毎回のコミット後に必ずgit push + clasp pushを実行する**（まとめてやらない。ロールバックの安全のため）
- **推測禁止**: 答える前にツール（Grep/Read/WebSearch/API）で事実確認する。確認できないなら「Unknown」と報告。推測で数値・仕様を言わない
- 「できない」と言う前にToolSearchでツールを確認する
- ユーザーの言葉をそのまま受け取る。解釈で置き換えない
- prompts/を変更したら**PromptTemplates.gsにも反映**する（version インクリメント）
- IS_CATEGORY_FIELDSは10件制限。変更提案禁止

### 行き詰まったときの対処
1. **コードの仕組みがわからない** → Grep/Readで実際のコードを確認する。推測しない
2. **eBayの仕様がわからない** → WebSearch/RAKUDA API/GPTリサーチで確認。確認できなければユーザーに聞く
3. **設計判断に迷う** → 3者協議（get_all_opinions）で意見を集める。それでも決まらなければユーザーに判断を仰ぐ
4. **Geminiがエラー** → 短い英語でリトライ1回。それでもダメならClaude+GPTの2者で進める（ユーザーに報告）
5. **レビューで指摘を受けた** → 各指摘をFact/設計意図/スコープ外に分類して判定。対応が必要なものだけ修正

---

## ■ 現在のステータス

- ブランチ: main
- 最新コミット: `a4dd4fa`
- clasp push: **実施済み**（全コミットでclasp push済み）
- 動かないもの: なし

### 今回のセッション（2026-04-04〜05）で実施したコミット（14件）

**Trading Cards改修:**
| コミット | 内容 |
|---------|------|
| `a0a8c00` | PROMPT_TAG_MAPPINGに遊戯王・ワンピース追加 + IS_BRAND_DICT 9件category修正 |
| `5cb332d` | ベースボール・大相撲プロンプトにJapanese指示追加 |
| `f411abd` | 汎用TCGプロンプト新規作成 + PROMPT_TAG_MAPPING 4エントリ追加 |
| `4f4b5bc` | Dragon Ball専用プロンプト作成 |
| `1fd5966` | Weiss Schwarz専用プロンプト作成（SP/SSPサイン検出重視） |
| `1c94e8b` | Digimon専用プロンプト作成（Alt Art検出重視） |
| `ca8f785` | PromptTemplates.gsに新規4件追加+既存2件更新（初期設定で反映可能に） |

**Video Games / Video Game Consoles / Accessories改修:**
| コミット | 内容 |
|---------|------|
| `e8ddb16` | IS_BRAND_DICTのゲームブランド58件にVideo Game Consolesカテゴリ追加 |
| `cc3079c` | PROMPT_TAG_MAPPING拡充（ゲーム用2→14タグ、ゲーム機1→19タグ） |
| `d786aa2` | CATEGORY_RULES_ Video Games充実（3→6ルール: CIB/ジャンル/CERO追加） |
| `35d1202` | AI.gsにゲームタイトル誤訳辞書の動的注入追加（20シリーズ） |
| `6bcf6c0` | Video Game Accessoriesカテゴリ新設（全定義+ブランド58件category追加） |
| `8705e76` | SHIPPING_POLICY_CATEGORIESにVideo Game Accessories（上限$25）追加 |

**再発防止:**
| コミット | 内容 |
|---------|------|
| `cc48ecc` | CLAUDE.mdコミット前チェックリストにPromptTemplates.gs同期チェック追加 |

**TagShipping P列コンディション管理（2026-04-05）:**
| コミット | 内容 |
|---------|------|
| `9db0f50` | TagShipping P列で商品状態管理実装 |
| `a4183a0` | HtmlTemplates.gs再生成 |
| `44538f5` | AE列数式出力前にバリデーションクリア |
| `5ca6409` | O列にD列空チェック追加 |
| `cdf8e29` | E列にD列空チェック追加 |
| `12569aa` | AE列数式保護3箇所修正（翻訳バッチ/行クリア/ON→OFF切替） |

### ユーザー操作（初期設定時）
以下の操作で今回の変更がスプレッドシートに反映される:
- 「新しいプロンプトを追加」にチェック → 4件（ドラゴンボール/ヴァイス/デジモン/トレカ汎用）追加
- 「既存プロンプトを最新版に更新」にチェック → 2件（ベースボール/大相撲）v2に更新
- TagShipping Q/R列→S/T列に移動。GPT_Prompts E列は自動更新
- TagShipping H列ドロップダウンに「Video Game Accessories (上限$25)」が追加される
- TagShipping P列に「商品状態」ドロップダウンが追加される
- 「商品状態」チェックボックスONで、AE列にINDEX/MATCH数式が出力される

### 保留事項
- **ゲーム周辺機器の送料上限詳細** — eBayの各サブカテゴリ送料上限は確認済み（スクリーンショット）。$25で設定済み。eBay送料上限ページが変更される可能性はユーザーが確認する

---

## ■ 次にやること: 辞書充実カテゴリ確認の続き（17/64〜64/64）

### 作業の目的
64カテゴリの辞書を1つずつ確認し、バイヤーのニーズを満たすItem Specificsが正確に出力されるようにする。不足があればリサーチ→設計→レビュー→承認→実装→レビュー→コミット。

### 各カテゴリで確認する7項目
1. **IS_TAG_TO_CATEGORY**: タグが十分か（表記揺れを含む）
2. **PROMPT_TAG_MAPPING**: 翻訳プロンプトが割り当てられるか（TagShipping Q/R列に反映されるか）
3. **IS_INITIAL_DATA**: フィールド定義が十分か
4. **IS_CATEGORY_FIELDS**: 出力フィールドが十分か（10件上限）
5. **IS_BRAND_DICT**: ブランドが十分か、**categoryフィルタが正しいか**（全ての該当カテゴリが含まれているか）
6. **CATEGORY_RULES_**: バリデーションルールがあるか
7. **AI.gs**: カテゴリ固有のAIヒントが必要か

### 見落としやすいポイント（過去のセッションで学んだこと）
- IS_TAG_TO_CATEGORYに追加しても**PROMPT_TAG_MAPPINGに追加しなければ**翻訳プロンプトが使われない
- IS_BRAND_DICTの**categoryフィルタ漏れ**はブランドがスキップされる実害がある（Trading Cardsで9件、Video Gamesで58件修正済み）
- **prompts/フォルダを変更したらPromptTemplates.gsにも反映**する（version インクリメント）
- IS_CATEGORY_FIELDSは**10件制限**。変更提案禁止
- タグ競合に注意（「アンプ」はMusical Instrumentsに割当済み。「オーディオアンプ」で回避）
- **新カテゴリ追加時はSHIPPING_POLICY_CATEGORIESも確認**する（送料上限が異なる場合がある）

### 確認済みカテゴリ（21/64 + 新設2）
| # | カテゴリ | 状態 | 主な修正 |
|---|---------|------|---------|
| 1 | Watches | ✅ | — |
| 2 | Rings | ✅ | ブランド56件追加 |
| 3 | Bracelets | ✅ | — |
| 4 | Earrings | ✅ | — |
| 5 | Necklaces | ✅ | — |
| 6 | Brooches | ✅ | category修正 |
| 7 | Cufflinks | ✅ | category修正 |
| 8 | Hair Accessories | ✅ | category修正 |
| 9 | Handbags | ✅ | ブランド12件追加 |
| 10 | Clothing | ✅ | ブランド13件追加 |
| 11 | Shoes | ✅ | ブランド27件追加 |
| 12 | Cameras | ✅ | — |
| 13 | Electronics | ✅ | タグ17件・フィールド4→8・ブランド15件 |
| 14 | Trading Cards | ✅ | プロンプト6件追加、PROMPT_TAG_MAPPING修正、category修正、3者協議実施 |
| 15 | Video Games | ✅ | PROMPT_TAG_MAPPING拡充、CATEGORY_RULES充実、誤訳辞書追加 |
| 16 | Video Game Consoles | ✅ | IS_BRAND_DICT 58件category修正 |
| 17 | Fishing Reels | ✅ | タグ6件追加、Shimano 7モデル+Daiwa 4モデル追加、PROMPT_TAG_MAPPING拡充 |
| 18 | Fishing Rods | ✅ | タグ6件追加、ブランド6件追加（Olympic/Xesta等）、PROMPT_TAG_MAPPING拡充 |
| 新設 | Video Game Accessories | ✅ | カテゴリ新設（全定義+送料$25） |
| 新設 | Fishing Lures | ✅ | カテゴリ新設（10フィールド・32ブランド・14タグ・ルール7件） |
| 19 | Dinnerware | ✅ | ブランド29件追加（日本窯元・欧州・北欧）、タグ6件、ルール6件 |

### 未確認カテゴリ（43/64）— 次のセッションでScarvesから
Scarves, Neckties, Handkerchiefs, Tie Accessories, Glassware, Snow Globes, Boxes, Flatware, Baby, Combs, Key Chains, Charms, Collectibles, Pipes, Watch Parts, Sunglasses, Soap, Dolls & Plush, Hats, Musical Instruments, Pens, Wallets, Lighters, Art, Pottery, Belts, Belt Buckles, Golf Heads, Kimono, Japanese Swords, Tea Ceremony, Bonsai, Prints, Buddhist Art, Tetsubin, Golf, Tennis, Baseball, Japanese Instruments, RC & Models, Anime, Figures, Stamps, Coins, Records

---

## ■ 辞書の設計思想（理解必須）

- **AI主導パターン（ポケカV9準拠）**: AIがカテゴリ自動判定 → 辞書で補完
- **辞書はゲーティングではなく補完ツール**: 辞書にないカテゴリでもAIが処理する
- **IS_BRAND_DICTのcategoryフィールド**: ItemSpecifics.gs:769-778でフィルタリングに使用。categoryに含まれないカテゴリではブランドがスキップされる
- **getBrandDictForPrompt_()（AIExtractor.gs:422）**: categoryフィルタなしで全ブランドをプロンプトに渡す。AIへのブランド名提供にはcategoryは影響しないが、IS書き込み時のブランド検索には影響する
- **prompts/フォルダとPromptTemplates.gsの関係**: prompts/はドキュメント・バージョン管理用。GASが読むのはPromptTemplates.gs（Library/）。syncPromptsToSheet_()がPROMPT_TEMPLATESからGPT_Promptsシートに書き込む。両方を同期する必要がある
- **ブランド辞書のcategoryは網羅的に設定する**: 例えば任天堂はVideo Games + Video Game Consoles + Video Game Accessories。ソフト専業メーカー（Capcom等）はVideo Gamesのみ

---

## ■ 参照すべきファイル

### セッション開始時に必ず読むもの
1. `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下の全ルールファイル
2. このHANDOVER.md
3. `~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md`（プロジェクトルール — コミット前チェックリスト5項目が特に重要）
4. Obsidian開発ノート（全文）:
   - **`一括シートV3_辞書充実.md`** — 辞書充実プロジェクト全作業ログ（最重要。確認済みカテゴリ・新設カテゴリ・教訓が全て記載）
   - `一括シートV3_ItemSpecifics_AI主導設計変更_2026-03-02.md` — IS機能の設計思想
   - `一括シートV3_Display・ブランド追加_2026-03-04.md` — Display/CaseMaterial後処理
   - `V3開発ログ/ゲーム設定修正ログ.txt`（大きいので分割読み）

### コード変更時に参照するファイル
- `ItemSpecifics/Config_IS.gs` — IS_INITIAL_DATA, IS_BRAND_DICT, IS_TAG_TO_CATEGORY, IS_CATEGORY_FIELDS
- `Config.gs` — PROMPT_TAG_MAPPING, SHIPPING_POLICY_CATEGORIES
- `Sanitize.gs` — SANITIZE_FIELDS_, CATEGORY_RULES_, FIELD_EN_TO_JP_
- `AI.gs` — カテゴリ固有AIヒント（カメラ、トレカ、ゲーム）、Pre/Post-process
- `Library/PromptTemplates.gs` — プロンプトテンプレート（43件、prompts/と同期必須）
- `ItemSpecifics/AIExtractor.gs` — getBrandDictForPrompt_(), getCategoryFieldsForPrompt_()
- `ItemSpecifics/ItemSpecifics.gs` — ブランド検索ロジック（769-778行: categoryフィルタ）

### コミット前チェックリスト（CLAUDE.mdに記載、5項目）
1. ScriptPropertiesチェック
2. ルートとLibraryの同期チェック
3. HtmlTemplates.gsチェック（.txt変更時）
4. **PromptTemplates.gs同期チェック**（prompts/変更時）← 今回追加
5. 変更ファイルの最終確認

---

## ■ 重要な設計ルール（変更なし）

### UserSheet/Main.gsのラッパーパターン
- 新メニュー項目を追加するとMain.gsにもラッパーが必要 → 既存ユーザーのGASを更新しないと動かない
- 対策: 全ての設定は初期設定（initialSetup）から呼ぶ。新メニュー項目は追加しない

### TagShippingシートの構造
| 列 | 内容 | 備考 |
|---|---|---|
| A | タグ名 | |
| B-D | EP/CE/CF送料 | 数値 |
| E | 参考eBay ID | |
| F | SKU略称 | |
| G | テンプレート名 | ドロップダウン |
| H | 送料上限カテゴリ | ドロップダウン（**7件**: Video Games/Video Game Consoles/Video Game Accessories/Books/Movies & TV/Music/Other） |
| I | 利益率 | ドロップダウン（0%-45%） |
| J | 広告費率 | ドロップダウン（0%-15%） |
| K | 手数料率 | ドロップダウン（13%-25%） |
| L | 低価格配送 | ドロップダウン（EP/CE/NONE） |
| M | 高価格配送 | ドロップダウン（CF/CD/EL） |
| N | 送料切替基準 | 数値（円） |
| O | 想定関税閾値 | H列からREGEXEXTRACTで自動抽出 |
| P | 商品状態 | ドロップダウン（新品/中古/AI）。AE列にINDEX/MATCHで参照。AI/空→P2フォールバック |
| S-T | 参照リスト | **PROMPT_TAG_MAPPINGから自動生成**（writeTagListToSheet_関数）。旧Q-R列から移動 |

### 値埋め込み禁止
INDEX/MATCH数式で参照すること。

---

## ■ 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| GPT質問 | `mcp__openai-bridge__ask_gpt` |
| Gemini（MCP） | `mcp__gemini-bridge__ask_gemini`。**Gemini CLIは未インストール。MCPブリッジ経由のみ。日本語の長文でタイムアウトしやすい。短い英語で聞く** |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` / `multi_discuss` / `debate` / `consensus` |
| HtmlTemplates更新 | `python3 Library/convert_html_to_gs.py` |
| clasp push | `cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
