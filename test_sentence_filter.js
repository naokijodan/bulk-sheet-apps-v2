// 文単位フィルタのテスト
// V7結果で残った問題パターンが、文単位削除で解決されるか検証

// 禁止カテゴリ辞書
var FORBIDDEN_CATEGORIES = [
  // warranty/guarantee系
  'warranty', 'guarantee', 'guaranteed', 'guarantees', 'certificate', 'certify',
  // shipping/delivery系
  'shipping', 'delivery', 'dispatch', 'postage', 'courier', 'packaging', 'packed',
  // returns/refund系
  'refund', 'return', 'returns', 'no claim', 'no claims', 'as-is',
  // 購入履歴系
  'purchased', 'bought', 'recycle shop', 'secondhand shop', 'thrift shop', 'sourced from',
  // 売り手ポリシー系
  'private sale', 'seller policy', 'seller states', 'seller mentions',
  'please replace', 'please confirm',
  // 使用履歴系
  'used a few times', 'used several times', 'worn a few times', 'worn several times'
];

function sentenceFilter(text) {
  if (!text) return '';
  // 文単位で分割（ピリオド、感嘆符、疑問符で区切る）
  var sentences = text.split(/(?<=[.!?])\s+/);
  var cleaned = [];
  for (var i = 0; i < sentences.length; i++) {
    var sentence = sentences[i];
    var lower = sentence.toLowerCase();
    var isForbidden = false;
    for (var j = 0; j < FORBIDDEN_CATEGORIES.length; j++) {
      if (lower.indexOf(FORBIDDEN_CATEGORIES[j]) !== -1) {
        isForbidden = true;
        break;
      }
    }
    if (!isForbidden) {
      cleaned.push(sentence);
    }
  }
  return cleaned.join(' ').replace(/\s{2,}/g, ' ').trim();
}

// V7結果で残った問題パターンをテスト
var testCases = [
  {
    name: '行19: belt is new',
    input: 'This Casio G Shock G5600 wristwatch features solar power and digital display. The external belt is new. No box or manual included.',
    expected: 'belt is new が含まれる文が削除されない（newは禁止カテゴリに入っていないため）'
  },
  {
    name: '行23: new cell',
    input: 'This watch has been cleaned and tested. The battery has been replaced with a new cell. Analog display with date function.',
    expected: 'new cell が含まれる文が削除されない（newは禁止カテゴリに入っていないため）'
  },
  {
    name: '行54: strap is new aftermarket',
    input: 'This vintage watch shows wear. The strap is new aftermarket with a genuine buckle. Case diameter 38mm.',
    expected: 'new aftermarket が含まれる文が削除されない'
  },
  {
    name: '行57: no waterproof warranty',
    input: 'Seiko diver watch with 200m water resistance. Running but no waterproof warranty. Wrist 19cm max.',
    expected: 'warranty を含む文が丸ごと削除される'
  },
  {
    name: '行24: returns not offered',
    input: 'Casio G Shock digital watch with world time. Tested working in home environment. Returns not offered. Wrist size 21cm.',
    expected: 'returns を含む文が丸ごと削除される'
  },
  {
    name: '行108: after shipping',
    input: 'Orient automatic watch with day date display. Status unknown after shipping. This wristwatch is a vintage model.',
    expected: 'shipping を含む文が丸ごと削除される'
  },
  {
    name: '行79: sourced from recycle shop',
    input: 'This watch has been sourced from major recycle shops with AACD membership. Analog display with luminous hands.',
    expected: 'sourced from を含む文が丸ごと削除される'
  },
  {
    name: '正常な文が残るかテスト',
    input: 'This Seiko Prospex automatic diver watch features a 42mm case. Stainless steel band with analog display. Water resistance 200m. Battery Replaced and running condition.',
    expected: '全ての文が残る（禁止ワードなし）'
  },
  {
    name: 'warrantyが付属品文脈で使われるケース',
    input: 'This watch includes box and instruction booklet with warranty. Analog display timepiece.',
    expected: 'warranty を含む文が丸ごと削除される → bookletの情報も消える（副作用）'
  }
];

