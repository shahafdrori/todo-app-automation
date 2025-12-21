//tests/mocks/tasksApi.ts
import type { Page, Route } from "@playwright/test";

type TaskPayload = {
  name: string;
  subject: string;
  priority: number;
  date?: string;
  coordinates?: { longitude: number; latitude: number };
};

type Task = Required<Omit<TaskPayload, "coordinates" | "date">> & {
  _id: string;
  completed: boolean;
  date: string;
  coordinates: { longitude: number; latitude: number };
};

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function json(route: Route, status: number, body: any) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers: corsHeaders(),
    body: JSON.stringify(body),
  });
}

function ok(route: Route, status = 200) {
  return route.fulfill({ status, headers: corsHeaders() });
}

export async function mockTasksApi(page: Page) {
  const tasks: Task[] = [];

  await page.route("**/tasks/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();

    // handle CORS preflight
    if (method === "OPTIONS") return ok(route, 204);

    // GET /tasks/all
    if (method === "GET" && url.pathname.endsWith("/tasks/all")) {
      return json(route, 200, tasks);
    }

    // POST /tasks/add
    if (method === "POST" && url.pathname.endsWith("/tasks/add")) {
      let payload: TaskPayload;
      try {
        payload = req.postDataJSON() as TaskPayload;
      } catch {
        payload = {} as any;
      }

      const created: Task = {
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        completed: false,
        name: payload.name ?? "mock-task",
        subject: payload.subject ?? "OCP",
        priority: Number(payload.priority ?? 3),
        date: payload.date ?? new Date().toISOString(),
        coordinates: payload.coordinates ?? { longitude: 34.8, latitude: 32.08 },
      };

      tasks.push(created);
      return json(route, 200, created);
    }

    if (method === "DELETE" && url.pathname.endsWith("/tasks/deleteAll")) {
      tasks.length = 0;
      return json(route, 200, { ok: true });
    }

    if (method === "PUT" && url.pathname.includes("/tasks/update/")) {
      const id = url.pathname.split("/").pop()!;
      let payload: TaskPayload;
      try {
        payload = req.postDataJSON() as TaskPayload;
      } catch {
        payload = {} as any;
      }

      const idx = tasks.findIndex((t) => t._id === id);
      if (idx === -1) return json(route, 404, { error: "not found" });

      tasks[idx] = {
        ...tasks[idx],
        ...payload,
        coordinates: payload.coordinates ?? tasks[idx].coordinates,
        date: payload.date ?? tasks[idx].date,
      } as Task;

      return json(route, 200, tasks[idx]);
    }

    // DELETE /tasks/delete/:id
    if (method === "DELETE" && url.pathname.includes("/tasks/delete/")) {
      const id = url.pathname.split("/").pop()!;
      const idx = tasks.findIndex((t) => t._id === id);
      if (idx !== -1) tasks.splice(idx, 1);
      return json(route, 200, { ok: true });
    }

    return json(route, 501, {
      error: "Unmocked tasks endpoint",
      method,
      url: req.url(),
    });
  });
}
