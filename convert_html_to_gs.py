#!/usr/bin/env python3
"""
HTMLテンプレートファイルをHtmlTemplates.gsに変換するスクリプト
"""
import os
import json
import re

def escape_for_js(content):
    """JavaScriptの文字列リテラル用にエスケープ"""
    # バックスラッシュを先にエスケープ
    content = content.replace('\\', '\\\\')
    # シングルクォートをエスケープ
    content = content.replace("'", "\\'")
    # 改行をエスケープ
    content = content.replace('\n', '\\n')
    # キャリッジリターンをエスケープ
    content = content.replace('\r', '')
    return content

def main():
    # スクリプトのディレクトリを取得
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # HTMLテンプレートファイルのマッピング（.txt → テンプレート名）
    template_files = {
        'SimpleSetup.txt': 'SimpleSetup',
        'PromptEditor.txt': 'PromptEditor',
        'ProgressSidebar.txt': 'ProgressSidebar',
        'CategorySelectionDialog.txt': 'CategorySelectionDialog',
        'SetupDialog.txt': 'SetupDialog',
        'Shipping_Rates_Dialog.txt': 'Shipping_Rates_Dialog',
        'Profit_Amounts_Dialog.txt': 'Profit_Amounts_Dialog',
    }
    
    output_lines = [
        "/******************************************************",
        " * HtmlTemplates.gs - HTMLテンプレート文字列",
        " *",
        " * ライブラリ内でHTMLを使用するため、文字列として埋め込み",
        " ******************************************************/",
        "",
        "var HTML_TEMPLATES = {};",
        ""
    ]
    
    for filename, template_name in template_files.items():
        filepath = os.path.join(script_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            escaped = escape_for_js(content)
            output_lines.append(f"")
            output_lines.append(f"HTML_TEMPLATES['{template_name}'] = '{escaped}';")
            print(f"✅ {filename} → {template_name}")
        else:
            print(f"⚠️ {filename} が見つかりません")
    
    # getHtmlTemplate関数を追加
    output_lines.extend([
        "",
        "",
        "/**",
        " * テンプレート名からHTML文字列を取得",
        " * @param {string} name テンプレート名",
        " * @return {string} HTML文字列（見つからない場合はnull）",
        " */",
        "function getHtmlTemplate(name) {",
        "  return HTML_TEMPLATES[name] || null;",
        "}",
        "",
        "/**",
        " * テンプレート名からHtmlOutputを作成",
        " * @param {string} name テンプレート名",
        " * @return {HtmlOutput} HtmlOutputオブジェクト（見つからない場合はnull）",
        " */",
        "function createHtmlFromTemplate(name) {",
        "  var html = getHtmlTemplate(name);",
        "  if (html) {",
        "    return HtmlService.createHtmlOutput(html);",
        "  }",
        "  return null;",
        "}",
        ""
    ])
    
    # ファイルに書き出し
    output_path = os.path.join(script_dir, 'Library', 'HtmlTemplates.gs')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(output_lines))
    
    print(f"\n✅ {output_path} を更新しました")

if __name__ == '__main__':
    main()
