# route② サイドパネル司令塔方式 バッチ翻訳 設計書

/ 作成: 2026-05-22 / ステータス: ドラフト（ユーザー承認待ち） /
/ 対象: route②（メニュー「ebApi」系・OpenAI GPT-5 翻訳） /

---

## 0. 目的

商品データ 200〜300 行を OpenAI で英訳し、インポート用シートへ書き込む処理を、
**GAS の6分実行制限でタイムアウトさせず、進捗を見ながら、確実に完走**できるようにする。
従来の翻訳とは**別機能（新メニュー）として切り出す**。既存メニューは残す。

### 解決する課題（調査で確定した事実）
- 現 route② は AI 呼び出しは並列（fetchAll）だが、**書き込みが1行ずつ**で遅い（`EbayTranslationApi.gs:637, 1287`）。
- タイムアウト判定が AI 呼び出し前の1点のみ。**自動再開（トリガー＋alert）が不安定**で200行を完走できない。
- 進捗表示が無い（処理中は無反応、`alert` のみ）。
- route①（従来翻訳）も「GASが長時間動く＋トリガー継続」方式で、200行ではタイムアウトする（ユーザー報告）。

### 方式
**サイドパネル司令塔方式**: ブラウザのサイドパネル(HTML)が `google.script.run` で
ホスト側の窓口関数を小分けに呼び続ける。各実行は数行だけ処理して数秒で返す。
→ GAS は毎回短時間しか動かないため、構造的に6分制限へ到達しない。

---

## 1. アーキテクチャ

```
[CommandSidebar.txt (HTML/JS)]  ← 司令塔（ブラウザ）
   |  google.script.run.ebApiSbStart(config)        初回キック
   |  google.script.run.ebApiSbProcessChunk()       1チャンク処理を繰り返し依頼
   v  （戻り値=進捗オブジェクトを withSuccessHandler で受信）
[UserSheet/Main.js]  ← 窓口（ホスト。google.script.run はここしか呼べない）
   |  return LIB.ebApiSbStart(config)   等で委譲
   v
[Library/EbayTranslationApi.gs]  ← 本体ロジック（BulkToolsLib）
       状態管理・チャンク処理・一括書き込み・リトライ
```

### GAS ライブラリ制約への対応（プロジェクト CLAUDE.md 準拠）
- `google.script.run` はホスト(UserSheet)の関数しか呼べない → 窓口は **Main.js に新設**し `return LIB.xxx()` で委譲（既存 `getProgressData` L204 と同パターン）。
- ライブラリでは `ScriptProperties` 禁止 → **`DocumentProperties`** を使う。
- サイドバー表示はメニュー起点のサーバー関数なら可。バージョン埋め込みは `getHtmlTemplate()` + 文字列置換（既存 `showProgressSidebar_` と同パターン）。

---

## 2. コンポーネントと責務

### 2-1. ホスト窓口（UserSheet/Main.js に新設）
1行ラッパー。中身はライブラリへ委譲。

| 窓口関数 | 委譲先 | 役割 |
|---|---|---|
| `ebApiSbStart(config)` | `LIB.ebApiSbStart` | ジョブ初期化・状態保存・初期進捗を返す |
| `ebApiSbProcessChunk()` | `LIB.ebApiSbProcessChunk` | 1チャンク処理し進捗を返す |
| `ebApiSbGetState()` | `LIB.ebApiSbGetState` | 再開用に現在状態を返す |
| `ebApiSbRetryFailed()` | `LIB.ebApiSbRetryFailed` | 失敗行のみ再処理（チャンク単位） |
| `ebApiSbCancel()` | `LIB.ebApiSbCancel` | ジョブ中止・状態クリア |
| `ebApiShowSidebar()` | （ホストで `showSidebar`） | サイドパネル表示（メニューから） |

### 2-2. ライブラリ本体（EbayTranslationApi.gs に新設）
- `ebApiSbStart` / `ebApiSbProcessChunk` / `ebApiSbGetState` / `ebApiSbRetryFailed` / `ebApiSbCancel`
- `writeRowsBatch_(outputSheet, rowsValues, lock)` … **チャンク分を一括 setValues**（新規）

