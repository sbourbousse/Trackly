<script lang="ts">
	import { authActions } from '$lib/stores/auth.svelte';

	let email = $state('');
	let password = $state('');
	let remember = $state(true);

	const handleSubmit = (event: SubmitEvent) => {
		event.preventDefault();

		authActions.login({
			id: 'demo',
			name: 'Demo Trackly',
			email,
			plan: 'Starter'
		});
	};
</script>

<div class="auth-page">
	<form class="auth-card" onsubmit={handleSubmit}>
		<div>
			<h2>Connexion a Trackly</h2>
			<p>Accede au tableau de bord pour suivre tes tournees.</p>
		</div>

		<div class="form-grid">
			<label class="form-field">
				Email
				<input type="email" bind:value={email} placeholder="contact@atelier.fr" required />
			</label>
			<label class="form-field">
				Mot de passe
				<input type="password" bind:value={password} placeholder="********" required />
			</label>
		</div>

		<div class="form-actions">
			<label>
				<input type="checkbox" bind:checked={remember} />
				Se souvenir de moi
			</label>
			<a class="secondary-link" href="/dashboard">Mode demo</a>
		</div>

		<button class="primary-button" type="submit">Se connecter</button>
	</form>
</div>
