import type { ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/shared/components/ErrorFallback/ErrorFallback";
import { useMapRecovery } from "../../hooks/use-map-recovery";

export function MapErrorBoundary({ children }: { children: ReactNode }) {
  const recover = useMapRecovery();

  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <ErrorFallback
          title="Map unavailable"
          description="The map could not be displayed. Your fleet data is still available."
          actionLabel="Try again"
          onRetry={async () => {
            await recover();
            resetErrorBoundary();
          }}
          className="h-full justify-center"
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
