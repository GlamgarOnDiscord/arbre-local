import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moteur de recherche généalogique 100 % local",
  description:
    "Recherche parmi les décès enregistrés en France depuis 1970, entièrement dans votre navigateur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
