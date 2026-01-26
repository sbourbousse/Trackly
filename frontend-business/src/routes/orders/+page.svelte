<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { ordersActions, ordersState, type OrderItem } from '$lib/stores/orders.svelte';

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
	$effect(() => {
		if (didInit) return;
		didInit = true;
		ordersActions.loadOrders();
	});
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
				<button class="ghost-button" type="button" onclick={ordersActions.loadOrders}>
					Actualiser
				</button>
				<button class="primary-button" type="button">Nouvelle commande</button>
			</div>
		</div>

		<table class="table">
			<thead>
				<tr>
					<th>Ref</th>
					<th>Client</th>
					<th>Adresse</th>
					<th>Statut</th>
					<th>Livraisons</th>
				</tr>
			</thead>
			<tbody>
				{#each ordersState.items as order}
					<tr>
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
	</section>
</div>
