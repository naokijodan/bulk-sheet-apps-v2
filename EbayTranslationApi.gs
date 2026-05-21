/**
 * Gemini × Google Sheets 翻訳ツール（v5インポート 完全準拠）
 *
 * 用途:
 *   「インポート用」シートの商品データを Gemini API で翻訳し、
 *   「v5インポート」と同じ列構成で出力する。
 *
 * 入力（「インポート用」シート、3 行目以降）:
 *   - B 列: 仕入れ先 (platform: mercari など)
 *   - C 列: 商品 ID
 *   - D 列: 仕入れ価格
 *   - E 列: 日本語タイトル
 *   - F 列: 日本語商品説明
 *   - G 列: セラー ID
 *   - H 列: 商品 URL
 *   - I 〜 R 列: =IMAGE("...") 形式の画像 URL（最大 10 枚）
 *
 * 出力（「v5インポート」シートの 3 行目以降に直接追記、とりこみ君の doPost と同じパターン）:
 *   - 開始列: A 列 (startCol = 1)
 *   - 空行探索列: H 列 (searchCol = 8、仕入れ先コードで空欄を判定)
 *   - 既存ヘッダー (1-2 行目) は触らない
 *   v5インポート の列構成:
 *   A:日付 / B:担当 / C:label / D:タグ / E:テンプレート / F:カテゴリーID /
 *   G:仕入れ先 / H:仕入れ先コード / I:仕入れ価格 / J:日本語title /
 *   K:商品説明 / L:セラーID / M:Title / N:Condition/DIscription /
 *   O:シッピングポリシー / P〜BG: ISF1, IS値1, ..., ISF20, IS値20
 *
 * タグ判定:
 *   - TagShipping シートの A 列（A2 以降）にユーザーが設定したタグから、
 *     商品にヒットするものを Gemini が選ぶ。該当なしなら空。
 *
 * 認証:
 *   - Gemini API キーは Document Properties に GEMINI_API_KEY として保管。
 *   - 取得: https://aistudio.google.com (無料、クレカ不要)。
 *
 * モデル: gemini-2.5-flash-lite（無料枠 1,000 RPD、画像対応）
 */

// ===== 設定 =====
var GEMINI_MODEL = 'gemini-2.5-flash-lite';
var GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ===== OpenAI 設定（プロバイダ切替時に使用） =====
var OPENAI_MODEL_DEFAULT = 'gpt-5.5';
var AI_PROVIDER_DEFAULT = 'gemini';
var OPENAI_RESPONSES_API_URL = 'https://api.openai.com/v1/responses';
var OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

// 入力シート
var SHEET_INPUT = 'インポート用';
var ROW_START = 3;
var COL_PLATFORM = 2;     // B
var COL_PRODUCT_ID = 3;   // C
var COL_PRICE = 4;        // D
var COL_TITLE_JA = 5;     // E
var COL_DESC_JA = 6;      // F
var COL_SELLER = 7;       // G
var COL_URL = 8;          // H
var COL_IMAGE_START = 9;  // I
var COL_IMAGE_COUNT = 10; // I 〜 R

// タグ参照シート
var SHEET_TAGS = 'TagShipping';
var TAG_COL = 1;          // A 列
var TAG_ROW_START = 2;    // A2 以降

// 出力シート（v5インポート 固定、とりこみ君の doPost と同じパターンで書き込む）
var OUTPUT_SHEET = 'v5インポート';
var OUTPUT_START_COL = 1;   // A 列から書き始める（v5インポート 仕様）
var OUTPUT_SEARCH_COL = 8;  // H 列（仕入れ先コード）で空行を探す
var OUTPUT_DATA_ROW_START = 3;  // 3 行目以降がデータ（1-2 行目はヘッダー領域）

// Item Specifics の最大ペア数（v5インポート は 20 ペア = 40 列）
var IS_MAX_PAIRS = 20;

// レート制限対策（DocumentProperties 経由でユーザー可変、これらはデフォルト値）
var REQUEST_INTERVAL_MS = 4500;    // 連続呼び出し間隔（無料 15 RPM 目安の安全マージン）
var MAX_IMAGES_PER_ITEM = 3;       // 1 アイテムあたり Gemini に送る最大画像枚数

// バッチ処理（GAS 6 分制限対策、200/300 行の自動継続用）
var EBAPI_BATCH_SIZE = 5;                           // 1 サイクルで処理する最大行数（15 RPM 環境の安定マージン、DocumentProperties で可変）
var EXEC_TIMEOUT_MS = 4 * 60 * 1000;                // 4 分経過で安全に中断（6 分制限へのマージン 2 分）
var RESUME_DELAY_MIN = 1;                           // 中断後 1 分で自動再開
var STATE_KEY_RESUME = 'EBAPI_GEMINI_RESUME_STATE';       // DocumentProperties キー
var TRIGGER_FUNCTION = 'ebApiContinueTranslateRows';     // 自動再開で呼ばれる関数

// リトライ（Gemini API 一時エラー対策、DocumentProperties で回数のみ可変）
var MAX_RETRIES = 3;                                // 最大リトライ回数
var RETRY_BACKOFF_MS = [4500, 9000, 18000];         // 指数バックオフ（429 リトライで枠回復を待つ）
var RETRYABLE_HTTP_CODES = [429, 500, 502, 503, 504]; // リトライ対象の HTTP コード

// ===== カスタムメニュー =====
function ebApiOnOpen_UNUSED() {
  SpreadsheetApp.getUi()
    .createMenu('Gemini 翻訳')
    .addItem('選択行を翻訳(' + OUTPUT_SHEET + ' へ追記)', 'ebApiTranslateSelectedRows')
    .addItem('全行を翻訳(インポート用 3 行目〜最終行)', 'ebApiTranslateAllRows')
    .addSeparator()
    .addItem('続きを処理(中断分の再開)', 'ebApiContinueTranslateRows')
    .addItem('自動再開を停止', 'ebApiCancelResumeTrigger')
    .addItem('現在の処理状態を確認', 'ebApiShowResumeState')
    .addSeparator()
    .addItem('⚙️ 設定', 'ebApiShowAllSettingsDialog')
    .addToUi();
}

// ===== AI プロバイダ判定ヘルパー =====
function getAIProvider_() {
  var v = PropertiesService.getDocumentProperties().getProperty('EBAPI_AI_PROVIDER');
  return (v && String(v).toLowerCase() === 'openai') ? 'openai' : 'gemini';
}

function getOpenAIModel_() {
  var v = PropertiesService.getDocumentProperties().getProperty('EBAPI_OPENAI_MODEL');
  return (v && String(v).trim()) ? String(v).trim() : OPENAI_MODEL_DEFAULT;
}

/**
 * 機密性のある値（API キー等）の現在値をマスク表示用に変換する。
 * 例: "AIzaSyABCDEFG..." → "AIzaSy...(39文字)"
 */
function maskSecretValue_(secret) {
  if (!secret) return '';
  var head = secret.length > 6 ? secret.substring(0, 6) : secret;
  return head + '...(' + secret.length + '文字)';
}

/**
 * 統合設定ダイアログ（全 9 項目を 1 画面に集約）
 * メニュー「⚙️ 設定」から呼ばれる唯一のエントリポイント。
 */
