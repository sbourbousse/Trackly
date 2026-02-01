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

	interface Props {
		loading?: boolean;
		labels?: string[];
		values?: number[];
		orders?: { status: string; orderDate?: string | null }[];
		periodKeys?: string[];
		byHour?: boolean;
		byMonth?: boolean;
		emptyMessage?: string;
	}
	let {
		loading = false,
		labels = [],
		values = [],
		orders = [],
		periodKeys,
		byHour = false,
		byMonth = false,
		emptyMessage = 'Sélectionnez une plage pour afficher le graphique.'
	}: Props = $props();

	/** Couleurs alignées sur les badges (success=emerald, warning=amber, info=sky, destructive). */
	const STATUS_CONFIG: {
		key: string;
		label: string;
		colorClass: string;
		icon: IconComponent;
	}[] = [
		{ key: 'pending', label: 'En attente', colorClass: 'bg-sky-500', icon: ClockIcon },
		{ key: 'planned', label: 'Planifiée', colorClass: 'bg-slate-400 dark:bg-slate-500', icon: PackageIcon },
		{ key: 'intransit', label: 'En transit', colorClass: 'bg-amber-500', icon: TruckIcon },
		{ key: 'delivered', label: 'Livrée', colorClass: 'bg-emerald-500', icon: CheckCircle2Icon },
		{ key: 'cancelled', label: 'Annulée', colorClass: 'bg-destructive', icon: XCircleIcon }
	];

	function statusToKey(s: string): string {
		const lower = (s ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'en attente' || lower === '0') return 'pending';
		if (lower === 'planned' || lower === 'planifiée' || lower === '1') return 'planned';
		if (lower === 'intransit' || lower === 'en transit' || lower === 'en cours' || lower === '2') return 'intransit';
		if (lower === 'delivered' || lower === 'livrée' || lower === 'livree' || lower === '3') return 'delivered';
		if (lower === 'cancelled' || lower === 'annulée' || lower === '4') return 'cancelled';
		return 'pending';
	}

	type StackedRow = {
		period: string;
		periodKey: string;
		total: number;
		segments: { key: string; label: string; colorClass: string; icon: IconComponent; count: number }[];
	};

	const stackedData = $derived.by((): StackedRow[] => {
		if (!labels.length) return [];
		const keys = periodKeys ?? labels;
		if (byHour) {
			return labels.map((period, i) => ({
				period,
				periodKey: period,
				total: values[i] ?? 0,
				segments: [{ key: 'total', label: 'Commandes', colorClass: 'bg-primary', icon: PackageIcon, count: values[i] ?? 0 }]
			}));
		}
		return labels.map((period, i) => {
			const key = keys[i];
			if (!key) return { period, periodKey: period, total: 0, segments: [] };
			const ordersInPeriod = orders.filter((o) => {
				const d = o.orderDate ?? '';
				if (key.length === 7) return d.startsWith(key);
				return d === key || d.startsWith(key);
			});
			const byStatus = new Map<string, number>();
			for (const o of ordersInPeriod) {
				const k = statusToKey(o.status);
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
	const BAR_HEIGHT = 120;
	/** Largeur minimale des barres ; au-delà, scroll horizontal. */
	const BAR_MIN_PX = 48;
	const GAP_PX = 8;
	const chartMinWidthPx = $derived(stackedData.length * BAR_MIN_PX + Math.max(0, stackedData.length - 1) * GAP_PX);

	/** Libellé tooltip : relatif (Hier, Aujourd’hui) + absolu en secondaire (évolutif pour switch plus tard). */
	function tooltipTitle(row: StackedRow): { primary: string; secondary: string | null } {
		if (byHour) return { primary: row.period, secondary: null };
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
</script>

<TooltipProvider delayDuration={200}>
	<div class="min-w-0 rounded-md border bg-muted/30 p-4">
		{#if loading}
			<div class="text-muted-foreground py-8 text-center text-sm">Chargement…</div>
		{:else if stackedData.length === 0}
			<div class="text-muted-foreground py-8 text-center text-sm">{emptyMessage}</div>
		{:else}
			<div class="min-w-0 overflow-x-auto" role="img" aria-label="Répartition des commandes par période et par statut (planification)">
				<div
					class="flex items-end gap-2"
					style="width: 100%; min-width: max(100%, {chartMinWidthPx}px)"
				>
					{#each stackedData as row}
						<div class="flex flex-1 min-w-0 shrink-0" style="min-width: {BAR_MIN_PX}px">
							<TooltipRoot class="h-full w-full">
								<TooltipTrigger
									class="flex h-full w-full flex-col items-stretch cursor-default rounded-none border-0 bg-transparent p-0"
									style="height: {BAR_HEIGHT}px"
								>
								<div class="flex w-full flex-1 min-h-0 flex-col-reverse items-stretch gap-0">
									<!-- Base arrondie en bas : visualise le « jour » même vide -->
									<div
										class="w-full min-h-0 flex-1 rounded-b border border-border/50 bg-muted/30"
										aria-hidden="true"
									></div>
									{#each row.segments as seg, segIdx}
										{@const h = maxTotal > 0 ? (seg.count / maxTotal) * BAR_HEIGHT : 0}
										{#if h > 0}
											{@const isBottom = segIdx === 0}
											{@const isTop = segIdx === row.segments.length - 1}
											<div
												class="w-full min-w-[8px] shrink-0 transition-opacity hover:opacity-90 {seg.colorClass}"
												style="height: {Math.max(2, h)}px; border-radius: {isBottom ? '0 0 4px 4px' : isTop ? '4px 4px 0 0' : '0'}"
											></div>
										{/if}
									{/each}
								</div>
							</TooltipTrigger>
							{@const tt = tooltipTitle(row)}
							<TooltipContent side="top" class="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md max-w-[280px]">
								<p class="mb-1 text-xs font-semibold">{tt.primary}</p>
								{#if tt.secondary}
									<p class="text-muted-foreground mb-2 text-[11px]">{tt.secondary}</p>
								{/if}
								<div class="flex flex-col gap-1.5 text-xs">
									{#each row.segments as seg}
										{@const Icon = seg.icon}
										<div class="flex items-center gap-2">
											<span class="inline-flex size-3 shrink-0 rounded-sm {seg.colorClass}" aria-hidden="true"></span>
											<Icon class="size-3.5 shrink-0 text-muted-foreground" />
											<span class="font-medium">{seg.label}</span>
											<span class="tabular-nums text-muted-foreground">{seg.count}</span>
										</div>
									{/each}
								</div>
							</TooltipContent>
							</TooltipRoot>
						</div>
					{/each}
				</div>
			</div>
			<div
				class="text-muted-foreground mt-2 flex min-w-0 gap-2 text-xs"
				style="width: 100%; min-width: max(100%, {chartMinWidthPx}px)"
			>
				{#each stackedData as row, i}
					<div class="flex flex-1 min-w-[{BAR_MIN_PX}px] shrink-0 justify-center truncate" style="min-width: {BAR_MIN_PX}px">
						{#if axisTickIndices.includes(i)}
							<span class="truncate" title={row.period}>{row.period}</span>
						{/if}
					</div>
				{/each}
			</div>
			{@const legendKeys = [...new Set(stackedData.flatMap((r) => r.segments.map((s) => s.key)))]}
			{@const legendItems = STATUS_CONFIG.filter((s) => legendKeys.includes(s.key))}
			{#if legendItems.length > 0}
				<div class="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-xs">
					{#each legendItems as item}
						{@const LegendIcon = item.icon}
						<span class="flex items-center gap-1.5">
							<span class="inline-flex size-3 shrink-0 rounded-sm {item.colorClass}" aria-hidden="true"></span>
							<LegendIcon class="size-3.5 shrink-0" />
							{item.label}
						</span>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</TooltipProvider>
