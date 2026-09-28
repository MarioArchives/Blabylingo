#!/usr/bin/env node
/* Checks data-idioms.js: present, past and future idioms against data-present.js, data-past.js and data-future.js.
   Usage: node validate-idioms.js */
const fs = require('fs');
const load = (files, names) => new Function(`${files.map(f => fs.readFileSync(f, 'utf8')).join('\n')}; return { ${names} };`)();
const { PRESENT_TENSE } = load(['data-present.js'], 'PRESENT_TENSE');
const { PAST_TENSE } = load(['data-past.js'], 'PAST_TENSE');
const { FUTURE_TENSE } = load(['data-future.js'], 'FUTURE_TENSE');
const { IDIOM_PRESENT_SENTENCES, IDIOM_PAST_SENTENCES, IDIOM_FUTURE_SENTENCES } = load(['data-idioms.js'], 'IDIOM_PRESENT_SENTENCES, IDIOM_PAST_SENTENCES, IDIOM_FUTURE_SENTENCES');
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;
const plain = s => s.replace(/\{[^}]*\}/g, '');
const seen = new Set(PRESENT_TENSE.sentences.concat(PAST_TENSE.sentences, FUTURE_TENSE.sentences).map(s => plain(s.s) + '|' + s.base));
const PERSONS = ['yo', 'tú', 'él', 'nosotros', 'ellos'];

function check(s, at, topic) {
  const g = topic.groups.find(x => x.id === s.c);
  need(!!g, `${at}: c must be one of ${topic.groups.map(x => x.id).join(', ')}`);
  ['idiom', 'means', 'lit', 's', 'base', 'gloss', 'en', 'why'].forEach(k => need(str(s[k]), `${at}: ${k} missing`));
  need(PERSONS.includes(s.p), `${at}: p must be one of ${PERSONS.join(', ')}`);
  need(Array.isArray(s.a) && s.a.length >= 1 && s.a.every(str), `${at}: a must be a non-empty array of strings`);
  need(s.hint === undefined || (str(s.hint) && s.hint.length <= 12), `${at}: hint must be a short string (12 characters or fewer)`);
  if (s.at) need(g && g.tables.some(t => t.rows.some(r => r.who === s.at[0]) && t.cols.some(c => c.label === s.at[1])), `${at}: at must be ['row who', 'column label'] from the tables of ${s.c}`);
  if (!str(s.s)) return;
  const key = plain(s.s) + '|' + s.base;
  need(!seen.has(key), `${at}: duplicates an existing sentence`); seen.add(key);
  need((s.s.match(/___/g) || []).length === 1, `${at}: needs exactly one ___ gap`);
  const re = /(___)|([^\s{}]+)\{([^}]*)\}|([^\s{}]+)/g; let m;
  while ((m = re.exec(s.s))) {
    if (m[2]) { const [gl, tag, extra] = m[3].split('|'); need(str(gl), `${at}: empty gloss on "${m[2]}"`); need(extra === undefined && (tag === undefined || /^(m|f)(\.pl)?$/.test(tag)), `${at}: bad gender tag on "${m[2]}"`); }
    if (m[4]) need(/^[.,!?;:…"¿¡()–-]+$/.test(m[4]), `${at}: word "${m[4]}" has no {gloss}`);
  }
  need(!/[{}]/.test(s.s.replace(/\{[^{}]*\}/g, '')), `${at}: unbalanced braces`);
}

IDIOM_PRESENT_SENTENCES.forEach((s, i) => check(s, `IDIOM_PRESENT_SENTENCES[${i}] ${s.s}`, PRESENT_TENSE));
IDIOM_PAST_SENTENCES.forEach((s, i) => check(s, `IDIOM_PAST_SENTENCES[${i}] ${s.s}`, PAST_TENSE));
IDIOM_FUTURE_SENTENCES.forEach((s, i) => check(s, `IDIOM_FUTURE_SENTENCES[${i}] ${s.s}`, FUTURE_TENSE));

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
const count = list => Object.entries(list.reduce((o, s) => ({ ...o, [s.c]: (o[s.c] || 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ');
const idioms = new Set(IDIOM_PRESENT_SENTENCES.concat(IDIOM_PAST_SENTENCES, IDIOM_FUTURE_SENTENCES).map(s => s.idiom));
console.log(`OK: ${idioms.size} idioms; ${IDIOM_PRESENT_SENTENCES.length} present sentences (${count(IDIOM_PRESENT_SENTENCES)}), ${IDIOM_PAST_SENTENCES.length} past sentences (${count(IDIOM_PAST_SENTENCES)}), ${IDIOM_FUTURE_SENTENCES.length} future sentences (${count(IDIOM_FUTURE_SENTENCES)})`);
