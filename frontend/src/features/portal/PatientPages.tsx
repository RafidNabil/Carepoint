import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, CalendarDays, Clock3, Search, Stethoscope, UserRound,
} from "lucide-react";
import { clinicApi, apiErrorMessage } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";
import { useNotice } from "@/components/shared/useNotice";
import { bookAppointmentSchema, profileSchema, doctorProfileSchema, type ProfileFields, type DoctorProfileFields } from "@/lib/schemas";
import { formatMoney, initials } from "@/lib/utils";
import { Badge, Button, Card, CardBody, EmptyState, ErrorState, Field, Input, PageHeader, Skeleton } from "@/components/ui";
import type { Doctor, Patient } from "@/types";

export function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const doctors = useQuery({
    queryKey: ["doctors", search, specialization],
    queryFn: () => clinicApi.doctors(search.trim() || undefined, specialization || undefined),
  });
  const specialties = useMemo(() => [...new Set((doctors.data ?? []).map((doctor) => doctor.specialization))].sort(), [doctors.data]);

  return <div>
    <PageHeader eyebrow="Care directory" title="Find your doctor" description="Explore active clinic providers and review their credentials and consultation fee." />
    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row">
      <label className="relative flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input aria-label="Search doctors" className="pl-10" placeholder="Search name or specialty" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <select aria-label="Filter by specialty" className="h-11 rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none focus:border-teal-600" value={specialization} onChange={(event) => setSpecialization(event.target.value)}>
        <option value="">All specialties</option>{specialties.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
    </div>
    {doctors.isError && <ErrorState message={apiErrorMessage(doctors.error)} retry={() => void doctors.refetch()} />}
    {doctors.isPending ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}</div> :
      doctors.data?.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{doctors.data.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div> :
        <Card><EmptyState icon={<Stethoscope className="size-5" />} title="No doctors found" description="Try a different search or clear your specialty filter." /></Card>}
  </div>;
}

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return <Card className="group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
    <CardBody className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-sky-50 text-lg font-bold text-teal-800">{initials(doctor.firstName, doctor.lastName)}</div>
        <Badge tone="success">Available profile</Badge>
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-950">Dr. {doctor.firstName} {doctor.lastName}</h2>
      <p className="mt-1 text-sm font-medium text-teal-800">{doctor.specialization}</p>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{doctor.qualification}{doctor.experience ? ` · ${doctor.experience} experience` : ""}</p>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Consultation fee</p><p className="mt-0.5 font-semibold text-slate-900">{formatMoney(doctor.consultationFee)}</p></div>
        <Link to={`/portal/doctors/${doctor.id}`}><Button variant="outline" size="sm">View profile<ArrowRight className="size-4" /></Button></Link>
      </div>
    </CardBody>
  </Card>;
}

export function DoctorDetailsPage() {
  const { id = "" } = useParams();
  const doctor = useQuery({ queryKey: ["doctors", id], queryFn: () => clinicApi.doctor(id), enabled: Boolean(id) });
  if (doctor.isPending) return <div className="space-y-5"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-72 rounded-2xl" /></div>;
  if (doctor.isError) return <ErrorState message={apiErrorMessage(doctor.error)} retry={() => void doctor.refetch()} />;
  const profile = doctor.data;
  return <div>
    <Link to="/portal/doctors" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-teal-800"><ArrowLeft className="size-4" />Back to doctors</Link>
    <Card><CardBody className="p-6 sm:p-9">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-teal-50 text-2xl font-bold text-teal-800">{initials(profile.firstName, profile.lastName)}</div>
        <div className="flex-1"><Badge tone="info">{profile.specialization}</Badge><h1 className="mt-3 text-2xl font-bold text-slate-950">Dr. {profile.firstName} {profile.lastName}</h1><p className="mt-1 text-slate-500">{profile.qualification}</p>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{profile.bio || "No biography has been added to this doctor’s profile."}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Info label="Experience" value={profile.experience || "Not provided"} />
            <Info label="Consultation fee" value={formatMoney(profile.consultationFee)} />
            <Info label="Contact" value={profile.phone || "Not provided"} />
          </div>
        </div>
        <Link to={`/portal/book/${profile.id}`}><Button>Book a visit<ArrowRight className="size-4" /></Button></Link>
      </div>
    </CardBody></Card>
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 px-4 py-3"><p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>;
}

