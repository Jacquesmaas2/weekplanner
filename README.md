# Weekplanner (Ruben & Lise)

Een touchvriendelijke webapplicatie waarmee Ruben en Lise hun dagelijkse taken per week kunnen afvinken. Ouders krijgen inzicht in wekelijkse, maandelijkse en jaarlijkse prestaties en kunnen personen of taken per week beheren.

## Belangrijkste functies

- Touch-first planner met grote knoppen, weeknavigatie en duidelijke voortgang per persoon.
- **📱 Tablet Dashboard** - Volledig scherm weergave speciaal voor gezinstablets met roterende content, motiverende quotes en real-time statistieken.
- Taken aan/uit te zetten per week, plus beheer van personen en taaklijsten voor ouders.
- Statistieken tonen voltooide taken per persoon en per taak (week/maand/jaar) voor beloningsbeslissingen.
- Dag- en weekbeoordelingen met vrolijke mascottes en een highlight voor "vandaag" op basis van het aantal vinkjes.
- Iedereen krijgt een eigen foto (uploadbaar in het beheerscherm) die terugkomt op het inlogscherm en in de planner.
- Alle gegevens worden lokaal opgeslagen in **IndexedDB** (via Dexie.js), een robuuste browser database die betere prestaties biedt dan localStorage voor gestructureerde data.
- Inlogscherm voor kinderen (alleen eigen overzicht) en ouders (planner, statistieken en beheer).
- Automatische migratie van oude localStorage gegevens naar IndexedDB bij eerste gebruik.

## Tablet Dashboard

De app bevat een speciale **tablet weergave** die perfect is voor een gezinstablet op een centrale plek in huis:

### Toegang tot tablet modus

1. **Via admin interface**: Klik op de "📱 Tablet weergave" knop in de weekcontroles (alleen zichtbaar voor ouders)
2. **Via URL**: Open `https://jouw-url/?tablet=true` voor directe toegang

### Functies

- **Auto-roterende weergaven** (elke 15 seconden):
  - Overzicht van alle personen met hun dagelijkse voortgang
  - Individuele taakoverzichten per persoon
  - Weekstatistieken met leuke feiten
  - Motiverende quotes en complimenten

- **Visueel aantrekkelijk**:
  - Grote, duidelijke lettertypen perfect leesbaar vanaf afstand
  - Kleurrijke gradiënten en animaties
  - Responsive design voor verschillende tabletformaten
  - Geen scrollen nodig - alle info past op één scherm

- **Real-time updates**: De weergave toont altijd de actuele stand zonder handmatig verversen

### Ideaal voor

- Permanent opstelling op een gezinstablet in de woonkamer of keuken
- Motivatie voor kinderen om hun taken te zien
- Overzicht voor het hele gezin in één oogopslag
- Visuele feedback en positieve bekrachtiging

## Projectstructuur

- `src/App.tsx` – hoofdapplicatie met planner-, statistiek- en beheerschermen.
- `src/components/` – losse onderdelen zoals `PlannerGrid`, `StatsPanel`, `AdminPanel` en `TabletDashboard`.
- `src/db/database.ts` – IndexedDB database definitie en migratie logica.
- `src/hooks/useDatabase.ts` – React hooks voor database interactie met real-time updates.
- `src/utils/` – datum- en voltooiingshulpfuncties.
- `src/data/defaults.ts` – standaardpersonen en -taken.

### Database structuur

De app gebruikt **IndexedDB** met de volgende opslag:

- **persons** tabel – alle personen met ID, naam, thema en foto
- **tasks** tabel – alle taken met ID, naam en planning
- **settings** tabel – configuratie zoals completions, weekTaskConfig, session, adminCode

Je kunt de database bekijken via Chrome DevTools → Application → IndexedDB → WeekPlannerDB

Om alle data te wissen: verwijder de database via browsertools of gebruik `indexedDB.deleteDatabase('WeekPlannerDB')` in de console.

## Ontwikkelen

```bash
npm install
npm run dev
```

De ontwikkelserver draait standaard op `http://localhost:5173/`.

Voor tablet weergave tijdens ontwikkeling: `http://localhost:5173/?tablet=true`

## Builds & linting

- `npm run build` – productiebuild.
- `npm run preview` – preview-server voor de build.
- `npm run lint` – statische analyse.

## Deploy naar GitHub Pages

1. Zorg dat alle wijzigingen gecommit zijn op de `main` branch.
2. Push naar GitHub; de workflow [`deploy.yml`](.github/workflows/deploy.yml) bouwt automatisch met `npm ci` en publiceert de inhoud van `dist/`.
3. Activeer in **Settings → Pages** de bron "GitHub Actions" (eenmalig). Na afloop staat de site live op `https://jacquesmaas2.github.io/weekplanner/`.

## Vervolgideeën

- Export/import van data voor back-ups.
- Extra beloningslogica of notificaties.
- Aanpasbare rotatie-interval voor tablet modus.
- Meer motiverende quotes en achievements.

## Inloggen

- Kinderen tikken simpelweg op hun naam om de planner te openen; zij zien uitsluitend hun eigen taken.
- Ouders gebruiken de toegangscode `ouder` (aanpasbaar in het beheerscherm) en krijgen volledige toegang tot planner, statistieken en instellingen.
