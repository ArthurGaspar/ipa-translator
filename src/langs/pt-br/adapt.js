// Any IPA → Brazilian Portuguese phonemic syllables.
//
// Each foreign sound is mapped to its nearest Brazilian sound, then the word is
// fitted to Brazilian syllable structure with the minimum of changes a Brazilian
// speaker naturally makes: an [i] after consonants that can't close a syllable
// (dog → dógui), "es-" before s + consonant (stop → estópi), nasal codas folded
// into the vowel. Everything else from the original is kept.

import { tokenizeIPA } from '../../ipa/tokenize.js';

// Vowels → [target, note key]
const V = {
  i: ['i'], y: ['i', 'frontRound'], ɨ: ['i', 'central'], ʉ: ['u', 'central'], ɯ: ['u', 'central'],
  u: ['u'], ɪ: ['i', 'lax'], ʏ: ['i', 'frontRound'], ʊ: ['u', 'lax'], e: ['e'], ø: ['e', 'frontRound'],
  ɘ: ['e', 'central'], ɵ: ['o', 'central'], ɤ: ['o', 'central'], o: ['o'], ə: ['ɐ', 'schwa'],
  ɛ: ['ɛ'], œ: ['ɛ', 'frontRound'], ɜ: ['ɛ', 'central'], ɞ: ['ɔ', 'central'], ʌ: ['a', 'strut'],
  ɔ: ['ɔ'], æ: ['ɛ', 'ash'], ɐ: ['ɐ'], a: ['a'], ɶ: ['ɛ', 'frontRound'], ɑ: ['a', 'backA'], ɒ: ['ɔ', 'backA'],
};

// Consonants → [target(s), note key]. '' = dropped.
const C = {
  p: ['p'], b: ['b'], t: ['t'], d: ['d'], ʈ: ['t', 'retroflex'], ɖ: ['d', 'retroflex'], c: ['k', 'palatal'],
  ɟ: ['ɡ', 'palatal'], k: ['k'], ɡ: ['ɡ'], q: ['k', 'uvular'], ɢ: ['ɡ', 'uvular'], ʔ: ['', 'glottal'],
  ʡ: ['', 'glottal'], m: ['m'], ɱ: ['m'], n: ['n'], ɳ: ['n', 'retroflex'], ɲ: ['ɲ'], ŋ: ['ŋ'], ɴ: ['ŋ', 'uvular'],
  ʙ: ['b', 'trill'], r: ['R', 'trill'], ʀ: ['R', 'rhotic'], ⱱ: ['v'], ɾ: ['ɾ'], ɽ: ['ɾ', 'retroflex'],
  ɸ: ['f', 'bilabialFric'], β: ['b', 'beta'], f: ['f'], v: ['v'], θ: ['t', 'th'], ð: ['d', 'dh'],
  s: ['s'], z: ['z'], ʃ: ['ʃ'], ʒ: ['ʒ'], ʂ: ['ʃ', 'retroflex'], ʐ: ['ʒ', 'retroflex'], ɕ: ['ʃ', 'alveolopalatal'],
  ʑ: ['ʒ', 'alveolopalatal'], ç: ['ʃ', 'ich'], ʝ: ['ʒ', 'palatal'], x: ['R', 'velarFric'], ɣ: ['ɡ', 'gamma'],
  χ: ['R', 'velarFric'], ʁ: ['R', 'rhotic'], ħ: ['R', 'pharyngeal'], ʕ: ['', 'pharyngeal'], h: ['R', 'h'],
  ɦ: ['R', 'h'], ɧ: ['ʃ'], ɬ: ['l', 'lateralFric'], ɮ: ['l', 'lateralFric'], ʋ: ['v'], ɹ: ['ɾ', 'approxR'],
  ɻ: ['ɾ', 'approxR'], ɺ: ['ɾ'], l: ['l'], ɫ: ['l', 'darkL'], ɭ: ['l', 'retroflex'], ʎ: ['ʎ'], ʟ: ['l'],
  ɰ: ['', 'velarApprox'], ɓ: ['b', 'implosive'], ɗ: ['d', 'implosive'], ʄ: ['ɡ', 'implosive'],
  ɠ: ['ɡ', 'implosive'], ʛ: ['ɡ', 'implosive'], ʘ: ['', 'click'], ǀ: ['', 'click'], ǃ: ['', 'click'],
  ǂ: ['', 'click'], ǁ: ['', 'click'],
  tʃ: ['tʃ'], dʒ: ['dʒ'], ts: ['ts'], dz: ['dz'], tɕ: ['tʃ', 'alveolopalatal'], dʑ: ['dʒ', 'alveolopalatal'],
  tʂ: ['tʃ', 'retroflex'], dʐ: ['dʒ', 'retroflex'], ʈʂ: ['tʃ', 'retroflex'], ɖʐ: ['dʒ', 'retroflex'],
  pf: [['p', 'f']], kx: ['k', 'velarFric'], tθ: ['t', 'th'], dð: ['d', 'dh'], tɬ: [['t', 'l'], 'lateralFric'],
  kp: [['k', 'p']], ɡb: [['ɡ', 'b']],
};
const GLIDES = { j: 'j', w: 'w', ɥ: 'w', ʍ: 'w' };

