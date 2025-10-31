-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  liet_price NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  image_url TEXT,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add computed column for in_stock
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS in_stock BOOLEAN GENERATED ALWAYS AS (quantity_available > 0) STORED;

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read products
CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (true);

-- Only admins/service role can insert/update/delete products
CREATE POLICY "Only service role can manage products" 
ON public.products 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_products_updated_at();

-- Insert sample products
INSERT INTO public.products (name, description, price, liet_price, stock, quantity_available, category, image_url, features) VALUES
('LED Bulb 7W', 'Energy-efficient 7W LED bulb perfect for homes and offices', 120.00, 95.00, 50, 50, 'Bulbs', 'bulb-7w.jpg', ARRAY['7W Power', '80% Energy Saving', '2 Year Warranty', 'Eco-Friendly']),
('LED Bulb 9W', 'Bright 9W LED bulb with excellent energy efficiency', 150.00, 120.00, 45, 45, 'Bulbs', 'bulb-9w.jpg', ARRAY['9W Power', '85% Energy Saving', '2 Year Warranty', 'Long Lasting']),
('LED Bulb 12W', 'High-performance 12W LED bulb for larger spaces', 180.00, 145.00, 40, 40, 'Bulbs', 'bulb-12w.jpg', ARRAY['12W Power', '90% Energy Saving', '3 Year Warranty', 'Premium Quality']),
('LED Bulb 15W', 'Ultra-bright 15W LED bulb for industrial use', 220.00, 175.00, 35, 35, 'Bulbs', 'bulb-15w.jpg', ARRAY['15W Power', '92% Energy Saving', '3 Year Warranty', 'Industrial Grade']),
('LED Tube Light 18W', 'Premium 18W tube light for offices and commercial spaces', 350.00, 280.00, 30, 30, 'Tube Lights', 'tube-18w.jpg', ARRAY['18W Power', 'Flicker-Free', '5 Year Warranty', 'Commercial Grade']),
('Smart LED Bulb', 'WiFi-enabled smart LED bulb with color changing features', 500.00, 400.00, 25, 25, 'Smart Bulbs', 'bulb-smart.jpg', ARRAY['WiFi Enabled', 'Color Changing', 'App Control', '2 Year Warranty'])
ON CONFLICT (id) DO NOTHING;