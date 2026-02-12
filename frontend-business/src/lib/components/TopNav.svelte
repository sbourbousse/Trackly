<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { themeState, setTheme } from '$lib/stores/theme.svelte';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import PackageIcon from '@lucide/svelte/icons/package';
	import { cn } from '$lib/utils';
	import type { ComponentType } from 'svelte';
	import type { IconProps } from 'lucide-svelte';

	const links: Array<{ href: string; label: string; icon: ComponentType<IconProps> }> = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/orders', label: 'Commandes', icon: ClipboardListIcon },
		{ href: '/deliveries', label: 'Livraisons', icon: PackageIcon }
	];

	let { title, subtitle } = $props<{
		title: string;
		subtitle?: string;
	}>();

	let pathname = $derived(page.url.pathname);
	let isDark = $derived(themeState.value === 'dark');
</script>

<Card class="rounded-lg border bg-card shadow-sm">
	<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-0">
		<div class="space-y-1.5">
			<h1 class="text-xl font-semibold tracking-tight">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-muted-foreground">{subtitle}</p>
			{/if}
		</div>
		<div class="flex items-center gap-3">
			{#if themeState.initialized}
				<div class="flex items-center gap-2">
					<SunIcon class="size-4 text-muted-foreground {isDark ? 'opacity-50' : ''}" aria-hidden="true" />
					<Switch
						checked={isDark}
						onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
						aria-label="Thème sombre"
					/>
					<MoonIcon class="size-4 text-muted-foreground {!isDark ? 'opacity-50' : ''}" aria-hidden="true" />
				</div>
			{/if}
			<nav class="flex items-center gap-2">
				{#each links as link}
					<Button
						variant={pathname === link.href ? 'secondary' : 'ghost'}
						size="sm"
						href={link.href}
						class={cn('flex items-center gap-1.5', pathname === link.href && 'bg-primary/10 text-primary hover:bg-primary/20')}
					>
						<svelte:component this={link.icon} class="size-4" />
						{link.label}
					</Button>
				{/each}
			</nav>
		</div>
	</CardHeader>
</Card>
