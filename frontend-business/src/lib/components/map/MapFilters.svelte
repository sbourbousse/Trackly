<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Separator } from '$lib/components/ui/separator';
	import { mapFilters, type OrderStatus, type DeliveryStatus } from '$lib/stores/mapFilters.svelte';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import UsersIcon from '@lucide/svelte/icons/users';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import SlidersHorizontalIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	const orderStatuses: { key: OrderStatus; label: string; color: string }[] = [
		{ key: 'pending', label: 'En attente', color: 'bg-sky-500' },
		{ key: 'planned', label: 'Prévue', color: 'bg-blue-500' },
		{ key: 'inTransit', label: 'En cours', color: 'bg-amber-500' },
		{ key: 'delivered', label: 'Livrée', color: 'bg-emerald-500' },
		{ key: 'cancelled', label: 'Annulée', color: 'bg-destructive' }
	];

	const deliveryStatuses: { key: DeliveryStatus; label: string; color: string }[] = [
		{ key: 'pending', label: 'En attente', color: 'bg-sky-500' },
		{ key: 'inProgress', label: 'En cours', color: 'bg-amber-500' },
		{ key: 'completed', label: 'Terminée', color: 'bg-emerald-500' },
		{ key: 'failed', label: 'Échouée', color: 'bg-destructive' }
	];

	let expanded = $state(false);
</script>

{#if expanded}
<div class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg border shadow-md p-3 space-y-3 min-w-[200px] max-w-[calc(100vw-2rem)]">
	<!-- Header avec bouton replier -->
	<div class="flex items-center justify-between gap-2">
		<h3 class="font-semibold text-sm flex items-center gap-2 shrink-0">
			<EyeIcon class="size-4" />
			<span class="hidden sm:inline">Filtres de visibilité</span>
		</h3>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => mapFilters.showAll()}>
				Tout
			</Button>
			<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => mapFilters.hideAll()}>
				Aucun
			</Button>
			<Button variant="ghost" size="sm" class="h-7 w-7 p-0" onclick={() => mapFilters.reset()} title="Réinitialiser">
				<RotateCcwIcon class="size-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="sm"
				class="h-7 w-7 p-0 shrink-0"
				onclick={() => (expanded = false)}
				aria-label="Replier les filtres"
				title="Replier"
			>
				<ChevronDownIcon class="size-4 rotate-90" />
			</Button>
		</div>
	</div>

	<Separator />

	<!-- Drivers Toggle -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<UsersIcon class="size-4 text-muted-foreground" />
			<span class="text-sm font-medium">Livreurs</span>
		</div>
		<Switch 
			checked={mapFilters.filters.showDrivers}
			onCheckedChange={() => mapFilters.toggleDrivers()}
			id="filter-drivers"
		/>
	</div>

	<Separator />

	<!-- Orders Section -->
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm font-medium">
			<PackageIcon class="size-4 text-muted-foreground" />
			<span>Commandes</span>
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each orderStatuses as status}
				{@const isActive = mapFilters.filters.orders[status.key]}
				<Button
					variant={isActive ? 'default' : 'outline'}
					size="sm"
					class="h-6 px-2 text-xs gap-1.5 transition-all"
					onclick={() => mapFilters.toggleOrderStatus(status.key)}
				>
					<span class="inline-block size-2 rounded-full {status.color}"></span>
					{status.label}
					{#if isActive}
						<EyeIcon class="size-3" />
					{:else}
						<EyeOffIcon class="size-3 opacity-50" />
					{/if}
				</Button>
			{/each}
		</div>
	</div>

	<Separator />

	<!-- Deliveries Section -->
	<div class="space-y-2">
		<div class="flex items-center gap-2 text-sm font-medium">
			<TruckIcon class="size-4 text-muted-foreground" />
			<span>Tournées</span>
		</div>
		<div class="flex flex-wrap gap-1.5">
			{#each deliveryStatuses as status}
				{@const isActive = mapFilters.filters.deliveries[status.key]}
				<Button
					variant={isActive ? 'default' : 'outline'}
					size="sm"
					class="h-6 px-2 text-xs gap-1.5 transition-all"
					onclick={() => mapFilters.toggleDeliveryStatus(status.key)}
				>
					<span class="inline-block size-2 rounded-full {status.color}"></span>
					{status.label}
					{#if isActive}
						<EyeIcon class="size-3" />
					{:else}
						<EyeOffIcon class="size-3 opacity-50" />
					{/if}
				</Button>
			{/each}
		</div>
	</div>
</div>
{:else}
	<!-- Bouton icône pour ouvrir les filtres (format mobile / compact) -->
	<Button
		variant="outline"
		size="icon"
		class="h-11 w-11 rounded-full shadow-lg bg-background border-2 border-border"
		onclick={() => (expanded = true)}
		aria-label="Ouvrir les filtres de visibilité"
		title="Filtres de visibilité"
	>
		<SlidersHorizontalIcon class="size-5" />
	</Button>
{/if}
