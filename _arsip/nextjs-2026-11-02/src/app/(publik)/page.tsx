import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Pengelola Layanan Kesehatan Personal
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          Sistem manajemen jadwal kontrol, slot dokter, dan nomor antrian klinik terintegrasi.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/masuk"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Masuk Akun
          </Link>
          <Link
            href="/daftar"
            className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Daftar Pasien Baru
          </Link>
        </div>
      </div>
    </main>
  );
}

