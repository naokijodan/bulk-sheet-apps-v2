<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>価格計算B</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f9f9f9; }
    .container { max-width: 520px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h2 { color: #333; margin-bottom: 20px; text-align: center; }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-weight: bold; margin-bottom: 5px; color: #555; }
    input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    .inline-group { display: flex; gap: 10px; align-items: center; }
    .inline-group input, .inline-group select { flex: 1; }
    .btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 10px; }
    .btn:hover { background: #45a049; }
    .btn-secondary { background: #6c757d; }
    .btn-secondary:hover { background: #5a6268; }
    .result { margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 4px; border-left: 4px solid #4CAF50; }
    .error { background: #ffe6e6; border-left-color: #dc3545; color: #721c24; }
    .radio-group { display: flex; gap: 20px; margin-top: 10px; }
    .radio-item { display: flex; align-items: center; gap: 5px; }
    .section { border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 15px; background: #fafafa; }
    .section-title { font-weight: bold; color: #333; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>💲 価格計算B：販売価格→損益分岐</h2>
    
    <form id="priceForm">
      <!-- 基本情報セクション -->
      <div class="section">
        <div class="section-title">基本情報</div>
        <div class="form-group">
          <label>目標販売価格（USD）</label>
          <input type="number" id="targetPriceUSD" value="50" min="0" step="0.01">
        </div>
        
        <div class="form-group">
          <label>利益計算モード</label>
          <div class="radio-group">
            <div class="radio-item">
              <input type="radio" id="profitRate" name="profitMode" value="rate" checked>
              <label for="profitRate">利益率（%）</label>
            </div>
            <div class="radio-item">
              <input type="radio" id="profitAmount" name="profitMode" value="amount">
              <label for="profitAmount">利益額（円）</label>
            </div>
          </div>
        </div>
        
        <div class="form-group" id="profitRateGroup">
          <label>希望利益率（%）</label>
          <select id="wantProfitRatePct">
            <option value="0">0%</option>
            <option value="3">3%</option>
            <option value="5">5%</option>
            <option value="8">8%</option>
            <option value="10">10%</option>
            <option value="12">12%</option>
            <option value="15" selected>15%</option>
            <option value="18">18%</option>
            <option value="20">20%</option>
            <option value="22">22%</option>
            <option value="25">25%</option>
            <option value="28">28%</option>
            <option value="30">30%</option>
            <option value="35">35%</option>
            <option value="40">40%</option>
            <option value="45">45%</option>
            <option value="50">50%</option>
          </select>
        </div>
        
        <div class="form-group" id="profitAmountGroup" style="display:none;">
          <label>希望利益額（円）</label>
          <input type="number" id="wantProfitAmountYen" value="1500" min="0" step="100">
        </div>
      </div>

      <!-- 手数料セクション -->
      <div class="section">
        <div class="section-title">手数料設定</div>
        <div class="form-group">
          <label>eBay手数料（%）</label>
          <select id="ebayFeePct">
            <option value="10">10%</option>
            <option value="13">13%</option>
            <option value="15">15%</option>
            <option value="18" selected>18%</option>
            <option value="20">20%</option>
          </select>
        </div>
        <div class="form-group">
          <label>広告費率（%）</label>
          <select id="adFeePct">
            <option value="0">0%</option>
            <option value="1">1%</option>
            <option value="2">2%</option>
            <option value="3">3%</option>
            <option value="4">4%</option>
            <option value="5" selected>5%</option>
            <option value="6">6%</option>
            <option value="7">7%</option>
            <option value="8">8%</option>
            <option value="9">9%</option>
            <option value="10">10%</option>
            <option value="12">12%</option>
            <option value="15">15%</option>
          </select>
        </div>
      </div>

      <!-- 関税・税金セクション -->
      <div class="section">
        <div class="section-title">関税・税金設定</div>
        <div class="form-group">
          <label>通関手数料（USD）</label>
          <select id="customsFeeUSD">
            <option value="0">0</option>
            <option value="5">5</option>
            <option value="10" selected>10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="25">25</option>
          </select>
        </div>
        <div class="form-group">
          <label>関税率（%）</label>
          <select id="tariffRatePct">
            <option value="0">0%</option>
            <option value="10">10%</option>
            <option value="15" selected>15%</option>
            <option value="20">20%</option>
            <option value="25">25%</option>
            <option value="30">30%</option>
            <option value="39">39%</option>
          </select>
        </div>
        <div class="form-group">
          <label>安全係数</label>
          <select id="safetyFactor">
            <option value="1.0">1.0</option>
            <option value="1.1">1.1</option>
            <option value="1.2">1.2</option>
            <option value="1.3">1.3</option>
            <option value="1.35" selected>1.35</option>
            <option value="1.4">1.4</option>
            <option value="1.5">1.5</option>
          </select>
        </div>
      </div>

      <!-- 送料設定セクション -->
      <div class="section">
        <div class="section-title">送料設定</div>
        <div class="form-group">
          <label>送料計算モード</label>
          <div class="radio-group">
            <div class="radio-item">
              <input type="radio" id="shippingManual" name="shippingMode" value="manual" checked>
              <label for="shippingManual">手動入力</label>
            </div>
            <div class="radio-item">
              <input type="radio" id="shippingTable" name="shippingMode" value="table">
              <label for="shippingTable">テーブル計算</label>
            </div>
          </div>
        </div>
        <div class="form-group" id="manualShippingGroup">
          <label>送料（円）</label>
          <input type="number" id="shippingYen" value="1500" min="0" step="100">
        </div>
        <div class="form-group" id="tableShippingGroup" style="display:none;">
          <div class="inline-group">
            <div>
              <label>重量（g）</label>
              <input type="number" id="weight" value="500" min="1">
            </div>
            <div>
              <label>縦（cm）</label>
              <input type="number" id="length" value="25" min="1">
            </div>
            <div>
              <label>横（cm）</label>
              <input type="number" id="width" value="20" min="1">
            </div>
            <div>
              <label>高（cm）</label>
              <input type="number" id="height" value="10" min="1">
            </div>
          </div>
          <div class="form-group">
            <label>配送方法</label>
            <select id="method">
              <option value="自動選択">自動選択</option>
              <option value="Small Packet">Small Packet</option>
              <option value="Cpass-DHL">Cpass-DHL</option>
              <option value="Cpass-FedEx">Cpass-FedEx</option>
              <option value="eLogistics">eLogistics</option>
              <option value="EMS">EMS</option>
            </select>
          </div>
        </div>
      </div>

      <div style="text-align: center;">
        <button type="button" class="btn" onclick="calculateBreakEven()">計算実行</button>
        <button type="button" class="btn btn-secondary" onclick="google.script.host.close()">閉じる</button>
      </div>
    </form>

    <div id="result" style="display:none;"></div>
  </div>

  <script>
    // 利益モード切り替え
    document.querySelectorAll('input[name="profitMode"]').forEach(radio => {
      radio.addEventListener('change', function() {
        document.getElementById('profitRateGroup').style.display = 
          this.value === 'rate' ? 'block' : 'none';
        document.getElementById('profitAmountGroup').style.display = 
          this.value === 'amount' ? 'block' : 'none';
      });
    });

    // 送料モード切り替え
    document.querySelectorAll('input[name="shippingMode"]').forEach(radio => {
      radio.addEventListener('change', function() {
        document.getElementById('manualShippingGroup').style.display = 
          this.value === 'manual' ? 'block' : 'none';
        document.getElementById('tableShippingGroup').style.display = 
          this.value === 'table' ? 'block' : 'none';
      });
    });

    function calculateBreakEven() {
      try {
        var payload = {
          targetPriceUSD: parseFloat(document.getElementById('targetPriceUSD').value),
          profitMode: document.querySelector('input[name="profitMode"]:checked').value,
          ebayFeePct: parseFloat(document.getElementById('ebayFeePct').value),
          adFeePct: parseFloat(document.getElementById('adFeePct').value),
          customsFeeUSD: parseFloat(document.getElementById('customsFeeUSD').value),
          tariffRatePct: parseFloat(document.getElementById('tariffRatePct').value),
          safetyFactor: parseFloat(document.getElementById('safetyFactor').value),
          shippingMode: document.querySelector('input[name="shippingMode"]:checked').value
        };

        // 利益モードに応じて値を追加
        if (payload.profitMode === 'rate') {
          payload.wantProfitRatePct = parseFloat(document.getElementById('wantProfitRatePct').value);
        } else {
          payload.wantProfitAmountYen = parseFloat(document.getElementById('wantProfitAmountYen').value);
        }

        // 送料モードに応じて値を追加
        if (payload.shippingMode === 'manual') {
          payload.shippingYen = parseFloat(document.getElementById('shippingYen').value);
        } else {
          payload.weight = parseFloat(document.getElementById('weight').value);
          payload.length = parseFloat(document.getElementById('length').value);
          payload.width = parseFloat(document.getElementById('width').value);
          payload.height = parseFloat(document.getElementById('height').value);
          payload.method = document.getElementById('method').value;
        }

        google.script.run
          .withSuccessHandler(showResult)
          .withFailureHandler(showError)
          .calcBreakEvenFromSelling(payload);
      } catch (error) {
        showError(error.message);
      }
    }

    function showResult(result) {
      var html = '<h3>📊 計算結果</h3>';
      html += '<p><strong>目標販売価格（最終価格）:</strong> $' + result.targetPriceUSD + '</p>';
      html += '<p><strong>└ 商品本体価格:</strong> $' + result.basePriceUSD + '</p>';
      html += '<p><strong>└ 関税:</strong> $' + result.tariffUSD + '</p>';
      html += '<p><strong>└ 通関手数料:</strong> $' + result.customsFeeUSD + '</p>';
      html += '<p><strong>送料:</strong> ¥' + result.shippingYen.toLocaleString() + '</p>';
      html += '<p><strong>損益分岐点:</strong> ¥' + result.breakEvenJPY.toLocaleString() + '</p>';
      html += '<p><strong>' + result.wantRatePct + 'での最大仕入値:</strong> ¥' + result.maxCostForWantJPY.toLocaleString() + '</p>';
      html += '<p><strong>為替レート:</strong> ¥' + result.exchange + '</p>';

      document.getElementById('result').innerHTML = html;
      document.getElementById('result').className = 'result';
      document.getElementById('result').style.display = 'block';
    }

    function showError(error) {
      document.getElementById('result').innerHTML = '<h3>⚠️ エラー</h3><p>' + error + '</p>';
      document.getElementById('result').className = 'result error';
      document.getElementById('result').style.display = 'block';
    }
  </script>
</body>
</html>