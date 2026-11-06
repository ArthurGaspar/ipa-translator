// Exceptions to the spelling rules.
//
// Values are either a *respelling* that the normal rules read correctly
// (accents mark stress / vowel openness, 'k' and 'w' are allowed), or raw IPA
// between slashes, used verbatim.

export const LEXICON = {
  // x read as [ks] or [s] (the default rules give [ʃ], [z] or [s])
  sexo: 'sékso', fixo: 'fikso', fixa: 'fiksa', táxi: 'táksi', tóxico: 'tóksico', tóxica: 'tóksica',
  axila: 'aksila', oxigênio: 'oksigênio', complexo: 'complékso', reflexo: 'reflékso', nexo: 'nékso',
  anexo: 'anékso', fluxo: 'flúkso', boxe: 'bókse', léxico: 'léksico', máximo: 'mássimo',
  próximo: 'próssimo', próxima: 'próssima', auxílio: 'aussílio', trouxe: 'trousse', sintaxe: 'sintasse',

  // qu / gu pronounced [kw] / [ɡw] before e, i
  tranquilo: 'trankwilo', tranquila: 'trankwila', tranquilidade: 'trankwilidade',
  frequente: 'frekwente', frequência: 'frekwência', cinquenta: 'cinkwenta',
  consequência: 'consekwência', sequência: 'sekwência', linguiça: 'lingwiça', aguentar: 'agwentar',
  pinguim: 'pingwim', bilíngue: 'bilíngwe', eloquente: 'elokwente', delinquente: 'delinkwente',

  // stressed open vowels [ɛ] / [ɔ] not marked in spelling
  pode: 'póde', podem: 'pódem', pedra: 'pédra', perna: 'pérna', velho: 'vélho', velha: 'vélha',
  olhos: 'ólhos', novos: 'nóvos', corpos: 'córpos', jogos: 'jógos', ovos: 'óvos', fogos: 'fógos',
  povos: 'póvos', portos: 'pórtos', nossos: 'nóssos', gostos: 'góstos', sete: 'séte', dez: 'déz',
  belo: 'bélo', mulher: 'mulhér', pedro: 'pédro', ferro: 'férro', cobra: 'cóbra', sogra: 'sógra',
  serve: 'sérve', pele: 'péle', peça: 'péça', meta: 'méta', ideia: 'idéia', europa: 'európa',
  moda: 'móda', roda: 'róda', copo: 'cópo', volta: 'vólta', solta: 'sólta', sopa: 'sópa',
  pobre: 'póbre', chefe: 'chéfe', neto: 'néto', neta: 'néta', teto: 'této', quer: 'quér',
  posso: 'pósso', moro: 'móro', toca: 'tóca', troca: 'tróca', colher: 'colhér', fecha: 'fécha',
  café: 'café', leque: 'léque', bonde: 'bônde',

  // stressed closed vowels the suffix heuristics would open
  escova: 'escôva', estrela: 'estrêla', cabelo: 'cabêlo', modelo: 'modêlo', esgoto: 'esgôto',

  // irregular stress
  porque: 'porquê',

  // misc.
  trânsito: 'trânzito',
  muito: '/ˈmũjtu/', muita: '/ˈmũjtɐ/', muitos: '/ˈmũjtus/', muitas: '/ˈmũjtɐs/',

  // common loanwords
  ok: 'okêi', show: 'chôu', site: 'sáite', online: 'onláine', mouse: 'máuze', internet: 'internéti',
};

// Unstressed function words (clitics): no stress mark, final vowel reduced.
export const CLITICS = new Set([
  'a', 'as', 'o', 'os', 'e', 'de', 'da', 'das', 'do', 'dos', 'em', 'na', 'nas', 'no', 'nos',
  'que', 'se', 'me', 'te', 'lhe', 'lhes', 'vos', 'por', 'com', 'sem', 'mas', 'nem', 'ao', 'aos',
  'à', 'às', 'pelo', 'pela', 'pelos', 'pelas', 'para', 'pra', 'pro', 'lo', 'la', 'los', 'las',
]);