**既存資産を再利用（再実装しない）**:
`fetchImagesBatch_`（画像base64・メルカリ非経由）/ `ebApiCallOpenAIBatch_`（並列＋指数バックオフ）/
`buildV5RowValues_` / `enforceSingleTag_` / `safeParseJson_` / `buildErrorRow_` / `readUserTags_`

### 2-3. サイドパネル（CommandSidebar.txt 新規）
- ProgressSidebar.txt の CSS / UI / `updateProgress` / `addLogEntry` / 完了バナーを**流用**。
- `setInterval` ポーリングは**廃止**し、`runNext()` 再帰コールバックで処理を駆動。

```js
function runNext(result){
  if(result){ updateProgress(result); }
  if(result && result.done){ showCompletionBanner(result); return; }
  google.script.run
    .withSuccessHandler(runNext)
    .withFailureHandler(onChunkError)   // チャンク単位リトライ（最大2回）→ だめなら停止表示
    .ebApiSbProcessChunk();
}
// 開始ボタン
google.script.run.withSuccessHandler(runNext).withFailureHandler(onChunkError)
  .ebApiSbStart(config);
```

---

## 3. 状態管理（DocumentProperties）

キー `EBAPI_SB_JOB`（JSON 1本）。500KB/9KB制限に対し 300 行でも数 KB で収まる。

```json
{
  "jobId": "20260522-153000",
  "status": "running|paused|completed|failed",
  "sourceSheet": "作業シート名",
  "outputSheet": "v5インポート",
  "startRow": 3, "endRow": 302, "nextRow": 13,
  "totalRows": 300, "processedRows": 10,
  "successRows": 9, "failedRows": 1,
  "failedRowList": [7],
  "chunkSize": 5,
  "consecutiveChunkFailures": 0,
  "lastError": "",
  "updatedAt": "2026-05-22T06:30:00Z"
}
```

- 多重起動防止: 各チャンクで `LockService.getDocumentLock()` を `tryLock(他チャンクと衝突しない短時間)`。取得失敗なら「実行中」を返す。
- 補助: 出力（または作業）シートに「処理済み」印を残し、プロパティ消失時も目視復旧可能にする。

---

## 4. 処理フロー

1. メニュー「サイドパネル翻訳」→ ホストが選択範囲を読み、`ebApiShowSidebar()` でサイドパネル表示。
2. サイドパネル「開始」→ `ebApiSbStart({startRow,endRow,chunkSize})`。状態を初期化保存し進捗0を返す。
3. `runNext` → `ebApiSbProcessChunk()` を done まで繰り返し:
   1. `LockService` 取得 → 失敗なら「実行中」返却
   2. 状態読込（`nextRow`〜）。`chunkSize` 行を作業シートから読む（**A列=商品IDも読む**）
   3. `fetchImagesBatch_` → `ebApiCallOpenAIBatch_`（並列＋既存リトライ）
   4. 成功は配列に蓄積、失敗行は `failedRowList` に記録
   5. `writeRowsBatch_` で成功分を**連続空き行に一括書き込み**（書込前に商品ID整合を確認）
   6. 状態更新（`nextRow += chunkSize` 等）→ ロック解放 → 進捗を返す（`done = nextRow > endRow`）
4. 完了 → エラーサマリ表示。`failedRowList` があれば「失敗行を再翻訳」ボタン → `ebApiSbRetryFailed()`。
5. ブラウザを閉じた場合 → メニュー再表示時 `ebApiSbGetState()` で「続きから再開」。

---

## 5. 設計判断（3者協議の結論）

