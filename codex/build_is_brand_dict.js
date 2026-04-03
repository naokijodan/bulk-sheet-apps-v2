// Build comprehensive IS_BRAND_DICT from brands_raw.txt plus additions
// Outputs ES5-compatible array with category comment sections
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function readBrandsRaw(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const code = 'arr = [\n' + raw + '\n]; arr;';
  const ctx = { arr: [] };
  return vm.runInNewContext(code, ctx, { timeout: 1000 });
}

function uniq(arr) {
  var seen = Object.create(null);
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var v = String(arr[i]);
    if (!seen[v]) { seen[v] = true; out.push(v); }
  }
  return out;
}

function addlBrands() {
  return [
    // === Video Games ===
    {name: 'Nintendo', jp_names: ['任天堂', 'ニンテンドー', 'NINTENDO'], country: 'Japan'},
    {name: 'Sony PlayStation', jp_names: ['プレイステーション', 'プレステ', 'PLAYSTATION', 'PS5', 'PS4'], country: 'Japan'},
    {name: 'Sega', jp_names: ['セガ', 'SEGA'], country: 'Japan'},
    {name: 'Bandai Namco', jp_names: ['バンダイナムコ', 'バンナム', 'BANDAI NAMCO'], country: 'Japan'},
    {name: 'Capcom', jp_names: ['カプコン', 'CAPCOM'], country: 'Japan'},
    {name: 'Konami', jp_names: ['コナミ', 'KONAMI'], country: 'Japan'},
    {name: 'Gundam (Gunpla)', jp_names: ['ガンダム', 'ガンプラ', 'GUNDAM', 'GUNPLA'], country: 'Japan'},
    // === Automotive ===
    {name: 'Toyota', jp_names: ['トヨタ', 'TOYOTA'], country: 'Japan'},
    {name: 'Honda', jp_names: ['ホンダ', 'HONDA'], country: 'Japan'},
    {name: 'Nissan', jp_names: ['日産', 'ニッサン', 'NISSAN'], country: 'Japan'},
    // === Beauty ===
    {name: 'Shiseido', jp_names: ['資生堂', 'シセイドウ', 'SHISEIDO'], country: 'Japan'},
    {name: 'SK-II', jp_names: ['エスケーツー', 'SK-II', 'SK2'], country: 'Japan'},
    {name: 'KOSE', jp_names: ['コーセー', 'KOSE'], country: 'Japan'},
    // === Clothing (alias) ===
    {name: 'A Bathing Ape', jp_names: ['ベイプ', 'BAPE', 'A BATHING APE', 'アベイシングエイプ'], country: 'Japan'}
  ];
}

function loadResearchMap() {
  const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'research_brands.json'), 'utf8'));
  var map = Object.create(null);
  var cats = j.categories || {};
  Object.keys(cats).forEach(function (cat) {
    var brands = (cats[cat] && cats[cat].brands) || [];
    for (var i = 0; i < brands.length; i++) {
      var nm = String(brands[i].name || '');
      if (nm && !map[nm]) map[nm] = cat;
    }
  });
  return map;
}

function mapResearchCatToFinal(cat) {
  if (cat === 'Watches') return 'Watches';
  if (cat === 'Jewelry') return 'Jewelry & Accessories';
  if (cat === 'Bags') return 'Bags';
  if (cat === 'Clothing') return 'Clothing & Fashion';
  if (cat === 'Shoes') return 'Shoes';
  if (cat === 'Cameras') return 'Cameras & Lenses';
  if (cat === 'Cell Phones') return 'Electronics & Audio';
  if (cat === 'Trading Cards') return 'Trading Cards';
  if (cat === 'Video Games') return 'Video Games';
  if (cat === 'Figures & Collectibles') return 'Figures & Collectibles';
  if (cat === 'Pottery') return 'Pottery & Porcelain';
  if (cat === 'Musical Instruments') return 'Musical Instruments';
  if (cat === 'Sporting Goods') return 'Sporting Goods';
  if (cat === 'Automotive') return 'Automotive';
  if (cat === 'Beauty') return 'Beauty';
  if (cat === 'Toys') return 'Toys & Models';
  return '';
}

