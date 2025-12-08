# Weekplanner (Ruben & Lise)

Een touchvriendelijke webapplicatie waarmee Ruben en Lise hun dagelijkse taken per week kunnen afvinken. Ouders krijgen inzicht in wekelijkse, maandelijkse en jaarlijkse prestaties en kunnen personen of taken per week beheren.

## Belangrijkste functies

- Touch-first planner met grote knoppen, weeknavigatie en duidelijke voortgang per persoon.
- Taken aan/uit te zetten per week, plus beheer van personen en taaklijsten voor ouders.
- Statistieken tonen voltooide taken per persoon en per taak (week/maand/jaar) voor beloningsbeslissingen.
- Alle gegevens worden lokaal opgeslagen (browser `localStorage`), zodat voortgang behouden blijft zonder server.

## Projectstructuur

- `src/App.tsx` – hoofdapplicatie met planner-, statistiek- en beheerschermen.
- `src/components/` – losse onderdelen zoals `PlannerGrid`, `StatsPanel` en `AdminPanel`.
- `src/hooks/useLocalStorage.ts` – hulpfunctie voor synchronisatie met `localStorage`.
- `src/utils/` – datum- en voltooiingshulpfuncties.
- `src/data/defaults.ts` – standaardpersonen en -taken.

### LocalStorage-sleutels

- `weekplanner_persons`
- `weekplanner_tasks`
- `weekplanner_completions`
- `weekplanner_week_tasks`

Verwijder deze sleutels via de browsertools om opnieuw te beginnen.

## Ontwikkelen

```bash
npm install
npm run dev
```

De ontwikkelserver draait standaard op `http://localhost:5173/`.

## Builds & linting

- `npm run build` – productiebuild.
- `npm run preview` – preview-server voor de build.
- `npm run lint` – statische analyse.

## Deploy naar GitHub Pages

1. Zorg dat alle wijzigingen gecommit zijn op de `main` branch.
2. Push naar GitHub; de workflow [`deploy.yml`](.github/workflows/deploy.yml) bouwt automatisch met `npm ci` en publiceert de inhoud van `dist/`.
3. Activeer in **Settings → Pages** de bron “GitHub Actions” (eenmalig). Na afloop staat de site live op `https://jacquesmaas2.github.io/weekplanner/`.

## Vervolgideeën

- Export/import van data voor back-ups.
- Extra beloningslogica of notificaties.
- Synchronisatie met een backend of gedeeld huishouden..
