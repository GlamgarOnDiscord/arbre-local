"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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
  const sombre = monte && theme === "dark";

  return (
    <label className="flex items-center gap-2 text-label text-muted-foreground">
      <Sun className="size-3.5" />
      <Switch
        checked={sombre}
        disabled={!monte}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        aria-label="Changer de thème"
      />
      <Moon className="size-3.5" />
    </label>
  );
}
