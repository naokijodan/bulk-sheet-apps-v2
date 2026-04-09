# 一括シートV3 引き継ぎ文

> **読み手へ**: この文書は **章ごとに完結** しています。まず §0（TL;DR）と §1（絶対禁止事項）を読んでから、必要な章に飛んでください。初見は §0 → §1 → §2 → §3 → §4 の順に読めば15分で全体が把握できます。

---

## §0. TL;DR（最短で状況把握）

| 項目 | 内容 |
|---|---|
| **プロジェクト** | `~/Desktop/ツール開発/一括シートApps_v3/` |
| **言語/基盤** | Google Apps Script（GAS ライブラリ方式） |
| **本日の最新コミット** | `cc50bbb`（main） |
| **clasp push 状態** | 済み |
| **本日完了** | ①日本人形カテゴリ新設 ②TagShipping HEADERS 修正 ③AS2 ドロップダウン修正 |
| **次のタスク** | **IS_CATEGORY_FIELDS の 10→20件拡張**（大規模改修） |
| **作業モード** | ハーネスモード推奨 |
| **最初にやること** | §4（初期調査チェックリスト）を上から順に実行する |

---

## §1. 絶対禁止事項（Red Line）

次のタスクでこれを破るとアカウント停止・データ破損のリスクがあります。

1. **Codex/Gemini に丸投げして成果物を確認せずコミットしない**（今日の反省点）
2. **ノートを「エージェントの要約」で済ませない**。関連度が高いノートは必ず Read ツールで本体を直接読む
3. **1返信に複数の論点を詰め込まない**。1つずつユーザーと議論・確定してから次へ進む
4. **`syncPromptUpdate`（既存プロンプト上書き）は勝手にONにしない**。ユーザーが自分で編集したプロンプトを壊す
5. **eBayアカウントへの API 以外のアクセス禁止**（ブラウザ操作・スクレイピング全面禁止）
6. **ルート（`*.gs`）を変更したら `Library/` も必ず同期**。忘れると本番に反映されない
7. **HANDOVER.md を読まずに作業を始めない**。必ずこの文書を最初に読む
8. **IS_CATEGORY_FIELDS の 10件制限を前提にしない**。30件まで拡張されたので、メモリ `feedback_is_10field_limit.md` は既に無効化の対象

---

## §2. 本日（2026-04-09）完了した作業

### commit 1: `a0ff94c` — 日本人形カテゴリ新設

**目的**: こけし、博多人形など日本人形系商品を専用プロンプトで翻訳・出品できるようにする。

**eBayカテゴリ**: `35792` (Collectibles > Cultures & Ethnicities > Asian > 1900-Now > Japanese > Dolls)

**追加した12タグ**:
`こけし` / `日本人形` / `博多人形` / `市松人形` / `雛人形` / `五月人形` / `木目込み人形` / `御所人形` / `伏見人形` / `からくり人形` / `土人形` / `文楽人形`

**変更ファイル**:
| ファイル | 変更内容 |
|---|---|
| `Config.gs` | `PROMPT_TAG_MAPPING['日本人形']` に12タグ追加 |
| `ItemSpecifics/Config_IS.gs` | `IS_TAG_TO_CATEGORY` 12タグ + `IS_CATEGORY_FIELDS['Japanese Dolls']` 10フィールド |
| `Sanitize.gs` | `SANITIZE_FIELDS_['Japanese Dolls']` 13項目 + `CATEGORY_RULES_['Japanese Dolls']` 10ルール |
| `prompts/日本人形.txt` | 新規作成（辞書: 12種/8素材/12産地/7技法/8欠陥） |
| `Library/PromptTemplates.gs` | v1 新規追加 |
| `Library/Config.gs`, `Library/Config_IS.gs`, `Library/Sanitize.gs` | 同期 |

**運用方針**: 現代品とアンティーク混合。主カテゴリは 35792、アンティーク品は出品時に手動修正。

### commit 2: `e1148bf` — TagShipping HEADERS 想定関税閾値欠落バグ修正

**原因**: `Config.gs:204-206` の HEADERS が15要素で `'想定関税閾値'` が欠けていた。
**原因コミット**: `9db0f50`（2026-04-05 P列商品状態追加時に挟み忘れ）

**修正前**: `[...送料切替基準, 商品状態]`（15要素、O列=商品状態になる）
**修正後**: `[...送料切替基準, 想定関税閾値, 商品状態]`（16要素、O列=想定関税閾値、P列=商品状態）

### commit 3: `cc50bbb` — AS2ドロップダウン新プロンプト反映バグ修正

**問題1（順序逆転）**: `writeSettingsToSheet` 内で AS2 設定（L3518）→ sync（L3536）の順だったため、AS2 が古い GPT_Prompts 内容で作られていた
**修正**: sync ブロックを AS2 ブロックの直前に移動

**問題2（デフォルトOFF）**: `syncPromptAdd` チェックボックスがデフォルトOFF
**修正**: `SetupDialog.txt` で `syncPromptAdd` に `checked` 属性追加
**`syncPromptUpdate` はOFFのまま維持**（既存プロンプトの上書きリスクを避けるため）

