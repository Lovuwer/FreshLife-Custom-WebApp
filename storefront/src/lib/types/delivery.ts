export interface DeliverySlot {
  name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  slot_type: 'Express (10-15 min)' | 'Scheduled' | 'Same Day';
  delivery_fee: number;
  available: boolean;
}

export interface DeliverySlotsResponse {
  slots: Record<string, DeliverySlot[]>;
  express_available: boolean;
  express_eta_minutes: number;
  express_fee: number;
}

export interface StorePickup {
  available: boolean;
  warehouse_name: string;
  address: string;
  pickup_hours: string;
  estimated_ready_minutes: number;
}
