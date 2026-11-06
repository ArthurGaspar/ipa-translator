// Any IPA → Lebanese Arabic segments.
//
// Lebanese speakers handle consonant clusters, p, v and g easily, so the changes are mostly
// sound substitutions (th → s, the → ze, French r → غ) plus a prothetic [i] before three
// initial consonants (strawberry → istroːberi) and an [i] to break longer clusters.

import { tokenizeIPA } from '../../ipa/tokenize.js';

const V = {
  i: ['i'], y: ['i', 'frontRound'], ɨ: ['i', 'central'], ʉ: ['u', 'central'], ɯ: ['u', 'central'], u: ['u'],
  ɪ: ['i', 'lax'], ʏ: ['i', 'frontRound'], ʊ: ['u', 'lax'], e: ['e'], ø: ['e', 'frontRound'], ɘ: ['e', 'central'],
  ɵ: ['o', 'central'], ɤ: ['o', 'central'], o: ['o'], ə: ['e', 'schwa'], ɛ: ['e'], œ: ['e', 'frontRound'],
  ɜ: ['e', 'central'], ɞ: ['o', 'central'], ʌ: ['a', 'strut'], ɔ: ['o'], æ: ['a', 'ash'], ɐ: ['a'], a: ['a'],
  ɶ: ['a', 'frontRound'], ɑ: ['a'], ɒ: ['o'],
};
const C = {
  p: ['p'], b: ['b'], t: ['t'], d: ['d'], ʈ: ['t', 'retroflex'], ɖ: ['d', 'retroflex'], c: ['k', 'palatal'],
  ɟ: ['ɡ', 'palatal'], k: ['k'], ɡ: ['ɡ'], q: ['ʔ', 'qLeb'], ɢ: ['ɡ', 'uvular'], ʔ: ['ʔ'], ʡ: ['ʔ'],
  m: ['m'], ɱ: ['m'], n: ['n'], ɳ: ['n', 'retroflex'], ɲ: [['n', 'j'], 'palatalNasal'], ŋ: ['ŋ'], ɴ: ['ŋ', 'uvular'],
  ʙ: ['b'], r: ['r'], ʀ: ['ɣ', 'uvularR'], ⱱ: ['v'], ɾ: ['r'], ɽ: ['r', 'retroflex'], ɸ: ['f', 'bilabialFric'],
  β: ['b', 'beta'], f: ['f'], v: ['v'], θ: ['s', 'thAr'], ð: ['z', 'dhAr'], s: ['s'], z: ['z'], ʃ: ['ʃ'], ʒ: ['ʒ'],
  ʂ: ['ʃ', 'retroflex'], ʐ: ['ʒ', 'retroflex'], ɕ: ['ʃ', 'alveolopalatal'], ʑ: ['ʒ', 'alveolopalatal'],
  ç: ['ʃ', 'ich'], ʝ: ['j', 'palatal'], x: ['x'], ɣ: ['ɣ'], χ: ['x', 'uvular'], ʁ: ['ɣ', 'uvularR'], ħ: ['ħ'],
  ʕ: ['ʕ'], h: ['h'], ɦ: ['h'], ɧ: ['ʃ'], ɬ: ['l', 'lateralFric'], ɮ: ['l', 'lateralFric'], ʋ: ['v'],
  ɹ: ['r', 'approxR'], ɻ: ['r', 'approxR'], ɺ: ['r'], l: ['l'], ɫ: ['l'], ɭ: ['l', 'retroflex'],
  ʎ: [['l', 'j'], 'palatalLat'], ʟ: ['l'], ɰ: ['', 'velarApprox'], ɓ: ['b', 'implosive'], ɗ: ['d', 'implosive'],
  ʄ: ['ɡ', 'implosive'], ɠ: ['ɡ', 'implosive'], ʛ: ['ɡ', 'implosive'], ʘ: ['', 'click'], ǀ: ['', 'click'],
  ǃ: ['', 'click'], ǂ: ['', 'click'], ǁ: ['', 'click'],
  tʃ: ['tʃ'], dʒ: ['ʒ', 'djAr'], ts: [['t', 's']], dz: [['d', 'z']], tɕ: ['tʃ', 'alveolopalatal'],
  dʑ: ['ʒ', 'alveolopalatal'], tʂ: ['tʃ', 'retroflex'], dʐ: ['ʒ', 'retroflex'], ʈʂ: ['tʃ', 'retroflex'],
  ɖʐ: ['ʒ', 'retroflex'], pf: [['p', 'f']], kx: [['k', 'x']], tθ: ['s', 'thAr'], dð: ['z', 'dhAr'],
  tɬ: [['t', 'l'], 'lateralFric'], kp: [['k', 'p']], ɡb: [['ɡ', 'b']],
};
const GLIDES = { j: 'j', w: 'w', ɥ: 'w', ʍ: 'w' };
const EMPHATIC = { t: 'tˤ', d: 'dˤ', s: 'sˤ', z: 'zˤ', ð: 'zˤ' };

