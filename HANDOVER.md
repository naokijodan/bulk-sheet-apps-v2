# 一括シートV3 引き継ぎ文

> **Last updated**: 2026-05-27 (harness-20260526-233054 終了時、TagShipping S/T列追加 全段階完了 + main push 済み + 椛島さん実機 OK)
> **次セッションへ最優先で**: 下記「2026-05-27: TagShipping S/T列追加 — 全段階完了」セクションを読む → priority 39 和楽器から再開
> **唯一の設計基準 (プロンプト改修系)**: [`docs/PROMPT_DESIGN_PRINCIPLE.md`](docs/PROMPT_DESIGN_PRINCIPLE.md) **v1.1** (commit 48cab87)
> **過去の Sprint Contract / 旧設計書は物理削除済み**。参照しないこと。
> **進捗**: priority 1-38 完遂、TagShipping S/T 列追加 完了、**次は priority 39 和楽器から再開**

---

## 重要警告（必読）

**過去の設計書を「探してきて」はいけない。** 過去の Sprint Contract と古い docs/ 設計書は物理削除済み。

設計判断は **`docs/PROMPT_DESIGN_PRINCIPLE.md` v1.1 のみ** を根源基準とする。

---

## 2026-05-27: TagShipping S/T列追加 — 全段階完了 (harness-20260526-233054)

> **状態**: 全段階完了。commit 5 件 main push 済み (`899d11a..b2a2f9d`)、Library clasp push 2 回完了 (27 files)、椛島さん実機 OK。

### 完了 commit (5 件)

| Hash | 内容 |
|---|---|
| `678f913` | feat(TagShipping): S/T列(利益方法/送料方法)追加 + U/V→W/X列マイグレーション (段階1) |
| `f967ad8` | feat(setup): V5 利益計算方法ラジオを「タグ別利益計算/利益額計算」に変更 (段階2、Option A=value 継続) |
| `07b4da5` | feat(pricing): AQ/AR/AS補助列+TagShipping S/T列で行ごと利益・送料切替+1-3行目ガード3重防御+保護範囲+フェイルセーフ (段階3) |
| `f93b231` | fix(stage3): E-02 round1指摘修正 (技術的負債コメント + 外側snapshot bracket + JSDoc + 定数化) |
| `b2a2f9d` | fix(stage3): applyAuxColumnsProtection_ から setUnprotectedRanges([]) 削除 (Range Protection API 仕様) |

### 実装範囲

- **Config.gs**: HEADERS 18→20 (S=利益方法, T=送料方法), TAG_LIST_START_COL 21→23, METHOD_VALUES 定数 (Object.freeze)
- **コード_Part3 ensureTagShippingSheet_**: S/T ヘッダー追加 + U/V→W/X 移行 (べき等、OLD_UV_START_COL=21 定数化)
- **コード_Part3 applyTagShippingValidations_**: S/T 列ドロップダウン (setAllowInvalid=false), stDataRows=Math.max(100)-1
- **Utils.gs buildTagOverrideMap_**: 列数 18→20, profitMethod/shippingMethod (NFKC normalize) 追加
- **SetupDialog.txt + Library/HtmlTemplates.gs**: V5 利益ラジオラベルを「タグ別利益計算/利益額計算」に変更 (value=RATE/AMOUNT 継続=Option A)
- **Utils.gs**: validateTagShippingMethods_, buildAQFormulas_, buildARFormulas_, buildASFormulas_ 新規
- **コード_Part3**: ensureAuxHeaders_, seedAuxColumns_, applyAuxColumnsProtection_, applyCalculationFormulas V5 ブロック (3 重防御)

### 3 重防御 (赤字直結対応、Sprint Contract v3.1 §6 完全準拠)

| Layer | 内容 | 実装場所 |
|---|---|---|
| Layer 1 物理ガード | getRange(5, AQ_COL, n, 1) のみ書き込み | seedAuxColumns_ |
| Layer 2 ヘッダーべき等 | 4 行目に想定外値 → throw | ensureAuxHeaders_ |
| Layer 3 snapshot 検証 | 1-3 行目 JSON.stringify 前後比較 → throw | seedAuxColumns_ (内側) + applyCalculationFormulas (外側、二重) |

### 保護範囲 AQ1:AS3 (Range Protection)

- `getRange(1, AQ_COL, 3, 3).protect()` + `setWarningOnly(false)` + `addEditor(Session.getEffectiveUser())` + description で idempotent
- ⚠️ **`setUnprotectedRanges([])` は Sheet Protection 専用 API。Range Protection で呼ぶと例外。** (Hotfix b2a2f9d で削除済み、再発防止)

### E-02 検察官レビュー結果

| 段階 | round1 | round2 | findings |
|---|---|---|---|
| 段階1 | PASS_WITH_MINORS (M1+L1) | PASS | 修正 2 件 (OLD_UV_START_COL + stDataRows) |
| 段階2 | PASS (findings ゼロ) | (skip) | - |
| 段階3 | FAIL (M2+L2) | PASS | 修正 4 件 (技術的負債 + 外側 snapshot + JSDoc + 定数化) |

### 技術的負債 (Sprint Contract v3.1 §13-G、4 ファイル冒頭コメント追記済)

AQ/AR/AS 列は **1-3 行目 (既存設定: AQ=配送式, AR=ラベル, AS=プロンプトID/自動選択モード)** と **4 行目以降 (本機能: 利益・送料計算補助)** で用途が分断されている。将来フェーズで「設定値を別シートに分離」して列を一本化することを推奨。

### 既知の追加課題 (次回改修時に検討)

- `writeTagListToSheet_` 内の「Q-R 列をクリア」コメントが TAG_LIST_START_COL=23 変更後と乖離 (今回スコープ外、コード自体は正常)
- W 列 (作業シート) の利益額モード行の表示が紛らわしい (計算には使われない、将来フェーズで整理推奨)

### バックワード互換性

- value 属性 RATE/AMOUNT 継続 (Option A) で既存 DocumentProperties (`V5_PROFIT_METHOD='RATE'`) そのまま動作
- TagShipping S/T 列が空のタグはフォールバック (「タグ別利益率」「タグ別送料」)
- AQ2/AQ3 既存 X 列絶対参照は不変、AR2/AR3/AS2/AS3 既存値は保護範囲で物理ブロック

### 学習 / 教訓

- **GAS API 仕様は実機で必ず検証**: setUnprotectedRanges([]) の挙動を確認せず Sprint Contract pseudocode をそのまま実装した結果、初期設定で実機エラー発生 → 1 行削除 hotfix で復旧
- **child-a の独断 commit 防止**: 段階3 で child-a が独断 commit (07b4da5)。今後 child は親指示まで commit しない (Sprint Contract v3.1 §9 のレビューサイクル準拠)
- **child-c 検察官レビューは 2 周必要**: 段階3 round1 で 4 件 (M2+L2) 検出、round2 で全解消確認 → PASS。椛島さん方針「LOW パス禁止」厳守
- **Option A の有効性**: value 属性継続でラベルだけ変更 → 既存 DocumentProperties そのまま動作 (移行コード不要、互換性完全)

---

## 2026-05-26 夜: TagShipping S/T列追加 — 設計確定 + 依存検索完了（履歴）

> **状態**: 設計フェーズ完了 (harness-20260526-151218)。本セッション (harness-20260526-233054) で実装完了 → 上記「2026-05-27」セクション参照。

### このセッションで完了したこと（commit/push なし、設計確定のみ）

1. **要件確定 (椛島さんとの対話)**:
   - V5 利益計算ラジオを「タグ別利益計算 / 利益額計算」に変更
   - V5 送料計算ラジオは「タグ別送料 / 固定金額」維持
   - 「タグ優先」チェック新規追加は **不要** (V5 ラジオで完結)
   - TagShipping S列「利益方法」(タグ別利益率 / 利益額（Profit_Amounts参照）)
   - TagShipping T列「送料方法」(タグ別送料 / 固定金額（Profit_Amounts参照）)
   - TagShipping U/V → W/X 列移行 (1-3 行目は触らない、視覚的区切り)
   - 行ごと混在 OK (R 列に IF 分岐)、タグ別モード時は H1/J1 を空にする
2. **3 者協議 (GPT-5 + Gemini + Claude) 2 ラウンド**:
   - Round 1: HIGH リスク 3 点 (R 列 800文字, IFERROR 赤字フォールバック, 中間状態リスク) → 補助列方式採用
   - Round 2: 3 補助列分離案合意、AW 使用中 → 椛島さん指示で AQ/AR/AS の 4 行目以降採用
   - v3.1 追加: ドライラン、依存検索、保護範囲、冪等性、サンプリング監査、技術的負債明示
3. **依存検索 (Read-only ドライラン) 完了**:
   - 総合リスク: **LOW** (設計通り 4 行目以降のみ操作なら問題なし)
   - 新発見: X 列 (配送方法) 全行が `$AQ$2` `$AQ$3` を絶対参照 → **AQ2/AQ3 絶対書込み禁止**
   - 新発見: `Translation.gs:103/116` / `コード_Part1:1318/1894/3226` が `AS2/AS3/AQ2/AQ3` を `getValue()` → 触らなければ OK
   - 既存物理保護範囲・条件付き書式・他シート参照 ゼロ件 (LOW リスク確認)

### 次セッションで読むべきファイル (フルパス・必読)

> ⚠️ ハーネスセッション (`harness-20260526-151218`) は終了済の可能性あり。下記ファイルは保管されている。

