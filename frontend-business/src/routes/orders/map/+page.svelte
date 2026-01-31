<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { getListFilters } from '$lib/stores/dateRange.svelte';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	const MAX_MARKERS = 30;
	let markersData = $state<Array<{ lat: number; lng: number; label: string }>>([]);
	let geocoding = $state(false);
	let error = $state<string | null>(null);
	/** Clé pour ne déclencher le géocodage que quand la liste des commandes change (évite la boucle). */
	let lastItemsKey = $state('');

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		ordersActions.loadOrders();
	});

	$effect(() => {
		const items = ordersState.items;
		if (!items.length) {
			markersData = [];
			lastItemsKey = '';
			return;
		}
		const key = items.slice(0, MAX_MARKERS).map((o) => o.id).join(',');
		if (key === lastItemsKey) return;
		lastItemsKey = key;
		geocoding = true;
		error = null;
		markersData = [];
		const slice = items.slice(0, MAX_MARKERS);
		Promise.all(
			slice.map(async (order) => {
				const coords = await geocodeAddressCached(order.address);
				if (!coords) return null;
				return {
					lat: coords.lat,
					lng: coords.lng,
					label: `<b>${order.client}</b><br/>${order.address}<br/><a href="/orders/${order.id}">Voir la commande</a>`
				};
			})
		).then((results) => {
			markersData = results.filter((r): r is { lat: number; lng: number; label: string } => r != null);
		}).catch((err) => {
			error = err instanceof Error ? err.message : 'Erreur lors du géocodage';
		}).finally(() => {
			geocoding = false;
		});
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader
		title="Carte des commandes"
		subtitle="Visualisation des adresses de livraison des commandes (période sélectionnée)."
	/>

	{#if ordersState.error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{ordersState.error}</AlertDescription>
		</Alert>
	{/if}
	{#if error}
		<Alert variant="destructive">
			<AlertTitle>Géocodage</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if ordersState.loading && !ordersState.items.length}
		<div class="py-12 text-center text-muted-foreground">Chargement des commandes...</div>
	{:else if !getListFilters().dateFrom || !getListFilters().dateTo}
		<Alert>
			<AlertTitle>Période requise</AlertTitle>
			<AlertDescription>
				Sélectionnez une période de dates dans le filtre en haut de la page pour afficher les commandes sur la carte.
			</AlertDescription>
		</Alert>
	{:else if !ordersState.items.length}
		<div class="py-12 text-center text-muted-foreground">Aucune commande sur cette période.</div>
	{:else}
		<div class="space-y-2">
			{#if geocoding && !markersData.length}
				<p class="text-sm text-muted-foreground">Géocodage des adresses en cours…</p>
			{:else if markersData.length > 0}
				<p class="text-sm text-muted-foreground">
					{markersData.length} adresse{markersData.length > 1 ? 's' : ''} affichée{markersData.length > 1 ? 's' : ''}
					{ordersState.items.length > MAX_MARKERS ? ` (max ${MAX_MARKERS})` : ''}
				</p>
			{/if}
			<div class="min-h-[500px] overflow-hidden rounded-lg border">
				<Map
					height="500px"
					deliveryMarkers={markersData.map((m) => ({ lat: m.lat, lng: m.lng, label: m.label }))}
				/>
			</div>
		</div>
	{/if}
</div>
