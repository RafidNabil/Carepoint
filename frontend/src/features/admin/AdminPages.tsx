import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, CalendarDays, CircleDollarSign, FileText,
  Plus, RefreshCw, Search, ShieldCheck, Stethoscope, Trash2, Users,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminApi, apiErrorMessage, clinicApi } from "@/lib/api";
import { CashPaymentRecorder } from "@/features/portal/CashPaymentRecorder";
import { useNotice } from "@/components/shared/useNotice";
import { formatDate, formatMoney, humanize } from "@/lib/utils";
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input, PageHeader, Skeleton, Table, TableWrap, Td, Th } from "@/components/ui";
import type { Appointment, Doctor, DoctorSchedule, Invoice } from "@/types";

type AdminSection = "doctors" | "patients" | "appointments" | "schedules" | "invoices" | "payments" | "reports" | "settings" | "booking-rules" | "roles" | "permissions" | "audit-logs";
type RecordRow = Record<string, unknown> & { id: string };
type DirectoryEntry = {
  id: string;
  firstName: string;
  lastName: string;
  user?: { email: string; isActive: boolean; createdAt: string };
  [key: string]: unknown;
};

const headings: Record<AdminSection, { title: string; eyebrow: string; description: string }> = {
  doctors: { title: "Doctor directory", eyebrow: "People", description: "Review doctor profiles and manage their account access." },
  patients: { title: "Patient directory", eyebrow: "People", description: "Review registered patient accounts and access status." },
  appointments: { title: "All appointments", eyebrow: "Operations", description: "Review clinic appointments and update their status where supported." },
  schedules: { title: "Doctor schedules", eyebrow: "Operations", description: "Maintain weekly clinic availability for registered doctors." },
  invoices: { title: "Invoice management", eyebrow: "Billing", description: "Review, create, or remove eligible invoices. Paid or payment-linked invoices cannot be deleted." },
  payments: { title: "Cash payments", eyebrow: "Billing", description: "Record cash against pending payment records." },
  reports: { title: "Reports & analytics", eyebrow: "Insights", description: "Clinic totals and counts exposed by the existing reporting API." },
  settings: { title: "Clinic settings", eyebrow: "Configuration", description: "Manage the clinic's database-backed key/value settings." },
  "booking-rules": { title: "Booking rules", eyebrow: "Configuration", description: "Manage the booking rules currently stored by the backend." },
  roles: { title: "Roles & permissions", eyebrow: "Access control", description: "Manage database-backed role names and permission assignments." },
  permissions: { title: "Roles & permissions", eyebrow: "Access control", description: "Manage permission names and their role assignments." },
  "audit-logs": { title: "Audit logs", eyebrow: "Governance", description: "Inspect immutable activity records and filter by the supported identifiers." },
};

function parseSection(value?: string): AdminSection | null {
  const sections: AdminSection[] = ["doctors", "patients", "appointments", "schedules", "invoices", "payments", "reports", "settings", "booking-rules", "roles", "permissions", "audit-logs"];
  return sections.includes(value as AdminSection) ? value as AdminSection : null;
}

export function AdminPage() {
  const { section: sectionParam } = useParams();
  const section = parseSection(sectionParam);
  if (!section) return <Card><EmptyState icon={<ShieldCheck className="size-5" />} title="Administration page not found" description="Choose an available administration section from the navigation." /></Card>;
  switch (section) {
    case "doctors": return <DirectoryPage kind="doctors" />;
    case "patients": return <DirectoryPage kind="patients" />;
    case "appointments": return <AdminAppointmentsPage />;
    case "schedules": return <SchedulesPage />;
    case "invoices": return <InvoicesAdminPage />;
    case "payments": return <CashPaymentsPage />;
    case "reports": return <ReportsPage />;
    case "settings": return <KeyValuePage kind="settings" />;
    case "booking-rules": return <KeyValuePage kind="booking-rules" />;
    case "roles": return <RolesPage initialTab="roles" />;
    case "permissions": return <RolesPage initialTab="permissions" />;
    case "audit-logs": return <AuditLogsPage />;
  }
}

function useAdminMutation<TVariables>(
  action: (variables: TVariables) => Promise<unknown>,
  queryKey: unknown[],
  success: string,
) {
  const queryClient = useQueryClient();
  const notify = useNotice();
  return useMutation({
    mutationFn: action,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey });
      notify(success);
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
}

