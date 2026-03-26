// AIExtractor.gs — OpenAI API呼び出し・プロンプト生成・レスポンス解析
// 既存のAI.gsには依存しない独立モジュール（IS_CONFIG が無い場合は安全なデフォルトにフォールバック）

// デフォルト設定（IS_CONFIG.AI が未定義のときに使用）
var AIEX_DEFAULTS_ = {
  MODEL: 'gpt-4o-mini',
  TEMPERATURE: 0.2,
  MAX_TOKENS: 1200,
  TIMEOUT: 60000,
  PARALLEL_REQUESTS: 5,
  SLEEP_BETWEEN_BATCHES: 1000,
  MAX_RETRIES: 2
};

function getAIConfig_() {
  try {
    if (typeof IS_CONFIG !== 'undefined' && IS_CONFIG && IS_CONFIG.AI) {
      var a = IS_CONFIG.AI;
      return {
        MODEL: a.MODEL || AIEX_DEFAULTS_.MODEL,
        TEMPERATURE: a.TEMPERATURE || AIEX_DEFAULTS_.TEMPERATURE,
        MAX_TOKENS: a.MAX_TOKENS || AIEX_DEFAULTS_.MAX_TOKENS,
        TIMEOUT: a.TIMEOUT || AIEX_DEFAULTS_.TIMEOUT,
        PARALLEL_REQUESTS: a.PARALLEL_REQUESTS || AIEX_DEFAULTS_.PARALLEL_REQUESTS,
        SLEEP_BETWEEN_BATCHES: a.SLEEP_BETWEEN_BATCHES || AIEX_DEFAULTS_.SLEEP_BETWEEN_BATCHES,
        MAX_RETRIES: a.MAX_RETRIES || AIEX_DEFAULTS_.MAX_RETRIES
      };
    }
  } catch (e) {}
  return AIEX_DEFAULTS_;
}

// 1. メイン抽出関数
function extractItemSpecifics(title, description, category, fields, tag) {
  var out = { success: false, data: null, error: null };
  try {
    var prompt = buildExtractionPrompt_(title, description, category, fields, tag);
    var responseText = callOpenAI_(prompt);
    var data = parseExtractionResponse_(responseText, fields);
    out.success = true;
    out.data = data;
    return out;
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
    return out;
  }
}

