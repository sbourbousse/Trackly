<script lang="ts">
	/**
	 * Bar chart empilé par statut : vue planificateur de commandes.
	 * Barres en flex-grow avec min-width et scroll horizontal ; tooltips évolutifs (date relative / absolue).
	 */
	import { Tooltip as TooltipRoot, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import { getRelativeDateLabel, formatPeriodKeyAbsolute, parsePeriodKey } from '$lib/utils/relativeDate';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';

	type IconComponent = typeof ClockIcon;

	/** Seuil en nombre de barres : en dessous, on passe en mode "large" (barres plus larges / plus visibles). */
	export type WideBarThreshold = number;

	interface Props {
		/** 'order' = commandes (statuts order), 'delivery' = tournées (statuts delivery). */
		variant?: 'order' | 'delivery';
		/** true = barres horizontales : jours de haut en bas (axe Y), valeurs à droite (axe X). */
		horizontal?: boolean;
		/** Seuil : si nombre de barres <= à cette valeur, mode "large" (barres plus visibles). Défaut 5. */
		wideBarThreshold?: number;
		/** En mode vertical, largeur min par barre quand mode large (barres peu nombreuses). Défaut 80. */
		wideBarMinWidthPx?: number;
		/** En mode horizontal, largeur max des barres (axe X) quand mode large. Défaut 160. */
		wideBarMaxWidthPx?: number;
		/** Mode compact : réduit le padding et la hauteur des barres pour s'intégrer dans une barre de navigation. */
		compact?: boolean;
		loading?: boolean;
		labels?: string[];
		values?: number[];
		orders?: { status: string; orderDate?: string | null }[];
		deliveries?: { status: string; createdAt?: string | null }[];
		periodKeys?: string[];
		byHour?: boolean;
		byMonth?: boolean;
		/** Index de la barre correspondant à « maintenant » (tranche ou jour courant). Délimitation visuelle. */
		currentBarIndex?: number | null;
		emptyMessage?: string;
		selectedStatus?: string | null;
		onStatusClick?: (statusKey: string | null) => void;
	}
	let {
		variant = 'order',
		horizontal = false,
		wideBarThreshold = 5,
		wideBarMinWidthPx = 80,
		wideBarMaxWidthPx = 160,
		compact = false,
		loading = false,
		labels = [],
		values = [],
		orders = [],
		deliveries = [],
		periodKeys,
		byHour = false,
		byMonth = false,
		currentBarIndex = null,
		emptyMessage = 'Sélectionnez une plage pour afficher le graphique.',
		selectedStatus = null,
		onStatusClick
	}: Props = $props();

	/** Couleurs alignées sur les badges commandes (success=emerald, warning=amber, info=sky, destructive). */
	const ORDER_STATUS_CONFIG: {
		key: string;
		label: string;
		colorClass: string;
		icon: IconComponent;
	}[] = [
		{ key: 'pending', label: 'En attente', colorClass: 'bg-slate-400 dark:bg-slate-500', icon: ClockIcon },
		{
			key: 'pending_overdue',
			label: 'En attente (dépassée)',
			colorClass: 'bg-slate-400 dark:bg-slate-500 overdue-hatch',
			icon: ClockIcon
		},
		{ key: 'planned', label: 'Planifiée', colorClass: 'bg-sky-500', icon: PackageIcon },
		{
			key: 'planned_overdue',
			label: 'Planifiée (dépassée)',
			colorClass: 'bg-sky-500 overdue-hatch',
			icon: PackageIcon
		},
		{ key: 'intransit', label: 'En transit', colorClass: 'bg-amber-500', icon: TruckIcon },
		{ key: 'delivered', label: 'Livrée', colorClass: 'bg-emerald-500', icon: CheckCircle2Icon },
		{ key: 'cancelled', label: 'Annulée', colorClass: 'bg-destructive', icon: XCircleIcon }
	];

	/** Couleurs alignées sur les badges tournées (StatusBadge type="delivery"). */
	const DELIVERY_STATUS_CONFIG: {
		key: string;
		label: string;
		colorClass: string;
		icon: IconComponent;
	}[] = [
		{ key: 'pending', label: 'Planifiée', colorClass: 'bg-sky-500', icon: ClockIcon },
		{ key: 'inprogress', label: 'En cours', colorClass: 'bg-amber-500', icon: TruckIcon },
		{ key: 'completed', label: 'Livrée', colorClass: 'bg-emerald-500', icon: CheckCircle2Icon },
		{ key: 'failed', label: 'Échouée', colorClass: 'bg-destructive', icon: XCircleIcon }
	];

	const STATUS_CONFIG = $derived(variant === 'delivery' ? DELIVERY_STATUS_CONFIG : ORDER_STATUS_CONFIG);

	function statusToKey(s: string): string {
		const lower = (s ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'en attente' || lower === '0') return 'pending';
		if (lower === 'planned' || lower === 'planifiée' || lower === '1') return 'planned';
		if (lower === 'intransit' || lower === 'en transit' || lower === 'en cours' || lower === '2') return 'intransit';
		if (lower === 'delivered' || lower === 'livrée' || lower === 'livree' || lower === '3') return 'delivered';
		if (lower === 'cancelled' || lower === 'annulée' || lower === '4') return 'cancelled';
		return 'pending';
	}

	function orderStatusToDisplayKey(order: { status: string; orderDate?: string | null }): string {
		const base = statusToKey(order.status);
		if (base !== 'pending' && base !== 'planned') return base;
		if (!order.orderDate) return base;
		const orderDate = new Date(order.orderDate);
		if (Number.isNaN(orderDate.getTime())) return base;

		// Logique "retard" alignée sur les tranches 4h de l'interface.
		const getSlotStartMs = (d: Date) => {
			const slotHour = Math.floor(d.getHours() / 4) * 4;
			return new Date(
				d.getFullYear(),
				d.getMonth(),
				d.getDate(),
				slotHour,
				0,
				0,
				0
			).getTime();
		};
		const nowSlotStartMs = getSlotStartMs(new Date());
		const orderSlotStartMs = getSlotStartMs(orderDate);
		if (orderSlotStartMs >= nowSlotStartMs) return base;

		return base === 'pending' ? 'pending_overdue' : 'planned_overdue';
	}

	function deliveryStatusToKey(s: string): string {
		const lower = (s ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'prevue' || lower === 'prévue' || lower === '0') return 'pending';
		if (lower === 'inprogress' || lower === 'en cours' || lower === '1') return 'inprogress';
		if (lower === 'completed' || lower === 'livrée' || lower === 'livree' || lower === '2') return 'completed';
		if (lower === 'failed' || lower === 'échouée' || lower === 'echouee' || lower === '3') return 'failed';
		return 'pending';
	}

	type StackedRow = {
		period: string;
		periodKey: string;
		total: number;
		segments: { key: string; label: string; colorClass: string; icon: IconComponent; count: number }[];
	};

	/** Pour livraisons : extrait la clé période (yyyy-MM-dd ou yyyy-MM) depuis createdAt ISO. */
	function deliveryPeriodKey(createdAt: string | null | undefined, forMonth: boolean): string {
		if (!createdAt) return '';
		const d = createdAt.slice(0, 10);
		return forMonth ? d.slice(0, 7) : d;
	}

	/** Clé tranche 4h (yyyy-MM-dd-HH) à partir d’une date/heure ISO ou yyyy-MM-dd. Heure locale. */
	function getSlotKeyFromDate(isoOrDateStr: string | null | undefined): string | null {
		if (!isoOrDateStr) return null;
		const s = isoOrDateStr.trim();
		if (s.length < 10) return null;
		const d = new Date(s);
		if (Number.isNaN(d.getTime())) return null;
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		const datePart = `${y}-${m}-${day}`;
		const hour = d.getHours();
		const slot = Math.min(20, Math.floor(hour / 4) * 4);
		return `${datePart}-${String(slot).padStart(2, '0')}`;
	}

	/** true si la clé période est une tranche 4h (yyyy-MM-dd-00|04|08|12|16|20). */
	function isFourHourSlotKey(key: string): boolean {
		const parts = key.split('-');
		if (parts.length !== 4) return false;
		const h = parseInt(parts[3]!, 10);
		return [0, 4, 8, 12, 16, 20].includes(h);
	}

	const stackedData = $derived.by((): StackedRow[] => {
		if (!labels.length) return [];
		const keys = periodKeys ?? labels;
		const totalLabel = variant === 'delivery' ? 'Livraisons' : 'Commandes';
		if (byHour) {
			return labels.map((period, i) => ({
				period,
				periodKey: period,
				total: values[i] ?? 0,
				segments: [{ key: 'total', label: totalLabel, colorClass: 'bg-primary', icon: PackageIcon, count: values[i] ?? 0 }]
			}));
		}
		const useFourHourSlots = keys.length > 0 && isFourHourSlotKey(keys[0]!);
		if (variant === 'delivery') {
			return labels.map((period, i) => {
				const key = keys[i];
				if (!key) return { period, periodKey: period, total: 0, segments: [] };
				const deliveriesInPeriod = useFourHourSlots
					? deliveries.filter((d) => getSlotKeyFromDate(d.createdAt) === key)
					: deliveries.filter((d) => {
							const k = deliveryPeriodKey(d.createdAt, byMonth);
							if (key.length === 7) return k.startsWith(key);
							return k === key || k.startsWith(key);
						});
				const byStatus = new Map<string, number>();
				for (const d of deliveriesInPeriod) {
					const k = deliveryStatusToKey(d.status);
					byStatus.set(k, (byStatus.get(k) ?? 0) + 1);
				}
				const segments = STATUS_CONFIG.filter((s) => (byStatus.get(s.key) ?? 0) > 0).map((s) => ({
					...s,
					count: byStatus.get(s.key) ?? 0
				}));
				const total = segments.reduce((a, seg) => a + seg.count, 0);
				return { period, periodKey: key, total, segments };
			});
		}
		return labels.map((period, i) => {
			const key = keys[i];
			if (!key) return { period, periodKey: period, total: 0, segments: [] };
			const ordersInPeriod = useFourHourSlots
				? orders.filter((o) => getSlotKeyFromDate(o.orderDate ?? null) === key)
				: orders.filter((o) => {
						const d = o.orderDate ?? '';
						if (key.length === 7) return d.startsWith(key);
						return d === key || d.startsWith(key);
					});
			const byStatus = new Map<string, number>();
			for (const o of ordersInPeriod) {
				const k = orderStatusToDisplayKey(o);
				byStatus.set(k, (byStatus.get(k) ?? 0) + 1);
			}
			const segments = STATUS_CONFIG.filter((s) => (byStatus.get(s.key) ?? 0) > 0).map((s) => ({
				...s,
				count: byStatus.get(s.key) ?? 0
			}));
			const total = segments.reduce((a, seg) => a + seg.count, 0);
			return { period, periodKey: key, total, segments };
		});
	});

	const maxTotal = $derived(stackedData.length ? Math.max(...stackedData.map((r) => r.total), 1) : 1);
	const BAR_HEIGHT = $derived(compact ? 40 : 120);
	const ROW_HEIGHT_H = $derived(compact ? 16 : 24);
	const GAP_PX = $derived(compact ? 2 : 8);
	const loadingHeightPx = $derived(compact ? 56 : 220);

	/** Mode "large" : peu de barres → barres plus larges / plus visibles. */
	const isWideMode = $derived(stackedData.length > 0 && stackedData.length <= wideBarThreshold);

	/** Largeur max des barres horizontales (axe X) : plus grande en mode large. */
	const barMaxWidthH = $derived(isWideMode ? wideBarMaxWidthPx : 100);
	/** Largeur min par barre (vertical) : plus grande en mode large. */
	const barMinPx = $derived(isWideMode ? wideBarMinWidthPx : 48);
	/** Ordre des statuts pour les tranches verticales (une barre par statut par jour). */
	const statusKeysOrder = $derived(STATUS_CONFIG.map((s) => s.key));
	const sliceGapPx = 1;
	/** Largeur min totale du graphique (scroll si besoin). Les colonnes prennent ensuite tout l'espace dispo (flex: 1). */
	const chartMinWidthPx = $derived(stackedData.length * barMinPx + Math.max(0, stackedData.length - 1) * GAP_PX);

	/** Graduations de l'axe Y : 0, puis réparties jusqu'à maxTotal (max 6 ticks). */
	const yAxisTicks = $derived.by(() => {
		if (maxTotal <= 0) return [0];
		const maxTicks = 6;
		let step = 1;
		if (maxTotal > 1) {
			const rawStep = maxTotal / (maxTicks - 1);
			const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
			step = Math.ceil(rawStep / magnitude) * magnitude;
			if (step < 1) step = 1;
		}
		const ticks: number[] = [0];
		for (let v = step; v <= maxTotal; v += step) {
			ticks.push(Math.round(v * 10) / 10);
		}
		if (ticks[ticks.length - 1] !== maxTotal && maxTotal > 0) {
			ticks.push(maxTotal);
		}
		return ticks;
	});

	/** Libellé tooltip : relatif (Hier, Aujourd’hui) + absolu en secondaire (évolutif pour switch plus tard). */
	function tooltipTitle(row: StackedRow): { primary: string; secondary: string | null } {
		if (byHour) return { primary: row.period, secondary: null };
		if (isFourHourSlotKey(row.periodKey)) {
			const dayKey = row.periodKey.slice(0, 10);
			return {
				primary: getRelativeDateLabel(dayKey),
				secondary: row.period
			};
		}
		if (parsePeriodKey(row.periodKey)) {
			return {
				primary: getRelativeDateLabel(row.periodKey),
				secondary: formatPeriodKeyAbsolute(row.periodKey, byMonth)
			};
		}
		return { primary: row.period, secondary: null };
	}

	const axisTickIndices = $derived.by(() => {
		const n = stackedData.length;
		if (n <= 2) return n === 0 ? [] : [0, n - 1];
		const maxTicks = 8;
		const step = Math.max(1, Math.floor(n / (maxTicks - 1)));
		const indices: number[] = [];
		for (let i = 0; i < n; i += step) indices.push(i);
		if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);
		return indices;
	});

	const legendItems = $derived.by(() => {
		const keys = [...new Set(stackedData.flatMap((r) => r.segments.map((s) => s.key)))];
		return STATUS_CONFIG.filter((s) => keys.includes(s.key));
	});

	function handleSegmentClick(statusKey: string) {
		if (!onStatusClick) return;
		// Toggle: if same status is clicked again, clear the filter
		if (selectedStatus === statusKey) {
			onStatusClick(null);
		} else {
			onStatusClick(statusKey);
		}
	}
