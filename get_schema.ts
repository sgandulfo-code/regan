import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://afgjrmhuvnqhosugbtap.supabase.co';
const supabaseKey = 'sb_publishable_aiMY3FMJnpTHxEzrq1QylQ_nKLPelIM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'stage_templates';
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
