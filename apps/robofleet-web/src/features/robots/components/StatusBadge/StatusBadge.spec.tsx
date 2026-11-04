import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it.each<[ComponentProps<typeof StatusBadge>["status"], string]>([
    ["connecting", "Connecting…"],
    ["live", "Live simulator"],
    ["reconnecting", "Reconnecting…"],
    ["unavailable", "Backend unavailable"],
  ])("announces %s with its status message", (status, message) => {
    render(<StatusBadge status={status} />);

    expect(screen.getByRole("status").textContent).toBe(message);
  });

  it("updates the existing status region when the connection drops and recovers", () => {
    const { rerender } = render(<StatusBadge status="live" />);
    const statusRegion = screen.getByRole("status");

    rerender(<StatusBadge status="reconnecting" />);

    expect(screen.getByRole("status")).toBe(statusRegion);
    expect(statusRegion.textContent).toBe("Reconnecting…");

    rerender(<StatusBadge status="live" />);

    expect(screen.getByRole("status")).toBe(statusRegion);
    expect(statusRegion.textContent).toBe("Live simulator");
  });
});
