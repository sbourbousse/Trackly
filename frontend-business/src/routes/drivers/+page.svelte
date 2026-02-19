<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import { getDrivers } from '$lib/api/drivers';
	import type { ApiDriver } from '$lib/api/drivers';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import UserCircleIcon from '@lucide/svelte/icons/user-circle';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import { DropdownMenu } from 'bits-ui';

	let drivers = $state<ApiDriver[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let didInit = $state(false);
	let copiedDriverId = $state<string | null>(null);

	// URL de l'app frontend-driver (peut être configurée via variable d'environnement)
	const driverAppUrl = import.meta.env.VITE_DRIVER_APP_URL || 'http://localhost:5174';

	function getDriverLoginUrl(driverId: string): string {
		return `${driverAppUrl}?driverId=${encodeURIComponent(driverId)}`;
	}

	function openDriverApp(driverId: string) {
		window.open(getDriverLoginUrl(driverId), '_blank');
	}

	function openDriverAppPopup(driverId: string) {
		const url = getDriverLoginUrl(driverId);
		const width = 430;
		const height = 820;
		const left = Math.max(0, Math.round((window.screen.width - width) / 2));
		const top = Math.max(0, Math.round((window.screen.height - height) / 2));

		const popup = window.open(
			url,
			'trackly-driver-popup',
			`popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
		);

		// Certains navigateurs bloquent la popup : fallback sur un onglet standard.
		if (!popup) {
			window.open(url, '_blank');
			return;
		}

		popup.focus();
	}

	async function copyLoginLink(driverId: string) {
		const url = getDriverLoginUrl(driverId);
		try {
			await navigator.clipboard.writeText(url);
			copiedDriverId = driverId;
			setTimeout(() => {
				copiedDriverId = null;
			}, 2000);
		} catch (err) {
			console.error('Erreur lors de la copie:', err);
		}
	}

	async function loadDrivers() {
		loading = true;
		error = null;
		try {
			drivers = await getDrivers();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du chargement des livreurs';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (didInit) return;
		didInit = true;
		loadDrivers();
	});
</script>

<div class="mx-auto flex max-w-6xl min-w-0 flex-col gap-6">

		<Card>
			<CardHeader class="space-y-1">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle class="flex items-center gap-2">
							<UserCircleIcon class="size-4 text-muted-foreground" />
							Liste des livreurs
						</CardTitle>
						<p class="text-sm text-muted-foreground">
							{drivers.length} livreur{drivers.length > 1 ? 's' : ''}
						</p>
					</div>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" onclick={loadDrivers} disabled={loading}>
							{loading ? 'Chargement...' : 'Actualiser'}
						</Button>
						<Button size="sm" href="/drivers/new">Nouveau livreur</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				{#if error}
					<Alert variant="destructive">
						<AlertTitle>Erreur</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				{/if}

				{#if loading && drivers.length === 0}
					<div class="py-8 text-center text-muted-foreground">Chargement des livreurs...</div>
				{:else if drivers.length === 0}
					<div class="py-8 text-center text-muted-foreground">
						Aucun livreur pour le moment.
						<Button variant="link" href="/drivers/new" class="px-1">Ajouter un livreur</Button>
					</div>
				{:else}
					<div class="min-w-0 overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Nom</TableHead>
									<TableHead>Téléphone</TableHead>
									<TableHead>ID</TableHead>
									<TableHead class="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each drivers as driver}
									<TableRow>
										<TableCell class="font-medium">{driver.name}</TableCell>
										<TableCell>{driver.phone}</TableCell>
										<TableCell class="font-mono text-sm text-muted-foreground">{driver.id}</TableCell>
										<TableCell class="text-right">
											<DropdownMenu.Root>
												<DropdownMenu.Trigger
													class="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent focus:outline-none"
												>
													<MoreVerticalIcon class="size-4" />
												</DropdownMenu.Trigger>
												<DropdownMenu.Portal>
													<DropdownMenu.Content
														class="min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
														align="end"
													>
														<DropdownMenu.Item
															class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
															onclick={() => openDriverAppPopup(driver.id)}
														>
															<ExternalLinkIcon class="size-4" />
															Ouvrir en fenêtre intégrée
														</DropdownMenu.Item>
														<DropdownMenu.Item
															class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
															onclick={() => openDriverApp(driver.id)}
														>
															<ExternalLinkIcon class="size-4" />
															Ouvrir l'app livreur
														</DropdownMenu.Item>
														<DropdownMenu.Item
															class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
															onclick={() => copyLoginLink(driver.id)}
														>
															{#if copiedDriverId === driver.id}
																<CheckIcon class="size-4" />
																Lien copié
															{:else}
																<CopyIcon class="size-4" />
																Copier le lien de connexion
															{/if}
														</DropdownMenu.Item>
													</DropdownMenu.Content>
												</DropdownMenu.Portal>
											</DropdownMenu.Root>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					</div>
				{/if}
			</CardContent>
		</Card>
</div>
