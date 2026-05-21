/**
 * eBay Translation Skill — ライブラリ側ロジック (BulkToolsLib 公開関数)
 *
 * 設計原則 (一括シートV3 CLAUDE.md 準拠):
 *  - HTML 文字列 → ホスト側で showModalDialog(html) で表示 (Library 内で UI 表示しない)
 *  - HtmlService.createHtmlOutput(string) のみ使用 (createTemplateFromFile はライブラリ内で不安定)
 *  - PropertiesService.getDocumentProperties() のみ使用 (ScriptProperties はライブラリ非対応)
 *
 * シート本体側 (コード_Part3 の薄いラッパー) からの呼出例:
 *   var html = BulkToolsLib.buildEbayTranslationSettingsHtml();
 *   SpreadsheetApp.getUi().showModalDialog(html, 'eBay 翻訳 (AI) 設定');
 */

// ============================================================================
// 定数
// ============================================================================
var EBAY_TRANSLATION_PROPS = {
  TAG_SHEET:    'EBAY_TRANSLATION_TAG_SHEET',
  TARGET_SHEET: 'EBAY_TRANSLATION_TARGET_SHEET',
  SOURCE_SHEET: 'EBAY_TRANSLATION_SOURCE_SHEET',
  SKILL_NAME:   'EBAY_TRANSLATION_SKILL_NAME',
  BATCH_SIZE:   'EBAY_TRANSLATION_BATCH_SIZE',
  OPERATOR:     'EBAY_TRANSLATION_OPERATOR'
};

var EBAY_TRANSLATION_DEFAULTS = {
  TAG_SHEET:    'TagShipping',
  TARGET_SHEET: 'v5インポート',
  SOURCE_SHEET: 'インポート用',
  SKILL_NAME:   'ebay-translation',
  BATCH_SIZE:   20,
  OPERATOR:     'AI'
};

// ============================================================================
// 公開関数 — 設定ダイアログ HTML
// ============================================================================
function buildEbayTranslationSettingsHtml() {
  var cur = {
    tagSheet:    getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TAG_SHEET, EBAY_TRANSLATION_DEFAULTS.TAG_SHEET),
    targetSheet: getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TARGET_SHEET, EBAY_TRANSLATION_DEFAULTS.TARGET_SHEET),
    sourceSheet: getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SOURCE_SHEET, EBAY_TRANSLATION_DEFAULTS.SOURCE_SHEET),
    skillName:   getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SKILL_NAME, EBAY_TRANSLATION_DEFAULTS.SKILL_NAME),
    batchSize:   getEbayTranslationNumericSetting_(EBAY_TRANSLATION_PROPS.BATCH_SIZE, EBAY_TRANSLATION_DEFAULTS.BATCH_SIZE, 1, 50),
    operator:    getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.OPERATOR, EBAY_TRANSLATION_DEFAULTS.OPERATOR)
  };
  var escapeAttr = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };
  return HtmlService.createHtmlOutput(
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; }' +
    'h3 { margin-top: 0; }' +
    'label { display: block; font-size: 13px; color: #333; margin-top: 12px; }' +
    'input { width: 100%; padding: 6px 8px; font-size: 14px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }' +
    '.hint { color: #888; font-size: 12px; margin-top: 2px; }' +
    'button { font-size: 14px; padding: 8px 16px; margin: 16px 8px 0 0; cursor: pointer; }' +
    '.primary { background: #1a73e8; color: white; border: none; border-radius: 4px; }' +
    '.cancel { background: #eee; border: 1px solid #ccc; border-radius: 4px; }' +
    '.error { color: #d93025; font-size: 13px; margin-top: 8px; display: none; }' +
    '</style>' +
    '<h3>⚙️ eBay 翻訳 (AI) 設定</h3>' +
    '<div class="hint">スプレッドシート ID はアクティブなシートから自動取得します (入力不要)。</div>' +
    '<label>タグ参照シート名</label>' +
    '<input type="text" id="tagSheet" value="' + escapeAttr(cur.tagSheet) + '">' +
    '<label>書込先シート名</label>' +
    '<input type="text" id="targetSheet" value="' + escapeAttr(cur.targetSheet) + '">' +
    '<label>ソースシート名</label>' +
    '<input type="text" id="sourceSheet" value="' + escapeAttr(cur.sourceSheet) + '">' +
    '<label>Skill 名 (Codex / Claude / Gemini で登録した名前)</label>' +
    '<input type="text" id="skillName" value="' + escapeAttr(cur.skillName) + '">' +
    '<label>担当者名 (v5インポート B 列に書き込む値、例: Claude / Codex / Gemini / 自分の名前)</label>' +
    '<input type="text" id="operator" value="' + escapeAttr(cur.operator) + '">' +
    '<label>集約バッチサイズ (1-50)</label>' +
    '<input type="number" id="batchSize" min="1" max="50" step="1" value="' + cur.batchSize + '">' +
    '<div class="error" id="error"></div>' +
    '<div style="margin-top: 8px;">' +
    '  <button class="primary" onclick="submitForm()">保存</button>' +
    '  <button class="cancel" onclick="google.script.host.close()">キャンセル</button>' +
    '</div>' +
    '<script>' +
    'function submitForm() {' +
    '  var data = {' +
    '    tagSheet: document.getElementById("tagSheet").value.trim(),' +
    '    targetSheet: document.getElementById("targetSheet").value.trim(),' +
    '    sourceSheet: document.getElementById("sourceSheet").value.trim(),' +
    '    skillName: document.getElementById("skillName").value.trim(),' +
    '    operator: document.getElementById("operator").value.trim(),' +
    '    batchSize: parseInt(document.getElementById("batchSize").value, 10)' +
    '  };' +
    '  var err = document.getElementById("error");' +
    '  err.style.display = "none";' +
    '  if (!data.tagSheet || !data.targetSheet || !data.sourceSheet || !data.skillName || !data.operator) {' +
    '    err.innerText = "シート名 / Skill 名 / 担当者名は空にできません";' +
    '    err.style.display = "block"; return;' +
    '  }' +
    '  if (isNaN(data.batchSize) || data.batchSize < 1 || data.batchSize > 50) {' +
    '    err.innerText = "バッチサイズは 1-50 の整数で入力してください";' +
    '    err.style.display = "block"; return;' +
    '  }' +
    '  google.script.run.withSuccessHandler(function(){ google.script.host.close(); })' +
    '    .withFailureHandler(function(e){ err.innerText = "保存失敗: " + (e && e.message ? e.message : e); err.style.display = "block"; })' +
    '    .saveEbayTranslationSettings(data);' +
    '}' +
    '</script>'
  ).setWidth(480).setHeight(620);
}

