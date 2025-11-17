-- Add missing columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS quantity_available integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true;

-- Update existing products to use stock as quantity_available
UPDATE public.products 
SET quantity_available = stock, 
    in_stock = (stock > 0);

-- Update orders table - drop old columns
ALTER TABLE public.orders
DROP COLUMN IF EXISTS student_roll,
DROP COLUMN IF EXISTS student_name,
DROP COLUMN IF EXISTS year,
DROP COLUMN IF EXISTS section,
DROP COLUMN IF EXISTS department;

-- Add new columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS address text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS mobile_number text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_number text NOT NULL DEFAULT '';

-- Update trigger to keep quantity_available in sync with stock
CREATE OR REPLACE FUNCTION sync_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  NEW.in_stock = (NEW.stock > 0);
  IF NEW.quantity_available IS NULL THEN
    NEW.quantity_available = NEW.stock;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS sync_stock_trigger ON public.products;
CREATE TRIGGER sync_stock_trigger
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION sync_product_stock();