export const GATE_COOKIE = "aanavee_gate";
export const EDITOR_COOKIE = "aanavee_editor";
export const GATE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;
export const EDITOR_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type Purpose = "gate" | "editor";

const encoder = new TextEncoder();

const getSecret = (): string => {
  const secret = process.env.GATE_SECRET ?? process.env.MEMORIES_TOKEN;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    console.warn("GATE_SECRET is not set; falling back to an insecure development secret.");
  }
  return "local-development-only-secret";
};

let cachedKey: { secret: string; key: Promise<CryptoKey> } | null = null;

const getKey = (): Promise<CryptoKey> => {
  const secret = getSecret();
  if (!cachedKey || cachedKey.secret !== secret) {
    cachedKey = {
      secret,
      key: crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign", "verify"],
      ),
    };
  }
  return cachedKey.key;
};

const toBase64Url = (bytes: ArrayBuffer): string => {
  let binary = "";
  new Uint8Array(bytes).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const fromBase64Url = (value: string): Uint8Array<ArrayBuffer> | null => {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(new ArrayBuffer(binary.length));
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  } catch {
    return null;
  }
};

export const createSessionToken = async (purpose: Purpose, maxAgeSeconds: number): Promise<string> => {
  const payload = `${purpose}.${Date.now() + maxAgeSeconds * 1000}`;
  const signature = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
};

export const verifySessionToken = async (token: string | undefined, purpose: Purpose): Promise<boolean> => {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== purpose) {
    return false;
  }

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }

  const signature = fromBase64Url(parts[2]);
  if (!signature) {
    return false;
  }

  return crypto.subtle.verify("HMAC", await getKey(), signature, encoder.encode(`${parts[0]}.${parts[1]}`));
};

export const sessionCookieOptions = (maxAgeSeconds: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: maxAgeSeconds,
});
