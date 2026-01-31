<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { goto } from '$app/navigation';
	import { createOrder } from '$lib/api/orders';
	import { geocodeAddress } from '$lib/api/geocode';
	import { ordersActions } from '$lib/stores/orders.svelte';
	import Map from '$lib/components/Map.svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';

	const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
		value: String(i).padStart(2, '0'),
		label: `${String(i).padStart(2, '0')}h`
	}));
	const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((m) => ({
		value: String(m).padStart(2, '0'),
		label: String(m).padStart(2, '0')
	}));

	let customerName = $state('');
	let address = $state('');
	let phoneNumber = $state('');
	let internalComment = $state('');
	let orderDateOpen = $state(false);
	let orderDateValue = $state<CalendarDate>(today(getLocalTimeZone()));
	let orderHour = $state('09');
	let orderMinute = $state('00');
	let orderHourOpen = $state(false);
	let orderMinuteOpen = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let geocodeResult = $state<{ lat: number; lng: number; displayName: string } | null>(null);
	let geocodeLoading = $state(false);
	let geocodeDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	const orderTime = $derived(`${orderHour.padStart(2, '0')}:${orderMinute.padStart(2, '0')}`);

	const mapCenter = $derived(
		geocodeResult ? ([geocodeResult.lat, geocodeResult.lng] as [number, number]) : ([48.8566, 2.3522] as [number, number])
	);
	const mapMarkers = $derived(
		geocodeResult
			? [{ lat: geocodeResult.lat, lng: geocodeResult.lng, label: geocodeResult.displayName }]
			: []
	);

	function scheduleGeocode() {
		if (geocodeDebounceTimer) clearTimeout(geocodeDebounceTimer);
		geocodeDebounceTimer = setTimeout(async () => {
			const addr = address.trim();
			if (addr.length < 3) {
				geocodeResult = null;
				return;
			}
			geocodeLoading = true;
			geocodeResult = null;
			try {
				const res = await geocodeAddress(addr);
				if (res.lat != null && res.lng != null) {
					geocodeResult = { lat: res.lat, lng: res.lng, displayName: res.displayName ?? addr };
				} else {
					geocodeResult = null;
				}
			} catch {
				geocodeResult = null;
			} finally {
				geocodeLoading = false;
			}
		}, 400);
	}

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

<div class="mx-auto flex max-w-2xl min-w-0 flex-col gap-6">
	<PageHeader title="Nouvelle commande" subtitle="Créer une nouvelle commande à livrer." />

		<Card>
			<CardHeader>
				<CardTitle>Informations de la commande</CardTitle>
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
										onValueChange={(v: DateValue | undefined) => {
											if (v !== undefined) orderDateValue = new CalendarDate(v.year, v.month, v.day);
											orderDateOpen = false;
										}}
									/>
								</PopoverContent>
							</PopoverRoot>
						</div>
						<div class="flex gap-2">
							<div class="space-y-2 flex-1">
								<Label for="orderHour">Heures</Label>
								<PopoverRoot bind:open={orderHourOpen}>
									<PopoverTrigger id="orderHour">
										{#snippet child({ props }: { props: Record<string, unknown> })}
											<Button
												{...props}
												variant="outline"
												class="w-full justify-between font-normal"
												disabled={submitting}
											>
												{orderHour.padStart(2, '0')}h
												<ChevronDownIcon class="size-4 opacity-50" />
											</Button>
										{/snippet}
									</PopoverTrigger>
									<PopoverContent class="w-auto p-0" align="start">
										<div class="max-h-56 overflow-y-auto py-1">
											{#each HOUR_OPTIONS as opt}
												<button
													type="button"
													class="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer px-3 py-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 {orderHour === opt.value
														? 'bg-accent text-accent-foreground'
														: ''}"
													onclick={() => {
														orderHour = opt.value;
														orderHourOpen = false;
													}}
												>
													{opt.label}
												</button>
											{/each}
										</div>
									</PopoverContent>
								</PopoverRoot>
							</div>
							<div class="space-y-2 flex-1">
								<Label for="orderMinute">Minutes</Label>
								<PopoverRoot bind:open={orderMinuteOpen}>
									<PopoverTrigger id="orderMinute">
										{#snippet child({ props }: { props: Record<string, unknown> })}
											<Button
												{...props}
												variant="outline"
												class="w-full justify-between font-normal"
												disabled={submitting}
											>
												{orderMinute.padStart(2, '0')}
												<ChevronDownIcon class="size-4 opacity-50" />
											</Button>
										{/snippet}
									</PopoverTrigger>
									<PopoverContent class="w-auto p-0" align="start">
										<div class="max-h-56 overflow-y-auto py-1">
											{#each MINUTE_OPTIONS as opt}
												<button
													type="button"
													class="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer px-3 py-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 {orderMinute === opt.value
														? 'bg-accent text-accent-foreground'
														: ''}"
													onclick={() => {
														orderMinute = opt.value;
														orderMinuteOpen = false;
													}}
												>
													{opt.label}
												</button>
											{/each}
										</div>
									</PopoverContent>
								</PopoverRoot>
							</div>
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
							<p class="text-muted-foreground text-xs">Marqueur affiché sur la carte ci-dessous.</p>
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
								zoom={geocodeResult ? 15 : 11}
								height="220px"
								deliveryMarkers={mapMarkers}
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
