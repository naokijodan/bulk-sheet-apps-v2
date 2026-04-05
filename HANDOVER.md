# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 最重要: 過去セッションの教訓（繰り返すな）

### 2026-04-03〜04-05セッション
1. **ノートを読まずに作業開始** → 辞書充実の内容を理解しないまま突入
2. **承認なしにpush** → L0-3違反
3. **完了済みタスクを「未実装」と誤認** → ノートを読んでいれば起きなかった
4. **Gemini MCPブリッジ「使えない」と報告** → MCPブリッジが使えた
5. **prompts/変更してもPromptTemplates.gs反映忘れ** → チェックリストに追加済み
6. **コミット前にE-02レビュー未完遂** → コミット前に2者PASS必須

### 2026-04-05〜06セッション（今回）で起きた問題と教訓
1. **Musical Instrumentsを「充実済み」と即断** → フィールドがギター専用でエフェクター/シンセに不適切。ユーザーに指摘されて発覚。**表面的な数値（タグ数/ブランド数）で判断せず、フィールドの中身とカテゴリの実態を照合すること**
2. **小カテゴリで設計提示を省略気味** → ルール追加のみのカテゴリでも、なぜそれで十分かを説明すべき
3. **Sanitize.gsの文字化けを3箇所見逃し** → コミット後の再確認で発覚。`grep '��'`でチェックすること
4. **Gemini MCPブリッジが全滅** → get_all_opinions/debate全て失敗。Claude+GPTの2者で進行（ユーザーに報告済み）

### 必ず守るルール
- **コードに触る前に**: ルールファイル、HANDOVER.md、プロジェクトCLAUDE.md、Obsidianノートを全て読む
- **カテゴリ確認時**: 7項目全てを実際にGrepで確認。表面的な数だけで「充実済み」と判断しない。フィールドの中身が商品の実態に合っているか検証する
- **作業フロー**: 設計→**レビュー（Claude+GPT最低2者）**→承認→実装→**レビュー（Claude+GPT最低2者）**→コミット→git push→clasp push
- **重要カテゴリ（出品数が多い/高単価）**: リサーチ→3者協議→設計→レビュー→承認→実装→レビュー
- **毎回のコミット後に必ずgit push + clasp pushを実行する**
- prompts/を変更したら**PromptTemplates.gsにも反映**（sync_prompts_to_gs.py使用）
- IS_CATEGORY_FIELDSは10件制限。変更はユーザー承認が必要
- 文字化けチェック: `grep '��' Sanitize.gs` をコミット前に実行

---

## ■ 現在のステータス

- ブランチ: main
- 最新コミット: `218b048`
- clasp push: **実施済み**
- 動かないもの: なし

### 今回のセッション（2026-04-05〜06）で実施したコミット（9件）

**辞書充実（小〜中カテゴリ）:**
| コミット | 内容 |
|---------|------|
| `798cc04` | Snow Globes: タグ+2、ブランド6件（Disney/Sanrio/Waterford等+Hallmark/Enesco）、ルール5件 |
| `efc5d4c` | Boxes: タグ+3、ブランド1件（Wolf）、ルール4件 |
| `950c597` | Flatware: タグ+2、ブランド3件（Christofle拡張+Sori Yanagi/Tsubame Shinko）、ルール4件、FIELD_EN_TO_JP_ Age追加 |
| `310ead9` | Baby: タグ+1、ブランド1件（Miki House）、ルール3件 |
| `550cc31` | Combs/Key Chains: タグ+3、ルール6件 + Snow Globes/Flatware文字化け修正3箇所 |
| `3d9c410` | Pipes: ルール4件追加（タグ/ブランド/プロンプト既に充実） |
| `20023b5` | Watch Parts: ルール4件追加（タグ/ブランド/プロンプト既に充実） |
| `2560bd2` | Soap: ルール3件、Dolls & Plush: ルール3→5件 |

**大規模改修:**
| コミット | 内容 |
|---------|------|
| `99e5e18` | **Collectibles大幅充実**: フィールド変更（Color→Era）、タグ+14、ブランド8件（日本ヴィンテージ玩具）、ルール8件、専用プロンプト新規、PROMPT_TAG_MAPPING追加、AI.gs年号変換ヒント。3者協議でフィールド設計決定 |
| `218b048` | **Musical Instruments 4カテゴリ分割**: Guitars/Effects & Amps（新設）/Synths & Digital（新設）/Musical Instruments（改修）。ブランド+30（日本エフェクター8: Maxon/Providence等）、タグ+35、ルール23件。3者協議で分割方針決定 |

### 確認不要（変更なし）のカテゴリ
- Sunglasses: 全項目充実（タグ3/ブランド57/ルール3/プロンプトあり）
- Hats: 全項目充実（タグ10/ブランド9+/ルール3/フィールド10）
- Charms: ジュエリー準拠で充実済み

### ユーザー操作（初期設定時）
- 初期設定を実行するとTagShipping S-T列に新タグが反映される
- 楽器系の新タグ（オーバードライブ/ディストーション/シンセ等）が追加される
- Collectiblesの新タグ（昭和レトロ/ブリキ/ソフビ/ミリタリー等）が追加される
- 「新しいプロンプトを追加」にチェック → コレクティブル専用プロンプト追加

---

## ■ 次にやること: 辞書充実カテゴリ確認の続き

