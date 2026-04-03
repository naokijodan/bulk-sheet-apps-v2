# 送料モード分岐 共通関数化 + 既存バグ修正 設計書

## 3者協議日: 2026-03-28
## ステータス: 承認済み（v2 — Formula Factory方式）

---

## 1. 背景

送料計算モードの処理が2系統あり、系統Bに既存バグがある。

| 系統 | 処理内容 | 対応状況 |
|------|---------|---------|
| A: applyCalculationFormulas() | 初期設定・式再出力で全行一括セット | 4モード対応済み |
| B: setFormulas() / batchCalculateFormulas() | AI翻訳後に個別行・バッチでセット | **FIXED/それ以外の2分岐のみ（バグ）** |

さらに、AJ5の「日本語ラベル→内部コード」変換が4箇所に散在しており、モード追加のたびに修正漏れが発生する（今回も発覚）。

### 3者協議の結論
- 式を各所で個別に書くのは「1文字のタイポで送料計算が狂う」致命的リスク
- **式生成を共通関数（Formula Factory）に集約**し、全系統が同じ関数から式を取得する
- ラベル変換も共通関数化する

---

## 2. 修正対象（全8箇所 + 共通関数3つ新規作成）

### 新規作成: 共通関数3つ（Utils.gsに追加）

| 関数 | 役割 |
|------|------|
| getShippingCalcMethodFromLabel_(sheet) | AJ5日本語ラベル → 内部コード変換 |
| getLabelFromShippingCalcMethod_(code) | 内部コード → 日本語ラベル変換 |
| buildShippingFormulas_(row, shippingCalcMethod) | **式生成Factory** — モードに応じたT列・F列の式を返す |

### グループA: ラベル変換の一元化（6箇所）

| # | ファイル | 行 | 内容 | 修正 |
|---|---------|-----|------|------|
| 1 | コード_Part1 | 3538-3539 | saveAndClearRows AJ5読み取り | 共通関数に置換 |
| 2 | コード_Part1 | 3770-3771 | clearAndReapplyFormulas AJ5読み取り | 共通関数に置換 |
| 3 | コード_Part3 | 3047-3055 | saveIntegratedSettings AJ5読み取り | 共通関数に置換 |
| 4 | コード_Part3 | 4211-4212 | reapplyFormulas AJ5読み取り | 共通関数に置換 |
| 5 | コード_Part3 | 3366 | writeSettingsToSheet 日本語変換 | 共通関数に置換 |
| 6 | コード_Part3 | 3098 | ログメッセージ 日本語変換 | 共通関数に置換 |

### グループB: T列・F列の式セット修正（2箇所）— Formula Factory使用

| # | ファイル | 行 | 内容 | 修正 |
|---|---------|-----|------|------|
| 7 | コード_Part1 | 760-772 | setFormulas() T列式セット | buildShippingFormulas_()を使用 |
| 8 | コード_Part1 | 3321-3348 | batchCalculateFormulas() T列式セット | buildShippingFormulas_()を使用 |

### グループC: applyCalculationFormulas()のリファクタリング

| # | ファイル | 行 | 内容 | 修正 |
|---|---------|-----|------|------|
| 9 | コード_Part3 | 3729-3787 | T列式生成の4モード分岐 | buildShippingFormulas_()を使用に置換 |

**重要**: 箇所9は「動作を変える」のではなく、既に動いている式生成ロジックをbuildShippingFormulas_()に移設する。移設後、箇所7-8も同じ関数を使うことで**式の一致が物理的に保証される**。

---

## 3. 共通関数の詳細設計

### 関数1: getShippingCalcMethodFromLabel_(sheet)

