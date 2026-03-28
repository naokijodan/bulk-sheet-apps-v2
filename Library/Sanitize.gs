/******************************************************
 * Sanitize.gs - 交通整理（ソーステキストのAI事前処理）
 *
 * J列・K列の日本語ソーステキストから商品情報だけを
 * AIで抽出し、配送文・売り手コメント等を除外する。
 * 元データはAU・AV列にバックアップする。
 ******************************************************/

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  デフォルトプロンプト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  カテゴリ別フィールド定義
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
var SANITIZE_FIELDS_ = {
  'Watches': [
    'ブランド', 'モデル名', '型番', 'ムーブメント',
    'ケース素材', 'ケースサイズ', '文字盤色', '風防',
    'ベルト素材', '防水', '表示方式', '腕周り',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Cameras': [
    'ブランド', 'モデル名', 'タイプ', 'シリーズ',
    '色', '画素数', 'レンズマウント', 'バッテリータイプ',
    '付属レンズ', 'シャッター回数',
    '付属品', 'コンディション', '故障・不具合', '製造国'
  ],
  'Trading Cards': [
    'ゲーム名', 'セット名', 'キャラクター名', 'カード名',
    'カード番号', 'レアリティ', '仕上げ', '言語',
    '鑑定会社', '鑑定グレード',
    'コンディション', '枚数'
  ],
  'Video Game Consoles': [
    'メーカー', '機種名', '型番', 'タイプ',
    'ストレージ容量', '色', 'リージョン', 'エディション',
    '付属品', 'コンディション', '故障・不具合'
  ],
  'Fishing Reels': [
    'メーカー', 'モデル名', '型番', 'リールタイプ',
    '巻き方向', 'ギア比', 'サイズ/番手', '対象魚種',
    '付属品', 'コンディション', '故障・不具合'
  ]
};

/**
 * カテゴリのフィールド定義からデフォルトプロンプトを動的生成する
 * GPT_Promptsシートにプロンプトがない場合のフォールバック
 * @param {string} category - カテゴリキー（'watch', 'camera'等）
 * @return {string} プロンプト文字列
 */
