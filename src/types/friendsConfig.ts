import type { PageMeta } from "./pageMeta.ts";

export interface FriendsConfig extends PageMeta {
	/** Render the content-owned application panel and page comments. Defaults to false. */
	showApplication?: boolean;
	/** 每页条数；省略或无效值回退 12。 */
	pageSize?: number;
}

export interface FriendApplication {
	name: string;
	description: string;
	avatar: string;
	fields: { label: string; value: string }[];
	title: string;
	steps: { title: string; description: string; template?: string }[];
	notesTitle: string;
	notes: { title: string; description: string }[];
}
