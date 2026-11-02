import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/masuk/route";
import { GET as getSlots } from "@/app/api/slot/route";
import { GET as getJanji, POST as postJanji } from "@/app/api/janji/route";
import { PATCH as cancelJanji } from "@/app/api/janji/[id]/route";
import { client, db } from "@/lib/db";
import { dokter, janji, slot } from "@/db/schema/klinik";
import { sessions, users } from "@/db/schema/auth";
import { hashPassword } from "@/modules/auth/password";
import { SESSION_COOKIE_NAME } from "@/modules/auth/session-token";

const suffix = randomUUID();
const password = "kata-sandi-janji-123";
const emailA = `b03.a.${suffix}@example.test`;
const emailB = `b03.b.${suffix}@example.test`;
const tanggal = "2099-12-31";
let userAId: string | undefined;
let userBId: string | undefined;
let dokterId: string | undefined;
let slotId: string | undefined;

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

function postRequest(cookie: string): Request {
  return request("http://localhost/api/janji", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ slotId }),
  });
}

beforeAll(async () => {
  const passwordHash = await hashPassword(password);
  const createdUsers = await db
    .insert(users)
    .values([
      { name: "Pasien B03 A", email: emailA, passwordHash, role: "pasien" },
      { name: "Pasien B03 B", email: emailB, passwordHash, role: "pasien" },
    ])
    .returning({ id: users.id, email: users.email });
  userAId = createdUsers.find((user) => user.email === emailA)?.id;
  userBId = createdUsers.find((user) => user.email === emailB)?.id;
  if (!userAId || !userBId) throw new Error("Fixture pasien B03 gagal dibuat.");

  const [doctor] = await db
    .insert(dokter)
    .values({
      nama: `dr. B03 ${suffix}`,
      spesialisasi: "Penyakit Dalam",
      nomorIzin: `SIP-B03-${suffix}`,
      aktif: true,
    })
    .returning({ id: dokter.id });
  if (!doctor) throw new Error("Fixture dokter B03 gagal dibuat.");
  dokterId = doctor.id;

  const [practiceSlot] = await db
    .insert(slot)
    .values({
      dokterId,
      tanggal,
      jamMulai: "08:00",
      jamSelesai: "09:00",
      kuota: 1,
      tersedia: true,
    })
    .returning({ id: slot.id });
  if (!practiceSlot) throw new Error("Fixture slot B03 gagal dibuat.");
  slotId = practiceSlot.id;
});

afterAll(async () => {
  if (slotId) await db.delete(janji).where(eq(janji.slotId, slotId));
  if (slotId) await db.delete(slot).where(eq(slot.id, slotId));
  if (dokterId) await db.delete(dokter).where(eq(dokter.id, dokterId));
  if (userAId) {
    await db.delete(sessions).where(eq(sessions.userId, userAId));
    await db.delete(users).where(eq(users.id, userAId));
  }
  if (userBId) {
    await db.delete(sessions).where(eq(sessions.userId, userBId));
    await db.delete(users).where(eq(users.id, userBId));
  }
  await client.end({ timeout: 5 });
});

describe("B03 slot dan janji dengan PostgreSQL", () => {
  it("menolak tamu dan membuktikan satu pemenang pada rebutan slot", async () => {
    const guest = await postJanji(
      request("http://localhost/api/janji", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId: randomUUID() }),
      })
    );
    expect(guest.status).toBe(401);

    const cookieA = await loginAs(emailA);
    const cookieB = await loginAs(emailB);
    const available = await getSlots(
      request(`http://localhost/api/slot?tanggal=${tanggal}`, { headers: { cookie: cookieA } })
    );
    expect(available.status).toBe(200);
    expect((await available.json()).data).toHaveLength(1);

    const outcomes = await Promise.all([postJanji(postRequest(cookieA)), postJanji(postRequest(cookieB))]);
    expect(outcomes.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it("menampilkan janji hanya kepada pemilik dan membatalkan dengan alasan", async () => {
    const cookieA = await loginAs(emailA);
    const cookieB = await loginAs(emailB);
    const own = await getJanji(request("http://localhost/api/janji", { headers: { cookie: cookieA } }));
    const other = await getJanji(request("http://localhost/api/janji", { headers: { cookie: cookieB } }));
    expect(own.status).toBe(200);
    expect(other.status).toBe(200);
    expect((await own.json()).data).toHaveLength(1);
    expect((await other.json()).data).toHaveLength(0);

    const [appointment] = await db.select({ id: janji.id }).from(janji).where(eq(janji.pasienId, userAId as string));
    if (!appointment) throw new Error("Janji fixture tidak ditemukan.");

    const cancelled = await cancelJanji(
      request(`http://localhost/api/janji/${appointment.id}`, {
        method: "PATCH",
        headers: { cookie: cookieA, "content-type": "application/json" },
        body: JSON.stringify({ alasan: "Ada keperluan lain" }),
      }),
      { params: Promise.resolve({ id: appointment.id }) }
    );
    expect(cancelled.status).toBe(200);
    expect((await cancelled.json()).data.status).toBe("dibatalkan");
  });
});
