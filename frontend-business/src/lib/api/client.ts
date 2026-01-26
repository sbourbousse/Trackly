import { PUBLIC_API_BASE_URL } from '$env/static/public';

const baseUrl = PUBLIC_API_BASE_URL || 'http://localhost:5257';

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public details?: string
	) {
		super(message);
	}
}

export const apiFetch = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
	const response = await fetch(`${baseUrl}${path}`, {
		headers: {
			'Content-Type': 'application/json',
			...init.headers
		},
		...init
	});

	if (!response.ok) {
		const details = await response.text();
		throw new ApiError('Erreur API', response.status, details);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
};
