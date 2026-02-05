/**
 * Types pour l'API Trackly Backend
 */

export type DeliveryStatus = 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';

export interface DeliveryDetailResponse {
  id: string;
  orderId: string;
  driverId: string;
  routeId: string | null;
  sequence: number | null;
  status: DeliveryStatus;
  createdAt: string;
  completedAt: string | null;
  customerName: string;
  address: string;
  driverName: string;
}

export interface DeliveryTrackingResponse {
  deliveryId: string;
  status: DeliveryStatus;
  completedAt: string | null;
}

/**
 * Informations de contact pour les actions rapides
 */
export interface ContactInfo {
  driverPhone?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWhatsApp?: string;
}
