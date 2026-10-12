import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlDir = path.resolve(__dirname, "../sql");

const orderedFiles = [
  "roles_rows.sql",
  "permissions_rows.sql",
  "role_permissions_rows.sql",
  "users_rows.sql",
  "patients_rows.sql",
  "doctors_rows.sql",
  "doctor_schedules_rows.sql",
  "appointments_rows.sql",
  "prescriptions_rows.sql",
  "prescription_items_rows.sql",
  "invoices_rows.sql",
  "payments_rows.sql",
  "audit_logs_rows.sql",
];

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not defined");
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log("Connected to database for SQL seeding...");

  try {
    for (const fileName of orderedFiles) {
      const filePath = path.join(sqlDir, fileName);
      if (!fs.existsSync(filePath)) {
        console.warn(`File ${fileName} not found, skipping.`);
        continue;
      }
      const sql = fs.readFileSync(filePath, "utf-8").trim();
      if (!sql) continue;

      console.log(`Executing ${fileName}...`);
      await client.query(sql);
      console.log(`✓ Completed ${fileName}`);
    }
    console.log("All SQL seed data loaded successfully!");
  } catch (error) {
    console.error("Error during SQL seeding:", error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

seed();
