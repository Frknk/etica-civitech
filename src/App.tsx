import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";

// Cada página se carga en su propio chunk: la carga inicial solo trae la ruta
// visitada (p. ej. el panel del comité, que usa recharts, no pesa en la home).
const Home = lazy(() => import("./pages/Home"));
const Report = lazy(() => import("./pages/Report"));
const Track = lazy(() => import("./pages/Track"));
const Learn = lazy(() => import("./pages/Learn"));
const Committee = lazy(() => import("./pages/Committee"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/reportar" element={<Report />} />
          <Route path="/seguimiento" element={<Track />} />
          <Route path="/formacion" element={<Learn />} />
          <Route path="/comite" element={<Committee />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
