
-- PropBrain Database Schema (Supabase) - Private Multi-tenant Version
-- Ejecuta este script en el SQL Editor de Supabase para inicializar o resetear la base de datos.

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('Buyer', 'Architect', 'Contractor');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE property_status AS ENUM ('Wishlist', 'Contacted', 'Visited', 'Offered', 'Discarded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'Buyer'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Propiedad del usuario
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-indigo-600',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL, -- Propiedad del usuario
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS renovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Link Inbox table
CREATE TABLE IF NOT EXISTS link_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS POLICIES (Seguridad por usuario)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_inbox ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede ver/editar su perfil
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id);

-- Cada usuario solo ve sus propias carpetas
CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (auth.uid() = user_id);

-- Cada usuario solo ve sus propias propiedades
CREATE POLICY "Users can manage their own properties" ON properties FOR ALL USING (auth.uid() = user_id);

-- Solo el autor o el dueño de la propiedad pueden ver renovaciones
CREATE POLICY "Users can manage renovations" ON renovations FOR ALL USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);

-- Cada usuario solo ve sus propios links en el inbox
CREATE POLICY "Users can manage their own inbox" ON link_inbox FOR ALL USING (auth.uid() = user_id);
