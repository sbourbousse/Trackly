<script lang="ts">
	import { Badge, type BadgeVariant } from '$lib/components/ui/badge';
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import XCircleIcon from '@lucide/svelte/icons/x-circle';
	import type { SvelteComponent } from 'svelte';

	type OrderStatusKey =
		| 'Pending'
		| 'Planned'
		| 'InTransit'
		| 'Delivered'
		| 'Cancelled'
		| 'En attente'
		| 'Planifiée'
		| 'En transit'
		| 'Livree'
		| 'Livrée'
		| 'Annulée'
		| '0'
		| '1'
		| '2'
		| '3'
		| '4';
	type DeliveryStatusKey =
		| 'Pending'
		| 'InProgress'
		| 'Completed'
		| 'Failed'
		| 'Prevue'
		| 'Prévue'
		| 'En cours'
		| 'Livree'
		| 'Livrée'
		| 'Retard'
		| 'Échouée'
		| 'Échec'
		| '0'
		| '1'
		| '2'
		| '3';

	interface StatusConfig {
		label: string;
		variant: BadgeVariant;
		icon: typeof SvelteComponent;
	}

	const ORDER_STATUS: Record<OrderStatusKey, StatusConfig> = {
		Pending: { label: 'En attente', variant: 'outline', icon: ClockIcon },
		Planned: { label: 'Planifiée', variant: 'info', icon: PackageIcon },
		InTransit: { label: 'En transit', variant: 'warning', icon: TruckIcon },
		Delivered: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircleIcon },
		'En attente': { label: 'En attente', variant: 'outline', icon: ClockIcon },
		Planifiée: { label: 'Planifiée', variant: 'info', icon: PackageIcon },
		'En transit': { label: 'En transit', variant: 'warning', icon: TruckIcon },
		'En cours': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Livree: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Livrée: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Annulée: { label: 'Annulée', variant: 'destructive', icon: XCircleIcon },
		'0': { label: 'En attente', variant: 'outline', icon: ClockIcon },
		'1': { label: 'Planifiée', variant: 'info', icon: PackageIcon },
		'2': { label: 'En transit', variant: 'warning', icon: TruckIcon },
		'3': { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		'4': { label: 'Annulée', variant: 'destructive', icon: XCircleIcon }
	};

	const DELIVERY_STATUS: Record<DeliveryStatusKey, StatusConfig> = {
		Pending: { label: 'Planifiée', variant: 'info', icon: ClockIcon },
		InProgress: { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Completed: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Failed: { label: 'Échouée', variant: 'destructive', icon: XCircleIcon },
		Prevue: { label: 'Planifiée', variant: 'info', icon: ClockIcon },
		Prévue: { label: 'Planifiée', variant: 'info', icon: ClockIcon },
		'En cours': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Livree: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Livrée: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Retard: { label: 'Retard', variant: 'destructive', icon: XCircleIcon },
		Échouée: { label: 'Échouée', variant: 'destructive', icon: XCircleIcon },
		Échec: { label: 'Échec', variant: 'destructive', icon: XCircleIcon },
		'0': { label: 'Planifiée', variant: 'info', icon: ClockIcon },
		'1': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		'2': { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		'3': { label: 'Échouée', variant: 'destructive', icon: XCircleIcon }
	};

	let {
		type,
		status,
		date = null
	}: { type: 'order' | 'delivery'; status: string; date?: string | null } = $props();

	function isOverdueByCurrentFourHourSlot(value: string | null | undefined): boolean {
		if (!value) return false;
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return false;
		const getSlotStartMs = (d: Date) => {
			const slotHour = Math.floor(d.getHours() / 4) * 4;
			return new Date(d.getFullYear(), d.getMonth(), d.getDate(), slotHour, 0, 0, 0).getTime();
		};
		return getSlotStartMs(parsed) < getSlotStartMs(new Date());
	}

	function isPlannedLikeStatus(value: string): boolean {
		const lower = (value ?? '').toLowerCase();
		return (
			lower === 'pending' ||
			lower === 'planned' ||
			lower === 'en attente' ||
			lower === 'planifiée' ||
			lower === 'prevue' ||
			lower === 'prévue' ||
			lower === '0' ||
			lower === '1'
		);
	}

	const config = $derived(
		type === 'order'
			? ORDER_STATUS[status as OrderStatusKey] ?? { label: status, variant: 'outline' as BadgeVariant, icon: PackageIcon }
			: DELIVERY_STATUS[status as DeliveryStatusKey] ?? { label: status, variant: 'outline' as BadgeVariant, icon: PackageIcon }
	);
	const Icon = $derived(config.icon);
	const showOverdueHatch = $derived(isPlannedLikeStatus(status) && isOverdueByCurrentFourHourSlot(date));
</script>

<Badge variant={config.variant} class="gap-1.5 font-medium {showOverdueHatch ? 'overdue-hatch' : ''}">
	<Icon class="size-3.5 shrink-0" />
	{config.label}
</Badge>

<style>
	/* Croisillon rouge pour les statuts planifiés/en attente dépassés (tranche 4h). */
	:global(.overdue-hatch) {
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