export function BookAppointmentPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const queryClient = useQueryClient();
  const notify = useNotice();
  const navigate = useNavigate();
  const doctor = useQuery({ queryKey: ["doctors", id], queryFn: () => clinicApi.doctor(id), enabled: Boolean(id) });
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: { doctorId: id, appointmentDate: params.get("date") ?? "" },
  });
  const date = useWatch({ control, name: "appointmentDate" });
  const schedules = useQuery({
    queryKey: ["availability", id],
    queryFn: () => clinicApi.availableSchedules(id),
    enabled: Boolean(id),
  });
  const weeklySchedules = useMemo(
    () => [...(schedules.data?.schedules ?? [])].sort((left, right) =>
      left.dayOfWeek - right.dayOfWeek || left.startTime.localeCompare(right.startTime)),
    [schedules.data?.schedules],
  );
  const selectedWeekday = date
    ? new Date(`${date}T00:00:00.000Z`).getUTCDay()
    : undefined;
  const selectedDateAvailable = selectedWeekday === undefined
    ? undefined
    : weeklySchedules.some((schedule) => schedule.dayOfWeek === selectedWeekday);
  const booking = useMutation({
    mutationFn: (appointmentDate: string) => clinicApi.bookAppointment(id, appointmentDate),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["invoices"] });
      notify("Your appointment has been booked.");
      navigate("/portal/appointments");
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dhaka" });

  async function submit(values: { doctorId: string; appointmentDate: string }) {
    await booking.mutateAsync(values.appointmentDate);
  }

  if (doctor.isPending) return <Skeleton className="h-80 rounded-2xl" />;
  if (doctor.isError) return <ErrorState message={apiErrorMessage(doctor.error)} retry={() => void doctor.refetch()} />;
  return <div>
    <PageHeader eyebrow="Appointment booking" title="Choose a date" description="Review this doctor's weekly availability, then choose an available date." />
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <Card><CardBody>
        <div className="flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"><Stethoscope className="size-6" /></div><div><Badge tone="info">{doctor.data.specialization}</Badge><h2 className="mt-1 font-bold text-slate-950">Dr. {doctor.data.firstName} {doctor.data.lastName}</h2></div></div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"><span className="text-sm text-slate-500">Consultation fee</span><span className="font-semibold text-slate-900">{formatMoney(doctor.data.consultationFee)}</span></div>
        <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
          <input type="hidden" {...register("doctorId")} />
          <Field label="Appointment date" error={errors.appointmentDate?.message}><Input type="date" min={today} {...register("appointmentDate")} /></Field>
          <Button type="submit" className="w-full" disabled={isSubmitting || booking.isPending || !date || selectedDateAvailable === false}>{booking.isPending ? "Booking…" : "Confirm appointment"}<ArrowRight className="size-4" /></Button>
        </form>
        {selectedDateAvailable !== undefined && <p className={`mt-3 text-xs leading-5 ${selectedDateAvailable ? "text-teal-700" : "text-rose-600"}`}>
          {selectedDateAvailable ? "The doctor is available on this weekday." : "The doctor is not available on this weekday. Choose another date."}
        </p>}
        <p className="mt-2 text-xs leading-5 text-slate-400">Booking confirms a date. Clinic visit times are coordinated separately with the clinic.</p>
      </CardBody></Card>
      <Card><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold text-slate-900">Weekly availability</h2><p className="mt-1 text-sm text-slate-500">Available days and clinic hours</p></div>
        {schedules.isPending ? <CardBody className="space-y-3"><Skeleton className="h-16" /><Skeleton className="h-16" /></CardBody> :
          schedules.isError ? <CardBody><ErrorState message={apiErrorMessage(schedules.error)} retry={() => void schedules.refetch()} /></CardBody> :
          weeklySchedules.length ? <div className="divide-y divide-slate-100">{weeklySchedules.map((schedule, index) => <div key={`${schedule.dayOfWeek}-${schedule.startTime}-${index}`} className="flex items-center gap-3 px-5 py-4"><span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Clock3 className="size-5" /></span><div className="flex-1"><p className="text-sm font-semibold text-slate-800">{weekdays[schedule.dayOfWeek]}</p><p className="text-xs text-slate-500">Clinic hours</p></div><Badge tone="success">{clock(schedule.startTime)} – {clock(schedule.endTime)}</Badge></div>)}</div> :
            <EmptyState icon={<CalendarDays className="size-5" />} title="No schedule found" description="The doctor has no weekly availability registered." />}
      </Card>
    </div>
  </div>;
}

