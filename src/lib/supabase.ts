import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jcnwsypnlewliohhycrs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbndzeXBubGV3bGlvaGh5Y3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNTk4NjcsImV4cCI6MjA4MzYzNTg2N30.hniuPkl4yasU90GYzisl0uekyYaTNUQsyQe2h3XvZE0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
