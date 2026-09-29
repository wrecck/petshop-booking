import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  PawPrint,
  Scissors,
  Users,
} from "lucide-react";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  addService,
  saveBusinessHours,
  toggleService,
  updateAppointmentStatus,
} from "@/app/dashboard/actions";

type AppointmentRow = {
  id: string;
  starts_at: string;
  status: string;
  services: { name: string } | null;
  staff: { name: string } | null;
  customers: { name: string; email: string; phone: string | null } | null;
  pets: { name: string; breed: string | null } | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  active: boolean;
};

type HoursRow = {
  day_of_week: number;
  opens_at: string;
  closes_at: string;
  closed: boolean;
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export default async function DashboardPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="dashboard-empty">
        <PawPrint size={32} />
        <h1>Connect Supabase to open the owner dashboard.</h1>
        <p>
          Add the two Supabase environment variables described in the README,
          then restart the app.
        </p>
        <Link className="primary-button" href="/">
          Return to demo
        </Link>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: shop } = await supabase
    .from("shops")
    .select("id,name,slug,timezone,currency")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!shop) redirect("/auth/provision");

  const today = new Date().toISOString();
  const [
    { data: appointments },
    { count: customerCount },
    { data: services },
    { data: hours },
  ] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id,starts_at,status,services(name),staff(name),customers(name,email,phone),pets(name,breed)",
        )
        .eq("shop_id", shop.id)
        .gte("starts_at", today)
        .order("starts_at")
        .limit(12),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("shop_id", shop.id),
      supabase
        .from("services")
        .select("id,name,description,duration_minutes,price_cents,active")
        .eq("shop_id", shop.id)
        .order("sort_order"),
      supabase
        .from("business_hours")
        .select("day_of_week,opens_at,closes_at,closed")
        .eq("shop_id", shop.id)
        .order("day_of_week"),
    ]);

  const rows = (appointments ?? []) as unknown as AppointmentRow[];
  const serviceRows = (services ?? []) as ServiceRow[];
  const hoursRows = (hours ?? []) as HoursRow[];
  const upcomingCount = rows.filter((appointment) =>
    ["pending", "confirmed"].includes(appointment.status),
  ).length;

  return (
    <div className="dashboard-shell">
        <section className="dashboard-welcome">
          <div>
            <p className="eyebrow">Owner dashboard</p>
            <h1>{shop.name}</h1>
            <p>Here’s what’s happening at your shop.</p>
          </div>
          <Link className="primary-button" href={`/${shop.slug}`}>
            Open booking page <ExternalLink size={16} />
          </Link>
        </section>

        <section className="metric-grid">
          <article>
            <span><CalendarDays /></span>
            <div>
              <small>Upcoming</small>
              <strong>{upcomingCount}</strong>
            </div>
          </article>
          <article>
            <span><Users /></span>
            <div>
              <small>Customers</small>
              <strong>{customerCount ?? 0}</strong>
            </div>
          </article>
          <article>
            <span><Scissors /></span>
            <div>
              <small>Active services</small>
              <strong>
                {serviceRows.filter((service) => service.active).length}
              </strong>
            </div>
          </article>
        </section>

        <section className="appointments-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Schedule</p>
              <h2>Appointment requests</h2>
            </div>
            <span>{shop.timezone.replace("_", " ")}</span>
          </div>

          {rows.length === 0 ? (
            <div className="empty-schedule">
              <CalendarDays size={30} />
              <h3>Your schedule is clear.</h3>
              <p>Share your booking page to receive your first appointment.</p>
              <code>{`/${shop.slug}/`}</code>
            </div>
          ) : (
            <div className="appointment-list">
              {rows.map((appointment) => {
                const startsAt = new Date(appointment.starts_at);
                return (
                  <article key={appointment.id}>
                    <div className="appointment-date">
                      <strong>
                        {new Intl.DateTimeFormat("en-US", {
                          month: "short",
                          day: "numeric",
                          timeZone: shop.timezone,
                        }).format(startsAt)}
                      </strong>
                      <span>
                        <Clock3 size={13} />
                        {new Intl.DateTimeFormat("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: shop.timezone,
                        }).format(startsAt)}
                      </span>
                    </div>
                    <div>
                      <strong>{appointment.pets?.name ?? "Pet"}</strong>
                      <span>
                        {appointment.services?.name} · {appointment.staff?.name}
                      </span>
                    </div>
                    <div className="customer-cell">
                      <strong>{appointment.customers?.name}</strong>
                      <span>{appointment.customers?.email}</span>
                      <span>{appointment.customers?.phone}</span>
                    </div>
                    <span className={`status-pill ${appointment.status}`}>
                      {appointment.status.replace("_", " ")}
                    </span>
                    {["pending", "confirmed"].includes(appointment.status) && (
                      <form action={updateAppointmentStatus}>
                        <input
                          type="hidden"
                          name="appointmentId"
                          value={appointment.id}
                        />
                        <button
                          name="status"
                          value={
                            appointment.status === "pending"
                              ? "confirmed"
                              : "completed"
                          }
                          title={
                            appointment.status === "pending"
                              ? "Confirm appointment"
                              : "Mark completed"
                          }
                        >
                          <CheckCircle2 size={18} />
                          {appointment.status === "pending"
                            ? "Confirm"
                            : "Complete"}
                        </button>
                        <button
                          name="status"
                          value="cancelled"
                          title="Cancel appointment"
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="settings-grid">
          <section className="settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Offerings</p>
                <h2>Services</h2>
              </div>
            </div>
            <div className="service-admin-list">
              {serviceRows.map((service) => (
                <article key={service.id}>
                  <div>
                    <strong>{service.name}</strong>
                    <span>
                      {service.duration_minutes} min ·{" "}
                      {formatMoney(service.price_cents, shop.currency)}
                    </span>
                  </div>
                  <form action={toggleService}>
                    <input type="hidden" name="serviceId" value={service.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={service.active ? "false" : "true"}
                    />
                    <button>{service.active ? "Disable" : "Enable"}</button>
                  </form>
                </article>
              ))}
            </div>
            <form className="add-service-form" action={addService}>
              <input type="hidden" name="shopId" value={shop.id} />
              <input required name="name" placeholder="Service name" />
              <input
                required
                name="description"
                placeholder="Short description"
              />
              <label>
                Minutes
                <input
                  required
                  name="duration"
                  type="number"
                  min="15"
                  step="15"
                  defaultValue="60"
                />
              </label>
              <label>
                Price ({shop.currency})
                <input
                  required
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="50"
                />
              </label>
              <button className="primary-button">Add service</button>
            </form>
          </section>

          <section className="settings-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Availability</p>
                <h2>Business hours</h2>
              </div>
            </div>
            <form className="hours-form" action={saveBusinessHours}>
              <input type="hidden" name="shopId" value={shop.id} />
              {dayNames.map((day, index) => {
                const row = hoursRows.find(
                  (hoursRow) => hoursRow.day_of_week === index,
                );
                return (
                  <div key={day}>
                    <strong>{day.slice(0, 3)}</strong>
                    <input
                      aria-label={`${day} opening time`}
                      type="time"
                      name={`opens-${index}`}
                      defaultValue={row?.opens_at.slice(0, 5) ?? "09:00"}
                    />
                    <span>to</span>
                    <input
                      aria-label={`${day} closing time`}
                      type="time"
                      name={`closes-${index}`}
                      defaultValue={row?.closes_at.slice(0, 5) ?? "17:00"}
                    />
                    <label>
                      <input
                        type="checkbox"
                        name={`closed-${index}`}
                        defaultChecked={row?.closed ?? index === 0}
                      />
                      Closed
                    </label>
                  </div>
                );
              })}
              <button className="primary-button">Save hours</button>
            </form>
          </section>
        </div>
    </div>
  );
}
