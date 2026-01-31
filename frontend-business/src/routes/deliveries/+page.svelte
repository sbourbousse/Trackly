<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { dateRangeState, getListFilters, getDateRangeDayCount } from '$lib/stores/dateRange.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { deleteDeliveriesBatch } from '$lib/api/deliveries';
	import { getOrdersStats, type OrderStatsResponse } from '$lib/api/orders';
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
	import { Input } from '$lib/components/ui/input';
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
	let orderStats = $state<OrderStatsResponse | null>(null);
	let orderStatsLoading = $state(false);

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

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		deliveriesActions.loadDeliveries();
		loadOrderStats();
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
		if (selectedIds.size === deliveriesState.routes.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(deliveriesState.routes.map((d) => d.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;
		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} tournée${count > 1 ? 's' : ''} ?`)) return;
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
	<PageHeader title="Tournées" subtitle="Suivi des tournées et du temps réel chauffeur." />

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

	<Card>
		<CardHeader class="space-y-1">
			<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle>Tournées du jour</CardTitle>
					<p class="text-sm text-muted-foreground">
						{deliveriesState.routes.length} tournée{deliveriesState.routes.length > 1 ? 's' : ''}
						{deliveriesState.lastUpdateAt ? ` · Dernière MAJ: ${deliveriesState.lastUpdateAt}` : ''}
					</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<Input type="search" placeholder="Filtrer par chauffeur" class="h-9 w-48 rounded-full" />
						<Button variant="outline" size="sm">Voir la carte</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={() => deliveriesActions.loadDeliveries()}
							disabled={deliveriesState.loading}
						>
							{deliveriesState.loading ? 'Chargement...' : 'Actualiser'}
						</Button>
						<Button size="sm" href="/deliveries/new">Nouvelle tournée</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
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
							{selectedIds.size} tournée{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
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
					<div class="py-8 text-center text-muted-foreground">Chargement des tournées...</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-10">
									<Checkbox
										checked={selectedIds.size === deliveriesState.routes.length && deliveriesState.routes.length > 0}
										onCheckedChange={toggleSelectAll}
										aria-label="Tout sélectionner"
									/>
								</TableHead>
								<TableHead>Tournée</TableHead>
								<TableHead>Chauffeur</TableHead>
								<TableHead>Arrêts</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead class="tabular-nums">ETA</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each deliveriesState.routes as delivery}
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
									<TableCell onclick={(e) => e.stopPropagation()}>
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
				{/if}
			</CardContent>
		</Card>
</div>
