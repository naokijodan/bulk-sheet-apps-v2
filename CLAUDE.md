# 一括シートV3 開発ルール

## 最重要ルール：ライブラリ同期

### ファイル更新時の必須作業

**ルートフォルダのファイルを変更したら、必ず `Library/` フォルダにも反映すること！**

```
一括シートApps_v3/
├── AI.gs                    ← 変更したら
├── Library/
│   └── AI.gs                ← こちらも更新必須
```

### 対象ファイル

以下のファイルは `Library/` フォルダにも同名ファイルが存在する：

- `AI.gs`
- `Config.gs`
- `Debug.gs`
- `EAGLE商品データ連携.gs`
- `Shipping.gs`
- `Translation.gs`
- `Utils.gs`
- `インポート用.gs`
- `コード_Part1_価格計算・バッチ処理.gs`
- `コード_Part2_テンプレート・ポリシー関連.gs`
- `コード_Part3_メニュー・設定関連.gs`
- `コード_Part4_テンプレート・ポリシー関連.gs`
- `コード_Part5_インポート機能関連.gs`

### HTMLファイル（.txt）の更新

HTMLテンプレート（`.txt`ファイル）を変更した場合：

1. ルートの `.txt` ファイルを編集
2. `Library/HtmlTemplates.gs` の該当箇所を更新
3. または `convert_html_to_gs.py` スクリプトを実行

### ⚠️ 重要：HTMLテンプレート読み込みの違い

**ルートフォルダとLibraryフォルダでHTML読み込み方法が異なる！単純コピーは禁止！**

| フォルダ | `.html`ファイル | 読み込み方法 |
|---------|----------------|-------------|
| ルート | 存在する | `HtmlService.createTemplateFromFile()` でOK |
| Library | 存在しない | `HtmlTemplates.gs` から取得が必要 |

**Libraryフォルダの.gsファイルでは、必ず以下のフォールバックパターンを使用すること：**

```javascript
// createTemplateFromFile の代替パターン
var tmpl;
try {
  tmpl = HtmlService.createTemplateFromFile('Name');
} catch (_) {
  var htmlContent = getHtmlTemplate('Name');
  if (htmlContent) {
    tmpl = HtmlService.createTemplate(htmlContent);
  }
}
if (!tmpl) {
  showAlert('Name.html が見つかりません', 'error');
  return;
}

// createHtmlOutputFromFile の代替パターン
var html;
try {
  html = HtmlService.createHtmlOutputFromFile('Name');
} catch (_) {
  html = createHtmlFromTemplate('Name');
}
if (!html) {
  showAlert('Name.html が見つかりません', 'error');
  return;
}
```

**やってはいけないこと：**
- ルートの `.gs` ファイルをそのまま `Library/` にコピーする
- `HtmlService.createTemplateFromFile()` を単独で使う（Libraryでは動かない）

**正しい手順：**
1. ルートフォルダで機能を開発
2. Libraryにコピーする際、HTML読み込み部分をフォールバックパターンに書き換える
3. または、最初からフォールバックパターンで書く（両方で動作する）

### ⚠️ 重要：PropertiesService の違い

**ライブラリでは `ScriptProperties` は使用禁止！必ず `DocumentProperties` を使用すること！**

| プロパティ | 紐づき先 | ライブラリでの動作 |
|-----------|---------|-------------------|
| `ScriptProperties` | スクリプトプロジェクト | ライブラリ自身の空のプロパティを参照（NG） |
| `DocumentProperties` | スプレッドシート | ユーザーのシートの設定を正しく参照（OK） |

**Libraryフォルダの.gsファイルでは、必ず以下のパターンを使用すること：**

```javascript
// ❌ NG: ScriptProperties（ライブラリでは使えない）
var props = PropertiesService.getScriptProperties();

// ✅ OK: DocumentProperties（ライブラリでも動作する）
var docProps = PropertiesService.getDocumentProperties();
var props = docProps; // 後方互換のためpropsもdocPropsを参照
```

