// tests/data/testIds.ts
export const TEST_IDS = {
  nav: {
    home: "nav-home",
    admin: "nav-admin",
    map: "nav-map",
  },
  buttons: {
    addTask: "add-task-button",
    clearAll: "clear-all-button",
    showCompleted: "show-completed-button",
    submit: "submit-button",
    cancel: "cancel-button",
  },
  inputs: {
    search: "search-input",
  },
  map: {
    taskMap: "task-map",
    lngInput: "lng-input",
    latInput: "lat-input",
  },

  taskCard: {
    list: "home-task-list",
    root: "task-card",
    checkbox: "task-checkbox",
    name: "task-name",
    meta: "task-meta",
    delete: "task-delete",
    edit: "task-edit",
    location: "task-location",
  },

  dialogs: {
    taskLocation: "task-location-dialog",
  },
} as const;

export type TestIds = typeof TEST_IDS;
