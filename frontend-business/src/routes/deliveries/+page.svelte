<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import {
		deliveriesActions,
		deliveriesState,
		type DeliveryRoute
	} from '$lib/stores/deliveries.svelte';
	import { deleteDelivery, deleteDeliveriesBatch } from '$lib/api/deliveries';

	const statusClass: Record<string, string> = {
		Prevue: 'warning',
		'En cours': 'warning',
		Livree: 'success',
		Retard: 'danger'
	};

	const deliveries: DeliveryRoute[] = [
		{
			id: 'tournee-est',
			route: 'Tournee Est',
			driver: 'Amine K.',
			stops: 8,
			status: 'En cours',
			eta: '11:40'
		},
		{
			id: 'tournee-centre',
			route: 'Tournee Centre',
			driver: 'Lina P.',
			stops: 6,
			status: 'Prevue',
			eta: '13:20'
		},
		{
			id: 'tournee-ouest',
			route: 'Tournee Ouest',
			driver: 'Marc D.',
			stops: 5,
			status: 'Livree',
			eta: '09:05'
		}
	];

	if (!deliveriesState.routes.length) {
		deliveriesActions.setRoutes(deliveries);
	}

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
		if (newSet.has(id)) {
			newSet.delete(id);
		} else {
			newSet.add(id);
		}
		selectedIds = newSet;
	}

	function toggleSelectAll() {
		if (selectedIds.size === deliveriesState.routes.length) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(deliveriesState.routes.map(d => d.id));
		}
	}

	function clearSelection() {
		selectedIds = new Set();
	}

	async function handleDeleteSelected() {
		if (selectedIds.size === 0) return;

		const count = selectedIds.size;
		if (!confirm(`Êtes-vous sûr de vouloir supprimer ${count} tournée${count > 1 ? 's' : ''} ?`)) {
			return;
		}

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

<div class="page">
	<TopNav title="Tournees" subtitle="Suivi des tournees et du temps reel chauffeur." />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Tournees du jour</h2>
				<p class="footer-note">3 tournees actives</p>
			</div>
			<div class="controls">
				<input class="search-input" type="search" placeholder="Filtrer par chauffeur" />
				<button class="ghost-button" type="button">Voir la carte</button>
				<button 
					class="ghost-button" 
					type="button" 
					onclick={deliveriesActions.loadDeliveries}
					disabled={deliveriesState.loading}
				>
					{deliveriesState.loading ? 'Chargement...' : 'Actualiser'}
				</button>
				<a href="/deliveries/new" class="primary-button" style="text-decoration: none; display: inline-block;">Nouvelle tournee</a>
			</div>
		</div>

		{#if deliveriesState.error}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
				{deliveriesState.error}
			</div>
		{/if}

		{#if deleteError}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
				{deleteError}
			</div>
		{/if}

		{#if selectedIds.size > 0}
			<div class="selection-bar" style="padding: 1rem; background: var(--primary, #2563eb); color: white; border-radius: 4px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
				<div>
					<strong>{selectedIds.size}</strong> tournée{selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''}
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
						{deleting ? 'Suppression...' : `Supprimer ${selectedIds.size} tournée${selectedIds.size > 1 ? 's' : ''}`}
					</button>
				</div>
			</div>
		{/if}

		{#if deliveriesState.loading && !deliveriesState.routes.length}
			<div style="padding: 2rem; text-align: center;">Chargement des tournees...</div>
		{:else}
		<table class="table">
							<thead>
								<tr>
									<th style="width: 40px;">
										<input
											type="checkbox"
											checked={selectedIds.size === deliveriesState.routes.length && deliveriesState.routes.length > 0}
											onchange={toggleSelectAll}
											title="Tout sélectionner"
										/>
									</th>
									<th>Tournee</th>
									<th>Chauffeur</th>
									<th>Arrets</th>
									<th>Statut</th>
									<th>ETA</th>
								</tr>
							</thead>
							<tbody>
								{#each deliveriesState.routes as delivery}
									<tr style="cursor: pointer;" onclick={() => toggleSelection(delivery.id)} class:selected={selectedIds.has(delivery.id)}>
										<td onclick={(e) => e.stopPropagation()}>
											<input
												type="checkbox"
												checked={selectedIds.has(delivery.id)}
												onchange={() => toggleSelection(delivery.id)}
												onclick={(e) => e.stopPropagation()}
											/>
										</td>
										<td>
											<a class="secondary-link" href={`/deliveries/${delivery.id}`} onclick={(e) => e.stopPropagation()}>
												{delivery.route}
											</a>
										</td>
										<td>{delivery.driver}</td>
										<td class="mono">{delivery.stops}</td>
										<td>
											<span class="badge {statusClass[delivery.status] || 'warning'}">
												{delivery.status}
											</span>
										</td>
										<td class="mono">{delivery.eta}</td>
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
