// EAGLE APIトークン連携システム - シンプル版（8列限定・新仕様対応）
// 暗号化なし、平文保存で確実動作

// 固定設定
const API_URL = "https://e-agle.net/api/ebay_items/list";

// 利用可能な列の定義（使用する8列のみ）
const AVAILABLE_COLUMNS = [
  { key: "recid", label: "商品ID", description: "商品の一意識別子" },
  { key: "supplier_code", label: "仕入れ先名", description: "仕入れ先の名称" },
  { key: "supplier_val", label: "仕入れ先コード", description: "仕入れ先コード情報" },
  { key: "title", label: "商品タイトル", description: "商品の名称" },
  { key: "price", label: "販売価格", description: "商品の販売価格" },
  { key: "purchasing_price", label: "仕入れ価格", description: "商品の仕入れ価格" },
  { key: "status_id", label: "商品の状態", description: "商品の状態ID" },
  { key: "created_at", label: "作成日時", description: "作成日時" }
];

// 列選択のプリセット（シンプル版）
const COLUMN_PRESETS = {
  "minimal": {
    name: "最小限",
    columns: ["recid", "title", "price", "created_at"]
  },
  "pricing": {
    name: "価格関連",
    columns: ["recid", "title", "price", "purchasing_price", "created_at"]
  },
  "supplier": {
    name: "供給元情報",
    columns: ["recid", "supplier_code", "supplier_val", "title", "created_at"]
  },
  "full": {
    name: "全項目",
    columns: ["recid", "supplier_code", "supplier_val", "title", "price", "purchasing_price", "status_id", "created_at"]
  }
};

/**
 * APIトークンを平文で保存（無期限）
 */
function saveApiToken(apiToken) {
  try {
    if (!apiToken || typeof apiToken !== 'string' || apiToken.trim() === '') {
      throw new Error('無効なAPIトークンです');
    }

    const properties = PropertiesService.getDocumentProperties();
    properties.setProperties({
      'eagle_api_token': apiToken.trim(),
      'eagle_saved_at': new Date().toISOString()
    });

    console.log(`✅ APIトークンを保存（無期限）`);
    return true;

  } catch (error) {
    console.error('❌ APIトークン保存エラー:', error);
    return false;
  }
}

/**
 * 選択された列設定を保存
 */
function saveSelectedColumns(selectedColumns) {
  try {
    const properties = PropertiesService.getDocumentProperties();
    properties.setProperty('eagle_selected_columns', JSON.stringify(selectedColumns));
    console.log('✅ 選択列設定を保存:', selectedColumns);
    return true;
  } catch (error) {
    console.error('❌ 選択列設定保存エラー:', error);
    return false;
  }
}

/**
 * 保存された列設定を取得
 */
function getSelectedColumns() {
  try {
    const properties = PropertiesService.getDocumentProperties();
    const saved = properties.getProperty('eagle_selected_columns');
    if (saved) {
      return JSON.parse(saved);
    }
    // デフォルトは仕入れ先コードのみ
    return ["supplier_val"];
  } catch (error) {
    console.error('❌ 選択列設定取得エラー:', error);
    return ["supplier_val"];
  }
}

/**
 * 保存されたAPIトークンを取得（無期限）
 */
function getApiToken() {
  try {
    const properties = PropertiesService.getDocumentProperties();

    const apiToken = properties.getProperty('eagle_api_token');

    if (!apiToken) {
      console.log('⚠️ 保存されたAPIトークンがありません');
      return null;
    }
    
    return apiToken;
    
  } catch (error) {
    console.error('❌ APIトークン取得エラー:', error);
    clearApiToken();
    return null;
  }
}

/**
 * 保存されたAPIトークンをクリア
 */
function clearApiToken() {
  const properties = PropertiesService.getDocumentProperties();
  properties.deleteProperty('eagle_api_token');
  properties.deleteProperty('eagle_saved_at');
  console.log('保存されたAPIトークンを削除しました');
}

/**
 * APIトークンの状態を確認（無期限版）
 */
function checkApiTokenExpiry() {
  const properties = PropertiesService.getDocumentProperties();
  const apiToken = properties.getProperty('eagle_api_token');
  const savedAt = properties.getProperty('eagle_saved_at');

  const ui = SpreadsheetApp.getUi();

  if (!apiToken) {
    ui.alert("APIトークンなし", "保存されたAPIトークンがありません", ui.ButtonSet.OK);
    return;
  }

  const savedDate = savedAt ? new Date(savedAt).toLocaleString() : '不明';

  ui.alert(
    "APIトークンの状態",
    `✅ APIトークンは保存されています（無期限）\n\n・保存日時: ${savedDate}`,
    ui.ButtonSet.OK
  );
}

/**
 * 現在の設定を確認して実行可否を判断（改良版）
 */
function confirmCurrentSettings() {
  try {
    const apiToken = getApiToken();
    const selectedColumns = getSelectedColumns();
    
    if (!apiToken) {
      // APIトークンがない場合は初期設定へ
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        '初期設定が必要です',
        'APIトークンが保存されていません。\n初期設定を開始しますか？',
        ui.ButtonSet.YES_NO
      );
      
      if (response === ui.Button.YES) {
        getApiTokenDialog();
        return false;
      } else {
        return false;
      }
    }
    
    // 選択列の情報を整理
    const selectedColumnLabels = selectedColumns.map(colKey => {
      const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
      return col ? col.label : colKey;
    });
    
    // プリセット判定
    let presetName = "カスタム";
    for (const [key, preset] of Object.entries(COLUMN_PRESETS)) {
      if (JSON.stringify(preset.columns.sort()) === JSON.stringify(selectedColumns.sort())) {
        presetName = preset.name;
        break;
      }
    }
    
    // Policy_Masterの状態確認
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('Policy_Master');
    const masterStatus = masterSheet ? '✅ 設定済み' : '⚠️ 未設定';
    
    const ui = SpreadsheetApp.getUi();
    const message = 
      `現在の設定でデータを取得します\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📊 取得設定:\n` +
      `・選択列数: ${selectedColumns.length}列 (${presetName})\n` +
      `・テンプレート・ポリシー: ${masterStatus}\n\n` +
      `📝 選択列:\n${selectedColumnLabels.map(label => `  ${label}`).join('\n')}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `このまま商品データを取得しますか？`;
    
    const response = ui.alert(
      "データ取得の確認",
      message,
      ui.ButtonSet.YES_NO_CANCEL
    );
    
    if (response === ui.Button.YES) {
      // このまま実行（商品データのみ）
      return true;
    } else if (response === ui.Button.NO) {
      // 設定を変更
      getApiTokenDialog();
      return false;
    } else {
      // キャンセル
      return false;
    }
    
  } catch (error) {
    console.error("設定確認エラー:", error);
    const ui = SpreadsheetApp.getUi();
    ui.alert("エラー", "設定確認中にエラーが発生しました: " + error.toString(), ui.ButtonSet.OK);
    return false;
  }
}


/**
 * HTMLダイアログでAPIトークンと列選択を取得（テンプレート・ポリシー取得機能付き）
 */
function getApiTokenDialog() {
  const savedColumns = getSelectedColumns();
  const isFirstTime = isFirstTimeSetup(); // 初回判定
  
  // 列選択のチェックボックス生成（8列のみ）
  const columnCheckboxes = AVAILABLE_COLUMNS.map(col => {
    const checked = savedColumns.includes(col.key) ? 'checked' : '';
    return `
      <div class="column-item">
        <label class="checkbox-label">
          <input type="checkbox" name="columns" value="${col.key}" ${checked}>
          <span class="column-name">${col.label}</span>
          <span class="column-desc">${col.description}</span>
        </label>
      </div>
    `;
  }).join('');
  
  // 初回かどうかでチェックボックスのデフォルト値を変更
  const templatePolicyChecked = isFirstTime ? 'checked' : '';
  
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>EAGLE API連携設定</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          max-width: 650px;
          margin: 0 auto;
          max-height: 90vh;
          overflow-y: auto;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .header h2 {
          color: #333;
          margin: 0;
          font-size: 24px;
        }
        .header p {
          color: #666;
          margin: 10px 0 0 0;
        }
        .section {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: #f9f9f9;
        }
        .section h3 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
          color: #333;
        }
        input[type="text"] {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          box-sizing: border-box;
          font-family: monospace;
        }
        input[type="text"]:focus {
          border-color: #667eea;
          outline: none;
        }
        .preset-buttons {
          margin: 15px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .preset-btn {
          padding: 8px 15px;
          border: 1px solid #667eea;
          background: white;
          color: #667eea;
          border-radius: 5px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .preset-btn:hover {
          background: #667eea;
          color: white;
        }
        .columns-container {
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 5px;
          padding: 15px;
          background: white;
        }
        .column-item {
          margin-bottom: 12px;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        .column-item:hover {
          background-color: #f0f8ff;
        }
        .checkbox-label {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          font-weight: normal;
        }
        .checkbox-label input[type="checkbox"] {
          margin-right: 10px;
          margin-top: 2px;
        }
        .column-name {
          font-weight: bold;
          color: #333;
          margin-right: 10px;
          min-width: 120px;
        }
        .column-desc {
          color: #666;
          font-size: 12px;
          flex: 1;
        }
        .note {
          font-size: 12px;
          color: #666;
          margin-top: 5px;
        }
        .button-group {
          text-align: center;
          margin-top: 30px;
        }
        .btn {
          padding: 12px 30px;
          margin: 0 10px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        .btn-primary {
          background-color: #667eea;
          color: white;
        }
        .btn-primary:hover {
          background-color: #5a67d8;
        }
        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }
        .btn-secondary:hover {
          background-color: #5a6268;
        }
        .security-info {
          background: #e7f3ff;
          border-left: 4px solid #667eea;
          padding: 15px;
          margin: 20px 0;
          border-radius: 0 5px 5px 0;
        }
        .security-info h4 {
          margin: 0 0 10px 0;
          color: #333;
        }
        .security-info p {
          margin: 0;
          font-size: 13px;
          color: #666;
        }
        .instruction {
          background: #e7f3ff;
          border: 1px solid #b3d9ff;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .instruction h4 {
          margin: 0 0 10px 0;
          color: #0066cc;
        }
        .instruction p {
          margin: 5px 0;
          font-size: 13px;
        }
        .instruction a {
          color: #0066cc;
          text-decoration: none;
        }
        .instruction a:hover {
          text-decoration: underline;
        }
        .selected-info {
          background: #f0f8f0;
          border: 1px solid #90ee90;
          padding: 10px;
          border-radius: 5px;
          margin-top: 10px;
          font-size: 13px;
        }
        .quick-select {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }
        .quick-btn {
          padding: 6px 12px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
          color: #495057;
        }
        .quick-btn:hover {
          background: #e9ecef;
        }
        .template-policy-option {
          background: #fff3cd;
          border: 2px solid #ffc107;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .template-policy-option label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-size: 15px;
          font-weight: bold;
          color: #856404;
        }
        .template-policy-option input[type="checkbox"] {
          margin-right: 10px;
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        .template-policy-note {
          margin-top: 10px;
          font-size: 12px;
          color: #856404;
          font-weight: normal;
        }
        .first-time-badge {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          margin-left: 10px;
          font-weight: normal;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔑 EAGLE API連携設定</h2>
          <p>${isFirstTime ? '<span class="first-time-badge">初回セットアップ</span>' : '設定の更新'}</p>
        </div>
        
        <div class="instruction">
          <h4>📋 APIトークンの取得方法</h4>
          <p>1. <a href="https://e-agle.net/settings/edit_chatgpt" target="_blank">こちらのリンク</a>からEAGLEの設定画面を開く</p>
          <p>2. APIトークンをコピーして下の入力欄に貼り付け</p>
          <p>3. 必要な列を選択して「保存して開始」ボタンをクリック</p>
        </div>
        
        <div class="section">
          <h3>🔑 APIトークン</h3>
          <div class="form-group">
            <label for="apiToken">APIトークン</label>
            <input type="text" id="apiToken" required placeholder="APIトークンを貼り付けてください">
            <div class="note">EAGLEの設定画面からコピーしたAPIトークンを入力</div>
          </div>
        </div>
        
        <div class="template-policy-option">
          <label>
            <input type="checkbox" id="fetchTemplatePolicy" ${templatePolicyChecked}>
            <span>📦 テンプレート・ポリシーも取得する ${isFirstTime ? '（初回推奨）' : ''}</span>
          </label>
          <div class="template-policy-note">
            ${isFirstTime ? 
              '✅ 初回セットアップ時はONを推奨します。テンプレートとシッピングポリシーを自動取得し、Policy_Masterを作成します。' : 
              '💡 通常は不要です。テンプレートやポリシーに変更があった場合のみONにしてください。'}
          </div>
        </div>
        
        <div class="section">
          <h3>📊 取得データ列の選択（8列から選択）</h3>
          <div class="note">必要な列のみ選択することで高速データ取得が可能です。</div>
          
          <div class="preset-buttons">
            <strong>プリセット:</strong>
            <button type="button" class="preset-btn" onclick="applyPreset('minimal')">最小限(4列)</button>
            <button type="button" class="preset-btn" onclick="applyPreset('pricing')">価格関連(5列)</button>
            <button type="button" class="preset-btn" onclick="applyPreset('supplier')">供給元情報(5列)</button>
            <button type="button" class="preset-btn" onclick="applyPreset('full')">全項目(8列)</button>
          </div>
          
          <div class="quick-select">
            <button type="button" class="quick-btn" onclick="selectAll()">全て選択</button>
            <button type="button" class="quick-btn" onclick="selectNone()">全て解除</button>
          </div>
          
          <div class="columns-container">
            ${columnCheckboxes}
          </div>
          
          <div class="selected-info" id="selectedInfo">
            選択済み: <span id="selectedCount">0</span>列
          </div>
        </div>
        
        <div class="security-info">
          <h4>💾 保存について</h4>
          <p>APIトークンと列選択設定は平文で無期限に保存されます。</p>
        </div>
        
        <div class="button-group">
          <button type="button" class="btn btn-primary" onclick="saveSettings()">💾 保存して開始</button>
          <button type="button" class="btn btn-secondary" onclick="google.script.host.close()">❌ キャンセル</button>
        </div>
      </div>
      
      <script>
        // プリセット設定
        const presets = ${JSON.stringify(COLUMN_PRESETS)};
        const isFirstTime = ${isFirstTime};
        
        // 初期化
        updateSelectedInfo();
        
        // プリセット適用
        function applyPreset(presetKey) {
          const preset = presets[presetKey];
          if (!preset) return;
          
          const checkboxes = document.querySelectorAll('input[name="columns"]');
          checkboxes.forEach(cb => cb.checked = false);
          
          preset.columns.forEach(col => {
            const checkbox = document.querySelector(\`input[name="columns"][value="\${col}"]\`);
            if (checkbox) checkbox.checked = true;
          });
          
          updateSelectedInfo();
        }
        
        // 全て選択
        function selectAll() {
          const checkboxes = document.querySelectorAll('input[name="columns"]');
          checkboxes.forEach(cb => cb.checked = true);
          updateSelectedInfo();
        }
        
        // 全て解除
        function selectNone() {
          const checkboxes = document.querySelectorAll('input[name="columns"]');
          checkboxes.forEach(cb => cb.checked = false);
          updateSelectedInfo();
        }
        
        // 選択情報の更新
        function updateSelectedInfo() {
          const checkboxes = document.querySelectorAll('input[name="columns"]:checked');
          const count = checkboxes.length;
          const names = Array.from(checkboxes).map(cb => {
            const item = cb.closest('.column-item');
            return item.querySelector('.column-name').textContent;
          });
          
          document.getElementById('selectedCount').textContent = count;
          
          if (count === 0) {
            document.getElementById('selectedInfo').innerHTML = '⚠️ 列が選択されていません';
            document.getElementById('selectedInfo').style.background = '#ffe6e6';
            document.getElementById('selectedInfo').style.borderColor = '#ff9999';
          } else {
            document.getElementById('selectedInfo').innerHTML = 
              \`✅ 選択済み: <strong>\${count}</strong>列 (\${names.join(', ')})\`;
            document.getElementById('selectedInfo').style.background = '#f0f8f0';
            document.getElementById('selectedInfo').style.borderColor = '#90ee90';
          }
        }
        
        // チェックボックス変更時の処理
        document.addEventListener('change', function(e) {
          if (e.target.name === 'columns') {
            updateSelectedInfo();
          }
        });
        
        // 設定保存
        function saveSettings() {
          const apiToken = document.getElementById('apiToken').value.trim();
          const selectedColumns = Array.from(document.querySelectorAll('input[name="columns"]:checked'))
            .map(cb => cb.value);
          const fetchTemplatePolicy = document.getElementById('fetchTemplatePolicy').checked;
          
          // バリデーション
          if (!apiToken) {
            alert('APIトークンを入力してください');
            return;
          }
          
          if (apiToken.length < 10) {
            alert('APIトークンが短すぎます。正しいトークンを入力してください。');
            return;
          }
          
          if (selectedColumns.length === 0) {
            alert('少なくとも1つの列を選択してください');
            return;
          }
          
          // 確認ダイアログ
          let confirmMsg = 
            '設定を確認してください:\\n\\n' +
            'APIトークン: ' + apiToken.substring(0, 10) + '...' + apiToken.substring(apiToken.length - 4) + '\\n' +
            '選択列数: ' + selectedColumns.length + '列\\n';
          
          if (fetchTemplatePolicy) {
            confirmMsg += 'テンプレート・ポリシー: 取得する\\n';
          } else {
            confirmMsg += 'テンプレート・ポリシー: 取得しない\\n';
          }
          
          confirmMsg += '\\n設定を保存して処理を開始しますか？';
          
          if (confirm(confirmMsg)) {
            // サーバー側関数を呼び出し
            google.script.run
              .withSuccessHandler(function(result) {
                if (result.success) {
                  alert('✅ 処理を開始しました！\\n\\n処理が完了するまでお待ちください。');
                  google.script.host.close();
                } else {
                  alert('❌ エラー: ' + result.error);
                }
              })
              .withFailureHandler(function(error) {
                alert('❌ 保存に失敗しました: ' + error.toString());
              })
              .saveAndExecuteSetup(apiToken, selectedColumns, fetchTemplatePolicy);
          }
        }
      </script>
    </body>
    </html>
  `)
  .setWidth(750)
  .setHeight(700);
  
  const ui = SpreadsheetApp.getUi();
  ui.showModalDialog(html, 'EAGLE API連携設定');
}

