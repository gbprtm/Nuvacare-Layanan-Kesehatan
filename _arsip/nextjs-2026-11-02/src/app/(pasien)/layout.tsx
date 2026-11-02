import React from "react";
import Link from "next/link";

export default function PasienLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link href="/beranda" className="text-lg font-bold tracking-tight text-blue-600 dark:text-blue-400">
            Klinik Sehat
          </Link>
          <nav className="flex space-x-3 text-sm">
            <Link href="/beranda" className="hover:text-blue-600">Beranda</Link>
            <Link href="/janji" className="hover:text-blue-600">Janji</Link>
            <Link href="/antrian" className="hover:text-blue-600">Antrian</Link>
            <Link href="/profil" className="hover:text-blue-600">Profil</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-lg p-4 pb-20">
        {children}
      </main>
    </div>
  );
}

