
import { createClient } from '@supabase/supabase-js';

// URL del proyecto proporcionada por el usuario
const supabaseUrl = 'https://afgjrmhuvnqhosugbtap.supabase.co';
// Clave pública (anon key) proporcionada por el usuario
const supabaseAnonKey = 'sb_publishable_aiMY3FMJnpTHxEzrq1QylQ_nKLPelIM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
