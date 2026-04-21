# タスク: IS_INITIAL_DATA と IS_CATEGORY_FIELDS の整合性修正

## 対象ファイル
- `ItemSpecifics/Config_IS.gs`
- `Library/Config_IS.gs`
両方に同じ修正を適用する。

## 修正1: IS_CATEGORY_FIELDSの `Country/Region of Manufacture` を `Country of Origin` に一括置換

IS_CATEGORY_FIELDS内の全カテゴリで `'Country/Region of Manufacture'` を `'Country of Origin'` に置換する。
対象: 32カテゴリ（Watches, Rings, Bracelets, Earrings, Handbags, Clothing, Shoes, Cameras, Electronics, Scarves, Collectibles, Watch Parts, Sunglasses, Video Games, Video Game Consoles, Fishing Reels, Soap, Dolls & Plush, Hats, Kimono, Japanese Swords, Tea Ceremony, Bonsai, Prints, Buddhist Art, Tetsubin, Tennis, Japanese Instruments, RC & Models, Anime, Stamps, Coins）

## 修正2: 孤立カテゴリ `Necklaces & Pendants` のIS_INITIAL_DATAエントリを削除

IS_INITIAL_DATA内の `category: 'Necklaces & Pendants'` のエントリを全て削除する。（`Necklaces` に統合済み）

## 修正3: 既存カテゴリのIS_INITIAL_DATAをIS_CATEGORY_FIELDSに合わせて修正

IS_CATEGORY_FIELDSが正とする。各カテゴリのIS_INITIAL_DATAを以下のルールで修正:

### 方針
- IS_CATEGORY_FIELDSにないfield_nameのIS_INITIAL_DATAエントリは**削除**
- IS_CATEGORY_FIELDSにあるがIS_INITIAL_DATAにないfield_nameは**追加**（field_type: 'recommended', notes: ''）
- priorityは1から連番で振り直す
- tag_jpは既存のものを維持
- `Country/Region of Manufacture` → `Country of Origin` に統一（IS_INITIAL_DATA内も）

### 対象カテゴリと具体的な修正内容

**Watches** (IS_CATEGORY_FIELDS: Brand, Model, Display, Movement, Case Material, Case Size, Wrist Size, Dial Color, Department, Country of Origin)
- 削除: Reference Number, Type, Band Material, Year Manufactured, Water Resistance, With Papers, With Original Box
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Rings** (IS_CATEGORY_FIELDS: Brand, Designer, Metal, Metal Purity, Main Stone, Type, Country of Origin)
- 削除: Ring Size, Cut Grade, Main Stone Color, Main Stone Creation, Setting Style, Country of Origin(旧)
- `Country/Region of Manufacture`は存在しないので不要
- Designer がFIELDSにあるがINITIALにない → 追加
- priority振り直し

**Bracelets** (IS_CATEGORY_FIELDS: Brand, Designer, Metal, Metal Purity, Main Stone, Type, Country of Origin)
- 削除: Length, Setting Style, Closure, Country of Origin(旧)
- Designer がFIELDSにあるがINITIALにない → 追加
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Earrings** (IS_CATEGORY_FIELDS: Brand, Designer, Metal, Metal Purity, Main Stone, Type, Country of Origin)
- 削除: Fastening, Setting Style, Country of Origin(旧)
- Designer がFIELDSにあるがINITIALにない → 追加
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Handbags** (IS_CATEGORY_FIELDS: Brand, Style, Exterior Material, Exterior Color, Department, Country of Origin)
- 削除: Bag Width, Bag Height, Bag Depth, Handle/Strap Material, Hardware Color, Lining Material, Pattern, Country of Origin(旧)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Clothing** (IS_CATEGORY_FIELDS: Brand, Type, Department, Color, Material, Country of Origin)
- 削除: Size, Size Type, Sleeve Length, Closure, Style, Fabric Type, Pattern, Country of Origin(旧)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Shoes** (IS_CATEGORY_FIELDS: Brand, Type, Department, Color, Material, Country of Origin)
- 削除: US Shoe Size, Width, Style, Pattern, Country of Origin(旧)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Cameras** (IS_CATEGORY_FIELDS: Brand, Model, Type, Series, Color, Maximum Resolution, Battery Type, Features, Lens Mount, Country of Origin)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Electronics** (IS_CATEGORY_FIELDS: Brand, Type, Color, Country of Origin)
- 削除: Model, Features, Screen Size, Connectivity, Country of Origin(旧)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Scarves** (IS_CATEGORY_FIELDS: Brand, Type, Material, Color, Size, Pattern, Country of Origin)
- `Country/Region of Manufacture` → `Country of Origin`（既にCountry of OriginがあるならCountry/Region of Manufactureを削除）
- priority振り直し

