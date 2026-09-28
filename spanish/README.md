# Terminaciones

Practise Spanish present, past and future tenses, in Latin American usage: ustedes instead of vosotros, the indefinido for finished events even from today, and Latin American vocabulary (carro, celular, apartamento). Part of [Blabilingo](../README.md): the engine is in `../core`, and this folder holds only what is Spanish.

Open `index.html` in a browser:

    xdg-open index.html

Click any word in a quiz sentence to hear it. Google Chrome has a Spanish voice; Brave has none:

    ../open-in-chrome.sh spanish

## Files

- `data-present.js`, `data-past.js` and `data-future.js` hold the tense tables and quiz sentences. Check them with `node ../core/validate.js data-past.js PAST_TENSE`.
- `data-idioms.js` holds Colombian idiom sentences. Idioms join the Present, Past or Future quiz, each filed under the verb group whose tables show its answer. The answer card names the idiom, what it means and what it says literally, and "Idioms only" on the quiz start screen picks just these. Check it with `node validate-idioms.js`.
- `config.js` holds the language settings.
- `index.html` holds the title, the favicon and the list of data files to load.

## Adding a sentence

Copy an entry in the `sentences` list. `word{translation}` sets the hover text and `___` marks the gap. A gender tag after the translation, such as `casa{house|f}` or `amigos{friend|m.pl}`, makes the hover card show gender and number. `p` gives the person of the answer (`yo`, `tú`, `él`, `nosotros`, `ellos`) and drives the highlighted conjugation table in the answer card.

## Quiz options

The start screen lets you pick how many sentences, whether to type answers or write them in a notebook and self-mark, and whether new and missed sentences come first. Progress is saved in the browser and an unfinished quiz can be continued later.
