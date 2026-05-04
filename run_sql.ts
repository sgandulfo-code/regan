import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afgjrmhuvnqhosugbtap.supabase.co';
const supabaseKey = 'sb_publishable_aiMY3FMJnpTHxEzrq1QylQ_nKLPelIM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    DROP POLICY IF EXISTS "Public can view clients via shared itinerary" ON clients;
    CREATE POLICY "Public can view clients via shared itinerary" ON clients
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM folders
          JOIN shared_itineraries ON shared_itineraries.folder_id = folders.id
          WHERE folders.client_id = clients.id
          AND shared_itineraries.is_active = true
        )
      );
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
  console.log('Result:', error || data || 'Table altered');
}

run();
