/**
 * API Mock pour le mode offline - Business
 * Intercepte les appels API et retourne des données de démonstration
 */

import type { ApiOrder, ApiOrderDetail, CreateOrderRequest, OrdersListFilters, ImportOrderRequest, DeleteOrdersBatchRequest } from '../api/orders';
import type { ApiDelivery, ApiDeliveryDetail, DeliveriesListFilters, CreateDeliveriesBatchRequest, DeleteDeliveriesBatchRequest } from '../api/deliveries';
import type { RoutesListFilters } from '../api/routes';
import type { ApiDriver, CreateDriverRequest } from '../api/drivers';
import type { AuthResponse, AuthLoginPayload, AuthRegisterPayload } from '../api/client';
import { offlineConfig } from './config';
import {
  getMockOrders,
  getMockOrderDetail,
  createMockOrder,
  deleteMockOrders,
  getMockDeliveries,
  getMockDeliveryDetail,
  createMockDeliveries,
  deleteMockDeliveries,
  getMockRoutes,
  getMockRouteDetail,
  reorderMockRouteDeliveries,
  getMockDrivers,
  createMockDriver,
  DEMO_TENANT_ID,
  DEMO_COMPANY_NAME
} from './mockData';

/**
 * Simule un délai réseau
 */
function delay(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, offlineConfig.mockDelay));
}

/**
 * Mock pour l'API d'authentification
 */
export const mockAuthApi = {
  async login(payload: AuthLoginPayload): Promise<AuthResponse> {
    console.log('[Mock API] POST /api/auth/login');
    await delay();
    
    // Accepter n'importe quel login en mode démo
    return {
      token: 'demo-token-' + Date.now(),
      tenantId: DEMO_TENANT_ID,
      userId: 'demo-user-001',
      name: 'Utilisateur Démo',
      email: payload.email
    };
  },

  async register(payload: AuthRegisterPayload): Promise<AuthResponse> {
    console.log('[Mock API] POST /api/auth/register');
    await delay();
    
    return {
      token: 'demo-token-' + Date.now(),
      tenantId: DEMO_TENANT_ID,
      userId: 'demo-user-001',
      name: payload.name,
      email: payload.email
    };
  }
};

/**
 * Mock pour l'API des commandes
 */
export const mockOrdersApi = {
  async getOrders(filters?: OrdersListFilters): Promise<ApiOrder[]> {
    console.log('[Mock API] GET /api/orders', filters);
    await delay();
    
    // Passer les filtres directement à getMockOrders
    return getMockOrders(filters);
  },

  async getOrder(id: string): Promise<ApiOrderDetail> {
    console.log(`[Mock API] GET /api/orders/${id}`);
    await delay();
    
    const order = getMockOrderDetail(id);
    if (!order) {
      throw new Error(`Commande ${id} introuvable`);
    }
    
    return order;
  },

  async createOrder(request: CreateOrderRequest): Promise<ApiOrder> {
    console.log('[Mock API] POST /api/orders', request);
    await delay();
    
    return createMockOrder(request);
  },

  async importOrders(orders: ImportOrderRequest[]): Promise<{ created: number; errors: string[]; orders: ApiOrder[] }> {
    console.log('[Mock API] POST /api/orders/import', orders.length, 'commandes');
    await delay();
    
    const createdOrders = orders.map(o => createMockOrder(o));
    return {
      created: createdOrders.length,
      errors: [],
      orders: createdOrders
    };
  },

  async deleteOrdersBatch(request: DeleteOrdersBatchRequest): Promise<{ deleted: number; deletedDeliveries: number; skipped: number; message: string }> {
    console.log('[Mock API] POST /api/orders/batch/delete', request);
    await delay();
    
    const result = deleteMockOrders(request.ids);
    return {
      deleted: result.deleted,
      deletedDeliveries: result.deletedDeliveries,
      skipped: 0,
      message: `${result.deleted} commande(s) supprimée(s)`
    };
  },

  async getOrdersStats(filters?: OrdersListFilters): Promise<{ byDay: { date: string; count: number }[]; byHour: { hour: string; count: number }[] }> {
    console.log('[Mock API] GET /api/orders/stats', filters);
    await delay();
    
    // Récupérer les commandes filtrées
    const orders = getMockOrders(filters);
    
    // Générer les stats par jour
    const ordersByDay = new Map<string, number>();
    orders.forEach(order => {
      if (!order.orderDate) return;
      const dateStr = new Date(order.orderDate).toISOString().split('T')[0];
      ordersByDay.set(dateStr, (ordersByDay.get(dateStr) || 0) + 1);
    });
    
    const byDay = Array.from(ordersByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Générer les stats par heure
    const ordersByHour = new Map<number, number>();
    orders.forEach(order => {
      if (!order.orderDate) return;
      const hour = new Date(order.orderDate).getHours();
      ordersByHour.set(hour, (ordersByHour.get(hour) || 0) + 1);
    });
    
    const byHour = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      count: ordersByHour.get(i) || 0
    }));
    
    return { byDay, byHour };
  }
};