function buildDefaultSanitizePrompt_(category) {
  var fields = SANITIZE_FIELDS_[category] || SANITIZE_FIELDS_['Watches'];
  var charLimits = {
    '付属品': 25, 'コンディション': 25, '故障・不具合': 25,
    'モデル名': 20, '付属レンズ': 25, '色': 10,
    'セット名': 30, 'カード名': 30, 'キャラクター名': 20,
    'カード番号': 15, 'レアリティ': 15, '鑑定会社': 10,
    '鑑定グレード': 10, '枚数': 10,
    '機種名': 25, 'エディション': 20, '対象魚種': 15,
    'リールタイプ': 10, '巻き方向': 10, 'サイズ/番手': 10
  };

  var lines = [
    'この商品はeBayに英語で出品します。',
    '翻訳AIに渡す前に、タイトルと説明文から必要な情報を抜き出してください。',
    'ブランド名・モデル名はタイトルに含まれていることが多いです。タイトルを必ず確認してください。',
    '',
    'タイトルと説明文から以下の項目を埋めてください。',
    'ソースに情報がない項目はNAと記入してください。',
    '各項目の文字数上限を厳守してください。',
    ''
  ];

  for (var i = 0; i < fields.length; i++) {
    var limit = charLimits[fields[i]] || 15;
    lines.push(fields[i] + ': (' + limit + '文字以内)');
  }

  lines.push('');
  lines.push('ルール:');
  lines.push('1. 数値はソースのまま忠実に出力する。丸めない、変換しない。');
  lines.push('2. ソースにない情報は書かない。NAにする。');
  lines.push('3. 出力は日本語のまま。ただしブランド名とモデル名は英語の正式名称で出力する。');
  lines.push('4. ブランド名は下記リストにあればそのスペルを正確に使用する。リストにない場合は正式な英語表記で出力する。');

  // ブランド辞書リスト（カテゴリ別）
  var brandList = '';
  try {
    brandList = getBrandListForSanitize_(category);
  } catch (e) {
    brandList = '';
  }
  if (brandList) {
    lines.push('');
    if (category === 'Trading Cards') {
      lines.push('ゲーム名一覧（該当するものがあればこの英語表記を正確に使用してください）:');
    } else {
      lines.push('ブランド名一覧（該当するものがあればこの英語表記を正確に使用してください）:');
    }
    lines.push(brandList);
  }

  // カメラ用の補足ルール
  if (category === 'Cameras') {
    lines.push('');
    lines.push('カメラ用の補足ルール:');
    lines.push('- タイプ: 一眼レフ/ミラーレス/コンパクト/フィルムカメラ/中判/レンジファインダー/二眼レフ/蛇腹/アクションカメラ/インスタントカメラ のいずれかで記入。');
    lines.push('- シリーズ: ブランドの製品ラインを記入。例: Canon→EOS/PowerShot, Nikon→D/Z/FM, Sony→Alpha/Cyber-shot, Fujifilm→X/GFX, Olympus→OM-D/PEN/OM, Pentax→K/645, Leica→M/R/Q, Contax→G/T/RTS, Mamiya→RB67/RZ67/645, Hasselblad→500/H/X');
    lines.push('- レンズマウント: マウント名を記入。例: EFマウント/FDマウント/RFマウント/Fマウント/Zマウント/Eマウント/Aマウント/マイクロフォーサーズ/Xマウント/Kマウント/Mマウント/M42/C/Yマウント/Lマウント');
    lines.push('- バッテリータイプ: リチウムイオン/単3/CR123A/CR2/ボタン電池/不要 のいずれか。型番（LP-E6, EN-EL15等）がある場合はリチウムイオンと判断。');
    lines.push('- 画素数: 万画素の数字をそのまま記入（例: 2420万画素）。');
  }

  // カード用の補足ルール
  if (category === 'Trading Cards') {
    lines.push('');
    lines.push('カード用の補足ルール:');
    lines.push('- ゲーム名: ポケモンカード/遊戯王/MTG/デュエルマスターズ/ヴァイスシュヴァルツ/ヴァンガード/バトルスピリッツ/ドラゴンボール/ワンピース/BBM(野球)/大相撲 のいずれかで記入。');
    lines.push('- セット名: パック名・エキスパンション名をそのまま記入。コード（SV2a, SM12a等）も併記。');
    lines.push('- キャラクター名: ポケモン名/モンスター名/選手名を記入。「ex」「VMAX」等の接尾辞はカード名に含める。');
    lines.push('- カード名: カードの正式名称。種類接尾辞を含む（例: リザードンex SAR）。');
    lines.push('- カード番号: コレクター番号をそのまま記入（例: 201/165, #123）。');
    lines.push('- レアリティ: R/SR/UR/SAR/AR/HR/RR/C/UC/CSR/SSR等のコードまたは正式名称で記入。');
    lines.push('- 仕上げ: ホロ/ノンホロ/フルアート/リバースホロ/クローム 等。');
    lines.push('- 言語: 日本語/英語/中国語/韓国語 等。');
    lines.push('- 鑑定会社: PSA/BGS/CGC/SGC。鑑定済みでなければNA。');
    lines.push('- 鑑定グレード: 10/9.5/9等の数値。鑑定済みでなければNA。');
    lines.push('- 枚数: まとめ売りの場合の枚数。単品ならNA。');
    lines.push('');
    lines.push('重要: カード名とキャラクター名を混同しない。キャラクター名は「ピカチュウ」、カード名は「ピカチュウVMAX SA」のように区別する。');
  }

  // ゲーム機用の補足ルール
  if (category === 'Video Game Consoles') {
    lines.push('');
    lines.push('ゲーム機用の補足ルール:');
    lines.push('- メーカー: Nintendo/Sony/Sega/Microsoft/SNK/NEC/Atari のいずれかで記入。');
    lines.push('- 機種名: 正式名称で記入。例: Nintendo Switch, PlayStation 5, Sega Mega Drive, Xbox Series X, PC Engine, Neo Geo AES');
    lines.push('- タイプ: 据え置き/携帯機/ハイブリッド のいずれかで記入。');
    lines.push('- リージョン: NTSC-J(日本)/NTSC-U(北米)/PAL(欧州) のいずれか。日本製はNTSC-J。');
    lines.push('- ストレージ容量: GB単位で記入（例: 32GB, 825GB）。不明ならNA。');
    lines.push('- エディション: 限定版/初期型/後期型/特別カラーモデル等。通常モデルならNA。');
    lines.push('  例: 限定版→限定版, 初期型/CUH-1000→初期型, 後期型/最終型→後期型, ピカチュウ版→ピカチュウエディション');
  }

  // リール用の補足ルール
  if (category === 'Fishing Reels') {
    lines.push('');
    lines.push('リール用の補足ルール:');
    lines.push('- リールタイプ: スピニング/ベイト(両軸)/フライ/電動/スピンキャスト のいずれかで記入。');
    lines.push('- 巻き方向: 右巻き/左巻き/両対応 のいずれかで記入。ハンドル交換可能なら両対応。');
    lines.push('- ギア比: ソースにある場合そのまま記入（例: 5.2:1, 6.4:1）。ない場合はNA。');
    lines.push('- サイズ/番手: 型番に含まれる数字（例: 2500, C3000, 103）をそのまま記入。');
    lines.push('- 対象魚種: モデル名やカテゴリから推測できる場合のみ記入。不明ならNA。');
    lines.push('  例: セフィア/エメラルダス→イカ, ソルティガ→大型回遊魚, エクスセンス→シーバス, ソアレ→メバル/アジ');
    lines.push('  例: バス用→バス, トラウト用→トラウト, エギング→イカ, ジギング→青物');
  }

  lines.push('');
  lines.push('入力:');
  lines.push('タイトル（参考）: ${jpTitle}');
  lines.push('説明文: ${jpDesc}');

  return lines.join('\n');
}


