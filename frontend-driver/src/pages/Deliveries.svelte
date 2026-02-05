<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { getDeliveries } from '../lib/api/deliveries';
	import type { ApiDelivery } from '../lib/api/deliveries';

	const dispatch = createEventDispatcher();

	let { driverId = null }: { driverId?: string | null } = $props();
	let deliveries = $state<ApiDelivery[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const completedCount = $derived(deliveries.filter(d => d.status === 'Completed' || d.status === 'Livree').length);
	const totalCount = $derived(deliveries.length);
	const progressPercent = $derived(totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0);

	onMount(() => {
		loadDeliveries();
	});

	async function loadDeliveries() {
		loading = true;
		error = null;

		try {
			const data = await getDeliveries(driverId ?? undefined);
			// Tri par tournée puis sequence (ordre des arrêts)
			deliveries = [...data].sort((a, b) => {
				const routeA = a.routeId ?? '';
				const routeB = b.routeId ?? '';
				if (routeA !== routeB) return routeA.localeCompare(routeB);
				return (a.sequence ?? 999) - (b.sequence ?? 999);
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	}

	function stopLabel(delivery: ApiDelivery): string {
		if (delivery.sequence != null && delivery.routeId) return `Arrêt ${delivery.sequence + 1}`;
		return 'Livraison';
	}

	function getStatusBadge(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
			case 'prevue':
				return 'badge-warning';
			case 'inprogress':
			case 'en cours':
				return 'badge-warning';
			case 'completed':
			case 'livree':
				return 'badge-success';
			default:
				return 'badge-warning';
		}
	}

	function getStatusLabel(status: string) {
		switch (status.toLowerCase()) {
			case 'pending':
				return 'Prévue';
			case 'inprogress':
				return 'En cours';
			case 'completed':
				return 'Livrée';
			default:
				return status;
		}
	}
</script>

<div class="container">
	<div class="header">
		<h1>Mes Livraisons</h1>
		<button
			class="btn"
			onclick={() => dispatch('logout')}
			style="background: var(--text-muted); color: white; padding: 0.5rem 1rem; font-size: 0.875rem; margin-top: 0.5rem;"
		>
			Déconnexion
		</button>
	</div>

	{#if loading && deliveries.length === 0}
		<div class="loading">Chargement des livraisons...</div>
	{:else if error}
		<div class="error">{error}</div>
		<button class="btn btn-primary" onclick={loadDeliveries} style="width: 100%; margin-top: 1rem;">
			Réessayer
		</button>
	{:else if deliveries.length === 0}
		<div class="card" style="text-align: center; padding: 3rem 1.5rem;">
			<p style="color: var(--text-muted); font-size: 1.125rem;">
				Aucune livraison pour le moment
			</p>
		</div>
	{:else}
		{#if totalCount > 0}
			<div class="card" style="margin-bottom: 1rem; padding: 1rem 1.25rem;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
					<span style="font-size: 0.875rem; color: var(--text-muted);">Tournée</span>
					<span style="font-size: 0.875rem; font-weight: 600; color: var(--primary);">{completedCount} / {totalCount} livrées</span>
				</div>
				<div style="height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
					<div style="height: 100%; width: {progressPercent}%; background: var(--primary); border-radius: 4px; transition: width 0.3s;"></div>
				</div>
			</div>
		{/if}
		<div class="delivery-list">
			{#each deliveries as delivery}
				<button
					type="button"
					class="delivery-item"
					onclick={() => dispatch('select', delivery.id)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch('select', delivery.id); } }}
					style="
						cursor: pointer;
						width: 100%;
						text-align: left;
						border: none;
						background: var(--surface);
						padding: 1.5rem;
						border-radius: 16px;
						box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
					"
				>
					<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
						<div>
							<h3>{stopLabel(delivery)} — {delivery.id.slice(0, 8).toUpperCase()}</h3>
							<p>Commande: {delivery.orderId.slice(0, 8).toUpperCase()}</p>
						</div>
						<span class="badge {getStatusBadge(delivery.status)}">
							{getStatusLabel(delivery.status)}
						</span>
					</div>
				</button>
			{/each}
		</div>

		<button
			class="btn btn-primary"
			onclick={loadDeliveries}
			disabled={loading}
			style="width: 100%; margin-top: 1rem;"
		>
			{loading ? 'Actualisation...' : 'Actualiser'}
		</button>
	{/if}
</div>
