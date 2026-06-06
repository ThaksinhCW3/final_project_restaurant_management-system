import { drizzle } from "drizzle-orm/mysql2";
import { existsSync } from "fs";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import * as relations from "./relations";
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing from your environment variables!");
}

const databaseUrl = new URL(process.env.DATABASE_URL);

if (databaseUrl.hostname === "db" && !existsSync("/.dockerenv")) {
  databaseUrl.hostname = "localhost";
}

// createPool is synchronous, so this works when tsx compiles as CommonJS.
export const pool = mysql.createPool(databaseUrl.toString());

export const db = drizzle(pool, {
  schema: { ...schema, ...relations }, 
  mode: "default" 
});

console.log("🎯 Database connected successfully via DATABASE_URL!");
