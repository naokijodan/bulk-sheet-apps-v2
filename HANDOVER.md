# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 今すぐやるべきこと / やってはいけないこと

### やるべきこと（この順番で）
1. グローバルルール（`~/.claude/CLAUDE.md` + `~/.claude/rules/`）を全て読む
2. ユーザーにテストを依頼する（テスト手順と成功条件に従う）
3. テスト完了後、辞書充実（Tier 1→2→3）に戻る

### やってはいけないこと
- ルールを読まずにコードに触る
- Codexに委託せず自分でコードを書く
- レビューを省略してコミット・デプロイする
- 「はず」で答える（必ずコードを確認してから）
- TagShippingの値を数式に直接埋め込む（INDEX/MATCH数式で参照すること）
- 新しいメニュー項目を追加する（Main.gsラッパー問題のため）

---

## ■ 現在の動作/非動作の境界

### 動くもの（clasp push済み）
- GASコード側の計算ロジック（Config, Utils, Part1, Part3, Part4）
- TagShippingシートの構造（G-N列、O列、Q-R列）
- INDEX/MATCH数式による全列のタグ判定
- 想定関税閾値のO列自動抽出
- 個別トグルのDocumentProperties保存・読み込み

### 動かないもの
- なし（HtmlTemplates.gs更新済み、clasp push済み）

---

## ■ HtmlTemplates.gs更新手順（参考: 完了済み）

```bash
cd ~/Desktop/ツール開発/一括シートApps_v3
python3 Library/convert_html_to_gs.py
cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force
```
**手動エスケープは禁止。必ずconvert_html_to_gs.pyを使うこと。**

---

## ■ テスト手順と成功条件

| # | テスト | 成功条件 |
|---|--------|---------|
| 1 | 初期設定を開く | マスタースイッチなし。タグ自動判定設定セクションに「推奨」バッジが表示される |
| 2 | プロンプトトグルON→保存 | AS3セルが「自動選択」になる。プロンプトセクションに「自動選択」チェックボックスは存在しない（一元管理化済み） |
| 3 | プロンプトトグルOFF→保存 | AS3セルが「手動」になる |
| 4 | 送料トグルON | 送料セクションのラジオ（テーブル計算/固定金額）がdisabled + 注意メッセージ表示。「タグ別送料」ラジオは存在しない（一元管理化済み） |
| 5 | 送料トグルOFF | 送料セクションのラジオが通常操作可能に戻る |
| 6 | 保存→式の再出力 | V列に`=IFERROR(VALUE(SUBSTITUTE(INDEX(TagShipping!K:K,...`のような数式が入る |
| 7 | TagShippingのI列変更 | W列（利益率）の値が即座に変わる |
| 8 | TagShippingのH列に「Video Games（$20）」設定 | O列（想定関税閾値）に`20`が表示される |
| 9 | 上記の状態でAG列確認 | DDU調整価格が閾値$20で計算されている |
| 10 | 全トグルOFF→式の再出力 | V列が`=$F$1`、W列が`=$H$2`、R列に`$F$2`参照（従来動作） |

---

## ■ 前回のセッションでやったこと（2026-04-02〜04-03）

### フェーズ1: TagShippingシート構造変更
- Config.gs: HEADERS 14項目に拡張、TAG_LIST_START_COL: 17
- G-N列（8設定項目）+ O列（想定関税閾値）追加
- ドロップダウン設定（applyTagShippingValidations_関数）
- 参照リストをI-J列→Q-R列に移動

### フェーズ2: 初期設定UI
- SetupDialog.txtにタグ自動判定セクション追加
- 個別トグル11項目（翻訳・出品 / 価格・手数料 / 配送）
- マスタースイッチは**廃止**（個別トグルのみで制御）

### フェーズ3: 計算ロジック
- 全列をINDEX/MATCH数式方式に統一
- applyCalculationFormulas（コード_Part3）とapplyCalculationBatch_（コード_Part1）の両方に対応
- applyUnifiedSettingsBatch_（コード_Part4）にテンプレート・ポリシーのタグ対応
- AP3（想定関税閾値）をTagShipping O列から連動

### フェーズ4: 一元管理化（2026-04-03）
- プロンプトセクションの「自動選択」チェックボックスを削除 → tagOverridePromptに一元管理
- 送料セクションの「タグ別送料」ラジオボタンを削除 → tagOverrideShippingに一元管理
- 保存ロジック: tagOverridePrompt → AS3セルに'自動選択'/'手動'書き込み、tagOverrideShipping → SHIPPING_CALC_METHOD上書き
- TAG_SHIPPING保存時のTABLEフォールバック追加
- Claude + GPTレビュー実施済み

#### 数式パターン（全列共通）:
```
タグ判定ON:  =IFERROR(VALUE(SUBSTITUTE(INDEX(TagShipping!K:K,MATCH(D5,TagShipping!A:A,0)),"%",""))/100,$F$1)
タグ判定OFF: =$F$1
```

