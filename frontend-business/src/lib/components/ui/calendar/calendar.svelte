<script lang="ts">
	import { Calendar as CalendarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import type { DateValue } from "@internationalized/date";

	type CalendarSingleProps = Omit<
		import("bits-ui").CalendarRootProps,
		"type" | "value" | "onValueChange"
	> & {
		value?: DateValue;
		onValueChange?: (value: DateValue | undefined) => void;
	};

	let {
		type: _type,
		class: className,
		locale = "fr-FR",
		value,
		onValueChange,
		...restProps
	}: CalendarSingleProps = $props();
</script>

<CalendarPrimitive.Root
	type="single"
	{value}
	{onValueChange}
	locale={locale}
	class={cn("rounded-md border bg-background shadow-sm", className)}
	{...restProps}
>
	{#snippet children({ months, weekdays })}
		{#each months as month}
			<div class="flex flex-col gap-4 p-3">
				<div class="flex items-center justify-between">
					<CalendarPrimitive.PrevButton
						class="inline-flex size-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						<ChevronLeftIcon class="size-4" />
						<span class="sr-only">Mois précédent</span>
					</CalendarPrimitive.PrevButton>
					<CalendarPrimitive.Heading
						class="text-sm font-medium"
					/>
					<CalendarPrimitive.NextButton
						class="inline-flex size-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
					>
						<ChevronRightIcon class="size-4" />
						<span class="sr-only">Mois suivant</span>
					</CalendarPrimitive.NextButton>
				</div>
				<CalendarPrimitive.Grid class="w-full border-collapse space-y-1">
					<CalendarPrimitive.GridHead>
						{#each weekdays as day}
							<CalendarPrimitive.HeadCell
								class="text-muted-foreground rounded-md w-9 p-0 text-center text-xs font-normal"
							>
								{day}
							</CalendarPrimitive.HeadCell>
						{/each}
					</CalendarPrimitive.GridHead>
					<CalendarPrimitive.GridBody>
						{#each month.weeks as weekDates}
							<CalendarPrimitive.GridRow class="mt-2 flex w-full">
								{#each weekDates as date}
									<CalendarPrimitive.Cell {date} month={month.value}>
										{#snippet children({ disabled, unavailable, selected })}
											<CalendarPrimitive.Day
												class={cn(
													"inline-flex size-9 items-center justify-center rounded-md p-0 text-sm font-normal transition-colors",
													"hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
													selected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
													disabled && "text-muted-foreground opacity-50",
													unavailable && "text-muted-foreground line-through"
												)}
											/>
										{/snippet}
									</CalendarPrimitive.Cell>
								{/each}
							</CalendarPrimitive.GridRow>
						{/each}
					</CalendarPrimitive.GridBody>
				</CalendarPrimitive.Grid>
			</div>
		{/each}
	{/snippet}
</CalendarPrimitive.Root>
