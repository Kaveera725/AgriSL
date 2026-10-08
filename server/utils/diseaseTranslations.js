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

module.exports = {
  DISEASE_NAME_SI_MAP,
  fixSinhalaMistranslations,
  sanitizeSinhalaDiagnosis,
};
