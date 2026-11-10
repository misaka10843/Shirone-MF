/** Author-owned profile content, stored in the about spec entry frontmatter. */
export interface AboutProfileItem {
	title: string;
	description?: string;
	image?: string;
	logo?: string;
	href?: string;
}

export interface AboutProfileSection {
	id: string;
	kind: "text" | "list" | "tools" | "posters" | "quote" | "games";
	title: string;
	eyebrow?: string;
	text?: string;
	image?: string;
	tone?: "surface" | "primary" | "secondary" | "tertiary";
	wide?: boolean;
	items?: AboutProfileItem[];
	link?: { label: string; href: string };
	personality?: { type: string; gender?: "male" | "female" };
	musicLinks?: { href: string; label?: string; logo?: string }[];
}

export interface AboutProfileData {
	name: string;
	eyebrow: string;
	alias?: string;
	introduction: string;
	avatar?: string;
	image?: string;
	tags?: string[];
	links?: { label: string; href: string; icon?: string }[];
	sections: AboutProfileSection[];
}
