<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { getDrivers } from '$lib/api/drivers';
	import type { ApiDriver } from '$lib/api/drivers';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	let drivers = $state<ApiDriver[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let didInit = $state(false);

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

<div class="mx-auto flex max-w-6xl flex-col gap-6">
	<PageHeader title="Livreurs" subtitle="Gérer vos livreurs" />

		<Card>
			<CardHeader class="space-y-1">
				<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<CardTitle>Liste des livreurs</CardTitle>
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
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nom</TableHead>
								<TableHead>Téléphone</TableHead>
								<TableHead>ID</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each drivers as driver}
								<TableRow>
									<TableCell class="font-medium">{driver.name}</TableCell>
									<TableCell>{driver.phone}</TableCell>
									<TableCell class="font-mono text-sm text-muted-foreground">{driver.id}</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
			</CardContent>
		</Card>
</div>
