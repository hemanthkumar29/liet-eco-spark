-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount_price DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  image_url TEXT,
  features TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  total_amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user roles enum and table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for products (public read, admin write)
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders (anyone can insert, admins can view all)
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_roles (admins can manage)
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed products
INSERT INTO public.products (name, description, price, discount_price, stock, category, image_url, features) VALUES
('9W LED Bulb', 'Energy-efficient 9W LED bulb with warm white light, perfect for homes and hostels. Saves up to 80% energy compared to traditional bulbs.', 150.00, 99.00, 50, 'LED Bulbs', NULL, ARRAY['9W Power', 'Warm White', '800 Lumens', '25,000 Hours Lifespan', '80% Energy Saving']),
('12W LED Bulb', 'High-brightness 12W LED bulb ideal for study rooms and workspaces. Manufactured by LIET students for students.', 200.00, 149.00, 45, 'LED Bulbs', NULL, ARRAY['12W Power', 'Cool White', '1200 Lumens', '30,000 Hours Lifespan', 'Eco-Friendly']),
('15W LED Bulb', 'Premium 15W LED bulb with superior brightness for classrooms and common areas. LIET-approved quality.', 250.00, 199.00, 30, 'LED Bulbs', NULL, ARRAY['15W Power', 'Daylight White', '1500 Lumens', '35,000 Hours Lifespan', 'Mercury Free']),
('7W Night Bulb', 'Soft glow 7W LED perfect for night lights and ambient lighting in dorm rooms.', 120.00, 79.00, 60, 'LED Bulbs', NULL, ARRAY['7W Power', 'Soft Yellow', '600 Lumens', '20,000 Hours Lifespan', 'Low Power']),
('18W Tube Light', 'High-efficiency 18W LED tube light for labs and workshops. Replace old fluorescent tubes.', 350.00, 279.00, 25, 'Tube Lights', NULL, ARRAY['18W Power', 'Cool Daylight', '1800 Lumens', '40,000 Hours Lifespan', 'Instant Start']),
('Smart 10W Bulb', 'WiFi-enabled smart LED bulb with color changing features. Control from your phone!', 400.00, 299.00, 3, 'Smart Bulbs', NULL, ARRAY['10W Power', 'RGB Colors', '1000 Lumens', '15,000 Hours Lifespan', 'App Control']);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;