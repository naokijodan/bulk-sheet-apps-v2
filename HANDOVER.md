# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## ■ 前回のセッションでやったこと

### 1. 初期設定メニューの不具合修正

Phase 2で大量変更したPROMPT_TAG_MAPPINGが、初期設定メニュー実行時にTagShipping S列・GPT_Prompts E列に反映されない問題を調査・修正した。

**原因と修正:**
- **TagShipping S列:** `ensureTagShippingSheet_()` がS1セルが空の場合（初回作成時）しかタグ一覧を書き込まなかった。`saveIntegratedSettings` にチェックボックス制御の明示的な更新処理を追加した
- **SetupDialog UI整理:** 「タグ一覧出力」チェックボックスを「タグ自動判定設定」セクション内に移動。「TagShippingシートのタグ一覧を更新」チェックボックスを新規追加
- **GPT_Prompts E列:** 初期設定メニュー再実行で正常に反映された（コード修正+clasp pushの反映で解消）

**レビュー実施:** Claude+Geminiの2者レビューで「二重実行」の問題を検出・修正。`ensureTagShippingSheet_` はシート構造保証に専念させ、タグ更新は `saveIntegratedSettings` のチェックボックス制御に一本化（責務分離）。

### 2. ゲーム用カテゴリのタグ重複修正

PROMPT_TAG_MAPPINGの `ゲーム用` カテゴリで、機種名単体タグ（Switch, PS5等）と複合タグ（ゲームソフトSwitch, ゲームソフトPS5等）が共存していた問題を修正。

**削除した11件:** Switch, PS5, PS4, PS3, PS2, Xbox, ファミコン, スーファミ, ゲームボーイ, Nintendo, PlayStation

**残した設計方針:**
- 汎用タグ（ゲーム, ゲームソフト, テレビゲーム）→ ほとんどのユーザーが使う
- 複合タグ（ゲームソフトPS5等）→ 詳しく指定したいユーザー用
- 単体の機種名は曖昧（ソフトか本体か不明）なのでPROMPT_TAG_MAPPINGから削除
- IS_TAG_TO_CATEGORYには残置（ISフィールド判定には影響しない）

### 3. その他の調査結果（未対応・今後の調整事項）

- **PROMPT_TAG_MAPPINGのみのタグ7件（IS側に不足）:** ユニフォーム、ジャージ、トレーニングウェア、ゴルフウェア、スキーウェア、水着、手帳カバー → Phase 3以降で対応検討
- **IS_TAG_TO_CATEGORYのみのタグ20件（カメラ系10件、英文タグ等）:** 判定に影響なし。情報として把握
- **釣具汎用のルアー単体:** 残す判断確定。ほとんどの人は「ルアー」と入力する。詳しい人だけ「ルアーミノー」等を使う

## ■ 確立されたタグ設計パターン（必ず守ること）

**D列のタグ1つで2つの判定が行われる:**
- IS_TAG_TO_CATEGORY → ISカテゴリ判定（どのフィールドを出すか）
- PROMPT_TAG_MAPPING → 翻訳プロンプト選択

**ルール:**
1. タグはISとPROMPTで必ず整合させる。片方だけに追加・削除しない
2. 他カテゴリと被る可能性のあるタグ名は使わない。スペースなし複合タグで一意にする
3. 広すぎるタグ（「釣り」「フィッシング」等）は特定カテゴリに判定できないので禁止
4. ISカテゴリが別ならpromptIdも分離するのが原則。ただしプロンプト内部で辞書が十分カバーされている場合（楽器、ゴルフ、切手コイン）は共有可
5. 汎用タグ（ゲームソフト、ルアー等）は残す。詳しく指定したい人向けに複合タグ（ゲームソフトPS5、ルアーミノー等）を用意する

**パターン例:**
- ゲームソフトPS5→Video Games、ゲーム機PS5→Video Game Consoles
- ルアーミノー→Fishing Lures（「ミノー」単体は他と被る可能性）
- 鉄瓶急須→Tetsubin、陶器急須→Pottery（「急須」単体は曖昧）

## ■ 現在のステータス

- ブランチ: main
- コミット: b1d85e9
- clasp push: 済み
- git push: 済み
- 初期設定メニュー実行: 済み（GPT_Prompts E列・TagShipping S列ともに反映確認済み）

## ■ 次にやること（この順番で）

### Phase 3: 翻訳プロンプト本文の再検証

辞書改修（CATEGORY_RULES_等）がプロンプト本文に反映されているか確認する。

