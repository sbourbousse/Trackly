<script lang="ts">
	import { goto } from '$app/navigation';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import UserIcon from '@lucide/svelte/icons/user';
	import { createDriver } from '$lib/api/drivers';
	import type { CreateDriverRequest } from '$lib/api/drivers';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import UserCircleIcon from '@lucide/svelte/icons/user-circle';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

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

<div class="mx-auto flex max-w-4xl min-w-0 flex-col gap-6">
	<PageHeader title="Nouveau livreur" subtitle="Ajouter un livreur à votre équipe" icon={UserIcon} />

	{#if success}
		<Alert class="border-green-200 bg-green-50 text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
			<AlertTitle>Succès</AlertTitle>
			<AlertDescription>Livreur créé avec succès. Redirection...</AlertDescription>
		</Alert>
	{/if}

	{#if error}
		<Alert variant="destructive">
			<AlertTitle>Erreur</AlertTitle>
			<AlertDescription>{error}</AlertDescription>
		</Alert>
	{/if}

	<form onsubmit={handleSubmit} class="space-y-6">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<UserCircleIcon class="size-4 text-muted-foreground" />
					Informations du livreur
				</CardTitle>
			</CardHeader>
			<CardContent class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<Label for="name">Nom *</Label>
					<Input
						id="name"
						type="text"
						bind:value={name}
						placeholder="Ex: Jean Dupont"
						required
						disabled={submitting}
					/>
				</div>
				<div class="space-y-2">
					<Label for="phone">Téléphone *</Label>
					<Input
						id="phone"
						type="tel"
						bind:value={phone}
						placeholder="Ex: +33 6 12 34 56 78"
						required
						disabled={submitting}
					/>
				</div>
			</CardContent>
		</Card>

		<div class="flex justify-end gap-3">
			<Button type="button" variant="outline" onclick={() => goto('/drivers')} disabled={submitting}>
				Annuler
			</Button>
			<Button
				type="submit"
				disabled={submitting || !name.trim() || !phone.trim()}
			>
				{submitting ? 'Création...' : 'Créer le livreur'}
			</Button>
		</div>
	</form>
</div>
