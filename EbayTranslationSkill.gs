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
  BATCH_SIZE:   5,
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
    'button { font-size: 14px; padding: 8px 16px; margin: 12px 8px 0 0; cursor: pointer; transition: transform 0.06s ease, box-shadow 0.1s ease, background 0.1s ease; }' +
    'button:active { transform: translateY(1px); }' +
    '.primary { background: #1a73e8; color: white; border: none; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.25); }' +
    '.primary:hover { background: #1666c1; }' +
    '.primary:active { background: #1558a8; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }' +
    '.cancel { background: #eee; border: 1px solid #ccc; border-radius: 4px; }' +
    '.cancel:hover { background: #e2e2e2; }' +
    '.cancel:active { background: #d5d5d5; box-shadow: inset 0 1px 3px rgba(0,0,0,0.2); }' +
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
// 公開関数 — スキル本文ダウンロードダイアログ HTML (最終チェック文セクション含む)
// ============================================================================
function buildEbayTranslationSkillDownloadHtml() {
  var content = getEbayTranslationSkillContent();
  var safe = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var safeFc = getEbayTranslationFinalCheckContent().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var safeRl = getRelistingImportSkillContent().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  var safeRt = getRelistingTranslationSkillContent().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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
    '<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">' +
    '<h3>📋 最終チェック スキル 本文</h3>' +
    '<div class="hint">翻訳・再出品翻訳で v5インポートに書き込んだ結果を、1行ずつ再検証して修正するスキルです。Codex/Claude/Gemini に登録してください。</div>' +
    '<div style="background:#fff3cd; border:2px solid #f1c40f; border-radius:8px; padding:14px 16px; margin:10px 0 14px; font-size:16px; font-weight:bold; color:#7a5b00; line-height:1.6;">⚡ スキルを登録したあとは、AI に <span style="color:#d35400;">「最終チェック」</span> と入力すると起動します（英語のスキル名を打つ必要はありません）。</div>' +
    '<textarea id="finalcheck" readonly>' + safeFc + '</textarea>' +
    '<button class="primary" onclick="downloadFinalCheck()">📥 ダウンロード (final-check-skill.md)</button>' +
    '<button onclick="copyFinalCheck()">📋 コピー</button>' +
    '<div id="toast2" class="toast"></div>' +
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
    'function downloadFinalCheck() {' +
    '  var content = document.getElementById("finalcheck").value;' +
    '  var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });' +
    '  var url = URL.createObjectURL(blob);' +
    '  var a = document.createElement("a");' +
    '  a.href = url; a.download = "final-check-skill.md";' +
    '  document.body.appendChild(a); a.click(); document.body.removeChild(a);' +
    '  URL.revokeObjectURL(url);' +
    '  showToast2("✓ ダウンロードしました (ダウンロードフォルダ確認)");' +
    '}' +
    'function copyFinalCheck() {' +
    '  var ta = document.getElementById("finalcheck"); ta.select(); ta.setSelectionRange(0, ta.value.length);' +
    '  try { navigator.clipboard.writeText(ta.value).then(function(){ showToast2("✓ コピーしました"); }); }' +
    '  catch(e) { document.execCommand("copy"); showToast2("✓ コピーしました"); }' +
    '}' +
    'function showToast2(msg) { var t = document.getElementById("toast2"); t.innerText = msg; t.style.display = "block"; }' +
    'function downloadRelisting() {' +
    '  var content = document.getElementById("relisting").value;' +
    '  var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });' +
    '  var url = URL.createObjectURL(blob);' +
    '  var a = document.createElement("a");' +
    '  a.href = url; a.download = "relisting-import-skill.md";' +
    '  document.body.appendChild(a); a.click(); document.body.removeChild(a);' +
    '  URL.revokeObjectURL(url);' +
    '  showToast3("✓ ダウンロードしました (ダウンロードフォルダ確認)");' +
    '}' +
    'function copyRelisting() {' +
    '  var ta = document.getElementById("relisting"); ta.select(); ta.setSelectionRange(0, ta.value.length);' +
    '  try { navigator.clipboard.writeText(ta.value).then(function(){ showToast3("✓ コピーしました"); }); }' +
    '  catch(e) { document.execCommand("copy"); showToast3("✓ コピーしました"); }' +
    '}' +
    'function showToast3(msg) { var t = document.getElementById("toast3"); t.innerText = msg; t.style.display = "block"; }' +
    '</script>' +
    '<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">' +
    '<h3>📄 再出品取り込みスキル 本文</h3>' +
    '<div class="hint">再出品ファイル(CSV/xlsx)をインポート用シートへ転記＋商品URL生成するスキルです。Codex/Claude/Gemini に登録してください。</div>' +
    '<div style="background:#fff3cd; border:2px solid #f1c40f; border-radius:8px; padding:14px 16px; margin:10px 0 14px; font-size:16px; font-weight:bold; color:#7a5b00; line-height:1.6;">⚡ スキルを登録したあとは、AI に <span style="color:#d35400;">「再出品実行」</span> と入力すると起動します（英語のスキル名を打つ必要はありません）。</div>' +
    '<textarea id="relisting" readonly>' + safeRl + '</textarea>' +
    '<button class="primary" onclick="downloadRelisting()">📥 ダウンロード (relisting-import-skill.md)</button>' +
    '<button onclick="copyRelisting()">📋 コピー</button>' +
    '<div id="toast3" class="toast"></div>' +
    '<hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">' +
    '<h3>📄 再出品翻訳スキル 本文</h3>' +
    '<div class="hint">再出品の英語データ（既存タイトル/コンディション）からTitle再生成・IS生成するスキルです。Codex/Claude/Gemini に登録してください。</div>' +
    '<div style="background:#fff3cd; border:2px solid #f1c40f; border-radius:8px; padding:14px 16px; margin:10px 0 14px; font-size:16px; font-weight:bold; color:#7a5b00; line-height:1.6;">⚡ スキルを登録したあとは、AI に <span style="color:#d35400;">「再出品翻訳」</span> と入力すると起動します（英語のスキル名を打つ必要はありません）。</div>' +
    '<textarea id="reltrans" readonly>' + safeRt + '</textarea>' +
    '<button class="primary" onclick="downloadReltrans()">📥 ダウンロード (relisting-translation-skill.md)</button>' +
    '<button onclick="copyReltrans()">📋 コピー</button>' +
    '<div id="toast4" class="toast"></div>' +
    '<script>' +
    'function downloadReltrans() {' +
    '  var content = document.getElementById("reltrans").value;' +
    '  var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });' +
    '  var url = URL.createObjectURL(blob);' +
    '  var a = document.createElement("a");' +
    '  a.href = url; a.download = "relisting-translation-skill.md";' +
    '  document.body.appendChild(a); a.click(); document.body.removeChild(a);' +
    '  URL.revokeObjectURL(url);' +
    '  showToast4("✓ ダウンロードしました (ダウンロードフォルダ確認)");' +
    '}' +
    'function copyReltrans() {' +
    '  var ta = document.getElementById("reltrans"); ta.select(); ta.setSelectionRange(0, ta.value.length);' +
    '  try { navigator.clipboard.writeText(ta.value).then(function(){ showToast4("✓ コピーしました"); }); }' +
    '  catch(e) { document.execCommand("copy"); showToast4("✓ コピーしました"); }' +
    '}' +
    'function showToast4(msg) { var t = document.getElementById("toast4"); t.innerText = msg; t.style.display = "block"; }' +
    '</script>'
  ).setWidth(700).setHeight(1500);
}

