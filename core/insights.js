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
      .filter(w => w.misses >= minMisses && !mastered(w.latest))  // a right-twice streak on the latest sentence clears it
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

  // The outer ring's value: the smallest step that fits the best 'answered right' share,
  // so early progress fills the chart and it zooms out in steps (not every answer) as you improve.
  const RADAR_STEPS = [0.1, 0.25, 0.5, 1];
  const radarScale = maxShare => RADAR_STEPS.find(step => maxShare <= step + 1e-9) || 1;
  const clampShare = v => Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0;
  const radarScaleFor = scores => radarScale(Math.max(0, ...(scores || []).map(s => Math.max(clampShare(s.share), clampShare(s.correctShare)))));

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

  const radarSVG = (scores, { label = '' } = {}) => {
    if (!scores || scores.length < 3) return '';
    const n = scores.length;
    const r = RADAR_R, cx = 0, cy = 0;
    const round = v => Math.round(v * 10) / 10;
    const pointsAttr = pts => pts.map(([x, y]) => `${round(x)},${round(y)}`).join(' ');
    const shares = scores.map(s => clampShare(s.share));
    const correctShares = scores.map((s, i) => Math.max(shares[i], clampShare(s.correctShare)));  // never inside the mastered shape
    const scale = radarScaleFor(scores);
    const scaled = v => Math.min(1, v / scale);

    const rings = [0.25, 0.5, 0.75, 1].map(frac => {
      const pts = Array.from({ length: n }, (_, i) => axisPoint(n, i, r * frac, cx, cy));
      return `<polygon class="radar-ring" points="${pointsAttr(pts)}"/>`;
    }).join('');

    const axes = scores.map((_, i) => {
      const [x, y] = axisPoint(n, i, r, cx, cy);
      return `<line class="radar-axis" x1="${round(cx)}" y1="${round(cy)}" x2="${round(x)}" y2="${round(y)}"/>`;
    }).join('');

    const shapePts = shares.map((share, i) => axisPoint(n, i, r * scaled(share), cx, cy));
    const shape = `<polygon class="radar-shape" points="${pointsAttr(shapePts)}"/>`;
    const correctPts = correctShares.map((share, i) => axisPoint(n, i, r * scaled(share), cx, cy));
    const correctShape = `<polygon class="radar-shape-correct" points="${pointsAttr(correctPts)}"/>`;

    const points = scores.map((s, i) => {
      const [x, y] = shapePts[i];
      const acc = s.accuracy == null ? 'not practised yet' : `${Math.round(s.accuracy * 100)}% right`;
      const tip = esc(`${s.en}: ${s.mastered} of ${s.total} mastered · ${s.correct || 0} answered right · ${acc}`);
      return `<g class="radar-point" tabindex="0" data-tip="${tip}">`
        + `<circle class="radar-hit" r="16" cx="${round(x)}" cy="${round(y)}"/>`
        + `<circle class="radar-dot" r="5" cx="${round(x)}" cy="${round(y)}"/></g>`;
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

    const aria = `${esc(label)}, zoomed to ${Math.round(scale * 100)}%: ${scores.map((s, i) => `${esc(s.pl)} ${Math.round(shares[i] * 100)}% mastered, ${Math.round(correctShares[i] * 100)}% answered right`).join(', ')}`;

    return `<svg class="radar" viewBox="${RADAR_VIEWBOX}" role="img" aria-label="${aria}">`
      + `${rings}${axes}${correctShape}${shape}${points}${labels}</svg>`;
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
    groupScores,
    topicSummary,
    previousDay,
    currentStreak,
    totals,
    radarPoints,
    radarScale,
    radarScaleFor,
    radarSVG,
    accountModel,
  };
})();
if (typeof module !== 'undefined') module.exports = INSIGHTS;
