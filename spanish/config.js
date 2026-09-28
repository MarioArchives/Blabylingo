/* Language settings for this copy of the app. */
const APP = {
  lang: 'es',
  speech: 'es-ES',
  languageName: 'Spanish',
  letters: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  marks: 'á, é, ñ or ü',
  storagePrefix: 'terminaciones',
  stripMarks: s => s.normalize('NFD').replace(/[̀-ͯ]/g, ''),
};
