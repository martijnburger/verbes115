# Verbes 115

Leer de meest gebruikte Franse werkwoorden, Nederlands ↔ Frans. React + TypeScript + Vite, installeerbaar als app (PWA).

```sh
npm install        # eenmalig
npm run dev        # ontwikkelen: http://localhost:5173
npm test           # tests (vervoegingen, antwoordcontrole, spelregels)
npm run build      # typecheck + productieversie in dist/
npm run preview    # de productieversie lokaal bekijken
```

## Online zetten (Netlify)

Netlify bouwt en publiceert de app automatisch bij elke push naar `main`; de instellingen staan in `netlify.toml`.
Open de site op je telefoon en kies "Zet op beginscherm" (iPhone, Safari) of "App installeren" (Android, Chrome).

## Structuur

- `src/data/verbs.ts`: de werkwoorden (Franse en Nederlandse specificatie) en de frequentievolgorde
- `src/engine/`: vervoegingen in het Frans en Nederlands, en antwoordcontrole (geen UI)
- `src/game/`: niveaus, rondes, XP, badges en opgeslagen voortgang
- `src/speech/`: uitspraak via de spraakfunctie van de browser
- `src/components/`, `src/views/`: de schermen
