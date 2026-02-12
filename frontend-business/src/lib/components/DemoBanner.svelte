<script lang="ts">
  import { offlineState } from '../stores/offline.svelte';
  import { DEMO_BANNER } from '../offline/mockData';
  
  let showBanner = $derived(offlineState.isOffline);
</script>

{#if showBanner}
  <div class="fixed top-0 left-0 right-0 z-50 {DEMO_BANNER.color} text-white px-4 py-2 text-center shadow-lg">
    <div class="flex items-center justify-center gap-2">
      <span class="text-lg">🔒</span>
      <div>
        <span class="font-bold">{DEMO_BANNER.title}</span>
        <span class="text-sm ml-2">{DEMO_BANNER.message}</span>
      </div>
    </div>
  </div>
  <!-- Spacer to prevent content from being hidden behind banner -->
  <div class="h-12"></div>
{/if}
