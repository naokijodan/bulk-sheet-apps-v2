/******************************************************
 * Shipping.gs - 送料計算
 * - 配送方法の選択
 * - 送料レートテーブルからの取得
 * - サーチャージ・割引の適用
 * - カスタム関数 SHIPPING_COST
 ******************************************************/

function getSurchargeParamsFromWorkSheet() {
  var props = PropertiesService.getScriptProperties();
  var sheetName = props.getProperty('SHEET_NAME') || '作業シート';
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sh) {
    return { fedexFuel:0.305, dhlFuel:0.289, cpassDiscount:0.03, fedexExtraPer500g:115, dhlExtraPer500g:96 };
  }

  var getValue = function(cellAddress, defaultValue) {
    var value = sh.getRange(cellAddress).getValue();
    if (value === null || value === '' || isNaN(Number(value))) {
      return defaultValue;
    }
    return Number(value);
  };

  return {
    // U1→V1, U2→V2
    fedexFuel: getValue('V1', 0.305),
    dhlFuel: getValue('V2', 0.289),
    // V2→W2
    cpassDiscount: getValue('W2', 0.03),
    // X1→Y1, X2→Y2
    fedexExtraPer500g: getValue('Y1', 115),
    dhlExtraPer500g: getValue('Y2', 96)
  };
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配送メソッド補助
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getAirmailOverrideFlag() {
  try {
    var props = PropertiesService.getScriptProperties();
    var sheetName = props.getProperty('SHEET_NAME') || '作業シート';
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sh) return 0;
    var v = Number(sh.getRange('O2').getValue());
    return (v === 1) ? 1 : 0;
  } catch (e) { return 0; }
}

/** Airmail の料金は Shipping_Rates!I/J を参照（I=閾値(Max g), J=料金JPY） */
function getAirmailRate(actualWeight) {
  try {
    var ratesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shipping_Rates');
    if (!ratesSheet) return 999999;
    var last = ratesSheet.getLastRow();
    if (last < 3) return 999999;

    for (var row = 3; row <= last; row++) {
      var maxW = ratesSheet.getRange(row, 9).getValue();   // I列 = 9
      var yen  = ratesSheet.getRange(row,10).getValue();   // J列 = 10
      if (typeof maxW === 'number' && maxW > 0) {
        if (actualWeight <= maxW) {
          if (typeof yen === 'number' && yen > 0) return Math.round(yen);
          return 999999;
        }
      }
    }
    return 999999;
  } catch (e) {
    return 999999;
  }
}

function normalizeMethodName(name) {
   var s = String(name || '').toLowerCase(); // ← この行を追加
 // eLogistics の判定（混乱を避けるため、DHLという文字は含めない）
  if (s.indexOf('elogi') !== -1 || s === 'el') return 'eLogistics';

  // 既存の判定（変更なし）
  if (s.indexOf('fedex') !== -1 || s.indexOf('fedx') !== -1 || s === 'cf') return 'Cpass-FedEx';
  if (s.indexOf('dhl') !== -1 || s === 'cd') return 'Cpass-DHL';
  if (s.indexOf('economy') !== -1 || s === 'ce') return 'Cpass-Economy';
  if (s.indexOf('epacket') !== -1 || s.indexOf('packet') !== -1 || s === 'ep') return 'ePacket';
  if (s.indexOf('ems') !== -1) return 'EMS';
  if (s.indexOf('auto') !== -1 || s === '') return '自動選択';
  return name;
}

function getChargeableWeight(methodId, actualWeight, volumetricWeight) {
  var method = CONFIG.SHIPPING_METHODS[methodId];
  if (!method) return Math.max(actualWeight, volumetricWeight);
  return (method.calcType === 'actual') ? actualWeight : Math.max(actualWeight, volumetricWeight);
}

