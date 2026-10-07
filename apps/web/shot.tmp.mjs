import { chromium } from "@playwright/test";
const b = await chromium.launch();
const out = "/Users/ab/.copilot/session-state/1d022d2e-cc72-49bc-bcb1-1103fe8a4c71/files/";
for (const [loc, dark] of [["en", false], ["am", true]]) {
  const p = await b.newPage({ viewport: { width: 1360, height: 1000 }, colorScheme: dark ? "dark" : "light" });
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(`http://localhost:3000/${loc}/conferences`, { waitUntil: "load" });
  await p.waitForSelector('[data-testid="conference-row"]', { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: out + `conf-${loc}.png` });
  console.log(loc, "rows", await p.locator('[data-testid="conference-row"]').count(), "errors", errs.slice(0, 3));
  await p.click('[data-testid="filter-new"]');
  await p.waitForTimeout(500);
  console.log(loc, "new rows", await p.locator('[data-testid="conference-row"]').count());
  await p.locator('[data-testid="conference-row"] a').first().click();
  await p.waitForSelector('[data-testid="deadline-panel"]', { timeout: 20000 });
  await p.waitForTimeout(800);
  await p.screenshot({ path: out + `conf-detail-${loc}.png`, fullPage: true });
  console.log(loc, "detail", p.url(), await p.locator('[data-testid="auto-collected"]').count());
  await p.close();
}
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto("http://localhost:3000/en/conferences", { waitUntil: "load" });
await m.waitForSelector('[data-testid="conference-row"]');
await m.waitForTimeout(1200);
await m.screenshot({ path: out + "conf-mobile.png" });
await b.close();
