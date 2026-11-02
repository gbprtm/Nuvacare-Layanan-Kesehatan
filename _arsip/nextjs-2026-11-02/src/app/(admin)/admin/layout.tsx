import React from "react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex">
      {/* Sidebar Admin Desktop */}
      <aside className="w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 flex flex-col p-4 space-y-6">
        <div>
          <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">
            Portal Staf Klinik
          </span>
          <h2 className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            Klinik Admin
          </h2>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            href="/admin/slot"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Manajemen Slot
          </Link>
          <Link
            href="/admin/antrian"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Antrian Pasien
          </Link>
          <Link
            href="/admin/usulan"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Usulan Jadwal
          </Link>
          <Link
            href="/admin/audit-log"
            className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Log Audit
          </Link>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

