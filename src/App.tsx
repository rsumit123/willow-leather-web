import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Layout } from './components/common/Layout';
import { DevToastProvider } from './components/common/DevToast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/Login';
import { HomePage } from './pages/Home';
import { NewCareerPage } from './pages/NewCareer';
import { AuctionPage } from './pages/Auction';
import { DashboardPage } from './pages/Dashboard';
import { SquadPage } from './pages/Squad';
import { StandingsPage } from './pages/Standings';
import { FixturesPage } from './pages/Fixtures';
import { MatchPage } from './pages/Match';
import { PlayingXIPage } from './pages/PlayingXI';
import { LeaderboardsPage } from './pages/Leaderboards';
import { TransferWindowPage } from './pages/TransferWindow';
import { CalendarPage } from './pages/Calendar';
import { InboxPage } from './pages/Inbox';
import { TrainingPage } from './pages/Training';
import { ProgressionPage } from './pages/Progression';
import { ManagerStatsPage } from './pages/ManagerStats';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_OAUTH2_CLIENT_ID || '';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <DevToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/new-career" element={<NewCareerPage />} />
                <Route path="/auction" element={<AuctionPage />} />

                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/squad" element={<SquadPage />} />
                  <Route path="/standings" element={<StandingsPage />} />
                  <Route path="/fixtures" element={<FixturesPage />} />
                  <Route path="/match/:fixtureId" element={<MatchPage />} />
                  <Route path="/playing-xi" element={<PlayingXIPage />} />
                  <Route path="/leaderboards" element={<LeaderboardsPage />} />
                  <Route path="/transfer-window" element={<TransferWindowPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/inbox" element={<InboxPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/progression" element={<ProgressionPage />} />
                  <Route path="/manager-stats" element={<ManagerStatsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DevToastProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
