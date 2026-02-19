import { getRuntimeConfig } from './config';

const config = getRuntimeConfig();

export interface DeliveryDetail {
  id: string;
  orderId?: string;
  driverId?: string;
  driverName?: string;
  status: string;
  address: string;
  customerName: string;
  createdAt: string;
  completedAt: string | null;
  lat?: number | null;
  lng?: number | null;
  driverPhone?: string;
  sequence?: number | null;
}

export async function getDeliveryPublic(deliveryId: string): Promise<DeliveryDetail> {
  const response = await fetch(`${config.API_URL}/api/public/deliveries/${deliveryId}/tracking`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Livraison introuvable');
    }
    throw new Error('Erreur lors de la récupération de la livraison');
  }
  
  return response.json();
}