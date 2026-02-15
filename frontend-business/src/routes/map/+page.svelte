<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import Map from '$lib/components/Map.svelte';
	import {
		dateRangeActions,
		dateRangeState,
		getListFilters
	} from '$lib/stores/dateRange.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { mapFilters, isMarkerVisible } from '$lib/stores/mapFilters.svelte';
	import MapFilters from '$lib/components/map/MapFilters.svelte';
	import { getDelivery } from '$lib/api/deliveries';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { isOfflineMode } from '$lib/offline/config';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import type { TypedMapMarker } from '$lib/components/Map.svelte';

	const MAX_ORDER_MARKERS = 30;
	const MAX_DELIVERY_MARKERS = 20;

	const layerParam = $derived(page.url.searchParams.get('layer'));
	const hasPeriod = $derived(!!getListFilters().dateFrom && !!getListFilters().dateTo);

	let showOrders = $state(true);
	let showDeliveries = $state(true);
	let showDrivers = $state(true);

	let lastAppliedLayer = $state<string | null | undefined>(undefined);
	$effect(() => {
		const layer = layerParam;
		if (layer === lastAppliedLayer) return;
		lastAppliedLayer = layer ?? null;
		if (layer === 'orders') {
			showOrders = true;
			showDeliveries = false;
			showDrivers = false;
		} else if (layer === 'deliveries') {
			showOrders = false;
			showDeliveries = true;
			showDrivers = false;
		} else if (layer === 'drivers') {
			showOrders = false;
			showDeliveries = false;
			showDrivers = true;
		} else {
			showOrders = true;
			showDeliveries = true;
			showDrivers = true;
		}
	});

	let orderMarkersData = $state<Array<{ lat: number; lng: number; label: string; status: string }>>([]);
	let deliveryMarkersData = $state<Array<{ lat: number; lng: number; label: string; status: string; id: string }>>([]);
	let driverLabels = $state<Record<string, string>>({});
	let geocodingOrders = $state(false);
	let geocodingDeliveries = $state(false);
	let lastOrdersKey = $state('');
	let lastDeliveriesKey = $state('');

	const isInProgress = (s: string) => s === 'InProgress' || s === 'En cours';
	const inProgressIds = $derived(
		deliveriesState.routes.filter((r) => isInProgress(r.status)).map((r) => r.id)
	);

	const driverPoints = $derived(
		Object.entries(trackingState.pointsByDeliveryId)
			.filter(([, pt]) => pt && typeof pt.lat === 'number' && typeof pt.lng === 'number')
			.map(([deliveryId, pt]) => ({
				lat: pt.lat,
				lng: pt.lng,
				label: `${driverLabels[deliveryId] ?? 'Livreur'} – MAJ ${new Date(pt.updatedAt).toLocaleTimeString('fr-FR')}`,
				deliveryId
			}))
	);

	const markersList = $derived.by(() => {
		const list: TypedMapMarker[] = [];
		// Apply filters to orders
		for (const m of orderMarkersData) {
			if (isMarkerVisible('order', m.status, mapFilters.filters)) {
				list.push({
					lat: m.lat,
					lng: m.lng,
					label: m.label,
					type: 'order',
					status: m.status
				});
			}
		}
		// Apply filters to deliveries
		for (const m of deliveryMarkersData) {
			if (isMarkerVisible('delivery', m.status, mapFilters.filters)) {
				list.push({
					lat: m.lat,
					lng: m.lng,
					label: m.label,
					type: 'delivery',
					status: m.status,
					id: m.id
				});
			}
		}
		// Apply drivers filter
		if (mapFilters.filters.showDrivers) {
			for (const p of driverPoints) {
				list.push({
					lat: p.lat,
					lng: p.lng,
					label: p.label,
					type: 'driver'
				});
			}
		}
		return list;
	});

	$effect(() => {
		dateRangeState.dateRange;
		dateRangeState.dateFilter;
		ordersActions.loadOrders();
		deliveriesActions.loadDeliveries();
	});

	$effect(() => {
		if (!showOrders || !ordersState.items.length || !hasPeriod) {
			orderMarkersData = [];
			lastOrdersKey = '';
			return;
		}
		const key = ordersState.items.slice(0, MAX_ORDER_MARKERS).map((o) => o.id).join(',');
		if (key === lastOrdersKey) return;
		lastOrdersKey = key;
		geocodingOrders = true;
		const slice = ordersState.items.slice(0, MAX_ORDER_MARKERS);
		Promise.all(
			slice.map(async (order) => {
				const coords = await geocodeAddressCached(order.address);
				if (!coords) return null;
				return {
					lat: coords.lat,
					lng: coords.lng,
					label: `<b>${order.client}</b><br/>${order.address}<br/><a href="/orders/${order.id}">Voir la commande</a>`,
					status: order.status
				};
			})
		).then((results) => {
			orderMarkersData = results.filter((r): r is NonNullable<typeof r> => r != null);
		}).finally(() => {
			geocodingOrders = false;
		});
	});

	$effect(() => {
		if (!showDeliveries || !deliveriesState.routes.length || !hasPeriod) {
			deliveryMarkersData = [];
			lastDeliveriesKey = '';
			return;
		}
		const key = deliveriesState.routes.slice(0, MAX_DELIVERY_MARKERS).map((r) => r.id).join(',');
		if (key === lastDeliveriesKey) return;
		lastDeliveriesKey = key;
		geocodingDeliveries = true;
		const slice = deliveriesState.routes.slice(0, MAX_DELIVERY_MARKERS);
		Promise.all(slice.map((r) => getDelivery(r.id).catch(() => null))).then((details) => {
			const withAddress = details.filter((d): d is NonNullable<typeof d> => d != null && !!d.address);
			Promise.all(
				withAddress.map(async (d) => {
					const c = await geocodeAddressCached(d.address);
					if (!c) return null;
					return {
						lat: c.lat,
						lng: c.lng,
						label: `<b>${d.customerName}</b><br/>${d.address}<br/><a href="/deliveries/${d.id}">Voir la tournée</a>`,
						status: d.status,
						id: d.id
					};
				})
			).then((coords) => {
				deliveryMarkersData = coords.filter((r): r is NonNullable<typeof r> => r != null);
			}).finally(() => {
				geocodingDeliveries = false;
			});
		});
	});

	$effect(() => {
		if (inProgressIds.length === 0) return;
		Promise.all(inProgressIds.map((id) => getDelivery(id).catch(() => null))).then((details) => {
			const map: Record<string, string> = {};
			inProgressIds.forEach((id, i) => {
				const d = details[i];
				map[id] = d?.driverName ?? `Livraison ${id.slice(0, 8)}`;
			});
			driverLabels = map;
		});
	});

	$effect(() => {
		if (!showDrivers || inProgressIds.length === 0) return;
		if (!trackingState.isConnected && !trackingState.isConnecting) {
			trackingActions.connect().then(() => {
				setTimeout(() => {
					if (trackingState.isConnected && inProgressIds.length > 0) {
						trackingActions.joinDeliveryGroups(inProgressIds);
					}
				}, 200);
			});
		} else if (trackingState.isConnected && inProgressIds.length > 0) {
			trackingActions.joinDeliveryGroups(inProgressIds);
		}
	});

	onDestroy(() => {
		trackingActions.disconnect();
	});

