export interface ToolboxCard {
	title: string;
	description?: string;
	href: string;
	tags?: string[];
}

export interface BlogExtras {
	homeActivity?: boolean;
	randomExplore?: boolean;
	notFoundArt?: string;
	gistUser?: string;
	tools?: ToolboxCard[];
}

const extras = import.meta.glob<{ blogExtras: BlogExtras }>(
	"../data/blog-extras.ts",
	{ eager: true },
);
export const blogExtras: BlogExtras =
	extras["../data/blog-extras.ts"]?.blogExtras ?? {};

export async function loadGistCards(): Promise<ToolboxCard[]> {
	const snapshots = import.meta.glob<ToolboxCard[]>(
		"../data/toolbox-gists.json",
		{ import: "default" },
	);
	return (await snapshots["../data/toolbox-gists.json"]?.()) ?? [];
}
