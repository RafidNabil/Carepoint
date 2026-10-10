import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ClipboardList,
  FileText, Plus, Trash2, UserRound,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CashPaymentRecorder } from "@/features/portal/CashPaymentRecorder";
import { adminApi, apiErrorMessage, clinicApi } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useNotice } from "@/components/shared/useNotice";
import { formatDate, formatMoney, humanize } from "@/lib/utils";
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input, PageHeader, Skeleton, Table, TableWrap, Td, Th } from "@/components/ui";
import type { Appointment, AppointmentStatus, PrescriptionItem } from "@/types";
import { prescriptionItemsSchema } from "@/lib/schemas";

export function AppointmentsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<"upcoming" | "history">("upcoming");
  const [dialog, setDialog] = useState<{ appointment: Appointment; action: "cancel" | "complete" | "no-show" | "reschedule" } | null>(null);
  const [newDate, setNewDate] = useState("");
  const queryClient = useQueryClient();
  const notify = useNotice();
  const upcoming = useQuery({ queryKey: ["appointments", "upcoming"], queryFn: clinicApi.upcoming });
  const history = useQuery({ queryKey: ["appointments", "history"], queryFn: clinicApi.history });

  const update = useMutation({
    mutationFn: async ({ appointment, action, date }: { appointment: Appointment; action: "cancel" | "complete" | "no-show" | "reschedule"; date?: string }) => {
      if (action === "cancel") return clinicApi.cancelAppointment(appointment.id);
      if (action === "complete") return clinicApi.completeAppointment(appointment.id);
      if (action === "no-show") return clinicApi.noShowAppointment(appointment.id);
      if (!date) throw new Error("Select a new date before rescheduling.");
      return clinicApi.rescheduleAppointment(appointment.id, date);
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify(`Appointment ${variables.action === "no-show" ? "marked as no-show" : `${variables.action}d`}.`);
      setDialog(null);
      setNewDate("");
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });

  const items = view === "upcoming" ? upcoming.data : history.data;
  const query = view === "upcoming" ? upcoming : history;
  const isDoctor = user?.role === "DOCTOR";
  return <div>
    <PageHeader eyebrow="Care schedule" title="Appointments" description={isDoctor ? "Review upcoming visits, patient details, and completed appointment history." : "Review your upcoming clinic visits and appointment history."} />
    <div className="mb-5 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
      {(["upcoming", "history"] as const).map((tab) => <button key={tab} onClick={() => setView(tab)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${view === tab ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>{tab === "upcoming" ? "Upcoming" : "History"}</button>)}
    </div>
    {query.isError && <ErrorState message={apiErrorMessage(query.error)} retry={() => void query.refetch()} />}
    <Card>
      {query.isPending ? <CardBody className="space-y-4"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
        items?.length ? <TableWrap><Table><thead><tr><Th>Date</Th><Th>{isDoctor ? "Patient" : "Doctor"}</Th><Th>Status</Th><Th>Payment</Th><Th>Actions</Th></tr></thead><tbody>
          {items.map((appointment) => {
            const other = appointment.doctor ?? appointment.patient;
            return <tr key={appointment.id}>
              <Td><span className="font-semibold text-slate-800">{formatDate(appointment.appointmentDate)}</span><span className="mt-0.5 block text-xs text-slate-400">Date-only appointment</span></Td>
              <Td><Link to={`/portal/appointments/${appointment.id}`} className="font-medium text-slate-800 hover:text-teal-800">{other ? `${isDoctor ? "" : "Dr. "}${other.firstName} ${other.lastName}` : "Clinic visit"}</Link>{isDoctor && appointment.patient?.phone && <span className="mt-0.5 block text-xs text-slate-400">{appointment.patient.phone}</span>}</Td>
              <Td><AppointmentBadge status={appointment.status} /></Td>
              <Td><Badge tone={appointment.paymentStatus === "PAID" ? "success" : "warning"}>{humanize(appointment.paymentStatus)}</Badge></Td>
              <Td><div className="flex flex-wrap gap-1">
                <Link to={`/portal/appointments/${appointment.id}`}><Button variant="ghost" size="sm">Details</Button></Link>
                {isDoctor && view === "upcoming" && appointment.status === "CONFIRMED" && <>
                  <Button variant="secondary" size="sm" onClick={() => setDialog({ appointment, action: "complete" })}><Check className="size-3.5" />Complete</Button>
                  <Button variant="outline" size="sm" onClick={() => setDialog({ appointment, action: "reschedule" })}>Reschedule</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDialog({ appointment, action: "no-show" })}>No-show</Button>
                  <Button variant="ghost" size="sm" className="text-rose-700" onClick={() => setDialog({ appointment, action: "cancel" })}>Cancel</Button>
                </>}
              </div></Td>
            </tr>;
          })}
        </tbody></Table></TableWrap> :
        <EmptyState icon={<CalendarDays className="size-5" />} title={view === "upcoming" ? "No upcoming appointments" : "No appointment history"} description={user?.role === "PATIENT" ? "When you book a clinic visit, it will appear here." : "Appointments matching this view will appear here."} action={user?.role === "PATIENT" && view === "upcoming" ? <Link to="/portal/doctors"><Button>Find a doctor<ArrowRight className="size-4" /></Button></Link> : undefined} />}
    </Card>
    {dialog && <ActionDialog
      appointment={dialog.appointment}
      action={dialog.action}
      date={newDate}
      setDate={setNewDate}
      pending={update.isPending}
      onClose={() => { setDialog(null); setNewDate(""); }}
      onConfirm={() => {
        if (dialog.action !== "cancel" && dialog.action !== "complete" && dialog.action !== "no-show" && !newDate) {
          notify("Choose a new appointment date.", "error");
          return;
        }
        void update.mutateAsync({ appointment: dialog.appointment, action: dialog.action, date: newDate });
      }}
    />}
  </div>;
}

function AppointmentBadge({ status }: { status: AppointmentStatus }) {
  const tone = status === "CONFIRMED" || status === "COMPLETED" ? "success" : status === "NO_SHOW" ? "warning" : "neutral";
  return <Badge tone={tone}>{humanize(status)}</Badge>;
}

function ActionDialog({ appointment, action, date, setDate, pending, onClose, onConfirm }: { appointment: Appointment; action: "cancel" | "complete" | "no-show" | "reschedule"; date: string; setDate: (date: string) => void; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  const title = action === "no-show" ? "Mark as no-show?" : action === "complete" ? "Complete appointment?" : action === "reschedule" ? "Reschedule appointment" : "Cancel appointment?";
  const message = action === "complete" ? "This will mark the appointment as completed." : action === "reschedule" ? "Choose another date on which the doctor has a schedule." : "This action updates the appointment. The clinic may remove the unpaid invoice when cancelling or marking a no-show.";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent showCloseButton={false} className="max-w-md rounded-2xl bg-white p-6">
      <div className="flex items-start justify-between gap-3"><DialogTitle id="action-dialog-title" className="text-lg font-bold text-slate-950">{title}</DialogTitle><button aria-label="Close dialog" onClick={onClose} className="rounded-lg px-2 py-1 text-xl text-slate-400 hover:bg-slate-100">×</button></div>
      <DialogDescription className="mt-2 text-sm leading-6 text-slate-500">{message} Visit date: {formatDate(appointment.appointmentDate)}.</DialogDescription>
      {action === "reschedule" && <Field label="New date" className="mt-4"><Input type="date" min={today} value={date} onChange={(event) => setDate(event.target.value)} /></Field>}
      <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onClose} disabled={pending}>Keep appointment</Button><Button variant={action === "cancel" || action === "no-show" ? "danger" : "primary"} onClick={onConfirm} disabled={pending}>{pending ? "Saving…" : action === "no-show" ? "Mark no-show" : action === "complete" ? "Complete" : action === "reschedule" ? "Reschedule" : "Cancel appointment"}</Button></div>
    </DialogContent>
  </Dialog>;
}

export function AppointmentDetailsPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const upcoming = useQuery({ queryKey: ["appointments", "upcoming"], queryFn: clinicApi.upcoming, enabled: user?.role !== "ADMIN" });
  const history = useQuery({ queryKey: ["appointments", "history"], queryFn: clinicApi.history, enabled: user?.role !== "ADMIN" });
  const appointmentQuery = useQuery({
    queryKey: ["admin", "appointment", id],
    queryFn: () => adminApi.get<Appointment>(`appointments/${id}`),
    enabled: user?.role === "ADMIN",
  });
  const all = [...(upcoming.data ?? []), ...(history.data ?? [])];
  const appointment = user?.role === "ADMIN" ? appointmentQuery.data : all.find((item) => item.id === id);
  const patient = useQuery({
    queryKey: ["appointment", id, "patient"],
    queryFn: () => clinicApi.appointmentPatient(id),
    enabled: user?.role === "DOCTOR" && Boolean(id),
  });
  const isLoading = user?.role === "ADMIN" ? appointmentQuery.isPending : upcoming.isPending || history.isPending;
  const error = user?.role === "ADMIN" ? appointmentQuery.error : upcoming.error ?? history.error;
  if (isLoading) return <Skeleton className="h-80 rounded-2xl" />;
  if (error) return <ErrorState message={apiErrorMessage(error)} retry={() => {
    if (user?.role === "ADMIN") void appointmentQuery.refetch();
    else { void upcoming.refetch(); void history.refetch(); }
  }} />;
  if (!appointment) return <Card><EmptyState icon={<CalendarDays className="size-5" />} title="Appointment not available" description="This appointment may not be in your upcoming/history lists, or it is not available to your role." /></Card>;
  const other = user?.role === "DOCTOR" ? (patient.data?.patient ?? appointment.patient) : appointment.doctor;
  return <div>
    <Link to="/portal/appointments" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-800"><ArrowLeft className="size-4" />Back to appointments</Link>
    <PageHeader eyebrow="Appointment details" title={`${user?.role === "PATIENT" ? "Visit with " : user?.role === "DOCTOR" ? "Visit for " : "Appointment · "}${other ? `${user?.role === "PATIENT" ? "Dr. " : ""}${other.firstName} ${other.lastName}` : formatDate(appointment.appointmentDate)}`} description="Appointments are managed by clinic date; there are no appointment start or end times in the system." />
    {user?.role === "DOCTOR" && patient.isError && <ErrorState message={apiErrorMessage(patient.error)} retry={() => void patient.refetch()} />}
    <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
      <Card><CardBody className="space-y-5">
        <InfoRow label="Date" value={formatDate(appointment.appointmentDate)} icon={<CalendarDays className="size-4" />} />
        <InfoRow label="Appointment status" value={humanize(appointment.status)} icon={<Check className="size-4" />} />
        <InfoRow label="Payment status" value={humanize(appointment.paymentStatus)} icon={<FileText className="size-4" />} />
        {other && <InfoRow label={user?.role === "DOCTOR" ? "Patient" : "Doctor"} value={`${other.firstName} ${other.lastName}${"specialization" in other ? ` · ${other.specialization}` : ""}`} icon={<UserRound className="size-4" />} />}
        {user?.role === "DOCTOR" && patient.data?.patient?.phone && <InfoRow label="Patient phone" value={patient.data.patient.phone} icon={<UserRound className="size-4" />} />}
      </CardBody></Card>
      <Card><CardBody>
        <h2 className="font-semibold text-slate-900">Related care</h2>
        {appointment.invoice ? <Link className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50" to={`/portal/invoices/${appointment.invoice.id}`}><span><span className="block text-sm font-semibold text-slate-800">Invoice</span><span className="mt-1 block text-xs text-slate-500">{formatMoney(appointment.invoice.total)} · {humanize(appointment.invoice.status)}</span></span><ArrowRight className="size-4 text-slate-400" /></Link> : <p className="mt-3 text-sm text-slate-500">No invoice is currently associated with this appointment.</p>}
        {appointment.prescription && <Link className="mt-3 flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50" to={`/portal/prescriptions/${appointment.prescription.id}`}><span><span className="block text-sm font-semibold text-slate-800">Prescription</span><span className="mt-1 block text-xs text-slate-500">{appointment.prescription.items.length} medication items</span></span><ArrowRight className="size-4 text-slate-400" /></Link>}
        {user?.role === "DOCTOR" && appointment.status === "COMPLETED" && <Link to={`/portal/prescriptions?appointment=${appointment.id}`}><Button className="mt-4 w-full"><Plus className="size-4" />Create prescription</Button></Link>}
      </CardBody></Card>
    </div>
  </div>;
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">{icon}</span><span className="flex-1"><span className="block text-xs text-slate-400">{label}</span><span className="mt-0.5 block text-sm font-semibold text-slate-800">{value}</span></span></div>;
}

interface PrescriptionFormValues {
  items: PrescriptionItem[];
}

export function PrescriptionsPage() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const notify = useNotice();
  const prescriptions = useQuery({ queryKey: ["prescriptions"], queryFn: clinicApi.prescriptions });
  const history = useQuery({ queryKey: ["appointments", "history"], queryFn: clinicApi.history, enabled: user?.role === "DOCTOR" });
  const completedWithoutPrescription = (history.data ?? []).filter((appointment) =>
    appointment.status === "COMPLETED" && !(prescriptions.data ?? []).some((prescription) => prescription.appointmentId === appointment.id),
  );
  const [appointmentId, setAppointmentId] = useState(params.get("appointment") ?? "");
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionItemsSchema),
    defaultValues: { items: [{ medication: "", dosage: "", frequency: "", duration: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const create = useMutation({
    mutationFn: (values: PrescriptionFormValues) => {
      if (!appointmentId) throw new Error("Select a completed appointment first.");
      return clinicApi.createPrescription(appointmentId, values.items.map(({ medication, dosage, frequency, duration }) => ({ medication, dosage, frequency, duration })));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      reset({ items: [{ medication: "", dosage: "", frequency: "", duration: "" }] });
      setAppointmentId("");
      notify("Prescription created.");
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const isDoctor = user?.role === "DOCTOR";
  return <div>
    <PageHeader eyebrow="Treatment records" title="Prescriptions" description={isDoctor ? "Create medication instructions for your completed appointments and review prior prescriptions." : "Review prescription details provided by your doctor."} />
    {isDoctor && <Card className="mb-5"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">New prescription</h2><p className="mt-1 text-sm text-slate-500">Only completed appointments you treated can receive a prescription.</p></div>
      <CardBody><form onSubmit={handleSubmit((values) => void create.mutateAsync(values))} className="space-y-4">
        <Field label="Completed appointment" error={errors.root?.message}><select value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-teal-600"><option value="">Select an appointment</option>{completedWithoutPrescription.map((appointment) => <option key={appointment.id} value={appointment.id}>{formatDate(appointment.appointmentDate)} · {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : appointment.id.slice(0, 8)}</option>)}</select></Field>
        {fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-4">
          <Field label="Medication" error={errors.items?.[index]?.medication?.message}><Input {...register(`items.${index}.medication`)} /></Field>
          <Field label="Dosage" error={errors.items?.[index]?.dosage?.message}><Input placeholder="e.g. 500 mg" {...register(`items.${index}.dosage`)} /></Field>
          <Field label="Frequency" error={errors.items?.[index]?.frequency?.message}><Input placeholder="e.g. twice daily" {...register(`items.${index}.frequency`)} /></Field>
          <div className="flex items-end gap-2"><Field label="Duration" className="flex-1" error={errors.items?.[index]?.duration?.message}><Input placeholder="e.g. 7 days" {...register(`items.${index}.duration`)} /></Field>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" aria-label="Remove medication" onClick={() => remove(index)}><Trash2 className="size-4 text-rose-600" /></Button>}</div>
        </div>)}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => append({ medication: "", dosage: "", frequency: "", duration: "" })}><Plus className="size-4" />Add medication</Button><Button type="submit" disabled={create.isPending || !appointmentId}>{create.isPending ? "Saving…" : "Create prescription"}</Button></div>
      </form></CardBody>
    </Card>}
    {(prescriptions.isError || (isDoctor && history.isError)) && <ErrorState message={apiErrorMessage(prescriptions.error ?? history.error)} retry={() => { void prescriptions.refetch(); void history.refetch(); }} />}
    <Card>
      {prescriptions.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
        prescriptions.data?.length ? <TableWrap><Table><thead><tr><Th>Visit date</Th><Th>{isDoctor ? "Patient" : "Doctor"}</Th><Th>Medication items</Th><Th>Details</Th></tr></thead><tbody>
          {prescriptions.data.map((prescription) => {
            const counterpart = isDoctor ? prescription.appointment.patient : prescription.appointment.doctor;
            return <tr key={prescription.id}><Td>{formatDate(prescription.appointment.appointmentDate)}</Td><Td>{counterpart ? `${counterpart.firstName} ${counterpart.lastName}` : "Visit"}</Td><Td>{prescription.items.length} item{prescription.items.length === 1 ? "" : "s"}</Td><Td><Link to={`/portal/prescriptions/${prescription.id}`}><Button variant="outline" size="sm">Open<ArrowRight className="size-4" /></Button></Link></Td></tr>;
          })}
        </tbody></Table></TableWrap> :
        <EmptyState icon={<ClipboardList className="size-5" />} title="No prescriptions yet" description="Prescriptions linked to your completed clinic visits will appear here." />}
    </Card>
  </div>;
}

export function PrescriptionDetailsPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notify = useNotice();
  const prescription = useQuery({ queryKey: ["prescriptions", id], queryFn: () => clinicApi.prescription(id), enabled: Boolean(id) });
  const { register, control, handleSubmit, formState: { errors } } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionItemsSchema),
    values: { items: prescription.data?.items ?? [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const update = useMutation({
    mutationFn: (values: PrescriptionFormValues) => clinicApi.updatePrescription(id, values.items),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["prescriptions", id], updated);
      await queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      notify("Prescription updated.");
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  if (prescription.isPending) return <Skeleton className="h-80 rounded-2xl" />;
  if (prescription.isError) return <ErrorState message={apiErrorMessage(prescription.error)} retry={() => void prescription.refetch()} />;
  const data = prescription.data;
  const doctorCanEdit = user?.role === "DOCTOR" && data.appointment.status === "COMPLETED";
  return <div>
    <Link to="/portal/prescriptions" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-800"><ArrowLeft className="size-4" />Back to prescriptions</Link>
    <PageHeader eyebrow="Prescription details" title={`Medication plan · ${formatDate(data.appointment.appointmentDate)}`} description="Medication instructions associated with this clinic appointment." />
    {doctorCanEdit ? <Card><CardBody><form onSubmit={handleSubmit((values) => void update.mutateAsync(values))} className="space-y-4">
      {fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-xl border border-slate-100 p-4 sm:grid-cols-4">
        <input type="hidden" {...register(`items.${index}.id`)} />
        <Field label="Medication" error={errors.items?.[index]?.medication?.message}><Input {...register(`items.${index}.medication`)} /></Field>
        <Field label="Dosage"><Input {...register(`items.${index}.dosage`)} /></Field>
        <Field label="Frequency"><Input {...register(`items.${index}.frequency`)} /></Field>
        <div className="flex items-end gap-2"><Field label="Duration" className="flex-1"><Input {...register(`items.${index}.duration`)} /></Field><Button type="button" variant="ghost" size="icon" aria-label="Remove medication" onClick={() => remove(index)}><Trash2 className="size-4 text-rose-600" /></Button></div>
      </div>)}
      <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => append({ medication: "", dosage: "", frequency: "", duration: "" })}><Plus className="size-4" />Add medication</Button><Button disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button></div>
    </form></CardBody></Card> :
      <Card><TableWrap><Table><thead><tr><Th>Medication</Th><Th>Dosage</Th><Th>Frequency</Th><Th>Duration</Th></tr></thead><tbody>{data.items.map((item, index) => <tr key={item.id ?? index}><Td className="font-semibold">{item.medication}</Td><Td>{item.dosage}</Td><Td>{item.frequency}</Td><Td>{item.duration}</Td></tr>)}</tbody></Table></TableWrap></Card>}
    {!doctorCanEdit && <p className="mt-3 text-xs text-slate-400">Only the treating doctor can change medication details for a completed appointment.</p>}
  </div>;
}

export function InvoicesPage() {
  const { user } = useAuth();
  const invoices = useQuery({ queryKey: ["invoices"], queryFn: clinicApi.invoices });
  return <div>
    <PageHeader eyebrow="Billing" title="Invoices" description={user?.role === "ADMIN" ? "Review clinic invoices. Cash payment records are managed in the dedicated cash payments section." : "Review invoice amounts and payment status for your appointments."} />
    {invoices.isError && <ErrorState message={apiErrorMessage(invoices.error)} retry={() => void invoices.refetch()} />}
    <Card>{invoices.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      invoices.data?.length ? <TableWrap><Table><thead><tr><Th>Issued</Th><Th>Appointment</Th><Th>{user?.role === "PATIENT" ? "Doctor" : user?.role === "DOCTOR" ? "Patient" : "Patient · Doctor"}</Th><Th>Total</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>
        {invoices.data.map((invoice) => <tr key={invoice.id}><Td>{formatDate(invoice.issuedAt)}</Td><Td>{formatDate(invoice.appointment?.appointmentDate)}</Td><Td>{invoice.appointment?.patient && invoice.appointment?.doctor ? `${invoice.appointment.patient.firstName} ${invoice.appointment.patient.lastName} · Dr. ${invoice.appointment.doctor.firstName} ${invoice.appointment.doctor.lastName}` : invoice.appointment?.doctor ? `Dr. ${invoice.appointment.doctor.firstName} ${invoice.appointment.doctor.lastName}` : invoice.appointment?.patient ? `${invoice.appointment.patient.firstName} ${invoice.appointment.patient.lastName}` : "—"}</Td><Td className="font-semibold">{formatMoney(invoice.total)}</Td><Td><Badge tone={invoice.status === "PAID" ? "success" : "warning"}>{humanize(invoice.status)}</Badge></Td><Td><Link to={`/portal/invoices/${invoice.id}`}><Button variant="outline" size="sm">Details</Button></Link></Td></tr>)}
      </tbody></Table></TableWrap> : <EmptyState icon={<FileText className="size-5" />} title="No invoices yet" description="Invoices created for clinic appointments will appear here." />}</Card>
    {user?.role === "PATIENT" && <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-900">Payments are recorded as cash by an authorized clinic user. This portal does not process card or online payments.</div>}
  </div>;
}

export function InvoiceDetailsPage() {
  const { id = "" } = useParams();
  const invoice = useQuery({ queryKey: ["invoices", id], queryFn: () => clinicApi.invoice(id), enabled: Boolean(id) });
  if (invoice.isPending) return <Skeleton className="h-80 rounded-2xl" />;
  if (invoice.isError) return <ErrorState message={apiErrorMessage(invoice.error)} retry={() => void invoice.refetch()} />;
  const item = invoice.data;
  return <div>
    <Link to="/portal/invoices" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-800"><ArrowLeft className="size-4" />Back to invoices</Link>
    <PageHeader eyebrow="Billing record" title="Invoice details" description={`Issued ${formatDate(item.issuedAt)} · Appointment ${formatDate(item.appointment.appointmentDate)}`} />
    <Card><CardBody className="space-y-4">
      <InfoLine label="Invoice ID" value={item.id} />
      <InfoLine label="Appointment" value={formatDate(item.appointment.appointmentDate)} />
      <InfoLine label="Consultation amount" value={formatMoney(item.amount)} />
      <InfoLine label="Invoice total" value={formatMoney(item.total)} />
      <InfoLine label="Status" value={humanize(item.status)} />
      {item.payments?.map((payment) => <InfoLine key={payment.id} label={`Payment · ${humanize(payment.method)}`} value={`${formatMoney(payment.amount)} · ${payment.paidAt ? formatDate(payment.paidAt) : "Date not recorded"}`} />)}
    </CardBody></Card>
  </div>;
}

export function PaymentsPage() {
  const payments = useQuery({ queryKey: ["payments"], queryFn: clinicApi.payments });
  const { user } = useAuth();
  return <div>
    <PageHeader eyebrow="Billing" title="Payment history" description="Payments are cash-based records created at the clinic." />
    {(user?.role === "DOCTOR" || user?.role === "ADMIN") && <CashPaymentRecorder />}
    {payments.isError && <ErrorState message={apiErrorMessage(payments.error)} retry={() => void payments.refetch()} />}
    <Card>{payments.isPending ? <CardBody className="space-y-3"><Skeleton className="h-14" /><Skeleton className="h-14" /></CardBody> :
      payments.data?.length ? <TableWrap><Table><thead><tr><Th>Payment date</Th><Th>Appointment date</Th><Th>{user?.role === "PATIENT" ? "Doctor" : user?.role === "DOCTOR" ? "Patient" : "Patient · Doctor"}</Th><Th>Amount</Th><Th>Method</Th><Th>Status</Th></tr></thead><tbody>
        {payments.data.map((payment) => <tr key={payment.id}><Td>{payment.paidAt ? formatDate(payment.paidAt) : "—"}</Td><Td>{formatDate(payment.invoice?.appointment?.appointmentDate)}</Td><Td>{payment.invoice?.appointment?.patient && payment.invoice?.appointment?.doctor ? `${payment.invoice.appointment.patient.firstName} ${payment.invoice.appointment.patient.lastName} · Dr. ${payment.invoice.appointment.doctor.firstName} ${payment.invoice.appointment.doctor.lastName}` : payment.invoice?.appointment?.doctor ? `Dr. ${payment.invoice.appointment.doctor.firstName} ${payment.invoice.appointment.doctor.lastName}` : payment.invoice?.appointment?.patient ? `${payment.invoice.appointment.patient.firstName} ${payment.invoice.appointment.patient.lastName}` : "—"}</Td><Td className="font-semibold">{formatMoney(payment.amount)}</Td><Td><Badge tone="info">{payment.method}</Badge></Td><Td><Badge tone={payment.status === "COMPLETED" ? "success" : "warning"}>{humanize(payment.status)}</Badge></Td></tr>)}
      </tbody></Table></TableWrap> : <EmptyState icon={<FileText className="size-5" />} title="No payments recorded" description={user?.role === "PATIENT" ? "Cash payments recorded at the clinic will appear here." : "Payment records will appear here when cash is recorded against an invoice."} />}</Card>
  </div>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-slate-500">{label}</span><span className="break-all text-sm font-semibold text-slate-800">{value}</span></div>;
}
