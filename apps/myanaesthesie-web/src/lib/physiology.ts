import type { PatientSex } from "./patient-state.svelte";

export const bloodVolumeMlPerKg = {
  female: 61,
  male: 75,
} satisfies Record<PatientSex, number>;

export function calculateIdealBodyWeight({
  heightCm,
  sex,
}: {
  heightCm: number | null;
  sex: PatientSex;
}) {
  if (heightCm === null || heightCm <= 0) {
    return null;
  }

  const baseWeightKg = sex === "male" ? 50 : 45.5;
  const idealWeightKg = baseWeightKg + 0.91 * (heightCm - 152.4);

  return Math.max(idealWeightKg, 0);
}

export function calculateBloodVolumeLiters({
  weightKg,
  sex,
}: {
  weightKg: number | null;
  sex: PatientSex;
}) {
  if (weightKg === null || weightKg <= 0) {
    return null;
  }

  return (weightKg * bloodVolumeMlPerKg[sex]) / 1000;
}

export function calculateTidalVolumeRangeMl(idealBodyWeightKg: number | null) {
  if (idealBodyWeightKg === null || idealBodyWeightKg <= 0) {
    return null;
  }

  return {
    lower: idealBodyWeightKg * 6,
    upper: idealBodyWeightKg * 8,
  };
}
