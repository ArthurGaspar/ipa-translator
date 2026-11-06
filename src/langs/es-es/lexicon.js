// Exceptions to the spelling rules, as respellings the normal rules read correctly
// (or raw IPA between slashes).

export const LEXICON = {
  // x read as [x] in some place names
  méxico: 'méjico', mexicano: 'mejicano', mexicana: 'mejicana', texas: 'tejas', oaxaca: 'oajaca',
  xavier: 'javier', ximena: 'jimena',
  // common loanwords
  ok: 'oquéi', wifi: 'güifi', whisky: 'güisqui', web: 'güeb', show: 'chou', sándwich: 'sángüich',
  hámster: 'jámster', hobby: 'jobi', jazz: 'yas', pizza: 'pitsa',
};

// Unstressed function words: no stress mark.
export const CLITICS = new Set([
  'el', 'la', 'los', 'las', 'lo', 'le', 'les', 'me', 'te', 'se', 'nos', 'os', 'de', 'del', 'a', 'al',
  'en', 'con', 'por', 'para', 'sin', 'y', 'e', 'o', 'u', 'que', 'mi', 'mis', 'tu', 'tus', 'su', 'sus',
  'un', 'pero', 'como', 'cuando', 'donde',
]);