function ebApiBuildAllSettingsHtml() {
  var props = PropertiesService.getDocumentProperties();

  var aiProvider = getAIProvider_();
  var openaiModel = getOpenAIModel_();
  var geminiKey = props.getProperty('EBAPI_GEMINI_API_KEY') || '';
  var openaiKey = props.getProperty('EBAPI_OPENAI_API_KEY') || '';
  var operatorName = props.getProperty('EBAPI_OPERATOR_NAME') || '';
  var batchSize = getClampedNumericSetting_('EBAPI_GEMINI_BATCH_SIZE', EBAPI_BATCH_SIZE, 1, 25);
  var maxRetries = getClampedNumericSetting_('EBAPI_GEMINI_MAX_RETRIES', MAX_RETRIES, 0, 10);
  var intervalMs = getClampedNumericSetting_('EBAPI_GEMINI_REQUEST_INTERVAL_MS', REQUEST_INTERVAL_MS, 0, 30000);
  var intervalSec = Math.max(1, Math.min(30, Math.round(intervalMs / 1000) || 1));
  var maxImagesPerItem = getClampedNumericSetting_('EBAPI_GEMINI_MAX_IMAGES_PER_ITEM', MAX_IMAGES_PER_ITEM, 1, 10);

  var geminiMasked = geminiKey ? maskSecretValue_(geminiKey) : '未設定';
  var openaiMasked = openaiKey ? maskSecretValue_(openaiKey) : '未設定';

  var htmlString = ''
    + '<!DOCTYPE html>'
    + '<html>'
    + '<head>'
    + '<base target="_top">'
    + '<style>'
    + 'body { font-family: Arial, "Hiragino Sans", sans-serif; font-size: 13px; margin: 12px; color: #222; }'
    + 'h3 { margin: 0 0 12px 0; font-size: 16px; }'
    + 'h4 { margin: 16px 0 8px 0; padding-bottom: 4px; border-bottom: 1px solid #ddd; font-size: 13px; color: #1a73e8; }'
    + '.row { margin-bottom: 10px; }'
    + 'label.field-label { display: block; margin-bottom: 4px; font-weight: bold; }'
    + 'input[type=number], input[type=text], input[type=password], select { width: 100%; padding: 6px 8px; box-sizing: border-box; font-size: 13px; border: 1px solid #ccc; border-radius: 3px; }'
    + '.hint { font-size: 11px; color: #666; margin-top: 2px; }'
    + '.current { font-size: 11px; color: #555; margin-top: 2px; font-family: monospace; }'
    + '.fixed-value { font-size: 12px; color: #444; padding: 4px 8px; background: #f5f5f5; border-radius: 3px; display: inline-block; }'
    + '.actions { margin-top: 18px; text-align: right; }'
    + 'button { padding: 7px 16px; margin-left: 6px; font-size: 13px; cursor: pointer; }'
    + '.primary { background: #1a73e8; color: #fff; border: 1px solid #1a73e8; border-radius: 3px; }'
    + '.secondary { background: #fff; color: #333; border: 1px solid #ccc; border-radius: 3px; }'
    + '.radio-group label { display: inline-block; font-weight: normal; margin-right: 16px; }'
    + '.radio-group input[type=radio] { margin-right: 4px; }'
    + '#errorBox { display: none; margin-top: 8px; padding: 8px 10px; background: #fce8e6; color: #c5221f; border: 1px solid #f4c7c3; border-radius: 3px; font-size: 12px; }'
    + '</style>'
    + '</head>'
    + '<body>'
    + '<h3>⚙️ Gemini 翻訳ツール 設定</h3>'
    + '<form id="settingsForm" onsubmit="onSubmit(event)">'

    + '<h4>AI プロバイダ</h4>'
    + '<div class="row">'
    + '<div class="radio-group">'
    + '<label><input type="radio" name="aiProvider" value="gemini" <?= aiProvider === "gemini" ? "checked" : "" ?>>Gemini</label>'
    + '<label><input type="radio" name="aiProvider" value="openai" <?= aiProvider === "openai" ? "checked" : "" ?>>OpenAI</label>'
    + '</div>'
    + '<div class="hint">翻訳に使う AI を選択</div>'
    + '</div>'

    + '<h4>Gemini 設定</h4>'
    + '<div class="row">'
    + '<label class="field-label" for="geminiApiKey">Gemini API キー</label>'
    + '<input type="password" id="geminiApiKey" autocomplete="off" placeholder="空欄で現在値を維持">'
    + '<div class="current">現在: <?= geminiMasked ?></div>'
    + '<div class="hint">https://aistudio.google.com で取得（無料）</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label">Gemini モデル</label>'
    + '<div class="fixed-value"><?= geminiModel ?></div>'
    + '<div class="hint">固定 (コード内で管理)</div>'
    + '</div>'

    + '<h4>OpenAI 設定</h4>'
    + '<div class="row">'
    + '<label class="field-label" for="openaiApiKey">OpenAI API キー</label>'
    + '<input type="password" id="openaiApiKey" autocomplete="off" placeholder="空欄で現在値を維持">'
    + '<div class="current">現在: <?= openaiMasked ?></div>'
    + '<div class="hint">https://platform.openai.com/api-keys で取得</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label" for="openaiModel">OpenAI モデル</label>'
    + '<select id="openaiModel">'
    + '<option value="gpt-5.5" <?= openaiModel === "gpt-5.5" ? "selected" : "" ?>>gpt-5.5 (Codex CLI デフォルト)</option>'
    + '<option value="gpt-5.4" <?= openaiModel === "gpt-5.4" ? "selected" : "" ?>>gpt-5.4</option>'
    + '<option value="gpt-5.4-mini" <?= openaiModel === "gpt-5.4-mini" ? "selected" : "" ?>>gpt-5.4-mini</option>'
    + '<? if (openaiModel && ["gpt-5.5","gpt-5.4","gpt-5.4-mini"].indexOf(openaiModel) === -1) { ?>'
    + '<option value="<?= openaiModel ?>" selected><?= openaiModel ?> (現在値)</option>'
    + '<? } ?>'
    + '</select>'
    + '<div class="hint">2026-05-19 時点の Codex CLI 実モデル名</div>'
    + '</div>'

    + '<h4>共通設定</h4>'
    + '<div class="row">'
    + '<label class="field-label" for="operatorName">担当者名</label>'
    + '<input type="text" id="operatorName" value="<?= operatorName ?>" placeholder="例: 椛島">'
    + '<div class="hint">v5インポートシートの B 列に出力 (空欄なら「Gemini」固定)</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label" for="batchSize">バッチサイズ (1-25)</label>'
    + '<input type="number" id="batchSize" min="1" max="25" step="1" value="<?= batchSize ?>" required>'
    + '<div class="hint">1 リクエストで処理する商品数</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label" for="maxRetries">最大リトライ回数 (0-10)</label>'
    + '<input type="number" id="maxRetries" min="0" max="10" step="1" value="<?= maxRetries ?>" required>'
    + '<div class="hint">API エラー時のリトライ上限</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label" for="requestIntervalSec">リクエスト間隔 (秒, 1-30)</label>'
    + '<input type="number" id="requestIntervalSec" min="1" max="30" step="1" value="<?= intervalSec ?>" required>'
    + '<div class="hint">バッチ間で待機する秒数</div>'
    + '</div>'
    + '<div class="row">'
    + '<label class="field-label" for="maxImagesPerItem">画像枚数 (1-10)</label>'
    + '<input type="number" id="maxImagesPerItem" min="1" max="10" step="1" value="<?= maxImagesPerItem ?>" required>'
    + '<div class="hint">1 商品あたり AI に渡す画像枚数</div>'
    + '</div>'

    + '<div id="errorBox"></div>'

    + '<div class="actions">'
    + '<button type="button" class="secondary" onclick="onCancel()">キャンセル</button>'
    + '<button type="submit" class="primary">保存</button>'
    + '</div>'
    + '</form>'

    + '<script>'
    + 'function showError(msg) {'
    + '  var box = document.getElementById("errorBox");'
    + '  box.textContent = msg;'
    + '  box.style.display = "block";'
    + '}'
    + 'function clearError() {'
    + '  var box = document.getElementById("errorBox");'
    + '  box.textContent = "";'
    + '  box.style.display = "none";'
    + '}'
    + 'function readInt(id, labelText) {'
    + '  var el = document.getElementById(id);'
    + '  var v = parseInt(el.value, 10);'
    + '  return { value: v, min: parseInt(el.min, 10), max: parseInt(el.max, 10), label: labelText };'
    + '}'
    + 'function readRadio(name) {'
    + '  var els = document.getElementsByName(name);'
    + '  for (var i = 0; i < els.length; i++) { if (els[i].checked) return els[i].value; }'
    + '  return null;'
    + '}'
    + 'function onSubmit(e) {'
    + '  e.preventDefault();'
    + '  clearError();'
    + '  var intFields = ['
    + '    { id: "batchSize", label: "バッチサイズ" },'
    + '    { id: "maxRetries", label: "最大リトライ回数" },'
    + '    { id: "requestIntervalSec", label: "リクエスト間隔 (秒)" },'
    + '    { id: "maxImagesPerItem", label: "画像枚数" }'
    + '  ];'
    + '  var data = {};'
    + '  for (var i = 0; i < intFields.length; i++) {'
    + '    var info = readInt(intFields[i].id, intFields[i].label);'
    + '    if (isNaN(info.value) || info.value < info.min || info.value > info.max) {'
    + '      showError(info.label + " は " + info.min + "〜" + info.max + " の整数で入力してください。");'
    + '      return;'
    + '    }'
    + '    data[intFields[i].id] = info.value;'
    + '  }'
    + '  var operatorName = (document.getElementById("operatorName").value || "").trim();'
    + '  if (!operatorName) {'
    + '    showError("担当者名を入力してください。");'
    + '    return;'
    + '  }'
    + '  data.operatorName = operatorName;'
    + '  data.aiProvider = readRadio("aiProvider") || "gemini";'
    + '  data.openaiModel = (document.getElementById("openaiModel").value || "").trim();'
    + '  data.geminiApiKey = document.getElementById("geminiApiKey").value || "";'
    + '  data.openaiApiKey = document.getElementById("openaiApiKey").value || "";'
    + '  document.querySelectorAll("button").forEach(function(b){ b.disabled = true; });'
    + '  google.script.run'
    + '    .withSuccessHandler(onSaved)'
    + '    .withFailureHandler(onError)'
    + '    .ebApiSaveAllSettings(data);'
    + '}'
    + 'function onSaved() { google.script.host.close(); }'
    + 'function onError(err) {'
    + '  showError("保存に失敗しました: " + (err && err.message ? err.message : err));'
    + '  document.querySelectorAll("button").forEach(function(b){ b.disabled = false; });'
    + '}'
    + 'function onCancel() { google.script.host.close(); }'
    + '<\/script>'
    + '</body>'
    + '</html>';

  var template = HtmlService.createTemplate(htmlString);
  template.aiProvider = aiProvider;
  template.geminiMasked = geminiMasked;
  template.openaiMasked = openaiMasked;
  template.geminiModel = GEMINI_MODEL;
  template.openaiModel = openaiModel;
  template.operatorName = operatorName;
  template.batchSize = batchSize;
  template.maxRetries = maxRetries;
  template.intervalSec = intervalSec;
  template.maxImagesPerItem = maxImagesPerItem;

  var html = template.evaluate().setWidth(440).setHeight(720);
  return html;
}

/**
 * 統合設定ダイアログから送られてきたフォームデータを DocumentProperties に保存する。
 * - API キーが空欄なら既存値を維持する（削除しない）
 * - リクエスト間隔は秒入力を ms (×1000) に変換して保存する
 * - 範囲外・必須未入力はサーバ側でも再検証する
 */
