
-- PropBrain Database Schema (Supabase) - REVISED WITH FOLDER TRACKING
-- Instrucciones: Ejecuta este script en el SQL Editor de Supabase.

-- 1. TIPOS ENUM (Si ya existen, el bloque DO $$ los ignorará)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('Buyer', 'Architect', 'Contractor');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        CREATE TYPE property_status AS ENUM ('Wishlist', 'Contacted', 'Visited', 'Offered', 'Discarded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'folder_status') THEN
        CREATE TYPE folder_status AS ENUM ('Pendiente', 'Abierta', 'Cerrada');
    END IF;
END $$;

-- 2. TABLAS

-- Perfiles de usuario
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'Buyer'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Carpetas de búsqueda (Actualizada con campos de seguimiento)
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'bg-indigo-600',
  status folder_status DEFAULT 'Pendiente'::folder_status,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Propiedades
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
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

-- Renovaciones
CREATE TABLE IF NOT EXISTS renovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inbox de Enlaces
CREATE TABLE IF NOT EXISTS link_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_inbox ENABLE ROW LEVEL SECURITY;

-- Políticas (Solo se crean si no existen)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Profiles are private') THEN
        CREATE POLICY "Profiles are private" ON profiles FOR ALL USING (auth.uid() = id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Folders are private') THEN
        CREATE POLICY "Folders are private" ON folders FOR ALL USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Properties are private') THEN
        CREATE POLICY "Properties are private" ON properties FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;
