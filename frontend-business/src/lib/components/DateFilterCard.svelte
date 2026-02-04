<script lang="ts">
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
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
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';
	import type { Snippet } from 'svelte';

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
		{
			label: 'Toute période',
			allPeriod: true
		},
		{
			label: "Aujourd'hui",
			getRange: () => {
				const t = today(getLocalTimeZone());
				return { start: t, end: t };
			}
		},
		{
			label: 'Demain',
			getRange: () => {
				const t = today(getLocalTimeZone()).add({ days: 1 });
				return { start: t, end: t };
			}
		},
		{
			label: '7 derniers jours',
			getRange: () => {
				const end = today(getLocalTimeZone());
				const start = end.subtract({ days: 6 });
				return { start, end };
			}
		},
		{
			label: '7 prochains jours',
			getRange: () => {
				const start = today(getLocalTimeZone());
				const end = start.add({ days: 6 });
				return { start, end };
			}
		}
	];

	interface Props {
		/** Callback après changement de filtre date (pour recharger les données). */
		onDateFilterChange?: (type: DateFilterType) => void | Promise<void>;
		/** Contenu optionnel : graphique "Commandes par jour/heure" dans le même card. */
		chart?: Snippet;
		/** Titre de la section graphique (ex. "Commandes par jour"). */
		chartTitle?: string;
		/** Description courte pour la vue planificateur (optionnel). */
		chartDescription?: string;
		/** Section graphique ouverte par défaut. */
		chartDefaultOpen?: boolean;
	}

	let { onDateFilterChange, chart, chartTitle = 'Commandes par jour', chartDescription, chartDefaultOpen = false }: Props = $props();

	let calendarOpen = $state(false);
	let chartOpen = $state(false);
	let chartInitialized = $state(false);

	$effect(() => {
		if (!chartInitialized) {
			chartOpen = chartDefaultOpen;
			chartInitialized = true;
		}
	});

	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return 'Toute période';
		const same =
			start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
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
		if (preset.allPeriod) {
			dateRangeActions.setAllPeriod();
		} else if (preset.getRange) {
			dateRangeActions.setDateRange(preset.getRange());
		}
		calendarOpen = false;
	}

	async function handleDateFilterChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const value = target.value as DateFilterType;
		dateRangeActions.setDateFilter(value);
		await onDateFilterChange?.(value);
	}

	async function handleTimeChange() {
		await onDateFilterChange?.(dateRangeState.dateFilter);
	}

	async function onDateRangeChange(value: DateRange | undefined) {
		if (!value || (value.start === undefined && value.end === undefined)) {
			dateRangeActions.setAllPeriod();
		} else {
			dateRangeActions.setDateRange(value);
		}
	}
</script>

<Card class="min-w-0">
	<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
		<div class="flex flex-wrap items-center gap-2">
			<PopoverRoot bind:open={calendarOpen}>
				<PopoverTrigger>
					{#snippet child({ props }: { props: Record<string, unknown> })}
						<Button variant="outline" class="gap-2 font-normal" {...props}>
							<CalendarIcon class="size-4" />
							{formatRangeLabel()}
							<ChevronDownIcon class="size-4 opacity-50" />
						</Button>
					{/snippet}
				</PopoverTrigger>
				<PopoverContent class="max-w-[calc(100vw-2rem)] w-max overflow-hidden rounded-lg border border-border bg-popover p-0 shadow-lg md:max-w-[680px]" align="start" sideOffset={6}>
					<div class="flex max-w-full flex-col bg-popover md:min-w-[620px] md:flex-row">
						<div class="flex shrink-0 flex-col border-b border-border bg-popover p-3 md:border-b-0 md:border-r">
							<p class="text-muted-foreground mb-2 px-1 text-xs font-medium uppercase tracking-wider">Raccourcis</p>
							{#each PRESETS as preset}
								<Button
									variant="ghost"
									size="sm"
									class="justify-start font-normal"
									onclick={() => applyPreset(preset)}
								>
									{preset.label}
								</Button>
							{/each}
						</div>
						<div class="min-w-0 shrink bg-popover p-3 md:min-w-[260px]">
							<RangeCalendar
								numberOfMonths={1}
								disableDaysOutsideMonth={false}
								value={dateRangeState.dateRange}
								placeholder={dateRangeState.dateRange.start ?? today(getLocalTimeZone())}
								onValueChange={onDateRangeChange}
							/>
						</div>
						{#if isSingleDay()}
							<div class="border-input flex min-w-0 flex-col gap-3 border-t border-border bg-popover p-4 pt-3 md:min-w-[200px] md:border-t-0 md:border-l">
								<p class="text-muted-foreground text-xs font-medium">Plage horaire</p>
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
											class="border-input bg-background dark:bg-input/30 flex h-9 w-20 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
											value={dateRangeState.timeRange?.start ?? '08:00'}
											onchange={(e) => {
												const v = (e.target as HTMLSelectElement).value;
												dateRangeActions.setTimeRange({
													...dateRangeState.timeRange!,
													start: v
												});
												handleTimeChange();
											}}
										>
											{#each HOUR_OPTIONS as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
										<span class="text-muted-foreground text-sm">–</span>
										<select
											class="border-input bg-background dark:bg-input/30 flex h-9 w-20 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
											value={dateRangeState.timeRange?.end ?? '20:00'}
											onchange={(e) => {
												const v = (e.target as HTMLSelectElement).value;
												dateRangeActions.setTimeRange({
													...dateRangeState.timeRange!,
													end: v
												});
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
										class="border-input bg-background dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
										value={dateRangeState.timePreset}
										onchange={(e) => {
											const v = (e.target as HTMLSelectElement).value as TimePreset;
											dateRangeActions.setTimePreset(v);
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
					</div>
				</PopoverContent>
			</PopoverRoot>
			<label class="text-muted-foreground flex items-center gap-1.5 text-sm">
				<span>Filtrer par :</span>
				<select
					class="border-input bg-background dark:bg-input/30 ring-offset-background flex h-9 min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
					value={dateRangeState.dateFilter}
					onchange={handleDateFilterChange}
					aria-label="Type de filtre date"
				>
					<option value="OrderDate">Date commande</option>
					<option value="CreatedAt">Date création</option>
				</select>
			</label>
		</div>
	</CardHeader>

	{#if chart}
		<div class="border-t px-4 pt-2">
			<div class="flex flex-col gap-0.5 py-2">
				<div class="flex flex-row items-center justify-between gap-2">
					<span class="text-muted-foreground text-sm font-medium">{chartTitle}</span>
				<Button
					variant="ghost"
					size="sm"
					class="gap-1.5 text-muted-foreground hover:text-foreground"
					onclick={() => (chartOpen = !chartOpen)}
					aria-expanded={chartOpen}
				>
					{#if chartOpen}
						<ChevronUpIcon class="size-4" aria-hidden="true" />
						Réduire
					{:else}
						<ChevronDownIcon class="size-4" aria-hidden="true" />
						Développer
					{/if}
				</Button>
				</div>
				{#if chartDescription}
					<p class="text-muted-foreground text-xs">{chartDescription}</p>
				{/if}
			</div>
			{#if chartOpen}
				<div class="min-w-0 pt-0">
					{@render chart()}
				</div>
			{/if}
		</div>
	{/if}
</Card>
