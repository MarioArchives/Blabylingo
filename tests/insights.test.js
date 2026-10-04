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

test('forgottenWords: a practised word (latest answer right) is left out', () => {
  const practised = {
    'cases|gen|Nie mam ___.|brat': rec(6, 1, 0, 0, 10),
    'cases|acc|Widzę ___.|brat': rec(3, 1, 1, 1, 50),       // most recent answer was right, once is enough
  };
  assert.deepEqual(I.forgottenWords(practised), []);
  const slipped = {
    'cases|gen|Nie mam ___.|brat': rec(6, 3, 2, 1, 10),     // an older right answer does not count
    'cases|acc|Widzę ___.|brat': rec(4, 2, 0, 0, 50),
  };
  assert.equal(I.forgottenWords(slipped).length, 1);
});

test('forgottenWords: a practised word comes back after another mistake', () => {
  const progress = { 'cases|gen|Nie mam ___.|brat': rec(3, 1, 1, 1, 10) };   // missed twice, then practised
  assert.deepEqual(I.forgottenWords(progress), []);
  progress['cases|gen|Nie mam ___.|brat'] = rec(4, 1, 0, 0, 20);              // wrong again
  assert.deepEqual(I.forgottenWords(progress).map(w => w.base), ['brat']);
  progress['cases|acc|Widzę ___.|brat'] = rec(1, 1, 1, 1, 30);                // right on another sentence of the word
  assert.deepEqual(I.forgottenWords(progress), []);
});

/* ---------- forgottenByTopic: the practice buttons, one per topic ---------- */

test('forgottenByTopic: groups the missed sentences of forgotten words by topic, biggest first', () => {
  const words = [
    { base: 'brat', keys: ['cases|gen|Nie mam ___.|brat', 'cases|nom|To jest ___.|brat'] },
    { base: 'być', keys: ['past|past-byc|Wczoraj ___ w domu.|być', 'future|future-byc|Jutro ___ w domu.|być'] },
    { base: 'iść', keys: ['past|past-isc|Wczoraj ___ do kina.|iść'] },
  ];
  assert.deepEqual(I.forgottenByTopic(words), [
    { topic: 'cases', keys: ['cases|gen|Nie mam ___.|brat', 'cases|nom|To jest ___.|brat'], words: ['brat'] },
    { topic: 'past', keys: ['past|past-byc|Wczoraj ___ w domu.|być', 'past|past-isc|Wczoraj ___ do kina.|iść'], words: ['być', 'iść'] },
    { topic: 'future', keys: ['future|future-byc|Jutro ___ w domu.|być'], words: ['być'] },
  ]);
});

