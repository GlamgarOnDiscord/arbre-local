import { get, set } from "idb-keyval";

export interface PersonneArbre {
  id: string;
  nom: string;
  prenoms: string;
  sexe?: string;
  dateNaissance?: string;
  communeNaissance?: string;
  codeInseeNaissance?: string;
  dateDeces?: string;
  communeDeces?: string;
  codeInseeDeces?: string;
  numeroActeDeces?: string;
  pereId?: string | null;
  mereId?: string | null;
  notes?: string;
  creeLe: number;
}

const CLE_STOCKAGE = "arbre-personnes";

function genererId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Tout est stocké dans IndexedDB, dans le navigateur de l'utilisateur :
// l'arbre personnel ne quitte jamais la machine, comme le reste du site.
export async function chargerArbre(): Promise<PersonneArbre[]> {
  const data = await get<PersonneArbre[]>(CLE_STOCKAGE);
  return data ?? [];
}

async function sauvegarderArbre(personnes: PersonneArbre[]): Promise<void> {
  await set(CLE_STOCKAGE, personnes);
}

export async function ajouterPersonne(
  partial: Omit<PersonneArbre, "id" | "creeLe">
): Promise<PersonneArbre> {
  const personnes = await chargerArbre();
  const personne: PersonneArbre = {
    ...partial,
    id: genererId(),
    creeLe: Date.now(),
  };
  personnes.push(personne);
  await sauvegarderArbre(personnes);
  return personne;
}

export async function mettreAJourPersonne(
  id: string,
  patch: Partial<Omit<PersonneArbre, "id" | "creeLe">>
): Promise<void> {
  const personnes = await chargerArbre();
  const index = personnes.findIndex((p) => p.id === id);
  if (index === -1) return;
  personnes[index] = { ...personnes[index], ...patch };
  await sauvegarderArbre(personnes);
}

export async function lierParent(
  enfantId: string,
  parentId: string,
  role: "pere" | "mere"
): Promise<void> {
  await mettreAJourPersonne(enfantId, {
    [role === "pere" ? "pereId" : "mereId"]: parentId,
  });
}

export async function delierParent(
  enfantId: string,
  role: "pere" | "mere"
): Promise<void> {
  await mettreAJourPersonne(enfantId, {
    [role === "pere" ? "pereId" : "mereId"]: null,
  });
}

// Supprime une personne et détache les liens de ses enfants (ils redeviennent
// des points de départ plutôt que de disparaître avec elle).
export async function supprimerPersonne(id: string): Promise<void> {
  const personnes = await chargerArbre();
  const restantes = personnes
    .filter((p) => p.id !== id)
    .map((p) => ({
      ...p,
      pereId: p.pereId === id ? null : p.pereId,
      mereId: p.mereId === id ? null : p.mereId,
    }));
  await sauvegarderArbre(restantes);
}

// Les racines sont les personnes qui ne sont le père ou la mère d'aucune
// autre personne du set : ce sont les points de départ de chaque sous-arbre
// affiché (l'utilisateur peut en avoir plusieurs, non reliés entre eux).
export function racines(personnes: PersonneArbre[]): PersonneArbre[] {
  const referencees = new Set<string>();
  for (const p of personnes) {
    if (p.pereId) referencees.add(p.pereId);
    if (p.mereId) referencees.add(p.mereId);
  }
  return personnes
    .filter((p) => !referencees.has(p.id))
    .sort((a, b) => a.creeLe - b.creeLe);
}
