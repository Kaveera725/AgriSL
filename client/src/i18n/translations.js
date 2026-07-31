// UI translation dictionary for the global bilingual (English / Sinhala) toggle.

// This powers the *interface chrome* — navigation, landing page, auth forms, and
// the advisory browser. It is intentionally separate from *content* language:
// chat sessions and disease reports carry their own per-record language, and
// advisory articles store title_en/title_si + content_en/content_si. The toggle
// here decides which of those a reader sees, and translates all surrounding labels.
//
// Look-ups use dot paths, e.g. t('nav.home'). Missing Sinhala keys fall back to
// English, and a missing English key falls back to the raw key — so a forgotten
// string is visible but never crashes the UI.

const translations = {
  en: {
    nav: {
      home: 'Home',
      chatbot: 'Chatbot',
      disease: 'Disease Detection',
      advisory: 'Advisory',
      dashboard: 'Dashboard',
      adminPanel: 'Admin Panel',
      myArticles: 'My Articles',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      signIn: 'Sign In',
    },
    notif: {
      title: 'Notifications',
      markAll: 'Mark all read',
      empty: 'No notifications yet.',
    },
    common: {
      getStarted: 'Get Started Free',
      goToDashboard: 'Go to Dashboard',
      browseAdvisory: 'Browse Advisory',
      learnMore: 'Learn More',
    },
    home: {
      tagline: 'Bilingual Farming Support Platform',
      offers: 'What AgriSL Offers',
      howItWorks: 'How It Works',
      statFarmers: 'Farmers',
      statDistricts: 'Districts',
      statLanguages: 'Languages Supported',
      featureChatTitle: 'AI Farming Advisor',
      featureChatDesc:
        'Chat with our AI assistant for personalised crop management, planting schedules, and pest control guidance — in Sinhala or English.',
      featureDiseaseTitle: 'Crop Disease Detection',
      featureDiseaseDesc:
        'Upload a photo of your crop and get an instant AI-powered disease diagnosis with bilingual treatment advice.',
      featureAdvisoryTitle: 'Expert Advisory',
      featureAdvisoryDesc:
        'Read verified articles published by agricultural officers covering seasonal planting, market advice, and more.',
      step1Title: 'Create your account',
      step1Desc: 'Register for free as a farmer and set your district for tailored advice.',
      step2Title: 'Ask or upload',
      step2Desc: 'Chat with the AI advisor or upload a crop photo to detect diseases.',
      step3Title: 'Grow better',
      step3Desc:
        'Apply expert, localised guidance to improve your yield season after season.',
      footerTagline: 'Developed for Sri Lankan Farmers',
    },
    auth: {
      loginSubtitle: 'Sign in to your account',
      registerSubtitle: 'Create your account',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      fullName: 'Full Name',
      district: 'District',
      accountType: 'Account Type',
      farmer: 'Farmer',
      officer: 'Agricultural Officer',
      noAccount: "Don't have an account?",
      haveAccount: 'Already have an account?',
    },
    advisory: {
      heading: 'Agricultural Advisory',
      search: 'Search advisories...',
      views: 'views',
      readMore: 'Read More',
      noResults: 'No advisories found.',
    },
    articleEditor: {
      createTitle: 'Create New Article',
      editTitle: 'Edit Article',
      tabEnglish: 'English Content',
      tabSinhala: 'Sinhala Content / සිංහල',
      titleEn: 'Title (English)',
      contentEn: 'Content (English)',
      titleSi: 'මාතෘකාව (සිංහල)',
      contentSi: 'අන්තර්ගතය (සිංහල)',
      category: 'Category',
      status: 'Status',
      tags: 'Tags (comma-separated)',
      tagsPlaceholder: 'rice, irrigation, yala season',
      save: 'Save',
      publish: 'Publish',
      cancel: 'Cancel',
      catCropManagement: 'Crop Management',
      catPestControl: 'Pest Control',
      catSeasonalPlanting: 'Seasonal Planting',
      catDiseaseTreatment: 'Disease Treatment',
      catMarketAdvice: 'Market Advice',
      catGeneral: 'General',
      statusDraft: 'Draft',
      statusPublished: 'Published',
      statusArchived: 'Archived',
      errRequired: 'Please provide a title and content in at least one language (English or Sinhala).',
      errDraftTitleRequired: 'A title in at least one language is required to save a draft.',
      errSave: 'Could not save the article.',
      errNotFound: 'Article not found or you do not have access to it.',
      errLoad: 'Could not load the article.',
    },
    farmerDash: {
      // {days}, {n}, {name}, {date}, {level} are substituted at render time.
      title: 'Farmer Dashboard',
      welcome: 'Welcome, {name}',
      roleFarmer: 'Farmer',
      noDistrict: 'No district set',
      memberSince: 'Member since {date}',
      editProfile: 'Edit Profile',
      statChats: 'Chat Sessions',
      statReports: 'Disease Reports',
      statBookmarks: 'Bookmarks',
      tabChats: 'Chat History',
      tabReports: 'Disease Reports',
      tabBookmarks: 'Bookmarks',
      chatArchiveNote:
        'Showing chats from the last {days} days. Older conversations are kept and can be reopened any time.',
      showOlderChats: 'Show older chats ({n})',
      noRecentChats:
        'No chats in the last {days} days. Older conversations ({n}) can be reopened below.',
      noChatsYet: 'No chat sessions yet.',
      diseaseKeptNote:
        'Your disease reports are kept permanently so you can track recurring problems season after season.',
      loadOlderError: 'Could not load older chats',
      statusCompleted: 'Completed',
      statusActive: 'Active',
      messagesCount: '{n} messages',
      view: 'View',
      share: 'Share',
      noReportsYet: 'No disease reports yet.',
      statusReviewed: 'Reviewed',
      statusPending: 'Pending',
      unknownDisease: 'Unknown',
      confidence: 'Confidence: {level}',
      confHigh: 'High',
      confMedium: 'Medium',
      confLow: 'Low',
      noBookmarksYet: 'No bookmarked articles yet.',
      removeBookmark: 'Remove bookmark',
      saved: 'Saved {date}',
      readArticle: 'Read Article',
      name: 'Name',
      districtLabel: 'District',
      cancel: 'Cancel',
      save: 'Save',
      errNameDistrict: 'Name and district are required',
      errUpdateProfile: 'Could not update profile',
      toastProfileUpdated: 'Profile updated',
      toastBookmarkRemoved: 'Bookmark removed',
      toastBookmarkErr: 'Could not remove bookmark',
      errLoadDashboard: 'Could not load your dashboard.',
      errLoadReport: 'Could not load this report',
      reportTitle: 'Disease Report',
      symptoms: 'Symptoms',
      treatment: 'Treatment',
      close: 'Close',
      shareTitle: 'Share with Officer',
      shareSuccess: 'Report shared successfully!',
      noOfficers: 'No approved officers available.',
      selectOfficer: 'Select Officer',
      errSelectOfficer: 'Please select an officer',
      errShareReport: 'Could not share the report',
    },
  },

  si: {
    nav: {
      home: 'මුල් පිටුව',
      // "chatbot" is unknown to rural farmers — use plain "AI help service"
      chatbot: 'AI ගොවි සහායකය',
      disease: 'රෝග හඳුනාගැනීම',
      // More specific than generic "advice"
      advisory: 'ගොවි උපදෙස්',
      // "මගේ තොරතුරු" (My information) is more natural than "instrument board"
      dashboard: 'මගේ තොරතුරු',
      adminPanel: 'පරිපාලක පැනලය',
      myArticles: 'මගේ ලිපි',
      // "ඇතුල් වන්න" is the everyday colloquial form; "පිවිසෙන්න" is formal
      login: 'ඇතුල් වන්න',
      register: 'ලියාපදිංචි වන්න',
      logout: 'පිටවෙන්න',
      signIn: 'ඇතුල් වන්න',
    },
    notif: {
      title: 'දැනුම්දීම්',
      markAll: 'සියල්ල කියවූ ලෙස සලකුණු කරන්න',
      empty: 'තවම දැනුම්දීම් නැත.',
    },
    common: {
      getStarted: 'නොමිලේ පටන් ගන්න',
      goToDashboard: 'මගේ තොරතුරු බලන්න',
      browseAdvisory: 'ගොවි උපදෙස් බලන්න',
      learnMore: 'තව දැනගන්න',
    },
    home: {
      // Shorter, more direct — drops the word "platform" which is abstract
      tagline: 'ගොවිතැනට ද්විභාෂා සහාය',
      offers: 'AgriSL හරහා ලැබෙන සේවා',
      howItWorks: 'කෙසේ ද ක්‍රියා කරන්නේ?',
      statFarmers: 'ගොවීන්',
      statDistricts: 'දිස්ත්‍රික්ක',
      statLanguages: 'භාෂා',
      // "සහායකය" (helper/assistant) is clearer than "උපදේශක" (counsellor)
      featureChatTitle: 'AI ගොවි සහායකය',
      // Plain sentences — what it does, not how it works technically
      featureChatDesc:
        'ඔබේ බෝගය සහ දිස්ත්‍රික්කය ගැන AI සහායකට සිංහලෙන් හෝ ඉංග්‍රීසියෙන් කතා කරන්න. වගා ඉඟි, කෘමිනාශක, වගා කාලය ගැන ක්ෂණිකව දැනගන්න.',
      // "ගොවිතැනේ" (of the farm) is more natural than "බෝග" (crop, botanical)
      featureDiseaseTitle: 'ගොවිතැනේ රෝග හඳුනාගැනීම',
      featureDiseaseDesc:
        'ඔබේ වගාවේ ඡායාරූපයක් AI ට දෙන්න — රෝගය කුමක්ද, ප්‍රතිකාරය කෙසේද යන්න සිංහලෙන් ද ලැබේ.',
      // Name the source of advice (officers) so farmers trust it
      featureAdvisoryTitle: 'කෘෂිකර්ම නිලධාරී උපදෙස්',
      featureAdvisoryDesc:
        'සෘතුමය වගාව, පළිබෝධ, වෙළඳපොළ ගැන කෘෂිකර්ම නිලධාරීන් ලියූ ලිපි කියවන්න.',
      // "හදාගන්න" (make for yourself) is colloquial; "සාදන්න" is formal
      step1Title: 'ගිණුමක් හදාගන්න',
      step1Desc:
        'ගොවියෙකු ලෙස නොමිලේ ලියාපදිංචි වී ඔබේ දිස්ත්‍රික්කය දෙන්න.',
      // "ඡායාරූපය දෙන්න" (give a photo) — simpler than "upload"
      step2Title: 'අහන්න හෝ ඡායාරූපය දෙන්න',
      step2Desc:
        'AI සහායකට ගොවිතැන් ගැන ප්‍රශ්නයක් අසන්න, නැතිනම් බෝගයේ ඡායාරූපයක් ඔස්සේ රෝගය හොයාගන්න.',
      // Most motivating line for a farmer — direct outcome
      step3Title: 'හොඳ අස්වැන්නක් ගන්න',
      step3Desc:
        'විශේෂඥ, ප්‍රාදේශීය උපදෙස් යොදා ඔබේ අස්වැන්න සෑම වාරයකම වැඩිකරගන්න.',
      footerTagline: 'ශ්‍රී ලාංකික ගොවීන් සඳහා',
    },
    auth: {
      loginSubtitle: 'ඔබේ ගිණුමට ඇතුල් වන්න',
      // "හදාගන්න" is colloquial; "සාදන්න" is formal written
      registerSubtitle: 'නව ගිණුමක් හදාගන්න',
      // "ඊමේල්" is how farmers hear it spoken; "විද්‍යුත් තැපෑල" is unfamiliar
      email: 'ඊමේල් ලිපිනය',
      password: 'මුරපදය',
      // "නැවත ලියන්න" (write again) is simpler than "confirm"
      confirmPassword: 'මුරපදය නැවත ලියන්න',
      fullName: 'සම්පූර්ණ නම',
      district: 'දිස්ත්‍රික්කය',
      accountType: 'ගිණුම් වර්ගය',
      farmer: 'ගොවියා',
      // Drop the inflected ending for a cleaner label
      officer: 'කෘෂිකර්ම නිලධාරී',
      noAccount: 'ගිණුමක් නැද්ද?',
      haveAccount: 'දැනටමත් ගිණුමක් තිබේද?',
    },
    advisory: {
      // "ගොවි" (farming) is plainer than "කෘෂිකාර්මික" (agricultural — formal)
      heading: 'ගොවි උපදෙස්',
      search: 'උපදෙස් සොයන්න...',
      views: 'නැරඹීම්',
      readMore: 'තව කියවන්න',
      noResults: 'උපදෙස් කිසිවක් හමු නොවිණි.',
    },
    articleEditor: {
      createTitle: 'නව ලිපියක් ලියන්න',
      editTitle: 'ලිපිය සංස්කරණය කරන්න',
      tabEnglish: 'ඉංග්‍රීසි අන්තර්ගතය',
      tabSinhala: 'සිංහල අන්තර්ගතය / Sinhala',
      titleEn: 'මාතෘකාව (ඉංග්‍රීසි)',
      contentEn: 'අන්තර්ගතය (ඉංග්‍රීසි)',
      titleSi: 'මාතෘකාව (සිංහල)',
      contentSi: 'අන්තර්ගතය (සිංහල)',
      category: 'ප්‍රවර්ගය',
      status: 'තත්ත්වය',
      tags: 'ටැග් (කොමාවෙන් වෙන් කරන්න)',
      tagsPlaceholder: 'වී, වාරිමාර්ග, යල කන්නය',
      save: 'සුරකින්න',
      publish: 'ප්‍රකාශ කරන්න',
      cancel: 'අවලංගු කරන්න',
      catCropManagement: 'බෝග කළමනාකරණය',
      catPestControl: 'පළිබෝධ පාලනය',
      catSeasonalPlanting: 'සෘතුමය වගාව',
      catDiseaseTreatment: 'රෝග ප්‍රතිකාරය',
      catMarketAdvice: 'වෙළඳපොළ උපදෙස්',
      catGeneral: 'සාමාන්‍ය',
      statusDraft: 'කෙටුම්පත',
      statusPublished: 'ප්‍රකාශිත',
      statusArchived: 'සංරක්‍ෂිත',
      errRequired: 'අවම වශයෙන් එක් භාෂාවකින් (ඉංග්‍රීසි හෝ සිංහල) මාතෘකාවක් සහ අන්තර්ගතයක් ඇතුළත් කරන්න.',
      errDraftTitleRequired: 'කෙටුම්පතක් සුරැකීමට අවම වශයෙන් එක් භාෂාවකින් මාතෘකාවක් අවශ්‍ය වේ.',
      errSave: 'ලිපිය සුරැකීමට නොහැකි විය.',
      errNotFound: 'ලිපිය හමු නොවිණි හෝ ඔබට ප්‍රවේශය නැත.',
      errLoad: 'ලිපිය පූරණය කිරීමට නොහැකි විය.',
    },
    farmerDash: {
      title: 'ගොවි පුවරුව',
      welcome: 'ආයුබෝවන්, {name}',
      roleFarmer: 'ගොවියා',
      noDistrict: 'දිස්ත්‍රික්කය නියම කර නැත',
      memberSince: '{date} සිට සාමාජිකයි',
      editProfile: 'තොරතුරු වෙනස් කරන්න',
      statChats: 'සංවාද',
      statReports: 'රෝග වාර්තා',
      statBookmarks: 'සුරැකි ලිපි',
      tabChats: 'සංවාද ඉතිහාසය',
      tabReports: 'රෝග වාර්තා',
      tabBookmarks: 'සුරැකි ලිපි',
      chatArchiveNote:
        'පසුගිය දින {days} තුළ පැවති සංවාද පෙන්වයි. පැරණි සංවාද සුරැකී ඇති අතර ඕනෑම විටෙක නැවත විවෘත කළ හැක.',
      showOlderChats: 'පැරණි සංවාද පෙන්වන්න ({n})',
      noRecentChats:
        'පසුගිය දින {days} තුළ සංවාද නැත. පැරණි සංවාද ({n}) පහතින් නැවත විවෘත කළ හැක.',
      noChatsYet: 'තවම සංවාද නැත.',
      diseaseKeptNote:
        'ඔබේ රෝග වාර්තා ස්ථිරවම සුරැකේ — එමඟින් සෑම කන්නයකම නැවත නැවත එන ගැටලු නිරීක්ෂණය කළ හැක.',
      loadOlderError: 'පැරණි සංවාද පූරණය කිරීමට නොහැකි විය',
      statusCompleted: 'අවසන්',
      statusActive: 'ක්‍රියාකාරී',
      messagesCount: 'පණිවිඩ {n}',
      view: 'බලන්න',
      share: 'බෙදාගන්න',
      noReportsYet: 'තවම රෝග වාර්තා නැත.',
      statusReviewed: 'සමාලෝචනය කළා',
      statusPending: 'පොරොත්තුවෙන්',
      unknownDisease: 'නොදනී',
      confidence: 'විශ්වාසනීයත්වය: {level}',
      confHigh: 'ඉහළ',
      confMedium: 'මධ්‍යම',
      confLow: 'අඩු',
      noBookmarksYet: 'තවම සුරැකි ලිපි නැත.',
      removeBookmark: 'සුරැකීම ඉවත් කරන්න',
      saved: '{date} දී සුරැකුවා',
      readArticle: 'ලිපිය කියවන්න',
      name: 'නම',
      districtLabel: 'දිස්ත්‍රික්කය',
      cancel: 'අවලංගු කරන්න',
      save: 'සුරකින්න',
      errNameDistrict: 'නම සහ දිස්ත්‍රික්කය අවශ්‍යයි',
      errUpdateProfile: 'තොරතුරු යාවත්කාලීන කළ නොහැකි විය',
      toastProfileUpdated: 'තොරතුරු යාවත්කාලීන කළා',
      toastBookmarkRemoved: 'සුරැකීම ඉවත් කළා',
      toastBookmarkErr: 'සුරැකීම ඉවත් කළ නොහැකි විය',
      errLoadDashboard: 'ඔබේ පුවරුව පූරණය කළ නොහැකි විය.',
      errLoadReport: 'මෙම වාර්තාව පූරණය කළ නොහැකි විය',
      reportTitle: 'රෝග වාර්තාව',
      symptoms: 'රෝග ලක්ෂණ',
      treatment: 'ප්‍රතිකාරය',
      close: 'වසන්න',
      shareTitle: 'නිලධාරියාට යවන්න',
      shareSuccess: 'වාර්තාව සාර්ථකව බෙදාගත්තා!',
      noOfficers: 'අනුමත නිලධාරීන් නැත.',
      selectOfficer: 'නිලධාරියෙකු තෝරන්න',
      errSelectOfficer: 'කරුණාකර නිලධාරියෙකු තෝරන්න',
      errShareReport: 'වාර්තාව බෙදාගත නොහැකි විය',
    },
  },
};

// Resolve a dot-path like 'nav.home' against a nested object; undefined if absent.
function resolve(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

// Translate a dot-path key for the given language. Falls back: si -> en -> key.
export function translate(lang, key) {
  const hit = resolve(translations[lang], key);
  if (hit !== undefined) return hit;
  const enHit = resolve(translations.en, key);
  return enHit !== undefined ? enHit : key;
}

export default translations;
