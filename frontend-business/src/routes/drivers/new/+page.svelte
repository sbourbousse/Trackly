<script lang="ts">
	import { goto } from '$app/navigation';
	import TopNav from '$lib/components/TopNav.svelte';
	import { createDriver } from '$lib/api/drivers';
	import type { CreateDriverRequest } from '$lib/api/drivers';

	let name = $state('');
	let phone = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let success = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!name.trim()) {
			error = 'Le nom du livreur est requis';
			return;
		}

		if (!phone.trim()) {
			error = 'Le numéro de téléphone est requis';
			return;
		}

		submitting = true;
		error = null;

		try {
			const request: CreateDriverRequest = {
				name: name.trim(),
				phone: phone.trim()
			};

			await createDriver(request);

			success = true;
			setTimeout(() => {
				goto('/drivers');
			}, 1500);
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Erreur lors de la création du livreur';
			}
		} finally {
			submitting = false;
		}
	}
</script>

<div class="page">
	<TopNav title="Nouveau livreur" subtitle="Ajouter un livreur à votre équipe" />

	{#if success}
		<div class="success-message" style="padding: 1rem; background: #efe; color: #3c3; border-radius: 4px; margin-bottom: 1rem;">
			✓ Livreur créé avec succès ! Redirection...
		</div>
	{/if}

	{#if error}
		<div class="error-message" style="padding: 1rem; background: #fee; color: #c33; border-radius: 4px; margin-bottom: 1rem;">
			{error}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<section class="panel">
			<div class="panel-header">
				<h2>Informations du livreur</h2>
			</div>

			<div style="display: grid; gap: 1.5rem; padding: 1.5rem;">
				<label class="form-field">
					<span>Nom <span style="color: #c33;">*</span></span>
					<input
						type="text"
						bind:value={name}
						placeholder="Ex: Jean Dupont"
						required
						disabled={submitting}
					/>
				</label>

				<label class="form-field">
					<span>Téléphone <span style="color: #c33;">*</span></span>
					<input
						type="tel"
						bind:value={phone}
						placeholder="Ex: +33 6 12 34 56 78"
						required
						disabled={submitting}
					/>
				</label>
			</div>
		</section>

		<div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
			<button
				type="button"
				class="ghost-button"
				onclick={() => goto('/drivers')}
				disabled={submitting}
			>
				Annuler
			</button>
			<button
				type="submit"
				class="primary-button"
				disabled={submitting || !name.trim() || !phone.trim()}
			>
				{submitting ? 'Création...' : 'Créer le livreur'}
			</button>
		</div>
	</form>
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-field span {
		font-weight: 500;
		font-size: 0.875rem;
	}

	.form-field input {
		padding: 0.75rem;
		border: 2px solid var(--border);
		border-radius: 6px;
		font-size: 1rem;
	}

	.form-field input:focus {
		outline: none;
		border-color: var(--primary);
	}

	.success-message {
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
