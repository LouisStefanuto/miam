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
import { TimerProvider } from "./contexts/TimerContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SwipeBack from "./components/SwipeBack";
import MobileBottomBar from "./components/MobileBottomBar";
import CatalogLayout from "./components/CatalogLayout";
import HomePage from "./pages/HomePage";
import { useAuth } from "./contexts/AuthContext";

/** Shows HomePage for guests, CatalogLayout for authenticated users */
function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <HomePage />;
  return <CatalogLayout />;
}

const RecipeDetailPage = lazy(() => import("./pages/RecipeDetailPage"));
const CreateRecipePage = lazy(() => import("./pages/CreateRecipePage"));
const ImportOCRPage = lazy(() => import("./pages/ImportOCRPage"));
const ImportJSONPage = lazy(() => import("./pages/ImportJSONPage"));
const ImportInstagramPage = lazy(() => import("./pages/ImportInstagramPage"));
const AddRecipePage = lazy(() => import("./pages/AddRecipePage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const SharesPage = lazy(() => import("./pages/SharesPage"));
const ShareBatchPage = lazy(() => import("./pages/ShareBatchPage"));
const ShareInboxPage = lazy(() => import("./pages/ShareInboxPage"));
const ExportPage = lazy(() => import("./pages/ExportPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AlarmSoundPage = lazy(() => import("./pages/AlarmSoundPage"));
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
        <TimerProvider>
        <CatalogFilterProvider>
          <SwipeBack>
          <Suspense>
          <Routes>
            <Route path="/" element={<RootRoute />}>
              <Route index element={null} />
              <Route path="recipes/:id" element={<RecipeDetailPage />} />
              <Route path="recipes/new" element={<CreateRecipePage />} />
            </Route>
            <Route path="/add" element={<ProtectedRoute><AddRecipePage /></ProtectedRoute>} />
            <Route path="/import/ocr" element={<ProtectedRoute><ImportOCRPage /></ProtectedRoute>} />
            <Route path="/import/json" element={<ProtectedRoute><ImportJSONPage /></ProtectedRoute>} />
            <Route path="/import/instagram" element={<ProtectedRoute><ImportInstagramPage /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/shares" element={<ProtectedRoute><SharesPage /></ProtectedRoute>} />
            <Route path="/shares/batch" element={<ProtectedRoute><ShareBatchPage /></ProtectedRoute>} />
            <Route path="/shares/inbox" element={<ProtectedRoute><ShareInboxPage /></ProtectedRoute>} />
            <Route path="/export" element={<ProtectedRoute><ExportPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/settings/alarm" element={<ProtectedRoute><AlarmSoundPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <MobileBottomBar />
          </SwipeBack>
        </CatalogFilterProvider>
        </TimerProvider>
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
