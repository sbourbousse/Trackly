import { apiFetch } from './client';
import { browser } from '$app/environment';
import { offlineConfig } from '../offline/config';

export type ApiDriver = {
	id: string;
	name: string;
	phone: string;
};

export type CreateDriverRequest = {
	name: string;
	phone: string;
};

export const getDrivers = async () => {
	if (browser && offlineConfig.enabled) {
		const { mockDriversApi } = await import('../offline/mockApi');
		return await mockDriversApi.getDrivers();
	}
	return await apiFetch<ApiDriver[]>('/api/drivers');
};

export const createDriver = async (request: CreateDriverRequest) => {
	if (browser && offlineConfig.enabled) {
		const { mockDriversApi } = await import('../offline/mockApi');
		return await mockDriversApi.createDriver(request);
	}
	return await apiFetch<ApiDriver>('/api/drivers', {
		method: 'POST',
		body: JSON.stringify(request)
	});
};
