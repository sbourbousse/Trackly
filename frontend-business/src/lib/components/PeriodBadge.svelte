<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import {
		dateRangeState,
		dateRangeUI,
		dateRangeActions,
		selectedPresetState
	} from '$lib/stores/dateRange.svelte';
	import { getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { cn } from '$lib/utils';
	import type { DateRange } from 'bits-ui';

	let { absolute = false } = $props();

	// Indices dans DateFilterSidebar PRESETS : 0=7 derniers jours, 1=Hier, 2=Aujourd'hui, 3=Demain, 4=7 prochains jours, 5=Personnalisé
	const NAVIGABLE_PRESET_INDICES = [0, 1, 2, 3, 4]; // 7 derniers jours, Hier, Aujourd'hui, Demain, 7 prochains jours
	
	function getPresetByIndex(index: number) {
		// Ordre correspondant à DateFilterSidebar PRESETS
		const PRESETS: { label: string; getRange?: () => DateRange; allPeriod?: boolean; isCustom?: boolean }[] = [
			{ label: '7 derniers jours', getRange: () => { const end = today(getLocalTimeZone()); const start = end.subtract({ days: 6 }); return { start, end }; } },
			{ label: 'Hier', getRange: () => { const t = today(getLocalTimeZone()).subtract({ days: 1 }); return { start: t, end: t }; } },
			{ label: "Aujourd'hui", getRange: () => { const t = today(getLocalTimeZone()); return { start: t, end: t }; } },
			{ label: 'Demain', getRange: () => { const t = today(getLocalTimeZone()).add({ days: 1 }); return { start: t, end: t }; } },
			{ label: '7 prochains jours', getRange: () => { const start = today(getLocalTimeZone()); const end = start.add({ days: 6 }); return { start, end }; } },
			{ label: 'Personnalisé', isCustom: true }
		];
		return PRESETS[index];
	}

	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		
		// Si c'est un raccourci (pas personnalisé), afficher le nom du raccourci
		if (selectedPresetState.index !== null && NAVIGABLE_PRESET_INDICES.includes(selectedPresetState.index)) {
			const preset = getPresetByIndex(selectedPresetState.index);
			return preset.label;
		}
		
		// Sinon (sélection personnalisée), afficher la date formatée
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return '…';
		const same = start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		if (same) return fmt(start);
		return `${fmt(start)} – ${fmt(end)}`;
	}

	type PeriodTone = 'past' | 'present' | 'future';

	function toLocalDayMs(d: DateValue): number {
		const js = d.toDate(getLocalTimeZone());
		return new Date(js.getFullYear(), js.getMonth(), js.getDate(), 0, 0, 0, 0).getTime();
	}

	const periodTone = $derived.by((): PeriodTone => {
		// Presets connus : mapping direct pour une UX stable
		if (selectedPresetState.index === 0 || selectedPresetState.index === 1) return 'past';
		if (selectedPresetState.index === 2) return 'present';
		if (selectedPresetState.index === 3 || selectedPresetState.index === 4) return 'future';

		// Personnalisé : déduction selon la plage de dates
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return 'present';
		const todayMs = toLocalDayMs(today(getLocalTimeZone()));
		const startMs = toLocalDayMs(start);
		const endMs = toLocalDayMs(end);
		if (endMs < todayMs) return 'past';
		if (startMs > todayMs) return 'future';
		return 'present';
	});

	const toneClasses = $derived.by(() => {
		switch (periodTone) {
			case 'past':
				return {
					container: 'border-amber-300/70 dark:border-amber-700/50',
					badge:
						'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
					activeDot: 'bg-amber-500'
				};
			case 'future':
				return {
					container: 'border-sky-300/70 dark:border-sky-700/50',
					badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
					activeDot: 'bg-sky-500'
				};
			default:
				return {
					container: 'border-emerald-300/70 dark:border-emerald-700/50',
					badge:
						'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
					activeDot: 'bg-emerald-500'
				};
		}
	});

	function handlePrevious() {
		let currentNavIndex = 2; // Commencer par "Aujourd'hui" si pas de sélection
		if (selectedPresetState.index !== null && NAVIGABLE_PRESET_INDICES.includes(selectedPresetState.index)) {
			currentNavIndex = NAVIGABLE_PRESET_INDICES.indexOf(selectedPresetState.index);
		}
		
		// Aller au précédent dans la liste navigable (ne pas boucler)
		if (currentNavIndex > 0) {
			currentNavIndex--;
			const newPresetIndex = NAVIGABLE_PRESET_INDICES[currentNavIndex];
			dateRangeActions.setSelectedPresetIndex(newPresetIndex);
			
			const preset = getPresetByIndex(newPresetIndex);
			if (preset.getRange) {
				// Désactiver la plage horaire lors de la sélection d'un raccourci
				dateRangeActions.setTimeRange(null);
				dateRangeActions.setTimePreset('journee');
				dateRangeActions.setUseManualTime(false);
				dateRangeActions.setDateRange(preset.getRange());
			}
		}
	}

	function handleNext() {
		let currentNavIndex = 2; // Commencer par "Aujourd'hui" si pas de sélection
		if (selectedPresetState.index !== null && NAVIGABLE_PRESET_INDICES.includes(selectedPresetState.index)) {
			currentNavIndex = NAVIGABLE_PRESET_INDICES.indexOf(selectedPresetState.index);
		}
		
		// Aller au suivant dans la liste navigable (ne pas boucler)
		if (currentNavIndex < NAVIGABLE_PRESET_INDICES.length - 1) {
			currentNavIndex++;
			const newPresetIndex = NAVIGABLE_PRESET_INDICES[currentNavIndex];
			dateRangeActions.setSelectedPresetIndex(newPresetIndex);
			
			const preset = getPresetByIndex(newPresetIndex);
			if (preset.getRange) {
				// Désactiver la plage horaire lors de la sélection d'un raccourci
				dateRangeActions.setTimeRange(null);
				dateRangeActions.setTimePreset('journee');
				dateRangeActions.setUseManualTime(false);
				dateRangeActions.setDateRange(preset.getRange());
			}
		}
	}

	// Déterminer si on est au début ou à la fin de la liste navigable
	const currentNavIndex = $derived.by(() => {
		if (selectedPresetState.index === null || !NAVIGABLE_PRESET_INDICES.includes(selectedPresetState.index)) {
			return null;
		}
		return NAVIGABLE_PRESET_INDICES.indexOf(selectedPresetState.index);
	});

	const isFirst = $derived(currentNavIndex === 0); // 7 derniers jours
	const isLast = $derived(currentNavIndex === NAVIGABLE_PRESET_INDICES.length - 1); // 7 prochains jours
