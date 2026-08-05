import prenoms from "@/app/data/prenoms.json";

// [année où 15% des porteurs du prénom étaient nés, année médiane, année 85%]
// Calculé depuis le fichier des prénoms de l'INSEE (naissances 1900-2022),
// pour suggérer une période de naissance plausible à partir d'un seul prénom.
const table = prenoms as unknown as Record<string, [number, number, number]>;

export interface EstimationPrenom {
  anneeDe: number;
  anneeMediane: number;
  anneeA: number;
}

export function estimerAnnees(prenom: string): EstimationPrenom | null {
  const cle = prenom.trim().toUpperCase();
  const entree = table[cle];
  if (!entree) return null;
  const [anneeDe, anneeMediane, anneeA] = entree;
  return { anneeDe, anneeMediane, anneeA };
}
