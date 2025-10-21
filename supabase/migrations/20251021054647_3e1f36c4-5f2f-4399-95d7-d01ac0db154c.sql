-- Add status column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending';