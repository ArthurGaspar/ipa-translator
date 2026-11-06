// Everyday words with their Lebanese pronunciation (IPA, stress added by the rules unless marked).
// Keys are plain Arabic spelling; they're normalised (no vowel marks, أ إ آ → ا, ى → ي, ة → ه)
// before lookup, so any spelling variant matches.

const WORDS = {
  // greetings & politeness
  'مرحبا': 'marħaba', 'مرحبتين': 'marħabteːn', 'أهلا': 'ʔahla', 'اهلين': 'ʔahleːn', 'سهلا': 'sahla',
  'كيفك': 'kiːfak', 'كيفكن': 'kiːfkun', 'كيف': 'kiːf', 'شو': 'ʃu', 'منيح': 'mniːħ', 'منيحة': 'mniːħa',
  'تمام': 'tamaːm', 'الحمدلله': 'ilħamdilla', 'شكرا': 'ʃukran', 'مرسي': 'mersi', 'عفوا': 'ʕafwan',
  'يسلمو': 'jislamu', 'يسلموا': 'jislamu', 'تكرم': 'tikram', 'صباح': 'sˤabaːħ', 'مسا': 'masa', 'مساء': 'masa',
  'الخير': 'ilxeːr', 'النور': 'innuːr', 'السلام': 'issalaːm', 'عليكم': 'ʕaleːkun', 'سلامة': 'salaːme',
  'السلامة': 'issalaːme', 'باي': 'baːj', 'يلا': 'jaɫɫa', 'معليش': 'maʕleːʃ', 'انشالله': 'ʔinʃaɫɫa',
  'الله': 'ʔaɫɫa', 'ماشي': 'maːʃi', 'طيب': 'tˤajjeb', 'أكيد': 'ʔakiːd', 'ممكن': 'mumkin',
  // yes / no / little words
  'إي': 'ʔeː', 'ايه': 'ʔeː', 'نعم': 'naʕam', 'لا': 'laʔ', 'لأ': 'laʔ', 'ما': 'ma', 'مش': 'miʃ', 'مو': 'mu',
  'بس': 'bass', 'كمان': 'kamaːn', 'كتير': 'ktiːr', 'شوي': 'ʃwajj', 'شي': 'ʃi', 'كل': 'kill', 'في': 'fi',
  'من': 'min', 'على': 'ʕala', 'عن': 'ʕan', 'مع': 'maʕ', 'ع': 'ʕa', 'إلى': 'la', 'و': 'w', 'أو': 'ʔaw',
  'ولا': 'wala', 'لأنو': 'laʔannu', 'إذا': 'ʔiza', 'يا': 'ja', 'عندي': 'ʕindi', 'عندك': 'ʕandak', 'عندنا': 'ʕinna', 'العربية': 'ilʕarabijje', 'لغة': 'luɣa', 'اللغة': 'illuɣa', 'اذا': 'ʔiza', 'هيك': 'heːk', 'هون': 'hoːn',
  'هونيك': 'hoːniːk', 'وين': 'weːn', 'ليش': 'leːʃ', 'أيمتى': 'ʔeːmta', 'قديش': 'ʔaddeːʃ', 'مين': 'miːn',
  'كيفما': 'kiːfma', 'هلق': 'hallaʔ', 'هلأ': 'hallaʔ', 'بكرا': 'bukra', 'مبارح': 'mbeːriħ', 'اليوم': 'iljoːm',
  'يوم': 'joːm', 'هيدا': 'heːda', 'هيدي': 'heːdi', 'هودي': 'hoːdi', 'هذا': 'haːda', 'هذه': 'haːdi',
  // pronouns & verbs of every day
  'أنا': 'ʔana', 'انت': 'ʔinta', 'انتي': 'ʔinti', 'هو': 'huwwe', 'هي': 'hijje', 'نحنا': 'niħna',
  'انتو': 'ʔintu', 'هني': 'hinne', 'بدي': 'baddi', 'بدك': 'baddak', 'بدنا': 'badna', 'عم': 'ʕam',
  'بحبك': 'bħibbak', 'بحب': 'bħibb', 'حب': 'ħibb', 'بعرف': 'baʕref',
  'بحكي': 'baħki', 'حكي': 'ħaki', 'فهمت': 'fhimt', 'روح': 'ruːħ', 'تعا': 'taʕa', 'خلص': 'xalaːsˤ',
  'بتحكي': 'btiħki', 'عربي': 'ʕarabi', 'انكليزي': 'ʔingliːzi', 'فرنسي': 'faransi',
  // people & things
  'حبيبي': 'ħabiːbi', 'حبيبتي': 'ħabiːbti', 'ماما': 'maːma', 'بابا': 'baːba', 'إمي': 'ʔimmi', 'بيي': 'bajji',
  'خيي': 'xajji', 'أختي': 'ʔixti', 'رفيقي': 'rfiːʔi', 'صاحبي': 'sˤaːħbi', 'ولد': 'walad', 'ولاد': 'wleːd',
  'بنت': 'binet', 'رجال': 'riʒʒaːl', 'مرا': 'mara', 'ناس': 'neːs', 'اسم': 'ʔism', 'اسمي': 'ʔismi',
  'اسمك': 'ʔismak', 'عمري': 'ʕumri', 'قلبي': 'ʔalbi', 'قلب': 'ʔalb', 'بيت': 'beːt', 'سيارة': 'sajjaːra',
  'شغل': 'ʃiɣl', 'وقت': 'waʔt', 'ساعة': 'seːʕa', 'دقيقة': 'daʔiːʔa', 'كلام': 'kleːm', 'كتاب': 'ktaːb',
  'مدرسة': 'madrase', 'جامعة': 'ʒeːmʕa', 'ضيعة': 'dˤajʕa', 'بلد': 'balad', 'لبنان': 'libneːn',
  'بيروت': 'beːruːt', 'لبناني': 'libneːni', 'بحر': 'baħr', 'جبل': 'ʒabal', 'شمس': 'ʃams', 'قمر': 'ʔamar',
  'سنة': 'sene', 'شهر': 'ʃahr', 'جمعة': 'ʒumʕa', 'حلو': 'ħilu', 'حلوة': 'ħilwe', 'كبير': 'kbiːr',
  'صغير': 'zˤɣiːr', 'جديد': 'ʒdiːd', 'قديم': 'ʔadiːm', 'منيحين': 'mniːħiːn', 'مشكلة': 'muʃkle',
  // food & drink
  'قهوة': 'ʔahwe', 'شاي': 'ʃaːj', 'مي': 'majj', 'ماء': 'majj', 'أكل': 'ʔakl', 'خبز': 'xibz', 'كعك': 'kaʕk',
  'منقوشة': 'manʔuːʃe', 'تبولة': 'tabbuːle', 'حمص': 'ħummusˤ', 'فلافل': 'falaːfel', 'شاورما': 'ʃaːwirma',
  'زعتر': 'zaʕtar', 'لبنة': 'labne', 'بوظة': 'boːzˤa', 'عرق': 'ʕaraʔ',
};

export const normalize = (w) => w
  .replace(/[ً-ٰٟـ]/g, '')
  .replace(/[أإآٱ]/g, 'ا')
  .replace(/ى/g, 'ي')
  .replace(/ة/g, 'ه');

export const LEXICON = new Map(Object.entries(WORDS).map(([k, v]) => [normalize(k), v]));

// Unstressed little words (no stress mark)
export const CLITICS = new Set(['w', 'ʕa', 'fi', 'min', 'ma', 'la', 'ʕam', 'ʃi', 'ʕala', 'maʕ']);
