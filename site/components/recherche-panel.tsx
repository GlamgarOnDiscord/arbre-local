"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Search,
  ChevronDown,
  ArrowUp,
  Mail,
  ExternalLink,
  TreePine,
  ChevronRight,
  Bookmark,
} from "lucide-react";
import { getDB } from "@/app/lib/duckdb";
import {
  rechercher,
  anneesGenerationPrecedente,
  type Filtres,
  type Personne,
} from "@/app/lib/search";
import { construireMailto, formatDateFr, acteEstRecent } from "@/app/lib/acte";
import { resoudreCommune } from "@/app/lib/communes";
import { estimerAnnees } from "@/app/lib/prenoms";
import { ajouterPersonne } from "@/app/lib/arbre";
import {
  ajouterFavori,
  chargerFavoris,
  retirerFavoriParSignature,
  signaturePersonne,
  signatureFavori,
} from "@/app/lib/favoris";
import { cn } from "@/lib/utils";

interface Etape {
  filtres: Filtres;
  label: string;
}

export function RecherchePanel() {
  const [dbPret, setDbPret] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [anneeDe, setAnneeDe] = useState("");
  const [anneeA, setAnneeA] = useState("");
  const [commune, setCommune] = useState("");
  const [departement, setDepartement] = useState("");
  const [filtresOuverts, setFiltresOuverts] = useState(false);

  const [resultats, setResultats] = useState<Personne[] | null>(null);
  const [total, setTotal] = useState(0);
  const [aRecherche, setARecherche] = useState(false);

  const [historique, setHistorique] = useState<Etape[]>([]);
  const [ajoutes, setAjoutes] = useState<Set<string>>(new Set());
  const [favoris, setFavoris] = useState<Set<string>>(new Set());

  const estimationPrenom = prenom.trim() ? estimerAnnees(prenom) : null;

  const rechercheEnCours = useRef(0);

  useEffect(() => {
    getDB()
      .then(() => setDbPret(true))
      .catch((e) =>
        setErreur(`Impossible d'initialiser le moteur SQL : ${String(e)}`)
      );
  }, []);

  async function lancerRecherche(
    f: Filtres,
    label: string,
    depuisHistorique = false
  ) {
    if (!f.nom.trim()) return;
    const id = ++rechercheEnCours.current;
    setChargement(true);
    setErreur(null);
    setARecherche(true);
    try {
      const r = await rechercher(f);
      if (id !== rechercheEnCours.current) return;
      setResultats(r.personnes);
      setTotal(r.total);
      const favorisExistants = await chargerFavoris();
      const sigsExistants = new Set(favorisExistants.map(signatureFavori));
      setFavoris(
        new Set(
          r.personnes.map(signature).filter((s) => sigsExistants.has(s))
        )
      );
      if (!depuisHistorique) {
        setHistorique((h) => [...h, { filtres: f, label }]);
      }
    } catch (e) {
      if (id !== rechercheEnCours.current) return;
      setErreur(`La recherche a échoué : ${String(e)}`);
      setResultats(null);
    } finally {
      if (id === rechercheEnCours.current) setChargement(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const f: Filtres = { nom, prenom, anneeDe, anneeA, commune, departement };
    lancerRecherche(f, nom.toUpperCase());
  }

  function remonterGeneration(p: Personne) {
    const { anneeDe: de, anneeA: a } = anneesGenerationPrecedente(
      p.date_naissance
    );
    const f: Filtres = {
      nom: p.nom,
      commune: p.commune_naissance,
      anneeDe: de,
      anneeA: a,
    };
    setNom(p.nom);
    setPrenom("");
    setCommune(p.commune_naissance);
    setAnneeDe(de);
    setAnneeA(a);
    setDepartement("");
    setFiltresOuverts(true);
    lancerRecherche(f, `${p.nom} (génération précédente, ${de}-${a})`);
  }

  function revenirA(index: number) {
    const etape = historique[index];
    setHistorique((h) => h.slice(0, index + 1));
    setNom(etape.filtres.nom);
    setPrenom(etape.filtres.prenom ?? "");
    setAnneeDe(etape.filtres.anneeDe ?? "");
    setAnneeA(etape.filtres.anneeA ?? "");
    setCommune(etape.filtres.commune ?? "");
    setDepartement(etape.filtres.departement ?? "");
    lancerRecherche(etape.filtres, etape.label, true);
  }

  const signature = signaturePersonne;

  async function ajouterALarbre(p: Personne) {
    await ajouterPersonne({
      nom: p.nom,
      prenoms: p.prenoms,
      sexe: p.sexe,
      dateNaissance: p.date_naissance,
      communeNaissance: p.commune_naissance,
      codeInseeNaissance: p.code_insee_naissance,
      dateDeces: p.date_deces,
      codeInseeDeces: p.code_insee_deces,
      numeroActeDeces: p.numero_acte_deces,
    });
    setAjoutes((s) => new Set(s).add(signature(p)));
    toast.success("Ajouté(e) à l'arbre", {
      description: `${p.nom} ${p.prenoms} — voir l'onglet « Mon arbre ».`,
    });
  }

  async function toggleFavori(p: Personne) {
    const sig = signature(p);
    if (favoris.has(sig)) {
      await retirerFavoriParSignature(p);
      setFavoris((s) => {
        const next = new Set(s);
        next.delete(sig);
        return next;
      });
      toast("Retiré des favoris");
    } else {
      await ajouterFavori(p);
      setFavoris((s) => new Set(s).add(sig));
      toast.success("Ajouté aux favoris", {
        description: `${p.nom} ${p.prenoms} — voir l'onglet « Favoris ».`,
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nom" className="mb-1.5">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nom"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="DUPONT"
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="prenom" className="mb-1.5">
                Prénom
              </Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Jean (optionnel)"
                autoComplete="off"
              />
              {estimationPrenom && (
                <p className="animate-in fade-in mt-1 text-xs text-muted-foreground duration-300">
                  Surtout donné entre {estimationPrenom.anneeDe} et{" "}
                  {estimationPrenom.anneeA} (INSEE, prénoms depuis 1900)
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFiltresOuverts((v) => !v)}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "size-3.5 transition-transform",
                filtresOuverts && "rotate-180"
              )}
            />
            Filtres avancés (années, commune, département)
          </button>

          {filtresOuverts && (
            <div className="animate-in fade-in slide-in-from-top-1 grid grid-cols-2 gap-3 duration-200 sm:grid-cols-4">
              <div>
                <Label htmlFor="anneeDe" className="mb-1.5 text-xs">
                  Né(e) après
                </Label>
                <Input
                  id="anneeDe"
                  inputMode="numeric"
                  value={anneeDe}
                  onChange={(e) => setAnneeDe(e.target.value)}
                  placeholder="1900"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="anneeA" className="mb-1.5 text-xs">
                  Né(e) avant
                </Label>
                <Input
                  id="anneeA"
                  inputMode="numeric"
                  value={anneeA}
                  onChange={(e) => setAnneeA(e.target.value)}
                  placeholder="1950"
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="commune" className="mb-1.5 text-xs">
                  Commune de naissance
                </Label>
                <Input
                  id="commune"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Lyon"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="departement" className="mb-1.5 text-xs">
                  Département (code)
                </Label>
                <Input
                  id="departement"
                  value={departement}
                  onChange={(e) => setDepartement(e.target.value)}
                  placeholder="69"
                  maxLength={3}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!dbPret || chargement || !nom.trim()}>
              {!dbPret || chargement ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Search />
              )}
              {!dbPret
                ? "Initialisation du moteur SQL…"
                : chargement
                  ? "Recherche…"
                  : "Rechercher"}
            </Button>
          </div>
        </form>
      </Card>

      {historique.length > 1 && (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {historique.map((etape, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="size-3.5" />}
              <button
                onClick={() => revenirA(i)}
                className={
                  i === historique.length - 1
                    ? "font-semibold text-foreground"
                    : "underline underline-offset-2 hover:text-foreground"
                }
              >
                {etape.label}
              </button>
            </span>
          ))}
        </nav>
      )}

      {erreur && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erreur}
        </p>
      )}

      {aRecherche && !chargement && !erreur && resultats && (
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Aucun résultat."
              : `${total.toLocaleString("fr-FR")} résultat${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}${
                  total > 100 ? ", 100 affichés" : ""
                }.`}
          </p>

          {resultats.length > 0 && (
            <Card className="animate-in fade-in slide-in-from-bottom-1 py-0 duration-300">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prénoms</TableHead>
                    <TableHead>Né(e) le</TableHead>
                    <TableHead>À</TableHead>
                    <TableHead>Décédé(e) le</TableHead>
                    <TableHead>À (décès)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultats.map((p, i) => {
                    const { href, archive } = construireMailto(p);
                    const recent = acteEstRecent(p.date_naissance);
                    const communeDeces = resoudreCommune(p.code_insee_deces);
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.nom}</TableCell>
                        <TableCell className="max-w-32 truncate" title={p.prenoms}>
                          {p.prenoms}
                        </TableCell>
                        <TableCell>{formatDateFr(p.date_naissance)}</TableCell>
                        <TableCell
                          className="max-w-28 truncate"
                          title={p.commune_naissance || p.pays_naissance || undefined}
                        >
                          {p.commune_naissance || p.pays_naissance || "—"}
                        </TableCell>
                        <TableCell>{formatDateFr(p.date_deces)}</TableCell>
                        <TableCell
                          className="max-w-28 truncate text-muted-foreground"
                          title={communeDeces ?? undefined}
                        >
                          {communeDeces ?? "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {ajoutes.has(signature(p)) ? (
                              <Badge
                                variant="success"
                                className="animate-in zoom-in-50 fade-in"
                              >
                                Ajouté
                              </Badge>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Ajouter à l'arbre"
                                onClick={() => ajouterALarbre(p)}
                              >
                                <TreePine />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title={
                                favoris.has(signature(p))
                                  ? "Retirer des favoris"
                                  : "Ajouter aux favoris"
                              }
                              onClick={() => toggleFavori(p)}
                            >
                              <Bookmark
                                className={cn(
                                  "transition-all",
                                  favoris.has(signature(p)) &&
                                    "fill-current text-primary"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Remonter d'une génération"
                              onClick={() => remonterGeneration(p)}
                            >
                              <ArrowUp />
                            </Button>
                            {recent ? (
                              <Badge
                                variant="secondary"
                                className="whitespace-nowrap text-[10px]"
                              >
                                Acte &lt; 75 ans : mairie
                              </Badge>
                            ) : href ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                render={
                                  <a href={href} title="Demander l'acte">
                                    <Mail />
                                  </a>
                                }
                              />
                            ) : archive?.site ? (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                render={
                                  <a
                                    href={archive.site}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Site des archives"
                                  >
                                    <ExternalLink />
                                  </a>
                                }
                              />

                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          {resultats.length > 0 && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Les résultats affichés via « Remonter d&apos;une génération »
              sont des <strong>pistes</strong> fondées sur le patronyme, le
              lieu et une plage d&apos;âge plausible — jamais une filiation
              établie. Seul l&apos;acte d&apos;état civil fait foi.
            </p>
          )}
        </section>
      )}

      <details className="text-sm text-muted-foreground">
        <summary className="cursor-pointer select-none">
          Comment vérifier que rien ne quitte votre navigateur ?
        </summary>
        <p className="mt-2 leading-relaxed">
          Ouvrez les outils de développement (F12) → onglet « Réseau »,
          lancez une recherche : les requêtes ciblent un fichier{" "}
          <code>data.parquet</code> avec un en-tête <code>Range: bytes=…</code>.
          Aucune requête ne contient le nom que vous avez saisi.
        </p>
      </details>
    </div>
  );
}
