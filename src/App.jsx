import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Calendar from './pages/Calendar';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Holidays from './pages/Holidays';
import HalloweenHub from './pages/HalloweenHub';
import ChristmasHub from './pages/ChristmasHub';
import Saved from './pages/Saved';
import Profile from './pages/Profile';
import Donate from './pages/Donate';
import Moderation from './pages/Moderation';
import OrganizerDashboard from './pages/OrganizerDashboard';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="font-heading font-bold text-primary text-sm">Loading Local Vibes...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/create-event" element={<CreateEvent />} />
      <Route path="/holidays" element={<Holidays />} />
      <Route path="/holidays/halloween" element={<HalloweenHub />} />
      <Route path="/holidays/christmas" element={<ChristmasHub />} />
      <Route path="/saved" element={<Saved />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/donate" element={<Donate />} />
      <Route path="/moderation" element={<Moderation />} />
      <Route path="/organizer" element={<OrganizerDashboard />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App