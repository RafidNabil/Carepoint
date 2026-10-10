export type Role = "PATIENT" | "DOCTOR" | "ADMIN";

export interface Patient {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: string | null;
  gender?: string | null;
}

export interface Doctor {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  specialization: string;
  qualification: string;
  experience: string;
  bio?: string | null;
  consultationFee: number | string;
}

export interface SessionUser {
  id: string;
  email?: string;
  role: Role;
  patient?: Patient | null;
  doctor?: Doctor | null;
}

export type AppointmentStatus =
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type PaymentStatus = "PENDING" | "PAID";

export interface Appointment {
  id: string;
  appointmentDate: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  patientId?: string;
  doctorId?: string;
  patient?: Patient;
  doctor?: Doctor;
  invoice?: Invoice | null;
  prescription?: Prescription | null;
}

export interface PrescriptionItem {
  id?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  items: PrescriptionItem[];
  appointment: Appointment;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number | string;
  method: "CASH";
  status: "PENDING" | "COMPLETED";
  paidAt?: string | null;
  invoice: Invoice;
}

export interface Invoice {
  id: string;
  appointmentId: string;
  amount: number | string;
  total: number | string;
  status: "UNPAID" | "PAID";
  issuedAt: string;
  appointment: Appointment;
  payments?: Payment[];
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface ApiRecord {
  id: string;
  [key: string]: unknown;
}
