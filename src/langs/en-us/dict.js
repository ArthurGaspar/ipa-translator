// CMU Pronouncing Dictionary access (data/en-us.txt, built by tools/build-en-dict.mjs).
// Loaded lazily the first time English is used.

const DATA_URL = new URL('../../../data/en-us.txt', import.meta.url);
let dict = null;
let loading = null;

export const isReady = () => !!dict;

export function loadDict() {
  if (dict) return Promise.resolve();
  loading ??= (async () => {
    let text;
    if (typeof window === 'undefined') {
      const { readFile } = await import('node:fs/promises');
      text = await readFile(DATA_URL, 'utf8');
    } else {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Dictionary request failed: ${res.status}`);
      text = await res.text();
    }
    const m = new Map();
    for (const line of text.split('\n')) {
      const tab = line.indexOf('\t');
      if (tab > 0) m.set(line.slice(0, tab), line.slice(tab + 1));
    }
    dict = m;
  })();
  loading.catch(() => { loading = null; }); // allow a retry
  return loading;
}

export const lookup = (word) => dict?.get(word);

// One character per phoneme; vowels are followed by a stress digit (0 none, 1 primary, 2 secondary).
const VOWELS = { a: 'ɑ', '@': 'æ', A: 'ʌ', c: 'ɔ', W: 'aʊ', Y: 'aɪ', E: 'ɛ', R: 'ɝ', e: 'eɪ', I: 'ɪ', i: 'i', o: 'oʊ', O: 'ɔɪ', U: 'ʊ', u: 'u' };
const CONSONANTS = {
  b: 'b', C: 'tʃ', d: 'd', D: 'ð', f: 'f', g: 'ɡ', h: 'h', J: 'dʒ', k: 'k', l: 'l', m: 'm', n: 'n', N: 'ŋ',
  p: 'p', r: 'ɹ', s: 's', S: 'ʃ', t: 't', T: 'θ', v: 'v', w: 'w', j: 'j', z: 'z', Z: 'ʒ',
};

/** Code string → [{ p, v: true, stress } | { p, v: false }] */
export function decode(code) {
  const out = [];
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (VOWELS[ch]) {
      const stress = /\d/.test(code[i + 1] || '') ? Number(code[++i]) : 0;
      let p = VOWELS[ch];
      if (stress === 0 && ch === 'A') p = 'ə';
      if (stress === 0 && ch === 'R') p = 'ɚ';
      out.push({ p, v: true, stress });
    } else if (CONSONANTS[ch]) out.push({ p: CONSONANTS[ch], v: false });
  }
  return out;
}
