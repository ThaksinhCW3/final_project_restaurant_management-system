import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema.js";
import * as relations from "./relations.js";
import 'dotenv/config';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle(connection, { 
  schema: { ...schema, ...relations }, 
  mode: "default" 
});