"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import type { PersonneArbre } from "@/app/lib/arbre";
import { formatDateFr } from "@/app/lib/acte";

export function PersonneCard({
  personne,
  onSupprimer,
}: {
  personne: PersonneArbre;
  onSupprimer: (id: string) => void;
}) {
  const dates = [
    personne.dateNaissance ? formatDateFr(personne.dateNaissance) : "?",
    personne.dateDeces ? formatDateFr(personne.dateDeces) : "?",
  ].join(" – ");

  return (
    <Card className="animate-in fade-in zoom-in-95 w-52 gap-2 px-3 py-3 text-left shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium leading-tight">{personne.nom}</p>
          <p className="truncate text-xs text-muted-foreground leading-tight">
            {personne.prenoms || "?"}
          </p>
        </div>
        {personne.sexe && (
          <Badge variant="secondary" className="shrink-0 px-1.5 text-[10px]">
            {personne.sexe}
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{dates}</p>
      {personne.communeNaissance && (
        <p className="truncate text-xs text-muted-foreground">
          né(e) à {personne.communeNaissance}
        </p>
      )}
      <div className="flex justify-end">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onSupprimer(personne.id)}
                aria-label="Retirer de l'arbre"
              >
                <Trash2 />
              </Button>
            }
          />
          <TooltipContent>Retirer de l&apos;arbre</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  );
}
