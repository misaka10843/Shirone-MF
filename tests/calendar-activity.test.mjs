import assert from "node:assert/strict";
import test from "node:test";
import { getCalendarActivity } from "../src/utils/calendar-activity.ts";

test("activity retains the 29th through 31st instead of merging them into an earlier week", () => {
	const months = getCalendarActivity(2026, { "2026-01-28": [{}], "2026-01-31": [{}, {}] });
	assert.equal(months.length, 12);
	assert.deepEqual(months[0].map(p => p.count), [0, 0, 0, 1, 2]);
	assert.equal(months[0][4].end, 31);
});
test("activity handles leap days and omits nonexistent days", () => {
	assert.equal(getCalendarActivity(2024, { "2024-02-29": [{}] })[1][4].count, 1);
	const nonLeap = getCalendarActivity(2023, { "2023-02-29": [{}] })[1][4];
	assert.equal(nonLeap.count, 0);
	assert.ok(nonLeap.start > nonLeap.end);
});
test("activity respects year boundaries and calendar date keys", () => {
	const months = getCalendarActivity(2026, { "2025-12-31": [{}], "2026-01-01": [{}], "2027-01-01": [{}] });
	assert.equal(months.flat().reduce((sum, p) => sum + p.count, 0), 1);
});
test("activity uses progressive intensity without inventing publications", () => {
	const data = Object.fromEntries([1, 2, 4, 8].map((count, index) => [`2026-0${index + 1}-01`, Array(count).fill({})]));
	const months = getCalendarActivity(2026, data);
	assert.deepEqual(months.slice(0, 4).map(m => m[0].level), [1, 2, 3, 4]);
	assert.equal(getCalendarActivity(2026, {})[0][0].level, 0);
});
