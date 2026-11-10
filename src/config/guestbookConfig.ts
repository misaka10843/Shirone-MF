import type { GuestbookConfig } from "@/types/communityConfig";
import { withUserConfig } from "../utils/config-overlay.ts";
/** Independent comment page. Disabled by default; uses the global comment provider. */
export const guestbookConfig: GuestbookConfig = withUserConfig("guestbook", {
	enable: false,
	title: "$t:guestbook",
	description: "",
});
