import { Link } from "react-router-dom";

export function Sprout({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      role="img"
    >
      <rect width="32" height="32" rx="8" fill="#17503A" />
      <path d="M16 25v-9" stroke="#E8EFE8" strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M16 17c0-3.2-2.4-5.4-6-5.6 0 3.4 2.2 5.6 6 5.6Z"
        fill="#3FA66A"
      />
      <path
        d="M16 15.5c0-3 2.2-5.2 5.6-5.4 0 3.2-2.1 5.4-5.6 5.4Z"
        fill="#E0A33E"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <Link
      to="/"
      className="flex items-center gap-2.5 no-underline"
      aria-label="CivicTech – Ética Profesional, inicio"
    >
      <Sprout />
      <span className="leading-none">
        <span className="block font-display text-[1.18rem] font-semibold text-ink">
          CivicTech
        </span>
        <span className="block font-mono text-[0.6rem] uppercase tracking-[0.22em] text-pine-600">
          Ética Profesional
        </span>
      </span>
    </Link>
  );
}
