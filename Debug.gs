/**
 * デバッグ用: 選択行のデータを詳細表示
 */
function debugSelectedRowsTranslate() {
  try {
    var settings = getSettings();
    if (!settings) {
      showAlert('❌ 設定が見つかりません。\n\n「⚙️ 設定メニュー > 初期設定」を実行してください。', 'error');
      return;
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('❌ 作業シート「' + settings.sheetName + '」が見つかりません。', 'error');
      return;
    }

    var active = sheet.getActiveRange();
    if (!active) {
      showAlert('❌ 処理する行を選択してください。', 'info');
      return;
    }

    var startRow = active.getRow();
    var endRow = active.getLastRow();

    if (endRow < 5) {
      showAlert('❌ 5行目以降のデータを選択してください。\n\n現在の選択: ' + startRow + '行目〜' + endRow + '行目', 'info');
      return;
    }

    // 列番号を確認
    var debugInfo = '【デバッグ情報】\n\n';
    debugInfo += '選択範囲: ' + startRow + '行目〜' + endRow + '行目\n';
    debugInfo += '選択行数: ' + (endRow - startRow + 1) + '行\n\n';
    debugInfo += '【列番号設定】\n';
    debugInfo += 'I列（仕入価格）: ' + CONFIG.COLUMNS.COST_YEN + '\n';
    debugInfo += 'J列（日本語タイトル）: ' + CONFIG.COLUMNS.JP_TITLE + '\n';
    debugInfo += 'K列（商品説明）: ' + CONFIG.COLUMNS.JP_DESC + '\n';
    debugInfo += 'M列（英語タイトル）: ' + CONFIG.COLUMNS.EN_TITLE + '\n\n';

    // 一括読み取り
    var numRows = endRow - startRow + 1;
    var dataRange = sheet.getRange(startRow, 1, numRows, CONFIG.COLUMNS.EN_TITLE);
    var values = dataRange.getValues();

    var validCount = 0;
    var invalidCount = 0;
    var details = [];

    for (var i = 0; i < values.length; i++) {
      var actualRow = startRow + i;
      if (actualRow < 5) continue;

      var jpTitle = values[i][CONFIG.COLUMNS.JP_TITLE - 1];
      var jpDesc = values[i][CONFIG.COLUMNS.JP_DESC - 1];
      var costYen = Number(values[i][CONFIG.COLUMNS.COST_YEN - 1]);
      var enTitle = values[i][CONFIG.COLUMNS.EN_TITLE - 1];

      var isValid = jpTitle && jpDesc && costYen && !enTitle;

      if (isValid) {
        validCount++;
        details.push('✅ 行' + actualRow + ': 翻訳対象');
      } else {
        invalidCount++;
        var reasons = [];
        if (!jpTitle) reasons.push('J列が空');
        if (!jpDesc) reasons.push('K列が空');
        if (!costYen) reasons.push('I列が0または空');
        if (enTitle) reasons.push('M列に値あり');

        details.push('❌ 行' + actualRow + ': スキップ (' + reasons.join(', ') + ')');

        // 詳細データを追加（最初の5行のみ）
        if (invalidCount <= 5) {
          details.push('   I列=' + costYen + ', J列=' + (jpTitle ? '✓' : '✗') + ', K列=' + (jpDesc ? '✓' : '✗') + ', M列=' + (enTitle || '空'));
        }
      }
    }

    debugInfo += '【判定結果】\n';
    debugInfo += '翻訳対象: ' + validCount + '件\n';
    debugInfo += 'スキップ: ' + invalidCount + '件\n\n';
    debugInfo += '【詳細】\n' + details.slice(0, 10).join('\n');

    if (details.length > 10) {
      debugInfo += '\n\n...他' + (details.length - 10) + '件';
    }

    if (validCount === 0) {
      debugInfo += '\n\n⚠️ 翻訳対象が0件です。\n上記の理由を確認してください。';
    }

    showAlert(debugInfo, 'info');

  } catch (e) {
    showAlert('❌ デバッグ中にエラー:\n\n' + e.message + '\n\nスタック:\n' + e.stack, 'error');
  }
}
