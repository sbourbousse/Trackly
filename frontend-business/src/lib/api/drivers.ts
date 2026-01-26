import { apiFetch } from './client';

export type ApiDriver = {
	id: string;
	name: string;
	phone: string;
};

export const getDrivers = async () => {
	return await apiFetch<ApiDriver[]>('/api/drivers');
};
