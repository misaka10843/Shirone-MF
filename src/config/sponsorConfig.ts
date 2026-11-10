import type { SponsorConfig } from "@/types/communityConfig";
import { withUserConfig } from "../utils/config-overlay.ts";
/** Behavior only. Payment methods and supporters belong to the sponsor spec entry. */
export const sponsorConfig: SponsorConfig = withUserConfig("sponsor", {
	enable: false,
	title: "$t:sponsor",
	description: "",
});
