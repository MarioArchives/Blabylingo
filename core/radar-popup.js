/* Click, tap or press Enter on a radar chart's initial badge to see that group's scores in a popup.
   Used on the account page and on the end-of-quiz chart; the badge's data-stats comes from INSIGHTS.radarSVG. */
(() => {
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let dialog = null, opener = null;

  function ensureDialog() {
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'radar-pop';
    dialog.setAttribute('aria-labelledby', 'radar-pop-title');
    // a click on the backdrop lands on the dialog itself, outside its body
    dialog.addEventListener('click', e => { if (e.target === dialog || e.target.closest('.radar-pop-close')) dialog.close(); });
    dialog.addEventListener('close', () => { if (opener && opener.isConnected) opener.focus(); opener = null; });
    document.body.append(dialog);
    return dialog;
  }

  const bar = (label, count, total, colour) => {
    const width = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
    return `<div><dt>${label}</dt><dd>${count} of ${total}</dd>
      <dd class="radar-pop-track" aria-hidden="true"><span class="radar-pop-fill" style="--bar: var(--${colour}); width: ${width}%"></span></dd></div>`;
  };

  function open(badge) {
    let s;
    try { s = JSON.parse(badge.getAttribute('data-stats')); } catch { return; }
    const d = ensureDialog();
    // the popup takes the chart's league colours for its bars
    const league = [...(badge.closest('[class*="league-"]')?.classList || [])].find(c => c.startsWith('league-'));
    d.className = `radar-pop${league ? ` ${league}` : ''}`;
    // the answer count sits with the accuracy it was worked out from
    const accuracy = s.accuracy == null ? ''
      : `<div><dt>Accuracy <small>over ${s.answers} answer${s.answers === 1 ? '' : 's'}</small></dt><dd>${Math.round(s.accuracy * 100)}%</dd></div>`;
    d.innerHTML = `<div class="radar-pop-body">
      <header class="radar-pop-head">
        <span class="radar-pop-badge" style="--c: ${s.colour ? `var(--${esc(s.colour)})` : 'var(--ink-soft)'}" aria-hidden="true">${esc(s.ini)}</span>
        <div><h2 id="radar-pop-title">${esc(s.pl)}</h2><p class="radar-pop-en">${esc(s.en)}</p></div>
        <button type="button" class="radar-pop-close" aria-label="Close">×</button>
      </header>
      <dl class="radar-pop-stats">
        ${bar('Seen', s.seen, s.total, 'edge')}
        ${bar('Answered right', s.correct, s.total, 'correct')}
        ${bar('Mastered', s.mastered, s.total, 'mastered')}
        ${accuracy}
      </dl>
      ${s.accuracy == null ? '<p class="radar-pop-note">Not practised yet.</p>' : ''}
    </div>`;
    opener = badge;
    d.showModal();
  }

  document.addEventListener('click', e => {
    const badge = e.target.closest?.('.radar-badge');
    if (badge) open(badge);
  });
  document.addEventListener('keydown', e => {
    const badge = e.target.closest?.('.radar-badge');
    if (badge && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(badge); }
  });
})();
