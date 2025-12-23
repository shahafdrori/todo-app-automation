//tests/specs/home.spec.ts
import { test } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";

test("navigate between tabs", async ({ page }) => {
  await page.goto("/");
  const nav = new NavBar(page);

  await nav.navigateToTab("admin");
  await nav.navigateToTab("map");
  await nav.navigateToTab("home");
});
