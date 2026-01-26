<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import TopNav from '$lib/components/TopNav.svelte';
	import { getOrders } from '$lib/api/orders';
	import { getDrivers } from '$lib/api/drivers';
	import { createDeliveriesBatch } from '$lib/api/deliveries';
	import type { ApiOrder } from '$lib/api/orders';
	import type { ApiDriver } from '$lib/api/drivers';

	let orders = $state<ApiOrder[]>([]);
	let drivers = $state<ApiDriver[]>([]);
	let selectedOrderIds = $state<Set<string>>(new Set());
	let selectedDriverId = $state<string>('');
	let routeName = $state('');
	let loading = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	onMount(async () => {
		loading = true;
		error = null;

		try {
			const [ordersData, driversData] = await Promise.all([
				getOrders(),
				getDrivers()
			]);

			// Filtrer uniquement les commandes en attente
			orders = ordersData.filter(o => o.status === 'Pending' || o.status === '0');
			drivers = driversData;

			if (drivers.length > 0) {
				selectedDriverId = drivers[0].id;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	});

	function toggleOrder(orderId: string) {
		const newSet = new Set(selectedOrderIds);
		if (newSet.has(orderId)) {
			newSet.delete(orderId);
		} else {
			newSet.add(orderId);
		}
		selectedOrderIds = newSet;
	}

	function selectAll() {
		selectedOrderIds = new Set(orders.map(o => o.id));
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
			setTimeout(() => {
				goto('/deliveries');
			}, 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la tournée';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page">
	<TopNav title="Nouvelle tournée" subtitle="Sélectionnez les commandes et assignez un livreur" />

	{#if success}
		<div class="success-message" style="padding: 1rem; background: #efe; color: #3c3; border-radius: 4px; margin-bottom: 1rem;">
			✓ Tournée créée avec succès ! Redirection...
		</div>
	{/if}

	{#if error}
		<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
			{error}
		</div>
	{/if}

	{#if loading}
		<div style="padding: 2rem; text-align: center;">Chargement...</div>
	{:else}
		<form onsubmit={handleSubmit}>
			<section class="panel">
				<div class="panel-header">
					<h2>Informations de la tournée</h2>
				</div>

				<div style="display: grid; gap: 1.5rem; padding: 1.5rem;">
					<label class="form-field">
						<span>Nom de la tournée (optionnel)</span>
						<input
							type="text"
							bind:value={routeName}
							placeholder="Ex: Tournée Est - Matin"
						/>
					</label>

					<label class="form-field">
						<span>Livreur <span style="color: #c33;">*</span></span>
						<select bind:value={selectedDriverId} required disabled={submitting}>
							<option value="">Sélectionner un livreur</option>
							{#each drivers as driver}
								<option value={driver.id}>{driver.name} ({driver.phone})</option>
							{/each}
						</select>
					</label>
				</div>
			</section>

			<section class="panel" style="margin-top: 1.5rem;">
				<div class="panel-header">
					<div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
						<h2>Commandes à livrer</h2>
						<div style="display: flex; gap: 0.5rem;">
							<button
								type="button"
								class="ghost-button"
								onclick={selectAll}
								disabled={submitting || orders.length === 0}
							>
								Tout sélectionner
							</button>
							<button
								type="button"
								class="ghost-button"
								onclick={deselectAll}
								disabled={submitting || selectedOrderIds.size === 0}
							>
								Tout désélectionner
							</button>
						</div>
					</div>
					<p class="footer-note">
						{selectedOrderIds.size} commande{selectedOrderIds.size > 1 ? 's' : ''} sélectionnée{selectedOrderIds.size > 1 ? 's' : ''}
						{#if orders.length > 0}
							({orders.length} commande{orders.length > 1 ? 's' : ''} en attente)
						{/if}
					</p>
				</div>

				{#if orders.length === 0}
					<div style="padding: 2rem; text-align: center; color: var(--text-muted);">
						Aucune commande en attente. <a href="/orders" class="secondary-link">Importer des commandes</a>
					</div>
				{:else}
					<div style="max-height: 400px; overflow-y: auto;">
						<table class="table">
							<thead>
								<tr>
									<th style="width: 40px;">
										<input
											type="checkbox"
											checked={selectedOrderIds.size === orders.length && orders.length > 0}
											onchange={(e) => {
												if (e.currentTarget.checked) {
													selectAll();
												} else {
													deselectAll();
												}
											}}
										/>
									</th>
									<th>Client</th>
									<th>Adresse</th>
									<th>Statut</th>
								</tr>
							</thead>
							<tbody>
								{#each orders as order}
									<tr style="cursor: pointer;" onclick={() => toggleOrder(order.id)}>
										<td>
											<input
												type="checkbox"
												checked={selectedOrderIds.has(order.id)}
												onchange={() => toggleOrder(order.id)}
												onclick={(e) => e.stopPropagation()}
											/>
										</td>
										<td>{order.customerName}</td>
										<td>{order.address}</td>
										<td>
											<span class="badge warning">En attente</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</section>

			<div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
				<button
					type="button"
					class="ghost-button"
					onclick={() => goto('/deliveries')}
					disabled={submitting}
				>
					Annuler
				</button>
				<button
					type="submit"
					class="primary-button"
					disabled={submitting || selectedOrderIds.size === 0 || !selectedDriverId || orders.length === 0}
				>
					{submitting ? 'Création...' : `Créer la tournée (${selectedOrderIds.size} livraison${selectedOrderIds.size > 1 ? 's' : ''})`}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field span {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-field input,
	.form-field select {
		padding: 0.75rem;
		border: 2px solid var(--border);
		border-radius: 6px;
		font-size: 1rem;
	}

	.form-field input:focus,
	.form-field select:focus {
		outline: none;
		border-color: var(--primary);
	}

	.success-message {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
