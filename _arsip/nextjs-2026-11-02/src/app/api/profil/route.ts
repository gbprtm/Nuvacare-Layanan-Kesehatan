import { NextResponse } from "next/server";

import { successResponse, withErrorHandler } from "@/lib/api";
import { ValidationError } from "@/lib/errors";
import { requireRole } from "@/modules/auth/guard";
import {
  attachRefreshedSessionCookie,
} from "@/modules/auth/session-token";
import {
  deleteProfil,
  deleteProfilSchema,
  getProfil,
  saveProfil,
  updateProfilSchema,
} from "@/modules/profil/profil.service";

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ValidationError("Body JSON tidak valid.");
  }
}

export async function GET(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, "pasien");
    const response = successResponse(await getProfil(session.userId));
    return attachRefreshedSessionCookie(response, session);
  })(request);
}

export async function PUT(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, "pasien");
    const input = updateProfilSchema.parse(await readJson(incomingRequest));
    const response = successResponse(await saveProfil(session.userId, input));
    return attachRefreshedSessionCookie(response, session);
  })(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return withErrorHandler(async (incomingRequest) => {
    const session = await requireRole(incomingRequest, "pasien");
    deleteProfilSchema.parse(await readJson(incomingRequest));
    await deleteProfil(session.userId);
    const response = new NextResponse(null, { status: 204 });
    return attachRefreshedSessionCookie(response, session);
  })(request);
}
