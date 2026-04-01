#!/usr/bin/env python3
"""
prompts/*.txt → Library/PromptTemplates.gs 同期スクリプト

prompts/ フォルダ内のプロンプトファイルを読み込み、
PromptTemplates.gs 内の対応するテンプレートを更新する。

使い方:
  python3 Library/sync_prompts_to_gs.py

  # 特定のプロンプトだけ更新
  python3 Library/sync_prompts_to_gs.py 時計用

  # ドライラン（変更を確認するだけ）
  python3 Library/sync_prompts_to_gs.py --dry-run
"""

import os
import re
import sys

# プロジェクトルート
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PROMPTS_DIR = os.path.join(PROJECT_ROOT, 'prompts')
TEMPLATES_GS = os.path.join(PROJECT_ROOT, 'Library', 'PromptTemplates.gs')


def escape_for_js_single_quote(text):
    """テキストをJS のシングルクォート文字列リテラル用にエスケープする。

    処理順序が重要:
    1. バックスラッシュ（既存の \\ を \\\\ に）
    2. シングルクォート（' を \\' に）
    3. 改行（実際の改行を \\n リテラルに）
    4. CR除去
    """
    text = text.replace('\\', '\\\\')
    text = text.replace("'", "\\'")
    # 行ごとに分割して \\n で結合（確実に1行にする）
    lines = text.split('\n')
    result = '\\n'.join(line.rstrip('\r') for line in lines)
    return result


def read_prompt_file(filepath):
    """プロンプトファイルを読み込む"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def read_templates_gs():
    """PromptTemplates.gs を読み込む"""
    with open(TEMPLATES_GS, 'r', encoding='utf-8') as f:
        return f.readlines()


def get_current_version(gs_line, prompt_name):
    """既存テンプレート行からバージョン番号を取得"""
    pattern = r"PROMPT_TEMPLATES\['" + re.escape(prompt_name) + r"'\]\s*=\s*\{\s*version:\s*(\d+)"
    match = re.search(pattern, gs_line)
    if match:
        return int(match.group(1))
    return 0


def build_template_line(prompt_name, content, version):
    """テンプレート行を構築する"""
    escaped = escape_for_js_single_quote(content)
    return "PROMPT_TEMPLATES['" + prompt_name + "'] = { version: " + str(version) + ", content: '" + escaped + "' };\n"


def sync_prompt(prompt_name, dry_run=False):
    """指定プロンプトを PromptTemplates.gs に同期する"""
    prompt_file = os.path.join(PROMPTS_DIR, prompt_name + '.txt')
    if not os.path.exists(prompt_file):
        print(f"  ERROR: {prompt_file} が見つかりません")
        return False

    content = read_prompt_file(prompt_file)
    gs_lines = read_templates_gs()

    found = False
    new_lines = []
    for line in gs_lines:
        if line.startswith("PROMPT_TEMPLATES['" + prompt_name + "']"):
            found = True
            old_version = get_current_version(line, prompt_name)
            new_version = old_version + 1
            new_line = build_template_line(prompt_name, content, new_version)

            if line.rstrip('\n') == new_line.rstrip('\n'):
                print(f"  {prompt_name}: 変更なし（v{old_version}）")
                return True

            print(f"  {prompt_name}: v{old_version} → v{new_version}")
            print(f"    ファイル: {len(content)} 文字")
            print(f"    エスケープ後: {len(new_line)} 文字（1行）")

            # 改行が混入していないことを検証
            if '\n' in new_line.rstrip('\n'):
                print(f"  ERROR: エスケープ後の文字列に改行が混入しています！")
                return False

            new_lines.append(new_line)
        else:
            new_lines.append(line)

    if not found:
        print(f"  WARNING: PromptTemplates.gs に '{prompt_name}' が見つかりません。新規追加します。")
        # var PROMPT_TEMPLATES = {}; の後に追加
        insert_lines = []
        for i, line in enumerate(new_lines):
            insert_lines.append(line)
            if line.strip() == 'var PROMPT_TEMPLATES = {};':
                new_line = '\n' + build_template_line(prompt_name, content, 1)
                insert_lines.append(new_line)
                print(f"  {prompt_name}: 新規追加 v1")
        new_lines = insert_lines

    if dry_run:
        print(f"  (ドライラン: 書き込みスキップ)")
        return True

    # 原子的書き込み（途中クラッシュでのファイル破損を防止）
    tmp_path = TEMPLATES_GS + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    os.replace(tmp_path, TEMPLATES_GS)

    return True


def list_prompts():
    """prompts/ フォルダ内のプロンプトファイル一覧"""
    if not os.path.exists(PROMPTS_DIR):
        return []
    return [f.replace('.txt', '') for f in sorted(os.listdir(PROMPTS_DIR)) if f.endswith('.txt')]


def main():
    args = sys.argv[1:]
    dry_run = '--dry-run' in args
    if dry_run:
        args.remove('--dry-run')

    if dry_run:
        print("=== ドライランモード ===\n")

    # 特定プロンプトの指定がある場合
    if args:
        targets = args
    else:
        # 引数なし: PromptTemplates.gs に既に登録されているプロンプトのみ更新
        gs_lines = read_templates_gs()
        targets = []
        for line in gs_lines:
            match = re.match(r"PROMPT_TEMPLATES\['(.+?)'\]", line)
            if match:
                name = match.group(1)
                prompt_file = os.path.join(PROMPTS_DIR, name + '.txt')
                if os.path.exists(prompt_file):
                    targets.append(name)

    if not targets:
        print("同期対象のプロンプトがありません。")
        print(f"\nprompts/ フォルダ内: {list_prompts()}")
        return

    print(f"同期対象: {len(targets)} 件\n")

    success = 0
    for name in targets:
        if sync_prompt(name, dry_run=dry_run):
            success += 1

    print(f"\n完了: {success}/{len(targets)} 件成功")

    if not dry_run and success > 0:
        print(f"\n次のステップ:")
        print(f"  cd Library && clasp push")
        print(f"  スプレッドシートで初期設定メニューを実行")


if __name__ == '__main__':
    main()
