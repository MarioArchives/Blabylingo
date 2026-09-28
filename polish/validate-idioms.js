#!/usr/bin/env node
/* Checks data-idioms.js: case idioms against data.js and data-genders.js, past idioms against data-past.js.
   Usage: node validate-idioms.js */
const fs = require('fs');
const load = (files, names) => new Function(`${files.map(f => fs.readFileSync(f, 'utf8')).join('\n')}; return { ${names} };`)();
const { CASES, SENTENCES } = load(['data.js'], 'CASES, SENTENCES');
const { GENDERS } = load(['data-genders.js'], 'GENDERS');
const { PAST_TENSE } = load(['data-past.js'], 'PAST_TENSE');
const { IDIOM_CASE_SENTENCES, IDIOM_PAST_SENTENCES } = load(['data-idioms.js'], 'IDIOM_CASE_SENTENCES, IDIOM_PAST_SENTENCES');
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;
const plain = s => s.replace(/\{[^}]*\}/g, '');
const seen = new Set(SENTENCES.concat(PAST_TENSE.sentences).map(s => plain(s.s) + '|' + s.base));
const PERSONS = ['ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one'];

function check(s, at, groupIds) {
  need(groupIds.has(s.c), `${at}: c must be one of ${[...groupIds].join(', ')}`);
  ['idiom', 'means', 'lit', 's', 'base', 'gloss', 'en', 'why'].forEach(k => need(str(s[k]), `${at}: ${k} missing`));
  need(Array.isArray(s.a) && s.a.length >= 1 && s.a.every(str), `${at}: a must be a non-empty array of strings`);
  need(s.hint === undefined || (str(s.hint) && s.hint.length <= 12), `${at}: hint must be a short string (12 characters or fewer)`);
  if (!str(s.s)) return;
  const key = plain(s.s) + '|' + s.base;
  need(!seen.has(key), `${at}: duplicates an existing sentence`); seen.add(key);
  need((s.s.match(/___/g) || []).length === 1, `${at}: needs exactly one ___ gap`);
  const re = /(___)|([^\s{}]+)\{([^}]*)\}|([^\s{}]+)/g; let m;
  while ((m = re.exec(s.s))) {
    if (m[2]) { const [g, tag, extra] = m[3].split('|'); need(str(g), `${at}: empty gloss on "${m[2]}"`); need(extra === undefined && (tag === undefined || /^(m1|m2|m|n|f)(\.pl)?$/.test(tag)), `${at}: bad gender tag on "${m[2]}"`); }
    if (m[4]) need(/^[.,!?;:…"„”()–-]+$/.test(m[4]), `${at}: word "${m[4]}" has no {gloss}`);
  }
  need(!/[{}]/.test(s.s.replace(/\{[^{}]*\}/g, '')), `${at}: unbalanced braces`);
}

const caseIds = new Set(CASES.map(c => c.id));
IDIOM_CASE_SENTENCES.forEach((s, i) => {
  const at = `IDIOM_CASE_SENTENCES[${i}] ${s.s}`;
  check(s, at, caseIds);
  need(s.kind === undefined || s.kind === 'pronoun', `${at}: kind can only be 'pronoun'`);
  if (s.kind !== 'pronoun') need(!!GENDERS[s.base], `${at}: add "${s.base}" to data-genders.js so the answer card can mark its cell`);
});
const pastIds = new Set(PAST_TENSE.groups.map(g => g.id));
IDIOM_PAST_SENTENCES.forEach((s, i) => {
  const at = `IDIOM_PAST_SENTENCES[${i}] ${s.s}`;
  check(s, at, pastIds);
  need(PERSONS.includes(s.p), `${at}: p must be one of ${PERSONS.join(', ')}`);
});

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
const count = list => Object.entries(list.reduce((o, s) => ({ ...o, [s.c]: (o[s.c] || 0) + 1 }), {})).map(([k, v]) => `${k} ${v}`).join(', ');
console.log(`OK: ${IDIOM_CASE_SENTENCES.length} case idioms (${count(IDIOM_CASE_SENTENCES)}), ${IDIOM_PAST_SENTENCES.length} past idioms (${count(IDIOM_PAST_SENTENCES)})`);
