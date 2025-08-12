import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

const Home = lazy(() => import("./pages/home"));
const Rule = lazy(() => import("./pages/rule"));
const Score = lazy(() => import("./pages/score"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rule" element={<Rule />} />
          <Route path="/score" element={<Score />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
