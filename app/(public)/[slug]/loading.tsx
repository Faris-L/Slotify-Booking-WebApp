export default function PublicBookingLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-lg animate-pulse space-y-6 px-4 py-8"
    >
      <div className="h-10 w-3/4 rounded-lg bg-muted" />
      <div className="h-6 w-1/2 rounded-lg bg-muted" />
      <div className="space-y-3">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
