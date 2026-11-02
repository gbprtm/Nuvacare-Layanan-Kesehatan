export interface UserSessionPayload {
  userId: string;
  role: "pasien" | "admin";
}

export function canUpdateQueueStatus(user: UserSessionPayload): boolean {
  return user.role === "admin";
}

export function canViewQueueTicket(
  user: UserSessionPayload,
  ticketPasienId: string
): boolean {
  if (user.role === "admin") return true;
  return user.userId === ticketPasienId;
}

