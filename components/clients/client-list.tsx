"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";

import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/booking/format";
import { updateClientNotes, type ActionState } from "@/lib/bookings/actions";
import type { ClientDetail, ClientListItem } from "@/lib/bookings/types";

const initialState: ActionState = {};

type ClientListProps = {
  clients: ClientListItem[];
  timezone: string;
  currency: string;
  selectedClient: ClientDetail | null;
};

export function ClientList({
  clients,
  timezone,
  currency,
  selectedClient,
}: ClientListProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    selectedClient?.id ?? null
  );
  const [notesState, notesAction, notesPending] = useActionState(
    updateClientNotes,
    initialState
  );

  const activeClient =
    selectedClient && selectedClient.id === selectedId ? selectedClient : null;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="border-sky-100 lg:col-span-2">
        <CardHeader>
          <CardTitle>Clients</CardTitle>
          <CardDescription>
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Clients appear here after their first booking.
            </p>
          ) : (
            clients.map((client) => (
              <Link
                key={client.id}
                href={`/clients?client=${client.id}`}
                onClick={() => setSelectedId(client.id)}
                className={`block rounded-lg border p-3 transition ${
                  selectedId === client.id
                    ? "border-sky-300 bg-sky-50/80"
                    : "border-sky-100 hover:border-sky-200"
                }`}
              >
                <p className="font-medium">{client.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {client.email ?? client.phone ?? "No contact"}
                  {" · "}
                  {client.booking_count} booking
                  {client.booking_count === 1 ? "" : "s"}
                </p>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-sky-100 lg:col-span-3">
        <CardHeader>
          <CardTitle>
            {activeClient ? activeClient.full_name : "Client details"}
          </CardTitle>
          <CardDescription>
            {activeClient
              ? "Contact info, notes, and booking history"
              : "Select a client to view details"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {activeClient ? (
            <>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p>{activeClient.email ?? "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{activeClient.phone ?? "—"}</p>
                </div>
              </div>

              <form action={notesAction} className="space-y-2">
                <input type="hidden" name="clientId" value={activeClient.id} />
                <Label htmlFor="client-notes">Notes</Label>
                <Textarea
                  id="client-notes"
                  name="notes"
                  rows={3}
                  defaultValue={activeClient.notes ?? ""}
                  placeholder="Preferences, allergies, VIP status…"
                />
                {notesState.error ? (
                  <p className="text-sm text-destructive">{notesState.error}</p>
                ) : null}
                {notesState.success ? (
                  <p className="text-sm text-emerald-700">{notesState.success}</p>
                ) : null}
                <Button type="submit" size="sm" disabled={notesPending}>
                  {notesPending ? "Saving…" : "Save notes"}
                </Button>
              </form>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Booking history</h3>
                {activeClient.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bookings yet</p>
                ) : (
                  activeClient.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border border-sky-100 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-muted-foreground">
                          {formatInTimeZone(
                            new Date(booking.starts_at),
                            timezone,
                            "MMM d, yyyy · h:mm a"
                          )}{" "}
                          · {booking.employee_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <BookingStatusBadge status={booking.status} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatPrice(booking.price, currency)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose a client from the list to see their history.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
