// English syllables → General American surface IPA.
//
// syllable = { onset: string[], v: string, stress: 0 | 1 | 2, coda: string[] }
// Everyday-speech (casual) processes: flapping (water → [ˈwɑɾɚ]), t-deletion after n
// (twenty → [ˈtwɛni]), glottal t before syllabic n (button → [ˈbʌʔn̩]).

const VOWEL_START = /^[aeiouæɑɔəɛɪʊʌɝɚ]/;
export const startsWithVowel = (syls) => !!syls?.length && !syls[0].onset.length && VOWEL_START.test(syls[0].v);

export function realizeWord(syls, opts = {}, nextStartsWithVowel = false, func = false) {
  const out = syls.map((s) => ({ onset: [...s.onset], v: s.v, coda: [...s.coda], stress: s.stress }));
  if (opts.casual) {
    out.forEach((s, i) => {
      const prev = out[i - 1];
      if (!prev || !prev.v || s.stress === 1 || s.onset.length !== 1) return;
      const c = s.onset[0];
      const prevOK = !prev.coda.length || (prev.coda.length === 1 && prev.coda[0] === 'ɹ');
      const afterN = prev.coda.length === 1 && prev.coda[0] === 'n';
      const last = i === out.length - 1;
      if (c === 't' && last && s.v === 'ə' && s.coda.length === 1 && s.coda[0] === 'n' && (prevOK || afterN)) {
        s.onset = ['ʔ']; s.v = ''; s.coda = ['n̩']; // button
      } else if ((c === 't' || c === 'd') && prevOK) s.onset = ['ɾ']; // water, ladder
      else if (c === 't' && afterN && s.stress === 0) s.onset = []; // twenty, winter
    });
    // Word-final t/d before a vowel-initial word: "get it" → [ɡɛɾ ɪt]
    const last = out[out.length - 1];
    const fc = last.coda[last.coda.length - 1];
    if (nextStartsWithVowel && last.coda.length === 1 && (fc === 't' || fc === 'd')) last.coda[0] = 'ɾ';
  }
  const marks = out.length > 1 && !func;
  return out.map((s, i) => {
    const mark = marks && s.stress === 1 ? 'ˈ' : marks && s.stress === 2 ? 'ˌ' : i > 0 && opts.dots ? '.' : '';
    return mark + s.onset.join('') + s.v + s.coda.join('');
  }).join('');
}
