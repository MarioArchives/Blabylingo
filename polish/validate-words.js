#!/usr/bin/env node
/* Checks data-words.js.  Usage: node validate-words.js */
const fs = require('fs');
const { SMALL_WORDS, SMALL_WORDS_PERSONAL } = new Function(`${fs.readFileSync('data-words.js', 'utf8')}; return { SMALL_WORDS, SMALL_WORDS_PERSONAL };`)();
const CASE_IDS = ['nom', 'gen', 'dat', 'acc', 'ins', 'loc', 'voc'];
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
const str = v => typeof v === 'string' && v.trim().length > 0;

need(Array.isArray(SMALL_WORDS) && SMALL_WORDS.length >= 1, 'SMALL_WORDS must be a non-empty array');
(SMALL_WORDS || []).forEach((w, i) => {
  const at = `SMALL_WORDS[${i}] (${w.word})`;
  need(str(w.word) && str(w.en), `${at}: word and en required`);
  need(w.note === undefined || str(w.note), `${at}: note must be a string when present`);
  need(w.forms && typeof w.forms === 'object', `${at}: forms missing`);
  CASE_IDS.forEach(c => need(Array.isArray(w.forms?.[c]) && w.forms[c].length === 6 && w.forms[c].every(str), `${at}: forms.${c} must be 6 non-empty strings [masc animate, masc inanimate, neuter, feminine, plural with men, other plural]`));
});
need(Array.isArray(SMALL_WORDS_PERSONAL), 'SMALL_WORDS_PERSONAL must be an array (may be empty)');
(SMALL_WORDS_PERSONAL || []).forEach((w, i) => {
  const at = `SMALL_WORDS_PERSONAL[${i}] (${w.word})`;
  need(str(w.word) && str(w.en), `${at}: word and en required`);
  ['gen', 'dat', 'acc', 'ins', 'loc'].forEach(c => need(Array.isArray(w[c]) && w[c].length >= 1 && w[c].length <= 2 && w[c].every(str), `${at}: ${c} must be [plain form] or [plain form, form after a preposition]`));
});

if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK: ${SMALL_WORDS.length} declined words, ${SMALL_WORDS_PERSONAL.length} pronoun-style words`);