// ============================================================================
// 公開関数 — 最終チェックスキル本文
// ============================================================================
function getEbayTranslationFinalCheckContent() {
  // ★スキル本文を変えたら CHANGELOG の先頭に {date, text} を1件追加(新しい順・事実を正確に)。
  var CHANGELOG = [
    { date: '2026-06-28', text: 'チェック項目に、トレカ／スポーツトレカ等のカード商品(スポーツ含む全カード)も Title に Collectible 13+ が入っているか確認する項目を追加' },
    { date: '2026-06-24', text: '手元最新版へ同期: ポジティブ遵守の詳述追加(ルールはeBayポリシー由来・明文にない場面も趣旨適用・new /newly/brand new を機械検索で全セル検出)。チェック項目8にCollectible 13+ Titleチェック(Age Level 14+/16+でもTitle常に固定)・アニメ系コレクター扱い確認(categoryId アニメbucket・Type Collectible〜・Age Level付与 既定13+)を追加' },
    { date: '2026-06-11', text: 'チェック項目7にトレカ／スポーツトレカの categoryId 4 ID 固定(261328/261329/183454/183455)の確認を追加。メンコ等の非CCGカードも CCG カテゴリ必須' },
    { date: '2026-06-10', text: '最終チェックをスキル化。起動「最終チェック」。v5インポートの書込結果を1行ずつ実セル検証し、問題は修正して報告' }
  ];
  var version = (CHANGELOG[0] && CHANGELOG[0].date) ? CHANGELOG[0].date : '';
  var historyBlock = ['<!-- 【変更履歴】人向けメモ。スキル実行には影響しません（新規の方は読み飛ばして OK ／ 更新の方はここで変更点を確認）。']
    .concat(CHANGELOG.map(function (c) { return '- ' + c.date + ': ' + c.text; }))
    .concat(['-->']);
  return historyBlock.concat([
    '======================（ここから下をコピーしてスキルに登録）======================',
    '',
    '# 最終チェック スキル（final-check）',
    '',
    'バージョン: ' + version,
    '',
    '> **心構え**: 1件1件が実際に販売される商品。「確認しました」と一度答えていても、改めて1行ずつ実際のセルを見て検証する。',
    '>',
    '> **ポジティブ遵守**: チェック項目の元になっているルールは eBay 自身のルール (ポリシー) に則っており、実際に出品してきてダメだった事例が網羅されている。**ルールを守ることで、アカウントもセラーもバイヤーも eBay も守られる。** 禁止リストではなく出品成功への近道として前向きに適用し、明文にない場面でもルールの趣旨を同じ方向に適用する (例: 中古品の New Band 禁止の趣旨は New Battery にも及ぶ → `Battery Replaced` で表現。「未使用」= `Unused` は許可)。チェックの際は、該当しそうな語 (` new ` / `newly` / `brand new` 等) を目視でなく機械検索で全セルから検出する。',
    '',
    '## 起動トリガー',
    '',
    'ユーザーが「**最終チェック**」と指示したら、このスキルを開始する（英語のスキル名 final-check を入力する必要はない）。',
    '',
    '---',
    '',
    '## 目的',
    '',
    'ebay-translation / 再出品翻訳 で「v5インポート」シートに書き込んだ結果を、改めて1行ずつ実セルを見て検証し、問題があれば修正し、結果を報告する。',
    '',
    '---',
    '',
    '## チェック項目',
    '',
    '以下の点について、最終チェック(再確認)を行う。',
    '「確認しました」と一度答えていても、改めて1行ずつ実際のセルを見て検証すること。',
    '',
    '1. 列やセルがずれていないか(M=Title／N=Description／P列以降=Item Specifics)',
    '2. 文字数(タイトルは80文字以下か。また短すぎないか)',
    '3. 誇張表現・嘘が入っていないか',
    '4. 禁止ワード(VeRO抵触語など)が含まれていないか',
    '5. 日本語の混入がないか',
    '6. タグがミスマッチしていないか',
    '7. カテゴリIDが正しいか(タグ・商品に合った出品可能カテゴリか)',
    '   ・トレカ／スポーツトレカのカード商品は 4 ID 固定か(スポーツ1枚=261328／スポーツ2枚以上・ボックス=261329／キャラ・アニメ系1枚=183454／同2枚以上=183455)',
    '   ・メンコ等の非CCGカードが Collectibles 側 (183050/183051) や Sets/Sealed Boxes (261330-261332) に逃げていないか(CCGカテゴリでないとカード商品を登録できない)',
    '8. 玩具・キャラ系(フィギュア・ぬいぐるみ・人形・おもちゃ・アニメグッズ等)の扱い',
    '   ・キャラ物/コレクター物は Collectibles のカテゴリに入っているか',
    '   ・Collectibles に適切な受け皿が無い純玩具を無理に Collectibles へ入れていないか',
    '   ・Item Specifics の Type が Collectible 系か、対象年齢が 13+/14+ か(幼児向け 3+ 等のままでないか)',
    '   ・コレクター扱い(Type が `Collectible 〜`＝Age Level を付与)の商品は、Title に `Collectible 13+` の文字列が入っているか(Age Level が 14+/16+ でも Title 表記は常に `Collectible 13+` 固定)。無ければ追加する(80字制限内)',
    '   ・トレカ／スポーツトレカ等のカード商品(スポーツ含む全カード商品)も、Title に `Collectible 13+` の文字列が入っているか。無ければ80字制限内で追加する',
    '   ・Title／Description に for kids／ages 3+ 等の幼児向け表現が入っていないか',
    '   ・アニメグッズ・キャラ/アイドルグッズ(アクスタ・アクキー・缶バッジ・ブロマイド・ファングッズ・実在アイドル/バンドの音楽メモラビリア含む)は、元データに年齢記載が無くてもコレクター扱いになっているか＝categoryId が アニメ bucket から付与され空欄でない / Type が `Collectible 〜` / `Age Level` が必ず付与(既定 13+)されているか',
    '9. 基本的に中古であることを確認しているか(未開封でも基本的には中古品)',
    '',
    '---',
    '',
    '## 報告',
    '',
    '・修正した内容を具体的に報告すること(どのセルを、どう直したか)。',
    '・カテゴリID／タグが空欄、Item Specifics が少ない(10未満)行があれば、その行と理由を報告すること。',
    '・修正がなければ「修正なし」と報告すること。'
  ]).join('\n');
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
    { date: '2026-06-28', text: 'トレカ／スポーツトレカ等のカード商品(4 ID 該当品全般・スポーツ含む)も Title に Collectible 13+ を必ず入れる規則を追加(Age Level 付与有無に関わらず Title 表記は Collectible 13+ 固定)' },
    { date: '2026-06-24', text: '手元/Codex最新版に同期: Collectible 13+ をTitleに固定/アニメ・アイドルグッズは年齢記載なくてもコレクター扱い・既定13+/J列K列はソース参照式の例外/categoryIdはタグ非依存で商品実態判定/推測時warnings抜け道廃止/第0ルール・ポジティブ遵守・実行体制ルール追加/Yearハイフン禁止/書込前文字数機械実測/修正は個別セル指定/製造国対応表拡充 等' },
    { date: '2026-06-11', text: 'トレカ／スポーツトレカの categoryId を 4 ID に固定(スポーツ1枚=261328/スポーツ2枚以上・ボックス=261329/キャラ・アニメ系1枚=183454/同2枚以上=183455)。Sets/Sealed Boxes/Collectibles側Singles・Lots は使用禁止。メンコ等の非CCGカードも CCG カテゴリ必須(CCGでないとカード商品を登録できないため)' },
    { date: '2026-06-08', text: '玩具・キャラクター系は categoryId を Collectibles ツリー優先に変更(アニメフィギュア261055/アニメぬいぐるみ261062/アニメグッズ69528/コレクターフィギュア149372)。受け皿が無い純玩具は正しいカテゴリ+warnings記録。Age13+/14+維持。理由にCPaSS Economyの HTSUS紐付け(9503.00.00.90/CPSIA非該当)を追記。完了報告に空欄・IS不足行の理由を添えるよう緩和' },
    { date: '2026-05-30', text: 'Codex 版 (2026-05-30) に統合。第一ルール(情報精査は1行ずつ)を先頭に追加。中古時計の交換バンド表現/時計VeRO回避/青色禁止語/製造国のブランド国判定詳細化/カテゴリID補足(漫画259109・アニメグッズ69528・関数電卓58042)/書込値は実値(数式禁止)/書込後QA/途中承認スキップ を追加。集約バッチ既定を5に (まとめ処理は精度が落ちるため)。TITLE は数値固定せず理由で充実' },
    { date: '2026-05-23', text: 'eBay カテゴリ ID 判定を追加 (GitHub公開JSONを HTTP 取得し tag->genre->候補から選び F 列へ。候補内 ID のみ・無ければ空。全ツール対応)' },
    { date: '2026-05-23', text: '統合版: 動物素材ワード禁止/Occasion禁止/製造国判定詳細/ハルシネーション禁止/メルカリ特化を追加' },
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
    '## 第0ルール: このスキルの記述を最優先で守る (絶対遵守・全ルールの上位)',
    '',
    '**このスキルは「実行する指示書」であり、「自分で組み直すための素材」ではない。書かれている通りにそのまま実行する。**',
    '',
    '- このスキルの記述は、実行者 (AI) 自身の判断・好み・癖、およびグローバルルール (親=司令塔/委託の段取り等) よりも**優先する**。両者が衝突した場合は必ずこのスキルに従う。',
    '- **着手前にこのスキル全文 (特に「実行モード」「実行運用」) を読んでから動く**。読む前に独自の段取り・アーキテクチャを設計してはならない。',
    '- スキルに既に書かれている方式 (例:「実行運用」の **1ワーカーでバッチ処理／多数のサブエージェントへ細分化委託しない／QAは1回・やり直しを作らない／I/Oはまとめる／画像は要所のみ・並列で読む**) を、速度・慎重さ・その他の理由で**勝手に別方式へ置き換えない**。',
    '- 速くしたい/詰まった場合も、独自の代替手段に切り替える前に、まずスキル記載の方法を正しく適用できているかを確認する。',
    '',
    '## ルールの心構え: ポジティブ遵守 (全ルール共通の前提)',
    '',
    '**このスキルの全ルールは eBay 自身のルール (ポリシー) に則っており、実際に出品してきてダメだった事例 (eBay 登録拒否・VeRO・誤認トラブル・列ずれ事故・文字数超過など) が網羅されている。ルールを理解し、守り、実行することが、出品成功への近道である。**',
    '',
    '- **このルールを守ることで、アカウントもセラーもバイヤーも eBay も守られる。** 中古品に New と書かない=商品状態の正確な表示、VeRO 回避=知的財産の尊重、創作・推測の禁止=正確な商品説明 — どれも eBay ポリシーに対応しており、守ればバイヤーは説明どおりの商品を受け取れ、セラーはクレーム・返品・ペナルティから守られる。',
    '- ルールを「制約」と捉えない。守るほど成果物の品質と出品成功率が上がる、**成功のための手順**として前向きに適用する。',
    '- **明文にない場面でも、ルールの趣旨を同じ方向に適用する**。例: 「中古時計の New Band 禁止」の趣旨は「中古品に New の語があると新品と誤認され登録で弾かれる」ことなので、バンドに限らず New Battery など他の部位にも同様に適用し、`Battery Replaced` / `battery replaced June 2026` のように交換済みの事実で表現する (「未使用」= `Unused` は明示的に許可された表現で、使ってよい)。',
    '- 各ルールの背景には実害がある。1 つの違反が出品不可・アカウントリスクに直結するため、「だいたい守れている」ではなく全行・全セルで守る。守れたかどうかは目視ではなく機械実測で確認する。',
    '',
    '## 実行体制ルール: 判断はメイン、機械作業だけ委託 (絶対遵守)',
    '',
    '役割は「誰が全部やるか」ではなく**タスクの性質**で切り分ける。委託してよいのは、次の2条件を**両方**満たす作業だけ: **(1) 中身の判断を伴わない (集める・数える・検出するだけ)、(2) 出力をメインが安く再検証できる (番地・出典URL・画像ファイル等、確認可能な形で返る)**。',
    '',
    '- **メイン (実行している AI 自身) が必ず直接やる = 判断を伴う作業 (委託厳禁)**:',
    '  - ソース原文の読み取り / 画像から事実を拾う判断 / 1行ずつの情報精査',
    '  - タグ判定・カテゴリID判定',
    '  - Title / Description / Item Specifics の生成 (翻訳・取捨選択)',
    '  - リサーチ結果から**何を採用するかの判断**',
    '  - シートへの**実際の書き込み** (= **書き込みステップ自体をサブエージェント・別 AI に渡さない**。日本語など非ASCII・長文を引数に渡すのが嫌でも委託しない。malformed 回避を理由に委託しない。必要なら範囲を分割し、メインが自分で書く)',
    '  - 内容が正しいかの**最終判断**と修正',
    '',
    '- **サブエージェントへ委託してよい = 判断のいらない機械作業**:',
    '  1. **最終の機械的検証スキャン** (禁止語・日本語残り・文字数超過・改行・禁止記号・「タグが許可リスト内か」「categoryId が buckets 候補内か」の検出。セル番地＋引用で返させる)',
    '  2. **画像の取得・デコード**: doGet を叩いて base64 → /tmp の jpg に復号するだけ。画像を見て事実を拾うのはメイン',
    '  3. **リサーチ (出典付き生証拠の収集のみ)**: 不足仕様について商品・型番を Web 検索し、「見つけた仕様＋出典URL＋逐語引用」を返すだけ。採用可否はメインが URL で裏を取って決める',
    '  4. **一回限りの参照データ取得 (軽微)**: タグ許可リスト取得・カテゴリ参照 JSON の HTTP 取得',
    '  5. **読み取り専用のステータス/構造スキャン**: H 列が空の最初の行・列ずれ有無などを番地で返す',
    '',
    '- 一言: **「集める・数える・検出する」は委託可。「決める・訳す・書く」はメイン。**',
    '',
    '## 第一ルール: 情報精査は1行ずつ (絶対遵守・最優先)',
    '',
    '**これは商品です。データ行ではありません。1件1件が実際に販売される商品です。**',
    '',
    '- **情報精査 (ソーステキスト読込・画像確認・タグ判定・カテゴリ判定・Title/Description/IS 生成) は必ず1行ずつ実行する**。',
    '- **バッチ処理で複数行を一度に判定してはならない**。テンプレ思考に逃げると以下が必ず発生する:',
    '  - タグ誤判定 (本もネックレスもジュエリーボックスも全部「アニメグッズ」になる等)',
    '  - ハルシネーション (ソースにない「Carefully wrapped」「smoke-free home」「Animate exclusive」「Limited」等を勝手に追加)',
    '  - Brand 雑判定 (CLAMP は作者なのに全行 Brand=CLAMP になる)',
    '  - セット数誤認 (1点なのに「Set of 2」になる)',
    '  - 個別仕様の見落とし (色、サイズ、メーカー名、限定情報、コラボ先など)',
    '- **書き込み (Sheets API による更新) はバッチでも良い**。ただし、書き込む前に各行の情報精査を必ず1行ずつ完了させていること。',
    '- 各行について、以下のステップを順番に実行する:',
    '  1. **ソーステキストを読む** (B-H列)。書かれていることだけを Fact とする。書かれていない情報は推測しない。',
    '  2. **その行の画像を確認する** (doGet で取得した safeImages を vision で読む)。',
    '  3. **タグを判定** (TagShipping A列許可リストから、商品の性質と配送カテゴリで1つ選ぶ)。',
    '  4. **カテゴリ ID を判定** (商品の実態から buckets 候補で選ぶ。タグの genre に縛られない)。',
    '  5. **Title / Description / Item Specifics を生成** (ソース・画像から確認できることのみ)。',
    '  6. **書き込み** (バッチで複数行まとめて書き込んでも可)。',
    '- AI のまとめ処理は精度が落ちる (特に Claude。Codex は変化が小さい)。集約バッチサイズは小さめ (既定 5) を推奨。精査は必ず1行ずつ行う。',
    '',
    '**このルールは他の全てのルールに優先する。** 「実行モード (一気通貫)」「集約バッチサイズ」よりも上位。',
    '',
    '## 実行モード (最優先)',
    '',
    '- **全工程を確認なしで一気通貫で実行**。途中で「これを実行してよいか」「次に進むか」は聞かない。',
    '- **途中承認は全てスキップ**。画像取得・カテゴリ参照取得・シート読込・シート書込・QA修正など、このスキル内で必要な通常操作はユーザー確認を挟まず実行する。実行環境が表示する権限ダイアログ等、AI側で省略できないシステム承認だけは例外。',
    '- 完了後の報告は原則 **「完了。確認お願いします」の 1 行**。ただし、書込結果に **categoryId または タグが空欄の行、Item Specifics が 10 未満の行** があれば、その行番号と「なぜそうなったか」の理由を短く箇条書きで添える (例: `L58: categoryId 空 — タグに対応する候補が無いため` / `L60: IS 7件 — 画像不鮮明で確認できる仕様が少ないため`)。詳細な成功件数リストは不要。',
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
    '- 集約バッチサイズ (例: 5) ← AI のまとめ処理は精度が落ちる (特に Claude)。精度優先なら小さく、速度優先なら大きく。',
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
    '  "categoryId": "string (eBay 数値カテゴリ ID。該当なしは空文字)",',
    '  "warnings": ["string"]',
    '}',
    '```',
    '',
    '## ルール (必須)',
    '',
    '- **TITLE**: 80 字以内。短く済ませず、根拠のある Brand / Franchise / Type / Model / Size / Quantity / Year / Edition / Included Item を使ってタイトルを充実させる。最初の 30 字に高価値キーワード。許可記号 `& / : - . ,` (+ TCG・グレード等で `# \' +`)。禁止記号 `* $ ~ ^ @ ! ? ™ ( ) [ ] { } " _ % = | \\ < > ;`。VeRO 抵触語 (AUTHENTIC/OFFICIAL) 禁止、捏造 (RARE/LIMITED/VINTAGE) 根拠なし禁止。根拠がある年代・版・数量・サイズは優先して入れるが、`Rare` / `Limited` / `Mint` / `Excellent` 等の誇張語はソース根拠が薄ければ使わない。',
    '- **DESCRIPTION**: 480 字以内 ASCII、**1 行のみ (改行 \\n を一切含めない)**。商品の状態と仕様だけを書く。構造化情報は ` - ` 区切りで 1 行に並べる (例: `Lot of 3 sets. Item Details: - Brand: Topps - Year: 2023 - Player: Yamamoto - Grade: PSA 9`)。"new"/"Brand New" 禁止 (「未使用」=Unused は OK)。配送方法・梱包・購入条件・値下げ・返品/保証・出品者都合の説明は入れない。',
    '- **中古時計の交換バンド表現**: 中古の腕時計でベルト/バンドが新品交換済みの場合でも、Title / Description / Item Specifics に `New Band` / `new band` / `new aftermarket band` は使わない。eBay 登録時に中古品の `New` 表現で弾かれるため、必ず `Replacement Band` / `replacement band` / `Band Replaced` / `replacement aftermarket band` と表現する。',
    '- **時計の VeRO 回避 (重要)**: 時計の Title にはブランド名を 2 つ以上入れない。時計本体ブランドとベルト/部品/付属品ブランドが混在する場合、Title は時計本体または主対象の 1 ブランドだけにし、追加ブランドは確実な根拠がある場合のみ Item Specifics / Condition / Description 側へ回す。',
    '- **青色表現の禁止語 (重要)**: 色名として `Tiffany Blue` / `Tiffany blue` / `ティファニーブルー` は絶対に使わない。Tiffany ブランドと無関係な青系は `Turquoise Blue` / `Aqua Blue` / `Light Blue` など、画像とテキストから安全に言える一般色で表現する。',
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
    '- **Item Specifics**: 画像・テキストから確実に分かるもののみ。ただし `Country/Region of Manufacture` は原則必ず出力し、**製造国ではなくブランド国・権利元の国で判定**する:',
    '  - フィギュア / アニメグッズ / 漫画 / 書籍 / CD / DVD / 日本作品キャラクター商品 → Japan',
    '  - Casio / Seiko / Citizen / Orient → Japan',
    '  - Dior / Christian Dior / Cartier → France',
    '  - Gucci / Ferragamo / Salvatore Ferragamo / Prada / Fendi / Bvlgari / Panerai → Italy',
    '  - Georg Jensen → Denmark',
    '  - Omega / Tag Heuer / Patek Philippe / Audemars Piguet / IWC / Tudor / Longines / Breitling / Hamilton / Hublot / Zenith / Jaeger-LeCoultre → Switzerland',
    '  - Titleist / TaylorMade / Callaway / Ping / Cobra / Nixon → USA',
    '  - ブランド国が判定できる場合はその国を採用。辞書外で不明な場合のみ Japan',
    '- **Item Specifics の充実度**: 各商品で、嘘・推測・根拠なし情報を入れない範囲で、**最低 10 フィールドを目標**に埋める。10 未満で終える前に、画像・日本語説明・タイトルから確認できる Brand / Franchise / Type / Character / Artist / Writer / Publisher / Manufacturer / Model / MPN / Quantity / Size / Material / Color / Shape / Closure / Features / Included Items / Format / Language / Publication Year / Edition / Theme / Style / Use / Condition Notes / Country/Region of Manufacture を再確認する。どうしても 10 に届かない場合のみ少なくしてよいが、確認できない仕様を 10 項目達成のために創作することは禁止。特に時計、電卓・ポケットコンピュータ、トレカ、アニメ/音楽グッズ、ドール/フィギュア、書籍・漫画、紙もの、バッグ類は 10 フィールド前後まで増やす。',
    '- **動物素材ワード禁止**: "Crocodile", "Alligator", "Ivory", "Ostrich", "Snake", "Snakeskin", "Lizard", "Tortoiseshell", "Python", "Stingray" 等は禁止。素材が不明・人工なら "Leather" / "Faux leather" / "Synthetic" / "Embossed leather" などに置換。',
    '- **"Occasion" 禁止**: 出品ツールが "CASIO" と誤認するため使用禁止。代替: "Use" / "Scene" / "Style" / "Wear" / "Event"。',
    '- **ハルシネーション禁止 / 創作・推測の全面禁止 (絶対・例外なし)**: 自分の頭で考えて仕様を作ってはならない。データが足りないときの手順は必ず次の順序で行う:',
    '  1. **その行の商品画像を確認する** (doGet で取得した画像を見て、確認できる仕様を拾う)。',
    '  2. **それでも不足する仕様**は、**該当商品・型番を Web 検索して実在の事実を裏取りする**。検索で確証が取れた事実のみ採用する。',
    '  3. **画像でも Web 検索でも確認できない項目だけ空欄にする**。空欄は最後の手段であり、最初の手段は「調べる」。',
    '  - **「どうしても推測した場合は warnings に明記すれば可」という抜け道は廃止**。推測値・創作値は、warnings に書く場合も含めて、いかなる場合もセルに書き込まない。色・寸法・キャラ名・カード数値・ブランド・付属品・限定/年代などを、ソース・画像・検索の裏付けなしに書くことを固く禁じる。',
    '- **タグ判定 (画像不要)**: タグ参照シート A 列の許可リストから **必ず 0 個または 1 個だけ**。配送カテゴリで選ぶ。リストにない新規タグ禁止。該当なしなら `[]`。日本作品のキャラクターグッズ (バッグ、ポーチ、スカーフ、文具、缶バッジ、ポスター、シール、布パネル等) は、物理形状が衣類・バッグ系でも、配送タグとして適切なら `アニメグッズ` を優先する。ヘアピン等、許可リストに専用タグがあり配送実態が近いものだけ `ヘアアクセサリー` 等を使う。カードの配送タグは 1 枚のみ=単品系 (未鑑定/PSA 等)、2 枚以上のセット・まとめ=まとめ売り (カテゴリの Mixed Lots と枚数判定を連動させる)。',
    '- **画像の役割**: Title/IS/Description の正確性向上のため。タグ判定には使わない。',
    '- **eBay カテゴリ ID 判定 (タグとは独立)**: カテゴリ参照を翻訳前に 1 回 HTTP 取得する (`curl` / WebFetch): `https://naokijodan.github.io/bulksheet-ebay-categories/ebay-category-buckets.json` (`{ tagToGenre, buckets }` 形式、eBay US treeVersion 134 の公式確定 ID)。**categoryId は D 列の配送タグではなく、商品そのものの実態 (画像・日本語タイトル・説明) から判定する**。商品の種類に最も合う genre を `buckets` から選び、その候補リスト内の数値 ID を 1 つだけ採用する。**タグの genre (`tagToGenre[タグ]`) に縛られない**。`buckets` のいずれかの候補リスト内に実在する数値 ID のみ採用し、リストにない番号を創作しない。商品に合う候補が無い / 不明の場合は categoryId を空にする。粒度は粗くてよい (詳細は Item Specifics が持つ)。',
    '  - タグが `漫画　６〜１５冊` / `漫画　１〜５冊` / `漫画　１６冊以上` のように数量修飾付きで `tagToGenre` に完全一致しない場合、タグ許可リスト上の値は D 列にそのまま書き、カテゴリ判定だけ `漫画` に正規化して `buckets["漫画"]` から選ぶ。漫画セット/単巻は原則 `259109` (Manga & Asian Comics > Single Volumes) を使う。',
    '  - `アニメグッズ` で候補内に完全一致する細分類がない商品は `69528` (Other Animation Merchandise) を使う。マウスパッド等で他 genre に似たカテゴリがあっても、`アニメグッズ` の genre 外 ID は使わない。',
    '  - 書込前に「D列タグが許可リスト内」「F列categoryIdが buckets のいずれかの候補内に実在する数値IDか」を確認する。**D列タグとF列categoryIdが一致しているかは確認しない (両者は独立軸のため)**。',
    '- **【必須・固定】トレカ／スポーツトレカの categoryId は次の 4 つだけを使う (絶対遵守)**: トレカ系タグ (トレカ／スポーツトレカの単品・まとめ売り・未開封・未鑑定・PSA 等) の商品は、F 列を必ず以下の 4 ID のいずれかに固定する。Sets (261330)・Sealed Trading Card Packs/Boxes (261331/261332)・Collectibles 側の Trading Card Singles/Lots (183050/183051) など、buckets 内の他候補があっても**絶対に使わない**:',
    '  - スポーツカード (野球・サッカー等の実在選手/球団のカード) **1 枚** → `261328` (Sports Mem, Cards & Fan Shop > Sports Trading Cards > Trading Card Singles)',
    '  - スポーツカード **2 枚以上・セット・ボックス・未開封** → `261329` (Sports Mem, Cards & Fan Shop > Sports Trading Cards > Trading Card Lots)',
    '  - キャラクター/アニメ等のトレカ **1 枚** → `183454` (Toys & Hobbies > Collectible Card Games > CCG Individual Cards)',
    '  - キャラクター/アニメ等のトレカ **2 枚以上・まとめ売り** → `183455` (Toys & Hobbies > Collectible Card Games > CCG Mixed Card Lots)',
    '  - **非 CCG のカード (メンコ・ミニカード・ポストカード状のコレクションカード・アーケードゲーム排出カード等) も、カード商品である限り必ず上記の CCG カテゴリ (183454/183455) を使う**。「ゲーム用カードではないから」と Collectibles > Non-Sport Trading Cards (183050/183051) 等へ逃がさない。理由: 出品ツール側は CCG カテゴリでないとカード商品を登録できない。',
    '  - ポケカ・遊戯王・ワンピース等、専用 genre が buckets にあるカードはその bucket の候補に従ってよいが、汎用のトレカ／スポーツトレカは上記 4 ID に固定する。判断基準は「スポーツか否か」×「1 枚か 2 枚以上か」だけ。未開封・鑑定済みなどの状態は ID を変える理由にならない。',
    '  - **【必須】カード商品は Title (M 列) に必ず `Collectible 13+` を入れる**: 上記 4 ID に該当するカード商品 (スポーツカード・キャラ/アニメ系トレカ・非 CCG カードすべて) は、Age Level の付与有無に関わらず、Title (M 列) に必ず `Collectible 13+` の文字列を入れる。値は `Collectible 13+` 固定。Title 80 字制限内に収める。',
    '- **関数電卓カテゴリ補足**: 古い関数電卓 / ポケットコンピュータ / プログラム電卓 (例: SHARP PC-G850V, PC-1360K, PC-1255, PC-1280, CE-120P など) は、参照JSONで `関数電卓` の候補が空の場合でも eBay US `Vintage Calculators` の categoryId `58042` を採用する。通常の現行電卓や事務用電卓ではなく、ヴィンテージ・コレクション性のある計算機に限る。',
    '- **玩具・キャラクター系 → Collectibles カテゴリ優先 (重要)**: ぬいぐるみ / Plush / フィギュア / Figure / おもちゃ / Toy / 人形 / Doll / ミニカー / Action Figure / Soft Toy / Stuffed Animal / アニメグッズ など、子供が遊ぶ可能性のある、またはキャラクター収集品は 13 歳以上のコレクター向けとして扱う:',
    '  - **categoryId は Collectibles ツリー (path が「Collectibles >」で始まる ID) を優先する**。同じ genre の buckets 候補の中に Collectibles ツリーの ID があれば、Toys & Hobbies / Dolls & Bears ツリーの ID より優先して選ぶ:',
    '    - アニメ / キャラクターのフィギュア → 261055 (Collectibles > Animation Merchandise > Figures & Statues)',
    '    - アニメ / キャラクターのぬいぐるみ → 261062 (Collectibles > Animation Merchandise > Plush Items)',
    '    - アニメグッズ全般 → 69528 (Collectibles > Animation Merchandise > Other Animation Merchandise)。缶バッジ → 261061 / キーホルダー → 261057 / タペストリー・ポスター → 261063 等、buckets["アニメ"] 内に適切な細分類があればそちらを優先',
    '    - コレクター / キャラクター系のフィギュア・スタチュー・ソフビ → 149372 (Collectibles > Collectible Figures & Bobbleheads)',
    '  - **Collectibles ツリーに適切な受け皿が無い純玩具** (汎用の非キャラぬいぐるみ・テディベア・遊び人形(リカちゃん / バービー等)・ミニカー / ダイキャスト) は、無理に Collectibles へ入れない。buckets 候補内の正しいカテゴリ (Toys & Hobbies / Dolls & Bears) を選び、warnings に「Collectibles受け皿なし」とその理由を記録する',
    '  - Item Specifics の Type は Collectible 系を優先 (例: `Collectible Action Figure` / `Collectible Plush` / `Collectible Doll`)',
    '  - **【必須】Title に `Collectible 13+` を必ず入れる**: コレクター扱い (Item Specifics の Type を `Collectible 〜` にする＝Age Level を付与する) にする商品 (アニメグッズ・キャラ/アイドルグッズ・フィギュア・ドール等) は、Title (M 列) に必ず `Collectible 13+` の文字列を入れる。Age Level を `14+` / `16+` にした商品でも Title 表記は常に `Collectible 13+` 固定 (Age Level 欄と一致させない)。Title 80 字制限内に必ず収める。 なお、トレカ／スポーツトレカ等のカード商品 (上記カテゴリ 4 ID 該当品) も、Age Level の付与有無に関わらず Title に `Collectible 13+` を必ず入れる。',
    '  - **【アニメグッズ・キャラ/アイドルグッズは年齢記載が無くてもコレクター扱い (重要)】**: アクリルスタンド (アクスタ) / アクリルキーホルダー / 缶バッジ / ブロマイド / ポストカード / タオル・バッグ等のファングッズや、実在アイドル・バンドの音楽メモラビリアは、元データに年齢の記載が一切無くても **必ずコレクター向けアイテムとして扱う**。具体的には (1) `categoryId` は `アニメ` bucket から付与 (キーホルダー→261057 / 缶バッジ→261061 / ポスター・タペストリー→261063、一意の細分類が無い物は 69528)、(2) Item Specifics の `Type` を `Collectible 〜` にする (例 `Collectible Acrylic Stand` / `Collectible Acrylic Keychain`)、(3) Item Specifics に `Age Level` を **必ず 1 つ付与する (既定 `13+`)**。空欄にしない。categoryId を空欄にしない。',
    '  - **Age Level / Recommended Age Range / Age** は元データに `3+` `6+` `8+` 等の幼児向け年齢が書かれていても **必ず `13+` / `14+` / `16+` のいずれかにする (デフォルト `14+`、アニメグッズ・キャラ/アイドルグッズは `13+`)**。元データの幼児向け年齢は無視',
    '  - Title / Description にも `for children` / `for kids` / `ages 3+` / `preschool` / `baby toy` 等の幼児向け表現を使わない。代替: `for collectors` / `display piece` / `adult collectible` / `for display`',
    '  - 理由: 子供向け玩具規制 (CPSIA) の回避に加え、CPaSS Economy では HTSUS が eBay カテゴリ ID に紐づき出荷時に変更できないため。13 歳以上のコレクター向け玩具は HTSUS 9503.00.00.90 (CPSIA 非該当) に収束する (クーリエは出荷時に HTSUS 変更可、Economy はカテゴリ依存)',
    '',
    '## メルカリ特化 (ソースがメルカリの場合)',
    '',
    'ソースがメルカリ (platform が `mercari` または `mercari_shop`) の場合、以下を適用する。メルカリ特有のノイズ文言の除外は上記「除去対象」に従う。',
    '',
    '- **メルカリの「商品の状態」マッピング** (Condition/Description に反映):',
    '  - 「新品、未使用」 → `Unused`',
    '  - 「未使用に近い」 → `Used (very minimal signs of use)`',
    '  - 「目立った傷や汚れなし」 → `Used (minimal signs of use)`',
    '  - 「やや傷や汚れあり」 → `Used (light signs of use)`',
    '  - 「傷や汚れあり」 → `Used (visible signs of use)`',
    '  - 「全体的に状態が悪い」 → `Used (heavy wear)` / `For parts or not working`',
    '- **商品カテゴリ別の推奨 Item Specifics** (確認できるもののみ採用):',
    '  - 時計: Brand / Department (Men/Women/Unisex) / Movement / Display / Case Material / Band Material / Dial Color / Case Size / Wrist Size (「腕周り○○cm」等の記載があれば `○○cm / ○○in` 形式で必ず含める。インチは cm ÷ 2.54、小数1位) / Water Resistance / Reference Number / Model',
    '  - 衣類・バッグ・靴: Brand / Department / Size / Color / Material / Style',
    '  - フィギュア: Brand / Character / Franchise / Material / Size / Year of Manufacture',
    '  - カードゲーム: Game / Character / Set / Card Number / Language / Manufacturer / Card Condition / Rarity',
    '  - 電化製品: Brand / Model / MPN / Type / Color / Power Source / Connectivity',
    '  - 本・雑誌: Author / Publisher / Language / Format / Publication Year',
    '  - アンティーク・骨董: Original/Reproduction / Vintage / Material / Style / Period',
    '',
    '## 動作手順 (最小)',
    '',
    '1. **取得**: タグ参照シート A 列 + ソースシートのテキスト列 (B〜H) を取得。**カテゴリ参照 JSON も最初に 1 回 HTTP 取得**（上記「eBay カテゴリ ID 判定」の URL）。**画像は doGet で取得** (上記「画像入力」参照): 行ごとに `safeImages` を優先し、無い行だけ `mercariUrls` を使う。doGet レスポンスの `row` とテキストの行番号を突き合わせる。',
    '2. **集約バッチ**: 行範囲を集約バッチサイズで区切り、各バッチで AI に 1 リクエスト (システム 1 回 + 商品 N 件 + 画像を vision に渡す。`safeImages` の base64 を優先) → JSON 配列で受け取り。',
    '3. **後処理**: 各 JSON の recommendedUserTags をタグ許可リストでフィルタ + 先頭 1 つだけ採用 (0 件は `[]`)。**categoryId** は上記「eBay カテゴリ ID 判定」に従い、取得した参照JSONの候補内 ID のみ採用 (無ければ空)。Title は 80 字以内で短すぎないよう根拠ある語で充実させ、Description は 480 字以内・1 行・不要文除去済み、Item Specifics は可能な限り 10 フィールド以上になるまで再チェックする。**書込前に、生成した全行の M(Title)・N(Description) の文字数をコード等で機械的に実測する (目視で数えない)。N>480 は意味を保ったまま 480 以内に切り、M>80 も同様に直してから書き込む。実測前に書き込まない。**',
    '4. **書込**: 書込先シートの H 列を **毎バッチ再取得** して空行特定 → その行に書き込み (A〜BC、IS は ISF1-IS値20)。',
    '   - **A 列 = 今日の日付 (YYYY/MM/DD 形式、例: 2026/05/19)**',
    '   - **B 列 = 担当者名 (ユーザーから渡されたパラメータの「担当者名」)**',
    '   - **F 列 = categoryId** (上記「eBay カテゴリ ID 判定」で確定した数値 ID。候補内 ID のみ、無ければ空)',
    '   - **valueInputOption は `USER_ENTERED`** を使う (RAW 禁止)。',
    '   - **書き込み値は全て実値**にする。`=IMAGE(...)`、`=HYPERLINK(...)`、その他の数式は絶対に書き込まない。ソースシートからコピーする項目も、原則として参照式ではなく読み取った値そのものを書き込む。**ただし J 列・K 列だけは例外で、下記の専用ルールによりソース参照式 `=ソースシート!E{行}` / `=ソースシート!F{行}` を使う (転記ミス防止のため)。**',
    '   - **【J 列・K 列はソース参照式で出す (絶対)】** 日本語原文を手で打ち直してはならない (転記すると全角/半角・記号・脱字の誤りが必ず混入するため)。代わりに、J 列 = `=ソースシート名!E{対象行}`、K 列 = `=ソースシート名!F{対象行}` の参照式を書き込む (例: ソースが「インポート用」で対象行 187 なら J=`=\'インポート用\'!E187`、K=`=\'インポート用\'!F187`)。要約・翻訳・短縮も当然禁止。`valueInputOption` は `USER_ENTERED` で式として評価させる。これは「書き込み値は全て実値」ルールの明示的な例外で、J/K のみソース参照式を許可する。',
    '   - **数値項目 (仕入れ価格 / Year / Card Number 等) は数値型のまま書き込む** (文字列化禁止、先頭 `\'` が付加される現象を回避)。ただし `-` や `/` を含む短い英数値 (カード番号 `3-31`・型番・サイズ) は日付/分数に自動変換されるためテキストで書く。書込後 QA で、本来テキストの値が日付シリアル (40000 台の数値) に化けていないか確認する。',
    '   - **Year 系 Item Specific (Year / Year of Manufacture / Publication Year) はハイフン (`-`) で年の範囲を書かない。`1999-2000` のようなハイフン区切りや範囲表記は eBay 側でエラーになり登録できない。複数年・範囲がソースにある場合はカンマ + 半角スペース区切りで列挙する (例: `1999-2000` → `1999, 2000`)。単一年に確定できるならその 1 年だけを書く。カンマを含む年値はテキスト扱いで書き込む。**',
    '   - ソースシートからコピーする項目 (仕入れ価格・商品 ID・セラー ID) は、ソース側の型を保ったまま転記する。文字列を数値化したり、数値を文字列化したりしない。日本語 title (J) ・日本語説明 (K) は上記のとおりソース参照式で出す。',
    '5. **書込後 QA (必須)**: 書込直後に対象範囲を読み戻し、以下を確認・修正する。',
    '   - A列が今日の日付、B列が担当者名、H列が対象ソースの商品ID順になっている。',
    '   - M列が Title、N列が Description、P列以降が Item Specifics になっており、列ずれがない。',
    '   - Title は 80 字以内で、短すぎる場合は根拠ある語で充実させる。',
    '   - Description に配送方法、梱包、購入条件、値下げ、返品/保証、出品者都合の説明、第三者引用トーンが混入していない。',
    '   - P〜AI (IS 10 ペア分) が可能な限り埋まっている。10 ペア未満なら画像・説明を再確認して追加する。必要なら AJ〜BC まで使ってよい。',
    '   - **Title(M)・Description(N) の文字数はコード等で機械実測する (目視禁止)。M≤80・N≤480 を全行満たすことを数値で確認する。「だいたい大丈夫」で合格にしない。実測していないなら「合格」と報告しない。**',
    '   - **J 列・K 列が、対象行に対応するソース参照式 (`=ソースシート!E{行}` / `=ソースシート!F{行}`) になっており、評価結果がソース E/F 全文と一致しているかを確認する (行ずれ・参照先ズレがないか)。**',
    '   - **Year 系 Item Specific (Year / Year of Manufacture / Publication Year) にハイフン (`-`) の年範囲が残っていないか確認する。残っていればカンマ + 半角スペース区切り (例 `1999, 2000`) に直す。**',
    '   - D列タグは許可リスト内から 1 つ、F列categoryIdはbuckets候補内に実在する数値IDのみ。D列とF列の一致は確認しない (独立軸のため)。',
    '6. **完了報告**: 「完了。確認お願いします」と表示して終了。ただし categoryId / タグが空欄の行や Item Specifics が 10 未満の行があれば、その行と理由を短く添える。',
    '',
    '## 実行運用 (速度・信頼性)',
    '',
    '- **担当範囲は最後まで仕上げる**: 1 つの実行単位が、担当行についてスキル一連 (読込 → 必要な画像確認 → 1 行精査 → タグ・カテゴリ判定 → 書込 → 自己 QA) を完結させる。「翻訳だけ」「QA だけ」と役割を細切れに分けない。',
    '- **共通準備は 1 回だけ**: タグ許可リスト取得・カテゴリ参照 JSON 取得などの固定準備は最初に 1 回行い使い回す。',
    '- **QA は読み取り専用で最後に 1 回**: QA 層を何段も重ねない。特に「タグとカテゴリを揃える」QA はしない (両者は独立軸)。',
    '- **修正は個別セル指定で行う**: 書込先の修正は `D35` `F35` のように 1 セルずつ明示指定で更新する。**チャンク単位の列範囲の一括書き換えは行ずれ事故を起こすため禁止**。',
    '- **画像は要所のみ**: テキスト (日本語タイトル・説明) だけで Title/IS/Description が十分に書ける商品は画像取得をスキップする。全行 1 枚ずつ取得しない (base64 → 一時ファイル → Read の往復が最大のコスト要因)。',
    '- **画像の base64 をモデル文脈に通さない**: doGet が返す base64 は、シェル内で取り出してファイルに復号する (例: 応答 JSON を `jq` で抜き、`data:image/...;base64,` 接頭辞を除いて `base64 -d` で画像ファイルへ)。**base64 文字列を標準出力やツール結果としてモデルのコンテキストに載せない**。最後にできた小さな画像ファイルだけを Read する。理由: base64 をモデルに取り込むと「base64 テキスト + 画像」で同じ画像を二重に処理し、トークンを大きく浪費するため。Claude Code では vision の入口が Read (ファイル) のみで data URL を直接渡せないため、ファイル化は必須だが、二重取り込みはこの方法で避けられる。',
    '- **着手前に必ずタグ参照シート (TagShipping 等) の A 列を読む**: 推測でタグ許可リストを作らない。',
    '- **I/O はまとめる / 精査は 1 行ずつ (両立)**: スプレッドシートの読みは batch 取得、書き込みは範囲一括で行う。画像取得 (doGet) と参照取得はバッチに 1 回だけ。ただし商品ごとの情報精査・タグ/カテゴリ判定・英文化は 1 行ずつ維持する。まとめてよいのは I/O であって、商品判断ではない。',
    '- **画像は並列で読む**: 復号済みの画像ファイルは 1 応答でまとめて並列に視覚入力する。1 枚ずつ往復しない。',
    '- **1 ワーカーでバッチ処理する**: この作業は 1 つの実行単位がバッチを I/O まとめ + 画像並列 + 範囲書込で処理するのが速い。**多数のサブエージェントへ細分化委託したり、QA・修正を別パスに何段も分けたりしない** (準備の重複・段階間の往復・行ずれ事故でかえって遅くなる、と実測)。',
    '- **書込後 QA も範囲まとめで 1 回**: 書込先を範囲 batch 取得し、列ずれ・参照式残り・タグ/カテゴリ・IS 充実度をまとめて確認する。修正は個別セル指定で行う。',
    '',
    '## 失敗時の最小ハンドリング',
    '',
    '- HTTP 429/5xx → 指数バックオフリトライ (2s/4s/8s)',
    '- HTTP 4xx (429 除く) / Safety フィルター (promptFeedback.blockReason or finishReason=\'SAFETY\') → 即失敗、該当行の Title 列に `ERROR` と書いてスキップ',
    '- バッチで複数件失敗時は、その失敗行のみ直列フォールバック (1 件ずつ再実行)'
  ]).join('\n');
}

