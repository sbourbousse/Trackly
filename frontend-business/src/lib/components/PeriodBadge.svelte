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
	<div class="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 shadow-sm">
		{#if !isFirst}
			<button
				type="button"
				onclick={handlePrevious}
				class={cn(
					"inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
				)}
				aria-label="Période précédente"
			>
				<ChevronLeftIcon class="size-4 text-muted-foreground" />
			</button>
		{/if}
		<Badge variant="secondary" class="h-6 px-3 text-xs font-normal border-0">
			{formatRangeLabel()}
		</Badge>
		{#if !isLast}
			<button
				type="button"
				onclick={handleNext}
				class={cn(
					"inline-flex items-center justify-center rounded-full p-1 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
				)}
				aria-label="Période suivante"
			>
				<ChevronRightIcon class="size-4 text-muted-foreground" />
			</button>
		{/if}
	</div>
</div>
