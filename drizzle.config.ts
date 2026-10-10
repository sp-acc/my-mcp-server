import { defineConfig } from 'drizzle-kit';
import { env } from './data/env.ts';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    strict: true,
    verbose: true,
    dbCredentials: {
        database: env.DB_NAME,
        password: env.DB_PASSWORD,
        user: env.DB_USER,
        host: env.DB_HOST,
        port: env.DB_PORT,
        ssl: false,
    },
});