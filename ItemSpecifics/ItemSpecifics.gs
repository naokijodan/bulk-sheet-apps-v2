/**
 * ItemSpecifics.gs — メインスクリプト
 * Item Specifics自動抽出のエントリーポイント。
 * メニュー、抽出実行、UI、検証、書き込み処理を担当。
 *
 * 依存:
 * - Config_IS.gs: IS_CONFIG, getISSettings(), IS_INITIAL_DATA
 * - Dictionary.gs: loadDictionary(), getCategoryByTag(), getFieldsForCategory(), initializeDictionary(), showDictionaryManager()
 * - AIExtractor.gs: extractItemSpecifics(), mapTagToCategory(), extractItemSpecificsBatch()
 *
 * 注意: GASのES5互換 (var / function) に準拠
 */

/**
 * 初回セットアップ: GASエディタからこの関数を1回実行するだけで、
 * 以降シートを開くたびにItem Specificsメニューが自動表示される。
 * 既存のonOpen関数には一切変更を加えない。
 */

// =============================
// 公開: メニュー追加
// =============================

// APIキー設定ダイアログは廃止（共有キーに一本化）

// ============================
// Step 1: 基本項目（ルールベース、AI不要）
// Brand, Country/Region of Manufacture, Type の3項目
// ============================

function step1BasicSelectedRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) return;

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  try {
    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3;
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    var range = sheet.getActiveRange();
    if (!range) {
      ui.alert('範囲が選択されていません。');
      return;
    }

    var startRow = range.getRow();
    var numRows = range.getNumRows();
    var rows = [];
    for (var r = startRow; r < startRow + numRows; r++) {
      if (r >= dataStartRow) rows.push(r);
    }
    if (rows.length === 0) {
      ui.alert('対象行がありません。');
      return;
    }

    var results = runStep1Basic_(sheet, rows);
    if (results.length > 0) {
      writeItemSpecificsToSheet_(sheet, results);
      ss.toast('Step1完了: ' + results.length + ' 行にItem Specificsを出力しました', 'Item Specifics', 5);
    } else {
      ui.alert('出力対象の行がありませんでした。');
    }
  } catch (e) {
    Logger.log('[step1BasicSelectedRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

function step1BasicAllRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) return;

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  try {
    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3;
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < dataStartRow) {
      ui.alert('データ行がありません。');
      return;
    }

    var rows = [];
    for (var r = dataStartRow; r <= lastRow; r++) {
      rows.push(r);
    }

    ss.toast('Step1実行中... ' + rows.length + ' 行を処理します', 'Item Specifics', 5);
    var results = runStep1Basic_(sheet, rows);
    if (results.length > 0) {
      writeItemSpecificsToSheet_(sheet, results);
      ss.toast('Step1完了: ' + results.length + ' 行にItem Specificsを出力しました', 'Item Specifics', 5);
    } else {
      ui.alert('出力対象の行がありませんでした。');
    }
  } catch (e) {
    Logger.log('[step1BasicAllRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

/**
 * Step 1のコア処理: ルールベースでBrand, Country, Typeを抽出
 * @param {Sheet} sheet
 * @param {Array<number>} rows - 行番号の配列
 * @return {Array<{row: number, data: Object}>}
 */
function runStep1Basic_(sheet, rows) {
  var results = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var tag = getValue_(sheet, row, 1);    // A列
    var title = getValue_(sheet, row, 7);  // G列
    var description = getValue_(sheet, row, 12); // L列

    if (!tag && !title) continue;

    // 1. カテゴリ判定
    var category = matchCategoryFromTag_(tag);
    if (!category) {
      // カテゴリ不明 → Brand, Type, Country の3つだけ出力
      category = '_default';
    }

    // 2. カテゴリ別フィールドリスト取得
    var fields = IS_CATEGORY_FIELDS[category];
    if (!fields) {
      fields = ['Brand', 'Type', 'Country/Region of Manufacture'];
    }

    // 3. Brand情報を先に取得（複数フィールドで使うため）
    var brandInfo = matchBrandFromTitle_(title, category);

    // 4. 各フィールドを順番に埋める
    var data = {};
    for (var f = 0; f < fields.length; f++) {
      var fieldName = fields[f];
      var value = resolveFieldValue_(fieldName, tag, title, brandInfo, category, description, data);
      data[fieldName] = value || 'Does not apply';
    }

    results.push({ row: row, data: data });
  }
  return results;
}

// タグからカテゴリを判定
function matchCategoryFromTag_(tag) {
  if (!tag) return '';
  var t = tag.toString().trim();
  // 完全一致
  if (typeof IS_TAG_TO_CATEGORY !== 'undefined' && IS_TAG_TO_CATEGORY[t]) return IS_TAG_TO_CATEGORY[t];
  // 部分一致
  if (typeof IS_TAG_TO_CATEGORY !== 'undefined') {
    var keys = Object.keys(IS_TAG_TO_CATEGORY);
    // 長いキーを優先（「イヤリング」を「リング」より先にマッチさせる）
    keys.sort(function(a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      if (t.indexOf(keys[i]) !== -1) return IS_TAG_TO_CATEGORY[keys[i]];
    }
  }
  return '';
}

// フィールド名に応じた値を解決
function resolveFieldValue_(fieldName, tag, title, brandInfo, category, description, data) {
  switch (fieldName) {
    case 'Brand':
      return brandInfo ? brandInfo.name : '';
    case 'Country/Region of Manufacture':
      if (category === 'Video Games' || category === 'Trading Cards') return 'Japan';
      return brandInfo ? brandInfo.country : '';
    case 'Model':
      return brandInfo && brandInfo.sub_brand ? brandInfo.sub_brand : '';
    case 'Type':
      return matchTypeFromTag_(tag);
    // === Video Games fields ===
    case 'Platform':
      return matchPlatformFromTitle_(title);
    case 'Region Code':
      return matchFromPatterns_(title + ' ' + (description || ''), IS_REGION_CODE_PATTERNS);
    case 'Genre':
      return matchFromPatterns_(title + ' ' + (description || ''), IS_GENRE_PATTERNS);
    case 'Game Name':
      return extractGameName_(title);
    case 'Publisher':
      var pub = matchFromPatterns_(title, IS_GAME_PUBLISHER_PATTERNS);
      if (pub) return pub;
      return brandInfo ? brandInfo.name : '';
    case 'Rating':
      return '';
    case 'Metal':
    case 'Case Material':
    case 'Band Material':
      return matchFromPatterns_(title, IS_METAL_PATTERNS);
    case 'Metal Purity':
      return matchFromPatterns_(title, IS_PURITY_PATTERNS);
    case 'Main Stone':
      return matchFromPatterns_(title, IS_GEMSTONE_PATTERNS);
    case 'Department':
      return matchFromPatterns_(title, IS_DEPARTMENT_PATTERNS);
    case 'Movement':
      return matchFromPatterns_(title, IS_MOVEMENT_PATTERNS);
    case 'Color':
    case 'Exterior Color':
    case 'Dial Color':
      return matchAllColors_(title);
    case 'Material':
    case 'Exterior Material':
      // Watch Partsの場合、素材が不明ならStainless Steelをデフォルトにする
      var mat = matchFromPatterns_(title, IS_METAL_PATTERNS);
      if (!mat) mat = matchFromPatterns_(title, IS_GENERAL_MATERIAL_PATTERNS);
      if (!mat && category === 'Watch Parts') mat = 'Stainless Steel';
      return mat;
    case 'Style':
      // バッグの場合はタグからスタイルを取得
      return matchTypeFromTag_(tag);
    // === Trading Cards fields ===
    case 'Character':
      if (category === 'Trading Cards') {
        var charGame = (data && data['Game'] && data['Game'] !== 'Does not apply') ? data['Game'] : '';
        return matchFromPatterns_(title + ' ' + (description || ''), getCardCharacterPatternsForGame_(charGame));
      }
      return '';
    case 'Rarity':
      if (category === 'Trading Cards') {
        var rarGame = (data && data['Game'] && data['Game'] !== 'Does not apply') ? data['Game'] : '';
        return matchFromPatterns_(title + ' ' + (description || ''), getCardRarityPatternsForGame_(rarGame));
      }
      return matchFromPatterns_(title + ' ' + (description || ''), IS_CARD_RARITY_PATTERNS);
    case 'Finish':
      return matchFromPatterns_(title + ' ' + (description || ''), IS_CARD_FINISH_PATTERNS);
    case 'Set':
      if (category === 'Trading Cards') {
        var setGame = (data && data['Game'] && data['Game'] !== 'Does not apply') ? data['Game'] : '';
        return matchFromPatterns_(title + ' ' + (description || ''), getCardSetPatternsForGame_(setGame));
      }
      return matchFromPatterns_(title + ' ' + (description || ''), IS_CARD_SET_PATTERNS);
    case 'Card Number':
      return extractCardNumber_(title);
    case 'Specialty':
      return '';
    case 'Game':
      return matchFromPatterns_(title, IS_GAME_PATTERNS);
    case 'Language':
      return 'Japanese';
    case 'Case Size':
      var cs = matchCaseSize_(title);
      if (!cs && description) cs = matchCaseSize_(description);
      return cs;
    case 'Graded':
      return matchGraded_(title);
    case 'Professional Grader':
      return matchGraderFromTitle_(title);
    case 'Grade':
      return matchGradeFromTitle_(title);
    case 'Part Type':
      return matchWatchPartType_(title + ' ' + (description || ''));
    case 'Compatible Model':
      return matchCompatibleModel_(title, brandInfo);
    case 'Size':
      var sz = matchPartSize_(title);
      if (!sz && description) sz = matchPartSize_(description);
      return sz;
    default:
      return '';
  }
}

// タイトルから全色をマッチしてカンマ区切りで返す
function matchAllColors_(title) {
  if (!title) return '';
  if (typeof IS_COLOR_PATTERNS === 'undefined' || !IS_COLOR_PATTERNS) return '';
  var t = title.toString();
  var found = [];
  for (var i = 0; i < IS_COLOR_PATTERNS.length; i++) {
    var p = IS_COLOR_PATTERNS[i];
    if (!p.keywords) continue;
    for (var j = 0; j < p.keywords.length; j++) {
      if (t.indexOf(p.keywords[j]) !== -1) {
        if (found.indexOf(p.value) === -1) found.push(p.value);
        break;
      }
    }
  }
  return found.join(', ');
}

// Watch Parts: タイトルからパーツタイプを判定
function matchWatchPartType_(title) {
  if (!title) return '';
  if (typeof IS_WATCH_PART_TYPE_PATTERNS === 'undefined') return '';
  return matchFromPatterns_(title, IS_WATCH_PART_TYPE_PATTERNS);
}

// Watch Parts: タイトルからCompatible Modelを抽出
// ブランド名の後に続くモデル名（Florence, Submariner等）を取得
function matchCompatibleModel_(title, brandInfo) {
  if (!title) return '';
  var t = title.toString();
  // ブランド名が分かっていれば、その直後のワードをモデル候補として抽出
  if (brandInfo && brandInfo.name) {
    var brandName = brandInfo.name;
    var idx = t.toLowerCase().indexOf(brandName.toLowerCase());
    if (idx !== -1) {
      var after = t.substring(idx + brandName.length).trim();
      // ブランド名の後の最初の単語（英字で始まるもの）をモデル名候補とする
      var m = after.match(/^([A-Z][A-Za-z0-9\-]+(?:\s+[A-Z][A-Za-z0-9\-]+)?)/);
      if (m) {
        var candidate = m[1].trim();
        // "Spare", "Part", "Watch", "Link" などの汎用ワードは除外
        var excludes = ['Spare', 'Part', 'Watch', 'Link', 'Pin', 'Bracelet', 'Band', 'Strap',
                        'Buckle', 'Clasp', 'Movement', 'Crystal', 'Crown', 'Dial', 'Bezel',
                        'Case', 'Hand', 'Rotor', 'Stem', 'Accessory', 'Component', 'Replacement'];
        var firstWord = candidate.split(/\s+/)[0];
        var isExcluded = false;
        for (var i = 0; i < excludes.length; i++) {
          if (firstWord.toLowerCase() === excludes[i].toLowerCase()) { isExcluded = true; break; }
        }
        if (!isExcluded && candidate.length > 1) return candidate;
      }
    }
  }
  return '';
}

// Watch Parts: タイトル・説明文からサイズを抽出
function matchPartSize_(title) {
  if (!title) return '';
  var t = title.toString();
  // パターン: 数字 + mm/cm （例: "19mm", "1.9 cm", "20mm幅"）
  var m = t.match(/(\d+(?:\.\d+)?)\s*(?:mm|MM)/);
  if (m) return m[1] + ' mm';
  m = t.match(/(\d+(?:\.\d+)?)\s*(?:cm|CM)/);
  if (m) return m[1] + ' cm';
  return '';
}

/**
 * タイトルからプラットフォームを判定
 * 部分文字列の問題を避けるため、長いキーワードから先にマッチ
 */
function matchPlatformFromTitle_(title) {
  if (!title) return '';
  if (typeof IS_PLATFORM_PATTERNS === 'undefined' || !IS_PLATFORM_PATTERNS) return '';
  var t = title.toString();
  // SFC/FC問題: "SFC"が先にマッチするよう、パターン配列の順序に依存
  return matchFromPatterns_(t, IS_PLATFORM_PATTERNS);
}

/**
 * タイトルからゲーム名を抽出
 * プラットフォームコード・リージョンコード・状態表記・eBay用語を除去して返す
 */
function extractGameName_(title) {
  if (!title) return '';
  var t = title.toString();

  // 1. プラットフォームコードを除去（長い順にマッチさせて部分文字列問題を回避）
  var platformCodes = [
    'Super Famicom', 'Nintendo Switch', 'Game Boy Advance', 'Game Boy Color',
    'Game Boy', 'Game Gear', 'GameCube', 'Mega Drive', 'PC Engine',
    'PlayStation Vita', 'PlayStation 5', 'PlayStation 4', 'PlayStation 3',
    'PlayStation 2', 'PlayStation', 'Neo Geo', 'Virtual Boy', 'WonderSwan',
    'Dreamcast', 'TurboGrafx',
    'Nintendo DS', 'Xbox Series', 'Xbox One', 'Xbox 360',
    'PSVITA', 'PSone', 'PS Vita',
    'MSX2+', 'MSX2',
    'SNES', 'SFC', 'NES', 'GBA', 'GBC', 'N64', 'NDS', '3DS',
    'PS5', 'PS4', 'PS3', 'PS2', 'PS1', 'PSP',
    'MSX', 'GC', 'GB', 'FC', 'MD', 'DC', 'SS', 'GG',
    'Xbox', 'Wii U', 'WiiU', 'Wii',
    'PCE', 'PC'
  ];
  for (var i = 0; i < platformCodes.length; i++) {
    var code = platformCodes[i];
    var regex = new RegExp('\\b' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    t = t.replace(regex, ' ');
  }

  // 2. リージョンコード除去
  t = t.replace(/\bNTSC[\-\/]?J\b/gi, ' ');
  t = t.replace(/\bNTSC[\-\/]?U(?:\/C)?\b/gi, ' ');
  t = t.replace(/\bPAL\b/gi, ' ');
  t = t.replace(/\bRegion Free\b/gi, ' ');

  // 3. 状態表記除去
  var conditionWords = [
    'CIB', 'Complete In Box', 'Complete in Box',
    'No Manual', 'No Box', 'Box Manual', 'Box Included',
    'Manual Included', 'Game Only', 'Disc Only', 'Discs Only',
    'Cart Only', 'Cartridge Only', 'Boxed',
    'with Box', 'with Manual', 'w/ Box', 'w/ Manual',
    'Japan Import', 'Japanese Import', 'Japanese Version',
    'Japan Version', 'Japanese',
    'Retro', 'Rare', 'Vintage', 'Classic', 'Collectible',
    'Limited', 'Limited Edition', 'Edition', 'Original',
    'Video Game', 'Collectors', 'Collection'
  ];
  for (var j = 0; j < conditionWords.length; j++) {
    var cw = conditionWords[j];
    var cwRegex = new RegExp('\\b' + cw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
    t = t.replace(cwRegex, ' ');
  }

  // 4. 余分なスペース整理
  t = t.replace(/\s+/g, ' ').trim();

  // 5. 末尾の不要ワードを除去（繰り返し）
  var trailingWords = ['Set', 'Pack', 'Lot', 'Bundle', 'Import', 'Included'];
  var changed = true;
  while (changed) {
    changed = false;
    for (var k = 0; k < trailingWords.length; k++) {
      var tw = trailingWords[k];
      var twRegex = new RegExp('\\s+' + tw + '\\s*$', 'i');
      if (twRegex.test(t)) {
        t = t.replace(twRegex, '').trim();
        changed = true;
      }
    }
  }

  return t;
}

// パターン辞書から最初にマッチした値を返す
function matchFromPatterns_(text, patterns) {
  if (!text || !patterns) return '';
  var t = text.toString();
  for (var i = 0; i < patterns.length; i++) {
    var p = patterns[i];
    if (!p.keywords) continue;
    for (var j = 0; j < p.keywords.length; j++) {
      if (t.indexOf(p.keywords[j]) !== -1) {
        return p.value;
      }
    }
  }
  return '';
}

// PSA/BGS等のグレーディング判定
function matchGraded_(title) {
  if (!title) return '';
  var t = title.toString();
  var gradeKeywords = ['PSA', 'BGS', 'CGC', 'SGC', 'ARS', 'グレード'];
  for (var i = 0; i < gradeKeywords.length; i++) {
    if (t.indexOf(gradeKeywords[i]) !== -1) return 'Yes';
  }
  return 'No';
}

// タイトルからカード番号を抽出
function extractCardNumber_(title) {
  if (!title) return '';
  var t = title.toString();
  // パターン1: 123/456 形式（最も一般的）
  var m = t.match(/(\d{1,4}\/\d{1,4})/);
  if (m) return m[1];
  // パターン2: #123 形式
  m = t.match(/#(\d{1,4})/);
  if (m) return m[1];
  // パターン3: SV2a-123, BT01-034 等のセットコード形式
  m = t.match(/([A-Z]{1,4}\d{1,3}[a-z]?[-]\d{2,4})/);
  if (m) return m[1];
  return '';
}

// PSA/BGS等のグレーダー名を抽出
function matchGraderFromTitle_(title) {
  if (!title) return '';
  var t = title.toString();
  if (t.indexOf('PSA') !== -1) return 'PSA';
  if (t.indexOf('BGS') !== -1) return 'BGS (Beckett)';
  if (t.indexOf('CGC') !== -1) return 'CGC';
  if (t.indexOf('SGC') !== -1) return 'SGC';
  if (t.indexOf('ARS') !== -1) return 'ARS';
  return '';
}

// PSA 10, BGS 9.5 等のグレード値を抽出
function matchGradeFromTitle_(title) {
  if (!title) return '';
  var t = title.toString();
  // PSA 10, PSA10, 【PSA10】等
  var m = t.match(/PSA\s*(\d+(?:\.\d+)?)/i);
  if (m) return 'PSA ' + m[1];
  m = t.match(/BGS\s*(\d+(?:\.\d+)?)/i);
  if (m) return 'BGS ' + m[1];
  m = t.match(/CGC\s*(\d+(?:\.\d+)?)/i);
  if (m) return 'CGC ' + m[1];
  m = t.match(/SGC\s*(\d+(?:\.\d+)?)/i);
  if (m) return 'SGC ' + m[1];
  return '';
}

// タイトルからケースサイズ（mm）を抽出
// 例: "42mm", "40ミリ", "ケース径38", "φ36" → "42 mm" 等
function matchCaseSize_(title) {
  if (!title) return '';
  var t = title.toString();
  // パターン0: "Case diameter about XX mm" / "case size XX mm"
  var m0 = t.match(/[Cc]ase\s+(?:diameter|size)\s+(?:about\s+)?(?:approx\.?\s+)?(\d{2,3})\s*mm/i);
  if (m0) {
    var size0 = parseInt(m0[1], 10);
    if (size0 >= 20 && size0 <= 60) return size0 + ' mm';
  }
  // パターン1: 数字+mm/MM（20-60mmの範囲で時計として妥当なサイズ）
  var m = t.match(/(\d{2,3})\s*(?:mm|MM|ＭＭ)/);
  if (m) {
    var size = parseInt(m[1], 10);
    if (size >= 20 && size <= 60) return size + ' mm';
  }
  // パターン2: 数字+ミリ
  m = t.match(/(\d{2,3})\s*ミリ/);
  if (m) {
    var size2 = parseInt(m[1], 10);
    if (size2 >= 20 && size2 <= 60) return size2 + ' mm';
  }
  // パターン3: ケース径/ケースサイズ+数字
  m = t.match(/ケース[径サイズ]\s*[：:]?\s*(?:約)?\s*(\d{2,3})/);
  if (m) {
    var size3 = parseInt(m[1], 10);
    if (size3 >= 20 && size3 <= 60) return size3 + ' mm';
  }
  // パターン4: φ+数字
  m = t.match(/[φΦ]\s*(\d{2,3})/);
  if (m) {
    var size4 = parseInt(m[1], 10);
    if (size4 >= 20 && size4 <= 60) return size4 + ' mm';
  }
  return '';
}

/**
 * 短い名前（4文字以下）の場合、タイトル内で単語境界にあるかチェック
 * 5文字以上の名前は常にtrueを返す（既存の動作を変えない）
 */
function isWordBoundaryMatch_(text, matchStr, pos) {
  if (matchStr.length > 4) return true;
  // マッチ位置の前の文字をチェック
  if (pos > 0) {
    var before = text.charAt(pos - 1);
    if (/[a-zA-Z0-9]/.test(before)) return false;
  }
  // マッチ位置の後の文字をチェック
  var afterPos = pos + matchStr.length;
  if (afterPos < text.length) {
    var after = text.charAt(afterPos);
    if (/[a-zA-Z0-9]/.test(after)) return false;
  }
  return true;
}

/**
 * タイトルからIS_BRAND_DICTを使ってブランドをマッチ
 * 長い名前を優先（"Grand Seiko" > "Seiko"）
 * @param {string} title
 * @return {{name: string, country: string}|null}
 */
function matchBrandFromTitle_(title, opt_category) {
  if (!title) return null;
  if (typeof IS_BRAND_DICT === 'undefined' || !IS_BRAND_DICT) return null;

  var t = title.toString().toLowerCase();
  var bestMatch = null;
  var bestLen = 0;
  var materialMatch = null;
  var materialLen = 0;

  // parent_brand 検証用のルックアップマップを一度だけ構築
  var parentBrandMap = {};
  for (var pi = 0; pi < IS_BRAND_DICT.length; pi++) {
    var pb = IS_BRAND_DICT[pi];
    if (pb && pb.name && !pb.parent_brand) {
      parentBrandMap[pb.name.toLowerCase()] = pb.jp_names || [];
    }
  }

  for (var i = 0; i < IS_BRAND_DICT.length; i++) {
    var b = IS_BRAND_DICT[i];
    if (!b || !b.name) continue;
    // category制限チェック
    if (b.category && b.category.length > 0) {
      if (!opt_category) continue; // カテゴリ不明なら制限付きブランドはスキップ
      var catMatch = false;
      for (var c = 0; c < b.category.length; c++) {
        if (b.category[c].toLowerCase() === opt_category.toString().toLowerCase()) {
          catMatch = true;
          break;
        }
      }
      if (!catMatch) continue;
    }
    var isMaterial = b.is_material === true;

    // 英語名チェック（通常）
    var nameLower = b.name.toLowerCase();
    var namePos = t.indexOf(nameLower);
    if (namePos !== -1 && isWordBoundaryMatch_(t, nameLower, namePos)) {
      // parent_brand がある場合は、parent_brand もタイトルに存在するか検証
      if (b.parent_brand) {
        var parentLower = b.parent_brand.toLowerCase();
        var parentFound = (t.indexOf(parentLower) !== -1);
        if (!parentFound) {
          var parentJpNames = parentBrandMap[parentLower] || [];
          for (var pj = 0; pj < parentJpNames.length; pj++) {
            if (t.indexOf(parentJpNames[pj].toLowerCase()) !== -1) {
              parentFound = true;
              break;
            }
          }
        }
        if (!parentFound) continue; // parent_brand が見つからない場合はスキップ
      }
      if (isMaterial) {
        if (b.parent_brand ? (b.name.length >= materialLen) : (b.name.length > materialLen)) {
          materialMatch = { name: (b.parent_brand || b.name), country: b.country || '' };
          if (b.parent_brand) materialMatch.sub_brand = b.name;
          materialLen = b.name.length;
        }
      } else {
        if (b.parent_brand ? (b.name.length >= bestLen) : (b.name.length > bestLen)) {
          bestMatch = { name: (b.parent_brand || b.name), country: b.country || '' };
          if (b.parent_brand) bestMatch.sub_brand = b.name;
          bestLen = b.name.length;
        }
      }
    }

    // 日本語名チェック（通常）
    if (b.jp_names) {
      for (var j = 0; j < b.jp_names.length; j++) {
        var jp = b.jp_names[j];
        if (jp) {
          var jpLower = jp.toLowerCase();
          var jpPos = t.indexOf(jpLower);
          if (jpPos !== -1 && isWordBoundaryMatch_(t, jpLower, jpPos)) {
          // parent_brand がある場合は、parent ブランドもタイトルに存在するか検証（フラグで制御）
          var parentOk = true;
          if (b.parent_brand) {
            var parentLower2 = b.parent_brand.toLowerCase();
            var parentFound2 = (t.indexOf(parentLower2) !== -1);
            if (!parentFound2) {
              var parentJpNames2 = parentBrandMap[parentLower2] || [];
              for (var pj2 = 0; pj2 < parentJpNames2.length; pj2++) {
                if (t.indexOf(parentJpNames2[pj2].toLowerCase()) !== -1) {
                  parentFound2 = true;
                  break;
                }
              }
            }
            if (!parentFound2) parentOk = false;
          }
          if (parentOk) {
            if (isMaterial) {
              if (b.parent_brand ? (jp.length >= materialLen) : (jp.length > materialLen)) {
                materialMatch = { name: (b.parent_brand || b.name), country: b.country || '' };
                if (b.parent_brand) materialMatch.sub_brand = b.name;
                materialLen = jp.length;
              }
            } else {
              if (b.parent_brand ? (jp.length >= bestLen) : (jp.length > bestLen)) {
                bestMatch = { name: (b.parent_brand || b.name), country: b.country || '' };
                if (b.parent_brand) bestMatch.sub_brand = b.name;
                bestLen = jp.length;
              }
            }
          }
          }
        }
      }
    }
  }

  // 通常ブランドが見つかればそちらを優先、なければ素材ブランドをフォールバック
  return bestMatch || materialMatch;
}

/**
 * タグからTypeを推定（IS_TAG_TO_TYPEを使用）
 * 完全一致 → 部分一致の順で検索
 * @param {string} tag
 * @return {string}
 */
function matchTypeFromTag_(tag) {
  if (!tag) return '';
  if (typeof IS_TAG_TO_TYPE === 'undefined' || !IS_TAG_TO_TYPE) return '';

  var t = tag.toString().trim();

  // 完全一致
  if (IS_TAG_TO_TYPE[t]) {
    return IS_TAG_TO_TYPE[t];
  }

  // 部分一致（タグの中にキーが含まれる）
  var keys = Object.keys(IS_TAG_TO_TYPE);
  // 長いキーを優先（「イヤリング」を「リング」より先にマッチさせる）
  keys.sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) !== -1) {
      return IS_TAG_TO_TYPE[keys[i]];
    }
  }

  return '';
}

// =============================
// 公開: 選択行の抽出
// =============================
function extractSelectedRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) {
    return;
  }

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  var toastTitle = 'Item Specifics';
  try {
    var v = validateSetup_();
    if (!v.ok) {
      ui.alert(v.message || 'セットアップの検証に失敗しました。');
      return;
    }

    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3; // 既定: 3行目からデータ
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    var range = sheet.getActiveRange();
    if (!range) {
      ui.alert('範囲が選択されていません。');
      return;
    }

    var startRow = range.getRow();
    var numRows = range.getNumRows();
    var lastRow = startRow + numRows - 1;

    // 対象行をユニークに抽出
    var rows = [];
    var seen = {};
    var r;
    for (r = startRow; r <= lastRow; r++) {
      if (r >= dataStartRow && !seen[r]) {
        rows.push(r);
        seen[r] = true;
      }
    }
    if (rows.length === 0) {
      ui.alert('選択範囲内に対象行がありません（データ開始行以降のみ処理）。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('辞書読み込み中...', toastTitle, 5);

    // 辞書読み込み（補完用 — なくても動作する）
    var dict = null;
    try {
      dict = (typeof loadDictionary === 'function') ? loadDictionary() : null;
    } catch (dictErr) {
      Logger.log('[extractSelectedRows] loadDictionary warning: ' + dictErr);
      // 辞書なしでも続行
    }

    // データの読み取り (A:tag, G:title, L:description)
    var requests = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var tag = getValue_(sheet, row, 1);      // A列
      var title = getValue_(sheet, row, 7);    // G列
      var desc = getValue_(sheet, row, 12);    // L列

      if (!title && !tag) {
        Logger.log('[extractSelectedRows] skip row ' + row + ' (tag/title empty)');
        continue;
      }

      // カテゴリとフィールドは辞書から取得を試みるが、失敗しても続行
      var category = null;
      var fields = [];
      try {
        if (dict && typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
        if (category && typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (dictLookupErr) {
        Logger.log('[extractSelectedRows] dict lookup warning row ' + row + ': ' + dictLookupErr);
      }
      // category/fieldsがnull/空でもリクエストに含める（AIが自律判定する）

      // Step1で既に書き込まれたデータを読み取る
      var existingData = readExistingSpecifics_(sheet, row);

      requests.push({
        row: row,
        tag: tag,
        title: title,
        description: desc,
        category: category,
        fields: fields,
        existingData: existingData
      });
    }

    if (requests.length === 0) {
      ui.alert('処理対象の行がありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('AI抽出を実行中... 対象: ' + requests.length + ' 行', toastTitle, 10);

    var results = runExtractionBatchWithRetry_(requests, settings, 2);
    if (!results || results.length === 0) {
      ui.alert('抽出結果が得られませんでした。\nログを確認してください: 表示 > 実行ログ');
      return;
    }

    writeItemSpecificsToSheet_(sheet, results);

    SpreadsheetApp.getActiveSpreadsheet().toast('完了: ' + results.length + ' 行のItem Specificsを抽出しました', toastTitle, 5);
  } catch (e) {
    Logger.log('[extractSelectedRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

// =============================
// 公開: 全行の抽出
// =============================
function extractAllRows() {
  var lock = LockService.getScriptLock();
  if (!acquireLock_(lock)) {
    return;
  }

  var ss = SpreadsheetApp.getActive();
  var ui = SpreadsheetApp.getUi();
  var toastTitle = 'Item Specifics';
  try {
    var v = validateSetup_();
    if (!v.ok) {
      ui.alert(v.message || 'セットアップの検証に失敗しました。');
      return;
    }

    var settings = getActiveISSettings_();
    var dataStartRow = settings.dataStartRow || 3;
    var targetSheetName = settings.targetSheetName || '出品2';

    var sheet = ss.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      ui.alert('アクティブシートが "' + targetSheetName + '" ではありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('辞書読み込み中...', toastTitle, 5);
    var dict = null;
    try {
      dict = (typeof loadDictionary === 'function') ? loadDictionary() : null;
    } catch (dictErr) {
      Logger.log('[extractAllRows] loadDictionary error: ' + dictErr);
    }

    var lastRow = sheet.getLastRow();
    if (lastRow < dataStartRow) {
      ui.alert('データ行がありません。');
      return;
    }

    var requests = [];
    var r;
    for (r = dataStartRow; r <= lastRow; r++) {
      var tag = getValue_(sheet, r, 1);   // A
      var title = getValue_(sheet, r, 7); // G
      var desc = getValue_(sheet, r, 12); // L
      if (!tag && !title) {
        continue; // スキップ
      }

      // カテゴリとフィールドは辞書から取得を試みるが、失敗しても続行
      var category = null;
      var fields = [];
      try {
        if (dict && typeof getCategoryByTag === 'function' && tag) {
          category = getCategoryByTag(tag, dict);
        }
        if (category && typeof getFieldsForCategory === 'function') {
          fields = getFieldsForCategory(category, dict) || [];
        }
      } catch (dictLookupErr2) {
        Logger.log('[extractAllRows] dict lookup warning row ' + r + ': ' + dictLookupErr2);
      }
      // category/fieldsがnull/空でもリクエストに含める（AIが自律判定する）

      var existingData2 = readExistingSpecifics_(sheet, r);

      requests.push({
        row: r,
        tag: tag,
        title: title,
        description: desc,
        category: category,
        fields: fields,
        existingData: existingData2
      });

      if (requests.length % 20 === 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast('準備中... ' + requests.length + ' 行を収集', toastTitle, 5);
      }
    }

    if (requests.length === 0) {
      ui.alert('処理対象の行がありません。');
      return;
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('AI抽出をバッチ実行中... ' + requests.length + ' 行', toastTitle, 10);
    var results = runExtractionBatchWithRetry_(requests, settings, 2);

    if (results && results.length > 0) {
      writeItemSpecificsToSheet_(sheet, results);
      SpreadsheetApp.getActiveSpreadsheet().toast('完了: ' + results.length + ' 行のItem Specificsを抽出しました', toastTitle, 5);
    } else {
      ui.alert('抽出結果が得られませんでした。');
    }
  } catch (e) {
    Logger.log('[extractAllRows] error: ' + (e && e.stack ? e.stack : e));
    ui.alert('エラー: ' + e);
  } finally {
    try { lock.releaseLock(); } catch (re) {}
  }
}

// (ヘッダーマッチングは不要: eBay File Exchange形式でフラット書き込みに変更)

/**
 * AI抽出結果をeBay File Exchange形式で書き込む
 * 各データ行のN列(14)以降に「C:フィールド名 | 値 | C:フィールド名 | 値 ...」と横並びで書く
 * @param {Sheet} sheet
 * @param {Array} rowResults - [{row: number, data: {field: value, ...}}]
 */
function writeItemSpecificsToSheet_(sheet, rowResults) {
  try {
    if (!sheet || !rowResults || rowResults.length === 0) {
      return;
    }
    var startCol = 14; // N列

    for (var i = 0; i < rowResults.length; i++) {
      var item = rowResults[i] || {};
      var row = item.row;
      var data = item.data || item.specifics || item.values || {};
      if (!row || !data) {
        continue;
      }

      // 時計専用の後処理（Display推論 + Case Materialデフォルト）
      if (data.hasOwnProperty('Movement') || data.hasOwnProperty('Display')) {
        // タイトルと説明文をシートから取得して判定に使う
        var wtTitle = getValue_(sheet, row, 7) || '';  // G列: タイトル
        var wtDesc = getValue_(sheet, row, 12) || '';   // L列: 説明文
        var wtText = (wtTitle + ' ' + wtDesc).toLowerCase();

        // Display補正
        var dispVal = data['Display'] || '';
        if (!dispVal || dispVal === 'Does not apply') {
          if (wtText.indexOf('digital') !== -1 && wtText.indexOf('analog') !== -1) {
            data['Display'] = 'Analog & Digital';
          } else if (wtText.indexOf('digital') !== -1 || wtText.indexOf('g-shock') !== -1 || wtText.indexOf('g shock') !== -1) {
            data['Display'] = 'Digital';
          } else {
            data['Display'] = 'Analog';
          }
        }
        // Case Material補正: Stainless Steelがデフォルト、Titaniumのみ例外許可
        var cmVal = data['Case Material'] || '';
        if (!cmVal || cmVal === 'Does not apply') {
          if (wtText.indexOf('titanium') !== -1) {
            data['Case Material'] = 'Titanium';
          } else {
            data['Case Material'] = 'Stainless Steel';
          }
        } else {
          var cmLower = cmVal.toLowerCase();
          if (cmLower !== 'stainless steel' && cmLower !== 'titanium') {
            data['Case Material'] = 'Stainless Steel';
          }
        }
      }

      // ジュエリー用の Metal 後処理（証拠ベース判定）
      if (data.hasOwnProperty('Metal') && data.hasOwnProperty('Metal Purity')) {
        var jTitle = getValue_(sheet, row, 7) || '';
        var jDesc = getValue_(sheet, row, 12) || '';
        var jText = (jTitle + ' ' + jDesc);
        var jTextLower = jText.toLowerCase();

        // Step 1: 素材の物理的証拠をチェック（最優先）
        var hasSilverEvidence = /\b(925|sv925|ag925|sterling\s*silver|sterling)\b/i.test(jText);
        var hasGoldEvidence = /\b([Kk](?:9|10|14|18|22|24)|(?:9|10|14|18|22|24)[Kk]|750|585|375|999|916|18金|14金|10金|22金|24金|9金)\b/i.test(jText);
        var hasPlatinumEvidence = /\b(pt(?:900|950|850)?|platinum)\b/i.test(jText);

        if (hasSilverEvidence) {
          // 925/Sterling の証拠あり → Sterling Silver 確定
          data['Metal'] = 'Sterling Silver';
          data['Metal Purity'] = '925';
          // 混合素材（925 + Gold）の場合、Silverを主素材とする
        } else if (hasGoldEvidence) {
          // Gold の証拠あり → Gold 確定（purityはStep1の値を維持）
          var metalVal = (data['Metal'] || '').toLowerCase();
          if (metalVal.indexOf('gold') === -1) {
            data['Metal'] = 'Yellow Gold';
          }
          // Metal Purity が空なら証拠から推定
          if (!data['Metal Purity'] || data['Metal Purity'] === 'Does not apply') {
            if (/\b([Kk]18|18[Kk]|750)\b/.test(jText)) data['Metal Purity'] = '18k';
            else if (/\b([Kk]14|14[Kk]|585)\b/.test(jText)) data['Metal Purity'] = '14k';
            else if (/\b([Kk]10|10[Kk])\b/.test(jText)) data['Metal Purity'] = '10k';
            else if (/\b([Kk]24|24[Kk]|999)\b/.test(jText)) data['Metal Purity'] = '24k';
            else if (/\b([Kk]22|22[Kk]|916)\b/.test(jText)) data['Metal Purity'] = '22k';
            else if (/\b([Kk]9|9[Kk]|375)\b/.test(jText)) data['Metal Purity'] = '9k';
          }
        } else if (hasPlatinumEvidence) {
          data['Metal'] = 'Platinum';
          // Purity は Step1 の値を維持
        } else {
          // 素材証拠なし → tone/plated チェック（フォールバック）
          var isTonePlated = (jTextLower.indexOf('gold tone') !== -1 || jTextLower.indexOf('gold-tone') !== -1 ||
                             jTextLower.indexOf('gold plated') !== -1 || jTextLower.indexOf('gold color') !== -1 ||
                             jTextLower.indexOf('silver tone') !== -1 || jTextLower.indexOf('silver-tone') !== -1 ||
                             jTextLower.indexOf('silver plated') !== -1 || jTextLower.indexOf('silver color') !== -1 ||
                             jTextLower.indexOf('goldtone') !== -1 || jTextLower.indexOf('silvertone') !== -1);

          if (isTonePlated) {
            data['Metal'] = 'Base Metal';
            data['Metal Purity'] = 'Does not apply';
          } else {
            // Gold系: K表記なしの場合のみBase Metalに降格
            // Silver系: tone/platedがなければ降格しない（Silverと書いてtoneでなければ実銀の可能性が高い）
            var metalValFb = (data['Metal'] || '').toLowerCase();
            if (metalValFb === 'gold' || metalValFb === 'yellow gold' || metalValFb === 'rose gold' || metalValFb === 'white gold') {
              data['Metal'] = 'Base Metal';
              data['Metal Purity'] = 'Does not apply';
            }
            // Silver系はそのまま維持（tone/platedチェック済みで該当しなかったため）
          }
        }
      }

      // カメラ用の後処理（Maximum Resolution正規化）
      if (data.hasOwnProperty('Maximum Resolution')) {
        var maxRes = String(data['Maximum Resolution'] || '');
        if (maxRes && maxRes !== 'Does not apply') {
          // 数字だけ抽出して "XX.X MP" 形式に正規化
          var mpMatch = maxRes.match(/([\d.]+)\s*(?:MP|Megapixel|メガピクセル|万画素)/i);
          if (mpMatch) {
            var mpVal = parseFloat(mpMatch[1]);
            // 万画素の場合は100で割ってMPに変換（2000万画素 → 20.0 MP）
            if (/万画素/.test(maxRes)) {
              mpVal = mpVal / 100;
            }
            data['Maximum Resolution'] = mpVal.toFixed(1) + ' MP';
          } else {
            // 数字のみの場合（例: "24.2"）
            var numOnly = maxRes.match(/^([\d.]+)$/);
            if (numOnly) {
              data['Maximum Resolution'] = parseFloat(numOnly[1]).toFixed(1) + ' MP';
            }
          }
        }
      }

      // カメラ用 Battery Type 後処理: デフォルトはLithium-Ion、単三系のみ例外
      if (data.hasOwnProperty('Battery Type')) {
        var btVal = String(data['Battery Type'] || '').toLowerCase();
        if (!btVal || btVal === 'does not apply' || btVal === 'na' || btVal === 'n/a') {
          // バッテリー情報なし → デジタルカメラの大半はLithium-Ion
          data['Battery Type'] = 'Lithium-Ion';
        } else if (/単三|単3|aa[^a]/i.test(btVal) || btVal === 'aa') {
          data['Battery Type'] = 'AA';
        } else if (/単四|単4|aaa/i.test(btVal)) {
          data['Battery Type'] = 'AAA';
        } else if (/cr123/i.test(btVal)) {
          data['Battery Type'] = 'CR123A';
        } else if (/cr2[^0-9]/i.test(btVal) || /^cr2$/i.test(btVal)) {
          data['Battery Type'] = 'CR2';
        } else if (/リチウムイオン|lithium.ion|li.ion/i.test(btVal)) {
          data['Battery Type'] = 'Lithium-Ion';
        } else if (/ボタン|button|lr44|sr44/i.test(btVal)) {
          data['Battery Type'] = 'Button Cell (LR44/SR44)';
        } else if (/不要|not.applicable|mechanical/i.test(btVal)) {
          data['Battery Type'] = 'Not Applicable';
        } else if (/内蔵|built.in/i.test(btVal)) {
          data['Battery Type'] = 'Built-in';
        } else {
          // その他不明 → デフォルトLithium-Ion
          data['Battery Type'] = 'Lithium-Ion';
        }
      }

      // Trading Cards: Language/Countryの自動注入はresolveFieldValue_のデフォルト値に委譲

      // JSON → フラット配列変換: {"Brand": "Seiko"} → ["C:Brand", "Seiko"]
      var flat = jsonToFlatArray_(data);
      if (flat.length === 0) {
        continue;
      }

      // 行のN列以降にフラット配列を書き込む
      var writeRange = sheet.getRange(row, startCol, 1, flat.length);
      writeRange.setValues([flat]);
    }
  } catch (e) {
    Logger.log('[writeItemSpecificsToSheet_] error: ' + (e && e.stack ? e.stack : e));
    // エラーをユーザーにも見せる
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast('書き込みエラー: ' + (e && e.message ? e.message : e), 'Item Specifics', 10);
    } catch (te) {}
  }
}

/**
 * JSONオブジェクトをフラット配列に変換
 * {"Brand": "Seiko", "Type": "Wrist Watch"} → ["Brand", "Seiko", "Type", "Wrist Watch"]
 * @param {Object} data
 * @return {Array<string>}
 */
function jsonToFlatArray_(data) {
  var result = [];
  if (!data || typeof data !== 'object') {
    return result;
  }
  var keys = Object.keys(data);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var val = data[key];
    // null/undefinedのみスキップ（"Does not apply" は出力）
    if (val === null || val === undefined) {
      continue;
    }
    result.push(key);
    result.push(String(val));
  }
  return result;
}

// (ヘッダー自動追加は不要: フラット配列を直接書き込むため)

// =============================
// 公開: 辞書初期化 (確認付き)
// =============================
function initializeDictionaryWithConfirm() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    '辞書を初期化',
    '辞書シートに12カテゴリの初期データを投入します。\n既存データは上書きされます。続行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (result === ui.Button.YES) {
    try {
      if (typeof initializeDictionary === 'function') {
        initializeDictionary();
        ui.alert('辞書を初期化しました。');
      } else {
        ui.alert('initializeDictionary 関数が見つかりません。Dictionary.gs を確認してください。');
      }
    } catch (e) {
      Logger.log('[initializeDictionaryWithConfirm] error: ' + (e && e.stack ? e.stack : e));
      ui.alert('辞書の初期化に失敗しました: ' + e);
    }
  }
}

// =============================
// 非公開: 実行前検証
// - APIキー
// - アクティブシート名
// =============================
function validateSetup_() {
  var res = { ok: true, message: '' };
  try {
    var settings = getActiveISSettings_();
    var ui = SpreadsheetApp.getUi();

    // APIキー (DocumentProperties or settings)
    var props = PropertiesService.getDocumentProperties();
    var apiKey = null;
    try { apiKey = props.getProperty('OPENAI_API_KEY'); } catch (e1) {}
    if (!apiKey && settings && settings.apiKey) { apiKey = settings.apiKey; }

    if (!apiKey) {
      res.ok = false;
      res.message = 'OpenAI APIキーが未設定です。設定画面でAPIキーを設定してください。';
      return res;
    }

    // アクティブシート名
    var targetSheetName = settings.targetSheetName || '出品2';
    var sheet = SpreadsheetApp.getActiveSheet();
    if (!sheet || sheet.getName() !== targetSheetName) {
      res.ok = false;
      res.message = 'アクティブシートが "' + targetSheetName + '" ではありません。';
      return res;
    }
  } catch (e) {
    res.ok = false;
    res.message = '検証中にエラーが発生: ' + e;
  }
  return res;
}

// =============================
// 非公開: 便利関数群
// =============================
function getActiveISSettings_() {
  var settings = {};
  try {
    if (typeof getISSettings === 'function') {
      var s = getISSettings();
      if (s && typeof s === 'object') {
        settings = s;
      }
    }
  } catch (e) {
    Logger.log('[getActiveISSettings_] error: ' + e);
  }
  // Config_IS.gs のキー名でデフォルト補完
  if (!settings.SHEET_NAME) { settings.SHEET_NAME = '出品2'; }
  if (!settings.DATA_START_ROW) { settings.DATA_START_ROW = 3; }
  // 互換エイリアス
  settings.targetSheetName = settings.SHEET_NAME;
  settings.dataStartRow = settings.DATA_START_ROW;
  settings.apiKey = settings.OPENAI_API_KEY || '';
  return settings;
}

function acquireLock_(lock) {
  try {
    lock.tryLock(30000); // 30秒待機
    return true;
  } catch (e) {
    SpreadsheetApp.getActiveSpreadsheet().toast('別の処理が実行中です。しばらく待って再実行してください。', 'Item Specifics', 5);
    return false;
  }
}

function getValue_(sheet, row, col) {
  try {
    return sheet.getRange(row, col).getValue();
  } catch (e) {
    return '';
  }
}

/**
 * N列以降に既に書き込まれたItem Specificsを読み取る
 * フラット配列形式（key, value, key, value...）をオブジェクトに変換
 * @param {Sheet} sheet
 * @param {number} row
 * @return {Object} - {fieldName: value, ...}
 */
function readExistingSpecifics_(sheet, row) {
  var result = {};
  try {
    var startCol = 14; // N列
    var lastCol = sheet.getLastColumn();
    if (lastCol < startCol) return result;

    var numCols = lastCol - startCol + 1;
    var values = sheet.getRange(row, startCol, 1, numCols).getValues()[0];

    // フラット配列: [key, value, key, value, ...]
    for (var i = 0; i < values.length - 1; i += 2) {
      var key = values[i];
      var val = values[i + 1];
      if (key && String(key).trim() !== '') {
        result[String(key).trim()] = String(val || '').trim();
      }
    }
  } catch (e) {
    Logger.log('[readExistingSpecifics_] error row ' + row + ': ' + e);
  }
  return result;
}

// =============================
// 非公開: バッチ抽出実行（簡易リトライ対応）
// requests: [{row, tag, title, description, category, fields}]
// return: [{row, data: {field: value}}]
// =============================
function runExtractionBatchWithRetry_(requests, settings, retryMax) {
  var attempts = 0;
  var toastTitle = 'Item Specifics';
  var results = [];
  var remaining = requests.slice(0);
  var chunkSize = (settings && settings.batchSize) ? settings.batchSize : 20;

  while (remaining.length > 0 && attempts <= retryMax) {
    var nextRemaining = [];
    var processed = 0;
    var idx = 0;
    while (idx < remaining.length) {
      var chunk = remaining.slice(idx, idx + chunkSize);
      idx += chunk.length;

      try {
        var batchRes = null;
        if (typeof extractItemSpecificsBatch === 'function') {
          batchRes = extractItemSpecificsBatch(chunk, settings);
        } else if (typeof extractItemSpecifics === 'function') {
          // フォールバック: 逐次処理
          batchRes = [];
          for (var i = 0; i < chunk.length; i++) {
            try {
              var single = extractItemSpecifics(chunk[i], settings);
              batchRes.push(single);
            } catch (se) {
              Logger.log('[runExtractionBatchWithRetry_] single extract error: ' + se);
              batchRes.push(null);
            }
          }
        } else {
          Logger.log('[runExtractionBatchWithRetry_] 抽出関数が見つかりません');
          batchRes = [];
        }

        // バッチ結果の整形
        var normalized = normalizeBatchResults_(chunk, batchRes);
        for (var j = 0; j < normalized.completed.length; j++) {
          results.push(normalized.completed[j]);
          processed++;
        }
        for (var k = 0; k < normalized.failed.length; k++) {
          nextRemaining.push(normalized.failed[k]);
        }
      } catch (e) {
        Logger.log('[runExtractionBatchWithRetry_] batch error: ' + (e && e.stack ? e.stack : e));
        // 失敗したチャンクは次回再試行
        for (var m = 0; m < chunk.length; m++) {
          nextRemaining.push(chunk[m]);
        }
      }

      if (processed > 0) {
        SpreadsheetApp.getActiveSpreadsheet().toast('処理中... ' + processed + ' 件完了 / ' + requests.length + ' 件', toastTitle, 5);
      }
    }

    if (nextRemaining.length === 0) {
      break; // 全件成功
    }

    attempts++;
    if (attempts <= retryMax) {
      SpreadsheetApp.getActiveSpreadsheet().toast('一部失敗のため再試行中... 残り ' + nextRemaining.length + ' 件 (試行 ' + attempts + '/' + retryMax + ')', toastTitle, 5);
    }
    remaining = nextRemaining;
  }

  if (remaining.length > 0) {
    Logger.log('[runExtractionBatchWithRetry_] 最終的に失敗した件数: ' + remaining.length);
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'AI抽出: ' + results.length + '件成功, ' + remaining.length + '件失敗（実行ログを確認してください）',
        'Item Specifics', 10
      );
    } catch (te) {}
  }
  return results;
}

// =============================
// 非公開: バッチ結果の正規化
// 入力chunk順に [{row, data:{}} or null or {row, specifics:{}}] を整形
// =============================
function normalizeBatchResults_(chunk, batchRes) {
  var completed = [];
  var failed = [];
  try {
    if (!batchRes || batchRes.length === undefined) {
      // 想定外の戻り値、全件失敗として再試行
      for (var i = 0; i < chunk.length; i++) {
        failed.push(chunk[i]);
      }
      return { completed: completed, failed: failed };
    }

    var i;
    for (i = 0; i < chunk.length; i++) {
      var req = chunk[i];
      var res = batchRes[i];

      if (!res) {
        failed.push(req);
        continue;
      }

      // エラー応答をログに記録
      if (res.success === false && res.error) {
        Logger.log('[normalizeBatchResults_] row ' + (res.row || req.row) + ' error: ' + res.error);
      }

      // 可能なキーに対応
      var row = res.row || req.row;
      var data = res.data || res.specifics || res.values || res.result || null;
      if (!row || !data) {
        failed.push(req);
        continue;
      }

      completed.push({ row: row, data: data });
    }
  } catch (e) {
    Logger.log('[normalizeBatchResults_] error: ' + (e && e.stack ? e.stack : e));
    // 例外時は全件再試行
    for (var j = 0; j < chunk.length; j++) { failed.push(chunk[j]); }
  }
  return { completed: completed, failed: failed };
}

// 設定ダイアログのフォールバックは削除（Config_IS.gs での実装に依存）
/**
 * デバッグ用: DocumentPropertiesからAPIキー関連の値を確認する
 * GASエディタから手動で実行して結果を確認する
 */
// デバッグ用APIキー確認機能は廃止
