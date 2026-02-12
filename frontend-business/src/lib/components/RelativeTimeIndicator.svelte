<script lang="ts">
	import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	type Props = {
		date: string | null;
		class?: string;
		/** Si true, affiche aussi l'heure dans le temps relatif pour les dates du jour */
		showTime?: boolean;
	};

	let { date, class: className, showTime = false }: Props = $props();

	type UrgencyLevel = 'overdue' | 'urgent' | 'soon' | 'normal' | 'none';

	const dateInfo = $derived.by(() => {
		if (!date) {
			return {
				formattedDate: '—',
				relativeTime: 'Aucune date',
				urgency: 'none' as UrgencyLevel
			};
		}

		const dateObj = new Date(date);
		const now = new Date();
		const diffMs = dateObj.getTime() - now.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

		// Formatage de la date complète pour le tooltip
		const formattedDate = dateObj.toLocaleString('fr-FR', {
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
			// Date dans le passé (en retard)
			urgency = 'overdue';
			const absDiffMinutes = Math.abs(diffMinutes);
			const absDiffHours = Math.abs(diffHours);
			const absDiffDays = Math.abs(diffDays);

			if (absDiffMinutes < 60) {
				relativeTime = `Il y a ${absDiffMinutes}m`;
			} else if (absDiffHours < 24) {
				relativeTime = `Il y a ${absDiffHours}h`;
			} else if (absDiffDays === 1) {
				relativeTime = 'Hier';
			} else if (absDiffDays < 7) {
				relativeTime = `Il y a ${absDiffDays}j`;
			} else {
				const weeks = Math.floor(absDiffDays / 7);
				relativeTime = `Il y a ${weeks}sem`;
			}
		} else if (diffMinutes < 30) {
			// Moins de 30 minutes (urgent)
			urgency = 'urgent';
			if (diffMinutes < 1) {
				relativeTime = 'Maintenant';
			} else {
				relativeTime = `Dans ${diffMinutes}m`;
			}
		} else if (diffMinutes < 120) {
			// Entre 30 minutes et 2 heures (bientôt)
			urgency = 'soon';
			relativeTime = `Dans ${diffHours === 0 ? 1 : diffHours}h`;
		} else if (diffHours < 24) {
			// Moins de 24 heures (aujourd'hui)
			relativeTime = `Dans ${diffHours}h`;
		} else if (diffDays === 1) {
			relativeTime = 'Demain';
		} else if (diffDays < 7) {
			relativeTime = `Dans ${diffDays}j`;
		} else {
			const weeks = Math.floor(diffDays / 7);
			relativeTime = `Dans ${weeks}sem`;
		}

		// Ajouter l'heure si demandé et que c'est aujourd'hui ou proche
		if (showTime && Math.abs(diffHours) < 24) {
			const timeStr = dateObj.toLocaleTimeString('fr-FR', {
				hour: '2-digit',
				minute: '2-digit'
			});
			relativeTime += ` (${timeStr})`;
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

{#if date}
	<TooltipProvider delayDuration={200}>
		<Tooltip>
			<TooltipTrigger class={cn('tabular-nums whitespace-nowrap cursor-help', colorClasses, className)}>
				{dateInfo.relativeTime}
			</TooltipTrigger>
			<TooltipContent>
				<div class="text-sm">
					<div class="font-medium">{dateInfo.formattedDate}</div>
				</div>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
{:else}
	<span class={cn('tabular-nums text-muted-foreground whitespace-nowrap', className)}>
		{dateInfo.relativeTime}
	</span>
{/if}
