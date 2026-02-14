<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RelativeTimeIndicator from '$lib/components/RelativeTimeIndicator.svelte';
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
	import DateFilterCard from '$lib/components/DateFilterCard.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PackageIcon from '@lucide/svelte/icons/package';
	import RouteIcon from '@lucide/svelte/icons/route';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

	let activeTab = $state('commandes-attente');

	async function onDateFilterChange() {
		await Promise.all([deliveriesActions.loadDeliveries(), ordersActions.loadOrders()]);
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		deliveriesActions.loadDeliveries();
		ordersActions.loadOrders();
	});

	const isPrevue = (s: string) => s === 'Pending' || s === 'Prevue';
	const isEnCours = (s: string) => s === 'InProgress' || s === 'En cours';
	const isCommandeEnAttente = (s: string) => s === 'En attente' || s === 'Pending' || s === 'Planned';

	const routesPrevues = $derived(deliveriesState.routes.filter((r) => isPrevue(r.status)));
	const routesEnCours = $derived(deliveriesState.routes.filter((r) => isEnCours(r.status)));
	const commandesEnAttente = $derived(ordersState.items.filter((o) => isCommandeEnAttente(o.status)));

	function handleAddSection() {}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Trackly Business" subtitle="Vue rapide des tournées et livraisons." icon={LayoutDashboardIcon} />
	<Badge variant="secondary" class="w-fit">Plan Starter · 7 livraisons restantes</Badge>

	<DateFilterCard onDateFilterChange={onDateFilterChange} />

	<section class="flex min-w-0 flex-col gap-4">
		<Tabs bind:value={activeTab} class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<TabsList class="h-9 w-full md:w-auto">
					<TabsTrigger value="commandes-attente">Commandes en attente</TabsTrigger>
					<TabsTrigger value="tournees">Livraisons</TabsTrigger>
					<TabsTrigger value="section-2">Section 2</TabsTrigger>
				</TabsList>
				<Button variant="outline" size="sm" onclick={handleAddSection}>
					<PlusIcon class="mr-2 size-4" aria-hidden="true" />
					Ajouter une section
				</Button>
			</div>

			<TabsContent value="commandes-attente" class="mt-0 min-w-0">
				<Card class="min-w-0">
					<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
						<CardTitle class="flex items-center gap-2">
							<ClipboardListIcon class="size-4 text-muted-foreground" />
							Commandes en attente
						</CardTitle>
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
											<TableHead>Statut</TableHead>
											<TableHead>Date commande</TableHead>
											<TableHead>Réf.</TableHead>
											<TableHead>Client</TableHead>
											<TableHead>Adresse</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each commandesEnAttente.slice(0, 10) as order}
											<TableRow>
												<TableCell>
													<StatusBadge type="order" status={order.status} />
												</TableCell>
												<TableCell>
													<RelativeTimeIndicator date={order.orderDate} showTime={true} />
												</TableCell>
												<TableCell>
													<Button variant="link" href="/orders/{order.id}" class="h-auto p-0 font-normal">
														{order.ref}
													</Button>
												</TableCell>
												<TableCell>{order.client}</TableCell>
												<TableCell class="max-w-[200px] truncate">{order.address}</TableCell>
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

			<TabsContent value="tournees" class="mt-0 min-w-0">
				<div class="flex min-w-0 flex-col gap-6">
					{#if deliveriesState.loading && !deliveriesState.routes.length}
						<Card>
							<CardContent class="py-8 text-center text-muted-foreground">
								Chargement des livraisons...
							</CardContent>
						</Card>
					{:else if deliveriesState.error}
						<Card>
							<CardContent class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{deliveriesState.error}
							</CardContent>
						</Card>
					{:else}
						<Card class="min-w-0">
							<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
								<CardTitle class="flex items-center gap-2">
									<RouteIcon class="size-4 text-muted-foreground" />
									Tournées prévues
								</CardTitle>
								<Badge variant="secondary">{routesPrevues.length}</Badge>
							</CardHeader>
							<CardContent class="min-w-0">
								{#if routesPrevues.length === 0}
									<div class="py-6 text-center text-muted-foreground text-sm">Aucune tournée prévue.</div>
								{:else}
									<div class="min-w-0 overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Statut</TableHead>
													<TableHead>Livraison</TableHead>
													<TableHead>Chauffeur</TableHead>
													<TableHead>Arrêts</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{#each routesPrevues.slice(0, 5) as delivery}
													<TableRow>
														<TableCell>
															<StatusBadge type="delivery" status={delivery.status} />
														</TableCell>
														<TableCell>
															<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
																{delivery.route}
															</Button>
														</TableCell>
														<TableCell>{delivery.driver}</TableCell>
														<TableCell class="tabular-nums">{delivery.stops}</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>
									{#if routesPrevues.length > 5}
										<div class="mt-4 text-center">
											<Button variant="link" href="/deliveries">Voir toutes les prévues ({routesPrevues.length})</Button>
										</div>
									{/if}
								{/if}
							</CardContent>
						</Card>

						<Card class="min-w-0">
							<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
								<CardTitle class="flex items-center gap-2">
									<RouteIcon class="size-4 text-muted-foreground" />
									En cours
								</CardTitle>
								<Badge variant="secondary">{routesEnCours.length}</Badge>
							</CardHeader>
							<CardContent class="min-w-0">
								{#if routesEnCours.length === 0}
									<div class="py-6 text-center text-muted-foreground text-sm">Aucune livraison en cours.</div>
								{:else}
									<div class="min-w-0 overflow-x-auto">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Statut</TableHead>
													<TableHead>Livraison</TableHead>
													<TableHead>Chauffeur</TableHead>
													<TableHead>Arrêts</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{#each routesEnCours.slice(0, 5) as delivery}
													<TableRow>
														<TableCell>
															<StatusBadge type="delivery" status={delivery.status} />
														</TableCell>
														<TableCell>
															<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
																{delivery.route}
															</Button>
														</TableCell>
														<TableCell>{delivery.driver}</TableCell>
														<TableCell class="tabular-nums">{delivery.stops}</TableCell>
													</TableRow>
												{/each}
											</TableBody>
										</Table>
									</div>
									{#if routesEnCours.length > 5}
										<div class="mt-4 text-center">
											<Button variant="link" href="/deliveries">Voir toutes en cours ({routesEnCours.length})</Button>
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
