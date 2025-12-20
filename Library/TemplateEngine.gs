/******************************************************
 * TemplateEngine.gs - テンプレートエンジン
 *
 * GASのHtmlTemplateの代替として、文字列置換でテンプレート変数を処理
 ******************************************************/

/**
 * テンプレート変数を展開してHtmlOutputを生成
 * @param {string} templateName - テンプレート名
 * @param {Object} data - テンプレート変数のデータ
 * @return {HtmlOutput}
 */
function evaluateTemplate(templateName, data) {
  var html = HTML_TEMPLATES[templateName];
  if (!html) {
    throw new Error('Template not found: ' + templateName);
  }

  // テンプレート変数を展開
  var evaluated = processTemplateVariables(html, data);

  return HtmlService.createHtmlOutput(evaluated);
}

/**
 * テンプレート変数を処理
 * <?= expression ?> 形式の変数を展開
 * <? for ... ?> 形式のループも処理
 * @param {string} html - HTMLテンプレート
 * @param {Object} data - データオブジェクト
 * @return {string}
 */
function processTemplateVariables(html, data) {
  // まずforループを処理（<?  for ... ?> ... <? } ?>）
  html = processForLoops(html, data);

  // 次に単純な変数展開（<?= ... ?>）
  html = processSimpleVariables(html, data);

  return html;
}

/**
 * forループを処理
 * @param {string} html
 * @param {Object} data
 * @return {string}
 */
function processForLoops(html, data) {
  // まずObject.keys().forEach パターンを処理
  // パターン: <? Object.keys(obj).forEach(function(key) { ?> ... <? }); ?>
  var forEachPattern = /<\?\s*Object\.keys\((\w+)\)\.forEach\(function\((\w+)\)\s*\{\s*\?>([\s\S]*?)<\?\s*\}\);\s*\?>/g;

  html = html.replace(forEachPattern, function(match, objName, keyVar, body) {
    var result = '';
    var obj = data[objName];

    if (obj && typeof obj === 'object') {
      var keys = Object.keys(obj);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        // ループ変数を一時的にデータに追加
        var loopData = {};
        for (var k in data) {
          loopData[k] = data[k];
        }
        loopData[keyVar] = key;

        // ボディ内の変数を展開
        var expandedBody = processSimpleVariables(body, loopData);
        result += expandedBody;
      }
    }

    return result;
  });

  // 次に通常のforループを処理
  // パターン: <? for (var i = 0; i < array.length; i++) { ?> ... <? } ?>
  var forPattern = /<\?\s*for\s*\(\s*var\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+(?:\.\w+)*)\s*;\s*\1\+\+\s*\)\s*\{\s*\?>([\s\S]*?)<\?\s*\}\s*\?>/g;

  html = html.replace(forPattern, function(match, varName, startVal, lengthExpr, body) {
    var result = '';
    var arr = getNestedValue(data, lengthExpr.replace('.length', ''));

    if (Array.isArray(arr)) {
      for (var i = parseInt(startVal); i < arr.length; i++) {
        // ループ変数を一時的にデータに追加
        var loopData = {};
        for (var k in data) {
          loopData[k] = data[k];
        }
        loopData[varName] = i;

        // ボディ内の変数を展開
        var expandedBody = processSimpleVariables(body, loopData);
        result += expandedBody;
      }
    }

    return result;
  });

  return html;
}

/**
 * 単純な変数展開を処理
 * @param {string} html
 * @param {Object} data
 * @return {string}
 */
function processSimpleVariables(html, data) {
  // パターン: <?= expression ?>
  var varPattern = /<\?=\s*([\s\S]*?)\s*\?>/g;

  return html.replace(varPattern, function(match, expression) {
    try {
      var result = evaluateExpression(expression, data);
      return result !== undefined && result !== null ? String(result) : '';
    } catch (e) {
      console.log('Template expression error: ' + expression + ' - ' + e.message);
      return '';
    }
  });
}

/**
 * 式を評価
 * @param {string} expr - 式
 * @param {Object} data - データ
 * @return {*}
 */
