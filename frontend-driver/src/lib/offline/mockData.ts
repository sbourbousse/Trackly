/**
 * Données de démonstration pour le mode offline
 * Toutes les données factices sont centralisées ici
 */

import type { ApiDelivery, ApiDeliveryDetail } from '../api/deliveries';

// ID du chauffeur de démo
export const DEMO_DRIVER_ID = 'demo-driver-001';
export const DEMO_DRIVER_NAME = 'Jean Martin';
export const DEMO_TENANT_ID = 'demo-tenant-001';

/**
 * Génère des livraisons de démonstration
 */
export function getMockDeliveries(): ApiDelivery[] {
  return [
    {
      id: 'delivery-001',
      orderId: 'order-001',
      driverId: DEMO_DRIVER_ID,
      status: 'Pending',
      completedAt: null
    },
    {
      id: 'delivery-002',
      orderId: 'order-002',
      driverId: DEMO_DRIVER_ID,
      status: 'InProgress',
      completedAt: null
    },
    {
      id: 'delivery-003',
      orderId: 'order-003',
      driverId: DEMO_DRIVER_ID,
      status: 'Pending',
      completedAt: null
    },
    {
      id: 'delivery-004',
      orderId: 'order-004',
      driverId: DEMO_DRIVER_ID,
      status: 'Completed',
      completedAt: new Date(Date.now() - 3600000).toISOString() // Il y a 1h
    },
    {
      id: 'delivery-005',
      orderId: 'order-005',
      driverId: DEMO_DRIVER_ID,
      status: 'Completed',
      completedAt: new Date(Date.now() - 7200000).toISOString() // Il y a 2h
    }
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
    status: delivery.status,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Il y a 1 jour
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
