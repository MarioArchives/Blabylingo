/* On a language page: the account link in the masthead, and progress kept in step with the signed-in account.
   Progress stays in localStorage as before; when signed in it is also saved to
   users/{uid}/progress/{storagePrefix}-{topic}, one document per topic holding the same records as this browser,
   plus a small topic summary (K.summary, from core/insights.js) alongside them:
     items: { 'past|irregular|Wczoraj ___ do kina.|iść': { n: 5, ok: 3, streak: 0, last: 0, t: 1790000000000 }, … },
     language: 'polish', topic: { id: 'past', pl: …, en: … }, groups: [{ id, pl, short?, en, colour, total }], glosses: { … }
   n is times answered, ok times right (so n - ok were wrong), last 0 means wrong the last time, t when last answered.
   The summary exists so account.html can show topic and word names for every language's progress without loading
   that language's data files: polish/ and spanish/ data files define the same globals (SENTENCES, CASES, …), so
   only one language's scripts can be on the page at a time, and the account page needs both at once.
   Answering also marks the day on the profile (users/{uid}), which keeps the streak and the languages practised. */
import { onUser, ensureProfile, nameOf, pageUrl, db, doc, getDoc, setDoc, runTransaction, arrayUnion, serverTimestamp } from './cloud.js';

const K = window.blabilingo;          // set by core/app.js
const box = document.getElementById('account');
const language = (typeof LANGUAGES !== 'undefined' && LANGUAGES.find(l => l.lang === APP.lang)?.id) || APP.lang;
let uid = null;
let timer = null;
let activeDay = null;                 // the day this page last marked on the profile

const docId = topic => `${APP.storagePrefix}-${topic}`;
const topicOf = key => key.split('|')[0];
// Keep the record with more attempts, the newer one on a tie
const better = (a, b) => !a ? b : !b ? a : (b.n > a.n || (b.n === a.n && (b.t || 0) > (a.t || 0))) ? b : a;
const escape = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const here = () => location.pathname + location.hash;
// 'YYYY-MM-DD' in the learner's time zone, so a streak day ends at their midnight
const dayOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function renderAccount(user, profile) {
  if (!box) return;
  box.innerHTML = user
    ? `<a href="${pageUrl('account.html')}">${escape(nameOf(profile || {}, user))}</a>`
    : `<a href="${pageUrl('signin.html')}?next=${encodeURIComponent(here())}">Sign in</a>`;
}

// Bring in what the account has, then save the combined records back so both sides match
async function pull() {
  for (const topic of K.topics) {
    const snap = await getDoc(doc(db, 'users', uid, 'progress', docId(topic)));
    const remote = snap.exists() ? snap.data().items || {} : {};
    for (const [k, r] of Object.entries(remote)) K.progress[k] = better(K.progress[k], r);
  }
  K.saveLocal();
  K.refresh();
  await push();
  // answers given in this browser today, before signing in, count towards the streak
  const today = dayOf(new Date());
  if (Object.values(K.progress).some(r => r.t && dayOf(new Date(r.t)) === today)) await markDay();
}

// Each topic's document is replaced whole, so a reset in the app clears it in the account too
async function push() {
  if (!uid) return;
  const uidNow = uid;
  await Promise.all(K.topics.map(topic => {
    const items = Object.fromEntries(Object.entries(K.progress).filter(([k]) => topicOf(k) === topic));
    return setDoc(doc(db, 'users', uidNow, 'progress', docId(topic)), { items, updatedAt: serverTimestamp(), ...(K.summary ? K.summary(topic, items) : {}) });
  }));
}

// Once a day per page: extend the streak if the last answer was yesterday, start again if it was longer ago
async function markDay() {
  const now = new Date();
  const today = dayOf(now);
  if (!uid || activeDay === today) return;
  activeDay = today;
  const yesterday = dayOf(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async tx => {
    const p = (await tx.get(ref)).data() || {};
    if (p.lastDay === today && (p.languages || []).includes(language)) return;
    const streak = p.lastDay === today ? p.streak || 1 : p.lastDay === yesterday ? (p.streak || 0) + 1 : 1;
    tx.set(ref, { lastDay: today, streak, bestStreak: Math.max(p.bestStreak || 0, streak), languages: arrayUnion(language) }, { merge: true });
  });
}

const warn = what => err => console.warn(what, err);

// app.js calls this whenever progress changes (answered is false for a reset); one save per burst of answers
window.cloudSync = answered => {
  if (!uid) return;
  if (answered) markDay().catch(err => { activeDay = null; warn('Saving your streak failed')(err); });
  clearTimeout(timer);
  timer = setTimeout(() => { timer = null; push().catch(warn('Saving progress to your account failed')); }, 2000);
};
addEventListener('pagehide', () => { if (timer) { clearTimeout(timer); timer = null; push(); } });

onUser(async user => {
  uid = user?.uid ?? null;
  activeDay = null;
  renderAccount(user);
  if (!user) return;
  try {
    renderAccount(user, await ensureProfile(user));
    await pull();
  } catch (err) {
    warn('Could not load your account')(err);
  }
});
