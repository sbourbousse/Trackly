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
		getDateRangeDayKeys,
		getDateRangeFourHourSlotKeys,
		getCurrentFourHourSlotIndex,
		getTodayKey,
		isSingleDay,
		selectedPresetState,
		type DateFilterType,
		type TimePreset,
		TIME_PRESET_RANGES
	} from '$lib/stores/dateRange.svelte';
	import { ordersState } from '$lib/stores/orders.svelte';
	import { deliveriesState } from '$lib/stores/deliveries.svelte';
	import OrdersChartContent from '$lib/components/OrdersChartContent.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';
	import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

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

	// Ordre correspondant à la navigation du widget : 7 derniers jours, Hier, Aujourd'hui, Demain, 7 prochains jours, Personnalisé
	const PRESETS: { label: string; getRange?: () => DateRange; allPeriod?: boolean; isCustom?: boolean }[] = [
		{ label: '7 derniers jours', getRange: () => { const end = today(getLocalTimeZone()); const start = end.subtract({ days: 6 }); return { start, end }; } },
		{ label: 'Hier', getRange: () => { const t = today(getLocalTimeZone()).subtract({ days: 1 }); return { start: t, end: t }; } },
		{ label: "Aujourd'hui", getRange: () => { const t = today(getLocalTimeZone()); return { start: t, end: t }; } },
		{ label: 'Demain', getRange: () => { const t = today(getLocalTimeZone()).add({ days: 1 }); return { start: t, end: t }; } },
		{ label: '7 prochains jours', getRange: () => { const start = today(getLocalTimeZone()); const end = start.add({ days: 6 }); return { start, end }; } },
		{ label: 'Personnalisé', isCustom: true }
	];

	interface Props {
		onDateFilterChange?: (type: DateFilterType) => void | Promise<void>;
		collapsed?: boolean;
		onToggle?: () => void;
		showCloseButton?: boolean;
	}

	let { onDateFilterChange, collapsed = false, onToggle, showCloseButton = true }: Props = $props();

	let chartOpen = $state(false);
	let chartVariant = $state<'order' | 'delivery'>('order');

	const periodKeys = $derived(getDateRangeDayKeys());
	/** En affichage journée (un seul jour) : tranches 4h ; sinon jours. */
	const chartPeriodKeys = $derived(
		isSingleDay() && periodKeys.length === 1
			? getDateRangeFourHourSlotKeys(periodKeys[0]!).keys
			: periodKeys
	);
	const chartLabels = $derived(
		isSingleDay() && periodKeys.length === 1
			? getDateRangeFourHourSlotKeys(periodKeys[0]!).labels
			: periodKeys.map((key) => {
					const [, m, d] = key.split('-');
					return `${Number(d)} ${MONTH_LABELS[Number(m) - 1]}`;
				})
	);
	/** Index de la barre « maintenant » : tranche 4h courante (journée) ou jour aujourd’hui (multi-jours). */
	const chartCurrentBarIndex = $derived(
		isSingleDay() && periodKeys.length === 1
			? getCurrentFourHourSlotIndex(periodKeys[0]!)
			: periodKeys.length > 0
				? (() => {
						const idx = periodKeys.indexOf(getTodayKey());
						return idx >= 0 ? idx : null;
					})()
				: null
	);
	const ordersInPeriod = $derived.by(() => {
		if (!periodKeys.length) return [];
		const set = new Set(periodKeys);
		return ordersState.items.filter((o) => set.has((o.orderDate ?? '').toString().slice(0, 10)));
	});
	const deliveriesInPeriod = $derived.by(() => {
		if (!periodKeys.length) return [];
		const set = new Set(periodKeys);
		return deliveriesState.routes.filter((d) => set.has((d.createdAt ?? '').toString().slice(0, 10)));
	});

	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return '…';
		const same = start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		// Ne plus afficher les heures puisque la plage horaire est désactivée
		if (same) return fmt(start);
		return `${fmt(start)} – ${fmt(end)}`;
	}

	function applyPreset(preset: (typeof PRESETS)[0], index: number) {
		dateRangeActions.setSelectedPresetIndex(index);
		if (preset.isCustom) {
			// Raccourci "Personnalisé" : ne rien faire, l'utilisateur sélectionnera via le calendrier
		} else if (preset.getRange) {
			// Désactiver la plage horaire lors de la sélection d'un raccourci
			dateRangeActions.setTimeRange(null);
			dateRangeActions.setTimePreset('journee');
			dateRangeActions.setUseManualTime(false);
			dateRangeActions.setDateRange(preset.getRange());
		}
	}

	function handleCalendarDateChange(value: DateRange | undefined) {
		if (!value || (value.start === undefined && value.end === undefined)) {
			dateRangeActions.setAllPeriod();
			dateRangeActions.setSelectedPresetIndex(null);
			return;
		}
		
		// Limiter la sélection à 1 jour : utiliser la date de début comme date de fin
		const singleDate = value.start ?? value.end;
		if (singleDate) {
			const singleDayRange: DateRange = { start: singleDate, end: singleDate };
			dateRangeActions.setSelectedPresetIndex(6); // Index du raccourci "Personnalisé"
			dateRangeActions.setTimeRange(null);
			dateRangeActions.setTimePreset('journee');
			dateRangeActions.setUseManualTime(false);
			dateRangeActions.setDateRange(singleDayRange);
		}
	}

	async function handleDateFilterChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value as DateFilterType;
		dateRangeActions.setDateFilter(value);
		await onDateFilterChange?.(value);
	}

	async function handleTimeChange() {
		await onDateFilterChange?.(dateRangeState.dateFilter);
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
			<div class="flex items-center gap-1">
				<h2 class="font-semibold text-sm flex items-center gap-2">
					<CalendarIcon class="size-4 text-muted-foreground" />
					Période
				</h2>
				<Button
					variant={chartOpen ? 'secondary' : 'ghost'}
					size="icon"
					class="h-8 w-8 shrink-0"
					aria-label={chartOpen ? 'Masquer le graphique' : 'Afficher le graphique'}
					title={chartOpen ? 'Masquer le graphique' : 'Afficher le graphique'}
					onclick={() => (chartOpen = !chartOpen)}
				>
					<BarChart3Icon class="size-4" />
				</Button>
			</div>
			{#if showCloseButton && onToggle}
				<Button variant="ghost" size="icon" class="h-8 w-8" onclick={onToggle} aria-label="Fermer le panneau">
					<XIcon class="size-4" />
				</Button>
			{/if}
		</div>
		<div class="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
			{#if chartOpen}
				<!-- Vue graphique : remplace le calendrier -->
				<div class="flex flex-col gap-3">
					<div class="flex gap-1 rounded-md border border-border bg-muted/30 p-1">
						<Button
							variant={chartVariant === 'order' ? 'secondary' : 'ghost'}
							size="sm"
							class="h-8 flex-1 text-xs"
							onclick={() => (chartVariant = 'order')}
						>
							Commandes
						</Button>
						<Button
							variant={chartVariant === 'delivery' ? 'secondary' : 'ghost'}
							size="sm"
							class="h-8 flex-1 text-xs"
							onclick={() => (chartVariant = 'delivery')}
						>
							Livraisons
						</Button>
					</div>
					<div class="min-w-0">
						{#if chartVariant === 'order'}
							<OrdersChartContent
								variant="order"
								horizontal={true}
								loading={ordersState.loading && !ordersInPeriod.length}
								labels={chartLabels}
								values={[]}
								orders={ordersInPeriod}
								periodKeys={chartPeriodKeys}
								currentBarIndex={chartCurrentBarIndex}
								byHour={false}
								byMonth={false}
								emptyMessage="Sélectionnez une plage pour afficher le graphique."
							/>
						{:else}
							<OrdersChartContent
								variant="delivery"
								horizontal={true}
								loading={deliveriesState.loading && !deliveriesInPeriod.length}
								labels={chartLabels}
								values={[]}
								deliveries={deliveriesInPeriod}
								periodKeys={chartPeriodKeys}
								currentBarIndex={chartCurrentBarIndex}
								byHour={false}
								byMonth={false}
								emptyMessage="Sélectionnez une plage pour afficher le graphique."
							/>
						{/if}
					</div>
				</div>
			{:else}
				<!-- Vue calendrier -->
				<div>
					<p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Raccourcis</p>
					<div class="flex flex-col gap-1">
						{#each PRESETS as preset, index}
							<Button 
								variant={selectedPresetState.index === index ? "secondary" : "ghost"} 
								size="sm" 
								class="justify-start font-normal h-9" 
								onclick={() => applyPreset(preset, index)}
							>
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
						onValueChange={handleCalendarDateChange}
					/>
				</div>
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
			{/if}
		</div>
	</aside>
{/if}
