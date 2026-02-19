<script lang="ts">
	import { goto } from '$app/navigation';
	import { authActions } from '$lib/stores/auth.svelte';
	import { userState } from '$lib/stores/user.svelte';
	import { loginAccount, registerAccount } from '$lib/api/client';
	import { setAuthCookie } from '$lib/auth-cookie';
	import { setOfflineModeReactive } from '$lib/stores/offline.svelte';
	import { DEMO_TENANT_ID } from '$lib/offline/mockData';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = null;
		createdTenantId = null;

		if (!email.trim() || !password.trim()) {
			error = 'Email et mot de passe requis';
			return;
		}
		if (mode === 'register' && (!companyName.trim() || !fullName.trim())) {
			error = "Le nom de l'entreprise et le nom complet sont requis";
			return;
		}

		loading = true;
		try {
			const response =
				mode === 'register'
					? await registerAccount({
							companyName: companyName.trim(),
							name: fullName.trim(),
							email: email.trim(),
							password
						})
					: await loginAccount({ email: email.trim(), password });

			if (remember) {
				localStorage.setItem('trackly_auth_token', response.token);
				localStorage.setItem('trackly_tenant_id', response.tenantId);
			} else {
				sessionStorage.setItem('trackly_auth_token', response.token);
				sessionStorage.setItem('trackly_tenant_id', response.tenantId);
			}
			setAuthCookie(response.token, remember);

			authActions.setTenantId(response.tenantId);
			authActions.setToken(response.token);
			authActions.login({
				id: response.userId,
				name: response.name,
				email: response.email,
				plan: 'Starter'
			});

			// Sauvegarder dans userState pour la sidebar
			userState.setUser({
				id: response.userId,
				name: response.name,
				email: response.email
			});
			userState.setTenant({
				id: response.tenantId,
				name: companyName || 'Mon Entreprise'
			});

			createdTenantId = response.tenantId;
			await goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : "Erreur d'authentification";
		} finally {
			loading = false;
		}
	}

	async function handleDemoMode() {
		loading = true;
		try {
			// Activer le mode offline/démo
			setOfflineModeReactive(true);

			// Configurer les données de démo
			const demoToken = 'demo-token-' + Date.now();
			localStorage.setItem('trackly_auth_token', demoToken);
			localStorage.setItem('trackly_tenant_id', DEMO_TENANT_ID);
			setAuthCookie(demoToken, true);

			// Authentifier avec les données de démo
			authActions.setTenantId(DEMO_TENANT_ID);
			authActions.setToken(demoToken);
			authActions.login({
				id: 'demo-user-001',
				name: 'Utilisateur Démo',
				email: 'demo@trackly.com',
				plan: 'Starter'
			});

			// Sauvegarder dans userState
			userState.setUser({
				id: 'demo-user-001',
				name: 'Utilisateur Démo',
				email: 'demo@trackly.com'
			});
			userState.setTenant({
				id: DEMO_TENANT_ID,
				name: 'Entreprise Démo'
			});

			console.log('[Demo] Mode démo activé avec tenantId:', DEMO_TENANT_ID);

			// Rediriger vers le dashboard
			await goto('/dashboard');
		} catch (err) {
			error = err instanceof Error ? err.message : "Erreur lors de l'activation du mode démo";
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-6">
	<Card class="w-full max-w-md">
		<CardHeader class="space-y-1">
			<CardTitle class="text-2xl">Connexion à Arrivo</CardTitle>
			<CardDescription>Accède au tableau de bord pour suivre tes tournées.</CardDescription>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="flex gap-2">
					<Button
						type="button"
						variant={mode === 'login' ? 'secondary' : 'ghost'}
						size="sm"
						onclick={() => (mode = 'login')}
						disabled={loading}
					>
						Se connecter
					</Button>
					<Button
						type="button"
						variant={mode === 'register' ? 'secondary' : 'ghost'}
						size="sm"
						onclick={() => (mode = 'register')}
						disabled={loading}
					>
						Créer un compte
					</Button>
				</div>

				{#if error}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}
				{#if createdTenantId && mode === 'register'}
					<Alert class="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
						<AlertTitle>Tenant créé</AlertTitle>
						<AlertDescription>
							<span class="break-all font-mono text-xs">{createdTenantId}</span>
							<br />
							Copie cet ID pour l'app chauffeur si besoin.
						</AlertDescription>
					</Alert>
				{/if}

				<div class="grid gap-4">
					{#if mode === 'register'}
						<div class="space-y-2">
							<Label for="company">Nom de l'entreprise</Label>
							<Input id="company" type="text" bind:value={companyName} placeholder="Atelier Dupont" required />
						</div>
						<div class="space-y-2">
							<Label for="fullname">Nom complet</Label>
							<Input id="fullname" type="text" bind:value={fullName} placeholder="Jean Dupont" required />
						</div>
					{/if}
					<div class="space-y-2">
						<Label for="email">Email</Label>
						<Input id="email" type="email" bind:value={email} placeholder="contact@atelier.fr" required />
					</div>
					<div class="space-y-2">
						<Label for="password">Mot de passe</Label>
						<Input id="password" type="password" bind:value={password} placeholder="********" required />
					</div>
				</div>

				<div class="flex items-center justify-between gap-4">
					<div class="flex items-center gap-2">
						<Checkbox id="remember" bind:checked={remember} />
						<Label for="remember" class="cursor-pointer text-sm font-normal">Se souvenir de moi</Label>
					</div>
					<Button 
						type="button" 
						variant="link" 
						onclick={handleDemoMode} 
						class="h-auto p-0 text-sm"
						disabled={loading}
					>
						Mode demo
					</Button>
				</div>

				<Button type="submit" class="w-full" disabled={loading}>
					{#if loading}
						{mode === 'register' ? 'Création...' : 'Connexion...'}
					{:else}
						{mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
