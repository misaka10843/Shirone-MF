import { expect, test } from "@playwright/test";

test("desktop navigation supports native disclosure, keyboard focus and Escape", async ({ page }) => {
	await page.goto("/");
	const disclosure = page.locator("#navbar [data-nav-disclosure]").first();
	test.skip(!(await disclosure.count()), "This site has no navigation groups");
	const summary = disclosure.locator("summary");
	await summary.focus();
	await page.keyboard.press("ArrowDown");
	await expect(disclosure).toHaveAttribute("open", "");
	await expect(disclosure.locator("a").first()).toBeFocused();
	await page.keyboard.press("Escape");
	await expect(disclosure).not.toHaveAttribute("open");
	await expect(summary).toBeFocused();
	await summary.click();
	await expect(disclosure).toHaveAttribute("open", "");
	await page.locator("main").click({ position: { x: 10, y: 10 } });
	await expect(disclosure).not.toHaveAttribute("open");
});

test("navigation groups work without JavaScript and icons are SSR SVG", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto("http://localhost:4321/", { waitUntil: "domcontentloaded" });
	const disclosure = page.locator("#navbar [data-nav-disclosure]").first();
	if (await disclosure.count()) {
		await disclosure.locator("summary").click();
		await expect(disclosure.locator("a").first()).toBeVisible();
		await expect(disclosure.locator("summary svg").first()).toBeVisible();
	}
	await context.close();
});

test("parent group stays active after client navigation and returning home", async ({ page }) => {
	await page.goto("/");
	const group = page.locator("[data-nav-group]").filter({ has: page.locator('a[href="/about/"]') });
	test.skip(!(await group.locator("summary").count()), "About is not in a navigation group");
	await group.locator("summary").click();
	await group.locator('a[href="/about/"]').click();
	await page.waitForURL("**/about/");
	await expect(group.locator("summary")).toHaveClass(/top-app-bar__nav-link--active/);
	await expect(group.locator("details")).not.toHaveAttribute("open");
	await page.locator('#navbar a[href="/"]').first().click();
	await page.waitForURL("http://localhost:4321/");
	await expect(group.locator("summary")).not.toHaveClass(/top-app-bar__nav-link--active/);
});
