<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { importOrders, type ImportOrderRequest } from '$lib/api/orders';
	import { parseCsv, type ParsedCsvRow } from '$lib/utils/csvParser';
	import { ordersActions } from '$lib/stores/orders.svelte';
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

	const providers = [
		{ id: 'csv', label: 'Importer CSV' },
		{ id: 'shopify', label: 'Shopify' },
		{ id: 'woo', label: 'WooCommerce' }
	];

	let selected = $state('csv');
	let fileInput = $state<HTMLInputElement | null>(null);
	let parsedRows = $state<ParsedCsvRow[]>([]);
	let isUploading = $state(false);
	let isParsing = $state(false);
	let importResult = $state<{ created: number; errors: string[] } | null>(null);
	let error = $state<string | null>(null);
	let dragOver = $state(false);

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) await processFile(file);
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		const file = event.dataTransfer?.files[0];
		if (file && file.name.endsWith('.csv')) {
			await processFile(file);
		} else {
			error = 'Veuillez déposer un fichier CSV';
		}
	}

	function handleDropZoneClick() {
		fileInput?.click();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			fileInput?.click();
		}
	}

	async function processFile(file: File) {
		isParsing = true;
		error = null;
		importResult = null;
		try {
			const rows = await parseCsv(file);
			parsedRows = rows;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du parsing du CSV';
			parsedRows = [];
		} finally {
			isParsing = false;
		}
	}

	async function handleImport() {
		if (parsedRows.length === 0) {
			error = 'Aucune donnée à importer';
			return;
		}
		isUploading = true;
		error = null;
		importResult = null;
		try {
			const ordersToImport: ImportOrderRequest[] = parsedRows.map((row) => {
				const r = row as Record<string, string>;
				const dateVal = r.orderDate ?? r.date ?? r.order_date ?? '';
				return {
					customerName: row.customerName,
					address: row.address,
					phoneNumber: row.phoneNumber || undefined,
					internalComment: row.internalComment || undefined,
					orderDate: dateVal.trim() || undefined
				};
			});
			const result = await importOrders(ordersToImport);
			importResult = { created: result.created, errors: result.errors };
			await ordersActions.loadOrders();
			if (result.errors.length === 0) {
				setTimeout(() => {
					parsedRows = [];
					importResult = null;
					if (fileInput) fileInput.value = '';
				}, 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : "Erreur lors de l'import";
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader title="Import commandes" subtitle="Ajoute des commandes depuis un fichier ou un plugin." />

		<Card>
			<CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
				<div>
					<CardTitle>Source d'import</CardTitle>
					<p class="mt-1 text-sm text-muted-foreground">Mode démo, aucune donnée envoyée.</p>
				</div>
				<Button variant="outline" size="sm" href="/orders">Retour</Button>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 sm:grid-cols-3">
					{#each providers as provider}
						<Button
							variant={selected === provider.id ? 'secondary' : 'outline'}
							class="h-auto flex-col items-start gap-1 py-4 text-left"
							type="button"
							onclick={() => (selected = provider.id)}
						>
							<span class="font-semibold">{provider.label}</span>
							<span class="text-xs font-normal text-muted-foreground">Configurer la source</span>
						</Button>
					{/each}
				</div>
			</CardContent>
		</Card>

		{#if selected === 'csv'}
			<Card>
				<CardHeader>
					<CardTitle>1. Téléverser le fichier CSV</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div
						role="button"
						tabindex="0"
						class="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors {dragOver
							? 'border-primary bg-primary/5'
							: 'border-muted-foreground/25 bg-muted/30'}"
						onclick={handleDropZoneClick}
						onkeydown={handleKeydown}
						ondragover={(e) => { e.preventDefault(); dragOver = true; }}
						ondragleave={() => { dragOver = false; }}
						ondrop={handleDrop}
					>
						<input
							bind:this={fileInput}
							type="file"
							accept=".csv"
							onchange={handleFileSelect}
							class="sr-only"
							aria-label="Sélectionner un fichier CSV"
						/>
						{#if isParsing}
							<p class="text-sm text-muted-foreground">Analyse du fichier en cours...</p>
						{:else if parsedRows.length > 0}
							<p class="font-medium text-primary">✅ {parsedRows.length} commande(s) détectée(s)</p>
							<p class="text-xs text-muted-foreground">Cliquez pour changer de fichier</p>
						{:else}
							<p class="font-medium">📁 Glissez-déposez un fichier CSV ici</p>
							<p class="text-xs text-muted-foreground">ou cliquez pour sélectionner</p>
						{/if}
					</div>

					{#if error}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					{/if}

					{#if importResult}
						<Alert class="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
							<AlertTitle>Import réussi</AlertTitle>
							<AlertDescription>
								✅ {importResult.created} commande(s) importée(s) avec succès
								{#if importResult.errors.length > 0}
									<div class="mt-2 text-destructive">
										⚠️ {importResult.errors.length} erreur(s) :
										<ul class="ml-4 mt-1 list-disc">
											{#each importResult.errors as err}
												<li>{err}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</AlertDescription>
						</Alert>
					{/if}
				</CardContent>
			</Card>

			{#if parsedRows.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>2. Aperçu des données ({parsedRows.length} ligne(s))</CardTitle>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="min-w-0 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Adresse</TableHead>
										<TableHead>Téléphone</TableHead>
										<TableHead>Commentaire</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each parsedRows.slice(0, 10) as row}
										<TableRow>
											<TableCell>{row.customerName}</TableCell>
											<TableCell>{row.address}</TableCell>
											<TableCell>{row.phoneNumber || '-'}</TableCell>
											<TableCell>{row.internalComment || '-'}</TableCell>
										</TableRow>
									{/each}
									{#if parsedRows.length > 10}
										<TableRow>
											<TableCell colspan={4} class="text-center text-muted-foreground">
												... et {parsedRows.length - 10} autre(s) ligne(s)
											</TableCell>
										</TableRow>
									{/if}
								</TableBody>
							</Table>
						</div>
						<div class="flex justify-end">
							<Button type="button" onclick={handleImport} disabled={isUploading}>
								{isUploading ? 'Import en cours...' : `Importer ${parsedRows.length} commande(s)`}
							</Button>
						</div>
					</CardContent>
				</Card>
			{/if}
		{:else}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">
					L'intégration {selected === 'shopify' ? 'Shopify' : 'WooCommerce'} sera disponible prochainement.
				</CardContent>
			</Card>
		{/if}
</div>
