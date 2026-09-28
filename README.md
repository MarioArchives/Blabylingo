# Blabilingo

Practise the endings of a language: study the tables, then test yourself on real sentences. One engine, one folder per language. No build step and no server needed.

- `polish/`: Końcówki. Noun and adjective cases, past and future tenses, numbers.
- `spanish/`: Terminaciones. Present, past and future tenses, numbers, Colombian idioms.

Open `index.html` to pick a language, or open a language folder's `index.html` directly. The links at the top of each page switch language and keep your place when the other language has the same topic (`#past/quiz`).

    ./open-in-chrome.sh          # the language chooser
    ./open-in-chrome.sh polish   # straight to one language
    ./serve-for-phone.sh         # practise on your phone over the home Wi-Fi

## Layout

- `core/app.js` is the engine: topic switch, filter, tables, quiz, progress and history. Every language uses it unchanged.
- `core/styles.css` is the shared design.
- `core/validate.js` checks any tense or numbers data file. Run it from a language folder: `node ../core/validate.js data-past.js PAST_TENSE`.
- `languages.js` lists the languages for the chooser and the language switch.
- `<language>/` holds everything that belongs to that language: `config.js` (voice, on-screen letters, accent handling, storage prefix), the `data-*.js` files, `index.html` (title, favicon and which data files to load) and validators for checks only that language needs. Each folder has its own README on writing content.

The engine shows a topic only when its data file is loaded, so a language offers exactly the topics it has files for. Anything that differs between languages belongs in that language's folder. If the engine needs a language-specific rule, key it off `APP` in `config.js` rather than copying the engine.

## Adding a language

1. Copy a language folder, for example `spanish/` to `italian/`.
2. Edit `config.js` and `index.html`, and replace the data files.
3. Add an entry to `languages.js`.

## Publishing

GitHub Pages serves the repo as it is: Settings → Pages → Deploy from branch → `master`, root folder. `.nojekyll` keeps Pages from processing the files.

Progress is saved in the browser under each language's own storage prefix. GitHub Pages serves all of one account's project sites from the same origin, so progress saved on the old Polish and Spanish sites carries over.
