import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage, RegisterPage } from "@/features/auth/AuthPages";
import { AdminPage } from "@/features/admin/AdminPages";
import { PortalLayout } from "@/components/layout/PortalLayout";
import { ForbiddenPage, NotFoundPage, ProtectedRoute, UnauthorizedPage } from "@/components/shared/RouteStates";
import { Dashboard } from "@/features/portal/Dashboard";
import {
  AppointmentDetailsPage,
  AppointmentsPage,
  InvoiceDetailsPage,
  InvoicesPage,
  PaymentsPage,
  PrescriptionDetailsPage,
  PrescriptionsPage,
} from "@/features/portal/CarePages";
import {
  BookAppointmentPage,
  DoctorDetailsPage,
  DoctorsPage,
  ProfilePage,
} from "@/features/portal/PatientPages";

export default function App() {
  return <Routes>
    <Route path="/" element={<Navigate to="/portal" replace />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/forbidden" element={<ForbiddenPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="doctors/:id" element={<DoctorDetailsPage />} />
        <Route path="book/:id" element={<BookAppointmentPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="appointments/:id" element={<AppointmentDetailsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="prescriptions/:id" element={<PrescriptionDetailsPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route element={<ProtectedRoute roles={["PATIENT", "DOCTOR"]} />}>
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route path="admin/:section" element={<AdminPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
