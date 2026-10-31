import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/shared/components/ErrorFallback/ErrorFallback";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary
      fallbackRender={() => (
        <main className="grid min-h-dvh place-items-center bg-muted p-6">
          <ErrorFallback
            title="Dashboard unavailable"
            description="Something went wrong displaying the dashboard. Reload the page to try again."
            actionLabel="Reload page"
            onRetry={() => window.location.reload()}
            className="w-full max-w-md"
          />
        </main>
      )}
    >
      <NuqsAdapter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </NuqsAdapter>
    </ErrorBoundary>
  </React.StrictMode>,
);
