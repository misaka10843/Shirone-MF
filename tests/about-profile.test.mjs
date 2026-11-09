import assert from "node:assert/strict";
import test from "node:test";
import { aboutProfileSchema } from "../src/utils/about-profile-schema.ts";

const profile = { name: "Author", eyebrow: "Hello", introduction: "Profile", sections: [] };
test("about profile accepts a minimal optional enhancement", () => {
	assert.equal(aboutProfileSchema.parse(profile).name, "Author");
});
test("about profile accepts local images and HTTPS destinations", () => {
	assert.equal(aboutProfileSchema.parse({ ...profile, image: "/images/profile.webp", links: [{ label: "Link", href: "https://example.com" }] }).links.length, 1);
});
test("about profile rejects unsafe link schemes", () => {
	for (const href of ["javascript:alert(1)", "//example.com", "file:///private"]) {
		assert.equal(aboutProfileSchema.safeParse({ ...profile, links: [{ label: "Link", href }] }).success, false);
	}
});
test("about profile rejects duplicate section IDs", () => {
	const section = { id: "interests", kind: "text", title: "Interests" };
	assert.equal(aboutProfileSchema.safeParse({ ...profile, sections: [section, section] }).success, false);
});
