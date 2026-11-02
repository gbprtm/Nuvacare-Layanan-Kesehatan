import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catatan Riwayat Staf (Audit Log)</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Riwayat append-only untuk seluruh aksi pengubahan jadwal, status antrian, dan resep.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Aktivitas Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Daftar audit log tidak dapat diubah maupun dimanipulasi untuk transparansi klinik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

