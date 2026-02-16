<script lang="ts">
	import { page } from '$app/state';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RouteProgressBar from '$lib/components/RouteProgressBar.svelte';
	import Map from '$lib/components/Map.svelte';
	import { trackingActions, trackingState } from '$lib/realtime/tracking.svelte';
	import {
		getRoute,
		getRouteGeometry,
		getRouteTravelTimes,
		getRouteTravelTimesMatrix,
		reorderRouteDeliveries
	} from '$lib/api/routes';
	import { geocodeAddressCached } from '$lib/utils/geocoding';
	import { settingsState } from '$lib/stores/settings.svelte';
	import type {
		ApiRouteDetail,
		ApiRouteTravelTimes,
		ApiRouteTravelTimesMatrix
	} from '$lib/api/routes';
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
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	let routeDetail = $state<ApiRouteDetail | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let reordering = $state(false);
	let reorderError = $state<string | null>(null);
	let deliveryCoords = $state<Record<string, { lat: number; lng: number }>>({});
	let inProgressDeliveryId = $state<string | null>(null);
	let didInitTracking = $state(false);
	let routePolylines = $state<{ coordinates: [number, number][]; color?: string }[]>([]);
	let travelTimes = $state<ApiRouteTravelTimes | null>(null);
	let travelTimesMatrix = $state<ApiRouteTravelTimesMatrix | null>(null);

	const completedCount = $derived(
		routeDetail?.deliveries.filter((d) => d.status === 'Completed' || d.status === 'Livree').length ?? 0
	);
	const totalCount = $derived(routeDetail?.deliveries.length ?? 0);

	/** Index dans la matrice : 0 = dépôt, 1..n = livraisons (ordre canonique par id). */
	function pointIdToIndex(matrix: ApiRouteTravelTimesMatrix): Record<string, number> {
		const map: Record<string, number> = {};
		matrix.pointIds.forEach((id, i) => {
			map[id] = i;
		});
		return map;
	}

	/** Temps de trajet (min) entre l’arrêt précédent et celui à l’index donné, dérivé de la matrice. */
	function legDurationMinutesFromMatrix(deliveryIndex: number): number | null {
		if (!routeDetail || !travelTimesMatrix?.durations?.length) return null;
		const idx = pointIdToIndex(travelTimesMatrix);
		const prevId = deliveryIndex === 0 ? 'depot' : routeDetail.deliveries[deliveryIndex - 1].id;
		const currId = routeDetail.deliveries[deliveryIndex].id;
		const pi = idx[prevId];
		const ci = idx[currId];
		if (pi == null || ci == null) return null;
		const row = travelTimesMatrix.durations[pi];
		if (!row?.[ci]) return null;
		return Math.round(row[ci] / 60);
	}

	/** Durée totale (min) du trajet dépot → livraisons → dépôt, dérivée de la matrice. */
	function totalDurationMinutesFromMatrix(): number | null {
		if (!routeDetail?.deliveries.length || !travelTimesMatrix?.durations?.length) return null;
		const idx = pointIdToIndex(travelTimesMatrix);
		let total = 0;
		// Départ → première livraison
		const firstId = routeDetail.deliveries[0].id;
		total += travelTimesMatrix.durations[0]?.[idx[firstId] ?? -1] ?? 0;
		for (let i = 0; i < routeDetail.deliveries.length - 1; i++) {
			const a = idx[routeDetail.deliveries[i].id];
			const b = idx[routeDetail.deliveries[i + 1].id];
			if (a != null && b != null) total += travelTimesMatrix.durations[a]?.[b] ?? 0;
		}
		// Dernière livraison → dépôt
		const lastId = routeDetail.deliveries[routeDetail.deliveries.length - 1].id;
		total += travelTimesMatrix.durations[idx[lastId] ?? -1]?.[0] ?? 0;
		return Math.round(total / 60);
	}

	function legDurationMinutes(index: number): number | null {
		const fromMatrix = legDurationMinutesFromMatrix(index);
		if (fromMatrix != null) return fromMatrix;
		if (!travelTimes?.legs?.length || index >= travelTimes.legs.length) return null;
		const leg = travelTimes.legs[index];
		return leg ? Math.round(leg.durationSeconds / 60) : null;
	}

	function totalDurationMinutes(): number | null {
		const fromMatrix = totalDurationMinutesFromMatrix();
		if (fromMatrix != null) return fromMatrix;
		if (!travelTimes?.totalDurationSeconds) return null;
		return Math.round(travelTimes.totalDurationSeconds / 60);
	}

	/** Durée du segment (s) pour le leg qui mène à la livraison à deliveryIndex. */
	function legDurationSeconds(deliveryIndex: number): number | null {
		if (travelTimesMatrix?.durations?.length && routeDetail?.deliveries?.length) {
			const idx = pointIdToIndex(travelTimesMatrix);
			const prevId = deliveryIndex === 0 ? 'depot' : routeDetail.deliveries[deliveryIndex - 1].id;
			const currId = routeDetail.deliveries[deliveryIndex].id;
			const pi = idx[prevId];
			const ci = idx[currId];
			if (pi != null && ci != null) {
				const s = travelTimesMatrix.durations[pi]?.[ci];
				if (s != null) return s;
			}
		}
		if (travelTimes?.legs?.[deliveryIndex]) return travelTimes.legs[deliveryIndex].durationSeconds;
		return null;
	}

	/** Heure d'arrivée estimée à la livraison (index) si plannedStartAt et durées disponibles. */
	function estimatedArrivalAt(deliveryIndex: number): Date | null {
		if (!routeDetail?.plannedStartAt) return null;
		let cum = 0;
		for (let i = 0; i <= deliveryIndex; i++) {
			const s = legDurationSeconds(i);
			if (s == null) return null;
			cum += s;
		}
		return new Date(new Date(routeDetail.plannedStartAt).getTime() + cum * 1000);
	}

	/** Durée totale du trajet en secondes (dépôt → livraisons → dépôt). */
	function totalDurationSeconds(): number | null {
		if (!routeDetail?.deliveries.length) return null;
		let total = 0;
		for (let i = 0; i < routeDetail.deliveries.length; i++) {
			const s = legDurationSeconds(i);
			if (s == null) return null;
			total += s;
		}
		// Retour dernière livraison → dépôt
		if (travelTimesMatrix?.durations?.length) {
			const idx = pointIdToIndex(travelTimesMatrix);
			const lastId = routeDetail.deliveries[routeDetail.deliveries.length - 1].id;
			const lastIdx = idx[lastId];
			if (lastIdx != null) {
				const back = travelTimesMatrix.durations[lastIdx]?.[0];
				if (back != null) total += back;
			}
		} else if (travelTimes?.legs?.length && routeDetail.deliveries.length < travelTimes.legs.length) {
			const returnLeg = travelTimes.legs[routeDetail.deliveries.length];
			if (returnLeg) total += returnLeg.durationSeconds;
		}
		return total;
	}

	/** Heure de retour estimée au dépôt (si plannedStartAt et durées disponibles). */
	function estimatedReturnAt(): Date | null {
		if (!routeDetail?.plannedStartAt) return null;
		const sec = totalDurationSeconds();
		if (sec == null) return null;
		return new Date(new Date(routeDetail.plannedStartAt).getTime() + sec * 1000);
	}

	/** Texte sous la barre de progression : durée, retour estimé, ou message suivi. */
	function progressSubLabel(): string | undefined {
		if (inProgressDeliveryId) return 'Position chauffeur en direct ci-dessous.';
		const parts: string[] = [];
		if (totalDurationMinutes() != null) parts.push(`Durée totale estimée : ~${totalDurationMinutes()} min`);
		const ret = estimatedReturnAt();
		if (ret) parts.push(`Retour estimé : ${ret.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
		return parts.length > 0 ? parts.join(' · ') : undefined;
	}

	/** Algorithme du plus proche voisin : ordre des livraisons minimisant la durée (depot → … → depot). */
	function nearestNeighborOrder(): string[] {
		if (!travelTimesMatrix?.durations?.length || !routeDetail?.deliveries.length) return [];
		const n = travelTimesMatrix.pointIds.length;
		const idx = pointIdToIndex(travelTimesMatrix);
		const d = travelTimesMatrix.durations;
		const deliveryIndices = routeDetail.deliveries.map((del) => idx[del.id]).filter((i) => i != null) as number[];
		if (deliveryIndices.length === 0) return [];
		const unvisited = new Set(deliveryIndices);
		let current = 0; // depot
		const route: number[] = [];
		while (unvisited.size > 0) {
			let best = -1;
			let bestTime = Infinity;
			for (const j of unvisited) {
				const t = d[current]?.[j] ?? Infinity;
				if (t < bestTime) {
					bestTime = t;
					best = j;
				}
			}
			if (best === -1) break;
			route.push(best);
			unvisited.delete(best);
			current = best;
		}
		return route.map((i) => travelTimesMatrix!.pointIds[i]);
	}

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
				const [geom, times, matrix] = await Promise.all([
				getRouteGeometry(routeId),
				getRouteTravelTimes(routeId),
				getRouteTravelTimesMatrix(routeId)
			]);
			if (geom?.legs?.length) {
				const legColors = [
					'#0d9488', '#2563eb', '#7c3aed', '#d97706', '#059669',
					'#e11d48', '#0891b2', '#4f46e5', '#dc2626', '#16a34a'
				];
				routePolylines = geom.legs.map((leg, i) => ({
					coordinates: leg.coordinates,
					color: legColors[i % legColors.length]
				}));
			} else if (geom?.coordinates?.length) {
				routePolylines = [{ coordinates: geom.coordinates, color: '#0d9488' }];
			} else {
				routePolylines = [];
			}
			travelTimes = times ?? null;
			travelTimesMatrix = matrix ?? null;
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

	async function optimizeOrder() {
		if (!routeDetail?.deliveries.length || !travelTimesMatrix?.durations?.length) return;
		const optimizedIds = nearestNeighborOrder();
		if (optimizedIds.length !== routeDetail.deliveries.length) return;
		await applyReorder(optimizedIds);
	}

	/** Numéros d'étape pour le tracé : 1, 2, 3… = livraisons dans l'ordre du tableau. */
	const routeStepLabels = $derived.by(() => {
		if (!routeDetail?.deliveries.length) return [];
		const out: { lat: number; lng: number; step: number }[] = [];
		routeDetail.deliveries.forEach((d, i) => {
			const c = deliveryCoords[d.id];
			if (c) out.push({ lat: c.lat, lng: c.lng, step: i + 1 });
		});
		return out;
	});

	/**
	 * Segments de liaison entre la fin de chaque tronçon (point « snap » sur la route)
	 * et le marqueur réel de la livraison. Corrige le décalage route vs adresse géocodée.
	 */
	const routeConnectors = $derived.by(() => {
		if (!routeDetail?.deliveries.length || !routePolylines.length) return [];
		const out: { coordinates: [number, number][] }[] = [];
		const minDistDeg = 0.00003; // ~3 m, évite les tout petits traits
		for (let i = 0; i < routeDetail.deliveries.length && i < routePolylines.length; i++) {
			const leg = routePolylines[i];
			const coords = leg?.coordinates;
			if (!coords?.length) continue;
			const routeEnd = coords[coords.length - 1] as [number, number];
			const delivery = routeDetail.deliveries[i];
			const marker = deliveryCoords[delivery.id];
			if (!marker) continue;
			const [rlng, rlat] = routeEnd;
			const distSq = (rlng - marker.lng) ** 2 + (rlat - marker.lat) ** 2;
			if (distSq < minDistDeg * minDistDeg) continue;
			out.push({
				coordinates: [[rlng, rlat], [marker.lng, marker.lat]]
			});
		}
		return out;
	});
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
						{#if routeDetail.plannedStartAt}
							· Départ prévu {new Date(routeDetail.plannedStartAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
						{/if}
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
					subLabel={progressSubLabel()}
				/>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
				<div>
					<CardTitle class="flex items-center gap-2">
						<PackageIcon class="size-4 text-muted-foreground" />
						Livraisons ({routeDetail.deliveries.length})
					</CardTitle>
					<p class="text-sm text-muted-foreground">
						Ordre des arrêts. Temps estimé entre chaque livraison (matrice Stadia Maps). Utilisez les flèches pour réorganiser.
					</p>
				</div>
				{#if travelTimesMatrix?.durations?.length && routeDetail.deliveries.length > 1}
					<Button
						variant="outline"
						size="sm"
						onclick={() => optimizeOrder()}
						disabled={reordering}
						aria-label="Optimiser l'ordre de la tournée"
					>
						<SparklesIcon class="size-4 mr-1" />
						Optimiser l'ordre
					</Button>
				{/if}
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
									<TableHead class="w-20 text-muted-foreground">Temps</TableHead>
									<TableHead class="w-28 text-muted-foreground">Arrivée estimée</TableHead>
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
										<TableCell class="text-muted-foreground tabular-nums">
											{legDurationMinutes(index) != null ? `~${legDurationMinutes(index)} min` : '–'}
										</TableCell>
										<TableCell class="text-muted-foreground text-sm tabular-nums">
											{#if estimatedArrivalAt(index)}
												{estimatedArrivalAt(index)!.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
											{:else}
												–
											{/if}
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

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle>Carte et itinéraire</CardTitle>
				{#if inProgressDeliveryId && (trackingState.point || trackingState.isConnected)}
					<Badge variant="secondary">Temps réel</Badge>
				{/if}
			</CardHeader>
			<CardContent>
				{#if Object.keys(deliveryCoords).length > 0 || routePolylines.length > 0}
					<Map
						height="300px"
						markers={[]}
						headquarters={settingsState.headquarters}
						routePolylines={routePolylines}
						routeConnectors={routeConnectors}
						routeStepLabels={routeStepLabels}
						trackPosition={inProgressDeliveryId && trackingState.point ? { lat: trackingState.point.lat, lng: trackingState.point.lng } : null}
						followTracking={!!(inProgressDeliveryId && trackingState.point)}
						lockView={true}
						tileTheme="stadia-alidade-smooth-dark"
					/>
				{:else if inProgressDeliveryId && (trackingState.point || trackingState.isConnected)}
					{#if trackingState.point}
						<Map
							center={[trackingState.point.lat, trackingState.point.lng]}
							zoom={14}
							height="300px"
							tileTheme="stadia-alidade-smooth-dark"
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
				{:else}
					<p class="text-muted-foreground text-sm">
						Activer le géocodage des adresses ou configurer Stadia Maps pour afficher l'itinéraire sur la carte.
					</p>
				{/if}
			</CardContent>
		</Card>

		<div class="flex gap-2">
			<Button variant="outline" href="/deliveries/routes">Retour aux tournées</Button>
			<Button variant="outline" href="/deliveries?routeId={routeDetail.id}">Voir les livraisons</Button>
		</div>
	{/if}
</div>
