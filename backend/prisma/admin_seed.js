import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const admin = {
  firstName: "James",
  lastName: "Anderson",
  email: "james.anderson@example.com",
};

async function main() {
  const passwordHash = await bcrypt.hash("Admin@12345", 10);

  const user = await prisma.user.upsert({
    where: { email: admin.email },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
    create: {
      email: admin.email,
      passwordHash,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log(`Seeded admin: ${admin.firstName} ${admin.lastName}`);
  console.log(`Admin email: ${user.email}`);
  console.log("Successfully seeded admin.");
}

main()
  .catch((error) => {
    console.error("Admin seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });