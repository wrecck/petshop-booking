"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { demoShopfront, DEMO_SHOP_SLUG } from "@/lib/demo-data";
import type { AvailabilitySlot, Shopfront, Staff } from "@/lib/types";

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});
const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sameDay(left: Date, right: Date) {
  return dateKey(left) === dateKey(right);
}

function getCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function getTimeZoneName(timeZone: string) {
  try {
    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        timeZoneName: "long",
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
}

type BookingPageProps = {
  shopSlug?: string;
};

type UiGroomer = Staff & { rating?: string };

export default function BookingPage(props: BookingPageProps) {
  const shopSlug = props.shopSlug ?? DEMO_SHOP_SLUG;
  const demoMode = !props.shopSlug;
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const firstAvailable = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() + (today.getDay() === 6 ? 2 : 1));
    return date;
  }, [today]);

  const [shopfront, setShopfront] = useState<Shopfront>(demoShopfront);
  const [serviceId, setServiceId] = useState(demoShopfront.services[0].id);
  const [groomerId, setGroomerId] = useState("any");
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(firstAvailable.getFullYear(), firstAvailable.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(firstAvailable);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [petName, setPetName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const services = shopfront.services;
  const groomers: UiGroomer[] = [
    {
      id: "any",
      shop_id: shopfront.shop.id,
      name: "Any available groomer",
      role: "Best for the earliest appointment",
      initials: "✦",
      color: "sage",
    },
    ...shopfront.staff,
  ];
  const selectedService =
    services.find((service) => service.id === serviceId) ?? services[0];
  const selectedGroomer =
    groomers.find((groomer) => groomer.id === groomerId) ?? groomers[0];
  const calendarDays = getCalendarDays(visibleMonth);
  const selectedTime = selectedSlot?.display_time ?? "";

  useEffect(() => {
    if (demoMode) return;
    let active = true;
    fetch(`/api/shops/${shopSlug}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("Shop not found.");
        return (await response.json()) as Shopfront;
      })
      .then((data) => {
        if (!active || data.services.length === 0) return;
        setShopfront(data);
        setServiceId(data.services[0].id);
        setSelectedSlot(null);
        setSlotsLoading(true);
      })
      .catch(() => {
        if (shopSlug !== DEMO_SHOP_SLUG) setBookingError("Shop not found.");
      });
    return () => {
      active = false;
    };
  }, [demoMode, shopSlug]);

  useEffect(() => {
    if (!serviceId) return;
    const controller = new AbortController();
    const date = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const query = new URLSearchParams({
      shop: shopSlug,
      service: serviceId,
      date,
    });
    if (demoMode) query.set("demo", "true");
    if (groomerId !== "any") query.set("staff", groomerId);

    fetch(`/api/availability?${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Availability unavailable.");
        return (await response.json()) as { slots: AvailabilitySlot[] };
      })
      .then(({ slots: availableSlots }) => setSlots(availableSlots))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setSlots([]);
      })
      .finally(() => setSlotsLoading(false));

    return () => controller.abort();
  }, [demoMode, groomerId, selectedDate, serviceId, shopSlug]);

  function isUnavailable(date: Date) {
    return (
      date < today ||
      date.getDay() === 0 ||
      date.getMonth() !== visibleMonth.getMonth()
    );
  }

  function selectDate(date: Date) {
    if (isUnavailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
  }

  function selectService(id: string) {
    setServiceId(id);
    setSelectedSlot(null);
    setSlotsLoading(true);
  }

  function selectGroomer(id: string) {
    setGroomerId(id);
    setSelectedSlot(null);
    setSlotsLoading(true);
  }

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;
    setSubmitting(true);
    setBookingError("");

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug,
          serviceId,
          staffId: selectedSlot.staff_id,
          startsAt: selectedSlot.starts_at,
          customerName,
          customerEmail: email,
          customerPhone: phone,
          petName,
          petType: "Dog",
          demo: demoMode,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Booking failed.");
      setConfirmed(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "Unable to book this time.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card">
          <div className="success-mark">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <p className="eyebrow">Request received</p>
          <h1>We got your appointment request.</h1>
          <p className="confirmation-copy">
            Thanks for requesting a visit for <strong>{petName}</strong>.{" "}
            {shopfront.shop.name} will get back to you shortly to confirm your
            appointment.
          </p>
          <div className="confirmation-details">
            <div>
              <CalendarDays size={19} />
              <span>
                {longDateFormatter.format(selectedDate)} at {selectedTime}
              </span>
            </div>
            <div>
              <Sparkles size={19} />
              <span>{selectedService.name}</span>
            </div>
            <div>
              <UserRound size={19} />
              <span>
                {selectedGroomer.id === "any"
                  ? `With ${selectedSlot?.staff_name ?? "our team"}`
                  : `With ${selectedGroomer.name}`}
              </span>
            </div>
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setConfirmed(false);
              setShowDetails(false);
            }}
          >
            Request another visit
          </button>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Paws and Company home">
          <span className="brand-mark">
            <PawPrint size={20} fill="currentColor" />
          </span>
          <span>{shopfront.shop.name}</span>
        </a>
        <div className="header-meta">
          <div>
            <strong>{shopfront.shop.address ?? "Online booking"}</strong>
            <span>
              <MapPin size={13} />{" "}
              {[shopfront.shop.city, shopfront.shop.state]
                .filter(Boolean)
                .join(", ") || "Book your visit"}
            </span>
          </div>
          <Link className="owner-link" href="/login">
            Owner login
          </Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Online booking</p>
          <h1>Let’s get your best friend looking their best.</h1>
          <p>Pick a service and a time that works for you. We’ll handle the rest.</p>
        </div>
        <div className="trust-note">
          <span className="mini-avatars">
            <i>MR</i>
            <i>SL</i>
            <i>AP</i>
          </span>
          <span>
            <strong>Loved by local pets</strong>
            <small>
              <Star size={12} fill="currentColor" /> 4.9 from 200+ visits
            </small>
          </span>
        </div>
      </section>

      <div className="booking-layout">
        <div className="booking-content">
          <section className="booking-section">
            <div className="section-heading">
              <span>1</span>
              <div>
                <h2>Choose a service</h2>
                <p>Prices may vary slightly by coat and breed.</p>
              </div>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <button
                  className={`service-card ${service.id === serviceId ? "selected" : ""}`}
                  key={service.id}
                  onClick={() => selectService(service.id)}
                >
                  <span className="radio">
                    {service.id === serviceId && <span />}
                  </span>
                  <span className="service-info">
                    <strong>{service.name}</strong>
                    <small>{service.description}</small>
                    <span className="duration">
                      <Clock3 size={14} /> {service.duration_minutes} min
                    </span>
                  </span>
                  <span className="price">
                    ${(service.price_cents / 100).toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="booking-section">
            <div className="section-heading">
              <span>2</span>
              <div>
                <h2>Pick your groomer</h2>
                <p>Choose a favorite, or let us find the earliest opening.</p>
              </div>
            </div>
            <div className="groomer-row">
              {groomers.map((groomer) => (
                <button
                  className={`groomer-card ${groomer.id === groomerId ? "selected" : ""}`}
                  key={groomer.id}
                  onClick={() => selectGroomer(groomer.id)}
                >
                  <span className={`avatar ${groomer.color}`}>
                    {groomer.initials}
                  </span>
                  <span>
                    <strong>{groomer.name}</strong>
                    <small>{groomer.role}</small>
                    {groomer.rating && (
                      <em>
                        <Star size={11} fill="currentColor" /> {groomer.rating}
                      </em>
                    )}
                  </span>
                  {groomer.id === groomerId && (
                    <span className="card-check">
                      <Check size={13} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          <section className="booking-section schedule-section">
            <div className="section-heading">
              <span>3</span>
              <div>
                <h2>Find a time</h2>
                <p>
                  All times are shown in{" "}
                  {getTimeZoneName(shopfront.shop.timezone)}.
                </p>
              </div>
            </div>
            <div className="scheduler">
              <div className="calendar">
                <div className="calendar-header">
                  <button
                    aria-label="Previous month"
                    onClick={() =>
                      setVisibleMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                  >
                    <ChevronLeft />
                  </button>
                  <strong>{monthFormatter.format(visibleMonth)}</strong>
                  <button
                    aria-label="Next month"
                    onClick={() =>
                      setVisibleMonth(
                        new Date(
                          visibleMonth.getFullYear(),
                          visibleMonth.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                  >
                    <ChevronRight />
                  </button>
                </div>
                <div className="weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    ),
                  )}
                </div>
                <div className="calendar-grid">
                  {calendarDays.map((date) => {
                    const unavailable = isUnavailable(date);
                    return (
                      <button
                        key={date.toISOString()}
                        className={[
                          sameDay(date, selectedDate) ? "selected" : "",
                          sameDay(date, today) ? "today" : "",
                          unavailable ? "unavailable" : "",
                        ].join(" ")}
                        disabled={unavailable}
                        onClick={() => selectDate(date)}
                        aria-label={longDateFormatter.format(date)}
                        aria-pressed={sameDay(date, selectedDate)}
                      >
                        {date.getDate()}
                        {!unavailable && <i />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="times">
                <p>
                  <strong>{longDateFormatter.format(selectedDate)}</strong>
                  <span>
                    {slotsLoading
                      ? "Checking availability…"
                      : `${slots.length} ${slots.length === 1 ? "time" : "times"} available`}
                  </span>
                </p>
                <div className="time-grid">
                  {!slotsLoading && slots.length === 0 && (
                    <p className="no-times">No openings on this date.</p>
                  )}
                  {slots.map((slot) => (
                    <button
                      className={
                        selectedSlot?.starts_at === slot.starts_at &&
                        selectedSlot?.staff_id === slot.staff_id
                          ? "selected"
                          : ""
                      }
                      key={`${slot.starts_at}-${slot.staff_id}`}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {slot.display_time}
                      {selectedSlot?.starts_at === slot.starts_at &&
                        selectedSlot?.staff_id === slot.staff_id && (
                          <Check size={15} />
                        )}
                    </button>
                  ))}
                </div>
                <div className="timezone">
                  <ShieldCheck size={16} />
                  This time is requested now and confirmed by the shop shortly.
                </div>
              </div>
            </div>
          </section>

          {showDetails && (
            <section className="booking-section details-section">
              <div className="section-heading">
                <span>4</span>
                <div>
                  <h2>Tell us about your pet</h2>
                  <p>We’ll use this to prepare for your visit.</p>
                </div>
              </div>
              <form id="booking-form" onSubmit={submitBooking}>
                <label>
                  Your name
                  <input
                    required
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Jamie Rivera"
                  />
                </label>
                <label>
                  Pet’s name
                  <input
                    required
                    value={petName}
                    onChange={(event) => setPetName(event.target.value)}
                    placeholder="Mochi"
                  />
                </label>
                <label className="wide">
                  Email address
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="jamie@example.com"
                  />
                </label>
                <label className="wide">
                  Phone number
                  <input
                    required
                    type="tel"
                    minLength={7}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="(503) 555-0142"
                    autoComplete="tel"
                  />
                </label>
              </form>
            </section>
          )}
        </div>

        <aside className="booking-summary">
          <p className="eyebrow">Your visit</p>
          <h2>Booking summary</h2>
          <div className="summary-item">
            <span className="summary-icon">
              <Sparkles size={18} />
            </span>
            <span>
              <small>Service</small>
              <strong>{selectedService.name}</strong>
              <em>{selectedService.duration_minutes} minutes</em>
            </span>
            <strong>${(selectedService.price_cents / 100).toFixed(0)}</strong>
          </div>
          <div className="summary-item">
            <span className="summary-icon">
              <UserRound size={18} />
            </span>
            <span>
              <small>Groomer</small>
              <strong>{selectedGroomer.name}</strong>
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-icon">
              <CalendarDays size={18} />
            </span>
            <span>
              <small>Date & time</small>
              <strong>{longDateFormatter.format(selectedDate)}</strong>
              <em>{selectedTime || "Choose a time"}</em>
            </span>
          </div>
          <div className="summary-total">
            <span>
              <strong>Total</strong>
              <small>Pay at the salon</small>
            </span>
            <strong>${(selectedService.price_cents / 100).toFixed(0)}</strong>
          </div>
          {bookingError && <p className="booking-error">{bookingError}</p>}
          {showDetails ? (
            <>
              <button
                className="primary-button"
                form="booking-form"
                type="submit"
                disabled={!selectedSlot || submitting}
              >
                {submitting ? "Sending request…" : "Request appointment"}
                {!submitting && <ChevronRight size={17} />}
              </button>
              <button
                className="back-button"
                onClick={() => setShowDetails(false)}
              >
                <ArrowLeft size={15} /> Back to time
              </button>
            </>
          ) : (
            <button
              className="primary-button"
              disabled={!selectedSlot}
              onClick={() => {
                setShowDetails(true);
                setTimeout(
                  () =>
                    document
                      .querySelector(".details-section")
                      ?.scrollIntoView({ behavior: "smooth" }),
                  50,
                );
              }}
            >
              Continue <ChevronRight size={17} />
            </button>
          )}
          <p className="fine-print">
            Free cancellation up to 24 hours before your visit.
          </p>
        </aside>
      </div>

      <footer>
        <span>
          <PawPrint size={16} /> Paws & Co.
        </span>
        <p>
          Questions? Call us at {shopfront.shop.phone ?? "your local shop"}
        </p>
      </footer>
    </main>
  );
}
