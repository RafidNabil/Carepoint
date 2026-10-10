import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarCheck2, CalendarDays, CircleDollarSign,
  ClipboardList, FileText, HeartPulse, Plus, UsersRound,
} from "lucide-react";
import { clinicApi, adminApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton } from "@/components/ui";
import type { Appointment } from "@/types";

type OverviewReport = {
  totalDoctors: number;
  totalPatients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  paidInvoices: number;
  totalRevenue: number | string;
};

function StatCard({ label, value, detail, icon: Icon, tint = "teal" }: { label: string; value: string | number; detail: string; icon: typeof CalendarDays; tint?: "teal" | "blue" | "violet" | "amber" }) {
  const colors = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-sky-50 text-sky-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return <Card><CardBody className="flex items-start justify-between gap-4">
    <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${colors[tint]}`}><Icon className="size-5" /></span>
  </CardBody></Card>;
}

function LoadingStats() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}</div>;
}

function AppointmentRows({ appointments, emptyText }: { appointments: Appointment[]; emptyText: string }) {
  if (!appointments.length) return <EmptyState icon={<CalendarDays className="size-5" />} title="Nothing on the calendar" description={emptyText} />;
  return <div className="divide-y divide-slate-100">{appointments.slice(0, 5).map((appointment) => {
    const counterpart = appointment.doctor ?? appointment.patient;
    const counterpartName = counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "Appointment";
    return <Link key={appointment.id} to={`/portal/appointments/${appointment.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 sm:px-6">
      <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-teal-800"><span className="text-[10px] font-bold uppercase">{new Intl.DateTimeFormat("en", { month: "short", timeZone: "Asia/Dhaka" }).format(new Date(`${appointment.appointmentDate.slice(0, 10)}T00:00:00Z`))}</span><span className="text-sm font-bold leading-4">{appointment.appointmentDate.slice(8, 10)}</span></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{counterpartName}</p><p className="mt-0.5 truncate text-xs text-slate-500">{formatDate(appointment.appointmentDate)} · Date-based visit</p></div>
      <Badge tone={appointment.paymentStatus === "PAID" ? "success" : "warning"}>{appointment.paymentStatus === "PAID" ? "Paid" : "Payment due"}</Badge>
    </Link>;
  })}</div>;
}

