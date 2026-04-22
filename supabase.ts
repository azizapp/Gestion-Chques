
import { createClient } from '@supabase/supabase-js';

// New Supabase project details provided by user
const supabaseUrl = 'https://isvhmsatlnwykmwukurh.supabase.co';
const supabaseAnonKey = 'sb_publishable_4lFHcw3ymRZBCN_tlmCE7Q_pW_qhaS1';

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
