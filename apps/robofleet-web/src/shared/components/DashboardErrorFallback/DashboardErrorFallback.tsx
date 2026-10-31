import { ErrorFallback } from "@/shared/components/ErrorFallback/ErrorFallback";

export function DashboardErrorFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-muted p-6">
      <ErrorFallback
        title="Dashboard unavailable"
        description="Something went wrong displaying the dashboard. Reload the page to try again."
        actionLabel="Reload page"
        onRetry={() => window.location.reload()}
        className="w-full max-w-md"
      />
    </main>
  );
}