</script>

<style>
	/* Force chaque colonne de barre à prendre toute la largeur de sa graduation */
	.chart-bar-column-inner :global([data-slot='tooltip-trigger']) {
		display: block;
		width: 100%;
		min-width: 0;
		flex: 1 1 0;
	}

	/* Croisillon rouge pour les statuts en attente/planifiée dépassés */
	.overdue-hatch {
		background-image:
			repeating-linear-gradient(
				45deg,
				rgba(220, 38, 38, 0.55) 0,
				rgba(220, 38, 38, 0.55) 2px,
				transparent 2px,
				transparent 6px
			),
			repeating-linear-gradient(
				-45deg,
				rgba(220, 38, 38, 0.45) 0,
				rgba(220, 38, 38, 0.45) 2px,
				transparent 2px,
				transparent 6px
			);
		background-blend-mode: multiply;
	}
</style>

<TooltipProvider delayDuration={200}>
	<div class="min-w-0 h-full flex flex-col {compact ? 'p-0' : 'rounded-md border bg-muted/30 p-4'}">
		{#if loading}
			<div
				class="flex min-w-0 flex-col {compact ? 'gap-1' : 'gap-3'}"
				style="height: {loadingHeightPx}px"
				aria-label="Chargement du graphique"
			>
				<!-- Skeleton barres : conserve la hauteur du widget et évite les sauts -->
				<div class="flex min-w-0 flex-1 items-end {compact ? 'gap-1' : 'gap-2'}">
					{#each Array(compact ? 10 : 12) as _, i}
						<div class="min-w-0 flex-1">
							<div
								class="w-full rounded-sm bg-muted/70 animate-pulse"
								style="height: {compact ? 10 + (i % 4) * 6 : 28 + (i % 5) * 16}px"
							></div>
						</div>
					{/each}
				</div>
				{#if !compact}
					<div class="h-3 w-full rounded-sm bg-muted/60 animate-pulse"></div>
				{/if}
			</div>
		{:else if stackedData.length === 0}
			<div class="text-muted-foreground py-8 text-center text-sm">{emptyMessage}</div>
		{:else}
			<div class="flex min-w-0 flex-1 flex-col {compact ? 'gap-0' : 'gap-2'}">
				{#if horizontal}
					<!-- Mode horizontal : jours de haut en bas (axe Y), barres vers la droite (axe X) -->
					<div
						class="flex min-w-0 flex-col gap-1 relative"
						role="img"
						aria-label={variant === 'delivery' ? 'Répartition des tournées par jour (haut en bas)' : 'Répartition des commandes par jour (haut en bas)'}
					>
					{#each stackedData as row, i}
						<div
							class="flex min-w-0 items-center {compact ? 'gap-1' : 'gap-2'} rounded-sm transition-colors {currentBarIndex !== null && currentBarIndex === i ? 'bg-primary/10 dark:bg-primary/20 border border-primary/50' : ''}"
							style="min-height: {ROW_HEIGHT_H}px"
						>
							<TooltipRoot>
								<TooltipTrigger>
									<div class="flex min-w-0 flex-1 items-center {compact ? 'gap-1' : 'gap-2'}" style="min-height: {ROW_HEIGHT_H}px">
										{#if !compact}
											<span class="text-muted-foreground w-14 shrink-0 truncate text-right text-xs" title={row.period}>{row.period}</span>
										{/if}
										<div
											class="flex min-w-0 flex-1 items-stretch overflow-hidden rounded"
											style="width: {row.total === 0 ? 2 : Math.max(4, (row.total / maxTotal) * barMaxWidthH)}px; max-width: {barMaxWidthH}px; height: {ROW_HEIGHT_H - (compact ? 2 : 4)}px"
										>
											{#if row.total === 0}
												<div class="bg-muted h-full w-full rounded" aria-hidden="true"></div>
											{:else}
												{#each row.segments as seg}
													{#if seg.count > 0}
														{@const isOtherSelected = selectedStatus && selectedStatus !== seg.key}
														<button
															type="button"
															class="h-full min-w-[2px] flex-1 transition-opacity hover:opacity-90 {seg.colorClass} cursor-pointer border-0 p-0 first:rounded-l last:rounded-r"
															style="flex: {seg.count}; opacity: {isOtherSelected ? '0.3' : '1'}"
															onclick={(e) => {
																e.stopPropagation();
																handleSegmentClick(seg.key);
															}}
															aria-label="Filtrer par {seg.label}"
														></button>
													{/if}
												{/each}
											{/if}
										</div>
									</div>
								</TooltipTrigger>
								{@const tt = tooltipTitle(row)}
								<TooltipContent side="top" class="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md max-w-[280px]">
									<p class="mb-1 text-xs font-semibold">{tt.primary}</p>
									{#if tt.secondary}
										<p class="text-muted-foreground mb-2 text-[11px]">{tt.secondary}</p>
									{/if}
									<div class="flex flex-col gap-1.5 text-xs">
										{#if row.total === 0}
											<p class="text-muted-foreground">{variant === 'delivery' ? 'Aucune livraison' : 'Aucune commande'}</p>
										{:else}
											{#each row.segments as seg}
												{@const Icon = seg.icon}
												<div class="flex items-center gap-2">
													<span class="inline-flex size-3 shrink-0 rounded-sm {seg.colorClass}" aria-hidden="true"></span>
													<Icon class="size-3.5 shrink-0 text-muted-foreground" />
													<span class="font-medium">{seg.label}</span>
													<span class="tabular-nums text-muted-foreground">{seg.count}</span>
												</div>
											{/each}
										{/if}
									</div>
								</TooltipContent>
							</TooltipRoot>
							</div>
						{/each}
						<!-- Axe X : 0 à max -->
						<div class="text-muted-foreground flex items-center gap-1 pl-[3.5rem] text-[10px] tabular-nums">
							<span>0</span>
							<div class="flex-1" style="max-width: {barMaxWidthH}px"></div>
							<span>{maxTotal}</span>
						</div>
					</div>
					{#if legendItems.length > 0}
						<div class="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
							{#each legendItems as item}
								{@const LegendIcon = item.icon}
								{@const isSelected = selectedStatus === item.key}
								{@const isOtherSelected = selectedStatus && selectedStatus !== item.key}
								<button
									type="button"
									class="flex shrink-0 items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer border-0 bg-transparent p-0"
									style="opacity: {isOtherSelected ? '0.4' : '1'}"
									onclick={() => handleSegmentClick(item.key)}
									aria-label="Filtrer par {item.label}"
								>
									<span class="inline-flex size-3 shrink-0 rounded-sm {item.colorClass}" aria-hidden="true"></span>
									<LegendIcon class="size-3.5 shrink-0" />
									<span class={isSelected ? 'font-semibold' : ''}>{item.label}</span>
								</button>
							{/each}
						</div>
					{/if}
				{:else}
				<div class="flex min-w-0 {compact ? 'gap-1' : 'gap-2'}">
					{#if !compact}
						<!-- Axe Y : graduations -->
						<div
							class="text-muted-foreground flex shrink-0 flex-col justify-between py-0.5 text-right text-xs tabular-nums"
							style="height: {BAR_HEIGHT}px; width: 2.25rem"
							aria-hidden="true"
						>
							{#each [...yAxisTicks].reverse() as tick}
								<span>{tick}</span>
							{/each}
						</div>
					{/if}
					<div class="min-w-0 flex-1 overflow-x-auto relative" role="img" aria-label={variant === 'delivery' ? 'Répartition des tournées par période et par statut' : 'Répartition des commandes par période et par statut (planification)'}>
					<div class="min-w-0" style="width: 100%; min-width: max(100%, {chartMinWidthPx}px)">
				<div
					class="flex items-end {compact ? 'gap-1' : 'gap-2'} relative"
					style="width: 100%"
				>
					{#each stackedData as row, i}
						<div class="chart-bar-column flex flex-1 shrink-0 flex-col relative {currentBarIndex !== null && currentBarIndex === i ? 'bg-primary/10 dark:bg-primary/20 outline outline-2 outline-primary/50 outline-offset-[-2px] rounded-sm' : ''}" style="min-width: {barMinPx}px; width: 0;">
							<div class="chart-bar-column-inner flex min-h-0 w-full flex-1 flex-col">
							<TooltipRoot>
								<TooltipTrigger>
								<div
									class="flex h-full w-full flex-col items-stretch cursor-default rounded-none border-0 bg-transparent p-0"
									style="height: {BAR_HEIGHT}px"
								>
								<!-- Tranches verticales par statut : une barre par statut, partageant toute la largeur dispo (flex: 1) -->
								<div
									class="chart-slices-row flex w-full flex-1 items-end min-h-0"
									style="height: {BAR_HEIGHT}px; min-height: {BAR_HEIGHT}px; gap: {sliceGapPx}px"
								>
									{#if row.total === 0}
										<div class="bg-muted/50 w-full min-h-[2px] rounded" style="height: 2px" aria-hidden="true"></div>
									{:else}
										{#each statusKeysOrder as statusKey}
											{@const seg = row.segments.find((s) => s.key === statusKey)}
											{@const count = seg?.count ?? 0}
											{@const config = STATUS_CONFIG.find((c) => c.key === statusKey)}
											{#if config}
												{@const h = maxTotal > 0 && count > 0 ? (count / maxTotal) * BAR_HEIGHT : 0}
												{@const isOtherSelected = selectedStatus && selectedStatus !== statusKey}
												<div
													class="chart-slice flex min-w-[3px] flex-1 flex-col items-stretch justify-end rounded-t border border-border/30"
													title="{config.label}: {count}"
												>
													{#if count > 0}
														<button
															type="button"
															class="w-full transition-opacity hover:opacity-90 {config.colorClass} cursor-pointer border-0 p-0 rounded-t-sm shrink-0"
															style="height: {Math.max(2, h)}px; opacity: {isOtherSelected ? '0.3' : '1'}"
															onclick={(e) => {
																e.stopPropagation();
																handleSegmentClick(statusKey);
															}}
															aria-label="Filtrer par {config.label}"
														></button>
													{:else}
														<div class="bg-muted/30 w-full rounded-t-sm shrink-0" style="height: 2px" aria-hidden="true"></div>
													{/if}
												</div>
											{/if}
										{/each}
									{/if}
								</div>
								</div>
							</TooltipTrigger>
							{@const tt = tooltipTitle(row)}
							<TooltipContent side="top" class="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md max-w-[280px]">
								<p class="mb-1 text-xs font-semibold">{tt.primary}</p>
								{#if tt.secondary}
									<p class="text-muted-foreground mb-2 text-[11px]">{tt.secondary}</p>
								{/if}
								<div class="flex flex-col gap-1.5 text-xs">
									{#if row.total === 0}
										<p class="text-muted-foreground">{variant === 'delivery' ? 'Aucune livraison' : 'Aucune commande'}</p>
									{:else}
										{#each row.segments as seg}
											{@const Icon = seg.icon}
											<div class="flex items-center gap-2">
												<span class="inline-flex size-3 shrink-0 rounded-sm {seg.colorClass}" aria-hidden="true"></span>
												<Icon class="size-3.5 shrink-0 text-muted-foreground" />
												<span class="font-medium">{seg.label}</span>
												<span class="tabular-nums text-muted-foreground">{seg.count}</span>
											</div>
										{/each}
									{/if}
								</div>
							</TooltipContent>
							</TooltipRoot>
							</div>
						</div>
					{/each}
				</div>
			<div
				class="text-muted-foreground flex min-w-0 {compact ? 'mt-0.5 gap-0.5 text-[10px] leading-tight' : 'mt-2 gap-2 text-xs'}"
				style="width: 100%"
			>
				{#each stackedData as row, i}
					<div class="flex flex-1 shrink-0 justify-center truncate" style="min-width: {barMinPx}px">
						{#if compact}
							<!-- En mode compact, afficher toutes les dates/heures mais en petit -->
							<span class="truncate text-center whitespace-nowrap" title={row.period}>{row.period}</span>
						{:else if axisTickIndices.includes(i)}
							<span class="truncate" title={row.period}>{row.period}</span>
						{/if}
					</div>
				{/each}
			</div>
					</div>
					</div>
				</div>
				{#if !compact && legendItems.length > 0}
					<div
						class="text-muted-foreground flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs"
						style="width: 100%"
					>
					{#each legendItems as item}
						{@const LegendIcon = item.icon}
						{@const isSelected = selectedStatus === item.key}
						{@const isOtherSelected = selectedStatus && selectedStatus !== item.key}
						<button
							type="button"
							class="flex shrink-0 items-center gap-1.5 transition-opacity hover:opacity-80 cursor-pointer border-0 bg-transparent p-0"
							style="opacity: {isOtherSelected ? '0.4' : '1'}"
							onclick={() => handleSegmentClick(item.key)}
							aria-label="Filtrer par {item.label}"
						>
							<span class="inline-flex size-3 shrink-0 rounded-sm {item.colorClass}" aria-hidden="true"></span>
							<LegendIcon class="size-3.5 shrink-0" />
							<span class={isSelected ? 'font-semibold' : ''}>{item.label}</span>
						</button>
					{/each}
					</div>
				{/if}
				{/if}
			</div>
		{/if}
	</div>
</TooltipProvider>
