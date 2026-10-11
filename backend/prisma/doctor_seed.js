import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const doctors = [
  {
    firstName: "Alexander",
    lastName: "Reed",
    email: "alexander.reed@example.com",
    phone: "2025550101",
    specialization: "Cardiology",
    qualification: "MBBS, MD (Cardiology)",
    experience: "12 years",
    bio: "Specializes in cardiovascular disease prevention, diagnosis, and treatment.",
    consultationFee: 1200,
    schedules: [
      { dayOfWeek: 1, start: "09:00", end: "13:00" },
      { dayOfWeek: 3, start: "09:00", end: "13:00" },
      { dayOfWeek: 5, start: "09:00", end: "13:00" },
    ],
  },
  {
    firstName: "Victoria",
    lastName: "Hayes",
    email: "victoria.hayes@example.com",
    phone: "2025550102",
    specialization: "Dermatology",
    qualification: "MBBS, DDV",
    experience: "8 years",
    bio: "Focuses on skin conditions, acne, eczema, and allergies.",
    consultationFee: 1000,
    schedules: [
      { dayOfWeek: 2, start: "14:00", end: "18:00" },
      { dayOfWeek: 4, start: "14:00", end: "18:00" },
      { dayOfWeek: 6, start: "09:00", end: "13:00" },
    ],
  },
  {
    firstName: "Nathan",
    lastName: "Brooks",
    email: "nathan.brooks@example.com",
    phone: "2025550103",
    specialization: "Neurology",
    qualification: "MBBS, MD (Neurology)",
    experience: "10 years",
    bio: "Treats neurological disorders, headaches, migraines, and epilepsy.",
    consultationFee: 1500,
    schedules: [
      { dayOfWeek: 1, start: "14:00", end: "18:00" },
      { dayOfWeek: 3, start: "14:00", end: "18:00" },
      { dayOfWeek: 6, start: "09:00", end: "12:00" },
    ],
  },
  {
    firstName: "Emily",
    lastName: "Foster",
    email: "emily.foster@example.com",
    phone: "2025550104",
    specialization: "Pediatrics",
    qualification: "MBBS, FCPS (Pediatrics)",
    experience: "7 years",
    bio: "Provides healthcare for infants, children, and adolescents.",
    consultationFee: 900,
    schedules: [
      { dayOfWeek: 0, start: "09:00", end: "13:00" },
      { dayOfWeek: 2, start: "09:00", end: "13:00" },
      { dayOfWeek: 4, start: "09:00", end: "13:00" },
    ],
  },
  {
    firstName: "Christopher",
    lastName: "Morgan",
    email: "christopher.morgan@example.com",
    phone: "2025550105",
    specialization: "Orthopedics",
    qualification: "MBBS, MS (Orthopedics)",
    experience: "14 years",
    bio: "Treats bone, joint, muscle, and sports-related injuries.",
    consultationFee: 1300,
    schedules: [
      { dayOfWeek: 1, start: "10:00", end: "14:00" },
      { dayOfWeek: 4, start: "10:00", end: "14:00" },
      { dayOfWeek: 6, start: "14:00", end: "18:00" },
    ],
  },
  {
    firstName: "Rebecca",
    lastName: "Collins",
    email: "rebecca.collins@example.com",
    phone: "2025550106",
    specialization: "Gynecology",
    qualification: "MBBS, FCPS (Obstetrics and Gynecology)",
    experience: "11 years",
    bio: "Provides women's healthcare and reproductive health services.",
    consultationFee: 1200,
    schedules: [
      { dayOfWeek: 0, start: "14:00", end: "18:00" },
      { dayOfWeek: 2, start: "14:00", end: "18:00" },
      { dayOfWeek: 5, start: "09:00", end: "13:00" },
    ],
  },
  {
    firstName: "Daniel",
    lastName: "Parker",
    email: "daniel.parker@example.com",
    phone: "2025550107",
    specialization: "Gastroenterology",
    qualification: "MBBS, MD (Gastroenterology)",
    experience: "9 years",
    bio: "Focuses on digestive disorders, liver conditions, and gastrointestinal health.",
    consultationFee: 1400,
    schedules: [
      { dayOfWeek: 1, start: "15:00", end: "19:00" },
      { dayOfWeek: 3, start: "15:00", end: "19:00" },
      { dayOfWeek: 5, start: "14:00", end: "18:00" },
    ],
  },
  {
    firstName: "Hannah",
    lastName: "Price",
    email: "hannah.price@example.com",
    phone: "2025550108",
    specialization: "Psychiatry",
    qualification: "MBBS, MD (Psychiatry)",
    experience: "6 years",
    bio: "Provides assessment and treatment for mental health conditions.",
    consultationFee: 1100,
    schedules: [
      { dayOfWeek: 0, start: "10:00", end: "14:00" },
      { dayOfWeek: 2, start: "10:00", end: "14:00" },
      { dayOfWeek: 4, start: "15:00", end: "19:00" },
    ],
  },
  {
    firstName: "Matthew",
    lastName: "Bennett",
    email: "matthew.bennett@example.com",
    phone: "2025550109",
    specialization: "Ophthalmology",
    qualification: "MBBS, DO",
    experience: "15 years",
    bio: "Specializes in vision problems and common eye diseases.",
    consultationFee: 1000,
    schedules: [
      { dayOfWeek: 1, start: "09:00", end: "12:00" },
      { dayOfWeek: 3, start: "09:00", end: "12:00" },
      { dayOfWeek: 6, start: "14:00", end: "18:00" },
    ],
  },
  {
    firstName: "Grace",
    lastName: "Turner",
    email: "grace.turner@example.com",
    phone: "2025550110",
    specialization: "Endocrinology",
    qualification: "MBBS, MD (Endocrinology)",
    experience: "8 years",
    bio: "Focuses on diabetes, thyroid disorders, and hormonal conditions.",
    consultationFee: 1300,
    schedules: [
      { dayOfWeek: 0, start: "09:00", end: "13:00" },
      { dayOfWeek: 3, start: "14:00", end: "18:00" },
      { dayOfWeek: 5, start: "09:00", end: "13:00" },
    ],
  },
];