```javascript
/**
 * AJ5セルの日本語ラベルを内部コードに変換する
 * @param {Sheet} sheet - 作業シート
 * @return {string} 内部コード（TABLE/FIXED/GAME_CARD/TAG_SHIPPING）
 */
function getShippingCalcMethodFromLabel_(sheet) {
  var LABEL_TO_CODE = {
    'テーブル計算': 'TABLE',
    '固定金額': 'FIXED',
    'ゲーム・トレカ': 'GAME_CARD',
    'タグ別送料': 'TAG_SHIPPING'
  };
  var label = String(sheet.getRange('AJ5').getValue()).trim();
  var code = LABEL_TO_CODE[label];
  if (!code) {
    Logger.log('[getShippingCalcMethodFromLabel_] 不明なラベル: "' + label + '" → TABLEにフォールバック');
    return 'TABLE';
  }
  return code;
}
```

### 関数2: getLabelFromShippingCalcMethod_(code)

```javascript
/**
 * 内部コードを日本語ラベルに変換する
 * @param {string} code - 内部コード
 * @return {string} 日本語ラベル
 */
function getLabelFromShippingCalcMethod_(code) {
  var CODE_TO_LABEL = {
    'TABLE': 'テーブル計算',
    'FIXED': '固定金額',
    'GAME_CARD': 'ゲーム・トレカ',
    'TAG_SHIPPING': 'タグ別送料'
  };
  return CODE_TO_LABEL[code] || 'テーブル計算';
}
```

### 関数3: buildShippingFormulas_(row, shippingCalcMethod) — Formula Factory

```javascript
/**
 * 送料モードに応じたT列・F列の式を生成する（Single Source of Truth）
 * applyCalculationFormulas / setFormulas / batchCalculateFormulas の全てがこの関数を使う
 *
 * @param {number} row - 行番号
 * @param {string} shippingCalcMethod - 内部コード（TABLE/FIXED/GAME_CARD/TAG_SHIPPING）
 * @return {Object} { shippingFormula: string, refEbayFormula: string|null, isValue: boolean, value: number|null }
 *   - shippingFormula: T列に入れる式（文字列）。isValue=trueの場合はnull
 *   - refEbayFormula: F列に入れる式（TAG_SHIPPING時のみ。それ以外はnull）
 *   - isValue: trueの場合はT列に値（value）を入れる（FIXED用）
 *   - value: isValue=true時の値（FIXED用）
 */
function buildShippingFormulas_(row, shippingCalcMethod) {
  if (shippingCalcMethod === 'FIXED') {
    // 固定金額: 式ではなくJ1参照の式を返す
    return {
      shippingFormula: '=IF(I' + row + '="","",IF($J$1<>"", $J$1, VLOOKUP(I' + row + ',Profit_Amounts!$A$2:$D$8,4,TRUE)))',
      refEbayFormula: null,
      isValue: false,
      value: null
    };
  }

  if (shippingCalcMethod === 'GAME_CARD') {
    // ゲーム・トレカ: 仕入値で固定/テーブル計算を切り替え
    var tableFormula = 'IF(X' + row + '="CF",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$1,subtotal,base+extra,fuel,subtotal*$V$1,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),IF(X' + row + '="CD",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$2,subtotal,base+extra,fuel,subtotal*$V$2,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),ROUND(AF' + row + ')))';
    return {
      shippingFormula: '=IF(I' + row + '="","",IF(OR($AJ$4="",$AJ$4<=0),' + tableFormula + ',IF(I' + row + '<=$AJ$4,$J$1,' + tableFormula + ')))',
      refEbayFormula: null,
      isValue: false,
      value: null
    };
  }

  if (shippingCalcMethod === 'TAG_SHIPPING') {
    // タグ別送料: TagShippingシートからINDEX/MATCH
    var tsName = CONFIG.TAG_SHIPPING.SHEET_NAME;
    return {
      shippingFormula: '=IF(D' + row + '="","",IF(X' + row + '="","#配送方法未設定",IFERROR(INDEX(' + tsName + '!B:D,MATCH(D' + row + ',' + tsName + '!A:A,0),SWITCH(X' + row + ',"EP",1,"ePacket",1,"CE",2,"Cpass-Economy",2,"CF",3,"Cpass-FedEx",3,"CD",3,"Cpass-DHL",3,"EL",3,"eLogistics",3)),"#タグ未登録")))',
      refEbayFormula: '=IF(D' + row + '="","",IFERROR(INDEX(' + tsName + '!E:E,MATCH(D' + row + ',' + tsName + '!A:A,0)),""))',
      isValue: false,
      value: null
    };
  }

  // TABLE（デフォルト）: 配送方法に応じた計算
  var formula = '=IF(AF' + row + '="","",IF(X' + row + '="CF",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$1,subtotal,base+extra,fuel,subtotal*$V$1,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),IF(X' + row + '="CD",ROUND(LET(base,AF' + row + ',extra,MAX(0,(CEILING(AC' + row + '/500)*500-500)/500)*$Y$2,subtotal,base+extra,fuel,subtotal*$V$2,discount,-(subtotal+fuel)*$W$2,subtotal+fuel+discount)),ROUND(AF' + row + '))))';
  return {
    shippingFormula: formula,
    refEbayFormula: null,
    isValue: false,
    value: null
  };
}
```

