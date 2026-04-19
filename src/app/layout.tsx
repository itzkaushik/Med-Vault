import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "MedVault — MBBS Study Knowledge Base",
  description:
    "Organize your medical studies with intelligent note-taking, bidirectional linking, and an embedded AI co-pilot. Built for MBBS students.",
  keywords: ["MBBS", "medical notes", "study app", "knowledge base", "anatomy", "pharmacology"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        <div className="bg-mesh" />
        <div className="relative z-10 flex h-screen overflow-hidden">
          <StoreProvider>{children}</StoreProvider>
        </div>
      </body>
    </html>
  );
}