**過去の事故例（2026-01-17）：**
ルートの `コード_Part1` を単純にLibraryにコピーした結果、`ScriptProperties` が混入し、
SetupDialogの初期値が正しく読み込めなくなった。

### 新規ファイル作成時

新しい `.gs` ファイルを作成した場合：

1. ルートフォルダに作成
2. **同じファイルを `Library/` フォルダにもコピー**
3. コミット時に両方を含める

### なぜ重要か

- ユーザーはライブラリを参照している
- ルートフォルダは開発用のコピー
- **ライブラリを更新しないと、ユーザーには反映されない**

---

## 編集完了時の報告ルール

### 必須：編集ファイル一覧の報告

**コード編集が完了したら、必ず以下の形式で編集したファイルを報告すること：**

```
## 編集したファイル

| ファイル | 変更内容 |
|----------|----------|
| `Assistant.gs` | assistantGetColumnInfo_()を修正 |
| `Library/Assistant.gs` | 同上（ライブラリ同期） |
| `PromptEditor.txt` | getColumnInfo()の表示ロジック変更 |
| `Library/HtmlTemplates.gs` | PromptEditor反映 |
```

### 報告に含めるべき情報

1. **ルートフォルダのファイル** - 変更した全ファイル
2. **Libraryフォルダのファイル** - 同期したファイル（必ず明記）
3. **各ファイルの変更内容** - 簡潔に何を変えたか

---

## 必須：コミット前の再確認チェックリスト

**コード変更後、コミット前に必ず以下を実行すること。省略は許可されない。**

### 1. ScriptProperties チェック（必須）

```bash
# Library内にScriptPropertiesが残っていないか確認
grep -rn "getScriptProperties" Library/*.gs

# ルートフォルダも確認
grep -n "getScriptProperties" *.gs
```

**結果が「なし」であることを確認する。1件でもあれば修正必須。**

### 2. ルートとLibraryの同期チェック（必須）

```bash
# 変更したファイルがLibraryにも反映されているか確認
git diff --name-only | grep -v Library | while read f; do
  if [ -f "Library/$f" ]; then
    echo "要確認: $f と Library/$f"
  fi
done
```

### 3. HtmlTemplates.gs チェック（.txtファイル変更時）

```bash
# .txtファイルを変更した場合、HtmlTemplates.gsを再生成
python3 Library/convert_html_to_gs.py

# 全テンプレートが含まれているか確認
grep -c "HTML_TEMPLATES\[" Library/HtmlTemplates.gs
# 結果: 13（テンプレート数）であること
```

### 4. 変更ファイルの最終確認

```bash
git status
git diff --stat
```

**ルートとLibraryの両方が含まれていることを確認する。**

---

## 必須：3者協議ルール（GPT・Gemini・Claude）

**Claudeの単独判断は信用しない。重要な判断は必ず3者で協議すること。**

### 協議が必要なタイミング

#### 1. 設計・計画時（修正前）
- 複雑な改修の方針決定
- 影響範囲が広い変更
- 複数のアプローチが考えられる場合

#### 2. 修正完了時（コミット前）
- 「完了」と判断する前に3者で確認
- 特に同期作業、大規模リファクタリング後
- 「本当に漏れがないか？」の最終チェック

### 協議方法

```
# 3者で意見を集める
mcp__ai-discussion__get_all_opinions

# 3者で議論する
mcp__ai-discussion__multi_discuss

# 合意点・相違点をまとめる
mcp__ai-discussion__consensus
```

### なぜ必要か

**過去の事故例（2026-01-19）：**
Claudeが「完璧です」と報告した後、GPTの指摘で7ファイルの未同期が発覚。
Claudeの単独チェックでは見落としが発生する。

---

## GASライブラリ開発ガイドライン

### アーキテクチャ原則（Passive Library Pattern）

GASライブラリ特有の制約を回避するため、以下の責務分担を厳守する。

