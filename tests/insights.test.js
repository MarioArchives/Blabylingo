/* Tests for core/insights.js. Run from the repo root: node --test tests/ */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const I = require('../core/insights.js');

const rec = (n, ok, streak = 0, last = 0, t = 0) => ({ n, ok, streak, last, t });
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} ≈ ${b}`);
const deepNoNaN = value => {
  if (typeof value === 'number') assert.ok(!Number.isNaN(value), 'found NaN');
  else if (value && typeof value === 'object') Object.values(value).forEach(deepNoNaN);
};

/* ---------- parseKey ---------- */

test('parseKey: group is the 2nd segment and base the last, even when the sentence contains |', () => {
  assert.deepEqual(I.parseKey('cases|nom|To{this} jest{is} mój{my|m} ___.|brat'), { topic: 'cases', group: 'nom', base: 'brat' });
  assert.deepEqual(I.parseKey('past|past-isc|Wczoraj ___ do kina.|iść'), { topic: 'past', group: 'past-isc', base: 'iść' });
});

/* ---------- forgottenWords ---------- */

test('forgottenWords: empty or missing progress gives []', () => {
  assert.deepEqual(I.forgottenWords({}), []);
  assert.deepEqual(I.forgottenWords(null), []);
  assert.deepEqual(I.forgottenWords(undefined), []);
});

test('forgottenWords: a word missed only once is left out', () => {
  assert.deepEqual(I.forgottenWords({ 'cases|gen|Nie mam ___.|brat': rec(3, 2, 0, 0, 10) }), []);
});

test('forgottenWords: misses of one base add up across sentences and topics', () => {
  const progress = {
    'cases|gen|Nie mam ___.|brat': rec(2, 1, 0, 0, 10),
    'cases|nom|To{this} jest{is} mój{my|m} ___.|brat': rec(1, 0, 0, 0, 20),
    'past|past-byc|Wczoraj ___ w domu.|być': rec(1, 0, 0, 0, 30),
    'future|future-byc|Jutro ___ w domu.|być': rec(2, 1, 0, 0, 40),
  };
  const words = I.forgottenWords(progress, { glosses: { brat: 'brother', 'być': 'to be' } });
  assert.equal(words.length, 2);
  const brat = words.find(w => w.base === 'brat');
  const byc = words.find(w => w.base === 'być');
  assert.equal(brat.misses, 2);
  assert.equal(brat.n, 3);
  assert.equal(brat.gloss, 'brother');
  assert.equal(byc.misses, 2);
  assert.deepEqual(new Set(byc.keys), new Set(['past|past-byc|Wczoraj ___ w domu.|być', 'future|future-byc|Jutro ___ w domu.|być']));
});

test('forgottenWords: a re-learned word (latest sentence streak ≥ 2) is left out', () => {
  const relearned = {
    'cases|gen|Nie mam ___.|brat': rec(6, 1, 0, 0, 10),
    'cases|acc|Widzę ___.|brat': rec(4, 2, 2, 1, 50),       // most recent, right twice in a row
  };
  assert.deepEqual(I.forgottenWords(relearned), []);
  const slipped = {
    'cases|gen|Nie mam ___.|brat': rec(6, 3, 2, 1, 10),     // an old streak does not count
    'cases|acc|Widzę ___.|brat': rec(4, 2, 0, 0, 50),
  };
  assert.equal(I.forgottenWords(slipped).length, 1);
});

test('forgottenWords: sorted by misses, then most recent; limit respected (default 8)', () => {
  const progress = {
    'cases|gen|a|few': rec(3, 0, 0, 0, 100),        // 3 misses, older
    'cases|gen|b|many': rec(5, 0, 0, 0, 50),        // 5 misses
    'cases|gen|c|recent': rec(3, 0, 0, 0, 200),     // 3 misses, newer
  };
  assert.deepEqual(I.forgottenWords(progress).map(w => w.base), ['many', 'recent', 'few']);
  assert.deepEqual(I.forgottenWords(progress, { limit: 2 }).map(w => w.base), ['many', 'recent']);
  const lots = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`cases|gen|s${i}|w${i}`, rec(2, 0, 0, 0, i)]));
  assert.equal(I.forgottenWords(lots).length, 8);
});

test('forgottenWords: a word with no known meaning is listed with an empty gloss', () => {
  const words = I.forgottenWords({ 'cases|gen|Gone sentence.|stary': rec(2, 0, 0, 0, 1) }, { glosses: { brat: 'brother' } });
  assert.equal(words.length, 1);
  assert.equal(words[0].gloss, '');
});

test('forgottenWords: malformed records are ignored and never produce NaN', () => {
  const progress = {
    'cases|gen|a|nullrec': null,
    'cases|gen|b|stringrec': 'x',
    'cases|gen|c|nook': { n: 2 },
    'cases|gen|d|okbig': { n: 1, ok: 3, streak: 0, last: 0, t: 1 },
    'cases|gen|e|negative': { n: -2, ok: -5, streak: 0, last: 0, t: 1 },
    'cases|gen|f|good': rec(3, 0, 0, 0, 5),
  };
  const words = I.forgottenWords(progress);
  assert.deepEqual(words.map(w => w.base), ['good']);
  deepNoNaN(words);
});

/* ---------- groupScores ---------- */

const casesSummary = {
  language: 'polish',
  topic: { id: 'cases', pl: 'Przypadki', en: 'Cases' },
  groups: [
    { id: 'nom', pl: 'Mianownik', en: 'Nominative', total: 4, colour: 'nom' },
    { id: 'gen', pl: 'Dopełniacz', en: 'Genitive', total: 10, colour: 'gen' },
    { id: 'voc', pl: 'Wołacz', en: 'Vocative', total: 0, colour: 'voc' },
  ],
};

test('groupScores: groups without attempts score 0 with accuracy null; total 0 never divides by zero', () => {
  const scores = I.groupScores(casesSummary, {});
  assert.deepEqual(scores.map(s => s.id), ['nom', 'gen', 'voc']);
  for (const s of scores) {
    assert.equal(s.mastered, 0);
    assert.equal(s.seen, 0);
    assert.equal(s.share, 0);
    assert.equal(s.accuracy, null);
  }
  deepNoNaN(scores);
});

test('groupScores: ignores other topics and unknown groups', () => {
  const scores = I.groupScores(casesSummary, {
    'past|nom|s|x': rec(3, 3, 3, 1, 1),        // another topic, same group id
    'cases|xyz|s|y': rec(3, 3, 3, 1, 1),       // group not in the summary
    'cases|gen|s|z': rec(4, 3, 2, 1, 1),
  });
  const nom = scores.find(s => s.id === 'nom');
  const gen = scores.find(s => s.id === 'gen');
  assert.equal(nom.seen, 0);
  assert.equal(gen.seen, 1);
  assert.equal(gen.mastered, 1);
  near(gen.accuracy, 3 / 4);
  near(gen.share, 1 / 10);
  assert.equal(gen.pl, 'Dopełniacz');
  assert.equal(gen.colour, 'gen');
  assert.equal(gen.total, 10);
});

test('groupScores: mastered means streak ≥ 2 and the share is clamped to 1', () => {
  const items = {
    'cases|nom|a|w1': rec(2, 2, 2, 1, 1),
    'cases|nom|b|w2': rec(2, 2, 2, 1, 1),
    'cases|nom|c|w3': rec(3, 3, 3, 1, 1),
    'cases|nom|d|w4': rec(4, 4, 4, 1, 1),
    'cases|nom|e|w5': rec(5, 5, 5, 1, 1),    // five mastered, but the group now has only 4 sentences
    'cases|gen|f|w6': rec(1, 1, 1, 1, 1),    // streak 1 is not mastered
  };
  const scores = I.groupScores(casesSummary, items);
  assert.equal(scores.find(s => s.id === 'nom').share, 1);
  assert.equal(scores.find(s => s.id === 'gen').mastered, 0);
});

test('groupScores: correct counts sentences answered right at least once, even without a streak', () => {
  const scores = I.groupScores(casesSummary, {
    'cases|gen|a|w1': rec(3, 1, 0, 0, 1),    // right once, then wrong
    'cases|gen|b|w2': rec(2, 2, 2, 1, 1),    // mastered, so also correct
    'cases|gen|c|w3': rec(2, 0, 0, 0, 1),    // never right
  });
  const gen = scores.find(s => s.id === 'gen');
  assert.equal(gen.correct, 2);
  assert.equal(gen.mastered, 1);
  near(gen.correctShare, 2 / 10);
  assert.equal(scores.find(s => s.id === 'voc').correctShare, 0);
});

/* ---------- topicSummary ---------- */

test('topicSummary: totals every sentence per group in data order, first gloss wins, glosses only for words in the items', () => {
  const topic = {
    id: 'past', pl: 'Czas przeszły', en: 'Past tense',
    groups: [
      { id: 'g1', pl: 'Regularne', en: 'Regular verbs', colour: 'loc' },
      { id: 'g2', pl: 'Być', en: 'To be', colour: 'gen' },
    ],
    sentences: [
      { c: 'g1', s: 'a', base: 'czytać', gloss: 'to read' },
      { c: 'g1', s: 'b', base: 'pisać', gloss: 'to write', idiom: true },   // idioms merged into the topic count too
      { c: 'g2', s: 'c', base: 'czytać', gloss: 'to read aloud' },
    ],
  };
  const summary = I.topicSummary(topic, 'polish', { 'past|g1|a|czytać': rec(1, 1, 1, 1, 1) });
  assert.equal(summary.language, 'polish');
  assert.deepEqual(summary.topic, { id: 'past', pl: 'Czas przeszły', en: 'Past tense' });
  assert.deepEqual(summary.groups, [
    { id: 'g1', pl: 'Regularne', en: 'Regular verbs', colour: 'loc', total: 2 },
    { id: 'g2', pl: 'Być', en: 'To be', colour: 'gen', total: 1 },
  ]);
  assert.deepEqual(summary.glosses, { 'czytać': 'to read' });
});

/* ---------- streaks ---------- */

test('previousDay: crosses month, year and leap-day boundaries', () => {
  assert.equal(I.previousDay('2026-09-28'), '2026-09-27');
  assert.equal(I.previousDay('2026-03-01'), '2026-02-28');
  assert.equal(I.previousDay('2027-01-01'), '2026-12-31');
  assert.equal(I.previousDay('2028-03-01'), '2028-02-29');
});

test('currentStreak: kept today and yesterday, 0 when older or missing', () => {
  const profile = { lastDay: '2026-09-28', streak: 4 };
  assert.equal(I.currentStreak(profile, '2026-09-28'), 4);
  assert.equal(I.currentStreak(profile, '2026-09-29'), 4);
  assert.equal(I.currentStreak(profile, '2026-09-30'), 0);
  assert.equal(I.currentStreak({ lastDay: '2026-02-28', streak: 2 }, '2026-03-01'), 2);
  assert.equal(I.currentStreak({ lastDay: null, streak: 3 }, '2026-09-28'), 0);
  assert.equal(I.currentStreak({}, '2026-09-28'), 0);
  assert.equal(I.currentStreak(null, '2026-09-28'), 0);
});

/* ---------- totals ---------- */

test('totals: sums answers and right answers; accuracy null when nothing answered', () => {
  assert.deepEqual(I.totals({}), { answered: 0, right: 0, accuracy: null });
  const t = I.totals({ a: rec(4, 3), b: rec(6, 3), bad: null, worse: { n: 1, ok: 5 } });
  assert.equal(t.answered, 10);
  assert.equal(t.right, 6);
  near(t.accuracy, 0.6);
});

/* ---------- radar ---------- */

test('radarPoints: first axis points up, clockwise, 0 at the centre, values clamped to 0–1', () => {
  const pts = I.radarPoints([1, 1, 1, 1], 100, 150, 150);
  near(pts[0][0], 150); near(pts[0][1], 50);     // straight up
  near(pts[1][0], 250); near(pts[1][1], 150);    // then to the right
  const zero = I.radarPoints([0, 0.5, 0, 0], 100, 150, 150);
  near(zero[0][0], 150); near(zero[0][1], 150);
  near(zero[1][0], 200);
  const clamped = I.radarPoints([1.5, -0.2, NaN, 1], 100, 150, 150);
  near(clamped[0][1], 50);
  near(clamped[1][0], 150); near(clamped[1][1], 150);
  near(clamped[2][0], 150); near(clamped[2][1], 150);
});

const scoresOf = names => names.map((pl, i) => ({ id: `g${i}`, pl, en: `Group ${i}`, colour: 'nom', total: 10, seen: 5, mastered: i, share: i / 10, accuracy: 0.5, n: 10, ok: 5 }));

test('radarSVG: fewer than 3 groups gives an empty string', () => {
  assert.equal(I.radarSVG(scoresOf(['A', 'B'])), '');
  assert.equal(I.radarSVG([]), '');
});

test('radarSVG: one axis and one vertex dot per group', () => {
  const svg = I.radarSVG(scoresOf(['A', 'B', 'C', 'D', 'E']));
  assert.match(svg, /^<svg/);
  assert.equal((svg.match(/class="radar-axis"/g) || []).length, 5);
  assert.equal((svg.match(/class="radar-dot"/g) || []).length, 5);
});

test('radarSVG: escapes group names and labels every group with its percentage', () => {
  const svg = I.radarSVG(scoresOf(['A & <B> "c"', 'Dopełniacz', 'Wołacz']), { label: 'Cases' });
  assert.ok(svg.includes('A &amp; &lt;B&gt; &quot;c&quot;'));
  assert.ok(!svg.includes('<B>'));
  assert.match(svg, /role="img"/);
  const aria = svg.match(/aria-label="([^"]*)"/)[1];
  assert.ok(aria.includes('Cases'));
  assert.ok(aria.includes('Dopełniacz 10% mastered'));
  assert.ok(aria.includes('Wołacz 20% mastered'));
  assert.ok(aria.includes('&lt;B&gt; &quot;c&quot; 0% mastered'));
});

test('radarSVG: draws a correct-answers shape behind the mastered one, never inside it', () => {
  const scores = scoresOf(['A', 'B', 'C']).map((s, i) => ({ ...s, correct: 5, correctShare: i === 2 ? 0 : 0.5 }));
  const svg = I.radarSVG(scores, { label: 'Cases' });
  assert.equal((svg.match(/class="radar-shape-correct"/g) || []).length, 1);
  assert.ok(svg.indexOf('radar-shape-correct') < svg.indexOf('class="radar-shape"'));
  const aria = svg.match(/aria-label="([^"]*)"/)[1];
  assert.ok(aria.includes('C 20% mastered, 20% answered right'));   // correct share lifted to the mastered one
  assert.ok(aria.includes('B 10% mastered, 50% answered right'));
});

test('radarScale: the smallest step that fits, never below 10% or above 100%', () => {
  assert.equal(I.radarScale(0), 0.1);
  assert.equal(I.radarScale(0.1), 0.1);
  assert.equal(I.radarScale(0.11), 0.25);
  assert.equal(I.radarScale(0.3), 0.5);
  assert.equal(I.radarScale(0.9), 1);
  assert.equal(I.radarScale(1), 1);
});

test('radarScaleFor: fits the larger of either share across all groups', () => {
  assert.equal(I.radarScaleFor([]), 0.1);
  assert.equal(I.radarScaleFor([{ share: 0.02, correctShare: 0.3 }, { share: 0.05, correctShare: 0.08 }]), 0.5);
  assert.equal(I.radarScaleFor([{ share: NaN, correctShare: undefined }]), 0.1);
});

test('radarSVG: zooms to the scale and names it for screen readers', () => {
  const scores = scoresOf(['A', 'B', 'C']).map(s => ({ ...s, share: 0.02, correctShare: 0.05 }));
  scores[0].correctShare = 0.08;   // best share 8% → outer ring is 10%
  const svg = I.radarSVG(scores, { label: 'Cases' });
  assert.match(svg.match(/aria-label="([^"]*)"/)[1], /^Cases, zoomed to 10%/);
  // the top vertex of the correct shape sits at 8/10 of the radius, not 8/100
  const top = svg.match(/class="radar-shape-correct" points="([^"]*)"/)[1].split(' ')[0].split(',').map(Number);
  near(top[0], 0);
  near(top[1], -80);
});

test('radarSVG: labels use the short name with the full name as a title, and no group colours', () => {
  const scores = scoresOf(['Mianownik', 'Dopełniacz', 'Celownik']).map((s, i) => ({ ...s, short: ['Mian.', 'Dop.', 'Cel.'][i], colour: ['nom', 'gen', 'dat'][i] }));
  const svg = I.radarSVG(scores);
  assert.match(svg, /<text class="radar-label"[^>]*><title>Dopełniacz<\/title>Dop\.<\/text>/);
  assert.ok(!svg.includes('--c:'));
});

test('radarSVG: every chart shares one frame, whatever its group count or names', () => {
  const a = I.radarSVG(scoresOf(['A', 'B', 'C']));
  const b = I.radarSVG(scoresOf(['A very long group name', 'Dopełniacz', 'Miejscownik', 'D', 'E', 'F', 'G']));
  const vb = svg => svg.match(/viewBox="([^"]*)"/)[1];
  assert.equal(vb(a), vb(b));
  assert.match(b, /textLength="[\d.]+" lengthAdjust="spacingAndGlyphs"><title>/);
});

test('data: every radar group has a short name that fits the chart frame (7 characters)', () => {
  for (const lang of ['polish', 'spanish']) {
    const ctx = {};
    vm.createContext(ctx);
    const dir = path.join(__dirname, '..', lang);
    for (const f of fs.readdirSync(dir).filter(f => /^data.*\.js$/.test(f))) {
      vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^const /gm, 'var '), ctx);
    }
    const groupLists = Object.entries(ctx).map(([k, v]) => k === 'CASES' ? v : v && v.groups).filter(Array.isArray);
    assert.ok(groupLists.length > 0, `${lang}: no groups found`);
    for (const g of groupLists.flat()) {
      assert.ok(g.short, `${lang} ${g.id}: no short name`);
      assert.ok([...g.short].length <= 7, `${lang} ${g.id}: '${g.short}' is longer than 7 characters`);
    }
  }
});

/* ---------- accountModel ---------- */

const LANGS = [{ id: 'polish', prefix: 'koncowki' }, { id: 'spanish', prefix: 'terminaciones' }];
const summaryDoc = (language, topicId, items, glosses = {}) => ({
  language, topic: { id: topicId, pl: topicId, en: topicId },
  groups: [{ id: 'g', pl: 'G', en: 'G', colour: 'nom', total: 5 }], items, glosses,
});

test('accountModel: empty input gives no languages', () => {
  assert.deepEqual(I.accountModel([], { languages: LANGS }), { languages: [], forgotten: [], totals: { answered: 0, right: 0, accuracy: null } });
});

test('accountModel: groups by language in site order, topics in a fixed order, stale documents flagged', () => {
  const docs = [
    { id: 'terminaciones-past', data: summaryDoc('spanish', 'past', { 'past|g|s|hablar': rec(3, 0, 0, 0, 9) }, { hablar: 'to speak' }) },
    { id: 'koncowki-past', data: summaryDoc('polish', 'past', { 'past|g|s|iść': rec(2, 2, 2, 1, 5) }) },
    { id: 'koncowki-future', data: { items: { 'future|g|s|być': rec(2, 0, 0, 0, 7) } } },     // saved before summaries existed
    { id: 'koncowki-cases', data: summaryDoc('polish', 'cases', { 'cases|g|s|brat': rec(2, 0, 0, 0, 3) }, { brat: 'brother' }) },
    { id: 'other-cases', data: { items: {} } },                                                 // unknown language
  ];
  const model = I.accountModel(docs, { languages: LANGS });
  assert.deepEqual(model.languages.map(l => l.id), ['polish', 'spanish']);
  const polish = model.languages[0];
  assert.deepEqual(polish.topics.map(t => t.id), ['cases', 'past', 'future']);
  assert.equal(polish.topics.find(t => t.id === 'future').stale, true);
  assert.equal(polish.topics.find(t => t.id === 'cases').stale, false);
  assert.equal(polish.topics.find(t => t.id === 'cases').scores.length, 1);
  assert.deepEqual(model.languages[1].topics.map(t => t.id), ['past']);
  // forgotten words from every language, tagged with it, most misses first
  assert.deepEqual(model.forgotten.map(w => [w.base, w.language, w.gloss]), [['hablar', 'spanish', 'to speak'], ['być', 'polish', ''], ['brat', 'polish', 'brother']]);
  // totals cover stale documents too
  assert.deepEqual(model.totals.answered, 9);
  assert.deepEqual(model.totals.right, 2);
});

test('accountModel: each language carries its own totals and forgotten words, for the language switch', () => {
  const docs = [
    { id: 'koncowki-cases', data: summaryDoc('polish', 'cases', { 'cases|g|s|brat': rec(3, 1, 0, 0, 3), 'cases|g|t|dom': rec(1, 1, 1, 1, 4) }, { brat: 'brother' }) },
    { id: 'koncowki-future', data: { items: { 'future|g|s|być': rec(2, 0, 0, 0, 7) } } },
    { id: 'terminaciones-past', data: summaryDoc('spanish', 'past', { 'past|g|s|hablar': rec(4, 0, 0, 0, 9) }, { hablar: 'to speak' }) },
  ];
  const model = I.accountModel(docs, { languages: LANGS });
  const [polish, spanish] = model.languages;
  assert.deepEqual(polish.totals, { answered: 6, right: 2, accuracy: 2 / 6 });
  assert.deepEqual(spanish.totals, { answered: 4, right: 0, accuracy: 0 });
  assert.deepEqual(polish.forgotten.map(w => [w.base, w.gloss]), [['być', ''], ['brat', 'brother']]);
  assert.deepEqual(spanish.forgotten.map(w => w.base), ['hablar']);
  const many = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`cases|g|s${i}|w${i}`, rec(2, 0, 0, 0, i)]));
  assert.equal(I.accountModel([{ id: 'koncowki-cases', data: summaryDoc('polish', 'cases', many) }], { languages: LANGS }).languages[0].forgotten.length, 8);
});

/* ---------- regression ---------- */

test('insights.js is a plain script: no import/export, defines INSIGHTS as a global', () => {
  const src = fs.readFileSync(path.join(__dirname, '../core/insights.js'), 'utf8');
  assert.doesNotMatch(src, /^\s*(import|export)\b/m);
  const ctx = vm.createContext({});
  assert.equal(vm.runInContext(`${src}\n;typeof INSIGHTS`, ctx), 'object');
});
