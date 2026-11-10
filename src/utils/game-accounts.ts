import type {
	GameAccount,
	GameAccountConfig,
	ProfileGame,
} from "@/types/gameAccount";

const object = (value: unknown): Record<string, unknown> =>
	value && typeof value === "object" && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: {};
const text = (value: unknown, max = 500): string | undefined =>
	typeof value === "string" && value.trim()
		? value.trim().slice(0, max)
		: undefined;
const count = (value: unknown): number | undefined =>
	typeof value === "number" &&
	Number.isSafeInteger(value) &&
	value >= 0 &&
	value <= 10000000
		? value
		: undefined;
export function gameAccountEndpoint(
	game: ProfileGame,
	uid: string,
): string | undefined {
	if (!/^\d{6,12}$/.test(uid)) throw new Error("Invalid game UID");
	if (game === "genshin") return `https://enka.network/api/uid/${uid}/?info`;
	if (game === "starrail") return `https://enka.network/api/hsr/uid/${uid}/`;
	if (game === "zzz") return `https://enka.network/api/zzz/uid/${uid}/`;
	if (game === "endfield") return `https://enka.network/api/ef/uid/${uid}/`;
	return undefined;
}

export function normalizeGameAccount(
	game: ProfileGame,
	uid: string,
	value: unknown,
): GameAccount | null {
	const root = object(value);
	let info: Record<string, unknown>, signature: unknown, characters: unknown;
	if (root.uid !== undefined && String(root.uid) !== uid) return null;
	if (game === "genshin") {
		info = object(root.playerInfo);
		signature = info.signature;
		characters = info.showAvatarInfoList;
	} else if (game === "starrail") {
		info = object(root.detailInfo);
		signature = info.signature;
		characters = info.avatarDetailList;
	} else if (game === "zzz") {
		const player = object(root.PlayerInfo),
			social = object(player.SocialDetail);
		info = object(social.ProfileDetail);
		signature = social.Desc;
		characters = object(player.ShowcaseDetail).AvatarList;
	} else if (game === "endfield") {
		const player = object(root.playerInfo);
		info = object(player.businessCard);
		signature = info.signature;
		characters = player.charData;
	} else return null;
	const nickname = text(info.nickname ?? info.Nickname ?? info.name, 100),
		level = count(info.level ?? info.Level ?? info.adventureLevel);
	if (!nickname || level === undefined) return null;
	const time = Date.now(),
		ttl =
			typeof root.ttl === "number"
				? Math.max(60, Math.min(root.ttl, 86400))
				: 300;
	return {
		game,
		uid,
		status: "ready",
		nickname,
		level,
		signature: text(signature),
		worldLevel: count(info.worldLevel),
		achievements: count(
			info.finishAchievementNum ?? object(info.recordInfo).achievementCount,
		),
		characters: Array.isArray(characters) ? characters.length : undefined,
		source: "Enka.Network",
		profileUrl: "https://enka.network/",
		fetchedAt: new Date(time).toISOString(),
		nextFetchAt: new Date(time + ttl * 1000).toISOString(),
	};
}

export function readGameAccountSnapshot(
	value: unknown,
	accounts: GameAccountConfig[],
): GameAccount[] {
	const snapshot = object(value),
		items =
			snapshot.schemaVersion === 1 && Array.isArray(snapshot.items)
				? snapshot.items
				: [];
	return accounts
		.filter((a) => a.enable !== false && /^\d{6,12}$/.test(a.uid))
		.map((config) => {
			const row = items
				.map(object)
				.find(
					(row) =>
						row.game === config.game &&
						row.uid === config.uid &&
						row.status === "ready",
				);
			if (!row)
				return {
					game: config.game,
					uid: config.uid,
					status: gameAccountEndpoint(config.game, config.uid)
						? "unavailable"
						: "unsupported",
				};
			const nickname = text(row.nickname, 100),
				level = count(row.level);
			if (!nickname || level === undefined)
				return { game: config.game, uid: config.uid, status: "unavailable" };
			return {
				game: config.game,
				uid: config.uid,
				status: "ready",
				nickname,
				level,
				signature: text(row.signature),
				worldLevel: count(row.worldLevel),
				achievements: count(row.achievements),
				characters: count(row.characters),
				source: "Enka.Network",
				profileUrl: "https://enka.network/",
				fetchedAt: text(row.fetchedAt),
				nextFetchAt: text(row.nextFetchAt),
			};
		});
}
