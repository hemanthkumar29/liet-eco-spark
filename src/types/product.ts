export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  liet_price: number | null;
  stock: number;
  category: string;
  image_url: string | null;
  features: string[] | null;
  created_at: string;
  discount_price?: number | null;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  order_id: string;
  student_roll: string;
  student_name: string;
  year: string;
  section: string;
  department: string;
  products: CartItem[];
  total_amount: number | null;
  created_at: string;
  status?: string;
  price_pending?: boolean;
  notes?: string | null;
  user_id?: string | null;
  idempotency_key?: string | null;
}
