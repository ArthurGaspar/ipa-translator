// Any IPA → Spanish phonemic syllables.
//
// Sounds become their nearest Spanish sound (v → b, z → s, sh → ch, h → j…), and words
// are fitted to Spanish syllables the way a Spanish speaker would: "es-" before s +
// consonant (stress → estrés), and an "e" after consonants Spanish can't end a word
// with (park → parque).

import { tokenizeIPA } from '../../ipa/tokenize.js';
import { CLUSTER_HEADS } from './g2p.js';

const V = {
  i: ['i'], y: ['u', 'frontRound'], ɨ: ['i', 'central'], ʉ: ['u', 'central'], ɯ: ['u', 'central'], u: ['u'],
  ɪ: ['i', 'lax'], ʏ: ['u', 'frontRound'], ʊ: ['u', 'lax'], e: ['e'], ø: ['e', 'frontRound'], ɘ: ['e', 'central'],
  ɵ: ['o', 'central'], ɤ: ['o', 'central'], o: ['o'], ə: ['e', 'schwa'], ɛ: ['e', 'openMid'], œ: ['e', 'frontRound'],
  ɜ: ['e', 'central'], ɞ: ['o', 'central'], ʌ: ['a', 'strut'], ɔ: ['o', 'openMid'], æ: ['a', 'ash'], ɐ: ['a'],
  a: ['a'], ɶ: ['a', 'frontRound'], ɑ: ['a', 'backA'], ɒ: ['o', 'backA'],
};
const C = {
  p: ['p'], b: ['b'], t: ['t'], d: ['d'], ʈ: ['t', 'retroflex'], ɖ: ['d', 'retroflex'], c: ['k', 'palatal'],
  ɟ: ['ɡ', 'palatal'], k: ['k'], ɡ: ['ɡ'], q: ['k', 'uvular'], ɢ: ['ɡ', 'uvular'], ʔ: ['', 'glottal'],
  ʡ: ['', 'glottal'], m: ['m'], ɱ: ['m'], n: ['n'], ɳ: ['n', 'retroflex'], ɲ: ['ɲ'], ŋ: ['ŋ'], ɴ: ['ŋ', 'uvular'],
  ʙ: ['b'], r: ['R'], ʀ: ['ɾ', 'uvularR'], ⱱ: ['b'], ɾ: ['ɾ'], ɽ: ['ɾ', 'retroflex'], ɸ: ['f', 'bilabialFric'],
  β: ['b'], f: ['f'], v: ['b', 'noV'], θ: ['θ'], ð: ['d'], s: ['s'], z: ['s', 'noZ'], ʃ: ['tʃ', 'sh'],
  ʒ: ['ʝ', 'zh'], ʂ: ['tʃ', 'retroflex'], ʐ: ['ʝ', 'retroflex'], ɕ: ['tʃ', 'alveolopalatal'],
  ʑ: ['ʝ', 'alveolopalatal'], ç: ['x', 'ich'], ʝ: ['ʝ'], x: ['x'], ɣ: ['ɡ'], χ: ['x', 'uvular'],
  ʁ: ['ɾ', 'uvularR'], ħ: ['x', 'pharyngeal'], ʕ: ['', 'pharyngeal'], h: ['x', 'h'], ɦ: ['x', 'h'],
  ɧ: ['x'], ɬ: ['l', 'lateralFric'], ɮ: ['l', 'lateralFric'], ʋ: ['b', 'noV'], ɹ: ['ɾ', 'approxR'],
  ɻ: ['ɾ', 'approxR'], ɺ: ['ɾ'], l: ['l'], ɫ: ['l'], ɭ: ['l', 'retroflex'], ʎ: ['ʝ', 'yeismo'], ʟ: ['l'],
  ɰ: ['', 'velarApprox'], ɓ: ['b', 'implosive'], ɗ: ['d', 'implosive'], ʄ: ['ɡ', 'implosive'],
  ɠ: ['ɡ', 'implosive'], ʛ: ['ɡ', 'implosive'], ʘ: ['', 'click'], ǀ: ['', 'click'], ǃ: ['', 'click'],
  ǂ: ['', 'click'], ǁ: ['', 'click'],
  tʃ: ['tʃ'], dʒ: ['ʝ', 'dj'], ts: [['t', 's']], dz: [['d', 's']], tɕ: ['tʃ', 'alveolopalatal'],
  dʑ: ['ʝ', 'alveolopalatal'], tʂ: ['tʃ', 'retroflex'], dʐ: ['ʝ', 'retroflex'], ʈʂ: ['tʃ', 'retroflex'],
  ɖʐ: ['ʝ', 'retroflex'], pf: [['p', 'f']], kx: [['k', 'x']], tθ: ['θ'], dð: ['d'], ɟʝ: ['ʝ'],
  tɬ: [['t', 'l'], 'lateralFric'], kp: [['k', 'p']], ɡb: [['ɡ', 'b']],
};
const GLIDES = { j: 'j', w: 'w', ɥ: 'w', ʍ: 'w' };

