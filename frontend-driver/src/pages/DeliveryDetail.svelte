<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { getDelivery, startDelivery, completeDelivery } from '../lib/api/deliveries';
	import { getRoute } from '../lib/api/routes';
	import { gpsService } from '../lib/services/gps.svelte';
	import { trackingService } from '../lib/services/tracking.svelte';
	import Map from '../lib/components/Map.svelte';
	import { geocodeAddressCached } from '../lib/utils/geocoding';
	import type { ApiDeliveryDetail } from '../lib/api/deliveries';
	import type { ApiRouteDetail } from '../lib/api/routes';

	const dispatch = createEventDispatcher();

	let { driverId: _driverId = null, deliveryId }: { driverId?: string | null; deliveryId: string } = $props();
	let delivery = $state<ApiDeliveryDetail | null>(null);
	let routeDetail = $state<ApiRouteDetail | null>(null);
	let loading = $state(false);
	let completing = $state(false);
	let error = $state<string | null>(null);
	let isTracking = $state(false);
	let destinationCoords = $state<{ lat: number; lng: number } | null>(null);
	let geocodingLoading = $state(false);

	const routeProgress = $derived(routeDetail ? {
		completed: routeDetail.deliveries.filter(d => d.status === 'Completed' || d.status === 'Livree').length,
		total: routeDetail.deliveries.length,
		currentIndex: delivery ? routeDetail.deliveries.findIndex(d => d.id === delivery!.id) + 1 : 0
	} : null);

	onMount(() => {
		loadDelivery();
	});

	async function loadDelivery() {
		loading = true;
		error = null;

		try {
			const data = await getDelivery(deliveryId);
			delivery = data;

			if (data.routeId) {
				try {
					routeDetail = await getRoute(data.routeId);
				} catch {
					routeDetail = null;
				}
			} else {
				routeDetail = null;
			}

			// Géocoder l'adresse pour obtenir les coordonnées
			if (data.address) {
				geocodingLoading = true;
				const coords = await geocodeAddressCached(data.address);
				if (coords) {
					destinationCoords = { lat: coords.lat, lng: coords.lng };
				}
				geocodingLoading = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement';
		} finally {
			loading = false;
		}
	}

	let trackingInterval: ReturnType<typeof setInterval> | null = null;

	async function startTracking() {
		if (!delivery) return;

		try {
			// Passe la livraison en "en cours" côté backend (pour que la carte business affiche la tournée)
			await startDelivery(deliveryId);
			await loadDelivery(); // Rafraîchit le détail pour afficher le statut "En cours"
			await gpsService.start();
			await trackingService.connect(deliveryId);
			isTracking = true;

			// Envoyer la position toutes les 5 secondes
			trackingInterval = setInterval(async () => {
				const position = gpsService.position;
				if (position && trackingService.isConnected) {
					await trackingService.updateLocation(deliveryId, position.lat, position.lng);
				}
			}, 5000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur de géolocalisation';
		}
	}

	async function stopTracking() {
		if (trackingInterval) {
			clearInterval(trackingInterval);
			trackingInterval = null;
		}
		await gpsService.stop();
		await trackingService.disconnect();
		isTracking = false;
	}

	async function handleComplete(success: boolean) {
		if (!delivery) return;

		const action = success ? 'livraison' : 'échec';
		if (!confirm(`Confirmer ${action} ?`)) {
			return;
		}

		// Feedback haptique si disponible
		if (navigator.vibrate) {
			navigator.vibrate(50);
		}

		completing = true;
		error = null;

		try {
			await completeDelivery(deliveryId, success);
			await stopTracking();
			// Retour à la liste
			dispatch('back');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la validation';
		} finally {
			completing = false;
		}
	}
</script>

<div class="container">
	<div class="header">
		<button
			onclick={() => dispatch('back')}
			style="background: none; border: none; font-size: 1.5rem; cursor: pointer; position: absolute; left: 1rem;"
		>
			←
		</button>
		<h1>Détail Livraison</h1>
	</div>

	{#if loading}
		<div class="loading">Chargement...</div>
	{:else if error}
		<div class="error">{error}</div>
		<button class="btn btn-primary" onclick={loadDelivery} style="width: 100%; margin-top: 1rem;">
			Réessayer
		</button>
	{:else if delivery}
		{#if routeProgress}
			<div class="card" style="margin-bottom: 1rem; padding: 1rem 1.25rem;">
				<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
					<span style="font-size: 0.875rem; color: var(--text-muted);">Tournée</span>
					<span style="font-size: 0.875rem; font-weight: 600; color: var(--primary);">{routeProgress.completed} / {routeProgress.total} livrées</span>
				</div>
				<div style="height: 8px; background: var(--border); border-radius: 4px; overflow: hidden;">
					<div style="height: 100%; width: {routeProgress.total > 0 ? Math.round((routeProgress.completed / routeProgress.total) * 100) : 0}%; background: var(--primary); border-radius: 4px; transition: width 0.3s;"></div>
				</div>
				{#if routeProgress.currentIndex > 0}
					<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">Arrêt {routeProgress.currentIndex} sur {routeProgress.total}</p>
				{/if}
			</div>
		{/if}
		<div class="card">
			<h2 style="margin-bottom: 1rem;">
				{#if delivery.sequence != null && delivery.routeId}
					Arrêt {delivery.sequence + 1}
					{#if routeProgress} / {routeProgress.total}{/if}
					—
				{/if}
				Livraison {delivery.id.slice(0, 8).toUpperCase()}
			</h2>
			<p style="margin-bottom: 0.5rem;"><strong>Commande:</strong> {delivery.orderId.slice(0, 8).toUpperCase()}</p>
			<p style="margin-bottom: 0.5rem;"><strong>Statut:</strong> {delivery.status}</p>
			{#if delivery.completedAt}
				<p style="color: var(--text-muted);">
					Livrée le {new Date(delivery.completedAt).toLocaleString('fr-FR')}
				</p>
			{/if}
		</div>

		<div class="card">
			<h3 style="margin-bottom: 1rem;">Carte et navigation</h3>
			
			{#if geocodingLoading}
				<div style="padding: 2rem; text-align: center; color: var(--text-muted);">
					Chargement de la carte...
				</div>
			{:else if destinationCoords}
				<Map
					center={[destinationCoords.lat, destinationCoords.lng]}
					zoom={15}
					height="400px"
					destination={{
						lat: destinationCoords.lat,
						lng: destinationCoords.lng,
						label: `${delivery.customerName}<br/>${delivery.address}`
					}}
					currentPosition={gpsService.position ? {
						lat: gpsService.position.lat,
						lng: gpsService.position.lng,
						...(gpsService.position.accuracy != null && { accuracy: gpsService.position.accuracy })
					} : null}
					followPosition={isTracking}
				/>
			{:else}
				<div style="padding: 2rem; text-align: center; color: var(--text-muted);">
					<p>Impossible de charger la carte pour cette adresse.</p>
					<p style="font-size: 0.875rem; margin-top: 0.5rem;">Adresse: {delivery.address}</p>
				</div>
			{/if}

			<div style="margin-top: 1.5rem; display: flex; gap: 1rem;">
				{#if !isTracking}
					<button class="btn btn-primary" onclick={startTracking} style="flex: 1;">
						📍 Démarrer suivi
					</button>
				{:else}
					<button class="btn btn-danger" onclick={stopTracking} style="flex: 1;">
						⏹️ Arrêter suivi
					</button>
				{/if}
			</div>

			{#if gpsService.position}
				<div style="margin-top: 1rem; padding: 0.75rem; background: #f3f4f6; border-radius: 4px; font-size: 0.875rem;">
					<p style="margin-bottom: 0.25rem;">
						<strong>Position actuelle:</strong> {gpsService.position.lat.toFixed(6)}, {gpsService.position.lng.toFixed(6)}
					</p>
					<p style="color: var(--text-muted);">
						Précision: {gpsService.position.accuracy ? `${Math.round(gpsService.position.accuracy)}m` : 'N/A'}
					</p>
				</div>
			{/if}

			{#if trackingService.isConnected}
				<p style="margin-top: 1rem; color: var(--success); font-size: 0.875rem;">
					✅ Connecté au serveur
				</p>
			{/if}
		</div>

		{#if delivery.status.toLowerCase() !== 'completed'}
			<div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
				<button
					class="btn btn-success"
					onclick={() => handleComplete(true)}
					disabled={completing}
					style="flex: 1; font-size: 1.125rem; padding: 1.5rem 0.5rem; min-height: 80px;"
				>
					{completing ? '...' : '✅\nLivrée'}
				</button>
				<button
					class="btn btn-danger"
					onclick={() => handleComplete(false)}
					disabled={completing}
					style="flex: 1; font-size: 1.125rem; padding: 1.5rem 0.5rem; min-height: 80px;"
				>
					{completing ? '...' : '❌\nNon livrée'}
				</button>
			</div>
			<p style="text-align: center; margin-top: 0.75rem; color: var(--text-muted); font-size: 0.875rem;">
				Appuyez longuement pour confirmer
			</p>
		{:else}
			<div class="card" style="background: #d1fae5; text-align: center;">
				<p style="color: #065f46; font-weight: 600; font-size: 1.125rem;">
					✅ Livraison complétée
				</p>
			</div>
		{/if}
	{/if}
</div>
