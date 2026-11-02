import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function PasienNotifikasiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pemberitahuan</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pesan usulan jadwal atau info penting dari klinik.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kotak Masuk</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tidak ada notifikasi baru saat ini.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

