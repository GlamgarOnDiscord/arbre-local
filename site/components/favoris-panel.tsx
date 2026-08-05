"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bookmark, TreePine, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateFr } from "@/app/lib/acte";
import { resoudreCommune } from "@/app/lib/communes";
import { ajouterPersonne } from "@/app/lib/arbre";
import {
  chargerFavoris,
  supprimerFavori,
  noterFavori,
  type Favori,
} from "@/app/lib/favoris";

function LigneFavori({
  favori,
  onChange,
}: {
  favori: Favori;
  onChange: () => void;
}) {
  const [note, setNote] = useState(favori.note ?? "");

  async function enregistrerNote() {
    if (note === (favori.note ?? "")) return;
    await noterFavori(favori.id, note);
  }

  async function supprimer() {
    await supprimerFavori(favori.id);
    toast("Retiré des favoris");
    onChange();
  }

  async function ajouterALarbre() {
    await ajouterPersonne({
      nom: favori.nom,
      prenoms: favori.prenoms,
      sexe: favori.sexe,
      dateNaissance: favori.dateNaissance,
      communeNaissance: favori.communeNaissance,
      codeInseeNaissance: favori.codeInseeNaissance,
      dateDeces: favori.dateDeces,
      codeInseeDeces: favori.codeInseeDeces,
      numeroActeDeces: favori.numeroActeDeces,
    });
    toast.success("Ajouté(e) à l'arbre", {
      description: `${favori.nom} ${favori.prenoms} — voir l'onglet « Mon arbre ».`,
    });
  }

  const communeDeces = resoudreCommune(favori.codeInseeDeces);

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-1 gap-3 p-4 duration-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-title">
            {favori.nom} {favori.prenoms}
          </p>
          <p className="text-body text-muted-foreground">
            Né(e) le {formatDateFr(favori.dateNaissance)}
            {favori.communeNaissance ? ` à ${favori.communeNaissance}` : ""} —
            décédé(e) le {formatDateFr(favori.dateDeces)}
            {communeDeces ? ` à ${communeDeces}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Ajouter à l'arbre"
            onClick={ajouterALarbre}
          >
            <TreePine />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            title="Retirer des favoris"
            onClick={supprimer}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <Input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={enregistrerNote}
        placeholder="Note (piste à vérifier, source, hypothèse...)"
        className="text-sm"
      />
    </Card>
  );
}

export function FavorisPanel() {
  const [favoris, setFavoris] = useState<Favori[] | null>(null);

  const recharger = useCallback(() => {
    chargerFavoris().then((f) =>
      setFavoris([...f].sort((a, b) => b.ajouteLe - a.ajouteLe))
    );
  }, []);

  useEffect(() => {
    recharger();
  }, [recharger]);

  if (!favoris) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Chargement de vos favoris…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Des résultats mis de côté depuis la recherche, pour vérification
        ultérieure — sans les ajouter formellement à l&apos;arbre. Stockés
        uniquement dans ce navigateur.
      </p>

      {favoris.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Bookmark className="size-8 text-muted-foreground" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Aucun favori pour l&apos;instant. Depuis l&apos;onglet
            Recherche, cliquez sur l&apos;étoile d&apos;un résultat pour le
            garder de côté.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoris.map((f) => (
            <LigneFavori key={f.id} favori={f} onChange={recharger} />
          ))}
        </div>
      )}
    </div>
  );
}
