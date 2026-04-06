# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続き。

## ■ 現在のステータス

- ブランチ: main
- 最新コミット: `fc9217f`
- clasp push: **実施済み**
- 動かないもの: なし

## ■ 前回のセッション（2026-04-06）でやったこと

### 辞書確認プロジェクト完了
- **全64カテゴリの辞書確認完了**（40/64から開始→64/64完了）
- 新設: +9カテゴリ（Kakejiku, Manga, Mecha Model Kits, Fishing Lures, Video Game Accessories, Guitars, Effects & Amps, Synths & Digital）※前セッション含む
- 削除: -1（Lighters: 危険物で発送不可）
- **合計72カテゴリ**

### 主要な設計変更
1. **Lighters削除**: 危険物のため国際発送不可
2. **Kakejiku新設**: 掛軸をArtから分離（表装/軸先/箱の専用フィールド）
3. **Manga新設**: 漫画をAnimeから分離（eBayではBooks > Comic Books & Manga）
4. **Mecha Model Kits新設**: ガンプラ/ロボット系プラモをRC & Modelsから分離
5. **Japanese Swords刀装具特化**: 刀身は発送不可。鍔/拵え専用フィールドに全面変更
6. **Bonsai周辺グッズ特化**: 生きた木は輸出不可
7. **Anime改修**: 漫画分離+グッズタグ充実+フィールド6→10
8. **Figures改修**: Theme/Vintage→Series・Line/Official・Bootleg/Release Year
9. **ガンダムカード専用プロンプト新設**: prompts/ガンダムカード.txt + PromptTemplates.gs + PROMPT_TAG_MAPPING

### 重要な教訓（このセッションで発生）
1. **Edit tool使用時に文字化け（U+FFFD）が頻発**: 日本語文字列のreplace_allで発生。Pythonで修正が必要
2. **PromptTemplates.gsの手動追加時にエスケープ漏れ**: 改行が未エスケープでclasp pushエラー
3. **IS_TAG_TO_CATEGORY追加忘れ**: PROMPT_TAG_MAPPINGだけ追加してIS_TAG_TO_CATEGORYを忘れた（ガンダムカード）
4. **GPTのFAIL指摘後の再確認漏れ**: 修正してコミットしたが再レビューを取らなかった箇所あり

---

## ■ 次にやること: 3レイヤー全面検証

### 目的
全72カテゴリで、以下の3レイヤーが一貫して連携するか検証する:

```
レイヤー1: 交通整理
  IS_TAG_TO_CATEGORY → タグがカテゴリに正しくマッピングされるか

レイヤー2: 翻訳
  PROMPT_TAG_MAPPING → カテゴリに対応するプロンプトが選ばれるか
  prompts/*.txt → プロンプト内容がカテゴリの商品に適切か

レイヤー3: IS（Item Specifics）
  IS_CATEGORY_FIELDS → フィールドが正しく定義されているか
  CATEGORY_RULES_ → ルールがフィールドと整合しているか
  FIELD_EN_TO_JP_ → 英語→日本語変換が全フィールドに対応しているか
```

### 具体的なチェック項目
1. **全タグがIS_TAG_TO_CATEGORYに存在するか**
2. **全タグがPROMPT_TAG_MAPPINGのいずれかのプロンプトに含まれるか**（断線なし）
3. **全カテゴリがIS_CATEGORY_FIELDSに定義されているか**
4. **全カテゴリのフィールドがFIELD_EN_TO_JP_に登録されているか**
5. **CATEGORY_RULES_のENセクションとIS_CATEGORY_FIELDSの整合性**
6. **翻訳プロンプト（prompts/*.txt）が辞書改修の内容を反映しているか**（今セッションで辞書は変えたがプロンプト本文は未対応のカテゴリ多数）

### 特に要注意のカテゴリ
- **Kakejiku**: 新設。プロンプトはアートと共有。掛軸専用の翻訳指示がプロンプトにない
- **Manga**: 新設。専用プロンプトなし（PROMPT_TAG_MAPPINGに「漫画」を追加したがプロンプトファイルはまだない）
- **Mecha Model Kits**: 新設。プロンプトはRC・模型と共有
- **Japanese Swords**: 刀装具特化したがプロンプトは刀身前提の可能性
- **Pottery**: 産地タグ17件追加したがプロンプト内のマッピングと整合未確認
- **Kimono**: 技法/産地フィールド追加したがプロンプト未確認

---

## ■ 参照すべきファイル

### セッション開始時に必ず読むもの
1. `~/.claude/CLAUDE.md` + `~/.claude/rules/` 配下の全ルールファイル
2. このHANDOVER.md
3. `~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md`（コミット前チェックリスト5項目）
4. Obsidian開発ノート: `一括シートV3_辞書充実.md`

### 3レイヤー検証に必要なファイル
| レイヤー | ファイル | 内容 |
|---------|---------|------|
| 交通整理 | `ItemSpecifics/Config_IS.gs` | IS_TAG_TO_CATEGORY, IS_INITIAL_DATA, IS_CATEGORY_FIELDS |
| 翻訳 | `Config.gs` | PROMPT_TAG_MAPPING |
| 翻訳 | `prompts/*.txt` (45件) | プロンプト本文 |
| 翻訳 | `Library/PromptTemplates.gs` | prompts→GAS同期版 |
| IS | `Sanitize.gs` | CATEGORY_RULES_, FIELD_EN_TO_JP_, SANITIZE_FIELDS_ |
| IS | `AI.gs` | カテゴリ固有AIヒント（カメラ/ゲーム/カード/コレクティブル） |

### 開発ツール
| ツール | コマンド |
|--------|---------|
| GPTレビュー | `mcp__openai-bridge__ask_gpt` |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py` |
| clasp push | `cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
