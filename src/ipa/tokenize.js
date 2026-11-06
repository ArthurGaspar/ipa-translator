// Language-independent IPA tokenizer: splits an IPA string into segments
// (base symbol + diacritics), stress marks and syllable breaks.

const TIE = /[͜͡]/;
const COMBINING = /[̀-ͯ᪰-᫿᷀-᷿]/;
// Modifier letters, plus Chao tone letters (˥ ˦ ˧ ˨ ˩), which attach to the preceding segment
const MODIFIERS = new Set(['ʰ', 'ʱ', 'ʷ', 'ʲ', 'ˠ', 'ˤ', 'ⁿ', 'ˡ', '˞', 'ː', 'ˑ', 'ʼ', 'ˀ', 'ᵊ', 'ᶣ', 'ᵝ', '˥', '˦', '˧', '˨', '˩']);
const SUBSTITUTE = {
  ʧ: 'tʃ', ʤ: 'dʒ', ʦ: 'ts', ʣ: 'dz', ʨ: 'tɕ', ʥ: 'dʑ', ɚ: 'e˞', ɝ: 'ɜ˞', g: 'ɡ', ':': 'ː',
  "'": 'ˈ', 'ˊ': 'ˈ', ε: 'ɛ', ɩ: 'ɪ', φ: 'ɸ', ɼ: 'r', ᵻ: 'ɨ', ᵿ: 'ʊ', ɷ: 'ʊ', ɿ: 'z', ʅ: 'ʐ',
};
const IGNORE = new Set(['‿', '[', ']', '/', '(', ')', '-', '⁽', '⁾', '↗', '↘']);

export function normalizeIPA(s) {
  let out = '';
  for (const ch of s.normalize('NFD')) out += SUBSTITUTE[ch] ?? ch;
  return out;
}

/** → [{ t: 'seg', base, mods[] } | { t: 'stress', level } | { t: 'syl' }] */
export function tokenizeIPA(s) {
  const toks = [];
  let tie = false;
  for (const ch of normalizeIPA(s)) {
    const last = toks[toks.length - 1];
    if (ch === 'ˈ') { toks.push({ t: 'stress', level: 1 }); continue; }
    if (ch === 'ˌ') { toks.push({ t: 'stress', level: 2 }); continue; }
    if (ch === '.') { toks.push({ t: 'syl' }); continue; }
    if (IGNORE.has(ch) || /\s/.test(ch)) continue;
    if (TIE.test(ch)) { tie = true; continue; }
    if (COMBINING.test(ch) || MODIFIERS.has(ch)) {
      if (last && last.t === 'seg') {
        if (ch === '̧' && last.base === 'c') last.base = 'ç'; // NFD split ç
        else last.mods.push(ch);
      }
      continue;
    }
    if (tie && last && last.t === 'seg') { last.base += ch; tie = false; continue; }
    tie = false;
    toks.push({ t: 'seg', base: ch, mods: [] });
  }
  // Untied affricates: tʃ, dʒ, ts, dz (and their retroflex / alveolo-palatal cousins)
  for (let i = 0; i < toks.length - 1; i++) {
    const a = toks[i], b = toks[i + 1];
    if (a.t !== 'seg' || b.t !== 'seg' || a.mods.length) continue;
    if ((a.base === 't' && 'ʃɕʂs'.includes(b.base)) || (a.base === 'd' && 'ʒʑʐz'.includes(b.base))) {
      a.base += b.base;
      a.mods = b.mods;
      toks.splice(i + 1, 1);
    }
  }
  return toks;
}