const isSib = (c) => c === 's' || c === 'θ' || c === 'tʃ';
// Consonants Spanish words can end in, and those that can close a syllable inside a word
const FINAL_OK = new Set(['s', 'n', 'l', 'ɾ', 'd', 'θ', 'x']);
const MEDIAL_OK = new Set(['s', 'n', 'l', 'ɾ', 'd', 'θ', 'x', 'b', 'k', 'p', 't', 'ɡ', 'f']);

function legalOnset(cl) {
  if (cl.length === 0) return true;
  if (cl.length === 1) return cl[0].k === 'G' || cl[0].c !== 'ŋ';
  const [a, b, c] = cl;
  const pair = a.k === 'C' && b.k === 'C' && CLUSTER_HEADS.has(a.c) && (b.c === 'ɾ' || (b.c === 'l' && a.c !== 't' && a.c !== 'd'));
  if (cl.length === 2) return pair || (a.k === 'C' && a.c !== 'ŋ' && b.k === 'G');
  return cl.length === 3 && pair && c.k === 'G';
}

function toUnits(toks, note) {
  const units = [];
  let pending = 0;
  toks.forEach((t) => {
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
        if ((nonsyl && lastChar) || (idx > 0 && 'iuɪʊ'.includes(b))) { units.push({ k: 'G', g: 'iɪye'.includes(b) ? 'j' : 'w' }); return; }
        if (key) note(key, b, v);
        units.push({ k: 'V', v, nasal: nasal && lastChar, long: m.includes('ː'), stress: pending === 1, raw: b });
        pending = 0;
        if (lastChar && m.includes('˞')) { units.push({ k: 'C', c: 'ɾ' }); note('rhoticVowel', b + '˞', v + 'r'); }
        return;
      }
      if (GLIDES[b]) { units.push({ k: 'G', g: GLIDES[b] }); return; }
      const entry = C[b];
      if (!entry) { note('unknown', b, '∅'); return; }
      const [target, key] = entry;
      if (key) note(key, b, Array.isArray(target) ? target.join('') : target || '∅');
      if (syllabic) { units.push({ k: 'V', v: 'e', stress: false }); note('syllabic', b + '̩', 'e' + b); }
      for (const c of [].concat(target)) if (c) units.push({ k: 'C', c });
      if (lastChar && m.includes('ʷ')) units.push({ k: 'G', g: 'w' });
    });
  });
  return units;
}

function shape(units, note) {
  const out = [];
  units.forEach((x, k) => {
    const p = out[out.length - 1], nx = units[k + 1];
    if (x.k === 'V' && p && p.k === 'V') {
      if (p.v === x.v && !x.stress) return; // long / doubled
      // unstressed i/u after a vowel → falling diphthong (ai, au, ei…)
      if ((x.v === 'i' || x.v === 'u') && !x.stress && !x.long && p.v !== x.v) { out.push({ k: 'G', g: x.v === 'i' ? 'j' : 'w', off: true }); return; }
    }
    // unstressed i/u before another vowel → rising diphthong (ia, ue…)
    if (x.k === 'V' && (x.v === 'i' || x.v === 'u') && !x.stress && !x.long && nx && nx.k === 'V' && nx.v !== x.v) {
      out.push({ k: 'G', g: x.v === 'i' ? 'j' : 'w' });
      return;
    }
    if (x.k === 'C' && p && p.k === 'C' && p.c === x.c) return; // geminate
    if (x.k === 'C' && x.c === 'R' && p && p.k === 'C' && CLUSTER_HEADS.has(p.c)) x.c = 'ɾ'; // tr, gr
    out.push(x);
  });
  // Nasal vowels → vowel + n
  const res = [];
  out.forEach((x, k) => {
    res.push(x);
    if (x.k === 'V' && x.nasal) {
      note('nasalV', (x.raw || x.v) + '̃', x.v + 'n');
      const n1 = out[k + 1];
      if (!(n1 && n1.k === 'C' && ['n', 'm', 'ŋ', 'ɲ'].includes(n1.c))) res.push({ k: 'C', c: 'n' });
    }
  });
  // English-style schwa at the end of a word sounds like Spanish "a" (pizza → pitsa)
  const lastV = [...res].reverse().find((x) => x.k === 'V');
  if (lastV && lastV.raw === 'ə' && res[res.length - 1] === lastV) lastV.v = 'a';
  return res;
}

