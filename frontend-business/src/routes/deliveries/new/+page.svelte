<script lang="ts">
	import { goto } from '$app/navigation';
	import TopNav from '$lib/components/TopNav.svelte';
	import { getOrders } from '$lib/api/orders';
	import { getDrivers } from '$lib/api/drivers';
	import { createDeliveriesBatch } from '$lib/api/deliveries';
	import type { ApiOrder } from '$lib/api/orders';
	import type { ApiDriver } from '$lib/api/drivers';
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

	let orders = $state<ApiOrder[]>([]);
	let drivers = $state<ApiDriver[]>([]);
	let selectedOrderIds = $state<Set<string>>(new Set());
	let selectedDriverId = $state('');
	let routeName = $state('');
	let loading = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	let didInit = $state(false);
	$effect(() => {
		if (didInit) return;
		didInit = true;
		loading = true;
		error = null;
		Promise.all([getOrders(), getDrivers()])
			.then(([ordersData, driversData]) => {
				orders = ordersData.filter((o) => o.status === 'Pending' || o.status === '0');
				drivers = driversData;
				if (drivers.length > 0) {
					selectedDriverId = drivers[0].id;
				}
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : 'Erreur lors du chargement';
			})
			.finally(() => {
				loading = false;
			});
	});

	function toggleOrder(orderId: string) {
		const newSet = new Set(selectedOrderIds);
		if (newSet.has(orderId)) newSet.delete(orderId);
		else newSet.add(orderId);
		selectedOrderIds = newSet;
	}

	function selectAll() {
		selectedOrderIds = new Set(orders.map((o) => o.id));
	}

	function deselectAll() {
		selectedOrderIds = new Set();
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (selectedOrderIds.size === 0) {
			error = 'Veuillez sélectionner au moins une commande';
			return;
		}
		if (!selectedDriverId) {
			error = 'Veuillez sélectionner un livreur';
			return;
		}
		submitting = true;
		error = null;
		try {
			await createDeliveriesBatch({
				driverId: selectedDriverId,
				orderIds: Array.from(selectedOrderIds)
			});
			success = true;
			setTimeout(() => goto('/deliveries'), 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la tournée';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="min-h-screen bg-background p-6 pb-12">
	<div class="mx-auto flex max-w-4xl flex-col gap-6">
		<TopNav title="Nouvelle tournée" subtitle="Sélectionnez les commandes et assignez un livreur" />

		{#if success}
			<Alert class="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
				<AlertTitle>Succès</AlertTitle>
				<AlertDescription>Tournée créée avec succès. Redirection...</AlertDescription>
			</Alert>
		{/if}

		{#if error}
			<Alert variant="destructive">
				<AlertTitle>Erreur</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}

		{#if loading}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">Chargement...</CardContent>
			</Card>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Informations de la tournée</CardTitle>
					</CardHeader>
					<CardContent class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="route">Nom de la tournée (optionnel)</Label>
							<Input
								id="route"
								type="text"
								bind:value={routeName}
								placeholder="Ex: Tournée Est - Matin"
							/>
						</div>
						<div class="space-y-2">
							<Label for="driver">Livreur *</Label>
							<select
								id="driver"
								bind:value={selectedDriverId}
								required
								disabled={submitting}
								class="border-input ring-offset-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">Sélectionner un livreur</option>
								{#each drivers as driver}
									<option value={driver.id}>{driver.name} ({driver.phone})</option>
								{/each}
							</select>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
						<div>
							<CardTitle>Commandes à livrer</CardTitle>
							<p class="mt-1 text-sm text-muted-foreground">
								{selectedOrderIds.size} commande{selectedOrderIds.size > 1 ? 's' : ''} sélectionnée{selectedOrderIds.size > 1 ? 's' : ''}
								{#if orders.length > 0}
									({orders.length} en attente)
								{/if}
							</p>
						</div>
						<div class="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={selectAll}
								disabled={submitting || orders.length === 0}
							>
								Tout sélectionner
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={deselectAll}
								disabled={submitting || selectedOrderIds.size === 0}
							>
								Tout désélectionner
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{#if orders.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								Aucune commande en attente.
								<Button variant="link" href="/orders" class="px-1">Importer des commandes</Button>
							</div>
						{:else}
							<div class="max-h-[400px] overflow-y-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="w-10">
												<Checkbox
													checked={selectedOrderIds.size === orders.length && orders.length > 0}
													onCheckedChange={() => {
														if (selectedOrderIds.size === orders.length) deselectAll();
														else selectAll();
													}}
													aria-label="Tout sélectionner"
												/>
											</TableHead>
											<TableHead>Client</TableHead>
											<TableHead>Adresse</TableHead>
											<TableHead>Statut</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each orders as order}
											<TableRow
												class={cn(
													'cursor-pointer transition-colors hover:bg-muted/50',
													selectedOrderIds.has(order.id) && 'bg-primary/5'
												)}
												onclick={() => toggleOrder(order.id)}
											>
												<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
													<Checkbox
														checked={selectedOrderIds.has(order.id)}
														onCheckedChange={() => toggleOrder(order.id)}
													/>
												</TableCell>
												<TableCell>{order.customerName}</TableCell>
												<TableCell>{order.address}</TableCell>
												<TableCell>
													<Badge variant="secondary">En attente</Badge>
												</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
					</CardContent>
				</Card>

				<div class="flex justify-end gap-3">
					<Button type="button" variant="outline" onclick={() => goto('/deliveries')} disabled={submitting}>
						Annuler
					</Button>
					<Button
						type="submit"
						disabled={submitting || selectedOrderIds.size === 0 || !selectedDriverId || orders.length === 0}
					>
						{submitting ? 'Création...' : `Créer la tournée (${selectedOrderIds.size} livraison${selectedOrderIds.size > 1 ? 's' : ''})`}
					</Button>
				</div>
			</form>
		{/if}
	</div>
</div>
