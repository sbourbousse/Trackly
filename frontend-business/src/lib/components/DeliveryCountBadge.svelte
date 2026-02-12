<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';

	type Props = {
		count: number;
		class?: string;
	};

	let { count, class: className }: Props = $props();

	const colorClasses = $derived.by(() => {
		if (count === 0) {
			return 'border-orange-500/50 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400';
		}
		return 'border-border bg-background text-foreground';
	});
</script>

<Badge variant="outline" class={cn('tabular-nums', colorClasses, className)}>
	{count} livraison{count > 1 ? 's' : ''}
</Badge>
