// Builds data/en-us.txt from the CMU Pronouncing Dictionary.
//
//   node tools/build-en-dict.mjs [path/to/cmudict.dict]
//
// Without a path, the dictionary is downloaded from GitHub (cmusphinx/cmudict).
// Output: one "word<TAB>code" line per word (first pronunciation only), where each
// ARPAbet phoneme is one ASCII character and vowels carry a stress digit
// (see ARPA_CODE below; decoded in src/langs/en-us/dict.js).

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SOURCE = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';

export const ARPA_CODE = {
  AA: 'a', AE: '@', AH: 'A', AO: 'c', AW: 'W', AY: 'Y', EH: 'E', ER: 'R', EY: 'e', IH: 'I', IY: 'i',
  OW: 'o', OY: 'O', UH: 'U', UW: 'u', B: 'b', CH: 'C', D: 'd', DH: 'D', F: 'f', G: 'g', HH: 'h',
  JH: 'J', K: 'k', L: 'l', M: 'm', N: 'n', NG: 'N', P: 'p', R: 'r', S: 's', SH: 'S', T: 't',
  TH: 'T', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'Z',
};

const path = process.argv[2];
const text = path ? await readFile(path, 'utf8') : await (await fetch(SOURCE)).text();

const out = [];
for (const line of text.split('\n')) {
  const clean = line.replace(/#.*$/, '').trim();
  if (!clean) continue;
  const [word, ...phones] = clean.split(/\s+/);
  if (word.includes('(')) continue; // alternative pronunciations
  const code = phones.map((p) => {
    const m = p.match(/^([A-Z]+)([012]?)$/);
    if (!m || !ARPA_CODE[m[1]]) throw new Error(`Unknown phone ${p} in ${word}`);
    return ARPA_CODE[m[1]] + m[2];
  }).join('');
  out.push(`${word}\t${code}`);
}

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/en-us.txt', import.meta.url), out.join('\n') + '\n');
console.log(`Wrote ${out.length} words to data/en-us.txt`);
