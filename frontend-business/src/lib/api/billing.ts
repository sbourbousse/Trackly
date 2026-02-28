import { apiFetch } from './client';
import { browser } from '$app/environment';
import { isOfflineMode } from '../offline/config';

export type DeliveryQuotaResponse = {
	plan: string;
	monthlyLimit: number | null;
	usedThisMonth: number;
	remaining: number | null;
};

export const getDeliveryQuota = async (): Promise<DeliveryQuotaResponse> => {
	if (browser && isOfflineMode()) {
		const { mockBillingApi } = await import('../offline/mockApi');
		return await mockBillingApi.getDeliveryQuota();
	}
	return apiFetch<DeliveryQuotaResponse>('/api/billing/quota');
};
