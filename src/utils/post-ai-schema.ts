import { z } from "astro/zod";

export interface PostAiDisclosure {
	mode: "generated" | "assisted";
	models: { provider: string; name: string }[];
}

export const postAiSchema: z.ZodType<PostAiDisclosure> = z.object({
	mode: z.enum(["generated", "assisted"]),
	models: z
		.array(
			z.object({
				provider: z.string().trim().min(1),
				name: z.string().trim().min(1),
			}),
		)
		.min(1),
});
