/**
 * API des livraisons pour le suivi client
 */

import { apiClient } from './client';
import type { DeliveryDetailResponse, DeliveryTrackingResponse } from '../types/api';

/**
 * Récupère les détails complets d'une livraison (endpoint PUBLIC pour le client final)
 */
export async function getDeliveryDetail(deliveryId: string): Promise<DeliveryDetailResponse> {
  return apiClient.get<DeliveryDetailResponse>(`/api/public/deliveries/${deliveryId}/tracking`);
}

/**
 * Récupère uniquement le statut de suivi (endpoint public sans auth)
 */
export async function getDeliveryTracking(deliveryId: string): Promise<DeliveryTrackingResponse> {
  return apiClient.get<DeliveryTrackingResponse>(`/api/public/deliveries/${deliveryId}/tracking`);
}
