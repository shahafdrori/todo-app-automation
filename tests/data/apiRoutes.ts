// tests/data/apiRoutes.ts
/**
 * Central place for API route matching used in waits + mocks.
 * Keep these stable so refactors don't require editing many files.
 */
export const API_ROUTES = {
  tasks: {
    all: ["/tasks/all", "/api/tasks/all"] as const,
    add: ["/tasks/add", "/api/tasks/add"] as const,
    updatePrefix: ["/tasks/update/", "/api/tasks/update/"] as const,
    deletePrefix: ["/tasks/delete/", "/api/tasks/delete/"] as const,
    deleteAll: ["/tasks/deleteAll", "/api/tasks/deleteAll"] as const,
  },
} as const;

type Strings = readonly string[];

export function urlIncludesAny(url: string, parts: Strings): boolean {
  return parts.some((p) => url.includes(p));
}

export function pathEndsWithAny(path: string, suffixes: Strings): boolean {
  return suffixes.some((s) => path.endsWith(s));
}

export function pathIncludesAny(path: string, parts: Strings): boolean {
  return parts.some((p) => path.includes(p));
}
