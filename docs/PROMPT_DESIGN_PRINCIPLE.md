# 一括シートV3 プロンプト設計 統一基準書 v1.1

**この文書はプロジェクトの根源原則です。**
**過去の設計書・Sprint Contract・HANDOVER 内記述よりも上位に置きます。**
**矛盾する場合は本書を採用してください。**

---

## 0. 目的（What & Why）

### システムの最終目的
椛島さんが eBay / Joom で日本商品を海外バイヤーに販売する **ビジネスの売上最大化** と **アカウント保護**。

椛島さんの収入と eBay アカウント停止リスクを天秤にかけ、両方を守る出品データを生成すること。それ以外は手段。

### 本書の目的
プロンプト設計の **判断基準（なぜそうするか）** を一元化し、改修者（人間・AI）が過去の数値に縛られて退化することを防ぐ。

---

## 1. eBay の外的制約（変えられない事実）

| 項目 | Fact | 根拠 |
|---|---|---|
| TITLE 上限 | **80 文字**（システムが受け付ける最大文字数）| eBay 仕様 |
| 81 文字以上 | 登録不可 / 切り捨て | eBay 仕様 |
| ItemSpecifics | カテゴリごとに eBay が定めるフィールド | eBay カテゴリ仕様 |
| VeRO 違反 | 商標権者の通報により即アカウント停止 | eBay VeRO プログラム |

これらは椛島さんが選んだ数値ではなく、**eBay 側が決めた制約**。我々は受け入れる以外にない。

---

## 2. ビジネスの根源原則（TRUTH × SEO のトレードオフ）

### 2.1 売上を最大化する条件
- 商品が **見つかる** こと（= eBay 検索結果に表示される）
- そのためには TITLE のキーワード密度を最大化する（= 80 文字を**使い切る**）
- 多様な検索クエリ（ブランド名 / モデル / 素材 / 年代 / 言語 / コラボ等）にヒットさせる

**80 文字を使い切らない出品 = 競合に対する不戦敗**

### 2.2 アカウントを守る条件
- 出品情報が**ソースの事実から逸脱しない**（TRUTH FIRST）
- VeRO 抵触語（AUTHENTIC / OFFICIAL）を絶対に書かない
- 捏造（RARE / LIMITED / VINTAGE をソース根拠なしに追加）が起きない

**捏造 = 返品 / 低評価 / アカウント停止リスク**

### 2.3 構造的トレードオフ
- 「文字数を増やせ」と命令 → AI は埋めるために捏造する
- 「捏造するな」と命令 → AI は安全側に倒れて短く書く
- このトレードオフを解くのが **本システムの設計目的**

### 2.4 解決策
**AI に「正当に書ける情報源（弾薬）」を大量に提供する。**

弾薬が豊富 = 捏造せずに 80 文字を埋められる。
弾薬が貧弱 = 捏造に走る。

これがカテゴリ特化プロンプト（3点セット）の存在理由。

---

## 3. 3点セットの正確な役割

### A. 翻訳プロンプト（prompts/*.txt + Library/PromptTemplates.gs）
- AI への指示書 + 弾薬庫
- **役割**: ルール（GOALS/Rule/VERIFICATION）+ カテゴリ固有情報源（DICTIONARY/MAPPING）を AI に渡す
- ファイル: `prompts/{カテゴリ}.txt`、`Library/PromptTemplates.gs`（同期、HEAD で椛島さん即反映）

### B. 交通整理（Sanitize.gs / Library/Sanitize.gs）
- ソース（日本語）の正規化レイヤー
- **役割**: 商品ソースから事実を抽出し、AI 翻訳前にカテゴリ固有辞書を**動的注入**
- 仕組み: `Sanitize.gs:1796-1800` の `${pokemonCharDict}` 等プレースホルダー → `Sanitize.gs:2101` の `prompt.replace` で実辞書注入 → AI へ
- 既存の動的辞書: `pokemonCharDict / yugiohCharDict / dragonballCharDict / onePieceCharDict / digimonCharDict`

