<script lang="ts">
	import { onMount } from 'svelte';
	import TopNav from '$lib/components/TopNav.svelte';
	import { getDrivers } from '$lib/api/drivers';
	import type { ApiDriver } from '$lib/api/drivers';

	let drivers = $state<ApiDriver[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadDrivers();
	});

	async function loadDrivers() {
		loading = true;
		error = null;

		try {
			drivers = await getDrivers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement des livreurs';
		} finally {
			loading = false;
		}
	}
</script>

<div class="page">
	<TopNav title="Livreurs" subtitle="Gérer vos livreurs" />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Liste des livreurs</h2>
				<p class="footer-note">{drivers.length} livreur{drivers.length > 1 ? 's' : ''}</p>
			</div>
			<div class="controls">
				<button 
					class="ghost-button" 
					type="button" 
					onclick={loadDrivers}
					disabled={loading}
				>
					{loading ? 'Chargement...' : 'Actualiser'}
				</button>
				<a href="/drivers/new" class="primary-button" style="text-decoration: none; display: inline-block;">Nouveau livreur</a>
			</div>
		</div>

		{#if error}
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
				{error}
			</div>
		{/if}

		{#if loading && drivers.length === 0}
			<div style="padding: 2rem; text-align: center;">Chargement des livreurs...</div>
		{:else if drivers.length === 0}
			<div style="padding: 2rem; text-align: center; color: var(--text-muted);">
				Aucun livreur pour le moment. <a href="/drivers/new" class="secondary-link">Ajouter un livreur</a>
			</div>
		{:else}
			<table class="table">
				<thead>
					<tr>
						<th>Nom</th>
						<th>Téléphone</th>
						<th>ID</th>
					</tr>
				</thead>
				<tbody>
					{#each drivers as driver}
						<tr>
							<td><strong>{driver.name}</strong></td>
							<td>{driver.phone}</td>
							<td class="mono" style="font-size: 0.875rem; color: var(--text-muted);">{driver.id}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</section>
</div>
