import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { ImpersonationProvider } from '@/lib/ImpersonationContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: '#ffebee', minHeight: '100vh' }}>
          <h2>Something went wrong in the UI.</h2>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

// Page imports
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases.jsx';
import Clients from './pages/Clients.jsx';
import CalendarPage from './pages/CalendarPage';
import Invoices from './pages/Invoices';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import Team from './pages/Team';

import Settings from './pages/Settings';
import ClientPortal from './pages/ClientPortal';
import CaseDetail from './pages/CaseDetail';
import StaffDashboard from './pages/StaffDashboard';
import IntakeForm from './pages/IntakeForm';
import Leads from './pages/Leads';
import BillingDashboard from './pages/BillingDashboard';
import CasePipelinePage from './pages/CasePipelinePage';
import LegalResearch from './pages/LegalResearch';
import AuditLog from './pages/AuditLog';
import LeaveManagement from './pages/LeaveManagement';
import PerformanceDashboard from './pages/PerformanceDashboard';
import CaseOutcomes from './pages/CaseOutcomes';
import ConflictChecker from './pages/ConflictChecker';
import EmailInbox from './pages/EmailInbox';
import ReportsDashboard from './pages/ReportsDashboard';
import DataExport from './pages/DataExport';
import WhatsAppMessenger from './pages/WhatsAppMessenger';
import HRDashboard from './pages/HRDashboard';
import FirmSetup from './pages/SuperAdminDashboard';

// Layout
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

import { getSubdomainAndBase } from '@/lib/domainUtils';
import MarketingLayout from './components/layout/MarketingLayout';
import Home from './pages/marketing/Home';
import Features from './pages/marketing/Features';
import Pricing from './pages/marketing/Pricing';
import About from './pages/marketing/About';
import Contact from './pages/marketing/Contact';
import OnboardingWizard from './pages/OnboardingWizard';
import PlatformAdminDashboard from './pages/PlatformAdminDashboard';

function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authStep } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Loading LexAfrica...</p>
          <p className="text-xs text-slate-400 font-mono">{authStep}</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }
  
  return <Outlet />;
}

function App() {
  const { currentSubdomain } = getSubdomainAndBase();
  const isBaseDomain = currentSubdomain === null;

  return (
    <AuthProvider>
      <ThemeProvider>
        <ImpersonationProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ErrorBoundary>
                {isBaseDomain ? (
                  /* Storefront Routes for the Base Domain */
                  <Routes>
                    <Route element={<MarketingLayout><Outlet /></MarketingLayout>}>
                      <Route path="/" element={<Home />} />
                      <Route path="/features" element={<Features />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="*" element={<PageNotFound />} />
                  </Routes>
                ) : (
                  /* Law Firm Software Routes for Subdomains */
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<SignUp />} />
                    
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AppLayout />}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/cases" element={<Cases />} />
                        <Route path="/clients" element={<Clients />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/documents" element={<Documents />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/client-portal" element={<ClientPortal />} />
                        <Route path="/cases/:id" element={<CaseDetail />} />
                        <Route path="/my-dashboard" element={<StaffDashboard />} />
                        <Route path="/leads" element={<Leads />} />
                        <Route path="/billing" element={<BillingDashboard />} />
                        <Route path="/pipeline" element={<CasePipelinePage />} />
                        <Route path="/research" element={<LegalResearch />} />
                        <Route path="/audit" element={<AuditLog />} />
                        <Route path="/leave" element={<LeaveManagement />} />
                        <Route path="/performance" element={<PerformanceDashboard />} />
                        <Route path="/outcomes" element={<CaseOutcomes />} />
                        <Route path="/conflict-check" element={<ConflictChecker />} />
                        <Route path="/email-inbox" element={<EmailInbox />} />
                        <Route path="/reports" element={<ReportsDashboard />} />
                        <Route path="/export" element={<DataExport />} />
                        <Route path="/whatsapp" element={<WhatsAppMessenger />} />
                        <Route path="/hr" element={<HRDashboard />} />
                        <Route path="/firm-setup" element={<FirmSetup />} />
                        <Route path="/admin" element={<PlatformAdminDashboard />} />
                      </Route>
                      <Route path="/intake" element={<IntakeForm />} />
                      <Route path="/onboarding" element={<OnboardingWizard />} />
                      <Route path="*" element={<PageNotFound />} />
                    </Route>
                  </Routes>
                )}
              </ErrorBoundary>
            </Router>
            <Toaster />
          </QueryClientProvider>
        </ImpersonationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;