# Todo App Automation

End-to-end test project for a Todo application using Playwright and TypeScript.

## Tech stack

* Playwright Test Runner
* TypeScript
* Page Object Model structure

## Project structure

* `tests/specs` – test files
* `tests/pages` – page objects
* `tests/fixtures` – shared fixtures
* `tests/components` – reusable UI helpers (for example `NavBar`)
* `tests/utils` – helpers and test data

## Setup

```bash
npm install
```

## Running the tests locally

1. Start the frontend app (in the separate `todolisthafifa-frontend` repo):

   ```bash
   npm run dev
   # Vite serves the app on http://localhost:5173
   ```

2. In this automation repo, run:

   ```bash
   npm run test
   ```

By default Playwright uses:

```ts
baseURL: process.env.BASE_URL || 'http://localhost:5173';
```

So on your machine it will hit the local Vite server on port `5173` unless you override `BASE_URL`.

## CI and deployed environment

Playwright tests also run in GitHub Actions.
The workflow file `.github/workflows/playwright.yml` configures the job to use the deployed frontend on Vercel:

```yaml
jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    env:
      BASE_URL: https://todolisthafifa-frontend.vercel.app
```

This means:

* **Locally** – tests run against `http://localhost:5173` (Vite dev server).
* **In CI** – tests run against the live app at
  `https://todolisthafifa-frontend.vercel.app`.

Using `BASE_URL` keeps the same test suite working both on a local dev server and in a real deployed environment, and fixes the typical `net::ERR_CONNECTION_REFUSED` issue you get when CI tries to open `localhost` with no server running.
