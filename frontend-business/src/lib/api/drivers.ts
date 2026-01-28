import { apiFetch } from './client';

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
	return await apiFetch<ApiDriver[]>('/api/drivers');
};

export const createDriver = async (request: CreateDriverRequest) => {
	return await apiFetch<ApiDriver>('/api/drivers', {
		method: 'POST',
		body: JSON.stringify(request)
	});
};
