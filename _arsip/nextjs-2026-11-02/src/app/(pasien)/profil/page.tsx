import { Card, CardHeader, CardTitle, CardContent } from "@/components/card";

export default function PasienProfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil Kesehatan</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Informasi data pribadi dan riwayat riwayat kesehatan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pribadi Pasien</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Data profil terhubung dengan rekam medis kontrol klinik.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

