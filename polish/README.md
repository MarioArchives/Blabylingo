# Końcówki

Practise Polish endings: noun and adjective cases, past tense, future tense. Part of [Blabilingo](../README.md): the engine is in `../core`, and this folder holds only what is Polish.

Open `index.html` in a browser:

    xdg-open index.html

## Hearing the words

In the quiz, click any word in the sentence to hear it. The page uses the browser's own Polish voice. Google Chrome has one, called "Google polski", and it needs an internet connection. Brave has no speech voices, so use Chrome for audio:

    ../open-in-chrome.sh polish

## Files

- `data.js` holds the case tables and the case quiz sentences.
- `data-genders.js` gives the gender of every quiz noun, so the answer card can highlight the right cell of the endings grid. Add an entry when you add a noun.
- `data-cases-extra.js` holds more case sentences. Together with `data.js` every case has 50. Check it with `node validate-cases.js`.
- `data-cases-pronouns.js` holds case sentences that test pronouns, question words and possessives. Check it with `node validate-pronouns.js`.
- `data-idioms.js` holds idiom sentences. Case idioms join the Cases quiz and past-tense idioms join the Past tense quiz. Each one names its idiom, what it means and what it says literally, and "Idioms only" on the quiz start screen picks just these. Check it with `node validate-idioms.js`.
- `data-words.js` holds the paradigms of small words such as który, każdy and jakiś, shown under each case. Check it with `node validate-words.js`.
- `data-past.js` and `data-future.js` hold the tense tables and tense quiz sentences. The app shows a topic only when its file is present.
- `config.js` holds the language settings (speech voice, on-screen letters, storage prefix).
- `index.html` holds the title, the favicon and the list of data files to load.
- Tense and numbers files are checked with the shared validator: `node ../core/validate.js data-past.js PAST_TENSE`.

## Adding a sentence

Copy an entry in the `sentences` list of the file you want. `word{translation}` sets the hover text, `___` marks the gap, and `word_word{...}` joins a fixed phrase. `hint` is the small badge next to the word, such as `plural` or `ona`.

A word can carry a gender tag after the translation: `siostra{sister|f}`, `studenci{student|m1.pl}`. The hover card then shows the gender in colour and a plural banner. Tags are `m1` (masculine animate), `m2` (masculine inanimate), `m` (masculine, for agreeing words), `n`, `f`, with `.pl` for plural. `node validate-tags.js <file> <CONST>` checks tags against the copies in `snapshot/`.

Numbers sentences (`data-numbers.js`) carry `at: [row, column]` naming the cell of the numbers table to highlight. They also carry `kind: 'number'` when the gap is the number itself, and `form` when the gap is a noun, ordinal or verb: `'noun gen.pl.f'`, `'adj loc.sg.n'` or `'verb past.ono'`. The answer card then also shows that case's endings grid or the past-tense table, and the quiz start screen lets you practise only the number or only the words next to it. Check with `node ../core/validate.js data-numbers.js NUMBERS`.

Tense sentences also carry `p`, the person of the answer (`ja`, `ona`, `oni`…), which the answer card uses to highlight the right row of the conjugation table.

`config.js` holds the language settings (speech voice, on-screen letters, storage prefix). The quiz, tables and design come from `../core`, shared with Spanish.

## Progress

Every answer is saved in the browser. The quiz start screen shows, per case or verb group, how many sentences you have seen, mastered (right twice in a row) and need to review. By default a new quiz puts new and missed sentences first. An unfinished quiz can be continued after closing the page. Progress lives in one browser only, so Chrome and Brave keep separate records. "Reset progress" on the start screen clears it.

## Quiz options

The quiz start screen lets you pick 10, 20, 50 or all sentences, drawn at random from your selection. It also offers two answer modes. "Type it here" checks your spelling. "Write it in my notebook" shows only the question, then you reveal the answer and mark yourself right or wrong.