const CLUSTER_HEADS = new Set(['p', 'b', 't', 'd', 'k', 'ɡ', 'f', 'v']);
const NASALS = new Set(['m', 'n', 'ŋ']);
const isSib = (c) => c === 's' || c === 'z' || c === 'ʃ' || c === 'ʒ';

function legalOnset(cl) {
  if (cl.length === 0) return true;
  if (cl.length === 1) return cl[0].k === 'G' || cl[0].c !== 'ŋ';
  const [a, b, c] = cl;
  const pair = a.k === 'C' && b.k === 'C' && CLUSTER_HEADS.has(a.c) && (b.c === 'ɾ' || (b.c === 'l' && a.c !== 't' && a.c !== 'd'));
  if (cl.length === 2) return pair || (a.k === 'C' && a.c !== 'ŋ' && b.k === 'G');
  return cl.length === 3 && pair && c.k === 'G';
}

const epSyl = (c) => ({ onset: [c], nuc: { v: 'i', nasal: false }, off: null, coda: [], stress: false, ep: true });

/** Map tokens to units: V (vowel), G (glide), C (consonant). */
function toUnits(toks, note, opts = {}) {
  const units = [];
  let pending = 0;
  const pushVowel = (v, nasal, long, nonsyl) => {
    if (nonsyl) { units.push({ k: 'G', g: v === 'u' || v === 'o' ? 'w' : 'j', nasal }); return; }
    units.push({ k: 'V', v, nasal, long, stress: pending === 1 });
    pending = 0;
  };
  for (const t of toks) {
    if (t.t === 'stress') { pending = t.level; continue; }
    if (t.t !== 'seg') continue;
    const m = t.mods;
    const nasal = m.includes('̃');
    const nonsyl = m.includes('̯');
    const syllabic = m.includes('̩') || m.includes('̍');
    // Tied vowel sequences (a͡ɪ): treat as separate symbols
    const chars = C[t.base] || GLIDES[t.base] ? [t.base] : [...t.base];
    chars.forEach((b, idx) => {
      const lastChar = idx === chars.length - 1;
      if (V[b]) {
        const [v, key] = V[b];
        if (key) note(key, b, v);
        pushVowel(v, nasal && lastChar, m.includes('ː'), (nonsyl && lastChar) || (idx > 0 && 'iu'.includes(v)));
        if (lastChar && m.includes('˞')) { units.push({ k: 'C', c: 'ɾ' }); note('rhoticVowel', b + '˞', v + 'r'); }
        return;
      }
      if (GLIDES[b]) {
        if (b !== 'j' && b !== 'w') note('glide', b, GLIDES[b]);
        units.push({ k: 'G', g: GLIDES[b], nasal: false });
        return;
      }
      const entry = C[b];
      if (!entry) { note('unknown', b, '∅'); return; }
      let [target, key] = entry;
      // Spanish [θ] (cerveza) is heard by Brazilians as [s], English [θ] (think) as [t]
      if (b === 'θ' && opts.sourceLang === 'es-ES') [target, key] = ['s', 'thEs'];
      if (key) note(key, b, Array.isArray(target) ? target.join('') : target || '∅');
      if (syllabic) { pushVowel('e', false, false, false); note('syllabic', b + '̩', 'e' + b); }
      for (const c of [].concat(target)) if (c) units.push({ k: 'C', c });
      if (lastChar && m.includes('ʷ')) units.push({ k: 'G', g: 'w', nasal: false });
    });
  }
  return units;
}

