import { ClientList } from "@/components/clients/client-list";
import { getClientDetail, getClients } from "@/lib/bookings/queries";
import { requireOwnerContext } from "@/lib/business/context";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { supabase, business } = await requireOwnerContext();
  const { client: clientId } = await searchParams;

  const clients = await getClients(supabase, business.id);
  const selectedClient = clientId
    ? await getClientDetail(supabase, business.id, clientId)
    : clients[0]
      ? await getClientDetail(supabase, business.id, clients[0].id)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="mt-1 text-muted-foreground">
          Contact details, notes, and booking history.
        </p>
      </div>

      <ClientList
        clients={clients}
        timezone={business.timezone}
        currency={business.currency}
        selectedClient={selectedClient}
      />
    </div>
  );
}
