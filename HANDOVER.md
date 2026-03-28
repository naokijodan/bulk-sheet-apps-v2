# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## 前回のセッションでやったこと

### Tier 1 新規プロンプト7個の生成（commit faeccb7）

Geminiにカテゴリ別の専門知識（ブランド、用語、不良表現、eBayカテゴリ）をリサーチさせ、既存プロンプトの共通構造をベースに7個の新規プロンプトを生成した。

| # | プロンプト名 | サイズ | 主な特徴 |
|---|------------|--------|----------|
| 1 | レザーグッズ | 10,935B | LV/Chanel/Hermes等25+ブランド、素材NO FALSE CLAIMS、ボディバッグ→Sling Bag |
| 2 | オーディオ・家電 | 8,251B | オーディオ+家電、100V電圧警告ルール |
| 3 | 楽器 | 8,471B | ギター/シンセ/管楽器/打楽器、Japan Vintage/MIJ検出 |
| 4 | RC・模型 | 8,104B | RCカー/プラモデル/鉄道模型、BUILD STATUS/SCALE検出 |
| 5 | レコード | 7,086B | 帯付き(With Obi)、City Pop、初回プレス、日本盤用語 |
| 6 | 釣竿 | 8,395B | ロッドタイプ20+種、スペック用語、モデル番号エンコード |
| 7 | 釣具汎用 | 8,310B | ルアー(ハード/ソフト)、タックル、ライン、Japanese Lure Premium |

- FILE_TO_IDに7エントリ追加 → convert_prompts_to_gs.pyで再生成
- Claude+Gemini 2者レビュー: 全項目PASS

## 現在のステータス
- ブランチ: main / 最新コミット: faeccb7 / git push済み
- プロンプトファイル: 25個（prompts/フォルダ内）
- PromptTemplates.gs: 25個登録済み（177,568 bytes）
- clasp pushはまだ未実施（次回セッションで実施）

## 次にやること（優先順位順）

### 1. clasp push
- PromptTemplates.gsの変更をGASに反映する
- clasp push前にScriptPropertiesチェック必須

### 2. PROMPT_TAG_MAPPINGへの新規プロンプト追加
- Config.gsのPROMPT_TAG_MAPPINGに新規7プロンプトのタグ設定を追加する
- 前回セッションでタグの振り分けは3者協議で決定済み（HANDOVER旧版参照）

### 3. Tier 2 プロンプト生成（10個）
| # | プロンプト名 | カテゴリ |
|---|------------|---------|
| 8 | サングラス | Sunglasses |
| 9 | 万年筆・筆記具 | Pens |
| 10 | テニス | Tennis |
| 11 | 野球 | Baseball |
| 12 | スポーツウェア | ユニフォーム,ゴルフ手袋,サンバイザー等 |
| 13 | 着物 | Kimono |
| 14 | 日本刀 | Japanese Swords |
| 15 | 日本伝統・骨董 | Tea Ceremony, Tetsubin, Pottery, Buddhist Art |
| 16 | アート | Art, Prints |
| 17 | パイプ・喫煙具 | Pipes |

### 4. Tier 3 プロンプト生成（2個）
| # | プロンプト名 | カテゴリ |
|---|------------|---------|
| 18 | テーブルウェア | Dinnerware, Glassware, Flatware, 包丁 |
| 19 | 和楽器 | Japanese Instruments |

### 5. タグ別送料の運用・拡張（テーマ2-b、前回から継続）

## 関連ファイル
- プロンプト: `prompts/*.txt`（25ファイル）
- 変換スクリプト: `Library/convert_prompts_to_gs.py`（FILE_TO_IDに25マッピング）
- PromptTemplates.gs: `Library/PromptTemplates.gs`
- PROMPT_TAG_MAPPING: `Config.gs` L213 / `Library/Config.gs` L213
- IS_CATEGORY_FIELDS: `Library/Config_IS.gs` L3031-3096
- IS_TAG_TO_CATEGORY: `Library/Config_IS.gs` L2789-3027

## 共通の注意事項
- コーディングはCodex CLIに委託する（L1-1）
- Claude+Geminiの2者レビュー必須（E-02）
- Library同期必須、ScriptProperties使用禁止
- clasp push前にScriptPropertiesチェック必須
- HtmlTemplates.gsの再生成はconvert_html_to_gs.pyで実行
- PromptTemplates.gsの再生成はconvert_prompts_to_gs.pyで実行
- 送料モードの追加・変更はbuildShippingFormulas_()（Utils.gs）を修正すること（SSOT）
- 既存プロンプトは試行錯誤の結晶。構造は壊さないこと
- プロンプトが壊れると翻訳がストップ → 作業が行われない

## 設計書
- `docs/shipping-mode-refactor-plan.md` — 送料モード共通関数化の設計書（3者協議の記録含む）