// 個別replace（既存パターンの一部を再現）
function individualReplace(text) {
  if (!text) return '';
  // warranty系 → includes papers
  text = text.replace(/warranty\s+card/gi, 'includes papers');
  text = text.replace(/warranty\s+certificate/gi, 'includes papers');
  text = text.replace(/warranty\s+booklet/gi, 'includes papers');
  text = text.replace(/warranty\s+book/gi, 'includes papers');
  text = text.replace(/\bbooklet\s+with\s+warranty\b/gi, 'includes papers');
  text = text.replace(/\bwith\s+warranty\b/gi, 'includes papers');
  text = text.replace(/guarantee\s+card/gi, 'includes papers');
  // new系 → 変換
  text = text.replace(/\bnew\s+battery\b/gi, 'Battery Replaced');
  text = text.replace(/\bbattery\s+is\s+new\b/gi, 'Battery Replaced');
  text = text.replace(/\breplaced\s+with\s+a\s+new\s+cell\b/gi, 'Battery Replaced');
  text = text.replace(/\bnew\s+cell\b/gi, 'Battery Replaced');
  text = text.replace(/\bnew\s+external\s+strap\b/gi, 'replacement strap');
  text = text.replace(/\bnew\s+aftermarket\b/gi, 'aftermarket replacement');
  text = text.replace(/\bnew\s+strap\b/gi, 'replacement strap');
  text = text.replace(/\bnew\s+band\b/gi, 'replacement band');
  text = text.replace(/\bbelt\s+is\s+new\b/gi, 'belt replaced');
  text = text.replace(/\bstrap\s+is\s+new\b/gi, 'strap replaced');
  text = text.replace(/\bband\s+is\s+new\b/gi, 'band replaced');
  // waterproof warranty
  text = text.replace(/\bno\s+waterproof\s+warranty\b/gi, '');
  text = text.replace(/\bwaterproof\s+warranty\b/gi, '');
  // returns
  text = text.replace(/\breturns?\s+not\s+offered\b/gi, '');
  text = text.replace(/\breturns?\s+not\s+accepted\b/gi, '');
  return text;
}

// 統合テスト: 個別replace → 文単位フィルタ → クリーンアップ
function fullPipeline(text) {
  // Step 1: 個別replace
  text = individualReplace(text);
  // Step 2: 文単位フィルタ
  text = sentenceFilter(text);
  // Step 3: クリーンアップ
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim();
  return text;
}

console.log('=== テスト1: 文単位フィルタ単体 ===\n');
for (var t = 0; t < testCases.length; t++) {
  var tc = testCases[t];
  var result = sentenceFilter(tc.input);
  console.log('【' + tc.name + '】');
  console.log('入力: ' + tc.input);
  console.log('出力: ' + result);
  console.log('---');
}

console.log('\n=== テスト2: 個別replace → 文単位フィルタ（統合パイプライン） ===\n');
for (var t2 = 0; t2 < testCases.length; t2++) {
  var tc2 = testCases[t2];
  var result2 = fullPipeline(tc2.input);
  console.log('【' + tc2.name + '】');
  console.log('入力: ' + tc2.input);
  console.log('出力: ' + result2);
  console.log('---');
}

