import { test, expect } from '../fixtures/test-fixtures';
import { NavBar } from "../components/NavBar";

test("navigate between tabs", async ({ page }) => {
  const navBar = new NavBar(page);

  await navBar.navigateToTab("home");
  await navBar.navigateToTab("admin");
  await navBar.navigateToTab("map");
});