| 種類 | パス |
|---|---|
| **Sprint Contract v3.1 (設計確定書)** | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/contracts/master-tag-shipping-method.md` |
| child-a 報告: 列移動・既存式・Profit_Amounts 構造 | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/reports/child-a-task02a-20260526-160000.json` |
| child-b 報告: 依存検索ドライラン結果 | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/reports/child-b-task03b-20260526-231056.json` |
| child-c 報告: Obsidian + 実シート初回確認 | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/reports/child-c-task01c-20260526-152053.json` |
| child-a 報告: 初回コード調査 | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/reports/child-a-task01a-20260526-153000.json` |
| child-b 報告: tagOverride* パターン | `/Users/naokijodan/.tmux-harness/sessions/harness-20260526-151218-dc88b44b/reports/child-b-task01b-20260526-152102.json` |

これらを読めば、設計の全貌・Fact・絶対遵守ルールがすべて分かる。

### 実装フェーズ (段階1〜3、各段階で commit、clasp push は段階3 後一括)

**段階1: TagShipping 列構造変更**
- `Config.gs` / `Library/Config.gs`: HEADERS 18→20 (S=利益方法, T=送料方法 追加), TAG_LIST_START_COL 21→23, METHOD_VALUES 定数追加
- `コード_Part3_メニュー・設定関連.gs` / `Library/`: ensureTagShippingSheet_ に S/T 移行 + U/V→W/X 移行処理を追加、applyTagShippingValidations_ に S/T ドロップダウン追加
- `Utils.gs` / `Library/Utils.gs`: buildTagOverrideMap_ 列数 18→20、profitMethod/shippingMethod フィールド追加
- コミット: `feat(TagShipping): S/T列(利益方法/送料方法)追加 + U/V→W/X列マイグレーション (段階1)`

**段階2: SetupDialog V5 利益ラジオ改修**
- `SetupDialog.txt`: V5 利益計算方法ラジオを「タグ別利益計算 / 利益額計算」に変更
- `Library/HtmlTemplates.gs`: convert_html_to_gs.py で再生成
- 既存の前回値保持ロジック (V5 ラベル) を新ラベルにマッピング
- コミット: `feat(setup): V5 利益計算方法ラジオを「タグ別利益計算/利益額計算」に変更 (段階2)`

**段階3: 補助列 AQ/AR/AS + 計算式 + 1-3 行目ガード + 保護範囲 + フェイルセーフ**
- `コード_Part3` / `Library/`:
  - `seedAuxColumns_(sheet, lastRow)` 新規: 5 行目以降に AQ/AR/AS の式を seed (1-3 行目を物理参照しない)
  - `ensureAuxHeaders_(sheet)` 新規: 4 行目に「適用利益率」「適用利益額」「適用送料」をべき等設定
  - `applyAuxColumnsProtection_(sheet)` 新規: `AQ1:AS3` 保護範囲 (管理者+GAS のみ編集可) 設定
  - `applyCalculationFormulas` 改修: スナップショット検証 → ヘッダー → 補助列 seed → R/U/T 列の式変更
- `Utils.gs` / `Library/`:
  - `validateTagShippingMethods_(sheet)` 新規: S/T 列の値検証 throw
  - `buildShippingFormulas_` 改修: T 列の式を AS 参照に変更
- コミット: `feat(pricing): AQ/AR/AS補助列+TagShipping S/T列で行ごと利益・送料切替+1-3行目ガード3重防御+保護範囲+フェイルセーフ (段階3)`

**リリース** (段階3 完了後、一括 clasp push):
1. clasp push 前に椛島さんに報告 → 承認
2. `cd Library && yes | clasp push -f`
3. Main.js 不変なのでユーザーシート再 push 不要
4. 椛島さん実機確認

### 絶対遵守ルール (赤字直結リスク、新セッションは必読)

1. **作業シート AQ2/AQ3 に絶対書込み禁止**: X 列全行が `$AQ$2` `$AQ$3` を絶対参照しているため、変更すると全行 X 列 (配送方法) が破壊される
2. **作業シート AS2/AS3 に絶対書込み禁止**: `Translation.gs` / `コード_Part1` が `getValue()` で読む (プロンプトID, 自動選択モード)
3. **作業シート AR2/AR3 に絶対書込み禁止**: 静的ラベル ("使用プロンプト", "プロンプト選択")。初期設定実行時のみ書き換え、通常運用では不変
4. **1-3 行目への書き込みを 3 重防御で物理的に防ぐ**:
   - 防御1: GAS で `getRange(5, col, n, 1)` のみ使う (1-3 行目を物理参照しない)
   - 防御2: 4 行目ヘッダーべき等チェック (既存値があれば throw)
   - 防御3: seed 前後で 1-3 行目スナップショット → diff != 0 で throw
5. **AQ4/AR4/AS4 ヘッダー + AQ5+/AR5+/AS5+ の式 seed のみが許可される**
6. **検証は実シート `1uLTVBPb1tRzjiEHg-clDwHGs8YHuZkVyGA6TaR3jhC0` (V5 ワークブック、gid 1116471535 = 作業シート)。配布用 `1p3gC...` や旧シート `10AXSED...` と取り違え禁止**
7. **git add -A 禁止、ファイル明示**
8. **ライブラリ同期必須 (ルート + `Library/`)**、`ScriptProperties` 禁止 (DocumentProperties のみ)

### 教訓 (このセッションの認識ミス、再発防止)

- AT 列を空きと誤認 (実は ARRAYFORMULA で重複チェック使用中) → **列の用途は実シートで FORMULA 取得して Fact 確認すること**
- 「作業シート」と「v5インポート」を混同 → **シート名は spreadsheet タイトル + シート名 (gid) で常に明示する**
- シート ID `10AXSED...` と `1uLTV...` の混同 → **作業対象 spreadsheet ID は明示的に Fact 確認する**

### Profit_Amounts シート構造 (Fact 確認済、Sprint Contract 参照)

`1uLTVBPb1tRzjiEHg-clDwHGs8YHuZkVyGA6TaR3jhC0` の Profit_Amounts シート:
- A = Cost Range (Min) — 仕入価格閾値下限 (VLOOKUP TRUE の検索対象)
- B = Cost Range (Max) — 範囲上限 (未使用)
- **C = Profit Amount (JPY)** — 利益額
- **D = 想定送料** — 送料額
- E = 説明 — コメント欄

---

## 2026-05-26: V5固定設定・生成ボタンUX・Profit_Amounts堅牢化

> 一連の改修。詳細は Obsidian 開発ログ参照。

### 完了内容
- **V5固定設定（課題A）**: `0b65f20` V5ルートで送料・利益の固定設定を可能に（V5設定に2選択追加・固定時は配送系タグ判定を除外しFIXED式・フェイルセーフ）。
- **生成ボタンクリック感**: `dd9db77` 翻訳指示文生成ダイアログの生成ボタンに :hover/:active/transition を追加。
- **Profit_Amounts 堅牢化（課題B）**: 次のコミット
  - 数式: GASが正規最終行を算出し `$A$2:$C$<n>` を埋め込み（残骸を除外）。
  - validateProfitAmounts_: A列の数値・厳密昇順、C/D列の数値・非負を検証し違反なら throw で価格計算停止。
  - 最大超過警告（B案）: 仕入が正規最大を超えた件数を完了メッセージに `⚠ N件` 表示＋Logger。
  - 背景: ユーザー実シートで「正規データ(A2-A742, 2,507,000まで)＋空行＋下に古い残骸(74000円台 約1000行)」があり COUNTA=1742 に膨らみ VLOOKUP TRUE が昇順崩壊で誤動作する事故が発生。残骸削除＋堅牢化で解決。
- **V5前回値保持**: 次のコミット
  - SetupDialog の V5ラジオを scriptlet 化（`<?= currentV5ProfitMethod === 'RATE' ? 'checked' : '' ?>` 等）。
  - コード_Part1 で `currentV5ProfitMethod`/`currentV5ShippingMethod` を docProps から template に設定。

### 重要な学び
- 配布製品では Profit_Amounts の設計がユーザーごとに完全にバラバラ（ARRAYFORMULA自動生成・99円刻み1742行など）。3者協議で「数式の正規範囲限定＋GAS検証で異常時停止」の2層防御を採用。
- 検証で配布用シート(1p3gC…)とユーザー実シート(10AXSED…)を取り違えた反省。今後は**実シートで検証**する。

---

## 2026-05-25: route② サイドパネル翻訳のデッドロック修正

> route②(司令塔方式サイドパネルバッチ翻訳)で「開始もキャンセルもできない」デッドロックを解消。

### 症状
サイドパネルが固まり、開始ボタンは「既に翻訳ジョブが実行中です」で拒否、キャンセルボタンは disabled で押せない。前回のジョブ(例:331-332行 running)がブラウザ/パネルを閉じた後も DocumentProperties キー EBAPI_SB_JOB に running のまま残ることが発端。

### 原因(Fact・実コード確認)
- サーバー ebApiSbStart(EbayTranslationApi.gs 1904-1906): status==='running' を無条件拒否。
- クライアント initState(CommandSidebar.txt): running 検出時に案内ログのみ。setRunningUi も再開も呼ばず、キャンセルボタン(HTML初期disabled)を有効化しない。

### 修正(CommandSidebar.txt のみ・サーバー不変)
「再開待ち(pendingResume)」状態を新設。既存の開始ボタンを流用しラベルを「再開」に切替(ボタン新設はしない)。

1. initState: running 検出で pendingResume=true、開始(再開)・キャンセル両ボタン有効化、入力欄disabled(自動再開はしない)。
2. onStart: pendingResume 時は ebApiSbStart を呼ばず runNext を直接再開(job.nextRow から継続)。
3. onCancel: ebApiSbCancel でジョブ削除→通常状態へ。失敗時は stopLoop せず再操作可能を維持。
4. onStartSuccess: {ok:false} 時に initState() で自己同期(別経路のデッドロック防止)。
5. initState 成功ハンドラ冒頭に if(isRunning) return(非同期競合防止)。

### レビュー・反映
- 2者レビュー(Claude親 + Gemini検察官)で両者PASS。Gemini指摘 HIGH2/MEDIUM2/LOW1 + 再レビューHIGH1 を全反映。
- ライブラリ clasp push 済(Pushed 27 files、scriptId 1GjyV4kQ...)。Main.js不変のためユーザーシートpush不要。
- 動作確認(実機): キャンセル(リセット)→新規開始→完了 OK。「再開」ボタンでの続き処理は実機未検証(コードレビューでは整合確認済)。

---

## 2026-05-23: eBay カテゴリID の AI判定方針＋絞り込み参照リスト（新タスク）

> 旧 HANDOVER の「カテゴリID＝タグとのマッチングでプログラム化（公式ID参照シート）」は**廃止**し本方針に置換。詳細 memory: `project_bulksheet_category_ai.md`。

**方針（確定）**: カテゴリID は AI に判定させる。参照リストを用意するが **AI はライブラリ/シートを自分では読めない**（見えるのはプロンプト＋web検索のみ）。よって GAS コードが商品ごとに「関係ジャンル分だけ」を参照リストから抜き出してプロンプトに渡す（スライス投入）／または AI出力IDをコードが許可リストで検証する。元データはライブラリにハードコード（配布製品なので全ユーザーに自動配布・一括更新）。

**成果物（~/Desktop/）**:
- `ebay-categories-curated.csv` / `.xlsx` … 絞り込み済み **4,895件**（列: categoryId, department, fullPath）。15,111→4,895。
- `category-curation-rules.md` … 全34部門の絞り込みルール（再生成の仕様書）。
- `ebay-departments-overview.md` … 全部門のサブ枝マップ（件数・Other-ID 付き）。
- `ebay-categories-full.csv` … 絞り込み前 全15,111件。

**全件取得元（Fact）**: eBay Manager（~/Desktop/ebay-manager）の本番OAuth＋Taxonomy API `getCategoryTree`（EBAY_US, treeId 0, treeVersion 134）。

**粒度原則**: 詳細は Item Specifics が持つのでカテゴリは粗くてよい。コア（トレカ/アニメ/フィギュア/時計/カメラ/骨董/コイン等）のみ全残、周辺は Other 代表に畳む。

**安全（web検索）**: web検索は OpenAI 側で実行され自アカウントは無関係。仕入れ元URLをAIに渡さず一般/公式確認に限定すれば一括でも可。タイトル補助にも有効。

**次の実装（未着手）**:
1. route② の AI 呼び出しコード（OpenAI Responses API か等）とタグ→部門対応を調査。
2. 4,895件をライブラリにハードコード（元データ）。
3. 商品ごとにジャンル分をスライスしプロンプト投入する処理を Codex で実装 → Claude+Codex レビュー → 承認後 push（ライブラリ同期・コミット前チェックリスト厳守）。

### ✅ 実装完了（2026-05-23 同日）

実装・反映済み（ライブラリ clasp push 済。テスト: **API翻訳=動作確認OK** / CLI翻訳=確認済）。

- **対応表**: `CategoryBuckets.gs`（root+Library、67ジャンル→公式候補）。`gen_category_buckets.py` が `~/Desktop/ebay-categories-curated.csv` から生成（**手編集禁止**）。treeVersion 134 / EBAY_US。
- **絞り込みリスト穴埋め**: 釣り(リール/竿/釣具)・ゴルフ・テニスが Sporting Goods 畳みすぎで欠落していたため、全件から **36件補充**（4,895→**4,931**）。`~/Desktop/category-curation-rules.md` に記録。
- **API翻訳(route②)**: `EbayTranslationApi.gs` で 許可タグ→ジャンル→候補(union)をプロンプト注入し、AI出力 categoryId を候補IDで**検証して F列**へ。候補が空なら従来通り F列空（既存動作不変）。route①(translateRows) と route②(ebApiSb*) 両対応。
- **CLI翻訳**: `SKILL.md`(~/.claude/skills/ebay-translation/) と `EbayTranslationSkill.gs`(getEbayTranslationSkillContent) が **GitHub公開JSONを HTTP 取得**して同様に判定。配布製品なのでローカルファイル依存にしないこと。
  - 公開リポジトリ: https://github.com/naokijodan/bulksheet-ebay-categories
  - 参照URL: https://naokijodan.github.io/bulksheet-ebay-categories/ebay-category-buckets.json
- **E-02**: Gemini検察官レビューで **プロトタイプ汚染(HIGH)** 修正（idSet等を `Object.create(null)`）。node ローカル検証 13項目 PASS。
- **更新運用**: `python3 gen_category_buckets.py` → `CategoryBuckets.gs`(ライブラリ用) と `ebay-category-buckets.json`(CLI用) を同時生成 → ①ライブラリ clasp push ②`bulksheet-ebay-categories` リポジトリへ push。両者は同一生成物で整合。
- **既知の穴（優先度低）**: 関数電卓0件 / 電子辞書1件 / 石鹸2件（curated に該当が薄い。扱いが増えたら curation 再生成）。
- **別タスク指示書**: `~/Desktop/ebay-category-finder_拡張機能_指示文.md`（手動出品用カテゴリID検索ブラウザ拡張。全15,111件。未着手）。

---

## 2026-05-22〜23: route② サイドパネル司令塔方式バッチ翻訳（別軸の新機能）

> ブランチ `feature/ebapi-sidebar-batch`（main 未マージ）。設計書 `docs/ebApi-sidebar-batch-design.md`。

### このセッションで完了（すべて実機反映済み = clasp push 済）
| 内容 | commit |
|---|---|
| 段階1: 状態管理・チャンク処理・一括書き込み | `0f4848e` |
| 段階2: サイドパネル本体・窓口・メニュー追加 | `820f0db` |
| 選択範囲の自動反映（インポート用シートの選択行を取り込む） | `aefdbaf` |
| 旧翻訳メニュー5項目を廃止（サイドパネルに一本化） | `dd1402b` |
| 翻訳プロンプトをスキル版に揃える（categorySuggestions廃止・画像記述修正） | `5a7ccea` |
| A: スキル版(SKILL.md + getEbayTranslationSkillContent)を統合版に揃える | `a9e80fd` |
| B: 翻訳プロンプト編集機能（専用シート「翻訳プロンプト」A2・編集優先・旧GPT_Promptsと完全分離） | `948e21a` |

- 機能: メニュー「🌐 eBay 翻訳 (AI)」→「🔑 サイドパネルでバッチ翻訳」。インポート用シートの選択行を翻訳し v5インポートへ。runNext 再帰でチャンク処理（6分制限回避）、runId で二重ループ防止、選択範囲の自動取り込み。
- 入出力: `SHEET_INPUT='インポート用'`、`OUTPUT_SHEET='v5インポート'`、`ROW_START=3`。
- 廃止した旧メニュー（関数本体は残置）: 選択行翻訳/全行翻訳/続きを処理/自動再開を停止/現在の処理状態を確認。

### 次にやること（route② は完了。残りは将来課題と本流タスク）
- **A・B はともに完了済み**（上の完了テーブル `a9e80fd` / `948e21a` 参照）。当初ここに「次にやること」として書いていた A（スキル版を統合版に揃える）・B（翻訳プロンプト編集機能）は、2026-05-22〜23 セッションで実装・実機反映まで完了し、ブランチ `feature/ebapi-sidebar-batch` を **main にマージ・push 済み**（2026-05-23）。
- route② の残り = 下記「将来課題」セクションのみ（急ぎではない）。
- **プロジェクト本流の次タスクは priority 39「和楽器」以降**（下記「残タスク（priority 39 以降）」セクション）。

### 重要な決定事項
- 新システム（サイドパネル翻訳）のプロンプト管理は**完全分離**（旧 GPT_Prompts と混ぜない、新しい場所・新しい編集機能）
- GAS版 SYSTEM_PROMPT とスキル版を**統合版**（スキル版コア5キー＋GAS有用ルール）に揃える。GAS版は完了、スキル版がタスクA
- **categorySuggestions（AIカテゴリID推測）廃止**。F列は空。将来カテゴリIDは**タグとのマッチングでプログラム化**（公式ID参照シート、別タスク）

### 将来課題
- カテゴリID = タグとのマッチングでプログラム化
- description の ASCII クリーンアップ（スマートクォート混入対策、Gemini E-02 指摘 MEDIUM）
- 将来タグマッチング時の表記ゆれ正規化（小文字化・記号除去）

### clasp 反映手順（このプロジェクトの運用）
- clasp: `/Users/naokijodan/.npm-global/bin/clasp`（PATH非登録、フルパス必須）
- ライブラリ: `cd Library && yes | clasp push -f`（scriptId `1GjyV4kQPkdXbAriCCa7VvA969s3WhKuovNp8u2wixcFWT1hndh2tLQOP`、Pushed 26 files）
- ユーザーシート（4つ、すべて椛島さん本人のシート）: `UserSheet/.clasp.json` の scriptId を順に書換→`clasp push -f`→既定値へ復元
  - 4 scriptId: `1xd0BXi87Y7HgNMAw6AjyGjM2VaxsEipjcunA5X4-n2brHjWtqTmVd0l1`（既定/復元先） / `1YeOEuoJ0P-zOUVEb6gE8VIMUsaS6xwA1VbumeO3niJPU56AODiOXsUXt` / `1ZvW33uAOH9dtAh4sMo7qjFupmpeEds9MsEYyea1aWRtYgxdix0pgJKM3` / `1kcJPtn4CBJ4Z9hKIM4FvW2yJE89kJOX85vhQtmlBpX4CFIk0VZSsXED3`
- **Main.js 変更時は4シート全部、ライブラリ(.gs/プロンプト/メニュー)のみ変更時はライブラリpushだけでOK**（ユーザーシートは developmentMode:true で HEAD 即反映）

---

## 2026-04-30〜05-01: DDP 完全対応（最新コミット `afd4ac5`）

### 状態
- **最新コミット**: `afd4ac5`（Named Range 案の revert）
- O 列 DDP 式: `INDEX(Policy_Master!A:A, MATCH("*"&shippingType&"_"&condition&"_free", Policy_Master!B:B, 0))` で運用
- DDU 無音フォールバック: 復活（DDP 未発見 → DDU にフォールバック）
- Policy_Master A-C 下部に DDP 専用セクション、E-G 列に手動選択用セクション（構造維持）
- AX 列 (DDP_MODE=50) / TagShipping R 列ドロップダウン / ラッパー Utils.gs:L1224 は維持
- Named Range `DDP_POLICY_RANGE` は不採用
- 詳細は Obsidian ノート `開発ログ/一括シートV3_DDP完全対応.md` 参照

---

## 2026-04-29〜04-30 セッションの進捗

### 完了内容

#### Phase A: SOT v1.1 整備（commit `48cab87`）
PROMPT_DESIGN_PRINCIPLE.md v1.0 → v1.1 で `§4.4 ALLOWED SYMBOLS` を明文化。
- §4.4.1 共通許容: `& / : - . ,`、カテゴリ固有 `# ' +`
- §4.4.2 明示禁止: `* $ ~ ^ @ ! ? ™ ( ) [ ] { } " _ % = | \ < > ;`
- §4.4.3 デフォルト禁止ルール
- §4.4.4 出典 (2026-03-16 椛島さん eBay 調査結果 + eBay 公式)
- §4.4.5 退化防止
- §9.2 退化防止チェック / §10 禁止記述リスト 拡充

