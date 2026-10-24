import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

function renderApp() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>,
  );
}

describe("RoboFleet", () => {
  it("shows the API response and supports the counter interaction", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ status: "ok" })));
    renderApp();

    expect(screen.getByRole("heading", { name: "RoboFleet" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Count: 0" }));
    expect(screen.getByRole("button", { name: "Count: 1" })).toBeTruthy();
    expect((await screen.findByLabelText("API response")).textContent).toContain('"status": "ok"');
  });

  it("shows a loading state while waiting for telemetry services", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    renderApp();

    expect(screen.getByRole("status").textContent).toBe("Loading...");
    expect(screen.queryByLabelText("API response")).toBeNull();
  });

  it("reports an unsuccessful API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(Response.json({ error: "Unavailable" }, { status: 503 })),
        ),
    );
    renderApp();

    expect((await screen.findByRole("alert", {}, { timeout: 3000 })).textContent).toContain(
      "Unable to reach the API",
    );
    expect(screen.queryByLabelText("API response")).toBeNull();
  });
});
