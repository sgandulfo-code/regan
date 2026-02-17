
-- PropBrain Database Schema (Supabase)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('Buyer', 'Architect', 'Contractor');
CREATE TYPE property_status AS ENUM ('Wishlist', 'Contacted', 'Visited', 'Offered', 'Discarded');

-- 2. TABLES
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'Buyer'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-indigo-600',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  address TEXT NOT NULL,
  exact_address TEXT,
  price NUMERIC DEFAULT 0,
  fees NUMERIC DEFAULT 0,
  environments INTEGER DEFAULT 0,
  rooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  toilets INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  sqft NUMERIC DEFAULT 0,
  covered_sqft NUMERIC DEFAULT 0,
  uncovered_sqft NUMERIC DEFAULT 0,
  age INTEGER DEFAULT 0,
  floor TEXT,
  status property_status DEFAULT 'Wishlist'::property_status,
  rating INTEGER DEFAULT 3,
  notes TEXT,
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Renovations table
CREATE TABLE renovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link Inbox table (NEW)
CREATE TABLE link_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS POLICIES (Simplified for dev, restrict more for production)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all public access for development" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all public access for development" ON folders FOR ALL USING (true);
CREATE POLICY "Allow all public access for development" ON properties FOR ALL USING (true);
CREATE POLICY "Allow all public access for development" ON renovations FOR ALL USING (true);
CREATE POLICY "Allow all public access for development" ON link_inbox FOR ALL USING (true);
