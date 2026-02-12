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

/**
 * Génère une date entre J-7 et J+7
 * @param dayOffset Décalage en jours par rapport à aujourd'hui (négatif = passé, positif = futur)
 */
function getDateWithOffset(dayOffset: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  // Ajouter une heure aléatoire entre 8h et 18h pour plus de réalisme
  date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

/**
 * Détermine le statut d'une commande en fonction de la date
 */
function getOrderStatus(orderDate: Date): 'Pending' | 'InDelivery' | 'Delivered' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orderDay = new Date(orderDate);
  orderDay.setHours(0, 0, 0, 0);
  
  if (orderDay < today) {
    return 'Delivered'; // Commandes passées = livrées
  } else if (orderDay.getTime() === today.getTime()) {
    return 'InDelivery'; // Commandes d'aujourd'hui = en cours de livraison
  } else {
    return 'Pending'; // Commandes futures = en attente
  }
}

// Commandes fictives réparties entre J-7 et J+7
function generateMockOrders(): ApiOrder[] {
  return DEMO_CUSTOMERS.map((customer, index) => {
    // Répartir les commandes sur 15 jours (J-7 à J+7)
    // index 0-1 : J-7 à J-5 (passé lointain)
    // index 2-3 : J-3 à J-1 (passé récent)
    // index 4-5 : J (aujourd'hui)
    // index 6-7 : J+1 à J+3 (futur proche)
    // index 8+ : J+5 à J+7 (futur lointain)
    let dayOffset: number;
    if (index < 2) {
      dayOffset = -7 + Math.floor(Math.random() * 3); // J-7 à J-5
    } else if (index < 4) {
      dayOffset = -3 + Math.floor(Math.random() * 3); // J-3 à J-1
    } else if (index < 6) {
      dayOffset = 0; // J (aujourd'hui)
    } else if (index < 8) {
      dayOffset = 1 + Math.floor(Math.random() * 3); // J+1 à J+3
    } else {
      dayOffset = 5 + Math.floor(Math.random() * 3); // J+5 à J+7
    }
    
    const orderDate = getDateWithOffset(dayOffset);
    const status = getOrderStatus(orderDate);
    
    return {
      id: `demo-order-${String(index + 1).padStart(3, '0')}`,
      customerName: customer.name,
      address: customer.address,
      orderDate: orderDate.toISOString(),
      status,
      deliveryCount: 0 // Sera calculé après génération des livraisons
    };
  });
}

/**
 * Génère un ID de tournée basé sur la date
 */
function getRouteIdForDate(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orderDay = new Date(date);
  orderDay.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((orderDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return String(diffDays).padStart(3, '0');
}

/**
 * Détermine le statut d'une livraison en fonction de la date de commande
 */
function getDeliveryStatus(orderDate: Date): 'Pending' | 'InProgress' | 'Completed' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const orderDay = new Date(orderDate);
  orderDay.setHours(0, 0, 0, 0);
  
  if (orderDay < today) {
    return 'Completed'; // Livraisons passées = terminées
  } else if (orderDay.getTime() === today.getTime()) {
    return 'InProgress'; // Livraisons d'aujourd'hui = en cours
  } else {
    return 'Pending'; // Livraisons futures = en attente
  }
}

// Livraisons fictives avec dates et statuts cohérents
function generateMockDeliveries(): ApiDelivery[] {
  // Créer des livraisons pour toutes les commandes
  return mockOrdersState
    .filter(order => order.orderDate !== null) // Ignorer les commandes sans date
    .map((order, index) => {
      const driver = DEMO_DRIVERS[index % DEMO_DRIVERS.length];
      const orderDate = new Date(order.orderDate!);
      const status = getDeliveryStatus(orderDate);
      
      // Date de création de la livraison = même jour que la commande
      const createdAt = new Date(orderDate);
      
      // Date de complétion pour les livraisons terminées
      let completedAt: string | null = null;
      if (status === 'Completed') {
        const completedDate = new Date(orderDate);
        // Ajouter quelques heures pour la complétion (entre 2h et 8h après création)
        completedDate.setHours(completedDate.getHours() + 2 + Math.floor(Math.random() * 6));
        completedAt = completedDate.toISOString();
      }
      
      return {
        id: `demo-delivery-${String(index + 1).padStart(3, '0')}`,
        orderId: order.id,
        driverId: driver.id,
        routeId: getRouteIdForDate(orderDate),
        status,
        createdAt: createdAt.toISOString(),
        completedAt
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
  // Réinitialiser complètement les états
  mockOrdersState = [];
  mockDeliveriesState = [];
  
  // Générer les nouvelles données
  mockOrdersState = generateMockOrders();
  console.log('[Demo] 📦 Commandes générées:', mockOrdersState.length, mockOrdersState.map(o => o.id));
  
  mockDeliveriesState = generateMockDeliveries();
  console.log('[Demo] 🚚 Livraisons générées:', mockDeliveriesState.length, mockDeliveriesState.map(d => ({ id: d.id, orderId: d.orderId })));
  
  // Vérifier le deliveryCount
  const ordersWithDeliveries = mockOrdersState.map(order => ({
    id: order.id,
    deliveryCount: mockDeliveriesState.filter(d => d.orderId === order.id).length
  }));
  console.log('[Demo] 📊 Comptage des livraisons par commande:', ordersWithDeliveries);
  console.log('[Demo] 🎭 Données de démo initialisées - AUCUNE donnée réelle');
}

/**
 * Récupère les commandes de démo avec filtres optionnels
 */
export function getMockOrders(filters?: { 
  dateFrom?: string; 
  dateTo?: string; 
  dateFilter?: 'CreatedAt' | 'OrderDate';
  search?: string;
}): ApiOrder[] {
  if (mockOrdersState.length === 0) {
    initMockData();
  }
  
  let orders = [...mockOrdersState];
  
  // Calculer le deliveryCount pour chaque commande
  orders = orders.map(order => {
    const deliveryCount = mockDeliveriesState.filter(d => d.orderId === order.id).length;
    return { ...order, deliveryCount };
  });
  
  // Filtre de recherche
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase();
    orders = orders.filter(o => 
      o.customerName.toLowerCase().includes(searchLower) ||
      o.address.toLowerCase().includes(searchLower)
    );
  }
  
  // Filtre par date (utilise orderDate pour les deux types de filtre)
  if (filters?.dateFrom || filters?.dateTo) {
    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      orders = orders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate >= fromDate;
      });
    }
    
    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      orders = orders.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate <= toDate;
      });
    }
  }
  
  return orders;
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
    status: 'Pending',
    deliveryCount: 0
  };
  mockOrdersState.unshift(newOrder);
  return newOrder;
}

