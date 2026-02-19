<script lang="ts">
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Badge } from '$lib/components/ui/badge';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import UserIcon from '@lucide/svelte/icons/user';
	import LockIcon from '@lucide/svelte/icons/lock';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';
	import BellIcon from '@lucide/svelte/icons/bell';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { userState } from '$lib/stores/user.svelte';
	import { settingsState, settingsActions } from '$lib/stores/settings.svelte';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import SearchIcon from '@lucide/svelte/icons/search';

	let activeTab = $state('profile');
	let copiedTenantId = $state(false);

	// Profile form
	let profileForm = $state({
		name: userState.user?.name ?? '',
		email: userState.user?.email ?? '',
		companyName: userState.tenant?.name ?? ''
	});

	// Password form
	let passwordForm = $state({
		currentPassword: '',
		newPassword: '',
		confirmPassword: ''
	});

	let passwordErrors = $state<string[]>([]);
	let passwordSuccess = $state(false);

	// Siège social
	let headquartersForm = $state({
		address: settingsState.headquartersAddress ?? '',
		lat: settingsState.headquarters?.lat?.toString() ?? '',
		lng: settingsState.headquarters?.lng?.toString() ?? ''
	});
	let headquartersSaving = $state(false);
	let headquartersSuccess = $state(false);
	let headquartersError = $state<string | null>(null);

	// Synchroniser le formulaire avec le store à l’ouverture de l’onglet Entreprise
	$effect(() => {
		if (activeTab !== 'entreprise') return;
		headquartersForm = {
			address: settingsState.headquartersAddress ?? '',
			lat: settingsState.headquarters?.lat?.toString() ?? '',
			lng: settingsState.headquarters?.lng?.toString() ?? ''
		};
	});

	async function saveHeadquarters() {
		headquartersError = null;
		const latStr = headquartersForm.lat.replace(',', '.');
		const lngStr = headquartersForm.lng.replace(',', '.');
		const lat = latStr ? parseFloat(latStr) : null;
		const lng = lngStr ? parseFloat(lngStr) : null;
		if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
			headquartersError = 'Latitude entre -90 et 90.';
			return;
		}
		if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
			headquartersError = 'Longitude entre -180 et 180.';
			return;
		}
		if (lat == null && lng == null && !headquartersForm.address?.trim()) {
			headquartersError = 'Saisissez une adresse ou des coordonnées.';
			return;
		}
		headquartersSaving = true;
		try {
			await settingsActions.setHeadquarters({
				address: headquartersForm.address?.trim() || null,
				lat: lat ?? undefined,
				lng: lng ?? undefined
			});
			headquartersSuccess = true;
			setTimeout(() => (headquartersSuccess = false), 3000);
		} catch (e) {
			headquartersError = e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement.';
		} finally {
			headquartersSaving = false;
		}
	}

	async function searchAddress() {
		const address = headquartersForm.address?.trim();
		if (!address) {
			headquartersError = 'Saisissez une adresse à rechercher.';
			return;
		}
		headquartersError = null;
		headquartersSaving = true;
		try {
			const result = await geocodeAddressCached(address);
			if (!result) {
				headquartersError = 'Adresse introuvable. Essayez avec une formulation plus précise.';
				return;
			}
			headquartersForm = {
				address: result.displayName,
				lat: result.lat.toFixed(6),
				lng: result.lng.toFixed(6)
			};
			await settingsActions.setHeadquarters({
				address: result.displayName,
				lat: result.lat,
				lng: result.lng
			});
			headquartersSuccess = true;
			setTimeout(() => (headquartersSuccess = false), 3000);
		} catch (e) {
			headquartersError = e instanceof Error ? e.message : 'Erreur lors de la recherche.';
		} finally {
			headquartersSaving = false;
		}
	}

	async function clearHeadquarters() {
		headquartersError = null;
		headquartersSaving = true;
		try {
			await settingsActions.clearHeadquarters();
			headquartersForm = { address: '', lat: '', lng: '' };
		} finally {
			headquartersSaving = false;
		}
	}

	async function useMyPosition() {
		if (!navigator.geolocation) {
			headquartersError = 'La géolocalisation n\'est pas disponible.';
			return;
		}
		headquartersSaving = true;
		headquartersError = null;
		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					headquartersForm = {
						address: headquartersForm.address,
						lat: pos.coords.latitude.toFixed(6),
						lng: pos.coords.longitude.toFixed(6)
					};
					await settingsActions.setHeadquarters({
						address: headquartersForm.address || null,
						lat: pos.coords.latitude,
						lng: pos.coords.longitude
					});
					headquartersSuccess = true;
					setTimeout(() => (headquartersSuccess = false), 3000);
				} finally {
					headquartersSaving = false;
				}
			},
			() => {
				headquartersError = 'Impossible d\'obtenir votre position.';
				headquartersSaving = false;
			}
		);
	}

	function copyTenantId() {
		if (userState.tenant?.id) {
			navigator.clipboard.writeText(userState.tenant.id);
			copiedTenantId = true;
			setTimeout(() => copiedTenantId = false, 2000);
		}
	}

	function validatePassword(): boolean {
		passwordErrors = [];
		
		if (passwordForm.newPassword.length < 8) {
			passwordErrors.push('Le mot de passe doit contenir au moins 8 caractères');
		}
		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			passwordErrors.push('Les mots de passe ne correspondent pas');
		}
		
		return passwordErrors.length === 0;
	}

	async function updatePassword() {
		if (!validatePassword()) return;
		
		// TODO: API call to update password
		passwordSuccess = true;
		passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
		setTimeout(() => passwordSuccess = false, 3000);
	}

	async function updateProfile() {
		// TODO: API call to update profile
	}
