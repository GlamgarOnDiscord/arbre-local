import * as duckdb from "@duckdb/duckdb-wasm";

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

// Bundles servis depuis /public/duckdb (mêmes fichiers que la CDN jsDelivr),
// pour ne dépendre d'aucun service tiers au moment de la recherche.
// URLs absolues : le worker interne (chargé depuis un blob:) résout les
// chemins relatifs par rapport à son propre contexte, pas à la page.
function manualBundles(): duckdb.DuckDBBundles {
  const origin = window.location.origin;
  return {
    mvp: {
      mainModule: `${origin}/duckdb/duckdb-mvp.wasm`,
      mainWorker: `${origin}/duckdb/duckdb-browser-mvp.worker.js`,
    },
    eh: {
      mainModule: `${origin}/duckdb/duckdb-eh.wasm`,
      mainWorker: `${origin}/duckdb/duckdb-browser-eh.worker.js`,
    },
  };
}

async function createDB(): Promise<duckdb.AsyncDuckDB> {
  const bundle = await duckdb.selectBundle(manualBundles());

  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(workerUrl);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  await db.open({
    filesystem: {
      reliableHeadRequests: true,
      allowFullHTTPReads: true,
    },
  });

  return db;
}

// Initialise DuckDB-WASM une seule fois, dès le chargement de la page
// (et non à la première recherche) pour éviter un premier délai visible.
export function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (!dbPromise) {
    dbPromise = createDB();
  }
  return dbPromise;
}

export function letterForNom(nomUpper: string): string {
  const first = nomUpper.charAt(0);
  return first >= "A" && first <= "Z" ? first : "AUTRE";
}

export function partitionUrl(letter: string): string {
  // Encodage explicite : "lettre=B" contient un signe "=" qui doit rester
  // littéral dans le chemin (le dossier Hive-partitioning généré par DuckDB).
  return `/parts/lettre=${encodeURIComponent(letter)}/data.parquet`;
}
