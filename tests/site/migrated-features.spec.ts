import { expect, test } from "@playwright/test";

test("desktop navigation is constrained to the page width", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1900, height: 900 });
	await page.goto("/");
	const bounds = await page.locator("#navbar").boundingBox();
	expect(bounds!.x).toBeGreaterThan(16);
	expect(bounds!.width).toBeLessThan(1868);
	await expect(page.locator("#navbar")).toHaveCSS(
		"border-bottom-left-radius",
		/\d+px/,
	);
});

test("friend application shows authored fields, copies text and survives client navigation", async ({
	page,
	context,
}) => {
	await context.grantPermissions(["clipboard-read", "clipboard-write"]);
	await page.goto("/friends/");
	const panel = page.locator(".friend-application");
	test.skip(!(await panel.count()), "Application disabled");
	const button = panel.locator("[data-friend-copy]").first();
	const expected = await button.getAttribute("data-friend-copy");
	await button.click();
	await expect
		.poll(() => page.evaluate(() => navigator.clipboard.readText()))
		.toBe(expected);
	await page.locator('#navbar a[href="/"]').first().click();
	await page.waitForURL("http://localhost:4321/");
	const link = page.locator('#navbar a[href="/friends/"]');
	await link.locator("xpath=ancestor::details").locator("summary").hover();
	await link.click();
	await expect(panel).toBeVisible();
	await panel.locator("[data-friend-copy]").first().click();
	await expect(panel.locator('[role="status"]')).not.toBeEmpty();
	await page.setViewportSize({ width: 390, height: 844 });
	await expect
		.poll(() =>
			panel
				.locator(".friend-application__columns")
				.evaluate(
					(e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
				),
		)
		.toBe(1);
});

test("project cards use inset covers and linked detail content", async ({
	page,
}) => {
	await page.goto("/projects/");
	const card = page.locator(".project-card").first();
	test.skip(!(await card.count()), "No project content");
	await expect(card.locator(".project-card__cover")).toBeVisible();
	const detail = card.locator(".project-card__details");
	if (await detail.count()) {
		await detail.click();
		await expect(page).toHaveURL(/\/projects\/[^/]+\/$/);
		await expect(page.locator(".custom-md")).not.toBeEmpty();
	}
});

test("games merge source links in one collection and filter without API requests", async ({
	page,
}) => {
	const requests: string[] = [];
	page.on("request", (r) => {
		if (/api\.bgm\.tv|api\.vndb\.org/.test(r.url())) requests.push(r.url());
	});
	await page.goto("/games/");
	const cards = page.locator(".game-card");
	test.skip(!(await cards.count()), "No game content");
	const count = await cards.count();
	expect(count).toBeGreaterThan(0);
	const vn = page.locator('.game-card a[href^="https://vndb.org/v"]').first();
	if (await vn.count())
		await expect(
			vn
				.locator("xpath=ancestor::article")
				.locator('a[href^="https://bgm.tv/subject/"]')
				.first(),
		).toBeVisible();
	const name = await cards.first().locator("h2").innerText();
	await page.locator(".games-section__search input").fill(name);
	await expect(cards).toHaveCount(1);
	await page.locator(".games-section__search input").fill("");
	await expect(cards).toHaveCount(count);
	expect(requests).toEqual([]);
});
