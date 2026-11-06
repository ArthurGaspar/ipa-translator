import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { enUS } from '../src/langs/en-us/index.js';
import { ptBR } from '../src/langs/pt-br/index.js';

before(() => enUS.ready());

const ipa = (text, casual = true) => enUS.toIPA(text, { casual }).map((t) => t.ipa ?? t.text).join('');
const respell = (text) => {
  const { tokens } = enUS.fromIPA(text);
  return [tokens.map((t) => t.spelled ?? t.text).join(''), tokens.map((t) => t.adapted ?? t.text).join('')];
};

test('English → IPA (General American)', () => {
  const cases = {
    water: 'ˈwɑɾɚ', city: 'ˈsɪɾi', twenty: 'ˈtwɛni', button: 'ˈbʌʔn̩', better: 'ˈbɛɾɚ',
    thought: 'θɑt', hello: 'həˈloʊ', strawberry: 'ˈstɹɑˌbɛɹi', party: 'ˈpɑɹɾi', north: 'nɔɹθ',
  };
  for (const [w, expected] of Object.entries(cases)) assert.equal(ipa(w), expected, w);
});

test('English → IPA: careful speech, weak forms and linking', () => {
  assert.equal(ipa('water', false), 'ˈwɑtɚ');
  assert.equal(ipa('I want to get a bottle of water.'), 'aɪ wɑnt tə ɡɛɾ ə ˈbɑɾəl əv ˈwɑɾɚ.');
  assert.equal(ipa('the apple and the banana'), 'ði ˈæpəl ən ðə bəˈnænə');
  assert.equal(ipa('21'), 'ˈtwɛni wʌn');
});

test('English → IPA: unknown words are guessed and flagged', () => {
  const [tok] = enUS.toIPA('blorptastic', { casual: true });
  assert.equal(tok.guessed, true);
  assert.match(tok.ipa, /^ˈblɔɹp/);
});

test('IPA → English respelling', () => {
  const cases = {
    'bɔ̃ˈʒuʁ': ['bawn-ZHOOR', 'bɔnˈʒuɹ'],
    'ˈhiu dʒi ʒaˈnejɾu': ['HEE-oo jee zhah-NAY-roo', 'ˈhiu dʒi ʒɑˈneɪɹu'],
    'kaˈfe': ['kah-FAY', 'kɑˈfeɪ'],
    'seˈɲoɾ': ['say-NYOR', 'seɪˈnjoʊɹ'],
    bax: ['bahk', 'bɑk'],
    'ˈsɪti': ['SIT-ee', 'ˈsɪti'],
    'mɐ̃j̃': ['mine', 'maɪn'],
  };
  for (const [src, expected] of Object.entries(cases)) assert.deepEqual(respell(src), expected, src);
});

test('English → Portuguese spelling through IPA', () => {
  const ipaText = enUS.toIPA('thank you', { casual: true }).map((t) => t.ipa ?? t.text).join('');
  const { tokens } = ptBR.fromIPA(ipaText);
  assert.equal(tokens.map((t) => t.spelled ?? t.text).join(''), 'tênqui iu');
});
