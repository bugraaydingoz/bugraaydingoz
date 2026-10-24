import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "../../robofleet-api/src/app";

// Initialize Hono client
const client = hc<AppType>("/");

function App() {
  const [count, setCount] = useState(0);
  const { data, error, isLoading } = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await client.api.health.$get({ query: {} });
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-gray-800">RoboFleet</h1>
      <p className="mt-2 text-gray-600">A fleet management system for robots.</p>

      <div className="mt-8">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={() => setCount((c) => c + 1)}
        >
          Count: {count}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold">API Health Check</h2>
        {isLoading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error.message}</p>}
        {data && (
          <pre className="mt-2 rounded bg-gray-100 p-4">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default App;
