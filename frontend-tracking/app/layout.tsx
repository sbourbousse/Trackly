import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Suivi de livraison - Trackly",
  description: "Suivez votre livraison en temps réel avec Trackly",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
