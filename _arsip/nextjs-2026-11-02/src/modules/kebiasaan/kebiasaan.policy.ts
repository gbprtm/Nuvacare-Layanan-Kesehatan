export interface UserSessionPayload {
  userId: string;
  role: "pasien" | "admin";
}

export function canRecordHabits(user: UserSessionPayload): boolean {
  return user.role === "pasien";
}

