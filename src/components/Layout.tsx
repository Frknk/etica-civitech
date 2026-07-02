import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Logo, Sprout } from "./Brand";
import { IconQr } from "./icons";
import QRDialog from "./QRDialog";

const NAV = [
  { to: "/reportar", label: "Reportar" },
  { to: "/seguimiento", label: "Seguimiento" },
  { to: "/formacion", label: "Formación" },
  { to: "/comite", label: "Comité de ética" },
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-pine-50 text-pine-700"
                      : "text-ink-soft hover:text-pine-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="btn btn-ghost ml-1 h-10 w-10 rounded-full p-0"
              aria-label="Compartir con código QR"
            >
              <IconQr width={18} height={18} />
            </button>
            <Link to="/reportar" className="btn btn-primary ml-2 py-2.5">
              Reportar incidente
            </Link>
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              className="btn btn-ghost h-10 w-10 rounded-full p-0"
              aria-label="Compartir con código QR"
            >
              <IconQr width={18} height={18} />
            </button>
            <button
              className="btn btn-ghost px-3 py-2"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label="Abrir menú"
            >
              <span aria-hidden>{open ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {open && (
          <nav className="border-t border-line bg-paper px-5 py-3 md:hidden">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive ? "bg-pine-50 text-pine-700" : "text-ink-soft"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to="/reportar"
              onClick={() => setOpen(false)}
              className="btn btn-primary mt-2 w-full"
            >
              Reportar incidente
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-line bg-pine-900 text-pine-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Sprout />
              <span className="font-display text-lg font-semibold text-white">
                CivicTech
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-pine-200">
              Una plataforma para cultivar la integridad: reporte responsable y
              confidencial de incidentes éticos, sin enfoque punitivo.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-pine-400">
              Plataforma
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className="text-pine-200 no-underline hover:text-white"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.18em] text-pine-400">
              Proyecto
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-pine-200">
              Universidad Nacional Agraria de la Selva
              <br />
              Tingo María, Huánuco · Perú
            </p>
            <p className="mt-3 text-xs text-pine-400">
              Prototipo académico de validación. Los datos se guardan solo en
              este navegador.
            </p>
          </div>
        </div>
        <div className="border-t border-pine-700/60">
          <div className="mx-auto max-w-6xl px-5 py-4 text-xs text-pine-400">
            © 2026 CivicTech – Ética y Práctica Profesional, UNAS.
          </div>
        </div>
      </footer>

      <QRDialog open={qrOpen} onClose={() => setQrOpen(false)} />
    </div>
  );
}
