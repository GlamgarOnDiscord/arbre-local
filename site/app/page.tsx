"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { RecherchePanel } from "@/components/recherche-panel";
import { ArbrePanel } from "@/components/arbre-panel";
import { Search, TreeDeciduous } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Moteur de recherche généalogique 100 % local
            </h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Recherche parmi les décès enregistrés en France depuis 1970.
              Toute la recherche s&apos;exécute dans votre navigateur : le nom
              que vous tapez n&apos;est envoyé à aucun serveur.
            </p>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Pour commencer, pensez à une personne de votre famille qui est
              décédée&nbsp;: un grand-parent, un arrière-grand-parent. Vous
              avez besoin de son nom, son prénom, et à peu près de son année
              de naissance.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Tabs defaultValue="recherche">
          <TabsList>
            <TabsTrigger value="recherche">
              <Search />
              Recherche
            </TabsTrigger>
            <TabsTrigger value="arbre">
              <TreeDeciduous />
              Mon arbre
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recherche" className="mt-6">
            <RecherchePanel />
          </TabsContent>
          <TabsContent value="arbre" className="mt-6">
            <ArbrePanel />
          </TabsContent>
        </Tabs>

        <footer className="mt-10 border-t pt-4 text-xs leading-relaxed text-muted-foreground/80">
          <p>
            Base des décès survenus en France depuis 1970 (INSEE /
            data.gouv.fr, Licence Ouverte 2.0). Noms de communes de décès
            résolus via le Code Officiel Géographique de l&apos;INSEE.
            Couverture : décès uniquement, pas de naissances ni de mariages.
            Les liens de parenté affichés ou ajoutés dans « Mon arbre » sont
            déduits ou saisis par vous, jamais donnés par la source.
          </p>
        </footer>
      </main>
    </div>
  );
}