/**
 * 初回セットアップかどうかを判定
 */
function isFirstTimeSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName('Policy_Master');
  const apiToken = getApiToken();
  
  // Policy_Masterがない OR APIトークンがない = 初回
  return !masterSheet || !apiToken;
}

/**
 * ダイアログからのAPIトークンと列選択を保存
 */
function saveApiTokenAndColumnsFromDialog(apiToken, selectedColumns) {
  try {
    const tokenSaved = saveApiToken(apiToken); // 無期限保存
    const columnsSaved = saveSelectedColumns(selectedColumns);
    
    if (tokenSaved && columnsSaved) {
      return { 
        success: true, 
        message: `APIトークンと列選択設定を保存しました（${selectedColumns.length}列選択）` 
      };
    } else {
      return { success: false, error: '設定の保存に失敗しました' };
    }
  } catch (error) {
    console.error('ダイアログ保存エラー:', error);
    return { success: false, error: error.toString() };
  }
}

/**
 * EAGLEからデータを取得（新仕様：配列送信対応）
 */
function fetchEagleData(apiToken = null, selectedColumns = null) {
  try {
    // APIトークンが渡されていない場合は保存済みを取得
    if (!apiToken) {
      apiToken = getApiToken();
      
      if (!apiToken) {
        console.log('保存されたAPIトークンがありません。ダイアログを表示します。');
        return null; // ダイアログ表示は呼び出し元で行う
      }
    }
    
    // 選択列が渡されていない場合は保存済みを取得
    if (!selectedColumns) {
      selectedColumns = getSelectedColumns();
    }
    
    // APIリクエストペイロード（新仕様：配列で送信）
    const payload = {
      "egl_api_token": apiToken,
      "columns": selectedColumns  // 配列で送信
    };
    
    const options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    console.log('API呼び出し実行中（新仕様）...', {
      url: API_URL,
      selectedColumns: selectedColumns,
      columnCount: selectedColumns.length,
      sendFormat: 'array' // 配列形式で送信
    });
    
    const response = UrlFetchApp.fetch(API_URL, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('レスポンスコード:', responseCode);
    console.log('レスポンス内容:', responseText);
    
    if (responseCode !== 200) {
      throw new Error(`HTTPエラー ${responseCode}: ${responseText}`);
    }
    
    const responseData = JSON.parse(responseText);
    
    if (!responseData.ok) {
      // 認証エラーの場合は保存済みAPIトークンを削除
      clearApiToken();
      throw new Error("API認証エラー: " + responseData.error);
    }
    
    console.log(`✅ ${responseData.count}件のデータを取得しました（${selectedColumns.length}列）`);
    return {
      records: responseData.records,
      selectedColumns: selectedColumns
    };
    
  } catch (error) {
    console.error("API呼び出しエラー:", error.toString());
    
    // 認証エラーの場合は保存済みAPIトークンを削除
    if (error.toString().includes('認証エラー')) {
      clearApiToken();
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert("エラー", "データの取得に失敗しました: " + error.toString(), ui.ButtonSet.OK);
    return null;
  }
}

/**
 * データをシートに書き込み（動的列対応）
 */
function writeDataToSheet(data) {
  if (!data || !data.records || data.records.length === 0) {
    const ui = SpreadsheetApp.getUi();
    ui.alert("データがありません", "取得されたデータが空です", ui.ButtonSet.OK);
    return;
  }
  
  const records = data.records;
  const selectedColumns = data.selectedColumns;
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName("EAGLE商品一覧");
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet("EAGLE商品一覧");
  }
  
  // 選択された列に基づいてヘッダー情報を作成
  const headerInfo = selectedColumns.map(colKey => {
    const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    return col ? col.label : colKey;
  });
  
  // 既存データをクリア
  sheet.clear();
  
  // ヘッダー行を設定
  setupSheetHeaders(sheet, selectedColumns, headerInfo);
  
  // データの準備（選択された列のみ）
  const dataRows = records.map(record => 
    selectedColumns.map(colKey => record[colKey] || "")
  );
  
  // データをシートに書き込み
  if (dataRows.length > 0) {
    sheet.getRange(2, 1, dataRows.length, selectedColumns.length).setValues(dataRows);
  }
  
  // 列幅の自動調整
  selectedColumns.forEach((_, index) => {
    sheet.autoResizeColumn(index + 1);
  });
  
  // 設定シートを更新
  updateConfigSheet(records.length, selectedColumns);
  
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    "完了", 
    `${records.length}件のデータを更新しました\n` +
    `取得列数: ${selectedColumns.length}列\n` +
    `送信形式: 配列（新仕様対応）\n` +
    `更新時間: ${new Date().toLocaleString()}`, 
    ui.ButtonSet.OK
  );
}

/**
 * シートのヘッダーを設定（動的列対応）
 */
