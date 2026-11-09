import { expect, test } from "@playwright/test";

test("enabled calendar activity renders real monthly periods and follows the year", async ({ page }) => {
	await page.goto("/");
	const heatmap = page.locator("[data-calendar-activity]").first();
	test.skip(!(await heatmap.count()), "Optional activity display is disabled in this site configuration");
	await heatmap.scrollIntoViewIfNeeded();
	await expect(heatmap.locator(".calendar-activity__cell")).toHaveCount(60);
	await expect(heatmap.getByRole("img")).toHaveAttribute("aria-label", /\d/);
	const initial = await heatmap.getAttribute("data-year");
	const previous = page.locator("#calendar .m3-calendar__bar button").first();
	for (let attempt = 0; attempt < 24 && await previous.isEnabled(); attempt++) {
		await previous.click();
		await page.waitForTimeout(100);
		if (await heatmap.getAttribute("data-year") !== initial) break;
	}
	await expect(heatmap).not.toHaveAttribute("data-year", initial!);
	await page.locator("#calendar .m3-calendar__title").click();
	await expect(heatmap).toHaveAttribute("data-year", initial!);
});

test("calendar activity remains in the persistent shell during client navigation", async ({ page }) => {
	await page.goto("/");
	const heatmap = page.locator("[data-calendar-activity]").first();
	test.skip(!(await heatmap.count()), "Optional activity display is disabled in this site configuration");
	await page.waitForFunction(() => Boolean((window as unknown as { swup?: unknown }).swup));
	await page.evaluate(() => { document.querySelector("[data-calendar-activity]")!.setAttribute("data-preserved", "true"); });
	const group = page.locator("[data-nav-group]").filter({ has: page.locator('a[href="/archive/"]') });
	if (await group.locator("summary").count()) await group.locator("summary").click();
	await page.locator('a[href="/archive/"]:visible').first().click();
	await page.waitForURL("**/archive/");
	await expect(heatmap).toHaveAttribute("data-preserved", "true");
});
