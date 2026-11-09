/** Pure calendar-date aggregation. No collections, network, or browser state. */
export interface CalendarActivityPeriod {
	month: number;
	start: number;
	end: number;
	count: number;
	level: number;
}

export function getCalendarActivity(
	year: number,
	postsByDate: Record<string, readonly unknown[]>,
): CalendarActivityPeriod[][] {
	return Array.from({ length: 12 }, (_, month) => {
		const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
		return Array.from({ length: 5 }, (_, period) => {
			const start = period * 7 + 1;
			const end = Math.min(start + 6, days);
			let count = 0;
			for (let day = start; day <= end; day++) {
				const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
				count += postsByDate[key]?.length ?? 0;
			}
			const level =
				count === 0 ? 0 : Math.min(4, Math.floor(Math.log2(count)) + 1);
			return { month, start, end, count, level };
		});
	});
}