// パイプラインB: 変換のみreplace → 文単位フィルタ（削除は文単位に任せる）
function conversionOnlyReplace(text) {
  if (!text) return '';
  // 変換のみ（warranty系→includes papers）
  text = text.replace(/warranty\s+card/gi, 'includes papers');
  text = text.replace(/warranty\s+certificate/gi, 'includes papers');
  text = text.replace(/warranty\s+booklet/gi, 'includes papers');
  text = text.replace(/warranty\s+book/gi, 'includes papers');
  text = text.replace(/\bbooklet\s+with\s+warranty\b/gi, 'includes papers');
  text = text.replace(/\bwith\s+warranty\b/gi, 'includes papers');
  text = text.replace(/guarantee\s+card/gi, 'includes papers');
  // 変換のみ（new系→replaced等）
  text = text.replace(/\breplaced\s+with\s+a\s+new\s+cell\b/gi, 'Battery Replaced');
  text = text.replace(/\bnew\s+battery\b/gi, 'Battery Replaced');
  text = text.replace(/\bbattery\s+is\s+new\b/gi, 'Battery Replaced');
  text = text.replace(/\bnew\s+cell\b/gi, 'Battery Replaced');
  text = text.replace(/\bnew\s+external\s+strap\b/gi, 'replacement strap');
  text = text.replace(/\bnew\s+aftermarket\b/gi, 'aftermarket replacement');
  text = text.replace(/\bnew\s+strap\b/gi, 'replacement strap');
  text = text.replace(/\bnew\s+band\b/gi, 'replacement band');
  text = text.replace(/\bbelt\s+is\s+new\b/gi, 'belt replaced');
  text = text.replace(/\bstrap\s+is\s+new\b/gi, 'strap replaced');
  text = text.replace(/\bband\s+is\s+new\b/gi, 'band replaced');
  // CJK除去
  text = text.replace(/[^\x00-\x7F]/g, '');
  return text;
}

function pipelineB(text) {
  // Step 1: 変換のみreplace
  text = conversionOnlyReplace(text);
  // Step 2: 文単位フィルタ（削除はここで行う）
  text = sentenceFilter(text);
  // Step 3: クリーンアップ
  text = text.replace(/\s{2,}/g, ' ').replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim();
  return text;
}

console.log('\n=== テスト3: パイプラインB（変換のみreplace → 文単位フィルタで削除） ===\n');
for (var t3 = 0; t3 < testCases.length; t3++) {
  var tc3 = testCases[t3];
  var result3 = pipelineB(tc3.input);
  console.log('【' + tc3.name + '】');
  console.log('入力: ' + tc3.input);
  console.log('出力: ' + result3);
  console.log('---');
}

// 追加テストケース: 文単位フィルタで未知のパターンが捕捉されるか
var unknownPatterns = [
  {
    name: '未知パターン: warranty in different context',
    input: 'This watch features analog display. No international warranty is provided for this item. Case diameter 40mm.'
  },
  {
    name: '未知パターン: shipped with care',
    input: 'Seiko automatic watch with 42mm case. Item will be shipped with care and bubble wrap. Stainless steel band.'
  },
  {
    name: '未知パターン: purchased at department store',
    input: 'Omega Seamaster automatic diver watch. Originally purchased at a department store in Tokyo. 300m water resistance.'
  },
  {
    name: '未知パターン: guarantee period expired',
    input: 'Citizen Eco Drive solar watch 43mm. The guarantee period has expired. Includes box and manual.'
  },
  {
    name: '未知パターン: no returns on used items',
    input: 'Hamilton Khaki field watch automatic 38mm. Please note no returns on used items. Analog display.'
  },
  {
    name: '未知パターン: delivery time',
    input: 'Tissot PRX automatic 40mm blue dial. Expected delivery time is 3-5 business days. Swiss made timepiece.'
  },
  {
    name: 'warranty含む文が消えても付属品情報は別文で残るケース',
    input: 'This Seiko watch includes box and manual. Warranty details are not available. Analog display with day date.'
  }
];

console.log('\n=== テスト4: 未知パターンへの対応力（パイプラインB） ===\n');
for (var t4 = 0; t4 < unknownPatterns.length; t4++) {
  var tc4 = unknownPatterns[t4];
  var result4 = pipelineB(tc4.input);
  console.log('【' + tc4.name + '】');
  console.log('入力: ' + tc4.input);
  console.log('出力: ' + result4);
  console.log('---');
}
