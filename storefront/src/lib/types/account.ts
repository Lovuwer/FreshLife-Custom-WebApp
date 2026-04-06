export interface Address {
  name: string;
  address_title: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string | null;
  is_primary_address: boolean;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  delivery_instructions: string | null;
  address_label: 'Home' | 'Work' | 'Other';
}

export interface Refund {
  name: string;
  sales_order: string;
  razorpay_refund_id: string;
  refund_amount: number;
  refund_type: 'Full' | 'Partial';
  reason: string;
  status: 'Initiated' | 'Processing' | 'Completed' | 'Failed';
  initiated_at: string;
  completed_at: string | null;
}

export interface SupportTicket {
  name: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  creation: string;
}