/**
 * D列タグからISカテゴリ名を判定する
 * IS_TAG_TO_CATEGORY（Config_IS.gs）を参照し、64カテゴリ全てに対応
 * @param {string} tag - D列のタグ文字列
 * @return {string|null} ISカテゴリ名（'Watches', 'Cameras'等）。該当なしはnull
 */
function detectSanitizeCategory_(tag) {
  if (!tag) return null;
  var t = tag.toString().trim();
  if (!t) return null;

  // IS_TAG_TO_CATEGORYで完全一致
  if (IS_TAG_TO_CATEGORY[t]) return IS_TAG_TO_CATEGORY[t];

  // 部分一致フォールバック（長いキーワードから順にマッチ）
  var keys = Object.keys(IS_TAG_TO_CATEGORY);
  keys.sort(function(a, b) { return b.length - a.length; });
  for (var i = 0; i < keys.length; i++) {
    if (t.indexOf(keys[i]) !== -1) return IS_TAG_TO_CATEGORY[keys[i]];
  }
  return null;
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理実行
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function runSanitizeSelectedRows() {
  var ui = SpreadsheetApp.getUi();

  // 設定とシート取得
  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  // 選択行の取得
  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // J, K, AU, AV列を一括読み込み
  var maxCol = CONFIG.COLUMNS.JP_DESC_BACKUP; // AV列 = 48
  var allData = sheet.getRange(startRow, 1, numRows, maxCol).getValues();

  // 対象行を特定（D列タグでカテゴリ判定）
  var items = [];
  var skippedRows = [];  // スキップした行の情報
  for (var i = 0; i < numRows; i++) {
    var jpTitle = allData[i][CONFIG.COLUMNS.JP_TITLE - 1];
    var jpDesc  = allData[i][CONFIG.COLUMNS.JP_DESC - 1];
    var backupTitle = allData[i][CONFIG.COLUMNS.JP_TITLE_BACKUP - 1];

    // ソースが空の行はスキップ
    if (!jpTitle && !jpDesc) continue;

    // 既にバックアップがある行はスキップ（二重上書き防止）
    var backupDesc = allData[i][CONFIG.COLUMNS.JP_DESC_BACKUP - 1];
    if (backupDesc) continue;

    // D列タグからカテゴリ判定
    var tag = String(allData[i][CONFIG.COLUMNS.TAG - 1] || '');
    var category = detectSanitizeCategory_(tag);

    if (!category) {
      // カテゴリ不明 → スキップ
      skippedRows.push({ row: startRow + i, tag: tag || 'タグなし' });
      continue;
    }

    items.push({
      row: startRow + i,
      jpTitle: String(jpTitle || ''),
      jpDesc:  String(jpDesc || ''),
      tag: tag,
      category: category
    });
  }

  if (items.length === 0) {
    var skipMsg = '交通整理する行がありません。\n（ソースが空、バックアップ済み、またはタグ未対応の行はスキップされます）';
    if (skippedRows.length > 0) {
      skipMsg += '\n\nスキップ: ' + skippedRows.map(function(s) { return '行' + s.row + '(' + s.tag + ')'; }).join(', ');
    }
    showAlert(skipMsg, 'info');
    return;
  }

  // 開始通知（トースト）
  SpreadsheetApp.getActiveSpreadsheet().toast(items.length + '行の交通整理を開始します...', '🧹 交通整理', 3);

  // ===== Step 1: K列の元データをAV列にバックアップし、K列を空にする（J列はノータッチ） =====
  for (var i = 0; i < items.length; i++) {
    // AV列にK列のバックアップ
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP)
      .setValue(items[i].jpDesc);
    // K列を空にする
    sheet.getRange(items[i].row, CONFIG.COLUMNS.JP_DESC)
      .setValue('');
  }
  SpreadsheetApp.flush();

  // ===== Step 2: カテゴリ別プロンプト取得（キャッシュ） =====
  var promptCache = {};  // { category: promptTemplate }

  // ===== Step 3 & 4: バッチでAI呼び出し + 書き込み =====
  var BATCH_SIZE = 50;
  var successCount = 0;
  var errorCount = 0;
  var errorDetails = [];

  for (var batchStart = 0; batchStart < items.length; batchStart += BATCH_SIZE) {
    var batchEnd = Math.min(batchStart + BATCH_SIZE, items.length);
    var batchItems = items.slice(batchStart, batchEnd);

    // バッチ分のリクエストを構築（カテゴリ別プロンプト）
    var requests = [];
    for (var j = 0; j < batchItems.length; j++) {
      var cat = batchItems[j].category;

      // プロンプトをキャッシュから取得、なければ生成
      if (!promptCache[cat]) {
        promptCache[cat] = buildDefaultSanitizePrompt_(cat);
      }

      var prompt = promptCache[cat]
        .replace('${jpTitle}', batchItems[j].jpTitle)
        .replace('${jpDesc}',  batchItems[j].jpDesc);
      requests.push(buildSanitizeRequest_(settings, prompt));
    }

    // API呼び出し
    var responses;
    try {
      responses = UrlFetchApp.fetchAll(requests);
    } catch (e) {
      // バッチ全体が失敗した場合、残りのバッチも中断
      for (var j = 0; j < batchItems.length; j++) {
        errorCount++;
        errorDetails.push('行' + batchItems[j].row + ': ' + e.message);
      }
      continue;
    }

    // レスポンス解析 & 書き込み
    for (var j = 0; j < responses.length; j++) {
      try {
        var result = parseSanitizeResponse_(settings.platform, responses[j]);
        if (!result.ok) {
          errorCount++;
          errorDetails.push('行' + batchItems[j].row + ': ' + result.error);
          continue;
        }

        var parsed = parseSanitizedFields_(result.content, batchItems[j].category);
        if (!parsed.description) {
          errorCount++;
          errorDetails.push('行' + batchItems[j].row + ': AIの出力を解析できませんでした');
          continue;
        }

        // K列のみ上書き（J列はノータッチ）
        sheet.getRange(batchItems[j].row, CONFIG.COLUMNS.JP_DESC)
          .setValue(parsed.description);
        successCount++;

      } catch (e) {
        errorCount++;
        errorDetails.push('行' + batchItems[j].row + ': ' + (e.message || String(e)));
      }
    }

    // 次のバッチまでスリープ（レート制限回避）
    if (batchEnd < items.length) {
      Utilities.sleep(CONFIG.SLEEP_BETWEEN_BATCHES || 3000);
    }
  }

  // 結果報告
  var message = '交通整理完了: ' + successCount + '件成功';
  if (errorCount > 0) {
    message += ', ' + errorCount + '件エラー\n\n' + errorDetails.join('\n');
  }
  if (skippedRows.length > 0) {
    message += '\n\nスキップ(' + skippedRows.length + '件): '
      + skippedRows.map(function(s) { return '行' + s.row + '(' + s.tag + ')'; }).join(', ');
  }
  showAlert(message, errorCount > 0 ? 'warning' : 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  メイン関数: 交通整理を元に戻す
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function restoreSanitizeSelectedRows() {
  var ui = SpreadsheetApp.getUi();

  var settings = getSettings();
  if (!settings) return;

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
  if (!sheet) {
    showAlert('作業シートが見つかりません。', 'error');
    return;
  }

  var active = sheet.getActiveRange();
  if (!active) {
    showAlert('行を選択してください。', 'error');
    return;
  }

  var startRow = active.getRow();
  var endRow = active.getLastRow();
  if (startRow < 3) startRow = 3;
  if (endRow < startRow) {
    showAlert('有効な行を選択してください。', 'error');
    return;
  }

  var numRows = endRow - startRow + 1;

  // AV列を読み込み
  var backupData = sheet.getRange(startRow, CONFIG.COLUMNS.JP_DESC_BACKUP, numRows, 1).getValues();

  // バックアップがある行を特定
  var restoreItems = [];
  for (var i = 0; i < numRows; i++) {
    var backupDesc = backupData[i][0];
    if (backupDesc) {
      restoreItems.push({
        row: startRow + i,
        desc: backupDesc
      });
    }
  }

  if (restoreItems.length === 0) {
    showAlert('復元できる行がありません。\n（バックアップが存在する行のみ復元できます）', 'info');
    return;
  }

  // 確認ダイアログ
  var response = ui.alert(
    '交通整理を元に戻す',
    restoreItems.length + '行のソーステキストをバックアップから復元します。\n実行しますか？',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  // Step 1: K列を復元（J列はノータッチ）
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC)
      .setValue(restoreItems[i].desc);
  }
  SpreadsheetApp.flush();

  // Step 2: AV列をクリア
  for (var i = 0; i < restoreItems.length; i++) {
    sheet.getRange(restoreItems[i].row, CONFIG.COLUMNS.JP_DESC_BACKUP)
      .setValue('');
  }

  showAlert(restoreItems.length + '行を復元しました。', 'success');
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI APIリクエスト構築
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * 交通整理用のHTTPリクエストを構築する
 * AI.gsのbuildRequestForProvider_と同じ構造だが、
 * createAIPromptを経由しない（sanitizeInputJP_を適用しない）
 */
function buildSanitizeRequest_(settings, prompt) {
  var platform = settings.platform;
  var model    = settings.model;
  var apiKey   = settings.apiKey;

  // ---------- OpenAI ----------
  if (platform === 'openai') {
    var isGpt5 = /^gpt-5/i.test(model || '');

    if (isGpt5) {
      return {
        url: "https://api.openai.com/v1/responses",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-5-mini',
          input: [{
            role: "user",
            content: [{ type: "input_text", text: prompt }]
          }],
          reasoning: { effort: "low" },
          max_output_tokens: 4096
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    } else {
      return {
        url: "https://api.openai.com/v1/chat/completions",
        method: "post",
        contentType: "application/json",
        headers: {
          "Authorization": "Bearer " + apiKey,
          "User-Agent": "GoogleAppsScript/1.0"
        },
        payload: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 2000
        }),
        muteHttpExceptions: true,
        followRedirects: true
      };
    }
  }

  // ---------- Claude ----------
  if (platform === 'claude') {
    return {
      url: "https://api.anthropic.com/v1/messages",
      method: "post",
      contentType: "application/json",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "User-Agent": "GoogleAppsScript/1.0"
      },
      payload: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }]
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  // ---------- Gemini ----------
  if (platform === 'gemini') {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/models/" + (model || 'gemini-1.5-flash') + ":generateContent?key=" + apiKey,
      method: "post",
      contentType: "application/json",
      headers: { "User-Agent": "GoogleAppsScript/1.0" },
      payload: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 2000 }
      }),
      muteHttpExceptions: true,
      followRedirects: true
    };
  }

  return {
    url: "about:blank",
    method: "get",
    muteHttpExceptions: true
  };
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AIレスポンス解析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
/**
 * AIレスポンスからテキストを抽出する
 * AI.gsのparseProviderResponse_と同じ構造だが、
 * parseAIResponseToFieldsを経由しない（sanitizeListingText_を適用しない）
 */
