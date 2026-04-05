/******************************************************
 * Translation.gs - 翻訳処理
 * - 選択行の翻訳実行 (runSelectedRowsTranslate)
 * - 翻訳結果のシート反映
 * - 翻訳結果の検証 (日本語混入チェック、文字数チェック)
 * - 進捗サイドバー表示
 ******************************************************/

function runSelectedRowsTranslate() {
  var SCRIPT_NAME = 'runSelectedRowsTranslate';
  var props = PropertiesService.getDocumentProperties();
  var startTime = new Date();

  var totalPrompt = parseInt(props.getProperty('totalPrompt_translate') || '0');
  var totalCompletion = parseInt(props.getProperty('totalCompletion_translate') || '0');
  var processedCount = parseInt(props.getProperty('processedCount_translate') || '0');
  var errorCount = parseInt(props.getProperty('errorCount_translate') || '0');
  var skippedCount = parseInt(props.getProperty('skippedCount_translate') || '0');
  var validationErrorCount = 0; // 検証エラー件数
  var allRetryDetails = []; // 全バッチのリトライ詳細

  var selectedRows;
  var startRowIndex = parseInt(props.getProperty('lastProcessedRowIndex_translate') || '0');

  try {
    var settings = getSettings();
    if (!settings) {
      clearProcessingState_translate();
      clearAllTriggers();
      return;
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(settings.sheetName);
    if (!sheet) {
      showAlert('作業シートが見つかりません。', 'error');
      clearProcessingState_translate();
      clearAllTriggers();
      return;
    }

    // 作業シートのAS2セルからプロンプトIDを読み取り（設定値を上書き）
    try {
      var sheetPromptId = sheet.getRange('AS2').getValue();
      if (sheetPromptId && String(sheetPromptId).trim()) {
        settings.promptId = String(sheetPromptId).trim();
      }
    } catch (e) {
      // AS2セルが存在しない場合は既存のpromptIdを使用
      console.log('AS2セルからプロンプトIDを読み取れませんでした。既存の設定を使用します: ' + e.message);
    }

    // AS3セルからプロンプト選択モードを読み取り（自動選択機能）
    var autoPromptMode = false;
    var tagToPromptMap = {};  // タグ→プロンプトIDの逆引きマップ
    try {
      var modeValue = sheet.getRange('AS3').getValue();
      if (String(modeValue).trim() === '自動選択') {
        autoPromptMode = true;
        // GPT_PromptsシートのA列+E列からタグ→promptIDマップを構築
        var promptSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GPT_Prompts');
        if (promptSheet) {
          var pLastRow = promptSheet.getLastRow();
          if (pLastRow >= 2) {
            var promptData = promptSheet.getRange(2, 1, pLastRow - 1, 5).getValues(); // A-E列
            for (var pi = 0; pi < promptData.length; pi++) {
              var pId = (promptData[pi][0] || '').toString().trim();
              var pTags = (promptData[pi][4] || '').toString().trim(); // E列
              if (pId && pTags) {
                var tagList = pTags.split(',');
                for (var ti = 0; ti < tagList.length; ti++) {
                  var tag = tagList[ti].trim();
                  if (tag) {
                    if (tagToPromptMap[tag] && tagToPromptMap[tag] !== pId) {
                      console.log('⚠️ タグ重複検知: "' + tag + '" → 既存: ' + tagToPromptMap[tag] + ' / 新: ' + pId + '（既存を維持）');
                    } else {
                      tagToPromptMap[tag] = pId;
                    }
                  }
                }
              }
            }
          }
        }
        console.log('プロンプト自動選択モード: ON（マッピング ' + Object.keys(tagToPromptMap).length + ' タグ）');
      }
    } catch (e) {
      console.log('AS3セルからプロンプト選択モードを読み取れませんでした: ' + e.message);
    }

    var isContinuing = props.getProperty('isProcessing_translate') === 'true' && props.getProperty('processingMode') === SCRIPT_NAME;

    if (!isContinuing) {
      clearProcessingState_translate();
      clearAllTriggers();
      updateExchangeRate(sheet);

      var active = sheet.getActiveRange();
      if (!active) {
        conditionalShowAlert("処理する行を選択してください。", "info");
        return;
      }
      var startRow = active.getRow(), endRow = active.getLastRow();
      if (endRow < 5) {
        conditionalShowAlert("5行目以降のデータを選択してください。", "info");
        return;
      }

      // 一括読み取りでパフォーマンス向上
      selectedRows = [];
      var numRows = endRow - startRow + 1;
      var dataRange = sheet.getRange(startRow, 1, numRows, CONFIG.COLUMNS.EN_TITLE);
      var values = dataRange.getValues();

      for (var i = 0; i < values.length; i++) {
        var actualRow = startRow + i;
        if (actualRow < 5) { skippedCount++; continue; }

        var jpTitle = values[i][CONFIG.COLUMNS.JP_TITLE - 1];
        var jpDesc = values[i][CONFIG.COLUMNS.JP_DESC - 1];
        var costYen = Number(values[i][CONFIG.COLUMNS.COST_YEN - 1]);
        var enTitle = values[i][CONFIG.COLUMNS.EN_TITLE - 1];

        if (jpTitle && jpDesc && costYen && !enTitle) {
          selectedRows.push(actualRow);
        } else {
          skippedCount++;
        }
      }
      if (selectedRows.length === 0) {
        conditionalShowAlert("選択範囲に翻訳対象がありません。", "info");
        return;
      }

      var platformNames = { openai:'OpenAI', claude:'Claude', gemini:'Gemini' };
      var confirmMessage = '【翻訳専用】選択 ' + selectedRows.length + ' 件を翻訳します。\n\n' +
        'AI: ' + platformNames[settings.platform] + ' / ' + settings.model + '\n\n' +
        '出力内容:\n' +
        '• M列: 英語タイトル\n' +
        '• N列: 英語説明\n' +
        '• AC列: 商品状態(新品/中古)\n\n' +
        '💡 価格計算は実行されません\n' +
        '💡 D2セルでGO/STOP切り替え可能\n' +
        '💡 並列処理: 50行/バッチ\n\nよろしいですか？';

      var ok = conditionalStartConfirmation(confirmMessage, '翻訳専用実行の確認');
      if (ok !== SpreadsheetApp.getUi().Button.YES) {
        conditionalShowAlert('キャンセルしました。', "info");
        return;
      }

      // サイドバーの進捗データを初期化
      props.setProperty('sidebarProgress', JSON.stringify({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '行チェック開始...',
        logType: 'info'
      }));

      // サイドバーを先に表示（パフォーマンス改善）
      showProgressSidebar_();

      props.setProperty('targetRows_translate', JSON.stringify(selectedRows));
      props.setProperty('isProcessing_translate', 'true');
      props.setProperty('processingMode', SCRIPT_NAME);
      props.setProperty('startTime_translate', startTime.getTime().toString());
      props.setProperty('skippedCount_translate', skippedCount.toString());
      props.setProperty('lastProcessedRowIndex_translate', '0');
      startRowIndex = 0;

      // SKU自動生成（C列が空の行にのみ値を書き込む）
      try {
        var skuResult = generateSkuForRows_(sheet, selectedRows);
        if (skuResult.generated > 0) {
          Logger.log('[runSelectedRowsTranslate] SKU自動生成: ' + skuResult.generated + '件');
        }
      } catch (skuErr) {
        Logger.log('[runSelectedRowsTranslate] SKU生成エラー（処理は続行）: ' + skuErr.message);
      }

      // サイドバー更新: 処理対象を検出
      updateProgressSidebar_({
        currentBatch: 0,
        totalBatches: 0,
        successCount: 0,
        errorCount: 0,
        message: '処理対象: ' + selectedRows.length + '件を検出',
        logType: 'info'
      });
    } else {
      selectedRows = JSON.parse(props.getProperty('targetRows_translate'));
      startTime = new Date(parseInt(props.getProperty('startTime_translate')));
      skippedCount = parseInt(props.getProperty('skippedCount_translate') || '0');
      conditionalShowAlert('翻訳処理を再開します。残り ' + (selectedRows.length - startRowIndex) + '件。', "info");

      // 継続処理でもサイドバーを表示
      showProgressSidebar_();
    }

    // P2セルの商品状態モードを1回だけ読み取る
    var conditionMode = sheet.getRange("P2").getValue();

    // 25行ずつバッチ処理
    var TRANSLATE_BATCH_SIZE = 50;
    var batches = createBatches(selectedRows.slice(startRowIndex), TRANSLATE_BATCH_SIZE);
    var rowsSeenInThisRun = 0;
    var processedInThisBatch = 0;

    // サイドバー更新: 処理開始
    updateProgressSidebar_({
      currentBatch: 0,
      totalBatches: batches.length,
      successCount: processedCount,
      errorCount: errorCount,
      message: '翻訳処理開始 (全' + batches.length + 'バッチ)',
      logType: 'info'
    });

    for (var bi = 0; bi < batches.length; bi++) {
      var batch = batches[bi];

      console.log('📦 バッチ ' + (bi + 1) + '/' + batches.length + ' 処理開始 (行数: ' + batch.length + ')');

      // サイドバー更新: バッチ開始
      updateProgressSidebar_({
        currentBatch: bi + 1,
        totalBatches: batches.length,
        successCount: processedCount,
        errorCount: errorCount,
        message: 'バッチ ' + (bi + 1) + '/' + batches.length + ' 処理開始',
        logType: 'info'
      });

      // 一括読み取りでパフォーマンス向上
      var items = [];
      if (batch.length > 0) {
        var minRow = Math.min.apply(null, batch);
        var maxRow = Math.max.apply(null, batch);
        var batchDataRange = sheet.getRange(minRow, 1, maxRow - minRow + 1, CONFIG.COLUMNS.EN_TITLE);
        var batchValues = batchDataRange.getValues();

        for (var k = 0; k < batch.length; k++) {
          var row = batch[k];
          var rowIndex = row - minRow;
          var jpTitle = batchValues[rowIndex][CONFIG.COLUMNS.JP_TITLE - 1];
          var jpDesc = batchValues[rowIndex][CONFIG.COLUMNS.JP_DESC - 1];
          var costYen = Number(batchValues[rowIndex][CONFIG.COLUMNS.COST_YEN - 1]);
          var enTitle = batchValues[rowIndex][CONFIG.COLUMNS.EN_TITLE - 1];

          if (jpTitle && jpDesc && costYen > 0 && !enTitle) {
            var item = { row: row, jpTitle: jpTitle, jpDesc: jpDesc, costYen: costYen };
            // 自動選択モード: D列タグからプロンプトIDを判定
            if (autoPromptMode) {
              var rowTag = (batchValues[rowIndex][CONFIG.COLUMNS.TAG - 1] || '').toString().trim();
              if (rowTag) {
                if (tagToPromptMap[rowTag]) {
                  item.promptId = tagToPromptMap[rowTag];
                } else {
                  // スペース区切りの先頭部分で再検索（例: 「フィギュア 3000」→「フィギュア」）
                  var baseTag = rowTag.split(/[\s　]/)[0];
                  if (baseTag !== rowTag && tagToPromptMap[baseTag]) {
                    item.promptId = tagToPromptMap[baseTag];
                  }
                }
              }
            }
            items.push(item);
          } else {
            skippedCount++;
          }
        }
      }

      if (items.length === 0) {
        console.log('  ⏭️ スキップ: 処理対象なし');
        rowsSeenInThisRun += batch.length;
        continue;
      }

      // 初回翻訳: バッチ全体を並列処理
      var par = executeTranslationWithRetry_(items, settings, sheet, conditionMode, 1);

      var validatedItems = [];
      var failedItems = [];

      // 翻訳成功した結果を収集
      for (var idx = 0; idx < par.results.length; idx++) {
        var res = par.results[idx];

        if (res.ok) {
          res.usedPromptId = items[idx].promptId || settings.promptId;
          validatedItems.push(res);
          totalPrompt += (res.usage && res.usage.in) || 0;
          totalCompletion += (res.usage && res.usage.out) || 0;
        } else {
          var errorMsg = '行' + res.row + ': 翻訳失敗: ' + (res.error || '不明なエラー');
          console.error('  ❌ ' + errorMsg);
          updateProgressSidebar_({
            currentBatch: bi + 1,
            totalBatches: batches.length,
            successCount: processedCount,
            errorCount: errorCount + failedItems.length + 1,
            message: '❌ ' + errorMsg,
            logType: 'error'
          });
          failedItems.push(items[idx]);
        }
      }

      // 翻訳成功した結果を一括書き込み
      if (validatedItems.length > 0) {
        try {
          applyTranslationBatch_(sheet, validatedItems, conditionMode);
        } catch (eRow) {
          var errorMsg = 'シート反映エラー: ' + eRow.message;
          console.error('  ❌ ' + errorMsg);
          updateProgressSidebar_({
            currentBatch: bi + 1,
            totalBatches: batches.length,
            successCount: processedCount,
            errorCount: errorCount + validatedItems.length,
            message: '❌ ' + errorMsg,
            logType: 'error'
          });
          // 全行をエラーとして扱う
          for (var errIdx = 0; errIdx < validatedItems.length; errIdx++) {
            failedItems.push(items[errIdx]);
          }
          validatedItems = [];
        }
      }

      // スプレッドシートの計算式を完了させる
      SpreadsheetApp.flush();

      // 書き込み後に一括検証
      var revalidateFailedItems = [];

      if (validatedItems.length > 0) {
        var validationResults = validateTranslationBatch_(sheet, validatedItems);

        for (var vidx = 0; vidx < validationResults.length; vidx++) {
          var validation = validationResults[vidx];
          if (!validation.valid) {
            var errorMsg = '行' + validation.row + ': ' + validation.errors.join(', ');
            console.warn('  ⚠️ ' + errorMsg);
            updateProgressSidebar_({
              currentBatch: bi + 1,
              totalBatches: batches.length,
              successCount: processedCount,
              errorCount: errorCount + revalidateFailedItems.length + 1,
              message: '❌ ' + errorMsg,
              logType: 'error'
            });
            revalidateFailedItems.push(items[vidx]);
          } else {
            processedCount++;
            processedInThisBatch++;
          }
        }
      }

      // 検証エラーがあった場合は再試行対象に追加
      for (var rfidx = 0; rfidx < revalidateFailedItems.length; rfidx++) {
        failedItems.push(revalidateFailedItems[rfidx]);
      }

      // 検証エラー行のみ再試行 (最大3回まで)
      var remainingItems = failedItems;
      var maxRetries = 3;
      var retryAttempt = 1;

      while (remainingItems.length > 0 && retryAttempt < maxRetries) {
        console.log('  🔁 検証エラー ' + remainingItems.length + '件を再試行します (' + (retryAttempt + 1) + '回目)');

        // サイドバー更新: 再試行開始
        updateProgressSidebar_({
          currentBatch: bi + 1,
          totalBatches: batches.length,
          successCount: processedCount,
          errorCount: errorCount,
          message: '🔁 ' + remainingItems.length + '件を再試行中 (' + (retryAttempt + 1) + '回目)',
          logType: 'warning'
        });

        Utilities.sleep(2000);

        var retryPar = executeTranslationWithRetry_(remainingItems, settings, sheet, conditionMode, 1);

        var retryValidated = [];
        var retryFailed = [];

        // 翻訳成功した結果を収集
        for (var ridx = 0; ridx < retryPar.results.length; ridx++) {
          var rres = retryPar.results[ridx];

          if (rres.ok) {
            retryValidated.push(rres);
            totalPrompt += (rres.usage && rres.usage.in) || 0;
            totalCompletion += (rres.usage && rres.usage.out) || 0;
          } else {
            var errorMsg = '行' + rres.row + ': 翻訳失敗(再試行' + (retryAttempt + 1) + '): ' + (rres.error || '不明なエラー');
            console.error('  ❌ ' + errorMsg);
            updateProgressSidebar_({
              currentBatch: bi + 1,
              totalBatches: batches.length,
              successCount: processedCount,
              errorCount: errorCount + retryFailed.length + 1,
              message: '❌ ' + errorMsg,
              logType: 'error'
            });
            retryFailed.push(remainingItems[ridx]);
          }
        }

        // 翻訳成功した結果を一括書き込み
        if (retryValidated.length > 0) {
          try {
            applyTranslationBatch_(sheet, retryValidated, conditionMode);
          } catch (eRow) {
            var errorMsg = 'シート反映エラー(再試行' + (retryAttempt + 1) + '): ' + eRow.message;
            console.error('  ❌ ' + errorMsg);
            updateProgressSidebar_({
              currentBatch: bi + 1,
              totalBatches: batches.length,
              successCount: processedCount,
              errorCount: errorCount + retryValidated.length,
              message: '❌ ' + errorMsg,
              logType: 'error'
            });
            // 全行をエラーとして扱う
            for (var errIdx = 0; errIdx < retryValidated.length; errIdx++) {
              retryFailed.push(remainingItems[errIdx]);
            }
            retryValidated = [];
          }
        }

        // スプレッドシートの計算式を完了させる
        SpreadsheetApp.flush();

        // 書き込み後に一括検証
        var retryRevalidateFailed = [];
        if (retryValidated.length > 0) {
          var retryValidationResults = validateTranslationBatch_(sheet, retryValidated);

          for (var rvidx = 0; rvidx < retryValidationResults.length; rvidx++) {
            var rvalidation = retryValidationResults[rvidx];
            if (!rvalidation.valid) {
              console.warn('  ⚠️ 行' + rvalidation.row + ': 検証エラー(試行' + (retryAttempt + 1) + '): ' + rvalidation.errors.join(', '));
              retryRevalidateFailed.push(remainingItems[rvidx]);
            } else {
              console.log('  ✅ 行' + rvalidation.row + ': 再試行' + (retryAttempt + 1) + '回目で成功');
              processedCount++;
              processedInThisBatch++;
              allRetryDetails.push({
                row: rvalidation.row,
                attempts: retryAttempt + 1,
                status: '成功'
              });
            }
          }
        }

        // 検証エラーを追加
        for (var rrfidx = 0; rrfidx < retryRevalidateFailed.length; rrfidx++) {
          retryFailed.push(retryRevalidateFailed[rrfidx]);
        }

        remainingItems = retryFailed;
        retryAttempt++;
      }

      // 最終的に失敗した行
      for (var f = 0; f < remainingItems.length; f++) {
        errorCount++;
        validationErrorCount++;
        console.error('  💀 行' + remainingItems[f].row + ': ' + maxRetries + '回試行後も失敗');
        allRetryDetails.push({
          row: remainingItems[f].row,
          attempts: maxRetries,
          status: '失敗'
        });
      }

      console.log('✅ バッチ ' + (bi + 1) + ' 完了 - 現在までの進捗: 成功' + processedCount + '件, エラー' + errorCount + '件');

      // サイドバー更新: バッチ完了
      updateProgressSidebar_({
        currentBatch: bi + 1,
        totalBatches: batches.length,
        successCount: processedCount,
        errorCount: errorCount,
        message: 'バッチ ' + (bi + 1) + '/' + batches.length + ' 完了 (成功: ' + processedCount + ', エラー: ' + errorCount + ')',
        logType: 'success'
      });

      if (processedInThisBatch > 0 && processedInThisBatch % 5 === 0) {
        if (!checkStopControl()) {
          clearProcessingState_translate();
          clearAllTriggers();
          conditionalShowAlert('ユーザーにより処理が停止されました(D2=STOP)。\n処理済み: ' + processedCount + '件', 'warning');
          return;
        }
      }

      rowsSeenInThisRun += batch.length;
      props.setProperty('lastProcessedRowIndex_translate', (startRowIndex + rowsSeenInThisRun).toString());
      props.setProperty('totalPrompt_translate', totalPrompt.toString());
      props.setProperty('totalCompletion_translate', totalCompletion.toString());
      props.setProperty('processedCount_translate', processedCount.toString());
      props.setProperty('errorCount_translate', errorCount.toString());
      props.setProperty('skippedCount_translate', skippedCount.toString());

      if (bi < batches.length - 1) Utilities.sleep(500);

      var elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
      if (elapsed > (240 - CONFIG.CONTINUATION_INTERVAL_MINUTES * 60)) {
        createSelfContinuationTrigger(SCRIPT_NAME);
        conditionalShowAlert("処理を一時停止し、自動再開します。", "info");
        return;
      }
    }

    // 処理完了をサイドバーに通知
    updateProgressSidebar_({
      currentBatch: batches.length,
      totalBatches: batches.length,
      successCount: processedCount,
      errorCount: errorCount,
      message: '✅ すべての処理が完了しました',
      logType: 'success',
      isCompleted: true
    });

    clearProcessingState_translate();
    clearAllTriggers();

    var end = new Date();
    var duration = Math.round((end - startTime) / 1000);
    var usd = calculateTokenCostUSD(settings.platform, settings.model, totalPrompt, totalCompletion);
    var rate = sheet.getRange("C2").getValue() || 145;
    var avgTokens = processedCount > 0 ? Math.round((totalPrompt + totalCompletion) / processedCount) : 0;

    var report = '✅ 翻訳処理完了\n\n' +
      '⏱️ 処理時間: ' + duration + '秒\n' +
      '✅ 成功: ' + processedCount + '件\n' +
      '⏭️ スキップ: ' + skippedCount + '件\n' +
      '❌ エラー: ' + errorCount + '件';

    // 検証エラーの詳細
    if (validationErrorCount > 0) {
      report += '\n   ⚠️ うち検証エラー: ' + validationErrorCount + '件';
    }

    report += '\n\n📊 トークン使用量:\n' +
      '• 入力: ' + totalPrompt.toLocaleString() + '\n' +
      '• 出力: ' + totalCompletion.toLocaleString() + '\n' +
      '• 合計: ' + (totalPrompt + totalCompletion).toLocaleString() + '\n' +
      '• 平均/件: ' + avgTokens + '\n' +
      '• 推定費用: $' + usd.toFixed(4) + '(約' + Math.round(usd * rate) + '円, ' + settings.platform + ' / ' + settings.model + ')';

    // リトライ詳細
    if (allRetryDetails.length > 0) {
      report += '\n\n🔁 再試行の詳細:\n';
      var retrySuccess = 0;
      var retryFailed = 0;
      var retryRows = [];

      for (var r = 0; r < allRetryDetails.length; r++) {
        var detail = allRetryDetails[r];
        if (detail.status === '成功') {
          retrySuccess++;
          retryRows.push('• 行' + detail.row + ': ' + detail.attempts + '回目で成功');
        } else {
          retryFailed++;
          retryRows.push('• 行' + detail.row + ': ' + detail.attempts + '回試行後も失敗');
        }
      }

      report += '再試行で成功: ' + retrySuccess + '件\n';
      report += '再試行後も失敗: ' + retryFailed + '件\n';

      if (retryRows.length > 0 && retryRows.length <= 10) {
        report += '\n' + retryRows.join('\n');
      } else if (retryRows.length > 10) {
        report += '\n' + retryRows.slice(0, 10).join('\n');
        report += '\n...他' + (retryRows.length - 10) + '件';
      }
    }

    report += '\n\n💡 価格計算は「選択行を計算」で実行してください';

    conditionalShowAlert(report, "success");

  } catch (e) {
    showAlert('翻訳処理中にエラー: ' + e.message, "error");
    clearProcessingState_translate();
    clearAllTriggers();
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳結果のみをシートに反映
  P2セルの値は外部から受け取る
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyTranslationToRow_(sheet, row, fields, conditionMode) {
  try {
    // M列・N列のみ設定
    sheet.getRange(row, CONFIG.COLUMNS.EN_TITLE).setValue(fields.title || '');
    sheet.getRange(row, CONFIG.COLUMNS.EN_DESC).setValue(fields.description || '');

    // 商品状態の設定
    // AE列に既に値が入っている場合（TagShippingの数式で「新品」「中古」が設定済み）は上書きしない
    var conditionCell = sheet.getRange(row, CONFIG.COLUMNS.CONDITION);
    var existingCondition = String(conditionCell.getValue() || '').trim();

    if (!existingCondition || existingCondition === '' || existingCondition === 'エラー') {
      // AE列が空 or エラーの場合のみ書き込む（AI判定モード or フォールバック）
      var finalCondition;

      if (conditionMode === '中古') {
        finalCondition = '中古';
      } else if (conditionMode === '新品') {
        finalCondition = '新品';
      } else {
        // P2が「AI」またはその他の場合:AIの判定結果を使用
        finalCondition = fields.condition;
      }

      if (finalCondition) {
        var validConditions = CONFIG.CONDITION_OPTIONS;
        if (!validConditions.includes(finalCondition)) {
          conditionCell.setValue("エラー");
          conditionCell.setNote("商品状態を判定できませんでした。手動で選択してください。");
        } else {
          conditionCell.setValue(finalCondition);
          if (finalCondition === "エラー") {
            conditionCell.setNote("商品状態の判定が困難です。手動で選択してください。");
          } else {
            conditionCell.setNote("");
          }
        }
      }
    }
    // existingConditionに「新品」「中古」が入っていれば何もしない（TagShippingの値を維持）

  } catch (e) {
    console.error('翻訳結果の反映エラー(行' + row + '): ' + e.message);
    throw e;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  日本語検出関数
  文字列に日本語(ひらがな・カタカナ・漢字)が含まれているかチェック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function containsJapanese_(text) {
  if (!text) return false;
  // ひらがな: \u3040-\u309F
  // カタカナ: \u30A0-\u30FF
  // 漢字: \u4E00-\u9FAF
  var japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return japaneseRegex.test(String(text));
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳結果の検証関数
  M列・N列に日本語が混入していないかチェック
  P列が1〜80の範囲内かチェック
  Q列が1〜500の範囲内かチェック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function validateTranslationResult_(sheet, row, fields) {
  var errors = [];

  try {
    // M列(EN_TITLE)の検証
    var enTitle = fields.title || sheet.getRange(row, CONFIG.COLUMNS.EN_TITLE).getValue();
    if (enTitle && containsJapanese_(enTitle)) {
      errors.push('M列(英語タイトル)に日本語が混入しています');
    }

    // N列(EN_DESC)の検証
    var enDesc = fields.description || sheet.getRange(row, CONFIG.COLUMNS.EN_DESC).getValue();
    if (enDesc && containsJapanese_(enDesc)) {
      errors.push('N列(英語説明)に日本語が混入しています');
    }

    // P列(TITLE_LENGTH)の検証 - タイトルの長さ
    var titleLength = Number(sheet.getRange(row, CONFIG.COLUMNS.TITLE_LENGTH).getValue());
    if (titleLength === 0) {
      errors.push('P列(タイトル長さ)が0です');
    } else if (titleLength >= 81) {
      errors.push('P列(タイトル長さ)が81以上です: ' + titleLength);
    }

    // Q列(DESC_LENGTH)の検証 - 説明文の長さ
    var descLength = Number(sheet.getRange(row, CONFIG.COLUMNS.DESC_LENGTH).getValue());
    if (descLength === 0) {
      errors.push('Q列(説明文長さ)が0です');
    } else if (descLength >= 799) {
      errors.push('Q列(説明文長さ)が799以上です: ' + descLength);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };

  } catch (e) {
    return {
      valid: false,
      errors: ['検証エラー: ' + e.message]
    };
  }
}

/**
 * 進捗サイドバーを表示
 */
function showProgressSidebar_() {
  try {
    // HTMLテンプレートを取得
    var htmlContent = getHtmlTemplate('ProgressSidebar');

    // バージョン番号を埋め込み（プレースホルダーを置換）
    htmlContent = htmlContent.replace('{{CURRENT_VERSION}}', String(CURRENT_LIB_VERSION));

    var html = HtmlService.createHtmlOutput(htmlContent)
      .setTitle('翻訳処理の進捗')
      .setWidth(320);
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    console.error('サイドバー表示エラー: ' + e.message);
  }
}

/**
 * サイドバーに進捗を送信
 */
function updateProgressSidebar_(data) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // スクリプトプロパティに進捗データを保存
    var props = PropertiesService.getDocumentProperties();
    props.setProperty('sidebarProgress', JSON.stringify(data));

    // サイドバーが開いているかチェックして更新
    // Note: Apps Scriptではサイドバーへの直接メッセージング機能がないため、
    // サイドバー側でポーリングするか、シート上のセルを使って通信する必要があります
  } catch (e) {
    console.error('サイドバー更新エラー: ' + e.message);
  }
}

/**
 * サイドバー用:現在の進捗データを取得
 */
function getProgressData() {
  try {
    var props = PropertiesService.getDocumentProperties();
    var data = props.getProperty('sidebarProgress');
    return data ? JSON.parse(data) : { currentBatch: 0, totalBatches: 0, successCount: 0, errorCount: 0 };
  } catch (e) {
    return { currentBatch: 0, totalBatches: 0, successCount: 0, errorCount: 0 };
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳専用の状態クリア
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function clearProcessingState_translate() {
  var props = PropertiesService.getDocumentProperties();
  [
    'isProcessing_translate', 'lastProcessedRowIndex_translate',
    'totalPrompt_translate', 'totalCompletion_translate',
    'processedCount_translate', 'errorCount_translate', 'skippedCount_translate',
    'targetRows_translate', 'startTime_translate'
  ].forEach(function(k) { props.deleteProperty(k); });
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  翻訳結果の一括書き込み（修正版 - 空欄込み高速版）
  
  【修正内容】
  空欄の行も含めた配列を作成して一括書き込み
  → 高速 + 正確
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function applyTranslationBatch_(sheet, results, conditionMode) {
  if (!results || results.length === 0) return;

  try {
    // ========================================
    // Step 1: 最小行と最大行を取得
    // ========================================
    var minRow = Math.min.apply(null, results.map(function(r) { return r.row; }));
    var maxRow = Math.max.apply(null, results.map(function(r) { return r.row; }));
    var rowCount = maxRow - minRow + 1;

    // ========================================
    // Step 2: resultsを行番号でマップ化（高速検索用）
    // ========================================
    var resultsMap = {};
    for (var i = 0; i < results.length; i++) {
      resultsMap[results[i].row] = results[i];
    }

    // ========================================
    // Step 3: 既存データを一括読み込み（M列・N列・AE列）
    // ========================================
    var existingData = sheet.getRange(minRow, CONFIG.COLUMNS.EN_TITLE, rowCount, 2).getValues();
    var existingConditions = sheet.getRange(minRow, CONFIG.COLUMNS.CONDITION, rowCount, 1).getValues();

    // ========================================
    // Step 4: M列・N列用のデータ配列を作成（既存値保持）
    // ========================================
    var titleDescData = [];

    for (var row = minRow; row <= maxRow; row++) {
      var res = resultsMap[row];
      var idx = row - minRow;

      if (res) {
        // データあり：新しい翻訳結果で上書き
        var fields = res.fields;
        titleDescData.push([
          fields.title || '',
          fields.description || ''
        ]);
      } else {
        // データなし：既存の値を保持
        titleDescData.push([
          existingData[idx][0],
          existingData[idx][1]
        ]);
      }
    }

    // ========================================
    // Step 5: M列・N列を一括書き込み
    // ========================================
    sheet.getRange(minRow, CONFIG.COLUMNS.EN_TITLE, rowCount, 2).setValues(titleDescData);

    // ========================================
    // Step 6: AE列（商品状態）のデータ配列を作成（既存値保持）
    // tagOverrideCondition=ONの場合、AE列に数式が入っているため上書きしない
    // ========================================
    var docProps = PropertiesService.getDocumentProperties();
    var tagOverrideCondition = docProps.getProperty('TAG_OVERRIDE_CONDITION') !== 'false';
    var conditionNotes = [];

    if (!tagOverrideCondition) {
      // tagOverrideCondition=OFF: 従来通りAE列に値を書き込む
      var conditionData = [];

      for (var row = minRow; row <= maxRow; row++) {
        var res = resultsMap[row];
        var idx = row - minRow;

        if (res) {
          // データあり：新しい商品状態で上書き
          var fields = res.fields;

          // 商品状態の決定
          var finalCondition;
          if (conditionMode === '中古') {
            finalCondition = '中古';
          } else if (conditionMode === '新品') {
            finalCondition = '新品';
          } else {
            finalCondition = fields.condition;
          }

          // 商品状態のバリデーション
          var validConditions = CONFIG.CONDITION_OPTIONS;
          var conditionValue;
          var conditionNote;

          if (!finalCondition || !validConditions.includes(finalCondition)) {
            conditionValue = "エラー";
            conditionNote = "商品状態を判定できませんでした。手動で選択してください。";
          } else {
            conditionValue = finalCondition;
            if (finalCondition === "エラー") {
              conditionNote = "商品状態の判定が困難です。手動で選択してください。";
            } else {
              conditionNote = "";
            }
          }

          conditionData.push([conditionValue]);
          conditionNotes.push({ row: row, note: conditionNote });
        } else {
          // データなし：既存の値を保持
          conditionData.push([existingConditions[idx][0]]);
          conditionNotes.push({ row: row, note: '' });
        }
      }

      // ========================================
      // Step 7: AE列（商品状態）を一括書き込み
      // ========================================
      sheet.getRange(minRow, CONFIG.COLUMNS.CONDITION, rowCount, 1).setValues(conditionData);
    }
    // tagOverrideCondition=ON: AE列は数式のまま維持（上書きしない）

    // ========================================
    // Step 7.5: AU列（使用プロンプトID）を一括書き込み
    // ========================================
    var promptData = [];
    var existingPrompts = sheet.getRange(minRow, CONFIG.COLUMNS.USED_PROMPT, rowCount, 1).getValues();
    for (var row = minRow; row <= maxRow; row++) {
      var res = resultsMap[row];
      var idx = row - minRow;
      if (res && res.usedPromptId) {
        promptData.push([res.usedPromptId]);
      } else {
        promptData.push([existingPrompts[idx][0]]);
      }
    }
    sheet.getRange(minRow, CONFIG.COLUMNS.USED_PROMPT, rowCount, 1).setValues(promptData);

    // ========================================
    // Step 8: メモは個別に設定（一括メソッドがないため）
    // ========================================
    for (var j = 0; j < conditionNotes.length; j++) {
      var noteInfo = conditionNotes[j];
      if (noteInfo.note) {
        sheet.getRange(noteInfo.row, CONFIG.COLUMNS.CONDITION).setNote(noteInfo.note);
      }
      // 既存値保持の場合はメモもそのまま（clearNoteしない）
    }

  } catch (e) {
    console.error('翻訳結果の書き込みエラー: ' + e.message);
    throw e;
  }
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  検証処理の一括読み取り（性能改善版）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function validateTranslationBatch_(sheet, results) {
  if (!results || results.length === 0) return [];

  try {
    var validationResults = [];

    // 検証に必要な列を一括読み込み (M, N, P, Q列)
    var firstRow = results[0].row;
    var lastRow = results[results.length - 1].row;

    // M列～Q列を読み込み（EN_TITLE=13, EN_DESC=14, TITLE_LENGTH=16, DESC_LENGTH=17）
    var rangeM = sheet.getRange(firstRow, CONFIG.COLUMNS.EN_TITLE, results.length, 1).getValues();
    var rangeN = sheet.getRange(firstRow, CONFIG.COLUMNS.EN_DESC, results.length, 1).getValues();
    var rangeP = sheet.getRange(firstRow, CONFIG.COLUMNS.TITLE_LENGTH, results.length, 1).getValues();
    var rangeQ = sheet.getRange(firstRow, CONFIG.COLUMNS.DESC_LENGTH, results.length, 1).getValues();

    for (var i = 0; i < results.length; i++) {
      var res = results[i];
      var errors = [];

      var enTitle = rangeM[i][0];
      var enDesc = rangeN[i][0];
      var titleLength = Number(rangeP[i][0]);
      var descLength = Number(rangeQ[i][0]);

      // M列(EN_TITLE)の検証
      if (enTitle && containsJapanese_(enTitle)) {
        errors.push('M列(英語タイトル)に日本語が混入しています');
      }

      // N列(EN_DESC)の検証
      if (enDesc && containsJapanese_(enDesc)) {
        errors.push('N列(英語説明)に日本語が混入しています');
      }

      // P列(TITLE_LENGTH)の検証
      if (titleLength === 0) {
        errors.push('P列(タイトル長さ)が0です');
      } else if (titleLength >= 81) {
        errors.push('P列(タイトル長さ)が81以上です: ' + titleLength);
      }

      // Q列(DESC_LENGTH)の検証
      if (descLength === 0) {
        errors.push('Q列(説明文長さ)が0です');
      } else if (descLength >= 799) {
        errors.push('Q列(説明文長さ)が799以上です: ' + descLength);
      }

      validationResults.push({
        row: res.row,
        result: res,
        valid: errors.length === 0,
        errors: errors
      });
    }

    return validationResults;

  } catch (e) {
    console.error('一括検証エラー: ' + e.message);
    return [];
  }
}
