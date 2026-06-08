export type PatientGroup = "adult" | "child";

export type DoseUnit = "microg/kg/min" | "mg/kg/h" | "IE/kg/h";

export type MedicationColor = "purple" | "blue" | "yellow" | "red" | "black";

export type ConcentrationUnit = "microgram" | "milligram";

export type Concentration = {
  value: number;
  unit: ConcentrationUnit;
};

export type Medication = {
  id: string;
  name: string;
  color: MedicationColor;
  unit: DoseUnit;
  defaults: Record<PatientGroup, number | null>;
  concentration?: Concentration;
};

export const medications = [
  {
    id: "noradrenalin",
    name: "Noradrenalin",
    color: "purple",
    unit: "microg/kg/min",
    defaults: {
      adult: 0.03,
      child: 0,
    },
    concentration: {
      value: 10,
      unit: "microgram",
    },
  },
  {
    id: "remifentanil",
    name: "Remifentanil",
    color: "blue",
    unit: "microg/kg/min",
    defaults: {
      adult: 0.2,
      child: 0.1,
    },
    concentration: {
      value: 10,
      unit: "microgram",
    },
  },
  {
    id: "propofol",
    name: "Propofol",
    color: "yellow",
    unit: "mg/kg/h",
    defaults: {
      adult: 5.6,
      child: 4,
    },
    concentration: {
      value: 10,
      unit: "milligram",
    },
  },
  {
    id: "adrenalin",
    name: "Adrenalin",
    color: "red",
    unit: "microg/kg/min",
    defaults: {
      adult: null,
      child: 0.1,
    },
    concentration: {
      value: 10,
      unit: "microgram",
    },
  },
  {
    id: "insulin",
    name: "Insulin",
    color: "black",
    unit: "IE/kg/h",
    defaults: {
      adult: null,
      child: null,
    },
    concentration: {
      value: 10,
      unit: "microgram",
    },
  },
] satisfies Medication[];

export function getDefaultDoseInputs(patientGroup: PatientGroup) {
  return Object.fromEntries(
    medications.map((medication) => [
      medication.id,
      medication.defaults[patientGroup] === null ? "" : String(medication.defaults[patientGroup]),
    ]),
  );
}

export function parseDecimalInput(value: string) {
  const normalizedValue = value.trim().replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function calculateMlPerHour({
  dose,
  weightKg,
  medication,
}: {
  dose: number | null;
  weightKg: number | null;
  medication: Medication;
}) {
  if (dose === null || weightKg === null || !medication.concentration) {
    return null;
  }

  if (weightKg <= 0 || dose < 0) {
    return null;
  }

  switch (medication.unit) {
    case "microg/kg/min":
      return calculateByConcentration({
        microgramPerHour: dose * weightKg * 60,
        concentration: medication.concentration,
      });
    case "mg/kg/h":
      return calculateByConcentration({
        milligramPerHour: dose * weightKg,
        concentration: medication.concentration,
      });
    case "IE/kg/h":
      return null;
  }
}

function calculateByConcentration({
  concentration,
  microgramPerHour,
  milligramPerHour,
}: {
  concentration: Concentration;
  microgramPerHour?: number;
  milligramPerHour?: number;
}) {
  if (concentration.value <= 0) {
    return null;
  }

  if (concentration.unit === "microgram") {
    const hourlyDose = microgramPerHour ?? (milligramPerHour ?? 0) * 1000;

    return hourlyDose / concentration.value;
  }

  const hourlyDose = milligramPerHour ?? (microgramPerHour ?? 0) / 1000;

  return hourlyDose / concentration.value;
}
