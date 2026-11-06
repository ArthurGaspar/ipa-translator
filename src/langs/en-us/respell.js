// English syllables → pronunciation respelling in the style English dictionaries
// and Wikipedia use for foreign words: bonjour → bawn-ZHOOR, Rio → HEE-oo.
// Syllables are hyphenated and the stressed one is in capitals.

const CONS = { tʃ: 'ch', dʒ: 'j', ʃ: 'sh', ʒ: 'zh', θ: 'th', ð: 'dh', ŋ: 'ng', j: 'y', ɡ: 'g', ɹ: 'r', ʔ: '', ɾ: 'd' };
const CHECKED = new Set(['ɪ', 'ɛ', 'æ', 'ʌ', 'ʊ']); // vowels that need a following consonant in English
const VOWEL = {
  i: 'ee', ɪ: 'ih', eɪ: 'ay', ɛ: 'eh', æ: 'a', ɑ: 'ah', ɔ: 'aw', oʊ: 'oh', ʊ: 'uu', u: 'oo',
  ʌ: 'uh', ə: 'uh', aɪ: 'y', aʊ: 'ow', ɔɪ: 'oy', ɝ: 'ur', ɚ: 'er',
};
const CLOSED = { ɪ: 'i', ɛ: 'e', ʌ: 'u' };
const R_VOWEL = { ɑ: 'ar', ɔ: 'or', oʊ: 'or', ɛ: 'air', eɪ: 'air', æ: 'arr', ɪ: 'eer', i: 'eer', ʊ: 'oor', u: 'oor', aɪ: 'ire', aʊ: 'our', ʌ: 'ur', ə: 'er' };

const cons = (c) => CONS[c] ?? c;

export function respellWord(syls) {
  // Move a consonant back after checked vowels: city → SIT-ee, better → BET-er
  const S = syls.map((s) => ({ ...s, onset: [...s.onset], coda: [...s.coda] }));
  for (let i = 0; i < S.length - 1; i++) {
    const s = S[i], nx = S[i + 1];
    if (CHECKED.has(s.v) && !s.coda.length && nx.onset.length && nx.onset[0] !== 'j' && nx.onset[0] !== 'w') {
      s.coda.push(nx.onset.shift());
    }
  }
  const multi = S.length > 1;
  return S.map((s) => {
    let coda = [...s.coda];
    let v;
    if (coda[0] === 'ɹ' && R_VOWEL[s.v]) { v = R_VOWEL[s.v]; coda.shift(); }
    else if (s.v === 'aɪ' && coda.length === 1 && coda[0] !== 'ɹ') { v = 'i'; coda = [coda[0], 'e']; } // mine, bike
    else if (s.v === 'aɪ') v = !s.onset.length && !coda.length ? 'eye' : coda.length ? 'igh' : 'y';
    else v = (coda.length && CLOSED[s.v]) || VOWEL[s.v] || s.v;
    const onset = s.onset.map(cons).join('');
    const text = onset + v + coda.map(cons).join('');
    return multi && s.stress === 1 ? text.toUpperCase() : text;
  }).join('-');
}
