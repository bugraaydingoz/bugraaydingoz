import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/lib/api";

export function ApiHealth() {
  const { data, error, isPending } = useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    retry: 1,
  });

  return (
    <section className="mt-8" aria-labelledby="api-health-title">
      <h2 id="api-health-title" className="text-xl font-semibold">
        API Health Check
      </h2>
      {isPending && <p role="status">Loading...</p>}
      {error && (
        <p role="alert" className="text-destructive">
          Error: {error.message}
        </p>
      )}
      {data && (
        <pre aria-label="API response" className="mt-2 rounded-lg bg-muted p-4">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </section>
  );
}