### C. ItemSpecifics（Library/Config_IS.gs）
- eBay ItemSpecifics 出力の構造定義
- **役割**: AI 出力から eBay 構造化データを生成
- ファイル: `Library/Config_IS.gs` の `IS_INITIAL_DATA / IS_TAG_TO_CATEGORY / IS_CATEGORY_FIELDS / SANITIZE_FIELDS_`

### 3者の連動フロー
```
日本語ソース
   ↓
[B] Sanitize.gs が正規化 + カテゴリ固有辞書を動的注入
   ↓
AI（OpenAI GPT-5）に Sanitize 結果を渡す
   ↓
AI が交通整理結果（K列等の構造化情報）を返す
   ↓
[A] 翻訳プロンプト（prompts/*.txt）で再度 AI に翻訳依頼
   ↓
AI が TITLE / Description / ProductName / Category / Condition / EbayCategory を生成
   ↓
parseAIResponseToFields_ (AI.gs:443) が AI 出力を解析
   ↓
[C] Config_IS.gs の定義に従って ItemSpecifics 出力
```

### 重要事実: AI 出力の "ItemSpecifics:" ブロックは IS に流れない
- `AI.gs:parseAIResponseToFields_` が読むのは title / description / productName / category / condition / ebayCategory のみ
- IS の値は CardPatterns_MASTER 等が title / description から **独立計算** する
- 出典: 2026-04-25 V2.0.1 整合性検証で確認済み（HANDOVER.md 旧記述）
- **示唆**: AI に「ItemSpecifics ブロックを書け」と指示することは無駄。IS 用キーワードは **TITLE / Description に埋め込ませる** のが正しい

---

## 4. TITLE 設計の根源基準

### 4.1 プロンプトに書く「数値」は 80 のみ
- 80 = eBay システム制限（Fact）
- 68, 75, 40 等の数値は **絶対に書かない**
- 理由: 数値を書くと AI がそこに引っ張られる。「68-75」と書けば AI は 70 文字で止まる。「40-80」と書けば AI は 40 で OK と判断する。
- 「target」表記も書かない（同上の理由）

### 4.2 TITLE セクションの正しい記述
プロンプトに書くのは **数値ではなく理由**:

```text
TITLE
- HARD LIMIT: 80 chars maximum. eBay rejects titles exceeding 80 chars.
- GOAL: Maximize SEO discoverability by packing every source-derived
  fact (brand, model, material, year, edition, color, collaboration,
  language, accessories, condition-related attributes) within the
  80-char budget. Unused characters = lost search visibility.
- TRUTH BOUND: Only include facts derivable from source.
  Fabricated keywords (RARE / LIMITED / VINTAGE / AUTHENTIC / OFFICIAL
  without source confirmation) violate Rule 2 and risk eBay VeRO
  account suspension.
- Shorter title is acceptable when source provides limited information.
  Lying is worse than being short.
- Front-load the highest-value keywords (brand, product type, model)
  within the first 30 chars.
```

### 4.3 数値固定（68-75 等）が引き起こす退化
- AI は数値を見つけるとそこに最適化する
- 改修者（人間・AI）が「他カテゴリで違う数値」と気付いて統一しようとする
- → 80 を使い切る動機が消えて SEO 機会損失
- → 売上損失

**禁止表記の例**（過去のプロンプトに残存している退化記述）:
- `Title 68-75 chars`
- `target 68-75`
- `40-75 chars (target 68-75)`
- `40-80 chars (target 68-75)`
- `SOFT CHAR TARGET`
- `If under 68, add SEO keywords`
- `If over 75, shorten`

これらはすべて 4.2 の「理由ベース記述」に置換する。

### 4.4 ALLOWED SYMBOLS（タイトル許容記号）

#### 4.4.1 確定ルール（共通許容）
TITLE で **共通許容する記号** は次のとおり:

```
ALLOWED SYMBOLS: & / : - . ,
```

**カテゴリ固有の追加（条件付き許容、共通許容ではない）**:
- `#` — カード番号やハッシュタグ表記が必要なカテゴリ（TCG / ベースボール / 大相撲 / 遊戯王 / ボードゲーム 等）でのみ追加可
- `'` — ブランド名・商品名・所有格（apostrophe）に含まれる場合のみ（Men's / Kohl's / Levi's 等）。装飾としての single quote は禁止
- `+` — モデル名・グレード表記に公式に含まれる場合のみ（iPhone 15 Plus / Galaxy S24+ / A+ Grade 等）。乱用禁止

