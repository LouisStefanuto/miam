import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CatalogFilterProvider } from "./contexts/CatalogFilterContext";
import CatalogPage from "./pages/CatalogPage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import CreateRecipePage from "./pages/CreateRecipePage";
import ImportOCRPage from "./pages/ImportOCRPage";
import ImportJSONPage from "./pages/ImportJSONPage";
import ExportPage from "./pages/ExportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CatalogFilterProvider>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/recipes/new" element={<CreateRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/import" element={<ImportOCRPage />} />
            <Route path="/import/json" element={<ImportJSONPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CatalogFilterProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
