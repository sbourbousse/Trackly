<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
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
	import { cn } from '$lib/utils';

	let didInit = $state(false);

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

	const actions = [
		{ title: 'Importer des commandes', subtitle: 'CSV, Shopify, Woo', href: '/orders/import' },
		{ title: 'Créer une tournée', subtitle: "Optimiser l'ordre de passage", href: '/deliveries/new' },
		{ title: 'Gérer les livreurs', subtitle: 'Ajouter et voir les livreurs', href: '/drivers' },
		{ title: 'Voir les commandes', subtitle: 'Gérer les commandes', href: '/orders' },
		{ title: 'Voir les tournées', subtitle: 'Suivre les livraisons', href: '/deliveries' }
	];

	function statusVariant(status: string) {
		if (status === 'Livree') return 'default';
		if (status === 'En cours' || status === 'Prevue') return 'secondary';
		return 'outline';
	}
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-6">
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

		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each actions as action}
				<Button
					variant="outline"
					class="h-auto flex-row justify-between gap-4 px-4 py-4 text-left"
					href={action.href}
				>
					<div class="flex flex-col gap-0.5">
						<span class="font-semibold">{action.title}</span>
						<span class="text-xs font-normal text-muted-foreground">{action.subtitle}</span>
					</div>
					<span class="text-muted-foreground">→</span>
				</Button>
			{/each}
		</section>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle>Tournées récentes</CardTitle>
				<Badge variant="secondary">Temps réel</Badge>
			</CardHeader>
			<CardContent>
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
</div>
