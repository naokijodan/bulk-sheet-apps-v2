// Webhook受信用関数
  function doPost(e) {
    try {
      // リクエストボディを解析
      const data = JSON.parse(e.postData.contents);
      const values = data.values;
      const sheetName = data.sheetName || 'インポート用'; // デフォルト

      // スプレッドシートを取得
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = spreadsheet.getSheetByName(sheetName);

      // シートが存在しない場合は作成
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
      }

      // 3行目以降でB列が空白の行を探す
      let row = null;
      const maxRow = sheet.getMaxRows();

      for (let i = 3; i <= maxRow; i++) {
        const cellValue = sheet.getRange(i, 2).getValue();
        if (cellValue === '' || cellValue === null) {
          row = i;
          break;
        }
      }

      // 空白行が見つからない場合は最終行の次に追加
      if (row === null) {
        row = sheet.getLastRow() + 1;
      }

      // valuesをB列から貼り付け
      if (values.length > 0) {
        sheet.getRange(row, 2, 1, values.length).setValues([values]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: sheetName + 'に追加しました（行: ' + row + '）'
      })).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 選択した行の高さを150pxに調整
  function adjustSelectedRowHeights() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selection = sheet.getActiveRange();

    if (!selection) {
      return;
    }

    const startRow = selection.getRow();
    const numRows = selection.getNumRows();

    for (let i = 0; i < numRows; i++) {
      const rowNum = startRow + i;
      sheet.setRowHeight(rowNum, 150);
    }
  }

  // 選択した行の高さをデフォルトにリセット
  function resetSelectedRowHeights() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selection = sheet.getActiveRange();

    if (!selection) {
      return;
    }

    const startRow = selection.getRow();
    const numRows = selection.getNumRows();

    for (let i = 0; i < numRows; i++) {
      const rowNum = startRow + i;
      sheet.setRowHeight(rowNum, 21);
    }
  }

   // 選択した行を安全にクリア（A-AN列のみ、書式とAS列の計算式を保持）
  function clearSelectedRowsSafely() {
    const sheet = SpreadsheetApp.getActiveSheet();
    const selection = sheet.getActiveRange();

    if (!selection) {
      return;
    }

    const startRow = selection.getRow();
    const numRows = selection.getNumRows();
    const clearColumns = 40; // A列からAN列まで

    const range = sheet.getRange(startRow, 1, numRows, clearColumns);
    range.clearContent();
  }
  // 選択した行のB-G列を「作業シート」の空き行のG-L列に値のみ貼り付け
  function copyToWorkSheet() {
    const sourceSheet = SpreadsheetApp.getActiveSheet();
    const selection = sourceSheet.getActiveRange();

    if (!selection) {
      return;
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let workSheet = spreadsheet.getSheetByName('作業シート');

    // 作業シートが存在しない場合は作成
    if (!workSheet) {
      workSheet = spreadsheet.insertSheet('作業シート');
    }

    const startRow = selection.getRow();
    const numRows = selection.getNumRows();

    // 選択した各行を処理
    for (let i = 0; i < numRows; i++) {
      const sourceRow = startRow + i;

      // B列からG列までの値を取得（6列）
      const sourceValues = sourceSheet.getRange(sourceRow, 2, 1,
  6).getValues()[0];

      // 作業シートの5行目以降でH列が空の行を探す
      let targetRow = null;
      const maxRow = workSheet.getMaxRows();

      for (let j = 5; j <= maxRow; j++) {
        // H列は8列目
        const hColumnValue = workSheet.getRange(j, 8).getValue();
        if (hColumnValue === '' || hColumnValue === null) {
          targetRow = j;
          break;
        }
      }

      // 空白行が見つからない場合は最終行の次に追加
      if (targetRow === null) {
        targetRow = workSheet.getLastRow() + 1;
      }

      // G列からL列に値のみ貼り付け（7列目から6列分）
      workSheet.getRange(targetRow, 7, 1, 6).setValues([sourceValues]);
    }
  }