// ============================================================================
// 公開関数 — 再出品取り込みスキル本文
// ============================================================================
function getRelistingImportSkillContent() {
  // ★スキル本文を変えたら CHANGELOG の先頭に {date, text} を1件追加(新しい順・事実を正確に)。
  var CHANGELOG = [
    { date: '2026-06-10-2', text: '新フォーマット（Item Specifics入りxlsx）対応を追加。形式判定（旧→インポート用／新→v5インポート直接転記）、ISのname/value物理2列ペア方式（ヘッダー誤記対策）、BF列へのURL生成、BD/BE列保護を明記' },
    { date: '2026-06-10', text: '【重要修正】インポート用の最初のデータ行は3行目（旧記述「4行目以降・3行目は触らない」は誤り）。3行目から空き行を探すよう修正' },
    { date: '2026-06-10', text: '書き込み前に実データで空き行を正しく特定してから実行する（行番号を推測しない・既存データ上書き厳禁）を§8の最重要ルールとして明確化' },
    { date: '2026-06-09', text: '起動トリガーを日本語「再出品実行」に設定。英語スキル名(relisting-import)を入力しなくても起動できるようにした' },
    { date: '2026-06-09', text: '初版。再出品ファイル(CSV/xlsx)をインポート用シートへ転記＋商品URL生成。仕入価格(円)をD列価格へ(ドル価格は使わない)。翻訳/タグ/IS再構築は対象外' }
  ];
  var version = (CHANGELOG[0] && CHANGELOG[0].date) ? CHANGELOG[0].date : '';
  var historyBlock = ['<!-- 【変更履歴】人向けメモ。スキル実行には影響しません（新規の方は読み飛ばして OK ／ 更新の方はここで変更点を確認）。']
    .concat(CHANGELOG.map(function (c) { return '- ' + c.date + ': ' + c.text; }))
    .concat(['-->']);
  return historyBlock.concat([
    '======================（ここから下をコピーしてスキルに登録）======================',
    '',
    '# Relisting Import',
    '',
    'バージョン: ' + version,
    '',
    '扱うデータは1件1件が実際に販売される商品です。1行の書き違いがeBay収入に直結します。急がず、確認してから書く。',
    '',
    '## 起動トリガー',
    '',
    'ユーザーが「再出品実行」と指示したら、このスキルを開始する。英語のスキル名 `relisting-import` を入力する必要はない。',
    '',
    '開始時に「再出品ファイル」または「入力先スプレッドシートURL」が指示に含まれていなければ、先にユーザーに尋ねてから進める。',
    '',
    'CSV/xlsxの解析には `spreadsheets` スキル、Google Sheetsの読み書きには `google-drive:google-sheets` スキルを使う。',
    '',
    '## 目的',
    '',
    '再出品ファイルの形式を判定し、形式に合ったシートへ安全に転記する。',
    '',
    '| 元ファイル形式 | 転記先 | 目的 |',
    '|---|---|---|',
    '| 旧フォーマット | `インポート用` | 最低限の再出品元データを入れ、後続の `relisting-translation` でv5行を生成する |',
    '| 新フォーマット（IS入り） | `v5インポート` | 既存の英語Title/Condition/Item Specificsを活かしたv5下書きを作る |',
    '',
    'このスキルでは英語Title/Condition/Item Specificsの再生成・精査はしない。新フォーマットでは、元ファイルの値をv5へ配置し、URLをBF列に生成するところまで行う。精査・修正は `relisting-translation` のv5モードで行う。',
    '',
    '## 入力',
    '',
    '必要な入力:',
    '',
    '- 再出品ファイルのパス（CSVまたはxlsx）',
    '- 入力先スプレッドシートのURL',
    '',
    '## 必須の事前確認',
    '',
    '書き込み前に必ず以下を報告し、ユーザー確認を得る。',
    '',
    '- 判定した形式（旧フォーマット / 新フォーマット）',
    '- 転記先シート名',
    '- 転記候補件数',
    '- スキップ予定行と理由',
    '- 価格に使う元列',
    '- URL生成対象件数',
    '- 新フォーマットの場合、Item Specificsの列ペア検査結果',
    '',
    'ユーザーが「まだ書き込みしない」と言った場合は、ファイル読取と対応表作成だけで止める。',
    '',
    '## 形式判定',
    '',
    '2行目をヘッダーとして読む。列位置はファイルごとに変わるため、列記号ではなくヘッダー名で判定する。',
    '',
    '### 旧フォーマット',
    '',
    '次の列があり、`name1/value1` 系のItem Specifics列がない、または使わない構造の場合:',
    '',
    '- `仕入先`',
    '- `仕入先コード`',
    '- `ttle`',
    '- `コンディション説明`',
    '- `仕入価格`',
    '',
    '旧フォーマットは `インポート用` へ転記する。',
    '',
    '### 新フォーマット（IS入り）',
    '',
    '次の列がある場合は新フォーマットとして扱う。',
    '',
    '- `テンプレートID`',
    '- `参考EbayID`',
    '- `カテゴリID`',
    '- `仕入先`',
    '- `仕入先コード`',
    '- `価格`',
    '- `ttle`',
    '- `custom label`',
    '- `コンディション説明`',
    '- `シッピングポリシー`',
    '- `name1` と `value1`',
    '- `仕入価格`',
    '',
    '新フォーマットは `v5インポート` へ直接転記する。',
    '',
    '### 判定不能',
    '',
    '必須ヘッダーが欠けている、必須ヘッダー自体が重複している、または旧/新のどちらか確定できない場合は書き込み前に停止して報告する。推測で転記しない。',
    '',
    'ただし、新フォーマットのItem Specifics領域で、`value18` が `value19` と誤記されているようなヘッダー番号だけのずれは、後述の物理2列ペア方式で扱う。',
    '',
    '## 価格列の取り違え厳禁',
    '',
    '仕入価格として使うのは、元ファイルの `仕入価格` のみ。',
    '',
    '- `価格` はeBay販売価格系の小数である可能性が高いため、仕入価格として絶対に使わない。',
    '- `仕入価格` は円の整数として検証する。',
    '- 欠損、整数化できない値、またはドル価格と思われる値は書き込まず、その行を失敗として報告する。',
    '- 書き込み前に、選択した元列のヘッダーが完全に `仕入価格` であることを再確認する。',
    '',
    '## 対象行判定',
    '',
    '3行目以降をデータ行として扱う。',
    '',
    '共通スキップ条件:',
    '',
    '- `仕入先コード` が空',
    '- `仕入先` が空、`none`、または未対応値',
    '- `ttle` が空',
    '- `仕入価格` が検証できない',
    '- URL生成に失敗した',
    '',
    '新フォーマットでは `コンディション説明` が空の行も原則スキップする。ただし、ユーザーが明示的に許可した場合だけ、Condition空欄としてv5へ入れる。',
    '',
    '## 商品URL生成ルール',
    '',
    '仕入先コードからURLを組み立てる。`{code}` は仕入先コードの値。',
    '',
    '| 仕入先の値 | 組み立てるURL |',
    '|---|---|',
    '| `mercari` | `https://jp.mercari.com/item/{code}` |',
    '| `mercari_shop` | `https://jp.mercari.com/shops/product/{code}` |',
    '| `yahuoku` / `ヤフオク` | `https://page.auctions.yahoo.co.jp/jp/auction/{code}` |',
    '| `paypayfurima` / `PayPayフリマ` | `https://paypayfleamarket.yahoo.co.jp/item/{code}` |',
    '| `rakuma` / `ラクマ` | `https://item.fril.jp/{code}` |',
    '| `hardoff` | `https://netmall.hardoff.co.jp/product/{code}/` |',
    '',
    '`rakuten` / `yahooshopping` / `amazon` はコードの実形に揺れがあるため、確実に生成できない場合は書き込まず報告する。',
    '',
    'URL検証は代表サンプル数件の形式確認に留める。eBayへのアクセス・スクレイピングは禁止。',
    '',
    '## 旧フォーマット: `インポート用` への転記',
    '',
    '入力先 `インポート用` は2行目がヘッダー、3行目以降がデータ。書き込み開始行は、B:Hに既存データがない最初の行。',
    '',
    '| インポート用の列 | 元ファイルから取得 |',
    '|---|---|',
    '| A タグ | 空欄のまま |',
    '| B 仕入先 | `仕入先` |',
    '| C 仕入先コード | `仕入先コード` |',
    '| D 価格 | `仕入価格` |',
    '| E title/ttle | `ttle` |',
    '| F 商品説明 | `コンディション説明` |',
    '| G セラーID | 空欄のまま |',
    '| H URL | 生成URL |',
    '',
    'ルール:',
    '',
    '- B:FおよびHだけに実値を書く。',
    '- A列とG列は新規書き込みしない。既存値も変更しない。',
    '- C列の既存仕入先コードを読み、重複する行は追加しない。',
    '- 既存データがある行は上書きしない。',
    '',
    '## 新フォーマット: `v5インポート` への転記',
    '',
    '新フォーマットでは `v5インポート` に直接下書きを作る。既存の英語Title/Condition/Item Specificsを活かし、後続のv5上での精査に渡す。',
    '',
    '`v5インポート` は2行目がヘッダー、3行目以降がデータ。書き込み開始行は、H列（仕入れ先コード）が空の最初の行。ただし、既存データがある行は上書きしない。',
    '',
    '### 列マッピング',
    '',
    '| v5インポートの列 | 書込内容 |',
    '|---|---|',
    '| A 日付 | 今日の日付（YYYY/MM/DD） |',
    '| B 担当 | `AI`。ユーザーまたはプロファイルで担当者名が指定されている場合はその値 |',
    '| C label | 元 `custom label` |',
    '| D タグ | 元 `タグ` |',
    '| E テンプレート | 元 `テンプレートID` |',
    '| F カテゴリーID | 元 `カテゴリID` |',
    '| G 仕入れ先 | 元 `仕入先` |',
    '| H 仕入れ先コード | 元 `仕入先コード` |',
    '| I 仕入れ価格 | 元 `仕入価格` |',
    '| J 日本語title | 元 `ttle`。新フォーマットでは既存英語Titleだが、元タイトル保管欄として実値で入れる |',
    '| K 商品説明 | 元 `コンディション説明`。既存英語Conditionを実値で入れる |',
    '| L セラーID | 空欄 |',
    '| M Title | 元 `ttle` を初期Titleとして実値で入れる |',
    '| N Condition/Description | 元 `コンディション説明` を初期Conditionとして実値で入れる |',
    '| O シッピングポリシー | 元 `シッピングポリシー` |',
    '| P:BC ISF/IS値 | 元 `nameN/valueN` ペア |',
    '| BF | 生成URL |',
    '',
    '重要:',
    '',
    '- BD列（重複チェック）とBE列は触らない。',
    '- BF列はURL専用として実値を書き込む。',
    '- A:BC と BF だけを更新対象にする。A:BFを一括更新してBD/BEを空欄で潰さない。',
    '- J/K/M/Nは数式ではなく実値で入れる。新フォーマットでは元データ自体が再出品v5下書きだから。',
    '',
    '### Item Specifics列の扱い',
    '',
    '元xlsxの2行目ヘッダーと、`v5インポート` の2行目ヘッダーを必ず確認してから対応させる。',
    '',
    '新フォーマットでは、元xlsxのIS領域は `name1/value1` から始まる2列ペアの連続ブロックとして扱う。ヘッダー文字列だけで `valueN` を探さない。理由は、元テンプレート側で `value18` が `value19` と誤記されているなど、ヘッダー名だけがずれている場合があるため。',
    '',
    '対応ルール:',
    '',
    '1. 元xlsx 2行目で `name1` の列を見つける。',
    '2. そこから右方向に、`name列 / value列` の2列ペアとして最大20組を読む。',
    '3. v5側は2行目ヘッダーの `ISF1/IS値1` から `ISF20/IS値20` へ、同じペア番号で入れる。',
    '4. 例: 元 `name18` の右隣列は、ヘッダー表記が `value19` でも、物理的な18番目の値列としてv5の `IS値18` へ入れる。',
    '',
    '今回確認した新フォーマット例:',
    '',
    '| 元xlsx列 | 元xlsx 2行目 | 扱い | v5列 |',
    '|---|---|---|---|',
    '| AW | `name18` | ISF18 | AX |',
    '| AX | `value19` | IS値18として扱う（ヘッダー誤記） | AY |',
    '| AY | `name19` | ISF19 | AZ |',
    '| AZ | `value19` | IS値19 | BA |',
    '',
    '書き込み前に停止する条件:',
    '',
    '- `name1` の開始列が見つからない。',
    '- IS領域が2列ペアとして連続していない。',
    '- `name` 列と `value` 列の左右関係が崩れている。',
    '- v5側の `ISF1/IS値1` から `ISF20/IS値20` のヘッダーが2行目に存在しない、または順序が崩れている。',
    '- 同じv5列へ複数の元列が割り当たる。',
    '',
    'ヘッダー名の番号だけが違うが、2列ペア構造が保たれている場合は、停止ではなく警告として報告し、物理ペア順で転記する。',
    '',
    '空のItem Specificsペアは空欄のまま入れてよい。値が `Does not apply` の場合はそのまま転記し、精査・削除は `relisting-translation` のv5モードに任せる。',
    '',
    '## 書き込みの安全ルール',
    '',
    '1. 元データを解析し、形式、対象行、スキップ行、価格列、URL、Item Specifics列を検証する。',
    '2. 書き込み直前に入力先シートの現状を再取得する。古いスナップショットを使い回さない。',
    '3. read -> 判定 -> write の順を厳守する。',
    '4. 既存仕入先コードを読み、同じ仕入先コードが既に存在する行は重複として追加しない。',
    '5. 既存データのある行は上書きしない。',
    '6. 書き込み後に対象範囲を再取得し、行数、仕入先コード、仕入価格、URL、列ずれがないことを照合する。',
    '7. 同一エラーが2回連続で発生したら停止して報告する。',
    '',
    '## 完了報告',
    '',
    '問題がなければ、次の1行だけを返す。',
    '',
    '`完了。確認をお願いします`',
    '',
    '次の場合だけ、対象となる元ファイル行または入力先行と理由を短く箇条書きで追加する。',
    '',
    '- URL生成に失敗した行がある',
    '- 仕入価格が取れなかった、または検証できなかった行がある',
    '- 重複と判断してスキップした行がある',
    '- 新フォーマットでItem Specificsのヘッダー誤記・構造不整合がある',
    '- 新フォーマットでCondition空欄など、v5下書きとして危険な行をスキップした',
  ]).join('\n');
}

// ============================================================================
// 公開関数 — 再出品翻訳スキル本文
// ============================================================================
function getRelistingTranslationSkillContent() {
  // ★スキル本文を変えたら CHANGELOG の先頭に {date, text} を1件追加(新しい順・事実を正確に)。
  var CHANGELOG = [
    { date: '2026-06-28', text: 'トレカ／スポーツトレカ等のカード商品(4 ID 該当品全般・スポーツ含む)も再作成 Title に Collectible 13+ を必ず入れる規則を追加' },
    { date: '2026-06-24', text: '手元最新版へ同期: コレクター扱い商品の再作成 Title に `Collectible 13+` を必ず入れるルールを追加(Age Level 14+/16+でも常に固定、80字内)。製造国対応表を ebay-translation 版に揃える' },
    { date: '2026-06-18-1', text: '再出品の前提（既に出品・完成済みの商品／売れ残りを新規リスティング化するのが核心）を冒頭に明記。Titleは機械的な語順入れ替えでなく『精査して作り直す（再生成）』に明確化。同義語置換必須・語順大幅変更の機械検査・元の語だけ使う縛りを撤廃。前回タイトルと同一禁止の機械確認は維持。' },
    { date: '2026-06-17-2', text: 'Title組み替えに同義語置換(最低1語)とSEO語順を明文化。トレカ4カテゴリ(261328/261329/183454/183455)固定をカテゴリ節に統合。旧方式・新方式とも全件組み替え必須を再確認' },
    { date: '2026-06-11', text: 'トレカ／スポーツトレカのカード商品の categoryId を 4 ID に固定(スポーツ1枚=261328/スポーツ2枚以上・ボックス=261329/キャラ・アニメ系1枚=183454/同2枚以上=183455)。メンコ等の非CCGカードも CCG カテゴリ必須。既存F列が反する場合は修正' },
    { date: '2026-06-10-5', text: 'v5インポート上で直接精査するモードA（既存v5精査）/モードB（URL参照つき精査）を追加。消失チェックスキルへの依存を削除しG列「消失」は手動除外フラグに変更。BF列URLを参照情報として使用' },
    { date: '2026-06-10', text: '初版。再出品向けに既存英語タイトル/コンディションからTitle再生成＋Condition(原則転記/誤りは訂正)＋IS/タグ/カテゴリをv5インポートへ生成。起動「再出品翻訳」。モード1/2選択・対象行は自動検出後に確認' }
  ];
  var version = (CHANGELOG[0] && CHANGELOG[0].date) ? CHANGELOG[0].date : '';
  var historyBlock = ['<!-- 【変更履歴】人向けメモ。スキル実行には影響しません（新規の方は読み飛ばして OK ／ 更新の方はここで変更点を確認）。']
    .concat(CHANGELOG.map(function (c) { return '- ' + c.date + ': ' + c.text; }))
    .concat(['-->']);
  return historyBlock.concat([
    '======================（ここから下をコピーしてスキルに登録）======================',
    '',
    '# Relisting Translation',
    '',
    'バージョン: ' + version,
    '',
    '扱うデータは1件1件が実際に販売される商品です。1行の書き違いがeBay収入に直結します。急がず、確認してから書く。',
    '',
    '## このスキルの前提（最初に読む）',
    '',
    'これは「再出品」のスキル。新規翻訳ではない。',
    '',
    '- 扱う商品は、一度eBayに出品したが売れなかった（または日数が経って取り下げた）商品。最初の出品時に、英語のタイトル・コンディション・Item Specifics・カテゴリは**すでに作成され、完成している**。ゼロから翻訳・作成し直す作業ではない。',
    '- 同じ内容のまま出し直すと、eBay検索（Cassini）は同一リスティングとみなして埋もれさせる。新規リスティングとして拾わせるには、出品内容を変える必要がある。',
    '- **このスキルの核心は、タイトルを作り直す（再生成）こと。** 前回と別の、検索に効く新しいタイトルにする。これが再出品で最も重要な仕事。',
    '- コンディション・Item Specifics・カテゴリ・タグは、最初の出品時の完成データを**活かす**。明らかな誤り・列ずれ・禁止語だけを直す。ゼロから作り直さない。',
    '- タイトルの作り直しは機械的な語順入れ替えではない。商品（既存タイトル・コンディション、モードに応じて仕入れ先ページ）を1行ずつ精査し、中身を理解して新しいタイトルを作る。',
    '',
    '## 起動トリガー',
    '',
    'ユーザーが「再出品翻訳」と指示したら、このスキルを開始する。英語のスキル名 `relisting-translation` を入力する必要はない。',
    '',
    '## 第一ルール: 情報精査は1行ずつ',
    '',
    'これは商品です。データ行ではありません。1件1件が実際に販売される商品です。',
    '',
    '- 情報精査（ソーステキスト読込・タグ判定・カテゴリ判定・Title/Condition/IS生成または精査）は必ず1行ずつ実行する。',
    '- バッチ処理で複数行を一度に判定してはならない。',
    '- 書き込み（Sheets APIによる更新）はバッチでもよい。ただし、書き込む前に各行の情報精査を必ず1行ずつ完了させる。',
    '',
    'このルールは他の全てのルールに優先する。',
    '',
    '## 最初に確認すること',
    '',
    '毎回、対象シートを確認する。',
    '',
    '| 対象シート | 方針 |',
    '|---|---|',
    '| `インポート用` | 旧方式。B:Hの元データから `v5インポート` へ新しいv5行を生成する |',
    '| `v5インポート` | 新方式。既にv5へ入っているデータを使い、M列Titleは全件作り直す（再生成）。Condition/Item Specificsは既存の完成データを活かし、誤りだけ補正する |',
    '',
    'ユーザーが対象シートを明示していない場合は、最初に「インポート用とv5インポートのどちらで実行しますか？」と聞く。',
    '',
    '## モード',
    '',
    '対象シートごとにモードの意味が変わる。',
    '',
    '### `インポート用` から実行する場合',
    '',
    '- モード1 = 仕入れ先ページ主軸: 仕入れ先URLの実ページ情報を主軸に、正しい情報でTitle / Condition / IS / カテゴリ / タグを作成する。ページが削除・売り切れで存在しない行はモード2相当で処理する。',
    '- モード2 = 既存主軸＋補助: ソースE列の既存英語タイトル・F列の既存英語コンディションを主軸に作成し、仕入れ先URLは補助情報としてのみ参照する。',
    '',
    '### `v5インポート` 上で実行する場合',
    '',
    '- モードA = 既存v5主軸: 既に入っているJ/M列Title、N列Condition、P:BCのItem Specificsを主軸にする。ただしM列Titleは対象全行で必ず作り直す（再生成）、既存M列・J列と同一にしない。BF列URLは必要時だけ補助として使う。',
    '- モードB = URL参照つき精査: BF列URLの仕入れ先ページを補助情報として参照し、既存v5内容と矛盾があれば修正する。M列TitleはモードAと同じく対象全行で必ず作り直す（再生成）。ページが見られない場合はモードA相当で処理する。',
    '',
    '`v5インポート` モードでは、Titleだけは全件作り直し（再生成）が必須。Condition/IS/category/tagは最初の出品時の完成データを活かし、誤りだけ直す。ユーザーが「作り直し」と明示した行だけ、Condition/ISも作り直してよい。',
    '',
    '## 入力: 旧方式 `インポート用`',
    '',
    '| 列 | 内容 | 補足 |',
    '|---|---|---|',
    '| B | 仕入先 | mercari / yahuoku 等 |',
    '| C | 仕入先コード | 商品固有ID |',
    '| D | 仕入価格（円） | 数値 |',
    '| E | 既存の英語タイトル | 再出品取り込み済み・すでに英語 |',
    '| F | 既存の英語コンディション | 再出品取り込み済み・すでに英語 |',
    '| G | セラーID / 除外フラグ | `消失` が入っている行は翻訳対象から除外する |',
    '| H | 商品URL | 仕入れ先の商品ページURL |',
    '',
    '重要: `ebay-translation` と違い、E/F列はすでに英語。日本語ではない。',
    '',
    '## 入力: 新方式 `v5インポート`',
    '',
    '`relisting-import` が新フォーマットIS入りxlsxから直接作ったv5下書きを処理する。',
    '',
    '| 列 | 内容 |',
    '|---|---|',
    '| A | 日付 |',
    '| B | 担当 |',
    '| C | label |',
    '| D | タグ |',
    '| E | テンプレート |',
    '| F | カテゴリーID |',
    '| G | 仕入れ先 |',
    '| H | 仕入れ先コード |',
    '| I | 仕入れ価格 |',
    '| J | 元タイトル保管欄。新方式では英語Titleが入っていることがある |',
    '| K | 元商品説明保管欄。新方式では英語Conditionが入っていることがある |',
    '| M | Title |',
    '| N | Condition/Description |',
    '| O | シッピングポリシー |',
    '| P:BC | Item Specifics（ISF1/IS値1〜ISF20/IS値20） |',
    '| BD | 重複チェック。変更禁止 |',
    '| BF | 仕入先URL。新方式ではここを参照URLとして使う |',
    '',
    '重要:',
    '',
    '- BF列はURL参照用。タイトルやISを直すかどうかの判断材料にする。',
    '- BD列とBE列は変更しない。',
    '- M/N/P:BCを主な修正対象にする。A:I/J/K/O/BFは原則変更しない。',
    '',
    '## 出力: 旧方式で `v5インポート` に新規作成する場合',
    '',
    '`ebay-translation` と同じ列構成で書き込む。',
    '',
    '| 列 | 内容 |',
    '|---|---|',
    '| A | 今日の日付（YYYY/MM/DD） |',
    '| B | 担当者名 |',
    '| D | タグ（TagShipping A列許可リストから0〜1個） |',
    '| F | categoryID（参照JSONから） |',
    '| G | 仕入先（ソースB列） |',
    '| H | 仕入先コード（ソースC列） |',
    '| I | 仕入価格（ソースD列） |',
    '| J | `=\'インポート用\'!E{行}` |',
    '| K | `=\'インポート用\'!F{行}` |',
    '| L | セラーID（ソースG列。ただし `消失` の場合は空欄） |',
    '| M | Title（英語80字以内・作り直す＝再生成） |',
    '| N | Condition/Description（英語480字以内・1行） |',
    '| P:BC | Item Specifics（ISF/IS値ペア） |',
    '',
    'J列・K列は必ずソース参照式で出す。手転記は禁止。書込行は `v5インポート` のH列が空の最初の行から順次追記し、既存データを上書きしない。`valueInputOption` は `USER_ENTERED` を使う（RAW禁止）。',
    '',
    '## 出力: 新方式で `v5インポート` を精査する場合',
    '',
    '既存行を直接更新する。新規行は作らない。',
    '',
    '主な更新対象:',
    '',
    '- D列タグ（必要な場合だけ）',
    '- F列カテゴリーID（明らかに空または不適切な場合だけ）',
    '- M列Title（対象全行で必ず作り直す（再生成））',
    '- N列Condition/Description',
    '- P:BC Item Specifics',
    '',
    '原則変更しない列:',
    '',
    '- A:B 日付・担当',
    '- C label',
    '- E テンプレート',
    '- G:H 仕入先・仕入先コード',
    '- I 仕入価格',
    '- J:K 元タイトル・元説明保管欄',
    '- O シッピングポリシー',
    '- BD:BE',
    '- BF URL',
    '',
    '## 対象行検出',
    '',
    '### `インポート用`',
    '',
    'ソースシート「インポート用」にデータ（仕入先コードなど）があり、書込先「v5インポート」のH列（仕入先コード）が未記入の行を「処理待ち行」として自動検出する。G列が `消失` の行は翻訳対象に含めない。',
    '',
    '### `v5インポート`',
    '',
    'ユーザーが範囲を指定した場合はその範囲を使う。指定がない場合は、H列に仕入先コードがあり、次のいずれかに該当する行を候補として提示する。',
    '',
    '- BF列にURLがある',
    '- M列またはN列が空',
    '- P:BCにItem Specificsが入っている',
    '- D/F/M/N/P:BCの精査が必要だとユーザーが述べている',
    '',
    '候補行を提示し、ユーザー確認後に実行する。',
    '',
    '## 除外フラグ',
    '',
    '- `消失` は「インポート用」G列だけに記録する。A列には書かない。',
    '- `消失` はTagShippingのタグではないため、`v5インポート` D列タグには書かない。',
    '- ソースG列が `消失` の場合、`v5インポート` L列（セラーID）は空欄にする。`消失` をセラーIDとして転記しない。',
    '- `消失` 行は原則として `v5インポート` に書き込まない。ユーザーが「消失行も翻訳する」と明示した場合だけ、既存情報主軸で処理する。',
    '- 通信失敗やDNS失敗だけで消失扱いにしない。',
    '',
    '## Title（M列）',
    '',
    '再出品の核心。対象全行で、タイトルを必ず作り直す（再生成）。前回Title・取り込み時Title・J列元タイトル・既存M列Titleと同一にしない。',
    '',
    '作り直しの考え方:',
    '',
    '- 商品（既存タイトル・コンディション、モードに応じて仕入れ先ページ）を精査し、その商品にとって検索に効く、正確なタイトルを新しく作る。',
    '- 機械的に語順を入れ替えるだけ・同義語に置き換えるだけ、にしない。中身を理解して作る。',
    '- 高価値キーワード（ブランド・商品種別・主要スペック）を前方に置き、検索されやすい構成にする。',
    '- 商品の事実は変えない。確認できないブランド・型番・数量・素材・状態は足さない（ハルシネーション禁止）。数値・型番は正確に転記する。',
    '- 前回タイトルと同一は禁止。書込前に「新M列Title != 前回タイトル（旧M列Title / J列元タイトル）」をコード等で機械確認する。一致があれば作り直す。',
    '',
    '共通ルール:',
    '',
    '- 80字以内。書込前にコード等でTitle文字数を機械的に実測する。目視は禁止。',
    '- 最初の30字に高価値キーワードを入れる。',
    '- 許可記号: `& / : - . ,`（TCG・グレード等では `# \' +` も可）。',
    '- 禁止記号: `* $ ~ ^ @ ! ? ™ ( ) [ ] { } " _ % = | \\ < > ;`。',
    '- VeRO抵触語 `AUTHENTIC` / `OFFICIAL` は使わない。',
    '- 根拠なき誇張語 `RARE` / `LIMITED` / `VINTAGE` はソース根拠がある場合のみ。`Mint` / `Excellent` などもソース根拠が薄ければ使わない。',
    '- ブランド名は1つ。時計のTitleには時計本体のブランドのみ使う。',
    '- 色名として `Tiffany Blue` / `Tiffany blue` は使わない。青系は `Turquoise Blue` / `Aqua Blue` / `Light Blue` などで表現する。',
    '',
    '## Condition（N列）',
    '',
    '旧方式では既存コンディション（ソースF列）をベースに作る。新方式では既存N列を主軸に、必要な場合だけ修正する。',
    '',
    '共通ルール:',
    '',
    '- 480字以内・ASCII・1行のみ。改行 `\\n` を含めない。',
    '- Pre-owned基調。ソースが「未使用」でも `new` / `Brand New` は使わない。`Pre-owned, unused` / `Pre-owned, sealed and unopened` は可。',
    '- 第三者引用 `per seller notes` / `according to seller` などは禁止。出品者自身が言い切る形で書く。',
    '- 配送方法・梱包条件・補償/取引文言・保管環境・値下げ情報・eBay側で別管理する情報は除去する。',
    '- 書込前にコード等でDescription文字数を機械的に実測する。目視は禁止。',
    '',
    '## Item Specifics / categoryID / タグ',
    '',
    '### Item Specifics',
    '',
    'P:BCをISF/IS値ペアとして扱う。',
    '',
    '旧方式:',
    '',
    '- 画像・テキストから確実に分かるもののみ出力する。',
    '- 最低10フィールドを目標にする。ただし嘘・推測・根拠なし情報は入れない。',
    '',
    '新方式:',
    '',
    '- 既存P:BCを主軸に、列ずれ、禁止語、明らかな誤り、空欄の補完だけを行う。',
    '- `Does not apply` は機械的に削除しない。カテゴリや項目として不適切な場合のみ修正する。',
    '- 元xlsx由来の順序があるため、必要な場合だけ並び替える。',
    '- ISF列とIS値列のペアが崩れている場合は書き込み前に停止して報告する。',
    '',
    '共通禁止・優先ルール:',
    '',
    '- `Country/Region of Manufacture` は原則必ず出力する。製造国ではなくブランド国・権利元の国で判定する。',
    '- `Occasion` は出品ツールが `CASIO` と誤認するため使用禁止。代替として `Use` / `Scene` / `Style` / `Wear` / `Event` を使う。',
    '- 動物素材ワード `Crocodile` / `Alligator` / `Ivory` / `Ostrich` / `Snake` などは禁止。素材不明・人工なら `Leather` / `Faux leather` などで表現する。',
    '- ハルシネーション禁止。画像・テキスト・Web検索で確認できない仕様は推測しない。',
    '- 玩具・キャラクター系はCollectiblesカテゴリ優先。Age Levelは元データに幼児向け年齢が書かれていても必ず `13+` / `14+` / `16+` のいずれかにする（デフォルト `14+`）。',
    '- **【必須】コレクター扱いの商品は再作成 Title に `Collectible 13+` を必ず入れる**: コレクター扱い (Item Specifics の Type を `Collectible 〜` にする＝Age Level を付与する) にする商品 (アニメグッズ・キャラ/アイドルグッズ・フィギュア・ドール等) は、再作成する Title (M 列) に必ず `Collectible 13+` の文字列を入れる。Age Level を `14+` / `16+` にした商品でも Title 表記は常に `Collectible 13+` 固定 (Age Level 欄と一致させない)。Title 80 字制限内に必ず収める。 なお、トレカ／スポーツトレカ等のカード商品 (上記カテゴリ 4 ID 該当品) も、Age Level の付与有無に関わらず Title に `Collectible 13+` を必ず入れる。',
    '',
    '`Country/Region of Manufacture` の基準:',
    '',
    '| 商品・ブランド | 値 |',
    '|---|---|',
    '| フィギュア / アニメグッズ / 漫画 / 書籍 / CD / DVD / 日本作品キャラクター商品 | Japan |',
    '| Casio / Seiko / Citizen / Orient | Japan |',
    '| Dior / Christian Dior / Cartier | France |',
    '| Gucci / Ferragamo / Salvatore Ferragamo / Prada / Fendi / Bvlgari / Panerai | Italy |',
    '| Georg Jensen | Denmark |',
    '| Omega / Tag Heuer / Patek Philippe / Audemars Piguet / IWC / Tudor / Longines / Breitling / Hamilton / Hublot / Zenith / Jaeger-LeCoultre | Switzerland |',
    '| ブランド国が判定できる場合 | その国 |',
    '| 辞書外で不明な場合 | Japan |',
    '',
    '### eBayカテゴリID（F列）',
    '',
    '実行前にカテゴリ参照JSONを1回HTTP取得する。',
    '',
    '`https://naokijodan.github.io/bulksheet-ebay-categories/ebay-category-buckets.json`',
    '',
    'このJSONは `{ tagToGenre, buckets }` 形式で、eBay US treeVersion 134の公式確定IDを含む。',
    '',
    '- 商品の実態（画像・テキスト）からカテゴリを判定する。タグのgenreに縛られない。',
    '- `buckets` のいずれかの候補リスト内に実在する数値IDのみ採用する。リストにない番号は創作しない。',
    '- 新方式では既存F列があり、明らかな誤りがなければ維持する。',
    '- 候補がない、または不明の場合は空にする。',
    '- 漫画セット/単巻は原則 `259109`。アニメグッズで細分類なしは `69528`。',
    '- 玩具・キャラクター系はCollectiblesツリー（pathが `Collectibles >` で始まるID）を優先する。',
    '- **【必須・固定】トレカ／スポーツトレカのカード商品は次の 4 ID だけを使う**: スポーツカード1枚=`261328`(Trading Card Singles)／スポーツカード2枚以上・セット・ボックス・未開封=`261329`(Trading Card Lots)／キャラ・アニメ系トレカ1枚=`183454`(CCG Individual Cards)／同2枚以上・まとめ売り=`183455`(CCG Mixed Card Lots)。Sets・Sealed Packs/Boxes・Collectibles側Singles/Lots(183050/183051)は使わない。メンコ等の非CCGカードも必ずCCGカテゴリを使う(CCGでないとカード商品を登録できない)。既存F列がこれに反する場合は修正する。',
    '- **【必須】カード商品は Title (M 列) に必ず `Collectible 13+` を入れる**: 上記 4 ID に該当するカード商品 (スポーツカード・キャラ/アニメ系トレカ・非 CCG カードすべて) は、Age Level の付与有無に関わらず、Title (M 列) に必ず `Collectible 13+` の文字列を入れる。値は `Collectible 13+` 固定。Title 80 字制限内に収める。',
    '',
    '### タグ（D列）',
    '',
    '- TagShippingシートのA列許可リストから0個または1個だけ選ぶ。',
    '- 配送カテゴリで選ぶ。リストにない新規タグは禁止。該当なしなら空。',
    '- タグとcategoryIDは独立した別軸。タグに合わせてカテゴリを歪めない。',
    '- 新方式では既存D列があり、許可リスト内で妥当なら維持する。',
    '',
    '## 仕入れ先ページとBF列URL',
    '',
    '- `インポート用` ではH列URLを使う。',
    '- `v5インポート` ではBF列URLを使う。',
    '- BF列URLは新フォーマットの元商品URLであり、Title/Condition/ISを修正するかどうかの判断材料にする。',
    '- 仕入れ先ページに到達できる場合は、商品タイトル・価格・商品画像メタ情報など、商品固有の情報を補助または主軸情報として使う。',
    '- 仕入れ先ページに到達できない、または商品固有情報を確認できない場合でも、通信失敗やDNS失敗だけで消失扱いにしない。',
    '- 商品ページの共通辞書やUI文言に含まれる `soldOut` / `売り切れ` などの文字列だけでは、売り切れ・消失と判定しない。',
    '- eBayへのアクセス・スクレイピングは禁止。仕入れ先ページへの直接アクセスはモードに必要な範囲に留める。',
    '',
    '## 翻訳に使うAI',
    '',
    'このスキルを実行しているAI自身の能力で処理する。外部AI API呼出は禁止。',
    '',
    '- Codex app / CLIで実行中: GPT本体で処理する。',
    '- Claude Codeで実行中: Claude自身で処理する。MCP openai-bridge / gemini-bridge等の他AI呼出を使わない。',
    '- Gemini CLIで実行中: Gemini自身で処理する。',
    '',
    '## 必要な接続',
    '',
    '- MCP google-sheets: テキスト読込・結果書込',
    '- インターネット接続 / HTTP取得: カテゴリ参照JSON取得・仕入れ先ページ参照',
    '',
    '## 動作手順',
    '',
    '1. 対象シート確認: `インポート用` か `v5インポート` かを確認する。',
    '2. モード確認: 対象シートに応じたモードをユーザーに選んでもらう。',
    '3. 対象行検出: 対象候補行、除外行、理由を提示し、ユーザー確認を得る。',
    '4. 準備: TagShipping A列（タグ許可リスト）をシートから取得し、カテゴリ参照JSONを1回HTTP取得する。',
    '5. 対象再取得: 書込直前に対象範囲を再取得する。',
    '6. 精査: 各行について、必ず1行ずつ以下を順番に行う。',
    '   - ソーステキストを読む。書かれていることだけをFactとする。',
    '   - 必要なモードではURL（旧H列 / 新BF列）のページを参照する。商品固有情報が取れない場合は既存情報主軸にする。',
    '   - タグを判定または維持する。',
    '   - カテゴリIDを判定または維持する。',
    '   - Titleを作り直す（再生成）。対象全行で必ず作り直し、前回タイトルと同一にしない。',
    '   - Conditionを生成または精査する。',
    '   - Item Specificsを生成または精査する。',
    '7. 書込前に機械実測: 全行のM（Title）・N（Condition）の文字数をコード等で機械的に実測する。M > 80 / N > 480は直してから書き込む。あわせて全行で、新M列Titleが前回タイトル（旧M列Title／J列元タイトル）と一致しないことを機械検査する。一致があれば作り直してから書き込む。',
    '8. 書込:',
    '   - 旧方式: `v5インポート` のH列空行を毎バッチ再取得して特定し、新規行として書き込む。',
    '   - 新方式: 対象既存行の必要セルだけを更新する。BD/BE/BFを変更しない。',
    '9. 書込後QA: 対象範囲を読み戻して確認する。',
    '   - M列がTitle、N列がCondition、P:BCがISになっており列ずれがない。',
    '   - Title/Conditionの文字数制限を満たす。',
    '   - D列タグは許可リスト内から1つまで、F列categoryIdはbuckets候補内IDのみ。',
    '   - 新方式ではBF列URLが保持され、BD/BEが変更されていない。',
    '10. 完了報告: 問題がなければ `完了。確認をお願いします` の1行で終える。ただし、categoryId / タグが空欄の行、IS 10未満の行、ページ参照できず既存情報主軸にした行、Conditionを訂正した行があれば行番号と理由を短く箇条書きで添える。',
    '',
    '## 失敗時の最小ハンドリング',
    '',
    '- HTTP 429/5xx: 指数バックオフリトライ（2s/4s/8s）。',
    '- HTTP 4xx（429除く）/ ページ参照不可: `消失` は書かず、既存情報を主軸に処理する。',
    '- 連続失敗（2回以上同一エラー）: 停止して報告する。',
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
