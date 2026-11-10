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
}
export interface GameAccount {
	game: ProfileGame;
	uid: string;
	status: "ready" | "unavailable" | "unsupported";
	nickname?: string;
	signature?: string;
	level?: number;
	worldLevel?: number;
	achievements?: number;
	characters?: number;
	source?: string;
	profileUrl?: string;
	fetchedAt?: string;
	nextFetchAt?: string;
}
