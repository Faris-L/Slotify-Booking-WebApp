export default function DashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-xl bg-muted" />
        <div className="h-32 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
