const fs = require('fs');
const path = require('path');
const src = path.join(__dirname, 'research_brands.json');
const j = JSON.parse(fs.readFileSync(src, 'utf8'));
const arr = [];
Object.keys(j.categories || {}).forEach(function (cat) {
  var brands = (j.categories[cat] && j.categories[cat].brands) || [];
  for (var i = 0; i < brands.length; i++) {
    var b = brands[i] || {};
    arr.push({ name: b.name || '', jp_names: b.jp_names || [], country: b.country || '' });
  }
});
function q(s) {
  return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'';
}
var out = 'var IS_BRAND_DICT = [\n';
for (var i = 0; i < arr.length; i++) {
  var b = arr[i];
  out += '  {name: ' + q(b.name) + ', jp_names: [' + b.jp_names.map(q).join(', ') + '], country: ' + q(b.country) + '},\n';
}
out += '];\n';
process.stdout.write(out);

