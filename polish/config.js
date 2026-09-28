/* Language settings for this copy of the app. */
const APP = {
  lang: 'pl',                 // BCP 47 tag for the target language, used for hyphenation and speech
  speech: 'pl-PL',
  languageName: 'Polish',
  letters: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],   // on-screen keys for typing answers
  marks: 'ą, ę, ł or ó',      // named in the "nearly" feedback
  storagePrefix: 'koncowki',
  // marks that learners often drop; "nearly" feedback ignores them
  stripMarks: s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l'),
};
