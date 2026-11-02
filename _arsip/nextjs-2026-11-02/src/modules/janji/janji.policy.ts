export interface UserSessionPayload {
  userId: string;
  role: "pasien" | "admin";
}

export function canCreateAppointment(user: UserSessionPayload): boolean {
  return user.role === "pasien";
}

export function canCancelAppointment(
  user: UserSessionPayload,
  appointmentPasienId: string
): boolean {
  if (user.role === "admin") return true;
  return user.userId === appointmentPasienId;
}

