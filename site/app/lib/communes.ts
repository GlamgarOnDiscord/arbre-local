import communes from "@/app/data/communes.json";

const table = communes as Record<string, string>;

// Résout un code INSEE de commune en nom lisible, à partir du Code Officiel
// Géographique (INSEE, historique depuis 1943 fusionné avec le millésime
// 2026) : comble le "lieu de décès non résolu" du fichier des décès, qui ne
// fournit qu'un code sans libellé.
export function resoudreCommune(codeInsee: string | null | undefined): string | null {
  if (!codeInsee) return null;
  return table[codeInsee] ?? null;
}