function hardCategory(name) {
  // Manual overrides and heuristics for uncategorized brands
  var n = String(name);
  // Rule-based overrides from instructions
  if (n === 'Cartier') return 'Watches';
  if (n === 'Yamaha') return 'Musical Instruments';
  if (n === 'Sony') return 'Electronics & Audio';
  if (n === 'Casio') return 'Watches';

  // Watches
  var watchSet = {
    'Seiko':1,'Grand Seiko':1,'G-Shock':1,'Citizen':1,'Orient':1,'Rolex':1,'Omega':1,'TAG Heuer':1,'IWC':1,
    'Patek Philippe':1,'Audemars Piguet':1,'Tudor':1,'Longines':1,'Panerai':1,'Hamilton':1,'Bell & Ross':1,
    'Baume & Mercier':1,'Blancpain':1,'Breguet':1,'Breitling':1,'Bulova':1,'Campanola':1,'Credor':1,
    'Frederique Constant':1,'Ball Watch':1
  };
  if (watchSet[n]) return 'Watches';

  // Jewelry & Accessories
  var jewelrySet = {
    'Mikimoto':1,'Tasaki':1,'Tiffany & Co.':1,'Bvlgari':1,'Van Cleef & Arpels':1,'Chrome Hearts':1,'Vivienne Westwood':1,
    'Harry Winston':1,'Chopard':1,'Swarovski':1,'Pandora':1,'David Yurman':1,'Ahkah':1,'Agete':1,'Ete':1,'4℃':1,
    'Boucheron':1,'Chaumet':1,'Damiani':1,'Fred':1,'Bill Wall Leather':1,'Cody Sanderson':1,'Justin Davis':1
  };
  if (jewelrySet[n]) return 'Jewelry & Accessories';

  // Bags
  var bagSet = {
    'Louis Vuitton':1,'Gucci':1,'Chanel':1,'Hermes':1,'Porter':1,'Coach':1,'Prada':1,'Celine':1,'Fendi':1,
    'Balenciaga':1,'Bottega Veneta':1,'Loewe':1,'Burberry':1,'Dior':1,'Saint Laurent':1,'Goyard':1,'Anello':1,
    'BRIEFING':1
  };
  if (bagSet[n]) return 'Bags';

  // Clothing & Fashion
  var clothingSet = {
    'Comme des Garcons':1,'Comme des Garcons Play':1,'Issey Miyake':1,'Yohji Yamamoto':1,'A Bathing Ape':1,
    'BAPE':1,'Supreme':1,'Beams':1,'Neighborhood':1,'WTAPS':1,'Visvim':1,'Human Made':1,'Undercover':1,'Sacai':1,
    'Kenzo':1,'Fragment':1,'Evisu':1,'Mastermind Japan':1,'The North Face Purple Label':1,'Canada Goose':1,
    'Dolce Gabbana':1,'Balenciaga':1,'Burberry':1,'Chloe':1,'Celine':1
  };
  if (clothingSet[n]) return 'Clothing & Fashion';

  // Shoes
  var shoesSet = {
    'Nike':1,'Adidas':1,'New Balance':1,'ASICS':1,'Onitsuka Tiger':1,'Converse':1,'Vans':1,'Mizuno':1,
    'Puma':1,'Reebok':1,'Jordan':1,'Salomon':1,'Dr. Martens':1,'Clarks':1,'Birkenstock':1,'Crockett & Jones':1,
    'Christian Louboutin':1
  };
  if (shoesSet[n]) return 'Shoes';

  // Cameras & Lenses
  var cameraSet = {
    'Canon':1,'Nikon':1,'Fujifilm':1,'Olympus':1,'Pentax':1,'Ricoh':1,'Panasonic Lumix':1,'Leica':1,
    'Hasselblad':1,'Mamiya':1,'Minolta':1,'Sigma':1,'Tamron':1,'Tokina':1,'Contax':1,'Bronica':1
  };
  if (cameraSet[n]) return 'Cameras & Lenses';

  // Electronics & Audio
  var elecSet = {
    'Apple':1,'Samsung':1,'Sharp':1,'Huawei':1,'Google':1,'Fujitsu':1,'Kyocera':1,'Xiaomi':1,'OPPO':1,
    'Bose':1,'Audio-Technica':1,'AKG':1,'Denon':1,'Esoteric':1,'Focal':1,'Foster':1,'Fostex':1,'Accuphase':1,
    'Onkyo':1,'Pioneer':1,'JBL':1,'Marantz':1
  };
  if (elecSet[n]) return 'Electronics & Audio';

  // Trading Cards
  var tcgSet = {'Pokemon':1,'Yu-Gi-Oh!':1,'One Piece':1,'Magic: The Gathering':1,'Dragon Ball':1,'Weiss Schwarz':1,'Cardfight!! Vanguard':1,'Duel Masters':1,'Battle Spirits':1};
  if (tcgSet[n]) return 'Trading Cards';

  // Video Games
  var vgSet = {'Nintendo':1,'Sony PlayStation':1,'Sega':1,'Bandai Namco':1,'Capcom':1,'Square Enix':1,'Konami':1,'SNK':1,'Atlus':1,'Xbox':1,'NEC':1};
  if (vgSet[n]) return 'Video Games';

  // Figures & Collectibles
  var figSet = {'Bandai':1,'Good Smile Company':1,'MegaHouse':1,'Kotobukiya':1,'Medicom Toy':1,'Max Factory':1,'Kaiyodo':1,'Figma':1,'Nendoroid':1,'S.H.Figuarts':1,'BE@RBRICK':1,'Banpresto':1,'Alter':1,'Tamashii Nations':1,'Funko':1};
  if (figSet[n]) return 'Figures & Collectibles';

  // Pottery & Porcelain
  var potSet = {'Arita':1,'Kutani':1,'Mashiko':1,'Satsuma':1,'Imari':1,'Bizen':1,'Mino':1,'Shigaraki':1,'Kakiemon':1,'Nabeshima':1,'Hagi':1,'Raku':1,'Seto':1,'Tokoname':1,'Banko':1,'Noritake':1,'Baccarat':1};
  if (potSet[n]) return 'Pottery & Porcelain';

  // Musical Instruments
  var miSet = {'Yamaha':1,'Roland':1,'Korg':1,'Ibanez':1,'ESP':1,'Fender':1,'Fender Japan':1,'Boss':1,'Takamine':1,'Tokai':1,'Fujigen':1,'Suzuki':1,'Pearl':1,'Tama':1,'Akai':1,'Casio':1,'Ampeg':1,'Fernandes':1,'Edwards':1,'Aria':1};
  if (miSet[n]) return 'Musical Instruments';

  // Sporting Goods
  var sgSet = {'Mizuno':1,'Yonex':1,'Shimano':1,'Daiwa':1,'Titleist':1,'Callaway':1,'Dunlop':1,'Butterfly':1,'Butterly':1,'Gamakatsu':1,'Honma':1,'TaylorMade':1,'Ping':1,'Bridgestone Golf':1,'Megabass':1,'Evergreen':1,'Descente':1,'Pearl Izumi':1};
  if (sgSet[n]) return 'Sporting Goods';

  // Automotive
  var autoSet = {'Toyota':1,'TRD':1,'Honda':1,'Mugen':1,'Nissan':1,'Nismo':1,'Mazda':1,'Subaru':1,'STI':1,'Mitsubishi':1,'Suzuki':1,'Lexus':1,'Daihatsu':1,'HKS':1,'Cusco':1,'Rays':1,'Bride':1,'Recaro':1};
  if (autoSet[n]) return 'Automotive';

  // Beauty
  var beautySet = {'Shiseido':1,'SK-II':1,'DHC':1,'Kanebo':1,'KOSE':1,'Hada Labo':1,'Fancl':1,'POLA':1,'Kao':1,'Decorte':1,'Cle de Peau Beaute':1,'Canmake':1,'Shu Uemura':1,'Muji':1,'Anessa':1,'Biore':1};
  if (beautySet[n]) return 'Beauty';

  // Toys & Models
  var toysSet = {'Takara Tomy':1,'Bandai':1,'Tamiya':1,'Tomica':1,'Plarail':1,'Beyblade':1,'Transformers':1,'Gundam (Gunpla)':1,'Sylvanian Families':1,'Tamagotchi':1,'Epoch':1,'Hasegawa':1,'Bandai Spirits':1,'LEGO':1,'Aoshima':1,'Fujimi':1};
  if (toysSet[n]) return 'Toys & Models';

  return '';
}

