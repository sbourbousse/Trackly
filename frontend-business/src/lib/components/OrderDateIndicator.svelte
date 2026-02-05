<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	type Props = {
		orderDate: string | null;
		class?: string;
	};

	let { orderDate, class: className }: Props = $props();

	type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'normal' | 'none';

	const dateInfo = $derived.by(() => {
		if (!orderDate) {
			return {
				formattedDate: '—',
				relativeTime: 'Aucune date définie',
				urgency: 'none' as UrgencyLevel
			};
		}

		const date = new Date(orderDate);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		// Formatage de la date
		const formattedDate = date.toLocaleString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		// Calcul du temps relatif
		let relativeTime = '';
		let urgency: UrgencyLevel = 'normal';

		if (diffMs < 0) {
			// Date dépassée
			urgency = 'overdue';
			const absDiffMinutes = Math.abs(diffMinutes);
			const absDiffHours = Math.abs(diffHours);
			const absDiffDays = Math.abs(diffDays);

			if (absDiffMinutes < 60) {
				relativeTime = `En retard de ${absDiffMinutes} minute${absDiffMinutes > 1 ? 's' : ''}`;
			} else if (absDiffHours < 24) {
				relativeTime = `En retard de ${absDiffHours} heure${absDiffHours > 1 ? 's' : ''}`;
			} else if (absDiffDays === 1) {
				relativeTime = 'En retard de 1 jour';
			} else {
				relativeTime = `En retard de ${absDiffDays} jours`;
			}
		} else if (diffMinutes < 30) {
			// Moins de 30 minutes
			urgency = 'urgent';
			if (diffMinutes < 1) {
				relativeTime = 'Dans moins d\'une minute';
			} else {
				relativeTime = `Dans ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
			}
		} else if (diffMinutes < 120) {
			// Entre 30 minutes et 2 heures
			urgency = 'soon';
			relativeTime = `Dans ${diffHours === 0 ? Math.floor(diffMinutes / 60) : diffHours} heure${diffHours > 1 ? 's' : ''}`;
		} else if (diffHours < 24) {
			// Moins de 24 heures
			relativeTime = `Dans ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
		} else if (diffDays === 1) {
			relativeTime = 'Demain';
		} else if (diffDays < 7) {
			relativeTime = `Dans ${diffDays} jours`;
		} else {
			const weeks = Math.floor(diffDays / 7);
			relativeTime = `Dans ${weeks} semaine${weeks > 1 ? 's' : ''}`;
		}

		return {
			formattedDate,
			relativeTime,
			urgency
		};
	});

	const colorClasses = $derived.by(() => {
		switch (dateInfo.urgency) {
			case 'overdue':
				return 'text-red-600 dark:text-red-400 font-medium';
			case 'urgent':
				return 'text-yellow-600 dark:text-yellow-400 font-medium';
			case 'soon':
				return 'text-orange-600 dark:text-orange-400';
			case 'normal':
				return 'text-muted-foreground';
			case 'none':
				return 'text-muted-foreground';
			default:
				return 'text-muted-foreground';
		}
	});
</script>

{#if orderDate}
	<TooltipProvider delayDuration={200}>
		<Tooltip>
			<TooltipTrigger class={cn('tabular-nums whitespace-nowrap cursor-help', colorClasses, className)}>
				{dateInfo.formattedDate}
			</TooltipTrigger>
			<TooltipContent>
				<div class="text-sm">
					<div class="font-medium">{dateInfo.relativeTime}</div>
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
{:else}
	<span class={cn('tabular-nums text-muted-foreground whitespace-nowrap', className)}>
		{dateInfo.formattedDate}
	</span>
{/if}
