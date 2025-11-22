-- Add student fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS student_roll text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS year text NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS section text NOT NULL DEFAULT '';