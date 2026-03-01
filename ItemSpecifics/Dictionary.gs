/**
 * Dictionary.gs — 辞書シート管理
 * シート名: "Dictionary"
 * | A: Category | B: Tag_JP | C: Field_Name | D: Field_Type | E: Priority | F: Notes |
 */

var IS_DICTIONARY_SHEET_NAME = 'Dictionary';
var IS_DICTIONARY_CACHE_KEY = 'IS_DICTIONARY_CACHE_V1';
var IS_DICTIONARY_CACHE_TTL_SEC = 21600; // 6時間

/**
 * 辞書シートから全データを読み込み、カテゴリごとにグループ化して返す
 * @return {Object} { "Watches": { tag_jp: [..], fields: [{name, type, priority, notes}, ...] }, ... }
 */
function loadDictionary() {
  try {
    // キャッシュ
    var cache = getISCache_();
    if (cache) {
      var cached = cache.get(IS_DICTIONARY_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    var sheet = getDictionarySheet_(false);
    if (!sheet) {
      // シート未作成の場合は空の構造を返す
      var empty = {};
      if (cache) {
        cache.put(IS_DICTIONARY_CACHE_KEY, JSON.stringify(empty), IS_DICTIONARY_CACHE_TTL_SEC);
      }
      return empty;
    }

    var values = sheet.getDataRange().getValues();
    var dict = {};
    var tagSets = {}; // 重複除去用

    for (var i = 1; i < values.length; i++) { // 0行目はヘッダー
      var row = values[i];
      var category = (row[0] || '').toString().trim();
      var tagJpStr = (row[1] || '').toString().trim();
      var fieldName = (row[2] || '').toString().trim();
      var fieldType = (row[3] || '').toString().trim();
      var priorityRaw = row[4];
      var notes = (row[5] || '').toString();

      if (!category) {
        continue;
      }

      if (!dict[category]) {
        dict[category] = { tag_jp: [], fields: [] };
        tagSets[category] = {};
      }

      // タグの分割（, と 、 の両対応）
      if (tagJpStr) {
        var tags = tagJpStr.split(/[，,、]/);
        for (var t = 0; t < tags.length; t++) {
          var tg = (tags[t] || '').toString().trim();
          if (tg && !tagSets[category][tg]) {
            tagSets[category][tg] = true;
            dict[category].tag_jp.push(tg);
          }
        }
      }

      // フィールド
      if (fieldName) {
        var priority = 0;
        if (priorityRaw !== '' && priorityRaw !== null && priorityRaw !== undefined) {
          var p = parseInt(priorityRaw, 10);
          priority = isNaN(p) ? 0 : p;
        }
        dict[category].fields.push({
          name: fieldName,
          type: fieldType || '',
          priority: priority,
          notes: notes || ''
        });
      }
    }

    if (cache) {
      cache.put(IS_DICTIONARY_CACHE_KEY, JSON.stringify(dict), IS_DICTIONARY_CACHE_TTL_SEC);
    }
    return dict;
  } catch (e) {
    throw new Error('loadDictionary エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 日本語タグからeBayカテゴリ名を返す
 * 完全一致を優先、なければ部分一致
 * 見つからなければ null
 * @param {string} tag
 * @param {Object=} dictionary 省略時はloadDictionary()
 * @return {string|null}
 */
function getCategoryByTag(tag, dictionary) {
  try {
    var t = (tag || '').toString().trim();
    if (!t) {
      return null;
    }
    var dict = dictionary || loadDictionary();
    // 完全一致
    for (var cat in dict) {
      if (!dict.hasOwnProperty(cat)) continue;
      var tags = dict[cat].tag_jp || [];
      for (var i = 0; i < tags.length; i++) {
        if (t === tags[i]) {
          return cat;
        }
      }
    }
    // 部分一致
    for (var cat2 in dict) {
      if (!dict.hasOwnProperty(cat2)) continue;
      var tags2 = dict[cat2].tag_jp || [];
      for (var j = 0; j < tags2.length; j++) {
        if (tags2[j].indexOf(t) !== -1 || t.indexOf(tags2[j]) !== -1) {
          return cat2;
        }
      }
    }
    return null;
  } catch (e) {
    throw new Error('getCategoryByTag エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * カテゴリのItem Specificsフィールドリストを取得（並び替え: required→recommended、priority昇順）
 * @param {string} category
 * @param {Object=} dictionary 省略時はloadDictionary()
 * @return {Array.<Object>} [{name, type, priority, notes}, ...]
 */
function getFieldsForCategory(category, dictionary) {
  try {
    var cat = (category || '').toString().trim();
    if (!cat) {
      return [];
    }
    var dict = dictionary || loadDictionary();
    var entry = dict[cat];
    if (!entry || !entry.fields) {
      return [];
    }
    var fields = entry.fields.slice(0); // コピー
    fields.sort(function(a, b) {
      var aRank = a && a.type === 'required' ? 0 : (a && a.type === 'recommended' ? 1 : 2);
      var bRank = b && b.type === 'required' ? 0 : (b && b.type === 'recommended' ? 1 : 2);
      if (aRank !== bRank) return aRank - bRank;
      var ap = (a && typeof a.priority === 'number') ? a.priority : 0;
      var bp = (b && typeof b.priority === 'number') ? b.priority : 0;
      return ap - bp;
    });
    return fields;
  } catch (e) {
    throw new Error('getFieldsForCategory エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 辞書にカテゴリを追加
 * @param {string} category
 * @param {string} tagJp カンマ区切り
 * @param {Array.<Object>} fields [{name, type, priority, notes}, ...]
 */
function addCategoryToDictionary(category, tagJp, fields) {
  try {
    var cat = (category || '').toString().trim();
    if (!cat) {
      throw new Error('category が空です');
    }
    var tag = (tagJp || '').toString().trim();
    var sheet = getDictionarySheet_(true);
    ensureDictionaryHeader_(sheet);

    var rows = [];
    if (!fields || !fields.length) {
      throw new Error('fields は1件以上必要です');
    }
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i] || {};
      var name = (f.name != null ? f.name : f.field_name) || '';
      name = name.toString().trim();
      if (!name) continue;
      var type = (f.type != null ? f.type : f.field_type) || '';
      var pr = f.priority != null ? f.priority : '';
      if (pr !== '' && pr !== null && pr !== undefined) {
        var p = parseInt(pr, 10);
        pr = isNaN(p) ? '' : p;
      }
      var notes = (f.notes || '').toString();
      rows.push([cat, tag, name, type, pr, notes]);
    }
    if (!rows.length) {
      throw new Error('有効なフィールドがありません');
    }

    var startRow = sheet.getLastRow() + 1;
    var range = sheet.getRange(startRow, 1, rows.length, 6);
    range.setValues(rows);

    invalidateDictionaryCache_();
    return true;
  } catch (e) {
    throw new Error('addCategoryToDictionary エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 特定フィールドの更新
 * @param {string} category
 * @param {string} fieldName 既存フィールド名
 * @param {Object} updates {name, field_name, type, field_type, priority, notes, tag_jp}
 */
function updateFieldInDictionary(category, fieldName, updates) {
  try {
    var cat = (category || '').toString().trim();
    var target = (fieldName || '').toString().trim();
    if (!cat || !target) {
      throw new Error('category / fieldName が空です');
    }
    if (!updates) {
      throw new Error('updates が未定義です');
    }
    var sheet = getDictionarySheet_(false);
    if (!sheet) {
      throw new Error('辞書シートが見つかりません');
    }
    var values = sheet.getDataRange().getValues();
    var updated = false;
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if ((row[0] || '').toString().trim() === cat && (row[2] || '').toString().trim() === target) {
        // name 変更
        var newName = updates.name != null ? updates.name : updates.field_name;
        if (newName != null) {
          values[i][2] = newName;
        }
        // type 変更
        var newType = updates.type != null ? updates.type : updates.field_type;
        if (newType != null) {
          values[i][3] = newType;
        }
        // priority 変更
        if (updates.priority != null) {
          var p = parseInt(updates.priority, 10);
          values[i][4] = isNaN(p) ? '' : p;
        }
        // notes 変更
        if (updates.notes != null) {
          values[i][5] = updates.notes;
        }
        // tag_jp (カテゴリ単位のため同一カテゴリ行に反映)
        if (updates.tag_jp != null) {
          values[i][1] = updates.tag_jp;
        }
        updated = true;
      }
    }
    if (!updated) {
      return false;
    }
    // 書き戻し
    var range = sheet.getRange(1, 1, values.length, values[0].length);
    range.setValues(values);
    invalidateDictionaryCache_();
    return true;
  } catch (e) {
    throw new Error('updateFieldInDictionary エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * カテゴリごと削除
 * @param {string} category
 */
function deleteCategoryFromDictionary(category) {
  try {
    var cat = (category || '').toString().trim();
    if (!cat) {
      throw new Error('category が空です');
    }
    var sheet = getDictionarySheet_(false);
    if (!sheet) {
      return false;
    }
    var values = sheet.getDataRange().getValues();
    var rowsToDelete = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if ((row[0] || '').toString().trim() === cat) {
        rowsToDelete.push(i + 1); // シートの行番号
      }
    }
    if (!rowsToDelete.length) {
      return false;
    }
    // 下から削除
    for (var r = rowsToDelete.length - 1; r >= 0; r--) {
      sheet.deleteRow(rowsToDelete[r]);
    }
    invalidateDictionaryCache_();
    return true;
  } catch (e) {
    throw new Error('deleteCategoryFromDictionary エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 簡易辞書管理UI（UIのalert/prompt使用）
 */
function showDictionaryManager() {
  var ui = SpreadsheetApp.getUi();
  try {
    var loop = true;
    while (loop) {
      var dict = loadDictionary();
      var cats = [];
      for (var c in dict) {
        if (!dict.hasOwnProperty(c)) continue;
        cats.push(c);
      }
      cats.sort();
      var list = cats.length ? ('カテゴリ一覧:\n- ' + cats.join('\n- ')) : 'カテゴリは未登録です';
      var sel = ui.prompt('辞書管理', list + '\n\n操作: 既存カテゴリ名を入力 / new=新規 / exit=終了', ui.ButtonSet.OK_CANCEL);
      if (sel.getSelectedButton() !== ui.Button.OK) {
        break;
      }
      var input = (sel.getResponseText() || '').toString().trim();
      if (!input || input.toLowerCase() === 'exit') {
        break;
      }
      if (input.toLowerCase() === 'new') {
        // 新規カテゴリ
        var cnamePrompt = ui.prompt('新規カテゴリ', 'カテゴリ名を入力してください', ui.ButtonSet.OK_CANCEL);
        if (cnamePrompt.getSelectedButton() !== ui.Button.OK) continue;
        var cname = (cnamePrompt.getResponseText() || '').toString().trim();
        if (!cname) continue;
        var tagPrompt = ui.prompt('タグ（日本語）', 'カンマ区切りで入力してください', ui.ButtonSet.OK_CANCEL);
        if (tagPrompt.getSelectedButton() !== ui.Button.OK) continue;
        var tagJp = (tagPrompt.getResponseText() || '').toString().trim();

        var fieldsTextPrompt = ui.prompt('フィールド入力', '1行1フィールドで入力: name|type(required/recommended)|priority|notes\n例) Brand|required|1|', ui.ButtonSet.OK_CANCEL);
        if (fieldsTextPrompt.getSelectedButton() !== ui.Button.OK) continue;
        var lines = (fieldsTextPrompt.getResponseText() || '').toString().split(/\r?\n/);
        var fields = [];
        for (var i = 0; i < lines.length; i++) {
          var line = (lines[i] || '').toString().trim();
          if (!line) continue;
          var parts = line.split('|');
          var name = (parts[0] || '').toString().trim();
          var type = (parts[1] || '').toString().trim();
          var pr = (parts[2] || '').toString().trim();
          var notes = (parts[3] || '').toString();
          var p = parseInt(pr, 10);
          fields.push({ name: name, type: type, priority: isNaN(p) ? '' : p, notes: notes });
        }
        if (!fields.length) {
          ui.alert('1件以上のフィールドが必要です');
          continue;
        }
        addCategoryToDictionary(cname, tagJp, fields);
        ui.alert('カテゴリを追加しました');
        continue;
      }

      // 既存カテゴリ管理
      var cat = input;
      if (!dict[cat]) {
        ui.alert('カテゴリが見つかりません: ' + cat);
        continue;
      }
      var fields = getFieldsForCategory(cat, dict);
      var fLines = [];
      for (var k = 0; k < fields.length; k++) {
        var f = fields[k];
        fLines.push((k + 1) + '. ' + f.name + ' [' + (f.type || '-') + '] (p:' + (f.priority || '') + ') ' + (f.notes || ''));
      }
      var action = ui.prompt(
        'カテゴリ: ' + cat,
        (fLines.length ? fLines.join('\n') : 'フィールドは未登録です') + '\n\n操作: 1=追加 2=編集 3=削除 4=終了',
        ui.ButtonSet.OK_CANCEL
      );
      if (action.getSelectedButton() !== ui.Button.OK) {
        break;
      }
      var cmd = (action.getResponseText() || '').toString().trim();
      if (cmd === '1') {
        var addPrompt = ui.prompt('フィールド追加', 'name|type|required/recommended|priority|notes', ui.ButtonSet.OK_CANCEL);
        if (addPrompt.getSelectedButton() !== ui.Button.OK) continue;
        var parts = (addPrompt.getResponseText() || '').toString().split('|');
        var nameA = (parts[0] || '').toString().trim();
        var typeA = (parts[1] || '').toString().trim();
        var prA = parseInt((parts[2] || '').toString().trim(), 10);
        var notesA = (parts[3] || '').toString();
        addCategoryToDictionary(cat, (dict[cat].tag_jp || []).join(','), [{ name: nameA, type: typeA, priority: isNaN(prA) ? '' : prA, notes: notesA }]);
        ui.alert('フィールドを追加しました');
      } else if (cmd === '2') {
        var namePrompt = ui.prompt('編集対象フィールド名', '正確なフィールド名を入力', ui.ButtonSet.OK_CANCEL);
        if (namePrompt.getSelectedButton() !== ui.Button.OK) continue;
        var target = (namePrompt.getResponseText() || '').toString().trim();
        var updPrompt = ui.prompt('更新値', 'name|type|required/recommended|priority|notes（未変更は空欄）', ui.ButtonSet.OK_CANCEL);
        if (updPrompt.getSelectedButton() !== ui.Button.OK) continue;
        var up = (updPrompt.getResponseText() || '').toString().split('|');
        var upd = {};
        if ((up[0] || '').toString().trim()) upd.name = up[0];
        if ((up[1] || '').toString().trim()) upd.type = up[1];
        var prU = parseInt((up[2] || '').toString().trim(), 10);
        if (!isNaN(prU)) upd.priority = prU;
        if ((up[3] || '').toString().length) upd.notes = up[3];
        var ok = updateFieldInDictionary(cat, target, upd);
        ui.alert(ok ? '更新しました' : '対象が見つかりませんでした');
      } else if (cmd === '3') {
        var conf = ui.alert('確認', 'カテゴリ「' + cat + '」を削除しますか？', ui.ButtonSet.YES_NO);
        if (conf === ui.Button.YES) {
          deleteCategoryFromDictionary(cat);
          ui.alert('削除しました');
        }
      } else {
        // 終了 or 無効入力
        continue;
      }
    }
  } catch (e) {
    ui.alert('showDictionaryManager エラー: ' + (e && e.message ? e.message : e));
  }
}

/**
 * 初期データ投入（IS_INITIAL_DATA から）
 * 既存データがある場合は確認してから上書き
 */
function initializeDictionary() {
  var ui = SpreadsheetApp.getUi();
  try {
    if (!Array.isArray(IS_INITIAL_DATA)) {
      throw new Error('IS_INITIAL_DATA が見つかりません');
    }
    var sheet = getDictionarySheet_(true);
    var hasData = sheet.getLastRow() > 1; // ヘッダー以外にデータがあるか
    if (hasData) {
      var conf = ui.alert('初期化確認', '既存の辞書データを上書きします。よろしいですか？', ui.ButtonSet.YES_NO);
      if (conf !== ui.Button.YES) {
        ui.alert('操作をキャンセルしました');
        return;
      }
    }

    // クリアしてヘッダー設定
    sheet.clear();
    ensureDictionaryHeader_(sheet);

    var rows = [];
    for (var i = 0; i < IS_INITIAL_DATA.length; i++) {
      var d = IS_INITIAL_DATA[i] || {};
      var p = parseInt(d.priority, 10);
      rows.push([
        (d.category || ''),
        (d.tag_jp || ''),
        (d.field_name || ''),
        (d.field_type || ''),
        isNaN(p) ? '' : p,
        (d.notes || '')
      ]);
    }
    if (rows.length) {
      var range = sheet.getRange(2, 1, rows.length, 6);
      range.setValues(rows);
    }
    invalidateDictionaryCache_();
    ui.alert('辞書シートを初期化しました');
  } catch (e) {
    ui.alert('initializeDictionary エラー: ' + (e && e.message ? e.message : e));
  }
}

// ==============================
// 内部ユーティリティ（末尾に _）
// ==============================

function getISCache_() {
  var cache = null;
  try {
    cache = CacheService.getDocumentCache();
  } catch (e) {}
  if (!cache) {
    try {
      cache = CacheService.getUserCache();
    } catch (e2) {}
  }
  return cache;
}

function invalidateDictionaryCache_() {
  try {
    var cache1 = null;
    try { cache1 = CacheService.getDocumentCache(); } catch (e) {}
    if (cache1) {
      try { cache1.remove(IS_DICTIONARY_CACHE_KEY); } catch (e1) {}
    }
    var cache2 = null;
    try { cache2 = CacheService.getUserCache(); } catch (e2) {}
    if (cache2) {
      try { cache2.remove(IS_DICTIONARY_CACHE_KEY); } catch (e3) {}
    }
  } catch (e) {
    // 無視（キャッシュ無効化失敗は致命的ではない）
  }
}

/**
 * 辞書シート取得
 * @param {boolean} createIfMissing 無い場合に作成するか
 * @return {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function getDictionarySheet_(createIfMissing) {
  var settings = getISSettings();
  var id = (settings && settings.DICTIONARY_SHEET_ID) ? settings.DICTIONARY_SHEET_ID.toString().trim() : '';
  if (!id) {
    if (createIfMissing) {
      throw new Error('辞書スプレッドシートIDが未設定です。showISSettingsDialog() で設定してください');
    }
    return null;
  }
  var ss = SpreadsheetApp.openById(id);
  var sh = ss.getSheetByName(IS_DICTIONARY_SHEET_NAME);
  if (!sh && createIfMissing) {
    sh = ss.insertSheet(IS_DICTIONARY_SHEET_NAME);
  }
  return sh;
}

function ensureDictionaryHeader_(sheet) {
  if (!sheet) return;
  var header = ['Category', 'Tag_JP', 'Field_Name', 'Field_Type', 'Priority', 'Notes'];
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
    return;
  }
  var existing = sheet.getRange(1, 1, 1, header.length).getValues()[0];
  var needs = false;
  for (var i = 0; i < header.length; i++) {
    if ((existing[i] || '').toString().trim() !== header[i]) {
      needs = true; break;
    }
  }
  if (needs) {
    sheet.getRange(1, 1, 1, header.length).setValues([header]);
  }
}

