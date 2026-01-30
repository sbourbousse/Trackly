<script lang="ts">
	import TopNav from '$lib/components/TopNav.svelte';
	import { goto } from '$app/navigation';
	import { createOrder } from '$lib/api/orders';
	import { ordersActions } from '$lib/stores/orders.svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	let customerName = $state('');
	let address = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!customerName.trim() || !address.trim()) {
			error = "Le nom du client et l'adresse sont obligatoires";
			return;
		}
		submitting = true;
		error = null;
		try {
			await createOrder({
				customerName: customerName.trim(),
				address: address.trim()
			});
			await ordersActions.loadOrders();
			goto('/orders');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Erreur lors de la création de la commande';
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		goto('/orders');
	}
</script>

<div class="min-h-screen bg-background p-6 pb-12">
	<div class="mx-auto flex max-w-2xl flex-col gap-6">
		<TopNav title="Nouvelle commande" subtitle="Créer une nouvelle commande à livrer." />

		<Card>
			<CardHeader>
				<CardTitle>Informations de la commande</CardTitle>
				<CardDescription>Renseignez le client et l'adresse de livraison.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="space-y-2">
						<Label for="customer">Nom du client *</Label>
						<Input
							id="customer"
							type="text"
							bind:value={customerName}
							placeholder="Ex: Atelier Moreau"
							required
							disabled={submitting}
						/>
					</div>
					<div class="space-y-2">
						<Label for="address">Adresse de livraison *</Label>
						<textarea
							id="address"
							bind:value={address}
							placeholder="Ex: 12 Rue des Tanneurs, 75003 Paris"
							required
							disabled={submitting}
							rows="3"
							class="border-input ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-20 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-y"
						></textarea>
					</div>

					{#if error}
						<Alert variant="destructive">
							<AlertTitle>Erreur</AlertTitle>
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					{/if}

					<div class="flex justify-end gap-3 pt-2">
						<Button type="button" variant="outline" onclick={handleCancel} disabled={submitting}>
							Annuler
						</Button>
						<Button
							type="submit"
							disabled={submitting || !customerName.trim() || !address.trim()}
						>
							{submitting ? 'Création...' : 'Créer la commande'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</div>
</div>
