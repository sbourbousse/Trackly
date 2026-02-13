<script lang="ts">
	import type { ComponentType } from 'svelte';
	import type { IconProps } from 'lucide-svelte';

	let { title, subtitle, icon } = $props<{
		title: string;
		subtitle?: string;
		icon?: ComponentType<IconProps>;
	}>();
</script>

<div class="space-y-1">
	<div class="flex items-center gap-2">
		{#if icon}
			<svelte:component this={icon} class="size-5 text-muted-foreground" />
		{/if}
		<h1 class="text-xl font-semibold tracking-tight">{title}</h1>
	</div>
	{#if subtitle}
		<p class="text-sm text-muted-foreground">{subtitle}</p>
	{/if}
</div>
