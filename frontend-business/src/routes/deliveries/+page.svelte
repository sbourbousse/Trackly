<script lang="ts">
	import { page } from '$app/state';
	import { DropdownMenu } from 'bits-ui';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { dateRangeState, getListFilters, getDateRangeDayCount } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { deleteDeliveriesBatch, getDeliveriesStats, type DeliveryStatsResponse } from '$lib/api/deliveries';
	import { ordersActions } from '$lib/stores/orders.svelte';
	import DateFilterCard from '$lib/components/DateFilterCard.svelte';
	import OrdersChartContent from '$lib/components/OrdersChartContent.svelte';

	async function onDateFilterChange() {
		await deliveriesActions.loadDeliveries();
	}
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { cn } from '$lib/utils';

	let didInit = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	let deliveryStats = $state<DeliveryStatsResponse | null>(null);
	let deliveryStatsLoading = $state(false);
	let statusFilter = $state<string | null>(null);

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
		// Filtre client-side par chauffeur+date (liens legacy) si pas de routeId
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
		pending: 'Prévue',
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

	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

	const chartData = $derived.by(() => {
		if (!deliveryStats) return { labels: [] as string[], values: [] as number[], periodKeys: [] as string[], byHour: false, byMonth: false };
		if (deliveryStats.byHour.length > 0) {
			return {
				labels: deliveryStats.byHour.map((x) => x.hour),
				values: deliveryStats.byHour.map((x) => x.count),
				periodKeys: [] as string[],
				byHour: true,
				byMonth: false
			};
		}
		const dayCount = getDateRangeDayCount();
		if (dayCount > 30 && deliveryStats.byDay.length > 0) {
			const byMonthMap = new Map<string, number>();
			for (const { date, count } of deliveryStats.byDay) {
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
				periodKeys: sorted.map(([key]) => key),
				byHour: false,
				byMonth: true
			};
		}
		return {
			labels: deliveryStats.byDay.map((x) => x.date),
			values: deliveryStats.byDay.map((x) => x.count),
			periodKeys: deliveryStats.byDay.map((x) => x.date),
			byHour: false,
			byMonth: false
		};
	});

	async function loadDeliveryStats() {
		const filters = getListFilters();
		if (!filters.dateFrom || !filters.dateTo) {
			deliveryStats = null;
			return;
		}
		deliveryStatsLoading = true;
		try {
			deliveryStats = await getDeliveriesStats(filters);
		} catch {
			deliveryStats = null;
		} finally {
			deliveryStatsLoading = false;
		}
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		const routeId = page.url.searchParams.get('routeId') || undefined;
		deliveriesActions.loadDeliveries({ ...getListFilters(), routeId });
		ordersActions.loadOrders();
		loadDeliveryStats();
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
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Livraisons" subtitle="Liste des livraisons et suivi temps réel chauffeur." />

	<DateFilterCard
		chartTitle={chartData.byHour ? 'Livraisons par heure' : chartData.byMonth ? 'Livraisons par mois' : 'Livraisons par jour'}
		chartDescription="Répartition par statut des livraisons."
		chartDefaultOpen={false}
		onDateFilterChange={onDateFilterChange}
	>
		{#snippet chart()}
			<OrdersChartContent
				variant="delivery"
				loading={deliveryStatsLoading}
				labels={chartData.labels}
				values={chartData.values}
				deliveries={deliveriesState.routes}
				periodKeys={chartData.periodKeys}
				byHour={chartData.byHour}
				byMonth={chartData.byMonth}
				emptyMessage="Sélectionnez une plage pour afficher le graphique."
				selectedStatus={statusFilter}
				onStatusClick={handleStatusClick}
			/>
		{/snippet}
	</DateFilterCard>

	<Card>
		<CardHeader class="space-y-1">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle>Liste des livraisons</CardTitle>
					<p class="text-sm text-muted-foreground">
						{statusFilter
							? `${filteredDeliveries.length} sur ${deliveriesState.routes.length} livraison${deliveriesState.routes.length > 1 ? 's' : ''}`
							: `${deliveriesState.routes.length} livraison${deliveriesState.routes.length > 1 ? 's' : ''}`}
						{deliveriesState.lastUpdateAt ? ` · Dernière MAJ: ${deliveriesState.lastUpdateAt}` : ''}
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Button variant="outline" size="sm">Voir la carte</Button>
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
								<TableHead class="tabular-nums">ETA</TableHead>
								<TableHead>Livraison</TableHead>
								<TableHead>Chauffeur</TableHead>
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
										<StatusBadge type="delivery" status={delivery.status} />
									</TableCell>
									<TableCell class="tabular-nums">{delivery.eta}</TableCell>
									<TableCell onclick={(e) => e.stopPropagation()}>
										<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
											{delivery.route}
										</Button>
									</TableCell>
									<TableCell>{delivery.driver}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
