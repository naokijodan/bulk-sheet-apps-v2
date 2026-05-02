# 一括シートV3 引き継ぎ文

> **Last updated**: 2026-05-02 evening (harness-20260502-093617 終了時)
> **唯一の設計基準**: [`docs/PROMPT_DESIGN_PRINCIPLE.md`](docs/PROMPT_DESIGN_PRINCIPLE.md) **v1.1** (commit 48cab87)
> **過去の Sprint Contract / 旧設計書は物理削除済み**。参照しないこと。
> **進捗**: priority 1-38 完遂、priority 39 和楽器から再開（次セッション）

---

## 重要警告（必読）

**過去の設計書を「探してきて」はいけない。** 過去の Sprint Contract と古い docs/ 設計書は物理削除済み。

設計判断は **`docs/PROMPT_DESIGN_PRINCIPLE.md` v1.1 のみ** を根源基準とする。

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
