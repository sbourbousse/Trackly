export let periodSidebarState = $state({
	open: false
});

export const periodSidebarActions = {
	toggle() {
		periodSidebarState.open = !periodSidebarState.open;
	},
	open() {
		periodSidebarState.open = true;
	},
	close() {
		periodSidebarState.open = false;
	}
};
