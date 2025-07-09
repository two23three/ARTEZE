import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test function to verify connection
export async function testConnection() {
  const { data, error } = await supabase
    .from('artworks')
    .select('title, description, position_x, position_y, position_z, image_url')
    .limit(5);
  
  if (error) {
    console.error('Supabase connection error:', error);
    return null;
  }
  
  console.log('✅ Supabase connected! Sample artworks:', data);
  return data;
}