function ebApiSaveAllSettings(formData) {
  if (!formData) throw new Error('フォームデータが空です');

  // 数値項目（範囲チェック）
  var batchSize = clampIntForSave_(formData.batchSize, 'バッチサイズ', 1, 25);
  var maxRetries = clampIntForSave_(formData.maxRetries, '最大リトライ回数', 0, 10);
  var intervalSec = clampIntForSave_(formData.requestIntervalSec, 'リクエスト間隔 (秒)', 1, 30);
  var maxImagesPerItem = clampIntForSave_(formData.maxImagesPerItem, '画像枚数', 1, 10);

  // 担当者名（必須）
  var operatorName = (formData.operatorName == null) ? '' : String(formData.operatorName).trim();
  if (!operatorName) throw new Error('担当者名を入力してください。');

  // AI プロバイダ（不正値は gemini にフォールバック）
  var aiProvider = (formData.aiProvider && String(formData.aiProvider).toLowerCase() === 'openai') ? 'openai' : 'gemini';

  // OpenAI モデル（空ならデフォルト）
  var openaiModel = (formData.openaiModel && String(formData.openaiModel).trim()) ? String(formData.openaiModel).trim() : OPENAI_MODEL_DEFAULT;

  // 秒 → ms 変換（既存キー GEMINI_REQUEST_INTERVAL_MS との互換維持）
  var intervalMs = intervalSec * 1000;

  var props = PropertiesService.getDocumentProperties();

  // API キーは「空欄なら既存値を維持」。トリム後に値があれば上書きする。
  var geminiKeyInput = (formData.geminiApiKey == null) ? '' : String(formData.geminiApiKey).trim();
  if (geminiKeyInput) {
    props.setProperty('EBAPI_GEMINI_API_KEY', geminiKeyInput);
  }
  var openaiKeyInput = (formData.openaiApiKey == null) ? '' : String(formData.openaiApiKey).trim();
  if (openaiKeyInput) {
    props.setProperty('EBAPI_OPENAI_API_KEY', openaiKeyInput);
  }

  props.setProperty('EBAPI_AI_PROVIDER', aiProvider);
  props.setProperty('EBAPI_OPENAI_MODEL', openaiModel);
  props.setProperty('EBAPI_OPERATOR_NAME', operatorName);
  props.setProperty('EBAPI_GEMINI_BATCH_SIZE', String(batchSize));
  props.setProperty('EBAPI_GEMINI_MAX_RETRIES', String(maxRetries));
  props.setProperty('EBAPI_GEMINI_REQUEST_INTERVAL_MS', String(intervalMs));
  props.setProperty('EBAPI_GEMINI_MAX_IMAGES_PER_ITEM', String(maxImagesPerItem));

  // 保存確認（API キーは内容を露出させない）
  var geminiKeyAfter = props.getProperty('EBAPI_GEMINI_API_KEY') || '';
  var openaiKeyAfter = props.getProperty('EBAPI_OPENAI_API_KEY') || '';
  try {
    SpreadsheetApp.getUi().alert(
      '設定を保存しました\n\n' +
      '【AI プロバイダ】' + aiProvider + '\n' +
      '【Gemini モデル】' + GEMINI_MODEL + '\n' +
      '【OpenAI モデル】' + openaiModel + '\n' +
      '【Gemini API キー】' + (geminiKeyAfter ? maskSecretValue_(geminiKeyAfter) : '未設定') + '\n' +
      '【OpenAI API キー】' + (openaiKeyAfter ? maskSecretValue_(openaiKeyAfter) : '未設定') + '\n' +
      '【担当者名】' + operatorName + '\n' +
      '【バッチサイズ】' + batchSize + '\n' +
      '【最大リトライ】' + maxRetries + '\n' +
      '【リクエスト間隔】' + intervalSec + ' 秒\n' +
      '【画像枚数】' + maxImagesPerItem
    );
  } catch (_) {}
}

function clampIntForSave_(raw, label, minValue, maxValue) {
  var n = parseInt(raw, 10);
  if (isNaN(n)) throw new Error(label + ' は ' + minValue + '〜' + maxValue + ' の整数で入力してください。');
  if (n < minValue || n > maxValue) throw new Error(label + ' は ' + minValue + '〜' + maxValue + ' の整数で入力してください。');
  return n;
}

function getClampedNumericSetting_(key, defaultValue, minValue, maxValue) {
  var raw = PropertiesService.getDocumentProperties().getProperty(key);
  var n = parseInt(raw, 10);
  if (isNaN(n)) return defaultValue;
  if (n < minValue) return minValue;
  if (n > maxValue) return maxValue;
  return n;
}

// ===== 実行: 選択行 =====
function ebApiTranslateSelectedRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INPUT);
  if (!sheet) { SpreadsheetApp.getUi().alert('「' + SHEET_INPUT + '」が見つかりません'); return; }
  var range = sheet.getActiveRange();
  var startRow = Math.max(range.getRow(), ROW_START);
  var endRow = range.getRow() + range.getNumRows() - 1;
  if (endRow < startRow) { SpreadsheetApp.getUi().alert(ROW_START + ' 行目以降を選択してください'); return; }
  translateRows(startRow, endRow);
}

// ===== 実行: 全行 =====
function ebApiTranslateAllRows() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_INPUT);
  if (!sheet) { SpreadsheetApp.getUi().alert('「' + SHEET_INPUT + '」が見つかりません'); return; }
  var lastRow = sheet.getLastRow();
  if (lastRow < ROW_START) { SpreadsheetApp.getUi().alert('対象データなし'); return; }
  translateRows(ROW_START, lastRow);
}

// ===== 中断分の再開（手動 or トリガー） =====
function ebApiContinueTranslateRows() {
  var state = loadResumeState_();
  if (!state) {
    SpreadsheetApp.getUi().alert('再開すべき処理はありません');
    return;
  }
  // 1 度この関数が走ったらトリガーは消す（次サイクルで再設定される可能性あり）
  ebApiCancelResumeTrigger();
  translateRows(state.nextRow, state.endRow);
}

// ===== 状態管理 =====
function saveResumeState_(nextRow, endRow) {
  var state = { nextRow: nextRow, endRow: endRow, savedAt: new Date().toISOString() };
  PropertiesService.getDocumentProperties().setProperty(STATE_KEY_RESUME, JSON.stringify(state));
}

function loadResumeState_() {
  var s = PropertiesService.getDocumentProperties().getProperty(STATE_KEY_RESUME);
  if (!s) return null;
  try { return JSON.parse(s); } catch (_) { return null; }
}

function clearResumeState_() {
  PropertiesService.getDocumentProperties().deleteProperty(STATE_KEY_RESUME);
}

function scheduleResumeTrigger_() {
  // 既存トリガー削除して新規作成
  ebApiCancelResumeTrigger();
  ScriptApp.newTrigger(TRIGGER_FUNCTION)
    .timeBased()
    .after(RESUME_DELAY_MIN * 60 * 1000)
    .create();
}

function ebApiCancelResumeTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === TRIGGER_FUNCTION) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function ebApiShowResumeState() {
  var state = loadResumeState_();
  var triggers = ScriptApp.getProjectTriggers().filter(function (t) {
    return t.getHandlerFunction() === TRIGGER_FUNCTION;
  });
  var msg = '';
  if (state) {
    msg += '再開待機中:\n';
    msg += '  次の行: ' + state.nextRow + '\n';
    msg += '  最終行: ' + state.endRow + '\n';
    msg += '  保存時刻: ' + state.savedAt + '\n';
  } else {
    msg += '再開待機中の処理はありません\n';
  }
  msg += '\n自動再開トリガー: ' + (triggers.length > 0 ? '有効 (' + triggers.length + ' 個)' : 'なし');
  SpreadsheetApp.getUi().alert(msg);
}

