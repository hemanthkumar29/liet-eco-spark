import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function escapeCell(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);
  if (stringValue.includes("\"") || stringValue.includes(",") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

function summariseProducts(products) {
  try {
    const parsed = Array.isArray(products) ? products : JSON.parse(products ?? "[]");
    return parsed
      .map((item) => {
        if (!item) return "";
        const name = item.name ?? item.product_name ?? "Unknown";
        const quantity = item.quantity ?? 0;
        const price = item.discount_price ?? item.price ?? "";
        return `${name} x${quantity}${price ? ` @ ${price}` : ""}`;
      })
      .filter(Boolean)
      .join(" | ");
  } catch (error) {
    console.warn("Failed to summarise products", error);
    return "";
  }
}

const headers = [
  "Order ID",
  "Created At (IST)",
  "Updated At (IST)",
  "Customer Name",
  "Roll Number",
  "Department",
  "Year",
  "Section",
  "Address",
  "Mobile",
  "WhatsApp",
  "Total Amount",
  "Status",
  "Price Pending",
  "Notes",
  "User ID",
  "Idempotency Key",
  "Product Count",
  "Total Units",
  "Products",
];

async function run() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(scriptDir, "..", "data");
  const ordersPath = join(dataDir, "orders.json");

  console.info("Reading orders from", ordersPath);

  let orders = [];
  try {
    const rawOrders = await readFile(ordersPath, "utf8");
    orders = JSON.parse(rawOrders ?? "[]");
  } catch (error) {
    console.warn("No orders file found, exporting empty sheet", error.message);
  }

  const rows = (orders ?? []).map((order) => [
    escapeCell(order.order_id),
    escapeCell(formatDate(order.created_at)),
    escapeCell(formatDate(order.updated_at)),
    escapeCell(order.customer_name),
    escapeCell(order.student_roll),
    escapeCell(order.department),
    escapeCell(order.year),
    escapeCell(order.section),
    escapeCell(order.address),
    escapeCell(order.mobile_number),
    escapeCell(order.whatsapp_number),
    escapeCell(order.total_amount ?? ""),
    escapeCell(order.status),
    escapeCell(order.price_pending),
    escapeCell(order.notes ?? ""),
    escapeCell(order.user_id ?? ""),
    escapeCell(order.idempotency_key ?? ""),
    escapeCell(order.product_count ?? ""),
    escapeCell(order.total_units ?? ""),
    escapeCell(summariseProducts(order.products)),
  ]);

  const csvLines = [headers.map(escapeCell).join(","), ...rows.map((cols) => cols.join(","))];

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:T]/g, "-").split(".")[0];

  const outputsDir = join(scriptDir, "..", "exports");
  await mkdir(outputsDir, { recursive: true });
  const outputPath = join(outputsDir, `orders-${timestamp}.csv`);

  await writeFile(outputPath, `${csvLines.join("\n")}\n`, "utf8");

  console.info(`Exported ${rows.length} orders to ${outputPath}`);
}

run().catch((error) => {
  console.error("Unexpected error while exporting orders:", error);
  process.exitCode = 1;
});
