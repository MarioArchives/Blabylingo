/* Gender of every noun used in the case quiz, keyed by its dictionary form.
   m1 = masculine animate (people and animals), m2 = masculine inanimate, n = neuter, f = feminine.
   pl marks nouns that are plural-only, so the sentence tests a plural form even without the "plural" hint.
   Bases with an adjective in front of the noun look up the noun; bases with the adjective after it (piłka nożna) look up the first word. */
const GENDERS = {
  Adam: 'm1', aktor: 'm1', Amerykanin: 'm1', Andrzej: 'm1', Bóg: 'm1', brat: 'm1', chłopiec: 'm1', człowiek: 'm1', dentysta: 'm1',
  doktor: 'm1', dyrektor: 'm1', dziadek: 'm1', Francuz: 'm1', gość: 'm1', inżynier: 'm1', kierowca: 'm1', kolega: 'm1', kot: 'm1',
  Kuba: 'm1', lekarz: 'm1', Łukasz: 'm1', Marek: 'm1', mąż: 'm1', mężczyzna: 'm1', Michał: 'm1', nauczyciel: 'm1', Nowak: 'm1',
  ojciec: 'm1', pacjent: 'm1', pan: 'm1', Paweł: 'm1', pies: 'm1', Piotr: 'm1', Polak: 'm1', polityk: 'm1', pracownik: 'm1',
  profesor: 'm1', przyjaciel: 'm1', Robert: 'm1', sąsiad: 'm1', student: 'm1', syn: 'm1', szef: 'm1', tata: 'm1', Tomek: 'm1',
  turysta: 'm1', uczeń: 'm1', wnuk: 'm1', wujek: 'm1',
  autobus: 'm2', bank: 'm2', but: 'm2', chleb: 'm2', cukier: 'm2', czas: 'm2', długopis: 'm2', dom: 'm2', dworzec: 'm2', dzień: 'm2',
  film: 'm2', hotel: 'm2', klucz: 'm2', komputer: 'm2', koncert: 'm2', kościół: 'm2', Kraków: 'm2', las: 'm2', miesiąc: 'm2',
  nóż: 'm2', obiad: 'm2', ogród: 'm2', park: 'm2', pociąg: 'm2', rachunek: 'm2', rok: 'm2', rower: 'm2', samochód: 'm2', ser: 'm2',
  sklep: 'm2', słownik: 'm2', spacer: 'm2', stół: 'm2', styczeń: 'm2', szpital: 'm2', teatr: 'm2', telefon: 'm2', tenis: 'm2',
  tydzień: 'm2', uniwersytet: 'm2', widelec: 'm2', wieczór: 'm2', ząb: 'm2',
  biuro: 'n', dziecko: 'n', drzewo: 'n', jabłko: 'n', kino: 'n', kochanie: 'n', krzesło: 'n', lotnisko: 'n', łóżko: 'n', masło: 'n',
  metro: 'n', miasto: 'n', miejsce: 'n', mieszkanie: 'n', mleko: 'n', morze: 'n', muzeum: 'n', okno: 'n', oko: 'n', piętro: 'n',
  słońce: 'n', śniadanie: 'n', zdjęcie: 'n', zdrowie: 'n', zwierzę: 'n',
  Anglia: 'f', Anna: 'f', apteka: 'f', babcia: 'f', Basia: 'f', burza: 'f', ciocia: 'f', córka: 'f', cytryna: 'f', czekolada: 'f',
  droga: 'f', dziewczyna: 'f', Ewa: 'f', firma: 'f', fontanna: 'f', frytka: 'f', gazeta: 'f', góra: 'f', herbata: 'f', historia: 'f',
  karta: 'f', Kasia: 'f', kawa: 'f', kolacja: 'f', koleżanka: 'f', książka: 'f', kucharka: 'f', kuchnia: 'f', lekarka: 'f',
  lekcja: 'f', lodówka: 'f', Magda: 'f', mama: 'f', Maria: 'f', Marta: 'f', muzyka: 'f', nauczycielka: 'f', noc: 'f', Ola: 'f',
  pani: 'f', piłka: 'f', poczta: 'f', podłoga: 'f', pogoda: 'f', polityka: 'f', Polska: 'f', pomoc: 'f', praca: 'f', ręka: 'f',
  rodzina: 'f', sąsiadka: 'f', siostra: 'f', sobota: 'f', stolica: 'f', studentka: 'f', szkoła: 'f', telewizja: 'f', ulica: 'f',
  Warszawa: 'f', wieś: 'f', woda: 'f', zupa: 'f', żona: 'f', sok: 'm2', język: 'm2',
  // nouns from the idioms (data-idioms.js)
  koń: 'm1', wąż: 'm1',
  bawełna: 'f', butelka: 'f', choinka: 'f', chmura: 'f', fortuna: 'f', górka: 'f', gruda: 'f', igła: 'f', kieszeń: 'f', kropka: 'f',
  malina: 'f', mucha: 'f', noga: 'f', nuta: 'f', szpilka: 'f', torba: 'f',
  groch: 'm2', grosz: 'm2', kit: 'm2', koniec: 'm2', most: 'm2', nerw: 'm2', nos: 'm2', obraz: 'm2', palec: 'm2',
  niebo: 'n', ramię: 'n',
  // plural-only nouns
  Niemcy: 'm2', państwo: 'm1', pieniądze: 'm2', rodzice: 'm1', wakacje: 'f',
};
const PLURAL_ONLY = ['Niemcy', 'państwo', 'pieniądze', 'rodzice', 'wakacje'];
