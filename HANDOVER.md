# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## ■ 前回のセッションでやったこと

### Phase 3: 翻訳プロンプト本文の再検証（Step 6まで完了、Step 7未実施）

ハーネスモード（4セッション構成）で作業。子A実装→親レビュー→子Bレビューまで完了。子C（適用: git commit/push/clasp push）は未実施。

**完了した作業:**

1. **タスク1: 新規9件のプロンプト品質検証**
   - 石鹸、版画、陶磁器、茶道具、鉄瓶、仏教美術、盆栽、包丁、ガンダムカード
   - 全件にOUTPUT FORMAT / VERIFICATION / Input: ${fullText}が存在確認済み
   - 辞書とIS_CATEGORY_FIELDSの整合性確認済み
   - 修正不要（品質問題なし）

2. **タスク2: VERIFICATIONセクション欠落修正（3件）**
   - ベースボールカード.txt: VERIFICATION 11項目追加
   - 大相撲カード.txt: VERIFICATION 11項目追加
   - 一般商品・汎用.txt: Self-Validation → VERIFICATION改名 + 9項目に拡充

3. **タスク3: 全57件の辞書とIS_CATEGORY_FIELDSの整合性確認**
   - 全57件検証完了、重大な不整合なし

4. **タスク4: タグ7件のIS_TAG_TO_CATEGORY追加**
   - ユニフォーム、ジャージ、トレーニングウェア、ゴルフウェア、スキーウェア、水着 → Clothing
   - 手帳カバー → Wallets

5. **同期完了**
   - python3 Library/sync_prompts_to_gs.py 実行済み（57/57件）
   - ItemSpecifics/Config_IS.gs → Library/Config_IS.gs コピー済み（diffなし）
   - ScriptProperties混入チェック済み（なし）

**レビュー結果:**
- 親レビュー: PASS（全チェック項目合格）
- 子B（Gemini）レビュー: PASS（受け入れ基準10項目全てPASS）
- 指摘事項なし。docs/harness/review-report.json に詳細あり

### ハーネスモードの通知問題

子セッション→親セッションへのharness-notify.sh通知が届かなかった。

**原因:** 親窓タイトルとして渡した「一括シートV3 Phase3」が、実際のTerminalウィンドウ名と一致しなかった。harness-notify.shはウィンドウ名の部分一致で親を探すため、一致しないと通知が届かない。

**別セッションで調整中とのこと。** harness-launch.shのスクリプト自体は更新済み（pbcopy + Command+V + Enter方式、デフォルト指示生成機能あり）。

## ■ 次にやること（この順番で）

### 1. Phase 3 子C適用（最優先 — コードは実装・レビュー済み）

git diffに未コミットの変更6件が残っている。承認済みなので適用するだけ:

```
変更ファイル:
- prompts/ベースボールカード.txt（VERIFICATION追加）
- prompts/大相撲カード.txt（VERIFICATION追加）
- prompts/一般商品・汎用.txt（VERIFICATION改名+拡充）
- ItemSpecifics/Config_IS.gs（タグ7件追加）
- Library/Config_IS.gs（同期）
- Library/PromptTemplates.gs（sync結果）
```

手順:
1. docs/harness/approval.json を書く
2. git add → git commit → git push
3. cd Library && npx clasp push
4. docs/harness/deploy-report.json を書く

### 2. Phase 4以降

計画書（https://naokijodan.github.io/auto-listing-system-plan/）の順番に従う。

## ■ 現在のステータス

- ブランチ: main
- 最新コミット: 3ef6b65（Phase 2.5完了）
- 未コミット変更: 6ファイル（Phase 3、レビュー済み・承認待ち）
- clasp push: 未実施（Phase 3分）

## ■ 確立されたタグ設計パターン（必ず守ること）

**D列のタグ1つで2つの判定が行われる:**
- IS_TAG_TO_CATEGORY → ISカテゴリ判定（どのフィールドを出すか）
- PROMPT_TAG_MAPPING → 翻訳プロンプト選択

