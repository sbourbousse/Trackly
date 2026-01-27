<script lang="ts">
	import { goto } from '$app/navigation';
	import { authActions } from '$lib/stores/auth.svelte';
	import { loginAccount, registerAccount } from '$lib/api/client';

	type Mode = 'login' | 'register';

	let mode = $state<Mode>('login');
	let companyName = $state('');
	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let remember = $state(true);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let createdTenantId = $state<string | null>(null);

	const handleSubmit = async (event: SubmitEvent) => {
		event.preventDefault();
		error = null;
		createdTenantId = null;

		if (!email.trim() || !password.trim()) {
			error = 'Email et mot de passe requis';
			return;
		}

		if (mode === 'register') {
			if (!companyName.trim() || !fullName.trim()) {
				error = "Le nom de l'entreprise et le nom complet sont requis";
				return;
			}
		}

		loading = true;
		try {
			const response = mode === 'register'
				? await registerAccount({
						companyName: companyName.trim(),
						name: fullName.trim(),
						email: email.trim(),
						password
					})
				: await loginAccount({
						email: email.trim(),
						password
					});

			if (remember) {
				localStorage.setItem('trackly_auth_token', response.token);
				localStorage.setItem('trackly_tenant_id', response.tenantId);
			} else {
				sessionStorage.setItem('trackly_auth_token', response.token);
				sessionStorage.setItem('trackly_tenant_id', response.tenantId);
			}

			authActions.setTenantId(response.tenantId);
			authActions.setToken(response.token);
			authActions.login({
				id: response.userId,
				name: response.name,
				email: response.email,
				plan: 'Starter'
			});

			createdTenantId = response.tenantId;
			await goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : "Erreur d'authentification";
		} finally {
			loading = false;
		}
	};
</script>

<div class="auth-page">
	<form class="auth-card" onsubmit={handleSubmit}>
		<div>
			<h2>Connexion a Trackly</h2>
			<p>Accede au tableau de bord pour suivre tes tournees.</p>
		</div>

		<div class="form-actions" style="margin-top: 0;">
			<button
				type="button"
				class="secondary-link"
				onclick={() => (mode = 'login')}
				disabled={loading || mode === 'login'}
			>
				Se connecter
			</button>
			<button
				type="button"
				class="secondary-link"
				onclick={() => (mode = 'register')}
				disabled={loading || mode === 'register'}
			>
				Creer un compte
			</button>
		</div>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		{#if createdTenantId && mode === 'register'}
			<p class="success">
				Tenant cree : {createdTenantId}
				<br />
				Copie cet ID pour l'app chauffeur si besoin.
			</p>
		{/if}

		<div class="form-grid">
			{#if mode === 'register'}
				<label class="form-field">
					Nom de l'entreprise
					<input type="text" bind:value={companyName} placeholder="Atelier Dupont" required />
				</label>
				<label class="form-field">
					Nom complet
					<input type="text" bind:value={fullName} placeholder="Jean Dupont" required />
				</label>
			{/if}
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

		<button class="primary-button" type="submit" disabled={loading}>
			{#if loading}
				{mode === 'register' ? 'Creation...' : 'Connexion...'}
			{:else}
				{mode === 'register' ? 'Creer mon compte' : 'Se connecter'}
			{/if}
		</button>
	</form>
</div>

<style>
	.error {
		margin-top: 1rem;
		color: #b42318;
	}
	.success {
		margin-top: 1rem;
		color: #027a48;
		word-break: break-all;
	}
</style>
