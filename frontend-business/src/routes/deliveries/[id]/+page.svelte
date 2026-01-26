<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import Map from '$lib/components/Map.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { getDelivery, deleteDelivery } from '$lib/api/deliveries';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import type { ApiDeliveryDetail } from '$lib/api/deliveries';

	let delivery = $state<ApiDeliveryDetail | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let didInit = $state(false);
	let deliveryCoords = $state<{ lat: number; lng: number } | null>(null);
	let geocodingLoading = $state(false);
	let deleting = $state(false);
	let deleteError = $state<string | null>(null);

	const statusClass: Record<string, string> = {
		Pending: 'warning',
		InProgress: 'warning',
		Completed: 'success',
		Failed: 'danger',
		'0': 'warning', // Pending
		'1': 'warning', // InProgress
		'2': 'success', // Completed
		'3': 'danger' // Failed
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

	onMount(() => {
		loadDelivery();
		return () => {
			trackingActions.disconnect();
		};
	});

	// Connecter SignalR seulement une fois quand la livraison est chargée
	$effect(() => {
		if (!delivery || didInit) return;
		didInit = true;
		
		// Connecter SignalR et rejoindre le groupe de livraison
		if (!trackingState.isConnected && !trackingState.isConnecting) {
			trackingActions.connect().then(() => {
				if (trackingState.isConnected && delivery) {
					trackingActions.joinDeliveryGroup(delivery.id);
				}
			}).catch((err) => {
				console.error('[Tracking] Erreur lors de la connexion:', err);
			});
		}
	});

	async function loadDelivery() {
		loading = true;
		error = null;
		try {
			const deliveryId = $page.params.id;
			if (!deliveryId) {
				error = 'ID de livraison manquant';
				return;
			}
			const data = await getDelivery(deliveryId);
			delivery = data;

			// Géocoder l'adresse pour obtenir les coordonnées
			if (data.address) {
				geocodingLoading = true;
				const coords = await geocodeAddressCached(data.address);
				if (coords) {
					deliveryCoords = { lat: coords.lat, lng: coords.lng };
				}
				geocodingLoading = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement de la livraison';
		} finally {
			loading = false;
		}
	}

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
			`Êtes-vous sûr de vouloir supprimer cette livraison ?\n\n` +
			`Client: ${delivery.customerName}\n` +
			`Adresse: ${delivery.address}\n\n` +
			`La commande associée ne sera pas affectée.`
		);

		if (!confirmed) return;

		deleting = true;
		deleteError = null;

		try {
			await deleteDelivery(delivery.id);
			// Rediriger vers la liste des livraisons après suppression
			goto('/deliveries');
		} catch (err) {
			deleteError = err instanceof Error ? err.message : 'Erreur lors de la suppression';
			deleting = false;
		}
	}
</script>

<div class="page">
	<TopNav 
		title={delivery ? `Livraison ${delivery.id.slice(0, 8).toUpperCase()}` : 'Détail Livraison'} 
		subtitle="Détail de la livraison et suivi chauffeur." 
	/>

	{#if loading}
		<section class="panel">
			<div style="padding: 2rem; text-align: center;">Chargement de la livraison...</div>
		</section>
	{:else if error}
		<section class="panel">
			<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px;">
				{error}
			</div>
		</section>
	{:else if delivery}
		<section class="panel">
			<div class="panel-toolbar">
				<div>
					<h2>Informations de livraison</h2>
					<p class="footer-note">
						Crée le {getFormattedDate(delivery.createdAt)}
						{#if delivery.completedAt}
							· Livrée le {getFormattedDate(delivery.completedAt)}
						{/if}
					</p>
				</div>
				<div class="controls">
					<button class="ghost-button" type="button">Partager lien client</button>
					<button class="ghost-button" type="button" onclick={trackingActions.connect}>
						{trackingState.isConnected
							? 'Connecté'
							: trackingState.isConnecting
								? 'Connexion...'
								: 'Activer temps réel'}
					</button>
				</div>
			</div>

			<div class="grid-2-cols" style="margin-bottom: 2rem;">
				<div>
					<h3>Client</h3>
					<p>{delivery.customerName}</p>
				</div>
				<div>
					<h3>Adresse</h3>
					<p>{delivery.address}</p>
				</div>
				<div>
					<h3>Chauffeur</h3>
					<p>{delivery.driverName}</p>
				</div>
				<div>
					<h3>Statut</h3>
					<span class="badge {statusClass[delivery.status] || 'warning'}">
						{statusLabel[delivery.status] || delivery.status}
					</span>
				</div>
			</div>

			{#if deleteError}
				<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-top: 1rem;">
					{deleteError}
				</div>
			{/if}

			<div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e5e7eb;">
				<button
					class="primary-button"
					type="button"
					onclick={handleDelete}
					disabled={deleting}
					style="background: #dc2626; color: white; border: none;"
				>
					{deleting ? 'Suppression...' : 'Supprimer cette livraison'}
				</button>
				<p class="footer-note" style="margin-top: 0.5rem;">
					La suppression est logique (soft delete). La commande associée ne sera pas affectée.
				</p>
			</div>
		</section>

		<section class="panel">
			<div class="panel-header">
				<h2>Carte et position</h2>
				<span class="status-pill">Temps réel</span>
			</div>
			
			{#if geocodingLoading}
				<div style="padding: 2rem; text-align: center; color: #666;">
					Chargement de la carte...
				</div>
			{:else if deliveryCoords}
				<Map
					center={[deliveryCoords.lat, deliveryCoords.lng]}
					zoom={15}
					height="500px"
					deliveryMarkers={[
						{
							lat: deliveryCoords.lat,
							lng: deliveryCoords.lng,
							label: `${delivery.customerName}<br/>${delivery.address}`
						}
					]}
					trackPosition={trackingState.point ? {
						lat: trackingState.point.lat,
						lng: trackingState.point.lng
					} : null}
					followTracking={true}
				/>
				<div style="padding: 1rem; background: #f9fafb; border-radius: 4px; margin-top: 1rem; font-size: 0.875rem;">
					{#if trackingState.point}
						<p><strong>Position chauffeur:</strong> {trackingState.point.lat.toFixed(6)}, {trackingState.point.lng.toFixed(6)}</p>
						<p><strong>Dernière mise à jour:</strong> {new Date(trackingState.point.updatedAt).toLocaleTimeString('fr-FR')}</p>
					{:else if trackingState.isConnected}
						<p style="color: #059669;">✅ Connecté - En attente de position GPS...</p>
					{:else if trackingState.lastError}
						<p style="color: #dc2626;">❌ Erreur: {trackingState.lastError}</p>
					{:else}
						<p style="color: #666;">Cliquez sur "Activer temps réel" pour suivre la position du chauffeur</p>
					{/if}
				</div>
			{:else}
				<div style="padding: 2rem; text-align: center; color: #666;">
					<p>Impossible de charger la carte pour cette adresse.</p>
					<p style="font-size: 0.875rem; margin-top: 0.5rem;">Adresse: {delivery.address}</p>
				</div>
			{/if}
		</section>

		<section class="panel">
			<div class="panel-header">
				<h2>Commande associée</h2>
				<a class="secondary-link" href={`/orders/${delivery.orderId}`}>
					Voir la commande →
				</a>
			</div>
			<div style="padding: 1rem;">
				<p><strong>Référence:</strong> {delivery.orderId.slice(0, 8).toUpperCase()}</p>
				<p><strong>Client:</strong> {delivery.customerName}</p>
				<p><strong>Adresse:</strong> {delivery.address}</p>
			</div>
		</section>
	{/if}
</div>