// ============================================================================
// 公開関数 — 指示文生成ダイアログ HTML
// ============================================================================
function buildEbayTranslationGeneratorHtml() {
  var sel = getEbayTranslationSelectedRange();
  var sheetName = sel.sheetName || '(シート未選択)';
  var startRow = sel.startRow || 4;
  var endRow = sel.endRow || 4;
  var sourceSheet = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SOURCE_SHEET, EBAY_TRANSLATION_DEFAULTS.SOURCE_SHEET);
  var sheetWarning = (sheetName !== sourceSheet) ? '<div class="warn">⚠ 現在 "' + sheetName + '" シートが選択されています。本来のソースシートは "' + sourceSheet + '" です。続行する場合は対象行範囲を確認してください。</div>' : '';

  return HtmlService.createHtmlOutput(
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; }' +
    'h3 { margin-top: 0; }' +
    '.info { color: #555; font-size: 13px; margin-bottom: 8px; }' +
    '.row { margin-top: 12px; }' +
    'label { display: inline-block; font-size: 13px; color: #333; width: 80px; }' +
    'input[type=number] { width: 100px; padding: 6px 8px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; }' +
    '.count { color: #555; font-size: 13px; margin-left: 12px; }' +
    'button { font-size: 14px; padding: 8px 16px; margin: 12px 8px 0 0; cursor: pointer; }' +
    '.primary { background: #1a73e8; color: white; border: none; border-radius: 4px; }' +
    '.cancel { background: #eee; border: 1px solid #ccc; border-radius: 4px; }' +
    '.warn { background: #fff8e1; border: 1px solid #f9a825; color: #6f4d00; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 13px; }' +
    '.result { margin-top: 20px; display: none; }' +
    'textarea { width: 100%; height: 260px; font-family: Menlo, monospace; font-size: 12px; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }' +
    '.toast { color: #34a853; font-size: 13px; margin-top: 8px; display: none; }' +
    '.error { color: #d93025; font-size: 13px; margin-top: 8px; display: none; }' +
    '</style>' +
    '<h3>📋 選択行の翻訳指示文を作成</h3>' +
    '<div class="info">現在の選択範囲: <b>' + sheetName + '</b> シート (Row ' + startRow + '-' + endRow + ')</div>' +
    sheetWarning +
    '<div class="row">' +
    '  <label>開始行:</label>' +
    '  <input type="number" id="startRow" min="3" step="1" value="' + startRow + '">' +
    '</div>' +
    '<div class="row">' +
    '  <label>終了行:</label>' +
    '  <input type="number" id="endRow" min="3" step="1" value="' + endRow + '">' +
    '  <span class="count" id="count">対象行数: ' + (endRow - startRow + 1) + ' 件</span>' +
    '</div>' +
    '<div class="error" id="error"></div>' +
    '<div>' +
    '  <button class="primary" onclick="generate()">生成</button>' +
    '  <button class="cancel" onclick="google.script.host.close()">閉じる</button>' +
    '</div>' +
    '<div class="result" id="result">' +
    '  <h3>生成された指示文</h3>' +
    '  <textarea id="instr" readonly></textarea>' +
    '  <div>' +
    '    <button class="primary" onclick="copyResult()">📋 クリップボードにコピー</button>' +
    '  </div>' +
    '  <div class="toast" id="toast"></div>' +
    '</div>' +
    '<script>' +
    'function updateCount() {' +
    '  var s = parseInt(document.getElementById("startRow").value, 10);' +
    '  var e = parseInt(document.getElementById("endRow").value, 10);' +
    '  var c = (isNaN(s) || isNaN(e) || e < s) ? "-" : (e - s + 1);' +
    '  document.getElementById("count").innerText = "対象行数: " + c + " 件";' +
    '}' +
    'document.getElementById("startRow").addEventListener("input", updateCount);' +
    'document.getElementById("endRow").addEventListener("input", updateCount);' +
    'function generate() {' +
    '  var s = parseInt(document.getElementById("startRow").value, 10);' +
    '  var e = parseInt(document.getElementById("endRow").value, 10);' +
    '  var err = document.getElementById("error");' +
    '  err.style.display = "none";' +
    '  if (isNaN(s) || s < 3) { err.innerText = "開始行は 3 以上の整数"; err.style.display="block"; return; }' +
    '  if (isNaN(e) || e < s) { err.innerText = "終了行は開始行以上の整数"; err.style.display="block"; return; }' +
    '  google.script.run' +
    '    .withSuccessHandler(function(text){' +
    '      document.getElementById("instr").value = text;' +
    '      document.getElementById("result").style.display = "block";' +
    '    })' +
    '    .withFailureHandler(function(e2){' +
    '      err.innerText = "生成失敗: " + (e2 && e2.message ? e2.message : e2);' +
    '      err.style.display = "block";' +
    '    })' +
    '    .generateEbayTranslationInstruction(s, e);' +
    '}' +
    'function copyResult() {' +
    '  var ta = document.getElementById("instr");' +
    '  ta.select();' +
    '  ta.setSelectionRange(0, ta.value.length);' +
    '  try {' +
    '    navigator.clipboard.writeText(ta.value).then(function(){ showToast(); });' +
    '  } catch(e) {' +
    '    document.execCommand("copy"); showToast();' +
    '  }' +
    '}' +
    'function showToast() {' +
    '  var t = document.getElementById("toast");' +
    '  t.innerText = "✓ コピーしました。Codex / Claude / Gemini に貼り付けてください";' +
    '  t.style.display = "block";' +
    '}' +
    '</script>'
  ).setWidth(620).setHeight(620);
}

