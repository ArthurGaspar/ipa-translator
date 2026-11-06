// English spelling → phonemes (dictionary first, then suffix and letter-rule fallbacks)
// and phonemes → syllables { onset[], v, stress, coda[] }.

import { lookup, decode } from './dict.js';

// Weak (unstressed) forms used in everyday speech.
const WEAK = {
  the: 'DA0', a: 'A0', an: 'A0n', to: 'tA0', of: 'A0v', and: 'A0n', for: 'fR0', or: 'R0', at: 'A0t',
  from: 'frA0m', can: 'kA0n', was: 'wA0z', are: 'R0', as: 'A0z', but: 'bA0t', them: 'DA0m',
  your: 'jR0', than: 'DA0n', some: 'sA0m',
};
export const FUNCTION_WORDS = new Set([...Object.keys(WEAK), 'is', 'in', 'on', 'it', 'he', 'she', 'we', 'you', 'i', 'my', 'his', 'her', 'its', 'our', 'their', 'be', 'been', 'by', 'with', 'if', 'so', 'not', 'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'shall', 'should', 'me', 'him', 'us', 'they', 'that', 'this', 'there']);

// Legal English onsets of two or more consonants.
const ONSETS = new Set(`p l|p ɹ|p j|b l|b ɹ|b j|t ɹ|t w|d ɹ|d w|k l|k ɹ|k w|k j|ɡ l|ɡ ɹ|ɡ w|f l|f ɹ|f j|θ ɹ|θ w|ʃ ɹ|v j|m j|n j|h j|s l|s w|s m|s n|s p|s t|s k|s f|s j|s p l|s p ɹ|s t ɹ|s k ɹ|s k w|s k j|s p j|ʃ t|ʃ p|ʃ m|ʃ n|ʃ l|ʃ w|ʃ t ɹ|t s|l j|h w`.split('|'));

export function legalOnset(cl) {
  if (cl.length === 0) return true;
  if (cl.length === 1) return cl[0] !== 'ŋ';
  return ONSETS.has(cl.join(' '));
}

/** Phonemes → syllables using the maximal-onset principle. */
export function syllabify(phones) {
  const syls = [];
  let cl = [];
  let cur = null;
  for (const x of phones) {
    if (!x.v) { cl.push(x.p); continue; }
    let onset = cl;
    if (cur) {
      let s = 0;
      while (s < cl.length && !legalOnset(cl.slice(s))) s++;
      cur.coda.push(...cl.slice(0, s));
      onset = cl.slice(s);
    }
    cur = { onset, v: x.p, stress: x.stress, coda: [] };
    syls.push(cur);
    cl = [];
  }
  if (!cur) return cl.length ? [{ onset: [], v: '', stress: 0, coda: cl }] : null; // "shh", "hmm"
  cur.coda.push(...cl);
  return syls;
}

// ---------- fallbacks for words missing from the dictionary ----------

const SUFFIXES = [
  // [suffix, how to rebuild the base, code to append (function of base's last phoneme)]
  ["'s", (w) => [w], (last) => (/[szSZCJ]/.test(last) ? 'I0z' : /[ptkfT]/.test(last) ? 's' : 'z')],
  ['s', (w) => [w], (last) => (/[ptkfT]/.test(last) ? 's' : 'z')],
  ['es', (w) => [w], () => 'I0z'],
  ['ed', (w) => [w, w + 'e'], (last) => (/[td]/.test(last) ? 'I0d' : /[pkfsSCT]/.test(last) ? 't' : 'd')],
  ['ing', (w) => [w, w + 'e', w.slice(0, -1)], () => 'I0N'],
  ['er', (w) => [w, w + 'e', w.slice(0, -1)], () => 'R0'],
  ['ly', (w) => [w], () => 'li0'],
  ['ness', (w) => [w], () => 'nA0s'],
];

function bySuffix(w) {
  for (const [suf, bases, add] of SUFFIXES) {
    if (!w.endsWith(suf) || w.length <= suf.length + 2) continue;
    for (const base of bases(w.slice(0, -suf.length))) {
      const code = lookup(base);
      if (code) {
        const last = code.replace(/\d/g, '').slice(-1);
        return code + add(last);
      }
    }
  }
  return null;
}

// Very rough letter-to-sound rules, only for words the dictionary doesn't know.
const DIGRAPHS = [
  ['tch', 'C'], ['ch', 'C'], ['sh', 'S'], ['th', 'T'], ['ph', 'f'], ['ck', 'k'], ['ng', 'N'], ['qu', 'kw'],
  ['wh', 'w'], ['wr', 'r'], ['kn', 'n'], ['gh', ''], ['x', 'ks'],
  ['ee', 'i*'], ['ea', 'i*'], ['oo', 'u*'], ['ai', 'e*'], ['ay', 'e*'], ['oa', 'o*'], ['ou', 'W*'], ['ow', 'o*'],
  ['oi', 'O*'], ['oy', 'O*'], ['au', 'c*'], ['aw', 'c*'], ['ie', 'i*'], ['ey', 'e*'], ['ue', 'u*'], ['ew', 'u*'],
  ['ar', 'a*r'], ['er', 'R*'], ['ir', 'R*'], ['ur', 'R*'], ['or', 'c*r'],
];
const SHORT = { a: '@', e: 'E', i: 'I', o: 'a', u: 'A', y: 'I' };
const LONG = { a: 'e', e: 'i', i: 'Y', o: 'o', u: 'u', y: 'Y' };
const isVowelLetter = (c) => 'aeiouy'.includes(c);

function guess(w) {
  let code = '';
  let i = 0;
  while (i < w.length) {
    const rest = w.slice(i);
    const d = DIGRAPHS.find(([g]) => rest.startsWith(g));
    if (d) { code += d[1]; i += d[0].length; continue; }
    const c = w[i], n1 = w[i + 1] || '', n2 = w[i + 2] || '';
    if (c === w[i - 1] && !isVowelLetter(c)) { i++; continue; } // doubled consonant
    if (c === 'e' && i === w.length - 1 && i > 1) { i++; continue; } // silent final e
    if (c === 'y' && i === 0) { code += 'j'; i++; continue; }
    if (isVowelLetter(c)) {
      const magicE = n1 && !isVowelLetter(n1) && n2 === 'e' && i + 3 === w.length;
      const final = i === w.length - 1;
      if (c === 'y' && final && i > 2) code += 'i*'; // happy
      else code += (magicE || (final && c !== 'a') ? LONG[c] : SHORT[c]) + '*';
      i++;
      continue;
    }
    if (c === 'c') code += n1 && 'eiy'.includes(n1) ? 's' : 'k';
    else if (c === 'g') code += n1 && 'eiy'.includes(n1) ? 'J' : 'g';
    else if (c === 'j') code += 'J';
    else if (c === 'y') code += 'j';
    else if ('bdfhklmnprstvwz'.includes(c)) code += c;
    i++;
  }
  // First vowel stressed, the rest reduced
  let first = true;
  return code.replace(/([a-zA-Z@])\*/g, (_, v) => {
    if (first) { first = false; return `${v}1`; }
    return 'aE@A'.includes(v) ? 'A0' : `${v}0`;
  });
}

/** → { phones, guessed } or null */
export function wordToPhones(word, opts = {}) {
  const w = word.toLowerCase().replace(/’/g, "'").replace(/^'+|'+$/g, '');
  if (!w || !/[a-z]/.test(w)) return null;
  let code = (opts.casual && WEAK[w]) || lookup(w);
  let guessed = false;
  if (!code) code = bySuffix(w);
  if (!code) { code = guess(w.replace(/[^a-z]/g, '')); guessed = true; }
  const phones = decode(code);
  // Cot–caught merger (generic US): [ɔ] → [ɑ], except before r (north / force)
  phones.forEach((x, k) => { if (x.p === 'ɔ' && phones[k + 1]?.p !== 'ɹ') x.p = 'ɑ'; });
  return { phones, guessed, func: FUNCTION_WORDS.has(w) };
}
