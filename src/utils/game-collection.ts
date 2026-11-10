import type { GameItem, GameStatus } from "@/types/gamesConfig";

const statuses: Record<number, GameStatus> = {
	1: "wishlist",
	2: "completed",
	3: "playing",
	4: "onHold",
	5: "dropped",
};
const text = (value: unknown, max = 500): string =>
	typeof value === "string" ? value.slice(0, max) : "";
const record = (value: unknown): Record<string, unknown> =>
	value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const https = (value: unknown): string | undefined => {
	try {
		const u = new URL(String(value));
		return u.protocol === "https:" ? u.href : undefined;
	} catch {
		return undefined;
	}
};

export function normalizeBangumiGame(value: unknown): GameItem | null {
	const row = record(value),
		subject = record(row.subject),
		images = record(subject.images);
	const id = Number(subject.id ?? row.subject_id),
		status = statuses[Number(row.type)];
	if (!Number.isSafeInteger(id) || id <= 0 || !status || subject.type !== 4)
		return null;
	const name = text(subject.name_cn) || text(subject.name);
	if (!name) return null;
	const rating = Number(row.rate);
	return {
		id: `bgm-${id}`,
		name,
		developer: "",
		category: "collection",
		status,
		cover: https(images.large ?? images.common),
		description: text(row.comment, 2000),
		year: text(subject.date, 10),
		tags: Array.isArray(row.tags)
			? row.tags
					.filter((t) => typeof t === "string")
					.slice(0, 8)
					.map((t) => text(t, 80))
			: [],
		rating:
			Number.isFinite(rating) && rating > 0 && rating <= 10
				? rating / 2
				: undefined,
		link: `https://bgm.tv/subject/${id}`,
		sources: { bangumi: `https://bgm.tv/subject/${id}` },
	};
}

const titleKey = (value: unknown): string =>
	text(value)
		.normalize("NFKC")
		.toLocaleLowerCase("en")
		.replace(/[\s\p{P}\p{S}]+/gu, "");

/** Only an explicit override or a unique exact title/alias match may enrich a collection. */
export function matchVisualNovel(
	candidates: unknown[],
	names: string[],
	explicitId?: string,
): Record<string, unknown> | null {
	const keys = new Set(names.map(titleKey).filter(Boolean));
	const matches = candidates.map(record).filter((vn) => {
		if (!/^v[1-9]\d*$/.test(String(vn.id))) return false;
		if (explicitId) return vn.id === explicitId;
		const titles = Array.isArray(vn.titles)
			? vn.titles.flatMap((v) => {
					const t = record(v);
					return [t.title, t.latin];
				})
			: [];
		const aliases = Array.isArray(vn.aliases) ? vn.aliases : [];
		return [vn.title, ...titles, ...aliases].some((v) => keys.has(titleKey(v)));
	});
	return matches.length === 1 ? matches[0] : null;
}

export function enrichGame(
	game: GameItem,
	value: Record<string, unknown>,
): GameItem {
	const developers = Array.isArray(value.developers)
		? value.developers
				.map((v) => text(record(v).name))
				.filter(Boolean)
				.join(" / ")
		: "";
	return {
		...game,
		category: "visual-novel",
		developer: developers || game.developer,
		sources: {
			bangumi: game.sources!.bangumi,
			vndb: `https://vndb.org/${value.id}`,
		},
	};
}

/** Read untrusted JSON snapshots without letting arbitrary statuses/URLs enter the page. */
export function parseGameSnapshot(value: unknown, userId: string): GameItem[] {
	const snapshot = record(value);
	if (
		snapshot.schemaVersion !== 1 ||
		snapshot.accountRef !== userId ||
		!Array.isArray(snapshot.items)
	)
		return [];
	return snapshot.items.flatMap((raw) => {
		const item = record(raw),
			sources = record(item.sources);
		const id = text(item.id),
			status = text(item.status) as GameStatus;
		if (
			!/^bgm-[1-9]\d*$/.test(id) ||
			!Object.values(statuses).includes(status) ||
			!text(item.name) ||
			!/^https:\/\/bgm\.tv\/subject\/[1-9]\d*$/.test(String(sources.bangumi))
		)
			return [];
		const vndb = /^https:\/\/vndb\.org\/v[1-9]\d*$/.test(String(sources.vndb))
			? String(sources.vndb)
			: undefined;
		return [
			{
				id,
				name: text(item.name),
				status,
				developer: text(item.developer),
				category: vndb ? "visual-novel" : "collection",
				description: text(item.description, 2000),
				year: text(item.year, 10),
				cover: https(item.cover),
				rating:
					typeof item.rating === "number" &&
					item.rating >= 0 &&
					item.rating <= 5
						? item.rating
						: undefined,
				tags: Array.isArray(item.tags)
					? item.tags
							.filter((t) => typeof t === "string")
							.slice(0, 8)
							.map((t) => text(t, 80))
					: [],
				link: String(sources.bangumi),
				sources: { bangumi: String(sources.bangumi), vndb },
			},
		];
	});
}
