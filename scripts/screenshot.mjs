import { chromium } from "playwright";
import { mkdirSync } from "fs";

const OUT_DIR = "/tmp/claude-0/-home-user-apptravelbuilder/5abd2944-02b3-5eb0-9a14-f390a7c673e1/scratchpad/screenshots";
mkdirSync(OUT_DIR, { recursive: true });

const BASE = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({
    executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  // Login
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/01-login.png` });

  await page.fill("#email", "agent@travelbuilder.demo");
  await page.fill("#password", "travelbuilder123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await page.waitForSelector("text=Create New Trip", { timeout: 15000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT_DIR}/02-dashboard.png`, fullPage: true });

  // Trips list
  await page.goto(`${BASE}/trips`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/03-trips-list.png`, fullPage: true });

  // Trip detail workspace - Costs & Pricing tab
  await page.goto(`${BASE}/trips/demo-trip-sarah-kl`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/04-trip-workspace-costs.png`, fullPage: true });

  // Scenarios tab
  await page.click('button[role="tab"]:has-text("Scenarios")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/05-trip-scenarios.png`, fullPage: true });

  // AI Copilot tab
  await page.click('button[role="tab"]:has-text("AI Copilot")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/06-ai-copilot.png`, fullPage: true });

  // Quotation tab
  await page.click('button[role="tab"]:has-text("Quotation")');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT_DIR}/07-quotation-tab.png`, fullPage: true });

  // Trip creation wizard
  await page.goto(`${BASE}/trips/new`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/08-trip-wizard-customer.png`, fullPage: true });

  // Customers page
  await page.goto(`${BASE}/customers`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/09-customers.png`, fullPage: true });

  // Templates page
  await page.goto(`${BASE}/templates`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/10-templates.png`, fullPage: true });

  // Cost database
  await page.goto(`${BASE}/cost-database`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/11-cost-database.png`, fullPage: true });

  // Quotation preview page - find a quotation id first
  await page.goto(`${BASE}/quotations`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/12-quotations-list.png`, fullPage: true });
  const firstLink = await page.locator('a[href^="/quotations/"]').first();
  if (await firstLink.count() > 0) {
    const href = await firstLink.getAttribute("href");
    await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
    await page.screenshot({ path: `${OUT_DIR}/13-quotation-preview.png`, fullPage: true });
  }

  // Settings
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/14-settings.png`, fullPage: true });

  await browser.close();
  console.log("Done. Screenshots saved to", OUT_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
