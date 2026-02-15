<script lang="ts">
  import { offlineState, setOfflineModeReactive } from '../stores/offline.svelte';
  import { userState } from '../stores/user.svelte';
  import { DEMO_BANNER } from '../offline/mockData';
  import { Button } from '$lib/components/ui/button';

  let showBanner = $derived(offlineState.isOffline);

  function disableDemoMode() {
    setOfflineModeReactive(false);
    userState.logout();
  }
</script>

{#if showBanner}
  <div class="fixed top-0 left-0 right-0 z-50 {DEMO_BANNER.color} text-white px-4 py-2 shadow-lg">
    <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
      <span class="text-lg">🔒</span>
      <div class="flex items-center gap-2">
        <span class="font-bold">{DEMO_BANNER.title}</span>
        <span class="text-sm hidden sm:inline">{DEMO_BANNER.message}</span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        class="shrink-0 border-white/30 bg-white/20 text-white hover:bg-white/30 hover:text-white"
        onclick={disableDemoMode}
      >
        Désactiver le mode démo
      </Button>
    </div>
  </div>
  <!-- Spacer to prevent content from being hidden behind banner -->
  <div class="h-12"></div>
{/if}
