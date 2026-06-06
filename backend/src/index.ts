import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db, pool } from './db/index';
import { staff } from './db/schema';

async function main() {
  const username = `john.doe.${Date.now()}`;

  const staffMember: typeof staff.$inferInsert = {
    firstName: 'John',
    lastName: 'Doe',
    phone: '0123456789',
    role: 'employee',
    username,
    password: 'demo-password',
  };

  await db.insert(staff).values(staffMember);
  console.log('New staff member created!');

  const staffMembers = await db.select().from(staff);
  console.log('Getting all staff members from the database: ', staffMembers);

  await db
    .update(staff)
    .set({
      lastName: 'Smith',
    })
    .where(eq(staff.username, username));
  console.log('Staff member info updated!');

  await db.delete(staff).where(eq(staff.username, username));
  console.log('Staff member deleted!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
