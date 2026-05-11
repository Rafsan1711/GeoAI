import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageLoader } from './components/ui/PageLoader';

// Lazy load all pages for better performance
const Landing = React.lazy(() => import('./pages/Landing'));
const Game = React.lazy(() => import('./pages/Game'));
const Docs = React.lazy(() => import('./pages/Docs'));
const Roadmap = React.lazy(() => import('./pages/Roadmap'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Lazy load admin pages
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminAccuracy = React.lazy(() => import('./pages/admin/AdminAccuracy'));
const AdminAtlasMind = React.lazy(() => import('./pages/admin/AdminAtlasMind'));
const AdminPlaces = React.lazy(() => import('./pages/admin/AdminPlaces'));

// Global Key Bindings Component
function GlobalKeydownHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.key === 'g' || e.key === 'G') {
        navigate('/game');
      }
      if (e.key === 'h' || e.key === 'H') {
        navigate('/');
      }
      if (e.key === '?') {
        setShowHelp(prev => !prev);
      }
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, showHelp]);

  if (!showHelp) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-bg-base/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Keyboard Shortcuts</h2>
          <button onClick={() => setShowHelp(false)} className="text-text-muted hover:text-text-primary">
            Esc
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span className="text-text-secondary">Go to Home</span>
            <kbd className="bg-bg-elevated text-text-primary px-2 py-1 rounded border border-border-subtle font-mono text-xs">H</kbd>
          </div>
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span className="text-text-secondary">Go to Game</span>
            <kbd className="bg-bg-elevated text-text-primary px-2 py-1 rounded border border-border-subtle font-mono text-xs">G</kbd>
          </div>
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span className="text-text-secondary">Answer 1-5 (in game)</span>
            <kbd className="bg-bg-elevated text-text-primary px-2 py-1 rounded border border-border-subtle font-mono text-xs">1 - 5</kbd>
          </div>
          <div className="flex justify-between border-b border-border-subtle pb-2">
            <span className="text-text-secondary">Toggle this menu</span>
            <kbd className="bg-bg-elevated text-text-primary px-2 py-1 rounded border border-border-subtle font-mono text-xs">?</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalKeydownHandler />
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0F1623',
              color: '#EDF2F7',
              border: '1px solid #1E2D40',
              borderRadius: '12px',
            },
            success: { iconTheme: { primary: '#00E5A0', secondary: '#0F1623' } },
            error: { iconTheme: { primary: '#FF4757', secondary: '#0F1623' } },
          }} 
        />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/game" element={<Game />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/roadmap" element={<Roadmap />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="accuracy" element={<AdminAccuracy />} />
              <Route path="atlasmind" element={<AdminAtlasMind />} />
              <Route path="places" element={<AdminPlaces />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
