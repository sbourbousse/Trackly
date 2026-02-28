<script lang="ts">
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RelativeTimeIndicator from '$lib/components/RelativeTimeIndicator.svelte';
	import PeriodBadge from '$lib/components/PeriodBadge.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardAction,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { getDeliveries, type ApiDelivery } from '$lib/api/deliveries';
	import { getRoutes, type ApiRoute } from '$lib/api/routes';
	import { getDrivers, type ApiDriver } from '$lib/api/drivers';
	import { getDeliveryQuota, type DeliveryQuotaResponse } from '$lib/api/billing';
	import { getListFilters } from '$lib/stores/dateRange.svelte';
	import BoxIcon from '@lucide/svelte/icons/box';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import RouteIcon from '@lucide/svelte/icons/route';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';

	let dashboardState = $state({
		deliveries: [] as ApiDelivery[],
		routes: {} as Record<string, ApiRoute>,
		drivers: [] as ApiDriver[],
		quota: null as DeliveryQuotaResponse | null,
		loading: false,
		error: null as string | null,
		requestId: 0
	});
	let dashboardRequestId = 0;

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		ordersActions.loadOrders();
		void loadDashboardData();
	});

	const isPendingOrder = (status: string) => {
		const lower = (status ?? '').toLowerCase();
		return lower === 'pending' || lower === 'en attente';
	};
	const isPlannedOrder = (status: string) => {
		const lower = (status ?? '').toLowerCase();
		return lower === 'planned' || lower === 'planifiée';
	};
	const isOverdue = (date: string | null | undefined) => {
		if (!date) return false;
		const value = new Date(date);
		if (Number.isNaN(value.getTime())) return false;
		return value.getTime() < Date.now();
	};
	const normalizeDeliveryStatus = (status: string) => {
		const lower = (status ?? '').toLowerCase();
		if (lower === 'inprogress' || lower === 'en cours') return 'InProgress';
		if (lower === 'completed' || lower === 'livree' || lower === 'livrée') return 'Completed';
		if (lower === 'failed' || lower === 'echec' || lower === 'échec') return 'Failed';
		return 'Pending';
	};
	const getRouteToneClass = (status: string) => {
		const normalized = normalizeDeliveryStatus(status);
		if (normalized === 'InProgress') return 'bg-amber-500';
		if (normalized === 'Completed') return 'bg-emerald-500';
		if (normalized === 'Failed') return 'bg-destructive';
		return 'bg-sky-500';
	};
	const getTimeSlotLabel = (value: string | null | undefined) => {
		if (!value) return 'Créneau indisponible';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Créneau indisponible';
		const hour = date.getHours();
		if (hour < 4) return '0h–4h';
		if (hour < 8) return '4h–8h';
		if (hour < 12) return '8h–12h';
		if (hour < 16) return '12h–16h';
		if (hour < 20) return '16h–20h';
		return '20h–24h';
	};
	const getDateLabel = (value: string | null | undefined) => {
		if (!value) return 'Date indisponible';
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return 'Date indisponible';
		return date.toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	};

	const pendingOrders = $derived.by(() =>
		ordersState.items.filter((o) => isPendingOrder(o.status) && !isOverdue(o.orderDate))
	);
	const ordersById = $derived.by(() => {
		const map = new Map<string, (typeof ordersState.items)[number]>();
		for (const order of ordersState.items) map.set(order.id, order);
		return map;
	});
	const timelineRoutes = $derived.by(() => {
		const grouped = new Map<string, ApiDelivery[]>();
		for (const delivery of dashboardState.deliveries) {
			if (!delivery.routeId) continue;
			const current = grouped.get(delivery.routeId) ?? [];
			current.push(delivery);
			grouped.set(delivery.routeId, current);
		}
		return Array.from(grouped.entries())
			.map(([routeId, deliveries]) => {
				const sortedDeliveries = [...deliveries].sort((a, b) => {
					const seqA = a.sequence ?? Number.MAX_SAFE_INTEGER;
					const seqB = b.sequence ?? Number.MAX_SAFE_INTEGER;
					if (seqA !== seqB) return seqA - seqB;
					return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
				});
				const hasInProgress = sortedDeliveries.some(
					(d) => normalizeDeliveryStatus(d.status) === 'InProgress'
				);
				const hasFailed = sortedDeliveries.some((d) => normalizeDeliveryStatus(d.status) === 'Failed');
				const hasPending = sortedDeliveries.some((d) => normalizeDeliveryStatus(d.status) === 'Pending');
				const routeStatus = hasInProgress
					? 'InProgress'
					: hasFailed
						? 'Failed'
						: hasPending
							? 'Pending'
							: 'Completed';
				const firstCreatedAt =
					sortedDeliveries.find((d) => d.createdAt)?.createdAt ?? sortedDeliveries[0]?.createdAt ?? null;
				return {
					routeId,
					ref: routeId.slice(0, 8).toUpperCase(),
					status: routeStatus,
					deliveries: sortedDeliveries,
					firstCreatedAt,
					driverName: dashboardState.routes[routeId]?.driverName ?? 'Livreur non assigne',
					driverId: dashboardState.routes[routeId]?.driverId ?? null
				};
			})
			.sort(
				(a, b) =>
					new Date(b.firstCreatedAt ?? 0).getTime() - new Date(a.firstCreatedAt ?? 0).getTime()
			);
	});
	const deliveryCounts = $derived.by(() => {
		let pending = 0;
		let inProgress = 0;
		let completed = 0;
		let failed = 0;
		for (const delivery of dashboardState.deliveries) {
			const status = normalizeDeliveryStatus(delivery.status);
			if (status === 'Pending') pending += 1;
			else if (status === 'InProgress') inProgress += 1;
			else if (status === 'Completed') completed += 1;
			else if (status === 'Failed') failed += 1;
		}
		return { pending, inProgress, completed, failed };
	});
	const routesWithoutDriver = $derived.by(
		() =>
			timelineRoutes.filter(
				(route) => !route.driverId || route.driverName.toLowerCase() === 'livreur non assigne'
			).length
	);
	const deliverySuccessRate = $derived.by(() => {
		// Les commandes "En attente"/"Planifiée" dépassées sont comptées comme des échecs.
		const pendingOrPlannedOverdue = ordersState.items.filter(
			(o) => (isPendingOrder(o.status) || isPlannedOrder(o.status)) && isOverdue(o.orderDate)
		).length;
		const pendingOrPlannedNotOverdue = ordersState.items.filter(
			(o) => (isPendingOrder(o.status) || isPlannedOrder(o.status)) && !isOverdue(o.orderDate)
		).length;
		const effectiveFailed = deliveryCounts.failed + pendingOrPlannedOverdue;
		const totalRelevant = deliveryCounts.completed + effectiveFailed + pendingOrPlannedNotOverdue;
		if (totalRelevant === 0) return 0;
		return Math.round((deliveryCounts.completed / totalRelevant) * 100);
	});
	const routesTrendText = $derived.by(() =>
		timelineRoutes.length > 0 ? 'Période active' : 'Aucune tournée planifiée'
	);
	const pendingTrendText = $derived.by(() =>
		pendingOrders.length > 0 ? 'Affectation à faire' : 'Toutes les commandes sont affectées'
	);
	const inProgressTrendText = $derived.by(() =>
		deliveryCounts.inProgress > 0 ? 'Suivi en temps réel actif' : 'Aucune livraison active'
	);
	const successTrendText = $derived.by(() =>
		deliverySuccessRate >= 90 ? 'Très bon niveau de service' : 'Marge d’amélioration possible'
	);
	const alerts = $derived.by(() => {
		const items: Array<{ tone: 'danger' | 'warn'; text: string }> = [];
		if (deliveryCounts.failed > 0) {
			items.push({
				tone: 'danger',
				text: `${deliveryCounts.failed} livraison(s) en échec à traiter`
			});
		}
		if (routesWithoutDriver > 0) {
			items.push({
				tone: 'warn',
				text: `${routesWithoutDriver} tournée(s) sans chauffeur assigné`
			});
		}
		if (pendingOrders.length > 0) {
			items.push({
				tone: 'warn',
				text: `${pendingOrders.length} commande(s) en attente d'affectation`
			});
		}
		return items;
	});
	const quotaBadgeText = $derived.by(() => {
		const q = dashboardState.quota;
		if (!q) return 'Plan Starter · …';
		if (q.remaining === null) return `Plan ${q.plan} · Illimité`;
		return `Plan ${q.plan} · ${q.remaining} livraison${q.remaining !== 1 ? 's' : ''} restante${q.remaining !== 1 ? 's' : ''}`;
	});

	const driverWorkload = $derived.by(() => {
		const map = new Map<string, { routes: number; stops: number; inProgress: number }>();
		for (const route of timelineRoutes) {
			if (!route.driverId) continue;
			const current = map.get(route.driverId) ?? { routes: 0, stops: 0, inProgress: 0 };
			current.routes += 1;
			current.stops += route.deliveries.length;
			if (route.status === 'InProgress') current.inProgress += 1;
			map.set(route.driverId, current);
		}
		return dashboardState.drivers.map((driver) => ({
			...driver,
			workload: map.get(driver.id) ?? { routes: 0, stops: 0, inProgress: 0 }
		}));
	});

	async function loadDashboardData() {
		dashboardRequestId += 1;
		const requestId = dashboardRequestId;
		dashboardState.requestId = requestId;
		dashboardState.loading = true;
		dashboardState.error = null;
		try {
			const filters = getListFilters();
			const routeFilters = {
				dateFrom: filters.dateFrom,
				dateTo: filters.dateTo
			};
			const [deliveries, routes, drivers, quota] = await Promise.all([
				getDeliveries(filters),
				getRoutes(routeFilters),
				getDrivers(),
				getDeliveryQuota()
			]);
			if (dashboardRequestId !== requestId) return;
			dashboardState.deliveries = deliveries.filter((d) => Boolean(d.routeId));
			dashboardState.routes = Object.fromEntries(routes.map((r) => [r.id, r]));
			dashboardState.drivers = drivers;
			dashboardState.quota = quota;
		} catch (error) {
			if (dashboardRequestId !== requestId) return;
			dashboardState.error =
				error instanceof Error ? error.message : 'Erreur lors du chargement du dashboard';
		} finally {
			if (dashboardRequestId === requestId) dashboardState.loading = false;
		}
	}
