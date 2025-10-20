export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price: number | null;
  stock: number;
  category: string;
  image_url: string | null;
  features: string[] | null;
  created_at: string;
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
  total_amount: number;
  status: string;
  created_at: string;
}
