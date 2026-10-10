import dotenv from "dotenv";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text } from "drizzle-orm/pg-core";

// Resolve config and seed data relative to this module, not the process cwd,
// so the server keeps working when launched from any directory.
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    address: text("address"),
    phone: text("phone"),
});

const pool = new pg.Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

export const db = drizzle(pool);

async function ensureSchema() {
    await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            address TEXT,
            phone TEXT
        )
    `);
}

type SeedAddress = { street: string; city: string; state: string; zipCode: string };
type SeedUser = {
    id: number;
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    address?: string | SeedAddress;
    phone?: string;
    phoneNumber?: string;
};

// users.json has drifted over time: one record uses firstName/lastName,
// phoneNumber and a nested address object. Flatten everything to the table shape.
function normalizeUser(raw: SeedUser) {
    const name = raw.name ?? `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim();
    const address = typeof raw.address === "string"
        ? raw.address
        : raw.address
            ? `${raw.address.street}, ${raw.address.city}, ${raw.address.state} ${raw.address.zipCode}`
            : null;
    return {
        id: raw.id,
        name,
        email: raw.email,
        address,
        phone: raw.phone ?? raw.phoneNumber ?? null,
    };
}

async function seedIfEmpty() {
    const [row] = await db.select({ value: count() }).from(users);
    if (row.value > 0) return 0;

    const seedPath = path.resolve(__dirname, "../data/users.json");
    const raw = JSON.parse(await fs.readFile(seedPath, "utf8")) as SeedUser[];
    await db.insert(users).values(raw.map(normalizeUser));
    // Keep ids 1-15 from the seed and continue the sequence after them.
    await db.execute(sql`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`);
    return raw.length;
}

export async function initDb() {
    try {
        await pool.query("SELECT 1");
    } catch (err) {
        console.error(`[db] Cannot connect to Postgres (${(err as Error).message})`);
        console.error("[db] Is the container running? Try: docker compose up -d db");
        process.exit(1);
    }
    await ensureSchema();
    const seeded = await seedIfEmpty();
    if (seeded > 0) {
        console.error(`[db] Seeded ${seeded} users from data/users.json`);
    }
}
