<script lang="ts">
	import { getDateRangeFourHourSlotKeys, getCurrentFourHourSlotIndex, getTodayKey } from '$lib/stores/dateRange.svelte';
	import { ordersState } from '$lib/stores/orders.svelte';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import { cn } from '$lib/utils';

	interface Props {
		selectedDate: CalendarDate;
		selectedSlot: number; // Index de la tranche sélectionnée (0-5)
		onSlotChange: (slotIndex: number) => void;
		onDateChange?: ((newDate: CalendarDate) => void) | undefined;
		disabled?: boolean;
		showShortcuts?: boolean; // Afficher les raccourcis dans le composant (par défaut true)
	}

	let { selectedDate, selectedSlot, onSlotChange, onDateChange, disabled = false, showShortcuts = true }: Props = $props();

	const dayKey = $derived(`${selectedDate.year}-${String(selectedDate.month).padStart(2, '0')}-${String(selectedDate.day).padStart(2, '0')}`);
	const { keys: slotKeys, labels: slotLabels } = $derived(getDateRangeFourHourSlotKeys(dayKey));
	const currentSlotIndex = $derived(getCurrentFourHourSlotIndex(dayKey));

	// Compter les commandes par tranche pour la date sélectionnée
	const ordersBySlot = $derived.by(() => {
		const counts = new Array(6).fill(0);
		const dateStr = dayKey;
		ordersState.items.forEach((order) => {
			if (!order.orderDate) return;
			const orderDateStr = order.orderDate.toString().slice(0, 10);
			if (orderDateStr !== dateStr) return;
			
			try {
				const orderDate = new Date(order.orderDate);
				const hour = orderDate.getHours();
				const slotIndex = Math.floor(hour / 4);
				if (slotIndex >= 0 && slotIndex < 6) {
					counts[slotIndex]++;
				}
			} catch {
				// Ignore invalid dates
			}
		});
		return counts;
	});

	const maxCount = $derived(Math.max(...ordersBySlot, 1));

	/** Déterminer si une tranche est passée (non sélectionnable) */
	function isSlotPast(slotIndex: number): boolean {
		return currentSlotIndex !== null && slotIndex < currentSlotIndex;
	}

	/** Déterminer la couleur d'une tranche selon son statut */
	function getSlotColorClass(slotIndex: number, count: number): string {
		const isCurrent = currentSlotIndex === slotIndex;
		const isSelected = selectedSlot === slotIndex;
		const isPast = isSlotPast(slotIndex);
		
		if (isSelected) {
			return 'bg-primary text-primary-foreground';
		}
		if (isCurrent) {
			return 'bg-amber-500/20 border-amber-500/50 border-2';
		}
		if (isPast) {
			return 'bg-red-500/10 border-red-500/30 border opacity-50 cursor-not-allowed';
		}
		return 'bg-muted hover:bg-muted/80 border border-border';
	}

	function handleSlotClick(slotIndex: number) {
		if (disabled || isSlotPast(slotIndex)) return;
		onSlotChange(slotIndex);
	}

	/** Raccourci : sélectionner la tranche actuelle */
	function selectCurrentSlot() {
		if (disabled || currentSlotIndex === null) return;
		onSlotChange(currentSlotIndex);
	}

	/** Raccourci : sélectionner la tranche dans N heures */
	function selectSlotInHours(hours: number) {
		if (disabled) return;
		const now = new Date();
		const futureDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
		const futureHour = futureDate.getHours();
		const futureSlotIndex = Math.floor(futureHour / 4);
		
		// Calculer la date future
		const todayRef = today(getLocalTimeZone());
		const futureDateObj = new Date(now.getTime() + hours * 60 * 60 * 1000);
		const futureDateCalendar = new CalendarDate(
			futureDateObj.getFullYear(),
			futureDateObj.getMonth() + 1,
			futureDateObj.getDate()
		);
		
		// Vérifier si on doit mettre à jour la date
		if (onDateChange) {
			const isToday = selectedDate.year === todayRef.year && 
			                selectedDate.month === todayRef.month && 
			                selectedDate.day === todayRef.day;
			const isFutureToday = futureDateCalendar.year === todayRef.year && 
			                      futureDateCalendar.month === todayRef.month && 
			                      futureDateCalendar.day === todayRef.day;
			
			// Si on est aujourd'hui et que la date future est différente, passer au lendemain
			if (isToday && !isFutureToday) {
				onDateChange(futureDateCalendar);
			}
			// Si on n'est pas aujourd'hui mais que la date future est aujourd'hui, revenir à aujourd'hui
			else if (!isToday && isFutureToday) {
				onDateChange(todayRef);
			}
			// Si on n'est pas aujourd'hui et que la date future n'est pas aujourd'hui non plus, mettre à jour
			else if (!isToday && !isFutureToday) {
				onDateChange(futureDateCalendar);
			}
		}
		
		onSlotChange(Math.min(5, futureSlotIndex));
	}
</script>

<div class="space-y-3">
	{#if showShortcuts}
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				disabled={disabled || currentSlotIndex === null}
				onclick={selectCurrentSlot}
				class="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
			>
				Maintenant
			</button>
			<button
				type="button"
				disabled={disabled}
				onclick={() => selectSlotInHours(4)}
				class="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
			>
				+4h
			</button>
			<button
				type="button"
				disabled={disabled}
				onclick={() => selectSlotInHours(8)}
				class="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
			>
				+8h
			</button>
			<button
				type="button"
				disabled={disabled}
				onclick={() => selectSlotInHours(12)}
				class="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 rounded border border-border hover:bg-accent transition-colors"
			>
				+12h
			</button>
		</div>
	{/if}

	<div class="space-y-2">
		<div class="text-sm font-medium">Tranche horaire</div>
		<div class="grid grid-cols-6 gap-2">
			{#each slotLabels as label, index}
				{@const count = ordersBySlot[index]}
				{@const heightPercent = maxCount > 0 ? (count / maxCount) * 100 : 0}
				<button
					type="button"
					disabled={disabled || isSlotPast(index)}
					onclick={() => handleSlotClick(index)}
					class={cn(
						'flex flex-col items-center justify-end p-2 rounded-md transition-all min-h-[80px] relative',
						getSlotColorClass(index, count),
						(disabled || isSlotPast(index)) && 'cursor-not-allowed'
					)}
					title="{isSlotPast(index) ? 'Tranche passée (non sélectionnable)' : label + ': ' + count + ' commande(s)'}"
				>
					<div class="text-xs font-medium mb-1">{label}</div>
					<div class="w-full flex-1 flex items-end">
						<div
							class="w-full bg-current/30 rounded-t transition-all"
							style="height: {heightPercent}%"
							aria-hidden="true"
						></div>
					</div>
					{#if count > 0}
						<div class="absolute top-1 right-1 text-xs font-semibold">{count}</div>
					{/if}
				</button>
			{/each}
		</div>
	</div>
</div>
