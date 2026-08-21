import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mdToPortable } from '../md-to-portable.mjs';

test('párrafo simple produce un block normal', () => {
  const [b] = mdToPortable('Hola mundo.');
  assert.equal(b._type, 'block');
  assert.equal(b.style, 'normal');
  assert.equal(b.children[0].text, 'Hola mundo.');
});

test('encabezado ## produce style h2', () => {
  const [b] = mdToPortable('## Título');
  assert.equal(b.style, 'h2');
  assert.equal(b.children[0].text, 'Título');
});

test('encabezado ### produce style h3', () => {
  const [b] = mdToPortable('### Sub');
  assert.equal(b.style, 'h3');
});

test('negrita produce mark strong', () => {
  const [b] = mdToPortable('Esto es **fuerte** aquí.');
  const strong = b.children.find((c) => c.marks.includes('strong'));
  assert.equal(strong.text, 'fuerte');
});

test('cursiva produce mark em', () => {
  const [b] = mdToPortable('Esto es *suave* aquí.');
  const em = b.children.find((c) => c.marks.includes('em'));
  assert.equal(em.text, 'suave');
});

test('código inline produce mark code', () => {
  const [b] = mdToPortable('Usa `npm run build` ya.');
  const code = b.children.find((c) => c.marks.includes('code'));
  assert.equal(code.text, 'npm run build');
});

test('enlace produce markDef link con href', () => {
  const [b] = mdToPortable('Ver [el sitio](https://codewithgabo.com).');
  assert.equal(b.markDefs.length, 1);
  assert.equal(b.markDefs[0].href, 'https://codewithgabo.com');
  const linked = b.children.find((c) => c.marks.includes(b.markDefs[0]._key));
  assert.equal(linked.text, 'el sitio');
});

test('lista con viñetas produce listItem bullet', () => {
  const blocks = mdToPortable('- uno\n- dos');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].listItem, 'bullet');
  assert.equal(blocks[1].children[0].text, 'dos');
});

test('lista numerada produce listItem number', () => {
  const [b] = mdToPortable('1. primero');
  assert.equal(b.listItem, 'number');
});

test('cita produce style blockquote', () => {
  const [b] = mdToPortable('> una cita');
  assert.equal(b.style, 'blockquote');
});

test('bloque de código produce style code, nunca _type codeBlock', () => {
  const [b] = mdToPortable('```js\nconst a = 1;\nconst b = 2;\n```');
  assert.equal(b._type, 'block');
  assert.equal(b.style, 'code');
  assert.equal(b.children[0].text, 'const a = 1;\nconst b = 2;');
  assert.equal(b.children[0].marks.length, 0);
});

test('bloque de código conserva líneas en blanco internas', () => {
  const [b] = mdToPortable('```\nuno\n\ndos\n```');
  assert.equal(b.children[0].text, 'uno\n\ndos');
});

test('markdown dentro de un bloque de código no se interpreta', () => {
  const [b] = mdToPortable('```\nno **negrita** aqui\n```');
  assert.equal(b.children[0].text, 'no **negrita** aqui');
  assert.equal(b.children.length, 1);
});

test('todo bloque lleva _key único', () => {
  const blocks = mdToPortable('uno\n\ndos\n\ntres');
  const keys = blocks.map((b) => b._key);
  assert.equal(new Set(keys).size, 3);
});

test('todo block lleva markDefs aunque esté vacío', () => {
  const [b] = mdToPortable('sin enlaces');
  assert.deepEqual(b.markDefs, []);
});

test('párrafo multilínea se une en un solo block', () => {
  const blocks = mdToPortable('una linea\ny otra linea');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].children[0].text, 'una linea y otra linea');
});