---

## §3. 次のタスク: IS_CATEGORY_FIELDS 10→20件拡張（大規模改修）

### 3.1 何をやるか（1文）

**EAGLEの登録上限が30件に拡張されたため、`IS_CATEGORY_FIELDS` を現状の10件から最大20件まで拡張し、eBay Taxonomy API の推奨フィールドを追加採用する。**

### 3.2 なぜ大規模改修なのか

単純な「10→20」ではない4つの理由:

| # | 理由 |
|---|---|
| 1 | **eBay Taxonomy API の再調査**: 全72カテゴリ分、必須/推奨/任意フィールドを再取得して取捨選択 |
| 2 | **交通整理との密結合**: `IS_CATEGORY_FIELDS` は `SANITIZE_FIELDS_` のフォールバック元。フィールド増加が抽出精度に直接影響 |
| 3 | **作業シート出力列の見直し**: AW列（`EN_DESC_SANITIZED`）に交通整理英語版を出しているが、ItemSpecifics 出力が増えると列配置の再検討が必要な可能性 |
| 4 | **3レイヤー整合性の再検証**: 2026-04-06 の Phase 2（G1〜G24の72カテゴリ全検証）をもう一度やり直す規模 |

### 3.3 ユーザー報告からの疑問点（要検証）

ユーザーが「AI列に交通整理の英語版が出ている」と言及したが、**コード上は `EN_DESC_SANITIZED: 49`（AW列）** が交通整理英語版の出力先。AI列（35列目）ではない。

**次セッションで最初に確認すべきこと**:
- ユーザーの記憶違いなのか、別の列に出力しているのか
- AW列とAI列のどちらで運用されているか、実機で確認
- 関連コード: `Sanitize.gs:1374, 1401, 1431` の `setValue` 箇所

### 3.4 ゴール条件（暫定、ユーザー承認待ち）

- [ ] 全72カテゴリの `IS_CATEGORY_FIELDS` が新しい件数（最大20）に更新されている
- [ ] eBay推奨フィールドを優先的に採用している
- [ ] `SANITIZE_FIELDS_` と `CATEGORY_RULES_` が新フィールドと整合している
- [ ] 作業シートへの出力列が明確に定義されている
- [ ] 3レイヤー整合性（`PROMPT_TAG_MAPPING` / `IS_TAG_TO_CATEGORY` / `IS_CATEGORY_FIELDS` / `prompts/*.txt`）が保たれている
- [ ] 既存ユーザーデータが壊れない
- [ ] Claude + Gemini の2者レビューで PASS
- [ ] `feedback_is_10field_limit.md` が更新されている

---

## §4. 最初にやる調査チェックリスト（この順で実行）

次セッションの **最初の30分** でここを埋める。ここが埋まる前にコードに触らない。

### Step 4-1. ルール再読

```bash
# 必ず最初に読む
cat ~/.claude/CLAUDE.md
ls ~/.claude/rules/
```

**最低限読むファイル**:
- `~/.claude/CLAUDE.md`
- `~/.claude/rules/harness-mode.md`
- `~/.claude/rules/tmux-harness.md`
- `~/.claude/rules/code-review-evaluator.md`
- `~/.claude/rules/session-start.md`

### Step 4-2. この HANDOVER.md を読む

この文書全体を通読。§0〜§9まで。

### Step 4-3. git の状態確認

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
git status
git log --oneline -20
git branch
```

**確認項目**: 最新コミットが `cc50bbb` であること、main ブランチにいること、未コミット変更が CPSC 関連（`.harness-worker-*`、`docs/harness/`）等の既知のもののみであること。

### Step 4-4. プロジェクト CLAUDE.md を読む

```bash
cat ~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md
```

特に「ライブラリ同期ルール」「ScriptProperties 禁止」「3者協議ルール」「コミット前チェックリスト」を把握。

### Step 4-5. Obsidian ノートを直接読む（重要）

**❌ エージェントの要約に頼らない。必ず Read ツールで本体を開く。**

以下5件は最低限の必読:

| ファイル | パス |
|---|---|
| 3レイヤー検証の完全記録 | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_3レイヤー検証.md` |
| IS辞書改修の経緯 | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_IS辞書改修.md` |
| IS複数カテゴリ追加 | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_IS複数カテゴリ追加.md` |
| ItemSpecifics交通整理統合 | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_ItemSpecifics交通整理統合.md` |
| 辞書充実プロジェクト | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_辞書充実.md` |

### Step 4-6. 現状把握のコード読み

以下5箇所は最低限の直接確認:

```bash
# Config.gs の CONFIG.COLUMNS 定義（作業シートの列番号マップ）
# L22-75 を読む

# ItemSpecifics/Config_IS.gs の IS_CATEGORY_FIELDS
# L4086-4159 を読む（全72カテゴリの10フィールド配列）

# Sanitize.gs の SANITIZE_FIELDS_
# L15-81 を読む（専用定義のある12カテゴリ）

# Sanitize.gs の CATEGORY_RULES_
# L86-900+ を読む（AI補足ルール辞書）

# Sanitize.gs の getSanitizeFields_ 関数（フォールバックロジック）
# L999- を読む
```

