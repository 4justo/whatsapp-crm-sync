export interface OrderInfo {
  products: Array<{
    name: string;
    quantity: number;
    variant?: string;
    price?: number;
  }>;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address?: string;
  };
  notes?: string;
}

export interface ShopifyOrder {
  line_items: Array<{
    name: string;
    quantity: number;
    variant_id?: number;
    price?: string;
  }>;
  customer: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  shipping_address?: {
    address1: string;
    city: string;
    province?: string;
    country?: string;
    zip?: string;
  };
  note?: string;
  tags?: string;
}
