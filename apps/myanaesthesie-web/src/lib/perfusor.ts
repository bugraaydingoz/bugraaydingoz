export type PatientGroup = "adult" | "child";

export type DoseUnit = "microg/kg/min" | "mg/kg/h" | "IE/kg/h";

export type MedicationColor = "purple" | "blue" | "yellow" | "red" | "black";

export type Concentration = {
  microgramPerMl: number;
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
      microgramPerMl: 10,
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
      return (dose * weightKg * 60) / medication.concentration.microgramPerMl;
    case "mg/kg/h":
      return (dose * 1000 * weightKg) / medication.concentration.microgramPerMl;
    case "IE/kg/h":
      return null;
  }
}
