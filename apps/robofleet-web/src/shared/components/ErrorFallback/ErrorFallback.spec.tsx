import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("disables recovery while pending and allows another attempt after a failure", async () => {
    let reject!: (error: Error) => void;
    const onRetry = vi.fn().mockImplementationOnce(
      () =>
        new Promise<void>((_, fail) => {
          reject = fail;
        }),
    );
    render(
      <ErrorFallback
        title="Map unavailable"
        description="The map could not be displayed."
        actionLabel="Try again"
        onRetry={onRetry}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByRole("button", { name: "Retrying…" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("alert").getAttribute("aria-busy")).toBe("true");

    await act(async () => reject(new Error("Private network details")));

    expect(screen.getByText("Recovery failed. Please try again.")).toBeTruthy();
    expect(screen.queryByText("Private network details")).toBeNull();
    expect(screen.getByRole("button", { name: "Try again" }).hasAttribute("disabled")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => {
      expect(screen.getByRole("alert").getAttribute("aria-busy")).toBe("false");
      expect(screen.queryByText("Recovery failed. Please try again.")).toBeNull();
    });
    expect(onRetry).toHaveBeenCalledTimes(2);
  });
});
