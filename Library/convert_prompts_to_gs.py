#!/usr/bin/env python3
"""
プロンプト.txtをGASのPromptTemplates.gsに変換するスクリプト

要件:
- convert_html_to_gs.py と同じ escape_for_js を使用
- FILE_TO_ID マッピングに基づいて読み込み、厳格検証を実施
- 1行目が "// VERSION: N" 形式なら N をバージョンとする
- VERSION 行は本文から除外。無い場合はバージョン=1で警告
- 出力: PromptTemplates.gs
"""

import os
import re
import sys
from typing import Dict, Tuple, List


# 変換対象: ファイル名 -> プロンプトID
# ファイル名 = GPT_PromptsシートのプロンプトIDと一致させる
FILE_TO_ID: Dict[str, str] = {
    '時計用.txt': '時計用',
    'カメラ.txt': 'カメラ',
    'リール.txt': 'リール',
    'ゴルフ.txt': 'ゴルフ',
    'ジュエリー.txt': 'ジュエリー',
    'ポケカ.txt': 'ポケカ',
    'MTG.txt': 'MTG',
    'ベースボールカード.txt': 'ベースボールカード',
    '大相撲カード.txt': '大相撲カード',
    'ゲーム機.txt': 'ゲーム機',
    'アパレル・ブランド品.txt': 'アパレル・ブランド品',
    '一般商品・汎用.txt': '一般商品・汎用',
    'ゲーム用.txt': 'ゲーム用',
    '日本ブランド.txt': '日本ブランド',
    'フィギュア.txt': 'フィギュア',
    'タイトル並べ替え.txt': 'タイトル並べ替え',
    'スニーカー.txt': 'スニーカー',
    'ドレスシューズ.txt': 'ドレスシューズ',
    'レザーグッズ.txt': 'レザーグッズ',
    'オーディオ・家電.txt': 'オーディオ・家電',
    '楽器.txt': '楽器',
    'RC・模型.txt': 'RC・模型',
    'レコード.txt': 'レコード',
    '釣竿.txt': '釣竿',
    '釣具汎用.txt': '釣具汎用',
    'サングラス.txt': 'サングラス',
    '万年筆・筆記具.txt': '万年筆・筆記具',
    'テニス.txt': 'テニス',
    '野球.txt': '野球',
    'スポーツウェア.txt': 'スポーツウェア',
    '着物.txt': '着物',
    '日本刀.txt': '日本刀',
    '日本伝統・骨董.txt': '日本伝統・骨董',
    'アート.txt': 'アート',
    'パイプ・喫煙具.txt': 'パイプ・喫煙具',
}


def escape_for_js(content: str) -> str:
    """JavaScript文字列用にエスケープ (convert_html_to_gs.py と同等)

    - バックスラッシュを先にエスケープ
    - シングルクォートをエスケープ
    - 改行 (\n) を \n に、\r は除去
    """
    content = content.replace('\\', '\\\\')
    content = content.replace("'", "\\'")
    content = content.replace('\n', '\\n')
    content = content.replace('\r', '')
    return content


_VERSION_RE = re.compile(r"^//\s*VERSION:\s*(\d+)\s*$")


def read_prompt_file(path: str) -> Tuple[int, str, List[str]]:
    """ファイルを読み込み、(version, body, warnings) を返す。

    - 先頭行が "// VERSION: N" なら N を採用し、その行は本文から除外
    - 先頭行が VERSION でない場合は version=1 とし、警告を返す
    """
    warnings: List[str] = []
    with open(path, 'r', encoding='utf-8') as f:
        raw = f.read()

    # 行単位で処理
    lines = raw.splitlines()
    if not lines:
        return 0, '', warnings  # 後続の検証でエラーにする

    m = _VERSION_RE.match(lines[0].strip())
    if m:
        version = int(m.group(1))
        body = '\n'.join(lines[1:])
    else:
        version = 1
        body = '\n'.join(lines)
        warnings.append('VERSION comment not found; defaulting version=1')

    return version, body, warnings


def validate_configuration(prompt_dir: str) -> List[str]:
    """事前検証。エラーがあれば文字列リストで返す。"""
    errors: List[str] = []

    # 重複IDチェック
    ids = list(FILE_TO_ID.values())
    dup_ids = {pid for pid in ids if ids.count(pid) > 1}
    if dup_ids:
        errors.append(f"Duplicate prompt IDs detected: {', '.join(sorted(dup_ids))}")

    # ファイル存在チェック
    for filename in FILE_TO_ID.keys():
        path = os.path.join(prompt_dir, filename)
        if not os.path.exists(path):
            errors.append(f"Missing file: {path}")

    return errors


def convert_to_gs(prompt_dir: str) -> str:
    """プロンプトファイル群をGSコード文字列に変換。厳格検証を実施。"""
    errors = validate_configuration(prompt_dir)
    all_warnings: List[str] = []

    if errors:
        for e in errors:
            print(f"ERROR: {e}")
        raise SystemExit(1)

    lines: List[str] = []
    lines.append('''/******************************************************\n * PromptTemplates.gs - プロンプトテンプレート文字列\n *\n * ライブラリ内でプロンプトを使用するため、文字列として埋め込み\n ******************************************************/\n\nvar PROMPT_TEMPLATES = {};\n''')

    # 各ファイル処理
    for filename, prompt_id in FILE_TO_ID.items():
        path = os.path.join(prompt_dir, filename)
        # read and parse
        version, body, warnings = read_prompt_file(path)
        for w in warnings:
            all_warnings.append(f"{filename}: {w}")

        # 本文空チェック（VERSION行除外後で判定）
        if body.strip() == '':
            print(f"ERROR: Empty content after version line removal: {path}")
            raise SystemExit(1)

        escaped = escape_for_js(body)
        lines.append(
            f"\nPROMPT_TEMPLATES['{prompt_id}'] = {{ version: {version}, content: '{escaped}' }};\n"
        )
        print(f"Converted: {filename} -> '{prompt_id}' (version {version}, {len(body)} bytes)")

    # ヘルパー関数
    lines.append('''\n// ヘルパー関数\nfunction getPromptTemplate(promptId) {\n  return PROMPT_TEMPLATES[promptId] || null;\n}\n\nfunction getAllPromptTemplateIds() {\n  return Object.keys(PROMPT_TEMPLATES);\n}\n''')

    # 警告の出力（最後にまとめて表示）
    if all_warnings:
        print('\nWarnings:')
        for w in all_warnings:
            print(f"- {w}")

    return '\n'.join(lines)


if __name__ == '__main__':
    # 既定ディレクトリ/出力パス（引数なしで動作）
    prompt_dir = '/Users/naokijodan/Desktop/ツール開発/一括シートApps_v3/prompts'
    output_path = '/Users/naokijodan/Desktop/ツール開発/一括シートApps_v3/Library/PromptTemplates.gs'

    result = convert_to_gs(prompt_dir)

    # 出力
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(result)

    print(f"\nOutput written to: {output_path}")
    print(f"Total size: {len(result)} bytes")
