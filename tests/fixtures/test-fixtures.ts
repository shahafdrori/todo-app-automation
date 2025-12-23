//tests/fixtures/test-fixtures.ts
import { test as base, expect as baseExpect } from "@playwright/test";
import { installTaskApiMock, type Task } from "../mocks/tasksApiMock";

type Fixtures = {
  mockTasks: {
    reset: (tasks?: Task[]) => void;
  };
};

export const test = base.extend<Fixtures>({
  mockTasks: [
    async ({ context }, use) => {
      // ✅ WebKit CI fix:
      // The deployed frontend sometimes calls http://localhost:3000/tasks/...
      // WebKit blocks that (security/access control checks), so NO request is sent,
      // and waitForRequest times out.
      //
      // Solution: rewrite localhost API calls to the current origin BEFORE the app runs.
      await context.addInitScript(() => {
        const FROM = "http://localhost:3000";

        const rewriteUrl = (url: string) => {
          try {
            if (typeof url === "string" && url.startsWith(FROM)) {
              return url.replace(FROM, window.location.origin);
            }
          } catch {
            // ignore
          }
          return url;
        };

        // Patch fetch(url, ...)
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input: any, init?: any) => {
          if (typeof input === "string") {
            return originalFetch(rewriteUrl(input), init);
          }
          // If some library passes a Request object, we leave it untouched.
          // (Most apps use string URLs.)
          return originalFetch(input, init);
        };

        // Patch XMLHttpRequest.open(method, url, ...)
        const OriginalXHR = window.XMLHttpRequest;

        function PatchedXHR(this: XMLHttpRequest) {
          const xhr = new OriginalXHR();
          const originalOpen = xhr.open;

          xhr.open = function (this: XMLHttpRequest, method: any, url: any) {
            const rewrittenUrl =
              typeof url === "string" ? rewriteUrl(url) : url;

            // Use "arguments" to avoid TS spread issues with XHR.open typing
            return (originalOpen as any).apply(this, [
              method,
              rewrittenUrl,
              ...Array.prototype.slice.call(arguments, 2),
            ]);
          } as any;

          return xhr as any;
        }

        (PatchedXHR as any).prototype = OriginalXHR.prototype;
        (window as any).XMLHttpRequest = PatchedXHR as any;
      });

      // ✅ Your API mock (in-memory)
      const mock = await installTaskApiMock(context, { initialTasks: [] });
      await use(mock);
    },
    { auto: true },
  ],
});

export const expect = baseExpect;
