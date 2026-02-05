<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { dateRangeState, getListFilters } from '$lib/stores/dateRange.svelte';
	import { getRoutes, type ApiRoute } from '$lib/api/routes';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
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
	import DateFilterCard from '$lib/components/DateFilterCard.svelte';

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

	let loading = $state(true);
	let error = $state<string | null>(null);
	let routeList = $state<ApiRoute[]>([]);

	async function load() {
		loading = true;
		error = null;
		try {
			const filters = getListFilters();
			routeList = await getRoutes({
				dateFrom: filters.dateFrom,
				dateTo: filters.dateTo
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erreur lors du chargement des tournées';
		} finally {
			loading = false;
		}
	}

	async function onDateFilterChange() {
		await load();
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		load();
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Tournées" subtitle="Liste des tournées créées (une par batch de livraisons)." />

	<DateFilterCard
		chartTitle="Tournées"
		chartDescription="Période affichée pour les tournées."
		chartDefaultOpen={false}
		onDateFilterChange={onDateFilterChange}
	>
		{#snippet chart()}
			<div class="py-4 text-center text-sm text-muted-foreground">
				Modifiez la plage ci-dessus pour recharger les tournées.
			</div>
		{/snippet}
	</DateFilterCard>

	<Card>
		<CardHeader class="space-y-1">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle>Liste des tournées</CardTitle>
					<p class="text-sm text-muted-foreground">
						{routeList.length} tournée{routeList.length !== 1 ? 's' : ''}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" href="/deliveries">Voir les livraisons</Button>
					<Button variant="outline" size="sm" href="/deliveries/new">Créer une tournée</Button>
					<Button variant="outline" size="sm" onclick={() => load()} disabled={loading}>
						{loading ? 'Chargement...' : 'Actualiser'}
					</Button>
				</div>
			</div>
		</CardHeader>
		<CardContent class="space-y-4">
			{#if error}
				<Alert variant="destructive">
					<AlertTitle>Erreur</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}
			{#if loading && routeList.length === 0}
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
								<TableHead>Date</TableHead>
								<TableHead class="tabular-nums">Arrêts</TableHead>
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
									<TableCell class="tabular-nums">{formatRouteDate(route.createdAt)}</TableCell>
									<TableCell class="tabular-nums">{route.deliveryCount}</TableCell>
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
</div>
