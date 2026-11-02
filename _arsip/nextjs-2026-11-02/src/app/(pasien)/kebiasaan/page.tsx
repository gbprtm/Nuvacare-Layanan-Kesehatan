import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function PasienKebiasaanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Catatan Kebiasaan Harian</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pencatatan hidrasi minum air dan durasi jam tidur harian.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Hari Ini</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Form pencatatan kebiasaan harian pasien.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

