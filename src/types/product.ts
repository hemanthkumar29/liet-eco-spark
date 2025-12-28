export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  image_url: string | null;
  features: string[] | null;
  created_at: string | null;
  discount_price?: number | null;
  quantity_available?: number;
  in_stock?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface OrderProduct {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  quantity: number;
}

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  address: string;
  mobile_number: string;
  whatsapp_number: string;
  student_roll: string;
  department: string;
  year: string;
  section: string;
  products: OrderProduct[];
  total_amount: number;
  created_at: string;
  updated_at: string;
  status: string;
  price_pending: boolean;
  notes: string | null;
}
