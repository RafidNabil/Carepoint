import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// ==========================================
// PATIENTS
// ==========================================

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

// ==========================================
// ADMIN
// ==========================================

const admin = {
  firstName: "James",
  lastName: "Anderson",
  email: "james.anderson@example.com",
};

// ==========================================
// DOCTORS AND SCHEDULES
// ==========================================

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

// ==========================================
// ROLE PERMISSIONS
// ==========================================

const rolePermissions = {
  ADMIN: [
    "MANAGE_DOCTORS",
    "MANAGE_PATIENTS",
    "MANAGE_APPOINTMENTS",
    "MANAGE_SCHEDULES",
    "MANAGE_PAYMENTS",
    "MANAGE_INVOICES",
    "VIEW_REPORTS",
    "MANAGE_CLINIC_SETTINGS",
    "MANAGE_BOOKING_RULES",
    "MANAGE_ROLES",
    "MANAGE_PERMISSIONS",
    "VIEW_AUDIT_LOGS",
  ],

  DOCTOR: [
    "MANAGE_DOCTOR_PROFILE",
    "MANAGE_DOCTOR_SCHEDULE",
    "VIEW_DOCTOR_APPOINTMENTS",
    "MANAGE_DOCTOR_APPOINTMENTS",
    "VIEW_PATIENT_INFORMATION",
    "MANAGE_PRESCRIPTIONS",
    "RECORD_PAYMENTS",
    "VIEW_DOCTOR_INVOICES",
    "VIEW_DOCTOR_PAYMENTS",
  ],

  PATIENT: [
    "MANAGE_PATIENT_PROFILE",
    "VIEW_DOCTORS",
    "VIEW_DOCTOR_SCHEDULES",
    "BOOK_APPOINTMENTS",
    "VIEW_PATIENT_APPOINTMENTS",
    "VIEW_PATIENT_INVOICES",
    "VIEW_PATIENT_PAYMENTS",
    "VIEW_PATIENT_PRESCRIPTIONS",
  ],
};

// ==========================================
// HELPERS
// ==========================================

const toTime = (time) =>
  new Date(`1970-01-01T${time}:00.000Z`);

// ==========================================
// SEED PATIENTS
// ==========================================

async function seedPatients() {
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

// ==========================================
// SEED ADMIN
// ==========================================

async function seedAdmin() {
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
}

// ==========================================
// SEED DOCTORS AND SCHEDULES
// ==========================================

async function seedDoctors() {
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

// ==========================================
// SEED ROLES AND PERMISSIONS
// ==========================================

async function seedRolesAndPermissions() {
  const permissionNames = [
    ...new Set(Object.values(rolePermissions).flat()),
  ];

  for (const name of permissionNames) {
    await prisma.permission.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const [roleName, permissions] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    for (const permissionName of permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        throw new Error(`Permission not found: ${permissionName}`);
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log("Roles and permissions seeded successfully.");
}

// ==========================================
// MAIN
// ==========================================

async function main() {
  await seedPatients();
  await seedAdmin();
  await seedDoctors();
  await seedRolesAndPermissions();

  console.log("All seed data created successfully.");
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });