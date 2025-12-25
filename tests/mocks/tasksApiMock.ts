// tests/mocks/tasksApiMock.ts
import type { BrowserContext, Route, Request } from "@playwright/test";
import {
  API_ROUTES,
  pathEndsWithAny,
  pathIncludesAny,
} from "../data/apiRoutes";

export type Task = {
  _id: string;
  name: string;
  subject: string;
  priority: number;
  date: string;
  coordinates: { latitude: number; longitude: number };
};

type State = {
  tasks: Task[];
};

const makeId = () =>
  `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const withCorsHeaders = () => ({
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
});

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
    headers: withCorsHeaders(),
  });

const noContent = (route: Route, status = 204) =>
  route.fulfill({
    status,
    headers: withCorsHeaders(),
  });

async function readJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const raw = request.postData();
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeTask(input: any): Omit<Task, "_id"> {
  return {
    name: String(input?.name ?? ""),
    subject: String(input?.subject ?? ""),
    priority: Number(input?.priority ?? 0),
    date: String(input?.date ?? ""),
    coordinates: {
      latitude: Number(
        input?.coordinates?.latitude ?? input?.coordinates?.lat ?? 0
      ),
      longitude: Number(
        input?.coordinates?.longitude ?? input?.coordinates?.lng ?? 0
      ),
    },
  };
}

function isTasksApiPath(pathname: string): boolean {
  return pathname.includes("/tasks/") || pathname.includes("/api/tasks/");
}

/**
 * Install a fully in-memory mock for the Tasks API.
 * IMPORTANT: uses context.route (not page.route) which is more stable on CI/WebKit.
 */
export async function installTaskApiMock(
  context: BrowserContext,
  options?: {
    initialTasks?: Task[];
    enabled?: boolean;
  }
): Promise<{ reset: (tasks?: Task[]) => void }> {
  const enabled =
    options?.enabled ?? String(process.env.MOCK_API).toLowerCase() === "true";

  const state: State = {
    tasks: (options?.initialTasks ?? []).map((t) => ({ ...t })),
  };

  const reset = (tasks?: Task[]) => {
    state.tasks = (tasks ?? []).map((t) => ({ ...t }));
  };

  if (!enabled) return { reset };

  // Intercept only URLs that include "tasks" somewhere to reduce overhead/flakiness.
  await context.route("**/*tasks**", async (route) => {
    const request = route.request();
    const urlStr = request.url();

    let url: URL;
    try {
      url = new URL(urlStr);
    } catch {
      return route.fallback();
    }

    const path = url.pathname;
    const method = request.method().toUpperCase();

    // Only intercept real API calls, not SPA routes like "/tasks-map"
    if (!isTasksApiPath(path)) {
      return route.fallback();
    }

    // Allow preflight
    if (method === "OPTIONS") return noContent(route, 204);

    if (method === "GET" && pathEndsWithAny(path, API_ROUTES.tasks.all)) {
      return json(route, 200, state.tasks);
    }

    if (method === "POST" && pathEndsWithAny(path, API_ROUTES.tasks.add)) {
      const body = await readJsonBody<any>(request);
      const data = normalizeTask(body);
      const created: Task = { _id: makeId(), ...data };
      state.tasks.push(created);
      return json(route, 200, created);
    }

    if (method === "PUT" && pathIncludesAny(path, API_ROUTES.tasks.updatePrefix)) {
      const id =
        path.split(API_ROUTES.tasks.updatePrefix[0])[1] ??
        path.split(API_ROUTES.tasks.updatePrefix[1])[1] ??
        "";
      const body = await readJsonBody<any>(request);
      const data = normalizeTask(body);

      const idx = state.tasks.findIndex((t) => t._id === id);
      if (idx === -1) return json(route, 404, { error: "Task not found" });

      const updated: Task = { _id: id, ...data };
      state.tasks[idx] = updated;
      return json(route, 200, updated);
    }

    if (
      method === "DELETE" &&
      pathIncludesAny(path, API_ROUTES.tasks.deletePrefix)
    ) {
      const id =
        path.split(API_ROUTES.tasks.deletePrefix[0])[1] ??
        path.split(API_ROUTES.tasks.deletePrefix[1])[1] ??
        "";
      const before = state.tasks.length;
      state.tasks = state.tasks.filter((t) => t._id !== id);
      const deleted = before !== state.tasks.length;
      return json(route, deleted ? 200 : 404, { deleted });
    }

    if (method === "DELETE" && pathEndsWithAny(path, API_ROUTES.tasks.deleteAll)) {
      state.tasks = [];
      return json(route, 200, { deletedAll: true });
    }

    return json(route, 501, {
      error: "MOCK_API: unhandled endpoint",
      method,
      path,
    });
  });

  return { reset };
}