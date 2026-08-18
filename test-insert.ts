import { supabase } from './services/supabase';

async function test() {
  const { data, error } = await supabase.from('stage_templates').insert([
    {
      transaction_type: 'Búsqueda Alquiler',
      stage_id: 'test',
      title: 'test',
      order_index: 0
    }
  ]).select();
  console.log("Error:", error);
  if (data && data.length > 0) {
     await supabase.from('stage_templates').delete().eq('id', data[0].id);
  }
}

test();
