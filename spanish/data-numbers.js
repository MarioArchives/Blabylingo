/* Numbers (números): where a Spanish number changes form, or makes the words around it change. Same format as data-past.js.
   Latin American Spanish.
   In table cells, [square brackets] mark the part to highlight.
   In sentences, word{gloss} gives the hover translation and ___ is the gap.
   Sentences have no p (person); at: [row who, column label] names the cell that holds the answer.
   kind: 'number' when the gap is the number itself: base shows the numeral (31, 200 000, 3.º, 1:00) and the answer
   is the whole number in words. kind: 'word' when the gap is a word next to the number (la, las, son, media).
   Check with: node validate.js data-numbers.js NUMBERS */

const NUMBERS = {
  id: 'numbers', pl: 'Números', en: 'Numbers',
  intro: 'Most Spanish numbers never change, but a few do. Uno shortens to un and has a feminine una, the hundreds agree with their noun (doscientos libros, doscientas casas), and millón is a noun that takes de. Ordinals like primero and tercero agree like adjectives and shorten before a masculine noun. Dates use plain numbers, and clock times agree with la hora: la una, las dos.',
  groups: [
    {
      id: 'num-uno', pl: 'Uno, un, una', en: 'One: uno, un, una', q: 'un libro, una mesa, veintiún años',
      summary: 'One agrees with its noun. Before a masculine noun it shortens to un, before a feminine noun it is una, and on its own (when the noun is left out) the masculine is uno. Every number ending in one does the same: veintiún años, treinta y una personas.',
      tables: [
        { title: 'One and the numbers that end in one',
          cols: [{ label: 'Masculine', tint: 'm' }, { label: 'Feminine', tint: 'f' }],
          rows: [
            { who: '1', cells: ['[un] libro', '[una] mesa'] },
            { who: 'On its own', cells: ['Tengo [uno].', 'Tengo [una].'] },
            { who: '21', cells: ['veinti[ún] libros', 'veinti[una] mesas'] },
            { who: '31, 41, 51…', cells: ['treinta y [un] libros', 'treinta y [una] mesas'] },
          ] },
      ],
      rules: [
        { t: 'Before a masculine noun uno becomes un', ex: 'Tengo un hermano y dos hermanas.', en: 'I have one brother and two sisters.' },
        { t: 'Before a feminine noun it is una', ex: 'Solo quiero una manzana.', en: 'I only want one apple.' },
        { t: 'When the noun is left out, the masculine is uno', ex: '¿Cuántos perros tienes? Tengo uno.', en: 'How many dogs do you have? I have one.' },
        { t: 'Numbers ending in one do the same, even with a plural noun', ex: 'Mi hermano tiene veintiún años.', en: 'My brother is twenty-one.' },
      ],
      watch: [
        'Veintiún takes an accent because it ends in n and is stressed on the last syllable. Veintiuno and veintiuna have none.',
        'From 31 up the number is written as separate words: treinta y un, cuarenta y una.',
        'The noun after 21, 31 and so on is plural: veintiún años, not veintiún año.',
      ],
    },
    {
      id: 'num-cien', pl: 'Cien y cientos', en: 'Hundreds', q: 'cien, ciento diez, doscientas',
      summary: 'A hundred on its own, or right before a noun, mil or millones, is cien. When more numbers follow it becomes ciento: ciento diez. From 200 to 900 the hundreds agree with the noun: doscientos libros, doscientas casas. Five, seven and nine hundred are irregular: quinientos, setecientos, novecientos.',
      tables: [
        { title: 'Hundreds with a noun',
          cols: [{ label: 'Masculine', tint: 'm' }, { label: 'Feminine', tint: 'f' }],
          rows: [
            { who: '100', cells: ['[cien] libros', '[cien] casas'] },
            { who: '101–199', cells: ['cien[to] diez libros', 'cien[to] diez casas'] },
            { who: '200', cells: ['doscient[os] libros', 'doscient[as] casas'] },
            { who: '300, 400', cells: ['trescient[os], cuatrocient[os] libros', 'trescient[as], cuatrocient[as] casas'] },
            { who: '500, 700, 900', cells: ['[quin]ient[os], [sete]cient[os], [nove]cient[os]', '[quin]ient[as], [sete]cient[as], [nove]cient[as]'] },
          ] },
      ],
      rules: [
        { t: 'Exactly one hundred is cien', ex: 'Vivo a cien metros de la playa.', en: 'I live a hundred metres from the beach.' },
        { t: 'When more numbers follow, it is ciento', ex: 'El libro tiene ciento veinte páginas.', en: 'The book has a hundred and twenty pages.' },
        { t: 'From 200 to 900 the hundreds agree with the noun', ex: 'Había doscientas personas en la fiesta.', en: 'There were two hundred people at the party.' },
        { t: 'They agree even when mil comes between them and the noun', ex: 'La ciudad tiene trescientas mil personas.', en: 'The city has three hundred thousand people.' },
      ],
      watch: [
        'Before mil and millones it stays cien: cien mil, cien millones.',
        'Never un cien or un ciento: a hundred is just cien.',
        'Quinientos, setecientos and novecientos are irregular. Setecientos is not sietecientos, novecientos is not nuevecientos.',
        'Cien por ciento and ciento por ciento both mean a hundred percent. In Latin America cien por ciento is the usual one.',
      ],
    },
    {
      id: 'num-mil', pl: 'Mil y millón', en: 'Thousands and millions', q: 'dos mil, dos millones de',
      summary: 'Mil never takes a plural in a number: dos mil, diez mil. Millón is a noun, so it has a plural, millones, and takes de before a noun: un millón de personas. When more numbers follow millón, de drops out. Miles and millones on their own mean a vague amount: miles de personas.',
      tables: [
        { title: 'Mil and millón',
          cols: [{ label: 'One', tint: 'all' }, { label: 'Two or more', tint: 'all' }],
          rows: [
            { who: 'Thousand', cells: ['[mil] personas', 'tres [mil] personas'] },
            { who: 'Million', cells: ['un [millón] [de] personas', 'tres [millones] [de] personas'] },
            { who: 'Million + more digits', cells: ['un millón [quinientos] mil pesos', 'dos [millones] quinientos mil pesos'] },
            { who: 'A vague amount', cells: ['—', '[miles] de personas, [millones] de personas'] },
          ] },
      ],
      rules: [
        { t: 'A thousand is just mil, never un mil', ex: 'La entrada cuesta mil pesos.', en: 'The ticket costs a thousand pesos.' },
        { t: 'Mil stays the same after another number', ex: 'Ganamos cinco mil dólares.', en: 'We won five thousand dollars.' },
        { t: 'Millón is a noun: plural millones, and de before a noun', ex: 'México tiene más de cien millones de habitantes.', en: 'Mexico has more than a hundred million inhabitants.' },
        { t: 'Miles de and millones de give a vague amount', ex: 'Había miles de personas en la plaza.', en: 'There were thousands of people in the square.' },
      ],
      watch: [
        'Millón loses its accent in the plural: millón, millones.',
        'No de when more numbers follow: un millón quinientos mil pesos, but un millón de pesos.',
        'Years are read as ordinary numbers: 1990 is mil novecientos noventa, 2025 is dos mil veinticinco.',
      ],
    },
    {
      id: 'num-ordinal', pl: 'Ordinales', en: 'First, second, third', q: 'primer piso, primera vez',
      summary: 'Ordinals are adjectives, so they agree with their noun: primero, primera, primeros, primeras. Primero and tercero drop the final -o before a masculine singular noun: el primer piso, el tercer año. In everyday speech ordinals are used up to about tenth.',
      tables: [
        { title: 'Ordinals',
          cols: [{ label: 'Masculine + noun', tint: 'm' }, { label: 'Masculine alone', tint: 'm' }, { label: 'Feminine', tint: 'f' }],
          rows: [
            { who: '1st', cells: ['el [primer] piso', 'el [primero]', 'la [primera] vez'] },
            { who: '2nd', cells: ['el segund[o] piso', 'el segund[o]', 'la segund[a] vez'] },
            { who: '3rd', cells: ['el [tercer] piso', 'el [tercero]', 'la [tercera] vez'] },
            { who: '4th, 5th', cells: ['el cuart[o], quint[o] piso', 'el cuart[o], quint[o]', 'la cuart[a], quint[a] vez'] },
            { who: 'Plural', cells: ['los primer[os] días', 'los primer[os]', 'las primer[as] semanas'] },
          ] },
      ],
      rules: [
        { t: 'Ordinals agree with their noun in gender and number', ex: 'Es la primera vez que vengo.', en: 'It is the first time I have come.' },
        { t: 'Before a masculine singular noun, primero and tercero lose the -o', ex: 'Vivo en el tercer piso.', en: 'I live on the third floor.' },
        { t: 'When the noun is left out, the full form comes back', ex: 'De todos los libros, el primero es el mejor.', en: 'Of all the books, the first one is the best.' },
      ],
      watch: [
        'Only primero and tercero shorten. Segundo, cuarto and the rest never do: el segundo piso.',
        'The feminine and the plural never shorten: la primera vez, los primeros días.',
        'Ordinals are also written with a number: 1.º, 1.ª, 1.er (primer), 3.er (tercer).',
      ],
    },
    {
      id: 'num-dates', pl: 'Fechas y horas', en: 'Dates and times', q: 'el dos de mayo, a las tres',
      summary: 'Dates use plain numbers: el dos de mayo, el quince de junio. Only the first of the month can be el primero, and in Latin America that is the usual form. Clock times agree with la hora, which is feminine: la una, las dos. One o’clock is singular (es la una), every other hour is plural (son las dos).',
      tables: [
        { title: 'Dates',
          cols: [{ label: 'Day of the month', tint: 'm' }, { label: 'Full date', tint: 'm' }],
          rows: [
            { who: '1st', cells: ['el [primero] (also el [uno])', 'el [primero] de mayo'] },
            { who: 'Other days', cells: ['el [dos], el [quince]', 'el [dos] de mayo'] },
          ] },
        { title: 'Clock times',
          cols: [{ label: 'It is', tint: 'f' }, { label: 'At', tint: 'f' }],
          rows: [
            { who: '1:00', cells: ['[Es] [la] una.', 'a [la] una'] },
            { who: '2:00–12:00', cells: ['[Son] [las] dos.', 'a [las] dos'] },
            { who: '1:30', cells: ['[Es] [la] una y media.', 'a [la] una y media'] },
            { who: 'Half past, quarter past', cells: ['Son las tres y [cuarto].', 'a las tres y [media]'] },
            { who: '1:00, in the past', cells: ['[Era] [la] una.', 'a [la] una'] },
            { who: '2:00, in the past', cells: ['[Eran] [las] dos.', 'a [las] dos'] },
          ] },
      ],
      rules: [
        { t: 'Dates use the plain number, except for the first', ex: 'Mi cumpleaños es el primero de abril, y el de mi hermana es el dos.', en: 'My birthday is on the first of April, and my sister’s is on the second.' },
        { t: 'Clock times are feminine: la una, las dos', ex: 'La clase empieza a las ocho.', en: 'The class starts at eight.' },
        { t: 'One o’clock is singular, the rest are plural', ex: 'Es la una. Son las tres.', en: 'It is one o’clock. It is three o’clock.' },
        { t: 'In the past, use era and eran', ex: 'Eran las once cuando llegamos.', en: 'It was eleven when we arrived.' },
      ],
      watch: [
        'No on before a date: el dos de mayo means on the second of May.',
        'Es la una y media is still singular, because the hour is one.',
        'Y media and y cuarto add half an hour and a quarter. Many Latin Americans say menos cuarto or un cuarto para for a quarter to.',
      ],
    },
  ],

  sentences: [
    // Uno, un, una
    { c: 'num-uno', kind: 'number', at: ['1', 'Masculine'], s: 'Tengo{I have} ___ hermano{brother|m} y{and} dos{two} hermanas{sisters|f.pl}.', base: '1', gloss: 'one', a: ['un'], en: 'I have one brother and two sisters.', why: 'Hermano is masculine, so uno shortens to un right before it.' },
    { c: 'num-uno', kind: 'number', at: ['1', 'Feminine'], s: 'Solo{only} quiero{I want} ___ manzana{apple|f}.', base: '1', gloss: 'one', a: ['una'], en: 'I only want one apple.', why: 'Manzana is feminine, so one is una.' },
    { c: 'num-uno', kind: 'number', at: ['On its own', 'Masculine'], s: '¿Cuántos{how many|m.pl} hijos{children|m.pl} tienes{do you have}? Solo{only} tengo{I have} ___.', base: '1', gloss: 'one', a: ['uno'], en: 'How many children do you have? I only have one.', why: 'The noun hijos is left out, so the masculine keeps its full form: uno.' },
    { c: 'num-uno', kind: 'number', at: ['On its own', 'Feminine'], s: '¿Cuántas{how many|f.pl} hermanas{sisters|f.pl} tienes{do you have}? Tengo{I have} ___.', base: '1', gloss: 'one', a: ['una'], en: 'How many sisters do you have? I have one.', why: 'The hidden noun is hermana, which is feminine, so one is una.' },
    { c: 'num-uno', kind: 'number', at: ['1', 'Masculine'], s: 'Ella{she} tiene{has} ___ gato{cat|m} y{and} dos{two} perros{dogs|m.pl}.', base: '1', gloss: 'one', a: ['un'], en: 'She has one cat and two dogs.', why: 'Gato is masculine, so uno becomes un before it.' },
    { c: 'num-uno', kind: 'number', at: ['1', 'Feminine'], s: '¿Me{me} pasas{can you pass} ___ servilleta{napkin|f}, por_favor{please}?', base: '1', gloss: 'a, one', a: ['una'], en: 'Can you pass me a napkin, please?', why: 'Servilleta is feminine, so the word for a or one is una.' },
    { c: 'num-uno', kind: 'number', at: ['21', 'Masculine'], s: 'Mi{my} hermano{brother|m} tiene{has} ___ años{years|m.pl}.', base: '21', gloss: 'twenty-one', a: ['veintiún'], en: 'My brother is twenty-one.', why: 'Años is masculine, so veintiuno shortens to veintiún, with an accent on the ú.' },
    { c: 'num-uno', kind: 'number', at: ['21', 'Feminine'], s: 'En{in} la{the|f} clase{class|f} hay{there are} ___ alumnas{students (female)|f.pl}.', base: '21', gloss: 'twenty-one', a: ['veintiuna'], en: 'There are twenty-one students in the class.', why: 'Alumnas is feminine, so twenty-one is veintiuna, even though the noun is plural.' },
    { c: 'num-uno', kind: 'number', at: ['21', 'Masculine'], s: 'Hace{it has been} ___ días{days|m.pl} que{that} llueve{it rains}.', base: '21', gloss: 'twenty-one', a: ['veintiún'], en: 'It has been raining for twenty-one days.', why: 'Día is masculine even though it ends in -a, so twenty-one is veintiún.' },
    { c: 'num-uno', kind: 'number', at: ['31, 41, 51…', 'Masculine'], s: 'El{the|m} libro{book|m} cuesta{costs} ___ dólares{dollars|m.pl}.', base: '31', gloss: 'thirty-one', a: ['treinta y un'], en: 'The book costs thirty-one dollars.', why: 'Dólares is masculine, so the one in thirty-one shortens: treinta y un.' },
    { c: 'num-uno', kind: 'number', at: ['31, 41, 51…', 'Feminine'], s: 'Invitamos{we invited} a{(to)} ___ personas{people|f.pl}.', base: '41', gloss: 'forty-one', a: ['cuarenta y una'], en: 'We invited forty-one people.', why: 'Persona is feminine, so the one in forty-one is una: cuarenta y una.' },
    { c: 'num-uno', kind: 'number', at: ['31, 41, 51…', 'Masculine'], s: 'Pagué{I paid} ___ pesos{pesos|m.pl} por{for} la{the|f} camisa{shirt|f}.', base: '51', gloss: 'fifty-one', a: ['cincuenta y un'], en: 'I paid fifty-one pesos for the shirt.', why: 'The number goes with pesos, which is masculine, so it is cincuenta y un, not cincuenta y uno.' },

    // Cien y cientos
    { c: 'num-cien', kind: 'number', at: ['100', 'Masculine'], s: 'Vivo{I live} a{at} ___ metros{metres|m.pl} de{from} la{the|f} playa{beach|f}.', base: '100', gloss: 'a hundred', a: ['cien'], en: 'I live a hundred metres from the beach.', why: 'Exactly one hundred before a noun is cien.' },
    { c: 'num-cien', kind: 'number', at: ['101–199', 'Feminine'], s: 'La{the|f} biblioteca{library|f} tiene{has} ___ sillas{chairs|f.pl}.', base: '120', gloss: 'a hundred and twenty', a: ['ciento veinte'], en: 'The library has a hundred and twenty chairs.', why: 'More numbers follow the hundred, so cien becomes ciento: ciento veinte. Ciento does not change for feminine nouns.' },
    { c: 'num-cien', kind: 'number', at: ['101–199', 'Masculine'], s: 'Ella{she} pagó{paid} ___ pesos{pesos|m.pl}.', base: '150', gloss: 'a hundred and fifty', a: ['ciento cincuenta'], en: 'She paid a hundred and fifty pesos.', why: 'Cincuenta follows the hundred, so it is ciento cincuenta, not cien cincuenta.' },
    { c: 'num-cien', kind: 'number', at: ['100', 'Masculine'], s: 'Estoy{I am} ___ por{per} ciento{hundred} seguro{sure|m}.', base: '100', gloss: 'a hundred', a: ['cien', 'ciento'], en: 'I am a hundred percent sure.', why: 'In Latin America a hundred percent is usually cien por ciento.' },
    { c: 'num-cien', kind: 'number', at: ['100', 'Masculine'], s: 'La{the|f} ciudad{city|f} tiene{has} ___ habitantes{inhabitants|m.pl}.', base: '100 000', gloss: 'a hundred thousand', a: ['cien mil'], en: 'The city has a hundred thousand inhabitants.', why: 'Before mil the hundred stays cien: cien mil.' },
    { c: 'num-cien', kind: 'number', at: ['200', 'Feminine'], s: 'En{in} el{the|m} estadio{stadium|m} había{there were} ___ personas{people|f.pl}.', base: '200', gloss: 'two hundred', a: ['doscientas'], en: 'There were two hundred people in the stadium.', why: 'Persona is feminine, so two hundred takes -as: doscientas.' },
    { c: 'num-cien', kind: 'number', at: ['200', 'Feminine'], s: 'Viven{live} ___ personas{people|f.pl} en{in} esta{this|f} ciudad{city|f}.', base: '200 000', gloss: 'two hundred thousand', a: ['doscientas mil'], en: 'Two hundred thousand people live in this city.', why: 'The hundreds agree with the noun even with mil in between: doscientas mil personas.' },
    { c: 'num-cien', kind: 'number', at: ['300, 400', 'Masculine'], s: 'El{the|m} viaje{trip|m} cuesta{costs} ___ dólares{dollars|m.pl}.', base: '300', gloss: 'three hundred', a: ['trescientos'], en: 'The trip costs three hundred dollars.', why: 'Dólares is masculine, so three hundred keeps -os.' },
    { c: 'num-cien', kind: 'number', at: ['300, 400', 'Feminine'], s: 'Compramos{we bought} ___ botellas{bottles|f.pl} de{of} agua{water|f}.', base: '400', gloss: 'four hundred', a: ['cuatrocientas'], en: 'We bought four hundred bottles of water.', why: 'The number goes with botellas, which is feminine: cuatrocientas.' },
    { c: 'num-cien', kind: 'number', at: ['500, 700, 900', 'Feminine'], s: 'La{the|f} novela{novel|f} tiene{has} ___ páginas{pages|f.pl}.', base: '500', gloss: 'five hundred', a: ['quinientas'], en: 'The novel has five hundred pages.', why: 'Página is feminine, so five hundred is quinientas.' },
    { c: 'num-cien', kind: 'number', at: ['500, 700, 900', 'Masculine'], s: 'El{the|m} pueblo{village|m} tiene{has} ___ habitantes{inhabitants|m.pl}.', base: '700', gloss: 'seven hundred', a: ['setecientos'], en: 'The village has seven hundred inhabitants.', why: 'Seven hundred is irregular, setecientos, not sietecientos. Habitantes is masculine, so it ends in -os.' },
    { c: 'num-cien', kind: 'number', at: ['500, 700, 900', 'Feminine'], s: 'Invitaron{they invited} a{(to)} ___ personas{people|f.pl} a{to} la{the|f} boda{wedding|f}.', base: '900', gloss: 'nine hundred', a: ['novecientas'], en: 'They invited nine hundred people to the wedding.', why: 'Nine hundred is irregular, novecientos, and it agrees with personas: novecientas.' },

    // Mil y millón
    { c: 'num-mil', kind: 'number', at: ['Thousand', 'One'], s: 'La{the|f} entrada{ticket|f} al{to the|m} museo{museum|m} cuesta{costs} ___ pesos{pesos|m.pl}.', base: '1000', gloss: 'a thousand', a: ['mil'], en: 'The ticket to the museum costs a thousand pesos.', why: 'A thousand is just mil, never un mil.' },
    { c: 'num-mil', kind: 'number', at: ['Thousand', 'One'], s: 'Nací{I was born} en{in} ___.', base: '1990', gloss: 'nineteen ninety', a: ['mil novecientos noventa'], en: 'I was born in 1990.', why: 'Years are read as normal numbers: 1990 is mil novecientos noventa. One thousand is simply mil, never un mil.' },
    { c: 'num-mil', kind: 'number', at: ['Thousand', 'Two or more'], s: 'El{the|m} carro{car|m} usado{used|m} cuesta{costs} ___ dólares{dollars|m.pl}.', base: '5000', gloss: 'five thousand', a: ['cinco mil'], en: 'The used car costs five thousand dollars.', why: 'Mil never takes a plural in a number: cinco mil, not cinco miles.' },
    { c: 'num-mil', kind: 'number', at: ['Thousand', 'Two or more'], s: 'Pagamos{we paid} ___ pesos{pesos|m.pl} por{for} el{the|m} sofá{sofa|m}.', base: '20 000', gloss: 'twenty thousand', a: ['veinte mil'], en: 'We paid twenty thousand pesos for the sofa.', why: 'After another number mil stays the same: veinte mil.' },
    { c: 'num-mil', kind: 'number', at: ['Million', 'One'], s: 'El{the|m} premio{prize|m} es{is} de{of} ___ de{of} pesos{pesos|m.pl}.', base: '1 000 000', gloss: 'a million', a: ['un millón'], en: 'The prize is one million pesos.', why: 'Millón is a masculine noun: un millón, followed by de before the noun.' },
    { c: 'num-mil', kind: 'number', at: ['Million', 'One'], s: 'Cada{every} año{year|m} llega{arrives} ___ de{of} turistas{tourists|m.pl}.', base: '1 000 000', gloss: 'a million', a: ['un millón'], en: 'A million tourists arrive every year.', why: 'One million is un millón, with an accent in the singular, and de before the noun.' },
    { c: 'num-mil', kind: 'number', at: ['Million', 'Two or more'], s: 'Mi{my} ciudad{city|f} tiene{has} ___ de{of} habitantes{inhabitants|m.pl}.', base: '3 000 000', gloss: 'three million', a: ['tres millones'], en: 'My city has three million inhabitants.', why: 'Millón is a noun, so after three it goes into the plural: millones, without the accent.' },
    { c: 'num-mil', kind: 'number', at: ['Million', 'Two or more'], s: 'Vendieron{they sold} ___ de{of} copias{copies|f.pl} del{of the|m} libro{book|m}.', base: '10 000 000', gloss: 'ten million', a: ['diez millones'], en: 'They sold ten million copies of the book.', why: 'After diez, millón is plural: diez millones de copias.' },
    { c: 'num-mil', kind: 'number', at: ['Million + more digits', 'One'], s: 'La{the|f} casa{house|f} cuesta{costs} ___ pesos{pesos|m.pl}.', base: '1 500 000', gloss: 'one and a half million', a: ['un millón quinientos mil'], en: 'The house costs one million five hundred thousand pesos.', why: 'More numbers follow millón, so there is no de. Quinientos agrees with pesos, which is masculine.' },
    { c: 'num-mil', kind: 'number', at: ['Million + more digits', 'Two or more'], s: 'La{the|f} empresa{company|f} ganó{earned} ___ dólares{dollars|m.pl}.', base: '2 500 000', gloss: 'two and a half million', a: ['dos millones quinientos mil'], en: 'The company earned two million five hundred thousand dollars.', why: 'After dos, millón is plural: dos millones. No de, because more numbers follow.' },
    { c: 'num-mil', kind: 'number', at: ['A vague amount', 'Two or more'], s: 'En{in} la{the|f} plaza{square|f} había{there were} ___ de{of} personas{people|f.pl}.', base: '1000', hint: 'vague', gloss: 'thousand', a: ['miles'], en: 'There were thousands of people in the square.', why: 'For a vague amount mil becomes a plural noun, miles, and takes de.' },
    { c: 'num-mil', kind: 'number', at: ['A vague amount', 'Two or more'], s: 'En{in} el{the|m} cielo{sky|m} hay{there are} ___ de{of} estrellas{stars|f.pl}.', base: '1 000 000', hint: 'vague', gloss: 'million', a: ['millones'], en: 'There are millions of stars in the sky.', why: 'Millones de on its own, without a number before it, means a vague, huge amount.' },

    // Ordinales
    { c: 'num-ordinal', kind: 'number', at: ['1st', 'Masculine + noun'], s: 'Vivo{I live} en{on} el{the|m} ___ piso{floor|m}.', base: '1.º', gloss: 'first', a: ['primer'], en: 'I live on the first floor.', why: 'Right before a masculine singular noun, primero loses its -o: el primer piso.' },
    { c: 'num-ordinal', kind: 'number', at: ['1st', 'Feminine'], s: 'Es{it is} la{the|f} ___ vez{time|f} que{that} visito{I visit} México{Mexico}.', base: '1.º', gloss: 'first', a: ['primera'], en: 'It is the first time I have visited Mexico.', why: 'Vez is feminine, so first is primera. The feminine never shortens.' },
    { c: 'num-ordinal', kind: 'number', at: ['3rd', 'Masculine + noun'], s: 'Mi{my} oficina{office|f} está{is} en{on} el{the|m} ___ piso{floor|m}.', base: '3.º', gloss: 'third', a: ['tercer'], en: 'My office is on the third floor.', why: 'Piso is masculine singular and comes right after, so tercero shortens to tercer.' },
    { c: 'num-ordinal', kind: 'number', at: ['3rd', 'Masculine + noun'], s: 'Este{this|m} es{is} mi{my} ___ año{year|m} en{at} la{the|f} universidad{university|f}.', base: '3.º', gloss: 'third', a: ['tercer'], en: 'This is my third year at university.', why: 'Año is masculine singular and follows directly, so it is tercer año.' },
    { c: 'num-ordinal', kind: 'number', at: ['1st', 'Masculine alone'], s: '¿Quién{who} es{is} el{the|m} ___ de{in} la{the|f} fila{line|f}?', base: '1.º', gloss: 'first', a: ['primero'], en: 'Who is first in line?', why: 'No noun follows the ordinal, so it keeps its full form: el primero.' },
    { c: 'num-ordinal', kind: 'number', at: ['3rd', 'Masculine alone'], s: 'De{of} los{the|m.pl} tres{three} libros{books|m.pl}, el{the|m} ___ es{is} el{the|m} mejor{best}.', base: '3.º', gloss: 'third', a: ['tercero'], en: 'Of the three books, the third is the best.', why: 'The noun libro is left out, so tercero keeps its -o.' },
    { c: 'num-ordinal', kind: 'number', at: ['2nd', 'Feminine'], s: 'La{the|f} ___ semana{week|f} de{of} clases{classes|f.pl} fue{was} difícil{difficult}.', base: '2.º', gloss: 'second', a: ['segunda'], en: 'The second week of classes was hard.', why: 'Semana is feminine, so second is segunda.' },
    { c: 'num-ordinal', kind: 'number', at: ['3rd', 'Feminine'], s: 'Gira{turn} a{to} la{the|f} derecha{right|f} en{at} la{the|f} ___ calle{street|f}.', base: '3.º', gloss: 'third', a: ['tercera'], en: 'Turn right at the third street.', why: 'Calle is feminine, so third is tercera. Only the masculine shortens.' },
    { c: 'num-ordinal', kind: 'number', at: ['4th, 5th', 'Masculine + noun'], s: 'Mi{my} hija{daughter|f} está{is} en{in} ___ grado{grade|m}.', base: '5.º', gloss: 'fifth', a: ['quinto'], en: 'My daughter is in fifth grade.', why: 'Grado is masculine, so fifth is quinto. Only primero and tercero shorten.' },
    { c: 'num-ordinal', kind: 'number', at: ['4th, 5th', 'Masculine + noun'], s: 'Estamos{we are} leyendo{reading} el{the|m} ___ capítulo{chapter|m}.', base: '4.º', gloss: 'fourth', a: ['cuarto'], en: 'We are reading the fourth chapter.', why: 'Cuarto agrees with capítulo, which is masculine, and it never shortens.' },
    { c: 'num-ordinal', kind: 'number', at: ['Plural', 'Masculine + noun'], s: 'Los{the|m.pl} ___ días{days|m.pl} fueron{were} muy{very} duros{hard|m.pl}.', base: '1.º', gloss: 'first', a: ['primeros'], en: 'The first days were very hard.', why: 'Días is masculine plural, so first is primeros. Only the singular shortens.' },
    { c: 'num-ordinal', kind: 'number', at: ['Plural', 'Feminine'], s: 'Las{the|f.pl} ___ clases{classes|f.pl} son{are} gratis{free}.', base: '1.º', gloss: 'first', a: ['primeras'], en: 'The first classes are free.', why: 'Clases is feminine plural, so first is primeras.' },

    // Fechas y horas
    { c: 'num-dates', kind: 'number', at: ['1st', 'Full date'], s: 'Hoy{today} es{is} el{the|m} ___ de{of} mayo{May|m}.', base: '1', gloss: 'first', a: ['primero', 'uno'], en: 'Today is the first of May.', why: 'The first of the month is el primero, the usual form in Latin America. El uno is also heard.' },
    { c: 'num-dates', kind: 'number', at: ['1st', 'Day of the month'], s: 'Nos{us} pagan{they pay} el{the|m} ___ de{of} cada{every} mes{month|m}.', base: '1', gloss: 'first', a: ['primero', 'uno'], en: 'They pay us on the first of every month.', why: 'The first day of the month is el primero. No word for on is needed before a date.' },
    { c: 'num-dates', kind: 'number', at: ['Other days', 'Full date'], s: 'Mi{my} cumpleaños{birthday|m} es{is} el{the|m} ___ de{of} octubre{October|m}.', base: '2', gloss: 'two', a: ['dos'], en: 'My birthday is on the second of October.', why: 'From the second on, dates use plain numbers: el dos, not el segundo.' },
    { c: 'num-dates', kind: 'word', at: ['1:00', 'At'], s: 'La{the|f} clase{class|f} empieza{starts} a{at} ___ una{one}.', base: 'las', hint: '1:00', gloss: 'the', a: ['la'], en: 'The class starts at one.', why: 'Times agree with la hora. One is singular, so it is a la una.' },
    { c: 'num-dates', kind: 'word', at: ['2:00–12:00', 'At'], s: 'Nos{each other} vemos{we see} a{at} ___ tres{three}.', base: 'la', hint: '3:00', gloss: 'the', a: ['las'], en: 'See you at three.', why: 'Every hour except one is plural, and feminine because of las horas: a las tres.' },
    { c: 'num-dates', kind: 'word', at: ['2:00–12:00', 'It is'], s: 'Mira{look at} el{the|m} reloj{clock|m}: son{it is} ___ diez{ten}.', base: 'la', hint: '10:00', gloss: 'the', a: ['las'], en: 'Look at the clock: it is ten.', why: 'Ten o’clock is plural, so it is son las diez.' },
    { c: 'num-dates', kind: 'word', at: ['2:00–12:00', 'It is'], s: 'Ahora{now} ___ las{the|f.pl} ocho{eight}.', base: 'ser', hint: '8:00', gloss: 'to be', a: ['son'], en: 'It is eight o’clock now.', why: 'With any hour but one the verb is plural: son las ocho.' },
    { c: 'num-dates', kind: 'word', at: ['1:00', 'It is'], s: 'Ya{already} ___ la{the|f} una{one}.', base: 'ser', hint: '1:00', gloss: 'to be', a: ['es'], en: 'It is already one o’clock.', why: 'One o’clock is singular, so the verb is singular too: es la una.' },
    { c: 'num-dates', kind: 'word', at: ['1:30', 'At'], s: 'El{the|m} tren{train|m} sale{leaves} a{at} ___ una{one} y{and} media{half|f}.', base: 'las', hint: '1:30', gloss: 'the', a: ['la'], en: 'The train leaves at half past one.', why: 'The hour is still one, so it stays singular: a la una y media.' },
    { c: 'num-dates', kind: 'word', at: ['Half past, quarter past', 'At'], s: 'Llegamos{we arrived} a{at} las{the|f.pl} nueve{nine} y{and} ___.', base: 'medio', hint: ':30', gloss: 'half', a: ['media'], en: 'We arrived at half past nine.', why: 'Half past is y media, feminine because it means media hora, half an hour.' },
    { c: 'num-dates', kind: 'word', at: ['1:00, in the past', 'It is'], s: 'Cuando{when} llegué{I arrived}, ___ la{the|f} una{one} de{in} la{the|f} mañana{morning|f}.', base: 'ser', hint: '1:00', gloss: 'to be', a: ['era'], en: 'When I arrived, it was one in the morning.', why: 'Telling the time in the past uses the imperfect of ser. One o’clock is singular: era la una.' },
    { c: 'num-dates', kind: 'word', at: ['2:00, in the past', 'It is'], s: 'Cuando{when} salimos{we left}, ___ las{the|f.pl} once{eleven} de{at} la{the|f} noche{night|f}.', base: 'ser', hint: '11:00', gloss: 'to be', a: ['eran'], en: 'When we left, it was eleven at night.', why: 'Eleven o’clock is plural, so the imperfect of ser is plural too: eran las once.' },
    { c: 'num-dates', kind: 'number', at: ['1:00', 'At'], s: 'El{the|m} almuerzo{lunch|m} es{is} a{at} la{the|f} ___.', base: '1:00', gloss: 'one o’clock', a: ['una'], en: 'Lunch is at one.', why: 'Hours are feminine because of la hora, so one o’clock is la una, never el uno.' },
    { c: 'num-dates', kind: 'number', at: ['2:00–12:00', 'It is'], s: 'Son{it is} las{the|f.pl} ___ y{and} cuarto{quarter|m}.', base: '7:15', gloss: 'seven', a: ['siete'], en: 'It is quarter past seven.', why: 'Say the hour first, then y cuarto for the quarter: son las siete y cuarto.' },
    { c: 'num-dates', kind: 'number', at: ['Other days', 'Full date'], s: 'Hoy{today} es{is} el{the|m} ___ de{of} julio{July|m}.', base: '21', gloss: 'twenty-one', a: ['veintiuno'], en: 'Today is the twenty-first of July.', why: 'Dates use plain numbers. No noun follows, so twenty-one keeps its full form: el veintiuno.' },
  ],
};
