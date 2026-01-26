<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { getDelivery, completeDelivery } from '../lib/api/deliveries';
	import { gpsService } from '../lib/services/gps.svelte';
	import { trackingService } from '../lib/services/tracking.svelte';
	import type { ApiDelivery } from '../lib/api/deliveries';

	const dispatch = createEventDispatcher();

	let { driverId = null, deliveryId }: { driverId?: string | null; deliveryId: string } = $props();
	let delivery = $state<ApiDelivery | null>(null);
	let loading = $state(false);
	let completing = $state(false);
	let error = $state<string | null>(null);
	let isTracking = $state(false);

	onMount(() => {
		loadDelivery();
	});

	async function loadDelivery() {
		loading = true;
		error = null;

		try {
			const data = await getDelivery(deliveryId);
			delivery = data;
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

	async function handleComplete() {
		if (!delivery) return;

		if (!confirm('Confirmer la livraison ?')) {
			return;
		}

		completing = true;
		error = null;

		try {
			await completeDelivery(deliveryId);
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
		<div class="card">
			<h2 style="margin-bottom: 1rem;">Livraison {delivery.id.slice(0, 8).toUpperCase()}</h2>
			<p style="margin-bottom: 0.5rem;"><strong>Commande:</strong> {delivery.orderId.slice(0, 8).toUpperCase()}</p>
			<p style="margin-bottom: 0.5rem;"><strong>Statut:</strong> {delivery.status}</p>
			{#if delivery.completedAt}
				<p style="color: var(--text-muted);">
					Livrée le {new Date(delivery.completedAt).toLocaleString('fr-FR')}
				</p>
			{/if}
		</div>

		<div class="card">
			<h3 style="margin-bottom: 1rem;">Géolocalisation</h3>
			{#if gpsService.position}
				<p style="margin-bottom: 0.5rem;">
					<strong>Position:</strong> {gpsService.position.lat.toFixed(6)}, {gpsService.position.lng.toFixed(6)}
				</p>
				<p style="color: var(--text-muted); font-size: 0.875rem;">
					Précision: {gpsService.position.accuracy ? `${Math.round(gpsService.position.accuracy)}m` : 'N/A'}
				</p>
			{:else}
				<p style="color: var(--text-muted);">Position non disponible</p>
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

			{#if trackingService.isConnected}
				<p style="margin-top: 1rem; color: var(--success); font-size: 0.875rem;">
					✅ Connecté au serveur
				</p>
			{/if}
		</div>

		{#if delivery.status.toLowerCase() !== 'completed'}
			<button
				class="btn btn-success"
				onclick={handleComplete}
				disabled={completing}
				style="width: 100%; margin-top: 1rem; font-size: 1.25rem; padding: 1.5rem;"
			>
				{completing ? 'Validation...' : '✅ Valider la livraison'}
			</button>
		{:else}
			<div class="card" style="background: #d1fae5; text-align: center;">
				<p style="color: #065f46; font-weight: 600; font-size: 1.125rem;">
					✅ Livraison complétée
				</p>
			</div>
		{/if}
	{/if}
</div>
