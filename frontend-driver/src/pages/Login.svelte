<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let driverId = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleLogin() {
		if (!driverId.trim()) {
			error = 'Veuillez entrer votre ID livreur';
			return;
		}

		loading = true;
		error = null;

		// En développement, on accepte n'importe quel ID
		// En production, on vérifiera avec l'API
		setTimeout(() => {
			dispatch('login', driverId.trim());
			loading = false;
		}, 500);
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
