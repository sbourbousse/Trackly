<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { initTheme } from '$lib/stores/theme.svelte';
	import '../app.css';

	let { children } = $props();

	$effect(() => {
		if (typeof document !== 'undefined') initTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trackly Business</title>
	<meta
		name="description"
		content="Trackly Business: tableau de bord simple pour gerer les tournees et livraisons."
	/>
</svelte:head>

{@render children()}
