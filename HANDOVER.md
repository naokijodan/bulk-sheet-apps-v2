# 一括シートV3 引き継ぎ文

> **Last updated**: 2026-04-30
> **唯一の設計基準**: [`docs/PROMPT_DESIGN_PRINCIPLE.md`](docs/PROMPT_DESIGN_PRINCIPLE.md) **v1.1** (commit 48cab87)
> **過去の Sprint Contract / 旧設計書は物理削除済み**。参照しないこと。

---

## 重要警告（必読）

**過去の設計書を「探してきて」はいけない。** 過去の Sprint Contract と古い docs/ 設計書は物理削除済み。

設計判断は **`docs/PROMPT_DESIGN_PRINCIPLE.md` v1.1 のみ** を根源基準とする。

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

## 残タスク（priority 19 以降）

改修順序 priority に従って残り 50 カテゴリ:

- **19 ゲーム用** ← 次（C0 未着手、確認済み: §4.1 / §4.4 違反あり、改修必要）
- 20 ゲーム機（priority 1〜11 で記号修正済 deploy 済、本来の V2.0.1 改修は別 Phase）
- 21 コレクティブル（同上）
- 22 フィギュア
- 23 アニメ
- 24 漫画
- 25 オーディオ・家電
- 26〜28 楽器系（楽器 / 楽器_ギター / 楽器_アンプ）
- 29 RC・模型
- 30 メカプラモ
- 31 レコード
- 32 万年筆・筆記具
- 33 日本刀
- 34 陶磁器
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

### 2. ワークフロー（priority 19 ゲーム用 から開始）
各カテゴリで **1 カテゴリずつ厳守**:

1. **状態確認**: `wc -l` + `grep -nE "Allowed symbols|Forbidden|68-75|target [0-9]|SOFT CHAR"` で §4.1/§4.4 違反確認
2. **C0 並列**: child-a/b/c に C0 (existing/market/ammo) を 3 並列で送信
3. **C4 implement**: child-a に SOT v1.1 §6 12 要素 + 弾薬充実で改修依頼
4. **E-02 review**: child-c に独立検察官レビュー依頼。**§4.4.5 隠れ違反（VERIFICATION の `, . - '` 禁止記述）を必ず確認**
5. **rework**: 違反あれば child-a に rework 指示（最小修正）
6. **deploy**: git commit + push + clasp push + feature.json + Discord + Obsidian の 1 カテゴリずつ完全サイクル

### 3. 重要な学習（このセッションの反省）
- **時計用 (priority 1) は記号修正だけでよかったのに、過剰改修で +119 行になった**。child の C0「rewrite_priorities high」を盲目採用しないこと
- **priority 3〜7 / 8〜11 を一括 deploy したのはルール違反**。1 カテゴリずつ厳守
- **VERIFICATION の隠れ違反**（ベースボール/大相撲/ドラゴンボール v47 で発生した `, . - '` 禁止リストや `60-79`/`30-59` の数値範囲違反）を E-02 で必ず探すこと
- **「即実行」する前に設計書を読む**こと

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
