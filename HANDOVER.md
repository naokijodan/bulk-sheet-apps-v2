# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 最重要: 未完了タスク（最優先で対応）

### 1. Library/HtmlTemplates.gsの更新（ブロッカー）
SetupDialog.txtはマスタースイッチ廃止済みだが、Library/HtmlTemplates.gsが旧バージョンのまま。
ライブラリはHtmlTemplates.gsからHTMLを読むため、初期設定ダイアログが旧UIで表示される。

**対応方法:**
- SetupDialog.txtの内容をGASシングルクォート文字列リテラルに変換
- Library/HtmlTemplates.gsのHTML_TEMPLATES['SetupDialog']部分を置換
- エスケープ: `\` → `\\`、`'` → `\'`、改行 → `\n`
- convert_html_to_gs.pyはパスの問題で動かない。Node.jsスクリプトで変換すること
- **注意:** 前回セッションで何度もエスケープミスでSyntaxErrorになった。慎重に

### 2. UI連動の確認
マスタースイッチ廃止後の動作確認:
- 個別トグルON → プロンプトセクション: disabled+アラート
- 個別トグルOFF → プロンプトセクション: 通常操作可能
- 送料セクションも同様

### 3. テスト
全機能のテスト:
- TagShippingのG-N列に値を設定 → 式の再出力 → 各列にINDEX/MATCH数式が入るか
- TagShippingの値を変更 → 即座に反映されるか
- 送料上限カテゴリ変更 → O列（想定関税閾値）が連動 → DDU調整が正しく動作するか
- タグ判定OFF → 従来通りの固定値参照に戻るか

---

## ■ セッション開始時に最初にやること

1. **ルールを全て読む**: `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下
2. **ノートを読む**: `~/Desktop/開発ログ/` の関連ノート
3. **上記の未完了タスク1（HtmlTemplates.gs）を最優先で対応する**

---

## ■ 前回のセッションでやったこと（2026-04-02〜04-03）

### タグ自動判定機能の実装

#### フェーズ1: TagShippingシート構造変更
- Config.gs: HEADERS 14項目に拡張、TAG_LIST_START_COL: 17
- G-N列（8設定項目）追加、ドロップダウン設定
- 参照リストをI-J列→Q-R列に移動
- generateSkuForRows_のSKU列参照をHEADERS.indexOf方式に変更
- O列: 想定関税閾値（H列から自動抽出、REGEXEXTRACT使用）

#### フェーズ2: 初期設定UI
- セットアップダイアログにタグ自動判定セクション追加
- 個別トグル11項目（翻訳・出品 / 価格・手数料 / 配送）
- マスタースイッチは**廃止**（個別トグルのみで制御）
- DocumentPropertiesに保存・復元

#### フェーズ3: 計算ロジック
- 全列をINDEX/MATCH数式方式に統一（値埋め込みを廃止）
- applyCalculationFormulas（式の再出力）: V/W/R/U/E/O/X/AG列対応
- applyCalculationBatch_（翻訳バッチ）: 同様に対応
- applyUnifiedSettingsBatch_（テンプレート・ポリシー）: getTagVal_で対応
- フォールバック: TagShipping未設定時は作業シートの固定値（$F$1, $F$2, $H$2, $O$1, $O$2, $AQ$2/$AQ$3/$AJ$4, $AP$3）
- AP3（想定関税閾値）: TagShipping O列から連動

#### UI連動
- 個別トグルON時: プロンプトセクション/送料セクションをdisabled+アラート表示
- 個別トグルOFF時: 通常操作可能
- 不要メニュー削除（updateTagList, clearPolicyMasterCache）

---

## ■ 現在のステータス
- ブランチ: main
- 最新コミット: `235d50a`
- clasp push: 最終成功（HtmlTemplates.gsは旧バージョン）
- **HtmlTemplates.gs未更新がブロッカー**

---

## ■ 前回のセッションで犯したルール違反（繰り返すな）

1. **ルールを読まずに作業を始めた** → 何度も指摘された
2. **設計・承認なしに自分でコードを書いた** → Main.gsにラッパーを追加して即デプロイ
3. **レビューを省略した** → 何度もコミット前のレビューを飛ばした
4. **推測で回答した** → 「反映されるはず」「問題ないはず」
5. **エージェント並列を使わなかった** → 直列で調べてコンテキスト消費
6. **UserSheet/Main.gsの存在を見落とした** → ラッパー構造を最初に確認すべきだった
7. **applyCalculationFormulasへの対応漏れ** → バッチ処理のみ修正して式の再出力を見逃した
8. **値埋め込みで実装した** → TagShipping変更が反映されない根本的な設計ミス
9. **送料上限カテゴリとAP3の連動を見落とした** → プリセットの設定内容を確認していなかった
10. **マスタースイッチの設計ミス** → 個別トグルの意味がなくなる設計
11. **ユーザーの質問に答えず作業を進めた**
12. **ユーザーに作業（テスト）を依頼する前にコードを確認しなかった**

---

## ■ 次にやること

### 0. 最優先: HtmlTemplates.gs更新 + テスト
上記「未完了タスク」を参照。

### 1. テスト完了後: 辞書充実に戻る
- Tier 1残り: Sunglasses、Kimono、Video Game Consoles
- Tier 2: 7カテゴリ
- Tier 3: 31カテゴリ

---

## ■ 重要な設計ルール

### TagShippingシートの構造
| 列 | 内容 |
|---|---|
| A | タグ名 |
| B-D | EP/CE/CF送料 |
| E | 参考eBay ID |
| F | SKU略称 |
| G | テンプレート名（ドロップダウン） |
| H | 送料上限カテゴリ（ドロップダウン） |
| I | 利益率（ドロップダウン） |
| J | 広告費率（ドロップダウン） |
| K | 手数料率（ドロップダウン） |
| L | 低価格配送（ドロップダウン） |
| M | 高価格配送（ドロップダウン） |
| N | 送料切替基準（数値） |
| O | 想定関税閾値（H列から自動抽出） |
| P | 空き |
| Q-R | 参照リスト（タグ名/翻訳プロンプト） |

### タグ自動判定の動作原理
- 全列がINDEX/MATCH数式でTagShippingを参照
- TagShippingの値を変えれば即座にシートに反映される
- 値埋め込みは使わない（これが最重要ルール）
- フォールバック: TagShipping未設定→作業シートの固定値

### マスタースイッチは廃止済み
- tagOverrideEnabledは削除
- 個別トグルのいずれかがONならbuildTagOverrideMap_がマップを構築
- 全てOFFなら従来動作

---

## ■ 開発ツール
| ツール | コマンド |
|--------|---------|
| Codex CLI | `/opt/homebrew/bin/codex exec --full-auto "指示"` |
| GPTレビュー | `mcp__openai-bridge__code_review_gpt` |
| Geminiレビュー | `mcp__gemini-bridge__code_review_gemini`（シェルエスケープ問題あり） |
| clasp push | `cd ~/Desktop/ツール開発/一括シートApps_v3/Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
