-- Add customer_id column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Make work_order_id optional (it was required before)
ALTER TABLE quotes ALTER COLUMN work_order_id DROP NOT NULL;

-- Update any existing quotes to have a valid customer_id (if any exist)
-- This is a safety measure - in practice there should be no quotes yet
UPDATE quotes 
SET customer_id = (
  SELECT w.customer_id 
  FROM work_orders w 
  WHERE w.id = quotes.work_order_id
  LIMIT 1
)
WHERE customer_id IS NULL AND work_order_id IS NOT NULL;
