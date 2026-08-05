"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Search } from "lucide-react";
import { rechercher, type Personne, type Filtres } from "@/app/lib/search";
import { formatDateFr } from "@/app/lib/acte";
import { ajouterPersonne } from "@/app/lib/arbre";

export function AjouterRacineDialog({ onAjoute }: { onAjoute: () => void }) {
  const [open, setOpen] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<Personne[] | null>(null);

  const [mNom, setMNom] = useState("");
  const [mPrenoms, setMPrenoms] = useState("");
  const [mDateNaissance, setMDateNaissance] = useState("");
  const [mCommuneNaissance, setMCommuneNaissance] = useState("");
  const [mDateDeces, setMDateDeces] = useState("");

  function reinitialiser() {
    setResultats(null);
    setNom("");
    setPrenom("");
    setMNom("");
    setMPrenoms("");
    setMDateNaissance("");
    setMCommuneNaissance("");
    setMDateDeces("");
  }

  async function lancerRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setChargement(true);
    try {
      const f: Filtres = { nom, prenom };
      const r = await rechercher(f);
      setResultats(r.personnes);
    } catch (err) {
      toast.error("La recherche a échoué", { description: String(err) });
    } finally {
      setChargement(false);
    }
  }

  async function choisir(p: Personne) {
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
    toast.success("Ajouté(e) à l'arbre");
    reinitialiser();
    setOpen(false);
    onAjoute();
  }

  async function ajouterManuellement(e: React.FormEvent) {
    e.preventDefault();
    if (!mNom.trim()) return;
    await ajouterPersonne({
      nom: mNom.toUpperCase(),
      prenoms: mPrenoms,
      dateNaissance: mDateNaissance || undefined,
      communeNaissance: mCommuneNaissance || undefined,
      dateDeces: mDateDeces || undefined,
    });
    toast.success("Ajouté(e) à l'arbre");
    reinitialiser();
    setOpen(false);
    onAjoute();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reinitialiser();
        setOpen(v);
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus />
            Nouveau point de départ
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter un point de départ</DialogTitle>
          <DialogDescription>
            Une personne décédée que vous connaissez : un grand-parent, un
            arrière-grand-parent. Vous pourrez ensuite remonter ses parents
            génération après génération.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="recherche">
          <TabsList className="w-full">
            <TabsTrigger value="recherche" className="flex-1">
              Rechercher
            </TabsTrigger>
            <TabsTrigger value="manuel" className="flex-1">
              Saisie manuelle
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recherche" className="space-y-3">
            <form onSubmit={lancerRecherche} className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="ar-nom" className="mb-1">
                  Nom
                </Label>
                <Input
                  id="ar-nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="DUPONT"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ar-prenom" className="mb-1">
                  Prénom
                </Label>
                <Input
                  id="ar-prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" disabled={chargement} className="w-full">
                  {chargement ? <Loader2 className="animate-spin" /> : <Search />}
                  Rechercher
                </Button>
              </div>
            </form>

            {resultats && (
              <div className="max-h-64 space-y-1.5 overflow-y-auto">
                {resultats.length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Aucun résultat.
                  </p>
                )}
                {resultats.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => choisir(p)}
                    className="min-h-10 w-full rounded-lg border bg-card px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span className="font-medium">
                      {p.nom} {p.prenoms}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      né(e) le {formatDateFr(p.date_naissance)} à{" "}
                      {p.commune_naissance || p.pays_naissance || "?"} — décédé(e)
                      le {formatDateFr(p.date_deces)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manuel">
            <form onSubmit={ajouterManuellement} className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="rm-nom" className="mb-1">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rm-nom"
                  value={mNom}
                  onChange={(e) => setMNom(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="rm-prenoms" className="mb-1">
                  Prénoms
                </Label>
                <Input
                  id="rm-prenoms"
                  value={mPrenoms}
                  onChange={(e) => setMPrenoms(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rm-naissance" className="mb-1">
                  Naissance (AAAAMMJJ)
                </Label>
                <Input
                  id="rm-naissance"
                  value={mDateNaissance}
                  onChange={(e) => setMDateNaissance(e.target.value)}
                  placeholder="19010203"
                />
              </div>
              <div>
                <Label htmlFor="rm-commune" className="mb-1">
                  Commune de naissance
                </Label>
                <Input
                  id="rm-commune"
                  value={mCommuneNaissance}
                  onChange={(e) => setMCommuneNaissance(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="rm-deces" className="mb-1">
                  Décès (AAAAMMJJ, si connu)
                </Label>
                <Input
                  id="rm-deces"
                  value={mDateDeces}
                  onChange={(e) => setMDateDeces(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  Ajouter à l&apos;arbre
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
