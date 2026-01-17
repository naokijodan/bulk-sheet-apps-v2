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
 * 固定セル（1-2行目）の場合はセル説明を、データ行（3行目以降）の場合は列説明を返す
 * シート説明も併せて返す
 */
function assistantGetColumnInfo_(data) {
  try {
    var cellInfo = assistantGetSelectedCellInfo_();
    if (!cellInfo.success) {
      return cellInfo;
    }

    var info = cellInfo.data;
    var cellAddress = info.colLetter + info.row;

    // セル説明を取得（1-2行目の固定セルのみ）
    var cellDescription = null;
    if (info.row <= 2) {
      cellDescription = getCellDescription_(cellAddress);
    }

    // 列説明を取得（常に取得）
    var columnDescription = getColumnDescription_(info.headerName);

    // シート説明を取得（常に取得）
    var sheetDescription = getSheetDescription_(info.sheetName) || null;

    return {
      success: true,
      data: {
        // セル情報
        cellAddress: cellAddress,
        cellDescription: cellDescription,
        // 列情報
        headerName: info.headerName,
        columnDescription: columnDescription,
        // シート情報
        sheetName: info.sheetName,
        sheetDescription: sheetDescription,
        // 行番号（UIでの優先表示判定用）
        row: info.row
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
 * 作業シート専用の列説明
 */
function getColumnDescription_(headerName) {
  // 作業シートの列説明（A列〜AH列）
  var workSheetDescriptions = {
    // A列
    '日付': '入力日を記録します。',

    // B列
    '担当者': '担当者の名前（外注さんを使っている方用）。',

    // C列
    'label': '商品管理に使うSKU番号です。',

    // D列
    'タグ': '商品のカテゴリや任意の仕分けに使う名前。',

    // E列
    'テンプレートID': '手動設定可、または翻訳実行時に自動入力されます。商品の配送方法（X列）と状態（AE列）から判定されるため、それらの値が正しく入力されていることが前提となります。',

    // F列
    '参考ebayID': 'EAGLEに登録の際に必須の値です。詳しくはスクールの記事を参照してください。',

    // G列
    '仕入れ先': 'メルカリや楽天などの仕入れ先名。',

    // H列
    '仕入れ先コード': '仕入れ先商品の商品コード。',

    // I列
    '仕入れ価格': '仕入れ価格を入力します（数値のみ）。',

    // J列
    'title': '商品の日本語タイトル（英語の場合もあります）。',

    // K列
    '商品説明': '仕入れ商品のページに記載の商品説明。',

    // L列
    'セラーID': '仕入れ先のセラーのID。',

    // M列
    'Title': '日本語のタイトルと商品説明からAIによって生成されたeBay用の英語タイトル。',

    // N列
    'Condition/Description': '日本語のタイトルと商品説明からAIによって生成されたeBay用の商品説明、コンディション説明。',

    // O列
    'シッピングポリシー': '想定関税額（AD列）と配送方法（X列）と状態（AE列）から算出される固有のシッピングポリシーID。この3つの要素が正しく入っていないと算出できません。',

    // P列
    'タイトル文字数': '英語タイトルの文字数。80文字を超えるとアラートが出ます（eBayのタイトルは80文字が上限）。',

    // Q列
    '説明文の文字数': '英語の説明文の文字数。',

    // R列
    '販売価格': '各種設定値から算出される販売価格（DDU価格）。この価格がeBayの商品ページに登録されます。送料や手数料など全て含まれており、含まれていないのは関税額のみです。',

    // S列
    '関税込み価格': '販売価格と想定関税額を合計した価格。全て込みにした場合の参考価格です。',

    // T列
    '送料': 'テーブル計算の場合はサイズや重量および配送方法から算出。送料固定の設定の場合はJ1の値を反映。J1が空白の場合はProfit_Amountsシートから算出されます。',

    // U列
    '利益': '利益率設定の場合は販売価格から設定の利益率で算出。利益額設定の場合はH1の値、H1が空白の場合はProfit_Amountsシートから算出されます。',

    // V列
    '手数料率': 'F1の値を反映します。',

    // W列
    '利益率': '利益率設定の場合この値が利益率計算のもと（H2の値を反映）。利益額設定の場合は空白になります。',

    // X列
    '配送方法': '各配送方法を自動判定。仕入れ価格などから判定され、判定基準は初期設定値が反映されたAJ2、AJ3、AJ4、AJ5を基準に算出。固定金額でも算出されます。テンプレートとシッピングポリシーの判定に必須です。',

    // Y列
    '実重量': '商品の重量。J2の値を反映します。',

    // Z列
    '長さ': '商品の長さ。L2の値を反映します。',

    // AA列
    '幅': '商品の幅。M2の値を反映します。',

    // AB列
    '高さ': '商品の高さ。N2の値を反映します。',

    // AC列
    '容積重量': '長さ、幅、高さから算出される容積重量。クーリエとCpassエコノミーで算出方法が異なります。この値と実重量の大きい方が送料の算出基準となります。',

    // AD列
    '想定関税': '実際に徴収される関税および関税手数料に加えて、eBayが徴収する関税に関する手数料を加えた値。',

    // AE列
    '状態': 'P2の値を基本的に反映。P2がAIの場合は翻訳時に自動判定されます。テンプレートとシッピングポリシーの判定に必須です。',

    // AF列
    '基本送料': '各配送方法の基本送料。ここにサーチャージや手数料を加えた値がT列の送料となります。',

    // AG列
    'DDU調整後価格': 'シッピングポリシーで徴収する関税額の上限を超えた場合や、ゲームなど送料上限が決まっているジャンルで上限値を超えた関税額を販売額に上乗せした額。上限を超えた場合はこの価格が販売価格となります。',

    // AH列
    '実際の関税額': '実際の関税率から算出される関税額および関税手数料。この値がCpassから徴収されます。'
  };

  // 完全一致
  if (workSheetDescriptions[headerName]) {
    return workSheetDescriptions[headerName];
  }

  // 部分一致（列名が少し異なる場合に対応）
  for (var key in workSheetDescriptions) {
    if (headerName.indexOf(key) !== -1 || key.indexOf(headerName) !== -1) {
      return workSheetDescriptions[key];
    }
  }

  return 'この列の詳細説明は登録されていません。';
}

/**
 * セル番地から説明を取得
 * 作業シートの固定セル専用
 */
function getCellDescription_(cellAddress) {
  // 作業シートの固定セル説明
  var cellDescriptions = {
    'A2': '現在のリアルタイムの為替レート。',
    'C2': '実効為替レート。この値が計算に使われる。1日1回の更新。',
    'F1': '手数料率。ドロップダウンで選択可能。半角で入力必須。',
    'F2': '広告費率。ドロップダウンで選択可能。半角で入力必須。',
    'H1': '利益額。利益額設定の時にこの値を利用。空白で利益額設定の場合はProfit_Amountsシートから算出。',
    'H2': '利益率。ドロップダウンで選択可能。半角で入力必須。',
    'J1': '送料。送料固定計算の時にこの値を利用。空白で送料固定計算設定の場合はProfit_Amountsシートから算出。',
    'J2': '商品の梱包重量。',
    'K1': '価格計算ツールのリンク。',
    'L2': '梱包した商品の長さ。',
    'M2': '梱包した商品の幅。',
    'N2': '梱包した商品の高さ。',
    'O1': '商品の送料上限カテゴリー選択。ドロップダウンで設定。特定ジャンル（ゲーム、本など）は送料上限があるため必ず設定が必要。',
    'O2': '各テンプレートの名称を設定。ここで設定したものを元にテンプレートが判別される。ゲームやカードなど出品時は必ず切り替え。EAGLEに必要なテンプレートがないと正確に判別されない。',
    'P2': '商品の状態を選択。ドロップダウンで新品・中古・AIから選択。翻訳時に適用される。AI選択時は自動判定されるが精度は保証できず、出力されないことも多いため、手動で新品・中古を選択して翻訳することを推奨。',
    'R1': '配送方法（参考用）。ここで選択する配送方法はR2で計算する参考送料を算出するためのもので、実際の価格計算には影響しない。',
    'R2': '参考送料。シートの計算には影響しないが、参考の送料を算出できる。',
    'S2': '容積重量。商品サイズから算出。クーリエとCpassエコノミーで算出式が異なる。郵便では使用しない。',
    'V1': 'FedExの燃油サーチャージ。',
    'V2': 'DHLの燃油サーチャージ。',
    'W2': 'Cpass割。',
    'Y1': 'FedExの割増料金。',
    'Y2': 'DHLの割増料金。',
    'Z2': 'ペイオニアの手数料率。',
    'AA2': '実際の関税率。',
    'AB2': 'Cpassエコノミーの通関手数料。',
    'AC2': 'EU送料差額。最安値などを取りたい時に利用。詳しくはスクールに確認。',
    'AE1': '米国通関処理手数料。',
    'AE2': '米国VAT率。',
    'AF2': '調整関税率。実際の関税率にeBayが徴収する関税に関する手数料を掛け合わせたもの。',
    'AG2': '関税処理手数料。',
    'AH2': 'MPF。',
    'AJ2': '低価格配送方法。初期設定で設定すると反映されるが、ここで変更すればシートに反映。変更後は式の再出力ボタンを押す。',
    'AJ3': '高価格配送方法。初期設定で設定すると反映されるが、ここで変更すればシートに反映。変更後は式の再出力ボタンを押す。',
    'AJ4': '送料切り替え基準（円）。仕入れ価格をベースに配送方法を選択する基準価格。初期設定を反映するが、ここで変更した値がその場でシートに反映。',
    'AJ5': '送料計算方法。テーブル計算か送料固定かを選択。初期設定で反映されるが、ここで変更後、式の再出力ボタンを押すことで式が入れ替わる。',
    'AL2': '利益計算方法。利益の計算方法を選択。初期設定で反映されるが、ここで変更後、式の再出力ボタンを押すことで式が入れ替わる。',
    'AL3': '手数料率。',
    'AL4': '広告費率。',
    'AL5': '利益率。',
    'AN2': '重量。',
    'AN3': '長さ。',
    'AN4': '幅。',
    'AN5': '高さ。',
    'AP2': 'DDU調整の有効・無効の切り替え。常にONを推奨。',
    'AP3': '想定関税閾値。通常は390に設定。ゲームなど送料上限があるものは必ず切り替え（例：ゲームの場合は20）。',
    'AS2': '使用プロンプト選択。ドロップダウンで設定。デフォルトで各カテゴリごとのプロンプトがいくつか入っている。'
  };

  // 大文字に統一して検索
  var upperAddress = cellAddress.toUpperCase();

  if (cellDescriptions[upperAddress]) {
    return cellDescriptions[upperAddress];
  }

  return null;
}

/**
 * シート名から説明を取得
 */
function getSheetDescription_(sheetName) {
  var sheetDescriptions = {
    'インポート用': '拡張機能から直接データをインポートするシート。拡張機能で取得したデータや写真を確認できる。',
    '内容確認専用シート': 'インポート用シートにインポートされたデータを並べ替えたもの。商品の評価や状態などがチェックしやすい。',
    '作業シート': '実際に商品の計算や翻訳を行うシート。',
    '出品用シート': 'EAGLEに登録する情報をまとめて、一括でコピーするためのシート。',
    'Import_Templates': 'EAGLEからテンプレートをインポートして判定するシート。作業シートで利用するために標準名を自動生成する。',
    'Import_Policies': 'EAGLEからシッピングポリシーをインポートして判定用に細分化するシート。',
    'Policy_Master': 'テンプレートとシッピングポリシーを判定用にまとめたもの。',
    'キーワード': '発見したキーワードを管理するシート。ユーザーが自由に設計。',
    'キーワード管理': '取得したキーワードの更新日や出品数、参考IDの管理をするシート。更新日のアラートを設定（K1の値）することで、更新から時間が経ったものを優先的に出品するという管理もできる。',
    '参照データ': 'EAGLEに登録されているテンプレートや仕入れ先名称をダウンロード。ここのデータが作業シートのテンプレートと仕入れ先名のドロップダウンに反映される。また、各セルのアラートの色の設定も参考として記載。',
    '保存データ': '作業終了したデータの保存に活用。外注さんの作業記録などにも利用。',
    'データ入力依頼シート': '外注さんに作業を依頼するのに活用。',
    'EAGLE商品一覧': 'EAGLEに登録されている商品の仕入れ先コードの管理に利用。重複管理用。',
    'Profit_Amounts': '利益額と送料の設定に利用。利益額計算や送料固定の設定の場合、ここで管理。',
    'GPT_Prompts': 'プロンプトの管理用シート。ここで直接編集もできるが、設定メニューから編集の方が使いやすい。新しいプロンプトを追加するときはA列にプロンプト名、B列に内容を入れる。作成後は初期設定を行うことで作業シートで使えるようになる（AS2の選択肢として反映）。',
    'Shipping_Methods': '配送方法の管理シート。',
    'Shipping_Rates': '送料テーブル表。各配送方法の送料テーブル。'
  };

  if (sheetDescriptions[sheetName]) {
    return sheetDescriptions[sheetName];
  }

  // 部分一致
  for (var key in sheetDescriptions) {
    if (sheetName.indexOf(key) !== -1 || key.indexOf(sheetName) !== -1) {
      return sheetDescriptions[key];
    }
  }

  return null;
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