GPT-5 + Gemini 3者協議 + child-c E-02 検察官レビュー承認済み。

#### Phase B: priority 1〜11 §4.4 最小修正（記号修正のみ）
記号違反のみ修正（§6 改善は実施せず）。1 カテゴリずつ deploy ルール違反で一括 commit してしまったが、後追い E-02 で 8/10 PASS、ベースボール/大相撲 §4.4.5 違反は個別 fix で deploy 済。

| priority | カテゴリ | version | commit |
|---|---|---|---|
| 1 | 時計用 | v52 → v54 | `0e6a6bd` (時計だけ過剰改修。反省) |
| 2 | カメラ | v51 → v52 | `5d109a5` |
| 3〜7 | リール/釣竿/釣具汎用/ゴルフ/ジュエリー | 各 +1 | `0ead95a` (ルール違反、一括) |
| 8〜11 | ポケカ/MTG/ベースボール/大相撲 | 各 +1 | `03f0060` (ルール違反、一括) |
| - | ベースボール v48 → v49 fix | §4.4.5 CRITICAL | `618e07b` |
| - | 大相撲 v48 → v49 fix | §4.4.5 CRITICAL | `224827b` |

#### Phase C: priority 12〜18 V2.0.1 改修完成（弾薬充実 + §4.4 準拠）
priority 13 以降は本来の V2.0.1 改修に戻る方針。child-a/b/c 並列 C0 → child-a C4 → child-c E-02 → deploy のフルワークフロー。1 カテゴリずつ厳守。

