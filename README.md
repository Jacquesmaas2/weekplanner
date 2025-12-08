# Weekplanner (Ruben & Lise)

Een touchvriendelijke webapplicatie waarmee Ruben en Lise hun dagelijkse taken per week kunnen afvinken. Ouders krijgen inzicht in wekelijkse, maandelijkse en jaarlijkse prestaties en kunnen personen of taken per week beheren.

## Belangrijkste functies

- Touch-first planner met grote knoppen, weeknavigatie en duidelijke voortgang per persoon.
- Taken aan/uit te zetten per week, plus beheer van personen en taaklijsten voor ouders.
- Statistieken tonen voltooide taken per persoon en per taak (week/maand/jaar) voor beloningsbeslissingen.
- Dag- en weekbeoordelingen met vrolijke mascottes en een highlight voor “vandaag” op basis van het aantal vinkjes.
- Iedereen krijgt een eigen foto (uploadbaar in het beheerscherm) die terugkomt op het inlogscherm en in de planner.
- Optionele cloud-synchronisatie zodat alle apparaten dezelfde gegevens zien via een gedeeld gezin-ID.
- Alle gegevens worden lokaal opgeslagen (browser `localStorage`), zodat voortgang behouden blijft zonder server.
- Inlogscherm voor kinderen (alleen eigen overzicht) en ouders (planner, statistieken en beheer).

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
- `weekplanner_household`

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

## Cloud synchronisatie

Wil je de planner op meerdere apparaten delen? Configureer dan Supabase (gratis tier volstaat):

1. Maak een nieuw Supabase-project en voeg een tabel `weekplanner_states` toe met kolommen:
	- `id` (text, primary key)
	- `payload` (jsonb)
	- `updated_at` (timestamptz)
2. Voeg in Supabase een Row Level Security policy toe die `anon` toestaat om rijen `select` en `upsert` te doen op basis van `id`.
3. Maak in de projectinstellingen een service role en kopieer de `Project URL` en `anon public` key.
4. Maak een `.env`-bestand naast `vite.config.ts` met:

```bash
VITE_SUPABASE_URL="https://<jouw-project>.supabase.co"
VITE_SUPABASE_ANON_KEY="<public-anon-key>"
```

Na herstart van `npm run dev` verschijnt in het beheerscherm een veld “Gezin-ID”. Gebruik op elk apparaat dezelfde waarde (bijvoorbeeld `familie-van-dijk`). Zodra het veld is ingevuld worden personen, taken, weekconfiguraties, vinkjes en toegangscode gedeeld tussen alle gekoppelde apparaten.

## Deploy naar GitHub Pages

1. Zorg dat alle wijzigingen gecommit zijn op de `main` branch.
2. Push naar GitHub; de workflow [`deploy.yml`](.github/workflows/deploy.yml) bouwt automatisch met `npm ci` en publiceert de inhoud van `dist/`.
3. Activeer in **Settings → Pages** de bron “GitHub Actions” (eenmalig). Na afloop staat de site live op `https://jacquesmaas2.github.io/weekplanner/`.

## Vervolgideeën

- Export/import van data voor back-ups.
- Extra beloningslogica of notificaties.
- Synchronisatie met een backend of gedeeld huishouden.

## Inloggen

- Kinderen tikken simpelweg op hun naam om de planner te openen; zij zien uitsluitend hun eigen taken.
- Ouders gebruiken de toegangscode `ouder` (aanpasbaar in het beheerscherm) en krijgen volledige toegang tot planner, statistieken en instellingen.
