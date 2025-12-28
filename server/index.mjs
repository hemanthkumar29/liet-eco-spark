import express from "express";
import cors from "cors";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../data");
const PRODUCTS_PATH = path.join(DATA_DIR, "products.json");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");
const ORDERS_CSV_PATH = path.join(DATA_DIR, "orders.csv");

const CSV_HEADERS = [
  "order_id",
  "created_at",
  "updated_at",
  "customer_name",
  "student_roll",
  "department",
  "year",
  "section",
  "address",
  "mobile_number",
  "whatsapp_number",
  "total_amount",
  "status",
  "price_pending",
  "notes",
  "product_count",
  "total_units",
  "products_summary"
];

async function ensureDataFiles() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }

  if (!existsSync(PRODUCTS_PATH)) {
    const defaultProducts = [];
    await writeFile(PRODUCTS_PATH, JSON.stringify(defaultProducts, null, 2), "utf8");
  }

  if (!existsSync(ORDERS_PATH)) {
    await writeFile(ORDERS_PATH, JSON.stringify([], null, 2), "utf8");
  }

  if (!existsSync(ORDERS_CSV_PATH)) {
    await writeFile(ORDERS_CSV_PATH, `${CSV_HEADERS.join(",")}\n`, "utf8");
  }
}

async function readJson(filePath, fallback) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to read ${filePath}, using fallback`, error);
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function generateOrderId() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `LIET-ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
}

function escapeCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function summariseProducts(products) {
  return products
    .map((item) => `${item.name} x${item.quantity}${item.discount_price ? ` @ ${item.discount_price}` : item.price ? ` @ ${item.price}` : ""}`)
    .join(" | ");
}

async function exportOrdersCsv(orders) {
  const rows = orders.map((order) => {
    const productCount = order.products.length;
    const totalUnits = order.products.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    return [
      order.order_id,
      order.created_at,
      order.updated_at,
      order.customer_name,
      order.student_roll,
      order.department,
      order.year,
      order.section,
      order.address,
      order.mobile_number,
      order.whatsapp_number,
      order.total_amount,
      order.status,
      order.price_pending,
      order.notes ?? "",
      productCount,
      totalUnits,
      summariseProducts(order.products)
    ].map(escapeCell).join(",");
  });

  const payload = [CSV_HEADERS.join(","), ...rows].join("\n");
  await writeFile(ORDERS_CSV_PATH, `${payload}\n`, "utf8");
}

function normaliseProduct(product) {
  const quantityAvailable = product.quantity_available ?? product.stock ?? 0;
  return {
    ...product,
    quantity_available: quantityAvailable,
    in_stock: quantityAvailable > 0,
    price: Number(product.price ?? 0),
    discount_price: product.discount_price === null || product.discount_price === undefined
      ? null
      : Number(product.discount_price),
  };
}

await ensureDataFiles();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/products", async (_req, res) => {
  const productsRaw = await readJson(PRODUCTS_PATH, []);
  const products = productsRaw.map(normaliseProduct);
  res.json({ products });
});

app.get("/api/products/:id", async (req, res) => {
  const productsRaw = await readJson(PRODUCTS_PATH, []);
  const product = productsRaw.map(normaliseProduct).find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json({ product });
});

app.get("/api/orders", async (_req, res) => {
  const orders = await readJson(ORDERS_PATH, []);
  const sorted = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json({ orders: sorted });
});

app.get("/api/orders/:orderId", async (req, res) => {
  const orders = await readJson(ORDERS_PATH, []);
  const order = orders.find((item) => item.order_id === req.params.orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json({ order });
});

app.patch("/api/orders/:orderId", async (req, res) => {
  const allowed = ["status", "notes", "total_amount", "price_pending"];
  const updates = Object.fromEntries(
    Object.entries(req.body ?? {}).filter(([key]) => allowed.includes(key))
  );

  const orders = await readJson(ORDERS_PATH, []);
  const index = orders.findIndex((item) => item.order_id === req.params.orderId);
  if (index === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  const updatedOrder = {
    ...orders[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  orders[index] = updatedOrder;
  await writeJson(ORDERS_PATH, orders);
  await exportOrdersCsv(orders);
  res.json({ order: updatedOrder });
});

app.post("/api/orders", async (req, res) => {
  const payload = req.body ?? {};
  const required = [
    "customer_name",
    "address",
    "mobile_number",
    "whatsapp_number",
    "student_roll",
    "department",
    "year",
    "section",
    "items"
  ];

  const missing = required.filter((field) => !payload[field] || (Array.isArray(payload[field]) && payload[field].length === 0));
  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  const productsRaw = await readJson(PRODUCTS_PATH, []);
  const products = productsRaw.map(normaliseProduct);

  const orderItems = [];
  let totalAmount = 0;

  for (const item of payload.items) {
    const product = products.find((p) => p.id === item.id);
    if (!product) {
      return res.status(404).json({ error: `Product not found: ${item.id}` });
    }

    if (product.quantity_available < item.quantity) {
      return res.status(409).json({
        error: `Insufficient stock for ${product.name}`,
        available: product.quantity_available,
      });
    }

    const salePrice = product.discount_price ?? product.price;
    totalAmount += salePrice * item.quantity;

    orderItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      discount_price: product.discount_price,
      quantity: item.quantity,
    });

    product.quantity_available -= item.quantity;
    product.in_stock = product.quantity_available > 0;
  }

  const now = new Date().toISOString();
  const orderRecord = {
    id: randomUUID(),
    order_id: generateOrderId(),
    customer_name: payload.customer_name,
    address: payload.address,
    mobile_number: payload.mobile_number,
    whatsapp_number: payload.whatsapp_number,
    student_roll: payload.student_roll,
    department: payload.department,
    year: payload.year,
    section: payload.section,
    products: orderItems,
    total_amount: Number(totalAmount.toFixed(2)),
    status: "confirmed",
    price_pending: false,
    notes: null,
    created_at: now,
    updated_at: now,
  };

  const orders = await readJson(ORDERS_PATH, []);
  orders.unshift(orderRecord);
  await writeJson(ORDERS_PATH, orders);

  const updatedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    discount_price: product.discount_price,
    stock: product.stock ?? product.quantity_available,
    category: product.category,
    image_url: product.image_url ?? null,
    features: product.features ?? null,
    created_at: product.created_at ?? null,
    quantity_available: product.quantity_available,
    in_stock: product.in_stock,
  }));
  await writeJson(PRODUCTS_PATH, updatedProducts);

  await exportOrdersCsv(orders);

  res.status(201).json({ order: orderRecord });
});

const distPath = path.join(__dirname, "../dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const PORT = Number(process.env.PORT ?? 5050);
app.listen(PORT, () => {
  console.log(`Local order API running on http://localhost:${PORT}`);
});
