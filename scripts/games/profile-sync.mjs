import {
	existsSync,
	readFileSync,
	writeFileSync,
	renameSync,
	mkdirSync,
} from "node:fs";
import { resolve, join, dirname } from "node:path";
import { parse } from "yaml";
import {
	resolveContentSource,
	WORKING_COPY_DIR,
} from "../content/resolve-source.mjs";
import {
	gameAccountEndpoint,
	normalizeGameAccount,
} from "../../src/utils/game-accounts.ts";
const source = resolveContentSource();
if (source.mode !== "external") {
	console.log(
		"[profile-games] Configure an external content repository first.",
	);
	process.exit(0);
}
const root =
	source.source.type === "path"
		? resolve(source.source.path)
		: resolve(WORKING_COPY_DIR);
const configFile = join(root, "config/games.yaml");
const config = existsSync(configFile)
	? (parse(readFileSync(configFile, "utf8")) ?? {})
	: {};
const accounts = (config.profileAccounts ?? []).filter(
	(account) => account.enable !== false,
);
if (!accounts.length) {
	console.log("[profile-games] No UID accounts configured; no requests made.");
	process.exit(0);
}
const output = join(root, "data/game-account-snapshots.json");
const previous = existsSync(output)
	? JSON.parse(readFileSync(output, "utf8"))
	: { items: [] };
const avatarStores = {
	genshin: "gi",
	starrail: "hsr",
	zzz: "zzz",
	endfield: "ef",
};

async function resolveAvatar(account) {
	if (account.avatarId === undefined) return undefined;
	const store = avatarStores[account.game];
	const response = await fetch(
		`https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/${store}/pfps.json`,
		{ signal: AbortSignal.timeout(10000) },
	);
	if (!response.ok) throw new Error(`Avatar catalog HTTP ${response.status}`);
	const entry = (await response.json())[account.avatarId];
	const path = entry?.IconPath ?? entry?.Icon;
	return typeof path === "string" && /^\/ui\/[\w/.-]+\.png$/.test(path)
		? `https://enka.network${path}`
		: undefined;
}

const items = [];
for (const account of accounts) {
	const { game } = account,
		uid = String(account.uid),
		old = previous.items?.find(
			(item) =>
				item.game === game && item.uid === uid && item.status === "ready",
		);
	try {
		const endpoint = gameAccountEndpoint(game, uid);
		if (!endpoint) {
			items.push({ game, uid, status: "unsupported" });
			console.log(
				`[profile-games] ${game}: UID stored, no verified public UID-only provider.`,
			);
			continue;
		}
		if (old?.nextFetchAt && Date.parse(old.nextFetchAt) > Date.now()) {
			items.push(old);
			console.log(`[profile-games] ${game}: provider TTL cache used.`);
			continue;
		}
		const response = await fetch(endpoint, {
			headers: {
				"User-Agent":
					"MisakaHome/1.0 (https://github.com/misaka10843/Shirone-MF)",
			},
			signal: AbortSignal.timeout(15000),
		});
		if (!response.ok || !response.headers.get("content-type")?.includes("json"))
			throw new Error(`HTTP ${response.status}`);
		const reader = response.body.getReader(),
			chunks = [];
		let size = 0;
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > 5 * 1024 * 1024) {
				await reader.cancel();
				throw new Error("Response exceeds 5 MB");
			}
			chunks.push(value);
		}
		const normalized = normalizeGameAccount(
			game,
			uid,
			JSON.parse(Buffer.concat(chunks).toString("utf8")),
		);
		if (!normalized) throw new Error("Missing public nickname or level");
		try {
			normalized.avatarUrl = await resolveAvatar(normalized);
		} catch (error) {
			if (old?.avatarId === normalized.avatarId)
				normalized.avatarUrl = old?.avatarUrl;
			console.warn(
				`[profile-games] ${game}: avatar lookup failed: ${error.message}`,
			);
		}
		items.push(normalized);
		console.log(`[profile-games] ${game}: public profile updated.`);
	} catch (error) {
		items.push(old ?? { game, uid, status: "unavailable" });
		console.warn(
			`[profile-games] ${game}: ${error.message}; kept previous profile or UID card.`,
		);
	}
}
mkdirSync(dirname(output), { recursive: true });
writeFileSync(
	output + ".tmp",
	JSON.stringify({ schemaVersion: 1, items }, null, 2) + "\n",
);
renameSync(output + ".tmp", output);
console.log(
	`[profile-games] ${items.filter((item) => item.status === "ready").length}/${items.length} public profiles available.`,
);
