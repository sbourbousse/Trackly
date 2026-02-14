<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { mapFiltersActions, mapFiltersState, isOrderStatusVisible, isDeliveryStatusVisible } from '$lib/stores/mapFilters.svelte';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PackageIcon from '@lucide/svelte/icons/package';

	// Configuration des statuts avec labels et couleurs
	const orderStatuses = [
		{ key: 'pending', label: 'En attente', color: 'bg-gray-500' },
		{ key: 'planned', label: 'Prévue', color: 'bg-blue-500' },
		{ key: 'inTransit', label: 'En cours', color: 'bg-yellow-500' },
		{ key: 'delivered', label: 'Livrée', color: 'bg-green-500' },
		{ key: 'cancelled', label: 'Annulée', color: 'bg-red-500' }
	] as const;

	const deliveryStatuses = [
		{ key: 'pending', label: 'En attente', color: 'bg-gray-500' },
		{ key: 'inProgress', label: 'En cours', color: 'bg-yellow-500' },
		{ key: 'completed', label: 'Terminée', color: 'bg-green-500' },
		{ key: 'failed', label: 'Échouée', color: 'bg-red-500' }
	] as const;
</script>

<div class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg shadow-sm p-3 space-y-3 w-[280px]">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Filtres de la carte</h3>
		<div class="flex gap-1">
			<Button
				variant="ghost"
				size="icon"
				class="h-7 w-7"
				onclick={() => mapFiltersActions.showAll()}
				title="Tout afficher"
			>
				<EyeIcon class="size-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="h-7 w-7"
				onclick={() => mapFiltersActions.hideAll()}
				title="Tout masquer"
			>
				<EyeOffIcon class="size-4" />
			</Button>
			{#if !mapFiltersState.isDefault}
				<Button
					variant="ghost"
					size="icon"
					class="h-7 w-7"
					onclick={() => mapFiltersActions.reset()}
					title="Réinitialiser"
				>
					<RotateCcwIcon class="size-4" />
				</Button>
			{/if}
		</div>
	</div>

	<Separator />

	<!-- Commandes -->
	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<ClipboardListIcon class="size-4 text-muted-foreground" />
			<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Commandes</h4>
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each orderStatuses as status}
				{@const isActive = mapFiltersState.filters.orders[status.key]}
				<button
					class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 border {isActive ? 'opacity-100' : 'opacity-40 grayscale'}"
					class:bg-gray-100={!isActive}
					class:dark:bg-gray-800={!isActive}
					onclick={() => mapFiltersActions.toggleOrderStatus(status.key)}
					title={isActive ? 'Cliquez pour masquer' : 'Cliquez pour afficher'}
				>
					<span class="w-2 h-2 rounded-full {status.color}"></span>
					<span>{status.label}</span>
					{#if isActive}
						<EyeIcon class="size-3 ml-0.5" />
					{:else}
						<EyeOffIcon class="size-3 ml-0.5" />
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<Separator />

	<!-- Livraisons -->
	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<PackageIcon class="size-4 text-muted-foreground" />
			<h4 class="text-xs font-medium text-muted-foreground uppercase tracking-wide">Livraisons</h4>
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each deliveryStatuses as status}
				{@const isActive = mapFiltersState.filters.deliveries[status.key]}
				<button
					class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 border {isActive ? 'opacity-100' : 'opacity-40 grayscale'}"
					class:bg-gray-100={!isActive}
					class:dark:bg-gray-800={!isActive}
					onclick={() => mapFiltersActions.toggleDeliveryStatus(status.key)}
					title={isActive ? 'Cliquez pour masquer' : 'Cliquez pour afficher'}
				>
					<span class="w-2 h-2 rounded-full {status.color}"></span>
					<span>{status.label}</span>
					{#if isActive}
						<EyeIcon class="size-3 ml-0.5" />
					{:else}
						<EyeOffIcon class="size-3 ml-0.5" />
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<Separator />

	<!-- Livreurs -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<UsersIcon class="size-4 text-muted-foreground" />
			<span class="text-sm font-medium">Livreurs en temps réel</span>
		</div>
		<Switch
			checked={mapFiltersState.filters.showDrivers}
			onCheckedChange={() => mapFiltersActions.toggleDrivers()}
			aria-label="Afficher les livreurs"
		/>
	</div>
</div>
