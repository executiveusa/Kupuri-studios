import { db, users, tokenBalances } from '../src/db/index';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';

const SEED_EMAIL = 'demo@kupuri.studio';
const SEED_PASSWORD = 'DemoPassword123!';

async function seed() {
  try {
    console.log('🌱 Seeding database...');

    // Check if demo user exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, SEED_EMAIL),
    });

    if (existingUser) {
      console.log('✓ Demo user already exists');
      return;
    }

    // Create demo user
    const userId = randomUUID();
    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, 10);

    await db.insert(users).values({
      id: userId,
      email: SEED_EMAIL,
      name: 'Demo User',
      passwordHash: hashedPassword,
      role: 'user',
    });

    // Create token balance for demo user
    await db.insert(tokenBalances).values({
      userId,
      balance: 5000, // Give demo user 5000 tokens
      spent: 0,
      earned: 5000,
    });

    console.log('✓ Database seeded successfully');
    console.log(`Demo user: ${SEED_EMAIL}`);
    console.log(`Demo password: ${SEED_PASSWORD}`);
    console.log('⚠️  Change password immediately in production!');
  } catch (error) {
    console.error('✗ Seeding failed:', error);
    throw error;
  }
}

seed();
