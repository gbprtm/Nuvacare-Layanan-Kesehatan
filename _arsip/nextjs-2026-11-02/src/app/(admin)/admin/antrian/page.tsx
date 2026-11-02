import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function AdminAntrianPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Antrian Pasien</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pemanggilan giliran, check-in, dan transisi status pemeriksaan pasien hari ini.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Antrian Klinik</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tabel antrian real-time pasien kontrol hipertensi.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