/**
 * Supprime des commandes de démo
 */
export function deleteMockOrders(ids: string[]): { deleted: number; deletedDeliveries: number } {
  const initialOrders = mockOrdersState.length;
  const initialDeliveries = mockDeliveriesState.length;
  
  mockOrdersState = mockOrdersState.filter(o => !ids.includes(o.id));
  // Supprimer aussi les livraisons associées
  mockDeliveriesState = mockDeliveriesState.filter(d => !ids.includes(d.orderId));
  
  return {
    deleted: initialOrders - mockOrdersState.length,
    deletedDeliveries: initialDeliveries - mockDeliveriesState.length
  };
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
    status: 'Pending' as const,
    deliveryCount: 0
  }));
  mockOrdersState.unshift(...newOrders);
  return newOrders;
}

/**
 * Récupère les livraisons de démo avec filtres optionnels
 */
export function getMockDeliveries(filters?: { 
  dateFrom?: string; 
  dateTo?: string; 
  dateFilter?: 'CreatedAt' | 'OrderDate';
  routeId?: string;
}): ApiDelivery[] {
  if (mockDeliveriesState.length === 0) {
    initMockData();
  }
  
  let deliveries = [...mockDeliveriesState];
  
  // Filtre par tournée
  if (filters?.routeId) {
    deliveries = deliveries.filter(d => d.routeId === filters.routeId);
  }
  
  // Filtre par date
  if (filters?.dateFrom || filters?.dateTo) {
    if (filters?.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      deliveries = deliveries.filter(delivery => {
        if (!delivery.createdAt) return false;
        
        // Si dateFilter est OrderDate, chercher la commande associée
        let dateToCheck: Date;
        if (filters?.dateFilter === 'OrderDate') {
          const order = mockOrdersState.find(o => o.id === delivery.orderId);
          if (!order?.orderDate) return false;
          dateToCheck = new Date(order.orderDate);
        } else {
          dateToCheck = new Date(delivery.createdAt);
        }
        
        dateToCheck.setHours(0, 0, 0, 0);
        return dateToCheck >= fromDate;
      });
    }
    
    if (filters?.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      deliveries = deliveries.filter(delivery => {
        if (!delivery.createdAt) return false;
        
        // Si dateFilter est OrderDate, chercher la commande associée
        let dateToCheck: Date;
        if (filters?.dateFilter === 'OrderDate') {
          const order = mockOrdersState.find(o => o.id === delivery.orderId);
          if (!order?.orderDate) return false;
          dateToCheck = new Date(order.orderDate);
        } else {
          dateToCheck = new Date(delivery.createdAt);
        }
        
        dateToCheck.setHours(0, 0, 0, 0);
        return dateToCheck <= toDate;
      });
    }
  }
  
  return deliveries;
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
 * Récupère les tournées de démo avec filtres optionnels
 */
export function getMockRoutes(filters?: { dateFrom?: string; dateTo?: string; driverId?: string }): ApiRoute[] {
  if (mockDeliveriesState.length === 0) {
    initMockData();
  }
  
  // Grouper les livraisons par date (routeId)
  const routesByDate = new Map<string, ApiDelivery[]>();
  mockDeliveriesState.forEach(delivery => {
    if (!routesByDate.has(delivery.routeId)) {
      routesByDate.set(delivery.routeId, []);
    }
    routesByDate.get(delivery.routeId)!.push(delivery);
  });
  
  // Créer une tournée pour chaque date
  const routes: ApiRoute[] = [];
  routesByDate.forEach((deliveries, routeId) => {
    if (deliveries.length === 0) return;
    
    // Utiliser la date de la première livraison
    const firstDelivery = deliveries[0];
    const deliveryDate = new Date(firstDelivery.createdAt);
    const dateStr = deliveryDate.toISOString().split('T')[0];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const routeDay = new Date(deliveryDate);
    routeDay.setHours(0, 0, 0, 0);
    
    // Déterminer le statut de la tournée
    let status: 'Pending' | 'Active' | 'Completed';
    if (routeDay < today) {
      status = 'Completed';
    } else if (routeDay.getTime() === today.getTime()) {
      status = 'Active';
    } else {
      status = 'Pending';
    }
    
    // Alterner les livreurs pour les différentes tournées
    const driverIndex = routes.length % DEMO_DRIVERS.length;
    const driver = DEMO_DRIVERS[driverIndex];
    
    // Noms de tournées variés
    const routeNames = [
      'Tournée Centre-Ville',
      'Tournée Quartier Est',
      'Tournée Zone Commerciale',
      'Tournée Périphérie Nord',
      'Tournée Sud Montpellier'
    ];
    const routeName = routeNames[routes.length % routeNames.length];
    
    // Calculer le résumé des statuts
    const statusSummary = {
      pending: deliveries.filter(d => d.status === 'Pending').length,
      inProgress: deliveries.filter(d => d.status === 'InProgress').length,
      completed: deliveries.filter(d => d.status === 'Completed').length,
      failed: deliveries.filter(d => d.status === 'Failed').length
    };
    
    routes.push({
      id: `demo-route-${routeId}`,
      name: routeName,
      driverId: driver.id,
      createdAt: firstDelivery.createdAt,
      deliveryCount: deliveries.length,
      driverName: driver.name,
      statusSummary
    });
  });
  
  // Trier les tournées par date (plus récente en premier)
  routes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Appliquer les filtres
  let filteredRoutes = routes;
  
  // Filtre par date de début
  if (filters?.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    fromDate.setHours(0, 0, 0, 0);
    filteredRoutes = filteredRoutes.filter(route => {
      const routeDate = new Date(route.createdAt);
      routeDate.setHours(0, 0, 0, 0);
      return routeDate >= fromDate;
    });
  }
  
  // Filtre par date de fin
  if (filters?.dateTo) {
    const toDate = new Date(filters.dateTo);
    toDate.setHours(23, 59, 59, 999);
    filteredRoutes = filteredRoutes.filter(route => {
      const routeDate = new Date(route.createdAt);
      routeDate.setHours(0, 0, 0, 0);
      return routeDate <= toDate;
    });
  }
  
  // Filtre par livreur
  if (filters?.driverId) {
    filteredRoutes = filteredRoutes.filter(route => route.driverId === filters.driverId);
  }
  
  return filteredRoutes;
}

/**
 * Récupère le détail d'une tournée de démo
 */
export function getMockRouteById(id: string): ApiRouteDetail | null {
  // Trouver la tournée dans la liste
  const routes = getMockRoutes();
  const route = routes.find(r => r.id === id);
  if (!route) return null;
  
  // Extraire le routeId interne (sans le préfixe "demo-route-")
  const routeIdPart = id.replace('demo-route-', '');
  const deliveries = mockDeliveriesState.filter(d => d.routeId === routeIdPart);
  
  return {
    id: route.id,
    name: route.name,
    driverId: route.driverId,
    driverName: route.driverName,
    createdAt: route.createdAt,
    deliveries: deliveries.map((d, index) => {
      // Trouver la commande correspondante pour avoir les infos client
      const order = mockOrdersState.find(o => o.id === d.orderId);
      return {
        id: d.id,
        orderId: d.orderId,
        status: d.status,
        sequence: index,
        createdAt: d.createdAt,
        completedAt: d.completedAt,
        customerName: order?.customerName || 'Client inconnu',
        address: order?.address || 'Adresse inconnue'
      };
    })
  };
}

/**
 * Réordonne les livraisons d'une tournée de démo
 */
export function reorderMockDeliveries(routeId: string, deliveryIds: string[]): void {
  // Extraire le routeId interne
  const routeIdPart = routeId.replace('demo-route-', '');
  
  deliveryIds.forEach((id, index) => {
    const delivery = mockDeliveriesState.find(d => d.id === id && d.routeId === routeIdPart);
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
  const now = new Date();
  const routeId = getRouteIdForDate(now);
  
  const newDeliveries = orderIds.map((orderId, index) => ({
    id: `demo-delivery-${Date.now()}-${index}`,
    orderId,
    driverId,
    routeId,
    status: 'Pending' as const,
    createdAt: now.toISOString(),
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