#### 4.4.2 FORBIDDEN SYMBOLS（明示禁止）

```
FORBIDDEN SYMBOLS: * $ ~ ^ @ ! ? ™ ( ) [ ] { } " _ % = | \ < > ;
```

理由:
- `*` `$` `~` `^` `@` — eBay 検索エンジンが title の一部として読み込みヒンダーとなる
- `!` `?` — eBay Search Manipulation Policy 違反、スパム判定リスク
- `™` — 商標シンボル（VeRO リスク）
- `( )` `[ ]` `{ }` — eBay スパム判定で減点要因
- `"` — SEO 価値ゼロ
- `_` — eBay 検索インデックスで分割境界として扱われない
- `%` — マーケティング煽り（"100% Authentic" 等）になりやすく、AUTHENTIC 系統制と矛盾
- `=` `|` `\` `<` `>` `;` — 検索可読性を損ない、SEO 価値ゼロ

#### 4.4.3 デフォルト禁止ルール

**§4.4.1 の ALLOWED SYMBOLS およびカテゴリ固有追加リスト（`#` `'` `+`）に含まれない記号は、すべて TITLE で禁止とする。**

新しい記号を許容する必要が生じた場合は、本書 §4.4.1 を改訂してから採用すること。プロンプト個別に勝手に追加することは禁止。

#### 4.4.4 出典（Fact）

- **2026-03-16 セッション「時計プロンプトV10 改修」**: 椛島さんが eBay ルール準拠調査を実施し、`, . -` を許可記号に追加することを正式決定
  - 該当記述: 「ハイフン・ピリオド・カンマをタイトル許可記号に追加（eBayルール準拠）」
- **物理証拠（実機検証済）**: `prompts/時計用.txt` L73 に `Allowed symbols: & / : - . ,` が現存。41 カテゴリのプロンプトで同形式を採用済（実機 grep 検証）
- **eBay 公式 Listing Best Practices**（https://www.ebay.com/sellercenter/listings/listing-best-practices、2026-04-29 確認済）: 推奨タイトル例で `,` `.` 使用を確認
  - 例: "Dell Desktop Computer 16GB RAM 512GB SSD Card, Intel i5 3.4GHz QuadCore Grade A"
  - 例: "Apple iPad Air 4th Gen. 256GB WiFi, Space Gray"
- **ハイフン (-)**: 商品名・ブランド名の一部として eBay 慣行が許容（Blue-Eyes White Dragon / Coca-Cola / Red-Eyes Black Dragon 等）。固有名詞・型番保持と検索可読性のための内部運用判断
- **eBay Search Manipulation Policy**: `?` `!` の濫用は spam 判定対象として eBay が明記

#### 4.4.5 退化防止（重要）

**禁止する過去記述**（プロンプトに残存している退化記述）:
- `Allowed symbols only: & / :` （カンマ・ピリオド・ハイフンを禁止する記述）
- `Allowed symbols: & / : #` （# だけ追加してハイフン・ピリオドは禁止する記述）
- `FORBIDDEN: , . - ( ) [ ] "`
- `No commas, periods, hyphens, quotes, brackets, parentheses.`
- VERIFICATION セクション内の `no commas, no hyphens, no periods` 系の記述
- `Forbidden symbols:` リスト内の `'` （所有格に必要なため誤り）

**退化の経緯**（再発防止のため記録）:
- 2026-03-28 ポケカ.txt 初版（commit `bad5e68`）に「Allowed symbols only: & / :」が含まれていた
- 2026-03-16 椛島さんが eBay 調査で `, . -` を許可記号に追加（時計プロンプトV10）→ 41 カテゴリで採用済
- 2026-04-25 ゲーム機改修（commit `adb18f9`）で Claude が「Title 許可記号: `& / :` のみ（旧 `, . -` 削除）」と本ルールを破棄
- 以降の V2.0.1 改修が誤った変更を盲目継承し、合計 **23 カテゴリ**が間違ったルールを保持
  - 内訳: 20 カテゴリが `& / :` のみ + 3 カテゴリ（ベースボール/大相撲/遊戯王）が `& / : #` のみ
