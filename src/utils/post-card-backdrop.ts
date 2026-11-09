import type { PostListConfig } from "@/types/postListConfig";

/** Stable SSG sampling avoids hydration changes and repeated random image requests. */
export function selectPostBackdrop(
	id: string,
	cover: string,
	config: PostListConfig["backdrop"],
): string {
	if (!config?.enable) return "";
	if (cover) return cover;
	const images = config.fallbackImages.filter(Boolean);
	if (!images.length) return "";
	let hash = 2166136261;
	for (const character of id)
		hash = Math.imul(hash ^ character.codePointAt(0)!, 16777619);
	return images[(hash >>> 0) % images.length];
}
