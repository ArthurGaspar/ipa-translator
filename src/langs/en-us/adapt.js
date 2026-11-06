// Any IPA → General American English syllables.
//
// English allows most consonant clusters and final consonants, so the changes are
// mostly sound substitutions: pure [e]/[o] become [eɪ]/[oʊ], nasal vowels become
// vowel + n, taps and trills become English r, and a stressed lax vowel can't end a word.

import { tokenizeIPA } from '../../ipa/tokenize.js';
import { legalOnset } from './g2p.js';

const V = {
  i: ['i'], y: ['u', 'frontRound'], ɨ: ['ɪ', 'central'], ʉ: ['u', 'central'], ɯ: ['u', 'central'], u: ['u'],
  ɪ: ['ɪ'], ʏ: ['ʊ', 'frontRound'], ʊ: ['ʊ'], e: ['eɪ', 'pureVowel'], ø: ['ʌ', 'frontRound'], ɘ: ['ə', 'central'],
  ɵ: ['ʊ', 'central'], ɤ: ['ʌ', 'central'], o: ['oʊ', 'pureVowel'], ə: ['ə'], ɛ: ['ɛ'], œ: ['ʌ', 'frontRound'],
  ɜ: ['ɝ'], ɞ: ['ʌ', 'central'], ʌ: ['ʌ'], ɔ: ['ɔ'], æ: ['æ'], ɐ: ['ə', 'nearOpen'], a: ['ɑ', 'openA'],
  ɶ: ['ɑ', 'frontRound'], ɑ: ['ɑ'], ɒ: ['ɑ'],
};
// Consonants → [target(s), note]. 'X' = velar fricative: [h] before a vowel, [k] elsewhere.
const C = {
  p: ['p'], b: ['b'], t: ['t'], d: ['d'], ʈ: ['t', 'retroflex'], ɖ: ['d', 'retroflex'], c: ['k', 'palatal'],
  ɟ: ['ɡ', 'palatal'], k: ['k'], ɡ: ['ɡ'], q: ['k', 'uvular'], ɢ: ['ɡ', 'uvular'], ʔ: ['', 'glottal'],
  ʡ: ['', 'glottal'], m: ['m'], ɱ: ['m'], n: ['n'], ɳ: ['n', 'retroflex'], ɲ: [['n', 'j'], 'palatalNasal'],
  ŋ: ['ŋ'], ɴ: ['ŋ', 'uvular'], ʙ: ['b', 'trill'], r: ['ɹ', 'trill'], ʀ: ['ɹ', 'uvularR'], ⱱ: ['v'],
  ɾ: ['ɹ', 'tap'], ɽ: ['ɹ', 'retroflex'], ɸ: ['f', 'bilabialFric'], β: ['b', 'beta'], f: ['f'], v: ['v'],
  θ: ['θ'], ð: ['ð'], s: ['s'], z: ['z'], ʃ: ['ʃ'], ʒ: ['ʒ'], ʂ: ['ʃ', 'retroflex'], ʐ: ['ʒ', 'retroflex'],
  ɕ: ['ʃ', 'alveolopalatal'], ʑ: ['ʒ', 'alveolopalatal'], ç: ['ʃ', 'ich'], ʝ: ['j', 'palatal'],
  x: ['X', 'velarFric'], ɣ: ['ɡ', 'gamma'], χ: ['X', 'velarFric'], ʁ: ['ɹ', 'uvularR'], ħ: ['h', 'pharyngeal'],
  ʕ: ['', 'pharyngeal'], h: ['h'], ɦ: ['h'], ɧ: ['ʃ'], ɬ: ['l', 'lateralFric'], ɮ: ['l', 'lateralFric'],
  ʋ: ['v'], ɹ: ['ɹ'], ɻ: ['ɹ'], ɺ: ['l'], l: ['l'], ɫ: ['l'], ɭ: ['l', 'retroflex'], ʎ: [['l', 'j'], 'palatalLat'],
  ʟ: ['l'], ɰ: ['', 'velarApprox'], ɓ: ['b', 'implosive'], ɗ: ['d', 'implosive'], ʄ: ['ɡ', 'implosive'],
  ɠ: ['ɡ', 'implosive'], ʛ: ['ɡ', 'implosive'], ʘ: ['', 'click'], ǀ: ['', 'click'], ǃ: ['', 'click'],
  ǂ: ['', 'click'], ǁ: ['', 'click'],
  tʃ: ['tʃ'], dʒ: ['dʒ'], ts: [['t', 's']], dz: [['d', 'z']], tɕ: ['tʃ', 'alveolopalatal'],
  dʑ: ['dʒ', 'alveolopalatal'], tʂ: ['tʃ', 'retroflex'], dʐ: ['dʒ', 'retroflex'], ʈʂ: ['tʃ', 'retroflex'],
  ɖʐ: ['dʒ', 'retroflex'], pf: [['p', 'f']], kx: ['k'], tθ: ['θ'], dð: ['ð'], tɬ: [['t', 'l'], 'lateralFric'],
  kp: [['k', 'p']], ɡb: [['ɡ', 'b']],
};
const GLIDES = { j: 'j', w: 'w', ɥ: 'w', ʍ: 'w' };

