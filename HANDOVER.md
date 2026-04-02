# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 最重要ルール（セッション開始前に必ず読め）

1. **グローバルルールを読む**: `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下を全て読む。読むまでコードに触らない
2. **過去のノートを読む**: `~/Desktop/開発ログ/` の関連ノートを確認する。特に以下は必読:
   - `一括シートV3_ItemSpecifics交通整理統合.md`
   - `一括シートV3_カメラIS対応.md`
   - `一括シートV3_IS複数カテゴリ追加.md`
   - `一括シートV3_カード辞書充実_IS修正.md`（今回のセッションの記録）
3. **設計を提示して承認を得てから実行する**: いきなりコードを書かない
4. **コーディングはCodex CLIに委託する**: 自分では書かない
5. **レビュー省略禁止**: Claude + GPT + Gemini（429時はClaude + GPT）
6. **3者協議**: 重要な設計判断は必ず `get_all_opinions` で協議する
7. **clasp pushを忘れない**
8. **IS_CATEGORY_FIELDSの10件制限は絶対**: 変更提案禁止（EAGLEの登録制限）

### 前回のセッションで犯したルール違反（繰り返すな）
- ノートを読まずに作業を始めた → 交通整理とISの10件制限の連携設計を知らなかった
- 設計・承認なしに自分でコードを書いた → 不完全な修正をデプロイして問題を悪化させた
- レビューを省略してコミットした
- ユーザーの出品作業（時計）より辞書充実を優先してしまった

---

## ■ セッション開始時に最初にやること

### 1. ユーザーに確認（最優先。辞書充実より先にやる）
前回のセッションとの間に、ユーザーが**大きな修繕を1つ予定している**。
この修繕は辞書充実作業とは別の作業であり、**辞書充実より優先度が高い**。

セッション開始時に必ず以下を聞くこと：
- **「前回のセッション後に予定されていた修繕について教えてください。その作業を最優先で行います。」**
- ユーザーから修繕内容を聞く
- **その修繕作業を最優先で実施する**（辞書充実は後回し）
- 修繕が完了してから、辞書充実（Tier 1→2→3）に戻る

### 2. 準備（ルール・ノート確認）
- `~/.claude/CLAUDE.md` + `~/.claude/rules/` を読む
- `~/Desktop/開発ログ/` の関連ノートを読む
- `git log --oneline -10` + `git status` で現状把握
- 修繕内容の設計をユーザーに提示して承認を得てから実行する

---

## ■ 前回のセッションでやったこと（2026-04-02）

### 1. Trading Cards辞書の完全充実

カード辞書を1272件に拡充。12ゲーム対応。

| ゲーム | セット | キャラ/カード | レアリティ | プロンプト |
|--------|--------|-------------|----------|----------|
| ポケモン | 210 | 200 | 42 | 315行 ✅ |
| 遊戯王 | 54 | 111 | 26+7 | 258行 ✅（新規） |
| MTG | 37 | 89 | 15 | 293行 ✅ |
| ワンピース | 20 | 83 | 9 | 160行 ✅（新規） |
| 野球 | 23 | 247 | — | あり ✅ |
| 大相撲 | — | 25 | — | あり ✅ |
| デュエマ | 13 | 45 | 13 | — |
| ドラゴンボール | 7 | 45 | 7 | — |
| ヴァイス | — | 20 | 13 | — |

- 全ゲーム最新セット対応（ポケモンMEGA era M4、MTG Lorwyn Eclipsed、ワンピースOP15）
- CardPatterns.gsの遅延初期化に変更（カスタム関数タイムアウト対策）
- 3ゲーム（デュエマ/ドラゴンボール/ヴァイス）を関数統合済み（getCardSetPatterns_等）

### 2. ItemSpecifics 10件制限フィルタ追加

**問題**: 交通整理のフィールド（Watches 16件等）がmergeConfirmedValues_でISにマージされ、10件を超えてAI列のARRAYFORMULAを上書きしていた

**修正（3者協議→承認→Codex委託→レビュー済み）**:
- `extractISForRows_`のresultsに`category`を追加
- `mergeConfirmedValues_`で`IS_CATEGORY_FIELDS[item.category]`に含まれるフィールドのみマージ（allowedSetフィルタ）
- 10件超過の安全弁（IS_CATEGORY_FIELDS優先順で切り詰め+ログ）
- 交通整理のフィールド充実（翻訳品質向上）とIS 10件制限を両立する設計

### 3. AW列クリア漏れ修正

- `clearSelectedRowsValues`にAW列（EN_DESC_SANITIZED）のクリアを追加

### 4. Country値統一

- IS_BRAND_DICTの`'USA'`→`'United States'`（324件）
- IS_BRAND_DICTの`'UK'`→`'United Kingdom'`（68件）

### 5. サイズ変換の汎用化（appendInchToSizeFields_）

- Wrist Size/Case Sizeのハードコード後処理を削除
- 全フィールド対応の汎用関数`appendInchToSizeFields_`に置き換え
- cm → cm/inch、mm → mm/inch変換を全カテゴリで自動適用
- スキップ: 既にinch表記あり、角度（°）、S/M/L、分数、Does not apply

---

## ■ 現在のステータス
- ブランチ: main
- 最新コミット: `d556d79`（git push済み、clasp push済み）
- Trading Cards: **完了**（12ゲーム、1272件）
- IS 10件制限: **修正済み**
- サイズ変換: **汎用化済み**

---

## ■ 次にやること

### 0. 最優先: ユーザーの修繕作業
ユーザーから修繕内容を聞き、**辞書充実より先に**その修繕を実施する。
修繕が完了してから、以下の辞書充実に戻る。

### 1. Tier 1残り: Sunglasses、Kimono、Video Game Consoles（辞書充実）
- Sunglasses: RULES拡充（フレームスタイル、レンズタイプ等）。現在3ルール→8ルール程度に
- Kimono: RULES拡充（技法、サイズ規格等）。現在3ルール→8ルール程度に
- Video Game Consoles: ブランド追加（Nintendo/Sony/Sega等）+ 確認
- Fishing Reels: 完了済み（確認のみ）
- Trading Cards: 完了済み

### 2. Tier 2: 7カテゴリ
Records, Figures, RC & Models, Art/Prints, Japanese Swords, Japanese Instruments, Tennis

### 3. Tier 3: 31カテゴリ
Hats, Scarves, Neckties, Handkerchiefs, Belts, Belt Buckles, Coins, Stamps, Collectibles, Dolls & Plush, Snow Globes, Pottery, Glassware, Dinnerware, Flatware, Tea Ceremony, Tetsubin, Bonsai, Buddhist Art, Combs, Boxes, Soap, Baby, Hair Accessories, Key Chains, Lighters, Pipes, Anime, Video Games, Watch Parts, Baseball

### 4. 未対応の改善候補（優先度低）
- デュエマ/ドラゴンボール/ヴァイスの専用プロンプト作成
- ワンピースOP14の情報確認と追加
- appendInchToSizeFields_の複数単位対応（`90cm x 90cm`等）

---

## ■ 1カテゴリの作業手順（必ずこの順番で）

### ステップ0: 準備（最重要）
- `~/.claude/CLAUDE.md` + `~/.claude/rules/` を読む
- `~/Desktop/開発ログ/` の関連ノートを読む
- `git status` + `git log` で現状把握

### ステップ1: 現状確認（エージェント並列）
- IS_BRAND_DICTに該当カテゴリのブランドがあるか
- CATEGORY_RULES_の現在のルール数と内容
- prompts/フォルダのどのプロンプトがカバーしているか

### ステップ2: リサーチ（Gemini MCP）
Gemini 429時はClaude自身がリサーチ

### ステップ3: 設計提示 → 承認

### ステップ4: コーディング（Codex CLI）
```bash
/opt/homebrew/bin/codex exec --full-auto "指示内容"
```

### ステップ5: レビュー（必須。省略禁止）
1. Claude自身がdiffを確認
2. GPT（mcp__openai-bridge__code_review_gpt）にdiff実コードを渡してレビュー
3. Gemini（mcp__gemini-bridge__code_review_gemini）にもレビュー依頼（可能な場合）
4. 全者PASSで次へ。FAILがあれば修正

### ステップ6: コミット前チェック（必須）
```bash
grep -n "getScriptProperties" Library/*.gs
diff Sanitize.gs Library/Sanitize.gs
diff ItemSpecifics/Config_IS.gs Library/Config_IS.gs
```

### ステップ7: コミット + プッシュ

### ステップ8: プロンプト同期 + clasp push
```bash
python3 Library/sync_prompts_to_gs.py カテゴリ名
cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force
```

---

## ■ 重要な設計ルール

### 交通整理とItemSpecificsの関係
- 交通整理（SANITIZE_FIELDS_）は翻訳品質のためにフィールドを多くしてよい
- しかしItemSpecificsは10件制限（EAGLE制限）
- mergeConfirmedValues_でIS_CATEGORY_FIELDSに含まれるフィールドのみマージする（allowedSetフィルタ）
- **交通整理のフィールドを増やしてもISは10件を超えない設計になっている**

### サイズ変換
- appendInchToSizeFields_が全フィールドのcm/mm→inch変換を自動処理
- 新しいカテゴリを追加しても、サイズ変換は自動適用される

### CardPatterns.gsの遅延初期化
- グローバル変数IS_CARD_*はnullで初期化
- initCardPatterns_()でIS処理時にのみ初期化
- カスタム関数（GET_SHIPPING_POLICY_FROM_IMPORT等）のパフォーマンスを保護

### Library同期必須
- ルートフォルダの変更はLibrary/にも必ず反映
- PromptTemplates.gsの更新はsync_prompts_to_gs.pyを使う（手動編集禁止）

---

## ■ 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| Gemini リサーチ | `mcp__gemini-bridge__ask_gemini` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| Geminiレビュー | `mcp__gemini-bridge__code_review_gemini` |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py カテゴリ名` |
| clasp push | `cd ~/Desktop/ツール開発/一括シートApps_v3/Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
