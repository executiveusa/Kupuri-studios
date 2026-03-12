import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kupuri:kupuri@localhost:5432/kupuri',
});

export const db = drizzle(pool, { schema });

export async function initializeDatabase() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await pool.end();
}

export * from './schema';