/**
 * Long vowels shorten, identical vowels merge, unstressed i/u after a vowel → glide,
 * geminates simplify, a trill after an obstruent becomes the cluster tap (tr, gr).
 */
function shapeVowels(units) {
  const out = [];
  for (const x of units) {
    const p = out[out.length - 1];
    if (x.k === 'C' && x.c === 'R' && p && p.k === 'C' && CLUSTER_HEADS.has(p.c)) x.c = 'ɾ';
    if (x.k === 'V' && p && p.k === 'V') {
      if (p.v === x.v && !x.stress) { p.nasal = p.nasal || x.nasal; continue; }
      if ((x.v === 'i' || x.v === 'u') && !x.stress && !x.long) {
        out.push({ k: 'G', g: x.v === 'i' ? 'j' : 'w', nasal: x.nasal });
        continue;
      }
    }
    if (x.k === 'C' && p && p.k === 'C' && (p.c === x.c || (x.c.length === 2 && x.c[0] === p.c))) {
      out[out.length - 1] = x; // degeminate: tt → t, t+ts → ts
      continue;
    }
    out.push(x);
  }
  // Schwa before a syllable-final l sounds like Brazilian "el" (Google → gúguel)
  out.forEach((x, k) => {
    const n1 = out[k + 1], n2 = out[k + 2];
    if (x.k === 'V' && x.v === 'ɐ' && !x.stress && n1 && n1.k === 'C' && n1.c === 'l' && (!n2 || n2.k !== 'V')) x.v = 'e';
  });
  return out;
}

/** Can consonant c close syllable s? Brazilian codas: s, r, l, nasal (folded into the vowel). */
function canCoda(s, c, wordFinal) {
  if (NASALS.has(c)) {
    if (s.coda.length || s.nasalCoda) return false;
    if (wordFinal && c === 'n') return false;            // keep the [n]: "iPhone" → aifôni
    if (wordFinal && c === 'm' && s.off) return false;   // "time" → táimi
    return true;
  }
  if (c === 's' || c === 'z') return s.coda.every((x) => x === 'ɾ' || x === 'R' || x === 'l');
  if (c === 'ɾ' || c === 'R' || c === 'l') return s.coda.length === 0 && !s.nasalCoda;
  return false;
}

