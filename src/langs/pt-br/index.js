// Brazilian Portuguese ⇄ IPA, text level.

import { wordToPhonemic } from './g2p.js';
import { realizeWord, firstPhone } from './phonology.js';
import { numberToWords } from './numbers.js';
import { adaptWord } from './adapt.js';
import { spellWord } from './spell.js';

const TOKEN_RE = /(\d+)|([\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*)|([^\p{L}\p{M}\d]+)/gu;
const SAME_PHRASE = /^[\s-]*$/; // only spaces / hyphens between words → connected speech

/**
 * Portuguese text → IPA.
 * opts: { casual: boolean, dots: boolean }
 * → [{ type: 'word', src, ipa } | { type: 'text', text }]
 */
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
  for (const it of items) if (it.type === 'word') it.ph = wordToPhonemic(it.spelled, opts);

  const ropts = { reduceFinal: true, glides: true, casual: !!opts.casual, dots: !!opts.dots };
  return items.map((it, k) => {
    if (it.type !== 'word') return it;
    if (!it.ph) return { type: 'text', text: it.src };
    let next = null;
    const gap = items[k + 1];
    if (gap && gap.type === 'text' && SAME_PHRASE.test(gap.text) && items[k + 2]?.type === 'word') next = firstPhone(items[k + 2].ph);
    else if (gap && gap.type === 'word') next = firstPhone(gap.ph);
    return { type: 'word', src: it.src || it.spelled, ipa: realizeWord(it.ph, ropts, next).ipa };
  });
}

const PUNCT_EDGE = /^([¿¡"“«(\[/]*)(.*?)([.,;:!?…"”»)\]/،؛؟]*)$/u;

/**
 * IPA (of any language) → Brazilian Portuguese spelling + Brazilian-adapted IPA.
 * → { tokens: [{ type: 'word', src, spelled, adapted } | { type: 'text', text }], notes }
 */
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
    const ph = core ? adaptWord(core, note, opts) : null;
    if (ph) {
      tokens.push({
        type: 'word', src: core, spelled: spellWord(ph),
        adapted: realizeWord(ph, { reduceFinal: false, glides: false, casual: false, dots: !!opts.dots }).ipa,
      });
    } else if (core) tokens.push({ type: 'text', text: core });
    if (cleanTrail) tokens.push({ type: 'text', text: cleanTrail });
  }
  return { tokens, notes: [...notes.values()] };
}

export const ptBR = {
  code: 'pt-BR',
  speechLang: 'pt-BR',
  toIPA,
  fromIPA,
};
