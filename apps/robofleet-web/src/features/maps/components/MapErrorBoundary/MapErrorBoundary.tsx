import type { ReactNode } from "react";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary/ErrorBoundary";
import { ErrorFallback } from "@/shared/components/ErrorFallback/ErrorFallback";
import { useMapRecovery } from "../../hooks/use-map-recovery";

export function MapErrorBoundary({ children }: { children: ReactNode }) {
  const recover = useMapRecovery();

  return (
    <ErrorBoundary
      fallback={(reset) => (
        <ErrorFallback
          title="Map unavailable"
          description="The map could not be displayed. Your fleet data is still available."
          actionLabel="Try again"
          onRetry={async () => {
            await recover();
            reset();
          }}
          className="h-full justify-center"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
