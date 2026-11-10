import { z } from "astro/zod";
import type { AboutProfileData } from "@/types/aboutProfile";

const localOrHttps = z
	.string()
	.refine(
		(value) =>
			(value.startsWith("/") && !value.startsWith("//")) ||
			/^https:\/\//.test(value),
		"Use a site-relative path or an HTTPS URL",
	);
const link = z.object({ label: z.string(), href: localOrHttps });

export const aboutProfileSchema: z.ZodType<AboutProfileData> = z.object({
	name: z.string(),
	eyebrow: z.string(),
	alias: z.string().optional(),
	introduction: z.string(),
	avatar: localOrHttps.optional(),
	image: localOrHttps.optional(),
	tags: z.array(z.string()).optional(),
	links: z.array(link.extend({ icon: z.string().optional() })).optional(),
	sections: z
		.array(
			z.object({
				id: z.string().regex(/^[a-z][a-z0-9-]*$/),
				kind: z.enum(["text", "list", "tools", "posters", "quote", "games"]),
				title: z.string(),
				eyebrow: z.string().optional(),
				text: z.string().optional(),
				image: localOrHttps.optional(),
				personality: z
					.object({
						type: z.string().regex(/^[IE][NS][FT][JP](?:-[AT])?$/i),
						gender: z.enum(["male", "female"]).optional(),
					})
					.optional(),
				musicLinks: z
					.array(
						z.object({
							href: localOrHttps,
							label: z.string().optional(),
							logo: localOrHttps.optional(),
						}),
					)
					.optional(),
				tone: z
					.enum(["surface", "primary", "secondary", "tertiary"])
					.optional(),
				wide: z.boolean().optional(),
				items: z
					.array(
						z.object({
							title: z.string(),
							description: z.string().optional(),
							image: localOrHttps.optional(),
							logo: localOrHttps.optional(),
							href: localOrHttps.optional(),
						}),
					)
					.optional(),
				link: link.optional(),
			}),
		)
		.refine(
			(sections) =>
				new Set(sections.map((section) => section.id)).size === sections.length,
			"Section IDs must be unique",
		),
});
