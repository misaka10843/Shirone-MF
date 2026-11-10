import { expect, test } from "@playwright/test";

test("desktop search stays visible without covering centered menus", async ({
	page,
}) => {
	for (const width of [1024, 1280, 1440]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto("/");
		const search = page.locator("#search-input-desktop");
		await expect(search).toBeVisible();
		const navigation = await page.locator("#navbar nav").boundingBox();
		const input = await search.boundingBox();
		expect(navigation!.x + navigation!.width).toBeLessThanOrEqual(input!.x);
	}
});

test("desktop hover opens one group and crosses the dropdown gap safely", async ({
	page,
}) => {
	await page.goto("/");
	const groups = page.locator("#navbar [data-nav-disclosure]");
	test.skip(
		(await groups.count()) < 2,
		"This site needs two navigation groups",
	);
	await groups.nth(0).locator("summary").hover();
	await expect(groups.nth(0)).toHaveAttribute("open", "");
	await groups.nth(0).locator("a").first().hover();
	await expect(groups.nth(0)).toHaveAttribute("open", "");
	await groups.nth(1).locator("summary").hover();
	await expect(groups.nth(1)).toHaveAttribute("open", "");
	await expect(groups.nth(0)).not.toHaveAttribute("open");
	await page.mouse.move(10, 300);
	await expect(groups.nth(1)).not.toHaveAttribute("open");
	const glass = await page
		.locator("#navbar")
		.evaluate(
			(element) => getComputedStyle(element, "::before").backdropFilter,
		);
	expect(glass).toContain("blur");
});

test("desktop navigation supports native disclosure, keyboard focus and Escape", async ({
	page,
}) => {
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

test("navigation groups work without JavaScript and icons are SSR SVG", async ({
	browser,
}) => {
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

test("parent group stays active after client navigation and returning home", async ({
	page,
}) => {
	await page.goto("/");
	const group = page
		.locator("[data-nav-group]")
		.filter({ has: page.locator('a[href="/about/"]') });
	test.skip(
		!(await group.locator("summary").count()),
		"About is not in a navigation group",
	);
	await group.locator("summary").click();
	await group.locator('a[href="/about/"]').click();
	await page.waitForURL("**/about/");
	await expect(group.locator("summary")).toHaveClass(
		/top-app-bar__nav-link--active/,
	);
	await expect(group.locator("details")).not.toHaveAttribute("open");
	await page.locator('#navbar a[href="/"]').first().click();
	await page.waitForURL("http://localhost:4321/");
	await expect(group.locator("summary")).not.toHaveClass(
		/top-app-bar__nav-link--active/,
	);
});
