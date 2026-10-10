import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CircleDollarSign, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotice } from "@/components/shared/useNotice";
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Input, Skeleton } from "@/components/ui";
import { apiErrorMessage, clinicApi } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/utils";
import type { Payment } from "@/types";

export function CashPaymentRecorder() {
  const [selected, setSelected] = useState<Payment | null>(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const notify = useNotice();
  const payments = useQuery({ queryKey: ["payments"], queryFn: clinicApi.payments });
  const pendingPayments = (payments.data ?? []).filter((payment) => {
    const appointment = payment.invoice.appointment;
    const name = `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""} ${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""}`.toLowerCase();
    return payment.status === "PENDING" &&
      payment.invoice.status === "UNPAID" &&
      name.includes(search.toLowerCase());
  });
  const record = useMutation({
    mutationFn: (payment: Payment) => clinicApi.updatePayment(payment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      notify("Cash payment recorded and invoice marked paid.");
      setSelected(null);
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });

  return <>
    <Card className="mb-5">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">Pending cash payments</h2>
        <p className="mt-1 text-sm text-slate-500">Confirm only after receiving the exact payment amount.</p>
      </div>
      <CardBody className="space-y-4">
        <label className="relative block max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-10" placeholder="Search patient or doctor" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        {payments.isError && <ErrorState message={apiErrorMessage(payments.error)} retry={() => void payments.refetch()} />}
        {payments.isPending ? <Skeleton className="h-20" /> : pendingPayments.length ? (
          <div className="space-y-2">{pendingPayments.map((payment) => {
            const appointment = payment.invoice.appointment;
            return <div key={payment.id} className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : "Patient"}
                  {appointment.doctor && <><span className="mx-2 text-slate-300">·</span>Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</>}
                </p>
                <p className="mt-1 text-xs text-slate-500">Appointment {formatDate(appointment.appointmentDate)} · Invoice {payment.invoiceId.slice(0, 8)}</p>
              </div>
              <span className="font-bold text-slate-900">{formatMoney(payment.amount)}</span>
              <Badge tone="warning">Pending</Badge>
              <Button size="sm" onClick={() => setSelected(payment)}><CircleDollarSign className="size-4" />Record cash</Button>
            </div>;
          })}</div>
        ) : <EmptyState icon={<Check className="size-5" />} title="No pending cash payments" description="There are no unpaid pending payment records matching your search." />}
      </CardBody>
    </Card>
    {selected && <Dialog open onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DialogContent showCloseButton={false} className="max-w-md rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-3">
          <DialogTitle className="text-lg font-bold text-slate-950">Confirm cash payment</DialogTitle>
          <button aria-label="Close dialog" onClick={() => setSelected(null)} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">×</button>
        </div>
        <DialogDescription className="mt-2 text-sm leading-6 text-slate-500">
          Confirm receipt of <strong>{formatMoney(selected.amount)}</strong> in cash? This marks the payment and invoice as paid.
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setSelected(null)} disabled={record.isPending}>Go back</Button>
          <Button onClick={() => record.mutate(selected)} disabled={record.isPending}>{record.isPending ? "Recording…" : "Confirm cash received"}</Button>
        </div>
      </DialogContent>
    </Dialog>}
  </>;
}
