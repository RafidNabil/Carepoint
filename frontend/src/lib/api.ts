import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import type {
  Appointment,
  Doctor,
  DoctorSchedule,
  Invoice,
  Patient,
  Payment,
  Prescription,
  SessionUser,
} from "@/types";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _clinicRetried?: boolean;
  }
}

const baseURL = import.meta.env.VITE_API_URL || "/api";
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshRequest: Promise<string> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = axios
      .post<{ success: boolean; data: { accessToken: string } }>(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then(({ data }) => {
        const token = data.data.accessToken;
        setAccessToken(token);
        return token;
      })
      .catch((error: unknown) => {
        setAccessToken(null);
        window.dispatchEvent(new Event("clinic:session-expired"));
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }
  return refreshRequest;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config;
    const isAuthRequest = request?.url?.includes("/auth/");
    if (error.response?.status !== 401 || !request || request._clinicRetried || isAuthRequest) {
      return Promise.reject(error);
    }
    request._clinicRetried = true;
    try {
      const token = await refreshAccessToken();
      request.headers.Authorization = `Bearer ${token}`;
      return api(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data as
      | { message?: string; errors?: Array<{ message?: string }> }
      | undefined;
    if (response?.message) return response.message;
    if (response?.errors?.length) {
      return response.errors.map((item) => item.message).filter(Boolean).join(" ");
    }
    if (error.response?.status === 403) return "You do not have permission to do that.";
    if (error.response?.status === 401) return "Your session has expired. Please sign in again.";
    return error.message || "The request could not be completed.";
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function data<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return promise.then((response) => response.data.data);
}

export const authApi = {
  login: (body: { email: string; password: string }) =>
    api.post<{ data: { user: SessionUser; accessToken: string } }>("/auth/login", body)
      .then((response) => response.data.data),
  register: (body: Record<string, unknown>) =>
    api.post<{ data: { user: SessionUser; accessToken: string } }>("/auth/register", body)
      .then((response) => response.data.data),
  refresh: refreshAccessToken,
  logout: () => api.post("/auth/logout"),
  patientProfile: () => data<Patient>(api.get("/patients/me/profile")),
  doctorProfile: () => data<Doctor>(api.get("/doctors/me/profile")),
};

export const clinicApi = {
  doctors: (search?: string, specialization?: string) =>
    data<Doctor[]>(api.get("/doctors", { params: { search, specialization } })),
  doctor: (id: string) => data<Doctor>(api.get(`/doctors/${id}`)),
  myPatientProfile: () => data<Patient>(api.get("/patients/me/profile")),
  myDoctorProfile: () => data<Doctor>(api.get("/doctors/me/profile")),
  updatePatientProfile: (body: Partial<Patient>) =>
    data<Patient>(api.put("/patients/me/profile", body)),
  updateDoctorProfile: (body: Partial<Doctor>) =>
    data<Doctor>(api.put("/doctors/me/profile", body)),
  availableSchedules: (doctorId: string, date: string) =>
    data<{
      doctor: Pick<Doctor, "id" | "firstName" | "lastName" | "specialization">;
      date: string;
      schedules: DoctorSchedule[];
    }>(api.get("/appointments/available-slots", { params: { doctorId, date } })),
  bookAppointment: (doctorId: string, appointmentDate: string) =>
    data<Appointment>(api.post("/appointments", { doctorId, appointmentDate })),
  upcoming: () => data<Appointment[]>(api.get("/appointments/upcoming")),
  history: () => data<Appointment[]>(api.get("/appointments/history")),
  cancelAppointment: (id: string) => data<Appointment>(api.patch(`/appointments/${id}/cancel`)),
  rescheduleAppointment: (id: string, appointmentDate: string) =>
    data<Appointment>(api.patch(`/appointments/${id}/reschedule`, { appointmentDate })),
  completeAppointment: (id: string) => data<Appointment>(api.patch(`/appointments/${id}/complete`)),
  noShowAppointment: (id: string) => data<Appointment>(api.patch(`/appointments/${id}/no-show`)),
  appointmentPatient: (id: string) => data<Appointment>(api.get(`/appointments/${id}/patient`)),
  prescriptions: () => data<Prescription[]>(api.get("/prescriptions")),
  prescription: (id: string) => data<Prescription>(api.get(`/prescriptions/${id}`)),
  createPrescription: (appointmentId: string, items: Array<Omit<Prescription["items"][number], "id">>) =>
    data<Prescription>(api.post("/prescriptions", { appointmentId, items })),
  updatePrescription: (id: string, items: Prescription["items"]) =>
    data<Prescription>(api.put(`/prescriptions/${id}`, { items })),
  invoices: () => data<Invoice[]>(api.get("/invoices")),
  invoice: (id: string) => data<Invoice>(api.get(`/invoices/${id}`)),
  createInvoice: (body: { appointmentId: string; amount: number; total: number }) =>
    data<Invoice>(api.post("/invoices", body)),
  deleteInvoice: (id: string) => data<{ message: string }>(api.delete(`/invoices/${id}`)),
  payments: () => data<Payment[]>(api.get("/payments")),
  payment: (id: string) => data<Payment>(api.get(`/payments/${id}`)),
  recordCashPayment: (invoiceId: string, amount: number) =>
    data<Payment>(api.post("/payments", { invoiceId, amount })),
};

export const adminApi = {
  get: <T>(path: string, params?: Record<string, string>) => data<T>(api.get(`/admin/${path}`, { params })),
  post: <T>(path: string, body: Record<string, unknown>) => data<T>(api.post(`/admin/${path}`, body)),
  put: <T>(path: string, body: Record<string, unknown>) => data<T>(api.put(`/admin/${path}`, body)),
  patch: <T>(path: string, body: Record<string, unknown> = {}) => data<T>(api.patch(`/admin/${path}`, body)),
  delete: <T>(path: string) => data<T>(api.delete(`/admin/${path}`)),
};
