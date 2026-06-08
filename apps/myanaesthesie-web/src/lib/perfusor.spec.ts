import { describe, expect, it } from "vitest";
import {
  calculateMlPerHour,
  getDefaultDoseInputs,
  medications,
  parseDecimalInput,
} from "./perfusor";

describe("perfusor calculator", () => {
  it("calculates noradrenalin ml/h from microgram per kg per minute", () => {
    const noradrenalin = medications.find((medication) => medication.id === "noradrenalin");

    expect(noradrenalin).toBeDefined();
    expect(
      calculateMlPerHour({
        dose: 0.03,
        weightKg: 80,
        medication: noradrenalin!,
      }),
    ).toBeCloseTo(14.4);
  });

  it("parses decimal input with comma or dot notation", () => {
    expect(parseDecimalInput("0,03")).toBe(0.03);
    expect(parseDecimalInput("5.6")).toBe(5.6);
    expect(parseDecimalInput("")).toBeNull();
  });

  it("switches between adult and pediatric defaults", () => {
    expect(getDefaultDoseInputs("adult")).toMatchObject({
      noradrenalin: "0.03",
      remifentanil: "0.2",
      propofol: "5.6",
      adrenalin: "",
      insulin: "",
    });

    expect(getDefaultDoseInputs("child")).toMatchObject({
      noradrenalin: "0",
      remifentanil: "0.1",
      propofol: "4",
      adrenalin: "0.1",
      insulin: "",
    });
  });

  it("does not calculate medications without concentration data", () => {
    const remifentanil = medications.find((medication) => medication.id === "remifentanil");

    expect(remifentanil).toBeDefined();
    expect(
      calculateMlPerHour({
        dose: 0.2,
        weightKg: 80,
        medication: remifentanil!,
      }),
    ).toBeNull();
  });
});
