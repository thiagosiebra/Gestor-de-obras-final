import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcnwsypnlewliohhycrs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_2AxzLaDY7jAVj8eHP8UEwQ_aHttfRnt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
