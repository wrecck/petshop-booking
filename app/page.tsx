"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  PawPrint,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

type Groomer = {
  id: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  rating?: string;
};

const services: Service[] = [
  {
    id: "full-groom",
    name: "The Full Groom",
    description: "Bath, haircut, nail trim & finishing spritz",
    duration: 90,
    price: 85,
  },
  {
    id: "bath-brush",
    name: "Bath & Brush",
    description: "Deep-cleansing bath, blow-dry & brush out",
    duration: 60,
    price: 55,
  },
  {
    id: "puppy",
    name: "Puppy’s First Visit",
    description: "A gentle introduction for pups under 6 months",
    duration: 45,
    price: 45,
  },
];

const groomers: Groomer[] = [
  {
    id: "any",
    name: "Any available groomer",
    role: "Best for the earliest appointment",
    initials: "✦",
    color: "sage",
  },
  {
    id: "mia",
    name: "Mia",
    role: "Senior groomer",
    initials: "MR",
    color: "peach",
    rating: "4.9",
  },
  {
    id: "sam",
    name: "Sam",
    role: "Groomer & puppy specialist",
    initials: "SL",
    color: "blue",
    rating: "5.0",
  },
];

const timeSlots = [
  "9:00 AM",
  "10:30 AM",
  "12:00 PM",
  "1:30 PM",
  "3:00 PM",
  "4:30 PM",
];

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

export default function BookingPage() {
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

  const [serviceId, setServiceId] = useState("full-groom");
  const [groomerId, setGroomerId] = useState("any");
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(firstAvailable.getFullYear(), firstAvailable.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(firstAvailable);
  const [selectedTime, setSelectedTime] = useState("10:30 AM");
  const [showDetails, setShowDetails] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [petName, setPetName] = useState("");
  const [email, setEmail] = useState("");

  const selectedService =
    services.find((service) => service.id === serviceId) ?? services[0];
  const selectedGroomer =
    groomers.find((groomer) => groomer.id === groomerId) ?? groomers[0];
  const calendarDays = getCalendarDays(visibleMonth);

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
    setSelectedTime("");
  }

  function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setConfirmed(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (confirmed) {
    return (
      <main className="confirmation-page">
        <div className="confirmation-card">
          <div className="success-mark">
            <Check size={34} strokeWidth={2.5} />
          </div>
          <p className="eyebrow">You’re all set</p>
          <h1>A fresh look is on the way.</h1>
          <p className="confirmation-copy">
            We sent the appointment details to <strong>{email}</strong>.
            We can’t wait to meet {petName}!
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
                  ? "First available groomer"
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
            Book another visit
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
          <span>
            Paws <i>&</i> Co.
          </span>
        </a>
        <div className="header-meta">
          <div>
            <strong>Maple Street</strong>
            <span>
              <MapPin size={13} /> Portland, OR
            </span>
          </div>
          <button aria-label="Save this pet shop">
            <Heart size={20} />
          </button>
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
                  onClick={() => setServiceId(service.id)}
                >
                  <span className="radio">
                    {service.id === serviceId && <span />}
                  </span>
                  <span className="service-info">
                    <strong>{service.name}</strong>
                    <small>{service.description}</small>
                    <span className="duration">
                      <Clock3 size={14} /> {service.duration} min
                    </span>
                  </span>
                  <span className="price">${service.price}</span>
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
                  onClick={() => setGroomerId(groomer.id)}
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
                <p>All times are shown in Pacific Time.</p>
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
                  <span>{timeSlots.length} times available</span>
                </p>
                <div className="time-grid">
                  {timeSlots.map((time, index) => {
                    const hidden = (selectedDate.getDate() + index) % 7 === 0;
                    if (hidden) return null;
                    return (
                      <button
                        className={selectedTime === time ? "selected" : ""}
                        key={time}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                        {selectedTime === time && <Check size={15} />}
                      </button>
                    );
                  })}
                </div>
                <div className="timezone">
                  <ShieldCheck size={16} />
                  Your time is held for 10 minutes at checkout.
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
              <em>{selectedService.duration} minutes</em>
            </span>
            <strong>${selectedService.price}</strong>
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
            <strong>${selectedService.price}</strong>
          </div>
          {showDetails ? (
            <>
              <button
                className="primary-button"
                form="booking-form"
                type="submit"
                disabled={!selectedTime}
              >
                Confirm booking <ChevronRight size={17} />
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
              disabled={!selectedTime}
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
        <p>Questions? Call us at (503) 555-0142</p>
      </footer>
    </main>
  );
}