// ============================================================================
// 公開関数 — スキル本文ダウンロードダイアログ HTML
// ============================================================================
function buildEbayTranslationSkillDownloadHtml() {
  var content = getEbayTranslationSkillContent();
  var safe = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return HtmlService.createHtmlOutput(
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; }' +
    'h3 { margin-top: 0; }' +
    '.hint { color: #555; font-size: 13px; margin-bottom: 12px; }' +
    'textarea { width: 100%; height: 300px; font-family: Menlo, monospace; font-size: 12px; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }' +
    'button { font-size: 14px; padding: 8px 16px; margin: 12px 8px 0 0; cursor: pointer; }' +
    '.primary { background: #1a73e8; color: white; border: none; border-radius: 4px; }' +
    '.cancel { background: #eee; border: 1px solid #ccc; border-radius: 4px; }' +
    '.toast { color: #34a853; font-size: 13px; margin-top: 12px; display: none; }' +
    '</style>' +
    '<h3>📄 eBay Translation Skill 本文</h3>' +
    '<div class="hint">下のテキストを Codex app / Claude Code / Gemini CLI にスキルとして登録してください。<br>' +
    '・Codex app: 「Skills」設定で新規 Skill 作成 → 本文を貼り付け<br>' +
    '・Claude Code: <code>~/.claude/skills/ebay-translation/SKILL.md</code> に保存<br>' +
    '・Gemini CLI: skill フォルダにファイル配置 (公式仕様要確認)</div>' +
    '<textarea id="skill" readonly>' + safe + '</textarea>' +
    '<button class="primary" onclick="downloadSkill()">📥 ファイルとしてダウンロード (ebay-translation-skill.md)</button>' +
    '<button onclick="copySkill()">📋 クリップボードにコピー</button>' +
    '<button class="cancel" onclick="google.script.host.close()">閉じる</button>' +
    '<div id="toast" class="toast"></div>' +
    '<script>' +
    'function downloadSkill() {' +
    '  var content = document.getElementById("skill").value;' +
    '  var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });' +
    '  var url = URL.createObjectURL(blob);' +
    '  var a = document.createElement("a");' +
    '  a.href = url;' +
    '  a.download = "ebay-translation-skill.md";' +
    '  document.body.appendChild(a);' +
    '  a.click();' +
    '  document.body.removeChild(a);' +
    '  URL.revokeObjectURL(url);' +
    '  showToast("✓ ダウンロードしました (ダウンロードフォルダ確認)");' +
    '}' +
    'function copySkill() {' +
    '  var ta = document.getElementById("skill");' +
    '  ta.select();' +
    '  ta.setSelectionRange(0, ta.value.length);' +
    '  try {' +
    '    navigator.clipboard.writeText(ta.value).then(function(){ showToast("✓ コピーしました"); });' +
    '  } catch(e) {' +
    '    document.execCommand("copy");' +
    '    showToast("✓ コピーしました");' +
    '  }' +
    '}' +
    'function showToast(msg) {' +
    '  var t = document.getElementById("toast");' +
    '  t.innerText = msg; t.style.display = "block";' +
    '}' +
    '</script>'
  ).setWidth(700).setHeight(560);
}

