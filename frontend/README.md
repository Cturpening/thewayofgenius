# Edin frontend

React app, built with [Vite](https://vitejs.dev). Restructured from the
original single-file prototype into feature-based components.

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build into dist/
```

## Structure

```
src/
  main.jsx              entry point
  App.jsx                top-level layout, tab navigation, floating Edin chat
  theme/tokens.js         shared color palette, EEG band/state constants
  lib/                    small framework-agnostic helpers (speech synthesis, waveform math)
  assets/                 embedded image assets
  components/common/      small pieces reused across features (buttons, gauges, cards)
  features/
    dream-journal/        Dream Journal + book-reading view
    genius-constitution/   the Constitution quiz + scoring
    follow-through/        the follow-through log
    genius-profile/        the Genius Profile map/hub and its lenses
    goals-calendar/        goals + calendar view
    library/               symbolic library, lessons, meditations, dream arc
    dojo/                  Practice Dojo (Constitution + Inner Team)
    chat/                  Edin chat assistant
    verification/           technical/EEG proof-of-concept views (not part of the consumer product)
    planned/               future/planned feature previews (biofeedback, microbiome, genetics, etc.)
```

Every `features/*/data/*.js` file holds the mock/seed data for that
feature — swap it out once the frontend talks to the backend instead of
using in-memory demo data.
