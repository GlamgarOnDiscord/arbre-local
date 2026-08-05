import archivesDept from "../data/archives-dept.json";
import type { Personne } from "./search";

interface ArchiveDept {
  dept: string;
  nom: string;
  courriel: string | null;
  site: string | null;
}

const ARCHIVES = archivesDept as ArchiveDept[];

export function formatDateFr(aaaammjj: string): string {
  if (!/^\d{8}$/.test(aaaammjj)) return aaaammjj;
  const a = aaaammjj.slice(0, 4);
  const m = aaaammjj.slice(4, 6);
  const j = aaaammjj.slice(6, 8);
  return `${j}/${m}/${a}`;
}

// Règle des 75 ans : un acte de naissance récent ne peut être demandé
// qu'en mairie, par un proche justifiant de sa filiation.
export function acteEstRecent(dateNaissance: string): boolean {
  const annee = parseInt(dateNaissance.slice(0, 4), 10);
  if (Number.isNaN(annee)) return false;
  return new Date().getFullYear() - annee < 75;
}

export function archiveDuDepartement(codeInseeNaissance: string): ArchiveDept | null {
  const dept = codeInseeNaissance.slice(0, 2);
  return ARCHIVES.find((a) => a.dept === dept) ?? null;
}

export function construireMailto(p: Personne): { href: string | null; archive: ArchiveDept | null } {
  const archive = archiveDuDepartement(p.code_insee_naissance);
  if (!archive || !archive.courriel) {
    return { href: null, archive };
  }

  const objet = "Demande de copie d'acte de naissance";
  const corps = `Madame, Monsieur,

Je souhaite obtenir une copie de l'acte de naissance de :

Nom : ${p.nom}
Prénoms : ${p.prenoms}
Né(e) le : ${formatDateFr(p.date_naissance)}
À : ${p.commune_naissance}

Je vous remercie par avance.

Cordialement,`;

  const href = `mailto:${archive.courriel}?subject=${encodeURIComponent(
    objet
  )}&body=${encodeURIComponent(corps)}`;

  return { href, archive };
}
