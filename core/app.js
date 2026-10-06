(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const LETTERS = APP.letters;
  const TENSE_COLOURS = ['loc', 'gen', 'ins', 'acc', 'dat', 'voc'];

  /* ---------- topics: cases, plus any tense files that are loaded ---------- */
  const TOPICS = [];
  if (typeof CASES !== 'undefined') TOPICS.push({
    id: 'cases', pl: 'Przypadki', en: 'Cases',
    refLabel: 'Endings', filterLabel: 'Cases to practise', unit: 'case',
    groups: CASES.map(c => ({ ...c, colour: c.id })),
    sentences: SENTENCES.concat(typeof EXTRA_SENTENCES !== 'undefined' ? EXTRA_SENTENCES : [], typeof PRONOUN_SENTENCES !== 'undefined' ? PRONOUN_SENTENCES : [], typeof IDIOM_CASE_SENTENCES !== 'undefined' ? IDIOM_CASE_SENTENCES : []),
    kinds: [['all', 'Everything'], ['nouns', 'Nouns and adjectives', s => s.kind !== 'pronoun'], ['pronouns', 'Pronouns and small words', s => s.kind === 'pronoun'], ['idioms', 'Idioms only', s => !!s.idiom]],
    whyLabel: g => `Why ${g.pl.toLowerCase()}?`,
    refLink: g => `See all ${g.pl.toLowerCase()} endings`,
  });
  const tenseTopic = t => ({
    ...t,
    refLabel: 'Forms', filterLabel: 'Verb groups to practise', unit: 'verb group',
    groups: t.groups.map((g, i) => ({ ...g, colour: g.colour || TENSE_COLOURS[i % TENSE_COLOURS.length] })),
    whyLabel: () => 'Why this form?',
    refLink: g => `See the tables for ${g.en.toLowerCase()}`,
  });
  if (typeof PRESENT_TENSE !== 'undefined') TOPICS.push({
    ...tenseTopic({ ...PRESENT_TENSE, sentences: PRESENT_TENSE.sentences.concat(typeof IDIOM_PRESENT_SENTENCES !== 'undefined' ? IDIOM_PRESENT_SENTENCES : []) }),
    kinds: [['all', 'Everything'], ['idioms', 'Idioms only', s => !!s.idiom]],
  });
  if (typeof PAST_TENSE !== 'undefined') TOPICS.push({
    ...tenseTopic({ ...PAST_TENSE, sentences: PAST_TENSE.sentences.concat(typeof IDIOM_PAST_SENTENCES !== 'undefined' ? IDIOM_PAST_SENTENCES : []) }),
    kinds: [['all', 'Everything'], ['idioms', 'Idioms only', s => !!s.idiom]],
  });
  if (typeof FUTURE_TENSE !== 'undefined') TOPICS.push({
    ...tenseTopic({ ...FUTURE_TENSE, sentences: FUTURE_TENSE.sentences.concat(typeof IDIOM_FUTURE_SENTENCES !== 'undefined' ? IDIOM_FUTURE_SENTENCES : []) }),
    kinds: [['all', 'Everything'], ['idioms', 'Idioms only', s => !!s.idiom]],
  });
  if (typeof NUMBERS !== 'undefined') TOPICS.push({ ...tenseTopic(NUMBERS), filterLabel: 'Number rules to practise', unit: 'rule',
    kinds: [['all', 'Everything'], ['words', 'The noun or verb next to the number', s => s.kind !== 'number'], ['numbers', 'The number itself', s => s.kind === 'number']] });
  if (typeof IDIOMS !== 'undefined') TOPICS.push({ ...tenseTopic(IDIOMS), filterLabel: 'Themes to practise', unit: 'theme' });
  TOPICS.forEach(t => { t.byId = Object.fromEntries(t.groups.map(g => [g.id, g])); t.allIds = t.groups.map(g => g.id); });

  // the folder id (e.g. 'polish'), not APP.lang ('pl'): matches the id account.html groups progress by
  const language = (typeof LANGUAGES !== 'undefined' && LANGUAGES.find(l => l.lang === APP.lang)?.id) || APP.lang;

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };

  const savedSel = store.get(`${APP.storagePrefix}.selected`, {});
  const savedKind = store.get(`${APP.storagePrefix}.kind`, {});   // once a plain string for the cases topic
  const state = {
    topic: TOPICS.find(t => t.id === store.get(`${APP.storagePrefix}.topic`, 'cases')) || TOPICS[0],
    selected: Object.fromEntries(TOPICS.map(t => {
      const ids = (savedSel[t.id] || []).filter(id => t.byId[id]);
      return [t.id, new Set(ids.length ? ids : t.allIds)];
    })),
    view: store.get(`${APP.storagePrefix}.view`, 'table') === 'quiz' ? 'quiz' : 'table',
    showGroup: store.get(`${APP.storagePrefix}.showCase`, true),
    kinds: typeof savedKind === 'string' ? { cases: savedKind } : savedKind,   // topic id -> which words to quiz
    mode: store.get(`${APP.storagePrefix}.mode`, 'type') === 'notebook' ? 'notebook' : 'type',
    length: [10, 20, 50, 0].includes(store.get(`${APP.storagePrefix}.length`, 20)) ? store.get(`${APP.storagePrefix}.length`, 20) : 20,   // 0 = all
    order: store.get(`${APP.storagePrefix}.order`, 'weak') === 'random' ? 'random' : 'weak',
    crib: store.get(`${APP.storagePrefix}.crib`, false) === true,   // keep the tables open beside the quiz
    cribGroup: null,                                                   // the tab picked in that panel when the group is hidden
    quiz: null,
  };

  /* ---------- helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const SUP = { '¹': 1, '²': 2, '³': 3, '⁴': 4 };
  const withNotes = s => esc(s).replace(/[¹²³⁴]/g, d => `<sup>${SUP[d]}</sup>`);
  const markEndings = s => esc(s).replace(/\[([^\]]*)\]/g, '<b>$1</b>');
  const colour = name => `--c: var(--${name})`;
  const sel = () => state.selected[state.topic.id];
  const hasKinds = () => !!state.topic.kinds && state.topic.kinds.slice(1).every(k => state.topic.sentences.some(k[2]));
  const kindNow = () => (hasKinds() && state.topic.kinds.find(k => k[0] === state.kinds[state.topic.id])) || ['all'];
  const kindOk = s => !kindNow()[2] || kindNow()[2](s);
  const pool = () => state.topic.sentences.filter(s => sel().has(s.c) && kindOk(s));
  const selectedGroups = () => state.topic.groups.filter(g => sel().has(g.id));
  const allSelected = () => sel().size === state.topic.allIds.length;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- progress: one record per sentence, kept in this browser ---------- */
  const keyOf = (topic, s) => `${topic.id}|${s.c}|${s.s}|${s.base}`;
  const progress = store.get(`${APP.storagePrefix}.progress`, {});
  const recordOf = s => progress[keyOf(state.topic, s)];
  const saveProgress = (answered = false) => { store.set(`${APP.storagePrefix}.progress`, progress); window.cloudSync?.(answered); };   // core/sync.js saves it to the account too

  function record(item, right) {
    const k = keyOf(state.topic, item);
    const r = progress[k] || { n: 0, ok: 0, streak: 0 };
    r.n += 1;
    if (right) { r.ok += 1; r.streak += 1; } else r.streak = 0;
    r.last = right ? 1 : 0;
    r.t = Date.now();
    progress[k] = r;
    saveProgress({ right, mastered: right && r.streak === 2 });   // core/sync.js counts these for the leaderboards
    renderForgotten();
  }

  const mastered = r => !!r && r.streak >= 2;    // right twice in a row
  const weak = r => !!r && r.last === 0;

  /* ---------- forgotten words banner: a slim strip listing words often missed across every topic ---------- */
  const wordGlosses = {};       // base -> first gloss found, across all topics
  const sentenceOfKey = {};     // progress key -> its sentence, so a chip can show the correct form(s)
  TOPICS.forEach(t => t.sentences.forEach(s => {
    if (!(s.base in wordGlosses)) wordGlosses[s.base] = s.gloss;
    sentenceOfKey[keyOf(t, s)] = s;
  }));

  function renderForgotten() {
    const aside = $('#forgotten');
    if (!aside || typeof INSIGHTS === 'undefined') return;
    const words = INSIGHTS.forgottenWords(progress, { glosses: wordGlosses });
    aside.hidden = !words.length;
    if (!words.length) { aside.innerHTML = ''; return; }
    aside.innerHTML = `<h2 id="forgotten-title">Words you keep forgetting</h2>
      <ul class="forgotten-list">${words.map(w => {
        const forms = [...new Set(w.keys.map(k => sentenceOfKey[k]?.a?.[0]).filter(Boolean))];
        return `<li class="forgotten-chip" tabindex="0" data-gloss="${esc(forms.join(', '))}"><b lang="${APP.lang}">${esc(w.base)}</b><span>${esc(w.gloss)}</span></li>`;
      }).join('')}</ul>
      <p class="forgotten-practise">Practise ${INSIGHTS.forgottenByTopic(words).map(g => {
        const t = TOPICS.find(x => x.id === g.topic);
        return t ? `<button type="button" class="btn" data-action="practise-forgotten" data-topic="${esc(t.id)}">${esc(t.en)} <span>${plural(g.keys.length, 'sentence')}</span></button>` : '';
      }).join('')}</p>`;
  }

  // A quiz of the sentences missed for the forgotten words of one topic; answering one right takes its word off the list
  function practiseForgotten(topicId) {
    const group = INSIGHTS.forgottenByTopic(INSIGHTS.forgottenWords(progress, { glosses: wordGlosses })).find(g => g.topic === topicId);
    if (!group) return;
    if (state.topic.id !== topicId) setTopic(topicId);
    startQuiz(group.keys.map(k => sentenceOfKey[k]).filter(Boolean), true);
  }

  function groupStats(items) {
    const out = { total: items.length, seen: 0, mastered: 0, weak: 0, n: 0, ok: 0 };
    items.forEach(s => {
      const r = recordOf(s);
      if (!r) return;
      out.seen++; out.n += r.n; out.ok += r.ok;
      if (mastered(r)) out.mastered++;
      if (weak(r)) out.weak++;
    });
    return out;
  }

  // Unseen and recently missed sentences first, mastered ones last, random within each band.
  function orderWeakFirst(items) {
    const band = s => { const r = recordOf(s); return !r ? 1 : weak(r) ? 0 : mastered(r) ? 3 : 2; };
    return shuffle(items).map((s, i) => [band(s), i, s]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  }

  /* an unfinished quiz survives a page reload */
  function saveQuiz() {
    const q = state.quiz;
    if (!q || q.idx >= q.queue.length) { store.set(`${APP.storagePrefix}.resume`, null); return; }
    store.set(`${APP.storagePrefix}.resume`, {
      topic: state.topic.id, idx: q.idx,
      queue: q.queue.map(s => keyOf(state.topic, s)),
      results: q.results.map(r => ({ key: keyOf(state.topic, r.item), right: r.right, solved: r.solved, mode: r.mode })),
      revealed: q.revealed, checked: q.checked, firstTryRight: q.firstTryRight, feedback: q.feedback, typed: q.typed, partial: q.partial || null,
      before: q.before,
    });
  }
  function savedQuiz() {
    const r = store.get(`${APP.storagePrefix}.resume`, null);
    if (!r || r.topic !== state.topic.id) return null;
    const byKey = Object.fromEntries(state.topic.sentences.map(s => [keyOf(state.topic, s), s]));
    const queue = r.queue.map(k => byKey[k]).filter(Boolean);
    if (queue.length !== r.queue.length || r.idx >= queue.length) return null;
    return {
      queue, idx: r.idx, results: r.results.map(x => ({ item: byKey[x.key], right: x.right, solved: x.solved ?? x.right, mode: x.mode })).filter(x => x.item),
      revealed: !!r.revealed, checked: !!r.checked, firstTryRight: !!r.firstTryRight, feedback: r.feedback || null, typed: r.typed || '', partial: r.partial || null,
      before: r.before || undefined,
    };
  }
  function resumeQuiz() {
    const saved = savedQuiz();
    if (!saved) return;
    state.quiz = saved;
    setView('quiz');
    scrollToQuiz();
  }

  const normalise = s => s.toLocaleLowerCase(APP.lang).replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  const stripMarks = APP.stripMarks;

  // Answers of more than one word are checked word by word. A right word counts once and stays right, and the
  // sentence is right when all of them are. Typing every word checks them place by place; typing fewer checks
  // them against the words still missing. Returns { ai, done, n } for the answer the guess gets closest to.
  function matchWords(answers, guess, partial) {
    const words = guess.split(' ');
    let best = null;
    answers.forEach((a, ai) => {
      const want = a.split(' ');
      if (want.length < 2) return;
      const done = partial && partial.ai === ai && partial.done.length === want.length ? partial.done.slice() : want.map(() => false);
      if (words.length === want.length) words.forEach((w, i) => { if (w === want[i]) done[i] = true; });
      else words.forEach(w => { const i = want.findIndex((x, j) => !done[j] && x === w); if (i >= 0) done[i] = true; });
      const n = done.filter(Boolean).length;
      if (!best || n > best.n) best = { ai, done, n };
    });
    return best;
  }
  const capitalize = w => w.charAt(0).toLocaleUpperCase(APP.lang) + w.slice(1);
  const answerWords = (item, ai) => item.a[ai].trim().split(/\s+/);

  // "Nie{not} mam{I have} ___." -> [{word, gloss} | {gap} | {punct}]
  function parseSentence(src) {
    const out = [];
    const re = /(___)|([^\s{}]+)\{([^}]*)\}|([^\s{}]+)/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) out.push({ gap: true });
      else if (m[2]) { const [gloss, tag] = m[3].split('|'); out.push({ word: m[2].replace(/_/g, ' '), gloss, tag }); }
      else out.push({ punct: m[4] });
    }
    return out;
  }
  const OPENERS = /^[„(]+$/;
  function joinTokens(tokens, render) {
    let html = '';
    tokens.forEach((tok, i) => {
      const prev = tokens[i - 1];
      const glue = i === 0 || (tok.punct && !OPENERS.test(tok.punct)) || (prev && prev.punct && OPENERS.test(prev.punct));
      html += (glue ? '' : ' ') + render(tok);
    });
    return html;
  }

  /* ---------- topic switch ---------- */
  function renderTopics() {
    const el = $('#topics');
    el.hidden = TOPICS.length < 2;
    el.innerHTML = TOPICS.map(t => `
      <button type="button" class="topic-btn" data-topic="${t.id}" ${t === state.topic ? 'aria-current="true"' : ''}>
        <b>${esc(t.en)}</b><span lang="${APP.lang}">${esc(t.pl)}</span>
      </button>`).join('');
  }

  const quizzes = {};   // topic id -> its quiz, kept for this visit so Back to a topic returns to where you were
  function setTopic(id, push = true) {
    quizzes[state.topic.id] = state.quiz;
    state.topic = TOPICS.find(t => t.id === id) || TOPICS[0];
    store.set(`${APP.storagePrefix}.topic`, state.topic.id);
    state.quiz = quizzes[state.topic.id] || null;
    if (push) pushPage();
    renderTopics();
    renderFilter();
    renderView();
  }

  /* ---------- filter (the pasiak) ---------- */
  function renderFilter() {
    const t = state.topic;
    $('#filter-label').textContent = t.filterLabel;
    $('#pasiak').innerHTML = t.groups.map(g => `
      <button type="button" class="stripe" style="${colour(g.colour)}" data-group="${g.id}" aria-pressed="${sel().has(g.id)}">
        <span class="s-pl" lang="${APP.lang}">${esc(g.pl)}</span>
        <span class="s-q" lang="${APP.lang}">${esc(g.q)}</span>
        <span class="s-en">${esc(g.en)}</span>
      </button>`).join('');
    const count = plural(pool().length, 'sentence');
    $('#filter-status').textContent = allSelected()
      ? `All ${plural(t.allIds.length, t.unit)} selected, ${count}. Pick a stripe to practise only that one.`
      : `${selectedGroups().map(g => g.pl).join(', ')} selected, ${count}. Pick more stripes to add them.`;
    $('#all-groups').hidden = allSelected();
    $('#all-groups').textContent = `Select all ${t.allIds.length}`;
    $('.view-btn[data-view="table"]').textContent = t.refLabel;
  }

  function toggleGroup(id) {
    const t = state.topic, s = sel();
    if (allSelected()) state.selected[t.id] = new Set([id]);          // from "everything" a click means "only this"
    else if (s.has(id) && s.size === 1) state.selected[t.id] = new Set(t.allIds); // never leave nothing selected
    else if (s.has(id)) s.delete(id);
    else s.add(id);
    afterFilterChange();
  }

  function afterFilterChange() {
    store.set(`${APP.storagePrefix}.selected`, Object.fromEntries(Object.entries(state.selected).map(([k, v]) => [k, [...v]])));
    state.quiz = null;
    renderFilter();
    renderView();
  }

  /* ---------- reference view: shared pieces ---------- */
  const startRow = () => `
    <div class="start-row">
      <button type="button" class="btn primary" data-action="start">Start quiz</button>
      <p>${plural(pool().length, 'sentence')} for ${allSelected() ? `all ${plural(state.topic.allIds.length, state.topic.unit)}` : 'your selection'}. ${state.length && state.length < pool().length ? `A quiz draws ${state.length} of them at random.` : ''}</p>
    </div>`;

  const band = (g, extra) => `
    <div class="case-band">
      <h2 lang="${APP.lang}">${esc(g.pl)}</h2><span class="q" lang="${APP.lang}">${esc(g.q)}</span>
      <span class="en">${esc(extra)}</span>
    </div>
    <p class="case-summary">${esc(g.summary)}</p>`;

  const useList = items => `<ul class="uses">${items.map(u => `<li>${esc(u.t)}
    <span class="ex" lang="${APP.lang}">${esc(u.ex)}</span><span class="ex-en">${esc(u.en)}</span></li>`).join('')}</ul>`;

  const watchList = items => items && items.length
    ? `<h3>Watch out</h3><ul class="watch">${items.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '';

  /* ---------- reference view: cases ---------- */
  function gridRow(row, hl, names) {
    let col = 0;
    return `<tr><th scope="row" class="g-label">${esc(row.label)}</th>${row.cells.map(c => {
      const from = col, to = col + (c.span || 1); col = to;
      const on = hl && hl.rows.has(row.label) && hl.col >= from && hl.col < to;
      const label = to - from === 4 ? 'all genders' : names.slice(from, to).join(', ');
      return `
      <td class="g-cell t-${c.tint} ${on ? 'hl' : ''}" ${c.span ? `colspan="${c.span}"` : ''} data-col="${esc(label)}">
        <span class="g-end">${withNotes(c.end)}</span>
        <span class="g-ex" lang="${APP.lang}">${esc(c.ex)}</span>
        ${c.eq ? `<span class="g-eq">${esc(c.eq)}</span>` : ''}
      </td>`; }).join('')}</tr>`;
  }

  // A number where every cell is "= N" (the vocative plural) shows the nominative's own forms instead of "no change".
  // Their footnote marks point at the nominative's notes, so they are dropped here.
  const sameAsNominative = (c, number) => c.id !== 'nom' && c.grid[number].every(r => r.cells.every(x => x.eq === '= N'))
    && CASES.some(x => x.id === 'nom');
  const gridRows = (c, number) => !sameAsNominative(c, number) ? c.grid[number]
    : CASES.find(x => x.id === 'nom').grid[number].map(r => ({ ...r, cells: r.cells.map(x => ({ ...x, end: x.end.replace(/[¹²³⁴]/g, '') })) }));
  const gridTitle = (c, number) => `${esc(c.en)} ${number === 'sg' ? 'singular' : 'plural'}${sameAsNominative(c, number)
    ? ` <span class="g-same">same as the nominative ${number === 'sg' ? 'singular' : 'plural'}</span>` : ''}`;

  function caseGrid(c, hl, only) {
    const sg = hl && hl.number === 'sg' ? hl : null, pl = hl && hl.number === 'pl' ? hl : null;
    const singular = `
        <caption>${gridTitle(c, 'sg')}</caption>
        <colgroup><col class="col-label"><col><col><col><col></colgroup>
        <thead>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th></tr>
          <tr><th class="g-sub t-m1">animate</th><th class="g-sub t-m2">inanimate</th></tr>
        </thead>
        <tbody>${gridRows(c, 'sg').map(r => gridRow(r, sg, COL_NAMES.sg)).join('')}</tbody>`;
    const plural = `
        <tbody>
          <tr><th colspan="5" class="g-title">${gridTitle(c, 'pl')}</th></tr>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th></tr>
          <tr><th class="g-sub t-m1">personal (men)</th><th class="g-sub t-m2">other</th></tr>
          ${gridRows(c, 'pl').map(r => gridRow(r, pl, COL_NAMES.pl)).join('')}
        </tbody>`;
    if (only) return `<div class="table-wrap grid-wrap mini"><table class="gtable">${only === 'sg' ? singular : `<caption>${gridTitle(c, 'pl')}</caption><colgroup><col class="col-label"><col><col><col><col></colgroup>` + plural}</table></div>`;
    return `<div class="table-wrap grid-wrap">
      <table class="gtable">${singular}${plural}
      </table>
    </div>
    <ul class="g-notes">${c.notes.map(n => `<li>${withNotes(n)}</li>`).join('')}</ul>`;
  }

  // Which cell of the case grid a quiz item lands on
  const COL = { m1: 0, m2: 1, n: 2, f: 3 };
  const COL_NAMES = { sg: ['masculine animate', 'masculine inanimate', 'neuter', 'feminine'], pl: ['masculine personal', 'other masculine', 'neuter', 'feminine'] };
  function itemHighlight(item) {
    if (state.topic.id !== 'cases' || item.kind === 'pronoun' || typeof GENDERS === 'undefined') return null;
    const words = item.base.trim().split(/\s+/);
    const noun = words.find(w => GENDERS[w]);
    if (!noun) return null;
    const number = item.hint === 'plural' || PLURAL_ONLY.includes(noun) ? 'pl' : 'sg';
    // a word that is not a noun is the adjective (duży dom); pan Nowak is two nouns, both on the noun row
    const adjective = words.some(w => !GENDERS[w]);
    const rows = new Set(['Nouns']);
    if (adjective) rows.add('Adjectives');
    return { number, col: COL[GENDERS[noun]], rows, label: `${COL_NAMES[number][COL[GENDERS[noun]]]} ${number === 'sg' ? 'singular' : 'plural'}${adjective ? ', noun and adjective' : ''}` };
  }

  // Six slots per word: masc. animate, masc. inanimate, neuter, feminine, plural with men, other plural
  function possessiveForms(p, caseId) {
    if (p.fixed) return Array(6).fill(p.fixed);
    const ego = p.stem + 'ego', emu = p.stem + 'emu', ej = p.stem + 'ej', a = p.stem + 'ą';
    const im = p.stemI + 'm', ich = p.stemI + 'ch', imi = p.stemI + 'mi';
    return {
      nom: [p.m, p.m, p.n, p.f, p.pm, p.po],
      gen: [ego, ego, ego, ej, ich, ich],
      dat: [emu, emu, emu, ej, im, im],
      acc: [ego, p.m, p.n, p.accF, ich, p.po],
      ins: [im, im, im, a, imi, imi],
      loc: [im, im, im, ej, ich, ich],
      voc: [p.m, p.m, p.n, p.f, p.pm, p.po],
    }[caseId];
  }

  // items: [{ word, en, forms: six strings }] in the order masc animate, masc inanimate, neuter, feminine, plural with men, other plural
  // hl: from pronounHighlight, marks the answer's cell in its word's row
  function sixSlotGrid(caption, items, notes, hl) {
    const rows = items.map(({ word, en, forms: f }) => {
      const head = `<th scope="row" class="g-label"><span lang="${APP.lang}">${esc(word)}</span><small>${esc(en)}</small></th>`;
      const pair = (i, tintBoth, tintX, tintY, lx, ly, lboth) => f[i] === f[i + 1]
        ? [{ x: f[i], tint: tintBoth, label: lboth, span: 2, slots: [i, i + 1] }]
        : [{ x: f[i], tint: tintX, label: lx, slots: [i] }, { x: f[i + 1], tint: tintY, label: ly, slots: [i + 1] }];
      const cells = f.every(x => x === f[0])
        ? [{ x: f[0], tint: 'all', label: 'every form', span: 6, slots: [0, 1, 2, 3, 4, 5], eq: 'never changes' }]
        : [...pair(0, 'm', 'm1', 'm2', 'masculine animate', 'masculine inanimate', 'masculine'),
          { x: f[2], tint: 'n', label: 'neuter', slots: [2] },
          { x: f[3], tint: 'f', label: 'feminine', slots: [3] },
          ...pair(4, 'all', 'm1', 'all', 'plural with men', 'other plural', 'plural')];
      if (hl && hl.word === word) {
        const hits = cells.filter(c => hl.forms.has(c.x.toLocaleLowerCase(APP.lang)));
        const exact = hits.filter(c => hl.slots && c.slots.some(i => hl.slots.includes(i)));
        (exact.length ? exact : hits).forEach(c => { c.on = true; });
      }
      return `<tr>${head}${cells.map(c => `<td class="g-cell t-${c.tint} ${c.on ? 'hl' : ''}" ${c.span ? `colspan="${c.span}"` : ''} data-col="${esc(c.label)}"><span class="g-form" lang="${APP.lang}">${esc(c.x)}</span>${c.eq ? `<span class="g-eq">${c.eq}</span>` : ''}</td>`).join('')}</tr>`;
    }).join('');
    return `<div class="table-wrap grid-wrap">
      <table class="gtable words">
        <caption>${esc(caption)}</caption>
        <colgroup><col class="col-label"><col><col><col><col><col><col></colgroup>
        <thead>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th>
            <th colspan="2" class="g-head t-all">plural</th></tr>
          <tr><th class="g-sub t-m1">animate</th><th class="g-sub t-m2">inanimate</th>
            <th class="g-sub t-m1">with men</th><th class="g-sub t-all">other</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${notes.length ? `<ul class="g-notes">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  }

  const possessiveGrid = (c, hl) => sixSlotGrid(`${c.en}: my, your, his, her, our, their, this`,
    PRONOUNS.possessives.map(p => ({ word: p.word, en: p.en, forms: possessiveForms(p, c.id) })), PRONOUNS.possessiveNotes, hl);

  const smallWords = () => typeof SMALL_WORDS !== 'undefined' ? SMALL_WORDS : [];
  const smallWordsPersonal = () => typeof SMALL_WORDS_PERSONAL !== 'undefined' ? SMALL_WORDS_PERSONAL : [];
  const smallWordsGrid = (c, hl) => smallWords().length
    ? sixSlotGrid(`${c.en}: which, whose, every, all, other`, smallWords().map(w => ({ word: w.word, en: w.en, forms: w.forms[c.id] })),
        smallWords().filter(w => w.note).map(w => `${w.word}: ${w.note}`), hl)
    : '';

  function personalTable(c, hl) {
    const prep = PRONOUNS.prepositions[c.id];
    const rows = PRONOUNS.personal.concat(smallWordsPersonal()).map(p => {
      const [plain, after] = p[c.id];
      // a cell such as "go, jego" matches either form; when both columns match, the word before the gap decides
      const has = text => !!hl && hl.word === p.word && text.split(/,\s*/).some(x => hl.forms.has(x.toLocaleLowerCase(APP.lang)));
      let onPlain = has(plain), onAfter = !!prep && has(after || plain);
      if (onPlain && onAfter) { onPlain = !hl.afterPrep; onAfter = hl.afterPrep; }
      return `<tr><th scope="row" class="g-label"><span lang="${APP.lang}">${esc(p.word)}</span><small>${esc(p.en)}</small></th>
        <td class="g-cell t-all ${onPlain ? 'hl' : ''}" data-col="${esc(c.en.toLowerCase())}"><span class="g-form" lang="${APP.lang}">${esc(plain)}</span></td>
        ${prep ? `<td class="g-cell t-all ${after ? 'changed' : ''} ${onAfter ? 'hl' : ''}" data-col="after a preposition"><span class="g-form" lang="${APP.lang}">${esc(after || plain)}</span></td>` : ''}</tr>`;
    }).join('');
    return `<div class="table-wrap grid-wrap">
      <table class="gtable words narrow">
        <caption>${esc(c.en)}: who, what, me, you, him, her</caption>
        <thead><tr><th class="g-label">Nominative</th><th scope="col" class="g-head t-all">${esc(c.en.toLowerCase())}</th>
          ${prep ? `<th scope="col" class="g-head t-all">after a preposition<small lang="${APP.lang}">${esc(prep)}</small></th>` : ''}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <ul class="g-notes">${PRONOUNS.personalNotes[c.id].map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
  }

  function pronounBlock(c, hl) {
    if (c.id === 'voc') return `<h3>Pronouns and small words</h3><p class="plain-note">${esc(PRONOUNS.vocNote)}</p>`;
    return `<h3>Pronouns and small words</h3>
      <p class="plain-note">${c.id === 'nom' ? esc(PRONOUNS.nomNote) : 'These words do not follow the noun endings above. Each has its own form in this case.'}</p>
      ${c.id === 'nom' ? '' : personalTable(c, hl)}
      ${possessiveGrid(c, hl)}
      ${smallWordsGrid(c, hl)}`;
  }

  // Where a pronoun sentence's answer sits: the row is the dictionary word, the cell is the one holding the answer.
  // The gender tag of the noun after the gap (siostry{sister|f}) picks the column when a form shows up in several.
  const PREPOSITIONS = new Set('bez dla do dzięki koło ku między na nad o obok od oprócz po pod przed przeciwko przez przy u w we wobec z za zamiast ze'.split(' '));
  const TAG_SLOTS = { m1: [0], m2: [1], m: [0, 1], n: [2], f: [3], 'm1.pl': [4], 'm.pl': [4], 'm2.pl': [5], 'n.pl': [5], 'f.pl': [5] };
  function pronounHighlight(item) {
    const toks = parseSentence(item.s).filter(t => !t.punct);
    const gap = toks.findIndex(t => t.gap);
    const before = toks[gap - 1], tagged = toks.slice(gap + 1, gap + 3).find(t => t.tag);
    const slots = tagged ? TAG_SLOTS[tagged.tag] : null;
    const SLOT_NAMES = ['masculine animate', 'masculine inanimate', 'masculine', 'neuter', 'feminine', 'plural with men', 'other plural'];
    const slotName = !slots ? '' : slots.length === 2 ? 'masculine' : SLOT_NAMES[slots[0] + (slots[0] >= 2 ? 1 : 0)];
    return {
      word: item.base, slots,
      forms: new Set(item.a.map(a => a.toLocaleLowerCase(APP.lang))),
      afterPrep: !!before && !!before.word && PREPOSITIONS.has(before.word.toLocaleLowerCase(APP.lang)),
      label: `${item.base}${slotName ? `, ${slotName}` : ''}`,
    };
  }

  function overviewTable(block) {
    const tints = ['t-m', 't-n', 't-f', 't-all'];
    const rows = selectedGroups().map(c => `
      <tr style="${colour(c.colour)}">
        <th scope="row" class="case-name"><a href="#ref-${c.id}" lang="${APP.lang}">${esc(c.pl)}</a><span>${esc(c.en)}, <i lang="${APP.lang}">${esc(c.q)}</i></span></th>
        ${block.rows[c.id].map((cell, i) => `<td class="ov-cell ${tints[i]}" data-col="${esc(block.cols[i].toLowerCase())}">${esc(cell)}</td>`).join('')}
      </tr>`).join('');
    return `<h3>${esc(block.title)}</h3>
      <div class="table-wrap"><table class="ov-table">
        <thead><tr><th scope="col">Case</th>${block.cols.map((h, i) => `<th scope="col" class="g-head ${tints[i]}">${h.toLowerCase()}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function soundsSection() {
    if (typeof SOFTENING === 'undefined') return '';
    return `<section class="case sounds" id="ref-sounds" style="--c: var(--ink)">
      <div class="case-band"><h2>Sound changes</h2><span class="q">okno → w oknie, stół → na stole</span><span class="en">What happens to the stem when an ending is added</span></div>
      <p class="case-summary">${esc(SOFTENING_INTRO)}</p>
      <h3>Softening before -e and -i</h3>
      <div class="table-wrap"><table class="sounds-table">
        <thead><tr><th scope="col">Hard, then soft</th><th scope="col">Examples</th></tr></thead>
        <tbody>${SOFTENING.map(r => `<tr><td class="snd" lang="pl">${esc(r.hard)} → ${esc(r.soft)}</td><td lang="pl">${esc(r.ex)}</td></tr>`).join('')}</tbody>
      </table></div>
      <h3>Where you meet it</h3>
      <ul class="watch">${SOFTENING_WHERE.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
      <h3>Vowels that shift</h3>
      <div class="table-wrap"><table class="sounds-table">
        <thead><tr><th scope="col">Shift</th><th scope="col">Examples and when</th></tr></thead>
        <tbody>${VOWEL_CHANGES.map(r => `<tr><td class="snd" lang="pl">${esc(r.from)} → ${esc(r.to)}</td><td lang="pl">${esc(r.ex)}<span class="when">${esc(r.when)}</span></td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;
  }

  const caseSection = c => `<article class="case" id="ref-${c.id}" style="${colour(c.colour)}">
      ${band(c, `${c.en}, “${c.qEn}”`)}
      <h3>When to use it</h3>
      ${useList(c.uses)}
      <h3>Which ending</h3>
      ${caseGrid(c)}
      ${pronounBlock(c)}
      ${watchList(c.watch)}
    </article>`;

  /* ---------- reference view: tenses ---------- */
  // hl = { rows: Set of row indexes, cols: Set of column indexes } or null
  // Colours for tables whose columns are all tint 'all': a person keeps one colour in every table (yo, tú, él...),
  // other columns (-ar, -er, -ir; ser, estar, ir; indefinido, imperfecto) take tints k1-k4 in order,
  // and example or translation columns stay plain.
  const personKey = label => {
    const ws = words(label);
    const p = TABLE_PERSONS.find(x => PERSON[x].some(tok => ws.includes(tok)));
    return p && `p${ORDINAL[p]}${PLURAL_P.has(p) ? 'pl' : 'sg'}`;
  };
  const PLAIN_COL = new RegExp(`^(example|english|${APP.languageName}|literally|meaning|used for|watch)$`, 'i');
  const ENDING_TINT = { ar: 'k1', er: 'k2', ir: 'k3' };   // -ar, -er and -ir keep one colour in every table
  function colTints(t) {
    if (t.cols.some(c => c.tint !== 'all')) return t.cols.map(c => c.tint);
    const ending = c => { const m = c.label.trim().match(/^-(ar|er|ir)\b/i); return m && ENDING_TINT[m[1].toLowerCase()]; };
    const taken = new Set(t.cols.map(ending).filter(Boolean));
    const free = ['k1', 'k2', 'k3', 'k4'].filter(k => !taken.has(k));
    let k = 0;
    return t.cols.map(c => personKey(c.label) || ending(c) || (PLAIN_COL.test(c.label.trim()) ? 'all' : free[k++ % free.length]));
  }
  // Phones: with APP.phoneTables === 'by-column', a table whose rows are all persons is also drawn as one small table per column
  // (-ar, then -er, then -ir), each listing every person with its form. CSS shows these instead of the full table at phone width.
  // A verb's drop-down with a single column of forms is drawn the same way, as one person | form list.
  const byColumn = t => ((APP.phoneTables === 'by-column' && t.cols.length > 1) || (t.part && t.cols.length === 1))
    && t.rows.length > 1 && t.rows.every(r => personKey(r.who));
  function columnBlocks(t, hl, tints) {
    const title = t.title || '', verbs = (title.split(':')[1] !== undefined ? title.split(':')[0] : '').split(/\s*,\s*/);   // "hablar, comer, vivir: ..."
    const heading = (c, i) => {
      const label = c.label.toLowerCase(), m = label.match(/^-(ar|er|ir)$/), v = verbs.length === t.cols.length && verbs[i];
      return m && v && v.toLowerCase().endsWith(m[1]) ? `${label} · ${v}` : label;
    };
    return `<div class="by-col">
      ${title ? `<p class="by-col-title">${esc(title)}</p>` : ''}
      ${t.cols.map((c, i) => `<table class="ptable">
        <caption class="g-head t-${tints[i]}">${esc(heading(c, i))}</caption>
        <tbody>${t.rows.map((r, ri) => `<tr><th scope="row" class="g-label r-${personKey(r.who)}" lang="${APP.lang}">${esc(r.who)}</th>
          <td class="g-cell t-${tints[i]} ${hl && hl.rows.has(ri) && hl.cols.has(i) ? 'hl' : ''}"><span class="g-form" lang="${APP.lang}">${markEndings(r.cells[i])}</span></td></tr>`).join('')}</tbody>
      </table>`).join('')}
    </div>`;
  }
  // A table with one verb per row and every person's form in t.forms (parts of { cols, who }, each row's forms one entry per
  // who, in order): each verb is a drop-down that opens on all its forms. The verb a quiz item lands on opens by itself.
  const hasForms = t => Array.isArray(t.forms) && t.rows.every(r => Array.isArray(r.forms));
  function verbList(t, hl, mini) {
    return `<div class="verb-list${mini ? ' mini' : ''}">
      <p class="verb-list-title">${esc(t.title)}</p>
      ${t.rows.map((r, ri) => {
        let k = 0;
        const parts = t.forms.map(part => tenseTable({ part: true, cols: part.cols, rows: part.who.map(who => ({ who, cells: [].concat(r.forms[k++]) })) }, null, true));
        return `<details class="verb"${hl && !hl.weak && hl.rows.has(ri) ? ' open' : ''}>
        <summary><span class="verb-name" lang="${APP.lang}">${esc(r.who)}</span></summary>
        ${parts.join('')}
      </details>`;
      }).join('')}
    </div>`;
  }
  const tenseTable = (t, hl, mini) => { const tints = colTints(t), split = byColumn(t);
    if (hasForms(t)) return `${verbList(t, hl, mini)}${!mini && t.note ? `<ul class="g-notes"><li>${esc(t.note)}</li></ul>` : ''}`;
    return `<div class="table-wrap grid-wrap ${mini ? 'mini' : ''}${split ? ' has-by-col' : ''}">
      <table class="gtable tense">
        ${t.title ? `<caption>${esc(t.title)}</caption>` : ''}
        <thead><tr><th class="g-label"></th>${t.cols.map((c, i) => `<th scope="col" class="g-head t-${tints[i]}">${esc(c.label.toLowerCase())}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((r, ri) => `<tr><th scope="row" class="g-label${personKey(r.who) ? ` r-${personKey(r.who)}` : ''}" lang="${APP.lang}">${esc(r.who)}</th>
          ${r.cells.map((cell, i) => `<td class="g-cell t-${tints[i]} ${hl && hl.rows.has(ri) && hl.cols.has(i) ? 'hl' : ''}" data-col="${esc(t.cols[i].label)}"><span class="g-form" lang="${APP.lang}">${markEndings(cell)}</span></td>`).join('')}</tr>`).join('')}</tbody>
      </table>${split ? columnBlocks(t, hl, tints) : ''}
    </div>${!mini && t.note ? `<ul class="g-notes"><li>${esc(t.note)}</li></ul>` : ''}`; };

  /* ---------- which cells of a verb table a quiz item lands on ---------- */
  // Person tokens as they appear in row and column labels, keyed by the item's p field.
  const PERSON = {
    ja: ['ja'], ty: ['ty'], on: ['on'], ona: ['ona'], ono: ['ono'], my: ['my'], wy: ['wy'], oni: ['oni'], one: ['one'],
    yo: ['yo'], 'tú': ['tú'], 'él': ['él', 'ella', 'usted'], nosotros: ['nosotros', 'nosotras'], ellos: ['ellos', 'ellas', 'ustedes'],
  };
  const PLURAL_P = new Set(['my', 'wy', 'oni', 'one', 'nosotros', 'ellos']);
  const ORDINAL = { ja: 1, ty: 2, on: 3, ona: 3, ono: 3, my: 1, wy: 2, oni: 3, one: 3, yo: 1, 'tú': 2, 'él': 3, nosotros: 1, ellos: 3 };
  const words = s => s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  const ALL_PERSON = new Set(Object.values(PERSON).flat());
  const TABLE_PERSONS = APP.lang === 'pl' ? ['ja', 'ty', 'on', 'ona', 'ono', 'my', 'wy', 'oni', 'one'] : ['yo', 'tú', 'él', 'nosotros', 'ellos'];

  // gender the answer form shows: from p (on/ona/ono/oni/one) or from the hint ("a man", "women", "men and women")
  function itemGender(item) {
    const p = item.p, h = (item.hint || '').toLowerCase();
    if (p === 'ona') return 'f'; if (p === 'ono') return 'n'; if (p === 'on') return 'm';
    if (p === 'oni') return 'mp'; if (p === 'one') return 'np';
    if (/\bwomen\b|\ba woman\b/.test(h) && !/\bmen\b|\bman\b/.test(h)) return PLURAL_P.has(p) ? 'np' : 'f';
    if (/\bmen\b|\ba man\b/.test(h)) return PLURAL_P.has(p) ? 'mp' : 'm';
    return null;
  }

  function tableHighlight(t, item) {
    const p = item.p; if (!p || !PERSON[p]) return null;
    const toks = PERSON[p], plural = PLURAL_P.has(p), g = itemGender(item), ord = ORDINAL[p];
    const infs = item.base.toLowerCase().split(/\s*\/\s*/).map(s => s.replace(/\b(się|se)\b/g, '').trim()).filter(Boolean)   // "pisać / napisać", "uczyć się", "levantarse"
      .flatMap(s => /(ar|er|ir|ír)se$/.test(s) ? [s, s.slice(0, -2)] : [s]);   // levantarse also matches rows and columns for levantar
    const inf = infs.find(s => !/(ar|er|ir|ír)se$/.test(s)) || infs[0] || '';
    const hasPerson = ws => ws.some(w => toks.includes(w));
    const hasInf = label => { const ws = words(label); return infs.some(i => words(i).every(w => ws.includes(w))); };
    const hasGender = ws => ws.some(w => /^(masculine|feminine|neuter|groups|everyone|singular|plural|men|others)$/.test(w));
    const genderOk = (label) => {
      const l = label.toLowerCase();
      if (/singular/.test(l)) return !plural; if (/plural/.test(l)) return plural;
      if (/groups with a man|\bmen\b/.test(l)) return g === 'mp'; if (/everyone|others|else/.test(l)) return g === 'np';
      if (/masculine/.test(l)) return g === 'm'; if (/feminine/.test(l)) return g === 'f'; if (/neuter/.test(l)) return g === 'n';
      return false;
    };
    const ordOk = label => { const m = label.match(/(\d)(st|nd|rd)\s+person/i); return m && Number(m[1]) === ord; };
    const endingOk = label => { const m = label.match(/^-([a-ząćęłńóśźżáéíóúñ]+)\b/i); return m && inf.endsWith(m[1]); };

    const verbRows = new Set(), personRows = new Set(), cols = new Set();
    t.rows.forEach((r, i) => { const ws = words(r.who); if (hasPerson(ws) || ordOk(r.who)) personRows.add(i); else if (hasInf(r.who)) verbRows.add(i); });
    const verbNamed = label => { const w = words(label)[0] || ''; return /(ć|ar|er|ir|se)$/.test(w) && !hasGender([w]); };
    const specific = t.cols.some(c => words(c.label).some(w => ALL_PERSON.has(w)) || hasGender(words(c.label)) || verbNamed(c.label) || /^-/.test(c.label));
    const namesInf = label => hasInf(label.replace(/(^|\s)-\p{L}+/gu, ' '));   // an ending label such as -ir does not name the verb ir
    const byEnding = new Set();
    t.cols.forEach((c, i) => {
      if (hasPerson(words(c.label)) || genderOk(c.label) || namesInf(c.label)) cols.add(i);
      else if (endingOk(c.label)) { cols.add(i); byEnding.add(i); }
    });
    const all = new Set(t.cols.map((c, i) => i));
    if (verbRows.size) return { rows: verbRows, cols: cols.size ? cols : all, own: true };      // the verb's own row: show it whole if no column fits the person
    // comparison tables (imperfective against perfective): pick the column by the shape of the answer
    if (!personRows.size && !verbRows.size && t.cols.length >= 2) {
      const why = (item.why || '').toLowerCase();
      const esc_ = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keyOf = label => { const l = label.toLowerCase().split(/[:(]/)[0].trim(); return /^ir a\b/.test(l) ? 'ir a' : l.split(/\s+/)[0]; };
      const firstAt = i => { const m = why.match(new RegExp(`(^|[^\\p{L}])${esc_(keyOf(t.cols[i].label))}(?![\\p{L}])`, 'u')); return m ? m.index : Infinity; };
      let best = t.cols.map((c, i) => [firstAt(i), i]).sort((a, b) => a[0] - b[0])[0];
      if (!isFinite(best[0])) {                      // the explanation does not name a column: use the shape of the answer
        const compound = /\s/.test(item.a[0].trim());
        const compoundCol = t.cols.findIndex(c => /ir a|imperfective|będę/i.test(c.label));
        if (compoundCol >= 0 && t.cols.length === 2) best = [0, compound ? compoundCol : 1 - compoundCol];
      }
      if (isFinite(best[0])) return { rows: new Set(t.rows.map((r, i) => i)), cols: new Set([best[1]]), own: false, weak: true };
    }
    if (personRows.size) return { rows: personRows, cols: cols.size ? cols : all, own: t.cols.some(c => namesInf(c.label)), weak: specific && !cols.size, ending: cols.size > 0 && [...cols].every(i => byEnding.has(i)) };   // weak: the verb itself is not in this table, so the whole person row is shown
    return null;
  }

  /* ---------- what changed between the dictionary form and the answer (Polish case nouns) ---------- */
  const VOWELS = 'aąeęioóuy';
  const isVowel = ch => VOWELS.includes(ch);
  const NOM_ENDINGS = ['um', 'ie', 'a', 'o', 'e', 'ę', 'y', 'i'];    // nouns and adjectives

  // a word may keep or drop its final vowel: pani keeps the i, tani drops it, okno drops the o
  function stemsOf(word) {
    const out = [word];
    for (const e of NOM_ENDINGS) if (word.length > e.length + 1 && word.endsWith(e)) { out.push(word.slice(0, -e.length)); break; }
    return out;
  }

  // every plausible stem shape: vowel change or mobile e, then optional softening of the final consonant(s)
  function candidates(stem) {
    const out = [{ s: stem, steps: [] }];
    const lastIdx = (ch) => stem.lastIndexOf(ch);
    for (const [from, to, note] of [['ó', 'o', 'ó becomes o'], ['ą', 'ę', 'ą becomes ę'], ['a', 'e', 'a becomes e'], ['o', 'e', 'o becomes e'], ['ę', 'ą', 'ę becomes ą']]) {
      const i = lastIdx(from);
      if (i > 0 && !stem.slice(i + 1).split('').some(isVowel)) out.push({ s: stem.slice(0, i) + to + stem.slice(i + 1), steps: [note] });
    }
    // mobile e: pies → ps, cukier → cukr, Marek → Mark, dworzec → dworc
    const m = stem.match(/^(.*[^aąeęioóuy])(i?e)([^aąeęioóuy]+)$/);
    if (m && m[1].length) out.push({ s: m[1] + m[3], steps: ['the e drops out'] });
    // inserted e: książk → książek, okn → okien
    const last = stem.slice(-1), before = stem.slice(0, -1);
    if (before && !isVowel(last) && !isVowel(before.slice(-1))) {
      out.push({ s: before + 'e' + last, steps: ['an e slips in between the last two consonants'] });
      out.push({ s: before + 'ie' + last, steps: ['an e slips in between the last two consonants'] });
      if (/ó$/.test(before) === false && /o[^aąeęioóuy]$/.test(stem)) {}
    }
    const soft = [];
    out.forEach(c => SOFTENING.forEach(r => {
      if (c.s.endsWith(r.hard)) soft.push({ s: c.s.slice(0, -r.hard.length) + r.soft, pre: c.s, steps: c.steps.slice(), soft: r });
    }));
    return out.concat(soft);
  }

  function analyseWord(base, answer) {
    const b = base.toLowerCase(), a = answer.toLowerCase();
    if (b === a) return { base, answer, same: true };
    let best = null;
    const cost = c => c.steps.length + (c.soft ? 1 : 0);
    stemsOf(b).forEach(stem => candidates(stem).forEach(c => {
      if (!a.startsWith(c.s)) return;
      const ending = a.slice(c.s.length);
      if (!KNOWN_ENDINGS.includes(ending)) return;
      if (!best || cost(c) < cost(best) || (cost(c) === cost(best) && c.s.length > best.s.length)) best = { ...c, ending };
    }));
    if (!best) return { base, answer, unknown: true };
    return { base, answer, stem: best.s, pre: best.pre, ending: best.ending, steps: best.steps, soft: best.soft };
  }

  function changeNote(item) {
    const form = parseForm(item);
    if (typeof SOFTENING === 'undefined' || typeof KNOWN_ENDINGS === 'undefined') return '';
    if (state.topic.id === 'cases' ? item.kind === 'pronoun' : !form || form.pos === 'verb') return '';
    const bases = item.base.trim().split(/\s+/), answers = item.a[0].trim().split(/\s+/);
    if (bases.length !== answers.length) return '';
    const lines = bases.map((bw, i) => {
      const r = analyseWord(bw, answers[i]);
      const w = `<b lang="${APP.lang}">${esc(r.base)} → ${esc(r.answer)}</b>`;
      if (r.same) return `${w}: no change.`;
      if (r.unknown) return `${w}: irregular. Learn this form as a word of its own.`;
      const steps = r.steps.slice();
      let built;
      if (r.soft) {
        const { hard, soft, spelling } = r.soft;
        const merged = !r.ending && soft.endsWith('i');
        const written = merged ? soft : soft + r.ending;
        if (spelling) steps.push(merged ? `${hard} is written ${soft} before the ending -i, which merges into it` : `${hard} is written ${soft} before the ending -${esc(r.ending)}, so ${hard} + ${esc(r.ending)} gives ${written}`);
        else steps.push(merged ? `${hard} softens to ${soft}, and the i of ${soft} is the plural ending -i itself` : `${hard} softens to ${soft} before the ending -${esc(r.ending)}, so ${hard} + ${esc(r.ending)} is written ${written}`);
        built = `${esc(r.pre)} + -${esc(merged ? 'i' : r.ending)} → ${esc(r.answer.toLowerCase())}`;
      } else {
        steps.push(r.ending ? `add the ending -${esc(r.ending)}` : 'no ending is added');
        built = r.ending ? `${esc(r.stem)} + -${esc(r.ending)} → ${esc(r.answer.toLowerCase())}` : `${esc(r.base.toLowerCase())} → ${esc(r.answer.toLowerCase())}`;
      }
      const text = steps.map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s).join(', then ');
      return `${w}: ${text}. <span lang="${APP.lang}">${built}</span>`;
    });
    return `<div class="changes"><p class="changes-title">What changed</p><ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>
      ${state.topic.id === 'cases' ? '<button type="button" class="link-btn" data-action="see-sounds">See all sound changes</button>' : ''}</div>`;
  }

  // the (at most two) verb tables that best show where the answer sits, each with its highlight
  function tenseHits(item, g) {
    if (item.at) {
      // at is one [row, column] cell, or a list of them in different tables
      return atCells(item).map(([row, col]) => {
        const t = g.tables.find(x => x.rows.some(r => r.who === row) && x.cols.some(c => c.label === col));
        return t && { t, hl: { rows: new Set([t.rows.findIndex(r => r.who === row)]), cols: new Set([t.cols.findIndex(c => c.label === col)]), own: true } };
      }).filter(Boolean);
    }
    const score = h => (h.own ? 2 : 0) + (h.weak ? 0 : 1);
    const answer = item.a[0].toLowerCase();
    const before = ((item.s || '').split('___')[0].replace(/\{[^}]*\}/g, '').trim().split(/\s+/).pop() || '').toLowerCase();   // a pronoun left in the sentence: me ___
    const marked = (t, hl) => [...hl.rows].flatMap(r => [...hl.cols].map(c => t.rows[r].cells[c] || ''));
    const fits = (t, hl) => { const parts = marked(t, hl).flatMap(x => [...x.matchAll(/\[([^\]]+)\]/g)].map(m => m[1].toLowerCase())); return !parts.length || parts.some(x => answer.includes(x) || x === before); };
    const found = g.tables.map(t => ({ t, hl: tableHighlight(t, item) })).filter(x => x.hl);
    let hits = found.filter(x => !x.hl.weak || fits(x.t, x.hl));   // habrá is no guide to estará
    hits = hits.filter(x => !x.hl.ending || fits(x.t, x.hl));   // the regular -er column only helps if its ending is in the answer: not for era or hecho
    if (!hits.length) hits = found;   // but when nothing fits, the nearest pattern still helps: zrobimy for zobaczymy
    const sure = hits.filter(x => !x.hl.weak);   // a guess from the explanation's wording only helps when nothing firmer matched
    return (sure.length ? sure : hits).sort((a, b) => score(b.hl) - score(a.hl)).slice(0, 2);
  }
  const atCells = item => Array.isArray(item.at[0]) ? item.at : [item.at];
  const tenseLabel = item => item.p ? `${item.p}${itemGender(item) && !PLURAL_P.has(item.p) && ['ja', 'ty'].includes(item.p) ? `, ${{ m: 'a man', f: 'a woman' }[itemGender(item)] || ''}` : ''}` : item.at ? (state.topic.id === 'idioms' ? atCells(item)[0][0] : `${item.at[0]}, ${item.at[1].split(':')[0].toLowerCase()}`) : '';

  function revealTables(item, g) {
    if (!g.tables) return '';
    const hits = tenseHits(item, g);
    const shown = hits.length ? hits : [{ t: g.tables[0], hl: null }];
    const label = tenseLabel(item);
    return `<details class="mini-grid" open>
      <summary>Where it sits in the table${label ? `<span class="hl-label">${esc(label)}</span>` : ''}</summary>
      ${shown.map(x => tenseTable(x.t, x.hl, true)).join('')}
    </details>`;
  }

  /* ---------- numbers: how the word next to the number changes ---------- */
  // A numbers sentence may carry form: 'noun gen.pl.f', 'adj loc.sg.n' or 'verb past.ono'.
  // Genders: m1, m2, n, f. In the plural m1 means men and m2 any other masculine noun (psy, koty, stoły).
  function parseForm(item) {
    if (!item.form) return null;
    const [pos, spec = ''] = item.form.split(' ');
    const [a, b, gender] = spec.split('.');
    return pos === 'verb' ? { pos, tense: a, p: b } : { pos, caseId: a, number: b, gender };
  }

  const NUMBER_NAMES = { sg: 'singular', pl: 'plural' };
  function formTables(item) {
    const f = parseForm(item);
    if (!f) return '';
    if (f.pos === 'verb') {
      if (f.tense !== 'past' || typeof PAST_TENSE === 'undefined') return '';
      const probe = { base: item.base, a: item.a, p: f.p, why: '' };
      // the group whose table has this verb's own row, otherwise the model verb of the regular group
      const own = PAST_TENSE.groups.map(g => tenseHits(probe, g)).find(h => h.some(x => x.hl.own));
      const hits = own || tenseHits(probe, PAST_TENSE.groups[0]);
      if (!hits.length) return '';
      return `<details class="mini-grid" open>
        <summary>How the verb changes<span class="hl-label">past tense, ${esc(f.p)}${own ? '' : `, like ${esc(PAST_TENSE.groups[0].tables[0].title.split(',')[0])}`}</span></summary>
        ${hits.map(x => tenseTable(x.t, x.hl, true)).join('')}
      </details>`;
    }
    if (typeof CASES === 'undefined') return '';
    const g = state.topic.byId[item.c];
    if (state.crib && g && (g.cases || []).includes(`${f.caseId}.${f.number}`)) return '';   // the tables panel already marks it
    const c = CASES.find(x => x.id === f.caseId);
    if (!c || !(f.gender in COL) || !NUMBER_NAMES[f.number]) return '';
    const word = f.pos === 'adj' ? 'Adjectives' : 'Nouns';
    const hl = { number: f.number, col: COL[f.gender], rows: new Set([word]) };
    return `<details class="mini-grid" open>
      <summary>How the ${f.pos === 'adj' ? 'ordinal' : 'noun'} changes<span class="hl-label">${esc(c.en.toLowerCase())} ${NUMBER_NAMES[f.number]}, ${COL_NAMES[f.number][hl.col]}${f.pos === 'adj' ? ', adjective ending' : ''}</span></summary>
      ${caseGrid(c, hl, f.number)}
    </details>`;
  }

  // A numbers group may list the case grids its nouns need: cases: ['gen.pl']. hlItem marks the revealed answer's cell.
  function groupCaseGrids(g, hlItem, notes) {
    if (!g.cases || typeof CASES === 'undefined') return '';
    const f = hlItem && parseForm(hlItem);
    return g.cases.map(spec => {
      const [caseId, number] = spec.split('.');
      const c = CASES.find(x => x.id === caseId);
      if (!c) return '';
      const on = f && f.pos !== 'verb' && f.caseId === caseId && f.number === number && f.gender in COL;
      const hl = on ? { number, col: COL[f.gender], rows: new Set([f.pos === 'adj' ? 'Adjectives' : 'Nouns']) } : null;
      return caseGrid(c, hl, number) + (notes ? `<ul class="g-notes">${c.notes.map(n => `<li>${withNotes(n)}</li>`).join('')}</ul>` : '');
    }).join('');
  }

  const tenseSection = g => `<article class="case" id="ref-${g.id}" style="${colour(g.colour)}">
      ${band(g, g.en)}
      <h3>How it works</h3>
      ${useList(g.rules)}
      <h3>The forms</h3>
      ${g.tables.map(t => tenseTable(t)).join('')}
      ${g.cases ? `<h3>How the noun changes</h3>
      <p class="plain-note">${esc(g.casesNote || '')}</p>
      ${groupCaseGrids(g, null, true)}` : ''}
      ${watchList(g.watch)}
    </article>`;

  function renderTable() {
    const t = state.topic;
    $('#view-table').innerHTML = t.id === 'cases'
      ? `${startRow()}
        <section class="overview">
          <h2>The endings side by side</h2>
          ${overviewTable(OVERVIEW.nouns)}
          ${overviewTable(OVERVIEW.adjs)}
        </section>
        ${soundsSection()}
        ${selectedGroups().map(caseSection).join('')}`
      : `${startRow()}
        <p class="case-summary topic-intro">${esc(t.intro)}</p>
        ${selectedGroups().map(tenseSection).join('')}`;
  }

  /* ---------- quiz ---------- */
  // this topic's progress records as they are now, to compare with after the quiz
  const topicRecords = () => Object.fromEntries(Object.entries(progress).filter(([k]) => k.startsWith(`${state.topic.id}|`)));
  const snapshot = () => JSON.parse(JSON.stringify(topicRecords()));

  function startQuiz(items, all = false) {
    const queue = state.order === 'weak' ? orderWeakFirst(items) : shuffle(items);
    if (!all && state.length) queue.length = Math.min(queue.length, state.length);
    state.quiz = { queue, idx: 0, results: [], revealed: false, checked: false, firstTryRight: false, feedback: null, typed: '', partial: null, before: snapshot() };
    saveQuiz();
    setView('quiz');
    scrollToQuiz();
  }

  const scrollToQuiz = () => window.scrollTo({ top: $('#view-quiz').getBoundingClientRect().top + window.scrollY - 8, behavior: 'instant' });
  const current = () => state.quiz.queue[state.quiz.idx];
  const isNotebook = () => state.mode === 'notebook';

  // a noun that only has a plural (rodzice, wakacje) is always plural, so its sentences show the hint without needing one
  const pluralOnly = item => typeof PLURAL_ONLY !== 'undefined' && state.topic.id === 'cases' && item.kind !== 'pronoun'
    && item.base.trim().split(/\s+/).some(w => PLURAL_ONLY.includes(w));
  const hintOf = item => item.hint || (pluralOnly(item) ? 'plural' : '');
  const shortHint = item => hintOf(item).length <= 12 ? hintOf(item) : '';
  const longHint = item => hintOf(item).length > 12 ? hintOf(item) : '';

  function gapTag(item) {
    if (typeof GENDERS === 'undefined' || state.topic.id !== 'cases' || item.kind === 'pronoun') return '';
    const noun = item.base.trim().split(/\s+/).find(w => GENDERS[w]);
    if (!noun) return '';
    return GENDERS[noun] + (item.hint === 'plural' || PLURAL_ONLY.includes(noun) ? '.pl' : '');
  }

  // the gap's words: the ones already right in the answer's form, the rest still as given. When the given form has a
  // different number of words (poner -> ha puesto), the answer's last word is the one that replaces it: until that
  // word is right the given form stays in its place, and once it is, any helper still missing (ha) shows as …
  function partialGap(item, partial) {
    const right = answerWords(item, partial.ai), given = item.base.trim().split(/\s+/);
    const sameCount = given.length === right.length;
    const main = right.length - 1;
    return right.map((w, i) => {
      if (partial.done[i]) return `<b class="part-right">${esc(w)}</b>`;
      if (sameCount) return `<span class="part-left">${esc(given[i])}</span>`;
      if (i === main) return `<span class="part-left">${esc(item.base)}</span>`;
      return partial.done[main] ? '<span class="part-left" aria-label="missing word">…</span>' : null;
    }).filter(Boolean).join(' ');
  }

  function sentenceHTML(item, revealed, partial) {
    return joinTokens(parseSentence(item.s), tok => {
      if (tok.punct) return esc(tok.punct);
      if (tok.gap) {
        if (!revealed && partial) {
          return `<span class="slot part" tabindex="0" data-gloss="${esc(item.gloss)}" ${gapTag(item) ? `data-tag="${gapTag(item)}"` : ''} data-say="${esc(item.base.replace(/\s*\/\s*/g, ', '))}">${partialGap(item, partial)}${shortHint(item) ? `<small>${esc(shortHint(item))}</small>` : ''}</span>`;
        }
        return revealed
          ? `<span class="slot filled" tabindex="0" data-gloss="${esc(item.gloss)}" ${gapTag(item) ? `data-tag="${gapTag(item)}"` : ''} data-say="${esc(item.a[0])}">${esc(item.a[0])}</span>`
          : `<span class="slot" tabindex="0" data-gloss="${esc(item.gloss)}" ${gapTag(item) ? `data-tag="${gapTag(item)}"` : ''} data-say="${esc(item.base.replace(/\s*\/\s*/g, ', '))}">${esc(item.base)}${shortHint(item) ? `<small>${esc(shortHint(item))}</small>` : ''}</span>`;
      }
      return `<span class="w" tabindex="0" data-gloss="${esc(tok.gloss)}" ${tok.tag ? `data-tag="${esc(tok.tag)}"` : ''} data-say="${esc(tok.word)}">${esc(tok.word)}</span>`;
    });
  }

  const modePicker = () => `
    <fieldset class="modes">
      <legend>How do you want to answer?</legend>
      <label class="mode"><input type="radio" name="mode" value="type" ${isNotebook() ? '' : 'checked'}>
        <span><b>Type it here</b>The page checks your spelling.</span></label>
      <label class="mode"><input type="radio" name="mode" value="notebook" ${isNotebook() ? 'checked' : ''}>
        <span><b>Write it in my notebook</b>You reveal the answer and mark yourself right or wrong.</span></label>
    </fieldset>`;

  function renderQuiz() {
    const root = $('#view-quiz');
    const q = state.quiz;
    const t = state.topic;

    root.classList.toggle('with-crib', !!q && q.idx < q.queue.length && state.crib);
    if (!q) {
      const saved = savedQuiz();
      root.innerHTML = `<div class="quiz-intro">
        ${saved ? `<div class="resume">
          <p><b>You have an unfinished quiz.</b> ${saved.idx} of ${saved.queue.length} sentences done.</p>
          <button type="button" class="btn primary" data-action="resume">Continue where you left off</button>
        </div>` : ''}
        <h2>Ready when you are</h2>
        <p>You get one sentence at a time with a word in its dictionary form. Put it in the right form. Hover over any word to see what it means.</p>
        ${hasKinds() ? `<fieldset class="lengths kinds">
          <legend>Which words?</legend>
          ${t.kinds.map(([v, label]) => `<label><input type="radio" name="kind" value="${v}" ${kindNow()[0] === v ? 'checked' : ''}><span>${label}</span></label>`).join('')}
        </fieldset>` : ''}
        ${modePicker()}
        <label class="toggle"><input type="checkbox" id="show-group" ${state.showGroup ? 'checked' : ''}> Tell me which ${t.unit} each sentence needs</label>
        <label class="toggle"><input type="checkbox" id="crib" ${state.crib ? 'checked' : ''}> Keep the ${t.refLabel.toLowerCase()} tables open beside the quiz</label>
        <fieldset class="lengths">
          <legend>How many sentences?</legend>
          ${[10, 20, 50, 0].map(n => `<label><input type="radio" name="length" value="${n}" ${state.length === n ? 'checked' : ''}><span>${n || `All ${pool().length}`}</span></label>`).join('')}
        </fieldset>
        <fieldset class="lengths order">
          <legend>Which sentences first?</legend>
          <label><input type="radio" name="order" value="weak" ${state.order === 'weak' ? 'checked' : ''}><span>New and missed ones first</span></label>
          <label><input type="radio" name="order" value="random" ${state.order === 'random' ? 'checked' : ''}><span>Random</span></label>
        </fieldset>
        <button type="button" class="btn primary" data-action="start">Start quiz</button>
        ${progressPanel()}
      </div>`;
      return;
    }

    if (q.idx >= q.queue.length) { renderSummary(root); return; }

    const item = current();
    const g = t.byId[item.c];
    const showGroup = state.showGroup || q.revealed;
    const right = q.results.filter(r => r.right).length;
    const last = q.idx + 1 >= q.queue.length;
    const marked = q.results.length > q.idx;   // this sentence already has a result

    const feedbackLine = (extra = '') => `<p class="feedback ${q.feedback ? q.feedback.kind : ''} ${extra}" role="status">${q.feedback ? esc(q.feedback.text) : ''}</p>`;
    // touch screens have no hover: the hint says tap there
    const HOVER_HINT = '<p class="hover-hint"><span class="hint-hover">Hover over a word to see its translation. Click it to hear it.</span><span class="hint-touch">Tap a word to see its translation and hear it.</span></p>';
    let answerUI = '';
    // once an answer has been checked, its feedback takes the hint's place above the answer box, at every screen width
    const feedbackOnTop = !!q.feedback && !isNotebook() && (!q.revealed || !!q.typed.trim());
    if (!q.revealed && isNotebook()) {
      answerUI = `${HOVER_HINT}
        <p class="notebook-note">Write <i lang="${APP.lang}">${esc(item.base)}</i> in the right form in your notebook. Reveal the answer when you are ready.</p>
        <div class="answer-row"><button type="button" class="btn primary" data-action="reveal" id="reveal-btn">Reveal answer</button></div>`;
    } else if (!q.revealed) {
      // once an answer has been checked, its feedback takes the hint's place
      answerUI = `${q.feedback ? feedbackLine('feedback-top') : HOVER_HINT}
        <form class="answer-row" id="answer-form" autocomplete="off">
          <input id="answer" type="text" lang="${APP.lang}" spellcheck="false" autocapitalize="off" autocomplete="off"
            aria-label="Your answer: ${esc(item.base)} in the right form" placeholder="${esc(item.base)} → ?" value="${esc(q.typed)}">
          <button type="submit" class="btn primary">Check</button>
          <button type="button" class="btn" data-action="reveal">Reveal answer</button>
        </form>
        <div class="letters" aria-label="Special letters">${LETTERS.map(l => `<button type="button" data-letter="${l}" aria-label="Insert ${l}">${l}</button>`).join('')}</div>`;
    } else if (q.typed.trim()) {
      answerUI = `${q.feedback ? feedbackLine('feedback-top') : ''}
        <div class="answer-row"><input type="text" readonly aria-label="What you typed" value="${esc(q.typed)}"></div>`;
    }

    const nextLabel = last ? 'See my results' : 'Next sentence';
    const afterReveal = !q.revealed ? '' : `
      <div class="reveal">
        <p class="ans" lang="${APP.lang}"><span class="ans-label" lang="en">Answer</span><span class="say from" tabindex="0" role="button" aria-label="Hear ${esc(item.base)}" data-say="${esc(item.base.replace(/\s*\/\s*/g, ', '))}">${esc(item.base)}</span>${shortHint(item) ? `<small lang="en">${esc(shortHint(item))}</small>` : ''}<span class="arrow" aria-hidden="true">→</span><span class="say to" tabindex="0" role="button" aria-label="Hear ${esc(item.a[0])}" data-say="${esc(item.a[0])}">${esc(item.a[0])}</span></p>
        ${item.a.length > 1 ? `<p class="also">Also correct: <span lang="${APP.lang}">${item.a.slice(1).map(esc).join(', ')}</span></p>` : ''}
        <p class="en">${esc(item.en)}</p>
        ${item.idiom ? `<p class="idiom-note"><b>Idiom</b> <span lang="${APP.lang}">${esc(item.idiom)}</span>: ${esc(item.means)}.${item.lit ? ` <span class="lit">Literally: ${esc(item.lit)}.</span>` : ''}</p>` : ''}
        <p class="why"><b>${esc(t.whyLabel(g))}</b> ${esc(item.why)}</p>
        ${t.id === 'cases' ? changeNote(item) : ''}
        ${(() => { if (state.crib) return ''; if (t.id !== 'cases') return revealTables(item, g); const hl = itemHighlight(item); return hl ? `<details class="mini-grid" open>
          <summary>Where it sits in the table<span class="hl-label">${esc(hl.label)}</span></summary>
          ${caseGrid(g, hl, hl.number)}
        </details>` : ''; })()}
        ${t.id === 'cases' ? '' : changeNote(item) + formTables(item)}
        <button type="button" class="link-btn" data-action="see-table" data-group="${g.id}">${esc(t.refLink(g))}</button>
      </div>
      ${isNotebook() && !marked ? `
      <div class="next-row self-mark">
        <span class="ask">Does your notebook match?</span>
        <button type="button" class="btn right" data-action="mark-right">I got it right</button>
        <button type="button" class="btn wrong" data-action="mark-wrong">I got it wrong</button>
        <span class="key-hint">or press Y or N</span>
      </div>` : `
      <div class="next-row">
        <button type="button" class="btn primary" data-action="next" id="next-btn">${nextLabel}</button>
        <span class="key-hint">or press Enter</span>
      </div>`}`;

    root.innerHTML = `<div style="${colour(g.colour)}">
      <div class="q-top">
        <span>Sentence ${q.idx + 1} of ${q.queue.length}</span>
        <span>${right} right so far
          ${q.revealed ? '' : `<button type="button" class="link-btn mode-switch" data-action="switch-mode">${isNotebook() ? 'Switch to typing' : 'Switch to notebook mode'}</button>`}
          <button type="button" class="link-btn mode-switch" data-action="toggle-crib" aria-pressed="${state.crib}">${state.crib ? 'Hide tables' : 'Show tables'}</button></span>
      </div>
      <div class="q-progress" aria-hidden="true"><i style="width:${(q.idx / q.queue.length) * 100}%"></i></div>

      <div class="q-case ${showGroup ? '' : 'hidden-case'}">${showGroup
        ? `<b lang="${APP.lang}">${esc(g.pl)}</b><i lang="${APP.lang}">${esc(g.q)}</i><span>${esc(g.en)}</span>`
        : `<span>Which ${t.unit} is it? Work it out from the sentence.</span>`}</div>

      <p class="sentence" lang="${APP.lang}">${sentenceHTML(item, q.revealed, q.partial)}</p>
      ${(() => { const r = recordOf(item); return r ? `<p class="history">${r.streak >= 2 ? `Right ${r.streak} times in a row.` : r.last ? 'Right last time.' : 'Missed last time.'} ${r.ok} of ${r.n} so far.</p>` : ''; })()}
      ${longHint(item) && !q.revealed ? `<p class="q-hint"><b>Hint</b> ${esc(longHint(item))}</p>` : ''}
      ${answerUI}
      <p class="speech-note" id="speech-note" hidden></p>
      ${feedbackOnTop ? '' : feedbackLine()}
      ${afterReveal}
    </div>${state.crib ? cribPanel(item) : ''}`;

    const focusEl = $('#next-btn') || $('#answer') || $('#reveal-btn');
    if (focusEl) focusEl.focus({ preventScroll: true });
    const crib = $('.crib'), cell = crib && $('.g-cell.hl', crib);
    if (cell && crib.scrollHeight > crib.clientHeight) {
      const top = cell.getBoundingClientRect().top - crib.getBoundingClientRect().top + crib.scrollTop;
      crib.scrollTop = Math.max(0, top - crib.clientHeight / 3);
    }
  }

  // The reference tables beside the quiz. With the group hidden, every selected group gets a tab so the panel does not give it away.
  function cribPanel(item) {
    const t = state.topic, groups = selectedGroups();
    const hidden = !state.showGroup && !state.quiz.revealed;
    const g = hidden ? (t.byId[state.cribGroup] && sel().has(state.cribGroup) ? t.byId[state.cribGroup] : groups[0]) : t.byId[item.c];
    // once the answer is revealed, the panel marks where it sits instead of a second table appearing under the answer
    const revealed = state.quiz.revealed;
    let body, label = '';
    if (t.id === 'cases') {
      const hl = !revealed ? null : item.kind === 'pronoun' ? pronounHighlight(item) : itemHighlight(item);
      // the vocative has no pronoun tables of its own; its possessives share the nominative forms, so show that grid here
      body = item.kind !== 'pronoun' ? caseGrid(g, hl, null) : pronounBlock(g, hl) + (g.id === 'voc' ? possessiveGrid(g, hl) : '');
      if (hl) label = hl.label;
    } else {
      const hits = revealed ? tenseHits(item, g) : [];
      if (hits.length) label = tenseLabel(item);
      body = g.tables.map(x => tenseTable(x, (hits.find(h => h.t === x) || {}).hl, true)).join('') + groupCaseGrids(g, revealed ? item : null, false);
    }
    // only name a spot the tables actually mark
    const marked = /class="g-cell[^"]*\bhl\b/.test(body);
    return `<aside class="crib" style="${colour(g.colour)}" aria-label="${esc(t.refLabel)} tables">
      <div class="crib-head"><h2><span lang="${APP.lang}">${esc(g.pl)}</span><small>${esc(g.en)}</small></h2>
        <button type="button" class="link-btn" data-action="toggle-crib">Hide</button></div>
      ${label && marked ? `<p class="crib-hl">Where it sits: <span class="hl-label">${esc(label)}</span></p>` : ''}
      ${hidden && groups.length > 1 ? `<div class="crib-tabs" role="group" aria-label="Show the tables for">${groups.map(x => `<button type="button" style="${colour(x.colour)}" data-crib="${x.id}" aria-pressed="${x === g}" lang="${APP.lang}">${esc(x.pl)}</button>`).join('')}</div>` : ''}
      <div class="crib-body">${body}</div>
    </aside>`;
  }

  function checkAnswer() {
    const q = state.quiz;
    const item = current();
    const typed = $('#answer').value;
    q.typed = typed;
    const guess = normalise(typed);
    if (!guess) { q.feedback = { kind: 'bad', text: 'Type the word in its new form first, or reveal the answer.' }; renderQuiz(); return; }

    const answers = item.a.map(normalise);
    const sieFollows = /___\s+się\{/.test(item.s);
    const guessNoSie = sieFollows ? guess.replace(/ się$/, '') : guess;
    if (answers.includes(guess) || answers.includes(guessNoSie)) {
      if (!q.checked) q.firstTryRight = true;
      q.feedback = { kind: 'good', text: q.firstTryRight ? 'Correct.' : 'Correct this time.' };
      reveal();
      return;
    }
    const had = q.partial ? q.partial.done.filter(Boolean).length : 0;
    const m = matchWords(answers, guessNoSie, q.partial);
    q.checked = true;
    if (m && m.done.every(Boolean)) {   // the last missing words, after earlier checks got the others
      q.partial = m;
      q.feedback = { kind: 'good', text: 'Correct this time.' };
      reveal();
      return;
    }
    if (m && m.n > had) {
      const fresh = answerWords(item, m.ai).filter((_, i) => m.done[i] && !(q.partial && q.partial.ai === m.ai && q.partial.done[i]));
      const left = m.done.filter(d => !d).length;
      q.partial = { ai: m.ai, done: m.done };
      q.feedback = { kind: 'part', text: `${capitalize(fresh.join(' and '))} ${fresh.length > 1 ? 'are' : 'is'} right. Now the other word${left > 1 ? 's' : ''}.` };
      saveQuiz();
      renderQuiz();
      return;
    }
    q.feedback = answers.map(stripMarks).includes(stripMarks(guessNoSie))
      ? { kind: 'bad', text: `Nearly. The letters are right, but check the ${APP.languageName} marks such as ${APP.marks}.` }
      : { kind: 'bad', text: 'Not quite. Try again, or reveal the answer.' };
    saveQuiz();
    renderQuiz();
    shakeAnswer();
  }

  // a small shake of the answer box for a wrong answer (none with reduced motion: styles.css turns animations off)
  function shakeAnswer() {
    const input = $('#answer');
    if (input) input.classList.add('shake');
  }

  function reveal() {
    const q = state.quiz;
    const input = $('#answer');
    if (input) q.typed = input.value;
    if (!q.feedback || q.feedback.kind !== 'good') q.feedback = null;
    q.revealed = true;
    // typed answers are scored now; notebook answers wait for the learner's own verdict
    // right: first try; solved: got there in the end without pressing Reveal
    if (!isNotebook()) { q.results.push({ item: current(), right: q.firstTryRight, solved: !!q.feedback, mode: 'type' }); record(current(), q.firstTryRight); }
    saveQuiz();
    renderQuiz();
  }

  function selfMark(right) {
    const q = state.quiz;
    if (!q || !q.revealed || q.results.length > q.idx) return;
    q.results.push({ item: current(), right, solved: right, mode: 'notebook' });
    record(current(), right);
    next();
  }

  function next() {
    const q = state.quiz;
    Object.assign(q, { idx: q.idx + 1, revealed: false, checked: false, firstTryRight: false, feedback: null, typed: '', partial: null });
    saveQuiz();
    renderQuiz();
    scrollToQuiz();
  }

  function progressPanel() {
    const t = state.topic;
    const all = groupStats(t.sentences);
    if (!all.seen) return `<section class="progress"><h3>Your progress</h3><p>Nothing yet. Results are saved in this browser as you go, and to your account when you are signed in.</p></section>`;
    const rows = t.groups.map(g => {
      const s = groupStats(t.sentences.filter(x => x.c === g.id));
      const pct = s.n ? Math.round(100 * s.ok / s.n) : 0;
      return `<tr style="${colour(g.colour)}">
        <th scope="row"><span lang="${APP.lang}">${esc(g.pl)}</span><small>${esc(g.en)}</small></th>
        <td><div class="bar"><i class="done" style="width:${100 * s.mastered / s.total}%"></i><i class="seen" style="width:${100 * (s.seen - s.mastered) / s.total}%"></i></div></td>
        <td data-col="seen">${s.seen} of ${s.total}</td><td data-col="mastered">${s.mastered}</td><td data-col="to review">${s.weak}</td><td data-col="accuracy">${s.n ? pct + '%' : ''}</td></tr>`;
    }).join('');
    return `<section class="progress">
      <h3>Your progress</h3>
      <div class="table-wrap"><table class="progress-table">
        <thead><tr><th scope="col">${esc(t.unit[0].toUpperCase() + t.unit.slice(1))}</th><th scope="col"></th><th scope="col">Seen</th><th scope="col">Mastered</th><th scope="col">To review</th><th scope="col">Accuracy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="progress-note">Mastered means right twice in a row. To review means missed the last time. Everything is saved in this browser, and to your account when you are signed in.</p>
      <p class="progress-reset">${state.confirmReset
        ? `Delete all saved progress for every topic? <button type="button" class="btn wrong" data-action="reset-yes">Yes, delete it</button> <button type="button" class="btn" data-action="reset-no">Keep it</button>`
        : `<button type="button" class="link-btn" data-action="reset">Reset progress</button>`}</p>
    </section>`;
  }

  function renderSummary(root) {
    const q = state.quiz;
    store.set(`${APP.storagePrefix}.resume`, null);
    const total = q.results.length;
    const right = q.results.filter(r => r.right).length;
    const solved = q.results.filter(r => r.solved).length;
    const missed = q.results.filter(r => !r.right);
    const modes = new Set(q.results.map(r => r.mode));
    const ring = modes.has('type')
      ? scoreRing(total, [
          { n: right, tint: 'ins', label: 'right first time' },
          { n: solved - right, tint: 'loc', label: 'right after another try' },
        ], 'revealed')
      : scoreRing(total, [{ n: right, tint: 'ins', label: 'marked right in your notebook' }], 'marked wrong');
    const league = leagueCard(q);
    root.innerHTML = `<div class="summary">
      <h2>Quiz finished</h2>
      ${ring}
      ${league ? league.html : ''}
      ${modes.size > 1 ? '<p>Sentences you marked right in your notebook count as right first time.</p>' : ''}
      ${missed.length ? `<h3>Sentences to look at again</h3>
      <ul class="missed">${missed.map(({ item }) => { const g = state.topic.byId[item.c]; return `<li style="${colour(g.colour)}">
        <span class="ex" lang="${APP.lang}">${joinTokens(parseSentence(item.s), tk => tk.punct ? esc(tk.punct) : tk.gap ? `<b>${esc(item.a[0])}</b>` : esc(tk.word))}</span>
        <span>${esc(g.pl)}. ${esc(item.why)}</span></li>`; }).join('')}</ul>` : '<p>A clean sheet. Brawo!</p>'}
      <div class="actions">
        ${missed.length ? '<button type="button" class="btn primary" data-action="retry-missed">Practise these again</button>' : ''}
        <button type="button" class="btn ${missed.length ? '' : 'primary'}" data-action="start">Start a new quiz</button>
      </div>
    </div>`;
    animateRings(root);
    if (league) animateLeague(root, league);
  }

  // The topic's radar chart as a card; null when there is no chart to show (fewer than 3 groups, or no insights.js)
  function leagueCard(q) {
    if (typeof INSIGHTS === 'undefined') return null;
    const scoresOf = items => INSIGHTS.groupScores(INSIGHTS.topicSummary(state.topic, language, items), items);
    const after = scoresOf(topicRecords());
    const before = q.before ? scoresOf(q.before) : null;
    const name = state.topic.en;
    const svg = INSIGHTS.radarSVG(before || after, { label: name });
    if (!svg) return null;
    const change = before ? INSIGHTS.leagueChange(before, after) : null;
    const shown = change ? change.from : INSIGHTS.radarLeagueFor(after);
    return {
      before, after, change, name,
      html: `<section class="quiz-league league-${shown.id}">
        <h3>Your ${esc(name)} chart</h3>
        <p class="league-name">${esc(shown.name)} league</p>
        ${svg}
        <p class="league-message" aria-live="polite"></p>
      </section>`,
    };
  }

  // Grow the chart from where it was before the quiz to where it is now, over a dashed outline of the old chart.
  // It grows at the old zoom first; a promotion then recolours the card while the chart zooms out to the new league.
  function animateLeague(root, { before, after, change, name }) {
    const card = $('.quiz-league', root);
    if (!card || !before) return;
    const svg = $('svg.radar', card);
    const message = $('.league-message', card);
    const text = INSIGHTS.leagueMessage(change, name);
    const start = INSIGHTS.radarTween(before, after, 0);
    const ghost = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    ghost.setAttribute('class', 'radar-shape-before');
    $('.radar-shape-correct', svg).before(ghost);
    const shapes = [$('.radar-shape-correct', svg), $('.radar-shape', svg)];
    const hits = [...svg.querySelectorAll('.radar-hit')];
    const draw = frame => {
      const f = INSIGHTS.radarShapes(frame);
      ghost.setAttribute('points', INSIGHTS.radarShapes({ ...start, scale: frame.scale }).correct);   // the old chart zooms with the new one
      shapes[0].setAttribute('points', f.correct);
      shapes[1].setAttribute('points', f.mastered);
      f.vertices.forEach(([x, y], i) => { if (hits[i]) { hits[i].setAttribute('cx', x); hits[i].setAttribute('cy', y); } });
    };
    const promote = () => {
      card.classList.replace(`league-${change.from.id}`, `league-${change.to.id}`);
      $('.league-name', card).textContent = `${change.to.name} league`;
      card.classList.add('promoted');
    };
    const finish = () => {
      message.textContent = text;
      message.classList.add('shown');
      // the tooltips, badge popups and screen-reader label describe the final scores
      const fresh = new DOMParser().parseFromString(INSIGHTS.radarSVG(after, { label: name }), 'image/svg+xml').documentElement;
      svg.setAttribute('aria-label', fresh.getAttribute('aria-label'));
      const tips = [...fresh.querySelectorAll('.radar-point')].map(p => p.getAttribute('data-tip'));
      svg.querySelectorAll('.radar-point').forEach((p, i) => p.setAttribute('data-tip', tips[i]));
      const stats = [...fresh.querySelectorAll('.radar-badge')].map(b => b.getAttribute('data-stats'));
      svg.querySelectorAll('.radar-badge').forEach((b, i) => b.setAttribute('data-stats', stats[i]));
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      draw(INSIGHTS.radarGrowth(before, after, 1));
      if (change.up) promote();
      finish();
      return;
    }
    draw(start);
    const dur = 2000, t0 = performance.now() + 900;   // starts once the score ring has filled
    const p = INSIGHTS.GROW_PHASE, ease = x => 1 - Math.pow(1 - x, 3);
    let swapped = false;
    const tick = now => {
      if (!card.isConnected) return;
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      // ease the growing and the zooming separately, so each settles before the next begins
      draw(INSIGHTS.radarGrowth(before, after, k <= p ? p * ease(k / p) : p + (1 - p) * ease((k - p) / (1 - p))));
      if (change.up && !swapped && k > p) { swapped = true; promote(); }
      if (k < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
  }

  // One ring, one coloured segment per kind of right answer, laid end to end.
  // pathLength="100" makes dash lengths percentages of the circle.
  function scoreRing(total, parts, restLabel) {
    const pct = n => total ? 100 * n / total : 0;
    const sum = parts.reduce((a, p) => a + p.n, 0);
    let from = 0;
    const arcs = parts.map(p => { const a = { ...p, from, len: pct(p.n) }; from += a.len; return a; });
    const row = (n, label, style) => `<li><i style="${style}"></i><b>${n}</b> ${esc(label)}</li>`;
    return `<figure class="score-ring" data-parts="${esc(JSON.stringify(arcs.map(a => [a.from, a.len])))}" data-n="${sum}">
      <div class="ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          <circle class="ring-track" cx="60" cy="60" r="52" pathLength="100"></circle>
          ${arcs.slice().reverse().map(a => `<circle class="ring-arc" style="${colour(a.tint)}" cx="60" cy="60" r="52" pathLength="100" transform="rotate(-90 60 60)"></circle>`).join('')}
        </svg>
        <div class="ring-num"><b>${sum}</b><span>of ${total}</span></div>
      </div>
      <figcaption>
        <p class="ring-title">${parts.length > 1 ? 'Right without revealing' : 'Right'} <span>${Math.round(pct(sum))}%</span></p>
        <ul class="ring-key">
          ${arcs.map(a => row(a.n, a.label, `background: var(--${a.tint})`)).join('')}
          ${row(total - sum, restLabel, 'background: var(--rule)')}
        </ul>
      </figcaption>
    </figure>`;
  }

  // Fill the segments one after another, as if a single pen goes round, while the number counts up.
  function animateRings(root) {
    const fig = $('.score-ring', root);
    if (!fig) return;
    const parts = JSON.parse(fig.dataset.parts), n = Number(fig.dataset.n);
    const arcs = [...fig.querySelectorAll('.ring-arc')].reverse();   // drawn in reverse so each segment's round cap sits over the next one
    const num = $('.ring-num b', fig);
    const end = parts.reduce((a, [from, len]) => Math.max(a, from + len), 0);
    const draw = fill => parts.forEach(([from, len], i) => {
      const l = Math.max(0, Math.min(len, fill - from));
      arcs[i].style.strokeDasharray = `${l} 100`;
      arcs[i].style.strokeDashoffset = -from;
      arcs[i].style.visibility = l > 0.05 ? 'visible' : 'hidden';   // a round cap on an empty dash would still show a dot
    });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(end); return; }
    const dur = 400 + end * 12, t0 = performance.now() + 200;
    draw(0); num.textContent = '0';
    const tick = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      const eased = 1 - Math.pow(1 - k, 3);
      draw(end * eased);
      num.textContent = Math.round(n * eased);
      if (k < 1 && fig.isConnected) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function setMode(mode) {
    state.mode = mode === 'notebook' ? 'notebook' : 'type';
    store.set(`${APP.storagePrefix}.mode`, state.mode);
  }

  function setCrib(on) {
    state.crib = on;
    store.set(`${APP.storagePrefix}.crib`, on);
  }

  /* ---------- language switch ---------- */
  // Each language lives in its own folder beside this one. Its link carries the page you are on (#past/quiz),
  // which the other language opens if it has that topic too.
  function renderLanguages() {
    const el = $('#languages');
    if (!el || typeof LANGUAGES === 'undefined' || LANGUAGES.length < 2) return;
    el.hidden = false;
    el.innerHTML = LANGUAGES.map(l => l.lang === APP.lang
      ? `<a aria-current="page" lang="${l.lang}">${esc(l.name)}</a>`
      : `<a href="../${l.id}/index.html" data-lang="${l.id}" lang="${l.lang}">${esc(l.name)}</a>`).join('');
  }
  const updateLanguageLinks = () => document.querySelectorAll('#languages a[data-lang]').forEach(a => { a.href = `../${a.dataset.lang}/index.html${pageHash()}`; });

  /* ---------- view switching ---------- */
  // Each topic and view is a history entry (#past/quiz, #cases/tables), so the browser's Back and Forward buttons move between them.
  const VIEW_SLUG = { table: 'tables', quiz: 'quiz' };
  const SLUG_VIEW = { tables: 'table', forms: 'table', quiz: 'quiz' };   // #forms and a bare #quiz are older links
  const pageHash = () => `#${state.topic.id}/${VIEW_SLUG[state.view]}`;
  function readHash() {
    const [a, b] = location.hash.slice(1).split('/');
    return { topic: TOPICS.find(t => t.id === a) || state.topic, view: SLUG_VIEW[b ?? a] || state.view };
  }
  function pushPage() { if (location.hash !== pageHash()) history.pushState(null, '', pageHash()); }
  function setView(view, push = true) {
    state.view = view;
    store.set(`${APP.storagePrefix}.view`, view);
    if (push) pushPage();
    renderView();
  }
  window.addEventListener('popstate', () => {
    const { topic, view } = readHash();
    state.view = view;
    store.set(`${APP.storagePrefix}.view`, view);
    if (topic !== state.topic) setTopic(topic.id, false); else renderView();
    if (location.hash !== pageHash()) history.replaceState(null, '', pageHash());   // tidy an old or mistyped hash
    if (view === 'quiz' && state.quiz) scrollToQuiz();
  });

  function renderView() {
    document.querySelectorAll('.view-btn').forEach(b => {
      if (b.dataset.view === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#view-table').hidden = state.view !== 'table';
    $('#view-quiz').hidden = state.view !== 'quiz';
    hideTip();
    updateLanguageLinks();
    // shared by every language (no storage prefix): the account page's "back" returns to the page practised last
    store.set('blabilingo.lastPage', { language, hash: pageHash() });
    if (state.view === 'table') renderTable(); else renderQuiz();
  }

  /* ---------- translation tooltip ---------- */
  const tip = $('#tip');
  const TAG_NAMES = { m1: 'masculine', m2: 'masculine', m: 'masculine', n: 'neuter', f: 'feminine' };
  const TAG_DETAIL = { m1: 'animate', m2: 'inanimate' };
  function showTip(el) {
    const tag = el.dataset.tag || '';
    const [g, num] = tag.split('.');
    tip.className = 'tip' + (g ? ` tip-${g[0]}` : '');
    tip.innerHTML = `<span class="tip-gloss">${esc(el.dataset.gloss)}</span>${g ? `<span class="tip-meta"><i class="tip-g">${TAG_NAMES[g]}${TAG_DETAIL[g] ? `, ${TAG_DETAIL[g]}` : ''}</i>${num === 'pl' ? '<i class="tip-pl">plural</i>' : ''}</span>` : ''}`;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const centre = r.left + r.width / 2;
    const left = Math.max(8, Math.min(centre - t.width / 2, window.innerWidth - t.width - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(4, r.top - t.height - 10)}px`;
    tip.style.setProperty('--arrow', `${Math.max(12, Math.min(centre - left, t.width - 12))}px`);
  }
  function hideTip() { tip.hidden = true; }

  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-gloss]'); if (el) showTip(el); });
  document.addEventListener('mouseout', e => { if (e.target.closest('[data-gloss]')) hideTip(); });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-gloss]'); if (el) showTip(el); else hideTip(); });
  document.addEventListener('focusout', e => { if (e.target.closest('[data-gloss]')) hideTip(); });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- speech: click a word to hear it ---------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let plVoice = null;
  function pickVoice() {
    const voices = synth.getVoices().filter(v => v.lang.toLowerCase().replace('_', '-').split('-')[0] === APP.lang);
    plVoice = voices.find(v => /google/i.test(v.name)) || voices.find(v => !v.localService) || voices[0] || null;
  }
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
  }

  function speechNote(text) {
    const el = $('#speech-note');
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
  }

  function say(text) {
    if (!synth) { speechNote('This browser cannot read text aloud. Try Google Chrome.'); return; }
    if (!plVoice) pickVoice();
    synth.cancel();                          // drop anything still queued so clicks never pile up
    const u = new SpeechSynthesisUtterance(text);
    u.lang = APP.speech;
    if (plVoice) u.voice = plVoice;
    u.rate = 0.85;
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') speechNote('The browser could not play the audio. Check your internet connection, or try Google Chrome.'); };
    synth.speak(u);
    speechNote(plVoice ? '' : `No ${APP.languageName} voice was found in this browser, so it may sound wrong or stay silent. Google Chrome includes one.`);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const topicBtn = e.target.closest('.topic-btn');
    if (topicBtn) { setTopic(topicBtn.dataset.topic); return; }

    const stripe = e.target.closest('.stripe');
    if (stripe) { toggleGroup(stripe.dataset.group); $(`.stripe[data-group="${stripe.dataset.group}"]`).focus(); return; }

    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) { setView(viewBtn.dataset.view); return; }

    const spoken = e.target.closest('[data-say]');
    if (spoken) {
      if (spoken.dataset.gloss) showTip(spoken);   // tap support for the translation
      say(spoken.dataset.say);
      return;
    }

    const letter = e.target.closest('[data-letter]');
    if (letter) {
      const input = $('#answer');
      const { selectionStart: a, selectionEnd: b, value } = input;
      input.value = value.slice(0, a) + letter.dataset.letter + value.slice(b);
      if (state.quiz) state.quiz.typed = input.value;
      input.focus();
      input.setSelectionRange(a + 1, a + 1);
      return;
    }

    const cribTab = e.target.closest('[data-crib]');
    if (cribTab) { state.cribGroup = cribTab.dataset.crib; renderQuiz(); $(`[data-crib="${state.cribGroup}"]`)?.focus(); return; }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'start') startQuiz(pool());
    else if (action === 'reveal') reveal();
    else if (action === 'resume') resumeQuiz();
    else if (action === 'reset') { state.confirmReset = true; renderQuiz(); }
    else if (action === 'reset-no') { state.confirmReset = false; renderQuiz(); }
    else if (action === 'reset-yes') { Object.keys(progress).forEach(k => delete progress[k]); saveProgress(); store.set(`${APP.storagePrefix}.resume`, null); state.confirmReset = false; renderQuiz(); renderForgotten(); }
    else if (action === 'next') next();
    else if (action === 'mark-right') selfMark(true);
    else if (action === 'mark-wrong') selfMark(false);
    else if (action === 'switch-mode') {
      const input = $('#answer');
      if (input) state.quiz.typed = input.value;
      setMode(isNotebook() ? 'type' : 'notebook');
      renderQuiz();
    }
    else if (action === 'toggle-crib') {
      const input = $('#answer');
      if (input) state.quiz.typed = input.value;
      setCrib(!state.crib);
      renderQuiz();
    }
    else if (action === 'retry-missed') startQuiz(state.quiz.results.filter(r => !r.right).map(r => r.item), true);
    else if (action === 'practise-forgotten') practiseForgotten(e.target.closest('[data-action]').dataset.topic);
    else if (action === 'see-sounds') { setView('table'); document.getElementById('ref-sounds')?.scrollIntoView(); }
    else if (action === 'see-table') {
      setView('table');
      document.getElementById(`ref-${e.target.closest('[data-group]').dataset.group}`)?.scrollIntoView();
    }
  });

  document.addEventListener('keydown', e => {
    const spoken = (e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-say]');
    if (spoken) { e.preventDefault(); say(spoken.dataset.say); return; }
    const q = state.quiz;
    if (!q || state.view !== 'quiz' || !q.revealed || !isNotebook() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'y') { e.preventDefault(); selfMark(true); }
    else if (k === 'n') { e.preventDefault(); selfMark(false); }
  });

  // keep what is typed in the quiz state as it is typed, so redrawing the quiz (a table tab, showing the tables) keeps it
  document.addEventListener('input', e => { if (e.target.id === 'answer' && state.quiz && !state.quiz.revealed) state.quiz.typed = e.target.value; });

  // a small arrow back up to the quiz, once the sentence has scrolled out of sight while checking a table further down
  const toQuiz = document.createElement('button');
  toQuiz.type = 'button';
  toQuiz.className = 'to-quiz';
  toQuiz.hidden = true;
  toQuiz.setAttribute('aria-label', 'Back to the quiz');
  document.body.append(toQuiz);
  const placeToQuiz = () => {
    const quiz = $('#view-quiz'), sentence = quiz && !quiz.hidden && quiz.querySelector('.sentence');
    toQuiz.hidden = !sentence || sentence.getBoundingClientRect().bottom > 0;
  };
  window.addEventListener('scroll', placeToQuiz, { passive: true });
  window.addEventListener('resize', placeToQuiz);
  document.addEventListener('click', () => requestAnimationFrame(placeToQuiz));   // a view switch or a redraw moves things too
  toQuiz.addEventListener('click', () => {
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: $('#view-quiz').getBoundingClientRect().top + window.scrollY - 8, behavior: smooth ? 'smooth' : 'instant' });
    ($('#answer') || $('#next-btn') || $('#reveal-btn'))?.focus({ preventScroll: true });
    toQuiz.hidden = true;
  });

  document.addEventListener('submit', e => { if (e.target.id === 'answer-form') { e.preventDefault(); if (!state.quiz.revealed) checkAnswer(); } });
  document.addEventListener('change', e => {
    if (e.target.id === 'show-group') { state.showGroup = e.target.checked; store.set(`${APP.storagePrefix}.showCase`, state.showGroup); }
    if (e.target.id === 'crib') setCrib(e.target.checked);
    if (e.target.name === 'mode') setMode(e.target.value);
    if (e.target.name === 'kind') { state.kinds[state.topic.id] = e.target.value; store.set(`${APP.storagePrefix}.kind`, state.kinds); renderFilter(); renderQuiz(); $(`input[name="kind"][value="${e.target.value}"]`)?.focus(); }
    if (e.target.name === 'order') { state.order = e.target.value; store.set(`${APP.storagePrefix}.order`, state.order); }
    if (e.target.name === 'length') { state.length = Number(e.target.value); store.set(`${APP.storagePrefix}.length`, state.length); }
  });
  $('#all-groups').addEventListener('click', () => { state.selected[state.topic.id] = new Set(state.topic.allIds); afterFilterChange(); });

  ({ topic: state.topic, view: state.view } = readHash());   // a link to a page wins over where you left off
  // an unfinished quiz survives a reload: carry on from the same sentence instead of showing the start screen
  if (state.view === 'quiz') state.quiz = savedQuiz();
  // #past/forgotten, the account page's practise link: start on the forgotten words now, or once the account's progress arrives
  let forgottenLink = location.hash.split('/')[1] === 'forgotten' ? state.topic.id : null;
  const followForgottenLink = () => {
    if (!forgottenLink || typeof INSIGHTS === 'undefined') return;
    const group = INSIGHTS.forgottenByTopic(INSIGHTS.forgottenWords(progress, { glosses: wordGlosses })).find(g => g.topic === forgottenLink);
    if (group) { forgottenLink = null; practiseForgotten(group.topic); }
  };
  // core/sync.js merges a signed-in account's progress into this browser's, then redraws
  window.blabilingo = {
    progress,
    topics: TOPICS.map(t => t.id),
    saveLocal: () => store.set(`${APP.storagePrefix}.progress`, progress),
    refresh: () => { renderForgotten(); if (!state.quiz) renderView(); followForgottenLink(); },   // the banner is safe to redraw; never redraw under a question being answered
    // topic/group names, colours and glosses to save alongside progress; omitted if insights.js failed to load
    ...(typeof INSIGHTS !== 'undefined' ? { summary: (topicId, items) => INSIGHTS.topicSummary(TOPICS.find(t => t.id === topicId), language, items) } : {}),
  };

  history.replaceState(null, '', pageHash());
  renderLanguages();
  renderTopics();
  renderFilter();
  renderView();
  renderForgotten();
  followForgottenLink();
})();