| priority | カテゴリ | version | E-02 | deploy commit |
|---|---|---|---|---|
| 12 | 遊戯王 | v47 → v50 | PASS | `850b555` |
| 13 | ワンピースカード | v48 → v49 | PASS_WITH_MINORS | `4c10ed0` |
| 14 | ドラゴンボールカード | v46 → v48 | PASS_WITH_MINORS (v47 §4.1 違反 → v48 rework で解消) | `4a5e839` |
| 15 | ヴァイスシュヴァルツ | v45 → v46 | PASS_WITH_MINORS | `7186806` |
| 16 | デジモンカード | v46 → v47 | PASS_WITH_MINORS | `d8777a0` |
| 17 | ガンダムカード | v43 → v44 | PASS_WITH_MINORS | `2a18f50` |
| 18 | トレカ汎用 | v45 → v46 | PASS_WITH_MINORS (source_bound EXCELLENT) | `8c13364` |

---

## 完了済み追加（2026-05-01〜02 セッション harness-20260501-* / harness-20260502-093617）

| priority | カテゴリ | version | E-02 | deploy commit |
|---|---|---|---|---|
| 19 | ゲーム用 | V2.0.1 | PASS | `3ff9e0e` |
| 20 | ゲーム機 | V2.0.1 | PASS | `5e25b6e` |
| 21 | コレクティブル | V2.0.1 → v46 | PASS | `67553d0` |
| 22 | フィギュア | v51 | PASS (regression resolved) | `41c0e46` / `d3a9876` |
| 23 | アニメ | v2→v3 | PASS | `ed5d78c` |
| 24 | 漫画 | v22→v23 | PASS | `f1f43f3` |
| 25 | オーディオ・家電 | v1.0→v23→v24 | PASS | `8468077` / 整合 `6439826` |
| 26 | 楽器 | v1.0→v23→v24 | PASS | `1f8e8e1` / 整合 `6439826` |
| 27 | 楽器_ギター | v1.0→v23 | PASS | `ddf817b` |
| 28 | 楽器_アンプ | v1.0→v23 | PASS | `28b7fed` |
| 29 | RC・模型 | v1.0→v23 | PASS（HIGH 0/M 0/L 0 完璧） | `fcbeac1` |
| 30 | メカプラモ | v1.0→v23 | spot-fix 後 PASS（Category ID 衝突修正済） | `5c33191` |
| 31 | レコード | v1.0→v23 | PASS | `d47326f` |
| 32 | 万年筆・筆記具 | v1.0→v23 | PASS | `1f2fe0d` |
| - | 整合性負債清算 | priority 25/26 Pro Audio 境界 + Country dict +Mexico (v23→v24) | PASS | `6439826` |
| 33 | 日本刀 | v44→v45（Safety Classifier 最上流配置） | PASS | `c467459` |
| 34 | 陶磁器 | v37→v38（Evidence & Export Gate） | PASS | `290548e` |
| 35 | 茶道具 | v37→v38（Object Routing + 4 attribution 階層） | PASS | `f67bcec` |
| 36 | 鉄瓶 | v37→v38（Function Gate + Workshop W1-W6 + Ashiya 8 点 + Nambu 商標） | PASS | `22d39ed` |
| 37 | 盆栽 | v37→v38（Live Plant Safety Gate 最上位 + Maker M0-M6 + Tool Brand + Suiseki/Daiza） | PASS | `899b7a0` |
| 38 | 包丁 | v39→v40（Safety/Marketplace Gate + Brand B1-B6 + Function/Condition Gate） | PASS | `216e1b2` |

