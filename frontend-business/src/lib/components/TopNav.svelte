<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/orders', label: 'Commandes' },
		{ href: '/deliveries', label: 'Tournees' }
	];

	let { title, subtitle } = $props<{
		title: string;
		subtitle?: string;
	}>();

	let pathname = $derived(page.url.pathname);
</script>

<header class="topbar">
	<div class="topbar-title">
		<h1>{title}</h1>
		{#if subtitle}
			<p>{subtitle}</p>
		{/if}
	</div>
	<nav class="topbar-nav">
		{#each links as link}
			<a class:active={pathname === link.href} href={link.href}>
				{link.label}
			</a>
		{/each}
	</nav>
</header>
