import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function PasienBerandaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dasbor Pasien</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ringkasan jadwal kontrol dan status kesehatan harian Anda.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jadwal Kontrol Terdekat</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Belum ada jadwal kontrol aktif. Pesan jadwal baru lewat menu Janji Temu.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

