import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function PasienJanjiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pemesanan Janji Temu</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pilih dokter dan slot praktik kontrol yang tersedia.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Slot Praktik Dokter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Daftar jadwal dokter akan dimuat secara dinamis.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

