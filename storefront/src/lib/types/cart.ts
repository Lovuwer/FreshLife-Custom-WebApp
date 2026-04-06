export interface CartItem {
  item_code: string;
  item_name: string;
  quantity: number;
  rate: number;
  image: string | null;
  max_qty: number;
  in_stock: boolean;
}

export interface BillSummary {
  subtotal: number;
  delivery_fee: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  savings: number;
  min_order_met: boolean;
  min_order_value: number;
  breakdown: BillLineItem[];
}

export interface BillLineItem {
  label: string;
  amount: number;
}

export interface CouponValidation {
  valid: boolean;
  discount_amount: number;
  message: string;
  pricing_rule: string | null;
}
