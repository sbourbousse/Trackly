export interface DeliveryInfo {
  id: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Failed';
  completedAt?: string;
  customerName: string;
  address: string;
  driverName: string;
  driverPhone?: string;
  sequence?: number;
  createdAt: string;
}

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;
}
