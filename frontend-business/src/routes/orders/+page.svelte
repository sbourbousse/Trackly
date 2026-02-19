<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import XIcon from '@lucide/svelte/icons/x';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { dateRangeState } from '$lib/stores/dateRange.svelte';
	import { deleteOrdersBatch } from '$lib/api/orders';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import RelativeTimeIndicator from '$lib/components/RelativeTimeIndicator.svelte';
	import PeriodBadge from '$lib/components/PeriodBadge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { cn } from '$lib/utils';

	let didInit = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	let showCascadeWarning = $state(false);
	let forceDeleteDeliveries = $state(false);
	let statusFilter = $state<string | null>(null);

	function statusToKey(s: string): string {
		const lower = (s ?? '').toLowerCase();
		if (lower === 'pending' || lower === 'en attente' || lower === '0') return 'pending';
		if (lower === 'planned' || lower === 'planifiée' || lower === '1') return 'planned';
		if (lower === 'intransit' || lower === 'en transit' || lower === 'en cours' || lower === '2') return 'intransit';
		if (lower === 'delivered' || lower === 'livrée' || lower === 'livree' || lower === '3') return 'delivered';
		if (lower === 'cancelled' || lower === 'annulée' || lower === '4') return 'cancelled';
		return 'pending';
	}

	/** Retourne la tranche horaire d'une commande (ex: "8h-12h") */
	function getTimeSlot(orderDate: string | null | undefined): string {
		if (!orderDate) return '—';
		try {
			const date = new Date(orderDate);
			if (Number.isNaN(date.getTime())) return '—';
			const hour = date.getHours();
			// Tranches de 4h : 0-4h, 4-8h, 8-12h, 12-16h, 16-20h, 20-24h
			const slotStart = Math.floor(hour / 4) * 4;
			const slotEnd = slotStart + 4;
			return `${slotStart}h-${slotEnd}h`;
		} catch {
			return '—';
		}
	}

	/** Retourne une date relative : "Aujourd'hui", "Demain", "Hier" ou la date formatée */
	function getRelativeDate(orderDate: string | null | undefined): string {
		if (!orderDate) return '—';
		try {
			const date = new Date(orderDate);
			if (Number.isNaN(date.getTime())) return '—';
			
			const now = new Date();
			const orderDateStr = orderDate.slice(0, 10); // yyyy-MM-dd
			const todayStr = now.toISOString().slice(0, 10);
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toISOString().slice(0, 10);
			const tomorrow = new Date(now);
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowStr = tomorrow.toISOString().slice(0, 10);
			
			if (orderDateStr === todayStr) {
				return 'Aujourd\'hui';
			} else if (orderDateStr === tomorrowStr) {
				return 'Demain';
			} else if (orderDateStr === yesterdayStr) {
				return 'Hier';
			} else {
				// Formatage de la date pour les autres jours
				return date.toLocaleDateString('fr-FR', {
					weekday: 'short',
					day: 'numeric',
					month: 'short'
				});
			}
		} catch {
			return '—';
		}
	}

	/** Retourne la classe de couleur pour une tranche horaire selon son statut temporel */
	function getTimeSlotColorClass(orderDate: string | null | undefined, timeSlot: string): string {
		if (!orderDate || timeSlot === '—') return 'text-muted-foreground';
		
		try {
			const orderDateTime = new Date(orderDate);
			if (Number.isNaN(orderDateTime.getTime())) return 'text-muted-foreground';
			
			const now = new Date();
			const orderDateStr = orderDate.slice(0, 10); // yyyy-MM-dd
			const todayStr = now.toISOString().slice(0, 10);
			
			// Si la commande est dans le futur (date différente), c'est à venir
			if (orderDateStr > todayStr) {
				return 'text-muted-foreground'; // Gris pour à venir
			}
			
			// Si la commande est dans le passé (date différente), c'est dépassé
			if (orderDateStr < todayStr) {
				return 'text-red-600 dark:text-red-400'; // Rouge pour dépassé
			}
			
			// Même jour : vérifier si la tranche est en cours, passée ou à venir
			const hour = now.getHours();
			const currentSlotStart = Math.floor(hour / 4) * 4;
			const currentSlotEnd = currentSlotStart + 4;
			const currentSlot = `${currentSlotStart}h-${currentSlotEnd}h`;
			
			// Extraire l'heure de début de la tranche de la commande
			const orderHour = orderDateTime.getHours();
			const orderSlotStart = Math.floor(orderHour / 4) * 4;
			const orderSlotEnd = orderSlotStart + 4;
			const orderSlot = `${orderSlotStart}h-${orderSlotEnd}h`;
			
			// Si c'est la tranche en cours
			if (orderSlot === currentSlot) {
				return 'text-amber-600 dark:text-amber-400'; // Jaune pour en cours
			}
			
			// Si la tranche de la commande est passée
			if (orderSlotStart < currentSlotStart) {
				return 'text-red-600 dark:text-red-400'; // Rouge pour dépassé
			}
			
			// Sinon c'est à venir
			return 'text-muted-foreground'; // Gris pour à venir
		} catch {
			return 'text-muted-foreground';
		}
	}

	const filteredOrders = $derived.by(() => {
		let orders = statusFilter
			? ordersState.items.filter((order) => statusToKey(order.status) === statusFilter)
			: ordersState.items;
		
		// Trier par date/heure : plus ancienne en haut
		return [...orders].sort((a, b) => {
			const dateA = a.orderDate ? new Date(a.orderDate).getTime() : 0;
			const dateB = b.orderDate ? new Date(b.orderDate).getTime() : 0;
			return dateA - dateB; // Tri croissant (plus ancienne en premier)
		});
	});

	const STATUS_LABELS: Record<string, string> = {
		pending: 'En attente',
		planned: 'Planifiée',
		intransit: 'En transit',
		delivered: 'Livrée',
		cancelled: 'Annulée'
	};

	function handleStatusClick(statusKey: string | null) {
		statusFilter = statusKey;
	}

	function clearStatusFilter() {
		statusFilter = null;
	}

	$effect(() => {
		const _ = dateRangeState.dateRange;
		const __ = dateRangeState.dateFilter;
		const ___ = dateRangeState.timeRange;
		ordersActions.loadOrders();
	});

	$effect(() => {
		if (didInit) return;
		didInit = true;
		ordersActions.loadOrders();
	});

	function toggleSelection(id: string) {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === filteredOrders.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(filteredOrders.map((o) => o.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
		showCascadeWarning = false;
		forceDeleteDeliveries = false;
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;
		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} commande${count > 1 ? 's' : ''} ?`)) return;
		deleting = true;
		deleteError = null;
		try {
			const result = await deleteOrdersBatch({
				ids: Array.from(selectedIds),
				forceDeleteDeliveries
			});
			if (result.skipped > 0 && !forceDeleteDeliveries) {
				showCascadeWarning = true;
				deleteError = `${result.skipped} commande(s) ont des livraisons actives. Cochez pour forcer la suppression.`;
				deleting = false;
				return;
			}
			clearSelection();
			await ordersActions.loadOrders();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6 relative">
	<PeriodBadge />

	<Card>
			<CardHeader class="space-y-1">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle class="flex items-center gap-2">
							<ClipboardListIcon class="size-4 text-muted-foreground" />
							Commandes récentes
						</CardTitle>
						<p class="text-sm text-muted-foreground">Dernière synchro: {ordersState.lastSyncAt}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={ordersActions.loadOrders}
							disabled={ordersState.loading}
						>
							{ordersState.loading ? 'Chargement...' : 'Actualiser'}
						</Button>
						<Button size="sm" href="/orders/new">Nouvelle commande</Button>
					</div>
				</div>
				{#if statusFilter}
					<div class="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
						<span class="text-muted-foreground">Filtre actif:</span>
						<span class="font-medium">{STATUS_LABELS[statusFilter]}</span>
						<Button
							variant="ghost"
							size="sm"
							class="ml-auto h-6 px-2"
							onclick={clearStatusFilter}
						>
							<XIcon class="size-3.5" />
							Effacer
						</Button>
					</div>
				{/if}
			</CardHeader>
			<CardContent class="space-y-4">
				{#if ordersState.error}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{ordersState.error}</AlertDescription>
					</Alert>
				{/if}
				{#if deleteError}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{deleteError}</AlertDescription>
						{#if showCascadeWarning}
							<div class="mt-2 flex items-center gap-2">
								<Checkbox id="force-cascade" bind:checked={forceDeleteDeliveries} />
								<Label for="force-cascade" class="cursor-pointer text-sm">
									Supprimer aussi les livraisons associées (cascade)
								</Label>
							</div>
						{/if}
					</Alert>
				{/if}

				{#if selectedIds.size > 0}
					<div class="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2">
						<span class="text-sm text-muted-foreground">
							{selectedIds.size} commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
						</span>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger
								class="inline-flex size-8 items-center justify-center rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
								aria-label="Actions sur la sélection"
							>
								<MoreVerticalIcon class="size-4" />
							</DropdownMenu.Trigger>
							<DropdownMenu.Portal>
								<DropdownMenu.Content
									class="z-50 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
									sideOffset={4}
									align="end"
								>
									<DropdownMenu.Item
										class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
										onSelect={clearSelection}
										disabled={deleting}
									>
										<XIcon class="size-4" />
										Désélectionner
									</DropdownMenu.Item>
									<DropdownMenu.Item
										class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
										onSelect={handleDeleteSelected}
										disabled={deleting}
									>
										<Trash2Icon class="size-4" />
										{deleting ? 'Suppression...' : `Supprimer (${selectedIds.size})`}
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Portal>
						</DropdownMenu.Root>
					</div>
				{/if}

				{#if ordersState.loading && !filteredOrders.length}
					<div class="py-8 text-center text-muted-foreground">Chargement des commandes...</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-10">
									<Checkbox
										checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
										onCheckedChange={toggleSelectAll}
										aria-label="Tout sélectionner"
									/>
								</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead>Date</TableHead>
								<TableHead>Tranche</TableHead>								
								<TableHead>Ref</TableHead>
								<TableHead>Client</TableHead>
								<TableHead>Tél.</TableHead>
								<TableHead>Adresse</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each filteredOrders as order}
								<TableRow
									class={cn(
										'cursor-pointer transition-colors hover:bg-muted/50',
										selectedIds.has(order.id) && 'bg-primary/5'
									)}
									onclick={() => toggleSelection(order.id)}
								>
									<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(order.id)}
											onCheckedChange={() => toggleSelection(order.id)}
										/>
									</TableCell>
									<TableCell>
										<StatusBadge type="order" status={order.status} />
									</TableCell>
									<TableCell>
										{getRelativeDate(order.orderDate)}
									</TableCell>
									<TableCell class="whitespace-nowrap">
										{@const timeSlot = getTimeSlot(order.orderDate)}
										<span class={getTimeSlotColorClass(order.orderDate, timeSlot)}>
											{timeSlot}
										</span>
									</TableCell>
									<TableCell class="tabular-nums font-medium" onclick={(e) => e.stopPropagation()}>
										<Button variant="link" href="/orders/{order.id}" class="h-auto p-0 font-normal">
											{order.ref}
										</Button>
									</TableCell>
									<TableCell>{order.client}</TableCell>
									<TableCell class="text-muted-foreground whitespace-nowrap">{order.phoneNumber ?? '—'}</TableCell>
									<TableCell>{order.address}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
