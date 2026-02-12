<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RouteProgressBar from '$lib/components/RouteProgressBar.svelte';
	import Map from '$lib/components/Map.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import { getRoute, reorderRouteDeliveries } from '$lib/api/routes';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import type { ApiRouteDetail, ApiDeliveryInRoute } from '$lib/api/routes';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import PackageIcon from '@lucide/svelte/icons/package';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	let routeDetail = $state<ApiRouteDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let reordering = $state(false);
	let reorderError = $state<string | null>(null);
	let deliveryCoords = $state<Record<string, { lat: number; lng: number }>>({});
	let inProgressDeliveryId = $state<string | null>(null);
	let didInitTracking = $state(false);

	const completedCount = $derived(
		routeDetail?.deliveries.filter((d) => d.status === 'Completed' || d.status === 'Livree').length ?? 0
	);
	const totalCount = $derived(routeDetail?.deliveries.length ?? 0);

	$effect(() => {
		const routeId = page.params.routeId;
		if (!routeId) return;
		loadRoute();
	});

	$effect(() => {
		if (!routeDetail || didInitTracking) return;
		const inProgress = routeDetail.deliveries.find(
			(d) => d.status === 'InProgress' || d.status === 'En cours'
		);
		if (inProgress && !trackingState.isConnected && !trackingState.isConnecting) {
			didInitTracking = true;
			trackingActions.connect().then(() => {
				if (trackingState.isConnected) {
					trackingActions.joinDeliveryGroup(inProgress.id);
					inProgressDeliveryId = inProgress.id;
				}
			}).catch((err) => console.error('[Tracking] Erreur:', err));
		}
	});

	async function loadRoute() {
		const routeId = page.params.routeId;
		if (!routeId) return;
		loading = true;
		error = null;
		didInitTracking = false;
		inProgressDeliveryId = null;
		try {
			routeDetail = await getRoute(routeId);
			// Géocodage léger pour la carte (optionnel)
			for (const d of routeDetail.deliveries) {
				if (d.address && !deliveryCoords[d.id]) {
					geocodeAddressCached(d.address).then((coords) => {
						if (coords) deliveryCoords = { ...deliveryCoords, [d.id]: coords };
					});
				}
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement de la tournée';
		} finally {
			loading = false;
		}
	}

	function formatRouteDate(iso: string) {
		return new Date(iso).toLocaleDateString('fr-FR', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function routeDisplayName() {
		if (!routeDetail) return 'Détail tournée';
		if (routeDetail.name?.trim()) return routeDetail.name.trim();
		return `Tournée du ${formatRouteDate(routeDetail.createdAt)}`;
	}

	async function moveUp(index: number) {
		if (!routeDetail || index <= 0) return;
		const ids = [...routeDetail.deliveries.map((d) => d.id)];
		[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
		await applyReorder(ids);
	}

	async function moveDown(index: number) {
		if (!routeDetail || index >= routeDetail.deliveries.length - 1) return;
		const ids = [...routeDetail.deliveries.map((d) => d.id)];
		[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
		await applyReorder(ids);
	}

	async function applyReorder(deliveryIds: string[]) {
		if (!routeDetail) return;
		reordering = true;
		reorderError = null;
		try {
			await reorderRouteDeliveries(routeDetail.id, deliveryIds);
			await loadRoute();
		} catch (err) {
			reorderError = err instanceof Error ? err.message : 'Erreur lors du réordonnancement';
		} finally {
			reordering = false;
		}
	}
</script>

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader
		title={routeDetail ? routeDisplayName() : 'Détail tournée'}
		subtitle="Progression, livraisons ordonnées et suivi chauffeur."
	/>

	{#if loading}
		<Card>
			<CardContent class="py-8 text-center text-muted-foreground">
				Chargement de la tournée...
			</CardContent>
		</Card>
	{:else if error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
		<Button variant="outline" href="/deliveries/routes">Retour aux tournées</Button>
	{:else if routeDetail}
		<Card>
			<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
				<div>
					<CardTitle>Progression</CardTitle>
					<p class="mt-1 text-sm text-muted-foreground">
						{routeDetail.driverName} · {formatRouteDate(routeDetail.createdAt)}
					</p>
				</div>
				<Button variant="outline" size="sm" href="/deliveries?routeId={routeDetail.id}">
					Voir les livraisons (liste)
				</Button>
			</CardHeader>
			<CardContent>
				<RouteProgressBar
					completedCount={completedCount}
					totalCount={totalCount}
					subLabel={inProgressDeliveryId ? 'Position chauffeur en direct ci-dessous.' : undefined}
				/>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<PackageIcon class="size-4 text-muted-foreground" />
					Livraisons ({routeDetail.deliveries.length})
				</CardTitle>
				<p class="text-sm text-muted-foreground">
					Ordre des arrêts. Utilisez les flèches pour réorganiser.
				</p>
			</CardHeader>
			<CardContent>
				{#if reorderError}
					<Alert variant="destructive" class="mb-4">
						<AlertDescription>{reorderError}</AlertDescription>
					</Alert>
				{/if}
				{#if routeDetail.deliveries.length === 0}
					<div class="py-6 text-center text-sm text-muted-foreground">
						Aucune livraison dans cette tournée.
					</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead class="w-20">Ordre</TableHead>
									<TableHead>Statut</TableHead>
									<TableHead>Client</TableHead>
									<TableHead class="max-w-[200px] truncate">Adresse</TableHead>
									<TableHead class="w-24 text-right"></TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each routeDetail.deliveries as delivery, index}
									<TableRow>
										<TableCell class="tabular-nums font-medium">{index + 1}</TableCell>
										<TableCell>
											<StatusBadge type="delivery" status={delivery.status} />
										</TableCell>
										<TableCell>
											<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
												{delivery.customerName}
											</Button>
										</TableCell>
										<TableCell class="max-w-[200px] truncate text-muted-foreground">
											{delivery.address}
										</TableCell>
										<TableCell class="text-right">
											<div class="flex justify-end gap-0.5">
												<Button
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => moveUp(index)}
													disabled={reordering || index === 0}
													aria-label="Monter"
												>
													<ChevronUpIcon class="size-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													class="size-8"
													onclick={() => moveDown(index)}
													disabled={reordering || index === routeDetail!.deliveries.length - 1}
													aria-label="Descendre"
												>
													<ChevronDownIcon class="size-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>

		{#if inProgressDeliveryId && (trackingState.point || trackingState.isConnected)}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle>Carte et position chauffeur</CardTitle>
					<Badge variant="secondary">Temps réel</Badge>
				</CardHeader>
				<CardContent>
					{#if trackingState.point}
						<Map
							center={[trackingState.point.lat, trackingState.point.lng]}
							zoom={14}
							height="300px"
							trackPosition={{
								lat: trackingState.point.lat,
								lng: trackingState.point.lng
							}}
							followTracking={true}
						/>
						<div class="mt-4 rounded-md border bg-muted/50 px-4 py-3 text-sm">
							<p>
								<strong>Position chauffeur :</strong> {trackingState.point.lat.toFixed(6)},{' '}
								{trackingState.point.lng.toFixed(6)}
							</p>
							<p>
								<strong>Dernière MAJ :</strong>{' '}
								{new Date(trackingState.point.updatedAt).toLocaleTimeString('fr-FR')}
							</p>
						</div>
					{:else if trackingState.isConnected}
						<p class="text-muted-foreground">Connecté – En attente de position GPS...</p>
					{:else if trackingState.lastError}
						<p class="text-destructive">Erreur : {trackingState.lastError}</p>
					{/if}
				</CardContent>
			</Card>
		{/if}

		<div class="flex gap-2">
			<Button variant="outline" href="/deliveries/routes">Retour aux tournées</Button>
			<Button variant="outline" href="/deliveries?routeId={routeDetail.id}">Voir les livraisons</Button>
		</div>
	{/if}
</div>
