-- Add acquisition_reason column to properties table
-- Run this in Supabase SQL Editor

-- Create enum type for acquisition reason
CREATE TYPE acquisition_reason AS ENUM ('Comparable', 'Captación', 'Búsqueda');

-- Add column to properties table
ALTER TABLE properties ADD COLUMN acquisition_reason acquisition_reason;
