// tests/data/testIds.ts
/**
 * Central registry for stable UI test IDs (data-test).
 *
 * Works with Playwright config:
 *   use: { testIdAttribute: "data-test" }
 *
 * Benefits:
 * - Consistent selectors across specs/pages
 * - Single source of truth for UI test IDs
 * - Easier refactors and maintenance
 */
export const TEST_IDS = {
  nav: {
    home: "nav-home",
    admin: "nav-admin",
    map: "nav-map",
  },
  buttons: {
    addTask: "add-task-button",
    clearAll: "clear-all-button",
    submit: "submit-button",
    cancel: "cancel-button",
  },
  map: {
    taskMap: "task-map",
    lngInput: "lng-input",
    latInput: "lat-input",
  },
} as const;

export type TestIds = typeof TEST_IDS;
