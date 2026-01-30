<script lang="ts">
	import { page } from '$app/state';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem
	} from '$lib/components/ui/sidebar';
	import { Switch } from '$lib/components/ui/switch';
	import { themeState, setTheme } from '$lib/stores/theme.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import PackageIcon from '@lucide/svelte/icons/package';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
		{ href: '/orders', label: 'Commandes', icon: PackageIcon },
		{ href: '/deliveries', label: 'Tournées', icon: TruckIcon },
		{ href: '/drivers', label: 'Livreurs', icon: UsersIcon }
	];

	let pathname = $derived(page.url.pathname);
	let isDark = $derived(themeState.value === 'dark');
</script>

<Sidebar collapsible="icon">
	<SidebarHeader class="border-b border-sidebar-border">
		<a href="/dashboard" class="flex items-center gap-2 px-2 py-2 text-sidebar-foreground hover:text-sidebar-foreground">
			<span class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
				T
			</span>
			<span class="font-semibold truncate group-data-[collapsible=icon]:hidden">Trackly Business</span>
		</a>
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{#each navItems as item}
						<SidebarMenuItem>
							<SidebarMenuButton
								tooltipContent={item.label}
								isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
							>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon class="size-4 shrink-0" aria-hidden="true" />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/each}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
	<SidebarFooter class="border-t border-sidebar-border">
		{#if themeState.initialized}
			<div class="flex items-center justify-center gap-2 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
				<SunIcon class="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden {isDark ? 'opacity-50' : ''}" aria-hidden="true" />
				<Switch
					checked={isDark}
					onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
					aria-label="Thème sombre"
					class="shrink-0 group-data-[collapsible=icon]:scale-75"
				/>
				<MoonIcon class="size-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden {!isDark ? 'opacity-50' : ''}" aria-hidden="true" />
				<span class="truncate text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">
					{isDark ? 'Sombre' : 'Clair'}
				</span>
			</div>
		{/if}
	</SidebarFooter>
</Sidebar>
