/* Tests for core/nickname.js. Run from the repo root: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { cleanNickname, NICKNAME_MAX } = require('../core/nickname.js');

test('cleanNickname: trims and collapses inner spaces', () => {
  assert.deepEqual(cleanNickname('  Mario   Archives  '), { ok: true, value: 'Mario Archives', error: '' });
});

test('cleanNickname: letters with accents and from other alphabets are fine', () => {
  for (const name of ['Łukasz', 'Señora Peña', 'Zoë', 'Ольга', 'kot_42', 'ana.maria', 'Jean-Luc', '7even']) {
    assert.equal(cleanNickname(name).ok, true, name);
    assert.equal(cleanNickname(name).value, name);
  }
});

test('cleanNickname: empty or blank asks for a nickname', () => {
  for (const name of ['', '   ', null, undefined]) {
    const r = cleanNickname(name);
    assert.equal(r.ok, false);
    assert.match(r.error, /choose a nickname/i);
  }
});

test('cleanNickname: needs at least 2 characters', () => {
  assert.equal(cleanNickname('A').ok, false);
  assert.match(cleanNickname('A').error, /at least 2/);
  assert.equal(cleanNickname('Ab').ok, true);
});

test('cleanNickname: at most NICKNAME_MAX characters, counted as letters not bytes', () => {
  assert.equal(NICKNAME_MAX, 24);
  assert.equal(cleanNickname('a'.repeat(24)).ok, true);
  assert.equal(cleanNickname('a'.repeat(25)).ok, false);
  assert.match(cleanNickname('a'.repeat(25)).error, /24/);
  assert.equal(cleanNickname('ł'.repeat(24)).ok, true);   // 24 letters, 48 bytes
});

test('cleanNickname: only letters, numbers, spaces, dots, dashes and underscores', () => {
  for (const name of ['me@mail.com', '<b>hi</b>', 'a"b', 'pipe|bar', 'emoji🙂', 'semi;colon']) {
    const r = cleanNickname(name);
    assert.equal(r.ok, false, name);
    assert.match(r.error, /letters, numbers/);
  }
});

test('cleanNickname: must start with a letter or a number', () => {
  for (const name of ['.dot', '-dash', '_under']) {
    const r = cleanNickname(name);
    assert.equal(r.ok, false, name);
    assert.match(r.error, /start with a letter or a number/i);
  }
});

test('nickname.js is a plain script that defines NICKNAME as a global', () => {
  const src = fs.readFileSync(path.join(__dirname, '../core/nickname.js'), 'utf8');
  assert.doesNotMatch(src, /^\s*(import|export)\b/m);
  const ctx = vm.createContext({});
  assert.equal(vm.runInContext(`${src}\n;typeof NICKNAME.cleanNickname`, ctx), 'function');
});