test('forgottenByTopic: ties keep the usual topic order; no words gives []', () => {
  const words = [
    { base: 'a', keys: ['future|g|s1|a'] },
    { base: 'b', keys: ['cases|g|s2|b'] },
  ];
  assert.deepEqual(I.forgottenByTopic(words).map(t => t.topic), ['cases', 'future']);
  assert.deepEqual(I.forgottenByTopic([]), []);
  assert.deepEqual(I.forgottenByTopic(null), []);
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

test('radarSVG: one axis and one hover target per group, no visible corner dots', () => {
  const svg = I.radarSVG(scoresOf(['A', 'B', 'C', 'D', 'E']));
  assert.match(svg, /^<svg/);
  assert.equal((svg.match(/class="radar-axis"/g) || []).length, 5);
  assert.equal((svg.match(/class="radar-point"/g) || []).length, 5);
  assert.equal((svg.match(/class="radar-hit"/g) || []).length, 5);
  assert.equal((svg.match(/class="radar-dot"/g) || []).length, 0);
  assert.equal((svg.match(/class="radar-bg"/g) || []).length, 1);
  assert.ok(svg.indexOf('radar-bg') < svg.indexOf('radar-ring'));   // background sits under the rings
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

test('radarLeague: bronze to 30%, silver to 70%, gold to 99%, diamond at 100%, in whole percents', () => {
  const id = v => I.radarLeague(v).id;
  assert.equal(id(0), 'bronze');
  assert.equal(id(0.3), 'bronze');
  assert.equal(id(0.304), 'bronze');
  assert.equal(id(0.31), 'silver');
  assert.equal(id(0.7), 'silver');
  assert.equal(id(0.71), 'gold');
  assert.equal(id(0.99), 'gold');
  assert.equal(id(1), 'diamond');
  assert.deepEqual([0.1, 0.5, 0.9, 1].map(v => I.radarLeague(v).scale), [0.3, 0.7, 1, 1]);
});

test('radarLeagueFor: uses the larger of either share across all groups', () => {
  assert.equal(I.radarLeagueFor([]).id, 'bronze');
  assert.equal(I.radarLeagueFor([{ share: 0.02, correctShare: 0.4 }, { share: 0.05, correctShare: 0.08 }]).id, 'silver');
  assert.equal(I.radarLeagueFor([{ share: NaN, correctShare: undefined }]).id, 'bronze');
  assert.equal(I.radarLeagueFor([{ share: 0.2, correctShare: 1 }, { share: 0, correctShare: 0 }]).id, 'diamond');
});

test('radarSVG: zooms to the scale and names it for screen readers', () => {
  const scores = scoresOf(['A', 'B', 'C']).map(s => ({ ...s, share: 0.02, correctShare: 0.05 }));
  scores[0].correctShare = 0.24;   // best share 24% → bronze, outer ring is 30%
  const svg = I.radarSVG(scores, { label: 'Cases' });
  assert.match(svg.match(/aria-label="([^"]*)"/)[1], /^Cases, Bronze league, zoomed to 30%/);
  // the top vertex of the correct shape sits at 24/30 of the radius, not 24/100
  const top = svg.match(/class="radar-shape-correct" points="([^"]*)"/)[1].split(' ')[0].split(',').map(Number);
  near(top[0], 0);
  near(top[1], -80);
});

test('radarSVG: each corner is edged in its group colour, with a badge showing its initial', () => {
  const scores = scoresOf(['Mianownik', 'Dopełniacz', 'Celownik']).map((s, i) => ({ ...s, colour: ['nom', 'gen', 'dat'][i], ini: ['M', 'D', 'C'][i] }));
  const svg = I.radarSVG(scores);
  assert.equal((svg.match(/class="radar-edge" style="stroke: var\(--gen\)"/g) || []).length, 1);
  assert.match(svg, /<g class="radar-badge"[^>]*><title>Dopełniacz<\/title><circle style="fill: var\(--gen\)"[^>]*\/><text[^>]*>D<\/text><\/g>/);
});

test('radarSVG: each badge is a button carrying its group\'s scores for the popup', () => {
  const scores = scoresOf(['Mianownik', 'Dopełniacz', 'Celownik']).map((s, i) => ({ ...s, ini: ['M', 'D', 'C'][i], correct: i + 1 }));
  const badges = [...I.radarSVG(scores).matchAll(/<g class="radar-badge" role="button" tabindex="0"[^>]*data-stats="([^"]*)"/g)];
  assert.equal(badges.length, 3);
  const unesc = t => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  assert.deepEqual(JSON.parse(unesc(badges[1][1])), {
    pl: 'Dopełniacz', en: 'Group 1', ini: 'D', colour: 'nom', mastered: 1, correct: 2, total: 10, seen: 5, answers: 10, accuracy: 0.5,
  });
});

test('radarSVG: a group without an initial gets the first letter or digit of its short name', () => {
  const scores = scoresOf(['Być', 'Dwa', 'Coś']).map((s, i) => ({ ...s, short: ['+bezok.', '2–4', '¿Cuál?'][i] }));
  const initials = [...I.radarSVG(scores).matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);
  assert.deepEqual(initials, ['B', '2', 'C']);
});

test('radarSVG: every chart shares one frame, whatever its group count or names', () => {
  const a = I.radarSVG(scoresOf(['A', 'B', 'C']));
  const b = I.radarSVG(scoresOf(['A very long group name', 'Dopełniacz', 'Miejscownik', 'D', 'E', 'F', 'G']));
  const vb = svg => svg.match(/viewBox="([^"]*)"/)[1];
  assert.equal(vb(a), vb(b));
});

test('data: every radar group has a short name of up to 7 characters and an initial unique in its topic', () => {
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
    for (const groups of groupLists) {
      for (const g of groups) assert.ok(g.ini && [...g.ini].length <= 2, `${lang} ${g.id}: needs an initial of 1 or 2 characters`);
      const inis = groups.map(g => g.ini);
      assert.equal(new Set(inis).size, inis.length, `${lang}: initials repeat within a topic: ${inis.join(', ')}`);
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

/* ---------- post-quiz animation: radarTween, radarShapes, leagueChange, leagueMessage ---------- */

const leagueScores = (pairs) => pairs.map(([share, correctShare], i) => ({ ...scoresOf(['A', 'B', 'C', 'D'])[i % 4], id: `g${i}`, share, correctShare }));
const pointsOf = s => s.split(' ').map(p => p.split(',').map(Number));
const radius = ([x, y]) => Math.hypot(x, y);

test('radarTween: k=0 is the before chart, k=1 the after chart, k outside 0..1 or NaN is clamped', () => {
  const before = leagueScores([[0.1, 0.2], [0, 0.1], [0.05, 0.05]]);   // bronze, zoom 0.3
  const after = leagueScores([[0.3, 0.5], [0.1, 0.2], [0.05, 0.1]]);   // silver, zoom 0.7
  const start = I.radarTween(before, after, 0);
  start.shares.forEach((v, i) => near(v, [0.1, 0, 0.05][i]));
  start.correctShares.forEach((v, i) => near(v, [0.2, 0.1, 0.05][i]));
  near(start.scale, 0.3);
  const end = I.radarTween(before, after, 1);
  end.shares.forEach((v, i) => near(v, [0.3, 0.1, 0.05][i]));
  end.correctShares.forEach((v, i) => near(v, [0.5, 0.2, 0.1][i]));
  near(end.scale, 0.7);
  const mid = I.radarTween(before, after, 0.5);
  near(mid.shares[0], 0.2); near(mid.correctShares[0], 0.35); near(mid.scale, 0.5);
  assert.deepEqual(I.radarTween(before, after, -1), start);
  assert.deepEqual(I.radarTween(before, after, 2), end);
  assert.deepEqual(I.radarTween(before, after, NaN), start);
});

test('radarTween: missing before scores (first quiz in a topic) start from an empty bronze chart', () => {
  const after = leagueScores([[0.1, 0.2], [0, 0.1], [0.05, 0.05]]);
  for (const before of [null, undefined, []]) {
    const f = I.radarTween(before, after, 0);
    assert.deepEqual(f.shares, [0, 0, 0]);
    assert.deepEqual(f.correctShares, [0, 0, 0]);
    near(f.scale, 0.3);
  }
});

test('radarTween: bad shares are clamped to 0..1 and never give NaN', () => {
  const before = leagueScores([[NaN, undefined], [-0.5, 2], [0.1, null]]);
  const after = leagueScores([[0.2, 0.4], [Infinity, 'x'], [0.1, 0.2]]);
  for (const k of [0, 0.25, 0.5, 1]) {
    const f = I.radarTween(before, after, k);
    deepNoNaN(f);
    [...f.shares, ...f.correctShares].forEach(v => assert.ok(v >= 0 && v <= 1, `${v} in 0..1`));
    assert.ok(f.scale > 0 && f.scale <= 1);
  }
});

test('radarTween: the answered-right shape never sits inside the mastered one at any frame', () => {
  const before = leagueScores([[0.2, 0.1], [0.1, 0.3], [0, 0]]);     // first group: mastered > correct (bad data)
  const after = leagueScores([[0.4, 0.5], [0.3, 0.2], [0.1, 0.1]]);
  for (let k = 0; k <= 1; k += 0.1) {
    const f = I.radarTween(before, after, k);
    f.shares.forEach((s, i) => assert.ok(f.correctShares[i] >= s - 1e-9, `k=${k} group ${i}`));
  }
});

test('radarShapes: nothing is drawn past the outer ring, even when a share is above the zoom', () => {
  const shapes = I.radarShapes({ shares: [0.9, 0.2, 0.1], correctShares: [1, 0.5, 0.2], scale: 0.3 });
  for (const pts of [pointsOf(shapes.mastered), pointsOf(shapes.correct), shapes.vertices]) {
    pts.forEach(p => assert.ok(radius(p) <= 100 + 0.1, `${p} within radius`));
  }
  near(radius(pointsOf(shapes.correct)[0]), 100);
  assert.equal(shapes.vertices.length, 3);
});

test('radarShapes: the final frame matches the polygons and hover targets radarSVG draws', () => {
  const after = leagueScores([[0.3, 0.5], [0.1, 0.2], [0.05, 0.1], [0, 0.4]]);
  const svg = I.radarSVG(after);
  const shapes = I.radarShapes(I.radarTween(null, after, 1));
  assert.equal(svg.match(/class="radar-shape" points="([^"]*)"/)[1], shapes.mastered);
  assert.equal(svg.match(/class="radar-shape-correct" points="([^"]*)"/)[1], shapes.correct);
  const hits = [...svg.matchAll(/class="radar-hit" r="16" cx="([^"]*)" cy="([^"]*)"/g)].map(m => [Number(m[1]), Number(m[2])]);
  assert.equal(hits.length, 4);
  hits.forEach(([x, y], i) => { near(x, Math.round(shapes.vertices[i][0] * 10) / 10); near(y, Math.round(shapes.vertices[i][1] * 10) / 10); });
});

test('radarGrowth: grows at the old zoom first, then zooms out to the new league', () => {
  const before = leagueScores([[0.1, 0.2], [0, 0.1], [0.05, 0.05]]);   // bronze, zoom 0.3
  const after = leagueScores([[0.3, 0.5], [0.1, 0.2], [0.05, 0.1]]);   // silver, zoom 0.7
  const start = I.radarGrowth(before, after, 0);
  assert.deepEqual(start, I.radarTween(before, after, 0));
  const grown = I.radarGrowth(before, after, I.GROW_PHASE);
  grown.shares.forEach((v, i) => near(v, [0.3, 0.1, 0.05][i]));
  grown.correctShares.forEach((v, i) => near(v, [0.5, 0.2, 0.1][i]));
  near(grown.scale, 0.3);                                              // still at the bronze zoom
  const halfGrown = I.radarGrowth(before, after, I.GROW_PHASE / 2);
  near(halfGrown.shares[0], 0.2); near(halfGrown.scale, 0.3);
  const halfZoomed = I.radarGrowth(before, after, (I.GROW_PHASE + 1) / 2);
  near(halfZoomed.shares[0], 0.3); near(halfZoomed.scale, 0.5);
  assert.deepEqual(I.radarGrowth(before, after, 1), I.radarTween(before, after, 1));
  assert.deepEqual(I.radarGrowth(before, after, 5), I.radarTween(before, after, 1));
  assert.deepEqual(I.radarGrowth(before, after, NaN), start);
  assert.ok(I.GROW_PHASE > 0 && I.GROW_PHASE < 1);
});

test('radarGrowth: within one league the zoom never changes and the whole run is growth', () => {
  const before = leagueScores([[0.4, 0.5], [0.2, 0.3], [0.1, 0.2]]);   // silver
  const after = leagueScores([[0.45, 0.6], [0.25, 0.35], [0.1, 0.25]]); // silver
  for (const k of [0, 0.3, I.GROW_PHASE, 0.9, 1]) near(I.radarGrowth(before, after, k).scale, 0.7);
  near(I.radarGrowth(before, after, I.GROW_PHASE).correctShares[0], 0.6);
});

test('leagueChange: same league is not a promotion; one league up and a jump name the new league', () => {
  const bronze = leagueScores([[0.1, 0.2], [0, 0.1], [0, 0]]);
  const bronze2 = leagueScores([[0.1, 0.25], [0.05, 0.15], [0, 0.05]]);
  const silver = leagueScores([[0.2, 0.5], [0, 0.1], [0, 0]]);
  const gold = leagueScores([[0.5, 0.9], [0, 0.1], [0, 0]]);
  const same = I.leagueChange(bronze, bronze2);
  assert.equal(same.from.id, 'bronze'); assert.equal(same.to.id, 'bronze'); assert.equal(same.up, false);
  const up = I.leagueChange(bronze, silver);
  assert.equal(up.from.id, 'bronze'); assert.equal(up.to.id, 'silver'); assert.equal(up.up, true);
  const jump = I.leagueChange(bronze, gold);
  assert.equal(jump.from.id, 'bronze'); assert.equal(jump.to.id, 'gold'); assert.equal(jump.up, true);
});

test('leagueChange: no before scores counts as starting in bronze', () => {
  const silver = leagueScores([[0.2, 0.5], [0, 0.1], [0, 0]]);
  for (const before of [null, undefined, []]) {
    const c = I.leagueChange(before, silver);
    assert.equal(c.from.id, 'bronze'); assert.equal(c.to.id, 'silver'); assert.equal(c.up, true);
  }
  assert.equal(I.leagueChange(null, leagueScores([[0, 0.1], [0, 0], [0, 0]])).up, false);
});

test('leagueChange: a drop is never reported as a promotion', () => {
  const silver = leagueScores([[0.2, 0.5], [0, 0.1], [0, 0]]);
  const bronze = leagueScores([[0.1, 0.2], [0, 0.1], [0, 0]]);
  const c = I.leagueChange(silver, bronze);
  assert.equal(c.from.id, 'silver'); assert.equal(c.to.id, 'bronze'); assert.equal(c.up, false);
});

test('leagueChange: losing mastered sentences inside the same (non-bronze) league gives no message', () => {
  const before = leagueScores([[0.4, 0.5], [0.2, 0.3], [0, 0]]);
  const after = leagueScores([[0.3, 0.5], [0.1, 0.3], [0, 0]]);   // a wrong answer broke two streaks
  const c = I.leagueChange(before, after);
  assert.equal(c.up, false);
  assert.equal(I.leagueMessage(c, 'Cases'), '');
});

const leagueOf = id => I.radarLeague({ bronze: 0, silver: 0.5, gold: 0.9, diamond: 1 }[id]);
const LEAGUE_ORDER = ['bronze', 'silver', 'gold', 'diamond'];
const change = (from, to) => ({ from: leagueOf(from), to: leagueOf(to), up: LEAGUE_ORDER.indexOf(to) > LEAGUE_ORDER.indexOf(from) });

test('leagueMessage: a promotion names the new league; a jump names only the final one', () => {
  const silver = I.leagueMessage(change('bronze', 'silver'), 'Cases');
  assert.ok(silver.includes('Silver'), silver);
  const gold = I.leagueMessage(change('bronze', 'gold'), 'Cases');
  assert.ok(gold.includes('Gold') && !gold.includes('Silver'), gold);
});

test('leagueMessage: ending a quiz in Bronze always gets an encouraging Bronze message', () => {
  const stay = I.leagueMessage(change('bronze', 'bronze'), 'Cases');
  assert.ok(stay.includes('Bronze'), stay);
  assert.equal(I.leagueMessage(change('silver', 'bronze'), 'Cases'), stay);   // a (defensive) drop reads the same
});

test('leagueMessage: staying in Silver, Gold or Diamond gives no message', () => {
  for (const id of ['silver', 'gold', 'diamond']) assert.equal(I.leagueMessage(change(id, id), 'Cases'), '');
  assert.equal(I.leagueMessage(null, 'Cases'), '');
});

test('leagueMessage: every message is short', () => {
  for (const [from, to] of [['bronze', 'bronze'], ['bronze', 'silver'], ['silver', 'gold'], ['gold', 'diamond']]) {
    const msg = I.leagueMessage(change(from, to), 'Future tense');
    assert.ok(msg.length > 0 && msg.length <= 45, `${msg.length} chars: ${msg}`);
  }
});

test('leagueMessage: reaching Diamond has its own wording and names the topic', () => {
  const gold = I.leagueMessage(change('silver', 'gold'), 'Cases');
  const diamond = I.leagueMessage(change('gold', 'diamond'), 'Cases');
  assert.ok(diamond.includes('Diamond') && diamond.includes('Cases'), diamond);
  assert.notEqual(diamond.replace('Diamond', 'X'), gold.replace('Gold', 'X'));
});

test('leagueMessage: escapes the topic name', () => {
  const msg = I.leagueMessage(change('gold', 'diamond'), '<b>"Cases"</b> & co');
  assert.ok(!msg.includes('<b>'), msg);
  assert.ok(msg.includes('&lt;b&gt;&quot;Cases&quot;&lt;/b&gt; &amp; co'), msg);
});

/* ---------- weekActivity: answers per day for the past week, with streak days marked ---------- */

test('weekActivity: seven days oldest first, ending today, with weekday names', () => {
  const week = I.weekActivity({}, { today: '2026-10-04' });   // a Sunday
  assert.deepEqual(week.map(d => d.day), ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
  assert.deepEqual(week.map(d => d.weekday), ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  assert.deepEqual(week.map(d => d.today), [false, false, false, false, false, false, true]);
  assert.deepEqual(week.map(d => d.count), [0, 0, 0, 0, 0, 0, 0]);
});

test('weekActivity: crosses month and year boundaries', () => {
  const week = I.weekActivity({}, { today: '2027-01-02' });
  assert.equal(week[0].day, '2026-12-27');
  assert.equal(week[6].day, '2027-01-02');
});

test('weekActivity: adds up every language for a day and ignores days outside the week', () => {
  const days = {
    '2026-10-04': { polish: 12, spanish: 5 },
    '2026-10-02': { spanish: 3 },
    '2026-09-27': { polish: 40 },           // eight days ago
    '2026-10-05': { polish: 9 },            // tomorrow (another time zone, a wrong clock)
  };
  const week = I.weekActivity(days, { today: '2026-10-04' });
  assert.deepEqual(week.map(d => d.count), [0, 0, 0, 0, 3, 0, 17]);
});

test('weekActivity: bad counts and malformed days count as 0, never NaN', () => {
  const days = { '2026-10-04': { polish: NaN, spanish: -4, x: '7', y: 2 }, '2026-10-03': null, '2026-10-02': 5 };
  const week = I.weekActivity(days, { today: '2026-10-04' });
  deepNoNaN(week);
  assert.deepEqual(week.map(d => d.count), [0, 0, 0, 0, 0, 0, 2]);
  assert.deepEqual(I.weekActivity(null, { today: '2026-10-04' }).map(d => d.count), [0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(I.weekActivity(undefined, { today: '2026-10-04' }).map(d => d.count), [0, 0, 0, 0, 0, 0, 0]);
});

test('weekActivity: marks the days of a streak that reaches today', () => {
  const week = I.weekActivity({}, { today: '2026-10-04', profile: { lastDay: '2026-10-04', streak: 3 } });
  assert.deepEqual(week.map(d => d.streak), [false, false, false, false, true, true, true]);
});

test('weekActivity: a streak last extended yesterday is still alive and ends yesterday', () => {
  const week = I.weekActivity({}, { today: '2026-10-04', profile: { lastDay: '2026-10-03', streak: 2 } });
  assert.deepEqual(week.map(d => d.streak), [false, false, false, false, true, true, false]);
});

test('weekActivity: a broken or missing streak marks nothing', () => {
  for (const profile of [{ lastDay: '2026-10-01', streak: 5 }, { lastDay: null, streak: 0 }, {}, null, undefined]) {
    const week = I.weekActivity({}, { today: '2026-10-04', profile });
    assert.ok(week.every(d => !d.streak), JSON.stringify(profile));
  }
});

test('weekActivity: a streak longer than a week marks all seven days', () => {
  const week = I.weekActivity({}, { today: '2026-10-04', profile: { lastDay: '2026-10-04', streak: 30 } });
  assert.ok(week.every(d => d.streak));
});

test('weekActivity: streak days with no logged answers stay marked (logging started after the streak)', () => {
  const week = I.weekActivity({ '2026-10-04': { polish: 6 } }, { today: '2026-10-04', profile: { lastDay: '2026-10-04', streak: 2 } });
  assert.equal(week[5].count, 0); assert.equal(week[5].streak, true);
  assert.equal(week[6].count, 6); assert.equal(week[6].streak, true);
});

/* ---------- leaderboards ---------- */

test('weekStartOf: weeks start on Monday', () => {
  assert.equal(I.weekStartOf('2026-10-04'), '2026-09-28');   // Sunday → the Monday before
  assert.equal(I.weekStartOf('2026-09-28'), '2026-09-28');   // Monday → itself
  assert.equal(I.weekStartOf('2026-10-01'), '2026-09-28');   // Thursday
  assert.equal(I.weekStartOf('2027-01-01'), '2026-12-28');   // across the year
});

const board = (id, data) => ({ id, data });
const TODAY = '2026-10-01';   // a Thursday; the week began on Monday 2026-09-28

test('leaderboards: right answers today, this week and all time, adding up every language', () => {
  const docs = [
    board('a', { name: 'Ana', right: { polish: 50, spanish: 30 }, rightDays: { [TODAY]: { polish: 4, spanish: 3 }, '2026-09-29': { polish: 10 } } }),
    board('b', { name: 'Bo', right: { polish: 60 }, rightDays: { [TODAY]: { polish: 9 }, '2026-09-27': { polish: 40 } } }),   // Sunday: last week
  ];
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right' });
  assert.deepEqual(r.day.map(x => [x.name, x.score]), [['Bo', 9], ['Ana', 7]]);
  assert.deepEqual(r.week.map(x => [x.name, x.score]), [['Ana', 17], ['Bo', 9]]);
  assert.deepEqual(r.all.map(x => [x.name, x.score]), [['Ana', 80], ['Bo', 60]]);
});

test('leaderboards: mastered uses the masteredDays log and the mastered totals', () => {
  const docs = [
    board('a', { name: 'Ana', mastered: { polish: 12 }, masteredDays: { [TODAY]: { polish: 2 } } }),
    board('b', { name: 'Bo', mastered: { polish: 5, spanish: 9 }, masteredDays: { '2026-09-28': { spanish: 3 } } }),
  ];
  const r = I.leaderboards(docs, { today: TODAY, metric: 'mastered' });
  assert.deepEqual(r.day.map(x => [x.name, x.score]), [['Ana', 2]]);
  assert.deepEqual(r.week.map(x => [x.name, x.score]), [['Bo', 3], ['Ana', 2]]);
  assert.deepEqual(r.all.map(x => [x.name, x.score]), [['Bo', 14], ['Ana', 12]]);
});

test('leaderboards: days after today do not count', () => {
  const docs = [board('a', { name: 'Ana', rightDays: { '2026-10-02': { polish: 99 }, [TODAY]: { polish: 1 } } })];
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right' });
  assert.equal(r.week[0].score, 1);
  assert.equal(r.day[0].score, 1);
});

test('leaderboards: hidden learners and zero scores are left out', () => {
  const docs = [
    board('a', { name: 'Ana', hidden: true, right: { polish: 100 } }),
    board('b', { name: 'Bo', right: { polish: 0 } }),
    board('c', { name: 'Cy', right: { polish: 3 } }),
  ];
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right' });
  assert.deepEqual(r.all.map(x => x.name), ['Cy']);
  assert.deepEqual(r.day, []);
});

test('leaderboards: equal scores share a rank (1, 1, 3), ties listed by name', () => {
  const docs = ['Cy', 'Ana', 'Bo'].map((name, i) => board(`u${i}`, { name, right: { polish: name === 'Bo' ? 5 : 8 } }));
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right' });
  assert.deepEqual(r.all.map(x => [x.rank, x.name]), [[1, 'Ana'], [1, 'Cy'], [3, 'Bo']]);
});

test('leaderboards: top 10, plus your own row with its real rank when you are further down', () => {
  const docs = Array.from({ length: 14 }, (_, i) => board(`u${i}`, { name: `L${String(i).padStart(2, '0')}`, right: { polish: 100 - i } }));
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right', uid: 'u12' });
  assert.equal(r.all.length, 11);
  assert.deepEqual(r.all.slice(0, 10).map(x => x.rank), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual([r.all[10].rank, r.all[10].name, r.all[10].you], [13, 'L12', true]);
  const top = I.leaderboards(docs, { today: TODAY, metric: 'right', uid: 'u3' });
  assert.equal(top.all.length, 10);
  assert.equal(top.all.find(x => x.you).rank, 4);
  assert.equal(top.all.filter(x => x.you).length, 1);
});

test('leaderboards: a learner without a name shows as "A learner"; bad numbers count as 0', () => {
  const docs = [
    board('a', { right: { polish: 4 } }),
    board('b', { name: '   ', right: { polish: 'x', spanish: 2 } }),
    board('c', { name: 'Cy', right: { polish: NaN }, rightDays: { [TODAY]: null } }),
    board('d', null),
  ];
  const r = I.leaderboards(docs, { today: TODAY, metric: 'right' });
  deepNoNaN(r);
  assert.deepEqual(r.all.map(x => [x.name, x.score]), [['A learner', 4], ['A learner', 2]]);
});

test('leaderboards: no documents gives three empty lists', () => {
  assert.deepEqual(I.leaderboards([], { today: TODAY, metric: 'right' }), { day: [], week: [], all: [] });
  assert.deepEqual(I.leaderboards(null, { today: TODAY, metric: 'mastered' }), { day: [], week: [], all: [] });
});

/* ---------- regression ---------- */

test('insights.js is a plain script: no import/export, defines INSIGHTS as a global', () => {
  const src = fs.readFileSync(path.join(__dirname, '../core/insights.js'), 'utf8');
  assert.doesNotMatch(src, /^\s*(import|export)\b/m);
  const ctx = vm.createContext({});
  assert.equal(vm.runInContext(`${src}\n;typeof INSIGHTS`, ctx), 'object');
});
