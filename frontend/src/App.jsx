import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import { ToastProvider } from "./components/ui/toaster-custom";

// Error Boundary to catch and display React crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      const errorStack = `${this.state.error?.toString()}\n\n${this.state.errorInfo?.componentStack || ''}`;

      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '800px',
            width: '100%',
            background: 'white',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                ✓
              </div>
              <h1 style={{
                fontSize: '32px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0
              }}>
                YesBill
              </h1>
            </div>

            {/* Error Title */}
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#DC2626',
              marginBottom: '16px'
            }}>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#6B7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              We're sorry for the inconvenience. An unexpected error has occurred. Please try reloading the page or contact support if the problem persists.
            </p>

            {/* Error Code Block */}
            <div style={{ position: 'relative', marginBottom: '24px' }}>
              <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#1F2937',
                background: '#F3F4F6',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '13px',
                lineHeight: '1.5',
                maxHeight: '300px',
                overflow: 'auto',
                border: '2px solid #E5E7EB'
              }}>
                {errorStack}
              </pre>

              {/* Copy Button */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(errorStack);
                  alert('Error details copied to clipboard!');
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  padding: '8px 16px',
                  background: 'white',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6B7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#F9FAFB';
                  e.target.style.borderColor = '#667eea';
                  e.target.style.color = '#667eea';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.color = '#6B7280';
                }}
              >
                📋 Copy
              </button>
            </div>

            {/* Reload Button */}
            <button
              onClick={() => window.location.reload()}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }}
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangeEmailPage from "./pages/ChangeEmailPage";
import AuthCallback from "./pages/AuthCallback";
import SupabaseTest from "./pages/SupabaseTest";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import ServicesPage from "./pages/ServicesPage";
import AddService from "./pages/AddService";
import CalendarView from "./pages/CalendarView";
import ServiceCalendarPage from "./pages/ServiceCalendarPage";
import Bills from "./pages/Bills";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import ChatPage from "./pages/ChatPage";
import OnboardingPage from "./pages/OnboardingPage";

import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import Testimonials from "./pages/Testimonials";
import Roadmap from "./pages/Roadmap";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter basename="/YesBill">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/change-email" element={<ChangeEmailPage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/test-supabase" element={<SupabaseTest />} />

            {/* App Routes */}
            <Route path="/setup" element={<OnboardingPage />} />
            <Route path="/create-project" element={<CreateProject />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/add-service" element={<AddService />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/services/:serviceId/calendar" element={<ServiceCalendarPage />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/analytics/:tab" element={<Analytics />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />

            {/* Public Pages */}
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/testimonials" element={<Testimonials />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/about" element={<About />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/security" element={<Security />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;