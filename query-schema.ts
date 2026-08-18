import { supabase } from './services/supabase';

async function query() {
  const { data, error } = await supabase.rpc('execute_sql', { sql_statement: "SELECT data_type FROM information_schema.columns WHERE table_name = 'stage_templates' AND column_name = 'transaction_type'" });
  console.log("Data:", data);
  console.log("Error:", error);
}

query();
