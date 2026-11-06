// Chinese characters or pinyin → syllables, and syllables → IPA with tone sandhi.

import { charReadings, wordReading, isSyllable } from './dict.js';
import { fromKey, syllableIPA, TONE_LETTERS } from './pinyin.js';

/**
 * A run of Han characters → [{ ch, key }] using the longest known word first
 * (银行 yin2 hang2), otherwise each character's everyday reading.
 */
export function readHan(run) {
  const chars = [...run];
  const out = [];
  for (let i = 0; i < chars.length;) {
    let done = false;
    for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
      const reading = wordReading(chars.slice(i, i + len).join(''));
      if (reading) {
        reading.forEach((key, k) => out.push({ ch: chars[i + k], key }));
        i += len;
        done = true;
        break;
      }
    }
    if (done) continue;
    const r = charReadings(chars[i]);
    out.push({ ch: chars[i], key: r ? r[0] : null });
    i++;
  }
  return out;
}

const TONE_MARKS = { ā: 1, á: 2, ǎ: 3, à: 4, ē: 1, é: 2, ě: 3, è: 4, ī: 1, í: 2, ǐ: 3, ì: 4, ō: 1, ó: 2, ǒ: 3, ò: 4,
  ū: 1, ú: 2, ǔ: 3, ù: 4, ǖ: 1, ǘ: 2, ǚ: 3, ǜ: 4 };
const PLAIN = { ā: 'a', á: 'a', ǎ: 'a', à: 'a', ē: 'e', é: 'e', ě: 'e', è: 'e', ī: 'i', í: 'i', ǐ: 'i', ì: 'i', ō: 'o', ó: 'o',
  ǒ: 'o', ò: 'o', ū: 'u', ú: 'u', ǔ: 'u', ù: 'u', ǖ: 'v', ǘ: 'v', ǚ: 'v', ǜ: 'v', ü: 'v' };

/**
 * Pinyin text ("nǐ hǎo", "ni3hao3", "xiexie") → [{ key, guessed }] or null if it isn't pinyin.
 * Syllables are split by longest match; a missing tone is left neutral and flagged.
 */
export function readPinyin(word) {
  const src = word.normalize('NFC').toLowerCase().replace(/u:/g, 'v');
  let plain = '';
  const tones = [];
  for (const ch of src) {
    if (/[1-5]/.test(ch)) { tones[plain.length - 1] = { digit: Number(ch) }; continue; }
    if (ch === "'" || ch === '’' || ch === '-') { plain += "'"; continue; }
    plain += PLAIN[ch] ?? ch;
    if (TONE_MARKS[ch]) tones[plain.length - 1] = { mark: TONE_MARKS[ch] };
  }
  const out = [];
  for (let i = 0; i < plain.length;) {
    if (plain[i] === "'") { i++; continue; }
    let len = Math.min(6, plain.length - i);
    while (len > 0 && !isSyllable(plain.slice(i, i + len))) len--;
    if (!len) return null;
    let tone = null;
    for (let k = i; k < i + len; k++) {
      const tk = tones[k];
      if (tk?.mark) tone = tk.mark;
      if (tk?.digit && k === i + len - 1) tone = tk.digit;
    }
    out.push({ key: plain.slice(i, i + len) + (tone ?? 5), guessed: tone === null });
    i += len;
  }
  return out;
}

/**
 * IPA for a clause (syllables between punctuation).
 * casual: tone sandhi as spoken — 一 and 不 change tone, 3+3 → 2+3, a non-final 3rd tone is a
 * low "half third" [˨˩], 4+4 → [˥˧]+4. Otherwise the dictionary (citation) tones.
 * → array of IPA strings, one per syllable
 */
export function clauseIPA(syls, opts = {}) {
  const S = syls.map((s) => ({ ...fromKey(s.key), ch: s.ch }));
  const tones = S.map((s) => s.tone);
  if (opts.casual) {
    S.forEach((s, i) => {
      const next = tones[i + 1];
      if (s.ch === '一' && s.key === 'yi1' && next && next !== 5 && !(S[i - 1]?.ch === '第')) tones[i] = next === 4 ? 2 : 4;
      if (s.ch === '不' && s.key === 'bu4' && next === 4) tones[i] = 2;
    });
    for (let i = 0; i < tones.length; i++) {
      if (tones[i] !== 3) continue;
      let j = i;
      while (tones[j + 1] === 3) j++;
      for (let k = i; k < j; k++) tones[k] = 2;
      i = j;
    }
  }
  return S.map((s, i) => {
    let tone = TONE_LETTERS[tones[i]];
    if (opts.casual && tones[i] === 3 && i < S.length - 1) tone = '˨˩';
    if (opts.casual && tones[i] === 4 && tones[i + 1] === 4) tone = '˥˧';
    return syllableIPA(s) + tone;
  });
}
