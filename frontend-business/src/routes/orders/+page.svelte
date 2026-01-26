<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { ordersActions, ordersState, type OrderItem } from '$lib/stores/orders.svelte';
	import { deleteOrdersBatch } from '$lib/api/orders';

	const statusClass: Record<string, string> = {
		'En attente': 'danger',
		'En cours': 'warning',
		Livree: 'success'
	};

	const orders: OrderItem[] = [
		{
			id: 'ord-702',
			ref: 'ORD-702',
			client: 'Atelier Moreau',
			address: '12 Rue des Tanneurs',
			status: 'En cours',
			deliveries: 3
		},
		{
			id: 'ord-703',
			ref: 'ORD-703',
			client: 'Boulangerie Romy',
			address: '8 Avenue du Port',
			status: 'En attente',
			deliveries: 2
		},
		{
			id: 'ord-704',
			ref: 'ORD-704',
			client: 'Fleurs Mimosa',
			address: '3 Rue du Marche',
			status: 'Livree',
			deliveries: 1
		}
	];

	if (!ordersState.items.length) {
		ordersActions.setOrders(orders);
	}

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
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === ordersState.items.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(ordersState.items.map(o => o.id));
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
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} commande${count > 1 ? 's' : ''} ?`)) {
			return;
		}

		deleting = true;
		deleteError = null;

		try {
			const result = await deleteOrdersBatch({
				ids: Array.from(selectedIds),
				forceDeleteDeliveries: forceDeleteDeliveries
			});

			if (result.skipped > 0 && !forceDeleteDeliveries) {
				showCascadeWarning = true;
				deleteError = `${result.skipped} commande(s) ont des livraisons actives. Cochez "Supprimer aussi les livraisons" pour forcer la suppression.`;
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

<div class="page">
	<TopNav title="Commandes" subtitle="Centralise les commandes avant creation des tournees." />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Commandes recentes</h2>
				<p class="footer-note">Derniere synchro: {ordersState.lastSyncAt}</p>
			</div>
			<div class="controls">
				<input class="search-input" type="search" placeholder="Rechercher une commande" />
				<a class="ghost-button" href="/orders/import">Importer CSV</a>
				<button 
					class="ghost-button" 
					type="button" 
					onclick={ordersActions.loadOrders}
					disabled={ordersState.loading}
				>
					{ordersState.loading ? 'Chargement...' : 'Actualiser'}
				</button>
				<button class="primary-button" type="button">Nouvelle commande</button>
			</div>
		</div>

		{#if ordersState.error}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
				{ordersState.error}
			</div>
		{/if}

		{#if deleteError}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
				{deleteError}
			</div>
		{/if}

		{#if selectedIds.size > 0}
			<div class="selection-bar" style="padding: 1rem; background: var(--primary, #2563eb); color: white; border-radius: 4px; margin-bottom: 1rem;">
				<div style="display: flex; flex-direction: column; gap: 0.5rem;">
					<div>
						<strong>{selectedIds.size}</strong> commande{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
					</div>
					{#if showCascadeWarning}
						<label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; cursor: pointer;">
							<input
								type="checkbox"
								bind:checked={forceDeleteDeliveries}
								style="width: 18px; height: 18px; cursor: pointer;"
							/>
							<span>Supprimer aussi les livraisons associées (cascade)</span>
						</label>
					{/if}
				</div>
				<div style="display: flex; gap: 0.5rem;">
					<button
						class="ghost-button"
						type="button"
						onclick={clearSelection}
						disabled={deleting}
						style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);"
					>
						Annuler
					</button>
					<button
						class="primary-button"
						type="button"
						onclick={handleDeleteSelected}
						disabled={deleting}
						style="background: #dc2626; color: white; border: none;"
					>
						{deleting ? 'Suppression...' : `Supprimer ${selectedIds.size} commande${selectedIds.size > 1 ? 's' : ''}`}
					</button>
				</div>
			</div>
		{/if}

		{#if ordersState.loading && !ordersState.items.length}
			<div style="padding: 2rem; text-align: center;">Chargement des commandes...</div>
		{:else}
		<table class="table">
			<thead>
				<tr>
					<th style="width: 40px;">
						<input
							type="checkbox"
							checked={selectedIds.size === ordersState.items.length && ordersState.items.length > 0}
							onchange={toggleSelectAll}
							title="Tout sélectionner"
						/>
					</th>
					<th>Ref</th>
					<th>Client</th>
					<th>Adresse</th>
					<th>Statut</th>
					<th>Livraisons</th>
				</tr>
			</thead>
			<tbody>
				{#each ordersState.items as order}
					<tr style="cursor: pointer;" onclick={() => toggleSelection(order.id)} class:selected={selectedIds.has(order.id)}>
						<td onclick={(e) => e.stopPropagation()}>
							<input
								type="checkbox"
								checked={selectedIds.has(order.id)}
								onchange={() => toggleSelection(order.id)}
								onclick={(e) => e.stopPropagation()}
							/>
						</td>
						<td class="mono">{order.ref}</td>
						<td>{order.client}</td>
						<td>{order.address}</td>
						<td>
							<span class="badge {statusClass[order.status] || 'warning'}">
								{order.status}
							</span>
						</td>
						<td class="mono">{order.deliveries}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		{/if}
	</section>
</div>

<style>
	tr.selected {
		background-color: rgba(37, 99, 235, 0.1);
	}

	tr:hover {
		background-color: rgba(0, 0, 0, 0.02);
	}

	tr.selected:hover {
		background-color: rgba(37, 99, 235, 0.15);
	}

	.selection-bar {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	input[type="checkbox"] {
		cursor: pointer;
		width: 18px;
		height: 18px;
	}
</style>
