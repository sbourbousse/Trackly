<script lang="ts">
	/** Contenu du graphique commandes par heure/jour, à placer dans CollapsibleChartCard. */
	interface Props {
		loading?: boolean;
		labels?: string[];
		values?: number[];
		emptyMessage?: string;
	}
	let { loading = false, labels = [], values = [], emptyMessage = 'Sélectionnez une plage pour afficher le graphique.' }: Props = $props();

	const maxCount = $derived(values.length ? Math.max(...values, 1) : 1);
</script>

<div class="min-w-0 rounded-md border bg-muted/30 p-4">
	{#if loading}
		<div class="text-muted-foreground py-8 text-center text-sm">Chargement…</div>
	{:else if labels.length === 0}
		<div class="text-muted-foreground py-8 text-center text-sm">{emptyMessage}</div>
	{:else}
		<div class="min-w-0 overflow-x-auto" role="img" aria-label="Graphique commandes">
			<div
				class="flex items-end gap-0.5"
				style="min-width: {Math.max(100, labels.length * 10)}px"
			>
				{#each labels as label, i}
					<div
						class="bg-primary hover:bg-primary/90 min-w-[8px] flex-1 rounded-t transition-colors"
						style="height: {Math.max(4, ((values[i] ?? 0) / maxCount) * 120)}px"
						title="{label}: {values[i] ?? 0}"
					></div>
				{/each}
			</div>
		</div>
		<div class="text-muted-foreground mt-2 flex min-w-0 justify-between gap-2 text-xs">
			<span class="truncate">{labels[0] ?? ''}</span>
			<span class="shrink-0">{labels[labels.length - 1] ?? ''}</span>
		</div>
	{/if}
</div>
