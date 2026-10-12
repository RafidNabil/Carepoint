import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity, CalendarDays, ClipboardList, CreditCard, Database, FileText, LayoutDashboard,
  LogOut, Menu, Search, ShieldCheck, Stethoscope, Users, UserRound,
  WalletCards, X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { useNotice } from "@/components/shared/useNotice";
import { Button } from "@/components/ui";
import { cn, initials } from "@/lib/utils";
import type { Role } from "@/types";

const navItems: Record<Role, Array<{ label: string; to: string; icon: typeof LayoutDashboard }>> = {
  PATIENT: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard },
    { label: "Find a doctor", to: "/portal/doctors", icon: Search },
    { label: "Appointments", to: "/portal/appointments", icon: CalendarDays },
    { label: "Prescriptions", to: "/portal/prescriptions", icon: ClipboardList },
    { label: "Invoices", to: "/portal/invoices", icon: FileText },
    { label: "Payments", to: "/portal/payments", icon: CreditCard },
    { label: "My profile", to: "/portal/profile", icon: UserRound },
  ],
  DOCTOR: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard },
    { label: "Appointments", to: "/portal/appointments", icon: CalendarDays },
    { label: "Prescriptions", to: "/portal/prescriptions", icon: ClipboardList },
    { label: "Invoices", to: "/portal/invoices", icon: FileText },
    { label: "Payments", to: "/portal/payments", icon: WalletCards },
    { label: "My profile", to: "/portal/profile", icon: UserRound },
  ],
  ADMIN: [
    { label: "Overview", to: "/portal", icon: LayoutDashboard },
    { label: "Doctors", to: "/portal/admin/doctors", icon: Stethoscope },
    { label: "Patients", to: "/portal/admin/patients", icon: Users },
    { label: "Appointments", to: "/portal/admin/appointments", icon: CalendarDays },
    { label: "Schedules", to: "/portal/admin/schedules", icon: Activity },
    { label: "Invoices", to: "/portal/admin/invoices", icon: FileText },
    { label: "Cash payments", to: "/portal/admin/payments", icon: WalletCards },
    { label: "Reports", to: "/portal/admin/reports", icon: ClipboardList },
    { label: "Reset data", to: "/portal/admin/reset-data", icon: Database },
    // { label: "Clinic settings", to: "/portal/admin/settings", icon: Settings2 },
    // { label: "Booking rules", to: "/portal/admin/booking-rules", icon: CalendarDays },
    { label: "Roles & permissions", to: "/portal/admin/roles", icon: ShieldCheck },
    { label: "Audit logs", to: "/portal/admin/audit-logs", icon: Activity },
  ],
};

function displayName(first?: string, last?: string) {
  return [first, last].filter(Boolean).join(" ") || "Clinic user";
}

export function PortalLayout() {
  const { user, logout } = useAuth();
  const notify = useNotice();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;
  const profile = user.role === "PATIENT" ? user.patient : user.doctor;
  const name = displayName(profile?.firstName, profile?.lastName);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to sign out.", "error");
      navigate("/login");
    }
  }

  return (
    <div className="min-h-screen bg-[#f7fafb]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <Brand />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
          {navItems[user.role].map((item) => <NavigationItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />)}
        </nav>
        <AccountCard name={name} role={user.role} onLogout={handleLogout} />
      </aside>
      <div className="lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
            <div className="hidden items-center gap-2 text-sm text-slate-400 sm:flex"><span>Carepoint</span><span>/</span><span className="font-medium text-slate-700">{user.role === "ADMIN" ? "Administration" : `${user.role[0]}${user.role.slice(1).toLowerCase()} portal`}</span></div>
            <div className="sm:hidden font-semibold text-slate-900">Carepoint Clinic</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block"><p className="text-sm font-semibold text-slate-800">{name}</p><p className="text-xs text-slate-500">{user.email ?? user.role}</p></div>
            <div className="flex size-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">{initials(profile?.firstName, profile?.lastName)}</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 sm:py-8 lg:px-9"><Outlet /></main>
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden" role="presentation" onClick={() => setMobileOpen(false)}>
          <aside className="flex h-full w-[min(300px,88vw)] flex-col bg-white shadow-2xl" onClick={(event) => event.stopPropagation()} aria-label="Mobile navigation">
            <div className="flex items-center justify-between pr-3"><Brand /><Button size="icon" variant="ghost" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X className="size-5" /></Button></div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">{navItems[user.role].map((item) => <NavigationItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />)}</nav>
            <AccountCard name={name} role={user.role} onLogout={handleLogout} />
          </aside>
        </div>
      )}
    </div>
  );
}

function Brand() {
  return <div className="flex h-[68px] items-center gap-3 border-b border-slate-100 px-5">
    <div className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-white"><Activity className="size-5" /></div>
    <div><p className="font-bold leading-5 text-slate-950">Carepoint</p><p className="text-[11px] font-medium tracking-wide text-slate-400">CLINIC PORTAL</p></div>
  </div>;
}

function NavigationItem({ label, to, icon: Icon, onClick }: { label: string; to: string; icon: typeof LayoutDashboard; onClick?: () => void }) {
  return <NavLink to={to} end={to === "/portal"} onClick={onClick} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900")}>
    {({ isActive }) => <><Icon className={cn("size-[18px]", isActive ? "text-teal-700" : "text-slate-400")} /><span className="flex-1">{label}</span></>}
  </NavLink>;
}

function AccountCard({ name, role, onLogout }: { name: string; role: Role; onLogout: () => void }) {
  return <div className="border-t border-slate-100 p-4">
    <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2.5"><p className="truncate text-sm font-semibold text-slate-800">{name}</p><p className="mt-0.5 text-xs text-slate-500">{role[0]}{role.slice(1).toLowerCase()} account</p></div>
    <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"><LogOut className="size-4" />Sign out</button>
  </div>;
}
