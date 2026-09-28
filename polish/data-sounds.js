/* Sound changes that happen when an ending is added. Used by the "What changed" note in the answer card
   and by the softening table on the Endings tab. Order matters: longer clusters come first. */
const SOFTENING = [
  { hard: 'st', soft: 'ści', ex: 'miasto → w mieście' },
  { hard: 'zd', soft: 'ździ', ex: 'gwiazda → o gwieździe' },
  { hard: 'sł', soft: 'śl', ex: 'krzesło → na krześle' },
  { hard: 'sn', soft: 'śni', ex: 'wiosna → o wiośnie' },
  { hard: 'ch', soft: 'sz', ex: 'mucha → o musze' },
  { hard: 't', soft: 'ci', ex: 'student → studenci, o studencie' },
  { hard: 'd', soft: 'dzi', ex: 'sąsiad → sąsiedzi, o sąsiedzie' },
  { hard: 'r', soft: 'rz', ex: 'siostra → siostrze, dobry → dobrzy' },
  { hard: 'ł', soft: 'l', ex: 'stół → na stole' },
  { hard: 'k', soft: 'c', ex: 'Polak → Polacy, matka → matce' },
  { hard: 'g', soft: 'dz', ex: 'noga → na nodze' },
  { hard: 'n', soft: 'ni', ex: 'okno → w oknie' },
  { hard: 'm', soft: 'mi', ex: 'mama → mamie' },
  { hard: 'b', soft: 'bi', ex: 'chleb → o chlebie' },
  { hard: 'p', soft: 'pi', ex: 'sklep → w sklepie' },
  { hard: 'w', soft: 'wi', ex: 'Warszawa → w Warszawie' },
  { hard: 'f', soft: 'fi', ex: 'szafa → w szafie' },
  { hard: 's', soft: 'si', ex: 'las → w lesie' },
  { hard: 'z', soft: 'zi', ex: 'obraz → o obrazie' },
  { hard: 'c', soft: 'cz', ex: 'ojciec → ojcze!' },
  { hard: 'g', soft: 'ż', ex: 'Bóg → Boże!' },
  // spelling only: a soft consonant with an accent is written with i once a vowel follows
  { hard: 'ść', soft: 'ści', ex: 'gość → goście', spelling: true },
  { hard: 'źń', soft: 'źni', ex: 'przyjaźń → przyjaźni', spelling: true },
  { hard: 'zn', soft: 'źni', ex: 'mężczyzna → mężczyźni' },
  { hard: 'ń', soft: 'ni', ex: 'styczeń → w styczniu', spelling: true },
  { hard: 'ś', soft: 'si', ex: 'wieś → na wsi', spelling: true },
  { hard: 'ź', soft: 'zi', ex: 'gałąź → gałęzie', spelling: true },
  { hard: 'ć', soft: 'ci', ex: 'nić → nici', spelling: true },
  { hard: 'dź', soft: 'dzi', ex: 'łódź → łodzie', spelling: true },
];
/* Endings the analysis will accept. Anything else is treated as an irregular form. */
const KNOWN_ENDINGS = ['', 'a', 'u', 'owi', 'e', 'em', 'iem', 'ą', 'ę', 'o', 'i', 'y', 'ów', 'om', 'ami', 'mi', 'ach', 'ech', 'owie',
  'ego', 'iego', 'emu', 'iemu', 'ej', 'iej', 'ym', 'im', 'ych', 'ich', 'ymi', 'imi', 'ęta', 'ęciu', 'ęciem', 'ęt', 'ętom', 'ętach', 'ętami', 'ów'];
const SOFTENING_INTRO = 'Polish cannot put a hard consonant directly before the endings -e and -i. The consonant softens, and the softening is written into the word: n + e becomes nie, t + e becomes cie, r + e becomes rze. Where the soft form ends in i, that i also stands for the plural ending -i: student + i = studenci.';
const SOFTENING_WHERE = [
  'Locative singular in -e: w oknie, na stole, w mieście.',
  'Dative singular of feminine nouns in -e: siostrze, mamie, matce.',
  'Vocative in -e: Piotrze!, panie!',
  'Nominative plural of men in -i: studenci, sąsiedzi, Polacy, dobrzy lekarze.',
];
const VOWEL_CHANGES = [
  { from: 'ó', to: 'o', ex: 'stół → stołu, na stole', when: 'ó appears only when the syllable is closed, so it usually turns back to o once an ending follows.' },
  { from: 'ą', to: 'ę', ex: 'ząb → zęby, mąż → męża', when: 'The same rule: ą in a closed final syllable, ę once an ending follows.' },
  { from: 'a', to: 'e', ex: 'miasto → w mieście, las → w lesie', when: 'Before a softened consonant, a often becomes e.' },
  { from: 'o', to: 'e', ex: 'kościół → w kościele', when: 'Rare. The same shift as a → e.' },
  { from: 'e', to: 'nothing', ex: 'pies → psa, cukier → cukru, Marek → Marku', when: 'A mobile e sits between two consonants and drops out as soon as an ending follows.' },
  { from: 'nothing', to: 'e', ex: 'książka → książek, okno → okien', when: 'When the genitive plural has no ending, an e slips in between the last two consonants so the word can be said.' },
];
