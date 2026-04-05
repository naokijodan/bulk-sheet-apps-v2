# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 現在のステータス

- ブランチ: main
- 最新コ���ット: `abe1d36`
- clasp push: **実施済み**
- 動かないもの: なし

## ■ 前回のセッション（2026-04-06）でやったこと

### 辞書確認カテゴリ（Pens〜Records: 20カテゴリ完了）

| # | カテゴリ | 内容 | コミット |
|---|---------|------|---------|
| 41 | Pens | ブランド+3、ボディ素材・Filling System修正 | `8b371a9` |
| 42 | Wallets | タグ+6、Closure追加、ブランド+5、ルール改善 | `3fe1881` |
| - | Lighters | **削除**（発送不可） | `37e672d` |
| 43 | Art | タグ+5、ルール改善（作家名ローマ字変換） | `61754cf` |
| 新設 | Kakejiku | **掛軸分離**（10フィールド、8ルール） | `61754cf` |
| 44 | Pottery | タグ+17（産地名）、Origin/Kiln追加、6ルール新設 | `5bae070` |
| 45-46 | Belts+Belt Buckles | ルール改善（バックル専用に書き換え） | `8944796` |
| 47 | Golf Heads | ブランド+2（Wilson Staff/Yonex） | `9eb9659` |
| 48 | Kimono | タグ+11、Pattern/Technique追加、7ルール新設 | `ff83e55` |
| 49 | Japanese Swords | **刀装具特化**（刀身発送不可、10フィールド全面変��） | `d8741ad` |
| 50-51 | Tea Ceremony+Bonsai | フィールド5→10/6→10、ルール新設、盆栽輸出不可警告 | `d20b775` |
| 52-53 | Prints+Buddhist Art | フィールド7→10/5→10、ルール新設（浮世絵作家名/仏像尊格） | `ed51a30` |
| 54-61 | Tetsubin/Golf/Tennis/Baseball/Japanese Instruments/Stamps/Coins/Records | 一括改善 | `abe1d36` |

### 主要な設計判断
- **Lighters削除**: 危険物のため国際発送不可
- **Kakejiku新設**: 掛軸は絵画と商品特性が異なるため分離
- **Japanese Swords刀装具特化**: 刀身は発送不可。鍔/拵え専用フィールドに全面変更
- **Bonsai周辺グッズ特化**: 生きた木は輸出不可。鉢/道具/水石に特化
- **全カテゴリ共通**: 作家名ヘボン式ローマ字変換ルール追加

## ■ 次にやること

### 残り3カテゴリ（ユーザーが起きてから）
- **Anime** — 難しいカテゴリ。ユーザーと相談して進める
- **Figures** — 同上
- **RC & Models** — リサーチが必要

### 確認済みカテゴリ数
- 確認済み: 61/64（Lighters削除で63カテゴリ）+ 新設7
- 残り: 3カテゴリ（Anime/Figures/RC & Models）

## ■ 特に注意

- E-02レビュー必須（Claude+GPT最低2者）
- 表面的な数値で「充実済み」と判断しない。フィールドの中身を検証すること
- Gemini MCPブリッジは全滅中。Claude+GPTで進行
- 文字化けチェック: `grep '��' Sanitize.gs` をコミット前に実行

## ■ 参照すべきファイル

### セッション開始時に必ず読むもの
1. `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下の全ルールファイル
2. このHANDOVER.md
3. `~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md`（コミット前チェックリスト5項目）
4. Obsidian開発ノート: `一括シートV3_辞書充実.md`（最重要）

### 開発ツール
| ツール | コマンド |
|--------|---------|
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| GPT質問 | `mcp__openai-bridge__ask_gpt` |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` |
| clasp push | `cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