**ルール:**
1. タグはISとPROMPTで必ず整合させる。片方だけに追加・削除しない
2. 他カテゴリと被る可能性のあるタグ名は使わない。スペースなし複合タグで一意にする
3. 広すぎるタグ（「釣り」「フィッシング」等）は特定カテゴリに判定できないので禁止
4. ISカテゴリが別ならpromptIdも分離するのが原則
5. 汎用タグ（ゲームソフト、ルアー等）は残す。詳しく指定したい人向けに複合タグを用意する

## ■ 過去セッションの教訓（繰り返すな）

### 今回のセッションの問題
1. **harness-notify.shが動かなかったのに代替手段に切り替えようとした**: ルールでは「代替手段に切り替えない。修正するか、ユーザーに報告する」と明記されている
2. **osascriptを自分で書いて試行錯誤した**: harness-launch.sh / harness-notify.shのコードを最初に読めば、pbcopy+paste方式だとわかったのに、`do script`→`keystroke`と手探りで進めた
3. **ノートを読まずに作業を始めた**: 以前のセッションで子セッションへの指示送信方法を調整済みだったが、その記録を確認しなかった

### 前セッションの問題（引き続き注意）
1. Codex CLIの使用量制限に到達していた（5時間ごとにリセット）
2. ルール（Codex CLI委託）を繰り返し破った
3. ISとPROMPTの両面整合を常に意識すること

### 必ず守るルール
- コードに触る前に: ルールファイル、HANDOVER.md、CLAUDE.md、Obsidianノートを全て読む
- ハーネスモード: 自分でosascriptを書かない。harness-launch.sh / harness-notify.shを使う
- 代替手段に切り替えない。問題があれば修正するか、ユーザーに報告する
- 通知が来ない場合: docs/harness/のファイルを直接確認する
- レビューは必ず第三者（GPTまたはGemini）を入れる

## ■ 重要なコード知識

### 翻訳プロンプト自動選択の動作フロー
```
Config.gs PROMPT_TAG_MAPPING（真実のソース）
  ↓ [初期設定メニュー実行]
syncPromptsToSheet_() → GPT_Prompts B列（本文）
writePromptTagMapping_() → GPT_Prompts E列（タグ）
  ↓ [翻訳実行時]
Translation.gs: GPT_Prompts A列+E列 → tagToPromptMap構築
D列タグ → tagToPromptMap[tag] → promptId → GPT_Prompts B列から本文取得
```

### clasp pushの場所
- `.clasp.json`はLibrary/にある
- `cd Library && npx clasp push` で実行

### Codex CLIの制約
- 使用量制限: 5時間ごとにリセット。制限到達時はユーザーに報告
- サンドボックスでLibrary/外のファイルに書き込めない場合がある

## ■ 作業開始時の必須手順

1. **まずルールを全件読む**: ~/.claude/CLAUDE.md + ~/.claude/rules/ + このHANDOVER.md + プロジェクトCLAUDE.md。読むまでコードに触らない
2. **過去のミスを確認する**: このファイルの「過去セッションの教訓」セクションを読み、同じミスを繰り返さない
3. **Obsidianノートを読む**: 開発ログ/一括シートV3_3レイヤー検証.md で作業内容と設計判断を把握する
4. **設計を提示して承認を得る**: 作業方針をユーザーに提示し、承認後に実行する。承認なしにコードに触らない
5. **レビューを必ず実施する**: 修正後は第三者（GPTまたはGemini）のレビューを入れる
6. **コーディングはCodex CLIに委託する**: 制限到達時はユーザーに報告して判断を仰ぐ

## ■ Obsidianノート

- 開発ログ/一括シートV3_3レイヤー検証.md にG1〜G24+未対応3件+Phase 2.5の全記録あり
- 開発ログ/一括シートV3_辞書充実.md に辞書充実プロジェクトの履歴あり
