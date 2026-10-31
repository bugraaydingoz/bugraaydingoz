import type { FallbackProps } from "react-error-boundary";
import { ErrorFallback } from "@/shared/components/ErrorFallback/ErrorFallback";
import { useMapRecovery } from "../../hooks/use-map-recovery";

export function MapErrorFallback({ resetErrorBoundary }: FallbackProps) {
  const recover = useMapRecovery();

  return (
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
  );
}
