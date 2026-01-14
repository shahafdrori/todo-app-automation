# Todo App Automation

End-to-end UI test project for a Todo application using **Playwright + TypeScript**.

Built as a **portfolio-grade** E2E suite with an emphasis on **cross-browser reliability** (Chromium/Firefox/WebKit) and **CI stability**:

* **Sharding** for faster CI runs
* **Blob reports + merged HTML report** for a single CI artifact
* **Optional in-memory Tasks API mock** (`MOCK_API=true`) for deterministic tests
* **Mock + Real Stack coverage** (mock mode for PR gate, real Mongo+backend+frontend in nightly/manual CI)
* **Page Object Model + reusable helpers/components** for maintainable test code

---

## Tech stack

* Playwright Test Runner
* TypeScript
* Page Object Model (POM) + reusable components (TaskCard)
* GitHub Actions CI (browser matrix + sharding + merged report)
* Optional in-memory Tasks API mock (`MOCK_API=true`)
* dotenv for local config (`.env`)

---

## Quick start

```bash
npm ci
npm test
npm run report
```

* `npm test` runs in **mock mode** by default (`MOCK_API=true`), so it works without a backend/DB.

---

## What’s covered by the tests

### UI flows

* Navigation between tabs (Home/Admin/Map)
* Create a task from **Home** and validate it appears in the **Admin** table (full row validation)
* Create a task from **Admin** and validate it appears in the **Admin** table (full row validation)
* Task dialog behavior: fill + cancel, submit, coordinate inputs are populated
* Clear All removes tasks from Home + Admin and persists after reload (mock + real)
* Home filters:

  * Search filters tasks by name (mock + real)
  * Show Completed is tracked as a known frontend bug (mock-only expected failure)
* Home task list (Task Card actions + details):

  * Validate actions exist (checkbox, edit, delete, location)
  * Validate details parsing (subject, priority, coordinates)
  * Toggle completion and validate UI change (name color)
  * Delete from home list removes the task from Home + Admin (including filtered view + reload) (mock + real)
  * Edit from home list updates the task in Home + Admin (prefill + update + reload) (mock + real)
  * Location from home list opens the map dialog and validates marker matches task coordinates (filtered view + close) (mock + real)

### Admin table assertions

* Generic `TableHelper` (headers, row search, per-cell validation)
* Task-specific assertions in `taskTableAsserts.ts`:

  * Row presence by NAME
  * Strict date matching (input `MM/DD/YYYY` to UI `DD Mon YYYY`)
  * Coordinate numeric assertions (`toBeCloseTo`)

### Map interactions

* Double-click selects a location and fills longitude/latitude inputs
* Marker moves accordingly (validated via debug hooks)
* Pan & zoom:

  * Mouse wheel zoom on Map tab
  * Zoom buttons in the dialog map
* Zoom level validated via OpenLayers debug hooks (`__OL_DEBUG__`)
* Marker coordinate normalization helper supports both:

  * lon/lat degrees (EPSG:4326)
  * WebMercator meters (EPSG:3857) converted to lon/lat

---

## Project structure (current)

```
.github/workflows/
  playwright.yml              # CI (Mock): 3 browsers x 3 shards, blob upload + merged HTML report
  playwright-real.yml         # CI (Real Stack): Mongo + backend + frontend build/preview + chromium run

tests/
  components/
    navBar.ts                 # NavBar component (tab navigation)
    TaskCard.ts               # Task card component (actions + reads inside a card root)
  data/
    apiRoutes.ts              # Central API route matchers (used by mocks + waits)
    taskData.ts               # Unique task builder + date utilities
    testIds.ts                # Central data-test IDs used across POM/tests
  fixtures/
    test-fixtures.ts          # Extends Playwright test: auto mock install + URL rewrite in mock mode
  helpers/
    Buttons.ts                # Typed data-test button helper (Page | Locator root)
    FormFields.ts             # Form field helper (input/select/MUI handling)
    TableHelper.ts            # Generic table helper for assertions
    debug/
      apiLogs.ts              # Optional request/response logging (API_LOGS=true)
    flows/
      taskFlows.ts            # Reusable UI flows (e.g., createTaskFromHome/Admin)
    list/
      homeTaskListText.ts     # Parse subject/priority/coords from home task meta text
    map/
      mapHelpers.ts           # OpenLayers helpers (click/pan/zoom, debug-hook validation)
    table/
      taskTableAsserts.ts     # Task-focused admin table assertions (date + coords + presence/absence)
  mocks/
    tasksApiMock.ts           # In-memory Tasks API mock (context.route)
  pages/
    AddTaskDialog.ts          # Dialog POM (create + update waits)
    AdminTablePage.ts         # Admin page POM + table assertions
    HomePage.ts               # Home page POM (search/clearAll/showCompleted)
    HomeTaskList.ts           # Home list POM (find cards, click actions, read values)
    MapPage.ts                # Map tab/dialog POM helpers
    TaskLocationDialog.ts     # Location dialog POM (marker assertions + close)
  specs/
    admin-table.spec.ts
    clear-all.spec.ts
    home-filters.spec.ts
    home-task-list.spec.ts
    home.spec.ts
    map-tab.spec.ts
    task-card-delete.spec.ts
    task-card-edit.spec.ts
    task-card-location.spec.ts
    todo-dialog.spec.ts
    todo-map-dialog.spec.ts

playwright.config.ts
.env.example
package.json
```

---

## Requirements

* Node.js **18+** (CI uses Node 20)

Install dependencies:

```bash
npm ci
# or: npm install
```

Optional (first time only on a local machine if browsers are missing):

```bash
npm run pw:install
```

---

## Environment variables (.env / .env.example)

