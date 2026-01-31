<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import Map from '$lib/components/Map.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { getDelivery, deleteDelivery } from '$lib/api/deliveries';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import type { ApiDeliveryDetail } from '$lib/api/deliveries';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';

	let delivery = $state<ApiDeliveryDetail | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let didInit = $state(false);
	let deliveryCoords = $state<{ lat: number; lng: number } | null>(null);
	let geocodingLoading = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		Pending: 'secondary',
		InProgress: 'secondary',
		Completed: 'default',
		Failed: 'destructive',
		'0': 'secondary',
		'1': 'secondary',
		'2': 'default',
		'3': 'destructive'
	};

	const statusLabel: Record<string, string> = {
		Pending: 'Prévue',
		InProgress: 'En cours',
		Completed: 'Livrée',
		Failed: 'Échouée',
		'0': 'Prévue',
		'1': 'En cours',
		'2': 'Livrée',
		'3': 'Échouée'
	};

	$effect(() => {
		if (!delivery || didInit) return;
		didInit = true;
		if (!trackingState.isConnected && !trackingState.isConnecting) {
			trackingActions.connect().then(() => {
				if (trackingState.isConnected && delivery) {
					trackingActions.joinDeliveryGroup(delivery.id);
				}
			}).catch((err) => console.error('[Tracking] Erreur:', err));
		}
	});

	async function loadDelivery() {
		loading = true;
		error = null;
		didInit = false;
		const deliveryId = page.params.id;
		try {
			if (!deliveryId) {
				error = 'ID de livraison manquant';
				return;
			}
			const data = await getDelivery(deliveryId);
			delivery = data;
			if (data.address) {
				geocodingLoading = true;
				const coords = await geocodeAddressCached(data.address);
				if (coords) deliveryCoords = { lat: coords.lat, lng: coords.lng };
				geocodingLoading = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement de la livraison';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const id = page.params.id;
		if (!id) return;
		loadDelivery();
		return () => {
			trackingActions.disconnect();
		};
	});

	function getFormattedDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleDelete() {
		if (!delivery) return;
		const confirmed = confirm(
			`Êtes-vous sûr de vouloir supprimer cette livraison ?\n\nClient: ${delivery.customerName}\nAdresse: ${delivery.address}\n\nLa commande associée ne sera pas affectée.`
		);
		if (!confirmed) return;
		deleting = true;
		deleteError = null;
		try {
			await deleteDelivery(delivery.id);
			goto('/deliveries');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
			deleting = false;
		}
	}
</script>

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader
		title={delivery ? `Livraison ${delivery.id.slice(0, 8).toUpperCase()}` : 'Détail Livraison'}
		subtitle="Détail de la livraison et suivi chauffeur."
	/>

		{#if loading}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">
					Chargement de la livraison...
				</CardContent>
			</Card>
		{:else if error}
			<Alert variant="destructive">
				<AlertTitle>Erreur</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{:else if delivery}
			<Card>
				<CardHeader class="flex flex-row flex-wrap items-start justify-between gap-4">
					<div>
						<CardTitle>Informations de livraison</CardTitle>
						<p class="mt-1 text-sm text-muted-foreground">
							Crée le {getFormattedDate(delivery.createdAt)}
							{#if delivery.completedAt}
								· Livrée le {getFormattedDate(delivery.completedAt)}
							{/if}
						</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<Button variant="outline" size="sm">Partager lien client</Button>
						<Button variant="outline" size="sm" onclick={() => trackingActions.connect()}>
							{trackingState.isConnected
								? 'Connecté'
								: trackingState.isConnecting
									? 'Connexion...'
									: 'Activer temps réel'}
						</Button>
					</div>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Client</p>
							<p class="font-medium">{delivery.customerName}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Adresse</p>
							<p class="font-medium">{delivery.address}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Chauffeur</p>
							<p class="font-medium">{delivery.driverName}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Statut</p>
							<Badge variant={statusVariant[delivery.status] ?? 'outline'}>
								{statusLabel[delivery.status] ?? delivery.status}
							</Badge>
						</div>
					</div>

					{#if deleteError}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{deleteError}</AlertDescription>
						</Alert>
					{/if}

					<Separator />

					<div class="space-y-2">
						<Button variant="destructive" size="sm" onclick={handleDelete} disabled={deleting}>
							{deleting ? 'Suppression...' : 'Supprimer cette livraison'}
						</Button>
						<p class="text-xs text-muted-foreground">
							La suppression est logique (soft delete). La commande associée ne sera pas affectée.
						</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle>Carte et position</CardTitle>
					<Badge variant="secondary">Temps réel</Badge>
				</CardHeader>
				<CardContent>
					{#if geocodingLoading}
						<div class="py-8 text-center text-muted-foreground">Chargement de la carte...</div>
					{:else if deliveryCoords}
						<Map
							center={[deliveryCoords.lat, deliveryCoords.lng]}
							zoom={15}
							height="500px"
							deliveryMarkers={[{
								lat: deliveryCoords.lat,
								lng: deliveryCoords.lng,
								label: `${delivery.customerName}<br/>${delivery.address}`
							}]}
							trackPosition={trackingState.point ? { lat: trackingState.point.lat, lng: trackingState.point.lng } : null}
							followTracking={true}
						/>
						<div class="mt-4 rounded-md border bg-muted/50 px-4 py-3 text-sm">
							{#if trackingState.point}
								<p><strong>Position chauffeur:</strong> {trackingState.point.lat.toFixed(6)}, {trackingState.point.lng.toFixed(6)}</p>
								<p><strong>Dernière MAJ:</strong> {new Date(trackingState.point.updatedAt).toLocaleTimeString('fr-FR')}</p>
							{:else if trackingState.isConnected}
								<p class="text-green-600 dark:text-green-400">✅ Connecté – En attente de position GPS...</p>
							{:else if trackingState.lastError}
								<p class="text-destructive">❌ Erreur: {trackingState.lastError}</p>
							{:else}
								<p class="text-muted-foreground">Cliquez sur « Activer temps réel » pour suivre la position du chauffeur.</p>
							{/if}
						</div>
					{:else}
						<div class="py-8 text-center text-muted-foreground">
							<p>Impossible de charger la carte pour cette adresse.</p>
							<p class="mt-1 text-sm">Adresse: {delivery.address}</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0">
					<CardTitle>Commande associée</CardTitle>
					<Button variant="link" href="/orders/{delivery.orderId}" class="h-auto p-0">Voir la commande →</Button>
				</CardHeader>
				<CardContent class="space-y-1 text-sm">
					<p><strong>Référence:</strong> {delivery.orderId.slice(0, 8).toUpperCase()}</p>
					<p><strong>Client:</strong> {delivery.customerName}</p>
					<p><strong>Adresse:</strong> {delivery.address}</p>
				</CardContent>
			</Card>
		{/if}
</div>