### Step 4-7. ユーザーに確認すべき事項をまとめる

この時点でユーザーに聞くべきこと（次セッション開始時に確認）:

1. **AI列 vs AW列**: どちらに交通整理英語版を出力したいか
2. **最大フィールド数**: 20件で確定か、EAGLE の30件まで使うか
3. **段階的リリース**: 先にパイロットカテゴリ数件だけで動作確認するか、一気に全72カテゴリやるか
4. **優先順位**: 72カテゴリのうち、優先的に拡張すべきカテゴリはあるか
5. **列配置変更の許容範囲**: 既存の作業シートの列を動かしてよいか（既存データへの影響）

---

## §5. ファイル・ツール・パス一覧（Reference Map）

### 5.1 プロジェクト内ファイル

```
~/Desktop/ツール開発/一括シートApps_v3/
├── Config.gs                          # CONFIG定数、列番号、HEADERS、PROMPT_TAG_MAPPING、SANITIZE_CATEGORIES
├── Sanitize.gs                        # 交通整理、SANITIZE_FIELDS_、CATEGORY_RULES_、FIELD_EN_TO_JP_
├── Translation.gs                     # 翻訳処理、tagToPromptMap構築、D列タグ→プロンプト選択
├── AI.gs                              # AI API呼び出し、前処理/後処理
├── Shipping.gs                        # 送料計算
├── Assistant.gs                       # アシスタント機能
├── Debug.gs                           # デバッグ
├── EAGLE商品データ連携.gs              # EAGLE連携
├── Utils.gs                           # ユーティリティ、buildTagOverrideMap_、getShippingCalcMethodFromLabel_等
├── Sanitize.gs
├── インポート用.gs                    # Webhook受信
├── コード_Part1_価格計算・バッチ処理.gs  # 価格計算、getAllPromptIds、applyCalculationBatch_等
├── コード_Part2_テンプレート・ポリシー関連.gs
├── コード_Part3_メニュー・設定関連.gs  # writeSettingsToSheet、ensureTagShippingSheet_、writeTagListToSheet_、writePromptTagMapping_
├── コード_Part4_テンプレート・ポリシー関連.gs
├── コード_Part5_インポート機能関連.gs
├── ItemSpecifics/
│   ├── Config_IS.gs                   # IS_TAG_TO_CATEGORY、IS_CATEGORY_FIELDS、IS_BRAND_DICT、CATEGORY_RULES_、IS_*_PATTERNS
│   └── ItemSpecifics.gs
├── Library/                           # GASライブラリ版（clasp push 先）
│   ├── AI.gs
│   ├── Config.gs                      # ルートと同期必須
│   ├── Config_IS.gs                   # 同期必須
│   ├── Sanitize.gs                    # 同期必須
│   ├── PromptTemplates.gs             # prompts/*.txt を Python スクリプトで再生成
│   ├── HtmlTemplates.gs               # *.txt（HTML）を Python スクリプトで再生成
│   ├── コード_Part1〜5.gs              # 同期必須
│   ├── convert_html_to_gs.py          # HTML → HtmlTemplates.gs 再生成スクリプト
│   ├── convert_prompts_to_gs.py       # prompts/*.txt → PromptTemplates.gs（旧版）
│   ├── sync_prompts_to_gs.py          # prompts/*.txt → PromptTemplates.gs（新版、バージョン管理対応）
│   └── ...
├── prompts/                           # 翻訳プロンプト本体（58ファイル）
│   ├── 時計用.txt
│   ├── ポケカ.txt
│   ├── 日本人形.txt                   # 2026-04-09 新規作成
│   └── ...
├── SetupDialog.txt                    # 初期設定ダイアログ HTML
├── PriceCalc.txt
├── ShippingPolicyCategoryDialog.txt
├── ...                                # その他の .txt HTML テンプレート
├── docs/
│   ├── shipping-mode-refactor-plan.md
│   └── harness/                       # ハーネスモード作業ディレクトリ
├── HANDOVER.md                        # この文書
└── CLAUDE.md                          # プロジェクト固有ルール
```

### 5.2 外部ツール・リソース

| ツール | パス | 用途 |
|---|---|---|
| **eBay Taxonomy API 調査ツール** | `~/Desktop/eBayカテゴリ調査/` | カテゴリごとの必須/推奨/任意フィールド取得 |
| **CPSC提案書**（別件、保留中） | `~/Desktop/cpsc-proposal/` | 2026-04-07作成、他メンバー確認待ち |
| **テンプレートHTML関連** | `~/Desktop/ツール開発/一括シート関連ツール/テンプレートHTML/` | HTMLテンプレート管理 |
| **Obsidian 開発ログ（メイン）** | `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/` | 直近の開発記録（Desktop側より新しい） |
| **Obsidian 開発ログ（旧）** | `~/Desktop/開発ログ/` | 古い記録。iCloud側と差分あり |
| **Codex CLI** | `/opt/homebrew/bin/codex` | コーディング委託 |
| **Gemini CLI** | MCP ブリッジ経由（`mcp__gemini-bridge__*`） | リサーチ・レビュー |
| **clasp** | `npx clasp`（`which clasp` は not found） | Apps Script デプロイ |
| **tmux-harness 起動** | `~/.claude/scripts/tmux-harness/init.sh` | ハーネスモード起動 |
| **tmux-harness 指示送信** | `~/.claude/scripts/tmux-harness/send.sh` | 子セッションへの指示 |
| **Discord 通知** | `~/.claude/scripts/notify-discord.sh` | 完了通知 |
| **デスクトップ起動ボタン** | `~/Desktop/Harness.command` | ダブルクリックで新規セッション |

