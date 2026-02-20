<script lang="ts">
	/**
	 * Layout commun : contenu principal + sidebar Période à droite (desktop)
	 * ou bouton « Période » ouvrant un Sheet (mobile). Même pattern que la page Carte.
	 */
	import DateFilterSidebar from '$lib/components/DateFilterSidebar.svelte';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import type { DateFilterType } from '$lib/stores/dateRange.svelte';

	interface Props {
		/** Callback après changement de filtre date (recharger données). */
		onDateFilterChange?: (type: DateFilterType) => void | Promise<void>;
		/** Contenu principal de la page. */
		children: import('svelte').Snippet;
	}

	let { onDateFilterChange, children }: Props = $props();

	const isMobile = new IsMobile();
	let periodSheetOpen = $state(false);
	let sidebarCollapsed = $state(false);
</script>

<div class="flex min-h-0 flex-1 flex-col">
	<div class="flex min-h-0 flex-1 min-w-0">
		<!-- Contenu principal -->
		<div class="min-h-0 min-w-0 flex-1 overflow-auto">
			{@render children()}
		</div>

		<!-- Mobile : bouton Période (en haut à droite du contenu) -->
		{#if isMobile.current}
			<div class="fixed right-4 top-20 z-[1000] md:right-6">
				<Sheet bind:open={periodSheetOpen}>
					<SheetTrigger>
						<Button
							variant="outline"
							size="sm"
							class="gap-2 shadow-md bg-background border-border"
							aria-label="Ouvrir Période"
						>
							<CalendarIcon class="size-4" />
							Période
						</Button>
					</SheetTrigger>
					<SheetContent side="right" class="flex w-full max-w-[340px] flex-col p-0">
						<div class="flex-1 overflow-auto">
							<DateFilterSidebar
								collapsed={false}
								showCloseButton={false}
							/>
						</div>
					</SheetContent>
				</Sheet>
			</div>
		{/if}

		<!-- Sidebar Période (desktop) -->
		{#if !isMobile.current}
			<div
				class="hidden border-l bg-background transition-[width] duration-200 lg:flex lg:min-h-0 lg:shrink-0 lg:flex-col {sidebarCollapsed ? 'lg:w-14' : 'lg:w-[320px]'}"
			>
				<DateFilterSidebar
					collapsed={sidebarCollapsed}
					showCloseButton={true}
					onToggle={() => (sidebarCollapsed = !sidebarCollapsed)}
				/>
			</div>
		{/if}
	</div>
</div>
