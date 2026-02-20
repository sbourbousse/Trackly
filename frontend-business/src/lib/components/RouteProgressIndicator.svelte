<script lang="ts">
	import PackageIcon from '@lucide/svelte/icons/package';
	import PackageCheckIcon from '@lucide/svelte/icons/package-check';
	import PackageXIcon from '@lucide/svelte/icons/package-x';
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	type DeliveryStatus = 'Pending' | 'InProgress' | 'Completed' | 'Failed';

	type Props = {
		deliveries: Array<{ status: string; sequence?: number | null }>;
		class?: string;
	};

	let { deliveries, class: className }: Props = $props();

	// Trier les livraisons par sequence
	const sortedDeliveries = $derived.by(() => {
		return [...deliveries].sort((a, b) => {
			const seqA = a.sequence ?? 999999;
			const seqB = b.sequence ?? 999999;
			return seqA - seqB;
		});
	});

	// Normaliser le statut
	function normalizeStatus(status: string): DeliveryStatus {
		const lower = (status ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'prevue' || lower === 'prévue' || lower === '0') return 'Pending';
		if (lower === 'inprogress' || lower === 'en cours' || lower === '1') return 'InProgress';
		if (lower === 'completed' || lower === 'livrée' || lower === 'livree' || lower === '2') return 'Completed';
		if (lower === 'failed' || lower === 'échouée' || lower === 'echouee' || lower === '3') return 'Failed';
		return 'Pending';
	}

	// Obtenir la couleur selon le statut
	function getStatusColor(status: DeliveryStatus): string {
		switch (status) {
			case 'Completed':
				return 'text-green-600 dark:text-green-400';
			case 'InProgress':
				return 'text-blue-600 dark:text-blue-400';
			case 'Failed':
				return 'text-red-600 dark:text-red-400';
			case 'Pending':
				return 'text-muted-foreground';
			default:
				return 'text-muted-foreground';
		}
	}

	// Obtenir l'icône selon le statut
	function getStatusIcon(status: DeliveryStatus) {
		switch (status) {
			case 'Completed':
				return PackageCheckIcon;
			case 'Failed':
				return PackageXIcon;
			default:
				return PackageIcon;
		}
	}

	// Obtenir l'opacité selon le statut et la progression
	function getOpacity(status: DeliveryStatus, index: number): string {
		if (status === 'Completed') return 'opacity-100';
		if (status === 'InProgress') return 'opacity-100';
		if (status === 'Failed') return 'opacity-100';
		// Pour les pending, diminuer l'opacité progressivement
		const maxOpacity = 100;
		const minOpacity = 30;
		const opacityStep = (maxOpacity - minOpacity) / Math.max(sortedDeliveries.length - 1, 1);
		const opacity = Math.max(minOpacity, maxOpacity - index * opacityStep);
		return `opacity-${Math.round(opacity / 10) * 10}`;
	}

	// Obtenir le label du statut
	function getStatusLabel(status: DeliveryStatus): string {
		switch (status) {
			case 'Completed':
				return 'Livrée';
			case 'InProgress':
				return 'En cours';
			case 'Failed':
				return 'Échouée';
			case 'Pending':
				return 'Planifiée';
			default:
				return 'Planifiée';
		}
	}

	// Statistiques globales
	const stats = $derived.by(() => {
		const completed = sortedDeliveries.filter(d => normalizeStatus(d.status) === 'Completed').length;
		const inProgress = sortedDeliveries.filter(d => normalizeStatus(d.status) === 'InProgress').length;
		const failed = sortedDeliveries.filter(d => normalizeStatus(d.status) === 'Failed').length;
		const pending = sortedDeliveries.filter(d => normalizeStatus(d.status) === 'Pending').length;
		const total = sortedDeliveries.length;
		return { completed, inProgress, failed, pending, total };
	});
</script>

<div class={cn('flex items-center gap-1', className)}>
	{#if sortedDeliveries.length === 0}
		<span class="text-sm text-muted-foreground">Aucune livraison</span>
	{:else}
		{#each sortedDeliveries as delivery, index}
			{@const status = normalizeStatus(delivery.status)}
			{@const Icon = getStatusIcon(status)}
			{@const color = getStatusColor(status)}
			{@const opacity = getOpacity(status, index)}
			
			<TooltipProvider delayDuration={200}>
				<Tooltip>
					<TooltipTrigger>
						<Icon class={cn('size-4', color, opacity)} />
					</TooltipTrigger>
					<TooltipContent>
						<div class="text-xs">
							Livraison #{index + 1} - {getStatusLabel(status)}
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		{/each}
		
		<!-- Indicateur de progression textuel -->
		<TooltipProvider delayDuration={200}>
			<Tooltip>
				<TooltipTrigger>
					<span class="ml-1 text-xs font-medium text-muted-foreground">
						{stats.completed}/{stats.total}
					</span>
				</TooltipTrigger>
				<TooltipContent>
					<div class="space-y-1 text-xs">
						<div class="font-medium">État de la tournée :</div>
						<div class="text-green-600 dark:text-green-400">✓ {stats.completed} livrée{stats.completed > 1 ? 's' : ''}</div>
						{#if stats.inProgress > 0}
							<div class="text-blue-600 dark:text-blue-400">◉ {stats.inProgress} en cours</div>
						{/if}
						{#if stats.failed > 0}
							<div class="text-red-600 dark:text-red-400">✗ {stats.failed} échouée{stats.failed > 1 ? 's' : ''}</div>
						{/if}
						{#if stats.pending > 0}
							<div class="text-muted-foreground">○ {stats.pending} prévue{stats.pending > 1 ? 's' : ''}</div>
						{/if}
					</div>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	{/if}
</div>