// Vowel + glide → English diphthong
const DIPHTHONG = {
  'ɑ j': 'aɪ', 'ʌ j': 'aɪ', 'ə j': 'aɪ', 'æ j': 'aɪ', 'ɑ w': 'aʊ', 'ʌ w': 'aʊ', 'ə w': 'aʊ', 'æ w': 'aʊ',
  'eɪ j': 'eɪ', 'ɛ j': 'eɪ', 'oʊ j': 'ɔɪ', 'ɔ j': 'ɔɪ', 'oʊ w': 'oʊ', 'u w': 'u', 'i j': 'i',
};
const FINAL_TENSE = { ɪ: 'i', ɛ: 'eɪ', æ: 'ɑ', ʊ: 'u' };

function toUnits(toks, note) {
  const units = [];
  let pending = 0;
  toks.forEach((t, ti) => {
    if (t.t === 'stress') { pending = t.level; return; }
    if (t.t !== 'seg') return;
    const m = t.mods;
    const nasal = m.includes('̃');
    const nonsyl = m.includes('̯');
    const syllabic = m.includes('̩') || m.includes('̍');
    const chars = C[t.base] || GLIDES[t.base] ? [t.base] : [...t.base];
    chars.forEach((b, idx) => {
      const lastChar = idx === chars.length - 1;
      if (V[b]) {
        const [v, key] = V[b];
        if ((nonsyl && lastChar) || (idx > 0 && 'iuɪʊ'.includes(b))) {
          units.push({ k: 'G', g: 'iɪy'.includes(b) ? 'j' : 'w', nasal: nasal && lastChar });
          return;
        }
        const following = lastChar ? toks[ti + 1]?.base : chars[idx + 1];
        if (key && !(key === 'pureVowel' && following && 'ɪʊ'.includes(following))) note(key, b, v);
        const rhotic = lastChar && m.includes('˞');
        units.push({ k: 'V', v: rhotic && (v === 'ə' || v === 'eɪ') ? 'ɚ' : rhotic && v === 'ɝ' ? 'ɝ' : v, nasal: nasal && lastChar, stress: pending, raw: b });
        pending = 0;
        if (rhotic && !['ɚ', 'ɝ'].includes(units[units.length - 1].v)) units.push({ k: 'C', c: 'ɹ' });
        return;
      }
      if (GLIDES[b]) { units.push({ k: 'G', g: GLIDES[b], nasal: false }); return; }
      const entry = C[b];
      if (!entry) { note('unknown', b, '∅'); return; }
      const [target, key] = entry;
      if (key) note(key, b, Array.isArray(target) ? target.join('') : target === 'X' ? 'h/k' : target || '∅');
      if (syllabic) units.push({ k: 'V', v: 'ə', stress: 0 });
      for (const c of [].concat(target)) if (c) units.push({ k: 'C', c });
      if (lastChar && m.includes('ʷ')) units.push({ k: 'G', g: 'w', nasal: false });
    });
  });
  return units;
}

