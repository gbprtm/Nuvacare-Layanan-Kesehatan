import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";
import { Badge } from "@/components/badge";

export default function PasienAntrianPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nomor Antrian Hari Ini</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Pantau status antrian dan panggilan giliran secara langsung.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status Antrian</CardTitle>
            <Badge variant="info">Belum Check-In</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Lakukan konfirmasi kedatangan di klinik untuk mendapatkan nomor antrian final.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