## 残タスク（priority 39 以降）

改修順序 priority に従って残り 30 カテゴリ:

- **39 和楽器** ← 次（C0 未着手）
- 35 茶道具
- 36 鉄瓶
- 37 盆栽
- 38 包丁
- 39 和楽器
- 40 日本人形
- 41 書籍・雑誌
- 42 パソコン周辺機器
- 43 パソコン本体
- 44 電子辞書
- 45 関数電卓
- 46 ボードゲーム
- 47 アート
- 48 掛軸
- 49 版画
- 50 着物
- 51 仏教美術
- 52 日本伝統・骨董
- 53 切手・コイン
- 54 野球
- 55 テニス
- 56 テーブルウェア
- 57 パイプ・喫煙具
- 58 石鹸
- 59 スノーグローブ
- 60 アパレル・ブランド品
- 61 日本ブランド
- 62 ドレスシューズ
- 63 スニーカー（priority 1〜11 タスクには入っていない、未確認）
- 64 レザーグッズ
- 65 サングラス（同上）
- 66 スポーツウェア
- 67 タイトル並べ替え（特殊機能）
- 68 一般商品・汎用

---

## 次セッションへの指示

### 1. 起動時
1. このファイル（`HANDOVER.md`）を読む
2. `docs/PROMPT_DESIGN_PRINCIPLE.md` v1.1 を読む（commit 48cab87）
3. `CLAUDE.md` （project）を読む
4. `~/.claude/CLAUDE.md` （global）+ `~/.claude/rules/tmux-harness.md` を読む