- 結果、Blue-Eyes White Dragon が「Blue Eyes White Dragon」に劣化、PSA 9.5 が「PSA 9 5」になる懸念が発生

**改修者（人間・AI）への絶対指示**:
1. 既存プロンプトの ALLOWED SYMBOLS が `& / :` のみ、または `& / : #` のみだった場合は、本書 §4.4.1 に従って `& / : - . ,`（必要に応じて `#`）に修正すること
2. 新規カテゴリ作成時は最初から本書 §4.4.1 のルールを採用すること
3. **`-` `.` `,` を削除する変更を絶対に加えてはならない**。これらはブランド名・グレード表記・商品同一性を保護する不可欠な要素である
4. **ALLOWED SYMBOLS 記号を「スペースに置換」してはならない**（例: Blue-Eyes → Blue Eyes、PSA 9.5 → PSA 9 5 は禁止）
5. 「ABSOLUTE RULES」「ポケカテンプレ」「過去の Sprint Contract」を盲目的に継承して `, . -` を削除する変更は絶対に行わないこと
6. **VERIFICATION / TITLE / GOALS セクションに「No commas」「No hyphens」「No periods」等の記述が残っていれば、E-02 レビューで即 fail とする**

---

## 5. 各カテゴリの「弾薬庫」充実方針

AI が捏造せずに 80 文字を埋めるためには、カテゴリ固有の弾薬を充実させる必要がある。

### 5.1 弾薬の種類（カテゴリ問わず共通）

| 弾薬 | 内容 | 例 |
|---|---|---|
| BRAND DICTIONARY | ブランド名標準英訳 | Canon / Nikon / Tamiya / Bandai |
| SET / SERIES / EDITION | 商品セット名・シリーズ名 | Base Set / Neo Genesis / FB01 |
| CHARACTER / ARTIST / AUTHOR | 登場人物・作者名 | Charizard / 荒木経惟 → Nobuyoshi Araki |
| FORMAT | 商品形態の標準英訳 | Hardcover / Paperback / Photo Book / Booster Pack |
| LANGUAGE VARIATIONS | 言語表記 | Japanese / English / Bilingual JP-EN / With Furigana |
| DEFECT MAPPING | 欠陥日英ペア | 日焼け→Yellowing / 折れ→Crease |
| ACCESSORY DICTIONARY | 付属品有無 | With Obi Band / No Dust Jacket / Sealed |
| ERA / YEAR MARKER | 年代表記 | Pre-1980 / Vintage / First Edition |

### 5.2 動的辞書注入が必要なカテゴリ
キャラ名・セット名・著者名の数が多い（数十～数百）場合、プロンプト本文に固定埋め込みすると肥大化する。Sanitize.gs の動的注入機構を使う。

既存: ポケカ / 遊戯王 / ワンピース / ドラゴンボール / デジモン
追加候補: ガンダム / MTG / ヴァイス / トレカ汎用 / 写真集（写真家辞書） / マンガ（シリーズ辞書）

### 5.3 改修の優先順位
1. **弾薬の充実**（カテゴリ固有辞書の拡充）← **本質**
2. TITLE セクションの「理由ベース」書き換え
3. BOOTLEG MUST 等のリスク管理セクション
4. CATEGORY RULE / DEFECT / CONDITION TERMS 等の構造的セクション

形式論（11 要素揃え）は副次的。**本質は AI に弾薬を渡すこと**。

---

## 6. プロンプト構造の標準（ABSOLUTE な要素のみ）

ABSOLUTE な要素 = どのカテゴリでも例外なく必要なもの:

