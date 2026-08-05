"use client";

import { useEffect, useRef, useState } from "react";
import { getDB } from "./lib/duckdb";
import {
  rechercher,
  anneesGenerationPrecedente,
  type Filtres,
  type Personne,
} from "./lib/search";
import { construireMailto, formatDateFr, acteEstRecent } from "./lib/acte";

interface Etape {
  filtres: Filtres;
  label: string;
}

export default function Page() {
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

  const rechercheEnCours = useRef(0);

  useEffect(() => {
    getDB()
      .then(() => setDbPret(true))
      .catch((e) => setErreur(`Impossible d'initialiser le moteur SQL : ${String(e)}`));
  }, []);

  async function lancerRecherche(f: Filtres, label: string, depuisHistorique = false) {
    if (!f.nom.trim()) return;
    const id = ++rechercheEnCours.current;
    setChargement(true);
    setErreur(null);
    setARecherche(true);
    try {
      const r = await rechercher(f);
      if (id !== rechercheEnCours.current) return; // une recherche plus récente a été lancée
      setResultats(r.personnes);
      setTotal(r.total);
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
    const { anneeDe: de, anneeA: a } = anneesGenerationPrecedente(p.date_naissance);
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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Moteur de recherche généalogique 100 % local
          </h1>
          <p className="mt-3 text-neutral-600 leading-relaxed">
            Recherche parmi les décès enregistrés en France depuis 1970.
            Toute la recherche s&apos;exécute dans votre navigateur : le nom
            que vous tapez n&apos;est envoyé à aucun serveur.
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Pour commencer, pensez à une personne de votre famille qui est
            décédée&nbsp;: un grand-parent, un arrière-grand-parent. Vous avez
            besoin de son nom, son prénom, et à peu près de son année de
            naissance.
          </p>
        </header>

        <form onSubmit={onSubmit} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="nom">
                Nom <span className="text-red-600">*</span>
              </label>
              <input
                id="nom"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="DUPONT"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="prenom">
                Prénom
              </label>
              <input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-neutral-800"
                placeholder="Jean (optionnel)"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFiltresOuverts((v) => !v)}
            className="mt-4 text-sm text-neutral-600 underline underline-offset-2"
          >
            {filtresOuverts ? "Masquer les filtres" : "Filtres avancés (années, commune, département)"}
          </button>

          {filtresOuverts && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="anneeDe">
                  Né(e) après
                </label>
                <input
                  id="anneeDe"
                  inputMode="numeric"
                  value={anneeDe}
                  onChange={(e) => setAnneeDe(e.target.value)}
                  placeholder="1900"
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="anneeA">
                  Né(e) avant
                </label>
                <input
                  id="anneeA"
                  inputMode="numeric"
                  value={anneeA}
                  onChange={(e) => setAnneeA(e.target.value)}
                  placeholder="1950"
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium mb-1" htmlFor="commune">
                  Commune de naissance
                </label>
                <input
                  id="commune"
                  value={commune}
                  onChange={(e) => setCommune(e.target.value)}
                  placeholder="Lyon"
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" htmlFor="departement">
                  Département (code)
                </label>
                <input
                  id="departement"
                  value={departement}
                  onChange={(e) => setDepartement(e.target.value)}
                  placeholder="69"
                  maxLength={3}
                  className="w-full rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={!dbPret || chargement || !nom.trim()}
              className="rounded-lg bg-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {!dbPret ? "Initialisation du moteur SQL…" : chargement ? "Recherche…" : "Rechercher"}
            </button>
            {chargement && (
              <span className="text-sm text-neutral-500">Interrogation en cours…</span>
            )}
          </div>
        </form>

        {historique.length > 1 && (
          <nav className="mt-4 flex flex-wrap gap-1 text-sm text-neutral-600">
            {historique.map((etape, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-neutral-400">→</span>}
                <button
                  onClick={() => revenirA(i)}
                  className={
                    i === historique.length - 1
                      ? "font-semibold text-neutral-900"
                      : "underline underline-offset-2 hover:text-neutral-900"
                  }
                >
                  {etape.label}
                </button>
              </span>
            ))}
          </nav>
        )}

        {erreur && (
          <p className="mt-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">{erreur}</p>
        )}

        {aRecherche && !chargement && !erreur && resultats && (
          <section className="mt-6">
            <p className="text-sm text-neutral-600 mb-3">
              {total === 0
                ? "Aucun résultat."
                : `${total.toLocaleString("fr-FR")} résultat${total > 1 ? "s" : ""} trouvé${total > 1 ? "s" : ""}${
                    total > 100 ? ", 100 affichés" : ""
                  }.`}
            </p>

            {resultats.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-100 text-left text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Nom</th>
                      <th className="px-3 py-2 font-medium">Prénoms</th>
                      <th className="px-3 py-2 font-medium">Né(e) le</th>
                      <th className="px-3 py-2 font-medium">À</th>
                      <th className="px-3 py-2 font-medium">Décédé(e) le</th>
                      <th className="px-3 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultats.map((p, i) => {
                      const { href, archive } = construireMailto(p);
                      const recent = acteEstRecent(p.date_naissance);
                      return (
                        <tr key={i} className="border-t border-neutral-100 align-top">
                          <td className="px-3 py-2 whitespace-nowrap">{p.nom}</td>
                          <td className="px-3 py-2">{p.prenoms}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDateFr(p.date_naissance)}</td>
                          <td className="px-3 py-2">
                            {p.commune_naissance || p.pays_naissance || "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatDateFr(p.date_deces)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1 w-36">
                              <button
                                onClick={() => remonterGeneration(p)}
                                className="text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 px-2 py-1 text-left"
                              >
                                ↑ Génération précédente
                              </button>
                              {recent ? (
                                <span className="text-xs text-neutral-500">
                                  Acte &lt; 75 ans : à demander en mairie.
                                </span>
                              ) : href ? (
                                <a
                                  href={href}
                                  className="text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 px-2 py-1 text-left"
                                >
                                  Demander l&apos;acte
                                </a>
                              ) : archive?.site ? (
                                <a
                                  href={archive.site}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs rounded-md bg-neutral-100 hover:bg-neutral-200 px-2 py-1 text-left"
                                >
                                  Site des archives
                                </a>
                              ) : (
                                <span className="text-xs text-neutral-400">
                                  Archives non identifiées
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {resultats.length > 0 && (
              <p className="mt-3 text-xs text-neutral-500 leading-relaxed">
                Les personnes affichées sous « Remonter d&apos;une génération »
                sont des <strong>pistes</strong> fondées sur le patronyme, le
                lieu et une plage d&apos;âge plausible — jamais une filiation
                établie. Seul l&apos;acte d&apos;état civil fait foi.
              </p>
            )}
          </section>
        )}

        <details className="mt-10 text-sm text-neutral-500">
          <summary className="cursor-pointer select-none">
            Comment vérifier que rien ne quitte votre navigateur ?
          </summary>
          <p className="mt-2 leading-relaxed">
            Ouvrez les outils de développement (F12) → onglet « Réseau »,
            lancez une recherche : les requêtes ciblent un fichier{" "}
            <code>data.parquet</code> avec un en-tête{" "}
            <code>Range: bytes=…</code>. Aucune requête ne contient le nom que
            vous avez saisi.
          </p>
        </details>

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400 leading-relaxed">
          <p>
            Base des décès survenus en France depuis 1970 (INSEE / data.gouv.fr,
            Licence Ouverte 2.0). Couverture : décès uniquement, pas de
            naissances ni de mariages. Les liens de parenté affichés sont
            déduits, jamais donnés par la source.
          </p>
        </footer>
      </main>
    </div>
  );
}
