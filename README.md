# Todo App Automation

End-to-end UI test project for a Todo application using **Playwright + TypeScript**.

Built as a **portfolio-grade** E2E suite with an emphasis on **cross-browser reliability** (Chromium/Firefox/WebKit) and **CI stability**:
- **Sharding** for faster CI runs
- **Blob reports + merged HTML report** for a single CI artifact
- **Optional in-memory Tasks API mock** (`MOCK_API=true`) for deterministic tests
- **Page Object Model + reusable helpers** for maintainable test code

---

## Tech stack

- Playwright Test Runner
- TypeScript
- Page Object Model (POM)
- GitHub Actions CI (browser matrix + sharding + merged report)
- Optional in-memory Tasks API mock (`MOCK_API=true`)
- dotenv for local config (`.env`)

---

## What’s covered by the tests

UI flows:
- Navigation between tabs (Home/Admin/Map)
- Create a task from **Home** and validate it appears in the **Admin** table
- Create a task from **Admin** and validate it appears in the **Admin** table
- Task dialog behavior: fill + cancel, submit, coordinates fields
- Table assertions via a generic `TableHelper` (headers, row search, per-cell validation)

Map interactions:
- Double-click selects a location and fills longitude/latitude inputs
- Marker moves accordingly
- Pan & zoom:
  - Mouse wheel zoom on Map tab
  - Zoom buttons in the dialog map
- Zoom level is validated via OpenLayers debug hooks (`__OL_DEBUG__`)

---

## Project structure

- `.github/workflows/playwright.yml` – CI pipeline (3 browsers × 3 shards, blob report upload, merged HTML report)
- `playwright.config.ts` – Playwright configuration (baseURL, retries, reporters, browser projects)
- `tests/specs/` – test specs
- `tests/pages/` – page objects (POM)
- `tests/components/` – UI components (NavBar)
- `tests/helpers/` – reusable helpers (FormFields, TableHelper, map helpers, Buttons)
- `tests/data/` – test data builders/utilities (unique task builder, date helpers)
- `tests/mocks/` – in-memory mock for Tasks API
- `tests/fixtures/` – fixtures (auto-installs mock when enabled)

---

## Requirements

- Node.js **18+** (CI uses Node 20)
- Install dependencies:

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
- `BASE_URL` – where the UI is running  
  If not set, Playwright uses: `http://localhost:5173`
- `MOCK_API` – enable/disable the in-memory Tasks API mock  
  `true` = mock mode (deterministic)  
  `false` = real backend mode (requires backend + DB)

Example `.env`:

```ini
BASE_URL=http://localhost:5173
MOCK_API=true
```

Example `.env.example` (committed):

```ini
BASE_URL=
MOCK_API=
```
---

## Running tests locally

### Mock mode (recommended)

Runs deterministically without a real backend or database:

```bash
npm run test:mock
```

### Real backend mode (intended for local runs)

Runs against a real backend and database.  
Use this only when the backend is running and the frontend is configured to point to it:

```bash
npm run test:real
```

### Helpful local commands

Run tests in headed mode:
```bash
npm run test:mock:headed
# or
npm run test:real:headed
```

Run tests in debug mode:
```bash
npm run test:mock:debug
# or
npm run test:real:debug
```

Retry locally to reproduce flakiness:
```bash
npm run test:mock:flaky
```

Open the last HTML report:
```bash
npm run report
```

---

## How the API mock works (MOCK_API)

When `MOCK_API=true`, tests install a **browser-context** route mock (`context.route`) that intercepts Tasks API requests and serves responses from an in-memory state.

The following endpoints are handled fully in memory:
- `GET /tasks/all`
- `POST /tasks/add`
- `PUT /tasks/update/:id`
- `DELETE /tasks/delete/:id`
- `DELETE /tasks/deleteAll`

This removes any dependency on an external backend or database while still exercising the complete UI flow end-to-end.

The mock is enabled automatically via a Playwright fixture, so individual tests do not need to handle setup or teardown logic.

---

## WebKit reliability fix

Some deployments contain hardcoded backend URLs such as:

`http://localhost:3000/...`

WebKit is stricter about cross-origin and CORS behavior, which can lead to CI-only failures.

To keep tests stable, the fixture injects an init script that rewrites:

`http://localhost:3000/...` → `window.location.origin/...`

This ensures consistent behavior across:
- Local development
- Deployed UI (Vercel)
- GitHub Actions CI
- WebKit browser runs

---

## CI pipeline (GitHub Actions)

Workflow file: `.github/workflows/playwright.yml`

CI behavior:
- Browsers: Chromium, Firefox, WebKit
- Sharding: 3 shards per browser (total **9** parallel E2E jobs)
- Execution environment: Playwright Docker image  
  `mcr.microsoft.com/playwright:v1.56.1-jammy`
- Default mode: mock mode (`MOCK_API=true`)
- Target UI: deployed frontend  
  `https://todolisthafifa-frontend.vercel.app`

CI reports:
- Each shard uploads:
  - `blob-report` (used for merging)
  - `test-results` (screenshots, videos, traces on failure)
- A dedicated merge job produces a single downloadable HTML report artifact:
  - `playwright-report`

---

## Notes

- `testIdAttribute` is set to `data-test`, keeping selectors stable and readable.
- CI retries are enabled (`retries: 2`) and workers are limited (`workers: 1`) to reduce flakiness and resource contention.
- Designed to reflect real-world E2E patterns (POM, stable selectors, CI sharding + merged reports).
