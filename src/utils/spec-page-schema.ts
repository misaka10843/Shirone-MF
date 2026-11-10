import { z } from "astro/zod";
import type { AboutProfileData } from "@/types/aboutProfile";
import { aboutProfileSchema } from "./about-profile-schema";
export interface SpecPageData {
	profile?: AboutProfileData;
	payments?: { name: string; image?: string; url?: string }[];
	supporters?: { name: string; note?: string }[];
	supportersTitle?: string;
}
const address = z.string().regex(/^(https:\/\/|\/(?!\/))/);
export const specPageSchema: z.ZodType<SpecPageData> = z.object({
	profile: aboutProfileSchema.optional(),
	payments: z
		.array(
			z
				.object({
					name: z.string(),
					image: address.optional(),
					url: address.optional(),
				})
				.refine(
					(item) => Boolean(item.image || item.url),
					"A payment needs a QR image or support URL",
				),
		)
		.optional(),
	supporters: z
		.array(z.object({ name: z.string(), note: z.string().optional() }))
		.optional(),
	supportersTitle: z.string().optional(),
});
