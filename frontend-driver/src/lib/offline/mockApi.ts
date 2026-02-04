/**
 * API Mock pour le mode offline
 * Intercepte les appels API et retourne des données de démonstration
 */

import type { ApiDelivery, ApiDeliveryDetail } from '../api/deliveries';
import { offlineConfig } from './config';
import {
  getCurrentMockDeliveries,
  getMockDeliveryDetail,
  getMockRouteDetail,
  updateMockDeliveryStatus,
  DEMO_TENANT_ID
} from './mockData';

/**
 * Simule un délai réseau
 */
function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, offlineConfig.mockDelay));
}

/**
 * Mock pour l'API des livraisons
 */
export const mockDeliveriesApi = {
  /**
   * Récupère la liste des livraisons (optionnel driverId pour filtrer)
   */
  async getDeliveries(driverId?: string | null): Promise<ApiDelivery[]> {
    console.log('[Mock API] GET /api/deliveries', driverId ? { driverId } : '');
    await delay();
    const list = getCurrentMockDeliveries();
    if (!driverId) return list;
    return list.filter(d => d.driverId === driverId);
  },

  /**
   * Récupère les détails d'une livraison
   */
  async getDelivery(id: string): Promise<ApiDeliveryDetail> {
    console.log(`[Mock API] GET /api/deliveries/${id}`);
    await delay();
    
    const delivery = getMockDeliveryDetail(id);
    if (!delivery) {
      throw new Error(`Livraison ${id} introuvable`);
    }
    
    return delivery;
  },

  /**
   * Démarre une livraison
   */
  async startDelivery(id: string): Promise<ApiDelivery> {
    console.log(`[Mock API] PATCH /api/deliveries/${id}/start`);
    await delay();
    
    const updated = updateMockDeliveryStatus(id, 'InProgress');
    if (!updated) {
      throw new Error(`Livraison ${id} introuvable`);
    }
    
    return updated;
  },

  /**
   * Complète une livraison
   */
  async completeDelivery(id: string): Promise<void> {
    console.log(`[Mock API] PATCH /api/deliveries/${id}/complete`);
    await delay();
    
    const updated = updateMockDeliveryStatus(id, 'Completed');
    if (!updated) {
      throw new Error(`Livraison ${id} introuvable`);
    }
  }
};

/**
 * Mock pour l'API des tournées (détail pour progress X/Y livrées)
 */
export const mockRoutesApi = {
  async getRoute(routeId: string): Promise<import('../api/routes').ApiRouteDetail> {
    console.log('[Mock API] GET /api/routes/' + routeId);
    await delay();
    const detail = getMockRouteDetail(routeId);
    if (!detail) throw new Error('Tournée introuvable.');
    return detail;
  }
};

/**
 * Mock pour l'API du tenant
 */
export const mockTenantApi = {
  /**
   * Récupère le tenant ID
   */
  async getTenantId(): Promise<string> {
    console.log('[Mock API] Tenant ID demandé');
    await delay();
    return DEMO_TENANT_ID;
  },

  /**
   * Récupère le tenant ID d'un driver
   */
  async getDriverTenantId(driverId: string): Promise<{ tenantId: string }> {
    console.log(`[Mock API] GET /api/drivers/${driverId}/tenant`);
    await delay();
    return { tenantId: DEMO_TENANT_ID };
  }
};
