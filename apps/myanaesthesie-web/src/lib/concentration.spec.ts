import { describe, expect, it } from "vitest";
import {
  calculateDilutedConcentration,
  calculateRequiredDiluentVolume,
  percentageToMilligramPerMl,
} from "./concentration";

describe("concentration calculator", () => {
  it("converts percentage concentration to milligram per milliliter", () => {
    expect(percentageToMilligramPerMl(0.5)).toBe(5);
  });

  it("calculates the diluted concentration from NaCl volume", () => {
    expect(
      calculateDilutedConcentration({
        sourcePercentage: 0.5,
        drugVolumeMl: 10,
        diluentVolumeMl: 10,
      }),
    ).toEqual({
      percentage: 0.25,
      milligramPerMl: 2.5,
    });
  });

  it("calculates required NaCl volume from target concentration", () => {
    expect(
      calculateRequiredDiluentVolume({
        sourcePercentage: 0.5,
        drugVolumeMl: 10,
        targetPercentage: 0.25,
      }),
    ).toBe(10);
  });

  it("returns null for invalid reverse dilution requests", () => {
    expect(
      calculateRequiredDiluentVolume({
        sourcePercentage: 0.5,
        drugVolumeMl: 10,
        targetPercentage: 1,
      }),
    ).toBeNull();
  });
});
