# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## 前回のセッションでやったこと

### A. 翻訳プロンプト自動選択機能（完了）
- Config.gs: `PROMPT_TAG_MAPPING` テーブル定義（15カテゴリ・35タグ）
- Translation.gs: AS3セルから自動選択モード読み取り → GPT_PromptsシートE列からタグ→promptIDマップ構築 → 行ごとにpromptId判定
- AI.gs: `item.promptId || settings.promptId` でフォールバック対応
- コード_Part3: `writePromptTagMapping_()` でGPT_PromptsシートE列に可視化用書き込み
- コード_Part3: AS3ドロップダウン（手動/自動選択）+ DocumentProperties保存
- コード_Part1: `tmpl.currentAutoPromptSelect` でダイアログ状態復元
- SetupDialog.txt: プロンプト設定セクション内にチェックボックスUI追加
- AU列に使用プロンプトIDを記録（検証用） — JP_TITLE_BACKUP残骸を除去

### B. プロンプト自動同期機能（完了）
- `Library/convert_prompts_to_gs.py`: .txtからPromptTemplates.gsへの変換スクリプト（厳格検証付き）
- `Library/PromptTemplates.gs`: 11個のプロンプトテンプレート格納（78KB）
- `syncPromptsToSheet_()`: GPT_Promptsシートへの自動反映（F列バージョン整数比較、バックアップ自動生成）
- SetupDialog.txt: 「新しいプロンプトを追加」「既存プロンプトを最新版に更新」チェックボックス追加
- バックアップ失敗時は更新を中断する安全設計

### レビューで採用したGemini指摘
- ダイアログ再開時の状態復元（tmpl.currentAutoPromptSelect）
- タグ重複検知ログ（Translation.gs）
- バックアップ失敗時の更新中断（syncPromptsToSheet_）
- addNew後のflush()追加（syncPromptsToSheet_）

## 現在のステータス
- ブランチ: main / 最新コミット: ad4b6ff / git push済み / clasp push済み

## 次にやること（2つの独立した開発テーマ）

開始時に「プロンプトの充実」か「タグ別送料管理」のどちらかを指定する。

---

### テーマ1: プロンプトの充実

#### 概要
既存プロンプト（11個）の構造を分析し、「構造テンプレート×カテゴリ辞書」方式で新カテゴリ用プロンプトを効率的に設計・追加する。

#### 進め方
1. 既存プロンプト（時計V10、ポケカV9等）の構造をGeminiに分析させる
2. 共通パターンと差分を把握 → テンプレート型を7種類程度に分類
3. IS_CATEGORY_FIELDSの辞書情報を活用して新カテゴリのプロンプトを生成
4. convert_prompts_to_gs.pyでPromptTemplates.gsに変換 → clasp push

#### テンプレート型の見込み（3者協議で合意済みの方向性）
| テンプレート型 | 該当カテゴリ例 |
|--------------|-------------|
| 機械・精密機器型 | Watches, Cameras, Fishing Reels |
| トレカ・グレード型 | Trading Cards各種 |
| ファッション・ブランド型 | Handbags, Clothing, Shoes, Hats |
| ジュエリー・貴金属型 | Rings, Necklaces, Bracelets |
| スポーツ用品型 | Golf, Tennis, Baseball |
| コレクティブル・ホビー型 | Figures, Anime, Dolls |
| 日本文化・美術型 | Kimono, Japanese Swords, Tea Ceremony |
| 小物・雑貨型 | Pens, Lighters, Flatware等 |

#### 注意事項
- 既存プロンプトは試行錯誤の結晶。構造は繊細。壊さないこと
- 既存プロンプトはそのまま使う。新しいものを追加する方向
- プロンプトが壊れると翻訳がストップ → タイムオーバー → 作業が行われない
- .txtファイルの1行目に `// VERSION: N` を追加してバージョン管理

#### 関連ファイル
- プロンプト: `~/Desktop/ツール開発/プロンプト編集/*.txt`
- 変換スクリプト: `Library/convert_prompts_to_gs.py`（FILE_TO_IDにマッピング追加）
- IS_CATEGORY_FIELDS: `Library/Config_IS.gs` L3031-3096
- IS_TAG_TO_CATEGORY: `Library/Config_IS.gs` L2789-2845

---

### テーマ2: タグ別送料管理 + 参考eBay ID自動セット

#### 概要
D列タグから送料と参考eBay IDを自動でセットする機能。タグごとに3パターンの固定送料を定義し、手作業を解消する。

#### テーブル構造（ユーザーが定義）
| タグ | ep | CE | CF,CD | 参考eBay ID |
|------|-----|------|-------|------------|
| フィギュア単体 | 1800 | 2000 | 3000 | 既存出品のID |
| フィギュアまとめ | 3000 | 5000 | 6000 | 既存出品のID |
| 時計 | 1200 | 1800 | 3000 | 既存出品のID |
| 時計箱入り | 2000 | 2500 | 4000 | 既存出品のID |

#### 現状の課題
- 同じカテゴリでも梱包サイズが違う（単体 vs まとめ売り、時計 vs 箱入り）
- 今はシートを分けるか手動で送料を変更して対応
- 参考eBay ID（F列）も毎回手作業で貼り付けている

#### 実現したいこと
- タグごとにep/CE/CF,CDの3パターンの固定送料を定義
- D列タグから自動判定して送料を適用
- 同じテーブルで参考eBay IDも管理し、F列に自動セット
- ユーザーが自由にタグと送料の組み合わせを追加できる

#### 設計の検討ポイント（3者協議推奨）
- テーブルの保存先: スプレッドシートの専用シート？ DocumentProperties？
- 既存の送料計算（テーブル計算/固定金額/ゲーム・トレカ）との共存方法
- 送料適用のタイミング: 翻訳時？ 初期設定時？ 価格計算時？
- CONFIG.COLUMNS.REF_EBAY (F列=6) への自動書き込み

#### 関連ファイル
- Config.gs: CONFIG.COLUMNS（列定義）、CONFIG.SHIPPING_METHODS等
- Shipping.gs: 送料計算ロジック
- Translation.gs: D列タグの読み取り（自動選択機能で実装済み）
- コード_Part1: 価格計算・バッチ処理

---

## 共通の注意事項
- コーディングはCodex CLIに委託する（L1-1）
- Claude+Geminiの2者レビュー必須（E-02）
- Library同期必須、ScriptProperties使用禁止
- clasp push前にScriptPropertiesチェック必須
- HtmlTemplates.gsの再生成はconvert_html_to_gs.pyで実行
- PromptTemplates.gsの再生成はconvert_prompts_to_gs.pyで実行

## その他の残タスク
- トレカのE2Eテスト
- ゴルフプロンプトV1のテスト・調整
- ゲーム用プロンプトの作成（ゲーム機プロンプトは既存。ゲームソフト用が未作成）
- スニーカー/ドレスシューズ/フィギュアのプロンプト作成
