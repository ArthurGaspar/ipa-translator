// Builds data/zh-cn.txt from mozillazg/pinyin-data and mozillazg/phrase-pinyin-data (MIT).
//
//   node tools/build-zh-dict.mjs [pinyin.txt] [phrases.txt]
//
// Output lines, tone-numbered pinyin (5 = neutral, v = ü):
//   字<TAB>reading1,reading2…   readings of a character, the everyday default first
//   词语<TAB>syl syl…           only words whose reading differs from their characters' defaults
// Tone sandhi (一, 不, 3+3) is applied at runtime, so 一 and 不 are stored with their base tones.

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const CHARS_URL = 'https://raw.githubusercontent.com/mozillazg/pinyin-data/master/pinyin.txt';
const PHRASES_URL = 'https://raw.githubusercontent.com/mozillazg/phrase-pinyin-data/master/pinyin.txt';
const load = async (path, url) => (path ? readFile(path, 'utf8') : (await fetch(url)).text());

// Everyday default reading for common characters with several readings
const DEFAULTS = {
  长: 'chang2', 得: 'de5', 地: 'de5', 着: 'zhe5', 都: 'dou1', 还: 'hai2', 了: 'le5', 的: 'de5', 吗: 'ma5',
  呢: 'ne5', 吧: 'ba5', 么: 'me5', 们: 'men5', 个: 'ge4', 和: 'he2', 为: 'wei4', 没: 'mei2', 只: 'zhi3',
  便: 'bian4', 处: 'chu4', 少: 'shao3', 好: 'hao3', 要: 'yao4', 种: 'zhong3', 行: 'xing2', 乐: 'le4',
  觉: 'jue2', 发: 'fa1', 干: 'gan4', 看: 'kan4', 数: 'shu4', 分: 'fen1', 中: 'zhong1', 相: 'xiang1', 大: 'da4',
  说: 'shuo1', 会: 'hui4', 过: 'guo4', 子: 'zi3', 儿: 'er2', 上: 'shang4', 下: 'xia4', 一: 'yi1', 不: 'bu4',
  重: 'zhong4', 只: 'zhi3', 啊: 'a5', 呀: 'ya5', 哪: 'na3', 那: 'na4', 喝: 'he1', 教: 'jiao1', 角: 'jiao3',
  调: 'diao4', 少: 'shao3', 差: 'cha4', 空: 'kong1', 难: 'nan2', 朝: 'chao2', 传: 'chuan2', 似: 'si4',
};

const MARKS = { ā: 'a1', á: 'a2', ǎ: 'a3', à: 'a4', ē: 'e1', é: 'e2', ě: 'e3', è: 'e4', ī: 'i1', í: 'i2', ǐ: 'i3', ì: 'i4',
  ō: 'o1', ó: 'o2', ǒ: 'o3', ò: 'o4', ū: 'u1', ú: 'u2', ǔ: 'u3', ù: 'u4', ǖ: 'v1', ǘ: 'v2', ǚ: 'v3', ǜ: 'v4', ü: 'v0',
  ń: 'n2', ň: 'n3', ǹ: 'n4', ḿ: 'm2' };

/** "xíng" → "xing2", "de" → "de5" */
function numbered(syl) {
  let tone = 5;
  let out = '';
  for (const ch of syl.normalize('NFC')) {
    const m = MARKS[ch];
    if (m) { out += m[0]; if (m[1] !== '0') tone = Number(m[1]); } else out += ch;
  }
  return /^[a-zv]+$/.test(out) ? out + tone : null;
}

const [charsText, phrasesText] = await Promise.all([load(process.argv[2], CHARS_URL), load(process.argv[3], PHRASES_URL)]);

const chars = new Map();
for (const line of charsText.split('\n')) {
  const m = line.match(/^U\+([0-9A-F]+):\s*([^#]+?)\s*#/);
  if (!m) continue;
  const cp = parseInt(m[1], 16);
  if (!((cp >= 0x4E00 && cp <= 0x9FFF) || (cp >= 0x3400 && cp <= 0x4DBF))) continue;
  const ch = String.fromCodePoint(cp);
  let readings = [...new Set(m[2].split(',').map((s) => numbered(s.trim())).filter(Boolean))];
  if (!readings.length) continue;
  const def = DEFAULTS[ch];
  if (def) readings = [def, ...readings.filter((r) => r !== def)];
  chars.set(ch, readings);
}

const base = (ch, r) => (ch === '一' ? 'yi1' : ch === '不' ? 'bu4' : r);
const phrases = [];
for (const line of phrasesText.split('\n')) {
  const m = line.match(/^([^#:\s]+):\s*(.+)$/);
  if (!m) continue;
  const word = [...m[1]];
  if (word.length < 2 || word.length > 4 || !word.every((c) => chars.has(c))) continue;
  const syls = m[2].trim().split(/\s+/).map(numbered);
  if (syls.length !== word.length || syls.some((s) => !s)) continue;
  const reading = syls.map((s, i) => base(word[i], s));
  if (reading.every((s, i) => s === chars.get(word[i])[0])) continue; // nothing to add
  phrases.push(`${m[1]}\t${reading.join(' ')}`);
}

const out = [...[...chars].map(([c, r]) => `${c}\t${r.join(',')}`), ...phrases];
await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(new URL('../data/zh-cn.txt', import.meta.url), out.join('\n') + '\n');
console.log(`Wrote ${chars.size} characters and ${phrases.length} words to data/zh-cn.txt`);
