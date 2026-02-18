<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import { goto } from '$app/navigation';
	import { createOrder } from '$lib/api/orders';
	import { geocodeAddress } from '$lib/api/geocode';
	import { ordersState, ordersActions } from '$lib/stores/orders.svelte';
	import Map from '$lib/components/Map.svelte';
	import { getHeadquarters } from '$lib/api/headquarters';
	import { getIsochrones, type ApiIsochroneContour } from '$lib/api/routes';
	import { onMount } from 'svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import ClipboardEditIcon from '@lucide/svelte/icons/clipboard-edit';
	import { Label } from '$lib/components/ui/label';
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import TimeSlotSelector from '$lib/components/TimeSlotSelector.svelte';

	const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((m) => ({
		value: String(m).padStart(2, '0'),
		label: String(m).padStart(2, '0')
	}));

	/** Heure et minute actuelles arrondies aux 10 min (pour défaut et raccourci "Maintenant"). */
	function getNowRounded(): { hour: string; minute: string } {
		const d = new Date();
		const m = d.getMinutes();
		let roundedMin = Math.round(m / 10) * 10;
		let h = d.getHours();
		if (roundedMin === 60) {
			h += 1;
			roundedMin = 0;
		}
		return {
			hour: String(h % 24).padStart(2, '0'),
			minute: String(roundedMin).padStart(2, '0')
		};
	}

	/** Prochaine tranche de 2h à partir de maintenant (ex: 20h30 → 22h). */
	function getNextTwoHourSlot(): number {
		const d = new Date();
		const totalMinutes = d.getHours() * 60 + d.getMinutes();
		const slotIndex = Math.ceil(totalMinutes / 120);
		return (slotIndex * 2) % 24;
	}

	/** Créneaux d'heure selon la date : si aujourd'hui, uniquement à partir de la prochaine tranche 2h (ex: 21h30 → 22h, 23h). Sinon tous les créneaux 00–22h. */
	function getHourSlots(selectedDate: CalendarDate): { value: string; label: string }[] {
		const todayRef = today(getLocalTimeZone());
		const isToday =
			selectedDate.year === todayRef.year &&
			selectedDate.month === todayRef.month &&
			selectedDate.day === todayRef.day;
		if (isToday) {
			const start = getNextTwoHourSlot();
			const options: { value: string; label: string }[] = [];
			for (let h = start; h < 24; h += 2) {
				options.push({ value: String(h).padStart(2, '0'), label: `${String(h).padStart(2, '0')}h` });
			}
			return options;
		}
		return Array.from({ length: 12 }, (_, i) => {
			const h = i * 2;
			return { value: String(h).padStart(2, '0'), label: `${String(h).padStart(2, '0')}h` };
		});
	}

	/** Options de minutes : si date = aujourd'hui et heure = heure actuelle, seulement minutes >= maintenant (arrondi 10 min). */
	function getMinuteOptions(selectedDate: CalendarDate, selectedHour: string): { value: string; label: string }[] {
		const todayRef = today(getLocalTimeZone());
		const isToday =
			selectedDate.year === todayRef.year &&
			selectedDate.month === todayRef.month &&
			selectedDate.day === todayRef.day;
		if (!isToday) return MINUTE_OPTIONS;
		const now = getNowRounded();
		if (selectedHour !== now.hour) return MINUTE_OPTIONS;
		const nowMin = parseInt(now.minute, 10);
		return MINUTE_OPTIONS.filter((opt) => parseInt(opt.value, 10) >= nowMin);
	}

	/** Mettre à jour la date si nécessaire lors du changement de tranche */
	function handleSlotChange(slotIndex: number) {
		selectedSlot = slotIndex;
		// Si on sélectionne une tranche future et qu'on est aujourd'hui, vérifier si on doit passer au lendemain
		const todayRef = today(getLocalTimeZone());
		const isToday = orderDateValue.year === todayRef.year && 
		                orderDateValue.month === todayRef.month && 
		                orderDateValue.day === todayRef.day;
		
		if (isToday) {
			const now = new Date();
			const currentHour = now.getHours();
			const currentSlot = Math.floor(currentHour / 4);
			const selectedHour = slotIndex * 4;
			
			// Si la tranche sélectionnée est passée aujourd'hui, passer au lendemain
			if (slotIndex < currentSlot) {
				orderDateValue = todayRef.add({ days: 1 });
			}
		}
	}

	const initialTime = getNowRounded();
	let customerName = $state('');
	let address = $state('');
	let phoneNumber = $state('');
	let internalComment = $state('');
	let orderDateOpen = $state(false);
	let orderDateValue = $state<CalendarDate>(today(getLocalTimeZone()));
	
	// Sélection de tranche horaire (0-5 pour 0h-4h, 4h-8h, 8h-12h, 12h-16h, 16h-20h, 20h-24h)
	const initialSlot = Math.floor(parseInt(initialTime.hour, 10) / 4);
	let selectedSlot = $state(initialSlot);
	
	// Convertir la tranche sélectionnée en heure/minute pour l'API
	const orderHour = $derived(String(selectedSlot * 4).padStart(2, '0'));
	const orderMinute = $derived('00');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let geocodeResult = $state<{ lat: number; lng: number; displayName: string } | null>(null);
	let geocodeLoading = $state(false);
	let geocodeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
	let headquarters = $state<{ lat: number; lng: number } | null>(null);
	let isochronePolygons = $state<{ coordinates: [number, number][]; minutes?: number }[]>([]);
	let isochroneZone = $state<number | null>(null); // Minutes de la zone dans laquelle tombe l'adresse

	const orderTime = $derived(`${orderHour.padStart(2, '0')}:${orderMinute.padStart(2, '0')}`);

	// Date de commande : aujourd'hui ou dans le futur (jusqu'à 2 ans)
	const orderDateMin = $derived(today(getLocalTimeZone()));
	const orderDateMax = $derived(today(getLocalTimeZone()).add({ years: 2 }));

	// Toujours centrer sur le siège social si disponible, sinon centre par défaut
	const mapCenter = $derived(
		headquarters
			? ([headquarters.lat, headquarters.lng] as [number, number])
			: ([48.8566, 2.3522] as [number, number])
	);

	// Marqueurs : adresse géocodée uniquement (le siège social est géré par la prop headquarters)
	const mapMarkers = $derived(
		geocodeResult
			? [{ lat: geocodeResult.lat, lng: geocodeResult.lng, label: geocodeResult.displayName }]
			: []
	);

	/** Vérifie si un point est dans un polygone (algorithme ray casting). 
	 * Les coordonnées du polygone sont au format [lng, lat][]
	 */
	function isPointInPolygon(pointLng: number, pointLat: number, polygon: [number, number][]): boolean {
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const [xi, yi] = polygon[i]; // [lng, lat]
			const [xj, yj] = polygon[j]; // [lng, lat]
			const intersect =
				yi > pointLat !== yj > pointLat && 
				pointLng < ((xj - xi) * (pointLat - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}
		return inside;
	}

	/** Détermine dans quelle zone isochrone tombe un point. Retourne le nombre de minutes ou null. */
	function getIsochroneZone(point: { lat: number; lng: number }): number | null {
		if (isochronePolygons.length === 0) return null;
		
		// Trier les isochrones par minutes (du plus petit au plus grand)
		const sorted = [...isochronePolygons].sort((a, b) => (a.minutes ?? 0) - (b.minutes ?? 0));
		
		// Vérifier dans quelle zone le point tombe (de la plus petite à la plus grande)
		// Les coordonnées sont [lng, lat] dans les isochrones
		for (const contour of sorted) {
			if (isPointInPolygon(point.lng, point.lat, contour.coordinates)) {
				return contour.minutes ?? null;
			}
		}
		
		return null;
	}

	function scheduleGeocode() {
		if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
		geocodeDebounceTimer = setTimeout(async () => {
			const addr = address.trim();
			if (addr.length < 3) {
				geocodeResult = null;
				isochroneZone = null;
				return;
			}
			geocodeLoading = true;
			geocodeResult = null;
			isochroneZone = null;
			try {
				const res = await geocodeAddress(addr);
				if (res.lat != null && res.lng != null) {
					geocodeResult = { lat: res.lat, lng: res.lng, displayName: res.displayName ?? addr };
					// Vérifier dans quelle zone isochrone tombe ce point
					isochroneZone = getIsochroneZone({ lat: res.lat, lng: res.lng });
				} else {
					geocodeResult = null;
					isochroneZone = null;
				}
			} catch {
				geocodeResult = null;
				isochroneZone = null;
			} finally {
				geocodeLoading = false;
			}
		}, 400);
	}

	// Charger le siège social, les isochrones et les commandes au montage (pour les badges des raccourcis)
	onMount(async () => {
		ordersActions.loadOrders();
		try {
			const hq = await getHeadquarters();
			if (hq.lat != null && hq.lng != null) {
				headquarters = { lat: hq.lat, lng: hq.lng };
				
				// Charger les isochrones
				const isochronesRes = await getIsochrones('10,20,30');
				if (isochronesRes?.contours?.length) {
					isochronePolygons = isochronesRes.contours.map((c) => ({
						coordinates: c.coordinates,
						minutes: c.minutes
					}));
				}
			}
		} catch (error) {
			console.error('Erreur lors du chargement du siège social:', error);
		}
	});

	function orderDateToApiString(d: CalendarDate): string {
		const y = d.year;
		const m = String(d.month).padStart(2, '0');
		const day = String(d.day).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}


	function formatOrderDateLabel(d: CalendarDate): string {
		return d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!customerName.trim() || !address.trim()) {
			error = "Le nom du client et l'adresse sont obligatoires";
			return;
		}
		submitting = true;
		error = null;
		try {
			await createOrder({
				customerName: customerName.trim(),
				address: address.trim(),
				phoneNumber: phoneNumber.trim() || null,
				internalComment: internalComment.trim() || null,
				orderDate: `${orderDateToApiString(orderDateValue)}T${orderTime}`
			});
			await ordersActions.loadOrders();
			goto('/orders');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la commande';
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		goto('/orders');
	}
</script>

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader title="Nouvelle commande" subtitle="Créer une nouvelle commande à livrer." icon={ClipboardListIcon} />

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<ClipboardEditIcon class="size-4 text-muted-foreground" />
					Informations de la commande
				</CardTitle>
				<CardDescription>Renseignez le client et l'adresse de livraison.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-2">
						<Label for="customer">Nom du client *</Label>
						<Input
							id="customer"
							type="text"
							bind:value={customerName}
							placeholder="Ex: Atelier Moreau"
							required
							disabled={submitting}
						/>
					</div>
					<div class="grid gap-4 sm:grid-cols-2">
						<div class="space-y-2">
							<Label for="orderDate">Date de la commande</Label>
							<PopoverRoot bind:open={orderDateOpen}>
								<PopoverTrigger id="orderDate">
									{#snippet child({ props }: { props: Record<string, unknown> })}
										<Button
											{...props}
											variant="outline"
											class="w-full justify-between font-normal"
											disabled={submitting}
										>
											{formatOrderDateLabel(orderDateValue)}
											<ChevronDownIcon class="size-4 opacity-50" />
										</Button>
									{/snippet}
								</PopoverTrigger>
								<PopoverContent class="w-auto overflow-hidden p-0" align="start">
									<Calendar
										value={orderDateValue}
										minValue={orderDateMin}
										maxValue={orderDateMax}
										onValueChange={(v: DateValue | undefined) => {
											if (v !== undefined) {
												const newDate = new CalendarDate(v.year, v.month, v.day);
												orderDateValue = newDate;
												// Si on passe à aujourd'hui et que la tranche sélectionnée est passée, ramener à la tranche actuelle
												const todayRef = today(getLocalTimeZone());
												if (newDate.year === todayRef.year && newDate.month === todayRef.month && newDate.day === todayRef.day) {
													const now = new Date();
													const currentHour = now.getHours();
													const currentSlot = Math.floor(currentHour / 4);
													if (selectedSlot < currentSlot) {
														selectedSlot = currentSlot;
													}
												}
											}
											orderDateOpen = false;
										}}
									/>
								</PopoverContent>
							</PopoverRoot>
						</div>
						<div class="space-y-2">
							<TimeSlotSelector
								selectedDate={orderDateValue}
								selectedSlot={selectedSlot}
								onSlotChange={handleSlotChange}
								onDateChange={(newDate) => { orderDateValue = newDate; }}
								disabled={submitting}
							/>
						</div>
					</div>
					<div class="space-y-2">
						<Label for="address">Adresse de livraison *</Label>
						<textarea
							id="address"
							bind:value={address}
							oninput={() => scheduleGeocode()}
							placeholder="Ex: 12 Rue des Tanneurs, 75003 Paris"
							required
							disabled={submitting}
							rows="3"
							class="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-y"
						></textarea>
						{#if geocodeLoading}
							<p class="text-muted-foreground text-xs">Recherche de la position sur la carte…</p>
						{:else if geocodeResult}
							<div class="flex items-center gap-2">
								<p class="text-muted-foreground text-xs">Marqueur affiché sur la carte ci-dessous.</p>
								{#if isochroneZone !== null}
									<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {
										isochroneZone === 10
											? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
											: isochroneZone === 20
												? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
												: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
									}">
										Zone {isochroneZone} min
									</span>
								{:else if isochronePolygons.length > 0}
									<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
										Hors zone
									</span>
								{/if}
							</div>
						{:else if address.trim().length >= 3}
							<p class="text-muted-foreground text-xs">Aucun résultat pour cette adresse.</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="phone">Téléphone</Label>
						<Input
							id="phone"
							type="tel"
							bind:value={phoneNumber}
							placeholder="Ex: 06 12 34 56 78"
							disabled={submitting}
						/>
					</div>

					<div class="space-y-2">
						<Label for="comment">Commentaire interne</Label>
						<textarea
							id="comment"
							bind:value={internalComment}
							placeholder="Note interne (non visible par le client)"
							disabled={submitting}
							rows="2"
							class="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-14 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-y"
						></textarea>
					</div>

					<div class="space-y-2">
						<Label>Aperçu sur la carte</Label>
						<div class="overflow-hidden rounded-md border">
							<Map
								center={mapCenter}
								zoom={headquarters ? 11 : geocodeResult ? 15 : 11}
								height="220px"
								deliveryMarkers={mapMarkers}
								headquarters={headquarters}
								isochronePolygons={isochronePolygons}
								showZoomProgress={true}
								tileTheme="stadia-alidade-smooth-dark"
							/>
						</div>
					</div>

					{#if error}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					{/if}

					<div class="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onclick={handleCancel} disabled={submitting}>
							Annuler
						</Button>
						<Button
							type="submit"
							disabled={submitting || !customerName.trim() || !address.trim()}
						>
							{submitting ? 'Création...' : 'Créer la commande'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
</div>
