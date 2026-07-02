import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { IconCheck, IconCopy, IconX } from "./icons";

const SITE_URL = "https://civitech.online/";

export default function QRDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Cerrar con Escape y bloquear el scroll del fondo mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* sin portapapeles disponible */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pine-900/45 p-5 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-dialog-title"
    >
      <div
        className="card rise w-full max-w-sm overflow-hidden p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <span className="eyebrow">Comparte el sitio</span>
          <button
            ref={closeRef}
            onClick={onClose}
            className="btn btn-ghost -mr-2 -mt-2 h-9 w-9 rounded-full p-0"
            aria-label="Cerrar"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        <h2 id="qr-dialog-title" className="mt-2 font-display text-2xl text-ink">
          Escanea para visitarnos
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Apunta la cámara de tu teléfono al código para abrir CivicTech.
        </p>

        <div className="mt-5 flex justify-center">
          <div className="rounded-2xl border border-line bg-surface p-4">
            <QRCodeSVG
              value={SITE_URL}
              size={188}
              level="M"
              marginSize={0}
              bgColor="#ffffff"
              fgColor="#102e22"
              title="Código QR hacia civitech.online"
            />
          </div>
        </div>

        <button
          onClick={copyLink}
          className="btn btn-ghost mt-5 w-full font-mono text-sm"
        >
          {copied ? (
            <>
              <IconCheck width={18} height={18} /> ¡Enlace copiado!
            </>
          ) : (
            <>
              <IconCopy width={18} height={18} /> civitech.online
            </>
          )}
        </button>
      </div>
    </div>
  );
}
