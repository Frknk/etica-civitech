import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Report from "./pages/Report";
import Track from "./pages/Track";
import Learn from "./pages/Learn";
import Committee from "./pages/Committee";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
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
  );
}
