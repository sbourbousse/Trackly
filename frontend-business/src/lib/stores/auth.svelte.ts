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
	token: null as string | null,
	lastLoginAt: null as string | null
});

export const authActions = {
	login(user: AuthUser) {
		authState.user = user;
		authState.isAuthenticated = true;
		authState.lastLoginAt = new Date().toISOString();
	},
	setToken(token: string | null) {
		authState.token = token;
	},
	setTenantId(tenantId: string) {
		authState.tenantId = tenantId;
	},
	logout() {
		authState.user = null;
		authState.isAuthenticated = false;
		authState.token = null;
		if (typeof localStorage !== 'undefined') {
			localStorage.removeItem('trackly_auth_token');
		}
		if (typeof sessionStorage !== 'undefined') {
			sessionStorage.removeItem('trackly_auth_token');
		}
	},
	switchPlan(plan: AuthUser['plan']) {
		if (!authState.user) return;
		authState.user = { ...authState.user, plan };
	}
};