// 2. 日本語タグ → eBayカテゴリ名のマッピング
function mapTagToCategory(tag, categories) {
  var cleaned = null;
  try {
    if (!tag) return 'Unknown';
    if (!categories || !categories.length) return 'Unknown';

    // 応答はJSONで統一（callOpenAI_がjson_objectを強制するため）
    var prompt = '' +
      '以下の日本語商品カテゴリタグを、最も適切なeBayカテゴリに分類してください。\n' +
      'タグ: ' + String(tag) + '\n' +
      '選択肢: ' + categories.join(', ') + '\n' +
      '回答は次のJSON形式のみを返してください。\n' +
      '{"category": "<選択肢のいずれか または Unknown>"}';

    var text = callOpenAI_(prompt);
    // JSON/生文字列の双方に対応
    var obj = null;
    try { obj = JSON.parse(safeStripCodeFences_(text)); } catch (e) {}
    if (obj && obj.category) {
      cleaned = String(obj.category);
    } else {
      cleaned = (text || '').replace(/^[\s"']+|[\s"']+$/g, '');
    }

    if (!cleaned) return 'Unknown';

    // 大文字小文字を無視して選択肢に揃える
    var i;
    for (i = 0; i < categories.length; i++) {
      if (String(categories[i]).toLowerCase() === String(cleaned).toLowerCase()) {
        return categories[i];
      }
    }
    // 部分一致（過剰マッチ回避のため厳しめ）
    for (i = 0; i < categories.length; i++) {
      if (String(cleaned).toLowerCase().indexOf(String(categories[i]).toLowerCase()) !== -1) {
        return categories[i];
      }
    }
    return 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}

// 3. 複数行の一括抽出（並列 + リトライ）
function extractItemSpecificsBatch(items) {
  var results = [];
  try {
    if (!items || !items.length) return results;

    var cfg = getAIConfig_();
    var batchSize = cfg.PARALLEL_REQUESTS;
    if (!batchSize || batchSize < 1) batchSize = 1;

    var total = items.length;
    var outcomes = new Array(total); // 各indexに結果を詰める

    // 初回処理用キュー: インデックス配列
    var queue = [];
    var i;
    for (i = 0; i < total; i++) queue.push(i);

    // リトライ用パラメータ
    var maxRetries = cfg.MAX_RETRIES;
    var attempt = 0;

    while (queue.length > 0 && attempt <= maxRetries) {
      var nextQueue = [];
      for (i = 0; i < queue.length; i += batchSize) {
        var slice = queue.slice(i, i + batchSize);

        // プロンプトを作成
        var prompts = [];
        var meta = [];
        var j;
        for (j = 0; j < slice.length; j++) {
          var idx = slice[j];
          var it = items[idx];
          try {
            prompts.push(buildExtractionPrompt_(it.title, it.description, it.category, it.fields, it.tag, it.existingData));
            meta.push(idx);
          } catch (e) {
            outcomes[idx] = { row: it && it.row, success: false, error: 'プロンプト生成エラー: ' + (e.message || e) };
          }
        }

        if (prompts.length === 0) {
          continue;
        }

        // 並列呼び出し
        var responses;
        try {
          responses = callOpenAIBatch_(prompts);
        } catch (e) {
          // バッチ全体が失敗した場合、個別リトライ
          for (j = 0; j < meta.length; j++) {
            nextQueue.push(meta[j]);
          }
          continue;
        }

        for (j = 0; j < responses.length; j++) {
          var resp = responses[j];
          var itemIndex = meta[j];
          var item = items[itemIndex];
          try {
            var code = resp.getResponseCode();
            var body = resp.getContentText();
            if (code !== 200) {
              // 次回に再試行
              nextQueue.push(itemIndex);
              continue;
            }
            var parsed;
            try { parsed = JSON.parse(body); } catch (e1) {
              nextQueue.push(itemIndex);
              continue;
            }
            var content = parsed && parsed.choices && parsed.choices[0] && parsed.choices[0].message && parsed.choices[0].message.content;
            if (!content) {
              nextQueue.push(itemIndex);
              continue;
            }
            var data = parseExtractionResponse_(content, item.fields, item.existingData);
            outcomes[itemIndex] = { row: item.row, success: true, data: data };
          } catch (e2) {
            nextQueue.push(itemIndex);
          }
        }

        // バッチ間スリープ
        try {
          if (cfg.SLEEP_BETWEEN_BATCHES && cfg.SLEEP_BETWEEN_BATCHES > 0) {
            Utilities.sleep(cfg.SLEEP_BETWEEN_BATCHES);
          }
        } catch (e) {}
      }

      // 次の試行に向けて
      queue = nextQueue;
      attempt++;
    }

    // 残存失敗をエラーとして埋める
    for (i = 0; i < items.length; i++) {
      if (!outcomes[i]) {
        outcomes[i] = { row: items[i].row, success: false, error: 'API error or parsing error' };
      }
    }

    // 配列に整形して返却（入力順を維持）
    for (i = 0; i < outcomes.length; i++) results.push(outcomes[i]);
    return results;
  } catch (e) {
    // 致命的エラー時は全件同一エラーで返す
    var k;
    for (k = 0; k < (items && items.length ? items.length : 0); k++) {
      results.push({ row: items[k].row, success: false, error: e && e.message ? e.message : String(e) });
    }
    return results;
  }
}

// ——— プライベート関数群 ———

// プロンプト構築
function buildExtractionPrompt_(title, description, category, fields, tag, existingData) {
  var lines = [];

  // === 1. ロール定義 ===
  lines.push('You are an expert eBay Item Specifics extractor for Japanese sellers.');
  lines.push('Analyze the product information and extract all relevant Item Specifics.');
  lines.push('');

  // === 2. 入力データ ===
  lines.push('### INPUT DATA');
  if (tag) {
    lines.push('Product Tag (category hint): ' + tag);
  }
  lines.push('Title: ' + (title || ''));
  lines.push('Description: ' + (description || ''));
  lines.push('');

  // === 3. カテゴリ判定指示 ===
  lines.push('### STEP 1: CATEGORY DETECTION');
  lines.push('Determine the eBay product category from the title and description.');
  lines.push('The Product Tag is a HINT only - verify against the actual title/description.');
  lines.push('Use one of these categories: Watches, Jewelry, Trading Cards, Video Games, Collectibles, Cameras, Cell Phones, Clothing, Shoes, Bags, Pottery, Musical Instruments, Automotive Parts, Books, Toys, Health & Beauty, Home & Garden, Sporting Goods, Art, Antiques, Soap, Other');
  lines.push('');
  lines.push('CRITICAL DISAMBIGUATION RULES:');
  lines.push('- "MTG-B2000", "MTG-B1000", "MTG-B3000" = Casio G-SHOCK watch models (MT-G series), NOT Magic: The Gathering trading cards. If brand is Casio/G-SHOCK and model starts with MTG-, category is Watches.');
  lines.push('- "MTG" alone in trading card context (ポケカ, 遊戯王, カード) = Magic: The Gathering.');
  lines.push('- G-SHOCK models: DW-, GA-, GW-, GBD-, GMW-, GST-, GG-, GWF-, GPR-, MRG-, MTG- are ALL Casio watches.');
  lines.push('');

  // === 4. ブランド辞書（プロンプト埋め込み） ===
  var brandDict = getBrandDictForPrompt_();
  if (brandDict) {
    lines.push('### BRAND DICTIONARY');
    lines.push('Use this dictionary to identify brands from Japanese text:');
    lines.push(brandDict);
    lines.push('');
  }

  // === 5. カテゴリ別フィールド要件 ===
  lines.push('### STEP 2: EXTRACT ITEM SPECIFICS');
  lines.push('Based on the detected category, extract these fields:');
  lines.push('');

  var categoryFields = getCategoryFieldsForPrompt_();
  lines.push(categoryFields);
  lines.push('');

  // === 6. Accepted Values（正規化ルール） ===
  lines.push('### NORMALIZATION RULES');
  lines.push('Color: Use standard eBay colors: Black, Blue, Brown, Gold, Gray, Green, Multicolor, Orange, Pink, Purple, Red, Silver, White, Yellow, Beige, Navy');
  lines.push('Country/Region of Manufacture: Use full English country name (Japan, Switzerland, United States, China, Italy, France, Germany, United Kingdom). This is the MANUFACTURING country, not brand HQ.');
  lines.push('Department: Use Men, Women, Unisex, Boys, Girls');
  lines.push('Movement (watches): Automatic, Manual, Quartz, Solar, Kinetic');
  lines.push('Display (watches): Analog, Digital, Analog & Digital. Inference rules: if movement is Automatic/Mechanical/Manual → Analog. If title/description contains Digital or brand is G-Shock → Digital. If both analog hands and digital display → Analog & Digital. Default → Analog.');
  lines.push('Platform (video games): Use full eBay platform names. Mapping: SFC/Super Famicom/SNES → "Nintendo Super Nintendo Entertainment System (Super Famicom)", FC/Famicom/NES → "Nintendo Entertainment System (NES/Famicom)", GB/Game Boy → "Nintendo Game Boy", GBA → "Nintendo Game Boy Advance", GBC → "Nintendo Game Boy Color", N64 → "Nintendo 64", GC/GameCube → "Nintendo GameCube", DS/NDS → "Nintendo DS", 3DS → "Nintendo 3DS", PSP → "Sony PSP", PS Vita → "Sony PlayStation Vita", PS1/PlayStation → "Sony PlayStation", PS2 → "Sony PlayStation 2", PS3 → "Sony PlayStation 3", PS4 → "Sony PlayStation 4", PS5 → "Sony PlayStation 5", Dreamcast → "Sega Dreamcast", Saturn → "Sega Saturn", Mega Drive/Genesis → "Sega Genesis/Mega Drive", MSX → "MSX", PC Engine/TurboGrafx → "NEC TurboGrafx-16/PC Engine", Neo Geo → "SNK Neo Geo", Switch → "Nintendo Switch"');
  lines.push('Region Code (video games & consoles): NTSC-J or "Japan Import" or Japanese → "NTSC-J (Japan)". NTSC-U/C or US/North America → "NTSC-U/C (US/Canada)". PAL or Europe → "PAL". If not specified → "NTSC-J (Japan)" for Japan import items. For consoles: Japanese models are always "NTSC-J (Japan)" or "Region Free".');
  lines.push('Game Name (video games): Extract the game title. Remove platform codes (SFC, FC, GB, GBA, PS2, etc.), region codes (NTSC-J, etc.), and condition descriptors (CIB, Box, Manual, Japan Import, Retro, Rare, etc.). The game name is ALWAYS present in the title - never return "Does not apply". Examples: "Dragon Quest III And The Legend FC NTSC-J CIB" → "Dragon Quest III", "Super Mario Bros FC NTSC-J CIB" → "Super Mario Bros", "Wario Land GB Memory Card Game Boy NTSC-J" → "Wario Land"');
  lines.push('Character (video games): Extract the main character or franchise character if identifiable from the game name. Well-known mappings: Super Mario/Mario Bros → Mario, Wario Land → Wario, Sonic → Sonic the Hedgehog, Zelda/Link → Link, Kirby → Kirby, Mega Man/Rockman → Mega Man, Sailor Moon → Sailor Moon, Macross → Macross, Dragon Ball → Goku, Madara → Madara, Bomberman → Bomberman, TwinBee → TwinBee, Pac-Man → Pac-Man, Castlevania/Dracula → Dracula/Belmont. If no character is identifiable, use empty string "". Do NOT use "Does not apply".');
  lines.push('Genre (video games): RPG, Action, Adventure, Fighting, Racing, Puzzle, Simulation, Sports, Shooter, Strategy, Platform, Music/Rhythm, Horror, Board Game/Party');
  lines.push('Publisher (video games): Extract from brand knowledge or description. Common publishers: Nintendo, Capcom, Konami, Square Enix, Bandai Namco, Sega, Sony, Koei Tecmo, Atlus, Enix, Squaresoft, Hudson Soft, Taito, Irem, SNK');
  // Video Game Consoles normalization rules
  lines.push('Type (video game consoles): "Home Console" for TV-connected systems, "Handheld" for portable systems, "Hybrid" for Switch-type systems.');
  lines.push('Storage Capacity (video game consoles): Extract from title/description. Format: "500 GB", "1 TB". For retro consoles without storage, use empty string.');
  lines.push('Connectivity (video game consoles): List connection types. Common: HDMI, Wi-Fi, Bluetooth, USB, Ethernet. For retro: AV, RF, S-Video, Composite.');
  // Fishing Reels normalization rules
  lines.push('Reel Type (fishing reels): Spinning, Baitcasting, Fly, Electric, Spincast, Trolling, Conventional. Japanese terms: スピニング→Spinning, ベイト/両軸→Baitcasting, フライ→Fly, 電動→Electric.');
  lines.push('Hand Retrieve (fishing reels): Right, Left, Interchangeable. If not specified, use empty string. Do NOT guess.');
  lines.push('Gear Ratio (fishing reels): Format as "X.X:1" (e.g., "5.2:1", "6.3:1", "7.1:1"). Extract from title/description.');
  lines.push('Ball Bearings (fishing reels): Extract count as number (e.g., "11", "7+1"). Common patterns: "11BB", "ベアリング数11".');
  lines.push('Fishing Type (fishing reels): Saltwater Fishing, Freshwater Fishing, All Water. Japanese: 海釣り/ソルト→Saltwater, 淡水/バス→Freshwater.');
  lines.push('Fish Species (fishing reels): Infer target species from model line or context. Examples: Sephia→Squid, Emeraldas→Squid, Saltiga→Tuna, Exsence→Sea Bass, Soare→Rockfish. Common: Bass, Trout, Tuna, Sea Bass, Squid, Rockfish, Walleye, Pike, Catfish, Carp. If unclear, use empty string.');
  lines.push('Edition (video game consoles): Extract edition info. "限定版/限定モデル"→"Limited Edition", "初期型"→"Launch Edition", "後期型/最終型"→"Late Model". Color variants: "ピカチュウエディション"→"Pikachu Edition". If standard model, use empty string.');
  // Trading Cards normalization rules
  lines.push('Game (trading cards): Use official English names. Pokemon → "Pokémon", Yu-Gi-Oh → "Yu-Gi-Oh!", Magic: The Gathering → "Magic: The Gathering", Duel Masters → "Duel Masters", Weiss Schwarz → "Weiss Schwarz", Vanguard → "Cardfight!! Vanguard", One Piece → "One Piece Card Game"');
  lines.push('Set (trading cards): Use the official set name. For Pokemon Japanese sets, use English equivalent when available (e.g., クレイバースト → "Clay Burst"). For numbered series, include the series code (e.g., "SV2a", "S11a").');
  lines.push('Character (trading cards): Extract the character/creature name from the card title. For Pokemon: use the Pokemon name (e.g., "Pikachu", "Charizard"). For Yu-Gi-Oh: use the monster name. For sports cards: use the player name. If multiple characters, use the primary one.');
  lines.push('Card Name (trading cards): The full card name as it appears. Include any subtitle or variant (e.g., "Pikachu VMAX", "Dark Magician"). This is different from Character - Card Name is the specific card version.');
  lines.push('Card Number (trading cards): Extract the collector number. Common formats: "123/456", "#123", "SV2a-123". If a PSA/BGS slab, the card number is on the label, not the grade number.');
  lines.push('Rarity (trading cards): Common rarities: Common, Uncommon, Rare, Super Rare (SR), Ultra Rare (UR), Secret Rare, Hyper Rare (HR), Art Rare (AR), Special Art Rare (SAR), Mythic Rare (MTG), Promo. Use full English names.');
  lines.push('Finish (trading cards): Holo/Foil, Reverse Holo, Full Art, Chrome, Refractor, Non-Holo. Cards with EX/GX/VMAX/VSTAR are typically Holo/Foil.');
  lines.push('Graded (trading cards): "Yes" if PSA/BGS/CGC graded, "No" otherwise.');
  lines.push('Professional Grader (trading cards): "PSA", "BGS" (Beckett), "CGC", "SGC" as appropriate.');
  lines.push('Grade (trading cards): The numeric grade (e.g., "PSA 10", "BGS 9.5"). Include the grader prefix.');
  lines.push('Material: Use eBay standard terms (e.g., "Stainless Steel" not "SS", "Sterling Silver" not "Silver 925")');
  // Camera normalization rules
  lines.push('Maximum Resolution (cameras): Format as "XX.X MP" (e.g., "20.1 MP", "24.2 MP", "45.7 MP"). Extract megapixel count from title/description. Common patterns: "2000万画素" → "20.0 MP", "有効画素数2420万" → "24.2 MP". If only total pixels given, convert to megapixels (divide by 1,000,000).');
  lines.push('Type (cameras): Use eBay standard types. Digital: "Digital SLR", "Mirrorless Interchangeable Lens", "Compact", "Medium Format", "Bridge", "Action", "Instant". Film: "SLR", "Rangefinder", "TLR", "Point & Shoot", "Folding". Mapping: 一眼レフ(digital) → "Digital SLR", 一眼レフ(film) → "SLR", ミラーレス → "Mirrorless Interchangeable Lens", コンパクト/コンデジ → "Compact", フィルムカメラ → determine specific type (SLR/Rangefinder/TLR/Point & Shoot/Folding), 中判 → "Medium Format", レンジファインダー → "Rangefinder", 二眼レフ → "TLR", 蛇腹 → "Folding".');
  lines.push('');
  lines.push('### CAMERA SERIES & MOUNT REFERENCE (CRITICAL for Cameras)');
  lines.push('Use this reference to correctly identify Series and Lens Mount from model names:');
  lines.push('Canon: Series: EOS (digital/film SLR+mirrorless), PowerShot (compact), IXY (compact), Kiss (=Rebel, consumer EOS). Models: AE-1, A-1, F-1, New F-1 (film, FD mount), Canonet (rangefinder). Mounts: FD (film 1971-1987), EF (1987-present SLR), EF-S (APS-C SLR), EF-M (M-series mirrorless), RF (full-frame mirrorless).');
  lines.push('Nikon: Series: D (digital SLR), Z (mirrorless), Coolpix (compact), FM/FE/F/FA/FG (film MF), FM2/FM3A/F3/F4/F5/F6 (film pro). Mounts: F (1959-present, all Nikon SLR), Z (mirrorless).');
  lines.push('Sony: Series: Alpha/α (SLR+mirrorless), Cyber-shot/RX (compact), NEX (old mirrorless). Models: α7/α9/α1 (mirrorless), α100-α900 (SLR). Mounts: A/Alpha (SLR, =Minolta A), E (mirrorless).');
  lines.push('Fujifilm: Series: X (mirrorless+compact), GFX (medium format), FinePix (old compact), Klasse (film compact), Instax (instant). Mounts: X (mirrorless), G (GFX medium format).');
  lines.push('Olympus: Series: OM-D (mirrorless), PEN (mirrorless), OM (film SLR), μ/Mju/Stylus (compact), XA (compact), Trip (compact). Mount: Micro Four Thirds (digital), OM (film).');
  lines.push('Panasonic: Series: Lumix G/GH/GX (Micro Four Thirds), Lumix S (full-frame). Mounts: Micro Four Thirds, L-mount (S series).');
  lines.push('Pentax: Series: K (digital+film SLR), 645 (medium format), LX/MX/ME/SP/Spotmatic (film), 67 (medium format film). Mounts: K (1975-present), M42 (Spotmatic era), 645 (medium format), 67 (6x7).');
  lines.push('Minolta: Series: Alpha/α (AF SLR), X/XD/XE/XG (film MF SLR), SR/SRT (film). Mounts: SR/MC/MD (MF film 1958-1985), A/Alpha (AF 1985-present, =Sony A).');
  lines.push('Ricoh: Series: GR (premium compact), Theta (360°). Film: XR, 500G.');
  lines.push('Leica: Series: M (rangefinder), R (SLR), Q (fixed-lens), SL (mirrorless), CL (compact mirrorless). Mounts: M (rangefinder), R (SLR), L (mirrorless, shared with Sigma/Panasonic).');
  lines.push('Contax: Series: G (AF rangefinder), T (compact), RTS/Aria/167MT/S2 (SLR), 645 (medium format), N (AF SLR). Mounts: C/Y Contax/Yashica (SLR), G (G1/G2 only), N (N1/NX only).');
  lines.push('Hasselblad: Series: 500/V (film medium format), H (digital MF), X (mirrorless MF). Mounts: V (500 series), H (H series), X (X1D/X2D).');
  lines.push('Mamiya: Series: RB67, RZ67 (6x7 MF), 645 (645 MF), 7 (rangefinder MF), C220/C330 (TLR). Mounts: RB (RB67), RZ (RZ67), 645 (645 series), Mamiya 7 (fixed).');
  lines.push('Bronica: Series: SQ (6x6), ETR (645), GS-1 (6x7), S2/EC (6x6). Mounts: SQ (SQ series), ETR (ETR series), S (S2/EC).');
  lines.push('Kodak: Series: Retina (folding/compact), Brownie (box), EasyShare (digital). Film cameras mostly fixed lens.');
  lines.push('Yashica: Series: Electro 35 (rangefinder), Mat 124G (TLR), T (compact), TL/FX/FR (SLR). Mount: C/Y Contax/Yashica (SLR), M42 (TL Electro X).');
  lines.push('Rollei: Series: 35 (compact), Rolleiflex (TLR), Rolleicord (TLR), SL66 (SLR MF). Mounts: Rollei SL66 (SL66 series), Rollei QBM (35mm SLR).');
  lines.push('Voigtlander: Series: Bessa (rangefinder), Prominent (rangefinder). Mounts: Leica M compatible, M42.');
  lines.push('Polaroid: Series: SX-70, OneStep, 600, Now, Go (instant cameras). No interchangeable lens.');
  lines.push('GoPro: Series: HERO (action camera). No interchangeable lens. Battery Type: Built-in.');
  lines.push('DJI: Series: Osmo Action, Osmo Pocket (action camera). No interchangeable lens. Battery Type: Built-in.');
  lines.push('');
  lines.push('### CAMERA BATTERY TYPE RULES');
  lines.push('Battery Type (cameras): Determine from camera type and era:');
  lines.push('- Modern digital cameras (DSLR, mirrorless, compact digital) → "Lithium-Ion"');
  lines.push('- Action cameras (GoPro, DJI) → "Built-in"');
  lines.push('- Film SLR (Canon EOS film, Nikon F4-F6, Minolta Alpha) → "CR-P2 (2CR5)" or "Lithium"');
  lines.push('- Film SLR (Nikon FM2, Canon AE-1, Pentax K1000, mechanical) → "Button Cell (LR44/SR44)"');
  lines.push('- Fully mechanical cameras (no meter: Nikon F, Leica M3, Hasselblad 500) → "Not Applicable"');
  lines.push('- Compact film (Contax T2/T3, Olympus μ, Yashica T) → "CR123A" or "CR2"');
  lines.push('- Instant cameras (Polaroid, Instax) → "Built-in" or "AA"');
  lines.push('- If specific battery model is mentioned (LP-E6, EN-EL15, NP-FW50 etc.) → "Lithium-Ion"');
  lines.push('');
  lines.push('### SOAP RULES');
  lines.push('Type (soap): ALWAYS set to "Bar Soap". Do not use other values.');
  lines.push('Scent (soap): Extract fragrance/scent from title/description. Common scents: Rose, Lavender, Citrus, Orange, Honey, Jasmine, Verbena, Green Tea, Sandalwood, Vanilla, Coconut, Herbal, Floral, Unscented. Use English.');
  lines.push('Product Line (soap): The specific product line name. Examples: Hermès → "Eau d\'Orange Verte", "Jardin", "Twilly". CHANEL → "N°5", "Coco Mademoiselle". Dior → "Miss Dior", "Sauvage", "J\'adore". Bvlgari → "Au Thé Vert". HACCI → "Honey Face Soap". L\'Occitane → "Shea Butter". Jo Malone → "Lime Basil & Mandarin". Cow Brand → "Beauty Soap Red Box", "Beauty Soap Blue Box".');
  lines.push('');
  lines.push('### HAT STYLE RULES');
  lines.push('Category = Hats: Extract and normalize these fields.');
  lines.push('Style (hats): Choose one of: Baseball Cap, Bucket Hat, Beanie, Fedora, Trucker Hat, Snapback, Dad Hat, Visor, Beret, Newsboy Cap, Flat Cap, Sun Hat, Panama Hat, Cowboy Hat. Map Japanese terms: キャップ/ベースボール/59FIFTY/9FIFTY/9FORTY → Baseball Cap, スナップバック → Snapback, トラッカー → Trucker Hat, ダッドハット → Dad Hat, バケットハット → Bucket Hat, ビーニー/ニット帽 → Beanie, フェドーラ/中折れ → Fedora, ベレー帽 → Beret, キャスケット → Newsboy Cap, ハンチング → Flat Cap, サンバイザー → Visor, パナマハット → Panama Hat, サンハット/つば広 → Sun Hat, カウボーイ → Cowboy Hat.');
  lines.push('Material (hats): Normalize to Cotton, Polyester, Wool, Acrylic, Nylon, Mesh, Straw, Leather, Canvas.');
  lines.push('Features (hats): Use comma-separated features from: Adjustable, Breathable, Mesh Back, UV Protection, Wide Brim, Lined, Ear Flap, Waterproof.');
  lines.push('Season (hats): Use Spring, Summer, Fall, Winter. Infer from text/material: Straw/Panama/wide brim → Summer; Wool/fleece/beanie/ear flap → Winter. If text says 春夏 or 秋冬, output the two seasons separated by comma.');
  lines.push('Size (hats): Extract "One Size", "Adjustable", alpha sizes (S/M/L/XL), US hat sizes like 6 7/8, 7 1/8, 7 1/4, 7 3/8, 7 1/2, 7 5/8, 7 3/4, 7 7/8, or cm sizes like 57cm/58cm. Prefer "One Size" over "Adjustable" if both appear.');
  lines.push('');
  lines.push('### METAL IDENTIFICATION RULES (CRITICAL for Jewelry)');
  lines.push('IMPORTANT: Distinguish between actual precious metal and color/finish/plating:');
  lines.push('- "gold tone", "gold plated", "gold color", "gold-tone", "GP" in description → Metal: "Base Metal", Metal Purity: "Does not apply"');
  lines.push('- "silver tone", "silver plated", "silver color", "silver-tone" in description → Metal: "Base Metal", Metal Purity: "Does not apply"');
  lines.push('- Real Gold REQUIRES explicit karat marking in title or description: 10K/K10, 14K/K14, 18K/K18, 24K/K24, 750, 585, 999');
  lines.push('- Real Silver REQUIRES explicit purity in title or description: 925, Sterling Silver, SV925, Ag925');
  lines.push('- Fashion/designer brands (Dior, Chanel, Gucci, LV, etc.) WITHOUT karat marking = likely Base Metal with plating');
  lines.push('- If title says "Gold" but NO karat/purity evidence anywhere → Metal: "Base Metal"');
  lines.push('- If title says "Silver" but NO 925/Sterling evidence anywhere → Metal: "Base Metal"');
  lines.push('- Metal Purity: ONLY set when real precious metal is confirmed. Otherwise "Does not apply"');
  lines.push('');

  // === 6.5. 既存データ（Step 1結果）===
  if (existingData && typeof existingData === 'object') {
    var existingKeys = Object.keys(existingData);
    if (existingKeys.length > 0) {
      lines.push('### ALREADY CONFIRMED DATA (from Step 1)');
      lines.push('The following fields are already filled. DO NOT overwrite them unless clearly incorrect:');
      for (var ei = 0; ei < existingKeys.length; ei++) {
        var ek = existingKeys[ei];
        var ev = existingData[ek];
        if (ev && ev !== '') {
          lines.push('- ' + ek + ': ' + ev);
        }
      }
      lines.push('Focus on extracting EMPTY fields only.');
      lines.push('');
    }
  }

  // === 7. 出力ルール ===
  lines.push('### OUTPUT RULES');
  lines.push('- Return ONLY a valid JSON object. No markdown, no explanation, no code fences.');
  lines.push('- First key must be "_category" with the detected eBay category name.');
  lines.push('- Remaining keys are the Item Specifics field names with extracted values.');
  lines.push('- Values must be in English.');
  lines.push('- If a value cannot be determined from the input, use empty string "".');
  lines.push('- For REQUIRED fields where value is truly unknown: use "Does not apply" (except Brand: use "Unbranded").');
  lines.push('- Do NOT guess or hallucinate values. Only extract what is clearly stated or strongly implied.');
  lines.push('- Normalize values to eBay standard terms.');
  lines.push('');

  // === 8. 出力例 ===
  lines.push('### OUTPUT EXAMPLE');
  lines.push('{"_category": "Watches", "Brand": "Seiko", "Type": "Wrist Watch", "Model": "Presage", "Movement": "Automatic", "Display": "Analog", "Case Material": "Stainless Steel", "Band Material": "Leather", "Department": "Men", "Dial Color": "Blue", "Country/Region of Manufacture": "Japan"}');
  lines.push('{"_category": "Video Games", "Platform": "Nintendo Super Nintendo Entertainment System (Super Famicom)", "Game Name": "Dragon Quest VI", "Region Code": "NTSC-J (Japan)", "Genre": "Role-Playing", "Character": "", "Publisher": "Enix", "Rating": "", "Language": "Japanese", "Country/Region of Manufacture": "Japan"}');
  lines.push('{"_category": "Trading Cards", "Game": "Pokémon", "Set": "Clay Burst", "Character": "Charizard", "Card Name": "Charizard ex SAR", "Card Number": "201/165", "Rarity": "Special Art Rare", "Finish": "Holo/Foil", "Language": "Japanese", "Graded": "No", "Country/Region of Manufacture": "Japan"}');
  lines.push('{"_category": "Video Game Consoles", "Brand": "Nintendo", "Platform": "Nintendo Super Nintendo Entertainment System (Super Famicom)", "Model": "Super Famicom Jr.", "Type": "Home Console", "Storage Capacity": "", "Color": "Gray", "Region Code": "NTSC-J (Japan)", "Connectivity": "AV", "Edition": "", "Country/Region of Manufacture": "Japan"}');
  lines.push('{"_category": "Fishing Reels", "Brand": "Shimano", "Model": "Stella", "Reel Type": "Spinning", "Hand Retrieve": "", "Gear Ratio": "5.2:1", "Ball Bearings": "12+1", "Line Capacity": "", "Fishing Type": "All Water", "Fish Species": "", "Country/Region of Manufacture": "Japan"}');

  return lines.join('\n');
}

/**
 * ブランド辞書からプロンプト用テキストを生成
 * IS_BRAND_DICT が定義されていれば使用、なければ空文字を返す
 */
function getBrandDictForPrompt_() {
  try {
    if (typeof IS_BRAND_DICT === 'undefined' || !IS_BRAND_DICT) return '';
    var lines = [];
    for (var i = 0; i < IS_BRAND_DICT.length; i++) {
      var b = IS_BRAND_DICT[i];
      if (!b || !b.name) continue;
      var jp = (b.jp_names && b.jp_names.length) ? b.jp_names.join(', ') : '';
      var line = b.name;
      if (b.parent_brand) {
        line += ' -> Brand: ' + b.parent_brand + ', use "' + b.name + '" as Model hint';
      }
      if (jp) line += ' (' + jp + ')';
      if (b.country) line += ' [' + b.country + ']';
      lines.push(line);
    }
    return lines.join('\n');
  } catch (e) {
    return '';
  }
}

/**
 * IS_INITIAL_DATA からカテゴリ別フィールド要件テキストを生成
 */
function getCategoryFieldsForPrompt_() {
  try {
    var data = [];
    if (typeof IS_INITIAL_DATA !== 'undefined' && IS_INITIAL_DATA) {
      data = IS_INITIAL_DATA;
    }
    if (!data.length) {
      return 'Extract the most relevant Item Specifics for this product (Brand, Type, Model, Material, Color, Country/Region of Manufacture, Style, Department).';
    }

    // カテゴリごとにグループ化
    var cats = {};
    for (var i = 0; i < data.length; i++) {
      var d = data[i];
      if (!d || !d.category || !d.field_name) continue;
      if (!cats[d.category]) {
        cats[d.category] = { required: [], recommended: [] };
      }
      if (d.field_type === 'required') {
        cats[d.category].required.push(d.field_name);
      } else {
        cats[d.category].recommended.push(d.field_name);
      }
    }

    var lines = [];
    for (var cat in cats) {
      if (!cats.hasOwnProperty(cat)) continue;
      var c = cats[cat];
      var line = '[' + cat + '] Required: ' + c.required.join(', ');
      if (c.recommended.length > 0) {
        line += ' | Recommended: ' + c.recommended.join(', ');
      }
      lines.push(line);
    }
    lines.push('');
    lines.push('For categories not listed above, extract: Brand, Type, Model, Material, Color, Country/Region of Manufacture, Style, Department.');

    return lines.join('\n');
  } catch (e) {
    return 'Extract: Brand, Type, Model, Material, Color, Country/Region of Manufacture, Style, Department.';
  }
}

// OpenAI 単発呼び出し
function callOpenAI_(prompt) {
  var docProps = PropertiesService.getDocumentProperties();
  var apiKey = docProps.getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。メニュー > 設定メニュー > 初期設定 から設定してください。');
  }

  var cfg = getAIConfig_();
  var model = cfg.MODEL;

  var payload = {
    model: model,
    messages: [
      { role: 'system', content: 'You are an expert eBay Item Specifics extractor. Always respond with valid JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: cfg.TEMPERATURE,
    max_tokens: cfg.MAX_TOKENS,
    response_format: { type: 'json_object' }
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
    timeout: cfg.TIMEOUT // Note: GASのfetchでは効かないが将来用
  };

  var response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code !== 200) {
    var errMsg = 'OpenAI API error (HTTP ' + code + ')';
    try {
      var errObj = JSON.parse(body);
      errMsg += ': ' + (errObj.error && errObj.error.message || body);
    } catch (e) {}
    throw new Error(errMsg);
  }

  var result = JSON.parse(body);
  return result.choices[0].message.content;
}

// OpenAI 複数並列呼び出し
function callOpenAIBatch_(prompts) {
  var docProps = PropertiesService.getDocumentProperties();
  var apiKey = docProps.getProperty('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OpenAI APIキーが設定されていません。メニュー > 設定メニュー > 初期設定 から設定してください。');
  }

  var cfg = getAIConfig_();
  var model = cfg.MODEL;

  var requests = [];
  var i;
  for (i = 0; i < prompts.length; i++) {
    requests.push({
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      payload: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are an expert eBay Item Specifics extractor. Always respond with valid JSON only.' },
          { role: 'user', content: prompts[i] }
        ],
        temperature: cfg.TEMPERATURE,
        max_tokens: cfg.MAX_TOKENS,
        response_format: { type: 'json_object' }
      }),
      muteHttpExceptions: true
    });
  }

  return UrlFetchApp.fetchAll(requests);
}

