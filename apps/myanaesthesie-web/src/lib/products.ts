export type Product = "perfusor" | "physiology" | "concentration";

export const products = [
  { value: "perfusor", label: "Perfusoren" },
  { value: "physiology", label: "Parameter" },
  { value: "concentration", label: "Konzentration" },
] satisfies Array<{ value: Product; label: string }>;

export function getProductTitle(product: Product) {
  if (product === "perfusor") {
    return "Perfusoren Rechner";
  }

  if (product === "physiology") {
    return "Physiologische Parameter";
  }

  return "Konzentrationsrechner";
}

export function getProductDescription(product: Product) {
  if (product === "perfusor") {
    return "Schnelle Laufbahn-Berechnung für Perfusorspritzpumpen. Werte prüfen und lokal anpassen.";
  }

  if (product === "physiology") {
    return "Körpergewicht, Blutvolumen und Atemzugsvolumen aus gemeinsamen Patientendaten.";
  }

  return "Verdünnung mit NaCl vorwärts und rückwärts berechnen.";
}
