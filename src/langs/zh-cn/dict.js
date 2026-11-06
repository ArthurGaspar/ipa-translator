// Character and word readings (data/zh-cn.txt, built by tools/build-zh-dict.mjs).
// Loaded lazily the first time Mandarin is used.

const DATA_URL = new URL('../../../data/zh-cn.txt', import.meta.url);
let chars = null; // 字 → ['xing2', 'hang2', …] (everyday default first)
let words = null; // 词语 → ['yin2', 'hang2']
let syllables = null; // every toneless syllable that exists ('xing', 'lv', …)
let loading = null;

export const isReady = () => !!chars;

export function loadDict() {
  if (chars) return Promise.resolve();
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
    const c = new Map(), w = new Map(), s = new Set();
    for (const line of text.split('\n')) {
      const tab = line.indexOf('\t');
      if (tab < 0) continue;
      const key = line.slice(0, tab), val = line.slice(tab + 1);
      if ([...key].length === 1) {
        const readings = val.split(',');
        c.set(key, readings);
        for (const r of readings) s.add(r.slice(0, -1));
      } else w.set(key, val.split(' '));
    }
    chars = c; words = w; syllables = s;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

export const charReadings = (ch) => chars?.get(ch);
export const wordReading = (w) => words?.get(w);
export const isSyllable = (s) => !!syllables?.has(s);

let bySyllable = null;
/** Some character read with this toneless syllable (used when no transliteration character is listed). */
export function charForSyllable(syl) {
  if (!bySyllable) {
    bySyllable = new Map();
    for (const [ch, readings] of chars ?? []) {
      const cp = ch.codePointAt(0);
      if (cp < 0x4E00 || cp > 0x9FA5) continue; // prefer the core CJK block
      for (const r of readings) if (!bySyllable.has(r.slice(0, -1))) bySyllable.set(r.slice(0, -1), ch);
    }
  }
  return bySyllable.get(syl) ?? null;
}
