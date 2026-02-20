<script lang="ts">
	/**
	 * Sidebar Période (droite) : calendrier pour choisir un jour. Raccourcis dans le widget en haut ; filtre par date commande.
	 */
	import { Button } from '$lib/components/ui/button';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { dateRangeActions, dateRangeState, dateRangeUI } from '$lib/stores/dateRange.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	interface Props {
		collapsed?: boolean;
		onToggle?: () => void;
		showCloseButton?: boolean;
	}

	let { collapsed = false, onToggle, showCloseButton = true }: Props = $props();
	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return '…';
		const same = start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		if (same) return fmt(start);
		return `${fmt(start)} – ${fmt(end)}`;
	}

	function handleCalendarDateChange(value: DateRange | undefined) {
		if (!value || (value.start === undefined && value.end === undefined)) {
			dateRangeActions.setAllPeriod();
			dateRangeActions.setSelectedPresetIndex(null);
			return;
		}
		const singleDate = value.start ?? value.end;
		if (singleDate) {
			const singleDayRange: DateRange = { start: singleDate, end: singleDate };
			dateRangeActions.setSelectedPresetIndex(null);
			dateRangeActions.setTimeRange(null);
			dateRangeActions.setTimePreset('journee');
			dateRangeActions.setUseManualTime(false);
			dateRangeActions.setDateRange(singleDayRange);
		}
	}

</script>

{#if collapsed && onToggle}
	<Button
		variant="outline"
		size="sm"
		class="flex h-10 shrink-0 items-center gap-2 border bg-background shadow-md"
		onclick={onToggle}
		aria-label="Ouvrir le panneau Période"
		title="Période"
	>
		<CalendarIcon class="size-4" />
		<span class="truncate max-w-[140px]">{formatRangeLabel()}</span>
	</Button>
{:else}
	<aside class="flex h-full w-full flex-col border-l bg-background">
		<div class="flex items-center justify-between border-b px-4 py-3">
			<h2 class="font-semibold text-sm flex items-center gap-2">
				<CalendarIcon class="size-4 text-muted-foreground" />
				Période
			</h2>
			{#if showCloseButton && onToggle}
				<Button variant="ghost" size="icon" class="h-8 w-8" onclick={onToggle} aria-label="Fermer le panneau">
					<XIcon class="size-4" />
				</Button>
			{/if}
		</div>
		<div class="flex flex-1 flex-col overflow-y-auto p-4">
			<p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Choisir un jour</p>
			<RangeCalendar
				numberOfMonths={1}
				value={dateRangeState.dateRange}
				placeholder={dateRangeState.dateRange.start ?? today(getLocalTimeZone())}
				onValueChange={handleCalendarDateChange}
			/>
		</div>
	</aside>
{/if}
