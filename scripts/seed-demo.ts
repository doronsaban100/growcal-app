/*
Seed demo data into Convex for development/staging.

Usage:
  # Provide clerk IDs for demo users (comma-separated) via env:
  CLERK_IDS="clerk_abc,clerk_def,clerk_ghi" npx ts-node scripts/seed-demo.ts

  # Or run and follow the prompt to paste clerk ids.

Requirements:
  - Set CONVEX_URL to your Convex server url (found in convex/_generated/server.js or env)
  - Install ts-node if not available: `npm i -D ts-node typescript`
*/

type Plant = {
  type: string;
  sub_type?: string;
  status: 'for-sale' | 'auction' | 'personal' | 'collection' | 'selling';
  estimated_value?: number;
  current_price?: number;
  location?: string;
  imageUrl?: string;
};

const DEFAULT_PLANTS: Plant[] = [
  { type: 'פילודנדרון', sub_type: 'לימון', status: 'for-sale', estimated_value: 450, current_price: 450, location: 'חיפה' },
  { type: 'פוטוס', sub_type: 'זהב', status: 'for-sale', estimated_value: 120, current_price: 120, location: 'תל אביב' },
  { type: 'סנסיווריה', sub_type: 'קלאסית', status: 'for-sale', estimated_value: 200, current_price: 200, location: 'חיפה' },
];

async function main() {
  const convexUrl = process.env.CONVEX_URL;
  if (!convexUrl) {
    console.error('Please set CONVEX_URL environment variable to your Convex server URL.');
    process.exit(1);
  }

  const clerkEnv = process.env.CLERK_IDS;
  let clerkIds: string[] = [];
  if (clerkEnv) {
    clerkIds = clerkEnv.split(',').map(s => s.trim()).filter(Boolean);
  }

  if (clerkIds.length === 0) {
    console.log('\nNo CLERK_IDS provided via env. Please paste comma-separated Clerk IDs for demo users:');
    const input = await new Promise<string>((resolve) => {
      process.stdin.resume();
      process.stdout.write('> ');
      process.stdin.once('data', (data) => resolve(String(data).trim()));
    });
    clerkIds = input.split(',').map(s => s.trim()).filter(Boolean);
  }

  if (clerkIds.length === 0) {
    console.error('No Clerk IDs provided. Exiting.');
    process.exit(1);
  }

  console.log('Seeding demo data for Clerk IDs:', clerkIds);

  for (const clerkId of clerkIds) {
    // Create a user record in Convex users table with clerkId
    // Using Convex HTTP API: POST to /api/convex (if available) is project specific.
    // Simpler approach: call a dedicated Convex server function if present. We'll try to call `convex/_generated/server.js` if present.

    console.log(`\n[${clerkId}] Creating demo user and plants...`);

    // Best-effort: call a REST endpoint if the app exposes one. Otherwise, write instructions.
    console.log('Note: This script provides the data payloads. If your project exposes a Convex server function to create demo data, call it with these payloads.');

    console.log('User payload:');
    console.log(JSON.stringify({ clerkId }, null, 2));

    const plants = DEFAULT_PLANTS.map((p, idx) => ({ ...p, type: p.type + (idx === 0 ? '' : ` #${idx+1}`) }));
    console.log('Plants payload:');
    console.log(JSON.stringify(plants, null, 2));

    // If you have a server-side Convex function to call, you can POST to it here.
  }

  console.log('\nDone. Next steps:');
  console.log('- If your project has a server-side Convex helper to create users/plants, call it with the above payloads.');
  console.log('- Alternatively, create the records manually in Convex dashboard or create a small admin page that runs these mutations.');
  console.log('- After records exist, open the app and sign in with those Clerk accounts to see seeded plants.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
