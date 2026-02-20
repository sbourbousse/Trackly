<script lang="ts">
	import { goto } from '$app/navigation';
	import { authActions } from '$lib/stores/auth.svelte';
	import { userState } from '$lib/stores/user.svelte';
	import { settingsActions } from '$lib/stores/settings.svelte';
	import { loginAccount, registerAccount, clearAuthCache } from '$lib/api/client';
	import { setAuthCookie } from '$lib/auth-cookie';
	import { setOfflineModeReactive } from '$lib/stores/offline.svelte';
	import { DEMO_TENANT_ID } from '$lib/offline/mockData';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CheckIcon from '@lucide/svelte/icons/check';

	type Mode = 'login' | 'register';

	const REGISTER_STEPS = [
		{ key: 'compte', label: 'Compte' },
		{ key: 'siege', label: 'Siège social' }
	] as const;

	let mode = $state<Mode>('login');
	let registerStep = $state(0);
	let companyName = $state('');
	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let remember = $state(true);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let createdTenantId = $state<string | null>(null);

	// Formulaire siège social (étape 2)
	let hqAddress = $state('');
	let hqLat = $state('');
	let hqLng = $state('');
	let hqSaving = $state(false);
	let hqError = $state<string | null>(null);

	function resetRegisterFlow() {
		registerStep = 0;
		createdTenantId = null;
		hqAddress = '';
		hqLat = '';
		hqLng = '';
		hqError = null;
	}

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
			// Invalider le cache in-memory du client API pour que X-Tenant-Id soit le nouveau
			clearAuthCache();

			authActions.setTenantId(response.tenantId);
			authActions.setToken(response.token);
			authActions.login({
				id: response.userId,
				name: response.name,
				email: response.email,
				plan: 'Starter'
			});

			userState.setUser({
				id: response.userId,
				name: response.name,
				email: response.email
			});
			userState.setTenant({
				id: response.tenantId,
				name: companyName || 'Mon Entreprise'
			});

			if (mode === 'register') {
				createdTenantId = response.tenantId;
				registerStep = 1;
			} else {
				await goto('/dashboard');
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Erreur d'authentification";
		} finally {
			loading = false;
		}
	}

	async function handleHqSearch() {
		const address = hqAddress.trim();
		if (!address) {
			hqError = "Saisissez une adresse à rechercher.";
			return;
		}
		hqError = null;
		hqSaving = true;
		try {
			const result = await geocodeAddressCached(address);
			if (!result) {
				hqError = "Adresse introuvable. Essayez une formulation plus précise.";
				return;
			}
			hqAddress = result.displayName;
			hqLat = result.lat.toFixed(6);
			hqLng = result.lng.toFixed(6);
		} catch (e) {
			hqError = e instanceof Error ? e.message : "Erreur lors de la recherche.";
		} finally {
			hqSaving = false;
		}
	}

	async function handleHqUseMyPosition() {
		if (!navigator.geolocation) {
			hqError = "La géolocalisation n'est pas disponible.";
			return;
		}
		hqError = null;
		hqSaving = true;
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				hqLat = pos.coords.latitude.toFixed(6);
				hqLng = pos.coords.longitude.toFixed(6);
				hqSaving = false;
			},
			() => {
				hqError = "Impossible d'obtenir votre position.";
				hqSaving = false;
			}
		);
	}

	async function handleHqSaveAndContinue() {
		const latStr = hqLat.replace(',', '.');
		const lngStr = hqLng.replace(',', '.');
		const lat = latStr ? parseFloat(latStr) : null;
		const lng = lngStr ? parseFloat(lngStr) : null;
		if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			hqError = "Saisissez des coordonnées valides ou utilisez « Rechercher l'adresse » / « Ma position ».";
			return;
		}
		hqError = null;
		hqSaving = true;
		try {
			await settingsActions.setHeadquarters({
				address: hqAddress.trim() || null,
				lat,
				lng
			});
			await goto('/dashboard');
		} catch (e) {
			hqError = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
		} finally {
			hqSaving = false;
		}
	}

	async function handleHqSkip() {
		await goto('/dashboard');
	}

	async function handleDemoMode() {
		loading = true;
		try {
			setOfflineModeReactive(true);
			const demoToken = 'demo-token-' + Date.now();
			localStorage.setItem('trackly_auth_token', demoToken);
			localStorage.setItem('trackly_tenant_id', DEMO_TENANT_ID);
			setAuthCookie(demoToken, true);
			authActions.setTenantId(DEMO_TENANT_ID);
			authActions.setToken(demoToken);
			authActions.login({
				id: 'demo-user-001',
				name: 'Utilisateur Démo',
				email: 'demo@trackly.com',
				plan: 'Starter'
			});
			userState.setUser({
				id: 'demo-user-001',
				name: 'Utilisateur Démo',
				email: 'demo@trackly.com'
			});
			userState.setTenant({
				id: DEMO_TENANT_ID,
				name: 'Entreprise Démo'
			});
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
			{#if mode === 'register'}
				<div class="flex items-center gap-2 pt-3" role="list" aria-label="Étapes d'inscription">
					{#each REGISTER_STEPS as step, i}
						<div class="flex items-center gap-1.5">
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors {registerStep >= i ? 'border-primary bg-primary text-primary-foreground' : 'border-muted text-muted-foreground'} {registerStep < i ? 'bg-muted/30' : ''}"
							>
								{#if registerStep > i}
									<CheckIcon class="size-4" />
								{:else}
									{i + 1}
								{/if}
							</div>
							<span
								class="text-sm font-medium"
								class:text-foreground={registerStep === i}
								class:text-muted-foreground={registerStep !== i}
							>
								{step.label}
							</span>
						</div>
						{#if i < REGISTER_STEPS.length - 1}
							<div
								class="h-0.5 w-6 shrink-0 rounded"
								class:bg-primary={registerStep > i}
								class:bg-muted={registerStep <= i}
							></div>
						{/if}
					{/each}
				</div>
			{/if}
		</CardHeader>
		<CardContent>
			{#if mode === 'register' && registerStep === 1}
				<!-- Étape 2 : Siège social -->
				<div class="space-y-4">
					<p class="text-muted-foreground text-sm">
						Compte créé. Configurez la position de votre siège social pour générer les zones de livraison (isochrones 10, 20 et 30 min). Vous pourrez modifier cela plus tard dans les paramètres.
					</p>
					<div class="space-y-2">
						<Label for="hq-address">Adresse</Label>
						<Input
							id="hq-address"
							type="text"
							placeholder="ex. 1 place de la Comédie, Montpellier"
							bind:value={hqAddress}
						/>
					</div>
					<div class="grid gap-4 grid-cols-2">
						<div class="space-y-2">
							<Label for="hq-lat">Latitude</Label>
							<Input id="hq-lat" type="text" inputmode="decimal" placeholder="43.6108" bind:value={hqLat} />
						</div>
						<div class="space-y-2">
							<Label for="hq-lng">Longitude</Label>
							<Input id="hq-lng" type="text" inputmode="decimal" placeholder="3.8767" bind:value={hqLng} />
						</div>
					</div>
					{#if hqError}
						<p class="text-sm text-destructive">{hqError}</p>
					{/if}
					<div class="flex flex-wrap gap-2">
						<Button type="button" onclick={handleHqSearch} disabled={hqSaving}>
							<SearchIcon class="size-4 mr-2" />
							Rechercher l'adresse
						</Button>
						<Button type="button" variant="outline" onclick={handleHqUseMyPosition} disabled={hqSaving}>
							<MapPinIcon class="size-4 mr-2" />
							Ma position
						</Button>
					</div>
					<div class="flex gap-2 pt-2">
						<Button class="flex-1" onclick={handleHqSaveAndContinue} disabled={hqSaving}>
							{hqSaving ? 'Enregistrement…' : 'Enregistrer et continuer'}
						</Button>
						<Button type="button" variant="outline" onclick={handleHqSkip} disabled={hqSaving}>
							Passer
						</Button>
					</div>
				</div>
			{:else}
				<!-- Connexion ou Étape 1 : Compte -->
				<form onsubmit={handleSubmit} class="space-y-4">
					<div class="flex gap-2">
						<Button
							type="button"
							variant={mode === 'login' ? 'secondary' : 'ghost'}
							size="sm"
							onclick={() => { mode = 'login'; resetRegisterFlow(); }}
							disabled={loading}
						>
							Se connecter
						</Button>
						<Button
							type="button"
							variant={mode === 'register' ? 'secondary' : 'ghost'}
							size="sm"
							onclick={() => { mode = 'register'; resetRegisterFlow(); }}
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
							{mode === 'register' ? 'Création…' : 'Connexion…'}
						{:else}
							{mode === 'register' ? 'Créer mon compte' : 'Se connecter'}
						{/if}
					</Button>
				</form>
			{/if}
		</CardContent>
	</Card>
</div>
