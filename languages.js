/* The languages on this site. Each one has a folder of that name with its index.html, config.js and data files.
   lang matches APP.lang in that folder's config.js. prefix matches storagePrefix in that folder's config.js,
   and is the prefix on that user's users/{uid}/progress/{prefix}-{topic} documents. */
const LANGUAGES = [
  { id: 'polish', lang: 'pl', prefix: 'koncowki', name: 'Polski', en: 'Polish', app: 'Końcówki', about: 'Noun and adjective cases, past and future tenses, numbers.' },
  { id: 'spanish', lang: 'es', prefix: 'terminaciones', name: 'Español', en: 'Spanish', app: 'Terminaciones', about: 'Present, past and future tenses, numbers, Colombian idioms.' },
];
