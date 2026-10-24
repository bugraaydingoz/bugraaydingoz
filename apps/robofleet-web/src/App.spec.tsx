import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { useFleet } from "@/stores/fleet";

beforeEach(() => useFleet.setState({ selectedId: "AMR-001", hoveredId: null, filter: "all" }));

describe("Robots panel", () => {
  it("replaces the scaffold with fleet cards and the first robot's task details", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Robots" })).toBeTruthy();
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(8);
    expect(
      screen.getByRole("progressbar", { name: "Delivering towels" }).getAttribute("aria-valuenow"),
    ).toBe("64");
    expect(screen.getByLabelText("Atlas battery 84%")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "API Health Check" })).toBeNull();
    expect(
      within(screen.getByRole("navigation", { name: "Main navigation" })).getAllByRole("button"),
    ).toHaveLength(5);
  });

  it("expands one robot at a time and allows details to collapse", () => {
    render(<App />);
    fireEvent.click(screen.getByText("Reception dock"));
    expect(screen.getByRole("button", { name: "Nova details" }).getAttribute("aria-expanded")).toBe(
      "true",
    );
    expect(
      screen.getByText("Charging at dock C-02. Ready in approximately 24 minutes."),
    ).toBeTruthy();
    expect(screen.queryByRole("progressbar", { name: "Delivering towels" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Nova details" }));
    expect(screen.getByRole("button", { name: "Nova details" }).getAttribute("aria-expanded")).toBe(
      "false",
    );
    expect(
      screen.queryByText("Charging at dock C-02. Ready in approximately 24 minutes."),
    ).toBeNull();
  });

  it("filters active and attention robots without showing unrelated cards", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Attention 2" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(screen.getByRole("article", { name: "Bolt" })).toBeTruthy();
    expect(screen.getByRole("article", { name: "Milo" })).toBeTruthy();
    expect(screen.queryByRole("article", { name: "Atlas" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Active 4" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(4);
    expect(screen.queryByRole("article", { name: "Bolt" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "All robots" }));
    expect(
      within(screen.getByRole("list", { name: "Robots" })).getAllByRole("listitem"),
    ).toHaveLength(8);
  });
  it("links map selection to the card and reveals robots hidden by a filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Attention 2" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Scout on map" }));
    expect(screen.getByRole("button", { name: "All robots" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Scout details" }).getAttribute("aria-expanded"),
    ).toBe("true");
    expect(
      screen.getByRole("button", { name: "Select Scout on map" }).getAttribute("aria-pressed"),
    ).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Nova details" }));
    expect(
      screen.getByRole("button", { name: "Select Nova on map" }).getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