function parseSanitizeResponse_(platform, httpResp) {
  try {
    var code = httpResp.getResponseCode();
    var text = httpResp.getContentText('utf-8') || '';
    if (code !== 200) {
      return { ok: false, error: 'HTTP ' + code + ' ' + text.slice(0, 200) };
    }

    var data;
    try { data = JSON.parse(text); }
    catch (e) { return { ok: false, error: 'JSON parse error' }; }

    var content = '';

    if (platform === 'openai') {
      if (typeof data.output_text === 'string' && data.output_text) {
        content = data.output_text;
      } else if (Array.isArray(data.output) && data.output.length > 0) {
        for (var oi = 0; oi < data.output.length; oi++) {
          var item = data.output[oi];
          if (item && item.content && item.content.length) {
            for (var pi = 0; pi < item.content.length; pi++) {
              var part = item.content[pi];
              if (part && part.type === 'output_text' && (part.text || part.string_value)) {
                content = part.text || part.string_value;
                break;
              }
            }
            if (content) break;
          }
        }
      } else if (data.choices && data.choices[0] && data.choices[0].message) {
        content = data.choices[0].message.content || '';
      }

    } else if (platform === 'claude') {
      if (data.content && data.content[0]) {
        content = data.content[0].text || '';
      }

    } else if (platform === 'gemini') {
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        var p0 = data.candidates[0].content.parts && data.candidates[0].content.parts[0];
        content = (p0 && p0.text) || '';
      }
    }

    if (!content) {
      return { ok: false, error: 'AIからの応答が空です' };
    }

    return { ok: true, content: content };

  } catch (e) {
    return { ok: false, error: (e && e.message) ? e.message : String(e) };
  }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  内部関数: AI出力からタイトル・説明を抽出
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function parseSanitizedFields_(content, category) {
  var result = { description: '' };

  // カテゴリ別フィールド定義を取得（デフォルトは時計）
  var fields = SANITIZE_FIELDS_[category || 'Watches'] || SANITIZE_FIELDS_['Watches'];

  var parts = [];
  for (var i = 0; i < fields.length; i++) {
    var re = new RegExp('^' + fields[i] + '[：:]\\s*(.+)$', 'm');
    var match = content.match(re);
    if (match) {
      var value = match[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      // NAや空の項目はスキップ
      if (value && !/^N\/?A$/i.test(value) && value !== '-' && value !== 'なし' && value !== '不明') {
        parts.push(fields[i] + ': ' + value);
      }
    }
  }

  // 説明: 全項目を連結
  result.description = parts.join(' ');

  // フォールバック: フォーマット形式でない場合は旧形式で試す
  if (!result.description) {
    var descMatch = content.match(/^説明[：:][\s]*([\s\S]*)$/m);
    if (descMatch) {
      result.description = descMatch[1].replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
    }
  }

  return result;
}
