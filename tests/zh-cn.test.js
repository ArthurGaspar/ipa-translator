import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { zhCN } from '../src/langs/zh-cn/index.js';
import { ptBR } from '../src/langs/pt-br/index.js';

before(() => zhCN.ready());

const join = (tokens, field) => tokens.map((t) => (t.type === 'word' ? t[field] : t.text)).join('');
const ipa = (text, casual = true) => join(zhCN.toIPA(text, { casual }), 'ipa');
const pinyin = (text) => join(zhCN.toIPA(text, { casual: true }), 'alt');
const adapt = (text) => {
  const { tokens } = zhCN.fromIPA(text);
  return [tokens.map((t) => t.spelled ?? t.text).join(''), tokens.map((t) => t.alt ?? t.altText).join('')];
};

test('Mandarin → IPA with tone sandhi', () => {
  assert.equal(ipa('你好！'), 'ni˧˥ xɑʊ˨˩˦!');
  assert.equal(ipa('你好！', false), 'ni˨˩˦ xɑʊ˨˩˦!');
  assert.equal(ipa('我很好'), 'wo˧˥ xən˧˥ xɑʊ˨˩˦');
  assert.equal(ipa('一个人'), 'i˧˥ kɤ˥˩ ʐən˧˥');
  assert.equal(ipa('一起'), 'i˥˩ tɕʰi˨˩˦');
  assert.equal(ipa('不是'), 'pu˧˥ ʂɻ̩˥˩');
  assert.equal(ipa('北京'), 'peɪ˨˩ tɕiŋ˥');
  assert.equal(ipa('吃饭了吗？'), 'ʈʂʰɻ̩˥ fan˥˩ lɤ ma?');
});

test('Mandarin: word readings for characters with several readings', () => {
  assert.equal(pinyin('银行'), 'yín háng');
  assert.equal(pinyin('行人'), 'xíng rén');
  assert.equal(pinyin('长大'), 'zhǎng dà');
  assert.equal(pinyin('音乐'), 'yīn yuè');
});

test('Mandarin: pinyin input and numbers', () => {
  assert.equal(ipa('nǐ hǎo'), 'ni˧˥ xɑʊ˨˩˦');
  assert.equal(ipa('ni3 hao3'), 'ni˧˥ xɑʊ˨˩˦');
  assert.equal(pinyin('25'), 'èr shí wǔ');
  const [tok] = zhCN.toIPA('xie', { casual: true });
  assert.equal(tok.guessed, true); // no tone given
});

test('IPA → Mandarin transliteration', () => {
  assert.deepEqual(adapt('bɛst'), ['贝斯特', 'bèi sī tè']);
  assert.deepEqual(adapt('tɹʌmp'), ['特朗普', 'tè lǎng pǔ']);
  assert.deepEqual(adapt('ˈmaɪkəl'), ['迈克尔', 'mài kè ěr']);
  assert.deepEqual(adapt('ˈstɹɔːbəɹi'), ['斯特罗贝里', 'sī tè luó bèi lǐ']);
  assert.deepEqual(adapt('ni˨˩ xɑʊ˨˩˦'), ['尼豪', 'nǐ hǎo']);
});

test('Mandarin → Portuguese through IPA', () => {
  const ipaText = join(zhCN.toIPA('你好', { casual: true }), 'ipa');
  const { tokens } = ptBR.fromIPA(ipaText);
  assert.ok(tokens.some((t) => t.type === 'word'));
});
