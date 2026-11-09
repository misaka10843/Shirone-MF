<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { getCalendarActivity } from "@utils/calendar-activity";
import { createGregorianDateFormatter } from "@utils/locale-utils";
import activityStyles from "@/styles/calendar-activity.css?raw";

let {
	year,
	locale,
	postsByDate,
}: {
	year: number;
	locale: string;
	postsByDate: Record<string, readonly unknown[]>;
} = $props();
const months = $derived(getCalendarActivity(year, postsByDate));
const total = $derived(
	months.flat().reduce((count, period) => count + period.count, 0),
);
const formatter = $derived(
	createGregorianDateFormatter(locale, { month: "long" }),
);
function monthName(month: number): string {
	return formatter.format(new Date(year, month, 1));
}
function countLabel(template: string, month: number, count: number): string {
	return template
		.replace("{month}", monthName(month))
		.replace("{count}", String(count));
}
const summary = $derived(
	months
		.map((periods, month) =>
			countLabel(
				i18n(I18nKey.calendarActivityMonth),
				month,
				periods.reduce((count, period) => count + period.count, 0),
			),
		)
		.join("; "),
);
const yearSummary = $derived(
	i18n(I18nKey.calendarActivitySummary)
		.replace("{year}", String(year))
		.replace("{count}", String(total)),
);
</script>

<!-- Owned static CSS is emitted only by the enabled activity island. -->
{@html `<style>${activityStyles}</style>`}
<figure class="calendar-activity" data-calendar-activity data-year={year}>
	<figcaption><span>{i18n(I18nKey.calendarActivity)}</span><span>{yearSummary}</span></figcaption>
	<div class="calendar-activity__months" role="img" aria-label={`${yearSummary}. ${summary}`}>
		{#each months as periods, month}
			<div class="calendar-activity__column" aria-hidden="true">
				<span class="calendar-activity__month">{month + 1}</span>
				{#each periods as period}
					<span class="calendar-activity__cell" data-level={period.level} data-empty={period.start > period.end}
						title={period.start > period.end ? undefined : countLabel(i18n(I18nKey.calendarActivityPeriod), month, period.count).replace("{start}", String(period.start)).replace("{end}", String(period.end))}></span>
				{/each}
			</div>
		{/each}
	</div>
</figure>