const epSyl = (c) => ({ onset: [c], nuc: { v: 'e' }, off: null, coda: [], stress: false, ep: true });

export function adaptWord(ipaWord, note = () => {}) {
  let units = shape(toUnits(tokenizeIPA(ipaWord), note), note);
  if (!units.some((x) => x.k === 'V')) units = units.map((x) => (x.k === 'G' ? { k: 'V', v: x.g === 'j' ? 'i' : 'u' } : x));
  if (!units.length) return null;

  const syls = [];
  const canCoda = (s, c, final) => {
    if (c === 'm') c = 'n';
    if (c === 'ŋ') c = 'n';
    if (c === 'R') c = 'ɾ';
    const ok = final ? FINAL_OK : MEDIAL_OK;
    if (!ok.has(c)) return null;
    if (s.coda.length === 0) return c;
    if (s.coda.length === 1 && c === 's' && ['n', 'b', 'k', 'ɾ', 'l', 'p'].includes(s.coda[0])) return c; // ns, bs, ks
    return null;
  };
  const fillCoda = (syl, cl, final) => {
    let target = syl;
    cl.forEach((x, k) => {
      if (x.k === 'G') { if (!target.off && !target.coda.length) target.off = { g: x.g }; return; }
      const wordFinal = final && k === cl.length - 1;
      const c = canCoda(target, x.c, wordFinal);
      if (c) {
        // a coda m becomes n (and is realised as [m] again before p/b by assimilation)
        if ((x.c === 'm' || x.c === 'ŋ') && wordFinal) note('finalNasal', x.c, 'n');
        target.coda.push(c);
      } else {
        target = epSyl(x.c === 'ŋ' ? 'n' : x.c === 'R' ? 'ɾ' : x.c);
        syls.push(target);
        note('epenthesis', x.c, x.c + 'e');
      }
    });
  };

  let i = 0;
  let cl = [];
  while (i < units.length && units[i].k !== 'V') cl.push(units[i++]);
  cl = cl.map((x) => (x.k === 'C' && x.c === 'ŋ' ? { k: 'C', c: 'n' } : x));
  if (!legalOnset(cl) && cl[0].k === 'C' && isSib(cl[0].c) && cl.length > 1) {
    syls.push({ onset: [], nuc: { v: 'e' }, off: null, coda: ['s'], stress: false, ep: true });
    note('prothesis', cl[0].c + (cl[1].c || cl[1].g), 'es' + (cl[1].c || cl[1].g));
    cl = cl.slice(1);
  }
  while (!legalOnset(cl)) {
    if (cl[0].k === 'G') { cl = cl.slice(1); continue; }
    syls.push(epSyl(cl[0].c));
    note('epenthesis', cl[0].c, cl[0].c + 'e');
    cl = cl.slice(1);
  }
  let onset = cl;
  let endsInConsonant = false;
  while (i < units.length) {
    const v = units[i++];
    const syl = { onset: onset.map((x) => (x.k === 'G' ? x.g : x.c)), nuc: { v: v.v }, off: null, coda: [], stress: !!v.stress, ep: false };
    if (units[i] && units[i].k === 'G' && !(units[i + 1] && units[i + 1].k === 'V')) { syl.off = { g: units[i].g }; i++; }
    syls.push(syl);
    cl = [];
    while (i < units.length && units[i].k !== 'V') cl.push(units[i++]);
    if (i >= units.length) {
      endsInConsonant = cl.some((x) => x.k === 'C');
      fillCoda(syl, cl, true);
      break;
    }
    if (cl.length && cl[cl.length - 1].c === 'ŋ') cl.splice(cl.length - 1, 1, { k: 'C', c: 'n' }, { k: 'C', c: 'ɡ' });
    let s = 0;
    while (s < cl.length && !legalOnset(cl.slice(s))) s++;
    fillCoda(syl, cl.slice(0, s), false);
    onset = cl.slice(s);
  }

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
    x.coda = x.coda.map((c) => (c === 'R' ? 'ɾ' : c));
    if (x.off && ((x.off.g === 'j' && x.nuc.v === 'i') || (x.off.g === 'w' && x.nuc.v === 'u'))) x.off = null;
  });
  return { syls, clitic: false };
}