| # | 判断 | 内容 |
|---|---|---|
| ① チャンク行数 | **既定5行・設定可（3〜10）** | 1チャンクを数十秒に保ち6分に近づけない。サーバ側で経過時間ガード（既定の安全上限を超えたら次行に進まず返す） |
| ② 書き込み | **チャンク一括 setValues** | 書込直前に H列(=`OUTPUT_SEARCH_COL`)空き行を再計算。連続空きブロックを確保、無ければ末尾追記。`LockService` で排他 |
| ③ 途中保存・再開 | **DocumentProperties + Lock** | トリガー不使用。状態の正本は GAS 側。シート印で二重保険 |
| ④ リトライ | **2層** | サーバ内: 既存指数バックオフ（429/5xx、最大2〜3回）。クライアント: チャンク丸ごと再試行（最大2回）。失敗行は記録し継続、最後に一括再処理 |
| ⑤ エラー時 | **行は継続・系は停止** | 行単位失敗→スキップ継続（完走優先）。認証/シート不在/必須列欠落/連続チャンク全失敗→停止して通知 |
| ⑥ データ汚染対策 | **商品ID照合** | 行番号だけに依存せず A列商品IDで対象を検証。サイドパネルに「処理中はシートを編集しない」警告。開始時に `endRow` 固定 |

---

## 6. 新規・変更ファイル（ライブラリ同期必須）

| ファイル | 変更 |
|---|---|
| `EbayTranslationApi.gs` | SB系関数 + `writeRowsBatch_` 追加 |
| `Library/EbayTranslationApi.gs` | 同上（同期） |
| `UserSheet/Main.js` | 窓口関数 + `ebApiShowSidebar()` 追加 |
| `CommandSidebar.txt` | 新規（司令塔HTML） |
| `Library/HtmlTemplates.gs` | `CommandSidebar` 登録（`Library/convert_html_to_gs.py` 経由） |
| メニュー定義（場所は実装時に特定: Main.js or コード_Part3） | 新メニュー項目「サイドパネル翻訳」追加 |

設計数値（プロンプト関連）は触らない。本機能は処理制御のみで `PROMPT_DESIGN_PRINCIPLE.md` の対象外。

---

## 7. バージョン管理方針（戻せること必須）

- 作業ブランチ `feature/ebapi-sidebar-batch` を切り、main は常に安定に保つ。
- 各フェーズ完了ごとに `git add <明示ファイル>` → `commit` → `push`（`git add -A` 禁止）。
- clasp 本番反映は git 記録後＋ユーザー承認後。`yes | clasp push -f`。
- 不具合時はコードを手で消さず `git restore` で戻す。

---

## 8. 実装フェーズ（段階コミット）

| Phase | 内容 | 確認 |
|---|---|---|
| 1 | 状態管理＋窓口＋`ebApiSbProcessChunk`＋`writeRowsBatch_`（一括書込）。サイドバー無しでメニューから1チャンク手動実行 | 5〜10行が一括で書けるか |
| 2 | CommandSidebar.txt（司令塔ループ・進捗表示） | 進捗バーが動き連続処理されるか |
| 3 | リトライ・失敗行再処理・エラーサマリ | 失敗行が記録・再処理されるか |
| 4 | 商品ID照合・再開・仕上げ | 200〜300行 実データ完走、ブラウザ閉じ→再開、画像メルカリ非経由維持 |

各 Phase で Codex 実装 → Claude＋Gemini の E-02 レビュー → コミット。

---

## 9. 動作確認（実データ必須）

- 少数行（5〜10）で完走
- **200〜300行 実データで完走・タイムアウトしない**（feedback: 実データ検証）
- ブラウザ閉じ→再開で続行
- 失敗行のみ再翻訳
- 画像がメルカリCDN非経由のまま（既存の base64 / doGet 経路を壊さない）

---

## 10. 実装時に実コードで最終確認する事項（Unknown）

- `OUTPUT_SEARCH_COL` / `OUTPUT_START_COL` / `OUTPUT_DATA_ROW_START` の定義値と、出力シートの虫食い実態
- メニュー定義の場所（Main.js / コード_Part3 のどちらか）
- `google.script.run` の長時間チャンク時のクライアント挙動（チャンクは短く保つ前提で回避）
- 作業シートの商品ID列の正確な位置（A列前提だが実コードで確認）
