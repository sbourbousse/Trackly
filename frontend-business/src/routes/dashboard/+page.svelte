<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
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
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let didInit = $state(false);
	let activeTab = $state('tournees');

	$effect(() => {
		if (didInit) return;
		didInit = true;
		deliveriesActions.loadDeliveries();
		ordersActions.loadOrders();
	});

	const kpis = $derived([
		{
			label: 'Livraisons du mois',
			value: deliveriesState.routes.length.toString(),
			trend: `${deliveriesState.routes.filter((d) => d.status === 'Livree').length} livrées`
		},
		{
			label: 'Tournées en cours',
			value: deliveriesState.routes.filter((d) => d.status === 'En cours').length.toString(),
			trend: deliveriesState.lastUpdateAt ? `Dernière MAJ: ${deliveriesState.lastUpdateAt}` : ''
		},
		{
			label: 'Commandes',
			value: ordersState.items.length.toString(),
			trend: `${ordersState.items.filter((o) => o.status === 'En attente').length} en attente`
		},
		{
			label: 'Taux de réussite',
			value:
				deliveriesState.routes.length > 0
					? `${Math.round((deliveriesState.routes.filter((d) => d.status === 'Livree').length / deliveriesState.routes.length) * 100)}%`
					: '0%',
			trend: 'Objectif: 98%'
		}
	]);

	function statusVariant(status: string) {
		if (status === 'Livree') return 'default';
		if (status === 'En cours' || status === 'Prevue') return 'secondary';
		return 'outline';
	}

	function handleAddSection() {
		// Presets de sections à développer plus tard
	}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Trackly Business" subtitle="Vue rapide des tournées et livraisons." />
	<Badge variant="secondary" class="w-fit">Plan Starter · 7 livraisons restantes</Badge>

	<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each kpis as kpi}
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{kpi.value}</div>
					<p class="text-xs text-muted-foreground">{kpi.trend}</p>
				</CardContent>
			</Card>
		{/each}
	</section>

	<!-- Zone à onglets : affichage du bas (inspiré dashboard-01) -->
	<section class="flex min-w-0 flex-col gap-4">
		<Tabs bind:value={activeTab} class="flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-4">
				<TabsList class="h-9 w-full md:w-auto">
					<TabsTrigger value="tournees">Tournées récentes</TabsTrigger>
					<TabsTrigger value="section-2">Section 2</TabsTrigger>
				</TabsList>
				<Button variant="outline" size="sm" onclick={handleAddSection}>
					<PlusIcon class="mr-2 size-4" aria-hidden="true" />
					Ajouter une section
				</Button>
			</div>

			<TabsContent value="tournees" class="mt-0 min-w-0">
				<Card class="min-w-0">
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle>Tournées récentes</CardTitle>
						<Badge variant="secondary">Temps réel</Badge>
					</CardHeader>
					<CardContent class="min-w-0">
						{#if deliveriesState.loading && !deliveriesState.routes.length}
							<div class="py-8 text-center text-muted-foreground">Chargement des tournées...</div>
						{:else if deliveriesState.error}
							<div class="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
								{deliveriesState.error}
							</div>
						{:else if deliveriesState.routes.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								Aucune tournée pour le moment.
								<Button variant="link" href="/deliveries/new" class="px-1">Créer une tournée</Button>
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
										{#each deliveriesState.routes.slice(0, 5) as delivery}
											<TableRow>
												<TableCell>
													<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
														{delivery.route}
													</Button>
												</TableCell>
												<TableCell>{delivery.driver}</TableCell>
												<TableCell class="tabular-nums">{delivery.stops}</TableCell>
												<TableCell>
													<Badge variant={statusVariant(delivery.status)}>{delivery.status}</Badge>
												</TableCell>
												<TableCell class="tabular-nums">{delivery.eta}</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
							{#if deliveriesState.routes.length > 5}
								<div class="mt-4 text-center">
									<Button variant="link" href="/deliveries">
										Voir toutes les tournées ({deliveriesState.routes.length})
									</Button>
								</div>
							{/if}
						{/if}
					</CardContent>
				</Card>
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
