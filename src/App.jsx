import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { CityProvider } from '@/lib/CityContext';
import { ThemeProvider } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';

import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const CreateEvent = lazy(() => import('./pages/CreateEvent'));
const Holidays = lazy(() => import('./pages/Holidays'));
const HalloweenHub = lazy(() => import('./pages/HalloweenHub'));
const ChristmasHub = lazy(() => import('./pages/ChristmasHub'));
const Saved = lazy(() => import('./pages/Saved'));
const Profile = lazy(() => import('./pages/Profile'));
const Donate = lazy(() => import('./pages/Donate'));
const Moderation = lazy(() => import('./pages/Moderation'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
const SponsorDirectory = lazy(() => import('./pages/SponsorDirectory'));
const EventReviewsPage = lazy(() => import('./pages/EventReviewsPage'));
const BecomeASponsor = lazy(() => import('./pages/BecomeASponsor'));
const SwitchCity = lazy(() => import('./pages/SwitchCity'));
const NeighborhoodGuide = lazy(() => import('./pages/NeighborhoodGuide'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="font-heading font-bold text-primary text-sm">Loading City Vibes...</p>
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
    <Suspense fallback={
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
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
          <Route path="/sponsor-directory" element={<SponsorDirectory />} />
          <Route path="/event-reviews" element={<EventReviewsPage />} />
          <Route path="/become-a-sponsor" element={<BecomeASponsor />} />
          <Route path="/switch-city" element={<SwitchCity />} />
          <Route path="/neighborhoods" element={<NeighborhoodGuide />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
    </Suspense>
  );
};

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CityProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </CityProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App