function shape(units, note) {
  const out = [];
  for (let i = 0; i < units.length; i++) {
    const x = units[i], p = out[out.length - 1], nx = units[i + 1];
    // Diphthongs from vowel + glide (or unstressed i/u written as a vowel)
    if (p && p.k === 'V' && (x.k === 'G' || (x.k === 'V' && 'iuɪʊ'.includes(x.raw || '') && !x.stress))) {
      const g = x.k === 'G' ? x.g : 'iɪ'.includes(x.raw) ? 'j' : 'w';
      const d = DIPHTHONG[`${p.v} ${g}`];
      if (d && !(nx && nx.k === 'V')) { p.v = d; p.nasal = p.nasal || x.nasal; continue; }
    }
    if (x.k === 'V' && p && p.k === 'V' && p.v === x.v && !x.stress) continue; // long / doubled
    // A glide not followed by a vowel becomes a vowel of its own: céu [sɛw] → seh-oo
    if (x.k === 'G' && !(nx && nx.k === 'V') && p && (p.k === 'V' || p.k === 'C')) {
      out.push({ k: 'V', v: x.g === 'j' ? 'i' : 'u', stress: 0, nasal: x.nasal, ep: true });
      continue;
    }
    if (x.k === 'G') { out.push({ k: 'C', c: x.g }); continue; }
    if (x.k === 'C' && p && p.k === 'C' && p.c === x.c) continue; // geminate
    // [h] can't close an English syllable (Brazilian perto [ˈpɛhtu] → PEH-too)
    if (x.k === 'C' && x.c === 'h' && !(nx && (nx.k === 'V' || nx.k === 'G'))) { note('codaH', 'h', '∅'); continue; }
    out.push(x);
    if (x.k === 'V' && x.nasal) note('nasalV', x.v + '̃', x.v + 'n');
  }
  // Nasal vowels → vowel + n (n before p/b becomes m)
  const res = [];
  out.forEach((x, k) => {
    res.push(x);
    if (x.k === 'V' && x.nasal) {
      const n1 = out[k + 1];
      if (!(n1 && n1.k === 'C' && ['n', 'm', 'ŋ'].includes(n1.c))) res.push({ k: 'C', c: n1 && n1.k === 'C' && 'pb'.includes(n1.c) ? 'm' : 'n' });
    }
  });
  // Velar fricative: [h] before a vowel, [k] elsewhere (Juan → hwahn, Bach → bahk)
  res.forEach((x, k) => {
    if (x.k === 'C' && x.c === 'X') {
      const n1 = res[k + 1];
      x.c = n1 && (n1.k === 'V' || (n1.k === 'C' && n1.c === 'w')) ? 'h' : 'k';
    }
  });
  return res;
}

export function adaptWord(ipaWord, note = () => {}) {
  const units = shape(toUnits(tokenizeIPA(ipaWord), note), note);
  if (!units.length) return null;
  const syls = [];
  let cl = [];
  let cur = null;
  let i = 0;
  // Initial cluster: insert [ə] until the rest is a legal English onset (Pnin → puh-NEEN)
  while (i < units.length && units[i].k !== 'V') cl.push(units[i++].c);
  if (cl[0] === 'ŋ') cl[0] = 'n';
  while (cl.length > 1 && !legalOnset(cl)) {
    syls.push({ onset: [cl.shift()], v: 'ə', stress: 0, coda: [], ep: true });
    note('epenthesis', syls[syls.length - 1].onset[0], syls[syls.length - 1].onset[0] + 'ə');
  }
  let onset = cl;
  let endsInConsonant = false;
  for (; i < units.length; i++) {
    const x = units[i];
    if (x.k !== 'V') { cl.push(x.c); continue; }
    if (cur) {
      let s = 0;
      while (s < cl.length && !legalOnset(cl.slice(s))) s++;
      cur.coda.push(...cl.slice(0, s));
      onset = cl.slice(s);
    }
    cur = { onset, v: x.v, stress: x.stress === 1 ? 1 : 0, coda: [], ep: !!x.ep };
    syls.push(cur);
    cl = [];
  }
  if (!cur) {
    if (!syls.length) return [{ onset: [], v: '', stress: 1, coda: cl }];
    cur = syls[syls.length - 1];
  }
  endsInConsonant = cl.length > 0;
  cur.coda.push(...cl);

  const real = syls.map((s, k) => k).filter((k) => !syls[k].ep);
  let si = syls.findIndex((s) => s.stress === 1);
  if (si < 0) {
    si = real.length <= 1 ? real[0] ?? 0 : endsInConsonant ? real[real.length - 1] : real[real.length - 2];
    if (real.length > 1) note('stress');
  }
  syls.forEach((s, k) => {
    s.stress = k === si ? 1 : 0;
    delete s.ep;
    if (s.stress && s.v === 'ə') s.v = 'ʌ';
  });
  // A stressed lax vowel can't end an English word: café → ka-FAY
  const last = syls[syls.length - 1];
  if (last.stress && !last.coda.length && FINAL_TENSE[last.v]) {
    note('finalLax', last.v, FINAL_TENSE[last.v]);
    last.v = FINAL_TENSE[last.v];
  }
  return syls;
}
