import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { apiErrorMessage } from "@/lib/api";
import { loginSchema, registerSchema, type LoginFields, type RegisterFields } from "@/lib/schemas";
import { useNotice } from "@/components/shared/useNotice";
import { Button, Field, Input, Skeleton } from "@/components/ui";
import type { SessionUser } from "@/types";

function destination(user: SessionUser) {
  return user.role === "ADMIN" ? "/portal" : "/portal";
}

function AuthFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_0.9fr]">
      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-16">
        <Link to="/login" className="flex items-center gap-2.5 font-bold text-slate-950">
          <span className="flex size-9 items-center justify-center rounded-xl bg-teal-700 text-white"><Activity className="size-5" /></span>
          Carepoint
        </Link>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-12">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700">Clinic management</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{label}</h1>
          {children}
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} Carepoint Clinic · Secure patient care</p>
      </section>
      <aside className="relative hidden overflow-hidden bg-[#0e4447] p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-[500px] rounded-full border border-white/10" />
        <div className="absolute -right-4 top-24 size-[340px] rounded-full border border-white/10" />
        <div className="relative max-w-lg pt-14">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold"><ShieldCheck className="size-4" /> Your care, thoughtfully managed</span>
          <h2 className="text-4xl font-semibold leading-[1.18] tracking-tight">A calmer way to care for your health.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-teal-50/75">Manage appointments, stay connected with your care team, and keep your clinic experience in one secure place.</p>
        </div>
        <div className="relative flex items-center gap-3 border-t border-white/15 pt-5 text-sm text-teal-50/65"><span className="size-2 rounded-full bg-emerald-300" />Private access for patients and care teams</div>
      </aside>
    </div>
  );
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const notify = useNotice();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (loading) return <div className="mx-auto mt-24 w-full max-w-sm space-y-4"><Skeleton className="h-10" /><Skeleton className="h-32" /></div>;
  if (user) return <Navigate to={destination(user)} replace />;

  async function submit(values: LoginFields) {
    try {
      const loggedIn = await login(values.email, values.password);
      navigate(destination(loggedIn), { replace: true });
    } catch (error) {
      notify(apiErrorMessage(error), "error");
    }
  }

  return <AuthFrame label="Welcome back">
    <p className="mt-2 text-sm text-slate-500">Sign in to your clinic account to continue.</p>
    <form onSubmit={handleSubmit(submit)} className="mt-8 space-y-5">
      <Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="current-password" placeholder="Enter your password" {...register("password")} /></Field>
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Signing in…" : "Sign in"}<ArrowRight className="size-4" /></Button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">New to Carepoint? <Link className="font-semibold text-teal-800 hover:underline" to="/register">Create a patient account</Link></p>
  </AuthFrame>;
}

export function RegisterPage() {
  const { user, loading, register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const notify = useNotice();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", email: "", password: "", dateOfBirth: "", gender: "" },
  });

  if (loading) return <div className="mx-auto mt-24 w-full max-w-sm space-y-4"><Skeleton className="h-10" /><Skeleton className="h-32" /></div>;
  if (user) return <Navigate to={destination(user)} replace />;

  async function submit(values: RegisterFields) {
    const body: Record<string, unknown> = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
      email: values.email,
      password: values.password,
    };
    if (values.dateOfBirth) body.dateOfBirth = values.dateOfBirth;
    if (values.gender) body.gender = values.gender;
    try {
      const created = await registerAccount(body);
      navigate(destination(created), { replace: true });
    } catch (error) {
      notify(apiErrorMessage(error), "error");
    }
  }

  return <AuthFrame label="Create your account">
    <p className="mt-2 text-sm text-slate-500">Join Carepoint to book and manage your appointments.</p>
    <form onSubmit={handleSubmit(submit)} className="mt-7 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstName?.message}><Input autoComplete="given-name" {...register("firstName")} /></Field>
        <Field label="Last name" error={errors.lastName?.message}><Input autoComplete="family-name" {...register("lastName")} /></Field>
      </div>
      <Field label="Phone number" error={errors.phone?.message}><Input type="tel" autoComplete="tel" {...register("phone")} /></Field>
      <Field label="Email address" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
      <Field label="Password" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date of birth"><Input type="date" {...register("dateOfBirth")} /></Field>
        <Field label="Gender"><Input maxLength={50} placeholder="Optional" {...register("gender")} /></Field>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}<ArrowRight className="size-4" /></Button>
    </form>
    <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-teal-800 hover:underline" to="/login">Sign in</Link></p>
  </AuthFrame>;
}
