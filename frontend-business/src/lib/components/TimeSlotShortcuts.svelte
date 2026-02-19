<script lang="ts">
	import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date';

	interface Props {
		selectedDate: CalendarDate;
		selectedSlot: number;
		onSlotChange: (slotIndex: number) => void;
		onDateChange?: ((newDate: CalendarDate) => void) | undefined;
		disabled?: boolean;
	}

	let { selectedDate, selectedSlot, onSlotChange, onDateChange, disabled = false }: Props = $props();

	/** Raccourci : sélectionner la tranche actuelle */
	function selectCurrentSlot() {
		if (disabled) return;
		const now = new Date();
		const currentHour = now.getHours();
		const currentSlot = Math.floor(currentHour / 4);
		const todayRef = today(getLocalTimeZone());
		
		// Revenir à aujourd'hui si on n'y est pas déjà
		if (onDateChange) {
			const isToday = selectedDate.year === todayRef.year && 
			                selectedDate.month === todayRef.month && 
			                selectedDate.day === todayRef.day;
			if (!isToday) {
				onDateChange(todayRef);
			}
		}
		
		onSlotChange(currentSlot);
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

	// Le bouton "Maintenant" est toujours disponible (il ramènera à aujourd'hui si nécessaire)
	const canUseNow = true;
</script>

<div class="flex flex-wrap gap-2">
	<button
		type="button"
		disabled={disabled || !canUseNow}
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
