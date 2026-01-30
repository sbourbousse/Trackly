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
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import PackageIcon from '@lucide/svelte/icons/package';
	import UsersIcon from '@lucide/svelte/icons/users';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import FilePlusIcon from '@lucide/svelte/icons/file-plus';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import PlusCircleIcon from '@lucide/svelte/icons/plus-circle';

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
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							tooltipContent="Commandes"
							isActive={pathname === '/orders'}
						>
							{#snippet child({ props })}
								<a href="/orders" {...props}>
									<PackageIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Commandes</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/orders/new" isActive={pathname === '/orders/new'}>
									<FilePlusIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Créer commande</span>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/orders/import" isActive={pathname === '/orders/import'}>
									<UploadIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Importer commande</span>
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
							tooltipContent="Tournées"
							isActive={pathname === '/deliveries'}
						>
							{#snippet child({ props })}
								<a href="/deliveries" {...props}>
									<TruckIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Tournées</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/deliveries/new" isActive={pathname === '/deliveries/new'}>
									<PlusCircleIcon class="size-4 shrink-0" aria-hidden="true" />
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
							isActive={pathname === '/drivers'}
						>
							{#snippet child({ props })}
								<a href="/drivers" {...props}>
									<UsersIcon class="size-4 shrink-0" aria-hidden="true" />
									<span>Livreurs</span>
								</a>
							{/snippet}
						</SidebarMenuButton>
						<SidebarMenuSub>
							<SidebarMenuSubItem>
								<SidebarMenuSubButton href="/drivers/new" isActive={pathname === '/drivers/new'}>
									<PlusCircleIcon class="size-4 shrink-0" aria-hidden="true" />
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
