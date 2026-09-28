/* Grammar reference and quiz sentences.
   In examples, [square brackets] mark the ending so the page can highlight it.
   In sentences, word{gloss} gives the hover translation and ___ is the gap. */

const CASES = [
  {
    id: 'nom', pl: 'Mianownik', en: 'Nominative', q: 'kto? co?', qEn: 'who? what?',
    summary: 'The dictionary form. It names the subject, the person or thing doing the action.',
    uses: [
      { t: 'The subject of the sentence', ex: 'Moja siostra mieszka w Gdańsku.', en: 'My sister lives in Gdańsk.' },
      { t: 'After “to jest” and “to są”', ex: 'To jest mój brat.', en: 'This is my brother.' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-Ø, -a¹', ex: 'brat, stół, kolega' },
          { tint: 'n', end: '-o, -e, -ę, -um', ex: 'okno, morze, imię, muzeum' },
          { tint: 'f', end: '-a, -i, -Ø', ex: 'kawa, pani, noc' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-y, -i²', ex: 'duży, wysoki' },
          { tint: 'n', end: '-e, -ie²', ex: 'duże, wysokie' },
          { tint: 'f', end: '-a', ex: 'duża, wysoka' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [
          { tint: 'm1', end: '-i, -y, -owie, -e⁴', ex: 'studenci, Polacy, panowie, lekarze' },
          { tint: 'm2', end: '-y, -i², -e³', ex: 'domy, ptaki, klucze' },
          { tint: 'n', end: '-a', ex: 'okna, morza, muzea' },
          { tint: 'f', end: '-y, -i², -e³', ex: 'kobiety, książki, ulice' } ] },
        { label: 'Adjectives', cells: [
          { tint: 'm1', end: '-i, -y⁴', ex: 'dobrzy, wysocy, młodzi' },
          { span: 3, tint: 'all', end: '-e, -ie²', ex: 'dobre, wysokie' } ] },
      ],
    },
    notes: [
      '¹ a few nouns for men end in -a: kolega, tata, mężczyzna',
      '² after -k, -g',
      '³ after soft and hardened consonants (c, cz, sz, rz, ż, l, j, ń)',
      '⁴ the stem softens: t→ci, d→dzi, k→cy, r→rzy, ł→li. Titles and family words take -owie.',
      'Ø = zero ending (only the word stem)',
    ],
    watch: [
      'After “to jest” the noun stays in the nominative. After plain “jest” it takes the instrumental: To jest lekarz, but On jest lekarzem.',
      'Irregular plurals worth memorising: brat → bracia, człowiek → ludzie, dziecko → dzieci, rok → lata, przyjaciel → przyjaciele.',
    ],
  },
  {
    id: 'gen', pl: 'Dopełniacz', en: 'Genitive', q: 'kogo? czego?', qEn: 'of whom? of what?',
    summary: 'The case of “of”, of absence and of quantity. It is the most frequent case after the nominative.',
    uses: [
      { t: 'A negated direct object', ex: 'Nie mam czasu.', en: 'I don’t have time.' },
      { t: 'Possession', ex: 'samochód brata', en: 'my brother’s car' },
      { t: 'Quantities, and numbers from five up', ex: 'dużo studentów, pięć książek', en: 'many students, five books' },
      { t: 'After do, od, z (from), bez, dla, u, obok, koło, blisko, naprzeciwko, podczas', ex: 'Idę do szkoły.', en: 'I’m going to school.' },
      { t: 'After szukać, potrzebować, słuchać, uczyć się, bać się, używać, życzyć', ex: 'Szukam pracy.', en: 'I’m looking for a job.' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { tint: 'm1', end: '-a', ex: 'brata, psa, męża' },
          { tint: 'm2', end: '-u, -a¹', ex: 'czasu, cukru, chleba' },
          { tint: 'n', end: '-a', ex: 'okna, morza' },
          { tint: 'f', end: '-y, -i²', ex: 'kawy, książki, kuchni' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-ego, -iego³', ex: 'dużego, wysokiego' },
          { tint: 'n', end: '-ego, -iego³', ex: 'dużego, wysokiego' },
          { tint: 'f', end: '-ej, -iej³', ex: 'dużej, wysokiej' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-ów, -y, -i⁴', ex: 'studentów, domów, lekarzy, hoteli' },
          { tint: 'n', end: '-Ø', ex: 'okien, miast, mórz' },
          { tint: 'f', end: '-Ø, -i, -y', ex: 'kobiet, książek, kuchni, nocy' } ] },
        { label: 'Adjectives', cells: [
          { span: 4, tint: 'all', end: '-ych, -ich³', ex: 'dużych, wysokich' } ] },
      ],
    },
    notes: [
      '¹ no firm rule. -a for tools, body parts, months, currencies, many foods and Polish cities (chleba, nosa, Krakowa). -u for abstract ideas, substances, borrowed words and foreign cities (czasu, cukru, Londynu).',
      '² after -k, -g and soft consonants',
      '³ after -k, -g',
      '⁴ -ów after hard consonants, -y after hardened, -i after soft',
      'Ø = zero ending. An e often slips in between the last two consonants (książek, okien), and o may become ó (szkół, mórz).',
    ],
    watch: [
      'No rule fully predicts -u or -a for masculine things. Learn the genitive together with each new noun.',
      '“Nie ma” (there is no) always takes the genitive: Nie ma mleka.',
    ],
  },
  {
    id: 'dat', pl: 'Celownik', en: 'Dative', q: 'komu? czemu?', qEn: 'to whom? to what?',
    summary: 'The receiver. It marks the person something is given, said or done to.',
    uses: [
      { t: 'The person who receives something', ex: 'Daję prezent siostrze.', en: 'I’m giving a present to my sister.' },
      { t: 'After pomagać, dziękować, ufać, wierzyć, przeszkadzać, podobać się, smakować', ex: 'Pomagam bratu.', en: 'I’m helping my brother.' },
      { t: 'Feelings and states', ex: 'Jest mi zimno. Miło mi.', en: 'I’m cold. Nice to meet you.' },
      { t: 'After dzięki, przeciwko, wbrew', ex: 'dzięki babci', en: 'thanks to grandma' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-owi, -u¹', ex: 'studentowi, Markowi, bratu, panu' },
          { tint: 'n', end: '-u', ex: 'dziecku, oknu' },
          { tint: 'f', end: '-e², -i, -y', ex: 'mamie, siostrze, babci, ulicy', eq: '= L' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-emu, -iemu³', ex: 'dużemu, wysokiemu' },
          { tint: 'n', end: '-emu, -iemu³', ex: 'dużemu, wysokiemu' },
          { tint: 'f', end: '-ej, -iej³', ex: 'dużej, wysokiej' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [ { span: 4, tint: 'all', end: '-om', ex: 'studentom, kobietom, dzieciom' } ] },
        { label: 'Adjectives', cells: [ { span: 4, tint: 'all', end: '-ym, -im³', ex: 'dużym, wysokim' } ] },
      ],
    },
    notes: [
      '¹ a short list of common nouns: pan, brat, ojciec, chłopiec, pies, kot, Bóg, świat, ksiądz',
      '² after a hard consonant, which softens: t→ci, d→dzi, r→rz, ł→l, k→c, g→dz, ch→sz. Then -i after soft and -y after hardened consonants.',
      '³ after -k, -g',
      'L = locative case. Nouns for men ending in -a follow the feminine: kolega → koledze.',
    ],
    watch: [
      'The feminine singular is identical in the dative and the locative. Learn it once.',
      'Masculine nouns ending in -a, such as kolega or tata, take the feminine endings: koledze, tacie.',
    ],
  },
  {
    id: 'acc', pl: 'Biernik', en: 'Accusative', q: 'kogo? co?', qEn: 'whom? what?',
    summary: 'The direct object. It marks the thing the action lands on.',
    uses: [
      { t: 'The direct object of most verbs: mieć, lubić, znać, jeść, pić, czytać, widzieć, kupować', ex: 'Czytam książkę.', en: 'I’m reading a book.' },
      { t: 'Movement towards, after na and w', ex: 'Idę na koncert.', en: 'I’m going to a concert.' },
      { t: 'After przez, za, o and po with certain verbs', ex: 'Dziękuję za pomoc. Proszę o wodę.', en: 'Thank you for the help. Water, please.' },
      { t: 'Days and lengths of time', ex: 'w sobotę, całą noc', en: 'on Saturday, all night' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { tint: 'm1', end: '-a¹, -ę²', ex: 'męża, psa, kolegę', eq: '= G' },
          { tint: 'm2', end: '-Ø', ex: 'stół, czas', eq: '= N' },
          { tint: 'n', end: '-o, -e, -ę, -um', ex: 'morze, dziecko', eq: '= N' },
          { tint: 'f', end: '-ę³', ex: 'mamę, kawę' } ] },
        { label: 'Adjectives', cells: [
          { tint: 'm1', end: '-ego, -iego⁴', ex: 'dużego, wysokiego', eq: '= G' },
          { tint: 'm2', end: '-y, -i⁴', ex: 'duży, wysoki', eq: '= N' },
          { tint: 'n', end: '-e, -ie⁴', ex: 'duże, wysokie', eq: '= N' },
          { tint: 'f', end: '-ą', ex: 'dużą, wysoką' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [
          { tint: 'm1', end: '-ów, -y, -i', ex: 'studentów, lekarzy, nauczycieli', eq: '= G' },
          { span: 3, tint: 'all', end: '-y, -i, -e, -a', ex: 'domy, psy, kobiety, okna', eq: '= N' } ] },
        { label: 'Adjectives', cells: [
          { tint: 'm1', end: '-ych, -ich⁴', ex: 'dużych, wysokich', eq: '= G' },
          { span: 3, tint: 'all', end: '-e, -ie⁴', ex: 'duże, wysokie', eq: '= N' } ] },
      ],
    },
    notes: [
      '¹ animate means people and animals. Everyday speech adds currencies, car makes, dances, games, fruit and vegetables: mam dolara, jem banana.',
      '² nouns for men ending in -a: kolega → kolegę',
      '³ pani → panią. Feminine nouns ending in a consonant do not change: noc, pomoc.',
      '⁴ after -k, -g',
      'Ø = zero ending (only the word stem), N = nominative case, G = genitive case',
    ],
    watch: [
      'Ask whether a masculine noun is alive. Alive means -a, a thing means no change.',
      'Na and w take the accusative for movement and the locative for position: Idę na koncert, but Jestem na koncercie.',
    ],
  },
  {
    id: 'ins', pl: 'Narzędnik', en: 'Instrumental', q: 'z kim? z czym?', qEn: 'with whom? with what?',
    summary: 'The case of “with” and “by means of”. It also says what someone is.',
    uses: [
      { t: 'After z meaning “with”', ex: 'kawa z mlekiem', en: 'coffee with milk' },
      { t: 'After być and zostać, for jobs, nationalities and roles', ex: 'Jestem studentem.', en: 'I’m a student.' },
      { t: 'Tools and means of transport, with no preposition', ex: 'Piszę długopisem. Jadę autobusem.', en: 'I write with a pen. I go by bus.' },
      { t: 'After interesować się, zajmować się, opiekować się, bawić się', ex: 'Interesuję się muzyką.', en: 'I’m interested in music.' },
      { t: 'Position, after nad, pod, przed, za, między', ex: 'Kot śpi pod stołem.', en: 'The cat sleeps under the table.' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-em, -iem¹, -ą²', ex: 'studentem, Polakiem, kolegą' },
          { tint: 'n', end: '-em, -iem¹', ex: 'oknem, mlekiem' },
          { tint: 'f', end: '-ą', ex: 'kawą, panią' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-ym, -im¹', ex: 'dużym, wysokim' },
          { tint: 'n', end: '-ym, -im¹', ex: 'dużym, wysokim' },
          { tint: 'f', end: '-ą', ex: 'dużą, wysoką' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [ { span: 4, tint: 'all', end: '-ami, -mi³', ex: 'studentami, kobietami, oknami, dziećmi' } ] },
        { label: 'Adjectives', cells: [ { span: 4, tint: 'all', end: '-ymi, -imi¹', ex: 'dużymi, wysokimi' } ] },
      ],
    },
    notes: [
      '¹ after -k, -g. Nouns with a soft stem also take -iem: koń → koniem.',
      '² nouns for men ending in -a',
      '³ a few common nouns: ludźmi, dziećmi, przyjaciółmi, braćmi, gośćmi, końmi, pieniędzmi',
    ],
    watch: [
      'Z takes the instrumental when it means “with” and the genitive when it means “from”: z bratem, but z Krakowa.',
    ],
  },
  {
    id: 'loc', pl: 'Miejscownik', en: 'Locative', q: 'o kim? o czym?', qEn: 'about whom? about what?',
    summary: 'The case of place and topic. It never appears without a preposition.',
    uses: [
      { t: 'Position, after w (in), na (on, at) and przy (by)', ex: 'Mieszkam w Polsce.', en: 'I live in Poland.' },
      { t: 'The topic, after o (about)', ex: 'Rozmawiamy o filmie.', en: 'We’re talking about the film.' },
      { t: 'After po, meaning “after” or “around”', ex: 'po obiedzie, po parku', en: 'after lunch, around the park' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-e¹, -u²', ex: 'studencie, stole, parku, hotelu' },
          { tint: 'n', end: '-e¹, -u²', ex: 'oknie, mieście, morzu' },
          { tint: 'f', end: '-e¹, -i, -y', ex: 'Polsce, szkole, kuchni, ulicy', eq: '= D' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-ym, -im³', ex: 'dużym, wysokim', eq: '= I' },
          { tint: 'n', end: '-ym, -im³', ex: 'dużym, wysokim', eq: '= I' },
          { tint: 'f', end: '-ej, -iej³', ex: 'dużej, wysokiej' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [ { span: 4, tint: 'all', end: '-ach⁴', ex: 'domach, górach, wakacjach' } ] },
        { label: 'Adjectives', cells: [ { span: 4, tint: 'all', end: '-ych, -ich³', ex: 'dużych, wysokich', eq: '= G' } ] },
      ],
    },
    notes: [
      '¹ after a hard consonant, which softens: t→ci, d→dzi, r→rz, ł→l, st→ści, and n, m, b, p, w, s, z add an i. Feminine nouns also change k→c, g→dz, ch→sz.',
      '² after -k, -g, -ch and after soft or hardened consonants. Three exceptions: dom → domu, pan → panu, syn → synu.',
      '³ after -k, -g',
      '⁴ three countries take -ech: w Niemczech, we Włoszech, na Węgrzech',
      'D = dative case, I = instrumental case, G = genitive case',
    ],
    watch: [
      'Three masculine exceptions take -u against the rule: dom → w domu, pan → o panu, syn → o synu.',
      'A vowel inside the word may change with the softening: obiad → obiedzie, miasto → mieście, las → lesie.',
    ],
  },
  {
    id: 'voc', pl: 'Wołacz', en: 'Vocative', q: 'o!', qEn: 'calling someone',
    summary: 'The calling form. You use it when you speak to someone directly.',
    uses: [
      { t: 'Greeting or calling a person', ex: 'Cześć, Marku!', en: 'Hi, Marek!' },
      { t: 'With titles, where it is required', ex: 'Dzień dobry, panie profesorze!', en: 'Good morning, professor!' },
      { t: 'Opening a letter or an email', ex: 'Drogi Piotrze, Szanowna Pani', en: 'Dear Piotr, Dear Madam' },
    ],
    grid: {
      sg: [
        { label: 'Nouns', cells: [
          { span: 2, tint: 'm', end: '-e¹, -u², -o³', ex: 'Piotrze, panie, Marku, synu, tato' },
          { tint: 'n', end: '-o, -e, -ę, -um', ex: 'dziecko', eq: '= N' },
          { tint: 'f', end: '-o, -u⁴, -i', ex: 'mamo, Anno, Kasiu, babciu, pani' } ] },
        { label: 'Adjectives', cells: [
          { span: 2, tint: 'm', end: '-y, -i', ex: 'drogi, kochany', eq: '= N' },
          { tint: 'n', end: '-e', ex: 'drogie, kochane', eq: '= N' },
          { tint: 'f', end: '-a', ex: 'droga, kochana', eq: '= N' } ] },
      ],
      pl: [
        { label: 'Nouns', cells: [ { span: 4, tint: 'all', end: 'no change', ex: 'Panowie! Drodzy studenci!', eq: '= N' } ] },
        { label: 'Adjectives', cells: [ { span: 4, tint: 'all', end: 'no change', ex: 'Drodzy, Szanowni, Kochane', eq: '= N' } ] },
      ],
    },
    notes: [
      '¹ after a hard consonant, which softens as in the locative: r→rz, t→ci, n→ni',
      '² after -k, -g, -ch and after soft or hardened consonants, plus syn → synu',
      '³ nouns for men ending in -a: tata → tato, kolega → kolego',
      '⁴ affectionate soft forms in -sia, -cia, -nia, -la',
      'N = nominative case',
    ],
    watch: [
      'Nouns in -ec change to -cze: ojciec → ojcze, chłopiec → chłopcze. Bóg becomes Boże.',
      'In casual speech Poles often use the nominative for first names. The vocative is never wrong.',
    ],
  },
];

const OVERVIEW = {
  nouns: {
    title: 'Noun endings at a glance',
    cols: ['Masculine', 'Neuter', 'Feminine', 'Plural'],
    rows: {
      nom: ['consonant', '-o, -e, -ę, -um', '-a', '-i/-y, -e, -owie; neuter -a'],
      gen: ['-a alive; -u or -a things', '-a', '-y, -i', '-ów, -y/-i, or no ending'],
      dat: ['-owi, a few -u', '-u', '-e, -i, -y', '-om'],
      acc: ['-a alive; no change things', 'no change', '-ę', 'men as genitive; others no change'],
      ins: ['-em, -iem', '-em, -iem', '-ą', '-ami'],
      loc: ['-e, -u', '-e, -u', '-e, -i, -y', '-ach'],
      voc: ['-e, -u', 'no change', '-o, -u', 'no change'],
    },
  },
  adjs: {
    title: 'Adjective endings at a glance',
    cols: ['Masculine', 'Neuter', 'Feminine', 'Plural'],
    rows: {
      nom: ['-y, -i', '-e', '-a', '-i/-y men; -e others'],
      gen: ['-ego', '-ego', '-ej', '-ych, -ich'],
      dat: ['-emu', '-emu', '-ej', '-ym, -im'],
      acc: ['-ego alive; -y, -i things', '-e', '-ą', '-ych men; -e others'],
      ins: ['-ym, -im', '-ym, -im', '-ą', '-ymi, -imi'],
      loc: ['-ym, -im', '-ym, -im', '-ej', '-ych, -ich'],
      voc: ['-y, -i', '-e', '-a', 'as nominative'],
    },
  },
};

/* Quiz sentences. base = dictionary form shown in the gap. hint = short badge shown next to it, such as 'plural'. */
const SENTENCES = [
  // Mianownik
  { c: 'nom', s: 'To{this} jest{is} mój{my|m} ___.', base: 'brat', gloss: 'brother', a: ['brat'], en: 'This is my brother.', why: 'After “to jest” the noun stays in the nominative. Only plain “jest” would call for the instrumental.' },
  { c: 'nom', s: 'To{these} są{are} ___.', base: 'student', hint: 'plural', gloss: 'student', a: ['studenci'], en: 'These are students.', why: 'Nominative plural for men takes -i, and the t softens to ci.' },
  { c: 'nom', s: 'To{these} są{are} dobre{good|f.pl} ___.', base: 'książka', hint: 'plural', gloss: 'book', a: ['książki'], en: 'These are good books.', why: 'Feminine nominative plural is -y, but after k and g it is written -i.' },
  { c: 'nom', s: 'Ci{these|m.pl} ___ są{are} z{from} Krakowa{Kraków|m2}.', base: 'Polak', hint: 'plural', gloss: 'Pole, Polish man', a: ['Polacy'], en: 'These Poles are from Kraków.', why: 'Men’s nominative plural softens k to c and adds -y.' },
  { c: 'nom', s: 'Moi{my|m.pl} ___ mieszkają{live} w{in} Gdańsku{Gdańsk|m2}.', base: 'brat', hint: 'plural', gloss: 'brother', a: ['bracia'], en: 'My brothers live in Gdańsk.', why: 'Brat has an irregular plural: bracia. It is the subject, so nominative.' },
  { c: 'nom', s: 'Te{these|n.pl} ___ są{are} duże{big|n.pl}.', base: 'okno', hint: 'plural', gloss: 'window', a: ['okna'], en: 'These windows are big.', why: 'Neuter nouns always form the nominative plural with -a.' },
  { c: 'nom', s: '___ pracują{work} w{in} szpitalu{hospital|m2}.', base: 'dobry lekarz', hint: 'plural', gloss: 'good doctor', a: ['Dobrzy lekarze'], en: 'Good doctors work in a hospital.', why: 'Lekarz ends in a hardened consonant, so it takes -e. The adjective for men softens r to rz: dobrzy.' },
  { c: 'nom', s: 'Gdzie{where} są{are} moje{my|m2.pl} ___?', base: 'klucz', hint: 'plural', gloss: 'key', a: ['klucze'], en: 'Where are my keys?', why: 'After a hardened consonant such as cz, the nominative plural ending is -e.' },
  { c: 'nom', s: 'Ci{these|m.pl} ___ są{are} bardzo{very} mili{kind|m.pl}.', base: 'pan', hint: 'plural', gloss: 'gentleman, sir', a: ['panowie'], en: 'These gentlemen are very kind.', why: 'Titles and family words for men take -owie in the nominative plural.' },
  { c: 'nom', s: 'Te{these|m2.pl} ___ są{are} drogie{expensive|m2.pl}.', base: 'dom', hint: 'plural', gloss: 'house', a: ['domy'], en: 'These houses are expensive.', why: 'A masculine thing ending in a hard consonant takes -y in the nominative plural.' },
  { c: 'nom', s: 'W{in} klasie{classroom|f} są{are} ___.', base: 'dziecko', hint: 'plural', gloss: 'child', a: ['dzieci'], en: 'There are children in the classroom.', why: 'Dziecko has an irregular plural: dzieci. It is the subject of “są”, so nominative.' },
  { c: 'nom', s: 'Nasi{our|m.pl} ___ są{are} mili{kind|m.pl}.', base: 'sąsiad', hint: 'plural', gloss: 'neighbour', a: ['sąsiedzi'], en: 'Our neighbours are kind.', why: 'Men’s plural -i softens d to dzi, and the a inside the word shifts to e.' },

  // Dopełniacz
  { c: 'gen', s: 'Nie{not} mam{I have} ___.', base: 'czas', gloss: 'time', a: ['czasu'], en: 'I don’t have time.', why: 'A negated direct object moves from accusative to genitive. Abstract masculine nouns take -u.' },
  { c: 'gen', s: 'To{this} jest{is} samochód{car|m2} mojego{my|m} ___.', base: 'brat', gloss: 'brother', a: ['brata'], en: 'This is my brother’s car.', why: 'Possession uses the genitive. Masculine nouns for people take -a.' },
  { c: 'gen', s: 'Idę{I’m going} do{to} ___.', base: 'szkoła', gloss: 'school', a: ['szkoły'], en: 'I’m going to school.', why: '“Do” always takes the genitive. Feminine nouns with a hard stem take -y.' },
  { c: 'gen', s: 'Piję{I drink} kawę{coffee|f} bez{without} ___.', base: 'cukier', gloss: 'sugar', a: ['cukru'], en: 'I drink coffee without sugar.', why: '“Bez” takes the genitive. Substances take -u, and the e in cukier drops out.' },
  { c: 'gen', s: 'W{in} tym{this|n} mieście{city|n} jest{is} dużo{a lot of} ___.', base: 'student', hint: 'plural', gloss: 'student', a: ['studentów'], en: 'There are a lot of students in this city.', why: 'Quantity words like “dużo” take the genitive plural. Masculine hard stems take -ów.' },
  { c: 'gen', s: 'Szukam{I’m looking for} ___.', base: 'praca', gloss: 'job, work', a: ['pracy'], en: 'I’m looking for a job.', why: '“Szukać” takes the genitive. After the hardened consonant c the feminine ending is -y.' },
  { c: 'gen', s: 'To{this} prezent{present|m2} dla{for} ___.', base: 'mama', gloss: 'mum', a: ['mamy'], en: 'This is a present for mum.', why: '“Dla” takes the genitive. Feminine hard stem, so -y.' },
  { c: 'gen', s: 'Nie{not} lubię{I like} ___.', base: 'kawa', gloss: 'coffee', a: ['kawy'], en: 'I don’t like coffee.', why: 'Lubię kawę, but with “nie” the object switches to the genitive: kawy.' },
  { c: 'gen', s: 'Mam{I have} pięć{five} ___.', base: 'książka', hint: 'plural', gloss: 'book', a: ['książek'], en: 'I have five books.', why: 'Numbers from five up take the genitive plural. Feminine nouns lose the ending, and an e slips between ż and k.' },
  { c: 'gen', s: 'Wracam{I’m coming back} z{from} ___.', base: 'Kraków', gloss: 'Kraków', a: ['Krakowa'], en: 'I’m coming back from Kraków.', why: '“Z” meaning “from” takes the genitive. Polish cities take -a, and ó turns to o.' },
  { c: 'gen', s: 'W{in} tym{this|m2} pokoju{room|m2} nie_ma{there are no} ___.', base: 'okno', hint: 'plural', gloss: 'window', a: ['okien'], en: 'There are no windows in this room.', why: '“Nie ma” takes the genitive. Neuter plural drops the ending, and an e appears between k and n.' },
  { c: 'gen', s: 'Mieszkam{I live} obok{next to} ___.', base: 'nowy park', gloss: 'new park', a: ['nowego parku'], en: 'I live next to a new park.', why: '“Obok” takes the genitive. The adjective takes -ego, and park is a thing that takes -u.' },
  { c: 'gen', s: 'Uczę{I teach} się{myself} ___.', base: 'język polski', gloss: 'Polish language', a: ['języka polskiego'], en: 'I’m learning Polish.', why: '“Uczyć się” takes the genitive. Język takes -a, and the adjective takes -ego.' },
  { c: 'gen', s: 'Potrzebuję{I need} ___.', base: 'pomoc', gloss: 'help', a: ['pomocy'], en: 'I need help.', why: '“Potrzebować” takes the genitive. Feminine nouns ending in a hardened consonant add -y.' },

  // Celownik
  { c: 'dat', s: 'Daję{I’m giving} prezent{present|m2} ___.', base: 'siostra', gloss: 'sister', a: ['siostrze'], en: 'I’m giving a present to my sister.', why: 'The receiver is in the dative. Feminine hard stems take -e, and r softens to rz.' },
  { c: 'dat', s: 'Pomagam{I’m helping} ___.', base: 'brat', gloss: 'brother', a: ['bratu'], en: 'I’m helping my brother.', why: '“Pomagać” takes the dative. Brat is one of the few masculine nouns with -u instead of -owi.' },
  { c: 'dat', s: 'Dziękuję{I thank} ___ za{for} pomoc{help|f}.', base: 'pan', gloss: 'sir, you (formal)', a: ['panu'], en: 'Thank you for your help, sir.', why: '“Dziękować” takes the dative. Pan is on the short -u list.' },
  { c: 'dat', s: 'Kupuję{I’m buying} kwiaty{flowers|m2.pl} ___.', base: 'mama', gloss: 'mum', a: ['mamie'], en: 'I’m buying flowers for mum.', why: 'The receiver is in the dative. Feminine hard stem takes -e, and m softens to mi.' },
  { c: 'dat', s: 'Nauczyciel{teacher|m1} tłumaczy{explains} gramatykę{grammar|f} ___.', base: 'student', hint: 'plural', gloss: 'student', a: ['studentom'], en: 'The teacher explains grammar to the students.', why: 'Dative plural is -om for every noun.' },
  { c: 'dat', s: 'Ten{this|m} film{film|m2} podoba{pleases} się{itself} ___.', base: 'Marek', gloss: 'Marek', a: ['Markowi'], en: 'Marek likes this film.', why: 'With “podobać się” the person who likes is in the dative. Regular masculine -owi, and the e in Marek drops.' },
  { c: 'dat', s: 'Opowiadam{I’m telling} bajkę{fairy tale|f} ___.', base: 'dziecko', gloss: 'child', a: ['dziecku'], en: 'I’m telling the child a fairy tale.', why: 'The listener is in the dative. Neuter nouns take -u.' },
  { c: 'dat', s: 'Ufam{I trust} mojej{my|f} ___.', base: 'koleżanka', gloss: 'female friend', a: ['koleżance'], en: 'I trust my friend.', why: '“Ufać” takes the dative. Feminine -e softens k to c.' },
  { c: 'dat', s: 'Dzięki{thanks to} ___ mówię{I speak} po_polsku{in Polish}.', base: 'babcia', gloss: 'grandma', a: ['babci'], en: 'Thanks to grandma I speak Polish.', why: '“Dzięki” takes the dative. Feminine soft stems take -i.' },
  { c: 'dat', s: 'Daję{I’m giving} wodę{water|f} ___.', base: 'pies', gloss: 'dog', a: ['psu'], en: 'I’m giving the dog water.', why: 'The receiver is in the dative. Pies is on the short -u list, and its e drops.' },
  { c: 'dat', s: 'Wysyłam{I’m sending} e-mail{email|m2} ___.', base: 'profesor', gloss: 'professor', a: ['profesorowi'], en: 'I’m sending the professor an email.', why: 'The receiver is in the dative. Regular masculine ending -owi.' },
  { c: 'dat', s: 'Pożyczam{I’m lending} rower{bike|m2} ___.', base: 'dobry kolega', gloss: 'good friend', a: ['dobremu koledze'], en: 'I’m lending my bike to a good friend.', why: 'Kolega ends in -a, so it declines like a feminine noun: g softens to dz. The adjective stays masculine: -emu.' },

  // Biernik
  { c: 'acc', s: 'Mam{I have} ___.', base: 'siostra', gloss: 'sister', a: ['siostrę'], en: 'I have a sister.', why: '“Mieć” takes a direct object in the accusative. Feminine -a becomes -ę.' },
  { c: 'acc', s: 'Czytam{I’m reading} ___.', base: 'książka', gloss: 'book', a: ['książkę'], en: 'I’m reading a book.', why: 'Direct object, so accusative. Feminine -a becomes -ę.' },
  { c: 'acc', s: 'Lubię{I like} ___.', base: 'herbata', gloss: 'tea', a: ['herbatę'], en: 'I like tea.', why: '“Lubić” takes the accusative. Feminine -a becomes -ę.' },
  { c: 'acc', s: 'Mam{I have} ___.', base: 'brat', gloss: 'brother', a: ['brata'], en: 'I have a brother.', why: 'Masculine nouns for people and animals take -a in the accusative, the same as the genitive.' },
  { c: 'acc', s: 'Kupuję{I’m buying} ___.', base: 'chleb', gloss: 'bread', a: ['chleb'], en: 'I’m buying bread.', why: 'Bread is a masculine thing, so the accusative looks the same as the nominative.' },
  { c: 'acc', s: 'Widzę{I see} ___.', base: 'duży pies', gloss: 'big dog', a: ['dużego psa'], en: 'I see a big dog.', why: 'A dog is alive, so the noun takes -a and the adjective -ego. The e in pies drops.' },
  { c: 'acc', s: 'Oglądam{I’m watching} ___.', base: 'nowy film', gloss: 'new film', a: ['nowy film'], en: 'I’m watching a new film.', why: 'A film is a masculine thing, so neither the noun nor the adjective changes.' },
  { c: 'acc', s: 'Idę{I’m going} na{to} ___.', base: 'koncert', gloss: 'concert', a: ['koncert'], en: 'I’m going to a concert.', why: '“Na” with movement takes the accusative. A masculine thing does not change.' },
  { c: 'acc', s: 'Czekam{I’m waiting} na{for} ___.', base: 'autobus', gloss: 'bus', a: ['autobus'], en: 'I’m waiting for the bus.', why: '“Czekać na” takes the accusative. A masculine thing does not change.' },
  { c: 'acc', s: 'Jem{I’m eating} ___.', base: 'zupa pomidorowa', gloss: 'tomato soup', a: ['zupę pomidorową'], en: 'I’m eating tomato soup.', why: 'Feminine direct object: the noun takes -ę and the adjective takes -ą.' },
  { c: 'acc', s: 'Kocham{I love} moje{my|n} ___.', base: 'dziecko', gloss: 'child', a: ['dziecko'], en: 'I love my child.', why: 'Neuter nouns look the same in the accusative and the nominative.' },
  { c: 'acc', s: 'Znam{I know} tych{these|m.pl} ___.', base: 'student', hint: 'plural', gloss: 'student', a: ['studentów'], en: 'I know these students.', why: 'For groups of men the accusative plural equals the genitive plural: -ów.' },
  { c: 'acc', s: 'Dziękuję{thank you} za{for} ___.', base: 'pomoc', gloss: 'help', a: ['pomoc'], en: 'Thank you for the help.', why: '“Za” takes the accusative here. Feminine nouns ending in a consonant do not change.' },
  { c: 'acc', s: 'Proszę{I’m asking} o{for} ___.', base: 'woda', gloss: 'water', a: ['wodę'], en: 'Water, please.', why: '“Prosić o” takes the accusative. Feminine -a becomes -ę.' },

  // Narzędnik
  { c: 'ins', s: 'Jestem{I am} ___.', base: 'student', gloss: 'student', a: ['studentem'], en: 'I’m a student.', why: 'After “być” a noun saying what someone is takes the instrumental. Masculine -em.' },
  { c: 'ins', s: 'Ona{she|f} jest{is} ___.', base: 'lekarka', gloss: 'female doctor', a: ['lekarką'], en: 'She is a doctor.', why: 'A profession after “jest” takes the instrumental. Feminine -ą.' },
  { c: 'ins', s: 'Piję{I drink} kawę{coffee|f} z{with} ___.', base: 'mleko', gloss: 'milk', a: ['mlekiem'], en: 'I drink coffee with milk.', why: '“Z” meaning “with” takes the instrumental. After k the ending is -iem.' },
  { c: 'ins', s: 'Jadę{I’m travelling} do{to} pracy{work|f} ___.', base: 'autobus', gloss: 'bus', a: ['autobusem'], en: 'I go to work by bus.', why: 'Means of transport take the instrumental with no preposition. Masculine -em.' },
  { c: 'ins', s: 'Piszę{I’m writing} ___.', base: 'długopis', gloss: 'pen', a: ['długopisem'], en: 'I’m writing with a pen.', why: 'A tool takes the instrumental with no preposition. Masculine -em.' },
  { c: 'ins', s: 'Interesuję{I interest} się{myself} ___.', base: 'muzyka', gloss: 'music', a: ['muzyką'], en: 'I’m interested in music.', why: '“Interesować się” takes the instrumental. Feminine -ą.' },
  { c: 'ins', s: 'Rozmawiam{I’m talking} z{with} ___.', base: 'kolega', gloss: 'friend, colleague', a: ['kolegą'], en: 'I’m talking with a friend.', why: '“Z” meaning “with” takes the instrumental. Kolega ends in -a, so it takes the feminine -ą.' },
  { c: 'ins', s: 'Idę{I’m going} do{to} kina{cinema|n} z{with} ___.', base: 'przyjaciel', hint: 'plural', gloss: 'close friend', a: ['przyjaciółmi'], en: 'I’m going to the cinema with friends.', why: 'Przyjaciele is one of the few nouns with the short plural ending -mi, and the stem changes to przyjaciół-.' },
  { c: 'ins', s: 'Kot{cat|m1} śpi{sleeps} pod{under} ___.', base: 'stół', gloss: 'table', a: ['stołem'], en: 'The cat sleeps under the table.', why: '“Pod” for position takes the instrumental. Masculine -em, and ó turns to o.' },
  { c: 'ins', s: 'On{he|m} jest{is} ___.', base: 'dobry nauczyciel', gloss: 'good teacher', a: ['dobrym nauczycielem'], en: 'He is a good teacher.', why: 'Instrumental after “jest”. The adjective takes -ym and the noun -em.' },
  { c: 'ins', s: 'Spotykam{I’m meeting} się{myself} z{with} ___.', base: 'rodzice', gloss: 'parents', a: ['rodzicami'], en: 'I’m meeting my parents.', why: '“Z” meaning “with” takes the instrumental. Regular plural -ami.' },
  { c: 'ins', s: 'Marek{Marek|m1} jest{is} ___.', base: 'Polak', gloss: 'Pole, Polish man', a: ['Polakiem'], en: 'Marek is Polish.', why: 'Nationality after “jest” takes the instrumental. After k the ending is -iem.' },
  { c: 'ins', s: 'Mieszkam{I live} z{with} ___.', base: 'młodsza siostra', gloss: 'younger sister', a: ['młodszą siostrą'], en: 'I live with my younger sister.', why: 'In the feminine instrumental both the adjective and the noun take -ą.' },
  { c: 'ins', s: 'Opiekuję{I look after} się{myself} ___.', base: 'dziecko', hint: 'plural', gloss: 'child', a: ['dziećmi'], en: 'I look after the children.', why: '“Opiekować się” takes the instrumental. Dzieci has the short plural ending -mi.' },

  // Miejscownik
  { c: 'loc', s: 'Mieszkam{I live} w{in} ___.', base: 'Polska', gloss: 'Poland', a: ['Polsce'], en: 'I live in Poland.', why: '“W” for position takes the locative. Feminine -e softens k to c.' },
  { c: 'loc', s: 'Jestem{I am} w{at} ___.', base: 'dom', gloss: 'house, home', a: ['domu'], en: 'I’m at home.', why: 'Dom is an exception. It takes -u in the locative instead of the expected -ie.' },
  { c: 'loc', s: 'Książka{book|f} leży{lies} na{on} ___.', base: 'stół', gloss: 'table', a: ['stole'], en: 'The book is on the table.', why: '“Na” for position takes the locative. The ending -e softens ł to l, and ó turns to o.' },
  { c: 'loc', s: 'Rozmawiamy{we’re talking} o{about} ___.', base: 'film', gloss: 'film', a: ['filmie'], en: 'We’re talking about the film.', why: '“O” meaning “about” takes the locative. Hard stem in m, so -ie.' },
  { c: 'loc', s: 'Studiuję{I study} na{at} ___.', base: 'uniwersytet', gloss: 'university', a: ['uniwersytecie'], en: 'I study at university.', why: '“Na” for position takes the locative. The ending -e softens t to ci.' },
  { c: 'loc', s: 'Oglądam{I’m watching} film{film|m2} w{in} ___.', base: 'kino', gloss: 'cinema', a: ['kinie'], en: 'I’m watching a film at the cinema.', why: '“W” for position takes the locative. Hard stem in n, so -ie.' },
  { c: 'loc', s: 'Spacerujemy{we’re walking} po{around} ___.', base: 'park', gloss: 'park', a: ['parku'], en: 'We’re walking around the park.', why: '“Po” takes the locative. Masculine nouns ending in k, g or ch take -u.' },
  { c: 'loc', s: 'Po{after} ___ idę{I go} na{for} spacer{walk|m2}.', base: 'obiad', gloss: 'lunch, dinner', a: ['obiedzie'], en: 'After lunch I go for a walk.', why: '“Po” meaning “after” takes the locative. The d softens to dzi, and the a shifts to e.' },
  { c: 'loc', s: 'Mieszkam{I live} w{in} ___.', base: 'duże miasto', gloss: 'big city', a: ['dużym mieście'], en: 'I live in a big city.', why: 'The adjective takes -ym. In the noun st softens to ści and a shifts to e.' },
  { c: 'loc', s: 'Pracuję{I work} w{in} ___.', base: 'szkoła', gloss: 'school', a: ['szkole'], en: 'I work in a school.', why: '“W” for position takes the locative. The ending -e softens ł to l.' },
  { c: 'loc', s: 'Myślę{I’m thinking} o{about} ___.', base: 'wakacje', gloss: 'holidays', a: ['wakacjach'], en: 'I’m thinking about the holidays.', why: '“O” meaning “about” takes the locative. Every plural noun takes -ach.' },
  { c: 'loc', s: 'Mój{my|m} brat{brother|m1} pracuje{works} w{in} ___.', base: 'Warszawa', gloss: 'Warsaw', a: ['Warszawie'], en: 'My brother works in Warsaw.', why: '“W” for position takes the locative. Hard stem in w, so -ie.' },
  { c: 'loc', s: 'Siedzę{I’m sitting} w{in} ___.', base: 'kuchnia', gloss: 'kitchen', a: ['kuchni'], en: 'I’m sitting in the kitchen.', why: 'Feminine nouns with a soft stem take -i in the locative.' },
  { c: 'loc', s: 'Oni{they|m1.pl} są{are} w{at} ___.', base: 'teatr', gloss: 'theatre', a: ['teatrze'], en: 'They are at the theatre.', why: '“W” for position takes the locative. The ending -e softens r to rz.' },

  // Wołacz
  { c: 'voc', s: 'Dzień_dobry{good morning}, panie{sir|m1} ___!', base: 'profesor', gloss: 'professor', a: ['profesorze'], en: 'Good morning, professor!', why: 'You are addressing him directly. Masculine hard stem takes -e, and r softens to rz.' },
  { c: 'voc', s: '___, gdzie{where} jesteś{are you}?', base: 'mama', gloss: 'mum', a: ['Mamo'], en: 'Mum, where are you?', why: 'Calling someone uses the vocative. Feminine -a becomes -o.' },
  { c: 'voc', s: 'Cześć{hi}, ___!', base: 'Marek', gloss: 'Marek', a: ['Marku'], en: 'Hi, Marek!', why: 'Masculine stems ending in k take -u, and the e in Marek drops.' },
  { c: 'voc', s: 'Kocham{I love} cię{you}, ___!', base: 'babcia', gloss: 'grandma', a: ['babciu'], en: 'I love you, grandma!', why: 'Affectionate feminine words with a soft stem take -u.' },
  { c: 'voc', s: '___, chodź{come} tutaj{here}!', base: 'Kasia', gloss: 'Kasia', a: ['Kasiu'], en: 'Kasia, come here!', why: 'Soft feminine pet names take -u in the vocative.' },
  { c: 'voc', s: 'Drogi{dear|m} ___, dziękuję{thank you} za{for} list{letter|m2}.', base: 'Piotr', gloss: 'Piotr', a: ['Piotrze'], en: 'Dear Piotr, thank you for the letter.', why: 'Letters open with the vocative. Masculine -e softens r to rz. The adjective stays as in the nominative.' },
  { c: 'voc', s: '___, pomóż{help} mi{me}!', base: 'tata', gloss: 'dad', a: ['Tato'], en: 'Dad, help me!', why: 'Masculine nouns ending in -a follow the feminine pattern: -a becomes -o.' },
  { c: 'voc', s: 'Dzień_dobry{good morning}, ___ doktorze{doctor|m1}!', base: 'pan', gloss: 'sir', a: ['panie'], en: 'Good morning, doctor!', why: 'With titles the vocative is required. Pan takes -e, and n softens to ni.' },
  { c: 'voc', s: 'Co{what} robisz{are you doing}, ___?', base: 'Anna', gloss: 'Anna', a: ['Anno'], en: 'What are you doing, Anna?', why: 'Feminine names ending in -a take -o.' },
  { c: 'voc', s: 'O{oh} ___!', base: 'Bóg', gloss: 'God', a: ['Boże'], en: 'Oh God!', why: 'Bóg has an irregular vocative: Boże. The g softens to ż, and ó turns to o.' },
  { c: 'voc', s: 'Drodzy{dear|m.pl} ___, zaczynamy{we’re starting}!', base: 'student', hint: 'plural', gloss: 'student', a: ['studenci'], en: 'Dear students, we’re starting!', why: 'In the plural the vocative is identical to the nominative.' },
  { c: 'voc', s: '___, chodź{come} na{for} obiad{lunch|m2}!', base: 'syn', gloss: 'son', a: ['Synu'], en: 'Son, come for lunch!', why: 'Syn is an exception that takes -u, in the vocative as in the locative.' },
];

/* Pronouns, question words, possessives and "this": words with their own forms in each case. */
const PRONOUNS = {
  // Declined like adjectives, but with their own stems. The app builds every case from these parts.
  possessives: [
    { word: 'mój', en: 'my', m: 'mój', n: 'moje', f: 'moja', pm: 'moi', po: 'moje', stem: 'moj', stemI: 'moi', accF: 'moją' },
    { word: 'twój', en: 'your', m: 'twój', n: 'twoje', f: 'twoja', pm: 'twoi', po: 'twoje', stem: 'twoj', stemI: 'twoi', accF: 'twoją' },
    { word: 'nasz', en: 'our', m: 'nasz', n: 'nasze', f: 'nasza', pm: 'nasi', po: 'nasze', stem: 'nasz', stemI: 'naszy', accF: 'naszą' },
    { word: 'wasz', en: 'your, plural', m: 'wasz', n: 'wasze', f: 'wasza', pm: 'wasi', po: 'wasze', stem: 'wasz', stemI: 'waszy', accF: 'waszą' },
    { word: 'swój', en: 'one’s own', m: 'swój', n: 'swoje', f: 'swoja', pm: 'swoi', po: 'swoje', stem: 'swoj', stemI: 'swoi', accF: 'swoją' },
    { word: 'jego', en: 'his, its', fixed: 'jego' },
    { word: 'jej', en: 'her', fixed: 'jej' },
    { word: 'ich', en: 'their', fixed: 'ich' },
    { word: 'ten', en: 'this', m: 'ten', n: 'to', f: 'ta', pm: 'ci', po: 'te', stem: 't', stemI: 'ty', accF: 'tę' },
  ],
  possessiveNotes: [
    'Jego, jej and ich never change: jego brat, jego siostry, z jego bratem.',
    'Swój points back to the subject of the sentence: Marek kocha swoją żonę means his own wife, Marek kocha jego żonę means someone else’s.',
  ],
  // [plain form, form after a preposition]. One entry means both are the same.
  personal: [
    { word: 'kto', en: 'who', gen: ['kogo'], dat: ['komu'], acc: ['kogo'], ins: ['kim'], loc: ['kim'] },
    { word: 'co', en: 'what', gen: ['czego'], dat: ['czemu'], acc: ['co'], ins: ['czym'], loc: ['czym'] },
    { word: 'nikt', en: 'nobody', gen: ['nikogo'], dat: ['nikomu'], acc: ['nikogo'], ins: ['nikim'], loc: ['nikim'] },
    { word: 'nic', en: 'nothing', gen: ['niczego'], dat: ['niczemu'], acc: ['nic'], ins: ['niczym'], loc: ['niczym'] },
    { word: 'ja', en: 'I', gen: ['mnie'], dat: ['mi, mnie', 'mnie'], acc: ['mnie'], ins: ['mną'], loc: ['mnie'] },
    { word: 'ty', en: 'you', gen: ['cię, ciebie', 'ciebie'], dat: ['ci, tobie', 'tobie'], acc: ['cię, ciebie', 'ciebie'], ins: ['tobą'], loc: ['tobie'] },
    { word: 'on', en: 'he', gen: ['go, jego', 'niego'], dat: ['mu, jemu', 'niemu'], acc: ['go, jego', 'niego'], ins: ['nim'], loc: ['nim'] },
    { word: 'ona', en: 'she', gen: ['jej', 'niej'], dat: ['jej', 'niej'], acc: ['ją', 'nią'], ins: ['nią'], loc: ['niej'] },
    { word: 'ono', en: 'it', gen: ['go, jego', 'niego'], dat: ['mu, jemu', 'niemu'], acc: ['je', 'nie'], ins: ['nim'], loc: ['nim'] },
    { word: 'my', en: 'we', gen: ['nas'], dat: ['nam'], acc: ['nas'], ins: ['nami'], loc: ['nas'] },
    { word: 'wy', en: 'you, plural', gen: ['was'], dat: ['wam'], acc: ['was'], ins: ['wami'], loc: ['was'] },
    { word: 'oni', en: 'they, with men', gen: ['ich', 'nich'], dat: ['im', 'nim'], acc: ['ich', 'nich'], ins: ['nimi'], loc: ['nich'] },
    { word: 'one', en: 'they, no men', gen: ['ich', 'nich'], dat: ['im', 'nim'], acc: ['je', 'nie'], ins: ['nimi'], loc: ['nich'] },
    { word: 'się', en: 'oneself', gen: ['siebie'], dat: ['sobie'], acc: ['się, siebie', 'siebie'], ins: ['sobą'], loc: ['sobie'] },
  ],
  prepositions: { gen: 'do, od, dla, bez', dat: 'dzięki, przeciwko', acc: 'na, za, przez, o' },
  personalNotes: {
    gen: ['The short forms cię and go cannot start a sentence or carry stress. Use ciebie and jego for emphasis: Nie ma go, but Jego nie ma, ona jest.', 'After a preposition, forms that begin with a vowel or j gain an n: do niego, od niej, bez nich.'],
    dat: ['The short forms mi, ci and mu are the everyday choice after a verb: Daj mi to. The long forms mnie, tobie and jemu add emphasis or open a sentence: Mnie to nie przeszkadza.', 'After a preposition the third person gains an n: dzięki niemu, dzięki niej, dzięki nim.'],
    acc: ['The short forms cię and go are the everyday choice after a verb: Kocham cię. Widzę go. Use ciebie and jego for emphasis.', 'After a preposition the third person gains an n: czekam na niego, na nią, na nich.', 'Co and nic keep their nominative form. With a negated verb nic is still used: Nic nie widzę.'],
    ins: ['The third person always begins with n in this case: z nim, z nią, z nimi.'],
    loc: ['The locative only appears after a preposition, so the third person always begins with n: o nim, o niej, o nich.'],
  },
  nomNote: 'Personal pronouns in the nominative are the dictionary forms: ja, ty, on, ona, ono, my, wy, oni, one. Polish usually drops them because the verb ending already shows the person.',
  vocNote: 'Pronouns have no vocative of their own. Possessives and “ten” look the same as in the nominative: Mój drogi przyjacielu! Moja kochana mamo!',
};
