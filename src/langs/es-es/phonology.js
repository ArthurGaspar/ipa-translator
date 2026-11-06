// Spanish phonemic syllables → surface IPA (generic peninsular Spanish).
//
// - b d g are stops after a pause, after a nasal (and d after l); elsewhere [β ð ɣ]
// - n takes the place of the next consonant: [m] before p b m, [ɱ] before f, [ŋ] before k g x
// - s is voiced [z] before a voiced consonant (mismo [ˈmizmo])
// - R (rr, initial r) is the trill [r]
// Everyday speech (casual): -ado → [ˈao] (cansado [kanˈsao]), final -d dropped (Madrid [maˈðɾi]).

const VOICED = new Set(['b', 'd', 'ɡ', 'm', 'n', 'ɲ', 'l', 'ɾ', 'R', 'ʝ', 'w', 'j']);
const NASALS = new Set(['m', 'n', 'ɲ']);
const SOFT = { b: 'β', d: 'ð', ɡ: 'ɣ' };

export function firstPhone(word) {
  if (!word || word.raw) return null;
  const s = word.syls[0];
  return s.onset[0] || s.nuc.v;
}
export function lastPhone(word) {
  if (!word || word.raw) return null;
  const s = word.syls[word.syls.length - 1];
  return s.coda[s.coda.length - 1] || (s.off ? s.off.g : s.nuc.v);
}

/** ctx: { prev, next } = neighbouring phones in the same phrase (null at a pause). */
export function realizeWord(word, opts = {}, ctx = {}) {
  if (word.raw) return word.raw;
  const S = word.syls.map((s) => ({ ...s, onset: [...s.onset], coda: [...s.coda], off: s.off && { ...s.off } }));
  const n = S.length;
  if (opts.casual) {
    const last = S[n - 1], pen = S[n - 2];
    if (last.coda[last.coda.length - 1] === 'd' && last.coda.length === 1) last.coda.pop(); // Madrid, verdad
    if (pen && pen.stress && pen.nuc.v === 'a' && !pen.off && !pen.coda.length && last.onset.length === 1 && last.onset[0] === 'd'
      && last.nuc.v === 'o' && !last.off && last.coda.every((c) => c === 's')) last.onset = []; // cansado → cansao
  }
  // Flatten to a phone list so each phone can see its neighbours
  const segs = [];
  S.forEach((s, si) => {
    s.onset.forEach((p) => segs.push({ p, si, part: 'onset' }));
    segs.push({ p: s.nuc.v, si, part: 'nuc' });
    if (s.off) segs.push({ p: s.off.g, si, part: 'off' });
    s.coda.forEach((p) => segs.push({ p, si, part: 'coda' }));
  });
  const out = S.map(() => '');
  segs.forEach((seg, k) => {
    const prev = k ? segs[k - 1].p : ctx.prev ?? null;
    const next = k < segs.length - 1 ? segs[k + 1].p : ctx.next ?? null;
    let r = seg.p;
    if (SOFT[r]) {
      const stop = prev === null || NASALS.has(prev) || (r === 'd' && prev === 'l');
      if (!stop) r = SOFT[r];
    } else if (r === 'R' || (r === 'ɾ' && k === 0)) r = 'r';
    else if (r === 'n' && seg.part === 'coda') {
      if (['p', 'b', 'm'].includes(next)) r = 'm';
      else if (next === 'f') r = 'ɱ';
      else if (['k', 'ɡ', 'x'].includes(next)) r = 'ŋ';
    } else if (r === 's' && seg.part === 'coda' && VOICED.has(next)) r = 'z';
    out[seg.si] += r;
  });
  const marks = n > 1 && !word.clitic;
  return out.map((s, i) => (marks && S[i].stress ? 'ˈ' : i > 0 && opts.dots ? '.' : '') + s).join('');
}
