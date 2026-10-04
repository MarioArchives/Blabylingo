/* Insights from saved progress: forgotten words, per-group scores, streaks and the radar chart.
   A plain script so file:// pages can load it; Node tests load it through module.exports. */
const INSIGHTS = (() => {
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  // A record is trustworthy only if n/ok are finite, non-negative and ok never exceeds n.
  const validRecord = r => !!r && typeof r === 'object'
    && Number.isFinite(r.n) && Number.isFinite(r.ok) && r.n >= 0 && r.ok >= 0 && r.ok <= r.n;

  const mastered = r => !!r && r.streak >= 2;

  // Keys are `topic|group|sentence|base`; the sentence itself may contain '|', so
  // the group is always the 2nd segment and the base is always the last one.
  const parseKey = key => {
    const parts = String(key).split('|');
    return { topic: parts[0], group: parts[1], base: parts[parts.length - 1] };
  };

  const forgottenWords = (progress, { glosses = {}, limit = 8, minMisses = 2 } = {}) => {
    if (!progress) return [];
    const byBase = {};
    for (const [key, r] of Object.entries(progress)) {
      if (!validRecord(r)) continue;
      const { base } = parseKey(key);
      const miss = r.n - r.ok;
      const w = byBase[base] || (byBase[base] = { base, misses: 0, n: 0, t: -Infinity, latest: null, keyRecs: [] });
      w.misses += miss;
      w.n += r.n;
      if (r.t > w.t) { w.t = r.t; w.latest = r; }               // track the most recently answered record
      if (miss > 0) w.keyRecs.push({ key, t: r.t });
    }
    return Object.values(byBase)
      .filter(w => w.misses >= minMisses && w.latest?.last !== 1)  // answering it right clears it; the next mistake brings it back
      .sort((a, b) => b.misses - a.misses || b.t - a.t)
      .slice(0, limit)
      .map(w => ({
        base: w.base,
        gloss: glosses[w.base] || '',
        misses: w.misses,
        n: w.n,
        t: w.t,
        keys: w.keyRecs.sort((a, b) => b.t - a.t).map(k => k.key),
      }));
  };

  // The forgotten words' missed sentences, one group per topic (a quiz runs inside one topic): most sentences first.
  const forgottenByTopic = words => {
    const byTopic = new Map();
    for (const w of words || []) for (const key of w.keys) {
      const { topic } = parseKey(key);
      const t = byTopic.get(topic) || byTopic.set(topic, { topic, keys: [], words: [] }).get(topic);
      t.keys.push(key);
      if (!t.words.includes(w.base)) t.words.push(w.base);
    }
    return [...byTopic.values()].sort((a, b) => b.keys.length - a.keys.length || topicCompare(a.topic, b.topic));
  };

  const groupScores = (summary, items) => {
    const stats = Object.fromEntries(summary.groups.map(g => [g.id, { seen: 0, mastered: 0, correct: 0, n: 0, ok: 0 }]));
    for (const [key, r] of Object.entries(items || {})) {
      if (!validRecord(r)) continue;
      const { topic, group } = parseKey(key);
      if (topic !== summary.topic.id) continue;
      const s = stats[group];
      if (!s) continue;
      s.seen++; s.n += r.n; s.ok += r.ok;
      if (mastered(r)) s.mastered++;
      if (r.ok > 0) s.correct++;                    // answered right at least once
    }
    return summary.groups.map(g => {
      const s = stats[g.id];
      return {
        id: g.id, pl: g.pl, short: g.short || g.pl, en: g.en, colour: g.colour, total: g.total,
        seen: s.seen, mastered: s.mastered, correct: s.correct, n: s.n, ok: s.ok,
        share: g.total > 0 ? Math.min(1, Math.max(0, s.mastered / g.total)) : 0,
        correctShare: g.total > 0 ? Math.min(1, Math.max(0, s.correct / g.total)) : 0,
        accuracy: s.n > 0 ? s.ok / s.n : null,
      };
    });
  };

  const topicSummary = (topic, language, items = {}) => {
    const knownBases = new Set(Object.keys(items).map(k => parseKey(k).base));
    const totalsByGroup = {};
    const glosses = {};
    topic.sentences.forEach(s => {
      totalsByGroup[s.c] = (totalsByGroup[s.c] || 0) + 1;
      if (knownBases.has(s.base) && !(s.base in glosses)) glosses[s.base] = s.gloss;  // first gloss in sentence order wins
    });
    return {
      language,
      topic: { id: topic.id, pl: topic.pl, en: topic.en },
      groups: topic.groups.map(g => ({ id: g.id, pl: g.pl, ...(g.short ? { short: g.short } : {}), en: g.en, colour: g.colour, total: totalsByGroup[g.id] || 0 })),
      glosses,
    };
  };

  // UTC throughout so time zones and DST never shift the day boundary.
  const previousDay = day => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const currentStreak = (profile, today) => {
    if (!profile || profile.lastDay == null) return 0;
    if (profile.lastDay !== today && profile.lastDay !== previousDay(today)) return 0;
    return Number.isFinite(profile.streak) ? profile.streak : 0;
  };

  // The past seven days, oldest first: answers per day (every language added up) from the profile's
  // days log ({ 'YYYY-MM-DD': { polish: 12, … } }), and which days belong to a streak that is still alive.
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekActivity = (days, { today, profile } = {}) => {
    const list = [today];
    while (list.length < 7) list.unshift(previousDay(list[0]));
    const streakDays = new Set();
    const streak = currentStreak(profile, today);
    for (let d = profile?.lastDay, i = 0; streak > 0 && i < Math.min(streak, 7); i++, d = previousDay(d)) streakDays.add(d);
    return list.map(day => {
      const byLang = days && typeof days[day] === 'object' && days[day] ? days[day] : {};
      const count = Object.values(byLang).reduce((sum, n) => sum + (Number.isFinite(n) && n > 0 ? n : 0), 0);
      return { day, weekday: WEEKDAYS[new Date(`${day}T00:00:00Z`).getUTCDay()], count, today: day === today, streak: streakDays.has(day) };
    });
  };

  // Weekly leaderboards reset on Monday
  const weekStartOf = day => {
    let d = day;
    for (let i = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7; i > 0; i--) d = previousDay(d);
    return d;
  };

  // Leaderboards from every learner's leaderboard/{uid} document (core/sync.js writes them):
  //   { name, hidden, right: { polish: n }, mastered: { polish: n }, rightDays: { day: { polish: n } }, masteredDays: { … } }
  // metric 'right' ranks right answers, 'mastered' sentences mastered; each period lists the top `limit`,
  // plus the viewer's own row (uid) with its real rank when it falls below the top. Equal scores share a rank.
  const leaderboards = (docs, { today, metric = 'right', uid = null, limit = 10 } = {}) => {
    const sum = byLang => byLang && typeof byLang === 'object'
      ? Object.values(byLang).reduce((s, n) => s + (Number.isFinite(n) && n > 0 ? n : 0), 0) : 0;
    const week = [today];
    for (const monday = weekStartOf(today); week[0] !== monday;) week.unshift(previousDay(week[0]));
    const learners = (docs || []).filter(d => d && d.data && !d.data.hidden).map(({ id, data }) => {
      const days = data[`${metric}Days`] || {};
      return {
        uid: id,
        name: String(data.name || '').trim() || 'A learner',
        day: sum(days[today]),
        week: week.reduce((s, d) => s + sum(days[d]), 0),
        all: sum(data[metric]),
      };
    });
    const rank = period => {
      const sorted = learners.filter(l => l[period] > 0)
        .sort((a, b) => b[period] - a[period] || a.name.localeCompare(b.name) || (a.uid < b.uid ? -1 : 1));
      const rows = sorted.map(l => ({ uid: l.uid, name: l.name, score: l[period], rank: 0, you: l.uid === uid }));
      rows.forEach((r, i) => { r.rank = i && r.score === rows[i - 1].score ? rows[i - 1].rank : i + 1; });
      const top = rows.slice(0, limit);
      const mine = rows.find(r => r.you);
      return mine && !top.includes(mine) ? [...top, mine] : top;
    };
    return { day: rank('day'), week: rank('week'), all: rank('all') };
  };

  const totals = items => {
    let answered = 0, right = 0;
    for (const r of Object.values(items || {})) {
      if (!validRecord(r)) continue;
      answered += r.n; right += r.ok;
    }
    return { answered, right, accuracy: answered > 0 ? right / answered : null };
  };

  // Axis 0 points straight up; axes go clockwise from there, evenly spaced.
  const axisPoint = (n, i, dist, cx, cy) => {
    const theta = (i * 2 * Math.PI) / n;
    return [cx + dist * Math.sin(theta), cy - dist * Math.cos(theta)];
  };

  const radarPoints = (values, radius, cx, cy) => values.map((v, i) => {
    const clamped = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
    return axisPoint(values.length, i, radius * clamped, cx, cy);
  });

  // Leagues come from the best group's share (whichever of mastered or answered right is higher),
  // counted in whole percents. Each league zooms the chart so its outer ring is the league's top,
  // so early progress fills the chart and it zooms out a league at a time as you improve.
  const RADAR_LEAGUES = [
    { id: 'bronze', name: 'Bronze', upTo: 30, scale: 0.3 },
    { id: 'silver', name: 'Silver', upTo: 70, scale: 0.7 },
    { id: 'gold', name: 'Gold', upTo: 99, scale: 1 },
    { id: 'diamond', name: 'Diamond', upTo: 100, scale: 1 },
  ];
  const clampShare = v => Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  const radarLeague = maxShare => {
    const pct = Math.round(clampShare(maxShare) * 100);
    return RADAR_LEAGUES.find(l => pct <= l.upTo);
  };
  const radarLeagueFor = scores => radarLeague(Math.max(0, ...(scores || []).map(s => Math.max(clampShare(s.share), clampShare(s.correctShare)))));

  // Every chart uses the same frame, so shapes are the same size whatever the group count or names.
  // It leaves room for a label of LABEL_CHARS at the end of any axis; longer names are squeezed to fit.
  const RADAR_R = 100, LABEL_GAP = 12, LABEL_FONT = 17, LABEL_CHARS = 7;
  const CHAR_WIDTH = LABEL_FONT * 0.58;             // a generous Lato average, so estimated widths never fall short
  const LABEL_ROOM = LABEL_CHARS * CHAR_WIDTH;
  const RADAR_VIEWBOX = (() => {
    const reach = RADAR_R + LABEL_GAP;
    const x = Math.ceil(reach + LABEL_ROOM) + 4;
    const top = Math.ceil(reach + LABEL_FONT) + 4, bottom = Math.ceil(reach + 0.3 * LABEL_FONT) + 4;
    return `${-x} ${-top} ${2 * x} ${top + bottom}`;
  })();

  // Clamped shares per group; answered right is never below mastered, so its shape never sits inside.
  const radarEnds = scores => {
    const shares = scores.map(s => clampShare(s.share));
    return { shares, correctShares: scores.map((s, i) => Math.max(shares[i], clampShare(s.correctShare))) };
  };

  // Polygons and mastered-shape vertices for one frame: radius is share over the league zoom, capped at the outer ring.
  const radarShapes = ({ shares, correctShares, scale }) => {
    const n = shares.length, round = v => Math.round(v * 10) / 10;
    const pts = vals => vals.map((v, i) => axisPoint(n, i, RADAR_R * Math.min(1, v / scale), 0, 0));
    const attr = ps => ps.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
    const vertices = pts(shares);
    return { mastered: attr(vertices), correct: attr(pts(correctShares)), vertices };
  };

  // A frame between two quizzes' charts (k 0 = before, 1 = after). A missing before is an empty bronze chart.
  const radarTween = (beforeScores, afterScores, k) => {
    const t = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : 0;
    const after = afterScores || [];
    const hasBefore = beforeScores && beforeScores.length;
    const a = radarEnds(after);
    const b = hasBefore ? radarEnds(beforeScores) : { shares: after.map(() => 0), correctShares: after.map(() => 0) };
    const mix = (x, y) => x + (y - x) * t;
    return {
      shares: a.shares.map((v, i) => mix(b.shares[i] ?? 0, v)),
      correctShares: a.correctShares.map((v, i) => mix(b.correctShares[i] ?? 0, v)),
      scale: mix(radarLeagueFor(hasBefore ? beforeScores : []).scale, radarLeagueFor(after).scale),
    };
  };

  // The after-quiz animation in two steps, so the growth shows even when the league changes:
  // up to GROW_PHASE the shapes grow at the old zoom (capped at the outer ring), then the chart zooms out to the new league.
  const GROW_PHASE = 0.6;
  const radarGrowth = (beforeScores, afterScores, k) => {
    const t = Number.isFinite(k) ? Math.min(1, Math.max(0, k)) : 0;
    const scaleAt = x => radarTween(beforeScores, afterScores, x).scale;
    if (t <= GROW_PHASE) return { ...radarTween(beforeScores, afterScores, t / GROW_PHASE), scale: scaleAt(0) };
    return { ...radarTween(beforeScores, afterScores, 1), scale: scaleAt((t - GROW_PHASE) / (1 - GROW_PHASE)) };
  };

  const leagueChange = (beforeScores, afterScores) => {
    const from = radarLeagueFor(beforeScores), to = radarLeagueFor(afterScores);
    return { from, to, up: RADAR_LEAGUES.indexOf(to) > RADAR_LEAGUES.indexOf(from) };
  };

  // Short and cheerful: a promotion names only the league reached, and any quiz that ends in Bronze gets a nudge.
  const LEAGUE_MESSAGES = {
    bronze: () => 'Bronze league. Keep climbing!',
    silver: () => 'Up to Silver! Nice work.',
    gold: () => 'Gold! You are on a roll.',
    diamond: topic => `Diamond! You have mastered ${topic}.`,
  };
  const leagueMessage = (change, topicName) => {
    if (!change || !(change.up || change.to.id === 'bronze')) return '';
    return LEAGUE_MESSAGES[change.to.id](esc(topicName));
  };

  const radarSVG = (scores, { label = '' } = {}) => {
    if (!scores || scores.length < 3) return '';
    const n = scores.length;
    const r = RADAR_R, cx = 0, cy = 0;
    const round = v => Math.round(v * 10) / 10;
    const pointsAttr = pts => pts.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
    const { shares, correctShares } = radarEnds(scores);
    const league = radarLeagueFor(scores), scale = league.scale;
    const shapes = radarShapes({ shares, correctShares, scale });

    const rings = [0.25, 0.5, 0.75, 1].map(frac => {
      const pts = Array.from({ length: n }, (_, i) => axisPoint(n, i, r * frac, cx, cy));
      return `<polygon class="radar-ring" points="${pointsAttr(pts)}"/>`;
    }).join('');

    const bgPts = Array.from({ length: n }, (_, i) => axisPoint(n, i, r, cx, cy));
    const background = `<polygon class="radar-bg" points="${pointsAttr(bgPts)}"/>`;

    const axes = scores.map((_, i) => {
      const [x, y] = axisPoint(n, i, r, cx, cy);
      return `<line class="radar-axis" x1="${round(cx)}" y1="${round(cy)}" x2="${round(x)}" y2="${round(y)}"/>`;
    }).join('');

    const shape = `<polygon class="radar-shape" points="${shapes.mastered}"/>`;
    const correctShape = `<polygon class="radar-shape-correct" points="${shapes.correct}"/>`;

    const points = scores.map((s, i) => {
      const [x, y] = shapes.vertices[i];
      const acc = s.accuracy == null ? 'not practised yet' : `${Math.round(s.accuracy * 100)}% right`;
      const tip = esc(`${s.en}: ${s.mastered} of ${s.total} mastered · ${s.correct || 0} answered right · ${acc}`);
      return `<g class="radar-point" tabindex="0" data-tip="${tip}">`
        + `<circle class="radar-hit" r="16" cx="${round(x)}" cy="${round(y)}"/></g>`;
    }).join('');

    // Short names at each axis end; anything wider than the frame allows is squeezed
    const labels = scores.map((s, i) => {
      const [x, y] = axisPoint(n, i, r + LABEL_GAP, cx, cy);
      const anchor = Math.abs(x - cx) < 1 ? 'middle' : x > cx ? 'start' : 'end';
      const text = String(s.short || s.pl);
      const fit = text.length * CHAR_WIDTH > LABEL_ROOM ? ` textLength="${round(LABEL_ROOM)}" lengthAdjust="spacingAndGlyphs"` : '';
      return `<text class="radar-label" x="${round(x)}" y="${round(y)}" text-anchor="${anchor}" font-size="${LABEL_FONT}"${fit}`
        + `><title>${esc(s.pl)}</title>${esc(text)}</text>`;
    }).join('');

    const aria = `${esc(label)}, ${league.name} league, zoomed to ${Math.round(scale * 100)}%: ${scores.map((s, i) => `${esc(s.pl)} ${Math.round(shares[i] * 100)}% mastered, ${Math.round(correctShares[i] * 100)}% answered right`).join(', ')}`;

    return `<svg class="radar" viewBox="${RADAR_VIEWBOX}" role="img" aria-label="${aria}">`
      + `${background}${rings}${axes}${correctShape}${shape}${points}${labels}</svg>`;
  };

  const TOPIC_ORDER = ['cases', 'present', 'past', 'future', 'numbers', 'idioms'];
  const topicCompare = (a, b) => {
    const ia = TOPIC_ORDER.indexOf(a), ib = TOPIC_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  };

  const accountModel = (docs, { languages }) => {
    const byLang = new Map();    // language id -> [{ id: topicId, docId, stale, summary, items, glosses }]
    for (const { id: docId, data } of docs || []) {
      const lang = languages.find(l => l.id === data?.language) || languages.find(l => docId.startsWith(`${l.prefix}-`));
      if (!lang) continue;
      const topicId = data.topic?.id || docId.slice(lang.prefix.length + 1);
      const stale = !data.groups;
      const items = data.items || {};
      const summary = stale ? null : {
        language: data.language || lang.id,
        topic: data.topic,
        groups: data.groups,
        glosses: data.glosses || {},
      };
      if (!byLang.has(lang.id)) byLang.set(lang.id, []);
      byLang.get(lang.id).push({ id: topicId, docId, stale, summary, items, glosses: data.glosses || {} });
    }

    // Each language gets its own totals and forgotten words for the account page's language switch;
    // the account-wide ones merge them. Stale documents' items count too.
    const recordsOf = list => Object.fromEntries(list.flatMap(t => Object.entries(t.items).map(([k, r]) => [`${t.docId}|${k}`, r])));
    const resultLanguages = languages
      .filter(l => byLang.has(l.id))
      .map(l => {
        const list = byLang.get(l.id);
        const items = {}, glosses = {};
        for (const t of list) { Object.assign(items, t.items); Object.assign(glosses, t.glosses); }
        return {
          id: l.id,
          topics: list.slice().sort((a, b) => topicCompare(a.id, b.id)).map(t => ({
            id: t.id,
            docId: t.docId,
            stale: t.stale,
            summary: t.summary,
            scores: t.summary ? groupScores(t.summary, t.items) : null,
            items: t.items,
          })),
          allForgotten: forgottenWords(items, { glosses, limit: Infinity }).map(w => ({ ...w, language: l.id })),
          totals: totals(recordsOf(list)),
        };
      });

    const forgotten = resultLanguages.flatMap(l => l.allForgotten).sort((a, b) => b.misses - a.misses || b.t - a.t);
    const totalsOut = totals(recordsOf([...byLang.values()].flat()));
    resultLanguages.forEach(l => { l.forgotten = l.allForgotten.slice(0, 8); delete l.allForgotten; });

    return { languages: resultLanguages, forgotten: forgotten.slice(0, 8), totals: totalsOut };
  };

  return {
    parseKey,
    forgottenWords,
    forgottenByTopic,
    groupScores,
    topicSummary,
    previousDay,
    currentStreak,
    weekActivity,
    weekStartOf,
    leaderboards,
    totals,
    radarPoints,
    radarLeague,
    radarLeagueFor,
    radarSVG,
    radarTween,
    radarShapes,
    radarGrowth,
    GROW_PHASE,
    leagueChange,
    leagueMessage,
    accountModel,
  };
})();
if (typeof module !== 'undefined') module.exports = INSIGHTS;
