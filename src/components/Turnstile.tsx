import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

/* ============================================================
   Widget de Cloudflare Turnstile (anti-bots).
   Renderizado explícito: cargamos el script una sola vez y montamos
   el widget en un contenedor controlado por React. El token resultante
   se entrega al padre con `onVerify` y se envía al API en la cabecera
   X-Turnstile-Token. El token es de un solo uso: tras un envío fallido
   hay que reiniciar el widget (método `reset` expuesto por ref).
   ============================================================ */

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  language?: string;
  action?: string;
  size?: "normal" | "flexible" | "compact";
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: TurnstileOptions) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;

// Carga el script una sola vez aunque haya varios widgets en la página.
let scriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("No se pudo cargar Turnstile."));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export interface TurnstileHandle {
  /** Reinicia el widget para obtener un token nuevo (tras un envío fallido). */
  reset: () => void;
}

interface TurnstileProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  function Turnstile({ onVerify, onExpire, onError, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    // Guardamos los callbacks en una ref para no re-montar el widget cuando
    // el padre re-renderiza (el widget se monta una sola vez).
    const cb = useRef({ onVerify, onExpire, onError });
    cb.current = { onVerify, onExpire, onError };

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetId.current && window.turnstile) {
          window.turnstile.reset(widgetId.current);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;
      loadTurnstileScript()
        .then(() => {
          if (cancelled || widgetId.current) return;
          if (!containerRef.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(containerRef.current, {
            sitekey: SITE_KEY,
            theme: "auto",
            language: "es",
            action: "report",
            callback: (token) => cb.current.onVerify(token),
            "expired-callback": () => cb.current.onExpire?.(),
            "error-callback": () => cb.current.onError?.(),
          });
        })
        .catch(() => cb.current.onError?.());
      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current);
          widgetId.current = null;
        }
      };
    }, []);

    return <div ref={containerRef} className={className} />;
  }
);