function setupSheetHeaders(sheet, selectedColumns, headerLabels) {
  sheet.getRange(1, 1, 1, selectedColumns.length).setValues([headerLabels]);
  sheet.getRange(1, 1, 1, selectedColumns.length).setFontWeight("bold");
  sheet.getRange(1, 1, 1, selectedColumns.length).setBackground("#4285f4");
  sheet.getRange(1, 1, 1, selectedColumns.length).setFontColor("white");
  
  // ヘッダーのバリデーション情報を追加（2行目にコメント）
  selectedColumns.forEach((colKey, index) => {
    const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    if (col) {
      sheet.getRange(1, index + 1).setNote(`${col.label}\n${col.description}\nAPI列名: ${colKey}`);
    }
  });
}

/**
 * 設定シートを取得または作成
 */
function getOrCreateConfigSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let configSheet = spreadsheet.getSheetByName("設定");
  
  if (!configSheet) {
    configSheet = spreadsheet.insertSheet("設定");
    
    const configData = [
      ["最終更新時間:", ""],
      ["取得件数:", ""],
      ["取得列数:", ""],
      ["選択列:", ""],
      ["実行者:", ""],
      ["API URL:", API_URL],
      ["APIトークン保存状態:", ""],
      ["送信形式:", "配列（新仕様）"],
      ["利用可能列数:", "8列（シンプル版）"]
    ];
    
    configSheet.getRange(1, 1, configData.length, 2).setValues(configData);
    configSheet.getRange(1, 1, configData.length, 1).setFontWeight("bold");
  }
  
  return configSheet;
}

/**
 * 設定シート更新（列選択対応）
 */
function updateConfigSheet(recordCount, selectedColumns = null) {
  const configSheet = getOrCreateConfigSheet();
  const now = new Date();
  const user = "（自動更新）";
  
  if (!selectedColumns) {
    selectedColumns = getSelectedColumns();
  }
  
  // APIトークンの状態チェック
  const apiToken = getApiToken();
  const authStatus = apiToken ? "✅ 保存済み（平文）" : "❌ 未保存";
  
  // 選択列の情報
  const selectedColumnNames = selectedColumns.map(colKey => {
    const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    return col ? col.label : colKey;
  }).join(', ');
  
  configSheet.getRange("B1").setValue(now.toLocaleString());
  configSheet.getRange("B2").setValue(recordCount);
  configSheet.getRange("B3").setValue(selectedColumns.length);
  configSheet.getRange("B4").setValue(selectedColumnNames);
  configSheet.getRange("B5").setValue(user);
  configSheet.getRange("B7").setValue(authStatus);
  
  console.log(`設定シート更新: ${recordCount}件, ${selectedColumns.length}列, ${user}`);
}

/**
 * メイン実行関数（更新ボタンから呼び出される）改良版
 */
