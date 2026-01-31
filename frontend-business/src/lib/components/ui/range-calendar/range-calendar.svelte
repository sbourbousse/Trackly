<script lang="ts">
	import { RangeCalendar as RangeCalendarPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import type { DateRange } from 'bits-ui';

	type RangeCalendarProps = Omit<
		import('bits-ui').RangeCalendarRootProps,
		'value' | 'onValueChange'
	> & {
		value?: DateRange;
		onValueChange?: (value: DateRange | undefined) => void;
	};

	let {
		class: className,
		locale = 'fr-FR',
		value,
		onValueChange,
		...restProps
	}: RangeCalendarProps = $props();
</script>

<RangeCalendarPrimitive.Root
	{value}
	{onValueChange}
	{locale}
	class={cn('rounded-md border bg-background shadow-sm', className)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		{#each months as month}
			<div class="flex w-[276px] max-w-full flex-col gap-4 p-3">
				<div class="flex items-center justify-between gap-2">
					<RangeCalendarPrimitive.PrevButton
						class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						<ChevronLeftIcon class="size-4" />
						<span class="sr-only">Mois précédent</span>
					</RangeCalendarPrimitive.PrevButton>
					<RangeCalendarPrimitive.Heading class="min-w-[120px] shrink-0 text-center text-sm font-medium" />
					<RangeCalendarPrimitive.NextButton
						class="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						<ChevronRightIcon class="size-4" />
						<span class="sr-only">Mois suivant</span>
					</RangeCalendarPrimitive.NextButton>
				</div>
				<RangeCalendarPrimitive.Grid class="w-[252px] table-fixed border-collapse">
					<RangeCalendarPrimitive.GridHead>
						<tr>
							{#each weekdays as day}
								<RangeCalendarPrimitive.HeadCell
									class="text-muted-foreground w-9 min-w-[36px] max-w-[36px] rounded-md p-0 text-center text-xs font-normal"
								>
									{day}
								</RangeCalendarPrimitive.HeadCell>
							{/each}
						</tr>
					</RangeCalendarPrimitive.GridHead>
					<RangeCalendarPrimitive.GridBody>
						{#each month.weeks as weekDates}
							<RangeCalendarPrimitive.GridRow class="mt-2">
								{#each weekDates as date}
									<RangeCalendarPrimitive.Cell
										{date}
										month={month.value}
										class="w-9 min-w-[36px] max-w-[36px] p-0 align-middle"
									>
										{#snippet children({ disabled, unavailable, selected })}
											<RangeCalendarPrimitive.Day
												class={cn(
													'inline-flex size-9 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors',
													'hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
													selected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
													'data-[data-selection-start]:rounded-r-none data-[data-selection-end]:rounded-l-none data-[data-range-middle]:rounded-none data-[data-range-middle]:bg-primary/20',
													disabled && 'text-muted-foreground opacity-50',
													unavailable && 'text-muted-foreground line-through'
												)}
											/>
										{/snippet}
									</RangeCalendarPrimitive.Cell>
								{/each}
							</RangeCalendarPrimitive.GridRow>
						{/each}
					</RangeCalendarPrimitive.GridBody>
				</RangeCalendarPrimitive.Grid>
			</div>
		{/each}
	{/snippet}
</RangeCalendarPrimitive.Root>
