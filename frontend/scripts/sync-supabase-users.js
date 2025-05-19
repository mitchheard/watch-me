// scripts/sync-supabase-users.js

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Set these from your Supabase project settings
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const prisma = new PrismaClient();

async function main() {
  let users = [];
  let page = 1;
  let perPage = 100;
  let done = false;

  console.log('Fetching users from Supabase Auth...');
  while (!done) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    users = users.concat(data.users);
    if (data.users.length < perPage) done = true;
    else page++;
  }
  console.log(`Fetched ${users.length} users.`);

  for (const user of users) {
    const id = user.id;
    const email = user.email;
    if (!id || !email) continue;
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id, email },
    });
    console.log(`Synced user: ${email} (${id})`);
  }
  await prisma.$disconnect();
  console.log('Sync complete!');
}

main().catch((err) => {
  console.error('Error syncing users:', err);
  process.exit(1);
}); 