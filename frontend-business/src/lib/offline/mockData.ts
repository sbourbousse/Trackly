/**
 * Données de démonstration pour le mode offline - Business
 * Toutes les données factices sont centralisées ici
 */

import type { ApiOrder, ApiOrderDetail } from '../api/orders';
import type { ApiDelivery, ApiDeliveryDetail } from '../api/deliveries';
import type { ApiDriver } from '../api/drivers';

// Tenant de démo
export const DEMO_TENANT_ID = 'demo-tenant-001';
export const DEMO_COMPANY_NAME = 'Demo Transport SA';

// Drivers de démo
export const DEMO_DRIVERS: ApiDriver[] = [
  {
    id: 'driver-001',
    name: 'Jean Martin',
    phone: '+33 6 12 34 56 78'
  },
  {
    id: 'driver-002',
    name: 'Marie Dupont',
    phone: '+33 6 23 45 67 89'
  },
  {
    id: 'driver-003',
    name: 'Pierre Durand',
    phone: '+33 6 34 56 78 90'
  }
];

// Commandes de démo
function generateMockOrders(): ApiOrder[] {
  const now = Date.now();
  return [
    {
      id: 'order-001',
      customerName: 'Sophie Dubois',
      address: '123 Rue de la Paix, 75002 Paris',
      orderDate: new Date(now - 86400000).toISOString(),
      status: 'Pending'
    },
    {
      id: 'order-002',
      customerName: 'Marc Leroy',
      address: '45 Avenue des Champs-Élysées, 75008 Paris',
      orderDate: new Date(now - 172800000).toISOString(),
      status: 'InDelivery'
    },
    {
      id: 'order-003',
      customerName: 'Marie Lambert',
      address: '78 Boulevard Saint-Germain, 75005 Paris',
      orderDate: new Date(now - 259200000).toISOString(),
      status: 'Pending'
    },
    {
      id: 'order-004',
      customerName: 'Pierre Rousseau',
      address: '12 Rue du Commerce, 75015 Paris',
      orderDate: new Date(now - 345600000).toISOString(),
      status: 'Delivered'
    },
    {
      id: 'order-005',
      customerName: 'Claire Bernard',
      address: '56 Rue de Rivoli, 75004 Paris',
      orderDate: new Date(now - 432000000).toISOString(),
      status: 'Delivered'
    },
    {
      id: 'order-006',
      customerName: 'Thomas Petit',
      address: '34 Avenue Montaigne, 75008 Paris',
      orderDate: new Date(now).toISOString(),
      status: 'Pending'
    },
    {
      id: 'order-007',
      customerName: 'Emma Roux',
      address: '89 Rue du Faubourg Saint-Honoré, 75008 Paris',
      orderDate: new Date(now - 86400000).toISOString(),
      status: 'Pending'
    },
    {
      id: 'order-008',
      customerName: 'Lucas Moreau',
      address: '23 Boulevard Haussmann, 75009 Paris',
      orderDate: new Date(now - 172800000).toISOString(),
      status: 'Delivered'
    }
  ];
}

// Livraisons de démo
function generateMockDeliveries(): ApiDelivery[] {
  const now = Date.now();
  return [
    {
      id: 'delivery-001',
      orderId: 'order-002',
      driverId: 'driver-001',
      status: 'InProgress',
      createdAt: new Date(now - 3600000).toISOString(),
      completedAt: null
    },
    {
      id: 'delivery-002',
      orderId: 'order-004',
      driverId: 'driver-001',
      status: 'Completed',
      createdAt: new Date(now - 86400000).toISOString(),
      completedAt: new Date(now - 3600000).toISOString()
    },
    {
      id: 'delivery-003',
      orderId: 'order-005',
      driverId: 'driver-002',
      status: 'Completed',
      createdAt: new Date(now - 172800000).toISOString(),
      completedAt: new Date(now - 86400000).toISOString()
    },
    {
      id: 'delivery-004',
      orderId: 'order-008',
      driverId: 'driver-003',
      status: 'Completed',
      createdAt: new Date(now - 259200000).toISOString(),
      completedAt: new Date(now - 172800000).toISOString()
    }
  ];
}

// État mutable
let mockOrdersState = generateMockOrders();
let mockDeliveriesState = generateMockDeliveries();
let mockDriversState = [...DEMO_DRIVERS];

/**
 * Récupère les commandes
 */
export function getMockOrders(): ApiOrder[] {
  return mockOrdersState;
}

/**
 * Récupère les détails d'une commande
 */
