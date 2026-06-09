import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import Catalogue from "./pages/Catalogue";
import TutorPortal from "./pages/TutorPortal";
import Training from "./pages/Training";
import AssessmentFlow from "./pages/AssessmentFlow";
import AssessmentResults from "./pages/AssessmentResults";
import AssessmentDashboard from "./pages/AssessmentDashboard";
import TutorProfile from "./pages/TutorProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/catalogue" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/catalogue" element={<Catalogue />} />
            <Route path="/tutor/:tutorId" element={<TutorProfile />} />
            <Route path="/tutor" element={<TutorPortal />} />
            <Route path="/training" element={<Training />} />
            <Route path="/assessment" element={<AssessmentFlow />} />
            <Route path="/assessment/results" element={<AssessmentResults />} />
            <Route path="/assessment/dashboard" element={<AssessmentDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
