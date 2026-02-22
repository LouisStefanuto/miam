import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CatalogFilterProvider } from "./contexts/CatalogFilterContext";
import CatalogPage from "./pages/CatalogPage";

const RecipeDetailPage = lazy(() => import("./pages/RecipeDetailPage"));
const CreateRecipePage = lazy(() => import("./pages/CreateRecipePage"));
const ImportOCRPage = lazy(() => import("./pages/ImportOCRPage"));
const ImportJSONPage = lazy(() => import("./pages/ImportJSONPage"));
const ExportPage = lazy(() => import("./pages/ExportPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CatalogFilterProvider>
          <Suspense>
          <Routes>
            <Route path="/" element={<CatalogPage />} />
            <Route path="/recipes/new" element={<CreateRecipePage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route path="/import/ocr" element={<ImportOCRPage />} />
            <Route path="/import/json" element={<ImportJSONPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </CatalogFilterProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