**重要な設計判断:**
- FIXEDモードの式もbuildShippingFormulas_()に含める（applyCalculationFormulasで使っている式と完全一致させるため）
- ただしsetFormulas()でFIXED時にJ1から直接値を取ってsetValue()する既存処理は、パフォーマンス上の理由で残す（式ではなく値を入れるケースのみ）
- TABLE/GAME_CARDの式はapplyCalculationFormulas()の3729-3787行から**そのまま移植**する

---

## 4. 各箇所の修正内容

### 箇所1-2: コード_Part1のAJ5読み取り（2箇所）

変更前（両方同じ）:
```javascript
var shippingCalcText = sheet.getRange('AJ5').getValue();
var shippingCalc = (shippingCalcText === '固定金額') ? 'FIXED' : (shippingCalcText === 'ゲーム・トレカ') ? 'GAME_CARD' : (shippingCalcText === 'タグ別送料') ? 'TAG_SHIPPING' : 'TABLE';
```

変更後:
```javascript
var shippingCalc = getShippingCalcMethodFromLabel_(sheet);
```

### 箇所3: コード_Part3 saveIntegratedSettings内

変更前（3044-3057行）:
```javascript
var actualShippingCalcMethod = shippingCalcMethod;
if (sheet) {
  var aj5Value = sheet.getRange('AJ5').getValue();
  if (aj5Value === 'ゲーム・トレカ') {
    actualShippingCalcMethod = 'GAME_CARD';
  } else if (aj5Value === 'タグ別送料') {
    actualShippingCalcMethod = 'TAG_SHIPPING';
  } else if (aj5Value === '固定金額') {
    actualShippingCalcMethod = 'FIXED';
  } else {
    actualShippingCalcMethod = 'TABLE';
  }
  Logger.log('AJ5の値: ' + aj5Value + ' → shippingCalcMethod: ' + actualShippingCalcMethod);
}
```

変更後:
```javascript
var actualShippingCalcMethod = shippingCalcMethod;
if (sheet) {
  actualShippingCalcMethod = getShippingCalcMethodFromLabel_(sheet);
}
```

### 箇所4: コード_Part3 reapplyFormulas内

変更前（4211-4212行）:
```javascript
var shippingCalcText = sheet.getRange('AJ5').getValue();
var shippingCalc = (shippingCalcText === '固定金額') ? 'FIXED' : (shippingCalcText === 'ゲーム・トレカ') ? 'GAME_CARD' : (shippingCalcText === 'タグ別送料') ? 'TAG_SHIPPING' : 'TABLE';
```

変更後:
```javascript
var shippingCalc = getShippingCalcMethodFromLabel_(sheet);
```

### 箇所5: コード_Part3 writeSettingsToSheet

変更前（3366行）:
```javascript
['送料計算方法', settings.shippingCalcMethod === 'TABLE' ? 'テーブル計算' : settings.shippingCalcMethod === 'TAG_SHIPPING' ? 'タグ別送料' : '固定金額']
```

