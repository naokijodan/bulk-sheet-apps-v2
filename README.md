# 一括登録シート Google Apps Script 全集 (Ver.2)

一括登録シートVer.40のGoogle Apps Scriptコード全集です。

## 概要

このリポジトリには、eBay商品の一括登録を効率化するGoogle Spreadsheetsアドオンのソースコードが含まれています。

### 主な機能

- **AI自動翻訳**: 商品説明の自動翻訳機能
- **価格計算**: 関税、送料、手数料を考慮した自動価格計算
- **シッピングポリシー**: 関税額ベースの柔軟なポリシー設定
- **テンプレート管理**: 商品カテゴリ別のテンプレート管理
- **データインポート**: 複数ソースからのデータ取り込み
- **拡張機能連携**: Universal Scraper Chrome拡張機能との連携

## ファイル構成

### コアファイル (.gs)

- `Config.gs` - 設定管理
- `AI.gs` - AI翻訳機能
- `Translation.gs` - 翻訳処理
- `Utils.gs` - ユーティリティ関数
- `Shipping.gs` - 送料・シッピングポリシー計算
- `Debug.gs` - デバッグ機能
- `EAGLE商品データ連携.gs` - EAGLE連携機能
- `インポート用.gs` - データインポート

### メインコード (分割版)

- `コード_Part1_価格計算・バッチ処理.gs` - 価格計算とバッチ処理
- `コード_Part2_テンプレート・ポリシー関連.gs` - テンプレート・ポリシー管理
- `コード_Part3_メニュー・設定関連.gs` - メニューと設定UI
- `コード_Part4_テンプレート・ポリシー関連.gs` - テンプレート・ポリシー詳細
- `コード_Part5_インポート機能関連.gs` - インポート機能

### ダイアログ・UI (.txt)

- `SetupDialog.txt` - 初期設定ダイアログ
- `PriceCalc.txt` - 価格計算ツール
- `PromptEditor.txt` - プロンプト編集
- `CategorySelectionDialog.txt` - カテゴリ選択
- `UnifiedDataImportDialog.txt` - データインポート
- その他各種ダイアログUI

## 使い方

### Google Spreadsheetsへの導入

1. Google Spreadsheetsを開く
2. `拡張機能` > `Apps Script` を選択
3. このリポジトリの各.gsファイルをコピー＆ペースト
4. 各.txtファイルもHTMLファイルとして追加

### 設定

初回実行時に初期設定ダイアログが表示されます。以下を設定してください：

- OpenAI APIキー
- 為替レート設定
- 送料設定
- 利益率設定

## 注意事項

⚠️ **このコードは上級者向けです**

- カスタマイズする場合は、必ずバックアップを取ってから作業してください
- Google Apps Scriptの基礎知識が必要です
- APIキーなどの認証情報は適切に管理してください

## リンク

- [一括登録シート Ver.40](https://docs.google.com/spreadsheets/d/1p3gCYvZb2HskbLl7_2A1qnaeR_V2GHa9m1hoanoK1Nk/edit?gid=1116471535#gid=1116471535)
- [総合ガイド](https://naokijodan.github.io/bulk-tools-guide/)
- [Universal Scraper](https://github.com/naokijodan/universal-scraper)
- [価格計算ツールガイド](https://naokijodan.github.io/price-calc-guide/)
- [プロンプト編集ガイド](https://naokijodan.github.io/prompt-editor-guide/)

## ライセンス

このコードは個人利用・商用利用ともに自由に使用できます。

## バージョン

- **Ver.2** (2025年11月)
  - 1日ごとの実効レート取得に変更
  - シッピングポリシーを関税額ベースに変更
  - 送料計算ベースをeパケットに変更
  - 拡張機能からのワンクリックエクスポート対応

---

**開発者**: naokijodan
**最終更新**: 2025年11月24日
