import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://afgjrmhuvnqhosugbtap.supabase.co';
const supabaseKey = 'sb_publishable_aiMY3FMJnpTHxEzrq1QylQ_nKLPelIM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('activities').select('is_public').limit(1);
  console.log('Result:', error || data);
}
run();
