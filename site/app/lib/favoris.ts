import { get, set } from "idb-keyval";
import type { Personne } from "./search";

export interface Favori {
  id: string;
  nom: string;
  prenoms: string;
  sexe?: string;
  dateNaissance: string;
  communeNaissance?: string;
  codeInseeNaissance?: string;
  dateDeces: string;
  codeInseeDeces?: string;
  numeroActeDeces?: string;
  note?: string;
  ajouteLe: number;
}

const CLE_STOCKAGE = "arbre-favoris";

function genererId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `f-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function signaturePersonne(p: Personne): string {
  return `${p.nom}|${p.prenoms}|${p.date_naissance}|${p.numero_acte_deces}`;
}

export function signatureFavori(f: Favori): string {
  return `${f.nom}|${f.prenoms}|${f.dateNaissance}|${f.numeroActeDeces}`;
}

// Une "piste" : un résultat mis de côté pour vérification ultérieure, sans
// l'engagement de l'ajouter formellement à l'arbre. Stocké uniquement dans
// IndexedDB, comme le reste des données personnelles de l'utilisateur.
export async function chargerFavoris(): Promise<Favori[]> {
  const data = await get<Favori[]>(CLE_STOCKAGE);
  return data ?? [];
}

async function sauvegarder(favoris: Favori[]): Promise<void> {
  await set(CLE_STOCKAGE, favoris);
}

export async function estFavori(p: Personne): Promise<boolean> {
  const favoris = await chargerFavoris();
  const sig = signaturePersonne(p);
  return favoris.some((f) => signatureFavori(f) === sig);
}

export async function ajouterFavori(p: Personne): Promise<void> {
  const favoris = await chargerFavoris();
  const sig = signaturePersonne(p);
  if (favoris.some((f) => signatureFavori(f) === sig)) return;
  favoris.push({
    id: genererId(),
    nom: p.nom,
    prenoms: p.prenoms,
    sexe: p.sexe,
    dateNaissance: p.date_naissance,
    communeNaissance: p.commune_naissance,
    codeInseeNaissance: p.code_insee_naissance,
    dateDeces: p.date_deces,
    codeInseeDeces: p.code_insee_deces,
    numeroActeDeces: p.numero_acte_deces,
    ajouteLe: Date.now(),
  });
  await sauvegarder(favoris);
}

export async function retirerFavoriParSignature(p: Personne): Promise<void> {
  const favoris = await chargerFavoris();
  const sig = signaturePersonne(p);
  await sauvegarder(favoris.filter((f) => signatureFavori(f) !== sig));
}

export async function supprimerFavori(id: string): Promise<void> {
  const favoris = await chargerFavoris();
  await sauvegarder(favoris.filter((f) => f.id !== id));
}

export async function noterFavori(id: string, note: string): Promise<void> {
  const favoris = await chargerFavoris();
  const index = favoris.findIndex((f) => f.id === id);
  if (index === -1) return;
  favoris[index] = { ...favoris[index], note };
  await sauvegarder(favoris);
}
