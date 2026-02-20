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
		SidebarMenuItem
	} from '$lib/components/ui/sidebar';
	import { Switch } from '$lib/components/ui/switch';
	import { themeState, setTheme } from '$lib/stores/theme.svelte';
	import { userStateReactive, userState } from '$lib/stores/user.svelte';
	import { offlineState } from '$lib/stores/offline.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
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
	let isDemo = $derived(offlineState.isOffline);
</script>

<Sidebar collapsible="icon">
	<SidebarHeader class="border-b border-sidebar-border">
		<a href="/dashboard" class="flex items-center gap-2 px-2 py-2 text-sidebar-foreground hover:text-sidebar-foreground">
			<span class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
				A
			</span>
			<span class="font-semibold truncate group-data-[collapsible=icon]:hidden">Arrivo Business</span>
		</a>
		{#if userStateReactive.user}
			<div class="px-2 py-2 border-t border-sidebar-border mt-2 group-data-[collapsible=icon]:hidden">
				<p class="text-sm font-medium truncate">{userStateReactive.user.name}</p>
				<p class="text-xs text-muted-foreground truncate">{userStateReactive.user.email}</p>
			</div>
		{/if}
	</SidebarHeader>
	<SidebarContent>
		<!-- Dashboard et Carte (hors catégorie Listes) -->
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Dashboard" isActive={pathname === '/dashboard'}>
							{#snippet child({ props })}
								<a href="/dashboard" {...props}>
									<LayoutDashboardIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Dashboard</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Carte" isActive={pathname === '/map'}>
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

		<!-- Listes : Commandes, Livraisons, Livreurs -->
		<SidebarGroup>
			<SidebarGroupLabel class="text-xs font-medium text-muted-foreground">Listes</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Commandes"
							isActive={pathname === '/orders' || (pathname.startsWith('/orders/') && pathname !== '/orders/new')}
						>
							{#snippet child({ props })}
								<a href="/orders" {...props}>
									<ClipboardListIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Commandes</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Livraisons & tournées"
							isActive={pathname === '/deliveries' || (pathname.startsWith('/deliveries/') && pathname !== '/deliveries/new')}
						>
							{#snippet child({ props })}
								<a href="/deliveries" {...props}>
									<PackageIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Livraisons</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Livreurs"
							isActive={pathname === '/drivers' || (pathname.startsWith('/drivers/') && pathname !== '/drivers/new')}
						>
							{#snippet child({ props })}
								<a href="/drivers" {...props}>
									<UserIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Livreurs</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<!-- Création : Créer commande, Créer tournée, Créer livreur -->
		<SidebarGroup>
			<SidebarGroupLabel class="text-xs font-medium text-muted-foreground">Création</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Créer commande" isActive={pathname === '/orders/new'}>
							{#snippet child({ props })}
								<a href="/orders/new" {...props}>
									<ClipboardEditIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer commande</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Créer tournée" isActive={pathname === '/deliveries/new'}>
							{#snippet child({ props })}
								<a href="/deliveries/new" {...props}>
									<RouteIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer tournée</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Créer livreur" isActive={pathname === '/drivers/new'}>
							{#snippet child({ props })}
								<a href="/drivers/new" {...props}>
									<UserPlusIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer livreur</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
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
