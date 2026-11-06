// Spanish (Spain) ⇄ IPA, text level.

import { wordToPhonemic } from './g2p.js';
import { realizeWord, firstPhone, lastPhone } from './phonology.js';
import { numberToWords } from './numbers.js';
import { adaptWord } from './adapt.js';
import { spellWord } from './spell.js';

const TOKEN_RE = /(\d+)|([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)|([^\p{L}\p{M}\d]+)/gu;
const SAME_PHRASE = /^[\s-]*$/;

/** Spanish text → IPA. opts: { casual, dots } */
export function toIPA(text, opts = {}) {
  const items = [];
  for (const m of text.matchAll(TOKEN_RE)) {
    if (m[1]) {
      numberToWords(m[1]).split(' ').forEach((w, k) => {
        if (k) items.push({ type: 'text', text: ' ' });
        items.push({ type: 'word', src: k ? '' : m[1], spelled: w });
      });
    } else if (m[2]) items.push({ type: 'word', src: m[2], spelled: m[2] });
    else items.push({ type: 'text', text: m[3] });
  }
  for (const it of items) if (it.type === 'word') it.ph = wordToPhonemic(it.spelled);
  // Neighbouring word in the same phrase (no punctuation in between)
  const neighbour = (k, dir) => {
    const gap = items[k + dir];
    if (gap?.type === 'word') return gap.ph;
    if (gap?.type === 'text' && SAME_PHRASE.test(gap.text) && items[k + 2 * dir]?.type === 'word') return items[k + 2 * dir].ph;
    return null;
  };
  return items.map((it, k) => {
    if (it.type !== 'word') return it;
    if (!it.ph) return { type: 'text', text: it.src };
    const ctx = { prev: lastPhone(neighbour(k, -1)), next: firstPhone(neighbour(k, 1)) };
    return { type: 'word', src: it.src || it.spelled, ipa: realizeWord(it.ph, opts, ctx) };
  });
}

const PUNCT_EDGE = /^([¿¡"“«(\[/]*)(.*?)([.,;:!?…"”»)\]/،؛؟]*)$/u;

/** IPA (any language) → Spanish spelling + Spanish-adapted IPA. */
export function fromIPA(text, opts = {}) {
  const notes = new Map();
  const note = (key, from = '', to = '') => {
    const id = `${key}|${from}`;
    if (!notes.has(id)) notes.set(id, { key, from, to });
  };
  const tokens = [];
  for (const chunk of text.split(/(\s+)/)) {
    if (!chunk) continue;
    if (/^\s+$/.test(chunk)) { tokens.push({ type: 'text', text: chunk }); continue; }
    if (chunk === '|' || chunk === '‖') { tokens.push({ type: 'text', text: chunk === '|' ? ',' : '.' }); continue; }
    const [, lead, core, trail] = chunk.match(PUNCT_EDGE);
    const cleanLead = lead.replace(/[[\]/]/g, ''), cleanTrail = trail.replace(/[[\]/]/g, '');
    if (cleanLead) tokens.push({ type: 'text', text: cleanLead });
    const ph = core ? adaptWord(core, note) : null;
    if (ph) tokens.push({ type: 'word', src: core, spelled: spellWord(ph), adapted: realizeWord(ph, { dots: !!opts.dots }) });
    else if (core) tokens.push({ type: 'text', text: core });
    if (cleanTrail) tokens.push({ type: 'text', text: cleanTrail });
  }
  return { tokens, notes: [...notes.values()] };
}

export const esES = {
  code: 'es-ES',
  speechLang: 'es-ES',
  toIPA,
  fromIPA,
};