function DirectoryPage({ kind }: { kind: "doctors" | "patients" }) {
  const [search, setSearch] = useState("");
  const queryKey = ["admin", kind];
  const query = useQuery({ queryKey, queryFn: () => adminApi.get<DirectoryEntry[]>(kind) });
  const update = useAdminMutation(({ id, isActive }: { id: string; isActive: boolean }) =>
    adminApi.patch(`${kind}/${id}/status`, { isActive }), queryKey, "Account status updated.");
  const [confirm, setConfirm] = useState<DirectoryEntry | null>(null);
  const filtered = useMemo(() => (query.data ?? []).filter((person) =>
    `${person.firstName} ${person.lastName} ${person.user?.email ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  ), [query.data, search]);
  const isDoctor = kind === "doctors";
  return <div>
    <PageHeader {...headings[kind]} />
    <label className="relative mb-5 block max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-10" placeholder={`Search ${kind} by name or email`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    {query.isError && <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />}
    <Card>{query.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      filtered.length ? <TableWrap><Table><thead><tr><Th>Name</Th><Th>Email</Th><Th>{isDoctor ? "Specialty" : "Phone"}</Th><Th>Joined</Th><Th>Access</Th><Th>Action</Th></tr></thead><tbody>
        {filtered.map((person) => <tr key={person.id}>
          <Td><span className="font-semibold">{person.firstName} {person.lastName}</span></Td>
          <Td>{person.user?.email ?? "—"}</Td>
          <Td>{isDoctor ? String(person.specialization ?? "—") : String(person.phone ?? "—")}</Td>
          <Td>{formatDate(person.user?.createdAt)}</Td>
          <Td><Badge tone={person.user?.isActive ? "success" : "danger"}>{person.user?.isActive ? "Active" : "Inactive"}</Badge></Td>
          <Td><Button variant={person.user?.isActive ? "outline" : "secondary"} size="sm" disabled={update.isPending} onClick={() => setConfirm(person)}>{person.user?.isActive ? "Deactivate" : "Reactivate"}</Button></Td>
        </tr>)}
      </tbody></Table></TableWrap> : <EmptyState icon={isDoctor ? <Stethoscope className="size-5" /> : <Users className="size-5" />} title={`No ${kind} found`} description="The API returned no matching records." />}</Card>
    {confirm && <ConfirmDialog title={`${confirm.user?.isActive ? "Deactivate" : "Reactivate"} this account?`} description={`${confirm.firstName} ${confirm.lastName} · ${confirm.user?.email ?? ""}. This changes account access, not the profile record.`} pending={update.isPending} onClose={() => setConfirm(null)} onConfirm={() => update.mutate({ id: confirm.id, isActive: !confirm.user?.isActive }, { onSuccess: () => setConfirm(null) })} />}
  </div>;
}

function ConfirmDialog({ title, description, pending, destructive = false, onClose, onConfirm }: { title: string; description: string; pending: boolean; destructive?: boolean; onClose: () => void; onConfirm: () => void }) {
  return <AlertDialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <AlertDialogContent className="max-w-md rounded-2xl bg-white p-6">
      <AlertDialogHeader className="text-left">
        <AlertDialogTitle className="text-lg font-bold text-slate-950">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-sm leading-6 text-slate-500">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter className="mt-2 border-0 bg-transparent p-0">
        <AlertDialogCancel disabled={pending}>Go back</AlertDialogCancel>
        <AlertDialogAction
          disabled={pending}
          onClick={onConfirm}
          className={destructive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-teal-700 text-white hover:bg-teal-800"}
        >{pending ? "Working…" : "Confirm"}</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}

function AdminAppointmentsPage() {
  const [search, setSearch] = useState("");
  const queryKey = ["admin", "appointments"];
  const appointments = useQuery({ queryKey, queryFn: () => adminApi.get<Appointment[]>("appointments") });
  const update = useAdminMutation(({ id, status }: { id: string; status: string }) =>
    adminApi.patch(`appointments/${id}/status`, { status }), queryKey, "Appointment status updated.");
  const [selected, setSelected] = useState<{ appointment: Appointment; status: string } | null>(null);
  const filtered = (appointments.data ?? []).filter((appointment) => {
    const haystack = `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""} ${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""} ${appointment.status}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });
  return <div>
    <PageHeader {...headings.appointments} />
    <label className="relative mb-5 block max-w-sm"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input className="pl-10" placeholder="Search patient, doctor, or status" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
    {appointments.isError && <ErrorState message={apiErrorMessage(appointments.error)} retry={() => void appointments.refetch()} />}
    <Card>{appointments.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      filtered.length ? <TableWrap><Table><thead><tr><Th>Date</Th><Th>Patient</Th><Th>Doctor</Th><Th>Payment</Th><Th>Status</Th><Th>Update status</Th></tr></thead><tbody>
        {filtered.map((appointment) => <tr key={appointment.id}>
          <Td>{formatDate(appointment.appointmentDate)}</Td><Td>{appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : "—"}</Td><Td>{appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : "—"}</Td><Td><Badge tone={appointment.paymentStatus === "PAID" ? "success" : "warning"}>{humanize(appointment.paymentStatus)}</Badge></Td><Td><Badge tone={appointment.status === "CONFIRMED" || appointment.status === "COMPLETED" ? "success" : "neutral"}>{humanize(appointment.status)}</Badge></Td>
          <Td><div className="flex items-center gap-2"><select aria-label="New appointment status" className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs" value={appointment.status} onChange={(event) => setSelected({ appointment, status: event.target.value })}>{["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"].map((status) => <option key={status}>{status}</option>)}</select><Link to={`/portal/appointments/${appointment.id}`}><Button variant="ghost" size="sm">Details</Button></Link></div></Td>
        </tr>)}
      </tbody></Table></TableWrap> : <EmptyState icon={<CalendarDays className="size-5" />} title="No appointments found" description="The API returned no matching clinic appointments." />}</Card>
    {selected && selected.status !== selected.appointment.status && <ConfirmDialog title="Update appointment status?" description={`Change the status from ${humanize(selected.appointment.status)} to ${humanize(selected.status)}. The backend may delete an unpaid invoice when cancelling or marking no-show.`} pending={update.isPending} destructive={selected.status === "CANCELLED" || selected.status === "NO_SHOW"} onClose={() => setSelected(null)} onConfirm={() => update.mutate({ id: selected.appointment.id, status: selected.status }, { onSuccess: () => setSelected(null) })} />}
  </div>;
}

