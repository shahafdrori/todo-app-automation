// tests/mocks/tasksApiMock.ts
import type { Page, Route } from "@playwright/test";

type AnyTask = Record<string, any>;

function makeId() {
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function lastPathSegment(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts.at(-1) ?? null;
  } catch {
    return null;
  }
}

export async function attachTasksApiMock(page: Page) {
  const ctx = page.context();
  const tasks: AnyTask[] = [];

  // GET /tasks/all
  await ctx.route("**/tasks/all**", async (route: Route) => {
    if (route.request().method() !== "GET") return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tasks),
    });
  });

  // POST /tasks/add
  await ctx.route("**/tasks/add**", async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();

    let body: any = {};
    try {
      body = route.request().postDataJSON();
    } catch {}

    const created = { ...body, _id: body?._id ?? makeId() };
    tasks.push(created);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(created),
    });
  });

  // PUT /tasks/update/:id
  await ctx.route("**/tasks/update/**", async (route: Route) => {
    if (route.request().method() !== "PUT") return route.fallback();

    const id = lastPathSegment(route.request().url());
    if (!id) return route.fulfill({ status: 400, body: "Missing id" });

    let patch: any = {};
    try {
      patch = route.request().postDataJSON();
    } catch {}

    const idx = tasks.findIndex((t) => String(t._id) === String(id));
    if (idx === -1) return route.fulfill({ status: 404, body: "Not found" });

    tasks[idx] = { ...tasks[idx], ...patch, _id: tasks[idx]._id };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(tasks[idx]),
    });
  });

  // DELETE /tasks/delete/:id
  await ctx.route("**/tasks/delete/**", async (route: Route) => {
    if (route.request().method() !== "DELETE") return route.fallback();

    const id = lastPathSegment(route.request().url());
    if (!id) return route.fulfill({ status: 400, body: "Missing id" });

    const idx = tasks.findIndex((t) => String(t._id) === String(id));
    if (idx === -1) return route.fulfill({ status: 404, body: "Not found" });

    const [deleted] = tasks.splice(idx, 1);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, deletedId: deleted._id }),
    });
  });

  // DELETE /tasks/deleteAll
  await ctx.route("**/tasks/deleteAll**", async (route: Route) => {
    if (route.request().method() !== "DELETE") return route.fallback();

    const deletedCount = tasks.length;
    tasks.length = 0;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, deletedCount }),
    });
  });
}
