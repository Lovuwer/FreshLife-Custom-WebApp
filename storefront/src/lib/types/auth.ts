export interface Customer {
  name: string;
  customer_name: string;
  phone: string;
  email: string | null;
  membership_plan: string | null;
  default_address: string | null;
}

export interface OTPResponse {
  message: string;
  expires_in: number;
}

export interface VerifyOTPResponse {
  token: string;
  customer: Customer;
  is_new_user: boolean;
}

export interface SessionResponse {
  customer: Customer;
  cart_count: number;
}
