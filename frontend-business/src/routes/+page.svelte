<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
</script>

<div class="min-h-screen bg-background p-6">
	<div class="mx-auto max-w-md">
		<Card>
			<CardHeader>
				<CardTitle>Redirection en cours...</CardTitle>
			</CardHeader>
			<CardContent class="space-y-2">
				<p class="text-sm text-muted-foreground">
					Si rien ne se passe, ouvre directement le dashboard.
				</p>
				<Button href="/dashboard">Aller au dashboard</Button>
			</CardContent>
		</Card>
	</div>
</div>