</script>

<div class="relative flex h-full min-h-0 flex-col">
	{#if isOfflineMode()}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
			<Alert class="max-w-md">
				<AlertTitle>Mode démo</AlertTitle>
				<AlertDescription>
					La carte n'est pas disponible en mode démo. Connectez-vous avec un compte pour voir la carte et le suivi en temps réel.
				</AlertDescription>
			</Alert>
		</div>
	{:else}
	{#if ordersState.error || deliveriesState.error || trackingState.lastError}
		<div class="absolute left-2 right-2 top-16 z-[40] min-w-0 max-w-[calc(100%-1rem)] sm:left-4 sm:right-4">
			{#if ordersState.error}
				<Alert variant="destructive">
					<AlertTitle>Commandes</AlertTitle>
					<AlertDescription>{ordersState.error}</AlertDescription>
				</Alert>
			{/if}
			{#if deliveriesState.error}
				<Alert variant="destructive">
					<AlertTitle>Tournées</AlertTitle>
					<AlertDescription>{deliveriesState.error}</AlertDescription>
				</Alert>
			{/if}
			{#if trackingState.lastError}
				<Alert variant="destructive">
					<AlertTitle>Temps réel</AlertTitle>
					<AlertDescription>{trackingState.lastError}</AlertDescription>
				</Alert>
			{/if}
		</div>
	{/if}

	{#if !hasPeriod && (showOrders || showDeliveries || showDrivers)}
		<div class="absolute inset-0 z-[30] flex items-center justify-center bg-background/60">
			<Alert class="max-w-md">
				<AlertTitle>Période requise</AlertTitle>
				<AlertDescription>
					Utilisez le panneau « Période » à droite pour sélectionner une plage et afficher les commandes et tournées sur la carte.
				</AlertDescription>
			</Alert>
		</div>
	{/if}

	<div class="relative flex flex-1 min-h-0 min-w-0">
		<Map
			height="100%"
			markers={markersList}
		/>
		<div class="absolute bottom-4 left-4 z-[1100] max-w-[calc(100%-2rem)]">
			<MapFilters />
		</div>
	</div>
	{/if}
</div>
