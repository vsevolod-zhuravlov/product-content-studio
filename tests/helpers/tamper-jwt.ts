const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function jwtParts(token: string): [string, string, string] {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error("Expected a three-segment JWT.");
  }

  return [parts[0], parts[1], parts[2]];
}

export function decodeJwtSignature(token: string): Buffer {
  const [, , signature] = jwtParts(token);
  const bytes = Buffer.from(signature, "base64url");

  if (bytes.length === 0) {
    throw new Error("JWT signature is empty.");
  }

  return bytes;
}

/**
 * Corrupt a character in the middle of the JWT signature so the decoded
 * signature bytes always change (unlike flipping the last base64url char,
 * which may only touch unused padding bits).
 */
export function tamperJwt(token: string): string {
  const [header, payload, signature] = jwtParts(token);
  const originalBytes = Buffer.from(signature, "base64url");
  const index = Math.floor(signature.length / 2);
  const originalChar = signature[index]!;
  const replacement = BASE64URL_ALPHABET.split("").find(
    (character) => character !== originalChar,
  );

  if (!replacement) {
    throw new Error("Could not pick a different base64url character.");
  }

  const tamperedSignature = `${signature.slice(0, index)}${replacement}${signature.slice(index + 1)}`;
  const tampered = `${header}.${payload}.${tamperedSignature}`;
  const tamperedBytes = Buffer.from(tamperedSignature, "base64url");

  if (tampered === token) {
    throw new Error("Tampered token equals the original token.");
  }

  if (originalBytes.equals(tamperedBytes)) {
    throw new Error("Tampered signature decodes to the same bytes.");
  }

  return tampered;
}
