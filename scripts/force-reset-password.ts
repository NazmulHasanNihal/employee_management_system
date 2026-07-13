import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const email = 'nazmulhas36@gmail.com';
  const password = '@nazmul@1220@';

  console.log(`Finding user ${email}...`);
  const users = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = users.data.users.find((u: any) => u.email === email);
  
  if (!existingUser) {
    console.log('User not found. Creating anew...');
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: 'Admin', name: 'Md. Nazmul' }
    });
    if (error) throw error;
    console.log('Created user:', data.user.id);
  } else {
    console.log(`Found user ${existingUser.id}. Forcing password reset & email confirm...`);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: password,
      email_confirm: true
    });
    if (error) throw error;
    console.log('Password successfully hard-reset.');
  }
}

main().catch(console.error);