Local configuration is loaded from `.env` (via `dotenv`).
This repo ignores `.env` in git, so commit a template as `.env.example` and copy it locally.

Create your local `.env`:

```bash
cp .env.example .env
```

Supported variables:

* `BASE_URL` - where the UI is running
  If not set, Playwright uses: `http://localhost:5173`
* `MOCK_API` - enable/disable the in-memory Tasks API mock
  `true` = mock mode (deterministic)
  `false` = real backend mode (requires backend + DB)
* `API_LOGS` - opt-in API debug logs (request/response logging)
  `true` = enable logs
  `false` = disable logs (default)

Example `.env`:

```ini
BASE_URL=http://localhost:5173
MOCK_API=true
API_LOGS=false
```

Example `.env.example` (committed):

```ini
BASE_URL=
MOCK_API=
API_LOGS=
```

Notes:

* `npm test` runs mock mode by default (script sets `MOCK_API=true`)
* To run against a real backend, use the `test:real:*` scripts
* API logs are disabled unless you set `API_LOGS=true`

---

## Running tests locally

### Mock mode (default, recommended)

Runs deterministically without a real backend or database:

```bash
npm test
```

Other useful mock commands:

```bash
npm run test:mock:headed
npm run test:mock:debug
npm run test:mock:flaky
```

### Real backend mode (local)

Runs against a real backend and database.

Requirements:

* Frontend running at `BASE_URL` (default `http://localhost:5173`)
* Backend running (typically `http://localhost:3000`)
* Frontend configured to call the backend (often via the frontend repo `.env`, e.g. `VITE_API_KEY=http://localhost:3000`)
* If you use local MongoDB via Docker, make sure the backend `DATABASE_URL` points to the local DB and Mongo is up before executing the tests

Example local workflow (Mongo via Docker):

1. Start MongoDB (in the backend repo)

```bash
docker compose up -d
# or: docker compose up -d mongodb
```

2. Start the backend (in the backend repo)

```bash
npm ci
npm start
```

3. Start the frontend (in the frontend repo)

```bash
npm ci
npm run dev
# make sure it runs on http://localhost:5173
```

4. Run tests in real mode (in THIS automation repo)

```bash
# ensure your automation .env has:
# BASE_URL=http://localhost:5173
# MOCK_API=false
npm run test:real
```

Note: The backend/frontend/database are not part of this repo. This repo only contains the Playwright E2E suite.

Other useful real-mode commands:

```bash
npm run test:real:headed
npm run test:real:debug
```

---

## API logs (optional)

Enable API request/response logging for any test run by prefixing the command with `API_LOGS=true`.

```bash
# Example: Run with mocks (headless)
API_LOGS=true npm test

# Example: Run against real backend (headed)
API_LOGS=true npm run test:real:headed
```

---

## Open the last HTML report (local)

```bash
npm run report
# Uses a random free port (--port 0) to avoid EADDRINUSE on the default 9323
```

---

## How the API mock works (MOCK_API)

When `MOCK_API=true`, tests install a **browser-context** route mock (`context.route`) that intercepts Tasks API requests and serves responses from an in-memory state.

Endpoints handled fully in memory:

* `GET /tasks/all`
* `POST /tasks/add`
* `PUT /tasks/update/:id`
* `DELETE /tasks/delete/:id`
* `DELETE /tasks/deleteAll`

The mock is enabled automatically via a Playwright fixture (`tests/fixtures/test-fixtures.ts`), so individual tests don’t need setup/teardown logic.

---

## WebKit reliability fix (URL rewrite in mock mode)

Some frontend builds contain hardcoded backend URLs such as:

`http://localhost:3000/...`

To keep tests stable (especially on WebKit and CI), the fixture injects an init script that rewrites:

`http://localhost:3000/...` -> `window.location.origin/...`

This keeps behavior consistent across:

* Local development
* Deployed UI (Vercel)
* GitHub Actions CI
* WebKit browser runs

---

## CI workflows (GitHub Actions)

### 1) Mock CI (PR gate): `playwright.yml`

Workflow file: `.github/workflows/playwright.yml`

Behavior:

* Runs on pull requests and pushes to main/master
* Browsers: Chromium, Firefox, WebKit
* Sharding: 3 shards per browser (total **9** parallel E2E jobs)
* Target UI: deployed frontend (`BASE_URL=https://todolisthafifa-frontend.vercel.app`)
* Mode: mock mode (`MOCK_API=true`)
* Produces a merged HTML report from blob reports

Artifacts:

* `playwright-report` (merged HTML)
* `test-results-*` per shard (screenshots/videos/traces on failure)

### 2) Real Stack CI (manual + nightly): `playwright-real.yml`

Workflow file: `.github/workflows/playwright-real.yml`

Behavior:

* Runs on `workflow_dispatch` and nightly schedule
* Starts a full stack inside CI:

  * MongoDB service
  * backend (`npm start`)
  * frontend (`npm run build` + `npm run preview`)
* Runs Playwright **Chromium only** against `http://127.0.0.1:5173`
* Mode: real backend + DB (`MOCK_API=false`)

Why Chromium only:

* This workflow’s goal is **integration confidence** (Mongo + backend + built frontend).
* Keeping it Chromium-only reduces CI flakes and runtime while PR-gate mock CI still enforces cross-browser stability.

Artifacts:

* `playwright-report-real` (HTML report)
* `test-results-real` (screenshots/videos/traces)

---

## Known limitations

* **Show Completed** is currently a known frontend limitation:

  * Completion state isn’t persisted to the backend
  * The home list isn’t filtered by `showCompleted` yet
* Because of that, `home-filters.spec.ts` includes a **mock-only** test marked as an expected failure (`test.fail(...)`) and it’s skipped in real mode.
