/* ============================================================
   Autenticación del comité de ética.
   El panel del comité y la acción de avanzar un reporte exponen
   datos confidenciales, por lo que requieren una clave compartida
   guardada como secreto del Worker (COMMITTEE_KEY).
   El reportante NO necesita autenticarse: su código de seguimiento
   confidencial es su única llave.
   ============================================================ */

/** Comparación en tiempo constante para no filtrar la clave por timing. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ba = enc.encode(a);
  const bb = enc.encode(b);
  // Compara siempre sobre la longitud máxima; un desajuste de longitud
  // cuenta como diferencia pero no provoca salida temprana.
  let diff = ba.length ^ bb.length;
  const len = Math.max(ba.length, bb.length);
  for (let i = 0; i < len; i++) diff |= (ba[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

/** Extrae el token «Bearer <clave>» de una cabecera Authorization. */
function bearer(authHeader: string | null | undefined): string | null {
  const match = /^Bearer\s+(.+)$/i.exec(authHeader ?? "");
  return match ? match[1] : null;
}

/**
 * Valida la clave del comité. `expected` es el secreto del Worker; si no
 * está configurado, se deniega el acceso (fail-closed) en lugar de abrirlo.
 */
export function isCommittee(
  authHeader: string | null | undefined,
  expected: string | undefined
): boolean {
  if (!expected) return false;
  const token = bearer(authHeader);
  return token !== null && safeEqual(token, expected);
}
