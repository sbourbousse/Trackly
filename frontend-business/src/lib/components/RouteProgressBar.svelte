<script lang="ts">
	/**
	 * Barre de progression tournée (X / Y livrées).
	 * Style aligné avec le lazy component App chauffeur de la landing.
	 */
	interface Props {
		completedCount: number;
		totalCount: number;
		/** Label optionnel (ex. "3 / 5 livrées"). Par défaut généré. */
		label?: string;
		/** Sous-texte optionnel (ex. "Prochain arrêt : 12 min"). */
		subLabel?: string;
	}

	let { completedCount = 0, totalCount = 0, label, subLabel }: Props = $props();

	const percent = $derived(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);
	const displayLabel = $derived(label ?? `${completedCount} / ${totalCount} livrées`);
</script>

<div class="space-y-2">
	<div class="flex items-center justify-between">
		<span class="text-sm font-medium text-muted-foreground">Tournée</span>
		<span class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
			{displayLabel}
		</span>
	</div>
	<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
		<div
			class="h-full rounded-full bg-primary transition-all duration-300"
			style="width: {percent}%"
			aria-valuenow={completedCount}
			aria-valuemin={0}
			aria-valuemax={totalCount}
			role="progressbar"
		/>
	</div>
	{#if subLabel}
		<p class="text-xs text-muted-foreground">{subLabel}</p>
	{/if}
</div>
