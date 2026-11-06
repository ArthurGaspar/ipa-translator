// Pinyin syllables: parsing, spelling, tone marks and IPA (Standard Mandarin, mainland).
//
// A syllable is { ini, fin, tone } with the final in its full form (iou, uei, uen, ü…),
// e.g. 'liu2' → { ini: 'l', fin: 'iou', tone: 2 }. Tone 5 = neutral.

export const INITIALS = ['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'r', 'z', 'c', 's'];

const INI_IPA = {
  b: 'p', p: 'pʰ', m: 'm', f: 'f', d: 't', t: 'tʰ', n: 'n', l: 'l', g: 'k', k: 'kʰ', h: 'x', j: 'tɕ', q: 'tɕʰ',
  x: 'ɕ', zh: 'ʈʂ', ch: 'ʈʂʰ', sh: 'ʂ', r: 'ʐ', z: 'ts', c: 'tsʰ', s: 's', '': '',
};
const FIN_IPA = {
  a: 'a', o: 'o', e: 'ɤ', ê: 'ɛ', ai: 'aɪ', ei: 'eɪ', ao: 'ɑʊ', ou: 'oʊ', an: 'an', en: 'ən', ang: 'ɑŋ',
  eng: 'əŋ', ong: 'ʊŋ', er: 'aɚ', i: 'i', ia: 'ja', ie: 'jɛ', iao: 'jɑʊ', iou: 'joʊ', ian: 'jɛn', in: 'in',
  iang: 'jɑŋ', ing: 'iŋ', iong: 'jʊŋ', u: 'u', ua: 'wa', uo: 'wo', uai: 'waɪ', uei: 'weɪ', uan: 'wan',
  uen: 'wən', uang: 'wɑŋ', ueng: 'wəŋ', ü: 'y', üe: 'ɥɛ', üan: 'ɥɛn', ün: 'yn', m: 'm̩', n: 'n̩', ng: 'ŋ̍',
};
// Tone letters (Chao): 1 = 55, 2 = 35, 3 = 214, 4 = 51; neutral unmarked
export const TONE_LETTERS = { 1: '˥', 2: '˧˥', 3: '˨˩˦', 4: '˥˩', 5: '' };

const Y_FIN = { i: 'i', a: 'ia', e: 'ie', o: 'io', ao: 'iao', ou: 'iou', an: 'ian', in: 'in', ang: 'iang', ing: 'ing', ong: 'iong', u: 'ü', ue: 'üe', uan: 'üan', un: 'ün' };
const W_FIN = { u: 'u', a: 'ua', o: 'uo', ai: 'uai', ei: 'uei', an: 'uan', en: 'uen', ang: 'uang', eng: 'ueng' };

/** Toneless spelled syllable ('liu', 'yue', 'lv') → { ini, fin } */
export function parseSyllable(spelled) {
  const s = spelled.replace(/v/g, 'ü');
  if (s[0] === 'y') return { ini: '', fin: Y_FIN[s.slice(1).replace(/ü/g, 'u')] ?? 'i' + s.slice(1) };
  if (s[0] === 'w') return { ini: '', fin: W_FIN[s.slice(1)] ?? 'u' + s.slice(1) };
  const ini = INITIALS.find((i) => s.startsWith(i)) ?? '';
  let fin = s.slice(ini.length);
  if (['j', 'q', 'x'].includes(ini)) fin = fin.replace(/^u/, 'ü');
  if (ini) fin = { iu: 'iou', ui: 'uei', un: ini === 'j' || ini === 'q' || ini === 'x' ? 'ün' : 'uen' }[fin] ?? fin;
  return { ini, fin };
}

/** { ini, fin } → spelled toneless pinyin, with ü written 'v' (dictionary keys) */
export function spellKey({ ini, fin }) {
  let s;
  if (!ini) {
    if (fin === 'i' || fin === 'in' || fin === 'ing') s = 'y' + fin;
    else if (fin[0] === 'i') s = 'y' + fin.slice(1);
    else if (fin === 'u') s = 'wu';
    else if (fin[0] === 'u') s = 'w' + fin.slice(1);
    else if (fin[0] === 'ü') s = 'yu' + fin.slice(1);
    else s = fin;
  } else {
    let f = { iou: 'iu', uei: 'ui', uen: 'un' }[fin] ?? fin;
    if (['j', 'q', 'x'].includes(ini)) f = f.replace(/^ü/, 'u');
    s = ini + f;
  }
  return s.replace(/ü/g, 'v');
}

const MARKED = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };

/** 'lv3' → 'lǚ', 'de5' → 'de' */
export function toMarked(key) {
  const tone = Number(key.slice(-1));
  const s = key.slice(0, -1).replace(/v/g, 'ü');
  if (tone < 1 || tone > 4) return s;
  let idx = s.search(/[ae]/);
  if (idx < 0) idx = s.indexOf('ou');
  if (idx < 0) for (let i = s.length - 1; i >= 0; i--) if ('iouü'.includes(s[i])) { idx = i; break; }
  if (idx < 0) return s;
  return s.slice(0, idx) + MARKED[s[idx]][tone - 1] + s.slice(idx + 1);
}

/** 'xing2' → { ini: 'x', fin: 'ing', tone: 2, key: 'xing2' } */
export function fromKey(key) {
  const tone = Number(key.slice(-1)) || 5;
  return { ...parseSyllable(key.slice(0, -1)), tone, key };
}

/** Segmental IPA of a syllable (no tone). */
export function syllableIPA({ ini, fin }) {
  let f = FIN_IPA[fin] ?? fin;
  if (fin === 'i' && ['z', 'c', 's'].includes(ini)) f = 'ɹ̩';
  else if (fin === 'i' && ['zh', 'ch', 'sh', 'r'].includes(ini)) f = 'ɻ̩';
  else if (fin === 'o' && ['b', 'p', 'm', 'f'].includes(ini)) f = 'wo';
  return INI_IPA[ini] + f;
}
