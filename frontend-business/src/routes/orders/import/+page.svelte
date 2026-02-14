<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
	import PackageIcon from '@lucide/svelte/icons/package';
	import { importOrders, type ImportOrderRequest } from '$lib/api/orders';
	import { parseCsv, type ParsedCsvRow, type CsvColumnMapping, detectColumnMapping } from '$lib/utils/csvParser';
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
	let columnMapping = $state<CsvColumnMapping | null>(null);
	let csvHeaders = $state<string[]>([]);
	let isUploading = $state(false);
	let isParsing = $state(false);
	let importResult = $state<{ created: number; errors: string[] } | null>(null);
	let error = $state<string | null>(null);
	let dragOver = $state(false);
	let validationErrors = $state<string[]>([]);

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
		validationErrors = [];
		try {
			const result = await parseCsv(file);
			parsedRows = result.rows;
			columnMapping = result.mapping;
			csvHeaders = result.headers;
			validateRows(result.rows);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors du parsing du CSV';
			parsedRows = [];
			columnMapping = null;
			csvHeaders = [];
		} finally {
			isParsing = false;
		}
	}

	function validateRows(rows: ParsedCsvRow[]) {
		const errors: string[] = [];
		const seen = new Set<string>();

		rows.forEach((row, index) => {
			const lineNum = index + 1;

			// Validation nom client
			if (!row.customerName || row.customerName.length < 2) {
				errors.push(`Ligne ${lineNum}: Nom client trop court`);
			}

			// Validation adresse
			if (!row.address || row.address.length < 5) {
				errors.push(`Ligne ${lineNum}: Adresse invalide`);
			}

			// Détection doublons
			const key = `${row.customerName.toLowerCase().trim()}-${row.address.toLowerCase().trim()}`;
			if (seen.has(key)) {
				errors.push(`Ligne ${lineNum}: Doublon détecté`);
			}
			seen.add(key);
		});

		validationErrors = errors;
	}

	async function handleImport() {
		if (parsedRows.length === 0) {
			error = 'Aucune donnée à importer';
			return;
		}

		if (validationErrors.length > 0) {
			error = `${validationErrors.length} erreur(s) de validation. Corrigez avant d'importer.`;
			return;
		}

		isUploading = true;
		error = null;
		importResult = null;
		try {
			const ordersToImport: ImportOrderRequest[] = parsedRows.map((row) => ({
				customerName: row.customerName,
				address: row.address,
				phoneNumber: row.phoneNumber || null,
				internalComment: row.internalComment || null,
				orderDate: row.orderDate || undefined
			}));
			const result = await importOrders(ordersToImport);
			importResult = { created: result.created, errors: result.errors };
			await ordersActions.loadOrders();
			if (result.errors.length === 0) {
				setTimeout(() => {
					parsedRows = [];
					columnMapping = null;
					csvHeaders = [];
					importResult = null;
					validationErrors = [];
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
	<PageHeader title="Import commandes" subtitle="Ajoute des commandes depuis un fichier ou un plugin." icon={PackageIcon} />

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

					{#if validationErrors.length > 0}
						<Alert variant="destructive" class="mt-2">
							<AlertTitle>⚠️ {validationErrors.length} problème(s) détecté(s)</AlertTitle>
							<AlertDescription>
								<ul class="ml-4 mt-1 max-h-32 overflow-y-auto text-sm">
									{#each validationErrors.slice(0, 10) as err}
										<li>{err}</li>
									{/each}
									{#if validationErrors.length > 10}
										<li>... et {validationErrors.length - 10} autre(s)</li>
									{/if}
								</ul>
							</AlertDescription>
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
						<!-- Mapping des colonnes détectées -->
						{#if columnMapping}
							<div class="mb-4 rounded-lg border bg-muted/30 p-3">
								<p class="mb-2 text-sm font-medium">📋 Colonnes détectées :</p>
								<div class="flex flex-wrap gap-2">
									<span class="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
										✅ Client: {csvHeaders[columnMapping.customerName] || 'Colonne ' + (columnMapping.customerName + 1)}
									</span>
									<span class="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
										✅ Adresse: {csvHeaders[columnMapping.address] || 'Colonne ' + (columnMapping.address + 1)}
									</span>
									{#if columnMapping.phoneNumber !== null}
										<span class="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
											📞 Tél: {csvHeaders[columnMapping.phoneNumber]}
										</span>
									{/if}
									{#if columnMapping.internalComment !== null}
										<span class="rounded bg-purple-100 px-2 py-1 text-xs text-purple-800">
											💬 Commentaire: {csvHeaders[columnMapping.internalComment]}
										</span>
									{/if}
									{#if columnMapping.orderDate !== null}
										<span class="rounded bg-orange-100 px-2 py-1 text-xs text-orange-800">
											📅 Date: {csvHeaders[columnMapping.orderDate]}
										</span>
									{/if}
								</div>
							</div>
						{/if}

						<div class="min-w-0 overflow-x-auto">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Adresse</TableHead>
										{#if columnMapping?.phoneNumber !== null}
											<TableHead>Téléphone</TableHead>
										{/if}
										{#if columnMapping?.internalComment !== null}
											<TableHead>Commentaire</TableHead>
										{/if}
										{#if columnMapping?.orderDate !== null}
											<TableHead>Date</TableHead>
										{/if}
									</TableRow>
								</TableHeader>
								<TableBody>
									{#each parsedRows.slice(0, 10) as row}
										<TableRow>
											<TableCell>{row.customerName}</TableCell>
											<TableCell>{row.address}</TableCell>
											{#if columnMapping?.phoneNumber !== null}
												<TableCell>{row.phoneNumber || '-'}</TableCell>
											{/if}
											{#if columnMapping?.internalComment !== null}
												<TableCell class="max-w-xs truncate">{row.internalComment || '-'}</TableCell>
											{/if}
											{#if columnMapping?.orderDate !== null}
												<TableCell>{row.orderDate || '-'}</TableCell>
											{/if}
										</TableRow>
									{/each}
									{#if parsedRows.length > 10}
										<TableRow>
											<TableCell colspan={2 + (columnMapping ? ['phoneNumber', 'internalComment', 'orderDate'].filter(k => columnMapping[k as keyof CsvColumnMapping] !== null).length : 0)} class="text-center text-muted-foreground">
												... et {parsedRows.length - 10} autre(s) ligne(s)
											</TableCell>
										</TableRow>
									{/if}
								</TableBody>
							</Table>
						</div>
						<div class="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
							<p class="font-medium text-foreground mb-1">📖 Format CSV supporté :</p>
							<ul class="ml-4 list-disc space-y-1">
								<li><strong>Colonnes requises :</strong> client/nom, adresse/rue</li>
								<li><strong>Colonnes optionnelles :</strong> téléphone/phone, commentaire/notes, date (JJ/MM/AAAA ou AAAA-MM-JJ)</li>
								<li><strong>Séparateur :</strong> virgule, point-virgule ou tabulation</li>
							</ul>
						</div>

						<div class="flex justify-end">
							<Button
								type="button"
								onclick={handleImport}
								disabled={isUploading || validationErrors.length > 0}
								variant={validationErrors.length > 0 ? 'destructive' : 'default'}
							>
								{#if validationErrors.length > 0}
									⚠️ Corrigez les erreurs ({validationErrors.length})
								{:else if isUploading}
									Import en cours...
								{:else}
									✅ Importer {parsedRows.length} commande(s)
								{/if}
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
