import { browser } from '$app/environment';

interface User {
	id: string;
	name: string;
	email: string;
}

interface Tenant {
	id: string;
	name: string;
}

// Mock user data for demo
const mockUser: User = {
	id: 'user-001',
	name: 'Sylvain Bourbousse',
	email: 'sbourbousse@gmail.com'
};

const mockTenant: Tenant = {
	id: 'tenant-550e8400-e29b-41d4-a716-446655440000',
	name: 'Trackly Demo'
};

// Simple store
let user = $state<User | null>(mockUser);
let tenant = $state<Tenant | null>(mockTenant);

export const userState = {
	get user() {
		return user;
	},
	get tenant() {
		return tenant;
	},
	setUser(u: User | null) {
		user = u;
	},
	setTenant(t: Tenant | null) {
		tenant = t;
	}
};
