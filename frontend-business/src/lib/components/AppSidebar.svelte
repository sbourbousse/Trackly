<script lang="ts">
	import { page } from '$app/state';
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarMenuSub,
		SidebarMenuSubButton,
		SidebarMenuSubItem
	} from '$lib/components/ui/sidebar';
	import { Switch } from '$lib/components/ui/switch';
	import { themeState, setTheme } from '$lib/stores/theme.svelte';
	import { userState } from '$lib/stores/user.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import ClipboardEditIcon from '@lucide/svelte/icons/clipboard-edit';
	import PackageIcon from '@lucide/svelte/icons/package';
	import UserIcon from '@lucide/svelte/icons/user';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import RouteIcon from '@lucide/svelte/icons/route';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import LogOutIcon from '@lucide/svelte/icons/log-out';

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
		{#if userState.user}
			<div class="px-2 py-2 border-t border-sidebar-border mt-2 group-data-[collapsible=icon]:hidden">
				<p class="text-sm font-medium truncate">{userState.user.name}</p>
				<p class="text-xs text-muted-foreground truncate">{userState.user.email}</p>
			</div>
		{/if}
	</SidebarHeader>
	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Dashboard"
							isActive={pathname === '/dashboard'}
						>
							{#snippet child({ props })}
								<a href="/dashboard" {...props}>
									<LayoutDashboardIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Dashboard</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Carte"
							isActive={pathname === '/map'}
						>
							{#snippet child({ props })}
								<a href="/map" {...props}>
									<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Carte</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Commandes"
							isActive={pathname === '/orders' || pathname.startsWith('/orders/')}
						>
							{#snippet child({ props })}
								<a href="/orders" {...props}>
									<ClipboardListIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Commandes</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/orders/new" isActive={pathname === '/orders/new'}>
									<ClipboardEditIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer commande</span>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						</SidebarMenuSub>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Livraisons & tournées"
							isActive={pathname === '/deliveries' || pathname.startsWith('/deliveries/')}
						>
							{#snippet child({ props })}
								<a href="/deliveries" {...props}>
									<PackageIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Livraisons</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/deliveries/new" isActive={pathname === '/deliveries/new'}>
									<MapPinIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer tournée</span>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						</SidebarMenuSub>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Livreurs"
							isActive={pathname === '/drivers' || pathname.startsWith('/drivers/')}
						>
							{#snippet child({ props })}
								<a href="/drivers" {...props}>
									<UserIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Livreurs</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/drivers/new" isActive={pathname === '/drivers/new'}>
									<UserPlusIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer livreur</span>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						</SidebarMenuSub>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
	<SidebarFooter class="border-t border-sidebar-border">
		<SidebarMenu>
			<SidebarMenuItem>
				<SidebarMenuButton
					tooltipContent="Paramètres"
					isActive={pathname === '/settings'}
				>
					{#snippet child({ props })}
						<a href="/settings" {...props}>
							<SettingsIcon class="size-4 shrink-0" aria-hidden="true" />
							<span>Paramètres</span>
						</a>
					{/snippet}
				</SidebarMenuButton>
			</SidebarMenuItem>
			<SidebarMenuItem>
				<SidebarMenuButton
					tooltipContent="Déconnexion"
					onclick={() => userState.logout()}
				>
					<LogOutIcon class="size-4 shrink-0" aria-hidden="true" />
					<span>Déconnexion</span>
				</SidebarMenuButton>
			</SidebarMenuItem>
		</SidebarMenu>
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
