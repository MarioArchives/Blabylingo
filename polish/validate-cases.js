#!/usr/bin/env node
/* Checks data-cases-extra.js against data.js.  Usage: node validate-cases.js [target-per-case] */
const fs = require('fs');
const TARGET = Number(process.argv[2] || 50);
const { CASES, SENTENCES } = new Function(`${fs.readFileSync('data.js', 'utf8')}; return { CASES, SENTENCES };`)();
const EXTRA = new Function(`${fs.readFileSync('data-cases-extra.js', 'utf8')}; return EXTRA_SENTENCES;`)();
const ids = new Set(CASES.map(c => c.id));
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;
const plain = s => s.replace(/\{[^}]*\}/g, '');
const seen = new Set(SENTENCES.map(s => plain(s.s) + '|' + s.base));
const counts = Object.fromEntries([...ids].map(id => [id, SENTENCES.filter(s => s.c === id).length]));

EXTRA.forEach((s, i) => {
  const at = `[${i}] ${s.s}`;
  need(ids.has(s.c), `${at}: c must be one of ${[...ids].join(', ')}`);
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
  if (ids.has(s.c)) counts[s.c]++;
});
Object.entries(counts).forEach(([id, n]) => need(n === TARGET, `case ${id}: ${n} sentences in total, target is exactly ${TARGET}`));

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK: ${EXTRA.length} new sentences, every case now has ${TARGET}`);
