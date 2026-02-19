
-- PropBrain Database Schema (Supabase) - CLEAN INSTALL
-- Instrucciones: Borra todo lo que tengas en el SQL Editor de Supabase, pega esto y dale a "Run".

-- 0. LIMPIEZA
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS renovations CASCADE;
DROP TABLE IF EXISTS link_inbox CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS folders CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TIPOS ENUM
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

-- 3. TABLAS

-- Perfiles de usuario
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'Buyer'::user_role,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Carpetas de búsqueda
CREATE TABLE folders (
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
CREATE TABLE properties (
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
CREATE TABLE renovations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  estimated_cost NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Inbox de Enlaces
CREATE TABLE link_inbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SEGURIDAD (Row Level Security - RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_inbox ENABLE ROW LEVEL SECURITY;

-- Políticas de Privacidad
CREATE POLICY "Profiles are private" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Folders are private" ON folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Properties are private" ON properties FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Inbox is private" ON link_inbox FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Renovations are private/collaborative" ON renovations FOR ALL USING (
  auth.uid() = author_id OR 
  EXISTS (SELECT 1 FROM properties WHERE id = property_id AND user_id = auth.uid())
);

-- 5. TRIGGER PARA PERFIL AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email, 'Buyer');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
