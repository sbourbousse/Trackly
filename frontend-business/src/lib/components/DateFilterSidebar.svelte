<script lang="ts">
	/**
	 * Sidebar Période : même logique que DateFilterCard (raccourcis, calendrier, plage horaire, type de filtre)
	 * à utiliser à droite du contenu (desktop) ou dans un Sheet (mobile).
	 */
	import { Button } from '$lib/components/ui/button';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		dateRangeActions,
		dateRangeState,
		dateRangeUI,
		isSingleDay,
		type DateFilterType,
		type TimePreset,
		TIME_PRESET_RANGES
	} from '$lib/stores/dateRange.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
		value: `${String(i).padStart(2, '0')}:00`,
		label: `${String(i).padStart(2, '0')}h`
	}));

	const TIME_PRESET_OPTIONS: { value: TimePreset; label: string }[] = [
		{ value: 'matin', label: 'Matin (6h – 14h)' },
		{ value: 'aprem', label: 'Après-midi (14h – 22h)' },
		{ value: 'nuit', label: 'Nuit (22h – 6h lendemain)' },
		{ value: 'journee', label: 'Journée entière' }
	];

	const PRESETS: { label: string; getRange?: () => DateRange; allPeriod?: boolean }[] = [
		{ label: 'Toute période', allPeriod: true },
		{ label: "Aujourd'hui", getRange: () => { const t = today(getLocalTimeZone()); return { start: t, end: t }; } },
		{ label: 'Demain', getRange: () => { const t = today(getLocalTimeZone()).add({ days: 1 }); return { start: t, end: t }; } },
		{ label: '7 derniers jours', getRange: () => { const end = today(getLocalTimeZone()); const start = end.subtract({ days: 6 }); return { start, end }; } },
		{ label: '7 prochains jours', getRange: () => { const start = today(getLocalTimeZone()); const end = start.add({ days: 6 }); return { start, end }; } },
		{ label: 'Ce mois', getRange: () => { const t = today(getLocalTimeZone()); const start = t.set({ day: 1 }); const end = start.add({ months: 1 }).subtract({ days: 1 }); return { start, end }; } }
	];

	interface Props {
		onDateFilterChange?: (type: DateFilterType) => void | Promise<void>;
		collapsed?: boolean;
		onToggle?: () => void;
		showCloseButton?: boolean;
	}

	let { onDateFilterChange, collapsed = false, onToggle, showCloseButton = true }: Props = $props();

	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return 'Toute période';
		const same = start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		const t = dateRangeState.timeRange;
		const timeLabel = t
			? dateRangeState.timePreset === 'nuit'
				? `${t.start} – ${t.end} (lendemain)`
				: `${t.start} – ${t.end}`
			: null;
		if (same && timeLabel) return `${fmt(start)} · ${timeLabel}`;
		if (same) return fmt(start);
		if (timeLabel) return `${fmt(start)} – ${fmt(end)} · ${timeLabel}`;
		return `${fmt(start)} – ${fmt(end)}`;
	}

	function applyPreset(preset: (typeof PRESETS)[0]) {
		if (preset.allPeriod) dateRangeActions.setAllPeriod();
		else if (preset.getRange) dateRangeActions.setDateRange(preset.getRange());
	}

	async function handleDateFilterChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as DateFilterType;
		dateRangeActions.setDateFilter(value);
		await onDateFilterChange?.(value);
	}

	async function handleTimeChange() {
		await onDateFilterChange?.(dateRangeState.dateFilter);
	}

	function onDateRangeChange(value: DateRange | undefined) {
		if (!value || (value.start === undefined && value.end === undefined)) {
			dateRangeActions.setAllPeriod();
		} else {
			dateRangeActions.setDateRange(value);
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
		<div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
			<div>
				<p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Raccourcis</p>
				<div class="flex flex-col gap-1">
					{#each PRESETS as preset}
						<Button variant="ghost" size="sm" class="justify-start font-normal h-9" onclick={() => applyPreset(preset)}>
							{preset.label}
						</Button>
					{/each}
				</div>
			</div>
			<div class="border-t pt-4">
				<p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Personnalisé</p>
				<RangeCalendar
					numberOfMonths={1}
					value={dateRangeState.dateRange}
					placeholder={dateRangeState.dateRange.start ?? today(getLocalTimeZone())}
					onValueChange={onDateRangeChange}
				/>
			</div>
			{#if isSingleDay()}
				<div class="border-t pt-4 space-y-3">
					<p class="text-muted-foreground text-xs font-medium uppercase">Plage horaire</p>
					<label class="flex items-center gap-2 text-sm">
						<Checkbox
							checked={dateRangeState.useManualTime}
							onCheckedChange={(v) => {
								dateRangeActions.setUseManualTime(v === true);
								handleTimeChange();
							}}
						/>
						Heures personnalisées
					</label>
					{#if dateRangeState.useManualTime}
						<div class="flex items-center gap-1">
							<select
								class="border-input bg-background flex h-9 w-20 rounded-md border px-2 text-sm outline-none focus-visible:ring-2"
								value={dateRangeState.timeRange?.start ?? '08:00'}
								onchange={(e) => {
									dateRangeActions.setTimeRange({ ...dateRangeState.timeRange!, start: (e.target as HTMLSelectElement).value });
									handleTimeChange();
								}}
							>
								{#each HOUR_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
							<span class="text-muted-foreground text-sm">–</span>
							<select
								class="border-input bg-background flex h-9 w-20 rounded-md border px-2 text-sm outline-none focus-visible:ring-2"
								value={dateRangeState.timeRange?.end ?? '20:00'}
								onchange={(e) => {
									dateRangeActions.setTimeRange({ ...dateRangeState.timeRange!, end: (e.target as HTMLSelectElement).value });
									handleTimeChange();
								}}
							>
								{#each HOUR_OPTIONS as opt}
									<option value={opt.value}>{opt.label}</option>
								{/each}
							</select>
						</div>
					{:else}
						<select
							class="border-input bg-background flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
							value={dateRangeState.timePreset}
							onchange={(e) => {
								dateRangeActions.setTimePreset((e.target as HTMLSelectElement).value as TimePreset);
								handleTimeChange();
							}}
							aria-label="Créneau horaire"
						>
							{#each TIME_PRESET_OPTIONS as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{/if}
				</div>
			{/if}
			<div class="border-t pt-4">
				<label class="text-muted-foreground flex flex-col gap-1.5 text-xs">
					<span>Filtrer par</span>
					<select
						class="border-input bg-background flex h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
						value={dateRangeState.dateFilter}
						onchange={handleDateFilterChange}
						aria-label="Type de filtre date"
					>
						<option value="OrderDate">Date commande</option>
						<option value="CreatedAt">Date création</option>
					</select>
				</label>
			</div>
		</div>
	</aside>
{/if}
