/* ============================================================
   Verificación de Cloudflare Turnstile (siteverify del servidor).
   El widget del cliente genera un token de un solo uso; aquí se
   valida contra el endpoint de Cloudflare usando el secreto del
   Worker (TURNSTILE_SECRET_KEY). Si el secreto no está configurado
   se deniega (fail-closed), igual que la clave del comité en auth.ts.
   ============================================================ */

const SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
}

/**
 * Valida un token de Turnstile. Devuelve `true` solo si Cloudflare
 * confirma que el reto se resolvió. Cualquier fallo (sin secreto, sin
 * token, error de red o respuesta negativa) se trata como no válido.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  secret: string | undefined,
  remoteip?: string | null
): Promise<boolean> {
  if (!secret || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);
  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteverifyResponse;
    return data.success === true;
  } catch {
    return false;
  }
}
