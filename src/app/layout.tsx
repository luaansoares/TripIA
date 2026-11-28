
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/contexts/ThemeContext";

import "./globals.css";
import "leaflet/dist/leaflet.css";

import { IdiomaProvider } from "@/contexts/IdiomaContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripIA | Planeje. Explore. Viaje.",
  description:
    "Planeje suas viagens com inteligência artificial. Descubra destinos, monte roteiros e explore o mundo com o TripIA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <IdiomaProvider>
    <ThemeProvider>
        {children}
    </ThemeProvider>
</IdiomaProvider>
      </body>
    </html>
  );
}
