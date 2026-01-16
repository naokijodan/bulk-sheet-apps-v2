/******************************************************
 * Assistant.gs - アシスタント機能
 *
 * セル診断・ヘルプ・フィードバック機能を提供
 * Main.gsの既存ラッパー関数を経由して呼び出される
 ******************************************************/

/**
 * アシスタントリクエストのディスパッチャー
 * savePromptContent/getPromptContent から呼び出される
 *
 * @param {Object} request - リクエストオブジェクト
 * @param {string} request.action - アクション名
 * @param {Object} request.data - アクションに渡すデータ
 * @return {Object} レスポンス
 */
function assistantDispatch_(request) {
  try {
    if (!request || !request.action) {
      throw new Error('Invalid request: action is required');
    }

    // 許可されたアクションのホワイトリスト
    var ALLOWED_ACTIONS = [
      'ANALYZE_CELL',
      'GET_COLUMN_INFO',
      'GET_ASSISTANT_CONFIG',
      'SUBMIT_FEEDBACK',
      'GET_FAQ_LIST',
      'GET_SELECTED_CELL_INFO'
    ];

    if (ALLOWED_ACTIONS.indexOf(request.action) === -1) {
      throw new Error('Unauthorized action: ' + request.action);
    }

    // アクションの振り分け
    switch (request.action) {
      case 'GET_SELECTED_CELL_INFO':
        return assistantGetSelectedCellInfo_();

      case 'ANALYZE_CELL':
        return assistantAnalyzeCell_(request.data);

      case 'GET_COLUMN_INFO':
        return assistantGetColumnInfo_(request.data);

      case 'GET_ASSISTANT_CONFIG':
        return assistantGetConfig_();

      case 'SUBMIT_FEEDBACK':
        return assistantSubmitFeedback_(request.data);

      case 'GET_FAQ_LIST':
        return assistantGetFaqList_();

      default:
        throw new Error('Action not implemented: ' + request.action);
    }
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 選択中のセル情報を取得
 */
function assistantGetSelectedCellInfo_() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var cell = sheet.getActiveCell();
    var row = cell.getRow();
    var col = cell.getColumn();
    var value = cell.getValue();
    var formula = cell.getFormula();

    // ヘッダー行（1行目）から列名を取得
    var headerValue = '';
    if (row > 1) {
      headerValue = sheet.getRange(1, col).getValue() || '';
    }

    // 2行目（サブヘッダー）があれば取得
    var subHeaderValue = '';
    if (row > 2) {
      subHeaderValue = sheet.getRange(2, col).getValue() || '';
    }

    // エラーチェック
    var hasError = false;
    var errorType = '';

    // 数式エラーをチェック
    if (formula) {
      try {
        var displayValue = cell.getDisplayValue();
        if (displayValue.indexOf('#') === 0) {
          hasError = true;
          errorType = displayValue;
        }
      } catch (e) {
        hasError = true;
        errorType = 'FORMULA_ERROR';
      }
    }

    return {
      success: true,
      data: {
        sheetName: sheet.getName(),
        row: row,
        col: col,
        colLetter: columnToLetter_(col),
        value: value,
        displayValue: cell.getDisplayValue(),
        formula: formula,
        headerName: headerValue.toString(),
        subHeaderName: subHeaderValue.toString(),
        hasError: hasError,
        errorType: errorType,
        dataType: typeof value
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * セルを診断してAIに問い合わせ
 */
function assistantAnalyzeCell_(data) {
  try {
    // セル情報を取得
    var cellInfo = assistantGetSelectedCellInfo_();
    if (!cellInfo.success) {
      return cellInfo;
    }

    var info = cellInfo.data;

    // AIに問い合わせるプロンプトを構築
    var prompt = buildDiagnosticPrompt_(info);

    // 既存のAI機能を使って問い合わせ
    var settings = getSettings();
    var aiResponse = '';

    if (settings.openaiApiKey) {
      aiResponse = callOpenAIForDiagnosis_(prompt, settings.openaiApiKey);
    } else if (settings.claudeApiKey) {
      aiResponse = callClaudeForDiagnosis_(prompt, settings.claudeApiKey);
    } else if (settings.geminiApiKey) {
      aiResponse = callGeminiForDiagnosis_(prompt, settings.geminiApiKey);
    } else {
      // APIキーがない場合は簡易診断
      aiResponse = performLocalDiagnosis_(info);
    }

    return {
      success: true,
      data: {
        cellInfo: info,
        diagnosis: aiResponse
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 診断用プロンプトを構築
 */
function buildDiagnosticPrompt_(info) {
  var prompt = '以下のスプレッドシートのセルについて、問題点があれば指摘し、修正案を提示してください。\n\n';
  prompt += '【セル情報】\n';
  prompt += '- シート名: ' + info.sheetName + '\n';
  prompt += '- 位置: ' + info.colLetter + info.row + '\n';
  prompt += '- 列名: ' + (info.headerName || '(なし)') + '\n';
  prompt += '- 値: ' + info.displayValue + '\n';

  if (info.formula) {
    prompt += '- 数式: ' + info.formula + '\n';
  }

  if (info.hasError) {
    prompt += '- エラー: ' + info.errorType + '\n';
  }

  prompt += '\n短く簡潔に回答してください（3-5行程度）。';

  return prompt;
}

/**
 * APIキーがない場合のローカル診断
 */
function performLocalDiagnosis_(info) {
  var issues = [];

  // エラーチェック
  if (info.hasError) {
    issues.push('エラーが検出されました: ' + info.errorType);
  }

  // 空欄チェック
  if (info.value === '' || info.value === null) {
    issues.push('セルが空欄です。');
  }

  // 数値が期待される列での文字列チェック
  var numericColumns = ['価格', '仕入', '送料', '利益', '重量', 'サイズ'];
  var isNumericColumn = numericColumns.some(function(keyword) {
    return info.headerName.indexOf(keyword) !== -1;
  });

  if (isNumericColumn && typeof info.value === 'string' && info.value !== '') {
    issues.push('この列には数値を入力してください。現在の値は文字列です。');
  }

  if (issues.length === 0) {
    return '問題は検出されませんでした。';
  }

  return issues.join('\n');
}

/**
 * 列情報を取得
 */
function assistantGetColumnInfo_(data) {
  try {
    var cellInfo = assistantGetSelectedCellInfo_();
    if (!cellInfo.success) {
      return cellInfo;
    }

    var info = cellInfo.data;

    // 列の説明を生成
    var description = getColumnDescription_(info.headerName);

    return {
      success: true,
      data: {
        headerName: info.headerName,
        subHeaderName: info.subHeaderName,
        description: description
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 列名から説明を取得
 */
function getColumnDescription_(headerName) {
  var descriptions = {
    '商品名': '商品のタイトルを入力します。eBayで表示される商品名になります。',
    'タイトル': '商品のタイトルを入力します。eBayで表示される商品名になります。',
    '仕入価格': '商品を仕入れた金額を入力します（数値のみ、円マーク不要）。',
    '仕入れ価格': '商品を仕入れた金額を入力します（数値のみ、円マーク不要）。',
    '販売価格': 'eBayでの販売価格を入力します（ドル）。',
    '送料': '送料を入力します。',
    '利益': '自動計算されます。販売価格 - 仕入価格 - 手数料 - 送料',
    '利益率': '自動計算されます。利益 / 販売価格 × 100',
    '重量': '商品の重量を入力します（グラム単位推奨）。',
    'サイズ': '商品のサイズを入力します。',
    'Condition': '商品のコンディションを選択します（New, Used等）。',
    'カテゴリ': 'eBayのカテゴリを選択または入力します。'
  };

  // 完全一致
  if (descriptions[headerName]) {
    return descriptions[headerName];
  }

  // 部分一致
  for (var key in descriptions) {
    if (headerName.indexOf(key) !== -1) {
      return descriptions[key];
    }
  }

  return 'この列の詳細説明は登録されていません。';
}

/**
 * アシスタント設定を取得
 */
function assistantGetConfig_() {
  try {
    var settings = getSettings();
    return {
      success: true,
      data: {
        hasOpenAI: !!settings.openaiApiKey,
        hasClaude: !!settings.claudeApiKey,
        hasGemini: !!settings.geminiApiKey,
        hasAnyAI: !!(settings.openaiApiKey || settings.claudeApiKey || settings.geminiApiKey)
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * フィードバックを送信
 */
function assistantSubmitFeedback_(data) {
  try {
    if (!data || !data.type || !data.message) {
      throw new Error('フィードバックの種類とメッセージは必須です');
    }

    // フィードバックをログに記録
    var props = PropertiesService.getDocumentProperties();
    var feedbackLog = props.getProperty('FEEDBACK_LOG') || '[]';
    var logs = JSON.parse(feedbackLog);

    logs.push({
      timestamp: new Date().toISOString(),
      type: data.type,
      message: data.message,
      cellInfo: data.cellInfo || null
    });

    // 最新50件のみ保持
    if (logs.length > 50) {
      logs = logs.slice(-50);
    }

    props.setProperty('FEEDBACK_LOG', JSON.stringify(logs));

    // オプション: メール送信やスプレッドシートへの記録も可能

    return {
      success: true,
      message: 'フィードバックを送信しました。ありがとうございます！'
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * FAQリストを取得
 */
function assistantGetFaqList_() {
  return {
    success: true,
    data: [
      {
        question: '価格計算の使い方は？',
        answer: 'メニューから「価格計算実行」を選択するか、行を選択して実行してください。'
      },
      {
        question: 'APIキーの設定方法は？',
        answer: 'メニュー → 初期設定 → API設定タブで各AIサービスのAPIキーを入力してください。'
      },
      {
        question: 'エラーが消えない時は？',
        answer: 'セルを選択して「診断」ボタンを押すと、問題点と修正案が表示されます。'
      },
      {
        question: 'EAGLEとの連携方法は？',
        answer: '初期設定のEAGLEタブでAPIトークンを設定し、データ取得を実行してください。'
      }
    ]
  };
}

/**
 * 列番号をアルファベットに変換
 */
function columnToLetter_(col) {
  var letter = '';
  while (col > 0) {
    var mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * OpenAI APIで診断
 */
function callOpenAIForDiagnosis_(prompt, apiKey) {
  try {
    var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたはスプレッドシートの問題を診断するアシスタントです。簡潔に回答してください。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300
      }),
      muteHttpExceptions: true
    });

    var json = JSON.parse(response.getContentText());
    if (json.choices && json.choices[0]) {
      return json.choices[0].message.content;
    }
    return 'AI応答の解析に失敗しました。';
  } catch (e) {
    return 'AI診断中にエラーが発生しました: ' + e.message;
  }
}

/**
 * Claude APIで診断
 */
function callClaudeForDiagnosis_(prompt, apiKey) {
  try {
    var response = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      payload: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
      muteHttpExceptions: true
    });

    var json = JSON.parse(response.getContentText());
    if (json.content && json.content[0]) {
      return json.content[0].text;
    }
    return 'AI応答の解析に失敗しました。';
  } catch (e) {
    return 'AI診断中にエラーが発生しました: ' + e.message;
  }
}

/**
 * Gemini APIで診断
 */
function callGeminiForDiagnosis_(prompt, apiKey) {
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey;
    var response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      muteHttpExceptions: true
    });

    var json = JSON.parse(response.getContentText());
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      return json.candidates[0].content.parts[0].text;
    }
    return 'AI応答の解析に失敗しました。';
  } catch (e) {
    return 'AI診断中にエラーが発生しました: ' + e.message;
  }
}
