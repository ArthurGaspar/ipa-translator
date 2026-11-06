// Lebanese Arabic syllables → Arabic script with full vowel marks, and → Arabizi
// (the Latin "chat" spelling used every day in Lebanon: 2 = ء, 3 = ع, 7 = ح).

import { sylsToSegs } from './phon.js';

const LETTER = {
  b: 'ب', p: 'پ', t: 'ت', d: 'د', tˤ: 'ط', dˤ: 'ض', k: 'ك', ɡ: 'گ', q: 'ق', f: 'ف', v: 'ڤ', θ: 'ث', ð: 'ذ',
  ðˤ: 'ظ', s: 'س', z: 'ز', sˤ: 'ص', zˤ: 'ظ', ʃ: 'ش', ʒ: 'ج', x: 'خ', ɣ: 'غ', ħ: 'ح', ʕ: 'ع', h: 'ه', m: 'م',
  n: 'ن', l: 'ل', ɫ: 'ل', r: 'ر', w: 'و', j: 'ي', tʃ: 'تش', dʒ: 'دج',
};
const HARAKA = { a: 'َ', e: 'ِ', i: 'ِ', o: 'ُ', u: 'ُ' };
const MATER = { a: 'ا', e: 'ي', i: 'ي', o: 'و', u: 'و' };
const SUKUN = 'ْ';
const SHADDA = 'ّ';

/** Hamza seat chosen from the neighbouring vowels. */
function hamza(prevV, nextV, initial) {
  const front = (v) => v === 'i' || v === 'e';
  const round = (v) => v === 'u' || v === 'o';
  if (initial) return front(nextV) ? 'إ' : 'أ';
  if (front(nextV) || front(prevV)) return 'ئ';
  if (round(nextV) || round(prevV)) return 'ؤ';
  return nextV ? 'أ' : 'ء';
}

export function spellArabic(syls) {
  const segs = sylsToSegs(syls);
  let out = '';
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], prev = segs[i - 1], next = segs[i + 1];
    const last = i === segs.length - 1;
    if (s.c) {
      const gem = next?.c === s.c;
      const after = gem ? segs[i + 2] : next;
      out += s.c === 'ʔ' ? hamza(prev?.v, after?.v, i === 0) : LETTER[s.c] ?? s.c;
      if (gem) { out += SHADDA; i++; }
      if (!after?.v && !(gem ? i === segs.length - 1 : last)) out += SUKUN;
      continue;
    }
    // vowel
    if (i === 0) out += s.v === 'i' || s.v === 'e' ? 'إ' : 'أ'; // a word-initial vowel sits on an alif
    else if (prev?.v) { out += MATER[s.v]; continue; } // vowel after vowel (loanwords: فيديو)
    out += HARAKA[s.v];
    // Long and final vowels, and stressed vowels in open syllables, get a letter (ا و ي), as in loanwords
    const glideNext = (next?.c === 'w' && 'ou'.includes(s.v)) || (next?.c === 'j' && 'ei'.includes(s.v));
    const openSyl = !next || !!next.v || !!segs[i + 2]?.v;
    if (!glideNext && (s.long || last || (s.stress && openSyl))) out += MATER[s.v];
  }
  return out;
}

const LATIN = {
  ʔ: '2', ʕ: '3', ħ: '7', x: 'kh', ɣ: 'gh', ʃ: 'ch', ʒ: 'j', θ: 'th', ð: 'dh', sˤ: 's', dˤ: 'd', tˤ: 't',
  zˤ: 'z', ðˤ: 'z', j: 'y', ɫ: 'l', tʃ: 'tch', dʒ: 'dj', ɡ: 'g', q: 'q',
};

export function spellArabizi(syls) {
  const segs = sylsToSegs(syls);
  return segs.map((s, i) => {
    if (s.v) return s.v;
    if (i === 0 && s.c === 'ʔ') return ''; // initial hamza isn't written (ana, inta)
    return LATIN[s.c] ?? s.c;
  }).join('');
}
