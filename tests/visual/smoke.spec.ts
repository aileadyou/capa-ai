import { expect, test } from "@playwright/test";

async function authenticate(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "capa-ai-auth",
      JSON.stringify({ state: { isLoggedIn: true }, version: 0 }),
    );
    window.localStorage.setItem(
      "ai-coach-nova-persona",
      JSON.stringify({ state: { activePersonaId: "qa_deviation" }, version: 0 }),
    );
  });
}

async function settleMotion(page: import("@playwright/test").Page) {
  await page.waitForTimeout(750);
}

test.beforeEach(async ({ page }) => {
  await authenticate(page);
});

test("dashboard shell renders across breakpoints", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();
  await settleMotion(page);

  const isMobile = testInfo.project.name.includes("mobile");
  if (isMobile) {
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  } else {
    await expect(page.getByRole("link", { name: /Dashboard/ })).toBeVisible();
  }

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`dashboard-${testInfo.project.name}.png`),
  });
});

test("capa detail renders without layout crash", async ({ page }, testInfo) => {
  await page.goto("/capa/CAPA-2026-0341");
  await expect(page.getByText("CAPA-2026-0341").first()).toBeVisible();
  await expect(page.getByText("8D Progress").first()).toBeVisible();
  await settleMotion(page);

  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`capa-detail-${testInfo.project.name}.png`),
  });
});

test("list filters and table headers render consistently", async ({ page }, testInfo) => {
  await page.goto("/capa");
  await expect(page.getByRole("heading", { name: "CAPA list", level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder("Search CAPA, finding, title, or department")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "CAPA" })).toBeVisible();
  await settleMotion(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`capa-list-${testInfo.project.name}.png`),
  });

  await page.goto("/findings");
  await expect(page.getByRole("heading", { name: "Findings", level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder("Search finding, description, source, department…")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "ID / Source" })).toBeVisible();
  await settleMotion(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`findings-list-${testInfo.project.name}.png`),
  });
});

test("shared filter controls render on analysis pages", async ({ page }, testInfo) => {
  await page.goto("/similarity");
  await expect(page.getByRole("heading", { name: "Similarity explorer", level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder("Describe a finding to search for similar historical CAPAs")).toBeVisible();
  await expect(page.getByLabel("Filter by outcome")).toBeVisible();
  await settleMotion(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`similarity-${testInfo.project.name}.png`),
  });

  await page.goto("/actions/corrective");
  await expect(page.getByRole("heading", { name: "Corrective Action List", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Search corrective actions")).toBeVisible();
  await expect(page.getByLabel("Filter by status")).toBeVisible();
  await settleMotion(page);
  await page.screenshot({
    fullPage: true,
    path: testInfo.outputPath(`corrective-actions-${testInfo.project.name}.png`),
  });
});
