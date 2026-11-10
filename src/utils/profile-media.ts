export function personalityAvatar(
	type: string,
	gender: "male" | "female" = "male",
): string | undefined {
	const match = /^([IE][NS][FT][JP])(?:-[AT])?$/i.exec(type.trim());
	return match
		? `https://www.16personalities.com/static/images/personality-types/avatars/email/large/${match[1].toUpperCase()}_${gender}.png?v=1`
		: undefined;
}

export interface MusicPlatform {
	name: string;
	icon?: string;
	logo?: string;
}
export function musicPlatform(href: string): MusicPlatform | undefined {
	let host: string;
	try {
		const u = new URL(href);
		if (u.protocol !== "https:") return;
		host = u.hostname.toLowerCase();
	} catch {
		return;
	}
	const domain = (name: string) => host === name || host.endsWith(`.${name}`);
	if (domain("spotify.com") || domain("spotify.link"))
		return { name: "Spotify", icon: "simple-icons:spotify" };
	if (domain("y.qq.com") || host === "music.qq.com")
		return { name: "QQ音乐", logo: "https://y.qq.com/favicon.ico" };
	if (domain("kugou.com"))
		return { name: "酷狗音乐", logo: "https://www.kugou.com/favicon.ico" };
	if (domain("music.163.com") || domain("163cn.tv"))
		return { name: "网易云音乐", icon: "simple-icons:neteasecloudmusic" };
	if (domain("music.apple.com"))
		return { name: "Apple Music", icon: "simple-icons:applemusic" };
	return undefined;
}
