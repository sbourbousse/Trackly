<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import AppSidebar from '$lib/components/AppSidebar.svelte';
	import { SidebarInset, SidebarProvider, SidebarTrigger } from '$lib/components/ui/sidebar';
	import { Separator } from '$lib/components/ui/separator';
	import { initTheme } from '$lib/stores/theme.svelte';
	import '../app.css';

	let { children } = $props();

	let pathname = $derived(page.url.pathname);
	let withSidebar = $derived(pathname !== '/login');

	$effect(() => {
		if (typeof document !== 'undefined') initTheme();
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

{#if withSidebar}
	<SidebarProvider>
		<AppSidebar />
		<SidebarInset>
			<header class="flex h-12 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger class="-ms-2" />
				<Separator orientation="vertical" class="h-5" />
			</header>
			<div class="min-w-0 flex-1 p-6">
				{@render children()}
			</div>
		</SidebarInset>
	</SidebarProvider>
{:else}
	{@render children()}
{/if}
