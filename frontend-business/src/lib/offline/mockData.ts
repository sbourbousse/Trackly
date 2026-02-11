/**
 * Données de démonstration complètement isolées
 * AUCUNE donnée réelle ne doit être accessible en mode démo
 */

import type { ApiOrder, ApiOrderDetail } from '../api/orders';
import type { ApiDelivery, ApiDeliveryDetail } from '../api/deliveries';
import type { ApiDriver } from '../api/drivers';
import type { ApiRoute, ApiRouteDetail } from '../api/routes';

// ⚠️ MODE DÉMO - TOUTES LES DONNÉES SONT FACTICES
export const DEMO_BANNER = {
  title: '🔒 MODE DÉMO',
  message: 'Vous utilisez des données de démonstration fictives. Aucune donnée réelle n\'est affichée.',
  color: 'bg-orange-500'
};

// ID de tenant fictif
export const DEMO_TENANT_ID = 'demo-tenant-fake-001';

// Livreurs fictifs
export const DEMO_DRIVERS: ApiDriver[] = [
  { id: 'demo-driver-001', name: 'Alice Martin', phone: '+33 6 00 00 00 01' },
  { id: 'demo-driver-002', name: 'Bob Bernard', phone: '+33 6 00 00 00 02' },
  { id: 'demo-driver-003', name: 'Carla Dubois', phone: '+33 6 00 00 00 03' }
];

// Clients fictifs (noms générés aléatoirement, aucune correspondance réelle)
const DEMO_CUSTOMERS = [
  { name: 'Entreprise Alpha', address: '1 Place de la Comédie, 34000 Montpellier', phone: '+33 6 11 11 11 11' },
  { name: 'Boutique Beta', address: '25 Rue Foch, 34000 Montpellier', phone: '+33 6 22 22 22 22' },
  { name: 'SARL Gamma', address: '8 Avenue de la Liberté, 34000 Montpellier', phone: '+33 6 33 33 33 33' },
  { name: 'Atelier Delta', address: '42 Rue de l\'Université, 34000 Montpellier', phone: '+33 6 44 44 44 44' },
  { name: 'Librairie Epsilon', address: '15 Boulevard Louis Blanc, 34000 Montpellier', phone: '+33 6 55 55 55 55' },
  { name: 'Café Zêta', address: '3 Rue de la Loge, 34000 Montpellier', phone: '+33 6 66 66 66 66' },
  { name: 'Pharmacie Êta', address: '67 Avenue de Toulouse, 34000 Montpellier', phone: '+33 6 77 77 77 77' },
  { name: 'Boulangerie Thêta', address: '12 Rue de l\'Aiguillerie, 34000 Montpellier', phone: '+33 6 88 88 88 88' }
];

// Commandes fictives
function generateMockOrders(): ApiOrder[] {
  return DEMO_CUSTOMERS.map((customer, index) => ({
    id: `demo-order-${String(index + 1).padStart(3, '0')}`,
    customerName: customer.name,
    address: customer.address,
    orderDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: ['Pending', 'InDelivery', 'Delivered'][Math.floor(Math.random() * 3)]
  }));
}

// Livraisons fictives
function generateMockDeliveries(): ApiDelivery[] {
  return DEMO_CUSTOMERS.slice(0, 5).map((customer, index) => {
    const driver = DEMO_DRIVERS[index % DEMO_DRIVERS.length];
    return {
      id: `demo-delivery-${String(index + 1).padStart(3, '0')}`,
      orderId: `demo-order-${String(index + 1).padStart(3, '0')}`,
      driverId: driver.id,
      routeId: `demo-route-001`,
      status: ['Pending', 'InProgress', 'Completed'][Math.floor(Math.random() * 3)],
      createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: Math.random() > 0.5 ? new Date().toISOString() : null
    };
  });
}

// État interne des données de démo
let mockOrdersState: ApiOrder[] = [];
let mockDeliveriesState: ApiDelivery[] = [];

