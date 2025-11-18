import dotenv from 'dotenv';
const local = dotenv.config({ path: '.env.local' });
if (local.error) {
  dotenv.config();
}

import '../lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';

const [, , emailArg, roleArg] = process.argv;

if (!emailArg) {
  console.error('Usage: npm run set-role <email> [role]');
  process.exit(1);
}

const role = (roleArg ?? 'admin') as 'admin' | 'guest';

async function main() {
  const auth = getAuth();
  const user = await auth.getUserByEmail(emailArg);
  await auth.setCustomUserClaims(user.uid, { role });
  console.log(`✅ Set role "${role}" for ${emailArg}`);
}

main().catch((error) => {
  console.error('Failed to set role', error);
  process.exit(1);
});