### 2. ワークフロー（priority 39 和楽器 から開始）
各カテゴリで **1 カテゴリずつ厳守**:

1. **状態確認**: `wc -l` + `grep -nE "Allowed symbols|Forbidden|68-75|target [0-9]|SOFT CHAR"` で §4.1/§4.4 違反確認
2. **C0 並列**: child-a/b/c に C0 (existing/market/ammo) を 3 並列で送信
3. **GPT-5 白紙協議**: 自分の方針を前提に出さず批判依頼（mcp__openai-bridge__ask_gpt）— 日本刀で実証、HIGH 8 件の見落としが顕在化
4. **C4 Sprint Contract**: 親直接起草、設計書 §3-§10 + child-c FINDING 1-10 反映
5. **C4 implement**: child-a に直接 Edit/Write 実装依頼（Codex MCP 不使用）
6. **親監査**: 行数 / 構文 / 退化 grep / diff=0 / IS / 境界 / クロスプロンプト整合
7. **E-02 review**: child-c に独立検察官レビュー依頼。**§4.4.5 隠れ違反（VERIFICATION の `, . - '` 禁止記述）+ BOOTLEG MUST と VERIFICATION 語彙 diff=0 を必ず確認**
8. **spot-fix**: HIGH/MEDIUM/LOW 全修正、LOW パス禁止
9. **deploy**: git commit + push + clasp push + feature.json passing + Discord + Obsidian の 1 カテゴリずつ完全サイクル

### 3. 重要な学習（priority 23-38 + 整合性負債清算セッションの反省）