function SchedulesPage() {
  const [doctorId, setDoctorId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [confirmDelete, setConfirmDelete] = useState<DoctorSchedule | null>(null);
  const queryClient = useQueryClient();
  const notify = useNotice();
  const doctors = useQuery({ queryKey: ["admin", "doctors"], queryFn: () => adminApi.get<Doctor[]>("doctors") });
  const schedules = useQuery({ queryKey: ["admin", "schedules", doctorId], queryFn: () => adminApi.get<DoctorSchedule[]>(`doctors/${doctorId}/schedules`), enabled: Boolean(doctorId) });
  const invalidate = async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "schedules", doctorId] }); };
  const create = useMutation({
    mutationFn: () => adminApi.post<DoctorSchedule>(`doctors/${doctorId}/schedules`, { dayOfWeek: Number(dayOfWeek), startTime, endTime }),
    onSuccess: async () => { await invalidate(); notify("Schedule saved."); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const update = useMutation({
    mutationFn: ({ id, dayOfWeek: day, startTime: start, endTime: end }: { id: string; dayOfWeek: number; startTime: string; endTime: string }) =>
      adminApi.put<DoctorSchedule>(`schedules/${id}`, { dayOfWeek: day, startTime: start, endTime: end }),
    onSuccess: async () => { await invalidate(); notify("Schedule updated."); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminApi.delete<{ message: string }>(`schedules/${id}`),
    onSuccess: async () => { await invalidate(); notify("Schedule deleted."); setConfirmDelete(null); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  return <div>
    <PageHeader {...headings.schedules} />
    {doctors.isError && <ErrorState message={apiErrorMessage(doctors.error)} retry={() => void doctors.refetch()} />}
    <Card className="mb-5"><CardBody className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto] md:items-end">
      <Field label="Doctor"><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={doctorId} onChange={(event) => setDoctorId(event.target.value)}><option value="">Select a doctor</option>{(doctors.data ?? []).map((doctor) => <option key={doctor.id} value={doctor.id}>Dr. {doctor.firstName} {doctor.lastName}</option>)}</select></Field>
      <Field label="Day of week"><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></Field>
      <Field label="Start time"><Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></Field>
      <Field label="End time"><Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></Field>
      <Button onClick={() => create.mutate()} disabled={!doctorId || create.isPending}>{create.isPending ? "Adding…" : "Add schedule"}<Plus className="size-4" /></Button>
    </CardBody></Card>
    {schedules.isError && <ErrorState message={apiErrorMessage(schedules.error)} retry={() => void schedules.refetch()} />}
    <Card>{schedules.isPending && doctorId ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      !doctorId ? <EmptyState icon={<Stethoscope className="size-5" />} title="Choose a doctor" description="Select a doctor above to view and manage their schedule." /> :
        schedules.data?.length ? <TableWrap><Table><thead><tr><Th>Weekday</Th><Th>Start</Th><Th>End</Th><Th>Actions</Th></tr></thead><tbody>{schedules.data.map((schedule) => <tr key={schedule.id}>
          <Td><select defaultValue={schedule.dayOfWeek} id={`day-${schedule.id}`} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm">{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></Td>
          <Td><Input aria-label="Schedule start" type="time" className="h-9 w-32" defaultValue={clockInput(schedule.startTime)} id={`start-${schedule.id}`} /></Td>
          <Td><Input aria-label="Schedule end" type="time" className="h-9 w-32" defaultValue={clockInput(schedule.endTime)} id={`end-${schedule.id}`} /></Td>
          <Td><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => {
            const day = document.getElementById(`day-${schedule.id}`) as HTMLSelectElement | null;
            const start = document.getElementById(`start-${schedule.id}`) as HTMLInputElement | null;
            const end = document.getElementById(`end-${schedule.id}`) as HTMLInputElement | null;
            if (day && start && end) update.mutate({ id: schedule.id, dayOfWeek: Number(day.value), startTime: start.value, endTime: end.value });
          }} disabled={update.isPending}>Save</Button><Button size="icon" variant="ghost" aria-label="Delete schedule" onClick={() => setConfirmDelete(schedule)}><Trash2 className="size-4 text-rose-600" /></Button></div></Td>
        </tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<CalendarDays className="size-5" />} title="No schedules" description="Add a weekly availability window for this doctor." />}
    </Card>
    {confirmDelete && <ConfirmDialog title="Delete this schedule?" description={`${weekdays[confirmDelete.dayOfWeek]} · ${clockInput(confirmDelete.startTime)}–${clockInput(confirmDelete.endTime)}. The clinic will no longer appear available for this weekday.`} pending={remove.isPending} destructive onClose={() => setConfirmDelete(null)} onConfirm={() => remove.mutate(confirmDelete.id)} />}
    <p className="mt-3 text-xs leading-5 text-slate-400">Schedules define weekday availability. The appointment API checks the weekday only; it does not create time-specific booking slots.</p>
  </div>;
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function clockInput(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 5) : new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Dhaka" }).format(date);
}

function InvoicesAdminPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [total, setTotal] = useState("");
  const [removeTarget, setRemoveTarget] = useState<Invoice | null>(null);
  const queryKey = ["invoices"];
  const invoices = useQuery({ queryKey, queryFn: clinicApi.invoices });
  const appointments = useQuery({ queryKey: ["admin", "appointments"], queryFn: () => adminApi.get<Appointment[]>("appointments") });
  const queryClient = useQueryClient();
  const notify = useNotice();
  const eligible = (appointments.data ?? []).filter((appointment) => ["CONFIRMED", "COMPLETED"].includes(appointment.status) && !appointment.invoice);
  const create = useMutation({
    mutationFn: () => {
      if (!appointmentId || !amount || !total) throw new Error("Choose an appointment and enter its amount and total.");
      return clinicApi.createInvoice({ appointmentId, amount: Number(amount), total: Number(total) });
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); await queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] }); notify("Invoice created."); setCreateOpen(false); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => clinicApi.deleteInvoice(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); notify("Invoice deleted."); setRemoveTarget(null); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  return <div>
    <PageHeader {...headings.invoices} action={<Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Create invoice</Button>} />
    {appointments.isError && <div className="mb-4"><ErrorState message={`Eligible appointments could not be loaded: ${apiErrorMessage(appointments.error)}`} retry={() => void appointments.refetch()} /></div>}
    {invoices.isError && <ErrorState message={apiErrorMessage(invoices.error)} retry={() => void invoices.refetch()} />}
    <Card>{invoices.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      invoices.data?.length ? <TableWrap><Table><thead><tr><Th>Appointment</Th><Th>Patient</Th><Th>Doctor</Th><Th>Total</Th><Th>Status</Th><Th>Payments</Th><Th>Action</Th></tr></thead><tbody>{invoices.data.map((invoice) => <tr key={invoice.id}>
        <Td>{formatDate(invoice.appointment.appointmentDate)}</Td><Td>{invoice.appointment.patient?.firstName} {invoice.appointment.patient?.lastName}</Td><Td>Dr. {invoice.appointment.doctor?.firstName} {invoice.appointment.doctor?.lastName}</Td><Td className="font-semibold">{formatMoney(invoice.total)}</Td><Td><Badge tone={invoice.status === "PAID" ? "success" : "warning"}>{humanize(invoice.status)}</Badge></Td><Td>{invoice.payments?.length ?? 0}</Td><Td><div className="flex gap-2"><Link to={`/portal/invoices/${invoice.id}`}><Button variant="ghost" size="sm">View</Button></Link><Button size="sm" variant="ghost" className="text-rose-700" disabled={invoice.status === "PAID" || Boolean(invoice.payments?.length)} onClick={() => setRemoveTarget(invoice)}>Delete</Button></div></Td>
      </tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<FileText className="size-5" />} title="No invoices" description="Invoices created for appointments will appear here." />}</Card>
    {createOpen && <Modal title="Create an invoice" onClose={() => setCreateOpen(false)}>
      <div className="space-y-4">
        <Field label="Eligible appointment"><select className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" value={appointmentId} onChange={(event) => {
          const selected = eligible.find((appointment) => appointment.id === event.target.value);
          setAppointmentId(event.target.value);
          const fee = Number(selected?.doctor?.consultationFee ?? 0);
          setAmount(fee ? String(fee) : "");
          setTotal(fee ? String(fee) : "");
        }}><option value="">Select appointment</option>{eligible.map((appointment) => <option key={appointment.id} value={appointment.id}>{formatDate(appointment.appointmentDate)} · {appointment.patient?.firstName} {appointment.patient?.lastName} · Dr. {appointment.doctor?.firstName} {appointment.doctor?.lastName}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Amount"><Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></Field><Field label="Total"><Input type="number" min="0" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} /></Field></div>
        {!eligible.length && <p className="text-xs leading-5 text-amber-700">No confirmed/completed appointment without an invoice is currently available. Invoice creation requires MANAGE_INVOICES permission.</p>}
        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCreateOpen(false)}>Close</Button><Button onClick={() => create.mutate()} disabled={create.isPending || !eligible.length}>{create.isPending ? "Creating…" : "Create invoice"}</Button></div>
      </div>
    </Modal>}
    {removeTarget && <ConfirmDialog title="Delete this unpaid invoice?" description={`Invoice total ${formatMoney(removeTarget.total)}. The backend rejects deletion of paid invoices and any invoice with payment records.`} pending={remove.isPending} destructive onClose={() => setRemoveTarget(null)} onConfirm={() => remove.mutate(removeTarget.id)} />}
  </div>;
}

function CashPaymentsPage() {
  const payments = useQuery({ queryKey: ["payments"], queryFn: clinicApi.payments });
  return <div>
    <PageHeader {...headings.payments} />
    <CashPaymentRecorder />
    <Card><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Recent payment records</h2></div>
      {payments.isError && <CardBody><ErrorState message={apiErrorMessage(payments.error)} retry={() => void payments.refetch()} /></CardBody>}
      {payments.isPending ? <CardBody><Skeleton className="h-28" /></CardBody> : payments.data?.length ? <TableWrap><Table><thead><tr><Th>Payment date</Th><Th>Patient</Th><Th>Doctor</Th><Th>Amount</Th><Th>Method</Th><Th>Status</Th></tr></thead><tbody>{payments.data.slice(0, 10).map((payment) => <tr key={payment.id}><Td>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</Td><Td>{payment.invoice.appointment.patient?.firstName} {payment.invoice.appointment.patient?.lastName}</Td><Td>Dr. {payment.invoice.appointment.doctor?.firstName} {payment.invoice.appointment.doctor?.lastName}</Td><Td className="font-semibold">{formatMoney(payment.amount)}</Td><Td><Badge tone="info">{payment.method}</Badge></Td><Td><Badge tone={payment.status === "COMPLETED" ? "success" : "warning"}>{humanize(payment.status)}</Badge></Td></tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<FileText className="size-5" />} title="No payment records" description="Payment records will appear here when an invoice is created." />}
    </Card>
  </div>;
}

interface OverviewReport {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  paidInvoices: number;
  totalRevenue: number | string;
}
interface AppointmentReport { confirmed: number; completed: number; cancelled: number; noShow: number }
interface RevenueReport { paid: number | string; unpaid: number | string }

function ReportsPage() {
  const overview = useQuery({ queryKey: ["admin", "reports", "overview"], queryFn: () => adminApi.get<OverviewReport>("reports/overview") });
  const appointments = useQuery({ queryKey: ["admin", "reports", "appointments"], queryFn: () => adminApi.get<AppointmentReport>("reports/appointments") });
  const revenue = useQuery({ queryKey: ["admin", "reports", "revenue"], queryFn: () => adminApi.get<RevenueReport>("reports/revenue") });
  return <div>
    <PageHeader {...headings.reports} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <ReportStat label="Doctors" value={overview.data?.totalDoctors} query={overview} icon={<Stethoscope className="size-5" />} />
      <ReportStat label="Patients" value={overview.data?.totalPatients} query={overview} icon={<Users className="size-5" />} />
      <ReportStat label="Appointments" value={overview.data?.totalAppointments} query={overview} icon={<CalendarDays className="size-5" />} />
      <ReportStat label="Collected revenue" value={overview.data ? formatMoney(overview.data.totalRevenue) : undefined} query={overview} icon={<CircleDollarSign className="size-5" />} />
    </div>
    {overview.isError && <div className="mt-4"><ErrorState message={apiErrorMessage(overview.error)} retry={() => void overview.refetch()} /></div>}
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <Card><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Appointment status</h2><p className="mt-1 text-sm text-slate-500">Current totals by backend status.</p></div><CardBody>
        {appointments.isError ? <ErrorState message={apiErrorMessage(appointments.error)} retry={() => void appointments.refetch()} /> : appointments.isPending ? <Skeleton className="h-36" /> : <div className="space-y-4">{[
          // ["Confirmed", appointments.data.confirmed, "bg-sky-500"],
          ["Completed", appointments.data.completed, "bg-emerald-500"],
          ["Cancelled", appointments.data.cancelled, "bg-slate-400"],
          ["No-show", appointments.data.noShow, "bg-amber-500"]].map(([label, value, color]) => <div key={String(label)}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{label}</span><strong className="text-slate-900">{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Number(value) / Math.max(1, appointments.data.confirmed + appointments.data.completed + appointments.data.cancelled + appointments.data.noShow) * 100)}%` }} /></div></div>)}</div>}
      </CardBody></Card>
      <Card><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Invoice revenue</h2><p className="mt-1 text-sm text-slate-500">Totals returned by invoice status.</p></div><CardBody>
        {revenue.isError ? <ErrorState message={apiErrorMessage(revenue.error)} retry={() => void revenue.refetch()} /> : revenue.isPending ? <Skeleton className="h-36" /> : <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Paid invoices</p><p className="mt-2 text-2xl font-bold text-emerald-900">{formatMoney(revenue.data.paid)}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Unpaid invoices</p><p className="mt-2 text-2xl font-bold text-amber-900">{formatMoney(revenue.data.unpaid)}</p></div></div>}
      </CardBody></Card>
    </div>
    <p className="mt-4 text-xs leading-5 text-slate-400">The backend exposes aggregate totals only. No date range or time-series breakdown is available, so charts are limited to the returned status proportions.</p>
  </div>;
}

function ReportStat({ label, value, query, icon }: { label: string; value?: string | number; query: { isPending: boolean; isError: boolean }; icon: React.ReactNode }) {
  return <Card><CardBody className="flex items-start justify-between"><div><p className="text-sm text-slate-500">{label}</p>{query.isPending ? <Skeleton className="mt-2 h-7 w-20" /> : <p className="mt-2 text-2xl font-bold text-slate-950">{query.isError ? "—" : value}</p>}</div><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</span></CardBody></Card>;
}

function KeyValuePage({ kind }: { kind: "settings" | "booking-rules" }) {
  const endpoint = kind === "settings" ? "settings" : "booking-rules";
  const queryKey = ["admin", endpoint];
  const query = useQuery({ queryKey, queryFn: () => adminApi.get<Array<{ id: string; key: string; value: string }>>(endpoint) });
  const queryClient = useQueryClient();
  const notify = useNotice();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [edit, setEdit] = useState<{ id: string; value: string } | null>(null);
  const [remove, setRemove] = useState<{ id: string; key: string } | null>(null);
  const create = useMutation({
    mutationFn: () => adminApi.post(endpoint, { key, value }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); notify(kind === "settings" ? "Clinic setting created." : "Booking rule created."); setKey(""); setValue(""); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const update = useMutation({
    mutationFn: () => { if (!edit) throw new Error("No row selected."); return adminApi.put(`${endpoint}/${edit.id}`, { value: edit.value }); },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); notify("Value updated."); setEdit(null); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const removeMutation = useMutation({
    mutationFn: (id: string) => adminApi.delete(`${endpoint}/${id}`),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey }); notify("Record deleted."); setRemove(null); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  return <div>
    <PageHeader {...headings[kind]} />
    <Card className="mb-5"><CardBody className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
      <Field label="Key"><Input value={key} onChange={(event) => setKey(event.target.value)} placeholder="Exact configuration key" /></Field>
      <Field label="Value"><Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Stored as a string" /></Field>
      <Button onClick={() => create.mutate()} disabled={create.isPending || !key.trim()}><Plus className="size-4" />{create.isPending ? "Adding…" : "Add record"}</Button>
    </CardBody></Card>
    {query.isError && <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />}
    <Card>{query.isPending ? <CardBody><Skeleton className="h-40" /></CardBody> :
      query.data?.length ? <TableWrap><Table><thead><tr><Th>Key</Th><Th>Value</Th><Th>Actions</Th></tr></thead><tbody>{query.data.map((row) => <tr key={row.id}><Td className="font-semibold">{row.key}</Td><Td>{edit?.id === row.id ? <Input aria-label={`Edit ${row.key}`} value={edit.value} onChange={(event) => setEdit({ ...edit, value: event.target.value })} /> : <span className="break-all">{row.value}</span>}</Td><Td><div className="flex gap-1">{edit?.id === row.id ? <><Button size="sm" onClick={() => update.mutate()} disabled={update.isPending}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button></> : <Button size="sm" variant="outline" onClick={() => setEdit({ id: row.id, value: row.value })}>Edit value</Button>}<Button size="icon" variant="ghost" aria-label={`Delete ${row.key}`} onClick={() => setRemove({ id: row.id, key: row.key })}><Trash2 className="size-4 text-rose-600" /></Button></div></Td></tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<Activity className="size-5" />} title={`No ${kind === "settings" ? "clinic settings" : "booking rules"}`} description="Create a key and value above. The backend stores values as strings and does not define their interpretation." />}</Card>
    {remove && <ConfirmDialog title={`Delete “${remove.key}”?`} description="This permanently removes the configuration record." pending={removeMutation.isPending} destructive onClose={() => setRemove(null)} onConfirm={() => removeMutation.mutate(remove.id)} />}
    <p className="mt-3 text-xs text-slate-400">Only the backend's raw key/value records are displayed; no undocumented booking behavior is inferred.</p>
  </div>;
}

interface RoleRecord { id: string; name: string; permissions?: Array<{ roleId: string; permissionId: string; permission: { id: string; name: string } }> }
interface PermissionRecord { id: string; name: string }

function RolesPage({ initialTab }: { initialTab: "roles" | "permissions" }) {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");
  const [permissionId, setPermissionId] = useState("");
  const queryClient = useQueryClient();
  const notify = useNotice();
  const roles = useQuery({ queryKey: ["admin", "roles"], queryFn: () => adminApi.get<RoleRecord[]>("roles") });
  const permissions = useQuery({ queryKey: ["admin", "permissions"], queryFn: () => adminApi.get<PermissionRecord[]>("permissions") });
  const saveName = useMutation({
    mutationFn: () => tab === "roles" ? adminApi.post("roles", { name }) : adminApi.post("permissions", { name }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin"] }); notify(`${tab === "roles" ? "Role" : "Permission"} created.`); setName(""); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const assign = useMutation({
    mutationFn: () => adminApi.post(`roles/${roleId}/permissions`, { permissionId }),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }); notify("Permission assigned to role."); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const removeAssignment = useMutation({
    mutationFn: ({ role, permission }: { role: string; permission: string }) => adminApi.delete(`roles/${role}/permissions/${permission}`),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin", "roles"] }); notify("Permission removed from role."); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const deleteItem = useMutation({
    mutationFn: ({ kind, id }: { kind: "roles" | "permissions"; id: string }) => adminApi.delete(`${kind}/${id}`),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["admin"] }); notify("Record deleted."); },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "roles" | "permissions"; id: string; name: string } | null>(null);
  const selectedRole = roles.data?.find((role) => role.id === roleId);
  return <div>
    <PageHeader {...headings.roles} />
    <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit"><button onClick={() => setTab("roles")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "roles" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Roles</button><button onClick={() => setTab("permissions")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === "permissions" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Permissions</button></div>
    {(tab === "roles" && roles.isError || permissions.isError) && <ErrorState message={apiErrorMessage((tab === "roles" && roles.isError ? roles.error : permissions.error))} retry={() => { void roles.refetch(); void permissions.refetch(); }} />}
    <Card className="mb-5"><CardBody className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><Field label={`New ${tab === "roles" ? "role" : "permission"} name`}><Input value={name} onChange={(event) => setName(event.target.value)} placeholder={tab === "roles" ? "Role name" : "Permission name"} /></Field><Button onClick={() => saveName.mutate()} disabled={saveName.isPending || !name.trim()}><Plus className="size-4" />Create {tab === "roles" ? "role" : "permission"}</Button></CardBody></Card>
    {tab === "roles" && <Card className="mb-5"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Assign a permission</h2><p className="mt-1 text-sm text-slate-500">The authorization middleware checks whether a role has any of an endpoint's required permissions.</p></div><CardBody className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field label="Role"><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={roleId} onChange={(event) => setRoleId(event.target.value)}><option value="">Select role</option>{(roles.data ?? []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></Field>
      <Field label="Permission"><select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={permissionId} onChange={(event) => setPermissionId(event.target.value)}><option value="">Select permission</option>{(permissions.data ?? []).map((permission) => <option key={permission.id} value={permission.id}>{permission.name}</option>)}</select></Field>
      <Button onClick={() => assign.mutate()} disabled={!roleId || !permissionId || assign.isPending}>Assign</Button>
    </CardBody></Card>}
    <Card>{tab === "roles" ? roles.isPending ? <CardBody><Skeleton className="h-32" /></CardBody> : roles.data?.length ? <div className="divide-y divide-slate-100">{roles.data.map((role) => <div key={role.id} className="p-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">{role.name}</h3><p className="mt-1 text-xs text-slate-500">{role.permissions?.length ?? 0} assigned permissions</p></div><Button size="sm" variant="ghost" className="text-rose-700" onClick={() => setConfirmDelete({ kind: "roles", id: role.id, name: role.name })}>Delete</Button></div>
      {role.permissions?.length ? <div className="mt-3 flex flex-wrap gap-2">{role.permissions.map(({ permission }) => <span key={permission.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{permission.name}<button aria-label={`Remove ${permission.name} from ${role.name}`} onClick={() => removeAssignment.mutate({ role: role.id, permission: permission.id })} className="ml-1 text-slate-400 hover:text-rose-700">×</button></span>)}</div> : <p className="mt-2 text-xs text-slate-400">No permissions assigned.</p>}</div>)}</div> : <EmptyState icon={<ShieldCheck className="size-5" />} title="No roles returned" description="The database role list is empty or unavailable." /> :
      permissions.isPending ? <CardBody><Skeleton className="h-32" /></CardBody> : permissions.data?.length ? <TableWrap><Table><thead><tr><Th>Permission</Th><Th>Assigned roles</Th><Th>Action</Th></tr></thead><tbody>{permissions.data.map((permission) => <tr key={permission.id}><Td className="font-semibold">{permission.name}</Td><Td>{roles.data?.filter((role) => role.permissions?.some((entry) => entry.permissionId === permission.id)).map((role) => role.name).join(", ") || "—"}</Td><Td><Button size="sm" variant="ghost" className="text-rose-700" onClick={() => setConfirmDelete({ kind: "permissions", id: permission.id, name: permission.name })}>Delete</Button></Td></tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<ShieldCheck className="size-5" />} title="No permissions returned" description="The database permission list is empty or unavailable." />}</Card>
    {confirmDelete && <ConfirmDialog title={`Delete ${confirmDelete.kind === "roles" ? "role" : "permission"} “${confirmDelete.name}”?`} description="This may remove existing role-permission assignments. Confirm only if the clinic intends to change database-backed access." pending={deleteItem.isPending} destructive onClose={() => setConfirmDelete(null)} onConfirm={() => { deleteItem.mutate(confirmDelete); setConfirmDelete(null); }} />}
    {selectedRole && <p className="mt-3 text-xs text-slate-400">Selected role: {selectedRole.name}</p>}
  </div>;
}

function AuditLogsPage() {
  const [filters, setFilters] = useState({ entityType: "", entityId: "", userId: "" });
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const query = useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: () => adminApi.get<RecordRow[]>("audit-logs", Object.fromEntries(Object.entries(filters).filter(([, value]) => value))),
  });
  const detail = useQuery({ queryKey: ["admin", "audit-log", selected?.id], queryFn: () => adminApi.get<RecordRow>(`audit-logs/${selected?.id}`), enabled: Boolean(selected?.id) });
  return <div>
    <PageHeader {...headings["audit-logs"]} />
    <Card className="mb-5"><CardBody className="grid gap-3 md:grid-cols-[1fr_1.2fr_1.2fr_auto] md:items-end">
      <Field label="Entity type"><Input value={filters.entityType} onChange={(event) => setFilters({ ...filters, entityType: event.target.value })} placeholder="e.g. APPOINTMENT" /></Field>
      <Field label="Entity ID (UUID)"><Input value={filters.entityId} onChange={(event) => setFilters({ ...filters, entityId: event.target.value })} /></Field>
      <Field label="User ID (UUID)"><Input value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} /></Field>
      <Button variant="outline" onClick={() => void query.refetch()}><RefreshCw className="size-4" />Apply filters</Button>
    </CardBody></Card>
    {query.isError && <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />}
    <Card>{query.isPending ? <CardBody><Skeleton className="h-40" /></CardBody> : query.data?.length ? <TableWrap><Table><thead><tr><Th>Date</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Details</Th></tr></thead><tbody>{query.data.map((log) => <tr key={log.id}><Td>{formatDate(String(log.createdAt ?? ""))}</Td><Td>{String((log.user as RecordRow | undefined)?.email ?? "—")}</Td><Td><Badge tone="info">{String(log.action ?? "—")}</Badge></Td><Td>{String(log.entityType ?? "—")}<span className="mt-0.5 block text-xs text-slate-400">{String(log.entityId ?? "")}</span></Td><Td><Button size="sm" variant="outline" onClick={() => setSelected(log)}>Inspect</Button></Td></tr>)}</tbody></Table></TableWrap> : <EmptyState icon={<Activity className="size-5" />} title="No audit logs found" description="Try fewer filters or check back after an audited operation." />}</Card>
    {selected && <Modal title="Audit record" onClose={() => setSelected(null)}>{detail.isError ? <ErrorState message={apiErrorMessage(detail.error)} retry={() => void detail.refetch()} /> : detail.isPending ? <Skeleton className="h-40" /> : <pre className="max-h-[60vh] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-5 text-teal-100">{JSON.stringify(detail.data, null, 2)}</pre>}</Modal>}
  </div>;
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false} className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
      <div className="mb-5 flex items-center justify-between gap-4"><DialogTitle className="text-lg font-bold text-slate-950">{title}</DialogTitle><button aria-label="Close dialog" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">×</button></div>
      <DialogDescription className="sr-only">{title}</DialogDescription>
      {children}
    </DialogContent>
  </Dialog>;
}
