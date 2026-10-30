import { LiveFleetProvider } from "@/hooks/use-fleet-data";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <LiveFleetProvider>
          <App />
        </LiveFleetProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  </React.StrictMode>,
);
