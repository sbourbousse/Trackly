<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { dateRangeState, getListFilters } from '$lib/stores/dateRange.svelte';
	import { getDeliveries, type ApiDelivery } from '$lib/api/deliveries';
	import { getDrivers } from '$lib/api/drivers';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
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

	type RouteGroup = {
		driverId: string;
		driverName: string;
		date: string;
		count: number;
		status: string;
	};

	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

	function formatRouteDate(isoDate: string): string {
		const [y, m, d] = isoDate.split('-').map(Number);
		if (!d) return isoDate;
		return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
	}

	function aggregateStatus(deliveries: ApiDelivery[]): string {
		const statuses = deliveries.map((d) => (d.status ?? '').toLowerCase());
		if (statuses.some((s) => s === 'inprogress')) return 'InProgress';
		if (statuses.some((s) => s === 'pending')) return 'Pending';
		if (statuses.some((s) => s === 'failed')) return 'Failed';
		if (statuses.some((s) => s === 'completed')) return 'Completed';
		return 'Pending';
	}

	let loading = $state(true);
	let error = $state<string | null>(null);
	let deliveries = $state<ApiDelivery[]>([]);
	let drivers = $state<{ id: string; name: string }[]>([]);
	let routeGroups = $state<RouteGroup[]>([]);

	async function load() {
		loading = true;
		error = null;
		try {
			const filters = getListFilters();
			const [deliveriesRes, driversRes] = await Promise.all([
				getDeliveries(filters),
				getDrivers()
			]);
			deliveries = deliveriesRes;
			drivers = driversRes.map((d) => ({ id: d.id, name: d.name }));

			const driverByName = new Map(drivers.map((d) => [d.id, d.name]));
			const byKey = new Map<string, ApiDelivery[]>();
			for (const d of deliveries) {
				const date = d.createdAt?.slice(0, 10) ?? '';
				if (!date) continue;
				const key = `${d.driverId ?? ''}|${date}`;
				if (!byKey.has(key)) byKey.set(key, []);
				byKey.get(key)!.push(d);
			}
			routeGroups = [...byKey.entries()]
				.map(([key, list]) => {
					const [driverId, date] = key.split('|');
					return {
						driverId,
						driverName: driverByName.get(driverId) ?? 'Non assigné',
						date,
						count: list.length,
						status: aggregateStatus(list)
					};
				})
				.sort((a, b) => b.date.localeCompare(a.date) || a.driverName.localeCompare(b.driverName));
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
	<PageHeader title="Tournées" subtitle="Regroupement par chauffeur et date." />

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
						{routeGroups.length} tournée{routeGroups.length !== 1 ? 's' : ''}
					</p>
				</div>
				<div class="flex items-center gap-2">
					<Button variant="outline" size="sm" href="/deliveries">Voir les livraisons</Button>
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
			{#if loading && routeGroups.length === 0}
				<div class="py-8 text-center text-muted-foreground">Chargement des tournées...</div>
			{:else if routeGroups.length === 0}
				<div class="py-8 text-center text-sm text-muted-foreground">
					Aucune tournée sur la période sélectionnée.
				</div>
			{:else}
				<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Chauffeur</TableHead>
								<TableHead>Date</TableHead>
								<TableHead class="tabular-nums">Arrêts</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead class="w-[140px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each routeGroups as group}
								<TableRow>
									<TableCell class="font-medium">{group.driverName}</TableCell>
									<TableCell class="tabular-nums">{formatRouteDate(group.date)}</TableCell>
									<TableCell class="tabular-nums">{group.count}</TableCell>
									<TableCell>
										<StatusBadge type="delivery" status={group.status} />
									</TableCell>
									<TableCell>
										<Button
											variant="link"
											href="/deliveries?driverId={encodeURIComponent(group.driverId)}&date={encodeURIComponent(group.date)}"
											class="h-auto p-0 font-normal"
										>
											Voir les livraisons
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
