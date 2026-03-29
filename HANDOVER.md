# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## 前回のセッションでやったこと（2026-03-30）

### 1. 既存TagShippingシートのI-J列タグ一覧出力修正
- ensureTagShippingSheet_で既存シートのI1セルが空の場合にwriteTagListToSheet_を呼ぶ処理を追加
- コミット: `2f3a242` / git push済み / clasp push済み / 動作確認済み

### 2. ItemSpecifics × 交通整理 統合改修の設計
- ゴルフのLoftが「Does not apply」になる問題を発端に、全体フローの設計を3者協議
- 設計書作成: `docs/itemspecifics-sanitize-integration-plan.md`

## 現在のステータス
- ブランチ: main
- 最終コミット: 設計書コミット（確認必要）
- git push済み、clasp push済み（コード変更分）

## 次にやること（設計書の実装順序に従う）

### Phase 1: ゴルフで全フロー検証（設計書参照）

| ステップ | 内容 | 依存 |
|---------|------|------|
| 1 | SANITIZE_FIELDS_にゴルフ追加 | なし |
| 2 | AIExtractorにゴルフ固有ルール追加 | なし |
| 3 | parseSanitizedData_() + convertSanitizedToEnglish_() 実装 | なし |
| 4 | マージロジックに確定値ロック実装 | ステップ3 |
| 5 | バリデーション実装 | ステップ4 |
| 6 | ゴルフ商品でE2Eテスト | ステップ1-5 |
| 7 | Library同期 + コミット + clasp push | ステップ6 |

### Phase 2: 横展開（Phase 1完了後）
- 残り57カテゴリのSANITIZE_FIELDS_追加
- 各カテゴリの必須/推奨フィールド定義

## 設計書
- `docs/itemspecifics-sanitize-integration-plan.md` — ItemSpecifics × 交通整理 統合改修（3者協議の記録含む）
- `docs/shipping-mode-refactor-plan.md` — 送料モード共通関数化

## 関連ファイル
- 交通整理: `Sanitize.gs` SANITIZE_FIELDS_（L15）、FIELD_EN_TO_JP_（L50）
- ItemSpecifics抽出: `ItemSpecifics/AIExtractor.gs` extractItemSpecifics()（L34）
- IS定義: `ItemSpecifics/Config_IS.gs` IS_CATEGORY_FIELDS（L3050）
- 翻訳プロンプト: `prompts/ゴルフ.txt`
- タグマッピング: `Config.gs` L213 PROMPT_TAG_MAPPING
- タグ一覧出力: `コード_Part3` L3602 writeTagListToSheet_

## 共通の注意事項
- コーディングはCodex CLIに委託する（L1-1）
- Claude+Geminiの2者レビュー必須（E-02）
- Library同期必須、ScriptProperties使用禁止
- clasp push前にScriptPropertiesチェック必須
- HtmlTemplates.gsの再生成はconvert_html_to_gs.pyで実行
- PromptTemplates.gsの再生成はconvert_prompts_to_gs.pyで実行
- 既存プロンプトは試行錯誤の結晶。構造は壊さないこと
