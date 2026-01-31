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
		Pending: { label: 'En attente', variant: 'info', icon: ClockIcon },
		Planned: { label: 'Planifiée', variant: 'outline', icon: PackageIcon },
		InTransit: { label: 'En transit', variant: 'warning', icon: TruckIcon },
		Delivered: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Cancelled: { label: 'Annulée', variant: 'destructive', icon: XCircleIcon },
		'En attente': { label: 'En attente', variant: 'info', icon: ClockIcon },
		Planifiée: { label: 'Planifiée', variant: 'outline', icon: PackageIcon },
		'En transit': { label: 'En transit', variant: 'warning', icon: TruckIcon },
		'En cours': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Livree: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Livrée: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Annulée: { label: 'Annulée', variant: 'destructive', icon: XCircleIcon },
		'0': { label: 'En attente', variant: 'info', icon: ClockIcon },
		'1': { label: 'Planifiée', variant: 'outline', icon: PackageIcon },
		'2': { label: 'En transit', variant: 'warning', icon: TruckIcon },
		'3': { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		'4': { label: 'Annulée', variant: 'destructive', icon: XCircleIcon }
	};

	const DELIVERY_STATUS: Record<DeliveryStatusKey, StatusConfig> = {
		Pending: { label: 'Prévue', variant: 'info', icon: ClockIcon },
		InProgress: { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Completed: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Failed: { label: 'Échouée', variant: 'destructive', icon: XCircleIcon },
		Prevue: { label: 'Prévue', variant: 'info', icon: ClockIcon },
		Prévue: { label: 'Prévue', variant: 'info', icon: ClockIcon },
		'En cours': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		Livree: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Livrée: { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		Retard: { label: 'Retard', variant: 'destructive', icon: XCircleIcon },
		Échouée: { label: 'Échouée', variant: 'destructive', icon: XCircleIcon },
		Échec: { label: 'Échec', variant: 'destructive', icon: XCircleIcon },
		'0': { label: 'Prévue', variant: 'info', icon: ClockIcon },
		'1': { label: 'En cours', variant: 'warning', icon: TruckIcon },
		'2': { label: 'Livrée', variant: 'success', icon: CheckCircle2Icon },
		'3': { label: 'Échouée', variant: 'destructive', icon: XCircleIcon }
	};

	let { type, status }: { type: 'order' | 'delivery'; status: string } = $props();

	const config = $derived(
		type === 'order'
			? ORDER_STATUS[status as OrderStatusKey] ?? { label: status, variant: 'outline' as BadgeVariant, icon: PackageIcon }
			: DELIVERY_STATUS[status as DeliveryStatusKey] ?? { label: status, variant: 'outline' as BadgeVariant, icon: PackageIcon }
	);
	const Icon = $derived(config.icon);
</script>

<Badge variant={config.variant} class="gap-1.5 font-medium">
	<Icon class="size-3.5 shrink-0" />
	{config.label}
</Badge>
