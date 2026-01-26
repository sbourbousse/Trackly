<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import {
		deliveriesActions,
		deliveriesState,
		type DeliveryRoute
	} from '$lib/stores/deliveries.svelte';

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
	$effect(() => {
		if (didInit) return;
		didInit = true;
		deliveriesActions.loadDeliveries();
	});
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

		{#if deliveriesState.loading && !deliveriesState.routes.length}
			<div style="padding: 2rem; text-align: center;">Chargement des tournees...</div>
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
				{#each deliveriesState.routes as delivery}
					<tr>
						<td>
							<a class="secondary-link" href={`/deliveries/${delivery.id}`}>
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