// ===== メイン処理（並列バッチ + 自動継続 + リトライ） =====
// 旧仕様: 1 行ごとに直列 fetch → 直列 Gemini → sleep
// 新仕様: N 件分の画像を並列 fetch → N 件分の Gemini を並列 fetchAll → まとめて書き込み
function translateRows(startRow, endRow) {
  var props = PropertiesService.getDocumentProperties();
  var provider = getAIProvider_();
  var apiKey = (provider === 'openai')
    ? props.getProperty('EBAPI_OPENAI_API_KEY')
    : props.getProperty('EBAPI_GEMINI_API_KEY');
  if (!apiKey) {
    var providerLabel = provider === 'openai' ? 'OpenAI' : 'Gemini';
    try { SpreadsheetApp.getUi().alert(providerLabel + ' API キーが未設定です。「Gemini 翻訳 > ⚙️ 設定」から登録してください。'); } catch (_) {}
    return;
  }
  var operatorName = props.getProperty('EBAPI_OPERATOR_NAME') || 'Gemini';
  var batchSize = getClampedNumericSetting_('EBAPI_GEMINI_BATCH_SIZE', EBAPI_BATCH_SIZE, 1, 25);
  var maxRetries = getClampedNumericSetting_('EBAPI_GEMINI_MAX_RETRIES', MAX_RETRIES, 0, 10);
  var requestIntervalMs = getClampedNumericSetting_('EBAPI_GEMINI_REQUEST_INTERVAL_MS', REQUEST_INTERVAL_MS, 0, 30000);
  var maxImagesPerItem = getClampedNumericSetting_('EBAPI_GEMINI_MAX_IMAGES_PER_ITEM', MAX_IMAGES_PER_ITEM, 1, 10);

  // バッチサイズで処理範囲を区切る（このサイクル内は並列処理）
  var batchEnd = Math.min(endRow, startRow + batchSize - 1);
  var execStart = Date.now();

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var inputSheet = ss.getSheetByName(SHEET_INPUT);
  if (!inputSheet) {
    try { SpreadsheetApp.getUi().alert('「' + SHEET_INPUT + '」シートが見つかりません'); } catch (_) {}
    return;
  }

  // 出力シートを取得（v5インポート、無ければエラー。自動作成しない）
  var outputSheet = ss.getSheetByName(OUTPUT_SHEET);
  if (!outputSheet) {
    try { SpreadsheetApp.getUi().alert('「' + OUTPUT_SHEET + '」シートが見つかりません。\nシート構成を確認してください。'); } catch (_) {}
    return;
  }

  // 「次に書く行」キャッシュ（doPost と同じパターン、連続書き込み高速化）
  var nextRowCache = { row: null };

  // TagShipping の A 列を毎回読み込み（ユーザーが任意に編集する設定）
  var userTags = readUserTags_(ss);

  // 入力をまとめて取得（batchEnd まで）
  var numRows = batchEnd - startRow + 1;
  var platformCol = inputSheet.getRange(startRow, COL_PLATFORM, numRows, 1).getValues();
  var productIdCol = inputSheet.getRange(startRow, COL_PRODUCT_ID, numRows, 1).getValues();
  var priceCol = inputSheet.getRange(startRow, COL_PRICE, numRows, 1).getValues();
  var titleCol = inputSheet.getRange(startRow, COL_TITLE_JA, numRows, 1).getValues();
  var descCol = inputSheet.getRange(startRow, COL_DESC_JA, numRows, 1).getValues();
  var sellerCol = inputSheet.getRange(startRow, COL_SELLER, numRows, 1).getValues();
  var imageRange = inputSheet.getRange(startRow, COL_IMAGE_START, numRows, COL_IMAGE_COUNT);
  var imageFormulas = imageRange.getFormulas();
  var imageValues = imageRange.getValues();

  // ===== Step 1: 入力収集 + スキップ判定 =====
  var items = [];        // Gemini に投げる行
  var skipRows = [];     // 全空でスキップした行
  for (var i = 0; i < numRows; i++) {
    var row = startRow + i;
    var platform = String(platformCol[i][0] || '').trim() || 'mercari';
    var productId = String(productIdCol[i][0] || '').trim();
    var price = priceCol[i][0];
    var titleJa = String(titleCol[i][0] || '').trim();
    var descJa = String(descCol[i][0] || '').trim();
    var seller = String(sellerCol[i][0] || '').trim();

    var imageUrls = [];
    for (var j = 0; j < COL_IMAGE_COUNT; j++) {
      var cellVal = imageValues[i][j];
      // セル内画像(CellImage)なら getContentUrl(Googleホスト=メルカリ非経由)を使う
      if (cellVal && typeof cellVal.getContentUrl === 'function') {
        try {
          var contentUrl = cellVal.getContentUrl();
          if (contentUrl) { imageUrls.push(contentUrl); continue; }
        } catch (ciErr) {
          Logger.log('getContentUrl failed (row ' + (startRow + i) + ' col ' + j + '): ' + ((ciErr && ciErr.message) ? ciErr.message : ciErr));
        }
      }
      // フォールバック: =IMAGE("url") から メルカリURL を抽出
      var f = imageFormulas[i][j] || '';
      var m = f.match(/=IMAGE\(\s*"([^"]+)"/i);
      if (m && m[1]) imageUrls.push(m[1]);
    }
    if (imageUrls.length > maxImagesPerItem) {
      imageUrls = imageUrls.slice(0, maxImagesPerItem);
    }

    if (!titleJa && !descJa && imageUrls.length === 0) {
      skipRows.push(row);
      continue;
    }

    items.push({
      row: row,
      platform: platform,
      productId: productId,
      price: price,
      titleJa: titleJa,
      descJa: descJa,
      seller: seller,
      imageUrls: imageUrls,
      imageDataList: []  // Step 2 で埋める
    });
  }

  var successCount = 0;
  var errorCount = 0;
  var skipCount = skipRows.length;
  var timedOut = false;

  // タイムアウト監視: 並列バッチ投入前に判定（投入中は中断不可）
  if (items.length > 0 && Date.now() - execStart > EXEC_TIMEOUT_MS) {
    timedOut = true;
    saveResumeState_(startRow, endRow);
    scheduleResumeTrigger_();
  }

  // ===== Step 2: 画像を並列ダウンロード =====
  // ===== Step 3: Gemini を並列実行（失敗行のみ次ラウンド） =====
  // ===== Step 4: 結果ループで JSON parse + 書き込み =====
  if (!timedOut && items.length > 0) {
    fetchImagesBatch_(items);  // 各 item.imageDataList を埋める
    var aiResults = (provider === 'openai')
      ? ebApiCallOpenAIBatch_(items, apiKey, maxRetries, userTags)
      : callGeminiBatch_(items, apiKey, maxRetries, userTags);

    // row 番号で結果を辞書化（結果順は fetchAll の順番と一致するが、安全のため row でマッチ）
    var resultByRow = {};
    for (var r = 0; r < aiResults.length; r++) {
      resultByRow[aiResults[r].row] = aiResults[r];
    }

    for (var k = 0; k < items.length; k++) {
      var it = items[k];
      var res = resultByRow[it.row];
      try {
        if (!res || !res.ok) {
          throw new Error(res && res.error ? res.error : 'AI API returned no result');
        }
        var json = safeParseJson_(res.text);
        json = enforceSingleTag_(json, userTags);
        var rowValues = buildV5RowValues_(json, {
          operatorName: operatorName,
          platform: it.platform,
          productId: it.productId,
          price: it.price,
          titleJa: it.titleJa,
          descJa: it.descJa,
          seller: it.seller
        });
        writeRowToOutput_(outputSheet, rowValues, nextRowCache);
        successCount++;
      } catch (e) {
        var errorRow = buildErrorRow_({
          operatorName: operatorName,
          platform: it.platform,
          productId: it.productId,
          price: it.price,
          titleJa: it.titleJa,
          descJa: it.descJa,
          seller: it.seller,
          errorMessage: (e && e.message) ? e.message : String(e)
        });
        writeRowToOutput_(outputSheet, errorRow, nextRowCache);
        errorCount++;
      }
    }
  }

  // バッチ終了処理
  if (timedOut) {
    try {
      SpreadsheetApp.getUi().alert(
        '実行時間が ' + Math.round(EXEC_TIMEOUT_MS / 60000) + ' 分を超えるため、このバッチを中断しました。\n' +
        '約 ' + RESUME_DELAY_MIN + ' 分後に ' + startRow + ' 行目から自動再開します。'
      );
    } catch (_) {}
    return;
  }

  // バッチ完了
  if (batchEnd < endRow) {
    // まだ全体未完。次サイクルを予約。
    saveResumeState_(batchEnd + 1, endRow);
    scheduleResumeTrigger_();
    // 次バッチ前に 1 回だけ間隔を空ける（per-request sleep は廃止）
    if (requestIntervalMs > 0) Utilities.sleep(requestIntervalMs);
    try {
      SpreadsheetApp.getUi().alert(
        'バッチ ' + items.length + ' 件 (並列) 完了。約 ' + RESUME_DELAY_MIN + ' 分後に次のバッチを自動実行します。\n' +
        '処理済: ' + startRow + ' 〜 ' + batchEnd + ' 行\n' +
        '成功: ' + successCount + ' / エラー: ' + errorCount + ' / 空行: ' + skipCount + '\n' +
        '残り: ' + (batchEnd + 1) + ' 〜 ' + endRow + ' 行'
      );
    } catch (_) {}
  } else {
    // 全件完了。状態クリア + トリガー削除。
    clearResumeState_();
    ebApiCancelResumeTrigger();
    try {
      SpreadsheetApp.getUi().alert(
        '全件処理完了\n' +
        '対象: ' + startRow + ' 〜 ' + endRow + ' 行\n' +
        '成功: ' + successCount + ' / エラー: ' + errorCount + ' / 空行スキップ: ' + skipCount
      );
    } catch (_) {}
  }
}

// ============================================================================
// ===== 並列バッチ処理（fetchAll 版） =====
// ============================================================================

/**
 * バッチ全件分の画像 URL を 1 回の UrlFetchApp.fetchAll で並列ダウンロードし、
 * 各 item.imageDataList に { mimeType, base64 } を詰める。
 *
 * - 失敗した画像はその行から除外（item は破棄しない、画像なしで継続）
 * - 引数 items は in-place で imageDataList が埋められる（戻り値なし）
 */
function fetchImagesBatch_(items) {
  if (!items || items.length === 0) return;
  // flat な request 配列を作り、各 entry が「どの item の何枚目」かを覚えておく
  var requests = [];
  var indexMap = [];  // [{itemIdx, imgIdx}, ...]
  for (var i = 0; i < items.length; i++) {
    var urls = items[i].imageUrls || [];
    for (var j = 0; j < urls.length; j++) {
      var url = urls[j];
      // URL バリデーション: http/https 文字列のみ受け付ける（不正な値で fetchAll 全体が失敗するのを防ぐ）
      if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
        Logger.log('fetchImagesBatch_: skip invalid url (item ' + i + ' image ' + j + '): ' + String(url).substring(0, 120));
        continue;
      }
      requests.push({
        url: url,
        muteHttpExceptions: true,
        followRedirects: true
      });
      indexMap.push({ itemIdx: i, imgIdx: j });
    }
  }
  if (requests.length === 0) return;

  var responses;
  try {
    responses = UrlFetchApp.fetchAll(requests);
  } catch (e) {
    // 画像取得が一括失敗したら全行画像なしで継続（テキストだけでも翻訳できる）
    Logger.log('fetchImagesBatch_: fetchAll exception: ' + ((e && e.message) ? e.message : String(e)));
    return;
  }

  for (var k = 0; k < responses.length; k++) {
    var res = responses[k];
    try {
      if (res.getResponseCode() !== 200) continue;
      var blob = res.getBlob();
      // サイズ制限: 2MB 超は Gemini に送らずスキップ（base64 で更に 33% 膨張するため）
      if (blob.getBytes().length > 2 * 1024 * 1024) {
        Logger.log('fetchImagesBatch_: skip oversize image (>2MB) at index ' + k);
        continue;
      }
      var contentType = (res.getHeaders()['Content-Type'] || 'image/jpeg').split(';')[0].trim();
      var base64 = Utilities.base64Encode(blob.getBytes());
      var loc = indexMap[k];
      items[loc.itemIdx].imageDataList.push({ mimeType: contentType, base64: base64 });
    } catch (e2) {
      // 1 枚の失敗は無視
      Logger.log('fetchImagesBatch_: image decode failure at index ' + k + ': ' + ((e2 && e2.message) ? e2.message : String(e2)));
    }
  }
}

