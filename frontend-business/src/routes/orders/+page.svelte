<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { deleteOrdersBatch } from '$lib/api/orders';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
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

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		'En attente': 'destructive',
		'En cours': 'secondary',
		Livree: 'default'
	};

	let didInit = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);
	let showCascadeWarning = $state(false);
	let forceDeleteDeliveries = $state(false);

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
		if (selectedIds.size === ordersState.items.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(ordersState.items.map((o) => o.id));
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

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Commandes" subtitle="Centralise les commandes avant création des tournées." />

		<Card>
			<CardHeader class="space-y-1">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Commandes récentes</CardTitle>
						<p class="text-sm text-muted-foreground">Dernière synchro: {ordersState.lastSyncAt}</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Input type="search" placeholder="Rechercher une commande" class="h-9 w-48" />
						<Button variant="outline" size="sm" href="/orders/import">Importer CSV</Button>
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
					<div
						class="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-primary px-4 py-3 text-primary-foreground"
					>
						<span class="font-medium">
							{selectedIds.size} commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
						</span>
						<div class="flex gap-2">
							<Button
								variant="secondary"
								size="sm"
								onclick={clearSelection}
								disabled={deleting}
								class="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
							>
								Annuler
							</Button>
							<Button variant="destructive" size="sm" onclick={handleDeleteSelected} disabled={deleting}>
								{deleting ? 'Suppression...' : `Supprimer ${selectedIds.size}`}
							</Button>
						</div>
					</div>
				{/if}

				{#if ordersState.loading && !ordersState.items.length}
					<div class="py-8 text-center text-muted-foreground">Chargement des commandes...</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-10">
									<Checkbox
										checked={selectedIds.size === ordersState.items.length && ordersState.items.length > 0}
										onCheckedChange={toggleSelectAll}
										aria-label="Tout sélectionner"
									/>
								</TableHead>
								<TableHead>Ref</TableHead>
								<TableHead>Client</TableHead>
								<TableHead>Adresse</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead class="tabular-nums">Livraisons</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each ordersState.items as order}
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
									<TableCell class="tabular-nums font-medium" onclick={(e) => e.stopPropagation()}>
										<Button variant="link" href="/orders/{order.id}" class="h-auto p-0 font-normal">
											{order.ref}
										</Button>
									</TableCell>
									<TableCell>{order.client}</TableCell>
									<TableCell>{order.address}</TableCell>
									<TableCell>
										<Badge variant={statusVariant[order.status] ?? 'outline'}>{order.status}</Badge>
									</TableCell>
									<TableCell class="tabular-nums">{order.deliveries}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
