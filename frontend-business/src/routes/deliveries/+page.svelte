<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { deleteDeliveriesBatch } from '$lib/api/deliveries';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
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
		Prevue: 'secondary',
		'En cours': 'secondary',
		Livree: 'default',
		Retard: 'destructive'
	};

	let didInit = $state(false);
	let selectedIds = $state<Set<string>>(new Set());
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	$effect(() => {
		if (didInit) return;
		didInit = true;
		deliveriesActions.loadDeliveries();
	});

	function toggleSelection(id: string) {
		const newSet = new Set(selectedIds);
		if (newSet.has(id)) newSet.delete(id);
		else newSet.add(id);
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === deliveriesState.routes.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(deliveriesState.routes.map((d) => d.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;
		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} tournée${count > 1 ? 's' : ''} ?`)) return;
		deleting = true;
		deleteError = null;
		try {
			await deleteDeliveriesBatch({ ids: Array.from(selectedIds) });
			clearSelection();
			await deliveriesActions.loadDeliveries();
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
		} finally {
			deleting = false;
		}
	}
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">
	<PageHeader title="Tournées" subtitle="Suivi des tournées et du temps réel chauffeur." />

		<Card>
			<CardHeader class="space-y-1">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Tournées du jour</CardTitle>
						<p class="text-sm text-muted-foreground">
							{deliveriesState.routes.length} tournée{deliveriesState.routes.length > 1 ? 's' : ''}
							{deliveriesState.lastUpdateAt ? ` · Dernière MAJ: ${deliveriesState.lastUpdateAt}` : ''}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<Input type="search" placeholder="Filtrer par chauffeur" class="h-9 w-48 rounded-full" />
						<Button variant="outline" size="sm">Voir la carte</Button>
						<Button
							variant="outline"
							size="sm"
							onclick={deliveriesActions.loadDeliveries}
							disabled={deliveriesState.loading}
						>
							{deliveriesState.loading ? 'Chargement...' : 'Actualiser'}
						</Button>
						<Button size="sm" href="/deliveries/new">Nouvelle tournée</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if deliveriesState.error}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{deliveriesState.error}</AlertDescription>
					</Alert>
				{/if}
				{#if deleteError}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{deleteError}</AlertDescription>
					</Alert>
				{/if}

				{#if selectedIds.size > 0}
					<div
						class="flex flex-wrap items-center justify-between gap-4 rounded-md border bg-primary px-4 py-3 text-primary-foreground"
					>
						<span class="font-medium">
							{selectedIds.size} tournée{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
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
							<Button
								variant="destructive"
								size="sm"
								onclick={handleDeleteSelected}
								disabled={deleting}
							>
								{deleting ? 'Suppression...' : `Supprimer ${selectedIds.size}`}
							</Button>
						</div>
					</div>
				{/if}

				{#if deliveriesState.loading && !deliveriesState.routes.length}
					<div class="py-8 text-center text-muted-foreground">Chargement des tournées...</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead class="w-10">
									<Checkbox
										checked={selectedIds.size === deliveriesState.routes.length && deliveriesState.routes.length > 0}
										onCheckedChange={toggleSelectAll}
										aria-label="Tout sélectionner"
									/>
								</TableHead>
								<TableHead>Tournée</TableHead>
								<TableHead>Chauffeur</TableHead>
								<TableHead>Arrêts</TableHead>
								<TableHead>Statut</TableHead>
								<TableHead class="tabular-nums">ETA</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each deliveriesState.routes as delivery}
								<TableRow
									class={cn(
										'cursor-pointer transition-colors hover:bg-muted/50',
										selectedIds.has(delivery.id) && 'bg-primary/5'
									)}
									onclick={() => toggleSelection(delivery.id)}
								>
									<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
										<Checkbox
											checked={selectedIds.has(delivery.id)}
											onCheckedChange={() => toggleSelection(delivery.id)}
										/>
									</TableCell>
									<TableCell onclick={(e) => e.stopPropagation()}>
										<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
											{delivery.route}
										</Button>
									</TableCell>
									<TableCell>{delivery.driver}</TableCell>
									<TableCell class="tabular-nums">{delivery.stops}</TableCell>
									<TableCell>
										<Badge variant={statusVariant[delivery.status] ?? 'outline'}>{delivery.status}</Badge>
									</TableCell>
									<TableCell class="tabular-nums">{delivery.eta}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
