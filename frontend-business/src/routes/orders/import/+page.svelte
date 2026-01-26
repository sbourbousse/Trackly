<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { importOrders, type ImportOrderRequest } from '$lib/api/orders';
	import { parseCsv, type ParsedCsvRow } from '$lib/utils/csvParser';
	import { ordersActions } from '$lib/stores/orders.svelte';

	const providers = [
		{ id: 'csv', label: 'Importer CSV' },
		{ id: 'shopify', label: 'Shopify' },
		{ id: 'woo', label: 'WooCommerce' }
	];

	let selected = $state('csv');
	let fileInput: HTMLInputElement;
	let parsedRows = $state<ParsedCsvRow[]>([]);
	let isUploading = $state(false);
	let isParsing = $state(false);
	let importResult = $state<{ created: number; errors: string[] } | null>(null);
	let error = $state<string | null>(null);
	let dragOver = $state(false);

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) {
			await processFile(file);
		}
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
			const ordersToImport: ImportOrderRequest[] = parsedRows.map(row => ({
				customerName: row.customerName,
				address: row.address
			}));

			const result = await importOrders(ordersToImport);
			importResult = {
				created: result.created,
				errors: result.errors
			};

			// Recharger la liste des commandes
			await ordersActions.loadOrders();

			// Réinitialiser après succès
			if (result.errors.length === 0) {
				setTimeout(() => {
					parsedRows = [];
					importResult = null;
					if (fileInput) fileInput.value = '';
				}, 3000);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de l\'import';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="page">
	<TopNav title="Import commandes" subtitle="Ajoute des commandes depuis un fichier ou un plugin." />

	<section class="panel">
		<div class="panel-toolbar">
			<div>
				<h2>Source d import</h2>
				<p class="footer-note">Mode demo, aucune donnee envoyee.</p>
			</div>
			<div class="controls">
				<a class="ghost-button" href="/orders">Retour</a>
				<button class="primary-button" type="button">Lancer import</button>
			</div>
		</div>

		<div class="actions">
			{#each providers as provider}
				<button
					class="action-button"
					class:active={selected === provider.id}
					type="button"
					onclick={() => (selected = provider.id)}
				>
					<div>
						<div>{provider.label}</div>
						<span>Configurer la source</span>
					</div>
					<span>→</span>
				</button>
			{/each}
		</div>
	</section>

	{#if selected === 'csv'}
		<section class="panel">
			<h2>1. Téléverser le fichier CSV</h2>
			
			<div
				class="drop-zone"
				class:drag-over={dragOver}
				onclick={() => fileInput?.click()}
				ondragover={(e) => { e.preventDefault(); dragOver = true; }}
				ondragleave={() => { dragOver = false; }}
				ondrop={handleDrop}
				style="
					border: 2px dashed #ccc;
					border-radius: 8px;
					padding: 3rem;
					text-align: center;
					cursor: pointer;
					background: {dragOver ? '#f0f0f0' : '#fff'};
					transition: background 0.2s;
				"
			>
				<input
					bind:this={fileInput}
					type="file"
					accept=".csv"
					onchange={handleFileSelect}
					style="display: none;"
				/>
				{#if isParsing}
					<p>Analyse du fichier en cours...</p>
				{:else if parsedRows.length > 0}
					<p>✅ {parsedRows.length} commande(s) détectée(s)</p>
					<p style="font-size: 0.9em; color: #666;">Cliquez pour changer de fichier</p>
				{:else}
					<p>📁 Glissez-déposez un fichier CSV ici</p>
					<p style="font-size: 0.9em; color: #666;">ou cliquez pour sélectionner</p>
				{/if}
			</div>

			{#if error}
				<div style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-top: 1rem;">
					{error}
				</div>
			{/if}

			{#if importResult}
				<div style="padding: 1rem; background: #efe; color: #3c3; border-radius: 4px; margin-top: 1rem;">
					✅ {importResult.created} commande(s) importée(s) avec succès
					{#if importResult.errors.length > 0}
						<div style="margin-top: 0.5rem; color: #c33;">
							⚠️ {importResult.errors.length} erreur(s) :
							<ul style="margin: 0.5rem 0 0 1.5rem;">
								{#each importResult.errors as err}
									<li>{err}</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		{#if parsedRows.length > 0}
			<section class="panel">
				<h2>2. Aperçu des données ({parsedRows.length} ligne(s))</h2>
				<table class="table">
					<thead>
						<tr>
							<th>Client</th>
							<th>Adresse</th>
						</tr>
					</thead>
					<tbody>
						{#each parsedRows.slice(0, 10) as row}
							<tr>
								<td>{row.customerName}</td>
								<td>{row.address}</td>
							</tr>
						{/each}
						{#if parsedRows.length > 10}
							<tr>
								<td colspan="2" style="text-align: center; color: #666;">
									... et {parsedRows.length - 10} autre(s) ligne(s)
								</td>
							</tr>
						{/if}
					</tbody>
				</table>

				<div style="margin-top: 1rem; text-align: right;">
					<button
						class="primary-button"
						type="button"
						onclick={handleImport}
						disabled={isUploading}
					>
						{isUploading ? 'Import en cours...' : `Importer ${parsedRows.length} commande(s)`}
					</button>
				</div>
			</section>
		{/if}
	{:else}
		<section class="panel">
			<p style="padding: 2rem; text-align: center; color: #666;">
				L'intégration {selected === 'shopify' ? 'Shopify' : 'WooCommerce'} sera disponible prochainement.
			</p>
		</section>
	{/if}
</div>
