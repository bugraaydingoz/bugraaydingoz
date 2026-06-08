import { describe, expect, it } from "vitest";
import {
  calculateBloodVolumeLiters,
  calculateIdealBodyWeight,
  calculateTidalVolumeRangeMl,
} from "./physiology";

describe("physiology calculator", () => {
  it("calculates ideal body weight with the Devine-style height formula", () => {
    expect(calculateIdealBodyWeight({ heightCm: 175, sex: "male" })).toBeCloseTo(70.57);
    expect(calculateIdealBodyWeight({ heightCm: 165, sex: "female" })).toBeCloseTo(56.97);
  });

  it("calculates blood volume from actual weight and sex", () => {
    expect(calculateBloodVolumeLiters({ weightKg: 80, sex: "male" })).toBeCloseTo(6);
    expect(calculateBloodVolumeLiters({ weightKg: 80, sex: "female" })).toBeCloseTo(4.88);
  });

  it("calculates tidal volume range from ideal body weight", () => {
    expect(calculateTidalVolumeRangeMl(70)).toEqual({
      lower: 420,
      upper: 560,
    });
  });

  it("returns null for missing or invalid values", () => {
    expect(calculateIdealBodyWeight({ heightCm: null, sex: "male" })).toBeNull();
    expect(calculateBloodVolumeLiters({ weightKg: 0, sex: "female" })).toBeNull();
    expect(calculateTidalVolumeRangeMl(null)).toBeNull();
  });
});
