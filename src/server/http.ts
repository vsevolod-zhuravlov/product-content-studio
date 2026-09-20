import "server-only";
import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/api-types";
import { NotFoundError, ValidationError } from "@/server/errors";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
} as const;

export function jsonOk<T>(data: T): Response {
  return NextResponse.json(
    { data },
    {
      status: 200,
      headers: NO_STORE_HEADERS,
    },
  );
}

export function jsonError(
  status: number,
  error: string,
  fieldErrors?: Record<string, string[]>,
): Response {
  const body: ApiError =
    fieldErrors === undefined ? { error } : { error, fieldErrors };

  return NextResponse.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function handleServiceError(error: unknown): Response {
  if (error instanceof ValidationError) {
    return jsonError(400, "Validation failed", error.fieldErrors);
  }

  if (error instanceof NotFoundError) {
    return jsonError(404, "Not found");
  }

  console.error(error);
  return jsonError(500, "Internal server error");
}
