"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { PersonneCard } from "@/components/personne-card";
import { AjouterParentDialog } from "@/components/ajouter-parent-dialog";
import type { PersonneArbre } from "@/app/lib/arbre";

function BoutonAjouterParent({
  enfant,
  role,
  onLie,
}: {
  enfant: PersonneArbre;
  role: "pere" | "mere";
  onLie: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-auto w-52 flex-col gap-1 border-dashed py-4 text-muted-foreground transition-all duration-200 hover:scale-[1.03] hover:border-foreground/30 hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <UserPlus className="size-4" />
        Ajouter {role === "pere" ? "le père" : "la mère"}
      </Button>
      <AjouterParentDialog
        enfant={enfant}
        role={role}
        open={open}
        onOpenChange={setOpen}
        onLie={onLie}
      />
    </>
  );
}

export function PedigreeNode({
  personne,
  personnes,
  onChange,
  onSupprimer,
  profondeur = 0,
}: {
  personne: PersonneArbre;
  personnes: PersonneArbre[];
  onChange: () => void;
  onSupprimer: (id: string) => void;
  profondeur?: number;
}) {
  const pere = personne.pereId
    ? personnes.find((p) => p.id === personne.pereId) ?? null
    : null;
  const mere = personne.mereId
    ? personnes.find((p) => p.id === personne.mereId) ?? null
    : null;

  // Limite raisonnable pour garder l'arbre lisible et éviter une récursion
  // sans fin en cas de donnée corrompue (boucle père/mère).
  const MAX_PROFONDEUR = 12;

  return (
    <li>
      <PersonneCard personne={personne} onSupprimer={onSupprimer} />
      {profondeur < MAX_PROFONDEUR && (
        <ul>
          <li>
            {pere ? (
              <PedigreeNode
                personne={pere}
                personnes={personnes}
                onChange={onChange}
                onSupprimer={onSupprimer}
                profondeur={profondeur + 1}
              />
            ) : (
              <BoutonAjouterParent enfant={personne} role="pere" onLie={onChange} />
            )}
          </li>
          <li>
            {mere ? (
              <PedigreeNode
                personne={mere}
                personnes={personnes}
                onChange={onChange}
                onSupprimer={onSupprimer}
                profondeur={profondeur + 1}
              />
            ) : (
              <BoutonAjouterParent enfant={personne} role="mere" onLie={onChange} />
            )}
          </li>
        </ul>
      )}
    </li>
  );
}
