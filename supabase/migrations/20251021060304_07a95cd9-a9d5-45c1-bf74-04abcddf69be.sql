-- Add user_id column to orders if not exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add price_pending column to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS price_pending boolean NOT NULL DEFAULT false;

-- Add notes column to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS notes text;

-- Add idempotency_key column to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Add unique constraint on order_id
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_id_unique UNIQUE (order_id);

-- Add index on idempotency_key for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);

-- Add index on created_at for fast date grouping
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Create order_audit table for logging
CREATE TABLE IF NOT EXISTS public.order_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  order_id text,
  user_roll text,
  payload jsonb,
  ip_address text,
  user_agent text,
  error_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on order_audit
ALTER TABLE public.order_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.order_audit
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add quantity_available column to products for stock management
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS quantity_available integer;

-- Initialize quantity_available from stock for existing products
UPDATE public.products 
SET quantity_available = stock 
WHERE quantity_available IS NULL;

-- Add in_stock computed column based on quantity_available
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS in_stock boolean GENERATED ALWAYS AS (quantity_available > 0) STORED;

-- Update RLS policy for orders insert to allow service role
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

CREATE POLICY "Service role can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);