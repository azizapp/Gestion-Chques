
import { createClient } from '@supabase/supabase-js';

// Supabase project details - reads from env vars with hardcoded fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://isvhmsatlnwykmwukurh.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4lFHcw3ymRZBCN_tlmCE7Q_pW_qhaS1';

export const isConfigured = true;

console.log("🚀 Supabase: Initiating connection to", supabaseUrl);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit'
  },
  global: {
    headers: { 'x-application-name': 'finansse-pro-v2' }
  }
});