// レスポンス解析
function parseExtractionResponse_(responseText, fields, existingData) {
  var text = safeStripCodeFences_(responseText);
  var obj;
  try {
    obj = JSON.parse(text);
  } catch (e) {
    obj = {};
  }

  // _category はメタデータなので除外
  var result = {};

  if (fields && fields.length > 0) {
    // フィールド定義がある場合: 定義に沿ってマッピング
    for (var i = 0; i < fields.length; i++) {
      var f = fields[i] || {};
      var key = f.name || '';
      if (!key) continue;

      var val;
      if (obj.hasOwnProperty(key)) {
        val = obj[key];
      } else {
        var k;
        for (k in obj) {
          if (obj.hasOwnProperty(k) && String(k).toLowerCase() === String(key).toLowerCase()) {
            val = obj[k];
            break;
          }
        }
      }

      var normalized = normalizeFieldValue_(key, val);
      if (normalized === null || typeof normalized === 'undefined' || normalized === '') {
        if (isRequiredField_(f)) {
          if (String(key).toLowerCase() === 'brand') {
            result[key] = 'Unbranded';
          } else {
            result[key] = 'Does not apply';
          }
        }
      } else {
        result[key] = normalized;
      }
    }
  } else {
    // フィールド定義がない場合: AIが返した全フィールドを使用
    for (var k2 in obj) {
      if (!obj.hasOwnProperty(k2)) continue;
      if (k2 === '_category') continue; // メタデータ除外
      var val2 = obj[k2];
      var normalized2 = normalizeFieldValue_(k2, val2);
      if (normalized2 !== null && typeof normalized2 !== 'undefined' && normalized2 !== '') {
        result[k2] = normalized2;
      }
    }
  }
  
  // existingDataをマージ（Step1の結果を保持、AIが空/不正値の場合はStep1の値を使用）
  if (existingData && typeof existingData === 'object') {
    var eKeys = Object.keys(existingData);
    for (var ei2 = 0; ei2 < eKeys.length; ei2++) {
      var eKey = eKeys[ei2];
      var eVal = existingData[eKey];
      if (!eVal || eVal === '' || eVal === 'Does not apply') continue;
      var aiVal = result[eKey];
      var isAiBad = !aiVal || aiVal === '' || aiVal === 'Does not apply' || aiVal === 'Unbranded';
      if (!isAiBad) {
        // AIの値が短すぎる場合（"N", "N/A", "-" 等）もStep1を優先
        var aiTrimmed = String(aiVal).trim();
        if (aiTrimmed.length <= 3 && String(eVal).trim().length > 3) {
          isAiBad = true;
        }
      }
      if (isAiBad) {
        result[eKey] = eVal;
      }
    }
  }

  // 時計カテゴリ専用の後処理（MovementまたはDisplayフィールドがあれば時計と判定）
  var hasWatchFields = result.hasOwnProperty('Movement') || result.hasOwnProperty('Display');
  if (hasWatchFields) {
    result = postProcessWatches_(result, '', '');
  }

  return result;
}