### 5.3 コード位置（重要箇所）

| 機能 | ファイル | 行 |
|---|---|---|
| `CONFIG.COLUMNS` 列番号定義 | `Config.gs` | L22-75 |
| `CONFIG.TAG_SHIPPING.HEADERS` | `Config.gs` | L204-206 |
| `PROMPT_TAG_MAPPING` | `Config.gs` | L247-302 |
| `SANITIZE_CATEGORIES`（交通整理キーワード） | `Config.gs` | L213-240 |
| `IS_TAG_TO_CATEGORY` | `ItemSpecifics/Config_IS.gs` | L3692-3982 |
| `IS_CATEGORY_FIELDS` | `ItemSpecifics/Config_IS.gs` | L4086-4159 |
| `SANITIZE_FIELDS_` | `Sanitize.gs` | L15-81 |
| `CATEGORY_RULES_` | `Sanitize.gs` | L86以降 |
| `FIELD_EN_TO_JP_` | `Sanitize.gs` | L870-983 |
| `SANITIZE_GENERIC_FIELDS_` | `Sanitize.gs` | L985-989 |
| `getSanitizeFields_(category)` | `Sanitize.gs` | L999- |
| 交通整理英語版書き込み | `Sanitize.gs` | L1374, L1401, L1431 |
| `writeSettingsToSheet` 関数 | `コード_Part3_メニュー・設定関連.gs` | L3325- |
| `ensureTagShippingSheet_` | `コード_Part3_メニュー・設定関連.gs` | L3569- |
| `writeTagListToSheet_` | `コード_Part3_メニュー・設定関連.gs` | L3711- |
| `writePromptTagMapping_` | `コード_Part3_メニュー・設定関連.gs` | L4613- |
| `syncPromptsToSheet_` | `コード_Part3_メニュー・設定関連.gs` | L2672-2798 |
| `getAllPromptIds` | `コード_Part1_価格計算・バッチ処理.gs` | L15-29 |
| `buildTagOverrideMap_` | `Library/Utils.gs` | L1112-1144 |
| `tagToPromptMap` 構築 | `Translation.gs` | L49-88 |
| D列タグ→プロンプト選択ロジック | `Translation.gs` | L253-267 |

### 5.4 メモリファイル（更新対象）

```
~/.claude/projects/-Users-naokijodan/memory/
├── MEMORY.md                              # 目次（常にロードされる）
├── feedback_is_10field_limit.md           # ⚠️ 次タスクで更新必須（10件→20件）
├── feedback_one_by_one_discussion.md      # 2026-04-09追加
├── feedback_read_notes_not_summaries.md   # 2026-04-09追加
├── feedback_tag_design_pattern.md         # タグ設計パターン
├── feedback_session_bulkv3_20260404.md    # 過去の反省点
└── ...
```

---

## §6. 1カテゴリを改修する標準手順（10ステップ）

次タスクで各カテゴリに対して繰り返し実行する標準手順。**この順序を守ること。**

### Step 6-1. 対象カテゴリ名を確定

```bash
# 現在の IS_CATEGORY_FIELDS[カテゴリ名] を確認
cd ~/Desktop/ツール開発/一括シートApps_v3
grep -n "'カテゴリ名':" ItemSpecifics/Config_IS.gs
```

### Step 6-2. eBay Taxonomy API で最新フィールドを取得

```bash
cd ~/Desktop/eBayカテゴリ調査

# カテゴリ名から検索
node dist/index.js --search "カテゴリ名（英語）" --details

# カテゴリID が分かっている場合
node dist/index.js <カテゴリID>

# サブツリーを見たい場合
node dist/index.js --tree <親カテゴリID> --depth 3
```

**取得すべき情報**: 必須（aspectRequired=true）/ 推奨（aspectUsage=RECOMMENDED）/ 任意（OPTIONAL）フィールドの全件。

### Step 6-3. 既存の IS_CATEGORY_FIELDS と差分を確認

```bash
# 該当カテゴリの現在のフィールドを読む
grep -A 1 "'カテゴリ名':" ItemSpecifics/Config_IS.gs
```

### Step 6-4. 追加するフィールドを決定

**決定基準（優先順位）**:
1. eBay の必須（REQUIRED）は必ず含める
2. eBay の推奨（RECOMMENDED）を優先的に追加
3. 任意（OPTIONAL）の中から、出品商品の特性に合ったものを追加
4. 最大20件を超えない
5. 既存のフィールド順序を可能な限り維持

### Step 6-5. Sprint Contract を作成（ハーネスモード時）

```bash
# 対象タスクごとに Sprint Contract を作成
# docs/harness/contracts/category-<name>.md
```