</script>

<div class="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-6">
	<PeriodBadge />
	<Badge variant="secondary" class="w-fit">{quotaBadgeText}</Badge>

	<section class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 xl:grid-cols-4">
		<Card class="@container/card">
			<CardHeader class="pb-2">
				<CardDescription>Tournées période</CardDescription>
				<CardAction>
					<RouteIcon class="size-4 text-muted-foreground" />
					<Badge variant="outline">{timelineRoutes.length}</Badge>
				</CardAction>
				<CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{timelineRoutes.length}
				</CardTitle>
			</CardHeader>
			<CardFooter class="text-xs text-muted-foreground pt-0">{routesTrendText}</CardFooter>
		</Card>
		<Card class="@container/card">
			<CardHeader class="pb-2">
				<CardDescription>Commandes à affecter</CardDescription>
				<CardAction>
					<BoxIcon class="size-4 text-muted-foreground" />
					<Badge variant={pendingOrders.length > 0 ? 'secondary' : 'outline'}>
						{pendingOrders.length}
					</Badge>
				</CardAction>
				<CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{pendingOrders.length}
				</CardTitle>
			</CardHeader>
			<CardFooter class="text-xs text-muted-foreground pt-0">{pendingTrendText}</CardFooter>
		</Card>
		<Card class="@container/card">
			<CardHeader class="pb-2">
				<CardDescription>Livraisons en cours</CardDescription>
				<CardAction>
					<TruckIcon class="size-4 text-muted-foreground" />
					<Badge variant={deliveryCounts.inProgress > 0 ? 'default' : 'outline'}>
						{deliveryCounts.inProgress}
					</Badge>
				</CardAction>
				<CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{deliveryCounts.inProgress}
				</CardTitle>
			</CardHeader>
			<CardFooter class="text-xs text-muted-foreground pt-0">{inProgressTrendText}</CardFooter>
		</Card>
		<Card class="@container/card">
			<CardHeader class="pb-2">
				<CardDescription>Taux de réussite</CardDescription>
				<CardAction>
					<CheckCircle2Icon class="size-4 text-muted-foreground" />
					<Badge variant={deliverySuccessRate >= 90 ? 'default' : 'secondary'}>
						{deliverySuccessRate}%
					</Badge>
				</CardAction>
				<CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
					{deliverySuccessRate}%
				</CardTitle>
			</CardHeader>
			<CardFooter class="text-xs text-muted-foreground pt-0">{successTrendText}</CardFooter>
		</Card>
	</section>

	<section class="min-w-0 space-y-6">
		<div class="flex min-w-0 flex-col gap-4">
			{#if dashboardState.loading && timelineRoutes.length === 0}
				<div class="py-10 text-center text-muted-foreground text-sm">Chargement des tournées...</div>
			{:else if dashboardState.error}
				<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{dashboardState.error}
				</div>
			{:else if timelineRoutes.length === 0}
				<div class="py-10 text-center text-muted-foreground text-sm">
					Aucune tournée sur la période sélectionnée.
				</div>
			{:else}
				<div class="flex flex-wrap items-stretch gap-4">
					{#each timelineRoutes as timelineRoute}
						<article class="flex min-w-[320px] max-w-[560px] flex-1 basis-[420px] flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
							<div class="flex flex-wrap items-center justify-between gap-2">
								<div class="min-w-0 flex items-center gap-2">
									<span class="size-2 rounded-full shrink-0 {getRouteToneClass(timelineRoute.status)}"></span>
									<Button
										variant="link"
										href="/deliveries/routes/{timelineRoute.routeId}"
										class="h-auto p-0 font-medium"
									>
										Tournée {timelineRoute.ref}
									</Button>
									<StatusBadge
										type="delivery"
										status={timelineRoute.status}
										date={timelineRoute.firstCreatedAt}
									/>
								</div>
								<div class="flex items-center gap-2">
									<Badge variant="outline" class="max-w-[200px] truncate">
										{timelineRoute.driverName}
									</Badge>
									<Badge variant="outline">{timelineRoute.deliveries.length} commandes</Badge>
									<Badge variant="outline">{getDateLabel(timelineRoute.firstCreatedAt)}</Badge>
									<Badge variant="secondary">{getTimeSlotLabel(timelineRoute.firstCreatedAt)}</Badge>
								</div>
							</div>

							<div class="space-y-1">
								{#each timelineRoute.deliveries as delivery, index}
									{@const order = ordersById.get(delivery.orderId)}
									<div class="flex flex-wrap items-center justify-between gap-3 border-b pb-2 last:border-b-0 last:pb-0">
										<div class="min-w-0 flex items-center gap-3">
											<Badge variant="outline" class="w-8 justify-center px-1 tabular-nums">
												{delivery.sequence != null ? delivery.sequence + 1 : index + 1}
											</Badge>
											<div class="min-w-0">
												<div class="flex min-w-0 items-center gap-2">
													<Button
														variant="link"
														href="/orders/{delivery.orderId}"
														class="h-auto p-0 font-normal"
													>
														{order?.ref ?? delivery.orderId.slice(0, 8).toUpperCase()}
													</Button>
												<StatusBadge
													type="delivery"
													status={delivery.status}
													date={order?.orderDate ?? delivery.createdAt ?? null}
												/>
												</div>
												<p class="truncate text-xs text-muted-foreground">
													{order?.client ?? 'Client'} · {order?.address ?? 'Adresse indisponible'}
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</div>

		<div class="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
			<Card class="xl:col-span-1">
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Alertes</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if alerts.length === 0}
						<p class="text-sm text-muted-foreground">Aucune alerte sur la période.</p>
					{:else}
						{#each alerts as alert}
							<div class="rounded-md border px-3 py-2 text-sm {alert.tone === 'danger' ? 'border-destructive/40 bg-destructive/10 text-destructive' : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'}">
								{alert.text}
							</div>
						{/each}
					{/if}
				</CardContent>
			</Card>

			<Card class="xl:col-span-1">
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Commandes en attente d'affectation</CardTitle>
				</CardHeader>
				<CardContent class="space-y-3">
					{#if pendingOrders.length === 0}
						<p class="text-sm text-muted-foreground">Toutes les commandes sont affectées.</p>
					{:else}
						{#each pendingOrders.slice(0, 6) as order}
							<div class="rounded-md border p-2">
								<div class="flex items-center justify-between gap-2">
									<Button variant="link" href="/orders/{order.id}" class="h-auto p-0">
										{order.ref}
									</Button>
									<StatusBadge type="order" status={order.status} date={order.orderDate} />
								</div>
								<p class="truncate text-xs text-muted-foreground mt-1">
									{order.client} · {order.address}
								</p>
								<div class="mt-1 text-xs">
									<RelativeTimeIndicator date={order.orderDate} />
								</div>
							</div>
						{/each}
						<div class="pt-1">
							<Button variant="outline" size="sm" href="/deliveries/new">
								Affecter des commandes
							</Button>
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card class="xl:col-span-1">
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Livreurs</CardTitle>
				</CardHeader>
				<CardContent class="space-y-2">
					{#if driverWorkload.length === 0}
						<p class="text-sm text-muted-foreground">Aucun livreur disponible.</p>
					{:else}
						{#each driverWorkload as driver}
							<div class="flex items-center justify-between gap-2 rounded-md border p-2">
								<div class="min-w-0">
									<p class="truncate text-sm font-medium">{driver.name}</p>
									<p class="text-xs text-muted-foreground">
										{driver.workload.routes} tournée(s) · {driver.workload.stops} arrêt(s)
									</p>
								</div>
								<Badge variant={driver.workload.inProgress > 0 ? 'default' : 'outline'}>
									{driver.workload.inProgress > 0 ? 'Actif' : 'Disponible'}
								</Badge>
							</div>
						{/each}
					{/if}
				</CardContent>
			</Card>

			<Card class="xl:col-span-1">
				<CardHeader class="pb-2">
					<CardTitle class="text-base">Actions rapides</CardTitle>
				</CardHeader>
				<CardContent class="grid grid-cols-1 gap-2">
					<Button href="/orders/new">Nouvelle commande</Button>
					<Button href="/deliveries/new" variant="outline">Nouvelle tournée</Button>
					<Button href="/map" variant="outline">Ouvrir la carte</Button>
				</CardContent>
			</Card>
		</div>
	</section>

</div>