function toUnits(toks, note) {
  const units = [];
  let pending = 0;
  toks.forEach((t) => {
    if (t.t === 'stress') { pending = t.level; return; }
    if (t.t !== 'seg') return;
    const m = t.mods;
    const nasal = m.includes('̃');
    const long = m.includes('ː');
    const chars = C[t.base] || GLIDES[t.base] ? [t.base] : [...t.base];
    chars.forEach((b, idx) => {
      const lastChar = idx === chars.length - 1;
      if (V[b]) {
        const [v, key] = V[b];
        if ((m.includes('̯') && lastChar) || (idx > 0 && 'iuɪʊ'.includes(b))) { units.push({ c: 'iɪye'.includes(b) ? 'j' : 'w' }); return; }
        if (key) note(key, b, v);
        units.push({ v, long: long && lastChar, stress: pending === 1, nasal: nasal && lastChar });
        pending = 0;
        if (lastChar && m.includes('˞')) { units.push({ c: 'r' }); note('rhoticVowel', b + '˞', v + 'r'); }
        return;
      }
      if (GLIDES[b]) { units.push({ c: GLIDES[b] }); return; }
      const entry = C[b];
      if (!entry) { note('unknown', b, '∅'); return; }
      let [target, key] = entry;
      // Emphatic (pharyngealised) consonants in the input stay emphatic: tˤ, sˤ…
      if (m.includes('ˤ') && EMPHATIC[b]) { target = EMPHATIC[b]; key = null; }
      if (key) note(key, b, Array.isArray(target) ? target.join('') : target || '∅');
      if (m.includes('̩') || m.includes('̍')) { units.push({ v: 'e', long: false }); note('syllabic', b + '̩', 'e' + b); }
      for (const c of [].concat(target)) if (c) { units.push({ c }); if (long && lastChar) units.push({ c }); }
      if (lastChar && m.includes('ʷ')) units.push({ c: 'w' });
    });
  });
  return units;
}

export function adaptWord(ipaWord, note = () => {}) {
  const raw = toUnits(tokenizeIPA(ipaWord), note);
  const segs = [];
  raw.forEach((x, k) => {
    const p = segs[segs.length - 1], nx = raw[k + 1];
    // unstressed i/u after a vowel → glide (diphthongs ay, aw)
    if (x.v && p?.v && (x.v === 'i' || x.v === 'u') && !x.stress && !x.long && p.v !== x.v) { segs.push({ c: x.v === 'i' ? 'j' : 'w' }); return; }
    if (x.v && p?.v === x.v && !x.stress) { p.long = true; return; } // doubled vowel = long
    segs.push({ ...x });
    if (x.v && x.nasal) {
      note('nasalV', x.v + '̃', x.v + 'n');
      if (!(nx?.c && ['n', 'm', 'ŋ'].includes(nx.c))) segs.push({ c: 'n' });
    }
  });
  // ŋ → n (+ g before a vowel: singer → siŋɡer)
  for (let i = 0; i < segs.length; i++) {
    if (segs[i].c !== 'ŋ') continue;
    segs[i] = { c: 'n' };
    if (segs[i + 1]?.v) segs.splice(i + 1, 0, { c: 'ɡ' });
    note('eng', 'ŋ', 'nɡ');
  }
  if (!segs.some((s) => s.v)) {
    if (!segs.length) return null;
    segs.splice(1, 0, { v: 'i', long: false });
  }
  // Three consonants at the start → prothetic i (strawberry → istroːberi)
  let lead = 0;
  while (segs[lead]?.c) lead++;
  if (lead >= 3) { segs.unshift({ v: 'i', long: false }); note('prothesis', segs[1].c + segs[2].c, 'i' + segs[1].c + segs[2].c); }
  // Break up clusters Arabic syllables can't hold: 4+ consonants inside a word (2 close a
  // syllable, 1 opens the next) or 3+ at the end; an [i] goes in, as Lebanese speakers do
  let start = segs.findIndex((s) => s.v);
  for (let i = start + 1; i <= segs.length; i++) {
    if (i < segs.length && segs[i].c) continue;
    const run = i - start - 1; // consonants between the vowel at `start` and position i
    const final = i === segs.length;
    if ((!final && run >= 4) || (final && run >= 3)) {
      const at = final ? i - 1 : start + 3;
      note('epenthesis', segs[at - 1].c, segs[at - 1].c + 'i');
      segs.splice(at, 0, { v: 'i', long: false });
      i = at;
    }
    start = i;
  }
  return segs;
}