| # | 要素 | 役割 |
|---|---|---|
| 1 | GOALS | 目的明示。TRUTH FIRST を含む |
| 2 | Rule 2 Category A/B/C | 語彙コントロール（A: 絶対禁止、B: ソース明示時のみ、C: 事実属性は常に可）|
| 3 | BOOTLEG MUST | カテゴリの VeRO 状況に応じた絶対禁止語 |
| 4 | TITLE セクション | 4.2 の理由ベース記述 |
| 5 | DESCRIPTION セクション | 480 文字上限、ASCII、文体 |
| 6 | カテゴリ固有 DICTIONARY | 弾薬庫（Brand / Set / Author / 等） |
| 7 | CATEGORY ROUTING | eBay カテゴリ ID 分岐 |
| 8 | DEFECT 日英ペア | 欠陥表現の正確な英訳 |
| 9 | CONDITION TERMS | カテゴリ業界に合わせた状態用語 |
| 10 | LANGUAGE VARIATIONS | 該当言語版の列挙 |
| 11 | OUTPUT FORMAT | 出力形式（Title: / Description: / ProductName: / Category:） |
| 12 | VERIFICATION | 自己チェック項目（ただし AI 自己検証は 100% でないことを認識）|

「11 要素統一」「16 項目 VERIFICATION」のような **数値固定の形式論は禁止**。カテゴリにより内容は変わる。

---

## 7. CONDITION TERMS のカテゴリ別差異（重要）

過去に「6段階 NM/LP/MP/HP/DMG 統一」と書かれた設計書があるが、**カテゴリ業界標準に合わせる**のが正解:

| カテゴリ | 業界標準 |
|---|---|
| TCG（ポケカ/遊戯王/ワンピース/ドラゴンボール/デジモン/ヴァイス/MTG/トレカ汎用/ベースボール）| New / NM / LP / MP / HP / DMG |
| 書籍・雑誌 / 古書 | New (Mint) / Like New / Very Good / Good / Acceptable / Poor |
| ファッション / アパレル系 | New with Tags / Excellent / Good / Fair / Poor |
| ゲーム機 / 家電 | New / Used (Excellent) / Used (Good) / Used (Fair) / For Parts |
| 古美術 / 伝統工芸 | カテゴリ毎に検討 |

統一を強要しない。**買い手が読む業界用語で書く**ことが SEO とコンバージョンに資する。

---

## 8. 過去の退化要因と廃止対象

### 8.1 廃止する記述（プロンプト・設計書）
- "TITLE 68-75 文字統一" — V2.0.1 全7本完遂で書かれたが、**全カテゴリ統一は誤り**
- "下限 40 の緩みを解消" — 解消ではなく source-bound 設計に整合させる
- "CONDITION TERMS 6段階 NM/LP/MP/HP/DMG 統一" — TCG 用語、書籍・ファッション・家電に押し付けるのは誤り
- "MISSING ACCESSORIES 8項目" — カテゴリにより数は変わる
- "VERIFICATION 16項目" — カテゴリにより必要項目数は変わる
- "CATEGORY RULE 7-path" — カテゴリにより必要数は変わる
- 数値固定の形式論全般

### 8.2 廃止する設計書ファイル
**削除対象**:
- 過去 Sprint Contract 13 ファイル（`~/.tmux-harness/sessions/harness-20260425-014356-1641a244/contracts/`）
- 今セッションで作った `BOOKS-V2.0.1.md`（`~/.tmux-harness/sessions/harness-20260428-002258-06e8cb5d/contracts/BOOKS-V2.0.1.md`）— 退化の例
- `docs/is-expansion-design.md`（4/11、古い IS 設計）
- `docs/shipping-mode-refactor-plan.md`（3/28、古い）

**保持する**:
- `docs/feature.json`（進捗管理）
- `docs/progress/`（進捗ディレクトリ）
- `docs/archive/`（アーカイブ、参考用）
- `HANDOVER.md`（ただし本書ベースで書き直す。古い記述削除）
- `CLAUDE.md`（プロジェクトルール）

---

## 9. 改修ワークフローの標準

