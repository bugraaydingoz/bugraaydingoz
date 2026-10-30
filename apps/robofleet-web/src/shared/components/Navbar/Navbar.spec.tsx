import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("shows navigation and profile controls with Home active", () => {
    render(<Navbar />);

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });

    expect(within(navigation).getAllByRole("button")).toHaveLength(5);
    expect(
      within(navigation).getByRole("button", { name: "Home" }).getAttribute("aria-current"),
    ).toBe("page");
    expect(within(navigation).getByRole("button", { name: "Profile" })).toBeTruthy();
  });
});