// ============================================================================
// 公開関数 — 設定保存 (HTML フォームから google.script.run で呼ばれる)
// ============================================================================
function saveEbayTranslationSettings(form) {
  var props = PropertiesService.getDocumentProperties();
  props.setProperty(EBAY_TRANSLATION_PROPS.TAG_SHEET, String(form.tagSheet));
  props.setProperty(EBAY_TRANSLATION_PROPS.TARGET_SHEET, String(form.targetSheet));
  props.setProperty(EBAY_TRANSLATION_PROPS.SOURCE_SHEET, String(form.sourceSheet));
  props.setProperty(EBAY_TRANSLATION_PROPS.SKILL_NAME, String(form.skillName));
  props.setProperty(EBAY_TRANSLATION_PROPS.OPERATOR, String(form.operator));
  var n = parseInt(form.batchSize, 10);
  if (isNaN(n) || n < 1 || n > 50) n = EBAY_TRANSLATION_DEFAULTS.BATCH_SIZE;
  props.setProperty(EBAY_TRANSLATION_PROPS.BATCH_SIZE, String(n));
  return { ok: true };
}

// ============================================================================
// 公開関数 — 現在の設定を文字列で返す (ホスト側で ui.alert)
// ============================================================================
function getEbayTranslationCurrentSettingsText() {
  return '現在の設定\n\n' +
    'スプレッドシート ID: ' + SpreadsheetApp.getActiveSpreadsheet().getId() + '\n' +
    'タグ参照シート: ' + getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TAG_SHEET, EBAY_TRANSLATION_DEFAULTS.TAG_SHEET) + '\n' +
    '書込先シート: ' + getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TARGET_SHEET, EBAY_TRANSLATION_DEFAULTS.TARGET_SHEET) + '\n' +
    'ソースシート: ' + getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SOURCE_SHEET, EBAY_TRANSLATION_DEFAULTS.SOURCE_SHEET) + '\n' +
    'Skill 名: ' + getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SKILL_NAME, EBAY_TRANSLATION_DEFAULTS.SKILL_NAME) + '\n' +
    '担当者名: ' + getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.OPERATOR, EBAY_TRANSLATION_DEFAULTS.OPERATOR) + '\n' +
    'バッチサイズ: ' + getEbayTranslationNumericSetting_(EBAY_TRANSLATION_PROPS.BATCH_SIZE, EBAY_TRANSLATION_DEFAULTS.BATCH_SIZE, 1, 50);
}

// ============================================================================
// 公開関数 — 指示文生成 (HTML フォームから google.script.run で呼ばれる)
// ============================================================================
function generateEbayTranslationInstruction(startRow, endRow, doGetUrl, doGetKey) {
  return buildEbayTranslationInstruction_(parseInt(startRow, 10), parseInt(endRow, 10), doGetUrl, doGetKey);
}

// ============================================================================
// 公開関数 — 現在の選択範囲
// ============================================================================
function getEbayTranslationSelectedRange() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var range = sheet.getActiveRange();
    if (!range) return {};
    return {
      sheetName: sheet.getName(),
      startRow: range.getRow(),
      endRow: range.getRow() + range.getNumRows() - 1
    };
  } catch (e) {
    return {};
  }
}

// ============================================================================
// 内部ヘルパー — 指示文の組立
// ============================================================================
function buildEbayTranslationInstruction_(startRow, endRow, doGetUrl, doGetKey) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var spreadsheetId = ss.getId();
  var tagSheet = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TAG_SHEET, EBAY_TRANSLATION_DEFAULTS.TAG_SHEET);
  var targetSheet = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.TARGET_SHEET, EBAY_TRANSLATION_DEFAULTS.TARGET_SHEET);
  var sourceSheet = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SOURCE_SHEET, EBAY_TRANSLATION_DEFAULTS.SOURCE_SHEET);
  var skillName = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.SKILL_NAME, EBAY_TRANSLATION_DEFAULTS.SKILL_NAME);
  var batchSize = getEbayTranslationNumericSetting_(EBAY_TRANSLATION_PROPS.BATCH_SIZE, EBAY_TRANSLATION_DEFAULTS.BATCH_SIZE, 1, 50);
  var operator = getEbayTranslationSetting_(EBAY_TRANSLATION_PROPS.OPERATOR, EBAY_TRANSLATION_DEFAULTS.OPERATOR);

  // doGet URL/キーは host(Main.js wrapper) が IMG_DOGET_URL/KEY を読んで渡す
  // (host/library で DocumentProperties 名前空間が別のため)。指示文にこのシートの URL を埋め込む。
  var imgUrl = (doGetUrl && /^https:\/\//i.test(String(doGetUrl).trim())) ? String(doGetUrl).trim().replace(/\/+$/, '') : '';
  var imgLines = imgUrl
    ? (doGetKey ? ['doGet URL: ' + imgUrl, 'doGet キー: ' + doGetKey] : ['doGet URL: ' + imgUrl])
    : ['doGet URL: (未登録) ← シートの webhook を ?action=registerSelfUrl で 1 回叩いて登録してください'];

  return [
    'Skill "' + skillName + '" を実行してください。',
    '',
    'スプレッドシート ID: ' + spreadsheetId,
    'ソースシート名: ' + sourceSheet,
    '書込先シート名: ' + targetSheet,
    'タグ参照シート名: ' + tagSheet,
    '対象行範囲: ' + startRow + '-' + endRow,
    '集約バッチサイズ: ' + batchSize,
    '担当者名: ' + operator
  ].concat(imgLines).concat([
    '',
    '画像も使って Title / Item Specifics / Description の正確性を高めてください。',
    'タグ判定は ' + tagSheet + ' シートの A 列許可リストから 1 つだけ選んでください (画像は使わない)。',
    'A 列に今日の日付 (YYYY/MM/DD)、B 列に上記の「担当者名」を必ず書いてください。'
  ]).join('\n');
}

