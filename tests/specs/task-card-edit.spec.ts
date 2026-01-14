// tests/specs/task-card-edit.spec.ts
import { test, expect } from "../fixtures/test-fixtures";
import { NavBar } from "../components/navBar";
import { HomePage } from "../pages/HomePage";
import { AdminTablePage } from "../pages/AdminTablePage";
import { HomeTaskList } from "../pages/HomeTaskList";
import { AddTaskDialog } from "../pages/AddTaskDialog";
import { MapPage } from "../pages/MapPage";
import { buildUniqueTask } from "../data/taskData";
import { createTaskFromHome } from "../helpers/flows/taskFlows";

const isMock = () => String(process.env.MOCK_API).toLowerCase() === "true";

test(
  "task card edit updates task in home + admin (prefill + update fields + reload) (mock + real)",
  async ({ page, mockTasks }, testInfo) => {
    testInfo.setTimeout(150_000);

    await page.goto("/");

    const navBar = new NavBar(page);
    const home = new HomePage(page);
    const admin = new AdminTablePage(page);
    const list = new HomeTaskList(page);

    // Arrange: existing task
    const original = buildUniqueTask("EditMe");
    let originalCoords = { longitude: 34.78, latitude: 32.08 };

    if (isMock()) {
      mockTasks.reset([
        {
          _id: "e1",
          name: original.name,
          subject: original.subject,
          priority: original.priority,
          date: original.date,
          completed: false,
          coordinates: {
            longitude: originalCoords.longitude,
            latitude: originalCoords.latitude,
          },
        },
      ]);
    } else {
      originalCoords = await createTaskFromHome(page, navBar, original);
    }

    await home.goto(navBar);
    await list.waitForTaskVisible(original.name);

    // Act: click edit
    await list.clickEdit(original.name);

    const dialog = new AddTaskDialog(page);
    await dialog.expectOpen();

    // Assert prefill (stable fields)
    const nameInput = await dialog.form.getFieldByPath("name");
    await expect(nameInput).toHaveValue(original.name);

    const priorityInput = await dialog.form.getFieldByPath("priority");
    await expect(priorityInput).toHaveValue(String(original.priority));

    const { lng, lat } = await dialog.readCoordinates();
    expect(Number(lng)).toBeCloseTo(originalCoords.longitude, 4);
    expect(Number(lat)).toBeCloseTo(originalCoords.latitude, 4);

    // Update: IMPORTANT - new name must NOT contain the old name (substring),
    // otherwise waitForTaskGone(original.name) will fail if itemByName uses "contains".
    const updatedName = buildUniqueTask("Edited").name;

    const updated = {
      ...original,
      name: updatedName,
      priority: original.priority === 4 ? 3 : 4,
      subject: original.subject,
      date: original.date,
    };

    await dialog.fillBasicFields(updated);

    const map = new MapPage(page);
    await map.expectMapVisible();
    const newCoords = await map.clickRandomAndReadCoordinates();

    const { status } = await dialog.submitAndWaitForUpdate(60_000);
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(300);

    await dialog.ensureClosed();

    // Home asserts
    await list.waitForTaskVisible(updated.name);
    await list.waitForTaskGone(original.name);

    const subject = await list.readSubject(updated.name);
    const priority = await list.readPriority(updated.name);
    expect(subject).toBe(updated.subject);
    expect(priority).toBe(updated.priority);

    const coords = await list.readCoords(updated.name);
    expect(coords).not.toBeNull();
    expect(coords!.longitude).toBeCloseTo(newCoords.longitude, 4);
    expect(coords!.latitude).toBeCloseTo(newCoords.latitude, 4);

    // Admin asserts
    await admin.goto(navBar);
    await admin.expectTaskInTable({
      name: updated.name,
      subject: updated.subject,
      priority: updated.priority,
    });
    await admin.expectTaskCoordinatesClose(
      updated.name,
      newCoords.longitude,
      newCoords.latitude,
      4
    );
    await admin.waitForTaskNotInTable(original.name, 20_000);

    // Reload variation
    await home.goto(navBar);
    await page.reload();
    await home.expectLoaded();

    await list.waitForTaskVisible(updated.name);
    const coordsAfterReload = await list.readCoords(updated.name);
    expect(coordsAfterReload).not.toBeNull();
    expect(coordsAfterReload!.longitude).toBeCloseTo(newCoords.longitude, 4);
    expect(coordsAfterReload!.latitude).toBeCloseTo(newCoords.latitude, 4);

    await admin.goto(navBar);
    await admin.expectTaskInTable({
      name: updated.name,
      subject: updated.subject,
      priority: updated.priority,
    });
  }
);
