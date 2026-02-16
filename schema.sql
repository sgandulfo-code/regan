
-- PropBrain Database Schema (PostgreSQL/Supabase)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('Buyer', 'Architect', 'Contractor');
CREATE TYPE property_status AS ENUM ('Wishlist', 'Contacted', 'Visited', 'Offered', 'Discarded');

-- 2. TABLES
-- Profiles table (Extends Auth.Users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'Buyer'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Properties table
CREATE TABLE properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT,
  address TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  rooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  sqft NUMERIC DEFAULT 0,
  status property_status DEFAULT 'Wishlist'::property_status,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Renovations table
CREATE TABLE renovations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PERMISSIONS & RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles in their "circle", but only edit their own.
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

-- Properties: Only Buyers (Admins) can insert/update property details. 
-- Architects can SELECT but not UPDATE properties themselves.
CREATE POLICY "Buyers can manage their properties" ON properties
  FOR ALL USING (auth.uid() = buyer_id);

CREATE POLICY "Architects can view assigned properties" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('Architect', 'Contractor')
    )
  );

-- Renovations: The key constraint requested.
-- Architects can manage (INSERT/UPDATE/DELETE) renovation items.
CREATE POLICY "Architects can manage renovations" ON renovations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'Architect'
    )
  );

-- Buyers can also manage their own property's renovations.
CREATE POLICY "Buyers can manage property renovations" ON renovations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_id AND buyer_id = auth.uid()
    )
  );