// ============================================================================
// 公開関数 — スキル本文 (~/Desktop/gemini-sheets-tool/ebay-translation-skill.md と同じ)
// ============================================================================
function getEbayTranslationSkillContent() {
  // スキル本体は汎用。doGet URL は実行依頼(指示文)のパラメータで受け取り、固定 URL は持たない。
  // ★スキル本文を変えたら CHANGELOG の先頭に {date, text} を1件追加(新しい順・事実を正確に)。
  //   バージョンは先頭エントリの日付から自動生成。変更履歴は HTMLコメント + 区切り線の「上」に
  //   置く＝(1)実行AIはコメントを命令と読まない (2)区切り線より下だけ登録すれば本文に履歴は入らない。
  var CHANGELOG = [
    { date: '2026-05-22', text: 'doGet URL を「スキル本体に固定」→「指示文(実行依頼)に埋め込み」へ訂正（1 スキルで複数シート対応）' },
    { date: '2026-05-22', text: 'doGet URL を IMG_DOGET_URL から取得し指示文へ自動埋め込み（手入力廃止）' },
    { date: '2026-05-21', text: 'doGet 経由（メルカリ非経由）で画像を取得する方式を追加' }
  ];
  var version = (CHANGELOG[0] && CHANGELOG[0].date) ? CHANGELOG[0].date : '';
  var historyBlock = ['<!-- 【変更履歴】人向けメモ。スキル実行には影響しません（新規の方は読み飛ばして OK ／ 更新の方はここで変更点を確認）。']
    .concat(CHANGELOG.map(function (c) { return '- ' + c.date + ': ' + c.text; }))
    .concat(['-->']);
  return historyBlock.concat([
    '======================（ここから下をコピーしてスキルに登録）======================',
    '',
    '# eBay Translation Skill',
    '',
    'バージョン: ' + version,
    '',
    '日本の商品データ (テキスト + 画像) を英語の eBay 出品データに変換し、Google スプレッドシートに書き戻す。Codex app / Claude Code / Gemini CLI で共通使用可能。',
    '',
    '## 実行モード (最優先)',
    '',
    '- **全工程を確認なしで一気通貫で実行**。途中で「これを実行してよいか」「次に進むか」は聞かない。',
    '- 完了後の報告は **「完了。確認お願いします」の 1 行のみ**。詳細な件数や成功/失敗のリストは不要 (ユーザーがシートで直接確認する)。',
    '- 重大エラー (シート不存在 / 連続失敗) のみ短く報告して停止。',
    '',
    '## 翻訳に使う AI (絶対遵守)',
    '',
    '- **このスキルを実行している AI 自身のマルチモーダル能力で翻訳する**。他の AI を経由しない。',
    '  - Codex app / CLI で実行中 → GPT-5.5 (Codex 本体) で翻訳',
    '  - **Claude Code で実行中 → Claude 自身 (マルチモーダル) で翻訳。MCP openai-bridge / anthropic-bridge / gemini-bridge 等の他 AI 呼出を絶対に使わない**',
    '  - Gemini CLI で実行中 → Gemini 自身で翻訳',
    '- 「OpenAI API を呼ぶ」「Gemini API を呼ぶ」のような外部 AI API 呼出は禁止。実行 AI が自分の能力で読込・翻訳・書込を完結させる。',
    '',
    '## 画像入力 (メルカリ非経由 / doGet 経由)',
    '',
    '商品画像は **ユーザーの GAS Web アプリ (doGet) から base64 で取得**する。これでメルカリ (static.mercdn.net) へ自動アクセスせずに翻訳できる。MCP/REST ではセル内画像が空で返るため、画像取得は必ず doGet を使う。',
    '',
    '- **呼び出し**: `{doGet URL}?action=getImages&sheet={ソースシート名}&startRow={開始行}&numRows={件数}&maxImages={枚数}` (指示文に `doGet キー` があれば `&key=<キー>` も付ける)',
    '  - `{doGet URL}` は実行依頼(指示文)のパラメータで渡される (= とりこみ君 webhook と同じ /exec)。スキル本体に固定 URL は持たない。',
    '  - `numRows × maxImages ≤ 30` に収める (doGet 側の上限)。超える場合は `startRow` をずらして分割して呼ぶ。',
    '- **レスポンス (JSON)**: `{ "ok": true, "rows": [ { "row": 12, "safeImages": ["data:image/jpeg;base64,..."], "mercariUrls": ["https://static.mercdn.net/..."] } ] }`',
    '- **使い方 (行ごと)**:',
    '  - `safeImages` (base64 data URL) があれば、**それだけを** vision に渡す (= メルカリ非経由)。',
    '  - `safeImages` が空の行**だけ** `mercariUrls` の URL を使う (その行のみメルカリアクセスが発生)。',
    '- **vision への渡し方 (実行環境別)**:',
    '  - Codex CLI / Gemini CLI: base64 の data URL を image_url にそのまま渡す。',
    '  - Claude Code: base64 を一時ファイル (例 `/tmp/img_{row}_{n}.jpg`) に保存し、Read ツールで読む。',
    '- **禁止**: `safeImages` がある行で =IMAGE のメルカリ URL を使うこと。doGet を介さず直接メルカリ URL を vision に渡すこと。',
    '- **doGet URL が指示文に無ければエラーで停止する。=IMAGE のメルカリ URL に勝手に落とさない。**',
    '',
    '## 必要な接続',
    '',
    '- **MCP google-sheets** (各 AI 環境で接続済み前提。テキスト読込・結果書込に使う)',
    '- **インターネット接続 / HTTP 取得** (doGet URL を叩いて画像を base64 取得するため。curl / WebFetch 等)',
    '',
    '## ユーザーが渡すパラメータ',
    '',
    '- スプレッドシート ID',
    '- ソースシート名 (例: インポート用)',
    '- 書込先シート名 (例: v5インポート)',
    '- タグ参照シート名 (例: TagShipping)',
    '- **対象行範囲 (例: 4-23)** ← これは **ソースシートの行範囲**。書込先シートの行範囲ではない',
    '- 集約バッチサイズ (例: 20)',
    '- **担当者名 (例: Claude / Codex / Gemini / 自分の名前)** ← 書込先 B 列に書く文字列',
    '- **doGet URL** ← 実行依頼(指示文)で渡される。とりこみ君 webhook と同じ /exec。メルカリ非経由で画像を取得 (スキル本体に固定 URL は持たない)',
    '',
    '## 書込位置のルール (絶対遵守)',
    '',
    '- **対象行範囲はソースシートの行範囲のみ**を指す。書込先シートの位置とは無関係。',
    '- 書込先シートには **H 列 (仕入れ先コード列) が空の最初の行** を毎バッチ再取得して特定し、その行から順次書き込む。',
    '- **絶対に書込先シートの既存データを上書きしない**。既存行は H 列が埋まっているのでスキップされる。',
    '- 例: ソース 4-23 (20 件) を読込、書込先で H 列空が L57 → L57 から L76 に書く。',
    '',
    '## ソースシート構造 (3 行目以降)',
    '',
    '| 列 | 内容 |',
    '|---|---|',
    '| B | プラットフォーム / C 商品 ID / D 価格 / E 日本語 title / F 日本語説明 / G 出品者 / H URL / I-R 商品画像1〜10 (※この列は MCP で直接読まない。画像は doGet で取得。セル内画像=安全 / =IMAGE=メルカリ) |',
    '',
    '## 書込先シート構造 (3 行目以降)',
    '',
    'A 日付 / B 担当 / C label / **D タグ** / E テンプレ / F カテゴリID / G 仕入れ先 / **H 仕入れ先コード** (空行探索キー) / I 仕入れ価格 / J 日本語 title / K 商品説明 / L セラーID / **M Title** (英語 80 字内) / **N Condition/Description** (英語 480 字内) / O シッピング / **P-BC ISF1-IS値20** (20 ペア) / BD 重複チェック',
    '',
    '## 出力 JSON (各商品)',
    '',
    '```json',
    '{',
    '  "title": "string (80 字以内、英語)",',
    '  "description": "string (480 字以内、ASCII)",',
    '  "itemSpecifics": { "<項目名>": "<値>" },',
    '  "recommendedUserTags": ["string"],',
    '  "warnings": ["string"]',
    '}',
    '```',
    '',
    '## ルール (必須)',
    '',
    '- **TITLE**: 80 字以内。最初の 30 字に高価値キーワード。許可記号 `& / : - . ,` (+ TCG・グレード等で `# \' +`)。禁止記号 `* $ ~ ^ @ ! ? ™ ( ) [ ] { } " _ % = | \\ < > ;`。VeRO 抵触語 (AUTHENTIC/OFFICIAL) 禁止、捏造 (RARE/LIMITED/VINTAGE) 根拠なし禁止。',
    '- **DESCRIPTION**: 480 字以内 ASCII、**1 行のみ (改行 \\n を一切含めない)**。構造化情報は ` - ` 区切りで 1 行に並べる (例: `Lot of 3 sets. Item Details: - Brand: Topps - Year: 2023 - Player: Yamamoto - Grade: PSA 9`)。"new"/"Brand New" 禁止 (「未使用」=Unused は OK)。',
    '- **トーン (重要)**: Description は **eBay 出品者 (= ユーザー自身) が自分の商品として直接説明する第一人称トーン**で書く。ソースを引用するような第三者表現は **絶対禁止**:',
    '  - 禁止例: `per seller notes` / `according to seller` / `the seller states` / `seller mentions` / `per description` / `according to the original listing` / `as noted by the seller` / `based on seller\'s information` / `the original seller says`',
    '  - 推奨: 出品者自身が言い切る形 (`Minor marks may be present.` / `Used condition with light wear.` / `Includes original box.`)',
    '- **除去対象 (DESCRIPTION / Item Specifics 共に含めない)**:',
    '  - 配送方法: メルカリ便、ゆうゆうメルカリ便、らくらくメルカリ便、匿名配送、ヤマト、佐川、ゆうパック、定形外、レターパック、補償付き 等',
    '  - 梱包条件: 水濡れ防止、折れ防止、プチプチ、ダンボール、緩衝材、丁寧に梱包 等',
    '  - 補償・取引文言: ノークレーム、ノーリターン、即購入 OK、即購入歓迎、コメント不要、お値引き不可、専用、お取り置き不可 等',
    '  - 出品者の主観評価: 美品、極美品、超美品、激安、お買い得、希少、レア (ソース根拠なしの捏造表現)',
    '  - 保管環境: ペット飼育なし、喫煙者なし、自宅保管、神経質な方はご遠慮 等',
    '  - 値下げ・キャンペーン: 値下げ中、最終価格、週末値下げ、フォロー割 等',
    '  - eBay 側で別管理する情報全般 (送料・関税・返品ポリシー)',
    '- **Item Specifics**: 画像・テキストから確実に分かるもののみ。Country は本社国判定 (Seiko=Japan / Rolex=Switzerland / Cartier=France / Panerai=Italy / Callaway/TaylorMade/PING=USA、不明 → Japan)。',
    '- **タグ判定 (画像不要)**: タグ参照シート A 列の許可リストから **必ず 0 個または 1 個だけ**。配送カテゴリで選ぶ。リストにない新規タグ禁止。該当なしなら `[]`。',
    '- **画像の役割**: Title/IS/Description の正確性向上のため。タグ判定には使わない。',
    '- **子供向け玩具 → Collectible 強制 (重要)**: ぬいぐるみ / Plush / フィギュア / Figure / おもちゃ / Toy / 人形 / Doll / ミニカー / Model Car / Action Figure / Soft Toy / Stuffed Animal など子供が遊ぶ可能性のあるアイテムは **全て「Collectible (大人向け収集品)」として扱う**:',
    '  - Item Specifics の Type は Collectible 系を優先 (例: `Collectible Action Figure` / `Collectible Plush` / `Collectible Doll` / `Collectible Model Car`)',
    '  - **Age Level / Recommended Age Range / Age** は元データに `3+` `6+` `8+` 等の幼児向け年齢が書かれていても **必ず `13+` / `14+` / `16+` のいずれかにする (デフォルト `14+`)**。元データの幼児向け年齢は無視',
    '  - Title / Description にも `for children` / `for kids` / `ages 3+` / `preschool` / `baby toy` 等の幼児向け表現を使わない。代替: `for collectors` / `display piece` / `adult collectible` / `for display`',
    '  - 理由: eBay US Toys カテゴリの子供向け玩具規制 (CPSIA) を回避し、Collectibles として出品するため',
    '',
    '## 動作手順 (最小)',
    '',
    '1. **取得**: タグ参照シート A 列 + ソースシートのテキスト列 (B〜H) を取得。**画像は doGet で取得** (上記「画像入力」参照): 行ごとに `safeImages` を優先し、無い行だけ `mercariUrls` を使う。doGet レスポンスの `row` とテキストの行番号を突き合わせる。',
    '2. **集約バッチ**: 行範囲を集約バッチサイズで区切り、各バッチで AI に 1 リクエスト (システム 1 回 + 商品 N 件 + 画像を vision に渡す。`safeImages` の base64 を優先) → JSON 配列で受け取り。',
    '3. **後処理**: 各 JSON の recommendedUserTags をタグ許可リストでフィルタ + 先頭 1 つだけ採用 (0 件は `[]`)。',
    '4. **書込**: 書込先シートの H 列を **毎バッチ再取得** して空行特定 → その行に書き込み (A〜BC、IS は ISF1-IS値20)。',
    '   - **A 列 = 今日の日付 (YYYY/MM/DD 形式、例: 2026/05/19)**',
    '   - **B 列 = 担当者名 (ユーザーから渡されたパラメータの「担当者名」)**',
    '   - **valueInputOption は `USER_ENTERED`** を使う (RAW 禁止)。',
    '   - **数値項目 (仕入れ価格 / Year / Card Number 等) は数値型のまま書き込む** (文字列化禁止、先頭 `\'` が付加される現象を回避)。',
    '   - ソースシートからコピーする項目 (仕入れ価格・商品 ID・セラー ID・日本語 title・日本語説明) は、ソース側の型を保ったまま転記する。文字列を数値化したり、数値を文字列化したりしない。',
    '5. **完了報告**: 「完了。確認お願いします」と 1 行表示して終了。',
    '',
    '## 失敗時の最小ハンドリング',
    '',
    '- HTTP 429/5xx → 指数バックオフリトライ (2s/4s/8s)',
    '- HTTP 4xx (429 除く) / Safety フィルター (promptFeedback.blockReason or finishReason=\'SAFETY\') → 即失敗、該当行の Title 列に `ERROR` と書いてスキップ',
    '- バッチで複数件失敗時は、その失敗行のみ直列フォールバック (1 件ずつ再実行)'
  ]).join('\n');
}

// ============================================================================
// 内部ヘルパー — DocumentProperties アクセス
// ============================================================================
function getEbayTranslationSetting_(key, defaultValue) {
  var v = PropertiesService.getDocumentProperties().getProperty(key);
  return (v === null || v === undefined || v === '') ? defaultValue : v;
}

function getEbayTranslationNumericSetting_(key, defaultValue, minValue, maxValue) {
  var raw = PropertiesService.getDocumentProperties().getProperty(key);
  var n = parseInt(raw, 10);
  if (isNaN(n)) return defaultValue;
  if (n < minValue) return minValue;
  if (n > maxValue) return maxValue;
  return n;
}
