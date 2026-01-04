# Todo App Automation

End-to-end UI test project for a Todo application using **Playwright + TypeScript**.

Built as a **portfolio-grade** E2E suite with an emphasis on **cross-browser reliability** (Chromium/Firefox/WebKit) and **CI stability**:

* **Sharding** for faster CI runs
* **Blob reports + merged HTML report** for a single CI artifact
* **Optional in-memory Tasks API mock** (`MOCK_API=true`) for deterministic tests
* **Page Object Model + reusable helpers** for maintainable test code

---

## Tech stack

* Playwright Test Runner
* TypeScript
* Page Object Model (POM)
* GitHub Actions CI (browser matrix + sharding + merged report)
* Optional in-memory Tasks API mock (`MOCK_API=true`)
* dotenv for local config (`.env`)

---

## Quick start

```bash
npm ci
npm test
npm run report
````

* `npm test` runs in **mock mode** by default (`MOCK_API=true`), so it works without a backend/DB.

---

## What’s covered by the tests

UI flows:

* Navigation between tabs (Home/Admin/Map)
* Create a task from **Home** and validate it appears in the **Admin** table (full row validation)
* Create a task from **Admin** and validate it appears in the **Admin** table (full row validation)
* Task dialog behavior: fill + cancel, submit, coordinate inputs are populated
* Clear All removes tasks from Home + Admin and persists after reload
* Table assertions via a generic `TableHelper` (headers, row search, per-cell validation)

Map interactions:

* Double-click selects a location and fills longitude/latitude inputs
* Marker moves accordingly (validated via debug hooks)
* Pan & zoom:

  * Mouse wheel zoom on Map tab
  * Zoom buttons in the dialog map
* Zoom level is validated via OpenLayers debug hooks (`__OL_DEBUG__`)

---

## Project structure (current)

```
.github/workflows/
  playwright.yml              # CI (Mock): 3 browsers × 3 shards, blob upload + merged HTML report
  playwright-real.yml         # CI (Real Stack): Mongo + backend + frontend preview + chromium run

tests/
  components/
    navBar.ts                 # NavBar component (tab navigation)
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
      taskFlows.ts            # Reusable UI flows (e.g., createTaskFromHome)
    map/
      mapHelpers.ts           # OpenLayers helpers (click/pan/zoom, debug-hook validation)
  mocks/
    tasksApiMock.ts           # In-memory Tasks API mock (context.route)
  pages/
    AddTaskDialog.ts          # Dialog POM
    AdminTablePage.ts         # Admin page POM + table assertions
    HomePage.ts               # Home page POM (search/clearAll/showCompleted)
    MapPage.ts                # Map tab/dialog POM helpers
  specs/
    admin-table.spec.ts
    clear-all.spec.ts
    home-filters.spec.ts
    home.spec.ts
    map-tab.spec.ts
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

* `BASE_URL` – where the UI is running
  If not set, Playwright uses: `http://localhost:5173`
* `MOCK_API` – enable/disable the in-memory Tasks API mock
  `true` = mock mode (deterministic)
  `false` = real backend mode (requires backend + DB)
* `API_LOGS` – opt-in API debug logs (request/response logging)
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
* Frontend configured to call the backend (usually via the frontend repo `.env`)
* If you use local MongoDB via Docker, make sure the backend `DATABASE_URL` points to the local container and the DB is running before executing the tests

> Note: The database is **not** part of this repo — run your **backend project** (and its DB setup: Atlas or Docker) before running `npm run test:real`.

Run:

```bash
npm run test:real
```

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

The following endpoints are handled fully in memory:

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

`http://localhost:3000/...` → `window.location.origin/...`

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
* Target UI: deployed frontend (`BASE_URL`)
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
* Runs Playwright **Chromium** against `http://localhost:5173`
* Mode: real backend + DB (`MOCK_API=false`)

Artifacts:

* `playwright-report-real` (HTML report)
* `test-results-real` (screenshots/videos/traces)

---

## Known limitations

* **Show Completed** is currently a known frontend limitation:

  * Completion state isn’t persisted to the backend
  * The home list isn’t filtered by `showCompleted` yet
* Because of that, `home-filters.spec.ts` includes a **mock-only** test marked as an expected failure (`test.fail(...)`) and it’s skipped in real mode.

