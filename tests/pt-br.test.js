import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toIPA, fromIPA } from '../src/langs/pt-br/index.js';

const ipa = (text, opts = { casual: true }) => toIPA(text, opts).map((t) => t.ipa ?? t.text).join('');
const adapt = (text) => {
  const { tokens } = fromIPA(text);
  return {
    spelled: tokens.map((t) => t.spelled ?? t.text).join(''),
    adapted: tokens.map((t) => t.adapted ?? t.text).join(''),
  };
};

test('Portuguese → IPA: words', () => {
  const cases = {
    casa: 'ˈkazɐ', cama: 'ˈkɐ̃mɐ', dia: 'ˈdʒiɐ', tudo: 'ˈtudu', bem: 'bẽj̃', você: 'voˈse',
    cidade: 'siˈdadʒi', noite: 'ˈnojtʃi', pão: 'pɐ̃w̃', mãe: 'mɐ̃j̃', falam: 'ˈfalɐ̃w̃', homem: 'ˈõmẽj̃',
    história: 'isˈtɔɾjɐ', carro: 'ˈkahu', rato: 'ˈhatu', honra: 'ˈõhɐ', Brasil: 'bɾaˈziw', sol: 'sɔw',
    janela: 'ʒaˈnɛlɐ', escola: 'isˈkɔlɐ', exame: 'eˈzɐ̃mi', caixa: 'ˈkaʃɐ', táxi: 'ˈtaksi',
    ritmo: 'ˈhitʃimu', advogado: 'adʒivoˈɡadu', quando: 'ˈkwɐ̃du', água: 'ˈaɡwɐ', seguinte: 'seˈɡĩtʃi',
    sair: 'saˈih', raiz: 'haˈis', rainha: 'haˈĩɲɐ', praia: 'ˈpɾajɐ', saúde: 'saˈudʒi', muito: 'ˈmũjtu',
    filho: 'ˈfiʎu', manhã: 'maˈɲɐ̃', tchau: 'tʃaw', coração: 'koɾaˈsɐ̃w̃', pode: 'ˈpɔdʒi',
  };
  for (const [w, expected] of Object.entries(cases)) assert.equal(ipa(w), expected, w);
});

test('Portuguese → IPA: careful speech keeps clusters and diphthongs', () => {
  assert.equal(ipa('pneu', { casual: false }), 'pnew');
  assert.equal(ipa('pouco', { casual: false }), 'ˈpowku');
  assert.equal(ipa('escola', { casual: false }), 'esˈkɔlɐ');
});

test('Portuguese → IPA: sentences, sandhi and numbers', () => {
  assert.equal(ipa('Os amigos estão aqui.'), 'uz aˈmiɡuz isˈtɐ̃w̃ aˈki.');
  assert.equal(ipa('Por isso'), 'poɾ ˈisu');
  assert.equal(ipa('21'), 'ˈvĩtʃi i ũ');
});

test('IPA → Portuguese', () => {
  const cases = {
    dɔɡ: ['dógui', 'ˈdɔɡi'],
    'ˈθæŋk ju': ['tênqui iu', 'ˈtẽki ju'],
    'bɔ̃ˈʒuʁ': ['bonjur', 'bõˈʒuh'],
    'ˈstɹɔːbəɹi': ['estróbari', 'isˈtɾɔbɐɾi'],
    'ˈwɔːtɚ': ['uóter', 'ˈwɔteh'],
    'ˈpɪtsa': ['pitsa', 'ˈpitsɐ'],
    'ˈɡʊɡəl': ['gúguel', 'ˈɡuɡew'],
    'ɡʁɑ̃': ['grã', 'ɡɾɐ̃'],
    'ˈkɐ̃mɐ': ['cama', 'ˈkɐ̃mɐ'],
  };
  for (const [src, [spelled, adapted]] of Object.entries(cases)) {
    assert.deepEqual(adapt(src), { spelled, adapted }, src);
  }
});

test('IPA → Portuguese spelling reads back as the adapted pronunciation', () => {
  for (const src of ['dɔɡ', 'ˈstɹɔːbəɹi', 'ˈwɔːtɚ', 'bɔ̃ˈʒuʁ', 'ˈpero', 'ʃtaɪn']) {
    const { spelled, adapted } = adapt(src);
    // Readers reduce final unstressed e/o to i/u and "ou" to [o]; spelling can't mark [ɐ] vs [a]
    const norm = (s) => s.replace(/ɐ/g, 'a').replace(/e$/, 'i').replace(/o$/, 'u').replace(/ow/g, 'o');
    assert.equal(norm(ipa(spelled, { casual: true })), norm(adapted), `${src} → ${spelled}`);
  }
});