**特殊カテゴリの構造パターン（再利用可能）**:
- 日本刀型: Safety Classifier 4 値（CANNOT_LIST/NEEDS_LEGAL_REVIEW/NEEDS_EVIDENCE/LISTABLE）+ Mei 6 段階（VERY HIGH 偽銘 Smith 二重証拠必須）
- 陶磁器型: Evidence & Export Gate（CANNOT_LIST/NEEDS_EXPORT_REVIEW/NEEDS_AUTHENTICATION_EVIDENCE/LISTABLE）+ Maker 6 段階 + attribution-language exception
- 茶道具型: Object Routing Gate 最上流 + 4 独立 attribution（Maker/Authority Inscription/Tea Master 9 段階/Chashaku Inscription Claim）+ 大徳寺箱書き string trigger
- 鉄瓶型: Function Gate（鉄瓶 vs 鉄急須 vs 茶釜 vs 装飾）+ Workshop W1-W6（Lid vs Body 分離）+ Ashiya 8 点固有名 trigger + Nambu 商標制約
- 盆栽型: Live Plant Safety Gate 最上位（文字列+写真 evidence 両方）+ Maker M0-M6 + Tool Brand Gate + Suiseki/Daiza 独立 + REGULATED_ORGANIC_REVIEW
- 包丁型: Safety/Marketplace Gate（PROHIBITED_KNIFE_TYPE / WEAPON_MARKETING）+ Brand B1-B6 + Function/Condition Gate + Honyaki claim 階層

**追加教訓（priority 34-38 セッション）**:
- 「passing 記録」を信頼しない、grep で実態確認（priority 25 / 38 で発覚）
- byte-match 検証は厳密 decode ロジック（apostrophe double-escape リスク、茶道具 spot-fix 教訓）
- VERY HIGH counterfeit ブランド（堺一文字光秀/正本/有次/木屋/龍文堂/亀文堂/般若勘渓 等）には Title 表現で `By` ではなく `marked` を強制
- 商標登録（南部鉄器=第 5102662 号）の false origin 防止
- Live Plant カテゴリは L1 注記ではなく Safety Gate 最上位（文字列 + 写真両方トリガー）
- Object Routing Gate は複数カテゴリ境界カテゴリで必須（茶道具・盆栽・鉄瓶）
- Function Gate は機能物カテゴリで必須（鉄瓶: 湯沸かし可否、包丁: 片刃両刃・刃渡り・研ぎ減り）
- 茶人 attribution は 9 段階に拡張（made by / inscribed by / named by / owned by / attributed to / in the style of / associated with / school of / utsushi）
- Maker と Authority Inscription を分離（Tomobako = maker confirmed の短絡防止）

**従来の教訓**:
- **改修の本質はパフォーマンス強化（弾薬充実）**、捏造防止取り締まりは付随。守りに偏らない
- **GPT-5 白紙協議の威力**: 自分の方針を前提に出さず批判依頼することで HIGH 多数の見落としが顕在化（日本刀で実証）
- **数値 Category ID は eBay 公式 API 確定値 inline 埋込必須**、未確定は「要再確認」マーク（メカプラモ衝突教訓）
- **child-a 不調が 1 度でも出たら即「実装専任 / レポート系は b・c」分業**（レコード/万年筆/日本刀 の 3 連続教訓）
- **整合性負債を「次回」に飛ばさない**、同 deploy 内で解消（priority 25/26 Pro Audio 境界整合性負債が残った教訓）
- **Sprint Contract に diff=0 検証コマンドを明示**（VERIFICATION と BOOTLEG MUST の語彙整合）
- **VERIFICATION 項目数固定禁止**（manga 流の「項目数を固定値として強制しない」記述）
- **Brand 名は ABSOLUTE BAN list に絶対入れない**、DICTIONARY の「source 明記時のみ」に隔離（tools パターン推奨）
- **特殊カテゴリ（日本刀型）は Safety Classifier 最上流配置**: CANNOT_LIST / NEEDS_LEGAL_REVIEW / NEEDS_EVIDENCE / LISTABLE 4 値、設計書 §6 12 要素の上位
- **VERIFICATION の隠れ違反**（`, . - '` 禁止リストや `60-79`/`30-59` の数値範囲違反）を E-02 で必ず探す
- **数値表記 `N/M` 禁止**（日付混同回避）。「N 件 / 全 M 件」「40%」明示
- **要約に頼らず原典を直接 Read**（feedback_read_notes_not_summaries.md）
- **「選択肢 A/B/C？」を 2 回連続で出したら自分で決める**（判断逃げ禁止）

### 4. 既知の弱点 / 別 Phase 課題
- ヴァイスシュヴァルツ F-01 (公式作品名 Love Live!/SPY x FAMILY 等の `! @ ?` 文字構造的課題)
- ガンダム NF-01 (L345 '30 chars' SEO positioning guideline)
- 各 TCG カテゴリの動的辞書注入機構 (CardPatterns.gs CARD_*) 拡張
- 一部カテゴリの CATEGORY ROUTING numeric eBay ID 確定

---

## 環境メモ

- Library push: `cd Library && npx -y @google/clasp push`
- byte-match 検証: `Python re.subn lambda` 必須（I-01 防止）
- セッション: harness-20260428-002258（このセッション、現在 kill 予定）

---

## 参照リンク

- 設計書: [`docs/PROMPT_DESIGN_PRINCIPLE.md`](docs/PROMPT_DESIGN_PRINCIPLE.md) v1.1
- 進捗 feature.json: [`docs/feature.json`](docs/feature.json)
- 完成済 Obsidian ノート: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/開発ログ/一括シートV3_*.md`
