# Verbes 115

Leer de 115 meest gebruikte Franse werkwoorden, Nederlands ↔ Frans.

**Probeer het: [verbes115.netlify.app](https://verbes115.netlify.app)**

Open de site op je telefoon en kies "Zet op beginscherm" (iPhone, Safari) of "App installeren" (Android, Chrome). De app werkt daarna ook offline.

## Wat zit erin

- 115 werkwoorden in frequentievolgorde, met Nederlandse vertaling en alternatieven
- Negen niveaus: infinitief, présent, futur proche, passé composé, imparfait, futur simple, conditionnel, subjonctif en een mix van alles
- Per niveau meerkeuze of zelf typen, met een foutenreview
- XP, rangen, sterren en badges; je voortgang blijft bewaard op je eigen toestel (`localStorage`, geen account, geen server)
- Uitspraak via de spraakfunctie van de browser

## Feedback welkom

Gebruik je de app, of kijk je naar de code? Kritisch commentaar is welkom: open een [issue](https://github.com/martijnburger/verbes115/issues) voor fouten in vervoegingen of vertalingen, bugs of ideeën, of stuur een pull request.

## Ontwikkelen

React + TypeScript + Vite, installeerbaar als app (PWA).

```sh
npm install        # eenmalig
npm run dev        # ontwikkelen: http://localhost:5173
npm test           # tests (vervoegingen, antwoordcontrole, spelregels)
npm run build      # typecheck + productieversie in dist/
npm run preview    # de productieversie lokaal bekijken
```

## Online zetten (Netlify)

Netlify bouwt en publiceert de app automatisch bij elke push naar `main`; de instellingen staan in `netlify.toml`. Pull requests krijgen een eigen preview-URL.

## Structuur

- `src/data/verbs.ts`: de werkwoorden (Franse en Nederlandse specificatie) en de frequentievolgorde
- `src/engine/`: vervoegingen in het Frans en Nederlands, en antwoordcontrole (geen UI)
- `src/game/`: niveaus, rondes, XP, badges en opgeslagen voortgang
- `src/speech/`: uitspraak via de spraakfunctie van de browser
- `src/components/`, `src/views/`: de schermen

## Licentie

[MIT](LICENSE): je mag de code vrij gebruiken, aanpassen en verspreiden, mits de copyrightvermelding behouden blijft.
