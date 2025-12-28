import type { Product, Order, CartItem } from "@/types/product";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");
const IS_PROD = import.meta.env.PROD;

async function fetchStaticProducts(): Promise<Product[]> {
  const response = await fetch("/products.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Failed to load static products");
  }
  const products = (await response.json()) as Product[];
  return products;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    const hint = API_BASE
      ? `Unable to reach API at ${API_BASE}`
      : IS_PROD
        ? "Order API unreachable from deployed site. Set VITE_API_BASE_URL to your hosted API (https://<host>)."
        : "Unable to reach local API. Is npm run server running?";
    const detail = error instanceof Error ? `${error.message}. ${hint}` : hint;
    throw new Error(detail);
  }

  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`.trim();
    let bodyText = "";

    try {
      bodyText = await response.text();
      if (bodyText) {
        try {
          const parsed = JSON.parse(bodyText);
          detail = (parsed?.error || parsed?.message || detail).toString();
        } catch (parseError) {
          // non-JSON error payloads
          detail = bodyText;
        }
      }
    } catch (readError) {
      // ignore body read failures
    }

    if (!API_BASE && IS_PROD && response.status === 404) {
      detail = "Order API not found on this host. Configure VITE_API_BASE_URL to point at your deployed API (https://<host>/api).";
    }

    throw new Error(detail || "Request failed");
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
