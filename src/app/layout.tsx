import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Rye, Saira_Condensed, Special_Elite } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/SiteNav";

const rye = Rye({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rye",
});

const saira = Saira_Condensed({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-saira",
});

const typewriter = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-typewriter",
});

export const metadata: Metadata = {
  title: "O Saloon — Balcão & Preçário",
  description:
    "Sistema de pedidos e preçário do saloon: catálogo, talão com desconto e histórico de vendas.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body
        className={`${rye.variable} ${saira.variable} ${typewriter.variable} grain font-cond antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <SiteNav />
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
            {children}
          </main>
          <footer className="border-t border-line/60 py-5 text-center text-[13px] tracking-[0.25em] text-mute2 uppercase">
            O Saloon · Livro de preços digital · Venha sempre
          </footer>
        </div>
      </body>
    </html>
  );
}
