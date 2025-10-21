import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import BillingDashboard from "./pages/BillingDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import CareerPath from "./pages/CareerPath";
import ResumeAnalysis from "./pages/ResumeAnalysis";
import AIInterviewer from "./pages/AIInterviewer";
import JobBoard from "./pages/JobBoard";
import LearningResources from "./pages/LearningResources";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route 
              path="/billing" 
              element={
                <ProtectedRoute>
                  <BillingDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/student/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/profile" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/career-path" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <CareerPath />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/resume-analysis" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <ResumeAnalysis />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/ai-interview" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <AIInterviewer />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/jobs"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <JobBoard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/learning" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <LearningResources />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employer/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['employer']}>
                  <EmployerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
