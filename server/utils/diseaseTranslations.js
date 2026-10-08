// Sinhala translations and agricultural term dictionary for plant diseases.
// Corrects automated translations and provides authoritative Sri Lankan Sinhala names.

const DISEASE_NAME_SI_MAP = {
  // Corn / Maize diseases
  'southern rust of corn': 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය',
  'southern corn rust': 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය',
  'common rust of corn': 'බඩඉරිඟු වල මලකඩ රෝගය',
  'corn common rust': 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය',
  'corn rust': 'බඩඉරිඟු වල මලකඩ රෝගය',
  'common rust': 'බඩඉරිඟු වල මලකඩ රෝගය',
  'corn blight': 'බඩඉරිඟු කොළ අංගමාරය',
  'southern corn leaf blight': 'බඩඉරිඟු දක්ෂිණ කොළ අංගමාරය',
  'northern corn leaf blight': 'බඩඉරිඟු උත්තර කොළ අංගමාරය',
  'corn gray leaf spot': 'බඩඉරිඟු අළු කොළ ලප රෝගය',
  'gray leaf spot': 'අළු කොළ ලප රෝගය',

  // Banana diseases
  'banana cordana': 'කෙසෙල් කොර්ඩෝනා කොළ ලප රෝගය',
  'cordana leaf spot': 'කෙසෙල් කොර්ඩෝනා කොළ ලප රෝගය',
  'banana panama disease': 'කෙසෙල් පැනමා රෝගය',
  'panama disease': 'කෙසෙල් පැනමා රෝගය',
  'banana sigatoka': 'කෙසෙල් සිගටෝකා රෝගය',
  'banana yellow and black sigatoka': 'කෙසෙල් කහ සහ කළු සිගටෝකා රෝගය',
  'sigatoka': 'කෙසෙල් සිගටෝකා රෝගය',

  // Bell Pepper / Chilli diseases
  'bacterial spot': 'බැක්ටීරියා කොළ ලප රෝගය',
  'bell pepper bacterial spot': 'මිරිස්/බෙල් පෙපර් බැක්ටීරියා ලප රෝගය',
  'pepper bacterial spot': 'මිරිස් බැක්ටීරියා ලප රෝගය',

  // Potato diseases
  'potato early blight': 'අර්තාපල් මුල් අංගමාරය',
  'potato late blight': 'අර්තාපල් අග අංගමාරය',

  // Rice diseases
  'rice bacterial leaf blight': 'වී බැක්ටීරියා කොළ අංගමාරය',
  'bacterial leaf blight': 'වී බැක්ටීරියා කොළ අංගමාරය',
  'rice brown spot': 'ගොයම් දුඹුරු ලප රෝගය',
  'brown spot': 'දුඹුරු ලප රෝගය',
  'rice leaf blast': 'ගොයම් කොළ පිපිරුම / බ්ලාස්ට් රෝගය',
  'leaf blast': 'ගොයම් කොළ පිපිරුම / බ්ලාස්ට් රෝගය',
  'rice leaf scald': 'වී කොළ පිළිස්සුම් රෝගය',
  'rice sheath blight': 'ගොයම් කොපු අංගමාරය',
  'sheath blight': 'ගොයම් කොපු අංගමාරය',

  // Tea diseases
  'tea algal spot': 'තේ ඇල්ගී ලප රෝගය',
  'tea brown blight': 'තේ දුඹුරු අංගමාරය',
  'tea gray blight': 'තේ අළු අංගමාරය',
  'tea helopeltis': 'තේ හෙලෝපෙල්ටිස් හානිය',
  'tea red spot': 'තේ රතු ලප රෝගය',

  // Tomato diseases
  'tomato bacterial spot': 'තක්කාලි බැක්ටීරියා ලප රෝගය',
  'tomato early blight': 'තක්කාලි මුල් අංගමාරය',
  'tomato late blight': 'තක්කාලි අග අංගමාරය',
  'tomato leaf mold': 'තක්කාලි කොළ පුස් රෝගය',
  'tomato mosaic virus': 'තක්කාලි මොසැයික් වෛරසය',
  'tomato septoria leaf spot': 'තක්කාලි සෙප්ටෝරියා කොළ ලප රෝගය',
  'septoria leaf spot': 'සෙප්ටෝරියා කොළ ලප රෝගය',
  'tomato spider mites': 'තක්කාලි මයිටා හානිය',
  'spider mites': 'මයිටා හානිය',
  'tomato target spot': 'තක්කාලි ඉලක්ක ලප රෝගය',
  'target spot': 'ඉලක්ක ලප රෝගය',
  'tomato yellow leaf curl': 'තක්කාලි කහ කොළ කොඩවීම',
  'yellow leaf curl': 'තක්කාලි කහ කොළ කොඩවීම',
  'early blight': 'මුල් අංගමාරය',
  'late blight': 'අග අංගමාරය',
};