// ——— ヘルパー ———

function isRequiredField_(fieldDef) {
  if (!fieldDef) return false;
  var t = String(fieldDef.type || '').toLowerCase();
  return t === 'required';
}

function normalizeFieldValue_(fieldName, value) {
  if (value === null || typeof value === 'undefined') return null;

  // 文字列正規化
  if (typeof value === 'string') {
    // 前後空白と引用符を除去
    var s = value.replace(/^[\s"']+|[\s"']+$/g, '');
    // 空文字は null とみなす
    if (!s) return null;

    // Does not apply の正規化
    if (/^does\s*not\s*apply$/i.test(s)) return 'Does not apply';

    // Unbranded の正規化
    if (/^unbranded$/i.test(s)) return 'Unbranded';

    // Yes/No の正規化（よくあるバリアント）
    if (/^(true|false|yes|no|y|n)$/i.test(s)) {
      return (/^(true|yes|y)$/i.test(s)) ? 'Yes' : 'No';
    }

    return s;
  }

  // 真偽値
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  // 数値はそのまま文字列化（mm/cm混同はモデル側ルールでカバー）
  if (typeof value === 'number') {
    return String(value);
  }

  // 配列はカンマ区切り
  if (value && value.splice && value.join) {
    return value.join(', ');
  }

  // オブジェクトはJSONにフォールバック
  try { return JSON.stringify(value); } catch (e) { return null; }
}

function safeStripCodeFences_(text) {
  if (!text) return '';
  var s = String(text);
  // ```json ... ``` / ``` ... ``` の除去
  if (/^```/.test(s)) {
    s = s.replace(/^```json\s*/i, '');
    s = s.replace(/^```\s*/i, '');
    s = s.replace(/```\s*$/i, '');
  }
  return s;
}

/**
 * 時計カテゴリ専用の後処理
 * AIの出力を補正する（Display推論、Case Materialデフォルト）
 * @param {Object} data - AIが返した抽出結果
 * @param {string} title - タイトル
 * @param {string} description - 説明文
 * @return {Object} 補正後のデータ
 */
function postProcessWatches_(data, title, description) {
  if (!data) return data;

  var combined = ((title || '') + ' ' + (description || '')).toLowerCase();

  // === Display 推論 ===
  var display = data['Display'] || '';
  if (!display || display === 'Does not apply' || display === '') {
    var movement = (data['Movement'] || '').toLowerCase();
    if (combined.indexOf('digital') !== -1 && combined.indexOf('analog') !== -1) {
      data['Display'] = 'Analog & Digital';
    } else if (combined.indexOf('digital') !== -1 || combined.indexOf('g-shock') !== -1 || combined.indexOf('g shock') !== -1) {
      data['Display'] = 'Digital';
    } else {
      // Automatic, Mechanical, Manual, Quartz, Solar, Kinetic → 全てデフォルトAnalog
      data['Display'] = 'Analog';
    }
  }

  // === Case Material デフォルト ===
  var caseMat = data['Case Material'] || '';
  if (!caseMat || caseMat === 'Does not apply' || caseMat === '') {
    // テキストにTitaniumが明示されていればTitanium、それ以外はStainless Steel
    if (combined.indexOf('titanium') !== -1 || combined.indexOf('チタン') !== -1) {
      data['Case Material'] = 'Titanium';
    } else {
      data['Case Material'] = 'Stainless Steel';
    }
  } else {
    // AIが返した値がStainless SteelまたはTitanium以外なら補正
    var caseMatLower = caseMat.toLowerCase();
    if (caseMatLower === 'titanium') {
      data['Case Material'] = 'Titanium';
    } else if (caseMatLower === 'stainless steel') {
      data['Case Material'] = 'Stainless Steel';
    } else {
      // Silver, Gold, Platinum等の不適切な値 → Stainless Steelに補正
      // テキストにTitaniumがあればTitanium
      if (combined.indexOf('titanium') !== -1 || combined.indexOf('チタン') !== -1) {
        data['Case Material'] = 'Titanium';
      } else {
        data['Case Material'] = 'Stainless Steel';
      }
    }
  }

  return data;
}
