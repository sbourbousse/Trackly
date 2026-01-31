<script lang="ts">
	import { onDestroy } from 'svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Map from '$lib/components/Map.svelte';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { getListFilters } from '$lib/stores/dateRange.svelte';
	import { getDelivery } from '$lib/api/deliveries';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	const isInProgress = (s: string) => s === 'InProgress' || s === 'En cours';
	let driverLabels = $state<Record<string, string>>({});
	let inProgressIds = $derived(
		deliveriesState.routes.filter((r) => isInProgress(r.status)).map((r) => r.id)
	);
	let markersForMap = $derived(
		Object.entries(trackingState.pointsByDeliveryId)
			.filter(([, pt]) => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number')
			.map(([deliveryId, pt]) => ({
				lat: pt.lat,
				lng: pt.lng,
				label: `${driverLabels[deliveryId] ?? 'Livreur'} – MAJ ${new Date(pt.updatedAt).toLocaleTimeString('fr-FR')}`,
				color: 'red' as const
			}))
	);

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		deliveriesActions.loadDeliveries();
	});

	$effect(() => {
		const ids = inProgressIds;
		if (ids.length === 0) return;
		Promise.all(ids.map((id) => getDelivery(id).catch(() => null))).then((details) => {
			const map: Record<string, string> = {};
			ids.forEach((id, i) => {
				const d = details[i];
				map[id] = d?.driverName ?? `Livraison ${id.slice(0, 8)}`;
			});
			driverLabels = map;
		});
	});

	$effect(() => {
		const ids = inProgressIds;
		if (ids.length === 0) return;
		if (!trackingState.isConnected && !trackingState.isConnecting) {
			trackingActions.connect().then(() => {
				if (trackingState.isConnected && ids.length > 0) {
					trackingActions.joinDeliveryGroups(ids);
				}
			});
		} else if (trackingState.isConnected && ids.length > 0) {
			trackingActions.joinDeliveryGroups(ids);
		}
	});

	onDestroy(() => {
		trackingActions.disconnect();
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader
		title="Carte des livreurs"
		subtitle="Position en temps réel des chauffeurs en tournée (SignalR)."
	/>

	{#if deliveriesState.error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{deliveriesState.error}</AlertDescription>
		</Alert>
	{/if}
	{#if trackingState.lastError}
		<Alert variant="destructive">
			<AlertTitle>Temps réel</AlertTitle>
			<AlertDescription>{trackingState.lastError}</AlertDescription>
		</Alert>
	{/if}

	{#if deliveriesState.loading && !deliveriesState.routes.length}
		<div class="py-12 text-center text-muted-foreground">Chargement des tournées...</div>
	{:else if !getListFilters().dateFrom || !getListFilters().dateTo}
		<Alert>
			<AlertTitle>Période requise</AlertTitle>
			<AlertDescription>
				Sélectionnez une période de dates dans le filtre en haut de la page pour afficher les tournées en cours.
			</AlertDescription>
		</Alert>
	{:else if inProgressIds.length === 0}
		<div class="py-12 text-center text-muted-foreground">
			Aucune tournée en cours sur cette période. Les positions des livreurs s'affichent lorsqu'une tournée est démarrée.
		</div>
	{:else}
		<div class="space-y-2">
			<div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
				{#if trackingState.isConnected}
					<span class="text-emerald-600 dark:text-emerald-400">● Connecté</span>
				{:else if trackingState.isConnecting}
					<span>Connexion en cours…</span>
				{/if}
				<span>{inProgressIds.length} tournée(s) en cours</span>
				{#if markersForMap.length > 0}
					<span>– {markersForMap.length} position(s) reçue(s)</span>
				{/if}
			</div>
			<div class="min-h-[500px] overflow-hidden rounded-lg border">
				<Map
					height="500px"
					deliveryMarkers={markersForMap}
				/>
			</div>
		</div>
	{/if}
</div>
