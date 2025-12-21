// tests/mocks/tasksApiMock.ts
import type { Page, Route } from "@playwright/test";

type AnyTask = Record<string, any>;

function makeId() {
  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
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

  const handleOptions = async (route: Route) => {
    if (route.request().method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: corsHeaders() });
    }
    return null;
  };

  // GET /tasks/all (allow query params)
  await ctx.route("**/tasks/all**", async (route: Route) => {
    const opt = await handleOptions(route);
    if (opt) return;

    if (route.request().method() !== "GET") return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders(),
      body: JSON.stringify(tasks),
    });
  });

  // POST /tasks/add (allow query params)
  await ctx.route("**/tasks/add**", async (route: Route) => {
    const opt = await handleOptions(route);
    if (opt) return;

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
      headers: corsHeaders(),
      body: JSON.stringify(created),
    });
  });

  // DELETE /tasks/deleteAll (register BEFORE delete/*)
  await ctx.route("**/tasks/deleteAll**", async (route: Route) => {
    const opt = await handleOptions(route);
    if (opt) return;

    if (route.request().method() !== "DELETE") return route.fallback();

    const deletedCount = tasks.length;
    tasks.length = 0;

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true, deletedCount }),
    });
  });

  // PUT /tasks/update/:id
  await ctx.route("**/tasks/update/**", async (route: Route) => {
    const opt = await handleOptions(route);
    if (opt) return;

    if (route.request().method() !== "PUT") return route.fallback();

    const id = lastPathSegment(route.request().url());
    if (!id) {
      return route.fulfill({ status: 400, headers: corsHeaders(), body: "Missing id" });
    }

    let patch: any = {};
    try {
      patch = route.request().postDataJSON();
    } catch {}

    const idx = tasks.findIndex((t) => String(t._id) === String(id));
    if (idx === -1) {
      return route.fulfill({ status: 404, headers: corsHeaders(), body: "Not found" });
    }

    tasks[idx] = { ...tasks[idx], ...patch, _id: tasks[idx]._id };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders(),
      body: JSON.stringify(tasks[idx]),
    });
  });

  // DELETE /tasks/delete/:id
  await ctx.route("**/tasks/delete/**", async (route: Route) => {
    const opt = await handleOptions(route);
    if (opt) return;

    if (route.request().method() !== "DELETE") return route.fallback();

    const id = lastPathSegment(route.request().url());
    if (!id) {
      return route.fulfill({ status: 400, headers: corsHeaders(), body: "Missing id" });
    }

    const idx = tasks.findIndex((t) => String(t._id) === String(id));
    if (idx === -1) {
      return route.fulfill({ status: 404, headers: corsHeaders(), body: "Not found" });
    }

    const [deleted] = tasks.splice(idx, 1);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: corsHeaders(),
      body: JSON.stringify({ ok: true, deletedId: deleted._id }),
    });
  });
}