#### ライブラリの責務（できること）
- ビジネスロジックの提供
- HTMLテンプレート（文字列）の生成
- データの加工・処理

#### ライブラリの禁止事項（できないこと）
- ❌ `google.script.run` でライブラリ関数を直接呼び出す
  - クライアントサイドJSからの`google.script.run`は**常にホスト側のスクリプト**を呼ぶ
  - ライブラリ内の関数は呼べない（`is not a function`エラー）
- ❌ ライブラリからの直接的なUI表示（alert/toast）が不安定
  - 実行コンテキストの問題で動作しない場合がある

#### 解決パターン
```javascript
// ❌ NG: サイドバーからライブラリ関数を直接呼ぶ
google.script.run.getCurrentLibVersion();  // エラー

// ✅ OK: HTMLにデータを埋め込む（テンプレート置換）
// GAS側（showProgressSidebar_）
var htmlContent = getHtmlTemplate('ProgressSidebar');
htmlContent = htmlContent.replace('{{VERSION}}', String(VERSION));
var html = HtmlService.createHtmlOutput(htmlContent);

// HTML側
var CURRENT_VERSION = {{VERSION}};  // GAS側で置換される
```

#### ホスト（利用者）の責務
- UIの表示（`showSidebar`, `showModalDialog`）
- クライアントサイドJavaScriptのイベントハンドリング
- `google.script.run`のエンドポイント提供（必要に応じてライブラリへ委譲）

### 既知の制限一覧

| 制限 | 説明 | 回避策 |
|------|------|--------|
| `google.script.run` | ライブラリ関数を直接呼べない | HTMLにデータを埋め込む |
| `ScriptProperties` | ライブラリ自身のプロパティを参照 | `DocumentProperties`を使用 |
| UI呼び出し | コンテキストによって不安定 | ホスト側で表示 |

---

## アプローチ変更時のルール

### 撤退手順（失敗時の対応）

**アプローチがうまくいかなかった場合、手動でコードを削除しない。**

```bash
# ❌ NG: 手動で削除 → 削除漏れでReferenceError

# ✅ OK: Gitでファイルごと戻す
git restore <file>
git checkout <file>
```

### チェックリスト（アプローチ変更時）

1. **旧コードの呼び出し箇所を検索**
   ```bash
   grep -rn "旧関数名" *.gs Library/*.gs *.txt
   ```
2. **HTMLファイル（クライアント側）も必ず検索**
   - `.gs`だけでなく`.txt`（HTML）も確認
3. **可能ならGitでロールバックしてからやり直す**

---

## 新機能実装の手順

### 1. 事前調査（3者協議推奨）

複雑な機能、UI/権限/非同期が絡む場合は、実装前に3者協議で以下を確認：
- 仕様: 何を実現するか
- 制約: GASライブラリの制限に引っかからないか
- 代替案: 複数のアプローチを検討

### 2. 最小検証（隔離して実験）

```
❌ NG: メインコードに直接書いて「試す」
✅ OK: _test.gs 等の隔離ファイルで最小検証
```

### 3. 実装 → レビュー → コミット

---

## その他のルール

### コミット・プッシュ

- こまめにコミット・プッシュする
- 特に大きな変更は段階的にコミット
- ロールバックしやすい状態を維持

### テスト

- ライブラリ更新後は実際のスプレッドシートで動作確認
- 既存機能が壊れていないことを確認

---

## 過去の事故例

### 2026-01-19: サイドバー更新通知バナー

**問題:** 実装に長時間かかった

**原因:**
1. GASライブラリの制限を事前調査せず実装開始
2. `google.script.run`がライブラリ関数を呼べない制限を知らなかった
3. アプローチ変更時に旧コードの削除漏れ（ReferenceError）
4. 3者協議を最初からしなかった

**教訓:**
- 新機能実装前に「GASライブラリの制限」セクションを確認
- アプローチ変更時はgrepで旧コードを検索、手動削除よりgit restore
- 複雑な機能は最初から3者協議で設計を固める
