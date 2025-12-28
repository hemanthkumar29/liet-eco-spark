import type { Product, Order, CartItem } from "@/types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      if (body?.error) {
        message = body.error;
      }
    } catch (error) {
      // ignore json parse errors
    }
    throw new Error(message || "Request failed");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface OrderItemInput {
  id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  customer_name: string;
  address: string;
  mobile_number: string;
  whatsapp_number: string;
  student_roll: string;
  department: string;
  year: string;
  section: string;
  items: OrderItemInput[];
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await apiRequest<{ products: Product[] }>("/api/products");
  return data.products;
}

export async function fetchProductById(id: string): Promise<Product> {
  const data = await apiRequest<{ product: Product }>(`/api/products/${id}`);
  return data.product;
}

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const data = await apiRequest<{ order: Order }>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.order;
}

export async function fetchOrders(): Promise<Order[]> {
  const data = await apiRequest<{ orders: Order[] }>("/api/orders");
  return data.orders;
}

export async function fetchOrderById(orderId: string): Promise<Order> {
  const data = await apiRequest<{ order: Order }>(`/api/orders/${orderId}`);
  return data.order;
}

export async function updateOrder(orderId: string, updates: Partial<Pick<Order, "status" | "notes" | "total_amount" | "price_pending">>): Promise<Order> {
  const data = await apiRequest<{ order: Order }>(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return data.order;
}

export function buildOrderItemsFromCart(items: CartItem[]): OrderItemInput[] {
  return items.map((item) => ({ id: item.id, quantity: item.quantity }));
}
