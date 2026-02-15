import { createClient } from '@supabase/supabase-js';

// URL y Anon Key de tu NUEVO proyecto (xtjmdtgxtqwipmzivlmf)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtjmdtgxtqwipmzivlmf.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publicable_06I0GYY-etmb2asPx7gQSQ_GghR8aXd';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
