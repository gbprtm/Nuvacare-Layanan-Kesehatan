import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function AdminUsulanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usulan Perubahan Jadwal</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Form pengajuan pemindahan atau pembatalan jadwal kontrol pasien disertai alasan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengajuan Usulan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Tabel status usulan perubahan jadwal yang menunggu konfirmasi pasien.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

