// Detailed agronomic context for Sri Lankan crops and plants.
// Curated based on Sri Lanka Department of Agriculture (DOA), CRI, TRI, and RRI standards.
// Injected into the AI prompt so the chatbot provides authoritative, variety-specific,
// fertilizer-specific, and district-adapted advice.

const CROP_CONTEXT = {
  Rice: {
    sinhalaName: 'වී (Paddy / Rice)',
    institutes: 'Rice Research and Development Institute (RRDI) - Batalagoda, Ambalantota, Bombuwela, Labuduwa',
    recommendedVarieties: {
      dryAndIntermediate: 'Bg 300 (3 months, high yielding), Bg 352 (3.5 months, popular white rice), Bg 358 (red rice), Bg 366 (submergence tolerant), At 362 (red, high yield), Bw 367 (intermediate zone), Ld 365',
      wetZone: 'Bw 367, Bw 372, Ld 368, Bg 379/2 (tolerant to iron toxicity in low-lying wet soils)',
      traditional: 'Suwandel (fragrant, low GI), Kalu Heenati (medicinal, pest-resistant), Pachchaperumal, Kuruluthuda, Madathawalu',
    },
    seasons: 'Maha (Oct–March, North-East monsoon) and Yala (April–September, South-West monsoon)',
    fertilizerDOA: 'Basal: Compost/cattle manure + TSP (Triple Superphosphate) + Zinc sulfate. Top dressings: Urea split into 3 doses (2 weeks after planting, panicle initiation at ~5-6 weeks, and booting stage). MOP (Muriate of Potash) applied with basal and panicle initiation. For saline/ill-drained soils, adjust potassium and zinc.',
    waterManagement: 'Maintain 3-5 cm water layer in early stages. Practice AWD (Alternate Wetting and Drying) to save 20-30% water and reduce methane emissions without yield loss.',
    keyPestsAndDiseases: 'Paddy Blast (Pyricularia oryzae - treat with Tricyclazole or validamycin if severe, avoid excess nitrogen), Brown Planthopper (BPH - Nilaparvata lugens, maintain field drainage, avoid broad-spectrum pyrethroids), Stem Borer (Chilo suppressalis), Sheath Blight.',
  },
  Tea: {
    sinhalaName: 'තේ (Tea)',
    institutes: 'Tea Research Institute of Sri Lanka (TRI) - Talawakelle',
    recommendedVarieties: {
      highGrown: 'TRI 2023, TRI 2025, TRI 2026, TRI 4042, DT 1, CY 9 (suited for Nuwara Eliya, Badulla highlands)',
      midAndLowGrown: 'TRI 2025, TRI 2026, TRI 2027, TRI 3015, TRI 4049 (suited for Galle, Matara, Ratnapura, Kandy, Kegalle)',
    },
    seasons: 'Perennial crop. Peak flushing occurs after monsoonal rains. Regular plucking every 7 days in low-country and 7-10 days in high-country.',
    fertilizerDOA: 'TRI recommended mixtures: U-709, U-811 for mature tea. Dolomite applied every 2-3 years to regulate soil pH (optimal 4.5–5.5). Foliar application of Zinc sulfate during active flushing.',
    waterManagement: 'High moisture requirement (>1800mm/yr). Rainfed. In dry spells, maintain shade trees (Albizia, Grevillea) and mulch with Mana or Guatemala grass.',
    keyPestsAndDiseases: 'Blister Blight (Exobasidium vexans - worse in wet/misty conditions; treat with copper fungicides), Shot Hole Borer (Xyleborus fornicatus), Tea Tortrix (Homona coffearia - biological control via Macrocentrus homonae), Red Spider Mite.',
  },
  Coconut: {
    sinhalaName: 'පොල් (Coconut)',
    institutes: 'Coconut Research Institute (CRI) - Lunuwila',
    recommendedVarieties: {
      commercial: 'CRIC 60 (Tall x Tall), CRIC 65 (Dwarf x Tall), CRISL 98 (improved drought tolerance), Kapruwana, Kapsuwa',
      kingCoconut: 'Thembili (King Coconut - beverage variety)',
    },
    seasons: 'Perennial. Regular harvesting every 45-60 days (6-8 picks per year).',
    fertilizerDOA: 'CRI Adult Palm Mixture (APM: Urea + Rock Phosphate / ERP + MOP + Dolomite). Apply in circular trench 1.5m radius around the base twice a year (before monsoons). Coconut husk burial in trenches for water retention.',
    waterManagement: 'Requires 1300-2300mm annual rainfall. In dry zones (Puttalam, Hambantota), husk burying in trenches and drip irrigation significantly increase nut set.',
    keyPestsAndDiseases: 'Red Palm Weevil (Rhynchophorus ferrugineus - look for entry holes, chew sounds, use pheromone traps), Rhinoceros Beetle (Oryctes rhinoceros - damage to young fronds; use metarhizium green fungus), Weligama Coconut Leaf Wilt Disease (phytoplasma in Southern Sri Lanka; quarantine measures mandatory), Coconut Mite (Aceria guerreronis).',
  },
  Rubber: {
    sinhalaName: 'රබර් (Rubber)',
    institutes: 'Rubber Research Institute of Sri Lanka (RRISL) - Agalawatta / Dartonfield',
    recommendedVarieties: {
      clones: 'RRIC 100, RRIC 102, RRIC 121 (high yielder, adaptable), RRIC 130, RRISL 203, RRISL 2001',
    },
    seasons: 'Tapping starts at 6-7 years when girth reaches 50cm at 120cm height. Tapping done early morning (S/2 d2 system). Avoid tapping on rainy days unless rainguards are fitted.',
    fertilizerDOA: 'RRI General Nursery & Immature mixtures (Urea + RP + MOP + Kieserite). Mature rubber: R/M 12:8:10.',
    waterManagement: 'Requires 2000-3000mm rainfall. Susceptible to waterlogging in flat lands; deep drainage canals essential.',
    keyPestsAndDiseases: 'White Root Disease (Rigidoporus microporus - treat early with hexaconazole/tebuconazole), Corynespora Leaf Fall Disease (causes fish-bone leaf symptoms), Phytophthora Leaf Fall and Bark Rot, Powdery Mildew during refoliation.',
  },
  Vegetables: {
    sinhalaName: 'එළවළු (Up-country & Low-country Vegetables)',
    institutes: 'Horticultural Crop Research and Development Institute (HORDI) - Gannoruwa, Sita Eliya',
    recommendedVarieties: {
      upCountry: 'Potato (Granola, Desiree), Cabbage (K-K Cross), Carrot (New Kuroda), Leeks, Beetroot, Bush beans, Tomato (Thilina, Maheshi, Rashmi)',
      lowCountry: 'Brinjal (SM 164, Padagoda, Amanda, Terena), Okra / Bandakka (Haritha, MI 5, MI 7), Snake gourd (TA 2), Bitter gourd (MC 43), Luffa (LA 33), Tomato (Thilina, T-146)',
    },
    seasons: 'Up-country: Year-round in rotations. Low-country: Maha and Yala, inter-monsoonal dry periods under protected or drip irrigation.',
    fertilizerDOA: 'Basal: 10-15 tons/ha well-decomposed cattle manure or compost + TSP + MOP + Urea. Top dressing: Weekly or fortnightly fertigation / urea top-dressings based on vegetative vs flowering stage. Albert\'s solution recommended for fertigation.',
    waterManagement: 'Drip irrigation for low-country raised beds. Furrow irrigation or micro-sprinklers for hill slopes. Straw mulching helps prevent evaporation and soil erosion.',
    keyPestsAndDiseases: 'Damping-off in nurseries (Pythium/Rhizoctonia - treat seeds with Captan/Thiram), Fruit Fly (Bactrocera cucurbitae - use pheromone cue-lure traps), Whiteflies and Thrips (use yellow sticky traps, neem seed extract), Bacterial Wilt (Ralstonia solanacearum - crop rotation with maize/paddy, avoid solanaceous after solanaceous).',
  },
  Chilli: {
    sinhalaName: 'මිරිස් (Chilli / Pepper)',
    institutes: 'Field Crops Research and Development Institute (FCRDI) - Mahailluppallama',
    recommendedVarieties: {
      varieties: 'MI-1, MI-2 (hot, traditional favorite), MICH-3 (high yield, tolerant to leaf curl), Arunalu, Waraniya, KA-2',
    },
    seasons: 'Yala season (with irrigation) is prime in Dry Zone to avoid high rainfall anthracnose. Maha season requires well-drained raised beds.',
    fertilizerDOA: 'Basal: Compost 10 t/ha + Urea 50 kg/ha + TSP 100 kg/ha + MOP 35 kg/ha. Top dressings at 2, 4, 8, and 12 weeks after transplanting. Potassium essential for pungency and firmness.',
    waterManagement: 'Sensitive to both drought and waterlogging. Raised beds (20-25 cm height) mandatory. Furrow or drip irrigation every 3-5 days in dry zone.',
    keyPestsAndDiseases: 'Chilli Leaf Curl Complex (caused by Thrips, Broad Mites, and Whiteflies carrying CLCV; use reflective silver mulch, yellow/blue sticky traps, systemic sprays like Imidacloprid/Abamectin only if threshold exceeded), Anthracnose / Fruit Rot (Colletotrichum capsici - worse during rains; use copper oxychloride or Mancozeb), Root Rot.',
  },
  Onions: {
    sinhalaName: 'ළූණු (Red Onion & Big Onion)',
    institutes: 'Grain Legumes and Oil Crops Research and Development Centre (GLORDC) - Angunakolapelessa, Mahailluppallama',
    recommendedVarieties: {
      redOnion: 'Vedalan (highest quality, sharp flavor, Jaffna & Puttalam), Kalpitiya Local, Jaffna Local, Vethalam',
      bigOnion: 'Dambulla Selection (adapted to Matale/Dambulla), MI Big Onion 1',
    },
    seasons: 'Red onion: 3-4 seasons/year under well-irrigation in Jaffna/Kalpitiya. Big onion: strictly Yala season (May–September) in Dambulla, Polonnaruwa, Anuradhapura (dry weather needed for curing).',
    fertilizerDOA: 'Basal: Well-rotted cow manure (15-20 t/ha) + TSP + basal Urea + MOP. Top dressing: Split nitrogen applications at 3 and 5 weeks after planting. Stop nitrogen 3 weeks before harvest for good storage.',
    waterManagement: 'Shallow root system requires frequent light irrigation. Stop watering 10-14 days before harvest to allow outer bulbs to cure and prevent neck rot.',
    keyPestsAndDiseases: 'Thrips (Thrips tabaci - causes silvery leaves; manage with neem extract or spinosad), Purple Blotch (Alternaria porri - brown/purple oval lesions; treat with Mancozeb), Basal Rot (Fusarium oxysporum - crop rotation with non-allium crops).',
  },
  Maize: {
    sinhalaName: 'ඉරිඟු (Maize / Corn)',
    institutes: 'FCRDI Mahailluppallama',
    recommendedVarieties: {
      hybridsAndOpen: 'Bhadra, Ruwan, Pacific 984, Jet 999, Pioneer hybrids (suited for Anuradhapura, Monaragala, Ampara, Kurunegala)',
    },
    seasons: 'Mainly Maha (rainfed cultivation in Chena / upland fields) and Yala (under tank/deep-well irrigation).',
    fertilizerDOA: 'Basal: Urea 50 kg + TSP 100 kg + MOP 50 kg/ha. Top dressing: Urea at knee-high stage (4 weeks) and tasseling stage (7 weeks).',
    waterManagement: 'Critical water stages: tasseling and silking/grain filling. Drought at silking causes blank cobs.',
    keyPestsAndDiseases: 'Fall Armyworm / සේනා දළඹුවා (Spodoptera frugiperda - inspect whorl early, apply spinetoram, emamectin benzoate, or neem cake into the whorl, use pheromone traps), Stem Borer, Downy Mildew.',
  },
  Fruits: {
    sinhalaName: 'පලතුරු (Fruits - Banana, Mango, Papaya, Passion fruit)',
    institutes: 'Fruit Research and Development Institute (FRDI) - Kananwila, Horana',
    recommendedVarieties: {
      banana: 'Ambul (sour banana, high demand), Kolikuttu (silk, premium), Embon (dessert), Anamalu, Seeni (drought tolerant)',
      mango: 'TEJC (Tom EJC - export king, high yield), Willard, Karthakolomban (Vellaicomban), Pol Amba',
      papaya: 'Red Lady (high yield, hermaphrodite, sweet red flesh), Rathna',
      passionFruit: 'Rahangala Hybrid (purple x yellow)',
    },
    seasons: 'Banana & Papaya: Year-round production with staggered planting. Mango: Main season April–June, off-season Nov–Jan.',
    fertilizerDOA: 'Banana: 200g Urea, 150g TSP, 300g MOP per mat per year in 4 splits. Mango: Apply complete NPK after post-harvest pruning + Paclobutrazol for off-season flowering in dry zone.',
    waterManagement: 'Banana requires high water (drip irrigation 15-20L/plant/day in dry zone). Mango prefers dry spell before flowering followed by irrigation during fruit enlargement.',
    keyPestsAndDiseases: 'Banana: Panama Wilt (Fusarium oxysporum - plant tissue-cultured disease-free suckers), Banana Bunchy Top Virus (BBTV - spread by Pentalonia aphids, rogue infected mats immediately). Mango: Anthracnose (hot water dip at 52°C for 5 mins after harvest), Fruit Fly. Papaya: Papaya Ringspot Virus (PRSV).',
  },
  Spices: {
    sinhalaName: 'කුළුබඩු (Spices - Cinnamon, Black Pepper, Cardamom, Clove)',
    institutes: 'Department of Export Agriculture (DEA) - Matale, National Cinnamon Research Station - Palolpitiya (Matara)',
    recommendedVarieties: {
      cinnamon: 'Sri Gemunu, Sri Vijaya (high cinnamaldehyde and oil yield, southern coastal belt)',
      pepper: 'Panniyur 1, Kuching, Dingi Rala, Boota Rala (Matale, Kandy, Kegalle, Kurunegala)',
      cardamom: 'Malabar, Mysore (highland rainforests >1000m: Nuwara Eliya, Kandy)',
      clove: 'Local selected high-eugenol types (Kandy, Matale, Kegalle)',
    },
    seasons: 'Cinnamon: Peeling during wet months when bark slips easily (May–July & Oct–Dec). Pepper: Harvesting Jan–April.',
    fertilizerDOA: 'DEA specific spice mixtures (NPK: 12-14-14 for cinnamon, 14-8-14 for pepper). Apply before monsoons.',
    waterManagement: 'Cinnamon thrives in southern wet zone sands and laterites. Pepper requires well-drained soil, live supports (Gliricidia sepium).',
    keyPestsAndDiseases: 'Cinnamon: Rough Bark Disease (Phomopsis sp.), Leaf Gall Mite (Eriophyes boisi). Pepper: Quick Wilt / Foot Rot (Phytophthora capsici - apply Trichoderma or metalaxyl, maintain drainage), Pollu beetle.',
  },
};

function getCropContext(cropType) {
  if (!cropType) return null;
  const key = Object.keys(CROP_CONTEXT).find(
    (k) => k.toLowerCase() === cropType.trim().toLowerCase()
  );
  return key ? CROP_CONTEXT[key] : null;
}

module.exports = { getCropContext, CROP_CONTEXT };
