<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { getListFilters } from '$lib/stores/dateRange.svelte';
	import { getDelivery } from '$lib/api/deliveries';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	const MAX_MARKERS = 20;
	let markersData = $state<Array<{ lat: number; lng: number; label: string }>>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lastRoutesKey = $state('');

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		deliveriesActions.loadDeliveries();
	});

	async function loadMarkers() {
		const routes = deliveriesState.routes;
		if (!routes.length) {
			markersData = [];
			return;
		}
		loading = true;
		error = null;
		markersData = [];
		try {
			const slice = routes.slice(0, MAX_MARKERS);
			const details = await Promise.all(
				slice.map((r) => getDelivery(r.id).catch(() => null))
			);
			const withAddress = details.filter((d): d is NonNullable<typeof d> => d != null && !!d.address);
			const coords = await Promise.all(
				withAddress.map(async (d) => {
					const c = await geocodeAddressCached(d.address);
					if (!c) return null;
					return {
						lat: c.lat,
						lng: c.lng,
						label: `<b>${d.customerName}</b><br/>${d.address}<br/><a href="/deliveries/${d.id}">Voir la tournée</a>`
					};
				})
			);
			markersData = coords.filter((r): r is { lat: number; lng: number; label: string } => r != null);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const routes = deliveriesState.routes;
		if (routes.length === 0) {
			markersData = [];
			lastRoutesKey = '';
			return;
		}
		const key = routes.map((r) => r.id).join(',');
		if (key === lastRoutesKey) return;
		lastRoutesKey = key;
		loadMarkers();
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader
		title="Carte des tournées"
		subtitle="Visualisation des adresses des livraisons (période sélectionnée)."
	/>

	{#if deliveriesState.error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{deliveriesState.error}</AlertDescription>
		</Alert>
	{/if}
	{#if error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	{#if deliveriesState.loading && !deliveriesState.routes.length}
		<div class="py-12 text-center text-muted-foreground">Chargement des tournées...</div>
	{:else if !getListFilters().dateFrom || !getListFilters().dateTo}
		<Alert>
			<AlertTitle>Période requise</AlertTitle>
			<AlertDescription>
				Sélectionnez une période de dates dans le filtre en haut de la page pour afficher les tournées sur la carte.
			</AlertDescription>
		</Alert>
	{:else if !deliveriesState.routes.length}
		<div class="py-12 text-center text-muted-foreground">Aucune tournée sur cette période.</div>
	{:else}
		<div class="space-y-2">
			{#if loading && !markersData.length}
				<p class="text-sm text-muted-foreground">Chargement des adresses et géocodage…</p>
			{:else if markersData.length > 0}
				<p class="text-sm text-muted-foreground">
					{markersData.length} adresse{markersData.length > 1 ? 's' : ''} affichée{markersData.length > 1 ? 's' : ''}
					{deliveriesState.routes.length > MAX_MARKERS ? ` (max ${MAX_MARKERS})` : ''}
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
