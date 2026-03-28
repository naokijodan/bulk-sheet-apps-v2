# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## 前回のセッションでやったこと

### テーマ1: プロンプトの充実（設計・基盤整備）

#### A. プロンプト管理フォルダの一元化（commit bad5e68）
- `prompts/`フォルダを新設、全プロンプトをプロンプトID名で統一管理
- 旧`プロンプト例/`フォルダから移行＋旧フォルダ削除
- `convert_prompts_to_gs.py`のFILE_TO_IDを11個→18個に拡張、参照先を`prompts/`に変更
- スニーカー・ドレスシューズのプロンプトをユーザーが貼り付け済み

#### B. PROMPT_TAG_MAPPING拡張（commit a094e93）
3者協議（Claude/GPT/Gemini）を2回実施し、49の未割り当てカテゴリの振り分けを決定。

**既存プロンプトへのタグ追加:**
- 時計用: + Watch Parts系タグ（時計パーツ,ウォッチパーツ,時計部品）
- ジュエリー: + カフリンクス,カフスボタン,チャーム,ペンダントトップ
- アパレル・ブランド品: バッグ・財布を削除し、帽子・スカーフ・ベルト・ネクタイ等のFashion小物を統合
- リール→釣り具: 釣竿・ロッド追加、プロンプトファイル`釣り具.txt`作成済み（リールのコピー）
- フィギュア: + ドール,ぬいぐるみ,アニメ,アニメグッズ
- レザーグッズ: 新規プロンプト枠（バッグ,財布,キーケース等）、`レザーグッズ.txt`は空ファイル

#### C. 新規プロンプト17個の設計確定（3者協議で合意）

| # | プロンプト名 | カテゴリ | 優先度 |
|---|------------|---------|--------|
| 1 | レザーグッズ | Wallets, Handbags, キーケース等 | Tier 1 |
| 2 | オーディオ・家電 | Electronics | Tier 1 |
| 3 | 楽器 | Musical Instruments | Tier 1 |
| 4 | RC・模型 | RC & Models | Tier 1 |
| 5 | レコード | Records | Tier 1 |
| 6 | 釣竿 | Fishing Rods | Tier 1 |
| 7 | ルアー | Lures | Tier 1 |
| 8 | サングラス | Sunglasses | Tier 2 |
| 9 | 万年筆・筆記具 | Pens | Tier 2 |
| 10 | テニス | Tennis | Tier 2 |
| 11 | 野球 | Baseball | Tier 2 |
| 12 | スポーツウェア | ユニフォーム,ゴルフ手袋,サンバイザー等 | Tier 2 |
| 13 | 着物 | Kimono | Tier 2 |
| 14 | 日本刀 | Japanese Swords | Tier 2 |
| 15 | 日本伝統・骨董 | Tea Ceremony, Tetsubin, Pottery, Buddhist Art | Tier 2 |
| 16 | アート | Art, Prints | Tier 2 |
| 17 | パイプ・喫煙具 | Pipes | Tier 3 |
| 18 | テーブルウェア | Dinnerware, Glassware, Flatware, 包丁 | Tier 3 |
| 19 | 和楽器 | Japanese Instruments | Tier 3 |

**注意: 釣り系は3プロンプト体制（リール既存 + 釣竿・ルアー新規）。主戦場のため専門性を高く保つ。**

**汎用で対応:** Snow Globes, Boxes, Combs, Key Chains, Soap, Baby, Stamps, Coins, Collectibles
**除外（空輸不可）:** Bonsai, Lighters

## 現在のステータス
- ブランチ: main / 最新コミット: 8f0840e / git push済み / clasp push済み
- プロンプトファイル: 20個（prompts/フォルダ内。うちレザーグッズは空）
- PromptTemplates.gs: 19個登録済み（リール + 釣り具の両方を含む）

## 次にやること（優先順位順）

### 1. 新規プロンプト17個の生成（Tier 1から順に）

**進め方:**
1. 既存プロンプト（時計V10、ジュエリーv4、ポケカV9等）の共通構造を抽出して雛形を作る
2. Geminiに各カテゴリの専門用語・翻訳ルール・Item Specificsをリサーチさせる
3. 雛形 × カテゴリ辞書でプロンプトを生成
4. `prompts/`にファイル作成 → `convert_prompts_to_gs.py`のFILE_TO_IDに追加 → 変換 → clasp push
5. PROMPT_TAG_MAPPINGに新プロンプトのタグを追加

**Tier 1（最優先）:** オーディオ・家電、楽器、RC・模型、レコード、レザーグッズ
**Tier 2:** サングラス、万年筆、テニス、野球、スポーツウェア、着物、日本刀、日本伝統・骨董、アート
**Tier 3:** パイプ・喫煙具、テーブルウェア、和楽器

### 2. 釣り系プロンプト（釣竿・ルアー）の生成
- リールは既存プロンプトで対応済み
- 釣竿・ルアーは空ファイル作成済み、中身の生成が必要
- 釣りは主戦場のため3プロンプト体制で専門性を保つ

### 3. タグ別送料の運用・拡張（テーマ2-b、前回から継続）

## 関連ファイル
- プロンプト: `prompts/*.txt`
- 変換スクリプト: `Library/convert_prompts_to_gs.py`（FILE_TO_IDにマッピング追加が必要）
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
