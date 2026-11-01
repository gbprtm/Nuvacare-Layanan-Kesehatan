import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE as deleteProfilRoute, GET as getProfilRoute, PUT as putProfilRoute } from "@/app/api/profil/route";
import { POST as login } from "@/app/api/auth/masuk/route";
import { client, db } from "@/lib/db";
import { obatPasien, profil } from "@/db/schema/pasien";
import { sessions, users } from "@/db/schema/auth";
import { hashPassword } from "@/modules/auth/password";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-token";

const suffix = randomUUID();
const password = "kata-sandi-profil-123";
const emailA = `b02.a.${suffix}@example.test`;
const emailB = `b02.b.${suffix}@example.test`;
let userAId: string | undefined;
let userBId: string | undefined;

const request = (url: string, init?: RequestInit) => new Request(url, init);

function cookieFrom(response: Response): string {
  const pair = response.headers.get("set-cookie")?.split(";")[0] ?? "";
  if (!pair.startsWith(`${SESSION_COOKIE_NAME}=`)) throw new Error("Cookie sesi tidak ditemukan.");
  return pair;
}

async function loginAs(email: string): Promise<string> {
  const response = await login(
    request("http://localhost/api/auth/masuk", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  expect(response.status).toBe(200);
  return cookieFrom(response);
}

beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const created = await db
    .insert(users)
    .values([
      { name: "Pasien B02 A", email: emailA, passwordHash, role: "pasien" },
      { name: "Pasien B02 B", email: emailB, passwordHash, role: "pasien" },
    ])
    .returning({ id: users.id, email: users.email });

  userAId = created.find((user) => user.email === emailA)?.id;
  userBId = created.find((user) => user.email === emailB)?.id;
  if (!userAId || !userBId) throw new Error("Fixture pasien B02 gagal dibuat.");
});

afterAll(async () => {
  if (userAId) {
    await db.delete(profil).where(eq(profil.userId, userAId));
    await db.delete(sessions).where(eq(sessions.userId, userAId));
    await db.delete(users).where(eq(users.id, userAId));
  }
  if (userBId) {
    await db.delete(profil).where(eq(profil.userId, userBId));
    await db.delete(sessions).where(eq(sessions.userId, userBId));
    await db.delete(users).where(eq(users.id, userBId));
  }
  await client.end({ timeout: 5 });
});

describe("B02 profil kesehatan pasien dengan PostgreSQL", () => {
  it("menolak tamu dan menolak field identitas kependudukan", async () => {
    const guest = await getProfilRoute(request("http://localhost/api/profil"));
    expect(guest.status).toBe(401);

    const cookie = await loginAs(emailA);
    const response = await putProfilRoute(
      request("http://localhost/api/profil", {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ nik: "3171000000000001" }),
      })
    );

    expect(response.status).toBe(422);
  });

  it("menyimpan dan membaca kembali profil milik pasien yang sama", async () => {
    const cookie = await loginAs(emailA);
    const input = {
      nomorTelepon: "081200000001",
      tanggalLahir: "1985-04-12",
      jenisKelamin: "laki_laki",
      golonganDarah: "O",
      tinggiBadan: 170,
      beratBadan: 72,
      kondisiKesehatan: "hipertensi",
      riwayatAlergi: "penisilin",
      kontakDaruratNama: "Kontak B02",
      kontakDaruratTelepon: "081200000002",
    };

    const saved = await putProfilRoute(
      request("http://localhost/api/profil", {
        method: "PUT",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify(input),
      })
    );
    expect(saved.status).toBe(200);
    expect((await saved.json()).data).toMatchObject(input);

    await db.insert(obatPasien).values({
      pasienId: userAId as string,
      namaObat: "abakavir",
      namaInternasional: "abacavir",
      dosisCatatan: "Sesuai resep dokter",
      sumber: "dilaporkan_pasien",
    });

    const read = await getProfilRoute(request("http://localhost/api/profil", { headers: { cookie } }));
    expect(read.status).toBe(200);
    const readBody = (await read.json()) as {
      data: typeof input & { obat: Array<{ namaObat: string; sumber: string }> };
    };
    expect(readBody.data).toMatchObject(input);
    expect(readBody.data.obat).toEqual([
      expect.objectContaining({ namaObat: "abakavir", sumber: "dilaporkan_pasien" }),
    ]);
  });

  it("mengisolasi profil pasien lain dan menghapus dengan konfirmasi", async () => {
    const cookieA = await loginAs(emailA);
    const cookieB = await loginAs(emailB);

    const responseB = await getProfilRoute(
      request("http://localhost/api/profil", { headers: { cookie: cookieB } })
    );
    expect(responseB.status).toBe(200);
    expect((await responseB.json()).data).toBeNull();

    const invalidDelete = await deleteProfilRoute(
      request("http://localhost/api/profil", {
        method: "DELETE",
        headers: { cookie: cookieA, "content-type": "application/json" },
        body: JSON.stringify({ konfirmasi: false }),
      })
    );
    expect(invalidDelete.status).toBe(422);

    const deleted = await deleteProfilRoute(
      request("http://localhost/api/profil", {
        method: "DELETE",
        headers: { cookie: cookieA, "content-type": "application/json" },
        body: JSON.stringify({ konfirmasi: true }),
      })
    );
    expect(deleted.status).toBe(204);

    const afterDelete = await getProfilRoute(
      request("http://localhost/api/profil", { headers: { cookie: cookieA } })
    );
    expect(afterDelete.status).toBe(200);
    expect((await afterDelete.json()).data).toBeNull();
  });
});
