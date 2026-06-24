import { addDays, addHours, setHours, setMinutes, startOfDay } from "date-fns";

import type { BookingListItem, ClientListItem, DashboardStats } from "@/lib/bookings/types";

export const DEMO_BUSINESS = {
  name: "Studio Bella",
  slug: "studio-bella",
  description: "Hair, color & styling in downtown",
  brandColor: "#0ea5e9",
  currency: "USD",
  timezone: "America/New_York",
} as const;

export const DEMO_LANDING_BOOKING = {
  businessName: DEMO_BUSINESS.name,
  serviceName: "Haircut & Blow Dry",
  duration: "45 min",
  price: "$45",
  times: ["9:00 AM", "10:30 AM", "2:00 PM"],
  selectedTimeIndex: 1,
} as const;

export const DEMO_FEATURES = [
  {
    title: "Public booking page",
    description:
      "Every business gets its own page — clients book without creating an account.",
  },
  {
    title: "Smart calendar",
    description:
      "Day and week views, confirmations, reschedules, and cancellations in one place.",
  },
  {
    title: "Automatic availability",
    description:
      "Free slots calculated from business hours, breaks, time off, and existing bookings.",
  },
  {
    title: "Email reminders",
    description:
      "Confirmations, updates, and a 24-hour reminder — sent automatically.",
  },
  {
    title: "Team & services",
    description:
      "Services, staff, pricing, and schedules — everything you need before the first booking.",
  },
  {
    title: "Mobile-first",
    description:
      "Clients book from their phone in under a minute. You manage from any device.",
  },
] as const;

export const DEMO_INDUSTRIES = [
  "Hair salons",
  "Barbershops",
  "Beauty studios",
  "Spas & massage",
  "Private practices",
] as const;

export const DEMO_DASHBOARD_STATS: DashboardStats = {
  todayCount: 6,
  weekCount: 23,
  clientCount: 48,
  statusCounts: {
    pending: 2,
    confirmed: 15,
    cancelled: 1,
    completed: 4,
    no_show: 1,
  },
  todayByEmployee: [
    { employeeId: "demo-emp-1", name: "Emma Wilson", count: 3 },
    { employeeId: "demo-emp-2", name: "James Carter", count: 2 },
    { employeeId: "demo-emp-3", name: "Lisa Park", count: 1 },
  ],
};

function demoSlot(hour: number, minute: number, dayOffset = 0): string {
  const base = addDays(startOfDay(new Date()), dayOffset);
  return setMinutes(setHours(base, hour), minute).toISOString();
}

export const DEMO_TODAY_APPOINTMENTS: BookingListItem[] = [
  {
    id: "demo-b1",
    status: "confirmed",
    starts_at: demoSlot(9, 0),
    ends_at: demoSlot(9, 45),
    price: 45,
    source: "online",
    manage_token: "demo",
    buffer_minutes: 15,
    employee_id: "demo-emp-1",
    service_id: "demo-svc-1",
    client_id: "demo-client-1",
    employee: { id: "demo-emp-1", full_name: "Emma Wilson" },
    service: { id: "demo-svc-1", name: "Haircut & Blow Dry", duration_minutes: 45 },
    client: {
      id: "demo-client-1",
      full_name: "Sarah Mitchell",
      email: "sarah.m@email.com",
      phone: "+1 555-0101",
    },
  },
  {
    id: "demo-b2",
    status: "confirmed",
    starts_at: demoSlot(10, 30),
    ends_at: demoSlot(11, 15),
    price: 35,
    source: "online",
    manage_token: "demo",
    buffer_minutes: 10,
    employee_id: "demo-emp-2",
    service_id: "demo-svc-2",
    client_id: "demo-client-2",
    employee: { id: "demo-emp-2", full_name: "James Carter" },
    service: { id: "demo-svc-2", name: "Beard Trim", duration_minutes: 45 },
    client: {
      id: "demo-client-2",
      full_name: "Michael Brooks",
      email: "m.brooks@email.com",
      phone: "+1 555-0102",
    },
  },
  {
    id: "demo-b3",
    status: "pending",
    starts_at: demoSlot(13, 0),
    ends_at: demoSlot(14, 0),
    price: 85,
    source: "online",
    manage_token: "demo",
    buffer_minutes: 15,
    employee_id: "demo-emp-1",
    service_id: "demo-svc-3",
    client_id: "demo-client-3",
    employee: { id: "demo-emp-1", full_name: "Emma Wilson" },
    service: { id: "demo-svc-3", name: "Full Color", duration_minutes: 60 },
    client: {
      id: "demo-client-3",
      full_name: "Jessica Lane",
      email: "jessica.l@email.com",
      phone: null,
    },
  },
  {
    id: "demo-b4",
    status: "confirmed",
    starts_at: demoSlot(15, 30),
    ends_at: demoSlot(16, 15),
    price: 55,
    source: "manual",
    manage_token: "demo",
    buffer_minutes: 15,
    employee_id: "demo-emp-3",
    service_id: "demo-svc-4",
    client_id: "demo-client-4",
    employee: { id: "demo-emp-3", full_name: "Lisa Park" },
    service: { id: "demo-svc-4", name: "Balayage Touch-up", duration_minutes: 45 },
    client: {
      id: "demo-client-4",
      full_name: "Amanda Chen",
      email: "amanda.c@email.com",
      phone: "+1 555-0104",
    },
  },
];

export const DEMO_CLIENTS: ClientListItem[] = [
  {
    id: "demo-client-1",
    full_name: "Sarah Mitchell",
    email: "sarah.m@email.com",
    phone: "+1 555-0101",
    notes: "Prefers morning slots",
    created_at: addDays(new Date(), -30).toISOString(),
    booking_count: 8,
  },
  {
    id: "demo-client-2",
    full_name: "Michael Brooks",
    email: "m.brooks@email.com",
    phone: "+1 555-0102",
    notes: null,
    created_at: addDays(new Date(), -14).toISOString(),
    booking_count: 3,
  },
  {
    id: "demo-client-3",
    full_name: "Jessica Lane",
    email: "jessica.l@email.com",
    phone: null,
    notes: "Allergic to certain dyes — check notes before color",
    created_at: addDays(new Date(), -7).toISOString(),
    booking_count: 5,
  },
  {
    id: "demo-client-4",
    full_name: "Amanda Chen",
    email: "amanda.c@email.com",
    phone: "+1 555-0104",
    notes: null,
    created_at: addDays(new Date(), -3).toISOString(),
    booking_count: 2,
  },
];

export const DEMO_SERVICES = [
  {
    category: "Hair",
    items: [
      { name: "Haircut & Blow Dry", duration: "45 min", price: "$45" },
      { name: "Full Color", duration: "90 min", price: "$85" },
      { name: "Balayage", duration: "120 min", price: "$120" },
    ],
  },
  {
    category: "Grooming",
    items: [
      { name: "Beard Trim", duration: "30 min", price: "$35" },
      { name: "Hot Towel Shave", duration: "45 min", price: "$50" },
    ],
  },
] as const;

/** Upcoming week summary for demo calendar strip */
export const DEMO_WEEK_HIGHLIGHTS = [
  { day: "Mon", count: 4 },
  { day: "Tue", count: 6 },
  { day: "Wed", count: 5 },
  { day: "Thu", count: 7 },
  { day: "Fri", count: 8 },
  { day: "Sat", count: 3 },
  { day: "Sun", count: 0 },
] as const;

export function getDemoUpcomingSlot(): string {
  return addHours(new Date(), 2).toISOString();
}
