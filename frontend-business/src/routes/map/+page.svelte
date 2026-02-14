<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import Map from '$lib/components/Map.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import {
		dateRangeActions,
		dateRangeState,
		dateRangeUI,
		getListFilters
	} from '$lib/stores/dateRange.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { mapFilters, isMarkerVisible } from '$lib/stores/mapFilters.svelte';
	import MapFilters from '$lib/components/map/MapFilters.svelte';
	import { getDelivery } from '$lib/api/deliveries';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import type { TypedMapMarker } from '$lib/components/Map.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import UsersIcon from '@lucide/svelte/icons/users';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	const MAX_ORDER_MARKERS = 30;
	const MAX_DELIVERY_MARKERS = 20;

	const PRESETS: { label: string; getRange?: () => DateRange; allPeriod?: boolean }[] = [
		{ label: 'Toute période', allPeriod: true },
		{ label: "Aujourd'hui", getRange: () => { const t = today(getLocalTimeZone()); return { start: t, end: t }; } },
		{ label: 'Demain', getRange: () => { const t = today(getLocalTimeZone()).add({ days: 1 }); return { start: t, end: t }; } },
		{ label: '7 derniers jours', getRange: () => { const end = today(getLocalTimeZone()); const start = end.subtract({ days: 6 }); return { start, end }; } },
		{ label: '7 prochains jours', getRange: () => { const start = today(getLocalTimeZone()); const end = start.add({ days: 6 }); return { start, end }; } }
	];

	const layerParam = $derived(page.url.searchParams.get('layer'));
	const hasPeriod = $derived(!!getListFilters().dateFrom && !!getListFilters().dateTo);

	let showOrders = $state(true);
	let showDeliveries = $state(true);
	let showDrivers = $state(true);
	let periodOpen = $state(false);
	let actionsBarExpanded = $state(true);

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

	function formatRangeLabel(): string {
		if (!dateRangeUI.ready) return '…';
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return 'Toute période';
		const same = start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
		if (same) return fmt(start);
		return `${fmt(start)} – ${fmt(end)}`;
	}

	function applyPreset(preset: (typeof PRESETS)[0]) {
		if (preset.allPeriod) {
			dateRangeActions.setAllPeriod();
		} else if (preset.getRange) {
			dateRangeActions.setDateRange(preset.getRange());
		}
		periodOpen = false;
	}

	function onDateRangeChange(value: DateRange | undefined) {
		if (!value || (value.start === undefined && value.end === undefined)) {
			dateRangeActions.setAllPeriod();
		} else {
			dateRangeActions.setDateRange(value);
		}
	}
</script>

