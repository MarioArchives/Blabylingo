/* Accounts: Google sign-in through Firebase Auth, and one profile document per user in Firestore.
   Loaded as a module, so it needs the site served over http(s); opened from file:// the app simply runs without accounts. */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, deleteDoc, runTransaction, arrayUnion, increment, serverTimestamp, collection, getDocs }
  from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore-lite.js';   // plain requests: ad blockers stop the full SDK's live channel
import { firebaseConfig } from '../firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// The site root, for links from any page (a language folder or the root itself)
export const rootUrl = new URL('../', import.meta.url);
export const pageUrl = name => new URL(name, rootUrl).href;

// Resolves with the signed-in user or null once Firebase has restored any saved session
export const currentUser = () => new Promise(resolve => {
  const stop = onAuthStateChanged(auth, user => { stop(); resolve(user); });
});
export const onUser = callback => onAuthStateChanged(auth, callback);

// Signing in for the first time creates the account: Firebase Auth adds the user and we add their profile.
export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  // Signing in has worked at this point; a database problem shows on the account page instead of blocking it
  await ensureProfile(user).catch(err => console.warn('Signed in, but saving your profile failed', err));
  return user;
}
export const signOutUser = () => signOut(auth);

/* users/{uid}:
     username     the name shown on the site: the learner's chosen nickname, or their Google name until they choose one
     nicknameChosen  true once the learner has picked a nickname; until then the sign-in page asks for one
     leaderboardHidden  true when the learner has taken themselves off the leaderboard
   leaderboard/{uid}, readable by every signed-in learner: the nickname and scores (see core/sync.js). Learners who
   have not chosen a nickname show as "A learner", so a Google name is never shown to anyone else.
     email, createdAt
     languages    the languages practised, by folder id: ['polish', 'spanish']
     lastDay      the last day with an answer, 'YYYY-MM-DD' in the learner's own time zone
     streak       days in a row with an answer, ending on lastDay; bestStreak is the longest so far
     days         answers per day and language, logged from October 2026 on: { '2026-10-04': { polish: 12, spanish: 3 } }
   Which questions were answered, and which were wrong, lives in users/{uid}/progress (see core/sync.js). */
export async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  const profile = {
    username: user.displayName || '', email: user.email || '', createdAt: serverTimestamp(),
    languages: [], lastDay: null, streak: 0, bestStreak: 0,
  };
  await setDoc(ref, profile);
  return profile;
}

// Saves a nickname already checked by NICKNAME.cleanNickname (core/nickname.js)
// and renames the learner on the leaderboard, unless they have taken themselves off it
export async function saveNickname(user, nickname, profile = {}) {
  await setDoc(doc(db, 'users', user.uid), { username: nickname, nicknameChosen: true }, { merge: true });
  if (!profile.leaderboardHidden) await setDoc(doc(db, 'leaderboard', user.uid), { name: nickname }, { merge: true });
}

// Off the leaderboard deletes the learner's entry outright, so nothing of theirs stays readable; back on starts a fresh one
export async function setLeaderboardHidden(user, profile, hidden) {
  await setDoc(doc(db, 'users', user.uid), { leaderboardHidden: hidden }, { merge: true });
  if (hidden) await deleteDoc(doc(db, 'leaderboard', user.uid));
  else await setDoc(doc(db, 'leaderboard', user.uid), { name: profile.nicknameChosen ? profile.username || '' : '' }, { merge: true });
}

// displayName is what the first accounts stored before username
export const nameOf = (profile, user) => profile.username || profile.displayName || user.displayName || user.email || 'Your account';

export { doc, getDoc, setDoc, runTransaction, arrayUnion, increment, serverTimestamp, collection, getDocs };
