<script lang="ts">
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import DemoBanner from '$lib/components/DemoBanner.svelte';
	import { SidebarInset, SidebarProvider, SidebarTrigger } from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { initTheme } from '$lib/stores/theme.svelte';
	import { dateRangeState, dateRangeActions } from '$lib/stores/dateRange.svelte';
	import { userState } from '$lib/stores/user.svelte';
	import '../app.css';

	const publicPaths = ['/login', '/register', '/auth/callback', '/logout'];

	function isPublicRoute(path: string) {
		return publicPaths.some((p) => path === p || path.startsWith(p + '/'));
	}

	let { data, children } = $props();

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
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trackly Business</title>
	<meta
		name="description"
		content="Trackly Business: tableau de bord simple pour gerer les tournees et livraisons."
	/>
</svelte:head>

<DemoBanner />

{#if withSidebar}
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset>
			<header class="relative z-50 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
				<SidebarTrigger class="-ms-2" />
				<Separator orientation="vertical" class="h-5" />
			</header>
			<div class="min-w-0 flex-1 min-h-0 {isMapPage ? 'p-0' : 'p-6'}">
				{@render children()}
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
