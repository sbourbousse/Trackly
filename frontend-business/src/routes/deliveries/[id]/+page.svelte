<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import {
		deliveriesActions,
		deliveriesState,
		type DeliveryStop
	} from '$lib/stores/deliveries.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';

	const stops: DeliveryStop[] = [
		{
			id: 'stop-1',
			name: 'Atelier Moreau',
			address: '12 Rue des Tanneurs',
			status: 'Livre',
			eta: '09:52'
		},
		{
			id: 'stop-2',
			name: 'Boulangerie Romy',
			address: '8 Avenue du Port',
			status: 'En cours',
			eta: '10:35'
		},
		{
			id: 'stop-3',
			name: 'Fleurs Mimosa',
			address: '3 Rue du Marche',
			status: 'Prevu',
			eta: '11:10'
		}
	];

	if (!deliveriesState.stops.length) {
		deliveriesActions.setStops(stops);
	}

	$effect(() => {
		trackingActions.connect();
		return () => {
			trackingActions.disconnect();
		};
	});
</script>

<div class="page">
	<TopNav title="Tournee Est" subtitle="Detail de la tournee et suivi chauffeur." />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Carte et position</h2>
				<p class="footer-note">Derniere maj: {deliveriesState.lastUpdateAt}</p>
			</div>
			<div class="controls">
				<button class="ghost-button" type="button">Partager lien client</button>
				<button class="ghost-button" type="button" onclick={trackingActions.connect}>
					{trackingState.isConnected
						? 'Connecte'
						: trackingState.isConnecting
							? 'Connexion...'
							: 'Activer temps reel'}
				</button>
				<button class="primary-button" type="button">Envoyer alerte chauffeur</button>
			</div>
		</div>

		<div class="map-placeholder">
			<div>
				<strong>Carte</strong>
				{#if trackingState.point}
					<span>
						{trackingState.point.lat.toFixed(4)}, {trackingState.point.lng.toFixed(4)}
					</span>
				{:else if trackingState.lastError}
					<span>Erreur: {trackingState.lastError}</span>
				{:else}
					<span>Position chauffeur simulee</span>
				{/if}
			</div>
		</div>
	</section>

	<section class="panel">
		<div class="panel-header">
			<h2>Arrets de la tournee</h2>
			<span class="status-pill">8 colis</span>
		</div>
		<table class="table">
			<thead>
				<tr>
					<th>Client</th>
					<th>Adresse</th>
					<th>Statut</th>
					<th>ETA</th>
				</tr>
			</thead>
			<tbody>
				{#each deliveriesState.stops as stop}
					<tr>
						<td>{stop.name}</td>
						<td>{stop.address}</td>
						<td>
							<span class="badge {stop.status === 'Livre' ? 'success' : 'warning'}">
								{stop.status}
							</span>
						</td>
						<td class="mono">{stop.eta}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>
</div>
