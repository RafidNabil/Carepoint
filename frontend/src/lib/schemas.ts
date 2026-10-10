import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(5).max(30),
  email: z.string().email(),
  password: z.string().min(8, "Use at least 8 characters"),
  dateOfBirth: z.string().optional(),
  gender: z.string().max(50).optional(),
});

export const bookAppointmentSchema = z.object({
  doctorId: z.string().uuid(),
  appointmentDate: z.string().date(),
});

export const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

export const doctorProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  bio: z.string().optional(),
  consultationFee: z.number().nonnegative(),
});

export const prescriptionItemsSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    medication: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    duration: z.string().min(1),
  })).min(1),
});

export type LoginFields = z.infer<typeof loginSchema>;
export type RegisterFields = z.infer<typeof registerSchema>;
export type ProfileFields = z.infer<typeof profileSchema>;
export type DoctorProfileFields = z.infer<typeof doctorProfileSchema>;