/**
 * 1 件分の Gemini POST リクエスト options を組み立てる（fetchAll 用）。
 */
function buildGeminiRequest_(item, apiKey) {
  var userPromptLines = [
    '# 商品データ',
    '- platform: ' + item.platform,
    '- 日本語タイトル: ' + (item.titleJa || '(なし)'),
    '- 日本語説明:',
    item.descJa || '(なし)',
    ''
  ];

  if (item.userTags && item.userTags.length > 0) {
    userPromptLines.push('# ユーザーが TagShipping シートに設定したタグ一覧');
    userPromptLines.push('以下はユーザーが事前に設定したタグのリストです。');
    userPromptLines.push('この商品にヒットするタグがあれば recommendedUserTags に列挙してください。');
    userPromptLines.push('該当するものがなければ空配列 [] を返してください。');
    userPromptLines.push('リストにないタグを新規に作って入れないでください。');
    userPromptLines.push('');
    for (var i = 0; i < item.userTags.length; i++) {
      userPromptLines.push('- ' + item.userTags[i]);
    }
    userPromptLines.push('');
  } else {
    userPromptLines.push('# ユーザータグ');
    userPromptLines.push('TagShipping シートに設定されたタグはありません。recommendedUserTags は [] を返してください。');
    userPromptLines.push('');
  }
  userPromptLines.push('上記の商品情報と添付画像をもとに、system プロンプトで指定された JSON スキーマに従って eBay 出品データを生成してください。');
  userPromptLines.push('純粋な JSON のみを返してください（マークダウンのコードフェンスや前置き / 後置きの説明文は禁止）。');

  var parts = [{ text: userPromptLines.join('\n') }];
  var imgs = item.imageDataList || [];
  for (var k = 0; k < imgs.length; k++) {
    parts.push({ inline_data: { mime_type: imgs[k].mimeType, data: imgs[k].base64 } });
  }

  var payload = {
    contents: [{ role: 'user', parts: parts }],
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT + '\n\n' + getPlatformPrompt_(item.platform) }]
    },
    generationConfig: {
      temperature: 0.3,
      response_mime_type: 'application/json'
    }
  };

  return {
    url: GEMINI_API_BASE + '/' + GEMINI_MODEL + ':generateContent?key=' + encodeURIComponent(apiKey),
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
}

/**
 * バッチ N 件の Gemini 呼び出しを UrlFetchApp.fetchAll で並列実行する。
 * 失敗行 (HTTP != 200 / candidates 欠如 / parts.text 空) のみ次ラウンドへ。
 * 最大 maxRetries 回まで、指数バックオフ RETRY_BACKOFF_MS を挟む。
 *
 * @return {Array<{row:number, ok:boolean, text?:string, error?:string}>}
 */
function callGeminiBatch_(items, apiKey, maxRetries, userTags) {
  if (!items || items.length === 0) return [];
  // userTags は呼び出し元 (translateRows) で 1 回だけ読み込んだものを受け取る（重複読込を防ぐ）
  var tags = Array.isArray(userTags) ? userTags : [];
  for (var u = 0; u < items.length; u++) items[u].userTags = tags;

  var pending = items.slice();
  var done = [];
  var attempt = 0;

  while (pending.length > 0 && attempt <= maxRetries) {
    var responses = [];
    var fetchAllFailed = null;

    if (attempt === 0) {
      // 初回ラウンドのみ並列 fetchAll で投げる
      var requests = [];
      for (var i = 0; i < pending.length; i++) {
        requests.push(buildGeminiRequest_(pending[i], apiKey));
      }
      try {
        responses = UrlFetchApp.fetchAll(requests);
      } catch (e) {
        fetchAllFailed = e;
      }
    } else {
      // リトライラウンドは直列フォールバック（並列再試行で 429 が悪化するのを防ぐ）
      var serialInterval = getClampedNumericSetting_('EBAPI_GEMINI_REQUEST_INTERVAL_MS', REQUEST_INTERVAL_MS, 0, 30000);
      for (var s = 0; s < pending.length; s++) {
        var req = buildGeminiRequest_(pending[s], apiKey);
        try {
          var resOne = UrlFetchApp.fetch(req.url, {
            method: req.method,
            contentType: req.contentType,
            payload: req.payload,
            muteHttpExceptions: req.muteHttpExceptions
          });
          responses.push(resOne);
        } catch (eOne) {
          // 1 件失敗してもバッチ全体は継続。後段で retryable=false 扱いにする
          responses.push({
            __serialFetchError: true,
            __errorMessage: 'serial fetch exception: ' + ((eOne && eOne.message) ? eOne.message : String(eOne))
          });
        }
        // 各 fetch 後に間隔を空けて 15 RPM を守る
        if (serialInterval > 0 && s < pending.length - 1) {
          Utilities.sleep(serialInterval);
        }
      }
    }

    if (fetchAllFailed) {
      // fetchAll 自体が落ちたら全行を attempt のカウントだけ消費して retry/失敗化
      if (attempt >= maxRetries) {
        for (var z = 0; z < pending.length; z++) {
          done.push({ row: pending[z].row, ok: false, error: 'fetchAll exception: ' + ((fetchAllFailed && fetchAllFailed.message) ? fetchAllFailed.message : String(fetchAllFailed)) });
        }
        pending = [];
        break;
      }
      Utilities.sleep(RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)]);
      attempt++;
      continue;
    }

    var nextPending = [];
    for (var j = 0; j < responses.length; j++) {
      var resp = responses[j];
      var item = pending[j];
      var parsed;
      if (resp && resp.__serialFetchError) {
        // 直列モードでの個別 fetch 例外は retryable 扱い（次ラウンドに残す）
        parsed = { ok: false, retryable: true, error: resp.__errorMessage };
      } else {
        parsed = parseGeminiResponse_(resp);
      }
      if (parsed.ok) {
        done.push({ row: item.row, ok: true, text: parsed.text });
      } else {
        // リトライ可否判定: HTTP 429/5xx か無回答系のみリトライ。それ以外（400 等）は即失敗
        if (parsed.retryable && attempt < maxRetries) {
          nextPending.push(item);
        } else {
          done.push({ row: item.row, ok: false, error: parsed.error });
        }
      }
    }

    pending = nextPending;
    if (pending.length > 0 && attempt < maxRetries) {
      Utilities.sleep(RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)]);
    }
    attempt++;
  }

  // ループ抜けてもまだ pending が残っていれば最終失敗扱い
  for (var p = 0; p < pending.length; p++) {
    done.push({ row: pending[p].row, ok: false, error: 'max retries (' + maxRetries + ') exceeded' });
  }

  return done;
}

/**
 * Gemini レスポンス 1 件を判定して { ok, text?, error?, retryable } を返す。
 */
function parseGeminiResponse_(response) {
  try {
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code !== 200) {
      var retryable = RETRYABLE_HTTP_CODES.indexOf(code) >= 0;
      return { ok: false, error: 'Gemini API HTTP ' + code + ' - ' + body.substring(0, 300), retryable: retryable };
    }
    var responseJson = JSON.parse(body);
    // Safety フィルター検知（リトライしても結果が変わらないので retryable=false で即失敗扱い）
    if (responseJson.promptFeedback && responseJson.promptFeedback.blockReason) {
      return { ok: false, retryable: false, error: 'Blocked: ' + responseJson.promptFeedback.blockReason };
    }
    if (responseJson.candidates && responseJson.candidates[0] && responseJson.candidates[0].finishReason === 'SAFETY') {
      return { ok: false, retryable: false, error: 'Safety filter: ' + (responseJson.candidates[0].finishReason || '') };
    }
    if (!responseJson.candidates || !responseJson.candidates[0] || !responseJson.candidates[0].content) {
      return { ok: false, error: 'Gemini API returned no candidates: ' + body.substring(0, 300), retryable: true };
    }
    var textParts = responseJson.candidates[0].content.parts || [];
    var text = textParts.map(function (p) { return p.text || ''; }).join('');
    if (!text) {
      return { ok: false, error: 'Gemini API returned empty text', retryable: true };
    }
    return { ok: true, text: text };
  } catch (e) {
    return { ok: false, error: 'parseGeminiResponse_ exception: ' + ((e && e.message) ? e.message : String(e)), retryable: false };
  }
}

// ============================================================================
// ===== OpenAI 並列バッチ処理（fetchAll 版、callGeminiBatch_ と同構造） =====
// ============================================================================

/**
 * 1 件分の OpenAI POST リクエスト options を組み立てる（fetchAll 用）。
 * GPT-5 系は Responses API、GPT-4 系は Chat Completions API を使う。
 * 画像はローカル DL せず image_url で直渡し（Gemini と異なるが OpenAI の標準パターン）。
 */
function buildOpenAIRequest_(item, apiKey) {
  var model = getOpenAIModel_();
  var isGpt5 = /^gpt-5/i.test(model);

  // ユーザープロンプト（buildGeminiRequest_ と同じ内容）
  var userPromptLines = [
    '# 商品データ',
    '- platform: ' + item.platform,
    '- 日本語タイトル: ' + (item.titleJa || '(なし)'),
    '- 日本語説明:',
    item.descJa || '(なし)',
    ''
  ];

  if (item.userTags && item.userTags.length > 0) {
    userPromptLines.push('# ユーザーが TagShipping シートに設定したタグ一覧');
    userPromptLines.push('以下はユーザーが事前に設定したタグのリストです。');
    userPromptLines.push('この商品にヒットするタグがあれば recommendedUserTags に列挙してください。');
    userPromptLines.push('該当するものがなければ空配列 [] を返してください。');
    userPromptLines.push('リストにないタグを新規に作って入れないでください。');
    userPromptLines.push('');
    for (var i = 0; i < item.userTags.length; i++) {
      userPromptLines.push('- ' + item.userTags[i]);
    }
    userPromptLines.push('');
  } else {
    userPromptLines.push('# ユーザータグ');
    userPromptLines.push('TagShipping シートに設定されたタグはありません。recommendedUserTags は [] を返してください。');
    userPromptLines.push('');
  }
  userPromptLines.push('上記の商品情報と添付画像をもとに、system プロンプトで指定された JSON スキーマに従って eBay 出品データを生成してください。');
  userPromptLines.push('純粋な JSON のみを返してください（マークダウンのコードフェンスや前置き / 後置きの説明文は禁止）。');

  var userPrompt = userPromptLines.join('\n');
  var systemPrompt = SYSTEM_PROMPT + '\n\n' + getPlatformPrompt_(item.platform);

  var headers = {
    'Authorization': 'Bearer ' + apiKey,
    'User-Agent': 'GoogleAppsScript/1.0'
  };

  var url;
  var payload;

  if (isGpt5) {
    // ===== Responses API (GPT-5 系) =====
    var inputContent = [{ type: 'input_text', text: userPrompt }];
    var imgs = item.imageDataList || [];
    for (var k = 0; k < imgs.length; k++) {
      inputContent.push({ type: 'input_image', image_url: 'data:' + imgs[k].mimeType + ';base64,' + imgs[k].base64 });
    }
    payload = {
      model: model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'user', content: inputContent }
      ],
      reasoning: { effort: 'low' },
      max_output_tokens: 4096
    };
    url = OPENAI_RESPONSES_API_URL;
  } else {
    // ===== Chat Completions (GPT-4o / GPT-4 系) =====
    var msgContent = [{ type: 'text', text: userPrompt }];
    var imgs2 = item.imageDataList || [];
    for (var m = 0; m < imgs2.length; m++) {
      msgContent.push({ type: 'image_url', image_url: { url: 'data:' + imgs2[m].mimeType + ';base64,' + imgs2[m].base64 } });
    }
    payload = {
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: msgContent }
      ],
      temperature: 0.2,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    };
    url = OPENAI_CHAT_COMPLETIONS_URL;
  }

  return {
    url: url,
    method: 'post',
    contentType: 'application/json',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
}

/**
 * OpenAI レスポンス 1 件を判定して { ok, text?, error?, retryable } を返す。
 * Responses API (output_text / output[].content[].text) と
 * Chat Completions (choices[0].message.content) の両形式に対応。
 */
function parseOpenAIResponse_(response) {
  try {
    var code = response.getResponseCode();
    var body = response.getContentText();
    if (code !== 200) {
      var retryable = RETRYABLE_HTTP_CODES.indexOf(code) >= 0;
      return { ok: false, error: 'OpenAI API HTTP ' + code + ' - ' + body.substring(0, 300), retryable: retryable };
    }
    var data = JSON.parse(body);

    // Responses API 形式: output_text (string) または output[].content[].text
    if (typeof data.output_text === 'string' && data.output_text) {
      return { ok: true, text: data.output_text };
    }
    if (Array.isArray(data.output) && data.output.length > 0) {
      var collected = '';
      for (var i = 0; i < data.output.length; i++) {
        var entry = data.output[i];
        if (entry && Array.isArray(entry.content)) {
          for (var j = 0; j < entry.content.length; j++) {
            var part = entry.content[j];
            if (part && (part.type === 'output_text' || part.type === 'text') && typeof part.text === 'string') {
              collected += part.text;
            }
          }
        }
      }
      if (collected) {
        return { ok: true, text: collected };
      }
    }

    // Chat Completions 形式
    if (data.choices && data.choices[0] && data.choices[0].message) {
      var msg = data.choices[0].message;
      var content = msg.content;
      if (typeof content === 'string' && content) {
        return { ok: true, text: content };
      }
      // content が配列 (multi-modal 出力) の場合の保険
      if (Array.isArray(content)) {
        var joined = '';
        for (var c = 0; c < content.length; c++) {
          var p = content[c];
          if (p && typeof p.text === 'string') joined += p.text;
        }
        if (joined) return { ok: true, text: joined };
      }
    }

    return { ok: false, error: 'OpenAI API returned no usable text: ' + body.substring(0, 300), retryable: true };
  } catch (e) {
    return { ok: false, error: 'parseOpenAIResponse_ exception: ' + ((e && e.message) ? e.message : String(e)), retryable: false };
  }
}

/**
 * バッチ N 件の OpenAI 呼び出しを UrlFetchApp.fetchAll で並列実行する。
 * callGeminiBatch_ と同じ構造（attempt=0 並列 / attempt>0 直列フォールバック）。
 *
 * @return {Array<{row:number, ok:boolean, text?:string, error?:string}>}
 */
function ebApiCallOpenAIBatch_(items, apiKey, maxRetries, userTags) {
  if (!items || items.length === 0) return [];
  var tags = Array.isArray(userTags) ? userTags : [];
  for (var u = 0; u < items.length; u++) items[u].userTags = tags;

  var pending = items.slice();
  var done = [];
  var attempt = 0;

  while (pending.length > 0 && attempt <= maxRetries) {
    var responses = [];
    var fetchAllFailed = null;

    if (attempt === 0) {
      // 初回ラウンドのみ並列 fetchAll で投げる
      var requests = [];
      for (var i = 0; i < pending.length; i++) {
        requests.push(buildOpenAIRequest_(pending[i], apiKey));
      }
      try {
        responses = UrlFetchApp.fetchAll(requests);
      } catch (e) {
        fetchAllFailed = e;
      }
    } else {
      // リトライラウンドは直列フォールバック（並列再試行で 429 が悪化するのを防ぐ）
      var serialInterval = getClampedNumericSetting_('EBAPI_GEMINI_REQUEST_INTERVAL_MS', REQUEST_INTERVAL_MS, 0, 30000);
      for (var s = 0; s < pending.length; s++) {
        var req = buildOpenAIRequest_(pending[s], apiKey);
        try {
          var resOne = UrlFetchApp.fetch(req.url, {
            method: req.method,
            contentType: req.contentType,
            headers: req.headers,
            payload: req.payload,
            muteHttpExceptions: req.muteHttpExceptions
          });
          responses.push(resOne);
        } catch (eOne) {
          responses.push({
            __serialFetchError: true,
            __errorMessage: 'serial fetch exception: ' + ((eOne && eOne.message) ? eOne.message : String(eOne))
          });
        }
        if (serialInterval > 0 && s < pending.length - 1) {
          Utilities.sleep(serialInterval);
        }
      }
    }

    if (fetchAllFailed) {
      if (attempt >= maxRetries) {
        for (var z = 0; z < pending.length; z++) {
          done.push({ row: pending[z].row, ok: false, error: 'fetchAll exception: ' + ((fetchAllFailed && fetchAllFailed.message) ? fetchAllFailed.message : String(fetchAllFailed)) });
        }
        pending = [];
        break;
      }
      Utilities.sleep(RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)]);
      attempt++;
      continue;
    }

    var nextPending = [];
    for (var j = 0; j < responses.length; j++) {
      var resp = responses[j];
      var item = pending[j];
      var parsed;
      if (resp && resp.__serialFetchError) {
        parsed = { ok: false, retryable: true, error: resp.__errorMessage };
      } else {
        parsed = parseOpenAIResponse_(resp);
      }
      if (parsed.ok) {
        done.push({ row: item.row, ok: true, text: parsed.text });
      } else {
        if (parsed.retryable && attempt < maxRetries) {
          nextPending.push(item);
        } else {
          done.push({ row: item.row, ok: false, error: parsed.error });
        }
      }
    }

    pending = nextPending;
    if (pending.length > 0 && attempt < maxRetries) {
      Utilities.sleep(RETRY_BACKOFF_MS[Math.min(attempt, RETRY_BACKOFF_MS.length - 1)]);
    }
    attempt++;
  }

  for (var p = 0; p < pending.length; p++) {
    done.push({ row: pending[p].row, ok: false, error: 'max retries (' + maxRetries + ') exceeded' });
  }

  return done;
}

