import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function AdminSlotPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Manajemen Slot Dokter</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Atur kuota, tanggal, dan jam praktik dokter spesialis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Praktik</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tabel jadwal praktik dokter dan ketersediaan kuota slot.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