function clock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Dhaka" }).format(date);
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const notify = useNotice();
  const isDoctor = user?.role === "DOCTOR";
  const patientProfile = useQuery({
    queryKey: ["profile", "patient"],
    queryFn: clinicApi.myPatientProfile,
    enabled: user?.role === "PATIENT",
    initialData: user?.patient ?? undefined,
  });
  const doctorProfile = useQuery({
    queryKey: ["profile", "doctor"],
    queryFn: clinicApi.myDoctorProfile,
    enabled: isDoctor,
    initialData: user?.doctor ?? undefined,
  });
  const current = (isDoctor ? doctorProfile.data : patientProfile.data) as (Doctor & { dateOfBirth?: string | null; gender?: string | null }) | undefined;
  const patientForm = useForm<ProfileFields>({ resolver: zodResolver(profileSchema), values: { firstName: current?.firstName ?? "", lastName: current?.lastName ?? "", phone: current?.phone ?? "", dateOfBirth: current?.dateOfBirth?.slice(0, 10) ?? "", gender: current?.gender ?? "" } });
  const doctorForm = useForm<DoctorProfileFields>({ resolver: zodResolver(doctorProfileSchema), values: { firstName: current?.firstName ?? "", lastName: current?.lastName ?? "", phone: current?.phone ?? "", specialization: current?.specialization ?? "", qualification: current?.qualification ?? "", experience: current?.experience ?? "", bio: current?.bio ?? "", consultationFee: Number(current?.consultationFee ?? 0) } });

  const save = useMutation<Doctor | Patient, Error, Record<string, unknown>>({
    mutationFn: (body: Record<string, unknown>) => isDoctor
      ? clinicApi.updateDoctorProfile(body)
      : clinicApi.updatePatientProfile(body),
    onSuccess: async (updated) => {
      if (isDoctor) queryClient.setQueryData(["profile", "doctor"], updated);
      else queryClient.setQueryData(["profile", "patient"], updated);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      notify("Your profile has been updated.");
    },
    onError: (error) => notify(apiErrorMessage(error), "error"),
  });

  if (user?.role === "ADMIN") return <Card><EmptyState icon={<UserRound className="size-5" />} title="No administrator profile endpoint" description="The current backend has no admin profile read or update endpoint." /></Card>;
  if ((isDoctor ? doctorProfile : patientProfile).isPending && !current) return <Skeleton className="h-96 rounded-2xl" />;
  if ((isDoctor ? doctorProfile : patientProfile).isError) return <ErrorState message={apiErrorMessage((isDoctor ? doctorProfile : patientProfile).error)} retry={() => void (isDoctor ? doctorProfile : patientProfile).refetch()} />;

  return <div>
    <PageHeader eyebrow="Account settings" title="My profile" description="Keep your clinic profile details current. Email changes are not available through this backend." />
    {isDoctor ? <Card><CardBody><form onSubmit={doctorForm.handleSubmit((values) => {
      const { consultationFee, ...rest } = values;
      const body = { ...rest, consultationFee: Number(consultationFee) };
      void save.mutateAsync(body);
    })} className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" error={doctorForm.formState.errors.firstName?.message}><Input {...doctorForm.register("firstName")} /></Field>
      <Field label="Last name" error={doctorForm.formState.errors.lastName?.message}><Input {...doctorForm.register("lastName")} /></Field>
      <Field label="Phone" error={doctorForm.formState.errors.phone?.message}><Input type="tel" {...doctorForm.register("phone")} /></Field>
      <Field label="Specialization" error={doctorForm.formState.errors.specialization?.message}><Input {...doctorForm.register("specialization")} /></Field>
      <Field label="Qualification"><Input {...doctorForm.register("qualification")} /></Field>
      <Field label="Experience"><Input {...doctorForm.register("experience")} /></Field>
      <Field label="Consultation fee" error={doctorForm.formState.errors.consultationFee?.message}><Input type="number" min="0" step="0.01" {...doctorForm.register("consultationFee", { valueAsNumber: true })} /></Field>
      <Field label="Biography" className="sm:col-span-2"><textarea className="min-h-28 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal-600" {...doctorForm.register("bio")} /></Field>
      <div className="sm:col-span-2"><Button disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button></div>
    </form></CardBody></Card> : <Card><CardBody><form onSubmit={patientForm.handleSubmit((values) => {
      const body: Record<string, unknown> = { firstName: values.firstName, lastName: values.lastName, phone: values.phone };
      if (values.dateOfBirth) body.dateOfBirth = values.dateOfBirth;
      if (values.gender !== undefined) body.gender = values.gender;
      void save.mutateAsync(body);
    })} className="grid gap-4 sm:grid-cols-2">
      <Field label="First name" error={patientForm.formState.errors.firstName?.message}><Input autoComplete="given-name" {...patientForm.register("firstName")} /></Field>
      <Field label="Last name" error={patientForm.formState.errors.lastName?.message}><Input autoComplete="family-name" {...patientForm.register("lastName")} /></Field>
      <Field label="Phone number" error={patientForm.formState.errors.phone?.message}><Input type="tel" {...patientForm.register("phone")} /></Field>
      <Field label="Date of birth"><Input type="date" {...patientForm.register("dateOfBirth")} /></Field>
      <Field label="Gender"><Input maxLength={50} {...patientForm.register("gender")} /></Field>
      <div className="sm:col-span-2"><Button disabled={save.isPending}>{save.isPending ? "Saving…" : "Save profile"}</Button></div>
    </form></CardBody></Card>}
  </div>;
}
