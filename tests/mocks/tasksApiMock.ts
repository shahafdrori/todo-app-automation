//tests/mocks/tasksApiMock.ts
import type { BrowserContext, Route, Request } from "@playwright/test";

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

const makeId = () => `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
      latitude: Number(input?.coordinates?.latitude ?? input?.coordinates?.lat ?? 0),
      longitude: Number(input?.coordinates?.longitude ?? input?.coordinates?.lng ?? 0),
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

  await context.route("**/*", async (route) => {
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

    const is = (suffix: string) => path.endsWith(suffix);

    if (method === "GET" && (is("/tasks/all") || is("/api/tasks/all"))) {
      return json(route, 200, state.tasks);
    }

    if (method === "POST" && (is("/tasks/add") || is("/api/tasks/add"))) {
      const body = await readJsonBody<any>(request);
      const data = normalizeTask(body);
      const created: Task = { _id: makeId(), ...data };
      state.tasks.push(created);
      return json(route, 200, created);
    }

    if (
      method === "PUT" &&
      (path.includes("/tasks/update/") || path.includes("/api/tasks/update/"))
    ) {
      const id =
        path.split("/tasks/update/")[1] ??
        path.split("/api/tasks/update/")[1] ??
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
      (path.includes("/tasks/delete/") || path.includes("/api/tasks/delete/"))
    ) {
      const id =
        path.split("/tasks/delete/")[1] ??
        path.split("/api/tasks/delete/")[1] ??
        "";
      const before = state.tasks.length;
      state.tasks = state.tasks.filter((t) => t._id !== id);
      const deleted = before !== state.tasks.length;
      return json(route, deleted ? 200 : 404, { deleted });
    }

    if (method === "DELETE" && (is("/tasks/deleteAll") || is("/api/tasks/deleteAll"))) {
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
