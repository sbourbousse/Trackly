/**
 * Données de démonstration pour le mode offline
 * Toutes les données factices sont centralisées ici
 */

import type { ApiDelivery, ApiDeliveryDetail } from '../api/deliveries';

// ID du chauffeur de démo
export const DEMO_DRIVER_ID = 'demo-driver-001';
export const DEMO_DRIVER_NAME = 'Jean Martin';
export const DEMO_TENANT_ID = 'demo-tenant-001';

// Tournée de démo (pour progress X/Y livrées)
const DEMO_ROUTE_ID = 'route-demo-001';
const now = () => new Date(Date.now() - 86400000).toISOString();

/**
 * Génère des livraisons de démonstration (avec routeId et sequence pour la tournée)
 */
export function getMockDeliveries(): ApiDelivery[] {
  return [
    { id: 'delivery-001', orderId: 'order-001', driverId: DEMO_DRIVER_ID, routeId: DEMO_ROUTE_ID, sequence: 0, status: 'Pending', createdAt: now(), completedAt: null },
    { id: 'delivery-002', orderId: 'order-002', driverId: DEMO_DRIVER_ID, routeId: DEMO_ROUTE_ID, sequence: 1, status: 'InProgress', createdAt: now(), completedAt: null },
    { id: 'delivery-003', orderId: 'order-003', driverId: DEMO_DRIVER_ID, routeId: DEMO_ROUTE_ID, sequence: 2, status: 'Pending', createdAt: now(), completedAt: null },
    { id: 'delivery-004', orderId: 'order-004', driverId: DEMO_DRIVER_ID, routeId: DEMO_ROUTE_ID, sequence: 3, status: 'Completed', createdAt: now(), completedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'delivery-005', orderId: 'order-005', driverId: DEMO_DRIVER_ID, routeId: DEMO_ROUTE_ID, sequence: 4, status: 'Completed', createdAt: now(), completedAt: new Date(Date.now() - 7200000).toISOString() }
  ];
}

/**
 * Génère les détails d'une livraison de démonstration
 */
export function getMockDeliveryDetail(id: string): ApiDeliveryDetail | null {
  const deliveries = getMockDeliveries();
  const delivery = deliveries.find(d => d.id === id);
  
  if (!delivery) {
    return null;
  }

  const mockAddresses: Record<string, string> = {
    'delivery-001': '123 Rue de la Paix, 75002 Paris',
    'delivery-002': '45 Avenue des Champs-Élysées, 75008 Paris',
    'delivery-003': '78 Boulevard Saint-Germain, 75005 Paris',
    'delivery-004': '12 Rue du Commerce, 75015 Paris',
    'delivery-005': '56 Rue de Rivoli, 75004 Paris'
  };

  const mockCustomers: Record<string, string> = {
    'delivery-001': 'Sophie Dubois',
    'delivery-002': 'Marc Leroy',
    'delivery-003': 'Marie Lambert',
    'delivery-004': 'Pierre Rousseau',
    'delivery-005': 'Claire Bernard'
  };

  return {
    id: delivery.id,
    orderId: delivery.orderId,
    driverId: delivery.driverId,
    routeId: delivery.routeId ?? undefined,
    sequence: delivery.sequence ?? undefined,
    status: delivery.status,
    createdAt: (delivery as ApiDelivery & { createdAt?: string }).createdAt ?? new Date(Date.now() - 86400000).toISOString(),
    completedAt: delivery.completedAt,
    customerName: mockCustomers[id] || 'Client Démo',
    address: mockAddresses[id] || '1 Rue Exemple, 75001 Paris',
    driverName: DEMO_DRIVER_NAME
  };
}

// État mutable pour les livraisons (permet de mettre à jour lors des actions)
let mockDeliveriesState = getMockDeliveries();

/**
 * Met à jour le statut d'une livraison
 */
export function updateMockDeliveryStatus(id: string, status: string): ApiDelivery | null {
  const delivery = mockDeliveriesState.find(d => d.id === id);
  if (delivery) {
    delivery.status = status;
    if (status === 'Completed') {
      delivery.completedAt = new Date().toISOString();
    }
    return delivery;
  }
  return null;
}

/**
 * Réinitialise les données de démonstration
 */
export function resetMockData(): void {
  mockDeliveriesState = getMockDeliveries();
  console.log('[Offline] Données de démonstration réinitialisées');
}

/**
 * Obtient l'état actuel des livraisons
 */
export function getCurrentMockDeliveries(): ApiDelivery[] {
  return mockDeliveriesState;
}

/**
 * Détail d'une tournée (pour progress "X / Y livrées" dans l'app chauffeur)
 */
export function getMockRouteDetail(routeId: string): import('../api/routes').ApiRouteDetail | null {
  const deliveries = mockDeliveriesState
    .filter(d => d.routeId === routeId)
    .sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));
  if (deliveries.length === 0) return null;
  const mockAddresses: Record<string, string> = {
    'delivery-001': '123 Rue de la Paix, 75002 Paris',
    'delivery-002': '45 Avenue des Champs-Élysées, 75008 Paris',
    'delivery-003': '78 Boulevard Saint-Germain, 75005 Paris',
    'delivery-004': '12 Rue du Commerce, 75015 Paris',
    'delivery-005': '56 Rue de Rivoli, 75004 Paris'
  };
  const mockCustomers: Record<string, string> = {
    'delivery-001': 'Sophie Dubois',
    'delivery-002': 'Marc Leroy',
    'delivery-003': 'Marie Lambert',
    'delivery-004': 'Pierre Rousseau',
    'delivery-005': 'Claire Bernard'
  };
  return {
    id: routeId,
    driverId: deliveries[0].driverId,
    name: 'Tournée démo',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    driverName: DEMO_DRIVER_NAME,
    deliveries: deliveries.map(d => ({
      id: d.id,
      orderId: d.orderId,
      sequence: d.sequence ?? null,
      status: d.status,
      createdAt: (d as ApiDelivery & { createdAt?: string }).createdAt ?? new Date().toISOString(),
      completedAt: d.completedAt,
      customerName: mockCustomers[d.id] || 'Client',
      address: mockAddresses[d.id] || 'Adresse'
    }))
  };
}
