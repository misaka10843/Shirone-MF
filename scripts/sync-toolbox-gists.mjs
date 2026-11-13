import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const [username, destination] = process.argv.slice(2);
if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(username ?? "") || !destination) {
	throw new Error(
		"Usage: node scripts/sync-toolbox-gists.mjs <github-user> <path/to/toolbox-gists.json>",
	);
}

const cards = [];
for (let page = 1; ; page++) {
	const response = await fetch(
		`https://api.github.com/users/${username}/gists?per_page=100&page=${page}`,
		{
			headers: { Accept: "application/vnd.github+json" },
			signal: AbortSignal.timeout(10_000),
		},
	);
	if (!response.ok)
		throw new Error(`GitHub Gist request failed: HTTP ${response.status}`);
	const gists = await response.json();
	if (!Array.isArray(gists)) throw new Error("Unexpected GitHub Gist response");
	for (const gist of gists) {
		if (
			gist.public !== true ||
			!gist.html_url?.startsWith("https://gist.github.com/")
		)
			continue;
		const files = Object.values(gist.files ?? {});
		cards.push({
			title: gist.description?.trim() || files[0]?.filename || gist.id,
			href: gist.html_url,
			tags: [...new Set(files.map(({ language }) => language).filter(Boolean))],
		});
	}
	if (!response.headers.get("link")?.includes('rel="next"')) break;
}
await writeFile(
	resolve(destination),
	`${JSON.stringify(cards, null, 2)}\n`,
	"utf8",
);
console.log(`Saved ${cards.length} public Gist cards.`);
