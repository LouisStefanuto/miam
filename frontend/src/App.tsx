import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { CatalogFilterProvider } from "./contexts/CatalogFilterContext";
import { AccentColorProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import CatalogPage from "./pages/CatalogPage";
import LoginPage from "./pages/LoginPage";

const RecipeDetailPage = lazy(() => import("./pages/RecipeDetailPage"));
const CreateRecipePage = lazy(() => import("./pages/CreateRecipePage"));
const ImportOCRPage = lazy(() => import("./pages/ImportOCRPage"));
const ImportJSONPage = lazy(() => import("./pages/ImportJSONPage"));
const ExportPage = lazy(() => import("./pages/ExportPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const GOOGLE_CLIENT_ID =
  (window as any).__RUNTIME_CONFIG__?.VITE_GOOGLE_CLIENT_ID ||
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5min
    },
  },
});

const App = () => (
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" storageKey="miam-mode">
    <AccentColorProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <CartProvider>
        <CatalogFilterProvider>
          <Suspense>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><CatalogPage /></ProtectedRoute>} />
            <Route path="/recipes/new" element={<ProtectedRoute><CreateRecipePage /></ProtectedRoute>} />
            <Route path="/recipes/:id" element={<ProtectedRoute><RecipeDetailPage /></ProtectedRoute>} />
            <Route path="/import/ocr" element={<ProtectedRoute><ImportOCRPage /></ProtectedRoute>} />
            <Route path="/import/json" element={<ProtectedRoute><ImportJSONPage /></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </CatalogFilterProvider>
        </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </AccentColorProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
