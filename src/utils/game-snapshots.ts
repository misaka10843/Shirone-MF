import type { GamesConfig, GameItem } from "@/types/gamesConfig";
import { parseGameSnapshot } from "./game-collection";
import * as gamesData from "@/data/games";

export function readGameCollection(
	config: GamesConfig,
): GameItem[] | undefined {
	if (!config.remote?.bangumi.enable || !config.remote.bangumi.userId)
		return undefined;
	return parseGameSnapshot(
		"gameCollection" in gamesData ? gamesData.gameCollection : undefined,
		String(config.remote.bangumi.userId),
	).map((game) =>
		config.remote?.vndb?.enable
			? game
			: {
					...game,
					category: "collection",
					developer: "",
					sources: { bangumi: game.sources!.bangumi },
				},
	);
}