#### 対応した全列:
| 列 | 用途 | TagShipping参照列 | フォールバック |
|---|---|---|---|
| V | 手数料率 | K列 | $F$1 |
| W | 利益率 | I列 | $H$2 |
| R・U | 広告費率 | J列 | $F$2 |
| E | テンプレート | G列 | $O$2 |
| O（ポリシー） | 送料上限カテゴリ | H列 | $O$1 |
| X | 配送方法 | L/M/N列 | $AQ$2/$AQ$3/$AJ$4 |
| T | 送料 | TAG_SHIPPING強制 | 設定の送料計算方法 |
| O・AG | 想定関税閾値 | O列（H列から自動抽出） | $AP$3 |

---

## ■ 重要な設計ルール

### UserSheet/Main.gsのラッパーパターン
- ユーザーのスプレッドシートはライブラリ「BulkToolsLib」を参照
- メニューから呼ぶ関数にはMain.gsにラッパーが必要
  - 例: `function initialSetup() { LIB.initialSetup(); }`
- **新メニュー項目を追加するとMain.gsにもラッパーが必要** → 既存ユーザーのGASを更新しないと動かない
- 対策: 全ての設定は初期設定（initialSetup）から呼ぶ。新メニュー項目は追加しない
- 関連ファイル: `UserSheet/Main.gs`（ラッパー一覧）

### TagShippingシートの構造
| 列 | 内容 | 備考 |
|---|---|---|
| A | タグ名 | |
| B-D | EP/CE/CF送料 | 数値 |
| E | 参考eBay ID | |
| F | SKU略称 | |
| G | テンプレート名 | ドロップダウン（Policy_Masterから） |
| H | 送料上限カテゴリ | ドロップダウン（6件固定） |
| I | 利益率 | ドロップダウン（0%-45%） |
| J | 広告費率 | ドロップダウン（0%-15%） |
| K | 手数料率 | ドロップダウン（13%-25%） |
| L | 低価格配送 | ドロップダウン（EP/CE/NONE） |
| M | 高価格配送 | ドロップダウン（CF/CD/EL） |
| N | 送料切替基準 | 数値（円） |
| O | 想定関税閾値 | H列からREGEXEXTRACTで自動抽出。ユーザーが可視化して確認用 |
| P | 空き | |
| Q-R | 参照リスト | タグ名/翻訳プロンプト（自動生成） |

### マスタースイッチは廃止済み + 一元管理化
- tagOverrideEnabled（DocumentProperties: TAG_OVERRIDE_ENABLED）は削除済み
- buildTagOverrideMap_（Utils.gs）は個別トグルのOR判定でマップ構築を決定
- 全トグルOFFなら従来動作
- **プロンプト自動選択チェックボックス（autoPromptSelect）は削除済み** → tagOverridePromptで一元管理
- **送料「タグ別送料」ラジオ（TAG_SHIPPING）は削除済み** → tagOverrideShippingで一元管理
- 保存時: tagOverridePrompt=true → AS3='自動選択'、tagOverrideShipping=true → SHIPPING_CALC_METHOD='TAG_SHIPPING'
- AUTO_PROMPT_SELECTのDocumentProperties保存は廃止（AS3セルが唯一の参照元）

### 値埋め込み禁止の理由
前回セッションで値埋め込み（adRateStr等）で実装し、TagShippingの値を変えても反映されない問題が発生。INDEX/MATCH数式方式に全面書き換えた。**同じ失敗を繰り返さないこと。**

関連する過去の失敗:
- コード_Part1 applyCalculationBatch_: V列・W列にsetValuesで値書き込み → setFormulasでINDEX/MATCH数式に修正
- コード_Part3 applyCalculationFormulas: R列・U列にadRateStr埋め込み → adRateRefのINDEX/MATCH式に修正
- tsName変数の定義位置ミス（R列処理より後に定義 → R列処理前に移動）

---

## ■ 前回のルール違反（具体的に）

| 違反 | 具体的な場所・行為 |
|------|-------------------|
| Codex委託せず自分で書いた | コード_Part3のEdit（V列・W列・X列修正）、Main.gsへのラッパー追加 |
| レビュー省略 | I-J列ヘッダーブランク修正、メニュー削除、セクション展開バグ修正でレビューなしコミット |
| applyCalculationFormulas未対応 | applyCalculationBatch_のみ修正し、式の再出力が動かなかった |
| 値埋め込み | V列・W列をsetValues、R列・U列にadRateStr静的埋込 |
| tsName未定義のまま数式生成 | コード_Part3の3913行でtsNameを使用、定義は4074行 |
| AP3連動見落とし | プリセットの設定内容を確認せずに実装 |
| ユーザーに質問して確認させた | 自分でコードを調べればわかることをユーザーに聞いた |

---

## ■ 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| Geminiレビュー | シェルエスケープ問題あり。$や特殊文字を含む長文を渡すと失敗する。短い質問のみ可能 |
| HtmlTemplates更新 | `cd ~/Desktop/ツール開発/一括シートApps_v3 && python3 Library/convert_html_to_gs.py` |
| clasp push | `cd ~/Desktop/ツール開発/一括シートApps_v3/Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
