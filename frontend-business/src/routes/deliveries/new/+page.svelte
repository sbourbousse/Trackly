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

	function getHourSlots(): { value: string; label: string }[] {
		const start = getNextTwoHourSlot();
		return Array.from({ length: 12 }, (_, i) => {
			const h = (start + i * 2) % 24;
			return { value: String(h).padStart(2, '0'), label: `${String(h).padStart(2, '0')}h` };
		});
	}

	function setTimeShortcut(offsetHours: number) {
		if (offsetHours === 0) {
			const now = getNowRounded();
			plannedStartHour = now.hour;
			plannedStartMinute = now.minute;
		} else {
			const nextSlot = getNextTwoHourSlot();
			const h = (nextSlot + offsetHours - 2) % 24;
			plannedStartHour = String(h).padStart(2, '0');
			plannedStartMinute = '00';
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
	let plannedStartHour = $state(initialTime.hour);
	let plannedStartMinute = $state(initialTime.minute);
	let plannedStartHourOpen = $state(false);
	let plannedStartMinuteOpen = $state(false);
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
		selectedOrderIds = new Set(orders.map((o) => o.id));
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
							<p class="text-xs text-muted-foreground">Permet d'afficher l'heure d'arrivée estimée par livraison.</p>
							<div class="space-y-2">
								<div class="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={submitting}
										onclick={() => setTimeShortcut(0)}
									>
										Maintenant
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={submitting}
										onclick={() => setTimeShortcut(2)}
									>
										+2h
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={submitting}
										onclick={() => setTimeShortcut(4)}
									>
										+4h
									</Button>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={submitting}
										onclick={() => setTimeShortcut(6)}
									>
										+6h
									</Button>
								</div>
								<div class="flex flex-wrap gap-2 items-end">
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
														if (v !== undefined) plannedStartDateValue = new CalendarDate(v.year, v.month, v.day);
														plannedStartDateOpen = false;
													}}
												/>
											</PopoverContent>
										</PopoverRoot>
									</div>
									<div class="space-y-1">
										<Label for="plannedStartHour" class="text-xs">Heure</Label>
										<PopoverRoot bind:open={plannedStartHourOpen}>
											<PopoverTrigger id="plannedStartHour">
												{#snippet child({ props }: { props: Record<string, unknown> })}
													<Button
														{...props}
														variant="outline"
														class="w-[72px] justify-between font-normal"
														disabled={submitting}
													>
														{plannedStartHour.padStart(2, '0')}h
														<ChevronDownIcon class="size-4 opacity-50" />
													</Button>
												{/snippet}
											</PopoverTrigger>
											<PopoverContent class="w-auto p-0" align="start">
												<div class="max-h-56 overflow-y-auto py-1">
													{#each getHourSlots() as opt}
														<button
															type="button"
															class="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer px-3 py-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 {plannedStartHour === opt.value
																? 'bg-accent text-accent-foreground'
																: ''}"
															onclick={() => {
																plannedStartHour = opt.value;
																plannedStartHourOpen = false;
															}}
														>
															{opt.label}
														</button>
													{/each}
												</div>
											</PopoverContent>
										</PopoverRoot>
									</div>
									<div class="space-y-1">
										<Label for="plannedStartMinute" class="text-xs">Minutes</Label>
										<PopoverRoot bind:open={plannedStartMinuteOpen}>
											<PopoverTrigger id="plannedStartMinute">
												{#snippet child({ props }: { props: Record<string, unknown> })}
													<Button
														{...props}
														variant="outline"
														class="w-[72px] justify-between font-normal"
														disabled={submitting}
													>
														{plannedStartMinute.padStart(2, '0')}
														<ChevronDownIcon class="size-4 opacity-50" />
													</Button>
												{/snippet}
											</PopoverTrigger>
											<PopoverContent class="w-auto p-0" align="start">
												<div class="max-h-56 overflow-y-auto py-1">
													{#each MINUTE_OPTIONS as opt}
														<button
															type="button"
															class="hover:bg-accent hover:text-accent-foreground flex w-full cursor-pointer px-3 py-2 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 {plannedStartMinute === opt.value
																? 'bg-accent text-accent-foreground'
																: ''}"
															onclick={() => {
																plannedStartMinute = opt.value;
																plannedStartMinuteOpen = false;
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
								{#if orders.length > 0}
									({orders.length} en attente)
								{/if}
							</p>
						</div>
						<div class="flex gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onclick={selectAll}
								disabled={submitting || orders.length === 0}
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
						{:else}
							<div class="max-h-[400px] min-w-0 overflow-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead class="w-10">
												<Checkbox
													checked={selectedOrderIds.size === orders.length && orders.length > 0}
													onCheckedChange={() => {
														if (selectedOrderIds.size === orders.length) deselectAll();
														else selectAll();
													}}
													aria-label="Tout sélectionner"
												/>
											</TableHead>
											<TableHead>Statut</TableHead>
											<TableHead>Date</TableHead>
											<TableHead>Client</TableHead>
											<TableHead>Adresse</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each orders as order}
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
						disabled={submitting || selectedOrderIds.size === 0 || !selectedDriverId || orders.length === 0}
					>
						{submitting ? 'Création...' : `Créer la tournée (${selectedOrderIds.size} livraison${selectedOrderIds.size > 1 ? 's' : ''})`}
					</Button>
				</div>
			</form>
		{/if}
</div>
