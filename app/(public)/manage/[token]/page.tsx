import { notFound } from "next/navigation";

import { ManageBookingPanel } from "@/components/manage/manage-booking-panel";
import { getBookingByManageToken } from "@/lib/manage/queries";

export default async function ManageBookingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const booking = await getBookingByManageToken(token);

  if (!booking) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <ManageBookingPanel booking={booking} />
    </div>
  );
}
