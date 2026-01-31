<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { getOrdersStats, type OrderStatsResponse } from '$lib/api/orders';
	import { getListFilters, getDateRangeDayCount } from '$lib/stores/dateRange.svelte';
	import DateFilterCard from '$lib/components/DateFilterCard.svelte';
	import OrdersChartContent from '$lib/components/OrdersChartContent.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let orderStats = $state<OrderStatsResponse | null>(null);
	let orderStatsLoading = $state(false);
	let activeTab = $state('commandes-attente');

	async function loadOrderStats() {
		const filters = getListFilters();
		if (!filters.dateFrom || !filters.dateTo) {
			orderStats = null;
			return;
		}
		orderStatsLoading = true;
		try {
			orderStats = await getOrdersStats(filters);
		} catch {
			orderStats = null;
		} finally {
			orderStatsLoading = false;
		}
	}

	async function onDateFilterChange() {
		await Promise.all([deliveriesActions.loadDeliveries(), ordersActions.loadOrders(), loadOrderStats()]);
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		deliveriesActions.loadDeliveries();
		ordersActions.loadOrders();
		loadOrderStats();
	});

	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

	const chartData = $derived.by(() => {
		if (!orderStats) return { labels: [] as string[], values: [] as number[], byHour: false, byMonth: false };
		if (orderStats.byHour.length > 0) {
			return {
				labels: orderStats.byHour.map((x) => x.hour),
				values: orderStats.byHour.map((x) => x.count),
				byHour: true,
				byMonth: false
			};
		}
		const dayCount = getDateRangeDayCount();
		if (dayCount > 30 && orderStats.byDay.length > 0) {
			const byMonthMap = new Map<string, number>();
			for (const { date, count } of orderStats.byDay) {
				const [y, m] = date.split('-');
				const key = `${y}-${m}`;
				byMonthMap.set(key, (byMonthMap.get(key) ?? 0) + count);
			}
			const sorted = [...byMonthMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
			return {
				labels: sorted.map(([key]) => {
					const [, m] = key.split('-');
					return `${MONTH_LABELS[Number(m) - 1]} ${key.slice(0, 4)}`;
				}),
				values: sorted.map(([, count]) => count),
				byHour: false,
				byMonth: true
			};
		}
		return {
			labels: orderStats.byDay.map((x) => x.date),
			values: orderStats.byDay.map((x) => x.count),
			byHour: false,
			byMonth: false
		};
	});

	const isPrevue = (s: string) => s === 'Pending' || s === 'Prevue';
	const isEnCours = (s: string) => s === 'InProgress' || s === 'En cours';
	const isCommandeEnAttente = (s: string) => s === 'En attente' || s === 'Pending' || s === 'Planned';

	/** Tournées prévues = Pending / Prevue (en attente). */
	const routesPrevues = $derived(deliveriesState.routes.filter((r) => isPrevue(r.status)));
	/** Tournées en cours = InProgress / En cours. */
	const routesEnCours = $derived(deliveriesState.routes.filter((r) => isEnCours(r.status)));
	/** Commandes en attente = statut En attente / Pending / Planned. */
	const commandesEnAttente = $derived(ordersState.items.filter((o) => isCommandeEnAttente(o.status)));

	function handleAddSection() {
		// Presets de sections à développer plus tard
	}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Trackly Business" subtitle="Vue rapide des tournées et livraisons." />
	<Badge variant="secondary" class="w-fit">Plan Starter · 7 livraisons restantes</Badge>

	<!-- Plage de travail + graphique Commandes par jour/heure dans le même card -->
	<DateFilterCard
		chartTitle={chartData.byHour ? 'Commandes par heure' : chartData.byMonth ? 'Commandes par mois' : 'Commandes par jour'}
		chartDefaultOpen={false}
		onDateFilterChange={onDateFilterChange}
	>
		{#snippet chart()}
			<OrdersChartContent
				loading={orderStatsLoading}
				labels={chartData.labels}
				values={chartData.values}
				emptyMessage="Sélectionnez une plage pour afficher le graphique."
			/>
		{/snippet}
	</DateFilterCard>

	<!-- Zone à onglets -->
	<section class="flex min-w-0 flex-col gap-4">
		<Tabs bind:value={activeTab} class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<TabsList class="h-9 w-full md:w-auto">
					<TabsTrigger value="commandes-attente">Commandes en attente</TabsTrigger>
					<TabsTrigger value="tournees">Tournées</TabsTrigger>
					<TabsTrigger value="section-2">Section 2</TabsTrigger>
				</TabsList>
				<Button variant="outline" size="sm" onclick={handleAddSection}>
					<PlusIcon class="mr-2 size-4" aria-hidden="true" />
					Ajouter une section
				</Button>
			</div>

			<!-- Commandes en attente -->
			<TabsContent value="commandes-attente" class="mt-0 min-w-0">
				<Card class="min-w-0">
					<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
						<CardTitle>Commandes en attente</CardTitle>
						<Button variant="outline" size="sm" href="/orders/new">Nouvelle commande</Button>
					</CardHeader>
					<CardContent class="min-w-0">
						{#if ordersState.loading && !ordersState.items.length}
							<div class="py-8 text-center text-muted-foreground">Chargement des commandes...</div>
						{:else if ordersState.error}
							<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{ordersState.error}
							</div>
						{:else if commandesEnAttente.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								Aucune commande en attente.
								<Button variant="link" href="/orders/new" class="px-1">Créer une commande</Button>
							</div>
						{:else}
							<div class="min-w-0 overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Réf.</TableHead>
											<TableHead>Client</TableHead>
											<TableHead>Adresse</TableHead>
											<TableHead>Date commande</TableHead>
											<TableHead>Statut</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each commandesEnAttente.slice(0, 10) as order}
											<TableRow>
												<TableCell>
													<Button variant="link" href="/orders/{order.id}" class="h-auto p-0 font-normal">
														{order.ref}
													</Button>
												</TableCell>
												<TableCell>{order.client}</TableCell>
												<TableCell class="max-w-[200px] truncate">{order.address}</TableCell>
												<TableCell class="tabular-nums text-muted-foreground">
													{order.orderDate
														? new Date(order.orderDate).toLocaleDateString('fr-FR', {
																day: 'numeric',
																month: 'short',
																year: 'numeric'
															})
														: '–'}
												</TableCell>
												<TableCell>
													<StatusBadge type="order" status={order.status} />
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
							{#if commandesEnAttente.length > 10}
								<div class="mt-4 text-center">
									<Button variant="link" href="/orders">
										Voir toutes les commandes en attente ({commandesEnAttente.length})
									</Button>
								</div>
							{/if}
						{/if}
					</CardContent>
				</Card>
			</TabsContent>

			<!-- Tournées : prévues + en cours -->
			<TabsContent value="tournees" class="mt-0 min-w-0">
				<div class="flex min-w-0 flex-col gap-6">
					{#if deliveriesState.loading && !deliveriesState.routes.length}
						<Card>
							<CardContent class="py-8 text-center text-muted-foreground">
								Chargement des tournées...
							</CardContent>
						</Card>
					{:else if deliveriesState.error}
						<Card>
							<CardContent class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{deliveriesState.error}
							</CardContent>
						</Card>
					{:else}
						<!-- Tournées prévues (en attente / Pending) -->
						<Card class="min-w-0">
							<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
								<CardTitle>Tournées prévues</CardTitle>
								<Badge variant="secondary">{routesPrevues.length}</Badge>
							</CardHeader>
							<CardContent class="min-w-0">
								{#if routesPrevues.length === 0}
									<div class="py-6 text-center text-muted-foreground text-sm">
										Aucune tournée prévue.
									</div>
								{:else}
									<div class="min-w-0 overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Tournée</TableHead>
													<TableHead>Chauffeur</TableHead>
													<TableHead>Arrêts</TableHead>
													<TableHead>Statut</TableHead>
													<TableHead class="tabular-nums">ETA</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{#each routesPrevues.slice(0, 5) as delivery}
													<TableRow>
														<TableCell>
															<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
																{delivery.route}
															</Button>
														</TableCell>
														<TableCell>{delivery.driver}</TableCell>
														<TableCell class="tabular-nums">{delivery.stops}</TableCell>
														<TableCell>
															<StatusBadge type="delivery" status={delivery.status} />
														</TableCell>
														<TableCell class="tabular-nums">{delivery.eta}</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>
									{#if routesPrevues.length > 5}
										<div class="mt-4 text-center">
											<Button variant="link" href="/deliveries">
												Voir toutes les prévues ({routesPrevues.length})
											</Button>
										</div>
									{/if}
								{/if}
							</CardContent>
						</Card>

						<!-- Tournées en cours -->
						<Card class="min-w-0">
							<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
								<CardTitle>En cours</CardTitle>
								<Badge variant="secondary">{routesEnCours.length}</Badge>
							</CardHeader>
							<CardContent class="min-w-0">
								{#if routesEnCours.length === 0}
									<div class="py-6 text-center text-muted-foreground text-sm">
										Aucune tournée en cours.
									</div>
								{:else}
									<div class="min-w-0 overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Tournée</TableHead>
													<TableHead>Chauffeur</TableHead>
													<TableHead>Arrêts</TableHead>
													<TableHead>Statut</TableHead>
													<TableHead class="tabular-nums">ETA</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{#each routesEnCours.slice(0, 5) as delivery}
													<TableRow>
														<TableCell>
															<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
																{delivery.route}
															</Button>
														</TableCell>
														<TableCell>{delivery.driver}</TableCell>
														<TableCell class="tabular-nums">{delivery.stops}</TableCell>
														<TableCell>
															<StatusBadge type="delivery" status={delivery.status} />
														</TableCell>
														<TableCell class="tabular-nums">{delivery.eta}</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>
									{#if routesEnCours.length > 5}
										<div class="mt-4 text-center">
											<Button variant="link" href="/deliveries">
												Voir toutes en cours ({routesEnCours.length})
											</Button>
										</div>
									{/if}
								{/if}
							</CardContent>
						</Card>
					{/if}
				</div>
			</TabsContent>

			<TabsContent value="section-2" class="mt-0">
				<Card>
					<CardContent class="flex min-h-[200px] flex-col items-center justify-center py-12 text-muted-foreground">
						<p class="text-sm">Cette section est vide.</p>
						<p class="mt-1 text-xs">Utilisez « Ajouter une section » pour ajouter un preset plus tard.</p>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	</section>
</div>