function isMethodAvailable(methodId, actualWeight, sizeString) {
  var method = CONFIG.SHIPPING_METHODS[methodId];
  if (!method) return false;
  if (actualWeight > method.weightLimit) return false;
  if (method.sizeLimit > 0 && sizeString) {
    var dims = sizeString.split('x').map(function(v){ return Number(v); });
    if (dims.length === 3 && dims.every(function(n){ return !isNaN(n) && n>0; })) {
      var sum = dims[0] + dims[1] + dims[2];
      if (sum > method.sizeLimit) return false;
    }
  }
  return true;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  料金表参照 + ロジック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getShippingRateFromTable(methodId, chargeableWeight) {
  try {
    var ratesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Shipping_Rates');
    if (!ratesSheet) return null;
    var last = ratesSheet.getLastRow();
    if (last < 3) return null;
    var column = CONFIG.SHIPPING_RATE_COLUMNS[methodId];
    if (!column) return null;

    for (var row = 3; row <= last; row++) {
      var wFrom = ratesSheet.getRange(row, 1).getValue();
      var wTo   = ratesSheet.getRange(row, 2).getValue();
      if (typeof wFrom === 'number' && chargeableWeight >= wFrom) {
        if (wTo === '' || wTo === null || (typeof wTo === 'number' && chargeableWeight <= wTo)) {
          var rate = ratesSheet.getRange(row, column).getValue();
          if (typeof rate === 'number' && rate > 0) return rate;
          if (rate === '-' || rate === '利用不可') return null;
        }
      }
    }
    return null;
  } catch (e) { return null; }
}

/** eパケット（US宛て用） */
function getEpacketRate(weight) {
  try {
    var rates = [
      { max: 100, yen: 1200 }, { max: 200, yen: 1410 }, { max: 300, yen: 1620 }, { max: 400, yen: 1830 },
      { max: 500, yen: 2040 }, { max: 600, yen: 2250 }, { max: 700, yen: 2460 }, { max: 800, yen: 2670 },
      { max: 900, yen: 2880 }, { max: 1000, yen: 3090 }, { max: 1100, yen: 3300 }, { max: 1200, yen: 3510 },
      { max: 1300, yen: 3720 }, { max: 1400, yen: 3930 }, { max: 1500, yen: 4140 }, { max: 1600, yen: 4350 },
      { max: 1700, yen: 4560 }, { max: 1800, yen: 4770 }, { max: 1900, yen: 4980 }, { max: 2000, yen: 5190 }
    ];
    for (var i = 0; i < rates.length; i++) if (weight <= rates[i].max) return rates[i].yen;
    return 999999;
  } catch (e) { return 999999; }
}

/** FedEx：テーブル優先→無ければ旧表、超過500g毎にT1、燃油Q1、Cpass割R2 */
function getCpassFedexRate(weight) {
  try {
    var p = getSurchargeParamsFromWorkSheet();
    var rounded = Math.ceil(weight / 500) * 500;

    var base = getShippingRateFromTable('CF', rounded);
    if (!base) {
      var table = [
        { max: 500, yen: 2222 }, { max: 1000, yen: 2493 }, { max: 1500, yen: 2683 }, { max: 2000, yen: 2697 },
        { max: 2500, yen: 3005 }, { max: 3000, yen: 3538 }, { max: 3500, yen: 3541 }, { max: 4000, yen: 4004 },
        { max: 4500, yen: 4468 }, { max: 5000, yen: 4931 }, { max: 5500, yen: 6033 }, { max: 6000, yen: 6182 },
        { max: 6500, yen: 6331 }, { max: 7000, yen: 6480 }, { max: 7500, yen: 6629 }, { max: 8000, yen: 6778 },
        { max: 8500, yen: 6927 }, { max: 9000, yen: 7076 }, { max: 9500, yen: 8992 }, { max: 10000, yen: 9177 },
        { max: 10500, yen: 9348 }, { max: 11000, yen: 9520 }, { max: 11500, yen: 9691 }, { max: 12000, yen: 9862 },
        { max: 12500, yen: 11654 }, { max: 13000, yen: 11853 }, { max: 13500, yen: 12052 }, { max: 14000, yen: 12251 },
        { max: 14500, yen: 12450 }, { max: 15000, yen: 12649 }, { max: 15500, yen: 12848 }, { max: 16000, yen: 14995 },
        { max: 16500, yen: 15224 }, { max: 17000, yen: 15452 }, { max: 17500, yen: 15681 }, { max: 18000, yen: 15910 },
        { max: 18500, yen: 16138 }, { max: 19000, yen: 16367 }, { max: 19500, yen: 16596 }, { max: 20000, yen: 16824 },
        { max: 21000, yen: 19463 }, { max: 22000, yen: 20389 }, { max: 23000, yen: 21316 }, { max: 24000, yen: 22243 },
        { max: 25000, yen: 23170 }, { max: 26000, yen: 24097 }, { max: 27000, yen: 25023 }, { max: 28000, yen: 25950 },
        { max: 29000, yen: 26877 }, { max: 30000, yen: 27804 }, { max: 31000, yen: 28730 }, { max: 32000, yen: 29657 },
        { max: 33000, yen: 30591 }, { max: 34000, yen: 31518 }, { max: 35000, yen: 32445 }, { max: 36000, yen: 33372 },
        { max: 37000, yen: 34299 }, { max: 38000, yen: 35226 }, { max: 39000, yen: 36153 }, { max: 40000, yen: 37080 },
        { max: 41000, yen: 38007 }, { max: 42000, yen: 38934 }, { max: 43000, yen: 39861 }, { max: 44000, yen: 40788 },
        { max: 45000, yen: 40788 }, { max: 46000, yen: 40788 }, { max: 47000, yen: 41219 }, { max: 48000, yen: 42096 },
        { max: 49000, yen: 42973 }, { max: 50000, yen: 43850 }, { max: 51000, yen: 44727 }, { max: 52000, yen: 45604 },
        { max: 53000, yen: 46481 }, { max: 54000, yen: 47358 }, { max: 55000, yen: 48235 }, { max: 56000, yen: 49112 },
        { max: 57000, yen: 49989 }, { max: 58000, yen: 50866 }, { max: 59000, yen: 51743 }, { max: 60000, yen: 52620 },
        { max: 61000, yen: 53497 }, { max: 62000, yen: 54374 }, { max: 63000, yen: 55251 }, { max: 64000, yen: 56128 },
        { max: 65000, yen: 57005 }, { max: 66000, yen: 57882 }, { max: 67000, yen: 58759 }, { max: 68000, yen: 59636 }
      ];
      for (var i = 0; i < table.length; i++) if (table[i].max >= rounded) { base = table[i].yen; break; }
    }
    if (!base) return 999999;

    var overUnits = Math.max(0, (rounded - 500) / 500);
    var extra = overUnits * p.fedexExtraPer500g;
    var subTotal = base + extra;
    var fuel = subTotal * p.fedexFuel;
    var discount = -(subTotal + fuel) * p.cpassDiscount;
    return Math.round(subTotal + fuel + discount);
  } catch (e) { return 999999; }
}

/** DHL：テーブル + 追加500g(T2) + 燃油(Q2) - Cpass割(R2) */
function getCpassDHLFinal(weight) {
  var p = getSurchargeParamsFromWorkSheet();
  var rounded = Math.ceil(weight / 500) * 500;
  var base = getShippingRateFromTable('CD', rounded);
  if (!base) return 999999;
  var overUnits = Math.max(0, (rounded - 500) / 500);
  var extra = overUnits * p.dhlExtraPer500g;
  var subTotal = base + extra;
  var fuel = subTotal * p.dhlFuel;
  var discount = -(subTotal + fuel) * p.cpassDiscount;
  return Math.round(subTotal + fuel + discount);
}

/** 【新規追加】eLogistics：テーブル値をそのまま使用（追加料金なし） */
function getElogiRate(weight) {
  try {
    // 500g単位で切り上げ（他のCpass系と同じ）
    var rounded = Math.ceil(weight / 500) * 500;

    // Shipping_Rates の H列（EL列）から基本料金を取得
    var base = getShippingRateFromTable('EL', rounded);

    if (!base || base <= 0) {
      // テーブルに値がない場合はエラー値を返す
      return 999999;
    }

    // eLogistics は追加料金なし（燃油・割引・追加500g料金なし）
    // テーブルの値をそのまま返す
    return Math.round(base);

  } catch (e) {
    console.error('eLogistics料金計算エラー: ' + e.message);
    return 999999;
  }
}

/** Economy：テーブルに燃油/割引を反映（追加500gは0扱い） */
function applyShippingCalculations(methodId, baseRate, chargeableWeight) {
  if (!baseRate || baseRate <= 0) return 999999;
  var p = getSurchargeParamsFromWorkSheet();
  if (methodId === 'CF') return getCpassFedexRate(chargeableWeight);
  if (methodId === 'CD') return getCpassDHLFinal(chargeableWeight);
  if (methodId === 'CE') {
    var sub = baseRate;
    var fuel = sub * p.fedexFuel;
    var disc = -(sub + fuel) * p.cpassDiscount;
    return Math.round(sub + fuel + disc);
  }
  return baseRate;
}

/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  自動/手動メソッド選定（US宛て前提）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function getSelectedShippingMethod(costYen, actualWeight, volWeight, sizeString) {
  try {
    var props = PropertiesService.getScriptProperties();
    var threshold = parseFloat(props.getProperty('SHIPPING_THRESHOLD')) || 20000;
    var lowPriceMethod = props.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'EP';
    var highPriceMethod = props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CF';

    // 高価格配送方法名を取得（短縮形式）
    var highPriceMethodName = highPriceMethod || 'CF';

    // 低価格配送方法名を取得（短縮形式）
    var lowPriceMethodName = lowPriceMethod || 'EP';

    // 低価格配送方法が「なし」の場合、金額に関わらず常に高価格配送
    if (lowPriceMethod === 'NONE') {
      return highPriceMethodName;
    }

    // 🔹 送料固定モード判定（重量・サイズが空 = 固定モード）
    var isFixedShippingMode = (actualWeight === 0 || !actualWeight) &&
                              (volWeight === 0 || !volWeight) &&
                              (!sizeString || sizeString === '');

    if (isFixedShippingMode) {
      // 送料固定モード: 仕入れ金額のみで判定
      if (costYen >= threshold) {
        return highPriceMethodName;
      } else {
        return lowPriceMethodName;
      }
    }

    // 🔹 以下はテーブル計算モードのみ実行される
    var chargeable = Math.max(actualWeight, volWeight);

    // 基準金額以上 → 高価格配送方法
    if (costYen >= threshold) {
      return highPriceMethodName;
    }

    // 基準金額未満 → 低価格配送方法を試行（制限チェックあり）
    if (lowPriceMethod === 'EP') {
      if (isMethodAvailable('EP', actualWeight, sizeString)) {
        return 'EP';
      } else {
        return highPriceMethodName; // 制限超過時はフォールバック
      }
    } else if (lowPriceMethod === 'CE') {
      return 'CE';
    }

    return highPriceMethodName;
  } catch (e) {
    // エラー時は設定された高価格配送方法にフォールバック
    var props = PropertiesService.getScriptProperties();
    var highPriceMethod = props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CF';

    return highPriceMethod;
  }
}


function selectCheapestShippingRateWithConstraints(costYen, actualWeight, volWeight, sizeString) {
  var props = PropertiesService.getScriptProperties();
  var threshold = parseFloat(props.getProperty('SHIPPING_THRESHOLD')) || 20000;
  var lowPriceMethod = props.getProperty('LOW_PRICE_SHIPPING_METHOD') || 'EP';
  var highPriceMethod = props.getProperty('HIGH_PRICE_SHIPPING_METHOD') || 'CD';

  var chargeable = Math.max(actualWeight, volWeight);

  // 低価格配送方法が「なし」の場合は、常に高価格配送方法
  if (lowPriceMethod === 'NONE') {
    if (highPriceMethod === 'CF') return getCpassFedexRate(chargeable);
    if (highPriceMethod === 'EL') return getElogiRate(chargeable); // ← 追加
    return getCpassDHLFinal(chargeable); // CD or デフォルト
  }

  if (costYen >= threshold) {
    // 基準金額以上 → 高価格配送方法
    if (highPriceMethod === 'CF') return getCpassFedexRate(chargeable);
    if (highPriceMethod === 'EL') return getElogiRate(chargeable); // ← 追加
    return getCpassDHLFinal(chargeable); // CD
  } else {
    // 基準金額未満 → 低価格配送方法を試行
    if (lowPriceMethod === 'EP' && isMethodAvailable('EP', actualWeight, sizeString)) {
      return getEpacketRate(actualWeight);
    } else if (lowPriceMethod === 'CE') {
      var ce = getShippingRateFromTable('CE', chargeable);
      if (ce) {
        return applyShippingCalculations('CE', ce, chargeable);
      }
    }

    // フォールバック → 高価格配送方法
    if (highPriceMethod === 'CF') return getCpassFedexRate(chargeable);
    if (highPriceMethod === 'EL') return getElogiRate(chargeable); // ← 追加
    return getCpassDHLFinal(chargeable); // CD
  }
}


/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  【修正4】calculateSpecificMethodRateにeLogistics追加
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function calculateSpecificMethodRate(shippingMethod, actualWeight, volWeight) {
  var m = normalizeMethodName(shippingMethod);
  var c = Math.max(actualWeight, volWeight);

  // ePacket が 2000g超なら Cpass-FedEx にフォールバック
  if (m === 'ePacket') return actualWeight <= 2000 ? getEpacketRate(actualWeight) : getCpassFedexRate(c);

  if (m === 'Cpass-FedEx')  return getCpassFedexRate(c);
  if (m === 'Cpass-DHL')    return getCpassDHLFinal(c);
  if (m === 'eLogistics')   return getElogiRate(c); // ← 新規追加

  // Airmail は将来削除予定だが、ここでは参照されない想定
  if (m === 'Airmail')      return getAirmailRate(actualWeight);

  // Economy のテーブルが無ければ Cpass-FedEx にフォールバック
  if (m === 'Cpass-Economy') {
    var ce = getShippingRateFromTable('CE', c);
    return ce ? applyShippingCalculations('CE', ce, c) : getCpassFedexRate(c);
  }

  // EMS のテーブルが無ければ Cpass-FedEx にフォールバック
  if (m === 'EMS') {
    var ems = getShippingRateFromTable('EMS', actualWeight);
    return ems ? ems : getCpassFedexRate(c);
  }

  // 既定も Cpass-DHL のまま（既存動作を保持）
  return getCpassDHLFinal(c);
}



/*━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  UDF：SHIPPING_COST（数値のみ返す）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━*/
function SHIPPING_COST(costYen, actualWeight, volWeight, shippingMethod, sizeString) {
  // 🆕 配列対応（ARRAYFORMULA用）
  if (Array.isArray(costYen)) {
    return costYen.map(function(cost, i) {
      var weight = Array.isArray(actualWeight) ? actualWeight[i] : actualWeight;
      var vol = Array.isArray(volWeight) ? volWeight[i] : volWeight;
      var method = Array.isArray(shippingMethod) ? shippingMethod[i] : shippingMethod;
      var size = Array.isArray(sizeString) ? sizeString[i] : sizeString;

      if (!cost || cost === '') return '';

      var parsedCostYen = parseFloat(cost);
      var parsedActualWeight = parseFloat(weight);
      var parsedVolWeight = parseFloat(vol);

      if (isNaN(parsedCostYen) || isNaN(parsedActualWeight) || isNaN(parsedVolWeight)) return 999999;

      try {
        if (method && method !== "" && method !== "自動選択") {
          return calculateSpecificMethodRate(method, parsedActualWeight, parsedVolWeight);
        }
        return selectCheapestShippingRateWithConstraints(parsedCostYen, parsedActualWeight, parsedVolWeight, size);
      } catch (e) {
        return 999999;
      }
    });
  }

  // 単一値の場合（従来通り）
  var parsedCostYen = parseFloat(costYen);
  var parsedActualWeight = parseFloat(actualWeight);
  var parsedVolWeight = parseFloat(volWeight);
  if (isNaN(parsedCostYen) || isNaN(parsedActualWeight) || isNaN(parsedVolWeight)) return 999999;

  try {
    if (shippingMethod && shippingMethod !== "" && shippingMethod !== "自動選択") {
      return calculateSpecificMethodRate(shippingMethod, parsedActualWeight, parsedVolWeight);
    }
    return selectCheapestShippingRateWithConstraints(parsedCostYen, parsedActualWeight, parsedVolWeight, sizeString);
  } catch (e) {
    return 999999;
  }
}
