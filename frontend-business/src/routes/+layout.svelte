<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import DemoBanner from '$lib/components/DemoBanner.svelte';
	import DateFilterSidebar from '$lib/components/DateFilterSidebar.svelte';
	import { Sheet, SheetContent, SheetTrigger } from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { SidebarInset, SidebarProvider, SidebarTrigger } from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { dateRangeState, dateRangeActions, getDateRangeDayKeys, getDateRangeFourHourSlotKeys, getCurrentFourHourSlotIndex, getTodayKey, isSingleDay } from '$lib/stores/dateRange.svelte';
	import { periodSidebarState, periodSidebarActions } from '$lib/stores/periodSidebar.svelte';
	import { settingsActions } from '$lib/stores/settings.svelte';
	import { userState } from '$lib/stores/user.svelte';
	import { ordersState, ordersActions } from '$lib/stores/orders.svelte';
	import { deliveriesState, deliveriesActions } from '$lib/stores/deliveries.svelte';
	import OrdersChartContent from '$lib/components/OrdersChartContent.svelte';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import '../app.css';

	const MONTH_LABELS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

	const publicPaths = ['/login', '/register', '/auth/callback', '/logout'];

	const PERIOD_SIDEBAR_PATHS = ['/map', '/dashboard', '/orders', '/deliveries'];

	function isPublicRoute(path: string) {
		return publicPaths.some((p) => path === p || path.startsWith(p + '/'));
	}

	function showPeriodSidebar(path: string): boolean {
		return PERIOD_SIDEBAR_PATHS.some((p) => path === p || path.startsWith(p + '/'));
	}

	let { data, children } = $props();

	const isMobile = new IsMobile();
	/** Ouvert = sidebar visible (desktop) ou Sheet ouvert (mobile). Contrôlé par le bouton en haut à droite. */
	const periodSidebarOpen = $derived(periodSidebarState.open);

	let pathname = $derived(page.url.pathname);
	let isPublic = $derived(isPublicRoute(pathname));
	// SSR : utiliser le cookie (data.authenticated) pour ne jamais envoyer le contenu protégé. Client : storage + store.
	let canShowProtectedContent = $derived.by(() => {
		if (isPublicRoute(pathname)) return true;
		if (!browser) {
			return (data as { authenticated?: boolean }).authenticated === true;
		}
		const token =
			(typeof localStorage !== 'undefined' && localStorage.getItem('trackly_auth_token')) ||
			(typeof sessionStorage !== 'undefined' && sessionStorage.getItem('trackly_auth_token'));
		return !!token && userState.isAuthenticated;
	});
	let withSidebar = $derived(pathname !== '/login' && canShowProtectedContent);
	let isMapPage = $derived(pathname === '/map');
	let showPeriod = $derived(withSidebar && showPeriodSidebar(pathname));

	// Données pour le graphique dans le header
	const periodKeys = $derived(showPeriod ? getDateRangeDayKeys() : []);
	const chartPeriodKeys = $derived(
		isSingleDay() && periodKeys.length === 1
			? getDateRangeFourHourSlotKeys(periodKeys[0]!).keys
			: periodKeys
	);
	const chartLabels = $derived(
		isSingleDay() && periodKeys.length === 1
			? getDateRangeFourHourSlotKeys(periodKeys[0]!).labels
			: periodKeys.map((key) => {
					const [, m, d] = key.split('-');
					return `${Number(d)} ${MONTH_LABELS[Number(m) - 1]}`;
				})
	);
	const chartCurrentBarIndex = $derived(
		isSingleDay() && periodKeys.length === 1
			? getCurrentFourHourSlotIndex(periodKeys[0]!)
			: periodKeys.length > 0
				? (() => {
						const idx = periodKeys.indexOf(getTodayKey());
						return idx >= 0 ? idx : null;
					})()
				: null
	);
	const ordersInPeriod = $derived.by(() => {
		if (!periodKeys.length) return [];
		const set = new Set(periodKeys);
		return ordersState.items.filter((o) => set.has((o.orderDate ?? '').toString().slice(0, 10)));
	});
	const deliveriesInPeriod = $derived.by(() => {
		if (!periodKeys.length) return [];
		const set = new Set(periodKeys);
		return deliveriesState.routes.filter((d) => set.has((d.createdAt ?? '').toString().slice(0, 10)));
	});

	// Redirection client vers /login si route protégée et pas connecté
	$effect(() => {
		if (!browser || isPublic) return;
		if (!canShowProtectedContent) {
			goto('/login');
		}
	});

	let dateRangeRestored = $state(false);

	$effect(() => {
		if (typeof document !== 'undefined') {
			initTheme();
			if (browser && !dateRangeRestored) {
				dateRangeRestored = true;
				dateRangeActions.restoreFromStorage();
				settingsActions.restoreFromStorage();
			}
		}
	});

	$effect(() => {
		if (typeof document !== 'undefined' && dateRangeRestored) {
			void dateRangeState.dateRange;
			void dateRangeState.timePreset;
			void dateRangeState.useManualTime;
			void dateRangeState.timeRange;
			void dateRangeState.dateFilter;
			dateRangeActions.persistToStorage();
		}
	});

	// Charger les données pour le graphique du header
	$effect(() => {
		if (!showPeriod || !browser) return;
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		ordersActions.loadOrders();
		deliveriesActions.loadDeliveries();
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	<title>Arrivo Business</title>
	<meta
		name="description"
		content="Arrivo Business: tableau de bord simple pour gerer les tournees et livraisons."
	/>
</svelte:head>

<DemoBanner />

{#if withSidebar}
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset>
			<header class="relative z-50 flex shrink-0 items-center gap-2 border-b bg-background px-4" style="min-height: 48px; height: auto;">
				<SidebarTrigger class="-ms-2" />
				<Separator orientation="vertical" class="h-5" />
				{#if showPeriod && periodKeys.length > 0}
					<div class="flex-1 min-w-0 flex flex-col px-2 overflow-hidden py-1">
						<div class="w-full flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
							<OrdersChartContent
								variant="order"
								horizontal={false}
								compact={true}
								loading={ordersState.loading && !ordersInPeriod.length}
								labels={chartLabels}
								values={[]}
								orders={ordersInPeriod}
								periodKeys={chartPeriodKeys}
								currentBarIndex={chartCurrentBarIndex}
								byHour={false}
								byMonth={false}
								wideBarThreshold={20}
								wideBarMinWidthPx={40}
								emptyMessage=""
							/>
						</div>
					</div>
				{/if}
				{#if showPeriod}
					<Button
						variant="ghost"
						size="icon"
						class="ml-auto size-7"
						aria-label={periodSidebarOpen ? 'Fermer le panneau Période' : 'Ouvrir le panneau Période'}
						title="Période"
						onclick={() => periodSidebarActions.toggle()}
					>
						<CalendarIcon class="size-4" />
					</Button>
				{/if}
			</header>
			<div class="flex min-h-0 min-w-0 flex-1 flex-col">
				<div class="flex min-h-0 min-w-0 flex-1">
					<div class="min-h-0 min-w-0 flex-1 overflow-auto {isMapPage ? 'p-0' : 'pt-3 pb-6 px-6'}">
						{@render children()}
					</div>
					{#if showPeriod}
						{#if isMobile.current}
							<Sheet bind:open={periodSidebarState.open}>
								<SheetContent side="right" class="flex w-full max-w-[340px] flex-col p-0">
									<div class="flex-1 overflow-auto">
										<DateFilterSidebar
											collapsed={false}
											showCloseButton={true}
											onToggle={() => periodSidebarActions.close()}
										/>
									</div>
								</SheetContent>
							</Sheet>
						{:else if periodSidebarOpen}
							<div class="hidden border-l bg-background lg:flex lg:min-h-0 lg:w-[320px] lg:shrink-0 lg:flex-col">
								<DateFilterSidebar
									collapsed={false}
									showCloseButton={true}
									onToggle={() => periodSidebarActions.close()}
								/>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</SidebarInset>
	</SidebarProvider>
{:else if canShowProtectedContent}
	{@render children()}
{:else}
	<!-- Route protégée sans auth : on n'affiche pas le contenu, redirection en cours -->
	<div class="flex min-h-screen items-center justify-center bg-background">
		<p class="text-muted-foreground text-sm">Redirection vers la connexion…</p>
	</div>
{/if}