function evaluateExpression(expr, data) {
  expr = expr.trim();

  // 三項演算子を処理: condition ? 'value1' : 'value2'
  var ternaryMatch = expr.match(/^(.+?)\s*\?\s*['"]([^'"]*)['"]\s*:\s*['"]([^'"]*)['"]\s*$/);
  if (ternaryMatch) {
    var condition = ternaryMatch[1].trim();
    var trueVal = ternaryMatch[2];
    var falseVal = ternaryMatch[3];

    var condResult = evaluateCondition(condition, data);
    return condResult ? trueVal : falseVal;
  }

  // 括弧付き三項演算子: (condition) ? 'value1' : 'value2'
  var parenTernaryMatch = expr.match(/^\((.+?)\)\s*\?\s*['"]([^'"]*)['"]\s*:\s*['"]([^'"]*)['"]\s*$/);
  if (parenTernaryMatch) {
    var condition = parenTernaryMatch[1].trim();
    var trueVal = parenTernaryMatch[2];
    var falseVal = parenTernaryMatch[3];

    var condResult = evaluateCondition(condition, data);
    return condResult ? trueVal : falseVal;
  }

  // || を使ったデフォルト値: value || 'default'
  var orMatch = expr.match(/^(.+?)\s*\|\|\s*['"]([^'"]*)['"]\s*$/);
  if (orMatch) {
    var value = getNestedValue(data, orMatch[1].trim());
    return value || orMatch[2];
  }

  // 配列アクセス: array[i]
  var arrayMatch = expr.match(/^(\w+)\[(\w+)\]$/);
  if (arrayMatch) {
    var arr = data[arrayMatch[1]];
    var idx = data[arrayMatch[2]];
    if (Array.isArray(arr) && idx !== undefined) {
      return arr[idx];
    }
  }

  // 配列アクセス + プロパティ: array[i].property
  var arrayPropMatch = expr.match(/^(\w+)\[(\w+)\]\.(\w+)$/);
  if (arrayPropMatch) {
    var arr = data[arrayPropMatch[1]];
    var idx = data[arrayPropMatch[2]];
    var prop = arrayPropMatch[3];
    if (arr && idx !== undefined && arr[idx]) {
      return arr[idx][prop];
    }
  }

  // オブジェクトの動的プロパティアクセス: obj[key] (keyはデータから取得)
  var objAccessMatch = expr.match(/^(\w+)\[(\w+)\]$/);
  if (objAccessMatch) {
    var obj = data[objAccessMatch[1]];
    var key = data[objAccessMatch[2]];
    if (obj && key !== undefined) {
      return obj[key];
    }
  }

  // 単純な変数参照
  return getNestedValue(data, expr);
}

/**
 * 条件式を評価
 * @param {string} condition
 * @param {Object} data
 * @return {boolean}
 */
function evaluateCondition(condition, data) {
  // === 比較
  var eqMatch = condition.match(/^(.+?)\s*===\s*['"]([^'"]*)['"]\s*$/);
  if (eqMatch) {
    var left = getNestedValue(data, eqMatch[1].trim());
    var right = eqMatch[2];
    return left === right;
  }

  // !== 比較
  var neqMatch = condition.match(/^(.+?)\s*!==\s*['"]([^'"]*)['"]\s*$/);
  if (neqMatch) {
    var left = getNestedValue(data, neqMatch[1].trim());
    var right = neqMatch[2];
    return left !== right;
  }

  // ! 否定
  if (condition.startsWith('!')) {
    var val = getNestedValue(data, condition.substring(1).trim());
    return !val;
  }

  // || 論理OR
  if (condition.indexOf('||') !== -1) {
    var parts = condition.split('||');
    for (var i = 0; i < parts.length; i++) {
      if (evaluateCondition(parts[i].trim(), data)) {
        return true;
      }
    }
    return false;
  }

  // && 論理AND
  if (condition.indexOf('&&') !== -1) {
    var parts = condition.split('&&');
    for (var i = 0; i < parts.length; i++) {
      if (!evaluateCondition(parts[i].trim(), data)) {
        return false;
      }
    }
    return true;
  }

  // 単純なtruthy判定
  var val = getNestedValue(data, condition);
  return !!val;
}

/**
 * ネストされたプロパティを取得
 * @param {Object} obj
 * @param {string} path - 'a.b.c' 形式
 * @return {*}
 */
function getNestedValue(obj, path) {
  if (!path || !obj) return undefined;

  var parts = path.split('.');
  var current = obj;

  for (var i = 0; i < parts.length; i++) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[parts[i]];
  }

  return current;
}
