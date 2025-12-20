#!/usr/bin/env python3
"""
HTMLファイルをGAS文字列に変換するスクリプト
"""

import os
import json

# HTMLファイルのリスト
HTML_FILES = [
    'SimpleSetup.txt',
    'PromptEditor.txt',
    'ProgressSidebar.txt',
    'CategorySelectionDialog.txt',
    'ShippingPolicyCategoryDialog.txt',
    'TemplateManualSearch.txt',
    'ShippingPolicyManualSearch.txt',
    'SettingsImportDialog.txt',
    'DuplicateCheckSettings.txt',
    'UnifiedCategoryDialog.txt',
    'UnifiedDataImportDialog.txt',
    'SetupDialog.txt',
    'PriceCalc.txt',
]

def escape_for_js(content):
    """JavaScript文字列用にエスケープ"""
    # バックスラッシュを先にエスケープ
    content = content.replace('\\', '\\\\')
    # シングルクォートをエスケープ
    content = content.replace("'", "\\'")
    # 改行をエスケープ
    content = content.replace('\n', '\\n')
    content = content.replace('\r', '')
    return content

def convert_to_gs(base_dir):
    """HTMLファイルをGS形式に変換"""

    output = []
    output.append('''/******************************************************
 * HtmlTemplates.gs - HTMLテンプレート文字列
 *
 * ライブラリ内でHTMLを使用するため、文字列として埋め込み
 ******************************************************/

var HTML_TEMPLATES = {};
''')

    for filename in HTML_FILES:
        filepath = os.path.join(base_dir, filename)
        if not os.path.exists(filepath):
            print(f"Warning: {filename} not found")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # ファイル名から変数名を生成（.txtを除去）
        var_name = filename.replace('.txt', '').replace('.', '_')

        escaped = escape_for_js(content)

        output.append(f"\nHTML_TEMPLATES['{var_name}'] = '{escaped}';\n")
        print(f"Converted: {filename} ({len(content)} bytes)")

    # ヘルパー関数を追加
    output.append('''
/**
 * テンプレートからHtmlOutputを生成
 * @param {string} templateName - テンプレート名
 * @return {HtmlOutput}
 */
function createHtmlFromTemplate(templateName) {
  var html = HTML_TEMPLATES[templateName];
  if (!html) {
    throw new Error('Template not found: ' + templateName);
  }
  return HtmlService.createHtmlOutput(html);
}

/**
 * テンプレートを取得（テンプレート変数置換用）
 * @param {string} templateName - テンプレート名
 * @return {string}
 */
function getHtmlTemplate(templateName) {
  return HTML_TEMPLATES[templateName] || '';
}
''')

    return '\n'.join(output)

if __name__ == '__main__':
    base_dir = '/Users/naokijodan/Desktop/一括シートApps_v3'
    result = convert_to_gs(base_dir)

    output_path = os.path.join(base_dir, 'Library', 'HtmlTemplates.gs')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"\nOutput written to: {output_path}")
    print(f"Total size: {len(result)} bytes")