変更後:
```javascript
['送料計算方法', getLabelFromShippingCalcMethod_(settings.shippingCalcMethod)]
```

### 箇所6: コード_Part3 ログメッセージ

変更前（3098行）:
```javascript
'送料計算: ' + (shippingCalcMethod === 'TABLE' ? 'テーブル計算' : '固定金額') + '\n' +
```

変更後:
```javascript
'送料計算: ' + getLabelFromShippingCalcMethod_(shippingCalcMethod) + '\n' +
```

### 箇所7: コード_Part1 setFormulas() — T列・F列の式セット

変更前（760-772行）:
```javascript
if (settings.shippingCalculationMethod === 'FIXED') {
  var fixed = sheet.getRange("J1").getValue();
  if (!fixed || isNaN(fixed)) fixed = getShippingCostByCost(...);
  sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setValue(fixed);
} else {
  sheet.getRange(row, CONFIG.COLUMNS.SHIPPING)
    .setFormula('=SHIPPING_COST(I' + row + ',Y' + row + ',AC' + row + ',X' + row + ',AC' + row + ')');
}
```

変更後:
```javascript
if (settings.shippingCalculationMethod === 'FIXED') {
  // FIXED: パフォーマンスのためJ1から直接値を取得（翻訳時のみ）
  var fixed = sheet.getRange("J1").getValue();
  if (!fixed || isNaN(fixed)) fixed = getShippingCostByCost(sheet.getRange(row, CONFIG.COLUMNS.COST_YEN).getValue());
  sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setValue(fixed);
} else {
  // TABLE/GAME_CARD/TAG_SHIPPING: Formula Factoryから式を取得
  var formulas = buildShippingFormulas_(row, settings.shippingCalculationMethod);
  sheet.getRange(row, CONFIG.COLUMNS.SHIPPING).setFormula(formulas.shippingFormula);
  if (formulas.refEbayFormula) {
    sheet.getRange(row, CONFIG.COLUMNS.REF_EBAY).setFormula(formulas.refEbayFormula);
  }
}
```

### 箇所8: コード_Part1 batchCalculateFormulas() — T列・F列の式セット

変更前（3321-3348行）:
```javascript
if (settings.shippingCalculationMethod === 'FIXED') {
  // 固定値を配列に
} else {
  // SHIPPING_COST()式を配列に
}
```

変更後:
```javascript
if (settings.shippingCalculationMethod === 'FIXED') {
  // 固定値を配列に（既存処理維持）
} else {
  // Formula Factoryから式を取得して配列に
  var shippingFormulas = [];
  var refFormulas = [];
  var hasRefFormulas = false;
  for (var row = minRow; row <= maxRow; row++) {
    if (batchRowsSet[row]) {
      var formulas = buildShippingFormulas_(row, settings.shippingCalculationMethod);
      shippingFormulas.push([formulas.shippingFormula]);
      if (formulas.refEbayFormula) {
        refFormulas.push([formulas.refEbayFormula]);
        hasRefFormulas = true;
      } else {
        refFormulas.push(['']);  // 行数を合わせるためダミー
      }
    }
  }
  sheet.getRange(minRow, CONFIG.COLUMNS.SHIPPING, rowCount, 1).setFormulas(shippingFormulas);
  if (hasRefFormulas) {
    sheet.getRange(minRow, CONFIG.COLUMNS.REF_EBAY, rowCount, 1).setFormulas(refFormulas);
  }
}
```

### 箇所9: コード_Part3 applyCalculationFormulas() — T列式生成をFactory使用に置換

変更前（3729-3787行）: 4つのif/else if分岐で直接式を構築