**Watch Parts** (IS_CATEGORY_FIELDS: Brand, Part Type, Material, Compatible Model, Size, Color, Country of Origin)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Sunglasses** (IS_CATEGORY_FIELDS: Brand, Model, Frame Color, Lens Color, Frame Material, Style, Department, Country of Origin)
- 削除: Protection, Lens Technology, Country of Origin(旧)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Trading Cards** (IS_CATEGORY_FIELDS: Game, Set, Character, Card Name, Card Number, Rarity, Finish, Graded, Professional Grader, Grade)
- 削除: Specialty, Language, Features
- priority振り直し

**Video Games** (IS_CATEGORY_FIELDS: Platform, Game Name, Region Code, Genre, Character, Publisher, Rating, Language, Country of Origin)
- 削除: Features
- priority振り直し

**Soap** (IS_CATEGORY_FIELDS: Brand, Type, Scent, Product Line, Color, Country of Origin)
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

**Golf** (IS_CATEGORY_FIELDS: Brand, Golf Club Type, Handedness, Model, Flex, Shaft Material, Loft, Club Number, Set Makeup, Department)
- 削除: Type, Country/Region of Manufacture
- 追加: Model, Club Number, Set Makeup, Department
- priority振り直し

**Baseball** (IS_CATEGORY_FIELDS: Brand, Handedness, Player Position, Size, Type, Material, Color, Sport/Activity, Country of Origin, Model Year)
- 削除: Country/Region of Manufacture
- 追加: Color, Sport/Activity, Country of Origin, Model Year
- priority振り直し

**Fishing Rods** (IS_CATEGORY_FIELDS: Brand, Rod Type, Model, Item Length, Rod Power, Rod Action, Fish Species, Fishing Type, Material, Lure Weight)
- 削除: Country/Region of Manufacture
- 追加: Material, Lure Weight
- priority振り直し

**Figures** (IS_CATEGORY_FIELDS: Franchise, Character, Type, Brand, Scale, Material, Theme, Original/Licensed Reproduction, Series, Vintage)
- 削除: Country/Region of Manufacture
- 追加: Theme, Original/Licensed Reproduction, Series, Vintage
- priority振り直し

**Records** (IS_CATEGORY_FIELDS: Artist, Release Title, Genre, Record Grading, Record Label, Format, Record Size, Release Year, Sleeve Grading, Country of Origin)
- 削除: Edition, Country/Region of Manufacture
- 追加: Release Title, Release Year, Sleeve Grading, Country of Origin
- priority振り直し

**Japanese Swords** (IS_CATEGORY_FIELDS: Type, Blade Material, Original/Reproduction, Handedness, Material, Country of Origin)
- IS_INITIAL_DATAで field_name `Color` → `Material` に変更（IS_CATEGORY_FIELDSに合わせる）
- ただし既に`Material`エントリがあるなら`Color`エントリを削除
- `Country/Region of Manufacture` → `Country of Origin`
- priority振り直し

## 注意
- tag_jpは既存のものを維持する（変更しない）
- 新規追加分（今回追加した26カテゴリ）のIS_INITIAL_DATAは変更しない
- 必ずルートとLibrary両方を修正する
- 修正後、IS_INITIAL_DATAの各カテゴリのfield_name一覧がIS_CATEGORY_FIELDSと完全一致すること
