import { readFile } from "node:fs/promises";

import { prisma } from "../../config/prisma.js";

const seedFiles = [
  "roles_rows.sql",
  "permissions_rows.sql",
  "users_rows.sql",
  "role_permissions_rows.sql",
  "doctors_rows.sql",
  "patients_rows.sql",
  "doctor_schedules_rows.sql",
  "appointments_rows.sql",
  "prescriptions_rows.sql",
  "prescription_items_rows.sql",
  "invoices_rows.sql",
  "payments_rows.sql",
  "audit_logs_rows.sql",
];

const applicationTables = [
  "payments",
  "prescription_items",
  "role_permissions",
  "doctor_schedules",
  "audit_logs",
  "refresh_tokens",
  "prescriptions",
  "invoices",
  "appointments",
  "patients",
  "doctors",
  "users",
  "permissions",
  "roles",
  "clinic_settings",
  "booking_rules",
];

export const resetApplicationData = async () => {
  const scripts = await Promise.all(
    seedFiles.map(async (file) => {
      const sql = await readFile(
        new URL(`../../../sql/${file}`, import.meta.url),
        "utf8"
      );

      if (!sql.trim()) {
        throw new Error(`The reset SQL file is empty: ${file}`);
      }

      return sql;
    })
  );

  await prisma.$transaction(
    async (tx) => {
      const tables = applicationTables
        .map((table) => `public."${table}"`)
        .join(", ");

      await tx.$executeRawUnsafe(
        `TRUNCATE TABLE ${tables} RESTART IDENTITY`
      );

      for (const sql of scripts) {
        await tx.$executeRawUnsafe(sql);
      }
    },
    { timeout: 30000 }
  );

  return { restoredFiles: seedFiles.length };
};
