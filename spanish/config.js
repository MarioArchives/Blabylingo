/* Language settings for this copy of the app. */
const APP = {
  lang: 'es',
  speech: 'es-ES',
  languageName: 'Spanish',
  letters: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
  marks: 'á, é, ñ or ü',
  storagePrefix: 'terminaciones',
  phoneTables: 'by-column',   // phone-width verb tables: one block per column (-ar, -er, -ir) listing every person
  stripMarks: s => s.normalize('NFD').replace(/[̀-ͯ]/g, ''),
};
