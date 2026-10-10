import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Card as ShadcnCard, CardContent, CardHeader as ShadcnCardHeader } from "@/components/ui/card";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import {
  Table as ShadcnTable,
  TableCell,
  TableHead,
} from "@/components/ui/table";

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  type?: "button" | "submit" | "reset";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <ShadcnButton
      ref={ref}
      variant={variant === "primary" ? "default" : variant === "danger" ? "destructive" : variant}
      size={size === "md" ? "lg" : size}
      className={cn(
        "min-h-11 rounded-xl px-4 text-sm font-semibold focus-visible:ring-teal-500",
        variant === "primary" && "bg-teal-700 text-white shadow-sm hover:bg-teal-800",
        variant === "secondary" && "bg-teal-50 text-teal-800 hover:bg-teal-100",
        variant === "outline" && "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        variant === "danger" && "bg-rose-600 text-white hover:bg-rose-700",
        size === "sm" && "min-h-9 px-3 text-sm",
        size === "icon" && "size-10 min-h-10 px-0",
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <ShadcnInput
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/10 disabled:bg-slate-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <ShadcnCard className={cn("gap-0 rounded-2xl border border-slate-200/80 bg-white py-0 text-slate-900 shadow-sm ring-0", className)}>{children}</ShadcnCard>;
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <ShadcnCardHeader className={cn("border-b border-slate-100 px-5 py-4 sm:px-6", className)}>{children}</ShadcnCardHeader>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <CardContent className={cn("p-5 sm:p-6", className)}>{children}</CardContent>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <ShadcnBadge variant={tone === "danger" ? "destructive" : tone === "info" ? "secondary" : "outline"} className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
      tone === "neutral" && "bg-slate-100 text-slate-600",
      tone === "success" && "bg-emerald-50 text-emerald-700",
      tone === "warning" && "bg-amber-50 text-amber-700",
      tone === "danger" && "bg-rose-50 text-rose-700",
      tone === "info" && "bg-sky-50 text-sky-700",
    )}>{children}</ShadcnBadge>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <ShadcnSkeleton aria-hidden="true" className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}

export function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("grid gap-1.5 text-sm font-medium text-slate-700", className)}>
      {label}
      {children}
      {error && <span className="text-xs font-normal text-rose-600">{error}</span>}
    </label>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
      {icon && <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">{icon}</div>}
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <p>{message}</p>
      {retry && <button onClick={retry} className="mt-2 font-semibold underline underline-offset-2">Try again</button>}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function Table({ children }: { children: ReactNode }) {
  return <ShadcnTable className="w-full min-w-[620px] border-collapse text-left text-sm">{children}</ShadcnTable>;
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <TableHead className={cn("h-auto border-b border-slate-100 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500", className)}>{children}</TableHead>;
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <TableCell className={cn("border-b border-slate-50 px-5 py-3.5 align-middle text-slate-700 last:border-0", className)}>{children}</TableCell>;
}
