import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const patients = [
  {
    firstName: "Olivia",
    lastName: "Bennett",
    email: "olivia.bennett@example.com",
    phone: "2025550101",
    dateOfBirth: new Date("1998-04-12"),
    gender: "FEMALE",
  },
  {
    firstName: "Ethan",
    lastName: "Carter",
    email: "ethan.carter@example.com",
    phone: "2025550102",
    dateOfBirth: new Date("2001-09-25"),
    gender: "MALE",
  },
  {
    firstName: "Sophia",
    lastName: "Mitchell",
    email: "sophia.mitchell@example.com",
    phone: "2025550103",
    dateOfBirth: new Date("1995-01-08"),
    gender: "FEMALE",
  },
  {
    firstName: "Liam",
    lastName: "Anderson",
    email: "liam.anderson@example.com",
    phone: "2025550104",
    dateOfBirth: new Date("2000-06-17"),
    gender: "MALE",
  },
  {
    firstName: "Charlotte",
    lastName: "Wilson",
    email: "charlotte.wilson@example.com",
    phone: "2025550105",
    dateOfBirth: new Date("1997-11-03"),
    gender: "FEMALE",
  },
];

async function main() {
  const passwordHash = await bcrypt.hash("Patient@12345", 10);

  for (const patientData of patients) {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
    } = patientData;

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "PATIENT",
        isActive: true,
      },
      create: {
        email,
        passwordHash,
        role: "PATIENT",
        isActive: true,
      },
    });

    await prisma.patient.upsert({
      where: { userId: user.id },
      update: {
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
      },
      create: {
        userId: user.id,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        gender,
      },
    });

    console.log(`Seeded patient: ${firstName} ${lastName}`);
  }

  console.log("Successfully seeded 5 patients.");
}

main()
  .catch((error) => {
    console.error("Patient seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });