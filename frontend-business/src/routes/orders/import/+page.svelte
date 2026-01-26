<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';

	const providers = [
		{ id: 'csv', label: 'Importer CSV' },
		{ id: 'shopify', label: 'Shopify' },
		{ id: 'woo', label: 'WooCommerce' }
	];

	let selected = $state('csv');
</script>

<div class="page">
	<TopNav title="Import commandes" subtitle="Ajoute des commandes depuis un fichier ou un plugin." />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Source d import</h2>
				<p class="footer-note">Mode demo, aucune donnee envoyee.</p>
			</div>
			<div class="controls">
				<a class="ghost-button" href="/orders">Retour</a>
				<button class="primary-button" type="button">Lancer import</button>
			</div>
		</div>

		<div class="actions">
			{#each providers as provider}
				<button
					class="action-button"
					class:active={selected === provider.id}
					type="button"
					onclick={() => (selected = provider.id)}
				>
					<div>
						<div>{provider.label}</div>
						<span>Configurer la source</span>
					</div>
					<span>→</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="panel">
		<h2>Etapes</h2>
		<table class="table">
			<thead>
				<tr>
					<th>Etape</th>
					<th>Statut</th>
					<th>Detail</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>1. Televerser le fichier</td>
					<td><span class="badge warning">A faire</span></td>
					<td>Glisser deposer ou selectionner</td>
				</tr>
				<tr>
					<td>2. Mapper les colonnes</td>
					<td><span class="badge warning">A faire</span></td>
					<td>Nom, adresse, statut</td>
				</tr>
				<tr>
					<td>3. Valider l import</td>
					<td><span class="badge warning">A faire</span></td>
					<td>Resume et creation des commandes</td>
				</tr>
			</tbody>
		</table>
	</section>
</div>
