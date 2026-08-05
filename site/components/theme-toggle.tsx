"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const subscribeJamais = () => () => {};

// Évite un décalage d'hydratation : le thème réel n'est connu qu'une fois
// monté côté client (next-themes lit localStorage/preferences système).
function useMonte() {
  return useSyncExternalStore(
    subscribeJamais,
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const monte = useMonte();

  if (!monte) {
    return <Button variant="ghost" size="icon" aria-label="Changer de thème" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Changer de thème"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 scale-100 dark:scale-0 transition-transform" />
      <Moon className="absolute size-4 scale-0 dark:scale-100 transition-transform" />
    </Button>
  );
}
