<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { getDriverTenantId } from '../lib/api/client';
	import { getRuntimeConfig } from '../lib/config';

	const dispatch = createEventDispatcher();

	let driverId = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const config = getRuntimeConfig();
	const baseUrl = config.API_BASE_URL || 'http://localhost:5257';

	async function handleLogin() {
		if (!driverId.trim()) {
			error = 'Veuillez entrer votre ID livreur';
			return;
		}

		loading = true;
		error = null;

		try {
			// Récupère le tenant ID du driver depuis l'API
			const trimmedDriverId = driverId.trim();
			const tenantId = await getDriverTenantId(trimmedDriverId);
			
			if (!tenantId) {
				error = 'Impossible de récupérer le tenant ID. Vérifiez que l\'ID livreur est correct.';
				loading = false;
				return;
			}

			console.log('[Login] Tenant ID récupéré:', tenantId);
			dispatch('login', trimmedDriverId);
		} catch (err) {
			console.error('[Login] Erreur:', err);
			error = err instanceof Error ? err.message : 'Erreur lors de la connexion';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
	<div class="card" style="max-width: 400px; width: 100%;">
		<div class="header" style="border-bottom: none; padding-bottom: 0;">
			<h1>Trackly Driver</h1>
			<p style="color: var(--text-muted); margin-top: 0.5rem;">Connexion livreur</p>
		</div>

		{#if error}
			<div class="error">{error}</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} style="margin-top: 2rem;">
			<label for="driver-id" style="display: block; margin-bottom: 0.5rem; font-weight: 500;">
				ID Livreur
			</label>
			<input
				id="driver-id"
				type="text"
				bind:value={driverId}
				placeholder="Entrez votre ID"
				disabled={loading}
				style="
					width: 100%;
					padding: 1rem;
					font-size: 1.125rem;
					border: 2px solid var(--border);
					border-radius: 8px;
					margin-bottom: 1.5rem;
				"
			/>

			<button type="submit" class="btn btn-primary" disabled={loading} style="width: 100%;">
				{loading ? 'Connexion...' : 'Se connecter'}
			</button>
		</form>

		<p style="margin-top: 1.5rem; font-size: 0.875rem; color: var(--text-muted); text-align: center;">
			En développement : utilisez n'importe quel ID
		</p>
	</div>
</div>
