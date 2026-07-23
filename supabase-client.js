import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './config.js';

if (!SUPABASE_URL || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')) {
  throw new Error('Заполните SUPABASE_PUBLISHABLE_KEY в файле config.js');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
