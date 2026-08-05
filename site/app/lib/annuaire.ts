import annuaire from "@/app/data/annuaire-archives.json";

export interface ServiceArchives {
  nom: string;
  categorie: string;
  dept: string | null;
  ville: string | null;
  adresse: string | null;
  codePostal: string | null;
  courriel: string | null;
  telephone: string | null;
  site: string | null;
}

const services = annuaire as ServiceArchives[];

export function toutesLesCategories(): string[] {
  return [...new Set(services.map((s) => s.categorie))].sort();
}

export function rechercherArchives(params: {
  texte?: string;
  dept?: string;
  categorie?: string;
}): ServiceArchives[] {
  const texte = params.texte?.trim().toLowerCase();
  const dept = params.dept?.trim();
  const categorie = params.categorie?.trim();

  return services.filter((s) => {
    if (dept && s.dept !== dept) return false;
    if (categorie && s.categorie !== categorie) return false;
    if (texte) {
      const hay = `${s.nom} ${s.ville ?? ""}`.toLowerCase();
      if (!hay.includes(texte)) return false;
    }
    return true;
  });
}
