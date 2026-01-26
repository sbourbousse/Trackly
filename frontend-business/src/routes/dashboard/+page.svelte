<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';

	const kpis = [
		{
			label: 'Livraisons du mois',
			value: '18',
			trend: '+6 cette semaine'
		},
		{
			label: 'Tournees en cours',
			value: '2',
			trend: 'Dernier depart 09:10'
		},
		{
			label: 'Taux de reussite',
			value: '96%',
			trend: 'Objectif: 98%'
		},
		{
			label: 'Clients en attente',
			value: '4',
			trend: 'Priorite: zone Est'
		}
	];

	const actions = [
		{
			title: 'Importer des commandes',
			subtitle: 'CSV, Shopify, Woo'
		},
		{
			title: 'Creer une tournee',
			subtitle: 'Optimiser l ordre de passage'
		},
		{
			title: 'Envoyer le lien client',
			subtitle: 'SMS ou email'
		},
		{
			title: 'Suivre les chauffeurs',
			subtitle: 'Vue temps reel'
		}
	];

	const deliveries = [
		{
			ref: 'DLV-194',
			client: 'Atelier Moreau',
			address: '12 Rue des Tanneurs',
			status: 'En cours',
			eta: '10:35'
		},
		{
			ref: 'DLV-195',
			client: 'Boulangerie Romy',
			address: '8 Avenue du Port',
			status: 'A preparer',
			eta: '11:10'
		},
		{
			ref: 'DLV-196',
			client: 'Fleurs Mimosa',
			address: '3 Rue du Marche',
			status: 'Livre',
			eta: '09:52'
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
			<div class="action-button">
				<div>
					<div>{action.title}</div>
					<span>{action.subtitle}</span>
				</div>
				<span>→</span>
			</div>
		{/each}
	</section>

	<section class="panel">
		<div class="panel-header">
			<h2>Livraisons a venir</h2>
			<span class="status-pill">Temps reel</span>
		</div>
		<table class="table">
			<thead>
				<tr>
					<th>Ref</th>
					<th>Client</th>
					<th>Adresse</th>
					<th>Statut</th>
					<th>ETA</th>
				</tr>
			</thead>
			<tbody>
				{#each deliveries as delivery}
					<tr>
						<td>{delivery.ref}</td>
						<td>{delivery.client}</td>
						<td>{delivery.address}</td>
						<td>
							<span
								class="badge {delivery.status === 'Livre'
									? 'success'
									: delivery.status === 'En cours'
										? 'warning'
										: 'danger'}"
							>
								{delivery.status}
							</span>
						</td>
						<td>{delivery.eta}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</section>

	<div class="footer-note">MVP dashboard - donnees fictives pour le moment.</div>
</div>
