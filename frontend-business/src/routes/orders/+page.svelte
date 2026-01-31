<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { getListFilters, getDateRangeDayCount } from '$lib/stores/dateRange.svelte';
	import { deleteOrdersBatch, getOrdersStats, type OrderStatsResponse } from '$lib/api/orders';
	import DateFilterCard from '$lib/components/DateFilterCard.svelte';
	import OrdersChartContent from '$lib/components/OrdersChartContent.svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { cn } from '$lib/utils';

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		'En attente': 'destructive',
		'En cours': 'secondary',
		Livree: 'default'
	};

	let didInit = $state(false);
	let searchQuery = $state('');
	let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	let showCascadeWarning = $state(false);
	let forceDeleteDeliveries = $state(false);
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
		ordersActions.loadOrders();
		loadOrderStats();
	});

	function applySearch() {
		ordersActions.loadOrders({ search: searchQuery.trim() || undefined });
	}

	function onSearchInput() {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(applySearch, 300);
	}

	$effect(() => {
		if (didInit) return;
		didInit = true;
		ordersActions.loadOrders();
	});

	function toggleSelection(id: string) {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === ordersState.items.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(ordersState.items.map((o) => o.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
		showCascadeWarning = false;
		forceDeleteDeliveries = false;
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;
		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} commande${count > 1 ? 's' : ''} ?`)) return;
		deleting = true;
		deleteError = null;
		try {
			const result = await deleteOrdersBatch({
				ids: Array.from(selectedIds),
				forceDeleteDeliveries
			});
			if (result.skipped > 0 && !forceDeleteDeliveries) {
				showCascadeWarning = true;
				deleteError = `${result.skipped} commande(s) ont des livraisons actives. Cochez pour forcer la suppression.`;
				deleting = false;
				return;
			}
			clearSelection();
			await ordersActions.loadOrders();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Commandes" subtitle="Centralise les commandes avant création des tournées." />

	<DateFilterCard
		chartTitle={chartData.byHour ? 'Commandes par heure' : chartData.byMonth ? 'Commandes par mois' : 'Commandes par jour'}
		chartDefaultOpen={false}
		onDateFilterChange={async () => { await ordersActions.loadOrders(); }}
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
						<CardTitle>Commandes récentes</CardTitle>
						<p class="text-sm text-muted-foreground">Dernière synchro: {ordersState.lastSyncAt}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Input
							type="search"
							placeholder="Rechercher (client, adresse, tél., commentaire…)"
							class="h-9 w-64 min-w-0 sm:w-72"
							bind:value={searchQuery}
							oninput={onSearchInput}
						/>
						<Button variant="outline" size="sm" href="/orders/import">Importer CSV</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={ordersActions.loadOrders}
							disabled={ordersState.loading}
						>
							{ordersState.loading ? 'Chargement...' : 'Actualiser'}
						</Button>
						<Button size="sm" href="/orders/new">Nouvelle commande</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if ordersState.error}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{ordersState.error}</AlertDescription>
					</Alert>
				{/if}
				{#if deleteError}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{deleteError}</AlertDescription>
						{#if showCascadeWarning}
							<div class="mt-2 flex items-center gap-2">
								<Checkbox id="force-cascade" bind:checked={forceDeleteDeliveries} />
								<Label for="force-cascade" class="cursor-pointer text-sm">
									Supprimer aussi les livraisons associées (cascade)
								</Label>
							</div>
						{/if}
					</Alert>
				{/if}

				{#if selectedIds.size > 0}
					<div class="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2">
						<span class="text-sm text-muted-foreground">
							{selectedIds.size} commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
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

				{#if ordersState.loading && !ordersState.items.length}
					<div class="py-8 text-center text-muted-foreground">Chargement des commandes...</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-10">
									<Checkbox
										checked={selectedIds.size === ordersState.items.length && ordersState.items.length > 0}
										onCheckedChange={toggleSelectAll}
										aria-label="Tout sélectionner"
									/>
								</TableHead>
								<TableHead>Ref</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Client</TableHead>
								<TableHead>Tél.</TableHead>
								<TableHead>Adresse</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead class="tabular-nums">Livraisons</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each ordersState.items as order}
								<TableRow
									class={cn(
										'cursor-pointer transition-colors hover:bg-muted/50',
										selectedIds.has(order.id) && 'bg-primary/5'
									)}
									onclick={() => toggleSelection(order.id)}
								>
									<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(order.id)}
											onCheckedChange={() => toggleSelection(order.id)}
										/>
									</TableCell>
									<TableCell class="tabular-nums font-medium" onclick={(e) => e.stopPropagation()}>
										<Button variant="link" href="/orders/{order.id}" class="h-auto p-0 font-normal">
											{order.ref}
										</Button>
									</TableCell>
									<TableCell class="tabular-nums text-muted-foreground whitespace-nowrap">
										{order.orderDate
											? new Date(order.orderDate).toLocaleString('fr-FR', {
													day: '2-digit',
													month: '2-digit',
													year: 'numeric',
													hour: '2-digit',
													minute: '2-digit'
												})
											: '—'}
									</TableCell>
									<TableCell>{order.client}</TableCell>
									<TableCell class="text-muted-foreground whitespace-nowrap">{order.phoneNumber ?? '—'}</TableCell>
									<TableCell>{order.address}</TableCell>
									<TableCell>
										<Badge variant={statusVariant[order.status] ?? 'outline'}>{order.status}</Badge>
									</TableCell>
									<TableCell class="tabular-nums">{order.deliveries}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
