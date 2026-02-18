<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import RouteIcon from '@lucide/svelte/icons/route';
	import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import { getOrders } from '$lib/api/orders';
	import { getDrivers } from '$lib/api/drivers';
	import { createDeliveriesBatch } from '$lib/api/deliveries';
	import type { ApiOrder } from '$lib/api/orders';
	import type { ApiDriver } from '$lib/api/drivers';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import StatusBadge from '$lib/components/StatusBadge.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Root as PopoverRoot, Content as PopoverContent, Trigger as PopoverTrigger } from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { cn } from '$lib/utils';
	import RelativeTimeIndicator from '$lib/components/RelativeTimeIndicator.svelte';
	import { CalendarDate, getLocalTimeZone, today, type DateValue } from '@internationalized/date';
	import TimeSlotSelector from '$lib/components/TimeSlotSelector.svelte';

	const MINUTE_OPTIONS = [0, 10, 20, 30, 40, 50].map((m) => ({
		value: String(m).padStart(2, '0'),
		label: String(m).padStart(2, '0')
	}));

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
		const isToday = plannedStartDateValue.year === todayRef.year && 
		                plannedStartDateValue.month === todayRef.month && 
		                plannedStartDateValue.day === todayRef.day;
		
		if (isToday) {
			const now = new Date();
			const currentHour = now.getHours();
			const currentSlot = Math.floor(currentHour / 4);
			
			// Si la tranche sélectionnée est passée aujourd'hui, passer au lendemain
			if (slotIndex < currentSlot) {
				plannedStartDateValue = todayRef.add({ days: 1 });
			}
		}
	}

	function plannedStartDateToApiString(d: CalendarDate): string {
		const y = d.year;
		const m = String(d.month).padStart(2, '0');
		const day = String(d.day).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function formatPlannedStartDateLabel(d: CalendarDate): string {
		return d.toDate(getLocalTimeZone()).toLocaleDateString('fr-FR', {
			weekday: 'short',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	const initialTime = getNowRounded();
	const orderDateMin = $derived(today(getLocalTimeZone()));
	const orderDateMax = $derived(today(getLocalTimeZone()).add({ years: 2 }));

	let orders = $state<ApiOrder[]>([]);
	let drivers = $state<ApiDriver[]>([]);
	let selectedOrderIds = $state<Set<string>>(new Set());
	let selectedDriverId = $state('');
	let routeName = $state('');
	let plannedStartDateOpen = $state(false);
	let plannedStartDateValue = $state<CalendarDate>(today(getLocalTimeZone()));
	// Sélection de tranche horaire (0-5 pour 0h-4h, 4h-8h, 8h-12h, 12h-16h, 16h-20h, 20h-24h)
	const initialSlot = Math.floor(parseInt(initialTime.hour, 10) / 4);
	let selectedSlot = $state(initialSlot);
	
	// Convertir la tranche sélectionnée en heure/minute pour l'API
	const plannedStartHour = $derived(String(selectedSlot * 4).padStart(2, '0'));
	const plannedStartMinute = $derived('00');
	let loading = $state(false);
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	/** Heure de début prévue au format ISO pour l'API (date/heure locale convertie en ISO). */
	const plannedStartAtIso = $derived.by(() => {
		const d = plannedStartDateValue.toDate(getLocalTimeZone());
		d.setHours(parseInt(plannedStartHour, 10), parseInt(plannedStartMinute, 10), 0, 0);
		return d.toISOString();
	});

	/** Commandes affichées : uniquement celles dont la date/heure de livraison est >= heure de début de la tournée. */
	const ordersToShow = $derived.by(() => {
		const startMs = new Date(plannedStartAtIso).getTime();
		return orders.filter((o) => {
			if (!o.orderDate) return true;
			const orderMs = new Date(o.orderDate).getTime();
			return orderMs >= startMs;
		});
	});

	/** Écart entre le début de la tournée et la date de livraison de la commande (texte lisible). */
	function formatTimeDiffFromRouteStart(orderDateIso: string | null): string {
		if (!orderDateIso) return '–';
		const startMs = new Date(plannedStartAtIso).getTime();
		const orderMs = new Date(orderDateIso).getTime();
		const diffMs = orderMs - startMs;
		if (diffMs < 0) return '–';
		const totalMin = Math.floor(diffMs / 60000);
		const days = Math.floor(totalMin / (24 * 60));
		const restMin = totalMin % (24 * 60);
		const hours = Math.floor(restMin / 60);
		const min = restMin % 60;
		if (days > 0) {
			const parts = [`${days} j`];
			if (hours > 0) parts.push(`${hours} h`);
			if (min > 0) parts.push(`${min} min`);
			return parts.join(' ');
		}
		if (hours > 0) {
			return min > 0 ? `${hours} h ${min} min` : `${hours} h`;
		}
		return `${min} min`;
	}

	let didInit = $state(false);
	$effect(() => {
		if (didInit) return;
		didInit = true;
		loading = true;
		error = null;
		Promise.all([getOrders(), getDrivers()])
			.then(([ordersData, driversData]) => {
				orders = ordersData.filter((o) => o.status === 'Pending' || o.status === '0');
				drivers = driversData;
				if (drivers.length > 0) {
					selectedDriverId = drivers[0].id;
				}
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : 'Erreur lors du chargement';
			})
			.finally(() => {
				loading = false;
			});
	});

	function toggleOrder(orderId: string) {
		const newSet = new Set(selectedOrderIds);
		if (newSet.has(orderId)) newSet.delete(orderId);
		else newSet.add(orderId);
		selectedOrderIds = newSet;
	}

	function selectAll() {
		selectedOrderIds = new Set(ordersToShow.map((o) => o.id));
	}

	function deselectAll() {
		selectedOrderIds = new Set();
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (selectedOrderIds.size === 0) {
			error = 'Veuillez sélectionner au moins une commande';
			return;
		}
		if (!selectedDriverId) {
			error = 'Veuillez sélectionner un livreur';
			return;
		}
		submitting = true;
		error = null;
		try {
			await createDeliveriesBatch({
				driverId: selectedDriverId,
				orderIds: Array.from(selectedOrderIds),
				name: routeName.trim() || undefined,
				plannedStartAt: plannedStartAtIso
			});
			success = true;
			setTimeout(() => goto('/deliveries'), 1500);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la tournée';
		} finally {
			submitting = false;
		}
	}
</script>

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader title="Nouvelle tournée" subtitle="Sélectionnez les commandes et assignez un livreur" icon={RouteIcon} />

		{#if success}
			<Alert class="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
				<AlertTitle>Succès</AlertTitle>
				<AlertDescription>Tournée créée avec succès. Redirection...</AlertDescription>
			</Alert>
		{/if}

		{#if error}
			<Alert variant="destructive">
				<AlertTitle>Erreur</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
		{/if}

		{#if loading}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">Chargement...</CardContent>
			</Card>
		{:else}
			<form onsubmit={handleSubmit} class="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<MapPinIcon class="size-4 text-muted-foreground" />
							Informations de la tournée
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="space-y-2">
							<Label for="route">Nom de la tournée (optionnel)</Label>
							<Input
								id="route"
								type="text"
								value={routeName}
								oninput={(e) => (routeName = e.currentTarget.value)}
								placeholder="Ex: Est - Matin, Nuit 22h-6h"
							/>
						</div>
							<div class="space-y-2">
								<Label>Heure de début prévue</Label>
								<p class="text-xs text-muted-foreground">Filtre les commandes affichées (date/heure de livraison ≥ cette heure) et sert au calcul des heures d'arrivée estimées.</p>
								<div class="space-y-2">
									<div class="space-y-1">
										<Label for="plannedStartDate" class="text-xs">Date</Label>
										<PopoverRoot bind:open={plannedStartDateOpen}>
											<PopoverTrigger id="plannedStartDate">
												{#snippet child({ props }: { props: Record<string, unknown> })}
													<Button
														{...props}
														variant="outline"
														class="min-w-[180px] justify-between font-normal"
														disabled={submitting}
													>
														{formatPlannedStartDateLabel(plannedStartDateValue)}
														<ChevronDownIcon class="size-4 opacity-50" />
													</Button>
												{/snippet}
											</PopoverTrigger>
											<PopoverContent class="w-auto overflow-hidden p-0" align="start">
												<Calendar
													value={plannedStartDateValue}
													minValue={orderDateMin}
													maxValue={orderDateMax}
													onValueChange={(v: DateValue | undefined) => {
														if (v !== undefined) {
															const newDate = new CalendarDate(v.year, v.month, v.day);
															plannedStartDateValue = newDate;
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
														plannedStartDateOpen = false;
													}}
												/>
											</PopoverContent>
										</PopoverRoot>
									</div>
									<TimeSlotSelector
										selectedDate={plannedStartDateValue}
										selectedSlot={selectedSlot}
										onSlotChange={handleSlotChange}
										onDateChange={(newDate) => { plannedStartDateValue = newDate; }}
										disabled={submitting}
									/>
								</div>
							</div>
						<div class="space-y-2">
							<Label for="driver">Livreur *</Label>
							<select
								id="driver"
								bind:value={selectedDriverId}
								required
								disabled={submitting}
								class="border-input bg-background dark:bg-input/30 ring-offset-background flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">Sélectionner un livreur</option>
								{#each drivers as driver}
									<option value={driver.id}>{driver.name} ({driver.phone})</option>
								{/each}
							</select>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
						<div>
							<CardTitle class="flex items-center gap-2">
								<ClipboardListIcon class="size-4 text-muted-foreground" />
								Commandes à livrer
							</CardTitle>
							<p class="mt-1 text-sm text-muted-foreground">
								{selectedOrderIds.size} commande{selectedOrderIds.size > 1 ? 's' : ''} sélectionnée{selectedOrderIds.size > 1 ? 's' : ''}
								{#if ordersToShow.length > 0}
									({ordersToShow.length} à livrer à partir de l'heure de début)
								{/if}
							</p>
						</div>
						<div class="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={selectAll}
								disabled={submitting || ordersToShow.length === 0}
							>
								Tout sélectionner
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={deselectAll}
								disabled={submitting || selectedOrderIds.size === 0}
							>
								Tout désélectionner
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						{#if orders.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								Aucune commande en attente.
								<Button variant="link" href="/orders" class="px-1">Importer des commandes</Button>
							</div>
						{:else if ordersToShow.length === 0}
							<div class="py-8 text-center text-muted-foreground">
								Aucune commande dont la date/heure de livraison est après l'heure de début choisie. Modifiez l'heure de début ou ajoutez des commandes.
							</div>
						{:else}
							<div class="max-h-[400px] min-w-0 overflow-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="w-10">
												<Checkbox
													checked={selectedOrderIds.size === ordersToShow.length && ordersToShow.length > 0}
													onCheckedChange={() => {
														if (selectedOrderIds.size === ordersToShow.length) deselectAll();
														else selectAll();
													}}
													aria-label="Tout sélectionner"
												/>
											</TableHead>
											<TableHead>Statut</TableHead>
											<TableHead>Date livraison</TableHead>
											<TableHead class="whitespace-nowrap">Après départ</TableHead>
											<TableHead>Client</TableHead>
											<TableHead>Adresse</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each ordersToShow as order}
											<TableRow
												class={cn(
													'cursor-pointer transition-colors hover:bg-muted/50',
													selectedOrderIds.has(order.id) && 'bg-primary/5'
												)}
												onclick={() => toggleOrder(order.id)}
											>
												<TableCell class="w-10" onclick={(e) => e.stopPropagation()}>
													<Checkbox
														checked={selectedOrderIds.has(order.id)}
														onCheckedChange={() => toggleOrder(order.id)}
													/>
												</TableCell>
												<TableCell>
													<StatusBadge type="order" status={order.status} />
												</TableCell>
												<TableCell>
													<RelativeTimeIndicator date={order.orderDate} showTime={true} />
												</TableCell>
												<TableCell class="tabular-nums text-muted-foreground">
													{formatTimeDiffFromRouteStart(order.orderDate)}
												</TableCell>
												<TableCell>{order.customerName}</TableCell>
												<TableCell>{order.address}</TableCell>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							</div>
						{/if}
					</CardContent>
				</Card>

				<div class="flex justify-end gap-3">
					<Button type="button" variant="outline" onclick={() => goto('/deliveries')} disabled={submitting}>
						Annuler
					</Button>
					<Button
						type="submit"
						disabled={submitting || selectedOrderIds.size === 0 || !selectedDriverId}
					>
						{submitting ? 'Création...' : `Créer la tournée (${selectedOrderIds.size} livraison${selectedOrderIds.size > 1 ? 's' : ''})`}
					</Button>
				</div>
			</form>
		{/if}
</div>
