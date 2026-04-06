# 一括シートV3 引き継ぎ文

一括シートV3（~/Desktop/ツール開発/一括シートApps_v3/）の続きをお願いする。

## ■ 最重要: 過去セッションの教訓（繰り返すな）

### 2026-04-06セッションで起きた問題
1. **IS_TAG_TO_CATEGORY追加忘れ**: PROMPT_TAG_MAPPINGだけ追加してIS_TAG_TO_CATEGORYを忘れた（ガンダムカード）→ タグを入力してもカテゴリ判定されない
2. **GPTのFAIL指摘後の再確認漏れ**: 修正してコミットしたが再レビューを取らなかった箇所あり
3. **プロンプト未作成のまま放置**: Manga/Kakejiku/Mecha Model Kitsのプロンプトが未作成 → 3レイヤー断線
4. **PromptTemplates.gs手動追加時にエスケープ漏れ**: 改行が未エスケープでclasp pushエラー
5. **Edit toolで文字化け（U+FFFD）頻発**: 日本語文字列のreplace_allで発生。Pythonで修正が必要

### 必ず守るルール
- **コードに触る前に**: ルールファイル、HANDOVER.md、プロジェクトCLAUDE.md、Obsidianノートを全て読む
- **作業フロー**: リサーチ→設計→**ユーザー承認**→実装→**レビュー（Claude+GPT最低2者）**→コミット→git push→clasp push
- **3レイヤー断線チェック**: IS_TAG_TO_CATEGORY / PROMPT_TAG_MAPPING / IS_CATEGORY_FIELDS / CATEGORY_RULES_ / FIELD_EN_TO_JP_ の全てが揃っているか確認
- **プロンプト変更時**: prompts/*.txt変更 → sync_prompts_to_gs.py → clasp push。新規ファイルはsyncスクリプトが自動追加しないので手動追加が必要
- **コミット前チェックリスト**: ScriptProperties / Library同期 / HtmlTemplates / PromptTemplates同期 / 文字化け(`grep '��'`)

---

## ■ 現在のステータス

- ブランチ: main
- 最新コミット: `7244e4b`
- clasp push: **実施済み**
- 動かないもの: なし（ただし下記の断線あり）

### 辞書確認プロジェクト: 完了
- 全72カテゴリの辞書（IS_TAG_TO_CATEGORY / IS_INITIAL_DATA / IS_CATEGORY_FIELDS / IS_BRAND_DICT / CATEGORY_RULES_）は完了
- 新設9カテゴリ、削除1カテゴリ（Lighters）

---

## ■ 次にやること（優先順位順）

### Phase 1: プロンプト未作成の緊急修正（最優先）

以下3カテゴリのプロンプトが未作成で**3レイヤーが断線**している。まずこれを修正する。

| # | カテゴリ | 問題 | 対応 |
|---|---------|------|------|
| 1 | **Manga** | PROMPT_TAG_MAPPINGに「漫画」キーがあるがprompts/漫画.txtが**存在しない** | 専用プロンプト新規作成が必要 |
| 2 | **Kakejiku** | アートプロンプトを共有。掛軸の表装/軸先/箱等の**専用翻訳指示がない** | 専用プロンプト新規作成、またはアートプロンプトに掛軸セクション追加 |
| 3 | **Mecha Model Kits** | RC・模型プロンプトを共有。ガンプラのグレード/スケール等の**専用翻訳指示がない** | 専用プロンプト新規作成、またはRC・模型プロンプトにメカプラモセクション追加 |

**作業手順（各カテゴリ）:**
1. 既存の類似プロンプト（prompts/ドラゴンボールカード.txt等）を参考にリサーチ
2. GPTにレビュー依頼（専門用語のJP→EN正確性）
3. プロンプトファイル作成（prompts/漫画.txt等）
4. PROMPT_TAG_MAPPINGとの整合性確認
5. `python3 Library/sync_prompts_to_gs.py` → **新規ファイルは手動追加が必要**
6. PromptTemplates.gsに追加されたか `grep 'プロンプト名' Library/PromptTemplates.gs` で確認
7. `cd Library && clasp push --force`
8. エラーがないことを確認

### Phase 2: 3レイヤー全面検証

全72カテゴリで以下の3レイヤーが一貫して連携するか検証する。

```
レイヤー1: 交通整理（タグ→カテゴリ）
  IS_TAG_TO_CATEGORY でタグがカテゴリに正しくマッピングされるか
  ファイル: ItemSpecifics/Config_IS.gs（行3660〜4020付近）

レイヤー2: 翻訳（カテゴリ→プロンプト→AI翻訳）
  PROMPT_TAG_MAPPING でタグに対応するプロンプトが選ばれるか
  ファイル: Config.gs（行247〜290付近）
  プロンプト本文: prompts/*.txt（45件）
  GAS同期版: Library/PromptTemplates.gs

レイヤー3: IS（翻訳結果→Item Specifics出力）
  IS_CATEGORY_FIELDS でフィールドが正しく定義されているか
  CATEGORY_RULES_ でルールがフィールドと整合しているか
  FIELD_EN_TO_JP_ で英語→日本語変換が全フィールドに対応しているか
  ファイル: Sanitize.gs（行15〜800付近）
```

**具体的なチェック方法:**

```bash
# 1. 全タグがIS_TAG_TO_CATEGORYに存在するか
grep -o "IS_TAG_TO_CATEGORY\['[^']*'\]" ItemSpecifics/Config_IS.gs | sort -u | wc -l

# 2. 全PROMPT_TAG_MAPPINGのタグがIS_TAG_TO_CATEGORYに存在するか（断線チェック）
# → Pythonスクリプトで自動チェック推奨

# 3. 全カテゴリがIS_CATEGORY_FIELDSに定義されているか
grep -o "'[^']*':" ItemSpecifics/Config_IS.gs | sort -u  # IS_CATEGORY_FIELDS内

# 4. 全フィールドがFIELD_EN_TO_JP_に登録されているか
# → IS_CATEGORY_FIELDSの全フィールド名をFIELD_EN_TO_JP_と突き合わせ

# 5. CATEGORY_RULES_のENセクションとフィールドの整合性
# → 各カテゴリのCATEGORY_RULES_内の[EN]セクションがIS_CATEGORY_FIELDSのフィールドを正しく参照しているか
```

### Phase 3: 翻訳プロンプト本文の再検証

今セッションで辞書（CATEGORY_RULES_/フィールド）を大幅に変更したが、プロンプト本文（prompts/*.txt）は更新していないカテゴリが多数ある。プロンプトの内容が辞書改修を反映しているか確認する。

**特に要注意のカテゴリ:**

| カテゴリ | プロンプト | 問題の可能性 |
|---------|----------|------------|
| Pottery | 日本伝統・骨董.txt | 産地タグ17件追加したがプロンプト内のCERAMICSマッピングと整合未確認 |
| Kimono | 着物.txt | 技法/産地フィールド追加したがプロンプトに京友禅/大島紬等の翻訳指示があるか未確認 |
| Japanese Swords | 日本刀.txt | 刀装具特化したがプロンプトは刀身前提の可能性 |
| Tea Ceremony | 日本伝統・骨董.txt（共有） | 茶道具専用の翻訳辞書が十分か未確認 |
| Buddhist Art | 日本伝統・骨董.txt（共有） | 尊格名の翻訳辞書がプロンプトにあるか未確認 |
| Art | アート.txt | 作家名ローマ字変換ルールを追加したがプロンプトに反映されているか |
| Prints | アート.txt（共有） | 浮世絵作家名辞書がプロンプトにあるか |

---

## ■ ファイル一覧と場所

### プロジェクトルート
`~/Desktop/ツール開発/一括シートApps_v3/`

### ルールファイル
| ファイル | 場所 |
|---------|------|
| グローバルルール | `~/.claude/CLAUDE.md` |
| グローバルルール詳細 | `~/.claude/rules/*.md`（session-start/completion/code-review-evaluator/deploy-rules等） |
| プロジェクトルール | `~/Desktop/ツール開発/一括シートApps_v3/CLAUDE.md` |

### コード（変更対象）
| ファイル | 内容 | 主要な変数/関数 |
|---------|------|---------------|
| `ItemSpecifics/Config_IS.gs` | カテゴリ定義 | IS_INITIAL_DATA, IS_TAG_TO_CATEGORY, IS_CATEGORY_FIELDS, IS_BRAND_DICT |
| `Config.gs` | プロンプトマッピング | PROMPT_TAG_MAPPING |
| `Sanitize.gs` | ルール/フィールド変換 | CATEGORY_RULES_, FIELD_EN_TO_JP_, SANITIZE_FIELDS_ |
| `AI.gs` | AI翻訳ヒント | createAIPrompt()内の動的ヒント注入 |
| `prompts/*.txt` | 翻訳プロンプト本文 | 45件（ガンダムカード含む） |
| `Library/PromptTemplates.gs` | プロンプトGAS同期版 | PROMPT_TEMPLATES['プロンプト名'] |

### Library同期対象（ルート変更時に必ずコピー）
```
Config_IS.gs → Library/Config_IS.gs
Config.gs → Library/Config.gs
Sanitize.gs → Library/Sanitize.gs
AI.gs → Library/AI.gs
```

### 開発ノート
| ノート | 場所 |
|-------|------|
| 開発ログ | Obsidian: `開発ログ/一括シートV3_辞書充実.md` |
| メモリ | `~/.claude/projects/-Users-naokijodan/memory/MEMORY.md` |

### 開発ツール
| ツール | コマンド |
|--------|---------|
| GPTレビュー | `mcp__openai-bridge__ask_gpt` |
| GPTコードレビュー | `mcp__openai-bridge__code_review_gpt` |
| 3者協議 | `mcp__ai-discussion__get_all_opinions` |
| 議論 | `mcp__ai-discussion__debate` |
| プロンプト同期 | `python3 Library/sync_prompts_to_gs.py` |
| clasp push | `cd Library && /Users/naokijodan/.npm-global/bin/clasp push --force` |
| Obsidian検索 | `mcp__obsidian__search_notes` |
| Obsidian読み | `mcp__obsidian__read_note` |

### 参考URL
| 名前 | URL |
|------|-----|
| GitHubリポジトリ | https://github.com/naokijodan/bulk-sheet-apps-v2 |
| 計画書 | https://naokijodan.github.io/auto-listing-system-plan/ |

---

## ■ 全72カテゴリ一覧（参考）

### 確認済み（辞書完了・プロンプト検証は未完了）
Watches, Rings, Necklaces, Bracelets, Earrings, Brooches, Cufflinks, Tie Accessories, Charms, Hair Accessories, Handbags, Wallets, Clothing, Shoes, Cameras, Electronics, Trading Cards, Video Games, Video Game Consoles, Video Game Accessories, Fishing Reels, Fishing Rods, Fishing Lures, Golf, Golf Heads, Tennis, Baseball, Dinnerware, Glassware, Flatware, Scarves, Neckties, Handkerchiefs, Sunglasses, Hats, Snow Globes, Boxes, Combs, Key Chains, Baby, Soap, Dolls & Plush, Pipes, Watch Parts, Collectibles, Pens, Art, Kakejiku(新設), Pottery, Belts, Belt Buckles, Kimono, Japanese Swords, Tea Ceremony, Bonsai, Prints, Buddhist Art, Tetsubin, Japanese Instruments, Stamps, Coins, Records, Manga(新設), Anime, Figures, Mecha Model Kits(新設), RC & Models, ガンダムカード(プロンプトのみ)

### 削除済み
Lighters（危険物で発送不可）
