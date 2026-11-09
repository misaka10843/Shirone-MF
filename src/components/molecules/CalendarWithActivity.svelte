<script lang="ts">
import type { ComponentProps } from "svelte";
import CalendarView from "./CalendarView.svelte";
import CalendarActivity from "./CalendarActivity.svelte";

let props: Omit<ComponentProps<typeof CalendarView>, "children"> = $props();
</script>

<CalendarView {...props}>
	{#snippet children(year: number)}
		<CalendarActivity {year} locale={props.locale} postsByDate={props.postsByDate} />
	{/snippet}
</CalendarView>