function categorize(brands, researchMap) {
  var categoryOrder = [
    'Watches',
    'Jewelry & Accessories',
    'Bags',
    'Clothing & Fashion',
    'Shoes',
    'Cameras & Lenses',
    'Electronics & Audio',
    'Trading Cards',
    'Video Games',
    'Figures & Collectibles',
    'Pottery & Porcelain',
    'Musical Instruments',
    'Sporting Goods',
    'Automotive',
    'Beauty',
    'Toys & Models'
  ];
  var grouped = {};
  for (var i = 0; i < categoryOrder.length; i++) grouped[categoryOrder[i]] = [];

  for (var i = 0; i < brands.length; i++) {
    var b = brands[i];
    var cat = '';
    if (researchMap[b.name]) cat = mapResearchCatToFinal(researchMap[b.name]);
    if (!cat) cat = hardCategory(b.name);

    // Specific overrides per instructions
    if (b.name === 'Cartier') cat = 'Watches';
    if (b.name === 'Yamaha') cat = 'Musical Instruments';
    if (b.name === 'Sony') cat = 'Electronics & Audio';
    if (b.name === 'Casio') cat = 'Watches';

    if (!cat) {
      // Fallback: try to infer by simple keywords in name
      var namel = b.name.toLowerCase();
      if (/seiko|citizen|rolex|omega|heuer|iwc|phili|tudor|longines|panerai|hublot|lange|blancpain|breguet|breitling/.test(namel)) cat = 'Watches';
      else if (/gundam|figma|nendo|bearbrick|banpresto|tamashii|figure/.test(namel)) cat = 'Figures & Collectibles';
      else if (/canon|nikon|fujifilm|olympus|pentax|ricoh|leica|hasselblad|mamiya|minolta|sigma|tamron|tokina|contax|bronica/.test(namel)) cat = 'Cameras & Lenses';
      else if (/g-shock|prospex|presage|oceanus/.test(namel)) cat = 'Watches';
      else if (/golf|titleist|callaway|mizuno|dunlop|yonex|butter/.test(namel)) cat = 'Sporting Goods';
      else if (/toy|tamiya|tomica|lego|aoshima|hasegawa|fujimi/.test(namel)) cat = 'Toys & Models';
      else if (/bandai|good smile|megahouse|kotobukiya|medicom/.test(namel)) cat = 'Figures & Collectibles';
      else if (/prada|gucci|chanel|dior|louis|hermes|burberry|celine|loewe|yves|saint laurent|porter|coach|briefing|anello|goyard|balenciaga|fendi|bottega|vuitton/.test(namel)) cat = 'Bags';
      else if (/tiffany|mikimoto|tasaki|bvlgari|bulgari|chrome hearts|swarovski|chopard|fred|damiani|chaumet|boucheron|ahkah|agete|ete/.test(namel)) cat = 'Jewelry & Accessories';
      else if (/nike|adidas|martens|converse|birken|clarks|puma|reebok|new balance|salomon|crockett/.test(namel)) cat = 'Shoes';
      else if (/asics|wtaps|supreme|comme des garcons|bape|beams|fragment|visvim|undercover|sacai|kenzo|evisu|yohji|issey|canada goose/.test(namel)) cat = 'Clothing & Fashion';
      else if (/shiseido|sk-ii|kose|kanebo|anessa|biore|fancl|pola|shu uemura|decorte|cle de peau|canmake|hada labo/.test(namel)) cat = 'Beauty';
      else if (/toyota|honda|nissan|mazda|subaru|mitsubishi|lexus|daihatsu|trd|nismo|sti|recaro|rays|hks|cusco|bride/.test(namel)) cat = 'Automotive';
      else if (/bose|audio|denon|accuphase|esoteric|fostex|focal|akg|jbl|marantz|pioneer|onkyo|sony|sharp|panasonic|kyocera/.test(namel)) cat = 'Electronics & Audio';
      else if (/fender|ibanez|roland|korg|yamah|esp|takamine|tokai|fujigen|tama|ampeg|boss|fernandes|edwards/.test(namel)) cat = 'Musical Instruments';
      else if (/pokemon|yu-gi|weiss|vanguard|duel masters|battle spirits|dragon ball/.test(namel)) cat = 'Trading Cards';
      else if (/nintendo|playstation|sega|konami|capcom|bandai namco|square enix|xbox|snes|famicom/.test(namel)) cat = 'Video Games';
    }

    if (!cat) cat = 'Clothing & Fashion'; // final fallback
    grouped[cat].push(b);
  }

  // Sort each group by name for stability
  Object.keys(grouped).forEach(function (k) {
    grouped[k].sort(function (a,b) { return a.name < b.name ? -1 : a.name > b.name ? 1 : 0; });
  });

  return { order: categoryOrder, groups: grouped };
}

