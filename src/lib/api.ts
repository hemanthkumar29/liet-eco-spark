import type { Product, Order, CartItem } from "@/types/product";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function fetchStaticProducts(): Promise<Product[]> {
  const response = await fetch("/products.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Failed to load static products");
  }
  const products = (await response.json()) as Product[];
  return products;
}

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
  try {
    const data = await apiRequest<{ products: Product[] }>("/api/products");
    return data.products;
  } catch (error) {
    // Fallback for static deployments without the API server
    console.warn("Falling back to static products.json", error);
    return fetchStaticProducts();
  }
}

export async function fetchProductById(id: string): Promise<Product> {
  try {
    const data = await apiRequest<{ product: Product }>(`/api/products/${id}`);
    return data.product;
  } catch (error) {
    console.warn("Falling back to static products.json for product", id, error);
    const products = await fetchStaticProducts();
    const found = products.find((p) => p.id === id);
    if (!found) {
      throw new Error("Product not found");
    }
    return found;
  }
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
