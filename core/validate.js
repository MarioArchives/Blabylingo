#!/usr/bin/env node
/* Checks a tense data file (any language). Run it from a language folder: node ../core/validate.js data-past.js PAST_TENSE
   A file that uses something another file defines names that file after, and it is loaded first:
   node ../core/validate.js data-future.js FUTURE_TENSE data-past.js */
const fs = require('fs');
const [file, name, ...before] = process.argv.slice(2);
if (!file || !name) { console.error('usage: node validate.js <file> <CONST_NAME> [files it needs ...]'); process.exit(2); }
const source = [...before, file].map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
const topic = new Function(`${source}; return ${name};`)();
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;

['id', 'pl', 'en', 'intro'].forEach(k => need(str(topic[k]), `topic.${k} missing`));
need(Array.isArray(topic.groups) && topic.groups.length >= 3 && topic.groups.length <= 6, 'topic.groups must have 3 to 6 entries');
const ids = new Set();
(topic.groups || []).forEach((g, i) => {
  const at = `groups[${i}]`;
  ['id', 'pl', 'en', 'q', 'summary'].forEach(k => need(str(g[k]), `${at}.${k} missing`));
  need(!ids.has(g.id), `${at}.id duplicated`); ids.add(g.id);
  need(g.colour === undefined || ['nom', 'gen', 'dat', 'acc', 'ins', 'loc', 'voc'].includes(g.colour), `${at}.colour must be a case colour`);
  need(str(g.pl) && g.pl.replace(/\u00AD/g, '').length <= 16, `${at}.pl must be 16 characters or fewer (it sits on a narrow stripe); soft hyphens do not count`);
  need(g.cases === undefined || (Array.isArray(g.cases) && g.cases.every(c => /^(nom|gen|dat|acc|ins|loc|voc)\.(sg|pl)$/.test(c))), `${at}.cases must be like ['gen.pl']`);
  need(Array.isArray(g.tables) && g.tables.length >= 1, `${at}.tables needs at least one table`);
  (g.tables || []).forEach((t, j) => {
    need(str(t.title), `${at}.tables[${j}].title missing`);
    need(Array.isArray(t.cols) && t.cols.every(c => str(c.label) && ['m', 'n', 'f', 'all'].includes(c.tint)), `${at}.tables[${j}].cols must be [{label, tint: m|n|f|all}]`);
    (t.rows || []).forEach((r, k) => need(str(r.who) && Array.isArray(r.cells) && r.cells.length === t.cols.length, `${at}.tables[${j}].rows[${k}] needs who + one cell per column`));
    need(Array.isArray(t.rows) && t.rows.length >= 1, `${at}.tables[${j}].rows empty`);
    if (t.forms !== undefined) {   // every person's form for each verb row: parts of { cols, who }, then one entry per who in each row
      const parts = Array.isArray(t.forms) ? t.forms : [];
      need(parts.length >= 1 && parts.every(p => Array.isArray(p.cols) && p.cols.every(c => str(c.label) && ['m', 'n', 'f', 'all'].includes(c.tint)) && Array.isArray(p.who) && p.who.every(str)),
        `${at}.tables[${j}].forms must be [{ cols: [{label, tint}], who: ['yo', …] }]`);
      const shape = parts.flatMap(p => (p.who || []).map(() => (p.cols || []).length));
      (t.rows || []).forEach((r, k) => need(Array.isArray(r.forms) && r.forms.length === shape.length
        && r.forms.every((f, i) => shape[i] === 1 ? str(f) || (Array.isArray(f) && f.length === 1 && str(f[0])) : Array.isArray(f) && f.length === shape[i] && f.every(str)),
        `${at}.tables[${j}].rows[${k}] (${r.who}) needs forms: one per person in forms, each with one form per column`));
    }
  });
  need(Array.isArray(g.rules) && g.rules.length >= 1 && g.rules.every(r => str(r.t) && str(r.ex) && str(r.en)), `${at}.rules must be [{t, ex, en}]`);
  need(Array.isArray(g.watch) && g.watch.every(str), `${at}.watch must be an array of strings`);
});

const counts = {};
const seen = new Set();
(topic.sentences || []).forEach((s, i) => {
  const at = `sentences[${i}] (${s.s})`;
  need(ids.has(s.c), `${at}: c "${s.c}" is not a group id`);
  ['s', 'base', 'gloss', 'en', 'why'].forEach(k => need(str(s[k]), `${at}: ${k} missing`));
  need(Array.isArray(s.a) && s.a.length >= 1 && s.a.every(str), `${at}: a must be a non-empty array of strings`);
  need(s.hint === undefined || str(s.hint), `${at}: hint must be a string when present`);
  if (topic.id === 'numbers' || topic.id === 'idioms') {
    const g = (topic.groups || []).find(x => x.id === s.c);
    const cells = Array.isArray(s.at) && Array.isArray(s.at[0]) ? s.at : [s.at];   // one cell, or a list of cells in different tables
    const ok = Array.isArray(s.at) && g && cells.every(cell => Array.isArray(cell) && cell.length === 2 && g.tables.some(t => t.rows.some(r => r.who === cell[0]) && t.cols.some(c => c.label === cell[1])));
    need(ok, `${at}: at must be ['row who', 'column label'], or a list of them, from the tables of group ${s.c}`);
  }
  if (topic.id === 'numbers') {
    need(s.kind === 'number' || s.kind === 'word' || s.form, `${at}: needs kind: 'number' (the gap is the number), kind: 'word' or form (the gap is a noun, adjective or verb)`);
    need(s.kind === undefined || s.kind === 'number' || s.kind === 'word', `${at}: kind can only be 'number' or 'word'`);
    need(s.form === undefined || /^(noun|adj) (nom|gen|dat|acc|ins|loc|voc)\.(sg|pl)\.(m1|m2|n|f)$|^verb (past|present)\.(ja|ty|on|ona|ono|my|wy|oni|one)$/.test(s.form),
      `${at}: form must look like 'noun gen.pl.f', 'adj loc.sg.n' or 'verb past.ono'`);
  }
  if (!s.at) need(str(s.p) && s.p.length <= 10, `${at}: p (person of the verb form) is required, e.g. 'yo' or 'ona'`);
  need(!seen.has(`${s.s}|${s.base}`), `${at}: duplicate sentence`); seen.add(`${s.s}|${s.base}`);   // bare "___" items differ only by base
  counts[s.c] = (counts[s.c] || 0) + 1;
  if (!str(s.s)) return;
  need((s.s.match(/___/g) || []).length === 1, `${at}: needs exactly one ___ gap`);
  const re = /(___)|([^\s{}]+)\{([^}]*)\}|([^\s{}]+)/g; let m;
  while ((m = re.exec(s.s))) {
    if (m[2]) { const [g, tag, extra] = m[3].split('|'); need(str(g), `${at}: empty gloss on "${m[2]}"`); need(extra === undefined && (tag === undefined || /^(m1|m2|m|n|f)(\.pl)?$/.test(tag)), `${at}: bad gender tag on "${m[2]}"`); }
    if (m[4]) need(/^[.,!?;:…"„”()–-]+$/.test(m[4]), `${at}: word "${m[4]}" has no {gloss}`);
  }
  need(!/[{}]/.test(s.s.replace(/\{[^{}]*\}/g, '')), `${at}: unbalanced braces`);
});
(topic.groups || []).forEach(g => need((counts[g.id] || 0) >= 10, `group ${g.id} has ${counts[g.id] || 0} sentences, needs at least 10`));

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK: ${topic.groups.length} groups, ${topic.sentences.length} sentences`, counts);
