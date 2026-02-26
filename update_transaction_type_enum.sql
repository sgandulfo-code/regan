-- Update transaction_type enum to include new values
-- Run this in Supabase SQL Editor

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'Venta';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'Alquiler Temporario';