function fixSinhalaMistranslations(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/දකුණු\s+කුකුළු\s+බොජුනේ/g, 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය')
    .replace(/කුකුළු\s+බොජුනේ/g, 'මලකඩ රෝගය')
    .replace(/කුකුළු\s+බොජුන්/g, 'මලකඩ රෝගය');
}

function sanitizeSinhalaDiagnosis(diagnosis) {
  if (!diagnosis) return diagnosis;
  const result = { ...diagnosis };

  // 1. Direct dictionary lookup for disease_name_en
  if (result.disease_name_en) {
    const key = result.disease_name_en.trim().toLowerCase();
    if (DISEASE_NAME_SI_MAP[key]) {
      result.disease_name_si = DISEASE_NAME_SI_MAP[key];
    } else if (key.includes('southern rust') || (key.includes('rust') && (key.includes('corn') || key.includes('maize')))) {
      result.disease_name_si = 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය';
    }
  }

  // 2. Fix mistranslations like "දකුණු කුකුළු බොජුනේ" in disease_name_si
  if (result.disease_name_si) {
    if (result.disease_name_si.includes('කුකුළු බොජුනේ') || result.disease_name_si.includes('දකුණු කුකුළු')) {
      result.disease_name_si = 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය';
    } else {
      result.disease_name_si = fixSinhalaMistranslations(result.disease_name_si);
    }
  }

  // 3. Fix mistranslations in symptoms_si and treatment_si
  if (result.symptoms_si) {
    result.symptoms_si = fixSinhalaMistranslations(result.symptoms_si);
  }
  if (result.treatment_si) {
    result.treatment_si = fixSinhalaMistranslations(result.treatment_si);
  }

  return result;
}