内容: 目的・成功条件・検証方法・プロセス要件。ユーザー承認を得るまで子セッションに渡さない。

### Step 6-6. コード変更を Codex CLI に委託

```bash
/opt/homebrew/bin/codex exec --full-auto "
タスク: ItemSpecifics/Config_IS.gs の IS_CATEGORY_FIELDS['カテゴリ名'] を以下に変更してください。

現状: ['Field1', 'Field2', ..., 'Field10']
変更後: ['Field1', 'Field2', ..., 'Field20']

注意:
- 既存の他のエントリを一切変更しない
- スタイル（シングルクォート、配列内のインデント）を既存に合わせる
"
```

### Step 6-7. Codex の diff をレビュー

```bash
git diff ItemSpecifics/Config_IS.gs
```

**チェック項目**:
- 対象カテゴリのみが変更されている
- 既存のフィールドが保持されている
- 新フィールドが正しい位置に挿入されている
- 配列の末尾カンマ等のシンタックス誤り無し

### Step 6-8. SANITIZE_FIELDS_ と CATEGORY_RULES_ を必要に応じて更新

```bash
# 該当カテゴリが SANITIZE_FIELDS_ に専用定義を持つか確認
grep "'カテゴリ名':" Sanitize.gs
```

- 専用定義がある場合: SANITIZE_FIELDS_ も新フィールドに対応して更新
- 専用定義がない場合: IS_CATEGORY_FIELDS からの自動変換に任せる（または新たに専用定義を作る）
- CATEGORY_RULES_ に新フィールドの判断基準を追加（AIへの具体的指示）

### Step 6-9. Library 同期

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
cp ItemSpecifics/Config_IS.gs Library/Config_IS.gs
cp Sanitize.gs Library/Sanitize.gs
# 他に変更したファイルも同期
```

### Step 6-10. 3レイヤー整合性チェック（§7 のコマンドを実行）

問題なければ次のカテゴリへ。

---

## §7. 検証コマンド集（コピペで実行可能）

### 7-1. 3レイヤー整合性チェック

**PROMPT_TAG_MAPPING と IS_TAG_TO_CATEGORY の整合性**:

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
python3 << 'EOF'
import re

# PROMPT_TAG_MAPPING から全タグを抽出
with open('Config.gs', 'r') as f:
    config = f.read()

# 簡易抽出: 'カテゴリ': ['タグ1', 'タグ2', ...]
prompt_tags = set()
for line in config.split('\n'):
    m = re.match(r"\s*'([^']+)':\s*\[(.*)\],?\s*$", line)
    if m:
        tags = re.findall(r"'([^']+)'", m.group(2))
        prompt_tags.update(tags)

# IS_TAG_TO_CATEGORY から全タグを抽出
with open('ItemSpecifics/Config_IS.gs', 'r') as f:
    config_is = f.read()

is_tags = set()
for m in re.finditer(r"'([^']+)':\s*'[^']+'", config_is):
    is_tags.add(m.group(1))
for m in re.finditer(r"IS_TAG_TO_CATEGORY\['([^']+)'\]", config_is):
    is_tags.add(m.group(1))

only_prompt = prompt_tags - is_tags
only_is = is_tags - prompt_tags

print(f"PROMPT_TAG_MAPPING: {len(prompt_tags)} タグ")
print(f"IS_TAG_TO_CATEGORY: {len(is_tags)} タグ")
print(f"PROMPTにあってISに無い: {len(only_prompt)}")
if only_prompt:
    for t in sorted(only_prompt):
        print(f"  - {t}")
print(f"ISにあってPROMPTに無い: {len(only_is)}")
if only_is:
    for t in sorted(only_is):
        print(f"  - {t}")
EOF
```

