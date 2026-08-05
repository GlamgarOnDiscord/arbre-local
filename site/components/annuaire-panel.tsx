"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, Phone, MapPin } from "lucide-react";
import {
  rechercherArchives,
  toutesLesCategories,
  type ServiceArchives,
} from "@/app/lib/annuaire";

const CATEGORIES = toutesLesCategories();

function CarteService({ service }: { service: ServiceArchives }) {
  return (
    <Card className="animate-in fade-in slide-in-from-bottom-1 gap-2 p-4 duration-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <p className="text-title">{service.nom}</p>
        <Badge variant="secondary" className="shrink-0">
          {service.categorie.replace("Archives ", "")}
        </Badge>
      </div>
      {(service.adresse || service.ville) && (
        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {[service.adresse, service.codePostal, service.ville]
              .filter(Boolean)
              .join(", ")}
          </span>
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {service.courriel && (
          <Button variant="outline" size="sm" render={
            <a href={`mailto:${service.courriel}`}>
              <Mail /> Contacter
            </a>
          } />
        )}
        {service.telephone && (
          <Button variant="ghost" size="sm" render={
            <a href={`tel:${service.telephone.replace(/\s/g, "")}`}>
              <Phone /> {service.telephone}
            </a>
          } />
        )}
        {service.site && (
          <Button variant="ghost" size="sm" render={
            <a href={service.site} target="_blank" rel="noreferrer">
              <ExternalLink /> Site
            </a>
          } />
        )}
      </div>
    </Card>
  );
}

export function AnnuairePanel() {
  const [texte, setTexte] = useState("");
  const [dept, setDept] = useState("");
  const [categorie, setCategorie] = useState("");

  const resultats = useMemo(
    () => rechercherArchives({ texte, dept, categorie }),
    [texte, dept, categorie]
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Les ~1 300 services d&apos;archives français (départementales,
        municipales, régionales, nationales) référencés par le Ministère de
        la Culture — pour trouver directement le bon contact pour vos
        demandes d&apos;actes.
      </p>

      <Card className="p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="an-texte" className="mb-1.5">
              Nom ou ville
            </Label>
            <Input
              id="an-texte"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Lyon, Rhône..."
            />
          </div>
          <div>
            <Label htmlFor="an-dept" className="mb-1.5">
              Département (code)
            </Label>
            <Input
              id="an-dept"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              placeholder="69"
              maxLength={3}
            />
          </div>
          <div>
            <Label htmlFor="an-cat" className="mb-1.5">
              Catégorie
            </Label>
            <select
              id="an-cat"
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Toutes</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <p className="text-sm text-muted-foreground">
        {resultats.length.toLocaleString("fr-FR")} service
        {resultats.length > 1 ? "s" : ""} trouvé{resultats.length > 1 ? "s" : ""}
        {resultats.length > 100 ? ", 100 affichés" : ""}.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {resultats.slice(0, 100).map((s, i) => (
          <CarteService key={`${s.nom}-${i}`} service={s} />
        ))}
      </div>
    </div>
  );
}
