const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing connection to:', supabaseUrl);
  const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
  if (error) {
    console.error('Connection failed:', error.message);
  } else {
    console.log('Connection successful! Profiles count accessible.');
  }
}

testConnection();