### 7-2. prompts/ と PromptTemplates.gs の整合性

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
python3 -c "
import re, os, glob
with open('Library/PromptTemplates.gs', 'r') as f:
    pt = set(re.findall(r\"PROMPT_TEMPLATES\['([^']+)'\]\", f.read()))
txts = set(os.path.splitext(os.path.basename(f))[0] for f in glob.glob('prompts/*.txt'))
missing = txts - pt
extra = pt - txts
if missing:
    print('未反映: ' + ', '.join(missing))
if extra:
    print('prompts/に無い: ' + ', '.join(extra))
if not missing and not extra:
    print(f'OK: {len(pt)}件一致')
"
```

### 7-3. ルート ⇔ Library 同期チェック

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
for f in Config.gs Sanitize.gs Translation.gs AI.gs Utils.gs Shipping.gs Debug.gs Assistant.gs \
         "コード_Part1_価格計算・バッチ処理.gs" "コード_Part2_テンプレート・ポリシー関連.gs" \
         "コード_Part3_メニュー・設定関連.gs" "コード_Part4_テンプレート・ポリシー関連.gs" \
         "コード_Part5_インポート機能関連.gs" "EAGLE商品データ連携.gs" "インポート用.gs"; do
  if [ -f "Library/$f" ]; then
    if diff -q "$f" "Library/$f" > /dev/null 2>&1; then
      echo "OK: $f"
    else
      echo "NG: $f (差分あり)"
    fi
  fi
done
# Config_IS は特殊（ルートは ItemSpecifics/ 配下）
diff -q ItemSpecifics/Config_IS.gs Library/Config_IS.gs > /dev/null && echo "OK: Config_IS.gs" || echo "NG: Config_IS.gs"
```

### 7-4. ScriptProperties 混入チェック（CLAUDE.md ルール）

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
echo "=== Library 内 ==="
grep -rn "getScriptProperties" Library/*.gs
echo "=== ルート内 ==="
grep -n "getScriptProperties" *.gs
# 結果が「なし」であること
```

### 7-5. IS_CATEGORY_FIELDS の件数チェック

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
python3 << 'EOF'
import re
with open('ItemSpecifics/Config_IS.gs', 'r') as f:
    content = f.read()

# IS_CATEGORY_FIELDS の中身を抽出
m = re.search(r'var IS_CATEGORY_FIELDS = \{(.*?)\};', content, re.DOTALL)
if m:
    body = m.group(1)
    for line in body.split('\n'):
        mm = re.match(r"\s*'([^']+)':\s*\[([^\]]*)\]", line)
        if mm:
            fields = re.findall(r"'[^']+'", mm.group(2))
            category = mm.group(1)
            count = len(fields)
            marker = '' if count <= 20 else ' ⚠️ 20超'
            print(f"{count:3d}: {category}{marker}")
EOF
```

### 7-6. TagShipping HEADERS の整合性チェック

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
python3 << 'EOF'
import re
with open('Config.gs', 'r') as f:
    content = f.read()
m = re.search(r"HEADERS:\s*\[(.*?)\]", content, re.DOTALL)
if m:
    headers = re.findall(r"'([^']+)'", m.group(1))
    print(f"HEADERS: {len(headers)} 要素")
    for i, h in enumerate(headers):
        col = chr(ord('A') + i) if i < 26 else 'A' + chr(ord('A') + i - 26)
        print(f"  {col}列: {h}")
EOF
```

---

## §8. ハーネスモード起動手順

### 8-1. 起動前チェック

```bash
# 親窓IDを取得（ハーネス初期化後に必要）
osascript -e 'tell application "Terminal" to return id of front window'
```

### 8-2. tmux-harness の起動（推奨）

デスクトップの `Harness.command` をダブルクリック、または:

```bash
~/.claude/scripts/tmux-harness/init.sh
```

起動後、6ペイン（parent / child-a / child-b / child-c / codex / gemini）が1つの tmux ウィンドウに配置される。

### 8-3. 子セッションへの指示送信

```bash
# 指示ファイルを作成
echo "具体的な指示内容" > ~/.tmux-harness/sessions/<セッション名>/instructions/child-a-task.txt

# send.sh で送信（親から子へ）
~/.claude/scripts/tmux-harness/send.sh <セッション名> child-a ~/.tmux-harness/sessions/<セッション名>/instructions/child-a-task.txt
```

### 8-4. harness-mode（旧方式）起動手順

`rules/harness-mode.md` L20- 参照。こちらは別窓を osascript で起動する旧方式。tmux-harness が新方式。

### 8-5. 報告ファイルの確認

子セッションは報告を以下に書き込む:

```
~/.tmux-harness/sessions/<セッション名>/reports/<子名>-<タイムスタンプ>.json
```

親は30秒ごとにポーリングして検出。

### 8-6. Sprint Contract の作成

```bash
# Sprint Contract テンプレート
cat > ~/.tmux-harness/sessions/<セッション名>/contracts/<タスクID>.md << 'EOF'
# Sprint Contract: {タスク名}

## 目的
{何を達成するか。1〜2行}

## 成功条件
- 条件1
- 条件2

## 検証方法
{親がどう完了を確認するか}

## プロセス要件【必須】
- [ ] 並列エージェントを立てる（該当する場合）
- [ ] Obsidian ノートを検索
- [ ] 関連コードを読む
- [ ] git log 確認
- [ ] 推測禁止。Fact/Inference/Unknown 明記
EOF
```

---

## §9. 実機テスト手順

### 9-1. clasp push 後の確認

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3/Library
npx clasp push
```

### 9-2. スプレッドシート側での確認

1. 該当スプレッドシートを開く
2. メニューから「初期設定」を実行
3. 以下を順にチェック:

| 確認項目 | 期待結果 |
|---|---|
| `TagShipping` シート O1 | `想定関税閾値` |
| `TagShipping` シート P1 | `商品状態` |
| `TagShipping` シート S1-T1 | `使えるタグ名 / 翻訳プロンプト` |
| `TagShipping` シート S列 `【日本人形】`以下 | 12タグが表示される |
| `GPT_Prompts` シート A列 | `日本人形` を含む全プロンプトID |
| `GPT_Prompts` シート E列（対象タグ） | 各プロンプトに対応するタグリスト |
| 作業シート AS2 ドロップダウン | `日本人形` が選択肢に含まれる |
| 作業シート AS3 ドロップダウン | `手動` / `自動選択` |
| 作業シート AW列 | （交通整理実行後）英語版の出力 |

### 9-3. 翻訳動作テスト

1. 作業シートの1行にテスト商品を入れる（例: 「こけし 鳴子 手彫り 昭和」）
2. D列タグに `こけし` を入れる
3. `自動選択` モードで翻訳実行
4. Logger 出力で `promptId: 日本人形` が選ばれていることを確認
5. 翻訳結果に `Kokeshi Doll` などの英語辞書が使われていることを確認

### 9-4. 異常時のロールバック

```bash
# 直前のコミットに戻す（ローカルのみ）
git reset --hard HEAD~1

# 本番ロールバック（clasp push やり直し）
cd Library && npx clasp push
```

**注意**: ユーザーの作業スプレッドシートへの影響を最小化するため、rollback はユーザー確認後に実行。

---

## §10. コミット前チェックリスト

```bash
# これを毎回コミット前に実行

cd ~/Desktop/ツール開発/一括シートApps_v3

# 1. ScriptProperties チェック
grep -rn "getScriptProperties" Library/*.gs
# 結果が空（なし）であること

# 2. ルート⇔Library 同期チェック
git diff --name-only | grep -v Library | while read f; do
  if [ -f "Library/$f" ]; then
    if ! diff -q "$f" "Library/$f" > /dev/null 2>&1; then
      echo "⚠️ 未同期: $f と Library/$f"
    fi
  fi
done

# 3. HtmlTemplates.gs 再生成チェック（.txt変更時）
if git diff --name-only | grep -q '\.txt$'; then
  echo "⚠️ .txt が変更されている。HtmlTemplates.gs 再生成を忘れずに"
  python3 Library/convert_html_to_gs.py
fi

# 4. PromptTemplates.gs 同期チェック（prompts/ 変更時）
if git diff --name-only | grep -q 'prompts/'; then
  echo "⚠️ prompts/ が変更されている。sync_prompts_to_gs.py 実行を忘れずに"
  python3 Library/sync_prompts_to_gs.py
fi

# 5. 変更ファイルの最終確認
git status
git diff --stat
```

---

## §11. Git 作業フロー

### 11-1. コミットメッセージフォーマット

```
<type>: <description>

<optional body>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

### 11-2. 推奨手順

```bash
# 1. 変更ファイルを明示的に add（広い glob は禁止）
git add Config.gs Library/Config.gs  # 個別に指定

# 2. ステータス確認
git status --short

# 3. コミット（HEREDOC でメッセージ作成）
git commit -m "$(cat <<'EOF'
feat: 日本人形カテゴリ新設（3レイヤー連携）

- PROMPT_TAG_MAPPING に12タグ追加
- IS_TAG_TO_CATEGORY に12タグのマッピング
- IS_CATEGORY_FIELDS に10フィールド
- prompts/日本人形.txt 新規作成
EOF
)"

# 4. clasp push
cd Library && npx clasp push

# 5. Discord 通知（コード変更完了時）
~/.claude/scripts/notify-discord.sh "日本人形カテゴリ新設 完了"
```

### 11-3. 過去コミットの参照コマンド

```bash
# 関連コミット一覧（直近1週間）
git log --since="2026-04-02" --pretty=format:"%h %ad %s" --date=short

# 特定コミットの差分
git show <hash>
git show <hash> --stat
git show <hash> -- Config.gs  # 特定ファイルのみ

# 特定文字列を追加/削除したコミット
git log --oneline -S "IS_CATEGORY_FIELDS"
git log --oneline -S "10件制限"

# ファイルの全履歴
git log --oneline --follow ItemSpecifics/Config_IS.gs
```

### 11-4. 今回のタスクで参照すべき過去コミット

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3

# 2026-04-06 Phase 2 完了（3レイヤー検証）
git show 1b0b109  # feat: Phase 3 翻訳プロンプト再検証
git show 0bc3e2d  # feat: G19 日本伝統・骨董を5専用カテゴリに分離
git show eba6995  # fix: G16 Dolls&Plush/Figures タグを PROMPT_TAG_MAPPING 追加
git show 9db0f50  # feat: TagShippingシートP列で商品状態

# 2026-04-07 Phase 2.5 UI修正
git show 29d3e73  # feat: TagShippingタグ一覧更新チェックボックス追加

# 2026-04-06 包丁新カテゴリ新設（近い先例）
git show a0cc4e2  # feat: 包丁新設（10フィールド設計の参考）
git show fc9217f  # fix: ガンダムカードIS_TAG_TO_CATEGORY追加

# 2026-04-09 本日の作業
git show a0ff94c  # feat: 日本人形カテゴリ新設
git show e1148bf  # fix: TagShipping HEADERS想定関税閾値
git show cc50bbb  # fix: AS2ドロップダウン新プロンプト反映
```

---

## §12. 制約とリスク

### 12-1. eBayアカウント保護（最優先）

- **eBayへのアクセスはAPI経由のみ**。ブラウザ操作・スクレイピング全面禁止
- **OAuth認証が必要な場合**は URL をユーザーに提示して手動ログインしてもらう
- **誤ったISフィールド設定で出品エラー多発** → アカウント制限リスク

### 12-2. 既存ユーザーデータ保護

- 作業シートに既存出品データがある場合、**列の移動・削除で壊さない**
- **段階的リリース**: いきなり全72カテゴリではなく、1〜3カテゴリで先に動作確認
- **ユーザーの自作プロンプトを上書きしない**（`syncPromptUpdate` は勝手にONにしない）

### 12-3. Codex CLI 使用量

- **OpenAI使用量制限**: 全72カテゴリを1セッションで処理すると制限に達する可能性
- **対策**: タスク分割、ハーネスモードで複数セッションに分散
- **過去事例**: 2026-04-07 セッションで Codex の使用量制限に到達した記録あり（ノート参照）

### 12-4. デプロイの慎重さ

- **clasp push は必要最小限に**: 短時間に連続push禁止
- **1つずつデプロイ**、動作確認してから次
- **デプロイ後のヘルスチェック**: スプレッドシート側でメニュー再起動、初期設定実行、動作確認

### 12-5. Gemini CLI 制限

- 429エラー時は **20秒待機してリトライ1回**
- それでも失敗したら **Claude/Codex に引き継ぐ**
- **勝手に代替手段に切り替えず、必ずユーザー報告**

### 12-6. 3者協議の必要性

以下のタイミングで **必ず Claude + Gemini 2者レビュー**:
- コード変更完了時
- 計画の重要判断時
- 意見が割れた時

`rules/code-review-evaluator.md` 参照。

---

## §13. ユーザー情報

- **ユーザーは非プログラマー**: 技術用語を避け、平易な日本語で説明する。です・ます調
- **「素晴らしい」「完璧」等の過度な賞賛は使わない**。事実を淡々と報告する
- **お願いは1つずつ**

---

## §14. 現在のステータス（2026-04-09）

| 項目 | 状態 |
|---|---|
| ブランチ | `main` |
| 最新コミット | `cc50bbb` fix: AS2ドロップダウン新プロンプト反映バグ修正+syncPromptAddデフォルトON |
| clasp push | 済み（24ファイル） |
| 本日の動作確認 | ユーザー確認済み |
| 未解決の積み残し | なし |
| 次のアクション | ユーザーの指示を待って §3 の IS拡張タスクを開始 |

---

## §15. 関連メモリ・参考資料

### 必読メモリ

```bash
cat ~/.claude/projects/-Users-naokijodan/memory/MEMORY.md
cat ~/.claude/projects/-Users-naokijodan/memory/feedback_is_10field_limit.md  # 要更新
cat ~/.claude/projects/-Users-naokijodan/memory/feedback_tag_design_pattern.md
cat ~/.claude/projects/-Users-naokijodan/memory/feedback_read_notes_not_summaries.md  # 本日追加
cat ~/.claude/projects/-Users-naokijodan/memory/feedback_one_by_one_discussion.md  # 本日追加
cat ~/.claude/projects/-Users-naokijodan/memory/feedback_session_bulkv3_20260404.md
```

### 必読 Obsidian ノート（直接Read）

```bash
# iCloud 側（メイン）
ls "/Users/naokijodan/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/" | grep V3

# 特に重要
# 一括シートV3_3レイヤー検証.md
# 一括シートV3_辞書充実.md
# 一括シートV3_IS辞書改修.md
# 一括シートV3_タグ別送料管理.md
```

### プロジェクト内ドキュメント

```bash
cat ~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md
cat ~/Desktop/ツール開発/一括シートApps_v3/docs/shipping-mode-refactor-plan.md
```

### ルール集

```bash
ls ~/.claude/rules/
# CLAUDE.md（グローバル）
# code-review-evaluator.md
# codex-standards.md
# completion.md
# deploy-rules.md
# git-workflow.md
# harness-mode.md
# project-search.md
# security.md
# session-start.md
# testing.md
# three-party.md
# tmux-harness.md
# tmux-harness-verification-report.md
```

---

## §16. セッション開始時のワンライナー確認

次セッション開始時、最初にこれを実行すれば全体状況が一目で分かる:

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3 && \
echo "=== Git ===" && git log --oneline -5 && \
echo "=== Status ===" && git status --short && \
echo "=== IS_CATEGORY_FIELDS 件数 ===" && \
python3 -c "
import re
with open('ItemSpecifics/Config_IS.gs', 'r') as f:
    m = re.search(r'var IS_CATEGORY_FIELDS = \{(.*?)\};', f.read(), re.DOTALL)
    if m:
        count = 0
        over = 0
        for line in m.group(1).split('\n'):
            mm = re.match(r\"\s*'([^']+)':\s*\[([^\]]*)\]\", line)
            if mm:
                count += 1
                n = len(re.findall(r\"'[^']+'\", mm.group(2)))
                if n > 10:
                    over += 1
        print(f'  合計: {count} カテゴリ')
        print(f'  10件超: {over} カテゴリ')
" && \
echo "=== prompts/ 数 ===" && ls prompts/*.txt | wc -l && \
echo "=== HANDOVER.md 最終更新 ===" && ls -l HANDOVER.md
```

---

以上。次セッションはこの HANDOVER.md を §0 から順に読んで、§4 の初期調査チェックリストを実行してください。
