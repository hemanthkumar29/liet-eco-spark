-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  liet_price NUMERIC,
  discount_price NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  image_url TEXT,
  features TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL UNIQUE,
  student_roll TEXT NOT NULL,
  student_name TEXT NOT NULL,
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  department TEXT NOT NULL,
  products JSONB NOT NULL,
  total_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  price_pending BOOLEAN DEFAULT false,
  notes TEXT,
  user_id UUID,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Products policies (public read access)
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

-- Orders policies (users can view their own orders)
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample products
INSERT INTO public.products (name, description, price, liet_price, stock, category, features) VALUES
  ('9W LED Bulb', 'Energy efficient 9W LED bulb with warm white light', 120, 99, 50, 'Bulbs', ARRAY['Energy efficient', 'Long lasting', 'Warm white light']),
  ('12W LED Bulb', 'Bright 12W LED bulb perfect for living spaces', 150, 129, 45, 'Bulbs', ARRAY['High brightness', '12W power', 'Energy saving']),
  ('15W LED Bulb', 'High power 15W LED bulb for large rooms', 180, 159, 40, 'Bulbs', ARRAY['Extra bright', '15W power', 'Durable']),
  ('7W Night Bulb', 'Soft glow 7W bulb ideal for bedrooms', 90, 75, 60, 'Bulbs', ARRAY['Soft light', 'Perfect for nights', 'Low power']),
  ('18W Tube Light', 'Efficient 18W tube light for offices', 250, 219, 30, 'Tube Lights', ARRAY['Office grade', 'Bright white light', '18W efficient']),
  ('Smart 10W Bulb', 'WiFi enabled smart bulb with color control', 350, 299, 25, 'Smart Bulbs', ARRAY['WiFi enabled', 'Color changing', 'App controlled'])
ON CONFLICT DO NOTHING;