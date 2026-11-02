export interface UserSessionPayload {
  userId: string;
  role: "pasien" | "admin";
}

export function canReadNotification(
  user: UserSessionPayload,
  notificationOwnerId: string
): boolean {
  if (user.role === "admin") return true;
  return user.userId === notificationOwnerId;
}

