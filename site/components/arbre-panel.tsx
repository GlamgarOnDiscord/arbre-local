"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { TreeDeciduous } from "lucide-react";
import { PedigreeNode } from "@/components/pedigree-node";
import { AjouterRacineDialog } from "@/components/ajouter-racine-dialog";
import {
  chargerArbre,
  racines,
  supprimerPersonne,
  type PersonneArbre,
} from "@/app/lib/arbre";

export function ArbrePanel() {
  const [personnes, setPersonnes] = useState<PersonneArbre[] | null>(null);

  const recharger = useCallback(() => {
    chargerArbre().then(setPersonnes);
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  async function onSupprimer(id: string) {
    await supprimerPersonne(id);
    toast("Personne retirée de l'arbre");
    recharger();
  }

  if (!personnes) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Chargement de votre arbre…
      </p>
    );
  }

  const points = racines(personnes);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Votre arbre est enregistré uniquement dans ce navigateur (IndexedDB)
            — il n&apos;est jamais envoyé nulle part.
          </p>
        </div>
        <AjouterRacineDialog onAjoute={recharger} />
      </div>

      {points.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <TreeDeciduous className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Votre arbre est vide. Ajoutez un point de départ — un
            grand-parent ou un arrière-grand-parent décédé — pour commencer
            à remonter les générations.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {points.map((racine) => (
            <div key={racine.id} className="overflow-x-auto pb-4">
              <ul className="family-tree min-w-fit">
                <PedigreeNode
                  personne={racine}
                  personnes={personnes}
                  onChange={recharger}
                  onSupprimer={onSupprimer}
                />
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
