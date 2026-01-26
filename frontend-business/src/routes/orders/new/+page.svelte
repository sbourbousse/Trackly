<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { goto } from '$app/navigation';
	import { createOrder } from '$lib/api/orders';
	import { ordersActions } from '$lib/stores/orders.svelte';

	let customerName = $state('');
	let address = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (!customerName.trim() || !address.trim()) {
			error = 'Le nom du client et l\'adresse sont obligatoires';
			return;
		}

		submitting = true;
		error = null;

		try {
			await createOrder({
				customerName: customerName.trim(),
				address: address.trim()
			});

			// Recharger la liste des commandes
			await ordersActions.loadOrders();

			// Rediriger vers la liste
			goto('/orders');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la commande';
			submitting = false;
		}
	}

	function handleCancel() {
		goto('/orders');
	}
</script>

<div class="page">
	<TopNav title="Nouvelle commande" subtitle="Créer une nouvelle commande à livrer." />

	<section class="panel">
		<form onsubmit={handleSubmit}>
			<div class="form-grid">
				<label class="form-field">
					Nom du client *
					<input
						type="text"
						bind:value={customerName}
						placeholder="Ex: Atelier Moreau"
						required
						disabled={submitting}
					/>
				</label>

				<label class="form-field">
					Adresse de livraison *
					<textarea
						bind:value={address}
						placeholder="Ex: 12 Rue des Tanneurs, 75003 Paris"
						required
						disabled={submitting}
						rows="3"
					></textarea>
				</label>
			</div>

			{#if error}
				<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
					{error}
				</div>
			{/if}

			<div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
				<button
					class="ghost-button"
					type="button"
					onclick={handleCancel}
					disabled={submitting}
				>
					Annuler
				</button>
				<button
					class="primary-button"
					type="submit"
					disabled={submitting || !customerName.trim() || !address.trim()}
				>
					{submitting ? 'Création...' : 'Créer la commande'}
				</button>
			</div>
		</form>
	</section>
</div>

<style>
	.form-grid {
		display: grid;
		gap: 1.5rem;
		margin-bottom: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field input,
	.form-field textarea {
		padding: 0.75rem;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		font-size: 1rem;
		font-family: inherit;
	}

	.form-field input:focus,
	.form-field textarea:focus {
		outline: none;
		border-color: #2563eb;
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.form-field input:disabled,
	.form-field textarea:disabled {
		background-color: #f3f4f6;
		cursor: not-allowed;
	}

	textarea {
		resize: vertical;
		min-height: 80px;
	}
</style>
