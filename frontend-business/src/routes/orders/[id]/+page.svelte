<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import TopNav from '$lib/components/TopNav.svelte';
	import { getOrder } from '$lib/api/orders';
	import type { ApiOrderDetail } from '$lib/api/orders';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
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

	let order = $state<ApiOrderDetail | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		Pending: 'secondary',
		Planned: 'outline',
		InTransit: 'secondary',
		Delivered: 'default',
		Cancelled: 'destructive',
		'0': 'secondary',
		'1': 'outline',
		'2': 'secondary',
		'3': 'default',
		'4': 'destructive'
	};

	const deliveryStatusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
		Pending: 'secondary',
		InProgress: 'secondary',
		Completed: 'default',
		Failed: 'destructive',
		'0': 'secondary',
		'1': 'secondary',
		'2': 'default',
		'3': 'destructive'
	};

	const statusLabel: Record<string, string> = {
		Pending: 'En attente',
		Planned: 'Planifiée',
		InTransit: 'En transit',
		Delivered: 'Livrée',
		Cancelled: 'Annulée',
		'0': 'En attente',
		'1': 'Planifiée',
		'2': 'En transit',
		'3': 'Livrée',
		'4': 'Annulée'
	};

	const deliveryStatusLabel: Record<string, string> = {
		Pending: 'Prévue',
		InProgress: 'En cours',
		Completed: 'Livrée',
		Failed: 'Échouée',
		'0': 'Prévue',
		'1': 'En cours',
		'2': 'Livrée',
		'3': 'Échouée'
	};

	$effect(() => {
		const orderId = page.params.id;
		if (!orderId) {
			error = 'ID de commande manquant';
			return;
		}
		let cancelled = false;
		loading = true;
		error = null;
		getOrder(orderId)
			.then((data) => {
				if (!cancelled) order = data;
			})
			.catch((err) => {
				if (!cancelled) error = err instanceof Error ? err.message : 'Erreur lors du chargement';
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});
		return () => { cancelled = true; };
	});

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen bg-background p-6 pb-12">
	<div class="mx-auto flex max-w-4xl flex-col gap-6">
		<TopNav title="Détail de la commande" subtitle="Informations complètes et livraisons associées" />

		{#if loading}
			<Card>
				<CardContent class="py-8 text-center text-muted-foreground">Chargement...</CardContent>
			</Card>
		{:else if error}
			<Alert variant="destructive">
				<AlertTitle>Erreur</AlertTitle>
				<AlertDescription>{error}</AlertDescription>
			</Alert>
			<Button variant="outline" onclick={() => goto('/orders')}>Retour à la liste</Button>
		{:else if order}
			<Card>
				<CardHeader class="flex flex-row flex-wrap items-start justify-between gap-4">
					<div>
						<CardTitle>Informations de la commande</CardTitle>
						<p class="mt-1 text-sm text-muted-foreground">
							Référence: {order.id.slice(0, 8).toUpperCase()}
						</p>
					</div>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" onclick={() => goto('/orders')}>Retour</Button>
						<Button size="sm" href="/deliveries/new">Créer une livraison</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div class="grid gap-6 sm:grid-cols-2">
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Client</p>
							<p class="text-lg font-medium">{order.customerName}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Adresse</p>
							<p class="font-medium">{order.address}</p>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Statut</p>
							<Badge variant={statusVariant[order.status] ?? 'outline'}>
								{statusLabel[order.status] ?? order.status}
							</Badge>
						</div>
						<div class="space-y-1">
							<p class="text-sm font-medium text-muted-foreground">Date de création</p>
							<p class="font-medium">{formatDate(order.createdAt)}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle>Livraisons associées</CardTitle>
					<Badge variant="secondary">{order.deliveries.length} livraison{order.deliveries.length > 1 ? 's' : ''}</Badge>
				</CardHeader>
				<CardContent>
					{#if order.deliveries.length === 0}
						<div class="py-8 text-center text-muted-foreground">
							Aucune livraison associée à cette commande.
							<br />
							<Button variant="link" href="/deliveries/new" class="mt-2">Créer une livraison</Button>
						</div>
					{:else}
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Référence</TableHead>
									<TableHead>Livreur</TableHead>
									<TableHead>Statut</TableHead>
									<TableHead class="tabular-nums">Créée le</TableHead>
									<TableHead class="tabular-nums">Livrée le</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{#each order.deliveries as delivery}
									<TableRow>
										<TableCell class="font-mono font-medium">
											<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0 font-normal">
												{delivery.id.slice(0, 8).toUpperCase()}
											</Button>
										</TableCell>
										<TableCell>{delivery.driverName ?? 'Non assigné'}</TableCell>
										<TableCell>
											<Badge variant={deliveryStatusVariant[delivery.status] ?? 'outline'}>
												{deliveryStatusLabel[delivery.status] ?? delivery.status}
											</Badge>
										</TableCell>
										<TableCell class="tabular-nums">{formatDate(delivery.createdAt)}</TableCell>
										<TableCell class="tabular-nums">
											{delivery.completedAt ? formatDate(delivery.completedAt) : '–'}
										</TableCell>
										<TableCell>
											<Button variant="link" href="/deliveries/{delivery.id}" class="h-auto p-0">Voir détails</Button>
										</TableCell>
									</TableRow>
								{/each}
							</TableBody>
						</Table>
					{/if}
				</CardContent>
			</Card>
		{/if}
	</div>
</div>