function updateEagleData() {
  console.log("=== EAGLEデータ更新開始 ===");
  
  try {
    // 初回判定
    const isFirstTime = isFirstTimeSetup();
    
    if (isFirstTime) {
      // 初回：直接ダイアログを表示
      console.log('初回セットアップを開始します');
      
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        '🆕 初回セットアップ',
        'EAGLEとの連携を開始します。\n\n' +
        'APIトークンとデータ取得設定を行ってください。',
        ui.ButtonSet.OK
      );
      
      getApiTokenDialog();
      return;
      
    } else {
      // 2回目以降：確認ダイアログを表示
      console.log('データ更新を開始します（2回目以降）');
      
      const shouldProceed = confirmCurrentSettings();
      
      if (!shouldProceed) {
        console.log("更新処理がキャンセルされました");
        return;
      }
      
      // 商品データのみ取得
      const apiToken = getApiToken();
      const selectedColumns = getSelectedColumns();
      
      showProgressNotification('📊 商品データ取得中...');
      
      const data = fetchEagleData(apiToken, selectedColumns);
      
      if (!data) {
        throw new Error('データ取得に失敗しました');
      }
      
      showProgressNotification('💾 商品データをシートに書き込み中...');
      
      writeDataToSheet(data);
      
      showProgressNotification(
        `✅ データ更新完了！\n\n` +
        `商品データ: ${data.records.length}件\n` +
        `取得列数: ${selectedColumns.length}列\n` +
        `更新時間: ${new Date().toLocaleString()}`
      );
      
      console.log("✅ EAGLEデータの更新が完了しました");
    }
    
  } catch (error) {
    console.error("❌ 更新処理エラー:", error.toString());
    const ui = SpreadsheetApp.getUi();
    ui.alert("エラー", "更新処理中にエラーが発生しました:\n" + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * 列選択設定のみ変更
 */
function changeColumnSelection() {
  getApiTokenDialog();
}

/**
 * 現在の設定を確認
 */
function checkCurrentSettings() {
  const apiToken = getApiToken();
  const selectedColumns = getSelectedColumns();
  
  const selectedColumnNames = selectedColumns.map(colKey => {
    const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
    return col ? col.label : colKey;
  }).join('\n・ ');
  
  const ui = SpreadsheetApp.getUi();
  const tokenStatus = apiToken ? "✅ 保存済み" : "❌ 未保存";
  
  ui.alert(
    "現在の設定",
    `APIトークン: ${tokenStatus}\n\n` +
    `選択列数: ${selectedColumns.length}列\n` +
    `利用可能列数: 8列（シンプル版）\n` +
    `送信形式: 配列（新仕様）\n\n` +
    `選択列:\n・ ${selectedColumnNames}`,
    ui.ButtonSet.OK
  );
}

/**
 * 初期設定関数
 */
function setupInitial() {
  console.log("初期設定を開始します...");
  
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let mainSheet = spreadsheet.getSheetByName("EAGLE商品一覧");
    if (!mainSheet) {
      mainSheet = spreadsheet.insertSheet("EAGLE商品一覧");
      // 初期ヘッダーは設定しない（列選択後に動的生成）
    }
    
    getOrCreateConfigSheet();
    
    console.log("✅ 初期設定が完了しました");
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      "初期設定完了", 
      `シートの準備ができました！\n\n` +
      `シンプル版：8列から選択可能\n` +
      `配列形式でAPI送信\n\n` +
      `次に updateEagleData() を実行して、\n` +
      `APIトークンと列選択を行ってください。`, 
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    console.error("❌ 初期設定エラー:", error.toString());
    const ui = SpreadsheetApp.getUi();
    ui.alert("初期設定エラー", "初期設定中にエラーが発生しました: " + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * API接続テスト用
 */
function testApiConnection() {
  console.log("API接続をテストします...");
  
  try {
    let apiToken = getApiToken();
    
    if (!apiToken) {
      const ui = SpreadsheetApp.getUi();
      const response = ui.alert(
        "APIトークンの入力", 
        "API接続テストにはAPIトークンが必要です。\nAPIトークンを入力しますか？",
        ui.ButtonSet.YES_NO
      );
      
      if (response === ui.Button.YES) {
        getApiTokenDialog();
        return;
      } else {
        return;
      }
    }
    
    const data = fetchEagleData(apiToken);
    if (data && data.records && data.records.length > 0) {
      console.log("✅ API接続成功! サンプルデータ:", data.records[0]);
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "接続成功", 
        `✅ API接続に成功しました！\n\n` +
        `取得件数: ${data.records.length}件\n` +
        `取得列数: ${data.selectedColumns.length}列\n` +
        `送信形式: 配列（新仕様）\n\n` +
        `本実行は updateEagleData() を実行してください。`, 
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    console.error("❌ API接続テストエラー:", error.toString());
    const ui = SpreadsheetApp.getUi();
    ui.alert("接続エラー", "API接続テスト中にエラーが発生しました: " + error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * APIトークン管理メニュー
 */
function manageApiToken() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    "APIトークン管理",
    "どの操作を行いますか？\n\nYES: APIトークンを新規入力/更新\nNO: 有効期限を確認\nCANCEL: APIトークンを削除",
    ui.ButtonSet.YES_NO_CANCEL
  );
  
  if (response === ui.Button.YES) {
    getApiTokenDialog();
  } else if (response === ui.Button.NO) {
    checkApiTokenExpiry();
  } else {
    const confirmResponse = ui.alert(
      "APIトークンの削除",
      "保存されたAPIトークンを削除しますか？\n（次回実行時に再入力が必要になります）",
      ui.ButtonSet.YES_NO
    );
    
    if (confirmResponse === ui.Button.YES) {
      clearApiToken();
      ui.alert("削除完了", "APIトークンを削除しました", ui.ButtonSet.OK);
    }
  }
}

/**
 * デバッグ用：保存されたAPIトークンの状態確認
 */
function debugApiToken() {
  console.log("=== APIトークンデバッグ（シンプル版） ===");
  
  const properties = PropertiesService.getDocumentProperties();
  const apiToken = properties.getProperty('eagle_api_token');
  const expiryTime = properties.getProperty('eagle_expiry');
  const selectedColumns = getSelectedColumns();
  
  console.log("APIトークン:", apiToken ? "保存済み" : "未保存");
  console.log("有効期限:", expiryTime ? new Date(parseInt(expiryTime)).toLocaleString() : "未設定");
  console.log("選択列:", selectedColumns);
  console.log("利用可能列数:", AVAILABLE_COLUMNS.length);
  console.log("送信形式:", "配列（新仕様）");
  
  if (apiToken) {
    console.log("APIトークンの長さ:", apiToken.length);
    console.log("APIトークンの先頭10文字:", apiToken.substring(0, 10));
  }
  
  const ui = SpreadsheetApp.getUi();
  ui.alert("デバッグ完了", "コンソールログを確認してください", ui.ButtonSet.OK);
}

/**
 * デバッグ用：API呼び出しテスト（詳細ログ付き・新仕様対応）
 */
function debugApiCall() {
  console.log("=== API呼び出しデバッグ（シンプル版・新仕様対応） ===");
  
  const apiToken = getApiToken();
  const selectedColumns = getSelectedColumns();
  
  if (!apiToken) {
    console.log("❌ APIトークンが取得できません");
    const ui = SpreadsheetApp.getUi();
    ui.alert("エラー", "APIトークンが取得できません。先にAPIトークンを設定してください。", ui.ButtonSet.OK);
    return;
  }
  
  console.log("✅ APIトークン取得成功");
  console.log("選択列:", selectedColumns);
  console.log("API URL:", API_URL);
  console.log("送信形式:", "配列（新仕様）");
  
  try {
    const payload = {
      "egl_api_token": apiToken,
      "columns": selectedColumns  // 配列で送信
    };
    
    console.log("送信データ:", JSON.stringify(payload));
    
    const options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    console.log("API呼び出し開始...");
    const response = UrlFetchApp.fetch(API_URL, options);
    
    console.log("レスポンスコード:", response.getResponseCode());
    console.log("レスポンスヘッダー:", JSON.stringify(response.getHeaders()));
    
    const responseText = response.getContentText();
    console.log("レスポンス本文（完全版）:", responseText);
    
    if (response.getResponseCode() === 200) {
      try {
        const responseData = JSON.parse(responseText);
        console.log("パース結果:", responseData);
        
        if (responseData.ok) {
          console.log("✅ API呼び出し成功");
          console.log("データ件数:", responseData.count);
          if (responseData.records && responseData.records.length > 0) {
            console.log("最初のレコード:", responseData.records[0]);
          }
        } else {
          console.log("❌ API呼び出し失敗:", responseData.error);
        }
      } catch (parseError) {
        console.log("❌ JSONパースエラー:", parseError.toString());
        console.log("レスポンスはJSONではありません");
      }
    } else {
      console.log("❌ HTTPエラー:", response.getResponseCode());
      console.log("エラーレスポンス:", responseText);
    }
    
    const ui = SpreadsheetApp.getUi();
    const message = response.getResponseCode() === 200 ? 
      "API呼び出し完了（シンプル版）。コンソールログを確認してください。" : 
      `HTTPエラー ${response.getResponseCode()}\nコンソールログで詳細を確認してください。`;
    ui.alert("API呼び出し結果", message, ui.ButtonSet.OK);
    
  } catch (error) {
    console.error("❌ API呼び出しエラー:", error.toString());
    const ui = SpreadsheetApp.getUi();
    ui.alert("API呼び出しエラー", error.toString(), ui.ButtonSet.OK);
  }
}
/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  テンプレート・ポリシー自動取得機能
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/

/**
 * EAGLEからテンプレートを取得
 */
function fetchTemplatesFromEagle(apiToken) {
  try {
    if (!apiToken) {
      apiToken = getApiToken();
      if (!apiToken) {
        throw new Error('APIトークンが取得できません');
      }
    }
    
    const url = "https://e-agle.net/api/exhibit_templates";
    const payload = {
      "egl_api_token": apiToken
    };
    
    const options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    console.log('テンプレートAPI呼び出し中...');
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('レスポンスコード:', responseCode);
    
    if (responseCode !== 200) {
      throw new Error(`HTTPエラー ${responseCode}: ${responseText}`);
    }
    
    const responseData = JSON.parse(responseText);
    
    if (!responseData.ok) {
      clearApiToken();
      throw new Error("API認証エラー: " + (responseData.error || '不明なエラー'));
    }
    
    console.log(`✅ テンプレート${responseData.count}件を取得しました`);
    return responseData.records; // [{id: xxx, name: xxx}, ...]
    
  } catch (error) {
    console.error("テンプレート取得エラー:", error.toString());
    throw error;
  }
}

/**
 * EAGLEからシッピングポリシーを取得
 */
function fetchShippingPoliciesFromEagle(apiToken) {
  try {
    if (!apiToken) {
      apiToken = getApiToken();
      if (!apiToken) {
        throw new Error('APIトークンが取得できません');
      }
    }
    
    const url = "https://e-agle.net/api/ebay_policies";
    const payload = {
      "egl_api_token": apiToken,
      "type": "shipping"
    };
    
    const options = {
      "method": "POST",
      "headers": {
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
    
    console.log('ポリシーAPI呼び出し中...');
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('レスポンスコード:', responseCode);
    
    if (responseCode !== 200) {
      throw new Error(`HTTPエラー ${responseCode}: ${responseText}`);
    }
    
    const responseData = JSON.parse(responseText);
    
    if (!responseData.ok) {
      clearApiToken();
      throw new Error("API認証エラー: " + (responseData.error || '不明なエラー'));
    }
    
    // 2次元配列 [[id, name], ...] を {id, name} 形式に変換
    const policies = responseData.records.map(record => ({
      id: record[0],
      name: record[1]
    }));
    
    console.log(`✅ ポリシー${policies.length}件を取得しました`);
    return policies;
    
  } catch (error) {
    console.error("ポリシー取得エラー:", error.toString());
    throw error;
  }
}

/**
 * テンプレート・ポリシーをImportシートに書き込み
 */
function writeTemplatesAndPoliciesToImportSheets(templates, policies) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Import_Templatesシート作成
    let templateSheet = ss.getSheetByName('Import_Templates');
    if (templateSheet) {
      ss.deleteSheet(templateSheet);
    }

    templateSheet = ss.insertSheet('Import_Templates');

    // ヘッダー設定
    templateSheet.getRange('A1').setValue('Template ID');
    templateSheet.getRange('B1').setValue('日本語名');
    templateSheet.getRange('C1').setValue('自動生成された標準名（確認用）');

    // ヘッダー書式
    templateSheet.getRange('A1:C1').setFontWeight('bold')
      .setBackground('#4285f4').setFontColor('white');

    // 列幅設定
    templateSheet.setColumnWidth(1, 100);
    templateSheet.setColumnWidth(2, 300);
    templateSheet.setColumnWidth(3, 350);

    // データ書き込み
    if (templates && templates.length > 0) {
      const templateData = templates.map(t => [t.id, t.name, '']);
      templateSheet.getRange(2, 1, templateData.length, 3).setValues(templateData);
    }

    // 参照データシートにテンプレートIDと名称を書き込み
    let referenceSheet = ss.getSheetByName('参照データ');
    if (!referenceSheet) {
      // 参照データシートが存在しない場合は作成
      referenceSheet = ss.insertSheet('参照データ');
      // ヘッダー設定
      referenceSheet.getRange('A1').setValue('テンプレートID');
      referenceSheet.getRange('B1').setValue('名称');
      referenceSheet.getRange('A1:B1').setFontWeight('bold')
        .setBackground('#ff9900').setFontColor('white');
    } else {
      // 既存の場合はA列・B列の2行目以降をクリア
      const lastRow = referenceSheet.getLastRow();
      if (lastRow > 1) {
        referenceSheet.getRange(2, 1, lastRow - 1, 2).clearContent();
      }
    }

    // テンプレートデータを参照データシートに書き込み
    if (templates && templates.length > 0) {
      const referenceData = templates.map(t => [t.id, t.name]);
      referenceSheet.getRange(2, 1, referenceData.length, 2).setValues(referenceData);

      // 列幅自動調整
      referenceSheet.autoResizeColumn(1);
      referenceSheet.autoResizeColumn(2);
    }
    
    // Import_Policiesシート作成
    let policySheet = ss.getSheetByName('Import_Policies');
    if (policySheet) {
      ss.deleteSheet(policySheet);
    }
    
    policySheet = ss.insertSheet('Import_Policies');
    
    // ヘッダー設定
    policySheet.getRange('A1').setValue('Policy ID');
    policySheet.getRange('B1').setValue('ポリシー名');
    policySheet.getRange('C1').setValue('送料（USD）');
    policySheet.getRange('D1').setValue('配送タイプ');
    policySheet.getRange('E1').setValue('状態');
    policySheet.getRange('F1').setValue('価格下限');
    policySheet.getRange('G1').setValue('価格上限');

    // ヘッダー書式
    policySheet.getRange('A1:G1').setFontWeight('bold')
      .setBackground('#34a853').setFontColor('white');

    // 列幅設定
    policySheet.setColumnWidth(1, 100);
    policySheet.setColumnWidth(2, 350);
    policySheet.setColumnWidth(3, 100);
    policySheet.setColumnWidth(4, 100);
    policySheet.setColumnWidth(5, 80);
    policySheet.setColumnWidth(6, 80);
    policySheet.setColumnWidth(7, 80);

    // データ書き込み + ポリシー名を分解 + 並べ替え
    if (policies && policies.length > 0) {
      // まずパースしてデータを作成
      const parsedPolicies = policies.map(p => {
        const parsed = parsePolicyNameForImport(p.name);
        return {
          id: p.id,
          name: p.name,
          parsed: parsed
        };
      });

      // 自動判定用と手動判定用に分離
      const autoPolicies = parsedPolicies.filter(p => p.parsed !== null);
      const manualPolicies = parsedPolicies.filter(p => p.parsed === null);

      // 自動判定用をソート: 配送タイプ → 状態 → 価格上限
      autoPolicies.sort((a, b) => {
        // 配送タイプでソート（eco < xp）
        if (a.parsed.type !== b.parsed.type) {
          return a.parsed.type === 'eco' ? -1 : 1;
        }
        // 状態でソート（new < used）
        if (a.parsed.condition !== b.parsed.condition) {
          return a.parsed.condition === 'new' ? -1 : 1;
        }
        // 価格上限でソート（昇順）
        return a.parsed.maxPrice - b.parsed.maxPrice;
      });

      // 下限を計算（同じ配送タイプ・状態内で前のポリシーの上限+0.01）
      for (let i = 0; i < autoPolicies.length; i++) {
        if (i === 0) {
          autoPolicies[i].parsed.minPrice = 0.01;
        } else {
          const prev = autoPolicies[i - 1];
          const curr = autoPolicies[i];

          // 配送タイプと状態が同じなら、前の上限+0.01を下限にする
          if (prev.parsed.type === curr.parsed.type &&
              prev.parsed.condition === curr.parsed.condition) {
            curr.parsed.minPrice = prev.parsed.maxPrice + 0.01;
          } else {
            curr.parsed.minPrice = 0.01;
          }
        }
      }

      // データ配列を作成（自動判定用 + 手動判定用）
      const policyData = [];

      // 自動判定用
      autoPolicies.forEach(p => {
        policyData.push([
          p.id,
          p.name,
          p.parsed.maxPrice,  // C列: 送料（USD）= 価格上限
          p.parsed.type,
          p.parsed.condition,
          p.parsed.minPrice,
          p.parsed.maxPrice
        ]);
      });

      // 手動判定用
      manualPolicies.forEach(p => {
        policyData.push([
          p.id,
          p.name,
          '手動用',
          '',
          '',
          '',
          ''
        ]);
      });

      policySheet.getRange(2, 1, policyData.length, 7).setValues(policyData);
    }
    
    console.log('✅ Importシートを作成しました');
    return {
      templateCount: templates ? templates.length : 0,
      policyCount: policies ? policies.length : 0
    };
    
  } catch (error) {
    console.error('Importシート作成エラー:', error.toString());
    throw error;
  }
}
/**
 * 設定を保存して初期セットアップまたはデータ更新を実行（修正版）
 * HTMLダイアログから呼び出される
 */
function saveAndExecuteSetup(apiToken, selectedColumns, fetchTemplatePolicy) {
  try {
    console.log('=== セットアップ開始 ===');
    console.log('テンプレート・ポリシー取得:', fetchTemplatePolicy);
    console.log('選択列数:', selectedColumns.length);
    
    // ステップ1: APIトークンと列選択を保存
    const tokenSaved = saveApiToken(apiToken, 7);
    const columnsSaved = saveSelectedColumns(selectedColumns);
    
    if (!tokenSaved || !columnsSaved) {
      return { 
        success: false, 
        error: '設定の保存に失敗しました' 
      };
    }
    
    console.log('✅ ステップ1: 設定保存完了');
    
    // ステップ2: テンプレート・ポリシー取得（チェックされている場合のみ）
    if (fetchTemplatePolicy) {
      try {
        // 開始通知
        showProgressNotification('📥 テンプレート取得中...');
        
        const templates = fetchTemplatesFromEagle(apiToken);
        
        showProgressNotification(
          `✅ テンプレート取得完了\n\n${templates.length}件のテンプレートを取得しました`
        );
        
        // ポリシー取得
        showProgressNotification('📥 ポリシー取得中...');
        
        const policies = fetchShippingPoliciesFromEagle(apiToken);
        
        showProgressNotification(
          `✅ ポリシー取得完了\n\n${policies.length}件のポリシーを取得しました`
        );
        
        // Importシート作成
        showProgressNotification('📝 Importシート作成中...');
        
        const sheetResult = writeTemplatesAndPoliciesToImportSheets(templates, policies);
        
        showProgressNotification(
          `✅ Importシート作成完了\n\n` +
          `Import_Templatesシート: ${sheetResult.templateCount}件\n` +
          `Import_Policiesシート: ${sheetResult.policyCount}件`
        );
        
        // データ検証（内部処理を直接実行）
        showProgressNotification('🔍 データ検証中...');
        
        const validationResult = executeValidationInternal();
        
        if (!validationResult.success) {
          throw new Error('データ検証に失敗しました: ' + validationResult.errors.join(', '));
        }
        
        showProgressNotification(
          `✅ データ検証完了\n\n` +
          `テンプレート: ${validationResult.templateCount}件\n` +
          `自動判定ポリシー: ${validationResult.autoPolicyCount}件\n` +
          `手動用ポリシー: ${validationResult.manualPolicyCount}件`
        );
        
        // Policy_Master反映（確認なしで直接実行）
        showProgressNotification('💾 Policy_Masterに反映中...');
        
        const applyResult = applyToPolicyMasterInternal();
        
        if (!applyResult.success) {
          throw new Error('Policy_Master反映に失敗しました');
        }
        
        showProgressNotification(
          `✅ Policy_Master反映完了\n\n` +
          `テンプレート: ${templates.length}件\n` +
          `ポリシー: ${policies.length}件\n` +
          `ドロップダウン設定も完了しました`
        );
        
        console.log('✅ ステップ2: テンプレート・ポリシー処理完了');
        
      } catch (templatePolicyError) {
        console.error('テンプレート・ポリシー取得エラー:', templatePolicyError);
        
        // エラー通知
        const ui = SpreadsheetApp.getUi();
        const continueResponse = ui.alert(
          '⚠️ テンプレート・ポリシー取得エラー',
          `エラー内容: ${templatePolicyError.toString()}\n\n` +
          `商品データの取得は続行しますか？`,
          ui.ButtonSet.YES_NO
        );
        
        if (continueResponse !== ui.Button.YES) {
          return {
            success: false,
            error: 'テンプレート・ポリシー取得でエラーが発生しました: ' + templatePolicyError.toString()
          };
        }
      }
    } else {
      console.log('⏭️ ステップ2: テンプレート・ポリシー取得をスキップ');
    }
    
    // ステップ3: 商品データ取得
    showProgressNotification('📊 商品データ取得中...');
    
    const data = fetchEagleData(apiToken, selectedColumns);
    
    if (!data) {
      return {
        success: false,
        error: '商品データの取得に失敗しました'
      };
    }
    
    showProgressNotification('💾 商品データをシートに書き込み中...');
    
    writeDataToSheet(data);
    
    console.log('✅ ステップ3: 商品データ取得完了');
    
    // 最終完了通知
    const finalMessage = fetchTemplatePolicy ? 
      `🎉 初期セットアップが完了しました！\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `✅ 完了した処理:\n` +
      `・APIトークン保存\n` +
      `・テンプレート取得\n` +
      `・ポリシー取得\n` +
      `・データ検証\n` +
      `・Policy_Master反映\n` +
      `・ドロップダウン設定\n` +
      `・商品データ取得 (${data.records.length}件)\n` +
      `━━━━━━━━━━━━━━━━━━━━` :
      `✅ データ更新が完了しました！\n\n` +
      `商品データ: ${data.records.length}件\n` +
      `取得列数: ${selectedColumns.length}列`;
    
    showProgressNotification(finalMessage);
    
    return { 
      success: true,
      message: '処理が完了しました'
    };
    
  } catch (error) {
    console.error('❌ セットアップエラー:', error);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert(
      '❌ エラーが発生しました',
      error.toString(),
      ui.ButtonSet.OK
    );
    
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * データ検証を内部実行（ダイアログなし・エラーでも続行）
 */
function executeValidationInternal() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    
    if (!templateSheet || !policySheet) {
      return {
        success: false,
        errors: ['Import_TemplatesまたはImport_Policiesシートが見つかりません']
      };
    }
    
    var templateCount = 0;
    var templateErrors = 0;
    
    // テンプレートの検証
    var templateLastRow = templateSheet.getLastRow();
    for (var i = 2; i <= templateLastRow; i++) {
      var id = templateSheet.getRange(i, 1).getValue();
      var jaName = templateSheet.getRange(i, 2).getValue();
      
      if (!id && !jaName) continue;
      if (String(id).indexOf('（例）') !== -1) continue;
      
      if (!id || !jaName) {
        templateSheet.getRange(i, 3).setValue('⚠️ データ不足');
        templateErrors++;
        continue;
      }
      
      var standardName = generateStandardTemplateName(jaName);
      if (standardName) {
        templateSheet.getRange(i, 3).setValue(standardName);
        templateCount++;
      } else {
        templateSheet.getRange(i, 3).setValue('⚠️ 変換失敗');
        templateErrors++;
      }
    }
    
    // エラーがあっても警告のみで続行
    if (templateErrors > 0) {
      console.warn('⚠️ テンプレート変換エラー: ' + templateErrors + '件（スキップして続行）');
    }
    
    // ポリシーの検証（2パス処理）
    var policyLastRow = policySheet.getLastRow();
    var allPolicies = [];
    
    // パス1: 全ポリシーを読み込み
    for (var j = 2; j <= policyLastRow; j++) {
      var policyId = policySheet.getRange(j, 1).getValue();
      var policyName = policySheet.getRange(j, 2).getValue();
      
      if (!policyId || !policyName) continue;
      if (String(policyId).indexOf('（例）') !== -1) continue;
      
      allPolicies.push({
        row: j,
        id: policyId,
        name: policyName,
        calculatedFee: null
      });
    }
    
    // パス2: 通常の価格範囲を先に計算
    for (var k = 0; k < allPolicies.length; k++) {
      var policy = allPolicies[k];
      if (policy.name.match(/_(\d{4})$/)) {
        policy.calculatedFee = calculateShippingFeeFromPolicyName(policy.name, null);
      }
    }
    
    // パス3: 上限なしを計算 + 手動用を検出
    var autoPolicyCount = 0;
    var manualPolicyCount = 0;
    
    for (var m = 0; m < allPolicies.length; m++) {
      var pol = allPolicies[m];
      var fee;
      
      if (pol.calculatedFee !== null) {
        fee = pol.calculatedFee;
      } else {
        fee = calculateShippingFeeFromPolicyName(pol.name, allPolicies);
      }
      
      if (fee !== null) {
        policySheet.getRange(pol.row, 3).setValue(fee);
        autoPolicyCount++;
      } else {
        policySheet.getRange(pol.row, 3).setValue('手動用');
        manualPolicyCount++;
      }
    }
    
    console.log('検証完了: テンプレート=' + templateCount + '件（エラー' + templateErrors + '件）, 自動ポリシー=' + autoPolicyCount + '件, 手動ポリシー=' + manualPolicyCount + '件');
    
    // エラーがあっても成功として返す（エラー件数は報告）
    return {
      success: true,
      templateCount: templateCount,
      templateErrors: templateErrors,
      autoPolicyCount: autoPolicyCount,
      manualPolicyCount: manualPolicyCount
    };
    
  } catch (e) {
    console.error('検証エラー:', e);
    return {
      success: false,
      errors: [e.toString()]
    };
  }
}

/**
 * Policy_Masterに反映（確認ダイアログなし）
 */
function applyToPolicyMasterInternal() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var templateSheet = ss.getSheetByName('Import_Templates');
    var policySheet = ss.getSheetByName('Import_Policies');
    
    if (!templateSheet || !policySheet) {
      return { success: false };
    }
    
    // 既存のPolicy_Masterを削除
    var existingSheet = ss.getSheetByName('Policy_Master');
    if (existingSheet) {
      ss.deleteSheet(existingSheet);
    }
    
    // 新しいPolicy_Masterを作成
    var masterSheet = ss.insertSheet('Policy_Master');
    
    // テンプレートセクション
    var currentRow = 1;
    currentRow = writeTemplatesToMaster(masterSheet, templateSheet, currentRow);
    
    // ポリシーセクション
    currentRow += 2;
    currentRow = writePoliciesToMaster(masterSheet, policySheet, currentRow);
    
    console.log('✅ Policy_Masterに反映完了');
    
    return { success: true };
    
  } catch (e) {
    console.error('反映エラー:', e);
    return { success: false };
  }
}

/**
 * 進捗通知を表示（トースト通知）
 */
function showProgressNotification(message) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast(message, '⏳ 処理中...', 5);
    
    // ログにも出力
    console.log(message);
    
    // 少し待機（通知が表示されるように）
    Utilities.sleep(500);
    
  } catch (error) {
    console.log('通知表示:', message);
  }
}

/**
 * エラー詳細を表示（デバッグ用）
 */
function showDetailedError(stepName, error, completedSteps) {
  try {
    const ui = SpreadsheetApp.getUi();
    
    const completedList = completedSteps.map(step => `✅ ${step}`).join('\n');
    
    const message = 
      `❌ エラーが発生しました\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `エラー発生箇所: ${stepName}\n` +
      `エラー内容:\n${error.toString()}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `完了した処理:\n${completedList}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `エラーログを確認するには、\n` +
      `表示 → ログ から詳細を確認できます。`;
    
    ui.alert('処理エラー', message, ui.ButtonSet.OK);
    
    console.error('=== エラー詳細 ===');
    console.error('発生箇所:', stepName);
    console.error('エラー:', error);
    console.error('完了ステップ:', completedSteps);
    
  } catch (displayError) {
    console.error('エラー表示失敗:', displayError);
  }
}

/**
 * テンプレート・ポリシーのみを再取得（既存のPolicy_Masterを更新）
 */
function updateTemplatePolicyOnly() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '🔄 テンプレート・ポリシー再取得',
      'EAGLEから最新のテンプレートとポリシーを取得して\n' +
      'Policy_Masterを更新します。\n\n' +
      '既存のPolicy_Masterは上書きされます。\n' +
      'よろしいですか？',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      showAlert('キャンセルしました。', 'info');
      return;
    }
    
    // APIトークン取得
    const apiToken = getApiToken();
    
    if (!apiToken) {
      showAlert('APIトークンが保存されていません。\n先に初期設定を完了してください。', 'error');
      return;
    }
    
    const completedSteps = [];
    
    try {
      // テンプレート取得
      showProgressNotification('📥 テンプレート取得中...');
      const templates = fetchTemplatesFromEagle(apiToken);
      completedSteps.push('テンプレート取得');
      
      showProgressNotification(`✅ テンプレート${templates.length}件を取得`);
      
      // ポリシー取得
      showProgressNotification('📥 ポリシー取得中...');
      const policies = fetchShippingPoliciesFromEagle(apiToken);
      completedSteps.push('ポリシー取得');
      
      showProgressNotification(`✅ ポリシー${policies.length}件を取得`);
      
      // Importシート作成
      showProgressNotification('📝 Importシート作成中...');
      writeTemplatesAndPoliciesToImportSheets(templates, policies);
      completedSteps.push('Importシート作成');
      
      // データ検証
      showProgressNotification('🔍 データ検証中...');
      validateImportData();
      completedSteps.push('データ検証');
      
      // Policy_Master反映
      showProgressNotification('💾 Policy_Masterに反映中...');
      applyImportToPolicyMaster();
      completedSteps.push('Policy_Master反映');
      
      // 完了通知
      showAlert(
        `✅ テンプレート・ポリシーの更新が完了しました！\n\n` +
        `テンプレート: ${templates.length}件\n` +
        `ポリシー: ${policies.length}件\n` +
        `ドロップダウン設定も更新されました`,
        'success'
      );
      
      console.log('✅ テンプレート・ポリシー更新完了');
      
    } catch (error) {
      showDetailedError('テンプレート・ポリシー更新', error, completedSteps);
    }
    
  } catch (error) {
    console.error('テンプレート・ポリシー更新エラー:', error);
    showAlert('エラー: ' + error.toString(), 'error');
  }
}

/**
 * 現在の設定状況を詳細表示
 */
function showCurrentSetupStatus() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    
    // 各シートの存在確認
    const eagleSheet = ss.getSheetByName('EAGLE商品一覧');
    const masterSheet = ss.getSheetByName('Policy_Master');
    const importTemplatesSheet = ss.getSheetByName('Import_Templates');
    const importPoliciesSheet = ss.getSheetByName('Import_Policies');
    
    // APIトークンと列設定
    const apiToken = getApiToken();
    const selectedColumns = getSelectedColumns();
    
    // 選択列名
    const columnNames = selectedColumns.map(colKey => {
      const col = AVAILABLE_COLUMNS.find(c => c.key === colKey);
      return col ? col.label : colKey;
    }).join(', ');
    
    // ステータスメッセージ作成
    const status = 
      `📊 EAGLE連携の現在の状態\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `【API設定】\n` +
      `APIトークン: ${apiToken ? '✅ 保存済み' : '❌ 未設定'}\n` +
      `取得列数: ${selectedColumns.length}列\n` +
      `選択列: ${columnNames}\n\n` +
      `【シート状態】\n` +
      `EAGLE商品一覧: ${eagleSheet ? '✅ 作成済み' : '❌ 未作成'}\n` +
      `Policy_Master: ${masterSheet ? '✅ 作成済み' : '❌ 未作成'}\n` +
      `Import_Templates: ${importTemplatesSheet ? '✅ 存在' : '－ なし'}\n` +
      `Import_Policies: ${importPoliciesSheet ? '✅ 存在' : '－ なし'}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `${isFirstTimeSetup() ? '⚠️ 初期設定が必要です' : '✅ セットアップ完了'}`;
    
    ui.alert('現在の設定状況', status, ui.ButtonSet.OK);

  } catch (error) {
    console.error('設定状況確認エラー:', error);
    showAlert('エラー: ' + error.toString(), 'error');
  }
}

/**
 * テンプレート・ポリシーのみを再取得（既存のPolicy_Masterを更新）
 */
function updateTemplatePolicyOnly() {
  try {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      '🔄 テンプレート・ポリシー再取得',
      'EAGLEから最新のテンプレートとポリシーを取得して\n' +
      'Policy_Masterを更新します。\n\n' +
      '既存のPolicy_Masterは上書きされます。\n' +
      'よろしいですか？',
      ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
      showAlert('キャンセルしました。', 'info');
      return;
    }

    // APIトークン取得
    const apiToken = getApiToken();

    if (!apiToken) {
      showAlert('APIトークンが保存されていません。\n先に初期設定を完了してください。', 'error');
      return;
    }

    const completedSteps = [];

    try {
      // テンプレート取得
      showProgressNotification('📥 テンプレート取得中...');
      const templates = fetchTemplatesFromEagle(apiToken);
      completedSteps.push('テンプレート取得');

      showProgressNotification(`✅ テンプレート${templates.length}件を取得`);

      // ポリシー取得
      showProgressNotification('📥 ポリシー取得中...');
      const policies = fetchShippingPoliciesFromEagle(apiToken);
      completedSteps.push('ポリシー取得');

      showProgressNotification(`✅ ポリシー${policies.length}件を取得`);

      // Importシート作成
      showProgressNotification('📝 Importシート作成中...');
      writeTemplatesAndPoliciesToImportSheets(templates, policies);
      completedSteps.push('Importシート作成');

      // データ検証
      showProgressNotification('🔍 データ検証中...');
      const validationResult = executeValidationInternal();
      if (!validationResult.success) {
        throw new Error('データ検証に失敗: ' + (validationResult.errors || []).join(', '));
      }
      completedSteps.push('データ検証');

      // Policy_Master反映
      showProgressNotification('💾 Policy_Masterに反映中...');
      const applyResult = applyToPolicyMasterInternal();
      if (!applyResult.success) {
        throw new Error('Policy_Master反映に失敗');
      }
      completedSteps.push('Policy_Master反映');

      // 完了通知
      showAlert(
        `✅ テンプレート・ポリシーの更新が完了しました！\n\n` +
        `テンプレート: ${templates.length}件\n` +
        `ポリシー: ${policies.length}件\n` +
        `ドロップダウン設定も更新されました`,
        'success'
      );

      console.log('✅ テンプレート・ポリシー更新完了');

    } catch (error) {
      showDetailedError('テンプレート・ポリシー更新', error, completedSteps);
    }

  } catch (error) {
    console.error('テンプレート・ポリシー更新エラー:', error);
    showAlert('エラー: ' + error.toString(), 'error');
  }
}