export function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isDoctor = user?.role === "DOCTOR";
  const upcoming = useQuery({ queryKey: ["appointments", "upcoming"], queryFn: clinicApi.upcoming, enabled: !isAdmin });
  const history = useQuery({ queryKey: ["appointments", "history"], queryFn: clinicApi.history, enabled: isDoctor });
  const prescriptions = useQuery({ queryKey: ["prescriptions"], queryFn: clinicApi.prescriptions, enabled: user?.role === "PATIENT" });
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: clinicApi.invoices, enabled: user?.role === "PATIENT" });
  const report = useQuery({ queryKey: ["admin", "reports", "overview"], queryFn: () => adminApi.get<OverviewReport>("reports/overview"), enabled: isAdmin });

  const firstName = user?.patient?.firstName ?? user?.doctor?.firstName ?? (isAdmin ? "Administrator" : "there");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const nextAppointments = upcoming.data ?? [];
  const openInvoices = (invoices.data ?? []).filter((invoice) => invoice.status === "UNPAID");

  return <div>
    <PageHeader eyebrow={isAdmin ? "Clinic administration" : isDoctor ? "Care team" : "Patient portal"} title={`${greeting}, ${firstName}`} description={isAdmin ? "A clear picture of your clinic, appointments, and operations." : isDoctor ? "Your schedule and patient care, all in one place." : "Your care plan, appointments, and clinic details at a glance."}
      action={user?.role === "PATIENT" ? <Link to="/portal/doctors"><Button><Plus className="size-4" />Book an appointment</Button></Link> : undefined} />

    {isAdmin ? (
      <>
        {report.isPending ? <LoadingStats /> : report.isError ? <ErrorState message={apiErrorMessage(report.error)} retry={() => void report.refetch()} /> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total doctors" value={report.data.totalDoctors} detail="Registered in the clinic" icon={HeartPulse} />
          <StatCard label="Total patients" value={report.data.totalPatients} detail="Patient accounts" icon={UsersRound} tint="blue" />
          <StatCard label="Appointments" value={report.data.totalAppointments} detail={`${report.data.completedAppointments} completed`} icon={CalendarCheck2} tint="violet" />
          <StatCard label="Collected revenue" value={formatMoney(report.data.totalRevenue)} detail={`${report.data.paidInvoices} paid invoices`} icon={CircleDollarSign} tint="amber" />
        </div>}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card><CardHeader><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">Clinic operations</h2><p className="mt-1 text-sm text-slate-500">Quick access to the tools you use every day.</p></div><Badge tone="info">Live data</Badge></div></CardHeader>
            <CardBody className="grid gap-3 sm:grid-cols-2">
              <QuickLink to="/portal/admin/appointments" icon={<CalendarDays className="size-5" />} title="Manage appointments" text="Review clinic appointments and update their status" />
              <QuickLink to="/portal/admin/doctors" icon={<HeartPulse className="size-5" />} title="Doctor directory" text="Review doctor profiles and account access" />
              <QuickLink to="/portal/admin/payments" icon={<CircleDollarSign className="size-5" />} title="Cash payments" text="Record cash against an existing invoice" />
              <QuickLink to="/portal/admin/reports" icon={<FileText className="size-5" />} title="Reports & analytics" text="View available appointment and revenue totals" />
            </CardBody>
          </Card>
          <Card><CardHeader><h2 className="font-semibold text-slate-900">Administration</h2><p className="mt-1 text-sm text-slate-500">Configuration access is enforced by the API.</p></CardHeader>
            <CardBody className="space-y-1">
              <AdminLink to="/portal/admin/schedules" title="Doctor schedules" />
              <AdminLink to="/portal/admin/settings" title="Clinic settings" />
              <AdminLink to="/portal/admin/booking-rules" title="Booking rules" />
              <AdminLink to="/portal/admin/roles" title="Roles & permissions" />
              <AdminLink to="/portal/admin/audit-logs" title="Audit logs" />
            </CardBody>
          </Card>
        </div>
      </>
    ) : (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Upcoming visits" value={upcoming.isPending ? "…" : nextAppointments.length} detail={isDoctor ? "Confirmed appointments" : "Confirmed appointments"} icon={CalendarDays} />
          <StatCard label="Past visits" value={isDoctor ? (history.data?.length ?? "…") : "—"} detail={isDoctor ? "Appointment history" : "Visit your appointments"} icon={CalendarCheck2} tint="blue" />
          <StatCard label="Prescriptions" value={user?.role === "PATIENT" ? (prescriptions.data?.length ?? "…") : "—"} detail="Available in your portal" icon={ClipboardList} tint="violet" />
          <StatCard label="Unpaid invoices" value={user?.role === "PATIENT" ? (invoices.data?.length === undefined ? "…" : openInvoices.length) : "—"} detail="Cash payment at the clinic" icon={CircleDollarSign} tint="amber" />
        </div>
        {(upcoming.isError || history.isError || prescriptions.isError || invoices.isError) && <div className="mt-5 space-y-2">
          {[upcoming, history, prescriptions, invoices].filter((query) => query.isError).map((query, index) => <ErrorState key={index} message={apiErrorMessage(query.error)} />)}
        </div>}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <Card><CardHeader><div className="flex items-center justify-between"><div><h2 className="font-semibold text-slate-900">{isDoctor ? "Your upcoming appointments" : "Your next appointments"}</h2><p className="mt-1 text-sm text-slate-500">Upcoming confirmed visits</p></div><Link to="/portal/appointments" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950">View all<ArrowRight className="size-4" /></Link></div></CardHeader>
            {upcoming.isPending ? <CardBody className="space-y-4"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></CardBody> : <AppointmentRows appointments={nextAppointments} emptyText={isDoctor ? "New confirmed visits will appear here." : "Browse the doctor directory to find a care provider."} />}
          </Card>
          <Card><CardHeader><h2 className="font-semibold text-slate-900">Helpful shortcuts</h2><p className="mt-1 text-sm text-slate-500">Get to the right place quickly.</p></CardHeader>
            <CardBody className="space-y-3">
              {user?.role === "PATIENT" && <QuickLink to="/portal/doctors" icon={<HeartPulse className="size-5" />} title="Browse doctors" text="Find a provider by name or specialty" />}
              <QuickLink to="/portal/appointments" icon={<CalendarDays className="size-5" />} title="Appointments" text="Review upcoming visits and history" />
              <QuickLink to="/portal/profile" icon={<UserRoundIcon />} title="Your profile" text="Keep your contact information current" />
              {user?.role === "PATIENT" && <QuickLink to="/portal/invoices" icon={<FileText className="size-5" />} title="Invoices" text="View charges and payment status" />}
            </CardBody>
          </Card>
        </div>
      </>
    )}
  </div>;
}

function UserRoundIcon() {
  return <UsersRound className="size-5" />;
}

function QuickLink({ to, icon, title, text }: { to: string; icon: React.ReactNode; title: string; text: string }) {
  return <Link to={to} className="group flex items-start gap-3 rounded-xl border border-slate-100 p-3.5 transition hover:border-teal-100 hover:bg-teal-50/50">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</span>
    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-800">{title}<ArrowRight className="size-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-teal-700" /></span><span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span></span>
  </Link>;
}

function AdminLink({ to, title }: { to: string; title: string }) {
  return <Link to={to} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-teal-800">{title}<ArrowRight className="size-4 text-slate-300" /></Link>;
}
