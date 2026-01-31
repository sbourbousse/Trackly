<script lang="ts">
	let { title, subtitle } = $props<{
		title: string;
		subtitle?: string;
	}>();
</script>

<div class="space-y-1">
	<h1 class="text-xl font-semibold tracking-tight">{title}</h1>
	{#if subtitle}
		<p class="text-sm text-muted-foreground">{subtitle}</p>
	{/if}
</div>
