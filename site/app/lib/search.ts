import * as duckdb from "@duckdb/duckdb-wasm";
import type { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { getDB, letterForNom, partitionUrl } from "./duckdb";

export interface Personne {
  nom: string;
  prenoms: string;
  sexe: string;
  date_naissance: string;
  code_insee_naissance: string;
  commune_naissance: string;
  pays_naissance: string | null;
  date_deces: string;
  code_insee_deces: string;
  numero_acte_deces: string;
}

export interface Filtres {
  nom: string;
  prenom?: string;
  anneeDe?: string;
  anneeA?: string;
  commune?: string;
  departement?: string;
}

export interface ResultatRecherche {
  personnes: Personne[];
  total: number;
}

const COLONNES = `nom, prenoms, sexe, date_naissance, code_insee_naissance,
       commune_naissance, pays_naissance, date_deces, code_insee_deces,
       numero_acte_deces`;

function buildWhere(f: Filtres): { clause: string; params: unknown[] } {
  // Comparaison directe (sargable) sur "nom" : le fichier est trié par
  // nom, ce qui permet à DuckDB d'ignorer la quasi-totalité des row groups
  // grâce aux statistiques min/max du Parquet. Envelopper la colonne dans
  // une fonction (ex. strip_accents) empêcherait cet élagage et forcerait
  // le téléchargement du fichier entier à chaque recherche.
  const conditions: string[] = ["nom = ?"];
  const params: unknown[] = [f.nom.toUpperCase()];

  if (f.prenom && f.prenom.trim() !== "") {
    conditions.push("prenoms ILIKE ?");
    params.push(`%${f.prenom.trim()}%`);
  }
  if (f.anneeDe && f.anneeDe.trim() !== "") {
    conditions.push("date_naissance >= ?");
    params.push(`${f.anneeDe.trim()}0101`);
  }
  if (f.anneeA && f.anneeA.trim() !== "") {
    conditions.push("date_naissance <= ?");
    params.push(`${f.anneeA.trim()}1231`);
  }
  if (f.commune && f.commune.trim() !== "") {
    conditions.push("strip_accents(commune_naissance) ILIKE strip_accents(?)");
    params.push(`%${f.commune.trim()}%`);
  }
  if (f.departement && f.departement.trim() !== "") {
    conditions.push("code_insee_naissance LIKE ?");
    params.push(`${f.departement.trim()}%`);
  }

  return { clause: conditions.join(" AND "), params };
}

let conn: AsyncDuckDBConnection | null = null;
async function getConnection(): Promise<AsyncDuckDBConnection> {
  if (!conn) {
    const db = await getDB();
    conn = await db.connect();
    // L'extension "parquet" est chargée depuis un dépôt auto-hébergé dans
    // /public plutôt que depuis extensions.duckdb.org, pour que le site
    // n'ait aucune dépendance réseau tierce au moment de la recherche.
    const origin = window.location.origin;
    await conn.query(
      `SET custom_extension_repository='${origin}/duckdb-extensions-repo';`
    );
    await conn.query(`LOAD parquet;`);
  }
  return conn;
}

// Fichiers déjà enregistrés dans le système de fichiers virtuel de
// DuckDB-WASM avec le protocole HTTP explicite : c'est ce qui déclenche les
// requêtes par plage d'octets (Range) plutôt qu'un téléchargement intégral.
const partitionsEnregistrees = new Set<string>();

async function nomVirtuel(letter: string): Promise<string> {
  const virtualName = `deces-${letter}.parquet`;
  if (!partitionsEnregistrees.has(letter)) {
    const db = await getDB();
    const url = new URL(partitionUrl(letter), window.location.origin).toString();
    await db.registerFileURL(
      virtualName,
      url,
      duckdb.DuckDBDataProtocol.HTTP,
      false
    );
    partitionsEnregistrees.add(letter);
  }
  return virtualName;
}

export async function rechercher(f: Filtres): Promise<ResultatRecherche> {
  const nomUpper = f.nom.toUpperCase();
  const letter = letterForNom(nomUpper);

  const c = await getConnection();
  const virtualName = await nomVirtuel(letter);
  const { clause, params } = buildWhere(f);
  const fromClause = `read_parquet('${virtualName}')`;

  const countStmt = await c.prepare(
    `SELECT count(*) AS n FROM ${fromClause} WHERE ${clause}`
  );
  const countResult = await countStmt.query(...params);
  const total = Number(countResult.toArray()[0].n);
  await countStmt.close();

  const rowsStmt = await c.prepare(
    `SELECT ${COLONNES} FROM ${fromClause} WHERE ${clause}
     ORDER BY date_naissance ASC LIMIT 100`
  );
  const rowsResult = await rowsStmt.query(...params);
  const personnes = rowsResult.toArray().map((r) => r.toJSON() as Personne);
  await rowsStmt.close();

  return { personnes, total };
}

export function anneesGenerationPrecedente(dateNaissance: string): {
  anneeDe: string;
  anneeA: string;
} {
  const annee = parseInt(dateNaissance.slice(0, 4), 10);
  return {
    anneeDe: String(annee - 40),
    anneeA: String(annee - 20),
  };
}
