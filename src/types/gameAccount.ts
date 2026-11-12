export type ProfileGame =
	| "genshin"
	| "starrail"
	| "zzz"
	| "endfield"
	| "arknights"
	| "nte"
	| "bluearchive";
export interface GameAccountConfig {
	game: ProfileGame;
	uid: string;
	enable?: boolean;
	/** Optional decorative banner artwork from the site's public directory or HTTPS. */
	artwork?: string;
}
export interface GameAccount {
	game: ProfileGame;
	uid: string;
	status: "ready" | "unavailable" | "unsupported";
	nickname?: string;
	avatarId?: number;
	avatarUrl?: string;
	signature?: string;
	level?: number;
	worldLevel?: number;
	achievements?: number;
	characters?: number;
	source?: string;
	profileUrl?: string;
	fetchedAt?: string;
	nextFetchAt?: string;
	artwork?: string;
}