function mergeSources(base, extras) {
  var map = Object.create(null);
  for (var i = 0; i < base.length; i++) {
    var b = base[i] || {};
    var key = String(b.name || '');
    if (!key) continue;
    map[key] = { name: key, jp_names: uniq([].concat(b.jp_names || [])), country: String(b.country || '') };
  }
  for (var j = 0; j < extras.length; j++) {
    var e = extras[j] || {};
    var k = String(e.name || '');
    if (!k) continue;
    if (map[k]) {
      // Merge jp_names, keep country from base (source1) if present
      var mergedJP = uniq([].concat(map[k].jp_names || [], e.jp_names || []));
      map[k].jp_names = mergedJP;
      if (!map[k].country && e.country) map[k].country = String(e.country);
    } else {
      map[k] = { name: k, jp_names: uniq([].concat(e.jp_names || [])), country: String(e.country || '') };
    }
  }
  return Object.keys(map).map(function (k) { return map[k]; });
}

function q(s) {
  return '\'' + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + '\'';
}

function render(dict) {
  var out = 'var IS_BRAND_DICT = [\n';
  for (var i = 0; i < dict.order.length; i++) {
    var cat = dict.order[i];
    out += '  // === ' + cat + ' ===\n';
    var arr = dict.groups[cat] || [];
    for (var j = 0; j < arr.length; j++) {
      var b = arr[j];
      out += '  {name: ' + q(b.name) + ', jp_names: [' + (b.jp_names||[]).map(q).join(', ') + '], country: ' + q(b.country || '') + '},\n';
    }
    out += '\n';
  }
  out += '];\n';
  return out;
}

(function main(){
  const base = readBrandsRaw(path.join(__dirname, 'brands_raw.txt'));
  const extras = addlBrands();
  const merged = mergeSources(base, extras);
  const researchMap = loadResearchMap();
  const dict = categorize(merged, researchMap);
  process.stdout.write(render(dict));
})();