export function getMockOrderDetail(id: string): ApiOrderDetail | null {
  const order = mockOrdersState.find(o => o.id === id);
  if (!order) return null;

  const orderDeliveries = mockDeliveriesState
    .filter(d => d.orderId === id)
    .map(d => {
      const driver = mockDriversState.find(dr => dr.id === d.driverId);
      return {
        id: d.id,
        driverId: d.driverId,
        driverName: driver?.name,
        status: d.status,
        createdAt: d.createdAt || new Date().toISOString(),
        completedAt: d.completedAt
      };
    });

  return {
    id: order.id,
    customerName: order.customerName,
    address: order.address,
    orderDate: order.orderDate,
    status: order.status,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    deliveries: orderDeliveries
  };
}

/**
 * Crée une nouvelle commande
 */
export function createMockOrder(data: { customerName: string; address: string; phoneNumber?: string | null; internalComment?: string | null; orderDate?: string | null }): ApiOrder {
  const newOrder: ApiOrder = {
    id: `order-${Date.now()}`,
    customerName: data.customerName,
    address: data.address,
    orderDate: data.orderDate || new Date().toISOString(),
    status: 'Pending'
  };
  mockOrdersState.push(newOrder);
  return newOrder;
}

/**
 * Supprime des commandes
 */
export function deleteMockOrders(ids: string[]): { deleted: number; deletedDeliveries: number } {
  const beforeCount = mockOrdersState.length;
  mockOrdersState = mockOrdersState.filter(o => !ids.includes(o.id));
  const deleted = beforeCount - mockOrdersState.length;

  const beforeDeliveries = mockDeliveriesState.length;
  mockDeliveriesState = mockDeliveriesState.filter(d => !ids.includes(d.orderId));
  const deletedDeliveries = beforeDeliveries - mockDeliveriesState.length;

  return { deleted, deletedDeliveries };
}

/**
 * Récupère les livraisons
 */
export function getMockDeliveries(): ApiDelivery[] {
  return mockDeliveriesState;
}

/**
 * Récupère les détails d'une livraison
 */
export function getMockDeliveryDetail(id: string): ApiDeliveryDetail | null {
  const delivery = mockDeliveriesState.find(d => d.id === id);
  if (!delivery) return null;

  const order = mockOrdersState.find(o => o.id === delivery.orderId);
  const driver = mockDriversState.find(d => d.id === delivery.driverId);

  return {
    id: delivery.id,
    orderId: delivery.orderId,
    driverId: delivery.driverId,
    status: delivery.status,
    createdAt: delivery.createdAt || new Date().toISOString(),
    completedAt: delivery.completedAt,
    customerName: order?.customerName || 'Client inconnu',
    address: order?.address || 'Adresse inconnue',
    driverName: driver?.name || 'Chauffeur inconnu'
  };
}

/**
 * Crée des livraisons en batch
 */
export function createMockDeliveries(driverId: string, orderIds: string[]): { created: number; deliveries: ApiDelivery[] } {
  const newDeliveries: ApiDelivery[] = [];
  
  for (const orderId of orderIds) {
    const order = mockOrdersState.find(o => o.id === orderId);
    if (order && order.status === 'Pending') {
      const delivery: ApiDelivery = {
        id: `delivery-${Date.now()}-${orderId}`,
        orderId,
        driverId,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        completedAt: null
      };
      mockDeliveriesState.push(delivery);
      newDeliveries.push(delivery);
      
      // Mettre à jour le statut de la commande
      order.status = 'InDelivery';
    }
  }

  return { created: newDeliveries.length, deliveries: newDeliveries };
}

/**
 * Supprime des livraisons
 */
export function deleteMockDeliveries(ids: string[]): number {
  const beforeCount = mockDeliveriesState.length;
  mockDeliveriesState = mockDeliveriesState.filter(d => !ids.includes(d.id));
  return beforeCount - mockDeliveriesState.length;
}

/**
 * Récupère les drivers
 */
export function getMockDrivers(): ApiDriver[] {
  return mockDriversState;
}

/**
 * Crée un driver
 */
export function createMockDriver(data: { name: string; phone: string }): ApiDriver {
  const newDriver: ApiDriver = {
    id: `driver-${Date.now()}`,
    name: data.name,
    phone: data.phone
  };
  mockDriversState.push(newDriver);
  return newDriver;
}

/**
 * Réinitialise toutes les données
 */
export function resetMockData(): void {
  mockOrdersState = generateMockOrders();
  mockDeliveriesState = generateMockDeliveries();
  mockDriversState = [...DEMO_DRIVERS];
  console.log('[Offline] Données de démonstration réinitialisées');
}
