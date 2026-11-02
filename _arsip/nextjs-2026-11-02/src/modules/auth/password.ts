import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Mengenkripsi kata sandi menggunakan bcryptjs dengan 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Membandingkan kata sandi teks biasa dengan hash kata sandi tersimpan.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
