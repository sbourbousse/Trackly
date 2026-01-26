export type AuthUser = {
	id: string;
	name: string;
	email: string;
	plan: 'Starter' | 'Pro';
};

export let authState = $state({
	user: null as AuthUser | null,
	isAuthenticated: false,
	tenantId: 'demo',
	lastLoginAt: null as string | null
});

export const authActions = {
	login(user: AuthUser) {
		authState.user = user;
		authState.isAuthenticated = true;
		authState.lastLoginAt = new Date().toISOString();
	},
	logout() {
		authState.user = null;
		authState.isAuthenticated = false;
	},
	switchPlan(plan: AuthUser['plan']) {
		if (!authState.user) return;
		authState.user = { ...authState.user, plan };
	}
};