/**
 * Mock pour l'API des livraisons
 */
export const mockDeliveriesApi = {
  async getDeliveries(filters?: DeliveriesListFilters): Promise<ApiDelivery[]> {
    console.log('[Mock API] GET /api/deliveries', filters);
    await delay();
    
    // Passer les filtres directement à getMockDeliveries
    return getMockDeliveries(filters);
  },

  async getDelivery(id: string): Promise<ApiDeliveryDetail> {
    console.log(`[Mock API] GET /api/deliveries/${id}`);
    await delay();
    
    const delivery = getMockDeliveryDetail(id);
    if (!delivery) {
      throw new Error(`Livraison ${id} introuvable`);
    }
    
    return delivery;
  },

  async createDeliveriesBatch(request: CreateDeliveriesBatchRequest): Promise<{ created: number; deliveries: ApiDelivery[] }> {
    console.log('[Mock API] POST /api/deliveries/batch', request);
    await delay();
    
    return createMockDeliveries(request.driverId, request.orderIds);
  },

  async deleteDelivery(id: string): Promise<{ message: string }> {
    console.log(`[Mock API] DELETE /api/deliveries/${id}`);
    await delay();
    
    const deleted = deleteMockDeliveries([id]);
    return { message: `Livraison supprimée` };
  },

  async deleteDeliveriesBatch(request: DeleteDeliveriesBatchRequest): Promise<{ deleted: number; message: string }> {
    console.log('[Mock API] POST /api/deliveries/batch/delete', request);
    await delay();
    
    const deleted = deleteMockDeliveries(request.ids);
    return {
      deleted,
      message: `${deleted} livraison(s) supprimée(s)`
    };
  }
};

/**
 * Mock pour l'API des tournées (routes)
 */
export const mockRoutesApi = {
  async getRoutes(filters?: RoutesListFilters): Promise<import('../api/routes').ApiRoute[]> {
    console.log('[Mock API] GET /api/routes', filters);
    await delay();
    return getMockRoutes(filters);
  },
  async getRoute(routeId: string): Promise<import('../api/routes').ApiRouteDetail> {
    console.log('[Mock API] GET /api/routes/' + routeId);
    await delay();
    const detail = getMockRouteDetail(routeId);
    if (!detail) throw new Error('Tournée introuvable.');
    return detail;
  },
  async reorderRouteDeliveries(routeId: string, deliveryIds: string[]): Promise<{ message: string }> {
    console.log('[Mock API] PATCH /api/routes/' + routeId + '/deliveries/order', deliveryIds);
    await delay();
    reorderMockRouteDeliveries(routeId, deliveryIds);
    return { message: 'Ordre mis à jour.' };
  }
};

/**
 * Mock pour l'API des drivers
 */
export const mockDriversApi = {
  async getDrivers(): Promise<ApiDriver[]> {
    console.log('[Mock API] GET /api/drivers');
    await delay();
    
    return getMockDrivers();
  },

  async createDriver(request: CreateDriverRequest): Promise<ApiDriver> {
    console.log('[Mock API] POST /api/drivers', request);
    await delay();
    
    return createMockDriver(request);
  }
};

/**
 * Mock pour l'API du tenant
 */
export const mockTenantApi = {
  async getTenantId(): Promise<string> {
    console.log('[Mock API] Tenant ID demandé');
    await delay();
    return DEMO_TENANT_ID;
  },

  async getDefaultTenant(): Promise<{ id: string }> {
    console.log('[Mock API] GET /api/tenants/default');
    await delay();
    return { id: DEMO_TENANT_ID };
  }
};
