"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { rechercher, type Personne, type Filtres } from "@/app/lib/search";
import { formatDateFr } from "@/app/lib/acte";
import {
  ajouterPersonne,
  lierParent,
  type PersonneArbre,
} from "@/app/lib/arbre";

const ROLE_LABEL: Record<"pere" | "mere", string> = {
  pere: "le père",
  mere: "la mère",
};

export function AjouterParentDialog({
  enfant,
  role,
  open,
  onOpenChange,
  onLie,
}: {
  enfant: PersonneArbre;
  role: "pere" | "mere";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLie: () => void;
}) {
  const anneeEnfant = enfant.dateNaissance
    ? parseInt(enfant.dateNaissance.slice(0, 4), 10)
    : undefined;

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [anneeDe, setAnneeDe] = useState(
    anneeEnfant ? String(anneeEnfant - 45) : ""
  );
  const [anneeA, setAnneeA] = useState(
    anneeEnfant ? String(anneeEnfant - 15) : ""
  );
  const [chargement, setChargement] = useState(false);
  const [resultats, setResultats] = useState<Personne[] | null>(null);

  const [mNom, setMNom] = useState("");
  const [mPrenoms, setMPrenoms] = useState("");
  const [mSexe, setMSexe] = useState("");
  const [mDateNaissance, setMDateNaissance] = useState("");
  const [mCommuneNaissance, setMCommuneNaissance] = useState("");
  const [mDateDeces, setMDateDeces] = useState("");

  async function lancerRecherche(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    setChargement(true);
    try {
      const f: Filtres = { nom, prenom, anneeDe, anneeA };
      const r = await rechercher(f);
      setResultats(r.personnes);
    } catch (err) {
      toast.error("La recherche a échoué", { description: String(err) });
    } finally {
      setChargement(false);
    }
  }

  async function choisir(p: Personne) {
    const parent = await ajouterPersonne({
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
    await lierParent(enfant.id, parent.id, role);
    toast.success(`${ROLE_LABEL[role]} ajouté(e) à l'arbre`);
    reinitialiser();
    onOpenChange(false);
    onLie();
  }

  async function ajouterManuellement(e: React.FormEvent) {
    e.preventDefault();
    if (!mNom.trim()) return;
    const parent = await ajouterPersonne({
      nom: mNom.toUpperCase(),
      prenoms: mPrenoms,
      sexe: mSexe || undefined,
      dateNaissance: mDateNaissance || undefined,
      communeNaissance: mCommuneNaissance || undefined,
      dateDeces: mDateDeces || undefined,
    });
    await lierParent(enfant.id, parent.id, role);
    toast.success(`${ROLE_LABEL[role]} ajouté(e) à l'arbre`);
    reinitialiser();
    onOpenChange(false);
    onLie();
  }

  function reinitialiser() {
    setResultats(null);
    setNom("");
    setPrenom("");
    setMNom("");
    setMPrenoms("");
    setMSexe("");
    setMDateNaissance("");
    setMCommuneNaissance("");
    setMDateDeces("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reinitialiser();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Ajouter {ROLE_LABEL[role]} de {enfant.prenoms} {enfant.nom}
          </DialogTitle>
          <DialogDescription>
            Cherchez dans la base des décès, ou saisissez les informations à
            la main si la personne n&apos;y figure pas (décès avant 1970,
            par exemple).
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
                <Label htmlFor="ap-nom" className="mb-1">
                  Nom
                </Label>
                <Input
                  id="ap-nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="DUPONT"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ap-prenom" className="mb-1">
                  Prénom
                </Label>
                <Input
                  id="ap-prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="ap-de" className="mb-1">
                    Né(e) après
                  </Label>
                  <Input
                    id="ap-de"
                    inputMode="numeric"
                    value={anneeDe}
                    onChange={(e) => setAnneeDe(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ap-a" className="mb-1">
                    avant
                  </Label>
                  <Input
                    id="ap-a"
                    inputMode="numeric"
                    value={anneeA}
                    onChange={(e) => setAnneeA(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <Button type="submit" disabled={chargement} className="w-full">
                  {chargement ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Search />
                  )}
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
                      {p.commune_naissance || p.pays_naissance || "?"} —
                      décédé(e) le {formatDateFr(p.date_deces)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manuel">
            <form onSubmit={ajouterManuellement} className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <Label htmlFor="m-nom" className="mb-1">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="m-nom"
                  value={mNom}
                  onChange={(e) => setMNom(e.target.value)}
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="m-prenoms" className="mb-1">
                  Prénoms
                </Label>
                <Input
                  id="m-prenoms"
                  value={mPrenoms}
                  onChange={(e) => setMPrenoms(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="m-sexe" className="mb-1">
                  Sexe
                </Label>
                <Input
                  id="m-sexe"
                  value={mSexe}
                  onChange={(e) => setMSexe(e.target.value.toUpperCase().slice(0, 1))}
                  placeholder="M / F"
                  maxLength={1}
                />
              </div>
              <div>
                <Label htmlFor="m-naissance" className="mb-1">
                  Naissance (AAAAMMJJ)
                </Label>
                <Input
                  id="m-naissance"
                  value={mDateNaissance}
                  onChange={(e) => setMDateNaissance(e.target.value)}
                  placeholder="19010203"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="m-commune" className="mb-1">
                  Commune de naissance
                </Label>
                <Input
                  id="m-commune"
                  value={mCommuneNaissance}
                  onChange={(e) => setMCommuneNaissance(e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="m-deces" className="mb-1">
                  Décès (AAAAMMJJ, si connu)
                </Label>
                <Input
                  id="m-deces"
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
