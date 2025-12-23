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

        const originalFetch = window.fetch.bind(window);
        window.fetch = (input: any, init?: any) => {
          if (typeof input === "string") {
            return originalFetch(rewriteUrl(input), init);
          }
          return originalFetch(input, init);
        };

        const OriginalXHR = window.XMLHttpRequest;

        function PatchedXHR(this: XMLHttpRequest) {
          const xhr = new OriginalXHR();
          const originalOpen = xhr.open;

          xhr.open = function (this: XMLHttpRequest, method: any, url: any) {
            const rewrittenUrl = typeof url === "string" ? rewriteUrl(url) : url;

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

      const mock = await installTaskApiMock(context, { initialTasks: [] });
      console.log("[MOCK] Task API mock installed");
      await use(mock);
    },
    { auto: true },
  ],
});

export const expect = baseExpect;