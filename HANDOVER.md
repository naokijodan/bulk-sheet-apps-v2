# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## 前回のセッションでやったこと

### A. 交通整理カテゴリ拡充（完了）
- `detectSanitizeCategory_()` を `CONFIG.SANITIZE_CATEGORIES`（5カテゴリ）から `IS_TAG_TO_CATEGORY`（64カテゴリ・196タグ）に統合
- `SANITIZE_FIELDS_` のキーをISカテゴリ名に統一（watch→Watches等）
- `CONFIG.SANITIZE_CATEGORIES`（Config.gs）を廃止
- 旧SANITIZE_CATEGORIESの全キーワード43個をIS_TAG_TO_CATEGORYに補完
- `getSanitizeFields_()` ヘルパー関数で3段階フォールバック（専用→IS_CATEGORY_FIELDS→汎用）
- `FIELD_EN_TO_JP_` 変換テーブル（約100フィールド）追加
- `getBrandListForSanitize_()` のカテゴリ分岐をISカテゴリ名に統一

### B. Country of Origin修正（完了）
- `resolveFieldValue_()` に `case 'Country of Origin':` を追加（フィールド名不一致修正）
- Country of Originを全カテゴリ共通フィールドとして自動追加（10件未満の場合のみ）
- Golf: Department → Country of Origin に置換
- Fishing Rods: Lure Weight → Country of Origin に置換
- Necklaces: Theme → Country of Origin に置換
- IS_INITIAL_DATA も同期済み

### C. ゴルフプロンプト作成（完了）
- `/Users/naokijodan/Desktop/ツール開発/プロンプト編集/ゴルフプロンプトV1.txt` を作成

## 現在のステータス
- ブランチ: main / 最新コミット: b97628f / git push済み / clasp push済み

## 次にやること: 翻訳プロンプト自動選択機能

### 概要
翻訳実行時に、D列タグからプロンプトを自動選択する機能。手動/自動をトグルで切り替え可能。デフォルトは手動。

### 3者協議で合意済みの設計

#### マッピング方式
- コード内にプロンプト名→対象タグのマッピングテーブルを定義
- 初期設定実行時にGPT_PromptsシートのE列に自動書き込み（可視化用）
- 翻訳実行時はE列を読んでD列タグと**完全一致**マッチング
- マッチしなければAS2のフォールバックプロンプトを使用
- トレカは細分化プロンプト（ポケカ/MTG/ベースボール/大相撲）がそれぞれのタグにマッチ。将来「トレカ汎用」を作ればそのタグにマッチ

#### マッピングテーブル（コード内に定義する内容）
```javascript
var PROMPT_TAG_MAPPING = {
  '時計用': ['時計','腕時計','ウォッチ','懐中時計'],
  'カメラ': ['カメラ','デジカメ','一眼レフ','ミラーレス'],
  'リール': ['リール'],
  'ゴルフ': ['ゴルフ','ゴルフクラブ','ゴルフヘッド'],
  'ジュエリー': ['ネックレス','リング','指輪','ブレスレット','ピアス','イヤリング','ブローチ'],
  'ポケカ': ['ポケカ','ポケモンカード'],
  'MTG': ['MTG','マジックザギャザリング'],
  'ベースボールカード': ['ベースボールカード','野球カード','BBM'],
  '大相撲カード': ['大相撲カード'],
  'ゲーム用': ['ゲーム','ゲームソフト'],
  'ゲーム機': ['ゲーム機'],
  'フィギュア': ['フィギュア','アクションフィギュア'],
  'スニーカー': ['スニーカー'],
  'ドレスシューズ': ['靴','シューズ','ブーツ','パンプス','ローファー'],
  'アパレル・ブランド品': ['バッグ','財布','衣類','服']
};
// '日本ブランド' と '一般商品・汎用' はタグマッチなし（手動選択 or フォールバック用）
```

#### トグル
- AS3セルに「手動 / 自動選択」ドロップダウン
- DocumentPropertiesに `AUTO_PROMPT_SELECT` として保存
- 初期設定UIにチェックボックス追加（既存パターン: DDU調整等と同じ方式）
- デフォルト: 手動

#### 翻訳フローの変更（核心部分 — 最も慎重に）
現在の構造: settings.promptId が全行共通。行ごとに変えるには:
1. Translation.gsで各行のitemオブジェクトにpromptIdを追加
2. AI.gsのbuildRequestForProvider_でitem.promptIdを参照するよう修正
3. GPT_Promptsシートを最初に1回読み込み、E列のタグマッピングをキャッシュ
4. パフォーマンス影響なし（APIリクエストは行ごとに独立、並列送信）

### 実装ステップ

| Step | 内容 | 変更ファイル | 状態 |
|---|---|---|---|
| 1 | マッピングテーブル定義 | Config.gs | 未着手 |
| 2 | 初期設定でGPT_PromptsシートE列に自動書き込み | コード_Part1 or Part3 | 未着手 |
| 3 | 初期設定UIにトグル追加 | HtmlTemplates.gs + コード_Part3 | 未着手 |
| 4 | Translation.jsで行ごとのプロンプトID判定 | Translation.gs | 未着手 |
| 5 | AI.gsでitem.promptIdを参照 | AI.gs | 未着手 |
| 6 | Library同期 + レビュー + clasp push | 全体 | 未着手 |

### 調査済み情報（次のセッションで再調査不要）
- GPT_Promptsシート: A列(ID/日本語), B列(本文), C列(未使用), D列(更新日時), **E列(空き→ここに対象タグ)**
- AS2: プロンプト手動選択（Translation.gs L41-50で読み込み）
- **AS3: 空き（トグル用に使える）**
- 初期設定UI: HtmlTemplates.gs（356KB）、既存チェックボックスパターンあり（DDU調整等）
- getPromptContent(): コード_Part1 L31-47、A-B列のみ読み込み → E列追加読み込みが必要
- savePromptContent(): コード_Part1 L60-83、B列とD列のみ書き込み → 影響なし
- buildRequestForProvider_(): AI.gs L822、settings.promptIdを使用 → item.promptIdに変更
- callAI_parallel_(): AI.gs L1001、items配列を処理
- 行ごとのpromptId変更: itemオブジェクトにpromptId追加が必要

### 注意事項
- **翻訳フロー（Translation.gs + AI.gs）は最も壊してはいけない核心部分**
- HtmlTemplates.gsは356KBと巨大。セクション単位で読むこと
- **コーディングはCodex CLIに委託すること**（L1-1）
- Claude+Geminiの2者レビュー必須
- ルート↔Library同期必須
- clasp push前にScriptPropertiesチェック必須
- 手動モード（デフォルト）での既存動作を絶対に壊さないこと

## その他の残タスク
- トレカのE2Eテスト
- ゴルフプロンプトV1のテスト・調整
