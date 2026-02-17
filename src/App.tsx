import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Navbar } from "./components/layout/Navbar";
import { PageContainer } from "./components/layout/PageContainer";
import { BrowsePage } from "./pages/BrowsePage";
import { ComparePage } from "./pages/ComparePage";
import { OptimizePage } from "./pages/OptimizePage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { useCardStore } from "./stores/useCardStore";

function App() {
  const loadBuiltinCards = useCardStore((state) => state.loadBuiltinCards);

  useEffect(() => {
    loadBuiltinCards().catch((error) => {
      console.error("Failed to load cards", error);
    });
  }, [loadBuiltinCards]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <PageContainer>
        <Routes>
          <Route path="/" element={<BrowsePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/optimize" element={<OptimizePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageContainer>
    </div>
  );
}

export default App;
