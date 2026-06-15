import { Link } from "react-router-dom";
import { Sprout } from "../components/Brand";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-xl place-items-center px-5 py-24 text-center">
      <Sprout size={48} />
      <h1 className="mt-6 text-4xl">Esta página aún no germina</h1>
      <p className="mt-3 text-ink-soft">
        No encontramos lo que buscas. Volvamos a un lugar seguro.
      </p>
      <Link to="/" className="btn btn-primary mt-7">
        Ir al inicio
      </Link>
    </div>
  );
}
