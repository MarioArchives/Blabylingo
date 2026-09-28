#!/usr/bin/env node
/* Checks the gender tags added to sentence glosses:  word{gloss|f}  word{gloss|m1.pl}
   Usage: node validate-tags.js <file> <CONST_NAME>[.sentences]
   Compares against snapshot/<file>: nothing but the tags may change. */
const fs = require('fs');
const [file, expr] = process.argv.slice(2);
if (!file || !expr) { console.error('usage: node validate-tags.js data-past.js PAST_TENSE.sentences'); process.exit(2); }
const load = (src, e) => new Function(`${src}; return ${e};`)();
const now = load(fs.readFileSync(file, 'utf8'), expr);
const before = load(fs.readFileSync(`snapshot/${file}`, 'utf8'), expr);
const TAG = /^(m1|m2|m|n|f)(\.pl)?$/;
const errs = [];
const need = (ok, msg) => { if (!ok) errs.push(msg); };
need(now.length === before.length, `sentence count changed: ${before.length} → ${now.length}`);
const strip = s => s.replace(/\{([^}|]*)\|[^}]*\}/g, '{$1}');
let tagged = 0, total = 0;
now.forEach((s, i) => {
  const b = before[i];
  if (!b) return;
  const at = `[${i}] ${s.s}`;
  Object.keys(b).forEach(k => { if (k !== 's') need(JSON.stringify(s[k]) === JSON.stringify(b[k]), `${at}: field "${k}" changed`); });
  need(strip(s.s) === b.s, `${at}: sentence text changed beyond adding tags`);
  const re = /([^\s{}]+)\{([^}]*)\}/g; let m;
  while ((m = re.exec(s.s))) {
    total++;
    const parts = m[2].split('|');
    need(parts.length <= 2, `${at}: more than one | in "${m[1]}"`);
    if (parts.length === 2) { tagged++; need(TAG.test(parts[1]), `${at}: bad tag "${parts[1]}" on "${m[1]}" (use m1, m2, m, n or f, optionally .pl)`); }
  }
});
if (errs.length) { console.error(errs.join('\n')); console.error(`\n${errs.length} problem(s)`); process.exit(1); }
console.log(`OK: ${tagged} of ${total} words tagged in ${now.length} sentences`);
