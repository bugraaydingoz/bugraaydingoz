import type { PatientGroup } from "./perfusor";

export type PatientSex = "female" | "male";

export const patient = $state({
  group: "adult" as PatientGroup,
  weightInput: "80",
  heightInput: "175",
  sex: "male" as PatientSex,
});
