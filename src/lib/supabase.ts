import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xtjmdtgxtqwipmzivlmf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0am1kdGd4dHF3aXBteml2bG1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMDc5MzMsImV4cCI6MjA4NjU4MzkzM30.FXoQFHs8OVPqax2WlYfgwhSIyGq4dNoESaRiadrKrjg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
