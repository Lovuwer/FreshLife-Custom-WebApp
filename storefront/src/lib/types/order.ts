export interface Order {
  name: string;
  creation: string;
  grand_total: number;
  status: string;
  items: OrderItem[];
  payment_status: string;
  delivery_slot: string | null;
}

export interface OrderItem {
  item_code: string;
  item_name: string;
  quantity: number;
  rate: number;
  image: string | null;
}

export interface OrderHistory {
  orders: Order[];
  total: number;
  has_more: boolean;
}
