export interface UserSessionPayload {
  userId: string;
  role: "pasien" | "admin";
}

export function canViewAuditLogs(user: UserSessionPayload): boolean {
  return user.role === "admin";
}

