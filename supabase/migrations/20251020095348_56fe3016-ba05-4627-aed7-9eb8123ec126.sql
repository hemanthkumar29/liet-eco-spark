-- Add status column to orders table
ALTER TABLE orders ADD COLUMN status text NOT NULL DEFAULT 'Pending';

-- Add check constraint for valid status values
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('Pending', 'Processing', 'Completed', 'Cancelled'));