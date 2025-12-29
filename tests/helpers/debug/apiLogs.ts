// tests/helpers/debug/apiLogs.ts
import type { Page, Request, Response } from "@playwright/test";
import { API_ROUTES, urlIncludesAny } from "../../data/apiRoutes";

type Options = {
  enabled?: boolean;
  logResponseBody?: boolean;
};

export function attachApiLogs(page: Page, options: Options = {}): void {
  const enabled =
    options.enabled ?? String(process.env.API_LOGS).toLowerCase() === "true";
  if (!enabled) return;

  const flag = "__apiLogsAttached__";
  if ((page as any)[flag]) return;
  (page as any)[flag] = true;

  const isRelevant = (url: string) =>
    urlIncludesAny(url, API_ROUTES.tasks.all) ||
    urlIncludesAny(url, API_ROUTES.tasks.add) ||
    urlIncludesAny(url, API_ROUTES.tasks.deleteAll) ||
    urlIncludesAny(url, API_ROUTES.tasks.updatePrefix) ||
    urlIncludesAny(url, API_ROUTES.tasks.deletePrefix);

  page.on("request", (req: Request) => {
    const url = req.url();
    if (!isRelevant(url)) return;

    const method = req.method().toUpperCase();
    console.log(`[REQ] ${method} ${url}`);

    if (method === "POST" || method === "PUT") {
      try {
        const json = req.postDataJSON();
        console.log("[REQ BODY]", JSON.stringify(json, null, 2));
      } catch {
        const raw = req.postData();
        if (raw) console.log("[REQ BODY RAW]", raw);
      }
    }
  });

  page.on("response", async (res: Response) => {
    const url = res.url();
    if (!isRelevant(url)) return;

    console.log(`[RES] ${res.status()} ${res.request().method()} ${url}`);

    if (!options.logResponseBody) return;

    try {
      const ct = res.headers()["content-type"] || "";
      if (ct.includes("application/json")) {
        const body = await res.json();
        console.log("[RES JSON]", JSON.stringify(body, null, 2));
      }
    } catch (e) {
      console.log("[RES READ ERROR]", String(e));
    }
  });

  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!isRelevant(url)) return;

    console.log(
      `[REQ FAIL] ${req.method()} ${url} -> ${req.failure()?.errorText ?? "unknown"}`
    );
  });

  page.on("pageerror", (err) => {
    console.log("[PAGE ERROR]", err.message);
  });
}
