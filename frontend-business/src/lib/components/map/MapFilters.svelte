<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { mapFilters, type OrderStatus, type DeliveryStatus } from '$lib/stores/mapFilters.svelte';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import UsersIcon from '@lucide/svelte/icons/users';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

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

	let expanded = $state(true);
</script>

<div class="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 rounded-lg border shadow-md p-3 space-y-3 min-w-[200px]">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="font-semibold text-sm flex items-center gap-2">
			<EyeIcon class="size-4" />
			Filtres de visibilité
		</h3>
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => mapFilters.showAll()}>
				Tout
			</Button>
			<Button variant="ghost" size="sm" class="h-7 px-2 text-xs" onclick={() => mapFilters.hideAll()}>
				<Aucun>Aucun</Aucun>
			</Button>
			<Button variant="ghost" size="sm" class="h-7 w-7 p-0" onclick={() => mapFilters.reset()} title="Réinitialiser">
				<RotateCcwIcon class="size-3.5" />
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