変更後:
```javascript
// T列: 送料（Formula Factoryで式を生成）
sheet.getRange('T4').setValue('送料');
if (shippingCalc === 'TAG_SHIPPING') {
  ensureTagShippingSheet_(ss);
}
var shippingFormulas = [];
var refFormulas = [];
var hasRefFormulas = false;
for (var row = 5; row <= dataLastRow; row++) {
  var formulas = buildShippingFormulas_(row, shippingCalc);
  shippingFormulas.push([formulas.shippingFormula]);
  if (formulas.refEbayFormula) {
    refFormulas.push([formulas.refEbayFormula]);
    hasRefFormulas = true;
  }
}
if (shippingFormulas.length > 0) {
  sheet.getRange(5, CONFIG.COLUMNS.SHIPPING, shippingFormulas.length, 1).setFormulas(shippingFormulas);
}
if (hasRefFormulas && refFormulas.length > 0) {
  sheet.getRange(5, CONFIG.COLUMNS.REF_EBAY, refFormulas.length, 1).setFormulas(refFormulas);
}
```

---

## 5. 安全性の保証

### なぜ壊れないか

1. **式の一致が物理的に保証される**: 全系統がbuildShippingFormulas_()から式を取得する。コピペ不一致が起きない
2. **TABLE/FIXEDの既存ユーザーに影響しない**: TABLE式はapplyCalculationFormulas()で使っていた式をそのままFactory関数に移植するだけ。FIXEDはsetValue()の既存処理を維持
3. **段階的に検証できる**: Step 1（共通関数追加）→ Step 2（ラベル変換置換）→ Step 3（Factory使用）の順で、各ステップごとにレビューし、問題があれば即git restoreで戻せる

### リスクと対策

| リスク | 対策 |
|--------|------|
| Factory関数の式にタイポ | applyCalculationFormulas()の既存コードからコピペで移植。独自に書き起こさない |
| batchのF列配列の行数ずれ | hasRefFormulasフラグでTAG_SHIPPING時のみF列を処理。ダミー行で行数を合わせる |
| getShippingCalcMethodFromLabel_のtrim()が予期せぬ影響 | GASのgetValue()は通常trimされた値を返すため影響なし。安全側の対策 |

---

## 6. 修正しないもの

| 項目 | 理由 |
|------|------|
| Assistant.gs のヘルプテキスト | スコープ外（動作に影響なし、別タスクで対応） |
| AJ5を内部コード保存に変更 | 既存UI互換性の問題。将来のリファクタリング候補 |
| 名前付き範囲の導入 | スコープ外。現在の要件では過剰 |

---

## 7. Library同期対象

| ルート | Library |
|--------|---------|
| Utils.gs | Library/Utils.gs |
| コード_Part1_価格計算・バッチ処理.gs | Library/コード_Part1_価格計算・バッチ処理.gs |
| コード_Part3_メニュー・設定関連.gs | Library/コード_Part3_メニュー・設定関連.gs |

---

## 8. テスト項目（手動確認）

修正後、以下を全てスプレッドシート上で確認する:

1. **TABLE**: 初期設定→翻訳実行→T列がテーブル計算式のまま維持されること
2. **FIXED**: 初期設定→翻訳実行→T列が固定値のまま維持されること
3. **GAME_CARD**: 初期設定→翻訳実行→T列が条件分岐式のまま維持されること
4. **TAG_SHIPPING**: 初期設定→翻訳実行→T列がINDEX/MATCH式、F列が参考eBay ID式のまま維持されること
5. **式再出力**: 全4モードで「計算式を再出力」が正しく動作すること
6. **行クリア→再設定**: 全4モードで正しい式が復元されること
7. **モード切替**: TAG_SHIPPING→TABLE切替でF列の式がクリアされること

---

## 9. 実装ステップ

| Step | 内容 | レビュー |
|------|------|---------|
| 1 | Utils.gsに共通関数3つを追加 | Claude+Gemini |
| 2 | グループA（箇所1-6）を共通関数呼び出しに置換 | Claude+Gemini |
| 3 | グループB+C（箇所7-9）をFormula Factory使用に置換 | Claude+Gemini |
| 4 | Library同期 + ScriptPropertiesチェック | Claude |
| 5 | コミット・プッシュ + clasp push | — |
