<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';

	interface Props {
		title?: string;
		/** Fermé par défaut si true */
		defaultOpen?: boolean;
		children?: Snippet;
	}

	let { title = 'Commandes par heure', defaultOpen = false, children }: Props = $props();
	let open = $state(defaultOpen);
</script>

<Card class="min-w-0">
	<CardHeader class="flex flex-row items-center justify-between gap-2 space-y-0 py-4">
		<span class="text-muted-foreground text-sm font-medium">{title}</span>
		<Button
			variant="ghost"
			size="sm"
			class="gap-1.5 text-muted-foreground hover:text-foreground"
			onclick={() => (open = !open)}
			aria-expanded={open}
		>
			{#if open}
				<ChevronUpIcon class="size-4" aria-hidden="true" />
				Réduire
			{:else}
				<ChevronDownIcon class="size-4" aria-hidden="true" />
				Développer
			{/if}
		</Button>
	</CardHeader>
	{#if open}
		<CardContent class="min-w-0 pt-0">
			{@render children?.()}
		</CardContent>
	{/if}
</Card>