/**
 * Initialise les données de démo (appelé au démarrage)
 */
export function initMockData(): void {
  mockOrdersState = generateMockOrders();
  mockDeliveriesState = generateMockDeliveries();
  console.log('[Demo] 🎭 Données de démo initialisées - AUCUNE donnée réelle');
}

/**
 * Récupère les commandes de démo
 */
export function getMockOrders(): ApiOrder[] {
  if (mockOrdersState.length === 0) {
    initMockData();
  }
  return [...mockOrdersState];
}

/**
 * Récupère une commande de démo par ID
 */
export function getMockOrderDetail(id: string): ApiOrderDetail | null {
  const order = mockOrdersState.find(o => o.id === id);
  if (!order) return null;
  
  return {
    ...order,
    createdAt: order.orderDate || new Date().toISOString(),
    deliveries: mockDeliveriesState
      .filter(d => d.orderId === id)
      .map(d => ({
        id: d.id,
        driverId: d.driverId,
        driverName: DEMO_DRIVERS.find(drv => drv.id === d.driverId)?.name || 'Inconnu',
        status: d.status,
        createdAt: d.createdAt,
        completedAt: d.completedAt
      }))
  };
}

/**
 * Crée une nouvelle commande de démo
 */
export function createMockOrder(data: {
  customerName: string;
  address: string;
  phoneNumber?: string | null;
  internalComment?: string | null;
  orderDate?: string | null;
}): ApiOrder {
  const newOrder: ApiOrder = {
    id: `demo-order-${Date.now()}`,
    customerName: data.customerName,
    address: data.address,
    orderDate: data.orderDate || new Date().toISOString(),
    status: 'Pending'
  };
  mockOrdersState.unshift(newOrder);
  return newOrder;
}

/**
 * Supprime des commandes de démo
 */
export function deleteMockOrders(ids: string[]): void {
  mockOrdersState = mockOrdersState.filter(o => !ids.includes(o.id));
  // Supprimer aussi les livraisons associées
  mockDeliveriesState = mockDeliveriesState.filter(d => !ids.includes(d.orderId));
}

/**
 * Importe des commandes de démo
 */
export function importMockOrders(orders: Array<{
  customerName: string;
  address: string;
  phoneNumber?: string | null;
  internalComment?: string | null;
  orderDate?: string | null;
}>): ApiOrder[] {
  const newOrders = orders.map((o, index) => ({
    id: `demo-order-import-${Date.now()}-${index}`,
    customerName: o.customerName,
    address: o.address,
    orderDate: o.orderDate || new Date().toISOString(),
    status: 'Pending' as const
  }));
  mockOrdersState.unshift(...newOrders);
  return newOrders;
}

/**
 * Récupère les livraisons de démo
 */
export function getMockDeliveries(): ApiDelivery[] {
  if (mockDeliveriesState.length === 0) {
    initMockData();
  }
  return [...mockDeliveriesState];
}

/**
 * Récupère une livraison de démo par ID
 */
export function getMockDeliveryById(id: string): ApiDeliveryDetail | null {
  const delivery = mockDeliveriesState.find(d => d.id === id);
  if (!delivery) return null;
  
  const order = mockOrdersState.find(o => o.id === delivery.orderId);
  const driver = DEMO_DRIVERS.find(d => d.id === delivery.driverId);
  
  return {
    id: delivery.id,
    orderId: delivery.orderId,
    driverId: delivery.driverId,
    routeId: delivery.routeId,
    sequence: 0,
    status: delivery.status,
    createdAt: delivery.createdAt,
    completedAt: delivery.completedAt,
    customerName: order?.customerName || 'Client inconnu',
    address: order?.address || 'Adresse inconnue',
    driverName: driver?.name || 'Livreur inconnu'
  };
}

/**
 * Démarre une livraison de démo
 */
