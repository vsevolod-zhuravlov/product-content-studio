import type { AdminProduct } from "@/lib/api-types";
import type { ProductEditInput } from "@/lib/validation/product";

const SAVE_TIMEOUT_MS = 15_000;

type SaveProductFailureKind =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "too_large"
  | "server"
  | "network"
  | "timeout";

type SaveProductSuccess = {
  ok: true;
  data: AdminProduct;
};

type SaveProductFailure = {
  ok: false;
  kind: SaveProductFailureKind;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type SaveProductResult = SaveProductSuccess | SaveProductFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMessage(body: unknown, fallback: string): string {
  if (isRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
}

function readFieldErrors(body: unknown): Record<string, string[]> {
  if (!isRecord(body) || !isRecord(body.fieldErrors)) {
    return {};
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const [field, messages] of Object.entries(body.fieldErrors)) {
    if (
      Array.isArray(messages) &&
      messages.every(
        (message): message is string => typeof message === "string",
      )
    ) {
      fieldErrors[field] = messages;
    }
  }

  return fieldErrors;
}

async function safelyParseJson(response: Response): Promise<unknown> {
  try {
    return JSON.parse(await response.text()) as unknown;
  } catch {
    return undefined;
  }
}

function httpFailure(status: number, body: unknown): SaveProductFailure {
  if (status === 400) {
    return {
      ok: false,
      kind: "validation",
      message: readMessage(body, "Validation failed"),
      fieldErrors: readFieldErrors(body),
    };
  }

  const failureByStatus: Partial<
    Record<number, { kind: SaveProductFailureKind; message: string }>
  > = {
    401: { kind: "unauthorized", message: "Unauthorized" },
    404: { kind: "not_found", message: "Not found" },
    413: { kind: "too_large", message: "Payload too large" },
  };
  const failure = failureByStatus[status] ?? {
    kind: "server" as const,
    message: "Server error",
  };

  return {
    ok: false,
    kind: failure.kind,
    message: readMessage(body, failure.message),
  };
}

export async function saveProduct(
  id: string,
  input: ProductEditInput,
): Promise<SaveProductResult> {
  const controller = new AbortController();
  let didTimeout = false;
  const timeout = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, SAVE_TIMEOUT_MS);

  try {
    const response = await fetch(
      `/api/admin/products/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal,
      },
    );
    const body = await safelyParseJson(response);

    if (!response.ok) {
      return httpFailure(response.status, body);
    }

    if (!isRecord(body) || !("data" in body)) {
      return {
        ok: false,
        kind: "server",
        message: "Invalid server response",
      };
    }

    return { ok: true, data: body.data as AdminProduct };
  } catch {
    if (didTimeout) {
      return {
        ok: false,
        kind: "timeout",
        message: "Request timed out",
      };
    }

    return {
      ok: false,
      kind: "network",
      message: "Network error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