<div class="relative flex h-full min-h-0 flex-col">
	<!-- Barre d'actions en overlay : repliable, flex-wrap pour mobile -->
	<div
		class="map-actions-bar absolute left-2 right-2 top-4 z-[40] flex min-w-0 max-w-[calc(100%-1rem)] flex-wrap items-center gap-2 rounded-lg border bg-background/95 px-3 py-2 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:left-4 sm:right-4 sm:gap-3 sm:px-4 sm:py-3"
	>
		{#if actionsBarExpanded}
			<div class="flex w-full flex-wrap items-center gap-2 sm:flex-initial sm:w-auto sm:gap-3">
				<PopoverRoot bind:open={periodOpen}>
					<PopoverTrigger>
						{#snippet child({ props }: { props: Record<string, unknown> })}
							<Button variant="outline" size="sm" class="min-w-0 shrink-0 gap-2 font-normal" {...props}>
								<CalendarIcon class="size-4 shrink-0" />
								<span class="truncate">{formatRangeLabel()}</span>
								<ChevronDownIcon class="size-4 shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-auto p-0" align="start" sideOffset={6}>
						<div class="flex flex-col p-3">
							<p class="text-muted-foreground mb-2 text-xs font-medium uppercase">Raccourcis</p>
							{#each PRESETS as preset}
								<Button variant="ghost" size="sm" class="justify-start font-normal" onclick={() => applyPreset(preset)}>
									{preset.label}
								</Button>
							{/each}
							<div class="mt-3 border-t pt-3">
								<RangeCalendar
									numberOfMonths={1}
									value={dateRangeState.dateRange}
									placeholder={dateRangeState.dateRange.start ?? today(getLocalTimeZone())}
									onValueChange={onDateRangeChange}
								/>
							</div>
						</div>
					</PopoverContent>
				</PopoverRoot>
				<Button
					variant="ghost"
					size="sm"
					class="shrink-0"
					onclick={() => (actionsBarExpanded = false)}
					aria-label="Réduire le menu d'actions"
				>
					<ChevronUpIcon class="size-4" />
					<span class="sr-only sm:not-sr-only sm:ms-1">Réduire</span>
				</Button>
			</div>

			<div class="flex min-w-0 flex-wrap items-center gap-2 sm:gap-4">
				<div class="flex shrink-0 items-center gap-2">
					<Switch id="layer-orders" checked={showOrders} onCheckedChange={(v) => (showOrders = v === true)} />
					<Label for="layer-orders" class="cursor-pointer shrink-0 text-sm">Commandes</Label>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<Switch id="layer-deliveries" checked={showDeliveries} onCheckedChange={(v) => (showDeliveries = v === true)} />
					<Label for="layer-deliveries" class="cursor-pointer shrink-0 text-sm">Tournées</Label>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<Switch id="layer-drivers" checked={showDrivers} onCheckedChange={(v) => (showDrivers = v === true)} />
					<Label for="layer-drivers" class="cursor-pointer shrink-0 text-sm">Suivi livreurs</Label>
				</div>
			</div>

			<div class="text-muted-foreground flex min-w-0 flex-wrap items-center gap-2 text-xs sm:gap-3">
				<span class="flex shrink-0 items-center gap-1.5">
					<span class="inline-block size-3 rounded-full bg-sky-500" aria-hidden="true"></span>
					En attente / Prévue
				</span>
				<span class="flex shrink-0 items-center gap-1.5">
					<span class="inline-block size-3 rounded-full bg-amber-500" aria-hidden="true"></span>
					En cours / En transit
				</span>
				<span class="flex shrink-0 items-center gap-1.5">
					<span class="inline-block size-3 rounded-full bg-emerald-500" aria-hidden="true"></span>
					Livrée
				</span>
				<span class="flex shrink-0 items-center gap-1.5">
					<span class="inline-block size-3 rounded-full bg-destructive" aria-hidden="true"></span>
					Annulée / Échouée
				</span>
				{#if showDrivers && trackingState.isConnected}
					<span class="shrink-0 text-emerald-600 dark:text-emerald-400">● Connecté</span>
				{/if}
			</div>
		{:else}
			<Button
				variant="outline"
				size="sm"
				class="gap-2"
				onclick={() => (actionsBarExpanded = true)}
				aria-label="Ouvrir le menu d'actions"
			>
				<ChevronDownIcon class="size-4" />
				<span>Actions</span>
			</Button>
		{/if}
	</div>

	{#if ordersState.error || deliveriesState.error || trackingState.lastError}
		<div class="absolute left-2 right-2 top-24 z-[40] min-w-0 max-w-[calc(100%-1rem)] sm:left-4 sm:right-4">
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
					Sélectionnez une période dans la barre ci-dessus pour afficher les commandes et tournées sur la carte.
				</AlertDescription>
			</Alert>
		</div>
	{/if}

	<div class="relative flex-1 min-h-0">
		<Map
			height="100%"
			markers={markersList}
		/>
		
		<!-- Filtres de statut -->
		<div class="absolute bottom-4 left-4 z-[35] max-w-[calc(100%-2rem)]">
			<MapFilters />
		</div>
	</div>
</div>
