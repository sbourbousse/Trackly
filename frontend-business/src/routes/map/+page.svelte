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
	import { settingsState } from '$lib/stores/settings.svelte';
	import MapFilters from '$lib/components/map/MapFilters.svelte';
	import { getDelivery } from '$lib/api/deliveries';
	import { getRoutes, getRouteGeometry, getIsochrones, type ApiRoute } from '$lib/api/routes';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { isOfflineMode } from '$lib/offline/config';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import PeriodBadge from '$lib/components/PeriodBadge.svelte';
	import type { TypedMapMarker } from '$lib/components/Map.svelte';

	const MAX_ORDER_MARKERS = 30;

	const layerParam = $derived(page.url.searchParams.get('layer'));
	const hasPeriod = $derived(!!getListFilters().dateFrom && !!getListFilters().dateTo);

	let showOrders = $state(true);
	let showDeliveries = $state(true);
	let showDrivers = $state(true);

	/** Couleurs des tracés par statut de tournée (pastilles). */
	const ROUTE_TRACE_COLORS: Record<string, string> = {
		planned: '#3b82f6',
		inProgress: '#f59e0b',
		completed: '#10b981'
	};

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
	let driverLabels = $state<Record<string, string>>({});
	let geocodingOrders = $state(false);
	let lastOrdersKey = $state('');
	let routePolylines = $state<{ coordinates: [number, number][]; color?: string; status?: string; routeId?: string }[]>([]);
	let isochronePolygons = $state<{ coordinates: [number, number][]; minutes?: number }[]>([]);
	let isochronesLoading = $state(false);
	let isochronesMessage = $state<string | null>(null);
	let routesList = $state<ApiRoute[]>([]);
	let selectedRouteIds = $state<Set<string>>(new Set());
	let routesLoading = $state(false);
	let routesPanelOpen = $state(false);

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
				
				// Fonctions utilitaires pour le tooltip
				function getTimeSlot(orderDate: string | null | undefined): string {
					if (!orderDate) return '—';
					try {
						const date = new Date(orderDate);
						if (Number.isNaN(date.getTime())) return '—';
						const hour = date.getHours();
						const slotStart = Math.floor(hour / 4) * 4;
						const slotEnd = slotStart + 4;
						return `${slotStart}h-${slotEnd}h`;
					} catch {
						return '—';
					}
				}
				
				function formatOrderDate(orderDate: string | null | undefined): string {
					if (!orderDate) return 'Non planifiée';
					try {
						const date = new Date(orderDate);
						if (Number.isNaN(date.getTime())) return 'Date invalide';
						return date.toLocaleDateString('fr-FR', {
							weekday: 'short',
							day: 'numeric',
							month: 'short',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						});
					} catch {
						return 'Date invalide';
					}
				}
				
				function getStatusLabel(status: string): string {
					const lower = (status ?? '').toLowerCase();
					if (lower === 'pending' || lower === 'en attente' || lower === '0') return 'En attente';
					if (lower === 'planned' || lower === 'planifiée' || lower === '1') return 'Planifiée';
					if (lower === 'intransit' || lower === 'en transit' || lower === 'en cours' || lower === '2') return 'En transit';
					if (lower === 'delivered' || lower === 'livrée' || lower === 'livree' || lower === '3') return 'Livrée';
					if (lower === 'cancelled' || lower === 'annulée' || lower === '4') return 'Annulée';
					return 'Inconnu';
				}
				
				const timeSlot = getTimeSlot(order.orderDate);
				const formattedDate = formatOrderDate(order.orderDate);
				const statusLabel = getStatusLabel(order.status);
				
				// Déterminer la couleur du statut pour le badge
				function getStatusColor(status: string): string {
					const lower = (status ?? '').toLowerCase();
					if (lower === 'pending' || lower === 'en attente' || lower === '0') return '#6b7280';
					if (lower === 'planned' || lower === 'planifiée' || lower === '1') return '#3b82f6';
					if (lower === 'intransit' || lower === 'en transit' || lower === 'en cours' || lower === '2') return '#f59e0b';
					if (lower === 'delivered' || lower === 'livrée' || lower === 'livree' || lower === '3') return '#10b981';
					if (lower === 'cancelled' || lower === 'annulée' || lower === '4') return '#ef4444';
					return '#6b7280';
				}
				
				const statusColor = getStatusColor(order.status);
				
				const label = `
					<div style="min-width: 220px; max-width: 320px; font-family: system-ui, -apple-system, sans-serif;">
						<div style="font-weight: 600; font-size: 15px; margin-bottom: 6px; color: #111827;">
							${order.client}
						</div>
						${order.ref ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 500;">Ref: ${order.ref}</div>` : ''}
						<div style="font-size: 12px; color: #374151; margin-bottom: 10px; line-height: 1.5;">
							${order.address}
						</div>
						<div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
							<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
								<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${statusColor};"></span>
								<span style="font-size: 11px; color: #374151;">
									<strong>Statut:</strong> <span style="color: #6b7280;">${statusLabel}</span>
								</span>
							</div>
							<div style="font-size: 11px; color: #374151; margin-bottom: 6px;">
								<strong>Date:</strong> <span style="color: #6b7280;">${formattedDate}</span>
							</div>
							${timeSlot !== '—' ? `<div style="font-size: 11px; color: #374151; margin-bottom: 6px;">
								<strong>Tranche:</strong> <span style="color: #6b7280;">${timeSlot}</span>
							</div>` : ''}
							${order.phoneNumber ? `<div style="font-size: 11px; color: #374151; margin-bottom: 6px;">
								<strong>Tél:</strong> <a href="tel:${order.phoneNumber}" style="color: #3b82f6; text-decoration: none;">${order.phoneNumber}</a>
							</div>` : ''}
							${order.deliveries > 0 ? `<div style="font-size: 11px; color: #374151; margin-bottom: 6px;">
								<strong>Livraisons:</strong> <span style="color: #6b7280;">${order.deliveries}</span>
							</div>` : ''}
							${order.internalComment ? `<div style="font-size: 11px; color: #374151; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f3f4f6;">
								<strong>Note:</strong> <span style="color: #6b7280; font-style: italic;">${order.internalComment}</span>
							</div>` : ''}
						</div>
						<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
							<a href="/orders/${order.id}" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; gap: 4px;">
								Voir la commande <span style="font-size: 14px;">→</span>
							</a>
						</div>
					</div>
				`;
				
				return {
					lat: coords.lat,
					lng: coords.lng,
					label,
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

	/** Détermine le statut d'affichage d'une tournée : planned | inProgress | completed. */
	function getRouteTraceStatus(route: {
		statusSummary: { pending: number; inProgress: number; completed: number };
		deliveryCount: number;
	}): 'planned' | 'inProgress' | 'completed' {
		const { statusSummary, deliveryCount } = route;
		if (statusSummary.inProgress > 0) return 'inProgress';
		if (deliveryCount > 0 && statusSummary.completed === deliveryCount) return 'completed';
		return 'planned';
	}

	// Charger la liste des routes pour le panneau de sélection
	$effect(() => {
		if (!hasPeriod) {
			routesList = [];
			selectedRouteIds = new Set();
			return;
		}
		const filters = getListFilters();
		if (!filters.dateFrom || !filters.dateTo) return;
		routesLoading = true;
		getRoutes({ dateFrom: filters.dateFrom, dateTo: filters.dateTo })
			.then((routes) => {
				routesList = routes;
				// Sélectionner toutes les routes par défaut
				if (selectedRouteIds.size === 0 && routes.length > 0) {
					selectedRouteIds = new Set(routes.map((r) => r.id));
				}
			})
			.catch(() => {
				routesList = [];
			})
			.finally(() => {
				routesLoading = false;
			});
	});

	// Charger les géométries des routes sélectionnées
	$effect(() => {
		const showTraces = mapFilters.filters.showRoutePolylines;
		const routeTraces = { ...mapFilters.filters.routeTraces };
		if (!showTraces || !hasPeriod || selectedRouteIds.size === 0) {
			routePolylines = [];
			return;
		}
		const filters = getListFilters();
		if (!filters.dateFrom || !filters.dateTo) return;
		const toLoad = routesList
			.filter((r) => selectedRouteIds.has(r.id))
			.map((r) => ({
				id: r.id,
				status: getRouteTraceStatus(r)
			}))
			.filter((r) => routeTraces[r.status]);
		Promise.all(
			toLoad.map(async (r) => {
				const geom = await getRouteGeometry(r.id);
				if (!geom?.coordinates?.length) return null;
				return {
					coordinates: geom.coordinates,
					status: r.status,
					color: ROUTE_TRACE_COLORS[r.status] ?? ROUTE_TRACE_COLORS.planned,
					routeId: r.id
				};
			})
		)
			.then((results) => {
				routePolylines = results.filter(
					(r): r is NonNullable<typeof r> => r != null && r.coordinates?.length > 0
				);
			})
			.catch(() => {
				routePolylines = [];
			});
	});

	function toggleRoute(routeId: string) {
		const newSet = new Set(selectedRouteIds);
		if (newSet.has(routeId)) {
			newSet.delete(routeId);
		} else {
			newSet.add(routeId);
		}
		selectedRouteIds = newSet;
	}

	function selectAllRoutes() {
		selectedRouteIds = new Set(routesList.map((r) => r.id));
	}

	function deselectAllRoutes() {
		selectedRouteIds = new Set();
	}

	$effect(() => {
		if (!mapFilters.filters.showIsochrones) {
			isochronePolygons = [];
			isochronesMessage = null;
			return;
		}
		isochronesLoading = true;
		isochronesMessage = null;
		getIsochrones('10,20,30')
			.then((res) => {
				if (res?.contours?.length) {
					isochronePolygons = res.contours.map((c) => ({
						coordinates: c.coordinates,
						minutes: c.minutes
					}));
					isochronesMessage = null;
				} else {
					isochronePolygons = [];
					isochronesMessage = res?.message ?? 'Aucun isochrone disponible. Vérifiez le siège social (paramètres).';
				}
			})
			.catch(() => {
				isochronePolygons = [];
				isochronesMessage = 'Erreur lors du chargement des isochrones.';
			})
			.finally(() => {
				isochronesLoading = false;
			});
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
	<PeriodBadge />
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
			headquarters={settingsState.headquarters}
			routePolylines={mapFilters.filters.showRoutePolylines ? routePolylines : []}
			isochronePolygons={mapFilters.filters.showIsochrones ? isochronePolygons : []}
			lockView={true}
			fitBoundsMaxZoom={11}
			tileTheme="stadia-alidade-smooth-dark"
		/>
		<div class="absolute bottom-4 left-4 z-[1100] flex flex-col gap-2 max-w-[calc(100%-2rem)]">
			{#if mapFilters.filters.showIsochrones && isochronesMessage && !isochronesLoading}
				<p class="text-xs text-muted-foreground max-w-[220px] rounded-md border bg-background/95 px-2 py-1.5">
					{isochronesMessage}
				</p>
			{/if}
			<MapFilters />
		</div>
		{#if mapFilters.filters.showRoutePolylines && hasPeriod}
			<div class="absolute bottom-4 right-4 z-[1100] flex flex-col items-end gap-2">
				{#if routesPanelOpen}
					<Card class="pb-6 w-80 max-w-[calc(100vw-2rem)]">
						<CardHeader class="pb-3">
							<div class="flex items-center justify-between">
								<CardTitle class="text-base">Tournées</CardTitle>
								<div class="flex gap-1">
									<Button
										variant="ghost"
										size="sm"
										class="h-7 text-xs"
										onclick={selectAllRoutes}
										disabled={routesLoading || routesList.length === 0}
									>
										Tout
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 text-xs"
										onclick={deselectAllRoutes}
										disabled={routesLoading || selectedRouteIds.size === 0}
									>
										Rien
									</Button>
									<Button
										variant="ghost"
										size="sm"
										class="h-7 w-7 p-0"
										onclick={() => (routesPanelOpen = false)}
										aria-label="Réduire"
									>
										<ChevronRightIcon class="size-4" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent class="pt-0">
						{#if routesLoading}
							<div class="py-4 text-center text-sm text-muted-foreground">Chargement...</div>
						{:else if routesList.length === 0}
							<div class="py-4 text-center text-sm text-muted-foreground">Aucune tournée</div>
						{:else}
							<div class="max-h-[400px] overflow-y-auto space-y-2">
								{#each routesList as route}
									<div
										class="flex items-start gap-2 rounded-md border p-2 hover:bg-muted/50 cursor-pointer transition-colors"
										onclick={() => toggleRoute(route.id)}
									>
										<Checkbox
											checked={selectedRouteIds.has(route.id)}
											onCheckedChange={() => toggleRoute(route.id)}
											onclick={(e) => e.stopPropagation()}
											class="mt-0.5"
										/>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2 mb-1">
												<span class="font-medium text-sm truncate">
													{route.name || `Tournée ${route.driverName}`}
												</span>
											</div>
											<div class="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
												{#if route.statusSummary.pending > 0}
													<Badge variant="outline" class="h-5 text-xs">
														{route.statusSummary.pending} en attente
													</Badge>
												{/if}
												{#if route.statusSummary.completed > 0}
													<Badge variant="outline" class="h-5 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
														{route.statusSummary.completed} livrée{route.statusSummary.completed > 1 ? 's' : ''}
													</Badge>
												{/if}
												{#if route.statusSummary.inProgress > 0}
													<Badge variant="outline" class="h-5 text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800">
														{route.statusSummary.inProgress} en cours
													</Badge>
												{/if}
												{#if route.deliveryCount === 0}
													<span class="text-muted-foreground">Aucune commande</span>
												{/if}
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
						</CardContent>
					</Card>
				{:else}
					<Button
						variant="outline"
						size="sm"
						class="h-9"
						onclick={() => (routesPanelOpen = true)}
					>
						<ChevronLeftIcon class="size-4 mr-2" />
						Tournées ({selectedRouteIds.size}/{routesList.length})
					</Button>
				{/if}
			</div>
		{/if}
	</div>
	{/if}
</div>