### 確認済みカテゴリ（40/64 + 新設5）
| # | カテゴリ | 状態 |
|---|---------|------|
| 1-24 | Watches〜Glassware | ✅ 前セッションまでに完了 |
| 25 | Snow Globes | ✅ タグ+2、ブランド6、ルール5 |
| 26 | Boxes | ✅ タグ+3、ブランド1、ルール4 |
| 27 | Flatware | ✅ タグ+2、ブランド3、ルール4 |
| 28 | Baby | ✅ タグ+1、ブランド1、ルール3 |
| 29 | Combs | ✅ タグ+2、ルール3 |
| 30 | Key Chains | ✅ タグ+1、ルール3 |
| 31 | Charms | ✅ 変更不要 |
| 32 | Collectibles | ✅ **大幅改修**（フィールド変更、プロンプト新規、AIヒント） |
| 33 | Pipes | ✅ ルール4 |
| 34 | Watch Parts | ✅ ルール4 |
| 35 | Sunglasses | ✅ 変更不要 |
| 36 | Soap | ✅ ルール3 |
| 37 | Dolls & Plush | ✅ ルール3→5 |
| 38 | Hats | ✅ 変更不要 |
| 39 | Musical Instruments | ✅ **4カテゴリ分割** |
| 新設 | Video Game Accessories | ✅ 前セッション |
| 新設 | Fishing Lures | ✅ 前セッション |
| 新設 | Guitars | ✅ MI分割で新設 |
| 新設 | Effects & Amps | ✅ MI分割で新設（日本エフェクターブランド8件含む） |
| 新設 | Synths & Digital | ✅ MI分割で新設 |

### 未確認カテゴリ（24/64）— 次はPensから
Pens, Wallets, Lighters, Art, Pottery, Belts, Belt Buckles, Golf Heads, Kimono, Japanese Swords, Tea Ceremony, Bonsai, Prints, Buddhist Art, Tetsubin, Golf, Tennis, Baseball, Japanese Instruments, RC & Models, Anime, Figures, Stamps, Coins, Records

### 各カテゴリで確認する7項目
1. **IS_TAG_TO_CATEGORY**: タグが十分か
2. **PROMPT_TAG_MAPPING**: 翻訳プロンプトが割り当てられるか
3. **IS_INITIAL_DATA**: フィールド定義が十分か
4. **IS_CATEGORY_FIELDS**: 出力フィールドが十分か（10件上限）
5. **IS_BRAND_DICT**: ブランドが十分か、categoryフィルタが正しいか
6. **CATEGORY_RULES_**: バリデーションルールがあるか
7. **AI.gs**: カテゴリ固有のAIヒントが必要か

### 重要: カテゴリ確認時の注意
- **表面的な数値で判断しない**: タグ数やブランド数だけでなく、フィールドの中身が商品の実態に合っているか検証する
- **出品数が多いカテゴリは丁寧に**: リサーチ→3者協議→設計→レビューのフルプロセスで
- **小カテゴリでもルール追加のみで十分な理由を説明する**

---

## ■ 辞書の設計思想（理解必須）

- **AI主導パターン（ポケカV9準拠）**: AIがカテゴリ自動判定 → 辞書で補完
- **辞書はゲーティングではなく補完ツール**: 辞書にないカテゴリでもAIが処理する
- **IS_BRAND_DICTのcategoryフィールド**: ItemSpecifics.gs:769-778でフィルタリングに使用
- **タグ上書きパターン**: Figures→Collectibles、Guitars/Effects/Synths→Musical Instrumentsの上書きで段階的にカテゴリ分岐
- **prompts/フォルダとPromptTemplates.gsの関係**: sync_prompts_to_gs.pyで同期。clasp push後、初期設定で反映
- **ブランド辞書のcategoryは網羅的に設定**: Yamaha→Guitars+Synths & Digital+Musical Instruments、Fender→Guitars+Effects & Amps

---

## ■ 参照すべきファイル

### セッション開始時に必ず読むもの
1. `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下の全ルールファイル
2. このHANDOVER.md
3. `~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md`（コミット前チェックリスト5項目）
4. Obsidian開発ノート: `一括シートV3_辞書充実.md`（最重要）

### コード変更時に参照するファイル
- `ItemSpecifics/Config_IS.gs` — IS_INITIAL_DATA, IS_BRAND_DICT, IS_TAG_TO_CATEGORY, IS_CATEGORY_FIELDS
- `Config.gs` — PROMPT_TAG_MAPPING, SHIPPING_POLICY_CATEGORIES
- `Sanitize.gs` — SANITIZE_FIELDS_, CATEGORY_RULES_, FIELD_EN_TO_JP_
- `AI.gs` — カテゴリ固有AIヒント（カメラ、トレカ、ゲーム、コレクティブル）
- `Library/PromptTemplates.gs` — プロンプトテンプレート（44件）
- `prompts/` — プロンプトソースファイル（44件、コレクティブル.txt含む）

### コミット前チェックリスト（CLAUDE.mdに記載、5+1項目）
1. ScriptPropertiesチェック
2. ルートとLibraryの同期チェック
3. HtmlTemplates.gsチェック（.txt変更時）
4. PromptTemplates.gs同期チェック（prompts/変更時）
5. 変更ファイルの最終確認
6. **文字化けチェック**: `grep '��' Sanitize.gs`（今回追加）

---

## ■ 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| GPT質問 | `mcp__openai-bridge__ask_gpt` |
| Gemini（MCP） | `mcp__gemini-bridge__ask_gemini`（日本語長文でタイムアウトしやすい。短い英語で。今回は全滅だった） |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` / `multi_discuss` / `debate` / `consensus` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py` |
| HtmlTemplates更新 | `python3 Library/convert_html_to_gs.py` |
| clasp push | `cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
