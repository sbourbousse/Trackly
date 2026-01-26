<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import TopNav from '$lib/components/TopNav.svelte';
	import { getOrder } from '$lib/api/orders';
	import type { ApiOrderDetail } from '$lib/api/orders';

	let order = $state<ApiOrderDetail | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const statusClass: Record<string, string> = {
		Pending: 'warning',
		Planned: 'info',
		InTransit: 'warning',
		Delivered: 'success',
		Cancelled: 'danger',
		'0': 'warning', // Pending
		'1': 'info', // Planned
		'2': 'warning', // InTransit
		'3': 'success', // Delivered
		'4': 'danger' // Cancelled
	};

	const deliveryStatusClass: Record<string, string> = {
		Pending: 'warning',
		InProgress: 'warning',
		Completed: 'success',
		Failed: 'danger',
		'0': 'warning', // Pending
		'1': 'warning', // InProgress
		'2': 'success', // Completed
		'3': 'danger' // Failed
	};

	const statusLabel: Record<string, string> = {
		Pending: 'En attente',
		Planned: 'Planifiée',
		InTransit: 'En transit',
		Delivered: 'Livrée',
		Cancelled: 'Annulée',
		'0': 'En attente',
		'1': 'Planifiée',
		'2': 'En transit',
		'3': 'Livrée',
		'4': 'Annulée'
	};

	const deliveryStatusLabel: Record<string, string> = {
		Pending: 'Prévue',
		InProgress: 'En cours',
		Completed: 'Livrée',
		Failed: 'Échouée',
		'0': 'Prévue',
		'1': 'En cours',
		'2': 'Livrée',
		'3': 'Échouée'
	};

	onMount(async () => {
		const orderId = $page.params.id;
		if (!orderId) {
			error = 'ID de commande manquant';
			return;
		}

		loading = true;
		error = null;

		try {
			order = await getOrder(orderId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="page">
	<TopNav title="Détail de la commande" subtitle="Informations complètes et livraisons associées" />

	{#if loading}
		<div style="padding: 2rem; text-align: center;">Chargement...</div>
	{:else if error}
		<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
			{error}
		</div>
		<div style="margin-top: 1rem;">
			<button class="ghost-button" onclick={() => goto('/orders')}>Retour à la liste</button>
		</div>
	{:else if order}
		<section class="panel">
			<div class="panel-header">
				<div>
					<h2>Informations de la commande</h2>
					<p class="footer-note">Référence: {order.id.slice(0, 8).toUpperCase()}</p>
				</div>
				<div class="controls">
					<button class="ghost-button" onclick={() => goto('/orders')}>Retour</button>
					<a href="/deliveries/new" class="primary-button" style="text-decoration: none; display: inline-block;">
						Créer une livraison
					</a>
				</div>
			</div>

			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; padding: 1.5rem;">
				<div>
					<label style="display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Client</label>
					<div style="font-weight: 500; font-size: 1.125rem;">{order.customerName}</div>
				</div>
				<div>
					<label style="display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Adresse</label>
					<div style="font-weight: 500;">{order.address}</div>
				</div>
				<div>
					<label style="display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Statut</label>
					<span class="badge {statusClass[order.status] || 'warning'}">
						{statusLabel[order.status] || order.status}
					</span>
				</div>
				<div>
					<label style="display: block; font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.25rem;">Date de création</label>
					<div style="font-weight: 500;">{formatDate(order.createdAt)}</div>
				</div>
			</div>
		</section>

		<section class="panel" style="margin-top: 1.5rem;">
			<div class="panel-header">
				<h2>Livraisons associées</h2>
				<span class="status-pill">{order.deliveries.length} livraison{order.deliveries.length > 1 ? 's' : ''}</span>
			</div>

			{#if order.deliveries.length === 0}
				<div style="padding: 2rem; text-align: center; color: var(--text-muted);">
					Aucune livraison associée à cette commande.
					<br />
					<a href="/deliveries/new" class="secondary-link" style="margin-top: 0.5rem; display: inline-block;">
						Créer une livraison
					</a>
				</div>
			{:else}
				<table class="table">
					<thead>
						<tr>
							<th>Référence</th>
							<th>Livreur</th>
							<th>Statut</th>
							<th>Créée le</th>
							<th>Livrée le</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each order.deliveries as delivery}
							<tr>
								<td class="mono">
									<a class="secondary-link" href={`/deliveries/${delivery.id}`}>
										{delivery.id.slice(0, 8).toUpperCase()}
									</a>
								</td>
								<td>{delivery.driverName || 'Non assigné'}</td>
								<td>
									<span class="badge {deliveryStatusClass[delivery.status] || 'warning'}">
										{deliveryStatusLabel[delivery.status] || delivery.status}
									</span>
								</td>
								<td class="mono">{formatDate(delivery.createdAt)}</td>
								<td class="mono">
									{delivery.completedAt ? formatDate(delivery.completedAt) : '-'}
								</td>
								<td>
									<a class="secondary-link" href={`/deliveries/${delivery.id}`}>
										Voir détails
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>
	{/if}
</div>

<style>
	.status-pill {
		background: var(--border, #e5e7eb);
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.875rem;
		font-weight: 500;
	}
</style>