</script>

<div class={cn(
	absolute 
		? "absolute left-1/2 top-2 -translate-x-1/2 z-[1100]" 
		: "flex justify-center mb-4"
)}>
	<div class="flex w-[360px] max-w-[calc(100vw-1rem)] flex-col items-center gap-1.5">
		<div class={cn(
			"inline-flex w-full items-center gap-1.5 rounded-full border bg-gradient-to-r from-card via-background to-card px-2 py-1.5 shadow-sm backdrop-blur",
			toneClasses.container
		)}>
			<button
				type="button"
				onclick={handlePrevious}
				disabled={isFirst}
				class={cn(
					"inline-flex items-center justify-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					isFirst
						? "cursor-not-allowed opacity-35"
						: "cursor-pointer hover:bg-accent hover:text-accent-foreground"
				)}
				aria-label="Période précédente"
			>
				<ChevronLeftIcon class="size-4 text-muted-foreground" />
			</button>
			<Badge variant="secondary" class={cn("h-6 flex-1 justify-center px-3 text-xs font-normal border-0 truncate", toneClasses.badge)}>
				{formatRangeLabel()}
			</Badge>
			<button
				type="button"
				onclick={handleNext}
				disabled={isLast}
				class={cn(
					"inline-flex items-center justify-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
					isLast
						? "cursor-not-allowed opacity-35"
						: "cursor-pointer hover:bg-accent hover:text-accent-foreground"
				)}
				aria-label="Période suivante"
			>
				<ChevronRightIcon class="size-4 text-muted-foreground" />
			</button>
		</div>

		<!-- Indicateur discret du preset actif (7j-, hier, aujourd'hui, demain, 7j+) -->
		<div class="flex items-center gap-1.5">
			{#each NAVIGABLE_PRESET_INDICES as _, i}
				<span
					class={cn(
						"size-1.5 rounded-full transition-all",
						currentNavIndex === i
							? `${toneClasses.activeDot} scale-110`
							: "bg-muted-foreground/30"
					)}
					aria-hidden="true"
				/>
			{/each}
		</div>
	</div>
</div>