// ===== 出力シートへの 1 行書き込み（doPost と同じ「空行探索 + キャッシュ」パターン） =====
// - v5インポート の H 列(8) が空の最初の行を 3 行目以降から探す
// - 連続書き込みは nextRowCache で高速化（書き込み済み行を絶対に再利用しない）
// - 列数不足時は自動拡張
function writeRowToOutput_(sheet, rowValues, nextRowCache) {
  // 列数不足チェック
  var requiredCols = Math.max(OUTPUT_SEARCH_COL, OUTPUT_START_COL + rowValues.length - 1);
  var maxCols = sheet.getMaxColumns();
  if (maxCols < requiredCols) {
    sheet.insertColumnsAfter(maxCols, requiredCols - maxCols);
  }

  // キャッシュ採用時の 1 セル再検証（虫食い上書き防止）
  var row = null;
  if (nextRowCache && nextRowCache.row) {
    var candidate = nextRowCache.row;
    var cellValue = sheet.getRange(candidate, OUTPUT_SEARCH_COL).getValue();
    if (cellValue === '' || cellValue === null) {
      row = candidate;
    }
  }

  // キャッシュ無効: 3 行目以降の H 列が空の最初の行を探索
  if (row === null) {
    var lastRow = sheet.getLastRow();
    if (lastRow >= OUTPUT_DATA_ROW_START) {
      var colValues = sheet.getRange(OUTPUT_DATA_ROW_START, OUTPUT_SEARCH_COL, lastRow - OUTPUT_DATA_ROW_START + 1, 1).getValues();
      for (var i = 0; i < colValues.length; i++) {
        var v = colValues[i][0];
        if (v === '' || v === null) {
          row = i + OUTPUT_DATA_ROW_START;
          break;
        }
      }
    }
    if (row === null) {
      row = (lastRow < OUTPUT_DATA_ROW_START) ? OUTPUT_DATA_ROW_START : lastRow + 1;
    }
  }

  // 書き込み (A 列から rowValues の長さ分)
  sheet.getRange(row, OUTPUT_START_COL, 1, rowValues.length).setValues([rowValues]);

  // 次の行をキャッシュ（書き込み済みの行を再利用しない）
  if (nextRowCache) {
    nextRowCache.row = row + 1;
  }

  return row;
}

// ===== TagShipping シートの A 列を読み込み（ユーザー設定タグ） =====
function readUserTags_(ss) {
  var sheet = ss.getSheetByName(SHEET_TAGS);
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  if (lastRow < TAG_ROW_START) return [];
  var values = sheet.getRange(TAG_ROW_START, TAG_COL, lastRow - TAG_ROW_START + 1, 1).getValues();
  var tags = [];
  for (var i = 0; i < values.length; i++) {
    var t = String(values[i][0] || '').trim();
    if (t) tags.push(t);
  }
  return tags;
}

// ===== v5インポート 形式の行配列を生成 =====
function buildV5RowValues_(geminiJson, ctx) {
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy/MM/dd');
  var tags = Array.isArray(geminiJson.recommendedUserTags) ? geminiJson.recommendedUserTags : [];
  var tagStr = tags.join(' ');
  var cats = Array.isArray(geminiJson.categorySuggestions) ? geminiJson.categorySuggestions : [];
  // recommended === true のものを優先、なければ先頭
  var recommended = cats.filter(function (c) { return c && c.recommended === true; });
  var categoryId = recommended.length > 0 ? (recommended[0].id || '') : ((cats[0] && cats[0].id) || '');

  // 固定列 (A〜O) ※ O 列は「シッピングポリシー」(空)
  // インポート用 シートとのマッピング:
  //   G 仕入れ先         <- インポート用 B 列
  //   H 仕入れ先コード   <- インポート用 C 列 (商品 ID。URL ではない)
  //   I 仕入れ価格       <- インポート用 D 列
  //   J 日本語title      <- インポート用 E 列
  //   K 商品説明         <- インポート用 F 列
  //   L セラーID         <- インポート用 G 列
  //   M Title / N Condition <- Gemini 出力 (インポート用 I-R 列の画像も入力に使う)
  var row = [
    dateStr,                          // A 日付 (生成日時)
    ctx.operatorName,                 // B 担当
    '',                               // C label
    tagStr,                           // D タグ (TagShipping A 列から Gemini が選択)
    '',                               // E テンプレート
    categoryId,                       // F カテゴリーID (Gemini 出力)
    ctx.platform,                     // G 仕入れ先 <- インポート用 B 列
    ctx.productId,                    // H 仕入れ先コード <- インポート用 C 列 (商品 ID)
    ctx.price,                        // I 仕入れ価格 <- インポート用 D 列
    ctx.titleJa,                      // J 日本語title <- インポート用 E 列
    ctx.descJa,                       // K 商品説明 <- インポート用 F 列
    ctx.seller,                       // L セラーID <- インポート用 G 列
    geminiJson.title || '',           // M Title (英、Gemini 出力)
    geminiJson.description || '',     // N Condition/DIscription (英、Gemini 出力)
    ''                                // O シッピングポリシー (空、後続関数で計算)
  ];

  // P 以降: Item Specifics を ISF/IS値 ペアで展開 (最大 20 ペア)
  var specs = geminiJson.itemSpecifics || {};
  var specEntries = [];
  for (var key in specs) {
    if (Object.prototype.hasOwnProperty.call(specs, key)) {
      var k = String(key || '').replace(/[\r\n\t]/g, ' ').trim();
      var v = String(specs[key] == null ? '' : specs[key]).replace(/[\r\n\t]/g, ' ').trim();
      if (k) specEntries.push([k, v]);
    }
  }
  for (var p = 0; p < IS_MAX_PAIRS; p++) {
    if (p < specEntries.length) {
      row.push(specEntries[p][0]);
      row.push(specEntries[p][1]);
    } else {
      row.push('');
      row.push('');
    }
  }
  // BG 列「重複チェック」は空のまま（GAS 関数があれば自動計算される可能性あり、明示的に空）
  row.push('');
  return row;
}

// ===== エラー時の行（最小限の情報を残す） =====
function buildErrorRow_(ctx) {
  var now = new Date();
  var dateStr = Utilities.formatDate(now, Session.getScriptTimeZone() || 'Asia/Tokyo', 'yyyy/MM/dd');
  var row = [
    dateStr,
    ctx.operatorName,
    '',
    '',
    '',
    '',
    ctx.platform,
    ctx.productId,   // インポート用 C 列 (商品 ID)
    ctx.price,
    ctx.titleJa,
    ctx.descJa,
    ctx.seller,
    '',
    'ERROR: ' + ctx.errorMessage,
    ''
  ];
  for (var p = 0; p < IS_MAX_PAIRS * 2; p++) row.push('');
  row.push('');
  return row;
}

// ===== platform に応じたプラットフォームプロンプトを返す =====
function getPlatformPrompt_(platform) {
  var p = String(platform || '').toLowerCase();
  if (p === 'mercari' || p === 'mercari_shop') return PLATFORM_MERCARI_PROMPT;
  // 他プラットフォームは追って追加可。当面は mercari プロンプトを共通流用。
  return PLATFORM_MERCARI_PROMPT;
}

