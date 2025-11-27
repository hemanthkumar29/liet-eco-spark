/**
 * Centralized Product Image Management
 * 
 * This module handles all product image assignments and fallbacks.
 * Add new product images here and they will be available site-wide.
 */

// Import all available product images
import normalBulb from "@/assets/normal_bulb.jpg";
import bulb15w from "@/assets/bulb-15w.jpg";
import tube18w from "@/assets/tube-18w.jpg";
import inverterBulb from "@/assets/inverter-bulb.jpg";
import bulb7w from "@/assets/bulb-7w.jpg";
import bulb9w from "@/assets/bulb-9w.jpg";
import bulb12w from "@/assets/bulb-12w.jpg";
import smartBulb from "@/assets/bulb-smart.jpg";

// Default placeholder image when no match is found
export const DEFAULT_PRODUCT_IMAGE = normalBulb;

/**
 * Product name to image mapping
 * Keys are exact product names from the database
 */
const productImageMap: Record<string, string> = {
  // Main catalog products
  "Normal Bulb": normalBulb,
  "Tube Light": tube18w,
  "Inverter Bulb": inverterBulb,
  "Ceiling Light": bulb15w,
  
  // Additional product variations (for future use)
  "LED Bulb 7W": bulb7w,
  "LED Bulb 9W": bulb9w,
  "LED Bulb 12W": bulb12w,
  "LED Bulb 15W": bulb15w,
  "Smart Bulb": smartBulb,
};

/**
 * Category-based fallback images
 * Used when product name doesn't have a specific image
 */
const categoryFallbackMap: Record<string, string> = {
  "Bulbs": normalBulb,
  "Tube Lights": tube18w,
  "Ceiling Lights": bulb15w,
  "Smart Lighting": smartBulb,
};

/**
 * Get the image URL for a product
 * 
 * Priority:
 * 1. Product's image_url from database (if valid)
 * 2. Exact product name match
 * 3. Category-based fallback
 * 4. Default placeholder
 * 
 * @param productName - The name of the product
 * @param category - The product category (optional)
 * @param imageUrl - The image URL from database (optional)
 * @returns The resolved image URL
 */
export function getProductImage(
  productName: string,
  category?: string,
  imageUrl?: string | null
): string {
  // 1. Use database image_url if it's a valid URL
  if (imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/"))) {
    return imageUrl;
  }

  // 2. Try exact product name match
  if (productImageMap[productName]) {
    return productImageMap[productName];
  }

  // 3. Try partial name matching (case-insensitive)
  const lowerName = productName.toLowerCase();
  for (const [key, value] of Object.entries(productImageMap)) {
    if (lowerName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerName)) {
      return value;
    }
  }

  // 4. Try category-based fallback
  if (category && categoryFallbackMap[category]) {
    return categoryFallbackMap[category];
  }

  // 5. Return default placeholder
  return DEFAULT_PRODUCT_IMAGE;
}

/**
 * Check if a product has a custom image assigned
 */
export function hasCustomImage(productName: string): boolean {
  return productName in productImageMap;
}

/**
 * Get all available product images (for admin/debug purposes)
 */
export function getAllProductImages(): Record<string, string> {
  return { ...productImageMap };
}
