import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Logo";
import { currentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "COSME: the card game where you are a card",
  description: "Make your own cartoon hero card, collect packs made by kids everywhere, and battle your friends.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let signedIn = false;
  try {
    signedIn = !!(await currentUser());
  } catch {
    signedIn = false;
  }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Bungee&family=Inter:wght@400;600;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="wrap">
          <header className="site-header">
            <Link href="/" className="logo" aria-label="COSME home">
              <Logo size={44} />
              <span>COSME</span>
            </Link>
            <nav className="site-nav" aria-label="Main">
              <Link href="/#play">How to play</Link>
              <Link href="/cards">Cards</Link>
              <Link href="/play">Play</Link>
              <Link href="/vote">Vote</Link>
              <Link href="/parents">{signedIn ? "Parent area" : "Parents"}</Link>
              <Link href="/make" className="btn">Make my hero</Link>
            </nav>
          </header>
        </div>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="wrap">COSME · Created by Wyatt and Zach · <Link href="/privacy">Privacy</Link></div>
        </footer>
      </body>
    </html>
  );
}
