// Lebanese Arabic phonology shared by both directions.
//
// A word is a list of segments: { c } consonants (emphatics written tˤ dˤ sˤ zˤ ðˤ,
// geminates as two identical consonants) and { v, long, stress? } vowels (a e i o u).

import { tokenizeIPA } from '../../ipa/tokenize.js';

export const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);
const EMPHATIC = { t: 'tˤ', d: 'dˤ', s: 'sˤ', z: 'zˤ', ð: 'ðˤ' };

/** IPA already in the Lebanese inventory (lexicon entries, numbers) → segments. */
export function parseIPA(str) {
  const segs = [];
  let stress = false;
  for (const t of tokenizeIPA(str)) {
    if (t.t === 'stress') { if (t.level === 1) stress = true; continue; }
    if (t.t !== 'seg') continue;
    const long = t.mods.includes('ː');
    if (VOWELS.has(t.base)) { segs.push({ v: t.base, long, stress }); stress = false; continue; }
    const c = t.mods.includes('ˤ') && EMPHATIC[t.base] ? EMPHATIC[t.base] : t.base;
    segs.push({ c });
    if (long) segs.push({ c });
  }
  return segs;
}

/** Segments → syllables { onset[], v, long, coda[], stress }. One consonant goes to the next onset. */
export function syllabify(segs) {
  const syls = [];
  let cl = [];
  let cur = null;
  for (const s of segs) {
    if (s.c) { cl.push(s.c); continue; }
    let onset = cl;
    if (cur && cl.length >= 2) { cur.coda.push(...cl.slice(0, -1)); onset = cl.slice(-1); }
    cur = { onset, v: s.v, long: !!s.long, coda: [], stress: !!s.stress };
    syls.push(cur);
    cl = [];
  }
  if (!cur) return cl.length ? [{ onset: cl, v: '', long: false, coda: [], stress: true }] : [];
  cur.coda.push(...cl);
  return syls;
}

/**
 * Levantine stress: a final superheavy syllable (CVVC, CVCC) is stressed; otherwise a heavy
 * penult (CVV, CVC); otherwise the antepenult (madrase → [ˈmadrase]).
 */
export function assignStress(syls) {
  const n = syls.length;
  if (!n) return syls;
  const given = syls.findIndex((s) => s.stress);
  const weight = (s) => (s.long ? 1 : 0) + s.coda.length;
  let si = given;
  if (si < 0) {
    if (n === 1) si = 0;
    else if (weight(syls[n - 1]) >= 2) si = n - 1;
    else if (weight(syls[n - 2]) >= 1) si = n - 2;
    else si = n >= 3 ? n - 3 : n - 2;
  }
  syls.forEach((s, i) => { s.stress = i === si; });
  return syls;
}

export function sylsToIPA(syls, opts = {}, func = false) {
  const marks = syls.length > 1 && !func;
  return syls.map((s, i) => {
    const mark = marks && s.stress ? 'ˈ' : i > 0 && opts.dots ? '.' : '';
    return mark + s.onset.join('') + s.v + (s.long ? 'ː' : '') + s.coda.join('');
  }).join('');
}

/** Flatten syllables back to segments (keeps stress on the vowel). */
export function sylsToSegs(syls) {
  const segs = [];
  for (const s of syls) {
    s.onset.forEach((c) => segs.push({ c }));
    if (s.v) segs.push({ v: s.v, long: s.long, stress: s.stress });
    s.coda.forEach((c) => segs.push({ c }));
  }
  return segs;
}
