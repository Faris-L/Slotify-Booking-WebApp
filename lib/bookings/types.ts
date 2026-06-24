export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type BookingListItem = {
  id: string;
  status: BookingStatus;
  starts_at: string;
  ends_at: string;
  price: number;
  source: string;
  manage_token: string;
  buffer_minutes: number;
  employee_id: string;
  service_id: string;
  client_id: string;
  employee: { id: string; full_name: string };
  service: { id: string; name: string; duration_minutes: number };
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
};

export type DashboardStats = {
  todayCount: number;
  weekCount: number;
  clientCount: number;
  statusCounts: Record<BookingStatus, number>;
  todayByEmployee: Array<{ employeeId: string; name: string; count: number }>;
};

export type ClientListItem = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  booking_count: number;
};

export type ClientDetail = ClientListItem & {
  bookings: Array<{
    id: string;
    status: BookingStatus;
    starts_at: string;
    service_name: string;
    employee_name: string;
    price: number;
  }>;
};
