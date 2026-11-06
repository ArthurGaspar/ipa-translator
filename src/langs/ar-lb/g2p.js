// Arabic script → segments, read with a Lebanese accent (or standard Arabic when casual is off).
//
// Vowel marks (ḥarakāt) are read exactly. Without them, everyday words come from the lexicon
// and other words get guessed short vowels (the result is flagged as guessed).

import { LEXICON, normalize } from './lexicon.js';
import { parseIPA } from './phon.js';

const LETTERS = {
  ب: 'b', ت: 't', ث: 'θ', ج: 'dʒ', ح: 'ħ', خ: 'x', د: 'd', ذ: 'ð', ر: 'r', ز: 'z', س: 's', ش: 'ʃ',
  ص: 'sˤ', ض: 'dˤ', ط: 'tˤ', ظ: 'ðˤ', ع: 'ʕ', غ: 'ɣ', ف: 'f', ق: 'q', ك: 'k', ک: 'k', ل: 'l', م: 'm',
  ن: 'n', ه: 'h', ء: 'ʔ', أ: 'ʔ', إ: 'ʔ', ؤ: 'ʔ', ئ: 'ʔ', پ: 'p', ڤ: 'v', ڥ: 'v', گ: 'ɡ', ڭ: 'ɡ', چ: 'tʃ',
  و: 'w', ي: 'j', ی: 'j',
};
const MARKS = { 'َ': 'a', 'ِ': 'i', 'ُ': 'u', 'ْ': '0', 'ً': 'an', 'ٍ': 'in', 'ٌ': 'un' };
const SHADDA = 'ّ';
const DAGGER_ALIF = 'ٰ';
// Sun letters assimilate the l of the article: الشمس → [iʃˈʃams]
const SUN = new Set(['t', 'θ', 'd', 'ð', 'r', 'z', 's', 'ʃ', 'sˤ', 'dˤ', 'tˤ', 'ðˤ', 'l', 'n']);
// After these, Lebanese final ة stays [a]; elsewhere it's [e]
const BACK = new Set(['ħ', 'ʕ', 'x', 'ɣ', 'q', 'ʔ', 'sˤ', 'dˤ', 'tˤ', 'ðˤ', 'zˤ', 'r', 'h']);
const LEBANESE = { q: 'ʔ', θ: 't', ð: 'd', ðˤ: 'dˤ', dʒ: 'ʒ' };

/** Split a word into letters with their marks. */
function letters(w) {
  const out = [];
  for (const ch of w) {
    const last = out[out.length - 1];
    if (MARKS[ch]) { if (last) last.mark = MARKS[ch]; continue; }
    if (ch === SHADDA) { if (last) last.shadda = true; continue; }
    if (ch === DAGGER_ALIF) { if (last) last.dagger = true; continue; }
    if (ch === 'ـ') continue; // tatweel
    out.push({ ch });
  }
  return out;
}

/** Read one word (no lexicon) → { segs, guessed } */
function readRules(w) {
  const L = letters(w);
  const items = []; // { c, v: null | '' | 'a' | 'i' | 'u', long, gem, tan, tm }
  let guessed = false;
  L.forEach((x, k) => {
    const cur = items[items.length - 1];
    const next = L[k + 1];
    const ch = x.ch;
    if (ch === 'ا' || ch === 'ٱ') {
      if (k === 0) {
        if (ch === 'ٱ') return;
        items.push({ c: 'ʔ', v: x.mark && x.mark !== '0' ? x.mark[0] : null });
        return;
      }
      if (cur && cur.tan) return; // the alif carrying -an (شكراً)
      if (cur) Object.assign(cur, { v: 'a', long: true, explicit: true });
      if (x.mark === 'an' && cur) Object.assign(cur, { long: false, tan: true });
      return;
    }
    if (ch === 'آ') { items.push({ c: 'ʔ', v: 'a', long: true, explicit: true }); return; }
    if (ch === 'ى') { if (cur) Object.assign(cur, { v: 'a', long: true, explicit: true }); return; }
    if (ch === 'ة') { if (cur) Object.assign(cur, { v: 'a', tm: true, explicit: true }); return; }
    if (ch === 'ي' && next?.ch === 'ة' && k > 0 && cur && !x.mark) { // nisba ending -iyya (عربية)
      if (cur.v === null) cur.v = 'i';
      items.push({ c: 'j', v: null, gem: true });
      return;
    }
    if ((ch === 'و' || ch === 'ي') && k > 0 && cur && !x.mark && !x.shadda && !cur.long && next?.ch !== 'ة') {
      const own = ch === 'و' ? 'u' : 'i';
      const beforeAlif = next && next.ch === 'ا';
      if (cur.v === own || (cur.v === null && !beforeAlif && cur.c !== 'ʔ')) {
        Object.assign(cur, { v: own, long: true, explicit: true });
        return;
      }
    }
    const c = LETTERS[ch];
    if (!c) return;
    const item = { c, v: null, gem: !!x.shadda };
    if (x.mark) {
      if (x.mark === '0') item.v = '';
      else if (x.mark.length === 2) Object.assign(item, { v: x.mark[0], tan: x.mark === 'an' });
      else item.v = x.mark;
      item.explicit = true;
    }
    if (x.dagger) Object.assign(item, { v: 'a', long: true });
    items.push(item);
  });
  // Unmarked short vowels: the last consonant has none; runs alternate a / none (kalb, madrasa)
  const last = items.length - 1;
  let run = 0;
  items.forEach((it, k) => {
    if (it.v !== null) { run = 0; return; }
    if (k === last) { it.v = ''; return; }
    // between a long vowel and a vowelled consonant: no vowel (طاولة → tˤaːwle)
    const prevLong = items[k - 1]?.long, nextVowelled = items[k + 1]?.v && k + 1 !== last;
    if (run === 0 && prevLong && nextVowelled) { it.v = ''; run++; guessed = true; return; }
    it.v = run % 2 === 0 ? 'a' : '';
    run++;
    guessed = true;
  });
  const segs = [];
  items.forEach((it, k) => {
    segs.push({ c: it.c });
    if (it.gem) segs.push({ c: it.c });
    if (!it.v) return;
    // Pausal form: final short case vowels and -in/-un are dropped; -an is kept (شكراً)
    if (k === last && !it.long && !it.tm && !it.tan) return;
    segs.push({ v: it.v, long: !!it.long, tm: it.tm });
    if (it.tan && it.v === 'a') segs.push({ c: 'n' });
  });
  return { segs, guessed };
}

