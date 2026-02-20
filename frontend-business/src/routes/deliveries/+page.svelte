<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { DropdownMenu } from 'bits-ui';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import PackageIcon from '@lucide/svelte/icons/package';
	import RouteIcon from '@lucide/svelte/icons/route';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import { dateRangeState, getListFilters } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { deleteDeliveriesBatch } from '$lib/api/deliveries';
	import { getRoutes, type ApiRoute } from '$lib/api/routes';
	import { ordersActions } from '$lib/stores/orders.svelte';
	import RelativeTimeIndicator from '$lib/components/RelativeTimeIndicator.svelte';
	import RouteProgressIndicator from '$lib/components/RouteProgressIndicator.svelte';
	import PeriodBadge from '$lib/components/PeriodBadge.svelte';

	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { cn } from '$lib/utils';

	const TAB_DELIVERIES = 'deliveries';
	const TAB_ROUTES = 'routes';

	const tabFromUrl = $derived(page.url.searchParams.get('tab') || TAB_DELIVERIES);
	const activeTab = $derived(tabFromUrl === TAB_ROUTES ? TAB_ROUTES : TAB_DELIVERIES);

	function setTab(tab: string) {
		if (tab === TAB_ROUTES) goto('/deliveries?tab=routes', { replaceState: true });
		else goto('/deliveries', { replaceState: true });
	}

	let didInit = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	let statusFilter = $state<string | null>(null);
	let copiedTrackingDeliveryId = $state<string | null>(null);

	// URL de l'app frontend-tracking (configurable par variable d'environnement)
	const trackingAppUrl = import.meta.env.VITE_TRACKING_APP_URL || 'http://localhost:3001';

	function getClientTrackingUrl(deliveryId: string): string {
		const tenantId =
			typeof window !== 'undefined'
				? (localStorage.getItem('trackly_tenant_id') || sessionStorage.getItem('trackly_tenant_id'))
				: null;
		const base = `${trackingAppUrl}/tracking/${encodeURIComponent(deliveryId)}`;
		return tenantId ? `${base}?tenantId=${encodeURIComponent(tenantId)}` : base;
	}

	function openClientTracking(deliveryId: string) {
		window.open(getClientTrackingUrl(deliveryId), '_blank');
	}

	function openClientTrackingPopup(deliveryId: string) {
		const url = getClientTrackingUrl(deliveryId);
		const width = 430;
		const height = 820;
		const left = Math.max(0, Math.round((window.screen.width - width) / 2));
		const top = Math.max(0, Math.round((window.screen.height - height) / 2));

		const popup = window.open(
			url,
			'trackly-client-tracking-popup',
			`popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		// Fallback sur un onglet classique si la popup est bloquee.
		if (!popup) {
			window.open(url, '_blank');
			return;
		}

		popup.focus();
	}

	async function copyClientTrackingLink(deliveryId: string) {
		try {
			await navigator.clipboard.writeText(getClientTrackingUrl(deliveryId));
			copiedTrackingDeliveryId = deliveryId;
			setTimeout(() => {
				if (copiedTrackingDeliveryId === deliveryId) copiedTrackingDeliveryId = null;
			}, 2000);
		} catch (err) {
			console.error('Erreur lors de la copie du lien de suivi client:', err);
		}
	}

	function deliveryStatusToKey(s: string): string {
		const lower = (s ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'prevue' || lower === 'prévue' || lower === '0') return 'pending';
		if (lower === 'inprogress' || lower === 'en cours' || lower === '1') return 'inprogress';
		if (lower === 'completed' || lower === 'livrée' || lower === 'livree' || lower === '2') return 'completed';
		if (lower === 'failed' || lower === 'échouée' || lower === 'echouee' || lower === '3') return 'failed';
		return 'pending';
	}

	const urlRouteId = $derived(page.url.searchParams.get('routeId'));
	const urlDriverId = $derived(page.url.searchParams.get('driverId'));
	const urlDate = $derived(page.url.searchParams.get('date'));

	const filteredDeliveries = $derived.by(() => {
		let list = deliveriesState.routes;
		if (!urlRouteId && (urlDriverId || urlDate)) {
			list = list.filter((d) => {
				if (urlDriverId && d.driver !== urlDriverId) return false;
				if (urlDate && (d.createdAt?.slice(0, 10) ?? '') !== urlDate) return false;
				return true;
			});
		}
		if (!statusFilter) return list;
		return list.filter((d) => deliveryStatusToKey(d.status) === statusFilter);
	});

	const DELIVERY_STATUS_LABELS: Record<string, string> = {
		pending: 'Planifiée',
		inprogress: 'En cours',
		completed: 'Livrée',
		failed: 'Échouée'
	};

	function handleStatusClick(statusKey: string | null) {
		statusFilter = statusKey;
	}

	function clearStatusFilter() {
		statusFilter = null;
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		const routeId = page.url.searchParams.get('routeId') || undefined;
		deliveriesActions.loadDeliveries({ ...getListFilters(), routeId });
		ordersActions.loadOrders();
	});

	$effect(() => {
		if (didInit) return;
		didInit = true;
		deliveriesActions.loadDeliveries();
	});

	function toggleSelection(id: string) {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === filteredDeliveries.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredDeliveries.map((d) => d.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;
		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} livraison${count > 1 ? 's' : ''} ?`)) return;
		deleting = true;
		deleteError = null;
		try {
			await deleteDeliveriesBatch({ ids: Array.from(selectedIds) });
			clearSelection();
			await deliveriesActions.loadDeliveries();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
		} finally {
			deleting = false;
		}
	}

	// --- Tournées (routes) ---
	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

	function formatRouteDate(isoDate: string): string {
		const d = new Date(isoDate);
		const day = d.getDate();
		const month = MONTH_LABELS[d.getMonth()];
		const year = d.getFullYear();
		return `${day} ${month} ${year}`;
	}

	function routeDisplayName(route: ApiRoute): string {
		if (route.name?.trim()) return route.name.trim();
		return `Tournée du ${formatRouteDate(route.createdAt)}`;
	}

	function getDeliveriesForProgress(route: ApiRoute): Array<{ status: string; sequence: number | null }> {
		const deliveries: Array<{ status: string; sequence: number | null }> = [];
		let sequence = 0;
		for (let i = 0; i < route.statusSummary.completed; i++) {
			deliveries.push({ status: 'Completed', sequence: sequence++ });
		}
		for (let i = 0; i < route.statusSummary.inProgress; i++) {
			deliveries.push({ status: 'InProgress', sequence: sequence++ });
		}
		for (let i = 0; i < route.statusSummary.failed; i++) {
			deliveries.push({ status: 'Failed', sequence: sequence++ });
		}
		for (let i = 0; i < route.statusSummary.pending; i++) {
			deliveries.push({ status: 'Pending', sequence: sequence++ });
		}
		return deliveries;
	}

	let routesLoading = $state(true);
	let routesError = $state<string | null>(null);
	let routeList = $state<ApiRoute[]>([]);

	async function loadRoutes() {
		routesLoading = true;
		routesError = null;
		try {
			const filters = getListFilters();
			routeList = await getRoutes({
				dateFrom: filters.dateFrom,
				dateTo: filters.dateTo
			});
		} catch (e) {
			routesError = e instanceof Error ? e.message : 'Erreur lors du chargement des tournées';
		} finally {
			routesLoading = false;
		}
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		if (activeTab === TAB_ROUTES) loadRoutes();
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6 relative">
	<PeriodBadge />

	<Tabs value={activeTab} onValueChange={setTab} class="w-full">
		<TabsList class="grid w-full max-w-[320px] grid-cols-2">
			<TabsTrigger value={TAB_DELIVERIES}>Livraisons</TabsTrigger>
			<TabsTrigger value={TAB_ROUTES}>Tournées</TabsTrigger>
		</TabsList>

		<TabsContent value={TAB_DELIVERIES} class="mt-4">
			<Card>
				<CardHeader class="space-y-1">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle class="flex items-center gap-2">
								<PackageIcon class="size-4 text-muted-foreground" />
								Liste des livraisons
							</CardTitle>
							<p class="text-sm text-muted-foreground">
								{statusFilter
									? `${filteredDeliveries.length} sur ${deliveriesState.routes.length} livraison${deliveriesState.routes.length > 1 ? 's' : ''}`
									: `${deliveriesState.routes.length} livraison${deliveriesState.routes.length > 1 ? 's' : ''}`}
								{deliveriesState.lastUpdateAt ? ` · Dernière MAJ: ${deliveriesState.lastUpdateAt}` : ''}
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-2">
							<Button variant="outline" size="sm" href="/deliveries/map">Voir la carte</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => deliveriesActions.loadDeliveries()}
								disabled={deliveriesState.loading}
							>
								{deliveriesState.loading ? 'Chargement...' : 'Actualiser'}
							</Button>
						</div>
					</div>
					{#if statusFilter}
						<div class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
							<span class="text-muted-foreground">Filtre actif:</span>
							<span class="font-medium">{DELIVERY_STATUS_LABELS[statusFilter]}</span>
							<Button variant="ghost" size="sm" class="ml-auto h-6 px-2" onclick={clearStatusFilter}>
								<XIcon class="size-3.5" />
								Effacer
							</Button>
						</div>
					{/if}
				</CardHeader>
				<CardContent class="space-y-4">
					{#if urlRouteId || urlDriverId || urlDate}
						<div class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
							<span class="text-muted-foreground">Filtre tournée actif.</span>
							<Button variant="link" href="/deliveries" class="h-auto p-0 font-normal">
								Voir toutes les livraisons
							</Button>
						</div>
					{/if}
					{#if deliveriesState.error}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{deliveriesState.error}</AlertDescription>
						</Alert>
					{/if}
					{#if deleteError}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{deleteError}</AlertDescription>
						</Alert>
					{/if}

					{#if selectedIds.size > 0}
						<div class="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2">
							<span class="text-sm text-muted-foreground">
								{selectedIds.size} livraison{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
								{statusFilter ? ` (${DELIVERY_STATUS_LABELS[statusFilter]})` : ''}
							</span>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger
									class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
									aria-label="Actions sur la sélection"
								>
									<MoreVerticalIcon class="size-4" />
								</DropdownMenu.Trigger>
								<DropdownMenu.Portal>
									<DropdownMenu.Content
										class="z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
										sideOffset={4}
										align="end"
									>
										<DropdownMenu.Item
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
											onSelect={clearSelection}
											disabled={deleting}
										>
											<XIcon class="size-4" />
											Désélectionner
										</DropdownMenu.Item>
										<DropdownMenu.Item
											class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
											onSelect={handleDeleteSelected}
											disabled={deleting}
										>
											<Trash2Icon class="size-4" />
											{deleting ? 'Suppression...' : `Supprimer (${selectedIds.size})`}
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Portal>
							</DropdownMenu.Root>
						</div>
					{/if}

					{#if deliveriesState.loading && !deliveriesState.routes.length}
						<div class="py-8 text-center text-muted-foreground">Chargement des livraisons...</div>
					{:else if filteredDeliveries.length === 0}
						<div class="py-8 text-center text-muted-foreground text-sm">
							{statusFilter
								? `Aucune livraison avec le statut « ${DELIVERY_STATUS_LABELS[statusFilter]} ».`
								: 'Aucune livraison.'}
							{#if statusFilter}
								<Button variant="link" class="ml-1 h-auto p-0" onclick={clearStatusFilter}>
									Effacer le filtre
								</Button>
							{/if}
						</div>
					{:else}
						<div class="min-w-0 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead class="w-10">
											<Checkbox
												checked={selectedIds.size === filteredDeliveries.length && filteredDeliveries.length > 0}
												onCheckedChange={toggleSelectAll}
												aria-label="Tout sélectionner"
											/>
										</TableHead>
										<TableHead>Statut</TableHead>
										<TableHead>Date</TableHead>
										<TableHead>Ref</TableHead>
										<TableHead>Chauffeur</TableHead>
										<TableHead class="w-[70px] text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each filteredDeliveries as delivery}
										<TableRow
											class={cn(
												'cursor-pointer transition-colors hover:bg-muted/50',
												selectedIds.has(delivery.id) && 'bg-primary/5'
											)}
											onclick={() => toggleSelection(delivery.id)}
										>
											<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
												<Checkbox
													checked={selectedIds.has(delivery.id)}
													onCheckedChange={() => toggleSelection(delivery.id)}
												/>
											</TableCell>
											<TableCell>
												<StatusBadge type="delivery" status={delivery.status} date={delivery.createdAt} />
											</TableCell>
											<TableCell>
												<RelativeTimeIndicator date={delivery.createdAt} />
											</TableCell>
											<TableCell onclick={(e) => e.stopPropagation()}>
												<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
													{delivery.route}
												</Button>
											</TableCell>
											<TableCell>{delivery.driver}</TableCell>
											<TableCell class="text-right" onclick={(e) => e.stopPropagation()}>
												<DropdownMenu.Root>
													<DropdownMenu.Trigger
														class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
														aria-label="Actions de la livraison"
													>
														<MoreVerticalIcon class="size-4" />
													</DropdownMenu.Trigger>
													<DropdownMenu.Portal>
														<DropdownMenu.Content
															class="z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
															sideOffset={4}
															align="end"
														>
															<DropdownMenu.Item
																class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
																onSelect={() => openClientTrackingPopup(delivery.id)}
															>
																<ExternalLinkIcon class="size-4" />
																Ouvrir suivi client (fenêtre)
															</DropdownMenu.Item>
															<DropdownMenu.Item
																class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
																onSelect={() => openClientTracking(delivery.id)}
															>
																<ExternalLinkIcon class="size-4" />
																Ouvrir suivi client
															</DropdownMenu.Item>
															<DropdownMenu.Item
																class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
																onSelect={() => copyClientTrackingLink(delivery.id)}
															>
																{#if copiedTrackingDeliveryId === delivery.id}
																	<CheckIcon class="size-4" />
																	Lien copié
																{:else}
																	<CopyIcon class="size-4" />
																	Copier lien suivi
																{/if}
															</DropdownMenu.Item>
														</DropdownMenu.Content>
													</DropdownMenu.Portal>
												</DropdownMenu.Root>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>

		<TabsContent value={TAB_ROUTES} class="mt-4">
			<Card>
				<CardHeader class="space-y-1">
					<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle class="flex items-center gap-2">
								<RouteIcon class="size-4 text-muted-foreground" />
								Liste des tournées
							</CardTitle>
							<p class="text-sm text-muted-foreground">
								{routeList.length} tournée{routeList.length !== 1 ? 's' : ''}
							</p>
						</div>
						<div class="flex items-center gap-2">
							<Button variant="outline" size="sm" href="/deliveries?tab=deliveries">Voir les livraisons</Button>
							<Button variant="outline" size="sm" href="/deliveries/new">Créer une tournée</Button>
							<Button variant="outline" size="sm" onclick={() => loadRoutes()} disabled={routesLoading}>
								{routesLoading ? 'Chargement...' : 'Actualiser'}
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if routesError}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{routesError}</AlertDescription>
						</Alert>
					{/if}
					{#if routesLoading && routeList.length === 0}
						<div class="py-8 text-center text-muted-foreground">Chargement des tournées...</div>
					{:else if routeList.length === 0}
						<div class="py-8 text-center text-sm text-muted-foreground">
							Aucune tournée sur la période sélectionnée.
						</div>
					{:else}
						<div class="min-w-0 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Tournée</TableHead>
										<TableHead>Chauffeur</TableHead>
										<TableHead>Progression</TableHead>
										<TableHead class="text-muted-foreground">Durée estimée</TableHead>
										<TableHead class="w-[140px]"></TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each routeList as route}
										<TableRow>
											<TableCell class="font-medium">
												<Button
													variant="link"
													href="/deliveries/routes/{encodeURIComponent(route.id)}"
													class="h-auto p-0 font-normal"
												>
													{routeDisplayName(route)}
												</Button>
											</TableCell>
											<TableCell>{route.driverName}</TableCell>
											<TableCell class="min-w-[200px]">
												<RouteProgressIndicator deliveries={getDeliveriesForProgress(route)} />
											</TableCell>
											<TableCell class="text-muted-foreground text-sm">
												<span title="Voir le détail de la tournée pour l'estimation Mapbox">–</span>
											</TableCell>
											<TableCell class="space-x-2">
												<Button
													variant="link"
													href="/deliveries/routes/{encodeURIComponent(route.id)}"
													class="h-auto p-0 font-normal"
												>
													Détail
												</Button>
												<span class="text-muted-foreground">·</span>
												<Button
													variant="link"
													href="/deliveries?routeId={encodeURIComponent(route.id)}"
													class="h-auto p-0 font-normal"
												>
													Livraisons
												</Button>
											</TableCell>
										</TableRow>
									{/each}
								</TableBody>
							</Table>
						</div>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