</script>

<div class="container mx-auto max-w-4xl py-6 space-y-6">
	<PageHeader 
		title="Paramètres" 
		subtitle="Gérez votre compte, votre entreprise et vos préférences."
		icon={SettingsIcon}
	/>

	<Tabs bind:value={activeTab} class="w-full">
		<TabsList class="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 lg:w-auto">
			<TabsTrigger value="profile" class="gap-2">
				<UserIcon class="size-4" />
				<span class="hidden sm:inline">Compte</span>
			</TabsTrigger>
			<TabsTrigger value="entreprise" class="gap-2">
				<Building2Icon class="size-4" />
				<span class="hidden sm:inline">Entreprise</span>
			</TabsTrigger>
			<TabsTrigger value="security" class="gap-2">
				<LockIcon class="size-4" />
				<span class="hidden sm:inline">Sécurité</span>
			</TabsTrigger>
			<TabsTrigger value="billing" class="gap-2">
				<CreditCardIcon class="size-4" />
				<span class="hidden sm:inline">Abonnement</span>
			</TabsTrigger>
			<TabsTrigger value="notifications" class="gap-2">
				<BellIcon class="size-4" />
				<span class="hidden sm:inline">Notifications</span>
			</TabsTrigger>
		</TabsList>

		<!-- Profile Tab -->
		<TabsContent value="profile" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<UserIcon class="size-5" />
						Informations du compte
					</CardTitle>
					<CardDescription>
						Modifiez vos informations personnelles et celles de votre entreprise.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Personal Info -->
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-muted-foreground">Informations personnelles</h3>
						
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="name">Nom complet</Label>
								<Input 
									id="name" 
									bind:value={profileForm.name}
									placeholder="Votre nom"
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="email">Email</Label>
								<Input 
									id="email" 
									type="email"
									bind:value={profileForm.email}
									placeholder="votre@email.com"
								/>
							</div>
						</div>
					</div>

					<Separator />

					<!-- Company Info -->
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-muted-foreground">Entreprise</h3>
						
						<div class="space-y-2">
							<Label for="company">Nom de l'entreprise</Label>
							<Input 
								id="company" 
								bind:value={profileForm.companyName}
								placeholder="Nom de votre entreprise"
							/>
						</div>
					</div>

					<Separator />

					<!-- Tenant ID (Read-only) -->
					<div class="space-y-2">
						<Label>Tenant ID</Label>
						<div class="flex items-center gap-2">
							<code class="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
								{userState.tenant?.id ?? 'Non disponible'}
							</code>
							<Button 
								variant="outline" 
								size="icon"
								onclick={copyTenantId}
								title="Copier le Tenant ID"
							>
								{#if copiedTenantId}
									<CheckIcon class="size-4 text-green-500" />
								{:else}
									<CopyIcon class="size-4" />
								{/if}
							</Button>
						</div>
						<p class="text-xs text-muted-foreground">
							Utilisé pour configurer l'application chauffeur. À ne pas partager.
						</p>
					</div>

					<div class="flex justify-end">
						<Button onclick={updateProfile}>
							Enregistrer les modifications
						</Button>
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Entreprise Tab -->
		<TabsContent value="entreprise" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Building2Icon class="size-5" />
						Siège social
					</CardTitle>
					<CardDescription>
						Position de votre siège social sur la carte. Utilisée pour les zones de livraison (isochrones) et la planification des tournées.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-4">
						<div class="space-y-2">
							<Label for="hq-address">Adresse</Label>
							<Input
								id="hq-address"
								type="text"
								placeholder="ex. 1 place de la Comédie, Montpellier"
								bind:value={headquartersForm.address}
							/>
							<p class="text-muted-foreground text-xs">Saisissez une adresse puis cliquez sur « Rechercher l'adresse » pour remplir les coordonnées.</p>
						</div>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="hq-lat">Latitude</Label>
								<Input
									id="hq-lat"
									type="text"
									inputmode="decimal"
									placeholder="ex. 43.6108"
									bind:value={headquartersForm.lat}
								/>
							</div>
							<div class="space-y-2">
								<Label for="hq-lng">Longitude</Label>
								<Input
									id="hq-lng"
									type="text"
									inputmode="decimal"
									placeholder="ex. 3.8767"
									bind:value={headquartersForm.lng}
								/>
							</div>
						</div>
						{#if headquartersError}
							<p class="text-sm text-destructive">{headquartersError}</p>
						{/if}
						{#if headquartersSuccess}
							<p class="text-sm text-green-600">Siège social enregistré côté serveur. Il apparaît sur la carte.</p>
						{/if}
						<div class="flex flex-wrap gap-2">
							<Button onclick={searchAddress} disabled={headquartersSaving}>
								<SearchIcon class="size-4 mr-2" />
								Rechercher l'adresse
							</Button>
							<Button variant="outline" onclick={saveHeadquarters} disabled={headquartersSaving}>
								{headquartersSaving ? 'Enregistrement…' : 'Enregistrer'}
							</Button>
							<Button variant="outline" onclick={useMyPosition} disabled={headquartersSaving}>
								<MapPinIcon class="size-4 mr-2" />
								Utiliser ma position
							</Button>
							{#if settingsState.headquarters || settingsState.headquartersAddress}
								<Button variant="ghost" onclick={clearHeadquarters}>
									Effacer
								</Button>
							{/if}
						</div>
					</div>
					{#if settingsState.headquarters || settingsState.headquartersAddress}
						<p class="text-muted-foreground text-sm">
							{#if settingsState.headquartersAddress}
								{settingsState.headquartersAddress}
								{#if settingsState.headquarters}
									<br />Coordonnées : {settingsState.headquarters.lat.toFixed(5)}, {settingsState.headquarters.lng.toFixed(5)}
								{/if}
							{:else if settingsState.headquarters}
								Coordonnées : {settingsState.headquarters.lat.toFixed(5)}, {settingsState.headquarters.lng.toFixed(5)}
							{/if}
						</p>
					{/if}
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Security Tab -->
		<TabsContent value="security" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<LockIcon class="size-5" />
						Sécurité
					</CardTitle>
					<CardDescription>
						Modifiez votre mot de passe et sécurisez votre compte.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-4">
						<h3 class="text-sm font-medium text-muted-foreground">Changer le mot de passe</h3>
						
						<div class="space-y-4 max-w-md">
							<div class="space-y-2">
								<Label for="current-password">Mot de passe actuel</Label>
								<Input 
									id="current-password" 
									type="password"
									bind:value={passwordForm.currentPassword}
									placeholder="••••••••"
								/>
							</div>
							
							<div class="space-y-2">
								<Label for="new-password">Nouveau mot de passe</Label>
								<Input 
									id="new-password" 
									type="password"
									bind:value={passwordForm.newPassword}
									placeholder="••••••••"
								/>
								<p class="text-xs text-muted-foreground">
									Minimum 8 caractères
								</p>
							</div>
							
							<div class="space-y-2">
								<Label for="confirm-password">Confirmer le mot de passe</Label>
								<Input 
									id="confirm-password" 
									type="password"
									bind:value={passwordForm.confirmPassword}
									placeholder="••••••••"
								/>
							</div>

							{#if passwordErrors.length > 0}
								<div class="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									<ul class="list-disc list-inside space-y-1">
										{#each passwordErrors as error}
											<li>{error}</li>
										{/each}
									</ul>
								</div>
							{/if}

							{#if passwordSuccess}
								<div class="rounded-md bg-green-500/10 p-3 text-sm text-green-600">
									Mot de passe mis à jour avec succès !
								</div>
							{/if}

							<Button onclick={updatePassword} class="w-full">
								Mettre à jour le mot de passe
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Billing Tab -->
		<TabsContent value="billing" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<CreditCardIcon class="size-5" />
						Abonnement
					</CardTitle>
					<CardDescription>
						Gérez votre plan et vos paiements.
					</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex items-center justify-between rounded-lg border p-4">
						<div>
							<h3 class="font-semibold">Plan Starter</h3>
							<p class="text-sm text-muted-foreground">Gratuit</p>
						</div>
						<Badge>Actif</Badge>
					</div>

					<div class="space-y-2">
						<h3 class="text-sm font-medium">Inclus dans votre plan</h3>
						<ul class="text-sm text-muted-foreground space-y-1">
							<li>✓ Jusqu'à 20 livraisons par mois</li>
							<li>✓ 3 livreurs maximum</li>
							<li>✓ Suivi GPS en temps réel</li>
						</ul>
					</div>

					<Button variant="outline" class="w-full">
						Passer à Pro (20€/mois)
					</Button>
				</CardContent>
			</Card>
		</TabsContent>

		<!-- Notifications Tab -->
		<TabsContent value="notifications" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<BellIcon class="size-5" />
						Notifications
					</CardTitle>
					<CardDescription>
						Configurez vos préférences de notification.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p class="text-sm text-muted-foreground">
						Les paramètres de notification seront disponibles prochainement.
					</p>
				</CardContent>
			</Card>
		</TabsContent>
	</Tabs>
</div>