**検証内容:**
1. 今回新規作成した9件のプロンプトの品質を重点検証（石鹸、版画、陶磁器、茶道具、鉄瓶、仏教美術、盆栽、包丁 + ガンダムカード修正）
2. ベースボールカード.txt / 大相撲カード.txt のVERIFICATIONセクション欠落を確認・追加
3. 全プロンプトファイル（prompts/*.txt）の辞書がIS_CATEGORY_FIELDSのフィールドと整合しているか確認
4. 調査で判明したPROMPT_TAG_MAPPINGのみのタグ7件（スポーツウェア系+手帳カバー）のIS側追加を検討

**注意:**
- Phase 2で確立したタグ設計パターンを忘れないこと
- 新しいプロンプトを作る場合は必ずOUTPUT FORMAT / VERIFICATION / Input: ${fullText}を含める
- prompts/変更後は必ずsync_prompts_to_gs.py → clasp push

## ■ 過去セッションの教訓（繰り返すな）

### 今回のセッションの問題
- Codex CLIの使用量制限に到達していた（5時間ごとにリセット）。小規模修正は社長判断で直接実行した（ユーザー承認済み）
- GPTのCodex CLIも制限到達。Geminiでレビュー代替した

### 前セッションの問題（引き続き注意）
1. **ルール（Codex CLI委託）を繰り返し破った**: 判断の権限はない。ルールに従って実行する
2. **G11で整合性を無視した提案をした**: ISとPROMPTの両面整合を常に意識すること
3. **共有promptIDについてレビューせずに判断した**: 重要判断は必ず第三者レビューを入れる
4. ノート・コードを読まずに検証を始めた
5. エージェントの報告を裏取りしなかった

### 必ず守るルール
- コードに触る前に: ルールファイル、HANDOVER.md、CLAUDE.md、Obsidianノートを全て読む
- コーディングはCodex CLIに委託する（判断ではなくルール）。制限到達時はユーザーに報告して判断を仰ぐ
- 作業フロー: リサーチ→設計→承認→実装→レビュー→コミット→デプロイ→ノート
- タグ設計パターン: IS/PROMPT両面整合、重複禁止、曖昧タグ禁止
- レビューは必ず第三者（GPTまたはGemini）を入れる。自分だけで判断しない
- 3レイヤー断線チェック: IS_TAG_TO_CATEGORY / PROMPT_TAG_MAPPING / prompts/*.txt が全て揃っているか
- コミット前: ScriptProperties / Library同期 / PromptTemplates同期

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

### 初期設定メニューでのタグ一覧更新フロー（今回新設）
```
SetupDialog: 「TagShippingシートのタグ一覧を更新」チェックON
  ↓
saveIntegratedSettings(): writeTagListToSheet_(tsSheet) を実行
  ↓
TagShipping S-T列にPROMPT_TAG_MAPPINGの全タグ一覧を出力
```
- `ensureTagShippingSheet_()` はシート構造保証のみ（初回作成時だけタグ出力）
- 明示的なタグ更新は `saveIntegratedSettings` のチェックボックスで制御

### IS_TAG_TO_CATEGORYの判定ロジック
- 完全一致を先に検索、なければ部分一致（長いキーから優先マッチ）
- 過去事故: 「ピアス・イヤリング」→部分一致で「リング」→Ringsに誤分類（修正済み）

### clasp pushの場所
- `.clasp.json`はLibrary/にある
- `cd Library && npx clasp push` で実行

### Codex CLIの制約
- 使用量制限: 5時間ごとにリセット。制限到達時はユーザーに報告
- サンドボックスでLibrary/外のファイルに書き込めない場合がある
- その場合はルート側を手動（cp）で同期する

## ■ 作業開始時の必須手順

1. **まずルールを全件読む**: ~/.claude/CLAUDE.md + ~/.claude/rules/ + このHANDOVER.md + プロジェクトCLAUDE.md。読むまでコードに触らない
2. **過去のミスを確認する**: このファイルの「過去セッションの教訓」セクションを読み、同じミスを繰り返さない
3. **Obsidianノートを読む**: 開発ログ/一括シートV3_3レイヤー検証.md で前回の作業内容と設計判断を把握する
4. **設計を提示して承認を得る**: 作業方針をユーザーに提示し、承認後に実行する。承認なしにコードに触らない
5. **レビューを必ず実施する**: 修正後は第三者（GPTまたはGemini）のレビューを入れる。自分だけで判断しない
6. **コーディングはCodex CLIに委託する**: 制限到達時はユーザーに報告して判断を仰ぐ

## ■ Obsidianノート

- 開発ログ/一括シートV3_3レイヤー検証.md にG1〜G24+未対応3件の全記録あり
- 開発ログ/一括シートV3_辞書充実.md に辞書充実プロジェクトの履歴あり
- 注意: 一括シートV3_3レイヤー検証.md は前セッションで作成されなかった可能性あり。存在しなければ新規作成する
