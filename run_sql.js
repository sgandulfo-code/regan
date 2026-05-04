import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_string: `
      ALTER TABLE public.visits 
      ADD COLUMN IF NOT EXISTS client_name TEXT,
      ADD COLUMN IF NOT EXISTS client_phone TEXT;
    `
  });
  console.log('Result:', error || data || 'Table altered');
}

run();