const toTime = (time) =>
  new Date(`1970-01-01T${time}:00.000Z`);

async function main() {
  const passwordHash = await bcrypt.hash("Doctor@12345", 10);

  for (const doctorData of doctors) {
    const { schedules, ...profile } = doctorData;

    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        passwordHash,
        role: "DOCTOR",
        isActive: true,
      },
      create: {
        email: profile.email,
        passwordHash,
        role: "DOCTOR",
        isActive: true,
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { userId: user.id },
      update: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        specialization: profile.specialization,
        qualification: profile.qualification,
        experience: profile.experience,
        bio: profile.bio,
        consultationFee: profile.consultationFee,
      },
      create: {
        userId: user.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        specialization: profile.specialization,
        qualification: profile.qualification,
        experience: profile.experience,
        bio: profile.bio,
        consultationFee: profile.consultationFee,
      },
    });

    for (const schedule of schedules) {
      const startTime = toTime(schedule.start);
      const endTime = toTime(schedule.end);

      const existingSchedule = await prisma.doctorSchedule.findFirst({
        where: {
          doctorId: doctor.id,
          dayOfWeek: schedule.dayOfWeek,
          startTime,
          endTime,
        },
      });

      if (!existingSchedule) {
        await prisma.doctorSchedule.create({
          data: {
            doctorId: doctor.id,
            dayOfWeek: schedule.dayOfWeek,
            startTime,
            endTime,
          },
        });
      }
    }

    console.log(
      `Seeded doctor and ${schedules.length} schedules: ${profile.firstName} ${profile.lastName}`
    );
  }

  console.log("Successfully seeded 10 doctors with schedules.");
}

main()
  .catch((error) => {
    console.error("Doctor seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });