import { expect, test } from "@playwright/test";

test("profile shows personality artwork, team logos, music platforms and UID account cards", async ({
	page,
}) => {
	await page.goto("/about/");
	test.skip(
		!(await page.locator("[data-about-profile]").count()),
		"No profile content",
	);
	await expect(page.locator("#about-self-tags")).toHaveCount(0);
	await expect(page.locator(".personality-avatar")).toHaveAttribute(
		"src",
		/INFJ_male\.png/,
	);
	await expect(page.locator("#about-teams .team-logo")).toHaveCount(3);
	await expect(page.locator("#about-music .music-platform")).toHaveCount(5);
	await expect(
		page.locator("[data-profile-game][data-account-status=ready]"),
	).toHaveCount(4);
	await expect(page.locator('[data-profile-game="genshin"]')).toContainText(
		"156136129",
	);
	await expect(page.locator('[data-profile-game="endfield"]')).toContainText(
		"1015932103",
	);
	await expect(page.locator('[data-profile-game="arknights"]')).toHaveAttribute(
		"data-account-status",
		"unsupported",
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth + 1,
			),
		)
		.toBe(true);
});

test("friend application and comments have a visible gap", async ({ page }) => {
	await page.goto("/friends/");
	const app = page.locator(".friend-application"),
		comments = page.locator("#comments");
	test.skip(
		!(await app.count()) || !(await comments.count()),
		"Application or comments disabled",
	);
	const panel = await app.boundingBox(),
		section = await comments.boundingBox();
	expect(section!.y - (panel!.y + panel!.height)).toBeGreaterThanOrEqual(15);
});

test("tag search and sorting preserve working archive links", async ({
	page,
}) => {
	await page.goto("/tags/");
	const tags = page.locator("[data-tag-item]");
	const count = await tags.count();
	expect(count).toBeGreaterThan(0);
	await page.locator("[data-tag-search]").fill("no-tag-exists-123456789");
	await expect(page.locator("[data-tag-item]:visible")).toHaveCount(0);
	await expect(page.locator("[data-tag-empty]")).toBeVisible();
	await page.locator("[data-tag-search]").fill("");
	await expect(page.locator("[data-tag-item]:visible")).toHaveCount(count);
	await page.locator('[data-tag-sort="name"]').click();
	await expect(page.locator('[data-tag-sort="name"]')).toHaveAttribute(
		"aria-pressed",
		"true",
	);
	const isSorted = await tags.evaluateAll((items) => {
		const names = items.map((item) => item.getAttribute("data-tag-name")!);
		return names.every(
			(name, index) => index === 0 || names[index - 1].localeCompare(name) <= 0,
		);
	});
	expect(isSorted).toBe(true);
	await expect(tags.first().locator("a")).toHaveAttribute(
		"href",
		/archive\/.+tag=/,
	);
	await page.setViewportSize({ width: 390, height: 844 });
	await expect
		.poll(() =>
			page.evaluate(
				() => document.documentElement.scrollWidth <= innerWidth + 1,
			),
		)
		.toBe(true);
});

test("game collection source actions explain each source role without duplicating the old links", async ({
	page,
}) => {
	await page.goto("/games/");
	const card = page
		.locator(".game-card")
		.filter({ has: page.locator('a[href^="https://vndb.org/"]') })
		.first();
	test.skip(!(await card.count()), "No VNDB enrichment");
	await expect(
		card.locator(".game-card__sources .game-card__source"),
	).toHaveCount(2);
	await expect(card.locator(".game-card__sources small").first()).toContainText(
		"收藏",
	);
	await expect(card.locator(".game-card__sources small").last()).toContainText(
		"资料",
	);
	await expect(card.locator(".game-card__link")).toHaveCount(0);
});