export function startMockDelivery(id: string): ApiDelivery | null {
  const delivery = mockDeliveriesState.find(d => d.id === id);
  if (delivery) {
    delivery.status = 'InProgress';
    return delivery;
  }
  return null;
}

/**
 * Complète une livraison de démo
 */
export function completeMockDelivery(id: string): void {
  const delivery = mockDeliveriesState.find(d => d.id === id);
  if (delivery) {
    delivery.status = 'Completed';
    delivery.completedAt = new Date().toISOString();
  }
}

/**
 * Récupère les livreurs de démo
 */
export function getMockDrivers(): ApiDriver[] {
  return [...DEMO_DRIVERS];
}

/**
 * Récupère les tournées de démo
 */
export function getMockRoutes(): ApiRoute[] {
  return [{
    id: 'demo-route-001',
    name: 'Tournée Centre-Ville',
    driverId: 'demo-driver-001',
    date: new Date().toISOString().split('T')[0],
    status: 'Active'
  }];
}

/**
 * Récupère le détail d'une tournée de démo
 */
export function getMockRouteById(id: string): ApiRouteDetail | null {
  if (id !== 'demo-route-001') return null;
  
  const deliveries = mockDeliveriesState.filter(d => d.routeId === id);
  
  return {
    id: 'demo-route-001',
    name: 'Tournée Centre-Ville',
    driverId: 'demo-driver-001',
    driverName: 'Alice Martin',
    date: new Date().toISOString().split('T')[0],
    status: 'Active',
    deliveries: deliveries.map((d, index) => ({
      id: d.id,
      orderId: d.orderId,
      status: d.status,
      sequence: index,
      customerName: DEMO_CUSTOMERS[index]?.name || 'Client',
      address: DEMO_CUSTOMERS[index]?.address || 'Adresse'
    }))
  };
}

/**
 * Réordonne les livraisons d'une tournée de démo
 */
export function reorderMockDeliveries(routeId: string, deliveryIds: string[]): void {
  if (routeId !== 'demo-route-001') return;
  
  deliveryIds.forEach((id, index) => {
    const delivery = mockDeliveriesState.find(d => d.id === id);
    if (delivery) {
      delivery.sequence = index;
    }
  });
}

// Alias pour compatibilité avec mockApi.ts
export const getMockRouteDetail = getMockRouteById;
export const getMockDeliveryDetail = getMockDeliveryById;

/**
 * Crée des livraisons de démo
 */
export function createMockDeliveries(driverId: string, orderIds: string[]): { created: number; deliveries: typeof mockDeliveriesState } {
  const newDeliveries = orderIds.map((orderId, index) => ({
    id: `demo-delivery-${Date.now()}-${index}`,
    orderId,
    driverId,
    routeId: 'demo-route-001',
    status: 'Pending' as const,
    createdAt: new Date().toISOString(),
    completedAt: null as string | null
  }));
  
  mockDeliveriesState.push(...newDeliveries);
  return { created: newDeliveries.length, deliveries: mockDeliveriesState };
}

/**
 * Supprime des livraisons de démo
 */
export function deleteMockDeliveries(ids: string[]): number {
  const initialLength = mockDeliveriesState.length;
  mockDeliveriesState = mockDeliveriesState.filter(d => !ids.includes(d.id));
  return initialLength - mockDeliveriesState.length;
}

/**
 * Crée un livreur de démo
 */
export function createMockDriver(request: { name: string; phone: string }): ApiDriver {
  const newDriver: ApiDriver = {
    id: `demo-driver-${Date.now()}`,
    name: request.name,
    phone: request.phone
  };
  DEMO_DRIVERS.push(newDriver);
  return newDriver;
}

/**
 * Export du nom de la compagnie démo
 */
export const DEMO_COMPANY_NAME = 'Démo Transport SA';

// Réordonner avec le nom exact utilisé dans mockApi
export const reorderMockRouteDeliveries = reorderMockDeliveries;

// Initialiser les données au chargement
initMockData();