// Authoritative map of the 35 classes from ml-service/model/class_names.json
const CLASS_35_MAP = {
  'Banana_Cordana': {
    class_name: 'Banana_Cordana',
    crop: 'Banana',
    disease_name_en: 'Banana Cordana Leaf Spot',
    disease_name_si: 'කෙසෙල් කොර්ඩෝනා කොළ ලප රෝගය',
    scientific_name: 'Cordana musae',
    is_healthy: false,
  },
  'Banana_Healthy': {
    class_name: 'Banana_Healthy',
    crop: 'Banana',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Banana_Panama_Disease': {
    class_name: 'Banana_Panama_Disease',
    crop: 'Banana',
    disease_name_en: 'Banana Panama Disease',
    disease_name_si: 'කෙසෙල් පැනමා රෝගය',
    scientific_name: 'Fusarium oxysporum f. sp. cubense',
    is_healthy: false,
  },
  'Banana_Yellow_and_Black_Sigatoka': {
    class_name: 'Banana_Yellow_and_Black_Sigatoka',
    crop: 'Banana',
    disease_name_en: 'Banana Sigatoka',
    disease_name_si: 'කෙසෙල් සිගටෝකා රෝගය',
    scientific_name: 'Pseudocercospora musae / Pseudocercospora fijiensis',
    is_healthy: false,
  },
  'Bell_Pepper_Bacterial_Spot': {
    class_name: 'Bell_Pepper_Bacterial_Spot',
    crop: 'Bell Pepper',
    disease_name_en: 'Bell Pepper Bacterial Spot',
    disease_name_si: 'මිරිස්/බෙල් පෙපර් බැක්ටීරියා ලප රෝගය',
    scientific_name: 'Xanthomonas campestris pv. vesicatoria',
    is_healthy: false,
  },
  'Bell_Pepper_Healthy': {
    class_name: 'Bell_Pepper_Healthy',
    crop: 'Bell Pepper',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Corn_Blight': {
    class_name: 'Corn_Blight',
    crop: 'Corn',
    disease_name_en: 'Corn Blight',
    disease_name_si: 'බඩඉරිඟු කොළ අංගමාරය',
    scientific_name: 'Exserohilum turcicum',
    is_healthy: false,
  },
  'Corn_Common_Rust': {
    class_name: 'Corn_Common_Rust',
    crop: 'Corn',
    disease_name_en: 'Corn Common Rust',
    disease_name_si: 'බඩඉරිඟු වල දක්ෂිණ මලකඩ රෝගය',
    scientific_name: 'Puccinia sorghi',
    is_healthy: false,
  },
  'Corn_Gray_Leaf_Spot': {
    class_name: 'Corn_Gray_Leaf_Spot',
    crop: 'Corn',
    disease_name_en: 'Corn Gray Leaf Spot',
    disease_name_si: 'බඩඉරිඟු අළු කොළ ලප රෝගය',
    scientific_name: 'Cercospora zeae-maydis',
    is_healthy: false,
  },
  'Corn_Healthy': {
    class_name: 'Corn_Healthy',
    crop: 'Corn',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Potato_Early_Blight': {
    class_name: 'Potato_Early_Blight',
    crop: 'Potato',
    disease_name_en: 'Potato Early Blight',
    disease_name_si: 'අර්තාපල් මුල් අංගමාරය',
    scientific_name: 'Alternaria solani',
    is_healthy: false,
  },
  'Potato_Healthy': {
    class_name: 'Potato_Healthy',
    crop: 'Potato',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Potato_Late_Blight': {
    class_name: 'Potato_Late_Blight',
    crop: 'Potato',
    disease_name_en: 'Potato Late Blight',
    disease_name_si: 'අර්තාපල් අග අංගමාරය',
    scientific_name: 'Phytophthora infestans',
    is_healthy: false,
  },
  'Rice_Bacterial_Leaf_Blight': {
    class_name: 'Rice_Bacterial_Leaf_Blight',
    crop: 'Rice',
    disease_name_en: 'Rice Bacterial Leaf Blight',
    disease_name_si: 'වී බැක්ටීරියා කොළ අංගමාරය',
    scientific_name: 'Xanthomonas oryzae pv. oryzae',
    is_healthy: false,
  },
  'Rice_Brown_Spot': {
    class_name: 'Rice_Brown_Spot',
    crop: 'Rice',
    disease_name_en: 'Rice Brown Spot',
    disease_name_si: 'ගොයම් දුඹුරු ලප රෝගය',
    scientific_name: 'Bipolaris oryzae',
    is_healthy: false,
  },
  'Rice_Healthy_Rice_Leaf': {
    class_name: 'Rice_Healthy_Rice_Leaf',
    crop: 'Rice',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Rice_Leaf_Blast': {
    class_name: 'Rice_Leaf_Blast',
    crop: 'Rice',
    disease_name_en: 'Rice Leaf Blast',
    disease_name_si: 'ගොයම් කොළ පිපිරුම / බ්ලාස්ට් රෝගය',
    scientific_name: 'Magnaporthe oryzae',
    is_healthy: false,
  },
  'Rice_Leaf_scald': {
    class_name: 'Rice_Leaf_scald',
    crop: 'Rice',
    disease_name_en: 'Rice Leaf Scald',
    disease_name_si: 'වී කොළ පිළිස්සුම් රෝගය',
    scientific_name: 'Microdochium oryzae',
    is_healthy: false,
  },
  'Rice_Sheath_Blight': {
    class_name: 'Rice_Sheath_Blight',
    crop: 'Rice',
    disease_name_en: 'Rice Sheath Blight',
    disease_name_si: 'ගොයම් කොපු අංගමාරය',
    scientific_name: 'Rhizoctonia solani',
    is_healthy: false,
  },
  'Tea_algal_spot': {
    class_name: 'Tea_algal_spot',
    crop: 'Tea',
    disease_name_en: 'Tea Algal Spot',
    disease_name_si: 'තේ ඇල්ගී ලප රෝගය',
    scientific_name: 'Cephaleuros virescens',
    is_healthy: false,
  },
  'Tea_brown_blight': {
    class_name: 'Tea_brown_blight',
    crop: 'Tea',
    disease_name_en: 'Tea Brown Blight',
    disease_name_si: 'තේ දුඹුරු අංගමාරය',
    scientific_name: 'Colletotrichum camelliae',
    is_healthy: false,
  },
  'Tea_gray_blight': {
    class_name: 'Tea_gray_blight',
    crop: 'Tea',
    disease_name_en: 'Tea Gray Blight',
    disease_name_si: 'තේ අළු අංගමාරය',
    scientific_name: 'Pestalotiopsis theae',
    is_healthy: false,
  },
  'Tea_healthy': {
    class_name: 'Tea_healthy',
    crop: 'Tea',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Tea_helopeltis': {
    class_name: 'Tea_helopeltis',
    crop: 'Tea',
    disease_name_en: 'Tea Helopeltis',
    disease_name_si: 'තේ හෙලෝපෙල්ටිස් හානිය',
    scientific_name: 'Helopeltis theivora',
    is_healthy: false,
  },
  'Tea_red_spot': {
    class_name: 'Tea_red_spot',
    crop: 'Tea',
    disease_name_en: 'Tea Red Spot',
    disease_name_si: 'තේ රතු ලප රෝගය',
    scientific_name: 'Cercospora theae',
    is_healthy: false,
  },
  'Tomato_Bacterial_Spot': {
    class_name: 'Tomato_Bacterial_Spot',
    crop: 'Tomato',
    disease_name_en: 'Tomato Bacterial Spot',
    disease_name_si: 'තක්කාලි බැක්ටීරියා ලප රෝගය',
    scientific_name: 'Xanthomonas vesicatoria',
    is_healthy: false,
  },
  'Tomato_Early_Blight': {
    class_name: 'Tomato_Early_Blight',
    crop: 'Tomato',
    disease_name_en: 'Tomato Early Blight',
    disease_name_si: 'තක්කාලි මුල් අංගමාරය',
    scientific_name: 'Alternaria linariae',
    is_healthy: false,
  },
  'Tomato_Healthy': {
    class_name: 'Tomato_Healthy',
    crop: 'Tomato',
    disease_name_en: 'No disease detected',
    disease_name_si: 'රෝගයක් හඳුනාගත නොහැකි විය',
    scientific_name: 'N/A',
    is_healthy: true,
  },
  'Tomato_Late_Blight': {
    class_name: 'Tomato_Late_Blight',
    crop: 'Tomato',
    disease_name_en: 'Tomato Late Blight',
    disease_name_si: 'තක්කාලි අග අංගමාරය',
    scientific_name: 'Phytophthora infestans',
    is_healthy: false,
  },
  'Tomato_Leaf_Mold': {
    class_name: 'Tomato_Leaf_Mold',
    crop: 'Tomato',
    disease_name_en: 'Tomato Leaf Mold',
    disease_name_si: 'තක්කාලි කොළ පුස් රෝගය',
    scientific_name: 'Passalora fulva',
    is_healthy: false,
  },
  'Tomato_Mosaic_Virus': {
    class_name: 'Tomato_Mosaic_Virus',
    crop: 'Tomato',
    disease_name_en: 'Tomato Mosaic Virus',
    disease_name_si: 'තක්කාලි මොසැයික් වෛරසය',
    scientific_name: 'Tomato mosaic virus (ToMV)',
    is_healthy: false,
  },
  'Tomato_Septoria_Leaf_Spot': {
    class_name: 'Tomato_Septoria_Leaf_Spot',
    crop: 'Tomato',
    disease_name_en: 'Tomato Septoria Leaf Spot',
    disease_name_si: 'තක්කාලි සෙප්ටෝරියා කොළ ලප රෝගය',
    scientific_name: 'Septoria lycopersici',
    is_healthy: false,
  },
  'Tomato_Spider_Mites': {
    class_name: 'Tomato_Spider_Mites',
    crop: 'Tomato',
    disease_name_en: 'Tomato Spider Mites',
    disease_name_si: 'තක්කාලි මයිටා හානිය',
    scientific_name: 'Tetranychus urticae',
    is_healthy: false,
  },
  'Tomato_Target_Spot': {
    class_name: 'Tomato_Target_Spot',
    crop: 'Tomato',
    disease_name_en: 'Tomato Target Spot',
    disease_name_si: 'තක්කාලි ඉලක්ක ලප රෝගය',
    scientific_name: 'Corynespora cassiicola',
    is_healthy: false,
  },
  'Tomato_Yellow_Leaf_Curl': {
    class_name: 'Tomato_Yellow_Leaf_Curl',
    crop: 'Tomato',
    disease_name_en: 'Tomato Yellow Leaf Curl Virus',
    disease_name_si: 'තක්කාලි කහ කොළ කොඩවීම',
    scientific_name: 'Tomato yellow leaf curl virus (TYLCV)',
    is_healthy: false,
  },
};

function getClass35Info(classNameOrKey) {
  if (!classNameOrKey) return null;
  if (CLASS_35_MAP[classNameOrKey]) return CLASS_35_MAP[classNameOrKey];
  const cleaned = classNameOrKey.trim().replace(/\s+/g, '_');
  for (const [key, val] of Object.entries(CLASS_35_MAP)) {
    if (key.toLowerCase() === cleaned.toLowerCase()) return val;
    if (val.disease_name_en.toLowerCase() === classNameOrKey.trim().toLowerCase()) return val;
  }
  return null;
}

function getCropClasses35(cropType) {
  if (!cropType) return Object.values(CLASS_35_MAP);
  const c = cropType.toLowerCase();
  return Object.values(CLASS_35_MAP).filter((entry) => {
    const entryCrop = entry.crop.toLowerCase();
    return c.includes(entryCrop) || entryCrop.includes(c);
  });
}

module.exports = {
  DISEASE_NAME_SI_MAP,
  CLASS_35_MAP,
  getClass35Info,
  getCropClasses35,
  fixSinhalaMistranslations,
  sanitizeSinhalaDiagnosis,
};