export function adaptWord(ipaWord, note = () => {}, opts = {}) {
  const toks = tokenizeIPA(ipaWord);
  let units = shapeVowels(toUnits(toks, note, opts));
  if (!units.some((x) => x.k === 'V')) {
    units = units.map((x) => (x.k === 'G' ? { k: 'V', v: x.g === 'j' ? 'i' : 'u', nasal: false } : x));
  }
  if (!units.length) return null;

  const syls = [];
  let i = 0;
  const fillCoda = (syl, cl, final) => {
    let target = syl;
    cl.forEach((x, k) => {
      if (x.k === 'G') { if (!target.off && !target.coda.length) target.off = { g: x.g, nasal: false }; return; }
      const wordFinal = final && k === cl.length - 1;
      if (canCoda(target, x.c, wordFinal)) {
        if (NASALS.has(x.c)) {
          target.nasalCoda = true;
          target.nuc.nasal = true;
          if (target.off) target.off.nasal = true;
          note('nasal', x.c, '~');
        } else target.coda.push(x.c === 'z' ? 's' : x.c);
      } else {
        target = epSyl(x.c === 'ŋ' ? 'n' : x.c);
        syls.push(target);
        note('epenthesis', x.c, x.c + 'i');
      }
    });
  };

  // Word-initial cluster
  let cl = [];
  while (i < units.length && units[i].k !== 'V') cl.push(units[i++]);
  cl = cl.map((x) => (x.k === 'C' && x.c === 'ŋ' ? { k: 'C', c: 'n' } : x));
  if (!legalOnset(cl) && cl[0].k === 'C' && isSib(cl[0].c) && cl.length > 1) {
    syls.push({ onset: [], nuc: { v: 'i', nasal: false }, off: null, coda: ['s'], stress: false, ep: true, prothetic: true });
    note('prothesis', cl[0].c + cl[1].c, 'es' + cl[1].c);
    cl = cl.slice(1);
  }
  while (!legalOnset(cl)) {
    if (cl[0].k === 'G') { cl = cl.slice(1); continue; }
    syls.push(epSyl(cl[0].c));
    note('epenthesis', cl[0].c, cl[0].c + 'i');
    cl = cl.slice(1);
  }
  let onset = cl;
  let endsInConsonant = false;

  while (i < units.length) {
    const v = units[i++];
    const syl = {
      onset: onset.map((x) => (x.k === 'G' ? x.g : x.c)),
      nuc: { v: v.v, nasal: !!v.nasal }, off: null, coda: [], stress: !!v.stress, ep: false,
    };
    if (units[i] && units[i].k === 'G') { syl.off = { g: units[i].g, nasal: !!units[i].nasal }; i++; }
    syls.push(syl);
    cl = [];
    while (i < units.length && units[i].k !== 'V') cl.push(units[i++]);
    if (i >= units.length) {
      endsInConsonant = cl.some((x) => x.k === 'C');
      fillCoda(syl, cl, true);
      break;
    }
    // ŋ before a vowel: nasal vowel + [ɡ] (singer → sínguer)
    if (cl.length && cl[cl.length - 1].c === 'ŋ') cl.splice(cl.length - 1, 1, { k: 'C', c: 'ŋ' }, { k: 'C', c: 'ɡ' });
    let s = 0;
    while (s < cl.length && !legalOnset(cl.slice(s))) s++;
    fillCoda(syl, cl.slice(0, s), false);
    onset = cl.slice(s);
  }

  // Stress: explicit ˈ, else Portuguese-like default (last syllable if the word ends in a consonant, else penultimate)
  const real = syls.map((x, k) => k).filter((k) => !syls[k].ep);
  let si = syls.findIndex((x) => x.stress && !x.ep);
  if (si < 0) {
    if (!real.length) si = syls.length - 1;
    else if (real.length === 1) si = real[0];
    else {
      si = endsInConsonant ? real[real.length - 1] : real[real.length - 2];
      note('stress');
    }
  }

  syls.forEach((x, k) => {
    x.stress = k === si;
    delete x.nasalCoda;
    if (x.stress && x.nuc.v === 'ɐ' && !x.nuc.nasal) x.nuc.v = 'a';
    if (x.nuc.nasal && (x.nuc.v === 'ɛ' || x.nuc.v === 'ɔ')) x.nuc.v = x.nuc.v === 'ɛ' ? 'e' : 'o';
    if (x.nuc.nasal && x.nuc.v === 'ɐ') x.nuc.v = 'a';
    if (x.off && ((x.off.g === 'j' && x.nuc.v === 'i') || (x.off.g === 'w' && x.nuc.v === 'u'))) x.off = null;
  });
  return { syls, clitic: false };
}
