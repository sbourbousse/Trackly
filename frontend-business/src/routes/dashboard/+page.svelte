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
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
	import { RangeCalendar } from '$lib/components/ui/range-calendar';
	import {
		dateRangeActions,
		dateRangeState,
		type DateFilterType,
		type TimePreset,
		TIME_PRESET_RANGES
	} from '$lib/stores/dateRange.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { getOrdersStats, type OrderStatsResponse } from '$lib/api/orders';
	import { getListFilters } from '$lib/stores/dateRange.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import type { DateRange } from 'bits-ui';

	const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
		value: `${String(i).padStart(2, '0')}:00`,
		label: `${String(i).padStart(2, '0')}h`
	}));

	const TIME_PRESET_OPTIONS: { value: TimePreset; label: string }[] = [
		{ value: 'matin', label: 'Matin (6h – 14h)' },
		{ value: 'aprem', label: 'Après-midi (14h – 22h)' },
		{ value: 'nuit', label: 'Nuit (22h – 6h lendemain)' },
		{ value: 'journee', label: 'Journée entière' }
	];

	const PRESETS: { label: string; getRange: () => DateRange }[] = [
		{
			label: "Aujourd'hui",
			getRange: () => {
				const t = today(getLocalTimeZone());
				return { start: t, end: t };
			}
		},
		{
			label: 'Demain',
			getRange: () => {
				const t = today(getLocalTimeZone()).add({ days: 1 });
				return { start: t, end: t };
			}
		},
		{
			label: '7 derniers jours',
			getRange: () => {
				const end = today(getLocalTimeZone());
				const start = end.subtract({ days: 6 });
				return { start, end };
			}
		},
		{
			label: 'Ce mois',
			getRange: () => {
				const t = today(getLocalTimeZone());
				const start = new CalendarDate(t.year, t.month, 1);
				const end = t;
				return { start, end };
			}
		}
	];

	let calendarOpen = $state(false);
	let orderStats = $state<OrderStatsResponse | null>(null);
	let orderStatsLoading = $state(false);
	let activeTab = $state('commandes-attente');

	async function onDateFilterChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		const value = target.value as DateFilterType;
		dateRangeActions.setDateFilter(value);
		await Promise.all([deliveriesActions.loadDeliveries(), ordersActions.loadOrders(), loadOrderStats()]);
	}

	function formatRangeLabel(): string {
		const { start, end } = dateRangeState.dateRange;
		if (!start || !end) return 'Plage';
		const same =
			start.year === end.year && start.month === end.month && start.day === end.day;
		const fmt = (d: DateValue) =>
			d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
				day: 'numeric',
				month: 'short',
				year: 'numeric'
			});
		const t = dateRangeState.timeRange;
		const timeLabel = t
			? dateRangeState.timePreset === 'nuit'
				? `${t.start} – ${t.end} (lendemain)`
				: `${t.start} – ${t.end}`
			: null;
		if (same && timeLabel) return `${fmt(start)} · ${timeLabel}`;
		if (same) return fmt(start);
		if (timeLabel) return `${fmt(start)} – ${fmt(end)} · ${timeLabel}`;
		return `${fmt(start)} – ${fmt(end)}`;
	}

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

	function applyPreset(preset: (typeof PRESETS)[0]) {
		dateRangeActions.setDateRange(preset.getRange());
		calendarOpen = false;
	}

	async function onDateRangeChange(value: DateRange | undefined) {
		if (value) dateRangeActions.setDateRange(value);
	}

	async function onTimeChange() {
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

	const chartData = $derived.by(() => {
		if (!orderStats) return { labels: [] as string[], values: [] as number[], byHour: false };
		if (orderStats.byHour.length > 0) {
			return {
				labels: orderStats.byHour.map((x) => x.hour),
				values: orderStats.byHour.map((x) => x.count),
				byHour: true
			};
		}
		return {
			labels: orderStats.byDay.map((x) => x.date),
			values: orderStats.byDay.map((x) => x.count),
			byHour: false
		};
	});

	const maxCount = $derived(
		chartData.values.length ? Math.max(...chartData.values, 1) : 1
	);

	function statusVariant(status: string) {
		if (status === 'Livree' || status === 'Completed') return 'default';
		if (status === 'En cours' || status === 'InProgress' || status === 'Prevue' || status === 'Pending') return 'secondary';
		return 'outline';
	}

	function displayDeliveryStatus(status: string) {
		if (status === 'Pending') return 'Prévue';
		if (status === 'Prevue') return 'Prévue';
		if (status === 'InProgress') return 'En cours';
		if (status === 'Completed') return 'Livrée';
		if (status === 'Failed') return 'Échec';
		return status;
	}

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

	<!-- Plage de travail : calendrier + filtre + graphique -->
	<Card>
		<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
			<div class="flex flex-wrap items-center gap-2">
				<PopoverRoot bind:open={calendarOpen}>
					<PopoverTrigger>
						{#snippet child({ props }: { props: Record<string, unknown> })}
							<Button variant="outline" class="gap-2 font-normal" {...props}>
								<CalendarIcon class="size-4" />
								{formatRangeLabel()}
								<ChevronDownIcon class="size-4 opacity-50" />
							</Button>
						{/snippet}
					</PopoverTrigger>
					<PopoverContent class="w-auto overflow-hidden p-0" align="start">
						<div class="flex">
							<div class="flex flex-col border-r p-2">
								<p class="text-muted-foreground mb-2 px-2 text-xs font-medium">Raccourcis</p>
								{#each PRESETS as preset}
									<Button
										variant="ghost"
										size="sm"
										class="justify-start font-normal"
										onclick={() => applyPreset(preset)}
									>
										{preset.label}
									</Button>
								{/each}
							</div>
							<div class="p-2">
								<RangeCalendar
									value={dateRangeState.dateRange}
									onValueChange={onDateRangeChange}
								/>
							</div>
							<div class="border-input flex min-w-[200px] flex-col gap-3 border-l p-3">
								<p class="text-muted-foreground text-xs font-medium">Plage horaire</p>
								<label class="flex items-center gap-2 text-sm">
									<Checkbox
										checked={dateRangeState.useManualTime}
										onCheckedChange={(v) => {
											dateRangeActions.setUseManualTime(v === true);
											onTimeChange();
										}}
									/>
									Heures personnalisées
								</label>
								{#if dateRangeState.useManualTime}
									<div class="flex items-center gap-1">
										<select
											class="border-input bg-background h-8 w-20 rounded-md border px-2 text-sm"
											value={dateRangeState.timeRange?.start ?? '08:00'}
											onchange={(e) => {
												const v = (e.target as HTMLSelectElement).value;
												dateRangeActions.setTimeRange({
													...dateRangeState.timeRange!,
													start: v
												});
												onTimeChange();
											}}
										>
											{#each HOUR_OPTIONS as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
										<span class="text-muted-foreground text-sm">–</span>
										<select
											class="border-input bg-background h-8 w-20 rounded-md border px-2 text-sm"
											value={dateRangeState.timeRange?.end ?? '20:00'}
											onchange={(e) => {
												const v = (e.target as HTMLSelectElement).value;
												dateRangeActions.setTimeRange({
													...dateRangeState.timeRange!,
													end: v
												});
												onTimeChange();
											}}
										>
											{#each HOUR_OPTIONS as opt}
												<option value={opt.value}>{opt.label}</option>
											{/each}
										</select>
									</div>
								{:else}
									<select
										class="border-input bg-background h-8 w-full rounded-md border px-2 text-sm"
										value={dateRangeState.timePreset}
										onchange={(e) => {
											const v = (e.target as HTMLSelectElement).value as TimePreset;
											dateRangeActions.setTimePreset(v);
											onTimeChange();
										}}
										aria-label="Créneau horaire"
									>
										{#each TIME_PRESET_OPTIONS as opt}
											<option value={opt.value}>{opt.label}</option>
										{/each}
									</select>
								{/if}
							</div>
						</div>
					</PopoverContent>
				</PopoverRoot>
				<label class="text-muted-foreground flex items-center gap-1.5 text-sm">
					<span>Filtrer par :</span>
					<select
						class="border-input bg-background ring-offset-background focus-visible:ring-ring h-8 rounded-md border px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
						value={dateRangeState.dateFilter}
						onchange={onDateFilterChange}
						aria-label="Type de filtre date"
					>
						<option value="CreatedAt">Date de création</option>
						<option value="OrderDate">Date commande</option>
					</select>
				</label>
			</div>
		</CardHeader>
		<CardContent class="min-w-0">
			<div class="rounded-md border bg-muted/30 p-4">
				<p class="text-muted-foreground mb-3 text-sm font-medium">
					{chartData.byHour ? 'Commandes par heure' : 'Commandes par jour'}
				</p>
				{#if orderStatsLoading}
					<div class="text-muted-foreground py-8 text-center text-sm">Chargement…</div>
				{:else if chartData.labels.length === 0}
					<div class="text-muted-foreground py-8 text-center text-sm">
						Sélectionnez une plage pour afficher le graphique.
					</div>
				{:else}
					<div
						class="flex items-end gap-0.5"
						role="img"
						aria-label="Graphique commandes"
					>
						{#each chartData.labels as label, i}
							<div
								class="bg-primary hover:bg-primary/90 min-w-[8px] flex-1 rounded-t transition-colors"
								style="height: {Math.max(4, (chartData.values[i] / maxCount) * 120)}px"
								title="{label}: {chartData.values[i]}"
							></div>
						{/each}
					</div>
					<div class="text-muted-foreground mt-2 flex justify-between text-xs">
						<span>{chartData.labels[0] ?? ''}</span>
						<span>{chartData.labels[chartData.labels.length - 1] ?? ''}</span>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>

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
													<Badge variant="secondary">{order.status}</Badge>
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
															<Badge variant={statusVariant(delivery.status)}>{displayDeliveryStatus(delivery.status)}</Badge>
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
															<Badge variant={statusVariant(delivery.status)}>{displayDeliveryStatus(delivery.status)}</Badge>
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