### 9.1 新規 / 既存カテゴリ改修の手順
1. **C0 調査**: 既存 prompts / Sanitize / Config_IS の現状把握 + eBay カテゴリ ID + VeRO 状況
2. **弾薬調査**: カテゴリ固有の Brand / Set / Author / Format / Dialect 等の充実すべき辞書を特定
3. **設計**: 本書 §3 / §4 / §5 / §6 を基準に prompts/*.txt を再構成
4. **実装**: child-a (Claude Task 主軸) で C4 実装、Library 同期は `re.sub lambda` 形式で
5. **E-02 検察官レビュー**: child-c で本書の基準に照らした独立検証
6. **deploy**: git commit + clasp push + feature.json 更新 + Discord + Obsidian

### 9.2 退化防止チェック（C4 / E-02 で必須）
- [ ] TITLE セクションに 80 以外の数値を書いていないか
- [ ] "target XX-YY" 表記を使っていないか
- [ ] **ALLOWED SYMBOLS が `& / : - . ,`（必要なカテゴリで `#` `'` `+` 追加）になっているか（§4.4.1 準拠）**
- [ ] **FORBIDDEN SYMBOLS に `,` `.` `-` を含んでいないか（§4.4.2 準拠）**
- [ ] **VERIFICATION / TITLE / GOALS セクションが「No commas, no hyphens, no periods」等の §4.4.5 違反記述を含んでいないか（含めば即 fail）**
- [ ] **FORBIDDEN SYMBOLS に `'` を含んでいないか（Men's 等の所有格ブランド名が必要、§4.4.1 準拠）**
- [ ] **§4.4.3 デフォルト禁止ルール: ALLOWED 外の記号を勝手に追加していないか**
- [ ] CONDITION TERMS が業界標準に合っているか（TCG 用語を書籍に流用していないか等）
- [ ] BOOTLEG MUST がカテゴリの VeRO 状況に整合しているか
- [ ] カテゴリ固有の弾薬（辞書）が充実しているか
- [ ] AI 出力の "ItemSpecifics:" ブロックを過剰に細かく要求していないか（IS には流れない）
- [ ] re.sub lambda 形式で Library 同期しているか
- [ ] アポストロフィ二重エスケープが起きていないか（byte-match 検証）
- [ ] feature.json を passing に更新したか

### 9.3 既知バグの再発防止（不変）
- Library sync は必ず `re.sub(pattern, lambda m: new_entry, lib)`（文字列直渡し禁止）
- byte-match 検証（diff 0 確認）
- node 構文チェック必須
- アポストロフィエスケープ順序: バックスラッシュ → アポストロフィ → 改行

---

## 10. 改修者（人間・AI）への警告

### 過去設計書を参照しない
本書 v1.0 公開後、以下を見つけても **採用しない**:
- "TITLE 68-75 統一"
- "CONDITION TERMS NM/LP/MP/HP/DMG 統一"
- "MISSING ACCESSORIES 8項目"
- "VERIFICATION 16項目"
- 数値固定の形式論
- **"Allowed symbols only: & / :" / "Allowed symbols: & / : #"（カンマ・ピリオド・ハイフン禁止記述）— 2026-03-16 整備済の eBay ルール準拠を破壊する記述**
- **"FORBIDDEN: , . - ( ) [ ] "" / "No commas, periods, hyphens" 等の §4.4 違反記述**

これらは退化を引き起こす過去設計の残骸。本書 §3〜§9 を採用すること。

### 数値を見たら警戒する
プロンプトに数値（68 / 75 / 40 / 6段階 / 16項目）が出てきたら、それが **eBay の Fact 制約か、退化の残骸か** を判断すること。Fact 制約は 80 のみ。それ以外の数値は原則 **書かない**。

### カテゴリの違いを尊重する
TCG・書籍・アパレル・古美術はそれぞれ業界文化が違う。「全カテゴリ統一」を目指すのは間違い。**カテゴリの買い手が使う言葉**で書くこと。

---

## 11. 本書の更新方針

- 本書は唯一の根源基準
- 改訂時は v1.0 → v1.1 のように明示し、変更履歴を末尾に記録
- 過去の Sprint Contract を再生成する場合も、本書を引用する形で書く

---

## 12. 改修順序（カテゴリ priority）

椛島さん指定の改修順序。**この順序で 1 カテゴリずつ完璧に仕上げてから次へ**進む。バッチ展開禁止。

| # | カテゴリ | 系統 |
|---|---|---|
| 1 | 時計用 | 時計 |
| 2 | カメラ | カメラ |
| 3 | リール | 釣具 |
| 4 | 釣竿 | 釣具 |
| 5 | 釣具汎用 | 釣具 |
| 6 | ゴルフ | スポーツ用品 |
| 7 | ジュエリー | ジュエリー |
| 8 | ポケカ | TCG |
| 9 | MTG | TCG |
| 10 | ベースボールカード | TCG |
| 11 | 大相撲カード | TCG |
| 12 | 遊戯王 | TCG |
| 13 | ワンピースカード | TCG |
| 14 | ドラゴンボールカード | TCG |
| 15 | ヴァイスシュヴァルツ | TCG |
| 16 | デジモンカード | TCG |
| 17 | ガンダムカード | TCG |
| 18 | トレカ汎用 | TCG |
| 19 | ゲーム用 | ゲームソフト |
| 20 | ゲーム機 | 家電 |
| 21 | コレクティブル | コレクション |
| 22 | フィギュア | コレクション |
| 23 | アニメ | コレクション |
| 24 | 漫画 | 書籍 |
| 25 | オーディオ・家電 | 家電 |
| 26 | 楽器 | 楽器 |
| 27 | 楽器_ギター | 楽器 |
| 28 | 楽器_アンプ | 楽器 |
| 29 | RC・模型 | 趣味 |
| 30 | メカプラモ | 趣味 |
| 31 | レコード | コレクション |
| 32 | 万年筆・筆記具 | 雑貨 |
| 33 | 日本刀 | 古美術 |
| 34 | 陶磁器 | 古美術 |
| 35 | 茶道具 | 伝統工芸 |
| 36 | 鉄瓶 | 伝統工芸 |
| 37 | 盆栽 | 趣味 |
| 38 | 包丁 | 工芸 |
| 39 | 和楽器 | 伝統工芸 |
| 40 | 日本人形 | 伝統工芸 |
| 41 | 書籍・雑誌 | 書籍 |
| 42 | パソコン周辺機器 | 雑貨 |
| 43 | パソコン本体 | 家電 |
| 44 | 電子辞書 | 雑貨 |
| 45 | 関数電卓 | 雑貨 |
| 46 | ボードゲーム | ホビー |
| 47 | アート | アート |
| 48 | 掛軸 | 古美術 |
| 49 | 版画 | アート |
| 50 | 着物 | 和装・伝統 |
| 51 | 仏教美術 | 古美術 |
| 52 | 日本伝統・骨董 | 古美術 |
| 53 | 切手・コイン | コレクション |
| 54 | 野球 | スポーツ用品 |
| 55 | テニス | スポーツ用品 |
| 56 | テーブルウェア | 雑貨 |
| 57 | パイプ・喫煙具 | 雑貨 |
| 58 | 石鹸 | 雑貨 |
| 59 | スノーグローブ | コレクション |
| 60 | アパレル・ブランド品 | アパレル |
| 61 | 日本ブランド | アパレル |
| 62 | ドレスシューズ | 靴 |
| 63 | スニーカー | 靴（既 deploy 4/26） |
| 64 | レザーグッズ | バッグ |
| 65 | サングラス | アクセサリ（既 deploy 4/26） |
| 66 | スポーツウェア | アパレル |
| 67 | タイトル並べ替え | 特殊機能 |
| 68 | 一般商品・汎用 | 汎用 |

合計: 全 68 カテゴリ（prompts/*.txt 全件と一致）

---

## 13. 変更履歴

- v1.0 (2026-04-28): 初版。過去の数値固定設計（68-75 統一・6段階 CONDITION・16 VERIFICATION 等）を廃止し、理由ベース・弾薬充実・カテゴリ業界尊重を 3 本柱とする。改修順序の priority 1〜20 を記載。
- v1.1 (2026-04-29): §4.4 ALLOWED SYMBOLS を追加（4.4.1 共通許容、4.4.2 明示禁止、4.4.3 デフォルト禁止ルール、4.4.4 出典 Fact、4.4.5 退化防止）。2026-03-16 椛島さん主導の eBay 調査結果（ハイフン・ピリオド・カンマ許容）が docs に明文化されておらず、2026-04-25 ゲーム機改修（commit `adb18f9`）以降の Claude による盲目継承で 23 カテゴリに退化（`& / :` のみ または `& / : #` のみ）が伝播していたため、SOT として確定記載。GPT-5/Gemini 3者協議 + child-c E-02 検察官レビューで承認。`+` 記号はカテゴリ固有例外（モデル名・グレード表記内のみ）として収録。退化防止チェック §9.2 と §10 の禁止リストにも反映。
