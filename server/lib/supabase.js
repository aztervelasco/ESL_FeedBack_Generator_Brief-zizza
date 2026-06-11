import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export let supabase = null;

if (supabaseUrl && supabaseServiceRoleKey) {
  supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    db: { schema: 'public' },
    auth: { persistSession: false },
    global: {
      fetch: (url, options = {}) => {
        // Apply a 8-second timeout to every Supabase request
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout));
      }
    }
  });
  console.log('Supabase client initialized. Testing connection...');

  // Quick connectivity test on startup
  (async () => {
    try {
      const { error } = await supabase.from('feedback_records').select('id').limit(1);
      if (error) {
        console.error('⚠ Supabase connection test FAILED:', error.message);
        console.error('  → Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct in .env');
        console.error('  → Check that the "feedback_records" table exists in your Supabase project');
      } else {
        console.log('✓ Supabase connection test passed.');
      }
    } catch (err) {
      console.error('⚠ Supabase connection test FAILED:', err.message || err);
      if (err.name === 'AbortError') {
        console.error('  → The request timed out. Your Supabase project may be paused or the URL may be wrong.');
      }
      console.error('  → Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the .env file');
    }
  })();
} else {
  console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables. Database integration is disabled.');
}
