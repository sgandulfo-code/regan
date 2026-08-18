import { supabase } from './services/supabase';

async function check() {
  const { data, error } = await supabase.from('stage_templates').select('*').limit(1);
  console.log("Data:", data);
  console.log("Error:", error);
}

check();
