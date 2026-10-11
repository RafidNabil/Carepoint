import { Link, Navigate, Outlet } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { Button, Skeleton } from "@/components/ui";
import type { Role } from "@/types";

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="mx-auto max-w-5xl space-y-5 p-8"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-72" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <Outlet />;
}

export function ForbiddenPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7fafb] p-6">
    <div className="max-w-md text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><ShieldAlert className="size-7" /></div>
      <h1 className="mt-5 text-2xl font-bold text-slate-950">Access not available</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Your account does not have access to this area. If you believe this is a mistake, contact your clinic administrator.</p>
      <Link to="/portal"><Button className="mt-6">Return to your portal</Button></Link>
    </div>
  </div>;
}

export function UnauthorizedPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7fafb] p-6">
    <div className="max-w-md text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700"><ShieldAlert className="size-7" /></div>
      <h1 className="mt-5 text-2xl font-bold text-slate-950">Sign in to continue</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">Your session is missing or has expired. Sign in to securely return to your clinic portal.</p>
      <Link to="/login"><Button className="mt-6">Go to sign in</Button></Link>
    </div>
  </div>;
}

export function NotFoundPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f7fafb] p-6">
    <div className="max-w-md text-center"><p className="text-sm font-bold tracking-[0.18em] text-teal-700">404 · NOT FOUND</p><h1 className="mt-3 text-3xl font-bold tracking-tight">We can’t find that page</h1><p className="mt-2 text-sm leading-6 text-slate-500">The page may have moved, or the link may be incorrect.</p><Link to="/portal"><Button className="mt-6">Go to your portal</Button></Link></div>
  </div>;
}
