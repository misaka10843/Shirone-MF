import { expect, test } from "@playwright/test";

test("about content is available without JavaScript", async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto("http://localhost:4321/about/");
	const profile = page.locator("[data-about-profile]");
	if (await profile.count()) {
		await expect(profile.locator("h1")).not.toBeEmpty();
		await expect(page.locator("main")).toHaveAttribute(
			"data-current-page",
			"about",
		);
		for (const section of await profile.locator(".profile-section").all()) {
			await expect(section.locator("h2")).not.toBeEmpty();
		}
	} else {
		await expect(page.locator(".custom-md")).not.toBeEmpty();
	}
	await context.close();
});

test("about page fits a phone viewport", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/about/");
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth + 1,
			),
		)
		.toBe(true);
});

test("profile keeps the shared shell after client navigation", async ({
	page,
}) => {
	await page.goto("/");
	await page.waitForFunction(() =>
		Boolean((window as unknown as { swup?: unknown }).swup),
	);
	await page.evaluate(() => {
		document.documentElement.dataset.aboutNavigationProbe = "retained";
	});
	const group = page.locator("[data-nav-group]").filter({ has: page.locator('a[href="/about/"]') });
	if (await group.locator("summary").count()) await group.locator("summary").click();
	await page.locator('a[href="/about/"]:visible').first().click();
	await page.waitForURL("**/about/");
	await expect(page.locator("#sidebar")).toBeVisible();
	await page.locator('a[href="/"]:visible').first().click();
	await page.waitForURL("http://localhost:4321/");
	await expect(page.locator("main")).toHaveAttribute(
		"data-current-page",
		"home",
	);
	await expect(page.locator("html")).toHaveAttribute(
		"data-about-navigation-probe",
		"retained",
	);
});
