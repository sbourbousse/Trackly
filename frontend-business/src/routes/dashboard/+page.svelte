<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { deliveriesActions, deliveriesState } from '$lib/stores/deliveries.svelte';
	import { ordersActions, ordersState } from '$lib/stores/orders.svelte';
	import { onMount } from 'svelte';

	let didInit = $state(false);

	$effect(() => {
		if (didInit) return;
		didInit = true;
		deliveriesActions.loadDeliveries();
		ordersActions.loadOrders();
	});

	// Calculer les KPIs depuis les vraies données
	const kpis = $derived([
		{
			label: 'Livraisons du mois',
			value: deliveriesState.routes.length.toString(),
			trend: `${deliveriesState.routes.filter(d => d.status === 'Livree').length} livrées`
		},
		{
			label: 'Tournees en cours',
			value: deliveriesState.routes.filter(d => d.status === 'En cours').length.toString(),
			trend: deliveriesState.lastUpdateAt ? `Dernière mise à jour: ${deliveriesState.lastUpdateAt}` : ''
		},
		{
			label: 'Commandes',
			value: ordersState.items.length.toString(),
			trend: `${ordersState.items.filter(o => o.status === 'En attente').length} en attente`
		},
		{
			label: 'Taux de reussite',
			value: deliveriesState.routes.length > 0
				? `${Math.round((deliveriesState.routes.filter(d => d.status === 'Livree').length / deliveriesState.routes.length) * 100)}%`
				: '0%',
			trend: 'Objectif: 98%'
		}
	]);

	const actions = [
		{
			title: 'Importer des commandes',
			subtitle: 'CSV, Shopify, Woo',
			href: '/orders/import'
		},
		{
			title: 'Creer une tournee',
			subtitle: 'Optimiser l ordre de passage',
			href: '/deliveries/new'
		},
		{
			title: 'Gérer les livreurs',
			subtitle: 'Ajouter et voir les livreurs',
			href: '/drivers'
		},
		{
			title: 'Voir les commandes',
			subtitle: 'Gérer les commandes',
			href: '/orders'
		},
		{
			title: 'Voir les tournees',
			subtitle: 'Suivre les livraisons',
			href: '/deliveries'
		}
	];
</script>

<div class="page">
	<TopNav title="Trackly Business" subtitle="Vue rapide des tournees et livraisons." />
	<div class="status-pill">Plan Starter · 7 livraisons restantes</div>

	<section class="grid">
		{#each kpis as kpi}
			<div class="card">
				<h3>{kpi.label}</h3>
				<div class="value">{kpi.value}</div>
				<div class="trend">{kpi.trend}</div>
			</div>
		{/each}
	</section>

	<section class="actions">
		{#each actions as action}
			<a href={action.href} class="action-button" style="text-decoration: none; color: inherit;">
				<div>
					<div>{action.title}</div>
					<span>{action.subtitle}</span>
				</div>
				<span>→</span>
			</a>
		{/each}
	</section>

	<section class="panel">
		<div class="panel-header">
			<h2>Tournees recentes</h2>
			<span class="status-pill">Temps reel</span>
		</div>
		{#if deliveriesState.loading && !deliveriesState.routes.length}
			<div style="padding: 2rem; text-align: center;">Chargement des tournees...</div>
		{:else if deliveriesState.error}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px;">
				{deliveriesState.error}
			</div>
		{:else if deliveriesState.routes.length === 0}
			<div style="padding: 2rem; text-align: center; color: #666;">
				Aucune tournee pour le moment. <a href="/deliveries/new" class="secondary-link">Créer une tournee</a>
			</div>
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Tournee</th>
						<th>Chauffeur</th>
						<th>Arrets</th>
						<th>Statut</th>
						<th>ETA</th>
					</tr>
				</thead>
				<tbody>
					{#each deliveriesState.routes.slice(0, 5) as delivery}
						<tr>
							<td>
								<a class="secondary-link" href={`/deliveries/${delivery.id}`}>
									{delivery.route}
								</a>
							</td>
							<td>{delivery.driver}</td>
							<td class="mono">{delivery.stops}</td>
							<td>
								<span
									class="badge {delivery.status === 'Livree'
										? 'success'
										: delivery.status === 'En cours'
											? 'warning'
											: 'warning'}"
								>
									{delivery.status}
								</span>
							</td>
							<td class="mono">{delivery.eta}</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if deliveriesState.routes.length > 5}
				<div style="padding: 1rem; text-align: center;">
					<a href="/deliveries" class="secondary-link">Voir toutes les tournees ({deliveriesState.routes.length})</a>
				</div>
			{/if}
		{/if}
	</section>
</div>