/** Lebanese everyday pronunciation of a rule-read word. */
function lebanize(segs) {
  const out = segs.map((s) => (s.c && LEBANESE[s.c] ? { c: LEBANESE[s.c] } : { ...s }));
  for (let i = 0; i < out.length; i++) {
    const s = out[i], g = out[i + 1], after = out[i + 2];
    // ay / aw before a consonant or at the end → [eː] / [oː] (bayt → beːt, yawm → joːm)
    if (s.v === 'a' && !s.long && g && (g.c === 'j' || g.c === 'w') && (!after || after.c) && !(after && after.c === g.c)) {
      out.splice(i, 2, { v: g.c === 'j' ? 'e' : 'o', long: true });
    }
    // ة → [e] (or [a] after back consonants)
    if (s.tm) out[i] = { v: BACK.has(out[i - 1]?.c) ? 'a' : 'e' };
  }
  // Final long vowels are short in speech
  const lastSeg = out[out.length - 1];
  if (lastSeg?.v && lastSeg.long && out.filter((s) => s.v).length > 1) lastSeg.long = false;
  return out;
}

const fromLexicon = (key) => (LEXICON.has(key) ? parseIPA(LEXICON.get(key)) : null);
// Words written with vowel marks are read exactly as marked, never replaced by the vocabulary
const hasVowelMarks = (w) => /[ً-ِْ]/.test(w);

/** Read a bare word (no prefixes) → { segs, guessed } */
function readStem(word, casual) {
  if (casual && !hasVowelMarks(word)) {
    const lex = fromLexicon(normalize(word));
    if (lex) return { segs: lex, guessed: false };
  }
  const r = readRules(word);
  return { segs: casual ? lebanize(r.segs) : r.segs.map((s) => (s.tm ? { v: 'a' } : s)), guessed: r.guessed };
}

/**
 * One Arabic word → { segs, guessed }.
 * Handles the prefixes و ف (and), ب ك ل (+ article) and the article ال.
 */
export function readWord(word, casual = true) {
  const plain = normalize(word);
  const marked = hasVowelMarks(word);
  if (casual && !marked && LEXICON.has(plain)) return { segs: fromLexicon(plain), guessed: false };
  // (و|ف)? then (ب|ك|ل)? + ال, or لل (li + article)
  const m = plain.match(/^([وف]?)(?:([بكل]?)ال|(ل)ل)(.{2,})$/);
  if (m) {
    const conj = m[1], prep = m[2] || m[3] || '', rest = m[4];
    // Find where the stem starts in the original (marked) word: skip the prefix letters
    let skip = conj.length + (m[3] ? 2 : prep.length + 2);
    let idx = 0;
    const chars = [...word];
    while (skip > 0 && idx < chars.length) { if (!/[ً-ٰٟـ]/.test(chars[idx])) skip--; idx++; }
    while (idx < chars.length && /[ً-ٰٟـ]/.test(chars[idx])) idx++;
    const stem = readStem(chars.slice(idx).join('') || rest, casual);
    const segs = [];
    if (conj) segs.push({ c: conj === 'و' ? 'w' : 'f' });
    if (prep) segs.push({ c: { ب: 'b', ك: 'k', ل: 'l' }[prep] });
    const first = stem.segs[0];
    const sun = first?.c && SUN.has(first.c);
    if (casual) segs.push({ v: 'i' }); else if (!conj && !prep) segs.push({ c: 'ʔ' }, { v: 'a' }); else segs.push({ v: 'a' });
    if (!sun) segs.push({ c: 'l' });
    else if (stem.segs[1]?.c !== first.c) segs.push({ c: first.c }); // ash-shams (unless the shadda is written)
    segs.push(...stem.segs);
    return { segs, guessed: stem.guessed, article: true };
  }
  // و / ف + a known word (وانت → w inta)
  if (casual && !marked && /^[وف]/.test(plain) && LEXICON.has(plain.slice(1))) {
    const stem = fromLexicon(plain.slice(1));
    if (stem[0]?.c === 'ʔ') stem.shift(); // w inta, not w ʔinta
    return { segs: [{ c: plain[0] === 'و' ? 'w' : 'f' }, ...stem], guessed: false };
  }
  return readStem(word, casual);
}
