// Language registry. Each language exposes:
//   toIPA(text, opts)   → [{ type: 'word', src, ipa, guessed? } | { type: 'text', text }]
//   fromIPA(text, opts) → { tokens: [{ type: 'word', src, spelled, adapted } | { type: 'text', text }], notes }
//   ready() / isReady() → optional lazy loading of data (dictionaries)
//   speechLang          → BCP-47 tag for speech synthesis

import { ptBR } from './pt-br/index.js';
import { enUS } from './en-us/index.js';
import { esES } from './es-es/index.js';
import { arLB } from './ar-lb/index.js';
import { zhCN } from './zh-cn/index.js';

export const LANGUAGES = {
  [ptBR.code]: ptBR,
  [enUS.code]: enUS,
  [esES.code]: esES,
  [arLB.code]: arLB,
  [zhCN.code]: zhCN,
};