// ===== JSON パース（マークダウンコードフェンスが混入していても除去） =====
function safeParseJson_(text) {
  var t = (text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  var first = t.indexOf('{');
  var last = t.lastIndexOf('}');
  if (first >= 0 && last > first) t = t.substring(first, last + 1);
  return JSON.parse(t);
}

/**
 * recommendedUserTags を「TagShipping A 列に実在する 1 つだけ」に強制する後処理。
 * - 配列でなければ空配列に正規化
 * - 各要素を trim
 * - TagShipping A 列（userTags）との完全一致でフィルタ
 * - 残った中の先頭 1 つだけを採用
 * - 全部フィルタで消えた場合は空配列
 */
function enforceSingleTag_(json, userTags) {
  if (!json || typeof json !== 'object') return json;
  var tags = Array.isArray(json.recommendedUserTags) ? json.recommendedUserTags : [];
  var allowed = (Array.isArray(userTags) ? userTags : []).map(function (t) { return String(t).trim(); }).filter(Boolean);
  var allowedSet = {};
  for (var i = 0; i < allowed.length; i++) allowedSet[allowed[i]] = true;
  var filtered = tags
    .map(function (t) { return String(t || '').trim(); })
    .filter(function (t) { return t && allowedSet[t]; });
  json.recommendedUserTags = filtered.length > 0 ? [filtered[0]] : [];
  return json;
}

// ============================================================================
//  プロンプト定義
//  ※ とりこみ君 ~/Desktop/torikomikun/prompts/system_common.txt +
//     platform_mercari.txt を元に Gemini 用に埋め込み。
// ============================================================================

// SYSTEM_PROMPT は ~/Desktop/ebay-translation-skill.md (Codex/Claude/Gemini 共通スキル) と整合
var SYSTEM_PROMPT = [
  '# eBay Translation Skill',
  '',
  '日本の商品データ (テキスト + 画像) を英語の eBay 出品データに変換する。',
  '',
  '## 翻訳に使う AI',
  '- このプロンプトを受け取った AI 自身のマルチモーダル能力で翻訳する。他の AI を経由しない。',
  '',
  '## 画像入力',
  '- 画像 URL (=IMAGE() から抽出) は AI の vision 入力 (image_url) に直接渡される。',
  '- ローカルダウンロード / curl / base64 化は不要。',
  '',
  '## 出力 JSON スキーマ (各商品)',
  '{',
  '  "title": "string (80 字以内、英語)",',
  '  "description": "string (480 字以内、ASCII)",',
  '  "categorySuggestions": [{ "id": "string", "path": "string", "recommended": true, "reason": "string" }],',
  '  "itemSpecifics": { "<項目名>": "<値>" },',
  '  "recommendedUserTags": ["string"],',
  '  "warnings": ["string"]',
  '}',
  '',
  '## ルール (必須)',
  '',
  '- TITLE: 80 字以内。最初の 30 字に高価値キーワード (Brand / Type / Model)。許可記号: & / : - . , (+ TCG・グレード等で # \' +)。禁止記号: * $ ~ ^ @ ! ? TM ( ) [ ] { } " _ % = | \\ < > ;。VeRO 抵触語 (AUTHENTIC/OFFICIAL) 禁止、捏造 (RARE/LIMITED/VINTAGE) 根拠なし禁止。',
  '',
  '- DESCRIPTION: 480 字以内 ASCII、1 行のみ (改行 \\n を一切含めない)。構造化情報は " - " 区切りで 1 行に並べる (例: Lot of 3 sets. Item Details: - Brand: Topps - Year: 2023 - Player: Yamamoto - Grade: PSA 9)。"new"/"Brand New" 禁止 (「未使用」=Unused は OK)。HTML タグ、リンク、scripts は禁止。',
  '',
  '- トーン (重要): Description は eBay 出品者 (= ユーザー自身) が自分の商品として直接説明する第一人称トーンで書く。ソースを引用するような第三者表現は絶対禁止:',
  '  - 禁止例: per seller notes / according to seller / the seller states / seller mentions / per description / according to the original listing / as noted by the seller / based on seller\'s information / the original seller says',
  '  - 推奨: 出品者自身が言い切る形 (Minor marks may be present. / Used condition with light wear. / Includes original box.)',
  '',
  '- 除去対象 (DESCRIPTION / Item Specifics 共に含めない):',
  '  - 配送方法: メルカリ便、ゆうゆうメルカリ便、らくらくメルカリ便、匿名配送、ヤマト、佐川、ゆうパック、定形外、レターパック、補償付き 等',
  '  - 梱包条件: 水濡れ防止、折れ防止、プチプチ、ダンボール、緩衝材、丁寧に梱包 等',
  '  - 補償・取引文言: ノークレーム、ノーリターン、即購入 OK、即購入歓迎、コメント不要、お値引き不可、専用、お取り置き不可 等',
  '  - 出品者の主観評価: 美品、極美品、超美品、激安、お買い得、希少、レア (ソース根拠なしの捏造表現)',
  '  - 保管環境: ペット飼育なし、喫煙者なし、自宅保管、神経質な方はご遠慮 等',
  '  - 値下げ・キャンペーン: 値下げ中、最終価格、週末値下げ、フォロー割 等',
  '  - eBay 側で別管理する情報全般 (送料・関税・返品ポリシー)',
  '',
  '- Item Specifics: 画像・テキストから確実に分かるもののみ。Country/Region of Manufacture は本社国判定:',
  '  - Casio / Seiko / Citizen / Orient → Japan',
  '  - Rolex / Omega / Tag Heuer / Patek Philippe / Audemars Piguet / IWC / Tudor / Longines / Breitling / Hamilton / Hublot / Zenith / Jaeger-LeCoultre → Switzerland',
  '  - Cartier → France、Panerai → Italy',
  '  - Titleist / TaylorMade / Callaway / Ping / Cobra / Nixon → USA',
  '  - 辞書外で不明 → Japan',
  '',
  '- タグ判定 (画像不要、テキストベース): ユーザーから渡される TagShipping 許可リストから必ず 0 個または 1 個だけ。配送カテゴリで選ぶ。リストにない新規タグ禁止。該当なしなら []。',
  '',
  '- 画像の役割: Title / Description / Item Specifics の正確性向上のため。タグ判定には使わない。',
  '',
  '## warnings',
  '- 画像から確認できない情報を推測した場合は理由を箇条書きで記載 (日本語可)。推測なしなら []。',
  '',
  '## ハルシネーション禁止',
  '- 画像や商品データから確認できない仕様 (型番、年代、寸法、素材) は推測しない。どうしても推測した場合は warnings に明記。',
  '',
  '## 子供向け玩具 → Collectible 強制 (重要)',
  '- ぬいぐるみ / Plush / フィギュア / Figure / おもちゃ / Toy / 人形 / Doll / ミニカー / Model Car / Action Figure / Soft Toy / Stuffed Animal など、子供が遊ぶ可能性のあるアイテムは全て「Collectible (大人向け収集品)」として扱う。',
  '- Item Specifics の Type は Collectible 系を優先 (例: Action Figure → "Collectible Action Figure" / Plush → "Collectible Plush" / Doll → "Collectible Doll" / Model Car → "Collectible Model Car")。',
  '- Age Level / Recommended Age Range / Age (年齢要件) は元データに "3+" "6+" "8+" 等の幼児向け年齢が書かれていても **必ず "13+" / "14+" / "16+" のいずれかにする (デフォルト "14+")**。元データの幼児向け年齢は無視。',
  '- Title / Description にも "for children" / "for kids" / "ages 3+" / "preschool" / "baby toy" 等の幼児向け表現は使わない。代替: "for collectors" / "display piece" / "adult collectible" / "for display"。',
  '- 理由: eBay US Toys カテゴリの子供向け玩具規制 (CPSIA) を回避し、Collectibles として出品するため。',
  '',
  '## 動物素材ワード禁止',
  '- "Crocodile", "Alligator", "Ivory", "Ostrich", "Snake", "Snakeskin", "Lizard", "Tortoiseshell", "Python", "Stingray" 等は禁止。素材が不明・人工なら "Leather" / "Faux leather" / "Synthetic" / "Embossed leather" などに置換。',
  '',
  '## "Occasion" 禁止',
  '- 出品ツールが "CASIO" と誤認するため使用禁止。代替: "Use" / "Scene" / "Style" / "Wear" / "Event"。',
  '',
  '## 出力厳格ルール',
  '- 出力は純粋な JSON のみ。マークダウンのコードフェンス、前置き、後付け説明、コメントなど JSON 以外を含めない。',
  '- 必ず最初の文字を { で始め、最後の文字を } で終える。',
  '- title / description / categorySuggestions / itemSpecifics / recommendedUserTags / warnings の 6 キーを必ず含める。'
].join('\n');


var PLATFORM_MERCARI_PROMPT = [
  '# プラットフォーム情報',
  '- 商品ページの取得元: メルカリ (https://jp.mercari.com)',
  '- 商品データ内の platform フィールドが "mercari" または "mercari_shop" の場合、以下の指示が適用されます。',
  '',
  '# Item Specifics に必ず含めるべき項目（メルカリ → eBay 共通必須）',
  '- Country/Region of Manufacture: メルカリは日本のフリマサイトなので、日本ブランド・日本製・国内中古品の場合は Japan。海外ブランドの並行輸入品など明確に他国製の場合はその国。判断つかない場合は Japan にしつつ warnings に明記。',
  '- Brand: ブランド名・メーカー名。確認できない・ノーブランドの場合は Unbranded か省略 + warnings 記載。',
  '- Type: 商品の種類（例: Wristwatch, Action Figure, Trading Card, Handbag, Sneakers）。',
  '- Country of Origin は Country/Region of Manufacture と同義として扱い、両方を別キーで出さない。',
  '',
  '# 商品カテゴリ別の推奨必須項目',
  '- 時計: Brand / Department (Men/Women/Unisex) / Movement / Display / Case Material / Band Material / Dial Color / Case Size / Wrist Size（「腕周り○○cm」等の記載があれば "○○cm / ○○in" 形式で必ず含める。インチは cm ÷ 2.54、小数1位）/ Water Resistance / Reference Number / Model',
  '- 衣類・バッグ・靴: Brand / Department / Size / Color / Material / Style',
  '- フィギュア: Brand / Character / Franchise / Material / Size / Year of Manufacture',
  '- カードゲーム: Game / Character / Set / Card Number / Language / Manufacturer / Card Condition / Rarity',
  '- 電化製品: Brand / Model / MPN / Type / Color / Power Source / Connectivity',
  '- 本・雑誌: Author / Publisher / Language / Format / Publication Year',
  '- アンティーク・骨董: Original/Reproduction / Vintage / Material / Style / Period',
  '',
  '# メルカリ特有のノイズ除外（必ず除外）',
  '## 出品者個人の都合',
  '- 「即購入OK」「即決OK」「即購入歓迎」',
  '- 「専用です」「○○様専用」',
  '- 「コメント不要」「ノークレーム・ノーリターン」',
  '- 「値下げ不可」「お値引き不可」',
  '- 「即発送」「即日発送」「翌日発送」「土日のみ発送」',
  '- 「自宅保管品です」「自宅保管のため神経質な方はご遠慮ください」',
  '- 「ペット飼っています」「喫煙者がいます」',
  '- 「すり替え防止のため返品はご遠慮ください」',
  '- 「写真にて判断し、ご納得頂いた方のみお買い求めください」',
  '- 「梱包して発送いたしますが、発送後の郵送中の事故...」（送料・配送に関する免責）',
  '',
  '## メルカリ独自の文言',
  '- 「種別···シングルカード」のような区切り文字を含むカテゴリ表記',
  '- 「らくらくメルカリ便」「ゆうゆうメルカリ便」「定形外」などの配送方法名',
  '',
  '# 商品本体の情報（保持・翻訳対象）',
  '- ブランド・型番・モデル名',
  '- 素材・材質',
  '- サイズ・寸法・重量',
  '- 状態（傷・汚れ・付属品の有無）',
  '- 色・柄',
  '- 生産国・製造元',
  '- セット内容',
  '- 動作確認の有無（電化製品の場合）',
  '- ジャンク品・現状品・未確認品などの注意書きは Condition として翻訳する',
  '',
  '# メルカリの「商品の状態」マッピング',
  '- 「新品、未使用」 → "Unused"',
  '- 「未使用に近い」 → "Used (very minimal signs of use)"',
  '- 「目立った傷や汚れなし」 → "Used (minimal signs of use)"',
  '- 「やや傷や汚れあり」 → "Used (light signs of use)"',
  '- 「傷や汚れあり」 → "Used (visible signs of use)"',
  '- 「全体的に状態が悪い」 → "Used (heavy wear)" / "For parts or not working"',
  '',
  '# 画像の活用',
  '- メルカリは商品画像が複数枚あり、1 枚目がメイン。',
  '- メイン画像から判断してよいもの:',
  '  - キャラクター名・シリーズ名（説明文にない場合）',
  '  - ブランドロゴの確認',
  '  - 状態の確認（傷・汚れ・付属品の有無）',
  '  - 色・素材感',
  '- 画像で確認できない情報を推測した場合は warnings に明記する。'
].join('\n');
