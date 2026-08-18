import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://afgjrmhuvnqhosugbtap.supabase.co';
const supabaseKey = 'sb_publishable_aiMY3FMJnpTHxEzrq1QylQ_nKLPelIM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
    ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

    DROP POLICY IF EXISTS "Public can view public activities" ON activities;
    CREATE POLICY "Public can view public activities" ON activities
      FOR SELECT
      USING (
        is_public = true AND
        EXISTS (
          SELECT 1 FROM shared_itineraries
          WHERE shared_itineraries.folder_id = activities.folder_id
          AND shared_itineraries.is_active = true
        )
      );
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql_statement: sql });
  console.log('Result:', error || data || 'Table altered');
}
run();
