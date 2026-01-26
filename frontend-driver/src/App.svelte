<script lang="ts">
	import Login from './pages/Login.svelte';
	import Deliveries from './pages/Deliveries.svelte';
	import DeliveryDetail from './pages/DeliveryDetail.svelte';

	let currentPage = $state<'login' | 'deliveries' | 'delivery-detail'>('login');
	let selectedDeliveryId = $state<string | null>(null);
	let driverId = $state<string | null>(null);

	function handleLogin(id: string) {
		driverId = id;
		currentPage = 'deliveries';
	}

	function handleLogout() {
		driverId = null;
		currentPage = 'login';
	}

	function handleDeliverySelect(id: string) {
		selectedDeliveryId = id;
		currentPage = 'delivery-detail';
	}

	function handleBack() {
		if (currentPage === 'delivery-detail') {
			currentPage = 'deliveries';
			selectedDeliveryId = null;
		}
	}
</script>

{#if currentPage === 'login'}
	<Login on:login={(e) => handleLogin(e.detail)} />
{:else if currentPage === 'deliveries'}
	<Deliveries {driverId} on:logout={handleLogout} on:select={(e) => handleDeliverySelect(e.detail)} />
{:else if currentPage === 'delivery-detail' && selectedDeliveryId}
	<DeliveryDetail {driverId} deliveryId={selectedDeliveryId} on:back={handleBack} />
{/if}
