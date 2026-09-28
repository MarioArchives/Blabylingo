#!/usr/bin/env node
/* Checks data-cases-pronouns.js.  Usage: node validate-pronouns.js */
const fs = require('fs');
const load = (file, ret) => new Function(`${fs.readFileSync(file, 'utf8')}; return ${ret};`)();
const { CASES, SENTENCES } = load('data.js', '{ CASES, SENTENCES }');
const EXTRA = fs.existsSync('data-cases-extra.js') ? load('data-cases-extra.js', 'EXTRA_SENTENCES') : [];
const PRON = load('data-cases-pronouns.js', 'PRONOUN_SENTENCES');
const MIN = { nom: 8, gen: 14, dat: 14, acc: 14, ins: 14, loc: 14, voc: 4 };
const ids = new Set(CASES.map(c => c.id));
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;
const plain = s => s.replace(/\{[^}]*\}/g, '');
const seen = new Set(SENTENCES.concat(EXTRA).map(s => plain(s.s) + '|' + s.base));
const counts = {};

PRON.forEach((s, i) => {
  const at = `[${i}] ${s.s}`;
  need(ids.has(s.c), `${at}: c must be one of ${[...ids].join(', ')}`);
  need(s.kind === 'pronoun', `${at}: kind must be 'pronoun'`);
  ['s', 'base', 'gloss', 'en', 'why'].forEach(k => need(str(s[k]), `${at}: ${k} missing`));
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
  counts[s.c] = (counts[s.c] || 0) + 1;
});
Object.entries(MIN).forEach(([id, n]) => need((counts[id] || 0) === n, `case ${id}: ${counts[id] || 0} sentences, must be exactly ${n}`));

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK: ${PRON.length} pronoun sentences`, counts);
